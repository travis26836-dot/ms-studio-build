# Project Configuration Reference

Start here for setup and configuration.

## Quick Start

```bash
pnpm install
pnpm run dev:full
```

App runs at <http://localhost:3003>
API runs at <http://localhost:3010>

---

## Environment Variables

### Local Development

Create `.env.local` in repository root with test/development keys:

Priority note: Vite resolves env files with `.env.local` overriding `.env`.
Keep each variable in one place to avoid accidental overrides (especially
`VITE_CLERK_PUBLISHABLE_KEY`).

- DATABASE_URL (local PostgreSQL)
- CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, VITE_CLERK_PUBLISHABLE_KEY
- API_PORT, NODE_ENV, VITE_API_URL
- VERONICA_AI_API_KEY, VERONICA_AI_BASE_URL
- STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_AI_CREDIT_PACK, AI_CREDIT_PACKS_ENABLED

See individual guide files for where to obtain each key:

- Clerk keys: Clerk Dashboard
- Stripe keys: Stripe Dashboard  
- Veronica AI key and API base URL: your Veronica AI account
- Database: Local PostgreSQL

The Veronica AI adapter expects an OpenAI-compatible base URL exposing
`/chat/completions` and `/images/generations`. Do not expose the API key via a
`VITE_` variable.

---

## Application Structure

```text
├── client/                 # Main app (Vite + React 19)
├── server/                 # Express API
├── shared/                 # Shared code
├── customer-portal/        # Portal app
├── prisma/                 # Database
└── INSTRUCTIONS/           # Docs
```

## Ports

- 3003: Main app
- 3004: Portal
- 3010: API (dev)
- 3000: API (prod)

---

## Build Commands

**Development:**

```bash
pnpm run dev:full             # All servers
pnpm run dev                  # Main app only
pnpm run dev:api              # API only
```

**Production:**

```bash
pnpm run build                # Build
pnpm run start                # Start
pnpm run check                # TypeScript check
pnpm run format               # Format code
```

---

## Database Setup

### PostgreSQL Installation

Install PostgreSQL 16 or later on your system:

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

Then create a database for development:

```bash
psql -U postgres -c "CREATE DATABASE ms_build;"
```

### Migrations

```bash
pnpm exec prisma migrate deploy
```

---

## Key Files

- vite.config.ts — Build config
- tsconfig.json — TypeScript config
- package.json — Dependencies
- .env.local — Local environment
- .env — Shared defaults

---

## Troubleshooting

Clear cache and reinstall:

```bash
rm -rf node_modules package-lock.json pnpm-lock.yaml
pnpm install
pnpm run check
```

Kill dev ports:

```bash
pnpm run kill:dev-ports
```

---

## Next Steps

See individual instruction files:

- 03-CLERK-AUTHENTICATION.md
- 04-RAILWAY-DATABASE.md
- 05-STRIPE-SETUP.md
