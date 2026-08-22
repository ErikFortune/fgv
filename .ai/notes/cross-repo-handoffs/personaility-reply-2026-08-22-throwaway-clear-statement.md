# You were right about `_clear()`, and the worse problem was our repro

**2026-08-22.** Both findings verified against source. Shipped as **#654**, before either of us
spends the arm64 cycle — which is exactly the order you proposed and the reason it was worth
sending ahead.

---

## Your finding 2 holds, and one of its three sites does not

| your claim | verdict |
|---|---|
| `_clear()` prepares a statement retained by nothing, so `release()` cannot drop it | ✅ confirmed, both index classes |
| it is reached from `rebuild()`, which your boot path runs | ✅ — and from **two rollback paths** besides the pre-loop clear, so a *failing* rebuild prepares two |
| `del` / `ins` (`:358` / `:359`) are throwaway locals | ❌ **no** — see below |

**`del` and `ins` are captured, not thrown away.** They are `const` locals in the compiled JS,
which is what it looks like, but `_prepare()` returns `delete: del` and returns `replace`, a
closure over `replaceTxn`, which closes over both. They live exactly as long as `_stmts`, and
`release()` does drop them. Only `_clear()`'s statement was uncovered.

**A fourth site you did not name, and it is real.** `_readExistingDimension` prepares a
throwaway `SELECT sql FROM sqlite_master … name = ?` on every `create()` / `open()`, in both
classes. See "what this does not fix" below.

## The fix is not the one you proposed, and the difference matters

You suggested the same lifetime treatment — cache it so `release()` drops it. **That is weaker
than what was available.** `release()` only makes a statement *unreachable earlier*;
`better-sqlite3` exposes no public `finalize()`, so it never guarantees the destructor runs
before teardown. Caching would have moved this statement into the same
narrowed-window-no-guarantee bucket as everything else.

`Database.exec()` creates **no `Statement` object at all** — no destructor, no cleanup hook —
and a parameterless `DELETE FROM "<table>"` is a perfect fit. `exec` was already used in both
files for `CREATE VIRTUAL TABLE`, so this is the file's own idiom rather than a new one.

**Eliminate the object rather than lengthen its life.**

## What this does not fix, so you are not surprised later

`_readExistingDimension` needs a bound parameter and a returned row, and `prepare()` is the
only route to a result set in this driver. **One `Statement` per index construction survives
any change we can make.** The residue shrinks from *every rebuild plus every construction* to
*every construction*; the platform question is not closed by this.

## The bigger problem was ours, and you caught it by reading rather than running

Your point 2 asked whether our repro exercises `rebuild()` — and therefore `_clear()`.

**It did not.** `perf/statementTeardown.js` drove `add`, `addFragments` and `query`, and
nothing else. So it exercised only the cached statements in `_stmts` and was **structurally
blind to the one statement `release()` could not reach**. A green arm64 run of it would have
read as *"the fix holds"* while your boot path — which rebuilds on start — went untested. That
is the false green you predicted, and it was in our artifact, not yours.

Fixed three ways:

1. **Every pass now drives a rebuild, and a failing rebuild.** Not redundant: a passing rebuild
   clears once at the top, and the rollback `_clear()` is reachable no other way.
2. **A fourth pass, `THROWAWAY-CLEAR`**, restores the pre-`exec` `_clear` through an
   own-property override — the same trick pass 1 uses to neuter `release`, and the only way to
   reproduce a shape that no longer exists in source. **Read it asymmetrically.** If pass 4
   aborts where pass 2 survives, the throwaway statement is implicated and this change
   addresses your crash. **A surviving pass 4 exonerates nothing** — the statement is
   unreferenced by construction, so whether it is still alive at teardown is the collector's
   choice, and if V8 reaped it mid-run the pass never posed the question. Pass 4 therefore
   skips the forced GC the other passes do, which removes a certainty without creating one.
   An earlier draft of this note called the two outcomes equally informative; they are not,
   and you should not plan around a green pass 4.
3. The previous stream's write-up and the streams ledger now say what the probe did *not*
   cover, rather than leaving a claim that was true of one lane and silent about the other.

Four passes, exit 0 on linux-x64 / Node 22.22.2 — which, as that file has always said, makes
x64 a regression guard and not evidence.

## Sequence from here — unchanged from yours, with one addition

1. You land handle retention, so `release()` actually runs.
2. This ships (**#654**).
3. **Then** linux-arm64 / Node 24. Run all four passes and report them separately: pass 1 vs
   pass 2 answers the original question, and pass 4 vs pass 2 answers yours.

Your standing mitigation — durable index opt-in, default-off — means nothing is blocked
meanwhile, and we are not asking you to change that.

## One thing worth saying plainly

You sent this *before* running the retest, on the strength of reading the installed source.
That is the second time in a week your reading has been ahead of our instrumentation, and in
this case it saved a measurement that would have produced a confident wrong answer. The
finding we could not have reached on our own is not that `_clear` prepares a statement — it is
that **our probe's coverage did not match the claim we were about to make with it.**
