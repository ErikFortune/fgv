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

/**
 * `runClientToolLoop`: a bounded multi-round driver over `executeClientToolTurn`.
 * @packageDocumentation
 */

import {
  AsyncDetailedResult,
  captureResult,
  type DetailedResult,
  fail,
  failWithDetail,
  type Result,
  succeed,
  succeedWithDetail
} from '@fgv/ts-utils';
import { type JsonObject } from '@fgv/ts-json-base';

import { raceStopConditions, type ScheduleTimer, type StopDetail, type StopReason } from '../async-control';
import { type IAiStreamEvent } from './model';
import {
  executeClientToolTurn,
  type IExecuteClientToolTurnParams
} from './streamingAdapters/clientToolContinuationBuilder';
import {
  type IAiClientToolCallSummary,
  type IAiClientToolTurnResult,
  type IAiToolConflictReport
} from './toolTypes';
import { type IAiCompletionUsage } from './usageTypes';

/**
 * How a `runClientToolLoop` loop ended, when it did not fail:
 * - `'completed'` — a round returned no continuation: the model finished.
 * - `'round-limit'` — `maxRounds` rounds ran and the model was still asking for tools.
 * - `'aborted'` — the caller's signal aborted.
 * - `'deadline'` — the loop's `deadlineMs` expired.
 * @public
 */
export type ClientToolLoopState = 'completed' | 'round-limit' | 'aborted' | 'deadline';

/**
 * One completed round of a `runClientToolLoop` loop.
 * @public
 */
export interface IClientToolRound {
  /** 1-based round number. */
  readonly round: number;
  /** The round's full model text (may be empty). */
  readonly fullText: string;
  /**
   * The provider's own truncation report for this round. Reported, never acted on: what to do
   * with a truncated round is the caller's decision.
   */
  readonly truncated: boolean;
  /** The tool calls made this round, each with its `durationMs` (empty on a completing round). */
  readonly calls: ReadonlyArray<IAiClientToolCallSummary>;
  /**
   * The round's elapsed time on the loop's clock minus the sum of its calls' `durationMs`, floored
   * at zero. Everything that is not tool time counts — the provider, and also the time spent in
   * synchronous `observer.event` hooks during the drain.
   */
  readonly providerDurationMs: number;
  /** The round's token usage, when the provider reported it. Never a fabricated zero. */
  readonly usage?: IAiCompletionUsage;
  /** What tool-conflict resolution did to this round's tools. */
  readonly toolConflicts: IAiToolConflictReport;
}

/**
 * A tool call the round in flight at a stop had handed off for dispatch: the runner saw its
 * `client-tool-call-done` event. That round is discarded, so the host never receives this call in
 * a recorded round, whether or not it ran.
 *
 * @remarks
 * `settled: true` means the call's `client-tool-result` was seen: the tool ran to a result (or was
 * declined with one), and its side effects, if any, have happened. `settled: false` means no result
 * was seen: the tool may still be running, may have finished after the stop, or may never have
 * started.
 * @public
 */
export interface IClientToolOrphanedCall {
  /** The name of the tool the model called. */
  readonly toolName: string;
  /** Provider-assigned call identifier (absent for Gemini). */
  readonly callId?: string;
  /** The call's arguments as the model sent them. */
  readonly args: JsonObject;
  /** Whether the call's `client-tool-result` was seen before the stop. */
  readonly settled: boolean;
  /** The seen result's `isError`; present only when `settled`. */
  readonly isError?: boolean;
}

/**
 * The outcome of a `runClientToolLoop` loop that did not fail.
 * @public
 */
export interface IClientToolLoopOutcome {
  /** How the loop ended. */
  readonly state: ClientToolLoopState;
  /** Every round that completed, in order. */
  readonly rounds: ReadonlyArray<IClientToolRound>;
  /**
   * The most recent **cumulative** continuation tail, absent when no completed round produced one.
   *
   * @remarks
   * After `'round-limit'` it is the tail the next round would have sent: pass it as
   * `continuationMessages` to resume, or to run a final round with no tools, without re-deriving
   * the continuation yourself. After `'completed'` it is the tail the final round was sent (the
   * final round's own text is its `fullText`). After a stop it is the tail of the last round that
   * completed before the stop.
   *
   * **Resuming after a stop may re-request tools that already ran.** The tail does not include the
   * round that was in flight at the stop, so the model sees none of that round's calls and may make
   * any of them again. Those calls are listed in `orphanedRoundCalls`; making a repeated call safe
   * (idempotency, or reconciling against `orphanedRoundCalls`) is the host's responsibility.
   */
  readonly continuationMessages?: ReadonlyArray<JsonObject>;
  /**
   * Present after `'aborted'` and `'deadline'` only: every call the round in flight at the stop had
   * handed off for dispatch, in order, settled or not. These are calls whose results the host never
   * received in a recorded round. Empty when that round had made no call (or the stop came before
   * any round started). See `IClientToolOrphanedCall`.
   */
  readonly orphanedRoundCalls?: ReadonlyArray<IClientToolOrphanedCall>;
}

/**
 * The detail a failed `runClientToolLoop` call carries.
 * @public
 */
export interface IClientToolLoopFailureDetail {
  /** Every round that completed before the failure, in order (empty when none did). */
  readonly rounds: ReadonlyArray<IClientToolRound>;
}

/**
 * Read-only hooks into a running loop. Both are synchronous. A hook that **throws** is isolated:
 * the throw is logged at `warn` through the turn's `logger` and does not change the outcome.
 * Neither is called after the loop has been stopped. A hook that aborts the caller's own `signal`
 * is not isolated from — that is a caller-driven stop, and the loop ends `'aborted'`.
 * @public
 */
export interface IClientToolLoopObserver {
  /** Called once per completed round, before the next round starts. */
  round?(round: IClientToolRound): void;
  /** Called with every stream event of every round, as it arrives — for a streaming UI. */
  event?(round: number, event: IAiStreamEvent): void;
}

/**
 * Parameters for `runClientToolLoop`: one client-tool turn's parameters, which ride
 * every round unchanged, plus the loop's own bounds.
 *
 * @remarks
 * `continuationMessages` is the loop's to manage, so it is not a parameter. `signal` is the
 * caller's; each round is handed a signal of the loop's own that aborts when the caller's does or
 * when the deadline expires. `clock` times rounds here and calls inside each turn. `model` is
 * passed through as given: the loop does no model resolution.
 * @public
 */
export interface IClientToolLoopParams extends Omit<IExecuteClientToolTurnParams, 'continuationMessages'> {
  /** At most this many provider rounds. Required; a positive integer. */
  readonly maxRounds: number;
  /** Bound on the whole loop, in milliseconds. Absent means none. Same range rules as `raceStopConditions`. */
  readonly deadlineMs?: number;
  /** Timer the deadline is armed through. Defaults to `setTimeout` / `clearTimeout`. */
  readonly schedule?: ScheduleTimer;
  /** Read-only hooks into the running loop. */
  readonly observer?: IClientToolLoopObserver;
}

const defaultClock = (): number => performance.now();

/**
 * The loop's state across rounds.
 * @internal
 */
class ClientToolLoop {
  private readonly _turnParams: Omit<IExecuteClientToolTurnParams, 'continuationMessages' | 'signal'>;
  private readonly _maxRounds: number;
  private readonly _observer: IClientToolLoopObserver | undefined;
  private readonly _clock: () => number;
  private readonly _rounds: IClientToolRound[] = [];
  private _tail: ReadonlyArray<JsonObject> | undefined;
  /** Every call the current round has handed off, with whether its result has been seen. */
  private _orphanCandidates: ReadonlyArray<IClientToolOrphanedCall> = [];

  public constructor(
    turnParams: Omit<IExecuteClientToolTurnParams, 'continuationMessages' | 'signal'>,
    maxRounds: number,
    observer: IClientToolLoopObserver | undefined
  ) {
    this._turnParams = turnParams;
    this._maxRounds = maxRounds;
    this._observer = observer;
    this._clock = turnParams.clock ?? defaultClock;
  }

  /**
   * The loop body, run under the loop-level race. Its value is discarded when a stop settled the
   * race first, so every write to loop state is guarded by `loopSignal.aborted`, which a stop sets
   * synchronously before the race settles.
   */
  public async run(loopSignal: AbortSignal): Promise<Result<IClientToolLoopOutcome>> {
    for (let round = 1; round <= this._maxRounds; round++) {
      const result = await raceStopConditions((roundSignal) => this._runRound(round, roundSignal), {
        signal: loopSignal
      });
      if (loopSignal.aborted) {
        // Stopped while this round was in flight. The loop-level race has already settled with
        // the stop; this round is discarded and no further round starts.
        return fail('runClientToolLoop: stopped');
      }
      if (result.isFailure()) {
        return fail(result.message);
      }
      const { record, turn } = result.value;
      this._rounds.push(record);
      this._orphanCandidates = [];
      this._tail = turn.continuation?.messages ?? this._tail;
      this._notify('round', () => this._observer?.round?.(record));
      if (turn.continuation === undefined) {
        return succeed(this._outcome('completed'));
      }
    }
    return succeed(this._outcome('round-limit'));
  }

  /** Maps the loop-level race's result to the loop's outcome. */
  public settle(
    result: DetailedResult<IClientToolLoopOutcome, StopDetail>
  ): DetailedResult<IClientToolLoopOutcome, IClientToolLoopFailureDetail> {
    if (result.isSuccess()) {
      return succeedWithDetail(result.value);
    }
    if (result.detail === 'aborted' || result.detail === 'deadline') {
      return succeedWithDetail(this._stoppedOutcome(result.detail));
    }
    return failWithDetail(result.message, { rounds: [...this._rounds] });
  }

  private _stoppedOutcome(state: StopReason): IClientToolLoopOutcome {
    return { ...this._outcome(state), orphanedRoundCalls: [...this._orphanCandidates] };
  }

  private _outcome(state: ClientToolLoopState): IClientToolLoopOutcome {
    return {
      state,
      rounds: [...this._rounds],
      ...(this._tail !== undefined ? { continuationMessages: this._tail } : {})
    };
  }

  /**
   * Runs one round: starts the turn, drains its events (which is what dispatches tools and
   * resolves `nextTurn`), then reads the turn. Stops draining as soon as the round's signal has
   * aborted, and never awaits `nextTurn` after that.
   */
  private async _runRound(
    round: number,
    roundSignal: AbortSignal
  ): Promise<Result<{ record: IClientToolRound; turn: IAiClientToolTurnResult }>> {
    const startedAt = this._clock();
    this._orphanCandidates = [];
    return executeClientToolTurn({
      ...this._turnParams,
      signal: roundSignal,
      ...(this._tail !== undefined ? { continuationMessages: this._tail } : {})
    })
      .thenOnSuccess(async ({ events, nextTurn }) => {
        for await (const event of events) {
          if (roundSignal.aborted) {
            break;
          }
          this._track(event);
          this._notify('event', () => this._observer?.event?.(round, event));
        }
        return roundSignal.aborted ? fail<IAiClientToolTurnResult>('runClientToolLoop: stopped') : nextTurn;
      })
      .onSuccess((turn) => {
        const calls = turn.continuation?.toolCallsSummary ?? [];
        const toolMs = calls.reduce((sum, c) => sum + c.durationMs, 0);
        const record: IClientToolRound = {
          round,
          fullText: turn.fullText,
          truncated: turn.truncated,
          calls,
          providerDurationMs: Math.max(0, this._clock() - startedAt - toolMs),
          ...(turn.usage !== undefined ? { usage: turn.usage } : {}),
          toolConflicts: turn.toolConflicts
        };
        return succeed({ record, turn });
      });
  }

  /** Keeps `_orphanCandidates` as every call this round has handed off, and which have settled. */
  private _track(event: IAiStreamEvent): void {
    if (event.type === 'client-tool-call-done') {
      this._orphanCandidates = [
        ...this._orphanCandidates,
        {
          toolName: event.toolName,
          ...(event.callId !== undefined ? { callId: event.callId } : {}),
          args: event.args,
          settled: false
        }
      ];
    } else if (event.type === 'client-tool-result') {
      // Dispatch is serial and inline: `executeClientToolTurn` runs each call to its result before
      // it reads the next provider event, so at most one call is ever awaiting its result, and a
      // result always belongs to the last call handed off.
      const last = this._orphanCandidates.length - 1;
      this._orphanCandidates = this._orphanCandidates.map((c, i) =>
        i === last ? { ...c, settled: true, isError: event.isError } : c
      );
    }
  }

  private _notify(hook: 'round' | 'event', call: () => void): void {
    captureResult(call).onFailure((message) => {
      this._turnParams.logger?.warn(`runClientToolLoop: observer.${hook} threw; ignored: ${message}`);
      return fail(message);
    });
  }
}

/**
 * Drives a multi-round client-tool conversation over `executeClientToolTurn`: call the provider,
 * let the model request tools (dispatched while the round's stream is drained), feed the results
 * back through the continuation, and repeat until the model stops, the round cap is reached, the
 * caller aborts, or the deadline expires.
 *
 * @remarks
 * - **The continuation is replaced, never appended.** Each turn returns a cumulative tail, so each
 *   round sends exactly the tail the previous round returned.
 * - **Stops and the cap are outcomes, not failures.** `'round-limit'`, `'aborted'` and
 *   `'deadline'` succeed with every completed round; a failed round fails the call, with the
 *   completed rounds as detail. A failed round is not retried.
 * - **A stop releases the caller at once.** The whole loop and each round run under
 *   `raceStopConditions`, so a tool that ignores its signal cannot hold the caller.
 *   On a stop the orphaned round's event stream is no longer drained past the event in hand and
 *   its next turn is never awaited, and no further round starts. **Side effects already in flight
 *   may still land**: a tool that was running keeps running unless it honours its signal, and its
 *   writes stand; only its result is discarded. Every call that round handed off — settled or
 *   not — is reported in the outcome's `orphanedRoundCalls`, and a host that resumes from
 *   `continuationMessages` may see the model request any of them again; idempotency is the host's
 *   responsibility.
 * - **Every round carries the same parameters**; duplicate tool names, schema pre-flight and model
 *   choice are `executeClientToolTurn`'s, so they surface as a failure of round 1.
 * - **Truncation is reported per round, never resolved.**
 *
 * @param params - The turn parameters plus the loop's bounds.
 * @returns The loop's outcome, or a failure carrying the rounds that completed.
 * @public
 */
export function runClientToolLoop(
  params: IClientToolLoopParams
): AsyncDetailedResult<IClientToolLoopOutcome, IClientToolLoopFailureDetail> {
  const { maxRounds, deadlineMs, schedule, observer, signal, ...turnParams } = params;
  if (!Number.isInteger(maxRounds) || maxRounds < 1) {
    return AsyncDetailedResult.fromDetailed(
      failWithDetail<IClientToolLoopOutcome, IClientToolLoopFailureDetail>(
        `runClientToolLoop: maxRounds must be a positive integer (got ${maxRounds})`,
        { rounds: [] }
      )
    );
  }
  const loop = new ClientToolLoop(turnParams, maxRounds, observer);
  return new AsyncDetailedResult(
    raceStopConditions((loopSignal) => loop.run(loopSignal), { deadlineMs, signal, schedule }).then(
      (result) => loop.settle(result)
    )
  );
}
