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
  AsyncDeferredResult,
  AsyncDetailedResult,
  AsyncResult,
  captureResult,
  type DetailedResult,
  fail,
  failWithDetail,
  type Result,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';

import { type CancelTimer, defaultSchedule, isTimerDelay, MAX_DEADLINE_MS, type ScheduleTimer } from './stopConditions';

/**
 * Why a guarded write's outcome came from the gate rather than from the write:
 * - `'raised'` — the gate was raised, when the write asked or while it waited on a pause. The write
 *   was **not** run.
 * - `'threw'` — the write **was** run, and threw or rejected instead of answering a `Result`. Its
 *   side effects may have happened.
 * @public
 */
export type WriteGateRefusal = 'raised' | 'threw';

/**
 * Why a `WriteGate.pause` failed, leaving nothing paused:
 * - `'timeout'` — writes under way did not finish in time, and none was waiting on the pause.
 * - `'stalled'` — writes under way did not finish in time **while writes were waiting on the
 *   pause**. That is the shape of a guarded write that is itself waiting on a guarded write — the
 *   reentrant deadlock the call-site rule on `WriteGate` forbids — though a
 *   merely slow write with unrelated callers queued behind it looks the same.
 * - `'invalid'` — `timeoutMs` was out of range, or the timer could not be armed. Nothing was paused.
 * @public
 */
export type WriteGatePauseFailure = 'timeout' | 'stalled' | 'invalid';

/**
 * A pause held on a `WriteGate`. Writes stay held until every held pause is resumed.
 * @public
 */
export interface IWriteGatePause {
  /** Ends this pause. Idempotent: a second call does nothing, and never ends another pause. */
  resume(): void;
}

/**
 * Options for `WriteGate.create`.
 * @public
 */
export interface IWriteGateOptions {
  /** Timer a pause's timeout is armed through. Defaults to `setTimeout` / `clearTimeout`. */
  readonly schedule?: ScheduleTimer;
}

/**
 * A cooperative gate for writes: one switch that every write routed through it consults, so a
 * host can stop them all, or hold them still for a moment, without a close per store.
 *
 * @remarks
 * **Three states.**
 * - **Open** — a guarded write runs at once.
 * - **Paused** — while at least one pause is held, a new write waits and runs once the last pause
 *   is resumed. `pause` resolves when the writes already under way have finished, so the caller
 *   then holds a moment in which nothing guarded is writing.
 * - **Raised** — a new write is refused without running, and so is every write waiting on a pause:
 *   they are woken and refused at once. Writes already under way are not interrupted; the gate is
 *   cooperative and only decides whether a write *starts*. `lower` reopens it.
 *
 * Raised wins over paused. Lowering does not resume a pause, and resuming does not lower.
 *
 * **When a write is admitted.** The decision — refuse, wait, or run — is made synchronously inside
 * `guard`, and a write that runs is counted in `inFlight` before `write` is called. So a `pause` or
 * `raise` made after `guard` returns always sees that write; one made before it is always seen by
 * it. A write woken from a pause decides again, so a pause taken between the wake and the write's
 * turn holds it once more.
 *
 * **What a guarded write answers.** The write's own result, passed through as the same object.
 * A write that throws synchronously or rejects is answered as a failure (`'threw'`), never as a
 * rejection. The `inFlight` slot is released on every path — success, failure, throw, rejection —
 * before the guard's own result settles.
 *
 * **Call-site rule: a guarded write must not call `guard` on the same gate.** While the gate is
 * open that merely nests, but against a pause it deadlocks: the pause waits for the outer write,
 * which waits for the inner one, which waits for the pause. The gate cannot tell a nested call
 * from a concurrent caller's without an async context, and the only one available is Node-only
 * (`AsyncLocalStorage`) while this packlet also runs in the browser — so the nesting itself is not
 * refused. The deadlock it causes is bounded and classified instead: the pause times out, is
 * withdrawn, releasing the waiting writes, and fails `'stalled'`.
 *
 * Nothing here is Node-only; time is used only through the injectable `schedule`.
 * @public
 */
export class WriteGate {
  private readonly _schedule: ScheduleTimer;
  private _reason: string | undefined = undefined;
  private _pauses: number = 0;
  private _inFlight: number = 0;
  /** Writes waiting on a pause; woken when the last pause ends, or when the gate is raised. */
  private _waiters: Array<() => void> = [];
  /** Pauses waiting for the writes under way to finish; told when `inFlight` reaches 0. */
  private _drains: Array<() => void> = [];

  private constructor(schedule: ScheduleTimer) {
    this._schedule = schedule;
  }

  /**
   * Creates an open gate.
   * @param options - The timer seam. A `schedule` that is not a function is refused.
   * @returns The gate.
   */
  public static create(options?: IWriteGateOptions): Result<WriteGate> {
    const schedule: ScheduleTimer = options?.schedule ?? defaultSchedule;
    if (typeof schedule !== 'function') {
      return fail(`WriteGate.create: schedule must be a function`);
    }
    return succeed(new WriteGate(schedule));
  }

  /** How many guarded writes are under way. */
  public get inFlight(): number {
    return this._inFlight;
  }

  /** How many guarded writes are waiting for a pause to end. */
  public get waiting(): number {
    return this._waiters.length;
  }

  /** Whether no guarded write is under way. Writes waiting on a pause are not under way. */
  public get quiet(): boolean {
    return this._inFlight === 0;
  }

  /**
   * Succeeds while the gate is lowered; fails with the reason while it is raised.
   *
   * @remarks
   * A moment, not a reservation: a write guarded after a successful `check` is still refused if the
   * gate is raised in between. Use `guard` to make the decision and the write one step.
   */
  public check(): Result<true> {
    return this._reason === undefined ? succeed(true) : fail(this._raisedMessage());
  }

  /**
   * Raises the gate: every write guarded from now on is refused without running, and every write
   * waiting on a pause is woken and refused. Writes under way are not interrupted. Raising again
   * replaces the reason.
   * @param reason - Why, carried in every refusal.
   */
  public raise(reason: string): void {
    this._reason = reason;
    this._wake();
  }

  /** Lowers the gate. A pause that is held stays held. */
  public lower(): void {
    this._reason = undefined;
  }

  /**
   * Runs `write` through the gate: refused while it is raised, held while it is paused, and
   * counted in `inFlight` while it runs.
   * @param write - The write. Called at most once, and only if the gate admits it.
   * @returns The write's own result; a refusal or a throw is a failure.
   */
  public guard<T>(write: AsyncDeferredResult<T>): AsyncResult<T> {
    return new AsyncResult<T>(this._run<Result<T>>(write, (message) => fail<T>(message)));
  }

  /**
   * `guard` for a write that answers a detailed result. A refusal or a throw carries a
   * `WriteGateRefusal` as its detail; the write's own result passes through.
   * @param write - The write. Called at most once, and only if the gate admits it.
   * @returns The write's own result, or a failure detailed with why the gate answered instead.
   */
  public guardDetailed<T, TD>(
    write: () => Promise<DetailedResult<T, TD>>
  ): AsyncDetailedResult<T, TD | WriteGateRefusal> {
    return new AsyncDetailedResult<T, TD | WriteGateRefusal>(
      this._run<DetailedResult<T, TD | WriteGateRefusal>>(write, (message, refusal) =>
        failWithDetail<T, TD | WriteGateRefusal>(message, refusal)
      )
    );
  }

  /**
   * Holds every write that has not started, and waits — for at most `timeoutMs` — for the writes
   * under way to finish.
   *
   * @remarks
   * Writes are held from the moment `pause` is called, not from when it resolves. Pauses nest:
   * writes go ahead once every held pause is resumed. A pause that does not reach quiet in time is
   * withdrawn — holding nothing — and fails `'timeout'`, or `'stalled'` when writes were waiting on
   * it. Once a pause has succeeded nothing times it out; it holds until it is resumed.
   * @param timeoutMs - The longest wait, an integer in `0 ≤ ms ≤ 2^31-1`; anything else is refused
   * (`'invalid'`) and nothing is paused.
   * @returns The held pause, to resume.
   */
  public pause(timeoutMs: number): AsyncDetailedResult<IWriteGatePause, WriteGatePauseFailure> {
    if (!isTimerDelay(timeoutMs)) {
      return AsyncDetailedResult.fromDetailed(
        failWithDetail<IWriteGatePause, WriteGatePauseFailure>(
          `WriteGate.pause: timeoutMs must be an integer in [0, ${MAX_DEADLINE_MS}] (got ${timeoutMs})`,
          'invalid'
        )
      );
    }
    this._pauses += 1;
    const held: IWriteGatePause = this._holdHandle();
    if (this._inFlight === 0) {
      return AsyncDetailedResult.fromDetailed(succeedWithDetail<IWriteGatePause, WriteGatePauseFailure>(held));
    }
    return new AsyncDetailedResult(this._drain(held, timeoutMs));
  }

  private _raisedMessage(): string {
    return `write gate is raised: ${this._reason}`;
  }

  /**
   * Admits, holds or refuses `write`. Every branch is decided synchronously, and a write that is
   * admitted is counted before it is called.
   */
  private _run<R>(write: () => Promise<R>, refuse: (message: string, refusal: WriteGateRefusal) => R): Promise<R> {
    if (this._reason !== undefined) {
      return Promise.resolve(refuse(`${this._raisedMessage()}; the write was not run`, 'raised'));
    }
    if (this._pauses > 0) {
      return new Promise<void>((resolve) => this._waiters.push(resolve)).then(() => this._run(write, refuse));
    }
    this._inFlight += 1;
    // The executor runs synchronously, so `write` starts now; a synchronous throw becomes a
    // rejection, which is answered rather than escaped.
    return new Promise<R>((resolve) => resolve(write()))
      .catch((err: unknown) => refuse(`write gate: the write threw: ${_message(err)}`, 'threw'))
      .finally(() => this._release());
  }

  private _release(): void {
    this._inFlight -= 1;
    if (this._inFlight === 0) {
      this._drains.splice(0).forEach((drained) => drained());
    }
  }

  private _wake(): void {
    this._waiters.splice(0).forEach((wake) => wake());
  }

  /** A handle that ends this one pause, once. */
  private _holdHandle(): IWriteGatePause {
    let held: boolean = true;
    return {
      resume: (): void => {
        if (held) {
          held = false;
          this._pauses -= 1;
          if (this._pauses === 0) {
            this._wake();
          }
        }
      }
    };
  }

  /** Waits for the writes under way to finish, or withdraws `held` when `timeoutMs` passes first. */
  private _drain(
    held: IWriteGatePause,
    timeoutMs: number
  ): Promise<DetailedResult<IWriteGatePause, WriteGatePauseFailure>> {
    return new Promise((resolve) => {
      let settled: boolean = false;
      let cancel: CancelTimer | undefined = undefined;
      const onQuiet = (): void => {
        if (!settled) {
          settled = true;
          if (cancel !== undefined) {
            // The host's cancel is host code: a throw from it never escapes into a write's release.
            captureResult(cancel);
          }
          resolve(succeedWithDetail(held));
        }
      };
      const withdraw = (): void => {
        this._drains = this._drains.filter((drained) => drained !== onQuiet);
        held.resume();
      };
      const onTimeout = (): void => {
        if (!settled) {
          settled = true;
          // Classified before the withdrawal wakes anyone.
          const waiting = this._waiters.length;
          const inFlight = this._inFlight;
          withdraw();
          resolve(
            failWithDetail(
              `WriteGate.pause: ${inFlight} write(s) still under way after ${timeoutMs} ms` +
                (waiting > 0
                  ? ` while ${waiting} waited on the pause; a guarded write that calls guard deadlocks against a pause`
                  : ''),
              waiting > 0 ? 'stalled' : 'timeout'
            )
          );
        }
      };
      this._drains.push(onQuiet);
      const armed = captureResult(() => this._schedule(onTimeout, timeoutMs));
      if (armed.isFailure()) {
        // A schedule that fired the timeout and then threw has already settled and withdrawn the
        // pause; withdrawing again is a no-op and this second resolve is ignored.
        settled = true;
        withdraw();
        resolve(failWithDetail(`WriteGate.pause: schedule failed: ${armed.message}`, 'invalid'));
        return;
      }
      cancel = armed.value;
    });
  }
}

function _message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
