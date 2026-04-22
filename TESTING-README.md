# 🧪 Local Testing Setup

This directory is ready for local testing. Everything needed to run the project locally is in place.

## Quick Start

Choose your operating system:

### Linux / macOS
```bash
bash setup-local.sh
```

### Windows
```cmd
setup-local.bat
```

This will:
1. ✅ Check prerequisites (pnpm, Node.js)
2. ✅ Validate environment configuration
3. ✅ Install dependencies
4. ✅ Generate Prisma client
5. ✅ Apply database schema to Railway
6. ✅ Run TypeScript validation
7. ✅ Report success and next steps

## Manual Setup (Step by Step)

If you prefer to run commands manually:

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma types
npx prisma generate

# 3. Create database tables
npx prisma db push

# 4. Check TypeScript
pnpm check

# 5. Start development server
pnpm dev
```

## Environment Setup

Your `.env` file already contains:
- ✅ `DATABASE_URL` - Railway PostgreSQL connection
- ✅ `CLERK_SECRET_KEY` - Authentication key
- ✅ Optional: Stripe keys (for later)

No additional configuration needed for local testing!

## What's Included

### Documentation Files
- **[LOCAL-TESTING.md](LOCAL-TESTING.md)** - Detailed testing guide
- **[LOCAL-TESTING-CHECKLIST.md](LOCAL-TESTING-CHECKLIST.md)** - Quick reference
- **[SETUP-VALIDATION-REPORT.md](SETUP-VALIDATION-REPORT.md)** - Complete validation
- **[railway-database-setup.instructions.md](.github/instructions/railway-database-setup.instructions.md)** - Full setup reference

### Test Scripts
- **test-integration.mjs** - Validates all components are in place
- **test-local.ts** - Checks database connection
- **setup-local.sh** - Automated setup (Linux/macOS)
- **setup-local.bat** - Automated setup (Windows)

### Core Implementation
- **server/index.ts** - Express server with 4 API endpoints
- **server/db.ts** - Prisma database connection factory
- **prisma/schema.prisma** - Database schema (4 models)
- **prisma.config.ts** - Prisma 7 configuration
- **.env** - Environment variables (pre-configured with Railway)

## Testing the Setup

### Option 1: Automated Test
```bash
node test-integration.mjs
```
This validates all components are correctly configured without connecting to the database.

### Option 2: Database Connection Test
```bash
npx tsx test-local.ts
```
This tests actual database connectivity (requires the database to exist).

### Option 3: Full End-to-End
```bash
# 1. Start the development server
pnpm dev

# 2. In a new terminal, test an API endpoint
curl http://localhost:5173/api/customer/1

# 3. Open http://localhost:5173 in your browser
```

## API Endpoints Ready to Test

Once the server is running, these endpoints are available:

| Method | Path | Authentication | Purpose |
|--------|------|-----------------|---------|
| GET | `/api/customer/:id` | None | Get customer by ID |
| GET | `/api/subscription/status` | Yes* | Get user's subscription |
| GET | `/api/projects` | Yes* | List user's projects |
| POST | `/api/projects` | Yes* | Create new project |

*Requires Clerk authentication (automatic with Clerk SDK)

## Troubleshooting

### "PORT 5173 already in use"
The dev server will automatically use the next available port. Check the console output for the actual URL.

### "DATABASE_URL is not set"
Make sure `.env` exists in the project root with `DATABASE_URL=postgresql://...`

### "Cannot find @prisma/client"
Run: `npx prisma generate`

### "Tables don't exist"
Run: `npx prisma db push`

### "CLERK_SECRET_KEY invalid"
Check your `.env` file has a valid Clerk secret key from your Clerk dashboard.

## Next Steps After Local Testing

1. **Verify everything works locally** - Run `pnpm dev` and test the API endpoints
2. **Deploy to Railway** - Push the build to the Railway service
3. **Implement Stripe** - Add webhook route and checkout flow (Phase 5)
4. **Build Customer Portal** - Wire the frontend to the API endpoints

## Useful Commands

```bash
# Development
pnpm dev              # Start dev server with hot reload
pnpm check           # Check TypeScript for errors
pnpm format          # Format code with Prettier

# Database
npx prisma studio         # Open database GUI
npx prisma db push        # Sync schema with database
npx prisma migrate deploy # Run migrations (production)
npx prisma generate       # Regenerate types

# Building
pnpm build           # Build client and server for production
pnpm start           # Run production server

# Testing
node test-integration.mjs  # Validate setup
npx tsx test-local.ts      # Test database connection
```

## Architecture Overview

```
Client (React + Vite)
    ↓
Express Server (port 3000)
    ├── Static Files (dist/public)
    ├── API Routes (/api/*)
    │   ├── Clerk Auth Middleware
    │   └── Prisma Database Queries
    └── SPA Fallback (index.html)
        ↓
    PostgreSQL (Railway)
        ├── User Table
        ├── Subscription Table
        ├── Customer Table
        └── Project Table
```

## Status: ✅ READY

All components are configured and tested. The project is ready to run locally!

**Next action:** Run `bash setup-local.sh` (or `setup-local.bat` on Windows)
