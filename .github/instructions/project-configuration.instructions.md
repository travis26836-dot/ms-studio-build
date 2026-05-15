---
description: "Start here for app configuration. Covers required environment variables, build pipeline, database connection, and local development setup. Use when setting up .env, running dev/build commands, configuring Vite/Express, or troubleshooting builds."
applyTo: "server/**,prisma/**,vite.config.ts,tsconfig.json,package.json,.env*"
---

# Project Configuration Reference

> **Start here** for setup and configuration. See [copilot-instructions.md](../copilot-instructions.md) for code style and architecture guidelines.

## Quick Start

```bash
pnpm install              # install dependencies
cp .env.example .env      # create local .env from template
pnpm dev:full             # run all dev servers together (recommended)
pnpm build                # build for production
pnpm start                # run production server (dist/index.js)
```

## Build Pipeline

```
pnpm dev                    → Vite dev server only (client-side, port 3003)
pnpm dev:full               → All three dev servers via scripts/dev-full.sh:
                              - API server      (port 3010, NODE_ENV=development)
                              - Main app Vite   (port 3003)
                              - Customer portal (port 3004)
pnpm dev:api                → Express API server only (port 3010, NODE_ENV=development)
pnpm build                  → Vite builds client/ → dist/public/
                            → esbuild bundles server/index.ts → dist/index.js
pnpm start (or node dist/)  → Express server (port 3000, production mode)
```

**Key points:**

- `pnpm dev:full` is the recommended local workflow — starts all servers together and cleans up on exit
- `pnpm dev` runs only Vite (no API); use when you don't need the Express server
- Default ports: main app `:3003`, customer portal `:3004`, API `:3010` (overridable via `MAIN_PORT`, `PORTAL_PORT`, `API_PORT` env vars)
- In `customer-portal/`, use its own `pnpm dev` command if running in isolation
- `dist/index.js` requires `dist/public/` present (SPA assets)

## Path Aliases

| Alias       | Resolves To    | Use For                    |
| ----------- | -------------- | -------------------------- |
| `@/*`       | `client/src/*` | All main app imports       |
| `@shared/*` | `shared/*`     | Shared types and constants |

Defined in both `vite.config.ts` (Vite build) and `tsconfig.json` (type checking).

## Required Environment Variables

Create `.env` at **repo root** (not inside `client/`). Vite reads from the root via `envDir`.

### Always Required

| Variable                     | Used By                            | Value                        | Example                                        |
| ---------------------------- | ---------------------------------- | ---------------------------- | ---------------------------------------------- |
| `DATABASE_URL`               | Prisma / `server/db.ts`            | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/studio` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Client auth / `client/src/App.tsx` | Clerk public key             | `pk_test_...`                                  |
| `CLERK_SECRET_KEY`           | Server auth / `server/auth.ts`     | Clerk secret key             | `sk_test_...`                                  |

### Feature-Gated (app degrades without these)

| Variable              | Feature                          | Value                                       | Notes                                                              |
| --------------------- | -------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ |
| `GROQ_API_KEY`        | AI chat + layout suggestions     | API key from groq.com                       | Returns 503 if missing                                             |
| `TOGETHER_AI_API_KEY` | AI image & background generation | API key from together.ai                    | Returns 503 if missing; free tier available                        |
| `STRIPE_SECRET_KEY`   | Subscription billing             | `sk_test_...` (dev) or `sk_live_...` (prod) | See [stripe-setup.instructions.md](./stripe-setup.instructions.md) |
| `STRIPE_PRICE_PRO`    | Pro tier subscription            | Price ID from Stripe Dashboard              | Example: `price_...`                                               |
| `STRIPE_PRICE_TEAM`   | Team tier subscription           | Price ID from Stripe Dashboard              | Example: `price_...`                                               |

**Important:** `VITE_` prefix is required for any variable accessed in **client-side code** only.

## Checking Your Setup

```bash
pnpm check                # validate TypeScript (tsc --noEmit)
pnpm format               # format code with Prettier
pnpm dev                  # start dev server and verify .env loads
```

If dev server fails, check: `.env` file exists, `DATABASE_URL` is valid (if using database features), and all required keys are present.

## Database Setup (Prisma)

**Schema location:** `prisma/schema.prisma`  
**Provider:** PostgreSQL via `@prisma/adapter-pg`  
**Config file:** `prisma.config.ts` (loads `DATABASE_URL` from `.env`)

Common commands:

```bash
pnpm prisma migrate dev    # create and apply migrations locally
pnpm prisma generate       # regenerate Prisma Client after schema changes
pnpm prisma studio        # open visual database browser
```

**Important:** The Prisma client is a singleton in `server/db.ts`. Always import `prisma` from there; never create a new instance.

For full Prisma setup walkthrough, see [railway-database-setup.instructions.md](./railway-database-setup.instructions.md).

## Server Routes

**Express server location:** `server/index.ts`

### Built-in Routes

| Route    | Method | Description                                   |
| -------- | ------ | --------------------------------------------- |
| `/`      | GET    | Serves SPA (client build from `dist/public/`) |
| `/api/*` | -      | All API routes defined in `server/index.ts`   |

### Feature Routes (see specific guides)

- **AI endpoints** (chat, layout, image generation): See [server/ai.ts](../../server/ai.ts) + `GROQ_API_KEY` and `TOGETHER_AI_API_KEY` env vars
- **Stripe webhook**: See [stripe-setup.instructions.md](./stripe-setup.instructions.md)
- **Customer portal API**: See [railway-database-setup.instructions.md](./railway-database-setup.instructions.md)

## Next Steps

Once your `.env` is configured and you can run `pnpm dev` successfully:

1. **To add database features:** Follow [railway-database-setup.instructions.md](./railway-database-setup.instructions.md)
2. **To add subscriptions:** Follow [stripe-setup.instructions.md](./stripe-setup.instructions.md)
3. **For code style & architecture:** See [copilot-instructions.md](../copilot-instructions.md)
