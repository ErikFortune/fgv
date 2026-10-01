/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { AiAssist } from '@fgv/ts-extras';
import {
  Converter,
  Converters,
  Result,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import { boundedArrayOf } from '../converters';
import {
  IBoundTaskWriter,
  IStopRequest,
  IStopResult,
  ITaskEnvironment,
  ITaskFailure,
  ITaskStopToolResult,
  ITaskStopToolTarget,
  OperationId,
  StopMode,
  StopTargetState,
  TaskId,
  TaskResult,
  defaultMaxStopTargets
} from '../types';
import {
  ITaskStopInspectToolArgs,
  ITaskStopToolArgs,
  taskStopInspectSchema,
  taskStopSchema
} from './schemas';
import {
  IFailureWording,
  IToolContext,
  argumentMessage,
  askView,
  convertAnswer,
  mintOperationId,
  viewWording
} from './toolSupport';

/**
 * What the stop tools are built over, beyond what every tool has: the writer — the same binding the
 * view is — where operation ids come from, and the modes the host offers.
 * @internal
 */
export interface IStopToolContext extends IToolContext {
  readonly writer: IBoundTaskWriter;
  readonly environment: Pick<ITaskEnvironment, 'newOperationId'>;
  readonly modes: ReadonlyArray<StopMode>;
}

/** What a stop result must describe: the stop asked about, on the task asked about. */
interface IExpectedStop {
  readonly taskId: TaskId;
  readonly intentId: OperationId;
  /** The mode asked for; absent for an inspection, which may name a stop of either. */
  readonly mode?: StopMode;
}

const stopAnnotations: AiAssist.IAiToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false
};

const inspectAnnotations: AiAssist.IAiToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};

/**
 * The wording for a stop request. Only `unsupported` — the task cannot be the root of this stop,
 * which the broker decides before it writes anything — is a known outcome. Every other failure may
 * follow an accepted stop: after the commit the broker presents the stop, and that can fail with a
 * storage code, with `conflict` when the intent or policy moved meanwhile, and with
 * `not-found-or-denied` when the root was hidden meanwhile. So the model is told the intent id the
 * stop would have — the tool minted it before asking, and inspecting it says whether the stop exists.
 * The tail is the same for a denied, hidden or missing task, so it discloses nothing. A retry is
 * harmless either way — a second stop of a mode already latched on the task is refused — but it
 * would be refused, not answered.
 */
function _stopWording(intentId: OperationId): IFailureWording {
  return {
    thrown: 'the task writer failed',
    unclassified: 'the request failed',
    determinate: ['unsupported'],
    unknownOutcome:
      `; the stop may or may not have been accepted — if it was, its intentId is ${intentId}: ` +
      'inspect it with task_stop_inspect before requesting it again'
  };
}

/**
 * The converter for what a view or writer answers about a stop, applied before anything reads it.
 *
 * @remarks
 * Any `IBoundTaskWriter` (or view) may be passed, so its answer is converted, not trusted: every
 * field strictly, the target list bounded by the most targets a stop may capture and each task named
 * once, and the answer must be for the stop and root asked about — and for a request, the mode asked
 * for. `expected` is the tool's own copy, captured before the writer or view is asked.
 */
function _stopResult(ctx: IToolContext, expected: IExpectedStop): Converter<IStopResult> {
  const stops = ctx.renderer.converters.stops;
  return Converters.strictObject<IStopResult>({
    intentId: ctx.renderer.converters.ids.operationId,
    rootId: ctx.renderer.converters.ids.taskId,
    mode: stops.mode,
    state: stops.intentState,
    targets: boundedArrayOf(stops.projectedTarget, defaultMaxStopTargets, 'stop targets'),
    restrictedWorkRemains: Converters.boolean,
    capacity: ctx.renderer.converters.failures.capacityFailure.optional()
  }).withConstraint((value: IStopResult): Result<IStopResult> => {
    if (
      value.intentId !== expected.intentId ||
      value.rootId !== expected.taskId ||
      (expected.mode !== undefined && value.mode !== expected.mode)
    ) {
      return fail(
        `the result is for stop ${value.intentId} (${value.mode}) of ${value.rootId}, not the stop asked about`
      );
    }
    const seen: Set<string> = new Set<string>();
    for (const target of value.targets) {
      if (seen.has(target.taskId)) {
        return fail(`the result lists ${target.taskId} twice`);
      }
      seen.add(target.taskId);
    }
    return succeed(value);
  });
}

/**
 * Presents one stop to the model: counts over every visible target, one page of them after `after`,
 * and how many follow. The host's capacity refusal, and each target's attempt and command key, are
 * not presented; a capacity refusal goes to the logger.
 */
function _presentStop(
  ctx: IToolContext,
  tool: string,
  result: IStopResult,
  after: TaskId | undefined
): TaskResult<ITaskStopToolResult> {
  if (result.capacity !== undefined) {
    ctx.logger?.warn(
      `${tool}: stop ${result.intentId} met a capacity refusal on '${result.capacity.dimension}'`
    );
  }
  const start: number = after === undefined ? 0 : result.targets.findIndex((t) => t.taskId === after) + 1;
  if (start === 0 && after !== undefined) {
    // The task named is not a target this principal may see now — hidden, or never a target — and
    // the two read alike. Visibility can change between pages, so the model starts again.
    return failWithDetail<ITaskStopToolResult, ITaskFailure>(
      `${after} is not a visible target of stop ${result.intentId}`,
      { code: 'cursor-stale', retry: 'safe' }
    );
  }
  const counts: Partial<Record<StopTargetState, number>> = {};
  for (const target of result.targets) {
    counts[target.state] = (counts[target.state] ?? 0) + 1;
  }
  const page: ReadonlyArray<ITaskStopToolTarget> = result.targets
    .slice(start, start + ctx.budget.context.maxItems)
    .map((target) => ({
      taskId: target.taskId,
      state: target.state,
      ...(target.confirmedRevision !== undefined ? { confirmedRevision: target.confirmedRevision } : {}),
      ...(target.violation !== undefined ? { violation: target.violation } : {})
    }));
  const remaining: number = result.targets.length - start - page.length;
  return succeedWithDetail<ITaskStopToolResult, ITaskFailure>({
    intentId: result.intentId,
    taskId: result.rootId,
    mode: result.mode,
    state: result.state,
    counts,
    targets: page,
    remaining,
    ...(remaining > 0 ? { nextAfter: page[page.length - 1].taskId } : {}),
    restrictedWorkRemains: result.restrictedWorkRemains
  });
}

/** The description's lead, naming exactly the modes offered. */
function _lead(modes: ReadonlyArray<StopMode>): string {
  const verb: string = modes.length > 1 ? 'Pause or cancel' : modes[0] === 'pause' ? 'Pause' : 'Cancel';
  return `${verb} a task and every task under it — including tasks you cannot see.`;
}

function _stopTool(ctx: IStopToolContext): AiAssist.IAiClientTool {
  const name: string = 'task_stop';
  const schema = taskStopSchema(ctx.modes);
  const request = async (args: ITaskStopToolArgs): Promise<Result<ITaskStopToolResult>> =>
    mintOperationId(ctx, ctx.environment, name)
      .onSuccess((operationId) =>
        ctx.renderer.converters.stops.request
          .convert({
            taskId: args.taskId,
            expectedRevision: args.expectedRevision,
            operationId,
            mode: args.mode
          })
          .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
      )
      .thenOnSuccess((stop: IStopRequest) => {
        // What the result must describe: the tool's own copy, captured before the writer is handed
        // the request — a writer that rewrote the request in place cannot move it.
        const expected: IExpectedStop = { taskId: stop.taskId, intentId: stop.operationId, mode: stop.mode };
        return askView(
          ctx,
          name,
          () => ctx.writer.requestStop(stop),
          (answer) =>
            convertAnswer(
              _stopResult(ctx, expected),
              answer,
              "writer's stop result",
              'commit-indeterminate'
            ).onSuccess((result) => _presentStop(ctx, name, result, undefined)),
          _stopWording(expected.intentId)
        );
      });
  return {
    config: {
      type: 'client_tool',
      name,
      description:
        `${_lead(ctx.modes)} Pass the revision task_inspect returned; only a task whose stop policy ` +
        'permits it can be stopped. This records the stop and freezes the tree — nothing in it may ' +
        'start or resume — but the host carries it out: the result is pending until then. Returns the ' +
        "stop's intentId; follow it with task_stop_inspect. A stop cannot be released with these tools.",
      parametersSchema: schema,
      annotations: stopAnnotations
    },
    // `execute` re-validates: a direct call reaches it without any harness in front.
    execute: async (args: unknown): Promise<Result<unknown>> =>
      schema
        .convert(args)
        .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
        .thenOnSuccess(request)
  };
}

/** A model's inspection arguments, converted to the ids they name. */
interface IStopInspection {
  readonly taskId: TaskId;
  readonly intentId: OperationId;
  readonly after?: TaskId;
}

function _inspectStopTool(ctx: IStopToolContext): AiAssist.IAiClientTool {
  const name: string = 'task_stop_inspect';
  const ids = ctx.renderer.converters.ids;
  const converted = (args: ITaskStopInspectToolArgs): Result<IStopInspection> =>
    Converters.strictObject<IStopInspection>({
      taskId: ids.taskId,
      intentId: ids.operationId,
      after: ids.taskId.optional()
    }).convert(args);
  return {
    config: {
      type: 'client_tool',
      name,
      description:
        "Read a stop's current state: the stop, and a page of the tasks under it you can see with where " +
        'each stands. Continue with nextAfter. It says only that some task you cannot see is not yet ' +
        'stopped, never which.',
      parametersSchema: taskStopInspectSchema,
      annotations: inspectAnnotations
    },
    // `execute` re-validates: a direct call reaches it without any harness in front.
    execute: async (args: unknown): Promise<Result<unknown>> =>
      taskStopInspectSchema
        .convert(args)
        .onSuccess(converted)
        .withErrorFormat((message) => argumentMessage(name, `invalid arguments: ${message}`))
        .thenOnSuccess(({ taskId, intentId, after }) => {
          const expected: IExpectedStop = { taskId, intentId };
          return askView(
            ctx,
            name,
            () => ctx.view.inspectStop({ taskId, intentId }),
            (answer) =>
              convertAnswer(_stopResult(ctx, expected), answer, "view's stop result").onSuccess((result) =>
                _presentStop(ctx, name, result, after)
              ),
            viewWording
          );
        })
  };
}

/**
 * The stop tools a host opted into: `task_stop` for the modes it offers, and `task_stop_inspect`.
 * @internal
 */
export function stopTools(ctx: IStopToolContext): ReadonlyArray<AiAssist.IAiClientTool> {
  return [_stopTool(ctx), _inspectStopTool(ctx)];
}
