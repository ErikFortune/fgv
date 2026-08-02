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
import 'jest-extended';
import '../helpers/jest';

import {
  AsyncDeferredResult,
  DEFAULT_RESULT_CONCURRENCY,
  DetailedResult,
  MessageAggregator,
  Result,
  allSucceedAsync,
  fail,
  failWithDetail,
  firstSuccessAsync,
  mapDetailedResultsAsync,
  mapFailuresAsync,
  mapResultsAsync,
  mapSuccessAsync,
  populateObjectAsync,
  succeed,
  succeedWithDetail
} from '../../packlets/base';

/**
 * Records the number of work functions in flight at any moment, so tests can assert the
 * observed peak rather than inferring the bound from timing.
 */
class InFlightTracker {
  public peak: number = 0;
  public completed: string[] = [];
  private _inFlight: number = 0;

  public async track<T>(label: string, delayMs: number, produce: () => T): Promise<T> {
    this._inFlight++;
    this.peak = Math.max(this.peak, this._inFlight);
    await delay(delayMs);
    this._inFlight--;
    this.completed.push(label);
    return produce();
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Deferred work which succeeds with `value` after `delayMs`, recording in-flight counts.
 */
function tracked<T>(tracker: InFlightTracker, value: T, delayMs: number = 1): AsyncDeferredResult<T> {
  return () => tracker.track(String(value), delayMs, () => succeed(value));
}

/**
 * Deferred work which succeeds with `value` after `delayMs`.
 */
function later<T>(value: T, delayMs: number = 1): AsyncDeferredResult<T> {
  return async () => {
    await delay(delayMs);
    return succeed(value);
  };
}

/**
 * Deferred work which fails with `message` after `delayMs`.
 */
function failsLater<T>(message: string, delayMs: number = 1): AsyncDeferredResult<T> {
  return async () => {
    await delay(delayMs);
    return fail<T>(message);
  };
}

describe('async Result family', () => {
  describe('mapResultsAsync', () => {
    describe('deferred (thunk) form', () => {
      test('succeeds with all values when all work succeeds', async () => {
        expect(await mapResultsAsync([later(1), later(2), later(3)])).toSucceedWith([1, 2, 3]);
      });

      test('succeeds with an empty array for empty input', async () => {
        expect(await mapResultsAsync<number>([])).toSucceedWith([]);
      });

      test('returns results in input order regardless of completion order', async () => {
        const tracker: InFlightTracker = new InFlightTracker();
        const result: Result<number[]> = await mapResultsAsync(
          [
            () => tracker.track('slow', 30, () => succeed(1)),
            () => tracker.track('medium', 15, () => succeed(2)),
            () => tracker.track('fast', 1, () => succeed(3))
          ],
          { concurrency: 3 }
        );
        // completion order is the reverse of input order...
        expect(tracker.completed).toEqual(['fast', 'medium', 'slow']);
        // ...but the results are in input order.
        expect(result).toSucceedWith([1, 2, 3]);
      });

      test('aggregates every error and keeps scheduling after a failure', async () => {
        const tracker: InFlightTracker = new InFlightTracker();
        const result: Result<number[]> = await mapResultsAsync(
          [
            () => tracker.track('first', 1, () => fail<number>('first failed')),
            () => tracker.track('second', 1, () => succeed(2)),
            () => tracker.track('third', 1, () => fail<number>('third failed'))
          ],
          { concurrency: 1 }
        );
        // the failure at index 0 must not stop the rest of the work from being scheduled
        expect(tracker.completed).toEqual(['first', 'second', 'third']);
        expect(result).toFailWith(/first failed[\s\S]*third failed/);
      });

      test('converts a rejected promise to a failure rather than throwing', async () => {
        const boom: AsyncDeferredResult<number> = async () => {
          await delay(1);
          throw new Error('rejected work');
        };
        expect(await mapResultsAsync([later(1), boom])).toFailWith(/rejected work/);
      });

      test('converts a synchronous throw from a thunk to a failure rather than throwing', async () => {
        const boom: AsyncDeferredResult<number> = () => {
          throw new Error('synchronous boom');
        };
        expect(await mapResultsAsync([later(1), boom])).toFailWith(/synchronous boom/);
      });

      test('appends each error to a supplied aggregator', async () => {
        const aggregator: MessageAggregator = new MessageAggregator();
        expect(
          await mapResultsAsync([failsLater<number>('e1'), later(2), failsLater<number>('e3')], {
            aggregatedErrors: aggregator
          })
        ).toFail();
        expect(aggregator.messages).toEqual(['e1', 'e3']);
      });
    });

    describe('(items, fn) form', () => {
      test('applies the function to every item, passing the index', async () => {
        expect(
          await mapResultsAsync(['a', 'b', 'c'], async (item: string, index: number) =>
            succeed(`${index}:${item}`)
          )
        ).toSucceedWith(['0:a', '1:b', '2:c']);
      });

      test('accepts options after the function', async () => {
        const tracker: InFlightTracker = new InFlightTracker();
        expect(
          await mapResultsAsync(
            [1, 2, 3, 4, 5, 6],
            async (item: number) => tracker.track(`${item}`, 5, () => succeed(item * 2)),
            { concurrency: 2 }
          )
        ).toSucceedWith([2, 4, 6, 8, 10, 12]);
        expect(tracker.peak).toBeLessThanOrEqual(2);
      });

      test('converts a throwing function to a failure', async () => {
        expect(
          await mapResultsAsync([1, 2], async (item: number) => {
            if (item === 2) {
              throw new Error(`item ${item} exploded`);
            }
            return succeed(item);
          })
        ).toFailWith(/item 2 exploded/);
      });

      test('succeeds with an empty array for empty items', async () => {
        expect(await mapResultsAsync([] as number[], async (item: number) => succeed(item))).toSucceedWith(
          []
        );
      });
    });

    describe('concurrency bound', () => {
      test('never exceeds the requested concurrency', async () => {
        const tracker: InFlightTracker = new InFlightTracker();
        const work: AsyncDeferredResult<number>[] = Array.from({ length: 20 }, (__, i) =>
          tracked(tracker, i, 5)
        );
        expect(await mapResultsAsync(work, { concurrency: 3 })).toSucceed();
        expect(tracker.peak).toBeLessThanOrEqual(3);
        expect(tracker.peak).toBeGreaterThan(1);
      });

      test('runs serially when concurrency is 1', async () => {
        const tracker: InFlightTracker = new InFlightTracker();
        const work: AsyncDeferredResult<number>[] = Array.from({ length: 6 }, (__, i) =>
          tracked(tracker, i, 2)
        );
        expect(await mapResultsAsync(work, { concurrency: 1 })).toSucceed();
        expect(tracker.peak).toBe(1);
      });

      test('applies the documented finite default when no concurrency is supplied', async () => {
        const tracker: InFlightTracker = new InFlightTracker();
        const work: AsyncDeferredResult<number>[] = Array.from(
          { length: DEFAULT_RESULT_CONCURRENCY * 3 },
          (__, i) => tracked(tracker, i, 5)
        );
        expect(await mapResultsAsync(work)).toSucceed();
        expect(DEFAULT_RESULT_CONCURRENCY).toBeGreaterThan(0);
        expect(Number.isFinite(DEFAULT_RESULT_CONCURRENCY)).toBe(true);
        expect(tracker.peak).toBeLessThanOrEqual(DEFAULT_RESULT_CONCURRENCY);
        expect(tracker.peak).toBeGreaterThan(1);
      });

      test.each([
        ['zero', 0],
        ['negative', -4],
        ['NaN', Number.NaN]
      ])(
        'clamps a %s concurrency to 1 rather than stalling',
        async (__label: string, concurrency: number) => {
          const tracker: InFlightTracker = new InFlightTracker();
          const work: AsyncDeferredResult<number>[] = Array.from({ length: 4 }, (___, i) =>
            tracked(tracker, i, 1)
          );
          expect(await mapResultsAsync(work, { concurrency })).toSucceedWith([0, 1, 2, 3]);
          expect(tracker.peak).toBe(1);
        }
      );

      test('truncates a fractional concurrency', async () => {
        const tracker: InFlightTracker = new InFlightTracker();
        const work: AsyncDeferredResult<number>[] = Array.from({ length: 8 }, (__, i) =>
          tracked(tracker, i, 5)
        );
        expect(await mapResultsAsync(work, { concurrency: 2.9 })).toSucceed();
        expect(tracker.peak).toBeLessThanOrEqual(2);
      });

      test('runs everything at once when concurrency is infinite', async () => {
        const tracker: InFlightTracker = new InFlightTracker();
        const work: AsyncDeferredResult<number>[] = Array.from({ length: 5 }, (__, i) =>
          tracked(tracker, i, 5)
        );
        expect(await mapResultsAsync(work, { concurrency: Number.POSITIVE_INFINITY })).toSucceed();
        expect(tracker.peak).toBe(5);
      });

      test('never starts more workers than there is work', async () => {
        const tracker: InFlightTracker = new InFlightTracker();
        const work: AsyncDeferredResult<number>[] = [tracked(tracker, 1, 2), tracked(tracker, 2, 2)];
        expect(await mapResultsAsync(work, { concurrency: 100 })).toSucceedWith([1, 2]);
        expect(tracker.peak).toBe(2);
      });
    });
  });

  describe('mapDetailedResultsAsync', () => {
    type Detail = 'ignore-me' | 'fatal';

    test('succeeds with all values when all work succeeds', async () => {
      expect(
        await mapDetailedResultsAsync<number, Detail>(
          [
            async () => succeedWithDetail<number, Detail>(1),
            async () => succeedWithDetail<number, Detail>(2)
          ],
          []
        )
      ).toSucceedWith([1, 2]);
    });

    test('ignores failures whose detail is listed in ignore', async () => {
      expect(
        await mapDetailedResultsAsync<number, Detail>(
          [
            async () => succeedWithDetail<number, Detail>(1),
            async () => failWithDetail<number, Detail>('skipped', 'ignore-me'),
            async () => succeedWithDetail<number, Detail>(3)
          ],
          ['ignore-me']
        )
      ).toSucceedWith([1, 3]);
    });

    test('reports failures whose detail is not listed in ignore', async () => {
      expect(
        await mapDetailedResultsAsync<number, Detail>(
          [
            async () => failWithDetail<number, Detail>('boom', 'fatal'),
            async () => failWithDetail<number, Detail>('skipped', 'ignore-me')
          ],
          ['ignore-me']
        )
      ).toFailWith(/boom/);
    });

    test('never ignores a rejected work function, since it carries no detail', async () => {
      expect(
        await mapDetailedResultsAsync<number, Detail>(
          [
            async () => succeedWithDetail<number, Detail>(1),
            async () => {
              throw new Error('unignorable');
            }
          ],
          ['ignore-me', 'fatal']
        )
      ).toFailWith(/unignorable/);
    });

    test('appends every non-ignorable error to a supplied aggregator', async () => {
      const aggregator: MessageAggregator = new MessageAggregator();
      expect(
        await mapDetailedResultsAsync<number, Detail>(
          [
            async () => failWithDetail<number, Detail>('e1', 'fatal'),
            async () => failWithDetail<number, Detail>('e2', 'fatal')
          ],
          [],
          { aggregatedErrors: aggregator }
        )
      ).toFail();
      expect(aggregator.messages).toEqual(['e1', 'e2']);
    });

    test('succeeds with an empty array for empty input', async () => {
      expect(await mapDetailedResultsAsync<number, Detail>([], [])).toSucceedWith([]);
    });

    test('supports the (items, fn) form with ignore and options', async () => {
      const tracker: InFlightTracker = new InFlightTracker();
      const result: Result<number[]> = await mapDetailedResultsAsync(
        [1, 2, 3, 4],
        async (item: number): Promise<DetailedResult<number, Detail>> =>
          tracker.track(`${item}`, 4, () =>
            item % 2 === 0
              ? failWithDetail<number, Detail>(`even ${item}`, 'ignore-me')
              : succeedWithDetail<number, Detail>(item)
          ),
        ['ignore-me'],
        { concurrency: 2 }
      );
      expect(result).toSucceedWith([1, 3]);
      expect(tracker.peak).toBeLessThanOrEqual(2);
    });

    test('bounds concurrency in the deferred form', async () => {
      const tracker: InFlightTracker = new InFlightTracker();
      const work: (() => Promise<DetailedResult<number, Detail>>)[] = Array.from(
        { length: 10 },
        (__, i) => () => tracker.track(`${i}`, 4, () => succeedWithDetail<number, Detail>(i))
      );
      expect(await mapDetailedResultsAsync(work, [], { concurrency: 3 })).toSucceed();
      expect(tracker.peak).toBeLessThanOrEqual(3);
    });
  });

  describe('mapSuccessAsync', () => {
    test('returns only the successful values, in input order', async () => {
      expect(
        await mapSuccessAsync([later(1, 20), failsLater<number>('nope'), later(3, 1)], {
          concurrency: 3
        })
      ).toSucceedWith([1, 3]);
    });

    test('fails with every message when everything fails', async () => {
      expect(await mapSuccessAsync([failsLater<number>('e1'), failsLater<number>('e2')])).toFailWith(
        /e1[\s\S]*e2/
      );
    });

    test('appends errors to a supplied aggregator only when everything fails', async () => {
      const aggregator: MessageAggregator = new MessageAggregator();
      expect(
        await mapSuccessAsync([failsLater<number>('e1'), later(2)], { aggregatedErrors: aggregator })
      ).toSucceedWith([2]);
      expect(aggregator.hasMessages).toBe(false);

      expect(await mapSuccessAsync([failsLater<number>('e1')], { aggregatedErrors: aggregator })).toFail();
      expect(aggregator.messages).toEqual(['e1']);
    });

    test('succeeds with an empty array for empty input', async () => {
      expect(await mapSuccessAsync<number>([])).toSucceedWith([]);
    });

    test('supports the (items, fn) form with a concurrency bound', async () => {
      const tracker: InFlightTracker = new InFlightTracker();
      expect(
        await mapSuccessAsync(
          [1, 2, 3, 4, 5],
          async (item: number) =>
            tracker.track(`${item}`, 4, () =>
              item % 2 === 0 ? fail<number>(`even ${item}`) : succeed(item)
            ),
          { concurrency: 2 }
        )
      ).toSucceedWith([1, 3, 5]);
      expect(tracker.peak).toBeLessThanOrEqual(2);
    });
  });

  describe('mapFailuresAsync', () => {
    test('returns the error messages in input order', async () => {
      expect(
        await mapFailuresAsync([failsLater<number>('e1', 20), later(2, 10), failsLater<number>('e3', 1)], {
          concurrency: 3
        })
      ).toEqual(['e1', 'e3']);
    });

    test('returns an empty array when nothing failed', async () => {
      expect(await mapFailuresAsync([later(1), later(2)])).toEqual([]);
    });

    test('returns an empty array for empty input', async () => {
      expect(await mapFailuresAsync<number>([])).toEqual([]);
    });

    test('includes rejected work as a failure', async () => {
      expect(
        await mapFailuresAsync<number>([
          async () => {
            throw new Error('rejected');
          }
        ])
      ).toEqual([expect.stringContaining('rejected')]);
    });

    test('appends messages to a supplied aggregator', async () => {
      const aggregator: MessageAggregator = new MessageAggregator();
      expect(
        await mapFailuresAsync([failsLater<number>('e1'), later(2)], { aggregatedErrors: aggregator })
      ).toEqual(['e1']);
      expect(aggregator.messages).toEqual(['e1']);
    });

    test('supports the (items, fn) form with a concurrency bound', async () => {
      const tracker: InFlightTracker = new InFlightTracker();
      expect(
        await mapFailuresAsync(
          [1, 2, 3, 4],
          async (item: number) =>
            tracker.track(`${item}`, 4, () => (item > 2 ? fail<number>(`too big: ${item}`) : succeed(item))),
          { concurrency: 2 }
        )
      ).toEqual(['too big: 3', 'too big: 4']);
      expect(tracker.peak).toBeLessThanOrEqual(2);
    });
  });

  describe('allSucceedAsync', () => {
    test('returns the success value when all work succeeds', async () => {
      expect(await allSucceedAsync([later(1), later(2)], 'all good')).toSucceedWith('all good');
    });

    test('returns the success value for empty input', async () => {
      expect(await allSucceedAsync([], 'nothing to do')).toSucceedWith('nothing to do');
    });

    test('does not short-circuit on failure and aggregates every error', async () => {
      const tracker: InFlightTracker = new InFlightTracker();
      const result: Result<string> = await allSucceedAsync(
        [
          () => tracker.track('first', 1, () => fail<number>('e1')),
          () => tracker.track('second', 1, () => succeed(2)),
          () => tracker.track('third', 1, () => fail<number>('e3'))
        ],
        'unused',
        { concurrency: 1 }
      );
      // consistency with allSucceed's aggregate-everything contract beats a faster failure path
      expect(tracker.completed).toEqual(['first', 'second', 'third']);
      expect(result).toFailWith(/e1[\s\S]*e3/);
    });

    test('treats a rejected work function as a failure', async () => {
      expect(
        await allSucceedAsync(
          [
            later(1),
            async () => {
              throw new Error('rejected work');
            }
          ],
          'unused'
        )
      ).toFailWith(/rejected work/);
    });

    test('appends every error to a supplied aggregator', async () => {
      const aggregator: MessageAggregator = new MessageAggregator();
      expect(
        await allSucceedAsync([failsLater<number>('e1'), failsLater<number>('e2')], 'unused', {
          aggregatedErrors: aggregator
        })
      ).toFail();
      expect(aggregator.messages).toEqual(['e1', 'e2']);
    });

    test('supports the (items, fn) form with options', async () => {
      const tracker: InFlightTracker = new InFlightTracker();
      expect(
        await allSucceedAsync(
          [1, 2, 3, 4, 5, 6],
          async (item: number) => tracker.track(`${item}`, 4, () => succeed(item)),
          'done',
          { concurrency: 2 }
        )
      ).toSucceedWith('done');
      expect(tracker.peak).toBeLessThanOrEqual(2);
    });

    test('supports the (items, fn) form without options', async () => {
      expect(await allSucceedAsync([1, 2], async (item: number) => succeed(item), 'done-too')).toSucceedWith(
        'done-too'
      );
    });

    test('bounds concurrency in the deferred form', async () => {
      const tracker: InFlightTracker = new InFlightTracker();
      const work: AsyncDeferredResult<number>[] = Array.from({ length: 9 }, (__, i) =>
        tracked(tracker, i, 4)
      );
      expect(await allSucceedAsync(work, true, { concurrency: 3 })).toSucceedWith(true);
      expect(tracker.peak).toBeLessThanOrEqual(3);
    });

    test('treats a function-valued successValue as the success value when no options are supplied', async () => {
      const successValue: () => string = () => 'i am a value';
      expect(await allSucceedAsync([later(1)], successValue)).toSucceedAndSatisfy((value: () => string) => {
        expect(value()).toBe('i am a value');
      });
    });

    // The three-argument shape is the one the dispatch heuristic cannot settle from the second
    // argument alone: a deferred call whose successValue is a function is indistinguishable
    // from an (items, fn) call by arity and argument types. The first argument settles it -
    // deferred work is an iterable of functions. Before that tie-break this call compiled
    // cleanly and then failed at runtime with 'func(...).then is not a function'.
    test('treats a function-valued successValue as the success value when options ARE supplied', async () => {
      const successValue: () => string = () => 'i am a value';
      expect(
        await allSucceedAsync([later(1), later(2)], successValue, { concurrency: 2 })
      ).toSucceedAndSatisfy((value: () => string) => {
        expect(value()).toBe('i am a value');
      });
    });

    // The other half of the tie-break: the (items, fn) form must not be captured by it. The
    // documented fn signature is (item, index), but callers routinely ignore the index, so a
    // length-1 callback is the common case and must dispatch as items - which is why the
    // discriminator deliberately does not key on fn.length.
    test('still dispatches the (items, fn) form when fn ignores the index', async () => {
      expect(
        await allSucceedAsync([1, 2, 3], async (n: number) => succeed(n), 'done', { concurrency: 2 })
      ).toSucceedWith('done');
    });

    test('still dispatches the (items, fn) form with three arguments and no options', async () => {
      expect(
        await allSucceedAsync([1, 2, 3], async (n: number, i: number) => succeed(n + i), 'ok')
      ).toSucceedWith('ok');
    });
  });

  describe('populateObjectAsync', () => {
    interface ITarget {
      first: string;
      second: number;
      third?: string;
    }

    test('populates every field from its initializer', async () => {
      expect(
        await populateObjectAsync<ITarget>({
          first: async () => succeed('one'),
          second: async () => succeed(2),
          third: async () => succeed('three')
        })
      ).toSucceedWith({ first: 'one', second: 2, third: 'three' });
    });

    test('runs serially so later initializers see earlier state', async () => {
      const order: string[] = [];
      expect(
        await populateObjectAsync<ITarget>(
          {
            first: async () => {
              await delay(10);
              order.push('first');
              return succeed('one');
            },
            second: async (state) => {
              order.push('second');
              return succeed(state.first === 'one' ? 2 : -1);
            },
            third: async (state) => {
              order.push('third');
              return succeed(`${state.first}/${state.second}`);
            }
          },
          { order: ['first', 'second', 'third'] }
        )
      ).toSucceedWith({ first: 'one', second: 2, third: 'one/2' });
      expect(order).toEqual(['first', 'second', 'third']);
    });

    test('aggregates errors from every failing initializer', async () => {
      const aggregator: MessageAggregator = new MessageAggregator();
      expect(
        await populateObjectAsync<ITarget>(
          {
            first: async () => fail('first failed'),
            second: async () => fail('second failed'),
            third: async () => succeed('ok')
          },
          undefined,
          aggregator
        )
      ).toFailWith(/first failed[\s\S]*second failed/);
      expect(aggregator.messages).toEqual(['first failed', 'second failed']);
    });

    test('converts a throwing initializer to a failure rather than throwing', async () => {
      expect(
        await populateObjectAsync<ITarget>({
          first: async () => {
            throw new Error('initializer exploded');
          },
          second: async () => succeed(2),
          third: async () => succeed('three')
        })
      ).toFailWith(/initializer exploded/);
    });

    test('reports a key which is present but has no initializer', async () => {
      expect(
        await populateObjectAsync<ITarget>({
          first: async () => succeed('one'),
          second: undefined as unknown as (state: Partial<ITarget>) => Promise<Result<number>>,
          third: async () => succeed('three')
        })
      ).toFailWith(/second is present but has no initializer/);
    });

    test('suppresses undefined values for all keys when suppressUndefined is true', async () => {
      expect(
        await populateObjectAsync<ITarget>(
          {
            first: async () => succeed('one'),
            second: async () => succeed(2),
            third: async () => succeed(undefined)
          },
          { suppressUndefined: true }
        )
      ).toSucceedAndSatisfy((target: ITarget) => {
        expect(target).toEqual({ first: 'one', second: 2 });
        expect('third' in target).toBe(false);
      });
    });

    test('suppresses undefined values only for the listed keys', async () => {
      expect(
        await populateObjectAsync<ITarget>(
          {
            first: async () => succeed(undefined as unknown as string),
            second: async () => succeed(2),
            third: async () => succeed(undefined)
          },
          { suppressUndefined: ['third'] }
        )
      ).toSucceedAndSatisfy((target: ITarget) => {
        expect('first' in target).toBe(true);
        expect(target.first).toBeUndefined();
        expect('third' in target).toBe(false);
      });
    });

    test('writes undefined values by default', async () => {
      expect(
        await populateObjectAsync<ITarget>({
          first: async () => succeed('one'),
          second: async () => succeed(2),
          third: async () => succeed(undefined)
        })
      ).toSucceedAndSatisfy((target: ITarget) => {
        expect('third' in target).toBe(true);
        expect(target.third).toBeUndefined();
      });
    });

    test('evaluates unlisted keys after the ordered ones', async () => {
      const order: (keyof ITarget)[] = [];
      expect(
        await populateObjectAsync<ITarget>(
          {
            first: async () => {
              order.push('first');
              return succeed('one');
            },
            second: async () => {
              order.push('second');
              return succeed(2);
            },
            third: async () => {
              order.push('third');
              return succeed('three');
            }
          },
          { order: ['third'] }
        )
      ).toSucceed();
      expect(order[0]).toBe('third');
      expect(order.slice(1).sort()).toEqual(['first', 'second']);
    });

    test('succeeds with an empty object when there are no initializers', async () => {
      expect(await populateObjectAsync<Record<string, never>>({})).toSucceedWith({});
    });
  });

  describe('firstSuccessAsync', () => {
    test('returns the first success without invoking later work', async () => {
      const invoked: string[] = [];
      const result: Result<string> = await firstSuccessAsync<string>([
        async () => {
          invoked.push('a');
          return fail('a failed');
        },
        async () => {
          invoked.push('b');
          return succeed('b won');
        },
        async () => {
          invoked.push('c');
          return succeed('c never runs');
        }
      ]);
      expect(result).toSucceedWith('b won');
      expect(invoked).toEqual(['a', 'b']);
    });

    test('fails with every attempt message when all attempts fail', async () => {
      expect(
        await firstSuccessAsync<string>([failsLater<string>('e1'), failsLater<string>('e2')])
      ).toFailWith(/e1[\s\S]*e2/);
    });

    test('appends every attempt message to a supplied aggregator when all attempts fail', async () => {
      const aggregator: MessageAggregator = new MessageAggregator();
      expect(
        await firstSuccessAsync<string>([failsLater<string>('e1'), failsLater<string>('e2')], aggregator)
      ).toFail();
      expect(aggregator.messages).toEqual(['e1', 'e2']);
    });

    test('does not aggregate earlier failures when an attempt succeeds', async () => {
      const aggregator: MessageAggregator = new MessageAggregator();
      expect(
        await firstSuccessAsync<string>([failsLater<string>('e1'), later('ok')], aggregator)
      ).toSucceedWith('ok');
      expect(aggregator.hasMessages).toBe(false);
    });

    test('fails with "no results found" for empty input', async () => {
      const aggregator: MessageAggregator = new MessageAggregator();
      expect(await firstSuccessAsync<string>([], aggregator)).toFailWith(/no results found/);
      expect(aggregator.messages).toEqual(['no results found']);
    });

    test('treats a rejected work function as a failed attempt', async () => {
      expect(
        await firstSuccessAsync<string>([
          async () => {
            throw new Error('attempt exploded');
          },
          later('recovered')
        ])
      ).toSucceedWith('recovered');
    });

    test('treats a synchronous throw from a thunk as a failed attempt', async () => {
      expect(
        await firstSuccessAsync<string>([
          () => {
            throw new Error('sync boom');
          },
          later('recovered')
        ])
      ).toSucceedWith('recovered');
    });
  });
});
