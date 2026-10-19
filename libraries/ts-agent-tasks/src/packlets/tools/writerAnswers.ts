/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { TaskConverters, boundedArrayOf, taskRevision } from '../converters';
import {
  ICommandReceipt,
  IReassignmentResult,
  IResponsibility,
  ITaskMutationResult,
  OperationId,
  TaskId,
  TaskMutationDisposition,
  TaskRevision,
  allUpdateCategories
} from '../types';

/**
 * What a mutation tool asked the writer for, which its answer must describe.
 * @internal
 */
export interface IExpectedReceipt {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  /**
   * The revision the change was asked against; absent for a creation, whose receipt is revision 1,
   * `changed`. A change's receipt is one revision on when `changed` and the same revision when
   * `unchanged` — anything else is not the answer to this request, and its revision would mislead
   * the model's next `expectedRevision`.
   */
  readonly expectedRevision?: TaskRevision;
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
   * asked for — absent for an unassignment. `responsibility` is the tool's own copy, never the object
   * handed to the writer.
   */
  reassignment(
    expected: IExpectedReceipt & { readonly responsibility: IResponsibility | 'unassigned' }
  ): Converter<IReassignmentResult>;
  /**
   * A command's receipt, for exactly this task, operation and command. An `applied` receipt's
   * revision may not precede the one the command was asked against: a command that took effect did so
   * on that revision or — once the task's source had moved it on — a later one.
   */
  command(expected: IExpectedCommandReceipt): Converter<ICommandReceipt>;
}

/**
 * What a command tool asked the writer for, which its receipt must describe.
 * @internal
 */
export interface IExpectedCommandReceipt {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly command: string;
  readonly expectedRevision: TaskRevision;
}

/** Whether two optional responsible parties are the same party. */
function _sameParty(a: IResponsibility | undefined, b: IResponsibility | undefined): boolean {
  return a === undefined || b === undefined ? a === b : a.namespace === b.namespace && a.key === b.key;
}

/**
 * A constraint: the receipt is for the task and operation asked about, at the revision that request
 * could have produced.
 */
function _identified<T extends ITaskMutationResult>(expected: IExpectedReceipt): (value: T) => Result<T> {
  return (value: T): Result<T> => {
    if (value.taskId !== expected.taskId || value.operationId !== expected.operationId) {
      return fail(`the receipt is for ${value.taskId} / ${value.operationId}, not the operation asked for`);
    }
    const revision: number =
      expected.expectedRevision === undefined
        ? 1
        : expected.expectedRevision + (value.disposition === 'changed' ? 1 : 0);
    const disposition: boolean = expected.expectedRevision !== undefined || value.disposition === 'changed';
    return value.revision === revision && disposition
      ? succeed(value)
      : fail(`a ${value.disposition} receipt at revision ${value.revision} does not answer this request`);
  };
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
        ),
    command: (expected) =>
      converters.commands.receipt.withConstraint((value: ICommandReceipt): Result<ICommandReceipt> => {
        if (
          value.taskId !== expected.taskId ||
          value.operationId !== expected.operationId ||
          value.command !== expected.command
        ) {
          return fail(
            `the receipt is for ${value.taskId} / ${value.operationId} / ${value.command}, not the command asked for`
          );
        }
        return value.result.state === 'applied' && value.result.appliedRevision < expected.expectedRevision
          ? fail(
              `an applied receipt at revision ${value.result.appliedRevision} precedes the revision ` +
                `${expected.expectedRevision} it was asked against`
            )
          : succeed(value);
      })
  };
}
