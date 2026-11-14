/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Kind } from '../types';

/**
 * How much of one derived artifact exists, for one {@link Kind}.
 *
 * @remarks
 * Two numbers rather than a percentage, deliberately: a ratio cannot express
 * *"nothing was expected"*, and a kind that is intentionally not derived (an
 * excluded kind, a kind with no projector) is a normal and healthy state that a
 * `0%` would render as an alarm.
 * @public
 */
export interface IArtifactCoverage {
  /**
   * Records of this kind the store would derive this artifact for, **after** any
   * exclusion. Read against {@link IDerivedStateCoverage.records} for the same
   * kind: `records: 40, expected: 0` is the exclusion story, stated rather than
   * inferred.
   */
  readonly expected: number;
  /**
   * Of those, how many the **store believes** are covered. See
   * {@link IIndexCoverage.indexSize} for why the word "believes" is load-bearing.
   */
  readonly covered: number;
}

/**
 * Coverage of the record-granular vector index.
 * @public
 */
export interface IIndexCoverage {
  /** Per-kind expected/covered, derived from the envelope walk. */
  readonly perKind: ReadonlyMap<Kind, IArtifactCoverage>;
  /**
   * What the index **actually holds**, whole-index.
   *
   * @remarks
   * **This is a fact and {@link IArtifactCoverage.covered} is a belief, and the
   * two are reported separately because their disagreement is the only free
   * signal that distinguishes a persistent index from a fresh one.** `covered`
   * counts envelopes carrying an `embeddingRef`; `indexSize` counts vectors. With
   * a persistent index they agree. With an in-memory index at open they do not —
   * the envelopes still claim references from previous sessions while the index
   * holds nothing, so `covered` **lies, in the confident direction**.
   *
   * Collapsing them into one "coverage %" would destroy that signal, which is why
   * this type does not offer one.
   */
  readonly indexSize: number;
}

/**
 * Coverage of the fragment-granular vector index.
 *
 * @remarks
 * **Aggregate only, and the reason is structural rather than an omission.** The
 * record lane has a per-record marker on the envelope (`embeddingRef`), so its
 * numerator falls out of the same free walk that produces the denominator. The
 * fragment lane has **no envelope marker at all** — nothing on a record says
 * whether it has fragments — so a per-kind numerator would cost one
 * `IFragmentVectorIndex.has` call per record, and coverage is contractually
 * cheap (see {@link IMemoryStore.coverage}).
 *
 * The per-kind **denominator** is still available on
 * {@link IDerivedStateCoverage.records}. A caller who needs the per-kind
 * numerator runs `reconcile(kind, 'fragment-vector')`, which reports it because
 * it is already paying for the walk.
 * @public
 */
export interface IFragmentIndexCoverage {
  /** Records with at least one fragment held. Mirrors `IFragmentVectorIndex.recordCount`. */
  readonly indexRecordCount: number;
  /** Total fragments held — the fan-out. Mirrors `IFragmentVectorIndex.fragmentCount`. */
  readonly indexFragmentCount: number;
}

/**
 * A snapshot of how much of the store's **derived state** exists, resolved by
 * {@link Kind} — the answer to *"is my derived state consistent with my
 * records?"*.
 *
 * @remarks
 * **Absent is not zero.** Each artifact member is optional, and `undefined` means
 * *this artifact is not derived here at all* — no rank projector is registered,
 * or that index lane is not wired. It never means *nothing is covered*. Folding
 * the two would make a health surface render a confident `0%` for a feature the
 * deployment deliberately did not turn on, which is the same defect as
 * `embeddingRef`'s three-way ambiguity one level up.
 *
 * So: `fragmentVectors: undefined` is a store with no fragment index and is not a
 * problem. `fragmentVectors: { indexRecordCount: 0, indexFragmentCount: 0 }` is a
 * wired fragment index holding nothing, and probably is.
 * @public
 */
export interface IDerivedStateCoverage {
  /** Records per kind — the denominator every other number is read against. */
  readonly records: ReadonlyMap<Kind, number>;
  /** Absent when no kind has a registered {@link RankProjector}. */
  readonly rank?: ReadonlyMap<Kind, IArtifactCoverage>;
  /** Absent when the record-vector lane is not wired. */
  readonly recordVectors?: IIndexCoverage;
  /** Absent when the fragment lane is not wired. */
  readonly fragmentVectors?: IFragmentIndexCoverage;
}
