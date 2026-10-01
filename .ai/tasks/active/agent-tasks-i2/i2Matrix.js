/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * Revert matrix for slice I2 (`agent-tasks-i2`): the prompt packlet, `serializeTaskData`, and the
 * `task_inspect` details framing.
 *
 * Lives here, not in `libraries/ts-agent-tasks/perf/mutationMatrix.js`, because I2 ran beside the M1
 * stop-state cohort, which owned `perf/`. The mechanics are the same as that script's and so are its
 * rules: run only with `--pkg <copy>` (the copy needs a `node_modules` symlink to the package's), a
 * pattern not found exactly once or a mutant that does not build is UNVERIFIED, and a row that leaves
 * every test green is `0 red` — a finding. Folding these rows into `perf/mutationMatrix.js` is
 * recorded in `docs/TECH_DEBT.md`.
 *
 *   node .ai/tasks/active/agent-tasks-i2/i2Matrix.js --pkg <copy> [--check] [--out <file.json>] [I2-n ...]
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const P = 'src/packlets/prompt/';
const CP = P + 'checkedPrompt.ts';
const HO = P + 'handoff.ts';
const FR = P + 'fragments.ts';
const ES = 'src/packlets/context/escaping.ts';
const PR = 'src/packlets/tools/presentation.ts';
const SUITES = 'prompt/|context/|tools/|publicSurface';

function m(name, file, from, to) {
  return { name, file, from, to };
}

const ROWS = [
  m(
    'I2-1 an unavailable composition is accepted',
    CP,
    'if (composition.unavailable !== undefined) {',
    "if (composition.unavailable === 'never') {"
  ),
  m(
    'I2-2 a missing composition is not refused by name',
    CP,
    "return fail('the resolve returned no composition, so nothing about the body was analyzed');",
    'return succeed({ totalChars: resolved.body.length, sections: [], cacheFindings: [] });'
  ),
  m(
    'I2-3 a gap between sections is accepted',
    CP,
    'if (section.start !== offset) {',
    'if (section.start < 0) {'
  ),
  m(
    'I2-4 sections need not cover the body',
    CP,
    'if (offset !== resolved.body.length || composition.totalChars !== resolved.body.length) {',
    'if (offset < 0) {'
  ),
  m(
    'I2-5 a repeated task slot is accepted',
    CP,
    'if (slotSections.length !== 1) {',
    'if (slotSections.length === 0) {'
  ),
  m(
    'I2-6 the task slot need not be last',
    CP,
    'if (section !== sections[sections.length - 1]) {',
    'if (section === undefined) {'
  ),
  m(
    'I2-7 a slot filled by an enforced binding or a default is accepted',
    CP,
    "if (section.source !== 'caller-sub' || section.wasEnforced === true) {",
    'if (section.source === undefined) {'
  ),
  m(
    "I2-8 the slot's text need not be the context's",
    CP,
    'if (body.slice(section.start, section.start + section.chars) !== text) {',
    'if (section.chars < 0) {'
  ),
  m(
    'I2-9 the context may also appear elsewhere in the body',
    CP,
    'if (body.indexOf(text) !== section.start || body.lastIndexOf(text) !== section.start) {',
    'if (body.lastIndexOf(text) < section.start) {'
  ),
  m(
    'I2-10 the task slot may claim better than per-request',
    CP,
    "if (section.effectiveStability !== 'per-request') {",
    'if (section.effectiveStability === undefined) {'
  ),
  m('I2-11 an empty stable prefix is accepted', CP, 'if (section.start === 0) {', 'if (section.start < 0) {'),
  m(
    'I2-12 refusing cache findings are ignored',
    CP,
    'if (refused.length > 0) {',
    'if (refused.length > 1000) {'
  ),
  m(
    'I2-13 met is inferred from silence',
    CP,
    '    composition.totalMeasured !== undefined &&',
    '    composition.totalMeasured !== -1 &&'
  ),
  m(
    'I2-14 the breakpoint plan need not end at the task slot',
    CP,
    'return breakpoints[breakpoints.length - 1] === span.start',
    'return breakpoints.length >= 0'
  ),
  m(
    'I2-15 the receipt is released against any sent text',
    CP,
    'sentSystem === system',
    'sentSystem.length >= 0'
  ),
  m(
    "I2-16 the host's substitutions may fill the task slot",
    CP,
    'Object.prototype.hasOwnProperty.call(params.request.substitutions, slot)',
    'slot.length < 0'
  ),
  m(
    'I2-17 a failed check leaves the issued receipt live',
    HO,
    'const abandoned: TaskResult<DeliveryId> = await params.delivery.abandon(deliveryId);',
    'const abandoned: TaskResult<DeliveryId> = succeedWithDetail<DeliveryId, ITaskFailure>(deliveryId);'
  ),
  m(
    'I2-18 a mismatched send leaves the receipt live',
    HO,
    'const abandoned: TaskResult<DeliveryId> = await delivery.abandon(deliveryId);',
    'const abandoned: TaskResult<DeliveryId> = succeedWithDetail<DeliveryId, ITaskFailure>(deliveryId);'
  ),
  m(
    'I2-19 the handoff hands back the context with its receipt',
    HO,
    '    context: view,',
    '    context: { ...view, ...context },'
  ),
  m(
    'I2-20 a mismatched send after acknowledgement abandons it',
    HO,
    'if (receipt.isSuccess() || acknowledged) {',
    'if (receipt.isSuccess()) {'
  ),
  m(
    'I2-21 details reach the model unescaped',
    PR,
    '            ? { details }',
    '            ? { details: JSON.stringify(inspection.details) }'
  ),
  m(
    'I2-22 the details budget counts raw JSON, not the escaped text',
    PR,
    'details.length <= budget.maxDetailsChars',
    'JSON.stringify(inspection.details).length <= budget.maxDetailsChars'
  ),
  m('I2-23 a non-finite number is serialized', ES, 'Number.isFinite(value)', '!Number.isNaN(value)'),
  m('I2-24 a cycle is not detected', ES, 'if (ancestors.has(value)) {', 'if (ancestors.size < 0) {'),
  m(
    'I2-25 serialized task-data strings are not escaped',
    ES,
    'return succeed(quoteData(value));',
    'return succeed(JSON.stringify(value));'
  ),
  m(
    'I2-26 the template puts the task slot first',
    FR,
    'const names: ReadonlyArray<SlotName> = [...stableSlots, taskSlot];',
    'const names: ReadonlyArray<SlotName> = [taskSlot, ...stableSlots];'
  ),
  m(
    'I2-27 fixed text may form a Mustache tag',
    FR,
    "text.includes('{{') || text.includes('}}')",
    "text.includes('{{{{')"
  ),
  m('I2-28 slot names are not validated', FR, 'Convert.slotName.convert(name)', 'succeed(name)'),
  m(
    'I2-29 the task slot is declared frozen',
    FR,
    "    cacheStability: 'per-request',",
    "    cacheStability: 'frozen',"
  ),
  m(
    'I2-30 the substitution carries the receipt',
    FR,
    "value: context.text, directive: 'prose'",
    "value: `${context.text}${JSON.stringify(context)}`, directive: 'prose'"
  ),
  m(
    'I2-31 handoff calls are not serialized',
    HO,
    'const run: Promise<T> = tail.then(operation, operation);',
    'const run: Promise<T> = operation();'
  ),
  m(
    'I2-32 a mismatched send is not terminal if its abandonment fails',
    HO,
    '        refused = true;\n        const abandoned',
    '        const abandoned'
  ),
  m(
    "I2-33 the handoff's abandon is not terminal",
    HO,
    '        refused = true;\n        return delivery.abandon(deliveryId);',
    '        return delivery.abandon(deliveryId);'
  ),
  m(
    'I2-34 an inherited property counts as a host substitution of the task slot',
    CP,
    'Object.prototype.hasOwnProperty.call(params.request.substitutions, slot)',
    'slot in params.request.substitutions'
  ),
  m(
    'I2-35 a section length need not be a count of characters',
    CP,
    'if (!Number.isInteger(section.chars) || section.chars < 0) {',
    'if (section.chars === -1000) {'
  ),
  m(
    'I2-36 met needs no valid minimum from the request',
    CP,
    '    Number.isFinite(minimum) &&\n    minimum >= 0;',
    '    minimum !== -1;'
  )
];

function parseArgs(argv) {
  const args = { check: false, pkg: undefined, out: undefined, only: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') args.check = true;
    else if (arg === '--pkg') args.pkg = path.resolve(argv[++i]);
    else if (arg === '--out') args.out = path.resolve(argv[++i]);
    else args.only.push(arg);
  }
  if (args.pkg === undefined) {
    throw new Error('--pkg <copy> is required: this script edits source in place');
  }
  return args;
}

function occurrences(text, pattern) {
  return text.split(pattern).length - 1;
}

function runSuites(pkg) {
  const out = spawnSync(
    'node_modules/.bin/heft',
    ['test', '--clean', '--disable-code-coverage', '--test-path-pattern', SUITES],
    {
      cwd: pkg,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024
    }
  );
  return `${out.stdout}${out.stderr}`;
}

function classify(text) {
  if (
    text.includes('build:typescript] Error') ||
    (text.includes('build encountered an error') && !text.includes('[test:jest]'))
  ) {
    return {
      verdict: 'UNVERIFIED: did not build',
      red: text
        .split('\n')
        .filter((l) => l.includes('Error') || l.includes('error'))
        .slice(0, 3)
    };
  }
  const red = Array.from(new Set(Array.from(text.matchAll(/● (.+)/g), (x) => x[1].trim()))).sort();
  const failures = /Failures: (\d+)/.exec(text);
  if (failures === null) {
    return { verdict: 'UNVERIFIED: the run reported no failure count', red };
  }
  return { verdict: `${failures[1]} red`, red };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const rows = ROWS.filter((row) => args.only.length === 0 || args.only.includes(row.name.split(' ')[0]));
  const results = [];
  for (const row of rows) {
    const file = path.join(args.pkg, row.file);
    const source = fs.readFileSync(file, 'utf8');
    const count = occurrences(source, row.from);
    let result;
    if (count !== 1) {
      result = { verdict: `UNVERIFIED: pattern found ${count} times`, red: [] };
    } else if (args.check) {
      result = { verdict: 'pattern ok', red: [] };
    } else {
      fs.writeFileSync(
        file,
        source.replace(row.from, () => row.to)
      );
      try {
        result = classify(runSuites(args.pkg));
      } finally {
        fs.writeFileSync(file, source);
      }
    }
    results.push({ name: row.name, ...result });
    console.log(`${row.name}: ${result.verdict}`);
    for (const test of result.red) console.log(`    ${test}`);
  }
  if (args.out !== undefined) fs.writeFileSync(args.out, `${JSON.stringify(results, undefined, 1)}\n`);
  const bad = results.filter((r) => r.verdict.startsWith('UNVERIFIED') || r.verdict === '0 red');
  console.log(`\n${results.length} rows; ${bad.length} UNVERIFIED or 0 red`);
  process.exitCode = bad.length > 0 ? 1 : 0;
}

main();
