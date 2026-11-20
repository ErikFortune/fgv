# ai-assist-image-generation — completed

**Stream ID:** ai-assist-image-generation
**Bucket:** 2026-05
**PR:** [#329](https://github.com/ErikFortune/fgv/pull/329) — `feat(ai-assist): layered image generation options architecture (Phase B)`
**Phase A signoff PR:** [#327](https://github.com/ErikFortune/fgv/pull/327) — `docs(ai-assist-image-generation): phase A signoff + phase B brief`
**Landed on `release`:** via cluster-merge [#336](https://github.com/ErikFortune/fgv/pull/336) (`bffa7b690`), same day
**Merge commit:** `e936fd15f` (into `claude/ai-assist-features` integration branch)
**Phase B branch:** `claude/implement-image-generation-m7xMi`
**Cross-repo consumer:** the consumer project surfaced the originating bugs; published once `claude/ai-assist-features` lands on `release` (cluster close) and is mirrored to `prerelease` for the next alpha cut

## What shipped

Complete reshape of the image-generation feature across all four providers (OpenAI, Google, xAI, openai-compat). The reshape was triggered by two concrete bugs reported by the consumer (`gpt-image-1` + `response_format` → 400; `dall-e-3` + `count > 1` → silent provider error) but the underlying cause was partial provider-surface modeling — the existing types and registry didn't capture per-model capability divergence. The fix is structural.

### Core architecture: layered options

`IAiImageGenerationOptions` gains an optional `models?: ReadonlyArray<IModelFamilyConfig>` array of family-scoped config blocks discriminated on `provider` + `family`. The merge function applies four precedence tiers:

1. Generic top-level options (`size`, `count`, `quality`, etc.)
2. Family-generic blocks (provider+family match, `models` field omitted)
3. Model-specific blocks (`models` array includes the resolved model)
4. Other-blocks (escape hatch via `IOtherModelOptions`, raw `JsonObject` passthrough)

Later tier wins; within tier, declaration order wins. Provider/family-mismatch blocks silently skipped during filtering. The merge function `resolveImageOptions` returns a bare `IResolvedImageOptions`; the separate `validateResolvedOptions` returns `Result<IResolvedImageOptions>` for caller-side Result-chaining. *(Corrected 2026-08-14 — see [Appendix A.1](#a1--the-merge-functions-return-type-was-misstated).)*

### Per-family config types

- `IDallEImageGenerationConfig` — DallE-family (dall-e-2, dall-e-3): style, response_format vocabulary
- `IGptImageGenerationConfig` — gpt-image-1 family: output_format, background, moderation
- `IGrokImagineImageGenerationConfig` — xAI Imagine family: aspect_ratio (not size pixel strings)
- `IImagen4GenerationConfig` — Google Imagen 4 family
- `IGeminiFlashImageGenerationConfig` — Gemini Flash Image
- `IOtherModelOptions` — escape hatch for unknown models; `models: string[]` required, `config: JsonObject` untyped passthrough

### Registry simplifications

`IAiImageModelCapability` shape on `IAiProviderDescriptor.imageGeneration` carries: `modelPrefix`, `format`, `acceptsImageReferenceInput`, `acceptedSizes`, `supportsQualityParam` (replaces opaque `acceptedQualities: []` semantics), `acceptedQualities`, `maxCount`, `outputParamStyle` (`'response-format' | 'output-format' | 'none'`), `defaultOutputMimeType`. Dispatcher pre-validates caller params against capability fields and fails fast with contextual messages.

### Wire encoder changes

- **OpenAI `/images/generations` + `/images/edits`**: conditional `response_format` vs `output_format` based on `outputParamStyle` (fixes `gpt-image-1` 400)
- **xAI new adapter** (`callXaiImageGeneration` + `callXaiImagesEdits`): sends `aspect_ratio` not `size`; edits use JSON body with `{type: "image_url"}` objects (NOT multipart — different wire format from OpenAI's edits)
- **Gemini `:generateContent`**: `aspectRatio` in `generationConfig` when set
- **Imagen `:predict`**: full Imagen 4 params; `negativePrompt` removed (Imagen 3 feature; deprecated with Imagen 3 retirement)

### Deprecated models dropped (D3)

Three models, plus one obsolete field:

- `imagen-3.*` — slated for shutdown June 24-30, 2026
- `grok-2-image-1212` — already deprecated Feb 28, 2026
- `grok-imagine-image-pro` — deprecated May 15, 2026
- *(not a model)* `imagen.negativePrompt` field — obsolete with Imagen 3 retirement

Dropped outright with **no migration path**, per D3. Note `design.md` §8.7/§8.10 had
recommended migrate-with-notice ("notify consumers to switch to `imagen-4.0-generate-001`");
D3 overrode that with unconditional removal and no deprecation shim.

xAI `defaultModel.image` updated `grok-2-image-1212` → `grok-imagine-image-quality` (the previous default was already broken).

## Key decisions (signed off pre-implementation)

| ID | Decision |
|---|---|
| D1 | Layered options architecture (NOT Approach A unified; NOT Approach B per-model discrimination) |
| D2 | 4-tier merge precedence: generic → family-generic → model-specific ≈ Other |
| D3 | Drop deprecated models entirely (no migration path) |
| D4 | xAI reference images via JSON body, dedicated edits adapter |
| D5 | Do NOT add `responseModalities: ["IMAGE"]` to Gemini Flash — user empirically verified the docs are stale on this point |
| D6 | OpenAI live-verification step zero before encoding registry constants (training-data inventory needed confirmation) |
| D7 | `supportsQualityParam?: boolean` replaces `acceptedQualities: []` for self-documenting registry shape |
| D8 | `IOtherModelOptions` escape hatch with `JsonObject` passthrough |

## Acceptance status

- [x] All four providers implemented (OpenAI dall-e-2/3, gpt-image-1; Google Imagen 4 + Gemini Flash; xAI Imagine; openai-compat)
- [x] Layered options types compile, pass api-extractor
- [x] 4-tier merge precedence: 57 tests in `imageOptionsResolver.test.ts`
- [x] Runtime validator rejects per-model invalid values with contextual messages
- [x] Wire encoders for all active models × supported endpoints (44 tests in `apiClient.imageGeneration.test.ts` — originally written here as 43; counted at the merge commit 2026-08-14)
- [x] xAI reference-image edits adapter produces correct JSON body shape
- [x] `gpt-image-1` no longer 400s on `response_format`
- [x] Gemini Flash does NOT include `responseModalities` (per D5)
- [x] `rushx build` + `rushx test` pass; 100% coverage in `ts-extras`
- [x] No `any` types; all fallible operations return `Result<T>`
- [x] `LIBRARY_CAPABILITIES.md` updated
- [x] Pre-merge artifact migration done (this PR finishes that with the README)
- [x] PR merged to `claude/ai-assist-features` (integration branch)

## Tech debt surfaced during code review (logged to TECH_DEBT.md)

Reviewer pass on PR #329 absolved pre-existing patterns from this stream's scope but recorded them for future cleanup:

- **P2** ✅ **paid off**: `try/catch` + `instanceof-Error` boilerplate at apiClient.ts lines ~158, 217, 272, 316. Each carries a `c8 ignore` directive suppressing untestable catch branches. `captureAsyncResult()` is the right replacement; the `c8 ignore` becomes unnecessary. **Trigger**: next time apiClient.ts is open for substantive changes. — *Resolved by [#619](https://github.com/ErikFortune/fgv/pull/619), which collapsed three of the four catch blocks and retired the fourth via `captureAsyncResult`; the `TECH_DEBT.md` entry was removed with it. Its absence there today means paid, not lost.*
- **P3** ⚠️ **still open, trigger fired**: `resolveImageCapability` in `registry.ts:328-339` returns `| undefined` instead of `Result<IAiImageModelCapability>`. Returning Result with a contextual error would let callers chain off failure cleanly. **Trigger**: next substantive change to the provider registry or capability resolution path. — *That trigger fired: [#516](https://github.com/ErikFortune/fgv/pull/516) changed this very function to resolve `@aliases` before prefix-matching, and the debt was not paid. Still returns `| undefined`; the entry's line reference is now stale (the function sits at `registry.ts:428-433`).*

Both entries landed as part of cluster-close prep, alongside this README. *(Dispositions above added 2026-08-14.)*

## Followups / lessons for orchestration

- Cloud-agent harness auto-suffixes work-branch names (`claude/implement-image-generation-m7xMi`). Briefs should accommodate this rather than specifying exact names.
- The signed-off layered architecture differs substantially from the phase A agent's Approach A recommendation. Signoff modifications can be substantial when the design is correct on inventory but off on architecture; the orchestrator+user review pass is what catches this. Lesson: trust the orchestrator review gate even when the design looks polished.
- `responseModalities` ghost finding (phase A flagged it as urgent based on docs; user empirically refuted): don't trust docs over observed behavior on "is this currently broken" claims. Future design phases should include live-test verification for any "broken path" claim before flagging urgency.

## Source artifacts

- [`brief.md`](./brief.md) — phase A kickoff brief
- [`brief-phase-b.md`](./brief-phase-b.md) — phase B binding contract (post-signoff)
- [`design.md`](./design.md) — phase A research and design inventory
- [`state.md`](./state.md) — implementing agent terminal state
- [`meta.yaml`](./meta.yaml) — structured record (added 2026-08-14)

---

## Appendix A — corrections (2026-08-14)

Produced by a `/finalize-task retroactive` run whose antagonist pass commissioned an
independent reviewer against this stream's artifacts and the shipped source. Original
wording preserved verbatim so the amendment can be audited rather than trusted.
`brief.md`, `brief-phase-b.md`, `design.md` and `state.md` are authored-in-flight records
and are left untouched; this README is a synthesis written after the fact and read by
later agents as a statement of what shipped.

### A.1 — the merge function's return type was misstated

> **Original:** "The merge function returns `Result<IResolvedImageOptions>` for
> caller-side Result-chaining."

`resolveImageOptions` — the 4-tier merge function — returns a bare `IResolvedImageOptions`.
Only the separate `validateResolvedOptions` (runtime registry validation) returns a
`Result`. This was already wrong at authorship, not later drift: verified against the
cluster-merge blob `bffa7b690`, where `resolveImageOptions` returns the bare interface and
`Result<IResolvedImageOptions>` appears only on the other function.

### A.2 — "deprecated models" counted a field as a model

> **Original (heading + list):** "Deprecated models dropped (D3)" listing four bullets,
> the fourth being "`imagen.negativePrompt` field — obsolete with Imagen 3 retirement".

Three models plus one field. A first pass at `meta.yaml` inherited the error and wrote
"four deprecated models" twice.

### A.3 — a test count was off by one at authorship, and is a snapshot regardless

> **Original:** "43 tests in `apiClient.imageGeneration.test.ts`"

44 at the merge commit. Both test files have since been touched by four later streams
(#508, #516, #520, #568) and the pair now runs 94 rather than the 101 the corrected
figures would imply. A test count in a completed-stream record is a snapshot of a moving
number; treat it as such.

### A.4 — the PR list was incomplete and the landing state understated

The header named only #329. #327 (phase A signoff + phase B brief) is this stream's other
PR, and the `claude/ai-assist-features` integration branch landed on `release` the same
day via cluster-merge #336 (`bffa7b690`) — so the original "merged into the integration
branch" framing, read today, understates it as still unlanded.

### A.5 — a surfaced lesson was never filed

The "Followups / lessons for orchestration" section below lists three lessons. Two reached
`.ai/notes/orchestrator/lessons-pending.md` (branch auto-suffixing as L2, partially
codified; "don't trust docs over observed behavior" as L4). The third — that signoff can
substantially override a polished design, so trust the review gate — appeared nowhere. It
recurred on the parallel `ai-assist-thinking-config` stream, whose phase A independently
landed on the same rejected shape. Filed 2026-08-14 as **L32**.

### Open thread this stream closed over

`design.md` Q9 asks for a specific action before the breaking `quality: 'high'` → `'hd'`
change could be called zero-cost: "grep `personaility` and `ts-app-shell` for any usage of
`quality`... verify quality field usage in consumer repos before accepting the migration
path as zero-cost." No artifact records that this was done — not `brief-phase-b.md`, not
this README, not the ledger — while `state.md` reports open questions as "(none)". The
blanket "none" is what buried it. Still unverified as of 2026-08-14.

### Checked and unchanged

Verified accurate, listed so the scope of this pass is known: the phase-A-recommended
"Approach A" and its explicit rejection in D1; the `responseModalities` ghost finding and
D5's reversal; the six per-family config types at the merge commit (current source has
four, later model-rotation streams having dropped DallE and Imagen — evolution, not an
error here); the xAI `aspect_ratio` and JSON-edits-body encoders; PR #329's title, merge
commit and base branch. One framing was checked and found *defensible*: the third
root-cause fix (`dall-e-3` quality `'hd'` vs `'high'`) is absent from this README's "two
concrete bugs" opening but is real, is recorded in `WORKSTREAMS.md`, and is corroborated
by `state.md` — the two-bug framing traces to the brief, so it is an omission here rather
than a false statement.
