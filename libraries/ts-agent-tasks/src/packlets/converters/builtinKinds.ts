/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonSchema, JsonValue } from '@fgv/ts-json-base';
import { Converter, Converters, Result, succeed } from '@fgv/ts-utils';
import {
  ITaskKindDescriptor,
  ITaskListDetails,
  TaskListCompletion,
  TrackedTaskDetails,
  taskListDetailVersion,
  taskListKind,
  trackedTaskDetailVersion,
  trackedTaskKind
} from '../types';

/**
 * Converter for `fgv.tracked@1` details — an empty strict object, so any property at
 * all is a conversion failure.
 * @public
 */
export const trackedTaskDetails: Converter<TrackedTaskDetails> = Converters.strictObject<TrackedTaskDetails>(
  {}
);

/**
 * Wire schema for `fgv.tracked@1` details.
 * @public
 */
export const trackedTaskDetailSchema: JsonSchema.ISchemaValidator<TrackedTaskDetails> = JsonSchema.object(
  {},
  { description: 'fgv.tracked@1 details' }
);

/**
 * Converter for `fgv.task-list@1` details.
 * @public
 */
export const taskListDetails: Converter<ITaskListDetails> = Converters.strictObject<ITaskListDetails>({
  completion: Converters.enumeratedValue<TaskListCompletion>(['manual', 'all-children-succeeded'])
});

/**
 * Wire schema for `fgv.task-list@1` details.
 * @public
 */
export const taskListDetailSchema: JsonSchema.ISchemaValidator<ITaskListDetails> = JsonSchema.object(
  {
    completion: JsonSchema.enumOf<TaskListCompletion>(['manual', 'all-children-succeeded'], {
      description: 'how the list reaches succeeded'
    })
  },
  { description: 'fgv.task-list@1 details' }
);

/**
 * The registration descriptor for `fgv.tracked@1`.
 *
 * @remarks
 * It registers **no commands**. `fgv.tracked@1`'s eleven command *names* are vocabulary
 * this slice owns ({@link trackedTaskCommandNames}); their parameter schemas belong to
 * the slice that implements the transitions they name, and an empty command registry is
 * explicitly supported.
 * @public
 */
export function trackedTaskDescriptor(): ITaskKindDescriptor<TrackedTaskDetails> {
  return {
    kind: trackedTaskKind,
    detailVersion: trackedTaskDetailVersion,
    details: trackedTaskDetails,
    detailSchema: trackedTaskDetailSchema,
    encode: (): Result<JsonValue> => succeed({})
  };
}

/**
 * The registration descriptor for `fgv.task-list@1`.
 * @public
 */
export function taskListDescriptor(): ITaskKindDescriptor<ITaskListDetails> {
  return {
    kind: taskListKind,
    detailVersion: taskListDetailVersion,
    details: taskListDetails,
    detailSchema: taskListDetailSchema,
    encode: (value: ITaskListDetails): Result<JsonValue> => succeed({ completion: value.completion })
  };
}
