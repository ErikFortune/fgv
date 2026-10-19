# agent-tasks-t5 — bound authority, tracked hierarchy and reassignment

**Shipped**: 2026-09-24 via [PR #691](https://github.com/ErikFortune/fgv/pull/691) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

Slice T5 of the agent-tasks plan put a principal-bound broker over T4's indexed repository.
`TaskBroker.bind` returns a writer and `bindView` returns a read-only view: a separate object with
no mutation method. Both emit projected data only. Every mutation captures the policy epoch before
its first policy question, re-reads every record it authorized inside one serialized writer
section, and rechecks the epoch after the section's last `await`, immediately before the durable
write. The slice also shipped:

- the `fgv.tracked@1` transition table (7 statuses × 11 commands)
- task lists completed from their complete authoritative child set, either explicitly or by a host
  pump over a candidate index that open and `rebuildIndexes()` rebuild
- hierarchy integrity, including a cycle check inside the writer and tombstones that anchor their
  children
- reassignment that changes responsibility only

T5 added no capacity reservation, so the default ceiling stays 146. It revised no T1 member and
changed no persisted shape.

## Files changed

All in `libraries/ts-agent-tasks` (`@fgv/ts-agent-tasks`):

- **New `broker` packlet:**
  - `taskBroker.ts`, `core.ts`, `access.ts` (`AccessContext`)
  - `boundTaskView.ts`, `reads.ts`, `projection.ts`
  - `catalogMutation.ts`, `catalogOperations.ts`, `commands.ts`, `creation.ts`
  - `listCompletion.ts`, `writerQueue.ts`, `viewCursors.ts`, `failures.ts`
- **New `implementations` packlet:** `trackedTransitions.ts`, `listPolicy.ts`, `updatePlan.ts`,
  `envelopeFields.ts`.
- **Types and converters:** `types/{authority,broker,trackedCommands}.ts` and
  `converters/brokerConverters.ts`.
- **Storage:**
  - `childStates` and `listCompletionCandidates` on the repository
  - the candidate index in `taskIndex.ts`
  - two conformance checks
- **Tests:**
  - `broker/{authority,capacity,commands,crash,faults,hierarchy,lists,reassignment,smoke,updates}.test.ts`
  - `implementations/trackedTransitions.test.ts`
  - the `brokerCrashScenarios.ts` real-process crash helper
- **Docs and release files:** `CAPABILITIES.md`, `README.md`, `etc/ts-agent-tasks.api.md`, and the
  change file.
- **Repo-level files:**
  - `docs/TECH_DEBT.md` (the T5 hand-off entry)
  - `.ai/instructions/CODING_STANDARDS.md` (see Lessons)
  - the plan's T5 status line
  - T1's declared-vs-exercised table

## Decisions made during execution

- **Authorization shape: checks at every boundary, re-verified in the writer, plus a view that
  cannot emit unprojected data.** T5 did not build a sanitizing wrapper. The authorization facts
  (the epoch and the authorized revisions) are data the operation carries into the writer and
  re-proves there.
- **No leaks through the edges.**
  - A hidden task and a foreign id return the same code and message on all eight entry points.
  - Pages drop denied candidates and count nothing.
  - Pages omit `generation`.
  - Repository `issues` collapse to one generic line.
  - Cursors are bound to the view and the policy epoch.
- **What the structure does not guarantee.** Removing outcome artifact references is
  `defaultTaskProjector`'s job alone. `registerExternal` is the one unbound operation, trusted
  host registration by design.
- **Updates owed to no one are not retained.** With no subscriptions until T7, T5 writes no update
  payloads in production, and the `TaskAudienceResolver` seam is internal.
- **Deviations from the design sketches, all recorded:**
  - `ITaskAccessRequest.task` is an `ITaskSummary` and carries a `role`.
  - `null` is gone from requests.
  - `changeScopes` takes `{ add?, remove? }`.
  - The reassignment result carries `updateIds`.
  - The page type has no `generation`.
- **Decided, not revised:** `TrackedCommand` parameter shapes. `idempotency-conflict` is the
  rejected receipt for a reused command key. `TaskListCompletion` has no sub-modes. The
  update-category mapping is fixed.
- **The Copilot loop reshaped the ordering guarantees.** Over seven rounds:
  - the epoch capture moved before the first policy question (round 1)
  - authority is decided before any action-specific admission (round 1)
  - every replay ends in an in-writer confirmation, and a same-key commit found inside the writer
    restarts the operation (round 2)
  - replays of a move authorize the parent named in the request (round 3)
  - the pump key is the first free slot in its sequence (round 3)
  - the policy and projectors receive clones (round 3)
  - the in-writer epoch check sits after the last `await` (round 4)
  - the pump's continuation is an opaque view-bound `PageCursor`, a breaking change on the public
    types (round 5)
  - queries are fenced by generation (round 5)
  - `inspect` is fenced by a closing re-read (round 6)
  - `_create` was removed from the public surface (round 7)
- **Stated limit:** a move's previous parent is not re-authorized on replay. The request does not
  name it, the record no longer holds it, and the receipt says nothing about it.

## Followups

Each item in result.md § *What a later slice must decide* was routed to `docs/TECH_DEBT.md` in this
PR, under the "broker hand-offs T5 left for T6/T7/T8" entry. That entry now marks all four as
resolved:

- T7: subscription matching with acknowledgement evidence reserved first.
- T8: archive eligibility from acknowledgement and disposition evidence.
- T6: external command dispatch.
- T9: stop-latch checks.

The executor-payload dereference question did not reach T5. It was decided "no" on 2026-09-24,
before T6. Nothing from T5 is recorded nowhere.

## Lessons codified during the run

- **`.ai/instructions/CODING_STANDARDS.md` § "Authorization boundaries are the same blind spot, and
  the loop runs longer"** was added in this PR. It was codified from this run: layer 1 found no P1,
  the Copilot loop then ran seven rounds, and rounds 1–6 each found a real disclosure, ordering or
  integrity defect. Every one of those was a check in the wrong place rather than a missing check.
  The section asks implementers on such surfaces to enumerate every check-then-act window at layer
  1. T6's brief applied that request.
- From result.md's round-1 note, the layer-1 P2 #1 and Copilot's round-1 medium were "one defect
  class found twice": a refusal that discloses state before authority has been decided.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- PR: [#691](https://github.com/ErikFortune/fgv/pull/691)
