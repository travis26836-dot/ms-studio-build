# Local Testing Checklist

## ✅ What's Ready

### Backend Infrastructure
- [x] Prisma 7 configured with PostgreSQL adapter
- [x] Database schema defined (User, Subscription, Customer, Project)
- [x] Async `getPrisma()` factory pattern in `server/db.ts`
- [x] Express server in `server/index.ts` with:
  - [x] Clerk authentication middleware
  - [x] Four API endpoints (GET/POST projects, GET subscription, GET customer)
  - [x] Static file serving + SPA fallback
  - [x] Listening on port 3000 with graceful startup

### Environment
- [x] `.env` file configured with `DATABASE_URL` (Railway PostgreSQL)
- [x] `CLERK_SECRET_KEY` set in `.env`
- [x] `NODE_ENV` defaults to "development"
- [x] All dependencies installed (`pnpm check` passed)
- [x] Prisma client generated (`npx prisma generate` succeeded)

### Documentation
- [x] `LOCAL-TESTING.md` - Step-by-step testing guide
- [x] `.github/instructions/railway-database-setup.instructions.md` - Full setup reference
- [x] Code comments in `server/index.ts` for API endpoints

### Build System
- [x] TypeScript validation passes (`pnpm check`)
- [x] Build script configured (`pnpm build`)
- [x] Production start script configured (`pnpm start`)

## 🧪 To Test Locally

**When you can run terminal commands again, follow this order:**

1. **Initialize database:**
   ```bash
   npx prisma db push
   # or
   npx prisma migrate deploy
   ```

2. **Start dev server:**
   ```bash
   pnpm dev
   ```

3. **Test in browser:**
   - Visit http://localhost:5173
   - Navigate to `/editor`
   - Open DevTools to check for errors

4. **Test API endpoints:**
   - Use curl/Postman or browser DevTools Network tab
   - Test with Clerk authentication (requires signing in via UI)

5. **Test production build:**
   ```bash
   pnpm build
   pnpm start
   # Visit http://localhost:3000
   ```

## 📋 API Endpoints Ready to Test

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/customer/:id` | No | Get customer info |
| GET | `/api/subscription/status` | Yes* | Get user's subscription status |
| GET | `/api/projects` | Yes* | List user's projects |
| POST | `/api/projects` | Yes* | Create new project |

*Requires Clerk authentication header

## 🚀 Next After Local Testing Passes

1. Deploy to Railway
2. Implement Stripe integration (webhook route, checkout flow)
3. Build customer portal frontend
4. Test end-to-end with real Stripe keys

## 📝 Files Modified for Testing

- Created: `test-local.ts` - Automated test script (requires tsx)
- Created: `LOCAL-TESTING.md` - This testing guide
- Created: `LOCAL-TESTING-CHECKLIST.md` - This checklist
- Ready: `server/index.ts` - All endpoints implemented
- Ready: `server/db.ts` - Database connection working
- Ready: `.env` - Environment configured
