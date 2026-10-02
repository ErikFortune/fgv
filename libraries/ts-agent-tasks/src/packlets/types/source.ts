/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { ITaskProgress, ITaskReference } from './common';
import { Instant } from './ids';
import { TaskLifecycle } from './lifecycle';

/**
 * Binding from a task to the external source that executes it.
 *
 * @remarks
 * `reference` is opaque source-owned data, versioned independently of the task
 * envelope and of the task's detail schema.
 * @public
 */
export interface ISourceBinding {
  readonly sourceId: string;
  readonly referenceVersion: number;
  readonly reference: JsonValue;
}

/**
 * An opaque source revision. `epoch` identifies the source's incarnation; `token`
 * orders revisions within it.
 *
 * @remarks
 * Tokens are never sorted lexically or by observation time — only the source's own
 * comparator orders them, and an epoch change is incomparable until an explicit
 * source reset establishes a new baseline.
 * @public
 */
export interface ISourceRevision {
  readonly epoch: string;
  readonly token: string;
}

/**
 * One observation of a task's execution state, as projected by its source.
 *
 * @remarks
 * Only execution fields appear here. Parent, responsibility, scopes, identity and the
 * source binding itself are catalog-owned and cannot be changed by an observation.
 *
 * This slice declares it because {@link RecoveryResult} carries one. The source
 * *interface* that produces projections, and the read result of observing a binding,
 * belong to the slice that implements reconciliation.
 * @public
 */
export interface ISourceProjection {
  readonly revision: ISourceRevision;
  readonly observedAt: Instant;
  readonly lifecycle: TaskLifecycle;
  readonly progress?: ITaskProgress;
  readonly attention: ReadonlyArray<ITaskReference>;
  readonly details: JsonValue;
}

/**
 * What a host declares about recovering an external task after a restart.
 * @public
 */
export type RecoveryDeclaration = 'reattach' | 'host-resume' | 'not-recoverable';

/**
 * Result of asking a source to recover a task.
 *
 * @remarks
 * `resumable` returns work to the host for explicit approval; it never resumes on its
 * own. `unresolved` is distinct from `unavailable`: the source answered, but could not
 * establish what became of the work.
 *
 * `unrecoverable` carries the source's own terminal projection — `failed` or `cancelled` — at
 * the revision it declares the work lost. (T6 revision: T1's variant carried a reason only,
 * which left the broker to *invent* the failed state it applies. A source-confirmed failure is
 * an observation like any other, with a revision that deduplicates it; no persisted record ever
 * carried the old shape.)
 * @public
 */
export type RecoveryResult =
  | { readonly state: 'reattached' | 'completed'; readonly value: ISourceProjection }
  | { readonly state: 'resumable'; readonly reference: JsonValue }
  | { readonly state: 'unrecoverable'; readonly reason: string; readonly value: ISourceProjection }
  | { readonly state: 'unavailable' | 'unresolved'; readonly reason: string };

/**
 * Health of the broker's *observation* of a task, independent of the task's execution
 * lifecycle.
 *
 * @remarks
 * A source outage makes observation `stale` or `unavailable`; it never moves the task
 * through its lifecycle.
 * @public
 */
export type ObservationHealth =
  | { readonly state: 'current'; readonly observedAt: Instant }
  | {
      readonly state: 'stale' | 'unavailable';
      readonly checkedAt: Instant;
      readonly lastObservedAt?: Instant;
      readonly reason: string;
    };

/**
 * The history contract a source offers.
 *
 * @remarks
 * `observed-state` promises the latest snapshot only — it cannot supply intermediate
 * events it has discarded. `source-replay` promises an ordered feed of required
 * updates, and under A3 must additionally declare a *finite* remaining envelope
 * (see {@link ISourceReplayEnvelope}) before its stronger guarantee is admitted.
 * @public
 */
export type SourceHistoryContract = 'observed-state' | 'source-replay';

/**
 * The finite remaining required-update envelope a `source-replay` adapter must declare
 * and honor at admission.
 *
 * @remarks
 * Finite storage cannot reserve an unbounded sequence of required external events. The
 * envelope is what makes the stronger guarantee reservable: it states how many further
 * required updates, and how many encoded bytes, remain before the accepted work reaches
 * a terminal state, *including* replay needed during recovery. Extending it is new
 * admission; completion of already-accepted work must never depend on that extension.
 * @public
 */
export interface ISourceReplayEnvelope {
  readonly remainingRequiredUpdates: number;
  readonly remainingRequiredBytes: number;
}

/**
 * What a registration or subscription declares about its source's history contract.
 *
 * @remarks
 * Modelled as a union rather than a flag plus an optional envelope, so that a
 * `source-replay` declaration without a finite envelope is not representable.
 * @public
 */
export type SourceHistoryDeclaration =
  | { readonly history: 'observed-state' }
  | { readonly history: 'source-replay'; readonly envelope: ISourceReplayEnvelope };
