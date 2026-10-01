/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * M1 stop-state cohort (agent-tasks-m1-stop): what a persisted cascade stop costs, resident and on
 * disk, and what bounds it. Predictions are `MANIFEST.predictions.stop` in `residentMemory.js`,
 * frozen before the first run. Every arm seeds its own corpus in its own child and is measured in
 * another fresh child; no two arms share a corpus.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const MiB = 1024 * 1024;
const NOISE = 0.25 * MiB;

module.exports = function stopCohort(base, m1) {
  const { hex, settle } = base;

  function profileFor(pkg, name) {
    return name === 'default' ? pkg.defaultTaskCapacityProfile : base.fixtureProfile(pkg);
  }

  function widths(spec) {
    return spec.ids === 'max' ? { task: 128, minted: 128 } : { task: 32, minted: 36 };
  }

  function world(pkg, spec) {
    const w = widths(spec);
    const source = spec.external !== undefined ? m1.simulatedSource(pkg, spec.external) : undefined;
    return {
      env: m1.environment(pkg, w.minted),
      registry: m1.registry(pkg, source),
      profile: profileFor(pkg, spec.profile),
      source,
      widths: w
    };
  }

  /** Pumps until the intent leaves `pending`; returns the last result (a failure included). */
  async function pumpToRest(writer, rootId, intentId) {
    let result;
    for (let pass = 0; pass < 200; pass++) {
      result = await writer.reconcileStop({ taskId: rootId, intentId, limit: 1000 });
      if (result.isFailure() || result.value.state !== 'pending') {
        return result;
      }
    }
    return result;
  }

  function pauseOwn(writer, repository, id, rootId) {
    return m1.revisionOf(repository, id).then((expectedRevision) =>
      writer.execute({
        taskId: id,
        operationId: hex(36),
        expectedRevision,
        command: 'pause',
        parameters: {
          reason: { code: 'cascade-stop', summary: `cascade pause of ${rootId} (stop ${hex(36)})` }
        }
      })
    );
  }

  /** Each clone gets its own random title, in its envelope and every update snapshot. */
  function freshTitle(parsed) {
    const title = hex(32);
    parsed.task.envelope.title = title;
    for (const update of parsed.updates ?? []) {
      update.snapshot.envelope.title = title;
    }
  }

  // ----------------------------------------------------------------------------------------------
  // Seed: R roots, each over T - 1 children; then the requested stop state
  // ----------------------------------------------------------------------------------------------

  /**
   * Native trees: each root and one template child go through the real API; the other T - 2
   * children are clones of the template with fresh random ids. External trees register every job
   * through the real API. The stop itself — request, pump, release, archive — always goes through
   * the broker over a reopened repository.
   */
  async function buildTrees(pkg, layout, dir, spec, w) {
    let repository = await m1.initialize(pkg, dir, w);
    let { broker, writer } = m1.brokerOver(pkg, repository, w);
    const op = () => hex(w.widths.minted);
    const policy = spec.mode === 'cancel' ? 'cascade-cancel' : 'cascade-pause';
    const roots = [];
    const templates = [];
    for (let r = 0; r < spec.roots; r++) {
      const rootId = hex(w.widths.task);
      (
        await writer.createTracked({ taskId: rootId, operationId: op(), title: 'root', stopPolicy: policy })
      ).orThrow();
      roots.push(rootId);
      if (spec.external === undefined) {
        const childId = hex(w.widths.task);
        (
          await writer.createTracked({ taskId: childId, operationId: op(), title: 'child', parentId: rootId })
        ).orThrow();
        if (spec.pausedControl === true) {
          // Control, no stop: every task paused by its own command with a stop command's reason —
          // what a released stop leaves on its targets, minus the stop book and the root's intent.
          for (const id of [rootId, childId]) {
            (await pauseOwn(writer, repository, id, rootId)).orThrow();
          }
        }
        templates.push({ rootId, childId, record: (await repository.readCommit(childId)).orThrow() });
      } else {
        for (let j = 0; j < spec.width - 1; j++) {
          const id = hex(w.widths.task);
          const job = w.source.addJob(id, spec.bindingBytes ?? 0);
          (
            await broker.registerExternal('host', {
              taskId: id,
              operationId: op(),
              kind: m1.JOB_KIND,
              detailVersion: 1,
              title: 'job',
              scopes: [m1.SCOPE],
              binding: job.binding,
              recovery: 'reattach',
              parentId: rootId,
              initialObservation: w.source.projection(job)
            })
          ).orThrow();
        }
      }
    }
    repository.close().orThrow();
    broker = writer = repository = undefined;
    if (spec.external === undefined && spec.width > 2) {
      const entries = [];
      for (const { childId, record } of templates) {
        entries.push(
          ...m1.writeClones(
            layout,
            dir,
            record,
            childId,
            spec.width - 2,
            () => hex(w.widths.task),
            freshTitle
          )
        );
      }
      m1.addToManifest(layout, dir, entries);
    }
    return roots;
  }

  async function seed(dir, spec) {
    const { pkg, layout } = base.lib();
    const w = world(pkg, spec);
    const t0 = Date.now();
    const roots = await buildTrees(pkg, layout, dir, spec, w);
    const builtMs = Date.now() - t0;
    const repository = await m1.reopen(pkg, dir, w);
    const { writer } = m1.brokerOver(pkg, repository, w);
    const op = () => hex(w.widths.minted);
    const states = [];
    const timings = { builtMs };
    let t = Date.now();
    if (spec.state !== 'none') {
      for (const rootId of roots) {
        const accepted = (
          await writer.requestStop({
            taskId: rootId,
            expectedRevision: await m1.revisionOf(repository, rootId),
            operationId: op(),
            mode: spec.mode
          })
        ).orThrow();
        let current = accepted;
        if (spec.state !== 'accepted') {
          current = (await pumpToRest(writer, rootId, accepted.intentId)).orThrow();
        }
        if (spec.state === 'released') {
          current = (
            await writer.releaseStop({
              taskId: rootId,
              expectedRevision: await m1.revisionOf(repository, rootId),
              operationId: op(),
              intentId: accepted.intentId
            })
          ).orThrow();
        }
        if (spec.state === 'settled') {
          (
            await writer.archive({
              taskId: rootId,
              operationId: op(),
              expectedRevision: await m1.revisionOf(repository, rootId)
            })
          ).orThrow();
          const record = (await repository.readCommit(rootId)).orThrow();
          current = record.stops.find((s) => s.id === accepted.intentId);
        }
        states.push(current.state);
        // A stop that stalled short of the arm's state would yield deltas for a state never reached.
        const expected = spec.state === 'accepted' ? 'pending' : spec.state;
        if (current.state !== expected) {
          throw new Error(`root ${rootId}: the stop is ${current.state}, not ${expected}`);
        }
      }
    }
    timings.stopMs = Date.now() - t;
    const capacity = m1.capacityOf(repository);
    repository.close().orThrow();
    return { roots, states, timings, capacity, ...encodedOf(dir, roots) };
  }

  /** Exact encoded figures, from the files as written. */
  function encodedOf(dir, roots) {
    const disk = m1.diskOf(dir);
    let rootBytes = 0;
    let targets = 0;
    let targetBytes = 0;
    let evidenceCount = 0;
    let evidenceBytes = 0;
    let intents = 0;
    for (const rootId of roots) {
      const file = path.join(dir, `task-${rootId}.json`);
      rootBytes += fs.statSync(file).size;
      const record = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const intent of record.stops ?? []) {
        intents += 1;
        for (const target of intent.targets) {
          targets += 1;
          const whole = JSON.stringify(target).length + 1;
          targetBytes += whole;
          if (target.stableSourceEvidence !== undefined) {
            const { stableSourceEvidence: __, ...bare } = target;
            evidenceCount += 1;
            evidenceBytes += whole - (JSON.stringify(bare).length + 1);
          }
        }
      }
    }
    return {
      disk,
      rootBytes,
      nonRootTaskBytes: disk.tasks - rootBytes,
      intents,
      targets,
      targetBytes,
      evidenceCount,
      evidenceBytes
    };
  }

  // ----------------------------------------------------------------------------------------------
  // Measure
  // ----------------------------------------------------------------------------------------------

  async function measure(dir, spec, roots) {
    const { pkg } = base.lib();
    const w = world(pkg, spec);
    return m1.openMeasure(dir, w, async (repository, peak, out) => {
      if (spec.variant === 'release') {
        // A rewrite of each wide root: release every latching intent through the broker.
        let { broker, writer } = m1.brokerOver(pkg, repository, w);
        const releases = [];
        // Only primitives survive into the measured release: the parsed root must be unreachable
        // before the settled sample.
        const target = async (rootId) => {
          const record = (await repository.readCommit(rootId)).orThrow();
          return {
            revision: record.task.envelope.revision,
            intentId: record.stops.find((s) => s.state === 'satisfied').id
          };
        };
        for (const rootId of roots) {
          const { revision, intentId } = await target(rootId);
          const before = settle().heapUsed;
          const beforeSpaces = m1.spaces();
          m1.resetPeak(peak);
          const t = process.hrtime.bigint();
          (
            await writer.releaseStop({
              taskId: rootId,
              expectedRevision: revision,
              operationId: hex(w.widths.minted),
              intentId
            })
          ).orThrow();
          m1.sample(peak);
          releases.push({
            ms: Number(process.hrtime.bigint() - t) / 1e6,
            peakAbove: peak.heapUsed - before,
            oldSpaceAbove: peak.oldSpace - beforeSpaces.oldSpace,
            largeObjectAbove: peak.largeObject - beforeSpaces.largeObject
          });
        }
        broker = writer = undefined;
        out.releases = releases;
      }
      if (spec.variant === 'retain-control') {
        // Perf-only control: hold every root's intents, parsed from disk, then drop them.
        const before = settle().heapUsed;
        let held = roots.map(
          (id) => JSON.parse(fs.readFileSync(path.join(dir, `task-${id}.json`), 'utf8')).stops
        );
        const heldAt = settle().heapUsed;
        out.retainedEncoded = held.reduce((n, stops) => n + JSON.stringify(stops).length, 0);
        held = undefined;
        out.retainHeld = heldAt - before;
        out.retainReleased = heldAt - settle().heapUsed;
      }
    });
  }

  // ----------------------------------------------------------------------------------------------
  // Bounds: breadth and repetition
  // ----------------------------------------------------------------------------------------------

  async function breadth(dir, spec) {
    const { pkg, layout } = base.lib();
    const w = world(pkg, spec);
    const roots = await buildTrees(pkg, layout, dir, spec, w);
    const repository = await m1.reopen(pkg, dir, w);
    const { writer } = m1.brokerOver(pkg, repository, w);
    const attempt = await writer.requestStop({
      taskId: roots[0],
      expectedRevision: await m1.revisionOf(repository, roots[0]),
      operationId: hex(w.widths.minted),
      mode: 'pause'
    });
    const record = (await repository.readCommit(roots[0])).orThrow();
    repository.close().orThrow();
    return {
      width: spec.width,
      accepted: attempt.isSuccess(),
      refusal: m1.refusal(attempt),
      rootWritten: record.stops !== undefined
    };
  }

  async function repeat(dir, spec) {
    const { pkg, layout } = base.lib();
    const w = world(pkg, spec);
    const [rootId] = await buildTrees(pkg, layout, dir, spec, w);
    const repository = await m1.reopen(pkg, dir, w);
    const { writer } = m1.brokerOver(pkg, repository, w);
    const file = path.join(dir, `task-${rootId}.json`);
    const cycles = [];
    let refused;
    for (let k = 1; k <= 400 && refused === undefined; k++) {
      const t = Date.now();
      const accepted = await writer.requestStop({
        taskId: rootId,
        expectedRevision: await m1.revisionOf(repository, rootId),
        operationId: hex(w.widths.minted),
        mode: 'pause'
      });
      if (accepted.isFailure()) {
        refused = { cycle: k, ...m1.refusal(accepted) };
        break;
      }
      const pumped = await pumpToRest(writer, rootId, accepted.value.intentId);
      if (pumped.isFailure()) {
        refused = { cycle: k, during: 'reconcile', ...m1.refusal(pumped) };
        break;
      }
      const rest = pumped.value;
      const released = await writer.releaseStop({
        taskId: rootId,
        expectedRevision: await m1.revisionOf(repository, rootId),
        operationId: hex(w.widths.minted),
        intentId: accepted.value.intentId
      });
      if (released.isFailure()) {
        refused = { cycle: k, during: 'release', ...m1.refusal(released) };
        break;
      }
      const record = (await repository.readCommit(rootId)).orThrow();
      cycles.push({
        k,
        state: rest.state,
        rootBytes: fs.statSync(file).size,
        rootOperations: record.operations.length,
        ms: Date.now() - t
      });
    }
    const capacity = m1.capacityOf(repository);
    repository.close().orThrow();
    return {
      width: spec.width,
      profile: spec.profile,
      ids: spec.ids,
      admitted: cycles.length,
      refused,
      cycles,
      capacity
    };
  }

  // ----------------------------------------------------------------------------------------------
  // Parent
  // ----------------------------------------------------------------------------------------------

  const ARMS = {
    shapes: [
      { name: '1x100', roots: 1, width: 100 },
      { name: '1x1000', roots: 1, width: 1000 },
      { name: '10x1000', roots: 10, width: 1000 }
    ],
    states: ['none', 'accepted', 'satisfied', 'released']
  };

  function arm(spec, measureSpec) {
    return base.withRoot((dir) => {
      const seeded = base.child(['m1', 'stop-seed', dir, JSON.stringify(spec)]);
      const measured = base.child([
        'm1',
        'stop-measure',
        dir,
        JSON.stringify({ ...spec, ...(measureSpec ?? {}) }),
        JSON.stringify(seeded.roots)
      ]);
      return { spec, seeded, ...measured };
    });
  }

  /** A failed repetition is recorded, not fatal: one bad child must not discard a long run. */
  function guarded(action) {
    try {
      return action();
    } catch (error) {
      process.stderr.write('!');
      return { error: String(error.message ?? error).slice(0, 2000) };
    }
  }

  function arms(reps, spec, measureSpec) {
    const runs = [];
    for (let r = 0; r < reps; r++) {
      runs.push(guarded(() => arm(spec, measureSpec)));
      process.stderr.write('.');
    }
    return runs;
  }

  function bound(kind, spec) {
    return guarded(() => base.withRoot((dir) => base.child(['m1', kind, dir, JSON.stringify(spec)])));
  }

  const heapOf = (runs, key = 'afterOpen') =>
    base.stat(runs.map((r) => r[key].heapUsed - r.baseline.heapUsed));
  const perTarget = (a, b, targets) => (base.median(a) - base.median(b)) / targets;

  function run(reps, checkpoint) {
    const raw = {};
    const save = () => checkpoint?.(raw);
    const fixture = { profile: 'fixture', mode: 'pause', ids: 'small' };
    for (const shape of ARMS.shapes) {
      for (const state of ARMS.states) {
        raw[`${shape.name}-${state}`] = arms(
          reps,
          { ...fixture, ...shape, state },
          state === 'satisfied' ? { variant: 'release' } : undefined
        );
        save();
      }
    }
    // Control for released-over-none: every task paused by its own command, no stop.
    for (const shape of ARMS.shapes.slice(1)) {
      raw[`${shape.name}-paused`] = arms(reps, { ...fixture, ...shape, state: 'none', pausedControl: true });
      save();
    }
    for (const state of ['none', 'satisfied', 'released']) {
      raw[`max-1x1000-${state}`] = arms(reps, { ...fixture, ids: 'max', roots: 1, width: 1000, state });
    }
    // Control for settled: a satisfied cancel whose root is not archived.
    raw['cancel-satisfied-1x1000'] = arms(reps, {
      ...fixture,
      mode: 'cancel',
      roots: 1,
      width: 1000,
      state: 'satisfied'
    });
    raw['settled-1x1000'] = arms(reps, {
      ...fixture,
      mode: 'cancel',
      roots: 1,
      width: 1000,
      state: 'settled'
    });
    for (const identity of ['small', 'max']) {
      for (const state of ['none', 'satisfied']) {
        raw[`ext-${identity}-${state}`] = arms(reps, {
          ...fixture,
          roots: 1,
          width: 1000,
          state,
          external: identity,
          bindingBytes: identity === 'max' ? 4096 : 0
        });
      }
    }
    raw['ext-max-released'] = arms(reps, {
      ...fixture,
      roots: 1,
      width: 1000,
      state: 'released',
      external: 'max',
      bindingBytes: 4096
    });
    raw['retain-control'] = arms(
      reps,
      { ...fixture, ids: 'max', roots: 10, width: 1000, state: 'satisfied' },
      { variant: 'retain-control' }
    );
    save();
    const breadthRuns = [];
    const repeatRuns = { fixture: [], fixtureMax: [], default: [] };
    for (let r = 0; r < reps; r++) {
      breadthRuns.push(bound('stop-breadth', { ...fixture, roots: 1, width: 1001 }));
      repeatRuns.fixture.push(bound('stop-repeat', { ...fixture, roots: 1, width: 1000 }));
      repeatRuns.fixtureMax.push(bound('stop-repeat', { ...fixture, ids: 'max', roots: 1, width: 1000 }));
      repeatRuns.default.push(
        bound('stop-repeat', { profile: 'default', mode: 'pause', ids: 'small', roots: 1, width: 200 })
      );
      process.stderr.write('+');
      raw.breadth = breadthRuns;
      raw.repeat = repeatRuns;
      save();
    }
    let results;
    try {
      results = analyse(raw);
    } catch (error) {
      results = { per: { analyseError: String(error.stack ?? error) }, verdicts: { analysis: false } };
    }
    return { raw, results };
  }

  function analyse(input) {
    const errors = {};
    const clean = (runs) => runs.filter((r) => r.error === undefined);
    const raw = {};
    for (const [key, value] of Object.entries(input)) {
      if (Array.isArray(value)) {
        raw[key] = clean(value);
        if (raw[key].length < value.length) {
          errors[key] = value.filter((r) => r.error !== undefined).map((r) => r.error);
        }
      } else {
        raw[key] = Object.fromEntries(Object.entries(value).map(([k, runs]) => [k, clean(runs)]));
      }
    }
    const med = (runs, f) => base.median(runs.map(f));
    const verdicts = {};
    const per = { errors };
    for (const shape of ARMS.shapes) {
      const targets = shape.roots * shape.width;
      const none = raw[`${shape.name}-none`];
      const at = (state) => raw[`${shape.name}-${state}`];
      const rootDelta = (state) =>
        (med(at(state), (r) => r.seeded.rootBytes) - med(none, (r) => r.seeded.rootBytes)) / targets;
      const heapDelta = (a, b) =>
        perTarget(
          a.map((r) => r.afterOpen.heapUsed - r.baseline.heapUsed),
          b.map((r) => r.afterOpen.heapUsed - r.baseline.heapUsed),
          targets
        );
      per[shape.name] = {
        targets,
        heap: Object.fromEntries(ARMS.states.map((s) => [s, heapOf(at(s))])),
        diskRootPerTarget: {
          accepted: rootDelta('accepted'),
          satisfied: rootDelta('satisfied'),
          released: rootDelta('released')
        },
        diskTargetSidePerTarget:
          (med(at('satisfied'), (r) => r.seeded.nonRootTaskBytes) -
            med(none, (r) => r.seeded.nonRootTaskBytes)) /
          (targets - shape.roots),
        residentPerTarget: {
          latching: heapDelta(at('accepted'), none),
          satisfiedOverReleased: heapDelta(at('satisfied'), at('released')),
          released: heapDelta(at('released'), none)
        },
        deltasMiB: {
          accepted:
            (med(at('accepted'), (r) => r.afterOpen.heapUsed - r.baseline.heapUsed) -
              med(none, (r) => r.afterOpen.heapUsed - r.baseline.heapUsed)) /
            MiB,
          satisfiedOverReleased:
            (med(at('satisfied'), (r) => r.afterOpen.heapUsed - r.baseline.heapUsed) -
              med(at('released'), (r) => r.afterOpen.heapUsed - r.baseline.heapUsed)) /
            MiB,
          released:
            (med(at('released'), (r) => r.afterOpen.heapUsed - r.baseline.heapUsed) -
              med(none, (r) => r.afterOpen.heapUsed - r.baseline.heapUsed)) /
            MiB
        },
        shapes: Object.fromEntries(ARMS.states.map((s) => [s, at(s)[0].shape])),
        states: Object.fromEntries(ARMS.states.map((s) => [s, at(s)[0].seeded.states])),
        openPeakAbove: Object.fromEntries(
          ARMS.states.map((s) => [s, base.stat(at(s).map((r) => r.openPeak - r.afterOpen.heapUsed))])
        ),
        releases: at('satisfied').flatMap((r) => r.releases ?? [])
      };
    }
    // Marginal slope 1x100 -> 1x1000 per state: free of the fixed per-root cost the frozen
    // per-target figures amortize (reported beside them; the 1x100 latch slack is wider than every
    // range, so that shape cannot fail the latch verdict — do not read it as evidence for it).
    const slope = (state, f) =>
      (med(raw[`1x1000-${state}`], f) -
        med(raw['1x1000-none'], f) -
        (med(raw[`1x100-${state}`], f) - med(raw['1x100-none'], f))) /
      900;
    per.marginal = Object.fromEntries(
      ['accepted', 'satisfied', 'released'].map((state) => [
        state,
        {
          rootBytes: slope(state, (r) => r.seeded.rootBytes),
          heap: slope(state, (r) => r.afterOpen.heapUsed - r.baseline.heapUsed)
        }
      ])
    );
    // released-over-none bundles the stop book with ordinary paused-task growth; the paused
    // control separates them.
    per.releasedDecomposition = Object.fromEntries(
      ARMS.shapes.slice(1).map((shape) => {
        const targets = shape.roots * shape.width;
        const h = (state) =>
          med(raw[`${shape.name}-${state}`], (r) => r.afterOpen.heapUsed - r.baseline.heapUsed);
        const d = (state) => med(raw[`${shape.name}-${state}`], (r) => r.seeded.disk.tasks);
        return [
          shape.name,
          {
            pausedOverNone: (h('paused') - h('none')) / targets,
            stopResidueOverPaused: (h('released') - h('paused')) / targets,
            diskPausedOverNone: (d('paused') - d('none')) / targets,
            diskStopResidueOverPaused: (d('released') - d('paused')) / targets,
            pausedShape: raw[`${shape.name}-paused`][0]?.shape
          }
        ];
      })
    );
    // Disk per target, predicted ranges (36-hex minted keys, 32-hex task ids).
    const inRange = (v, lo, hi) => v >= lo && v <= hi;
    verdicts.diskPerTarget = ARMS.shapes.every((s) => {
      const d = per[s.name];
      return (
        inRange(d.diskRootPerTarget.accepted, 125, 140) &&
        inRange(d.diskRootPerTarget.satisfied, 145, 160) &&
        inRange(d.diskRootPerTarget.released, 145, 160) &&
        inRange(d.diskTargetSidePerTarget, 600, 3000)
      );
    });
    const maxNone = raw['max-1x1000-none'];
    const maxRoot = (state) =>
      (med(raw[`max-1x1000-${state}`], (r) => r.seeded.rootBytes) - med(maxNone, (r) => r.seeded.rootBytes)) /
      1000;
    per.max = {
      diskRootPerTarget: { satisfied: maxRoot('satisfied'), released: maxRoot('released') },
      residentPerTarget: {
        satisfied: perTarget(
          raw['max-1x1000-satisfied'].map((r) => r.afterOpen.heapUsed - r.baseline.heapUsed),
          maxNone.map((r) => r.afterOpen.heapUsed - r.baseline.heapUsed),
          1000
        ),
        released: perTarget(
          raw['max-1x1000-released'].map((r) => r.afterOpen.heapUsed - r.baseline.heapUsed),
          maxNone.map((r) => r.afterOpen.heapUsed - r.baseline.heapUsed),
          1000
        )
      }
    };
    verdicts.diskPerTargetMax =
      inRange(per.max.diskRootPerTarget.satisfied, 330, 350) &&
      inRange(per.max.diskRootPerTarget.released, 330, 350);

    // Evidence: encoded bytes per record, and residency as a difference of differences.
    const heapMed = (runs) => med(runs, (r) => r.afterOpen.heapUsed - r.baseline.heapUsed);
    const ev = (identity) => {
      const sat = raw[`ext-${identity}-satisfied`];
      return {
        perRecord: med(sat, (r) => r.seeded.evidenceBytes / r.seeded.evidenceCount),
        count: sat[0].seeded.evidenceCount,
        encodedTotal: med(sat, (r) => r.seeded.evidenceBytes),
        residentDelta: heapMed(sat) - heapMed(raw[`ext-${identity}-none`]),
        states: sat[0].seeded.states
      };
    };
    per.evidence = { small: ev('small'), max: ev('max') };
    // Evidence plus any identity-scaled, satisfied-only copy (the paused observation's new token,
    // the marked command) — the prediction's wording tolerates both.
    per.evidence.differenceOfDifferences = per.evidence.max.residentDelta - per.evidence.small.residentDelta;
    per.evidence.maxReleasedOverNone = heapMed(raw['ext-max-released']) - heapMed(raw['ext-max-none']);
    verdicts.evidence =
      inRange(per.evidence.small.perRecord, 90, 130) &&
      inRange(per.evidence.max.perRecord, 600, 640) &&
      Math.abs(per.evidence.differenceOfDifferences) <= NOISE &&
      per.evidence.small.count === 999 &&
      per.evidence.max.count === 999;

    // Latch: per-target resident ranges, with the 0.25 MiB noise applied to each difference.
    verdicts.latch = ARMS.shapes.every((s) => {
      const d = per[s.name];
      const slack = NOISE / d.targets;
      return (
        d.residentPerTarget.latching >= 200 - slack &&
        d.residentPerTarget.latching <= 1500 + slack &&
        d.residentPerTarget.released > -slack &&
        d.residentPerTarget.released <= 600 + slack &&
        d.residentPerTarget.satisfiedOverReleased >= 200 - slack
      );
    });
    const settled = raw['settled-1x1000'];
    const cancelled = raw['cancel-satisfied-1x1000'];
    per.settled = {
      states: settled[0].seeded.states,
      residentPerTargetOverNone: (heapMed(settled) - heapMed(raw['1x1000-none'])) / 1000,
      // The frozen comparison mixes policy, terminal children and the root's archive; these split it.
      cancelSatisfiedOverNone: (heapMed(cancelled) - heapMed(raw['1x1000-none'])) / 1000,
      settledOverCancelSatisfied: (heapMed(settled) - heapMed(cancelled)) / 1000,
      shape: settled[0].shape,
      cancelSatisfiedShape: cancelled[0]?.shape
    };
    verdicts.settled =
      settled.every((r) => r.seeded.states.every((s) => s === 'settled')) &&
      Math.abs(per.settled.residentPerTargetOverNone - per['1x1000'].residentPerTarget.released) <=
        100 + NOISE / 1000;

    // Breadth.
    per.breadth = raw.breadth.map((r) => ({
      accepted: r.accepted,
      rootWritten: r.rootWritten,
      ...r.refusal
    }));
    verdicts.breadth =
      raw.breadth.every(
        (r) =>
          !r.accepted &&
          !r.rootWritten &&
          r.refusal.code === 'invalid' &&
          r.refusal.dimension === undefined &&
          /more than 1000 tasks/.test(r.refusal.message)
      ) && raw['1x1000-accepted'].every((r) => r.seeded.states[0] === 'pending' && r.seeded.targets === 1000);

    // Repetition.
    const rep = (runs) => ({
      admitted: base.stat(runs.map((r) => r.admitted)),
      refusedAtCycle: base.stat(runs.map((r) => r.refused?.cycle ?? NaN)),
      dimensions: [...new Set(runs.map((r) => r.refused?.dimension))],
      codes: [...new Set(runs.map((r) => r.refused?.code))],
      perCycleRootBytes: base.median(
        runs.map((r) =>
          r.cycles.length > 1
            ? (r.cycles[r.cycles.length - 1].rootBytes - r.cycles[0].rootBytes) / (r.cycles.length - 1)
            : NaN
        )
      ),
      lastRootBytes: base.median(runs.map((r) => r.cycles[r.cycles.length - 1]?.rootBytes ?? NaN)),
      cycleMs: base.median(runs.map((r) => base.median(r.cycles.map((c) => c.ms)))),
      message: runs[0].refused?.message
    });
    per.repetition = {
      fixture: rep(raw.repeat.fixture),
      fixtureMax: rep(raw.repeat.fixtureMax),
      default: rep(raw.repeat.default)
    };
    const refusedIn = (runs, dimension, lo, hi) =>
      runs.length > 0 &&
      runs.every(
        (r) =>
          r.refused?.dimension === dimension &&
          r.refused.during === undefined &&
          r.refused.cycle >= lo &&
          r.refused.cycle <= hi
      );
    verdicts.repetition =
      refusedIn(raw.repeat.fixture, 'record-bytes', 23, 27) &&
      refusedIn(raw.repeat.fixtureMax, 'record-bytes', 10, 14) &&
      refusedIn(raw.repeat.default, 'operations', 61, 63);

    // Peak.
    const p10 = per['10x1000'];
    per.peak = {
      openPeakSatisfiedOverNone: p10.openPeakAbove.satisfied.median - p10.openPeakAbove.none.median,
      releasePeakAbove: base.stat(p10.releases.concat(per['1x1000'].releases).map((r) => r.peakAbove)),
      releaseMs: base.stat(p10.releases.concat(per['1x1000'].releases).map((r) => r.ms)),
      releaseOldSpaceAbove: base.stat(
        p10.releases.concat(per['1x1000'].releases).map((r) => r.oldSpaceAbove ?? NaN)
      ),
      openPeakOldSpace: Object.fromEntries(
        ['none', 'satisfied'].map((s) => [
          s,
          base.stat(raw[`10x1000-${s}`].map((r) => r.openPeakSpaces.oldSpace - r.afterOpenSpaces.oldSpace))
        ])
      )
    };
    verdicts.peak =
      per.peak.openPeakSatisfiedOverNone <= 4 * MiB && per.peak.releasePeakAbove.max <= 16 * MiB;

    // Control.
    const control = raw['retain-control'];
    per.control = {
      encoded: base.stat(control.map((r) => r.retainedEncoded)),
      held: base.stat(control.map((r) => r.retainHeld)),
      released: base.stat(control.map((r) => r.retainReleased))
    };
    verdicts.control = control.every(
      (r) =>
        r.retainHeld >= 0.5 * r.retainedEncoded - NOISE &&
        r.retainReleased >= 0.8 * r.retainHeld - NOISE &&
        r.retainReleased <= 1.2 * r.retainHeld + NOISE
    );
    per.armsMeasured = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.length : Object.fromEntries(Object.entries(v).map(([a, b]) => [a, b.length]))
      ])
    );
    return { per, verdicts };
  }

  async function childMain(mode, args) {
    const [dir, specText, rootsText] = args;
    const spec = JSON.parse(specText);
    if (mode === 'stop-seed') {
      return seed(dir, spec);
    }
    if (mode === 'stop-measure') {
      return measure(dir, spec, JSON.parse(rootsText));
    }
    if (mode === 'stop-breadth') {
      return breadth(dir, spec);
    }
    return repeat(dir, spec);
  }

  return { run, childMain, modes: ['stop-seed', 'stop-measure', 'stop-breadth', 'stop-repeat'] };
};
