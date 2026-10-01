**Shipped:** A credential-free `samples/testbed` scenario now drives `@fgv/ts-agent-tasks` through all nine steps of the plan's journey using only the package's exports — every claim a structured check with the value it observed, and library contract tests pinning the compositions no existing suite did.

# Result — `agent-tasks-p1`

**P1 closes the implementation slices of the cluster.** Artifacts stay in
`.ai/tasks/active/agent-tasks-p1/`; the family finalizes at cluster close (no `/finalize-task`).
Written 2026-10-01.

---

## What shipped

**`samples/testbed/src/scenarios/agentTasks/`** — scenario id `agent-tasks`, CLI-only, registered in
`scenarios/index.ts` (registry snapshot updated by one line: `"agent-tasks"` appended).

| file | role |
|---|---|
| `world.ts` | **every simulation and host seam, in one place** (list below) |
| `journey.ts` | the testable core: nine steps plus the `7-cancel` and `7-uncertain` branches, each a list of checks |
| `report.ts` | `StepRecorder` / `IJourneyReport`: each check is `{ observed, expected, passed }`; the printed output is rendered from the checks |
| `support.ts` | the journey's small helpers — halting ones (throw → `Failure` at the top) and observing ones |
| `outbound.ts` | captures the ai-assist request body without a network call |
| `index.ts` | the thin CLI bootstrap: run the core, log one line per check, fail the run if any check failed |

**`libraries/ts-agent-tasks/src/test/unit/journey/publicJourney.test.ts`** — six contract tests
through the public barrel only (`../../../index`; the helpers they use import nothing else).

**`samples/testbed/config/jest.setup.js`** — a `structuredClone` polyfill for jsdom (finding 1).

Nothing in `libraries/ts-agent-tasks/src/packlets` or `perf/` changed.

## Decision 1 — where each assertion lives

The same journey has three homes, and they assert different things:

| home | asserts | survives the sample being deleted |
|---|---|---|
| **existing library suites** | each behaviour in isolation, against internal and public seams, with fault injection | yes |
| **`journey/publicJourney.test.ts`** (new, library) | the **compositions** the plan's journey depends on that no single suite pinned — found by mapping all nine steps against the suite (below) | yes |
| **the scenario's tests** (`agentTasks.test.ts`) | that the exported API **composes from outside the package** — a separate Rush project, its own simulated source, the published entry point — and that every claim the scenario makes is backed by a check whose observed value is asserted against a literal in the test | no |
| **CLI smoke** (same file) | registration, the real `runTestbedCli --scenario agent-tasks` path, stdout summary, one `[ok  ]` line per check on stderr | no |

**Why not the whole journey in both places.** A library behaviour asserted only in the sample dies with
the sample, and a sample asserting everything the library suite already pins proves nothing new. So
the library side carries only the six compositions it lacked; every other step is pinned by a
dedicated suite, named per step below. The sample's job is the one thing no library suite can do —
consume the package as a separate project — and the scenario tests assert its observed values, never
`report.passed` alone.

**Which compositions were missing** (an independent sweep of `src/test/unit` before writing any test):
step 1's view-level dedup (only repository- and renderer-level dedup was pinned); step 4's "terminal
update owed **after the task leaves open work**"; step 5's reassignment **combined with** reopen,
`lookupSource` and B's baseline; step 7's blocker **resolved by host action** then release/resume;
step 8's four recovery outcomes **after a reopen** with dispatch counted; step 9's foreign receipt
**beside an outstanding prompt handoff**.

## Decision 2 — the scenario's core

`runAgentTasksJourney(options?)` → `Result<IJourneyReport>`. The core does all the work and records
checks; `index.ts` only renders them. `IWorldOptions.executor` is a **factory** (each branch seeds its
own world), which is how the tests substitute a broken executor to show the checks bite. The
bootstrap is fourteen lines: the core's tests are the evidence.

## The nine steps — the assertion that fails on regression

Library suite references are to `libraries/ts-agent-tasks/src/test/unit/`. "Scenario" means a check
in `journey.ts` whose observed value `agentTasks.test.ts` asserts against a literal.

| step | library assertion | scenario assertion |
|---|---|---|
| 1 | **new** `journey › step 1` (a task in two scopes listed once by a view over both); `storage/query.test.ts` › *scopes are a union, deduplicated…* | `union view lists each task once` = `[crawl, plan, review]` beside per-scope views of 3 and 2; typed details `{step:0, ref:'sim/crawl'}`; no `binding` in a view |
| 2 | `delivery/receipts.test.ts` › *prepare writes a manifest and acknowledges nothing…*; `context/renderer.test.ts` › *a snapshot-only render receipts revisions and invents no update IDs* | broker receipt's update ids = the baseline ids; snapshot receipt has no delivery id and no update ids, and a second render is identical; both subscriptions' owed ids unchanged by preparing |
| 3 | `tools/commands.test.ts` (applied/accepted/indeterminate/source rejection); `broker/sourceCommands.test.ts` › *a source-key command is resent under the same key…*, *a non-idempotent uncertain command is held, never resent* | applied `{revision: 2}`; broker rejection and **source** rejection both read `conflict`, the host's receipt `rejected`, task unchanged; accepted ≠ applied (step 0 until the executor settles); pause key seen **twice, applied once**; advance key **held** on two passes, seen **once**; abandoned receipt |
| 4 | **new** `journey › step 4`; `delivery/receipts.test.ts` › *a receipt that omits revision-3 attention…*, *an old receipt cannot consume an obligation committed after it was issued* | ack's `newlyAcknowledged` = the receipt's ids exactly; crawl's terminal `lifecycle`+`result` ids still owed after crawl left the open query; the abbreviated attention id still owed |
| 5 | **new** `journey › step 5`; `broker/reassignment.test.ts` (preservation, stale writes); `delivery/subscribe.test.ts` › *checkpoints stay independent across a reassignment and a reopen* | previous/current `[ada, bob]`; stale write `conflict`; root file set unchanged; children keep responsibility/scopes/parent; B's baseline holds the plan at the reassigned revision; A still owes the `assignment` update; after reopen `lookupSource` → `crawl` and both owed sets unchanged |
| 6 | `storage/query.test.ts` (due boundaries, *querying changes nothing*); `storage/counters.test.ts` (candidate visits fixed as history grows) | due at the cutoff `[due-soon]`, later `[due-soon, due-later]`, nothing changed; open and due results identical at 0/60/180 terminal tasks with **0 task-record reads**, and the control read counts **1** |
| 7 | **new** `journey › step 7`; `broker/stopSources.test.ts`, `stopFreeze.test.ts`, `stopCrash.test.ts`, `stopRelease.test.ts` | one pass `blocked` with `gauge: unsupported` and the executor really paused; new child `conflict` before and after reopen; with `stop` denied the pass is `not-found-or-denied`, re-allowed it runs; host-resolved blocker → `satisfied`; release leaves both `paused`; resume applies per task |
| 7-cancel | `broker/stopRelease.test.ts` › *a cancel whose root is terminal cannot be released* | all three targets `cancelled` (executor included); release refused `['conflict', 'after-host-action']` — not a stale write |
| 7-uncertain | `broker/stopSources.test.ts` › *an uncertain dispatch keeps its key…* | `indeterminate` blocks; next pass `satisfied`; exactly one key ever dispatched, applied once |
| 8 | **new** `journey › step 8`; `broker/sourceRecovery.test.ts`; `broker/sourceReconcile.test.ts` › *reopening storage makes no call to any source* | open made **0** executor calls; outcomes `reattached / completed / unavailable / unrecoverable`; reachable again → `reattached`, health `current`; a full reconcile pass completes; missed terminal outcomes owed; the advance lost before the close is `held`, **one key, one dispatch, one effect** |
| 9 | **new** `journey › step 9`; `prompt/handoff.test.ts`, `prompt/outbound.test.ts` | captured system blocks = `[prefix (cached), context (uncached)]`; context on the wire once; one request per send; prefix block identical across a progress-only change, breakpoints identical; foreign receipt, modified send and the exact text after it all `invalid-receipt`; owed set unchanged; valid ack replays with `newly: []`, `already: [progress id]` |

**Proof the checks bite (scenario):** an executor that does not deduplicate keys fails exactly
`3: and applied it once (source-key duplicate suppression)`; an executor that answers `reattached` for
lost work fails exactly `8: recovery outcomes` (the lifecycle check still passes — the projection it
carried was the failed one, which is correct). Both are tests.

## Every place the public surface was insufficient

1. **`structuredClone` is a silent runtime requirement.** The broker clones every authorization
   request (`broker/access.ts`), and projections and checkpoint records, with the global
   `structuredClone`. jsdom does not provide it, so under the testbed's jsdom Jest environment the
   first `create` fails *"'create' is not permitted"* — the throw is (correctly) a denial, logged as
   such. Node ≥ 17 and current browsers have it. Nothing in `CAPABILITIES.md` or the README says so.
   *What would close it:* a stated runtime requirement, or a JSON-value clone the package owns (the
   cloned values are JSON). Polyfilled in the testbed's `jest.setup.js`, beside its other jsdom gaps.
   Routed: `docs/TECH_DEBT.md`.
2. **Query work is not observable from outside.** Candidate visits are counted only through
   `packlets/storage/internals` (`inspectRepository`). From outside, the only evidence is task-record
   reads, observable by subclassing the injected FileTree accessor — so the scenario shows *zero reads
   and identical results* as history grows, but cannot show *visits tied to matches*. *What would close
   it:* an exported, read-only query-work counter on `ITaskRepository` (or on the query page). Routed.
3. **ai-assist has no per-call transport.** Capturing the request without a network call needs
   `globalThis.fetch` substituted for one call (`outbound.ts`, restored in `finally`, removed again if
   there was none). The testbed's `memoryToolsGate` does the same. *What would close it:* an optional
   `fetch` on `callProviderCompletion`'s params (`@fgv/ts-extras`, outside this stream). Routed.

Not findings, stated so: every other step was driven through exports alone — the injected clock and
ID factory (`TaskEnvironment.create`), the in-memory FileTree, `ExternalTaskSource.create` with typed
commands and a stop declaration, `createTaskTools` with command specs, the trusted repository reads
(`queryDue`, `lookupSource`, `readCommit`), `prepareTaskPrompt` with a real `PromptLibrary`.
Branded ids are built with the repo's `as unknown`-free branded cast (`as TaskId`, `as ConsumerId`).

## Every simulation and double — one list

All in `samples/testbed/src/scenarios/agentTasks/world.ts` unless noted. None is a double of a library
type; each stands in for something a host owns.

| simulation | stands in for | public seam it plugs into |
|---|---|---|
| `ScenarioClock` | the host clock (fixed at `2026-10-01T09:00:00.000Z`) | `TaskEnvironment.create({ clock })` |
| `SequentialIds` | the host ID factory (`p1-0001`…, one sequence across reopens) | `TaskEnvironment.create({ newId })` |
| `CountingTreeAccessors` | an instrumented storage root — subclasses the real `FileTree.InMemoryTreeAccessors`, counting `task-*.json` reads by all three read methods | the repository's injected `root` |
| `ScenarioPolicy` | the host policy — allow-all, with `deny`/`allow` that move the epoch | `ITaskAuthorization` |
| `SimulatedExecutor` | an external executor that really applies, deduplicates (by key, for `source-key` commands), accepts, refuses, loses responses and goes unreachable — advanced only by explicit calls | wrapped by the library's own `ExternalTaskSource` in `controllableSource` / `observationOnlySource` |
| `projectorFor` | the host projector (default envelope projection + typed job details via the kind handle) | `IBoundTaskViewParams.projector` |
| `outbound.ts` `fetch` substitute | the provider endpoint | `globalThis.fetch`, for one call |
| `config/jest.setup.js` `structuredClone` | Node's structured clone under jsdom | the global |

## Crash and recovery claims rest on fault-injection suites, not this journey

The journey's reopen is a clean close-and-open. The crash claims it relies on are established by the
package's fault-injection suites: `storage/crash.test.ts` and `storage/durable.test.ts` (real-Node
child-process kills at each write boundary, ext4/tmpfs), `broker/crash.test.ts`,
`broker/stopCrash.test.ts`, `delivery/crash.test.ts`, `delivery/retentionCrash.test.ts`,
`storage/faults.test.ts`, `broker/faults.test.ts`, `broker/stopFaults.test.ts`,
`delivery/faults.test.ts`. The scenario claims recovery *behaviour* after a reopen, not crash
survival.

## Determinism

No credentials (the Anthropic key is the literal `placeholder-not-a-credential`, and the request never
leaves the process), no network, no downloads, no model weights, no sleeps, no timers, no randomness,
no wall-clock reads (the clock is fixed; the library reads no other time). Branches 5–9 each seed a
fresh world, so no step depends on another's order beyond 1→2→3→4, which share one world by design.
Pinned by a test: a second run's report is deep-equal to the first.

## Revert matrix — on final source

`.ai/tasks/active/agent-tasks-p1/p1Matrix.js`, **placed here because M1 owns `perf/`** (I2's
placement, for the same reason). Each row mutates the **library** source in a copy (`--pkg`, with a
`node_modules` symlink), rebuilds it, and runs both the library's `journey/` suite and the testbed's
`agentTasks` suite against it (`--testbed`, a copy whose `node_modules` links `@fgv/ts-agent-tasks`
to the mutated copy). The workspace is never edited. Control (unmutated copies): `journey/` 6/6,
scenario 30/30.

Ten rows, **all red** on the committed source (`7387fc7b`'s library source; the copies were diffed
against the workspace before the run). Scenario counts include the two "checks bite" tests and the CLI
smoke, which go red under any regression by design (each expects an exact set of failing checks, or
all passing).

| row | mutation | red: `journey/` | red: scenario | what failed |
|---|---|---|---|---|
| P1-1 | scope union: the merged stream advances only the first stream holding a key | 1 | 14 | the step-1 contract test; the scenario **halts** — step 2's subscription baseline refuses the duplicate (*"baseline: task plan appears twice"*), so every report test fails |
| P1-2 | the pump resends an uncertain `none` command | 0 | 14 | the scenario **halts** at step 3 — the resent command settles `applied`, so the host's abandonment fails (*"command … is settled (applied); there is nothing to abandon"*) |
| P1-3 | an abbreviated item receipts its update ids | 0 | 5 | step 4 — the omitted attention update is acknowledged |
| P1-4 | a write from an older revision is accepted — **both** revision checks | 1 | 5 | the step-5 contract test; step 5's stale-write check |
| P1-5 | a due query ignores its cutoff — the index bound **and** the re-check | 0 | 5 | step 6's due checks |
| P1-6 | a latched parent takes a new child — the broker **and** storage refusals | 1 | 14 | the step-7 contract test; the scenario **halts** at step 7's reopen — open's own validation finds the admitted child (*"recovery required: 1 issue"*), a third layer the mutant did not remove |
| P1-7 | a source with no stop opt-in is confirmed instead of blocking | 1 | 5 | the step-7 contract test; step 7's blocked-pass check |
| P1-8 | recovered finished work is refused instead of recorded | 1 | 5 | the step-8 contract test; step 8's outcomes and owed checks |
| P1-9 | an unreachable source is recorded as `stale`, not `unavailable` | 0 | 5 | step 8's observation-health check |
| P1-10 | a send that *starts with* the checked body acknowledges it | 0 | 5 | step 9's modified-send check |

**Three single-layer mutants were equivalent, and that is a finding about the rows, not the tests.**
The first run of P1-4, P1-5 and P1-6 mutated one check each and stayed `0 red`: the package guards
each of those properties twice — a stale revision before and again inside the writer; a due cutoff in
the index stream's upper bound and in the per-candidate test; a latched parent in the broker
(`refuseUnderLatch`) and in storage (`checkStopRegistration`). Removing one layer changes no behaviour,
so no test could see it. The rows now remove every layer (the script's `mm` rows), and each goes red.
The trap the brief names — a row green while protecting the bug — has a sibling here: a row `0 red`
while protecting nothing, because the fixture could not tell the mutant from the original.

**Which suite carries which row.** The library's `journey/` suite catches the five rows whose step it
composes (1, 5, 7 twice, 8); the scenario catches all ten. Rows P1-2, P1-3, P1-5, P1-9, P1-10 are
caught by the scenario and, for the library, by the dedicated suites the per-step table names — not by
`journey/`, which deliberately does not repeat them.

## Review

**Layer 1 (`code-reviewer`), before coverage closure.** No P1. Eight P2s, all fixed:

| P2 | fix |
|---|---|
| step 8 "no duplicate execution" vacuous (nothing was ever owed) | an advance's response is lost **before** the close; after reopen it is `held`, one key, one dispatch, one effect |
| step 6 does not show work tied to candidates | kept the zero-reads + identical-results evidence with a control; the missing export is finding 2 |
| step 3 never saw a **source** rejection | `rejectNext` on the executor; tool line `conflict`, host receipt `rejected`, task unchanged |
| step 7 "reauthorize" exercised nothing | the policy denies `stop` after reopen (pass `not-found-or-denied`), then allows it |
| unsafe casts (`as never`, reference cast, tool-result casts, `!`) | `ConsumerId` branded cast; a `Converters.strictObject` for the binding reference and for tool answers; no non-null assertions |
| step 5 record-path check used layout knowledge | replaced by "the root's file set is unchanged" (FileTree API only) |
| CRC32 equality could collide | exact RFC 8785 canonical strings compared |
| step 4 crawl check vacuous when absent | observes `[present, any terminal]` = `[true, false]` |

P3s applied: snapshot receipt rendered twice and compared; the 7-cancel refusal records code **and**
retry; `fetch` removed (not set to `undefined`) when there was none; the unused `world` parameter
dropped. P3 not applied: `toolLine` parses the failure line — a tool failure is a plain `Result`
with no detail, and the line's code word is fixed by the tool; that is what a model sees.

**Two defects in my own report code found while closing coverage**, both now tested:
`Result.orDefault` treats a successful `null` as absent (documented `ts-utils` behaviour), so
`toJson(null)` had become the not-JSON sentinel on both sides of a comparison — a null-vs-null check
would have passed for the wrong reason; and two non-JSON values compared equal. A check involving a
non-JSON value now never passes.

**Layer 2 (Copilot):** COPILOT_RESULTS

## Gates

Run on the committed source after the review fixes and prettier.

| gate | result |
|---|---|
| `rushx build` (`heft build --clean`), both packages | finished, **zero warnings** |
| `rushx lint`, both packages | clean (`eslint` on the formatted source after the pre-commit prettier pass) |
| `rushx test` — `ts-agent-tasks` | **2,407 tests** (I2's 2,401 + 6 in `journey/`), 100 % statements / branches / functions / lines, **0 `c8 ignore`** in `src/packlets` |
| `rushx test` — `samples/testbed` | **608 tests** across 26 suites (30 in `agentTasks`), under the package's own config: jsdom, global 100 % thresholds, with its existing `coveragePathIgnorePatterns`; `src/scenarios/agentTasks` is **not** ignored and is at 100 % on all four metrics, 0 `c8 ignore` |
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | passes; `ts-agent-tasks` and `testbed` change files, both `none` (test-only / private sample) |
| repo-wide `install-run-rush.js rebuild` | **SUCCESS, 37 operations**, no warnings |
| repo-wide `install-run-rush.js test` | **SUCCESS, 36 operations** + 1 no-op (`typedoc-compact-theme`). The first run failed one unrelated `ts-extras` test (flaky, root-caused, routed) and blocked 20 downstream projects; the re-run is the complete one |
| `verify-capability-docs` | 22,038 / 24,000 chars, 0 failed |
| `generate-capability-feed --check` | 0 stale |
| `verify-esm-entrypoints` | 24 checked, 0 failed |
| `verify-bundler-resolution` | 20 checked, 0 failed (autoinstaller installed first) |
| `verify-tarball-exports` | 26 packages, 205 manifest paths, 0 failed (autoinstaller installed first) |
| revert matrix | 10 rows on final source, all red (above) |
| no `any`; fallible operations return `Result` | yes — the journey's halting helpers throw only inside `captureAsyncResult` |

## Routed

- `docs/TECH_DEBT.md`: `structuredClone` runtime requirement (finding 1); no exported query-work
  counter (finding 2); ai-assist has no per-call transport (finding 3); fold `P1-1…P1-10` into
  `perf/mutationMatrix.js`; a flaky `ts-extras` KeyStore Argon2id test (seen in the repo-wide run).

## What the cluster still owes before promotion

- **M1's stop-state cohort** (`agent-tasks-m1-stop`, in flight).
- The routed items above; none blocks promotion.
- Cluster close: `/finalize-task` for the family, migrating `.ai/tasks/active/agent-tasks-*`.
