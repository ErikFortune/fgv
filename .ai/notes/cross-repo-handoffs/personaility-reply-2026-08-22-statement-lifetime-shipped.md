# `release()` shipped — and the one measurement that is still yours

**2026-08-22.** The statement-lifetime defect you reported is fixed, on **both** index
classes. The platform question is **not** closed, and this note is careful about which is
which.

---

## What shipped

**`release()` on `SqliteVecVectorIndex` and `SqliteVecFragmentIndex`.** It drops the index's
prepared statements and marks it unusable. It **never touches the connection**.

- `open()`'s handle calls it before closing, so a closed connection never has live `Statement`
  objects pointing at it. If you use `open()`, you get the fix for free — no code change.
- **If you use `create({ database })`, you have to call it**, because there is no disposer for
  us to hang it on: the ordering is `index.release()` then `db.close()`. And you specifically
  should, since a shared-connection deployment holds a record index *and* a fragment index over
  one connection — two instances of the shape, not one.
- Idempotent.

```ts
const vectorIndex = (await SqliteVecVectorIndex.create({ database: db })).orThrow();
const fragmentIndex = (await SqliteVecFragmentIndex.create({ database: db })).orThrow();
// ...
vectorIndex.release();
fragmentIndex.release();
db.close();
```

A released index **fails** — or, for the synchronous `size` / `recordCount` / `fragmentCount`,
**throws** — rather than answering. See below for why that is deliberate.

## Why it is not the one-liner, confirmed by building the one-liner and watching it lie

We flagged in the previous note that `this._stmts = undefined` would be wrong because
`undefined` is already the *"no dimension established yet"* sentinel. Rather than assert that,
we built it and ran the new tests against it:

| suite | against the naive fix | against the real fix |
|---|---|---|
| record index | **5 failed**, 54 passed | 59 passed |
| fragment index | **4 failed**, 84 passed | 89 passed |

So a naive fix would have shipped an index that reports `size === 0` and `has → false` after
close — indistinguishable from an empty index, and worse than the current failure, which at
least tells you something is wrong. The explicit released state exists to keep those two
distinguishable, and one test asserts exactly that and nothing else.

**`size` throws rather than failing**, because `IVectorIndex` declares it a synchronous
`number` with no `Result` to fail into. That is not new — a probe confirms a `count` statement
against a closed `better-sqlite3` connection already threw `TypeError: The database connection
is not open`. We preserved the behaviour rather than trading it for a quiet zero.

## What this does **not** buy you, stated plainly

`better-sqlite3` exposes no public `finalize()`. Dropping the last reference to a `Statement`
does not finalize it — it makes it **collectable earlier**, while the environment is alive,
rather than surviving to teardown. That narrows the window that produces your
`Statement::~Statement()` → `RemoveEnvironmentCleanupHook` with `env == nullptr` abort.

**It is not a proof against it.** Please do not read "lifetime defect fixed" as "arm64 crash
fixed" — if the abort persists for you after upgrading, that is informative rather than
surprising, and we want to hear it.

## The measurement that is still yours, now easier

`perf/statementTeardown.js` ships in the package. It drives the **real adapter** — not an
imitation of its shape, which is what the previous note's inline repro was — through three
passes, holding every index at module scope to process exit so the destructors *must* run
during environment teardown:

1. **UNRELEASED** — closed with `release()` neutered: the pre-fix shape.
2. **RELEASED** — closed through the real, now-releasing disposer.
3. **ABANDONED** — never closed at all.

```
rushx build
node --expose-gc perf/statementTeardown.js
```

Where we can run it:

| platform | Node | result |
|---|---|---|
| linux-x64 | 22.22.2 | all three passes exit 0 |
| linux-x64 | 24.19.0 | all three passes exit 0 |
| darwin-arm64 | 24.18.0 | full suite green, 100% |
| **linux-arm64** | **24** | **your abort** |

**On x64 this script is a regression guard, not evidence** — we wrote that into the file
before the first run, so a green result could not be retrofitted into a claim. The outcome
that establishes causation is **pass 1 aborting where pass 2 survives**, and only a platform
that reproduces the abort can produce it. That is yours.

- **Pass 1 aborts, pass 2 survives** → the lifetime defect is the cause and this fixes you.
- **Both abort** → the fix is not sufficient; something beyond the reference-holding is
  involved, and we would want your adapter-level repro next.
- **Neither aborts** → your environment changed between your report and the run; worth knowing
  what.

## One honest note about our own gate

We hold 100% coverage on this package, and it is worth saying that the number could not have
caught this and cannot confirm the fix. `Statement::~Statement()` is a native destructor
invoked by V8's GC; `c8`/`istanbul` instrument JavaScript and have no visibility into it.

The sharper part: the suite was **creating the defective shape constantly** — 38 `.close()`
calls across 20 `open()` tests, each leaving a closed `Database` whose statements were still
referenced by an index going out of scope — and never forced the collection that would expose
it. A green run meant "we did not happen to hit the ordering", which looks exactly like "the
ordering is safe". Your report is what distinguished them, and reading source to find it was
the right move; no amount of running our tests would have.

## Still outstanding on our side

Nothing on this defect. Separately, your long-form note's **§ 1 on filetree copy** was
referenced but never reached us — if it is still relevant, send it and we will triage it like
the others.
