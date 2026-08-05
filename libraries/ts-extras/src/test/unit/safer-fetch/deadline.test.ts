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

// eslint-disable-next-line @rushstack/packlets/mechanics
import { DeadlineWatch } from '../../../packlets/safer-fetch/deadline';

function after(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

describe('DeadlineWatch', () => {
  test('lets a promise that settles in time through, unchanged', async () => {
    const watch = new DeadlineWatch(1_000, 1_000);
    try {
      await expect(watch.race(Promise.resolve('value'))).resolves.toEqual({
        stopped: false,
        value: 'value'
      });
      expect(watch.cause).toBeUndefined();
    } finally {
      watch.dispose();
    }
  });

  test('stops a promise that outlives the headers deadline', async () => {
    const watch = new DeadlineWatch(1_000, 5);
    try {
      await expect(watch.race(after(1_000))).resolves.toEqual({ stopped: true, cause: 'headers' });
      expect(watch.toFailureReason('headers')).toEqual({
        kind: 'timeout',
        phase: 'headers',
        elapsedMs: expect.any(Number),
        limitMs: 5
      });
    } finally {
      watch.dispose();
    }
  });

  test('attributes an overall expiry to the body phase once headers have arrived', async () => {
    const watch = new DeadlineWatch(10, 1_000);
    try {
      watch.headersReceived();
      await expect(watch.race(after(1_000))).resolves.toEqual({ stopped: true, cause: 'body' });
      expect(watch.toFailureReason('body')).toEqual({
        kind: 'timeout',
        phase: 'body',
        elapsedMs: expect.any(Number),
        limitMs: 10
      });
    } finally {
      watch.dispose();
    }
  });

  test('headersReceived is idempotent', async () => {
    const watch = new DeadlineWatch(20, 5);
    try {
      watch.headersReceived();
      watch.headersReceived();
      // The headers deadline no longer applies, so the overall one is what eventually fires.
      await expect(watch.race(after(1_000))).resolves.toEqual({ stopped: true, cause: 'body' });
    } finally {
      watch.dispose();
    }
  });

  test('reports a caller abort as aborted, never as a timeout', async () => {
    const controller = new AbortController();
    const watch = new DeadlineWatch(1_000, 1_000, controller.signal);
    try {
      const raced = watch.race(after(1_000));
      controller.abort();
      await expect(raced).resolves.toEqual({ stopped: true, cause: 'caller-aborted' });
      expect(watch.toFailureReason('caller-aborted')).toEqual({ kind: 'aborted' });
    } finally {
      watch.dispose();
    }
  });

  test('short-circuits a race started after the call was already stopped', async () => {
    const controller = new AbortController();
    controller.abort();
    const watch = new DeadlineWatch(1_000, 1_000, controller.signal);
    try {
      expect(watch.cause).toBe('caller-aborted');
      await expect(watch.race(Promise.resolve('value'))).resolves.toEqual({
        stopped: true,
        cause: 'caller-aborted'
      });
    } finally {
      watch.dispose();
    }
  });

  // The overall and headers deadlines can be scheduled for the same instant, and a caller can
  // abort while one of them is already firing. Whichever arrives first is what the caller is
  // told; a later one must not rewrite it.
  test('keeps the first cause when later deadlines fire behind it', async () => {
    const controller = new AbortController();
    controller.abort();
    const watch = new DeadlineWatch(5, 5, controller.signal);
    try {
      expect(watch.cause).toBe('caller-aborted');
      await after(30);
      expect(watch.cause).toBe('caller-aborted');
    } finally {
      watch.dispose();
    }
  });

  test('dispose is safe to call more than once', () => {
    const controller = new AbortController();
    const watch = new DeadlineWatch(1_000, 1_000, controller.signal);
    watch.dispose();
    watch.dispose();
    expect(watch.cause).toBeUndefined();
  });

  // A body read races once per chunk. A waiter set that only grew would be a leak in the exact
  // path whose job is to bound what a hostile response can cost the process.
  test('does not accumulate waiters across many races', async () => {
    const watch = new DeadlineWatch(5_000, 5_000);
    try {
      for (let i: number = 0; i < 200; i++) {
        await watch.race(Promise.resolve(i));
      }
      const waiters = (watch as unknown as { _waiters: Set<unknown> })._waiters;
      expect(waiters.size).toBe(0);
    } finally {
      watch.dispose();
    }
  });

  describe('remainingMs', () => {
    test('reports the unspent share of the overall deadline', async () => {
      const watch = new DeadlineWatch(1_000, 1_000);
      try {
        expect(watch.remainingMs).toBeGreaterThan(900);
        expect(watch.remainingMs).toBeLessThanOrEqual(1_000);
        await after(60);
        expect(watch.remainingMs).toBeLessThan(950);
      } finally {
        watch.dispose();
      }
    });

    test('never reports a negative budget', async () => {
      // The retry scheduler compares a computed delay against this; a negative value would read
      // as "no budget" only by accident, and as a very large budget under a sign slip.
      const watch = new DeadlineWatch(10, 1_000);
      try {
        await after(40);
        expect(watch.remainingMs).toBe(0);
      } finally {
        watch.dispose();
      }
    });
  });

  describe('delay', () => {
    test('waits out the interval when nothing stops the call', async () => {
      const watch = new DeadlineWatch(1_000, 1_000);
      try {
        const startedAt: number = Date.now();
        await expect(watch.delay(40)).resolves.toEqual({ stopped: false, value: true });
        expect(Date.now() - startedAt).toBeGreaterThanOrEqual(30);
      } finally {
        watch.dispose();
      }
    });

    test('is cut short by a caller abort, and says so', async () => {
      // What makes a caller's cancellation responsive during a retry backoff rather than after
      // it: a bare setTimeout would make the caller wait out the full delay.
      const controller = new AbortController();
      const watch = new DeadlineWatch(10_000, 10_000, controller.signal);
      try {
        const pending = watch.delay(5_000);
        controller.abort();
        await expect(pending).resolves.toEqual({ stopped: true, cause: 'caller-aborted' });
      } finally {
        watch.dispose();
      }
    });

    test('is cut short by the overall deadline', async () => {
      const watch = new DeadlineWatch(30, 10_000);
      try {
        await expect(watch.delay(5_000)).resolves.toEqual({ stopped: true, cause: 'overall' });
      } finally {
        watch.dispose();
      }
    });

    test('leaves no timer pending once it has been cut short', async () => {
      // A stray five-second timer would keep a test runner — and a process — alive well past
      // the call it belonged to.
      const controller = new AbortController();
      const watch = new DeadlineWatch(10_000, 10_000, controller.signal);
      try {
        const pending = watch.delay(5_000);
        controller.abort();
        await pending;
        // No assertion beyond the suite finishing promptly; jest's open-handle detection is the
        // real check, and it only reports on a timer that is still armed.
        expect(watch.cause).toBe('caller-aborted');
      } finally {
        watch.dispose();
      }
    });
  });

  describe('attemptEnded', () => {
    test('clears a headers timeout so the next attempt starts clean', async () => {
      const watch = new DeadlineWatch(10_000, 20);
      try {
        await expect(watch.race(after(200).then(() => 'late'))).resolves.toEqual({
          stopped: true,
          cause: 'headers'
        });
        const stoppedSignal = watch.signal;

        watch.attemptEnded();
        expect(watch.cause).toBeUndefined();
        // A fresh signal, because an aborted one cannot be un-aborted — and the transport on
        // the next attempt must not be handed a signal that has already fired.
        expect(watch.signal).not.toBe(stoppedSignal);
        expect(watch.signal.aborted).toBe(false);

        watch.attemptStarted();
        await expect(watch.race(Promise.resolve('value'))).resolves.toEqual({
          stopped: false,
          value: 'value'
        });
      } finally {
        watch.dispose();
      }
    });

    test('does not clear a caller abort', async () => {
      // The caller's decision is about the call, not about one attempt: clearing it would let a
      // retry loop ignore a cancellation it has already been told about.
      const controller = new AbortController();
      const watch = new DeadlineWatch(10_000, 10_000, controller.signal);
      try {
        controller.abort();
        watch.attemptEnded();
        expect(watch.cause).toBe('caller-aborted');
        await expect(watch.race(Promise.resolve('value'))).resolves.toEqual({
          stopped: true,
          cause: 'caller-aborted'
        });
      } finally {
        watch.dispose();
      }
    });

    test('does not clear an overall-deadline expiry', async () => {
      const watch = new DeadlineWatch(20, 10_000);
      try {
        await expect(watch.race(after(200).then(() => 'late'))).resolves.toEqual({
          stopped: true,
          cause: 'overall'
        });
        watch.attemptEnded();
        expect(watch.cause).toBe('overall');
      } finally {
        watch.dispose();
      }
    });

    test('is a no-op on a watch that has not been stopped', async () => {
      const watch = new DeadlineWatch(10_000, 10_000);
      try {
        const signal = watch.signal;
        watch.attemptEnded();
        expect(watch.cause).toBeUndefined();
        expect(watch.signal).toBe(signal);
      } finally {
        watch.dispose();
      }
    });
  });
});
