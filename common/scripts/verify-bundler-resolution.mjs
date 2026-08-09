// Copyright (c) 2026 Erik Fortune
//
// Verifies that every published package entry point a browser bundler resolves can actually be
// bundled for a browser — no unresolved node builtins, no unresolved specifiers anywhere in the
// reachable graph.
//
// WHY THIS EXISTS
//
// `verify-esm-entrypoints.mjs` reads one row of the consumer table: Node ESM. This script reads the
// row directly below it, which nothing else in CI reads at all:
//
//   - `rush build` resolves *types*, and types resolve regardless of which JS a condition names.
//   - `rush test` runs Jest in CJS, so it takes `require` and never enters `browser` or `import`.
//   - `apps/sudoku` is the repo's only webpack build, and it exercises the handful of packages it
//     happens to import — not the published surface.
//
// The gap is not hypothetical. While measuring bundle sizes, `@fgv/ts-bcp47`'s *browser* entry —
// one of only four packages that already routes browsers at the ESM emit — failed to bundle for a
// browser target:
//
//   ✘ [ERROR] Could not resolve "path"   .../packlets/iana/languageRegistriesFileLoader.js
//   ✘ [ERROR] Could not resolve "fs"
//
// That defect shipped in 5.1.0-47, in both the ESM and CJS browser builds, and no gate saw it.
// Routing twenty more packages at the ESM emit without a gate would propagate that failure class,
// which is why this script exists and why it lands before any `exports` block is repointed.
//
// WHAT IT DOES
//
// For each published package it resolves the condition a browser bundler takes, then *actually
// bundles* it with esbuild at `platform: 'browser'` with node builtins deliberately NOT polyfilled
// and NOT marked external. Entering the failing path rather than asserting around it is the whole
// point: a package either compiles for a browser or it does not, and only a real bundle can say.
//
// Tree shaking is disabled on purpose. With `sideEffects: false` set repo-wide, esbuild would
// happily drop an unreachable-for-this-import module and report success on a graph that a broader
// consumer import would fail on. The gate must fail on the defect, not on one lucky import path.
//
// WHAT THIS GATE DOES NOT TELL YOU
//
// A green result here means "esbuild resolved every import". It does **not** mean "every bundler
// will". esbuild falls back to node10-style directory-index resolution for an extensionless
// specifier; webpack 5 applies `fullySpecified` to anything it treats as ESM and does not. So a
// tree of extensionless directory imports — which is exactly what this repo's `dist` emit is —
// passes here and fails there. Measured: routing webpack at `dist`, or merely marking that emit
// `{"type":"module"}`, took `tools/ts-res-ui-playground` from 0 webpack errors to 6.
//
// `--probe-esm` reports that separately, as BLOCKED rather than clean. Read it before pointing any
// `browser` condition at `dist`: bundling with one bundler is weaker evidence than it looks.
//
// USAGE
//   node common/scripts/verify-bundler-resolution.mjs [--verbose] [--measure] [--probe-esm]
//
//   --verbose     report every package, not just failures
//   --measure     report minified bundle size for each package that bundles
//   --probe-esm   additionally bundle the `dist` ESM counterpart of each package and report
//                 whether it would bundle clean *if* it were routed there. This is the triage
//                 mode: it answers "which packages is it safe to repoint?" without repointing
//                 anything first. It never affects the exit code.
//
// Exits non-zero if any package's currently-resolved browser entry fails to bundle.

import { readFileSync, existsSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, resolve, dirname, relative } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// `fileURLToPath`, not `new URL(...).pathname`: the latter leaves percent-escapes intact (a repo
// checked out under a path with a space resolves to `.../my%20repo/...`) and prefixes a leading
// slash onto Windows drive letters.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACKAGE_DIRS = ['libraries', 'tools'];
const VERBOSE = process.argv.includes('--verbose');
const MEASURE = process.argv.includes('--measure');
const PROBE_ESM = process.argv.includes('--probe-esm');

const AUTOINSTALLER = join(REPO_ROOT, 'common', 'autoinstallers', 'rush-bundler-check');

/**
 * Packages that legitimately require a node builtin on the entry a browser bundler resolves, each
 * with the reason.
 *
 * This list is an explicit declaration, not a suppression — the same posture, and for the same
 * reason, as `BUNDLER_ONLY` in `verify-esm-entrypoints.mjs`. A package belongs here only when it is
 * a node-targeted package whose browser-facing condition is *intentionally* the node build, so
 * "does not bundle for a browser" is the designed outcome rather than a defect. Adding an entry is
 * a decision on the record; a silent skip reads identically to "we forgot", which is exactly how
 * the 5.1.0-47 breakage survived a green build and a green test run.
 *
 * A package that merely *happens* to fail does not belong here. Fix it, or file a finding and leave
 * the gate red — a red gate is information, and this list is not a place to store it.
 */
const NEEDS_NODE_BUILTINS = new Map([
  [
    '@fgv/ts-agent-memory-sqlite-vec',
    'Binds `better-sqlite3` and `sqlite-vec`, both native node addons; `sqlite-vec` imports `node:url` in its own ESM entry. A SQLite-backed vector store has no browser form.'
  ],
  [
    '@fgv/ts-extras-argon2',
    'Wraps the `argon2` native addon, which imports `node:crypto`. The browser counterpart is @fgv/ts-web-extras-argon2 — a separate package exists precisely so this one need not bundle.'
  ],
  [
    '@fgv/ts-extras-mcp',
    'Wraps @modelcontextprotocol/sdk, whose stdio client transport imports `node:process`. A stdio transport is node by definition.'
  ],
  [
    '@fgv/ts-extras-ollama',
    'Wraps the `ollama` client, which imports `node:fs` to stream model files from disk.'
  ],
  [
    '@fgv/ts-http-storage',
    'A filesystem storage provider: `packlets/storage/fsProvider` imports `fs`, `fs/promises`, and `path` directly. Storage backed by the local filesystem has no browser form.'
  ],
  [
    '@fgv/ts-utils-jest',
    'Jest matchers and helpers for use inside a node test runner; `helpers/fsHelpers` imports `fs` and `path`. It is a devDependency of test suites, never shipped to a browser.'
  ]
]);

function loadEsbuild() {
  if (!existsSync(join(AUTOINSTALLER, 'node_modules', 'esbuild'))) {
    console.error(
      'verify-bundler-resolution: esbuild is not installed.\n\n' +
        `  Expected it at ${relative(REPO_ROOT, AUTOINSTALLER)}/node_modules/esbuild\n` +
        '  Install it with:\n' +
        '    node common/scripts/install-run-rush.js install-autoinstaller --name rush-bundler-check\n\n' +
        'Failing rather than skipping: a gate that silently passes when its own tooling is missing\n' +
        'is worse than no gate, because it reports success for checks it never ran.\n'
    );
    process.exit(1);
  }
  // Resolved explicitly from the autoinstaller rather than by ambient resolution: this script lives
  // at the repo root where esbuild is deliberately not a dependency, and an ambient hit would mean
  // some unrelated package's copy silently determines what CI verifies.
  return createRequire(join(AUTOINSTALLER, 'package.json'))('esbuild');
}

/**
 * Resolves what a browser bundler would pick, mirroring the condition precedence webpack, vite,
 * rollup, and esbuild share for a browser target: `browser` is more specific than `import`, and
 * `default` is the last resort.
 *
 * Deliberately hand-rolled rather than delegating to the bundler's own resolver, for the same
 * reason its sibling script hand-rolls Node's: the point is to state which file we expect the
 * bundler to choose, so a failure names the mapping and not only the error.
 *
 * The top-level `module` field is intentionally not consulted. Every package here declares
 * `exports`, and `exports` takes precedence over `module` in every bundler of interest; `module` is
 * a pre-`exports` compatibility shim honored only by tooling too old to read `exports`.
 *
 * KNOWN SIMPLIFICATION, inherited from the sibling script rather than introduced here: real
 * condition resolution walks the keys in the order the `exports` object declares them, so the
 * author controls precedence. This walks a fixed `browser` → `import` → `default` order instead.
 * The two agree for every package in this repo today, because none declares a bare `import`
 * ahead of `browser`. A future package that did would get a silently wrong target rather than an
 * error. Fix by iterating `Object.keys(root)` and matching against a condition set if that ever
 * stops being hypothetical.
 */
function resolveBrowserTarget(exportsField) {
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
  for (const key of ['browser', 'import', 'default']) {
    const block = root[key];
    if (typeof block === 'string') {
      return block;
    }
    if (block && typeof block === 'object') {
      if (typeof block.import === 'string') {
        return block.import;
      }
      if (typeof block.default === 'string') {
        return block.default;
      }
    }
  }
  return undefined;
}

/**
 * Whether an emitted ESM tree uses only fully-specified relative specifiers.
 *
 * THIS IS THE PRECONDITION FOR ROUTING ANYTHING AT THE `dist` EMIT, and it is not the same question
 * as "does esbuild bundle it". esbuild resolves an extensionless directory import
 * (`from './packlets/base'`) by falling back to node10-style directory-index lookup, so it reports
 * success on a tree that is not valid ESM. **webpack 5 does not**: as soon as a tree is treated as
 * ESM it applies `fullySpecified` resolution — no directory index, no extension inference — and
 * every one of those specifiers fails, exactly as it does under Node.
 *
 * Measured in this repo: pointing webpack at the `dist` emit, or merely declaring that emit
 * `{"type":"module"}`, takes `tools/ts-res-ui-playground` from 0 webpack errors to 6. A bundle
 * check alone would have called both changes safe.
 *
 * So the gate reports this separately from bundling. Until the emit carries explicit specifiers
 * (`./packlets/base/index.js`), the answer here is "no" for every dual-rig package, and no
 * `browser` condition should be pointed at `dist`.
 */
function usesFullySpecifiedSpecifiers(absoluteEntry) {
  // The whole emitted tree is scanned, not just the entry. A package whose entry happens to have no
  // relative imports (a single-file package) would otherwise report "clean" on the strength of
  // having nothing to check, which is the same shape of false pass this gate exists to remove.
  const root = dirname(absoluteEntry);
  const offenders = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        // The compiled test tree lands in the emit too, but no consumer's graph reaches it, so an
        // unspecified specifier there cannot break anyone's bundle. Counting it would block
        // packages whose shipped graph is genuinely fine.
        if (relative(root, full) === 'test') {
          continue;
        }
        walk(full);
      } else if (entry.name.endsWith('.js')) {
        // Comment lines are dropped before scanning: TSDoc survives into the emit, and prose like
        // "imported from './foo'" would otherwise be read as an unspecified specifier. Line-based
        // rather than a real comment stripper, which would risk mangling code and turning a false
        // positive into a false negative — the worse direction for this check to be wrong in.
        const source = readFileSync(full, 'utf8')
          .split('\n')
          .filter((line) => {
            const t = line.trim();
            return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
          })
          .join('\n');
        // Three forms carry a relative specifier: `… from './x'` (which also covers
        // `export * from`), a side-effect `import './x'`, and a dynamic `import('./x')`.
        const patterns = [
          /from\s+['"](\.[^'"]*)['"]/g,
          /\bimport\s+['"](\.[^'"]*)['"]/g,
          /\bimport\(\s*['"](\.[^'"]*)['"]\s*\)/g
        ];
        for (const pattern of patterns) {
          for (const [, spec] of source.matchAll(pattern)) {
            if (!/\.(js|mjs|cjs|json|css)$/.test(spec)) {
              offenders.push(`${relative(root, full)} -> ${spec}`);
            }
          }
        }
      }
    }
  };
  walk(root);
  return { ok: offenders.length === 0, offenders };
}

/**
 * The `dist` ESM artifact that corresponds to a resolved `lib` target — what R3 would repoint the
 * `browser` condition at. Returns undefined when the target is not a `lib` path or the counterpart
 * was never emitted.
 */
function esmCounterpart(pkgDir, target) {
  if (!target.includes('/lib/')) {
    return undefined;
  }
  const candidate = target.replace('/lib/', '/dist/');
  return existsSync(resolve(pkgDir, candidate)) ? candidate : undefined;
}

/**
 * Whether the package has produced any build output at all, used to tell a genuinely unbuilt
 * package apart from one whose `exports` names an artifact its build never emits.
 */
function hasBuildOutput(pkgDir) {
  return existsSync(join(pkgDir, 'lib')) || existsSync(join(pkgDir, 'dist'));
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
  return found.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Bundles `target` for a browser, from inside the package directory so that sibling `@fgv/*`
 * imports resolve through the same `node_modules` a consumer's install would give them — which
 * means each sibling is itself resolved through its own `exports` conditions, as a real bundler
 * would do.
 */
function bundleForBrowser(esbuild, pkg, target) {
  const entry = join(pkg.dir, '.verify-bundler-resolution.entry.mjs');
  // `export *` rather than a bare side-effecting import, paired with tree shaking off: together
  // they force the entire reachable graph to be resolved instead of only what one import happens
  // to reach.
  writeFileSync(entry, `export * from ${JSON.stringify(resolve(pkg.dir, target))};\n`);
  try {
    const result = esbuild.buildSync({
      entryPoints: [entry],
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'browser',
      // No `external`, and no builtin polyfills. An unresolved `fs` or `path` is the signal.
      treeShaking: false,
      minify: true,
      logLevel: 'silent',
      absWorkingDir: pkg.dir
    });
    return { ok: true, bytes: result.outputFiles[0].contents.byteLength };
  } catch (err) {
    const messages = (err.errors ?? []).map((e) => {
      const where = e.location ? ` (${e.location.file}:${e.location.line})` : '';
      return `${e.text}${where}`;
    });
    return {
      ok: false,
      errors: messages.length > 0 ? messages : [String(err.message).split('\n')[0]]
    };
  } finally {
    rmSync(entry, { force: true });
  }
}

const esbuild = loadEsbuild();
const packages = await collectPackages();
const failures = [];
const probes = [];
let checked = 0;
let skipped = 0;
let declared = 0;

for (const pkg of packages) {
  const declaredReason = NEEDS_NODE_BUILTINS.get(pkg.name);
  if (declaredReason !== undefined) {
    declared++;
    if (VERBOSE) {
      console.log(`  DECL  ${pkg.name} — node-only: ${declaredReason}`);
    }
    continue;
  }

  const target = resolveBrowserTarget(pkg.manifest.exports);
  if (target === undefined) {
    failures.push({
      name: pkg.name,
      target: '(none)',
      errors: ['no resolvable browser/import/default condition']
    });
    continue;
  }

  const absolute = resolve(pkg.dir, target);
  if (!existsSync(absolute)) {
    // "Not built yet" and "points at a file that will never exist" look identical at this line, and
    // conflating them is how a dangling `exports` pointer hides: it reads as a skip forever. If the
    // package has produced *any* build output, then a build has run and the named artifact is
    // genuinely missing — that is a packaging defect, and it fails.
    if (hasBuildOutput(pkg.dir)) {
      failures.push({
        name: pkg.name,
        target,
        errors: [
          'condition points at an artifact that does not exist, though the package has been built'
        ]
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
  const result = bundleForBrowser(esbuild, pkg, target);
  if (result.ok) {
    if (VERBOSE || MEASURE) {
      const size = MEASURE ? ` (${result.bytes.toLocaleString()} B minified)` : '';
      console.log(`  ok    ${pkg.name} -> ${target}${size}`);
    }
  } else {
    failures.push({ name: pkg.name, target, errors: result.errors });
  }

  if (PROBE_ESM) {
    const counterpart = esmCounterpart(pkg.dir, target);
    if (counterpart === undefined) {
      probes.push({ name: pkg.name, state: 'n/a', note: 'already routed at dist, or no dist emit' });
    } else {
      const probe = bundleForBrowser(esbuild, pkg, counterpart);
      const spec = usesFullySpecifiedSpecifiers(resolve(pkg.dir, counterpart));
      probes.push(
        probe.ok
          ? {
              name: pkg.name,
              state: spec.ok ? 'clean' : 'UNSPECIFIED',
              note: spec.ok ? counterpart : `e.g. ${spec.offenders[0]}`,
              bytes: probe.bytes,
              baseline: result.ok ? result.bytes : undefined
            }
          : { name: pkg.name, state: 'FAILS', note: probe.errors[0] }
      );
    }
  }
}

console.log(
  `verify-bundler-resolution: ${checked} checked, ${declared} declared node-only, ` +
    `${skipped} skipped (not built), ${failures.length} failed`
);

if (PROBE_ESM) {
  console.log('\nESM-emit probe — would this package bundle if routed at its `dist` emit?\n');
  for (const p of probes) {
    if (p.state === 'clean') {
      const delta =
        p.baseline !== undefined
          ? `  ${p.baseline.toLocaleString()} B -> ${p.bytes.toLocaleString()} B ` +
            `(${(p.baseline / p.bytes).toFixed(2)}x)`
          : '';
      console.log(`  clean ${p.name}${delta}`);
    } else if (p.state === 'UNSPECIFIED') {
      console.log(
        `  BLOCKED ${p.name} — esbuild bundles it, but its specifiers are not fully ` +
          `specified (${p.note}); webpack would fail. Do not route.`
      );
    } else if (p.state === 'FAILS') {
      console.log(`  FAILS ${p.name} — ${p.note}`);
    } else {
      console.log(`  n/a   ${p.name} — ${p.note}`);
    }
  }
  console.log('');
}

if (failures.length > 0) {
  console.error('\nThe following packages cannot be bundled for a browser:\n');
  for (const f of failures) {
    console.error(`  ${f.name}`);
    console.error(`    browser -> ${f.target}`);
    for (const e of f.errors) {
      console.error(`    ${e}`);
    }
    console.error('');
  }
  console.error(
    'A package whose browser entry pulls a node builtin will build clean, test clean, and fail in\n' +
      "the consumer's bundler. Keep the node-only code off the browser entry's reachable graph, or\n" +
      'declare the package node-only in NEEDS_NODE_BUILTINS with a reason.\n'
  );
  process.exit(1);
}
