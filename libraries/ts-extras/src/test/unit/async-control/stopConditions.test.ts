// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';

import { fail, Result, succeed } from '@fgv/ts-utils';
import { AsyncControl } from '../../..';

const { raceStopConditions, MAX_DEADLINE_MS } = AsyncControl;

/** A promise that never settles — the hang a stop exists for. */
function never<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

/** Lets every queued microtask run. */
async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

/** A timer seam the test fires by hand, counting arms and cancels. */
interface IManualTimer {
  readonly schedule: AsyncControl.ScheduleTimer;
  readonly fire: () => void;
  readonly armed: () => number;
  readonly cancelled: () => number;
  readonly lastMs: () => number | undefined;
}

function manualTimer(): IManualTimer {
  let fn: (() => void) | undefined;
  let armed = 0;
  let cancelled = 0;
  let lastMs: number | undefined;
  return {
    // A cancel that cannot stop a timer already queued: `fire` still runs the callback.
    schedule: (callback, ms) => {
      fn = callback;
      armed += 1;
      lastMs = ms;
      return () => {
        cancelled += 1;
      };
    },
    fire: () => fn?.(),
    armed: () => armed,
    cancelled: () => cancelled,
    lastMs: () => lastMs
  };
}

/** Work whose settlement the test controls, recording the signal it was handed. */
interface IControlledWork<T> {
  readonly work: (signal: AbortSignal) => Promise<Result<T>>;
  readonly settle: (r: Result<T>) => void;
  readonly signal: () => AbortSignal | undefined;
  readonly calls: () => number;
}

function controlledWork<T>(): IControlledWork<T> {
  let settle: (r: Result<T>) => void = () => undefined;
  let seen: AbortSignal | undefined;
  let calls = 0;
  return {
    work: (signal) => {
      calls += 1;
      seen = signal;
      return new Promise<Result<T>>((resolve) => {
        settle = resolve;
      });
    },
    settle: (r) => settle(r),
    signal: () => seen,
    calls: () => calls
  };
}

describe('AsyncControl.raceStopConditions', () => {
  describe('the work settles first', () => {
    test('passes the work success through, leaves its signal unfired, and releases the timer and listener', async () => {
      const timer = manualTimer();
      const caller = new AbortController();
      const removed = jest.spyOn(caller.signal, 'removeEventListener');
      const w = controlledWork<string>();
      const pending = raceStopConditions(w.work, {
        deadlineMs: 1000,
        signal: caller.signal,
        schedule: timer.schedule
      });
      w.settle(succeed('done'));
      expect(await pending).toSucceedWith('done');
      expect(w.signal()?.aborted).toBe(false);
      expect(timer.armed()).toBe(1);
      expect(timer.lastMs()).toBe(1000);
      expect(timer.cancelled()).toBe(1);
      expect(removed).toHaveBeenCalledWith('abort', expect.any(Function));
    });

    test('a caller abort after the work settled changes nothing', async () => {
      const caller = new AbortController();
      const w = controlledWork<string>();
      const pending = raceStopConditions(w.work, { signal: caller.signal });
      w.settle(succeed('done'));
      expect(await pending).toSucceedWith('done');
      caller.abort();
      expect(w.signal()?.aborted).toBe(false);
    });

    test('a work failure keeps its message, with detail failed', async () => {
      const result = await raceStopConditions(async () => fail<string>('work broke'), {});
      expect(result).toFailWithDetail(/work broke/, 'failed');
    });

    test('a synchronous throw from work is captured as failed', async () => {
      const result = await raceStopConditions<string>(
        () => {
          throw new Error('threw at once');
        },
        { deadlineMs: 10, schedule: manualTimer().schedule }
      );
      expect(result).toFailWithDetail(/threw at once/, 'failed');
    });

    test('work that resolves to something other than a Result is a failed result', async () => {
      const untyped = (async () => 'not a result') as unknown as () => Promise<Result<string>>;
      expect(await raceStopConditions(untyped, {})).toFailWithDetail(/did not resolve to a Result/, 'failed');
    });

    test('a rejected work promise is captured as failed', async () => {
      const result = await raceStopConditions<string>(() => Promise.reject(new Error('rejected')), {});
      expect(result).toFailWithDetail(/rejected/, 'failed');
    });
  });

  describe('a stop comes first', () => {
    test('a caller abort mid-work resolves at once with aborted, aborts the work signal, and releases the timer', async () => {
      const timer = manualTimer();
      const caller = new AbortController();
      const w = controlledWork<string>();
      const pending = raceStopConditions(w.work, {
        deadlineMs: 1000,
        signal: caller.signal,
        schedule: timer.schedule
      });
      caller.abort();
      expect(await pending).toFailWithDetail(/caller aborted/, 'aborted');
      expect(w.signal()?.aborted).toBe(true);
      expect(timer.cancelled()).toBe(1);
    });

    test('the deadline resolves at once with deadline even though the work never settles, and releases the listener', async () => {
      const timer = manualTimer();
      const caller = new AbortController();
      const removed = jest.spyOn(caller.signal, 'removeEventListener');
      let seen: AbortSignal | undefined;
      const pending = raceStopConditions(
        (signal) => {
          seen = signal;
          return never<Result<string>>();
        },
        { deadlineMs: 50, signal: caller.signal, schedule: timer.schedule }
      );
      timer.fire();
      expect(await pending).toFailWithDetail(/deadline expired/, 'deadline');
      expect(seen?.aborted).toBe(true);
      expect(removed).toHaveBeenCalledWith('abort', expect.any(Function));
      // A second stop after the first is a no-op.
      caller.abort();
      timer.fire();
    });

    test('the work value that arrives after a stop is discarded', async () => {
      const timer = manualTimer();
      const w = controlledWork<string>();
      const pending = raceStopConditions(w.work, { deadlineMs: 50, schedule: timer.schedule });
      timer.fire();
      w.settle(succeed('late'));
      expect(await pending).toFailWithDetail(/deadline/, 'deadline');
    });

    test('an already-aborted signal stops before work runs and arms nothing', async () => {
      const timer = manualTimer();
      const caller = new AbortController();
      caller.abort();
      const w = controlledWork<string>();
      expect(
        await raceStopConditions(w.work, { deadlineMs: 50, signal: caller.signal, schedule: timer.schedule })
      ).toFailWithDetail(/caller aborted/, 'aborted');
      expect(w.calls()).toBe(0);
      expect(timer.armed()).toBe(0);
    });

    test('a timer that fires synchronously from schedule stops before work runs', async () => {
      const caller = new AbortController();
      const removed = jest.spyOn(caller.signal, 'removeEventListener');
      const w = controlledWork<string>();
      const immediate: AsyncControl.ScheduleTimer = (fn) => {
        fn();
        return () => undefined;
      };
      expect(
        await raceStopConditions(w.work, { deadlineMs: 0, signal: caller.signal, schedule: immediate })
      ).toFailWithDetail(/deadline/, 'deadline');
      expect(w.calls()).toBe(0);
      expect(removed).toHaveBeenCalledWith('abort', expect.any(Function));
    });
  });

  describe('a stop and a settlement in the same tick', () => {
    test('a stop that fires after the settlement was observed is ignored, through a timer that cannot be cancelled', async () => {
      const timer = manualTimer();
      const w = controlledWork<string>();
      const pending = raceStopConditions(w.work, { deadlineMs: 50, schedule: timer.schedule });
      w.settle(succeed('done'));
      await flush();
      timer.fire();
      expect(await pending).toSucceedWith('done');
      expect(w.signal()?.aborted).toBe(false);
    });

    test('a stop that fires before the settlement was observed wins, and the value is discarded', async () => {
      const timer = manualTimer();
      const w = controlledWork<string>();
      const pending = raceStopConditions(w.work, { deadlineMs: 50, schedule: timer.schedule });
      w.settle(succeed('done'));
      timer.fire();
      expect(await pending).toFailWithDetail(/deadline/, 'deadline');
      expect(w.signal()?.aborted).toBe(true);
    });
  });

  describe('deadline validation', () => {
    test.each([Number.POSITIVE_INFINITY, Number.NaN, -1, 1.5, MAX_DEADLINE_MS + 1])(
      'refuses a deadlineMs of %p, schedules nothing and runs no work',
      async (deadlineMs) => {
        const timer = manualTimer();
        const w = controlledWork<string>();
        expect(await raceStopConditions(w.work, { deadlineMs, schedule: timer.schedule })).toFailWithDetail(
          /deadlineMs must be an integer/,
          'failed'
        );
        expect(timer.armed()).toBe(0);
        expect(w.calls()).toBe(0);
      }
    );

    test.each([0, MAX_DEADLINE_MS])('accepts a deadlineMs of %p', async (deadlineMs) => {
      const timer = manualTimer();
      expect(
        await raceStopConditions(async () => succeed('ok'), { deadlineMs, schedule: timer.schedule })
      ).toSucceedWith('ok');
      expect(timer.lastMs()).toBe(deadlineMs);
    });

    test('a schedule that throws is a failed result, and the listener is released', async () => {
      const caller = new AbortController();
      const removed = jest.spyOn(caller.signal, 'removeEventListener');
      const w = controlledWork<string>();
      expect(
        await raceStopConditions(w.work, {
          deadlineMs: 10,
          signal: caller.signal,
          schedule: () => {
            throw new Error('no timers here');
          }
        })
      ).toFailWithDetail(/schedule failed: no timers here/, 'failed');
      expect(w.calls()).toBe(0);
      expect(removed).toHaveBeenCalledWith('abort', expect.any(Function));
    });
  });

  describe('the default timer', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('stops on the deadline through setTimeout', async () => {
      let seen: AbortSignal | undefined;
      const pending = raceStopConditions(
        (signal) => {
          seen = signal;
          return never<Result<string>>();
        },
        { deadlineMs: 25 }
      );
      jest.advanceTimersByTime(25);
      expect(await pending).toFailWithDetail(/deadline/, 'deadline');
      expect(seen?.aborted).toBe(true);
    });

    test('clears its timeout when the work settles first', async () => {
      expect(await raceStopConditions(async () => succeed('ok'), { deadlineMs: 25 })).toSucceedWith('ok');
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
