/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  Converter,
  Logging,
  Result,
  captureAsyncResult,
  fail,
  failWithDetail,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import { TaskContextRenderer } from '../context';
import { IBoundTaskView, ITaskFailure, ITaskToolBudget, TaskFailureCode, TaskResult } from '../types';
import { IViewAnswerConverters } from './viewAnswers';

/**
 * What every tool is built over: the bound view, the renderer, the converters for what the view
 * answers, the budget, and where host text goes.
 * @internal
 */
export interface IToolContext {
  readonly view: IBoundTaskView;
  readonly renderer: TaskContextRenderer;
  readonly answers: IViewAnswerConverters;
  readonly budget: ITaskToolBudget;
  readonly logger?: Logging.ILogger;
}

/**
 * The most characters of an argument-validation failure a tool returns. Those messages are about the
 * model's own arguments and can echo them, which have no length limit of their own.
 */
const maxMessageChars: number = 500;

/**
 * What the model is told for each failure the view, the writer or the rendering reports. The
 * underlying message is host-side text and never reaches the model: it goes to the host's logger.
 * @remarks
 * A code is the same whether a task does not exist, is not visible, or may not be changed by this
 * principal (`not-found-or-denied`), so the description says all three.
 */
const modelFacingFailures: Readonly<Record<TaskFailureCode, string>> = {
  invalid: 'the request was refused, or a task could not be presented',
  'not-found-or-denied': 'the task is not found or not visible, or this is not permitted on it',
  conflict:
    'the task changed, or does not accept this change now; inspect it again before deciding whether to retry',
  unsupported: 'the request is not supported',
  'storage-unavailable': 'task storage is unavailable; retry later',
  'storage-corrupt': 'task storage could not be read',
  'commit-indeterminate':
    'the outcome is not known: a change may or may not have been applied; inspect before retrying',
  'source-unavailable': 'a task source is unavailable; retry later',
  'source-gap': 'a task source could not be read completely',
  'unknown-kind-version': 'a task has a kind this host does not recognize',
  'invalid-receipt': 'the request was refused',
  'cursor-stale': 'the cursor is no longer valid; query again without it',
  'retention-blocked': 'the request was refused',
  backpressure: 'task storage is at capacity; retry later'
};

/**
 * An argument-validation failure as the model sees it: named by tool, and bounded.
 * @internal
 */
export function argumentMessage(tool: string, message: string): string {
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
 * A failure of the host's own configuration or code — not the model's arguments, and not a
 * classified task failure. The model is told the call failed; what failed goes to the logger.
 * @internal
 */
export function hostFailure<T>(ctx: IToolContext, tool: string, message: string): Result<T> {
  ctx.logger?.error(`${tool}: ${message}`);
  return fail(`${tool}: the request failed`);
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
 * Converts what the view or writer answered before anything reads it. Either is any implementation
 * of its interface, so its answer is not trusted; one that does not convert fails the call, and the
 * converter's message — which can quote the answer — goes to the host's logger with the rest of the
 * failure.
 * @param code - What the model is told. A view's malformed answer is `invalid`; a writer's is
 * `commit-indeterminate`, because the change it describes may already have been committed.
 * @internal
 */
export function convertAnswer<T>(
  converter: Converter<T>,
  answer: unknown,
  what: string,
  code: TaskFailureCode = 'invalid'
): TaskResult<T> {
  const converted: Result<T> = converter.convert(answer);
  return converted.isSuccess()
    ? succeedWithDetail<T, ITaskFailure>(converted.value)
    : failWithDetail<T, ITaskFailure>(`malformed ${what}: ${converted.message}`, {
        code,
        retry: 'after-host-action'
      });
}

/**
 * What the model is told when a view rejects or throws.
 * @internal
 */
export const viewFailed: string = 'the task view failed';

/**
 * What the model is told when a writer rejects or throws: the change may already be committed, and
 * a mutation tool mints fresh ids on every call, so a blind retry of a creation could duplicate it.
 * @internal
 */
export const writerFailed: string =
  'the task writer failed; the change may or may not have been applied — inspect before retrying';

/**
 * Asks the view (or the writer, which is the same binding) and presents its answer. One that
 * rejects or throws — host code, whatever it implements — fails the call with the fixed `failed`
 * message; what it threw goes to the host's logger.
 * @internal
 */
export async function askView<T, TOut>(
  ctx: IToolContext,
  tool: string,
  ask: () => Promise<TaskResult<T>>,
  present: (value: T) => TaskResult<TOut>,
  failed: string = viewFailed
): Promise<Result<TOut>> {
  return (await captureAsyncResult(async () => (await ask()).onSuccess(present)))
    .onFailure((message) => {
      ctx.logger?.error(`${tool}: the task view or writer threw: ${message}`);
      return fail(`${tool}: ${failed}`);
    })
    .onSuccess((result) => _toolResult(ctx, tool, result));
}
