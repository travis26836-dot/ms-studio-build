---
description: "Use when setting up Stripe subscriptions, wiring the webhook route, implementing checkout, managing subscription tiers, or working with Stripe env vars. Covers required env vars, the Subscription/Customer Prisma models, webhook handler, and plan-gating pattern."
---

# Stripe Integration Guide

## Required Environment Variables

Add all four to `.env` (root) and to Railway service Variables:

```env
STRIPE_SECRET_KEY="sk_test_..."          # test key during dev, sk_live_... in production
STRIPE_WEBHOOK_SECRET="whsec_..."        # from Stripe Dashboard → Webhooks → signing secret
STRIPE_PRICE_PRO="price_..."             # Price ID for Pro tier
STRIPE_PRICE_TEAM="price_..."            # Price ID for Team tier
```

> Use test-mode keys (`sk_test_`, `pk_test_`) locally. Never commit real keys — `.env` is already in `.gitignore`.

---

## Data Model

The schema already has all required models:

```
Subscription
  stripeCustomerId  — Stripe customer object ID (cus_...)
  stripePriceId     — which price they're on (compare against STRIPE_PRICE_PRO / STRIPE_PRICE_TEAM)
  status            — "active" | "canceled" | "past_due"
  currentPeriodEnd  — DateTime, for display/access checks

Customer
  plan              — "free" | "pro" | "team" (denormalized, update on webhook)
```

The `plan` field on `Customer` is the **canonical plan string** used throughout the app. It must be kept in sync with `Subscription.stripePriceId` via the webhook handler.

---

## Deriving Plan From Price ID

```ts
function planFromPriceId(priceId: string): "free" | "pro" | "team" {
  if (priceId === process.env.STRIPE_PRICE_PRO)  return "pro";
  if (priceId === process.env.STRIPE_PRICE_TEAM) return "team";
  return "free";
}
```

---

## Webhook Handler

Add this route to `server/index.ts` **before** `express.json()` middleware (Stripe needs the raw body):

```ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

// Must use express.raw() — NOT express.json() — for Stripe webhook verification
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return res.status(400).send("Webhook signature verification failed");
  }

  const prisma = await getPrisma();

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const sub = event.data.object as Stripe.Subscription;
    const priceId = sub.items.data[0].price.id;
    const plan = planFromPriceId(priceId);

    await prisma.subscription.upsert({
      where: { stripeCustomerId: sub.customer as string },
      update: { stripePriceId: priceId, status: sub.status, currentPeriodEnd: new Date(sub.current_period_end * 1000) },
      create: {
        stripeCustomerId: sub.customer as string,
        stripePriceId: priceId,
        status: sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        userId: "MUST_RESOLVE_FROM_METADATA", // store userId in Stripe metadata at checkout
      },
    });

    // Keep Customer.plan in sync
    await prisma.customer.updateMany({
      where: { user: { subscription: { stripeCustomerId: sub.customer as string } } },
      data: { plan },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await prisma.subscription.updateMany({
      where: { stripeCustomerId: sub.customer as string },
      data: { status: "canceled" },
    });
    await prisma.customer.updateMany({
      where: { user: { subscription: { stripeCustomerId: sub.customer as string } } },
      data: { plan: "free" },
    });
  }

  return res.json({ received: true });
});
```

---

## Checkout Session (Creating a Subscription)

```ts
app.post("/api/stripe/checkout", async (req, res) => {
  const user = await getOrCreateUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { priceId } = req.body as { priceId: string };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/editor?checkout=success`,
    cancel_url: `${process.env.APP_URL}/`,
    metadata: { userId: user.id }, // needed to link subscription → user in webhook
    subscription_data: { metadata: { userId: user.id } },
  });

  return res.json({ url: session.url });
});
```

---

## Plan-Gating (Subscription Check Pattern)

```ts
// In any authenticated route that requires a paid plan:
const customer = await prisma.customer.findUnique({ where: { userId: user.id } });
if (!customer || customer.plan === "free") {
  return res.status(402).json({ error: "Upgrade required" });
}
```

---

## Local Webhook Testing

Use the Stripe CLI to forward events to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI will print a `whsec_...` signing secret — use that as `STRIPE_WEBHOOK_SECRET` locally.

---

## Stripe Dashboard Checklist

- [ ] Create two Products in Stripe (Pro, Team), each with a recurring Price
- [ ] Copy the Price IDs → `STRIPE_PRICE_PRO` / `STRIPE_PRICE_TEAM`
- [ ] Add webhook endpoint pointing to `https://your-domain.com/api/stripe/webhook`
- [ ] Enable events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- [ ] Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`
