# VerifiedReviews — Git Plan (milestones, PRs, branches, commits)

The full delivery plan: **5 milestones · 15 PRs · ~65 commits.** Each PR maps to
one GitHub issue and one branch. PRs are raised for review and merged **by the
maintainer only** — see the workflow rules at the bottom.

---

## Workflow rules (read first)

- **Branch naming:** `type/issue-<N>-<slug>` off `main` (e.g. `feat/issue-3-visitproof-sbt`).
- **Commits:** Conventional Commits — `type(scope): summary`. Granular, one logical change each.
- **PR body:** links the issue with `Refs #N` (never `Closes/Fixes`, so the maintainer controls closure).
- **Review → merge:** contributor raises the PR → senior reviews → **the maintainer merges with a merge commit and closes the issue.** The contributor (and Claude) **never merge or close.**
- **No AI attribution** anywhere in commits or PR bodies.
- **Every PR is green before review:** lint + typecheck + tests pass, and the PR includes its own tests. Edge cases are covered, not deferred.

Milestones are sequential; within a milestone, later PRs may depend on earlier
ones (noted where it matters).

---

## Milestone 1 — Foundation

### PR #1 — Set up pnpm monorepo with shared tooling, CI, and project docs

Branch: `chore/issue-1-monorepo-scaffold`

- `chore: init pnpm workspace and root package.json`
- `chore: add base tsconfig + shared eslint/prettier config`
- `chore: scaffold contracts/api/web/shared skeletons`
- `ci: add github actions for lint, typecheck, test`
- `docs: add CLAUDE.md, archi.md, git.md`

### PR #2 — Add shared validation schemas and contract address registry

Branch: `feat/issue-2-shared-package`

- `feat(shared): add zod schemas for review, business, mint payloads`
- `feat(shared): add typed env + address registry exports`
- `test(shared): cover schema validation edge cases`

---

## Milestone 2 — Smart contracts (the security core)

### PR #3 — Add VisitProofSBT: a non-transferable visit receipt (ERC-5192)

Branch: `feat/issue-3-visitproof-sbt`

- `chore(contracts): set up hardhat + openzeppelin toolchain`
- `feat(contracts): add IERC5192 interface with locked() + Locked event`
- `feat(contracts): implement VisitProofSBT with minter role, visit timestamps, and soulbound transfers`
- `test(contracts): cover mint, soulbound reverts, minter access control`

### PR #4 — Add ReviewRegistry: gate reviews behind a recent VisitProof

Branch: `feat/issue-4-review-registry`

- `feat(contracts): add ReviewRegistry with SBT-holder recency gate`
- `test(contracts): cover gate pass/fail and missing-SBT revert`
- `test(contracts): cover recency window boundaries (60d, 60d+1s)`

### PR #5 — Deploy contracts to Arbitrum Sepolia and publish ABIs

Branch: `chore/issue-5-contract-deploy` (depends on #3, #4)

- `chore(contracts): add hardhat config for Arbitrum Sepolia`
- `feat(contracts): add deploy script wiring SBT + Registry`
- `feat(shared): export deployed addresses + ABIs from artifacts`
- `docs(contracts): document deploy + Arbiscan verification`

---

## Milestone 3 — Backend API

### PR #6 — Stand up the Express API with Mongo, config, and health checks

Branch: `feat/issue-6-api-foundation`

- `feat(api): bootstrap express app with typed config loader`
- `feat(api): add mongo connection + graceful shutdown`
- `feat(api): add central error handler + zod request validation`
- `feat(api): add health + readiness endpoints`
- `test(api): add supertest harness + health tests`

### PR #7 — Add wallet, staff, and admin auth with business onboarding

Branch: `feat/issue-7-auth-accounts` (depends on #6)

- `feat(api): add JWT issuance and password hashing helpers`
- `feat(api): add SIWE nonce/verify and admin login`
- `feat(api): add bearer auth and role middleware`
- `test(api): cover SIWE, JWT, and role middleware`
- `fix(api): bind SIWE domain and chainId on verify`
- `feat(api): add business signup, approval, and minter provisioning`
- `feat(api): add owner/staff login and scoped staff routes`
- `test(api): cover approval flow and cross-business access`

### PR #8 — Mint VisitProofs from the API with rate limiting and audit trail

Branch: `feat/issue-8-mint-orchestrator` (depends on #5, #7)

- `feat(api): add viem mint orchestrator using business minter wallet`
- `feat(api): add /sbt/mint with staff-scope check + rate limiting`
- `test(api): cover mint scope, rate limit, and tx-revert no-write`

(Audit-logging and tx-revert handling landed inside the route/service commit
rather than as separate commits — they're one cohesive service.)

### PR #9 — Index on-chain reviews, add search, and serve signed badge counts

Branch: `feat/issue-9-indexer-search-badge` (depends on #5, #6)

- `feat(shared): add canonical review content-hash helper`
- `feat(api): add review + checkpoint models with text index`
- `feat(api): ingest review text + verify hash matches on-chain commit`
- `feat(api): add ReviewSubmitted indexer with block checkpointing`
- `feat(api): serve /badge/:bizId with HMAC-signed counts`
- `test(api): cover hash-mismatch reject, replay idempotency, signature tamper`

(The canonical content-hash moved to `@vr/shared` so web and api agree on the
commitment. Search lives in the review model/service; badge counts are computed
on read rather than cached on ingest — simpler and always consistent.)

---

## Milestone 4 — Frontend

### PR #10 — Scaffold the Next.js app with wallet connect and UI foundation

Branch: `feat/issue-10-web-foundation`

- `feat(web): scaffold app router + tailwind + base layout`
- `feat(web): add wagmi/viem provider + wallet connect`
- `feat(web): add api client + tanstack query setup`
- `feat(web): add ui primitives + loading/empty/error states`

### PR #11 — Build public business pages and the customer review flow

Branch: `feat/issue-11-public-customer` (depends on #9, #10)

- `feat(web): build landing + browse/search with verified-only filter`
- `feat(web): build business page + reviews linked to on-chain tx`
- `feat(web): add SIWE sign-in + my-VisitProofs page reading SBTs`
- `feat(web): build review form (keccak hash + on-chain submit)`
- `feat(web): add pending->confirmed UX + gate-failure messaging`

### PR #12 — Build the staff QR scanner and one-tap VisitProof minting

Branch: `feat/issue-12-staff-scanner` (depends on #8, #10)

- `feat(web): add staff login + scanner route guard`
- `feat(web): build camera QR scanner for wallet address`
- `feat(web): wire mint button to /sbt/mint with 3s feedback`
- `feat(web): build today's mints log`

### PR #13 — Build business dashboard, admin moderation, and the badge widget

Branch: `feat/issue-13-business-admin-badge` (depends on #9, #10)

- `feat(web): build business dashboard (count, avg, sentiment trend)`
- `feat(web): build staff mgmt + insights view`
- `feat(web): build admin approval + spam flag queue`
- `feat(web): build sandboxed /badge/:bizId iframe + HMAC verify + embed snippet`

---

## Milestone 5 — Hardening + Deploy

### PR #14 — Add end-to-end tests for the full journey and gate edge cases

Branch: `test/issue-14-e2e` (depends on all feature PRs)

- `test(e2e): cover visit->mint->review->badge happy path`
- `test(e2e): cover gate edges (no SBT, expired, wrong business)`
- `test(e2e): cover auth + rate-limit + signature tamper paths`

### PR #15 — Harden API security and wire up production deployment

Branch: `feat/issue-15-hardening-deploy`

- `feat(api): add helmet, strict CORS, body limits, global rate limit`
- `fix(api): move minter keys to validated env + redact from logs`
- `ci: add vercel + render deploy configs with env mapping`
- `chore(contracts): verify contracts on Arbiscan`
- `docs: deployment runbook + env matrix in archi.md`
