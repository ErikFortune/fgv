/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IBoundTaskWriter,
  ITaskRepositoryWriter,
  ITaskSource,
  TaskBroker,
  TaskEnvironment,
  IResolvedTaskCommitRecord,
  ISourceBinding,
  ISourceCapabilities,
  IStopIntent,
  IStopResult,
  ITaskRepository,
  OperationId,
  ParentStopPolicy,
  StopMode,
  TaskResult
} from '../../index';
import { TestPolicy, alpha, op, revisionOf, tid } from './brokerFixtures';
import { bindAll } from './deliveryFixtures';

/** A source's stop declaration, scriptable per test: a value, or a failure, or a throw. */
export class CapabilityScript {
  public declaration: ISourceCapabilities | 'fail' | 'throw' | unknown = stableCapabilities();
  public calls: number = 0;

  public readonly ask = async (__binding: ISourceBinding): Promise<Result<ISourceCapabilities>> => {
    this.calls++;
    if (this.declaration === 'fail') {
      return fail('the capability endpoint is down');
    }
    if (this.declaration === 'throw') {
      throw new Error('the capability endpoint threw');
    }
    // A host-supplied value, returned as the source declared it: the broker validates it.
    return succeed(this.declaration as ISourceCapabilities);
  };
}

/** A declaration of a stable pause and an absorbing cancel, with the simulated executor's commands. */
export function stableCapabilities(contractVersion: string = 'v1'): ISourceCapabilities {
  return {
    contractVersion,
    pause: 'stable-until-explicit-resume',
    cancel: 'terminal-absorbing',
    pauseCommand: { command: 'pause', parameters: { reason: 'cascade stop' } },
    cancelCommand: { command: 'cancel', parameters: { reason: 'cascade stop' } }
  };
}

/** Creates a tracked task (or list) with a stop policy, under a parent. */
export async function node(
  writer: IBoundTaskWriter,
  id: string,
  options?: {
    readonly parentId?: string;
    readonly stopPolicy?: ParentStopPolicy;
    readonly list?: boolean;
  }
): Promise<void> {
  const base = {
    taskId: tid(id),
    operationId: op(`create-${id}`),
    title: `node ${id}`,
    ...(options?.parentId !== undefined ? { parentId: tid(options.parentId) } : {}),
    ...(options?.stopPolicy !== undefined ? { stopPolicy: options.stopPolicy } : {})
  };
  (options?.list === true
    ? await writer.createTaskList({ ...base, completion: 'manual' })
    : await writer.createTracked(base)
  ).orThrow();
}

/** Requests a stop at the root's current revision. */
export async function stop(
  h: { readonly repository: ITaskRepository },
  writer: IBoundTaskWriter,
  rootId: string,
  mode: StopMode,
  operationId?: OperationId
): Promise<TaskResult<IStopResult>> {
  return writer.requestStop({
    taskId: tid(rootId),
    expectedRevision: await revisionOf(h.repository, rootId),
    operationId: operationId ?? op(`stop-${rootId}`),
    mode
  });
}

/** Runs the pump once. */
export async function pump(
  writer: IBoundTaskWriter,
  result: IStopResult,
  limit?: number
): Promise<TaskResult<IStopResult>> {
  return writer.reconcileStop({
    taskId: result.rootId,
    intentId: result.intentId,
    ...(limit !== undefined ? { limit } : {})
  });
}

/** Releases a stop at the root's current revision. */
export async function release(
  h: { readonly repository: ITaskRepository },
  writer: IBoundTaskWriter,
  result: IStopResult,
  operationId?: OperationId
): Promise<TaskResult<IStopResult>> {
  return writer.releaseStop({
    taskId: result.rootId,
    expectedRevision: await revisionOf(h.repository, result.rootId),
    operationId: operationId ?? op(`release-${result.rootId}`),
    intentId: result.intentId
  });
}

/** The persisted intent, read through the trusted repository API. */
export async function persisted(
  h: { readonly repository: ITaskRepository },
  result: IStopResult
): Promise<IStopIntent> {
  const record = (await h.repository.readCommit(result.rootId)).orThrow() as IResolvedTaskCommitRecord;
  return record.stops!.find((intent) => intent.id === result.intentId)!;
}

/** The lifecycle status of a task. */
export async function statusOf(h: { readonly repository: ITaskRepository }, id: string): Promise<string> {
  const record = (await h.repository.readCommit(tid(id))).orThrow()!;
  return record.recordType === 'resolved' ? record.task.envelope.lifecycle.status : 'unresolved';
}

/** The state each visible target is presented in, by task id. */
export function states(result: IStopResult): Record<string, string> {
  const out: Record<string, string> = {};
  for (const target of result.targets) {
    out[target.taskId] = target.state;
  }
  return out;
}

/**
 * A writer over the same records through a repository that misbehaves: `patch` replaces repository
 * methods, `writerPatch` replaces methods of the writer a gated section receives, and `environment`
 * replaces the broker's environment. Everything else delegates.
 */
export function faultyWriter(
  h: {
    readonly repository: ITaskRepository;
    readonly env: TaskEnvironment;
    readonly policy: TestPolicy;
    readonly source?: ITaskSource;
  },
  faults: {
    readonly patch?: (r: ITaskRepository) => Partial<ITaskRepository>;
    readonly writerPatch?: (w: ITaskRepositoryWriter) => Partial<ITaskRepositoryWriter>;
    readonly environment?: TaskEnvironment;
  }
): IBoundTaskWriter {
  const real: ITaskRepository = h.repository;
  const writerPatch = faults.writerPatch;
  const repository: ITaskRepository = Object.assign(Object.create(real), {
    withWriter: <T>(action: (w: ITaskRepositoryWriter) => Promise<TaskResult<T>>) =>
      real.withWriter((w) => action(writerPatch !== undefined ? { ...bindAll(w), ...writerPatch(w) } : w)),
    ...(faults.patch !== undefined ? faults.patch(real) : {})
  });
  const broker: TaskBroker = TaskBroker.create({
    repository,
    environment: faults.environment ?? h.env,
    ...(h.source !== undefined ? { sources: [h.source] } : {})
  }).orThrow();
  return broker.bind({ principal: 'alice', scopes: [alpha], authorization: h.policy }).orThrow();
}
