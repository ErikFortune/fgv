/*
 * Copyright (c) 2026 Erik Fortune
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

import { PopulateObjectOptions, allSucceed, mapFailures, mapResults, mapSuccess } from './mapResults';
import { MessageAggregator } from './messageAggregator';
import { DetailedResult, IMessageAggregator, Result, captureAsyncResult, fail, succeed } from './result';

/**
 * A unit of asynchronous work, deferred so that a scheduler can decide when to start it.
 * @remarks
 * The asynchronous members of this family take *deferred* work rather than already-materialized
 * promises, because a promise that has already been created has already started - by the time a
 * collector saw it, there would be nothing left to bound. Deferring the work is what makes a
 * concurrency bound possible at all.
 *
 * This is the asynchronous sibling of {@link DeferredResult | DeferredResult<T>}.
 * @public
 */
export type AsyncDeferredResult<T> = () => Promise<Result<T>>;

/**
 * The default maximum number of operations which the asynchronous members of this family
 * will allow in flight at once, used when {@link IAsyncResultOptions.concurrency} is not
 * supplied.
 * @remarks
 * The default is deliberately finite - an unbounded default would reproduce the exact problem
 * these helpers exist to prevent for any caller who does not think about it. Callers can read
 * and reference this value rather than guessing at it.
 * @public
 */
export const DEFAULT_RESULT_CONCURRENCY: number = 8;

/**
 * Options for the bounded-parallel asynchronous members of this family.
 * @remarks
 * The transitively-asynchronous members ({@link populateObjectAsync} and
 * {@link firstSuccessAsync}) are serial by contract and deliberately do *not* accept these
 * options - a `concurrency` field on an operation which is serial by definition would be a lie
 * in the type signature.
 * @public
 */
export interface IAsyncResultOptions {
  /**
   * Maximum number of operations in flight at once.  Defaults to
   * {@link DEFAULT_RESULT_CONCURRENCY}.  Values below `1`, and `NaN`, are clamped to `1`;
   * fractional values are truncated; supply `Number.POSITIVE_INFINITY` to run without a bound.
   */
  readonly concurrency?: number;

  /**
   * Optional aggregator to which any error messages will be appended, matching the third
   * parameter of the synchronous members of this family.  Each error is appended as an
   * individual string.
   */
  readonly aggregatedErrors?: IMessageAggregator;
}

/**
 * A unit of deferred asynchronous work of arbitrary (not necessarily {@link Result}) shape.
 * @internal
 */
type AsyncWork<TWork> = () => Promise<TWork>;

/**
 * Determines the effective in-flight bound for a call.
 * @param concurrency - The caller-supplied bound, if any.
 * @returns The effective bound, which is always at least `1`.
 * @internal
 */
function _resolveConcurrency(concurrency: number | undefined): number {
  if (concurrency === undefined) {
    return DEFAULT_RESULT_CONCURRENCY;
  }
  return Number.isNaN(concurrency) || concurrency < 1 ? 1 : Math.floor(concurrency);
}

/**
 * Normalizes the two supported call forms - a collection of deferred work, or a collection of
 * items plus a function to apply to each - into a single array of deferred work.
 * @remarks
 * This is the one place in this file where the overload dispatch is resolved, so the casts
 * inherent to an overload implementation are contained here.
 * @param workOrItems - Either the deferred work or the items, depending on `maybeFn`.
 * @param maybeFn - The per-item function if the `(items, fn)` form was used, anything else
 * otherwise.
 * @returns An array of deferred work in input order.
 * @internal
 */
function _asWorkArray<TItem, TWork>(workOrItems: Iterable<unknown>, maybeFn: unknown): AsyncWork<TWork>[] {
  if (_isItemsForm(maybeFn)) {
    const fn: (item: TItem, index: number) => Promise<TWork> = maybeFn as (
      item: TItem,
      index: number
    ) => Promise<TWork>;
    return Array.from(workOrItems as Iterable<TItem>).map((item, index) => () => fn(item, index));
  }
  return Array.from(workOrItems as Iterable<AsyncWork<TWork>>);
}

/**
 * Determines whether a call used the `(items, fn)` form.
 * @param maybeFn - The second positional argument of the call.
 * @returns `true` if the argument is the per-item function, `false` otherwise.
 * @internal
 */
function _isItemsForm(maybeFn: unknown): boolean {
  return typeof maybeFn === 'function';
}

/**
 * Determines whether an {@link allSucceedAsync} call used the `(items, fn)` form.
 * @remarks
 * `allSucceedAsync` is the only collector whose second parameter is a caller-supplied value
 * (`successValue: T`) rather than an options bag, so `typeof args[1] === 'function'` is not
 * sufficient on its own: a legitimate deferred-form call whose `successValue` happens to be a
 * function has the same arity and the same argument shapes as an `(items, fn)` call.
 *
 * The first argument breaks the tie. In the deferred form it is an iterable of
 * {@link AsyncDeferredResult}, so its entries *are* functions; in the `(items, fn)` form its
 * entries are arbitrary `TItem`. Checking the first entry therefore disambiguates every case
 * except an `(items, fn)` call whose items are themselves functions - a strictly rarer shape
 * than the function-valued `successValue` this rules out, and one where the caller can pass
 * the deferred form instead.
 *
 * Note what this deliberately does *not* do: discriminate on `fn.length`. The documented `fn`
 * signature takes `(item, index)`, but callers routinely ignore the index and write
 * `(item) => ...`, which has length 1. Keying on arity would misdispatch that common, correct
 * call in order to rescue a rare one.
 *
 * An empty iterable is safe either way: both forms fold to `succeed(successValue)`.
 * @param args - the raw positional arguments of the call.
 * @returns `true` when the call used the `(items, fn)` form.
 */
function _isAllSucceedItemsForm(args: unknown[]): boolean {
  if (!_isItemsForm(args[1]) || args.length < 3) {
    return false;
  }
  const first: unknown = Array.from(args[0] as Iterable<unknown>)[0];
  return typeof first !== 'function';
}

/**
 * Runs deferred asynchronous work with a bound on the number of operations in flight at once.
 * @remarks
 * Results are returned in *input* order regardless of the order in which the work completes -
 * out-of-order results would be a silent correctness trap for any caller zipping them back
 * against their inputs.
 *
 * Each returned {@link Result | Result<TWork>} is the *capture* of one unit of work: it is
 * {@link Success} wrapping whatever the work function produced, or {@link Failure} if the work
 * function threw synchronously or returned a promise which rejected.  A rejected promise is
 * never allowed to escape as an exception.
 * @param work - The deferred work to be run.
 * @param concurrency - The caller-supplied bound, if any.
 * @returns An array of captured outcomes, in input order.
 * @internal
 */
async function _scheduleBounded<TWork>(
  work: Iterable<AsyncWork<TWork>>,
  concurrency: number | undefined
): Promise<Result<TWork>[]> {
  const thunks: AsyncWork<TWork>[] = Array.from(work);
  const outcomes: Result<TWork>[] = new Array<Result<TWork>>(thunks.length);
  const limit: number = Math.min(_resolveConcurrency(concurrency), thunks.length);
  let next: number = 0;

  const workers: Promise<void>[] = [];
  for (let worker: number = 0; worker < limit; worker++) {
    workers.push(
      (async (): Promise<void> => {
        while (next < thunks.length) {
          const index: number = next++;
          outcomes[index] = await captureAsyncResult<TWork>(thunks[index]);
        }
      })()
    );
  }
  await Promise.all(workers);
  return outcomes;
}

/**
 * Flattens a captured {@link Result | Result<Result<T>>} into a {@link Result | Result<T>}, so
 * that a work function which threw or rejected is indistinguishable from one which returned
 * {@link Failure}.
 * @param outcome - The captured outcome to flatten.
 * @returns The flattened {@link Result | Result<T>}.
 * @internal
 */
function _flatten<T>(outcome: Result<Result<T>>): Result<T> {
  return outcome.onSuccess((inner) => inner);
}

/**
 * Runs deferred asynchronous work with a concurrency bound and flattens the outcomes into an
 * array of {@link Result | Result<T>} in input order, ready for one of the synchronous folds.
 * @param work - The deferred work to be run.
 * @param concurrency - The caller-supplied bound, if any.
 * @returns An array of {@link Result | Result<T>} in input order.
 * @internal
 */
async function _collectResults<T>(
  work: Iterable<AsyncDeferredResult<T>>,
  concurrency: number | undefined
): Promise<Result<T>[]> {
  return (await _scheduleBounded(work, concurrency)).map(_flatten);
}

/**
 * Invokes a single unit of deferred asynchronous work, converting a synchronous throw or a
 * promise rejection into {@link Failure}.
 * @param work - The deferred work to be invoked.
 * @returns The {@link Result | Result<T>} produced by the work.
 * @internal
 */
async function _invokeDeferred<T>(work: AsyncDeferredResult<T>): Promise<Result<T>> {
  return _flatten(await captureAsyncResult(work));
}

/**
 * Aggregates successful result values from a collection of deferred asynchronous work, running
 * at most {@link IAsyncResultOptions.concurrency} operations at once.
 * @remarks
 * This is the asynchronous sibling of {@link mapResults}, with the same fold: all work is run
 * and *every* error is aggregated - a failure does not stop the remaining work from being
 * scheduled.
 *
 * Results are returned in input order regardless of completion order.  An empty collection
 * succeeds with an empty array.
 * @param work - The collection of {@link AsyncDeferredResult | AsyncDeferredResult<T>} to be run.
 * @param options - Optional {@link IAsyncResultOptions | options} for the call.
 * @returns If all results are successful, returns {@link Success} with an array containing all
 * returned values.  If any failed, returns {@link Failure} with a concatenated summary of all
 * error messages.
 * {@label DEFERRED}
 * @public
 */
export function mapResultsAsync<T>(
  work: Iterable<AsyncDeferredResult<T>>,
  options?: IAsyncResultOptions
): Promise<Result<T[]>>;

/**
 * Applies an asynchronous {@link Result | Result<T>}-returning function to every element of a
 * collection, running at most {@link IAsyncResultOptions.concurrency} operations at once.
 * @remarks
 * This form makes already-started work structurally inexpressible - the caller supplies data and
 * a function, so there is nowhere to put a promise which has already been created.
 * @param items - The collection of items to be processed.
 * @param fn - The asynchronous function to be applied to each item.
 * @param options - Optional {@link IAsyncResultOptions | options} for the call.
 * @returns If all results are successful, returns {@link Success} with an array containing all
 * returned values.  If any failed, returns {@link Failure} with a concatenated summary of all
 * error messages.
 * {@label ITEMS}
 * @public
 */
export function mapResultsAsync<TItem, T>(
  items: Iterable<TItem>,
  fn: (item: TItem, index: number) => Promise<Result<T>>,
  options?: IAsyncResultOptions
): Promise<Result<T[]>>;

export async function mapResultsAsync<TItem, T>(
  workOrItems: Iterable<AsyncDeferredResult<T>> | Iterable<TItem>,
  fnOrOptions?: ((item: TItem, index: number) => Promise<Result<T>>) | IAsyncResultOptions,
  maybeOptions?: IAsyncResultOptions
): Promise<Result<T[]>> {
  const options: IAsyncResultOptions | undefined = _isItemsForm(fnOrOptions)
    ? maybeOptions
    : (fnOrOptions as IAsyncResultOptions | undefined);
  const work: AsyncDeferredResult<T>[] = _asWorkArray<TItem, Result<T>>(workOrItems, fnOrOptions);
  return mapResults(await _collectResults(work, options?.concurrency), options?.aggregatedErrors);
}

/**
 * Aggregates successful results from a collection of deferred asynchronous work which produces
 * {@link DetailedResult | DetailedResult<T, TD>}, optionally ignoring certain error details and
 * running at most {@link IAsyncResultOptions.concurrency} operations at once.
 * @remarks
 * This is the asynchronous sibling of {@link mapDetailedResults}, with the same fold, and the
 * same deliberate scheduling of all work regardless of failures.
 *
 * One behaviour is necessarily new: a work function which throws synchronously or returns a
 * rejected promise produces no detail at all, so there is nothing for `ignore` to match.  Such a
 * failure is therefore always reported and can never be ignored.
 * @param work - The collection of deferred work to be run.
 * @param ignore - An array of error detail values (of type `<TD>`) that should be ignored.
 * @param options - Optional {@link IAsyncResultOptions | options} for the call.
 * @returns {@link Success} with an array containing all successful results if all results either
 * succeeded or returned error details listed in `ignore`.  Otherwise returns {@link Failure} with
 * a concatenated summary of all non-ignorable error messages.
 * {@label DEFERRED}
 * @public
 */
export function mapDetailedResultsAsync<T, TD>(
  work: Iterable<() => Promise<DetailedResult<T, TD>>>,
  ignore: TD[],
  options?: IAsyncResultOptions
): Promise<Result<T[]>>;

/**
 * Applies an asynchronous {@link DetailedResult | DetailedResult<T, TD>}-returning function to
 * every element of a collection, optionally ignoring certain error details and running at most
 * {@link IAsyncResultOptions.concurrency} operations at once.
 * @param items - The collection of items to be processed.
 * @param fn - The asynchronous function to be applied to each item.
 * @param ignore - An array of error detail values (of type `<TD>`) that should be ignored.
 * @param options - Optional {@link IAsyncResultOptions | options} for the call.
 * @returns {@link Success} with an array containing all successful results if all results either
 * succeeded or returned error details listed in `ignore`.  Otherwise returns {@link Failure} with
 * a concatenated summary of all non-ignorable error messages.
 * {@label ITEMS}
 * @public
 */
export function mapDetailedResultsAsync<TItem, T, TD>(
  items: Iterable<TItem>,
  fn: (item: TItem, index: number) => Promise<DetailedResult<T, TD>>,
  ignore: TD[],
  options?: IAsyncResultOptions
): Promise<Result<T[]>>;

export async function mapDetailedResultsAsync<TItem, T, TD>(
  workOrItems: Iterable<() => Promise<DetailedResult<T, TD>>> | Iterable<TItem>,
  fnOrIgnore: ((item: TItem, index: number) => Promise<DetailedResult<T, TD>>) | TD[],
  ignoreOrOptions?: TD[] | IAsyncResultOptions,
  maybeOptions?: IAsyncResultOptions
): Promise<Result<T[]>> {
  const isItems: boolean = _isItemsForm(fnOrIgnore);
  const ignore: TD[] = (isItems ? ignoreOrOptions : fnOrIgnore) as TD[];
  const options: IAsyncResultOptions | undefined = isItems
    ? maybeOptions
    : (ignoreOrOptions as IAsyncResultOptions | undefined);
  const work: (() => Promise<DetailedResult<T, TD>>)[] = _asWorkArray<TItem, DetailedResult<T, TD>>(
    workOrItems,
    fnOrIgnore
  );

  const errors: string[] = [];
  const elements: T[] = [];
  for (const outcome of await _scheduleBounded(work, options?.concurrency)) {
    if (outcome.isFailure()) {
      // the work function threw or rejected, so there is no detail for `ignore` to match.
      errors.push(outcome.message);
      continue;
    }
    const result: DetailedResult<T, TD> = outcome.value;
    if (result.isSuccess()) {
      elements.push(result.value);
    } else if (result.detail && !ignore.includes(result.detail)) {
      errors.push(result.message);
    }
  }

  if (errors.length > 0) {
    options?.aggregatedErrors?.addMessages(errors);
    return fail(errors.join('\n'));
  }
  return succeed(elements);
}

/**
 * Aggregates successful results from a collection of deferred asynchronous work, running at most
 * {@link IAsyncResultOptions.concurrency} operations at once and discarding failures unless
 * everything failed.
 * @remarks
 * This is the asynchronous sibling of {@link mapSuccess}, with the same fold.  Results are
 * returned in input order regardless of completion order.
 * @param work - The collection of {@link AsyncDeferredResult | AsyncDeferredResult<T>} to be run.
 * @param options - Optional {@link IAsyncResultOptions | options} for the call.
 * @returns {@link Success} with an array of `<T>` if any results were successful.  If all failed,
 * returns {@link Failure} with a concatenated summary of all error messages.
 * {@label DEFERRED}
 * @public
 */
export function mapSuccessAsync<T>(
  work: Iterable<AsyncDeferredResult<T>>,
  options?: IAsyncResultOptions
): Promise<Result<T[]>>;

/**
 * Applies an asynchronous {@link Result | Result<T>}-returning function to every element of a
 * collection, running at most {@link IAsyncResultOptions.concurrency} operations at once and
 * discarding failures unless everything failed.
 * @param items - The collection of items to be processed.
 * @param fn - The asynchronous function to be applied to each item.
 * @param options - Optional {@link IAsyncResultOptions | options} for the call.
 * @returns {@link Success} with an array of `<T>` if any results were successful.  If all failed,
 * returns {@link Failure} with a concatenated summary of all error messages.
 * {@label ITEMS}
 * @public
 */
export function mapSuccessAsync<TItem, T>(
  items: Iterable<TItem>,
  fn: (item: TItem, index: number) => Promise<Result<T>>,
  options?: IAsyncResultOptions
): Promise<Result<T[]>>;

export async function mapSuccessAsync<TItem, T>(
  workOrItems: Iterable<AsyncDeferredResult<T>> | Iterable<TItem>,
  fnOrOptions?: ((item: TItem, index: number) => Promise<Result<T>>) | IAsyncResultOptions,
  maybeOptions?: IAsyncResultOptions
): Promise<Result<T[]>> {
  const options: IAsyncResultOptions | undefined = _isItemsForm(fnOrOptions)
    ? maybeOptions
    : (fnOrOptions as IAsyncResultOptions | undefined);
  const work: AsyncDeferredResult<T>[] = _asWorkArray<TItem, Result<T>>(workOrItems, fnOrOptions);
  return mapSuccess(await _collectResults(work, options?.concurrency), options?.aggregatedErrors);
}

/**
 * Aggregates error messages from a collection of deferred asynchronous work, running at most
 * {@link IAsyncResultOptions.concurrency} operations at once.
 * @remarks
 * This is the asynchronous sibling of {@link mapFailures}.  Messages are returned in input order
 * regardless of completion order.
 * @param work - The collection of {@link AsyncDeferredResult | AsyncDeferredResult<T>} to be run.
 * @param options - Optional {@link IAsyncResultOptions | options} for the call.
 * @returns An array of strings consisting of all error messages returned by the work.  Ignores
 * successes and returns an empty array if there were no errors.
 * {@label DEFERRED}
 * @public
 */
export function mapFailuresAsync<T>(
  work: Iterable<AsyncDeferredResult<T>>,
  options?: IAsyncResultOptions
): Promise<string[]>;

/**
 * Applies an asynchronous {@link Result | Result<T>}-returning function to every element of a
 * collection, running at most {@link IAsyncResultOptions.concurrency} operations at once, and
 * aggregates the resulting error messages.
 * @param items - The collection of items to be processed.
 * @param fn - The asynchronous function to be applied to each item.
 * @param options - Optional {@link IAsyncResultOptions | options} for the call.
 * @returns An array of strings consisting of all error messages returned by the work.  Ignores
 * successes and returns an empty array if there were no errors.
 * {@label ITEMS}
 * @public
 */
export function mapFailuresAsync<TItem, T>(
  items: Iterable<TItem>,
  fn: (item: TItem, index: number) => Promise<Result<T>>,
  options?: IAsyncResultOptions
): Promise<string[]>;

export async function mapFailuresAsync<TItem, T>(
  workOrItems: Iterable<AsyncDeferredResult<T>> | Iterable<TItem>,
  fnOrOptions?: ((item: TItem, index: number) => Promise<Result<T>>) | IAsyncResultOptions,
  maybeOptions?: IAsyncResultOptions
): Promise<string[]> {
  const options: IAsyncResultOptions | undefined = _isItemsForm(fnOrOptions)
    ? maybeOptions
    : (fnOrOptions as IAsyncResultOptions | undefined);
  const work: AsyncDeferredResult<T>[] = _asWorkArray<TItem, Result<T>>(workOrItems, fnOrOptions);
  return mapFailures(await _collectResults(work, options?.concurrency), options?.aggregatedErrors);
}

/**
 * Determines whether a collection of deferred asynchronous work all succeeded, running at most
 * {@link IAsyncResultOptions.concurrency} operations at once.
 * @remarks
 * This is the asynchronous sibling of {@link allSucceed}, with the same fold.  It deliberately
 * does *not* short-circuit on the first failure: consistency with `allSucceed`'s
 * aggregate-everything contract beats a faster failure path.
 *
 * If `<T>` (the type of `successValue`) is itself a function type, the `(items, fn)` overload
 * cannot be distinguished from this one at runtime when options are also supplied.  Call the
 * deferred form with no options in that case, or wrap the value.
 * @param work - The collection of deferred work to be run.
 * @param successValue - The value to be returned if all work succeeds.
 * @param options - Optional {@link IAsyncResultOptions | options} for the call.
 * @returns {@link Success} with `successValue` if all work succeeded.  If any failed, returns
 * {@link Failure} with a concatenated summary of the error messages from all failed elements.
 * {@label DEFERRED}
 * @public
 */
export function allSucceedAsync<T>(
  work: Iterable<AsyncDeferredResult<unknown>>,
  successValue: T,
  options?: IAsyncResultOptions
): Promise<Result<T>>;

/**
 * Applies an asynchronous {@link Result}-returning function to every element of a collection,
 * running at most {@link IAsyncResultOptions.concurrency} operations at once, and determines
 * whether all of them succeeded.
 * @param items - The collection of items to be processed.
 * @param fn - The asynchronous function to be applied to each item.
 * @param successValue - The value to be returned if all work succeeds.
 * @param options - Optional {@link IAsyncResultOptions | options} for the call.
 * @returns {@link Success} with `successValue` if all work succeeded.  If any failed, returns
 * {@link Failure} with a concatenated summary of the error messages from all failed elements.
 * {@label ITEMS}
 * @public
 */
export function allSucceedAsync<TItem, T>(
  items: Iterable<TItem>,
  fn: (item: TItem, index: number) => Promise<Result<unknown>>,
  successValue: T,
  options?: IAsyncResultOptions
): Promise<Result<T>>;

export async function allSucceedAsync<TItem, T>(...args: unknown[]): Promise<Result<T>> {
  const isItems: boolean = _isAllSucceedItemsForm(args);
  const successValue: T = (isItems ? args[2] : args[1]) as T;
  const options: IAsyncResultOptions | undefined = (isItems ? args[3] : args[2]) as
    | IAsyncResultOptions
    | undefined;
  const work: AsyncDeferredResult<unknown>[] = _asWorkArray<TItem, Result<unknown>>(
    args[0] as Iterable<unknown>,
    isItems ? args[1] : undefined
  );
  return allSucceed(
    await _collectResults(work, options?.concurrency),
    successValue,
    options?.aggregatedErrors
  );
}

/**
 * String-keyed record of asynchronous initialization functions to be passed to
 * {@link populateObjectAsync}.
 * @public
 */
export type AsyncFieldInitializers<T> = {
  [key in keyof T]: (state: Partial<T>) => Promise<Result<T[key]>>;
};

/**
 * Populates an object based on a prototype full of asynchronous field initializers that return
 * {@link Result | Result<T[key]>}.
 * @remarks
 * This is the asynchronous sibling of `populateObject`, and it is *transitively*
 * asynchronous: the algorithm is unchanged and remains serial, because each initializer receives
 * the `Partial<T>` populated by the initializers before it.  That is dependency sequencing, so
 * this function deliberately takes no {@link IAsyncResultOptions} - offering a `concurrency`
 * option would imply the initializers are independent, which the `Partial<T>` contract says they
 * are not.
 *
 * An initializer which throws synchronously or returns a rejected promise is reported as a
 * failure for that key, exactly as if it had returned {@link Failure}.
 * @param initializers - An object with the shape of the target but with asynchronous initializer
 * functions for each property.
 * @param options - An optional {@link PopulateObjectOptions | set of options} which modify the
 * behavior of this call.
 * @param aggregatedErrors - Optional aggregator to which any error messages will be appended.
 * Each error is appended as an individual string.
 * @returns {@link Success} with the populated object if all initializers succeed, or
 * {@link Failure} with a concatenated list of all error messages.
 * @public
 */
export async function populateObjectAsync<T>(
  initializers: AsyncFieldInitializers<T>,
  options?: PopulateObjectOptions<T>,
  aggregatedErrors?: IMessageAggregator
): Promise<Result<T>> {
  const state: { [key in keyof T]: T[key] } = {} as { [key in keyof T]: T[key] };
  const errors: string[] = [];
  const keys: (keyof T)[] = Array.from(options?.order ?? []);
  const foundKeys: Set<keyof T> = new Set<keyof T>(options?.order);
  const suppressUndefined: boolean | (keyof T)[] | undefined = options?.suppressUndefined;

  // start with the supplied order then append anything else we find
  for (const key in initializers) {
    if (!foundKeys.has(key)) {
      keys.push(key);
      foundKeys.add(key);
    }
  }

  for (const key of keys) {
    if (initializers[key]) {
      const result: Result<T[keyof T]> = _flatten(
        await captureAsyncResult(async () => initializers[key](state))
      );
      if (result.isSuccess()) {
        if (result.value === undefined) {
          if (
            suppressUndefined === true ||
            (Array.isArray(suppressUndefined) && suppressUndefined.includes(key))
          ) {
            continue;
          }
        }
        state[key] = result.value;
      } else {
        errors.push(result.message);
      }
    } else {
      errors.push(`populateObjectAsync: Key ${String(key)} is present but has no initializer`);
    }
  }

  if (errors.length > 0) {
    aggregatedErrors?.addMessages(errors);
    return fail(errors.join('\n'));
  }
  return succeed(state as T);
}

/**
 * Returns the first successful result from an ordered collection of deferred asynchronous work.
 * @remarks
 * This is the asynchronous sibling of {@link firstSuccess}, and like it is serial: "first" means
 * "do not do work you do not need".  It is therefore *transitively* asynchronous and deliberately
 * takes no {@link IAsyncResultOptions} - a `concurrency` field on an operation which is serial by
 * definition would be a lie in the type signature.
 *
 * When every attempt fails, the failure carries every attempt's message.  An empty collection
 * fails with `no results found`.
 * @param work - The ordered collection of {@link AsyncDeferredResult | AsyncDeferredResult<T>}
 * to be attempted in turn.
 * @param aggregatedErrors - Optional aggregator to which error messages will be appended if no
 * attempt succeeds.  Each error is appended as an individual string.
 * @returns The first successful result, or {@link Failure} with a concatenated summary of all
 * error messages.
 * @public
 */
export async function firstSuccessAsync<T>(
  work: Iterable<AsyncDeferredResult<T>>,
  aggregatedErrors?: IMessageAggregator
): Promise<Result<T>> {
  const errors: MessageAggregator = new MessageAggregator();
  for (const deferred of work) {
    const result: Result<T> = await _invokeDeferred(deferred);
    if (result.isSuccess()) {
      return result;
    }
    errors.addMessage(result.message);
  }
  aggregatedErrors?.addMessages(errors.hasMessages ? errors.messages : ['no results found']);
  return errors.returnOrReport(fail('no results found'));
}
