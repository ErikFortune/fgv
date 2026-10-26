# Brief: `ai-assist-client-tool-loop` — `runClientToolLoop` and the `async-control` packlet

Orchestrator-owned; frozen at kickoff. Put questions in `state.md`.

**Origin:** personaility#697 (fgv-ask). Long form:
`.ai/notes/fgv-share/ASK-2026-10-23-ai-assist-client-tool-runner.md` on personaility `working`.
The reference implementation is `libraries/personaility/src/packlets/runtime/llm/clientToolLoop.ts`
and its test, at personaility commit `599c50bd`, covering contracts R1–R9.
fgv's own reservation for this follow-up is `docs/design/agent-tasks/deferred.md:137-245`.

**User decisions (2026-10-26):**
- The stop primitive goes in a **new `async-control` packlet in `@fgv/ts-extras`**.
- It uses the existing `AsyncDeferredResult` / `AsyncResult` / `AsyncDetailedResult` types from ts-utils.
- The `'tools'` context on `resolveProviderModel` is **declined**. fgv removed it on purpose; see `model.ts:240-266`.

**Base / PR target:** `integration/asks`.

## Scope

### 1. `@fgv/ts-extras` `async-control` packlet (new)

```ts
type StopDetail = 'aborted' | 'deadline' | 'failed';
interface IStopConditions {
  deadlineMs?: number;
  signal?: AbortSignal;
  schedule?: (fn: () => void, ms: number) => () => void;
}
function raceStopConditions<T>(
  work: (signal: AbortSignal) => Promise<Result<T>>,
  conditions: IStopConditions
): AsyncDetailedResult<T, StopDetail>;
```

- `work` receives a signal that combines the caller's signal with the deadline.
- On a stop, the race does two things: it aborts the work's signal **and** resolves at once with a
  failure whose detail is `'aborted'` or `'deadline'`. Work that ignores its signal cannot hold the
  caller.
- The work's own result passes through unchanged. A work failure has detail `'failed'`. A
  synchronous throw or a rejection is captured, also as `'failed'`.
- Timers and listeners are always cleaned up. An already-aborted signal stops before `work` runs.
- `deadlineMs` must be finite, an integer, and in `0 ≤ ms ≤ 2^31-1`. Anything else is a `'failed'`
  validation failure and is never scheduled (`setTimeout(Infinity)` fires in about 1 ms).
- `schedule` is an injectable timer that defaults to `setTimeout`/`clearTimeout`.
- Export it from both the Node and browser entries; it needs no Node APIs. Verify with the existing
  export-parity test.
- Add the packlet to `.ai/instructions/ACTIVE_DEVELOPMENT.md`'s ts-extras row as an active surface.
- Add a `CAPABILITIES.md` section and a decision shortcut in the `LIBRARY_CAPABILITIES.md` index
  (keep within the router budget).
- Record as TECH_DEBT: converge safer-fetch's internal `DeadlineWatch` onto this primitive. Do
  **not** do that here.

### 2. `executeClientToolTurn` fixes (prerequisites the runner relies on)

- **No dispatch after abort.** Before the gate check and before `tool.execute`, test `signal.aborted`.
  If it is set, emit the normal `client-tool-call-done` / `client-tool-result` pair with an `isError`
  result saying "aborted", and do not run the tool. Today a stopped round can still *start* tools.
  Pin this with a test that goes red on the current code.
- **`durationMs` on `IAiClientToolCallSummary`.** Measure it inside `executeClientToolTurn` around
  dispatch, with an optional `clock?: () => number` param. Make it **required**: the library always
  knows it, and that follows the `toolConflicts` precedent.
  - Type the change file `minor` with a `BREAKING (implementers only):` prefix, for fakes that build
    summaries.
  - Sweep the repo for constructions in `libraries/`, `tools/` and `samples/`, tests included, and
    fix them.

### 3. `runClientToolLoop` (ts-extras ai-assist)

```ts
interface IClientToolLoopParams extends Omit<IExecuteClientToolTurnParams, 'continuationMessages'> {
  maxRounds: number;                     // required, positive integer
  deadlineMs?: number;                   // the whole loop
  clock?: () => number;
  schedule?: IStopConditions['schedule'];
  observer?: {
    round?(r: IClientToolRound): void;
    event?(round: number, e: IAiStreamEvent): void;
  };
}
interface IClientToolRound {
  round: number;
  fullText: string;
  truncated: boolean;
  calls: ReadonlyArray<IAiClientToolCallSummary>;
  providerDurationMs: number;
  usage?: IAiCompletionUsage;
  toolConflicts: …;
}
interface IClientToolLoopOutcome {
  state: 'completed' | 'round-limit' | 'aborted' | 'deadline';
  rounds: ReadonlyArray<IClientToolRound>;
  continuationMessages?: ReadonlyArray<JsonObject>;
}
function runClientToolLoop(
  p: IClientToolLoopParams
): AsyncDetailedResult<IClientToolLoopOutcome, { rounds: ReadonlyArray<IClientToolRound> }>;
```

- **Rounds and continuation.** Each round goes through `raceStopConditions`. The cumulative
  continuation **replaces** the prior one; it is never concatenated (`toolTypes.ts:354-388`).
- **Stop states.** A stop or the cap is an outcome state, not a failure. A failed round is a
  `DetailedResult` failure whose detail carries the completed rounds.
- **Breaking the drain on stop.** On abort or deadline, stop draining the orphaned round's event
  stream and never await its next turn. Document that side effects already in flight may still land.
- **Final tail.** Return the final cumulative `continuationMessages`. A host that resumes after
  `round-limit`, or runs a final no-tools round, must not have to own the continuation contract
  again.
- **Observer.** Its hooks are synchronous and isolated: a throw is caught, logged at warn through an
  optional `logger`, and cannot change the outcome. Pass events through to `observer.event` so a
  streaming UI can use the runner.
- **Truncation.** Report it only (`truncated`); apply no policy.
- **Reuse, don't repeat:**
  - Use `turn.usage`.
  - Rely on `executeClientToolTurn`'s duplicate-name check; don't repeat it.
  - Take an already-resolved `model`; do no model resolution.
  - No injectable `executeClientToolTurn` param. Tests mock `fetch`, as `clientToolTurn.test.ts`
    does.
- **Do not copy from the reference:**
  - the per-round `JSON.stringify` of the cumulative tail;
  - the app-specific log message;
  - the event-correlation duration heuristic (replaced by `durationMs`).

### 4. Adopters and docs

- Port one `samples/testbed` client-tools scenario to the runner, as the second host that
  `deferred.md` asks for.
- Update `deferred.md`'s "Provider compatibility" entry and the ai-assist README / `CAPABILITIES.md`.

## Ordering surface — required evidence

This surface is ordering-sensitive: abort vs dispatch, stop vs settle, timer vs release. In
`result.md`, enumerate every check-then-act window with an `await` inside it and what re-checks after
it. Write a revert matrix: for each ordering guarantee, the test that goes red when the guarantee is
reverted, shown red. At minimum cover:

- abort before dispatch;
- stop during drain;
- deadline vs a round that settles on the same tick;
- listener and timer cleanup on every path;
- the observer throwing;
- `maxRounds` exactly hit.

## Acceptance

- [ ] All of the above, with Result matchers. New behaviour is shown red first.
- [ ] Gates:
  - package build, lint and test at 100%;
  - repo-wide `rush rebuild` and `rush test` (a required field widens implementers);
  - `change --verify --target-branch origin/integration/asks`;
  - prettier 2.8;
  - `verify-capability-docs`.
- [ ] Close out per `finalize-task` into `.ai/tasks/completed/2026-10/ai-assist-client-tool-loop/`,
  with a ledger entry (`#TBD`) and the feed.

## Mechanics

Work in your own worktree. Push only to `ai-assist-client-tool-loop`; open no PR. Commit before the
gates. Run the gates in the foreground, with per-worktree log paths. No sub-agents.
