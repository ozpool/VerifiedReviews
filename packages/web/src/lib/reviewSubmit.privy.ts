import { useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http, type PublicClient } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { reviewRegistryAbi, ARBITRUM_SEPOLIA_CHAIN_ID } from '@vr/shared';
import { registryAddress } from './contracts';
import type { ReviewSubmitter, ReviewSubmitArgs } from './reviewSubmit';

const RPC_URL = process.env['NEXT_PUBLIC_RPC_URL'] ?? undefined;

/**
 * Silent signing path: send the review straight through the Privy EMBEDDED wallet,
 * never through whatever connector wagmi happens to have active. We grab the
 * embedded wallet (`walletClientType === 'privy'`), take its EIP-1193 provider,
 * and drive viem with it. Because the provider is configured with
 * `showWalletUIs: false`, the transaction is signed and sent with no popup. This
 * is the belt-and-suspenders that makes "no wallet UI" hold even if an external
 * wallet sneaks into the page.
 */
export function usePrivyReviewSubmit(): ReviewSubmitter {
  const { wallets } = useWallets();
  const embedded = wallets.find((w) => w.walletClientType === 'privy');
  const signerAddress = embedded?.address as `0x${string}` | undefined;

  return {
    signerAddress,
    ready: Boolean(embedded),
    async submit({ businessId, contentHash, rating }: ReviewSubmitArgs) {
      if (!embedded || !signerAddress) throw new Error('Your wallet is still getting ready.');

      // Make sure the embedded wallet is on Arbitrum Sepolia before signing.
      await embedded.switchChain(ARBITRUM_SEPOLIA_CHAIN_ID);
      const provider = await embedded.getEthereumProvider();

      const walletClient = createWalletClient({
        account: signerAddress,
        chain: arbitrumSepolia,
        transport: custom(provider),
      });
      const publicClient: PublicClient = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(RPC_URL),
      });

      const hash = await walletClient.writeContract({
        address: registryAddress(),
        abi: reviewRegistryAbi,
        functionName: 'submit',
        args: [BigInt(businessId), contentHash, rating],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
  };
}
