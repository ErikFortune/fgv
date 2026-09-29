# State — `agent-tasks-i1b`

**Status:** implemented; layer 1 done (no P1, 3 P2 resolved); package gates green (2,113+ tests, 100 %, lint clean, 0 `c8 ignore`); matrix and repo-wide rebuild/test running; PR not yet opened.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-i1b/brief.md` — complete |
| branch | `claude/agent-tasks-i1b` off `integration/agent-tasks-v1` at I1a (`96ebc0d1`) |
| PR | none yet — target `integration/agent-tasks-v1` |

## Decisions taken (argued in full in `result.md` when written)

1. **Revision: widen the read surface (option 1).** `task_inspect`'s resolved result gains
   `revision` (the projected envelope's). Mutation tools take it back as `expectedRevision`; the
   writer's own precondition (checked before and inside the serialized writer) refuses a stale one.
   The tool reads nothing before writing.
2. **Opt-in shape:** `createTaskTools({ view, …, mutations?: { writer, environment, enable } })`.
   `writer` must be `=== view` (one binding: the revision read is the revision checked). `enable` is
   `ReadonlyArray<'tracked' | 'reassign'>`. Absent/empty → exactly `task_query`, `task_inspect`.
   Build touches neither writer nor environment.
3. **Tools:** `tracked` → `task_create` (createTracked), `task_update` (updateTracked);
   `reassign` → `task_reassign`. No `createTaskList`, no `attention` in the patch (host-owned
   references), no `stopPolicy` on create.
4. **Ids:** the tool mints every `operationId` **and the new task's `taskId`** via
   `environment.newOperationId()` / `newTaskId()`; a model-chosen task id colliding with a hidden
   task would disclose it. Schemas are closed, so a model-supplied `operationId`/`taskId` fails.
5. **Writer answers** converted by `writerAnswers.ts`: strict, `updateIds` bounded by
   `allUpdateCategories.length`, receipt must match the requested task and operation, and a
   reassignment's `current` must be the party asked for. Model sees `{taskId, revision,
   disposition}` (+ `previous`/`current`), never `updateIds` (would disclose subscriptions) nor the
   operation id.
6. **Failure path** moved to `tools/toolSupport.ts` (`argumentMessage`, `askView`, `convertAnswer`,
   `hostFailure`); I1a's matrix rows must be re-pointed there (`--check`).
   `not-found-or-denied` and `conflict` descriptions reworded to cover mutation refusals.
7. **Namespace:** fixed names `task_query|inspect|create|update|reassign`; I1c must not generate
   any of them — route to I1c in TECH_DEBT.

## Done

Tests (`mutations.test.ts`, `mutationBoundary.test.ts`, factory/requestCapture/reads/publicSurface
extended); layer 1 (see result.md); matrix rows `I1b-1…22` added, I1a rows re-pointed to
`toolSupport.ts`; CAPABILITIES + router shortcut; change file (`minor`, verified); plan status and
ledger entry (PR number placeholder `PRNUM` — replace once the PR exists); TECH_DEBT routing.

Layer-1 changes after the decisions above: the model no longer sees `previous`/`current`
(`ITaskReassignToolResult` removed); malformed writer receipts → `commit-indeterminate`; writer
throw → "may or may not have been applied"; receipt revision tied to the request.

## Next

1. Matrix results → result.md (run: `node perf/mutationMatrix.js --pkg <git-archive copy> I1b-1..22`
   plus re-pointed `I1a-8,9,10,11,19,22,31`). Re-run any row that ran during the repo-wide rebuild if
   its verdict looks off.
2. Repo-wide rebuild + test → result.md gates; other gates (`verify-*`, feed check).
3. Push, open PR into `integration/agent-tasks-v1`, replace `PRNUM`, request Copilot, drive loop.
