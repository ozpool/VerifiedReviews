import Link from 'next/link';
import { ApiHealth } from '@/components/ui/ApiHealth';

/** Shared footer. Staff and business portal links live here — out of the customer's way. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-22">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted">
        <span>VerifiedReviews · receipt-gated reviews on Arbitrum Sepolia</span>
        <div className="flex items-center gap-6">
          <Link href="/biz" className="hover:text-ink transition-colors font-medium">
            For businesses →
          </Link>
          <Link href="/scan" className="hover:text-ink transition-colors">
            Staff login
          </Link>
          <ApiHealth />
        </div>
      </div>
    </footer>
  );
}
