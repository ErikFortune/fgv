# agent-tasks-t9 — persistent cascade stop with admission enforcement

**Shipped**: 2026-09-28 via [PR #701](https://github.com/ErikFortune/fgv/pull/701) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

Slice T9 of `docs/design/agent-tasks/implementation-plan.md`, under amendment A2. A cascade pause or
cancel is now an intent that is persisted, partly satisfied and honestly reported. It is not a
transaction. `requestStop` persists the intent on the root with every target `unexamined` and
dispatches nothing. `reconcileStop` is a bounded host pump that confirms each target under current
`stop-target` authority. `releaseStop` and `inspectStop` complete the surface.

The subtree is captured authoritatively: hidden, archived, unresolved, quarantined and external
descendants are included, and a descendant's `stopPolicy` is never consulted. The bound is 1,000
targets, and a larger tree is refused, never truncated. While a stop latches, storage freezes
admission to the subtree on every commit, and the latch book is rebuilt before a reopened repository
accepts a write.

`result.md` § *Every place acceptance is distinguished from completion* lists eleven such points.
Each has the test that a "success with skipped child" implementation would fail.

## Files changed

All in `@fgv/ts-agent-tasks` (squash `9b1af182`, 65 files):

- `types/stop.ts` (new): the § 10 vocabulary. `types/broker.ts`, `types/sourceAdapter.ts`
  (`capabilities?`), `types/storage.ts`, `types/authority.ts` (`stop-target`).
- `broker/stopRequests.ts`, `broker/stopPump.ts` (new), plus stop-aware edits in `commands.ts`,
  `externalCommands.ts`, `catalogOperations.ts`, `catalogMutation.ts`, `creation.ts`,
  `disposition.ts`, `observations.ts`, `boundTaskView.ts` and `core.ts`.
- `storage/stopAdmission.ts`, `stopBook.ts`, `stopLedger.ts`, `stopRules.ts` (new). Also edits to
  `repository.ts`, `openRepository.ts`, `taskIndex.ts`, `deliveryBook.ts` and the other storage
  modules.
- `converters/stopConverters.ts` (new). `implementations/externalSource.ts` takes capabilities as an
  option.
- Thirteen new stop test suites: `stopAcceptance`, `stopCapacity`, `stopCrash`, `stopFaults`,
  `stopFreeze`, `stopPump`, `stopRaces`, `stopRegressions`, `stopRelease`, `stopRequestEdges`,
  `stopSources`, `stopOpen` and `stopRules`. Also `test/helpers/stopFixtures.ts`.
- `perf/mutationMatrix.js`: rows T9-1…T9-66, and a new `paired(...)` form. Also `CAPABILITIES.md`
  and `etc/ts-agent-tasks.api.md`.
- Outside the package: the design doc, the plan's T9 status line, `docs/TECH_DEBT.md`, the ledger
  entry and the `LIBRARY_CAPABILITIES.md` reflex.

## Decisions made during execution

`result.md` argues each of these against design § 10:

- **An array of intents on the root** (`IResolvedTaskCommitRecord.stops?`), not one `stop?`. § 10
  represents overlapping pause and cancel intents independently. At most one intent latches per mode
  per root.
- **Minted, persisted command keys, not tuple-encoded ones.** Two 128-char ids cannot fit the
  128-char operation-id bound. What matters is that a key is the same across restarts, and
  persistence provides that.
- **`capabilities()` names the stop command and its parameters per mode**, not § 5's
  `commands: string[]`. The kind registry is already the command authority (T6), and a stop needs
  parameters that a name cannot supply.
- **The freeze is enforced in storage, under the writer.** The broker's pre-check only produces a
  clear refusal. Revert row T9-32 shows the storage refusal working on its own.
- **Reservations are derived from records, never stored**, and open recomputes them. Structurally,
  acceptance has nothing to dispatch.
- **Stable-stop evidence is revalidated per broker instance.** A satisfied stop that rests on it is
  shown as `pending` after a restart, until this instance's own complete pass persists it.
- **A list as a pause target** is confirmed without a command, because it has no work of its own.

## Followups

- **Explicit abandonment of a blocked cancel** (§ 10 step 8): open in the `docs/TECH_DEBT.md` [P2]
  *stop hand-offs T9 left open* (1). Trigger: the first host that needs to archive such a root.
- **The attempt bundle uses schema maxima**, so 400 plain registrations admit a stop over at most
  210 of them. Open, same entry (2). Trigger: a consumer that needs larger stops.
- **M1 stop-state cohort**: same entry (3), resolved by `agent-tasks-m1-stop` (2026-10-01).
- **T5 (4) and T6 (4) hand-offs**: marked resolved in `docs/TECH_DEBT.md`.
- **Six stale storage revert rows** (M13, M20, M23, M34, M39, M49): `result.md` calls them stale
  before this slice. They are now tracked in the [P3] *six storage rows… no longer apply* entry,
  which `agent-tasks-i1b` filed.
- **Stop tools** were not built here. They were added by `agent-tasks-i1d`.

## Lessons codified during the run

No `.ai/instructions/` file was changed by this PR. Three lessons from its revert matrix were
carried into the I1a brief's *Traps* list:

- A single-mutation matrix cannot see a defence-in-depth pair, so `paired(...)` was added.
- Two capacity tests passed for the wrong reason: the root and the target overflowed together, so
  each check masked the other.
- A protection can be masked by a storage backstop that no test exercises (T9-26).

`result.md` also records T9-24 as an *equivalent mutation*. That is a row whose 0-red verdict is
correct and expected.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- Design: `docs/design/agent-tasks/development-design.md` § 10; plan § T9 and the A2 row
- PR: [#701](https://github.com/ErikFortune/fgv/pull/701)
