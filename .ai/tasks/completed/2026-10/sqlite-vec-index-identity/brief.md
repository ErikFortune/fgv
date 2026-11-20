# Brief: `sqlite-vec-index-identity` — an embedding identity stored in the index file

Orchestrator-owned; frozen at kickoff. Put questions in `state.md`.

**Origin:** personaility#699 (fgv-ask). Long form:
`.ai/notes/fgv-share/ASK-2026-10-23-sqlite-vec-index-identity.md` on personaility `working`.
**Base / PR target:** `integration/asks`.

## Problem (verified)

`SqliteVecVectorIndex` and `SqliteVecFragmentIndex` (`libraries/ts-agent-memory-sqlite-vec/src/packlets/sqlite-vec-index/`) store only the `vec0` table. On reopen they recover the dimension from the DDL and nothing else. Two embedding models of the same width can't be told apart, so a model swap keeps serving vectors from another embedding space without an error. An identity kept outside the file can come apart from the vectors through a copy, restore or snapshot.

`rebuild` is not atomic: it lists the records, clears the table, then embeds in a loop with `await`s between steps. A crash partway through leaves a partial table that nothing can detect.

## Decisions

1. **Scope.** Only the two sqlite-vec classes. Don't change `IVectorIndex`/`IFragmentVectorIndex` or the in-memory indexes. An in-memory index has nothing persisted that could disagree with the caller, so storing an identity there would only copy what the caller already holds, creating a second source of truth.
2. **Storage.** One ordinary table, `fgv_sqlite_vec_meta(table_name TEXT PRIMARY KEY, identity TEXT, state TEXT NOT NULL CHECK (state IN ('complete','rebuilding')), meta_version INTEGER NOT NULL)`, keyed by `tableName` because one file may hold several indexes.
   - **Not** `<table>_meta`: `vec0` owns the `<table>_*` shadow namespace.
   - **Not** `PRAGMA user_version`: the consumer may own the connection.
   - **Not** in the `vec0` DDL or an auxiliary column.
   - **No migration.** A missing table or row reads as `absent`. Create the table lazily, on a write only.
3. **Parameter.** Add `identity?: string` on all four open/create param interfaces. It is opaque and always bound as a SQL parameter, never interpolated.
4. **Report.** A method that reads the row each time, not a snapshot taken at open:

   ```ts
   identity(): Result<IIndexIdentityReport>
   ```

   ```ts
   type IIndexIdentityReport =
     | { status: 'fresh' }                 // no vec0 table yet
     | { status: 'match' }
     | { status: 'mismatch'; stored: string }
     | { status: 'absent' }                // vectors exist, no stored identity
     | { status: 'incomplete'; stored?: string }  // a rebuild started and never finished
     | { status: 'unchecked'; stored?: string };  // no identity supplied by the caller
   ```

   Status depends on whether the `vec0` table exists. An orphan row left after a `DROP TABLE` reads as `fresh`, never `match`.
5. **When the identity is committed.**
   - **First write to a fresh index:** write the row in the same transaction that creates the table. The identity is fixed at the same moment as the dimension.
   - **`rebuild`:**
     - The clear becomes one synchronous transaction: delete the vectors and set the row to `state='rebuilding', identity=NULL`.
     - On success (including `'skip'` mode), a final transaction writes `identity=<the handle's identity>, state='complete'`.
     - On the `'fail'` rollback, the row stays `rebuilding`.
     - A crash leaves `incomplete`.
   - `rebuild` takes no identity argument; it commits the one the handle was opened with.
6. **Fencing.** While the status is `mismatch` or `incomplete`, `add`, `addFragments` and `query` fail loudly with a message naming the status. `rebuild` is allowed. Nothing is deleted automatically.
7. **`adoptIdentity()`.** Legal only when the status is `absent`, as a one-time migration from the consumer's sidecar without re-embedding. Refuse it for `mismatch` and `incomplete`, which need a rebuild.
8. **No fence on `absent`.** Legacy files keep working. A plain `add` doesn't commit an identity.
9. **Dimension.** Don't store it in the meta row; the DDL is its source.

## Native-boundary pitfalls (expect a substantive review loop)

- **Safe integers.** `defaultSafeIntegers` returns `meta_version` as a `bigint`; coerce it the way `size` does.
- **Statement lifetime.** Meta statements live in the retained `_stmts` set and are released in `release()`, or use `exec`. No unretained `prepare()`.
- **DDL in a transaction.** Prove with a test that `CREATE VIRTUAL TABLE … USING vec0` and the meta insert commit and roll back together inside a `better-sqlite3` `transaction()`.
- **Read-only and consumer-owned connections.** `open` and `identity()` never write. A commit on a read-only connection surfaces as a `Failure`.
- **Two connections on one path.** `SQLITE_BUSY` surfaces as a `Failure`, and the rebuild reports `incomplete`, not `complete`.
- **Dimension change.** A rebuild that changes dimension still fails. Document that a model swap to a different width still needs drop-and-re-index.
- **Downgrade hazard.** An older package version ignores the meta table. Document it.

## Acceptance

- [ ] Tests cover every status, every commit point, fencing, `adoptIdentity`, crash-during-rebuild (simulate by failing an embed partway), the orphan row, two indexes in one file, read-only, and safe-integer mode. Show each new test red first where a behaviour is new.
- [ ] README and `CAPABILITIES.md` updated, `api.md` regenerated, change file `minor` (additive).
- [ ] Gates:
  - package build, lint and test at 100%;
  - repo-wide `rush rebuild` and `rush test`;
  - `change --verify --target-branch origin/integration/asks`;
  - prettier 2.8.
- [ ] `result.md` lists every check-then-act window: identity read → write, clear → embed loop → commit, fence check → query.
- [ ] Close out per `finalize-task` to `.ai/tasks/completed/2026-10/sqlite-vec-index-identity/`, with a ledger entry (`#TBD`) and the feed.

## Mechanics

Work in your own worktree. Push only to `sqlite-vec-index-identity`; open no PR. Commit before running gates, and run gates in the foreground with per-worktree log paths. No sub-agents.
