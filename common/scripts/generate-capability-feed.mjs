// Copyright (c) 2026 Erik Fortune
//
// Generates the "Recent additions" feed in the capabilities index and in each package's
// CAPABILITIES.md, from the stream metadata that already exists.
//
// WHY THIS IS GENERATED RATHER THAN WRITTEN
//
// Consumers (PersonAIlity, chocolate-lab) read the capabilities index to answer two questions:
// "does fgv already do X?" and "what changed since I last looked?". The second wants a dated,
// newest-first list — and every completed stream ALREADY carries exactly that, in its
// `meta.yaml`:
//
//     opened: 2026-08-23
//     packages: ['@fgv/ts-extras', '@fgv/ts-json-base']
//     summary:
//       sourceLine: >
//         **Shipped:** an opt-in that hoists the optionals a schema already proves safe to
//         hoist, rather than a boolean asserting they are.
//
// TWO FIELDS, BECAUSE THEY ARE TWO JOBS
//
// `headline` is the feed's field: a curated one-liner a reader can scan.
//
// `sourceLine` is NOT that, and an earlier draft of this script wrongly assumed it was. Per
// `.claude/skills/finalize-task/SKILL.md` it is the finalizer's **audit trail** — "copy the
// authored opening claim verbatim… If you cannot find one, leave it blank." A verbatim quote and
// a curated summary want opposite things, so streams that produced `# Brief — …` or a 429-char
// paragraph were *conforming*, and the first version of this script reported them as defects.
//
// (That was the same two-jobs-one-artifact error the capabilities split itself was created to
// fix — committed inside the stream that fixes it. Recorded rather than quietly corrected.)
//
// So: read `headline` when present. Fall back to `sourceLine` only when it happens to be usable,
// which for many streams it is — a good verbatim opener often IS a good headline. A stream with
// neither simply does not appear in the feed, which is honest; hand-maintaining a separate
// changelog is the thing being avoided, and fabricating a summary is worse than a gap.
//
// TWO MODES
//
//   (default)  rewrite the generated regions in place
//   --check    exit non-zero if any region is stale — this is the CI gate, and it is what stops
//              the generated and source forms from drifting
//
// The regions are delimited by HTML comments. Everything outside them is hand-written and is
// never touched.
//
// Run: node common/scripts/generate-capability-feed.mjs [--check] [--verbose]

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHECK = process.argv.includes('--check');
const VERBOSE = process.argv.includes('--verbose');

const ROUTER = join(REPO_ROOT, '.ai/instructions/LIBRARY_CAPABILITIES.md');
const COMPLETED = join(REPO_ROOT, '.ai/tasks/completed');
const BEGIN = '<!-- BEGIN GENERATED: recent-additions -->';
const END = '<!-- END GENERATED: recent-additions -->';
const ROUTER_LIMIT = 10; // bounded so the feed cannot eat the router's byte cap

// ---- minimal meta.yaml reader ----------------------------------------------------------------
// Deliberately not a YAML dependency: the sibling verify-* scripts run on node:fs alone, and the
// four fields wanted here are regular enough to read directly. A malformed file yields nulls and
// is skipped rather than throwing, so one bad stream cannot break the feed.
function readMeta(text, bucket) {
  const one = (re) => (text.match(re) ?? [])[1]?.trim();
  const id = one(/^id:\s*(.+)$/m);
  const status = one(/^status:\s*([a-z-]+)/m);
  const opened = one(/^opened:\s*(\S+)/m);
  const prs = (one(/^prs:\s*\[([^\]]*)\]/m) ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  // Both YAML list spellings appear in the corpus and neither is preferred — an inline
  // `packages: ['@fgv/ts-extras']` on 31 streams, a block list on 21. Reading only the block form
  // silently attributed more than half of them to no package at all, which is the quiet-failure
  // shape this whole exercise keeps running into: the feed rendered, nothing errored, and the
  // entries simply were not there.
  const pkgInline = text.match(/^packages:\s*\[([^\]]*)\]/m);
  const pkgBlock = text.match(/^packages:\s*\n((?:\s+- .+\n)+)/m);
  const pkgSrc = pkgInline ? pkgInline[1] : pkgBlock ? pkgBlock[1] : '';
  const packages = [...pkgSrc.matchAll(/['"]?(@fgv\/[a-z0-9-]+)['"]?/g)].map((m) => m[1]);

  // `headline` — the purpose-built field. Same two spellings are accepted as `sourceLine`.
  const hBlock = text.match(/^\s+headline:\s*>\s*\n((?:\s{4,}.*\n)+)/m);
  const hQuote = text.match(/^\s+headline:\s*(['"])([\s\S]*?)\1\s*$/m);
  const headline = hBlock
    ? hBlock[1].split('\n').map((l) => l.trim()).filter(Boolean).join(' ')
    : hQuote
      ? hQuote[2].split('\n').map((l) => l.trim()).filter(Boolean).join(' ')
      : undefined;

  // `sourceLine` is written two ways across the corpus — a block scalar on the streams that
  // adopted the convention later, and a quoted single-line string on the earlier ones. Both are
  // read; neither is preferred.
  const block = text.match(/^\s+sourceLine:\s*>\s*\n((?:\s{4,}.*\n)+)/m);
  const quoted = text.match(/^\s+sourceLine:\s*(['"])([\s\S]*?)\1\s*$/m);
  let sourceLine = block
    ? block[1].split('\n').map((l) => l.trim()).filter(Boolean).join(' ')
    : quoted
      ? quoted[2].split('\n').map((l) => l.trim()).filter(Boolean).join(' ')
      : undefined;

  // Some early streams put an entire brief or result document in this field rather than one
  // line. Emitting those would produce a feed nobody can scan, and silently dropping them would
  // hide that the metadata needs fixing — so they are surfaced as `unusable` and reported.
  // A stream that records `artifactLoss` has already explained why it has no one-liner — e.g.
  // safer-fetch, whose meta says the result.md was never written and the evidence to reconstruct
  // it does not exist. That is an honest gap, not a defect, and nagging about it would invite
  // someone to fabricate a summary, which is strictly worse than the gap.
  const documentedGap = /^artifactLoss:/m.test(text);

  if (headline) {
    return { id, status, opened: opened ?? bucket, prs, packages, sourceLine: headline, bucket };
  }

  let unusable;
  if (sourceLine !== undefined) {
    if (sourceLine.length === 0) {
      unusable = documentedGap ? undefined : 'empty, and no artifactLoss explains why';
      sourceLine = undefined;
    } else if (sourceLine.length > 400 || /(^|\s)#{1,4}\s/.test(sourceLine)) {
      unusable =
        sourceLine.length > 400
          ? `${sourceLine.length} chars — a paragraph where a line belongs`
          : 'a document heading, not a summary';
      sourceLine = undefined;
    }
  }

  return { id, status, opened: opened ?? bucket, prs, packages, sourceLine, unusable, bucket };
}

const unusable = [];

async function collectStreams() {
  const out = [];
  if (!existsSync(COMPLETED)) return out;
  for (const bucket of await readdir(COMPLETED, { withFileTypes: true })) {
    if (!bucket.isDirectory()) continue;
    for (const stream of await readdir(join(COMPLETED, bucket.name), { withFileTypes: true })) {
      if (!stream.isDirectory()) continue;
      const meta = join(COMPLETED, bucket.name, stream.name, 'meta.yaml');
      if (!existsSync(meta)) continue;
      const m = readMeta(readFileSync(meta, 'utf8'), bucket.name);
      if (m.status === 'abandoned') continue;
      if (m.sourceLine) out.push(m);
      else if (m.unusable) unusable.push(m);
    }
  }
  // newest first; `opened` is a date for some streams and a YYYY-MM bucket for the rest, and
  // string compare orders both correctly. Ties break on id so the output is stable.
  out.sort((a, b) => (b.opened.localeCompare(a.opened) || a.id.localeCompare(b.id)));
  return out;
}

// The router entry is deliberately shorter than the package one. The router is @-included into
// every session and has a hard byte cap, so the feed there answers "what changed, roughly, and
// where do I read more" — the full sentence lives in the package file, one click away and paid
// for only by someone who wants it.
const ROUTER_ENTRY_CHARS = 132;

const trim = (text, cap) => {
  if (text.length <= cap) return text;
  const cut = text.slice(0, cap);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), cap - 24)).replace(/[\s,;:—-]+$/, '') + '…';
};

const entry = (s, forRouter) => {
  const pr = s.prs.length ? ` ([#${s.prs[0]}](https://github.com/ErikFortune/fgv/pull/${s.prs[0]}))` : '';
  if (!forRouter) return `- **${s.opened}** — ${s.sourceLine}${pr}`;
  const pkgs = s.packages.length ? ` · ${s.packages.map((p) => `\`${p.replace('@fgv/', '')}\``).join(' ')}` : '';
  return `- **${s.opened}** — ${trim(s.sourceLine.replace(/\*\*/g, ''), ROUTER_ENTRY_CHARS)}${pr}${pkgs}`;
};

function splice(path, block, label) {
  const text = readFileSync(path, 'utf8');
  const b = text.indexOf(BEGIN);
  const e = text.indexOf(END);
  if (b === -1 || e === -1) {
    return { path, label, missing: true };
  }
  const next = text.slice(0, b + BEGIN.length) + '\n\n' + block + '\n\n' + text.slice(e);
  return { path, label, stale: next !== text, next };
}

const streams = await collectStreams();
const targets = [];

// router: bounded
targets.push(
  splice(
    ROUTER,
    streams.slice(0, ROUTER_LIMIT).map((s) => entry(s, true)).join('\n') +
      `\n\n*Showing the ${Math.min(ROUTER_LIMIT, streams.length)} most recent of ${streams.length}. ` +
      `Per-package history is in each \`CAPABILITIES.md\`.*`,
    'router'
  )
);

// package files: full history for that package
for (const dir of await readdir(join(REPO_ROOT, 'libraries'), { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const file = join(REPO_ROOT, 'libraries', dir.name, 'CAPABILITIES.md');
  if (!existsSync(file)) continue;
  const name = `@fgv/${dir.name}`;
  const mine = streams.filter((s) => s.packages.includes(name));
  targets.push(
    splice(
      file,
      mine.length
        ? mine.map((s) => entry(s, false)).join('\n')
        : '*No stream has recorded a `sourceLine` against this package yet.*',
      name
    )
  );
}

const missing = targets.filter((t) => t.missing);
const stale = targets.filter((t) => t.stale);

console.log(
  `generate-capability-feed: ${streams.length} usable sourceLine${streams.length === 1 ? '' : 's'}, ` +
    `${unusable.length} unusable, ${targets.length} targets, ` +
    `${stale.length} ${CHECK ? 'stale' : 'updated'}, ${missing.length} without markers`
);

// Reported, never fatal: a malformed `sourceLine` is a metadata defect in a stream that has
// already shipped, and failing CI over it would block unrelated work. Naming them is what gets
// them fixed.
if (unusable.length > 0 && VERBOSE) {
  console.log(`\n  ${unusable.length} streams are absent from the feed:`);
  for (const u of unusable) console.log(`    ${u.id} — sourceLine is ${u.unusable}`);
  console.log(
    '  These are mostly NOT defects: sourceLine is an audit-trail field and a verbatim opener is\n' +
      '  often a heading or a paragraph. To put one of these in the feed, add a `headline` beside\n' +
      '  it — do NOT rewrite sourceLine, which would break the verbatim property it exists for.\n'
  );
}
if (VERBOSE) {
  for (const t of targets) {
    console.log(`  ${t.missing ? 'NOMARK' : t.stale ? 'stale ' : 'ok    '} ${t.label}`);
  }
}

if (missing.length > 0) {
  console.error('\nThese files have no generated region:\n');
  for (const m of missing) console.error(`  ${m.label} — expected ${BEGIN} … ${END}`);
  console.error('\nAdd the markers, or remove the file from the feed.\n');
  process.exit(1);
}

if (CHECK) {
  if (stale.length > 0) {
    console.error('\nThe recent-additions feed is stale in:\n');
    for (const s of stale) console.error(`  ${s.label}`);
    console.error(
      '\nThe feed is derived from each completed stream\'s `summary.sourceLine`. Regenerate with\n' +
        '  node common/scripts/generate-capability-feed.mjs\n' +
        'and commit the result — do not hand-edit inside the generated markers.\n'
    );
    process.exit(1);
  }
} else {
  for (const t of stale) writeFileSync(t.path, t.next);
}
