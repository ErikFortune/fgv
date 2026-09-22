/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { FileTree, JsonValue } from '@fgv/ts-json-base';
import { Converters, Logging, Result, succeed } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  IResolvedTaskRecordDraft,
  IStoredTaskOperation,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskEnvelope,
  ITaskKindDescriptor,
  ITaskRegistrationRequest,
  ITaskRepository,
  ITaskRepositoryOpenParams,
  ITaskUpdate,
  IUnresolvedTaskRecordDraft,
  OperationId,
  TaskEnvironment,
  TaskId,
  TaskKind,
  TaskKindRegistry,
  TaskRepositoryMode,
  TaskRevision,
  UpdateCategory,
  taskUpdateId,
  trackedTaskDescriptor
} from '../../index';
import { converters } from './fixtures';

/** The instant every fixture record uses. */
export const at: string = '2026-09-22T12:00:00.000Z';

/** A host-registered external kind, as a consumer would register one. */
export const vendorKind: TaskKind = 'acme.job' as TaskKind;

/** Registration descriptor for {@link vendorKind}: details `{ job: string }`. */
export function vendorDescriptor(): ITaskKindDescriptor<{ job: string }> {
  return {
    kind: vendorKind,
    detailVersion: 1,
    details: Converters.strictObject<{ job: string }>({ job: Converters.string }),
    encode: (value): Result<JsonValue> => succeed({ job: value.job })
  };
}

/** A fresh registry with the tracked kind and the vendor kind registered. */
export function registry(extra?: { withoutVendor?: boolean }): TaskKindRegistry {
  const reg: TaskKindRegistry = TaskKindRegistry.create(converters.envelopes.snapshot).orThrow();
  reg.register(trackedTaskDescriptor()).orThrow();
  if (extra?.withoutVendor !== true) {
    reg.register(vendorDescriptor()).orThrow();
  }
  return reg;
}

/**
 * Every environment in one process draws from one sequence. A real host's ID factory is
 * globally unique; a per-environment counter restarting at 1 would mint claim IDs that collide
 * with claims an earlier environment already wrote to the same root.
 */
let next: number = 0;

/** A deterministic environment: sequential IDs, fixed clock, in-memory logger. */
export function environment(prefix: string = 'id'): { env: TaskEnvironment; logger: Logging.InMemoryLogger } {
  const logger: Logging.InMemoryLogger = new Logging.InMemoryLogger('detail');
  const env: TaskEnvironment = TaskEnvironment.create({
    logger,
    clock: () => Date.parse(at),
    newId: () => succeed(`${prefix}-${++next}`)
  }).orThrow();
  return { env, logger };
}

/** A fresh mutable in-memory root. */
export function memoryRoot(): FileTree.IFileTreeDirectoryItem {
  const accessors = FileTree.InMemoryTreeAccessors.create([], { mutable: true }).orThrow();
  return FileTree.DirectoryItem.create('/', accessors).orThrow();
}

/** A fresh real directory on the Node filesystem, and its root item. */
export function nodeRoot(base?: string): { dir: string; root: FileTree.IFileTreeDirectoryItem } {
  const dir: string = fs.mkdtempSync(path.join(base ?? os.tmpdir(), 'fgv-tasks-'));
  return { dir, root: nodeRootAt(dir) };
}

/** A root item over an existing directory. */
export function nodeRootAt(dir: string): FileTree.IFileTreeDirectoryItem {
  const accessors = new FileTree.FsFileTreeAccessors({ prefix: dir, mutable: true });
  return FileTree.DirectoryItem.create(dir, accessors).orThrow();
}

/** Open parameters over a root. */
export function params(
  root: FileTree.FileTreeItem,
  mode: TaskRepositoryMode,
  overrides?: Partial<ITaskRepositoryOpenParams>
): ITaskRepositoryOpenParams {
  return { root, mode, environment: environment().env, registry: registry(), ...overrides };
}

/** Initializes a session repository over a fresh in-memory root. */
export async function sessionRepository(
  profile?: ITaskCapacityProfile
): Promise<{ root: FileTree.IFileTreeDirectoryItem; repository: ITaskRepository }> {
  const root = memoryRoot();
  const repository = (
    await FileTreeTaskRepository.initialize(params(root, 'session', { profile }))
  ).orThrow();
  return { root, repository };
}

/** A tracked envelope for a task at a revision. */
export function envelope(id: string, revision: number, extra?: Partial<ITaskEnvelope>): ITaskEnvelope {
  return {
    schemaVersion: 1,
    id: id as TaskId,
    kind: 'fgv.tracked' as TaskKind,
    detailVersion: 1,
    revision: revision as TaskRevision,
    title: `task ${id}`,
    stopPolicy: 'none',
    scopes: [{ namespace: 'project', key: 'alpha' }],
    lifecycle: { status: 'pending' },
    attention: [],
    recovery: 'not-recoverable',
    observation: { state: 'current', observedAt: at as ITaskEnvelope['createdAt'] },
    createdAt: at as ITaskEnvelope['createdAt'],
    changedAt: at as ITaskEnvelope['createdAt'],
    ...extra
  };
}

/** A catalog operation's stored evidence. */
export function catalogOp(
  operationId: string,
  operation: 'create-tracked' | 'register-external' | 'update-tracked' | 'archive',
  request: JsonValue
): IStoredTaskOperation {
  return {
    type: 'catalog',
    operationId: operationId as OperationId,
    operation,
    request,
    principalKey: 'host',
    receipt: { ok: true }
  };
}

/** An update owed for a task revision and category. */
export function update(env: ITaskEnvelope, category: UpdateCategory, required: boolean = true): ITaskUpdate {
  return {
    id: taskUpdateId(env.id, env.revision, category),
    taskId: env.id,
    revision: env.revision,
    category,
    required,
    snapshot: { envelope: env },
    audience: []
  };
}

/** The canonical creation request fixtures use. */
export function creationRequest(id: string, extra?: Record<string, JsonValue>): JsonValue {
  return { taskId: id, title: `task ${id}`, ...extra };
}

/** A registration of a new tracked task. */
export function registration(
  id: string,
  options?: { operationId?: string; request?: JsonValue; envelope?: Partial<ITaskEnvelope> }
): ITaskRegistrationRequest {
  const operationId: string = options?.operationId ?? `op-create-${id}`;
  const request: JsonValue = options?.request ?? creationRequest(id);
  const env: ITaskEnvelope = envelope(id, 1, options?.envelope);
  const record: IResolvedTaskRecordDraft = {
    recordType: 'resolved',
    task: { envelope: env, details: {} },
    operations: [catalogOp(operationId, 'create-tracked', request)],
    updates: [update(env, 'lifecycle')],
    archived: false
  };
  return { taskId: id as TaskId, operationId: operationId as OperationId, request, record };
}

/** A registration of an unresolved external task. */
export function unresolvedRegistration(id: string, operationId?: string): ITaskRegistrationRequest {
  const opId: string = operationId ?? `op-register-${id}`;
  const request: JsonValue = creationRequest(id, { source: 'acme' });
  const record: IUnresolvedTaskRecordDraft = {
    recordType: 'unresolved',
    reference: {
      id: id as TaskId,
      revision: 1 as TaskRevision,
      kind: vendorKind,
      detailVersion: 1,
      title: `task ${id}`,
      scopes: [{ namespace: 'project', key: 'alpha' }],
      binding: { sourceId: 'acme', referenceVersion: 1, reference: { job: `j-${id}` } },
      reason: 'the source has not been observed yet'
    },
    operations: [catalogOp(opId, 'register-external', request)]
  };
  return { taskId: id as TaskId, operationId: opId as OperationId, request, record };
}

/**
 * The draft of a resolved record's next state: the current record with its envelope
 * replaced, a new operation appended, and new updates added.
 */
export function nextDraft(
  current: ITaskCommitRecord | IResolvedTaskRecordDraft,
  change: {
    envelope?: Partial<ITaskEnvelope>;
    operation?: IStoredTaskOperation;
    updates?: ReadonlyArray<UpdateCategory>;
    dropUpdates?: boolean;
    archived?: boolean;
    sourceRevision?: { epoch: string; token: string };
    details?: JsonValue;
  }
): IResolvedTaskRecordDraft {
  if (current.recordType !== 'resolved') {
    throw new Error('nextDraft: current record is unresolved');
  }
  const env: ITaskEnvelope = { ...current.task.envelope, ...change.envelope };
  const added: ReadonlyArray<ITaskUpdate> = (change.updates ?? []).map((category) => update(env, category));
  return {
    recordType: 'resolved',
    task: { envelope: env, details: change.details ?? current.task.details },
    ...(change.sourceRevision !== undefined
      ? { sourceRevision: change.sourceRevision }
      : current.sourceRevision !== undefined
      ? { sourceRevision: current.sourceRevision }
      : {}),
    operations:
      change.operation !== undefined ? [...current.operations, change.operation] : current.operations,
    updates: change.dropUpdates === true ? [] : [...current.updates, ...added],
    archived: change.archived ?? current.archived
  };
}
