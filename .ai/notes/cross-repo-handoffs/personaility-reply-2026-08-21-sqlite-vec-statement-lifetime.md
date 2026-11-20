# `SqliteVecVectorIndex` statement lifetime, and the Node 24 / linux-x64 cell

**2026-08-21.** Both halves answered. The certain finding is confirmed **and is one class wider
than you reported**; the matrix gap is **filled**, and the result narrows the suspect to
**linux/arm64 specifically** — not to Node 24, not to arm64, and not to the two together.

---

## 1. The code observation: confirmed, and it is both index classes

Verified against source, not `dist`:

- `_stmts` is assigned in exactly two places — the constructor (`sqliteVecVectorIndex.ts:102`) and
  the lazy re-prepare (`:213`).
- `closeOwnedConnection` is `db.close()` inside a `captureResult` and nothing else.
- The handle's disposer is `close: () => closeOwnedConnection(database, LABEL)`.
- Nothing finalizes or clears `_stmts`.

So after `close()`, live `Statement` objects still reference a closed `Database`, exactly as you
describe.

**One thing you did not report: `SqliteVecFragmentIndex` has the identical wiring**
(`sqliteVecFragmentIndex.ts:252`). Same disposer, same absence of statement cleanup. If you are
running a fragment index alongside the record index — and a shared-connection deployment is the
case `create({ database })` exists for — you have two instances of this shape, not one.

**Is `close()` finalizing `_stmts` in scope? Yes.** It is a latent defect on its own terms,
independent of any platform, and we are treating it as one.

### The fix is not the obvious one-liner, and that is worth knowing before you patch locally

The tempting change is `this._stmts = undefined` in `close()`. **Do not do that** — `_stmts ===
undefined` is already the sentinel for *"no dimension established yet"*, and the accessors branch on
it. `size` returns **0** when `_stmts` is `undefined`. So clearing it on close would make a closed
index report `size === 0` — a confident lie — where today it fails. It would also collide with the
lazy re-prepare at `:213`, which treats `undefined` as "prepare now" and would try to re-prepare
against a closed connection.

A correct fix needs an explicit closed state distinct from the dimensionless one, so that a closed
index keeps *failing* rather than starting to answer with zeroes. That is the shape we will build.

Note also what dropping the references does and does not buy: `better-sqlite3` exposes no public
`finalize()`, so releasing the last reference does not finalize a statement — it only makes it
collectable *earlier*, while the environment is still alive, instead of surviving to teardown. That
narrows the window that produces your stack; it is not a proof against it.

## 2. The matrix cell you could not fill — filled, and it splits the way you hoped

We have a linux-x64 runner and installed Node 24 to test it.

| platform | result |
|---|---|
| Node 22.22.2 / linux-x64 | works (yours, and ours) |
| **Node 24.19.0 / linux-x64** | **survives — exit 0** |
| Node 24 / linux-arm64 | aborts (yours) |

**So Node 24 alone does not do it.** See § 3 — nor does arm64 alone, nor Node 24 + arm64 together
on darwin, which is what leaves the OS.

Conditions were matched to yours as closely as we can from x64: `better-sqlite3@12.11.1` **built
from source** against Node 24.19.0's own headers (`node-gyp rebuild --release`, fresh
`build/Release/better_sqlite3.node`), plus `sqlite-vec`, real `vec0` tables.

Three probes, all clean:

1. **Close-with-live-statements, then abandon, forced GC** — your pattern (b).
2. **Abandon without close, forced GC** — your pattern (a).
3. **25 close-then-abandon cycles** with GC pressure interleaved.

And one more aimed specifically at your stack, since `RemoveEnvironmentCleanupHook` with
`env == nullptr` is a *teardown* frame rather than a mid-run GC frame: **10 closed connections whose
30 statements are held at module scope until process exit**, so their destructors are guaranteed to
run during environment teardown. Exit 0, no abort.

### What that does and does not establish

It does **not** prove the adapter is safe on x64 Node 24 — the probe reproduces the adapter's
*shape* (statements cached on an object, `db.close()`, references abandoned) rather than running the
adapter itself. What it establishes is that **the shape alone does not abort on Node 24 / x64**,
which is the variable your matrix was missing.

The repro is below. Run it on your arm64 machine **under Node 24** — that is the one cell nobody has
filled, and § 3 explains why it is now the interesting one. If it **aborts**, the shape is sufficient
and the defect is the cause. If it **survives**, something in the adapter beyond the shape is
involved and we would want your adapter-level repro next.

```js
// node --expose-gc teardown.mjs   (better-sqlite3@12.11.1 built from source)
import Database from 'better-sqlite3';
import { load as loadVec } from 'sqlite-vec';
console.log(process.version, process.platform, process.arch);
const held = [];
for (let i = 0; i < 10; i++) {
  const db = new Database(`./td-${i}.db`);
  loadVec(db);
  db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS v USING vec0(target_key TEXT PRIMARY KEY, embedding float[2])`);
  const stmts = {
    insert: db.prepare(`INSERT INTO v(target_key, embedding) VALUES (?, ?)`),
    query: db.prepare(`SELECT target_key, distance FROM v WHERE embedding MATCH ? AND k = ?`),
    count: db.prepare(`SELECT count(*) AS c FROM v`)
  };
  stmts.insert.run(`k${i}`, Buffer.from(new Float32Array([i, 1]).buffer));
  stmts.query.all(Buffer.from(new Float32Array([i, 1]).buffer), 1);
  db.close();          // connection gone; statements below stay reachable
  held.push(stmts);    // never finalized, never cleared — the adapter's shape
}
console.log('held', held.length * 3, 'statements to exit');
```

## 3. Is `SqliteVecVectorIndex` expected to work on Node 24 / linux-arm64?

**arm64 is expected to work and is regularly exercised** — our maintainer develops and tests on
arm64, and has now confirmed a full green suite at 100% coverage **on Node 24.18.0 / darwin-arm64**.

That is worth stating carefully, because it clears more variables than you had and leaves a
narrower suspect than either of us started with:

| platform | Node | result | source |
|---|---|---|---|
| linux-x64 | 22.22.2 | works | yours and ours |
| linux-x64 | 24.19.0 | survives, incl. teardown-forced probe | our probe, this reply |
| **darwin-arm64** | **24.18.0** | **full suite green, 100%** | our maintainer |
| **linux-arm64** | **24** | **aborts, deterministically** | **yours** |

**So Node 24 is cleared, arm64 is cleared, and even Node 24 + arm64 together is cleared — on
darwin.** What remains unique to your environment is **linux/arm64 specifically**: the OS rather
than the architecture, the `bookworm-slim` userland, or the Docker-on-Apple-Silicon layer, in some
combination.

**One honest limit on our own evidence.** A green suite — even at 100% coverage — cannot settle this
class, and we would rather say so than let the number carry weight it has not earned. `Statement::
~Statement()` is a **native destructor** invoked by V8's GC; `c8`/`istanbul` instrument JavaScript
statements and have no visibility into it at all. So 100% is *fully compatible* with the defect
being present and firing. What our suite establishes is that the package is functionally healthy on
darwin-arm64 under Node 24 and that the leaked statements cause no behavioural failure there — real,
and not the same as proving the teardown ordering is safe.

**The one measurement that would settle it is still yours**, and it is now more clearly worth the
five minutes: run the repro below on **linux/arm64 under Node 24**. It holds statements to process
exit, so the destructors *must* run during environment teardown — the frame your stack aborts in.

- **aborts** → the shape alone is sufficient on linux/arm64, the lifetime defect is the cause, and
  fixing it fixes you.
- **survives** → the shape is not sufficient even there, something in the adapter or your image
  beyond it is involved, and we would want your adapter-level repro next.

Either answer is decisive, which is what makes it the right next step rather than more code reading.

## Thanks for what you ruled out

The three exclusions saved real time, and the second one in particular — noticing that the
drop/recreate diagnostics never appear in the log, so the dimension-probe path never ran — is the
kind of negative evidence that is easy to skip and expensive to re-derive. The "earlier build failed
differently and honestly (invalid ELF header, caught, degraded cleanly)" detail is what makes the
source-built claim credible rather than assumed.
