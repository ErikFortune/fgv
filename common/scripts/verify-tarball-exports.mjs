// Copyright (c) 2026 Erik Fortune
//
// Verifies that every path a published package's manifest names — under every `exports` condition,
// at every subpath — is present in the tarball npm would actually publish.
//
// WHY THIS EXISTS
//
// Its two sibling gates (`verify-esm-entrypoints.mjs`, `verify-bundler-resolution.mjs`) each answer
// a real question about a real consumer, and both answer it **against the working tree**. That is
// the strictly weaker question, because a file can exist in the tree and still never enter the
// tarball. Nothing in this repo has ever looked at what npm would pack.
//
// The gap is not hypothetical, and it is the worst of the three defects that motivated this family
// of gates:
//
//   - `@fgv/ts-utils` shipped an `import` condition resolving to an ESM emit Node cannot load.
//     Caught by a consumer. `verify-esm-entrypoints.mjs` now owns it.
//   - `@fgv/ts-web-extras-webauthn` shipped a `default` condition naming `lib/index.browser.js`,
//     a file that has never existed in any build. Caught by us, by accident.
//   - **`@fgv` 5.1.0-27 shipped only `src/` — no build output in the tarball at all.** `lib/`
//     existed locally the whole time, so every tree-based check was green. A consumer hit it and
//     silently worked around it, which is how we nearly never learned about it.
//
// Only the third one is about packing, and it is precisely the one no gate could see. This script
// closes that by computing the packed file list with `npm-packlist` — the library npm itself uses
// to decide what goes into a tarball — and asserting every manifest-named path appears in it.
//
// WHY `npm-packlist` AND NOT `npm pack --dry-run`
//
// `npm pack --dry-run --json` is the ground truth, and it spawns npm per package. Measured on a
// fully built tree here: **7.6-8.2 s per package**, ~3.3 min across the repo, against CI runs that
// have been cancelled around 15 minutes. `npm-packlist` computes the same list in-process, and the
// whole repo costs **~5.2 s** — the ratio that makes per-PR placement viable rather than
// publish-time only. Reimplementing npm's ignore rules by hand was the third option and is the
// wrong one: it would drift from real npm behavior, and a gate that models packing incorrectly is
// worse than none.
//
// The cost is in how you get `npm-packlist` its tree, not in `npm-packlist`: see `computePackList`.
//
// The output was verified byte-identical to `npm pack --dry-run --json` on four packages spanning
// both shapes (`ts-web-extras-webauthn` and `ts-extras` with no `.npmignore`, `ts-utils` and
// `ts-app-shell` with one): same file count, same sorted list. This is not a lookalike heuristic.
//
// WHY THIS FAILS WHERE ITS SIBLINGS SKIP
//
// Both siblings treat "the package has no build output" as a skip. That is defensible for a
// tree-based check run mid-development. It is exactly wrong here: **"the artifact this condition
// names is not in the tarball" is the defect**, and a package with no build output is the 5.1.0-27
// shape verbatim. So an absent artifact always fails, and the failure message names the likely
// cause rather than converting it into a skip. A skip here would reproduce the hole this gate
// exists to close.
//
// RELATIONSHIP TO `verify-esm-entrypoints.mjs`
//
// That script also checks existence, for the single condition Node resolves, against the tree. This
// one checks existence for **every** condition against the **pack list**. The two cannot disagree
// in the dangerous direction: a file that is packed necessarily exists in the tree, so this gate
// passing can never mask a failure there. The reverse is not true, which is the whole point. The
// sibling's existence check is kept as cheap defense in depth; **this script is the owner of the
// question "does every condition name a file that actually ships".**
//
// WHAT THIS GATE DOES NOT TELL YOU
//
// It checks that each named path is **present in the tarball**, not that the extracted file
// **loads** under its condition. The consumer's ask named both halves. Existence is the cheap half
// and catches all three instances above; loading from an extracted tarball is stronger and costs an
// extract-and-import per package per condition. Recorded as a follow-up rather than skipped
// silently — see `docs/FUTURE.md`.
//
// USAGE
//   node common/scripts/verify-tarball-exports.mjs [--verbose] [--timing]
//
//   --verbose   report every package and every checked condition, not just failures
//   --timing    report per-package and total pack-list computation time
//
// Exits non-zero if any manifest-named path is missing from the packed file list.

import { readFileSync, existsSync } from 'node:fs';
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
const TIMING = process.argv.includes('--timing');

const AUTOINSTALLER = join(REPO_ROOT, 'common', 'autoinstallers', 'rush-pack-check');

// THERE IS DELIBERATELY NO DECLARATION / OPT-OUT MAP HERE.
//
// Both sibling gates carry one (`BUNDLER_ONLY`, `NEEDS_NODE_BUILTINS`) because both ask a question
// a package can legitimately answer "no" to: a React component library genuinely need not be
// Node-loadable, and a native-addon wrapper genuinely need not bundle for a browser. Declaring that
// on the record beats a silent skip.
//
// This gate asks a question **no published package can legitimately answer "no" to**: are the paths
// your own manifest names actually in your tarball? A package that ships only sources is not an
// exception to that — its `main` and `exports` name those source files, which *are* packed, so it
// passes on the merits with nothing to declare.
//
// So an opt-out map here would have no correct use and one incorrect one: silencing a package that
// genuinely ships broken. An earlier revision had an empty `SOURCE_ONLY` map "for the record",
// whose own comment had to claim it "suppresses nothing" while the code skipped verification
// entirely for anything listed in it. The comment was wrong, and the mechanism it was defending
// was the silent-skip hole this gate exists to close. Removed rather than documented.

/**
 * The first line of whatever was thrown, whether or not it was an `Error`.
 */
function firstLine(err) {
  const text = err instanceof Error ? err.message : String(err);
  return text.split('\n')[0];
}

function loadPacklist() {
  if (!existsSync(join(AUTOINSTALLER, 'node_modules', 'npm-packlist'))) {
    console.error(
      'verify-tarball-exports: npm-packlist is not installed.\n\n' +
        `  Expected it at ${relative(REPO_ROOT, AUTOINSTALLER)}/node_modules/npm-packlist\n` +
        '  Install it with:\n' +
        '    node common/scripts/install-run-rush.js install-autoinstaller --name rush-pack-check\n\n' +
        'Failing rather than skipping: a gate that silently passes when its own tooling is missing\n' +
        'is worse than no gate, because it reports success for checks it never ran.\n'
    );
    process.exit(1);
  }
  // Resolved explicitly from the autoinstaller rather than by ambient resolution: this script lives
  // at the repo root where npm-packlist is deliberately not a dependency, and an ambient hit would
  // mean some unrelated package's copy silently determines what CI verifies.
  return createRequire(join(AUTOINSTALLER, 'package.json'))('npm-packlist');
}

/**
 * Computes the file list npm would pack for a package, as a Set of package-relative POSIX paths.
 *
 * `npm-packlist` takes a tree node rather than a path, because a tree is how it discovers
 * `bundleDependencies` — those are packed out of `node_modules` and are invisible to a directory
 * walk. The obvious way to get one is `Arborist.loadActual()`, and **that is deliberately not what
 * this does**: measured on this container, `loadActual` costs ~7.7 s per package against
 * `npm-packlist`'s own ~20 ms, because it resolves the entire installed dependency graph. Paying
 * ~3 minutes across the repo to answer a question about bundled dependencies that no `@fgv`
 * package has would put this gate right back in the cost bracket that rules out `npm pack`.
 *
 * So the tree is the minimal node `npm-packlist` actually reads — verified to produce a
 * byte-identical list to the `loadActual` tree — and the assumption it rests on is asserted rather
 * than assumed: a package declaring `bundleDependencies` fails with an actionable message instead
 * of being quietly under-checked.
 */
async function computePackList(packlist, pkg) {
  const bundled = pkg.manifest.bundleDependencies ?? pkg.manifest.bundledDependencies;
  // `false` is npm's explicit "bundle nothing", semantically identical to `[]` or an absent field,
  // so it must not trip the guard — treating it as unmodellable would fail a package that needs no
  // modelling at all. `true` means "bundle every dependency" and genuinely does need a real tree.
  if (bundled !== undefined && bundled !== false && (!Array.isArray(bundled) || bundled.length > 0)) {
    throw new Error(
      'declares bundleDependencies, which this gate does not model. Bundled deps are packed out ' +
        'of node_modules and need a real Arborist tree (`loadActual`) to enumerate — see the ' +
        'computePackList comment for why that path is not the default.'
    );
  }
  const files = await packlist({
    path: pkg.dir,
    package: pkg.manifest,
    edgesOut: new Map(),
    children: new Map(),
    isLink: false
  });
  return new Set(files.map((f) => f.split('\\').join('/').replace(/^\.\//, '')));
}

/**
 * Every path an `exports` map names, paired with the condition path that reaches it.
 *
 * Walks the map in full rather than resolving one condition. Resolving is what a consumer does; a
 * publisher has to be right about *all* of them, and the webauthn defect lived in a condition Node
 * never selects. Arrays (fallback lists) and nested condition objects are both walked; `null`
 * targets are the documented way to block a subpath and are not paths at all, so they are skipped.
 */
function collectExportTargets(exportsField) {
  const targets = [];
  const walk = (node, path) => {
    if (node === null || node === undefined) {
      return;
    }
    if (typeof node === 'string') {
      targets.push({ conditionPath: path.length > 0 ? path.join(' > ') : '.', target: node });
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((entry, i) => walk(entry, [...path, `[${i}]`]));
      return;
    }
    if (typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        walk(value, [...path, key]);
      }
      return;
    }
    // Anything else — a number, a boolean — is not a valid `exports` leaf under Node's spec and
    // names no path, so there is nothing to check. Narrated rather than left as a silent fallthrough,
    // because every other skip in this file is on the record and this one should read the same way.
  };
  walk(exportsField, []);
  return targets;
}

/**
 * The paths a manifest names outside `exports`.
 *
 * `main` and `types` are the pre-`exports` resolution surface, still honored by older bundlers and
 * by TypeScript under `moduleResolution: node`. A `main` naming a file the tarball does not contain
 * is the same defect in a different field — and it is exactly the shape 5.1.0-27 shipped — so it is
 * checked rather than assumed correct. Reported under its field name so a failure is unambiguous
 * about which surface is broken.
 */
function collectManifestTargets(manifest) {
  const targets = [];
  for (const field of ['main', 'types', 'module', 'browser']) {
    const value = manifest[field];
    if (typeof value === 'string') {
      targets.push({ conditionPath: `(${field})`, target: value });
    }
  }
  // `bin` is the sharpest case in this whole file. npm creates a symlink for each entry at install
  // time, so a `bin` naming a path the tarball does not contain does not fail at first import the
  // way a bad `main` does — it fails at `npm install`, or leaves a command on the user's PATH that
  // exits immediately. Every publishable package under tools/ carries one.
  //
  // String form (`"bin": "./cli.js"`) is shorthand for a single entry named after the package.
  const bin = manifest.bin;
  if (typeof bin === 'string') {
    targets.push({ conditionPath: '(bin)', target: bin });
  } else if (bin !== null && typeof bin === 'object') {
    for (const [command, value] of Object.entries(bin)) {
      if (typeof value === 'string') {
        targets.push({ conditionPath: `(bin.${command})`, target: value });
      }
    }
  }
  return targets;
}

/**
 * Whether a manifest-named target is present in the packed file list.
 *
 * A target containing `*` is an `exports` subpath pattern: it names a family of files rather than
 * one, so the assertion is that it matches at least one packed file. Anything else is an exact
 * path. `.` and `./` prefixes are normalized off both sides before comparison.
 */
function isPacked(target, packed) {
  const normalized = target.split('\\').join('/').replace(/^\.\//, '');
  if (!normalized.includes('*')) {
    return packed.has(normalized);
  }
  // `*` in an exports pattern matches across path separators, unlike a shell glob.
  const pattern = new RegExp(
    `^${normalized
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')}$`
  );
  for (const file of packed) {
    if (pattern.test(file)) {
      return true;
    }
  }
  return false;
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
      // Only `private` is disqualifying. Both sibling gates additionally skip a package with no
      // `exports`, which is right for them — they resolve an `exports` condition, so a package
      // without one has nothing for them to resolve. It is **wrong here**: a package with `main`
      // and `bin` and no `exports` still names paths that must be in its tarball, and it is a
      // publishable package like any other. Inheriting that filter hid every package under
      // `tools/` — six publishable CLIs, each with a `bin` — from the gate entirely.
      if (manifest.private === true) {
        continue;
      }
      found.push({ name: manifest.name, dir: join(groupDir, entry.name), manifest });
    }
  }
  return found.sort((a, b) => a.name.localeCompare(b.name));
}

const packlist = loadPacklist();
const packages = await collectPackages();
const failures = [];
let checked = 0;
let conditionsChecked = 0;
let totalPackMs = 0;

for (const pkg of packages) {
  const startedAt = process.hrtime.bigint();
  let packed;
  try {
    packed = await computePackList(packlist, pkg);
  } catch (err) {
    failures.push({
      name: pkg.name,
      missing: [
        {
          conditionPath: '(pack)',
          target: '(n/a)',
          // `err.message` only on a real Error — a thrown string or a rejected non-Error would
          // otherwise stringify to `undefined` and discard the actual cause, on the one path whose
          // whole job is to report why the check could not run.
          reason: `could not compute the packed file list: ${firstLine(err)}`
        }
      ]
    });
    continue;
  }
  const packMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
  totalPackMs += packMs;

  const targets = [
    ...collectExportTargets(pkg.manifest.exports),
    ...collectManifestTargets(pkg.manifest)
  ];
  // A package that declares `exports` but yields no path to check would otherwise be counted as
  // "checked" having verified nothing — a success report for a check that never ran, which is the
  // exact failure mode this family of gates exists to remove. It fails rather than warns: an
  // `exports` map naming no file is either a manifest defect or a shape this walk does not
  // understand, and both are things to look at rather than to log past.
  if (targets.length === 0) {
    failures.push({
      name: pkg.name,
      missing: [
        {
          conditionPath: '(exports)',
          target: '(none)',
          reason:
            'declares `exports` but names no path — nothing could be verified for this package'
        }
      ],
      buildFileCount: [...packed].filter((f) => f.startsWith('lib/') || f.startsWith('dist/')).length,
      packedCount: packed.size
    });
    checked++;
    continue;
  }
  const missing = [];
  for (const { conditionPath, target } of targets) {
    conditionsChecked++;
    if (isPacked(target, packed)) {
      if (VERBOSE) {
        console.log(`  ok    ${pkg.name}  ${conditionPath} -> ${target}`);
      }
    } else {
      missing.push({ conditionPath, target, reason: 'not present in the packed tarball' });
    }
  }

  checked++;
  if (TIMING) {
    console.log(`  time  ${pkg.name} — ${packMs.toFixed(0)} ms, ${packed.size} files packed`);
  }
  if (missing.length > 0) {
    // A tarball carrying little or no build output is the 5.1.0-27 shape, and it produces one
    // failure per condition — noise, unless the shared cause is named once on the package.
    //
    // Counted rather than tested for emptiness, because "zero build files" is not the reliable
    // signal it looks like: npm force-includes the file named by `main` even when an ignore rule
    // excludes it, so a package whose entire `lib/` is ignored can still pack exactly one file
    // under it. The count is reported either way and the reader draws the conclusion; the script
    // does not assert a threshold it cannot justify.
    const buildFileCount = [...packed].filter(
      (f) => f.startsWith('lib/') || f.startsWith('dist/')
    ).length;
    failures.push({ name: pkg.name, missing, buildFileCount, packedCount: packed.size });
  }
}

console.log(
  `verify-tarball-exports: ${checked} packages checked, ${conditionsChecked} manifest paths verified, ` +
    `${failures.length} failed`
);
if (TIMING) {
  console.log(
    `  pack-list total ${(totalPackMs / 1000).toFixed(1)} s across ${checked} packages ` +
      `(${(totalPackMs / Math.max(checked, 1)).toFixed(0)} ms average)`
  );
}

if (failures.length > 0) {
  console.error('\nThe following packages name paths that the published tarball would NOT contain:\n');
  for (const f of failures) {
    console.error(`  ${f.name}`);
    console.error(
      `    ${f.packedCount} files would be packed, ${f.buildFileCount} of them under lib/ or dist/.`
    );
    if (f.buildFileCount <= 1) {
      console.error(
        '    That is effectively no build output — the shape @fgv 5.1.0-27 shipped. Either the'
      );
      console.error(
        '    package was never built, or its .npmignore / files field excludes the build output.'
      );
    }
    for (const m of f.missing) {
      console.error(`    ${m.conditionPath} -> ${m.target}`);
      console.error(`      ${m.reason}`);
    }
    console.error('');
  }
  console.error(
    'A condition naming a path the tarball does not contain resolves correctly for types, builds\n' +
      "clean, tests clean, and fails at the consumer's install or first import. Point the condition\n" +
      'at an artifact that ships, or make the artifact ship.\n'
  );
  process.exit(1);
}
