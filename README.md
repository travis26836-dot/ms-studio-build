# Veronica AI Studio

Veronica AI Studio is a React/Fabric design editor with Clerk sign-in and
PostgreSQL persistence through Prisma. Signed-in users save designs and Brand
Kit settings to the database associated with their account.

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create or select a Neon PostgreSQL project, then set its **direct**
   connection string in both `.env` and `.env.local`:

   ```env
   DATABASE_URL="postgresql://..."
   ```

   `.env.local` overrides `.env` when the development API starts. Both files
   are ignored by Git and must never be committed.

3. Configure the required Clerk variables in the same local environment files:

   ```env
   CLERK_SECRET_KEY=...
   CLERK_PUBLISHABLE_KEY=...
   VITE_CLERK_PUBLISHABLE_KEY=...
   ```

4. Apply database migrations:

   ```bash
   pnpm exec prisma migrate deploy
   ```

5. Configure Veronica AI in `.env.local`:

   ```env
   VERONICA_AI_API_KEY=your_key
   VERONICA_AI_BASE_URL=https://your-veronica-api.example/v1
   AI_TEXT_MODEL=veronica-text
   AI_IMAGE_MODEL=veronica-image
   ```

   The adapter uses the OpenAI-compatible `/chat/completions` and
   `/images/generations` endpoints. Keep these values server-side; never put
   the API key in a `VITE_` variable.

## Run locally

```bash
pnpm dev
```

The development stack starts:

| Service | URL |
| --- | --- |
| Design editor | http://127.0.0.1:3003 |
| API health | http://127.0.0.1:3010/api/health |
| Customer portal | http://127.0.0.1:3004 |

The editor and customer portal use separate fixed ports. The development
launcher starts the portal directly through Vite so it cannot take over the
editor's port.

## Persistent user data

- **Identity:** Clerk verifies the signed-in user.
- **Database:** Neon PostgreSQL stores application data through Prisma.
- **Saved work:** projects are scoped to the authenticated user. If the
  database is unavailable, a signed-in save fails visibly; it is never silently
  stored only in server memory.
- **Brand Kit:** colors, fonts, and logos are stored in the account's
  `UserSettings` record. Existing browser-local Brand Kit data is imported
  after sign-in, then synchronized with the account.

The `User`, `Project`, and `UserSettings` tables are the main persistence
records for editor users. Prisma's `_prisma_migrations` table is its internal
migration history and should not be edited manually.

## Verify the setup

After starting the stack, open the API health URL. A healthy response is:

```json
{ "status": "ok", "database": "connected" }
```

Then sign in, save a design, and refresh the editor. The design should appear
for that same account. You can inspect the data in Neon Console under
**Tables**.

## Checks

```bash
pnpm check
pnpm build
```
