# Local Testing Guide

This guide walks through testing the complete setup locally before deploying to Railway.

## Prerequisites

✅ You have:
- `.env` configured with `DATABASE_URL` (Railway PostgreSQL)
- `CLERK_SECRET_KEY` set in `.env`
- All dependencies installed (`pnpm install` completed)
- Prisma generated (`npx prisma generate` succeeded)

## Step 1: Initialize the Database Schema

```bash
# Apply the Prisma schema to your Railway database
npx prisma migrate deploy

# Or if it's the first time, push without migrations:
npx prisma db push
```

Expected output:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
✓ Created 4 new tables (User, Subscription, Customer, Project)
```

## Step 2: Start the Development Server

```bash
pnpm dev
```

Expected output:
```
VITE v6.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

The server should start on `http://localhost:5173` without errors.

## Step 3: Test the Client

Open http://localhost:5173 in your browser.

**Test Cases:**
- [ ] Home page loads (should show editor interface)
- [ ] Editor page loads at `/editor`
- [ ] No console errors in DevTools

## Step 4: Test the API Endpoints

### 4a. Test subscription status (Requires Authentication)

First, you need a valid Clerk JWT token. In development, Clerk should create a session automatically if you're testing with a Clerk-enabled client.

```bash
# Option 1: Use curl with Clerk token (if you have one)
curl -H "Authorization: Bearer <your-clerk-jwt>" \
  http://localhost:5173/api/subscription/status

# Expected response:
# {
#   "clerkId": "user_xxx",
#   "email": "user@example.com",
#   "subscription": { "status": "active", ... }
# }
```

### 4b. Test get projects

```bash
curl -H "Authorization: Bearer <your-clerk-jwt>" \
  http://localhost:5173/api/projects

# Expected response:
# [
#   {
#     "id": "xxx",
#     "userId": "xxx",
#     "name": "My Project",
#     ...
#   }
# ]
```

### 4c. Test create project

```bash
curl -X POST \
  -H "Authorization: Bearer <your-clerk-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","canvasState":"{}"}' \
  http://localhost:5173/api/projects

# Expected response:
# { "id": "xxx", "name": "Test Project", ... }
```

### 4d. Test get customer

```bash
curl http://localhost:5173/api/customer/1

# Expected response:
# {
#   "id": 1,
#   "userId": "xxx",
#   "name": "User Name",
#   "email": "user@example.com",
#   "plan": "free"
# }
```

## Step 5: Test Database Persistence

1. Create a project in the UI (if using authenticated flow)
2. Refresh the page
3. Verify the project data persists

Or test directly with Prisma:

```bash
npx prisma studio

# Gives you a GUI to inspect the database at http://localhost:5555
```

## Step 6: Build & Production Test

```bash
# Build the client and server
pnpm build

# Start the production server
pnpm start

# Should listen on port 3000 by default
# Visit http://localhost:3000
```

Expected output:
```
Server listening on port 3000
```

## Troubleshooting

### "DATABASE_URL is not set"
- Verify `.env` file exists in project root with `DATABASE_URL=postgresql://...`
- Check the URL format is correct (should have user, password, host, port, database)

### "Clerk authentication failed"
- Verify `CLERK_SECRET_KEY` is set in `.env`
- For development, ensure you're testing with a valid Clerk user account
- Check Clerk dashboard for this project key matches

### "Cannot find @prisma/client"
- Run `npx prisma generate` to create the client
- Run `pnpm install` to ensure all dependencies are installed

### "Tables don't exist in database"
- Run `npx prisma db push` to sync schema
- Or `npx prisma migrate deploy` to run migrations

### "Port 5173 already in use"
- Vite will automatically try the next port
- Or kill the existing process: `lsof -i :5173` then `kill -9 <PID>`

## Success Checklist

- [ ] `pnpm check` passes (TypeScript validation)
- [ ] `pnpm dev` starts without errors
- [ ] Client loads at http://localhost:5173
- [ ] Editor page is accessible
- [ ] Database schema is created (check with `npx prisma studio`)
- [ ] API endpoints respond (test with curl or Postman)
- [ ] User data persists after refresh
- [ ] `pnpm build` succeeds without errors
- [ ] `pnpm start` runs production server on port 3000

## Next Steps After Local Testing

1. **Deploy to Railway**
   - Set environment variables in Railway service
   - Push to Railway branch
   - Run migrations on Railway: `npx prisma migrate deploy`

2. **Implement Stripe Integration**
   - Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to environment
   - Implement webhook handler at `POST /api/stripe/webhook`
   - Wire checkout flow in customer portal

3. **Build Customer Portal**
   - Connect `customer-portal/` frontend to API
   - Display subscription status from `/api/subscription/status`
   - Implement checkout flow to Stripe

## Useful Commands

```bash
# Watch TypeScript for errors while developing
pnpm check --watch

# Format code
pnpm format

# View database with GUI
npx prisma studio

# Reset database (CAREFUL! Deletes all data)
npx prisma migrate reset

# Generate Prisma types
npx prisma generate

# Pull schema from database
npx prisma db pull

# Create a new migration
npx prisma migrate dev --name <description>
```
