/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { AiAssist } from '@fgv/ts-extras';
import { Converter, Result, captureResult, succeed, succeedWithDetail } from '@fgv/ts-utils';
import {
  IBoundTaskWriter,
  ICreateTrackedTask,
  IReassignTask,
  IReassignmentResult,
  IResponsibility,
  IUpdateTrackedTask,
  ITaskEnvironment,
  ITaskFailure,
  ITaskMutationResult,
  ITaskMutationToolResult,
  ITaskReassignToolResult,
  OperationId,
  TaskId,
  TaskResult
} from '../types';
import {
  ITaskCreateToolArgs,
  ITaskReassignToolArgs,
  ITaskUpdateToolArgs,
  taskCreateSchema,
  taskReassignSchema,
  taskUpdateSchema
} from './schemas';
import { IToolContext, argumentMessage, askView, convertAnswer, hostFailure } from './toolSupport';
import { IWriterAnswerConverters } from './writerAnswers';

/**
 * What the mutation tools are built over, beyond what every tool has: the writer — the same binding
 * the view is — and where ids come from.
 * @internal
 */
export interface IMutationToolContext extends IToolContext {
  readonly writer: IBoundTaskWriter;
  readonly environment: Pick<ITaskEnvironment, 'newTaskId' | 'newOperationId'>;
  readonly receipts: IWriterAnswerConverters;
}

/** A tool call's mutation: the request the writer is asked, and the receipt it must answer with. */
interface IPlannedMutation<TRequest, TReceipt> {
  readonly request: TRequest;
  readonly receipt: Converter<TReceipt>;
}

const creationAnnotations: AiAssist.IAiToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false
};

const changeAnnotations: AiAssist.IAiToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false
};

/**
 * Mints one id through the host's environment and converts it. Host code, so a throw is captured;
 * a failure or a malformed id is the host's fault and never reaches the model as text.
 */
function _mint<T>(mint: () => Result<T>, converter: Converter<T>): Result<T> {
  return captureResult(mint)
    .onSuccess((minted) => minted)
    .onSuccess((raw) => converter.convert(raw));
}

/**
 * A fresh operation id for one call. The model never names one: every call is a new operation, so
 * a model can neither replay another principal's receipt nor occupy a key a host pump would mint.
 */
function _operationId(ctx: IMutationToolContext, tool: string): Result<OperationId> {
  return _mint(() => ctx.environment.newOperationId(), ctx.renderer.converters.ids.operationId).onFailure(
    (message) => hostFailure(ctx, tool, `could not mint an operation id: ${message}`)
  );
}

/** What the model is told a mutation did: never the operation id, never the update ids. */
function _presentMutation(receipt: ITaskMutationResult): TaskResult<ITaskMutationToolResult> {
  return succeedWithDetail<ITaskMutationToolResult, ITaskFailure>({
    taskId: receipt.taskId,
    revision: receipt.revision,
    disposition: receipt.disposition
  });
}

/**
 * Runs one planned mutation: a model's arguments that do not describe a valid request are the
 * model's to fix and are described to it; the writer's answer is converted before anything reads it.
 */
async function _mutate<TRequest, TReceipt, TOut>(
  ctx: IMutationToolContext,
  tool: string,
  planned: Result<IPlannedMutation<TRequest, TReceipt>>,
  ask: (request: TRequest) => Promise<TaskResult<unknown>>,
  present: (receipt: TReceipt) => TaskResult<TOut>
): Promise<Result<TOut>> {
  return planned.thenOnSuccess(({ request, receipt }) =>
    askView(
      ctx,
      tool,
      () => ask(request),
      (answer) => convertAnswer(receipt, answer, 'receipt').onSuccess(present)
    )
  );
}

function _createTool(ctx: IMutationToolContext): AiAssist.IAiClientTool {
  const name: string = 'task_create';
  const plan = (
    args: ITaskCreateToolArgs
  ): Result<IPlannedMutation<ICreateTrackedTask, ITaskMutationResult>> =>
    // The new task's id is minted too: a model-chosen id that collided with a task this principal
    // cannot see would be refused, and the refusal would say that the hidden task exists.
    _mint(() => ctx.environment.newTaskId(), ctx.renderer.converters.ids.taskId)
      .onFailure((message) => hostFailure<TaskId>(ctx, name, `could not mint a task id: ${message}`))
      .onSuccess((taskId) =>
        _operationId(ctx, name).onSuccess((operationId) =>
          ctx.renderer.converters.broker.createTracked
            .convert({ ...args, taskId, operationId })
            .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
            .onSuccess((request) =>
              succeed({ request, receipt: ctx.receipts.mutation({ taskId, operationId }) })
            )
        )
      );
  return {
    config: {
      type: 'client_tool',
      name,
      description:
        'Create a tracked task, optionally as a child of an open task and with a responsible party. ' +
        'Returns the new task id and its revision.',
      parametersSchema: taskCreateSchema,
      annotations: creationAnnotations
    },
    // `execute` re-validates: a direct call reaches it without any harness in front.
    execute: async (args: unknown): Promise<Result<unknown>> =>
      _mutate(
        ctx,
        name,
        taskCreateSchema
          .convert(args)
          .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
          .onSuccess(plan),
        (request) => ctx.writer.createTracked(request),
        _presentMutation
      )
  };
}

function _updateTool(ctx: IMutationToolContext): AiAssist.IAiClientTool {
  const name: string = 'task_update';
  const plan = (
    args: ITaskUpdateToolArgs
  ): Result<IPlannedMutation<IUpdateTrackedTask, ITaskMutationResult>> =>
    _operationId(ctx, name).onSuccess((operationId) =>
      ctx.renderer.converters.broker.updateTracked
        .convert({
          taskId: args.taskId,
          operationId,
          expectedRevision: args.expectedRevision,
          patch: {
            ...(args.title !== undefined ? { title: args.title } : {}),
            ...(args.description !== undefined ? { description: args.description } : {}),
            ...(args.progress !== undefined ? { progress: args.progress } : {}),
            ...(args.clear !== undefined ? { clear: args.clear } : {})
          }
        })
        .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
        .onSuccess((request) =>
          succeed({ request, receipt: ctx.receipts.mutation({ taskId: request.taskId, operationId }) })
        )
    );
  return {
    config: {
      type: 'client_tool',
      name,
      description:
        "Change a tracked task's title, description or progress, or clear its description or progress. " +
        'Pass the revision task_inspect returned; a task that has changed since is not modified.',
      parametersSchema: taskUpdateSchema,
      annotations: changeAnnotations
    },
    // `execute` re-validates: a direct call reaches it without any harness in front.
    execute: async (args: unknown): Promise<Result<unknown>> =>
      _mutate(
        ctx,
        name,
        taskUpdateSchema
          .convert(args)
          .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
          .onSuccess(plan),
        (request) => ctx.writer.updateTracked(request),
        _presentMutation
      )
  };
}

function _reassignTool(ctx: IMutationToolContext): AiAssist.IAiClientTool {
  const name: string = 'task_reassign';
  const plan = (args: ITaskReassignToolArgs): Result<IPlannedMutation<IReassignTask, IReassignmentResult>> =>
    _operationId(ctx, name).onSuccess((operationId) =>
      ctx.renderer.converters.broker.reassign
        .convert({
          taskId: args.taskId,
          operationId,
          expectedRevision: args.expectedRevision,
          responsibility: args.responsibility ?? 'unassigned'
        })
        .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
        .onSuccess((request) =>
          succeed({
            request,
            receipt: ctx.receipts.reassignment({
              taskId: request.taskId,
              operationId,
              responsibility: request.responsibility
            })
          })
        )
    );
  const present = (receipt: IReassignmentResult): TaskResult<ITaskReassignToolResult> =>
    succeedWithDetail<ITaskReassignToolResult, ITaskFailure>({
      taskId: receipt.taskId,
      revision: receipt.revision,
      disposition: receipt.disposition,
      ...(receipt.previous !== undefined ? { previous: _party(receipt.previous) } : {}),
      ...(receipt.current !== undefined ? { current: _party(receipt.current) } : {})
    });
  return {
    config: {
      type: 'client_tool',
      name,
      description:
        "Change a task's responsible party, or unassign it with null. Pass the revision task_inspect " +
        'returned; a task that has changed since is not modified. Reassigning grants no one access.',
      parametersSchema: taskReassignSchema,
      annotations: changeAnnotations
    },
    // `execute` re-validates: a direct call reaches it without any harness in front.
    execute: async (args: unknown): Promise<Result<unknown>> =>
      _mutate(
        ctx,
        name,
        taskReassignSchema
          .convert(args)
          .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
          .onSuccess(plan),
        (request) => ctx.writer.reassign(request),
        present
      )
  };
}

/** A responsible party as the model is shown one: its two fields, nothing else. */
function _party(party: IResponsibility): IResponsibility {
  return { namespace: party.namespace, key: party.key };
}

/**
 * The mutation tools a host opted into, in a fixed order: `task_create` and `task_update` for
 * `tracked`, then `task_reassign` for `reassign`.
 * @internal
 */
export function mutationTools(
  ctx: IMutationToolContext,
  groups: ReadonlySet<string>
): ReadonlyArray<AiAssist.IAiClientTool> {
  return [
    ...(groups.has('tracked') ? [_createTool(ctx), _updateTool(ctx)] : []),
    ...(groups.has('reassign') ? [_reassignTool(ctx)] : [])
  ];
}
