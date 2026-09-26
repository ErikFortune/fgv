/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { ICommandRequest, CommandState } from './commands';
import { TaskResult } from './failure';
import { OperationId, TaskId, TaskRevision } from './ids';
import {
  ISourceBinding,
  ISourceProjection,
  ISourceRevision,
  RecoveryResult,
  SourceHistoryContract
} from './source';

/**
 * How two source revisions order, by the source's own comparator.
 *
 * @remarks
 * `incomparable` is an epoch change: nothing orders across it until an explicit recovery result
 * establishes the new baseline. Tokens are never ordered lexically or by observation time.
 * @public
 */
export type SourceRevisionOrder = 'older' | 'same' | 'newer' | 'incomparable';

/**
 * The result of reading one binding from its source.
 *
 * @remarks
 * `unavailable` is an outage: it changes observation health, never execution lifecycle.
 * `missing` is unresolved — never an automatic cancellation or deletion.
 * @public
 */
export type SourceRead =
  | { readonly state: 'observed'; readonly value: ISourceProjection }
  | { readonly state: 'unavailable' | 'missing'; readonly reason: string };

/**
 * One binding's observation within a reconciliation page.
 * @public
 */
export interface ISourceObservation {
  readonly binding: ISourceBinding;
  readonly observation: SourceRead;
}

/**
 * Which bindings a reconciliation listing covers.
 *
 * @remarks
 * A source listing only active work cannot discover terminal outcomes it has stopped listing, so an
 * `active-only` page can never make a pass `complete` (design § 5: "a source listing only active
 * tasks cannot claim complete recovery").
 * @public
 */
export type SourceReconcileCoverage = 'all-bindings' | 'active-only';

/**
 * One page of a source's reconciliation listing or, for a `source-replay` source, of its durable
 * ordered feed.
 *
 * @remarks
 * - `checkpoint` is the position *after* this page. The broker persists it — and passes it back as
 *   the next `cursor` — only once every observation in the page has committed.
 * - `nextCursor` is present when more pages are available now; the pass continues with it.
 * - `gap` says the source cannot supply part of what it owes. The broker stops the pass there
 *   without advancing its cursor.
 *
 * For `source-replay`, a page's observations of one binding carry strictly increasing revisions;
 * duplicates of revisions the broker has already committed are safe and skipped.
 * @public
 */
export interface ISourceReconcilePage {
  readonly observations: ReadonlyArray<ISourceObservation>;
  readonly nextCursor?: string;
  readonly checkpoint?: string;
  readonly completeness: 'complete' | 'partial' | 'gap';
  readonly coverage: SourceReconcileCoverage;
  readonly issues: ReadonlyArray<string>;
}

/**
 * Why a source definitively refused a command.
 *
 * @remarks
 * `conflict` is the source's precondition failing — a refusal, never an optimistic status update.
 * @public
 */
export type SourceCommandRejection = 'unsupported' | 'conflict' | 'invalid-transition';

/**
 * What a source answered to a dispatched command.
 *
 * @remarks
 * - `accepted` — the source took the command; its effect is not yet observed.
 * - `applied` — the source reports the effect, with the projection it produced. For an
 *   `observed-state` source the broker commits that projection; for a `source-replay` source it is
 *   a hint and the receipt stays `accepted` until the feed reaches that revision.
 * - `indeterminate` — the source cannot say whether it acted.
 * - `key-expired` — the source no longer retains this command key, so it can neither say whether it
 *   acted nor deduplicate a resend. The command is held; it is never resent.
 * @public
 */
export type SourceCommandResult =
  | { readonly state: 'rejected'; readonly reason: SourceCommandRejection }
  | { readonly state: 'accepted'; readonly sourceReceipt: string }
  | { readonly state: 'applied'; readonly observation: ISourceProjection }
  | { readonly state: 'indeterminate'; readonly reason: string }
  | { readonly state: 'key-expired'; readonly reason: string };

/**
 * What a source's command lookup found for a command key.
 *
 * @remarks
 * `not-found` does not make a resend safe: a send may still be in flight. Only a source that
 * deduplicates the key (`idempotency: 'source-key'`) is ever sent the same command again.
 * @public
 */
export type SourceCommandLookup = SourceCommandResult | { readonly state: 'not-found' };

/**
 * An external source of task execution truth.
 *
 * @remarks
 * The source owns execution state. The broker commits what a source reports — lifecycle, progress,
 * attention and details, ordered by the source's own comparator — and never sets external status
 * optimistically. Parent, responsibility, scopes, identity and the binding stay catalog-owned.
 *
 * Every method is host code the broker calls **outside** its repository writer; a throw is treated
 * as an unavailable source. Repository open never calls a source.
 *
 * `history`:
 * - `observed-state` — latest snapshots only. `observe` results commit directly, serialized per
 *   binding; transient events the source discarded are not recoverable.
 * - `source-replay` — an ordered durable feed through `reconcile`. **Only the feed commits
 *   projections**: `observe` results, push hints and command observations are hints that start a
 *   feed pass, and can never move a task past a revision the feed has not yet delivered.
 *
 * Use {@link ExternalTaskSource} to build one from typed callbacks.
 * @public
 */
export interface ITaskSource {
  /** The source id every binding it owns names as `sourceId`. */
  readonly id: string;
  /** What the source guarantees about history: `observed-state` or `source-replay`. */
  readonly history: SourceHistoryContract;
  /** Orders two revisions. Fails for a revision the source cannot interpret. */
  compare(a: ISourceRevision, b: ISourceRevision): Result<SourceRevisionOrder>;
  /** Reads one binding's latest state. */
  observe(binding: ISourceBinding): Promise<TaskResult<SourceRead>>;
  /** One page of the reconciliation listing or ordered feed, from `cursor`. */
  reconcile(cursor?: string): Promise<TaskResult<ISourceReconcilePage>>;
  /**
   * Sends one command. `request.operationId` is the command key a deduplicating source uses.
   * `expectedSourceRevision` is present for a conditional command.
   */
  dispatch(
    binding: ISourceBinding,
    request: ICommandRequest,
    expectedSourceRevision?: ISourceRevision
  ): Promise<TaskResult<SourceCommandResult>>;
  /** Asks what became of a task after a restart. */
  recover(binding: ISourceBinding): Promise<TaskResult<RecoveryResult>>;
  /** Optional: resolves an uncertain command by its key. Never a model tool. */
  lookupCommand?(binding: ISourceBinding, request: ICommandRequest): Promise<TaskResult<SourceCommandLookup>>;
}

/**
 * What applying one source observation to one task did.
 *
 * @remarks
 * - `applied` — a newer projection committed; the task's revision advanced.
 * - `refreshed` — the same revision and projection, observed later: freshness only, no revision,
 *   no update.
 * - `health-changed` — observation health changed (an outage began or ended); lifecycle untouched.
 * - `unchanged` — nothing to do.
 * - `stale` — older than what is committed; ignored.
 * - `incomparable` — a different source epoch; ignored until explicit recovery.
 * - `deferred` — a hint for a `source-replay` source; the feed decides.
 * - `contract-violation` — the same revision with a different projection, a reopened terminal task,
 *   or a declared finite envelope exceeded. Nothing is committed.
 * - `capacity-blocked` — ordinary admission refused the growth; nothing is committed, and a pass
 *   stops there without moving its cursor.
 * - `unknown-binding` — no retained task holds this binding. Discovery needs a host catalog mapper;
 *   nothing is created.
 * - `source-unavailable` / `missing` — the read did not produce a projection.
 * @public
 */
export type SourceObservationOutcome =
  | 'applied'
  | 'refreshed'
  | 'health-changed'
  | 'unchanged'
  | 'stale'
  | 'incomparable'
  | 'deferred'
  | 'contract-violation'
  | 'capacity-blocked'
  | 'unknown-binding'
  | 'source-unavailable'
  | 'missing';

/**
 * One observation's outcome in a report.
 * @public
 */
export interface ISourceObservationReport {
  readonly binding: ISourceBinding;
  readonly taskId?: TaskId;
  readonly outcome: SourceObservationOutcome;
  /** The task revision after this observation, when a task was found. */
  readonly revision?: TaskRevision;
  readonly message?: string;
}

/**
 * Why a reconciliation pass stopped before the source said it was caught up.
 * @public
 */
export type SourceReconcileStop =
  | 'page-limit'
  /**
   * A `source-replay` feed carried a revision for a binding no task holds: that revision is a required
   * event nothing has committed, so the cursor may not pass it (design § 8.6). Register the binding —
   * the next pass re-reads the page and applies it — before the source emits for it. (T8.)
   */
  | 'unregistered-binding'
  | 'gap'
  | 'order'
  | 'contract-violation'
  | 'capacity-blocked'
  | 'source-unavailable'
  | 'storage';

/**
 * What one reconciliation pass did.
 *
 * @remarks
 * `complete` is true only when the pass reached the end of an `all-bindings` listing with no gap,
 * no stop and no page that claimed less. `cursor` is the committed position after the pass — it
 * moves only past pages whose every observation committed.
 * @public
 */
export interface ISourceReconcileReport {
  readonly sourceId: string;
  readonly pages: number;
  readonly cursor?: string;
  readonly complete: boolean;
  readonly stopped?: SourceReconcileStop;
  readonly observations: ReadonlyArray<ISourceObservationReport>;
  readonly issues: ReadonlyArray<string>;
}

/**
 * A request to reconcile one source.
 * @public
 */
export interface ISourceReconcileRequest {
  readonly sourceId: string;
  /** Pages to read before stopping; default 16. */
  readonly maxPages?: number;
}

/**
 * What an explicit recovery of one task did.
 *
 * @remarks
 * `reattached`/`completed`/`unrecoverable` apply the source's projection (and may establish a new
 * source epoch as the baseline — the one place an incomparable revision is accepted).
 * `resumable` returns the source's reference for host approval and changes nothing. `unavailable`
 * and `unresolved` change nothing but observation health.
 * @public
 */
export interface ITaskRecoveryOutcome {
  readonly taskId: TaskId;
  readonly result: RecoveryResult['state'];
  readonly observation?: ISourceObservationReport;
  /** The source's reference, for `resumable`. */
  readonly resumable?: RecoveryResult & { readonly state: 'resumable' };
  readonly reason?: string;
}

/**
 * A page request for the uncertain-command pump.
 * @public
 */
export interface ICommandResolutionRequest {
  readonly limit: number;
}

/**
 * What the pump did with one unsettled command.
 *
 * @remarks
 * - `dispatched` — an intent that had never been sent was sent (after re-authorization).
 * - `resolved` — a lookup or a deduplicated resend settled it.
 * - `held` — outcome unknown and a resend is not safe (no source-key idempotency, or the key
 *   expired); left for source or host resolution.
 * - `denied` — the pump's principal may not run it; left as it is.
 * - `unavailable` — the source could not be reached; left as it is.
 * @public
 */
export interface ICommandResolution {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly action: 'dispatched' | 'resolved' | 'held' | 'denied' | 'unavailable';
  readonly result?: CommandState;
}

/**
 * One pump pass.
 * @public
 */
export interface ICommandResolutionReport {
  readonly resolutions: ReadonlyArray<ICommandResolution>;
}
