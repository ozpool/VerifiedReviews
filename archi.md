# VerifiedReviews — Architecture

Receipt-gated on-chain reviews for local businesses. A soulbound token
(ERC-5192) issued at point-of-sale acts as a non-transferable receipt; the
review contract enforces both a holder-check and a recency-check on submission
— making review fraud expensive without making the UX heavy.

- **Chain:** Arbitrum Sepolia
- **Standard:** ERC-5192 (soulbound / locked NFTs)
- **Roles:** business · staff · customer · public · admin

---

## 1. The one idea that dominates the design

**The gate lives in the contract, not the API.**

A central API can be coerced, compromised, or simply go offline. A contract
that reverts on a missing or stale VisitProof cannot be overridden by anyone —
including us. A customer could submit a valid review directly via Etherscan and
it would still be enforced correctly. Everything in the API exists for UX,
search, and convenience; **the API is never a security boundary.**

Two consequences follow:

1. Review text is _not_ stored on-chain — only a `keccak256` content hash is
   committed. The prose lives in MongoDB where it is searchable and moderatable.
2. The verified-review _count_ a business displays is derived from on-chain
   events, so it is independently auditable. We sign the count for embed widgets
   so a screenshot can't fake it.

---

## 2. Monorepo layout

```
verified-reviews/                 (pnpm workspace)
├── packages/
│   ├── contracts/   Hardhat · Solidity        — VisitProofSBT, ReviewRegistry
│   ├── api/         Express + TypeScript       — auth, mint, indexer, search, badge
│   ├── web/         Next.js (App Router) + Wagmi — all role surfaces + badge iframe
│   └── shared/      TypeScript                 — ABIs, deployed addresses, zod schemas, types
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── archi.md         (this file)
├── git.md           (milestones, PRs, branches, commits, workflow rules)
└── CLAUDE.md        (project memory for AI sessions)
```

`shared` is the seam: contract ABIs and deployed addresses are exported from it
after deploy, and both `api` and `web` import their request/response zod schemas
from it so the wire contract is defined once.

---

## 3. System architecture

```
   ┌────────────────────────┐         ┌──────────────────────────┐
   │  Customer browser      │         │  Business staff app      │
   │  • Next.js + Wagmi     │         │  • QR scanner (camera)   │
   │  • Review form         │         │  • "Mint VisitProof"     │
   │  • Wallet (read SBT)   │         │  • Daily mint log        │
   └─────────┬──────────────┘         └────────────┬─────────────┘
             │ REST + RPC                          │ REST
             ▼                                      ▼
   ┌────────────────────────────────────────────────────────────┐
   │              Express API · TypeScript                       │
   │  Routes: /businesses /reviews /sbt/mint /badge/[bizId]      │
   │  Auth: SIWE customers · staff JWT · admin JWT               │
   │  Mint orchestrator: calls VisitProofSBT.mint() via Viem     │
   │  Indexer: watches ReviewSubmitted → ingests text to Mongo   │
   │  Search: MongoDB text index over review_text               │
   └────────┬─────────────────────────┬──────────────────────────┘
            │                         │
            ▼                         ▼
   ┌────────────────────────┐  ┌──────────────────────────────────┐
   │  MongoDB Atlas         │  │  Arbitrum Sepolia                │
   │  businesses · staff    │  │  ┌────────────────────────────┐  │
   │  reviews_full_text     │  │  │ VisitProofSBT.sol (ERC5192)│  │
   │  badge_counts_cache    │  │  │  + per-business minter role│  │
   │  sentiment_aggregates  │  │  │  + visitedAt timestamp     │  │
   └────────────────────────┘  │  └────────────────────────────┘  │
                                │  ┌────────────────────────────┐  │
   ┌────────────────────────┐  │  │ ReviewRegistry.sol         │  │
   │  Embed badge iframe    │◀─┼──│  + recency gate (60 days)  │  │
   │  (HMAC-signed counts)  │  │  │  + review hash commit      │  │
   └────────────────────────┘  │  └────────────────────────────┘  │
                                └──────────────────────────────────┘
```

---

## 4. Component responsibilities

| Layer             | Owns                                                                                         | Does NOT own                                                          |
| ----------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Customer web**  | Browse, review form, my-VisitProofs page, badge preview                                      | Whether a review is allowed — the contract decides                    |
| **Staff scanner** | Camera scan of wallet QR, "Mint VisitProof", today's mints                                   | Signing the mint tx — the API does, with the business minter wallet   |
| **API**           | SIWE auth, signup + approval, staff JWTs, mint orchestration, indexing, search, signed badge | Any custody (SBTs are non-transferable, no funds) and the review gate |
| **MongoDB**       | Business profiles, staff, full review text + search index, sentiment, badge cache            | SBT ownership or expiry — that is on-chain                            |
| **Contracts**     | Non-transferability, visit timestamps, review-hash commitments, the gate                     | Review text — just a hash                                             |

---

## 5. Data flow: visit → mint → review → badge

```
VISIT
 ① Customer pays the bill (cash, card, or crypto — any method)
 ② Customer shows wallet-address QR
 ③ Staff scans it → POST /sbt/mint { businessId, customerAddr }
 ④ API verifies staff JWT is scoped to businessId
 ⑤ API calls VisitProofSBT.mint(customerAddr, businessId) via business minter wallet
 ⑥ Contract mints a locked token, records visitedAt = block.timestamp
 ⑦ Customer sees the SBT in their wallet (UI listens for Transfer events)

REVIEW
 ⑧ Customer writes a review on the business page
 ⑨ Frontend computes hash = keccak256(reviewText + customerAddr + nonce)
 ⑩ Customer signs + submits ReviewRegistry.submit(businessId, hash, stars) themselves
 ⑪ Contract checks latest VisitProof for (customer, business); reverts if missing
    or if (block.timestamp - visitedAt) > 60 days; else emits ReviewSubmitted
 ⑫ Indexer sees the event → POSTs review text to API → Mongo insert (hash verified)
 ⑬ Search index + badge counts + sentiment recomputed

BADGE
 ⑭ Business embeds <iframe src=".../badge/[bizId]"> on their own site
 ⑮ Iframe renders verified count + avg rating + an HMAC-signed timestamp
    (signature lets anyone verify the count was not doctored)
```

---

## 6. On-chain vs off-chain

| Data                      | Lives in         | Why                                |
| ------------------------- | ---------------- | ---------------------------------- |
| VisitProof ownership      | Contract         | Soulbound; can't be moved or sold  |
| Visit timestamp           | Contract         | Needed for the recency gate        |
| Review hash + star rating | Contract event   | Tamper-proof commitment            |
| Review prose              | Mongo            | Searchable; mutable for moderation |
| Customer display name     | Mongo (optional) | Pseudonymous nicety                |
| Business profile, photos  | Mongo            | Heavily updated                    |
| Staff accounts + sessions | Mongo            | Standard auth, no chain value      |
| Sentiment / NLP           | Mongo            | Derived; recompute anytime         |

---

## 7. Smart-contract surface

### VisitProofSBT.sol (ERC-5192)

```
struct VisitData { uint256 businessId; uint64 visitedAt; }
mapping(uint256 tokenId => VisitData) public visits
mapping(address => mapping(uint256 businessId => uint256 latestTokenId)) public latestVisit
mapping(uint256 businessId => address minter) public businessMinter

setBusinessMinter(businessId, minter)   // admin
mint(to, businessId)                     // onlyBusinessMinter
locked(tokenId) → bool                   // ERC-5192: always true
_update(...)                             // reverts on non-mint/burn transfers
event Locked(tokenId)                    // ERC-5192 standard

invariants:
  • only the assigned minter for a businessId can mint that business's SBTs
  • non-mint transfers always revert
```

### ReviewRegistry.sol

```
VisitProofSBT public sbt
uint256 public constant RECENCY_WINDOW = 60 days

submit(businessId, contentHash, starRating)
  - require latestVisit(msg.sender, businessId) exists
  - require block.timestamp - visitedAt ≤ RECENCY_WINDOW
  - emit ReviewSubmitted(businessId, reviewer, contentHash, starRating, timestamp)

note: no review storage on-chain — only the event log.
```

---

## 8. UI surface

```
PUBLIC                            BUSINESS (after signup + admin approval)
  /                landing          /biz/dashboard   review stream, sentiment
  /b/[slug]        business page     /biz/staff       add/remove staff
  /b/[slug]/reviews full reviews     /biz/badge       copy embed snippet
  /search          city/category     /biz/insights    sentiment over time

CUSTOMER (after SIWE)             STAFF (after JWT)
  /me              my VisitProofs    /scan            camera scanner
  /me/reviews      my reviews        /scan/today      today's mints log
  /b/[slug]/write  review form

ADMIN                             EMBEDDED
  /admin/businesses approve new     /badge/[bizId]   iframe-served widget
  /admin/flags      spam queue
```

---

## 9. Role flows

- **Business** — sign up → admin approves → receive minter wallet (key held by API)
  - POS QR → add staff → watch dashboard → embed badge.
- **Staff** — log into `/scan` → after bill paid, scan customer wallet QR →
  tap "Mint VisitProof" (~3s) → customer sees the SBT.
- **Customer** — connect wallet → show QR → receive SBT → within 60 days write a
  review (contract checks the SBT) → review appears with a verified badge.
- **Public** — browse, filter "verified only", click any review's tx hash to
  verify it on-chain, see the same numbers on the business's embedded badge.

---

## 10. Failure modes & defenses

| Attack                                                   | Defense                                                                                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Business self-reviews via SBTs minted to its own wallets | Per-staff mint rate limit; flag high self-mint ratios; admin revokes status. Chain makes the cheating _auditable_; the platform enforces honesty. |
| Competitor 1-star bombing                                | Cost of attack = one real paid visit per review; cluster analysis on wallets that 1-star many competitors.                                        |
| Wallet handoff (sell the seed)                           | Soulbound blocks SBT transfer; selling the whole wallet is economically irrational for a penny of review influence.                               |
| Indexer down → reviews don't appear                      | Reviews exist on-chain regardless; UI shows "syncing"; on-chain count is always correct.                                                          |
| Minter wallet compromise                                 | Per-business rate limit + mint-rate anomaly detection; rotate the minter. Old SBTs stay valid for 60 days by design.                              |

---

## 11. Deployment topology

```
Frontend   ──▶ Vercel
               RPC_URL, REVIEW_REGISTRY_ADDR, SBT_ADDR
API        ──▶ Render
               MONGO_URI, JWT_SECRET, BACKEND_PRIVATE_KEY,
               RPC_URL, SBT_ADDR, REGISTRY_ADDR, BADGE_HMAC_KEY
DB         ──▶ MongoDB Atlas (text index on reviews_full_text)
Contracts  ──▶ Arbitrum Sepolia
               per-business minter wallets provisioned by the API on signup
```

### Environment variable matrix

| Var                   | api | web | contracts | Purpose                                        |
| --------------------- | :-: | :-: | :-------: | ---------------------------------------------- |
| `RPC_URL`             |  ✓  |  ✓  |     ✓     | Arbitrum Sepolia RPC endpoint                  |
| `INDEXER_RPC_URL`     |  ✓  |     |           | Dedicated RPC for the event indexer (see note) |
| `SBT_ADDR`            |  ✓  |  ✓  |           | Deployed VisitProofSBT address                 |
| `REGISTRY_ADDR`       |  ✓  |  ✓  |           | Deployed ReviewRegistry address                |
| `MONGO_URI`           |  ✓  |     |           | MongoDB Atlas connection string                |
| `JWT_SECRET`          |  ✓  |     |           | Sign staff/admin JWTs                          |
| `BACKEND_PRIVATE_KEY` |  ✓  |     |     ✓     | Deployer + minter wallet key (never logged)    |
| `BADGE_HMAC_KEY`      |  ✓  |     |           | Sign badge counts for anti-spoof               |

> Secrets policy: `BACKEND_PRIVATE_KEY`, `JWT_SECRET`, and `BADGE_HMAC_KEY` are
> validated at boot and redacted from all logs. They never reach the browser.

> Indexer RPC: the `ReviewSubmitted` event indexer (PR #9) must use a dedicated
> provider RPC (`INDEXER_RPC_URL`, e.g. Alchemy/Infura), not the public Arbitrum
> RPC — public endpoints rate-limit and silently drop event-log queries, which
> would leave reviews un-ingested. Falls back to `RPC_URL` if unset for dev.
