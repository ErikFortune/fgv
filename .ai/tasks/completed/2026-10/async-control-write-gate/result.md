# Result: `async-control-write-gate`

**Shipped:** `@fgv/ts-extras` `AsyncControl.WriteGate` is a host-wide write switch. `raise` refuses every guarded write unrun, waiting ones included, and `pause` holds new writes until the ones under way drain, bounded and nestable. `@fgv/ts-agent-tasks`' broker `writeGuard` takes it with no adapter.

Origin: personaility#698 (fgv-ask), slice B-6, generalising personaility's `IngestionStopSignal`
(`libraries/personaility/src/packlets/curate/ingestionStopSignal.ts` on `working`, blob `a37f1a76`).
Both change files are typed `minor`; the ts-agent-tasks one is `BREAKING:`.

## What changed

### `@fgv/ts-extras` — `async-control`

- **`WriteGate`** (`writeGate.ts`):
  - **`create({ schedule? })`** returns `Result<WriteGate>` and refuses a `schedule` that is not a
    function.
  - **`guard(write: AsyncDeferredResult<T>): AsyncResult<T>`** and
    **`guardDetailed(write): AsyncDetailedResult<T, TD | WriteGateRefusal>`**.
  - **`raise(reason)` / `lower()` / `check()`**.
  - **`pause(timeoutMs)`** returns
    `AsyncDetailedResult<IWriteGatePause, WriteGatePauseFailure>`. That is an `AsyncResult`, so the
    brief's signature holds; the detail is what classifies `'timeout'`, `'stalled'` and `'invalid'`.
  - **`inFlight` / `waiting` / `quiet`**.
- **`WriteGateRefusal = 'raised' | 'threw'`.** `'raised'` means the write was not run. `'threw'`
  means it ran and threw or rejected.
- **`WriteGatePauseFailure = 'timeout' | 'stalled' | 'invalid'`**, plus **`IWriteGatePause`**
  (`resume()`, idempotent) and **`IWriteGateOptions`**.
- **`isTimerDelay`** is the range rule (`0 ≤ ms ≤ MAX_DEADLINE_MS`, integer), now shared by
  `raceStopConditions` and `pause`. It and `defaultSchedule` are module-internal and not in the
  barrel.
- Exported from both the Node and the browser entry through the existing `AsyncControl` namespace.
  No Node-only API is used: no `AsyncLocalStorage`, no `process`, no `node:*`.

### `@fgv/ts-agent-tasks` — broker

- **`ITaskWriteGuard.guard<T>(write): PromiseLike<Result<T>>`** (was `Promise<TaskResult<T>>`).
  The old type could not be met by `WriteGate.guard`. The broker already handled a plain-`Result`
  gate at runtime, and every test double reached that path through a cast. See `state.md` for the
  reasoning.
- **`_guarded`** (`broker/core.ts`), for a section the guard did not run:
  - A refusal keeps its classification only when its detail converts through the broker's own
    `failures.failure` converter.
  - Any other refusal is `storage-unavailable` / `after-host-action`.
  - **A success is `invalid`.** Before this change, a gate's fabricated success passed through. The
    revert matrix (row R14) shows that this sends the broker into a hang the suite never returns
    from, so the new classification also removes a latent non-termination.
- **`TaskScheduleTimer` removed.** `TaskBroker.create({ schedule })` and `BrokerCore` take
  `AsyncControl.ScheduleTimer`. No cycle: ts-extras does not depend on ts-agent-tasks.
- The test doubles were retyped to the widened contract, and their
  `fail(...) as unknown as TaskResult<T>` casts were removed.

### Tests

- `libraries/ts-extras/src/test/unit/async-control/writeGate.test.ts`: 33 tests. Every timed path
  uses an injected manual timer except one, which covers the default `setTimeout` schedule with a
  1 ms timeout.
- `libraries/ts-agent-tasks/src/test/unit/broker/writeGate.test.ts`: 6 tests wiring a **real**
  `WriteGate` into a `TaskBroker`.
  - Open pass-through.
  - The section's own classified failure passes through unchanged, not as `reconcile-first`.
  - Raised refuses unrun, then lowering reopens.
  - A pause holds broker writes. `whenIdle` is busy while a write is held at the gate. Resuming
    runs the section inside its turn, not refused as started late.
  - Raising while a broker write waits on a pause refuses it unrun.
  - The quiesce recipe: pause, then `whenIdle`, both resolving once the section already past the
    gate finishes.
- `idleAndGuard.test.ts`: 2 new tests, one for a not-run success and one for a not-run refusal
  whose detail is not a task failure.

## Check-then-act windows

Each row names a window between a check and the act it licenses, what closes it, and the test that
pins it.

| # | Window | What closes it | Pinned by |
|---|---|---|---|
| 1 | **`check()` vs. enqueue.** `check` succeeds, then the gate is raised before the caller's `guard`. | Nothing does, and nothing needs to: `check` is documented as a moment, not a reservation. `guard` re-decides synchronously at call time, so the write is refused. | `raise and lower › refuses a new write without running it` |
| 2 | **Admission vs. `write` start.** A pause or raise lands between "decided to run" and "counted". | Both happen in one synchronous step inside `guard`. `inFlight += 1` happens before `write()` is called, inside the same synchronous `Promise` executor. | `runs the write at once, counts it while it runs` (R1) |
| 3 | **`pause()` vs. a write starting on the same tick, `guard` first.** | The write was counted synchronously, so `pause` sees `inFlight > 0` and waits for it. | `a write asked in the same tick before pause() is counted, and the pause waits for it` (R1) |
| 4 | **`pause()` vs. a write starting on the same tick, `pause` first.** | `_pauses += 1` happens synchronously at the call, not when the pause resolves, so the write is held. | `holds writes from the moment it is called, before it resolves` (R7) |
| 5 | **Wake vs. the woken write's turn.** `resume` wakes the waiters, then a new `pause` comes before their continuations run. | A woken write re-enters `_run` and decides again. It is not pre-admitted. | `a woken write decides again` (R3) |
| 6 | **`raise` vs. waiting writes.** | `raise` wakes every waiter synchronously. Each re-decides, sees the reason, and refuses unrun. | `wakes every write waiting on a pause and refuses it, unrun` (R2, R3) |
| 7 | **`raise` vs. a raised check that only runs on wake.** | The raised check runs first in `_run` for every new write, not only for woken ones. | `refuses a new write without running it` (R6) |
| 8 | **Resume vs. timeout.** The drain timer fires after the pause already reached quiet and the cancel could not take effect. | A single `settled` flag: the first of `onQuiet` / `onTimeout` wins. A late timer neither fails nor withdraws a held pause. | `a timer that fires after the pause reached quiet is ignored` (R9) |
| 9 | **Timeout vs. classification.** | `'stalled'` vs. `'timeout'` is read from `waiting` **before** the withdrawal wakes the waiters. | `detects the reentrant deadlock … 'stalled'` (R10) |
| 10 | **Timeout vs. withdrawal.** | A timed-out pause withdraws itself: it leaves the drain list and its handle resumes, so waiting writes go ahead. | `fails 'timeout' … and withdraws itself`, `schedule that throws …` (R8) |
| 11 | **Synchronous-firing or throwing `schedule`.** | A timer that fires inside `schedule` settles the pause first. A throw after that is a no-op second settlement, because the withdrawal is idempotent. A throw alone is `'invalid'` plus a withdrawal. | the three `schedule …` tests |
| 12 | **Host `cancel` throws inside a write's release.** | `onQuiet` runs from `_release`, and the cancel is `captureResult`-wrapped, so it never escapes into the write's settlement. | `a cancel that throws neither fails the pause nor escapes` (R12) |
| 13 | **Release on every path.** Success, failure, synchronous throw, rejection. | The write runs inside a `Promise` executor, so a synchronous throw becomes a rejection. `.catch` answers it, and `.finally` releases before the guard's own result settles. | `answers a synchronous throw …`, `answers a rejection …` (R4, R5) |
| 14 | **`resume` vs. `resume`.** | A per-handle `held` flag, so a second `resume` can never end another pause. | `nests … resume is idempotent` (R11) |
| 15 | **Broker: guard answer settles vs. section start.** | A paused `WriteGate` awaits **before** calling the section, but calls it before its own answer settles. The broker sets `seen.closed` only after that answer, so the section runs. | broker `a pause holds broker writes … resuming runs it inside its turn` |
| 16 | **Broker: identity of the section's result.** | `guard` passes the write's result object through unchanged, so `outcome.value === written` and the section's own classification survives. | broker `the section's own classified failure passes through the gate unchanged` (R13) |

**Not closed, by design.** A guarded write calling `guard` on the same gate deadlocks against a pause
until the pause's timeout (state.md, *Reentrancy*). It is bounded and classified `'stalled'`; it is
not refused.

## Revert matrix

Each row applies one mutation to the shipped source, runs that package's filtered suite
(`rushx test --test-path-pattern …`), and restores the source. Every row went red. All runs had
0 TypeScript errors and 0 lint errors, so each red is a behavioural failure, not a broken build.
The script and its raw JSONL output were run from the session scratchpad.

| Row | Mutation | Red (failed tests) |
|---|---|---|
| R1 | Count `inFlight` and call `write` a microtask later (admission not synchronous) | 19, incl. `runs the write at once, counts it…`, `a write asked in the same tick before pause() is counted…` |
| R2 | `raise` does not wake waiting writes | 1: `wakes every write waiting on a pause and refuses it…` |
| R3 | A woken write runs without deciding again | 2: `a woken write decides again…`, `wakes every write waiting… refuses it` |
| R4 | Slot released only on resolution, not on throw or rejection | 2: `answers a rejection…releases the slot`, `answers a synchronous throw…releases the slot` |
| R5 | `write()` called outside the executor (a synchronous throw escapes) | 1: `answers a synchronous throw as a failure…` |
| R6 | Raised check applied only while paused | 2: `refuses a new write without running it…`, `details a refusal 'raised'…` |
| R7 | Pause counted only once it resolves | 2: `holds writes from the moment it is called…`, `detects the reentrant deadlock…` |
| R8 | A timed-out pause is not withdrawn | 6, incl. `fails 'timeout'…withdraws itself`, `schedule that throws…`, `the default schedule…` |
| R9 | A late timer acts after quiet | 1: `a timer that fires after the pause reached quiet is ignored…` |
| R10 | `'stalled'` read after the withdrawal wakes the waiters | 1: `detects the reentrant deadlock…'stalled'` |
| R11 | `resume` not idempotent | 1: `nests…resume is idempotent` |
| R12 | Host `cancel` called unguarded | 1: `a cancel that throws neither fails the pause nor escapes…` |
| R13 | `guard` re-wraps the write's result (no identity) | ts-extras 1: `passes the write's own failure through unchanged`; ts-agent-tasks 1: `the section's own classified failure passes through the gate unchanged…` |
| R14 | Broker passes a not-run success through, as before this stream | `idleAndGuard` **never completes**: killed at 300 s, and an earlier run at 900 s. The fabricated success leaves the operation non-terminating, which is the latent defect the `invalid` classification removes. |
| R15 | Broker drops a not-run refusal's classification | 1: `a guard that refuses with a classified failure…keeps its classification` |
| R16 | Broker trusts any detail without the converter | 1: `a guard that refuses with a detail that is not a task failure is storage-unavailable` |

R14 is red by non-termination rather than by an assertion, so it is the one row whose red is not a
named test failure.

## Gates

These ran on the tree combined with `origin/integration/asks` @ `da35380ee`, which by then included
#759 and the #760 promotion. They ran in the foreground from the repo root, with per-worktree logs in
`.gate-logs/`. Each was graded by exit code and by
`grep -acE 'not met|Operations failed|error TS|Jest tests? failed'`, which must be 0, and by
`grep -aiE warning`, which must show only the tracked-symlink notice.

| Gate | Exit | Error grep | Warning grep |
|---|---|---|---|
| `rush install` | 0 | — | — |
| `rush change --verify --target-branch origin/integration/asks` | 0 | — | — (both change files found) |
| `rush rebuild` | 0 | 0 | symlink notice only; `SUCCESS: 39 operations`, 39 `completed successfully` |
| `rush test` | 0 | 0 | symlink notice only; `SUCCESS: 38 operations`, 38 `completed successfully`; no NUL padding |
| ts-extras `rushx build` / `lint` / `test` | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0; coverage 100/100/100/100 |
| ts-agent-tasks `rushx build` / `lint` / `test` | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0; coverage 100/100/100/100 |
| prettier 2.8.8 `--check` on every touched file | 0 | — | — (three TS files reformatted before the docs commit; no `--write` on markdown) |
| `generate-capability-feed.mjs` then `--check` | 0 / 0 | — | 0 stale |
| `verify-capability-docs.mjs` | 0 | — | router 23,730/24,000 chars, 0 failed |

None of the known load-sensitive tests failed, so no package re-run was needed.

## Review round 1

Review of `53d1d2f8a` found no P1. The `WriteGate` state machine held under a 3000-operation stress
run, and #758's guard contract had not regressed. The fixes are in `40e71570e`.

### The R14 finding is a production defect on `release`

The reviewer confirmed what revert row R14 showed. **On `release`, a write guard that answers
success without running the section makes `createNative` recurse forever.** The section's
"nothing to report" (`ok(undefined)`) reads as "went live under it, run again". The retried attempt's
own bound sits inside `_createOnce`, which the fabricated answer never reaches. The recursion is
pure microtasks, so it hangs the whole process; no timer, watchdog or test timeout can interrupt it.

This branch fixes it in two places:

- `_guarded` classifies a not-run success as `invalid`. That has been in since `599a8563f`.
- **Defence in depth (round 1).** `createNative` and `registerExternal` now check the bound
  themselves. A retried attempt that again finds nothing answers `invalid` / `after-host-action`
  ("creation retried and still found nothing to report", and the same for registration) instead of
  recursing.

The reviewer's probe (`r14.js`) now settles in 1–2 ms with one guard call, in both its `undefined`
and its value variant.

### Changes

| Item | Change |
|---|---|
| R14 defence in depth | The bound described above, in `createNative` and `registerExternal`. A test stands in for a regressed `_guarded` (a `BrokerCore.prototype.gated` spy answering "nothing to report"). The spy breaks the loop after 10 calls, so a missing bound is a red assertion rather than a hang. A test timeout cannot interrupt a microtask loop, which is why the test does not rely on one. The fabricating-guard test bounds itself the same way. |
| **P2-1:** a section that ran and then rejected read as "nothing was written" | `_guarded` sets `seen.started` **before** calling the section. A started section whose promise rejects is `storage-unavailable` / `reconcile-first`, and the message carries the rejection (`its own outcome: rejected: …`). So is a guard that ran the section and then answered a non-`Result`. Not-run answers that are not a `Result` are `invalid`. The "either way nothing was written" comment is now scoped to the never-started branch. |
| **P3-1:** late-start wording | "After the broker observed the answer" is now used in four places: the `ITaskWriteGuard` remarks, the `writeGuard` doc, `CAPABILITIES.md` and the `once` refusal message. Each also says that a start inside the few-microtask window is awaited and classified as started. A test pins that window. |
| **P3-2:** non-`Result` writes | `WriteGate` refuses a write that resolves to anything other than a `Result` as `'threw'`, with "the write did not resolve to a Result". **Why `'threw'` rather than a new kind:** its documented meaning is now "the write ran and did not answer a `Result`", and a caller does the same thing in all three cases. A separate kind would add a branch that leads to no different action. |
| **P3-3:** order across a resume | **Kept FIFO** (the preferred option). Writes woken by a resume are counted (`_waking`). A write that asks before they have all re-decided queues behind them. The last of them to decide wakes that queue, unless a pause was taken in between. This took about ten lines. |
| **P3-4:** cross-copy `instanceof` | The not-run refusal's detail is read structurally (`'detail' in result`) and validated by the broker's `ITaskFailure` converter. There is no cast and no `instanceof`, so a failure built by another copy of ts-utils keeps its classification. |

### Tests added

- **ts-agent-tasks** (`guardRobustness.test.ts`, 9 tests):
  - the fabricating guard;
  - the creation and registration bound;
  - P2-1 with a real `WriteGate` over a repository whose `withWriter` commits and then rejects;
  - the forging-guard variant (it swallows the rejection and answers `conflict` / `safe`);
  - a swallowing guard that answers success;
  - a guard that answers a non-`Result`, once after running the section and once without;
  - the late-start window;
  - a refusal shaped like one from another copy of ts-utils.
- **ts-extras:** a non-`Result` write refused as `'threw'`, and order kept across a resume.

### Revert rows, round 1 (each red)

Run the same way as the matrix above. Each row was restored after its run; every run had
0 TypeScript errors and 0 lint errors.

| Row | Mutation | Red |
|---|---|---|
| B1 | `createNative` recurses on a retried miss | 1: `creation and registration bound their own retry…` |
| B2 | `registerExternal` recurses on a retried miss | 1: the same test |
| B3 | Started marked only when the section fulfils (the P2-1 defect) | 10, incl. every real-`WriteGate` broker test and the P2-1 tests |
| B4 | The guard's answer is not checked for being a `Result` | 2: both non-`Result` tests |
| B5 | Refusal detail read by `instanceof` again | 1: `a refusal from another copy of ts-utils keeps its classification` |
| B6 | Not-run success passed through (R14) | 2, **now as assertions rather than a hang**: `…answers success without running the section is invalid` and `…is refused invalid on its first answer, without a retry loop` |
| B7 | `WriteGate` passes a non-`Result` through raw | 1: `refuses a write that resolves to something that is not a Result…` |
| B8 | A new write overtakes woken writes after a resume | 1: `keeps order across a resume…` |

The P2-1 tests were written before the `seen.started` change and confirmed red against the code
before it (row B3).

### Round-1 gates

These ran on `ceb54d1a4`, merged with `origin/integration/asks` @ `da35380ee` (unchanged since the
first gate), in the foreground from the repo root. A container restart killed the first round-1
`rush test` at operation 24 of 39, so the whole set below was re-run on this HEAD. The first round-1
rebuild ended `SUCCESS WITH WARNINGS` on one lint warning, a missing return type in the new ordering
test. `ceb54d1a4` fixes it, and the gates below are clean.

| Gate | Exit | Error grep | Warning grep |
|---|---|---|---|
| `rush install` | 0 | — | — |
| `rush change --verify --target-branch origin/integration/asks` | 0 | — | — |
| `rush rebuild` | 0 | 0 | symlink notice only; `SUCCESS: 39 operations` |
| `rush test` | 0 | 0 | symlink notice only; `SUCCESS: 38 operations`, 38 `completed successfully`; no NUL padding |
| ts-extras `rushx build` / `lint` / `test` | 0 / 0 / 0 | 0 | 0; coverage 100/100/100/100 |
| ts-agent-tasks `rushx build` / `lint` / `test` | 0 / 0 / 0 | 0 | 0; coverage 100/100/100/100 |
| prettier 2.8.8 `--check` on touched files | 0 | — | — |
| feed `--check`, `verify-capability-docs` | 0 / 0 | — | 0 stale, 0 failed |

None of the known load-sensitive tests failed.

## Brief deltas

- **`ITaskWriteGuard` widened** (`PromiseLike<Result<T>>`). This was forced by the structural-fit
  requirement and is recorded in `state.md`.
- **`pause` answers `AsyncDetailedResult`**, a subclass of the brief's `AsyncResult`.
- **`TaskScheduleTimer` removed**, not kept as an alias. This is the brief's preferred option.
- **Reentrancy** uses the brief's second option: a documented call-site rule, with the deadlock
  detected and classified at the pause.

## Lift conditions retired

- The `agent-tasks-host-helpers` ledger entry (`docs/workstreams/2026-10.md`) said: "*`TaskScheduleTimer`
  duplicates ts-extras `async-control`'s `ScheduleTimer` … consolidate when both land.*" This stream
  is that consolidation. The archived entry is left verbatim, and this stream's entry records the
  closure.
- personaility `IngestionStopSignal`: adopting it is the consumer's call (state.md, *Lift-condition
  sweep*).
