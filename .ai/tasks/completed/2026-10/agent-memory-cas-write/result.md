# Result: `agent-memory-cas-write`

**Shipped:** `FileTreeMemoryStore.put` and `delete` take an optional `expected` seq, checked under the write lock before any dedup, and a persisted seq high-water mark guarantees no seq is ever issued twice — so a read-modify-write can no longer silently lose a concurrent same-instance update.

Origin: personaility#701 (fgv-ask). Base / PR target: `integration/asks` (contains #756).

## What changed (`@fgv/ts-agent-memory`, minor, `BREAKING:`)

*As amended by review round 1 (see the section of that name): plain `BREAKING:`, a `duplicate`
code, and a two-slot high-water mark. Items below describe what ships.*

Per brief decision:

1. **API.**
   - `put(record, options?: IMemoryWriteOptions)` with `expected?: number | 'absent'`;
     `delete(kind, entityId, options?: IMemoryDeleteOptions)` with `expected?: number`.
   - Both return `MemoryWriteResult<T>` = `DetailedResult<T, IMemoryWriteFailure>`, where
     `IMemoryWriteFailure = IMemoryWriteConflict { code: 'conflict'; expected; current } |
     IMemoryWriteDuplicate { code: 'duplicate'; existingId } |
     IMemoryWriteError { code: 'invalid' | 'rejected' | 'not-found' | 'io' }`;
     `MemoryWriteFailureCode` is `StringOneOf<typeof allMemoryWriteFailureCodes>` over one `as const`
     array (precedent: ts-agent-tasks `types/failure.ts`, `openReport.ts`). New public module
     `store/writeFailure.ts`.
   - Under `expected`, success means the addressed record was written: a flat `'content'` put that
     would dedup onto another id fails `duplicate` instead (round 1, P2-3).
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
3. **High-water mark.** `store/storeSeq.ts` `SeqHighWater`: two root slots,
   `memory-store.seq.a.json` / `memory-store.seq.b.json`, each `{ version: 1, reserved }`, written
   through the same writer as records (atomic when the root is; new `writeStoreFile` in
   `storeFileAccess.ts`). A `seq` past the mark is issued only after a new ceiling (`current + 64`)
   is written — to the missing, unreadable or lower slot, never the only good one. The open takes
   the larger readable ceiling and resumes at `max(mark, highest seq on disk)`. No slot = derive from
   disk (old vaults open); slots present but none readable fail the open, naming both and the cost
   of deleting them; a root directory with either name is refused. Fault model in the class TSDoc.
4. **Ingest.** `merge-into` writes with `expected` = the target entity's seq in the pre-ingest
   snapshot (flat: the target's own; versioned: the entity's current version, `'absent'` if
   soft-deleted — the verdict may name a superseded version). The orchestrator carries the seq its
   own earlier writes left at an entity forward, so two candidates merging into one target in one
   pass do not conflict with each other. A conflict is reported per candidate as disposition
   `'conflict'` with `IIngestedRecordResult.conflict`; a `'duplicate'` (the merged content already
   exists as another record) as the existing disposition `'deduped'` with `id` = that record's id —
   its documented meaning, "not written; an existing record satisfied it". The item succeeds and
   nothing is retried. Other write failures still fail the item. Small; done in-stream.
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
   - **Not implementers-only:** a caller chaining a plain-`Result` continuation onto `put` /
     `delete` (as `memoryTools.ts` did) gets a compile error and needs `.asResult`. So the change
     file, the ledger and this heading use plain `BREAKING:` (round 1, P2-1).

**Behaviour change without `expected`:** a flat put now reads its same-id record before content
dedup, so a same-id file that cannot be read fails the put (`io`) even when a cross-id duplicate
exists; before, it could succeed by deduping without reading its own file. Pinned by
`a same-id file that cannot be read fails the put even when a cross-id duplicate exists`.

**Caveat (predates this stream):** `embed` and `fragmentEmbedder` run inside the write lock, so a
hook that awaits `put` / `delete` / `reconcile` on the same store deadlocks — the write queues
behind the one awaiting it. Now stated on both hooks' TSDoc and in the README.

Also, to keep `fileTreeMemoryStore.ts` under its cap (1989 → **1982** lines after round 1): mutable-patch
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
| S1 | seq allocation | `seq <= reserved` in `SeqHighWater.next`, then the slot choice | none | the record write that uses the seq happens strictly after `next` returns | the ceiling write precedes the return of any seq it covers; a failed ceiling write returns a failure, issues nothing, and marks its slot unreadable so the good one is never the next target |
| S2 | open | read both slots and the highest on-disk seq | none (synchronous `create`) | first `next` | resumes past both before any write is possible |
| D1 | conditional flat put | content-dedup match under `expected` | none | refusal returned instead of the other record | the duplicate decision is made in the same locked task as the check, before anything is written |
| I1 | ingest `merge-into` | snapshot → plan (`mergeExpected`) | host stages (resolver, relater, embed, cycle guard), and earlier candidates' writes | `store.put(record, { expected })` | **not** a guarded window by design: the orchestrator holds no lock, so the store's check (W1/W2) is what makes it sound; the in-pass `written` map keeps the pass's own writes from reading as conflicts |

Derived-state rewrites that keep `seq` (`_rewriteEnvelope` restamps of `rank` / `embeddingRef`,
`_invalidateVersion`) run under the same lock and touch only state the next write recomputes, so a
caller's `expected` passing over one cannot lose a caller-authored update.

**Out of scope, by decision:** a second process over the same storage. The guarantee is in-process
only, as the TSDoc on `IMemoryWriteOptions.expected` and `IMemoryStore.put` says.

## Revert matrix

Each guarantee was reverted in source, the package recompiled, and the named test run
(`revert-matrix.py` in this directory, rerun in full after review round 1 on the final formatted
code; source restored after each). Every row went red.

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
| R12 | conditional put dedups onto another id and reports success | `under expected, a dedup onto another id is a duplicate, not a success` | RED |
| R12b | ingest does not map `duplicate` to `deduped` | `a merge whose content already exists elsewhere is deduped onto that record` | RED |
| R13 | open fails on any unreadable slot | `a torn slot beside a good one opens, continues past the good ceiling` | RED |
| R14 | no alternation: always write slot a | the torn-slot test and `the alternation survives a reopen` | RED (2) |
| R15 | a root directory on a slot name is not refused | both `a root directory named … is refused at open` cases | RED (2) |

Two existing ingest tests also went red during development before the `_expectedAt` fix
(`resolver verdict merge-into re-addresses…`, `merge-into UNIONs…`), which is how the
"`selectCurrentVersion` ignores flat records" mistake was caught.

## Gates — before review round 1

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

## Review round 1

The coordinator's review of `6610ec8a0` found no P1s; check→write atomicity held under every probe.
Each finding, what changed, the test that pins it, and the revert that turns it red:

| finding | fix | test | red under |
|---|---|---|---|
| **P2-1** `.onSuccess` returning a plain `Result` no longer type-checks for callers, so not implementers-only | plain `BREAKING:` (still `minor`) in the change file, the ledger bullet and this file's heading; `.asResult` sentence kept | — (docs) | — |
| **P2-2** a torn `memory-store.seq.json` on a plain root failed every open, `'skip'` notwithstanding | two alternating slots `memory-store.seq.{a,b}.json`; open takes the max readable; fails only if slots exist and none reads, naming both and that deleting them reopens the ABA hole; each write goes to the missing / unreadable / lower slot, re-derived at every open | `a torn slot beside a good one…`, `the alternation survives a reopen…`, `one slot, unreadable` / `both slots torn` fail the open | R13, R14 |
| **P2-2 / P3** a root directory on a slot name | refused at open with a named message (the walk would otherwise read it as a scope) | `a root directory named %s is refused at open` ×2 | R15 |
| **P2-3** a conditional put that content-dedups onto another id reported success, addressed record unchanged (probe4 [13]) | under `expected`, fail `duplicate` with `existingId`, write nothing, observation still fires; unconditional dedup unchanged | `under expected, a dedup onto another id is a duplicate, not a success` | R12 |
| **P2-3** ingest | `duplicate` on a `merge-into` surfaces as disposition `'deduped'` with the existing record's id — that disposition's documented meaning — rather than `conflict`, which means "the target moved" and would send a host to re-read the wrong record | `a merge whose content already exists elsewhere is deduped onto that record, not merged` | R12b |
| P3 `MemoryWriteFailureCode` | one `as const` array + `StringOneOf` | `the failure-code vocabulary is closed and complete` | — |
| P3 api.md | `{@link ObservationFanout}` → code span; `IMemoryWriteConflict` / `IMemoryWriteDuplicate` / `IMemoryWriteError` members documented | api.md regenerated | — |
| P3 `validateExpectation` | `allowAbsent` flag (delete refuses `'absent'`); message prints `JSON.stringify(expected)` | `delete refuses expected: 'absent' as invalid` (`got "absent"`) | — |
| P3 seq-file wording | `writeStoreFile(…, subject)`: `'seq'` messages speak of "the seq high-water mark" and drop the index sentence; a root *listing* failure in `SeqHighWater.open` carries no delete remedy | — (message text) | — |
| P3 behaviour change | documented: without `expected`, an unreadable same-id file now fails `io` even with a cross-id duplicate | `a same-id file that cannot be read fails the put even when a cross-id duplicate exists` | — |
| P3 embed-hook deadlock caveat | stated here, on `embed` / `fragmentEmbedder` TSDoc, and in the README | — | — |
| P3 annotation | `orchestrator.ts` `put: MemoryWriteResult<IMemoryRecord<unknown>>` | — | — |

The merge of `origin/integration/asks` was a no-op: it had not advanced past `7f81295b1`. The
duplicated "N streams, newest first" lines in `docs/workstreams/2026-10.md` were collapsed to one,
recounted from the stream entry headings.

## Gates — after review round 1

Recorded below once run.
