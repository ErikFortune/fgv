# Result — `agent-tasks-t3`

**T3 does not close the stream.** Artifacts stay in `.ai/tasks/active/agent-tasks-t3/`. Written
2026-09-22.

---

## What shipped

**`FileTreeTaskRepository`** — one repository implementation over an injected
`FileTree` root. The in-memory and Node "adapters" are the two FileTree accessors that implement
the F1/F2 atomic capability; the storage packlet never imports `node:fs`, never sees a native
path, and never branches on which accessor is behind the root.

- `initialize` (empty root only) and `open` (existing manifest only), each taking
  `{ root, mode, environment, registry, converters?, profile? }`. `open` returns
  `{ state: 'ready', repository }` or `{ state: 'recovery-required', recovery }`.
- **Mode** `'session' | { durable: 'process-crash' }`. Durable on any root whose capability
  inquiry lacks `'process-crash'` fails `unsupported` before any I/O. Nothing stronger can be
  requested.
- **Private single-writer coordinator**: `withWriter(action)` hands an exclusive, lifetime-bound
  `ITaskRepositoryWriter` (`readCommit`, `register`, `commit`, `raiseCapacityLimits`). Nesting and
  concurrency are refused, not queued; a stale handle fails; no rollback is claimed.
- **Strict JSON storage records** (`IResolvedTaskCommitRecord` / `IUnresolvedTaskCommitRecord`),
  RFC 8785 canonical encoding, validated by one converter on both the write path and the read
  path.
- **Flat repository inventory** (`repository.json`): format, repository id, the stored capacity
  profile, and `tasks` / `consumers` / `sources` entries (`live`, or `pending` with the canonical
  request and the claims it owns).
- **Ordered record registration**: pending entry → record → live entry.
- **One-task atomic replacement** of state + owed updates + operation evidence + claims, with
  three explicit purposes (`operation` / `observation` / `maintenance`).
- **Inventory-backed missing-record detection** and open-time validation of every record, the
  parent graph, claim-id uniqueness and the stored policy.
- **Diagnostic recovery handle** (`ITaskRecoveryHandle`: `report`, `readRaw`, `close`) that holds
  the root and writes nothing.
- **A3**: profile persisted in the manifest; claims persisted in their owning record (pending
  entry, then task record, by the same claim ids); the derived `CapacityLedger` rebuilt at every
  open; admission of every dimension under the writer before any write; `capacityStatus()`;
  `raiseCapacityLimits` (atomic; lowering refused; preflighted against the policy it commits).

*(The mutation, coverage and gate sections below are completed at the end of the slice.)*
