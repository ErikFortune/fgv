# State — `agent-tasks-i1b`

**Status:** brief written, not started. Awaiting the I1a landing (#702) before the branch is cut.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-i1b/brief.md` — complete |
| branch | **not yet cut.** `claude/agent-tasks-i1b` off `integration/agent-tasks-v1` at the I1a landing |
| PR | none |
| base | `integration/agent-tasks-v1` — **not `release`** |

## Predecessor

I1a shipped `createTaskTools({ view, renderer?, budget? })` and exactly two read-only tools
(`task_query`, `task_inspect`) in `libraries/ts-agent-tasks/src/packlets/tools/`
(`taskTools.ts` 336, `presentation.ts` 118, `viewAnswers.ts` 87, `schemas.ts` 77, `index.ts` 6) plus
`packlets/types/tools.ts`. Copilot loop stopped at 5 rounds on diminishing returns; revert matrix
31 rows, 53 red tests, 0 UNVERIFIED, run on final source. Full detail in
`.ai/tasks/active/agent-tasks-i1a/result.md`.

## The open decision this slice must take

`ITaskMutationIdentity` requires `expectedRevision`; **I1a's tool surface exposes no revision at
all** (verified: no `revision` in `packlets/tools/` or `types/tools.ts`). Three ways out — widen the
read surface, read-then-write inside the tool, or refuse the shape — are set out in the brief. It is
undecided on purpose; I1b decides it and argues it in `result.md`.

## Resume instructions

`brief.md` plus this file is enough to start cold. Nothing has been implemented; there is no partial
work to recover.
