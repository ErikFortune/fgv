/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonSchema } from '@fgv/ts-json-base';
import {
  StopMode,
  TaskLifecycleClass,
  TaskLifecycleStatus,
  allTaskLifecycleClasses,
  allTaskStatuses
} from '../types';

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

/** A responsible party's two members, as every schema that names one spells them. */
const responsibilityProperties: {
  readonly namespace: JsonSchema.ISchemaValidator<string>;
  readonly key: JsonSchema.ISchemaValidator<string>;
} = {
  namespace: JsonSchema.string({ description: 'The responsible party namespace, e.g. "agent".' }),
  key: JsonSchema.string({ description: 'The responsible party key within its namespace.' })
};

/**
 * The `task_query` parameter schema — the wire schema and the validator `execute` re-runs.
 * @param maxItems - The largest page the tool will ask for, stated in the `limit` description.
 * @internal
 */
export function taskQuerySchema(maxItems: number): JsonSchema.ISchemaValidator<ITaskQueryToolArgs> {
  return JsonSchema.object({
    responsibility: JsonSchema.optional(
      JsonSchema.object(responsibilityProperties, {
        description: 'Only tasks assigned to this responsible party.'
      })
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

/**
 * The precondition every mutation of an existing task carries: the task, and the revision the
 * caller last read.
 */
const identityProperties: {
  readonly taskId: JsonSchema.ISchemaValidator<string>;
  readonly expectedRevision: JsonSchema.ISchemaValidator<number>;
} = {
  taskId: JsonSchema.string({ description: 'The id of the task to change.' }),
  expectedRevision: JsonSchema.integer({
    description:
      'The revision task_inspect last returned for this task. The change is refused if the task has ' +
      'changed since; inspect it again and decide afresh.'
  })
};

/**
 * The arguments `task_create` accepts.
 * @remarks
 * No task id, operation id, scope, stop policy or source binding: the tool mints the ids, and the
 * bound writer supplies the scopes. The schema is closed.
 * @internal
 */
export interface ITaskCreateToolArgs {
  readonly title: string;
  readonly description?: string;
  readonly parentId?: string;
  readonly responsibility?: { readonly namespace: string; readonly key: string };
}

/**
 * The `task_create` parameter schema — the wire schema and the validator `execute` re-runs.
 * @internal
 */
export const taskCreateSchema: JsonSchema.ISchemaValidator<ITaskCreateToolArgs> = JsonSchema.object({
  title: JsonSchema.string({ description: 'A one-line title for the new task.' }),
  description: JsonSchema.optional(JsonSchema.string({ description: 'A longer description of the task.' })),
  parentId: JsonSchema.optional(
    JsonSchema.string({ description: 'Create the task as a child of this open task.' })
  ),
  responsibility: JsonSchema.optional(
    JsonSchema.object(responsibilityProperties, { description: 'The party responsible for the new task.' })
  )
});

/**
 * The arguments `task_update` accepts.
 * @internal
 */
export interface ITaskUpdateToolArgs {
  readonly taskId: string;
  readonly expectedRevision: number;
  readonly title?: string;
  readonly description?: string;
  readonly progress?: {
    readonly phase?: string;
    readonly completed?: number;
    readonly total?: number;
    readonly unit?: string;
    readonly summary?: string;
  };
  readonly clear?: ReadonlyArray<'description' | 'progress'>;
}

/**
 * The `task_update` parameter schema — the wire schema and the validator `execute` re-runs.
 * @remarks
 * Only a tracked task's presentable fields. No lifecycle, scope, parent or responsibility: those
 * are commands, other tools, or not the model's at all.
 * @internal
 */
export const taskUpdateSchema: JsonSchema.ISchemaValidator<ITaskUpdateToolArgs> = JsonSchema.object({
  ...identityProperties,
  title: JsonSchema.optional(JsonSchema.string({ description: 'A new one-line title.' })),
  description: JsonSchema.optional(JsonSchema.string({ description: 'A new description.' })),
  progress: JsonSchema.optional(
    JsonSchema.object(
      {
        phase: JsonSchema.optional(JsonSchema.string({ description: 'The current phase.' })),
        completed: JsonSchema.optional(JsonSchema.number({ description: 'How much is done.' })),
        total: JsonSchema.optional(JsonSchema.number({ description: 'How much there is in all.' })),
        unit: JsonSchema.optional(JsonSchema.string({ description: 'What completed and total count.' })),
        summary: JsonSchema.optional(JsonSchema.string({ description: 'A short progress note.' }))
      },
      { description: 'The progress to report, replacing any reported before.' }
    )
  ),
  clear: JsonSchema.optional(
    JsonSchema.array(
      JsonSchema.enumOf(['description', 'progress'] as const, { description: 'A field to remove.' }),
      { description: 'Fields to remove. A field cleared here may not also be set.' }
    )
  )
});

/**
 * The arguments `task_reassign` accepts.
 * @internal
 */
export interface ITaskReassignToolArgs {
  readonly taskId: string;
  readonly expectedRevision: number;
  // eslint-disable-next-line @rushstack/no-new-null -- the JSON null a model sends to unassign, as `JsonSchema.object({ nullable: true })` validates it
  readonly responsibility: { readonly namespace: string; readonly key: string } | null;
}

/**
 * The `task_reassign` parameter schema — the wire schema and the validator `execute` re-runs.
 * @remarks
 * `responsibility` is required and nullable: `null` unassigns explicitly, so an omitted party is
 * never an accidental unassignment.
 * @internal
 */
export const taskReassignSchema: JsonSchema.ISchemaValidator<ITaskReassignToolArgs> = JsonSchema.object({
  ...identityProperties,
  responsibility: JsonSchema.object(responsibilityProperties, {
    nullable: true,
    description: 'The party to make responsible, or null to unassign the task.'
  })
});

/**
 * The arguments a generated command tool accepts: the task, the revision the model last read, and
 * the command's parameters.
 * @remarks
 * No operation id, command name, principal or source precondition: the tool mints the id, the command
 * is the tool's, and a conditional command's precondition is the one the broker commits when it
 * dispatches. The schema is closed.
 * @internal
 */
export interface ITaskCommandToolArgs {
  readonly taskId: string;
  readonly expectedRevision: number;
  /**
   * Optional to the type system only — the registered schema is erased to `unknown`, which admits
   * `undefined`. On the wire, and in validation, it is exactly as required as the registered schema
   * makes it.
   */
  readonly parameters?: unknown;
}

/**
 * A generated command tool's parameter schema — the wire schema and the validator `execute` re-runs.
 * `parameters` is the command's registered schema, unchanged.
 * @internal
 */
export function taskCommandSchema(
  parameters: JsonSchema.ISchemaValidator<unknown>
): JsonSchema.ISchemaValidator<ITaskCommandToolArgs> {
  return JsonSchema.object({
    taskId: JsonSchema.string({ description: 'The id of the task to send the command to.' }),
    expectedRevision: identityProperties.expectedRevision,
    parameters
  });
}

/**
 * The arguments `task_stop` accepts: the root, the revision the model last read, and the mode.
 * @remarks
 * No operation id, principal or scope: the tool mints the id — which becomes the stop's `intentId` —
 * and the bound writer supplies the rest. The schema is closed.
 * @internal
 */
export interface ITaskStopToolArgs {
  readonly taskId: string;
  readonly expectedRevision: number;
  readonly mode: StopMode;
}

/**
 * The `task_stop` parameter schema — the wire schema and the validator `execute` re-runs.
 * @param modes - The modes the host offers; `mode` accepts exactly these.
 * @internal
 */
export function taskStopSchema(
  modes: ReadonlyArray<StopMode>
): JsonSchema.ISchemaValidator<ITaskStopToolArgs> {
  return JsonSchema.object({
    taskId: JsonSchema.string({ description: 'The id of the task to stop, with every task under it.' }),
    expectedRevision: identityProperties.expectedRevision,
    mode: JsonSchema.enumOf([...modes], {
      description:
        modes.length > 1
          ? 'pause holds the tree stopped until the host releases it; cancel ends it for good.'
          : modes[0] === 'pause'
          ? 'pause holds the tree stopped until the host releases it.'
          : 'cancel ends the tree for good.'
    })
  });
}

/**
 * The arguments `task_stop_inspect` accepts: the stop's root, its intent id, and where to continue.
 * @internal
 */
export interface ITaskStopInspectToolArgs {
  readonly taskId: string;
  readonly intentId: string;
  readonly after?: string;
}

/**
 * The `task_stop_inspect` parameter schema — the wire schema and the validator `execute` re-runs.
 * @internal
 */
export const taskStopInspectSchema: JsonSchema.ISchemaValidator<ITaskStopInspectToolArgs> = JsonSchema.object(
  {
    taskId: JsonSchema.string({ description: 'The id of the task the stop was requested on.' }),
    intentId: JsonSchema.string({ description: 'The intentId task_stop returned.' }),
    after: JsonSchema.optional(
      JsonSchema.string({ description: 'The nextAfter of a previous result, to list the targets after it.' })
    )
  }
);
