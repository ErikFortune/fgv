# State: `async-control-write-gate`

Worker-owned. The brief is frozen; questions and decisions are recorded here.

## Status

Implementation, tests, docs and close-out complete on `async-control-write-gate`. PR not opened
(per kickoff); the PR number is `#TBD` throughout.

## Decisions

### Reentrancy: call-site rule, with the deadlock detected and classified at the pause

**Decision.** A guarded write must not call `guard` on the same gate. The nesting itself is not
refused; the deadlock it causes against a pause is bounded and classified: the pause times out, is
withdrawn (releasing the waiting writes), and fails with detail `'stalled'` rather than `'timeout'`.

**Why.** Refusing a nested `guard` needs to tell it apart from a concurrent caller's `guard`, which
needs an async context. The only one available is `AsyncLocalStorage`, which is Node-only and
forbidden here (async-control is in the browser entry). The TC39 `AsyncContext` proposal has not
shipped in browsers. Without one, every heuristic is wrong in some case:

- A synchronous "currently invoking a write" flag catches only a nested `guard` made in the write's
  synchronous prefix, before its first `await`. That would refuse some nestings and allow others
  that are structurally identical, which is worse than a clear rule.
- Refusing waiting writes when a pause times out would also refuse innocent concurrent callers that
  happened to queue behind a slow write.

What *is* observable is the deadlock's shape: a pause that cannot drain while writes are waiting on
it. `'stalled'` names exactly that shape and the docs say that a slow write with unrelated callers
queued looks the same. While the gate is open, nesting merely nests, with no deadlock, and a test
pins that.

This is the same constraint `ITaskWriteGuard` documents for a guard that calls back into the broker.

### `TaskScheduleTimer` consolidation: replaced with the import

`TaskScheduleTimer` is removed from `@fgv/ts-agent-tasks`. `TaskBroker.create({ schedule })` and
`BrokerCore` now take `AsyncControl.ScheduleTimer` from `@fgv/ts-extras`. ts-agent-tasks already
depended on ts-extras, and ts-extras does not depend on ts-agent-tasks, so the import adds no cycle.
No alias is left behind (`ACTIVE_DEVELOPMENT.md`: no shims on an active surface). The two types were
structurally identical, so every existing host's timer still fits.

### `ITaskWriteGuard` widened: the answer is `PromiseLike<Result<T>>`

This is a deviation the brief's "structural fit" requirement forced. The old signature,
`guard<T>(write): Promise<TaskResult<T>>`, cannot be met by the brief's `WriteGate.guard`, which
answers an `AsyncResult<T>` over a plain `Result`. `AsyncResult` is a `PromiseLike`, not a
`Promise`, and a plain `Result` is not a `TaskResult`. The broker already handled a plain-`Result`
gate at runtime ("a gate typed over plain Result refuses without task detail"). Every test double
reached that path through `fail(...) as unknown as TaskResult<T>`, which was the type not admitting
what the contract described.

The contract is now `guard<T>(write: () => Promise<TaskResult<T>>): PromiseLike<Result<T>>`.
Implementers can only gain from it: any old gate still fits. The broker's classification of a
section that did not run changed in two places:

- A refusal keeps its classification only when its detail **converts** as an `ITaskFailure` (through
  the broker's own failure converter, not by trusting the shape). Otherwise it is
  `storage-unavailable` / `after-host-action`, as before.
- A gate that answers **success** without running the section is now `invalid`. Previously a
  fabricated `TaskResult` success passed through. With a plain `Result` there is no task result to
  report, and a success that wrote nothing is a lie.

The cast-based test doubles were retyped to the widened contract and their casts removed.

### `pause` answers `AsyncDetailedResult<IWriteGatePause, WriteGatePauseFailure>`

The brief says `AsyncResult<IWriteGatePause>`. `AsyncDetailedResult` extends `AsyncResult`, so the
brief's signature still holds, and the detail (`'timeout' | 'stalled' | 'invalid'`) is how the
deadlock detection is classified at all.

### Other choices

- `WriteGateRefusal = 'raised' | 'threw'`. `'threw'` means the write *ran* and threw or rejected.
  The docs state this so that a caller does not read it as "not written".
- `quiet` means `inFlight === 0`. Writes waiting on a pause are not under way.
- `raise` does not interrupt writes under way. It refuses new ones and wakes and refuses waiting
  ones. Lowering does not resume a pause, and resuming does not lower.
- A pause that has succeeded is never timed out. It holds until it is resumed.
- `create` refuses a `schedule` that is not a function.
- The timer-range rule is now shared: `isTimerDelay` in `stopConditions.ts` is used by both
  `raceStopConditions` and `WriteGate.pause`. It and `defaultSchedule` are module-internal and not
  exported from the packlet barrel.

## Lift-condition sweep

- In the fgv repo there are no markers waiting on a write gate. `grep -rn "WriteGate\|write gate"`
  over `libraries/ tools/ samples/` found only this stream's files and the existing broker docs,
  which now name `AsyncControl.WriteGate`.
- personaility: `IngestionStopSignal` (`libraries/personaility/src/packlets/curate/ingestionStopSignal.ts`
  on `working`) is the local copy this generalises. Adopting it is the consumer's call. The
  personaility#698 issue body lists "a write gate (fgv chooses its home)". The home is
  `@fgv/ts-extras` `AsyncControl.WriteGate`, which goes in the handover rather than in an edit to
  that repo. Two differences from the source matter to that consumer:
  - `quiet(timeoutMs)` became `pause(timeoutMs)`, which returns a handle, together with the
    `quiet` boolean.
  - A guarded write that throws is answered as a failure rather than rethrown.

## Open questions

None blocking.
