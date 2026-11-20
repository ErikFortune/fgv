# State: `ai-assist-client-tool-loop`

Worker-owned working surface. The brief is the contract.

## Plan

1. `async-control` packlet: `raceStopConditions`, `IStopConditions`, `StopDetail`, `ScheduleTimer`.
2. `executeClientToolTurn`: abort check before the gate and before `execute`; `durationMs` on every
   summary entry, measured with an optional `clock`.
3. `runClientToolLoop` in ai-assist.
4. Testbed scenario port; docs (deferred.md, README, CAPABILITIES, index, ACTIVE_DEVELOPMENT,
   TECH_DEBT); change files.
5. Gates; close-out.

## Decisions

- **One loop-level race, one per-round race.** The whole loop runs inside one
  `raceStopConditions({ deadlineMs, signal, schedule })`, so the deadline is armed once through
  `schedule` and does not depend on `clock`. Each round runs inside a second
  `raceStopConditions({ signal: loopSignal })`, so the loop body itself stops awaiting an orphaned
  round instead of only the caller being released.
- **`ScheduleTimer` is a named type**, used by both `IStopConditions.schedule` and
  `IClientToolLoopParams.schedule`, instead of the brief's `IStopConditions['schedule']` indexed
  access. Same type; named for readability.
- **`clock` lives on `IExecuteClientToolTurnParams`**, so `IClientToolLoopParams` inherits it and the
  loop's round timing and the turn's `durationMs` read the same clock.
- **`durationMs` spans validation, the gate and `execute`** — from the moment the call's args are
  complete (after its `client-tool-call-done` was yielded) to the moment its result is ready, before
  the `client-tool-result` is yielded. It is measured for every entry, including ones never
  dispatched (unknown tool, invalid args, aborted), where it is the near-zero time spent deciding not
  to dispatch.
- **Failure detail is named `IClientToolLoopFailureDetail`** (`{ rounds }`).

## Open questions

(none yet)

## Progress

- [x] 1  - [x] 2  - [x] 3  - [x] 4  - [x] 5 (gates in `result.md`; migrated to `completed/2026-10/`)

The abort-before-dispatch test was red on the unmodified code (3 of 3); the revert matrix is in
`result.md`.
