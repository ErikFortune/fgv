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

import { DetailedResult, fail, failWithDetail, Result, succeed, succeedWithDetail } from '@fgv/ts-utils';
import { AsyncControl } from '../../..';

const { WriteGate, MAX_DEADLINE_MS } = AsyncControl;
type WriteGate = AsyncControl.WriteGate;

/** Swallows a settlement the test does not inspect. */
const ignore = (): undefined => undefined;

/** Lets every queued microtask run. */
async function flush(): Promise<void> {
  for (let i = 0; i < 20; i++) {
    await Promise.resolve();
  }
}

/** A timer seam the test fires by hand. */
interface IManualTimer {
  readonly schedule: AsyncControl.ScheduleTimer;
  readonly fire: () => void;
  readonly armed: () => number;
  readonly cancelled: () => number;
  readonly lastMs: () => number | undefined;
}

function manualTimer(options?: { readonly cancelThrows?: boolean }): IManualTimer {
  let fns: Array<() => void> = [];
  let armed = 0;
  let cancelled = 0;
  let lastMs: number | undefined;
  return {
    // A cancel that cannot stop a timer already queued: `fire` still runs every callback.
    schedule: (callback, ms) => {
      fns.push(callback);
      armed += 1;
      lastMs = ms;
      return () => {
        cancelled += 1;
        if (options?.cancelThrows === true) {
          throw new Error('cancel exploded');
        }
      };
    },
    fire: () => {
      const due = fns;
      fns = [];
      due.forEach((fn) => fn());
    },
    armed: () => armed,
    cancelled: () => cancelled,
    lastMs: () => lastMs
  };
}

/** A write whose settlement the test controls, counting its calls. */
interface IControlledWrite<T> {
  readonly write: () => Promise<Result<T>>;
  readonly settle: (r: Result<T>) => void;
  readonly calls: () => number;
}

function controlledWrite<T>(): IControlledWrite<T> {
  let settle: (r: Result<T>) => void = () => undefined;
  let calls = 0;
  return {
    write: () => {
      calls += 1;
      return new Promise<Result<T>>((resolve) => {
        settle = resolve;
      });
    },
    settle: (r) => settle(r),
    calls: () => calls
  };
}

function gate(timer?: IManualTimer): WriteGate {
  return WriteGate.create(timer !== undefined ? { schedule: timer.schedule } : undefined).orThrow();
}

describe('AsyncControl.WriteGate', () => {
  describe('create', () => {
    test('creates an open, quiet gate with or without a schedule', () => {
      expect(WriteGate.create()).toSucceedAndSatisfy((g) => {
        expect(g.inFlight).toBe(0);
        expect(g.waiting).toBe(0);
        expect(g.quiet).toBe(true);
        expect(g.check()).toSucceedWith(true);
      });
      expect(WriteGate.create({ schedule: manualTimer().schedule })).toSucceed();
    });

    test('refuses a schedule that is not a function', () => {
      const schedule = 'soon' as unknown as AsyncControl.ScheduleTimer;
      expect(WriteGate.create({ schedule })).toFailWith(/schedule must be a function/);
    });
  });

  describe('an open gate', () => {
    test('runs the write at once, counts it while it runs, and passes its result through unchanged', async () => {
      const g = gate();
      const w = controlledWrite<number>();
      const guarded = g.guard(w.write);
      // Called synchronously, inside guard, and counted before it was called.
      expect(w.calls()).toBe(1);
      expect(g.inFlight).toBe(1);
      expect(g.quiet).toBe(false);
      const own = succeed(42);
      w.settle(own);
      const result = await guarded;
      expect(result).toBe(own);
      expect(g.inFlight).toBe(0);
      expect(g.quiet).toBe(true);
    });

    test("passes the write's own failure through unchanged", async () => {
      const g = gate();
      const own = fail<number>('disk full');
      const result = await g.guard(async () => own);
      expect(result).toBe(own);
      expect(g.inFlight).toBe(0);
    });

    test('answers a synchronous throw as a failure and releases the slot', async () => {
      const g = gate();
      const result = await g.guard<number>(() => {
        throw new Error('sync boom');
      });
      expect(result).toFailWith(/the write threw: sync boom/);
      expect(g.inFlight).toBe(0);
    });

    test('answers a rejection, of an Error or anything else, as a failure and releases the slot', async () => {
      const g = gate();
      expect(await g.guard<number>(() => Promise.reject(new Error('async boom')))).toFailWith(
        /the write threw: async boom/
      );
      expect(await g.guard<number>(() => Promise.reject('plain'))).toFailWith(/the write threw: plain/);
      expect(g.inFlight).toBe(0);
    });

    test('lets a write nested inside a guarded write run: nesting only deadlocks against a pause', async () => {
      const g = gate();
      const result = await g.guard(async () => {
        expect(g.inFlight).toBe(1);
        return g.guard(async () => succeed(g.inFlight));
      });
      expect(result).toSucceedWith(2);
      expect(g.inFlight).toBe(0);
    });
  });

  describe('guardDetailed', () => {
    test("passes the write's own detailed result through, success or failure", async () => {
      const g = gate();
      const ok = succeedWithDetail<number, 'mine'>(1, 'mine');
      expect(await g.guardDetailed(async () => ok)).toBe(ok);
      const bad = failWithDetail<number, 'mine'>('nope', 'mine');
      expect(await g.guardDetailed(async () => bad)).toBe(bad);
    });

    test("details a refusal 'raised' and a throw 'threw'", async () => {
      const g = gate();
      expect(
        await g.guardDetailed<number, 'mine'>(() => Promise.reject(new Error('kaput')))
      ).toFailWithDetail(/threw: kaput/, 'threw');
      g.raise('restore');
      let called = 0;
      expect(
        await g.guardDetailed<number, 'mine'>(async () => {
          called += 1;
          return succeedWithDetail<number, 'mine'>(1, 'mine');
        })
      ).toFailWithDetail(/raised: restore; the write was not run/, 'raised');
      expect(called).toBe(0);
    });
  });

  describe('raise and lower', () => {
    test('check reports the reason while raised; lowering reopens', () => {
      const g = gate();
      g.raise('replacing the tree');
      expect(g.check()).toFailWith(/write gate is raised: replacing the tree/);
      g.raise('restoring');
      expect(g.check()).toFailWith(/raised: restoring/);
      g.lower();
      expect(g.check()).toSucceedWith(true);
    });

    test('refuses a new write without running it, and runs writes again once lowered', async () => {
      const g = gate();
      g.raise('restore');
      const w = controlledWrite<number>();
      expect(await g.guard(w.write)).toFailWith(/raised: restore; the write was not run/);
      expect(w.calls()).toBe(0);
      expect(g.inFlight).toBe(0);
      g.lower();
      const pending = g.guard(w.write);
      w.settle(succeed(3));
      expect(await pending).toSucceedWith(3);
    });

    test('does not interrupt a write already under way', async () => {
      const g = gate();
      const w = controlledWrite<number>();
      const pending = g.guard(w.write);
      g.raise('restore');
      expect(g.inFlight).toBe(1);
      w.settle(succeed(7));
      expect(await pending).toSucceedWith(7);
      expect(g.inFlight).toBe(0);
    });

    test('wakes every write waiting on a pause and refuses it, unrun, without resuming the pause', async () => {
      const g = gate();
      const held = (await g.pause(10)).orThrow();
      const w = controlledWrite<number>();
      const first = g.guard(w.write);
      const second = g.guard(w.write);
      await flush();
      expect(g.waiting).toBe(2);
      g.raise('restore');
      expect(g.waiting).toBe(0);
      expect(await first).toFailWith(/raised: restore/);
      expect(await second).toFailWith(/raised: restore/);
      expect(w.calls()).toBe(0);
      // Lowering does not resume: the pause still holds a new write.
      g.lower();
      const third = g.guard(w.write);
      await flush();
      expect(w.calls()).toBe(0);
      expect(g.waiting).toBe(1);
      held.resume();
      await flush();
      expect(w.calls()).toBe(1);
      w.settle(succeed(1));
      expect(await third).toSucceedWith(1);
    });
  });

  describe('pause', () => {
    test('with nothing under way, succeeds at once without arming a timer, and holds new writes', async () => {
      const timer = manualTimer();
      const g = gate(timer);
      const held = (await g.pause(100)).orThrow();
      expect(timer.armed()).toBe(0);
      const w = controlledWrite<number>();
      const pending = g.guard(w.write);
      await flush();
      expect(w.calls()).toBe(0);
      expect(g.waiting).toBe(1);
      expect(g.inFlight).toBe(0);
      held.resume();
      await flush();
      expect(w.calls()).toBe(1);
      expect(g.waiting).toBe(0);
      w.settle(succeed(5));
      expect(await pending).toSucceedWith(5);
    });

    test('holds writes from the moment it is called, before it resolves', async () => {
      const timer = manualTimer();
      const g = gate(timer);
      const inFlight = controlledWrite<number>();
      const first = g.guard(inFlight.write);
      const pausing = g.pause(100);
      // Same tick: the write asked after pause() is held, the one asked before it is waited for.
      const later = controlledWrite<number>();
      const second = g.guard(later.write);
      expect(later.calls()).toBe(0);
      expect(g.waiting).toBe(1);
      expect(timer.lastMs()).toBe(100);
      inFlight.settle(succeed(1));
      expect(await first).toSucceedWith(1);
      const held = (await pausing).orThrow();
      expect(timer.cancelled()).toBe(1);
      expect(later.calls()).toBe(0);
      held.resume();
      await flush();
      later.settle(succeed(2));
      expect(await second).toSucceedWith(2);
    });

    test('a write asked in the same tick before pause() is counted, and the pause waits for it', async () => {
      const timer = manualTimer();
      const g = gate(timer);
      const w = controlledWrite<number>();
      const pending = g.guard(w.write);
      const seen: { paused?: boolean } = {};
      const pausing = g.pause(100).then((r) => {
        seen.paused = r.isSuccess();
        return r;
      });
      await flush();
      expect(seen.paused).toBeUndefined();
      w.settle(succeed(1));
      await pending;
      await flush();
      expect(seen.paused).toBe(true);
      (await pausing).orThrow().resume();
    });

    test('nests: writes go ahead only once every pause is resumed, and resume is idempotent', async () => {
      const g = gate();
      const a = (await g.pause(10)).orThrow();
      const b = (await g.pause(10)).orThrow();
      const w = controlledWrite<number>();
      const pending = g.guard(w.write);
      a.resume();
      // A second resume of the same pause must not end the other one.
      a.resume();
      await flush();
      expect(w.calls()).toBe(0);
      b.resume();
      await flush();
      expect(w.calls()).toBe(1);
      w.settle(succeed(9));
      expect(await pending).toSucceedWith(9);
    });

    test('a woken write decides again: a pause taken before its turn holds it once more', async () => {
      const g = gate();
      const first = (await g.pause(10)).orThrow();
      const w = controlledWrite<number>();
      const pending = g.guard(w.write);
      await flush();
      first.resume();
      // Synchronously, before the woken write's continuation runs.
      const second = (await g.pause(10)).orThrow();
      await flush();
      expect(w.calls()).toBe(0);
      expect(g.waiting).toBe(1);
      second.resume();
      await flush();
      expect(w.calls()).toBe(1);
      w.settle(succeed(4));
      expect(await pending).toSucceedWith(4);
    });

    test("fails 'timeout' when the writes under way outlast it, and withdraws itself", async () => {
      const timer = manualTimer();
      const g = gate(timer);
      const slow = controlledWrite<number>();
      const pending = g.guard(slow.write);
      const pausing = g.pause(50);
      timer.fire();
      expect(await pausing).toFailWithDetail(/1 write\(s\) still under way after 50 ms$/, 'timeout');
      // Withdrawn: a new write runs at once.
      const next = controlledWrite<number>();
      const nextPending = g.guard(next.write);
      expect(next.calls()).toBe(1);
      next.settle(succeed(2));
      slow.settle(succeed(1));
      expect(await nextPending).toSucceedWith(2);
      expect(await pending).toSucceedWith(1);
    });

    test("detects the reentrant deadlock: a guarded write waiting on the pause fails it 'stalled', and is released", async () => {
      const timer = manualTimer();
      const g = gate(timer);
      const gateOpen = controlledWrite<number>();
      const steps: string[] = [];
      // An outer write that, once the pause is taken, guards an inner write on the same gate.
      const outer = g.guard(async () => {
        await gateOpen.write();
        steps.push('inner asked');
        const inner = await g.guard(async () => {
          steps.push('inner ran');
          return succeed(1);
        });
        return inner.onSuccess((v) => succeed(v + 1));
      });
      const pausing = g.pause(25);
      gateOpen.settle(succeed(0));
      await flush();
      expect(steps).toEqual(['inner asked']);
      expect(g.waiting).toBe(1);
      expect(g.inFlight).toBe(1);
      timer.fire();
      expect(await pausing).toFailWithDetail(
        /1 write\(s\) still under way after 25 ms while 1 waited on the pause; a guarded write that calls guard deadlocks/,
        'stalled'
      );
      expect(await outer).toSucceedWith(2);
      expect(steps).toEqual(['inner asked', 'inner ran']);
      expect(g.inFlight).toBe(0);
    });

    test('a timer that fires after the pause reached quiet is ignored: the pause stays held', async () => {
      const timer = manualTimer();
      const g = gate(timer);
      const w = controlledWrite<number>();
      const pending = g.guard(w.write);
      const pausing = g.pause(10);
      w.settle(succeed(1));
      await pending;
      const held = (await pausing).orThrow();
      // The cancel could not stop it; it fires anyway.
      timer.fire();
      const next = controlledWrite<number>();
      const nextPending = g.guard(next.write);
      await flush();
      expect(next.calls()).toBe(0);
      held.resume();
      await flush();
      next.settle(succeed(2));
      expect(await nextPending).toSucceedWith(2);
    });

    test("a cancel that throws neither fails the pause nor escapes into the write's release", async () => {
      const timer = manualTimer({ cancelThrows: true });
      const g = gate(timer);
      const w = controlledWrite<number>();
      const pending = g.guard(w.write);
      const pausing = g.pause(10);
      w.settle(succeed(1));
      expect(await pending).toSucceedWith(1);
      expect(g.inFlight).toBe(0);
      expect(await pausing).toSucceed();
      expect(timer.cancelled()).toBe(1);
    });

    test.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, MAX_DEADLINE_MS + 1])(
      "refuses timeoutMs %p as 'invalid', pausing nothing and arming nothing",
      async (ms) => {
        const timer = manualTimer();
        const g = gate(timer);
        expect(await g.pause(ms)).toFailWithDetail(/timeoutMs must be an integer/, 'invalid');
        expect(timer.armed()).toBe(0);
        const w = controlledWrite<number>();
        g.guard(w.write).then(ignore, ignore);
        expect(w.calls()).toBe(1);
      }
    );

    test('accepts the bounds 0 and MAX_DEADLINE_MS', async () => {
      const timer = manualTimer();
      const g = gate(timer);
      const w = controlledWrite<number>();
      const pending = g.guard(w.write);
      const atZero = g.pause(0);
      expect(timer.lastMs()).toBe(0);
      timer.fire();
      expect(await atZero).toFailWithDetail(/after 0 ms/, 'timeout');
      const atMax = g.pause(MAX_DEADLINE_MS);
      expect(timer.lastMs()).toBe(MAX_DEADLINE_MS);
      w.settle(succeed(1));
      await pending;
      (await atMax).orThrow().resume();
    });

    test("a schedule that throws fails 'invalid' and withdraws the pause", async () => {
      const g = WriteGate.create({
        schedule: () => {
          throw new Error('no timers here');
        }
      }).orThrow();
      const w = controlledWrite<number>();
      const pending = g.guard(w.write);
      expect(await g.pause(10)).toFailWithDetail(/schedule failed: no timers here/, 'invalid');
      const next = controlledWrite<number>();
      g.guard(next.write).then(ignore, ignore);
      expect(next.calls()).toBe(1);
      w.settle(succeed(1));
      expect(await pending).toSucceedWith(1);
    });

    test('a schedule that fires synchronously times the pause out at once', async () => {
      const g = WriteGate.create({
        schedule: (fn) => {
          fn();
          return () => undefined;
        }
      }).orThrow();
      const w = controlledWrite<number>();
      g.guard(w.write).then(ignore, ignore);
      expect(await g.pause(10)).toFailWithDetail(/still under way after 10 ms/, 'timeout');
      const next = controlledWrite<number>();
      g.guard(next.write).then(ignore, ignore);
      expect(next.calls()).toBe(1);
    });

    test('a schedule that fires synchronously and then throws keeps the first settlement', async () => {
      const g = WriteGate.create({
        schedule: (fn) => {
          fn();
          throw new Error('late throw');
        }
      }).orThrow();
      const w = controlledWrite<number>();
      g.guard(w.write).then(ignore, ignore);
      expect(await g.pause(10)).toFailWithDetail(/still under way/, 'timeout');
      const next = controlledWrite<number>();
      g.guard(next.write).then(ignore, ignore);
      expect(next.calls()).toBe(1);
    });

    test('the default schedule times out a pause on the platform timer, and cancels on quiet', async () => {
      const g = gate();
      const stuck = controlledWrite<number>();
      g.guard(stuck.write).then(ignore, ignore);
      expect(await g.pause(1)).toFailWithDetail(/after 1 ms/, 'timeout');
      stuck.settle(succeed(1));
      await flush();
      const quick = controlledWrite<number>();
      const pending = g.guard(quick.write);
      const pausing = g.pause(MAX_DEADLINE_MS);
      quick.settle(succeed(2));
      await pending;
      // Resolved by quiet, long before the timer: its clearTimeout leaves nothing pending.
      (await pausing).orThrow().resume();
    });
  });

  describe('types', () => {
    test('guard answers a Result and guardDetailed a DetailedResult', async () => {
      const g = gate();
      const plain: Result<number> = await g.guard(async () => succeed(1));
      const detailed: DetailedResult<number, 'x' | AsyncControl.WriteGateRefusal> = await g.guardDetailed(
        async () => succeedWithDetail<number, 'x'>(1, 'x')
      );
      expect(plain).toSucceedWith(1);
      expect(detailed).toSucceedWith(1);
    });
  });
});
