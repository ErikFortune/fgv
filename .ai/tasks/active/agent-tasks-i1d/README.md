# agent-tasks-i1d — opt-in stop tools, closing I1

**Shipped**: 2026-10-01 via [PR #706](https://github.com/ErikFortune/fgv/pull/706) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

Slice I1d, the last of I1's four (`agent-tasks-tracked-commands` ran beside it as a fifth). A host can
now opt a model into T9's cascade stop: `createTaskTools({ …, stops?: { writer, environment, enable:
StopMode[] } })` adds `task_stop` (`requestStop`, `mode` an enum of exactly the enabled modes) and
`task_stop_inspect` (`inspectStop`). Both return `ITaskStopToolResult` — the stop's state, counts of
the visible targets by state, and one page of targets continued by `nextAfter`. A model may
**request** and **read** a stop; it can never **release** one or **drive the pump**. With this slice
I1 is complete.

## Files changed

- `libraries/ts-agent-tasks/src/packlets/tools/stopTools.ts` (new).
- `tools/taskTools.ts` (`ITaskStopToolOptions`, `_stops`), `tools/schemas.ts`,
  `tools/commandTools.ts` (`fixedTaskToolNames` gains `task_stop` / `task_stop_inspect`; the
  `stop-active` comment I1c left pointing here), `tools/toolSupport.ts` (`mintOperationId`, now used
  by the mutation, command and stop tools), `tools/mutationTools.ts`, `tools/index.ts`,
  `types/tools.ts` (`ITaskStopToolTarget`, `ITaskStopToolResult`).
- Tests: `tools/stops.test.ts` (real broker, end to end — a native tree and an external child),
  `tools/stopBoundary.test.ts` (scripted writer), additions to `factory.test.ts` and
  `requestCapture.test.ts`; helper `stoppingTools` in `toolFixtures.ts`.
- `perf/mutationMatrix.js` rows `I1d-1…I1d-21`; package `CAPABILITIES.md` and the
  `LIBRARY_CAPABILITIES.md` index; `etc/ts-agent-tasks.api.md`; change file `minor`.
- Nothing in `broker/`, `storage/` or `converters/` changed.

## Decisions made during execution

- **Per operation.** `inspectStop` → offered, but only beside `task_stop` (the model's only source of
  an intent id). `requestStop` → offered per `StopMode`, so a host can offer the pause without the
  irreversible cancel; it dispatches nothing, and the root must carry a `stopPolicy` the model cannot
  set. `releaseStop` → **not reachable**: it un-freezes targets the model cannot see, and
  `IStopResult` carries no `requestedBy` to confine release to the model's own stops.
  `reconcileStop` → **not reachable**: it is the host's pump, and nothing bounds how many passes a
  model would make in a turn.
- **`stop-active` stays `conflict` in every tool**, whatever the host enables: a latch can come from a
  hidden ancestor's stop, and no tool's answers depend on which other tools are offered (tested by
  comparing the two answers as strings).
- **A command named like a stop** (I1c's routed question) is allowed beside the stop tools; names are
  the host's, and the latch refuses what a stop forbids.
- **The intent id reaches the model.** No tool accepts an operation id as a key; `task_stop_inspect`
  takes it only to read, and requires the root visible. Target command keys and attempts are stripped.
- **Targets are paged** by a visible target id, page size `budget.context.maxItems`; a continuation
  that is not a visible target now fails as `cursor-stale`. `counts` cover the whole stop.
- **Capacity** is logged as its dimension at `warn` and never told.
- **Only `unsupported` is a known outcome** of `task_stop`. Layer 1 (P2-1) found that
  `not-found-or-denied` can follow the commit, so every other failure carries the would-be intent id.
- **Result checks added by Copilot:** a result must be led by its root (round 1), and a
  `satisfied`/`settled` result over unconfirmed or hidden work is refused (round 2).

## Followups

- `docs/TECH_DEBT.md` [P3] *A model can name only the stops it requested: a bound view cannot list a
  task's stops* — new, open.
- `docs/TECH_DEBT.md` *integer ranges on the wire* — fired again (`task_stop`'s `expectedRevision`),
  not taken.
- `docs/TECH_DEBT.md` *generated tool names avoid the fixed names* — annotated with I1d's two names.
- **Recorded nowhere durable:** layer-1 P3 *"A host wanting an inspect-only stop surface must still
  pass a writer. Recorded here, not built."* — it exists only in `result.md`.
- **Not taken, and not mentioned in `result.md`:** `docs/TECH_DEBT.md` [P3] *A command tool tells the
  model "do not send it again" for a native command the broker refused before recording anything*,
  with its stale `_send` comment, was routed with **Trigger: I1d** by `agent-tasks-tracked-commands`.
  I1d shipped without taking it; the entry remains open with a trigger that has now passed.

## Lessons codified during the run

No `.ai/instructions/` file was changed. The stream applied, rather than codified, the cluster's
existing lessons: the capture-before-`await` rule (I1b-10 / I1c-25) was followed from the start, and
I1d-2 is reported as a paired row with its schema half masked, as I1c-2 was.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- PR: [#706](https://github.com/ErikFortune/fgv/pull/706)
