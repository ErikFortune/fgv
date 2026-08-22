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

import { _findShouldNotFailFrame, _formatShouldNotFailMessage } from './shouldNotFail';
import type {
  ErrorFormatter,
  FailureContinuation,
  IMessageAggregator,
  IResult,
  IResultLogger,
  IResultReportOptions,
  IResultReporter,
  Result,
  SuccessContinuation
} from './resultTypes';

// The contract lives in `./resultTypes`; re-exported here so the barrel and every
// existing import path are unchanged by the split.
export * from './resultTypes';

/**
 * Reports a successful {@link IResult | result} from some operation and the
 * corresponding value.
 * @public
 */
export class Success<out T> implements IResult<T> {
  /**
   * {@inheritDoc IResult.success}
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
   * {@inheritDoc IResult.isSuccess}
   */
  public isSuccess(): this is Success<T> {
    return true;
  }

  /**
   * {@inheritDoc IResult.isFailure}
   */
  public isFailure(): this is Failure<T> {
    return false;
  }

  /**
   * {@inheritDoc IResult.orThrow}
   */
  public orThrow(logger?: IResultLogger): T;

  /**
   * {@inheritDoc IResult.orThrow}
   */
  public orThrow(cb: ErrorFormatter): T;
  public orThrow(__logger?: IResultLogger | ErrorFormatter): T {
    return this._value;
  }

  /**
   * {@inheritDoc IResult.shouldNotFail}
   */
  public shouldNotFail(__label?: string, __frameDepth?: number): T {
    return this._value;
  }

  /**
   * {@inheritDoc IResult.orDefault}
   */
  public orDefault(dflt: T): T;
  /**
   * {@inheritDoc IResult.orDefault}
   */
  public orDefault(): T | undefined;
  public orDefault(dflt?: T): T | undefined {
    return this._value ?? dflt;
  }

  /**
   * {@inheritDoc IResult.orDefaultWith}
   */
  public orDefaultWith(cb: () => T): T {
    // `??` rather than a plain return, so this is behaviourally identical to
    // `orDefault(cb())` for every input — including a Success carrying
    // `undefined`, which `orDefault` also treats as absent. Switching a call site
    // from `orDefault(x)` to `orDefaultWith(() => x)` must change only WHEN the
    // default is computed, never WHICH value comes back. `??` short-circuits, so
    // `cb` still runs only when the value is actually absent.
    return this._value ?? cb();
  }

  /**
   * {@inheritDoc IResult.getValueOrThrow}
   * @deprecated Use {@link Success.orThrow | orThrow(logger)} or {@link Success.orThrow | orThrow(formatter)} instead.
   */
  public getValueOrThrow(__logger?: IResultLogger): T {
    return this._value;
  }

  /**
   * {@inheritDoc IResult.getValueOrDefault}
   * @deprecated Use {@link Success.orDefault | orDefault(T)} or {@link Success.orDefault | orDefault()} instead.
   */
  public getValueOrDefault(dflt?: T): T | undefined {
    return this._value ?? dflt;
  }

  /**
   * {@inheritDoc IResult.onSuccess}
   */
  public onSuccess<TN>(cb: SuccessContinuation<T, TN>): Result<TN> {
    return cb(this._value);
  }

  /**
   * {@inheritDoc IResult.onFailure}
   */
  public onFailure(__: FailureContinuation<T>): Result<T> {
    return this;
  }

  /**
   * {@inheritDoc IResult.thenOnSuccess}
   */
  public thenOnSuccess<TN>(cb: AsyncSuccessContinuation<T, TN>): AsyncResult<TN> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return new AsyncResult(cb(this._value));
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return AsyncResult.from(fail<TN>(_errorMessage(err)));
    }
  }

  /**
   * {@inheritDoc IResult.thenOnFailure}
   */
  public thenOnFailure(__: AsyncFailureContinuation<T>): AsyncResult<T> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return AsyncResult.from(this);
  }

  /**
   * {@inheritDoc IResult.withErrorFormat}
   */
  public withErrorFormat(__cb: ErrorFormatter): Result<T> {
    return this;
  }

  /**
   * {@inheritDoc IResult.withFailureDetail}
   */
  public withFailureDetail<TD>(__detail: TD): DetailedResult<T, TD> {
    return succeedWithDetail(this._value);
  }

  /**
   * {@inheritDoc IResult.withDetail}
   */
  public withDetail<TD>(detail: TD, successDetail?: TD): DetailedResult<T, TD> {
    return succeedWithDetail(this._value, successDetail ?? detail);
  }

  /**
   * {@inheritDoc IResult.aggregateError}
   */
  public aggregateError(__errors: IMessageAggregator, __formatter?: ErrorFormatter): this {
    return this;
  }

  /**
   * {@inheritDoc IResult.report}
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
export class Failure<out T> implements IResult<T> {
  /**
   * {@inheritDoc IResult.success}
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
   * {@inheritDoc IResult.isSuccess}
   */
  public isSuccess(): this is Success<T> {
    return false;
  }

  /**
   * {@inheritDoc IResult.isFailure}
   */
  public isFailure(): this is Failure<T> {
    return true;
  }

  /**
   * {@inheritDoc IResult.orThrow}
   */
  public orThrow(logger?: IResultLogger): never;

  /**
   * {@inheritDoc IResult.orThrow}
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
   * {@inheritDoc IResult.shouldNotFail}
   */
  public shouldNotFail(label?: string, frameDepth: number = 1): never {
    // Parse a probe Error's stack to identify the caller frame for message
    // composition. We must NOT reuse this probe as the thrown Error: in V8,
    // `.stack` is materialized lazily on first access (which happens below in
    // `_findShouldNotFailFrame`), and once materialized the cached stack
    // header carries whatever message was set at that moment. Mutating
    // `.message` afterwards does not refresh the cached `.stack` header.
    const probe = new Error();
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(probe, this.shouldNotFail);
    }
    const frame = _findShouldNotFailFrame(probe.stack, frameDepth);
    const message = _formatShouldNotFailMessage(this._message, label, frame);
    // Build the final Error with the formatted message and re-elide
    // `shouldNotFail` from its stack, so the thrown error's `.stack` shows
    // both the formatted message in its header and the caller as its top
    // frame.
    const err = new Error(message);
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(err, this.shouldNotFail);
    }
    throw err;
  }

  /**
   * {@inheritDoc IResult.orDefault}
   */
  public orDefault(dflt: T): T;
  /**
   * {@inheritDoc IResult.orDefault}
   */
  public orDefault(): T | undefined;
  public orDefault(dflt?: T): T | undefined {
    return dflt;
  }

  /**
   * {@inheritDoc IResult.orDefaultWith}
   */
  public orDefaultWith(cb: () => T): T {
    return cb();
  }

  /**
   * {@inheritDoc IResult.getValueOrThrow}
   * @deprecated Use {@link Failure.orThrow | orThrow(logger)} or {@link Failure.orThrow | orThrow(formatter)} instead.
   */
  public getValueOrThrow(logger?: IResultLogger): never {
    if (logger !== undefined) {
      logger.error(this._message);
    }
    throw new Error(this._message);
  }

  /**
   * {@inheritDoc IResult.getValueOrDefault}
   * @deprecated Use {@link Failure.orDefault | orDefault(T)} or {@link Failure.orDefault | orDefault()} instead.
   */
  public getValueOrDefault(dflt?: T): T | undefined {
    return dflt;
  }

  /**
   * {@inheritDoc IResult.onSuccess}
   */
  public onSuccess<TN>(__: SuccessContinuation<T, TN>): Result<TN> {
    return new Failure(this._message);
  }

  /**
   * {@inheritDoc IResult.onFailure}
   */
  public onFailure(cb: FailureContinuation<T>): Result<T> {
    return cb(this._message);
  }

  /**
   * {@inheritDoc IResult.thenOnSuccess}
   */
  public thenOnSuccess<TN>(__: AsyncSuccessContinuation<T, TN>): AsyncResult<TN> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return AsyncResult.from(fail<TN>(this._message));
  }

  /**
   * {@inheritDoc IResult.thenOnFailure}
   */
  public thenOnFailure(cb: AsyncFailureContinuation<T>): AsyncResult<T> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return new AsyncResult(cb(this._message));
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return AsyncResult.from(fail<T>(_errorMessage(err)));
    }
  }

  /**
   * {@inheritDoc IResult.withErrorFormat}
   */
  public withErrorFormat(cb: ErrorFormatter): Result<T> {
    return fail(cb(this._message));
  }

  /**
   * {@inheritDoc IResult.withFailureDetail}
   */
  public withFailureDetail<TD>(detail: TD): DetailedResult<T, TD> {
    return failWithDetail(this._message, detail);
  }

  /**
   * {@inheritDoc IResult.withDetail}
   */
  public withDetail<TD>(detail: TD, __successDetail?: TD): DetailedResult<T, TD> {
    return failWithDetail(this._message, detail);
  }

  /**
   * {@inheritDoc IResult.aggregateError}
   */
  public aggregateError(errors: IMessageAggregator, formatter?: ErrorFormatter): this {
    const message = formatter ? formatter(this._message) : this._message;
    errors.addMessage(message);
    return this;
  }

  /**
   * {@inheritDoc IResult.report}
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
   * Re-types this {@link Failure | Failure<T>} as {@link Failure | Failure<U>} for
   * propagation under a different success type.
   * @remarks
   * Supports the canonical Result early-return-after-`isFailure()` pattern when the
   * outer function's success type differs from the inner Result's success type:
   *
   * ```ts
   * const storeResult = await PromptStoreFixture.build(seed);
   * if (storeResult.isFailure()) {
   *   return storeResult.withType<PromptLibrary>();
   * }
   * return PromptLibrary.create({ store: storeResult.value, ... });
   * ```
   *
   * Without this helper, TypeScript rejects `return storeResult` because
   * `Failure<IPromptStore>` is invariant in `T` and not assignable to
   * `Result<PromptLibrary>`. The workaround `return fail<U>(r.message)` is
   * semantically equivalent but allocates a new {@link Failure} instance;
   * `withType` returns `this` and only retypes statically.
   *
   * This method is sound because a {@link Failure} variant carries no `T`-shaped
   * data — only an error message — so re-typing it as `Failure<U>` cannot
   * misrepresent any value. The same operation is NOT exposed on {@link Success}
   * because `Success<T>` carries `T`-shaped data and re-typing would be a lie.
   *
   * For `DetailedResult` propagation that preserves a typed `detail`, consider
   * propagating the {@link DetailedFailure} directly through `onSuccess` (which
   * already re-types the success arm) rather than reaching for `withType`.
   *
   * @returns This same {@link Failure} instance, statically retyped as
   * {@link Failure | Failure<U>}.
   * @public
   */
  public withType<U>(): Failure<U> {
    // Safe by construction: Failure carries no T-shaped data, only a message.
    // Re-typing the static T parameter cannot misrepresent any value.
    return this as unknown as Failure<U>;
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
 * {@inheritDoc succeed}
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
 * {@inheritDoc fail}
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
export class DetailedSuccess<out T, out TD> extends Success<T> {
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
   * @param __cb - {@link DetailedFailureContinuation | Failure callback} to be called
   * on a {@link DetailedResult} in case of failure (ignored).
   * @returns `this`
   */
  public onFailure(__cb: DetailedFailureContinuation<T, TD>): DetailedResult<T, TD> {
    return this;
  }

  /**
   * {@inheritDoc Success.withErrorFormat}
   */
  public withErrorFormat(cb: ErrorFormatter): DetailedResult<T, TD> {
    return this;
  }

  /**
   * Invokes the supplied {@link AsyncDetailedSuccessContinuation | async success callback},
   * bridging into an {@link AsyncDetailedResult} chain which preserves the detail type.
   * @remarks
   * Overrides {@link Success.thenOnSuccess}, which returns a plain
   * {@link AsyncResult | AsyncResult<TN>} and would drop `<TD>` silently.
   *
   * A callback which throws synchronously or returns a rejected promise yields a
   * {@link DetailedFailure} with no detail rather than escaping as an exception.
   * @param cb - The {@link AsyncDetailedSuccessContinuation | async success callback} to be invoked.
   * @returns An {@link AsyncDetailedResult | AsyncDetailedResult<TN, TD>} wrapping the callback's
   * result.
   */
  public thenOnSuccess<TN>(cb: AsyncDetailedSuccessContinuation<T, TD, TN>): AsyncDetailedResult<TN, TD>;

  /**
   * Back-compatible form of the overload above, for a callback which returns a plain
   * {@link Result} rather than a {@link DetailedResult}.
   * @remarks
   * Declared so such a callback keeps compiling, and keeps yielding a plain {@link AsyncResult},
   * exactly as it did when this class inherited {@link Success.thenOnSuccess}. Without it the override
   * would *narrow* the inherited parameter type, which is a source-breaking change even though it
   * only adds API surface - and therefore one an additive-looking API report cannot detect.
   * @param cb - The async success callback to be invoked.
   * @returns An {@link AsyncResult} wrapping the callback's result, with no detail.
   */
  public thenOnSuccess<TN>(cb: AsyncSuccessContinuation<T, TN>): AsyncResult<TN>;
  public thenOnSuccess<TN>(
    cb: AsyncDetailedSuccessContinuation<T, TD, TN> | AsyncSuccessContinuation<T, TN>
  ): AsyncDetailedResult<TN, TD> {
    try {
      // The cast inherent to an overload implementation, contained here. A plain-`Result`
      // callback's value is passed through **unchanged**, preserving object identity as the
      // inherited implementation did; that overload returns `AsyncResult`, which has no `detail`.
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return new AsyncDetailedResult(cb(this._value, this._detail) as PromiseLike<DetailedResult<TN, TD>>);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return AsyncDetailedResult.fromDetailed(failWithDetail<TN, TD>(_errorMessage(err)));
    }
  }

  /**
   * Propagates this {@link DetailedSuccess} into an {@link AsyncDetailedResult} chain without
   * invoking the callback.
   * @remarks
   * Overrides {@link Success.thenOnFailure} to preserve the detail type.
   * @param __cb - The {@link AsyncDetailedFailureContinuation | async failure callback} to be
   * called in case of failure (ignored).
   * @returns An {@link AsyncDetailedResult | AsyncDetailedResult<T, TD>} wrapping `this`.
   */
  public thenOnFailure(__cb: AsyncDetailedFailureContinuation<T, TD>): AsyncDetailedResult<T, TD>;

  /**
   * Back-compatible form of the overload above, for a callback which returns a plain
   * {@link Result} rather than a {@link DetailedResult}.
   * @remarks
   * Declared so such a callback keeps compiling, and keeps yielding a plain {@link AsyncResult},
   * exactly as it did when this class inherited {@link Success.thenOnFailure}. Without it the override
   * would *narrow* the inherited parameter type, which is a source-breaking change even though it
   * only adds API surface - and therefore one an additive-looking API report cannot detect.
   * @param cb - The async failure callback to be invoked.
   * @returns An {@link AsyncResult} wrapping the callback's result, with no detail.
   */
  public thenOnFailure(__cb: AsyncFailureContinuation<T>): AsyncResult<T>;
  public thenOnFailure(
    __cb: AsyncDetailedFailureContinuation<T, TD> | AsyncFailureContinuation<T>
  ): AsyncDetailedResult<T, TD> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return AsyncDetailedResult.fromDetailed<T, TD>(this);
  }

  /**
   * {@inheritDoc IResult.report}
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
export class DetailedFailure<out T, out TD> extends Failure<T> {
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
   * @param __cb - {@link DetailedSuccessContinuation | Success callback} to be called
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
   * {@inheritDoc IResult.withErrorFormat}
   */
  public withErrorFormat(cb: ErrorFormatter<TD>): DetailedResult<T, TD> {
    return failWithDetail(cb(this._message, this._detail), this._detail);
  }

  /**
   * Propagates this failure's message **and detail** into an {@link AsyncDetailedResult} chain
   * without invoking the callback.
   * @remarks
   * Overrides {@link Failure.thenOnSuccess}, which returns a plain
   * {@link AsyncResult | AsyncResult<TN>} and would drop `<TD>` silently. Mutates the success
   * type as the success callback would have, exactly as {@link DetailedFailure.onSuccess} does.
   * @param __cb - The {@link AsyncDetailedSuccessContinuation | async success callback} to be
   * called in case of success (ignored).
   * @returns An {@link AsyncDetailedResult | AsyncDetailedResult<TN, TD>} carrying this failure's
   * message and detail.
   */
  public thenOnSuccess<TN>(__cb: AsyncDetailedSuccessContinuation<T, TD, TN>): AsyncDetailedResult<TN, TD>;

  /**
   * Back-compatible form of the overload above, for a callback which returns a plain
   * {@link Result} rather than a {@link DetailedResult}.
   * @remarks
   * Declared so such a callback keeps compiling, and keeps yielding a plain {@link AsyncResult},
   * exactly as it did when this class inherited {@link Failure.thenOnSuccess}. Without it the override
   * would *narrow* the inherited parameter type, which is a source-breaking change even though it
   * only adds API surface - and therefore one an additive-looking API report cannot detect.
   * @param cb - The async success callback to be invoked.
   * @returns An {@link AsyncResult} wrapping the callback's result, with no detail.
   */
  public thenOnSuccess<TN>(__cb: AsyncSuccessContinuation<T, TN>): AsyncResult<TN>;
  public thenOnSuccess<TN>(
    __cb: AsyncDetailedSuccessContinuation<T, TD, TN> | AsyncSuccessContinuation<T, TN>
  ): AsyncDetailedResult<TN, TD> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return AsyncDetailedResult.fromDetailed(failWithDetail<TN, TD>(this._message, this._detail));
  }

  /**
   * Invokes the supplied {@link AsyncDetailedFailureContinuation | async failure callback},
   * bridging into an {@link AsyncDetailedResult} chain which preserves the detail type.
   * @remarks
   * Overrides {@link Failure.thenOnFailure} to preserve the detail type. The callback receives
   * this failure's detail alongside its message.
   *
   * A callback which throws synchronously or returns a rejected promise yields a
   * {@link DetailedFailure} with no detail rather than escaping as an exception.
   * @param cb - The {@link AsyncDetailedFailureContinuation | async failure callback} to be invoked.
   * @returns An {@link AsyncDetailedResult | AsyncDetailedResult<T, TD>} wrapping the callback's
   * result.
   */
  public thenOnFailure(cb: AsyncDetailedFailureContinuation<T, TD>): AsyncDetailedResult<T, TD>;

  /**
   * Back-compatible form of the overload above, for a callback which returns a plain
   * {@link Result} rather than a {@link DetailedResult}.
   * @remarks
   * Declared so such a callback keeps compiling, and keeps yielding a plain {@link AsyncResult},
   * exactly as it did when this class inherited {@link Failure.thenOnFailure}. Without it the override
   * would *narrow* the inherited parameter type, which is a source-breaking change even though it
   * only adds API surface - and therefore one an additive-looking API report cannot detect.
   * @param cb - The async failure callback to be invoked.
   * @returns An {@link AsyncResult} wrapping the callback's result, with no detail.
   */
  public thenOnFailure(cb: AsyncFailureContinuation<T>): AsyncResult<T>;
  public thenOnFailure(
    cb: AsyncDetailedFailureContinuation<T, TD> | AsyncFailureContinuation<T>
  ): AsyncDetailedResult<T, TD> {
    try {
      // The cast inherent to an overload implementation, contained here. A plain-`Result`
      // callback's value is passed through **unchanged**, preserving object identity as the
      // inherited implementation did; that overload returns `AsyncResult`, which has no `detail`.
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return new AsyncDetailedResult(cb(this._message, this._detail) as PromiseLike<DetailedResult<T, TD>>);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return AsyncDetailedResult.fromDetailed(failWithDetail<T, TD>(_errorMessage(err)));
    }
  }

  /**
   * {@inheritDoc IResult.aggregateError}
   */
  public aggregateError(errors: IMessageAggregator, formatter?: ErrorFormatter<TD>): this {
    const message = formatter ? formatter(this._message, this._detail) : this._message;
    errors.addMessage(message);
    return this;
  }

  /**
   * {@inheritDoc IResult.report}
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
 * Represents a result with additional detail.
 * @public
 */
export type DetailedResult<T, TD> = DetailedSuccess<T, TD> | DetailedFailure<T, TD>;

/**
 * Type inference to determine the result type `T` of a {@link DetailedResult | DetailedResult<T, TD>}.
 * @beta
 */
export type DetailedResultValueType<T> = T extends DetailedResult<infer TV, unknown> ? TV : never;

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
 * {@inheritDoc succeedWithDetail}
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
 * {@inheritDoc failWithDetail}
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
 * Extracts a message string from an unknown thrown/rejected value.
 * @param err - The caught error value.
 * @returns The error message string.
 * @internal
 */
export function _errorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

/**
 * Wraps a function which might throw to convert exception results
 * to {@link Failure}.
 * @param func - The function to be captured.
 * @returns Returns {@link Success} with a value of type `<T>` on
 * success , or {@link Failure} with the thrown error message if
 * `func` throws an `Error` or string.
 * @public
 */
export function captureResult<T>(func: () => T): Result<T> {
  try {
    return succeed(func());
  } catch (err) {
    return fail(_errorMessage(err));
  }
}

/**
 * Async continuation callback to be called in the event that a
 * {@link Result} is successful, returning a `PromiseLike` of a new
 * {@link Result}.
 * @remarks
 * Typed as `PromiseLike<Result<TN>>` rather than `Promise<Result<TN>>` so
 * callers can return the result of {@link captureAsyncResult} (which is an
 * {@link AsyncResult}, itself a `PromiseLike<Result<TN>>`) directly from a
 * `thenOnSuccess` callback without an `async` wrapper to coerce the
 * contextual return type back through `Awaited<>`. The continuation result
 * is always wrapped into an {@link AsyncResult}, so chaining is unaffected.
 * @public
 */
export type AsyncSuccessContinuation<T, TN> = (value: T) => PromiseLike<Result<TN>>;

/**
 * Async continuation callback to be called in the event that a
 * {@link Result} fails, returning a `PromiseLike` of a new {@link Result}.
 * @remarks
 * See {@link AsyncSuccessContinuation} for the rationale behind accepting
 * any `PromiseLike<Result<T>>` rather than only a `Promise<Result<T>>`.
 * @public
 */
export type AsyncFailureContinuation<T> = (message: string) => PromiseLike<Result<T>>;

/**
 * Async continuation callback to be called in the event that a
 * {@link DetailedResult} is successful, returning a `PromiseLike` of a new
 * {@link DetailedResult}.
 * @remarks
 * The detail-preserving sibling of {@link AsyncSuccessContinuation}. Like its
 * synchronous counterpart {@link DetailedSuccessContinuation}, it receives the
 * detail alongside the value and may mutate the success type from `<T>` to
 * `<TN>`, but it cannot change the detail type `<TD>` — that is what makes the
 * detail survive an arbitrarily long chain.
 *
 * Typed as `PromiseLike` for the same reason as
 * {@link AsyncSuccessContinuation}: so a callback can return an
 * {@link AsyncDetailedResult} directly without an `async` wrapper.
 * @public
 */
export type AsyncDetailedSuccessContinuation<T, TD, TN> = (
  value: T,
  detail?: TD
) => PromiseLike<DetailedResult<TN, TD>>;

/**
 * Async continuation callback to be called in the event that a
 * {@link DetailedResult} fails, returning a `PromiseLike` of a new
 * {@link DetailedResult}.
 * @remarks
 * The detail-preserving sibling of {@link AsyncFailureContinuation}. As with
 * {@link DetailedFailureContinuation}, the callback may recover to a success or
 * embellish the failure, but it cannot change the success type.
 * @public
 */
export type AsyncDetailedFailureContinuation<T, TD> = (
  message: string,
  detail?: TD
) => PromiseLike<DetailedResult<T, TD>>;

/**
 * Wraps a `Promise` of a {@link Result} to enable fluent chaining of both
 * synchronous and asynchronous operations.
 *
 * @remarks
 * `AsyncResult<T>` implements `PromiseLike` so it can be directly `await`ed.
 * Use the `thenOnSuccess` and `thenOnFailure` methods on {@link Result} to bridge
 * from synchronous to asynchronous result chains.
 *
 * @example
 * ```typescript
 * const result: Result<Final> = await parseInput(input)
 *   .thenOnSuccess(async (parsed) => fetchData(parsed))
 *   .onSuccess((data) => transform(data))
 *   .thenOnSuccess(async (transformed) => saveData(transformed))
 *   .withErrorFormat((msg) => `pipeline failed: ${msg}`);
 * ```
 *
 * @public
 */
export class AsyncResult<T> implements PromiseLike<Result<T>> {
  private readonly _promise: Promise<Result<T>>;

  /**
   * Constructs an {@link AsyncResult} wrapping the supplied promise (or any
   * `PromiseLike` that resolves to a {@link Result}, such as another
   * {@link AsyncResult}).
   * @remarks
   * If the supplied promise rejects, the rejection is caught and converted
   * to a {@link Failure}, ensuring that awaiting an {@link AsyncResult} always
   * yields a {@link Result}.
   * @param promise - A `Promise` (or `PromiseLike`) that resolves to a
   * {@link Result}.
   */
  public constructor(promise: PromiseLike<Result<T>>) {
    this._promise = Promise.resolve(promise).catch((err: unknown) => fail<T>(_errorMessage(err)));
  }

  /**
   * Calls a supplied {@link SuccessContinuation | success continuation} if
   * the wrapped result is successful.
   * @param cb - The synchronous {@link SuccessContinuation | success continuation}
   * to be called in the event of success.
   * @returns A new {@link AsyncResult} wrapping the continuation result.
   */
  public onSuccess<TN>(cb: SuccessContinuation<T, TN>): AsyncResult<TN> {
    return new AsyncResult(this._promise.then((r) => r.onSuccess(cb)));
  }

  /**
   * Calls a supplied {@link AsyncSuccessContinuation | async success continuation} if
   * the wrapped result is successful.
   * @remarks
   * Both synchronous throws and async rejections from the callback are caught
   * and converted to a {@link Failure}.
   * @param cb - The {@link AsyncSuccessContinuation | async success continuation}
   * to be called in the event of success.
   * @returns A new {@link AsyncResult} wrapping the async continuation result.
   */
  public thenOnSuccess<TN>(cb: AsyncSuccessContinuation<T, TN>): AsyncResult<TN> {
    return new AsyncResult(
      this._promise.then(async (r) => {
        if (r.isFailure()) {
          return fail<TN>(r.message);
        }
        try {
          return await cb(r.value);
        } catch (err: unknown) {
          return fail<TN>(_errorMessage(err));
        }
      })
    );
  }

  /**
   * Calls a supplied {@link FailureContinuation | failure continuation} if
   * the wrapped result is a failure.
   * @param cb - The synchronous {@link FailureContinuation | failure continuation}
   * to be called in the event of failure.
   * @returns A new {@link AsyncResult} wrapping the continuation result.
   */
  public onFailure(cb: FailureContinuation<T>): AsyncResult<T> {
    return new AsyncResult(this._promise.then((r) => r.onFailure(cb)));
  }

  /**
   * Calls a supplied {@link AsyncFailureContinuation | async failure continuation} if
   * the wrapped result is a failure.
   * @remarks
   * Both synchronous throws and async rejections from the callback are caught
   * and converted to a {@link Failure}.
   * @param cb - The {@link AsyncFailureContinuation | async failure continuation}
   * to be called in the event of failure.
   * @returns A new {@link AsyncResult} wrapping the async continuation result.
   */
  public thenOnFailure(cb: AsyncFailureContinuation<T>): AsyncResult<T> {
    return new AsyncResult(
      this._promise.then(async (r) => {
        if (r.isSuccess()) {
          return r;
        }
        try {
          return await cb(r.message);
        } catch (err: unknown) {
          return fail<T>(_errorMessage(err));
        }
      })
    );
  }

  /**
   * Calls a supplied {@link ErrorFormatter | error formatter} if
   * the wrapped result is a failure.
   * @param cb - The {@link ErrorFormatter | error formatter} to
   * be called in the event of failure.
   * @returns A new {@link AsyncResult} with the formatted error message,
   * or the original success result.
   */
  public withErrorFormat(cb: ErrorFormatter): AsyncResult<T> {
    return new AsyncResult(this._promise.then((r) => r.withErrorFormat(cb)));
  }

  /**
   * Propagates the wrapped result, appending any error message to the
   * supplied errors aggregator.
   * @param errors - {@link IMessageAggregator | Error aggregator} in which
   * errors will be aggregated.
   * @param formatter - An optional {@link ErrorFormatter | error formatter}
   * to be used to format the error message.
   * @returns A new {@link AsyncResult} wrapping the result after aggregation.
   */
  public aggregateError(errors: IMessageAggregator, formatter?: ErrorFormatter): AsyncResult<T> {
    return new AsyncResult(
      this._promise.then((r) => {
        r.aggregateError(errors, formatter);
        return r;
      })
    );
  }

  /**
   * Reports the wrapped result to the supplied reporter.
   * @param reporter - The {@link IResultReporter | reporter} to which the result
   * will be reported.
   * @param options - The {@link IResultReportOptions | options} for reporting the result.
   * @returns A new {@link AsyncResult} wrapping the result after reporting.
   */
  public report(reporter?: IResultReporter<T>, options?: IResultReportOptions<unknown>): AsyncResult<T> {
    return new AsyncResult(
      this._promise.then((r) => {
        r.report(reporter, options);
        return r;
      })
    );
  }

  /**
   * Implementation of `PromiseLike.then` enabling `await` on {@link AsyncResult}.
   * @param onfulfilled - Callback invoked when the promise resolves.
   * @param onrejected - Callback invoked when the promise rejects.
   * @returns A `Promise` resolving to the callback result.
   */
  /* eslint-disable @rushstack/no-new-null */
  public then<TResult1 = Result<T>, TResult2 = never>(
    onfulfilled?: ((value: Result<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    /* eslint-enable @rushstack/no-new-null */
    return this._promise.then(onfulfilled, onrejected);
  }

  /**
   * Creates an {@link AsyncResult} from a {@link Result}.
   * @param result - The {@link Result} to wrap.
   * @returns A new {@link AsyncResult} wrapping the supplied result.
   */
  public static from<T>(result: Result<T>): AsyncResult<T> {
    return new AsyncResult(Promise.resolve(result));
  }
}

/**
 * Wraps a `Promise` of a {@link DetailedResult} to enable fluent chaining of both synchronous
 * and asynchronous operations **without losing the detail type `<TD>`**.
 *
 * @remarks
 * `AsyncDetailedResult<T, TD>` is to {@link DetailedResult} exactly what {@link AsyncResult}
 * is to {@link Result}, and it **extends {@link AsyncResult | AsyncResult<T>}** for the same
 * reason {@link DetailedSuccess} extends {@link Success}: a detailed result *is* a result, so
 * the detailed async ladder must be usable anywhere the plain one is. That inheritance is also
 * what lets {@link DetailedSuccess.thenOnSuccess} and {@link DetailedFailure.thenOnSuccess}
 * override their base declarations while returning the narrower type.
 *
 * Before this type existed, `someDetailedResult.thenOnSuccess(async (v) => ...)` inherited
 * `Success.thenOnSuccess` and returned a plain `AsyncResult<TN>` — it type-checked, and `TD`
 * was silently gone. Nothing failed at the chain site; the loss surfaced later (or never, if
 * the caller happened to widen anyway), which is what made it worth closing in the primitive
 * rather than working around per consumer.
 *
 * **Rejections and synchronous throws carry no detail.** A callback that throws or returns a
 * rejected promise becomes a {@link DetailedFailure} whose `detail` is `undefined` — never an
 * escaped exception. There is no honest alternative: the thrown error supplies no `TD`, and
 * carrying the *upstream* detail forward would pair this failure's message with a previous
 * operation's detail. This matches `mapDetailedResultsAsync`, whose capture failures likewise
 * have no detail for `ignore` to match.
 *
 * @example
 * ```typescript
 * const result: DetailedResult<Final, FailureReason> = await parse(input)
 *   .thenOnSuccess(async (parsed) => fetchData(parsed))
 *   .onSuccess((data) => transform(data))
 *   .withErrorFormat((msg, detail) => `pipeline failed (${detail?.kind}): ${msg}`);
 * ```
 *
 * @public
 */
export class AsyncDetailedResult<T, TD> extends AsyncResult<T> implements PromiseLike<DetailedResult<T, TD>> {
  /**
   * The detail-typed view of the wrapped promise.
   * @remarks
   * Held separately from the base class's plain-`Result` promise because the two differ in how
   * a rejection is converted: the base produces {@link Failure}, this produces
   * {@link DetailedFailure}. Both fields observe the *same* settled values — the promise handed
   * to `super()` below is this one, already guarded — so the two views can never disagree.
   */
  private readonly _detailed: Promise<DetailedResult<T, TD>>;

  /**
   * Constructs an {@link AsyncDetailedResult} wrapping the supplied promise (or any
   * `PromiseLike` that resolves to a {@link DetailedResult}, such as another
   * {@link AsyncDetailedResult}).
   * @remarks
   * If the supplied promise rejects, the rejection is caught and converted to a
   * {@link DetailedFailure} with no detail, ensuring that awaiting an
   * {@link AsyncDetailedResult} always yields a {@link DetailedResult}.
   * @param promise - A `Promise` (or `PromiseLike`) that resolves to a {@link DetailedResult}.
   */
  public constructor(promise: PromiseLike<DetailedResult<T, TD>>) {
    // Guarded before `super()` rather than after, so the base class receives a promise that can
    // no longer reject. The base's own `.catch` would otherwise convert a rejection to a plain
    // `Failure`, and the two views of the same promise would then disagree about the detail.
    const detailed: Promise<DetailedResult<T, TD>> = Promise.resolve(promise).catch((err: unknown) =>
      failWithDetail<T, TD>(_errorMessage(err))
    );
    super(detailed);
    this._detailed = detailed;
  }

  /**
   * Calls a supplied {@link DetailedSuccessContinuation | success continuation} if the wrapped
   * result is successful.
   * @param cb - The synchronous {@link DetailedSuccessContinuation | success continuation} to be
   * called in the event of success.
   * @returns A new {@link AsyncDetailedResult} wrapping the continuation result.
   */
  public onSuccess<TN>(cb: DetailedSuccessContinuation<T, TD, TN>): AsyncDetailedResult<TN, TD> {
    return new AsyncDetailedResult(this._detailed.then((r) => r.onSuccess(cb)));
  }

  /**
   * Calls a supplied {@link AsyncDetailedSuccessContinuation | async success continuation} if the
   * wrapped result is successful.
   * @remarks
   * Both synchronous throws and async rejections from the callback are caught and converted to a
   * {@link DetailedFailure} with no detail.
   * @param cb - The {@link AsyncDetailedSuccessContinuation | async success continuation} to be
   * called in the event of success.
   * @returns A new {@link AsyncDetailedResult} wrapping the async continuation result.
   */
  public thenOnSuccess<TN>(cb: AsyncDetailedSuccessContinuation<T, TD, TN>): AsyncDetailedResult<TN, TD> {
    return new AsyncDetailedResult(
      this._detailed.then(async (r) => {
        if (r.isFailure()) {
          return failWithDetail<TN, TD>(r.message, r.detail);
        }
        try {
          return await cb(r.value, r.detail);
        } catch (err: unknown) {
          return failWithDetail<TN, TD>(_errorMessage(err));
        }
      })
    );
  }

  /**
   * Calls a supplied {@link DetailedFailureContinuation | failure continuation} if the wrapped
   * result is a failure.
   * @param cb - The synchronous {@link DetailedFailureContinuation | failure continuation} to be
   * called in the event of failure.
   * @returns A new {@link AsyncDetailedResult} wrapping the continuation result.
   */
  public onFailure(cb: DetailedFailureContinuation<T, TD>): AsyncDetailedResult<T, TD> {
    return new AsyncDetailedResult(this._detailed.then((r) => r.onFailure(cb)));
  }

  /**
   * Calls a supplied {@link AsyncDetailedFailureContinuation | async failure continuation} if the
   * wrapped result is a failure.
   * @remarks
   * Both synchronous throws and async rejections from the callback are caught and converted to a
   * {@link DetailedFailure} with no detail.
   * @param cb - The {@link AsyncDetailedFailureContinuation | async failure continuation} to be
   * called in the event of failure.
   * @returns A new {@link AsyncDetailedResult} wrapping the async continuation result.
   */
  public thenOnFailure(cb: AsyncDetailedFailureContinuation<T, TD>): AsyncDetailedResult<T, TD> {
    return new AsyncDetailedResult(
      this._detailed.then(async (r) => {
        if (r.isSuccess()) {
          return r;
        }
        try {
          return await cb(r.message, r.detail);
        } catch (err: unknown) {
          return failWithDetail<T, TD>(_errorMessage(err));
        }
      })
    );
  }

  /**
   * Calls a supplied {@link ErrorFormatter | error formatter} if the wrapped result is a failure.
   * @remarks
   * The formatter receives the detail as well as the message, matching
   * {@link DetailedFailure.withErrorFormat}. The reformatted failure keeps its detail.
   * @param cb - The {@link ErrorFormatter | error formatter} to be called in the event of failure.
   * @returns A new {@link AsyncDetailedResult} with the formatted error message, or the original
   * success result.
   */
  public withErrorFormat(cb: ErrorFormatter<TD>): AsyncDetailedResult<T, TD> {
    // Branched rather than called on the union: only the failure arm's `withErrorFormat` accepts
    // an `ErrorFormatter<TD>`, and the success arm is a no-op anyway.
    return new AsyncDetailedResult(this._detailed.then((r) => (r.isFailure() ? r.withErrorFormat(cb) : r)));
  }

  /**
   * Propagates the wrapped result, appending any error message to the supplied errors aggregator.
   * @param errors - {@link IMessageAggregator | Error aggregator} in which errors will be
   * aggregated.
   * @param formatter - An optional {@link ErrorFormatter | error formatter} to be used to format
   * the error message.  Receives the detail alongside the message.
   * @returns A new {@link AsyncDetailedResult} wrapping the result after aggregation.
   */
  public aggregateError(
    errors: IMessageAggregator,
    formatter?: ErrorFormatter<TD>
  ): AsyncDetailedResult<T, TD> {
    return new AsyncDetailedResult(
      this._detailed.then((r) => {
        // Branched for the same reason as `withErrorFormat`: the detail-typed formatter is only
        // accepted by the failure arm, and only the failure arm aggregates anything.
        if (r.isFailure()) {
          r.aggregateError(errors, formatter);
        }
        return r;
      })
    );
  }

  /**
   * Reports the wrapped result to the supplied reporter.
   * @param reporter - The {@link IResultReporter | reporter} to which the result will be reported.
   * @param options - The {@link IResultReportOptions | options} for reporting the result.
   * @returns A new {@link AsyncDetailedResult} wrapping the result after reporting.
   */
  public report(
    reporter?: IResultReporter<T>,
    options?: IResultReportOptions<unknown>
  ): AsyncDetailedResult<T, TD> {
    return new AsyncDetailedResult(
      this._detailed.then((r) => {
        r.report(reporter, options);
        return r;
      })
    );
  }

  /**
   * Implementation of `PromiseLike.then` enabling `await` on {@link AsyncDetailedResult}.
   * @remarks
   * Narrows the base class's `Result<T>` to `DetailedResult<T, TD>`, so `await`ing a detailed
   * chain yields a value whose `detail` is typed.
   * @param onfulfilled - Callback invoked when the promise resolves.
   * @param onrejected - Callback invoked when the promise rejects.
   * @returns A `Promise` resolving to the callback result.
   */
  /* eslint-disable @rushstack/no-new-null */
  public then<TResult1 = DetailedResult<T, TD>, TResult2 = never>(
    onfulfilled?: ((value: DetailedResult<T, TD>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    /* eslint-enable @rushstack/no-new-null */
    return this._detailed.then(onfulfilled, onrejected);
  }

  /**
   * Creates an {@link AsyncDetailedResult} from a {@link DetailedResult}.
   * @remarks
   * Named `fromDetailed` rather than overloading the inherited `from`: a static member which
   * narrowed its parameter from {@link Result} to {@link DetailedResult} would be unsound on the
   * static side, since `AsyncDetailedResult.from` is reachable through
   * {@link AsyncResult | AsyncResult}'s static type.  The inherited `AsyncResult.from` remains
   * available and still returns a plain {@link AsyncResult}.
   * @param result - The {@link DetailedResult} to wrap.
   * @returns A new {@link AsyncDetailedResult} wrapping the supplied result.
   */
  public static fromDetailed<T, TD>(result: DetailedResult<T, TD>): AsyncDetailedResult<T, TD> {
    return new AsyncDetailedResult(Promise.resolve(result));
  }
}

/**
 * Wraps an async function which might throw to convert exception results
 * to {@link Failure}.
 * @remarks
 * Returns an {@link AsyncResult} so callers can fluently chain
 * (`.onSuccess` / `.thenOnSuccess` / `.withErrorFormat`) directly off the
 * captured result. Because {@link AsyncResult} implements
 * `PromiseLike<Result<T>>`, existing `await captureAsyncResult(...)` call
 * sites continue to work unchanged and yield the same {@link Result}.
 *
 * Synchronous throws from `func` (before it returns its `Promise`), promise
 * rejections, and successful resolutions are all funneled through the
 * returned {@link AsyncResult}, which resolves to a {@link Failure} for the
 * throw/reject cases and a {@link Success} wrapping the resolved value
 * otherwise.
 * @param func - The async function to be captured.
 * @returns An {@link AsyncResult} resolving to {@link Success} with a value
 * of type `<T>` on success, or {@link Failure} with the thrown error message
 * if `func` throws or rejects.
 * @public
 */
export function captureAsyncResult<T>(func: () => Promise<T>): AsyncResult<T> {
  try {
    return new AsyncResult(func().then((value) => succeed(value)));
  } catch (err: unknown) {
    return AsyncResult.from(fail<T>(_errorMessage(err)));
  }
}
