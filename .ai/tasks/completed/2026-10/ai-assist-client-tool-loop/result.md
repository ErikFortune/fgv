# Result: `ai-assist-client-tool-loop`

**Shipped:** `AiAssist.runClientToolLoop`, a bounded multi-round client-tool runner, on a new
`async-control` packlet (`AsyncControl.raceStopConditions`); `executeClientToolTurn` no longer
starts a tool after its signal aborts, and every call summary carries a required `durationMs`.

Branch `ai-assist-client-tool-loop`, base `integration/asks`. PR #TBD. Package: `@fgv/ts-extras`
(plus the private `@fgv/testbed` sample).

## What changed

### 1. `async-control` packlet (new)

`libraries/ts-extras/src/packlets/async-control/stopConditions.ts`, exported as `AsyncControl` from
both `index.ts` and `index.browser.ts` (the browser export-parity test passes unchanged).

- `raceStopConditions<T>(work, { deadlineMs?, signal?, schedule? }): AsyncDetailedResult<T, StopDetail>`.
- `StopDetail = 'aborted' | 'deadline' | 'failed'`, `IStopConditions`, `ScheduleTimer`,
  `CancelTimer`, `MAX_DEADLINE_MS` (2^31-1).
- A stop aborts the work's signal **and** settles the race at once. The work's own result passes
  through; a failure, a synchronous throw or a rejection is `'failed'`. A pre-aborted signal never
  calls `work` and arms nothing. A `deadlineMs` that is not an integer in `[0, 2^31-1]` is a
  `'failed'` result and is never scheduled. A `schedule` that throws is `'failed'`. A timer that
  fires synchronously from `schedule` stops before `work` starts. Timer and listener are released
  on every path.

### 2. `executeClientToolTurn`

- **No dispatch after abort.** The client-tool-call-done branch was refactored into one
  `dispatchCall` helper (the eight duplicated emit/push sites collapse into one), which checks
  the signal after argument validation and before the gate, and again after the gate's `await`,
  before `execute`. A declined call gets the normal `client-tool-call-done` /
  `client-tool-result` pair with `isError: true` and the result
  `<tool> (callId=<id>): tool not run: the turn was aborted`. All existing messages are unchanged.
- **`durationMs`** is required on `IAiClientToolCallSummary`, measured with a new optional
  `IExecuteClientToolTurnParams.clock` (default `performance.now`). It runs from after the
  call-done event has been handed to the consumer to before the result event is yielded, so it
  covers validation, the gate and `execute`, and never consumer time. Floored at 0.

### 3. `runClientToolLoop`

`libraries/ts-extras/src/packlets/ai-assist/clientToolLoop.ts`. Types: `IClientToolLoopParams`,
`IClientToolRound`, `IClientToolLoopOutcome`, `IClientToolLoopFailureDetail`,
`IClientToolLoopObserver`, `ClientToolLoopState`.

- The whole loop runs under one `raceStopConditions({ deadlineMs, signal, schedule })`; each round
  runs under a second `raceStopConditions({ signal: loopSignal })`. The outer race releases the
  caller; the inner race stops the loop body itself from awaiting an orphaned round.
- Each round drains `events`, forwarding each to `observer.event`, and breaks as soon as the round
  signal has aborted; after a break it returns without awaiting `nextTurn`.
- The cumulative continuation replaces the prior one. The outcome returns the latest tail as
  `continuationMessages`.
- `maxRounds` must be a positive integer, checked before anything is armed. Round failures,
  duplicate tool names and schema pre-flight come from `executeClientToolTurn` as failures, with
  `detail.rounds`.
- Observer hooks run through `captureResult`; a throw is logged at warn through `logger` (when
  given) and ignored.
- Not copied from the reference: the per-round `JSON.stringify` of the tail, the app-specific log
  line, the event-correlation duration heuristic, the injectable `executeClientToolTurn`, the
  loop-level duplicate-name check.

### 4. Adopters and docs

- `samples/testbed/src/scenarios/anthropicClientTools/index.ts` now runs through
  `runClientToolLoop` (`maxRounds: 4`, `deadlineMs: 120000`, an observer for logging). Scenario
  metadata is unchanged, so the scenarios snapshot is unchanged. Not run live (needs a key).
- `docs/design/agent-tasks/deferred.md` "Provider compatibility" rewritten as resolved for the
  runner; the other correctness questions stay open.
- ai-assist `README.md` gains a "Client-tool loops" section; `libraries/ts-extras/CAPABILITIES.md`
  gains an `async-control` packlet row and two shortcuts; the `LIBRARY_CAPABILITIES.md` index
  gains one shortcut and names `async-control` in the package row; `ACTIVE_DEVELOPMENT.md` lists
  `async-control` as active.
- `docs/TECH_DEBT.md` P3: converge safer-fetch's `DeadlineWatch` onto `raceStopConditions` (not
  done here).
- Change file `@fgv/ts-extras`, `minor`, `BREAKING (implementers only):` prefix.

## Red, then green

- **Abort before dispatch.** `src/test/unit/ai-assist/clientToolTurnAbort.test.ts` was written
  first and run against the unmodified `executeClientToolTurn`: **3 failed, 3 total**, each
  receiving `result:ok` where `result:error` was expected (the tool ran on an aborted signal).
  Green after the change.
- **`durationMs`.** The tests did not compile against the old type (no such field): red as a type
  error, green after.
- **`raceStopConditions` / `runClientToolLoop`.** New modules; the tests could not run before
  them. Each ordering guarantee is shown red by reverting it, below.

## Check-then-act windows

Every `await` that sits between a check and the action it guards, and what re-checks after it.

| # | where | check | `await` inside the window | action guarded | re-check after the `await` |
|---|---|---|---|---|---|
| 1 | `dispatchCall` | `signal.aborted` after arg validation | `onBeforeToolExecute(...)` | `tool.execute` | `signal.aborted` again, immediately before `execute` |
| 2 | `dispatchCall` | (none needed before validation: validation is synchronous) | — | the gate | the pre-gate check in row 1 |
| 3 | event generator | the call-done is yielded to the consumer | the consumer's own time before `next()` | timing start | `startedAt` is read after the yield returns, so consumer time is excluded |
| 4 | `_runRound` drain | `roundSignal.aborted` per event | `events.next()` (provider stream, tool dispatch) | forwarding the event to `observer.event`; continuing to drain | checked after **every** `next()` resolves, before the event is forwarded; on abort, break (closes the generator) |
| 5 | `_runRound` tail | `roundSignal.aborted` after the drain | — (synchronous after the loop) | `await nextTurn` | if aborted, return a failure instead; `nextTurn` is never awaited |
| 6 | `run` | — | `await raceStopConditions(round)` | push the round, update the tail, `observer.round`, start the next round | `loopSignal.aborted`, synchronously after the `await`; a stop sets it synchronously before the outer race settles, so no round is recorded or observed after a stop |
| 7 | `raceStopConditions` `stop()` | `settled` / `controller.signal.aborted` | the work's promise | aborting the work signal, settling with a stop | `settled` is set in the first continuation of the work's promise; a stop observed after it is ignored |
| 8 | `raceStopConditions` start | `signal.aborted` on entry | — | calling `work` | after arming the timer, `controller.signal.aborted` is re-checked (a `schedule` that fires synchronously) before `work` is called |
| 9 | `raceStopConditions` cleanup | — | the race | — | `.finally(release)` on the race; `release()` also on the schedule-throws and synchronous-fire early returns |

**Not pinned by a test:** row 5's "never awaits `nextTurn`". The inner race has already settled when
the drain breaks, so awaiting `nextTurn` there would only leave a background promise pending
forever, which no observable surface reports. It is kept because it is the brief's contract and
costs nothing.

## Revert matrix

Each guarantee was reverted by editing the compiled `lib/` JS (equivalent to the source change,
without a rebuild per mutation), the named tests run, and the file restored. Logs (worktree-local, untracked): `.gate-logs/revert-matrix.log`, `-2.log`, `-3.log`.

| guarantee | reverted by | tests red |
|---|---|---|
| G1 abort before the gate | first `isAborted` check → `false` | "a signal aborted before a call is dispatched…", "a signal that aborts during one call stops every later call…" (2) |
| G2 abort re-check after the gate | second `isAborted` check → `false` | "a signal that aborts while the gate decides stops the tool from running" (1) |
| G3 stop during drain | `if (roundSignal.aborted) break` → never | "a stop during the drain stops forwarding events and dispatching tools…" (1) |
| G4 deadline vs a round settling on the same tick | `if (loopSignal.aborted)` in `run` → never | "a deadline that fires N microtasks after a round settles…" at N = 4–10 (7 failed) |
| G5 observer throwing | `captureResult(call)` → a bare call | "a throwing observer cannot change the outcome…", "…with no logger is still isolated" (2) |
| G6 `maxRounds` exactly hit | `round <= maxRounds` → `<` | "maxRounds exactly hit with the model still asking for tools is round-limit…", "…by a completing round is completed" (2) |
| G7 timer and listener cleanup, every path | drop `.finally(release)` | three `raceStopConditions` release tests and all five `runClientToolLoop` cleanup cases: completed, round-limit, failed, aborted, deadline (8 failed) |
| G8 late stop ignored once settled | drop the `settled` guard | "a stop that fires after the settlement was observed is ignored…" (1) |
| G9 pre-aborted signal never runs work | entry `signal.aborted` check → `false` | "an already-aborted signal stops before work runs and arms nothing" (1) |
| G10 continuation replaced, never appended | duplicate the inbound tail in the prepend | "replaces the cumulative continuation each round…" (1) |
| G11 a stop aborts the work signal | drop `controller.abort()` in `stop` | 16 failed, including caller-abort and deadline tests in both suites |
| G12 a stop settles at once | drop `resolveStop(...)` | "the deadline resolves at once with deadline even though the work never settles…" (1) |

## `durationMs` consumer sweep

`grep` for `toolCallsSummary` / `IAiClientToolCallSummary` / `toolName` across `libraries/`,
`tools/`, `samples/`, tests included:

- **Constructions:** `clientToolContinuationBuilder.ts` (the three builders, now copying
  `durationMs` from the internal `IToolCallResult`) and `clientToolContinuationBuilder.test.ts`
  (36 literal inputs and two local loose-type declarations given `durationMs`). No others.
- **Readers only:** `samples/testbed` `anthropicClientTools`, `openaiClientTools`,
  `geminiClientTools`, `xaiClientTools`, `gateDenyClientTools` read summary fields; `ts-extras`
  tests `clientToolTurn`, `clientToolTurnGate` read fields. None needed a change.
- **No hits** in `ts-extras-mcp`, `ts-agent-tasks` (their `toolName` hits are event reads and
  `objectContaining` assertions), or `tools/`.
- **Outside the repo:** the personaility reference test's fake turn builds summaries, so it will
  need `durationMs` when it adopts this version; that is the `BREAKING (implementers only)` case.

## Deviations from the brief

- `IStopConditions['schedule']` became a named `ScheduleTimer` type, used in both places. Same type.
- `clock` lives on `IExecuteClientToolTurnParams`, so `IClientToolLoopParams` inherits it rather
  than redeclaring it; the turn's `durationMs` and the loop's round timing read one clock.
- The failure detail is a named interface, `IClientToolLoopFailureDetail` (`{ rounds }`).
- `MAX_DEADLINE_MS` and `CancelTimer` are exported in addition to the brief's surface.
- The abort check sits after argument validation (before the gate, as the brief says), so a
  call with invalid arguments on an aborted turn reports its validation error, not "aborted".

## Gates

Logs under the worktree's untracked `.gate-logs/`, graded by grep, not exit code.

| gate | result |
|---|---|
| `ts-extras` build + lint + test | build and lint clean; tests `Failures: 0`, coverage 100% on every metric (after one fix: an uncovered default initializer in `stopConditions.ts` became a definite-assignment `let`) |
| `testbed` build, lint, test | clean, `Failures: 0` (one `no-useless-concat` that prettier introduced was fixed) |
| repo-wide `rush rebuild` | `SUCCESS: 39 operations`; 39 `completed` lines; `not met|FAILURE|Operations failed|error TS` = 0; only warning is the Git-tracked symlink notice |
| repo-wide `rush test` | 37 succeeded, 1 no-op, 1 failure: `@fgv/ts-res-cli` "test consistent output by building same input twice", the known load-sensitive test. Re-run alone: `Failures: 0`. No other failure; `not met|error TS` = 0; no warnings beyond the symlink notice |
| `rush change --verify --target-branch origin/integration/asks` | passes; one change file, `@fgv/ts-extras` `minor` |
| prettier 2.8.8 `--check` on every changed `.ts` / `.json` / `.md` | all formatted |
| `generate-capability-feed` then `--check` | 2 targets updated, then 0 stale |
| `verify-capability-docs` | router 23,229/24,000 chars, 107 shortcuts (longest 225/240), 0 failed |
