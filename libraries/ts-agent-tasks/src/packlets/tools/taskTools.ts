/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { AiAssist } from '@fgv/ts-extras';
import { JsonSchema } from '@fgv/ts-json-base';
import { Converters, DetailedResult, Result, captureAsyncResult, fail, succeed } from '@fgv/ts-utils';
import { TaskContextRenderer } from '../context';
import {
  IBoundTaskQuery,
  IBoundTaskView,
  ITaskFailure,
  ITaskToolBudget,
  TaskId,
  TaskResult,
  defaultTaskToolBudget
} from '../types';
import { presentInspection, presentPage } from './presentation';
import { ITaskInspectToolArgs, ITaskQueryToolArgs, taskInspectSchema, taskQuerySchema } from './schemas';

/**
 * Parameters for {@link createTaskTools}.
 * @public
 */
export interface ICreateTaskToolsParams {
  /**
   * The principal-bound view every tool reads through. It carries the principal, its scopes, its
   * authorization and its projector; no tool argument can name or widen any of them.
   */
  readonly view: IBoundTaskView;
  /**
   * The renderer every task presentation goes through. Defaults to `TaskContextRenderer.create()`.
   * Its converters also validate the model's query arguments and task ids before the view is asked.
   * Supply one built with the broker's converters when the host's field bounds differ from the
   * defaults, so a task the view returns is never refused by the renderer.
   */
  readonly renderer?: TaskContextRenderer;
  /** Output bounds. Defaults to {@link defaultTaskToolBudget}. */
  readonly budget?: ITaskToolBudget;
}

/**
 * The most characters of a failure message a tool returns. A converter's message can echo the
 * model's own argument, which has no length limit of its own.
 */
const maxMessageChars: number = 500;

const readOnlyAnnotations: AiAssist.IAiToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

interface IToolContext {
  readonly view: IBoundTaskView;
  readonly renderer: TaskContextRenderer;
  readonly budget: ITaskToolBudget;
}

/** A failure as the model sees it: named by tool, classified when classified, and bounded. */
function _message(tool: string, message: string, detail?: ITaskFailure): string {
  const full: string = `${tool}: ${detail !== undefined ? `${detail.code}: ` : ''}${message}`;
  if (full.length <= maxMessageChars) {
    return full;
  }
  // Never cut a surrogate pair in half.
  const cut: number = /[\udc00-\udfff]/.test(full.charAt(maxMessageChars))
    ? maxMessageChars - 1
    : maxMessageChars;
  return `${full.slice(0, cut)}… (truncated)`;
}

/** Reduces a task result to the plain result a tool returns, its failure classified and bounded. */
function _toolResult<T>(tool: string, result: DetailedResult<T, ITaskFailure>): Result<T> {
  return result.isSuccess() ? succeed(result.value) : fail(_message(tool, result.message, result.detail));
}

/**
 * Asks the view and presents its answer. A view that rejects or throws — host code, whatever it
 * implements — fails the call through the same classified, bounded message as any other failure.
 */
async function _read<T, TOut>(
  tool: string,
  ask: () => Promise<TaskResult<T>>,
  present: (value: T) => TaskResult<TOut>
): Promise<Result<TOut>> {
  return (await captureAsyncResult(async () => (await ask()).onSuccess(present)))
    .withErrorFormat((message) => _message(tool, message))
    .onSuccess((result) => _toolResult(tool, result));
}

/** The view query a model's arguments describe, validated by the view's own request converter. */
function _queryRequest(ctx: IToolContext, args: ITaskQueryToolArgs): Result<IBoundTaskQuery> {
  const maxItems: number = ctx.budget.context.maxItems;
  const limit: number = args.limit ?? maxItems;
  if (limit < 1 || limit > maxItems) {
    return fail(`limit must be an integer from 1 to ${maxItems}; got ${limit}`);
  }
  const filter: Record<string, unknown> = {
    ...(args.responsibility !== undefined ? { responsibility: args.responsibility } : {}),
    ...(args.parentId !== undefined ? { parentId: args.parentId } : {}),
    ...(args.lifecycleClass !== undefined ? { lifecycleClass: args.lifecycleClass } : {}),
    ...(args.statuses !== undefined ? { statuses: args.statuses } : {})
  };
  return ctx.renderer.converters.broker.boundQuery.convert({
    ...(Object.keys(filter).length > 0 ? { filter } : {}),
    limit,
    ...(args.cursor !== undefined ? { cursor: args.cursor } : {})
  });
}

function _queryTool(ctx: IToolContext): AiAssist.IAiClientTool {
  const name: string = 'task_query';
  const schema: JsonSchema.ISchemaValidator<ITaskQueryToolArgs> = taskQuerySchema(
    ctx.budget.context.maxItems
  );
  return {
    config: {
      type: 'client_tool',
      name,
      description:
        'List the tasks you can see, optionally narrowed by responsible party, parent, lifecycle class ' +
        'or status. Returns one page as bounded context text; tasks the text omitted or abbreviated are ' +
        'listed by id and can be read with task_inspect. Continue with nextCursor.',
      parametersSchema: schema,
      annotations: readOnlyAnnotations
    },
    // `execute` re-validates: a direct call reaches it without any harness in front.
    execute: async (args: unknown): Promise<Result<unknown>> =>
      schema
        .convert(args)
        .onSuccess((typed) => _queryRequest(ctx, typed))
        .withErrorFormat((message) => _message(name, `invalid arguments: ${message}`))
        .thenOnSuccess((request) =>
          _read(
            name,
            () => ctx.view.query(request),
            (page) => presentPage(ctx.renderer, ctx.budget, page)
          )
        )
  };
}

function _inspectTool(ctx: IToolContext): AiAssist.IAiClientTool {
  const name: string = 'task_inspect';
  return {
    config: {
      type: 'client_tool',
      name,
      description:
        'Read one task you can see: its current state as bounded context text, the commands currently ' +
        'available on it, and its details when the host exposes them and they fit.',
      parametersSchema: taskInspectSchema,
      annotations: readOnlyAnnotations
    },
    // `execute` re-validates: a direct call reaches it without any harness in front.
    execute: async (args: unknown): Promise<Result<unknown>> =>
      taskInspectSchema
        .convert(args)
        .onSuccess((typed: ITaskInspectToolArgs) => ctx.renderer.converters.ids.taskId.convert(typed.taskId))
        .withErrorFormat((message) => _message(name, `invalid arguments: ${message}`))
        .thenOnSuccess((id: TaskId) =>
          _read(
            name,
            () => ctx.view.inspect(id),
            (inspection) => presentInspection(ctx.renderer, ctx.budget, inspection)
          )
        )
  };
}

/**
 * Validates a host's tool budget: the context budget as the renderer would, including its framing
 * reserve, so a budget that could never render fails here rather than on the model's first call.
 */
function _budget(renderer: TaskContextRenderer, budget: ITaskToolBudget): Result<ITaskToolBudget> {
  return Converters.strictObject<ITaskToolBudget>({
    context: renderer.converters.context.budget,
    maxDetailsChars: Converters.number.withConstraint((n) => Number.isSafeInteger(n) && n > 0)
  })
    .convert(budget)
    .onSuccess((valid) =>
      valid.context.maxChars < renderer.framingReserve
        ? fail<ITaskToolBudget>(
            `context.maxChars ${valid.context.maxChars} is below the framing reserve of ${renderer.framingReserve}`
          )
        : succeed(valid)
    )
    .withErrorFormat((message) => `task tools: invalid budget: ${message}`);
}

/**
 * Builds the read-only task tools over a principal-bound view — `task_query` and `task_inspect` —
 * ready to hand to `AiAssist.executeClientToolTurn`.
 *
 * @remarks
 * **Read-only, with no mutation dependency.** The tools take an {@link IBoundTaskView} and call only
 * its `query` and `inspect`.
 *
 * **Nothing the model supplies can widen what it sees.** Neither schema has a principal, scope or
 * consumer member, both are closed (a surplus property fails), and every `execute` re-validates its
 * arguments, since a direct call reaches it with no harness in front.
 *
 * **Authority is live.** Building the tools calls nothing on the view; each call asks the view, and
 * the view asks the host's policy, then.
 *
 * **Bounded by default.** Every task reaches the model as `TaskContextRenderer` text within
 * `budget.context`, never as a raw envelope; a page is at most `budget.context.maxItems` tasks;
 * details are returned only when their JSON fits `budget.maxDetailsChars`, a budget independent of
 * the context text's. A projector that fails — the view's or the renderer's — fails the call:
 * nothing is returned in its place, and nothing falls back to a less-projected value. Failure
 * messages are bounded, and are the view's own, which T5 made indistinguishable for a hidden task
 * and a foreign id; a host projector's failure message is included in them.
 *
 * **What is framed and what is not.** Task state reaches the model only inside the renderer's
 * framed, escaped context text. Details are the host projector's JSON, returned as structured data
 * beside the text and neither framed nor escaped: a host exposing details is choosing their content.
 * @public
 */
export function createTaskTools(
  params: ICreateTaskToolsParams
): Result<ReadonlyArray<AiAssist.IAiClientTool>> {
  const renderer: Result<TaskContextRenderer> =
    params.renderer !== undefined ? succeed(params.renderer) : TaskContextRenderer.create();
  return renderer.onSuccess((r) =>
    _budget(r, params.budget ?? defaultTaskToolBudget).onSuccess((budget) => {
      const ctx: IToolContext = { view: params.view, renderer: r, budget };
      return succeed([_queryTool(ctx), _inspectTool(ctx)]);
    })
  );
}
