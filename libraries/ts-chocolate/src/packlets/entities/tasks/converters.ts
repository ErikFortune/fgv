// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Converters for task types
 * @packageDocumentation
 */

import { Converter, Converters, succeed } from '@fgv/ts-utils';
import { Converters as CommonConverters } from '../../common';
import {
  IInlineTask,
  IRenderOptions,
  ITaskData,
  ITaskInvocation,
  ITaskRef,
  TaskRefStatus,
  ValidationBehavior
} from './model';

// ============================================================================
// Helper Converters
// ============================================================================

/**
 * Identity converter for unknown values - passes through any value.
 * @internal
 */
const unknownValue: Converter<unknown> = Converters.generic<unknown>((from: unknown) => succeed(from));

/**
 * Converter for params objects (Record with string keys and unknown values).
 * Uses Converters.recordOf for proper type-safe validation instead of manual checks.
 * @internal
 */
const params: Converter<Record<string, unknown>> = Converters.recordOf<unknown>(unknownValue);

// ============================================================================
// Task Data Converters
// ============================================================================

/**
 * Converter for ITaskData (persisted format from YAML/JSON).
 * Does not include requiredVariables as those are extracted from the template at runtime.
 * @public
 */
export const taskData: Converter<ITaskData> = Converters.object<ITaskData>({
  baseId: CommonConverters.baseTaskId,
  name: Converters.string,
  template: Converters.string,
  defaultActiveTime: CommonConverters.minutes.optional(),
  defaultWaitTime: CommonConverters.minutes.optional(),
  defaultHoldTime: CommonConverters.minutes.optional(),
  defaultTemperature: CommonConverters.celsius.optional(),
  notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
  tags: Converters.arrayOf(Converters.string).optional(),
  defaults: params.optional()
});

// ============================================================================
// Task Reference Converters
// ============================================================================

/**
 * Converter for ITaskRef (reference to a public task)
 * @public
 */
export const taskRef: Converter<ITaskRef> = Converters.object<ITaskRef>({
  taskId: CommonConverters.taskId,
  params: params
});

/**
 * Converter for TaskRefStatus
 * @public
 */
export const taskRefStatus: Converter<TaskRefStatus> = Converters.enumeratedValue<TaskRefStatus>([
  'valid',
  'task-not-found',
  'missing-variables',
  'invalid-params'
]);

// ============================================================================
// Inline Task Converters
// ============================================================================

/**
 * Converter for IInlineTask (embedded task with full ITaskData definition).
 * @public
 */
export const inlineTask: Converter<IInlineTask> = Converters.object<IInlineTask>({
  task: taskData,
  params: params
});

// ============================================================================
// Task Invocation Union Converter
// ============================================================================

/**
 * Converter for ITaskInvocation (union of IInlineTask or ITaskRef).
 * Discriminates by the presence of `task` (inline) vs `taskId` (ref).
 * @public
 */
export const taskInvocation: Converter<ITaskInvocation> = Converters.oneOf<ITaskInvocation>([
  inlineTask,
  taskRef
]).withFormattedError(() => 'Task invocation must have either task (inline) or taskId (ref).');

// ============================================================================
// Render Options Converters
// ============================================================================

/**
 * Converter for ValidationBehavior
 * @public
 */
export const validationBehavior: Converter<ValidationBehavior> =
  Converters.enumeratedValue<ValidationBehavior>(['ignore', 'warn', 'fail']);

/**
 * Converter for IRenderOptions
 * @public
 */
export const renderOptions: Converter<IRenderOptions> = Converters.object<IRenderOptions>({
  onInvalidTaskRef: validationBehavior.optional(),
  onMissingVariables: validationBehavior.optional(),
  additionalContext: params.optional()
});
