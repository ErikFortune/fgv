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

<!-- sections below are completed after the final evidence run -->
