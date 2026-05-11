# Stream Brief: ai-assist-thinking-config (phase A v2 — design revision)

**Stream ID:** ai-assist-thinking-config
**Phase:** A revision (research stands; architecture being redone)
**Sequencing:** Replaces the original phase A. Phase A v1's `design-v1.md` is archived for record. Phase B remains blocked on v2 signoff.

---

## Why a revision

Phase A v1 (`design-v1.md` in this directory) produced excellent provider research and identified several real practical findings — but its **type-architecture recommendation (Approach C)** diverged from the resolution the parallel `ai-assist-image-generation` stream reached at signoff. Image-gen settled on a **layered options pattern** that handles per-provider knobs and per-model variations cleanly; thinking-config's v1 recommended a unified type with hard-coded silent translation tables, which is exactly the shape image-gen explicitly rejected.

The two streams are addressing structurally the same problem (multi-provider surface with per-provider knobs and per-model variations), but were run in parallel at phase A. The cost: thinking-config v1 didn't get the benefit of image-gen's pattern crystallization. This revision applies the image-gen pattern to thinking-config.

**Lessons-codification:** "Outputs are disjoint at the research level" was insufficient grounds for parallel phase A here — the *pattern-extraction* outputs feed each other. Captured for post-cluster triage.

---

## Mission

Produce `design.md` at `.ai/tasks/active/ai-assist-thinking-config/` that applies the image-gen architectural pattern to the thinking-config surface, with the v1 research preserved as input. The brief's nine binding decisions (D1–D9 below) are non-negotiable; the design's job is to translate them faithfully into thinking-config specifics.

**Do not re-do the v1 provider research.** The inventory in `design-v1.md` is sound. Reference it, extend it where v2's architecture surfaces new questions, but don't re-survey provider docs from scratch.

---

## Binding decisions (non-negotiable)

### D1 — Layered options architecture

Apply the image-gen pattern. Reference: `.ai/tasks/active/ai-assist-image-generation/brief-phase-b.md` § "Signed-off design decisions" D1 and the corresponding `design.md` § 3-4.

The shape adapted to thinking-config:

```typescript
interface IThinkingConfig {
  // Generic top-level — most callers stay here
  effort?: 'low' | 'medium' | 'high';  // common-subset effort levels
  // (other genuinely-cross-provider knobs, if any)

  // Optional precision — array of provider-scoped blocks
  providers?: IThinkingProviderConfig[];
}

type IThinkingProviderConfig =
  | IAnthropicThinkingOptions    // provider: 'anthropic'
  | IOpenAiThinkingOptions       // provider: 'openai'
  | IGeminiThinkingOptions       // provider: 'google'
  | IXAiThinkingOptions          // provider: 'xai'
  | IOtherThinkingOptions;       // provider: 'other' (escape hatch)

interface IAnthropicThinkingOptions {
  provider: 'anthropic';
  models?: AnthropicThinkingModelNames[];  // optional narrowing
  config: IAnthropicThinkingConfig;        // family-union of accepted Anthropic knobs
}

interface IOtherThinkingOptions {
  provider: 'other';
  models: string[];           // REQUIRED — no implicit "all" for unknown
  config: JsonObject;         // untyped passthrough
}
```

**Discriminator field** is `provider`, with values `'anthropic' | 'openai' | 'google' | 'xai' | 'other'`. Coarser than registry's full provider IDs. Same pattern as image-gen.

**Per-provider config shape** is the **loose union** of what any model in that provider's family-set accepts. Per-model validity (e.g. 'max' only on Anthropic Opus 4.6, not 4.7+; o-series rejects effort='none') is enforced at runtime via registry capability, not at the type level. Deliberate tradeoff: sharing across family members at the cost of TypeScript not catching every per-model mismatch. Runtime validator catches what the types don't.

**Per-provider `models?` field type** uses scoped name unions where the provider has multiple distinct families. The thinking-config problem space has real family splits worth modeling:
- **OpenAI:** o-series (always reasons; effort='none' rejected) vs GPT-5 family (hybrid) vs gpt-5-pro (fixed at high) — three families
- **Gemini:** Pro (always thinks) vs Flash/Flash-Lite (can disable) — two families
- **xAI:** grok-4 (effort param rejected) vs grok-3-mini/4.3 (effort accepted) — two families
- **Anthropic:** Sonnet 4.5/4.6, Opus 4.6, Opus 4.7+ — multiple effort vocabularies (4.7+ drops `'max'`)

For each provider where family splits matter, decide whether to:
- **(a)** Single per-provider config type with loose-union over all family knobs (e.g. `IAnthropicThinkingConfig` accepts `'low' | 'medium' | 'high' | 'max'`; runtime validator rejects `'max'` for Opus 4.7+)
- **(b)** Nested family-shape blocks inside the provider (mirrors image-gen's DallE-vs-GptImage split exactly)

**Recommendation:** Start with (a). Thinking-config's family splits are smaller than image-gen's (mostly effort-vocabulary divergence, not whole-shape divergence). The loose-union + runtime-validation pattern is the same complexity tier and avoids the nested-block ceremony. Engage with this choice in the design; if (b) is genuinely required for one provider, propose it for that provider only.

### D2 — Merge precedence and provider-mismatch handling

Identical to image-gen:

1. **Generic top-level** options → mapped onto the resolved-model's wire shape
2. **Per-provider blocks** matching the resolved model's provider, with `models?` omitted or matching → applied in declaration order
3. **Per-provider blocks** matching the resolved model's provider, with `models?` array including the resolved model → applied in declaration order
4. **Other blocks** whose `models` array includes the resolved model → applied in declaration order; same precedence tier as model-specific

Within each tier, declaration order — later wins. Across tiers, later tier wins.

Provider-mismatch handling: if a block's `provider` doesn't match the dispatcher's provider, silently skip during filtering. No error.

JSDoc on the merge function documents precedence explicitly.

### D3 — Per-provider configs expose full provider knobs

The whole point of the layered pattern: provider-specific knobs are first-class on per-provider configs, not silently abstracted away.

- `IAnthropicThinkingConfig`: `effort?: 'low' | 'medium' | 'high' | 'max'` (full vocab); possibly `thinkingType?` for adaptive vs the deprecated 'enabled' mode if useful
- `IOpenAiThinkingConfig`: `effort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'` (full vocab)
- `IGeminiThinkingConfig`: `thinkingBudget?: number` (first-class, not the v1 `tokenBudget` escape-hatch field); `includeThoughts?: boolean` (for future thought-exposure when the followup `ai-assist-thinking-events` stream lands)
- `IXAiThinkingConfig`: `effort?: 'none' | 'low' | 'medium' | 'high'`

**No silent translation table.** v1's §3.2 effort-to-wire mapping (e.g. `'high'` → `thinkingBudget: 8192` for Gemini) is rejected. Callers using top-level generic `effort` get a documented common-subset mapping; callers needing precision use the per-provider config block and pass the right wire-value for the right provider.

### D4 — Temperature policy: Result.fail, not log-and-drop

Image-gen-consistent. When a caller passes `temperature` AND `thinking` on a provider whose API rejects temperature with thinking active (Anthropic Opus 4.7+, OpenAI reasoning models, likely xAI per D8), the adapter returns `Result.fail` with clear contextual message.

Message shape (example): `"thinking mode not compatible with temperature on provider <X>: remove temperature or call without thinking"`.

Reject v1's "auto-suppress + optional logger.warn" approach. It softens the failure but doesn't make the API surface honest. The image-gen no-silent-translation discipline applies equally here.

### D5 — Anthropic non-streaming validator fix: unconditional

v1's Q2 question is resolved: use the unconditional fix path. Route the non-tools, non-streaming Anthropic path through `extractAnthropicText` always — not just when `thinking` is set on the request. The `extractAnthropicText` function correctly filters to `type === 'text'` blocks; the existing `anthropicResponse` validator (which fails on thinking blocks because it requires `text: string` on every block) is the fragile path to retire.

Rationale: the existing tools path already does this correctly. The non-tools path is the inconsistency. Future Anthropic API changes that add new block types won't break the unconditional path.

### D6 — Registry signaling additions

Same as v1 proposed in §5, with clean integration to the layered pattern:

- **`AiModelCapability`** gains `'thinking'`. Models declared thinking-capable via `DEFAULT_MODEL_CAPABILITY_CONFIG` rules in `registry.ts`. Validators (e.g. `apiClient.ts:990` proxied list-models validator) updated to include `'thinking'` in the enumerated set.
- **`ModelSpecKey`** gains `'thinking'`. Lets callers pass `defaultModel.thinking` to pick a separate thinking-capable model when the base model isn't.
- **`IAiProviderDescriptor.thinkingMode: 'optional' | 'required' | 'unsupported'`** added as required field. All nine `BUILTIN_PROVIDERS` descriptors get explicit values per v1 §5.2's table.

### D7 — xAI registry staleness: fold the fix in

v1's Q5 surfaced that the xAI registry references `grok-4-1-fast` / `grok-4-1-fast-reasoning`, both retired May 15, 2026. Fold the fix into this stream (analogous to image-gen's deprecation drops in D3). Use current xAI models per v1's inventory.

### D8 — Phase B step zero: xAI temperature live verification

v1's Q1 (does xAI reject `temperature` when `reasoning_effort` is set?) is research-shaped and best resolved by a live test call rather than inferred from docs. Phase B step zero is a live verification, same pattern as image-gen's OpenAI verification. The design should record this as the first item in phase B's plan.

### D9 — Thinking-event surfacing: out of scope; followup stream

This stream does **not** implement thinking-event surfacing in the streaming API or non-streaming response. Thinking content is silently discarded by all adapters in phase B, same as today (existing Anthropic stream adapter already filters to text_delta only; v1 §6.2 confirmed).

A separate stream `ai-assist-thinking-events` is queued (entry in `docs/WORKSTREAMS.md`) to design and implement:
- New `IAiStreamEvent` variant for thinking deltas (or alternative shape)
- Non-streaming response shape change (add `thinking?: string` field or similar)
- Opt-in flag plumbing through per-provider configs (the `IGeminiThinkingOptions.config.includeThoughts` already exists per D3 as the per-provider opt-in; will be plumbed when the followup stream lands)
- Provider-specific surfacing logic (Anthropic thinking_delta events vs Gemini thought: true parts vs OpenAI/xAI not-streamed)
- Token accounting (`thinkingTokens?: number` on response)

Phase B of this stream may **place** the `includeThoughts?: boolean` field on `IGeminiThinkingOptions.config` as part of the type architecture, but the field is **inert in phase B** — adapters never send `includeThoughts: true` to Gemini, and no event-surfacing logic is added. The followup stream wires it up.

---

## Phase A v2 deliverable: `design.md`

Same nine sections as v1's brief. Where v1 covered a section adequately, the v2 design may reference v1 succinctly rather than rewriting. The architectural sections (3, 4, 5) need full rewrite per D1-D6.

Required sections:

### 1. Provider thinking-surface inventory

v1 is thorough; reference it. Add any clarifications surfaced by v2's architectural redesign (e.g. if family-shape splits within a provider need explicit modeling, document them here).

### 2. Current implementation gap analysis

v1's gap analysis stands. Reference it. Highlight what changes under the layered pattern (e.g. v1's "temperature dropped silently" becomes "temperature triggers Result.fail per D4").

### 3. `IThinkingConfig` shape — layered architecture

Full rewrite. Apply D1: generic top-level + optional `providers?: IThinkingProviderConfig[]` array, with per-provider blocks discriminated on `provider` and narrowed on `models?`.

Show the concrete TypeScript types:
- `IThinkingConfig` (top-level)
- `IThinkingProviderConfig` (union)
- One `I<Provider>ThinkingOptions` per supported provider + `IOtherThinkingOptions`
- One `I<Provider>ThinkingConfig` per provider (the family-loose-union content)
- Model-name union types where family narrowing applies (`AnthropicThinkingModelNames`, etc.)

Engage explicitly with the family-shape sub-layer question per D1's recommendation: justify your choice between (a) loose-union per provider and (b) nested family blocks. Default lean is (a); (b) only where genuinely required.

### 4. Sampling-param interaction policy

Apply D4: Result.fail on temperature + thinking for rejecting providers. Document the per-provider matrix (Anthropic rejects, OpenAI rejects, Gemini accepts, xAI pending D8 verification). Error message format per the D4 example.

### 5. Model-capability signaling

Apply D6: `AiModelCapability` gains `'thinking'`; `ModelSpecKey` gains `'thinking'`; `IAiProviderDescriptor.thinkingMode` added. Concrete entries per provider. Map directly to v1 §5's content with the layered-pattern adjustments.

### 6. Streaming integration

Apply D9: thinking content silently discarded in phase B; `includeThoughts` field placed but inert; followup stream `ai-assist-thinking-events` does the surfacing work. Document the inert placement clearly.

Reference v1 §6.1's per-provider streaming behavior table.

### 7. Non-streaming response shape

Apply D5 (unconditional Anthropic validator fix) + D9 (no thinking surface in `IAiCompletionResponse` in this stream; followup will add `thinking?: string` if appropriate).

### 8. Migration impact

Reference v1's analysis; adjust for the layered pattern. Key changes:
- `thinking?: IThinkingConfig` on completion params (additive)
- New types: `IThinkingConfig`, `IThinkingProviderConfig`, per-provider option/config interfaces, model-name unions
- Registry additions per D6
- Behavior change: temperature + thinking → Result.fail (per D4); not a silent suppression

### 9. Open questions for signoff

v1's open questions are mostly resolved by D1-D9. Document which are resolved and where; surface only genuinely-new open questions the v2 architecture raises. Honest disclosure — the gate is real.

---

## Package surface (read-only for this revision)

Same as v1's brief:
- `libraries/ts-extras/src/packlets/ai-assist/` (read)
- `libraries/ts-app-shell/src/packlets/ai-assist/` (skim for migration impact)
- `.ai/instructions/LIBRARY_CAPABILITIES.md` § ai-assist (read)

This revision writes only:
- `.ai/tasks/active/ai-assist-thinking-config/design.md` (new — v2; overwrite-shape but file didn't exist after v1 was renamed to design-v1.md)
- `.ai/tasks/active/ai-assist-thinking-config/state.md` (update at checkpoints)

Phase B (separately commissioned post-signoff) will modify the chat-completion path, streaming adapters, registry, types, tests, and `LIBRARY_CAPABILITIES.md`.

---

## Required reading (priority order)

1. **`.ai/tasks/active/ai-assist-image-generation/brief-phase-b.md`** — THE pattern reference. Read in full. The signed-off image-gen architecture is the binding example for D1-D4. Sections 1-4 ("Signed-off design decisions") are most directly relevant.
2. **`.ai/tasks/active/ai-assist-image-generation/design.md`** — the inventory + rationale behind the image-gen architecture. Section 3 (Type-shape recommendation) and section 4 (Registry-shape recommendation) contain the pattern this revision applies.
3. **`.ai/tasks/active/ai-assist-thinking-config/design-v1.md`** — v1 design, archived. The research stands; the architecture is being redone. Reference sections 1, 2, 5, 6, 7, 8 for content that's still relevant; rewrite sections 3, 4 per D1-D4.
4. **`.ai/tasks/active/ai-assist-thinking-config/brief.md`** — original phase A brief (the v1 contract; this revision is its successor).
5. **`.ai/notes/personaility-handoffs/fgv-batch-2-handoff-2026-05.md`** — cross-repo consumer context. (Note: this path is the older one on this integration branch; on the crypto-batch-2 cluster the same content lives at `.ai/notes/cross-repo-handoffs/`. Either works for this stream.)
6. **`libraries/ts-extras/src/packlets/ai-assist/`** — current implementation:
   - `apiClient.ts` (chat completion entry points; request body construction per provider)
   - `chatRequestBuilders.ts` (per-provider request shaping)
   - `streamingAdapters/{anthropic,openaiChat,openaiResponses,gemini,proxy,common}.ts`
   - `model.ts` (type definitions including `IProviderCompletionParams`, `IAiProviderDescriptor`, `AiModelCapability`, `ModelSpecKey`)
   - `registry.ts` (`BUILTIN_PROVIDERS`, `DEFAULT_MODEL_CAPABILITY_CONFIG`)
7. **`docs/WORKSTREAMS.md`** preamble — repo shape, lockstep version policy, stability-via-consumption framing
8. **`.ai/instructions/ACTIVE_DEVELOPMENT.md`** — `ai-assist` is on the active-surface list; free hand on breaking changes
9. **`.ai/instructions/CODING_STANDARDS.md`** — Result pattern, no-`any`, factory pattern

---

## Skills to load (when conditions trigger)

- `/published-primitives-reflex` — before recommending utility-shaped helpers
- `/result-pattern` — before proposing function signatures returning `Result<T>` (likely all)
- `/type-safe-validation` — before proposing converter/validator shapes for runtime validation

---

## Web access

You may web-search and web-fetch provider docs for verification or clarification of v1's inventory. Don't re-do the inventory wholesale; verify or extend where v2's architecture raises new specifics. Cite URLs.

---

## Specific guidance / common pitfalls

### Don't re-litigate Approach A or C

v1 considered three approaches (A unified, B discriminated-union-per-provider, C unified-with-escape-hatch) and recommended C. The orchestrator/user signoff rejected C in favor of the layered pattern from image-gen. **Do not propose A, B, or C again** — the layered pattern is binding. If you find yourself wanting to argue for one of them, surface as an open question in §9 with reasoning; don't act on it.

### Family-shape sub-layer: justify your call

D1 recommends starting with (a) loose-union per provider and only using (b) nested family blocks where genuinely required. Engage with this choice explicitly in §3. Don't default-to-nested without justification; don't default-to-flat without considering whether o-series-vs-GPT-5 or Pro-vs-Flash splits warrant explicit family blocks.

### Don't silently translate

The temptation in any "common abstraction" design is to add a translation table that converts caller's value X to wire-value Y. Resist. The layered pattern's whole point is that per-provider knobs are first-class; callers use the right knob for the right provider. Only the top-level generic `effort` has a documented (and minimal) mapping to wire values; per-provider blocks pass wire-value-shapes directly.

### Don't add abstraction beyond the layered pattern

Same discipline as `crypto-batch-2-webauthn`'s D3 (strictly no-abstraction-creep). Don't propose:
- Helper functions for building thinking configs (`makeAnthropicHighEffort()` etc.)
- A "thinking mode selector" higher-level abstraction
- A separate `IThinkingClient` interface

Surface these as open questions if tempted. Don't act on them.

### Phase B brief is the orchestrator's job, not yours

Sections 3-7 should be detailed enough that the orchestrator can write phase B from them, but don't write phase B yourself. Stick to design.md.

---

## Missing-input rule

If a required-reading file is missing or contradicts this brief — STOP and report. Specifically:

- If `.ai/tasks/active/ai-assist-image-generation/brief-phase-b.md` doesn't exist on the branch you're working from, **stop**; the layered-pattern reference is load-bearing.
- If your reading of image-gen's pattern materially differs from this brief's translation of it, surface the discrepancy as an open question before acting.

---

## Phase A v2 acceptance criteria

- [ ] `design.md` exists at the specified path with all nine sections populated
- [ ] §3 applies the layered options pattern from image-gen with concrete TypeScript types
- [ ] §3 engages explicitly with the family-shape sub-layer question (D1's (a) vs (b)) with per-provider justification
- [ ] §4 implements temperature policy as Result.fail (no silent suppression)
- [ ] §5 documents the registry signaling additions (`AiModelCapability`, `ModelSpecKey`, `thinkingMode`) per D6
- [ ] §6, §7 document that thinking-event surfacing is out of scope; `includeThoughts` field placed but inert per D9
- [ ] §8 documents migration impact accurately
- [ ] `design-v1.md` is referenced where v2 reuses content (no duplicated text where reference suffices)
- [ ] No proposals for Approach A, B, or C
- [ ] No silent translation tables
- [ ] No abstraction creep beyond the layered pattern

---

## Phase A v2 exit artifact (state.md)

Update `state.md` to record:
- v2 design complete; design.md and design-v1.md both present
- One-paragraph summary of how v2 differs from v1 (architecture rewrite; research preserved)
- Any genuinely-new open questions surfaced
- Any tension between v2's architecture and v1's research that v2 had to resolve

---

## Branch + PR posture

- **Base branch:** `claude/ai-assist-features` (the cluster integration branch)
- **Work branch:** `claude/ai-assist-thinking-config-design-v2` (or harness-auto-suffix; document actual name in state.md)
- **PR target:** `claude/ai-assist-features` (NOT `release`)
- Single PR containing the new `design.md` + updated `state.md`. The merge of design-v1.md (already on this branch) is part of the prep PR (#TBD), not this v2 PR.

---

## Resume protocol

If the session ends mid-revision: read `brief-phase-a-v2.md` (this file), `brief.md` (v1 contract), `design-v1.md` (v1 design), and `state.md` to resume. Plus the image-gen pattern references.

---

## Out of scope

- Thinking-event surfacing — D9; followup stream `ai-assist-thinking-events`
- Phase B work — orchestrator writes that brief post-signoff
- The chat-completion path itself — design only; no production code
- Image-generation surface — separate stream
- Sudoku packages — vestigial
