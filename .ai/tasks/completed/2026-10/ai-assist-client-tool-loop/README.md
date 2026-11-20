# ai-assist-client-tool-loop: a bounded client-tool runner and the stop primitive under it

**Shipped:** 2026-10-26 into `integration/asks`. PR #755. Package: `@fgv/ts-extras` (plus the
private `@fgv/testbed` sample). Origin: personaility#697 (fgv-ask).

## Summary

A host that ran a client-tool conversation had to write its own loop over
`executeClientToolTurn`: replace (not append) the cumulative continuation, cap the rounds, bound
the whole loop by a deadline, honour a caller abort, and keep a tool that ignores its signal from
holding the caller. The reference application had written exactly that loop. This stream moved it
into fgv, in three layers:

- **`AsyncControl.raceStopConditions`** (new `async-control` packlet) races `Result`-returning work
  against a deadline and a caller signal. A stop aborts the work's signal and settles the race at
  once; the work's own result passes through; timers and listeners are released on every path; an
  out-of-range deadline is refused rather than scheduled.
- **`executeClientToolTurn`** no longer starts a tool once its signal has aborted (checked before
  the gate and again before `execute`), and every `IAiClientToolCallSummary` carries a required
  `durationMs`, measured around dispatch with an injectable `clock`.
- **`AiAssist.runClientToolLoop`** drives the rounds: `completed` / `round-limit` / `aborted` /
  `deadline` outcomes with per-round traces and the final cumulative tail, a failed round as a
  `DetailedResult` failure carrying the completed rounds, and isolated synchronous observer hooks
  for streaming UIs.

The `anthropic-client-tools` testbed scenario now runs through the runner, as the second host
`docs/design/agent-tasks/deferred.md` asked for.

## Evidence

`result.md` holds the check-then-act table (every `await` between a check and its action, and what
re-checks after it) and the revert matrix: twelve ordering guarantees, each reverted and shown red
by a named test. The abort-before-dispatch test was red against the unmodified code.

## Files

- `libraries/ts-extras/src/packlets/async-control/` (new)
- `libraries/ts-extras/src/packlets/ai-assist/clientToolLoop.ts` (new)
- `libraries/ts-extras/src/packlets/ai-assist/streamingAdapters/clientToolContinuationBuilder.ts`,
  `toolTypes.ts`, `index.ts`, `README.md`
- tests under `libraries/ts-extras/src/test/unit/async-control/` and `.../ai-assist/`
  (`clientToolLoop`, `clientToolTurnAbort`, `clientToolSseFixtures`, and the builder test's
  `durationMs` inputs)
- `samples/testbed/src/scenarios/anthropicClientTools/index.ts`
- docs: `deferred.md`, `TECH_DEBT.md`, `ACTIVE_DEVELOPMENT.md`, `LIBRARY_CAPABILITIES.md`,
  `libraries/ts-extras/CAPABILITIES.md`; change file `minor`, `BREAKING (implementers only)`.

## Left open

- Converging safer-fetch's `DeadlineWatch` onto `raceStopConditions` (TECH_DEBT P3).
- The testbed scenario was not run live (it needs an Anthropic key).
- `deferred.md`'s other correctness questions (admission, recovery, scheduling) are untouched.
