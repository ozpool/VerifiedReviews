/**
 * Privy-aware wagmi config for the embedded-wallet path.
 *
 * Why a second config file: Privy injects its own embedded-wallet connector and
 * must build the wagmi config through `@privy-io/wagmi`'s `createConfig` (not the
 * bare one in `wagmi.ts`). We keep the plain config untouched so that when no
 * Privy app id is set the app falls back to the original wagmi + RainbowKit path
 * and still builds without a Privy account — same "degrade gracefully on missing
 * env" rule the WalletConnect setup already follows.
 */
import { http } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';

/** Privy app id. When unset, the embedded-wallet path is disabled (see isPrivyEnabled). */
export const PRIVY_APP_ID = process.env['NEXT_PUBLIC_PRIVY_APP_ID'] ?? '';

/** True only when a Privy app id is configured. Gates the whole embedded flow. */
export const isPrivyEnabled = PRIVY_APP_ID.length > 0;

/**
 * The wagmi config Privy drives. No `connectors` array: Privy adds the embedded
 * connector itself, and its login modal also covers external wallets, so we don't
 * register injected/walletConnect here (that would double up the connect UI).
 */
export const privyWagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  // Turn OFF injected-provider discovery. By default wagmi v2 auto-detects browser
  // extensions (MetaMask via EIP-6963) and silently reconnects the last one, which
  // would route the review submit through MetaMask and trigger its unsuppressable
  // popup. With discovery off, the embedded Privy wallet is the only connector —
  // so signing stays silent. (The login modal offers no external wallet anyway.)
  multiInjectedProviderDiscovery: false,
  transports: {
    [arbitrumSepolia.id]: http(process.env['NEXT_PUBLIC_RPC_URL'] ?? undefined),
  },
});
