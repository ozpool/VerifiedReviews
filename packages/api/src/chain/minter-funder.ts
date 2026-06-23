import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  type Hex,
  type PublicClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { loadConfig } from '../config';

export interface FundResult {
  /** True when nothing was sent (funder off, or the minter was already funded). */
  skipped: boolean;
  reason?: string;
  txHash?: string;
}

/** Keeps a business's minter topped up with gas so it can mint receipts. The
 * source of funds is the admin/treasury wallet. Small surface so tests inject a
 * fake instead of sending real txs. */
export interface MinterFunder {
  fund(minterAddr: string): Promise<FundResult>;
}

/** No-op funder used when the treasury isn't configured (e.g. tests): minters
 * must then be funded by hand. */
const noopFunder: MinterFunder = {
  async fund() {
    return { skipped: true, reason: 'minter funding not configured' };
  },
};

/**
 * Build the real funder. `fund` tops a minter up to a working balance only when
 * it has dipped below the threshold, so it's safe to call on every approval (B)
 * and on every refill sweep (C) — already-funded minters are skipped. We wait for
 * the receipt so "funded" means the gas is actually there before staff mint.
 */
export function createMinterFunder(): MinterFunder {
  const { RPC_URL, ADMIN_PRIVATE_KEY, MINTER_FUND_AMOUNT_ETH, MINTER_MIN_BALANCE_ETH } =
    loadConfig();
  if (!RPC_URL || !ADMIN_PRIVATE_KEY) return noopFunder;

  const transport = http(RPC_URL);
  const publicClient: PublicClient = createPublicClient({ chain: arbitrumSepolia, transport });
  const account = privateKeyToAccount(ADMIN_PRIVATE_KEY as Hex);
  const wallet = createWalletClient({ account, chain: arbitrumSepolia, transport });
  const amount = parseEther(MINTER_FUND_AMOUNT_ETH);
  const minBalance = parseEther(MINTER_MIN_BALANCE_ETH);

  return {
    async fund(minterAddr) {
      const balance = await publicClient.getBalance({ address: minterAddr as Hex });
      if (balance >= minBalance) return { skipped: true, reason: 'minter already funded' };
      const txHash = await wallet.sendTransaction({ to: minterAddr as Hex, value: amount });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (receipt.status !== 'success') throw new Error(`minter funding reverted: ${txHash}`);
      return { skipped: false, txHash };
    },
  };
}

let instance: MinterFunder | null = null;

/** Memoized real funder, built lazily so config is only required when funding. */
export function getMinterFunder(): MinterFunder {
  if (!instance) instance = createMinterFunder();
  return instance;
}

/** Swap the funder (tests inject a fake; pass null to reset). */
export function setMinterFunder(funder: MinterFunder | null): void {
  instance = funder;
}
