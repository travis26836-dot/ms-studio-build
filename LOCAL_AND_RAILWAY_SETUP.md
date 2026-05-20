# Local Development & Railway Production Setup

## Important Update

The `.devcontainer` folder and its Docker Compose assets were removed.
This project now uses `pnpm` scripts for local development.

## Quick Start: Local Development

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Run Locally

```bash
pnpm dev:full
```

This starts the local development workflow for the main app and API.

### Step 3: Verify Local Endpoints

- App UI: <http://localhost:3003>
- API: http://localhost:3010
- Environment: `.env.local` (git-ignored)

### Step 4: Stop Everything

Stop the terminal running `pnpm dev:full` (`Ctrl+C`).

---

## Understanding: Local vs Production

### Local Development (Your Computer)
```
.env.local -> pnpm dev:full -> local app + API
```

### Railway Production (Railway Servers)
```
Railway Variables -> build + start -> Railway runtime
```

---

## Setting Up Railway (Step-by-Step)

### Step 1: Create PostgreSQL in Railway

1. Open https://railway.app
2. Open your project
3. Create a PostgreSQL service
4. Railway provides `DATABASE_URL`

### Step 2: Deploy Your Application

Option A (recommended): connect GitHub and deploy from `main`.

Option B (CLI):

```bash
npm i -g @railway/cli
railway login
railway link
railway up
```

### Step 3: Configure Railway Variables

Set required environment variables in Railway Dashboard -> Variables.
Use production values for Clerk, Stripe, and AI providers.

### Step 4: Verify

Check Railway logs for startup and migration success.

Done when:

1. Deployment status is healthy.
2. Logs show app startup without fatal errors.
3. Production URL loads.

---

## Troubleshooting

### Local startup issues

```bash
pnpm install
pnpm check
pnpm dev:full
```

### Railway database issues

1. Ensure PostgreSQL service is attached.
2. Confirm `DATABASE_URL` exists in Railway Variables.
3. Check deployment logs.

---

## File Reference

| File | Purpose | Tracked? |
|------|---------|----------|
| `.env.local` | Local development secrets | No (git-ignored) |
| `.env.example` | Template for developers | Yes |
| `RAILWAY_ENV_SETUP.md` | Detailed Railway docs | Yes |
| `railway.toml` | Railway deployment config | Yes (optional) |

---

## Summary

```
LOCAL DEV                          PRODUCTION (RAILWAY)
├── .env.local                     ├── Railway Variables
├── pnpm dev:full                  ├── railway up / GitHub deploy
├── http://localhost:3003          ├── Railway domain
└── http://localhost:3010          └── Managed PostgreSQL
```
