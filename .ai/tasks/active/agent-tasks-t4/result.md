# Result — `agent-tasks-t4`

**T4 does not close the stream.** Artifacts stay in `.ai/tasks/active/agent-tasks-t4/`. Written
2026-09-23.

---

## What shipped

Indexed selection over T3's `FileTreeTaskRepository`. Everything is answered from one resident
index generation that every commit patches before it returns success; no query reads a record.

- **`query`** — non-archived tasks by a scope **union** (deduplicated by task before paging),
  lifecycle class (`open` / `terminal` / `all`) and exact statuses (checked against the class:
  an incompatible pair is `invalid`, not empty), direct `parentId`, `responsibility`. Ordered by
  task id. The driver is the cheapest ordered source — the per-scope lifecycle sets merged, the
  parent's non-archived child set, or the responsibility set — and every candidate is re-checked
  against every criterion on its resident summary. Unresolved references match on scope, parent
  and responsibility, come back separately and make the page `partial`; quarantined (unregistered
  kind) tasks are named in `issues`, also `partial`.
- **`queryDue`** — waiting tasks with `notBefore <= cutoff`, ordered `(notBefore, taskId)`, read
  from per-scope due sets up to the cutoff plus the one key past it. Absent `notBefore` excluded,
  equal included. Changes nothing.
- **`listOwed`** — per-subscription owed-update index with the bounded payloads, independent of
  every lifecycle index: terminal and archived tasks' obligations stay listed.
- **`lookupSource`** — canonical source identity → task for every retained task, archived
  included. Registration refuses a binding another retained task holds (`conflict`), before any
  write; open reports a duplicate as blocking integrity.
- **Paging** — limit default 50, max 200; server-held cursor handles (`<epoch>.<seq>`, the epoch
  minted lazily through the host ID factory) that retain the normalized descriptor and a keyset
  position only; bound to query and generation; ≤ 256, five-minute idle expiry, LRU eviction;
  `cursor-stale` for unknown/expired/evicted/other-generation, `invalid` for a different query.
  The normalized descriptor is bounded by `maxQueryDescriptorBytes`. A page that exhausts its
  1,024-candidate budget returns a cursor, never an "exhaustive" short answer.
- **Archive projection** — archiving removes the summary and every lifecycle, responsibility,
  due and active-child membership in the commit; identity, parent edge and child adjacency, final
  status and source identity stay resident. Archived entries hold T3's minimal projection plus
  `status` — no envelope, details, operations or update bodies.
- **Fence on a post-commit index failure** — the record is durable, so the repository goes
  `unavailable` and reports `commit-indeterminate` with the operation id (`storage-unavailable`
  for a maintenance commit, which has none). Queries fail; nothing reads a stale index.
- **`rebuildIndexes()`** — refused under a writer; releases the old index, cursor handles and
  cache **before** scanning; `health().state === 'rebuilding'` fences everything meanwhile; runs
  the same staged scan as `open` (task pass → consumer/source pass → O(N+E) graph validation →
  selected-task pass for owed payloads); publishes a new generation, or stays `unavailable` with
  the blocking issues. It never publishes an empty index as healthy. It is also the way out of
  T3's write-visibility fences, since it re-reads exactly what reopen would.
- **Bounded working space** — record reads are gated at four in flight (excess `conflict`/`safe`,
  never queued); the parsed-record LRU is off unless configured (≤ 32 entries, ≤ 8 MiB encoded
  charge, keyed by record revision and fingerprint).
- **`runTaskRepositoryConformance(factory)`** — the behavioural contract as a framework-free
  runner, for custom repositories.
- **M1 harness** `perf/residentMemory.js` with its prediction manifest; early run below.

---

## T1 vocabulary: exercised or revised

**No T1 member was revised, and no persisted shape changed** — so no migration is needed: every
record T3 writes is read by T4 unchanged, and the index is derived at open, never persisted.

| set / type | T4 |
|---|---|
| `TaskLifecycleStatus` (open/terminal partition) | exercised as index keys: `(scope, class)` and `(scope, exact status)` ordered sets; the query converter refuses a status outside its class |
| `PageCursor` | encoding decided: an opaque server-held handle token `<epoch>.<sequence>`, with a syntax-only converter (`queries.pageCursor`). The brand is unchanged |
| `TaskFailureCode` | `cursor-stale` exercised for real; `commit-indeterminate` gains a producer (post-commit index failure). `backpressure` deliberately not used for the read gate — the converter couples it to a capacity dimension a working-space limit lacks — so the gate refuses `conflict`/`safe` |
| `maxQueryDescriptorBytes` | first producer: bounds the normalized query a cursor handle retains |
| `UpdateCategory` | ordinal also orders the in-memory owed key; storage identity unchanged |
| `ITaskRepositoryHealth['state']` (T3, runtime) | **widened**: `'rebuilding'` added. Not persisted |
| new closed set | `TaskLifecycleClass` (`open` `terminal` `all`) |

T1's declared-vs-exercised table carries a T4 note on each touched row.

**Open questions.** (1) Executor-payload dereference — did not reach T4: indexes hold the bounded
summary and owed payloads only and dereference nothing. (2) Source-history spelling — not named
anywhere in T4. (3) `isKeyOf` — every T4 converter input is a caller object or `JSON.parse` output;
not fixed, as instructed.

---

## Counter evidence at 0 / 1,000 / 10,000

`src/test/unit/storage/counters.test.ts`, run on the final source (897 tests, 100% on all four
metrics). Predictions were written in `state.md` before the first run; **all held on the first
run and on the final one.** Fixed matching set: 20 open tasks in scope A (14 pending, 5 waiting
due, 1 waiting past the cutoff), 10 owing subscription `s1`. Unrelated history grows **in the same
scope**, one cohort at a time, seeded by cloning a real-API template and validated by the real
`open`. Visits are index entries read; reads are task-record file reads.

| query | non-archived terminal cohort 0 / 1k / 10k | archived cohort 0 / 1k / 10k | future-due cohort 0 / 1k / 10k |
|---|---|---|---|
| `open` in A (warm) | 20 visits, 0 reads — at every size | 20 / 0 — every size | *(open work by definition; not asserted)* |
| `listOwed(s1)` | 10 visits, 0 reads | 10 / 0 | 10 / 0 |
| `queryDue` in A | 6 visits (5 due + the stop key), 0 reads | 6 / 0 | 6 / 0 |
| `terminal` in A | asked-for: min(n, 200) items, n ≤ 200 → n visits, else 202 | **0 visits** | — |
| `all` in A, limit 200 | asked-for | **20 visits** | — |
| children of the archived tasks' parent | — | **0 visits** | — |
| resident summaries | 20 + n | **20** | 20 + n |
| minimal projections / graph children / sources | 20 + n | 20 + n / n / 0 | 20 + n |
| owed payloads resident | 10 | 10 | 10 |
| open: task-pass reads / selected-pass reads | 20 + n / 10 | 20 + n / 10 | 20 + n / 10 |
| rebuild: same, materialization high-water | same, **1** | same, **1** | same, **1** |

An archived entry's resident keys are exactly `archived, detailVersion, fingerprint, id, kind,
known, parentId, recordRevision, recordType, revision, status`, and its index membership is
`{ category, parentId, status }` (+ `sourceKey` when bound) — no envelope, details, operations or
update bodies. There are no acknowledgement sets to hold resident: consumer content is T7's.

The one red on the first run was **not** a prediction: an expectation I derived mid-run for the
terminal query (201) missed by one — a page that stops early reads the candidate that says "more"
plus one key of stream lookahead (202). Recorded in `state.md` when it happened.

Beyond the cohorts, the functional suites (`query`, `rebuild`, `structures`, `conformance`) cover
the plan's list: scope unions/dedup before paging; exact-status and class compatibility; due
absent/equal/before/after; remaining non-time prerequisites (a due query changes no record and no
generation); parent/reassignment/rescope/source-dedup index changes; every page boundary for 7
tasks at limits 1, 2, 3, 6, 7, 8, 200; cursor query mismatch, restart, foreign repository,
concurrent mutation, expiry and eviction; archive projection; rebuild after an interrupted record
update (visibility `replaced`) and after a failed index update; the pass order task → consumer →
selected-task with its read counts; the graph-validation workspace (one mark per task); live old-
generation release observed from inside the scan; and the page candidate budget returning a cursor
on an empty page.

**Scope gap, decided rather than inferred:** "unpruned-but-satisfied descriptors" and "live pins"
need consumer-record content (exact acknowledgements, issued receipts), which is T7's. The consumer
pass exists and is ordered and counted; with no acknowledgement content to join, every audience
link is owed. T7 fills the join and owns those assertions.

---

## Layer-1 review

`code-reviewer` on the full diff before coverage closure: **approved, no P1 or P2.** One P3: the
counter suite reuses one seeded repository per cohort size across tests — correct for deterministic
counters, and flagged only because M1's no-shared-corpus rule is adjacent. Dispositioned: M1 seeds
every arm in its own child process.

**Coverage closure, after review.** 100% on all four metrics, **no `c8 ignore`.** Three branches
were removed rather than tested because they could not happen: `SortedKeySet.has` (unused), the
descriptor-encoding failure (the descriptor is built from converted values; now `JSON.stringify`),
and optional chaining on sibling sets and due summaries whose existence the index maintains
together (now `!` with a comment; everything they imply is still re-checked). The rest got
behaviour tests: the candidate budget on a 3,400-task corpus, open-time duplicate source bindings,
quarantined tasks with a parent or binding, and misbehaving repositories against every conformance
check.

**Mutation matrix (T3's).** `--check` found one row moved by T4 — M20, "a write failure is
ignored", whose protected line now carries the cache invalidation — re-pointed and re-run: it goes
red (including on T4's own interrupted-update test). All 92 rows' patterns resolve.

---

## M1 — prediction manifest, then early measurements

`libraries/ts-agent-tasks/perf/residentMemory.js`, beside T3's mutation matrix. Run on demand
against the built package: `node perf/residentMemory.js [--reps 5]`. The parent measures nothing;
every arm seeds its own corpus on a real Node root under `/tmp` (ext4) in its own child, and a
fresh `node --expose-gc` child opens it through the production **durable** `open`. Raw data for the
recorded run: `.ai/tasks/active/agent-tasks-t4/m1-early.json`.

### The manifest, as stated before any run

Frozen in the harness's `MANIFEST` constant; copied here verbatim in substance.

- **Sample method.** Post-GC `heapUsed` after four forced `gc()` passes, never inside a measured
  open/rebuild; peaks are `heapUsed` sampled at every record read through an instrumented FileTree
  proxy — a **sampled** high-water, not an allocator maximum — plus the child's `maxRSS`. Five fresh
  processes per arm.
- **Fixture profile.** retained 25,000; non-archived 11,000; updates 100,000; audience links and
  acknowledgement ids 5,000,000; operations 100,000; logical bytes 64 GiB; resident payload 8 GiB;
  everything else default — declared because the default admits neither the cohorts nor, through
  closeout reservations, more than a few hundred non-archived tasks (see *Findings*).
- **Fixture validity.** 16 MiB of independently generated random hex allocates ≥ 80% of its payload
  and releases 80–120% of that (1 MiB noise); otherwise stop.
- **Archived growth.** 100 fixed tasks; 0 / 1,000 / 10,000 archived children of one parent, each
  with a 128-byte source key and ~8 KiB of unique presentation. Entry counts linear (projections =
  100 + n, children = n, sources = n). At 1,000 → 10,000 the minimal projection's post-GC increment
  is **≤ 25%** of the full-summary-retaining control's, and **≥ 1 MiB** (not flat).
- **Non-archived terminal.** 100 fixed + 100 / 500 / 900 terminal tasks with ~6 KiB of unique
  presentation each. 100 → 900 grows by **≥ 50%** of the added presentation (2 MiB noise); archiving
  all of them releases **≥ 50%** of their presentation (2 MiB noise); identities remain.
- **Cold-history peak.** 100 fixed + ≥ 64 MiB of archived cold details. Sampled peak above settled,
  cold open and warm rebuild, **≤ 25% of cold bytes + 16 MiB**; an all-record-buffering control
  exceeds that bound.

**Amendments, each dated in the manifest, none to a threshold:** (1) a one-repetition shakeout
found the peak fixture at 66,000,000 bytes, under its own 64 MiB precondition — the count went from
1,100 to 1,200 tasks; (2) after the first recorded run, the post-close residual was inflated by the
harness still holding the repository through `open`'s result — dropped, all arms re-run; (3) after
the second, settled heap after rebuild sat ~6.4 MiB above settled-after-open because the harness's
inspection snapshot referenced the old generation — dropped, all arms re-run. **All three recorded
runs passed every prediction**; the numbers below are the third, on `31914e3a` (source identical to
the reviewed code; later commits touch only the harness and docs).

### Early measurements

Node v22.22.2, V8 12.4.254.21, Linux 6.18 x64, ext4 `/tmp`. Medians of five, `[min–max]`, MiB.

| cohort | measured | prediction | |
|---|---|---|---|
| fixture | allocated 16.07 of 16; released 99.8% (all five identical) | ≥ 80%; 80–120% | **held** |
| archived, post-GC heap above baseline | minimal 1.02 / 2.55 / 15.32 at 0 / 1k / 10k; control 1.13 / 11.49 / 103.61 | — | |
| archived, 1k → 10k increment | minimal **+12.76**, control **+92.12**, ratio **0.139** | ≤ 0.25 and ≥ 1 MiB | **held** |
| archived, entry counts at 10k | projections 10,100; summaries 100; children 10,000; sources 10,000; hot-query task reads 0 | linear | **held** |
| terminal, post-GC heap | 1.85 / 5.09 / 8.16 at 100 / 500 / 900 | — | |
| terminal, 100 → 900 growth | **6.31** for 4.58 of added presentation | ≥ 50% − 2 MiB | **held** |
| terminal, archiving 900 releases | **5.36** of 5.15 presentation; projections kept, summaries back to 100 | ≥ 50% − 2 MiB | **held** |
| cold peak, 68.66 MiB cold details | open **16.37** [16.35–16.42] above settled; rebuild **17.88** [17.78–17.89]; bound 33.17 | ≤ bound | **held** |
| cold peak, buffering control | **76.68** [76.33–76.87] above settled | > bound | **held** |

Descriptive, not predicted: the minimal archived projection costs **≈ 1.45 KB per archived task**
(12.76 MiB / 9,000) — T3's projection object, its fingerprint string, index memberships, a child-set
entry and the 128-byte canonical source key. At 10k archived the cold open's sampled peak sits
20.5–20.9 MiB above settled and a warm rebuild's 32.0–32.4 MiB: records are parsed one at a time,
so the peak is allocation that no GC has yet reclaimed, not live records — sampled heap cannot
distinguish the two, and M1's later peak cohorts should add an allocation-profile arm. Warm
rebuild settles to within 0.04 MiB of the post-open heap (old generation released). Post-close
residual 0.7–1.1 MiB. Process `maxRSS` 110–112 MiB for the cold-peak arm vs 170–179 MiB for the
buffering control.

**What this does not qualify:** acknowledgement history, per-subscription records, receipt pins and
reservations under load — none exist until T7/T8, which is when M1 repeats in full. No production
profile is qualified by this run.

---

## What a later slice must decide

1. **The default capacity profile admits 146 concurrent non-archived tasks, not 1,000** (T1/T3
   arithmetic → T8/M1). Each registration's closeout claim reserves 7 × 64 KiB = 448 KiB of
   `resident-payload-bytes` (64 MiB limit); `audience-links`/`acknowledgement-ids` bind at 892
   and `logical-bytes` at 496. Measured: the 147th registration on `defaultTaskCapacityProfile` is
   refused `backpressure`. Either the reservation (schema maxima × 7 categories) or the defaults
   must move before the profile is advertised; T4 changed neither.
2. **T7 — the consumer pass's join.** The staged rebuild has its consumer pass in place (counted,
   ordered, header-only). T7 must subtract exact acknowledgements/dispositions from the owed
   descriptors there, keep satisfied-but-pinned payloads, and own the "unpruned-but-satisfied" and
   "live pins" tests. Until then every audience link on a retained update is listed as owed.
3. **T5 — views.** Repository queries are trusted host APIs. `IBoundTaskView` must bind cursors to
   the access identity and policy epoch (the handle table has room: a descriptor is any bounded
   JSON), filter after indexed selection and before inclusion, and never leak denied counts.
4. **T6 — source reconciliation work index.** T4 indexes source *identity* (binding → task, archived
   included) and refuses duplicate bindings. A per-source enumeration of reconciliation work is
   T6's to add, beside it.
5. **Read-concurrency classification.** The gate refuses `conflict`/`safe`, not `backpressure`,
   because `ITaskFailure` couples `backpressure` to a capacity dimension. If hosts need to
   distinguish working-space refusal from a concurrent writer, that is a `TaskFailureCode` or
   `ICapacityFailure` revision for whoever next owns the failure vocabulary.
6. **M1 peak method.** Sampled-heap peaks include unreclaimed garbage; the full M1 run after T7/T8
   should pair them with an allocation-profile or `--max-old-space-size` arm before a peak bound is
   used to size a host.

---

## Gates

Every step `.github/workflows/ci.yml` runs, run locally on the final source:

| gate | result |
|---|---|
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | change file found |
| `rushx build` (package) | clean, **zero warnings**; `etc/ts-agent-tasks.api.md` updated and checked in |
| `rushx lint` / `rushx fixlint` | clean; fixlint run before the final commits |
| `rushx test` (package) | **897 passed; 100% statements, branches, functions, lines; no `c8 ignore`** |
| `rush rebuild` (repo-wide) | `SUCCESS: 37 operations`, exit 0, no warnings — required: `ITaskRepository` gained members |
| `rush test` (repo-wide) | `SUCCESS: 36 operations`, exit 0 |
| `verify-capability-docs.mjs` | router 19,801/24,000, 24/24 documented, 75 reflexes, 0 failed |
| `generate-capability-feed.mjs --check` | 0 stale |
| `verify-esm-entrypoints.mjs` | 24 checked, 0 failed |
| `verify-bundler-resolution.mjs` | 20 checked, 0 failed |
| `verify-tarball-exports.mjs` | 26 packages, 205 paths, 0 failed |

**Layer 2 (Copilot) is driven on the PR**; its record is appended below as it happens.

### Copilot round 1 — 2 high, 2 medium, all real, all fixed

| finding | fix |
|---|---|
| `close` did not treat `rebuilding` as active: a re-entrant close from accessor code mid-scan released the root, then the scan published `ready` over it | `close` refuses (`conflict`, `safe`) while rebuilding; test closes from inside the scan and asserts the rebuild still completes ready and a later close succeeds |
| a task naming one scope twice (the scopes converter admits it) was removed twice, dereferencing a deleted set — a successful write became a `commit-indeterminate` fence | scope keys are deduplicated for every category; test changes and archives an `[A, A]` task |
| the consumer/source pass parsed records outside the materialization gate | the pass runs inside `gate.track`; test observes `inFlight === 1` during both reads |
| the cursor epoch was the raw host ID, so a non-identifier produced a page whose cursor the next request rejects | the epoch is validated with the identifier converter; a bad one fails `invalid` before any handle is issued |

Both high-severity tests were confirmed red against the pre-fix code, then green. **Evidence
currency:** the counter suite is part of the package suite and re-ran on this code (901 passing,
100%). M1 was measured on `31914e3a`; this round changes index bookkeeping (a `Set` per task add)
and gating, so M1 is re-run at the end of the Copilot loop before its numbers are claimed as final.
