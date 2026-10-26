# `agent-memory-cas-write` — a conditional (compare-and-set) record write for `FileTreeMemoryStore`

**Status:** shipped via #TBD into `integration/asks` (2026-10-26). Origin: personaility#701.

## What it delivered

- **`put(record, { expected })` / `delete(kind, entityId, { expected })`.** `expected` is the
  record's `envelope.seq` (a versioned kind's current version), or `'absent'` for `put`. Checked
  under the store's write lock, after the address resolves and **before any dedup**, on both
  layouts. A mismatch writes nothing, fails with `code: 'conflict'` and the seq found, and is still
  observed.
- **Classified failures.** `put` / `delete` return `MemoryWriteResult<T>`, a `DetailedResult`
  carrying `IMemoryWriteFailure`: `conflict`, `invalid`, `rejected`, `not-found`, `io`.
- **A seq is never issued twice.** `memory-store.seq.json` at the root holds a reservation
  ceiling, advanced in blocks of 64 before any seq it covers is issued; the open resumes past it.
  This closes the hole where deleting the highest record let a reopened store re-issue its seq to a
  new record that a stale writer's `expected` would then match. `seq` is strictly increasing, not
  dense.
- **Ingest `merge-into` is conditional.** It writes under the target entity's snapshot seq and
  reports a moved target as disposition `'conflict'`, per candidate, without retrying.
- **In-process only**, by the user's decision: among writers sharing one store per root, which
  #700's single-writer guard enforces.

## Where to look

- `result.md` — the change list per brief decision, the **check-then-act table**, the **revert
  matrix** (every guarantee reverted, every test red), and the gate counts.
- `revert-matrix.py` — the script that produced the matrix (paths are this worktree's).
- `brief.md` — the frozen contract. `state.md` — fact re-verification against #700, decisions and
  deviations.
- Code: `libraries/ts-agent-memory/src/packlets/store/{writeFailure,storeWriteCondition,storeSeq}.ts`,
  `fileTreeMemoryStore.ts`, `ingest/orchestrator.ts`; tests in
  `src/test/unit/store/conditionalWrite.test.ts` and the last block of `ingest/orchestrator.test.ts`.

## Deviations from the brief

- A `not-found` code (a delete of an absent record without `expected`), and `delete`'s `expected`
  typed `number` only. `IMemoryWriteConflict` also carries `expected`.
- The interface change is not strictly implementers-only: a caller chaining a plain-`Result`
  continuation onto `put` / `delete` needs `.asResult` (`memoryTools.ts` did).

## Left open

- Cross-process writers are outside the guarantee.
- An interrupted high-water write can leave a working file at the root, which nothing reads and the
  open-time sweep (record directories only) does not remove.
- `memory_write` / `memory_delete` tools do not expose `expected` to a model; no one asked.
