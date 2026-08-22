/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * Statement-lifetime teardown probe for the `release()` fix.
 *
 * Deliberately NOT a jest test, for two reasons. It needs `--expose-gc`, which
 * the package's jest invocation does not pass and which is a rig-level change
 * rather than something to sneak in; and what it asserts is a *process outcome*
 * (does the runtime survive to exit 0) rather than a value, so a green check
 * would carry no information about the thing at issue.
 *
 *   node --expose-gc perf/statementTeardown.js
 *
 * Requires a built `lib/` (`rushx build` first).
 *
 * WHAT IT MEASURES
 *
 * The reported failure is `Statement::~Statement()` calling
 * `RemoveEnvironmentCleanupHook` with `env == nullptr` — a native destructor
 * running *after* environment teardown, which `abort()`s with no JS frame and
 * nothing catchable. So the frame that matters is process exit, not a mid-run
 * GC, and the probe is built to force exactly that: statements from closed
 * connections are held at module scope until the process ends.
 *
 * Every pass drives `add`, `query` AND a rebuild — the last one because
 * `rebuild` is the only caller of `_clear`, and until 2026-08-22 this probe
 * never ran it. It therefore exercised the CACHED statements in `_stmts` and
 * nothing else, and could not have observed the throwaway statement `_clear`
 * used to prepare: the one `release()` never held and so never dropped. A
 * consumer whose boot path runs a rebuild was in a lane this probe did not
 * cover, which is exactly the false green a measurement harness exists to
 * prevent. Reported by the driving consumer, who read the source rather than
 * trusting the probe.
 *
 * Five passes, over three independent axes — `release`, `close`, `forceGc` —
 * plus `throwawayClear`. **Passes are only comparable when they differ in one
 * axis**, which is the discipline the pass list below is built around.
 *
 *   1. UNRELEASED — indexes closed via `handle.close()` with `release()`
 *      neutered, statements retained to exit, GC forced. This is the shape the
 *      package had before the fix, reproduced through the real adapter rather
 *      than a hand-rolled imitation of it.
 *   2. RELEASED — the same, through the real disposer, which now releases.
 *      Differs from pass 1 in `release` alone.
 *   3. ABANDONED — indexes never closed at all, references dropped, GC forced.
 *   4. NO-GC CONTROL — released and closed as in pass 2, with the forced GC
 *      **off**. Differs from pass 2 in `forceGc` alone, and exists to hold that
 *      axis fixed for pass 5.
 *   5. THROWAWAY-CLEAR — pass 4 with `_clear` restored to the pre-2026-08-22
 *      shape that prepares a statement per call. **Differs from pass 4 in
 *      `_clear` alone**, which is what makes it able to isolate anything.
 *
 * WHAT A RESULT MEANS — state this before running it, not after.
 *
 * Exit 0 on all three does NOT prove the fix cures the abort. `better-sqlite3`
 * exposes no public `finalize()`, so dropping the last reference does not
 * finalize a statement; it makes it collectable earlier, while the environment
 * is alive, rather than surviving to teardown. Pass 2 surviving where pass 1
 * aborts is the outcome that would establish causation, and it can only be
 * observed on a platform where pass 1 actually aborts — which, as of
 * 2026-08-21, is linux/arm64 and nowhere else we have tested (linux-x64 under
 * Node 22 and 24, and darwin-arm64 under Node 24, all survive pass 1).
 *
 * **Pass 5 against pass 4** answers the `_clear` question, and only that pair
 * can. Both release, both close, neither forces a collection; they differ in
 * `_clear` and nothing else. If pass 5 aborts where pass 4 survives, the
 * throwaway `_clear` statement is implicated and the `exec` change addresses
 * it.
 *
 * **It is still not symmetric.** A surviving pass 5 exonerates nothing: the
 * statement it creates is unreferenced the moment `.run()` returns, so whether
 * it is still alive at teardown is up to the collector, and if V8 reaped it
 * mid-run the pass never posed the question. Skipping the forced GC removes a
 * *guaranteed* defeat; it does not create a guarantee.
 *
 * **Do not compare pass 5 to pass 2.** They differ in two axes — `_clear` and
 * `forceGc` — so an abort there is equally explained by a released-but-uncollected
 * cached statement reaching teardown, which is what pass 4 is for. An earlier
 * draft of this file made exactly that comparison and called it isolation. It
 * was not, and the confound was introduced by the edit that fixed a *different*
 * overclaim in the same file — which is the argument for stating the
 * one-axis rule at the top rather than reasoning about each pair ad hoc.
 *
 * Pass 4 against pass 2 is informative in its own right: an abort there says a
 * released statement can survive to teardown when nothing forces a collection.
 *
 * So on x64 this script is a regression guard, not evidence. Run it on
 * linux/arm64 under Node 24 for the measurement that decides the question.
 */

const os = require('os');
const path = require('path');
const fs = require('fs');
const { succeed, fail } = require('@fgv/ts-utils');
const { SqliteVecVectorIndex, SqliteVecFragmentIndex } = require('../lib/index');

// Held at module scope on purpose: these must still be reachable when the
// process begins tearing down, which is the frame the reported stack aborts in.
const held = [];

function vec(a, b) {
  return Float32Array.from([a, b]);
}

/** A scripted `IMemoryRecordSource` over two records of one kind. */
function source() {
  return {
    list: () =>
      Promise.resolve(
        succeed({
          records: ['a', 'b'].map((id) => ({
            target: { scope: 'knowledge', id },
            record: { envelope: { id, kind: 'note' }, body: `body-${id}` }
          }))
        })
      )
  };
}

/**
 * Drive both rebuild lanes, which is where `_clear()` runs.
 *
 * @remarks
 * A rebuild that SUCCEEDS clears once, at the top. A rebuild that FAILS under
 * the default `'fail'` mode clears a second time, on the rollback path — so the
 * failing case is not redundant with the passing one, it is the only way to
 * reach `withRollbackNote(error, this._clear())`. The embedder rejects the
 * second record to get there.
 */
function mustFail(label, result) {
  // A rollback rebuild that quietly SUCCEEDS never reaches `_clear()` on the
  // rollback path, and the pass would then cover a lane it reports covering —
  // the same defect this whole stream is about, one level up.
  if (!result.isFailure()) {
    throw new Error(`${label}: expected the scripted embed failure to fail the rebuild`);
  }
}

async function driveRebuilds(rec, frag) {
  // The embedders are async by contract (`MemoryEmbedder` / `FragmentEmbedder`),
  // so they must return a promise — the rebuild loop awaits them.
  (
    await rec.rebuild(source(), async (record) => succeed(vec(record.envelope.id.charCodeAt(0), 1)))
  ).orThrow();
  (
    await frag.rebuild(source(), async (record) =>
      succeed([{ locator: { start: 0, end: 4 }, vector: vec(record.envelope.id.charCodeAt(0), 1) }])
    )
  ).orThrow();

  // Rollback lane. Both must FAIL — `.orThrow()` would defeat the point, but so
  // would discarding the result.
  mustFail(
    'record rollback rebuild',
    await rec.rebuild(source(), async (record) =>
      record.envelope.id === 'b' ? fail('scripted embed failure') : succeed(vec(1, 1))
    )
  );
  mustFail(
    'fragment rollback rebuild',
    await frag.rebuild(source(), async (record) =>
      record.envelope.id === 'b'
        ? fail('scripted embed failure')
        : succeed([{ locator: { start: 0, end: 4 }, vector: vec(1, 1) }])
    )
  );
}

/**
 * Restore the pre-2026-08-22 `_clear`: prepare a statement per call, referenced
 * by nothing once it returns. An own-property override shadows the prototype
 * method, so `this._clear()` inside `rebuild` resolves to this — the same trick
 * pass 1 uses to neuter `release`, and the only way to reproduce a shape that no
 * longer exists in source.
 */
function restoreThrowawayClear(index) {
  index._clear = function () {
    if (this._stmts === undefined) {
      return succeed(true);
    }
    this._db.prepare(`DELETE FROM "${this._table}"`).run();
    return succeed(true);
  };
}

async function pass(label, { release, close, forceGc, throwawayClear }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svteardown-'));
  let indexes = 0;
  for (let i = 0; i < 10; i++) {
    const recordPath = path.join(dir, `rec-${i}.db`);
    const rec = (await SqliteVecVectorIndex.open({ path: recordPath })).orThrow();
    const frag = (await SqliteVecFragmentIndex.open({ path: path.join(dir, `frag-${i}.db`) })).orThrow();

    // Establish the dimension so the statements are actually prepared — an index
    // that never had an `add` holds none, and would probe nothing.
    (await rec.index.add({ scope: 'knowledge', id: `k${i}` }, vec(i, 1))).orThrow();
    (
      await frag.index.addFragments({ scope: 'knowledge', id: `k${i}` }, [
        { locator: { start: 0, end: 5 }, vector: vec(i, 1) }
      ])
    ).orThrow();
    (await rec.index.query(vec(i, 1), 1)).orThrow();

    if (throwawayClear) {
      restoreThrowawayClear(rec.index);
      restoreThrowawayClear(frag.index);
    }
    // The `_clear()` lane — see the header. This is what the probe was missing.
    await driveRebuilds(rec.index, frag.index);

    if (!release) {
      // Reproduce the pre-fix shape through the real adapter: close the
      // connection but leave the prepared statements alive.
      rec.index.release = () => {};
      frag.index.release = () => {};
    }
    if (close) {
      rec.close().orThrow();
      frag.close().orThrow();
    }
    held.push(rec.index, frag.index);
    indexes += 2;
  }
  if (forceGc) {
    global.gc();
    global.gc();
  }
  console.log(`  ${label}: ${indexes} indexes retained to exit${forceGc ? '' : ' (no forced GC)'}`);
}

async function main() {
  console.log(`${process.version} ${process.platform} ${process.arch}`);
  if (typeof global.gc !== 'function') {
    // A silent skip would make this look like it ran. It did not.
    console.error('FATAL: run with --expose-gc, or the collection this probe forces never happens.');
    process.exit(2);
  }
  await pass('UNRELEASED (pre-fix shape, closed)', { release: false, close: true, forceGc: true });
  await pass('RELEASED   (post-fix, closed)', { release: true, close: true, forceGc: true });
  await pass('ABANDONED  (never closed)', { release: false, close: false, forceGc: true });
  // Passes 4 and 5 are a matched pair: identical in every axis but `_clear`.
  await pass('NO-GC CONTROL   (exec _clear, released, closed)', {
    release: true,
    close: true,
    forceGc: false
  });
  await pass('THROWAWAY-CLEAR (old  _clear, released, closed)', {
    release: true,
    close: true,
    forceGc: false,
    throwawayClear: true
  });
  console.log(`holding ${held.length} index objects through teardown; exiting`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  }
);
