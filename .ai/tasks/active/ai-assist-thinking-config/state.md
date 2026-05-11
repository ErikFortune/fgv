# Stream State: ai-assist-thinking-config

**Status:** 🔵 phase A revision in flight — v1 design archived, v2 commissioned
**Last updated:** 2026-05-11 (orchestrator — v1 review + v2 commission)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A v1 | 📦 archived | `design-v1.md` preserved. Research stands; architecture rejected at signoff for divergence from image-gen pattern. |
| A v2 | 🟢 ready | Revision brief at `brief-phase-a-v2.md`. Awaiting fresh agent kickoff. |
| B — implementation | ⏸ blocked on phase A v2 signoff AND on `ai-assist-image-generation` phase B landing | Brief written by orchestrator post-v2 signoff |

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

## Open questions / blockers

*(empty — v2 agent populates as research surfaces them; v1's nine open questions are resolved by D1-D9 except for D8 which is a phase B step)*

---

## PRs

- **v1 PR** (research-only, original brief): `claude/ai-assist-thinking-config-xy1J8` → `claude/ai-assist-features` — merged into the v2 commission prep PR (consolidated rather than separate)
- **v2 commission prep PR** (this orchestrator commit): `claude/ai-assist-thinking-config-revision-prep` → `claude/ai-assist-features` — open after orchestrator pushes
- **v2 design PR**: TBD by the v2 agent; target `claude/ai-assist-features`
- **Phase B PR**: TBD by phase B agent post-v2-signoff
