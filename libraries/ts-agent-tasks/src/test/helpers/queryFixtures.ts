/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import {
  IResolvedTaskRecordDraft,
  IResponsibility,
  ISourceBinding,
  ITaskCommitRecord,
  ITaskEnvelope,
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
  UpdateCategory
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
  /** Subscriptions the creation update is owed to. */
  readonly audience?: ReadonlyArray<string>;
  /** Register as the external vendor kind, with typed details. */
  readonly vendor?: boolean;
}

/** An update owed to an audience. */
export function owed(
  env: ITaskEnvelope,
  category: UpdateCategory,
  audience: ReadonlyArray<string>
): ITaskUpdate {
  return { ...update(env, category), audience: audience as ReadonlyArray<SubscriptionId> };
}

/** The registration of a task of a given shape. */
export function shapedRegistration(id: string, shape: ITaskShape = {}): ITaskRegistrationRequest {
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
    updates: [owed(env, 'lifecycle', shape.audience ?? [])],
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
  return (await repository.withWriter((w) => w.register(shapedRegistration(id, shape)))).orThrow();
}

/** Commits one catalog operation on a task, changing its envelope and owing one update. */
export async function change(
  repository: ITaskRepository,
  id: string,
  patch: Partial<ITaskEnvelope>,
  options: {
    readonly archive?: boolean;
    readonly audience?: ReadonlyArray<string>;
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
      owed(env, options.archive === true ? 'relationship' : 'lifecycle', options.audience ?? [])
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
