'use client';

import { WalletQr } from '@/components/customer/WalletQr';

/** Shown when the customer is signed in but has no visit receipt yet. The whole
 * point of the redesign: instead of a surprise wallet popup at submit, we tell
 * them up front to get a receipt, and show the exact QR staff need to scan. */
export function NeedsVisitProof() {
  return (
    <div className="flex flex-col gap-5">
      <Card title="One quick step first">
        To leave a verified review you need a visit receipt from this business. Show the code below
        to staff at checkout — they scan it once, and then you can review any time within 60 days.
        You don&apos;t need to do anything else.
      </Card>
      <WalletQr />
    </div>
  );
}

/** Had a visit, but it aged out of the 60-day window. */
export function VisitTooOld() {
  return (
    <Card title="Your visit has expired">
      Verified reviews must be written within 60 days of your visit, and yours is now older than
      that. Pop back in — staff can issue a fresh visit receipt and you&apos;ll be able to review
      again.
    </Card>
  );
}

/** This visit's receipt was already used for a review (one review per visit). */
export function AlreadyReviewed() {
  return (
    <Card title="You've already reviewed this visit">
      Thanks — each visit receipt can back one verified review, and this one&apos;s been used. Your
      next visit unlocks another review.
    </Card>
  );
}

/** Compact "you're good to go" header rendered above the form when eligible. */
export function VerifiedBanner() {
  return (
    <div className="flex items-center gap-2 text-sm text-accent bg-accent-muted rounded px-3.5 py-2.5">
      <span aria-hidden="true">✓</span>
      <span className="font-medium text-ink">Your visit is verified</span>
      <span className="text-muted">— write your review below.</span>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded p-5 flex flex-col gap-2">
      <p className="font-display font-semibold text-ink">{title}</p>
      <p className="text-sm text-muted leading-relaxed">{children}</p>
    </div>
  );
}
