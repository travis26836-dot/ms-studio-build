# Setup & Instructions Index

All setup and configuration documentation is organized here. **Start at the top and work your way down.**

## Quick Navigation

| File | Purpose |
| ------ | --------- |
| **01-QUICK-START.md** | 🚀 Start here — 2-minute local setup |
| **02-PROJECT-CONFIGURATION.md** | 📋 Environment variables & build pipeline |
| **03-CLERK-AUTHENTICATION.md** | 🔐 Auth setup — required for app to load |
| **04-RAILWAY-DATABASE.md** | 🗄️ PostgreSQL & Prisma setup |
| **05-STRIPE-SETUP.md** | 💳 Payment integration |
| **DETAILED-LOCAL-AND-RAILWAY.md** | 📚 Full step-by-step flow (all environments) |
| **RAILWAY-VARIABLES-REFERENCE.md** | 🔑 Railway environment variable guide |

## Recommended Reading Order

1. **01-QUICK-START.md** — Get local dev running in 2 minutes
2. **02-PROJECT-CONFIGURATION.md** — Understand the config and build
3. **03-CLERK-AUTHENTICATION.md** — Set up auth (required!)
4. **04-RAILWAY-DATABASE.md** — Database setup for local + production
5. **05-STRIPE-SETUP.md** — Subscription integration
6. Reference **DETAILED-LOCAL-AND-RAILWAY.md** or **RAILWAY-VARIABLES-REFERENCE.md** as needed

## Key Commands

```bash
# Local development
pnpm install
pnpm dev:full

# Production deployment
railway login
railway link
railway up
```

## Troubleshooting

- **App won't load?** Check **03-CLERK-AUTHENTICATION.md**
- **Database issues?** Check **04-RAILWAY-DATABASE.md**
- **Railway deployment failing?** Check **RAILWAY-VARIABLES-REFERENCE.md**
- **Need all the details?** Read **DETAILED-LOCAL-AND-RAILWAY.md**
