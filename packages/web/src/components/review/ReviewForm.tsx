'use client';

import { useState } from 'react';
import { useAccount, useChainId, usePublicClient, useWriteContract } from 'wagmi';
import { computeContentHash, reviewRegistryAbi, ARBITRUM_SEPOLIA_CHAIN_ID } from '@vr/shared';
import { registryAddress, isChainConfigured } from '@/lib/contracts';
import { ingestReview } from '@/lib/api';
import { reviewErrorMessage } from '@/lib/reviewErrors';
import { txUrl, shortHex } from '@/lib/explorer';
import { usePrivy } from '@privy-io/react-auth';
import { Button } from '@/components/ui/Button';
import { StarPicker } from './StarPicker';
import { isPrivyEnabled } from '@/lib/wagmi.privy';

type Phase = 'idle' | 'busy' | 'done' | 'error';

/**
 * Customer review form. Computes the canonical content hash (shared with the API
 * so its hash-mismatch check agrees), submits it on-chain via the connected
 * wallet, then ingests the text once the tx confirms. Gasless when a Privy
 * paymaster is configured; otherwise the wallet pays.
 */
export function ReviewForm({ businessId }: { businessId: number }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const wrongChain = isConnected && chainId !== ARBITRUM_SEPOLIA_CHAIN_ID;
  const canSubmit =
    isConnected && !wrongChain && isChainConfigured && rating >= 1 && text.trim().length > 0;

  async function submit() {
    if (!address) return;
    setError('');
    setPhase('busy');
    try {
      const nonce = crypto.randomUUID();
      const trimmed = text.trim();
      const contentHash = computeContentHash({
        businessId,
        reviewer: address,
        rating,
        text: trimmed,
        nonce,
      });

      setStep('Confirm in your wallet…');
      const hash = await writeContractAsync({
        address: registryAddress(),
        abi: reviewRegistryAbi,
        functionName: 'submit',
        args: [BigInt(businessId), contentHash, rating],
      });
      setTxHash(hash);

      setStep('Recording on-chain…');
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });

      setStep('Saving your review…');
      await ingestReview({
        businessId,
        reviewer: address,
        rating,
        text: trimmed,
        nonce,
        contentHash,
        txHash: hash,
      });

      setPhase('done');
    } catch (err) {
      setError(reviewErrorMessage(err));
      setPhase('error');
    }
  }

  if (!isChainConfigured) {
    return (
      <Notice>
        Reviews aren&apos;t available right now — the contract address isn&apos;t configured.
      </Notice>
    );
  }
  if (!isConnected) {
    return isPrivyEnabled ? (
      <PrivyLoginPrompt />
    ) : (
      <Notice>Connect your wallet (top right) to write a verified review.</Notice>
    );
  }
  if (wrongChain) {
    return <Notice>Switch your wallet to Arbitrum Sepolia to submit a review.</Notice>;
  }
  if (phase === 'done') {
    return (
      <div className="border-2 border-dashed border-accent rounded p-6 flex flex-col gap-2">
        <p className="font-display font-semibold text-ink">Review submitted ✓</p>
        <p className="text-sm text-muted leading-relaxed">
          It&apos;s on-chain now and will appear on this page once the indexer confirms it (usually
          a minute or two).
        </p>
        {txHash && (
          <a
            href={txUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:text-accent-light w-fit"
          >
            View transaction {shortHex(txHash, 8, 6)} ↗
          </a>
        )}
      </div>
    );
  }

  const busy = phase === 'busy';
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Your rating</span>
        <StarPicker value={rating} onChange={setRating} disabled={busy} />
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Your review</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          rows={5}
          maxLength={5000}
          placeholder="What was your visit like?"
          className="bg-paper border border-border rounded px-3.5 py-2.5 text-sm text-ink placeholder:text-muted resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        />
      </label>

      {phase === 'error' && (
        <p role="alert" className="text-sm text-accent bg-accent-muted rounded p-3">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <Button onClick={submit} disabled={!canSubmit || busy} loading={busy}>
          {busy ? step || 'Submitting…' : 'Submit verified review'}
        </Button>
        {busy && <span className="text-xs text-muted">{step}</span>}
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-border rounded p-5 text-sm text-muted leading-relaxed">
      {children}
    </div>
  );
}

/** Only rendered when isPrivyEnabled — safe to call usePrivy here. */
function PrivyLoginPrompt() {
  const { login } = usePrivy();
  return (
    <Notice>
      <button
        onClick={login}
        className="text-accent underline underline-offset-2 hover:text-accent-light transition-colors"
      >
        Sign in with Google or email
      </button>{' '}
      to write a verified review — no crypto wallet needed.
    </Notice>
  );
}
