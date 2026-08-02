# Railway Environment Variables Reference

Complete reference for all environment variables used in Railway production deployment.

---

## Database (API Service Reference to PostgreSQL)

Set this on the **application/API service**, using **Add Reference Variable** and
selecting `DATABASE_URL` from the PostgreSQL service:

```dotenv
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Notes:**

- Railway generates `DATABASE_URL` on the PostgreSQL service.
- The application service does not receive another service's variable until you
  add the reference variable there. `Postgres` above is the database service
  name; use the name shown in your Railway project.
- Prefer the reference variable over copying a literal connection string so
  credential rotations stay synchronized.
- Format: `postgresql://[user]:[password]@[host]:[port]/[database]`

---

## Application Core

```dotenv
# Application/API service
NODE_ENV=production
API_PORT=3010
PORT=3010
CUSTOMER_PORTAL_URL=https://your-customer-portal-domain.com

# Customer portal service (Vite build variable)
VITE_API_URL=https://your-api-domain.com
```

| Variable              | Purpose                                             | Value                                     |
| --------------------- | --------------------------------------------------- | ----------------------------------------- |
| `NODE_ENV`            | Environment mode                                    | `production`                              |
| `API_PORT`            | Express server port                                 | `3010`                                    |
| `PORT`                | Production port                                     | `3010`                                    |
| `CUSTOMER_PORTAL_URL` | Origin permitted to call the API                    | `https://your-customer-portal-domain.com` |
| `VITE_API_URL`        | Portal frontend API endpoint, set on portal service | `https://your-api-domain.com`             |

Replace the placeholder domains with the public domains for the API and
customer portal services.

---

## Authentication (Clerk)

```dotenv
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
```

| Variable                     | Purpose                        | Where to Get                                               |
| ---------------------------- | ------------------------------ | ---------------------------------------------------------- |
| `CLERK_SECRET_KEY`           | Backend API key (keep secret!) | <https://dashboard.clerk.com> → API Keys → Secret Key      |
| `CLERK_PUBLISHABLE_KEY`      | Frontend key (safe to expose)  | <https://dashboard.clerk.com> → API Keys → Publishable Key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend key (Vite-specific)   | Same as CLERK_PUBLISHABLE_KEY                              |

**Important:** Use **production keys** (start with `pk_live_` and `sk_live_`), not test keys.

---

## Stripe Subscription Billing

```dotenv
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_live_YOUR_PRODUCTION_WEBHOOK_SECRET
STRIPE_PRICE_AI_CREDIT_PACK=price_YOUR_PRODUCTION_PRICE_ID
```

| Variable                      | Purpose                        | Where to Get                                                                    |
| ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`           | Backend API key (keep secret!) | <https://dashboard.stripe.com> → Developers → API Keys → Secret Key             |
| `STRIPE_PUBLISHABLE_KEY`      | Frontend key (safe to expose)  | <https://dashboard.stripe.com> → Developers → API Keys → Publishable Key        |
| `STRIPE_WEBHOOK_SECRET`       | Webhook signing secret         | <https://dashboard.stripe.com> → Developers → Webhooks → Signing Secret         |
| `STRIPE_PRICE_AI_CREDIT_PACK` | Price ID for subscription      | <https://dashboard.stripe.com> → Products → Select product → Pricing → Price ID |

**Important:** Use **production keys** (start with `sk_live_` and `pk_live_`), not test keys.

---

## AI Provider

```dotenv
VERONICA_AI_API_KEY=your_production_key
VERONICA_AI_BASE_URL=https://your-veronica-api.example/v1
AI_CREDIT_PACKS_ENABLED=true
```

| Variable                       | Purpose                    | Where to Get                       |
| ------------------------------ | -------------------------- | ---------------------------------- |
| `VERONICA_AI_API_KEY`          | Veronica AI API key        | Veronica AI account                 |
| `VERONICA_AI_BASE_URL`         | OpenAI-compatible API URL  | Veronica AI account                 |
| `AI_CREDIT_PACKS_ENABLED`      | Enable credit pack feature | `true` or `false`                  |

---

## Complete Production Variables Template

Set backend variables on the **application/API service**:

```dotenv
# Database reference selected from the PostgreSQL service
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Application
NODE_ENV=production
API_PORT=3010
PORT=3010
CUSTOMER_PORTAL_URL=https://your-customer-portal-domain.com

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
VERONICA_AI_API_KEY=your_production_key
VERONICA_AI_BASE_URL=https://your-veronica-api.example/v1
AI_CREDIT_PACKS_ENABLED=true
```

Set frontend build variables on the **customer portal service**:

```dotenv
VITE_API_URL=https://your-api-domain.com
VITE_MAIN_APP_URL=https://your-main-app-domain.com
```

---

## How to Set Variables in Railway

1. Go to **Railway Dashboard**
2. Select your project
3. Click your **application/API service** and open the **Variables** tab
4. Add `DATABASE_URL` as a reference to the PostgreSQL service's
   `DATABASE_URL`
5. Add the remaining API variables, including `CUSTOMER_PORTAL_URL`
6. Click your **customer portal service** and add its `VITE_API_URL` and
   `VITE_MAIN_APP_URL` build variables
7. Review and deploy the staged variable changes

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

Railway provides `DATABASE_URL` on the PostgreSQL service. To make it available
to the API:

1. Go to **Railway Dashboard** → Your Project
2. Click the **application/API** service → **Variables**
3. Add Reference Variable → select **Postgres** → `DATABASE_URL`
4. Redeploy the API service

### Verification

Once all variables are set:

1. Deploy to Railway (push to GitHub or `railway up`)
2. Check **Deployments** → Latest should be successful
3. Check **Logs** for errors
4. Visit `https://your-api-domain.com/api/health` and confirm it returns JSON
5. Visit the customer portal and confirm its workspace loads

---

## Troubleshooting

### "Environment variable not found"

**Cause:** Variable not set in Railway Dashboard

**Fix:**

1. Check Railway Dashboard → the failing service's Variables tab
2. Verify variable name is spelled correctly
3. Ensure value is not empty
4. For `DATABASE_URL`, ensure the API service references the PostgreSQL service
5. Redeploy after applying staged changes

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

### Customer portal shows "Failed to fetch"

**Cause:** The portal browser cannot reach its API endpoint or the API does not
allow the portal origin. A PostgreSQL error normally returns an HTTP error from
the reachable API instead of a browser-level fetch failure.

**Fix:**

1. On the portal service, set `VITE_API_URL=https://your-api-domain.com` and
   redeploy so Vite rebuilds the frontend
2. On the API service, set
   `CUSTOMER_PORTAL_URL=https://your-customer-portal-domain.com`
3. Confirm `https://your-api-domain.com/api/health` returns JSON
4. Check API deployment logs for Prisma or migration errors only after the
   browser can reach the API

---

## Related Documentation

- **02-PROJECT-CONFIGURATION.md** — Full environment setup
- **03-CLERK-AUTHENTICATION.md** — Clerk configuration
- **05-STRIPE-SETUP.md** — Stripe configuration
- **DETAILED-LOCAL-AND-RAILWAY.md** — Complete setup flow
