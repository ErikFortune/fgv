# Your repro does not reach the statement it is testing — and the fix already shipped

**2026-08-23.** Reviewed against source and **measured**, not read. Two findings, and the
first one matters more than the second.

---

## 1. The script never creates the throwaway statement

`_clear()` opens with a guard your write-up does not account for:

```ts
private _clear(): Result<true> {
  if (this._released) { … }
  if (this._stmts === undefined) {
    return succeed(true);          // ← early return, no prepare
  }
  … prepare(`DELETE FROM …`).run()
}
```

`_stmts` is `undefined` until a **dimension is established** — the first `add`, or reopening a
file whose table already exists. Your script opens a **fresh** database and never adds
anything, so `_stmts` is `undefined` and `_clear()` returns before the `prepare` line.

Your reasoning — *"`_clear()` runs at the start of `rebuild()`, before any record is read, so
nothing needs embedding to get there"* — is right about **ordering** and wrong about
**reachability**.

Measured, with the pre-`exec` `_clear` body restored so the statement would exist if it could,
counting `db.prepare` calls during two rebuilds:

```
their shape  (fresh index, no add)   : _stmts=undefined  prepares during rebuild = 0
with a dimension established (add)   : _stmts=prepared   prepares during rebuild = 2
```

**So on arm64 your script would print `SURVIVED` and you would conclude the throwaway
statement is exonerated — while never having created one.** A false negative on precisely the
question it exists to answer.

Your linux/x64 `SURVIVED` is therefore not the control you took it for: it does not
demonstrate the script is valid where the abort is absent, because the script does not do the
thing under test on *any* platform.

We are pointing this out with no smugness available to us — it is the same defect you caught
in our probe two days ago, in the same file, running the other way. Ours drove `add` and
`query` but never `rebuild`; yours drives `rebuild` but never `add`. Between them they cover
the lane; neither did alone.

**Minimal fix to your script:** one `add` before the rebuilds.

```js
await handle.index.add({ scope: 'k', id: 'seed' }, new Float32Array(DIM));
```

## 2. It targets a version where that statement still existed

The repro is written against `5.1.0-53`, and cites `sqliteVecVectorIndex.js:328`. **#654 has
since merged**, and `_clear()` now runs `Database.exec`, which creates **no `Statement`
object at all**. So even with the fix above, against a current build the script tests a
statement that no longer exists.

That is not wasted work — it sharpens what to run next.

## What your script *does* exercise on a current build

One statement, and it is the residue we named in the previous note: **`_readExistingDimension`
prepares a throwaway `SELECT sql FROM sqlite_master … name = ?` on every `create()` /
`open()`.** It cannot become `exec` (bound parameter, returned row), so one `Statement` per
index construction survives any change we can make.

Your script opens once, so it creates exactly one — which makes it a narrow but **valid**
probe of that statement specifically. If it aborts on arm64 against a current build, the
schema probe is implicated and we will need a different remedy for it.

## What to run, in order

1. **Take `5.1.0-54`+** (with #654). Your hub's `release()` handle-retention fix plus this is
   the configuration worth testing.
2. **Run our `perf/statementTeardown.js`**, which ships in the package. It is five passes over
   explicit axes, and passes 4 and 5 are a **matched pair differing in `_clear` alone** — which
   is the only comparison that can isolate the throwaway statement. Read it asymmetrically: 5
   aborting where 4 survives implicates it; a surviving 5 exonerates nothing, because an
   unreferenced statement may simply have been collected mid-run.
3. **Then your script, unmodified**, as the narrow probe of the schema-probe statement. If (2)
   comes back clean and (3) aborts, that is the answer and it is one we cannot currently fix
   in the adapter — it would need an upstream `finalize()` or a different driver.

If you would rather keep your own script than adopt ours, add the `add` and say which version
you ran; we can read a result from either as long as we know which statement was in play.

## One small thing

`emptySource.list()` returns `{ records: [], exclusions: [] }`. The field on
`IMemoryRecordListing` is **`excluded`**, and it is a `ReadonlyMap<Kind, number>`, not an
array. Harmless here — an unknown extra field is ignored and an absent `excluded` legitimately
means *"this source does not report exclusions"* — but it suggests the script never went
through a type-check, which is worth doing given what it is being used to decide.
