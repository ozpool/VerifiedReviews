# Deploying VerifiedReviews

Two services, one repo:

| Part  | Host   | Why                                                                                                   |
| ----- | ------ | ----------------------------------------------------------------------------------------------------- |
| `web` | Vercel | Next.js, first-class support.                                                                         |
| `api` | Render | Long-running Express server (it runs the indexer + minter refiller loops, so it can't be serverless). |

The contracts are already live on Arbitrum Sepolia; nothing to deploy there.

---

## 0. Prerequisites (one-time)

- **MongoDB Atlas → Network Access:** add `0.0.0.0/0` (Render free has no static
  egress IP). Confirm the `MONGO_URI` user/password.
- **Privy dashboard:** once you know the Vercel URL, add it to **Allowed Domains**
  and keep **Google + Email** login enabled.

---

## 1. API on Render

1. New → **Blueprint**, point it at this repo. Render reads `render.yaml` and
   creates the **vr-api** service.
2. It will prompt for every `sync: false` var. Set them (values come from your
   working `packages/api/.env`):

   | Var                                 | Value                                                                 |
   | ----------------------------------- | --------------------------------------------------------------------- |
   | `MONGO_URI`                         | your Atlas connection string                                          |
   | `JWT_SECRET`                        | long random string                                                    |
   | `APP_DOMAIN`                        | your Vercel host, e.g. `vr-web.vercel.app`                            |
   | `CORS_ORIGIN`                       | your Vercel URL, e.g. `https://vr-web.vercel.app` (**not** localhost) |
   | `RPC_URL` / `INDEXER_RPC_URL`       | your Alchemy Arbitrum Sepolia URL                                     |
   | `SBT_ADDRESS` / `REGISTRY_ADDRESS`  | the live contract addresses                                           |
   | `MINTER_MNEMONIC`                   | the master mnemonic                                                   |
   | `ADMIN_PRIVATE_KEY`                 | the deployer/treasury key                                             |
   | `BADGE_HMAC_KEY`                    | long random string (**required in prod**)                             |
   | `PRIVY_APP_ID` / `PRIVY_APP_SECRET` | from the Privy dashboard                                              |
   | `GAS_TANK_PRIVATE_KEY`              | the gas-tank wallet key                                               |

   (Minter-funding and customer-limit vars have safe defaults — only set them to
   override.)

3. Deploy. The health check hits `/ready`; it goes green once Mongo connects.
4. Note the service URL, e.g. `https://vr-api.onrender.com`.
5. **Seed the admin** once (Render → Shell, or run locally against the prod DB):
   `pnpm -F @vr/api seed:admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` set.

> Render free sleeps after ~15 min idle — the first request and the indexer
> resume on wake. Fine for a demo; upgrade the plan to keep it always-on.

---

## 2. Web on Vercel

1. New Project → import this repo.
2. **Root Directory:** `packages/web`. Framework preset: **Next.js** (auto).
   Leave build/install commands default — Vercel detects the pnpm workspace and
   installs `@vr/shared` for you.
3. Set environment variables (these are baked in at build, so set them first):

   | Var                            | Value                                             |
   | ------------------------------ | ------------------------------------------------- |
   | `NEXT_PUBLIC_API_URL`          | the Render API URL from step 1.4                  |
   | `NEXT_PUBLIC_PRIVY_APP_ID`     | same Privy app id                                 |
   | `NEXT_PUBLIC_RPC_URL`          | your Alchemy Arbitrum Sepolia URL                 |
   | `NEXT_PUBLIC_SBT_ADDRESS`      | live SBT address                                  |
   | `NEXT_PUBLIC_REGISTRY_ADDRESS` | live registry address                             |
   | `NEXT_PUBLIC_APP_URL`          | the Vercel URL (e.g. `https://vr-web.vercel.app`) |

4. Deploy. Copy the final URL.

---

## 3. Wire the two together

- Set Render's `CORS_ORIGIN` **and** `APP_DOMAIN` to the real Vercel URL/host
  (redeploy the API after changing them).
- Add the Vercel URL to Privy **Allowed Domains**.
- Fund the wallets with Arbitrum Sepolia ETH if not already: the **admin/treasury**
  (pays approvals + minter funding) and the **gas-tank** (funds customers). The
  minter refiller tops business minters up automatically once the API is running.

---

## 4. Smoke test

1. Open the Vercel URL → Browse loads.
2. Sign in with Google → "Show your code".
3. Staff (`/scan`) mints → review page flips to "verified" → submit (no popup, no
   fee) → review appears after the indexer confirms it.
