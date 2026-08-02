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

import type { FetchFailureReason, FetchTimeoutPhase } from './failureReason';

/**
 * Why a {@link DeadlineWatch} stopped waiting.
 * @internal
 */
export type DeadlineStopCause = 'caller-aborted' | FetchTimeoutPhase;

/**
 * The outcome of racing a promise against the deadlines.
 * @internal
 */
export type DeadlineRace<T> =
  | { readonly stopped: false; readonly value: T }
  | { readonly stopped: true; readonly cause: DeadlineStopCause };

/**
 * Composes the caller's cancellation signal with an overall deadline and a headers deadline
 * into one `AbortSignal`, and remembers which of the three stopped the call.
 *
 * @remarks
 * The composition is done with a plain `AbortController` and listeners rather than
 * `AbortSignal.any`, so there is no runtime-version floor to state and no feature-detection
 * branch that only one of the two runtimes would ever execute.
 *
 * The overall deadline covers the connect, the headers, and the body read, and it is what
 * stops a response that dribbles one byte every 25 seconds — such a response passes every
 * per-read check and never trips a connect timeout.
 * @internal
 */
export class DeadlineWatch {
  private readonly _controller: AbortController;
  private readonly _startedAt: number;
  private readonly _timeoutMs: number;
  private readonly _headersTimeoutMs: number;
  private readonly _callerSignal: AbortSignal | undefined;
  private readonly _onCallerAbort: () => void;

  private _overallTimer: ReturnType<typeof setTimeout> | undefined;
  private _headersTimer: ReturnType<typeof setTimeout> | undefined;
  private _cause: DeadlineStopCause | undefined;
  private _inBodyPhase: boolean;
  private readonly _waiters: Set<(cause: DeadlineStopCause) => void>;

  public constructor(timeoutMs: number, headersTimeoutMs: number, callerSignal?: AbortSignal) {
    this._controller = new AbortController();
    this._startedAt = Date.now();
    this._timeoutMs = timeoutMs;
    this._headersTimeoutMs = headersTimeoutMs;
    this._callerSignal = callerSignal;
    this._inBodyPhase = false;
    this._waiters = new Set();

    this._onCallerAbort = (): void => this._stop('caller-aborted');
    this._overallTimer = setTimeout(() => this._stop(this._inBodyPhase ? 'body' : 'overall'), timeoutMs);
    this._headersTimer = setTimeout(() => this._stop('headers'), headersTimeoutMs);

    if (callerSignal !== undefined) {
      if (callerSignal.aborted) {
        this._stop('caller-aborted');
      } else {
        callerSignal.addEventListener('abort', this._onCallerAbort);
      }
    }
  }

  /** The composed signal to hand to the transport. */
  public get signal(): AbortSignal {
    return this._controller.signal;
  }

  /** Why the call was stopped, or `undefined` while it is still running. */
  public get cause(): DeadlineStopCause | undefined {
    return this._cause;
  }

  /**
   * Records that response headers have arrived: the headers deadline no longer applies, and a
   * subsequent overall-deadline expiry is a body-phase timeout rather than an overall one.
   */
  public headersReceived(): void {
    if (this._headersTimer !== undefined) {
      clearTimeout(this._headersTimer);
      this._headersTimer = undefined;
    }
    this._inBodyPhase = true;
  }

  /**
   * Races a promise against the deadlines. A stopped race reports the cause; the underlying
   * promise is abandoned, not cancelled — the caller is responsible for releasing whatever
   * resource it represents (a response body reader, in practice).
   *
   * @remarks
   * The waiter is removed once the race settles. A body read calls this once per chunk, so a
   * waiter set that only grew would be a leak proportional to the number of chunks — in the
   * exact code path whose job is to bound what a hostile response can cost the process.
   */
  public async race<T>(promise: Promise<T>): Promise<DeadlineRace<T>> {
    if (this._cause !== undefined) {
      return { stopped: true, cause: this._cause };
    }
    // Definitely assigned: a Promise executor runs synchronously.
    let waiter!: (cause: DeadlineStopCause) => void;
    const stop: Promise<DeadlineRace<T>> = new Promise((resolve) => {
      waiter = (cause: DeadlineStopCause): void => resolve({ stopped: true, cause });
    });
    this._waiters.add(waiter);
    try {
      return await Promise.race([
        promise.then((value): DeadlineRace<T> => ({ stopped: false, value })),
        stop
      ]);
    } finally {
      this._waiters.delete(waiter);
    }
  }

  /** Builds the failure reason corresponding to why the call was stopped. */
  public toFailureReason(cause: DeadlineStopCause): FetchFailureReason {
    if (cause === 'caller-aborted') {
      return { kind: 'aborted' };
    }
    return {
      kind: 'timeout',
      phase: cause,
      elapsedMs: Date.now() - this._startedAt,
      limitMs: cause === 'headers' ? this._headersTimeoutMs : this._timeoutMs
    };
  }

  /** Clears timers and listeners. Safe to call more than once. */
  public dispose(): void {
    if (this._overallTimer !== undefined) {
      clearTimeout(this._overallTimer);
      this._overallTimer = undefined;
    }
    if (this._headersTimer !== undefined) {
      clearTimeout(this._headersTimer);
      this._headersTimer = undefined;
    }
    if (this._callerSignal !== undefined) {
      this._callerSignal.removeEventListener('abort', this._onCallerAbort);
    }
    this._waiters.clear();
  }

  private _stop(cause: DeadlineStopCause): void {
    // First cause wins. The overall and headers deadlines can be scheduled for the same instant,
    // and a caller can abort while one of them is already firing; reporting the second would
    // rewrite a phase the caller has arguably already been told about.
    if (this._cause !== undefined) {
      return;
    }
    this._cause = cause;
    const waiters = Array.from(this._waiters);
    this._waiters.clear();
    this._controller.abort();
    for (const waiter of waiters) {
      waiter(cause);
    }
  }
}
