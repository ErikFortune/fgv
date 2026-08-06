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
  private _controller: AbortController;
  private readonly _startedAt: number;
  private readonly _timeoutMs: number;
  private readonly _headersTimeoutMs: number;
  private readonly _callerSignal: AbortSignal | undefined;
  private readonly _onCallerAbort: () => void;

  private _overallTimer: ReturnType<typeof setTimeout> | undefined;
  private _headersTimer: ReturnType<typeof setTimeout> | undefined;
  private _cause: DeadlineStopCause | undefined;
  /**
   * Whether the current stop ends the whole call rather than just this attempt. The overall
   * deadline and the caller's signal are terminal; the per-attempt headers deadline is not.
   */
  private _terminal: boolean;
  private _inBodyPhase: boolean;
  private readonly _waiters: Set<(cause: DeadlineStopCause) => void>;

  public constructor(timeoutMs: number, headersTimeoutMs: number, callerSignal?: AbortSignal) {
    this._controller = new AbortController();
    this._startedAt = Date.now();
    this._timeoutMs = timeoutMs;
    this._headersTimeoutMs = headersTimeoutMs;
    this._callerSignal = callerSignal;
    this._terminal = false;
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
   * Records that a new attempt is starting: the headers deadline is (re)armed from now.
   *
   * @remarks
   * The headers deadline is **per attempt**, and a redirect walk makes more than one. Without a
   * re-arm, {@link DeadlineWatch.headersReceived} on the first hop would retire the headers
   * deadline for the whole call, leaving every later hop bounded only by the overall deadline —
   * so a chain whose second host simply never answers would hang for the overall budget instead
   * of failing as `timeout.phase === 'headers'`.
   *
   * Called before the address guard rather than before the connect, because guard evaluation
   * (a DNS resolution, in the shipped guard) is part of the time a caller waits for a usable
   * response and is deliberately inside this budget.
   *
   * The overall deadline is untouched: it spans the whole call, redirects included.
   */
  public attemptStarted(): void {
    if (this._cause !== undefined) {
      return;
    }
    if (this._headersTimer !== undefined) {
      clearTimeout(this._headersTimer);
    }
    this._headersTimer = setTimeout(() => this._stop('headers'), this._headersTimeoutMs);
    this._inBodyPhase = false;
  }

  /**
   * Records that response headers have arrived: the headers deadline no longer applies to this
   * attempt, and a subsequent overall-deadline expiry is a body-phase timeout rather than an
   * overall one.
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

  /**
   * Records that an attempt has ended and another may follow: the headers deadline is disarmed,
   * and a stop that ended only *that attempt* is cleared.
   *
   * @remarks
   * **The headers deadline is attempt-scoped and the overall deadline is not.** A retry attempt
   * that timed out waiting for headers must not leave the whole call stopped — without this,
   * retry could never answer a `timeout.phase === 'headers'` failure, which is precisely the
   * failure retry exists for. The composed signal is replaced rather than reset, because an
   * aborted `AbortSignal` cannot be un-aborted.
   *
   * The overall deadline and the caller's signal are **terminal** by contrast: neither is about
   * one attempt, and clearing either would let a retry loop outlive the budget the caller set or
   * ignore the cancellation the caller requested. A terminal stop survives this call, so the
   * backoff that follows is answered immediately and the call ends.
   *
   * Called between attempts rather than at the start of one, so the interval spent in a backoff
   * is bounded by the overall deadline alone — arming a headers deadline over a sleep during
   * which no request is outstanding would stop the call for a response nobody is waiting for.
   */
  public attemptEnded(): void {
    if (this._headersTimer !== undefined) {
      clearTimeout(this._headersTimer);
      this._headersTimer = undefined;
    }
    // No attempt is in flight between attempts, so the call is not in its body phase — whatever
    // the previous attempt reached. Without this, an attempt that failed *after* headers arrived
    // (a body-read network error, a non-2xx) would leave the flag set through the backoff, and
    // an overall-deadline expiry during that sleep would be reported as `timeout.phase: 'body'`
    // while no bytes were being transferred at all. `phase` is part of the taxonomy's contract,
    // and a phase that names the wrong thing is exactly the kind of small lie this primitive is
    // built not to tell.
    this._inBodyPhase = false;
    if (this._terminal || this._cause === undefined) {
      return;
    }
    this._cause = undefined;
    this._controller = new AbortController();
  }

  /**
   * How much of the overall deadline is left, in milliseconds, never below zero.
   *
   * @remarks
   * Read by the retry scheduler, which must not sleep past a deadline it is already inside:
   * "the overall budget is the ceiling" is only enforceable if the remaining budget is
   * observable.
   */
  public get remainingMs(): number {
    return Math.max(0, this._timeoutMs - (Date.now() - this._startedAt));
  }

  /**
   * Waits for the given number of milliseconds, or until the call is stopped — whichever comes
   * first.
   *
   * @remarks
   * Backing the retry delay with the same watch the request races against is what keeps a
   * caller's `abort()` responsive *between* attempts. A bare `setTimeout` would leave a caller
   * who cancelled during a five-second backoff waiting out the full delay before being told the
   * call was aborted.
   *
   * The timer is cleared however the wait ends, so a stopped delay leaves nothing pending —
   * which matters in a test runner, where a stray timer keeps the process alive.
   */
  public async delay(ms: number): Promise<DeadlineRace<true>> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await this.race(
        new Promise<true>((resolve) => {
          timer = setTimeout(() => resolve(true), ms);
        })
      );
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
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
    // Every cause but the per-attempt headers deadline ends the call: the overall deadline is
    // the whole budget, and the caller's signal is the caller's decision.
    this._terminal = cause !== 'headers';
    const waiters = Array.from(this._waiters);
    this._waiters.clear();
    this._controller.abort();
    for (const waiter of waiters) {
      waiter(cause);
    }
  }
}
