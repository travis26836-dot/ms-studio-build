# AI Implementation TODO: Gemini Migration + AI Creation Workflow

> Status: PLANNED
> Owner: Nightfall / MS Studio
> Repo: `travis26836-dot/ms-studio-build`
> Working rule: every AI implementation task must update this checklist before, during, and after code changes.

---

## 0. Current Code Audit

- [x] Confirm target repo is `ms-studio-build`, not `MS-studio-build-v2`
- [x] Confirm existing AI text provider is Groq in `server/ai.ts`
- [x] Confirm existing image provider is Together AI / FLUX in `server/ai.ts`
- [x] Confirm dependency currently includes `@ai-sdk/groq`
- [ ] Audit frontend AI entry points for chat, layout, image, and background calls
- [ ] Audit editor sidebar tabs for Templates and Elements search UI
- [ ] Audit current database/schema support for AI usage metering
- [ ] Audit existing Stripe/customer billing hooks

---

## 1. Provider Decision

### Selected Provider

- [x] Use Google Gemini as the single model/provider family for AI features

### Initial Model Targets

- [ ] Text/chat/layout model: `gemini-2.0-flash` or current best free-tier Flash model
- [ ] Image model: Gemini/Google image generation path where available
- [ ] Keep provider configurable by environment variable for future replacement with the in-house Nightfall model

### Required Env Vars

- [ ] Add `GOOGLE_GENERATIVE_AI_API_KEY`
- [ ] Add `AI_TEXT_MODEL`
- [ ] Add `AI_IMAGE_MODEL`
- [ ] Remove production dependency on `GROQ_API_KEY`
- [ ] Remove production dependency on `TOGETHER_IMAGE_API_KEY`
- [ ] Remove production dependency on `TOGETHER_AI_API_KEY`

---

## 2. Backend Migration

### Dependency Changes

- [ ] Remove `@ai-sdk/groq`
- [ ] Add Google/Gemini SDK dependency
- [ ] Update lockfile with package manager
- [ ] Verify TypeScript build

### API Refactor

- [ ] Create provider helper/module for Gemini client setup
- [ ] Replace Groq chat streaming implementation
- [ ] Replace Groq layout generation implementation
- [ ] Replace Together image generation implementation
- [ ] Replace Together background generation implementation
- [ ] Preserve existing API route contracts where possible:
  - [ ] `POST /api/ai/chat`
  - [ ] `POST /api/ai/suggest-layout`
  - [ ] `POST /api/ai/generate-image`
  - [ ] `POST /api/ai/generate-background`

### Reliability

- [ ] Validate all incoming AI request payloads with strict schemas
- [ ] Add clear 400 errors for bad prompts, dimensions, and missing params
- [ ] Add clear 503 errors for missing Gemini API key
- [ ] Add model/provider error normalization
- [ ] Add JSON-only parsing guardrails for layout responses
- [ ] Add basic request logging without leaking prompts or API keys

---

## 3. AI Usage + Cost Mitigation

### Usage Metering

- [ ] Add user-level AI usage tracking
- [ ] Track feature type:
  - [ ] chat
  - [ ] layout
  - [ ] image
  - [ ] background
  - [ ] SVG/vector
  - [ ] audio/video later
- [ ] Track estimated cost units or credit units per request
- [ ] Track provider response metadata where available
- [ ] Add monthly reset logic

### Product Gating

- [ ] Add free-tier usage cap
- [ ] Add premium-tier higher usage cap
- [ ] Add pay-per-use / credit-pack placeholder architecture
- [ ] Add UI copy for exhausted AI credits
- [ ] Add server-side enforcement so users cannot bypass UI limits

### Billing

- [ ] Map AI credits to Stripe products/prices later
- [ ] Add feature flags for enabling paid AI usage
- [ ] Do not block Gemini migration on final pricing model

---

## 4. Templates Tab AI UX

### Search Box Dual Mode

- [ ] Add AI toggle button beside or inside Templates search box
- [ ] Default mode: normal template search
- [ ] AI mode: prompt input for template/layout generation
- [ ] Preserve recent normal searches
- [ ] Add recent AI prompts
- [ ] Add recommended template prompts by scenario/platform

### Recommended Template AI Prompts

- [ ] Social media launch post
- [ ] Product mockup layout
- [ ] Blog outline graphic
- [ ] Flyer
- [ ] Brand announcement
- [ ] Sale/promo creative
- [ ] Story/reel cover
- [ ] YouTube thumbnail
- [ ] Email header
- [ ] Print-ready product insert

### Brand Kit Integration

- [ ] If user has premium Brand Kit, inject brand colors/fonts/logos into prompt context
- [ ] If no Brand Kit, infer a temporary style from prompt and selected template
- [ ] Never expose another user’s brand data

---

## 5. Elements Tab AI UX

### Elements Search Box AI Mode

- [ ] Add AI toggle button beside or inside Elements search box
- [ ] Default mode: normal element search
- [ ] AI mode: targeted generation prompt
- [ ] Show recent element searches/prompts
- [ ] Show recommended element prompts

### AI Scope Dropdown

When AI mode is enabled, show a scope selector:

- [ ] Image
- [ ] Graphic
- [ ] Code
- [ ] Video
- [ ] Music
- [ ] Sound Effects
- [ ] Voiceovers
- [ ] Shapes
- [ ] 3D
- [ ] Charts
- [ ] Forms

### Scope Handling

- [ ] Image: route to Gemini/Google image generation
- [ ] Graphic: prefer SVG/vector generation first
- [ ] Code: generate embeddable HTML/CSS/JS snippet or structured widget definition
- [ ] Video: initially stock search or placeholder, generation later
- [ ] Music: initially placeholder/stock search, generation later
- [ ] Sound Effects: initially placeholder/stock search, generation later
- [ ] Voiceovers: initially placeholder, generation later
- [ ] Shapes: generate Fabric.js shape objects
- [ ] 3D: initially stock/placeholder, generation later
- [ ] Charts: generate chart config/data-driven element
- [ ] Forms: generate form layout components

---

## 6. Image Generation Strategy

### Short-Term

- [ ] Replace Together/FLUX image endpoint with Gemini/Google image generation
- [ ] Add explicit cost/credit estimate before expensive generation
- [ ] Add dimensions validation
- [ ] Add safety/error handling for blocked generations
- [ ] Save generated outputs with ownership metadata

### Vector-First Mitigation

- [ ] Add SVG generation endpoint for graphics, patterns, icons, and abstract backgrounds
- [ ] Prefer SVG for graphics whenever user asks for editable assets
- [ ] Add Fabric.js SVG insertion support if missing
- [ ] Let users convert generated SVG to canvas elements when possible

### Long-Term

- [ ] Add provider abstraction so in-house Nightfall AI model can replace Gemini later
- [ ] Add fallback provider only after pricing and reliability justify it

---

## 7. Stock Asset Library

### Royalty-Free Images

- [ ] Select approved stock image source(s)
- [ ] Verify license compatibility for customer commercial use
- [ ] Add attribution requirements where necessary
- [ ] Ingest metadata:
  - [ ] category
  - [ ] tags
  - [ ] orientation
  - [ ] color hints
  - [ ] source
  - [ ] license
  - [ ] attribution

### Royalty-Free Video Clips

- [ ] Select approved stock video source(s)
- [ ] Verify license compatibility for customer commercial use
- [ ] Add categories and filters
- [ ] Add search endpoint
- [ ] Add preview thumbnails

### Search + Filters

- [ ] Category filter
- [ ] Media type filter
- [ ] Orientation filter
- [ ] Color/style filter
- [ ] License filter
- [ ] Recently used assets

---

## 8. Data Model / Storage

- [ ] Add generated asset records
- [ ] Add stock asset records
- [ ] Add AI request records
- [ ] Add AI usage summary records
- [ ] Add user-owned generated asset library
- [ ] Add metadata for provider/model/prompt hash/cost units
- [ ] Do not store raw prompts longer than necessary unless product needs it

---

## 9. Safety + Legal

- [ ] Add AI Terms note for generated assets
- [ ] Add warning that generated outputs may not be unique
- [ ] Add commercial-use disclaimer for generated media
- [ ] Store licensing metadata for stock assets
- [ ] Add moderation handling for blocked prompts
- [ ] Prevent API keys from reaching client bundle

---

## 10. Implementation Branches

Suggested branches:

- [ ] `feature/ai-gemini-provider-migration`
- [ ] `feature/ai-usage-metering`
- [ ] `feature/templates-ai-toggle`
- [ ] `feature/elements-ai-toggle`
- [ ] `feature/stock-asset-library`

---

## 11. Definition of Done

The Gemini migration is complete when:

- [ ] Groq is removed from runtime code
- [ ] Together is removed from runtime code
- [ ] Gemini handles chat
- [ ] Gemini handles layout suggestions
- [ ] Gemini/Google handles image/background generation or returns a planned, gated provider error
- [ ] AI routes validate input
- [ ] AI routes enforce usage limits
- [ ] Templates tab has AI toggle plan implemented or tracked
- [ ] Elements tab has AI toggle plan implemented or tracked
- [ ] Tests/typecheck pass
- [ ] This TODO is moved from `PLANNED_FEATURES` to `IMPLEMENTED` after completion

---

## Notes

The product direction is not just "prompt to image." Nightfall should become a conversational editable design engine. Raster image generation is necessary, but it should be treated as a paid/high-cost operation. Editable layouts, SVGs, shapes, forms, charts, and template-aware modifications should be cheaper default AI paths.
