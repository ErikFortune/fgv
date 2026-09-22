/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  CapacityDimension,
  ITaskCapacityClaim,
  ITaskCapacityDimensionStatus,
  ITaskCapacityProfile,
  TaskCapacityState,
  TaskResult,
  allCapacityDimensions,
  capacityPressureThreshold
} from '../types';
import { ok, taskFailure } from './failures';

/**
 * An amount for every capacity dimension.
 * @internal
 */
export type DimensionAmounts = { [dimension in CapacityDimension]: number };

/**
 * An all-zero {@link DimensionAmounts}.
 * @internal
 */
export function zeroAmounts(): DimensionAmounts {
  return {
    'retained-tasks': 0,
    'non-archived-tasks': 0,
    subscriptions: 0,
    sources: 0,
    updates: 0,
    'audience-links': 0,
    'acknowledgement-ids': 0,
    operations: 0,
    'record-bytes': 0,
    'logical-bytes': 0,
    'resident-payload-bytes': 0
  };
}

/**
 * Sums the still-held charges of a claim collection.
 *
 * @remarks
 * `reserved` and `indeterminate` both hold their charges: ambiguity about whether a claim was
 * consumed is never resolved by assuming the capacity is free (design §8.6).
 * @internal
 */
export function heldCharges(claims: ReadonlyArray<ITaskCapacityClaim>): DimensionAmounts {
  const amounts: DimensionAmounts = zeroAmounts();
  for (const claim of claims) {
    if (claim.disposition !== 'consumed') {
      for (const charge of claim.charges) {
        amounts[charge.dimension] += charge.amount;
      }
    }
  }
  return amounts;
}

/**
 * One record's contribution to the ledger.
 *
 * @remarks
 * `used['record-bytes']` is the record's own encoded size and `reserved['record-bytes']` its
 * reserved future growth. That dimension is **per record**, not additive: it is checked
 * against `recordLimit`, and a status row reports the record nearest its limit.
 * @internal
 */
export interface ILedgerEntry {
  readonly recordId: string;
  readonly used: DimensionAmounts;
  readonly reserved: DimensionAmounts;
  readonly recordLimit: number;
  readonly indeterminate: boolean;
}

/**
 * Dimensions whose usage cleanup (pruning, archive) can release. Lifetime dimensions —
 * retained identities, operation evidence, acknowledgement history, subscriptions and sources
 * — are not released by any v1 operation.
 */
const reclaimable: ReadonlySet<CapacityDimension> = new Set<CapacityDimension>([
  'non-archived-tasks',
  'updates',
  'audience-links',
  'record-bytes',
  'logical-bytes',
  'resident-payload-bytes'
]);

/**
 * The derived capacity ledger (design §8.6).
 *
 * @remarks
 * Derived and discardable: it is rebuilt at every open from the authoritative records and
 * pending inventory entries, never persisted, and there is no separate quota file. Held only
 * under the single writer.
 *
 * Admission is a vector check. A proposed change replaces some entries; for every dimension
 * whose `used + reserved` would **grow**, the result must stay within the limit. A change that
 * does not grow a dimension is never refused on it, so draining work — archive, pruning,
 * settlement within a reservation — is admitted at a full repository.
 * @internal
 */
export class CapacityLedger {
  private _profile: ITaskCapacityProfile;
  private readonly _entries: Map<string, ILedgerEntry>;

  public constructor(profile: ITaskCapacityProfile) {
    this._profile = profile;
    this._entries = new Map<string, ILedgerEntry>();
  }

  public get profile(): ITaskCapacityProfile {
    return this._profile;
  }

  public setProfile(profile: ITaskCapacityProfile): void {
    this._profile = profile;
  }

  public get(key: string): ILedgerEntry | undefined {
    return this._entries.get(key);
  }

  /** Applies a change that has already been admitted and committed. */
  public apply(changes: ReadonlyMap<string, ILedgerEntry | undefined>): void {
    for (const [key, entry] of changes) {
      if (entry === undefined) {
        this._entries.delete(key);
      } else {
        this._entries.set(key, entry);
      }
    }
  }

  /** Totals of the additive dimensions, with `changes` applied hypothetically. */
  private _totals(changes?: ReadonlyMap<string, ILedgerEntry | undefined>): {
    used: DimensionAmounts;
    reserved: DimensionAmounts;
  } {
    const used: DimensionAmounts = zeroAmounts();
    const reserved: DimensionAmounts = zeroAmounts();
    const add = (entry: ILedgerEntry): void => {
      for (const dimension of allCapacityDimensions) {
        used[dimension] += entry.used[dimension];
        reserved[dimension] += entry.reserved[dimension];
      }
    };
    for (const [key, entry] of this._entries) {
      if (changes === undefined || !changes.has(key)) {
        add(entry);
      }
    }
    if (changes !== undefined) {
      for (const entry of changes.values()) {
        if (entry !== undefined) {
          add(entry);
        }
      }
    }
    return { used, reserved };
  }

  /**
   * Admits or refuses a proposed change, before anything is written.
   *
   * @remarks
   * Fails with `backpressure` and structured capacity detail naming the first dimension that
   * would be exceeded. An indeterminate claim anywhere fences all growth: the ledger cannot
   * know what is free, and never assumes.
   */
  public admit(changes: ReadonlyMap<string, ILedgerEntry | undefined>): TaskResult<true> {
    const before = this._totals();
    const after = this._totals(changes);
    const limits = this._profile.limits;

    for (const dimension of allCapacityDimensions) {
      if (dimension === 'record-bytes') {
        continue;
      }
      const committedBefore: number = before.used[dimension] + before.reserved[dimension];
      const committedAfter: number = after.used[dimension] + after.reserved[dimension];
      if (committedAfter > committedBefore) {
        if (this._isFenced()) {
          return taskFailure(
            `capacity: admission is fenced while a claim's consumption is indeterminate`,
            'backpressure',
            'after-host-action',
            {
              capacity: {
                reason: 'capacity-exhausted',
                dimension,
                used: before.used[dimension],
                reserved: before.reserved[dimension],
                requested: committedAfter - committedBefore,
                limit: limits[dimension],
                reclaimableByCleanup: false
              }
            }
          );
        }
        if (committedAfter > limits[dimension]) {
          return taskFailure(
            `capacity: '${dimension}' would reach ${committedAfter} of its limit of ${limits[dimension]}`,
            'backpressure',
            'after-host-action',
            {
              capacity: {
                reason: 'capacity-exhausted',
                dimension,
                used: before.used[dimension],
                reserved: before.reserved[dimension],
                requested: committedAfter - committedBefore,
                limit: limits[dimension],
                reclaimableByCleanup: reclaimable.has(dimension)
              }
            }
          );
        }
      }
    }

    // `record-bytes` is per record: each changed record must fit its own ceiling, counting its
    // own reserved growth. Only growth is refused, as for every other dimension.
    for (const [key, entry] of changes) {
      if (entry !== undefined) {
        const previous: ILedgerEntry | undefined = this._entries.get(key);
        const beforeBytes: number =
          previous === undefined ? 0 : previous.used['record-bytes'] + previous.reserved['record-bytes'];
        const afterBytes: number = entry.used['record-bytes'] + entry.reserved['record-bytes'];
        if (afterBytes > beforeBytes && afterBytes > entry.recordLimit) {
          return taskFailure(
            `capacity: record ${entry.recordId} would be ${afterBytes} bytes including its reserved ` +
              `growth, over its limit of ${entry.recordLimit}`,
            'backpressure',
            'after-host-action',
            {
              capacity: {
                reason: 'capacity-exhausted',
                dimension: 'record-bytes',
                recordId: entry.recordId,
                used: entry.used['record-bytes'],
                reserved: entry.reserved['record-bytes'],
                requested: afterBytes - beforeBytes,
                limit: entry.recordLimit,
                reclaimableByCleanup: true
              }
            }
          );
        }
      }
    }
    return ok(true);
  }

  private _isFenced(): boolean {
    for (const entry of this._entries.values()) {
      if (entry.indeterminate) {
        return true;
      }
    }
    return false;
  }

  /**
   * Dimensions whose committed total exceeds the limit. Admission never produces this, so at
   * open it means the records disagree with their own stored policy.
   */
  public overLimit(): ReadonlyArray<string> {
    const { used, reserved } = this._totals();
    const over: string[] = [];
    for (const dimension of allCapacityDimensions) {
      if (
        dimension !== 'record-bytes' &&
        used[dimension] + reserved[dimension] > this._profile.limits[dimension]
      ) {
        over.push(dimension);
      }
    }
    for (const entry of this._entries.values()) {
      if (entry.used['record-bytes'] + entry.reserved['record-bytes'] > entry.recordLimit) {
        over.push(`record-bytes (${entry.recordId})`);
      }
    }
    return over;
  }

  /** The per-dimension status rows and overall state. */
  public status(): { state: TaskCapacityState; dimensions: ReadonlyArray<ITaskCapacityDimensionStatus> } {
    const { used, reserved } = this._totals();
    const rows: ITaskCapacityDimensionStatus[] = [];
    for (const dimension of allCapacityDimensions) {
      rows.push(
        dimension === 'record-bytes'
          ? this._recordBytesRow()
          : this._row(dimension, used[dimension], reserved[dimension], this._profile.limits[dimension])
      );
    }
    let state: TaskCapacityState = 'ok';
    if (this._isFenced()) {
      state = 'admission-blocked';
    } else if (rows.some((row) => row.available === 0)) {
      state = 'draining';
    } else if (rows.some((row) => row.pressure)) {
      state = 'pressure';
    }
    return { state, dimensions: rows };
  }

  private _row(
    dimension: CapacityDimension,
    used: number,
    reserved: number,
    limit: number
  ): ITaskCapacityDimensionStatus {
    const committed: number = used + reserved;
    return {
      dimension,
      used,
      reserved,
      available: limit - committed,
      limit,
      pressure: committed >= Math.ceil(limit * capacityPressureThreshold),
      limitingRecordIds: this._largest((entry) => entry.used[dimension] + entry.reserved[dimension])
    };
  }

  /** The record nearest its own ceiling represents the per-record dimension. */
  private _recordBytesRow(): ITaskCapacityDimensionStatus {
    let worst: ILedgerEntry | undefined;
    let worstRatio: number = -1;
    for (const entry of this._entries.values()) {
      const ratio: number = (entry.used['record-bytes'] + entry.reserved['record-bytes']) / entry.recordLimit;
      if (ratio > worstRatio) {
        worst = entry;
        worstRatio = ratio;
      }
    }
    if (worst === undefined) {
      return this._row('record-bytes', 0, 0, this._profile.limits['record-bytes']);
    }
    const row: ITaskCapacityDimensionStatus = this._row(
      'record-bytes',
      worst.used['record-bytes'],
      worst.reserved['record-bytes'],
      worst.recordLimit
    );
    return { ...row, limitingRecordIds: [worst.recordId] };
  }

  /** Up to five records contributing most to a dimension. */
  private _largest(measure: (entry: ILedgerEntry) => number): ReadonlyArray<string> {
    return Array.from(this._entries.values())
      .map((entry) => ({ id: entry.recordId, amount: measure(entry) }))
      .filter((e) => e.amount > 0)
      .sort((a, b) => b.amount - a.amount || (a.id < b.id ? -1 : 1))
      .slice(0, 5)
      .map((e) => e.id);
  }
}
