/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  ITaskCapacityProfile,
  IResolvedTaskRecordDraft,
  ITaskCommitRecord,
  ITaskCommitRequest,
  ITaskEnvelope,
  ITaskRepository,
  OperationId,
  TaskId,
  TaskResult,
  TaskRevision,
  defaultTaskCapacityProfile
} from '../../index';
import {
  catalogOp,
  environment,
  nextDraft,
  nodeRootAt,
  params,
  registration,
  unresolvedRegistration,
  update
} from './storageFixtures';

/**
 * The operations the crash matrix interrupts. Each is one call on the writer, run by a child
 * process that kills itself mid-protocol; the parent runs the same scenario again as the retry.
 *
 * Compiled with the tests and required by the child from `lib/`, so the parent and the child
 * build byte-identical requests: a retry that differed from the interrupted call would not be a
 * retry, and the replay assertions would be measuring something else.
 */
export type CrashScenario = 'register' | 'start' | 'finish' | 'resolve' | 'raise';

/** The profile the `raise` scenario raises to. */
export const raisedProfile: ITaskCapacityProfile = {
  ...defaultTaskCapacityProfile,
  limits: { ...defaultTaskCapacityProfile.limits, 'retained-tasks': 20000 }
};

const rev = (n: number): TaskRevision => n as TaskRevision;

/**
 * The record t1 is registered with. Mutations are built from this, never from what is on disk
 * at retry time: a retry is the *same* request the interrupted call made, and a request rebuilt
 * from the post-commit record would be a different one.
 */
function registered(): IResolvedTaskRecordDraft {
  const record = registration('t1').record;
  if (record.recordType !== 'resolved') {
    throw new Error('expected a resolved registration');
  }
  return record;
}

/** The terminal commit for t1: state, result obligation and operation in one record. */
function finish(current: IResolvedTaskRecordDraft): ITaskCommitRequest {
  return {
    purpose: 'operation',
    operationId: 'op-finish' as OperationId,
    taskId: 't1' as TaskId,
    expectedRevision: rev(1),
    expectedRecordRevision: 1,
    record: nextDraft(current, {
      envelope: {
        revision: rev(2),
        lifecycle: { status: 'succeeded', outcome: { summary: 'done', artifacts: [] } }
      },
      operation: catalogOp('op-finish', 'update-tracked', { finish: true }),
      updates: ['lifecycle', 'result']
    })
  };
}

/** Sets up what a scenario needs to exist before the interrupted call. */
export async function prepareScenario(dir: string, scenario: CrashScenario): Promise<Result<true>> {
  const root = nodeRootAt(dir);
  const created = await FileTreeTaskRepository.initialize(params(root, { durable: 'process-crash' }));
  if (created.isFailure()) {
    return fail(created.message);
  }
  const repository = created.value;
  let prepared: Result<unknown> = succeed(true);
  if (scenario === 'start' || scenario === 'finish') {
    prepared = await repository.withWriter((w) => w.register(registration('t1')));
  } else if (scenario === 'resolve') {
    prepared = await repository.withWriter((w) => w.register(unresolvedRegistration('u1')));
  }
  repository.close();
  return prepared.isSuccess() ? succeed(true) : fail(prepared.message);
}

/** Opens the durable repository in a directory. */
export async function openDurable(dir: string, idPrefix: string): Promise<Result<ITaskRepository>> {
  const opened = await FileTreeTaskRepository.open(
    params(nodeRootAt(dir), { durable: 'process-crash' }, { environment: environment(idPrefix).env })
  );
  if (opened.isFailure()) {
    return fail(opened.message);
  }
  return opened.value.state === 'ready'
    ? succeed(opened.value.repository)
    : fail(`recovery required: ${JSON.stringify(opened.value.recovery.report.issues)}`);
}

/** Runs one scenario's single writer call. */
export async function runScenario(
  repository: ITaskRepository,
  scenario: CrashScenario
): Promise<TaskResult<unknown>> {
  return repository.withWriter(async (w): Promise<TaskResult<unknown>> => {
    switch (scenario) {
      case 'register':
        return w.register(registration('t1'));
      case 'start': {
        const current = registered();
        return w.commit({
          purpose: 'operation',
          operationId: 'op-start' as OperationId,
          taskId: 't1' as TaskId,
          expectedRevision: rev(1),
          expectedRecordRevision: 1,
          record: nextDraft(current, {
            envelope: { revision: rev(2), lifecycle: { status: 'running' } },
            operation: catalogOp('op-start', 'update-tracked', { start: true }),
            updates: ['lifecycle']
          })
        });
      }
      case 'finish':
        return w.commit(finish(registered()));
      case 'resolve': {
        const current = (await w.readCommit('u1' as TaskId)).orThrow()!;
        return w.commit(resolution(current, 'u1'));
      }
      case 'raise':
        return w.raiseCapacityLimits(raisedProfile);
    }
  });
}

function resolution(current: ITaskCommitRecord, id: string): ITaskCommitRequest {
  const base = current.recordType === 'unresolved' ? current.reference : undefined;
  const envelope: ITaskEnvelope = {
    schemaVersion: 1,
    id: id as TaskId,
    kind: 'acme.job' as ITaskEnvelope['kind'],
    detailVersion: 1,
    revision: rev(2),
    title: `task ${id}`,
    stopPolicy: 'none',
    scopes: [{ namespace: 'project', key: 'alpha' }],
    lifecycle: { status: 'running' },
    attention: [],
    binding: { sourceId: 'acme', referenceVersion: 1, reference: { job: `j-${id}` } },
    recovery: 'reattach',
    observation: { state: 'current', observedAt: '2026-09-22T12:05:00.000Z' as ITaskEnvelope['createdAt'] },
    createdAt: '2026-09-22T12:00:00.000Z' as ITaskEnvelope['createdAt'],
    changedAt: '2026-09-22T12:05:00.000Z' as ITaskEnvelope['createdAt']
  };
  return {
    purpose: 'observation',
    taskId: id as TaskId,
    expectedRevision: base?.revision ?? rev(1),
    expectedRecordRevision: 1,
    record: {
      recordType: 'resolved',
      task: { envelope, details: { job: `j-${id}` } },
      sourceRevision: { epoch: 'e1', token: '1' },
      operations: current.operations,
      updates: [update(envelope, 'lifecycle'), update(envelope, 'observation')],
      archived: false
    }
  };
}
