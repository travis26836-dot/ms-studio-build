# Railway Environment Variables Reference

Complete reference for all environment variables used in Railway production deployment.

---

## Database (Railway Auto-Provided)

```
DATABASE_URL=postgresql://username:password@host:5432/dbname
```

**Notes:**
- Railway auto-generates this when you add a PostgreSQL service
- **Do not manually set this** — Railway manages it
- Format: `postgresql://[user]:[password]@[host]:[port]/[database]`

---

## Application Core

```
NODE_ENV=production
API_PORT=3010
PORT=3010
VITE_API_URL=https://your-railway-domain.com
```

| Variable | Purpose | Value |
|----------|---------|-------|
| `NODE_ENV` | Environment mode | `production` |
| `API_PORT` | Express server port | `3010` |
| `PORT` | Production port | `3010` |
| `VITE_API_URL` | Frontend API endpoint | `https://your-railway-domain.com` |

Replace `your-railway-domain.com` with your actual Railway domain.

---

## Authentication (Clerk)

```
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
```

| Variable | Purpose | Where to Get |
|----------|---------|---|
| `CLERK_SECRET_KEY` | Backend API key (keep secret!) | <https://dashboard.clerk.com> → API Keys → Secret Key |
| `CLERK_PUBLISHABLE_KEY` | Frontend key (safe to expose) | <https://dashboard.clerk.com> → API Keys → Publishable Key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend key (Vite-specific) | Same as CLERK_PUBLISHABLE_KEY |

**Important:** Use **production keys** (start with `pk_live_` and `sk_live_`), not test keys.

---

## Stripe Subscription Billing

```
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_live_YOUR_PRODUCTION_WEBHOOK_SECRET
STRIPE_PRICE_AI_CREDIT_PACK=price_YOUR_PRODUCTION_PRICE_ID
```

| Variable | Purpose | Where to Get |
|----------|---------|---|
| `STRIPE_SECRET_KEY` | Backend API key (keep secret!) | <https://dashboard.stripe.com> → Developers → API Keys → Secret Key |
| `STRIPE_PUBLISHABLE_KEY` | Frontend key (safe to expose) | <https://dashboard.stripe.com> → Developers → API Keys → Publishable Key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | <https://dashboard.stripe.com> → Developers → Webhooks → Signing Secret |
| `STRIPE_PRICE_AI_CREDIT_PACK` | Price ID for subscription | <https://dashboard.stripe.com> → Products → Select product → Pricing → Price ID |

**Important:** Use **production keys** (start with `sk_live_` and `pk_live_`), not test keys.

---

## AI Provider

```
GOOGLE_GENERATIVE_AI_API_KEY=your_production_key
AI_CREDIT_PACKS_ENABLED=true
```

| Variable | Purpose | Where to Get |
|----------|---------|---|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key | <https://ai.google.dev> → API Keys |
| `AI_CREDIT_PACKS_ENABLED` | Enable credit pack feature | `true` or `false` |

---

## Complete Production `.env` Template

```bash
# Database (Railway provides this - do not set manually)
DATABASE_URL=postgresql://username:password@host:5432/dbname

# Application
NODE_ENV=production
API_PORT=3010
PORT=3010
VITE_API_URL=https://your-railway-domain.com

# Clerk Authentication (Production Keys)
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY

# Stripe Billing (Production Keys)
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_live_YOUR_PRODUCTION_WEBHOOK_SECRET
STRIPE_PRICE_AI_CREDIT_PACK=price_YOUR_PRODUCTION_PRICE_ID

# AI Provider
GOOGLE_GENERATIVE_AI_API_KEY=your_production_key
AI_CREDIT_PACKS_ENABLED=true
```

---

## How to Set Variables in Railway

1. Go to **Railway Dashboard**
2. Select your project
3. Click on your **application service**
4. Click the **Variables** tab
5. Click **New Variable** for each variable
6. Paste the key and value
7. Click **Save**

---

## Important Notes

### Keep Secrets Safe

- **Never commit `.env` files to Git**
- **Never share `CLERK_SECRET_KEY` or `STRIPE_SECRET_KEY`**
- Use Railway's **Variables** tab only — not `.env` files
- Railway injects these at runtime

### Test vs Production Keys

- **Local Development:** Use test keys (start with `_test_`)
- **Production (Railway):** Use production keys (start with `_live_`)
- Never use test keys in production
- Never use production keys locally

### Database URL

Railway auto-provides `DATABASE_URL`. If you need to check it:

1. Go to **Railway Dashboard** → Your Project
2. Click **PostgreSQL** service
3. The connection string is in the **Variables** tab (or connection details)

### Verification

Once all variables are set:

1. Deploy to Railway (push to GitHub or `railway up`)
2. Check **Deployments** → Latest should be successful
3. Check **Logs** for errors
4. Visit your production URL — app should load

---

## Troubleshooting

### "Environment variable not found"

**Cause:** Variable not set in Railway Dashboard

**Fix:**
1. Check Railway Dashboard → Variables tab
2. Verify variable name is spelled correctly
3. Ensure value is not empty
4. Restart deployment

### "Invalid API Key"

**Cause:** Using test keys in production or wrong key

**Fix:**
1. Verify key starts with `_live_` (not `_test_`)
2. Verify key is for production account
3. Copy the full key from service dashboard
4. Update in Railway Variables

### App won't load

**Cause:** Missing required variables

**Fix:**
1. Check Railway **Logs** for error messages
2. Verify all required variables are set
3. Common missing: `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `DATABASE_URL`
4. Redeploy after fixing

---

## Related Documentation

- **02-PROJECT-CONFIGURATION.md** — Full environment setup
- **03-CLERK-AUTHENTICATION.md** — Clerk configuration
- **05-STRIPE-SETUP.md** — Stripe configuration
- **DETAILED-LOCAL-AND-RAILWAY.md** — Complete setup flow
