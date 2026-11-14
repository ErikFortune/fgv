# ai-assist-thinking-config — completed

**Stream ID:** ai-assist-thinking-config
**Bucket:** 2026-05
**PR:** [#334](https://github.com/ErikFortune/fgv/pull/334) — `feat(ai-assist): thinking-config Phase B — layered options for extended thinking/reasoning`
**Target branch:** `claude/ai-assist-features`

## What shipped

Extended thinking/reasoning support on `callProviderCompletion` and `callProviderCompletionStream` for all four providers (Anthropic, OpenAI, Gemini, xAI), using the same layered options pattern established by the image-generation feature.

### Core additions

- **`IThinkingConfig`** — cross-provider generic `effort?: 'low' | 'medium' | 'high'` shorthand plus optional `providers[]` array of per-provider config blocks with optional `models[]` narrowing and an `'other'` escape hatch for non-registered models
- **`IAnthropicThinkingConfig`**, **`IOpenAiThinkingConfig`**, **`IGoogleThinkingConfig`**, **`IXAiThinkingConfig`** — per-provider wire config types
- **`thinkingOptionsResolver`** — merge logic with explicit 3-tier precedence (generic effort → provider-generic blocks → model-specific/Other; later declaration wins within tier); temperature conflict check returns `Result.fail` for Anthropic/OpenAI/xAI, passes for Gemini
- **Registry** — `thinkingMode` field on all descriptors; `'thinking'` added to `AiModelCapability` and `ModelSpecKey`; xAI D7 staleness fix (retired models removed, `grok-4.3` as default)
- **Wire encoding** — Anthropic `thinking+output_config`, OpenAI chat `reasoning_effort`, OpenAI Responses `reasoning.effort`, Gemini `thinkingConfig.thinkingBudget`, xAI `reasoning_effort`, proxy passthrough
- **Anthropic D5 fix** — `extractAnthropicText` now unconditional in the non-streaming path (filters to `type: 'text'` blocks, discards thinking content cleanly)

### Package surface

- `@fgv/ts-extras/ai-assist` — `model.ts`, `thinkingOptionsResolver.ts`, `registry.ts`, `apiClient.ts`, `streamingClient.ts`, all four streaming adapters + proxy, `index.ts`
- `.ai/instructions/LIBRARY_CAPABILITIES.md` — ai-assist decision shortcut updated

## Key decisions (D1–D9 + A1–A4)

| ID | Topic | Decision |
|---|---|---|
| D1 | Type architecture | Layered options per image-gen pattern: generic + `providers?` array + Other escape hatch; option (a) loose-union per provider |
| D2 | Merge precedence | generic → provider-generic → model-specific ≈ Other; declaration order within tier |
| D3 | Per-provider knobs | First-class on per-provider configs (Anthropic `'max'`, OpenAI `'xhigh'`/`'none'`/`'minimal'`, Gemini token budgets, xAI `'none'`) |
| D4 | Temperature + thinking | `Result.fail` with clear contextual message for incompatible combinations |
| D5 | Anthropic non-streaming validator | Unconditional `extractAnthropicText` (filters to `type: 'text'` blocks) |
| D6 | Registry signaling | `AiModelCapability`+`'thinking'`, `ModelSpecKey`+`'thinking'`, `thinkingMode` field on descriptors |
| D7 | xAI registry staleness | Retired models removed; `grok-4.3` as default for base/tools/thinking |
| D8 | xAI temperature rejection | Conservative default applied (see B.0 below); live verification pending |
| D9 | Thinking event surfacing | Out of scope — deferred to followup stream `ai-assist-thinking-events` |
| A1 | OpenAI `'none'` cross-reference | JSDoc on `mergeThinkingConfig` and `IOpenAiThinkingConfig.effort` calls out `'none'` as the supported way to disable reasoning and re-enable temperature |
| A2 | Sonnet 4.5 wire format | Standard `thinking+output_config` format applied; see B.0 |
| A3 | Gemini integer defaults | low=1024, medium=4096, high=8192 applied; see B.0 |
| A4 | Proxy counterpart note | Documented in PR description — proxy server must deserialize/forward the new `thinking` field |

## B.0 live verification results

**xAI temperature rejection (D8):** Live API call not possible (no key access). Conservative default applied: `Result.fail` when `xaiEffort !== undefined && xaiEffort !== 'none'` and temperature is provided — same policy as Anthropic/OpenAI. If live verification confirms xAI accepts temperature alongside reasoning, remove the xAI branch in `checkTemperatureConflict` (matching Gemini's pass-through behavior).

**Gemini token budget defaults (A3):** Design-doc values (low=1024, medium=4096, high=8192) applied as documented. Not sourced from live docs. Callers needing Gemini-specific tuning should use the `providers` array with `IGoogleThinkingConfig.thinkingBudget` directly.

**Anthropic Sonnet 4.5 wire format (A2):** Standard `thinking: { type: 'enabled' }, output_config: { effort }` format applied. If Sonnet 4.5 requires the legacy `thinking: { type: 'enabled', budget_tokens: N }` format, a model-conditional branch is needed in the Anthropic adapter.

## PR review fixes (post-merge convergence)

The following items were addressed across **seven** rounds of Copilot review on PR #334
(originally written here as "five"; corrected 2026-08-14 against the PR itself, and
consistent with the R1–R7 table below):

| Round | Fix |
|---|---|
| R1 | Temperature omission for OpenAI/xAI when thinking active (all 4 adapter sites) |
| R1 | xAI effort routed via `xaiEffort` field (not just `openAiEffort`) |
| R1 | `modelContext` includes `'thinking'` when thinking param provided |
| R2 | `stop_reason` validated as string in `callAnthropicCompletion` |
| R2 | grok-4 model guard: `reasoning_effort` / `reasoning.effort` omitted for grok-4 at all 4 adapter sites |
| R3 | `modelContext` prefers `'thinking'` over `'tools'` when both are present |
| R3 | `blockApplies` uses prefix matching (`startsWith(name + '-')`) so unversioned typed names match date-suffixed registry IDs |
| R4 | `hasThinkingConfig` guards `modelContext`: `thinking: {}` no longer triggers `'thinking'` model selection |
| R5 | JSDoc for `thinking?` parameter correctly describes provider-specific temperature conflict semantics |
| R6 | `hasThinkingConfig` is now provider-aware: a `providers` block targeting a different provider no longer triggers `'thinking'` model context |
| R6 | `validateResolvedThinkingConfig` declined — model-level constraint validation deferred (requires model capability registry; see Followup) |
| R7 | `hasThinkingConfig` gated on `discriminator !== undefined` — unknown providers never switch model context to `'thinking'` |
| R7 | `modelNameMatches` suffix-pattern tightening deferred to followup (no known false positive today; see Followup) |

## Acceptance status

- [x] All D1–D9 binding decisions implemented faithfully
- [x] A1–A4 implementer-aids addressed
- [x] `rushx build` passes in `ts-extras`
- [x] `rushx coverage` passes at 100% across all ai-assist packlet files
- [x] No `any` types; all fallible operations return `Result<T>`
- [x] xAI D7 staleness fix applied
- [x] Anthropic D5 fix applied (tests updated for new response shape)
- [x] LIBRARY_CAPABILITIES.md updated (thinking section; D9 deferral noted correctly)
- [x] PR opened with A4 proxy note
- [x] All 7 rounds of Copilot review feedback addressed; no open threads *(was "5"; see Appendix A.1)*

## Followup

- **`ai-assist-thinking-events`** — thinking-event surfacing (new `IAiStreamThinking` stream-event variant, response-shape extension, per-provider opt-in plumbing); deferred per D9
- **xAI live temperature verification** — if confirmed that xAI accepts temperature + reasoning, remove the xAI branch in `checkTemperatureConflict`
- **`validateResolvedThinkingConfig`** — pre-flight validation of model-level constraints (Gemini `thinkingBudget: 0` on Pro, Anthropic `'max'` model limits, OpenAI `'none'` on o-series); requires a model capability registry; deferred until that infrastructure exists
- **`modelNameMatches` date-suffix tightening** — current `startsWith(name + '-')` rule could in principle match `gpt-5-pro` when targeting `gpt-5`; no concrete false positive today; deferred to followup when a real case arises

## Source artifacts

- [`brief.md`](./brief.md) — original stream kickoff brief
- [`brief-phase-b.md`](./brief-phase-b.md) — phase B binding contract (8 phases B.0–B.8)
- [`brief-phase-a-v2.md`](./brief-phase-a-v2.md) — phase A v2 commission brief
- [`design.md`](./design.md) — v2 design (signed off in PR #332)
- [`design-v1.md`](./design-v1.md) — archived v1 design (rejected at signoff; research preserved)
- [`state.md`](./state.md) — terminal stream state
- [`meta.yaml`](./meta.yaml) — structured record (added 2026-08-14)

---

## Appendix A — corrections (2026-08-14)

Produced by a `/finalize-task retroactive` run whose antagonist pass commissioned an
independent reviewer against this stream's artifacts, the shipped source, and PR #334
itself. Original wording preserved verbatim. The briefs, designs and `state.md` are
authored-in-flight records and are left untouched; this README is a synthesis read by
later agents as a statement of what shipped.

### A.1 — the Copilot round count contradicted its own table

> **Original:** "The following items were addressed across five rounds of Copilot review
> on PR #334" / "- [x] All 5 rounds of Copilot review feedback addressed; no open threads"

Seven. The table immediately below both statements lists R1 through R7, and PR #334 itself
shows seven rounds — checked directly, not merely inferred from the table. R6 and R7 each
carry a substantive `hasThinkingConfig` fix plus a deferral, so they are real rounds, not
bookkeeping. "Five" reads as a figure written before the last two rounds and never updated.
Worth stating plainly rather than quietly fixing: under `CODING_STANDARDS.md` §
"Review-loop discipline", a seven-round loop is itself a signal — the guidance treats
round 5+ as grounds to ask whether layer 1 was run thoroughly or the change was too large
for the loop.

### A.2 — A2 shipped a wire shape that matched neither Anthropic mode

The "B.0 live verification results" section below frames the Anthropic wire format as an
unverified default with a possible future fix path. It was worse than that. Anthropic has
two modes: legacy (`thinking: { type: 'enabled', budget_tokens: N }`) and adaptive
(`thinking: { type: 'adaptive' }` + top-level `output_config.effort`). `design.md`
specified **adaptive**, flagged that Sonnet 4.5 might not accept it, and asked phase B to
verify. Phase B could not verify — no API key — and shipped `type: 'enabled'` with
`output_config` and no `budget_tokens`: the legacy discriminator carrying the adaptive
payload, which is neither mode. That is a divergence from this stream's own design doc,
not a conservative default.

It was corrected two and a half months later under live validation by `14574e45c`, after
the Claude 5 family began rejecting the legacy shape with HTTP 400; the fix branches on
`useAdaptiveThinking` and emits each mode correctly. None of that reversal is recorded in
this stream's artifacts. The generalizable lesson: when a decision cannot be verified,
ship one of the documented shapes — a blend of two cannot be right anywhere, and it
forfeits the diagnostic value of a clean failure.

### A.3 — three of four followups live nowhere durable

Of the four items in "Followup" below, only `ai-assist-thinking-events` is durably tracked
(a live entry in `docs/WORKSTREAMS.md`, still unshipped — and `LIBRARY_CAPABILITIES.md`'s
statement that thinking-event surfacing remains that stream's scope is accurate, not
stale). The other three — xAI live temperature verification, `validateResolvedThinkingConfig`,
and the `modelNameMatches` date-suffix tightening — appear in no ledger. The xAI item is
confirmed still unresolved in source: `thinkingOptionsResolver.ts` still carries the
comment "Conservative default ... live verification pending", with no follow-up commit
since the original merge. A followup recorded only inside a `completed/` README is
invisible to any later orchestrator scanning `FUTURE.md` / `TECH_DEBT.md` for open work.

*(The `modelNameMatches` item's "no known false positive" still holds: the OpenAI line has
rotated to `gpt-5.6-luna` / `-terra` / `-sol` / `gpt-5.4-nano`, none of which collide the
way `gpt-5-pro` vs `gpt-5` would have.)*

### A.4 — a surfaced lesson was never filed

`state.md` lists four lessons-codification candidates. Three reached
`.ai/notes/orchestrator/lessons-pending.md` as L1–L3. The fourth did not: that D5's
unconditional `extractAnthropicText` broke existing test fixtures which used
`{content: [{text}]}` without `type: 'text'`, and that response-parsing changes should
trigger an immediate fixture audit. Filed 2026-08-14 as **L31**. The second-order finding
is the interesting one — three of four candidates made it and nothing caught the drop.

*(L1, the parallel-phase-A lesson this stream surfaced, is in `lessons-pending.md` but
remains uncodified some three months and dozens of streams later; the most recent sweep
took L38–L40 and did not reach it.)*

### A.5 — the ledger and this README disagree on tier count

`docs/WORKSTREAMS.md` describes `thinkingOptionsResolver.ts` as "4-tier merge logic". The
source and `design.md` both give four numbered rules where rule 4 shares rule 3's
precedence — three *effective* tiers. The sibling `imageOptionsResolver` uses identical
phrasing, so both streams are three-effective-tier despite four numbered steps. Not a
defect in either document so much as a count that means different things depending on
whether you are counting rules or precedence levels.

### Checked and unchanged

Verified accurate: the v1-rejected-at-signoff account (`design-v1.md`'s recommendation is
literally titled "Approach C — Capability-driven optional (recommended)", and its §3.2 is
the hard-coded translation table `brief-phase-a-v2.md` characterizes); the unconditional
`extractAnthropicText` (D5) in both current source and the original ship commit; the
Gemini integer budgets (1024/4096/8192, unchanged, still design-doc-sourced); PR #332 and
#334 belonging to this stream rather than the sibling image-gen stream; and the three
effective precedence tiers. Two PRs the header omitted — #330 (phase A v2 commission) and
#333 (v2 signoff + phase B brief) — were confirmed to belong to this stream and are named
in the `WORKSTREAMS.md` entry and `state.md`.
