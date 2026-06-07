# Quick Start — Local Development (2 Minutes)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start Everything

```bash
npm run dev:full
```

This starts the local development workflow for the main app and API.

## Step 3: Verify Local Endpoints

- **App UI**: <http://localhost:3003>
- **API**: <http://localhost:3010>
- **Environment**: `.env.local` (git-ignored)

## Step 4: You're Done

Both servers are running. The app should load and be ready to develop.

### Stop Everything

Press `Ctrl+C` in the terminal running `npm run dev:full`.

---

## Health Check

```bash
npm run check
```

This validates TypeScript and configuration.

---

## Next Steps

- Need to configure authentication? → **03-CLERK-AUTHENTICATION.md**
- Need detailed setup info? → **02-PROJECT-CONFIGURATION.md**
- Deploying to production? → **RAILWAY-VARIABLES-REFERENCE.md**
