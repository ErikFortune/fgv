/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree, JsonValue } from '@fgv/ts-json-base';
import { Result } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import {
  IDueTaskQuery,
  IListCompletionCandidateQuery,
  ITaskChildState,
  IOwedUpdatePage,
  IOwedUpdateQuery,
  ISourceBinding,
  ITaskPage,
  ITaskQuery,
  ITaskCapacityProfile,
  ITaskCapacityStatus,
  ITaskAcknowledgementCommit,
  ITaskCheckpointStore,
  ITaskCommitRecord,
  ITaskConsumerRecord,
  ITaskEnvelope,
  ITaskEnvironment,
  ITaskReceiptAbandonment,
  ITaskDispositionResult,
  ITaskObligationDisposal,
  ITaskSubscriptionClosure,
  ITaskReceiptAcknowledgement,
  ITaskReceiptIssue,
  ITaskSubscription,
  ITaskSubscriptionRegistration,
  SubscriptionId,
  UpdateCategory,
  ITaskKindRegistry,
  ITaskRecordDraft,
  ITaskRecoveryReport,
  ISourceReplayEnvelope,
  ITaskSourceRecord,
  OperationId,
  SourceHistoryContract,
  TaskId,
  TaskRegistrationResult,
  TaskResult,
  TaskRevision
} from '../types';

/**
 * How durable a repository's commits are.
 *
 * @remarks
 * `'session'` is atomic visibility within the running process and nothing more. The durable
 * mode names the one guarantee this release can qualify — `'process-crash'` — and a root
 * that cannot honor it refuses construction rather than silently becoming a session
 * repository. There is no OS-crash or power-loss mode: a request for one fails before any
 * I/O (decision A1).
 * @public
 */
export type TaskRepositoryMode = 'session' | { readonly durable: 'process-crash' };

/**
 * Parameters shared by {@link FileTreeTaskRepository.initialize} and
 * {@link FileTreeTaskRepository.open}.
 * @public
 */
export interface ITaskRepositoryOpenParams {
  /**
   * The repository root: a directory the host provisioned and owns exclusively. Every record
   * lives directly in it. The storage packlet never sees a native path.
   */
  readonly root: FileTree.FileTreeItem;
  readonly mode: TaskRepositoryMode;
  readonly environment: ITaskEnvironment;
  /** The kind registry. Frozen by open, so a kind cannot appear under committed data. */
  readonly registry: ITaskKindRegistry;
  /** Converters to validate with. Defaults to the default field bounds. */
  readonly converters?: TaskConverters;
  /**
   * The capacity profile the host expects. On `open` it must equal the stored profile
   * exactly — a lower, higher or otherwise different configuration fails without touching
   * the stored one. Raising limits is the explicit {@link ITaskRepositoryWriter.raiseCapacityLimits}.
   * Omitted, the stored profile governs. On `initialize` it defaults to
   * `defaultTaskCapacityProfile`.
   */
  readonly profile?: ITaskCapacityProfile;
  /**
   * The optional shared parsed-record cache. Disabled when omitted — the default, because every
   * held record is resident memory a host did not ask for. At most 32 entries and 8 MiB of
   * encoded charge.
   */
  readonly recordCache?: ITaskRecordCacheOptions;
  /**
   * Where subscription records are persisted. Defaults to the repository's own root. A
   * `process-crash` repository refuses a `session` store: a weaker checkpoint cannot be paired with
   * durable task state. Everything the store returns is validated; see `ITaskCheckpointStore`.
   */
  readonly checkpoints?: ITaskCheckpointStore;
}

/**
 * Parsed-record cache limits.
 *
 * @remarks
 * One cache per repository, shared by every record read — never one per task, subscription or
 * source. An entry is valid only for the record revision and exact text it was read at. With a
 * cache, a read that hits it does not re-read the file, so out-of-band damage to a cached record
 * is detected at its next uncached read rather than at this one.
 * @public
 */
export interface ITaskRecordCacheOptions {
  /** At most 32. */
  readonly maxEntries: number;
  /** Encoded bytes charged for held records. At most 8 MiB. */
  readonly maxEncodedBytes: number;
}

/**
 * The first write of a task: its identity, the operation that creates it and the canonical
 * creation request that operation carried.
 *
 * @remarks
 * `request` is what makes a retry recognizable. A retry with the same task ID, operation ID
 * and canonically equal request is the same registration — it resumes a pending one, or
 * replays a live one, with neither a second charge nor an early release. The same identity
 * with a different request is refused as a `conflict`.
 *
 * `record` must carry exactly one catalog operation with `operationId`, of type
 * `create-tracked`, `create-list` or `register-external` (the last for an unresolved record),
 * whose stored request equals `request`.
 * @public
 */
export interface ITaskRegistrationRequest {
  readonly taskId: TaskId;
  readonly operationId: OperationId;
  readonly request: JsonValue;
  readonly record: ITaskRecordDraft;
  /**
   * A `source-replay` registration's finite remaining envelope. Storage reserves it as an
   * `admitted-source-replay` claim alongside the closeout (design § 8.6); the source must be the
   * record's own binding's. Part of the registration: a retry must offer the same one.
   */
  readonly sourceReplay?: { readonly sourceId: string; readonly envelope: ISourceReplayEnvelope };
}

/**
 * The common part of a replacement of one task record.
 * @public
 */
export interface ITaskCommitRequestBase {
  readonly taskId: TaskId;
  /** The task's current semantic revision (an unresolved record's reference revision). */
  readonly expectedRevision: TaskRevision;
  /** The record's current storage revision. */
  readonly expectedRecordRevision: number;
  readonly record: ITaskRecordDraft;
}

/**
 * A replacement of one task record, discriminated on what makes it an accepted mutation.
 *
 * @remarks
 * - `operation` — a command or catalog operation. `record` must add exactly the stored
 *   operation `operationId`. Replaying an operation already in the record returns the
 *   committed record without a second application.
 * - `observation` — a source projection. Its dedup evidence is `sourceRevision`, which must
 *   be present and differ from the record's current one. It adds no operation.
 * - `maintenance` — receipt evolution, observation telemetry or update pruning. It changes no
 *   semantic revision and adds no operation.
 *
 * Every replacement retains all existing operation evidence, advances the record revision by
 * exactly one, and is refused on a stale expected revision of either kind.
 * @public
 */
export type ITaskCommitRequest =
  | (ITaskCommitRequestBase & { readonly purpose: 'operation'; readonly operationId: OperationId })
  | (ITaskCommitRequestBase & {
      readonly purpose: 'observation';
      /**
       * Required updates this observation delivers from a `source-replay` feed. Spent from the
       * task's replay envelope; an observation that would overdraw it is refused as `source-gap` —
       * the source broke its declared finite contract. Ignored for a task that holds no envelope.
       */
      readonly requiredUpdates?: number;
    })
  | (ITaskCommitRequestBase & { readonly purpose: 'maintenance' });

/**
 * A replacement of one broker source-checkpoint record.
 *
 * @remarks
 * `expectedRecordRevision` is `0` to create the record. A cursor is committed only after every
 * observation of the page it follows has committed; the repository cannot check that ordering —
 * it is the caller's — but it does refuse a stale revision, so two passes cannot interleave.
 * @public
 */
export interface ITaskSourceCommitRequest {
  /** The source whose checkpoint record this writes. */
  readonly sourceId: string;
  /** The source's history contract; it must match the record's once written. */
  readonly history: SourceHistoryContract;
  /** The record revision this commit replaces (`0` creates the record). */
  readonly expectedRecordRevision: number;
  /** The source cursor the next pass resumes from; absent starts the next pass from the beginning. */
  readonly cursor?: string;
  /** The running count of pages committed against this source, as of this commit. */
  readonly pages: number;
}

/**
 * The exclusive, lifetime-bound writer a {@link ITaskRepository.withWriter} callback receives.
 *
 * @remarks
 * Every method commits through the FileTree atomic boundary before it succeeds. Nothing here
 * is a transaction: a replacement that succeeded stays committed if a later step fails. Using
 * a handle after its callback has returned fails.
 * @public
 */
export interface ITaskRepositoryWriter {
  /** Reads a task's committed record, including one whose kind is not registered. */
  readCommit(id: TaskId): Promise<TaskResult<ITaskCommitRecord | undefined>>;
  /** Registers a task through the ordered inventory protocol. */
  register(request: ITaskRegistrationRequest): Promise<TaskResult<ITaskCommitRecord>>;
  /** Atomically replaces one task record: state, owed updates and dedup evidence together. */
  commit(request: ITaskCommitRequest): Promise<TaskResult<ITaskCommitRecord>>;
  /** Reads a source's committed checkpoint record, if it has one. */
  readSource(sourceId: string): Promise<TaskResult<ITaskSourceRecord | undefined>>;
  /**
   * Creates or replaces a source's checkpoint record. Creation charges one `sources` identity,
   * retained for the repository's lifetime.
   */
  commitSource(request: ITaskSourceCommitRequest): Promise<TaskResult<ITaskSourceRecord>>;
  /**
   * Extends a task's `source-replay` envelope. New admission: the added updates and bytes are
   * charged against ordinary headroom now, before the producer relies on them, and refused with
   * `backpressure` when they do not fit. Fails for a task that holds no open envelope. Returns the
   * envelope the task now holds.
   */
  extendReplayEnvelope(
    taskId: TaskId,
    add: ISourceReplayEnvelope
  ): Promise<TaskResult<ISourceReplayEnvelope>>;
  /**
   * Raises the stored capacity limits. Every limit and bound must be at least its stored
   * value — lowering in place is unsupported. The policy is replaced atomically; no record is
   * migrated and nothing is reinterpreted.
   */
  raiseCapacityLimits(profile: ITaskCapacityProfile): Promise<TaskResult<ITaskCapacityProfile>>;
  /**
   * Registers a subscription through the ordered inventory protocol — pending entry holding its
   * activation reservation, record through the checkpoint store, live entry — and activates it: from
   * the next commit, it is in the audience of every update its selection matches. (T7.)
   *
   * @remarks
   * Refused before anything is written when it would take any task's potential audience past
   * `maxAudiencePerUpdate`, when it promises `source-replay` over an external task admitted without a
   * finite envelope, when its policy is more durable than the repository, or when its baseline is not
   * the committed state of tasks its selection matches. A retry with the same identity resumes or
   * replays; anything else under the subscription id conflicts.
   */
  registerSubscription(request: ITaskSubscriptionRegistration): Promise<TaskResult<ITaskConsumerRecord>>;
  /** Reads a live subscription's record through the checkpoint store, checked against what was committed. */
  readSubscription(subscriptionId: SubscriptionId): Promise<TaskResult<ITaskConsumerRecord | undefined>>;
  /**
   * Issues one exact receipt manifest into a subscription's record. Every update id it names must be
   * owed to the subscription or already acknowledged by it. Expired manifests are evicted in the same
   * write; at most `maxOutstandingReceiptsPerSubscription` unexpired ones are held.
   */
  issueReceipt(request: ITaskReceiptIssue): Promise<TaskResult<ITaskConsumerRecord>>;
  /**
   * Acknowledges exactly one unexpired issued manifest: its update ids, and no others, join the
   * subscription's history. A manifest already acknowledged replays without a write.
   */
  acknowledgeReceipt(request: ITaskReceiptAcknowledgement): Promise<TaskResult<ITaskAcknowledgementCommit>>;
  /** Removes one issued manifest. What it named stays owed; history it produced stays. */
  abandonReceipt(request: ITaskReceiptAbandonment): Promise<TaskResult<ITaskConsumerRecord>>;
  /**
   * Ends obligations of one subscription without acknowledging them: each id joins its `disposed`
   * history with the reason, discharging it for that subscription alone. (T8.)
   *
   * @remarks
   * Every id must be owed to the subscription now, or already in its history (reported in
   * `alreadyDischarged`). An id an unacknowledged issued manifest names is refused (`conflict`) —
   * acknowledge or abandon that receipt first. Converts the reservation each obligation already holds;
   * it needs no new capacity.
   */
  disposeObligations(request: ITaskObligationDisposal): Promise<TaskResult<ITaskDispositionResult>>;
  /**
   * Closes a subscription: it joins no audience again and releases its delivery units; `retain`
   * keeps its owed obligations owed and drainable, `dispose` abandons its unacknowledged manifests and
   * disposes everything it is owed, in one write. Its record, identity slot and history are retained.
   * (T8.)
   */
  closeSubscription(request: ITaskSubscriptionClosure): Promise<TaskResult<ITaskConsumerRecord>>;
  /**
   * Prunes every update of one task whose audience has discharged it, by each audience member's
   * durable checkpoint, in one maintenance replacement; returns the record unchanged when nothing
   * qualifies. A checkpoint that cannot be read or verified fences and refuses. (T8.)
   */
  pruneTask(taskId: TaskId): Promise<TaskResult<ITaskCommitRecord>>;
}

/**
 * Health of a repository's committed view.
 *
 * @remarks
 * `unavailable` means the repository is fenced: a write's outcome is unknown, a record no
 * longer agrees with what was committed, or an index update failed after its record committed.
 * Every further operation fails until the host rebuilds the indexes
 * ({@link ITaskRepository.rebuildIndexes}) or closes and reopens — both re-read what is actually
 * on disk. `rebuilding` is the window in which a rebuild has released the old index and not yet
 * published the new one; queries are fenced throughout it. `generation` advances on every
 * committed change and on every rebuild.
 * @public
 */
export interface ITaskRepositoryHealth {
  readonly state: 'ready' | 'rebuilding' | 'unavailable' | 'closed';
  readonly generation: number;
  readonly issues: ReadonlyArray<string>;
}

/**
 * A writable repository over one root.
 * @public
 */
export interface ITaskRepository {
  readonly repositoryId: string;
  readonly mode: TaskRepositoryMode;
  /** The stored capacity profile governing admission. */
  readonly profile: ITaskCapacityProfile;
  /** The frozen kind registry the repository validates details and command schemas with. */
  readonly registry: ITaskKindRegistry;
  /** What open found and did. */
  readonly report: ITaskRecoveryReport;
  /**
   * Reads a live task. `undefined` when the inventory does not name it as live — including a
   * registration still pending. Fails `unknown-kind-version` for a quarantined record.
   */
  read(id: TaskId): Promise<TaskResult<TaskRegistrationResult | undefined>>;
  /** Reads a live task's committed record. */
  readCommit(id: TaskId): Promise<TaskResult<ITaskCommitRecord | undefined>>;
  /**
   * Runs `action` with the exclusive writer. Fails without calling `action` when a writer is
   * already active — nesting is rejected, and a concurrent caller retries.
   */
  withWriter<T>(action: (writer: ITaskRepositoryWriter) => Promise<TaskResult<T>>): Promise<TaskResult<T>>;
  /**
   * One page of non-archived tasks matching a selection, ordered by task id.
   *
   * @remarks
   * Answered from resident indexes: a warm query reads no task record. Scopes are a union,
   * deduplicated before paging; unresolved references that match are returned separately and
   * make the page `partial`. The cursor is valid only at the page's generation — any committed
   * change restarts paging (`cursor-stale`), and a cursor presented with a different query is
   * `invalid`. This is a trusted host API, not an authorization boundary.
   */
  query(request: ITaskQuery): Promise<TaskResult<ITaskPage>>;
  /**
   * One page of due candidates: waiting tasks whose `notBefore` is present and at or before the
   * cutoff, ordered by `(notBefore, taskId)`. Never starts or changes a task.
   */
  queryDue(request: IDueTaskQuery): Promise<TaskResult<ITaskPage>>;
  /**
   * One page of the updates a subscription is owed, including terminal and archived tasks'
   * obligations. Reads no task record and no lifecycle index.
   */
  listOwed(request: IOwedUpdateQuery): Promise<TaskResult<IOwedUpdatePage>>;
  /**
   * The retained task — archived included — bound to a source binding, if any. A binding is
   * bound to at most one retained task.
   */
  lookupSource(binding: ISourceBinding): Promise<TaskResult<TaskId | undefined>>;
  /**
   * Every retained child of a live task, from the resident graph: archived, unresolved and
   * quarantined children included, ordered by id. Reads no record.
   *
   * @remarks
   * The authoritative child set, never a filtered tree — list completion and relationship rules
   * are decided from it. Fails `not-found-or-denied` when `parentId` is not a live task. A trusted
   * host API: it is not an authorization boundary and says nothing about who may see a child.
   */
  childStates(parentId: TaskId): Promise<TaskResult<ReadonlyArray<ITaskChildState>>>;
  /**
   * List-completion candidates, ordered by id: open task lists that complete automatically, have
   * at least one child, and whose every child — archived ones included — has succeeded.
   *
   * @remarks
   * Maintained by every commit and rebuilt from the records at open and by
   * {@link ITaskRepository.rebuildIndexes}, so a crash between a last child's success and its
   * list's completion leaves a discoverable candidate. A candidate is a hint, not a decision: the
   * completing writer rechecks it.
   */
  listCompletionCandidates(
    request: IListCompletionCandidateQuery
  ): Promise<TaskResult<ReadonlyArray<TaskId>>>;
  /**
   * Tasks holding an external command whose dispatch is not settled — an intent never sent, or a
   * send whose outcome is unknown — ordered by id. Answered from the resident index, rebuilt from
   * the records at open, so a crash between marker and result leaves a discoverable command.
   */
  unsettledCommands(request: IListCompletionCandidateQuery): Promise<TaskResult<ReadonlyArray<TaskId>>>;
  /**
   * Tasks retaining an update every audience member has discharged, by the committed checkpoints —
   * the cleanup candidates — ordered by id. A hint: pruning re-verifies the durable evidence. (T8.)
   */
  prunableTasks(request: IListCompletionCandidateQuery): Promise<TaskResult<ReadonlyArray<TaskId>>>;
  /** A source's committed checkpoint record, if it has one. Reads no task record. */
  readSource(sourceId: string): Promise<TaskResult<ITaskSourceRecord | undefined>>;
  /**
   * The subscriptions an update of `category` is owed to at a commit from `before` to `after`: every
   * active subscription taking the category whose selection matches either. Every commit's new
   * updates must name exactly this audience. (T7.)
   */
  audience(
    before: ITaskEnvelope | undefined,
    after: ITaskEnvelope,
    category: UpdateCategory
  ): ReadonlyArray<SubscriptionId>;
  /** A live subscription's resident descriptor — never its history. */
  subscription(subscriptionId: SubscriptionId): TaskResult<ITaskSubscription | undefined>;
  /**
   * Discards the resident indexes and rebuilds them from the committed records, in bounded
   * sequential passes.
   *
   * @remarks
   * The way out of a fence. The old index and every cursor are released before the new
   * generation is built; queries are fenced while it runs. A root that no longer validates leaves
   * the repository `unavailable` with the problems listed — it never becomes healthy and empty.
   * Refused (`conflict`, `retry: 'safe'`) while a writer is active.
   */
  rebuildIndexes(): Promise<TaskResult<ITaskRepositoryHealth>>;
  /** Trusted host capacity status. Never for a model-facing tool. */
  capacityStatus(): TaskResult<ITaskCapacityStatus>;
  health(): ITaskRepositoryHealth;
  /**
   * Releases the root. Every later call fails. Refused (`conflict`, `retry: 'safe'`) while a
   * `withWriter` callback is active: the root is not released under a writer.
   */
  close(): Result<boolean>;
}

/**
 * A read-only diagnostic handle for a repository that could not open healthily.
 *
 * @remarks
 * It holds the root exclusively (so nothing else writes while a host inspects) and never
 * writes: no record is repaired, rewritten or deleted. An administrator restores or
 * dispositions damaged data outside the broker path, then reopens.
 * @public
 */
export interface ITaskRecoveryHandle {
  readonly report: ITaskRecoveryReport;
  /** Reads one record's raw text, for inspection. */
  readRaw(name: string): Result<string>;
  close(): Result<boolean>;
}

/**
 * The outcome of opening a repository that exists.
 * @public
 */
export type TaskRepositoryOpenResult =
  | { readonly state: 'ready'; readonly repository: ITaskRepository }
  | { readonly state: 'recovery-required'; readonly recovery: ITaskRecoveryHandle };
