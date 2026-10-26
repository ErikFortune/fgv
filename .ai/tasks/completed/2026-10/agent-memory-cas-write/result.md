# Result: `agent-memory-cas-write`

**Shipped:** `FileTreeMemoryStore.put` and `delete` take an optional `expected` seq, checked under the write lock before any dedup, and a persisted seq high-water mark guarantees no seq is ever issued twice — so a read-modify-write can no longer silently lose a concurrent same-instance update.

Origin: personaility#701 (fgv-ask). Base / PR target: `integration/asks` (contains #756).

## What changed (`@fgv/ts-agent-memory`, minor, `BREAKING (implementers only):`)

Per brief decision:

1. **API.**
   - `put(record, options?: IMemoryWriteOptions)` with `expected?: number | 'absent'`;
     `delete(kind, entityId, options?: IMemoryDeleteOptions)` with `expected?: number`.
   - Both return `MemoryWriteResult<T>` = `DetailedResult<T, IMemoryWriteFailure>`, where
     `IMemoryWriteFailure = IMemoryWriteConflict { code: 'conflict'; expected; current } |
     IMemoryWriteError { code: 'invalid' | 'rejected' | 'not-found' | 'io' }`, plus
     `allMemoryWriteFailureCodes` (precedent: ts-agent-tasks `types/failure.ts`). New public
     module `store/writeFailure.ts`.
   - A mismatch writes nothing; the `'write'` / `'delete'` failure observation still fires.
   - Classification is explicit, not inferred from messages: input refusals before the vault is read
     are `invalid` (`classify(..., 'invalid')`); a precondition mismatch or a policy rejection
     travels through the pipeline as a `WriteRefusal` *value*; any pipeline `Failure` is `io`
     (`settleWrite`). Internal module `store/storeWriteCondition.ts`.
2. **Placement.** Inside `_enqueue`, after the address resolves:
   - flat: `_writeResolved` now reads the same-id record **first**, checks, and only then runs
     cross-id content dedup and the same-id no-op;
   - versioned: `_putVersioned` checks against `selectCurrentVersion(versions)` immediately after
     the snapshot, before the content hash and entity dedup;
   - delete: `_deletable` checks before the not-found test on both layouts.
3. **High-water mark.** `store/storeSeq.ts` `SeqHighWater`: file `memory-store.seq.json` at the
   root, `{ version: 1, reserved }`, written through the same writer as records (atomic when the
   root is; new `writeStoreFile` in `storeFileAccess.ts`). A `seq` past `reserved` is issued only
   after a new ceiling (`current + 64`) is written; the open resumes at
   `max(reserved, highest seq on disk)`. Missing file = derive from disk (old vaults open); an
   unreadable file fails the open with the remedy in the message. Fault model in the class TSDoc.
4. **Ingest.** `merge-into` writes with `expected` = the target entity's seq in the pre-ingest
   snapshot (flat: the target's own; versioned: the entity's current version, `'absent'` if
   soft-deleted — the verdict may name a superseded version). The orchestrator carries the seq its
   own earlier writes left at an entity forward, so two candidates merging into one target in one
   pass do not conflict with each other. A conflict is reported per candidate as disposition
   `'conflict'` with `IIngestedRecordResult.conflict`; the item succeeds and nothing is retried.
   Other write failures still fail the item. Small; done in-stream.
5. **Interface.** Consumer sweep over `libraries/ tools/ samples/`:
   - real implementation: `FileTreeMemoryStore` (updated);
   - object-literal doubles: `ingest/orchestrator.test.ts` `mockStore` (+ its `put kaput` override),
     `tools/memoryTools.test.ts` `failingStore` and `unresolvableStore` (updated to
     `succeedWithDetail` / `failWithDetail`);
   - callers relying on plain-`Result` chaining: `tools/memoryTools.ts` `memory_write` and
     `memory_delete` (`.asResult` added); `ingest/orchestrator.ts` (rewritten for the conflict
     branch);
   - `samples/testbed` (`memoryToolsGate` uses `get` only), `tools/`, `ts-agent-memory-sqlite-vec`:
     no `put` / `delete` consumers found.
   - **Not strictly implementers-only:** a caller chaining a plain-`Result` continuation onto
     `put` / `delete` (as `memoryTools.ts` did) gets a compile error and needs `.asResult`. The
     change file says so beside the brief's prefix.

Also, to keep `fileTreeMemoryStore.ts` under its cap (1989 → **1972** lines): mutable-patch
projection, the metadata comparison and `projectAsOf` moved to `store/storeMerge.ts`; the
observation fan-out moved to `store/storeObservation.ts` (`ObservationFanout`). Pure moves.

Test updates the new behaviour required (each a statement about the old world, not a weakening):
`indexInjection` "resumes seq" now asserts `seq > 1` (seq is no longer dense across a reopen);
`scopeDecoding` layout assertions exclude the store's own root file; `partialRead`'s `orphanOne`
helper now picks a `.md` record rather than the first file it meets.

## Check-then-act windows

Every mutation of the vault by one store instance — `put`, `delete`, `reconcile` — runs as a task on
`_enqueue`'s `_writeTail` chain, and each task runs to completion before the next starts. Another
instance on the same root is refused at `create` by the single-writer guard (#700). So inside a task
the only thing that could interleave is a same-instance mutator, and those are serialized. Reads
(`get`, `list`, …) are not locked and mutate nothing.

| # | operation | check | awaits between check and the act | act | why safe |
|---|---|---|---|---|---|
| W1 | flat `put` | `checkExpectation(expected, existing)` on the same-id record read in `_writeResolved` | AsyncResult hops (`.thenOnSuccess` after `policy.admit`); `await embedOnWrite` (host embedder); `await embedFragmentsOnWrite` (host fragment embedder). Content dedup, cohort, admit, `_buildRecord` (incl. a possible sync high-water write) are synchronous. | `_persist` → `writeRecordFile` | all inside the locked task; a dispose during the embed makes `_persist` fail at `checkWritable`, writing nothing |
| W2 | versioned `put` | against `selectCurrentVersion(versions)` right after the `_versionsForEntity` snapshot | AsyncResult hops after `_contentHash` and `policy.admit`; `await` embed + fragment embed | `_persist` of the new version, then `_invalidateCurrents` (sync, after the commit) | same as W1; the snapshot that fed the check is the one `priorCurrents` is invalidated from, both inside the task |
| W3 | flat `delete` | `_deletable` on the record read in `_deleteFlat` | none (`deleteRecordFile` and the index patch are synchronous) | `deleteRecordFile` | no window at all; vector pruning is post-commit and best-effort |
| W4 | versioned `delete` | `_deletable` on `selectCurrentVersion` of the snapshot | none | `_invalidateCurrents` | no window |
| S1 | seq allocation | `seq <= reserved` in `SeqHighWater.next` | none | the record write that uses the seq happens strictly after `next` returns | the ceiling write precedes the return of any seq it covers; a failed ceiling write returns a failure and issues nothing |
| S2 | open | read `reserved` and the highest on-disk seq | none (synchronous `create`) | first `next` | resumes past both before any write is possible |
| I1 | ingest `merge-into` | snapshot → plan (`mergeExpected`) | host stages (resolver, relater, embed, cycle guard), and earlier candidates' writes | `store.put(record, { expected })` | **not** a guarded window by design: the orchestrator holds no lock, so the store's check (W1/W2) is what makes it sound; the in-pass `written` map keeps the pass's own writes from reading as conflicts |

Derived-state rewrites that keep `seq` (`_rewriteEnvelope` restamps of `rank` / `embeddingRef`,
`_invalidateVersion`) run under the same lock and touch only state the next write recomputes, so a
caller's `expected` passing over one cannot lose a caller-authored update.

**Out of scope, by decision:** a second process over the same storage. The guarantee is in-process
only, as the TSDoc on `IMemoryWriteOptions.expected` and `IMemoryStore.put` says.

## Revert matrix

Each guarantee was reverted in source, the package recompiled, and the named test run
(`revert-matrix.py` in this directory, run after the final formatting; source restored after each). Every row
went red.

| # | guarantee reverted | test | result |
|---|---|---|---|
| R1 | flat check moved after cross-id content dedup | `the check precedes cross-id content dedup` | RED |
| R2 | flat check moved after the same-id no-op | `the check precedes the same-id no-op` | RED |
| R3 | versioned check moved after entity dedup | `compares with the current version, before entity dedup` | RED |
| R4 | `_enqueue` no longer waits on `_writeTail` (check outside the lock) | `of two same-instance writers expecting one seq, exactly one wins` | RED |
| R5 | delete ignores `expected` | both `delete` `a matching seq deletes; a stale one conflicts` cases | RED (2) |
| R6 | seq issued even when the high-water write fails | `is persisted before the seq it covers is used` | RED |
| R6b | no high-water persistence at all | `a seq freed by deleting the highest record is not re-issued after a reopen` (expected `> 2`, got `2`) | RED |
| R7 | reopen ignores the persisted mark | `a reopen resumes past the persisted mark` (expected `> 500`, got `1`) | RED |
| R8a | ingest passes no `expected` | `a target written after the snapshot is a per-candidate conflict` (got `merged`) | RED |
| R8b | ingest ignores its own in-pass writes | `two candidates merging into one target in one pass both merge` | RED |
| R8c | ingest expects the named (superseded) version | both versioned-merge tests (got `conflict`) | RED (2) |

Two existing ingest tests also went red during development before the `_expectedAt` fix
(`resolver verdict merge-into re-addresses…`, `merge-into UNIONs…`), which is how the
"`selectCurrentVersion` ignores flat records" mistake was caught.

## Gates

Run in the foreground from the worktree root on the committed tree (implementation `b0b69da24`,
docs `d8adfeced`). Graded by `grep -acE 'not met|Operations failed|error TS'` (must be 0) and
`grep -aiE warning` (only the tracked-symlink notice allowed).

| gate | result | bad | warnings |
|---|---|---|---|
| `rush install` | exit 0 | 0 | 0 |
| `rush change --verify --target-branch origin/integration/asks` | exit 0, change file found | 0 | 0 |
| `ts-agent-memory` `rushx build` / `lint` / `test` (100% coverage) | exit 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| `rush rebuild` (repo-wide) | exit 0, 13m15s | 0 | symlink notice only |
| `rush test` (repo-wide) | 35 succeeded; `ts-extras-mcp` failed on the known load-sensitive "a slow tool on a JSON-response server outlives the guarded fetch's headers deadline"; `testbed` and `ts-extras-re2` blocked behind it | 1 (`Operations failed`) | symlink notice only |
| `rush test --from @fgv/ts-extras-mcp` (rerun) | exit 0, 19 succeeded incl. `ts-extras-mcp`, `ts-extras-re2`, `testbed`, `ts-agent-memory`, `ts-agent-memory-sqlite-vec` | 0 | symlink notice only |
| `rushx fixlint`, prettier 2.8.8 on every changed `.ts` | clean | — | — |
| `max-lines` | `fileTreeMemoryStore.ts` 1972 / 2000 | — | — |
| `generate-capability-feed.mjs`, `--check`, `verify-capability-docs.mjs` | exit 0 / 0 stale / 0 failed | — | — |
