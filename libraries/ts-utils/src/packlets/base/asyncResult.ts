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

import {
  ErrorFormatter,
  IMessageAggregator,
  IResultReportOptions,
  IResultReporter,
  Result,
  SuccessContinuation,
  FailureContinuation,
  fail,
  succeed
} from './result';

/**
 * Async continuation callback to be called in the event that a
 * {@link Result} is successful, returning a {@link Promise} of a new {@link Result}.
 * @public
 */
export type AsyncSuccessContinuation<T, TN> = (value: T) => Promise<Result<TN>>;

/**
 * Async continuation callback to be called in the event that a
 * {@link Result} fails, returning a {@link Promise} of a new {@link Result}.
 * @public
 */
export type AsyncFailureContinuation<T> = (message: string) => Promise<Result<T>>;

/**
 * Wraps a {@link Promise} of a {@link Result} to enable fluent chaining of both
 * synchronous and asynchronous operations.
 *
 * @remarks
 * `AsyncResult<T>` implements {@link PromiseLike} so it can be directly `await`ed.
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
   * Constructs an {@link AsyncResult} wrapping the supplied promise.
   * @param promise - A {@link Promise} that resolves to a {@link Result}.
   */
  public constructor(promise: Promise<Result<T>>) {
    this._promise = promise;
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
   * If the async callback rejects, the rejection is caught and converted
   * to a {@link Failure}.
   * @param cb - The {@link AsyncSuccessContinuation | async success continuation}
   * to be called in the event of success.
   * @returns A new {@link AsyncResult} wrapping the async continuation result.
   */
  public thenOnSuccess<TN>(cb: AsyncSuccessContinuation<T, TN>): AsyncResult<TN> {
    return new AsyncResult(
      this._promise.then((r) => {
        if (r.isFailure()) {
          return fail(r.message);
        }
        return cb(r.value).catch((err: unknown) => fail<TN>((err as Error).message));
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
   * If the async callback rejects, the rejection is caught and converted
   * to a {@link Failure}.
   * @param cb - The {@link AsyncFailureContinuation | async failure continuation}
   * to be called in the event of failure.
   * @returns A new {@link AsyncResult} wrapping the async continuation result.
   */
  public thenOnFailure(cb: AsyncFailureContinuation<T>): AsyncResult<T> {
    return new AsyncResult(
      this._promise.then((r) => {
        if (r.isSuccess()) {
          return r;
        }
        return cb(r.message).catch((err: unknown) => fail<T>((err as Error).message));
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
   * Implementation of {@link PromiseLike.then} enabling `await` on {@link AsyncResult}.
   * @param onfulfilled - Callback invoked when the promise resolves.
   * @param onrejected - Callback invoked when the promise rejects.
   * @returns A {@link Promise} resolving to the callback result.
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
 * Wraps an async function which might throw to convert exception results
 * to {@link Failure}.
 * @param func - The async function to be captured.
 * @returns Returns a {@link Promise} of {@link Success} with a value of type `<T>` on
 * success, or {@link Failure} with the thrown error message if `func` throws or rejects.
 * @public
 */
export async function captureAsyncResult<T>(func: () => Promise<T>): Promise<Result<T>> {
  try {
    return succeed(await func());
  } catch (err) {
    return fail((err as Error).message);
  }
}
