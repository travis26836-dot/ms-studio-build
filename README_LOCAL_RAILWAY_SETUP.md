# MS-Studio Setup Docs Index

## Important Update

The `.devcontainer` folder was removed.
Any previous `.devcontainer/docker-compose.yml` and Dockerfile references are no longer valid.

## Where To Start

1. Execute `SETUP_CHECKLIST.md` from top to bottom.
2. Use `LOCAL_AND_RAILWAY_SETUP.md` if you need detailed local and deploy flow.
3. Use `RAILWAY_ENV_SETUP.md` only when setting or troubleshooting Railway variables.

## Local Development

Run these commands in this order from repo root:

```bash
pnpm install
pnpm dev:full
```

Default local endpoints:

- App: http://localhost:3003
- API: http://localhost:3010

Stop with `Ctrl+C` in the terminal running `pnpm dev:full`.

## Railway Production

Deploy using GitHub integration or Railway CLI:

```bash
railway login
railway link
railway up
```

Set all required secrets in Railway Dashboard -> Variables.

## Core Files

| File | Purpose |
|------|---------|
| `.env.local` | Local development environment values (git-ignored) |
| `LOCAL_AND_RAILWAY_SETUP.md` | Full setup flow |
| `RAILWAY_ENV_SETUP.md` | Railway variable setup |
| `SETUP_CHECKLIST.md` | Quick checklist and troubleshooting |
| `railway.toml` | Optional Railway deploy hints |

## Notes

- Local development is now `pnpm` script based.
- Railway still uses environment variables from the Dashboard.
- No dev-container-specific paths are required anymore.
