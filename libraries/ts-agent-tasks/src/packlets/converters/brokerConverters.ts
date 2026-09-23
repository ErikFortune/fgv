/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converters as JsonConverters, JsonValue } from '@fgv/ts-json-base';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import {
  IArchiveTask,
  IBoundTaskQuery,
  IChangeTaskScopes,
  ICompleteTaskList,
  ICreateTaskList,
  ICreateTrackedTask,
  IListCompletionRequest,
  IProjectedTaskEnvelope,
  IProjectedUnresolvedReference,
  IReassignTask,
  IReassignmentResult,
  IRegisterExternalTask,
  IReparentTask,
  IResponsibility,
  ITaskFieldBounds,
  ITaskMutationIdentity,
  ITaskMutationResult,
  IUpdateTrackedTask,
  TaskLifecycleClass,
  TaskLifecycleStatus,
  TaskListCompletion,
  TaskMutationDisposition,
  TrackedCommand,
  allTaskLifecycleClasses,
  allTaskStatuses
} from '../types';
import { IIdentityConverters } from './identityConverters';
import {
  boundedArrayOf,
  boundedSingleLine,
  boundedText,
  instant,
  positiveSafeInteger,
  taskRevision
} from './primitives';
import { IQueryConverters } from './queryConverters';
import { IValueConverters } from './valueConverters';

/**
 * Converters for the broker's requests, receipts and projected values.
 * @remarks
 * Every request converter is strict. None has a principal or scope member for a caller to fill
 * in, so a fabricated `principal` or `scopes` property is a conversion failure rather than an
 * ignored field.
 * @public
 */
export interface IBrokerConverters {
  /** A principal key: the bounded, single-line identity stored with operation evidence. */
  readonly principalKey: Converter<string>;
  readonly createTracked: Converter<ICreateTrackedTask>;
  readonly createList: Converter<ICreateTaskList>;
  readonly mutationIdentity: Converter<ITaskMutationIdentity>;
  readonly updateTracked: Converter<IUpdateTrackedTask>;
  readonly reassign: Converter<IReassignTask>;
  readonly changeScopes: Converter<IChangeTaskScopes>;
  readonly reparent: Converter<IReparentTask>;
  readonly completeList: Converter<ICompleteTaskList>;
  readonly archive: Converter<IArchiveTask>;
  readonly registerExternal: Converter<IRegisterExternalTask>;
  readonly boundQuery: Converter<IBoundTaskQuery>;
  readonly listCompletion: Converter<IListCompletionRequest>;
  /** `{ command, parameters }` for one `fgv.tracked@1` command. */
  readonly trackedCommand: Converter<TrackedCommand>;
  readonly mutationResult: Converter<ITaskMutationResult>;
  readonly reassignmentResult: Converter<IReassignmentResult>;
  /** A projected envelope: strict, with no `binding` member. */
  readonly projectedEnvelope: Converter<IProjectedTaskEnvelope>;
  readonly projectedReference: Converter<IProjectedUnresolvedReference>;
}

/**
 * Builds the {@link IBrokerConverters}.
 * @public
 */
export function buildBrokerConverters(
  bounds: ITaskFieldBounds,
  ids: IIdentityConverters,
  values: IValueConverters,
  queries: IQueryConverters
): IBrokerConverters {
  const title: Converter<string> = boundedSingleLine(bounds.maxTitleLength, 'title');
  const description: Converter<string> = boundedText(bounds.maxDescriptionLength, 'description');
  const completion: Converter<TaskListCompletion> = Converters.enumeratedValue<TaskListCompletion>([
    'manual',
    'all-children-succeeded'
  ]);
  const empty: Converter<Readonly<Record<string, never>>> = Converters.strictObject<
    Readonly<Record<string, never>>
  >({});

  const createFields = {
    taskId: ids.taskId,
    operationId: ids.operationId,
    title,
    description: description.optional(),
    parentId: ids.taskId.optional(),
    responsibility: values.responsibility.optional(),
    stopPolicy: values.stopPolicy.optional()
  };
  const createTracked: Converter<ICreateTrackedTask> =
    Converters.strictObject<ICreateTrackedTask>(createFields);
  const createList: Converter<ICreateTaskList> = Converters.strictObject<ICreateTaskList>({
    ...createFields,
    completion
  });

  const identityFields = {
    taskId: ids.taskId,
    operationId: ids.operationId,
    expectedRevision: taskRevision
  };
  const mutationIdentity: Converter<ITaskMutationIdentity> =
    Converters.strictObject<ITaskMutationIdentity>(identityFields);

  const updateTracked: Converter<IUpdateTrackedTask> = Converters.strictObject<IUpdateTrackedTask>({
    ...identityFields,
    patch: Converters.strictObject<IUpdateTrackedTask['patch']>({
      title: title.optional(),
      description: description.optional(),
      progress: values.progress.optional(),
      attention: values.references.optional(),
      clear: boundedArrayOf(
        Converters.enumeratedValue<'description' | 'progress'>(['description', 'progress']),
        2,
        'clear'
      ).optional()
    }).withConstraint((patch) => {
      const both = (patch.clear ?? []).find((field) => patch[field] !== undefined);
      return both === undefined ? succeed(patch) : fail(`patch: '${both}' is both set and cleared`);
    })
  });

  const reassign: Converter<IReassignTask> = Converters.strictObject<IReassignTask>({
    ...identityFields,
    // Required: absence is never an accidental unassignment.
    responsibility: Converters.oneOf<IResponsibility | 'unassigned'>([
      Converters.literal<'unassigned'>('unassigned'),
      values.responsibility
    ])
  });

  const changeScopes: Converter<IChangeTaskScopes> = Converters.strictObject<IChangeTaskScopes>({
    ...identityFields,
    add: values.scopes.optional(),
    remove: values.scopes.optional()
  });

  const reparent: Converter<IReparentTask> = Converters.strictObject<IReparentTask>({
    ...identityFields,
    parent: Converters.oneOf<IReparentTask['parent']>([
      Converters.literal<'root'>('root'),
      Converters.strictObject<{ readonly taskId: IReparentTask['taskId'] }>({ taskId: ids.taskId })
    ])
  });

  const completeList: Converter<ICompleteTaskList> = Converters.strictObject<ICompleteTaskList>({
    ...identityFields,
    outcome: values.outcome
  });

  const registerExternal: Converter<IRegisterExternalTask> = Converters.strictObject<IRegisterExternalTask>({
    taskId: ids.taskId,
    operationId: ids.operationId,
    kind: ids.taskKind,
    detailVersion: positiveSafeInteger,
    title,
    description: description.optional(),
    parentId: ids.taskId.optional(),
    responsibility: values.responsibility.optional(),
    scopes: values.scopes,
    binding: values.sourceBinding,
    recovery: values.recoveryDeclaration,
    initialObservation: values.sourceProjection.optional()
  });

  const boundQuery: Converter<IBoundTaskQuery> = Converters.strictObject<IBoundTaskQuery>({
    filter: Converters.strictObject<NonNullable<IBoundTaskQuery['filter']>>({
      responsibility: values.responsibility.optional(),
      parentId: ids.taskId.optional(),
      lifecycleClass: Converters.enumeratedValue<TaskLifecycleClass>(allTaskLifecycleClasses).optional(),
      statuses: boundedArrayOf(
        Converters.enumeratedValue<TaskLifecycleStatus>(allTaskStatuses),
        allTaskStatuses.length * 4,
        'statuses'
      ).optional()
    }).optional(),
    limit: queries.limit.optional(),
    cursor: queries.pageCursor.optional()
  });

  const listCompletion: Converter<IListCompletionRequest> = Converters.strictObject<IListCompletionRequest>({
    limit: queries.limit,
    after: queries.pageCursor.optional()
  });

  // The parameters of the union member whose command set includes `C`.
  type Params<C extends TrackedCommand['command']> = TrackedCommand extends infer T
    ? T extends { readonly command: infer K; readonly parameters: infer P }
      ? C extends K
        ? P
        : never
      : never
    : never;
  const waitParams: Converter<Params<'wait'>> = Converters.strictObject<Params<'wait'>>({
    reason: values.waitingReason
  });
  const pauseParams: Converter<Params<'pause'>> = Converters.strictObject<Params<'pause'>>({
    reason: values.reason
  });
  const succeedParams: Converter<Params<'succeed'>> = Converters.strictObject<Params<'succeed'>>({
    outcome: values.outcome
  });
  const endParams: Converter<Params<'fail'>> = Converters.strictObject<Params<'fail'>>({
    reason: values.reason,
    outcome: values.outcome.optional()
  });
  const titleParams: Converter<Params<'set-title'>> = Converters.strictObject<Params<'set-title'>>({ title });
  const descriptionParams: Converter<Params<'set-description'>> = Converters.strictObject<
    Params<'set-description'>
  >({ description: description.optional() });
  const progressParams: Converter<Params<'set-progress'>> = Converters.strictObject<Params<'set-progress'>>({
    progress: values.progress.optional()
  });
  const attentionParams: Converter<Params<'set-attention'>> = Converters.strictObject<
    Params<'set-attention'>
  >({ attention: values.references });

  const trackedCommand: Converter<TrackedCommand> = Converters.generic<TrackedCommand>(
    (from: unknown): Result<TrackedCommand> =>
      Converters.strictObject<{ command: string; parameters: JsonValue }>({
        command: Converters.string,
        parameters: JsonConverters.jsonValue
      })
        .convert(from)
        .onSuccess(({ command, parameters }): Result<TrackedCommand> => {
          switch (command) {
            case 'start':
            case 'resume':
              return empty.convert(parameters).onSuccess((p) => succeed({ command, parameters: p }));
            case 'wait':
              return waitParams.convert(parameters).onSuccess((p) => succeed({ command, parameters: p }));
            case 'pause':
              return pauseParams.convert(parameters).onSuccess((p) => succeed({ command, parameters: p }));
            case 'succeed':
              return succeedParams.convert(parameters).onSuccess((p) => succeed({ command, parameters: p }));
            case 'fail':
            case 'cancel':
              return endParams.convert(parameters).onSuccess((p) => succeed({ command, parameters: p }));
            case 'set-title':
              return titleParams.convert(parameters).onSuccess((p) => succeed({ command, parameters: p }));
            case 'set-description':
              return descriptionParams
                .convert(parameters)
                .onSuccess((p) => succeed({ command, parameters: p }));
            case 'set-progress':
              return progressParams.convert(parameters).onSuccess((p) => succeed({ command, parameters: p }));
            case 'set-attention':
              return attentionParams
                .convert(parameters)
                .onSuccess((p) => succeed({ command, parameters: p }));
            default:
              return fail(`'${command}' is not a fgv.tracked@1 command`);
          }
        })
  );

  const disposition: Converter<TaskMutationDisposition> = Converters.enumeratedValue<TaskMutationDisposition>(
    ['changed', 'unchanged']
  );
  const resultFields = {
    taskId: ids.taskId,
    revision: taskRevision,
    operationId: ids.operationId,
    disposition,
    updateIds: Converters.arrayOf(ids.updateId)
  };
  const mutationResult: Converter<ITaskMutationResult> =
    Converters.strictObject<ITaskMutationResult>(resultFields);
  const reassignmentResult: Converter<IReassignmentResult> = Converters.strictObject<IReassignmentResult>({
    ...resultFields,
    previous: values.responsibility.optional(),
    current: values.responsibility.optional()
  });

  const projectedEnvelope: Converter<IProjectedTaskEnvelope> =
    Converters.strictObject<IProjectedTaskEnvelope>({
      schemaVersion: Converters.literal<1>(1),
      id: ids.taskId,
      kind: ids.taskKind,
      detailVersion: positiveSafeInteger,
      revision: taskRevision,
      title,
      description: description.optional(),
      parentId: ids.taskId.optional(),
      stopPolicy: values.stopPolicy,
      responsibility: values.responsibility.optional(),
      scopes: values.scopes,
      lifecycle: values.lifecycle,
      progress: values.progress.optional(),
      attention: values.references,
      recovery: values.recoveryDeclaration,
      observation: values.observationHealth,
      createdAt: instant,
      changedAt: instant
    });

  const projectedReference: Converter<IProjectedUnresolvedReference> =
    Converters.strictObject<IProjectedUnresolvedReference>({
      id: ids.taskId,
      revision: taskRevision,
      kind: ids.taskKind,
      detailVersion: positiveSafeInteger,
      title,
      parentId: ids.taskId.optional(),
      responsibility: values.responsibility.optional(),
      scopes: values.scopes,
      reason: boundedText(bounds.maxSummaryLength, 'reason')
    });

  return {
    principalKey: boundedSingleLine(bounds.maxSummaryLength, 'principal key'),
    createTracked,
    createList,
    mutationIdentity,
    updateTracked,
    reassign,
    changeScopes,
    reparent,
    completeList,
    archive: mutationIdentity,
    registerExternal,
    boundQuery,
    listCompletion,
    trackedCommand,
    mutationResult,
    reassignmentResult,
    projectedEnvelope,
    projectedReference
  };
}
