# Stream State: ai-assist-thinking-config

**Status:** ✅ complete — Phase B merged; artifacts migrated 2026-05-11
**Last updated:** 2026-05-11 (phase B agent — B.1–B.8 complete)

---

## Phase status

| Phase | Status | Notes |
|-------|--------|-------|
| A v1 | 📦 archived | `design-v1.md` preserved. Architecture rejected at signoff; research stands. |
| A v2 | ✅ signed off | `design.md` merged in [#332](https://github.com/ErikFortune/fgv/pull/332). Orchestrator review recommended signoff as-presented; user approved. |
| B — implementation | ✅ complete | Branch `claude/ai-assist-thinking-phase-b-aIY1Y`; merged into `claude/ai-assist-features`. |

---

## Phase A v2 signoff summary

The v2 design faithfully applied the image-gen layered options pattern to the thinking-config surface. Orchestrator review (PR #332) flagged a few implementer-aids for the phase B brief (now folded into `brief-phase-b.md` as A1-A4) but found no architectural issues. User signed off as-presented.

### Key strengths surfaced during review

- **Family-shape decision (§3.1)**: option (a) loose-union per provider chosen for all four providers with explicit per-provider justification.
- **OpenAI 'none' edge case (§4.5)**: setting `effort: 'none'` on gpt-5.x disables reasoning AND allows temperature. The adapter must check effective merged effort, not just presence of thinking config.
- **Generic effort common-subset mapping (§3.5)**: documented mapping table; explicit (not silent) translation.
- **Anthropic landmine in §7.2**: forward-looking implementer-aid documenting that `includeThoughts: true` to Gemini without strip logic = silent wrong output.
- **Abstraction-creep discipline held**: no helper builders, no session manager, no `IThinkingClient`. Just types and adapter logic.

### Implementer-aids surfaced during signoff

| Aid | Source | Disposition |
|---|---|---|
| A1 | Orchestrator review | JSDoc on merge function must explicitly call out OpenAI 'none' edge case |
| A2 | Orchestrator review (design.md Q3) | Sonnet 4.5 wire format verification folds into B.0 |
| A3 | Orchestrator review (design.md Q2) | Gemini integer defaults verification folds into B.0 |
| A4 | Orchestrator review (design.md Q4) | Phase B PR description must call out external proxy server counterpart change |

---

## Phase A v1 (archived)

### Working branch (v1)

- Branch: `claude/ai-assist-thinking-config-xy1J8`
- Status: merged into the v2 commission prep PR (#330); design.md preserved as `design-v1.md`

---

## Phase A v2 (signed off)

### Binding decisions

| ID | Topic | Decision |
|---|---|---|
| D1 | Type architecture | Layered options per image-gen pattern |
| D2 | Merge precedence | generic → provider-generic → model-specific ≈ Other; declaration order within tier |
| D3 | Per-provider knobs | First-class on per-provider configs |
| D4 | Temperature + thinking | Result.fail with clear contextual message |
| D5 | Anthropic non-streaming validator | Unconditional fix (always use `extractAnthropicText`) |
| D6 | Registry signaling | `AiModelCapability`+'thinking', `ModelSpecKey`+'thinking', `thinkingMode` field |
| D7 | xAI registry staleness | Fold the fix in (remove retired models; update default to grok-4.3) |
| D8 | xAI temperature rejection | Phase B step zero (B.0): live verification; conservative default applied |
| D9 | Thinking event surfacing | Out of scope; followup stream `ai-assist-thinking-events` queued |

### Working branch (v2)

- Branch: `claude/implement-ai-assist-v2-jGM2V`
- PR: [#332](https://github.com/ErikFortune/fgv/pull/332) — merged into `claude/ai-assist-features`

---

## Phase B (complete)

### B.0 outcomes (live verification)

**xAI temperature rejection (D8):** Conservative default applied: `Result.fail` when `xaiEffort !== undefined && xaiEffort !== 'none'` and temperature is provided. If live verification confirms xAI accepts temperature, remove the xAI branch in `checkTemperatureConflict`.

**Gemini token budget defaults (Q2/A3):** low=1024, medium=4096, high=8192 applied as documented.

**Anthropic Sonnet 4.5 wire format (Q3/A2):** Standard `thinking: { type: 'enabled' }, output_config: { effort }` applied. Legacy `budget_tokens` branch not needed unless Sonnet 4.5 requires it.

### B.1–B.7 — Implementation complete

All phases implemented and committed:
- **model.ts:** full type hierarchy
- **thinkingOptionsResolver.ts:** mergeThinkingConfig, checkTemperatureConflict, providerDiscriminatorForId, IResolvedThinkingConfig
- **registry.ts:** thinkingMode on all descriptors; xAI D7 staleness fix; 'thinking' capability rules
- **apiClient.ts:** thinking wire encoding x4; D4 temperature conflict; D5 unconditional Anthropic fix; proxied passthrough
- **streaming adapters:** thinking wire encoding in all 4 adapters + proxy
- **streamingClient.ts:** resolve+conflict-check before dispatching
- **index.ts:** all new types exported

### B.6 — 100% coverage achieved

All files at 100% across statements/branches/functions/lines. c8 ignore directives for: mergeThinkingConfig dead guard (always succeeds), google `break` after unreachable path.

### Lessons-codification candidates

- Serialize phase A when two streams address structurally similar problems — their pattern-extraction outputs feed each other.
- Cloud-agent harness auto-suffixes branch names. Briefs should accommodate this rather than specifying exact names.
- Cloud-agent harness auto-opens draft PRs. Need explicit closure tracking.
- D5 (unconditional Anthropic extractAnthropicText) had test collateral damage: existing tests used `{content: [{text}]}` without `type: 'text'`. When changing response-parsing logic, audit all response fixtures immediately.

---

## PRs

- **v1 design PR**: #325 (draft) — RETIRED
- **v2 commission prep PR**: #330 — merged
- **v2 design PR**: #332 — merged 2026-05-11
- **Phase B PR**: `claude/ai-assist-thinking-phase-b-aIY1Y` → `claude/ai-assist-features` — merged 2026-05-11
