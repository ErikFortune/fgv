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
 * Three passes:
 *
 *   1. UNRELEASED — indexes closed via `handle.close()` with `release()`
 *      neutered, statements retained to exit. This is the shape the package had
 *      before the fix, reproduced through the real adapter rather than a
 *      hand-rolled imitation of it.
 *   2. RELEASED — the same, through the real disposer, which now releases.
 *   3. ABANDONED — indexes never closed at all, references dropped, GC forced.
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
 * So on x64 this script is a regression guard, not evidence. Run it on
 * linux/arm64 under Node 24 for the measurement that decides the question.
 */

const os = require('os');
const path = require('path');
const fs = require('fs');
const { SqliteVecVectorIndex, SqliteVecFragmentIndex } = require('../lib/index');

// Held at module scope on purpose: these must still be reachable when the
// process begins tearing down, which is the frame the reported stack aborts in.
const held = [];

function vec(a, b) {
  return Float32Array.from([a, b]);
}

async function pass(label, { release, close }) {
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
  global.gc();
  global.gc();
  console.log(`  ${label}: ${indexes} indexes retained to exit`);
}

async function main() {
  console.log(`${process.version} ${process.platform} ${process.arch}`);
  if (typeof global.gc !== 'function') {
    // A silent skip would make this look like it ran. It did not.
    console.error('FATAL: run with --expose-gc, or the collection this probe forces never happens.');
    process.exit(2);
  }
  await pass('UNRELEASED (pre-fix shape, closed)', { release: false, close: true });
  await pass('RELEASED   (post-fix, closed)', { release: true, close: true });
  await pass('ABANDONED  (never closed)', { release: false, close: false });
  console.log(`holding ${held.length} index objects through teardown; exiting`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  }
);
