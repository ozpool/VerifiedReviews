'use client';

import { useState } from 'react';
import { flagReview } from '@/lib/api';

/**
 * Small "Report" affordance on a review. Flagging is a moderation signal only —
 * it never touches the review's on-chain record; an admin reviews the queue.
 */
export function FlagButton({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    try {
      await flagReview(reviewId, reason.trim());
      setState('done');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return <span className="text-xs text-muted">Reported — thanks.</span>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted hover:text-accent transition-colors"
      >
        Report
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 mt-1">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why is this review spam or abuse?"
        aria-label="Reason for reporting"
        minLength={3}
        maxLength={500}
        required
        className="w-full bg-paper border border-border rounded px-3 py-1.5 text-xs text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="text-xs font-medium text-accent hover:text-accent-light disabled:opacity-60"
        >
          {state === 'sending' ? 'Sending…' : 'Submit report'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted hover:text-ink transition-colors"
        >
          Cancel
        </button>
        {state === 'error' && <span className="text-xs text-accent">Couldn&apos;t report.</span>}
      </div>
    </form>
  );
}
