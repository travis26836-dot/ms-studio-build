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
pnpm exec prisma migrate deploy
```

---

## Prisma Overview

### Schema Location

`prisma/schema.prisma` — defines all database tables and relationships.

### Common Commands

```bash
# View current schema state
pnpm exec prisma studio

# Run pending migrations
pnpm exec prisma migrate deploy

# Create a new migration (after editing schema.prisma)
pnpm exec prisma migrate dev --name your_migration_name

# Reset database (local only!)
pnpm exec prisma migrate reset
```

---

## Railway PostgreSQL Setup

### Step 1: Create PostgreSQL Service

1. Open <https://railway.app>
2. Select your project
3. Click **New** → Select **Database** → **PostgreSQL**
4. Railway creates a PostgreSQL instance and generates `DATABASE_URL`

### Step 2: Get DATABASE_URL

1. Go to **Railway Dashboard** → Your Project → **PostgreSQL** service
2. Click the **PostgreSQL** tab
3. Copy the **Public URL** or use the Railway variables system
4. Railway automatically sets `DATABASE_URL` in your environment

### Step 3: Deploy Application

Push your code to GitHub. Railway will:

1. Build your app
2. Run `pnpm build`
3. Run `pnpm start`

### Step 4: Run Migrations on Railway

If migrations don't run automatically, SSH into your Railway container and run:

```bash
pnpm exec prisma migrate deploy
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
    where: { customerId: userId }
  });
  
  res.json(subscriptions);
});
```

---

## Environment Variables Reference

| Variable | Purpose | Local Example | Production |
| -------- | ------- | ------------- | ---------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/ms_build` | `postgresql://user:pass@railway-host:5432/dbname` |
| `NODE_ENV` | Environment mode | `development` | `production` |
| `API_PORT` | Express server port | `3010` | `3010` |
| `PORT` | Production port | (not needed local) | `3000` |

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
pnpm exec prisma migrate dev --name add_new_table
```

1. Push to git

### Deploy Migration to Railway

Migrations run automatically on Railway. If they fail:

1. Check Railway logs
2. Run manually:

```bash
railway run pnpm exec prisma migrate deploy
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
- Confirm `DATABASE_URL` is set in Railway Variables
- Check it matches the PostgreSQL connection string

### Prisma Studio Won't Connect

```bash
# Ensure DATABASE_URL is in .env.local
echo $DATABASE_URL

# If empty, add it
pnpm exec prisma studio
```

### Migration Fails

```bash
# Check for syntax errors
pnpm exec prisma validate

# Reset database (local only!)
pnpm exec prisma migrate reset

# Deploy again
pnpm exec prisma migrate deploy
```

---

## Next Steps

- Ready to set up Stripe? → **05-STRIPE-SETUP.md**
- Need all the details? → **DETAILED-LOCAL-AND-RAILWAY.md**
- Deploying to production? → **RAILWAY-VARIABLES-REFERENCE.md**
