# async-control-write-gate — one switch every guarded write consults

**Shipped**: 2026-10-26 into `integration/asks` via #761.

Packages: `@fgv/ts-extras` (`async-control` packlet) and `@fgv/ts-agent-tasks` (`broker`, `types`).
Origin: personaility#698 (fgv-ask), slice B-6. It generalises personaility's `IngestionStopSignal`.
Both change files are typed `minor`; the ts-agent-tasks one is `BREAKING:`.

## Summary

- **`AsyncControl.WriteGate`** (`@fgv/ts-extras`) is a cooperative gate a host routes every write
  through.
  - `guard(write)` / `guardDetailed(write)` run the write at once while the gate is open.
  - The write is held while any `pause(timeoutMs)` is held.
  - The write is refused unrun (`'raised'`) while `raise(reason)` is up. Raising also wakes and
    refuses writes that are waiting on a pause.
  - `pause` holds from the moment it is called. It resolves to an idempotent handle once the writes
    under way drain. Otherwise it withdraws itself and fails `'timeout'`, or `'stalled'` when writes
    were waiting on it.
  - Admission is synchronous, and the write is counted before it is called. The slot is released on
    every path.
  - The timer is the injectable `ScheduleTimer`, under the same range rule as `raceStopConditions`
    (now the shared `isTimerDelay`).
  - No Node-only API.
- **ts-agent-tasks.** `ITaskWriteGuard.guard` now answers `PromiseLike<Result<T>>`, so a real
  `WriteGate` is a broker `writeGuard` with no adapter. A not-run refusal keeps its classification
  only when its detail converts as an `ITaskFailure`. A not-run success is `invalid`.
  `TaskScheduleTimer` is gone in favour of `AsyncControl.ScheduleTimer`.

## What a reader should know

- **Reentrancy is a call-site rule, not a refusal.** A guarded write must not `guard` on the same
  gate. While the gate is open, nesting is harmless. Against a pause it deadlocks until the pause's
  timeout, which then fails `'stalled'` and releases the waiters. Telling nesting from concurrency
  needs `AsyncLocalStorage`, which is Node-only. See `state.md`.
- **`'threw'` means the write ran.** Its side effects may have happened.
- **`raise` does not interrupt writes under way.** It decides only whether a write starts.
- **The broker contract widened for implementers' benefit.** Every old gate still fits. The
  cast-based test doubles (`fail(...) as unknown as TaskResult<T>`) lost their casts.

## Artifacts

- `brief.md`: the frozen contract
- `state.md`: decisions (reentrancy, timer consolidation, the contract widening), and the
  lift-condition sweep
- `result.md`: what shipped, the check-then-act table, the revert matrix and the gates
- `meta.yaml`: the index record
