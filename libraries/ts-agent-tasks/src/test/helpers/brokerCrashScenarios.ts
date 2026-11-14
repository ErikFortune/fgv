/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  FileTreeTaskRepository,
  IBoundTaskWriter,
  ICommandReceipt,
  ICommandRequest,
  ITaskRepository,
  OperationId,
  TaskBroker,
  TaskId,
  TaskResult,
  TaskRevision
} from '../../index';
import { TestPolicy, alpha, brokerRegistry } from './brokerFixtures';
import { environment, nodeRootAt } from './storageFixtures';

/**
 * The list-completion crash scenario, shared by the parent test and the child process it kills.
 *
 * @remarks
 * Compiled with the tests and required by the child from `lib/`, so the parent's retry is the
 * same request the killed child made.
 */

/** The command the child runs: the last child's success. */
export const lastChildSuccess: ICommandRequest = {
  taskId: 'b' as TaskId,
  operationId: 'succeed-b' as OperationId,
  expectedRevision: 1 as TaskRevision,
  command: 'succeed',
  parameters: { outcome: { summary: 'b done', artifacts: [] } }
};

/** Opens the durable repository in a directory, and binds a writer over it. */
export async function openBroker(
  dir: string,
  idPrefix: string
): Promise<Result<{ repository: ITaskRepository; writer: IBoundTaskWriter }>> {
  const env = environment(idPrefix).env;
  const opened = await FileTreeTaskRepository.open({
    root: nodeRootAt(dir),
    mode: { durable: 'process-crash' },
    environment: env,
    registry: brokerRegistry()
  });
  if (opened.isFailure()) {
    return fail(opened.message);
  }
  if (opened.value.state !== 'ready') {
    return fail(`recovery required: ${JSON.stringify(opened.value.recovery.report.issues)}`);
  }
  const repository = opened.value.repository;
  const writer = TaskBroker.create({ repository, environment: env })
    .onSuccess((broker) =>
      broker.bind({ principal: 'host', scopes: [alpha], authorization: new TestPolicy() })
    )
    .orThrow();
  return succeed({ repository, writer });
}

/** A list `l` with children `a` (succeeded) and `b` (pending), durable, in an empty directory. */
export async function prepareList(dir: string): Promise<Result<true>> {
  const env = environment('prepare').env;
  const created = await FileTreeTaskRepository.initialize({
    root: nodeRootAt(dir),
    mode: { durable: 'process-crash' },
    environment: env,
    registry: brokerRegistry()
  });
  if (created.isFailure()) {
    return fail(created.message);
  }
  const repository = created.value;
  const writer = TaskBroker.create({ repository, environment: env })
    .onSuccess((broker) =>
      broker.bind({ principal: 'host', scopes: [alpha], authorization: new TestPolicy() })
    )
    .orThrow();
  const steps: Array<() => Promise<TaskResult<unknown>>> = [
    () =>
      writer.createTaskList({
        taskId: 'l' as TaskId,
        operationId: 'create-l' as OperationId,
        title: 'l',
        completion: 'all-children-succeeded'
      }),
    () =>
      writer.createTracked({
        taskId: 'a' as TaskId,
        operationId: 'create-a' as OperationId,
        title: 'a',
        parentId: 'l' as TaskId
      }),
    () =>
      writer.createTracked({
        taskId: 'b' as TaskId,
        operationId: 'create-b' as OperationId,
        title: 'b',
        parentId: 'l' as TaskId
      }),
    () =>
      writer.execute({
        taskId: 'a' as TaskId,
        operationId: 'succeed-a' as OperationId,
        expectedRevision: 1 as TaskRevision,
        command: 'succeed',
        parameters: { outcome: { summary: 'a done', artifacts: [] } }
      })
  ];
  for (const step of steps) {
    const done = await step();
    if (done.isFailure()) {
      repository.close();
      return fail(done.message);
    }
  }
  repository.close();
  return succeed(true);
}

/** Runs the last child's success. */
export async function runLastChildSuccess(writer: IBoundTaskWriter): Promise<TaskResult<ICommandReceipt>> {
  return writer.execute(lastChildSuccess);
}
