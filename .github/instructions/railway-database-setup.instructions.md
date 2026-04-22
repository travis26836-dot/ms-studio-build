---
description: "Use when setting up Railway PostgreSQL, Prisma ORM, Clerk auth, or Stripe subscriptions. Covers connecting a database to the Express server, adding API routes, wiring the customer portal, and deploying to Railway. Trigger phrases: Railway database, Prisma setup, Clerk middleware, Stripe integration, subscription tiers, DATABASE_URL, customer portal API."
---

# Railway + Database Setup Guide

## Stack

| Layer | Choice |
|-------|--------|
| Hosting | Railway (existing service: `ms-studio-build-production`) |
| Database | Railway PostgreSQL plugin |
| ORM | Prisma |
| Auth | Clerk (`@clerk/clerk-sdk-node`) |
| Payments | Stripe |
| Server | `server/index.ts` (Express) |

## Current State (know before starting)

- `server/index.ts` — Express static-file server only; **no API routes yet**
- `client/src/lib/trpc.ts` — localStorage mock tRPC; **not connected to a real server**
- `customer-portal/src/app.jsx` — already calls `GET /api/customer/1` at the Railway URL; **the route doesn't exist yet**
- No `DATABASE_URL`, no ORM, no auth middleware anywhere in the repo

---

## Phase 1 — Railway PostgreSQL Plugin

### 1.1 Add the Plugin via Railway Dashboard

1. Open your Railway project → **New** → **Database** → **Add PostgreSQL**
2. Railway automatically injects `DATABASE_URL` into all services in the project
3. In your service's **Variables** tab, confirm `DATABASE_URL` is present (format: `postgresql://...`)

### 1.2 Local Development

Create `.env` at repo root (already in `.gitignore` or add it):

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/railway"
CLERK_SECRET_KEY="sk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NODE_ENV="development"
```

Get the local connection string from Railway dashboard → PostgreSQL plugin → **Connect** tab → copy the **connection string**.

---

## Phase 2 — Prisma Setup

### 2.1 Install Dependencies

```bash
pnpm add prisma @prisma/client @prisma/adapter-pg dotenv
npx prisma init
```

This creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env` (if not already there).

### 2.2 Schema

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id           String        @id @default(cuid())
  clerkId      String        @unique
  email        String        @unique
  createdAt    DateTime      @default(now())
  subscription Subscription?
  projects     Project[]
  customer     Customer?
}

model Subscription {
  id                 String   @id @default(cuid())
  userId             String   @unique
  user               User     @relation(fields: [userId], references: [id])
  stripeCustomerId   String   @unique
  stripePriceId      String
  // Tier: "free" | "pro" | "team" — derive from stripePriceId
  // Add STRIPE_PRICE_PRO and STRIPE_PRICE_TEAM to Railway env vars
  status             String   // "active" | "canceled" | "past_due"
  currentPeriodEnd   DateTime
  updatedAt          DateTime @updatedAt
}

model Project {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String
  canvasState Json     // matches CanvasState type in shared/designTypes.ts
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Customer {
  id     String  @id @default(cuid())
  userId String  @unique
  user   User    @relation(fields: [userId], references: [id])
  name   String
  email  String
  plan   String  @default("free") // "free" | "pro" | "team"
}
```

### 2.3 Run Migration

Prisma 7 no longer keeps the datasource URL inside `schema.prisma`.

Put the database connection in `prisma.config.ts` instead:

```typescript
/// <reference types="node" />
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

Then generate the Prisma client:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 2.4 Lazy Prisma Helper

Prisma needs one reusable database client on the server side.

Without this file, you end up creating a new database connection every time the server reloads or a file imports Prisma. In development, that often causes too many open connections.

For this repo, use a lazy helper instead of constructing Prisma at module load time. That keeps the app from failing early if Prisma has not been generated yet.

Do this exactly:

1. Inside the repo root, open the `server/` folder
2. Create a new file named `db.ts`
3. Paste the code below into that file
4. Save the file

Your new file should be `server/db.ts` and should contain:

```typescript
type PrismaClientModule = typeof import("@prisma/client");
type PrismaAdapterModule = typeof import("@prisma/adapter-pg");
type PrismaClientInstance = InstanceType<PrismaClientModule["PrismaClient"]>;

const globalForPrisma = globalThis as unknown as {
  prismaPromise: Promise<PrismaClientInstance> | undefined;
};

async function createPrismaClient(): Promise<PrismaClientInstance> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const [{ PrismaPg }, { PrismaClient }] = await Promise.all([
    import("@prisma/adapter-pg") as Promise<PrismaAdapterModule>,
    import("@prisma/client") as Promise<PrismaClientModule>,
  ]);

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });
}

export function getPrisma(): Promise<PrismaClientInstance> {
  if (!globalForPrisma.prismaPromise) {
    globalForPrisma.prismaPromise = createPrismaClient();
  }

  return globalForPrisma.prismaPromise;
}
```

### What this file is doing

- `type PrismaClientModule = typeof import("@prisma/client")`
  Describes the Prisma module without forcing it to load immediately.
- `globalForPrisma.prismaPromise`
  Caches one shared async Prisma client setup for the whole server process.
- `await Promise.all([import("@prisma/adapter-pg"), import("@prisma/client")])`
  Loads Prisma only when first needed.
- `new PrismaPg({ connectionString })`
  Connects Prisma Client to PostgreSQL through the Prisma 7 adapter.
- `export function getPrisma()`
  Gives route handlers a single helper they can `await` before making queries.

### Why you need this

Later, when you add API routes in `server/index.ts`, you will call this shared helper instead of creating Prisma directly in every file.

Example:

```typescript
import { getPrisma } from "./db.js";

const prisma = await getPrisma();
const customers = await prisma.customer.findMany();
```

### How to verify it

After creating `server/db.ts`, run:

```bash
pnpm check
```

If that passes, the file is in the right place and TypeScript can see it.

---

## Phase 3 — Clerk Auth Middleware

### 3.1 Install

```bash
pnpm add @clerk/clerk-sdk-node
```

Add to Railway service variables:

```
CLERK_SECRET_KEY=sk_live_...
```

### 3.2 Wire into server/index.ts

Add clerk middleware **before** API routes. Edit `server/index.ts`:

```typescript
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import { getPrisma } from "./db.js";

// After: const app = express();
// Add:
app.use(express.json());
app.use(ClerkExpressWithAuth());
```

### 3.3 Auth Helper (upsert user on first request)

Add this helper to `server/index.ts` (or `server/auth.ts`):

```typescript
import type { Request } from "express";
import { getPrisma } from "./db.js";

export async function getOrCreateUser(req: Request) {
  const prisma = await getPrisma();
  const clerkId = (req as any).auth?.userId;
  if (!clerkId) return null;
  return prisma.user.upsert({
    where: { clerkId },
    update: {},
    create: {
      clerkId,
      email: "", // populate from Clerk webhook on user.created if needed
      customer: { create: { name: "", email: "", plan: "free" } },
    },
  });
}
```

---

## Phase 4 — Express API Routes

All routes go in `server/index.ts` **before** the `app.get("*", ...)` SPA fallback.

```typescript
// ── Customer Portal API ──────────────────────────────────────────────────────

app.get("/api/customer/:id", async (req, res) => {
  const prisma = await getPrisma();
  // Public endpoint used by customer-portal/src/app.jsx
  // :id is currently ignored — returns data for authenticated user
  // TODO: add auth check once customer portal has Clerk session
  const customer = await prisma.customer.findFirst({
    orderBy: { id: "asc" },
  });
  if (!customer) return res.status(404).json({ error: "Not found" });
  res.json(customer);
});

// ── Subscription Status ───────────────────────────────────────────────────────

app.get("/api/subscription/status", async (req, res) => {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } });
  res.json({ plan: user.customer?.plan ?? "free", subscription: sub });
});

// ── Projects API ──────────────────────────────────────────────────────────────

app.get("/api/projects", async (req, res) => {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  res.json(projects);
});

app.post("/api/projects", async (req, res) => {
  const prisma = await getPrisma();
  const user = await getOrCreateUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { name, canvasState } = req.body;
  const project = await prisma.project.create({
    data: { userId: user.id, name, canvasState },
  });
  res.status(201).json(project);
});
```

---

## Phase 5 — Stripe Subscription Integration

### 5.1 Install

```bash
pnpm add stripe
```

Add to Railway service variables:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_TEAM=price_...
```

### 5.2 Checkout Session Route

```typescript
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

app.post("/api/stripe/create-checkout", async (req, res) => {
  const user = await getOrCreateUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { priceId } = req.body; // pass STRIPE_PRICE_PRO or STRIPE_PRICE_TEAM from client
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/editor?upgraded=true`,
    cancel_url: `${process.env.APP_URL}/`,
    metadata: { userId: user.id },
  });

  res.json({ url: session.url });
});
```

### 5.3 Stripe Webhook

```typescript
// Must use raw body — add BEFORE express.json() middleware
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const prisma = await getPrisma();
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch {
      return res.status(400).send("Webhook signature verification failed");
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        const status = sub.status; // "active" | "canceled" | "past_due"
        const priceId = sub.items.data[0]?.price.id;
        const plan =
          priceId === process.env.STRIPE_PRICE_PRO ? "pro" :
          priceId === process.env.STRIPE_PRICE_TEAM ? "team" : "free";

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            status,
            stripePriceId: priceId ?? "",
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
          create: {
            userId,
            stripeCustomerId: sub.customer as string,
            stripePriceId: priceId ?? "",
            status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });

        await prisma.customer.update({
          where: { userId },
          data: { plan: status === "active" ? plan : "free" },
        });
      }
    }

    res.json({ received: true });
  }
);
```

**Important:** The webhook route must be registered **before** `app.use(express.json())` because Stripe requires the raw request body.

---

## Phase 6 — Customer Portal Environment

In `customer-portal/`, create `.env` for local dev:

```env
VITE_API_URL=http://localhost:3000
```

In Railway, add to the **customer-portal service** variables:

```
VITE_API_URL=https://ms-studio-build-production.up.railway.app
```

The `customer-portal/src/app.jsx` already reads `import.meta.env.VITE_API_URL` — no code change needed.

---

## Phase 7 — Deployment Checklist

### Required Railway Environment Variables (main service)

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | Auto-injected by Railway Postgres plugin |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks → signing secret |
| `STRIPE_PRICE_PRO` | Stripe dashboard → Products → Pro plan price ID |
| `STRIPE_PRICE_TEAM` | Stripe dashboard → Products → Team plan price ID |
| `APP_URL` | `https://ms-studio-build-production.up.railway.app` |
| `NODE_ENV` | `production` |

### Railway Release Command

In your Railway service **Settings → Deploy → Release Command**, add:

```
npx prisma migrate deploy
```

This runs pending migrations against the production DB on every deploy before the new server starts.

### Build Command

Ensure `package.json` build script compiles the Prisma client:

```json
"build": "prisma generate && vite build && tsc -p tsconfig.node.json"
```

---

## Phase 8 — Verification

After each phase, verify with:

```bash
# Phase 2: Prisma types compile
pnpm check

# Phase 4: API routes respond locally
curl http://localhost:3000/api/customer/1

# Phase 5: Local webhook testing (install Stripe CLI first)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Phase 7: Production smoke test
curl https://ms-studio-build-production.up.railway.app/api/customer/1
```

---

## Follow-Up Tasks (after DB is live)

1. **Replace localStorage tRPC mock** — `client/src/lib/trpc.ts` needs a real tRPC server adapter added to `server/index.ts` at `/api/trpc/*`
2. **Clerk webhook** — listen for `user.created` event at `/api/clerk/webhook` to populate `User.email` on signup
3. **Subscription gate** — use `GET /api/subscription/status` in the editor to conditionally enable Pro features
4. **Subscription tier constants** — add `PLAN_FREE`, `PLAN_PRO`, `PLAN_TEAM` to `shared/const.ts`
