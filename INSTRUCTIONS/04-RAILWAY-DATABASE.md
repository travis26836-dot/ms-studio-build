---
description: "Feature-specific guide for Railway PostgreSQL and Prisma ORM setup. Use after completing 02-PROJECT-CONFIGURATION.md. Covers database schema, Prisma migrations, Clerk auth middleware, and customer portal API wiring."
applyTo: "server/db.ts,server/auth.ts,prisma/**,customer-portal/**"
---

# Railway + Database Setup Guide

> **Prerequisites:** Follow **02-PROJECT-CONFIGURATION.md** first to set up .env and understand the app structure.
> **Use this guide when:** Setting up a PostgreSQL database on Railway,
> connecting Prisma ORM, adding Clerk authentication middleware, or wiring
> the customer portal API.

---

## Local Development Database

### PostgreSQL Installation

Install PostgreSQL 16 or later:

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

Create a database:

```bash
psql -U postgres -c "CREATE DATABASE ms_build;"
```

### Update `.env.local`

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/ms_build
```

### Run Prisma Migrations

```bash
npx prisma migrate deploy
```

---

## Prisma Overview

### Schema Location

`prisma/schema.prisma` — defines all database tables and relationships.

### Common Commands

```bash
# View current schema state
npx prisma studio

# Run pending migrations
npx prisma migrate deploy

# Create a new migration (after editing schema.prisma)
npx prisma migrate dev --name your_migration_name

# Reset database (local only!)
npx prisma migrate reset
```

---

## Railway PostgreSQL Setup

### Step 1: Create PostgreSQL Service

1. Open <https://railway.app>
2. Select your project
3. Click **New** → Select **Database** → **PostgreSQL**
4. Railway creates a PostgreSQL instance and exposes `DATABASE_URL` on that
   database service

### Step 2: Attach DATABASE_URL to the API Service

1. Go to **Railway Dashboard** → Your Project → your **application/API** service
2. Open the **Variables** tab
3. Click **Add Reference Variable** and select `DATABASE_URL` from the
   PostgreSQL service
4. Confirm the API service now shows a variable equivalent to:

```dotenv
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

`Postgres` is the default service name; use the database service name shown in
your project. Do not copy a credential string into the API service unless you
have a specific external-database requirement.

### Step 3: Connect the Customer Portal to the API

If the customer portal is deployed as a separate Railway service:

1. Set `VITE_API_URL=https://your-api-domain.com` on the **customer portal**
   service.
2. Set `CUSTOMER_PORTAL_URL=https://your-customer-portal-domain.com` on the
   **application/API** service so its CORS middleware allows browser requests.
3. Redeploy both changed services. `VITE_API_URL` is embedded at portal build
   time.

### Step 4: Deploy Application

Push your code to GitHub. Railway will:

1. Build your app
2. Run `npm run build`
3. Run `npm run start`

### Step 5: Run Migrations on Railway

Railway does not infer Prisma migrations from this repository. Configure
`npx prisma migrate deploy` as a pre-deploy command for the API service,
or run it for that service after configuring `DATABASE_URL`:

```bash
railway run npx prisma migrate deploy
```

---

## Authentication Middleware (Clerk + Express)

### Server Setup

`server/auth.ts` configures Clerk middleware:

```typescript
import { clerkMiddleware } from "@clerk/express";

// Middleware that validates Clerk tokens
export const authMiddleware = clerkMiddleware();
```

In `server/index.ts`:

```typescript
import { authMiddleware } from "./auth";

app.use(authMiddleware);
```

This middleware:

- Validates Clerk JWT tokens
- Populates `req.auth` with user info
- Allows unauthenticated requests (auth is checked per-route)

### Protecting Routes

```typescript
import { auth } from "@clerk/express";

// Protect a route
app.get("/api/protected", auth(), (req, res) => {
  const userId = req.auth.userId; // User is authenticated
  res.json({ userId });
});
```

---

## Customer Portal API Wiring

### Portal Database Models

The Prisma schema includes models for the customer portal:

```prisma
model CustomerPortalUser {
  id          String   @id @default(cuid())
  clerkId     String   @unique
  email       String   @unique
  createdAt   DateTime @default(now())
}

model Subscription {
  id              String   @id @default(cuid())
  customerId      String
  stripeSubId     String   @unique
  status          String
  startDate       DateTime
  endDate         DateTime?
  createdAt       DateTime @default(now())
}
```

### Portal Routes

Example portal API route (`server/index.ts`):

```typescript
// Get current user subscriptions
app.get("/api/portal/subscriptions", auth(), async (req, res) => {
  const userId = req.auth.userId;

  const subscriptions = await prisma.subscription.findMany({
    where: { customerId: userId },
  });

  res.json(subscriptions);
});
```

---

## Environment Variables Reference

| Variable              | Purpose                         | Local Example                                            | Production                                               |
| --------------------- | ------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string    | `postgresql://postgres:password@localhost:5432/ms_build` | `${{Postgres.DATABASE_URL}}` on API service              |
| `NODE_ENV`            | Environment mode                | `development`                                            | `production`                                             |
| `API_PORT`            | Express server port             | `3010`                                                   | `3010`                                                   |
| `PORT`                | Production port                 | (not needed local)                                       | `3000`                                                   |
| `CUSTOMER_PORTAL_URL` | Permitted portal browser origin | `http://localhost:3004`                                  | `https://your-customer-portal-domain.com` on API service |
| `VITE_API_URL`        | API called by portal frontend   | `http://localhost:3010`                                  | `https://your-api-domain.com` on portal service          |

---

## Migrations & Schema Changes

### Create a Migration

1. Edit `prisma/schema.prisma`:

```prisma
model NewTable {
  id    String  @id @default(cuid())
  name  String
}
```

1. Create migration:

```bash
npx prisma migrate dev --name add_new_table
```

1. Push to git

### Deploy Migration to Railway

Run migrations as an API-service pre-deploy command or with `railway run`.
If they fail:

1. Check Railway logs
2. Run manually:

```bash
railway run npx prisma migrate deploy
```

---

## Troubleshooting

### "Can't reach database server"

**Cause:** PostgreSQL not running or DATABASE_URL invalid

**Fix (Local):**

```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1;"

# If not running, start it
# macOS: brew services start postgresql@16
# Linux: sudo systemctl start postgresql
# Windows: Check Services or pg_ctl start
```

**Fix (Railway):**

- Verify PostgreSQL service is running in Railway Dashboard
- Confirm the **API service** has a `DATABASE_URL` reference to the PostgreSQL
  service
- Redeploy the API service after adding or changing the reference

### Customer Portal Shows "Failed to fetch"

A browser-level `Failed to fetch` happens before the frontend can read a normal
API error response. Check the portal/API connection before changing PostgreSQL:

- Confirm the portal service was built with
  `VITE_API_URL=https://your-api-domain.com`
- Confirm the API service has
  `CUSTOMER_PORTAL_URL=https://your-customer-portal-domain.com`
- Open `https://your-api-domain.com/api/health`; it should return JSON
- Once the API is reachable, inspect API logs for Prisma connection or missing
  migration errors

### Prisma Studio Won't Connect

```bash
# Ensure DATABASE_URL is in .env.local
echo $DATABASE_URL

# If empty, add it
npx prisma studio
```

### Migration Fails

```bash
# Check for syntax errors
npx prisma validate

# Reset database (local only!)
npx prisma migrate reset

# Deploy again
npx prisma migrate deploy
```

---

## Next Steps

- Ready to set up Stripe? → **05-STRIPE-SETUP.md**
- Need all the details? → **DETAILED-LOCAL-AND-RAILWAY.md**
- Deploying to production? → **RAILWAY-VARIABLES-REFERENCE.md**
