# AI Feature Implementation TODO

## Current State

- `client/src/AIChatPanel.tsx` — exists, uses `trpc.ai.chat.useMutation()` (mock stub)
- `client/src/lib/trpc.ts` — has four mock `trpc.ai.*` stubs:
  - `trpc.ai.chat` → `buildChatResponse()` (keyword-matched hardcoded strings)
  - `trpc.ai.generateImage` → `createAiImage()` (SVG placeholder)
  - `trpc.ai.generateBackground` → `createAiBackground()` (SVG placeholder)
  - `trpc.ai.suggestLayout` → `createLayoutSuggestion()` (hardcoded layout)
- `client/src/Editor.tsx` → `AIPanel` component uses all four stubs; `AIChatPanel` is toggled from the top toolbar
- `server/index.ts` — Express server with Clerk + Prisma; **no AI routes yet**
- `shared/const.ts` — only has `COOKIE_NAME` and `ONE_YEAR_MS`; no AI constants
- `shared/designTypes.ts` — has `CanvasElement`, `CanvasState`; no AI-specific types
- `package.json` — no `ai`, `@ai-sdk/groq`, `openai`, or `@huggingface/transformers` packages

---

## Option 1 — Transformers.js (Browser-native, Free)

### Dependencies
- [ ] `pnpm add @huggingface/transformers` (Apache-2.0)

### New Files
- [ ] `client/src/workers/ai-worker.ts`
  - Bootstrap `@huggingface/transformers` pipeline on first use
  - Handle `text-generation` messages (chat, layout, critique)
  - Stream tokens back to main thread via `postMessage`
  - Show model download progress (first load ~1.2 GB, then cached)
- [ ] `client/src/lib/aiLocalEngine.ts`
  - Thin wrapper around the Web Worker
  - Expose `generateText(prompt, onToken)` and `generateImage(prompt)` with identical signatures to the server options (so UI is swappable)
  - Use ONNX Runtime Web + Stable Diffusion Turbo for image generation

### Modified Files
- [ ] `client/src/lib/trpc.ts`
  - Replace `buildChatResponse` stub → delegate to `aiLocalEngine.generateText()`
  - Replace `createAiImage` stub → delegate to `aiLocalEngine.generateImage()`
  - Replace `createAiBackground` stub → delegate to `aiLocalEngine.generateImage()` with background prompt
  - Replace `createLayoutSuggestion` stub → delegate to `aiLocalEngine.generateText()` with canvas schema system prompt + Zod parse of JSON response
- [ ] `client/src/AIChatPanel.tsx`
  - Add model-loading progress bar (show on first use while model downloads)
  - Switch from single `result.response` to streaming token display
  - Add "Include current design" canvas context toggle

### Vite Config
- [ ] `vite.config.ts` — add worker support if needed for `@huggingface/transformers` Web Workers (cross-origin isolation headers may be required for SharedArrayBuffer / WebGPU)

---

## Option 2 — Vercel AI SDK + Groq (Server-side, Free Tier)

### Dependencies
- [ ] `pnpm add ai @ai-sdk/groq`

### New Files
- [ ] `server/ai.ts`
  - `POST /api/ai/chat` — `streamText()` with Groq provider; requires auth via `getOrCreateUser()`; streams SSE response
  - `POST /api/ai/suggest-layout` — `generateObject()` with Zod schema matching `CanvasElement[]` shape; returns validated JSON
  - `POST /api/ai/generate-image` — proxy to Together AI FLUX.1 free tier or self-hosted Stable Diffusion on Railway
- [ ] `client/src/lib/aiClient.ts`
  - Typed `fetch` wrappers replacing the four `trpc.ai.*` mock stubs
  - `chatStream(message, history, onToken)` — consumes SSE stream, calls `onToken` per chunk
  - `generateImage(prompt)` → `Promise<{ url: string }>`
  - `generateBackground(prompt, width, height)` → `Promise<{ url: string }>`
  - `suggestLayout(purpose, canvasWidth, canvasHeight)` → `Promise<LayoutSuggestion>`

### Modified Files
- [ ] `server/index.ts`
  - Import and mount AI routes from `server/ai.ts` (before the SPA fallback)
- [ ] `client/src/lib/trpc.ts`
  - Delegate `trpc.ai.chat` → `aiClient.chatStream()`
  - Delegate `trpc.ai.generateImage` → `aiClient.generateImage()`
  - Delegate `trpc.ai.generateBackground` → `aiClient.generateBackground()`
  - Delegate `trpc.ai.suggestLayout` → `aiClient.suggestLayout()`
- [ ] `client/src/AIChatPanel.tsx`
  - Replace one-shot `chatMutation.mutateAsync()` with `aiClient.chatStream()` SSE consumer
  - Stream tokens into the last assistant message in real time (Streamdown already handles markdown)
  - Add canvas context toggle ("Include current design") that serializes editor state and passes as `canvasContext`

### Railway Environment Variables
- [ ] Add `GROQ_API_KEY` to Railway service variables (free account at console.groq.com)

---

## Option 3 — OpenAI (Paid, Pro-tier Gate)

### Dependencies
- [ ] `pnpm add openai`

### New / Modified Files
- [ ] `server/ai.ts` — same route structure as Option 2 but with OpenAI providers:
  - `POST /api/ai/chat` — `openai.chat.completions.create({ model: "gpt-4o", stream: true })`
  - `POST /api/ai/suggest-layout` — `openai.beta.chat.completions.parse()` with Zod schema
  - `POST /api/ai/generate-image` — `openai.images.generate({ model: "dall-e-3" })`
  - `POST /api/ai/copy` — new route: `{ tone, platform, goal }` → headline variants
  - Subscription gate: check `prisma.customer.plan` before calling OpenAI; return `402` for free-tier users
- [ ] `client/src/lib/aiClient.ts` — add `generateCopy(tone, platform, goal)` wrapper for the new copy route
- [ ] `client/src/Editor.tsx` — expose Critique / Copy Writing button in `AIPanel` calling the new route

### Railway Environment Variables
- [ ] Add `OPENAI_API_KEY` to Railway service variables

---

## Shared Additions (All Options)

### `VITE_AI_PROVIDER` Runtime Switch
- [ ] Add `VITE_AI_PROVIDER` env var (`"local"` | `"groq"` | `"openai"`) to `.env` and Railway
- [ ] `client/src/lib/aiClient.ts` or `trpc.ts` — read `import.meta.env.VITE_AI_PROVIDER` and route to the correct backend without rebuilding

### `shared/const.ts`
- [ ] Add `AI_PROVIDERS` constant:
  ```ts
  export const AI_PROVIDERS = ["local", "groq", "openai"] as const;
  export type AIProvider = (typeof AI_PROVIDERS)[number];
  ```

### `shared/designTypes.ts`
- [ ] Add `AIGeneratedElement` type extending `CanvasElement` for audit trail:
  ```ts
  export interface AIGeneratedElement extends CanvasElement {
    aiGenerated: true;
    aiProvider: AIProvider;
    aiPrompt: string;
    aiGeneratedAt: string; // ISO timestamp
  }
  ```

### `client/src/AIChatPanel.tsx` (shared UI upgrades)
- [ ] Real token streaming (replacing single-shot mutation pattern)
- [ ] Model/provider status indicator in header (e.g. "Groq · Llama 3.3 70B")
- [ ] "Include current design" canvas context toggle — serializes editor state and appends to message

### `client/src/Editor.tsx` — AI Sidebar Panel (`AIPanel`)
- [ ] Add **Critique** button — sends serialized `CanvasState` to chat/critique endpoint, shows bullet-point feedback
- [ ] Add **Copy Writing** button (Option 3 only) — opens tone/platform/goal form, calls `/api/ai/copy`
- [ ] Wire existing Generate Image / Generate Background / Suggest Layout buttons to the real backends via `aiClient`

---

## Recommended Implementation Order

1. **Option 2 (Groq)** — fastest to have working AI; no browser download, no paid key, good quality
   - Add `server/ai.ts` with chat + suggest-layout routes
   - Add `client/src/lib/aiClient.ts` with fetch wrappers
   - Update `trpc.ai.*` stubs to delegate to `aiClient`
   - Update `AIChatPanel` for SSE streaming
2. **Option 1 (Transformers.js)** — offline / zero-infrastructure fallback
   - Add `ai-worker.ts` + `aiLocalEngine.ts`
   - Gate with `VITE_AI_PROVIDER=local`
3. **Option 3 (OpenAI)** — Pro-tier gate last
   - Extend `server/ai.ts` with OpenAI provider and subscription gate
   - Add copy writing route and button in `AIPanel`
4. **Shared additions** — can be done alongside any option
   - `AI_PROVIDERS` constant, `AIGeneratedElement` type, `VITE_AI_PROVIDER` switch

---

## Notes / Gotchas

- `trpc.ts` currently uses a localStorage mock pattern with custom `useLocalMutation` / `useLocalQuery` hooks — not real tRPC. When delegating to `aiClient`, the wrapper interface must stay the same (`{ useMutation: () => ({ mutateAsync, isPending }) }`) so `AIChatPanel` and `AIPanel` in `Editor.tsx` require no structural changes.
- The `Streamdown` component is already imported in `AIChatPanel.tsx` and handles markdown streaming — no new markdown renderer needed.
- Option 2's `POST /api/ai/chat` must be registered in `server/index.ts` **before** `app.use(express.static(...))` and the `app.get("*", ...)` SPA fallback.
- Option 1 (Transformers.js + WebGPU) requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers for SharedArrayBuffer. These need to be set in either Vite dev server config or the Express server for production.
- Zod 4 (already in `package.json`) has breaking API changes from v3 — double-check schema definitions when using `generateObject()` from the `ai` SDK.
