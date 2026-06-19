import { createPublicClient, createWalletClient, http, type Hex, type PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { visitProofSbtAbi } from '@vr/shared';
import { loadConfig } from '../config';

/** Authorizes a business's minter on-chain. Small surface so tests inject a fake
 * instead of sending a real admin tx. */
export interface MinterRegistrar {
  register(businessId: number, minterAddr: string): Promise<void>;
}

/**
 * Real registrar: as the SBT admin, call `setBusinessMinter` so the business's
 * HD-derived minter can actually mint. Without this step every `mint()` reverts
 * with NotBusinessMinter, so approval must not "succeed" unless this lands.
 */
export function createMinterRegistrar(): MinterRegistrar {
  const { RPC_URL, SBT_ADDRESS, ADMIN_PRIVATE_KEY } = loadConfig();
  if (!RPC_URL || !SBT_ADDRESS || !ADMIN_PRIVATE_KEY) {
    throw new Error('RPC_URL, SBT_ADDRESS, and ADMIN_PRIVATE_KEY are required to register a minter');
  }
  const transport = http(RPC_URL);
  const publicClient: PublicClient = createPublicClient({ chain: arbitrumSepolia, transport });
  const account = privateKeyToAccount(ADMIN_PRIVATE_KEY as Hex);
  const wallet = createWalletClient({ account, chain: arbitrumSepolia, transport });
  const sbt = SBT_ADDRESS as Hex;

  return {
    async register(businessId, minterAddr) {
      const { request } = await publicClient.simulateContract({
        account,
        address: sbt,
        abi: visitProofSbtAbi,
        functionName: 'setBusinessMinter',
        args: [BigInt(businessId), minterAddr as Hex],
      });
      const hash = await wallet.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') {
        throw new Error(`setBusinessMinter reverted on-chain: ${hash}`);
      }
    },
  };
}

let instance: MinterRegistrar | null = null;

/** Memoized real registrar, built lazily so config is only needed at approval. */
export function getMinterRegistrar(): MinterRegistrar {
  if (!instance) instance = createMinterRegistrar();
  return instance;
}

/** Swap the registrar (tests inject a fake; pass null to reset). */
export function setMinterRegistrar(registrar: MinterRegistrar | null): void {
  instance = registrar;
}
