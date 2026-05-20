# Detailed: Local Development & Railway Production Setup

Complete step-by-step guide for all environments.

## Understanding: Local vs Production

### Local Development (Your Computer)
```
.env.local → pnpm dev:full → local app + API
- Database: localhost:5432
- App UI: <http://localhost:3003>
- API: <http://localhost:3010>
```

### Railway Production (Railway Servers)
```
Railway Variables → build + start → Railway runtime
- Database: Railway PostgreSQL (managed)
- API: https://your-railway-domain.com
```

---

## Quick Start: Local Development

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Set Up Local Database

**Option A: Docker (Recommended)**

```bash
docker run --name ms-build-postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:16
```

**Option B: Local PostgreSQL Installation**

Install PostgreSQL 16+ and create a database `ms_build`.

### Step 3: Create `.env.local`

```bash
# Database (from Step 2)
DATABASE_URL=postgresql://postgres:password@localhost:5432/ms_build

# Clerk (get from https://dashboard.clerk.com)
CLERK_SECRET_KEY=sk_test_YOUR_TEST_KEY
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY

# API
API_PORT=3010
NODE_ENV=development
VITE_API_URL=http://localhost:3010

# Stripe (get from https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_TEST_SECRET

# AI (optional)
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
AI_CREDIT_PACKS_ENABLED=true
STRIPE_PRICE_AI_CREDIT_PACK=price_test_YOUR_PRICE_ID
```

### Step 4: Run Migrations

```bash
pnpm exec prisma migrate deploy
```

### Step 5: Start Local Dev

```bash
pnpm dev:full
```

**Done!** App is running:
- App: http://localhost:3003
- API: http://localhost:3010

---

## Understanding: Local vs Production

### Local Development
```
.env.local -> pnpm dev:full -> local app + API
```

### Railway Production
```
Railway Variables -> build + start -> Railway runtime
```

---

## Setting Up Railway (Step-by-Step)

### Step 1: Create PostgreSQL in Railway

1. Open https://railway.app
2. Open your project
3. Click **New** → Select **Database** → **PostgreSQL**
4. Railway creates a PostgreSQL service
5. Railway provides `DATABASE_URL` (appears in Variables)

### Step 2: Deploy Your Application

**Option A: GitHub Integration (Recommended)**

1. Push your code to GitHub
2. In Railway Dashboard, connect GitHub repo
3. Railway auto-deploys on push to `main`

**Option B: Railway CLI**

```bash
npm i -g @railway/cli
railway login
railway link
railway up
```

### Step 3: Configure Railway Variables

Set required environment variables in **Railway Dashboard** → Your Project → **Variables**.

**Database (Railway will provide this)**
```
DATABASE_URL=postgresql://username:password@host:5432/dbname
```

**Application**
```
NODE_ENV=production
API_PORT=3010
PORT=3010
VITE_API_URL=https://your-railway-domain.com
```

**Authentication (Production Keys)**
```
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
```

**Stripe (Production Keys)**
```
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
STRIPE_WEBHOOK_SECRET=whsec_live_YOUR_PRODUCTION_SECRET
STRIPE_PRICE_AI_CREDIT_PACK=price_YOUR_PRODUCTION_PRICE
```

**AI & Third-Party (Production Keys)**
```
GOOGLE_GENERATIVE_AI_API_KEY=your_production_key
AI_CREDIT_PACKS_ENABLED=true
```

### Step 4: Verify Deployment

1. Check Railway Dashboard → **Deployments**
2. Latest deployment should show **successful**
3. Check **Logs** for startup without fatal errors
4. Visit your production URL — app should load

---

## Important: .env File Handling

**Local Development:**
- Use `.env.local` (git-ignored) for local `pnpm` workflows
- This is never pushed to Git

**Railway:**
- Railway IGNORES `.env` files (by design)
- All environment variables come from Railway Dashboard
- This keeps secrets out of your repository

---

## Local Development vs Production Checklist

| Item | Local (.env.local) | Production (Railway) |
|------|---|---|
| Database | `localhost:5432` | Railway PostgreSQL (auto) |
| Clerk Keys | Test keys (pk_test_/sk_test_) | Production keys (pk_live_/sk_live_) |
| Stripe Keys | Test keys (sk_test_/pk_test_) | Production keys (sk_live_/pk_live_) |
| NODE_ENV | development | production |
| VITE_API_URL | http://localhost:3010 | https://your-railway-domain.com |
| Where stored | `.env.local` file (git-ignored) | Railway Dashboard Variables |

---

## Troubleshooting

### Local startup issues

```bash
pnpm install
pnpm check
pnpm dev:full
```

### Local database issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not, start it
docker run --name ms-build-postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:16

# Check DATABASE_URL in .env.local
echo $DATABASE_URL

# Run migrations
pnpm exec prisma migrate deploy
```

### Railway database connection issues

1. Ensure PostgreSQL service is added to Railway project
2. Confirm `DATABASE_URL` exists in Railway Variables
3. Check deployment logs for connection errors
4. Railway PostgreSQL may take 30-60 seconds to start

### Railway authentication issues

1. Verify Clerk production keys are in Railway Variables
2. Configure Clerk Dashboard **Allowed Origins** with Railway domain
3. Check Railway logs for auth errors

### Railway build failures

1. Check Railway **Logs** tab for build errors
2. Ensure `pnpm build` succeeds locally
3. Verify all required env vars are set
4. Check for missing dependencies

---

## File Reference

| File | Purpose | Tracked? | Local/Production |
|------|---------|---|---|
| `.env.local` | Local development environment | No (git-ignored) | Local only |
| `.env` | Shared defaults | Yes (optional) | Both |
| `.env.example` | Template for developers | Yes | Reference |
| `railway.toml` | Railway deployment config | Yes (optional) | Both |
| `INSTRUCTIONS/` | Setup documentation | Yes | Reference |

---

## Summary

```
LOCAL DEV                          PRODUCTION (RAILWAY)
├── .env.local                     ├── Railway Variables
├── pnpm dev:full                  ├── railway up / GitHub deploy
├── http://localhost:3003          ├── Railway domain
└── http://localhost:3010          └── Managed PostgreSQL
```

For more detailed information on specific topics:
- **02-PROJECT-CONFIGURATION.md** — Environment setup & build
- **03-CLERK-AUTHENTICATION.md** — Auth configuration
- **04-RAILWAY-DATABASE.md** — Database & Prisma setup
- **05-STRIPE-SETUP.md** — Payment integration
