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

export interface TopUpResult {
  /** True when no transfer was sent (tank off, or recipient already funded). */
  skipped: boolean;
  reason?: string;
  txHash?: string;
}

/** The chain-write surface the mint flow uses to fund a customer's gas. Small on
 * purpose so tests can inject a fake without touching a live RPC. */
export interface GasTank {
  topUp(to: string): Promise<TopUpResult>;
}

/** No-op tank used when GAS_TANK_PRIVATE_KEY isn't configured: the review flow
 * still works for customers who already hold testnet gas. */
const noopGasTank: GasTank = {
  async topUp() {
    return { skipped: true, reason: 'gas tank not configured' };
  },
};

/**
 * Build the real gas tank. It holds free Arbitrum Sepolia testnet ETH and sends a
 * tiny top-up to a customer so their embedded wallet can pay its own (free) gas
 * when submitting a review. We check the recipient's balance first and skip the
 * transfer when they're already funded, so repeat visitors don't drain the tank.
 * We don't wait for the receipt — funding is best-effort and must not slow the
 * mint the staff is waiting on.
 */
export function createGasTank(): GasTank {
  const { RPC_URL, GAS_TANK_PRIVATE_KEY, GAS_TANK_TOPUP_ETH, GAS_TANK_MIN_BALANCE_ETH } =
    loadConfig();
  if (!RPC_URL || !GAS_TANK_PRIVATE_KEY) return noopGasTank;

  const transport = http(RPC_URL);
  const publicClient: PublicClient = createPublicClient({ chain: arbitrumSepolia, transport });
  const account = privateKeyToAccount(GAS_TANK_PRIVATE_KEY as Hex);
  const walletClient = createWalletClient({ account, chain: arbitrumSepolia, transport });
  const topUpAmount = parseEther(GAS_TANK_TOPUP_ETH);
  const minBalance = parseEther(GAS_TANK_MIN_BALANCE_ETH);

  return {
    async topUp(to) {
      const balance = await publicClient.getBalance({ address: to as Hex });
      if (balance >= minBalance) return { skipped: true, reason: 'recipient already funded' };
      const txHash = await walletClient.sendTransaction({ to: to as Hex, value: topUpAmount });
      return { skipped: false, txHash };
    },
  };
}

let instance: GasTank | null = null;

/** Memoized real tank, built lazily so config is only required at mint time.
 * Tests override it via {@link setGasTank}. */
export function getGasTank(): GasTank {
  if (!instance) instance = createGasTank();
  return instance;
}

/** Swap the tank (tests inject a fake; pass null to reset). */
export function setGasTank(tank: GasTank | null): void {
  instance = tank;
}
