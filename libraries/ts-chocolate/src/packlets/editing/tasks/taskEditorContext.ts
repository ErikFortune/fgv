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
 * Task editor context implementation
 * @packageDocumentation
 */

import { Result, Success } from '@fgv/ts-utils';
import { ValidatingEditorContext } from '../validatingEditorContext';
import { EditableCollection } from '../editableCollection';
import { Tasks, Converters as EntityConverters } from '../../entities';
import { BaseTaskId, Converters as CommonConverters, TaskId } from '../../common';
import { validateRawTaskEntity } from './validators';

type IRawTaskEntity = Tasks.IRawTaskEntity;

// ============================================================================
// Task Editor Context
// ============================================================================

/**
 * Editor context specialized for raw task entities.
 * Extends ValidatingEditorContext to provide both pre-validated (base)
 * and raw input (validating) methods for task CRUD operations.
 * @public
 */
export class TaskEditorContext extends ValidatingEditorContext<IRawTaskEntity, BaseTaskId, TaskId> {
  /**
   * Create a task editor context from a collection.
   * @param collection - Mutable collection of tasks
   * @returns Result containing the editor context or failure
   * @public
   */
  public static createFromCollection(
    collection: EditableCollection<IRawTaskEntity, BaseTaskId>
  ): Result<TaskEditorContext> {
    return ValidatingEditorContext.createValidating<IRawTaskEntity, BaseTaskId, TaskId>({
      collection,
      entityConverter: EntityConverters.Tasks.rawTaskEntity,
      keyConverter: CommonConverters.baseTaskId,
      semanticValidator: validateRawTaskEntity,
      createId: CommonConverters.taskId,
      /* c8 ignore next 1 - getBaseId reserved for future use by EditorContext but not yet called */
      getBaseId: (task: IRawTaskEntity) => task.baseId,
      getName: (task: IRawTaskEntity) => task.name
    }).onSuccess((baseContext) => {
      return Success.with(
        Object.setPrototypeOf(baseContext, TaskEditorContext.prototype) as TaskEditorContext
      );
    });
  }

  /**
   * Get the task display name for display purposes.
   * @param task - Task to get display name from
   * @returns Display name (the task name)
   * @public
   */
  public getTaskDisplayName(task: IRawTaskEntity): string {
    return task.name;
  }
}
