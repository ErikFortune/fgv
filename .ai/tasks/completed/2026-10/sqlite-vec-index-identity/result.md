# Result: `sqlite-vec-index-identity`

**Shipped:** `SqliteVecVectorIndex` and `SqliteVecFragmentIndex` store an opaque embedding identity in the index file itself, report it with `identity()` on every call, fence writes and queries while it disagrees or a rebuild never finished, and make a partial rebuild detectable instead of silent.

Origin: personaility#699 (fgv-ask). Base / PR target: `integration/asks`. Package:
`@fgv/ts-agent-memory-sqlite-vec` only. Change file `minor` (additive). PR: #753.

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
7. **A rebuild of a fresh index** writes the marker even though no `vec0` table exists yet.
   *Originally* the status read `fresh` until the loop's first write created the table. **Review
   round 1 (P1-1) showed that was a hole** — another handle took the `fresh` path, created the table
   and certified its own identity over the rebuild's vectors — so a `rebuilding` row now reads
   `incomplete` whether or not the table exists. Only a `complete` row orphaned by a `DROP TABLE`
   still reads `fresh`.

## Check-then-act windows

| window | what could interleave | what closes it / re-checks after it |
|---|---|---|
| **identity read → write: first write to a fresh table** (`_establish`) | another connection creates the table and commits its own row, **or starts a rebuild of the still-fresh index**, between our status read and our `CREATE` | The status read, `CREATE VIRTUAL TABLE`, and the row write share one **immediate** transaction, so the write lock is held from the first read. The row is written only if the status read *inside* that transaction is `fresh`; otherwise the fence decides and the other row is left alone (pinned: "another connection creating the table first"). A `rebuilding` row reads `incomplete` even with no table, so this path refuses during another handle's rebuild of a fresh index (round-1 P1-1; pinned: "a fresh index being rebuilt reads incomplete to every other handle…"). The row write is SQL-conditioned on `state = 'complete'`, and the identity-less orphan delete likewise, so no fenced path can erase or overwrite a marker even if the fence ordering changes. The statements are prepared and kept only after that transaction commits, so a rollback leaves the handle as it was (pinned: "the vec0 CREATE and the identity insert roll back together"). |
| **identity read → write: fenced `add` / `addFragments`** | another connection starts a rebuild (marker) or rebuilds to a different identity between the fence and the write | Fence and write share one **immediate** transaction; the write cannot commit against a state the fence did not see. Because the write lock is taken at `BEGIN`, a busy file waits on `busy_timeout` instead of failing the read-to-write upgrade at once with `SQLITE_BUSY` / `BUSY_SNAPSHOT` (round-1 P2-3; pinned: "a fenced write takes the write lock before its fence read"). |
| **identity read → write: `adoptIdentity`** | another connection writes an identity or starts a rebuild between the `absent` check and the adopt write | Check and write in one immediate transaction. On `match` nothing is written. |
| **clear → embed loop → commit** (`rebuild`) | the loop `await`s the embedder; any other connection may run in between, and the process may die | (a) The clear and the `rebuilding` marker commit together in one immediate transaction, so a cleared table is never unmarked; the clear first refuses a meta row this version cannot read (round-1 P3-6). (b) What is deleted is decided from the file (`sqlite_master`), not from this handle's cached statements, and a table another connection created after this handle opened is emptied and adopted (round-1 P2-2; pinned: "a rebuild by a handle opened before another connection created the table empties that table too"). (c) While the marker stands, every *other* handle's `add` / `addFragments` / `query` is fenced as `incomplete` — **including on a fresh index whose table does not exist yet**. The first version of this row claimed that and it was false: `report()` returned `fresh` without reading the row when the table was missing, so another handle created the table and certified its identity over the rebuild's vectors (round-1 P1-1, reproduced by p4.js on both lanes). It is true now. (d) The rebuild's own table creation re-checks, inside an immediate transaction, that the table is still absent and the row is still its uncommitted marker; a table that appeared or a marker that was committed, deleted or given an identity fails the rebuild before it writes. (e) The final commit is immediate and conditional on the marker still being there (exactly one row changed). (f) A crash, a `'fail'` rollback, a width change in **any** mode (round-1 P2-5), a `release()` while the rebuild runs (round-1 P2-4), or an unwritable final commit (`SQLITE_BUSY`, pinned) leaves `incomplete`. **Not closed:** a second `rebuild` of the same table on another connection is not fenced (rebuild is always allowed) and writes the same marker, so two concurrent rebuilds are not detected. Documented in README and TSDoc. **Also by design, not closed:** a handle opened *without* an identity is fenced only on `incomplete`, so it can write under another handle's stored identity, and its rebuild commits `identity=NULL`, turning the status to `absent` (round-1 P3-7; documented in README, CAPABILITIES and class TSDoc). |
| **fence check → query** | another connection starts a rebuild between the check and the KNN read | Fence and KNN read share one (deferred, read) transaction, so they see one snapshot. When this handle has not seen the table (or `topK <= 0`), `query` still runs the fence and fails on `mismatch` / `incomplete` instead of returning `[]` (round-1 P3-8; pinned: "a query from a handle that never saw the table still fails on mismatch"). `has`, `remove`, `size` and the fragment counts are deliberately unfenced and documented as such. |
| **standalone `identity()`** | another connection commits between its reads (`sqlite_master` for the table, `sqlite_master` for the meta table, then the row) | **Closed on the orchestrator's answer:** the reads share one deferred read transaction (a savepoint when called inside the fence's own transaction). The interleaving itself cannot be reproduced in a test — the reads are synchronous in one JS turn — so the test pins the property that excludes it: each of the three reads observes `db.inTransaction === true`, and none is left open afterwards. |
| **handle-cached `_stmts` vs the file** | the table is dropped externally after this handle prepared its statements | Pre-existing behaviour: the next statement fails loudly ("no such table"). `identity()` reads `fresh` from the file. |

## Red → green

New tests: `src/test/unit/indexIdentity.test.ts`, run on **both** lanes via `describe.each`
(50 cases per lane plus 2 cross-lane = 102 tests after review round 2). Evidence, logs under
`.gate-logs/red-*.log`:

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

## Review round 1 (adversarial native-boundary review of `b869cb1e9`)

All five findings were reproduced by the reviewer's probes (`p1.js`–`p5.js`) before the fix and
re-run against the rebuilt `lib/` after it. Every new regression test was run against the
`b869cb1e9` source (the three `src/packlets` files checked out over the new tests) and failed there
— log `.gate-logs/red-r1-b869.log`, 28 failing tests across both lanes. The only new test that
passes on `b869cb1e9` is the empty-vector guard, which exists to keep the P2-5 fix from swallowing a
per-record rejection.

| finding | fix | regression test(s) (both lanes) | red on `b869cb1e9` | probe after fix |
|---|---|---|---|---|
| **P1-1** other writers unfenced while a fresh index rebuilds; index ends `match` for the wrong handle | `report()` reads the row even when the table is missing, and a `rebuilding` row reads `incomplete`. The rebuild's own table creation re-checks table-absent + marker-intact in an immediate transaction. The first-write row SQL is conditioned on `state = 'complete'` (insert-on-conflict and the identity-less delete), so no fenced path can touch a marker. | "a fresh index being rebuilt reads incomplete to every other handle, which cannot write, query or certify" (covers an identity-less writer too); "a rebuild fails if the table appears underneath it…"; "a rebuild fails before writing anything if its marker is committed by someone else / deleted / given an identity while still rebuilding…"; the fresh-rebuild commit-point test now asserts `incomplete` mid-rebuild | all red | p4.js: other sees `incomplete`, its add fails, rebuild ok, rebuilder `match`, other `mismatch` and its query fails |
| **P2-2** rebuild skipped the DELETE on a handle with no `_stmts`, then certified foreign vectors | `_clear` decides from `sqlite_master` and, if this handle had not seen the table, adopts it after the delete (dimension from the DDL, statements prepared and kept) | "a rebuild by a handle opened before another connection created the table empties that table too" | red | p3.js case 5: size 1, foreign gone, `match` |
| **P2-3** fenced writes in deferred transactions failed the lock upgrade at once, bypassing `busy_timeout` | `.immediate()` on fenced writes, `_establish`, `adopt`, the rebuild clear and the final commit. `identity()` and `query` stay deferred. A probe confirmed `BEGIN IMMEDIATE` works on a read-only connection and nests as a savepoint. | "a fenced write takes the write lock before its fence read (immediate, honours busy_timeout)": during the fence read, another connection's `BEGIN IMMEDIATE` (timeout 0) must fail | red (the other connection could start a write) | p2b.js: `b` now holds the write lock from `BEGIN`, so the probe's injected write from `a` is the one that waits out `a`'s 5 s `busy_timeout` and throws inside `b`'s hook (the add fails at 5035 ms because the probe threw). That is the intended direction: the second writer waits; the fence-holder does not fail the upgrade. |
| **P2-4** `release()` during a skip-mode rebuild still committed `complete`, and prepared after release | `rebuild` checks `_released` before the commit and fails, leaving `incomplete`. `IndexIdentity._statement` and `_exists` refuse after release. | "a release during a 'skip' rebuild fails it before the commit, leaves it incomplete, and prepares nothing after" | red | p5.js: fails, new handle sees `incomplete`, prepared after release 0 |
| **P2-5** width-changing rebuild succeeded in `'skip'` mode and certified `match` | Before each write, a vector (or any fragment) whose width differs from the established one fails the rebuild in every mode, with the drop-and-re-index remedy in the message. An empty vector is still a per-record rejection. | "a rebuild cannot change the dimension: it fails in '%s' mode…" (`fail`, `skip`); "a width change mid-way through a rebuild of a fresh index also fails, whatever the mode"; "an empty vector in a rebuild is still a per-record rejection that 'skip' skips" (guard) | red (guard passes, as intended) | p1.js: skip-mode rebuild fails, `incomplete` |
| **P3-6** rebuild overwrote a `meta_version ≠ 1` row | `markRebuildingInTransaction` runs `report()` first and returns its failure before writing | "rebuild refuses a meta row it cannot read rather than overwriting it" | red | p3.js case 3: rebuild fails, row still `meta_version: 2` |
| **P3-7** identity-less handle gets and gives no protection | Documented in README (new bullet), CAPABILITIES and both class TSDocs; no behaviour change (the brief's design) | — (behaviour pinned already by "'unchecked' without a caller identity…" and "a rebuild without an identity commits a complete row with none") | n/a | p3.js case 4 unchanged, as designed |
| **P3-8** unfenced members undocumented; `query` returned `[]` before the fence | Docs for `has` / `remove` / `size` / counts; `query` runs the fence on its early-return path | "a query from a handle that never saw the table still fails on mismatch, not []"; the P1-1 test also asserts the other handle's query fails | red | — |
| **P3-9** prettier reformatted CAPABILITIES.md (and README.md) outside the additions | Both restored from `9e68104bf` and the additions re-applied by hand; `git diff 9e68104bf` on each now shows insertions only (CAPABILITIES: paragraph, shortcut and the generated feed line). Markdown is no longer passed to `prettier --write`. | — | — | — |
| **P3-10** `eslint-disable @rushstack/no-new-null` at `indexIdentity.ts:28` | **Accepted as a SQL NULL boundary**, per the review; the line carries its one-line reason ("SQL NULL boundary: SQLite returns NULL for an identity that was never committed"). It is the only disable this stream added. | — | — | — |
| **P3-11** | No change requested. | — | — | — |

### Review round 2 (`edd0b64e8`): no P1/P2; two P3s

| finding | fix | test (both lanes) | red on `edd0b64e8` |
|---|---|---|---|
| `_clear`'s take-over branch read the DDL through `_readExistingDimension`, a throwaway `prepare` — the `Statement::~Statement()` hazard the package documents | New `IndexIdentity.tableDdl()` reads `sqlite_master` through the identity's retained statement cache (dropped by `release()`). The DDL parsing is split into `_dimensionFromDdl`, which `_clear` uses. `create`'s schema probe is unchanged: it is the pre-existing unretained `prepare` already recorded in `CAPABILITIES.md`. | "taking over a table another connection created prepares no schema read that release() could not drop" — every `sqlite_master` statement prepared during the take-over must be in the identity cache | red |
| Docs said a row left by a dropped table is ignored; only a `complete` row is | README status table, `IIndexIdentityReport` TSDoc (`'fresh'` and `'incomplete'` bullets), and the README § Limits remedy now reads "drop the table, then `rebuild`" | "a rebuilding row survives a DROP TABLE: plain writes stay refused until a rebuild completes" | passes — it pins existing behaviour that the docs now describe |

p6.js (d) still lists one `SELECT sql FROM sqlite_master` prepare during the take-over. That is now
the retained one, prepared once into the identity cache, which is exactly what the new test checks.

The existing package suites needed three adjustments, each because a premise changed rather than a
property:

- `'skip' reports an add failure too` (record) and `'skip' also survives an ADD failure` (fragment)
  used a width change as their per-record add rejection. P2-5 makes width a whole-rebuild failure,
  so they now use a per-record rejection: an empty vector, and a fragment with neither identity.
- The `primed()` fixture in both "prepares nothing" suites also calls `identity()` once. The row
  read is prepared on the first read that finds the meta table, and `_clear` now performs that read.

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
(snapshot-consistent `identity()`, idempotent adopt on `match`) and before review round 1. The
orchestrator gates the merged tree; after each of those only the package build, lint and test were
re-run.

Logs in `.gate-logs/` (not committed). Graded by grep, not exit code.

| gate | result |
|---|---|
| `rushx build` (package) | exit 0; `not met|FAILURE|Operations failed|error TS` = 0; `warning` = 0 |
| `rushx lint` (package) | exit 0; 0 / 0 |
| `rushx test` (package) | exit 0; 0 / 0; **100 / 100 / 100 / 100**; 259 tests in 4 suites (re-run after review round 2) |
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
