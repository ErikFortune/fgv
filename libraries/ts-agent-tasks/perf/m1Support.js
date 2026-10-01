/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 *
 * Shared machinery for the M1 stop-state and production-profile cohorts (agent-tasks-m1-stop).
 * Loaded by `residentMemory.js`, which owns the manifest, the parent loop and the frozen cohorts;
 * nothing here measures on its own. Every function runs inside a fresh child process.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const v8 = require('v8');
const { FileTree, JsonSchema } = require('@fgv/ts-json-base');
const { Converters, Logging, succeed, fail } = require('@fgv/ts-utils');

const AT = '2026-10-01T00:00:00.000Z';
const SCOPE = { namespace: 'perf', key: 'main' };
const JOB_KIND = 'sim.job';
const allowAll = { check: async () => succeed(true), policyEpoch: () => 'perf' };

module.exports = function support(base) {
  const { hex, settle, nodeRoot } = base;

  /** Host-minted ids are independent random hex of the declared width (36, or 128 for max-id arms). */
  function environment(pkg, idLength) {
    return pkg.TaskEnvironment.create({
      logger: new Logging.InMemoryLogger('error'),
      clock: () => Date.parse(AT),
      newId: () => succeed(hex(idLength))
    }).orThrow();
  }

  // ----------------------------------------------------------------------------------------------
  // A simulated external source: a stable pause, an `advance` command carrying a blob
  // ----------------------------------------------------------------------------------------------

  /**
   * `identity: 'small'` — source id `exec`, contract `v1`, epoch `e1`, decimal tokens.
   * `identity: 'max'` — 128-character source id, and a 128-character contract version, epoch and
   * token per job, each independently generated. Tokens carry their sequence in the first 8
   * characters so revisions stay ordered.
   */
  function simulatedSource(pkg, identity) {
    const max = identity === 'max';
    const sourceId = max ? `s${hex(127)}` : 'exec';
    const jobs = new Map();
    const tokenOf = (seq) => (max ? `${String(seq).padStart(8, '0')}${hex(120)}` : String(seq));
    const seqOf = (token) => Number(max ? token.slice(0, 8) : token);
    const projection = (job) => ({
      revision: { epoch: job.epoch, token: job.token },
      observedAt: AT,
      lifecycle: job.lifecycle,
      attention: [],
      details: { step: job.step, ref: job.ref }
    });
    const jobOf = (binding) => jobs.get(binding.reference.job);
    const apply = (job, command) => {
      job.seq += 1;
      job.token = tokenOf(job.seq);
      if (command === 'pause') {
        job.lifecycle = { status: 'paused', reason: { code: 'paused', summary: 'cascade stop' } };
      } else {
        job.step += 1;
      }
    };
    const command = (name, schema, idempotency) =>
      pkg.ExternalTaskSource.command(
        { name, parameters: schema, encode: (p) => succeed({ ...p }), idempotency, conditional: false },
        async (binding, __parameters) => {
          const job = jobOf(binding);
          if (job === undefined) {
            return succeed({ state: 'rejected', reason: 'unsupported' });
          }
          apply(job, name);
          return succeed({ state: 'applied', observation: projection(job) });
        }
      );
    const source = pkg.ExternalTaskSource.create({
      id: sourceId,
      history: 'observed-state',
      encodeDetails: (d) => succeed({ step: d.step, ref: d.ref }),
      compare: (a, b) => {
        if (a.epoch !== b.epoch) {
          return succeed('incomparable');
        }
        const x = seqOf(a.token);
        const y = seqOf(b.token);
        return succeed(x < y ? 'older' : x > y ? 'newer' : 'same');
      },
      read: async (binding) => {
        const job = jobOf(binding);
        return succeed(
          job === undefined
            ? { state: 'missing', reason: 'no such job' }
            : { state: 'observed', value: projection(job) }
        );
      },
      feed: async (cursor) => {
        const all = [...jobs.values()];
        const start = cursor === undefined ? 0 : Number(cursor);
        const end = Math.min(all.length, start + 100);
        return succeed({
          observations: all
            .slice(start, end)
            .map((j) => ({ binding: j.binding, observation: { state: 'observed', value: projection(j) } })),
          ...(end < all.length ? { nextCursor: String(end) } : {}),
          completeness: 'complete',
          coverage: 'all-bindings',
          issues: []
        });
      },
      recover: async (binding) => {
        const job = jobOf(binding);
        return succeed(
          job === undefined
            ? { state: 'unresolved', reason: 'no such job' }
            : { state: 'reattached', value: projection(job) }
        );
      },
      commands: [
        command('pause', JsonSchema.object({ reason: JsonSchema.string() }), 'source-key'),
        command('advance', JsonSchema.object({ blob: JsonSchema.string() }), 'none')
      ],
      capabilities: async (binding) => {
        const job = jobOf(binding);
        return job === undefined
          ? fail(`no job for ${JSON.stringify(binding.reference)}`)
          : succeed({
              contractVersion: job.contract,
              pause: 'stable-until-explicit-resume',
              cancel: 'unsupported',
              pauseCommand: { command: 'pause', parameters: { reason: 'cascade stop' } }
            });
      }
    }).orThrow();

    /** Adds a job. A positive `bindingBytes` grows the encoded binding to exactly that size (4096 = the bound). */
    function addJob(job, bindingBytes) {
      const framing = JSON.stringify({ sourceId, referenceVersion: 1, reference: { job, blob: '' } }).length;
      const reference = { job, ...(bindingBytes > 0 ? { blob: hex(bindingBytes - framing) } : {}) };
      const created = {
        job,
        binding: { sourceId, referenceVersion: 1, reference },
        epoch: max ? hex(128) : 'e1',
        seq: 1,
        token: tokenOf(1),
        contract: max ? hex(128) : 'v1',
        lifecycle: { status: 'running' },
        step: 0,
        ref: `r/${job}`
      };
      jobs.set(job, created);
      return created;
    }

    return { source, sourceId, addJob, projection, jobs };
  }

  // ----------------------------------------------------------------------------------------------
  // Registry, repository, broker
  // ----------------------------------------------------------------------------------------------

  /** tracked, list and the frozen cohorts' perf kind; plus the job kind when a source is given. */
  function registry(pkg, source) {
    const reg = pkg.TaskKindRegistry.create(
      pkg.TaskConverters.create().orThrow().envelopes.snapshot
    ).orThrow();
    reg.register(pkg.trackedTaskDescriptor()).orThrow();
    reg.register(pkg.taskListDescriptor()).orThrow();
    reg
      .register({
        kind: 'perf.job',
        detailVersion: 1,
        details: Converters.strictObject({ blob: Converters.string }),
        encode: (value) => succeed({ blob: value.blob })
      })
      .orThrow();
    if (source !== undefined) {
      reg
        .register({
          kind: JOB_KIND,
          detailVersion: 1,
          details: Converters.strictObject({ step: Converters.number, ref: Converters.string }),
          encode: (d) => succeed({ step: d.step, ref: d.ref }),
          commands: source.source.commandHandles
        })
        .orThrow();
    }
    return reg;
  }

  async function initialize(pkg, dir, world) {
    return (
      await pkg.FileTreeTaskRepository.initialize({
        root: nodeRoot(dir),
        mode: 'session',
        environment: world.env,
        registry: world.registry,
        profile: world.profile
      })
    ).orThrow();
  }

  async function reopen(pkg, dir, world, root) {
    const opened = (
      await pkg.FileTreeTaskRepository.open({
        root: root ?? nodeRoot(dir),
        mode: world.mode ?? 'session',
        environment: world.env,
        registry: world.registry
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
    return opened.repository;
  }

  function brokerOver(pkg, repository, world) {
    const broker = pkg.TaskBroker.create({
      repository,
      environment: world.env,
      ...(world.source !== undefined ? { sources: [world.source.source] } : {})
    }).orThrow();
    const writer = broker.bind({ principal: 'perf', scopes: [SCOPE], authorization: allowAll }).orThrow();
    return { broker, writer };
  }

  /** The figures a refusal reports, or undefined for a success. */
  function refusal(result) {
    if (result.isSuccess()) {
      return undefined;
    }
    const capacity = result.detail?.capacity;
    return {
      code: result.detail?.code,
      dimension: capacity?.dimension,
      requested: capacity?.requested,
      available: capacity?.available,
      reclaimableByCleanup: capacity?.reclaimableByCleanup,
      message: result.message.slice(0, 400)
    };
  }

  function capacityOf(repository) {
    const out = {};
    for (const row of repository.capacityStatus().orThrow().dimensions) {
      out[row.dimension] = { used: row.used, reserved: row.reserved, limit: row.limit };
    }
    return out;
  }

  async function revisionOf(repository, id) {
    const record = (await repository.readCommit(id)).orThrow();
    return record.recordType === 'resolved' ? record.task.envelope.revision : record.reference.revision;
  }

  // ----------------------------------------------------------------------------------------------
  // Cloning — bulk populations from a real-path template
  // ----------------------------------------------------------------------------------------------

  /**
   * Writes `count` clones of a committed record with fresh ids (and claim ids), then lets `refresh`
   * regenerate any payload so no two records share a backing store. The repository must be closed;
   * the measuring process's open validates every clone. Returns the new manifest entries.
   */
  function writeClones(layout, dir, template, templateId, count, newId, refresh) {
    const text = layout.encodeRecord(template).orThrow().text;
    const claimIds = (template.capacityClaims ?? []).map((c) => c.claimId);
    const entries = [];
    for (let i = 0; i < count; i++) {
      const id = newId(i);
      let clone = text.split(templateId).join(id);
      for (const claimId of claimIds) {
        clone = clone.split(`"${claimId}"`).join(`"${claimId}x${i}"`);
      }
      const parsed = JSON.parse(clone);
      if (refresh !== undefined) {
        refresh(parsed, id, i);
      }
      fs.writeFileSync(path.join(dir, `task-${id}.json`), layout.encodeRecord(parsed).orThrow().text);
      entries.push({ id, state: 'live' });
    }
    return entries;
  }

  function addToManifest(layout, dir, entries) {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'repository.json'), 'utf8'));
    const tasks = [...manifest.tasks, ...entries].sort((a, b) => (a.id < b.id ? -1 : 1));
    const next = { ...manifest, manifestRevision: manifest.manifestRevision + 1, tasks };
    fs.writeFileSync(path.join(dir, 'repository.json'), layout.encodeRecord(next).orThrow().text);
  }

  /** Bytes on disk, by file class. */
  function diskOf(dir) {
    const out = { total: 0, tasks: 0, consumers: 0, other: 0, files: 0 };
    for (const name of fs.readdirSync(dir)) {
      const size = fs.statSync(path.join(dir, name)).size;
      out.total += size;
      out.files += 1;
      if (name.startsWith('task-')) {
        out.tasks += size;
      } else if (name.startsWith('consumer-') || name.startsWith('subscription-')) {
        out.consumers += size;
      } else {
        out.other += size;
      }
    }
    return out;
  }

  // ----------------------------------------------------------------------------------------------
  // The measuring child: open, settle, optional action, rebuild, close
  // ----------------------------------------------------------------------------------------------

  /**
   * Samples heapUsed (the frozen sample method's figure) and, beside it, old-space and large-object
   * space, so a high heapUsed peak can be told apart from nursery churn. heapUsed includes garbage
   * not yet collected: every peak here is a sampled high-water, not an allocator maximum.
   */
  function sample(peak) {
    const used = process.memoryUsage().heapUsed;
    if (used > peak.heapUsed) {
      peak.heapUsed = used;
    }
    for (const space of v8.getHeapSpaceStatistics()) {
      const key =
        space.space_name === 'old_space'
          ? 'oldSpace'
          : space.space_name === 'large_object_space'
          ? 'largeObject'
          : undefined;
      if (key !== undefined && space.space_used_size > (peak[key] ?? 0)) {
        peak[key] = space.space_used_size;
      }
    }
  }

  // Extra sample points at large JSON parse/stringify boundaries (>= 64 KiB), in m1 measuring
  // children only: a large record's parse happens between the FileTree proxy's read samples. More
  // sample points can only raise an observed peak.
  let sampling;
  let hooked = false;
  function sampleJsonBoundaries(peak) {
    sampling = peak;
    if (hooked) {
      return;
    }
    hooked = true;
    const parse = JSON.parse;
    const stringify = JSON.stringify;
    JSON.parse = function (text, ...rest) {
      const value = parse.call(JSON, text, ...rest);
      if (sampling !== undefined && typeof text === 'string' && text.length >= 65536) {
        sample(sampling);
      }
      return value;
    };
    JSON.stringify = function (...args) {
      const text = stringify.apply(JSON, args);
      if (sampling !== undefined && typeof text === 'string' && text.length >= 65536) {
        sample(sampling);
      }
      return text;
    };
  }

  /**
   * The frozen `sampledRoot`'s sample points (before and after every file-item call), sampling
   * old-space and large-object space beside heapUsed.
   */
  function sampledRoot(dir, peak) {
    const inner = nodeRoot(dir);
    const wrapFile = (file) =>
      new Proxy(file, {
        get(target, prop) {
          const value = target[prop];
          if (typeof value !== 'function') {
            return value;
          }
          return (...args) => {
            sample(peak);
            const result = value.apply(target, args);
            sample(peak);
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

  /** Resets a peak to "nothing observed yet". */
  function resetPeak(peak) {
    peak.heapUsed = 0;
    peak.oldSpace = 0;
    peak.largeObject = 0;
  }

  /** Old-space and large-object used bytes now, for "above settled" comparisons. */
  function spaces() {
    const out = {};
    for (const space of v8.getHeapSpaceStatistics()) {
      out[space.space_name] = space.space_used_size;
    }
    return { oldSpace: out.old_space, largeObject: out.large_object_space };
  }

  /**
   * Opens `dir` durably through the instrumented root, then: settled heap after open, structural
   * counts (the inspection is dropped before anything else runs), the cohort's action, a rebuild,
   * close. `action(repository, peak, out)` may add fields; it must drop what it holds.
   */
  async function openMeasure(dir, world, action) {
    const { pkg, internals } = base.lib();
    const baseline = settle();
    const peak = { heapUsed: 0 };
    resetPeak(peak);
    sampleJsonBoundaries(peak);
    let t = process.hrtime.bigint();
    let repository = await reopen(
      pkg,
      dir,
      { ...world, mode: { durable: 'process-crash' } },
      sampledRoot(dir, peak)
    );
    const openMs = Number(process.hrtime.bigint() - t) / 1e6;
    const openPeak = peak.heapUsed;
    const openPeakSpaces = { oldSpace: peak.oldSpace, largeObject: peak.largeObject };
    const afterOpen = settle();
    const afterOpenSpaces = spaces();
    let inspection = internals.inspectRepository(repository);
    const stops = inspection.index.stops;
    const shape = {
      projections: inspection.projections.size,
      summaries: inspection.index.summaries.size,
      latchedTasks: stops._latches.size,
      attempts: stops._attempts.size,
      markedTasks: stops._marked.size,
      markedCommands: [...stops._marked.values()].reduce((n, m) => n + m.size, 0),
      stopContent: stops._content.size,
      materializationHighWater: inspection.gate.highWater
    };
    inspection = undefined;
    const out = {
      baseline,
      afterOpen,
      afterOpenSpaces,
      openPeak,
      openPeakSpaces,
      openMs,
      shape,
      capacity: capacityOf(repository)
    };
    if (action !== undefined) {
      await action(repository, peak, out);
      out.afterAction = settle();
    }
    resetPeak(peak);
    t = process.hrtime.bigint();
    (await repository.rebuildIndexes()).orThrow();
    out.rebuildMs = Number(process.hrtime.bigint() - t) / 1e6;
    out.rebuildPeak = peak.heapUsed;
    out.rebuildPeakSpaces = { oldSpace: peak.oldSpace, largeObject: peak.largeObject };
    out.afterRebuild = settle();
    out.afterRebuildSpaces = spaces();
    repository.close().orThrow();
    repository = undefined;
    sampling = undefined;
    out.afterClose = settle();
    out.maxRssKiB = process.resourceUsage().maxRSS;
    return out;
  }

  return {
    AT,
    SCOPE,
    JOB_KIND,
    allowAll,
    environment,
    simulatedSource,
    registry,
    initialize,
    reopen,
    brokerOver,
    refusal,
    capacityOf,
    revisionOf,
    writeClones,
    addToManifest,
    diskOf,
    sample,
    resetPeak,
    spaces,
    openMeasure
  };
};
