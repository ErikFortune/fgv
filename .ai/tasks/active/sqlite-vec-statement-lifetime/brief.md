# Stream brief — `sqlite-vec-statement-lifetime`

**Status: QUEUED 🟢 — defect confirmed, fix shape settled.**
Filed 2026-08-21 from a PersonAIlity report.
**Shape:** small, on `@fgv/ts-agent-memory-sqlite-vec`; behaviour-affecting on the closed-index path.

## The defect

`close()` closes the connection and leaves the prepared statements alive.

- `_stmts` is assigned in exactly two places: the constructor (`sqliteVecVectorIndex.ts:102`) and
  the lazy re-prepare (`:213`).
- `closeOwnedConnection` is `db.close()` inside a `captureResult` and nothing else.
- The handle's disposer is `close: () => closeOwnedConnection(database, LABEL)`.
- Nothing finalizes or clears `_stmts`.

So after `close()`, live `Statement` objects reference a closed `Database`, and their destructors
run whenever GC reaches them — potentially after the environment has torn down.

**Both index classes have it.** The reporter found it on `SqliteVecVectorIndex`;
`SqliteVecFragmentIndex:252` has the identical wiring. A shared-connection deployment — the case
`create({ database })` exists for — carries two instances of the shape.

## The fix is not `this._stmts = undefined`

`_stmts === undefined` is **already the sentinel for "no dimension established yet"**, and the
accessors branch on it:

- `size` returns **0** when `_stmts` is `undefined`. Clearing on close would make a closed index
  report `size === 0` — a confident lie — where today it fails.
- The lazy re-prepare at `:213` treats `undefined` as "prepare now", so it would try to re-prepare
  against a closed connection.

**The fix needs an explicit closed state distinct from the dimensionless one**, so a closed index
keeps failing rather than starting to answer with zeroes. There is an existing test
(`the index is unusable after its handle is closed`) that pins the failing behaviour; it must stay
green, and the `size`-after-close case wants a test of its own since nothing covers it today.

**What dropping the references buys, precisely:** `better-sqlite3` exposes no public `finalize()`,
so releasing the last reference does not finalize a statement — it makes it collectable *earlier*,
while the environment is alive, instead of surviving to teardown. That narrows the window that
produces the reported abort. It is not a proof against it, and the release note must not imply
otherwise.

## The platform half — measured, not assumed

The reporter has a deterministic abort on **Node 24 / linux-arm64**, in
`Statement::~Statement()` → `RemoveEnvironmentCleanupHook` with `env == nullptr`. `abort()` from a
destructor during teardown: no JS frame, nothing catchable, host crash-loops.

They could not test Node 24 / linux-x64, and named it the highest-value missing data point.
**We filled it.**

| platform | result |
|---|---|
| Node 22.22.2 / linux-x64 | works |
| **Node 24.19.0 / linux-x64** | **survives — exit 0** |
| Node 24 / linux-arm64 | aborts (theirs) |

**The crash correlates with arm64, not with Node 24.**

Conditions: `better-sqlite3@12.11.1` built from source against Node 24.19.0's own headers
(`node-gyp rebuild --release`), plus `sqlite-vec` and real `vec0` tables. Four probes, all exit 0 —
close-with-live-statements then GC; abandon-without-close then GC; 25 close-then-abandon cycles with
interleaved GC; and a teardown-specific variant holding 30 statements from 10 closed connections at
module scope until process exit, which is the frame their stack actually aborts in.

**What this establishes and what it does not.** The probe reproduces the adapter's *shape*
(statements cached on an object, `db.close()`, references abandoned) rather than running the adapter
itself, so it does not prove the adapter is safe on x64 Node 24. It establishes that **the shape
alone does not abort on Node 24 / x64**, which is the variable the matrix was missing. The repro
script went to the consumer so they can run the identical file on arm64 and get a comparable result:
if it aborts there the shape is sufficient; if it survives, something beyond the shape is involved
and we need their adapter-level repro.

## Platform support posture

**Corrected 2026-08-21 mid-thread.** An earlier draft of this brief said arm64 was "supported in
intent, unverified in fact". **That was wrong** — the maintainer develops and tests on arm64
regularly, so the package is routinely exercised there. The claim came from reasoning about CI
(x64-only) and forgetting that CI is not the only place this gets run.

The correction *sharpens* the diagnosis instead of closing it. Neither variable reproduces the abort
alone: arm64 works under our routine testing, Node 24 works on x64 under our probe. The suspect is
the **combination** — or something in the reporter's image that neither environment has.

**Resolved 2026-08-21:** our arm64 testing runs **Node 24.18.0 on darwin-arm64**, full suite green
at 100%. So Node 24, arm64, and Node 24 + arm64 together are all cleared — on darwin. **The suspect
narrows to linux/arm64 specifically**: the OS rather than the architecture, the `bookworm-slim`
userland, or the Docker-on-Apple-Silicon layer.

### What our suite does and does not exercise — checked, and it qualifies the arm64 row

**The shape: yes.** 38 `.close()` calls across 20 `open()` tests, each leaving a closed `Database`
whose prepared statements are still referenced by an index object that then falls out of scope. The
defective shape is created constantly.

**The failure: no.** There is **no forced GC anywhere in the package** — zero `global.gc()`, no
`--expose-gc`. Whether those `Statement` destructors run before the worker exits, and when, is
entirely V8's choice; and the abort specifically needs the destructor to run **after** environment
teardown, which nothing in the suite forces or asserts.

**So a green arm64 run means "we did not happen to hit the ordering", not "the ordering is safe".**
Routine arm64 testing is real evidence the package works there generally and much weaker evidence
about this defect than it looks. Any claim made from it should be scoped accordingly.

**Do not claim in the release note that the lifetime fix cures the abort.** It removes the shape
that produces the reported stack; whether that is the cause is unestablished until someone runs the
repro on Node 24 + arm64.

## Gates

- [ ] `rushx build` / `lint` / `test` at 100% coverage in `@fgv/ts-agent-memory-sqlite-vec`
- [ ] Repo-wide `rush rebuild`
- [ ] Change file
- [ ] The existing "unusable after close" test stays green
- [ ] A new test pinning that `size` / `recordCount` / `fragmentCount` **fail** after close rather
      than returning 0 — watched failing against the naive `_stmts = undefined` fix first, since
      that is the shape a future contributor will reach for
- [ ] Both index classes fixed, not just the reported one
- [ ] **A test that deterministically creates the shape and forces collection** — closed connection,
      statements abandoned, `global.gc()` — so the suite asserts the ordering is safe instead of
      happening not to hit it. Needs `--expose-gc` on the jest invocation, which is a config change
      worth deciding rather than sneaking in; if it does not belong in the coverage-gated suite it
      belongs under `perf/` per `TESTING_GUIDELINES` § "Measurement Harnesses", run on demand and
      its output pasted into `result.md`
- [ ] Run that test (and the existing suite) under **Node 24 on arm64** before claiming the defect is
      resolved for the reporter
- [ ] Consumer note: what the fix does and does not guarantee about the arm64 abort
