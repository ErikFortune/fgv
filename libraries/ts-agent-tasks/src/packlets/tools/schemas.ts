/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonSchema } from '@fgv/ts-json-base';
import { TaskLifecycleClass, TaskLifecycleStatus, allTaskLifecycleClasses, allTaskStatuses } from '../types';

/**
 * The arguments `task_query` accepts: narrowing filters and paging, nothing else.
 * @remarks
 * There is no principal, scope or consumer member, and the schema is closed: a call carrying any
 * other property fails. Which tasks a query may see is the bound view's, never the caller's.
 * @internal
 */
export interface ITaskQueryToolArgs {
  readonly responsibility?: { readonly namespace: string; readonly key: string };
  readonly parentId?: string;
  readonly lifecycleClass?: TaskLifecycleClass;
  readonly statuses?: ReadonlyArray<TaskLifecycleStatus>;
  readonly limit?: number;
  readonly cursor?: string;
}

/**
 * The arguments `task_inspect` accepts: one task id, and nothing else.
 * @internal
 */
export interface ITaskInspectToolArgs {
  readonly taskId: string;
}

/**
 * The `task_query` parameter schema — the wire schema and the validator `execute` re-runs.
 * @param maxItems - The largest page the tool will ask for, stated in the `limit` description.
 * @internal
 */
export function taskQuerySchema(maxItems: number): JsonSchema.ISchemaValidator<ITaskQueryToolArgs> {
  return JsonSchema.object({
    responsibility: JsonSchema.optional(
      JsonSchema.object(
        {
          namespace: JsonSchema.string({ description: 'The responsible party namespace, e.g. "agent".' }),
          key: JsonSchema.string({ description: 'The responsible party key within its namespace.' })
        },
        { description: 'Only tasks assigned to this responsible party.' }
      )
    ),
    parentId: JsonSchema.optional(JsonSchema.string({ description: 'Only direct children of this task.' })),
    lifecycleClass: JsonSchema.optional(
      JsonSchema.enumOf([...allTaskLifecycleClasses], {
        description: 'Only open tasks, only terminal tasks, or all (the default).'
      })
    ),
    statuses: JsonSchema.optional(
      JsonSchema.array(JsonSchema.enumOf([...allTaskStatuses], { description: 'A lifecycle status.' }), {
        description: 'Only tasks in one of these lifecycle statuses.'
      })
    ),
    limit: JsonSchema.optional(
      JsonSchema.integer({
        description: `The most tasks to return, from 1 to ${maxItems}. Defaults to ${maxItems}.`
      })
    ),
    cursor: JsonSchema.optional(
      JsonSchema.string({ description: 'The nextCursor of a previous task_query, to continue after it.' })
    )
  });
}

/**
 * The `task_inspect` parameter schema — the wire schema and the validator `execute` re-runs.
 * @internal
 */
export const taskInspectSchema: JsonSchema.ISchemaValidator<ITaskInspectToolArgs> = JsonSchema.object({
  taskId: JsonSchema.string({ description: 'The id of the task to inspect.' })
});
