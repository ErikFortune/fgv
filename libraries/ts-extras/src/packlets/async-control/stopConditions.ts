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

import {
  AsyncDetailedResult,
  captureResult,
  type DetailedResult,
  failWithDetail,
  type Result
} from '@fgv/ts-utils';

/**
 * Why a `raceStopConditions` race ended without the work's own success:
 * - `'aborted'` — the caller's signal aborted, before or while the work ran.
 * - `'deadline'` — the deadline expired while the work ran.
 * - `'failed'` — the work failed, threw or rejected, or the conditions themselves were invalid.
 * @public
 */
export type StopDetail = 'aborted' | 'deadline' | 'failed';

/**
 * The two `StopDetail` values that mean a stop condition fired, rather than the work failing.
 * @public
 */
export type StopReason = Exclude<StopDetail, 'failed'>;

/**
 * Cancels a timer started by a `ScheduleTimer`. Must be safe to call more than
 * once, and after the timer has fired.
 * @public
 */
export type CancelTimer = () => void;

/**
 * Starts a one-shot timer that calls `fn` after `ms` milliseconds and returns its cancel function:
 * the seam a deadline is armed through, so a test can fire it deterministically.
 * @public
 */
export type ScheduleTimer = (fn: () => void, ms: number) => CancelTimer;

/**
 * The conditions under which `raceStopConditions` stops waiting for its work.
 * @public
 */
export interface IStopConditions {
  /**
   * Stop when this many milliseconds have passed. Absent means no deadline. Must be a finite
   * integer in `0 ≤ ms ≤ 2^31-1`, the range a platform timer honours; anything else is refused
   * up front and never scheduled.
   */
  readonly deadlineMs?: number;
  /** Stop when this signal aborts. Absent means no caller cancellation. */
  readonly signal?: AbortSignal;
  /** Timer the deadline is armed through. Defaults to `setTimeout` / `clearTimeout`. */
  readonly schedule?: ScheduleTimer;
}

/**
 * The largest delay a platform timer honours. `setTimeout` treats anything larger, and
 * `Infinity`, as about 1 ms, which is why an out-of-range deadline is refused rather than passed on.
 * @public
 */
export const MAX_DEADLINE_MS: number = 2147483647;

/**
 * The platform timer: `setTimeout`, cancelled by `clearTimeout`.
 * @internal
 */
export const defaultSchedule: ScheduleTimer = (fn, ms) => {
  const handle = setTimeout(fn, ms);
  return () => clearTimeout(handle);
};

/**
 * Whether `ms` is a delay a platform timer honours: a finite integer in `0 ≤ ms ≤ MAX_DEADLINE_MS`.
 * The one rule every timed wait in this packlet applies before it schedules anything.
 * @internal
 */
export function isTimerDelay(ms: number): boolean {
  return Number.isInteger(ms) && ms >= 0 && ms <= MAX_DEADLINE_MS;
}

/**
 * Runs `work` under an optional deadline and an optional caller signal, and settles with whichever
 * comes first: the work's own result, or a stop.
 *
 * @remarks
 * **A stop does two things, because either alone is not enough.** It aborts the signal handed to
 * `work`, which is what stops work that listens (a `fetch`, a provider stream). And it settles the
 * race at once, with a failure whose detail is `'aborted'` or `'deadline'`, which is what releases
 * the caller when the work does *not* listen. The work keeps running after a stop — side effects
 * already in flight still happen — and only the value it later settles to is discarded.
 *
 * **Which settlement wins** is decided by which is observed first. A stop that fires after the
 * work's settlement has been observed is ignored, even through a timer whose cancel could not take
 * effect; a stop that fires before then wins, and the work's value is discarded. "Observed" lags
 * the work's own settlement by a few microtasks, so work whose promise has already resolved can
 * still lose to a stop that fires inside that window.
 *
 * **The work's own result passes through unchanged**: a success is a success, and a failure keeps
 * its message, with detail `'failed'`. A synchronous throw from `work` or a rejected promise is
 * captured as a `'failed'` failure, never escaped, and so is work that resolves to something that
 * is not a `Result`.
 *
 * **Nothing is left behind.** The timer is cancelled and the signal listener removed on every path,
 * so a fast work leaves nothing pending. A signal already aborted on entry stops at once without
 * calling `work`. An invalid `deadlineMs` is a `'failed'` failure and nothing is scheduled.
 *
 * @param work - The work to run. Receives a signal that aborts when either condition fires.
 * @param conditions - The deadline, the caller signal, and the timer seam.
 * @returns The work's result, or a stop.
 * @public
 */
export function raceStopConditions<T>(
  work: (signal: AbortSignal) => Promise<Result<T>>,
  conditions: IStopConditions
): AsyncDetailedResult<T, StopDetail> {
  const { deadlineMs, signal, schedule = defaultSchedule } = conditions;
  if (deadlineMs !== undefined && !isTimerDelay(deadlineMs)) {
    return AsyncDetailedResult.fromDetailed(
      failWithDetail<T, StopDetail>(
        `raceStopConditions: deadlineMs must be an integer in [0, ${MAX_DEADLINE_MS}] (got ${deadlineMs})`,
        'failed'
      )
    );
  }
  if (signal?.aborted === true) {
    return AsyncDetailedResult.fromDetailed(_stopped<T>('aborted'));
  }
  return new AsyncDetailedResult(_race(work, signal, deadlineMs, schedule));
}

function _stopped<T>(detail: StopReason): DetailedResult<T, StopDetail> {
  return failWithDetail<T, StopDetail>(
    detail === 'aborted' ? 'stopped: the caller aborted' : 'stopped: the deadline expired',
    detail
  );
}

function _race<T>(
  work: (signal: AbortSignal) => Promise<Result<T>>,
  callerSignal: AbortSignal | undefined,
  deadlineMs: number | undefined,
  schedule: ScheduleTimer
): Promise<DetailedResult<T, StopDetail>> {
  const controller = new AbortController();
  const releases: CancelTimer[] = [];
  const release = (): void => {
    releases.splice(0).forEach((r) => r());
  };
  let settled = false;
  let resolveStop!: (r: DetailedResult<T, StopDetail>) => void;
  const stopped = new Promise<DetailedResult<T, StopDetail>>((resolve) => {
    resolveStop = resolve;
  });
  const stop = (detail: StopReason): void => {
    if (settled || controller.signal.aborted) {
      return;
    }
    controller.abort();
    resolveStop(_stopped<T>(detail));
  };

  if (callerSignal !== undefined) {
    const onAbort = (): void => stop('aborted');
    callerSignal.addEventListener('abort', onAbort, { once: true });
    releases.push(() => callerSignal.removeEventListener('abort', onAbort));
  }
  if (deadlineMs !== undefined) {
    const armed = captureResult(() => schedule(() => stop('deadline'), deadlineMs));
    if (armed.isFailure()) {
      release();
      return Promise.resolve(
        failWithDetail<T, StopDetail>(`raceStopConditions: schedule failed: ${armed.message}`, 'failed')
      );
    }
    releases.push(armed.value);
  }
  // A timer that fires synchronously from `schedule` has already stopped the race, so the work
  // never starts.
  if (controller.signal.aborted) {
    release();
    return stopped;
  }

  const working = captureResult(() => work(controller.signal))
    .thenOnSuccess((pending) => pending)
    .then((result) => {
      settled = true;
      // A `work` that resolves to something other than a `Result` (an untyped caller) has no
      // `withFailureDetail`; report it as a failure rather than letting the TypeError escape as a
      // detail-less rejection.
      const detailed = captureResult(() => result.withFailureDetail<StopDetail>('failed'));
      return detailed.isSuccess()
        ? detailed.value
        : failWithDetail<T, StopDetail>(
            `raceStopConditions: work did not resolve to a Result: ${detailed.message}`,
            'failed'
          );
    });
  return Promise.race([working, stopped]).finally(release);
}
