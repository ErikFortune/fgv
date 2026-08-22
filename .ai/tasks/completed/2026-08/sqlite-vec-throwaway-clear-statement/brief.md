# Stream brief — `sqlite-vec-throwaway-clear-statement`

**Status: SHIPPED 🟢** — filed and implemented 2026-08-22 from a PersonAIlity report, itself
filed before either side spent a test cycle on the arm64 retest.
**Shape:** small, behaviour-neutral on `@fgv/ts-agent-memory-sqlite-vec`; the substance is
statement *lifetime*, not semantics.

## The report

Two findings, sent ahead of the arm64 measurement `sqlite-vec-statement-lifetime` was waiting on:

1. **`release()` could not run on their side at all** — their registry retained the index and
   discarded the handle, and the handle is the only thing carrying `close()`. Their bug, fixed
   on their side. Its consequence for us is the important part: **a retest as-is would have
   been uninformative**, unable to distinguish "`release()` does not fix it" from "`release()`
   never ran".
2. **`release()` does not cover every statement the package prepares.** It drops `_stmts`;
   three sites prepare outside it.

## Verification, claim by claim

| claim | verdict |
|---|---|
| `_clear()` prepares a statement retained by nothing | ✅ `sqliteVecVectorIndex.ts:415`, `sqliteVecFragmentIndex.ts:526` — `prepare(...).run()`, result discarded |
| `_clear()` is reached from `rebuild()` | ✅ and from **two** rollback paths besides the pre-loop clear, so a *failing* rebuild prepares two |
| `del` / `ins` in `_prepare()` are throwaway locals | ❌ **wrong** — both are captured: `delete: del` is returned, and `replaceTxn` closes over both and is returned as `replace`. They live exactly as long as `_stmts` and `release()` does drop them |
| a fourth site they did not find | `_readExistingDimension` prepares a throwaway `sqlite_master` probe on every `create()` / `open()`, in both classes |

**Their central finding holds, and their inference from it is right**: if the trigger is a
`_clear()` statement, the `release()` release does not address this crash, and a repro built
around cached statements could pass while their hub still aborts.

**And the repro was built around cached statements.** `perf/statementTeardown.js` drove `add`,
`addFragments` and `query` — never a `rebuild`, so never `_clear`. That is a defect in *our*
artifact, not theirs, and it is the reason to answer before anyone runs anything.

## The remedy, and why it is not the one they proposed

They suggested "the same lifetime treatment" — caching `_clear()`'s statement so `release()`
drops it. That is **weaker than what is available**. `release()` only makes a statement
unreachable earlier; `better-sqlite3` exposes no public `finalize()`, so it never guarantees
the destructor runs before teardown. Caching would move this statement into the same
narrowed-window-no-guarantee bucket as the rest.

`Database.exec()` **creates no `Statement` object at all**, and a parameterless
`DELETE FROM "<table>"` is a perfect fit for it. No object, no destructor, no cleanup hook.
`exec` is already used in both files for `CREATE VIRTUAL TABLE`, so the precedent is in-file.

**What it does not fix, stated rather than glossed:** `_readExistingDimension` needs a bound
parameter and a returned row, and `prepare()` is the only route to a result set in this driver.
One `Statement` per index construction survives any change available here. The residue shrinks
from *every rebuild plus every construction* to *every construction*; the platform question
stays open.

## Explicitly NOT in scope

- Changing `release()`'s contract. It is correct for what it can reach.
- Any attempt to force finalization. There is no public API, and pretending otherwise is how a
  narrowed window gets written up as a fix.
- The `sqlite_master` probe. It cannot become `exec`, and inlining the table name as a SQL
  string literal would trade a real risk for a smaller one plus an escaping bug waiting to
  happen.

## Gates

- [x] `rushx build` / `lint` / `test` at 100% coverage in `@fgv/ts-agent-memory-sqlite-vec`
- [x] Four new tests, **watched failing** against the pre-`exec` shape first
- [x] The teardown probe drives a rebuild and a failing rebuild in every pass
- [x] A fourth probe pass that restores the old `_clear`, so arm64 can isolate its contribution
- [x] Repo-wide `rush rebuild`
- [x] Change file
- [x] The prior stream's `result.md` and ledger entry corrected about what the probe covered
- [x] Consumer note
