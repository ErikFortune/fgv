/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  ConsumerId,
  FileTreeTaskRepository,
  IAcknowledgementResult,
  IBoundTaskDelivery,
  ISubscribeRequest,
  ITaskRepository,
  ITaskSubscription,
  OperationId,
  SubscriptionId,
  TaskBroker,
  TaskId,
  TaskResult
} from '../../index';
import { TestPolicy, alpha, brokerRegistry } from './brokerFixtures';
import { environment, nodeRootAt } from './storageFixtures';

/**
 * The subscription-activation and acknowledgement crash scenarios, shared by the parent test and
 * the child process it kills.
 *
 * @remarks
 * Compiled with the tests and required by the child from `lib/`, so the parent's retry is the same
 * request the killed child made. The default checkpoint store is used throughout, so every write is
 * a real atomic write through the Node `FileTree`.
 */

/** The subscription the child registers: the current state of `alpha`, as a baseline. */
export const subscribeRequest: ISubscribeRequest = {
  subscriptionId: 's' as SubscriptionId,
  operationId: 'subscribe-s' as OperationId,
  consumerId: 'consumer-s' as ConsumerId,
  selection: { scopes: [alpha], lifecycleClass: 'all' },
  start: 'current',
  policy: {}
};

/** An open durable repository with a broker over it. */
export interface IOpenedDelivery {
  readonly repository: ITaskRepository;
  readonly broker: TaskBroker;
  readonly policy: TestPolicy;
}

/** Opens the durable repository in a directory, with a broker over it. */
export async function openDelivery(dir: string, idPrefix: string): Promise<Result<IOpenedDelivery>> {
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
  const broker = TaskBroker.create({ repository, environment: env }).orThrow();
  return succeed({ repository, broker, policy: new TestPolicy() });
}

/** Subscribes as `host`. */
export async function runSubscribe(opened: IOpenedDelivery): Promise<TaskResult<ITaskSubscription>> {
  return opened.broker.subscribe(
    { principal: 'host', scopes: [alpha], authorization: opened.policy },
    subscribeRequest
  );
}

/** `host`'s delivery of the subscription. */
export function deliveryIn(opened: IOpenedDelivery): IBoundTaskDelivery {
  return opened.broker
    .bindDelivery({
      principal: 'host',
      scopes: [alpha],
      authorization: opened.policy,
      subscriptionId: subscribeRequest.subscriptionId,
      consumerId: subscribeRequest.consumerId
    })
    .orThrow();
}

/** Acknowledges a receipt through `host`'s delivery. */
export async function runAcknowledge(
  opened: IOpenedDelivery,
  receipt: unknown
): Promise<TaskResult<IAcknowledgementResult>> {
  return deliveryIn(opened).acknowledge(receipt);
}

/**
 * A durable repository in an empty directory holding one tracked task `t` in `alpha`; with
 * `subscribe`, also the subscription, and a prepared, unacknowledged receipt for its baseline,
 * which is returned.
 */
export async function prepareDelivery(dir: string, subscribe: boolean): Promise<Result<unknown>> {
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
  const broker = TaskBroker.create({ repository, environment: env }).orThrow();
  const opened: IOpenedDelivery = { repository, broker, policy: new TestPolicy() };
  const writer = broker.bind({ principal: 'host', scopes: [alpha], authorization: opened.policy }).orThrow();
  const outcome: Result<unknown> = (
    await writer.createTracked({ taskId: 't' as TaskId, operationId: 'create-t' as OperationId, title: 't' })
  ).asResult.onSuccess(() => succeed(undefined));
  if (outcome.isFailure() || !subscribe) {
    repository.close();
    return outcome;
  }
  const subscribed = await runSubscribe(opened);
  if (subscribed.isFailure()) {
    repository.close();
    return fail(subscribed.message);
  }
  const prepared = await deliveryIn(opened).prepare();
  repository.close();
  return prepared.isSuccess() ? succeed(prepared.value.context.receipt) : fail(prepared.message);
}
