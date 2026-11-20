# Brief: `async-control-write-gate` — `WriteGate` in ts-extras async-control

Orchestrator-owned; frozen at kickoff. Put questions in `state.md`.

**Origin:** personaility#698 slice B-6 (fgv-ask). The long form is `.ai/notes/fgv-share/ASK-2026-10-23-agent-tasks-host-helpers.md` on personaility `working`. The source being generalised is `libraries/personaility/src/packlets/curate/ingestionStopSignal.ts` (personaility `origin/working`, read-only).

**User decision 2026-10-26:** it lives in the ts-extras `async-control` packlet, which `ai-assist-client-tool-loop` (#697) created, and uses the ts-utils `AsyncDeferredResult` / `AsyncResult` / `AsyncDetailedResult` types.

**Base / PR target:** `integration/asks`. It contains #697 (#755) and `agent-tasks-host-helpers` (#758).

## API

```ts
class WriteGate {
  static create(options?: { schedule?: ScheduleTimer }): Result<WriteGate>;
  guard<T>(write: AsyncDeferredResult<T>): AsyncResult<T>;
  guardDetailed<T, TD>(write: () => Promise<DetailedResult<T, TD>>): AsyncDetailedResult<T, TD | WriteGateRefusal>;
  raise(reason: string): void;   // closed: new writes fail now; writes waiting on a pause are woken and fail
  lower(): void;
  check(): Result<true>;
  pause(timeoutMs: number): AsyncResult<IWriteGatePause>; // holds new writes; resolves when in-flight writes drain; fails at timeout; nestable
  readonly inFlight: number;
  readonly waiting: number;
  readonly quiet: boolean;
}
interface IWriteGatePause { resume(): void }   // idempotent
```

- **States.**
  - **Open:** writes run.
  - **Paused:** a pause count above 0. New writes wait, and `pause()` resolves once `inFlight` reaches 0.
  - **Raised:** everything fails at once with a classified refusal, including writes that are waiting.
- **Reentrancy.** A `guard` called from inside a guarded write must not deadlock against a pause.
  - Detect it and refuse it with a classified refusal.
  - Use a per-gate async context if one is available without Node-only APIs. Otherwise document a call-site rule (no guard inside guard) and detect the deadlock case: a pause that waits on a write which is itself waiting.
  - Record the choice in `state.md`. `async-control` is exported from the browser entry, so nothing Node-only.
- **Timers.** Injectable `schedule` (the `ScheduleTimer` that #697 added), validated with the same rules as `raceStopConditions`.
- **Release.** A write's `inFlight` slot is always released: on success, failure, throw and rejection.
- **Structural fit.** It satisfies ts-agent-tasks' structural `writeGuard` type (`TaskBroker.create({ writeGuard })`). Add a ts-agent-tasks test that wires a real `WriteGate` into a broker, and a `pause()` that holds broker writes.
- **Consolidate the timer types.** ts-agent-tasks declared `TaskScheduleTimer` as a structural copy because #697 had not landed. Either keep it and document it as structurally identical, or replace it with an import from ts-extras (ts-agent-tasks already depends on ts-extras). Prefer the import if it adds no cycle.

## Facts from `agent-tasks-host-helpers` (#758): the contract you must fit

Read `ITaskWriteGuard` and `BrokerCore._guarded` in `libraries/ts-agent-tasks/src/packlets/broker/` and `types/broker.ts`. That review settled these points:

- The broker's guard receives the section. It **must start the section before its own promise settles**; a section started after that is refused `invalid` and not run. It runs the section at most once.
- If the section ran and then the guard failed or threw, the outcome is `reconcile-first`. If the guard refused without running it, the outcome is "nothing written".
- **A guard must not call back into the broker.** That deadlocks, and it is documented rather than detected. The reason is that `gated` cannot tell a re-entrant call from a concurrent one without `AsyncLocalStorage`, which is Node-only, and ts-agent-tasks and async-control both run in the browser. Expect the same constraint for `WriteGate` reentrancy. Do not use `AsyncLocalStorage`.
- `whenIdle` observes sections, not operations. The documented way to quiesce is: pause the guard, then `whenIdle`.

`WriteGate.guard` used as the broker's `writeGuard` must satisfy all of the above. A paused gate awaits before calling `write`. That is fine, because the call still happens before the guard's promise settles. Pin each point with a test against a real broker.

## Required evidence

This is an ordering surface. In `result.md`, enumerate the check-then-act windows: `check` vs. enqueue, pause vs. a write starting on the same tick, raise vs. waiting writes, resume vs. timeout, and release on every path. Include a revert matrix with each row shown red.

## Acceptance

- [ ] Tests with fake timers or the injected schedule, using Result matchers, red first.
- [ ] Gates:
  - package build/lint/test at 100% for ts-extras and ts-agent-tasks;
  - repo-wide `rush rebuild` and `rush test`;
  - `change --verify --target-branch origin/integration/asks`;
  - prettier 2.8 (no `--write` on markdown);
  - `verify-capability-docs`.
- [ ] `CAPABILITIES.md` and an index shortcut. Change file `minor`.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-10/async-control-write-gate/`, with a ledger entry (`#TBD`) and the feed.

## Mechanics

Work in your own worktree. Push only to `async-control-write-gate`; open no PR. Commit before gating. Run gates in the foreground with per-worktree log paths. No sub-agents.
