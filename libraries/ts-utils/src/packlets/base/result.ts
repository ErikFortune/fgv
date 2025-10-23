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
 * Formats an error message.
 * @param message - The error message to be formatted.
 * @param detail - An optional detail to be included in the formatted message.
 * @public
 */
export type ErrorFormatter<TD = unknown> = (message: string, detail?: TD) => string;

/**
 * Simple logger interface used by {@link IResult.(orThrow:1) | orThrow(logger)} and {@link IResult.(orThrow:2) | orThrow(formatter)}.
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
  reportSuccess(level: MessageLogLevel, value: T, detail?: TD, message?: ErrorFormatter<TD>): void;
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
   * @deprecated Use {@link IResult.(orThrow:1) | orThrow(logger)} or {@link IResult.(orThrow:2) | orThrow(formatter)} instead.
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
  protected readonly _value: T;

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
   * {@inheritdoc IResult.(orThrow:1)}
   */
  public orThrow(logger?: IResultLogger): T;

  /**
   * {@inheritdoc IResult.(orThrow:2)}
   */
  public orThrow(cb: ErrorFormatter): T;
  public orThrow(__logger?: IResultLogger | ErrorFormatter): T {
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
   * @deprecated Use {@link Success.(orThrow:1) | orThrow(logger)} or {@link Success.(orThrow:2) | orThrow(formatter)} instead.
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
    return cb(this._value);
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
    return succeedWithDetail(this._value);
  }

  /**
   * {@inheritdoc IResult.withDetail}
   */
  public withDetail<TD>(detail: TD, successDetail?: TD): DetailedResult<T, TD> {
    return succeedWithDetail(this._value, successDetail ?? detail);
  }

  /**
   * {@inheritdoc IResult.aggregateError}
   */
  public aggregateError(__errors: IMessageAggregator, __formatter?: ErrorFormatter): this {
    return this;
  }

  /**
   * {@inheritdoc IResult.report}
   */
  public report(reporter?: IResultReporter<T>, options?: IResultReportOptions<unknown>): Success<T> {
    const successOptions =
      typeof options?.success === 'object' ? options.success : { level: options?.success };
    const level = successOptions.level ?? 'quiet';
    reporter?.reportSuccess(level, this._value, undefined, successOptions.message);
    return this;
  }

  /**
   * Creates a {@link Success | Success<T>} with the supplied value.
   * @param value - The value to be returned.
   * @returns The resulting {@link Success | Success<T>} with the supplied value.
   * @public
   */
  public static with<T>(value: T): Success<T> {
    return new Success<T>(value);
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
  protected readonly _message: string;

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
   * {@inheritdoc IResult.(orThrow:1)}
   */
  public orThrow(logger?: IResultLogger): never;

  /**
   * {@inheritdoc IResult.(orThrow:2)}
   */
  public orThrow(cb: ErrorFormatter): never;
  public orThrow(logOrFormat?: IResultLogger | ErrorFormatter): never {
    if (logOrFormat !== undefined) {
      if (typeof logOrFormat === 'function') {
        throw new Error(logOrFormat(this._message));
      } else {
        logOrFormat.error(this._message);
      }
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
   * @deprecated Use {@link Failure.(orThrow:1) | orThrow(logger)} or {@link Failure.(orThrow:2) | orThrow(formatter)} instead.
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
    return new Failure(this._message);
  }

  /**
   * {@inheritdoc IResult.onFailure}
   */
  public onFailure(cb: FailureContinuation<T>): Result<T> {
    return cb(this._message);
  }

  /**
   * {@inheritdoc IResult.withErrorFormat}
   */
  public withErrorFormat(cb: ErrorFormatter): Result<T> {
    return fail(cb(this._message));
  }

  /**
   * {@inheritdoc IResult.withFailureDetail}
   */
  public withFailureDetail<TD>(detail: TD): DetailedResult<T, TD> {
    return failWithDetail(this._message, detail);
  }

  /**
   * {@inheritdoc IResult.withDetail}
   */
  public withDetail<TD>(detail: TD, __successDetail?: TD): DetailedResult<T, TD> {
    return failWithDetail(this._message, detail);
  }

  /**
   * {@inheritdoc IResult.aggregateError}
   */
  public aggregateError(errors: IMessageAggregator, formatter?: ErrorFormatter): this {
    const message = formatter ? formatter(this._message) : this._message;
    errors.addMessage(message);
    return this;
  }

  /**
   * {@inheritdoc IResult.report}
   */
  public report(reporter?: IResultReporter<T>, options?: IResultReportOptions<unknown>): Failure<T> {
    const failureOptions =
      typeof options?.failure === 'object' ? options.failure : { level: options?.failure };
    const level = failureOptions.level ?? 'error';
    const message = failureOptions.message?.(this._message) ?? this._message;
    reporter?.reportFailure(level, message);
    return this;
  }

  /**
   * Get a 'friendly' string representation of this object.
   * @remarks
   * The string representation of a {@link Failure} value is the error message.
   * @returns A string representing this object.
   */
  public toString(): string {
    return this._message;
  }

  /**
   * Creates a {@link Failure | Failure<T>} with the supplied error message.
   * @param message - The error message to be returned.
   * @returns The resulting {@link Failure | Failure<T>} with the supplied error message.
   */
  public static with<T>(message: string): Failure<T> {
    return new Failure<T>(message);
  }
}

/**
 * Returns {@link Success | Success<T>} with the supplied result value.
 * @param value - The successful result value to be returned
 * @remarks
 * A `succeeds` alias was added in release 5.0 for
 * naming consistency with {@link fails | fails}, which was added
 * to avoid conflicts with test frameworks and libraries.
 * @public
 */
export function succeed<T>(value: T): Success<T> {
  return new Success<T>(value);
}

/**
 * {@inheritdoc succeed}
 * @public
 */
export function succeeds<T>(value: T): Success<T> {
  return new Success<T>(value);
}

/**
 * Returns {@link Failure | Failure<T>} with the supplied error message.
 * @param message - Error message to be returned.
 * @remarks
 * A `fails` alias was added in release 5.0 due to
 * issues with the name `fail` being used test frameworks and libraries.
 * @public
 */
export function fail<T>(message: string): Failure<T> {
  return new Failure<T>(message);
}

/**
 * {@inheritdoc fail}
 * @public
 */
export function fails<T>(message: string): Failure<T> {
  return new Failure<T>(message);
}

/**
 * Uses a value or calls a supplied initializer if the supplied value is undefined.
 * @param value - the value
 * @param initializer - a function that initializes the value if it is undefined
 * @returns `Success` with the value if it is defined, or the result of calling the initializer function.
 * @public
 */
export function useOrInitialize<T>(value: T | undefined, initializer: () => Result<T>): Result<T> {
  return value !== undefined ? succeed(value) : initializer();
}

/**
 * Callback to be called when a {@link DetailedResult | DetailedResult} encounters success.
 * @remarks
 * A success callback can return a different result type than it receives, allowing
 * success results to chain through intermediate result types.
 * @public
 */
export type DetailedSuccessContinuation<T, TD, TN> = (value: T, detail?: TD) => DetailedResult<TN, TD>;

/**
 * Callback to be called when a {@link DetailedResult | DetailedResult} encounters a failure.
 * @remarks
 * A failure callback can change {@link DetailedFailure | DetailedFailure<T, TD>} to
 * {@link DetailedSuccess | DetailedSuccess<T, TD>} (e.g. by returning a default value)
 * or it can change or embellish the error message, but it cannot change the success return type.
 * @public
 */
export type DetailedFailureContinuation<T, TD> = (message: string, detail?: TD) => DetailedResult<T, TD>;

/**
 * A {@link DetailedSuccess | DetailedSuccess} extends {@link Success | Success} to report optional success
 * details in addition to the error message.
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
    return cb(this._value, this._detail);
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

  /**
   * {@inheritdoc IResult.report}
   */
  public report(
    reporter?: IResultReporter<T, unknown>,
    options?: IResultReportOptions<unknown>
  ): DetailedSuccess<T, TD> {
    const successOptions =
      typeof options?.success === 'object' ? options.success : { level: options?.success };
    const level = successOptions.level ?? 'quiet';
    // Cast reporter to preserve detail type when calling reportSuccess
    const detailedReporter = reporter as IResultReporter<T, TD> | undefined;
    detailedReporter?.reportSuccess(level, this._value, this._detail, successOptions.message);
    return this;
  }

  /**
   * Creates a {@link DetailedSuccess | DetailedSuccess<T, TD>} with the supplied value and
   * optional detail.
   */
  public static with<T, TD>(value: T, detail?: TD): DetailedSuccess<T, TD> {
    return new DetailedSuccess<T, TD>(value, detail);
  }

  /**
   * Returns this {@link DetailedSuccess} as a {@link Result}.
   */
  public get asResult(): Result<T> {
    return this;
  }
}

/**
 * A {@link DetailedFailure | DetailedFailure<T, TD>} extends {@link Failure | Failure<T>} to report optional
 * failure details in addition to the error message.
 * @public
 */
export class DetailedFailure<T, TD> extends Failure<T> {
  /**
   * @internal
   */
  protected _detail?: TD;

  /**
   * Constructs a new {@link DetailedFailure | DetailedFailure<T, TD>} with the supplied
   * message and detail.
   * @param message - The message to be returned.
   * @param detail - The error detail to be returned.
   */
  public constructor(message: string, detail?: TD) {
    super(message);
    this._detail = detail;
  }

  /**
   * The error detail associated with this {@link DetailedFailure}.
   */
  public get detail(): TD | undefined {
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
    return new DetailedFailure<TN, TD>(this._message, this._detail);
  }

  /**
   * Invokes the supplied {@link DetailedFailureContinuation | failure callback} and propagates
   * its returned {@link DetailedResult | DetailedResult<T, TD>}.
   * @param cb - The {@link DetailedFailureContinuation | failure callback} to be invoked.
   * @returns The {@link DetailedResult | DetailedResult<T, TD>} returned by the failure callback.
   */
  public onFailure(cb: DetailedFailureContinuation<T, TD>): DetailedResult<T, TD> {
    return cb(this._message, this._detail);
  }

  /**
   * {@inheritdoc IResult.withErrorFormat}
   */
  public withErrorFormat(cb: ErrorFormatter<TD>): DetailedResult<T, TD> {
    return failWithDetail(cb(this._message, this._detail), this._detail);
  }

  /**
   * {@inheritdoc IResult.aggregateError}
   */
  public aggregateError(errors: IMessageAggregator, formatter?: ErrorFormatter<TD>): this {
    const message = formatter ? formatter(this._message, this._detail) : this._message;
    errors.addMessage(message);
    return this;
  }

  /**
   * {@inheritdoc IResult.report}
   */
  public report(
    reporter?: IResultReporter<T, unknown>,
    options?: IResultReportOptions<unknown>
  ): DetailedFailure<T, TD> {
    const failureOptions =
      typeof options?.failure === 'object' ? options.failure : { level: options?.failure };
    const level = failureOptions.level ?? 'error';
    // Cast formatter to handle detail type properly
    const formatter = failureOptions.message as ErrorFormatter<TD> | undefined;
    const message = formatter?.(this._message, this._detail) ?? this._message;
    // Cast reporter to preserve detail type when calling reportFailure
    const detailedReporter = reporter as IResultReporter<T, TD> | undefined;
    detailedReporter?.reportFailure(level, message, this._detail);
    return this;
  }

  public orThrow(logOrFormat?: IResultLogger<TD> | ErrorFormatter<TD>): never;
  public orThrow(cb: ErrorFormatter): never;
  public orThrow(logOrFormat?: IResultLogger<TD> | ErrorFormatter<TD>): never {
    if (logOrFormat !== undefined) {
      if (typeof logOrFormat === 'function') {
        throw new Error(logOrFormat(this._message, this._detail));
      } else {
        logOrFormat.error(this._message, this._detail);
      }
    }
    throw new Error(this._message);
  }

  /**
   * Returns this {@link DetailedFailure} as a {@link Result}.
   */
  public get asResult(): Result<T> {
    return this;
  }

  /**
   * Creates a {@link DetailedFailure | DetailedFailure<T, TD>} with the supplied error message
   * and optional detail.
   * @param message - The error message to be returned.
   * @param detail - The error detail to be returned.
   * @returns The resulting {@link DetailedFailure | DetailedFailure<T, TD>} with the supplied
   * error message and detail.
   * @public
   */
  public static with<T, TD>(message: string, detail?: TD): DetailedFailure<T, TD> {
    return new DetailedFailure<T, TD>(message, detail);
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
 * @remarks
 * The `succeedsWithDetail` alias was added in release 5.0 for
 * naming consistency with {@link fails | fails}, which was added to avoid conflicts
 * with test frameworks and libraries.
 * @public
 */
export function succeedWithDetail<T, TD>(value: T, detail?: TD): DetailedSuccess<T, TD> {
  return new DetailedSuccess<T, TD>(value, detail);
}

/**
 * {@inheritdoc succeedWithDetail}
 * @public
 */
export function succeedsWithDetail<T, TD>(value: T, detail?: TD): DetailedSuccess<T, TD> {
  return new DetailedSuccess<T, TD>(value, detail);
}

/**
 * Returns {@link DetailedFailure | DetailedFailure<T, TD>} with a supplied error message and detail.
 * @param message - The error message to be returned.
 * @param detail - The event detail to be returned.
 * @returns An {@link DetailedFailure | DetailedFailure<T, TD>} with the supplied error
 * message and detail.
 * @remarks
 * The `failsWithDetail` alias was added in release 5.0 for naming consistency
 * with {@link fails | fails}, which was added to avoid conflicts with test frameworks and libraries.
 * @public
 */
export function failWithDetail<T, TD>(message: string, detail?: TD): DetailedFailure<T, TD> {
  return new DetailedFailure<T, TD>(message, detail);
}

/**
 * {@inheritdoc failWithDetail}
 * @public
 */
export function failsWithDetail<T, TD>(message: string, detail?: TD): DetailedFailure<T, TD> {
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
