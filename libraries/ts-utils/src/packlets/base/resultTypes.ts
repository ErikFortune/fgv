/*
 * Copyright (c) 2020 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type {
  AsyncFailureContinuation,
  AsyncResult,
  AsyncSuccessContinuation,
  DetailedResult,
  Failure,
  Success
} from './result';

/*
 * The `Result` contract: every type and interface the Result family declares,
 * separated from the classes that implement them.
 *
 * Split out of `result.ts` because that file reached the 2000-line `max-lines`
 * cap, which is a CI failure rather than a warning (`rush rebuild` exits
 * non-zero on SUCCESS WITH WARNINGS while a per-project `rushx lint` exits 0).
 *
 * This seam rather than moving `AsyncResult`: these declarations are types only,
 * so the import back to `./result` is erased and no runtime cycle exists. Moving
 * the async classes would have created a real one — `Success.thenOnSuccess` and
 * three siblings construct `new AsyncResult(...)` at call time, in ten places.
 *
 * `result.ts` re-exports everything here, so the barrel and every consumer path
 * are unchanged; `etc/ts-utils.api.md` is the check that stayed true.
 */

/**
 * Represents the {@link IResult | result} of some operation or sequence of operations.
 * @remarks
 * {@link Success | Success<T>} and {@link Failure | Failure<T>} share the common
 * contract {@link IResult}, enabling commingled discriminated usage.
 * @public
 */
export type Result<T> = Success<T> | Failure<T>;

/**
 * Represents a deferred result that will be evaluated if needed.
 * @public
 */
export type DeferredResult<T> = () => Result<T>;

/**
 * Checks if a result is a deferred result.
 * @param result - The result to check.
 * @returns `true` if the result is a deferred result, `false` otherwise.
 * @public
 */
export function isDeferredResult<T>(result: Result<T> | DeferredResult<T>): result is DeferredResult<T> {
  return typeof result === 'function';
}

/**
 * Continuation callback to be called in the event that an
 * {@link Result} is successful.
 * @public
 */
export type SuccessContinuation<T, TN> = (value: T) => Result<TN>;

/**
 * Continuation callback to be called in the event that an
 * {@link Result} fails.
 * @public
 */
export type FailureContinuation<T> = (message: string) => Result<T>;

/**
 * Type inference to determine the result type of an {@link Result}.
 * @beta
 */
export type ResultValueType<T> = T extends Result<infer TV> ? TV : never;

/**
 * Type inference to determine the result type of an {@link IResult}.
 * @beta
 */
export type IResultValueType<T> = T extends IResult<infer TV> ? TV : never;

/**
 * Type inference to determine the value type returned from a result-map style
 * `get` method.
 * @remarks
 * Useful for extracting collection entry types from maps whose `get` method
 * returns an {@link IResult}.
 * @beta
 */
export type ResultMapValueType<TCollection extends { get: (...args: readonly unknown[]) => unknown }> =
  Exclude<IResultValueType<ReturnType<TCollection['get']>>, undefined>;

/**
 * Formats an error message.
 * @param message - The error message to be formatted.
 * @param detail - An optional detail to be included in the formatted message.
 * @public
 */
export type ErrorFormatter<TD = unknown> = (message: string, detail?: TD) => string;

/**
 * Simple logger interface used by {@link IResult.orThrow | orThrow(logger)} and {@link IResult.orThrow | orThrow(formatter)}.
 * @public
 */
export interface IResultLogger<TD = unknown> {
  /**
   * Log an error message.
   * @param message - The message to be logged.
   */
  error(message: string, detail?: TD): void;
}

/**
 * The severity level at which a message should be logged.
 * @public
 */
export type MessageLogLevel = 'quiet' | 'detail' | 'info' | 'warning' | 'error';

// Untyped (literal-tuple-inferred) source of truth for allMessageLogLevels, kept separate from the
// widened public export below so the exhaustiveness check actually inspects the literal values instead
// of being widened away to `MessageLogLevel` before the check runs.
const messageLogLevelValues = ['quiet', 'detail', 'info', 'warning', 'error'] as const;

/**
 * Compile-time exhaustiveness guard ensuring {@link messageLogLevelValues} exactly matches every member of
 * {@link MessageLogLevel}. Adding or removing a union member without updating the array fails the build.
 * Deliberately not exported - this exists only to force the compiler to evaluate the check below.
 */
type _MessageLogLevelExhaustivenessCheck = [
  Exclude<MessageLogLevel, (typeof messageLogLevelValues)[number]>,
  Exclude<(typeof messageLogLevelValues)[number], MessageLogLevel>
] extends [never, never]
  ? true
  : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _messageLogLevelExhaustivenessCheck: _MessageLogLevelExhaustivenessCheck = true;

/**
 * Exhaustive list of all {@link MessageLogLevel} values.
 * @public
 */
export const allMessageLogLevels: readonly MessageLogLevel[] = messageLogLevelValues;

/**
 * Details for reporting a message.
 * @public
 */
export interface IMessageReportDetail<TD = unknown> {
  level?: MessageLogLevel;
  message?: ErrorFormatter<TD>;
  detail?: TD;
}

/**
 * Options for reporting a result.
 * @public
 */
export interface IResultReportOptions<TD = unknown> {
  /**
   * The level of reporting to be used for failure results.  Default is 'error'.
   */
  failure?: MessageLogLevel | IMessageReportDetail<TD>;

  /**
   * The level of reporting to be used for success results.  Default is 'quiet'.
   */
  success?: MessageLogLevel | IMessageReportDetail<TD>;
}

/**
 * Interface for reporting a result.
 * @public
 */
export interface IResultReporter<T, TD = unknown> {
  /** Reports a successful result at the specified log level. */
  reportSuccess(level: MessageLogLevel, value: T, detail?: TD, message?: ErrorFormatter<TD>): void;
  /** Reports a failed result at the specified log level. */
  reportFailure(level: MessageLogLevel, message: string, detail?: TD): void;
}

/**
 * Simple error aggregator to simplify collecting all errors in
 * a flow.
 * @public
 */
export interface IMessageAggregator {
  /**
   * Indicates whether any messages have been aggregated.
   */
  readonly hasMessages: boolean;

  /**
   * The number of messages aggregated.
   */
  readonly numMessages: number;

  /**
   * The aggregated messages.
   */
  readonly messages: ReadonlyArray<string>;

  /**
   * Adds a message to the aggregator, if defined.
   * @param message - The message to add - pass `undefined`
   * or the empty string to continue without adding a message.
   */
  addMessage(message: string | undefined): this;

  /**
   * Adds multiple messages to the aggregator.
   * @param messages - the messages to add.
   */
  addMessages(messages: string[] | undefined): this;

  /**
   * Returns all messages as a single string joined
   * using the optionally-supplied `separator`, or
   * newline if no separator is specified.
   * @param separator - The optional separator used
   * to join strings.
   */
  toString(separator?: string): string;
}

/**
 * Represents the result of some operation of sequence of operations.
 * @remarks
 * This common contract enables commingled discriminated usage of {@link Success | Success<T>}
 * and {@link Failure | Failure<T>}.
 * @public
 */
export interface IResult<T> {
  /**
   * Indicates whether the operation was successful.
   */
  readonly success: boolean;

  /**
   * Value returned by a successful operation, undefined
   * for a failed operation.
   */
  readonly value: T | undefined;

  /**
   * Error message returned by a failed operation, undefined
   * for a successful operation.
   */
  readonly message: string | undefined;

  /**
   * Indicates whether this operation was successful.  Functions
   * as a type guard for {@link Success | Success<T>}.
   */
  isSuccess(): this is Success<T>;

  /**
   * Indicates whether this operation failed.  Functions
   * as a type guard for {@link Failure | Failure<T>}.
   */
  isFailure(): this is Failure<T>;

  /**
   * Gets the value associated with a successful {@link IResult | result},
   * or throws the error message if the corresponding operation failed.
   *
   * Note that `getValueOrThrow` is being superseded by `orThrow` and
   * will eventually be deprecated.  Please use orDefault instead.
   *
   * @param logger - An optional {@link IResultLogger | logger} to which the
   * error will also be reported.
   * @returns The return value, if the operation was successful.
   * @throws The error message if the operation failed.
   * @deprecated Use {@link IResult.orThrow | orThrow(logger)} or {@link IResult.orThrow | orThrow(formatter)} instead.
   */
  getValueOrThrow(logger?: IResultLogger): T;

  /**
   * Gets the value associated with a successful {@link IResult | result},
   * or a default value if the corresponding operation failed.
   * @param dflt - The value to be returned if the operation failed (default is
   * `undefined`).
   *
   * Note that `getValueOrDefault` is being superseded by `orDefault` and
   * will eventually be deprecated.  Please use orDefault instead.
   *
   * @returns The return value, if the operation was successful.  Returns
   * the supplied default value or `undefined` if no default is supplied.
   * @deprecated Use {@link IResult.orDefault | orDefault(T)} or {@link IResult.orDefault | orDefault()} instead.
   */
  getValueOrDefault(dflt?: T): T | undefined;

  /**
   * Gets the value associated with a successful {@link IResult | result},
   * or throws the error message if the corresponding operation failed.
   * @param logger - An optional {@link IResultLogger | logger} to which the
   * error will also be reported.
   * @returns The return value, if the operation was successful.
   * @throws The error message if the operation failed.
   * {@label logger}
   */
  orThrow(logger?: IResultLogger): T;

  /**
   * Gets the value associated with a successful {@link IResult | result},
   * or throws the error message if the corresponding operation failed.
   * @param cb - The {@link ErrorFormatter | error formatter} to be called in the event of failure.
   * @returns The return value, if the operation was successful.
   * @throws The error message if the operation failed.
   * {@label formatter}
   */
  orThrow(cb: ErrorFormatter): T;

  /**
   * Asserts at the call site that this {@link IResult | result} MUST be a success.
   * Returns the value on success; on failure, throws an `Error` whose message
   * is composed from the original failure message and the captured call-site
   * location (file, line, and where useful function name).
   *
   * @remarks
   * Use for declaration-time / setup-time invariants — module-level `const`
   * initializers, static class properties, static initialization blocks, and
   * test fixtures — where a failure indicates a coding bug that should
   * surface at the call site rather than propagate as a `Result`. For chains
   * where the throw is intentional control flow, prefer `orThrow`.
   *
   * On V8 (Node + Chromium) `Error.captureStackTrace` is used to elide
   * `shouldNotFail` itself from the captured stack so the parsed frame is
   * the user's call site directly. On WebKit (where `captureStackTrace` is
   * unavailable) the stack is parsed manually and frames whose **parsed
   * function name** contains `shouldNotFail` are filtered out — the raw
   * stack-line text (including the file path) is deliberately NOT inspected,
   * so consumer files named after `shouldNotFail` are not collateral damage.
   * Function names and exact line numbers depend on source-map availability
   * in the runtime. When no caller frame is recoverable (e.g. `frameDepth`
   * out of range, or `frameDepth: 0`) the message falls back to the
   * label-only form (or the bare original message when no label is given).
   *
   * Error message format (depending on whether a label and a usable function
   * name are available):
   * - both: `<label> (at <fn> in <file>:<line>): <original>`
   * - label only: `<label> (at <file>:<line>): <original>`
   * - fn only: `<fn> at <file>:<line>: <original>`
   * - neither: `<file>:<line>: <original>`
   *
   * @param label - Optional human-meaningful identifier (e.g. the constant
   * name) prefixed to the error message.
   * @param frameDepth - Optional 1-indexed depth into the caller stack.
   * Default `1` (immediate caller). Library authors wrapping `shouldNotFail`
   * inside their own helper pass `2` to attribute to their caller.
   * @returns The result value, if the operation was successful.
   * @throws `Error` if the result was a failure.
   */
  shouldNotFail(label?: string, frameDepth?: number): T;

  /**
   * Gets the value associated with a successful {@link IResult | result},
   * or a default value if the corresponding operation failed.
   * @param dflt - The value to be returned if the operation failed.
   * @returns The return value, if the operation was successful.  Returns
   * the supplied default if an error occurred.
   * {@label SUPPLIED}
   */
  orDefault(dflt: T): T;

  /**
   * Gets the value associated with a successful {@link IResult | result},
   * or a default value if the corresponding operation failed.
   * @returns The return value, if the operation was successful, or
   * `undefined` if an error occurs.
   * {@label MISSING}
   */
  orDefault(): T | undefined;

  /**
   * Gets the value associated with a successful {@link IResult | result}, or a
   * default produced by the supplied callback if the corresponding operation
   * failed.
   *
   * @remarks
   * The deferring sibling of {@link IResult.orDefault | orDefault(T)}. The
   * callback runs **only on failure**, so an expensive default — a computation, a
   * file read, an allocation — costs nothing on the success path. Reach for this
   * whenever the default is anything more than a literal or an already-held
   * value; `orDefault(expensive())` evaluates its argument before the call and
   * pays that cost every time, which is a defect a reader has to look at the
   * *argument* to spot.
   *
   * The name follows this library's `with*` convention for a method that takes a
   * callback (see {@link IResult.withErrorFormat | withErrorFormat}).
   * @param cb - Produces the default. Invoked only when the operation failed.
   * @returns The result value if the operation succeeded, otherwise the value
   * returned by `cb`.
   */
  orDefaultWith(cb: () => T): T;

  /**
   * Calls a supplied {@link SuccessContinuation | success continuation} if
   * the operation was a success.
   * @remarks
   * The {@link SuccessContinuation | success continuation} might return a
   * different result type than {@link IResult} on which it is invoked. This
   * enables chaining of operations with heterogenous return types.
   *
   * @param cb - The {@link SuccessContinuation | success continuation} to
   * be called in the event of success.
   * @returns If this operation was successful, returns the value returned
   * by the {@link SuccessContinuation | success continuation}.  If this result
   * failed, propagates the error message from this failure.
   */
  onSuccess<TN>(cb: SuccessContinuation<T, TN>): Result<TN>;

  /**
   * Calls a supplied {@link FailureContinuation | failed continuation} if
   * the operation failed.
   * @param cb - The {@link FailureContinuation | failure continuation} to
   * be called in the event of failure.
   * @returns If this operation failed, returns the value returned by the
   * {@link FailureContinuation | failure continuation}.  If this result
   * was successful, propagates the result value from the successful event.
   */
  onFailure(cb: FailureContinuation<T>): Result<T>;

  /**
   * Calls a supplied {@link AsyncSuccessContinuation | async success continuation} if
   * the operation was a success, bridging into an {@link AsyncResult} chain.
   * @remarks
   * If the async callback rejects, the rejection is caught and converted
   * to a {@link Failure}.
   * @param cb - The {@link AsyncSuccessContinuation | async success continuation} to
   * be called in the event of success.
   * @returns An {@link AsyncResult} wrapping the async continuation result, or
   * propagating the error message from this failure.
   */
  thenOnSuccess<TN>(cb: AsyncSuccessContinuation<T, TN>): AsyncResult<TN>;

  /**
   * Calls a supplied {@link AsyncFailureContinuation | async failure continuation} if
   * the operation failed, bridging into an {@link AsyncResult} chain.
   * @remarks
   * If the async callback rejects, the rejection is caught and converted
   * to a {@link Failure}.
   * @param cb - The {@link AsyncFailureContinuation | async failure continuation} to
   * be called in the event of failure.
   * @returns An {@link AsyncResult} wrapping the async continuation result, or
   * propagating the success value from this result.
   */
  thenOnFailure(cb: AsyncFailureContinuation<T>): AsyncResult<T>;

  /**
   * Calls a supplied {@link ErrorFormatter | error formatter} if
   * the operation failed.
   * @param cb - The {@link ErrorFormatter | error formatter} to
   * be called in the event of failure.
   * @returns If this operation failed, returns the returns {@link Failure | Failure}
   * with the message returned by the formatter.  If this result
   * was successful, propagates the result value from the successful event.
   */
  withErrorFormat(cb: ErrorFormatter): Result<T>;

  /**
   * Converts a {@link IResult | IResult<T>} to a {@link DetailedResult | DetailedResult<T, TD>},
   * adding a supplied detail if the operation failed.
   * @param detail - The detail to be added if this operation failed.
   * @returns A new {@link DetailedResult | DetailedResult<T, TD>} with either
   * the success result or the error message from this {@link IResult}, with
   * the supplied detail (if this event failed) or detail `undefined` (if
   * this result succeeded).
   */
  withFailureDetail<TD>(detail: TD): DetailedResult<T, TD>;

  /**
   * Converts a {@link IResult | IResult<T>} to a {@link DetailedResult | DetailedResult<T, TD>},
   * adding supplied details.
   * @param detail - The default detail to be added to the new {@link DetailedResult}.
   * @param successDetail - An optional detail to be added if this result was successful.
   * @returns A new {@link DetailedResult | DetailedResult<T, TD>} with either
   * the success result or the error message from this {@link IResult} and the
   * appropriate added detail.
   */
  withDetail<TD>(detail: TD, successDetail?: TD): DetailedResult<T, TD>;

  /**
   * Propagates interior result, appending any error message to the
   * supplied errors array.
   * @param errors - {@link IMessageAggregator | Error aggregator} in which
   * errors will be aggregated.
   * @param formatter - An optional {@link ErrorFormatter | error formatter} to be used to format the error message.
   */
  aggregateError(errors: IMessageAggregator, formatter?: ErrorFormatter): this;

  /**
   * Reports the result to the supplied reporter
   * @param reporter - The {@link IResultReporter | reporter} to which the result will be reported.
   * @param options - The {@link IResultReportOptions | options} for reporting the result.
   */
  report(reporter?: IResultReporter<T>, options?: IResultReportOptions<unknown>): Result<T>;
}
