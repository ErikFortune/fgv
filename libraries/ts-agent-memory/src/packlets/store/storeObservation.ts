/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { IProvenance, Kind, MemoryId, MemoryScopeKey } from '../types';
import {
  IMemoryObservationRecord,
  IMemoryObserver,
  MemoryEmbedOutcome,
  MemoryObservationOutcome,
  MemoryObservationPhase
} from '../observe';

/**
 * The per-operation facts an observation reports.
 * @internal
 */
export interface IObservationDetails {
  readonly outcome: MemoryObservationOutcome;
  readonly id?: MemoryId;
  readonly provenance?: IProvenance;
  readonly error?: string;
  readonly embed?: MemoryEmbedOutcome;
}

/**
 * The store's observation fan-out: mints each record's `seq` and `timestamp`, and hands it to
 * every observer, swallowing (and warning about) any observer failure.
 *
 * @remarks
 * The observation `seq` is a distinct authority from the envelope `seq`: it numbers the audit
 * stream, so one `MemoryObservationStore` fed by this store sees strictly increasing `seq`, as the
 * ring buffer's cursor contract requires.
 * @internal
 */
export class ObservationFanout {
  private readonly _observers: ReadonlyArray<IMemoryObserver>;
  private readonly _clock: () => number;
  private readonly _warn: (message: string) => void;
  private _seq: number;

  public constructor(
    observers: ReadonlyArray<IMemoryObserver>,
    clock: () => number,
    warn: (message: string) => void
  ) {
    this._observers = observers;
    this._clock = clock;
    this._warn = warn;
    this._seq = 0;
  }

  /**
   * Build and fan out one observation record for a completed op. A no-op when no observers are
   * wired (the additive-default path pays nothing, not even the scope resolution).
   */
  public async fire(
    phase: MemoryObservationPhase,
    kind: Kind,
    scope: () => MemoryScopeKey | undefined,
    details: IObservationDetails
  ): Promise<void> {
    if (this._observers.length === 0) {
      return;
    }
    const record: IMemoryObservationRecord = {
      seq: ++this._seq,
      timestamp: this._clock(),
      phase,
      scope: scope(),
      id: details.id,
      kind,
      outcome: details.outcome,
      error: details.error,
      provenance: details.provenance,
      embed: details.embed
    };
    const awaited: Promise<void>[] = [];
    for (const observer of this._observers) {
      if (observer.fireAndForget === true) {
        // Intentionally not awaited: a fire-and-forget observer must not extend the store op's
        // latency. `_safeObserve` swallows internally; the `.catch` keeps the detached promise
        // from being flagged as floating.
        this._safeObserve(observer, record).catch(() => undefined);
      } else {
        awaited.push(this._safeObserve(observer, record));
      }
    }
    await Promise.all(awaited);
  }

  /** Invoke one observer, swallowing any failure or throw (logged at `warn`). */
  private async _safeObserve(observer: IMemoryObserver, record: IMemoryObservationRecord): Promise<void> {
    try {
      const observed: Result<unknown> = await observer.observe(record);
      if (observed.isFailure()) {
        this._warn(`memory observer failed (swallowed): ${observed.message}`);
      }
    } catch (error) {
      this._warn(`memory observer threw (swallowed): ${String(error)}`);
    }
  }
}
