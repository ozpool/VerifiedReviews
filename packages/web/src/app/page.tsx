/**
 * Landing page — server component.
 *
 * Editorial-trust aesthetic: receipt-paper canvas, optical serif headlines, the
 * stamp motif for anything "verified". CTAs route into the live browse flow.
 */
import Link from 'next/link';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { Card } from '@/components/ui/Card';

const STEPS = [
  {
    n: '01',
    title: 'Pay & get a receipt',
    body: 'At checkout, staff scan your wallet. A soulbound token is minted on-chain — a receipt locked to you, forever.',
  },
  {
    n: '02',
    title: 'Write within 60 days',
    body: 'The review contract checks you hold a recent visit proof. No receipt, or one older than 60 days, and it reverts.',
  },
  {
    n: '03',
    title: 'Anyone can verify it',
    body: 'Every published review links to its on-chain transaction. The counts are computed from the chain, not from us.',
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <section className="py-22 flex flex-col gap-6 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-accent" aria-hidden="true" />
            <span className="text-xs font-medium tracking-widest uppercase text-accent">
              Receipt-gated reviews
            </span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-[1.05] text-ink">
            Reviews you can
            <br />
            actually trust.
          </h1>

          <p className="text-base text-muted leading-relaxed max-w-lg">
            Every review is backed by a soulbound visit proof — a non-transferable on-chain receipt
            minted at the point of sale. No receipt, no review. No fakes, no paid posts.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/businesses"
              className="inline-flex items-center gap-2 bg-accent text-paper px-7 py-3.5 rounded text-sm font-medium tracking-wide hover:bg-accent-light transition-colors"
            >
              Explore businesses
            </Link>
            <Link
              href="#how"
              className="inline-flex items-center gap-2 text-ink border border-border px-7 py-3.5 rounded text-sm font-medium tracking-wide hover:bg-subtle transition-colors"
            >
              How it works
            </Link>
          </div>

          <Link
            href="/wallet"
            className="text-sm text-muted hover:text-ink transition-colors w-fit"
          >
            At a checkout now? Show your visit code →
          </Link>
        </section>

        <hr className="border-border" />

        {/* How it works */}
        <section id="how" className="py-18 scroll-mt-20">
          <h2 className="font-display text-2xl font-semibold text-ink mb-8">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col gap-3">
                <span className="font-display text-3xl font-bold text-accent/30 tabular-nums">
                  {s.n}
                </span>
                <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What "verified" means — stamp callout */}
        <Card stamp className="mb-18">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-sm bg-accent/10 flex items-center justify-center">
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
              <p className="text-sm text-muted mt-1 leading-relaxed max-w-2xl">
                The review contract on Arbitrum Sepolia checks for a soulbound token — held, not
                transferred — and rejects reviews older than 60 days. Faking a review means faking a
                blockchain transaction, which you can&apos;t. That&apos;s the whole idea.
              </p>
            </div>
          </div>
        </Card>
      </main>

      <SiteFooter />
    </>
  );
}
