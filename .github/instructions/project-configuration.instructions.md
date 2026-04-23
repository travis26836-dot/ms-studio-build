---
description: "Use when configuring the app, setting up environment variables, running dev or build commands, wiring Clerk auth, connecting the database, or working on server/AI routes. Covers app structure, required env vars, build pipeline, and Prisma setup."
applyTo: "server/**,prisma/**,vite.config.ts,tsconfig.json,package.json"
---

# Project Configuration Reference

## App Structure

This is a monorepo-style workspace with **two separate apps**:

| App | Root | Dev Command | Build Output |
|-----|------|-------------|--------------|
| Main product (React + Vite + Express) | `client/` (Vite root), `server/` | `pnpm dev` (repo root) | `dist/public/` (client), `dist/index.js` (server) |
| Customer portal (standalone) | `customer-portal/` | `pnpm dev` inside `customer-portal/` | separate |

- **Do not mix up the two apps.** Main app commands run from repo root; customer portal has its own `package.json`.
- Both default to port 3000 — run them separately to avoid conflicts.
- `imported-source/` is legacy/reference only; do not edit it unless explicitly asked.

## Path Aliases

| Alias | Resolves To | Use For | 
|-------|-------------|---------|
| `@/*` | `client/src/*` | All main app imports |
| `@shared/*` | `shared/*` | Shared types and constants |

Defined in both `vite.config.ts` (build) and `tsconfig.json` (type checking).

**pnpm install
**pnpm approve-builds # approve esbuild and Vite updates after running pnpm update.
// pnpm update esbuild vite
  // pnpm update -D esbuild vite
  
  ((## update Vite or esbuild when needed, then run the approve-builds command to allowlist the new versions. This prevents unexpected build tool updates from breaking the build without notice.))

## Build Pipeline

pnpm rebuild;
```
pnpm build
  └─ Vite builds client/ → dist/public/
  └─ esbuild bundles server/index.ts → dist/index.js
pnpm start → runs dist/index.js (Express serves dist/public as SPA)
node dist/index.js → direct equivalent of pnpm start
```

- `pnpm dev` runs only the Vite dev server (port 3000); the Express server is for production. During development, you can run `pnpm build` in watch mode (`-w`) to rebuild the server on changes.
- `dist/index.js` still needs `dist/public/` present, because Express serves SPA assets from that folder.
- `pnpm check` runs `tsc --noEmit` — use this to validate TypeScript before committing.

## Required Environment Variables

Create a `.env` file in the **repo root** (not inside `client/`). Vite reads from root via `envDir`.

### Always Required

| Variable | Used By | Notes |
|----------|---------|-------|
| `DATABASE_URL` | Prisma (`server/db.ts`) | PostgreSQL connection string |
| `VITE_CLERK_PUBLISHABLE_KEY` | Client auth (`client/src/App.tsx`) | Starts with `pk_` |
| `CLERK_SECRET_KEY` | Server auth (`server/auth.ts`) | Starts with `sk_` |

### Feature-Gated (app degrades gracefully without these)

| Variable | Feature |
|----------|---------|
| `GROQ_API_KEY` | AI chat + layout suggestions (`server/ai.ts`) — returns 503 if missing |
| `STRIPE_SECRET_KEY` | Subscription billing |
| `STRIPE_PRICE_PRO` | Pro tier price ID |
| `STRIPE_PRICE_TEAM` | Team tier price ID |

`VITE_` prefix is required for any variable accessed in client-side code.

## Database (Prisma)

- Schema: `prisma/schema.prisma`
- Provider: PostgreSQL via `@prisma/adapter-pg`
- Config: `prisma.config.ts` (loads `DATABASE_URL` from `.env`)

Common commands:
```bash
pnpm prisma migrate dev    # apply migrations in development
pnpm prisma generate       # regenerate Prisma Client after schema changes
pnpm prisma studio         # visual DB browser
```

The Prisma client is a singleton in `server/db.ts` — import `prisma` from there, never create a new instance.

## AI Routes (server/ai.ts)

- `POST /api/ai/chat` — streaming chat, model: `llama-3.3-70b-versatile` (Groq)
- `POST /api/ai/suggest-layout` — returns JSON layout suggestions
- Requires `GROQ_API_KEY`; returns `503` with a clear message if the key is absent
- Client calls these via relative URLs in `client/src/lib/aiClient.ts` — no hardcoded hosts

## Auth (Clerk)

- **Client-side**: `ClerkProvider` wraps the app in `client/src/App.tsx`, uses `VITE_CLERK_PUBLISHABLE_KEY`
- **Server-side**: `ClerkExpressWithAuth()` middleware in `server/index.ts`, uses `CLERK_SECRET_KEY`
- Users are upserted to the Prisma `User` table on first authenticated request via `getOrCreateUser()`
- Email is a placeholder (`${clerkId}@placeholder.local`) until Clerk webhooks are configured

## Tailwind CSS

- Version 4 via `@tailwindcss/vite` plugin — **no `tailwind.config.ts` file**
- CSS entry point: `client/src/index.css`
- Customize theme in `index.css` using CSS variables, not a separate config file
