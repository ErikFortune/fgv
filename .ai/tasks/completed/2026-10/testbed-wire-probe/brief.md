# Brief: `testbed-wire-probe`: observe what each provider accepts, compare with our wire tables

This brief is orchestrator-owned and frozen at kickoff. Put questions in `state.md`.

**Origin:** user decision 5, 2026-10-18.
- #736 shipped three wire decisions that are **inferences**: OpenAI/xAI numeric-enum pass, Anthropic-tools `{}` pass, and OpenAI function-tools `{}` refuse.
- #734 shipped per-keyword pass/translate/fold tables from docs.
- This stream turns those claims into observations.

**Base:** `integration/asks` at `b90de8b2b` or later. **PR target:** `integration/asks`. Independent of the other streams; re-run it after `json-schema-pattern` lands, which adds `pattern`.

## What to build

A `samples/testbed` scenario in the style of `mcpProbe`, run on demand with real provider keys and **never in CI**:
- **Fixture schemas:** a fixed, small set covering every row of the per-wire tables (`schemaKeywords.ts`, `keywordAdaptation.ts`): number/integer/boolean enums; `{}` at the root, nested in properties and in items; each constraint keyword from #734 (`minimum`, `exclusiveMinimum`, `multipleOf`, `minLength`, `maxLength`, …); and each annotation (`format`, `default`, `examples`, `title`).
- **Probe, per configured provider and format** (Anthropic tools, Anthropic JSON outputs, OpenAI Responses tools, OpenAI strict structured output, Gemini, xAI): for each fixture, send the **raw, unadapted** schema in a minimal request and record whether the provider accepts or rejects it, with the provider's error text. The probe must bypass our adaptation layer, because the question is what the provider accepts.
- **Compare** each observation with what our table says (pass vs fold/refuse), and print a report with three outcomes per row:
  - **agrees**;
  - **conservative**: we fold or refuse but the provider accepted;
  - **unsafe**: we pass but the provider rejected. This is the one that matters.
- Exit non-zero only on **unsafe** rows.
- Also run each fixture **through** our adaptation and confirm the adapted request is accepted. That is the end-to-end check of what we actually send.

## Constraints

- Keys come from the testbed's existing configuration pattern; read how `mcpProbe` and other live scenarios get theirs. Never log keys.
- Keep requests minimal: smallest model per provider (choose and justify), one turn, low max tokens.
- The report goes to stdout. Paste one real run into `result.md` **only if you can run it**. You likely have no keys; if so, ship the scenario with unit tests over the comparison logic against recorded fixture responses, and say plainly in `result.md` that no live run was made.

## Acceptance

- [ ] Scenario implemented and registered.
- [ ] Unit tests on the classification (agrees/conservative/unsafe) and report formatting, at the coverage `samples/testbed` enforces.
- [ ] A README section on how to run it.
- [ ] Gates: testbed build, lint and test; repo-wide `rebuild`; `change --verify` (testbed may need no change file; confirm).
- [ ] Close-out: as usual.

## Mechanics

As before. Push only to `testbed-wire-probe`. A `web-fetch` sub-agent is allowed; no other sub-agents.
