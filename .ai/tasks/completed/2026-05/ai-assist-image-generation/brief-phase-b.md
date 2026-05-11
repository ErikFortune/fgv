# Stream Brief: ai-assist-image-generation (phase B — implementation)

**Stream ID:** ai-assist-image-generation
**Phase:** B — implementation
**Sequencing:** Phase A signed off. Phase B starts immediately. `ai-assist-thinking-config` phase B is queued strictly after this stream lands.

---

## Context

Phase A produced `.ai/tasks/active/ai-assist-image-generation/design.md` (read it in full — it is the inventory and rationale, not the contract). The orchestrator and user reviewed it and signed off with substantial modifications to the type architecture and scope. **This brief is the binding contract** — where it conflicts with `design.md`, this brief wins.

This is a feature-completion stream on an active-development surface (`@fgv/ts-extras/ai-assist`). Per `.ai/instructions/ACTIVE_DEVELOPMENT.md`, you have a free hand on breaking changes. The lockstep version policy means breaking changes ship in the same alpha as everything else, so design for the right shape, not the most-compatible shape.

---

## Mission

Implement the layered options architecture, the registry simplifications, the wire-encoder corrections, and the deprecated-model removals. Land the result as a single PR against the integration branch with 100% test coverage and updated `LIBRARY_CAPABILITIES.md`.

---

## Signed-off design decisions (binding)

The following decisions override `design.md` where they conflict.

### D1. Type architecture: layered options, no provider-middle-layer

The unified-type approach (design's Approach A) is rejected. The discriminated-union approach (design's Approach B) was rejected as too restrictive (model selection is dispatcher-driven, not caller-driven). The signed-off approach is **layered options with model-family blocks**:

```typescript
interface IAiImageGenerationOptions {
  // Generic — top-level. Most callers stay here.
  size?: AiImageSize;
  count?: number;
  quality?: AiImageQuality;
  seed?: number;
  // ... other genuinely-cross-provider general knobs
  
  // Optional precision — array of model-family-scoped blocks
  // The config is the union of all configs; the resolver picks
  // applicable blocks dynamically based on the resolved model.
  models?: IModelFamilyConfig[];
}

type IModelFamilyConfig =
  | IDallEModelOptions          // provider: 'openai'
  | IGptImageModelOptions       // provider: 'openai'
  | IGrokImagineModelOptions    // provider: 'xai'
  | IImagen4ModelOptions        // provider: 'google'
  | IGeminiFlashImageModelOptions  // provider: 'google'
  | IOtherModelOptions;         // provider: 'other' (escape hatch)

interface IDallEModelOptions {
  provider: 'openai';
  models?: DallEModelNames[];   // optional; omit = applies to all DallE family models
  config: IDallEImageGenerationConfig;
}

// ... analogous shapes for the other named-family variants

interface IOtherModelOptions {
  provider: 'other';
  models: string[];             // REQUIRED — no implicit "all" for unknown
  config: JsonObject;           // untyped passthrough escape hatch
}
```

**Discriminator field** is `provider`, with values `'openai' | 'xai' | 'google' | 'other'`. Coarser than the registry's full provider IDs (`'openai-compat'` users still write `provider: 'openai'` blocks; the discriminator is about model-family lineage, not dispatcher identity).

**Family-config shape** (`IDallEImageGenerationConfig`, etc.) is the **loose union** of what any model in that family accepts. Per-model validity (e.g. `style` only on `dall-e-3`, not `dall-e-2`) is enforced at runtime via the registry, not at the type level. This is a deliberate tradeoff: we get sharing across family members at the cost of TypeScript not catching every per-model mismatch. The runtime validator catches what the types don't.

**Per-family `models?` field type** uses scoped name unions (`DallEModelNames = 'dall-e-2' | 'dall-e-3'`, etc.) so that `models: ['gpt-image-1']` on a DallE block is a TypeScript error. For `IOtherModelOptions`, `models` is `string[]` — unconstrained, since the escape hatch's whole purpose is unknown models.

### D2. Merge precedence

Application order, building from the resolved-model wire-shape canvas:

1. **Generic top-level** options (caller's `size`, `count`, `quality`, etc.) → mapped onto the resolved model's wire shape
2. **Family-generic blocks** (entries in `models?` matching the resolved model's family with `models` field omitted) → applied in declaration order
3. **Model-specific blocks** (entries with `models` array including the resolved model name) → applied in declaration order
4. **Other blocks** (entries with `provider: 'other'` whose `models` array includes the resolved model name) → applied in declaration order, **same precedence tier as model-specific** (D1 confirmed answer to "Other-precedence" question)

Within each tier, declaration order — later wins. Across tiers, later tier wins. Net precedence: Other ≈ model-specific > family-generic > generic.

**Provider-mismatch handling.** If a block's `provider` does not match the dispatcher's provider lineage (e.g., `provider: 'openai'` block with an xAI dispatcher), the block is silently skipped during filtering. No error — the union-config semantics make this a normal "this block doesn't apply to this resolution path" case.

**JSDoc on the merge function** must document precedence explicitly. Caller surprise risk is highest when both `options.size` (generic) and a model-specific `config.size` are set with different values; document that model-specific wins.

### D3. Drop deprecated models

Remove from registry, types, examples, docs, and test fixtures:

- `imagen-3.0-generate-002` and any `imagen-3.*` references (deprecates June 24-30, 2026)
- `grok-2-image-1212` (deprecated Feb 28, 2026 — already past)
- `grok-imagine-image-pro` (deprecates May 15, 2026)
- The `imagen.negativePrompt` field (Imagen 3 only; obsolete with Imagen 3 removal)

**Active models the implementation supports:**

- **OpenAI:** `dall-e-2`, `dall-e-3`, `gpt-image-1`
- **xAI:** `grok-imagine-image`, `grok-imagine-image-quality`
- **Google:** `imagen-4.0-generate-001`, `imagen-4.0-ultra-generate-001`, `imagen-4.0-fast-generate-001`, `gemini-2.5-flash-image`

**Pre-existing correctness fix:** xAI `defaultModel.image` currently points at the deprecated `grok-2-image-1212`. Update to `grok-imagine-image-quality`.

### D4. Add xAI reference image support

xAI `/v1/images/edits` accepts JSON bodies with `{ "type": "image_url", "url": <data URI or URL> }` objects — different wire format from OpenAI's multipart/form-data. Implement a **dedicated xAI edits adapter** (likely a new `AiImageApiFormat` value `'xai-images-edits'` or branch within an extended `'xai-images'` adapter — implementer's choice). Set `acceptsImageReferenceInput: true` on the xAI registry entry.

Up to 3 source images per call, per current xAI docs.

### D5. Skip Gemini `responseModalities`

The phase A design's Q1 finding (`callGeminiImageOutGeneration` doesn't set `responseModalities: ["IMAGE"]`, supposedly required per Google docs) is **rejected as wrong**. User has empirically verified Gemini Flash Image works in production without setting this parameter. The Google docs are stale. Do not add `responseModalities` to the Gemini Flash request.

(**Lessons-codification candidate** — captured separately. No action in this stream.)

### D6. OpenAI live-verification (phase B step zero)

The phase A OpenAI inventory is from training data (the agent's `docs.openai.com` fetches returned 403). Before encoding registry constants for OpenAI models, **verify each model's accepted values via live API calls**. Use:

- **Documentation source:** `https://developers.openai.com/` (the `platform.openai.com` URL the phase A agent tried is login-gated; this is the public docs endpoint)
- **Test harness:** the existing image-generation sample app in this repo (path TBD by you — search for it; the user has confirmed it exists and reproduces the gpt-image-1 `response_format` failure)
- **Verify per model** (`dall-e-2`, `dall-e-3`, `gpt-image-1`):
  - Accepted size strings
  - Accepted quality vocabulary
  - Accepted parameter names (e.g. is it `output_format` or `response_format` for gpt-image-1)
  - Reference-image endpoint behavior (mask requirement for dall-e-2; maskless for gpt-image-1)

Capture verified specifics in `state.md` (Decisions log) before encoding them as registry constants. If any specific differs from the design's `[training-data]` inventory, **the live-verified value wins**.

This is non-optional and should be the first work in phase B. Estimated cost: ~30-60 minutes of live test calls.

### D7. Registry simplifications

With the layered type architecture handling family dispatch:

- **Drop:** `acceptsGptImageExtensions` (replaced by GptImage being its own family), `acceptsStyle` (DallE family-config has `style?` which only validates for dall-e-3), `usesAspectRatio` (xAI's `IGrokImagineImageGenerationConfig` has `aspectRatio?` natively)
- **Replace `acceptedQualities: []` → `supportsQualityParam?: boolean`**. Self-documenting; `[]` as "don't send" is opaque (the agent's design Q4 acknowledged this; we picked the boolean alternative)
- **Keep:** `modelPrefix`, `format`, `acceptsImageReferenceInput`, `acceptedSizes`, `acceptedQualities`, `maxCount`, `outputParamStyle`, `defaultOutputMimeType`
- **Add:** any new registry fields the implementation surfaces as needed (e.g. for xAI's new edits format dispatch). Document in JSDoc.

The registry's role narrows under the layered design: pre-validation gates that the type system cannot enforce (per-model size limits, per-model count limits, family-loose-union shape mismatches caught at runtime). It is no longer the primary surface for caller-facing options.

### D8. Other-block as runtime-untyped escape hatch

`IOtherModelOptions.config` is `JsonObject` — opaque to the type system. The merge function passes through Other-block fields verbatim into the wire request, with no validation. This is the deliberate "trust me, I know what I'm doing" path for callers who need to send wire params our typed configs don't yet expose (e.g. a future OpenAI param we haven't added).

Per D2 precedence, Other blocks land at the model-specific tier (or after — implementer's choice within "model-specific or later"). User's framing: "if OpenAI added a parameter to one of the models and our library hadn't caught up, the caller wants Other to push it through."

---

## Package surface (read + write)

### In-scope (modify)

- `libraries/ts-extras/src/packlets/ai-assist/`
  - `model.ts` — type definitions (the layered options shape, family configs, model-name unions, `JsonObject` import)
  - `registry.ts` — entry simplifications, deprecated-model removals, default-model corrections
  - `apiClient.ts` — wire encoders (OpenAI gens + edits, xAI gens + edits new, Imagen, Gemini Flash)
  - Possibly new file `imageOptionsResolver.ts` (or similar) for the merge logic + runtime validation
  - `index.ts` — export new types if needed
- `libraries/ts-extras/src/test/unit/ai-assist/` — comprehensive test coverage for new types, merge logic, validation, wire encoders
- `libraries/ts-extras/etc/ts-extras.api.md` — regenerate via api-extractor
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — expand the ai-assist image generation section with the new layered options shape, escape hatch, deprecated-model notes
- `.ai/tasks/active/ai-assist-image-generation/state.md` — update at phase milestones

### Out-of-scope (do not modify)

- `libraries/ts-app-shell/src/packlets/ai-assist/` — consumer-side wiring may need a follow-up, but that's a separate stream
- The chat-completion path (`chatRequestBuilders.ts`, `streamingClient.ts`, `streamingAdapters/*`) — covered by `ai-assist-thinking-config` (parallel stream)
- Any package outside `ts-extras/ai-assist`
- Sudoku packages — vestigial
- The `responseModalities` Gemini change — see D5

---

## Required reading (priority order)

1. **`.ai/tasks/active/ai-assist-image-generation/design.md`** — full phase A inventory and rationale. Read in full. This brief overrides decisions where they conflict; the inventory is otherwise authoritative.
2. **`.ai/tasks/active/ai-assist-image-generation/brief.md`** — original phase A brief; still the source of provider scope and goals.
3. **`.ai/tasks/active/ai-assist-image-generation/state.md`** — phase A agent's terminal state and decisions log.
4. **`libraries/ts-extras/src/packlets/ai-assist/model.ts`, `registry.ts`, `apiClient.ts`** — current implementation; the diff target.
5. **`libraries/ts-extras/etc/ts-extras.api.md`** — current public API surface; understand what changes when.
6. **`docs/WORKSTREAMS.md`** preamble — repo shape, lockstep policy, stability-via-consumption framing (load-bearing).
7. **`.ai/instructions/ACTIVE_DEVELOPMENT.md`** — `ai-assist` is on the active-surface list; free hand on breaking changes is explicit.
8. **`.ai/instructions/CODING_STANDARDS.md`** — Result pattern usage, no-`any` rule, factory pattern, `mapResults` for arrays.
9. **`.ai/instructions/TESTING_GUIDELINES.md`** — Result matchers from `@fgv/ts-utils-jest`, 100% coverage requirement.

---

## Skills to load (when conditions trigger)

- `/result-pattern` — before writing any function returning `Result<T>` (the validator, the merge function, all wire encoders).
- `/result-tests` — before writing test files. Test all paths via Result matchers, never `.orThrow()` in assertions.
- `/published-primitives-reflex` — before writing utility-shaped helpers (e.g. deep merge, value normalization). Check `@fgv/*` first; the merge logic should not reinvent something `@fgv/ts-utils` already exposes.
- `/type-safe-validation` — before writing the runtime validator. Use Converters/Validators from `@fgv/ts-utils`; never manual `typeof` + cast.
- `/filetree-io` — N/A here (no file I/O in this stream); do not load.

---

## Phases (with checkpoints)

### B.0 — OpenAI live-verification (per D6)

Verify accepted values for `dall-e-2`, `dall-e-3`, `gpt-image-1` via:
- `developers.openai.com` documentation review
- Live test calls via the existing in-repo image-gen sample app

Capture verified specifics in `state.md` (Decisions log). Compare against `design.md` `[training-data]` annotations; flag any divergence.

**Checkpoint:** state.md updated with verified-specifics table.

### B.1 — Type definitions

Implement the layered options shape per D1:
- Generic `IAiImageGenerationOptions` with top-level fields and `models?: IModelFamilyConfig[]`
- Per-family option interfaces (`IDallEModelOptions`, `IGptImageModelOptions`, `IGrokImagineModelOptions`, `IImagen4ModelOptions`, `IGeminiFlashImageModelOptions`, `IOtherModelOptions`)
- Per-family config shapes (`IDallEImageGenerationConfig`, etc.)
- Model-name unions (`DallEModelNames`, `GptImageModelNames`, etc.)
- The full `IModelFamilyConfig` discriminated union

JSDoc on every exported type. Document the precedence rules on the merge function's docstring (per D2).

**Checkpoint:** types compile; api-extractor surface reviewed.

### B.2 — Registry simplifications

Apply D3 (deprecated-model removals), D4 (xAI ref-image flag), D7 (registry-shape simplifications). Update default models. Concrete entries per the verified specifics from B.0.

**Checkpoint:** registry compiles, includes only active models, default-model fields point at non-deprecated models.

### B.3 — Merge logic + runtime validator

Implement the merge function per D2 precedence. Implement the runtime validator (resolved-model + merged-config → Result, per registry capability constraints). Failure messages follow the design's §5.4 format ("model X: field Y value Z is not accepted; accepted values: [...]").

**Checkpoint:** merge + validate functions complete; unit tests for merge precedence and validation gates pass.

### B.4 — Wire encoders

Update `apiClient.ts` adapters to use the merge function output:
- OpenAI gens / edits (conditional `response_format` per `outputParamStyle`)
- xAI gens (`aspect_ratio` not `size`; default model already corrected in B.2)
- xAI edits (NEW adapter — JSON body with `{ type: "image_url" }` objects per D4)
- Imagen `:predict` (Imagen 4 params; `imagenOptions.*` from family config; `negativePrompt` removed per D3)
- Gemini Flash `:generateContent` (no `responseModalities` change per D5; `imageConfig.aspectRatio` from `IGeminiFlashImageGenerationConfig`)

**Checkpoint:** all encoders compile; integration tests against mocked HTTP endpoints pass.

### B.5 — Tests + coverage

Functional test breadth first, then coverage gap closure (per `.ai/instructions/TESTING_GUIDELINES.md`):
- Type-shape tests (compile-time via `// @ts-expect-error` for known invalid combinations)
- Merge precedence tests (every tier interaction)
- Runtime validation tests (per-model accepted values, family-loose-union mismatch rejection)
- Wire encoder tests (one per provider/endpoint, mocked HTTP)
- Other-block escape hatch test (passthrough verification)
- Existing tests updated for the new type shape

100% coverage required.

**Checkpoint:** `rushx test` passes with 100% coverage in `ts-extras`.

### B.6 — Documentation

Update `LIBRARY_CAPABILITIES.md` ai-assist section:
- Layered options shape with concrete examples (casual caller; power caller using family-specific config; escape hatch caller)
- Per-provider supported models (not deprecated ones)
- Reference-image support matrix (which models accept refs, which provider+model combinations)
- Note the no-silent-translation policy

**Checkpoint:** docs reflect implementation; api-extractor regenerated.

---

## Acceptance criteria

- [ ] B.0 verification table in state.md
- [ ] All deprecated models removed (no string references in code or fixtures except in deletion-explanatory comments if any)
- [ ] Layered options types compile and pass api-extractor
- [ ] Merge function passes precedence tests for all four tiers
- [ ] Runtime validator rejects each known per-model invalid value with contextual error
- [ ] Wire encoders produce correct request bodies for all 9 active models × supported endpoints
- [ ] xAI reference-image edits adapter produces a JSON body with `{ type: "image_url" }` objects
- [ ] `gpt-image-1` requests do NOT include `response_format`
- [ ] Gemini Flash requests do NOT include `responseModalities` (per D5)
- [ ] `rushx build` passes in `ts-extras`
- [ ] `rushx test` passes with 100% coverage in `ts-extras`
- [ ] No `any` types
- [ ] All fallible operations return `Result<T>`
- [ ] `LIBRARY_CAPABILITIES.md` ai-assist section updated
- [ ] PR opened to `claude/ai-assist-features` (NOT `release`)

---

## Phase B exit artifact (state.md)

At completion, `state.md` should record:
- Phase A done; Phase B done
- B.0 OpenAI live-verification table (specifics confirmed; deltas from design.md noted)
- Any implementation decisions that differed from this brief or the design (with rationale)
- Test coverage status per file
- PR number and merge commit
- Any open questions or blockers surfaced (none expected; flag if you find them)
- Followups that should land as TECH_DEBT, FUTURE, or a future chore batch — the orchestrator drains these post-merge

---

## Branch + PR posture

- **Base branch:** `claude/ai-assist-features` (the integration branch)
- **Work branch:** `claude/ai-assist-image-generation-impl` (or yours to pick — note: if your harness appends a random suffix, that's fine, but please document the actual branch name in state.md so the orchestrator can find your PR)
- **PR target:** `claude/ai-assist-features` (NOT `release`)
- One PR for all of B.0–B.6 unless something forces a split (it shouldn't)
- The integration branch will merge to `release` at the end of the cluster, after `ai-assist-thinking-config` also lands

---

## Pre-merge artifact migration

Per the artifact-protocol convention (`.ai/conventions/workflow/artifact-protocol.md`), migration to `.ai/tasks/completed/` is **pre-merge**, not post-merge. Specifically:

- Migrate `.ai/tasks/active/ai-assist-image-generation/` to `.ai/tasks/completed/2026-05/ai-assist-image-generation/` (or whatever YYYY-MM matches your merge month)
- Write a polished `README.md` in the completed dir capturing what shipped, key decisions, acceptance status, and any followups
- Include the migration in your PR

The orchestrator will spot-check the migration during PR review. The auth-primitives stream missed this step and required a follow-up cleanup PR; do not repeat that pattern.

---

## Resume protocol

If the session ends mid-phase: read `brief-phase-b.md` (this file), `brief.md` (phase A), `design.md`, and `state.md` to resume. State.md records which checkpoints are done.

---

## Missing-input rule

If a required-reading file is missing, has a shape that conflicts with this brief, or if your B.0 live verification surfaces a structural mismatch you can't resolve (e.g., `gpt-image-1` API has fundamentally restructured since this brief was written), **STOP and report**. Do not improvise.

---

## Out of scope

- The `ai-assist-thinking-config` stream (queued strictly after this stream)
- Consumer-side updates in `ts-app-shell/ai-assist` — separate stream if needed
- Any package outside `ts-extras/ai-assist`
- Sudoku packages — vestigial
- New providers or new models beyond the active-models list in D3
- Image-gen streaming — confirmed sync across all providers (design §7); if any provider has added streaming since, defer
- Audio / video generation
