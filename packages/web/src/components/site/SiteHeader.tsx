import Link from 'next/link';
import { WalletStatus } from '@/components/ui/WalletStatus';

/**
 * Shared top bar. The wordmark uses the display serif; the accent on "Reviews"
 * carries the receipt-stamp colour through every page.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-border bg-paper/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-ink shrink-0"
        >
          Verified<span className="text-accent">Reviews</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-7 text-sm text-muted">
          <Link href="/businesses" className="hover:text-ink transition-colors">
            Browse
          </Link>
          <Link href="/#how" className="hover:text-ink transition-colors">
            How it works
          </Link>
        </nav>
        <WalletStatus />
      </div>
    </header>
  );
}
