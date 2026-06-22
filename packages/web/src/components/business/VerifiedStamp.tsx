/**
 * The "verified" stamp chip — dashed accent border (receipt-stamp motif) with a
 * checkmark and the count of on-chain-verified reviews. The whole product hinges
 * on this number being real, so it gets a distinct, repeated visual signature.
 */
export function VerifiedStamp({ count, className = '' }: { count: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 border-dashed border-accent rounded-sm px-2 py-0.5 text-accent ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
        <path
          d="M4 10.5l4.5 4.5 7.5-9"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-xs font-medium tabular-nums tracking-wide">{count} verified</span>
    </span>
  );
}
