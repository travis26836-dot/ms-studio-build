---
description: "Clerk authentication setup. Required for app to load. Covers getting API keys from Clerk dashboard and configuring them in .env. Use when the app won't load due to missing Clerk keys or when resetting authentication."
applyTo: "client/src/App.tsx,server/auth.ts,server/index.ts,.env*"
---

# Clerk Authentication Setup

> **Prerequisites:** Follow **02-PROJECT-CONFIGURATION.md** first to set up the basic .env file.
> **Use this guide when:** The app shows "Authentication is not configured"
> message, console shows 404 on Clerk, or you need to reset Clerk keys.

---

## Why Clerk?

The app uses **Clerk** for user authentication. The app **will not load** without valid Clerk API keys.

---

## Step 1: Get Clerk API Keys

### 1.1 Create a Clerk Account (if needed)

Go to <https://dashboard.clerk.com> and sign up.

### 1.2 Create or Open Your Application

1. In Clerk Dashboard, create a new application or select an existing one
2. Name it something like "MS-Build Dev" or "MS-Build Production"

### 1.3 Find Your API Keys

In the Clerk Dashboard:

1. Click **API Keys** (left sidebar)
2. You'll see:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

**Copy both of these.** You'll need them in the next step.

---

## Step 2: Add Keys to `.env.local`

Edit or create `.env.local` in your repository root:

```bash
# Clerk Authentication (get these from https://dashboard.clerk.com)
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

Replace:

- `sk_test_YOUR_SECRET_KEY_HERE` with your actual **Secret Key**
- `pk_test_YOUR_PUBLISHABLE_KEY_HERE` with your actual **Publishable Key**

**Note:** The `VITE_` prefix is required for the Vite frontend to access the key.
**Important:** If the same key exists in both `.env` and `.env.local`,
`.env.local` wins. Remove duplicates to avoid stale or truncated overrides.

---

## Step 3: Configure Clerk Dashboard (Development)

### 3.1 Configure User Redirects (If Needed)

**Most setups work without manual configuration**, but if you see redirect issues:

1. In Clerk Dashboard, go to **Account Portal** → **User Redirects**
2. You should see default settings (`$DEVHOST` for local development). ****This covers your development servers
and you don 't have to worry about redirects for
   development.****

**Note:** Most Clerk setups (including the default) handle redirects automatically without manual configuration.

### 3.2 Check API Keys Are Active

1. In Clerk Dashboard, go to **API Keys** (left sidebar)
2. Verify your keys are visible and not revoked
3. Make sure you're using the correct environment (test vs. live keys)

---

## Step 4: Restart Dev Server

```bash
# Stop current dev server (Ctrl+C)

# Restart
pnpm dev:full
```

---

## Step 5: Verify Authentication

1. Open <http://localhost:3003> in your browser
2. You should see the app load **without** an "Authentication is not configured" message
3. Try signing up or logging in — Clerk sign-in UI should appear

**If authentication still fails:**

- Check browser console for error messages
- Verify all three Clerk env vars are set in `.env.local`
- Ensure Clerk Dashboard URLs include $DEVHOST
- Restart the dev server after making changes

---

## Production Setup (Railway)

### Get Production Keys

1. In Clerk Dashboard, create a **production application** (or switch to production mode)
2. Get the production API keys (starts with `pk_live_` and `sk_live_`)

### Add to Railway

In **Railway Dashboard** → Your Project → **Variables**:

```bash
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
```

### Configure Clerk for Production

1. In Clerk Dashboard, go to **Settings** → **URLs**
2. Add your Railway production domain:
   - **Allowed Origins:** `https://your-railway-domain.com`
   - **Allowed Redirect URLs:** `https://your-railway-domain.com/*`
   - **Allowed Logout Redirect URLs:** `https://your-railway-domain.com`

Replace `your-railway-domain.com` with your actual Railway domain.

---

## Troubleshooting

### "Authentication is not configured"

**Cause:** Missing or invalid Clerk keys

**Fix:**

1. Verify `.env.local` has all three Clerk variables set
2. Verify keys are copied correctly from Clerk Dashboard
3. Restart dev server: `pnpm dev:full`

### 404 on `https://clerk.example.com/...`

**Cause:** Clerk session not initialized

**Fix:**

1. Check that `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env.local`
2. Check browser console for errors
3. Verify Clerk Dashboard **Allowed Origins** includes `http://localhost:3003`

### Sign-in UI doesn't appear

**Cause:** Clerk SDK not loaded or misconfigured

**Fix:**

1. Check that **all three** Clerk env vars are set
2. Open browser DevTools → Console and look for errors
3. Verify `server/auth.ts` imports Clerk middleware correctly
4. Restart dev server

### Redirect loop after sign-in

**Cause:** Redirect URL not in Clerk Dashboard allowed list

**Fix:**

1. In Clerk Dashboard, go to **Settings** → **URLs**
2. Ensure **Allowed Redirect URLs** includes `http://localhost:3003/*` (for dev) or your production domain
3. Restart dev server

---

## Reference: Clerk Environment Variables

| Variable | Purpose | Example |
| -------- | ------- | ------- |
| `CLERK_SECRET_KEY` | Backend API key (keep secret!) | `sk_test_abc...` |
| `CLERK_PUBLISHABLE_KEY` | Frontend key (safe to expose) | `pk_test_xyz...` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend key (Vite-specific) | `pk_test_xyz...` |

**Test Keys** start with `_test_` — use for local development.
**Live Keys** start with `_live_` — use for production only.

---

## Next Steps

- Need database setup? → **04-RAILWAY-DATABASE.md**
- Ready to deploy? → **RAILWAY-VARIABLES-REFERENCE.md**
- Need detailed setup flow? → **DETAILED-LOCAL-AND-RAILWAY.md**
