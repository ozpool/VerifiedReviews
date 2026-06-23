# VerifiedReviews

**Receipt-gated, on-chain reviews for local businesses.** A review is trustworthy
here because a smart contract enforced it — not because a server promised to.

To review a business you must prove you actually visited recently. At checkout the
business mints you a **VisitProof**: a non-transferable (soulbound, ERC-5192)
token that records _when_ you visited. The review contract then accepts a review
**only** if your wallet holds a VisitProof for that business that is less than 60
days old. The check runs on-chain, so it cannot be faked, bribed, or bypassed —
even by us.

> **The one rule that defines this project:** the gate lives in the contract, not
> the API. The backend is a convenience layer for search, text storage, and UX.
> It is _never_ a security boundary. A review is valid iff `ReviewRegistry`
> accepts it on-chain.

---

## Why it works

- **Soulbound receipt (ERC-5192).** The VisitProof can't be transferred or sold,
  so you can't buy the right to review — you have to earn it with a real visit.
- **Recency gate.** Reviews must come within 60 days of the visit, keeping
  feedback current and raising the cost of stockpiling fake proofs.
- **Hash-committed text.** Only a `keccak256` hash of the review goes on-chain
  (tamper-proof + cheap); the prose lives in MongoDB where it's searchable and
  moderatable. The hash proves the text was never altered after the fact.
- **Auditable counts.** A business's verified-review count is derived from
  on-chain events and HMAC-signed for embeddable badges, so a screenshot can't
  inflate it.

---

## Architecture at a glance

```
 Customer browser            Staff scanner
 (Next.js + Wagmi)           (camera QR)
        │ REST + RPC               │ REST
        ▼                          ▼
 ┌─────────────────────────────────────────────┐
 │            Express API (TypeScript)          │
 │  auth (SIWE/JWT) · mint orchestrator ·       │
 │  event indexer · search · signed badge       │
 └───────────┬───────────────────────┬─────────┘
             ▼                        ▼
     MongoDB Atlas            Arbitrum Sepolia
   text · profiles ·       VisitProofSBT (ERC-5192)
   search · counts         ReviewRegistry (60-day gate)
```

**Flow:** pay → staff mints your VisitProof → you sign and submit your review
on-chain yourself → the contract checks the gate → the indexer ingests the text
→ the business embeds a signed badge of verified counts.

---

## Monorepo layout

```
packages/
  contracts/   Solidity + Hardhat   — VisitProofSBT, ReviewRegistry
  api/         Express + TypeScript  — auth, mint, indexer, search, badge
  web/         Next.js + Wagmi       — role surfaces + badge iframe
  shared/      TypeScript            — ABIs, addresses, zod schemas, content hash
```

`shared` is the seam: the wire contract (schemas, ABIs, the canonical review
content-hash) is defined once and imported by both `api` and `web`.

---

## Tech stack

| Layer    | Tech                                                     |
| -------- | -------------------------------------------------------- |
| Chain    | Arbitrum Sepolia · Solidity · Hardhat · OpenZeppelin     |
| Backend  | Express · TypeScript · Viem · MongoDB (Mongoose) · zod   |
| Auth     | SIWE (wallet sign-in) · JWT (staff/admin)                |
| Frontend | Next.js (App Router) · Wagmi · Viem · TanStack Query     |
| Tooling  | pnpm workspaces · Vitest · ESLint · Prettier · GitHub CI |

---

## Getting started

```bash
pnpm install                  # install all workspaces

pnpm -r typecheck             # type-check shared, api, web
pnpm -r test                  # run shared + contracts + api test suites

pnpm -F @vr/contracts test    # Hardhat — the security core
pnpm -F @vr/api dev|test      # Express API
pnpm -F @vr/web dev           # Next.js app
```

Environment variables (validated at boot; secrets never logged or sent to the
browser) are documented in each package's `.env.example`.

---

## Status & roadmap

| Milestone              | Scope                                          | State |
| ---------------------- | ---------------------------------------------- | ----- |
| 1 — Foundation         | Monorepo, shared schemas, CI                   | ✅    |
| 2 — Smart contracts    | VisitProofSBT, ReviewRegistry, deploy          | ✅    |
| 3 — Backend API        | Auth, onboarding, mint, indexer, search, badge | ✅    |
| 4 — Frontend           | Public/customer/staff/business/admin surfaces  | ⬜    |
| 5 — Hardening + deploy | E2E tests, security hardening, deployment      | ⬜    |

Tests: 116 passing (contracts 27 · api 43 · shared 46). The contract gate —
soulbound transfer reverts, holder check, and the 60-day recency boundaries — is
the most heavily covered surface by design.

---

## Security model in one line

The **contracts are the law** (un-overridable, on-chain), the **API is the
concierge** (helpful, never trusted), **Mongo is the filing cabinet** (text +
search), and the **web app is the front door**. Trust flows from the chain
outward — never the reverse.
