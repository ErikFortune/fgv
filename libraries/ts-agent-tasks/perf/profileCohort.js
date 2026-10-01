/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * M1 production-profile cohort (agent-tasks-m1-stop): the default capacity profile, unmodified,
 * qualified at its actual earliest limiting dimension. Each fixture seeds until the real admission
 * path refuses, records which dimension refused and at what count, and is then measured — absolute
 * steady-state heap/RSS, sampled open and rebuild peaks, and the operation the fixture exists for —
 * in fresh child processes. Predictions are `MANIFEST.predictions.productionProfile`, frozen
 * before the first run.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const MiB = 1024 * 1024;
const NOISE = 2 * MiB;

module.exports = function profileCohort(base, m1) {
  const { hex, settle } = base;
  const hostBinding = { principal: 'host', scopes: [m1.SCOPE], authorization: m1.allowAll };

  function world(pkg, external) {
    const source = external === true ? m1.simulatedSource(pkg, 'small') : undefined;
    return {
      env: m1.environment(pkg, 36),
      registry: m1.registry(pkg, source),
      profile: pkg.defaultTaskCapacityProfile,
      source
    };
  }

  const tid = () => hex(32);
  const op = () => hex(36);

  /** Runs `step` until the real path refuses; a refusal that is not backpressure is a harness error. */
  async function untilRefused(step, max) {
    for (let i = 0; i < max; i++) {
      const result = await step(i);
      if (result.isFailure()) {
        const refusal = m1.refusal(result);
        if (refusal.code !== 'backpressure') {
          throw new Error(`step ${i} failed without backpressure: ${result.message}`);
        }
        return { admitted: i, refusedAt: i + 1, refusal };
      }
    }
    throw new Error(`no refusal within ${max} steps`);
  }

  /** The first failure of a sequence of steps, or the last success. */
  async function all(steps) {
    let last;
    for (const step of steps) {
      last = await step();
      if (last.isFailure()) {
        return last;
      }
    }
    return last;
  }

  function create(writer, extra) {
    return writer.createTracked({
      taskId: extra?.taskId ?? tid(),
      operationId: op(),
      title: 'task',
      ...extra
    });
  }

  async function succeedTask(repository, writer, id) {
    return writer.execute({
      taskId: id,
      operationId: op(),
      expectedRevision: await m1.revisionOf(repository, id),
      command: 'succeed',
      parameters: { outcome: { summary: 'done', artifacts: [] } }
    });
  }

  async function archiveTask(repository, writer, id) {
    return writer.archive({
      taskId: id,
      operationId: op(),
      expectedRevision: await m1.revisionOf(repository, id)
    });
  }

  async function retitle(repository, writer, id) {
    return writer.updateTracked({
      taskId: id,
      operationId: op(),
      expectedRevision: await m1.revisionOf(repository, id),
      patch: { title: hex(64) }
    });
  }

  function subscribe(pkg, broker, id) {
    return broker.subscribe(hostBinding, {
      subscriptionId: id,
      operationId: op(),
      consumerId: `consumer-${id}`,
      selection: { scopes: [m1.SCOPE], lifecycleClass: 'all' },
      start: 'from-now',
      policy: { categories: [...pkg.allUpdateCategories].sort() }
    });
  }

  function delivery(broker, id) {
    return broker
      .bindDelivery({ subscriptionId: id, consumerId: `consumer-${id}`, ...hostBinding })
      .orThrow();
  }

  async function owedIds(repository, subscription) {
    const ids = [];
    let cursor;
    do {
      const page = (
        await repository.listOwed({ subscription, limit: 200, ...(cursor ? { cursor } : {}) })
      ).orThrow();
      ids.push(...page.updates.map((u) => u.id));
      cursor = page.nextCursor;
    } while (cursor !== undefined);
    return ids.sort();
  }

  async function disposeAll(repository, broker, subscription, keep) {
    const ids = (await owedIds(repository, subscription)).filter((id) => keep === undefined || !keep(id));
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const disposed = await broker.dispose(hostBinding, {
        subscriptionId: subscription,
        updateIds: chunk,
        reason: 'perf'
      });
      if (disposed.isFailure()) {
        return disposed;
      }
    }
    return { isFailure: () => false, isSuccess: () => true, value: ids.length };
  }

  async function drainCleanup(broker) {
    let pruned = 0;
    for (;;) {
      const report = (await broker.cleanup({ limit: 200 })).orThrow();
      pruned += report.pruned.length;
      if (report.pruned.length === 0) {
        return pruned;
      }
    }
  }

  // ----------------------------------------------------------------------------------------------
  // Fixtures. Each returns { admitted, refusedAt, refusal, ... } plus anything the analysis needs.
  // ----------------------------------------------------------------------------------------------

  const FIXTURES = {
    empty: async () => ({ admitted: 0 }),

    plain: async ({ writer }) => untilRefused(() => create(writer, { description: hex(4000) }), 2000),

    churn: async ({ pkg, layout, dir, w, open }) => {
      let { repository, writer } = await open();
      const list = tid();
      (
        await writer.createTaskList({ taskId: list, operationId: op(), title: 'list', completion: 'manual' })
      ).orThrow();
      const template = tid();
      (await create(writer, { taskId: template, title: hex(64), parentId: list })).orThrow();
      (await succeedTask(repository, writer, template)).orThrow();
      (await archiveTask(repository, writer, template)).orThrow();
      const record = (await repository.readCommit(template)).orThrow();
      repository.close().orThrow();
      const cloned = 9800;
      m1.addToManifest(layout, dir, m1.writeClones(layout, dir, record, template, cloned, tid));
      ({ repository, writer } = await open());
      const real = await untilRefused(async () => {
        const id = tid();
        return all([
          () => create(writer, { taskId: id, title: hex(64), parentId: list }),
          () => succeedTask(repository, writer, id),
          () => archiveTask(repository, writer, id)
        ]);
      }, 1000);
      repository.close().orThrow();
      // Items, counting the real-path template and the clones; the list is the one other task.
      return {
        ...real,
        cloned,
        items: 1 + cloned + real.admitted,
        refusedAtItem: 1 + cloned + real.refusedAt
      };
    },

    owed: async ({ pkg, broker, repository, writer }) => {
      (await subscribe(pkg, broker, 'watcher')).orThrow();
      return untilRefused(async () => {
        const id = tid();
        return all([
          () => create(writer, { taskId: id, description: hex(4000) }),
          () => succeedTask(repository, writer, id)
        ]);
      }, 2000);
    },

    fanout: async ({ pkg, broker, repository, writer }) => {
      const subs = [];
      for (let s = 0; s < 32; s++) {
        const id = `w${String(s).padStart(2, '0')}`;
        (await subscribe(pkg, broker, id)).orThrow();
        subs.push(id);
      }
      const out = await untilRefused(async () => {
        const id = tid();
        return all([
          () => create(writer, { taskId: id, description: hex(4000) }),
          () => succeedTask(repository, writer, id)
        ]);
      }, 2000);
      // One prepared, never-acknowledged receipt per subscription: pinned.
      out.pinned = 0;
      for (const id of subs) {
        if ((await delivery(broker, id).prepare()).isSuccess()) {
          out.pinned += 1;
        }
      }
      return out;
    },

    history: async (ctx) => historyRounds(ctx, 25),
    'history-control': async (ctx) => historyRounds(ctx, 0, ctx.args.plan),

    consumer: async ({ pkg, dir, broker, repository, writer }) => {
      (await subscribe(pkg, broker, 'big')).orThrow();
      let previous;
      const out = await untilRefused(async () => {
        const id = tid();
        const steps = [() => create(writer, { taskId: id })];
        for (let u = 0; u < 100; u++) {
          steps.push(() => retitle(repository, writer, id));
        }
        steps.push(() => succeedTask(repository, writer, id));
        const grown = await all(steps);
        if (grown.isFailure()) {
          return grown;
        }
        // Dispose everything owed but this task's newest update: one obligation stays for the
        // measuring process's acknowledgement rewrite.
        const newest = (await owedIds(repository, 'big'))
          .filter((u) => u.startsWith(`${id}:`))
          .sort()
          .pop();
        const disposed = await disposeAll(repository, broker, 'big', (u) => u === newest);
        if (disposed.isFailure()) {
          return disposed;
        }
        await drainCleanup(broker);
        if (previous !== undefined) {
          const archived = await archiveTask(repository, writer, previous);
          if (archived.isFailure()) {
            return archived;
          }
        }
        previous = id;
        return disposed;
      }, 2000);
      out.history = historyOf(dir, 'big');
      out.owed = (await owedIds(repository, 'big')).length;
      return out;
    },

    evidence: async (ctx) => evidenceFill(ctx, false),
    'evidence-control': async (ctx) => evidenceFill(ctx, true),

    unresolved: async ({ broker, w }) =>
      untilRefused(async () => {
        const id = tid();
        const job = w.source.addJob(id, 0);
        return broker.registerExternal('host', {
          taskId: id,
          operationId: op(),
          kind: m1.JOB_KIND,
          detailVersion: 1,
          title: 'unresolved',
          scopes: [m1.SCOPE],
          binding: job.binding,
          recovery: 'reattach'
        });
      }, 2000),

    inventory: async ({ pkg, dir, open }) => {
      const archived = await base.seed(dir, {
        fixed: 1,
        profile: (p) => p.defaultTaskCapacityProfile,
        cohorts: base.COHORTS.archived(9000).cohorts
      });
      const { repository, writer } = await open(true);
      const live = await untilRefused(() => create(writer, { description: hex(4000) }), 2000);
      repository.close().orThrow();
      return { ...live, archivedPayloadBytes: archived.payloadBytes, archivedTasks: 9000 };
    }
  };

  /** Exact lifetime history ids of a subscription, from its consumer record on disk. */
  function historyOf(dir, subscription) {
    const record = JSON.parse(fs.readFileSync(path.join(dir, `consumer-${subscription}.json`), 'utf8'));
    return record.acknowledged.length + record.disposed.reduce((n, d) => n + d.updateIds.length, 0);
  }

  /**
   * Rounds of `subs` subscriptions over 10 tasks x 100 retitles, closed with obligations disposed,
   * pruned and archived, until the real path refuses. Returns the plan it ran, so a control can
   * run the identical task work with no subscriptions at all.
   */
  async function historyRounds({ pkg, broker, repository, writer }, subs, plan) {
    const ran = [];
    let refusal;
    for (let r = 0; r < (plan?.length ?? 1000) && refusal === undefined; r++) {
      const round = { subscriptions: [], tasks: [] };
      ran.push(round);
      for (let s = 0; s < subs && refusal === undefined; s++) {
        const id = `h${r}x${s}`;
        const subscribed = await subscribe(pkg, broker, id);
        if (subscribed.isFailure()) {
          refusal = { round: r + 1, step: 'subscribe', ...m1.refusal(subscribed) };
        } else {
          round.subscriptions.push(id);
        }
      }
      const shape = plan?.[r] ?? Array.from({ length: 10 }, () => 100);
      for (let t = 0; t < shape.length && refusal === undefined; t++) {
        const id = tid();
        const created = await create(writer, { taskId: id });
        if (created.isFailure()) {
          refusal = { round: r + 1, step: 'create', ...m1.refusal(created) };
          break;
        }
        const task = { id, updates: 0 };
        round.tasks.push(task);
        for (let u = 0; u < shape[t]; u++) {
          const updated = await retitle(repository, writer, id);
          if (updated.isFailure()) {
            refusal = { round: r + 1, step: 'update', ...m1.refusal(updated) };
            break;
          }
          task.updates += 1;
        }
      }
      // Drain the round — also after a refusal, so the measured state matches the control's.
      for (const task of round.tasks) {
        (await succeedTask(repository, writer, task.id)).orThrow();
      }
      for (const id of round.subscriptions) {
        (
          await broker.closeSubscription(hostBinding, {
            subscriptionId: id,
            obligations: 'dispose',
            reason: 'perf'
          })
        ).orThrow();
      }
      await drainCleanup(broker);
      for (const task of round.tasks) {
        (await archiveTask(repository, writer, task.id)).orThrow();
      }
    }
    const closed = ran.reduce((n, round) => n + round.subscriptions.length, 0);
    return {
      admitted: ran.length - (refusal !== undefined ? 1 : 0),
      refusedAt: refusal?.round,
      refusal,
      closedSubscriptions: closed,
      plan: ran.map((round) => round.tasks.map((t) => t.updates))
    };
  }

  /**
   * External jobs issuing `advance` commands with 120,000-character blobs. The first task is filled
   * through the real path until refused; `cloned` copies of it (fresh ids, claim ids, bindings and
   * blobs) fill most of the repository; then real-path tasks fill until a repository-wide refusal.
   * The control registers the same number of jobs, with no commands.
   */
  async function evidenceFill({ pkg, layout, dir, w, open, args }, control) {
    let { repository, writer, broker } = await open();
    const register = (id) => {
      const job = w.source.addJob(id, 0);
      return broker.registerExternal('host', {
        taskId: id,
        operationId: op(),
        kind: m1.JOB_KIND,
        detailVersion: 1,
        title: 'job',
        scopes: [m1.SCOPE],
        binding: job.binding,
        recovery: 'reattach',
        initialObservation: w.source.projection(job)
      });
    };
    const advance = async (id) =>
      writer.execute({
        taskId: id,
        operationId: op(),
        expectedRevision: await m1.revisionOf(repository, id),
        command: 'advance',
        parameters: { blob: hex(120000) }
      });
    const fill = async (id) => untilRefused(() => advance(id), 200);
    const template = tid();
    (await register(template)).orThrow();
    const first = control ? undefined : await fill(template);
    const record = (await repository.readCommit(template)).orThrow();
    repository.close().orThrow();
    const cloned = control ? args.tasks - 1 : 55;
    const refreshBlobs = (value) => {
      if (Array.isArray(value)) {
        value.forEach((v, i) => {
          value[i] = typeof v === 'string' && v.length >= 100000 ? hex(v.length) : refreshBlobs(v);
        });
      } else if (value !== null && typeof value === 'object') {
        for (const key of Object.keys(value)) {
          const v = value[key];
          value[key] = typeof v === 'string' && v.length >= 100000 ? hex(v.length) : refreshBlobs(v);
        }
      }
      return value;
    };
    m1.addToManifest(
      layout,
      dir,
      m1.writeClones(layout, dir, record, template, cloned, tid, (parsed) => refreshBlobs(parsed))
    );
    if (control) {
      return { admitted: args.tasks, tasks: args.tasks };
    }
    ({ repository, writer, broker } = await open());
    const perTask = [first];
    let final;
    for (let t = 0; t < 200 && final === undefined; t++) {
      const id = tid();
      const registered = await register(id);
      if (registered.isFailure()) {
        final = { step: 'register', ...m1.refusal(registered) };
        break;
      }
      const filled = await fill(id);
      perTask.push(filled);
      if (filled.refusal.dimension !== 'record-bytes') {
        final = { step: 'advance', ...filled.refusal };
      }
    }
    repository.close().orThrow();
    const tasks = 1 + cloned + perTask.length - 1;
    return {
      admitted: tasks,
      tasks,
      cloned,
      refusal: final,
      perTask: perTask.map((p) => ({ admitted: p.admitted, dimension: p.refusal.dimension }))
    };
  }

  // ----------------------------------------------------------------------------------------------
  // Searches: the largest stop the default profile admits
  // ----------------------------------------------------------------------------------------------

  async function stopProbe(dir, n, unresolvedChildren) {
    const { pkg } = base.lib();
    const w = world(pkg, unresolvedChildren);
    fs.mkdirSync(dir, { recursive: true });
    const repository = await m1.initialize(pkg, dir, w);
    const { broker, writer } = m1.brokerOver(pkg, repository, w);
    const rootId = tid();
    (await create(writer, { taskId: rootId, stopPolicy: 'cascade-pause' })).orThrow();
    for (let i = 1; i < n; i++) {
      const id = tid();
      if (unresolvedChildren) {
        const job = w.source.addJob(id, 0);
        (
          await broker.registerExternal('host', {
            taskId: id,
            operationId: op(),
            kind: m1.JOB_KIND,
            detailVersion: 1,
            title: 'unresolved',
            scopes: [m1.SCOPE],
            binding: job.binding,
            recovery: 'reattach',
            parentId: rootId
          })
        ).orThrow();
      } else {
        (await create(writer, { taskId: id, parentId: rootId })).orThrow();
      }
    }
    const attempt = await writer.requestStop({
      taskId: rootId,
      expectedRevision: await m1.revisionOf(repository, rootId),
      operationId: op(),
      mode: 'pause'
    });
    repository.close().orThrow();
    fs.rmSync(dir, { recursive: true, force: true });
    return { n, accepted: attempt.isSuccess(), refusal: m1.refusal(attempt) };
  }

  /** Largest n in [lo, hi] whose whole-tree stop is admitted; both ends verified, not assumed. */
  async function search(dir, lo, hi, unresolvedChildren) {
    const probes = [];
    const probe = async (n) => {
      const p = await stopProbe(path.join(dir, `n${n}`), n, unresolvedChildren);
      probes.push(p);
      return p;
    };
    if (!(await probe(lo)).accepted) {
      return { probes, error: `the low end ${lo} was refused` };
    }
    const top = await probe(hi);
    if (top.accepted) {
      return { probes, error: `the high end ${hi} was admitted` };
    }
    let refused = top;
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      const p = await probe(mid);
      if (p.accepted) {
        lo = mid;
      } else {
        hi = mid;
        refused = p;
      }
    }
    return { largestAdmitted: lo, firstRefused: hi, refusal: refused.refusal, probes };
  }

  // ----------------------------------------------------------------------------------------------
  // Children
  // ----------------------------------------------------------------------------------------------

  async function seedChild(dir, fixture, args) {
    const { pkg, layout } = base.lib();
    const w = world(pkg, ['evidence', 'evidence-control', 'unresolved'].includes(fixture));
    let initialized = false;
    // `existing`: the root was initialized by something else (the frozen cohorts' seed).
    const open = async (existing) => {
      const repository =
        initialized || existing === true ? await m1.reopen(pkg, dir, w) : await m1.initialize(pkg, dir, w);
      initialized = true;
      return { repository, ...m1.brokerOver(pkg, repository, w) };
    };
    const t = Date.now();
    let ctx = { pkg, layout, dir, w, open, args };
    if (
      fixture !== 'inventory' &&
      fixture !== 'churn' &&
      fixture !== 'evidence' &&
      fixture !== 'evidence-control'
    ) {
      ctx = { ...ctx, ...(await open()) };
    }
    const out = await FIXTURES[fixture](ctx);
    out.seedMs = Date.now() - t;
    if (ctx.repository !== undefined) {
      out.capacity = m1.capacityOf(ctx.repository);
      ctx.repository.close().orThrow();
    } else {
      const reopened = await m1.reopen(pkg, dir, w);
      out.capacity = m1.capacityOf(reopened);
      reopened.close().orThrow();
    }
    out.disk = m1.diskOf(dir);
    return out;
  }

  async function measureChild(dir, fixture, variant) {
    const { pkg } = base.lib();
    const w = world(pkg, ['evidence', 'evidence-control', 'unresolved'].includes(fixture));
    return m1.openMeasure(dir, w, async (repository, peak, out) => {
      if (variant === 'receipt') {
        let { broker } = m1.brokerOver(pkg, repository, w);
        let d = delivery(broker, 'watcher');
        // Diagnostic context, not a prediction: how many records preparation reads, and how many
        // obligations were owed when it ran.
        const reads = () => base.lib().internals.inspectRepository(repository).reads;
        out.owedBefore = (await owedIds(repository, 'watcher')).length;
        const readsBefore = { ...reads() };
        const before = settle().heapUsed;
        peak.heapUsed = 0;
        let t = process.hrtime.bigint();
        let prepared = (await d.prepare()).orThrow();
        m1.sample(peak);
        out.prepareMs = Number(process.hrtime.bigint() - t) / 1e6;
        out.prepareReads = Object.fromEntries(
          Object.entries(reads()).map(([k, n]) => [k, n - (readsBefore[k] ?? 0)])
        );
        out.prepareChars = prepared.context.text?.length;
        t = process.hrtime.bigint();
        const acked = (await d.acknowledge(prepared.context.receipt)).orThrow();
        m1.sample(peak);
        out.acknowledgeMs = Number(process.hrtime.bigint() - t) / 1e6;
        out.acknowledged = acked.acknowledged?.length;
        out.receiptPeakAbove = peak.heapUsed - before;
        prepared = d = broker = undefined;
      }
      if (variant === 'consumer-ack') {
        let { broker } = m1.brokerOver(pkg, repository, w);
        const ids = await owedIds(repository, 'big');
        out.consumerBytes = fs.statSync(path.join(dir, 'consumer-big.json')).size;
        const before = settle().heapUsed;
        peak.heapUsed = 0;
        const t = process.hrtime.bigint();
        (
          await broker.dispose(hostBinding, { subscriptionId: 'big', updateIds: ids, reason: 'perf' })
        ).orThrow();
        m1.sample(peak);
        out.rewriteMs = Number(process.hrtime.bigint() - t) / 1e6;
        out.rewritePeakAbove = peak.heapUsed - before;
        out.disposed = ids.length;
        broker = undefined;
      }
    });
  }

  async function childMain(mode, args) {
    if (mode === 'profile-seed') {
      const [dir, fixture, argsText] = args;
      return seedChild(dir, fixture, argsText !== undefined ? JSON.parse(argsText) : {});
    }
    if (mode === 'profile-measure') {
      const [dir, fixture, variant] = args;
      return measureChild(dir, fixture, variant);
    }
    const [dir, which] = args;
    return which === 'unresolved' ? search(dir, 235, 270, true) : search(dir, 300, 345, false);
  }

  // ----------------------------------------------------------------------------------------------
  // Parent
  // ----------------------------------------------------------------------------------------------

  /** Seeds once per repetition (or once, for the heavy arms) and measures in fresh children. */
  function runArm(reps, fixture, variant, options) {
    const runs = [];
    const once = options?.seedOnce === true;
    const measureIn = (dir, seeded) => {
      const measured =
        fixture === 'inventory'
          ? base.child(['measure', dir, variant ?? 'minimal'])
          : base.child(['m1', 'profile-measure', dir, fixture, variant ?? 'open']);
      return { fixture, variant: variant ?? 'open', seeded, ...measured };
    };
    if (once) {
      base.withRoot((dir) => {
        const seeded = base.child(['m1', 'profile-seed', dir, fixture, JSON.stringify(options?.args ?? {})]);
        for (let r = 0; r < reps; r++) {
          runs.push(measureIn(dir, seeded));
          process.stderr.write('.');
        }
      });
      return runs;
    }
    for (let r = 0; r < reps; r++) {
      runs.push(
        base.withRoot((dir) =>
          measureIn(
            dir,
            base.child(['m1', 'profile-seed', dir, fixture, JSON.stringify(options?.args ?? {})])
          )
        )
      );
      process.stderr.write('.');
    }
    return runs;
  }

  function run(reps) {
    const raw = {};
    raw.empty = runArm(reps, 'empty');
    raw.plain = runArm(reps, 'plain');
    raw.churn = runArm(reps, 'churn');
    raw.owed = runArm(reps, 'owed', 'receipt');
    raw.fanout = runArm(reps, 'fanout');
    raw.unresolved = runArm(reps, 'unresolved');
    raw.inventory = runArm(reps, 'inventory', 'minimal');
    raw['inventory-full-summary-control'] = runArm(reps, 'inventory', 'full-summary-control');
    raw['inventory-buffer-control'] = runArm(reps, 'inventory', 'buffer-control');
    raw.history = runArm(reps, 'history', 'open', { seedOnce: true });
    raw['history-control'] = runArm(reps, 'history-control', 'open', {
      seedOnce: true,
      args: { plan: raw.history[0].seeded.plan }
    });
    raw.consumer = runArm(reps, 'consumer', 'consumer-ack', { seedOnce: true });
    raw.evidence = runArm(reps, 'evidence', 'open', { seedOnce: true });
    raw['evidence-control'] = runArm(reps, 'evidence-control', 'open', {
      seedOnce: true,
      args: { tasks: raw.evidence[0].seeded.tasks }
    });
    raw.searches = { wholeRepository: [], unresolvedStop: [] };
    for (let r = 0; r < reps; r++) {
      raw.searches.wholeRepository.push(
        base.withRoot((dir) => base.child(['m1', 'profile-search', dir, 'whole']))
      );
      raw.searches.unresolvedStop.push(
        base.withRoot((dir) => base.child(['m1', 'profile-search', dir, 'unresolved']))
      );
      process.stderr.write('+');
    }
    return { raw, results: analyse(raw) };
  }

  function analyse(raw) {
    const s = base.stat;
    const heap = (runs, key = 'afterOpen') => s(runs.map((r) => r[key].heapUsed - r.baseline.heapUsed));
    const abs = (runs) => ({
      heapAboveImport: heap(runs),
      heapUsed: s(runs.map((r) => r.afterOpen.heapUsed)),
      rss: s(runs.map((r) => r.afterOpen.rss)),
      external: s(runs.map((r) => r.afterOpen.external)),
      maxRssKiB: s(runs.map((r) => r.maxRssKiB)),
      openPeakAbove: s(runs.map((r) => r.openPeak - r.afterOpen.heapUsed)),
      rebuildPeakAbove: s(runs.map((r) => r.rebuildPeak - (r.afterRebuild ?? r.afterOpen).heapUsed)),
      openMs: runs[0].openMs !== undefined ? s(runs.map((r) => r.openMs)) : undefined,
      rebuildMs: runs[0].rebuildMs !== undefined ? s(runs.map((r) => r.rebuildMs)) : undefined,
      disk: s(runs.map((r) => r.seeded.disk.total)),
      afterCloseResidual: s(runs.map((r) => r.afterClose.heapUsed - r.baseline.heapUsed))
    });
    const limit = (runs) => ({
      refusedAt: s(runs.map((r) => r.seeded.refusedAt ?? NaN)),
      admitted: s(runs.map((r) => r.seeded.admitted)),
      dimensions: [...new Set(runs.map((r) => r.seeded.refusal?.dimension))],
      reclaimable: [...new Set(runs.map((r) => r.seeded.refusal?.reclaimableByCleanup))],
      message: runs[0].seeded.refusal?.message,
      seedMs: s(runs.map((r) => r.seeded.seedMs))
    });
    const per = {};
    for (const name of [
      'empty',
      'plain',
      'churn',
      'owed',
      'fanout',
      'unresolved',
      'inventory',
      'history',
      'history-control',
      'consumer',
      'evidence',
      'evidence-control'
    ]) {
      per[name] = { limit: limit(raw[name]), memory: abs(raw[name]), capacity: raw[name][0].seeded.capacity };
    }
    const v = {};
    const refused = (name, dimension, lo, hi, at = (r) => r.seeded.refusedAt) =>
      raw[name].every((r) => r.seeded.refusal?.dimension === dimension && at(r) >= lo && at(r) <= hi);
    v.plain = refused('plain', 'logical-bytes', 525, 537);
    per.churn.items = s(raw.churn.map((r) => r.seeded.items));
    per.churn.refusedAtItem = s(raw.churn.map((r) => r.seeded.refusedAtItem));
    v.churn =
      refused('churn', 'retained-tasks', 10000, 10000, (r) => r.seeded.refusedAtItem) &&
      per.churn.memory.heapAboveImport.median >= 8 * MiB &&
      per.churn.memory.heapAboveImport.median <= 24 * MiB;
    per.owed.receipt = {
      prepareMs: s(raw.owed.map((r) => r.prepareMs)),
      acknowledgeMs: s(raw.owed.map((r) => r.acknowledgeMs)),
      peakAbove: s(raw.owed.map((r) => r.receiptPeakAbove)),
      acknowledged: raw.owed[0].acknowledged
    };
    v.owed = refused('owed', 'logical-bytes', 520, 537) && per.owed.receipt.peakAbove.max <= 16 * MiB;
    per.fanout.pinned = s(raw.fanout.map((r) => r.seeded.pinned));
    per.fanout.overOwed = per.fanout.memory.heapAboveImport.median - per.owed.memory.heapAboveImport.median;
    v.fanout = refused('fanout', 'logical-bytes', 515, 537) && per.fanout.overOwed <= 8 * MiB;
    const consumerBytes = raw.history[0].seeded.disk.consumers;
    per.history.closedSubscriptions = raw.history[0].seeded.closedSubscriptions;
    per.history.consumerBytes = consumerBytes;
    per.history.overControl =
      per.history.memory.heapAboveImport.median - per['history-control'].memory.heapAboveImport.median;
    per.history.bound = Math.max(NOISE, 0.05 * consumerBytes) + MiB;
    v.history =
      refused('history', 'acknowledgement-ids', 7, 9) &&
      per.history.closedSubscriptions < 256 &&
      per.history.overControl <= per.history.bound;
    per.consumer.history = raw.consumer[0].seeded.history;
    per.consumer.rewrite = {
      consumerBytes: raw.consumer[0].consumerBytes,
      ms: s(raw.consumer.map((r) => r.rewriteMs)),
      peakAbove: s(raw.consumer.map((r) => r.rewritePeakAbove)),
      disposed: raw.consumer[0].disposed
    };
    v.consumer =
      raw.consumer.every((r) => r.seeded.refusal?.dimension === 'acknowledgement-ids') &&
      raw.consumer.every(
        (r) =>
          r.rewritePeakAbove >= 0.5 * r.consumerBytes && r.rewritePeakAbove <= 4 * r.consumerBytes + 16 * MiB
      );
    const added = raw.evidence[0].seeded.disk.total - raw['evidence-control'][0].seeded.disk.total;
    const cold = raw.evidence[0].seeded.disk.total;
    per.evidence.perTask = raw.evidence[0].seeded.perTask;
    per.evidence.final = raw.evidence[0].seeded.refusal;
    per.evidence.addedCommandBytes = added;
    per.evidence.overControl =
      per.evidence.memory.heapAboveImport.median - per['evidence-control'].memory.heapAboveImport.median;
    per.evidence.bounds = {
      steady: Math.max(NOISE, 0.05 * added),
      peakLoose: 0.25 * cold + 16 * MiB,
      peakSharp: 48 * MiB
    };
    const full = raw.evidence[0].seeded.perTask.filter((p) => p.dimension === 'record-bytes');
    v.evidence =
      full.length > 0 &&
      full.every((p) => p.admitted >= 50 && p.admitted <= 56) &&
      per.evidence.final?.dimension === 'logical-bytes' &&
      per.evidence.overControl <= per.evidence.bounds.steady &&
      per.evidence.memory.openPeakAbove.max <=
        Math.min(per.evidence.bounds.peakLoose, per.evidence.bounds.peakSharp) &&
      per.evidence.memory.rebuildPeakAbove.max <=
        Math.min(per.evidence.bounds.peakLoose, per.evidence.bounds.peakSharp);
    per.searches = {
      wholeRepository: raw.searches.wholeRepository.map((r) => ({
        largestAdmitted: r.largestAdmitted,
        dimension: r.refusal?.dimension,
        error: r.error
      })),
      unresolvedStop: raw.searches.unresolvedStop.map((r) => ({
        largestAdmitted: r.largestAdmitted,
        dimension: r.refusal?.dimension,
        error: r.error
      }))
    };
    v.unresolved =
      refused('unresolved', 'logical-bytes', 360, 366) &&
      // A tree of n tasks is the root plus n - 1 unresolved children.
      raw.searches.unresolvedStop.every(
        (r) =>
          r.largestAdmitted - 1 >= 248 &&
          r.largestAdmitted - 1 <= 256 &&
          r.refusal?.dimension === 'logical-bytes'
      ) &&
      raw.searches.wholeRepository.every(
        (r) =>
          r.largestAdmitted >= 322 && r.largestAdmitted <= 328 && r.refusal?.dimension === 'logical-bytes'
      );
    const inv = raw.inventory;
    const invCold = base.median(inv.map((r) => r.seeded.disk.total));
    const peakBound = 0.25 * invCold + 16 * MiB;
    const summaryControl = raw['inventory-full-summary-control'];
    const bufferControl = raw['inventory-buffer-control'];
    per.inventory.controls = {
      fullSummaryRetained: s(summaryControl.map((r) => r.afterControl.heapUsed - r.afterOpen.heapUsed)),
      archivedPayloadBytes: summaryControl[0].seeded.archivedPayloadBytes,
      bufferPeakAbove: s(bufferControl.map((r) => r.bufferPeak - r.afterOpen.heapUsed)),
      peakBound
    };
    v.inventory =
      refused('inventory', 'logical-bytes', 430, 460) &&
      per.inventory.memory.heapAboveImport.median >= 12 * MiB &&
      per.inventory.memory.heapAboveImport.median <= 30 * MiB &&
      per.inventory.memory.openPeakAbove.max <= peakBound &&
      per.inventory.memory.rebuildPeakAbove.max <= peakBound &&
      summaryControl.every(
        (r) => r.afterControl.heapUsed - r.afterOpen.heapUsed >= 0.5 * r.seeded.archivedPayloadBytes - NOISE
      ) &&
      bufferControl.every((r) => r.bufferPeak - r.afterOpen.heapUsed > peakBound);
    return { per, verdicts: v };
  }

  return { run, childMain, modes: ['profile-seed', 'profile-measure', 'profile-search'] };
};
