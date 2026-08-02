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
});
