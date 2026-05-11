# Stream State: ai-assist-thinking-config

**Status:** 🔵 phase B in progress — core implementation committed; tests/docs/migration in flight
**Last updated:** 2026-05-11 (phase B agent — B.1–B.7 committed; B.6/B.7/B.8 remaining)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
<<<<<<< HEAD
| A v1 | 📦 archived | `design-v1.md` preserved. Research stands; architecture rejected at signoff for divergence from image-gen pattern. |
| A v2 | ✅ complete | `design.md` merged via PR #332 into `claude/ai-assist-features`. |
| B — implementation | 🔵 in progress | `ai-assist-image-generation` phase B (#329) merged; implementation underway on `claude/ai-assist-thinking-phase-b-aIY1Y`. |
=======
| A v1 | 📦 archived | `design-v1.md` preserved. Architecture rejected at signoff; research stands. |
| A v2 | ✅ signed off | `design.md` merged in [#332](https://github.com/ErikFortune/fgv/pull/332). Orchestrator review recommended signoff as-presented; user approved. |
| B — implementation | 🟢 ready (blocked on image-gen phase B merge) | Binding contract: `brief-phase-b.md` (this directory). Sequenced strictly after `ai-assist-image-generation` phase B merges to `claude/ai-assist-features`. |
>>>>>>> origin/claude/ai-assist-features

---

## Phase A v2 signoff summary

The v2 design faithfully applied the image-gen layered options pattern to the thinking-config surface. Orchestrator review (PR #332) flagged a few implementer-aids for the phase B brief (now folded into `brief-phase-b.md` as A1-A4) but found no architectural issues. User signed off as-presented.

### Key strengths surfaced during review

- **Family-shape decision (§3.1)**: option (a) loose-union per provider chosen for all four providers with explicit per-provider justification. Contrast with image-gen's (b) nested family blocks correctly identifies why thinking-config's family splits (effort-vocabulary differences) don't warrant nested ceremony.
- **OpenAI 'none' edge case (§4.5)**: clever real-API engagement — setting `effort: 'none'` on gpt-5.x disables reasoning AND allows temperature. The adapter must check effective merged effort, not just presence of thinking config.
- **Generic effort common-subset mapping (§3.5)**: documented mapping table; explicit (not silent) translation. Power callers needing 'max'/'xhigh'/specific token budgets must use per-provider blocks. Pattern preserved.
- **Anthropic landmine in §7.2**: forward-looking implementer-aid documenting that `includeThoughts: true` to Gemini without strip logic = silent wrong output.
- **Abstraction-creep discipline held**: no helper builders, no session manager, no `IThinkingClient`. Just types and adapter logic.

### Implementer-aids surfaced during signoff (folded into brief-phase-b.md)

| Aid | Source | Disposition |
|---|---|---|
| A1 | Orchestrator review | JSDoc on merge function must explicitly call out OpenAI 'none' edge case as the supported way to enable temperature-respecting hybrid behavior |
| A2 | Orchestrator review (design.md Q3) | Sonnet 4.5 wire format verification folds into B.0 step zero |
| A3 | Orchestrator review (design.md Q2) | Gemini integer defaults verification folds into B.0 step zero |
| A4 | Orchestrator review (design.md Q4) | Phase B PR description must call out external proxy server counterpart change |

### Open questions at signoff

All four open questions from design.md §9 are phase B implementation details, not architectural gaps:
- Q1 (xAI temperature) → B.0 step zero per D8
- Q2 (Gemini defaults) → B.0 step zero per A3
- Q3 (Sonnet 4.5 wire format) → B.0 step zero per A2
- Q4 (proxy serialization) → phase B PR description per A4

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
- Status: merged into the v2 commission prep PR (#330); design.md from this branch was preserved as `design-v1.md` to support v2's reference back to v1's research

---

## Phase A v2 (signed off)

### Binding decisions

| ID | Topic | v1 | v2 (signed off) |
|---|---|---|---|
| D1 | Type architecture | Approach C (unified) | Layered options per image-gen (generic + `providers?` array of per-provider blocks with `models?` narrowing + Other escape hatch); option (a) loose-union per provider |
| D2 | Merge precedence | Implicit | Explicit: generic → provider-generic → model-specific ≈ Other; declaration order within tier |
| D3 | Per-provider knobs | Abstracted away (silent translation) | First-class on per-provider configs: Anthropic `'max'`, OpenAI `'xhigh'`/`'none'`/`'minimal'`, Gemini token budgets, xAI `'none'` |
| D4 | Temperature + thinking | Auto-suppress + optional log.warn | Result.fail with clear contextual message |
| D5 | Anthropic non-streaming validator | Conditional fix | Unconditional fix (always use `extractAnthropicText`) |
| D6 | Registry signaling | `AiModelCapability`+'thinking', `ModelSpecKey`+'thinking', `thinkingMode` field | Same; integrated with layered pattern |
| D7 | xAI registry staleness | Open question | Fold the fix in (remove retired models; update default to grok-4.3) |
| D8 | xAI temperature rejection | Open question | Phase B step zero (B.0): live verification |
| D9 | Thinking event surfacing | "Future extension point" hand-wave | Out of scope; followup stream `ai-assist-thinking-events` queued |

### Working branch (v2)

- Branch: `claude/implement-ai-assist-v2-jGM2V` (cloud agent's auto-suffixed name)
- PR: [#332](https://github.com/ErikFortune/fgv/pull/332) — merged into `claude/ai-assist-features` as `d9de4f2b6`

---

## Phase B (commissioned)

### Sequencing

**Phase B is strictly sequenced after `ai-assist-image-generation` phase B merges into the integration branch.** Same packlet; serial implementation to prevent file collisions. The image-gen phase B PR (#329) is in flight; thinking-config phase B agent kickoff awaits its merge.

### Binding contract

`.ai/tasks/active/ai-assist-thinking-config/brief-phase-b.md` — the binding contract for the phase B agent. Eight phases (B.0 through B.8); B.0 is live verification per D8 + A2 + A3.

### Lessons-codification candidates (parked for post-cluster triage)

- "Outputs are disjoint at the research level" is not sufficient grounds for parallel phase A when two streams address structurally similar problems. The pattern-extraction outputs feed each other. For analogous future clusters: serialize phase A so the second design can build on the first's resolution. (Captured at v1→v2 transition; reaffirmed at v2 signoff.)
- Cloud-agent harness auto-suffixes branch names; both v1 and v2 phase A used random suffixes (`xy1J8`, `jGM2V`). Briefs should accommodate this rather than specifying exact names.
- Cloud-agent harness auto-opens draft PRs for work branches; orchestrator's prep/commission PR may supersede them. Need explicit closure tracking. (Surfaced when discovering PR #325 was the v1 agent's auto-opened draft.)

---

## Open questions / blockers

*(none — phase B unblocked once image-gen phase B merges)*

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

- **v1 design PR**: `claude/ai-assist-thinking-config-xy1J8` (#325, draft) — RETIRE/CLOSE (superseded by #330's preservation as design-v1.md)
- **v2 commission prep PR**: `claude/ai-assist-thinking-config-revision-prep` → `claude/ai-assist-features` (#330) — merged
- **v2 design PR**: `claude/implement-ai-assist-v2-jGM2V` → `claude/ai-assist-features` (#332) — merged 2026-05-11
- **Phase B PR**: `claude/ai-assist-thinking-phase-b-aIY1Y` → `claude/ai-assist-features` — in progress
