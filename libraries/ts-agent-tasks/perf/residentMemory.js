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
 *   node perf/residentMemory.js --cohorts fixture,stop,productionProfile [--reps 5] [--out f.json]
 *
 * The stop-state and production-profile cohorts (agent-tasks-m1-stop) live in `stopCohort.js` and
 * `profileCohort.js` over `m1Support.js`; they are not in the default list because they take hours.
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
      'dropped before the rebuild is measured; every arm re-run again.',
    '2026-10-01 (agent-tasks-m1-stop), before any run of either new cohort: added predictions.stop and ' +
      'predictions.productionProfile and their fixture declarations under `extensions`. The four ' +
      'existing predictions, their thresholds, their fixtures and the shared sample method are unchanged.',
    '2026-10-01 (agent-tasks-m1-stop), after one-repetition shakeouts of each new arm and a layer-1 ' +
      'review, before any recorded run of the new cohorts. Harness only: (1) m1 measuring children also ' +
      'sample at JSON parse/stringify boundaries of 64 KiB or more and record old-space and large-object ' +
      'space beside heapUsed, which can only raise an observed peak; verdicts stay on heapUsed; (2) seed-' +
      'once arms are measured on a per-child copy of the seeded tree, because the consumer arm writes; ' +
      '(3) report-only controls added (stop-free paused children; a satisfied cancel); (4) verdict code ' +
      'aligned with the frozen text (breadth names no capacity dimension, repetition counts admission ' +
      'refusals only, fanout requires 32 pinned receipts, the history control must complete its plan). ' +
      'The shakeouts already showed values outside four frozen ranges (receipt peak, release peak, ' +
      'commands per evidence task, evidence open peak against the sharp bound). No prediction, threshold ' +
      'or fixture changed in response; the recorded run reports what it finds.',
    '2026-10-01 (agent-tasks-m1-stop), after the first recorded run of the stop cohort (acc4a974): the ' +
      'five arms with 128-character ids (max-1x1000 none/satisfied/released, retain-control, ' +
      "repeat.fixtureMax) failed at open, because the clone path suffixed each clone's claim ids and a " +
      '128-character id overflowed its bound. The clone path now writes a fresh random claim id of the ' +
      'same length. Those five arms alone were re-run (--only, --merge) and analysed together with the ' +
      "first run's other arms, whose clones keep suffixed claim ids of at most 41 characters — no verdict " +
      'reads a claim id. No prediction, threshold or fixture shape changed.',
    '2026-10-01 (agent-tasks-m1-stop), after both recorded runs: the m1 measuring child sampled its ' +
      '"after close" residual from the async frame that opened the repository, which a suspended frame ' +
      'keeps alive (heap snapshot: GC roots -> stack -> open result -> repository -> TaskIndex). Every ' +
      "m1 arm's afterClose in those runs is inflated by its own index; a diagnostic with the open in an " +
      'inner frame gives the owed corpus 1.18 MiB instead of 13.17 MiB. The open now runs in an inner ' +
      'frame. The residual is not a prediction, no predicted sample is affected (the repository is live ' +
      'at each), and the runs were not repeated for it.'
  ],
  extensions: {
    stated: '2026-10-01, before any run of the stop or productionProfile cohorts, on e662da68c',
    slice: 'M1 remaining cohorts: stop state (after T9) and the production profile (after T8/T8b)',
    stopFixtureProfile:
      "the fixture profile above, unchanged. Its 64 GiB of logical bytes keeps a stop's attempt " +
      'reservations (643,625 B per target) from bounding breadth, so the target bound and the root ' +
      "record's own ceiling are what is measured; the default profile's stop limits are measured " +
      'separately in productionProfile.',
    productionFixtureProfile:
      'defaultTaskCapacityProfile, unmodified. Bulk populations (thousands of archived tasks, or ' +
      'commands on one record) are cloned from a real-path template with fresh ids, claim ids and ' +
      "random payload, validated by the measuring process's durable open; every refusal is reached " +
      'through the real admission path.',
    ids:
      'task ids 32 random hex; host-minted ids (environment newId) 36 random hex; the max-id arms use ' +
      '128 for both, the bound. Presentation payloads are independently generated random hex.',
    tolerance:
      'stop-cohort resident deltas are small (1–5 MiB), so their noise allowance is 0.25 MiB, not 2 MiB: ' +
      'prior runs of this harness repeat post-GC heap within 0.03 MiB. Production-profile cohorts keep ' +
      "the plan's 2 MiB.",
    repetitions:
      'five fresh child processes per arm. The four heavy production arms (history, consumer, ' +
      'evidence, evidence-control) are seeded once per arm and measured in five fresh children; ' +
      'refusal counts are deterministic and the seed is not what varies.'
  },
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
      'all-record-buffering control on the same shape exceeds that bound.',
    // ---- added 2026-10-01, before any run of these cohorts (see `extensions`) -------------------
    stop: {
      premise:
        "Checked against source before predicting, not taken from the brief. (1) A stop's breadth is " +
        'capped at 1,000 targets by defaultMaxStopTargets, refused never truncated, and that is not a ' +
        'capacity dimension. (2) A root is a task record, bounded at 8 MiB (maxTaskRecordBytes), not by ' +
        "record-bytes' 32 MiB. (3) A target carries no source identity: its evidence is sourceId, " +
        'contractVersion, epoch and token, each at most 128 characters — the 4 KiB binding reference stays ' +
        "on the target's own record. So one stop's targets are at most 1,000 x 2,986 B (schema maximum), " +
        "under 3 MiB: record-bytes cannot bound a single stop's breadth. Released and settled intents stay " +
        'on the root as evidence, so it is repetition that the root record bounds.',
      breadth:
        'Under the stop fixture profile a stop over a root with 999 descendants (1,000 targets) is ' +
        'accepted and over 1,000 descendants is refused, failure code `invalid`, naming the bound of ' +
        '1000 — no capacity dimension. A miss means traversal is truncated or the bound is not the gate.',
      diskPerTarget:
        'Root-record bytes per target over the same tree without a stop: accepted 125–140 B; satisfied ' +
        'and released 145–160 B (36-hex minted keys, 32-hex task ids, 1 x 100 / 1 x 1,000 / 10 x 1,000). ' +
        'At 128-character ids, 330–350 B. Target-side bytes per paused native target (its stop command ' +
        'and lifecycle update) 600–3,000 B. A miss outside these ranges means a target or intent carries ' +
        'fields this reading of the converters did not find.',
      evidence:
        'Stable-stop evidence per external target, measured by encoding: 90–130 B at minimal identities, ' +
        '600–640 B at maximal (128-character source id, contract version, epoch, token). It is not ' +
        'resident: the difference of differences (satisfied-max minus none-max) minus (satisfied-small ' +
        'minus none-small) over 999 external targets is within the 0.25 MiB noise, i.e. well under the ' +
        'encoded evidence (~0.6 MiB at maximal). A miss means the latch book or a projection holds evidence.',
      latch:
        'Resident cost per target of a latching intent before any effect (accepted minus none), 200–1,500 ' +
        'B. After release, per target (released minus none) above 0 — the stop-marked commands stay in the ' +
        'stop book while their targets are not archived — and at most 600 B; satisfied minus released is ' +
        'at least 200 B per target (the latch book drops a released intent). Settled (cancel, root ' +
        'archived) retains per target within 100 B of released. 0.25 MiB noise on each difference.',
      repetition:
        'Pause, pump to satisfied, release, repeated on one root over 999 descendants, fixture profile: ' +
        'refused on `record-bytes` (the 8 MiB task-record ceiling, against the root), not `operations`, ' +
        'at cycle 23–27 with 36-hex keys (model: each admission needs the root used bytes plus closeout ' +
        '884,511 + own attempt 627,241 + headroom 12,682 + 1,000 x 2,987 + release 262,144 within 8 MiB; ' +
        'each released intent leaves ~154 KB) and 10–14 with 128-character ids. Under the default profile ' +
        "over 199 descendants the same loop is refused on `operations` (the root's 128 per-task slots: " +
        'two per cycle plus four held) at cycle 62 ± 1, before record-bytes. A miss means the reservation ' +
        'model read from stopLedger.ts is not what governs admission.',
      peak:
        "A wide stop's root record does not dominate peaks: at 10 x 1,000 satisfied targets, open's sampled " +
        "peak above settled exceeds the no-stop tree's by at most 4 MiB, and a release of one 1,000-target " +
        'intent peaks at most 16 MiB above settled. Release latency is reported, not predicted.',
      control:
        "A perf-only control that retains every root's parsed intents at 10 x 1,000 targets with " +
        '128-character ids holds at least 50% of their encoded bytes, and dropping it releases 80–120% of ' +
        'what it held (0.25 MiB noise). If not, the stop arms cannot see retention and nothing in them is ' +
        'evidence.'
    },
    productionProfile: {
      premise:
        'The default profile, unmodified. Anchor, measured by T8b and pinned by saturation.test.ts: the ' +
        '537th plain registration is refused on logical-bytes. Every registration reserves its closeout ' +
        '(999,199 logical bytes), so for any mix carrying live tasks the prediction is that logical-bytes ' +
        'binds first and the 1,000 non-archived ceiling is unreachable. Each fixture records which ' +
        'dimension actually refused, and at what count.',
      plain: 'Tracked tasks with 4,000-hex descriptions: refused on logical-bytes at the 525th–537th.',
      churn:
        'One task list; items created, succeeded and archived in turn: refused on retained-tasks at the ' +
        '10,000th item (the list plus 9,999 items). Post-GC heap above the import baseline at that point: ' +
        '8–24 MiB.',
      owed:
        'One all-category subscription; tasks with 4,000-hex descriptions created and succeeded, never ' +
        'acknowledged: refused on logical-bytes at the 520th–537th. Preparing and acknowledging one receipt ' +
        'peaks at most 16 MiB above settled.',
      fanout:
        'The same with 32 covering subscriptions (the per-update audience maximum), each holding one ' +
        'prepared, unacknowledged receipt: refused on logical-bytes at the 515th–537th. Owed payload is ' +
        "held once per update, not per audience member: post-GC heap exceeds the owed fixture's by at " +
        'most 8 MiB. A miss means per-audience copies.',
      history:
        'Rounds of 25 subscriptions over 10 tasks x 100 title updates each, closed with obligations ' +
        'disposed: refused on acknowledgement-ids in round 7–9, with fewer than 256 subscriptions. Post-GC ' +
        'heap exceeds a control that runs the same rounds with no subscriptions by at most ' +
        "max(2 MiB, 5% of the closed consumer records' bytes) + 1 MiB of subscription identities.",
      consumer:
        'One subscription grown to its 50,000-id cap: what refuses next is that cap (on ' +
        'acknowledgement-ids). One further acknowledgement rewrite in a fresh process parses the whole ' +
        "record: its sampled peak above settled is at least 50% of the consumer record's bytes and at " +
        'most 4x them + 16 MiB. Rewrite latency is reported, not predicted.',
      evidence:
        'External tasks issuing commands with ~120 KB parameters: each task is refused on record-bytes ' +
        '(its 8 MiB record) after 50–56 commands; the repository is then refused on logical-bytes. Settled ' +
        'command bodies stay cold: post-GC heap exceeds the same tasks without commands by at most ' +
        'max(2 MiB, 5% of the added command bytes). Open and rebuild peak above settled are at most 25% of ' +
        'the cold bytes + 16 MiB, and — sharper, from the materialization gate — at most 4 x 8 MiB + 16 MiB.',
      unresolved:
        'External registrations never first-observed: refused on logical-bytes at the 360th–366th. A stop ' +
        'over a native root and unresolved children is admitted for at most 248–256 children, refused on ' +
        'logical-bytes. A stop over a whole repository of plain tracked tasks is admitted at 322–328 tasks.',
      inventory:
        '9,000 archived tasks of the archived-cohort shape (~8 KiB presentation, ~9,900 B on disk each), ' +
        'then live tracked tasks until refused: refused on logical-bytes at the 430th–460th live task, so ' +
        "retained-tasks' 10,000 is not reachable alongside the most live work. Absolute post-GC heap above " +
        'the import baseline 12–30 MiB; open and rebuild peaks above settled within 25% of cold bytes + ' +
        '16 MiB; its full-summary control retains at least 50% of archived presentation and its ' +
        'buffering control exceeds the peak bound.'
    }
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
          // T8b harness correction (2026-09-26), outside the frozen manifest: since T8 PR 1 (#698) an
          // archive writes a tombstone with no updates and storage refuses one that keeps any. Every
          // update here is owed to no one, so dropping them at archive is what the real path does.
          // No prediction, threshold or fixture shape changed; see agent-tasks-t8b result.md § M1.
          updates: archive ? [] : current.updates,
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
      // `spec.profile` is the production-profile cohort's (agent-tasks-m1-stop); absent, as for every
      // frozen cohort, the fixture profile.
      profile: spec.profile !== undefined ? spec.profile(pkg) : fixtureProfile(pkg)
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
  // The agent-tasks-m1-stop cohorts never run without the residency gate before them.
  if ((cohorts.includes('stop') || cohorts.includes('productionProfile')) && !cohorts.includes('fixture')) {
    cohorts.unshift('fixture');
  }
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
  for (const [name, key] of [
    ['stop', 'stop'],
    ['productionProfile', 'profile']
  ]) {
    if (cohorts.includes(name)) {
      // Raw results so far are checkpointed after every arm: a multi-hour run survives a crash.
      const checkpoint = (raw) => {
        if (outFile !== undefined) {
          fs.writeFileSync(`${outFile}.partial-${name}.json`, JSON.stringify(raw));
        }
      };
      // `--only a,b --merge earlier.json`: re-run just those arms; take every other arm's raw data
      // from the earlier report, and analyse the union. The report records both revisions.
      const only = opt('--only', undefined)?.split(',');
      const mergeFile = opt('--merge', undefined);
      const earlier = mergeFile !== undefined ? JSON.parse(fs.readFileSync(mergeFile, 'utf8')) : undefined;
      if (earlier !== undefined) {
        report.supplement = {
          ...(report.supplement ?? {}),
          [name]: { only, base: mergeFile, baseEnvironment: earlier.environment }
        };
      }
      const ran = m1Cohorts()[key].run(reps, checkpoint, { only, base: earlier?.raw?.[name] });
      report.raw[name] = ran.raw;
      report.results[name] = ran.results;
      const verdicts = Object.entries(ran.results.verdicts)
        .map(([k, v]) => `${k} ${v ? 'PASS' : 'MISS'}`)
        .join(', ');
      console.error(`\n${name}: ${verdicts}`);
    }
  }
  emit(report, outFile);
}

/** The agent-tasks-m1-stop cohorts, given this harness's shared machinery. */
function m1Cohorts() {
  const base = {
    lib,
    hex,
    settle,
    nodeRoot,
    sampledRoot,
    fixtureProfile,
    child,
    withRoot,
    stat,
    median,
    fmt,
    seed,
    measure,
    COHORTS
  };
  const m1 = require('./m1Support')(base);
  return { m1, stop: require('./stopCohort')(base, m1), profile: require('./profileCohort')(base, m1) };
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

async function m1ChildMain(mode, args) {
  if (typeof global.gc !== 'function') {
    throw new Error('children run with --expose-gc');
  }
  const cohorts = m1Cohorts();
  const owner = cohorts.stop.modes.includes(mode) ? cohorts.stop : cohorts.profile;
  return owner.childMain(mode, args);
}

if (process.argv[2] === 'm1') {
  m1ChildMain(process.argv[3], process.argv.slice(4)).then(
    (result) => console.log(JSON.stringify(result)),
    (error) => {
      console.error(error);
      process.exit(1);
    }
  );
} else if (['seed', 'measure', 'fixture'].includes(process.argv[2])) {
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
