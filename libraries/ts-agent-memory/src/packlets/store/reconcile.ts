/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Kind } from '../types';
import { ISkippedVectorRecord } from '../vector';

/**
 * Which derived artifact a {@link IMemoryStore.reconcile} call repairs.
 *
 * @remarks
 * **The operation names its artifact rather than repairing everything wired**,
 * and the reasons are structural rather than stylistic: the record and fragment
 * lanes are independently wirable (so an unnamed repair on a fragment-only store
 * would have to no-op or guess), their units are incommensurable (one vector per
 * record vs. N), and their costs differ by orders of magnitude — a measured case
 * put 68 fragments behind a single 56 KB record. An operation whose cost varies
 * that much along a dimension it does not name is the accidental-expense shape
 * `IMemoryStore.list`'s required selection exists to prevent.
 * @public
 */
export type DerivedArtifact = 'rank' | 'record-vector' | 'fragment-vector';

/** What every reconcile reports, whatever the artifact. @public */
export interface IReconcileReportBase {
  /** The kind reconciled — named by the caller, so every count below is scalar. */
  readonly kind: Kind;
  /** Records of this kind considered. The denominator for everything else. */
  readonly examined: number;
  /** Records whose derived artifact was (re)produced by this call. */
  readonly repaired: number;
  /** Records that failed, with the error. A fault, never a decline. */
  readonly failed: ReadonlyArray<ISkippedVectorRecord>;
}

/** A `rank` reconcile: re-run the projector and restamp what changed. @public */
export interface IRankReconcileReport extends IReconcileReportBase {
  readonly artifact: 'rank';
}

/**
 * A record-vector reconcile.
 * @public
 */
export interface IVectorReconcileReport extends IReconcileReportBase {
  readonly artifact: 'record-vector';
  /**
   * Records the index already held and which needed **no embedder call** — the
   * whole point of a targeted repair, and the number that shows what it saved
   * against a `rebuild`.
   */
  readonly alreadyIndexed: number;
  /**
   * Records whose vector the index held but whose envelope had **lost its
   * `embeddingRef`** — repaired by restamping the reference, with no embedder
   * call.
   *
   * @remarks
   * This case is invisible to an `embeddingRef`-only check, which is one of the
   * two reasons `IVectorIndex.has` is on the contract: a reference-absent record
   * looks identical to a never-embedded one until you ask the index.
   */
  readonly restamped: number;
  /** Records the embedder intentionally declined. Not a failure, not a gap. */
  readonly declined: number;
}

/**
 * A fragment-vector reconcile.
 *
 * @remarks
 * Note there is no `restamped`: the fragment lane has **no envelope marker**, so
 * there is no reference that can go missing and nothing to restamp. The
 * asymmetry with {@link IVectorReconcileReport} is real rather than an oversight.
 * @public
 */
export interface IFragmentReconcileReport extends IReconcileReportBase {
  readonly artifact: 'fragment-vector';
  /** Records already represented, needing no embedder call. */
  readonly alreadyIndexed: number;
  /** Records whose embedder produced no fragments — this lane's decline. */
  readonly declined: number;
  /** Fragments written by this call — the fan-out `repaired` cannot express. */
  readonly fragments: number;
}

/**
 * What a {@link IMemoryStore.reconcile} established, discriminated by artifact.
 * @public
 */
export type ReconcileReport = IRankReconcileReport | IVectorReconcileReport | IFragmentReconcileReport;
