# VerifiedReviews

**Receipt-gated, on-chain reviews for local businesses.** A review is trustworthy
here because a smart contract enforced it, not because a server promised to.

To review a business you must prove you actually visited recently. At checkout the
business mints you a **VisitProof**: a non-transferable (soulbound, ERC-5192)
token that records when you visited. The review contract then accepts a review
only if your wallet holds a VisitProof for that business that is less than 60 days
old. The check runs on-chain, so it cannot be faked, bribed, or bypassed, even by
the people who run the service.

|                    |                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Network**        | Arbitrum Sepolia (testnet)                                                                                      |
| **Core primitive** | Soulbound receipt (ERC-5192)                                                                                    |
| **Recency window** | 60 days                                                                                                         |
| **Status**         | Feature-complete on testnet; unaudited; pre-mainnet                                                             |
| **VisitProofSBT**  | [`0x6827…34e6`](https://sepolia.arbiscan.io/address/0x682735379eC9718234bB545A7a33c6428ec134e6#code) (verified) |
| **ReviewRegistry** | [`0x9B5c…09aD`](https://sepolia.arbiscan.io/address/0x9B5cAEfa84FD1E2eC1d23E2E0fdA8B9b9F5409aD#code) (verified) |

---

## Contents

- [How it works](#how-it-works)
- [The rule that defines the project](#the-rule-that-defines-the-project)
- [Architecture](#architecture)
- [Monorepo layout](#monorepo-layout)
- [Tech stack](#tech-stack)
- [Deployed contracts](#deployed-contracts)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Project status](#project-status)
- [Security and audit status](#security-and-audit-status)
- [Contributing](#contributing)
- [License](#license)

---

## How it works

1. **Pay and get a receipt.** At checkout, staff scan the customer's wallet and
   mint a VisitProof soulbound token on-chain: a visit proof locked to that
   wallet, with the visit timestamp recorded.
2. **Write within 60 days.** To post a review, the customer signs a transaction.
   `ReviewRegistry` checks that the wallet holds a VisitProof for that business
   and that the visit is at most 60 days old. No receipt, or one that is too old,
   and the transaction reverts.
3. **Anyone can verify.** Every published review links to its on-chain
   transaction. A business's verified-review count is derived from on-chain events
   and HMAC-signed for embeddable badges, so a screenshot cannot inflate it.

Why each piece matters:

- **Soulbound receipt (ERC-5192).** The VisitProof cannot be transferred or sold,
  so a single real visit cannot be turned into reviews for a thousand accounts.
  "One visit, one voice" is enforced in code.
- **Recency gate.** Reviews must come within 60 days of the visit, so ratings
  reflect the business as it is now and stockpiling old proofs is worthless.
- **Hash-committed text.** Only a `keccak256` hash of the review goes on-chain
  (tamper-proof and cheap). The prose lives in MongoDB where it is searchable and
  moderatable, and the hash proves the text was never altered after the fact.

For new customers there is an optional frictionless path: sign in with Google or
email, and a Privy embedded wallet plus a platform-funded testnet gas top-up let
them submit a verified review without ever touching a crypto wallet or paying a
fee.

## The rule that defines the project

**The gate lives in the contract, not the API.** The backend is a convenience
layer for search, text storage, and UX. It is never a security boundary. A review
is valid if and only if `ReviewRegistry` accepts it on-chain (holder check plus
recency). The server's privileged wallet can only mint receipts; it cannot forge,
hide, or alter a review. No server-side logic ever "approves" a review.

## Architecture

```
 Customer browser            Staff scanner
 (Next.js + Wagmi)           (camera QR)
        | REST + RPC               | REST
        v                          v
 +---------------------------------------------+
 |            Express API (TypeScript)         |
 |  auth (SIWE/JWT) - mint orchestrator -      |
 |  event indexer - search - signed badge      |
 +-----------+---------------------+-----------+
             v                     v
     MongoDB Atlas          Arbitrum Sepolia
   text - profiles -      VisitProofSBT (ERC-5192)
   search - counts       ReviewRegistry (60-day gate)
```

**Flow:** pay -> staff mints the VisitProof -> the customer signs and submits the
review on-chain -> the contract checks the gate -> the indexer ingests the text ->
the business embeds a signed badge of verified counts.

## Monorepo layout

```
packages/
  contracts/   Solidity + Hardhat     VisitProofSBT, ReviewRegistry
  api/         Express + TypeScript    auth, mint, indexer, search, badge
  web/         Next.js + Wagmi         public/customer/staff/business/admin surfaces
  shared/      TypeScript              ABIs, addresses, zod schemas, content hash
```

`shared` is the seam: the wire contract (schemas, ABIs, the canonical review
content-hash) is defined once and imported by both `api` and `web`, so they cannot
drift apart.

## Tech stack

| Layer    | Tech                                                                |
| -------- | ------------------------------------------------------------------- |
| Chain    | Arbitrum Sepolia · Solidity 0.8.24 · Hardhat · OpenZeppelin         |
| Backend  | Express · TypeScript · Viem · MongoDB (Mongoose) · zod              |
| Auth     | SIWE (wallet sign-in) · JWT (staff/admin) · Privy (embedded wallet) |
| Frontend | Next.js (App Router) · Wagmi · Viem · TanStack Query · RainbowKit   |
| Tooling  | pnpm workspaces · Vitest · ESLint · Prettier · GitHub CI            |

## Deployed contracts

Both contracts are deployed and source-verified on Arbitrum Sepolia. The verified
source, read, and write tabs are public on Arbiscan.

| Contract                          | Address                                      | Explorer                                                                                          |
| --------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| VisitProofSBT (soulbound receipt) | `0x682735379eC9718234bB545A7a33c6428ec134e6` | [Arbiscan ↗](https://sepolia.arbiscan.io/address/0x682735379eC9718234bB545A7a33c6428ec134e6#code) |
| ReviewRegistry (the gate)         | `0x9B5cAEfa84FD1E2eC1d23E2E0fdA8B9b9F5409aD` | [Arbiscan ↗](https://sepolia.arbiscan.io/address/0x9B5cAEfa84FD1E2eC1d23E2E0fdA8B9b9F5409aD#code) |

## Getting started

### Prerequisites

- Node.js 20+ and [pnpm](https://pnpm.io) 9+
- A MongoDB instance (local `mongod` or a MongoDB Atlas cluster)
- For on-chain features: an Arbitrum Sepolia RPC URL and a Sepolia-funded wallet

### Install

```bash
pnpm install                  # install all workspaces
```

### Configure

Each package ships an `.env.example`. Copy it and fill in the values; the real
files are gitignored and validated at boot. Secrets are never logged or sent to
the browser.

```bash
cp packages/contracts/.env.example packages/contracts/.env
cp packages/api/.env.example       packages/api/.env
cp packages/web/.env.example       packages/web/.env.local
```

Key variables:

- **contracts:** `PRIVATE_KEY` (deployer), `ARBITRUM_SEPOLIA_RPC_URL`,
  `ETHERSCAN_API_KEY` (for source verification).
- **api:** `MONGO_URI`, `JWT_SECRET`, `MINTER_MNEMONIC`, `PRIVY_APP_ID` /
  `PRIVY_APP_SECRET`, and the optional testnet gas-tank settings.
- **web:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SBT_ADDRESS`,
  `NEXT_PUBLIC_REGISTRY_ADDRESS`, `NEXT_PUBLIC_PRIVY_APP_ID`.

### Run

```bash
pnpm -F @vr/contracts test    # Hardhat: the security core
pnpm -F @vr/api dev           # Express API on :4000
pnpm -F @vr/web dev           # Next.js app on :3000
```

Seed the first admin once the API and database are up:

```bash
pnpm -F @vr/api seed:admin    # uses ADMIN_EMAIL / ADMIN_PASSWORD
```

## Testing

```bash
pnpm -r typecheck             # type-check shared, api, web
pnpm -r test                  # run shared + contracts + api suites
pnpm -r lint                  # ESLint across all workspaces
```

Tests are organised around the security boundary. The contract suite is the most
heavily covered surface by design: soulbound transfer reverts, the holder check,
and the exact 60-day recency boundaries (60d passes, 60d + 1s reverts). The API
suite covers auth tampering and expiry, rate limits, tx-revert-no-write,
hash-mismatch rejection, indexer replay idempotency, and HMAC tampering.

## Project status

| Area                | Scope                                              | State   |
| ------------------- | -------------------------------------------------- | ------- |
| Foundation          | Monorepo, shared schemas, CI                       | Done    |
| Smart contracts     | VisitProofSBT, ReviewRegistry, deploy, verified    | Done    |
| Backend API         | Auth, onboarding, mint, indexer, search, badge     | Done    |
| Frontend            | Public, customer, staff, business, and admin flows | Done    |
| Hardening + mainnet | Audit, multisig admin, mainnet deployment          | Planned |

The application is feature-complete on Arbitrum Sepolia. A third-party audit and a
minter-key hardening pass are planned before any mainnet deployment.

## Security and audit status

VerifiedReviews runs on **Arbitrum Sepolia (testnet)** and has **not** undergone a
third-party security audit. `VisitProofSBT` and `ReviewRegistry` should be treated
as experimental and not used to secure anything of value.

The single point of trust in an otherwise trustless design is the minter wallet:
it can mint receipts and nothing else. The contract proves a visit proof exists, not
that a purchase happened behind it, so point-of-sale staff integrity is the real
trust boundary. Before mainnet, the admin role moves behind a multisig and
minter-key custody is documented.

To report a vulnerability, open a private security advisory on the GitHub
repository rather than a public issue.

## Contributing

- Branch `type/issue-<N>-<slug>` off `main`, using Conventional Commits.
- One pull request maps to one issue and one branch.
- PR descriptions reference the issue with `Refs #N`.
- The maintainer reviews and merges with a merge commit; contributors do not merge
  or close issues themselves.

Run `pnpm -r lint && pnpm -r typecheck && pnpm -r test` and make sure everything is
green before opening a pull request.

## License

No license has been published yet. Until a `LICENSE` file is added, the code is
source-available for review and evaluation only; it is not licensed for production
reuse or redistribution.
