/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree, JsonValue } from '@fgv/ts-json-base';
import { Logging, Result, succeed } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  IBoundTaskViewParams,
  IBoundTaskWriter,
  ICommandReceipt,
  IResponsibility,
  ISourceBinding,
  ISourceProjection,
  ITaskAccessRequest,
  ITaskAuthorization,
  ITaskCapacityProfile,
  ITaskMutationResult,
  ITaskRepository,
  ITaskScope,
  ITaskSubscription,
  OperationId,
  SubscriptionId,
  TaskBroker,
  TaskEnvironment,
  TaskId,
  TaskKindRegistry,
  TaskRepositoryMode,
  TaskRevision,
  UpdateCategory,
  allUpdateCategories,
  taskListDescriptor,
  trackedTaskDescriptor
} from '../../index';
import { converters } from './fixtures';
import { at, environment, memoryRoot, vendorDescriptor, vendorKind } from './storageFixtures';

export const alpha: ITaskScope = { namespace: 'project', key: 'alpha' };
export const beta: ITaskScope = { namespace: 'project', key: 'beta' };
export const gamma: ITaskScope = { namespace: 'project', key: 'gamma' };

export const ada: IResponsibility = { namespace: 'agent', key: 'ada' };
export const bob: IResponsibility = { namespace: 'agent', key: 'bob' };

/** A fresh registry with tracked, list and vendor kinds. */
export function brokerRegistry(): TaskKindRegistry {
  const reg: TaskKindRegistry = TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
  reg.register(trackedTaskDescriptor()).orThrow();
  reg.register(taskListDescriptor()).orThrow();
  reg.register(vendorDescriptor()).orThrow();
  return reg;
}

/**
 * A scriptable host policy.
 *
 * @remarks
 * Allows everything unless a `deny` rule matches. Every check is recorded. `afterDecision` runs
 * inside each check after its answer is decided and before it is returned — the hook tests use to
 * change the policy *between* a check and the commit that relies on it.
 */
export class TestPolicy implements ITaskAuthorization {
  public epoch: string = 'epoch-1';
  public readonly deny: Array<(request: ITaskAccessRequest) => boolean> = [];
  public readonly calls: ITaskAccessRequest[] = [];
  public afterDecision: ((request: ITaskAccessRequest) => void | Promise<void>) | undefined = undefined;

  public async check(request: ITaskAccessRequest): Promise<Result<boolean>> {
    this.calls.push(request);
    const allowed: boolean = !this.deny.some((rule) => rule(request));
    if (this.afterDecision !== undefined) {
      await this.afterDecision(request);
    }
    return succeed(allowed);
  }

  public policyEpoch(): string {
    return this.epoch;
  }

  /** Denies an action on a task id (as subject, or in any role). */
  public denyOn(action: ITaskAccessRequest['action'], id: string): void {
    this.deny.push((r) => r.action === action && (r.task?.envelope.id === id || r.reference?.id === id));
  }

  /** Hides a task from reads. */
  public hide(id: string): void {
    this.denyOn('read', id);
  }
}

export interface IBrokerHarness {
  readonly root: FileTree.IFileTreeDirectoryItem;
  readonly repository: ITaskRepository;
  readonly broker: TaskBroker;
  readonly policy: TestPolicy;
  readonly writer: IBoundTaskWriter;
  readonly env: TaskEnvironment;
  readonly logger: Logging.InMemoryLogger;
}

/** A broker over a fresh session repository, and a writer bound to `alice` over `alpha`. */
export async function brokerHarness(options?: {
  readonly profile?: ITaskCapacityProfile;
  /** Subscribe the all-seeing {@link watcher} before returning. */
  readonly watch?: boolean;
  readonly root?: FileTree.IFileTreeDirectoryItem;
  readonly mode?: TaskRepositoryMode;
  readonly scopes?: ReadonlyArray<ITaskScope>;
}): Promise<IBrokerHarness> {
  const root = options?.root ?? memoryRoot();
  const { env, logger } = environment('b');
  const repository = (
    await FileTreeTaskRepository.initialize({
      root,
      mode: options?.mode ?? 'session',
      environment: env,
      registry: brokerRegistry(),
      ...(options?.profile !== undefined ? { profile: options.profile } : {})
    })
  ).orThrow();
  const harness: IBrokerHarness = harnessOver(repository, env, root, { ...options, logger });
  if (options?.watch === true) {
    await watch(harness.broker);
  }
  return harness;
}

/** A harness over an existing repository. */
export function harnessOver(
  repository: ITaskRepository,
  env: TaskEnvironment,
  root: FileTree.IFileTreeDirectoryItem,
  options?: {
    readonly scopes?: ReadonlyArray<ITaskScope>;
    readonly logger?: Logging.InMemoryLogger;
  }
): IBrokerHarness {
  const broker = TaskBroker.create({ repository, environment: env }).orThrow();
  const policy = new TestPolicy();
  const writer = broker
    .bind({ principal: 'alice', scopes: options?.scopes ?? [alpha], authorization: policy })
    .orThrow();
  return {
    root,
    repository,
    broker,
    policy,
    writer,
    env,
    logger: options?.logger ?? new Logging.InMemoryLogger('detail')
  };
}

/** Binds another writer on the same broker. */
export function bindWriter(
  harness: IBrokerHarness,
  params: Partial<IBoundTaskViewParams> & { readonly authorization?: ITaskAuthorization }
): IBoundTaskWriter {
  return harness.broker
    .bind({ principal: 'alice', scopes: [alpha], authorization: harness.policy, ...params })
    .orThrow();
}

let opCounter: number = 0;

/** A fresh operation id. */
export function op(prefix: string = 'op'): OperationId {
  return `${prefix}-${++opCounter}` as OperationId;
}

export function tid(id: string): TaskId {
  return id as TaskId;
}

export function rev(n: number): TaskRevision {
  return n as TaskRevision;
}

/** Creates a tracked task and returns its receipt. */
export async function track(
  writer: IBoundTaskWriter,
  id: string,
  extra?: { parentId?: string; responsibility?: IResponsibility; title?: string }
): Promise<ITaskMutationResult> {
  return (
    await writer.createTracked({
      taskId: tid(id),
      operationId: op(`create-${id}`),
      title: extra?.title ?? `task ${id}`,
      ...(extra?.parentId !== undefined ? { parentId: tid(extra.parentId) } : {}),
      ...(extra?.responsibility !== undefined ? { responsibility: extra.responsibility } : {})
    })
  ).orThrow();
}

/** Creates a task list and returns its receipt. */
export async function list(
  writer: IBoundTaskWriter,
  id: string,
  completion: 'manual' | 'all-children-succeeded' = 'all-children-succeeded',
  extra?: { parentId?: string }
): Promise<ITaskMutationResult> {
  return (
    await writer.createTaskList({
      taskId: tid(id),
      operationId: op(`create-${id}`),
      title: `list ${id}`,
      completion,
      ...(extra?.parentId !== undefined ? { parentId: tid(extra.parentId) } : {})
    })
  ).orThrow();
}

/** The committed semantic revision of a task, read through the trusted repository API. */
export async function revisionOf(repository: ITaskRepository, id: string): Promise<TaskRevision> {
  const record = (await repository.readCommit(tid(id))).orThrow()!;
  return record.recordType === 'resolved' ? record.task.envelope.revision : record.reference.revision;
}

/** Runs a tracked command at the task's current revision. */
export async function command(
  harness: { readonly repository: ITaskRepository },
  writer: IBoundTaskWriter,
  id: string,
  name: string,
  parameters: JsonValue = {},
  operationId?: OperationId
): Promise<ICommandReceipt> {
  const expectedRevision = await revisionOf(harness.repository, id);
  return (
    await writer.execute({
      taskId: tid(id),
      operationId: operationId ?? op(`${name}-${id}`),
      expectedRevision,
      command: name,
      parameters
    })
  ).orThrow();
}

/** Succeeds a tracked task. */
export async function succeedTask(
  harness: { readonly repository: ITaskRepository },
  writer: IBoundTaskWriter,
  id: string
): Promise<ICommandReceipt> {
  return command(harness, writer, id, 'succeed', { outcome: { summary: `${id} done`, artifacts: [] } });
}

/** A vendor source binding. */
export function vendorBinding(job: string, sourceId: string = 'acme-local'): ISourceBinding {
  return { sourceId, referenceVersion: 1, reference: { store: 'actor-a', job } };
}

/** A vendor observation at a lifecycle status. */
export function observation(
  lifecycle: ISourceProjection['lifecycle'],
  token: string = '1'
): ISourceProjection {
  return {
    revision: { epoch: 'e1', token },
    observedAt: at as ISourceProjection['observedAt'],
    lifecycle,
    attention: [],
    details: { job: 'j' }
  };
}

/** Registers an external vendor task through the trusted host API. */
export async function registerVendor(
  harness: IBrokerHarness,
  id: string,
  options?: {
    lifecycle?: ISourceProjection['lifecycle'];
    unresolved?: boolean;
    parentId?: string;
    scopes?: ReadonlyArray<ITaskScope>;
    responsibility?: IResponsibility;
    sourceId?: string;
  }
): Promise<void> {
  (
    await harness.broker.registerExternal('host', {
      taskId: tid(id),
      operationId: op(`register-${id}`),
      kind: vendorKind,
      detailVersion: 1,
      title: `vendor ${id}`,
      scopes: options?.scopes ?? [alpha],
      binding: vendorBinding(id, options?.sourceId),
      recovery: 'reattach',
      ...(options?.parentId !== undefined ? { parentId: tid(options.parentId) } : {}),
      ...(options?.responsibility !== undefined ? { responsibility: options.responsibility } : {}),
      ...(options?.unresolved === true
        ? {}
        : { initialObservation: observation(options?.lifecycle ?? { status: 'running' }) })
    })
  ).orThrow();
}

export { vendorKind };

/** The subscription {@link watch} creates by default. */
export const watcher: SubscriptionId = 'watcher' as SubscriptionId;

/** A host policy that allows everything, for trusted host bindings. */
export const allowAll: ITaskAuthorization = {
  check: async () => succeed(true),
  policyEpoch: () => 'host'
};

/**
 * Subscribes a host consumer — by default {@link watcher}, over every test scope, every lifecycle
 * class, every category, from now.
 */
export async function watch(
  broker: TaskBroker,
  options?: {
    readonly id?: string;
    readonly consumer?: string;
    readonly scopes?: ReadonlyArray<ITaskScope>;
    readonly categories?: ReadonlyArray<UpdateCategory>;
    readonly selection?: Record<string, unknown>;
    readonly start?: 'current' | 'from-now';
    readonly history?: 'observed-state' | 'source-replay';
    readonly authorization?: ITaskAuthorization;
  }
): Promise<ITaskSubscription> {
  const id: string = options?.id ?? watcher;
  const scopes: ReadonlyArray<ITaskScope> = options?.scopes ?? [alpha, beta, gamma];
  return (
    await broker.subscribe(
      { principal: 'host', scopes, authorization: options?.authorization ?? allowAll },
      {
        subscriptionId: id,
        operationId: `subscribe-${id}`,
        consumerId: options?.consumer ?? `consumer-${id}`,
        selection: { scopes, lifecycleClass: 'all', ...(options?.selection ?? {}) },
        start: options?.start ?? 'from-now',
        policy: {
          categories: options?.categories ?? [...allUpdateCategories].sort(),
          ...(options?.history !== undefined ? { history: options.history } : {})
        }
      }
    )
  ).orThrow();
}
