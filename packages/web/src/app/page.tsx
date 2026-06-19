/**
 * Landing page — server component.
 *
 * Demonstrates the foundation: editorial-trust aesthetic, working wallet
 * connect, and live API health check. No data fetching here yet — the wallet
 * status and health indicator are client components that fetch their own data.
 * Business/review listing comes in PR #11.
 */
import { WalletStatus } from '@/components/ui/WalletStatus';
import { ApiHealth } from '@/components/ui/ApiHealth';
import { Card } from '@/components/ui/Card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            Verified<span className="text-accent">Reviews</span>
          </span>
          <WalletStatus />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="py-22 flex flex-col gap-6 max-w-2xl">
          {/* Eyebrow label — receipt motif */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-accent" aria-hidden="true" />
            <span className="text-xs font-medium tracking-widest uppercase text-accent">
              Receipt-gated reviews
            </span>
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.08] text-ink">
            Reviews you can
            <br />
            actually trust.
          </h1>

          <p className="text-base text-muted leading-relaxed max-w-lg">
            Every review is backed by a soulbound visit proof — a non-transferable
            on-chain receipt minted at the point of sale. No receipt, no review.
          </p>

          {/* CTA row */}
          <div className="flex items-center gap-4 pt-2">
            {/* Placeholder CTAs — wired to routes in PR #11 */}
            <a
              href="#explore"
              className="inline-flex items-center gap-2 bg-accent text-paper px-7 py-3.5 rounded text-sm font-medium tracking-wide hover:bg-accent-light transition-colors"
            >
              Explore businesses
            </a>
            <a
              href="#learn"
              className="inline-flex items-center gap-2 text-ink border border-border px-7 py-3.5 rounded text-sm font-medium tracking-wide hover:bg-subtle transition-colors"
            >
              How it works
            </a>
          </div>
        </section>

        <hr className="border-border" />

        {/* Foundation demo grid */}
        <section id="explore" className="py-16 grid sm:grid-cols-2 gap-6">
          {/* Wallet panel */}
          <Card>
            <h2 className="font-display text-lg font-semibold mb-1">Wallet</h2>
            <p className="text-sm text-muted mb-4">
              Connect your wallet to submit reviews or mint visit receipts.
            </p>
            <WalletStatus />
          </Card>

          {/* API status panel */}
          <Card>
            <h2 className="font-display text-lg font-semibold mb-1">
              API status
            </h2>
            <p className="text-sm text-muted mb-4">
              Live check against the VerifiedReviews backend.
            </p>
            <ApiHealth />
          </Card>

          {/* Verified badge demo — stamp motif */}
          <Card stamp className="sm:col-span-2">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-sm bg-accent/10 flex items-center justify-center">
                {/* Checkmark stamp icon */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="w-5 h-5 text-accent"
                >
                  <path
                    d="M4 10.5l4.5 4.5 7.5-9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <p className="font-display font-semibold text-ink">
                  What &ldquo;verified&rdquo; means here
                </p>
                <p className="text-sm text-muted mt-1 leading-relaxed">
                  When staff scan a customer&apos;s wallet at checkout, a soulbound
                  token is minted on Arbitrum Sepolia — a cryptographic receipt
                  locked to that wallet forever. The review contract checks for
                  that token (held, not transferred) and rejects reviews older
                  than 60 days. Faking a review means faking a blockchain
                  transaction.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border mt-8">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted">
          <span>VerifiedReviews · Arbitrum Sepolia</span>
          <ApiHealth />
        </div>
      </footer>
    </div>
  );
}
