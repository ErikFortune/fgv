// Copyright (c) 2026 Erik Fortune
//
// Verifies that every published package entry point is actually loadable by Node's ESM loader.
//
// WHY THIS EXISTS
//
// `rush build` and `rush test` both pass while a package's ESM entry is completely unloadable.
// Neither can see it, for different reasons:
//
//   - TypeScript resolves *types*, and the types resolve either way, so the build is green.
//   - Jest runs in CJS, so every test takes the `require` condition and never enters the `import`
//     condition at all.
//   - The bundled apps (`apps/sudoku` via webpack, `samples/testbed` via heft/CJS) are a browser
//     bundler and a CJS consumer respectively. Bundlers resolve extensionless directory imports
//     happily, so neither app can fail on this either.
//
// The gap reached a consumer: `@fgv` 5.1.0-47 routed `exports.import` to an ESM emit whose
// internal specifiers were extensionless directory imports (`from './packlets/base'`). Node's ESM
// resolver performs no directory-index resolution, so every `import x from '@fgv/...'` died at
// module evaluation with ERR_UNSUPPORTED_DIR_IMPORT, on a tree that built and tested clean.
//
// This script closes that hole the only way it can be closed: by actually loading each entry the
// way a Node ESM consumer does, and failing loudly when it does not load.
//
// WHAT THIS SCRIPT NO LONGER OWNS
//
// It checks that the artifact exists before importing it, and that check is now the weaker half of
// a question `verify-tarball-exports.mjs` owns outright: that script asserts existence for **every**
// condition at **every** subpath, against the **packed tarball** rather than the working tree.
//
// The two are deliberately not merged, and cannot disagree in the dangerous direction: a packed
// file necessarily exists in the tree, so this script passing can never mask a failure there, while
// the reverse — a file present locally that never enters the tarball — is exactly the @fgv 5.1.0-27
// defect and is visible only to the pack-list gate. What remains genuinely this script's own is the
// part the pack-list cannot answer: whether the entry, once present, **loads** under Node's ESM
// loader. The existsSync below is retained as the guard that makes that import meaningful, not as
// an independent existence check.
//
// USAGE
//   node common/scripts/verify-esm-entrypoints.mjs [--verbose]
//
// Exits non-zero on the first package that fails to load, listing every failure.

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

// `fileURLToPath`, not `new URL(...).pathname`: the latter leaves percent-escapes intact (a repo
// checked out under a path with a space resolves to `.../my%20repo/...`) and prefixes a leading
// slash onto Windows drive letters.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACKAGE_DIRS = ['libraries', 'tools'];
const VERBOSE = process.argv.includes('--verbose');

/**
 * Packages that are deliberately NOT loadable by Node's ESM loader, each with the reason.
 *
 * This list is an explicit declaration, not a suppression. A package belongs here only when its
 * consumers are bundlers — which resolve extensionless directory imports that Node will not — and
 * never a Node ESM `import`. Adding an entry is a decision on the record; the alternative is a
 * silent skip that reads the same as "we forgot", which is exactly how the 5.1.0-47 breakage
 * survived a green build and a green test run.
 *
 * If a package here ever gains a Node consumer, remove the entry rather than widening the reason.
 *
 * Both entries below are **confirmed intent from the package owner** (2026-08-08), not this
 * script's inference from how they happen to be consumed today. That distinction matters: an
 * inferred entry would be a guess that silently hardens into policy, which is the failure mode
 * this list exists to avoid.
 */
const BUNDLER_ONLY = new Map([
  [
    '@fgv/ts-res-ui-components',
    'React component library; consumed through webpack/vite only. Built with `@rushstack/heft-web-rig` (`library` profile), which emits `module: esnext` to `lib` and produces no CJS build. There is no artifact for a `node` condition to point at.'
  ],
  [
    '@fgv/ts-sudoku-ui',
    'React component library; consumed through webpack only (apps/sudoku). Built with `@rushstack/heft-web-rig` (`library` profile), which emits `module: esnext` to `lib` and produces no CJS build. There is no artifact for a `node` condition to point at.'
  ]
]);

/**
 * Resolves what Node's ESM loader would pick for the `import` condition, mirroring condition
 * precedence: a `node` block wins over a bare `import`, and `default` is the last resort.
 *
 * Deliberately hand-rolled rather than delegating to `import.meta.resolve`: the point is to state
 * which file we expect Node to choose, so a failure names the mapping rather than only the error.
 */
function resolveImportTarget(exportsField) {
  if (typeof exportsField === 'string') {
    return exportsField;
  }
  if (exportsField === null || typeof exportsField !== 'object') {
    return undefined;
  }
  const root = exportsField['.'] ?? exportsField;
  if (typeof root === 'string') {
    return root;
  }
  if (root === null || typeof root !== 'object') {
    return undefined;
  }
  // `node` is more specific than a bare `import` and is matched first by Node.
  const nodeBlock = root.node;
  if (typeof nodeBlock === 'string') {
    return nodeBlock;
  }
  if (nodeBlock && typeof nodeBlock === 'object' && typeof nodeBlock.import === 'string') {
    return nodeBlock.import;
  }
  if (typeof root.import === 'string') {
    return root.import;
  }
  const dflt = root.default;
  if (typeof dflt === 'string') {
    return dflt;
  }
  if (dflt && typeof dflt === 'object' && typeof dflt.import === 'string') {
    return dflt.import;
  }
  return undefined;
}

async function collectPackages() {
  const found = [];
  for (const group of PACKAGE_DIRS) {
    const groupDir = join(REPO_ROOT, group);
    if (!existsSync(groupDir)) {
      continue;
    }
    for (const entry of await readdir(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const manifestPath = join(groupDir, entry.name, 'package.json');
      if (!existsSync(manifestPath)) {
        continue;
      }
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (manifest.private === true || !manifest.exports) {
        continue;
      }
      found.push({ name: manifest.name, dir: join(groupDir, entry.name), manifest });
    }
  }
  return found;
}

const packages = await collectPackages();
const failures = [];
let checked = 0;
let skipped = 0;
let declared = 0;

for (const pkg of packages) {
  const bundlerOnlyReason = BUNDLER_ONLY.get(pkg.name);
  if (bundlerOnlyReason !== undefined) {
    declared++;
    if (VERBOSE) {
      console.log(`  DECL  ${pkg.name} — bundler-only: ${bundlerOnlyReason}`);
    }
    continue;
  }
  const target = resolveImportTarget(pkg.manifest.exports);
  if (target === undefined) {
    failures.push({ name: pkg.name, target: '(none)', reason: 'no resolvable import/default condition' });
    continue;
  }
  const absolute = resolve(pkg.dir, target);
  if (!existsSync(absolute)) {
    // "Not built yet" and "points at a file that will never exist" look identical at this line, and
    // conflating them is how a dangling `exports` pointer hides: it reads as a skip forever. If the
    // package has produced *any* build output then a build has run, so the named artifact is
    // genuinely missing — a packaging defect, and it fails.
    //
    // This is not hypothetical. The sibling gate found exactly that in
    // `@fgv/ts-web-extras-webauthn`, whose `default` condition named a `lib/index.browser.js` that
    // has no source and is never emitted; it had been reported as a skip.
    if (existsSync(join(pkg.dir, 'lib')) || existsSync(join(pkg.dir, 'dist'))) {
      failures.push({
        name: pkg.name,
        target,
        reason: 'artifact does not exist, though the package has been built'
      });
      continue;
    }
    skipped++;
    if (VERBOSE) {
      console.log(`  SKIP  ${pkg.name} -> ${target} (not built)`);
    }
    continue;
  }
  checked++;
  try {
    await import(pathToFileURL(absolute).href);
    if (VERBOSE) {
      console.log(`  ok    ${pkg.name} -> ${target}`);
    }
  } catch (err) {
    failures.push({
      name: pkg.name,
      target,
      reason: `${err.code ?? 'ERROR'}: ${String(err.message).split('\n')[0]}`
    });
  }
}

console.log(
  `verify-esm-entrypoints: ${checked} checked, ${declared} declared bundler-only, ${skipped} skipped (not built), ${failures.length} failed`
);

if (failures.length > 0) {
  console.error('\nThe following packages are NOT loadable by Node under the `import` condition:\n');
  for (const f of failures) {
    console.error(`  ${f.name}`);
    console.error(`    import -> ${f.target}`);
    console.error(`    ${f.reason}\n`);
  }
  console.error(
    'A package whose ESM entry cannot be loaded will build clean, test clean, and fail at\n' +
      "the consumer's first `import`. Point the `node` condition at a loadable artifact.\n"
  );
  process.exit(1);
}
