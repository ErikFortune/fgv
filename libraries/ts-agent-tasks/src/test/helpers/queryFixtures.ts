/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import {
  IResolvedTaskRecordDraft,
  IResponsibility,
  ISourceBinding,
  ConsumerId,
  ITaskCommitRecord,
  ITaskConsumerRecord,
  ITaskEnvelope,
  ITaskSelection,
  Instant,
  ITaskRegistrationRequest,
  ITaskRepository,
  ITaskScope,
  ITaskUpdate,
  OperationId,
  SubscriptionId,
  TaskId,
  TaskKind,
  TaskLifecycle,
  TaskRevision,
  UpdateCategory,
  allUpdateCategories
} from '../../index';
import { at, catalogOp, creationRequest, envelope, nextDraft, update, vendorKind } from './storageFixtures';

/** A scope label. */
export function scope(key: string, namespace: string = 'project'): ITaskScope {
  return { namespace, key };
}

/** A person responsible for a task. */
export function person(key: string): IResponsibility {
  return { namespace: 'agent', key };
}

/** A waiting lifecycle, optionally due at an instant. */
export function waiting(notBefore?: string): TaskLifecycle {
  return {
    status: 'waiting',
    reason: { code: 'blocked', summary: 'waiting', ...(notBefore !== undefined ? { notBefore } : {}) }
  } as TaskLifecycle;
}

/** A succeeded lifecycle. */
export const succeeded: TaskLifecycle = { status: 'succeeded', outcome: { summary: 'done', artifacts: [] } };

/** How to shape a fixture task. */
export interface ITaskShape {
  readonly scopes?: ReadonlyArray<ITaskScope>;
  readonly lifecycle?: TaskLifecycle;
  readonly parentId?: string;
  readonly responsibility?: IResponsibility;
  readonly binding?: ISourceBinding;
  /** Register as the external vendor kind, with typed details. */
  readonly vendor?: boolean;
}

/**
 * An update owed to whoever the repository says it is owed to: every commit's audience is verified
 * against the repository's own subscriptions (T7), so a fixture computes it the same way.
 */
export function owed(
  repository: Pick<ITaskRepository, 'audience'>,
  before: ITaskEnvelope | undefined,
  env: ITaskEnvelope,
  category: UpdateCategory
): ITaskUpdate {
  return { ...update(env, category), audience: repository.audience(before, env, category) };
}

/**
 * Registers a subscription directly through the repository writer: from now, every category, over a
 * selection (by default every lifecycle class of the given scopes).
 */
export async function subscribeTo(
  repository: ITaskRepository,
  id: string,
  scopes: ReadonlyArray<ITaskScope>,
  selection?: Partial<ITaskSelection>,
  coalesceProgress: boolean = false
): Promise<ITaskConsumerRecord> {
  return (
    await repository.withWriter((w) =>
      w.registerSubscription({
        subscriptionId: id as SubscriptionId,
        operationId: `op-subscribe-${id}` as OperationId,
        principalKey: 'host',
        specification: {
          consumerId: `consumer-${id}` as ConsumerId,
          selection: { scopes, lifecycleClass: 'all', ...selection },
          start: 'from-now',
          policy: {
            schemaVersion: 1,
            durability: repository.mode === 'session' ? 'session' : 'process-crash',
            history: 'observed-state',
            categories: [...allUpdateCategories].sort(),
            coalesceProgress
          }
        },
        baseline: [],
        createdAt: at as Instant
      })
    )
  ).orThrow();
}

/** The registration of a task of a given shape. */
export function shapedRegistration(
  id: string,
  shape: ITaskShape = {},
  repository?: Pick<ITaskRepository, 'audience'>
): ITaskRegistrationRequest {
  const operationId: string = `op-create-${id}`;
  const request: JsonValue = creationRequest(id);
  const env: ITaskEnvelope = envelope(id, 1, {
    ...(shape.scopes !== undefined ? { scopes: shape.scopes } : {}),
    ...(shape.lifecycle !== undefined ? { lifecycle: shape.lifecycle } : {}),
    ...(shape.parentId !== undefined ? { parentId: shape.parentId as TaskId } : {}),
    ...(shape.responsibility !== undefined ? { responsibility: shape.responsibility } : {}),
    ...(shape.binding !== undefined ? { binding: shape.binding } : {}),
    ...(shape.vendor === true ? { kind: vendorKind as TaskKind } : {})
  });
  const record: IResolvedTaskRecordDraft = {
    recordType: 'resolved',
    task: { envelope: env, details: shape.vendor === true ? { job: `j-${id}` } : {} },
    operations: [catalogOp(operationId, 'create-tracked', request)],
    updates: [
      repository !== undefined ? owed(repository, undefined, env, 'lifecycle') : update(env, 'lifecycle')
    ],
    archived: false
  };
  return { taskId: id as TaskId, operationId: operationId as OperationId, request, record };
}

/** Registers a task of a given shape. */
export async function addTask(
  repository: ITaskRepository,
  id: string,
  shape: ITaskShape = {}
): Promise<ITaskCommitRecord> {
  return (
    await repository.withWriter((w) => w.register(shapedRegistration(id, shape, repository)))
  ).orThrow();
}

/** Commits one catalog operation on a task, changing its envelope and owing one update. */
export async function change(
  repository: ITaskRepository,
  id: string,
  patch: Partial<ITaskEnvelope>,
  options: {
    readonly archive?: boolean;
    readonly op?: string;
  } = {}
): Promise<ITaskCommitRecord> {
  const current: ITaskCommitRecord = (await repository.readCommit(id as TaskId)).orThrow()!;
  if (current.recordType !== 'resolved') {
    throw new Error(`change: ${id} is unresolved`);
  }
  const revision: number = current.task.envelope.revision;
  const opId: string = options.op ?? `op-${id}-${revision + 1}`;
  const draft: IResolvedTaskRecordDraft = nextDraft(current, {
    envelope: { revision: (revision + 1) as TaskRevision, ...patch },
    operation: catalogOp(opId, options.archive === true ? 'archive' : 'update-tracked', { change: opId }),
    archived: options.archive ?? false
  });
  const env: ITaskEnvelope = draft.task.envelope;
  const withUpdate: IResolvedTaskRecordDraft = {
    ...draft,
    updates: [
      ...draft.updates,
      owed(repository, current.task.envelope, env, options.archive === true ? 'relationship' : 'lifecycle')
    ]
  };
  return (
    await repository.withWriter((w) =>
      w.commit({
        purpose: 'operation',
        operationId: opId as OperationId,
        taskId: id as TaskId,
        expectedRevision: current.task.envelope.revision,
        expectedRecordRevision: current.recordRevision,
        record: withUpdate
      })
    )
  ).orThrow();
}

/** Moves a task to a terminal state and archives it. */
export async function finishAndArchive(repository: ITaskRepository, id: string): Promise<ITaskCommitRecord> {
  const current: ITaskCommitRecord = (await repository.readCommit(id as TaskId)).orThrow()!;
  if (current.recordType === 'resolved' && current.task.envelope.lifecycle.status !== 'succeeded') {
    await change(repository, id, { lifecycle: succeeded });
  }
  return change(repository, id, {}, { archive: true });
}

/** A source binding. */
export function binding(job: string, sourceId: string = 'acme'): ISourceBinding {
  return { sourceId, referenceVersion: 1, reference: { job } };
}

/** The instant fixtures use, plus an offset in minutes. */
export function minutesAfter(minutes: number): string {
  return new Date(Date.parse(at) + minutes * 60000).toISOString();
}

/** The ids of a page's items, in order. */
export function ids(items: ReadonlyArray<{ readonly envelope: ITaskEnvelope }>): string[] {
  return items.map((item) => item.envelope.id);
}
