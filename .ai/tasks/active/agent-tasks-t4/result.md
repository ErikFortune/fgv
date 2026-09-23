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

<!-- M1, gates, and what a later slice must decide follow -->
