/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { DetailedFailure, Result, failWithDetail, succeedWithDetail } from '@fgv/ts-utils';
import { ICapacityFailure, ITaskFailure, OperationId, TaskFailureCode, TaskResult } from '../types';

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
  const detail: ITaskFailure = {
    code,
    retry,
    ...(extra?.operationId !== undefined ? { operationId: extra.operationId } : {}),
    ...(extra?.capacity !== undefined ? { capacity: extra.capacity } : {})
  };
  return failWithDetail<T, ITaskFailure>(message, detail);
}

/**
 * Classifies a plain `Result` failure, leaving a success untouched.
 * @internal
 */
export function classify<T>(
  result: Result<T>,
  code: TaskFailureCode,
  retry: ITaskFailure['retry']
): TaskResult<T> {
  return result.withFailureDetail<ITaskFailure>({ code, retry });
}

/**
 * A successful {@link TaskResult}.
 * @internal
 */
export function ok<T>(value: T): TaskResult<T> {
  return succeedWithDetail<T, ITaskFailure>(value);
}

/**
 * Re-raises a task failure as a failure of another type, keeping its classification.
 * @internal
 */
export function propagate<T>(failure: DetailedFailure<unknown, ITaskFailure>): TaskResult<T> {
  return taskFailure<T>(
    failure.message,
    failure.detail?.code ?? 'storage-unavailable',
    failure.detail?.retry ?? 'after-host-action',
    { operationId: failure.detail?.operationId, capacity: failure.detail?.capacity }
  );
}
