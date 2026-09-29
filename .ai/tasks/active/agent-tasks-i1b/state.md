# State — `agent-tasks-i1b`

**Status:** implementing. Source written and compiling; tests next.

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

## Next

Tests (new `mutations.test.ts`; extend `factory.test.ts:43`, `requestCapture.test.ts`), layer-1
review, coverage, matrix rows `I1b-*`, docs (CAPABILITIES, plan status, ledger, TECH_DEBT), change file.
