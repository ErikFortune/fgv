/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { AiAssist } from '@fgv/ts-extras';
import { JsonSchema } from '@fgv/ts-json-base';
import { Converters, Logging, Result, captureAsyncResult, fail, succeed } from '@fgv/ts-utils';
import { TaskContextRenderer } from '../context';
import {
  IBoundTaskQuery,
  IBoundTaskView,
  ITaskToolBudget,
  TaskFailureCode,
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
  /**
   * Where the full text of a failure the view or the rendering reports goes. The model is told only
   * the failure's code and a fixed description, never the underlying message, which can carry host
   * text — a projector's error, a storage path, a thrown exception. Without a logger that text is
   * discarded.
   */
  readonly logger?: Logging.ILogger;
}

/**
 * The most characters of an argument-validation failure a tool returns. Those messages are about the
 * model's own arguments and can echo them, which have no length limit of their own.
 */
const maxMessageChars: number = 500;

const readOnlyAnnotations: AiAssist.IAiToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

/**
 * What the model is told for each failure the view or the rendering reports. The underlying message
 * is host-side text and never reaches the model: it goes to the host's logger.
 */
const modelFacingFailures: Readonly<Record<TaskFailureCode, string>> = {
  invalid: 'the request was refused, or a task could not be presented',
  'not-found-or-denied': 'the task is not found or not visible',
  conflict: 'tasks changed while this was being answered; retry',
  unsupported: 'the request is not supported',
  'storage-unavailable': 'task storage is unavailable; retry later',
  'storage-corrupt': 'task storage could not be read',
  'commit-indeterminate': 'the outcome of an earlier operation is not yet known; retry later',
  'source-unavailable': 'a task source is unavailable; retry later',
  'source-gap': 'a task source could not be read completely',
  'unknown-kind-version': 'a task has a kind this host does not recognize',
  'invalid-receipt': 'the request was refused',
  'cursor-stale': 'the cursor is no longer valid; query again without it',
  'retention-blocked': 'the request was refused',
  backpressure: 'task storage is at capacity; retry later'
};

interface IToolContext {
  readonly view: IBoundTaskView;
  readonly renderer: TaskContextRenderer;
  readonly budget: ITaskToolBudget;
  readonly logger?: Logging.ILogger;
}

/** An argument-validation failure as the model sees it: named by tool, and bounded. */
function _message(tool: string, message: string): string {
  const full: string = `${tool}: ${message}`;
  if (full.length <= maxMessageChars) {
    return full;
  }
  // Never cut a surrogate pair in half.
  const cut: number = /[\udc00-\udfff]/.test(full.charAt(maxMessageChars))
    ? maxMessageChars - 1
    : maxMessageChars;
  return `${full.slice(0, cut)}… (truncated)`;
}

/**
 * Reduces a task result to what the model is told. A failure becomes its code and a fixed
 * description; its message goes to the host's logger.
 */
function _toolResult<T>(ctx: IToolContext, tool: string, result: TaskResult<T>): Result<T> {
  if (result.isSuccess()) {
    return succeed(result.value);
  }
  ctx.logger?.warn(`${tool}: ${result.message}`);
  // The view is any `IBoundTaskView`, so its failure detail is checked, not trusted: a code outside
  // the known set is treated as no code at all.
  const code: TaskFailureCode | undefined = ctx.renderer.converters.failures.failureCode
    .convert(result.detail?.code)
    .orDefault();
  return fail(
    code !== undefined ? `${tool}: ${code}: ${modelFacingFailures[code]}` : `${tool}: the request failed`
  );
}

/**
 * Asks the view and presents its answer. A view that rejects or throws — host code, whatever it
 * implements — fails the call with a fixed message; what it threw goes to the host's logger.
 */
async function _read<T, TOut>(
  ctx: IToolContext,
  tool: string,
  ask: () => Promise<TaskResult<T>>,
  present: (value: T) => TaskResult<TOut>
): Promise<Result<TOut>> {
  return (await captureAsyncResult(async () => (await ask()).onSuccess(present)))
    .onFailure((message) => {
      ctx.logger?.error(`${tool}: the task view threw: ${message}`);
      return fail(`${tool}: the task view failed`);
    })
    .onSuccess((result) => _toolResult(ctx, tool, result));
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
            ctx,
            name,
            () => ctx.view.query(request),
            (page) => {
              if (page.issues.length > 0) {
                ctx.logger?.warn(`${name}: the view reported: ${page.issues.join('; ')}`);
              }
              return presentPage(ctx.renderer, ctx.budget, page);
            }
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
            ctx,
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
 * nothing is returned in its place, and nothing falls back to a less-projected value.
 *
 * **A failure tells the model a code, never host text.** A failure the view or the rendering
 * reports reaches the model as its code and a fixed description; the underlying message — which can
 * carry a projector's error, a storage detail or a thrown exception — goes only to `logger`. Only a
 * failure of the model's own arguments is described in full, cut at 500 characters.
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
      const ctx: IToolContext = { view: params.view, renderer: r, budget, logger: params.logger };
      return succeed([_queryTool(ctx), _inspectTool(ctx)]);
    })
  );
}
