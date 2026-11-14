# Stream Brief: ai-assist-thinking-config (phase B — implementation)

**Stream ID:** ai-assist-thinking-config
**Phase:** B — implementation
**Sequencing:** Phase A v2 signed off (PR #332). Phase B is **strictly sequenced after `ai-assist-image-generation` phase B (#329) merges** to `claude/ai-assist-features` — same packlet; serial implementation prevents file-collision risk.

---

## Context

Phase A v2 produced `.ai/tasks/active/ai-assist-thinking-config/design.md` applying the image-gen layered options pattern to thinking/reasoning configuration. The orchestrator and user reviewed and signed off as-presented. **This brief is the binding contract** — where it conflicts with `design.md`, this brief wins (it shouldn't, but the precedence is explicit).

`design-v1.md` is the archived first attempt; its provider inventory (§1) and gap analysis (§2) remain authoritative reference material, but its architecture (Approach C — unified type with silent translation) was rejected. Use it for provider-API specifics; ignore its type-shape recommendations.

This is feature work on an active-development surface (`@fgv/ts-extras/ai-assist`). Per `.ai/instructions/ACTIVE_DEVELOPMENT.md`, free hand on breaking changes; the lockstep version policy means breaking changes ship in the same alpha as everything else, so design for the right shape, not the most-compatible shape.

---

## Mission

Implement the layered `IThinkingConfig` architecture per design v2, the merge logic and runtime validator, the per-provider wire-encoder updates, the registry signaling additions, the unconditional Anthropic validator fix, and the xAI registry staleness cleanup. Land the result as a single PR against the integration branch with 100% test coverage and updated `LIBRARY_CAPABILITIES.md`.

---

## Signed-off design decisions (binding)

The nine D1-D9 decisions from `brief-phase-a-v2.md` are confirmed as-encoded in `design.md`. Quick summary:

| ID | Decision |
|---|---|
| D1 | Layered options: generic top-level `effort?` + optional `providers?: IThinkingProviderConfig[]` array of per-provider blocks discriminated on `provider`. Option (a) loose-union per provider; no nested family blocks. |
| D2 | Merge precedence: generic → provider-generic → model-specific ≈ Other; declaration order within tier; provider-mismatch silently skipped. |
| D3 | Per-provider knobs first-class: Anthropic `'max'`, OpenAI `'xhigh'` / `'none'` / `'minimal'`, Gemini `thinkingBudget` integers, xAI `'none'`. No silent translation. |
| D4 | Temperature + thinking on rejecting provider → `Result.fail` with contextual message. Not auto-suppress + warn. |
| D5 | Anthropic non-streaming validator fix: unconditional. Always route through `extractAnthropicText`. |
| D6 | Registry signaling: `AiModelCapability` gains `'thinking'`; `ModelSpecKey` gains `'thinking'`; `IAiProviderDescriptor.thinkingMode` field added. |
| D7 | xAI registry staleness: remove `grok-4-1-fast` and `grok-4-1-fast-reasoning` (retired May 15, 2026); update default model to `grok-4.3`. |
| D8 | xAI temperature rejection: phase B step zero live verification. |
| D9 | Thinking-event surfacing: OUT OF SCOPE. `includeThoughts` placed on `IGeminiThinkingConfig` but inert. Followup stream `ai-assist-thinking-events` handles surfacing. |

Plus implementer-aids surfaced during signoff review:

| Aid | What |
|---|---|
| A1 | JSDoc on the merge function must explicitly call out that mixing generic `effort` with a per-provider OpenAI block setting `effort: 'none'` is the supported way to enable temperature-respecting hybrid behavior on gpt-5.x. The §4.5 edge case in design.md is subtle. |
| A2 | Sonnet 4.5 wire format verification folds into step zero (design.md Q3). If Sonnet 4.5 requires deprecated `thinking: { type: 'enabled', budget_tokens: N }` rather than adaptive, the Anthropic adapter needs a per-model branch. Document the decision in state.md. |
| A3 | Gemini integer defaults for generic effort (design.md §3.5) verified in step zero (design.md Q2). Adjust the common-subset mapping if Gemini's documented defaults differ. |
| A4 | Proxy serialization counterpart change: phase B PR description must explicitly call out that the external proxy server needs a matching release to handle `thinking` params. Otherwise proxy-mediated callers lose thinking support silently. |

---

## Phases (with checkpoints)

### B.0 — Live verification (step zero, before any code)

Run live test calls per D8 + A2 + A3. The phase A research left these unresolved deliberately; verify them now so wire encoders use confirmed values rather than guesses.

1. **xAI temperature rejection (D8 / design.md Q1):** Make a call to `grok-4.3` with both `reasoning_effort: 'medium'` and `temperature: 0.7`. Does the API return 400 (reject) or 200 (accept)?
2. **Gemini token budget defaults (A3 / design.md Q2):** Verify whether `thinkingBudget: 1024 / 4096 / 8192` for low/medium/high are the right starting points, or if `-1` (dynamic) is the recommended default per current Gemini docs. Adjust the §3.5 common-subset mapping if warranted.
3. **Anthropic Sonnet 4.5 wire format (A2 / design.md Q3):** Make a call to `claude-sonnet-4-5` with `thinking: { type: 'adaptive' }` + `output_config: { effort: 'medium' }`. Does it accept? If not, fall back to `thinking: { type: 'enabled', budget_tokens: <reasonable> }` and confirm. Determines whether Sonnet 4.5 needs a per-model adapter branch.

**Checkpoint:** state.md updated with results table; any common-subset mapping adjustments documented.

### B.1 — Type definitions

Implement the type architecture per design.md §3.2:

- `IThinkingConfig` (top-level, generic `effort?` + `providers?` array)
- `IThinkingProviderConfig` (discriminated union)
- Per-provider options: `IAnthropicThinkingOptions`, `IOpenAiThinkingOptions`, `IGeminiThinkingOptions`, `IXAiThinkingOptions`, `IOtherThinkingOptions`
- Per-provider config: `IAnthropicThinkingConfig`, `IOpenAiThinkingConfig`, `IGeminiThinkingConfig` (with inert `includeThoughts?` per D9), `IXAiThinkingConfig`
- Model-name unions: `AnthropicThinkingModelNames`, `OpenAiThinkingModelNames`, `GeminiThinkingModelNames`, `XAiThinkingModelNames`
- `AiThinkingMode = 'optional' | 'required' | 'unsupported'`

Add `thinking?: IThinkingConfig` field to `IProviderCompletionParams` (`apiClient.ts`) and `IProviderCompletionStreamParams` (`streamingAdapters/common.ts`).

JSDoc on every exported type. Include the merge function's precedence chain in its JSDoc; include the A1 note on mixing generic effort with provider `'none'` blocks.

**Checkpoint:** types compile; api-extractor surface reviewed.

### B.2 — Registry signaling

Apply D6:

- `AiModelCapability` gains `'thinking'`
- `ModelSpecKey` gains `'thinking'`; update `allModelSpecKeys` array
- `IAiProviderDescriptor.thinkingMode` field added; concrete value per provider per design.md §5.2 table
- `DEFAULT_MODEL_CAPABILITY_CONFIG` thinking-capability rules per design.md §5.1
- `Validators.enumeratedValue` list at `apiClient.ts:990` (proxied list-models validator) updated to include `'thinking'`

Apply D7:

- Remove `grok-4-1-fast` and `grok-4-1-fast-reasoning` from the xAI registry (retired May 15, 2026)
- Update xAI `defaultModel` to use `grok-4.3` for base/tools/thinking
- Confirm current xAI active models from B.0 step zero if uncertain

**Checkpoint:** registry compiles; default-model fields point at non-deprecated models; capability rules cover all known thinking-capable models.

### B.3 — Merge function + runtime validator

Implement `mergeThinkingConfig` per design.md §3.4:
- Filter blocks by provider match
- Apply tiers in precedence order: generic → provider-generic → model-specific ≈ Other
- Within each tier, declaration order
- Return `Result<MergedThinkingConfig>` where `MergedThinkingConfig` is the effective wire-encoding-ready shape

Implement the runtime validator that checks the merged config against per-model constraints:
- Anthropic `'max'` only valid on Opus 4.6 (rejected on 4.7+)
- OpenAI `'none'` rejected by o-series (which always reasons)
- OpenAI `'xhigh'` only valid on supporting gpt-5.x models
- Gemini `thinkingBudget: 0` rejected on Pro (which always thinks)
- Failure messages follow the format in design.md §4.3

**Checkpoint:** merge + validate functions complete; unit tests for precedence and validation gates pass.

### B.4 — Wire encoder updates (all four providers)

Update the chat-completion path adapters per design.md §3.5 + §4:

**Non-streaming (`apiClient.ts`):**
- `callAnthropicCompletion`: add `thinking: { type: 'adaptive' }, output_config: { effort }` (or extended-mode wire if B.0 A2 surfaces Sonnet 4.5 requires it); drop `temperature` when thinking active; return `Result.fail` if caller passed both
- `callOpenAiCompletion` (Chat Completions): add `reasoning_effort` top-level; drop `temperature` when thinking active (non-'none'); Result.fail per D4 + design.md §4.5 edge case
- `callOpenAiResponsesCompletion`: add `reasoning: { effort }` nested; same temperature policy
- `callGeminiCompletion`: add `generationConfig.thinkingConfig.thinkingBudget`; keep temperature; never send `includeThoughts: true`
- xAI path (via Chat Completions): add `reasoning_effort`; temperature policy per B.0 D8 result; for `grok-4`, omit the field entirely

**Streaming (`streamingAdapters/*`):**
- Same wire field additions in the corresponding streaming adapters
- Anthropic streaming adapter already filters to `text_delta` only; thinking_delta events arrive and are silently dropped — no change needed for stream surfacing per D9

**Chat request builders (`chatRequestBuilders.ts`):**
- Update per-provider builders to apply the merge function output

**Apply implementer-aid A1:** when documenting the merge function and the `effort: 'none'` semantics, make sure the JSDoc on `IOpenAiThinkingConfig.effort` includes:

> Setting `effort: 'none'` on a gpt-5.x model disables reasoning AND keeps temperature allowed. This is the supported way to enable temperature-respecting hybrid behavior — set generic `effort: 'low' | 'medium' | 'high'` for default reasoning, OR set a per-provider OpenAI block with `effort: 'none'` to disable reasoning and accept temperature.

**Checkpoint:** all four providers' chat completion paths compile; integration tests against mocked HTTP endpoints pass.

### B.5 — Anthropic non-streaming validator fix (D5)

Route the non-tools, non-streaming Anthropic path through `extractAnthropicText` always — not conditional on `thinking` being set. The existing tools path already uses it correctly; the non-tools path is the inconsistency that breaks on thinking blocks.

This change is independent of the rest of phase B and could land on its own — but per D5 it's part of this stream's scope. Bundle it with the rest.

**Checkpoint:** Anthropic non-streaming tests pass for both thinking and non-thinking cases; the `anthropicResponse` validator path is no longer used in the non-tools branch.

### B.6 — Tests + coverage

Functional test breadth first, then coverage gap closure (per `.ai/instructions/TESTING_GUIDELINES.md`):

- Type-shape tests via `// @ts-expect-error` for invalid combinations (e.g. `provider: 'anthropic'` block with `models: ['gpt-5-pro']`)
- Merge precedence tests (every tier interaction; declaration-order within tier; provider-mismatch skip)
- Runtime validation tests (per-model invalid value rejection with expected error messages)
- Wire encoder tests for each provider × thinking-mode combination (mocked HTTP)
- Temperature + thinking → Result.fail tests across providers
- Existing tests updated for the new type shape
- Anthropic non-streaming validator fix verified against thinking-block fixtures

100% coverage required.

**Checkpoint:** `rushx test` passes with 100% coverage in `ts-extras`.

### B.7 — Documentation

Update `.ai/instructions/LIBRARY_CAPABILITIES.md` ai-assist section:

- Layered options shape for thinking config with concrete examples (casual caller; power caller using per-provider block; Other-block escape hatch)
- Per-provider thinking-capable models (post-D7 registry state)
- Thinking-mode signaling on provider descriptors and model capability rules
- Temperature compatibility per provider
- Note that thinking-event surfacing (caller-visible thought content) is forthcoming via the `ai-assist-thinking-events` followup stream

api-extractor regenerated.

**Checkpoint:** `LIBRARY_CAPABILITIES.md` reflects implementation; `ts-extras.api.md` updated.

### B.8 — Pre-merge artifact migration

Migrate `.ai/tasks/active/ai-assist-thinking-config/` to `.ai/tasks/completed/2026-05/ai-assist-thinking-config/` (or matching YYYY-MM if month boundary crossed). Write a polished `README.md` capturing:
- What shipped (the layered thinking-config architecture + the surrounding registry/validator changes)
- B.0 step zero verification results (D8, A2, A3) with the values encoded
- Key decisions and where they diverged from v1
- Acceptance status
- Followups: TECH_DEBT / FUTURE / chore-batch routing per `.ai/conventions/workflow/inbox-and-drain.md`
- Reference to the followup stream `ai-assist-thinking-events`

**This migration is mandatory and pre-merge.** The prior auth-primitives stream missed it and required a follow-up cleanup PR; the image-gen stream caught it. Do not repeat the slip.

**Checkpoint:** completed/ tree populated; README polished; active/ dir empty post-migration.

---

## Package surface

### In-scope (modify)

- `libraries/ts-extras/src/packlets/ai-assist/`
  - `model.ts` — type definitions (the layered thinking-config shape, per-provider options/configs, model-name unions, `AiThinkingMode`)
  - `registry.ts` — provider descriptor `thinkingMode` field, capability rules, xAI staleness cleanup, default-model update
  - `apiClient.ts` — wire encoders (all four non-streaming chat paths); validator update at line ~990
  - `chatRequestBuilders.ts` — per-provider builder updates
  - `streamingAdapters/{anthropic,openaiChat,openaiResponses,gemini}.ts` — streaming wire encoder updates
  - Possibly new file `thinkingConfigResolver.ts` (or similar) for merge logic + runtime validator (mirror the image-gen `imageOptionsResolver.ts` structure)
  - `index.ts` — export new types
- `libraries/ts-extras/src/test/unit/ai-assist/` — comprehensive test coverage
- `libraries/ts-extras/etc/ts-extras.api.md` — regenerate via api-extractor
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — ai-assist thinking section update
- `.ai/tasks/active/ai-assist-thinking-config/state.md` — update at each checkpoint
- `.ai/tasks/active/ai-assist-thinking-config/` → migrate to `.ai/tasks/completed/2026-05/ai-assist-thinking-config/` pre-merge with polished README

### Out-of-scope

- `libraries/ts-app-shell/src/packlets/ai-assist/` — consumer-side wiring may need a follow-up; that's a separate stream if needed
- The image-generation surface — separate stream (image-gen phase B is the predecessor)
- Thinking-event surfacing (new `IAiStreamEvent` variant, thought-content in non-streaming response, etc.) — `ai-assist-thinking-events` followup stream
- The `proxy.ts` streaming adapter — proxy serialization handling; ensure `thinking` field is included in the proxy body per A4 but DO NOT implement the external proxy server's matching change
- Any package outside `ts-extras/ai-assist`
- Sudoku packages — vestigial

---

## Required reading (priority order)

1. **`.ai/tasks/active/ai-assist-thinking-config/brief-phase-b.md`** (this file) — binding contract
2. **`.ai/tasks/active/ai-assist-thinking-config/design.md`** (v2) — the layered architecture being implemented; concrete TypeScript types in §3, merge function spec in §3.4, common-subset mapping in §3.5, temperature policy in §4
3. **`.ai/tasks/active/ai-assist-thinking-config/design-v1.md`** — research inventory + gap analysis. Use §1 for provider API specifics; ignore §3-§4 (the rejected architecture)
4. **`.ai/tasks/active/ai-assist-thinking-config/brief-phase-a-v2.md`** — the binding contract that produced design v2; reference for decision rationale
5. **`.ai/tasks/active/ai-assist-image-generation/brief-phase-b.md`** — PATTERN REFERENCE for phase B work shape. Mirror its structure (B.0 verification, merge logic in a dedicated file, registry-driven validation, pre-merge migration). Will likely have merged before you start this stream; use the post-merge form on `claude/ai-assist-features`.
6. **`.ai/tasks/active/ai-assist-image-generation/design.md`** — pattern reference for the layered options architecture
7. **`libraries/ts-extras/src/packlets/ai-assist/`** — current implementation, **as updated by image-gen phase B** (which will have merged before this stream starts)
8. **`docs/WORKSTREAMS.md`** preamble — repo shape, lockstep version policy, stability-via-consumption
9. **`.ai/instructions/ACTIVE_DEVELOPMENT.md`** — `ai-assist` is on the active-surface list; free hand on breaking changes
10. **`.ai/instructions/CODING_STANDARDS.md`** — Result pattern, no-`any`, factory pattern, `captureResult` / `captureAsyncResult` (use these instead of raw try/catch when possible)
11. **`.ai/instructions/TESTING_GUIDELINES.md`** — Result matchers from `@fgv/ts-utils-jest`, 100% coverage requirement
12. **`docs/TECH_DEBT.md`** — pre-existing ai-assist tech debt cataloged from PR #329 review (try/catch + `instanceof-Error` boilerplate; `resolveImageCapability` undefined-return). Don't fix these here; they're catalogued for opportunistic cleanup. But: when adding new code, use `captureAsyncResult`-style patterns rather than the deprecated try/catch shape, so we don't add to the debt.

---

## Skills to load (when conditions trigger)

- `/result-pattern` — load before writing any function returning `Result<T>` (the merge function, the validator, all wire encoders)
- `/result-tests` — load before writing tests; use Result matchers, no `.orThrow()` in assertions
- `/published-primitives-reflex` — load before writing utility-shaped helpers; check `@fgv/*` first
- `/type-safe-validation` — load before writing the runtime validator; use Converters/Validators where appropriate, never manual `typeof` + cast
- `/ts-utils-logging` — load if logging-shape questions surface (the PR #329 reviewer flagged that current ai-assist code lacks logging; in your new code, prefer `ILogger` injection over silent failure paths)

---

## Acceptance criteria

- [ ] B.0 verification results table in state.md (xAI temp policy; Gemini defaults; Sonnet 4.5 wire format)
- [ ] Layered thinking-config types compile and pass api-extractor
- [ ] Registry signaling additions complete (capability, ModelSpecKey, thinkingMode field, capability rules)
- [ ] xAI registry cleaned of retired models; defaults updated
- [ ] Merge function implements 4-tier precedence with provider-mismatch skip
- [ ] Runtime validator rejects each known per-model invalid value with contextual error
- [ ] All four chat completion adapters (non-streaming + streaming) produce correct request bodies for thinking and non-thinking calls
- [ ] Temperature + thinking on rejecting provider → Result.fail (Anthropic, OpenAI, xAI if B.0 confirms; not Gemini)
- [ ] Anthropic non-streaming validator fix verified (extractAnthropicText used unconditionally)
- [ ] No `responseModalities` added to Gemini Flash path (per image-gen D5 — empirically not needed)
- [ ] OpenAI 'none' edge case correctly handled (effort='none' → reasoning disabled + temperature accepted)
- [ ] Proxy serialization includes `thinking` field; PR description notes the counterpart proxy-server change needed (A4)
- [ ] `rushx build` passes in `ts-extras`
- [ ] `rushx test` passes with 100% coverage in `ts-extras`
- [ ] No `any` types; all fallible operations return `Result<T>`
- [ ] `LIBRARY_CAPABILITIES.md` thinking-config section added
- [ ] Pre-merge artifact migration to `.ai/tasks/completed/2026-05/` with polished README
- [ ] PR opened to `claude/ai-assist-features` (NOT `release`)

---

## Phase B exit artifact (state.md)

At completion:
- Phase A v2 done; Phase B done
- B.0 live-verification table with confirmed values
- Any implementation decisions that differed from this brief or the design (with rationale)
- Test coverage status per file
- PR number and merge commit
- Followups routed per `.ai/conventions/workflow/inbox-and-drain.md`

---

## Branch + PR posture

- **Base branch:** `claude/ai-assist-features` (the integration branch; specifically the state AFTER `ai-assist-image-generation` phase B has merged)
- **Work branch:** `claude/ai-assist-thinking-config-impl` (or harness-auto-suffix; document the actual branch in state.md)
- **PR target:** `claude/ai-assist-features` (NOT `release`)
- One PR for all of B.0–B.8 unless something forces a split (shouldn't)
- The integration branch merges to `release` at the cluster close

---

## Sequencing reminder

**Do not start until `ai-assist-image-generation` phase B (#329) has merged into `claude/ai-assist-features`.** The image-gen merge changes the same packlet you'll be modifying (model.ts, registry.ts, apiClient.ts, streamingAdapters/*). Running in parallel risks conflicts that aren't worth it.

When image-gen phase B is merged:
1. Orchestrator notifies launching this stream
2. You fork `claude/ai-assist-thinking-config-impl` (or harness-named branch) from the post-merge integration HEAD
3. You see the layered image-gen options shape as your reference for the analogous thinking-config types
4. You proceed with B.0 step zero

If you start before image-gen merges, you'll either be working against a stale base (collision when merging) or you'll be operating on assumed-state that doesn't exist yet.

---

## Resume protocol

If the session ends mid-phase: read `brief-phase-b.md` (this file), `design.md` (v2), `brief-phase-a-v2.md`, and `state.md` to resume. State.md records which checkpoints (B.0 through B.8) are done.

---

## Missing-input rule

If a required-reading file is missing, has a shape that conflicts with this brief, or if B.0 surfaces a structural mismatch (e.g. xAI's reasoning_effort API has fundamentally restructured since the brief was written), **STOP and report**. Do not improvise.

---

## Don't

- Don't modify the image-generation surface (covered by the predecessor stream)
- Don't add `responseModalities: ["IMAGE"]` to Gemini Flash — per image-gen D5, user empirically verified it's not needed; the v1 design was chasing a stale-docs ghost
- Don't surface thinking content to callers in any new `IAiStreamEvent` variant or response field — D9 explicitly out-of-scope; `ai-assist-thinking-events` is the followup stream
- Don't add helper functions for building thinking configs (no `makeAnthropicHighEffort()`, no `IThinkingClient`) — abstraction creep beyond the layered pattern
- Don't propose Approach A, B, or C from v1; those are rejected
- Don't skip B.0. The phase A design left those questions open deliberately for live verification; the wire encoders need confirmed values

---

## Out of scope

- The `ai-assist-image-generation` stream (predecessor)
- `ai-assist-thinking-events` (followup; this stream produces the foundation; that stream surfaces the content)
- Consumer-side updates in `ts-app-shell/ai-assist` — separate follow-up if needed
- The chat-completion path's broader logging architecture — code-reviewer flagged it as a tech-debt area for the ai-assist packlet; tracked in TECH_DEBT, addressed opportunistically
- Any package outside `ts-extras/ai-assist`
- Sudoku packages — vestigial
