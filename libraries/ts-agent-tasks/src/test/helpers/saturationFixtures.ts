/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Logging, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  CapacityDimension,
  FileTreeTaskRepository,
  IBoundTaskDelivery,
  IBoundTaskViewParams,
  ITaskCapacityProfile,
  ITaskContextBudget,
  ITaskRepository,
  SubscriptionId,
  TaskEnvironment,
  TaskResult,
  allCapacityDimensions,
  allUpdateCategories,
  defaultTaskCapacityProfile
} from '../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { inspectRepository } from '../../packlets/storage/internals';
import { alpha, allowAll, revisionOf, tid } from './brokerFixtures';
import { FaultyRoot } from './faultyRoot';
import {
  ISourceHarness,
  SimulatedExecutor,
  controllableSource,
  harnessWith,
  registerJob,
  sourceRegistry
} from './sourceFixtures';
import { memoryRoot } from './storageFixtures';

/** One dimension's committed figures. */
export interface IDimensionTotals {
  readonly used: number;
  readonly reserved: number;
}

/** Every dimension's committed figures, as `capacityStatus` reports them. */
export type Totals = Record<CapacityDimension, IDimensionTotals>;

/** Every dimension's `used` and `reserved`, read from the trusted status. */
export function totalsOf(repository: ITaskRepository): Totals {
  const out: Partial<Totals> = {};
  for (const row of repository.capacityStatus().orThrow().dimensions) {
    out[row.dimension] = { used: row.used, reserved: row.reserved };
  }
  return out as Totals;
}

/**
 * {@link totalsOf} without the manifest's own entry. Two worlds whose profiles differ store manifests
 * of different lengths — the limits are digits in it — and nothing else; comparing what the work
 * holds across such worlds needs the manifest out of the sum.
 */
export function workTotalsOf(repository: ITaskRepository): Totals {
  const all: Totals = totalsOf(repository);
  const manifest = inspectRepository(repository)!.ledger.entry('repository')!;
  const out: Partial<Totals> = {};
  for (const dimension of allCapacityDimensions) {
    out[dimension] =
      dimension === 'record-bytes'
        ? all[dimension]
        : {
            used: all[dimension].used - manifest.used[dimension],
            reserved: all[dimension].reserved - manifest.reserved[dimension]
          };
  }
  return out as Totals;
}

/** `after - before`, per dimension, keeping only the dimensions that moved. */
export function deltaOf(before: Totals, after: Totals): Partial<Record<CapacityDimension, IDimensionTotals>> {
  const out: Partial<Record<CapacityDimension, IDimensionTotals>> = {};
  for (const dimension of allCapacityDimensions) {
    const used: number = after[dimension].used - before[dimension].used;
    const reserved: number = after[dimension].reserved - before[dimension].reserved;
    if (used !== 0 || reserved !== 0) {
      out[dimension] = { used, reserved };
    }
  }
  return out;
}

/** `used + reserved`. */
export function committed(totals: Totals, dimension: CapacityDimension): number {
  return totals[dimension].used + totals[dimension].reserved;
}

/**
 * A world: a source harness over a {@link FaultyRoot} whose ids are fixed-width, so two worlds driven
 * through the same steps write records of exactly the same size — which is what lets a saturated
 * profile be measured in one world and applied to another.
 */
export interface IWorld extends ISourceHarness {
  readonly inner: FileTree.IFileTreeDirectoryItem;
  readonly faulty: FaultyRoot;
  readonly counter: { n: number };
}

/** The trusted host binding every journey step uses. */
export const hostBinding: IBoundTaskViewParams = {
  principal: 'host',
  scopes: [alpha],
  authorization: allowAll
};

function worldEnvironment(counter: { n: number }): { env: TaskEnvironment; logger: Logging.InMemoryLogger } {
  const logger: Logging.InMemoryLogger = new Logging.InMemoryLogger('detail');
  const env: TaskEnvironment = TaskEnvironment.create({
    logger,
    clock: () => Date.parse('2026-09-22T12:00:00.000Z'),
    newId: () => succeed(`w-${String(++counter.n).padStart(6, '0')}`)
  }).orThrow();
  return { env, logger };
}

/** A fresh, empty world under a profile. */
export async function emptyWorld(
  profile: ITaskCapacityProfile = defaultTaskCapacityProfile
): Promise<IWorld> {
  const inner: FileTree.IFileTreeDirectoryItem = memoryRoot();
  const faulty: FaultyRoot = new FaultyRoot(inner as unknown as FileTree.IAtomicFileTreeDirectoryItem);
  const counter: { n: number } = { n: 0 };
  const executor: SimulatedExecutor = new SimulatedExecutor('exec', 'observed-state');
  const source = controllableSource(executor);
  const registry = sourceRegistry(source);
  const { env, logger } = worldEnvironment(counter);
  const repository: ITaskRepository = (
    await FileTreeTaskRepository.initialize({
      root: faulty,
      mode: 'session',
      environment: env,
      registry,
      profile
    })
  ).orThrow();
  return {
    ...harnessWith(repository, env, faulty, logger, executor, source, registry),
    inner,
    faulty,
    counter
  };
}

/** Closes a world's repository and opens its root again, from disk, with a fresh broker. */
export async function reopenWorld(w: IWorld): Promise<IWorld> {
  w.repository.close().orThrow();
  const { env, logger } = worldEnvironment(w.counter);
  // The reopened repository writes through a fresh fault injector, so a fault a test injects after the
  // reopen reaches it — a crash test that reopens and crashes again must not be crashing nothing.
  const faulty: FaultyRoot = new FaultyRoot(w.inner as unknown as FileTree.IAtomicFileTreeDirectoryItem);
  const opened = (
    await FileTreeTaskRepository.open({
      root: faulty,
      mode: 'session',
      environment: env,
      registry: w.registry
    })
  ).orThrow();
  if (opened.state !== 'ready') {
    throw new Error(`reopenWorld: recovery required: ${JSON.stringify(opened.recovery.report.issues)}`);
  }
  return {
    ...harnessWith(opened.repository, env, faulty, logger, w.executor, w.source, w.registry),
    inner: w.inner,
    faulty,
    counter: w.counter
  };
}

/** The longest description and outcome summary the field bounds admit. */
export const largest: { readonly description: string; readonly summary: string } = {
  description: 'd'.repeat(4096),
  summary: 's'.repeat(2048)
};

/**
 * Everything {@link populate} does before its late `current` subscription: an all-seeing `watcher`
 * subscription, the largest tracked task `t`, an external job `j` with one reconciled source cursor,
 * and an uncertain command on `j` whose response was lost.
 */
export async function populateBase(w: IWorld): Promise<IWorld> {
  (
    await w.broker.subscribe(hostBinding, {
      subscriptionId: 'watcher',
      operationId: 'subscribe-watcher',
      consumerId: 'consumer-watcher',
      selection: { scopes: [alpha], lifecycleClass: 'all' },
      start: 'from-now',
      policy: { categories: [...allUpdateCategories].sort() }
    })
  ).orThrow();
  (
    await w.writer.createTracked({
      taskId: tid('t'),
      operationId: 'create-t' as never,
      title: 'the largest task',
      description: largest.description
    })
  ).orThrow();
  w.executor.addJob('j');
  await registerJob(w, 'j', { operationId: 'register-j' as never });
  (await w.broker.reconcile({ sourceId: 'exec' })).orThrow();
  const executor: SimulatedExecutor = w.executor;
  executor.loseNextResponse = true;
  (
    await w.writer.execute({
      taskId: tid('j'),
      operationId: 'pause-j' as never,
      expectedRevision: await revisionOf(w.repository, 'j'),
      command: 'pause',
      parameters: { reason: 'hold' }
    })
  ).orThrow();
  return w;
}

/** The late `current` subscription: its activation captures a baseline of every task. */
export async function subscribeLate(w: IWorld): Promise<TaskResult<unknown>> {
  return w.broker.subscribe(hostBinding, {
    subscriptionId: 'late',
    operationId: 'subscribe-late',
    consumerId: 'consumer-late',
    selection: { scopes: [alpha], lifecycleClass: 'all' },
    start: 'current',
    policy: { categories: [...allUpdateCategories].sort() }
  });
}

/**
 * Builds the population every saturation journey starts from, every step of which only grows
 * capacity: {@link populateBase}, then {@link subscribeLate}.
 */
export async function populate(w: IWorld): Promise<IWorld> {
  await populateBase(w);
  (await subscribeLate(w)).orThrow();
  return w;
}

/** A world populated under a profile. */
export async function populatedWorld(profile?: ITaskCapacityProfile): Promise<IWorld> {
  return populate(await emptyWorld(profile));
}

/** The bound delivery of one of the world's subscriptions. */
export function deliveryIn(w: IWorld, id: 'watcher' | 'late'): IBoundTaskDelivery {
  return w.broker
    .bindDelivery({
      ...hostBinding,
      subscriptionId: id as SubscriptionId,
      consumerId: `consumer-${id}` as never
    })
    .orThrow();
}

/** Every id a delivery is still owed. */
export async function owedIds(delivery: IBoundTaskDelivery): Promise<string[]> {
  return (await delivery.pending({ limit: 200 })).orThrow().updates.map((u) => u.id);
}

/** A journey step: one host action, re-runnable after a crash as a retry of itself. */
export interface IJourneyStep {
  readonly name: string;
  readonly run: (w: IWorld) => Promise<TaskResult<unknown>>;
}

/**
 * A context budget a maximum-size task's two revisions fit in together. Under the default 8,000
 * characters the current revision is rendered first and an older one of the largest task never fits,
 * so it can only be disposed — see the delivery-budget test in `saturation.test.ts`.
 */
export const drainBudget: ITaskContextBudget = { maxItems: 20, maxDepth: 3, maxChars: 20000 };

/** Prepares and acknowledges until the delivery is owed nothing, or a step fails. */
async function drain(w: IWorld, id: 'watcher' | 'late'): Promise<TaskResult<unknown>> {
  const delivery: IBoundTaskDelivery = deliveryIn(w, id);
  for (let round = 0; round < 10; round++) {
    const owed: string[] = await owedIds(delivery);
    if (owed.length === 0) {
      return succeedWithDetail<unknown, never>(round);
    }
    const prepared = await delivery.prepare(drainBudget);
    if (prepared.isFailure()) {
      return prepared;
    }
    const acknowledged = await delivery.acknowledge(prepared.value.context.receipt);
    if (acknowledged.isFailure()) {
      return acknowledged;
    }
  }
  throw new Error(`drain ${id}: still owed after ten rounds: ${(await owedIds(delivery)).join(', ')}`);
}

/**
 * The A3 journey after saturation (implementation plan § T8): complete the largest accepted task,
 * settle the uncertain command after source resolution, let the source finish its job, acknowledge
 * every update of one subscription and dispose every update of the other, prune, archive both tasks,
 * and close both subscriptions — one retaining, one disposing.
 */
export const journey: ReadonlyArray<IJourneyStep> = [
  {
    name: 'complete the largest task',
    run: async (w) =>
      w.writer.execute({
        taskId: tid('t'),
        operationId: 'succeed-t' as never,
        expectedRevision: await revisionOf(w.repository, 't'),
        command: 'succeed',
        parameters: { outcome: { summary: largest.summary, artifacts: [] } }
      })
  },
  { name: 'settle the uncertain command', run: async (w) => w.writer.resolveCommands({ limit: 10 }) },
  {
    name: 'observe the job finish at its source',
    run: async (w) => {
      const job = w.executor.jobs.get('j')!;
      if (job.lifecycle.status !== 'succeeded') {
        w.executor.change('j', (j) => {
          j.lifecycle = { status: 'succeeded', outcome: { summary: 'done', artifacts: [] } };
        });
      }
      return w.broker.reconcile({ sourceId: 'exec' });
    }
  },
  { name: 'acknowledge every update owed to watcher', run: async (w) => drain(w, 'watcher') },
  {
    name: 'dispose every update owed to late',
    run: async (w) =>
      w.broker.dispose(hostBinding, {
        subscriptionId: 'late',
        updateIds: await owedIds(deliveryIn(w, 'late')),
        reason: 'drained by the host'
      })
  },
  { name: 'prune', run: async (w) => w.broker.cleanup({ limit: 10 }) },
  {
    name: 'archive t',
    run: async (w) =>
      w.writer.archive({
        taskId: tid('t'),
        operationId: 'archive-t' as never,
        expectedRevision: await revisionOf(w.repository, 't')
      })
  },
  {
    name: 'archive j',
    run: async (w) =>
      w.writer.archive({
        taskId: tid('j'),
        operationId: 'archive-j' as never,
        expectedRevision: await revisionOf(w.repository, 'j')
      })
  },
  {
    name: 'close late, retaining',
    run: async (w) =>
      w.broker.closeSubscription(hostBinding, { subscriptionId: 'late', obligations: 'retain' })
  },
  {
    name: 'close watcher, disposing',
    run: async (w) =>
      w.broker.closeSubscription(hostBinding, {
        subscriptionId: 'watcher',
        obligations: 'dispose',
        reason: 'host retired it'
      })
  }
];

/** Runs journey steps `[from, to)`, throwing on any failure. */
export async function runJourney(w: IWorld, from: number = 0, to: number = journey.length): Promise<void> {
  for (let i = from; i < to; i++) {
    const outcome = await journey[i].run(w);
    if (outcome.isFailure()) {
      throw new Error(`journey step '${journey[i].name}' failed: ${outcome.message}`);
    }
  }
}

/** Growth each saturated dimension must refuse, and that nothing else in the world refuses. */
export type GrowthProbe = (w: IWorld) => Promise<TaskResult<unknown>>;

/** Ordinary growth: a new tracked task. */
export const newTask: GrowthProbe = async (w) =>
  w.writer.createTracked({ taskId: tid('u'), operationId: 'create-u' as never, title: 'one more' });

/** Ordinary growth: a new subscription. */
export const newSubscription: GrowthProbe = async (w) =>
  w.broker.subscribe(hostBinding, {
    subscriptionId: 'extra',
    operationId: 'subscribe-extra',
    consumerId: 'consumer-extra',
    selection: { scopes: [alpha], lifecycleClass: 'all' },
    start: 'from-now',
    policy: { categories: [...allUpdateCategories].sort() }
  });

/** Ordinary growth: a second source's checkpoint record. */
export const newSource: GrowthProbe = async (w) =>
  w.repository.withWriter((writer) =>
    writer.commitSource({
      sourceId: 'other',
      history: 'observed-state',
      expectedRecordRevision: 0,
      cursor: 'c1',
      pages: 1
    })
  );

/** Ordinary growth on the largest record: a second command on the job, whose settlement it must reserve. */
export const newCommand: GrowthProbe = async (w) =>
  w.writer.execute({
    taskId: tid('j'),
    operationId: 'resume-j' as never,
    expectedRevision: await revisionOf(w.repository, 'j'),
    command: 'resume',
    parameters: {}
  });

/** The growth probe that exercises each dimension. */
export const probeFor: Record<CapacityDimension, GrowthProbe> = {
  'retained-tasks': newTask,
  'non-archived-tasks': newTask,
  subscriptions: newSubscription,
  sources: newSource,
  updates: newTask,
  'audience-links': newTask,
  'acknowledgement-ids': newTask,
  operations: newTask,
  'record-bytes': newCommand,
  'logical-bytes': newTask,
  'resident-payload-bytes': newTask
};

/**
 * The default profile with one dimension's limit set to exactly what a populated world commits in it:
 * that dimension has no room left, and every other has the default's.
 *
 * @remarks
 * `record-bytes` is per record, so its saturation is the largest record's own ceiling, set through the
 * task-record bound.
 */
export function saturating(dimension: CapacityDimension, at: Totals): ITaskCapacityProfile {
  const d: ITaskCapacityProfile = defaultTaskCapacityProfile;
  if (dimension === 'record-bytes') {
    return { ...d, encoded: { ...d.encoded, maxTaskRecordBytes: committed(at, 'record-bytes') } };
  }
  return { ...d, limits: { ...d.limits, [dimension]: committed(at, dimension) } };
}

/**
 * A profile under which the populated world fills `dimension` completely, measured from `at`.
 *
 * @remarks
 * `logical-bytes` cannot be filled to the byte: registration and subscription activation pass through
 * a widest state — the manifest still holding the pending entry while the record is written — that is
 * larger than where they settle. Its saturating limit is the smallest the population is admitted
 * under, found from the figure admission itself reports.
 */
export async function saturatedWorld(dimension: CapacityDimension, at: Totals): Promise<IWorld> {
  let profile: ITaskCapacityProfile = saturating(dimension, at);
  for (let attempt = 0; attempt < 8; attempt++) {
    const w: IWorld = await emptyWorld(profile);
    const populated: IWorld | Error = await populate(w).catch((e: Error) => e);
    if (!(populated instanceof Error)) {
      return populated;
    }
    const peak: RegExpExecArray | null = /'logical-bytes' would reach (\d+)/.exec(populated.message);
    if (dimension !== 'logical-bytes' || peak === null) {
      throw populated;
    }
    profile = {
      ...profile,
      limits: { ...profile.limits, 'logical-bytes': Number(peak[1]) }
    };
  }
  throw new Error(`saturatedWorld ${dimension}: no admitting limit found`);
}
