// Copyright (c) 2026 Erik Fortune
//
// Verifies the capability-documentation contract: a small always-loaded router, one detail file
// per library, and no lost reflexes.
//
// WHY THIS EXISTS
//
// `.ai/instructions/LIBRARY_CAPABILITIES.md` is `@`-included from `CLAUDE.md`, so it loads into
// EVERY session unconditionally — before anyone knows the task touches a library at all. By
// 2026-08 it had reached 172,821 chars (~43k tokens), which was **67% of the entire instruction
// budget**, and the section meant to be the fast path ("Decision shortcuts") was 30% of it, with
// 82 entries averaging 615 chars and the longest at 3,275. A 3,275-character shortcut is not a
// shortcut.
//
// The growth is structural rather than accidental. The repo's own "docs ship with the code" rule
// means every stream adds to this file, forever. So a one-time trim would have been back within
// months, and the only durable fix is a mechanical cap.
//
// A CONVENTION WOULD NOT HAVE HELD, AND WE KNOW THAT SPECIFICALLY
//
// `docs/TECH_DEBT.md`'s 2026-08-14 disposition pass found **four separate triggers phrased as
// "next time someone touches X" that had already fired without anyone acting**, and drew the
// conclusion verbatim: replace recall with a mechanical gate. This file is that gate. A rule
// saying "keep router entries to one line" is the same shape as the four that failed.
//
// WHAT IS CHECKED, AND WHY EACH ONE
//
//   1. Router size cap. The whole point; without it the file regrows.
//   2. Every library has a CAPABILITIES.md. A package with no capability entry is invisible to
//      the document consumers read to decide whether to roll their own — which is exactly how
//      @fgv/ts-random went undocumented until 2026-08-24.
//   3. Every CAPABILITIES.md is reachable from the router, and the router has no dead links. A
//      detail file nothing points at is worse than no detail file: it looks maintained.
//   4. Every reflex phrase survives into the router. THIS IS THE SAFETY-CRITICAL ONE. Entries
//      like "never roll your own PBKDF2" or "don't hand-roll a timeout + size cap + redirect
//      loop" work *because* they are resident — they fire for a reader who did not know to look.
//      Moved behind a load-on-demand boundary they would only ever reach someone who already
//      knew, i.e. the person who did not need them. Losing one during a bulk move would be
//      invisible on review, which is why it is asserted rather than trusted.
//
// Run: node common/scripts/verify-capability-docs.mjs [--verbose]

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const VERBOSE = process.argv.includes('--verbose');

const ROUTER = '.ai/instructions/LIBRARY_CAPABILITIES.md';
// 24,000 — revised twice. Both reasons are recorded rather than the number quietly edited.
//
// 16,000 → 18,000: the original cap predated the generated recent-additions feed, which landed at
// ~2.4k and put the router at 17,637. Squeezing a bounded section to preserve a number picked
// before it existed would be optimising for the number.
//
// 18,000 → 24,000: the previous revision left a rule — "the router grew is NOT a reason, move
// detail into a package file" — which assumed compression is always available. Measured 2026-09-07,
// it is not. The 84 shortcuts have a median of 104 chars and a mean of 108; a 140-char per-entry
// cap would reclaim 320 chars in total. There is no detail left to move: what remains IS the
// one-line form the rule asks for.
//
// The rule also had no way to say WHICH entry to cut, and the honest answer is not "the longest".
// The longest (safer-fetch, 225) is six protected reflex anchors plus the security warning those
// anchors exist to carry; cutting it damages exactly what the gate protects. Nor is it "the ones
// with no anchor" — that set includes `Result<T>`, `Converters.object` and `Brand<T>`, which carry
// no anchor because the reflex list protects HAZARD-bearing symbols, not high-frequency ones, and
// which are the shortest entries in the file (mean 92 vs 114).
//
// So the byte count stopped being the useful invariant. Growth here is intrinsic — roughly one
// entry per shipped capability, measured at +167 chars/stream over #661→#663 — and it is cheap:
// the router is ~4.5k tokens against the ~43k that motivated the split. 24,000 is still an 86% cut
// from the 171,693 this replaced, and buys ~36 streams at the measured rate.
//
// What actually prevents reversion is MAX_ENTRY_CHARS below, not this number. Raise this one
// deliberately, with the growth rate re-measured and written down; do not raise that one.
const ROUTER_MAX_CHARS = 24000;

// The invariant that replaced the byte count. The pre-split file died of entries that had grown
// into reference material — 82 shortcuts averaging 615 chars, the longest 3,275. A per-entry
// ceiling enforces mechanically what the router's own guidance says: if it cannot be said in one
// line, it is reference material and belongs in libraries/<pkg>/CAPABILITIES.md.
//
// 240 is deliberately above the densest legitimate entry (225) rather than tuned to bite today.
// It is a ratchet-stop, not a diet: it cannot be satisfied by trimming prose off a warning, only
// by moving detail to the package file where detail belongs.
const MAX_ENTRY_CHARS = 240;
const PACKAGE_DIRS = ['libraries'];

// Slated to move to their own monorepo; `.ai/instructions/ACTIVE_DEVELOPMENT.md` says not to
// queue work against them. Exempt rather than forcing docs onto packages that are leaving.
const EXEMPT = new Set(['ts-sudoku-lib', 'ts-sudoku-ui']);

// The reflexes that must remain reachable without opening anything. Generated from the pre-split
// file and checked in deliberately: this list is the contract, not a cache of it. Adding a reflex
// to a package file is fine; REMOVING one from the router is what this catches.
const REFLEXES_FILE = 'common/config/capability-reflexes.txt';

const failures = [];
const routerPath = join(REPO_ROOT, ROUTER);

if (!existsSync(routerPath)) {
  console.error(`verify-capability-docs: router not found at ${ROUTER}`);
  process.exit(1);
}
const router = readFileSync(routerPath, 'utf8');

// ---- 1. size cap ----------------------------------------------------------------------------
if (router.length > ROUTER_MAX_CHARS) {
  failures.push({
    kind: 'router-too-large',
    detail:
      `${ROUTER} is ${router.length.toLocaleString()} chars, over the ${ROUTER_MAX_CHARS.toLocaleString()} cap ` +
      `(${(router.length - ROUTER_MAX_CHARS).toLocaleString()} over).`,
    fix:
      'The router is @-included into every session. Move the detail into the relevant\n' +
      "    libraries/<pkg>/CAPABILITIES.md and leave a one-line pointer. If an entry genuinely\n" +
      '    cannot be said in one line, it is reference material, not routing.'
  });
}

// ---- 1b. no single shortcut has grown back into reference material --------------------------
// Measured over the "Decision shortcuts" section only: the package index and the generated feed
// are not one-line-per-question surfaces and are bounded by other means.
const shortcutLines = (() => {
  const start = router.indexOf('## Decision shortcuts');
  if (start < 0) return [];
  const after = router.indexOf('\n## ', start + 1);
  const body = after < 0 ? router.slice(start) : router.slice(start, after);
  return body.split('\n').filter((l) => l.startsWith('- **') && l.includes('→'));
})();

for (const line of shortcutLines.filter((l) => l.length > MAX_ENTRY_CHARS)) {
  failures.push({
    kind: 'entry-too-long',
    detail: `a shortcut is ${line.length} chars, over the ${MAX_ENTRY_CHARS}-char per-entry limit:\n      ${line.slice(0, 100)}…`,
    fix:
      'This is the check that keeps the router a router. Do not satisfy it by trimming the\n' +
      '    prose that justifies a symbol — that is the part which makes a resident reflex work.\n' +
      '    Move the detail into libraries/<pkg>/CAPABILITIES.md and leave the question, the\n' +
      '    symbols, and the one clause a reader needs in order to know they should go look.'
  });
}

// ---- 2. every non-exempt library has a CAPABILITIES.md --------------------------------------
const libraries = [];
for (const group of PACKAGE_DIRS) {
  const groupDir = join(REPO_ROOT, group);
  if (!existsSync(groupDir)) continue;
  for (const entry of await readdir(groupDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || EXEMPT.has(entry.name)) continue;
    const manifestPath = join(groupDir, entry.name, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (manifest.private === true) continue;
    libraries.push({
      name: manifest.name,
      dir: entry.name,
      rel: `${group}/${entry.name}/CAPABILITIES.md`,
      exists: existsSync(join(groupDir, entry.name, 'CAPABILITIES.md'))
    });
  }
}

for (const lib of libraries.filter((l) => !l.exists)) {
  failures.push({
    kind: 'missing-capabilities',
    detail: `${lib.name} has no CAPABILITIES.md (expected ${lib.rel}).`,
    fix:
      'A library with no capability entry is invisible to the document consumers read to\n' +
      '    decide whether to request a feature or roll their own. Write one, or add the package\n' +
      `    to EXEMPT in this script with a reason.`
  });
}

// ---- 3. linked from the router, and no dead links -------------------------------------------
for (const lib of libraries.filter((l) => l.exists)) {
  if (!router.includes(lib.rel)) {
    failures.push({
      kind: 'unlinked',
      detail: `${lib.rel} exists but the router does not link to it.`,
      fix: 'Add it to the package index. A detail file nothing points at looks maintained and is not.'
    });
  }
}
for (const m of router.matchAll(/(libraries\/[a-z0-9-]+\/CAPABILITIES\.md)/g)) {
  if (!existsSync(join(REPO_ROOT, m[1]))) {
    failures.push({
      kind: 'dead-link',
      detail: `the router links to ${m[1]}, which does not exist.`,
      fix: 'Create the file or remove the link.'
    });
  }
}

// ---- 4. reflexes survive ---------------------------------------------------------------------
const reflexPath = join(REPO_ROOT, REFLEXES_FILE);
let reflexCount = 0;
if (!existsSync(reflexPath)) {
  failures.push({
    kind: 'missing-reflex-list',
    detail: `${REFLEXES_FILE} not found.`,
    fix: 'This list is the contract for what must stay resident. Restore it from git history.'
  });
} else {
  const reflexes = readFileSync(reflexPath, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
  reflexCount = reflexes.length;
  const lowered = router.toLowerCase();
  for (const r of reflexes) {
    if (!lowered.includes(r.toLowerCase())) {
      failures.push({
        kind: 'reflex-lost',
        detail: `the router no longer mentions: "${r}"`,
        fix:
          'Reflexes work because they are resident — they fire for a reader who did not know to\n' +
          '    look. Restore it to the router (a one-line form is fine), or, if the capability is\n' +
          `    genuinely gone, remove the line from ${REFLEXES_FILE} in the same commit.`
      });
    }
  }
}

// ---- report -----------------------------------------------------------------------------------
const documented = libraries.filter((l) => l.exists).length;
// Shortcut count and longest entry are reported every run, not only on failure: the byte count
// alone cannot distinguish "one more capability shipped" from "an entry is reverting to reference
// material", and those want opposite responses.
const longest = shortcutLines.reduce((m, l) => Math.max(m, l.length), 0);
console.log(
  `verify-capability-docs: router ${router.length.toLocaleString()}/${ROUTER_MAX_CHARS.toLocaleString()} chars, ` +
    `${shortcutLines.length} shortcuts (longest ${longest}/${MAX_ENTRY_CHARS}), ` +
    `${documented}/${libraries.length} libraries documented, ${reflexCount} reflexes checked, ` +
    `${EXEMPT.size} exempt, ${failures.length} failed`
);

if (VERBOSE) {
  for (const lib of libraries) {
    console.log(`  ${lib.exists ? 'ok   ' : 'MISS '} ${lib.name}`);
  }
}

if (failures.length > 0) {
  console.error('\nThe capability-documentation contract is broken:\n');
  for (const f of failures) {
    console.error(`  [${f.kind}] ${f.detail}`);
    console.error(`    ${f.fix}\n`);
  }
  process.exit(1);
}
