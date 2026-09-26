/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree, JsonSchema, JsonValue } from '@fgv/ts-json-base';
import { Converter, Converters, Logging, Result, fail, succeed } from '@fgv/ts-utils';
import {
  ExternalCommandResult,
  ExternalProjection,
  ExternalRead,
  ExternalRecovery,
  ExternalTaskSource,
  IExternalPage,
  FileTreeTaskRepository,
  IBoundTaskWriter,
  ICommandRequest,
  ISourceBinding,
  ISourceReplayEnvelope,
  ISourceRevision,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskKindDescriptor,
  ITaskReference,
  ITaskRepository,
  ITaskScope,
  Instant,
  OperationId,
  SourceHistoryContract,
  SourceRevisionOrder,
  TaskBroker,
  TaskEnvironment,
  TaskId,
  TaskKind,
  TaskKindRegistry,
  TaskLifecycle,
  TaskRepositoryMode,
  taskListDescriptor,
  trackedTaskDescriptor
} from '../../index';
import { TestPolicy, alpha, op, tid, watch } from './brokerFixtures';
import { converters } from './fixtures';
import { environment, memoryRoot, vendorDescriptor } from './storageFixtures';

/**
 * The kind a simulated executor's jobs are registered under. Its details are the **bounded adapter
 * projection** — a step counter and a reference — never the executor's own job record.
 */
export const jobKind: TaskKind = 'sim.job' as TaskKind;

/** The bounded projection a job presents to the broker. */
export interface IJobDetails {
  readonly step: number;
  readonly ref: string;
}

const jobDetails: Converter<IJobDetails> = Converters.strictObject<IJobDetails>({
  step: Converters.number,
  ref: Converters.string
});

/** One simulated executor job: the executor's own record, which it keeps and the broker never copies. */
export interface ISimulatedJob {
  readonly job: string;
  epoch: string;
  token: number;
  lifecycle: TaskLifecycle;
  progress?: { readonly completed: number; readonly total: number };
  attention: ReadonlyArray<ITaskReference>;
  step: number;
  /** Executor-owned payload: retained source text, checkpoints — arbitrarily large. */
  payload: string;
  /** Every command the executor actually applied, in order, by key. */
  readonly applied: string[];
}

/** One entry of the simulated durable feed. */
interface IFeedEntry {
  readonly binding: ISourceBinding;
  readonly projection: ExternalProjection<IJobDetails>;
}

/** The time every simulated observation carries, unless a test sets another. */
export const observedAt: Instant = '2026-09-24T10:00:00.000Z' as Instant;

/**
 * A deterministic, controllable executor behind a source.
 *
 * @remarks
 * It **actually applies** the commands it accepts: `pause`, `resume`, `cancel` and `advance` change
 * the job's state and revision, and are logged in `applied`. A test that asserts a command's effect
 * therefore fails if the executor stops applying — the empty-command-set adapter's blind spot.
 *
 * `history` selects what it offers: `observed-state` (latest snapshot reads and a listing) or
 * `source-replay` (every revision appended to an ordered feed, which `reconcile` pages through).
 */
export class SimulatedExecutor {
  public readonly sourceId: string;
  public readonly history: SourceHistoryContract;
  public readonly jobs: Map<string, ISimulatedJob> = new Map();
  /** The ordered feed a `source-replay` source pages through. */
  public readonly feed: IFeedEntry[] = [];
  /** Keys the executor has answered, and what it answered: its dedup ledger. */
  public readonly keys: Map<string, ExternalCommandResult<IJobDetails>> = new Map();
  /** Keys the executor has forgotten. */
  public readonly expired: Set<string> = new Set();
  public pageSize: number = 10;
  public coverage: 'all-bindings' | 'active-only' = 'all-bindings';
  public down: boolean = false;
  /** Apply the next command, then fail the response (a lost response). */
  public loseNextResponse: boolean = false;
  /** Answer commands `accepted` (applied later by `settleAccepted`) rather than `applied`. */
  public acceptOnly: boolean = false;
  public answerIndeterminate: boolean = false;
  /** How many times each command key was actually dispatched to the executor. */
  public readonly dispatches: Map<string, number> = new Map();
  public readonly pending: Array<{
    readonly job: string;
    readonly key: string;
    readonly command: string;
    readonly parameters: JsonValue;
  }> = [];
  /** Test hook: runs inside `dispatch`, before the executor answers. */
  public onDispatch: ((request: ICommandRequest) => Promise<void>) | undefined = undefined;
  /** Gaps to report: a page covering these feed indices reports `gap`. */
  public gapAt: number | undefined = undefined;

  public constructor(sourceId: string, history: SourceHistoryContract) {
    this.sourceId = sourceId;
    this.history = history;
  }

  public binding(job: string): ISourceBinding {
    return { sourceId: this.sourceId, referenceVersion: 1, reference: { store: 'exec-a', job } };
  }

  /** Adds a job and, for a replaying source, appends its first revision to the feed. */
  public addJob(
    job: string,
    lifecycle: TaskLifecycle = { status: 'running' },
    payloadBytes: number = 16
  ): ISimulatedJob {
    const created: ISimulatedJob = {
      job,
      epoch: 'e1',
      token: 1,
      lifecycle,
      attention: [],
      step: 0,
      payload: 'x'.repeat(payloadBytes),
      applied: []
    };
    this.jobs.set(job, created);
    this._publish(created);
    return created;
  }

  /** Changes a job (as the executor's own work does), advancing its revision. */
  public change(job: string, change: (j: ISimulatedJob) => void, publish: boolean = true): ISimulatedJob {
    const target: ISimulatedJob = this.jobs.get(job)!;
    change(target);
    target.token++;
    if (publish) {
      this._publish(target);
    }
    return target;
  }

  public projection(job: ISimulatedJob, at: Instant = observedAt): ExternalProjection<IJobDetails> {
    return {
      revision: { epoch: job.epoch, token: String(job.token) },
      observedAt: at,
      lifecycle: job.lifecycle,
      ...(job.progress !== undefined ? { progress: job.progress } : {}),
      attention: job.attention,
      details: { step: job.step, ref: `exec-a/${job.job}` }
    };
  }

  public read(binding: ISourceBinding, at: Instant = observedAt): Result<ExternalRead<IJobDetails>> {
    if (this.down) {
      return fail(`${this.sourceId} is down`);
    }
    const job = this._jobOf(binding);
    return job === undefined
      ? succeed({ state: 'missing', reason: 'no such job' })
      : succeed({ state: 'observed', value: this.projection(job, at) });
  }

  /** Settles the commands answered `accepted`: the executor applies them now. */
  public settleAccepted(): void {
    for (const entry of this.pending.splice(0)) {
      this._apply(entry.job, entry.key, entry.command, entry.parameters);
    }
  }

  private _publish(job: ISimulatedJob): void {
    if (this.history === 'source-replay') {
      this.feed.push({ binding: this.binding(job.job), projection: this.projection(job) });
    }
  }

  private _jobOf(binding: ISourceBinding): ISimulatedJob | undefined {
    const reference = binding.reference as { job?: string };
    return reference.job !== undefined ? this.jobs.get(reference.job) : undefined;
  }

  public compare(a: ISourceRevision, b: ISourceRevision): Result<SourceRevisionOrder> {
    if (a.epoch !== b.epoch) {
      return succeed('incomparable');
    }
    const x = Number(a.token);
    const y = Number(b.token);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return fail(`unreadable token ${a.token} or ${b.token}`);
    }
    return succeed(x < y ? 'older' : x > y ? 'newer' : 'same');
  }

  public page(cursor: string | undefined): Result<IExternalPage<IJobDetails>> {
    if (this.down) {
      return fail(`${this.sourceId} is down`);
    }
    const start = cursor === undefined ? 0 : Number(cursor);
    if (this.history === 'source-replay') {
      const end = Math.min(this.feed.length, start + this.pageSize);
      if (this.gapAt !== undefined && this.gapAt >= start && this.gapAt < end) {
        return succeed({
          observations: [],
          completeness: 'gap',
          coverage: this.coverage,
          issues: ['feed lost an entry']
        });
      }
      const slice = this.feed.slice(start, end);
      return succeed({
        observations: slice.map((e) => ({
          binding: e.binding,
          observation: { state: 'observed' as const, value: e.projection }
        })),
        ...(end < this.feed.length ? { nextCursor: String(end) } : {}),
        checkpoint: String(end),
        completeness: 'complete',
        coverage: this.coverage,
        issues: []
      });
    }
    const all = Array.from(this.jobs.values())
      .filter(
        (j) =>
          this.coverage === 'all-bindings' ||
          !['succeeded', 'failed', 'cancelled'].includes(j.lifecycle.status)
      )
      .sort((a, b) => (a.job < b.job ? -1 : 1));
    const end = Math.min(all.length, start + this.pageSize);
    return succeed({
      observations: all.slice(start, end).map((j) => ({
        binding: this.binding(j.job),
        observation: { state: 'observed' as const, value: this.projection(j) }
      })),
      ...(end < all.length ? { nextCursor: String(end) } : {}),
      completeness: 'complete',
      coverage: this.coverage,
      issues: []
    });
  }

  public recover(binding: ISourceBinding): Result<ExternalRecovery<IJobDetails>> {
    if (this.down) {
      return succeed({ state: 'unavailable', reason: `${this.sourceId} is down` });
    }
    const job = this._jobOf(binding);
    if (job === undefined) {
      return succeed({ state: 'unresolved', reason: 'no such job' });
    }
    const status = job.lifecycle.status;
    if (status === 'failed' && job.lifecycle.reason.code === 'lost') {
      return succeed({
        state: 'unrecoverable',
        reason: 'the executor lost the job',
        value: this.projection(job)
      });
    }
    if (status === 'paused' && job.lifecycle.reason.code === 'resumable') {
      return succeed({ state: 'resumable', reference: { resumeFrom: job.step } });
    }
    return succeed({
      state:
        status === 'succeeded' || status === 'failed' || status === 'cancelled' ? 'completed' : 'reattached',
      value: this.projection(job)
    });
  }

  /** The executor's command entry point: deduplicates by key when told the key is its own. */
  public async dispatch(
    binding: ISourceBinding,
    request: ICommandRequest,
    parameters: JsonValue,
    deduplicates: boolean,
    expected?: ISourceRevision
  ): Promise<Result<ExternalCommandResult<IJobDetails>>> {
    this.dispatches.set(request.operationId, (this.dispatches.get(request.operationId) ?? 0) + 1);
    if (this.onDispatch !== undefined) {
      await this.onDispatch(request);
    }
    if (this.down) {
      return fail(`${this.sourceId} is down`);
    }
    if (this.expired.has(request.operationId)) {
      return succeed({ state: 'key-expired', reason: 'the key aged out of the executor ledger' });
    }
    if (deduplicates) {
      const previous = this.keys.get(request.operationId);
      if (previous !== undefined) {
        return succeed(previous);
      }
    }
    const job = this._jobOf(binding);
    if (job === undefined) {
      return succeed({ state: 'rejected', reason: 'unsupported' });
    }
    if (this.answerIndeterminate) {
      return succeed({ state: 'indeterminate', reason: 'the executor could not say' });
    }
    if (['succeeded', 'failed', 'cancelled'].includes(job.lifecycle.status)) {
      return succeed({ state: 'rejected', reason: 'invalid-transition' });
    }
    if (expected !== undefined && (expected.epoch !== job.epoch || Number(expected.token) !== job.token)) {
      // The precondition failed: a refusal, never an optimistic status change.
      return succeed({ state: 'rejected', reason: 'conflict' });
    }
    let answer: ExternalCommandResult<IJobDetails>;
    if (this.acceptOnly) {
      this.pending.push({ job: job.job, key: request.operationId, command: request.command, parameters });
      answer = { state: 'accepted', sourceReceipt: `rcpt-${request.operationId}` };
    } else {
      this._apply(job.job, request.operationId, request.command, parameters);
      answer = { state: 'applied', observation: this.projection(this.jobs.get(job.job)!) };
    }
    this.keys.set(request.operationId, answer);
    if (this.loseNextResponse) {
      this.loseNextResponse = false;
      return fail('connection reset after the executor applied the command');
    }
    return succeed(answer);
  }

  public lookup(
    request: ICommandRequest
  ): Result<ExternalCommandResult<IJobDetails> | { readonly state: 'not-found' }> {
    if (this.expired.has(request.operationId)) {
      return succeed({ state: 'key-expired', reason: 'the key aged out of the executor ledger' });
    }
    return succeed(this.keys.get(request.operationId) ?? { state: 'not-found' });
  }

  private _apply(job: string, key: string, command: string, parameters: JsonValue): void {
    const p = parameters as { reason?: string; steps?: number };
    this.change(job, (j) => {
      j.applied.push(`${command}:${key}`);
      switch (command) {
        case 'pause':
          j.lifecycle = { status: 'paused', reason: { code: 'paused', summary: p.reason ?? 'paused' } };
          break;
        case 'resume':
          j.lifecycle = { status: 'running' };
          break;
        case 'cancel':
          j.lifecycle = {
            status: 'cancelled',
            reason: { code: 'cancelled', summary: p.reason ?? 'cancelled' }
          };
          break;
        default:
          j.step += p.steps ?? 1;
          j.progress = { completed: j.step, total: 10 };
      }
    });
  }
}

interface IReasonParameters {
  readonly reason: string;
}
interface IAdvanceParameters {
  readonly steps: number;
}

/**
 * Builds the controllable source over an executor. `pause` and `resume` deduplicate by key
 * (`source-key`); `cancel` and `advance` do not (`none`) — `cancel` is conditional.
 */
export function controllableSource(
  executor: SimulatedExecutor,
  options?: { readonly lookup?: boolean }
): ExternalTaskSource<IJobDetails> {
  const reasonSchema: JsonSchema.ISchemaValidator<IReasonParameters> = JsonSchema.object({
    reason: JsonSchema.string()
  });
  const emptySchema: JsonSchema.ISchemaValidator<Record<string, never>> = JsonSchema.object({});
  const advanceSchema: JsonSchema.ISchemaValidator<IAdvanceParameters> = JsonSchema.object({
    steps: JsonSchema.integer()
  });
  const command = <P extends object>(
    name: string,
    schema: JsonSchema.ISchemaValidator<P>,
    idempotency: 'source-key' | 'none',
    conditional: boolean
  ): ReturnType<typeof ExternalTaskSource.command<IJobDetails, P>> =>
    ExternalTaskSource.command<IJobDetails, P>(
      {
        name,
        parameters: schema,
        encode: (p: P): Result<JsonValue> => succeed({ ...p } as unknown as JsonValue),
        idempotency,
        conditional
      },
      (binding, parameters, request, expected) =>
        executor.dispatch(
          binding,
          request,
          { ...parameters } as unknown as JsonValue,
          idempotency === 'source-key',
          expected
        )
    );
  return ExternalTaskSource.create<IJobDetails>({
    id: executor.sourceId,
    history: executor.history,
    encodeDetails: (d) => succeed({ step: d.step, ref: d.ref }),
    compare: (a, b) => executor.compare(a, b),
    read: async (binding) => executor.read(binding),
    feed: async (cursor) => executor.page(cursor),
    recover: async (binding) => executor.recover(binding),
    commands: [
      command('pause', reasonSchema, 'source-key', false),
      command('resume', emptySchema, 'source-key', false),
      command('cancel', reasonSchema, 'none', true),
      command('advance', advanceSchema, 'none', false)
    ],
    ...(options?.lookup === true ? { lookupCommand: async (__, r) => executor.lookup(r) } : {})
  }).orThrow();
}

/** An observation-only source over an executor: no commands at all. */
export function observationOnlySource(executor: SimulatedExecutor): ExternalTaskSource<IJobDetails> {
  return ExternalTaskSource.create<IJobDetails>({
    id: executor.sourceId,
    history: executor.history,
    encodeDetails: (d) => succeed({ step: d.step, ref: d.ref }),
    compare: (a, b) => executor.compare(a, b),
    read: async (binding) => executor.read(binding),
    feed: async (cursor) => executor.page(cursor),
    recover: async (binding) => executor.recover(binding)
  }).orThrow();
}

/** The job kind, registered with a source's command handles. */
export function jobDescriptor(
  source: ExternalTaskSource<IJobDetails>,
  kind: TaskKind = jobKind
): ITaskKindDescriptor<IJobDetails> {
  return {
    kind,
    detailVersion: 1,
    details: jobDetails,
    encode: (value): Result<JsonValue> => succeed({ step: value.step, ref: value.ref }),
    commands: source.commandHandles
  };
}

export interface ISourceHarness {
  readonly root: FileTree.IFileTreeDirectoryItem;
  readonly repository: ITaskRepository;
  readonly broker: TaskBroker;
  readonly policy: TestPolicy;
  readonly writer: IBoundTaskWriter;
  readonly env: TaskEnvironment;
  readonly logger: Logging.InMemoryLogger;
  readonly executor: SimulatedExecutor;
  readonly source: ExternalTaskSource<IJobDetails>;
  readonly registry: TaskKindRegistry;
}

/** Options for {@link sourceHarness}. */
export interface ISourceHarnessOptions {
  readonly history?: SourceHistoryContract;
  readonly observationOnly?: boolean;
  readonly lookup?: boolean;
  readonly profile?: ITaskCapacityProfile;
  /** Subscribe the all-seeing watcher before returning. */
  readonly watch?: boolean;
  readonly root?: FileTree.IFileTreeDirectoryItem;
  readonly mode?: TaskRepositoryMode;
  /** Attach the source to the broker (default true). */
  readonly attach?: boolean;
  readonly executor?: SimulatedExecutor;
  /** A host clock to use instead of the fixed one. */
  readonly clock?: () => number;
  /** A host ID factory to use instead of the sequential one. */
  readonly newId?: () => Result<string>;
}

/** A registry with the tracked, list, vendor and job kinds. */
export function sourceRegistry(source: ExternalTaskSource<IJobDetails>): TaskKindRegistry {
  const reg = TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
  reg.register(trackedTaskDescriptor()).orThrow();
  reg.register(taskListDescriptor()).orThrow();
  reg.register(vendorDescriptor()).orThrow();
  reg.register(jobDescriptor(source)).orThrow();
  return reg;
}

/** A broker over a fresh repository with a simulated source attached, and `alice` bound over `alpha`. */
export async function sourceHarness(options?: ISourceHarnessOptions): Promise<ISourceHarness> {
  const executor = options?.executor ?? new SimulatedExecutor('exec', options?.history ?? 'observed-state');
  const source =
    options?.observationOnly === true
      ? observationOnlySource(executor)
      : controllableSource(executor, options?.lookup === true ? { lookup: true } : undefined);
  const registry = sourceRegistry(source);
  const root = options?.root ?? memoryRoot();
  const base = environment('s');
  const logger = base.logger;
  const env: TaskEnvironment =
    options?.clock === undefined && options?.newId === undefined
      ? base.env
      : TaskEnvironment.create({
          logger,
          clock: options.clock ?? base.env.clock,
          newId: options.newId ?? base.env.newId
        }).orThrow();
  const repository = (
    await FileTreeTaskRepository.initialize({
      root,
      mode: options?.mode ?? 'session',
      environment: env,
      registry,
      ...(options?.profile !== undefined ? { profile: options.profile } : {})
    })
  ).orThrow();
  const harness: ISourceHarness = harnessWith(
    repository,
    env,
    root,
    logger,
    executor,
    source,
    registry,
    options
  );
  if (options?.watch === true) {
    await watch(
      harness.broker,
      options.history === 'source-replay' ? { history: 'source-replay' } : undefined
    );
  }
  return harness;
}

/** A source harness over an existing repository (a reopen). */
export function harnessWith(
  repository: ITaskRepository,
  env: TaskEnvironment,
  root: FileTree.IFileTreeDirectoryItem,
  logger: Logging.InMemoryLogger,
  executor: SimulatedExecutor,
  source: ExternalTaskSource<IJobDetails>,
  registry: TaskKindRegistry,
  options?: ISourceHarnessOptions
): ISourceHarness {
  const broker = TaskBroker.create({
    repository,
    environment: env,
    ...(options?.attach === false ? {} : { sources: [source] })
  }).orThrow();
  const policy = new TestPolicy();
  const writer = broker.bind({ principal: 'alice', scopes: [alpha], authorization: policy }).orThrow();
  return { root, repository, broker, policy, writer, env, logger, executor, source, registry };
}

/** Registers a job task through the trusted host API. */
export async function registerJob(
  h: ISourceHarness,
  job: string,
  options?: {
    readonly unresolved?: boolean;
    readonly envelope?: ISourceReplayEnvelope;
    readonly scopes?: ReadonlyArray<ITaskScope>;
    readonly operationId?: OperationId;
  }
): Promise<TaskId> {
  const replay = h.executor.history === 'source-replay';
  const current = h.executor.jobs.get(job)!;
  (
    await h.broker.registerExternal('host', {
      taskId: tid(job),
      operationId: options?.operationId ?? op(`register-${job}`),
      kind: jobKind,
      detailVersion: 1,
      title: `job ${job}`,
      scopes: options?.scopes ?? [alpha],
      binding: h.executor.binding(job),
      recovery: 'reattach',
      ...(replay
        ? {
            history: {
              history: 'source-replay',
              envelope: options?.envelope ?? {
                remainingRequiredUpdates: 16,
                remainingRequiredBytes: 16 * 1024
              }
            }
          }
        : {}),
      ...(replay || options?.unresolved === true
        ? {}
        : {
            initialObservation: {
              ...h.executor.projection(current),
              details: { step: current.step, ref: `exec-a/${job}` }
            }
          })
    })
  ).orThrow();
  return tid(job);
}

/** The committed record of a task. */
export async function recordOf(
  h: { readonly repository: ITaskRepository },
  id: string
): Promise<ITaskCommitRecord> {
  return (await h.repository.readCommit(tid(id))).orThrow()!;
}
