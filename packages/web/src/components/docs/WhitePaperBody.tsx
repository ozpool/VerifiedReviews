import Link from 'next/link';
import { SECTIONS } from './sections';

/**
 * The white-paper content. Pure static server-rendered markup, split into the eight
 * sections the outline declares. Each <section> carries the matching id (the
 * scroll-spy and the sidebar key off these) plus scroll-margin so a heading clears
 * the sticky site header when you jump to it.
 */

// Public, deployed Arbitrum Sepolia addresses — safe to print (they're already
// shipped to the browser via NEXT_PUBLIC_*).
const SBT_ADDRESS = '0x682735379eC9718234bB545A7a33c6428ec134e6';
const REGISTRY_ADDRESS = '0x9B5cAEfa84FD1E2eC1d23E2E0fdA8B9b9F5409aD';

function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-accent" aria-hidden="true" />
        <span className="text-xs font-medium uppercase tracking-widest text-accent">{eyebrow}</span>
      </div>
      <h2 className="font-display text-3xl font-bold leading-tight text-ink">{children}</h2>
    </div>
  );
}

function Pull({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-6 border-l-2 border-accent pl-5 font-display text-lg italic leading-relaxed text-ink">
      {children}
    </blockquote>
  );
}

export function WhitePaperBody() {
  return (
    <>
      {/* ---- Cover ---- */}
      <section id="cover" className="scroll-mt-24">
        <div className="rounded-lg border border-border bg-subtle/40 px-8 py-14 sm:px-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-sm border-2 border-dashed border-accent px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
            White Paper · v1.0
          </div>
          <h1 className="font-display text-4xl font-bold leading-[1.05] text-ink sm:text-6xl">
            Reviews you can
            <br />
            actually trust.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            How VerifiedReviews uses a non-transferable, point-of-sale receipt to make every
            published review provably real — and why the rule that enforces it lives in a smart
            contract, not a server.
          </p>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted">Network</dt>
              <dd className="font-medium text-ink">Arbitrum Sepolia</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted">Primitive</dt>
              <dd className="font-medium text-ink">Soulbound receipt (ERC-5192)</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-widest text-muted">Audience</dt>
              <dd className="font-medium text-ink">Shoppers, owners, builders</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ---- Table of Contents ---- */}
      <section id="contents" className="scroll-mt-24">
        <SectionTitle eyebrow="Start here">Table of Contents</SectionTitle>
        <ol className="flex flex-col divide-y divide-border border-y border-border">
          {SECTIONS.filter((s) => s.id !== 'cover' && s.id !== 'contents').map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="flex items-baseline gap-4 py-3 text-ink transition-colors hover:text-accent"
              >
                <span className="font-display text-sm tabular-nums text-accent/50">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-medium">{s.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- Executive Summary ---- */}
      <section id="summary" className="scroll-mt-24">
        <SectionTitle eyebrow="The short version">Executive Summary</SectionTitle>
        <div className="space-y-4 text-base leading-relaxed text-muted">
          <p>
            Online reviews are the closest thing commerce has to a reputation system — and they are
            wide open to fakes, paid posts, and review farms. The root problem is simple: nothing
            proves the reviewer ever actually visited.
          </p>
          <p>
            VerifiedReviews closes that gap with a <strong className="text-ink">receipt</strong>. At
            checkout, staff mint a <strong className="text-ink">soulbound token</strong> — a
            non-transferable proof of a real visit — straight to the customer&apos;s wallet. To post
            a review, the on-chain contract checks that the author still holds a receipt and that it
            is recent. No receipt, no review. You can&apos;t buy it, borrow it, or fake it.
          </p>
          <Pull>
            A review is valid if and only if the blockchain accepts it. The website is just a nicer
            way to look at what the chain already proved.
          </Pull>
        </div>
      </section>

      {/* ---- Introduction ---- */}
      <section id="introduction" className="scroll-mt-24">
        <SectionTitle eyebrow="The problem">Introduction</SectionTitle>
        <div className="space-y-4 text-base leading-relaxed text-muted">
          <p>
            A handful of stars decides whether a stranger walks into a café or scrolls past it. That
            much power attracts gaming: competitors leaving one-star hits, businesses buying
            five-star praise, and bots posting reviews for places they&apos;ve never set foot in.
          </p>
          <p>
            Every existing platform fights this the same way — moderation, machine-learning filters,
            &ldquo;verified purchase&rdquo; badges backed by a private database you have to trust.
            The badge is only as honest as the company behind it, and the company has every
            incentive to keep engagement high.
          </p>
          <p>
            We take a different route: make the proof{' '}
            <em className="text-ink">public and unforgeable</em>, and put the rule that checks it
            somewhere no one — not even us — can quietly override.
          </p>
        </div>
      </section>

      {/* ---- Market Opportunity ---- */}
      <section id="market" className="scroll-mt-24">
        <SectionTitle eyebrow="Where this fits">Market Opportunity</SectionTitle>
        <div className="space-y-4 text-base leading-relaxed text-muted">
          <p>
            Online reviews are among the most influential signals in local commerce — for many
            shoppers a star rating settles the decision before they read a single word. That
            influence is exactly why review fraud is so persistent: paid five-star posts, bot farms,
            and competitor sabotage are a well-documented problem across every major platform.
          </p>
          <p>
            Incumbents — Yelp, Google, and Trustpilot — fight it with internal machine-learning
            moderation and &ldquo;verified purchase&rdquo; badges backed by private databases only
            they can see. The badge is only as trustworthy as the company asserting it.
          </p>
          <p>
            VerifiedReviews&apos;s differentiation is{' '}
            <strong className="text-ink">structural</strong>, not a better filter: the proof itself
            is public and checkable by anyone, rather than a badge you&apos;re asked to take on
            faith.
          </p>
          <p className="text-sm text-muted/80">
            We don&apos;t cite a precise market figure here because we&apos;d rather publish a
            sourced one than a guessed one — sizing will land in a future revision with citations.
          </p>
        </div>
      </section>

      {/* ---- Body: How It Works ---- */}
      <section id="body" className="scroll-mt-24">
        <SectionTitle eyebrow="The mechanism">How It Works</SectionTitle>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            [
              '01',
              'Pay & get a receipt',
              'At checkout, staff scan your wallet and mint a soulbound token on-chain — a visit proof locked to you, forever.',
            ],
            [
              '02',
              'Write within 60 days',
              'The review contract checks you hold a recent visit proof. No receipt, or one older than 60 days, and the transaction reverts.',
            ],
            [
              '03',
              'Anyone can verify',
              'Every published review links to its on-chain transaction. The rating is computed from the chain, not asserted by us.',
            ],
          ].map(([n, t, b]) => (
            <div key={n} className="flex flex-col gap-2">
              <span className="font-display text-3xl font-bold tabular-nums text-accent/30">
                {n}
              </span>
              <h3 className="font-display text-lg font-semibold text-ink">{t}</h3>
              <p className="text-sm leading-relaxed text-muted">{b}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-12 font-display text-xl font-semibold text-ink">
          The rule that must not break: the gate lives in the contract
        </h3>
        <p className="mt-3 text-base leading-relaxed text-muted">
          The website and API exist purely for convenience — search, nice pages, a place to store
          the review text. They are <strong className="text-ink">never a security boundary</strong>.
          A review counts only when{' '}
          <code className="rounded bg-subtle px-1.5 py-0.5 text-sm">ReviewRegistry</code> accepts it
          on-chain after two checks: the author holds the visit proof, and the visit is recent. Even
          the server&apos;s privileged wallet can only <em className="text-ink">mint</em> receipts;
          it cannot forge a review.
        </p>

        <h3 className="mt-10 font-display text-xl font-semibold text-ink">
          Soulbound receipts (ERC-5192)
        </h3>
        <p className="mt-3 text-base leading-relaxed text-muted">
          A normal NFT can be sold or sent away. A <strong className="text-ink">soulbound</strong>{' '}
          token can&apos;t — transfers revert by design. That property is the whole point: if a
          visit proof could move between wallets, a single real visit could mint reviews for a
          thousand accounts. Locking it to one wallet makes &ldquo;one visit, one voice&rdquo;
          enforceable in code.
        </p>

        <h3 className="mt-10 font-display text-xl font-semibold text-ink">
          The 60-day recency window
        </h3>
        <p className="mt-3 text-base leading-relaxed text-muted">
          A receipt from three years ago shouldn&apos;t carry the same weight as last week&apos;s.
          The contract rejects any review whose proof is older than 60 days, so ratings reflect the
          place as it <em className="text-ink">is</em>, not as it once was. The boundary is exact:
          at 60 days it passes; one second later it reverts.
        </p>

        <Pull>
          Faking a review here means faking a blockchain transaction — which you can&apos;t.
        </Pull>
      </section>

      {/* ---- Edge Cases & Failure Modes ---- */}
      <section id="edge-cases" className="scroll-mt-24">
        <SectionTitle eyebrow="Where it bends">Edge Cases &amp; Failure Modes</SectionTitle>
        <p className="mb-6 text-base leading-relaxed text-muted">
          An honest system names its own seams. Here are the ones we know about — including the one
          place where &ldquo;the chain proves it&rdquo; is really &ldquo;the chain proves what staff
          told it.&rdquo;
        </p>
        <ul className="space-y-5">
          <li>
            <p className="font-display font-semibold text-ink">
              Staff integrity at the point of sale — the real trust boundary
            </p>
            <p className="mt-1 text-base leading-relaxed text-muted">
              The contract proves a visit proof <em className="text-ink">exists</em>; it does not
              prove a purchase happened behind it. A mint is authorised only by the business&apos;s
              assigned minter, so a dishonest staffer could in principle mint a receipt to a friend
              with no real sale. There is currently no binding to a POS transaction (e.g. a minimum
              amount). What the gate does is move trust from &ldquo;an anonymous internet
              stranger&rdquo; down to &ldquo;the business&apos;s own till&rdquo; — it narrows the
              boundary, it does not erase it. A POS-amount binding is a candidate future
              integration.
            </p>
          </li>
          <li>
            <p className="font-display font-semibold text-ink">One receipt, one review</p>
            <p className="mt-1 text-base leading-relaxed text-muted">
              Each visit proof can back at most one review — the registry records{' '}
              <code className="rounded bg-subtle px-1.5 py-0.5 text-sm">reviewed[tokenId]</code> and
              reverts{' '}
              <code className="rounded bg-subtle px-1.5 py-0.5 text-sm">AlreadyReviewed</code> on a
              second attempt. There is no on-chain edit or delete; the review event is append-only.
              A later genuine visit mints a fresh token, which may review again.
            </p>
          </li>
          <li>
            <p className="font-display font-semibold text-ink">Lost wallet</p>
            <p className="mt-1 text-base leading-relaxed text-muted">
              A visit proof is soulbound to one wallet. If a customer loses access, the receipt —
              and the ability to review that visit — is gone permanently. There is no transfer or
              recovery path, by design.
            </p>
          </li>
          <li>
            <p className="font-display font-semibold text-ink">Real but adversarial reviews</p>
            <p className="mt-1 text-base leading-relaxed text-muted">
              Soulbound + recency stops <em className="text-ink">fake</em> visits; it doesn&apos;t
              stop a <em className="text-ink">real but bad-faith</em> one — a competitor who makes
              one small purchase specifically to post a hit piece. This is a known limitation, not a
              gap we missed: the system proves a recent visit, not good faith. Public flagging
              handles abuse off-chain without rewriting the on-chain record.
            </p>
          </li>
        </ul>
      </section>

      {/* ---- Team & Governance ---- */}
      <section id="team" className="scroll-mt-24">
        <SectionTitle eyebrow="Who holds the keys">Team &amp; Governance</SectionTitle>
        <p className="text-base leading-relaxed text-muted">
          VerifiedReviews is an open-source project; its contracts and application code are public
          and verifiable. Governance is deliberately small, and we&apos;d rather state it plainly
          than imply more decentralisation than exists today:
        </p>
        <ul className="mt-4 space-y-3 text-base leading-relaxed text-muted">
          <li>
            <strong className="text-ink">Admin role.</strong> A single{' '}
            <code className="rounded bg-subtle px-1.5 py-0.5 text-sm">DEFAULT_ADMIN_ROLE</code> key
            assigns each business&apos;s minter. On testnet this is a single deployer-controlled
            key.
          </li>
          <li>
            <strong className="text-ink">Minter wallet.</strong> The only privileged server secret.
            It can mint receipts and nothing else — it cannot forge, hide, or alter a review.
          </li>
        </ul>
        <p className="mt-4 text-base leading-relaxed text-muted">
          The minter is the single point of trust in an otherwise trustless design. Before any
          mainnet deployment we intend to move the admin role behind a multisig and document
          minter-key custody. We treat that hardening as a release blocker, not a nice-to-have.
        </p>
      </section>

      {/* ---- Security & Audit Status ---- */}
      <section id="security" className="scroll-mt-24">
        <SectionTitle eyebrow="Read before you trust">Security &amp; Audit Status</SectionTitle>
        <div className="rounded-lg border border-accent/40 bg-accent-muted/50 p-6">
          <p className="text-base leading-relaxed text-ink/80">
            VerifiedReviews is deployed on{' '}
            <strong className="text-ink">Arbitrum Sepolia (testnet)</strong> and has{' '}
            <strong className="text-ink">not</strong> undergone a third-party security audit.{' '}
            <code className="rounded bg-subtle px-1.5 py-0.5 text-sm">VisitProofSBT</code> and{' '}
            <code className="rounded bg-subtle px-1.5 py-0.5 text-sm">ReviewRegistry</code> should
            be treated as experimental and not used to secure anything of value.
          </p>
          <p className="mt-3 text-base leading-relaxed text-ink/80">
            A formal audit and a minter-key hardening pass are planned ahead of any mainnet
            deployment. Security disclosures: please open a private advisory on the project&apos;s
            GitHub repository rather than a public issue.
          </p>
        </div>
      </section>

      {/* ---- Business Model ---- */}
      <section id="business-model" className="scroll-mt-24">
        <SectionTitle eyebrow="How it sustains">Business Model</SectionTitle>
        <div className="space-y-4 text-base leading-relaxed text-muted">
          <p>
            Shoppers never pay to read or write a review — the customer side is free and will stay
            free. The intended revenue surface is the business side: paid access to receipt-minting,
            for example a per-location subscription or a per-receipt fee.
          </p>
          <p>
            The exact pricing is <strong className="text-ink">not yet finalised</strong> and will be
            published before mainnet. There is deliberately no token, no resale market, and no fee
            charged to reviewers — so that no economic incentive can distort the reviews themselves.
          </p>
        </div>
      </section>

      {/* ---- Roadmap ---- */}
      <section id="roadmap" className="scroll-mt-24">
        <SectionTitle eyebrow="What's next">Roadmap</SectionTitle>
        <ol className="space-y-5">
          {[
            [
              'Phase 1 — Core protocol',
              'Complete',
              'VisitProof soulbound receipts, the ReviewRegistry gate, the 60-day recency check, and off-chain search + moderation.',
            ],
            [
              'Phase 2 — Security hardening',
              'Planned · pre-mainnet',
              'Third-party audit, admin role moved to a multisig, and documented minter-key custody.',
            ],
            [
              'Phase 3 — Mainnet',
              'Planned',
              'Arbitrum mainnet deployment, business onboarding flow, and finalised pricing.',
            ],
          ].map(([phase, status, body]) => (
            <li key={phase} className="flex flex-col gap-1 border-l-2 border-border pl-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-display font-semibold text-ink">{phase}</span>
                <span className="rounded-sm border border-border px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest text-muted">
                  {status}
                </span>
              </div>
              <p className="text-base leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- CTA ---- */}
      <section id="get-started" className="scroll-mt-24">
        <SectionTitle eyebrow="Your move">Get Started</SectionTitle>
        <div className="rounded-lg border border-border bg-subtle/40 p-8">
          <p className="max-w-xl text-base leading-relaxed text-muted">
            Read reviews that had to earn their place, or put the receipt gate to work for your own
            business.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/businesses"
              className="inline-flex items-center gap-2 rounded bg-accent px-7 py-3.5 text-sm font-medium tracking-wide text-paper transition-colors hover:bg-accent-light"
            >
              Explore businesses
            </Link>
            <Link
              href="/biz"
              className="inline-flex items-center gap-2 rounded border border-border px-7 py-3.5 text-sm font-medium tracking-wide text-ink transition-colors hover:bg-subtle"
            >
              For businesses
            </Link>
          </div>
        </div>
      </section>

      {/* ---- References ---- */}
      <section id="references" className="scroll-mt-24">
        <SectionTitle eyebrow="Further reading">References</SectionTitle>
        <ul className="space-y-3 text-sm leading-relaxed text-muted">
          {[
            ['ERC-5192: Minimal Soulbound NFTs', 'https://eips.ethereum.org/EIPS/eip-5192'],
            ['ERC-721: Non-Fungible Token Standard', 'https://eips.ethereum.org/EIPS/eip-721'],
            ['Arbitrum Sepolia (testnet) documentation', 'https://docs.arbitrum.io/'],
            ['EIP-712: Typed structured data hashing', 'https://eips.ethereum.org/EIPS/eip-712'],
          ].map(([label, href]) => (
            <li key={href} className="flex gap-3">
              <span className="text-accent/50" aria-hidden="true">
                ↗
              </span>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-border underline-offset-4 transition-colors hover:decoration-accent"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Appendix ---- */}
      <section id="appendix" className="scroll-mt-24">
        <SectionTitle eyebrow="Reference data">Appendix</SectionTitle>

        <h3 className="font-display text-lg font-semibold text-ink">Deployed contracts</h3>
        <dl className="mt-3 space-y-3">
          {[
            ['VisitProof (soulbound receipt)', SBT_ADDRESS],
            ['ReviewRegistry (the gate)', REGISTRY_ADDRESS],
          ].map(([label, addr]) => (
            <div key={addr} className="flex flex-col gap-1">
              <dt className="text-xs uppercase tracking-widest text-muted">{label}</dt>
              <dd className="break-all font-mono text-sm text-ink">{addr}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-8 font-display text-lg font-semibold text-ink">Glossary</h3>
        <dl className="mt-3 space-y-3 text-sm leading-relaxed">
          {[
            [
              'Soulbound token',
              'An NFT that cannot be transferred. Here it proves one specific wallet really visited.',
            ],
            [
              'The gate',
              'The on-chain check (holder + recency) that decides whether a review is valid.',
            ],
            [
              'Recency window',
              'The 60-day limit after which a visit proof no longer qualifies for a review.',
            ],
            [
              'Minter wallet',
              'The only privileged server secret. It can mint receipts — nothing else.',
            ],
          ].map(([term, def]) => (
            <div key={term as string}>
              <dt className="font-medium text-ink">{term}</dt>
              <dd className="text-muted">{def}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
