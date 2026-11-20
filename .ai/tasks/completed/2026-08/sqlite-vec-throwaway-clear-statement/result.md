# Result — `sqlite-vec-throwaway-clear-statement`

**Shipped 2026-08-22.** Behaviour-neutral on `@fgv/ts-agent-memory-sqlite-vec`.

## What shipped

`_clear()` on both `SqliteVecVectorIndex` and `SqliteVecFragmentIndex` now runs
`this._db.exec(...)` instead of `this._db.prepare(...).run()`.

```ts
// before — a Statement referenced by nothing the moment it returns
captureResult(() => this._db.prepare(`DELETE FROM "${this._table}"`).run())
// after — no Statement exists at any point
captureResult(() => this._db.exec(`DELETE FROM "${this._table}"`))
```

Same SQL, same transaction context (none — `rebuild` is async and explicitly not
transactional), same `Result` shape. The change is **lifetime, not semantics**.

## Why a statement nobody holds is the dangerous kind

`release()` drops `_stmts`. The statement `_clear()` prepared was never in `_stmts` — it was
referenced by nothing the moment `.run()` returned — so `release()` could not drop it, could
not have dropped it, and no amount of correct `release()` usage on a consumer's side would
have helped. Its native destructor ran whenever GC reached it, which may be during environment
teardown: the frame the reported `Statement::~Statement()` → `RemoveEnvironmentCleanupHook`
abort fires in.

`exec()` creates no `Statement` object at all. Nothing to destruct, no cleanup hook to
outlive anything. That is **strictly stronger than the remedy the consumer proposed** (cache
it so `release()` drops it), because `release()` only makes a statement collectable *earlier* —
`better-sqlite3` exposes no public `finalize()` — so caching would have moved this statement
into the same narrowed-window-no-guarantee bucket as the rest rather than removing it.

## What this does not fix

`_readExistingDimension` prepares a throwaway `SELECT sql FROM sqlite_master … name = ?` on
every `create()` / `open()`, in both classes. It needs a bound parameter and a returned row,
and `prepare()` is the only route to a result set in this driver, so it cannot become `exec`.

**One `Statement` per index construction survives.** The residue shrinks from *every rebuild
plus every construction* to *every construction*; the platform question stays open. Said here
and in the consumer note rather than left for someone to discover.

## The report, verified claim by claim

The consumer sent two findings ahead of the arm64 measurement, which is the right order and
saved a wasted cycle on both sides.

| claim | verdict |
|---|---|
| `_clear()`'s statement is retained by nothing, so `release()` cannot drop it | ✅ confirmed, both classes |
| it is reached from `rebuild()` | ✅ — and from **two** rollback paths besides the pre-loop clear, so a *failing* rebuild prepares two |
| `del` / `ins` in `_prepare()` are also throwaway | ❌ **wrong** — both are captured (`delete: del` is returned; `replaceTxn` closes over both and is returned as `replace`), so they live exactly as long as `_stmts` and `release()` does drop them |
| — | a **fourth** site they did not find: `_readExistingDimension`, above |

Their `release()`-never-ran finding was their own bug on their own side, but its consequence
was ours to act on: a retest as-is could not have distinguished *"`release()` does not fix it"*
from *"`release()` never ran"*.

## The harness was the real defect, and it was ours

`perf/statementTeardown.js` drove `add`, `addFragments` and `query`. It never ran a `rebuild`,
and `rebuild` is the sole caller of `_clear` — so **the probe exercised only the cached
statements and was structurally blind to the one statement `release()` could not reach.**

A green arm64 run of the old probe would have read as *"the fix holds"* while the consumer's
boot path — which rebuilds on start — went untested. That is the exact failure
`TESTING_GUIDELINES.md` § "Measurement Harnesses" exists to prevent, in its worst form: not a
harness that reports a wrong number, but one that reports a right number about the wrong lane.
It was found by the consumer reading source, not by anyone running the probe.

Fixed in three ways:

1. **Every pass now drives a rebuild** — and a **failing** rebuild, which is not redundant: a
   passing rebuild clears once at the top, and the rollback `_clear()` is reachable no other
   way.
2. **A matched pair of passes, 4 and 5**, isolates the throwaway statement. Pass 5 restores
   the pre-`exec` `_clear` via an own-property override (the trick pass 1 uses to neuter
   `release`) — the only way to reproduce a shape that no longer exists in source. Pass 4 is
   the control: same `release`, same `close`, same GC policy, current `_clear`. **They differ
   in one axis, which is what lets either of them mean anything.** `forceGc` is now an
   explicit pass option rather than being derived from `throwawayClear`.

   **The outcomes are still not symmetric.** Pass 5 aborting where pass 4 survives implicates
   the throwaway statement. A **surviving pass 5 exonerates nothing** — the statement is
   unreferenced by construction, so whether it is alive at teardown is the collector's choice,
   and if V8 reaped it mid-run the pass never posed the question. Skipping the forced GC
   removes a guaranteed defeat without creating a guarantee.

   **Both of those corrections came from review, and the second is the more instructive.**
   The first draft claimed a green pass 4 exonerated the statement; CodeRabbit caught it. The
   fix for *that* introduced a second confound in the same file — pass 4 skipped the forced
   GC while pass 2 did not, so the pair differed in two axes and an abort was equally
   explained by a released-but-uncollected cached statement. CodeRabbit caught that too. A
   harness whose green result reads as a clean bill of health is this stream's own defect one
   level up; a harness whose *red* result is attributed to the wrong variable is the same
   defect wearing the opposite sign.
3. The prior stream's `result.md` and its ledger entry now say what the probe did *not* cover.

Five passes, exit 0 on linux-x64 / Node 22.22.2 — which, as the file has always said, makes it
a regression guard on x64 and not evidence.

## Tests

Four new tests, two per class, and they pin the property directly rather than by proxy:

```ts
const spy = jest.spyOn(db, 'prepare');
await index.rebuild(source, embed);
expect(spy).not.toHaveBeenCalled();
```

Everything the index reuses is prepared before the rebuild starts, so a rebuild that reaches
only cached statements prepares **nothing**. One test per class for the passing lane, one for
the failing lane (the rollback clear).

**Watched failing against the pre-`exec` shape first**, per the same discipline the previous
stream used: reverting both `_clear` bodies turned exactly those 4 red — 2 on each class, one
per lane — and nothing else. 153 → 157 passing, 100% coverage throughout.

A coverage gate cannot see this class either: the line ran before and runs now.

## Gates

| gate | result |
|---|---|
| `rushx build` / `lint` / `test` | pass, **100%** coverage, 157 tests |
| `rushx fixlint` | no changes |
| repo-wide `rush rebuild` | pass |
| change file | present |
| `perf/statementTeardown.js` | 5 passes, exit 0 on linux-x64 / Node 22.22.2 |

## Sequencing from here

1. The consumer lands handle retention (theirs, in flight) so `release()` actually runs.
2. This ships.
3. **Then** linux-arm64 / Node 24, where a pass or a failure finally means something — and
   where pass 5 against pass 4 can say whether the throwaway statement was the trigger.
