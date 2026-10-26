# `agent-memory-cas-write` — a conditional (compare-and-set) record write for `FileTreeMemoryStore`

**Status:** shipped via #TBD into `integration/asks` (2026-10-26). Origin: personaility#701.

## What it delivered

- **`put(record, { expected })` / `delete(kind, entityId, { expected })`.** `expected` is the
  record's `envelope.seq` (a versioned kind's current version), or `'absent'` for `put`. Checked
  under the store's write lock, after the address resolves and **before any dedup**, on both
  layouts. A mismatch writes nothing, fails with `code: 'conflict'` and the seq found, and is still
  observed.
- **Under `expected`, success means the addressed record was written.** A put that would dedup onto
  another id fails `code: 'duplicate'` with `existingId`; without `expected` dedup is unchanged.
- **Classified failures (BREAKING).** `put` / `delete` return `MemoryWriteResult<T>`, a
  `DetailedResult` carrying `IMemoryWriteFailure`: `conflict`, `duplicate`, `invalid`, `rejected`,
  `not-found`, `io`. Callers chaining a plain-`Result` continuation add `.asResult`.
- **A seq is never issued twice.** Two alternating root slots, `memory-store.seq.a.json` /
  `memory-store.seq.b.json`, hold a reservation ceiling advanced in blocks of 64 before any seq it
  covers is issued; the open takes the larger readable ceiling. A write never overwrites the only
  good slot, so a torn write on a root without atomic writes is survived. This closes the hole where
  deleting the highest record let a reopened store re-issue its seq. `seq` is strictly increasing,
  not dense.
- **Ingest `merge-into` is conditional.** It writes under the target entity's snapshot seq and
  reports a moved target as disposition `'conflict'` and a duplicate as `'deduped'`, per candidate,
  without retrying.
- **In-process only**, by the user's decision: among writers sharing one store per root, which
  #700's single-writer guard enforces.

## Where to look

- `result.md` — the change list per brief decision, the **check-then-act table**, the **revert
  matrix** (every guarantee reverted, every test red), **review round 1**, and the gate counts.
- `revert-matrix.py` — the script that produced the matrix (paths are this worktree's).
- `brief.md` — the frozen contract. `state.md` — fact re-verification against #700, decisions and
  deviations as of the first pass (round 1 superseded its single-file high-water design).
- Code: `libraries/ts-agent-memory/src/packlets/store/{writeFailure,storeWriteCondition,storeSeq}.ts`,
  `fileTreeMemoryStore.ts`, `ingest/orchestrator.ts`; tests in
  `src/test/unit/store/conditionalWrite.test.ts` and the last block of `ingest/orchestrator.test.ts`.

## Deviations from the brief

- `not-found` and `duplicate` codes; `delete`'s `expected` is a seq only. `IMemoryWriteConflict`
  also carries `expected`.
- The interface change breaks callers as well as implementers, so it is plain `BREAKING:`.
- Without `expected`, a flat put now reads its same-id record before content dedup, so an
  unreadable same-id file fails it even when a cross-id duplicate exists.

## Left open

- Cross-process writers are outside the guarantee.
- An interrupted high-water write can leave a working file at the root, which nothing reads and the
  open-time sweep (record directories only) does not remove.
- An `embed` / `fragmentEmbedder` hook that awaits a write on its own store deadlocks (predates
  this stream; documented).
- `memory_write` / `memory_delete` tools do not expose `expected` to a model; no one asked.
