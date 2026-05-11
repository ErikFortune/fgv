# Stream State: ai-assist-thinking-config

**Status:** 🔵 phase B in progress — implementation underway
**Last updated:** 2026-05-11 (phase B agent — implementation started; B.0 verified below)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A v1 | 📦 archived | `design-v1.md` preserved. Research stands; architecture rejected at signoff for divergence from image-gen pattern. |
| A v2 | ✅ complete | `design.md` merged via PR #332 into `claude/ai-assist-features`. |
| B — implementation | 🔵 in progress | `ai-assist-image-generation` phase B (#329) merged; implementation underway on `claude/ai-assist-thinking-phase-b-aIY1Y`. |

---

## Why v2

v1's recommendation (Approach C — single unified `IThinkingConfig` with `effort?` + `tokenBudget?` escape hatch) diverged from the resolution the parallel `ai-assist-image-generation` stream reached at signoff. Image-gen settled on a **layered options pattern** (generic top-level + optional `models?: IModelFamilyConfig[]` array of per-provider blocks with model-array narrowing + Other escape hatch). The two streams address structurally the same problem; the architectures should match.

Specific divergence points in v1 rejected at signoff:
- v1 §3.2 effort-to-wire mapping table (silent translation of caller's `effort` to specific Gemini `thinkingBudget` integers, dropping `'max'` for Anthropic 4.7+, capping `'max'` at xAI's `'high'`) — image-gen explicitly rejected silent translation
- v1 §4 temperature policy (auto-suppress + optional log.warn) — image-gen-consistent is Result.fail on caller-provided-temperature + thinking on a rejecting provider
- v1 §3 unified type — image-gen-consistent is layered with per-provider blocks exposing full provider knobs first-class

What stands from v1:
- Provider inventory (§1) — thorough; v2 references rather than re-doing
- Gap analysis (§2) — sound
- Anthropic non-streaming validator break finding (§2.4) — important practical bug; v2 resolves Q2 to unconditional fix
- Registry signaling additions (§5) — `AiModelCapability`, `ModelSpecKey`, `thinkingMode`; v2 keeps with adjustments to layered pattern
- Migration impact analysis (§8) — accurate
- xAI registry staleness finding (Q5) — v2 folds the fix in
- xAI temperature live-verification need (Q1) — v2 lifts to phase B step zero

---

## Phase A v1 (archived)

### Original recommendation (rejected at signoff)

Recommend **Option C (capability-driven optional)**: add a single `IThinkingConfig` interface with an `effort?: 'low' | 'medium' | 'high' | 'max'` field (plus a `tokenBudget?: number` Gemini escape hatch) as an optional field on both `IProviderCompletionParams` and `IProviderCompletionStreamParams`. Each provider adapter translates `effort` to its wire format independently. Temperature is auto-suppressed for Anthropic and OpenAI/xAI when thinking is active, and preserved for Gemini. Thinking content blocks are silently discarded in all response paths.

### What v1 got right

- Comprehensive provider inventory across Anthropic, OpenAI, Gemini, xAI
- Anthropic non-streaming validator failure on thinking blocks (§2.4)
- Distinction between provider-level optionality (provider supports thinking) and model-level (which models support it)
- Stream backward compatibility (Anthropic adapter already filters to text_delta; thinking_delta arrives but is silently dropped — no change needed for backward compat)
- Migration impact analysis (genuinely-zero blast radius beyond internal registry)

### Working branch (v1)

- Branch: `claude/ai-assist-thinking-config-xy1J8` (cloud agent's auto-suffixed name)
- PR target: `claude/ai-assist-features`
- Status: merged into `claude/ai-assist-thinking-config-revision-prep` for v2 commission

---

## Phase A v2 (commissioned)

### Binding decisions baked into brief-phase-a-v2.md

| ID | Topic | v1 | v2 |
|---|---|---|---|
| D1 | Type architecture | Approach C (unified) | Layered options per image-gen (generic + `providers?` array of per-provider blocks with `models?` narrowing + Other escape hatch) |
| D2 | Merge precedence | Implicit | Explicit: generic → provider-generic → model-specific ≈ Other; declaration order within tier |
| D3 | Per-provider knobs | Abstracted away (silent translation) | First-class on per-provider configs: Anthropic `'max'`, OpenAI `'xhigh'`, Gemini token budgets, etc. |
| D4 | Temperature + thinking | Auto-suppress + optional log.warn | Result.fail with clear contextual message |
| D5 | Anthropic non-streaming validator | Conditional fix (only when thinking is set) | Unconditional fix (always use `extractAnthropicText`) |
| D6 | Registry signaling | `AiModelCapability`+'thinking', `ModelSpecKey`+'thinking', `thinkingMode` field | Same; integrated with layered pattern |
| D7 | xAI registry staleness | Open question | Fold the fix in (analogous to image-gen deprecation drops) |
| D8 | xAI temperature rejection | Open question | Phase B step zero: live verification |
| D9 | Thinking event surfacing | "Future extension point" hand-wave | Out of scope; followup stream `ai-assist-thinking-events` queued |

### Lessons-codification candidate

"Outputs are disjoint at the research level" is not sufficient grounds for parallel phase A when two streams address structurally similar problems. The *pattern-extraction* outputs feed each other. For analogous future clusters: serialize phase A so the second design can build on the first's resolution. Captured for post-cluster triage.

---

## Phase A v2 (complete — awaiting signoff)

### Summary of changes from v1

The v2 architecture applies the image-gen layered pattern to thinking-config while preserving all v1 research (§1 provider inventory and §2 gap analysis stand in full). The architectural rewrite covers §3-4 (and §5-8 are adjusted accordingly):

**Architecture (§3):** Replaced the single unified `IThinkingConfig` (v1's Approach C) with the layered options pattern: generic `effort?: 'low' | 'medium' | 'high'` at the top level plus an optional `providers?: IThinkingProviderConfig[]` array of per-provider blocks discriminated on `provider: 'anthropic' | 'openai' | 'google' | 'xai' | 'other'`. Per-provider configs expose full provider knobs first-class (Anthropic 'max', OpenAI 'xhigh', Gemini thinkingBudget). No silent translation tables.

**Family-shape decision:** Chose option (a) loose-union per provider for all four providers. Thinking-config's family splits are effort-vocabulary differences (not structural shape differences), which makes runtime validation the right tool. Nested family blocks (option b, used in image-gen for DallE vs GptImage) are not warranted here.

**Temperature policy (§4):** Changed from auto-suppress to Result.fail with contextual message, per D4. Matrix: Anthropic → fail; OpenAI → fail (unless effort 'none'); Gemini → keep temperature; xAI → phase B step zero verification.

**Anthropic validator fix (§7):** Confirmed unconditional fix per D5 — always use `extractAnthropicText` for the non-tools Anthropic path.

**Thinking-event surfacing (§6, §7):** Out of scope per D9. `includeThoughts` field placed on `IGeminiThinkingConfig` but inert. Followup stream `ai-assist-thinking-events` handles surfacing.

### Work branch

- Branch: `claude/implement-ai-assist-v2-jGM2V` (harness-auto-suffixed; this is the v2 design agent's working branch)
- PR target: `claude/ai-assist-features`

### Tensions resolved

- **v1 research vs D3 (no silent translation):** v1 §3.2 had a full effort-to-wire mapping table (e.g., `'high'` → `thinkingBudget: 8192` for Gemini). v2 preserves the generic effort mapping as a *documented common-subset*, distinct from the per-provider configs which pass wire values directly. This resolves the tension: generic callers get the documented mapping; power callers bypass it via per-provider blocks.
- **v1 research on Gemini Pro:** v1 §1.3 notes Gemini 2.5 Pro cannot disable thinking (thinkingBudget: 0 is an error). v2 resolves v1's Q3 by keeping `google-gemini` descriptor as `thinkingMode: 'optional'` and documenting that Pro's always-on behavior is enforced at the model level (via runtime validation), not the provider level.

---

## Open questions / blockers

Four open questions remain for phase B; none block v2 design signoff:

1. **Q1 — xAI temperature rejection** (D8: phase B step zero): verify empirically
2. **Q2 — Gemini token budget defaults for generic effort**: verify or adjust in phase B
3. **Q3 — Anthropic Sonnet 4.5 wire format**: verify whether adaptive mode is accepted
4. **Q4 — Proxy serialization counterpart**: document in phase B PR for proxy maintainers

---

## Phase B checkpoints

### B.0 — Live verification (D8)

**xAI temperature rejection:** Live API call not possible in this session (no API key access). Applied conservative default: `Result.fail` when `xaiEffort !== undefined && xaiEffort !== 'none'` and temperature is provided — same policy as Anthropic/OpenAI. If live verification confirms xAI accepts temperature, update `checkTemperatureConflict` in `thinkingOptionsResolver.ts` to remove the xAI branch (matching Gemini's pass-through behavior).

**Gemini token budget defaults (Q2):** Design doc values (low=1024, medium=4096, high=8192) applied as documented. These are defensible but not sourced from live docs. Callers needing Gemini-specific tuning should use the `providers` array with `IGeminiThinkingConfig.thinkingBudget` directly.

**Anthropic Sonnet 4.5 wire format (Q3):** Implemented using the standard `thinking: { type: 'enabled' }, output_config: { effort }` wire format. If Sonnet 4.5 requires the legacy `thinking: { type: 'enabled', budget_tokens: N }` format, a model-conditional branch is needed in `callAnthropicCompletion`. This is an implementation detail that doesn't affect the type architecture.

### B.1–B.7 — Implementation

- **model.ts:** `IThinkingConfig`, `IThinkingProviderConfig`, per-provider config/options types, model-name unions, `AiThinkingMode`, `'thinking'` added to `AiModelCapability`/`ModelSpecKey`/`allModelSpecKeys`, `thinkingMode` on `IAiProviderDescriptor`
- **thinkingOptionsResolver.ts:** `mergeThinkingConfig`, `checkTemperatureConflict`, `providerDiscriminatorForId`, `IResolvedThinkingConfig`
- **registry.ts:** `thinkingMode` on all descriptors; xAI staleness fix (D7); `'thinking'` capability rules added
- **apiClient.ts:** `thinking?` on params; D5 unconditional Anthropic fix; thinking wire encoding x4; temperature+thinking=Result.fail (D4); proxied updates
- **streaming adapters:** `thinking?` on `IProviderCompletionStreamParams`; all 4 adapters + proxy updated
- **streamingClient.ts:** resolve+conflict-check before dispatching; pass through to adapters
- **index.ts:** all new types exported

---

## PRs

- **v1 PR** (research-only, original brief): `claude/ai-assist-thinking-config-xy1J8` → `claude/ai-assist-features` — merged into the v2 commission prep PR (consolidated rather than separate)
- **v2 commission prep PR** (orchestrator commit): `claude/ai-assist-thinking-config-revision-prep` → `claude/ai-assist-features` — merged
- **v2 design PR**: `claude/implement-ai-assist-v2-jGM2V` → `claude/ai-assist-features` — merged (#332)
- **Phase B PR**: `claude/ai-assist-thinking-phase-b-aIY1Y` → `claude/ai-assist-features` — TBD
