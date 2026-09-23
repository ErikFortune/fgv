/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * M1 — resident-memory and reopen/rebuild measurement for the task repository.
 *
 * Deliberately NOT a jest test (TESTING_GUIDELINES.md § Measurement Harnesses). It prints
 * machine-dependent bytes, so it runs on demand against the built package and its output goes
 * into the stream's `result.md`. The deterministic evidence — projection shape, entry counts,
 * candidate visits, record reads, materializations in flight — is the normal suite's
 * (`src/test/unit/storage/counters.test.ts`); nothing here replaces it.
 *
 *   node perf/residentMemory.js [--reps 5] [--cohorts fixture,archived,terminal,peak] [--out f.json]
 *
 * Requires a built `lib/` (`rushx build`). The parent never measures anything itself: every
 * number comes from a fresh child process (`node --expose-gc`), and every arm of every cohort
 * seeds its own corpus in its own child, on a real Node root under the OS temp directory, which
 * the parent deletes afterwards. No two arms share a corpus.
 *
 * The prediction manifest below was written before the first run and is not edited after one.
 * A miss is reported as a miss: diagnose the harness first, then revise the design or profile —
 * never the threshold.
 */

/* eslint-disable no-console */

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const MiB = 1024 * 1024;

// ------------------------------------------------------------------------------------------------
// The prediction manifest — frozen before the first run
// ------------------------------------------------------------------------------------------------

const MANIFEST = {
  stated: '2026-09-23, before any run of this harness',
  slice: 'T4 (early run; M1 repeats after T7/T8 add history and reservations)',
  sampleMethod:
    'post-GC heapUsed after four forced gc() passes, outside any measured open/rebuild phase; ' +
    'peaks are heapUsed sampled at every record read (instrumented FileTree proxy) — a sampled ' +
    'high-water, not an allocator maximum — plus process maxRSS for the whole child lifetime',
  repetitions: 'five fresh child processes per arm (--reps)',
  fixtureProfile:
    'retained 25,000; non-archived 11,000; updates 100,000; audience links and acknowledgement ids ' +
    '5,000,000 each; operations 100,000; logical bytes 64 GiB; resident payload 8 GiB; everything ' +
    'else the default profile. Declared because the default admits neither 10,000 archived tasks next ' +
    'to 100 fixed ones nor, through closeout audience reservations, more than ~890 non-archived tasks.',
  amendments: [
    '2026-09-23, after a one-repetition shakeout run and before any recorded run: the peak fixture ' +
      'was 1,100 x 60,000 bytes = 66,000,000 bytes, under its own stated 64 MiB precondition, and the ' +
      "harness's precondition check refused it. The fixture count was raised to 1,200; no threshold changed.",
    '2026-09-23, after the first recorded run (all predictions held): the post-close residual is not a ' +
      'prediction, but it was inflated because the measuring child still held the repository through ' +
      "open's result and the inspection. Both references are now dropped before the after-close sample, " +
      'and every arm was re-run so all reported numbers come from one harness version.',
    '2026-09-23, after the second recorded run (all predictions held again): settled heap after a ' +
      'rebuild sat ~6.4 MiB above settled heap after open at 10,000 archived tasks, because the ' +
      "harness's inspection snapshot still referenced the old generation's maps. The snapshot is now " +
      'dropped before the rebuild is measured; every arm re-run again.'
  ],
  predictions: {
    fixture:
      'A 16 MiB corpus of independently generated random hex allocates at least 80% of its payload, ' +
      'and dropping it releases 80–120% of what it allocated (1 MiB noise). If not, stop: the ' +
      'fixture is not resident and nothing downstream means anything.',
    archived:
      '100 fixed non-archived tasks; 0 / 1,000 / 10,000 archived children of one parent, each with a ' +
      '128-byte source key and ~8 KiB of unique presentation data. Identity/edge/source entry counts ' +
      'grow linearly (projections = 100 + n, children = n, sources = n). At 1,000 → 10,000 the minimal ' +
      "projection's incremental post-GC heap is at most 25% of the full-summary-retaining control's " +
      'increment, and is not flat (at least 1 MiB).',
    terminal:
      '100 fixed open tasks plus 100 / 500 / 900 non-archived terminal tasks carrying ~6 KiB of unique ' +
      'presentation (description, progress summary) each. Non-archived terminal tasks keep full ' +
      'summaries: from 100 to 900 the post-GC heap grows by at least 50% of the added presentation ' +
      'bytes (2 MiB noise). Archiving all of them through the real commit path then releases at least ' +
      '50% of their presentation bytes (2 MiB noise), while their identity entries remain.',
    peak:
      'Fixed projection (100 open tasks), plus at least 64 MiB of archived cold history (1,200 archived ' +
      'tasks with ~60 KB details each). The sampled peak heap above the settled resident state, for a ' +
      'cold open and for a warm rebuild, is at most 25% of the added cold bytes + 16 MiB. An ' +
      'all-record-buffering control on the same shape exceeds that bound.'
  }
};

// ------------------------------------------------------------------------------------------------
// Shared: the built package, a harness kind with a payload field, and fixture generation
// ------------------------------------------------------------------------------------------------

function lib() {
  const pkg = require('../lib/index');
  const layout = require('../lib/packlets/storage/layout');
  const internals = require('../lib/packlets/storage/internals');
  return { pkg, layout, internals };
}

const { FileTree } = require('@fgv/ts-json-base');
const { Converters, Logging, succeed } = require('@fgv/ts-utils');

function hex(bytes) {
  return crypto
    .randomBytes(Math.ceil(bytes / 2))
    .toString('hex')
    .slice(0, bytes);
}

function fixtureProfile(pkg) {
  const d = pkg.defaultTaskCapacityProfile;
  return {
    ...d,
    limits: {
      ...d.limits,
      'retained-tasks': 25000,
      'non-archived-tasks': 11000,
      updates: 100000,
      'audience-links': 5000000,
      'acknowledgement-ids': 5000000,
      operations: 100000,
      'logical-bytes': 64 * 1024 * MiB,
      'resident-payload-bytes': 8 * 1024 * MiB
    }
  };
}

const PERF_KIND = 'perf.job';

function registry(pkg) {
  const converters = pkg.TaskConverters.create().orThrow();
  const reg = pkg.TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
  reg.register(pkg.trackedTaskDescriptor()).orThrow();
  reg
    .register({
      kind: PERF_KIND,
      detailVersion: 1,
      details: Converters.strictObject({ blob: Converters.string }),
      encode: (value) => succeed({ blob: value.blob })
    })
    .orThrow();
  return reg;
}

let idCounter = 0;
function environment(pkg) {
  return pkg.TaskEnvironment.create({
    logger: new Logging.InMemoryLogger('error'),
    clock: () => Date.parse('2026-09-23T00:00:00.000Z'),
    newId: () => succeed(`perf-${process.pid}-${++idCounter}`)
  }).orThrow();
}

function nodeRoot(dir) {
  const accessors = new FileTree.FsFileTreeAccessors({ prefix: dir, mutable: true });
  return FileTree.DirectoryItem.create(dir, accessors).orThrow();
}

const AT = '2026-09-23T00:00:00.000Z';
const SCOPE = { namespace: 'perf', key: 'main' };

function envelope(id, extra) {
  return {
    schemaVersion: 1,
    id,
    kind: PERF_KIND,
    detailVersion: 1,
    revision: 1,
    title: `perf ${id}`,
    stopPolicy: 'none',
    scopes: [SCOPE],
    lifecycle: { status: 'pending' },
    attention: [],
    recovery: 'not-recoverable',
    observation: { state: 'current', observedAt: AT },
    createdAt: AT,
    changedAt: AT,
    ...extra
  };
}

function registration(id, env, blob) {
  const request = { taskId: id };
  return {
    taskId: id,
    operationId: `create-${id}`,
    request,
    record: {
      recordType: 'resolved',
      task: { envelope: env, details: { blob } },
      operations: [
        {
          type: 'catalog',
          operationId: `create-${id}`,
          operation: 'create-tracked',
          request,
          principalKey: 'perf',
          receipt: null
        }
      ],
      updates: [
        {
          id: `${id}:1:0`,
          taskId: id,
          revision: 1,
          category: 'lifecycle',
          required: true,
          snapshot: { envelope: env },
          audience: []
        }
      ],
      archived: false
    }
  };
}

async function commit(repository, id, patch, archive) {
  const current = (await repository.readCommit(id)).orThrow();
  const revision = current.task.envelope.revision + 1;
  const env = { ...current.task.envelope, revision, ...patch };
  const operationId = `${archive ? 'archive' : 'finish'}-${id}`;
  return (
    await repository.withWriter((w) =>
      w.commit({
        purpose: 'operation',
        operationId,
        taskId: id,
        expectedRevision: current.task.envelope.revision,
        expectedRecordRevision: current.recordRevision,
        record: {
          recordType: 'resolved',
          task: { envelope: env, details: current.task.details },
          operations: [
            ...current.operations,
            {
              type: 'catalog',
              operationId,
              operation: archive ? 'archive' : 'update-tracked',
              request: { revision },
              principalKey: 'perf',
              receipt: null
            }
          ],
          updates: current.updates,
          archived: archive
        }
      })
    )
  ).orThrow();
}

const SUCCEEDED = { status: 'succeeded', outcome: { summary: 'done', artifacts: [] } };

// ------------------------------------------------------------------------------------------------
// Child: seed
// ------------------------------------------------------------------------------------------------

/**
 * Seeds a root. Fixed tasks and each cohort's template go through the real API; the rest of a
 * cohort are clones of the template's committed record with fresh ids, claim ids and — so no two
 * tasks share a backing store — freshly generated random payload. The measuring child's real
 * durable `open` is what validates them.
 */
async function seed(dir, spec) {
  const { pkg, layout } = lib();
  const root = nodeRoot(dir);
  const repository = (
    await pkg.FileTreeTaskRepository.initialize({
      root,
      mode: 'session',
      environment: environment(pkg),
      registry: registry(pkg),
      profile: fixtureProfile(pkg)
    })
  ).orThrow();
  for (let i = 0; i < spec.fixed; i++) {
    const id = `fixed${String(i).padStart(4, '0')}`;
    (await repository.withWriter((w) => w.register(registration(id, envelope(id, {}), 'x')))).orThrow();
  }
  let payloadBytes = 0;
  const templates = [];
  for (const cohort of spec.cohorts) {
    if (cohort.count === 0) {
      continue;
    }
    const id = `${cohort.prefix}00000`;
    const env = envelope(id, cohort.envelope(id));
    (await repository.withWriter((w) => w.register(registration(id, env, cohort.blob())))).orThrow();
    await commit(repository, id, { lifecycle: SUCCEEDED }, false);
    if (cohort.archive) {
      await commit(repository, id, {}, true);
    }
    templates.push({ cohort, record: (await repository.readCommit(id)).orThrow() });
  }
  repository.close().orThrow();

  const manifestText = fs.readFileSync(path.join(dir, 'repository.json'), 'utf8');
  const manifest = JSON.parse(manifestText);
  const entries = [...manifest.tasks];
  for (const { cohort, record } of templates) {
    const templateId = `${cohort.prefix}00000`;
    const text = layout.encodeRecord(record).orThrow().text;
    const claimIds = record.capacityClaims.map((c) => c.claimId);
    for (let i = 0; i < cohort.count; i++) {
      const id = `${cohort.prefix}${String(i).padStart(5, '0')}`;
      let clone = text.split(templateId).join(id);
      for (const claimId of claimIds) {
        clone = clone.split(`"${claimId}"`).join(`"${claimId}x${i}"`);
      }
      const parsed = JSON.parse(clone);
      // Fresh, independently generated payload for this task: presentation fields in the
      // envelope and every update snapshot, the source reference and the details blob.
      const fresh = cohort.envelope(id);
      const blob = cohort.blob();
      parsed.task.envelope = { ...parsed.task.envelope, ...fresh };
      for (const update of parsed.updates) {
        update.snapshot.envelope = { ...update.snapshot.envelope, ...fresh };
      }
      parsed.task.details = { blob };
      payloadBytes += cohort.payloadBytes(fresh, blob);
      const encoded = layout.encodeRecord(parsed).orThrow().text;
      fs.writeFileSync(path.join(dir, `task-${id}.json`), encoded);
      if (i > 0) {
        entries.push({ id, state: 'live' });
      }
    }
  }
  entries.sort((a, b) => (a.id < b.id ? -1 : 1));
  const next = { ...manifest, manifestRevision: manifest.manifestRevision + 1, tasks: entries };
  fs.writeFileSync(path.join(dir, 'repository.json'), layout.encodeRecord(next).orThrow().text);
  let diskBytes = 0;
  for (const name of fs.readdirSync(dir)) {
    diskBytes += fs.statSync(path.join(dir, name)).size;
  }
  return { tasks: entries.length, payloadBytes, diskBytes };
}

const COHORTS = {
  archived: (n) => ({
    fixed: 100,
    cohorts: [
      {
        prefix: 'arch',
        count: n,
        archive: true,
        // ~8 KiB of unique presentation: 4 KiB description, 4 KiB details, 128-byte source key.
        envelope: () => ({
          parentId: 'fixed0000',
          description: hex(4000),
          binding: { sourceId: 'perf', referenceVersion: 1, reference: hex(128) }
        }),
        blob: () => hex(4096),
        payloadBytes: (env, blob) => env.description.length + blob.length + 128
      }
    ]
  }),
  terminal: (n) => ({
    fixed: 100,
    cohorts: [
      {
        prefix: 'term',
        count: n,
        archive: false,
        // ~6 KiB of unique presentation, all of it in the envelope — which is the summary.
        envelope: () => ({ description: hex(4000), progress: { summary: hex(2000) } }),
        blob: () => 'x',
        payloadBytes: (env) => env.description.length + env.progress.summary.length
      }
    ]
  }),
  peak: () => ({
    fixed: 100,
    cohorts: [
      {
        prefix: 'cold',
        count: 1200,
        archive: true,
        envelope: () => ({}),
        // ~60 KB of cold details per archived task: 1,200 of them is over 64 MiB.
        blob: () => hex(60000),
        payloadBytes: (_env, blob) => blob.length
      }
    ]
  })
};

// ------------------------------------------------------------------------------------------------
// Child: measure
// ------------------------------------------------------------------------------------------------

function settle() {
  for (let i = 0; i < 4; i++) {
    global.gc();
  }
  return process.memoryUsage();
}

/** A root whose file reads sample the heap: phase samples at every real read boundary. */
function sampledRoot(dir, peak) {
  const inner = nodeRoot(dir);
  const sample = () => {
    const used = process.memoryUsage().heapUsed;
    if (used > peak.heapUsed) {
      peak.heapUsed = used;
    }
  };
  const wrapFile = (file) =>
    new Proxy(file, {
      get(target, prop) {
        const value = target[prop];
        if (typeof value !== 'function') {
          return value;
        }
        return (...args) => {
          sample();
          const result = value.apply(target, args);
          sample();
          return result;
        };
      }
    });
  return new Proxy(inner, {
    get(target, prop) {
      const value = target[prop];
      if (prop === 'getChildren') {
        return () =>
          value
            .call(target)
            .onSuccess((children) => succeed(children.map((c) => (c.type === 'file' ? wrapFile(c) : c))));
      }
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
}

async function measure(dir, variant) {
  const { pkg, internals } = lib();
  const baseline = settle();
  const peak = { heapUsed: 0 };
  let opened = (
    await pkg.FileTreeTaskRepository.open({
      root: sampledRoot(dir, peak),
      mode: { durable: 'process-crash' },
      environment: environment(pkg),
      registry: registry(pkg)
    })
  ).orThrow();
  if (opened.state !== 'ready') {
    throw new Error(
      `open: ${opened.recovery.report.issues
        .slice(0, 3)
        .map((i) => i.message)
        .join('; ')}`
    );
  }
  let repository = opened.repository;
  // The open result holds the repository too; drop it, or "after close" measures the harness.
  opened = undefined;
  const openPeak = peak.heapUsed;
  const afterOpen = settle();
  let inspection = internals.inspectRepository(repository);
  const shape = {
    projections: inspection.projections.size,
    summaries: inspection.index.summaries.size,
    children: [...inspection.index.children.values()].reduce((n, s) => n + s.size, 0),
    sources: inspection.index.sources.size,
    materializationHighWater: inspection.gate.highWater,
    evidence: inspection.evidence
  };
  // Hot queries: zero task-record reads is the normal suite's claim; recorded here as context.
  const readsBefore = inspection.reads.task;
  (await repository.query({ selection: { scopes: [SCOPE], lifecycleClass: 'open' } })).orThrow();
  (await repository.query({ selection: { scopes: [SCOPE], lifecycleClass: 'all' }, limit: 200 })).orThrow();
  const hotReads = inspection.reads.task - readsBefore;

  const out = { variant, baseline, afterOpen, openPeak, shape, hotReads };
  let ids = [...inspection.projections.keys()];

  if (variant === 'full-summary-control') {
    // Perf-only control: what retaining every archived task's full summary and details costs.
    const retained = [];
    for (const id of ids) {
      const read = (await repository.read(id)).orThrow();
      if (read.state === 'resolved' && read.archived) {
        retained.push(read.task);
      }
    }
    out.afterControl = settle();
    out.retainedCount = retained.length;
  }
  if (variant === 'buffer-control') {
    // Perf-only control: an open that buffers every record body before projecting any.
    peak.heapUsed = 0;
    const bodies = [];
    for (const name of fs.readdirSync(dir)) {
      bodies.push(JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
      const used = process.memoryUsage().heapUsed;
      if (used > peak.heapUsed) {
        peak.heapUsed = used;
      }
    }
    out.bufferPeak = peak.heapUsed;
    out.bufferedCount = bodies.length;
  }
  if (variant === 'archive-release') {
    const terminal = ids.filter((id) => id.startsWith('term'));
    for (const id of terminal) {
      await commit(repository, id, {}, true);
    }
    out.afterArchive = settle();
    out.archivedCount = terminal.length;
    out.summariesAfterArchive = internals.inspectRepository(repository).index.summaries.size;
    out.projectionsAfterArchive = internals.inspectRepository(repository).projections.size;
  }
  if (variant === 'minimal' || variant === 'rebuild') {
    // The inspection snapshot references this generation's maps; holding it across a rebuild
    // would measure the harness keeping the old generation alive.
    inspection = undefined;
    peak.heapUsed = 0;
    (await repository.rebuildIndexes()).orThrow();
    out.rebuildPeak = peak.heapUsed;
    out.afterRebuild = settle();
  }
  repository.close().orThrow();
  repository = undefined;
  inspection = undefined;
  ids = undefined;
  out.afterClose = settle();
  out.maxRssKiB = process.resourceUsage().maxRSS;
  return out;
}

// ------------------------------------------------------------------------------------------------
// Child: fixture validity
// ------------------------------------------------------------------------------------------------

function fixtureCheck() {
  const payload = 16 * MiB;
  const base = settle().heapUsed;
  let held = [];
  for (let i = 0; i < payload / 8192; i++) {
    held.push(hex(8192));
  }
  const built = settle().heapUsed - base;
  held = undefined;
  const released = built - (settle().heapUsed - base);
  return { payload, built, released };
}

// ------------------------------------------------------------------------------------------------
// Parent
// ------------------------------------------------------------------------------------------------

function child(args) {
  const run = spawnSync(process.execPath, ['--expose-gc', __filename, ...args], {
    encoding: 'utf8',
    maxBuffer: 64 * MiB
  });
  if (run.status !== 0) {
    throw new Error(`child ${args.join(' ')} failed:\n${run.stderr}`);
  }
  return JSON.parse(run.stdout.trim().split('\n').pop());
}

function withRoot(action) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgv-tasks-m1-'));
  try {
    return action(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function arm(cohort, size, variant) {
  return withRoot((dir) => {
    const seeded = child(['seed', cohort, String(size), dir]);
    const measured = child(['measure', dir, variant]);
    return { cohort, size, variant, seeded, ...measured };
  });
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stat(values) {
  return { median: median(values), min: Math.min(...values), max: Math.max(...values), n: values.length };
}

const fmt = (bytes) => `${(bytes / MiB).toFixed(2)} MiB`;

function runArms(reps, cohort, size, variant) {
  const runs = [];
  for (let r = 0; r < reps; r++) {
    runs.push(arm(cohort, size, variant));
    process.stderr.write('.');
  }
  return runs;
}

function main() {
  const argv = process.argv.slice(2);
  const opt = (name, dflt) => {
    const at = argv.indexOf(name);
    return at >= 0 ? argv[at + 1] : dflt;
  };
  const reps = Number(opt('--reps', '5'));
  const cohorts = opt('--cohorts', 'fixture,archived,terminal,peak').split(',');
  const outFile = opt('--out', undefined);

  const report = {
    manifest: MANIFEST,
    environment: {
      node: process.version,
      v8: process.versions.v8,
      platform: `${os.platform()} ${os.release()}`,
      arch: os.arch(),
      tmpdir: os.tmpdir(),
      adapter: 'FsFileTreeAccessors, durable process-crash open; seeded in a separate process',
      revision: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()
    },
    raw: {},
    results: {}
  };

  if (cohorts.includes('fixture')) {
    const runs = [];
    for (let r = 0; r < reps; r++) {
      runs.push(child(['fixture']));
    }
    report.raw.fixture = runs;
    const built = stat(runs.map((r) => r.built));
    const releasedRatio = stat(runs.map((r) => r.released / r.built));
    const pass =
      runs.every((r) => r.built >= 0.8 * r.payload) &&
      runs.every((r) => r.released >= 0.8 * r.built - MiB && r.released <= 1.2 * r.built + MiB);
    report.results.fixture = { built, releasedRatio, pass };
    console.error(
      `\nfixture: built ${fmt(built.median)} of 16 MiB, released ${(releasedRatio.median * 100).toFixed(
        0
      )}% — ${pass ? 'PASS' : 'MISS'}`
    );
    if (!pass) {
      console.error('the fixture is not resident; stopping before any cohort');
      emit(report, outFile);
      return;
    }
  }

  if (cohorts.includes('archived')) {
    const raw = {};
    for (const size of [0, 1000, 10000]) {
      raw[`minimal-${size}`] = runArms(reps, 'archived', size, 'minimal');
      raw[`control-${size}`] = runArms(reps, 'archived', size, 'full-summary-control');
    }
    report.raw.archived = raw;
    const heap = (runs, key) => stat(runs.map((r) => r[key].heapUsed - r.baseline.heapUsed));
    const minimal = {};
    const control = {};
    for (const size of [0, 1000, 10000]) {
      minimal[size] = heap(raw[`minimal-${size}`], 'afterOpen');
      control[size] = heap(raw[`control-${size}`], 'afterControl');
    }
    const minimalIncrement = minimal[10000].median - minimal[1000].median;
    const controlIncrement = control[10000].median - control[1000].median;
    const shape10k = raw['minimal-10000'][0].shape;
    const linear =
      shape10k.projections === 10100 &&
      shape10k.children === 10000 &&
      shape10k.sources === 10000 &&
      raw['minimal-1000'][0].shape.projections === 1100;
    report.results.archived = {
      minimal,
      control,
      minimalIncrement,
      controlIncrement,
      ratio: minimalIncrement / controlIncrement,
      shape10k,
      pass: linear && minimalIncrement <= 0.25 * controlIncrement && minimalIncrement >= MiB
    };
    console.error(
      `\narchived: minimal +${fmt(minimalIncrement)}, control +${fmt(controlIncrement)} for 1k→10k ` +
        `(ratio ${(minimalIncrement / controlIncrement).toFixed(3)}; linear counts ${linear}) — ${
          report.results.archived.pass ? 'PASS' : 'MISS'
        }`
    );
  }

  if (cohorts.includes('terminal')) {
    const raw = {};
    for (const size of [100, 500, 900]) {
      raw[size] = runArms(reps, 'terminal', size, 'archive-release');
    }
    report.raw.terminal = raw;
    const open = {};
    const archived = {};
    for (const size of [100, 500, 900]) {
      open[size] = stat(raw[size].map((r) => r.afterOpen.heapUsed - r.baseline.heapUsed));
      archived[size] = stat(raw[size].map((r) => r.afterOpen.heapUsed - r.afterArchive.heapUsed));
    }
    const added =
      median(raw[900].map((r) => r.seeded.payloadBytes)) - median(raw[100].map((r) => r.seeded.payloadBytes));
    const growth = open[900].median - open[100].median;
    const release900 = archived[900].median;
    const payload900 = median(raw[900].map((r) => r.seeded.payloadBytes));
    const identitiesKept = raw[900].every(
      (r) => r.projectionsAfterArchive === r.shape.projections && r.summariesAfterArchive === 100
    );
    report.results.terminal = {
      open,
      releasedByArchive: archived,
      addedPresentationBytes: added,
      growth,
      release900,
      payload900,
      identitiesKept,
      pass: growth >= 0.5 * added - 2 * MiB && release900 >= 0.5 * payload900 - 2 * MiB && identitiesKept
    };
    console.error(
      `\nterminal: 100→900 grew ${fmt(growth)} for ${fmt(added)} of presentation; archiving 900 released ` +
        `${fmt(release900)} of ${fmt(payload900)} (identities kept ${identitiesKept}) — ${
          report.results.terminal.pass ? 'PASS' : 'MISS'
        }`
    );
  }

  if (cohorts.includes('peak')) {
    const minimal = runArms(reps, 'peak', 0, 'rebuild');
    const buffered = runArms(reps, 'peak', 0, 'buffer-control');
    report.raw.peak = { minimal, buffered };
    const cold = median(minimal.map((r) => r.seeded.payloadBytes));
    const bound = 0.25 * cold + 16 * MiB;
    const openAbove = stat(minimal.map((r) => r.openPeak - r.afterOpen.heapUsed));
    const rebuildAbove = stat(minimal.map((r) => r.rebuildPeak - r.afterRebuild.heapUsed));
    const bufferAbove = stat(buffered.map((r) => r.bufferPeak - r.afterOpen.heapUsed));
    const pass =
      cold >= 64 * MiB && openAbove.max <= bound && rebuildAbove.max <= bound && bufferAbove.min > bound;
    report.results.peak = { coldPayloadBytes: cold, bound, openAbove, rebuildAbove, bufferAbove, pass };
    console.error(
      `\npeak: cold ${fmt(cold)}; bound ${fmt(bound)}; open peak above settled ${fmt(openAbove.median)} ` +
        `(max ${fmt(openAbove.max)}), rebuild ${fmt(rebuildAbove.median)} (max ${fmt(rebuildAbove.max)}), ` +
        `buffering control ${fmt(bufferAbove.median)} (min ${fmt(bufferAbove.min)}) — ${
          pass ? 'PASS' : 'MISS'
        }`
    );
  }
  emit(report, outFile);
}

function emit(report, outFile) {
  const text = JSON.stringify(report, null, 2);
  if (outFile !== undefined) {
    fs.writeFileSync(outFile, text);
  }
  console.log(JSON.stringify(report.results, null, 2));
}

// ------------------------------------------------------------------------------------------------

async function childMain(mode, args) {
  if (typeof global.gc !== 'function') {
    throw new Error('children run with --expose-gc');
  }
  if (mode === 'seed') {
    const [cohort, size, dir] = args;
    return seed(dir, COHORTS[cohort](Number(size)));
  }
  if (mode === 'measure') {
    const [dir, variant] = args;
    return measure(dir, variant);
  }
  return fixtureCheck();
}

if (['seed', 'measure', 'fixture'].includes(process.argv[2])) {
  childMain(process.argv[2], process.argv.slice(3)).then(
    (result) => console.log(JSON.stringify(result)),
    (error) => {
      console.error(error);
      process.exit(1);
    }
  );
} else {
  main();
}
