/**
 * Wagmi config for VerifiedReviews.
 *
 * Why this file: wagmi v2 requires a single config object created once at
 * module level and passed to WagmiProvider. Keeping it here lets us import it
 * in both the provider and any server component that needs chain metadata
 * without circular deps.
 */
import { http, createConfig } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect requires a project ID from https://cloud.walletconnect.com.
// We read it from env so the value is never hardcoded. If unset in dev the
// walletConnect connector is omitted — the injected (MetaMask / browser) one
// still works, so the app stays functional without a WC project ID.
const wcProjectId = process.env['NEXT_PUBLIC_WC_PROJECT_ID'];

const connectors = wcProjectId
  ? [injected(), walletConnect({ projectId: wcProjectId })]
  : [injected()];

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  connectors,
  transports: {
    // Use a custom RPC if provided, else fall back to the viem public endpoint.
    [arbitrumSepolia.id]: http(
      process.env['NEXT_PUBLIC_RPC_URL'] ?? undefined,
    ),
  },
  // SSR: true tells wagmi to serialize state for hydration — avoids the
  // "wallet flashes disconnected" bug on first paint.
  ssr: true,
});
