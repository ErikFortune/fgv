# gemini-thinking-level — send Gemini's `thinkingLevel`; rotate `@google-gemini:pro` to Gemini 4

**Base**: `origin/integration/asks` @ `5170a1d11` (includes #773). **Branch**: `gemini-thinking-level`.
**Worktree**: `/home/user/fgv-gemini`. **Owner of this file**: orchestrator (frozen). Worker writes `state.md` / `result.md`.

A parallel stream `model-followups` edits the OpenAI / Groq / xAI sections of `registry.ts`, the
client-tool builder and `modelSpecResolver.ts`; stay in the Gemini descriptor, the Gemini adapter(s)
and `thinkingOptionsResolver.ts`'s Gemini mapping, and expect a merge with it.

## Records this stream closes
- `docs/FUTURE.md` § "`ai-assist` — send Gemini's `thinkingLevel`, then rotate `@google-gemini:pro` to Gemini 4".
- `docs/TECH_DEBT.md` "[P3] Generic `effort: 'none'` maps to a Gemini value that errors on Pro-family models."
- `model-alias-refresh` Q3 (held `gemini-4-argon` rotation; see the alias comment in `registry.ts` ~254).
- The interim `gemini-3.5-flash-lite` entry on `thinkingRequiredModelPrefixes` (comes off once `'none'` maps to `minimal` there).

## Required reading (fetch current docs; record URL + date + quoted sentence for every claim in `result.md`)
- Google Gemini API "Thinking" page — § Controlling thinking: which models take `thinkingLevel`, the
  allowed levels per model, whether `thinkingBudget` is deprecated/rejected per model, whether the two
  may be sent together, and which models can turn thinking fully off.
- Gemini 4 Argon model page (id, GA status, context/output limits, thinking levels, structured output,
  tools) and the models overview.
- If any page cannot be read, stop that sub-item and record why; do not guess a level table.

## Decisions (already made)
1. **Per-model level table in the Gemini descriptor**, declared data (no provider/model `if`s in adapter
   code): for each model prefix, the levels it accepts and whether it uses `thinkingLevel` or
   `thinkingBudget`. Models not listed keep today's `thinkingBudget` wire exactly (no behaviour change).
2. **Generic effort mapping** for level models: `'none'` → `minimal` only where the model lists
   `minimal` and Google documents it as off/minimal thinking; otherwise `'none'` is refused locally
   with a message naming the model and its lowest level (never silently degraded to a level that
   thinks, unless the existing degrade-with-note policy for thinking-required models already applies —
   follow what the resolver does for other thinking-required models). `low`/`medium`/`high` map 1:1
   where listed; an effort the model doesn't list is refused with the allowed set.
3. **Gemini Pro budget-0 leak (TECH_DEBT)**: on budget-wire Pro models, generic `'none'` must no longer
   emit `thinkingBudget: 0`; refuse with the Pro-family constraint (scope sketch in the entry).
4. **Caller-explicit Gemini config** (`providers: [{ provider: 'google', config: … }]`): add
   `thinkingLevel` to `IGeminiThinkingConfig` (closed union, converter-validated). Sending both
   `thinkingLevel` and `thinkingBudget` is refused locally if the docs say the API rejects it.
5. **Rotate `@google-gemini:pro` → `gemini-4-argon`** only if its page shows GA and the level wire is in
   place; add its declarations (max output exact-id, structured output, thinking lists, capability
   detection, `*ModelNames` unions). Change file `minor` with `BREAKING:` note if the rotation changes
   default behaviour for alias users (thinking always on, levels instead of budgets).
6. Remove the flash-lite interim from `thinkingRequiredModelPrefixes` once `'none'` → `minimal` is sent there.

## Testbed
- Gemini tier canary / wire-probe rows: `effort none|low|high` on `gemini-3.5-flash-lite`,
  `gemini-3.8-flash`, `gemini-4-argon` (and `@google-gemini:pro`), plus one raw explicit
  `thinkingLevel` row per level model. Follow the existing OBSERVED / PENDING row pattern; keyless runs
  show PENDING with expected outcome. Add a run sheet to `result.md`.

## Rules
- Repo standards (Result pattern, converters, no `any`, 100% coverage, no `c8 ignore` — ask in state.md).
- Red-then-green per decision (request-body tests asserting the exact `generationConfig.thinkingConfig`).
- One change file per touched package; `rush change --verify --target-branch origin/integration/asks`.
- Update `docs/FUTURE.md` (remove entry), `docs/TECH_DEBT.md` (close), ai-assist README, ts-extras
  `CAPABILITIES.md`. Close-out via `finalize-task` to `.ai/tasks/completed/2026-11/gemini-thinking-level/`
  with ledger entry and `meta.yaml` (`#TBD`).
- No subagents; apply the code-reviewer rubric inline before coverage closure.
- Commit first, then gate in the foreground (or background-and-wait for `rush test`); logs only under
  `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/gemini/`. Grade by grep.
- Push to `origin/gemini-thinking-level` when clean; no PR.
