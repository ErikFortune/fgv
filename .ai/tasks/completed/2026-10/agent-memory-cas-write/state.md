# State: `agent-memory-cas-write`

Worker-owned. The brief is frozen; questions and deviations live here.

## Fact re-verification against the base (`b003d0ce3`, on top of #756 `7f81295b1`)

| brief fact | current source | verdict |
|---|---|---|
| `seq` store-global, strictly increasing, assigned in `_buildRecord` and `_putVersioned` | `++this._seq` in both | holds |
| `seq` resumed at open from the highest on disk | `_initialIndex` walks entries, takes the max | holds — the ABA hole is real |
| `contentHash` covers only `{kind, body, links}` | `_contentHash` | holds — not the token |
| reconcile restamps (`_rewriteEnvelope`) and `_invalidateVersion` rewrite without changing `seq` | both spread the envelope, keep `seq` | holds |
| read side exposes `envelope.seq` | yes | holds |
| the write lock is `_enqueue` | yes; **since #700 it also calls `session.checkWritable()` at entry**, so a disposed store refuses before the task runs | holds, with the addition |
| flat content dedup in `_writeResolved` can return a different id's record, so the check must precede it | `_findByContentHash(scope, hash, excludeId)` runs before the same-id read | holds |
| `fileTreeMemoryStore.ts` near its cap | 1989 lines / 2000 | holds — headroom 11 lines |
| #700 moved record writes to `writeChildAtomically` | `writeRecordFile` → `writeAtomic` / `writePlain` in `storeFileAccess.ts`, through `StoreRootSession` | holds |

**Discrepancies / additions the brief did not state:**

1. `writeRecordFile` hard-codes `<idStem>.md` under a scope directory. A root-level store file
   needs a generic "write this named file atomically through the session" — factored out as
   `writeStoreFile`, which `writeRecordFile` now calls.
2. The open-time sweep (`sweepAtomicTemporaries`) only sweeps directories that hold a record file,
   and never the root. An interrupted high-water write can leave a working file at the root. I first
   extended the sweep to the root, then reverted that: it changed the sweep's documented contract
   and five #700 sweep tests for a rare, harmless, never-read leftover. Documented in the sweep's and
   `SeqHighWater`'s TSDoc instead.
3. The open walk already ignores every file at the root (`scopeSegments.length === 0`), so a
   root-level store file cannot be mistaken for a record. No change needed there.

## Decisions taken inside the brief's latitude

- **High-water is a reservation ceiling, advanced in blocks.** The file holds the highest `seq`
  the store may issue without writing again; a `seq` past it first persists a new ceiling
  (`current + 64`). This satisfies "advanced before the record write that uses the new `seq`" and
  costs one root write per 64 seq-consuming writes instead of one per write. Consequence: after a
  reopen the next `seq` resumes past the ceiling, so `seq` is strictly increasing but **not dense**.
  It never was a count (a failed write after `++seq` already burned one).
- **Ingest `expected` for a versioned target** is the entity's *current* version in the snapshot,
  not the verdict target's own seq (`selectCurrentVersion` ignores flat records, which is how a
  first version of this got every flat merge wrong — caught by two existing ingest tests).
- **Failure codes.** `invalid` = the input was refused before the store looked at the vault
  (non-string body, body converter, codec, layout, bad `expected`); `conflict` = precondition
  mismatch; `rejected` = the write policy's admission decision refused; `not-found` = delete of a
  record that is not there (see deviation 1); `io` = everything else (storage, index, a host
  callback that *failed* rather than decided).
- **The flat path reads the same-id record before content dedup** (it used to read it after).
  Uniform, so there is one ordering to reason about. Cost: one extra file read on a cross-id
  content-dedup hit.

## Deviations from the brief

1. **`not-found` code added.** The brief lists `conflict | rejected | invalid | io`. A delete of an
   absent record without `expected` was always a failure; filing it under `io` would tell a caller
   "storage broke" when it means "already gone". With `expected`, an absent record is a `conflict`
   with `current: 'absent'`, as the brief implies.
2. **`delete`'s `expected` is `number` only.** `'absent'` on a delete always ends in a conflict or
   a not-found, so the type rules it out rather than giving it a meaning.
3. **`IMemoryWriteConflict` carries `expected` as well as `current`.** Additive; the brief's shape
   is a subset.

## Ingest (decision 4)

Small enough to do in-stream. `merge-into` passes `expected` = the seq of the entity's current
record in the pre-ingest snapshot (not the verdict target's own seq, which for a versioned kind can
be a superseded version). Two candidates merging into the same target in one pass would otherwise
conflict with each other, so the orchestrator carries the seq its own merge just wrote forward to
the next candidate on the same entity. A conflict is reported per candidate as disposition
`'conflict'` with the store's `IMemoryWriteConflict`; the item does not fail and nothing is
retried. Any other write failure still fails the item, as before.

## Open questions

None blocking.
