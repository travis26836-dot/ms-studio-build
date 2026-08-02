# Detailed: Local Development & Railway Production Setup

Complete step-by-step guide for all environments.

## Understanding: Local vs Production

### Local Development (Your Computer)

.env.local → pnpm run dev:full → local app + API

- Database: localhost:5432
- App UI: <http://localhost:3003>
- API: <http://localhost:3010>

### Railway Production (Railway Servers)

Railway Variables → build + start → Railway runtime

- Database: Railway PostgreSQL (managed)
- API: <https://your-railway-domain.com>

---

## Quick Start: Local Development

### Step 1: Install Dependencies

```bash
pnpm install
```

### Step 2: Set Up Local Database

Install PostgreSQL 16 or later on your system:

**macOS (via Homebrew):**

```bash
brew install postgresql@16
brew services start postgresql@16
```

**Windows:**

Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

Then create a database:

```bash
psql -U postgres -c "CREATE DATABASE ms_build;"
```

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

# AI (optional, OpenAI-compatible Veronica AI endpoint)
VERONICA_AI_API_KEY=your_api_key_here
VERONICA_AI_BASE_URL=https://your-veronica-api.example/v1
AI_TEXT_MODEL=veronica-text
AI_IMAGE_MODEL=veronica-image
AI_CREDIT_PACKS_ENABLED=true
STRIPE_PRICE_AI_CREDIT_PACK=price_test_YOUR_PRICE_ID
```

### Step 4: Run Migrations

```bash
pnpm exec prisma migrate deploy
```

### Step 5: Start Local Dev

```bash
pnpm run dev:full
```

**Done!** App is running:

- App: <http://localhost:3003>
- API: <http://localhost:3010>

---

## Setting Up Railway (Step-by-Step)

### Step 1: Create PostgreSQL in Railway

1. Open <https://railway.app>
2. Open your project
3. Click **New** → Select **Database** → **PostgreSQL**
4. Railway creates a PostgreSQL service
5. Railway exposes `DATABASE_URL` in the PostgreSQL service's Variables tab

### Step 2: Deploy Your Application

#### Option A: GitHub Integration (Recommended)

1. Push your code to GitHub
2. In Railway Dashboard, connect GitHub repo
3. Railway auto-deploys on push to `main`

#### Option B: Railway CLI

```bash
pnpm add -g @railway/cli
railway login
railway link
railway up
```

### Step 3: Configure Railway Variables

Set required environment variables in the correct Railway service. Variables
belonging to PostgreSQL are not automatically injected into the API service.

#### Database (set on the application/API service)

Use **Add Reference Variable** and select `DATABASE_URL` from the PostgreSQL
service:

```dotenv
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

`Postgres` above is the default service name; select the database service used
by this environment.

#### Application/API Service

```dotenv
NODE_ENV=production
API_PORT=3010
PORT=3010
CUSTOMER_PORTAL_URL=https://your-customer-portal-domain.com
```

#### Customer Portal Service

These values are compiled into the portal frontend at build time, so redeploy
the portal after changing them:

```dotenv
VITE_API_URL=https://your-api-domain.com
VITE_MAIN_APP_URL=https://your-main-app-domain.com
```

#### Authentication (Production Keys)

```bash
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
```

#### Stripe (Production Keys)

```bash
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
STRIPE_WEBHOOK_SECRET=whsec_live_YOUR_PRODUCTION_SECRET
STRIPE_PRICE_AI_CREDIT_PACK=price_YOUR_PRODUCTION_PRICE
```

#### AI & Third-Party (Production Keys)

```bash
VERONICA_AI_API_KEY=your_production_key
VERONICA_AI_BASE_URL=https://your-veronica-api.example/v1
AI_CREDIT_PACKS_ENABLED=true
```

### Step 4: Apply Database Migrations

Configure this as the application/API service **Pre-deploy Command**:

```bash
pnpm exec prisma migrate deploy
```

Alternatively, run it from a terminal linked to that Railway service:

```bash
railway run pnpm exec prisma migrate deploy
```

### Step 5: Verify Deployment

1. Check Railway Dashboard → **Deployments**
2. Latest deployment should show **successful**
3. Check **Logs** for startup without fatal errors
4. Visit `https://your-api-domain.com/api/health`; it should return JSON
5. Visit the customer portal; saved designs should load

---

## Important: .env File Handling

**Local Development:**

- Use `.env.local` (git-ignored) for local `pnpm` workflows
- Use `.env.local` (git-ignored) for local `pnpm` workflows
- This is never pushed to Git

**Railway:**

- Railway service variables are the deployed source of truth
- Environment files from a connected repository may be suggested for import,
  but do not replace correctly scoped service/reference variables
- This keeps secrets out of your repository

---

## Local Development vs Production Checklist

| Item         | Local (.env.local)              | Production (Railway)                          |
| ------------ | ------------------------------- | --------------------------------------------- |
| Database     | `localhost:5432`                | API reference to `${{Postgres.DATABASE_URL}}` |
| Clerk Keys   | Test keys (pk*test*/sk*test*)   | Production keys (pk*live*/sk*live*)           |
| Stripe Keys  | Test keys (sk*test*/pk*test*)   | Production keys (sk*live*/pk*live*)           |
| NODE_ENV     | development                     | production                                    |
| VITE_API_URL | <http://localhost:3010>         | Portal service -> public API domain           |
| Where stored | `.env.local` file (git-ignored) | Railway Dashboard Variables                   |

---

## Troubleshooting

### Local startup issues

```bash
pnpm install
pnpm run check
pnpm run dev:full
```

### Local database issues

```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1;"

# If not running, start it
# macOS: brew services start postgresql@16
# Linux: sudo systemctl start postgresql
# Windows: Check Services or use pg_ctl start

# Check DATABASE_URL in .env.local
echo $DATABASE_URL

# Run migrations
pnpm exec prisma migrate deploy
```

### Railway database connection issues

1. Ensure PostgreSQL service is added to Railway project
2. Confirm the application/API service references the PostgreSQL
   `DATABASE_URL`
3. Run `pnpm exec prisma migrate deploy` for the API service
4. Check deployment logs for connection errors

### Railway customer portal "Failed to fetch"

1. Verify the portal service has
   `VITE_API_URL=https://your-api-domain.com`, then redeploy it
2. Verify the API service has
   `CUSTOMER_PORTAL_URL=https://your-customer-portal-domain.com`
3. Check `https://your-api-domain.com/api/health` for JSON before debugging
   database errors

### Railway authentication issues

1. Verify Clerk production keys are in Railway Variables
2. Configure Clerk Dashboard **Allowed Origins** with Railway domain
3. Check Railway logs for auth errors

### Railway build failures

1. Check Railway **Logs** tab for build errors
2. Ensure `pnpm run build` succeeds locally
3. Verify all required env vars are set
4. Check for missing dependencies

---

## File Reference

| File            | Purpose                       | Tracked?         | Local/Production |
| --------------- | ----------------------------- | ---------------- | ---------------- |
| `.env.local`    | Local development environment | No (git-ignored) | Local only       |
| `.env`          | Shared defaults               | Yes (optional)   | Both             |
| `.env.example`  | Template for developers       | Yes              | Reference        |
| `railway.toml`  | Railway deployment config     | Yes (optional)   | Both             |
| `INSTRUCTIONS/` | Setup documentation           | Yes              | Reference        |

---

## Summary

```bash
LOCAL DEV                          PRODUCTION (RAILWAY)
├── .env.local                     ├── Railway Variables
├── pnpm run dev:full              ├── railway up / GitHub deploy
├── http://localhost:3003          ├── Railway domain
└── http://localhost:3010          └── Managed PostgreSQL
```

For more detailed information on specific topics:

- **02-PROJECT-CONFIGURATION.md** — Environment setup & build
- **03-CLERK-AUTHENTICATION.md** — Auth configuration
- **04-RAILWAY-DATABASE.md** — Database & Prisma setup
- **05-STRIPE-SETUP.md** — Payment integration
