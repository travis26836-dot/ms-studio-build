# Local Development & Railway Production Checklist

## Important Update

The `.devcontainer` folder is removed.
Use `pnpm` scripts for local development.

## Local Development

### Do This In Order

```bash
# 1) Install dependencies
pnpm install

# 2) Start local app + API
pnpm dev:full
```

### Done When

1. App loads at http://localhost:3003
2. API responds at http://localhost:3010
3. Terminal shows no startup crash

### Stop

- Stop the running terminal with `Ctrl+C`.

### Health Checks

```bash
pnpm check
```

## Railway Production

### Do This In Order

1. Create or open your Railway project.
2. Add a PostgreSQL service.
3. Set all required Railway variables.
4. Deploy from GitHub or CLI.
5. Verify logs and production URL.

### CLI Deploy (Optional)

```bash
railway login
railway link
railway up
```

### Required Railway Variables

- `DATABASE_URL`
- `NODE_ENV=production`
- `API_PORT=3010`
- `PORT=3010`
- `VITE_API_URL`
- Clerk production keys
- Stripe production keys
- AI provider keys

### Verify Deployment

1. Open Railway deployment logs.
2. Confirm startup includes successful app boot and DB connectivity.
3. Validate production URL and auth/payment flows.

## Common Issues

### Local build/start issues

```bash
pnpm install
pnpm check
pnpm build
```

### Railway start issues

1. Verify all required variables are set.
2. Confirm PostgreSQL service is attached.
3. Check Railway deployment logs.

## File Reference

| File | Purpose |
|------|---------|
| `.env.local` | Local environment values (git-ignored) |
| `.env.example` | Environment template |
| `LOCAL_AND_RAILWAY_SETUP.md` | Full setup details |
| `RAILWAY_ENV_SETUP.md` | Railway-specific configuration |
| `railway.toml` | Optional Railway deploy hints |
