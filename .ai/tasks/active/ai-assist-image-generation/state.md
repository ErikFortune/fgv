# Stream State: ai-assist-image-generation

**Status:** 🟢 phase B (implementation) ready to start — phase A signed off
**Last updated:** 2026-05-11 (orchestrator — phase A signoff + phase B prep)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A — research and design | ✅ complete | `design.md` written; signed off with substantial modifications. PR consolidated into the phase B prep PR (this branch). |
| B — implementation | 🟢 ready | Brief: `brief-phase-b.md`. Awaiting agent kickoff. |

---

## Phase A signoff summary

The phase A design provided a comprehensive provider inventory and gap analysis (the value of the research). Its recommendation (Approach A — unified type + registry-driven validation) was rejected by the orchestrator/user review for over-indexing on compatibility on a surface that's explicitly "free hand on breaking changes" per `.ai/instructions/ACTIVE_DEVELOPMENT.md`. Substantive modifications detailed below.

### Decisions overriding the design

| ID | Topic | Design recommendation | Signoff decision |
|---|---|---|---|
| D1 | Type architecture | Approach A (unified) | Layered options: generic top-level + optional `models?: IModelFamilyConfig[]` array of family-scoped blocks with `provider` discriminator and `IOtherModelOptions` escape hatch |
| D2 | Merge precedence | Implicit | Explicit: generic → family-generic → model-specific ≈ Other; declaration order within tier; provider-mismatch silently skipped |
| D3 | Deprecated models | Migrate to current | Drop entirely: `imagen-3.*`, `grok-2-image-1212`, `grok-imagine-image-pro`, `imagen.negativePrompt`. Plus correctness fix for xAI default model. |
| D4 | xAI reference images | Defer (Q2) | In scope for phase B — dedicated xAI edits adapter (JSON body with `{ type: "image_url" }` objects) |
| D5 | Gemini `responseModalities` | Add as required (urgent fix per Q1) | Skip — user empirically verified Gemini works without it; the Google docs are stale |
| D6 | OpenAI live-verification | Implicit (`[training-data]` markers) | Phase B step zero: verify each OpenAI model's accepted values via `developers.openai.com` + the in-repo image-gen sample app |
| D7 | Registry shape | 7 new optional fields | Simplified: drop `acceptsGptImageExtensions`, `acceptsStyle`, `usesAspectRatio` (the layered types handle dispatch). Replace `acceptedQualities: []` semantics with `supportsQualityParam?: boolean`. Keep size/quality/count accepted-value fields. |
| D8 | Other-block precedence | n/a (escape hatch not in design) | Other blocks participate in merge with model-specific tier precedence; passthrough to wire request |

Detail in `brief-phase-b.md`. **`brief-phase-b.md` is the binding contract; `design.md` is the inventory and rationale.**

### Lessons-codification candidates (parked for orchestrator triage post-merge)

- **Cloud-agent harness branch-name suffix.** Phase A agent's branch was `claude/ai-image-generation-research-gtE2l` (not the brief's specified `claude/ai-assist-image-generation-design`) due to harness-appended random suffix. Briefs should accommodate this rather than specifying exact names.
- **Don't trust docs over observed behavior on "is this currently broken" claims.** Phase A surfaced the Gemini `responseModalities` issue from docs; user empirically confirmed it's a non-issue. Design phases should include live-test verification for "broken" claims before flagging them as urgent.
- **Phase A briefs should suggest fallback doc URLs.** OpenAI section was `[training-data]` because `platform.openai.com` is login-gated; `developers.openai.com` is the public alternative. Future briefs touching provider docs should list known fallbacks.

---

## Decisions log

### Phase A (cloud agent's working branch: `claude/ai-image-generation-research-gtE2l`)

- Working branch: `claude/ai-image-generation-research-gtE2l` (session-designated; branched from `claude/ai-assist-features`)
- PR target: `claude/ai-assist-features`
- Recommendation: **Approach A** (unified type + registry-driven validation). Defends against Approaches B and C in §3.
- Registry shape: `IAiImageModelCapability` gains 7 new optional fields; concrete per-model entries proposed in §4.

**Key research findings:**
- `response_format: 'b64_json'` confirmed as root cause of gpt-image-1 400 bug (§2.4). Fix: conditional on `outputParamStyle: 'output-format'` capability flag.
- dall-e-3 quality is `'hd'` not `'high'`; our current type `'standard' | 'high'` is wrong for both dall-e-3 (`'hd'`) and gpt-image-1 (`'low'|'medium'|'high'|'auto'`).
- `grok-2-image-1212` is **deprecated as of February 28, 2026** (registry is stale). New models: `grok-imagine-image`, `grok-imagine-image-quality`.
- `imagen-3.0-generate-002` is **deprecated; shuts down June 24–30, 2026**. Migration to Imagen 4 is urgent.
- xAI Imagine models use `aspect_ratio` (not `size` pixel strings). Our current code silently ignores the `size` param for xAI — callers have no dimension control.
- ~~`responseModalities: ["IMAGE"]` is required in Gemini Flash Image requests~~ — **user empirically refuted; docs are stale (D5).**
- xAI new Imagine models support reference images but via JSON body (not multipart) — incompatible with our current `callOpenAiImagesEdits`. Will be addressed in phase B (D4).
- Gemini Flash Image currently outputs **JPEG only** regardless of request; `outputMimeType` config is not functional per live community reports.

### Phase A signoff (orchestrator + user, 2026-05-11)

See "Decisions overriding the design" table above.

---

## Open questions / blockers

*(none — phase B unblocked; brief-phase-b.md captures all binding decisions)*

---

## PR

- **Phase A research:** committed to `claude/ai-image-generation-research-gtE2l`; merged into the orchestrator's phase B prep branch via `git merge --no-ff` to consolidate the phase-A→B transition into a single PR against the integration branch.
- **Phase A + B prep PR:** `claude/ai-image-generation-phase-b-prep` → `claude/ai-assist-features` (open after orchestrator commits the brief + state.md + WORKSTREAMS update)
- **Phase B implementation PR:** TBD by phase B agent; target `claude/ai-assist-features`
