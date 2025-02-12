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

/* eslint-disable no-use-before-define */
/**
 * Represents the {@link IResult | result} of some operation or sequence of operations.
 * @remarks
 * {@link Success | Success<T>} and {@link Failure | Failure<T>} share the common
 * contract {@link IResult}, enabling commingled discriminated usage.
 * @public
 */
export type Result<T> = Success<T> | Failure<T>;
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
 * Formats an error message.
 * @param message - The error message to be formatted.
 * @param detail - An optional detail to be included in the formatted message.
 * @public
 */
export type ErrorFormatter<TD = unknown> = (message: string, detail?: TD) => string;

/**
 * Simple logger interface used by {@link IResult.orThrow}.
 * @public
 */
export interface IResultLogger {
  /**
   * Log an error message.
   * @param message - The message to be logged.
   */
  error(message: string): void;
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
   * @deprecated Use {@link IResult.orThrow | orThrow} instead.
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
   * @deprecated Use {@link IResult.(orDefault:1) | orDefault(T)} or {@link IResult.(orDefault:2) | orDefault()} instead.
   */
  getValueOrDefault(dflt?: T): T | undefined;

  /**
   * Gets the value associated with a successful {@link IResult | result},
   * or throws the error message if the corresponding operation failed.
   * @param logger - An optional {@link IResultLogger | logger} to which the
   * error will also be reported.
   * @returns The return value, if the operation was successful.
   * @throws The error message if the operation failed.
   */
  orThrow(logger?: IResultLogger): T;

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
   */
  aggregateError(errors: IMessageAggregator): this;
}

/**
 * Reports a successful {@link IResult | result} from some operation and the
 * corresponding value.
 * @public
 */
export class Success<T> implements IResult<T> {
  /**
   * {@inheritdoc IResult.success}
   */
  public readonly success: true = true;

  /**
   * For a successful operation, the error message is always `undefined`.
   */
  public readonly message: undefined = undefined;

  /**
   * @internal
   */
  private readonly _value: T;

  /**
   * Constructs a {@link Success} with the supplied value.
   * @param value - The value to be returned.
   */
  public constructor(value: T) {
    this._value = value;
  }

  /**
   * The result value returned by the successful operation.
   */
  public get value(): T {
    return this._value;
  }

  /**
   * {@inheritdoc IResult.isSuccess}
   */
  public isSuccess(): this is Success<T> {
    return true;
  }

  /**
   * {@inheritdoc IResult.isFailure}
   */
  public isFailure(): this is Failure<T> {
    return false;
  }

  /**
   * {@inheritdoc IResult.orThrow}
   */
  public orThrow(__logger?: IResultLogger): T {
    return this._value;
  }

  /**
   * {@inheritdoc IResult.(orDefault:1)}
   */
  public orDefault(dflt: T): T;
  /**
   * {@inheritdoc IResult.(orDefault:2)}
   */
  public orDefault(): T | undefined;
  public orDefault(dflt?: T): T | undefined {
    return this._value ?? dflt;
  }

  /**
   * {@inheritdoc IResult.getValueOrThrow}
   * @deprecated Use {@link Success.orThrow | orThrow} instead.
   */
  public getValueOrThrow(__logger?: IResultLogger): T {
    return this._value;
  }

  /**
   * {@inheritdoc IResult.getValueOrDefault}
   * @deprecated Use {@link Success.(orDefault:1) | orDefault(T)} or {@link Success.(orDefault:2) | orDefault()} instead.
   */
  public getValueOrDefault(dflt?: T): T | undefined {
    return this._value ?? dflt;
  }

  /**
   * {@inheritdoc IResult.onSuccess}
   */
  public onSuccess<TN>(cb: SuccessContinuation<T, TN>): Result<TN> {
    return cb(this.value);
  }

  /**
   * {@inheritdoc IResult.onFailure}
   */
  public onFailure(__: FailureContinuation<T>): Result<T> {
    return this;
  }

  /**
   * {@inheritdoc IResult.withErrorFormat}
   */
  public withErrorFormat(__cb: ErrorFormatter): Result<T> {
    return this;
  }

  /**
   * {@inheritdoc IResult.withFailureDetail}
   */
  public withFailureDetail<TD>(__detail: TD): DetailedResult<T, TD> {
    return succeedWithDetail(this.value);
  }

  /**
   * {@inheritdoc IResult.withDetail}
   */
  public withDetail<TD>(detail: TD, successDetail?: TD): DetailedResult<T, TD> {
    return succeedWithDetail(this.value, successDetail ?? detail);
  }

  /**
   * {@inheritdoc IResult.aggregateError}
   */
  public aggregateError(errors: IMessageAggregator): this {
    return this;
  }
}

/**
 * Reports a failed {@link IResult | result} from some operation, with an error message.
 * @public
 */
export class Failure<T> implements IResult<T> {
  /**
   * {@inheritdoc IResult.success}
   */
  public readonly success: false = false;
  /**
   * Failed operation always returns undefined for value.
   */
  public readonly value: undefined = undefined;

  /**
   * @internal
   */
  private readonly _message: string;

  /**
   * Constructs a {@link Failure} with the supplied message.
   * @param message - Error message to be reported.
   */
  public constructor(message: string) {
    this._message = message;
  }

  /**
   * Gets the error message associated with this error.
   */
  public get message(): string {
    return this._message;
  }

  /**
   * {@inheritdoc IResult.isSuccess}
   */
  public isSuccess(): this is Success<T> {
    return false;
  }

  /**
   * {@inheritdoc IResult.isFailure}
   */
  public isFailure(): this is Failure<T> {
    return true;
  }

  /**
   * {@inheritdoc IResult.orThrow}
   */
  public orThrow(logger?: IResultLogger): never {
    if (logger !== undefined) {
      logger.error(this._message);
    }
    throw new Error(this._message);
  }

  /**
   * {@inheritdoc IResult.(orDefault:1)}
   */
  public orDefault(dflt: T): T;
  /**
   * {@inheritdoc IResult.(orDefault:2)}
   */
  public orDefault(): T | undefined;
  public orDefault(dflt?: T): T | undefined {
    return dflt;
  }

  /**
   * {@inheritdoc IResult.getValueOrThrow}
   * @deprecated Use {@link Failure.orThrow | orThrow} instead.
   */
  public getValueOrThrow(logger?: IResultLogger): never {
    if (logger !== undefined) {
      logger.error(this._message);
    }
    throw new Error(this._message);
  }

  /**
   * {@inheritdoc IResult.getValueOrDefault}
   * @deprecated Use {@link Failure.(orDefault:1) | orDefault(T)} or {@link Failure.(orDefault:2) | orDefault()} instead.
   */
  public getValueOrDefault(dflt?: T): T | undefined {
    return dflt;
  }

  /**
   * {@inheritdoc IResult.onSuccess}
   */
  public onSuccess<TN>(__: SuccessContinuation<T, TN>): Result<TN> {
    return new Failure(this.message);
  }

  /**
   * {@inheritdoc IResult.onFailure}
   */
  public onFailure(cb: FailureContinuation<T>): Result<T> {
    return cb(this.message);
  }

  /**
   * {@inheritdoc IResult.withErrorFormat}
   */
  public withErrorFormat(cb: ErrorFormatter): Result<T> {
    return fail(cb(this.message));
  }

  /**
   * {@inheritdoc IResult.withFailureDetail}
   */
  public withFailureDetail<TD>(detail: TD): DetailedResult<T, TD> {
    return failWithDetail(this.message, detail);
  }

  /**
   * {@inheritdoc IResult.withDetail}
   */
  public withDetail<TD>(detail: TD, __successDetail?: TD): DetailedResult<T, TD> {
    return failWithDetail(this.message, detail);
  }

  /**
   * {@inheritdoc IResult.aggregateError}
   */
  public aggregateError(errors: IMessageAggregator): this {
    errors.addMessage(this.message);
    return this;
  }

  /**
   * Get a 'friendly' string representation of this object.
   * @remarks
   * The string representation of a {@link Failure} value is the error message.
   * @returns A string representing this object.
   */
  public toString(): string {
    return this.message;
  }
}

/**
 * Returns {@link Success | Success<T>} with the supplied result value.
 * @param value - The successful result value to be returned
 * @public
 */
export function succeed<T>(value: T): Success<T> {
  return new Success<T>(value);
}

/**
 * Returns {@link Failure | Failure<T>} with the supplied error message.
 * @param message - Error message to be returned.
 * @public
 */
export function fail<T>(message: string): Failure<T> {
  return new Failure<T>(message);
}

/**
 * Callback to be called when a {@link DetailedResult} encounters success.
 * @remarks
 * A success callback can return a different result type than it receives, allowing
 * success results to chain through intermediate result types.
 * @public
 */
export type DetailedSuccessContinuation<T, TD, TN> = (value: T, detail?: TD) => DetailedResult<TN, TD>;

/**
 * Callback to be called when a {@link DetailedResult} encounters a failure.
 * @remarks
 * A failure callback can change {@link Failure} to {@link Success} (e.g. by returning a default value)
 * or it can change or embellish the error message, but it cannot change the success return type.
 * @public
 */
export type DetailedFailureContinuation<T, TD> = (message: string, detail: TD) => DetailedResult<T, TD>;

/**
 * A {@link DetailedSuccess} extends {@link Success} to report optional success details in
 * addition to the error message.
 * @public
 */
export class DetailedSuccess<T, TD> extends Success<T> {
  /**
   * @internal
   */
  protected _detail?: TD;

  /**
   * Constructs a new {@link DetailedSuccess | DetailedSuccess<T, TD>} with the supplied
   * value and detail.
   * @param value - The value to be returned.
   * @param detail - An optional successful detail to be returned.  If omitted, detail
   * will be `undefined`.
   */
  public constructor(value: T, detail?: TD) {
    super(value);
    this._detail = detail;
  }

  /**
   * The success detail associated with this {@link DetailedSuccess}, or `undefined` if
   * no detail was supplied.
   */
  public get detail(): TD | undefined {
    return this._detail;
  }

  /**
   * Reports that this {@link DetailedSuccess} is a success.
   * @remarks
   * Always true for {@link DetailedSuccess} but can be used as type guard
   * to discriminate {@link DetailedSuccess} from {@link DetailedFailure} in
   * a {@link DetailedResult}.
   * @returns `true`
   */
  public isSuccess(): this is DetailedSuccess<T, TD> {
    return true;
  }

  /**
   * Invokes the supplied {@link DetailedSuccessContinuation | success callback} and propagates
   * its returned {@link DetailedResult | DetailedResult<TN, TD>}.
   * @remarks
   * The success callback mutates the return type from `<T>` to `<TN>`.
   * @param cb - The {@link DetailedSuccessContinuation | success callback} to be invoked.
   * @returns The {@link DetailedResult | DetailedResult<T, TD>} returned by the success callback.
   */
  public onSuccess<TN>(cb: DetailedSuccessContinuation<T, TD, TN>): DetailedResult<TN, TD> {
    return cb(this.value, this._detail);
  }

  /**
   * Propagates this {@link DetailedSuccess}.
   * @remarks
   * Failure does not mutate return type so we can return this event directly.
   * @param _cb - {@link DetailedFailureContinuation | Failure callback} to be called
   * on a {@link DetailedResult} in case of failure (ignored).
   * @returns `this`
   */
  public onFailure(__cb: DetailedFailureContinuation<T, TD>): DetailedResult<T, TD> {
    return this;
  }

  /**
   * {@inheritdoc Success.withErrorFormat}
   */
  public withErrorFormat(cb: ErrorFormatter): DetailedResult<T, TD> {
    return this;
  }
}

/**
 * A {@link DetailedFailure} extends {@link Failure} to report optional failure details in
 * addition to the error message.
 * @public
 */
export class DetailedFailure<T, TD> extends Failure<T> {
  /**
   * @internal
   */
  protected _detail: TD;

  /**
   * Constructs a new {@link DetailedFailure | DetailedFailure<T, TD>} with the supplied
   * message and detail.
   * @param message - The message to be returned.
   * @param detail - The error detail to be returned.
   */
  public constructor(message: string, detail: TD) {
    super(message);
    this._detail = detail;
  }

  /**
   * The error detail associated with this {@link DetailedFailure}.
   */
  public get detail(): TD {
    return this._detail;
  }

  /**
   * Reports that this {@link DetailedFailure} is a failure.
   * @remarks
   * Always true for {@link DetailedFailure} but can be used as type guard
   * to discriminate {@link DetailedSuccess} from {@link DetailedFailure} in
   * a {@link DetailedResult}.
   * @returns `true`
   */
  public isFailure(): this is DetailedFailure<T, TD> {
    return true;
  }

  /**
   * Propagates the error message and detail from this result.
   * @remarks
   * Mutates the success type as the success callback would have, but does not
   * call the success callback.
   * @param _cb - {@link DetailedSuccessContinuation | Success callback} to be called
   * on a {@link DetailedResult} in case of success (ignored).
   * @returns A new {@link DetailedFailure | DetailedFailure<TN, TD>} which contains
   * the error message and detail from this one.
   */
  public onSuccess<TN>(__cb: DetailedSuccessContinuation<T, TD, TN>): DetailedResult<TN, TD> {
    return new DetailedFailure<TN, TD>(this.message, this._detail);
  }

  /**
   * Invokes the supplied {@link DetailedFailureContinuation | failure callback} and propagates
   * its returned {@link DetailedResult | DetailedResult<T, TD>}.
   * @param cb - The {@link DetailedFailureContinuation | failure callback} to be invoked.
   * @returns The {@link DetailedResult | DetailedResult<T, TD>} returned by the failure callback.
   */
  public onFailure(cb: DetailedFailureContinuation<T, TD>): DetailedResult<T, TD> {
    return cb(this.message, this._detail);
  }

  /**
   * {@inheritdoc IResult.withErrorFormat}
   */
  public withErrorFormat(cb: ErrorFormatter<TD>): DetailedResult<T, TD> {
    return failWithDetail(cb(this.message, this._detail), this._detail);
  }
}

/**
 * Type inference to determine the result type `T` of a {@link DetailedResult | DetailedResult<T, TD>}.
 * @beta
 */
export type DetailedResult<T, TD> = DetailedSuccess<T, TD> | DetailedFailure<T, TD>;

/**
 * Type inference to determine the detail type `TD` of a {@link DetailedResult | DetailedResult<T, TD>}.
 * @beta
 */
export type ResultDetailType<T> = T extends DetailedResult<unknown, infer TD> ? TD : never;

/**
 * Returns {@link DetailedSuccess | DetailedSuccess<T, TD>} with a supplied value and optional
 * detail.
 * @param value - The value of type `<T>` to be returned.
 * @param detail - An optional detail of type `<TD>` to be returned.
 * @returns A {@link DetailedSuccess | DetailedSuccess<T, TD>} with the supplied value
 * and detail, if supplied.
 * @public
 */
export function succeedWithDetail<T, TD>(value: T, detail?: TD): DetailedSuccess<T, TD> {
  return new DetailedSuccess<T, TD>(value, detail);
}

/**
 * Returns {@link DetailedFailure | DetailedFailure<T, TD>} with a supplied error message and detail.
 * @param message - The error message to be returned.
 * @param detail - The event detail to be returned.
 * @returns An {@link DetailedFailure | DetailedFailure<T, TD>} with the supplied error
 * message and detail.
 * @public
 */
export function failWithDetail<T, TD>(message: string, detail: TD): DetailedFailure<T, TD> {
  return new DetailedFailure<T, TD>(message, detail);
}

/**
 * Propagates a {@link Success} or {@link Failure} {@link Result}, adding supplied
 * event details as appropriate.
 * @param result - The {@link Result} to be propagated.
 * @param detail - The event detail (type `<TD>`) to be added to the {@link Result | result}.
 * @param successDetail - An optional distinct event detail to be added to {@link Success} results.  If `successDetail`
 * is omitted or `undefined`, then `detail` will be applied to {@link Success} results.
 * @returns A new {@link DetailedResult | DetailedResult<T, TD>} with the success value or error
 * message from the original `result` but with the specified detail added.
 * @public
 */
export function propagateWithDetail<T, TD>(
  result: Result<T>,
  detail: TD,
  successDetail?: TD
): DetailedResult<T, TD> {
  return result.isSuccess()
    ? succeedWithDetail(result.value, successDetail ?? detail)
    : failWithDetail(result.message, detail);
}

/**
 * Wraps a function which might throw to convert exception results
 * to {@link Failure}.
 * @param func - The function to be captured.
 * @returns Returns {@link Success} with a value of type `<T>` on
 * success , or {@link Failure} with the thrown error message if
 * `func` throws an `Error`.
 * @public
 */
export function captureResult<T>(func: () => T): Result<T> {
  try {
    return succeed(func());
  } catch (err) {
    return fail((err as Error).message);
  }
}
