# agent-tasks-i1b — mutation opt-ins, disabled by default

**Shipped**: 2026-09-29 via [PR #703](https://github.com/ErikFortune/fgv/pull/703) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

Slice two of four in plan § I1. `createTaskTools` gained an optional
`mutations: { writer, environment, enable }`:

- `'tracked'` adds `task_create` and `task_update`.
- `'reassign'` adds `task_reassign`.

Without the option, the factory still builds exactly I1a's `task_query` and `task_inspect`. The
tool set is asserted by name, including in the captured outbound request. Opting in authorizes
nothing: building touches neither the writer nor the environment, and every call is authorized by
the writer's policy when it runs.

The model never names an id. The tool mints the `operationId`, and a new task's id, from the host
environment. Every writer receipt is converted and checked against the request before the model
sees `{ taskId, revision, disposition }`. Nothing in `broker/` or `storage/` changed.

## Files changed

All in `@fgv/ts-agent-tasks` (squash `6344c1ac`, 27 files):

- **`tools/` (new files):** `mutationTools.ts`, `writerAnswers.ts` and `toolSupport.ts`. The last
  holds I1a's failure path, moved so that both tool families share it.
- **`tools/` and types (edited):** `schemas.ts`, `taskTools.ts`, `presentation.ts`, `index.ts` and
  `types/tools.ts`.
- **Tests:** `mutations.test.ts` and `mutationBoundary.test.ts` (new). `factory`, `requestCapture`,
  `reads`, `bounding` and `publicSurface` were extended, along with `toolFixtures.ts`.
- **`perf/mutationMatrix.js`:** rows I1b-1…I1b-24, the re-pointed I1a rows, and the runner fix.
- **Docs:** `CAPABILITIES.md` and `etc/ts-agent-tasks.api.md`.

## Decisions made during execution

- **Revision: the read surface was widened.** `task_inspect` returns `revision`. Two alternatives
  were rejected:
  - *The tool reads, then writes.* This is last-write-wins across the model's
    inspection-to-call window, and nothing would detect a concurrent host change.
  - *Refuse the shape.* That would leave the opt-in unimplemented to avoid a one-field change.

  The cost is one field on I1a's shipped result.
- **`writer === view`, checked at build time.** One binding means the revision the model reads is
  the one the writer checks.
- **A new task's id is minted too.** `createNative` answers a hidden existing id differently from
  an unused one, so a model choosing ids could probe for hidden tasks.
- **Every call mints fresh.** A retry is therefore never a replay, which is why the unknown-outcome
  wording matters.
- **The model sees no `updateIds`, operation id or previous party** (layer-1 P2-1). The receipt's
  `current` party is checked against the tool's own copy of the request.
- **Unknown outcomes are reported as unknown** (layer-1 P2-2 and Copilot round 1). A malformed
  receipt is reported as `commit-indeterminate`. An unclassified mutation failure, or a throw, says
  the change *may or may not* have been applied. An unknown creation names its minted id.
- **Some fields are deliberately not offered:** `attention`, because references are host-owned; `stopPolicy`
  on create, which is I1d's; and `createTaskList`.
- **The `@rushstack/no-new-null` disable** on `ITaskReassignToolArgs` was dispositioned (layer-1
  P2-3) as the repo's established carve-out for JSON `null`.

## Followups

- **Integer ranges are unstated on the wire** (`docs/TECH_DEBT.md` [P3]). The trigger fired here
  and was not acted on. It was re-armed for I1c, declined again by I1c and I1d, and is now an
  open, standalone `ts-json-base` chore.
- **Generated tool names could collide with the fixed names** (`docs/TECH_DEBT.md` [P3]). Resolved
  by `agent-tasks-i1c`, which added the `task_command_` prefix and `fixedTaskToolNames`.
- **Six storage revert rows are stale** (M13, M20, M23, M34, M39, M49; `docs/TECH_DEBT.md` [P3]).
  Filed by this slice, and still open.
- **For I1c:** command receipts belong in `writerAnswers.ts`. Commands go through
  `IBoundTaskWriter.execute`, which I1b does not reach. Taken up by `agent-tasks-i1c`.
- **`createTaskList`:** `result.md` says *"Not offered, no trigger"*. It is listed under "Not here"
  in `libraries/ts-agent-tasks/CAPABILITIES.md`, but has no TECH_DEBT or FUTURE entry.

## Lessons codified during the run

No `.ai/instructions/` file was changed. The squash touched only the `LIBRARY_CAPABILITIES.md`
reflex. One lesson was codified in the tool itself:

- **A matrix row that counts nothing is not a pass.** `classify()` now reports a run with no
  failure count as `UNVERIFIED`, and the runner exits 1. The orchestrator's gating re-run found
  this hole: a `--pkg` copy without its `node_modules` link ran no tests and reported "0 UNVERIFIED
  or 0 red".

Also recorded in `result.md`:

- **A test can defeat its own mutant.** I1b-10 was `0 red` because the test *replaced*
  `request.responsibility` rather than rewriting it in place.
- **A run concurrent with a repo-wide rebuild is not evidence.** One such run was discarded whole.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- Plan: `docs/design/agent-tasks/implementation-plan.md` § I1
- PR: [#703](https://github.com/ErikFortune/fgv/pull/703)
