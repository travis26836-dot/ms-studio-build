# Railway Production Environment Setup

This document explains how to configure your Railway deployment separate from local development.

## Key Principle

**Local Development** (`.env.local` + `pnpm dev:full`) and **Railway Production** use DIFFERENT environments.

## How Railway Works

1. **Repository Connection**: Railway pulls your code from GitHub
2. **Build**: Railway builds from repository configuration
3. **Environment Variables**: Railway injects these into the running container (not from `.env` file)
4. **Deployment**: Runs your container with Railway-provided database

## Required Railway Environment Variables

Set these in the **Railway Dashboard** → Your Project → Variables:

### Database (Railway will provide this)
```
DATABASE_URL=postgresql://username:password@host:5432/dbname
```
*Railway auto-creates this when you add a PostgreSQL plugin. Don't manually set this.*

### Application
```
NODE_ENV=production
API_PORT=3010
PORT=3010
VITE_API_URL=https://your-railway-domain.com
```

### Authentication (Production Keys)
```
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
```
*Get these from Clerk dashboard for your production app*

### Stripe (Production Keys)
```
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET
```
*Get these from Stripe dashboard for your production account*

### AI & Third-Party (Production Keys)
```
GOOGLE_GENERATIVE_AI_API_KEY=your_production_key
AI_CREDIT_PACKS_ENABLED=true
STRIPE_PRICE_AI_CREDIT_PACK=price_YOUR_PRODUCTION_PRICE
```

## Step-by-Step Railway Configuration

### 1. Add PostgreSQL to Your Railway Project
- Go to Railway Dashboard
- Select your project
- Click "New" → Select "Database" → PostgreSQL
- Railway auto-generates `DATABASE_URL` — it appears in Variables

### 2. Set Environment Variables
- Dashboard → Your Project → Variables tab
- Click "New Variable" for each required variable above
- Paste production keys from your third-party services

### 3. Deploy
- Push code to your GitHub repo, or run Railway CLI deploy.
- Railway auto-deploys when you push (if configured).
- Verify in Railway Dashboard -> Deployments.

### 4. Verify

Deployment is complete when all are true:

1. Latest deployment status is successful.
2. Logs show app startup without fatal errors.
3. Production URL is reachable.

## Important: .env File Handling

**Local Development:**
- Use `.env.local` (or `.env`) for local `pnpm` workflows
- This is git-ignored and never pushed

**Railway:**
- Railway IGNORES `.env` files (by design)
- All environment variables come from the Dashboard
- This keeps secrets out of your repository

## Verify Deployment

Once deployed to Railway:
```bash
# Check logs in Railway Dashboard → Logs tab
# Look for:
# - "Listening on port 3010"
# - "Prisma migrations completed"
# - No database connection errors
```

## Common Issues

### "Can't reach database server"
- Railway PostgreSQL not added yet → Add it in Dashboard
- DATABASE_URL not set → Check Railway Variables tab
- Database still spinning up → Wait 30-60 seconds, refresh logs

### "Invalid API keys"
- Using test keys instead of production keys
- Check that Clerk/Stripe production keys are in Railway Variables

### App crashes immediately
- Check Railway Logs tab for error messages
- Verify all required variables are set
- Confirm DATABASE_URL is correct format

## Local Development vs Production Checklist

| Item | Local (.env.local) | Production (Railway) |
|------|---|---|
| Database | `localhost:5432` | Railway PostgreSQL (auto) |
| Clerk Keys | Test keys (pk_test_/sk_test_) | Production keys (pk_live_/sk_live_) |
| Stripe Keys | Test keys (sk_test_/pk_test_) | Production keys (sk_live_/pk_live_) |
| NODE_ENV | development | production |
| VITE_API_URL | http://localhost:3010 | https://your-railway-domain.com |
| Where stored | `.env.local` file (git-ignored) | Railway Dashboard Variables |

## Running Locally to Test Production Config

To simulate what Railway will do:
```bash
# Create a .env.production file with YOUR Railway values
# Then use your local start flow with those values loaded
# (example shell loading varies by OS and terminal)
# Do not commit .env.production to git
```
