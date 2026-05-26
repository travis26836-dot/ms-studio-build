---
description: "Feature-specific guide for Stripe subscription integration. Use after completing 02-PROJECT-CONFIGURATION.md and 04-RAILWAY-DATABASE.md. Covers webhook setup, checkout flow, plan-gating, and Stripe environment variables."
applyTo: "server/index.ts,server/**"
---

# Stripe Integration Guide

> **Prerequisites:** Follow **02-PROJECT-CONFIGURATION.md** and
> **04-RAILWAY-DATABASE.md** first to set up database and Prisma schema.
> **Use this guide when:** Setting up Stripe subscriptions, configuring webhook handlers,
> implementing checkout, managing subscription tiers, or troubleshooting billing issues.

---

## Stripe Overview

This app uses **Stripe** for subscription billing. Key components:

- **Products & Prices** — Subscription tiers (Basic, Pro, Enterprise)
- **Customers** — Track user subscriptions
- **Webhooks** — Listen for subscription events (created, updated, cancelled)
- **Checkout Sessions** — Redirect users to Stripe checkout

---

## Step 1: Get Stripe API Keys

### 1.1 Create a Stripe Account

Go to <https://stripe.com> and sign up.

### 1.2 Find Your API Keys

1. Go to <https://dashboard.stripe.com>
2. Click **Developers** (top right)
3. Click **API Keys**
4. You'll see:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

**Copy both of these.**

---

## Step 2: Add Keys to `.env.local`

Edit `.env.local` in your repository root:

```bash
# Stripe (get these from https://dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET_HERE
```

### Get Webhook Secret

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. For local testing, use **Stripe CLI** (see below)
4. Copy the **Signing Secret** (starts with `whsec_test_`)

---

## Step 3: Create Products & Prices

### 3.1 Create a Product

1. Go to Stripe Dashboard → **Products**
2. Click **+ Add product**
3. Name: "AI Credit Pack" (or your subscription name)
4. Description: "Purchase AI credits"
5. Price: $10 (example)
6. Recurring: **Monthly**
7. Click **Save product**

### 3.2 Get Price ID

After creating the product:

1. Click into the product
2. Under **Pricing** section, copy the **Price ID** (starts with `price_`)
3. Add to `.env.local`:

```bash
STRIPE_PRICE_AI_CREDIT_PACK=price_YOUR_PRICE_ID_HERE
```

---

## Step 4: Configure Webhook

### Option A: Stripe CLI (Local Development)

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Windows: Download from https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Listen for webhooks
stripe listen --forward-to localhost:3010/api/webhooks/stripe
```

Copy the signing secret and add to `.env.local`.

### Option B: Manual Testing

Skip webhook testing during development and come back to it for production.

---

## Step 5: Implement Checkout Flow

### Server Route: Create Checkout Session

In `server/index.ts`:

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/api/checkout", auth(), async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    customer_email: req.auth.sessionClaims.email,
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_AI_CREDIT_PACK,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: "http://localhost:3003/checkout/success",
    cancel_url: "http://localhost:3003/checkout/cancel",
  });

  res.json({ url: session.url });
});
```

### Client Route: Redirect to Checkout

In React component:

```typescript
const handleCheckout = async () => {
  const response = await fetch("/api/checkout", { method: "POST" });
  const { url } = await response.json();
  window.location.href = url;
};

return <button onClick={handleCheckout}>Upgrade to Pro</button>;
```

---

## Step 6: Handle Webhook Events

### Webhook Route

In `server/index.ts`:

```typescript
app.post("/api/webhooks/stripe", express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle events
  switch (event.type) {
    case "customer.subscription.created":
      console.log("Subscription created:", event.data.object);
      break;
    case "customer.subscription.updated":
      console.log("Subscription updated:", event.data.object);
      break;
    case "customer.subscription.deleted":
      console.log("Subscription cancelled:", event.data.object);
      break;
  }

  res.json({ received: true });
});
```

---

## Environment Variables Reference

- `STRIPE_SECRET_KEY`: Backend API key (keep secret). Example: `sk_test_abc...`
- `STRIPE_PUBLISHABLE_KEY`: Frontend key (safe to expose). Example: `pk_test_xyz...`
- `STRIPE_WEBHOOK_SECRET`: Webhook signing secret. Example: `whsec_test_123...`
- `STRIPE_PRICE_AI_CREDIT_PACK`: Price ID for subscription. Example: `price_abc123xyz...`
- `AI_CREDIT_PACKS_ENABLED`: Enable credit pack feature. Example: `true` or `false`

---

## Production Setup (Railway)

### 1. Get Production Keys

1. In Stripe Dashboard → **Developers** → **API Keys**
2. Switch to **Live** mode (toggle at top)
3. Copy production keys (start with `pk_live_` and `sk_live_`)

### 2. Add to Railway

In **Railway Dashboard** → Your Project → **Variables**:

```dotenv
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_live_YOUR_PRODUCTION_WEBHOOK_SECRET
STRIPE_PRICE_AI_CREDIT_PACK=price_YOUR_PRODUCTION_PRICE_ID
```

### 3. Configure Production Webhook

1. In Stripe Dashboard → **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. Endpoint URL: `https://your-railway-domain.com/api/webhooks/stripe`
4. Events: Select `customer.subscription.*` events
5. Copy the **Signing Secret** and add to Railway Variables

---

## Troubleshooting

### "Invalid API Key"

**Cause:** Wrong or incomplete Stripe keys

**Fix:**

1. Verify keys in `.env.local` are copied correctly
2. Ensure you're using **test keys** locally (start with `_test_`)
3. Restart dev server

### Webhook Not Working

**Cause:** Stripe CLI not running or webhook secret incorrect

**Fix (Local):**

```bash
stripe listen --forward-to localhost:3010/api/webhooks/stripe
```

Copy the signing secret to `.env.local`.

**Fix (Production):**

- Verify webhook endpoint is configured in Stripe Dashboard
- Check that signing secret matches in Railway Variables
- Check Railway logs for webhook errors

### Checkout Session Not Created

**Cause:** Missing price ID

**Fix:**

1. Verify `STRIPE_PRICE_AI_CREDIT_PACK` is set in `.env.local`
2. Price ID should start with `price_`
3. Restart dev server

---

## Testing Stripe Locally

### Test Card Numbers

Use these card numbers in Stripe checkout:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0000 0000 3220`

Any expiration date in the future and any CVC work.

---

## Next Steps

- Need detailed setup flow? → **DETAILED-LOCAL-AND-RAILWAY.md**
- Deploying to production? → **RAILWAY-VARIABLES-REFERENCE.md**
