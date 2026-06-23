import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { reviewRegistryAbi } from '@vr/shared';
import { registryAddress } from './contracts';
import type { ReviewSubmitter, ReviewSubmitArgs } from './reviewSubmit';

/**
 * Fallback signing path (no Privy app id): submit through whatever wallet wagmi
 * has connected (RainbowKit / MetaMask). External wallets show their own confirm
 * UI — unavoidable here, which is exactly why the embedded path exists.
 */
export function useWagmiReviewSubmit(): ReviewSubmitter {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  return {
    signerAddress: address,
    ready: Boolean(address),
    async submit({ businessId, contentHash, rating }: ReviewSubmitArgs) {
      const hash = await writeContractAsync({
        address: registryAddress(),
        abi: reviewRegistryAbi,
        functionName: 'submit',
        args: [BigInt(businessId), contentHash, rating],
      });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
  };
}
