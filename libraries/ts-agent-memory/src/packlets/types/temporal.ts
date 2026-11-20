/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { IMemoryEnvelope } from './envelope';

/**
 * The minimum a temporal helper needs: something carrying an envelope.
 *
 * @remarks
 * Every predicate and selector in this module reads `envelope.temporal`,
 * `envelope.created` and `envelope.seq` and **nothing else** — no body has ever
 * been consulted. Taking the structural shape rather than `IMemoryRecord` lets
 * the same helpers serve both an `IMemoryRecord<unknown>` (which satisfies it)
 * and an `IIndexedMemoryEntry` from the index's projected read surface, so the
 * temporal `asOf` projection can run over envelopes and materialize only the
 * versions that survive it.
 *
 * The selectors are generic in this shape so they return exactly what they were
 * given rather than widening to the constraint.
 * @public
 */
export interface IEnvelopeCarrier {
  /** The envelope the temporal predicates read. */
  readonly envelope: IMemoryEnvelope;
}

/**
 * Whether a record participates in the versioned (temporal) layout. A temporal
 * record always carries a {@link ITemporalBlock | temporal} block (the store
 * stamps `valid_at` on every versioned write); an atemporal record never does,
 * so presence of `temporal` is the discriminator. Independent of `id`/`entityId`
 * divergence (MTM is flat yet has `entityId !== id`).
 * @public
 */
export function isTemporalRecord(record: IEnvelopeCarrier): boolean {
  return record.envelope.temporal !== undefined;
}

/**
 * Whether a temporal record is a *current* version — its `temporal.invalid_at`
 * is `null` or absent (the still-valid sentinel). A non-temporal record is never
 * current in this sense (returns `false`).
 * @public
 */
export function isVersionCurrent(record: IEnvelopeCarrier): boolean {
  const temporal: IMemoryEnvelope['temporal'] = record.envelope.temporal;
  if (temporal === undefined) {
    return false;
  }
  return temporal.invalid_at === null || temporal.invalid_at === undefined;
}

/**
 * Whether a temporal record's validity interval contains `asOf` (epoch ms):
 * `valid_at <= asOf` and (`invalid_at` is null/absent OR `asOf < invalid_at`).
 * The version's `valid_at` defaults to its `created` when absent; a non-temporal
 * record is never "valid at" a point (returns `false`).
 * @public
 */
export function isVersionValidAt(record: IEnvelopeCarrier, asOf: number): boolean {
  const temporal: IMemoryEnvelope['temporal'] = record.envelope.temporal;
  if (temporal === undefined) {
    return false;
  }
  const start: number = temporal.valid_at ?? record.envelope.created;
  if (start > asOf) {
    return false;
  }
  const end: number | null | undefined = temporal.invalid_at;
  if (end === null || end === undefined) {
    return true;
  }
  return asOf < end;
}

/**
 * The version with the highest `seq` among `candidates` (undefined when empty).
 * `seq` is the store's monotonic write counter, so highest `seq` is the newest
 * version. Shared tiebreak for {@link selectCurrentVersion} /
 * {@link selectVersionAsOf}.
 */
function highestSeq<T extends IEnvelopeCarrier>(candidates: ReadonlyArray<T>): T | undefined {
  let best: T | undefined;
  for (const candidate of candidates) {
    if (best === undefined || candidate.envelope.seq > best.envelope.seq) {
      best = candidate;
    }
  }
  return best;
}

/**
 * Select the current version from a set of an entity's versions: the newest
 * (highest `seq`) version whose `invalid_at` is null/absent. `undefined` when the
 * entity has no current version (fully invalidated / soft-deleted, or empty).
 * @public
 */
export function selectCurrentVersion<T extends IEnvelopeCarrier>(versions: ReadonlyArray<T>): T | undefined {
  return highestSeq(versions.filter(isVersionCurrent));
}

/**
 * Select the version of an entity valid at `asOf` (epoch ms): the newest
 * (highest `seq`) version whose validity interval contains `asOf`. `undefined`
 * when no version was valid at that instant.
 * @public
 */
export function selectVersionAsOf<T extends IEnvelopeCarrier>(
  versions: ReadonlyArray<T>,
  asOf: number
): T | undefined {
  return highestSeq(versions.filter((version) => isVersionValidAt(version, asOf)));
}
