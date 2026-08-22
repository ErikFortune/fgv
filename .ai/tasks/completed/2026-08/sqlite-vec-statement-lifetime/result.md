# Result — `sqlite-vec-statement-lifetime`

**Shipped 2026-08-22.** Additive on `@fgv/ts-agent-memory-sqlite-vec`.

## What shipped

`release()` on `SqliteVecVectorIndex` and `SqliteVecFragmentIndex`. It drops the index's
prepared statements and marks it unusable; it **never touches the connection**.

- `open()`'s handle disposer calls `index.release()` **before** `closeOwnedConnection`, so
  there is no moment at which a closed connection has live `Statement` objects pointing at it.
- A `create()`-made index can call it too. That is the case that matters most: a
  shared-connection deployment holds a record index *and* a fragment index over one
  connection, so it carries **two** instances of the shape. Because `release()` touches only
  what the index itself allocated, exposing it there does not disturb the property
  `sqlite-vec-path-open` established — that a `create()`-made index is structurally incapable
  of closing a connection it does not own.
- Idempotent.

## Both classes, not just the reported one

The reporter found it on `SqliteVecVectorIndex`. `SqliteVecFragmentIndex` had the identical
wiring — same disposer, same absence of statement cleanup. Fixed in the same PR.

## The naive fix is wrong, and the tests prove it rather than assert it

`_stmts === undefined` was **already** the sentinel for *"no dimension established yet"*, and
the accessors branch on it. Clearing `_stmts` on close — the one-liner a future contributor
will reach for — would make a released index report `size === 0` and `has → false`: a
confident lie indistinguishable from an empty index, where today it fails. It would also
collide with the lazy re-prepare, which reads `undefined` as *"prepare now"* and would try to
prepare against a closed connection.

So the fix is an **explicit released state alongside the dimensionless one**.

Nine tests pin the distinction, and per the brief they were **watched failing against the
naive shape first** — `release()` reduced to `this._stmts = undefined`, every guard inert:

| suite | against the naive fix | against the real fix |
|---|---|---|
| `sqliteVecVectorIndex.test.ts` | **5 failed**, 54 passed | 59 passed |
| `sqliteVecFragmentIndex.test.ts` | **4 failed**, 84 passed | 89 passed |

The one record-index test that stays green either way is *"leaves the consumer connection open
and usable"*, which does not depend on the flag — noted here so its passing is not read as
evidence it pins something it does not.

The load-bearing assertions are negative on purpose:

```ts
index.release();
// NOT `toBe(0)` — that is exactly the regression this pins.
expect(() => index.size).toThrow(/has been released/i);
```

plus one test asserting directly that a released index and a never-added one **do not answer
alike**, which is the whole reason the second state exists.

## `size` throws where everything else fails — and that is not new

`IVectorIndex` declares `size` a synchronous `number`, so there is no `Result` to fail into.
Before verifying, this looked like a choice between introducing a throw and returning `0`. It
is not: a probe confirmed the pre-existing behaviour.

```
open:   { c: 0 }
closed THREW: TypeError | The database connection is not open
```

So the explicit released state **preserves** the throw rather than introducing it, and the
alternative — answering `0` — is precisely what the brief said to avoid. The same holds for
`recordCount` / `fragmentCount` on the fragment index. It is documented on all three.

## What this does NOT establish

`better-sqlite3` exposes **no public `finalize()`**, so releasing the last reference to a
`Statement` does not finalize it — it makes it collectable *earlier*, while the environment is
alive, instead of surviving to teardown. That narrows the window producing the reported
`Statement::~Statement()` → `RemoveEnvironmentCleanupHook` with `env == nullptr` abort.

**It is not a proof against it.** The release note, the README, `LIBRARY_CAPABILITIES.md` and
the consumer reply all say so in those terms. Do not let a summary of this stream drift into
"fixes the arm64 crash".

## The measurement harness

`perf/statementTeardown.js`, run with `node --expose-gc`. Under `perf/` rather than in the
suite for two reasons, both from `TESTING_GUIDELINES.md` § "Measurement Harnesses": it needs
`--expose-gc`, which is a rig-level change rather than something to sneak in; and what it
asserts is a **process outcome** (does the runtime reach exit 0) rather than a value, so a
green check would carry no information about the thing at issue.

It drives the **real adapter** — not a hand-rolled imitation of its shape — through three
passes, holding every index at module scope until process exit so the destructors *must* run
during environment teardown, which is the frame the reported stack aborts in:

1. **UNRELEASED** — closed via the real disposer with `release()` neutered (the pre-fix shape).
2. **RELEASED** — the same, through the real disposer, which now releases.
3. **ABANDONED** — never closed, references dropped, GC forced.

**The prediction was written into the file before the first run**, per the same section. On a
platform where pass 1 does not abort, the script is a regression guard and *not evidence*; the
outcome that would establish causation is **pass 1 aborting where pass 2 survives**, and only
a platform that reproduces the abort can produce it.

> **Correction — 2026-08-22.** Those three passes drove `add`, `addFragments` and `query`, and
> nothing else. So they exercised only the **cached** statements in `_stmts`: the probe never
> ran a `rebuild`, and `rebuild` is the sole caller of `_clear`, which was the one place in
> either class that prepared a statement `release()` could not drop. Everything above is true
> of the lane it drove and **silent about the lane it did not** — the more dangerous shape for
> a harness, because a green run on arm64 would have read as "the fix holds" while the
> consumer's boot path (which rebuilds on start) went untested.
>
> Found by the driving consumer reading source, not by running this. Widened in
> `sqlite-vec-throwaway-clear-statement`, which adds a rebuild and a *failing* rebuild to every
> pass plus a fourth pass that restores the old `_clear` to isolate its contribution.

| platform | Node | result | source |
|---|---|---|---|
| linux-x64 | 22.22.2 | all three passes exit 0 | this stream |
| linux-x64 | 24.19.0 | all three passes exit 0 | this stream |
| darwin-arm64 | 24.18.0 | full suite green, 100% | maintainer |
| **linux-arm64** | **24** | **aborts, deterministically** | **reporter** |

The Node 24 row required `better-sqlite3@12.11.1` rebuilt from source against Node 24's own
headers (`node-gyp rebuild --release`); the workspace binary was saved and restored afterwards
so the Node 22 build is unaffected.

**Node 24 is cleared, arm64 is cleared, and Node 24 + arm64 together is cleared — on darwin.
The suspect is linux/arm64 specifically**: the OS rather than the architecture, the
`bookworm-slim` userland, or the Docker-on-Apple-Silicon layer.

## Coverage cannot see this class at all

`Statement::~Statement()` is a **native destructor** invoked by V8's GC. `c8`/`istanbul`
instrument JavaScript statements and have no visibility into it, so **100% coverage is fully
compatible with the defect being present and firing**. This is the same lesson as
`TESTING_GUIDELINES.md` § "100% coverage cannot see a predicate that is never called",
extended one step further: there, the invisible thing was a predicate that stopped being
called; here it is a predicate that is not JavaScript.

Worth saying explicitly because the package's suite **creates the defective shape constantly**
— 38 `.close()` calls across 20 `open()` tests, each leaving a closed `Database` whose
statements were still referenced by an index falling out of scope — and never once forced the
collection that would expose it. A green run meant *"we did not happen to hit the ordering"*,
not *"the ordering is safe"*, and it looked identical to the latter.

## Gates

- [x] `rushx build` / `lint` / `test` at **100%** coverage in `@fgv/ts-agent-memory-sqlite-vec`
- [x] Repo-wide `rush rebuild`, exit 0, zero warnings
- [x] Change file (`minor` — `release()` is a new public member)
- [x] The existing *"unusable after close"* tests stay green in both suites
- [x] A test pinning that the counts **fail** after release rather than returning 0 — watched
      failing against the naive fix first
- [x] Both index classes fixed
- [x] A harness that deterministically creates the shape and forces collection — under
      `perf/`, per the brief's own second option
- [ ] **Run under Node 24 on linux/arm64.** Not available here; the harness is committed and
      the reporter has the identical file. This box stays open on purpose — the defect is
      fixed on its own terms, the *abort* is not established as resolved.
- [x] Consumer note on what the fix does and does not guarantee
