import { ApiHealth } from '@/components/ui/ApiHealth';

/** Shared footer. The hairline rule above it echoes the receipt-divider motif. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-22">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted">
        <span>VerifiedReviews · receipt-gated reviews on Arbitrum Sepolia</span>
        <ApiHealth />
      </div>
    </footer>
  );
}
