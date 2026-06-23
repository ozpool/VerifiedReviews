import { isPrivyEnabled } from './wagmi.privy';
import { usePrivyReviewSubmit } from './reviewSubmit.privy';
import { useWagmiReviewSubmit } from './reviewSubmit.wagmi';

/** What the review form needs from whichever wallet path is active. */
export interface ReviewSubmitArgs {
  businessId: number;
  contentHash: `0x${string}`;
  rating: number;
}

export interface ReviewSubmitter {
  /** The address that will sign — also the reviewer recorded on-chain. */
  signerAddress: `0x${string}` | undefined;
  /** True once a wallet is ready to sign. */
  ready: boolean;
  /** Send ReviewRegistry.submit and wait for the receipt. Returns the tx hash. */
  submit: (args: ReviewSubmitArgs) => Promise<`0x${string}`>;
}

/**
 * Pick the signing path ONCE at module load from the build-time Privy flag, so
 * the same hook runs on every render (rules-of-hooks safe). Privy users sign
 * silently via the embedded wallet; the non-Privy fallback uses wagmi/RainbowKit.
 */
export const useReviewSubmit: () => ReviewSubmitter = isPrivyEnabled
  ? usePrivyReviewSubmit
  : useWagmiReviewSubmit;
