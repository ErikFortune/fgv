/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, captureResult, succeed } from '@fgv/ts-utils';
import { Kind, embeddingRefOf } from '../types';
import { IIndexedMemoryEntry } from '../index';
import { IFragmentVectorIndex, IVectorIndex } from '../vector';
import { IArtifactCoverage, IDerivedStateCoverage } from './coverage';

/**
 * Everything {@link computeCoverage} needs, supplied by the store.
 *
 * @remarks
 * Taken as inputs rather than reading a store, so this module has no dependency
 * on `FileTreeMemoryStore` and the walk is testable on its own. Package-internal:
 * `IMemoryStore.coverage` is the published surface.
 */
export interface IComputeCoverageParams {
  /** The projected index entries — envelopes only, already free of file reads. */
  readonly entries: ReadonlyArray<IIndexedMemoryEntry>;
  /** Whether `kind` has a registered rank projector. */
  readonly hasRankProjector: (kind: Kind) => boolean;
  /** Whether ANY kind has one — distinguishes an unwired lane from an empty one. */
  readonly anyRankProjector: boolean;
  /** Whether `kind` participates in the record-granular vector index. */
  readonly embedsKind: (kind: Kind) => boolean;
  /** The wired record-vector index, or `undefined` when the lane is unwired. */
  readonly vectorIndex: IVectorIndex | undefined;
  /** The wired fragment index, or `undefined` when the lane is unwired. */
  readonly fragmentIndex: IFragmentVectorIndex | undefined;
}

/** A coverage bucket under construction; the published shape is readonly. */
interface IMutableArtifactCoverage {
  expected: number;
  covered: number;
}

/** Get or create `kind`'s bucket. */
function bucketFor(buckets: Map<Kind, IMutableArtifactCoverage>, kind: Kind): IMutableArtifactCoverage {
  let bucket: IMutableArtifactCoverage | undefined = buckets.get(kind);
  if (bucket === undefined) {
    bucket = { expected: 0, covered: 0 };
    buckets.set(kind, bucket);
  }
  return bucket;
}

/**
 * One walk over the projected entries, producing every derived-state count.
 *
 * @remarks
 * **Reads no record bodies and calls no embedder**, and the walk itself touches
 * no filesystem. That is the contract `IMemoryStore.coverage` makes, and this
 * function is where it is kept: every number below comes from an envelope field
 * or an index-side count. The index-side counts are the one place that leaves
 * envelope territory — on a durable backend they run a query, which is why they
 * are captured (see the comment at the `captureResult` below) and why the walk's
 * "no filesystem" claim is scoped to the walk rather than the whole call. A
 * future addition that needs a body does not belong here.
 *
 * Extracted from `fileTreeMemoryStore.ts` because inlining it took that file past
 * the 2000-line `max-lines` cap — the same reason `vectorRecordSource.ts` exists.
 */
export function computeCoverage(params: IComputeCoverageParams): Result<IDerivedStateCoverage> {
  const records: Map<Kind, number> = new Map<Kind, number>();
  const rank: Map<Kind, IMutableArtifactCoverage> = new Map<Kind, IMutableArtifactCoverage>();
  const vectors: Map<Kind, IMutableArtifactCoverage> = new Map<Kind, IMutableArtifactCoverage>();

  for (const entry of params.entries) {
    const kind: Kind = entry.envelope.kind;
    records.set(kind, (records.get(kind) ?? 0) + 1);

    // `rank` is expected only where a projector is registered. A kind with no
    // projector stays absent from the map rather than appearing at 0% — the store
    // is not failing to rank it, it was never asked to.
    if (params.hasRankProjector(kind)) {
      const bucket: IMutableArtifactCoverage = bucketFor(rank, kind);
      bucket.expected += 1;
      if (entry.envelope.rank !== undefined) {
        bucket.covered += 1;
      }
    }

    // Every kind appears here, INCLUDING excluded ones: `records: 40, expected: 0`
    // is the exclusion story stated rather than inferred, and is strictly more
    // useful than omitting the kind entirely.
    const bucket: IMutableArtifactCoverage = bucketFor(vectors, kind);
    if (params.embedsKind(kind)) {
      bucket.expected += 1;
      // Counted INSIDE the exclusion branch so `covered <= expected` holds, which
      // is what `IArtifactCoverage.covered` promises when it says "of those". An
      // excluded kind carrying a residual `embeddingRef` (written before
      // `embedKinds` narrowed and never re-put) would otherwise report
      // `expected: 0, covered: 3` and make `expected - covered` negative for a
      // caller sizing the gap. That residue is not lost: its vector still counts
      // toward `indexSize`, which is exactly the belief-vs-fact disagreement that
      // field exists to surface.
      if (embeddingRefOf(entry.envelope) !== undefined) {
        bucket.covered += 1;
      }
    }
  }

  // The index-side counts are the ONE place this walk leaves envelope territory,
  // and on a durable backend they run SQL: `SqliteVecVectorIndex.size` executes a
  // prepared COUNT and throws on a closed connection. Capturing them keeps the
  // `Result` contract honest — coverage FAILS rather than rejecting — and is why
  // the "touches no filesystem" claim is scoped to the walk rather than the whole
  // call: reading a persistent index's count is I/O, and it is the caller's own
  // index doing it.
  return captureResult(() => ({
    recordVectors: params.vectorIndex === undefined ? undefined : { size: params.vectorIndex.size },
    fragmentVectors:
      params.fragmentIndex === undefined
        ? undefined
        : {
            recordCount: params.fragmentIndex.recordCount,
            fragmentCount: params.fragmentIndex.fragmentCount
          }
  }))
    .withErrorFormat((e) => `memory coverage: reading an index count failed: ${e}`)
    .onSuccess((counts) =>
      succeed({
        records,
        // Absent, never zero: an unwired lane and an empty one are different facts,
        // and folding them makes a health surface alarm on a feature nobody enabled.
        ...(params.anyRankProjector ? { rank: rank as ReadonlyMap<Kind, IArtifactCoverage> } : {}),
        ...(counts.recordVectors !== undefined
          ? {
              recordVectors: {
                perKind: vectors as ReadonlyMap<Kind, IArtifactCoverage>,
                indexSize: counts.recordVectors.size
              }
            }
          : {}),
        ...(counts.fragmentVectors !== undefined
          ? {
              fragmentVectors: {
                indexRecordCount: counts.fragmentVectors.recordCount,
                indexFragmentCount: counts.fragmentVectors.fragmentCount
              }
            }
          : {})
      })
    );
}
