/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Collections, Result, fail, succeed } from '@fgv/ts-utils';
import { IMemoryObservationQuery, IMemoryObservationRecord, IMemoryObserver } from './observer';

/**
 * Construction options for {@link MemoryObservationStore.create}.
 * @public
 */
export interface IMemoryObservationStoreCreateParams {
  /**
   * Maximum number of observation records retained before the oldest is
   * overwritten. Defaults to `1000`. Must be a positive integer if supplied.
   */
  readonly maxRecords?: number;
}

/**
 * The default in-memory observation store: an {@link IMemoryObserver} that
 * retains the records it observes in a bounded ring and answers schema-aware
 * {@link MemoryObservationStore.query | queries} over them.
 *
 * @remarks
 * **Privacy posture — this store is most-permissive by design.** It retains
 * every field of every record verbatim, including any `provenance` and
 * `querySnapshot`. The library bakes in **no** redaction, retention, or
 * field-stripping policy — that is deployment policy, not library policy. A
 * deployment that must redact wraps this store with its own
 * {@link IMemoryObserver} that transforms records before forwarding, or
 * substitutes a different observer entirely. Size is the only bounded
 * dimension, via `maxRecords`.
 *
 * The store composes {@link Collections.RetainingRingBuffer} (it does not
 * hand-roll a ring) and implements {@link IMemoryObserver} directly — `observe`
 * (the hook) and `query` (the read surface) live on the same class. Wire it via
 * {@link IFileTreeMemoryStoreCreateParams.observers}. `seq` and `timestamp` are
 * assigned by the firing authority (the store) before `observe`, so this store
 * never mints them.
 * @public
 */
export class MemoryObservationStore implements IMemoryObserver {
  /**
   * The bounded ring of observed records. The firing authority assigns each
   * record's `seq`, so the ring's monotonic-`seq` cursor contract is satisfied
   * by that authority's per-instance counter.
   * @internal
   */
  private readonly _buffer: Collections.RetainingRingBuffer<IMemoryObservationRecord>;

  /**
   * @param buffer - The pre-constructed backing ring buffer.
   * @internal
   */
  private constructor(buffer: Collections.RetainingRingBuffer<IMemoryObservationRecord>) {
    this._buffer = buffer;
  }

  /**
   * The highest `seq` observed so far. Hold this value and pass it as
   * `sinceSeq` to {@link MemoryObservationStore.query | query} to page only
   * records observed afterward. Stable across ring eviction and
   * {@link MemoryObservationStore.clear | clear}.
   */
  public get lastSeq(): number {
    return this._buffer.lastSeq;
  }

  /**
   * The number of records currently retained.
   */
  public get size(): number {
    return this._buffer.size;
  }

  /**
   * Family-convention factory.
   * @param params - {@link IMemoryObservationStoreCreateParams | Construction options}.
   * @returns On success, a new store. Fails if `maxRecords` is supplied and is
   * not a positive integer.
   */
  public static create(params?: IMemoryObservationStoreCreateParams): Result<MemoryObservationStore> {
    const maxRecords: number | undefined = params?.maxRecords;
    if (maxRecords !== undefined && (!Number.isInteger(maxRecords) || maxRecords < 1)) {
      return fail(`MemoryObservationStore: maxRecords must be a positive integer (got ${maxRecords})`);
    }
    return succeed(
      new MemoryObservationStore(
        new Collections.RetainingRingBuffer<IMemoryObservationRecord>({ maxRecords })
      )
    );
  }

  /**
   * {@inheritDoc IMemoryObserver.observe}
   */
  public observe(record: IMemoryObservationRecord): Promise<Result<unknown>> {
    this._buffer.push(record);
    return Promise.resolve(succeed(record));
  }

  /**
   * Returns retained records, oldest-first, narrowed by the supplied criteria.
   * @param criteria - {@link IMemoryObservationQuery | AND-combined filter criteria}.
   * @returns The matching records, oldest-first.
   */
  public query(criteria?: IMemoryObservationQuery): ReadonlyArray<IMemoryObservationRecord> {
    return this._buffer.query({
      sinceSeq: criteria?.sinceSeq,
      limit: criteria?.limit,
      filter:
        criteria === undefined ? undefined : (record) => MemoryObservationStore._matches(record, criteria)
    });
  }

  /**
   * Clears all retained records. Does NOT reset
   * {@link MemoryObservationStore.lastSeq | lastSeq}, so a held `sinceSeq`
   * cursor never re-sees a sequence number.
   */
  public clear(): void {
    this._buffer.clear();
  }

  /**
   * Tests a record against the non-`seq`/`limit` criteria (those are applied by
   * the ring buffer itself).
   * @internal
   */
  private static _matches(record: IMemoryObservationRecord, criteria: IMemoryObservationQuery): boolean {
    if (criteria.since !== undefined && record.timestamp < criteria.since) {
      return false;
    }
    if (criteria.until !== undefined && record.timestamp > criteria.until) {
      return false;
    }
    if (criteria.scope !== undefined && record.scope !== criteria.scope) {
      return false;
    }
    if (criteria.kind !== undefined && record.kind !== criteria.kind) {
      return false;
    }
    if (criteria.phase !== undefined && record.phase !== criteria.phase) {
      return false;
    }
    if (criteria.outcome !== undefined && record.outcome !== criteria.outcome) {
      return false;
    }
    return true;
  }
}
