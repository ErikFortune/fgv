/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { TaskConverters, boundedArrayOf, taskRevision } from '../converters';
import {
  IReassignmentResult,
  IResponsibility,
  ITaskMutationResult,
  OperationId,
  TaskId,
  TaskMutationDisposition,
  allUpdateCategories
} from '../types';

/**
 * What a mutation tool asked the writer for, which its answer must describe.
 * @internal
 */
export interface IExpectedReceipt {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
}

/**
 * Converters for what a writer answers, applied before the tools read any of it.
 *
 * @remarks
 * A writer is any `IBoundTaskWriter`, so its receipt is converted, not trusted — the same treatment
 * a view's answer gets (`IViewAnswerConverters`). Every field is strictly converted, `updateIds` is
 * bounded by the one update per category a commit can owe, and the receipt must be for the task and
 * the operation the tool asked about: a receipt describing any other is refused whole.
 * @internal
 */
export interface IWriterAnswerConverters {
  /** A creation's or an update's receipt, for exactly this task and operation. */
  mutation(expected: IExpectedReceipt): Converter<ITaskMutationResult>;
  /**
   * A reassignment's receipt, for exactly this task and operation, whose current party is the one
   * asked for — absent for an unassignment.
   */
  reassignment(
    expected: IExpectedReceipt & { readonly responsibility: IResponsibility | 'unassigned' }
  ): Converter<IReassignmentResult>;
}

/** Whether two optional responsible parties are the same party. */
function _sameParty(a: IResponsibility | undefined, b: IResponsibility | undefined): boolean {
  return a === undefined || b === undefined ? a === b : a.namespace === b.namespace && a.key === b.key;
}

/** A constraint: the receipt is for the task and operation asked about. */
function _identified<T extends ITaskMutationResult>(expected: IExpectedReceipt): (value: T) => Result<T> {
  return (value: T): Result<T> =>
    value.taskId !== expected.taskId || value.operationId !== expected.operationId
      ? fail(`the receipt is for ${value.taskId} / ${value.operationId}, not the operation asked for`)
      : succeed(value);
}

/**
 * Builds the {@link IWriterAnswerConverters} over a renderer's converters.
 * @internal
 */
export function buildWriterAnswerConverters(converters: TaskConverters): IWriterAnswerConverters {
  const fields = {
    taskId: converters.ids.taskId,
    revision: taskRevision,
    operationId: converters.ids.operationId,
    disposition: Converters.enumeratedValue<TaskMutationDisposition>(['changed', 'unchanged']),
    updateIds: boundedArrayOf(converters.ids.updateId, allUpdateCategories.length, 'update ids')
  };

  return {
    mutation: (expected) =>
      Converters.strictObject<ITaskMutationResult>(fields).withConstraint(_identified(expected)),
    reassignment: (expected) =>
      Converters.strictObject<IReassignmentResult>({
        ...fields,
        previous: converters.values.responsibility.optional(),
        current: converters.values.responsibility.optional()
      })
        .withConstraint(_identified(expected))
        .withConstraint(
          (value: IReassignmentResult): Result<IReassignmentResult> =>
            _sameParty(
              value.current,
              expected.responsibility === 'unassigned' ? undefined : expected.responsibility
            )
              ? succeed(value)
              : fail('the receipt names a responsible party other than the one asked for')
        )
  };
}
