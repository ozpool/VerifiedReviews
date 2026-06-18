# @vr/contracts

Solidity contracts for VerifiedReviews, built and tested with Hardhat.

- `VisitProofSBT.sol` — non-transferable visit receipt (ERC-5192) with a
  per-business minter role and `visitedAt` timestamps.
- `ReviewRegistry.sol` — gates `submit()` behind an SBT holder check + a 60-day
  recency window. The event log is the canonical review record.
- `interfaces/IERC5192.sol` — the soulbound standard interface.

## Develop

```bash
pnpm -F @vr/contracts compile      # compile (evm target: cancun)
pnpm -F @vr/contracts test         # run the test suite
pnpm -F @vr/contracts export-abis  # write ABIs into @vr/shared
```

## Deploy

1. `cp .env.example .env` and fill in `PRIVATE_KEY` (a Sepolia-funded deployer)
   and optionally `ARBITRUM_SEPOLIA_RPC_URL` / `ARBISCAN_API_KEY`.
2. Smoke-test against the in-memory chain:
   ```bash
   pnpm -F @vr/contracts deploy:local
   ```
3. Deploy to Arbitrum Sepolia:
   ```bash
   pnpm -F @vr/contracts deploy:arbitrum
   ```
   Copy the printed `SBT_ADDR` / `REGISTRY_ADDR` into the api and web env.
4. Regenerate ABIs for the apps:
   ```bash
   pnpm -F @vr/contracts export-abis
   ```

## Verify on Arbiscan

```bash
pnpm -F @vr/contracts verify <SBT_ADDR> <DEPLOYER_ADDR>
pnpm -F @vr/contracts verify <REGISTRY_ADDR> <SBT_ADDR>
```

> The deployer wallet becomes the SBT admin and is the system's crown-jewel
> secret. Keep its key in `.env` (gitignored) only, and fund it with Sepolia
> ETH exclusively.
