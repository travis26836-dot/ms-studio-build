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

## State Management & Patterns
- **No global state library**: Uses React Context (`ThemeContext`) + local component state + `useCanvasEditor` hook
- **localStorage patterns**: Custom `readStore(key, fallback)` and `writeStore(key, value)` helpers in `client/src/lib/trpc.ts`
  - Structures: `ProjectRecord` (projects), `TemplateRecord` (templates), `PhotoRecord` (images)
  - Keys use namespaced pattern: `manus-studio.projects.v1`, `manus-studio.templates.v1`
- **Custom hook API** (not actual tRPC):
  - `useLocalQuery<T>(fetcher, deps, options?)` → `{ data, isLoading, refetch }`
  - `useLocalMutation<In, Out>(mutator)` → `{ mutateAsync, isPending }`
- **Fabric.js Editor State**: All canvas manipulation flows through `useCanvasEditor` hook
  - Maintains a 50-item fixed-size history stack (JSON snapshots)
  - Key exports: `addShape()`, `deleteSelected()`, `undo()`, `redo()`, `exportCanvas()`, `loadFromJSON()`
  - Critical: `isHistoryActionRef` flag prevents duplicate history entries when loading snapshots

## Data Types & Structures
- **CanvasElement**: Fabric.js object with metadata (transform, fill, stroke, text, effects)
- **DesignTypes** in `shared/designTypes.ts`:
  - ElementType: "text" | "image" | "shape" | "icon" | "group"
  - CANVAS_PRESETS: Social media sizes (Instagram 1080x1080, Twitter 1600x900, etc.)
  - TEMPLATE_CATEGORIES: "social-media", "flyer", "presentation", etc.
- **Project/Template Schema**:
  - ProjectRecord: { id, name, description, category, canvasWidth, canvasHeight, canvasData (JSON), thumbnailUrl, created, modified }
  - TemplateRecord: Similar, no timestamps
  - PhotoRecord: { url, thumb, alt, tags }

## Development Patterns & Pitfalls
- **Wouter Routing Patch**: `patches/wouter@3.7.1.patch` collects routes to `window.__WOUTER_ROUTES__` for debugging. Must be preserved in `package.json`; upgrading Wouter requires reapplying the patch.
- **Import Aliases Matter**: Use `@/*` for `client/src/*` and `@shared/*` for `shared/*`. Auto-complete may suggest full paths; only aliases are bundled correctly.
- **LocalStorage Safety**: Guard with `if (typeof window !== "undefined")` when used in SSR contexts.
- **Theme Context**: Directly mutates `document.documentElement.classList` (not state-driven). Works but not reactive.
- **Fabric History Flag**: When loading canvas from JSON, set `isHistoryActionRef.current = true` to prevent undo/redo loops.

## Debug & Performance
- **Manus Debug Collector** (Vite plugin):
  - Captures browser logs, network requests, session events
  - Writes to `.manus-logs/` with auto-trimming at 1MB per file
  - Endpoint: `/__manus__/logs` (POST, dev only)
  - Useful for debugging in remote/production-like environments
- **TypeScript Strict Mode**: `pnpm check` validates all code; run before commits
- **Canvas Rendering**: Calls `canvas.renderAll()` after every mutation; acceptable for responsiveness but can be slow with 100+ objects
- **History Overhead**: 50-item snapshot stack is bounded but can be large for complex designs; consider compression for future releases

## Special Dependencies & Versions
- **React 19** with function components and hooks
- **Fabric.js 5.3.0** for canvas manipulation; very large bundle (~500KB+)
- **Wouter 3.7.1** patched for route introspection
- **Tailwind CSS 4** via `@tailwindcss/vite` (no separate build step)
- **Radix UI** primitives for accessible components (Button, Dialog, Select, etc.)
- **React Hook Form** + Zod for form validation

## Build Pipeline Details
- **Root Vite config** uses `client/` as Vite root; outputs to `dist/public`
- **Server bundling**: `esbuild` with `--packages=external` (Node built-ins not bundled)
- **SPA Fallback**: Server serves `index.html` for all unmapped routes (preserves client-side routing)
- **Allowed Hosts** in dev: Includes `.manus*.computer`, `localhost` for local + remote dev
- **Strict filesystem access**: `fs.strict: true, deny: ['**/.*']` prevents serving dotfiles

## References
- Product design direction: `ideas.md` (Neo-industrial editorial workspace with graphite/ink/amber colors; Space Grotesk + Source Sans 3 typography)
- Active implementation checklist: `todo.md`
