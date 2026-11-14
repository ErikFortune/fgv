# agent-tasks-tracked-commands — `fgv.tracked@1`'s commands registered for command tools

**Shipped**: 2026-10-01 via [PR #705](https://github.com/ErikFortune/fgv/pull/705) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

A fifth I1 slice, run beside `agent-tasks-i1d`. Before it, `fgv.tracked@1` registered no commands,
so `agent-tasks-i1c`'s generator had nothing typed to offer and a model could create and edit a
tracked task but not move its lifecycle. Now `trackedTaskDescriptor()` registers all eleven
transitions — `start`, `wait`, `pause`, `resume`, `succeed`, `fail`, `cancel`, `set-title`,
`set-description`, `set-progress`, `set-attention` — each with a `JsonSchema` parameter schema. A
host offers any of them with `{ kind: trackedTaskKind, detailVersion: 1, command }` in I1c's
`enable` list; no tool code changed. The broker's own converter (`trackedCommand`) stays the
authority on what is accepted.

## Files changed

- `libraries/ts-agent-tasks/src/packlets/converters/builtinKinds.ts` — the eleven schemas in a total
  `Record<TrackedTaskCommandName, ISchemaValidator<unknown>>`, handles via `createTaskCommandHandle`,
  identity encoder, `idempotency: 'none'`, `conditional: false`.
- `types/registry.ts`, `types/commands.ts` — TSDoc only (Copilot rounds 2–3): "the broker runs
  `validate`" and "`encode` produces what is stored" scoped to externally executed kinds;
  `etc/ts-agent-tasks.api.md` unchanged.
- Tests: `converters/trackedCommandSchemas.test.ts` (new — agreement fixtures and wire literals),
  `tools/trackedCommandTools.test.ts` (new — end to end), `converters/kindRegistry.test.ts` (the
  empty-registry test now uses `fgv.task-list@1`).
- `perf/mutationMatrix.js` rows `TC-1…TC-11`; `CAPABILITIES.md`; a plan entry for the slice; change
  file `minor`.
- Not touched: `packlets/tools/`, `fixedTaskToolNames`, `broker/commands.ts`,
  `types/trackedCommands.ts`.

## Decisions made during execution

- **Two validators, agreement as a fixture obligation (option 1).** Unifying `_prepare` onto the
  registered handle could not remove the obligation: the `JsonSchema` subset has no lengths,
  patterns, ranges or cross-field constraints, so the converter would still run behind the schema.
  It would also narrow what the broker accepts for host callers (e.g. a numeric-string amount the
  converter coerces) and make `fgv.task-list@1`'s commands refuse until it registered schemas. A
  disagreement under option 1 is a usability defect, not a safety one.
- **Fixtures are the deliverable:** 71 values — 23 both accept, 28 both refuse, 19 only the schema
  accepts (the bounds the wire cannot state, and an infinite amount), 1 only the converter accepts.
  The schema also admits every canonical form the converter produces.
- **All eleven registered; the host's `enable` list chooses.** No command was judged one that must
  never be tool-reachable.
- **Inert dispatch values.** The first cut registered `source-key` / `conditional: true`; layer 1
  (P2-1) showed those mean a *source's* dedup and precondition and would authorize a blind resend if
  read. Now `'none'` / `false`, pinned by test and matrix row TC-9.
- **Hazards told to hosts:** references in six commands (`wait`, `pause`, `succeed`, `fail`, `cancel`,
  `set-attention`) are accepted on syntax alone and nothing resolves them; `succeed` / `fail` /
  `cancel` assert an absorbing final state, with `succeed` always carrying an outcome.
- **No new check-then-act window** — the slice adds registrations, not a code path.

## Followups

- `docs/TECH_DEBT.md` *`fgv.tracked@1`'s transitions cannot be offered as model tools* — removed.
- `docs/TECH_DEBT.md` [P3] *A command tool tells the model "do not send it again" for a native command
  the broker refused before recording anything* (plus the stale `_send` comment) — routed with
  **Trigger: I1d**; `agent-tasks-i1d` shipped without taking it, so it is open with a passed trigger.
- `docs/TECH_DEBT.md` [P3] *Gemini has not been shown to accept a nested object schema with no
  properties* — open; needs a live run.
- `docs/TECH_DEBT.md` [P3] *`fgv.task-list@1` registers no commands* — open.
- `docs/TECH_DEBT.md` [P4] *An object converter with no fields converts `null` to `{}`* (`ts-utils`) —
  open.

## Lessons codified during the run

No `.ai/instructions/` file was changed. Recorded in `result.md` only: a whole-file prettier 3 run on
`CAPABILITIES.md` reformatted unrelated sections and was reverted — the pre-commit hook's prettier
2.8.8 is the gate (layer-1 P2-2). And registering data on a native kind can falsify a public contract
docstring written for external kinds (Copilot round 2), which no compiler or test sees.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- PR: [#705](https://github.com/ErikFortune/fgv/pull/705)
