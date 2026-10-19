/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * Revert matrix for P1 (`agent-tasks-p1`): one library mutation per journey claim, each of which
 * must turn red either the package's public journey suite (`journey/`) or the testbed scenario's
 * suite (`scenarios/agentTasks`), run against the mutated package.
 *
 * Lives here, not in `libraries/ts-agent-tasks/perf/mutationMatrix.js`, because P1 ran beside
 * `agent-tasks-m1-stop`, which owned `perf/` — the placement I2 used for the same reason. The rules
 * are that script's: a pattern not found exactly once, or a mutant that does not build, is
 * UNVERIFIED; a row that leaves every test of both suites green is `0 red` — a finding.
 *
 * It never edits the workspace. Make two copies first:
 *
 *   LIB=<scratch>/p1lib TB=<scratch>/p1tb
 *   rsync -a --exclude node_modules --exclude lib --exclude dist --exclude temp libraries/ts-agent-tasks/ $LIB/
 *   ln -s $PWD/libraries/ts-agent-tasks/node_modules $LIB/node_modules
 *   rsync -a --exclude node_modules samples/testbed/ $TB/       # testbed's lib/ must be built
 *   node .ai/tasks/completed/2026-10/agent-tasks-p1/p1Matrix.js --link --pkg $LIB --testbed $TB
 *
 * `--link` gives the testbed copy a `node_modules` whose every entry is a symlink to the
 * workspace's, except `@fgv/ts-agent-tasks`, which points at the package copy. Then:
 *
 *   node .ai/tasks/completed/2026-10/agent-tasks-p1/p1Matrix.js --pkg $LIB --testbed $TB [--check] [--out f.json] [P1-n ...]
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PK = 'src/packlets/';

/** One edit: replace `from` (which must occur exactly once) with `to` in `file`. */
function e(file, from, to) {
  return { file: PK + file, from, to };
}

/** A row of one edit. */
function m(name, file, from, to) {
  return { name, edits: [e(file, from, to)] };
}

/**
 * A row of several edits, applied together. Used where the package guards one property at more than
 * one layer — a single-layer mutant there is equivalent (the other layer still refuses), and a
 * `0 red` from it would say nothing about the tests.
 */
function mm(name, ...edits) {
  return { name, edits };
}

const ROWS = [
  m(
    'P1-1 (step 1) a scope union lists a task once per scope that holds it',
    'storage/sortedKeys.ts',
    '        tags.push(stream.tag);\n        stream.advance();\n',
    '        tags.push(stream.tag);\n        stream.advance();\n        break;\n'
  ),
  m(
    'P1-2 (step 3) the pump resends an uncertain none command',
    'broker/externalCommands.ts',
    "if (handle.isSuccess() && handle.value.idempotency === 'source-key' && !expired && withheld === undefined) {",
    'if (handle.isSuccess() && !expired && withheld === undefined) {'
  ),
  m(
    'P1-3 (step 4) an abbreviated item receipts its update ids',
    'context/renderer.ts',
    "updateIds: r.presentation === 'complete' ? r.item.updates.map((u) => u.id) : []",
    'updateIds: r.item.updates.map((u) => u.id)'
  ),
  mm(
    'P1-4 (step 5) a write from an older revision is accepted (both revision checks)',
    e(
      'broker/catalogMutation.ts',
      '  if (revisionOf(record) !== expectedRevision) {\n    return _stale(mutation.identity, record);',
      '  if (revisionOf(record) < expectedRevision) {\n    return _stale(mutation.identity, record);'
    ),
    e(
      'broker/catalogMutation.ts',
      "found.recordType !== 'resolved' || revisionOf(found) !== expectedRevision) {",
      "found.recordType !== 'resolved' || revisionOf(found) < expectedRevision) {"
    )
  ),
  mm(
    'P1-5 (step 6) a due query ignores its cutoff (the index bound and the re-check)',
    e(
      'storage/queries.ts',
      '  const upper: string = `${cutoff}\\u0001`;',
      "  const upper: string = '\\uffff';"
    ),
    e(
      'storage/queries.ts',
      '      lifecycle.reason.notBefore <= cutoff &&',
      "      lifecycle.reason.notBefore !== '' &&"
    )
  ),
  mm(
    'P1-6 (step 7) a latched parent takes a new child (the broker and storage refusals)',
    e(
      'broker/creation.ts',
      '    refuseUnderLatch(core, parent.id, `it takes no new child`, operationId)',
      '    ok<true>(true)'
    ),
    e(
      'storage/stopRules.ts',
      '  return parentId !== undefined && book.isLatched(parentId)',
      '  return parentId !== undefined && book.isLatched(parentId) && false'
    )
  ),
  m(
    'P1-7 (step 7) a source with no stop opt-in is confirmed rather than blocking',
    'broker/stopPump.ts',
    "      // No stable-stop opt-in: the source stops nothing, and the target blocks.\n      return ok(this._with(i, 'unsupported'));",
    '      // No stable-stop opt-in: the source stops nothing, and the target blocks.\n      return ok(this._confirmed(i, record));'
  ),
  m(
    'P1-8 (step 8) recovered finished work is refused instead of recorded',
    'broker/reconciliation.ts',
    "      if (result.state === 'completed' && !isTerminalTaskStatus(status)) {",
    "      if (result.state === 'completed') {"
  ),
  m(
    'P1-9 (step 8) an unreachable source is recorded as merely stale',
    'broker/reconciliation.ts',
    "await applyHealth(core, binding, 'unavailable', result.reason, 'source-unavailable');",
    "await applyHealth(core, binding, 'stale', result.reason, 'source-unavailable');"
  ),
  m(
    'P1-10 (step 9) a send that starts with the checked body acknowledges it',
    'prompt/checkedPrompt.ts',
    '          sentSystem === system',
    '          sentSystem.startsWith(system)'
  )
];

function parseArgs(argv) {
  const args = { check: false, link: false, pkg: undefined, testbed: undefined, out: undefined, only: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') args.check = true;
    else if (arg === '--link') args.link = true;
    else if (arg === '--pkg') args.pkg = path.resolve(argv[++i]);
    else if (arg === '--testbed') args.testbed = path.resolve(argv[++i]);
    else if (arg === '--out') args.out = path.resolve(argv[++i]);
    else args.only.push(arg);
  }
  if (args.pkg === undefined || args.testbed === undefined) {
    throw new Error('--pkg <copy> and --testbed <copy> are required: this script edits source in place');
  }
  return args;
}

/** Gives the testbed copy a node_modules of symlinks, with ts-agent-tasks pointing at the package copy. */
function link(args) {
  const workspace = path.resolve(__dirname, '../../../../../samples/testbed/node_modules');
  const target = path.join(args.testbed, 'node_modules');
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.join(target, '@fgv'), { recursive: true });
  for (const entry of fs.readdirSync(workspace)) {
    if (entry !== '@fgv') fs.symlinkSync(path.join(workspace, entry), path.join(target, entry));
  }
  for (const entry of fs.readdirSync(path.join(workspace, '@fgv'))) {
    const from = entry === 'ts-agent-tasks' ? args.pkg : path.join(workspace, '@fgv', entry);
    fs.symlinkSync(from, path.join(target, '@fgv', entry));
  }
  console.log(`linked ${target}; @fgv/ts-agent-tasks -> ${args.pkg}`);
}

function occurrences(text, pattern) {
  return text.split(pattern).length - 1;
}

function run(cwd, command, argv) {
  const out = spawnSync(command, argv, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  return `${out.stdout}${out.stderr}`;
}

/** Builds and tests the package copy's journey suite; its build output is what the testbed loads. */
function runPackage(pkg) {
  return run(pkg, 'node_modules/.bin/heft', [
    'test',
    '--clean',
    '--disable-code-coverage',
    '--test-path-pattern',
    'journey/'
  ]);
}

function runTestbed(testbed) {
  return run(testbed, 'node_modules/.bin/jest', [
    '--coverage=false',
    'lib/test/unit/scenarios/agentTasks.test.js'
  ]);
}

function redOf(text) {
  return Array.from(new Set(Array.from(text.matchAll(/● (.+)/g), (x) => x[1].trim()))).sort();
}

function classify(pkgText, tbText) {
  if (
    pkgText.includes('build:typescript] Error') ||
    (pkgText.includes('build encountered an error') && !pkgText.includes('[test:jest]'))
  ) {
    return { verdict: 'UNVERIFIED: did not build', red: [] };
  }
  const pkgFailures = /Failures: (\d+)/.exec(pkgText);
  const tbFailures =
    /Tests:\s+(?:(\d+) failed, )?\d+ passed/.exec(tbText) ?? /Tests:\s+(\d+) failed/.exec(tbText);
  if (pkgFailures === null || tbFailures === null) {
    return { verdict: 'UNVERIFIED: a run reported no failure count', red: [] };
  }
  const p = Number(pkgFailures[1]);
  const t = Number(tbFailures[1] ?? 0);
  const red = [...redOf(pkgText).map((n) => `journey: ${n}`), ...redOf(tbText).map((n) => `scenario: ${n}`)];
  return { verdict: `${p + t} red (journey ${p}, scenario ${t})`, red, total: p + t };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.link) {
    link(args);
    return;
  }
  const ids = ROWS.map((row) => row.name.split(' ')[0]);
  const unknown = args.only.filter((id) => !ids.includes(id));
  if (unknown.length > 0) {
    // A typo must not read as a clean run of zero rows.
    console.error(`unknown row(s): ${unknown.join(', ')}; rows are ${ids.join(', ')}`);
    process.exitCode = 1;
    return;
  }
  const rows = ROWS.filter((row) => args.only.length === 0 || args.only.includes(row.name.split(' ')[0]));
  const results = [];
  for (const row of rows) {
    const files = Array.from(new Set(row.edits.map((edit) => edit.file)));
    const originals = new Map(files.map((f) => [f, fs.readFileSync(path.join(args.pkg, f), 'utf8')]));
    const counts = row.edits.map((edit) => occurrences(originals.get(edit.file), edit.from));
    let result;
    if (counts.some((c) => c !== 1)) {
      result = { verdict: `UNVERIFIED: patterns found ${counts.join('/')} times`, red: [] };
    } else if (args.check) {
      result = { verdict: 'pattern ok', red: [] };
    } else {
      const mutated = new Map(originals);
      for (const edit of row.edits) {
        mutated.set(
          edit.file,
          mutated.get(edit.file).replace(edit.from, () => edit.to)
        );
      }
      try {
        for (const [f, text] of mutated) fs.writeFileSync(path.join(args.pkg, f), text);
        const pkgText = runPackage(args.pkg);
        result = classify(pkgText, runTestbed(args.testbed));
      } finally {
        for (const [f, text] of originals) fs.writeFileSync(path.join(args.pkg, f), text);
      }
    }
    results.push({ name: row.name, ...result });
    console.log(`${row.name}: ${result.verdict}`);
    for (const test of result.red) console.log(`    ${test}`);
  }
  if (!args.check) {
    // Leave the package copy built from unmutated source.
    run(args.pkg, 'node_modules/.bin/heft', ['build', '--clean']);
  }
  if (args.out !== undefined) fs.writeFileSync(args.out, `${JSON.stringify(results, undefined, 1)}\n`);
  const bad = results.filter((r) => r.verdict.startsWith('UNVERIFIED') || r.total === 0);
  console.log(`\n${results.length} rows; ${bad.length} UNVERIFIED or 0 red`);
  process.exitCode = bad.length > 0 ? 1 : 0;
}

main();
