# agent-tasks-t4 — indexed selection, paging, due and owed discovery

**Shipped**: 2026-09-23 via [PR #687](https://github.com/ErikFortune/fgv/pull/687) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

Slice T4 of `docs/design/agent-tasks/implementation-plan.md`. It put indexed selection over T3's
`FileTreeTaskRepository`: one resident index generation that every commit patches before it
returns success, answering `query`, `queryDue`, `listOwed` and `lookupSource` with no record reads.
Archiving drops a task's summary but keeps identity, edges, final status and source identity. A
post-commit index failure fences the repository instead of serving a stale read, and
`rebuildIndexes()` is the way out of that fence. The slice's evidence is **counters, not timings**.
Predictions were written in `state.md` before the first run and held at 0 / 1,000 / 10,000 of
unrelated history, with archived and non-archived cohorts measured separately. T4 also started the
M1 resident-memory harness: the prediction manifest was stated first, and the early run held every
prediction. No T1 member was revised and no persisted shape changed (the index is derived at open
and never persisted).

## Files changed

All in `libraries/ts-agent-tasks` (`@fgv/ts-agent-tasks`):

- `src/packlets/storage/`: `taskIndex.ts`, `queries.ts`, `sortedKeys.ts`, `workingSet.ts` (gate
  and record cache) and `conformance.ts` are new. `repository.ts`, `openRepository.ts` (the staged
  scan shared by open and rebuild), `model.ts`, `internals.ts` (evidence counters), `failures.ts`,
  `commitRules.ts`, `projection.ts` and `recordStore.ts` are extended.
- `src/packlets/types/query.ts`, `src/packlets/converters/queryConverters.ts`.
- `perf/residentMemory.js` (the M1 harness). `perf/mutationMatrix.js` changed only to re-point row M20.
- Tests: `storage/{query,rebuild,structures,conformance,counters}.test.ts`, plus the helpers
  `cohorts.ts` and `queryFixtures.ts`.
- `CAPABILITIES.md`, `README.md`, `etc/ts-agent-tasks.api.md`, change file. Repo docs:
  `docs/TECH_DEBT.md` (capacity entry), the plan's T4 status line, T1's declared-vs-exercised table.
- Raw M1 data: `m1-early.json` in this directory.

## Decisions made during execution

- **Cursors are server-held handles** (`<epoch>.<seq>`, with the epoch minted lazily through the host ID
  factory). Each handle keeps the normalized descriptor and a keyset position, never a page. Handles are bound to
  the query and the generation: at most 256, five-minute idle expiry, LRU eviction. An unknown, expired or
  other-generation handle is `cursor-stale`; a handle presented with a different query is `invalid`.
- **A page that exhausts its 1,024-candidate budget returns a cursor**, never a short
  "exhaustive" answer.
- **The materialization gate refuses `conflict`/`safe`, not `backpressure`.** T1's failure converter
  ties `backpressure` to a capacity dimension, and a working-space limit has none. `state.md`
  records this as a correction to its own decision 7.
- **Unpruned-but-satisfied descriptors and live pins are deferred to T7.** They need
  consumer-record content that only T7 creates. The consumer pass exists, in order and counted,
  but has no join, so every audience link on a retained update is listed as owed.
- **Vocabulary.** `PageCursor` got its encoding. `cursor-stale` and `commit-indeterminate` got
  real producers. `maxQueryDescriptorBytes` got its first producer. The runtime
  `ITaskRepositoryHealth['state']` gained `'rebuilding'`. `TaskLifecycleClass` is new. None of
  these is persisted.
- **Coverage closed with no `c8 ignore`.** Three branches that could not execute were removed
  instead of tested.
- Copilot rounds 1–4 found real bound and fencing gaps, and each fix has a test that went red
  before the fix:
  - a re-entrant `close` during rebuild
  - a duplicated scope that dereferenced a deleted set
  - writer preconditions answered from the record cache
  - an unbounded `lookupSource` binding
  - the conformance runner leaking ownership
  - two record reads outside the gate or the byte bound

  Round 5's only finding did not reproduce, so the loop stopped there on diminishing returns.

## Followups

Where each item from result.md § *What a later slice must decide* went:

1. **Default profile admits 146, not 1,000.** T4's PR added this to `docs/TECH_DEBT.md` as a P2.
   `agent-tasks-t8b` closed it by decision, and `agent-tasks-m1-stop` re-measured it.
2. **The consumer pass's join**, plus the unpruned-but-satisfied and live-pin tests. Taken up by
   `agent-tasks-t7`: its result describes joining exact history into satisfied links.
3. **View-bound cursors.** Built by `agent-tasks-t5`.
4. **A per-source reconciliation work index.** Not recorded in `TECH_DEBT.md` or `FUTURE.md`.
   `agent-tasks-t6` shipped an `unsettledCommands` index and a per-source checkpoint, but its
   result does not say it closes this item.
5. **Read-concurrency classification** (`conflict` vs a dedicated working-space code). Recorded
   nowhere durable.
6. **M1 peak method.** The full run in `agent-tasks-m1-stop` added old-space sampling beside
   `heapUsed`. That run does not record the allocation-profile or `--max-old-space-size` arm that
   T4 recommended.

## Lessons codified during the run

No rule was codified into `.ai/instructions/` by this PR. The run did produce these lessons:

- In a measurement harness, the harness's own inspection objects can hold the very generation it
  is measuring. Manifest amendments 2 and 3 each found a residual like this and re-ran every arm,
  without changing any threshold.
- An incremental Heft build can keep stale output from an out-of-band `tsc --outDir lib` revert
  check. Run revert checks from a clean build.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- M1 raw data: `m1-early.json`
- PR: [#687](https://github.com/ErikFortune/fgv/pull/687)
