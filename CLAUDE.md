# CLAUDE.md — VerifiedReviews

Project memory for AI sessions. Read this before working in this repo.

## What this is

Receipt-gated on-chain reviews for local businesses. A soulbound token
(ERC-5192) minted at point-of-sale is a non-transferable receipt; the review
contract enforces holder-check + 60-day recency on submission. Full design in
`archi.md`. Full delivery plan (milestones, PRs, branches, commits) in `git.md`.

## Stack

- **Monorepo:** pnpm workspaces — `packages/{contracts,api,web,shared}`.
- **contracts:** Solidity + Hardhat, deployed to Arbitrum Sepolia.
- **api:** Express + TypeScript, MongoDB Atlas, Viem for chain writes.
- **web:** Next.js (App Router) + Wagmi + Viem.
- **shared:** TypeScript — ABIs, deployed addresses, zod schemas, shared types.

## ⚠️ Language decision (overrides a global preference)

This project uses **TypeScript** for `api` and `web`. The user's global rule is
"default to JavaScript, not TypeScript" — that rule is **deliberately overridden
here** because the user chose TS for this project (ecosystem default for
Wagmi/Viem, and the architecture doc specifies it). Do **not** revert to JS or
flag it as a mistake. Contracts use Solidity; Hardhat tests are in TS.

## The architectural rule that must not be broken

**The gate lives in the contract, not the API.** The API is a UX/search/convenience
layer and is *never* a security boundary. A review is valid iff `ReviewRegistry`
accepts it on-chain (holder + recency). Never add server-side logic that
"approves" reviews or that the contract relies on for correctness. The minter
wallet is the only privileged server secret, and it only mints — it cannot fake a
review.

## Git & GitHub workflow (hard rules)

- Branch `type/issue-<N>-<slug>` off `main`; Conventional Commits; PR body uses
  `Refs #N` (never `Closes/Fixes`).
- **Claude raises PRs but NEVER merges or closes** issues/PRs. The maintainer
  reviews (senior pass) and merges with a merge commit. This is enforced and
  intentional.
- **No AI / Claude / Co-Authored-By attribution** in any commit or PR body
  (global hard rule).
- One PR = one issue = one branch. Follow `git.md` PR order; respect the
  dependency notes there.

## Quality bar (the user said: "secure backend, no bugs, every edge case tested")

- Every PR ships with its own tests; lint + typecheck + tests green before review.
- Contracts: cover access control, soulbound transfer reverts, gate pass/fail,
  and recency boundaries (exactly 60d, 60d+1s). These are the security core.
- API: cover auth tamper/expiry, rate limits, tx-revert-no-write, hash-mismatch
  rejection, indexer replay idempotency, HMAC tamper.
- Secrets (`BACKEND_PRIVATE_KEY`, `JWT_SECRET`, `BADGE_HMAC_KEY`) are validated
  at boot and never logged or sent to the browser.

## How to work here (user preferences)

- **Build in small stages; show the plan and get approval before each stage.**
  Test each stage before moving on. Files stay clean and modular, ideally < ~150 lines.
- **Honest over hype.** Surface real limits and risks; never declare done on
  unverified work — run a fresh check and show output.
- **Explain unique concepts as we hit them.** The user wants short why-it-works
  explanations for new primitives. Planned teach-moments:
  - **PR #3** — ERC-5192 soulbound mechanics + why the gate belongs in the contract.
  - **PR #7** — SIWE (Sign-In With Ethereum): proving wallet ownership without a password.
  - **PR #8** — why the API mints but the customer submits reviews directly.
  - **PR #9** — indexer idempotency (txHash+logIndex keys) and HMAC-signed badge counts.
  - The `/explain` skill gives the full "complete circle" on any of these on demand.
- **Reply style:** caveman-lite (trim filler, full sentences), except always
  explain the *why* on new concepts in plain English.
- `/check` runs an on-demand product audit (UX · security · ease-of-use · prospects).

## Environment

- Windows 11, PowerShell primary (Bash via Git Bash when POSIX needed).
- pnpm for all package operations. Node + Python 3.13 available.
- git identity: `ozpool` / public repos by default.

## Commands (filled in as packages are scaffolded)

```
pnpm install                  # install all workspaces
pnpm -F @vr/contracts test    # hardhat tests
pnpm -F @vr/api dev|test      # express api
pnpm -F @vr/web dev           # next.js app
pnpm -r lint && pnpm -r typecheck
```
