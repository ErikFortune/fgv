/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { DetailedFailure, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import { ICapacityFailure, ITaskFailure, OperationId, TaskFailureCode, TaskId, TaskResult } from '../types';

/**
 * Builds a classified task failure.
 * @internal
 */
export function taskFailure<T>(
  message: string,
  code: TaskFailureCode,
  retry: ITaskFailure['retry'],
  extra?: { readonly operationId?: OperationId; readonly capacity?: ICapacityFailure }
): DetailedFailure<T, ITaskFailure> {
  return failWithDetail<T, ITaskFailure>(message, {
    code,
    retry,
    ...(extra?.operationId !== undefined ? { operationId: extra.operationId } : {}),
    ...(extra?.capacity !== undefined ? { capacity: extra.capacity } : {})
  });
}

/**
 * A successful task result.
 * @internal
 */
export function ok<T>(value: T): TaskResult<T> {
  return succeedWithDetail<T, ITaskFailure>(value);
}

/**
 * Re-raises a task failure under another value type, keeping its classification.
 * @internal
 */
export function propagate<T>(failure: DetailedFailure<unknown, ITaskFailure>): TaskResult<T> {
  return failWithDetail<T, ITaskFailure>(failure.message, failure.detail);
}

/**
 * An unclassified internal failure: something the broker's own code did not expect.
 * @internal
 */
export function propagateFailure<T>(message: string): TaskResult<T> {
  return taskFailure<T>(message, 'invalid', 'after-host-action');
}

/**
 * The one failure for a task that does not exist **or** that this principal may not see.
 * @remarks
 * Same code, same message, whichever it is: a foreign id and a hidden one are indistinguishable.
 * The id is the one the caller supplied.
 * @internal
 */
export function notFound<T>(id: TaskId, operationId?: OperationId): TaskResult<T> {
  return taskFailure<T>(
    `task ${id}: not found or not visible`,
    'not-found-or-denied',
    'after-host-action',
    operationId !== undefined ? { operationId } : undefined
  );
}

/**
 * The failure for a visible task on which this principal may not perform an action.
 * @internal
 */
export function denied<T>(id: TaskId, action: string, operationId?: OperationId): TaskResult<T> {
  return taskFailure<T>(
    `task ${id}: '${action}' is not permitted`,
    'not-found-or-denied',
    'after-host-action',
    operationId !== undefined ? { operationId } : undefined
  );
}

/**
 * The failure for an operation whose authorization no longer describes what it would commit:
 * the policy epoch moved, or a record it was authorized against changed.
 * @internal
 */
export function changedSinceAuthorized<T>(what: string, operationId?: OperationId): TaskResult<T> {
  return taskFailure<T>(
    `${what} changed after the operation was authorized; nothing was committed — retry to re-authorize`,
    'conflict',
    'safe',
    operationId !== undefined ? { operationId } : undefined
  );
}

/**
 * A failed task result's code. A failure that carries no classification — which only an injected
 * component that ignores the contract can produce — has none.
 * @internal
 */
export function codeOf(failure: DetailedFailure<unknown, ITaskFailure>): TaskFailureCode | undefined {
  return failure.detail?.code;
}
