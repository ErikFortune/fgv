# State — `agent-tasks-t4`

Resume by reading `brief.md`, then this file newest-entry-last.

---

## 2026-09-23 — kickoff: inputs verified, design fixed, predictions written

**Missing-input check.** Every required-reading file exists and the tree matches the brief: branch
`claude/agent-tasks-t4` at `c6d8ef33` over T3 `f8961a97`, T2 `0249e85d`, T1 `1337c27c`. `perf/`
holds T3's `mutationMatrix.js`. T3's storage keeps a minimal per-task projection only; there is no
summary, index, query, cursor or rebuild code yet, exactly as T3's result says.

**One scope gap, resolved by decision rather than inference.** The plan's T4 test list names
"unpruned-but-satisfied descriptors" and "live pins". Both depend on consumer-record content
(exact acknowledgement sets and issued-receipt pins), which is T7's and which T3 validates only by
header. T4 builds the staged rebuild with the consumer pass in its place (task pass → consumer
pass → selected-task pass) and tests the pass order, the descriptor-without-payload shape and the
selected reload; with no acknowledgement content to join, **every audience link on a retained
update is owed**. T7 fills the join and owns the satisfied/pinned assertions. Recorded in
`result.md` under "what a later slice must decide".

### Design decisions

1. **Indexes first; queries fall out.** One internal `TaskIndex` per generation holds:
   - `summaries: Map<TaskId, ITaskSummary>` — resolved, non-archived, registered-kind tasks only
     (open *and* terminal-awaiting-cleanup).
   - Ordered sets (sorted arrays of string keys, binary-search insert/delete, keyset iteration)
     for `(scope, class)`, `(scope, exact status)`, responsibility, direct children (non-archived)
     and per-scope due keys `(notBefore, taskId)` of waiting tasks with a `notBefore`.
   - `unresolved: Map<TaskId, IUnresolvedTaskReference>` plus its own scope index; no lifecycle
     membership invented.
   - Quarantined (unregistered-kind) tasks: a scope index only, so a query whose scopes touch one
     reports it as an issue with `completeness: 'partial'` instead of silently omitting it.
   - Owed: per-subscription ordered set of update keys plus one payload map of updates whose
     audience is non-empty — independent of every lifecycle index, so terminal and archived
     obligations stay discoverable.
   - Graph/source (all retained, archived included): child adjacency and a canonical
     source-identity → task map. Archived tasks keep only T3's minimal projection plus final
     status and the source key: no envelope, details, operations or update bodies.
2. **Query plan.** Validate and normalize (scopes deduped and sorted; statuses deduped, checked
   against the class; limit default 50, max 200; descriptor ≤ `maxQueryDescriptorBytes`). An empty
   scope list matches nothing. Drive from the cheapest of: the k-way merge of per-scope status
   streams, the parent's child set, the responsibility set; dedup by task ID in the merge, then
   filter per candidate on the resident summary — before paging. Per-page candidate budget 1,024;
   exhaustion returns a cursor, never an "exhaustive" empty answer.
3. **Due.** Forces `waiting`; requires class `open`/`all` and, when statuses are given, that they
   include `waiting` — anything else is `invalid`, not an empty page. Absent `notBefore` excluded;
   `notBefore == cutoff` included; unresolved references are excluded (no `notBefore`). Order
   `(notBefore, taskId)`. The iteration stops at the first key past the cutoff in each stream.
4. **Cursors are server-held handles** (token = lazily minted epoch + sequence; the epoch is minted
   on first issuance, never at open, which T3 keeps free of ID mints). A handle retains the
   normalized descriptor and last key only — never a page. ≤ 256 per repository, five-minute idle
   expiry on the injected clock, LRU eviction. Unknown/expired/evicted/other-generation →
   `cursor-stale`; a handle presented with a different query → `invalid`. Any committed change
   advances the generation, so paging restarts on mutation.
5. **Commit path.** After the atomic write succeeds: projection, ledger, then index patch. An index
   patch failure fences (`unavailable`, issue "indexes stale; rebuild") and returns
   `commit-indeterminate` with the operation id. `rebuildIndexes()` is the way out.
6. **Staged rebuild, shared with open.** Open and rebuild run one scan: pass 1 reads task records
   one at a time, validates (all of T3's checks), projects summary/minimal entries and **update
   descriptors without payloads**, and releases the record; pass 2 reads consumer and source
   records one at a time (header only in this release); graph validation is O(N+E) with one mark
   per task; pass 3 reloads only records holding owed descriptors, re-checks each record's
   fingerprint against pass 1, and keeps just the owed payloads. Rebuild refuses under an active
   writer, drops the old index and cursor handles **before** scanning, fences queries as
   `rebuilding`, and on any blocking issue leaves the repository `unavailable` with the issues —
   never a healthy empty index.
7. **Bounded working space.** A materialization gate (default 4) around every record parse; with a
   synchronous FileTree only re-entrant host code (a kind converter calling back into the
   repository) can exceed it, and it gets `backpressure` (`retry: 'safe'`), never a queue. Optional
   parsed-record LRU, disabled by default, ≤ 32 entries and ≤ 8 MiB encoded charge, keyed by task
   and invalidated by record revision/fingerprint.
8. **Source dedup.** Registration refuses (`conflict`) a binding whose canonical identity another
   retained task already holds, before any write; open reports a duplicate as blocking integrity.
9. **Evidence counters are internal** (`storage/internals.ts`, not exported from the packlet):
   task/consumer record reads, candidate visits, materializations in flight and their high-water,
   graph-validation workspace, rebuild pass log; plus a projection-shape inspector.
10. **Conformance suite** is framework-free and exported: a runner that drives any
    `ITaskRepository` factory through the behavioural contract and returns named check results, so
    a host asserts it in whatever test runner it uses.

### T1/T3 vocabulary

No persisted shape changes planned. `ITaskRepositoryHealth['state']` gains `'rebuilding'` (a T3
runtime type, not on disk). `PageCursor` gets its encoding (opaque handle token); `cursor-stale`
and `maxQueryDescriptorBytes` get their first producers.

### Counter predictions — written before any run

Fixture: a fixed matching set in scope `A` — 20 open tasks (5 waiting with `notBefore` ≤ cutoff),
one subscription `s1` owed 10 updates — while unrelated history grows through **0, 1,000, 10,000**
under a declared fixture profile (retained 25,000 / non-archived 11,000), archived and
non-archived terminal cohorts separately; due tests separately grow future-dated and non-waiting
candidates.

| query | prediction at 0 / 1k / 10k | a miss means |
|---|---|---|
| `open` in `A`, warm | candidate visits = 20 exactly, identical at every size; task-file reads 0 | the open index holds terminal members, or the query filters a wider set |
| `terminal`/`all` in `A`, archived cohort | visits = terminal non-archived matches only (0 extra) at every size | archived tasks still in summary/index sets |
| `listOwed(s1)` | visits = 10 at every size, both cohorts; reads 0 | owed lookup scans task history |
| due in `A` | visits = 5 matches + 1 stop-peek per scope stream, identical as future/non-waiting candidates grow | due iteration visits past the cutoff or non-waiting tasks |
| inspection | summaries = resolved non-archived count; archived entries carry no envelope/details/operations/updates; child/source entry counts exact; resident payloads = owed updates | a category projection retains what it should not |
| rebuild | task reads = N (pass 1) + records with owed updates (pass 3); materialization high-water 1 | rebuild buffers records |

---

## 2026-09-23 — first counter run; a profile finding

**Counter predictions: all held at 0 / 1,000 / 10,000** on the first run, archived and non-archived
cohorts separately (open 20 visits, owed 10, due 6 = 5 + the stop key, zero task reads; archived
never visited by terminal/all/child queries; summaries = resolved non-archived; rebuild reads N +
10). The one red was an expectation I derived during the run, not a prediction: a terminal query
that stops at 200 reads 202 keys (the extra candidate that says "more", plus one key of stream
lookahead). Corrected in the test, recorded here.

**Finding — the default profile admits 146 concurrent non-archived tasks, not 1,000.** Each
registration's closeout claim reserves `maximumClosureCharges`: 7 updates × 64 KiB = 448 KiB of
`resident-payload-bytes` (limit 64 MiB → 146), 224 audience links / acknowledgement ids (limit
200,000 → 892), ~1.03 MiB of `logical-bytes` (512 MiB → 496). Confirmed empirically: the 147th
registration on `defaultTaskCapacityProfile` is refused `backpressure` on `resident-payload-bytes`.
The counter cohorts and M1 therefore declare a finite fixture profile that raises those dimensions.
Not T4's to change (T1/T3 arithmetic, T8/M1 profile qualification) — carried to `result.md`.

**Two corrections to the kickoff entry, disclosed rather than edited in place.** (1) The fixture
profile as first declared (retained 25,000 / non-archived 11,000) could not hold its own cohorts:
the first seeding attempt opened as a recovery handle, over `audience-links` and
`acknowledgement-ids`, before any counter was measured. Those two, `logical-bytes` and
`resident-payload-bytes` were raised to finite values stated in `src/test/helpers/cohorts.ts`; no
prediction changed. (2) Decision 7 said the materialization gate refuses with `backpressure`. T1's
failure converter couples `backpressure` to a capacity dimension, which a working-space limit does
not have, so the gate refuses `conflict` / `retry: 'safe'` — T3's classification for a concurrent
writer.
