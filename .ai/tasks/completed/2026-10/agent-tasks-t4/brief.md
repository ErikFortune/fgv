# Stream brief — `agent-tasks-t4`

**Status: 🟢 ready.** Drafted 2026-09-23, slice **T4** of `docs/design/agent-tasks/implementation-plan.md`.

## Mission

Land **T4** — indexed selection, paging, due and outstanding discovery. Full resident
summaries/indexes for non-archived tasks; a *minimal* archived identity/graph/source/status
projection; an unresolved-reference projection; separately indexed bounded owed/pinned payloads;
design §7's bounded caches and working concurrency. Staged rebuild with generation and health, and
bounded keyset pagination.

**Lifetime operation and acknowledgement/disposition history is on-demand data, not resident index
content.** That sentence is the slice's centre of gravity — it is what makes the memory profile
bounded, and most of the acceptance criteria are consequences of it.

## Branch and PR posture

| | |
|---|---|
| Integration branch | `integration/agent-tasks-v1` (T1 `1337c27c`, T2 `0249e85d`, T3 `f8961a97`) |
| T4 | `claude/agent-tasks-t4` → PRs into the integration branch |
| Squash to `release` | the orchestrator's, not yours |

`rush change --verify --target-branch origin/integration/agent-tasks-v1`.
CI runs on PRs into `integration/**`; if a PR shows no checks, stop and say so.

## The review gate is a design constraint, not a checklist item

> **"An implementation that filters a full `listEntries()` array fails even if a small fixture is
> fast."**

Read that before designing anything. It rules out the shape that passes every functional test on a
small corpus and collapses at scale, and it is why the evidence for this slice is **counters, not
timings**. Design the indexes first and let the queries fall out; do not write the query and then
look for an index to make it faster.

The same paragraph adds: **rebuild must parse, project and release each body — never collect an
all-record array.**

## Evidence is counters, and the measurement rules are written down

- **Assert candidate visits and record reads, not milliseconds.** A millisecond assertion on a CI
  runner measures the runner.
- **Warm ordinary summary/owed queries must perform zero task-file reads.** That is directly
  assertable and is the property the resident/on-demand split exists to deliver.
- **`listOwed` must not scan terminal history.**
- Hold the open/matching set **fixed** while growing unrelated retained terminal history through
  **0, 1,000 and 10,000**, using an explicit finite fixture profile that admits those counts. Test
  archived and non-archived terminal cohorts **separately**. Due tests grow future/non-matching
  candidates independently.
- Deterministically inspect the internal projection shape and counters: archived summaries, details
  and operation bodies **absent**; full-summary count equals resolved non-archived count; exact
  graph/source/inventory entry counts; **no resident historical acknowledgement sets**; cache
  entries, encoded charge and cursor handles within limits; bounded in-flight record
  materializations.
- **Heap and RSS claims belong only to M1, never to these tests.** Counter assertions go in the
  normal suite.

**Read `.ai/instructions/TESTING_GUIDELINES.md` § *Measurement Harnesses* before writing the M1
harness.** It is short and every rule in it was paid for: sanity-check that the fixture frees what
it claims to hold; never share a corpus between an A/B's two passes; prefer a `perf/` script to a
test excluded from the coverage gate; **state the prediction before running it**, because a
threshold chosen after seeing the result measures nothing.

**M1 starts here but does not finish here.** Author the harness and the prediction manifest in this
slice and run early measurements once the real open/rebuild path exists. It is repeated after T7/T8
add history and reservations. T3 checked its mutation matrix in under `perf/`; put the M1 harness
alongside it.

## You still hold licence to revise T1's vocabulary — with one new constraint

The same licence applies: T1's unions were predictions, `ts-agent-tasks` is on the active-development
list, nothing has reached `release`. If a member is wrong for what indexing and paging actually need,
change it and update T1's declared-vs-exercised table.

**The new constraint is T3.** T3 wrote this vocabulary into records on disk. A revision that changes
a *persisted* shape is now a storage-format change — so it needs a migration story or a clear
statement that no persisted record carries the member. Say which, in `result.md`.

## Package surface

- `libraries/ts-agent-tasks/src/packlets/storage/` — query and index modules alongside T3's records
- `libraries/ts-agent-tasks/src/packlets/types/` — revisions permitted, with the T3 caveat above
- `libraries/ts-agent-tasks/perf/` — the M1 harness, beside T3's mutation matrix
- root exports, `CAPABILITIES.md`, `README.md`, API report, change file

## Out-of-scope

- **The broker** (T5), **source adapters and reconciliation** (T6), **subscriptions and exact
  acknowledgement** (T7), **retention and backpressure** (T8), **cascade stop** (T9).
- **Any business-layer filesystem bypass.** Everything goes through `FileTree` and T3's repository.
- Any task runner, scheduler or retry policy. The deferred input protocol (gate #6).
- Every other package, consumed unchanged. An upstream gap is an escalation, not a fold-in.

## Acceptance (plan § T4)

- **Native mutation updates every affected index before success.**
- **Index failure after record commit fences queries and reports indeterminate commit until
  rebuild.** Not a silent stale read.
- **Warm ordinary summary/owed queries perform no task-file reads**; explicit archived inspection,
  detail and replay read selected records.
- **Terminal non-archived tasks remain fully represented.** Archive removes their *summary*, not
  their identity or edges.
- **Terminal obligations stay discoverable after leaving open work.**
- **Rebuild releases the old generation** and performs bounded sequential projection/reconciliation
  passes — **never a healthy empty fallback.** An empty index that reports healthy is the failure
  this criterion exists to forbid.
- **Custom repositories get a reusable conformance suite.**

## Tests (plan § T4 — the list is the specification)

Scope unions and dedup before paging; exact-status and class compatibility; due absent / equal /
before / after cutoff; remaining non-time prerequisites; parent, reassignment and source dedup index
changes; all page boundaries; cursor query mismatch, restart and concurrent mutation; archive
projection; rebuild after an interrupted record or index update. Task→consumer→selected-task passes,
graph-validation workspace, unpruned-but-satisfied descriptors, live pins, old-generation release.

## Repo gates

- [ ] `rushx build` — **zero warnings** · `rushx lint` · `rushx fixlint`
- [ ] `rushx test` — 100% on all four metrics
- [ ] `code-reviewer` **before** closing coverage gaps
- [ ] `node common/scripts/install-run-rush.js rebuild`
- [ ] Change file, verified against the integration branch
- [ ] `CAPABILITIES.md` in the same PR; index row stays one line
- [ ] Every step `.github/workflows/ci.yml` runs

## Traps this stream's predecessors paid for

1. **An evidence run is only evidence of the code it was run against.** T3's mutation matrix was run
   against an intermediate head while five review rounds landed after it; re-running against the
   final source found **nine rows that turned nothing red, five of them real coverage gaps**. If you
   produce counter evidence or an M1 measurement and then take review findings, **re-run it before
   you claim it.**
2. **A bounded array whose entries carry an identity needs a uniqueness constraint, not just a length
   cap.** T1 hit this three times in one loop. You are building indexes — collections keyed by
   identity are the entire slice.
3. **A test comparing a constant to a constant looks like a guard and is not.**
4. **A review round that posts zero comments is not evidence of a clean diff** — read the summary's
   "previously missed" block, not the comment count.
5. **A harness that reports a number is not a test.** A broken test goes red; a broken harness prints
   a plausible figure and is believed.

## Open questions, none T4's to settle alone

1. **Executor-payload dereference** — may terminal presentation dereference an executor-owned payload
   after the broker update is acknowledged? A §8.3 / **T6** / **T8** decision, carried to the design
   authority unanswered. It reached none of T1–T3. If it reaches you, **stop and surface it**.
2. **Source-history spelling.** §5 says `'latest-snapshot' | 'replayable-updates'`; §1 and §8.6 say
   `'observed-state'` / `'source-replay'`. T1 unified on §8.6; **T6** confirms.
3. **`ts-utils` `isKeyOf`** calls `item.hasOwnProperty(key)` rather than
   `Object.prototype.hasOwnProperty.call(...)`. Escalated by T1, unfixed. **Do not fold a `ts-utils`
   fix into this slice.**

## Parallel-stream collision note

`ai-assist-streaming-cache` runs concurrently in `libraries/ts-extras`, off `release`. **No code
overlap.** But both streams touch `.ai/instructions/LIBRARY_CAPABILITIES.md` and
`docs/WORKSTREAMS.md` — **own section only.**

## Exit artifact

T4 does **not** close the stream. Artifacts stay in `.ai/tasks/active/agent-tasks-t4/`. **Do not run
`/finalize-task`.**

`result.md` must carry: what shipped; which T1 members were exercised or revised, and whether any
revision touched a persisted shape; **the counter evidence at 0 / 1,000 / 10,000**, archived and
non-archived cohorts separately; the M1 prediction manifest and any early measurements, with the
prediction stated *before* the numbers; and what a later slice must decide.

## Required reading, in order

1. `docs/design/agent-tasks/implementation-plan.md` § *T4* — the authority, including the review gate.
2. `docs/design/agent-tasks/development-design.md` **§7** (bounded caches, working concurrency) and
   **§8.6** (capacity).
3. `.ai/instructions/TESTING_GUIDELINES.md` § *Measurement Harnesses* — before the M1 harness.
4. `libraries/ts-agent-tasks/src/packlets/storage/` — T3's repository, records and inventory.
5. `.ai/tasks/active/agent-tasks-t3/result.md` — the crash-window matrix and what storage guarantees.
6. `.ai/tasks/active/agent-tasks-t1/result.md` — the declared-vs-exercised table.
7. `libraries/ts-agent-tasks/perf/` — T3's mutation matrix, as the pattern for checked-in tooling.

## Missing-input rule

If any required-reading file does not exist, or any statement here does not match the tree, **STOP
and surface the gap.** Do not reconstruct missing context by inference.
