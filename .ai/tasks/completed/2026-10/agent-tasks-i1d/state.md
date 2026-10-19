# State — `agent-tasks-i1d`

**Status:** complete on PR #706, awaiting merge. Layer 1 found 3 P2s, all fixed. The Copilot loop stopped at 3 rounds on diminishing returns. The final matrix and every gate are recorded in `result.md`.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-i1d/brief.md` — complete |
| branch | `claude/agent-tasks-i1d`, cut off `integration/agent-tasks-v1` at `d1be4d2fa` |
| PR | [#706](https://github.com/ErikFortune/fgv/pull/706) |
| base | `integration/agent-tasks-v1` — **not `release`** |

**This slice closes I1.**

## Decisions taken (argued in `result.md`)

1. **Per operation:** `requestStop` → `task_stop` (opt-in, per `StopMode`); `inspectStop` →
   `task_stop_inspect`; `releaseStop` and `reconcileStop` → **not model-reachable**.
2. **`intentId` is returned** — it is the operation id the tool minted for the request; it grants
   nothing (every call still mints its own id; inspecting needs only root visibility). Target
   command keys and attempts are not returned.
3. **`stop-active` stays `conflict`** in every tool regardless of configuration.
4. **Targets paged** by `after` (a visible target id), page = `budget.context.maxItems`; `counts`
   over all visible targets; `cursor-stale` when `after` is not a visible target now.
5. **`capacity` never reaches the model**; logged as its dimension.

## Done

- `src/packlets/tools/stopTools.ts` (new), `taskTools.ts` (`ITaskStopToolOptions`, `_stops`),
  `schemas.ts`, `commandTools.ts` (`fixedTaskToolNames` + comment), `index.ts`, `types/tools.ts`
  (`ITaskStopToolTarget`, `ITaskStopToolResult`).
- Tests: `stops.test.ts` (real broker, end to end incl. an external child), `stopBoundary.test.ts`
  (scripted writer), additions to `factory.test.ts`, `requestCapture.test.ts`; helper
  `stoppingTools` in `toolFixtures.ts`.
- Change file `agent-tasks-i1d_2026-10-01-18-00.json` (`minor`); CAPABILITIES (package + index);
  plan I1/I1d status.

## Remaining

Nothing in this slice. The PR waits on review and merge into `integration/agent-tasks-v1`. The
family finalizes at cluster close; do **not** run `/finalize-task` here.

## Resume instructions

`brief.md` plus this file is enough to start cold.
