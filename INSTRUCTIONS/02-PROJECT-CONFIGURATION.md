# Project Configuration Reference

Start here for setup and configuration.

## Quick Start

```bash
pnpm install
pnpm dev:full
```

App runs at <http://localhost:3003>
API runs at <http://localhost:3010>

---

## Environment Variables

### Local Development

Create `.env.local` in repository root with test/development keys:

- DATABASE_URL (local PostgreSQL)
- CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, VITE_CLERK_PUBLISHABLE_KEY
- API_PORT, NODE_ENV, VITE_API_URL
- GOOGLE_GENERATIVE_AI_API_KEY
- STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_AI_CREDIT_PACK, AI_CREDIT_PACKS_ENABLED

See individual guide files for where to obtain each key:

- Clerk keys: Clerk Dashboard
- Stripe keys: Stripe Dashboard  
- Google AI key: Google AI Studio
- Database: Local PostgreSQL

---

## Application Structure

```
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
pnpm dev:full              # All servers
pnpm dev                   # Main app only
pnpm dev:api               # API only
```

**Production:**

```bash
pnpm build                 # Build
pnpm start                 # Start
pnpm check                 # TypeScript check
pnpm format                # Format code
```

---

## Database Setup

### Docker

```bash
docker run --name ms-build-postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:16
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
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm check
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
