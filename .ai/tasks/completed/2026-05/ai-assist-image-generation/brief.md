# Stream Brief: ai-assist-image-generation (phase A — research and design)

**Stream ID:** ai-assist-image-generation
**Phase:** A — research and design (no production code)
**Sequencing:** Phase A runs in parallel with `ai-assist-thinking-config` phase A. Phase B (implementation) is sequenced strictly after this stream's design signoff. Decision on whether `ai-assist-thinking-config` phase B uses a fresh agent vs. the same one is held by the orchestrator until image-gen phase B lands.

---

## Context

`@fgv/ts-extras/ai-assist` exposes image generation across four providers (OpenAI, Google, xAI, openai-compat). Recent integration work surfaced two concrete failures and a broader observation: the per-model surface is partially modeled, with capability divergences (size sets, quality vocabularies, reference-image support, response-format handling) that the current type and registry don't fully express. Symptoms include `gpt-image-1` 400-ing on `response_format`, `dall-e-3` silently failing on `count > 1`, and quality-value mismatches across the OpenAI model family.

**This is feature work, not a bug fix.** The goal is to complete the image-generation feature properly across all providers — inventory current capabilities, identify gaps, design a coherent caller-facing API and registry shape, and document migration impact. Implementation is a separate phase commissioned after design signoff.

---

## Mission

Produce a design document at `.ai/tasks/active/ai-assist-image-generation/design.md` that an implementing agent could execute against. The design must cover all image-capable providers' actual capabilities, propose a coherent caller-facing surface, and explicitly surface tradeoffs and open questions for orchestrator/user signoff.

**Do not modify production code in this phase.** Read freely; write only `design.md` and `state.md`.

---

## Phase A deliverable: `design.md`

Required sections, in order:

### 1. Provider capability inventory

For each image-capable provider/model, document:

- Endpoint(s) used (e.g. `/v1/images/generations`, `/v1/images/edits`, `:generateContent`, `:predict`)
- Reference-image support (none / single / multiple; mask required, optional, or unsupported)
- Accepted values for: `size`, `quality`, `count` (n), `seed`, `background`, `moderation`, `response_format` / output format, any provider-specific knobs (e.g. `style` on dall-e-3, `output_compression` on gpt-image-1)
- Quirks: what gets rejected (with the actual error shape if known), what's required vs. optional, any silent translations the provider performs
- Cite the provider's current docs by URL for each capability — don't trust training data; image gen APIs evolve quickly

Providers/models in scope:
- **OpenAI:** `dall-e-2`, `dall-e-3`, `gpt-image-1`
- **Google:** Imagen 3/4 (Vertex `:predict`-only), Gemini 2.5 Flash Image / "Nano Banana" (chat-style `:generateContent`)
- **xAI:** `grok-2-image` and any newer (check the current model list)
- **openai-compat (self-hosted):** typically n/a for image gen but flag if any local server commonly proxies OpenAI's image endpoints

### 2. Current implementation gap analysis

Compare the inventory against what `IAiImageGenerationOptions`, `IAiImageGenerationParams`, and the registry's `imageGeneration` entries currently express. Identify and categorize:

- **Wire encoding wrong**: type accepts a value, our code passes it, provider rejects it (e.g. our `'high'` quality vs. dall-e-3's `'hd'`)
- **Capability not exposed**: provider supports a value/feature our type doesn't surface (e.g. dall-e-2's smaller sizes, gpt-image-1's `'low'`/`'medium'`/`'auto'` quality, gpt-image-1's `1536x1024`/`1024x1536` sizes)
- **Validation gap**: caller passes value the provider rejects, but our code doesn't catch up front (e.g. `dall-e-3` + `count > 1`)
- **Pre-emptive over-send**: we always send a parameter that some models reject (e.g. `response_format` to `gpt-image-*`)
- **Coverage gap**: provider entirely unsupported on a known capability (e.g. is xAI image gen wired up at all?)

### 3. Type-shape recommendation

Inventory at least three approaches, with tradeoffs:

- **A — Single unified type, registry-driven runtime validation**: caller-facing type stays one shape; registry enumerates per-model accepted values; provider code pre-validates and translates wire values
- **B — Discriminated union per model**: `IAiImageGenerationParams` becomes a union with per-model variants; full type-level fidelity per model; caller selects model at the type level
- **C — Common subset + per-provider escape hatch**: minimal type expresses the cross-provider subset; an opt-in provider-specific options object expresses the rest

Recommend one. Defend the choice. Note migration impact on existing callers (the `ts-app-shell` consumer, any direct callers in tools, etc.).

### 4. Registry-shape recommendation

Propose how `imageGeneration` entries in `registry.ts` should express per-model constraints. Existing pattern uses `modelPrefix` + capability flags (`acceptsImageReferenceInput`, `format`); extend it. Specify exactly which new fields are needed and show concrete entries for each in-scope model. Examples to consider (not prescriptive):

- `acceptedSizes`: enumerated set or pattern
- `acceptedQualities`: per-model vocabulary
- `maxCount` / `acceptedCounts`
- `acceptsResponseFormatParam`: boolean
- `outputFormat`: `'b64' | 'url' | 'multipart'`
- Any others your inventory surfaces

### 5. Failure semantics policy

Decide and document:

- Where does pre-validation kick in (registry-driven, before request build)?
- Where do we let providers 400 (genuinely novel cases the registry doesn't cover yet)?
- Where do we translate wire values silently? (Recommendation lean: nowhere — silent translation hides intent. Argue if you disagree.)
- What do error messages look like? (Pre-validation should produce clear, contextual `Result.fail` with `model` + `value` + `accepted set` info.)

### 6. Output shape unification

Providers return image data differently:
- OpenAI `/images/generations` and `/images/edits`: JSON with `b64_json` (or `url` if `response_format` is `url`, but gpt-image-1 doesn't accept that)
- Gemini `:generateContent`: chat response with `inlineData` parts
- Imagen `:predict`: JSON with base64

Propose how `IAiImageGenerationResult` (or whatever type lands) normalizes this. Document any provider-specific output (revised prompts, safety scores, citations) that can't be normalized cleanly — surface as optional fields, drop, or stash in a per-provider extras bag.

### 7. Streaming

Image gen is sync today. Confirm this is still the case across the four providers as of current docs. If any provider has added a streaming image path (rare but possible), propose how we'd integrate or defer.

### 8. Migration impact

List the externally-visible changes the recommended design implies:
- Renamed types
- Dropped fields
- Changed field semantics
- New required fields

For each: blast radius (consumer count if known — `ts-app-shell` and `tools/` are the in-repo consumers; personaility is the known external consumer), suggested migration path. **Recall the lockstep version policy**: a breaking change here ships in the same alpha as everything else's changes — every consumer integrates the delta whether they wanted it or not. That's a real cost to weigh against the cleaner shape.

### 9. Open questions for signoff

Anything you couldn't resolve from research alone — capability questions, design tradeoffs without an obvious right answer, anywhere you want orchestrator/user input before phase B is commissioned. Be honest; the signoff gate is real, and this section is what makes it productive.

---

## Package surface (read-only for phase A)

Phase A reads but does not modify:
- `libraries/ts-extras/src/packlets/ai-assist/` — all files
- `libraries/ts-app-shell/src/packlets/ai-assist/` — to understand consumer-side wiring (informs migration impact)
- `.ai/instructions/LIBRARY_CAPABILITIES.md` § ai-assist (current external framing)

Phase A writes only:
- `.ai/tasks/active/ai-assist-image-generation/design.md` (new)
- `.ai/tasks/active/ai-assist-image-generation/state.md` (update at checkpoints)

Phase B (separately commissioned) will modify the ai-assist packlet itself, registry entries, types, tests, and `LIBRARY_CAPABILITIES.md`.

---

## Required reading (priority order)

1. `libraries/ts-extras/src/packlets/ai-assist/registry.ts` — provider/model registry, capability flags, image-generation entries
2. `libraries/ts-extras/src/packlets/ai-assist/model.ts` — type definitions, especially `IAiImageGenerationOptions`, `IAiImageGenerationParams`, `IAiImageAttachment`, the `imageGeneration` registry-entry types
3. `libraries/ts-extras/src/packlets/ai-assist/apiClient.ts` — image-gen request paths (search for `callOpenAiImagesGenerations`, `callOpenAiImagesEdits`, `callGeminiImageOutGeneration`, Imagen path, any xAI path)
4. `docs/WORKSTREAMS.md` preamble — repo shape, lockstep version policy, stability-via-consumption framing (load-bearing context)
5. `.ai/instructions/ACTIVE_DEVELOPMENT.md` — `ai-assist` is on the active-surface list (free hand on breaking changes; lockstep cost is real)
6. `.ai/instructions/LIBRARY_CAPABILITIES.md` § ai-assist — current external framing (update target for phase B)
7. `libraries/ts-app-shell/src/packlets/ai-assist/` — consumer-side wiring (read enough to understand migration impact, no need for exhaustive read)

---

## Skills to load

- `/published-primitives-reflex` — load before recommending any new utility-shaped helper (value normalization, mime-type sniffing, base64 wrangling). Check `@fgv/*` first.
- `/result-pattern` — load before proposing function signatures returning `Result<T>` (likely all of them).
- `/type-safe-validation` — load before proposing validator/converter shapes for the registry-driven validation path.

---

## Web access

You should web-search and web-fetch provider docs as needed. Don't trust training data for image-gen API specifics — these surfaces evolve quickly. Cite URLs in section 1 (Provider capability inventory).

Focus on **current** docs (today's date is 2026-05-11). Specifically:
- OpenAI Images API: `/v1/images/generations`, `/v1/images/edits`, model-specific behavior
- Google Vertex Imagen: predict endpoint, current model versions
- Google Gemini API: Flash Image / Nano Banana behavior in `:generateContent`
- xAI image-gen models: current model list

---

## Missing-input rule

If a required-reading file is missing, has a shape that conflicts with this brief, or if your research surfaces a structural mismatch you can't resolve (e.g. a provider has fundamentally restructured their image API since this brief was written), **STOP and report**. Do not improvise or paper over the mismatch.

---

## Phase A acceptance criteria

- [ ] `design.md` exists at the specified path with all nine sections populated
- [ ] All in-scope providers/models inventoried with current-doc citations
- [ ] Type-shape recommendation defends one of the three (or proposed) approaches with explicit tradeoff analysis
- [ ] Registry-shape recommendation shows concrete per-model entries (not just abstract field names)
- [ ] Migration impact section names every breaking change with blast-radius notes
- [ ] Open-questions section is substantive — orchestrator/user need material to push back on

---

## Phase A exit artifact (state.md)

At completion, `state.md` should record:
- Phases completed (A done; B awaiting signoff)
- `design.md` path
- Recommendation summary in one paragraph (so the orchestrator can present cleanly to the user)
- Any research dead-ends, surprising findings, or provider-API surprises worth flagging
- Anything you decided to **exclude** from the design and why (so signoff can revisit)

---

## Branch + PR posture

- **Base branch:** `claude/ai-assist-features` (the integration branch — NOT `release` directly)
- **Work branch:** `claude/ai-assist-image-generation-design`
- **PR target:** `claude/ai-assist-features` (not `release`)
- Single PR containing: `design.md`, updated `state.md`
- No production-code changes
- Phase B (separately commissioned post-signoff) branches off the integration branch with `design.md` already merged in

The integration branch groups all ai-assist feature work — both streams' design and implementation phases — into one cohesive merge to `release` at the end of the cluster. This keeps `release` history clean and lets agents see each other's design outputs without round-tripping through `release`.

---

## Resume protocol

If the session ends mid-phase: read `brief.md` (this file) and `state.md` to resume. `design.md` is your terminal output for phase A.

---

## Out of scope for both phases

- The `ai-assist-thinking-config` stream (parallel phase A; will be sequenced separately for phase B)
- Any package outside `ts-extras/ai-assist` and `ts-app-shell/ai-assist`
- Sudoku packages (`ts-sudoku-lib`, `ts-sudoku-ui`) — vestigial, slated to move
- xAI Grok thinking/reasoning surface (covered by the parallel thinking-config stream)
- Audio / video generation (image only)
