/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * Every simulation and host seam the agent-tasks journey uses, in one place.
 *
 * Nothing here is a double of a library type: the repository, broker, renderer, tools and prompt
 * helpers the journey drives are the real exports. What is simulated is what a host owns and the
 * library deliberately does not — a clock, an ID factory, a policy, an external executor — plus one
 * instrumented FileTree accessor. If a `@fgv/ts-agent-tasks` interface changes, this file is the
 * first place to look.
 *
 * - {@link ScenarioClock} — a fixed instant, advanced only by explicit calls. No wall-clock reads.
 * - {@link SequentialIds} — a deterministic ID factory shared across reopens, so claim IDs never
 *   collide with ones an earlier repository instance wrote.
 * - {@link CountingTreeAccessors} — the real in-memory FileTree accessors, subclassed to count
 *   task-record reads. It is the only public way to observe query work from outside the package.
 * - {@link ScenarioPolicy} — an allow-all `ITaskAuthorization` with a fixed epoch.
 * - {@link SimulatedExecutor} — an external executor that really applies, deduplicates and loses
 *   commands, advanced only by explicit calls. {@link controllableSource} and
 *   {@link observationOnlySource} wrap it in the library's own `ExternalTaskSource`.
 *
 * @packageDocumentation
 */

import { FileTree, JsonSchema, JsonValue } from '@fgv/ts-json-base';
import { Converter, Converters, Logging, Result, fail, succeed } from '@fgv/ts-utils';
import {
  ExternalCommandResult,
  ExternalProjection,
  ExternalRead,
  ExternalRecovery,
  ExternalTaskSource,
  FileTreeTaskRepository,
  IBoundTaskView,
  IBoundTaskWriter,
  ICommandRequest,
  IExternalCommand,
  IExternalPage,
  IResponsibility,
  ISourceBinding,
  ISourceCapabilities,
  ISourceRevision,
  ITaskAccessRequest,
  TaskAction,
  SourceCommandRejection,
  ITaskAuthorization,
  ITaskKindDescriptor,
  ITaskKindHandle,
  ITaskProjector,
  ITaskRepository,
  ITaskScope,
  ITaskSnapshot,
  Instant,
  OperationId,
  SourceRevisionOrder,
  TaskBroker,
  TaskConverters,
  TaskEnvironment,
  TaskKind,
  TaskKindRegistry,
  TaskLifecycle,
  defaultTaskProjector,
  taskListDescriptor,
  trackedTaskDescriptor
} from '@fgv/ts-agent-tasks';

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

/** The shared project scope. */
export const projectScope: ITaskScope = { namespace: 'project', key: 'atlas' };

/** Ada's personal scope, overlapping the project for the tasks she creates. */
export const personalScope: ITaskScope = { namespace: 'personal', key: 'ada' };

/** Agent A. */
export const ada: IResponsibility = { namespace: 'agent', key: 'ada' };

/** Agent B. */
export const bob: IResponsibility = { namespace: 'agent', key: 'bob' };

/** The kind a controllable executor's jobs are registered under. */
export const jobKind: TaskKind = 'sim.job' as TaskKind;

/** The kind an observation-only source's jobs are registered under. */
export const watchKind: TaskKind = 'sim.watch' as TaskKind;

/** The instant the journey starts at. */
export const epochInstant: string = '2026-10-01T09:00:00.000Z';

// ---------------------------------------------------------------------------
// Clock and IDs
// ---------------------------------------------------------------------------

/** A host clock fixed at {@link epochInstant}: the library reads no other time. */
export class ScenarioClock {
  private _now: number = Date.parse(epochInstant);

  /** The current time, in milliseconds. */
  public readonly read = (): number => this._now;

  /** The canonical instant `minutes` from now. */
  public after(minutes: number): Instant {
    return new Date(this._now + minutes * 60_000).toISOString() as Instant;
  }
}

/** A deterministic ID factory: `p1-0001`, `p1-0002`, … */
export class SequentialIds {
  private _next: number = 0;

  public readonly mint = (): Result<string> => succeed(`p1-${String(++this._next).padStart(4, '0')}`);

  /** A fresh operation id for a host call. */
  public op(): OperationId {
    return this.mint().orThrow() as OperationId;
  }
}

// ---------------------------------------------------------------------------
// The instrumented FileTree
// ---------------------------------------------------------------------------

/**
 * The real in-memory accessors, counting reads of task records (`task-<id>.json`).
 *
 * @remarks
 * The repository promises that a warm query reads no task record. From outside the package that is
 * observable only at the FileTree seam the host injects; candidate-visit counts are not exported.
 */
export class CountingTreeAccessors extends FileTree.InMemoryTreeAccessors {
  /** Task-record reads since construction. */
  public taskReads: number = 0;

  protected constructor() {
    super([], { mutable: true });
  }

  /** A fresh, empty, mutable tree. */
  public static createEmpty(): CountingTreeAccessors {
    return new CountingTreeAccessors();
  }

  public getFileContents(path: string): Result<string> {
    this._count(path);
    return super.getFileContents(path);
  }

  public getFileBytes(path: string): Result<Uint8Array> {
    this._count(path);
    return super.getFileBytes(path);
  }

  public getFileTextStrict(path: string): Result<string> {
    this._count(path);
    return super.getFileTextStrict(path);
  }

  private _count(path: string): void {
    if (/(^|\/)task-[^/]*\.json$/.test(path)) {
      this.taskReads++;
    }
  }
}

// ---------------------------------------------------------------------------
// Host policy
// ---------------------------------------------------------------------------

/**
 * A host policy: everything is allowed unless an action is denied. Every change moves the epoch, as
 * `ITaskAuthorization` requires, so a check the broker captured before a change is refused after it.
 */
export class ScenarioPolicy implements ITaskAuthorization {
  private readonly _denied: Set<TaskAction> = new Set();
  private _epoch: number = 1;

  public async check(request: ITaskAccessRequest): Promise<Result<boolean>> {
    return succeed(!this._denied.has(request.action));
  }

  public policyEpoch(): string {
    return `scenario-${this._epoch}`;
  }

  /** Denies an action to every principal from now on. */
  public deny(action: TaskAction): void {
    this._denied.add(action);
    this._epoch++;
  }

  /** Allows an action again. */
  public allow(action: TaskAction): void {
    this._denied.delete(action);
    this._epoch++;
  }
}

// ---------------------------------------------------------------------------
// The simulated executor
// ---------------------------------------------------------------------------

/** The bounded projection a job presents to the broker. */
export interface IJobDetails {
  readonly step: number;
  readonly ref: string;
}

const jobDetails: Converter<IJobDetails> = Converters.strictObject<IJobDetails>({
  step: Converters.number,
  ref: Converters.string
});

/** The executor's opaque reference inside a source binding. */
const jobReference: Converter<{ readonly job: string }> = Converters.strictObject<{ readonly job: string }>({
  job: Converters.string
});

/** One executor job: the executor's own record. */
export interface ISimulatedJob {
  readonly job: string;
  readonly epoch: string;
  token: number;
  lifecycle: TaskLifecycle;
  progress?: { readonly completed: number; readonly total: number };
  step: number;
  /** Every command the executor applied, as `<command>:<key>`, in order. */
  readonly applied: string[];
}

/** How the executor answers the next commands. */
export type ExecutorAnswer = 'apply' | 'accept' | 'indeterminate';

/**
 * A deterministic executor behind a source. Nothing in it runs on its own: work advances only
 * through {@link SimulatedExecutor.change}, and commands only through the source's dispatch.
 *
 * @remarks
 * Its deduplication is real: a key it has answered is answered again from its ledger and applied
 * once, which is what makes a `source-key` resend safe. A `none` command is deduplicated by nothing.
 */
export class SimulatedExecutor {
  public readonly sourceId: string;
  public readonly jobs: Map<string, ISimulatedJob> = new Map();
  /** The executor's own answer for each key it has seen. */
  public readonly ledger: Map<string, ExternalCommandResult<IJobDetails>> = new Map();
  /** How many times each key reached the executor. */
  public readonly dispatches: Map<string, number> = new Map();
  /** Jobs the executor cannot currently reach. */
  public readonly unreachable: Set<string> = new Set();
  /** Calls the broker made into this executor (reads, pages, recoveries, dispatches, lookups). */
  public calls: number = 0;
  public answer: ExecutorAnswer = 'apply';
  /** Apply the next command, then lose its response. */
  public loseNextResponse: boolean = false;
  /** Whether the executor deduplicates keys at all — off only to show the journey's checks bite. */
  public deduplicates: boolean = true;
  /** Refuse the next command with this reason, without applying it. */
  public rejectNext: SourceCommandRejection | undefined = undefined;
  private readonly _accepted: Array<{
    readonly job: string;
    readonly key: string;
    readonly command: string;
  }> = [];

  public constructor(sourceId: string) {
    this.sourceId = sourceId;
  }

  public binding(job: string): ISourceBinding {
    return { sourceId: this.sourceId, referenceVersion: 1, reference: { job } };
  }

  /** Adds a running job. */
  public addJob(job: string, lifecycle: TaskLifecycle = { status: 'running' }): ISimulatedJob {
    const created: ISimulatedJob = { job, epoch: 'e1', token: 1, lifecycle, step: 0, applied: [] };
    this.jobs.set(job, created);
    return created;
  }

  /** The executor's own work moves a job on, advancing its revision. */
  public change(job: string, change: (j: ISimulatedJob) => void): Result<ISimulatedJob> {
    return this._job(job).onSuccess((target) => {
      change(target);
      target.token++;
      return succeed(target);
    });
  }

  /** A job's lifecycle status as the executor holds it, or `'absent'`. */
  public statusOf(job: string): string {
    return this._job(job).orDefault()?.lifecycle.status ?? 'absent';
  }

  /** A job's step counter as the executor holds it, or `-1` for an absent job. */
  public stepOf(job: string): number {
    return this._job(job).orDefault()?.step ?? -1;
  }

  /** A job's current projection. */
  public projectionOf(job: string): Result<ExternalProjection<IJobDetails>> {
    return this._job(job).onSuccess((j) => succeed(this.projection(j)));
  }

  public projection(job: ISimulatedJob): ExternalProjection<IJobDetails> {
    return {
      revision: { epoch: job.epoch, token: String(job.token) },
      observedAt: epochInstant as Instant,
      lifecycle: job.lifecycle,
      ...(job.progress !== undefined ? { progress: job.progress } : {}),
      attention: [],
      details: { step: job.step, ref: `${this.sourceId}/${job.job}` }
    };
  }

  /** Commands answered `accepted` are applied now. */
  public settleAccepted(): void {
    for (const entry of this._accepted.splice(0)) {
      this._apply(entry.job, entry.key, entry.command);
    }
  }

  public read(binding: ISourceBinding): Result<ExternalRead<IJobDetails>> {
    this.calls++;
    const job: ISimulatedJob | undefined = this._jobOf(binding);
    if (job !== undefined && this.unreachable.has(job.job)) {
      return fail(`${this.sourceId}: ${job.job} is unreachable`);
    }
    return job === undefined
      ? succeed({ state: 'missing', reason: 'no such job' })
      : succeed({ state: 'observed', value: this.projection(job) });
  }

  /** The whole listing in one page: every binding, terminal ones included. */
  public page(): Result<IExternalPage<IJobDetails>> {
    this.calls++;
    const reachable: ISimulatedJob[] = Array.from(this.jobs.values()).filter(
      (j) => !this.unreachable.has(j.job)
    );
    return succeed({
      observations: reachable.map((j) => ({
        binding: this.binding(j.job),
        observation: { state: 'observed' as const, value: this.projection(j) }
      })),
      completeness: this.unreachable.size === 0 ? 'complete' : 'partial',
      coverage: 'all-bindings',
      issues: []
    });
  }

  public recover(binding: ISourceBinding): Result<ExternalRecovery<IJobDetails>> {
    this.calls++;
    const job: ISimulatedJob | undefined = this._jobOf(binding);
    if (job === undefined) {
      return succeed({ state: 'unresolved', reason: 'no such job' });
    }
    if (this.unreachable.has(job.job)) {
      return succeed({ state: 'unavailable', reason: `${job.job} is unreachable` });
    }
    const status: string = job.lifecycle.status;
    if (job.lifecycle.status === 'failed' && job.lifecycle.reason.code === 'lost') {
      return succeed({
        state: 'unrecoverable',
        reason: 'the executor lost the job',
        value: this.projection(job)
      });
    }
    return succeed({
      state: ['succeeded', 'failed', 'cancelled'].includes(status) ? 'completed' : 'reattached',
      value: this.projection(job)
    });
  }

  public compare(a: ISourceRevision, b: ISourceRevision): Result<SourceRevisionOrder> {
    if (a.epoch !== b.epoch) {
      return succeed('incomparable');
    }
    const x: number = Number(a.token);
    const y: number = Number(b.token);
    return succeed(x < y ? 'older' : x > y ? 'newer' : 'same');
  }

  /** The executor's command entry point. `keyed` is true for a `source-key` command. */
  public dispatch(
    binding: ISourceBinding,
    request: ICommandRequest,
    keyed: boolean,
    expected: ISourceRevision | undefined
  ): Result<ExternalCommandResult<IJobDetails>> {
    this.calls++;
    const key: string = request.operationId;
    this.dispatches.set(key, (this.dispatches.get(key) ?? 0) + 1);
    const previous: ExternalCommandResult<IJobDetails> | undefined = this.ledger.get(key);
    if (keyed && this.deduplicates && previous !== undefined) {
      return succeed(previous);
    }
    const refusal: SourceCommandRejection | undefined = this.rejectNext;
    if (refusal !== undefined) {
      this.rejectNext = undefined;
      return succeed({ state: 'rejected', reason: refusal });
    }
    const job: ISimulatedJob | undefined = this._jobOf(binding);
    if (job === undefined) {
      return succeed({ state: 'rejected', reason: 'unsupported' });
    }
    if (this.answer === 'indeterminate') {
      return succeed({ state: 'indeterminate', reason: 'the executor could not say' });
    }
    if (['succeeded', 'failed', 'cancelled'].includes(job.lifecycle.status)) {
      return succeed({ state: 'rejected', reason: 'invalid-transition' });
    }
    if (expected !== undefined && (expected.epoch !== job.epoch || Number(expected.token) !== job.token)) {
      return succeed({ state: 'rejected', reason: 'conflict' });
    }
    let answer: ExternalCommandResult<IJobDetails>;
    if (this.answer === 'accept') {
      this._accepted.push({ job: job.job, key, command: request.command });
      answer = { state: 'accepted', sourceReceipt: `rcpt-${key}` };
    } else {
      this._apply(job.job, key, request.command);
      answer = { state: 'applied', observation: this.projection(job) };
    }
    this.ledger.set(key, answer);
    if (this.loseNextResponse) {
      this.loseNextResponse = false;
      return fail('connection reset after the executor applied the command');
    }
    return succeed(answer);
  }

  /** Every command applied to `job`, as `<command>:<key>`; none for an absent job. */
  public appliedTo(job: string): ReadonlyArray<string> {
    return this._job(job).orDefault()?.applied ?? [];
  }

  private _apply(job: string, key: string, command: string): void {
    // Only ever called for a job the executor holds.
    this.change(job, (j) => {
      j.applied.push(`${command}:${key}`);
      switch (command) {
        case 'pause':
          j.lifecycle = { status: 'paused', reason: { code: 'paused', summary: 'paused on request' } };
          break;
        case 'resume':
          j.lifecycle = { status: 'running' };
          break;
        case 'cancel':
          j.lifecycle = {
            status: 'cancelled',
            reason: { code: 'cancelled', summary: 'cancelled on request' }
          };
          break;
        default:
          j.step += 1;
          j.progress = { completed: j.step, total: 10 };
      }
    });
  }

  private _jobOf(binding: ISourceBinding): ISimulatedJob | undefined {
    return jobReference
      .convert(binding.reference)
      .onSuccess((reference) => this._job(reference.job))
      .orDefault();
  }

  private _job(job: string): Result<ISimulatedJob> {
    const found: ISimulatedJob | undefined = this.jobs.get(job);
    return found !== undefined ? succeed(found) : fail(`${this.sourceId}: no job ${job}`);
  }
}

/** What the controllable source declares about stopping: a stable pause and an absorbing cancel. */
export const stableStops: ISourceCapabilities = {
  contractVersion: 'sim-1',
  pause: 'stable-until-explicit-resume',
  cancel: 'terminal-absorbing',
  pauseCommand: { command: 'pause', parameters: {} },
  cancelCommand: { command: 'cancel', parameters: {} }
};

function sourceCommand(
  executor: SimulatedExecutor,
  name: string,
  idempotency: 'source-key' | 'none',
  conditional: boolean
): IExternalCommand<IJobDetails> {
  return ExternalTaskSource.command<IJobDetails, Record<string, never>>(
    {
      name,
      parameters: JsonSchema.object({}),
      encode: (): Result<JsonValue> => succeed({}),
      idempotency,
      conditional
    },
    async (binding, __parameters, request, expected) =>
      executor.dispatch(binding, request, idempotency === 'source-key', expected)
  );
}

/**
 * The controllable source: `pause` and `resume` deduplicate by key (`source-key`); `advance` and
 * `cancel` do not (`none`), and `cancel` is conditional on the source revision.
 */
export function controllableSource(executor: SimulatedExecutor): ExternalTaskSource<IJobDetails> {
  return ExternalTaskSource.create<IJobDetails>({
    id: executor.sourceId,
    history: 'observed-state',
    encodeDetails: (d) => succeed({ step: d.step, ref: d.ref }),
    compare: (a, b) => executor.compare(a, b),
    read: async (binding) => executor.read(binding),
    feed: async () => executor.page(),
    recover: async (binding) => executor.recover(binding),
    commands: [
      sourceCommand(executor, 'pause', 'source-key', false),
      sourceCommand(executor, 'resume', 'source-key', false),
      sourceCommand(executor, 'advance', 'none', false),
      sourceCommand(executor, 'cancel', 'none', true)
    ],
    capabilities: async () => succeed(stableStops)
  }).orThrow();
}

/** An observation-only source: no commands and no stop declaration. */
export function observationOnlySource(executor: SimulatedExecutor): ExternalTaskSource<IJobDetails> {
  return ExternalTaskSource.create<IJobDetails>({
    id: executor.sourceId,
    history: 'observed-state',
    encodeDetails: (d) => succeed({ step: d.step, ref: d.ref }),
    compare: (a, b) => executor.compare(a, b),
    read: async (binding) => executor.read(binding),
    feed: async () => executor.page(),
    recover: async (binding) => executor.recover(binding)
  }).orThrow();
}

function jobDescriptor(
  kind: TaskKind,
  source: ExternalTaskSource<IJobDetails>
): ITaskKindDescriptor<IJobDetails> {
  return {
    kind,
    detailVersion: 1,
    details: jobDetails,
    encode: (value): Result<JsonValue> => succeed({ step: value.step, ref: value.ref }),
    commands: source.commandHandles
  };
}

// ---------------------------------------------------------------------------
// The world: one repository, one broker, two executors
// ---------------------------------------------------------------------------

/** Everything one branch of the journey runs against. */
export interface IWorld {
  readonly clock: ScenarioClock;
  readonly ids: SequentialIds;
  readonly accessors: CountingTreeAccessors;
  readonly root: FileTree.IFileTreeDirectoryItem;
  readonly logger: Logging.InMemoryLogger;
  readonly env: TaskEnvironment;
  readonly policy: ScenarioPolicy;
  /** The controllable executor (`sim` source). */
  readonly executor: SimulatedExecutor;
  /** The observation-only executor (`watch` source). */
  readonly watcher: SimulatedExecutor;
  readonly registry: TaskKindRegistry;
  readonly jobHandle: ITaskKindHandle<IJobDetails>;
  readonly repository: ITaskRepository;
  readonly broker: TaskBroker;
}

/**
 * Options for {@link createWorld}: factories for substitute executors, to show the journey's checks
 * bite. A factory, not an instance: every branch of the journey seeds its own world.
 */
export interface IWorldOptions {
  readonly executor?: () => SimulatedExecutor;
}

interface IKinds {
  readonly registry: TaskKindRegistry;
  readonly jobHandle: ITaskKindHandle<IJobDetails>;
  readonly sources: ReadonlyArray<ExternalTaskSource<IJobDetails>>;
}

/** A fresh registry and fresh source adapters over the given executors — a process (re)start. */
function kinds(executor: SimulatedExecutor, watcher: SimulatedExecutor): IKinds {
  const controllable = controllableSource(executor);
  const observing = observationOnlySource(watcher);
  const converters = TaskConverters.create().orThrow();
  const registry = TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
  registry.register(trackedTaskDescriptor()).orThrow();
  registry.register(taskListDescriptor()).orThrow();
  const jobHandle = registry.register(jobDescriptor(jobKind, controllable)).orThrow();
  registry.register(jobDescriptor(watchKind, observing)).orThrow();
  return { registry, jobHandle, sources: [controllable, observing] };
}

/** A new world over a fresh in-memory root. */
export async function createWorld(options?: IWorldOptions): Promise<Result<IWorld>> {
  const clock = new ScenarioClock();
  const ids = new SequentialIds();
  const accessors = CountingTreeAccessors.createEmpty();
  const root = FileTree.DirectoryItem.create('/', accessors).orThrow();
  const executor = options?.executor?.() ?? new SimulatedExecutor('sim');
  const watcher = new SimulatedExecutor('watch');
  const logger = new Logging.InMemoryLogger('detail');
  const env = TaskEnvironment.create({ logger, clock: clock.read, newId: ids.mint }).orThrow();
  const k = kinds(executor, watcher);
  return (
    await FileTreeTaskRepository.initialize({ root, mode: 'session', environment: env, registry: k.registry })
  ).asResult.onSuccess((repository) =>
    TaskBroker.create({ repository, environment: env, sources: k.sources }).onSuccess((broker) =>
      succeed({
        clock,
        ids,
        accessors,
        root,
        logger,
        env,
        policy: new ScenarioPolicy(),
        executor,
        watcher,
        registry: k.registry,
        jobHandle: k.jobHandle,
        repository,
        broker
      })
    )
  );
}

/**
 * Opens a world's root again — after its repository was closed — with a fresh registry, fresh
 * source adapters and a fresh broker: what a host process restart does. The executors are external
 * and keep running.
 */
export async function openWorld(world: IWorld): Promise<Result<IWorld>> {
  const k = kinds(world.executor, world.watcher);
  return (
    await FileTreeTaskRepository.open({
      root: world.root,
      mode: 'session',
      environment: world.env,
      registry: k.registry
    })
  ).asResult.onSuccess((opened) =>
    opened.state !== 'ready'
      ? fail<IWorld>(`reopen: recovery required: ${opened.recovery.report.issues.length} issue(s)`)
      : TaskBroker.create({
          repository: opened.repository,
          environment: world.env,
          sources: k.sources
        }).onSuccess((broker) =>
          succeed({
            ...world,
            registry: k.registry,
            jobHandle: k.jobHandle,
            repository: opened.repository,
            broker
          })
        )
  );
}

/** Closes a world's repository and {@link openWorld | opens} it again. */
export async function reopenWorld(world: IWorld): Promise<Result<IWorld>> {
  const closed = world.repository.close();
  return closed.isFailure() ? fail(`reopen: close failed: ${closed.message}`) : openWorld(world);
}

/**
 * The host's projector: the default envelope projection, plus a job's typed details — decoded
 * through the kind's registered handle, so they are `IJobDetails` and nothing else.
 */
export function projectorFor(world: IWorld): ITaskProjector {
  return {
    envelope: defaultTaskProjector.envelope,
    details: (snapshot: ITaskSnapshot): Result<JsonValue> =>
      snapshot.envelope.kind === jobKind
        ? world.jobHandle
            .decode(snapshot)
            .onSuccess((typed) => succeed<JsonValue>({ step: typed.details.step, ref: typed.details.ref }))
        : succeed<JsonValue>({})
  };
}

/** Binds a principal's writer over both scopes (creations are labelled with both). */
export function writerFor(world: IWorld, principal: string): Result<IBoundTaskWriter> {
  return world.broker.bind({
    principal,
    scopes: [projectScope, personalScope],
    authorization: world.policy,
    projector: projectorFor(world)
  });
}

/** Binds a principal's read-only view over `scopes`. */
export function viewFor(
  world: IWorld,
  principal: string,
  scopes: ReadonlyArray<ITaskScope>
): Result<IBoundTaskView> {
  return world.broker.bindView({
    principal,
    scopes,
    authorization: world.policy,
    projector: projectorFor(world)
  });
}
