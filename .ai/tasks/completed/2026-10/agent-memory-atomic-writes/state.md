# State: `agent-memory-atomic-writes`

Worker-owned working surface. The brief is the contract.

## Plan

1. ts-json-base: additive optional `reason` on `IAtomicWriteCapabilities`, populated by the fs,
   in-memory and non-atomic `DirectoryItem` answers; fix the stale `directoryItem.ts` comment.
2. ts-agent-memory:
   - `rootOwnership.ts` — in-process guard (mirrors ts-agent-tasks).
   - `storeOpen.ts` — durability report/options types, resolution at open, temporary sweep, and
     the open-time types moved out of `fileTreeMemoryStore.ts` to keep it under the line cap.
   - `storeFileAccess.ts` — `writeRecordFile` / `deleteRecordFile` take the store's writer; atomic
     path with visibility settlement.
   - `fileTreeMemoryStore.ts` — wire `durability`, `dispose()`, create ordering.
3. Tests (red against base first), docs, change files, gates, close-out.

## Decisions taken inside the brief's latitude

- The guard keys a root by its directory item always, and additionally by absolute path unless
  the root's strongest guarantee is exactly `'session'` (an in-memory tree). A non-atomic root is
  path-keyed: nothing says it is not disk-backed, and refusing a duplicate is the safe answer.
  Revised mid-stream: session and path holders do NOT refuse each other (ts-agent-tasks' rule),
  since an in-memory tree is never the same root as a path-held one.
- A disposed store refuses further writes and deletes (both go through the writer), so a disposed
  instance can never be the second writer behind a new owner.
- A sweep failure warns and does not fail the open: a leftover temporary is not a `.md` file and
  cannot be read as a record.
- The durability report carries `removedTemporaries` alongside `atomic` / `guarantee` / `reason`.

## Open questions

(none yet)

## Progress

- [x] ts-json-base reason (525b04b13)
- [x] store implementation (3953ef903)
- [x] tests red-then-green (430bae8b8, 6b420f318) — evidence in result.md
- [x] docs + change files (979769be2)
- [x] gates — see result.md / final report
- [x] close-out

## Review round 1

Adversarial ref-only review of 5fed4dcb3 found the guard identity wrong (P1-1, P2-3, P2-4), a
symlinked-root regression (P1-2), a thrown open leaking its claim (P2-1), and a disposed store
still adding vectors (P2-2), plus P3-1 through P3-7. All are fixed per the coordinator's decisions.
The findings table, tests and red evidence are in `result.md` § Review round 1.
