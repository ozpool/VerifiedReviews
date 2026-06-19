import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
  type PublicClient,
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { visitProofSbtAbi } from '@vr/shared';
import { loadConfig } from '../config';

export interface MintResult {
  tokenId: string;
  txHash: string;
}

/** The chain-write surface the mint route depends on. Small on purpose so tests
 * can inject a fake without touching a live RPC. */
export interface MintOrchestrator {
  mint(to: string, businessId: number): Promise<MintResult>;
}

/**
 * Build the real orchestrator. The signer is the business's HD-derived minter
 * account (addressIndex = businessId), re-derived per mint from the one master
 * mnemonic — no per-business key is ever stored. We `simulate` first to get the
 * returned tokenId and to surface a revert *before* broadcasting, then write and
 * wait for the receipt so a reverted inclusion is also caught.
 */
export function createMintOrchestrator(): MintOrchestrator {
  const { RPC_URL, SBT_ADDRESS, MINTER_MNEMONIC } = loadConfig();
  if (!RPC_URL || !SBT_ADDRESS || !MINTER_MNEMONIC) {
    throw new Error('RPC_URL, SBT_ADDRESS, and MINTER_MNEMONIC are required to mint');
  }
  const transport = http(RPC_URL);
  const publicClient: PublicClient = createPublicClient({ chain: arbitrumSepolia, transport });
  const sbt = SBT_ADDRESS as Hex;

  return {
    async mint(to, businessId) {
      const account = mnemonicToAccount(MINTER_MNEMONIC, { addressIndex: businessId });
      const { result: tokenId, request } = await publicClient.simulateContract({
        account,
        address: sbt,
        abi: visitProofSbtAbi,
        functionName: 'mint',
        args: [to as Hex, BigInt(businessId)],
      });
      const walletClient = createWalletClient({ account, chain: arbitrumSepolia, transport });
      const txHash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') {
        throw new Error(`mint tx reverted on-chain: ${txHash}`);
      }
      return { tokenId: tokenId.toString(), txHash };
    },
  };
}

let instance: MintOrchestrator | null = null;

/** Memoized real orchestrator, built lazily so config is only required at mint
 * time. Tests override it via {@link setMintOrchestrator}. */
export function getMintOrchestrator(): MintOrchestrator {
  if (!instance) instance = createMintOrchestrator();
  return instance;
}

/** Swap the orchestrator (tests inject a fake; pass null to reset). */
export function setMintOrchestrator(orchestrator: MintOrchestrator | null): void {
  instance = orchestrator;
}
