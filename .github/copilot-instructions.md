# Project Guidelines

## Code Style
- Use TypeScript and React function components in the main app under `client/`.
- Follow existing import aliases from `tsconfig.json`: `@/*` for `client/src/*` and `@shared/*` for `shared/*`.
- Reuse existing UI and utility patterns before introducing new abstractions:
  - UI primitives in `client/src/components/ui/`
  - Shared utility helpers in `client/src/lib/utils.ts`
  - Canvas/editor logic in `client/src/hooks/useCanvasEditor.ts`
- Keep changes scoped and avoid broad refactors in `imported-source/` unless explicitly requested.

## Architecture
- This repository is a monorepo-style workspace with separate applications:
  - Main product app: `client/` (Vite + React 19)
  - Production web server: `server/index.ts` (Express static hosting + SPA fallback)
  - Shared types/constants: `shared/`
  - Secondary standalone app: `customer-portal/`
  - Legacy/reference code: `imported-source/`
- Main routing for the product app is in `client/src/App.tsx` (`/`, `/editor`, `/api-docs`).
- Root Vite config (`vite.config.ts`) uses `client/` as the Vite root and outputs to `dist/public`.

## Build And Test
- Use `pnpm` at repo root.
- Main app commands (repo root):
  - `pnpm dev` - run Vite dev server
  - `pnpm build` - build client and bundle `server/index.ts` to `dist/`
  - `pnpm start` - run production server from `dist/index.js`
  - `pnpm check` - run TypeScript checks (`tsc --noEmit`)
  - `pnpm format` - run Prettier across repo
- Secondary app commands (`customer-portal/`): `pnpm dev`, `pnpm build`, `pnpm start`.

## Conventions
- Prefer editing code in `client/`, `server/`, and `shared/`; treat `imported-source/` as historical/reference unless a task explicitly targets it.
- Preserve existing router and canvas patterns:
  - Wouter routing in `client/src/App.tsx`
  - Fabric.js editor/state handling in `client/src/hooks/useCanvasEditor.ts`
- Keep design updates aligned with direction in `ideas.md` and current priorities in `todo.md`.
- No established unit/integration test suite is currently configured. When adding significant logic, favor at least `pnpm check` and note any untested areas.
- Be careful when changing routing dependencies: repository includes a local patch at `patches/wouter@3.7.1.patch` configured in root `package.json`.

## References
- Product design direction: `ideas.md`
- Active implementation checklist: `todo.md`
