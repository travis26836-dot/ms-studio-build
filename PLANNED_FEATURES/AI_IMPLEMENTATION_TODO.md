# AI Implementation TODO: Gemini Migration + AI Creation Workflow

> Status: IN PROGRESS (BLOCKED: Gemini API key authentication/permissions failing at runtime)
> Owner: Nightfall / MS Studio
> Repo: `travis26836-dot/ms-studio-build`
> Working rule: every AI implementation task must update this checklist before, during, and after code changes.
> Blocking condition: do not mark complete until Gemini requests succeed at runtime for chat, layout, image, and background.

---

## 0. Current Code Audit

- [x] Confirm target repo is `ms-studio-build`, not `MS-studio-build-v2`
- [x] Confirm existing AI text provider is Groq in `server/ai.ts`
- [x] Confirm existing image provider is Together AI / FLUX in `server/ai.ts`
- [x] Confirm dependency currently includes `@ai-sdk/groq`
- [x] Audit frontend AI entry points for chat, layout, image, and background calls
- [x] Audit editor sidebar tabs for Templates and Elements search UI
- [x] Audit current database/schema support for AI usage metering
- [x] Audit existing Stripe/customer billing hooks

---

## 1. Provider Decision

### Selected Provider

- [x] Use Google Gemini as the single model/provider family for AI features

### Initial Model Targets

- [x] Text/chat/layout model: `gemini-2.0-flash` or current best free-tier Flash model
- [x] Image model: Gemini/Google image generation path where available
- [x] Keep provider configurable by environment variable for future replacement with the in-house Nightfall model

### Required Env Vars

- [x] Add `GOOGLE_GENERATIVE_AI_API_KEY`
- [x] Add `AI_TEXT_MODEL`
- [x] Add `AI_IMAGE_MODEL`
- [x] Remove production dependency on `GROQ_API_KEY`
- [x] Remove production dependency on `TOGETHER_IMAGE_API_KEY`
- [x] Remove production dependency on `TOGETHER_AI_API_KEY`

---

## 2. Backend Migration

### Dependency Changes

- [x] Remove `@ai-sdk/groq`
- [x] Add Google/Gemini SDK dependency
- [x] Update lockfile with package manager
- [x] Verify TypeScript build

### API Refactor

- [x] Create provider helper/module for Gemini client setup
- [x] Replace Groq chat streaming implementation
- [x] Replace Groq layout generation implementation
- [x] Replace Together image generation implementation
- [x] Replace Together background generation implementation
- [x] Preserve existing API route contracts where possible:
  - [x] `POST /api/ai/chat`
  - [x] `POST /api/ai/suggest-layout`
  - [x] `POST /api/ai/generate-image`
  - [x] `POST /api/ai/generate-background`

### Reliability

- [x] Validate all incoming AI request payloads with strict schemas
- [x] Add clear 400 errors for bad prompts, dimensions, and missing params
- [x] Add clear 503 errors for missing Gemini API key
- [x] Add model/provider error normalization
- [x] Add JSON-only parsing guardrails for layout responses
- [x] Add basic request logging without leaking prompts or API keys

---

## 3. AI Usage + Cost Mitigation

### Usage Metering

- [x] Add user-level AI usage tracking
- [ ] Track feature type:
  - [x] chat
  - [x] layout
  - [x] image
  - [x] background
  - [x] SVG/vector
  - [x] audio/video later
- [x] Track estimated cost units or credit units per request
- [x] Track provider response metadata where available
- [x] Add monthly reset logic

### Product Gating

- [x] Add free-tier usage cap
- [x] Add premium-tier higher usage cap
- [x] Add pay-per-use / credit-pack placeholder architecture
- [x] Add UI copy for exhausted AI credits
- [x] Add server-side enforcement so users cannot bypass UI limits

### Billing

- [x] Map AI credits to Stripe products/prices later
- [x] Add feature flags for enabling paid AI usage
- [x] Do not block Gemini migration on final pricing model

---

## 4. Templates Tab AI UX

### Search Box Dual Mode

- [x] Add AI toggle button beside or inside Templates search box
- [x] Default mode: normal template search
- [x] AI mode: prompt input for template/layout generation
- [x] Preserve recent normal searches
- [x] Add recent AI prompts
- [x] Add recommended template prompts by scenario/platform

### Recommended Template AI Prompts

- [x] Social media launch post
- [x] Product mockup layout
- [x] Blog outline graphic
- [x] Flyer
- [x] Brand announcement
- [x] Sale/promo creative
- [x] Story/reel cover
- [x] YouTube thumbnail
- [x] Email header
- [x] Print-ready product insert

### Brand Kit Integration

- [x] If user has premium Brand Kit, inject brand colors/fonts/logos into prompt context
- [x] If no Brand Kit, infer a temporary style from prompt and selected template
- [x] Never expose another user’s brand data

---

## 5. Elements Tab AI UX

### Elements Search Box AI Mode

- [x] Add AI toggle button beside or inside Elements search box
- [x] Default mode: normal element search
- [x] AI mode: targeted generation prompt
- [x] Show recent element searches/prompts
- [x] Show recommended element prompts

### AI Scope Dropdown

When AI mode is enabled, show a scope selector:

- [x] Image
- [x] Graphic
- [x] Code
- [x] Video
- [x] Music
- [x] Sound Effects
- [x] Voiceovers
- [x] Shapes
- [x] 3D
- [x] Charts
- [x] Forms

### Scope Handling

- [x] Image: route to Gemini/Google image generation
- [x] Graphic: prefer SVG/vector generation first
- [x] Code: generate embeddable HTML/CSS/JS snippet or structured widget definition
- [x] Video: initially stock search or placeholder, generation later
- [x] Music: initially placeholder/stock search, generation later
- [x] Sound Effects: initially placeholder/stock search, generation later
- [x] Voiceovers: initially placeholder, generation later
- [x] Shapes: generate Fabric.js shape objects
- [x] 3D: initially stock/placeholder, generation later
- [x] Charts: generate chart config/data-driven element
- [x] Forms: generate form layout components

---

## 6. Image Generation Strategy

### Short-Term

- [x] Replace Together/FLUX image endpoint with Gemini/Google image generation
- [x] Add explicit cost/credit estimate before expensive generation
- [x] Add dimensions validation
- [x] Add safety/error handling for blocked generations
- [x] Save generated outputs with ownership metadata

### Vector-First Mitigation

- [x] Add SVG generation endpoint for graphics, patterns, icons, and abstract backgrounds
- [x] Prefer SVG for graphics whenever user asks for editable assets
- [x] Add Fabric.js SVG insertion support if missing
- [x] Let users convert generated SVG to canvas elements when possible

### Long-Term

- [x] Add provider abstraction so in-house Nightfall AI model can replace Gemini later
- [x] Add fallback provider only after pricing and reliability justify it

---

## 7. Stock Asset Library

### Royalty-Free Images

- [x] Select approved stock image source(s)
- [x] Verify license compatibility for customer commercial use
- [x] Add attribution requirements where necessary
- [ ] Ingest metadata:
  - [x] category
  - [x] tags
  - [x] orientation
  - [x] color hints
  - [x] source
  - [x] license
  - [x] attribution

### Royalty-Free Video Clips

- [x] Select approved stock video source(s)
- [x] Verify license compatibility for customer commercial use
- [x] Add categories and filters
- [x] Add search endpoint
- [x] Add preview thumbnails

### Search + Filters

- [x] Category filter
- [x] Media type filter
- [x] Orientation filter
- [x] Color/style filter
- [x] License filter
- [x] Recently used assets

---

## 8. Data Model / Storage

- [x] Add generated asset records
- [x] Add stock asset records
- [x] Add AI request records
- [x] Add AI usage summary records
- [x] Add user-owned generated asset library
- [x] Add metadata for provider/model/prompt hash/cost units
- [x] Do not store raw prompts longer than necessary unless product needs it

---

## 9. Safety + Legal

- [x] Add AI Terms note for generated assets
- [x] Add warning that generated outputs may not be unique
- [x] Add commercial-use disclaimer for generated media
- [x] Store licensing metadata for stock assets
- [x] Add moderation handling for blocked prompts
- [x] Prevent API keys from reaching client bundle

---

## 10. Implementation Branches

Suggested branches:

- [x] `feature/ai-gemini-provider-migration`
- [x] `feature/ai-usage-metering`
- [x] `feature/templates-ai-toggle`
- [x] `feature/elements-ai-toggle`
- [x] `feature/stock-asset-library`

---

## 11. Definition of Done

The Gemini migration is complete when:

- [x] Groq is removed from runtime code
- [x] Together is removed from runtime code
- [ ] Gemini handles chat (currently returning provider_auth in local runtime)
- [ ] Gemini handles layout suggestions (currently returning provider_auth in local runtime)
- [ ] Gemini/Google handles image/background generation or returns a planned, gated provider error (currently provider_auth)
- [x] AI routes validate input
- [x] AI routes enforce usage limits
- [x] Templates tab has AI toggle plan implemented or tracked
- [x] Elements tab has AI toggle plan implemented or tracked
- [x] Tests/typecheck pass
- [ ] This TODO is moved from `PLANNED_FEATURES` to `IMPLEMENTED` after completion

---

## Notes

The product direction is not just "prompt to image."
Nightfall should become a conversational editable design engine.
Raster image generation is necessary, but it should be treated as a paid/high-cost operation.
Editable layouts, SVGs, shapes, forms, charts, and template-aware modifications
should be cheaper default AI paths.
