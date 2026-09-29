/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { AiAssist } from '@fgv/ts-extras';
import { JsonSchema } from '@fgv/ts-json-base';
import { Converters, Logging, Result, fail, succeed } from '@fgv/ts-utils';
import { TaskContextRenderer } from '../context';
import {
  IBoundTaskQuery,
  IBoundTaskView,
  IBoundTaskWriter,
  ITaskCommandToolSpec,
  ITaskEnvironment,
  ITaskKindRegistry,
  ITaskToolBudget,
  TaskId,
  TaskMutationToolGroup,
  allTaskMutationToolGroups,
  defaultTaskToolBudget
} from '../types';
import { commandTools, resolveCommandTools } from './commandTools';
import { mutationTools } from './mutationTools';
import { presentInspection, presentPage } from './presentation';
import { ITaskInspectToolArgs, ITaskQueryToolArgs, taskInspectSchema, taskQuerySchema } from './schemas';
import { IToolContext, argumentMessage, askView, convertAnswer } from './toolSupport';
import { buildViewAnswerConverters } from './viewAnswers';
import { buildWriterAnswerConverters } from './writerAnswers';

/**
 * The mutation tools a host opts into, and what they need to run.
 * @remarks
 * Opting in makes tools available to the model; it authorizes nothing. Every call is authorized by
 * `writer`'s policy when it runs, exactly as a direct call to the writer would be.
 * @public
 */
export interface ITaskMutationToolOptions {
  /**
   * The writer every mutation goes through. It must be the very object passed as `view`: the
   * revision the model reads is then the revision the writer checks, under one principal, one set
   * of scopes and one policy.
   */
  readonly writer: IBoundTaskWriter;
  /**
   * Mints each call's operation id, and a new task's id. The model never supplies either. Usually
   * the host's `TaskEnvironment`.
   */
  readonly environment: Pick<ITaskEnvironment, 'newTaskId' | 'newOperationId'>;
  /** The tool groups to offer. An empty list offers none. */
  readonly enable: ReadonlyArray<TaskMutationToolGroup>;
}

/**
 * The registered commands a host offers the model as tools, and what they need to run.
 * @remarks
 * Offering a command makes a tool available; it authorizes nothing. Every call is authorized by
 * `writer`'s policy when it runs, exactly as a direct `execute` would be.
 * @public
 */
export interface ITaskCommandToolOptions {
  /** The writer every command goes through. It must be the very object passed as `view`. */
  readonly writer: IBoundTaskWriter;
  /**
   * The registry each offered command is looked up in, for its parameter schema — the one the
   * broker's repository was opened with. The broker validates every command against its own
   * registry whatever the tool offered, so a mismatched one can only make a call fail.
   */
  readonly registry: ITaskKindRegistry;
  /** Mints each call's operation id. The model never supplies one. Usually the host's `TaskEnvironment`. */
  readonly environment: Pick<ITaskEnvironment, 'newOperationId'>;
  /** The commands to offer, one tool each, in this order. An empty list offers none. */
  readonly enable: ReadonlyArray<ITaskCommandToolSpec>;
}

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
  /**
   * Mutation tools to offer beside the read tools. Absent — the default — offers none: the tools
   * are exactly `task_query` and `task_inspect`.
   */
  readonly mutations?: ITaskMutationToolOptions;
  /**
   * Registered commands to offer as tools. Absent — the default — offers none.
   */
  readonly commands?: ITaskCommandToolOptions;
}

const readOnlyAnnotations: AiAssist.IAiToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

/** A view query and the page size it asks for, which is also the most a page may answer with. */
interface IQueryPlan {
  readonly request: IBoundTaskQuery;
  readonly limit: number;
}

/** The view query a model's arguments describe, validated by the view's own request converter. */
function _queryRequest(ctx: IToolContext, args: ITaskQueryToolArgs): Result<IQueryPlan> {
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
  return ctx.renderer.converters.broker.boundQuery
    .convert({
      ...(Object.keys(filter).length > 0 ? { filter } : {}),
      limit,
      ...(args.cursor !== undefined ? { cursor: args.cursor } : {})
    })
    .onSuccess((request) => succeed({ request, limit }));
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
        .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
        .thenOnSuccess(({ request, limit }) =>
          askView(
            ctx,
            name,
            () => ctx.view.query(request),
            (answer) =>
              convertAnswer(ctx.answers.page(limit), answer, "view's page").onSuccess((page) => {
                if (page.issues.length > 0) {
                  ctx.logger?.warn(`${name}: the view reported: ${page.issues.join('; ')}`);
                }
                return presentPage(ctx.renderer, ctx.budget, page);
              })
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
        .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
        .thenOnSuccess((id: TaskId) =>
          askView(
            ctx,
            name,
            () => ctx.view.inspect(id),
            (answer) =>
              convertAnswer(ctx.answers.inspection, answer, "view's inspection").onSuccess((inspection) =>
                presentInspection(ctx.renderer, ctx.budget, inspection)
              )
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
 * Validates a host's mutation opt-in: the writer must be the view, and the groups known ones. Asks
 * nothing of the writer or the environment — opting in is not authorizing.
 */
function _mutationGroups(
  view: IBoundTaskView,
  mutations: ITaskMutationToolOptions | undefined
): Result<ReadonlySet<TaskMutationToolGroup>> {
  if (mutations === undefined) {
    return succeed(new Set<TaskMutationToolGroup>());
  }
  if (mutations.writer !== view) {
    return fail('task tools: mutations.writer must be the view the tools read through');
  }
  return Converters.arrayOf(Converters.enumeratedValue<TaskMutationToolGroup>(allTaskMutationToolGroups))
    .convert(mutations.enable)
    .onSuccess((groups) => succeed(new Set(groups)))
    .withErrorFormat((message) => `task tools: invalid mutations.enable: ${message}`);
}

/**
 * Builds the task tools over a principal-bound view, ready to hand to
 * `AiAssist.executeClientToolTurn`: `task_query` and `task_inspect`, and — only when the host opts
 * in through `mutations` — `task_create`, `task_update` and `task_reassign`, and — only when it opts
 * in through `commands` — one tool per registered command it names.
 *
 * @remarks
 * **Read-only by default, with no mutation dependency.** Without `mutations` the tools take an
 * {@link IBoundTaskView} and call only its `query` and `inspect`.
 *
 * **Mutations are opt-in, and opting in authorizes nothing.** With `mutations`, each opted-in tool
 * calls one writer method — `createTracked`, `updateTracked` or `reassign` — and the writer's policy
 * decides every call when it runs. The model supplies no operation id and no new task id (the tool
 * mints both), no scope and no source binding. A change to an existing task carries the revision
 * `task_inspect` returned as its `expectedRevision`, and the writer refuses it if the task has moved
 * since. A writer's receipt is converted, and must be for the task and operation asked about, before
 * anything reads it; the model is told the task id, revision and disposition, never update ids.
 *
 * **Commands are opt-in, typed by the registry, and never resent by the model.** Each offered command
 * is looked up in `commands.registry` when the tools are built, and its tool's wire schema carries the
 * command's registered parameter schema. A call is sent through the writer's `execute` with a minted
 * operation id, only to a task of the command's own kind and detail version; the model is told
 * `accepted` or `applied`, a refusal as a fixed code line (`denied` reads exactly as a missing task),
 * and otherwise that the outcome is not known and it must not send the command again — the host's
 * `resolveCommands` pump settles it under the same key. No text a source or host wrote reaches the
 * model. A generated name may not be a fixed tool's, and two may not clash: the set is refused at
 * build time.
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
    _budget(r, params.budget ?? defaultTaskToolBudget).onSuccess((budget) =>
      _mutationGroups(params.view, params.mutations).onSuccess((groups) => {
        const ctx: IToolContext = {
          view: params.view,
          renderer: r,
          answers: buildViewAnswerConverters(r.converters),
          budget,
          logger: params.logger
        };
        const receipts = buildWriterAnswerConverters(r.converters);
        const mutations: ReadonlyArray<AiAssist.IAiClientTool> =
          params.mutations !== undefined && groups.size > 0
            ? mutationTools(
                {
                  ...ctx,
                  writer: params.mutations.writer,
                  environment: params.mutations.environment,
                  receipts
                },
                groups
              )
            : [];
        return _commands(ctx, params.commands, receipts).onSuccess((commands) =>
          succeed([_queryTool(ctx), _inspectTool(ctx), ...mutations, ...commands])
        );
      })
    )
  );
}

/**
 * Builds the command tools a host offered. The writer must be the view; each command is looked up in
 * the registry — never the policy — and the names must be free. Asks nothing of the writer or the
 * environment: offering a command is not authorizing it.
 */
function _commands(
  ctx: IToolContext,
  options: ITaskCommandToolOptions | undefined,
  receipts: ReturnType<typeof buildWriterAnswerConverters>
): Result<ReadonlyArray<AiAssist.IAiClientTool>> {
  if (options === undefined) {
    return succeed([]);
  }
  if (options.writer !== ctx.view) {
    return fail('task tools: commands.writer must be the view the tools read through');
  }
  const commandCtx = {
    ...ctx,
    writer: options.writer,
    environment: options.environment,
    receipts
  };
  return resolveCommandTools(commandCtx, options.registry, options.enable).onSuccess((tools) =>
    succeed(commandTools(commandCtx, tools))
  );
}
