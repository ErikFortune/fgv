# Result: `sqlite-vec-index-identity`

**Shipped:** `SqliteVecVectorIndex` and `SqliteVecFragmentIndex` store an opaque embedding identity in the index file itself, report it with `identity()` on every call, fence writes and queries while it disagrees or a rebuild never finished, and make a partial rebuild detectable instead of silent.

Origin: personaility#699 (fgv-ask). Base / PR target: `integration/asks`. Package:
`@fgv/ts-agent-memory-sqlite-vec` only. Change file `minor` (additive). PR: #TBD.

## What shipped

- **`identity?: string`** on all four param interfaces (`ISqliteVec{Vector,Fragment}Index{Create,Open}Params`).
  Opaque, always bound as a SQL parameter (a test round-trips `m'); DROP TABLE fgv_sqlite_vec_meta; --`).
- **`identity(): Result<IIndexIdentityReport>`** on both classes, and the exported
  `IIndexIdentityReport` union exactly as the brief specified
  (`fresh | match | mismatch{stored} | absent | incomplete{stored?} | unchecked{stored?}`). It
  reads `sqlite_master` and the meta row on every call, inside one read transaction (a consistent
  snapshot), and never writes. The `vec0` table's existence is checked first, so an orphan row reads
  as `fresh`.
- **`adoptIdentity(): Result<IIndexIdentityReport>`** on both classes: writes on `absent`; an
  idempotent no-op that succeeds without writing on `match`; refused for `mismatch`, `incomplete`,
  `fresh` and `unchecked`. Status check and write in one transaction; returns `{ status: 'match' }`.
- **Storage:** `fgv_sqlite_vec_meta(table_name TEXT PRIMARY KEY, identity TEXT, state TEXT NOT NULL
  CHECK (state IN ('complete','rebuilding')), meta_version INTEGER NOT NULL)`, created lazily by
  the first write that needs it. No migration. `meta_version` is `1`; a row with any other value is
  refused (`identity()` and every fenced call fail) rather than guessed at. The row is read through
  a `Converters.strictObject` that narrows a safe-integer-mode `bigint` to `number`.
- **Commit points:** the first fenced write to a fresh table creates the `vec0` table and writes the
  row in one `better-sqlite3` transaction. `rebuild`'s clear deletes the vectors and writes
  `state='rebuilding', identity=NULL` in one transaction; a final statement commits the handle's
  identity with `state='complete'` (on success, including `'skip'`). The `'fail'` rollback re-runs
  the clear, so the row stays `rebuilding`.
- **Fencing:** `add`, `addFragments` and `query` fail with a message naming `'mismatch'` or
  `'incomplete'` and the remedy. `rebuild` uses an internal unfenced write path. Nothing is deleted
  automatically. `absent` is not fenced, and a plain write on it commits nothing.
- **Shared helper:** `src/packlets/sqlite-vec-index/indexIdentity.ts` (`IndexIdentity`, internal),
  held by both index classes and released by their `release()`.
- **Docs:** README § "Embedding identity" (statuses table, commit points, limits incl. width
  change, the non-lock marker, and the downgrade hazard); `CAPABILITIES.md` paragraph plus a decision
  shortcut; class TSDoc on both classes; `api.md` regenerated (+26 lines, additive only).

## Interpretations where the brief was silent (each is a choice a reviewer may overturn)

1. **`incomplete` beats `unchecked`.** A handle opened without an identity is still fenced from a
   partial table. Partial is a fact about the data, not about the caller.
2. **A first write without an identity does not create the meta table**; if an orphan row exists for
   the table it is **deleted** in the same transaction. Otherwise a dropped-and-recreated index
   written by an identity-less handle would later report the orphan's identity as `match`.
3. **`rebuild` without an identity still writes the marker** (and so creates the meta table), and
   commits `identity=NULL, state='complete'`. Crash detection is worth having regardless.
4. **The final rebuild commit is conditional** on `state='rebuilding'` and must change exactly one
   row; a row deleted or committed by someone else during the loop fails the rebuild loudly instead
   of being overwritten.
5. **`adoptIdentity()` on `match`** — first shipped refused (brief-literal: "legal only when
   absent"), raised as a question, and **changed on the orchestrator's answer**: it is now an
   idempotent no-op that succeeds without writing, so a migration can run twice. Pinned on a
   read-only connection, where any write would fail.
6. **Fence ordering in `query`:** the existing cheap returns (`released`, `topK <= 0`, no table in
   this handle → `[]`, dimension mismatch) still come first; the fence runs immediately before the
   KNN read, inside the same transaction.
7. **A rebuild of a fresh index** writes the marker even though no `vec0` table exists yet; the
   status reads `fresh` until the loop's first write creates the table, after which a crash reads
   `incomplete`.

## Check-then-act windows

| window | what could interleave | what closes it / re-checks after it |
|---|---|---|
| **identity read → write: first write to a fresh table** (`_establish`) | another connection creates the table and commits its own row between our status read and our `CREATE` | The status read, `CREATE VIRTUAL TABLE`, and the row write share one transaction. The row is written only if the status read *inside* that transaction is `fresh`; otherwise the fence decides and the other row is left alone (pinned: "another connection creating the table first"). A lock upgrade that loses the race is `SQLITE_BUSY`, a `Failure`. The statements are prepared and kept only after that transaction commits, so a rollback leaves the handle as it was (pinned: "the vec0 CREATE and the identity insert roll back together"). |
| **identity read → write: fenced `add` / `addFragments`** | another connection starts a rebuild (marker) or rebuilds to a different identity between the fence and the write | Fence and write share one transaction; the write cannot commit against a state the fence did not see. |
| **identity read → write: `adoptIdentity`** | another connection writes an identity or starts a rebuild between the `absent` check and the adopt write | Check and write in one transaction. |
| **clear → embed loop → commit** (`rebuild`) | the loop `await`s the embedder; any other connection may run in between, and the process may die | (a) The clear and the `rebuilding` marker commit together, so a cleared table is never unmarked. (b) While the marker stands, every *other* handle's `add`/`query` is fenced as `incomplete`, so foreign writes cannot land in the partial table. (c) The final commit is conditional on the marker still being there (exactly one row changed); a deleted or already-committed marker fails the rebuild. (d) A crash, a `'fail'` rollback, or an unwritable final commit (`SQLITE_BUSY`, pinned) leaves `incomplete`. **Not closed:** a second `rebuild` of the same table on another connection is unfenced and writes the same marker, so two concurrent rebuilds are not detected. Documented in README and TSDoc as "a crash marker, not a lock". |
| **fence check → query** | another connection starts a rebuild between the check and the KNN read | Fence and KNN read share one (read) transaction, so they see one snapshot. |
| **standalone `identity()`** | another connection commits between its reads (`sqlite_master` for the table, `sqlite_master` for the meta table, then the row) | **Closed on the orchestrator's answer:** the reads share one deferred read transaction (a savepoint when called inside the fence's own transaction). The interleaving itself cannot be reproduced in a test — the reads are synchronous in one JS turn — so the test pins the property that excludes it: each of the three reads observes `db.inTransaction === true`, and none is left open afterwards. |
| **handle-cached `_stmts` vs the file** | the table is dropped externally after this handle prepared its statements | Pre-existing behaviour: the next statement fails loudly ("no such table"). `identity()` reads `fresh` from the file. |

## Red → green

New tests: `src/test/unit/indexIdentity.test.ts`, run on **both** lanes via `describe.each`
(35 cases per lane plus 2 cross-lane = 72 tests). Evidence, logs under `.gate-logs/red-*.log`:

- **Against the pre-stream source** (`9e68104bf` versions of `model.ts` and both index files): the
  suite does not compile (`TS2339 Property 'identity' does not exist on type 'SqliteVecVectorIndex'`,
  `TS2353 'identity' does not exist in type 'ISqliteVecVectorIndexCreateParams'`, …).
- **Mutations of the shipped source**, each reverted after the run, each turning exactly the tests
  that pin it red:

| mutation | tests that went red |
|---|---|
| `mismatch` fence disabled | `'mismatch' names the stored identity…`, `another connection creating the table first…` (both lanes) |
| `incomplete` fence disabled | `'incomplete' after a rebuild that never finished — the crash case` (both lanes) |
| clear writes `complete` instead of the `rebuilding` marker | every `incomplete` / commit-point test, plus the existing rebuild suites (34 tests) |
| orphan row counted as an existing table | both orphan-row tests, the DDL-rollback test, cross-lane test |
| `vec0` `CREATE` moved outside the transaction (record lane) | the DDL-rollback test and every test that expects a first write to commit the identity (17) |
| `meta_version` not narrowed from `bigint` | `safe-integer mode…` (both lanes) |
| final rebuild commit unconditional | `a marker that changed during the rebuild…` (both lanes) |
| `adoptIdentity` allowed for any status | `is refused for every other status`, `'incomplete' after a 'fail' rollback…` (both lanes) |
| fragment `query` unfenced | crash case + mismatch case (fragment lane) |
| record `add` unfenced | crash case + mismatch case (record lane) |
| *(follow-up)* `adoptIdentity` not idempotent on `match` | `is an idempotent no-op on 'match'…`, `a migration that adopts twice…` (both lanes) |
| *(follow-up)* `identity()` reads outside a transaction | `identity() takes both of its reads inside one transaction…` (both lanes) |

The mutation run for row 7 predates the follow-up; that refusal test was later renamed to
`is refused for 'fresh', 'mismatch' and 'unchecked'`.

### An existing test whose premise changed

`_clear prepares no statement — the throwaway release() could never drop` (both lanes) asserted
that a rebuild prepares **nothing**. A rebuild now has to prepare the meta table's statements the
first time, because they cannot be prepared before that table exists. They are **retained** (in
`IndexIdentity`'s statement cache, dropped by `release()`), which is the property the test
protects. The fixture `primed()` now runs one rebuild before the spy, and the assertion — no later
rebuild prepares anything, including on the rollback path — is unchanged. A throwaway statement
would still fail it.

## Gates

The repo-wide `rush rebuild` and `rush test` below ran on `9d12ff12c`, before the follow-up commit
(snapshot-consistent `identity()`, idempotent adopt on `match`). The orchestrator gates the merged
tree; after the follow-up only the package build, lint and test were re-run.

Logs in `.gate-logs/` (not committed). Graded by grep, not exit code.

| gate | result |
|---|---|
| `rushx build` (package) | exit 0; `not met|FAILURE|Operations failed|error TS` = 0; `warning` = 0 |
| `rushx lint` (package) | exit 0; 0 / 0 |
| `rushx test` (package) | exit 0; 0 / 0; **100 / 100 / 100 / 100**; 229 tests in 4 suites (re-run after the follow-up) |
| `rush rebuild` (repo) | exit 0; bad = 0; only warning is the Git-tracked symlink notice; **SUCCESS: 39 operations** |
| `rush test` (repo) | **36 of 38 operations green; 2 failed under load, both green when re-run alone** (below) |
| `rush change --verify --target-branch origin/integration/asks` | exit 0; finds `sqlite-vec-index-identity_2026-10-26-00-00.json` |
| prettier 2.8.8 `--check` on every touched file | clean |
| `generate-capability-feed.mjs` then `--check` | 2 targets updated, then 0 stale |
| `verify-capability-docs.mjs` | router 23,059/24,000, 0 failed |

**The two repo-wide `rush test` failures, re-run alone:**

- `@fgv/ts-res-cli`: 4 tests in `cli-configuration` and `cli-integration`. This package is on the
  known load-sensitive list. Run alone: exit 0, bad = 0, warning = 0.
- `@fgv/testbed`: 1 test, `KeyStoreSection under React.StrictMode › unlock completes`, where
  `onUnlocked` was never called. **This test is not on the known list.** It is a KeyStore unlock
  timing test, and nothing in it touches this package. Run alone: exit 0, bad = 0, warning = 0,
  `KeyStoreSection.test.js` 12 passed. testbed does depend on this package, but its two sqlite-vec
  scenario suites (`sqliteVecMemoryPersistence`, `sqliteVecFragmentPersistence`) passed in **both**
  runs.

## Things in the brief that turned out wrong or underspecified

- **"Meta statements live in the retained `_stmts` set."** They cannot: `_stmts` is `undefined`
  until a dimension is established, and `identity()` must work before that. They live in a
  retained, `release()`-dropped cache on `IndexIdentity` instead — the intent (no unretained
  `prepare()`) holds.
- **`incomplete; stored?`** — this package always writes `identity=NULL` with the marker, so
  `stored` is only ever present on an `incomplete` report if something else edited the row. The
  field is kept as specified.
- The brief listed "show each new test red first". For behaviours that are new API, red is a compile
  failure; the mutation table above is the stronger evidence and is what I'd point a reviewer at.
- Not wrong, but worth stating: the brief's "two connections → `SQLITE_BUSY` → `incomplete`" holds
  for the **final commit**. A `SQLITE_BUSY` at the *clear* fails the rebuild before anything is
  touched, and the status is whatever it was.

## Open / deferred

- Concurrent rebuilds of one table on two connections remain undetected (documented limit).
- Pre-existing, untouched: the `sqlite_master` schema probe in `create` is an unretained `prepare()`
  (already recorded in `CAPABILITIES.md`).
