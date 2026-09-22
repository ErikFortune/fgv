/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
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
  return failWithDetail<T, ITaskFailure>(failure.message, failure.detail);
}

/**
 * The retry disposition of a failed atomic write that is not also a fence: safe only on positive
 * evidence that nothing became visible. A store that did not classify its failure gave none.
 * @internal
 */
export function writeRetry(failure: FileTree.IAtomicWriteFailure | undefined): ITaskFailure['retry'] {
  return failure?.visibility === 'unchanged' ? 'safe' : 'reconcile-first';
}
