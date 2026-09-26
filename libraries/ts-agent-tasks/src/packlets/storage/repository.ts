/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import {
  Converter,
  Converters,
  Result,
  captureAsyncResult,
  captureResult,
  fail,
  succeed
} from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import {
  IDueTaskQuery,
  IListCompletionCandidateQuery,
  IOwedUpdatePage,
  ITaskChildState,
  IOwedUpdateQuery,
  IPendingInventoryEntry,
  ISourceBinding,
  ITaskPage,
  ITaskQuery,
  ITaskSummary,
  ITaskUpdate,
  PageCursor,
  defaultTaskPageLimit,
  ITaskCapacityClaim,
  ITaskCapacityProfile,
  ITaskCapacityStatus,
  ITaskCommitRecord,
  ITaskEnvironment,
  ITaskInventoryEntry,
  ITaskKindRegistry,
  ITaskRecordDraft,
  IStoredCatalogOperation,
  ITaskRecoveryReport,
  ITaskRepositoryManifest,
  ITaskSnapshot,
  ISourceReplayEnvelope,
  ITaskSourceRecord,
  ITaskEnvelope,
  ITaskReceiptAbandonment,
  ITaskReceiptAcknowledgement,
  ITaskReceiptIssue,
  ITaskSubscription,
  ITaskSubscriptionRegistration,
  OperationId,
  SubscriptionId,
  TaskId,
  TaskRegistrationResult,
  TaskResult,
  UpdateCategory,
  isTerminalTaskStatus
} from '../types';
import {
  ISourceReplayAdmission,
  mintRegistrationClaims,
  replayCharges,
  spendClaim,
  withOwnership
} from './claims';
import {
  checkBounds,
  checkCommandEvolution,
  checkIdentity,
  checkOperations,
  checkPurpose,
  checkSourceIdentity,
  checkRegistrationDraft,
  firstRecordType,
  IRegistrationIdentity,
  pendingIdentity,
  registrationIdentity,
  checkUpdates,
  idOf,
  revisionOf,
  sameOperation,
  updatesOf
} from './commitRules';
import { classify, ok, propagate, taskFailure } from './failures';
import {
  canonicallyEqual,
  encodeValidated,
  fingerprintOf,
  IEncodedRecord,
  manifestName,
  parseJson,
  recordName,
  utf8Length
} from './layout';
import { CapacityLedger, DimensionAmounts, ILedgerEntry, zeroAmounts } from './ledger';
import {
  ITaskCommitRequest,
  ITaskRegistrationRequest,
  ITaskSourceCommitRequest,
  ITaskRepository,
  ITaskRepositoryHealth,
  ITaskRepositoryOpenParams,
  ITaskRepositoryWriter,
  TaskRepositoryMode,
  TaskRepositoryOpenResult
} from './model';
import {
  IRepositoryState,
  IScanEvidence,
  ISourceRecordState,
  indexContentOf,
  initializeRepository,
  openRepository,
  scanRoot
} from './openRepository';
import {
  INormalizedSelection,
  IPageEvaluation,
  evaluateDue,
  evaluateOwed,
  evaluateTasks,
  normalizeSelection
} from './queries';
import { IVisitCounter } from './sortedKeys';
import { TaskIndex } from './taskIndex';
import { CursorTable, ICachedRecord, MaterializationGate, RecordCache } from './workingSet';
import {
  ITaskProjection,
  isTerminalRecord,
  ledgerEntry,
  manifestEntry,
  pendingEntry,
  projectRecord,
  taskKey,
  recordLimitFor,
  taskRecordLimit,
  taskUsage
} from './projection';
import {
  extendReplayClaims,
  mintSettlements,
  replayAdmission,
  spendExecutionClaims
} from './executionClaims';
import { RecordStore } from './recordStore';
import { SourceRecords } from './sourceRecords';
import { CheckpointPort } from './checkpoints';
import { ISubscriptionHost, SubscriptionRecords } from './consumerRecords';
import { DeliveryBook, ITaskDeliveryPlan, newLinks } from './deliveryBook';
import { subscriptionKey } from './subscriptions';
import { registerInspector } from './internals';
import { IRootOwnership } from './rootOwnership';

/** The validated purpose of a commit, and the operation it records when there is one. */
interface ICommitKind {
  readonly purpose: ITaskCommitRequest['purpose'];
  readonly operationId?: OperationId;
}

interface IReadRecord {
  readonly record: ITaskCommitRecord;
  readonly encoded: IEncodedRecord;
}

interface IWriterHandle {
  active: boolean;
}

/**
 * The FileTree task repository: one implementation over any root that offers the FileTree
 * atomic-write capability.
 *
 * @remarks
 * A single writer per root. Each task's state, owed updates and operation dedup evidence live
 * in one record and are replaced together through one atomic write; nothing is acknowledged
 * before that write has crossed the FileTree boundary at the repository's guarantee.
 * Registration uses the ordered inventory protocol — pending entry, then record, then live
 * entry — so a missing accepted record is always detectable and a pending one always
 * recoverable. See the `storage` section of the package's `CAPABILITIES.md` for what each
 * guarantee rests on.
 * @public
 */
export class FileTreeTaskRepository implements ITaskRepository {
  /** {@inheritDoc ITaskRepository.repositoryId} */
  public readonly repositoryId: string;
  /** {@inheritDoc ITaskRepository.mode} */
  public readonly mode: TaskRepositoryMode;

  private readonly _store: RecordStore;
  private readonly _ownership: IRootOwnership;
  private readonly _converters: TaskConverters;
  private readonly _registry: ITaskKindRegistry;
  private readonly _environment: ITaskEnvironment;
  private _tasks: Map<TaskId, ITaskProjection>;
  private _pending: Map<string, IPendingInventoryEntry>;
  private _sources: Map<string, ISourceRecordState>;
  private _ledger: CapacityLedger;
  /** The one live index generation; `undefined` only while a rebuild has released it. */
  private _index: TaskIndex | undefined;
  private _report: ITaskRecoveryReport;
  private _evidence: IScanEvidence;
  private readonly _gate: MaterializationGate;
  private readonly _cache: RecordCache;
  private readonly _cursors: CursorTable;
  private readonly _visits: IVisitCounter;
  private _manifest: ITaskRepositoryManifest;
  private _manifestFingerprint: string;
  /**
   * Validates a commit's purpose rather than trusting it: a commit that is none of the three
   * would pass every purpose-keyed check as if it were an unevidenced semantic change.
   */
  private readonly _commitKind: Converter<ICommitKind>;
  private _state: ITaskRepositoryHealth['state'];
  private _generation: number;
  private readonly _issues: string[];
  private _writer: IWriterHandle | undefined;
  /** Subscriptions and their potential audiences (T7). */
  private _book: DeliveryBook;
  private readonly _checkpoints: CheckpointPort;
  private readonly _defaultCheckpoints: boolean;
  private readonly _records: SubscriptionRecords;
  private readonly _sourceRecords: SourceRecords;

  private constructor(state: IRepositoryState) {
    this.repositoryId = state.manifest.repositoryId;
    this.mode = state.mode;
    this._report = state.report;
    this._index = state.index;
    this._evidence = state.evidence;
    this._gate = state.gate;
    this._cache = new RecordCache(state.recordCache);
    this._cursors = new CursorTable(state.environment, state.converters.ids.identifier);
    this._visits = { candidateVisits: 0 };
    registerInspector(this, () => ({
      reads: this._store.reads,
      visits: this._visits,
      gate: this._gate,
      index: this._index,
      projections: this._tasks,
      evidence: this._evidence,
      cursorHandles: this._cursors.size,
      cache: { entries: this._cache.size, charge: this._cache.charge },
      book: this._book,
      ledger: this._ledger
    }));
    this._store = state.store;
    this._ownership = state.ownership;
    this._converters = state.converters;
    this._registry = state.registry;
    this._environment = state.environment;
    this._tasks = state.tasks;
    this._pending = state.pending;
    this._sources = state.sources;
    this._ledger = state.ledger;
    this._manifest = state.manifest;
    this._manifestFingerprint = fingerprintOf(state.manifestText);
    this._commitKind = Converters.discriminatedObject<ICommitKind>('purpose', {
      operation: Converters.object<ICommitKind>({
        purpose: Converters.literal('operation'),
        operationId: state.converters.ids.operationId
      }),
      observation: Converters.object<ICommitKind>({ purpose: Converters.literal('observation') }),
      maintenance: Converters.object<ICommitKind>({ purpose: Converters.literal('maintenance') })
    });
    this._state = 'ready';
    this._generation = 0;
    this._issues = [];
    this._writer = undefined;
    this._book = state.book;
    this._checkpoints = state.checkpoints;
    this._defaultCheckpoints = state.defaultCheckpoints;
    this._records = new SubscriptionRecords(this._deliveryHost());
    this._sourceRecords = new SourceRecords({
      converters: this._converters,
      store: this._store,
      profile: () => this.profile,
      ledger: () => this._ledger,
      sources: () => this._sources,
      manifest: () => this._manifest,
      manifestEntry: (manifest) => this._deliveryHost().manifestEntry(manifest),
      writeManifest: (manifest) => this._deliveryHost().writeManifest(manifest, undefined),
      writeFile: (name, text) => this._writeFile(name, text, undefined),
      fence: (reason) => this._fence(reason)
    });
  }

  /**
   * Creates a new repository in an empty root.
   *
   * @remarks
   * The root must be empty apart from working files an interrupted atomic write left behind,
   * which are reclaimed first. A root holding anything else is refused: initialization never
   * adopts existing content. The capacity profile defaults to `defaultTaskCapacityProfile` and
   * is stored, so later host defaults cannot reinterpret it.
   */
  public static async initialize(params: ITaskRepositoryOpenParams): Promise<TaskResult<ITaskRepository>> {
    return initializeRepository(params, (state) => new FileTreeTaskRepository(state));
  }

  /**
   * Opens an existing repository.
   *
   * @remarks
   * Succeeds with `state: 'ready'` and a writable repository, or with
   * `state: 'recovery-required'` and a read-only diagnostic handle when validation finds a
   * blocking problem. Fails outright — writing nothing — when the root holds no repository,
   * cannot honor the requested mode, is already open in this process, or when the requested
   * capacity profile differs from the stored one. Never starts or reattaches external work.
   */
  public static async open(params: ITaskRepositoryOpenParams): Promise<TaskResult<TaskRepositoryOpenResult>> {
    return openRepository(params, (state) => new FileTreeTaskRepository(state));
  }

  /** {@inheritDoc ITaskRepository.profile} */
  public get profile(): ITaskCapacityProfile {
    return this._manifest.profile;
  }

  /** {@inheritDoc ITaskRepository.registry} */
  public get registry(): ITaskKindRegistry {
    return this._registry;
  }

  /** {@inheritDoc ITaskRepository.report} */
  public get report(): ITaskRecoveryReport {
    return this._report;
  }

  // ------------------------------------------------------------------------------------------
  // Reads
  // ------------------------------------------------------------------------------------------

  /** {@inheritDoc ITaskRepository.read} */
  public async read(id: TaskId): Promise<TaskResult<TaskRegistrationResult | undefined>> {
    return this._readCommitted(id).onSuccess((read) => {
      if (read === undefined) {
        return ok(undefined);
      }
      const record: ITaskCommitRecord = read.record;
      if (record.recordType === 'unresolved') {
        const reference = record.reference;
        // Quarantine applies to an unresolved record exactly as to a resolved one.
        return this._registry.has(reference.kind, reference.detailVersion)
          ? ok<TaskRegistrationResult | undefined>({ state: 'unresolved', reference })
          : taskFailure<TaskRegistrationResult | undefined>(
              `read ${id}: ${reference.kind}@${reference.detailVersion} is not registered; the record is quarantined`,
              'unknown-kind-version',
              'after-host-action'
            );
      }
      return this._registry
        .convert(record.task)
        .onSuccess((task: ITaskSnapshot) =>
          ok<TaskRegistrationResult | undefined>({ state: 'resolved', task, archived: record.archived })
        );
    });
  }

  /** {@inheritDoc ITaskRepository.readCommit} */
  public async readCommit(id: TaskId): Promise<TaskResult<ITaskCommitRecord | undefined>> {
    return this._readCommitted(id).onSuccess((read) => ok(read?.record));
  }

  /** {@inheritDoc ITaskRepository.capacityStatus} */
  public capacityStatus(): TaskResult<ITaskCapacityStatus> {
    return this._usable().onSuccess(() => {
      const { state, dimensions } = this._ledger.status();
      return classify(
        this._converters.capacity.status.convert({ profileVersion: 1, state, dimensions }),
        'storage-corrupt',
        'after-host-action'
      );
    });
  }

  // ------------------------------------------------------------------------------------------
  // Queries — answered from the resident index, never from records
  // ------------------------------------------------------------------------------------------

  /** {@inheritDoc ITaskRepository.query} */
  public async query(request: ITaskQuery): Promise<TaskResult<ITaskPage>> {
    return this._queryable().onSuccess((index) =>
      this._convertQuery(this._converters.queries.query, request).onSuccess((query) => {
        const selection: INormalizedSelection = normalizeSelection(query.selection);
        return this._page({ type: 'tasks', selection }, query, (after, limit) =>
          evaluateTasks(index, selection, limit, after, this._visits)
        );
      })
    );
  }

  /** {@inheritDoc ITaskRepository.queryDue} */
  public async queryDue(request: IDueTaskQuery): Promise<TaskResult<ITaskPage>> {
    return this._queryable().onSuccess((index) =>
      this._convertQuery(this._converters.queries.dueQuery, request).onSuccess((query) => {
        const selection: INormalizedSelection = normalizeSelection(query.selection);
        return this._page({ type: 'due', selection, cutoff: query.cutoff }, query, (after, limit) =>
          evaluateDue(index, selection, query.cutoff, limit, after, this._visits)
        );
      })
    );
  }

  /** {@inheritDoc ITaskRepository.listOwed} */
  public async listOwed(request: IOwedUpdateQuery): Promise<TaskResult<IOwedUpdatePage>> {
    return this._queryable().onSuccess((index) =>
      this._convertQuery(this._converters.queries.owedQuery, request).onSuccess((query) =>
        this._page({ type: 'owed', subscription: query.subscription }, query, (after, limit) =>
          evaluateOwed(index, query.subscription, limit, after, this._visits)
        ).onSuccess((page) =>
          ok<IOwedUpdatePage>({
            updates: page.items,
            ...(page.nextCursor !== undefined ? { nextCursor: page.nextCursor } : {}),
            generation: page.generation,
            completeness: 'complete'
          })
        )
      )
    );
  }

  /** {@inheritDoc ITaskRepository.lookupSource} */
  public async lookupSource(binding: ISourceBinding): Promise<TaskResult<TaskId | undefined>> {
    return this._queryable().onSuccess((index) =>
      classify(this._converters.values.sourceBinding.convert(binding), 'invalid', 'after-host-action')
        // The same bound every stored binding meets: a lookup never canonicalizes more than a
        // binding could ever be.
        .onSuccess((converted) => {
          const bound: Result<true> = checkSourceIdentity(converted, this.profile);
          return bound.isSuccess()
            ? classify(index.sourceOwner(converted), 'invalid', 'after-host-action')
            : taskFailure<TaskId | undefined>(
                `lookupSource: ${bound.message}`,
                'invalid',
                'after-host-action'
              );
        })
    );
  }

  /** {@inheritDoc ITaskRepository.childStates} */
  public async childStates(parentId: TaskId): Promise<TaskResult<ReadonlyArray<ITaskChildState>>> {
    return this._queryable().onSuccess((index) =>
      classify(this._converters.ids.taskId.convert(parentId), 'invalid', 'after-host-action').onSuccess(
        (id) => {
          if (!this._tasks.has(id)) {
            return taskFailure<ReadonlyArray<ITaskChildState>>(
              `childStates: ${id} is not a live task`,
              'not-found-or-denied',
              'after-host-action'
            );
          }
          const children: ReadonlyArray<TaskId> = Array.from(index.children.get(id) ?? []).sort();
          return ok(children.map((child) => this._childState(index, child)));
        }
      )
    );
  }

  /** One child's state, from its projection and index membership. */
  private _childState(index: TaskIndex, id: TaskId): ITaskChildState {
    // Every child in the adjacency is a live task with a projection: they are added together.
    const projection: ITaskProjection = this._tasks.get(id)!;
    const category = index.categoryOf(id);
    if (category === 'unresolved' || category === 'quarantined') {
      return { id, state: category, archived: projection.archived };
    }
    return { id, state: 'resolved', status: projection.status!, archived: projection.archived };
  }

  /** {@inheritDoc ITaskRepository.listCompletionCandidates} */
  public async listCompletionCandidates(
    request: IListCompletionCandidateQuery
  ): Promise<TaskResult<ReadonlyArray<TaskId>>> {
    return this._queryable().onSuccess((index) =>
      this._convertQuery(this._converters.broker.listCompletion, request).onSuccess((query) => {
        const keys: ReadonlyArray<string> = index.listCandidates.keys;
        const start: number = index.listCandidates.startAfter(query.after);
        // Every key in the set is a task id the index added under that brand.
        return ok(keys.slice(start, start + query.limit).map((key) => key as TaskId));
      })
    );
  }

  /** {@inheritDoc ITaskRepository.unsettledCommands} */
  public async unsettledCommands(
    request: IListCompletionCandidateQuery
  ): Promise<TaskResult<ReadonlyArray<TaskId>>> {
    return this._queryable().onSuccess((index) =>
      this._convertQuery(this._converters.broker.listCompletion, request).onSuccess((query) => {
        const keys: ReadonlyArray<string> = index.unsettledCommands.keys;
        const start: number = index.unsettledCommands.startAfter(query.after);
        // Every key in the set is a task id the index added under that brand.
        return ok(keys.slice(start, start + query.limit).map((key) => key as TaskId));
      })
    );
  }

  /** {@inheritDoc ITaskRepository.readSource} */
  public async readSource(sourceId: string): Promise<TaskResult<ITaskSourceRecord | undefined>> {
    return this._usable().onSuccess(() =>
      classify(this._converters.ids.sourceId.convert(sourceId), 'invalid', 'after-host-action').onSuccess(
        (id) => ok(this._sources.get(id)?.record)
      )
    );
  }

  /** {@inheritDoc ITaskRepository.audience} */
  public audience(
    before: ITaskEnvelope | undefined,
    after: ITaskEnvelope,
    category: UpdateCategory
  ): ReadonlyArray<SubscriptionId> {
    return this._book.audience(before, after, category);
  }

  /** {@inheritDoc ITaskRepository.subscription} */
  public subscription(subscriptionId: SubscriptionId): TaskResult<ITaskSubscription | undefined> {
    return this._usable().onSuccess(() =>
      classify(
        this._converters.ids.subscriptionId.convert(subscriptionId),
        'invalid',
        'after-host-action'
      ).onSuccess((id) => ok(this._book.subscriptions.get(id)?.descriptor))
    );
  }

  /** {@inheritDoc ITaskRepository.rebuildIndexes} */
  public async rebuildIndexes(): Promise<TaskResult<ITaskRepositoryHealth>> {
    if (this._state === 'closed') {
      return taskFailure('rebuildIndexes: closed', 'storage-unavailable', 'after-host-action');
    }
    if (this._writer !== undefined || this._state === 'rebuilding') {
      return taskFailure(
        'rebuildIndexes: a writer or another rebuild is active; retry after it returns',
        'conflict',
        'safe'
      );
    }
    // Release the old generation before building the new one: the two never coexist, and
    // nothing can answer from the old index while the new one is incomplete.
    this._state = 'rebuilding';
    this._index = undefined;
    this._tasks = new Map();
    this._pending = new Map();
    this._sources = new Map();
    this._book = new DeliveryBook(new Map(), new Map());
    this._cursors.clear();
    this._cache.clear();
    const scanned = this._store
      .cleanup()
      .onSuccess((removed) => this._store.list().onSuccess((names) => succeed({ removed, names })));
    const outcome = scanned.isFailure()
      ? taskFailure<never>(`rebuildIndexes: ${scanned.message}`, 'storage-unavailable', 'safe')
      : scanRoot({
          store: this._store,
          converters: this._converters,
          registry: this._registry,
          removed: scanned.value.removed,
          names: scanned.value.names,
          gate: this._gate,
          checkpoints: this._checkpoints,
          defaultCheckpoints: this._defaultCheckpoints
        });
    if (outcome.isFailure()) {
      this._state = 'unavailable';
      this._issues.push(`rebuild failed: ${outcome.message}`);
      return propagate(outcome);
    }
    if (outcome.value.state === 'blocked') {
      const report: ITaskRecoveryReport = outcome.value.report;
      const blocking: string[] = report.issues
        .filter((issue) => issue.severity === 'blocking')
        .map((issue) => issue.message);
      this._report = report;
      this._state = 'unavailable';
      this._issues.splice(0, this._issues.length, ...blocking.map((m) => `rebuild found: ${m}`));
      return taskFailure(
        `rebuildIndexes: the committed records do not validate (${blocking.join('; ')}); the repository ` +
          `stays unavailable — close it and open it for a recovery handle`,
        'storage-corrupt',
        'after-host-action'
      );
    }
    const fresh = outcome.value.scanned;
    this._manifest = fresh.manifest;
    this._manifestFingerprint = fingerprintOf(fresh.manifestText);
    this._tasks = fresh.tasks;
    this._pending = fresh.pending;
    this._sources = fresh.sources;
    this._ledger = fresh.ledger;
    this._index = fresh.index;
    this._book = fresh.book;
    this._report = fresh.report;
    this._evidence = fresh.evidence;
    this._issues.splice(0, this._issues.length);
    this._state = 'ready';
    this._generation++;
    return ok(this.health());
  }

  /** The live index, or why queries are fenced. */
  private _queryable(): TaskResult<TaskIndex> {
    return this._usable().onSuccess(() => ok(this._index!));
  }

  private _convertQuery<T>(converter: Converter<T>, request: unknown): TaskResult<T> {
    return classify(converter.convert(request), 'invalid', 'after-host-action').withErrorFormat(
      (message) => `query: ${message}`
    );
  }

  /**
   * Resolves a query's cursor, evaluates one page and issues the next cursor.
   *
   * @remarks
   * The descriptor — the normalized query, without its limit — is what a cursor is bound to,
   * and is bounded by the profile's `maxQueryDescriptorBytes` because a handle retains it.
   */
  private _page<TItem extends ITaskSummary | ITaskUpdate>(
    descriptor: Record<string, unknown>,
    query: { readonly limit?: number; readonly cursor?: PageCursor },
    evaluate: (after: string | undefined, limit: number) => IPageEvaluation<TItem>
  ): TaskResult<Omit<ITaskPage, 'items'> & { readonly items: ReadonlyArray<TItem> }> {
    // The descriptor is built from converted, normalized values in a fixed key order, so its
    // JSON text is already canonical for equality — and serializing it cannot fail.
    const text: string = JSON.stringify(descriptor);
    const bytes: number = utf8Length(text);
    const max: number = this.profile.encoded.maxQueryDescriptorBytes;
    if (bytes > max) {
      return taskFailure(
        `query: the normalized query is ${bytes} bytes, over the bound of ${max}`,
        'invalid',
        'after-host-action'
      );
    }
    const generation: number = this._generation;
    const position: TaskResult<string | undefined> =
      query.cursor === undefined
        ? ok(undefined)
        : this._cursors.resolve(query.cursor, text, generation).onSuccess((p) => ok(p.after));
    return position.onSuccess((after) => {
      const evaluated: IPageEvaluation<TItem> = evaluate(after, query.limit ?? defaultTaskPageLimit);
      const next: TaskResult<PageCursor | undefined> =
        evaluated.next === undefined
          ? ok(undefined)
          : this._cursors.issue({ descriptor: text, generation, after: evaluated.next });
      return next.onSuccess((nextCursor) => {
        const items = evaluated.items;
        const external: boolean =
          evaluated.unresolved.length > 0 ||
          items.some((item) => 'envelope' in item && item.envelope.binding !== undefined);
        return ok({
          items,
          unresolved: evaluated.unresolved,
          ...(nextCursor !== undefined ? { nextCursor } : {}),
          generation,
          completeness:
            evaluated.unresolved.length > 0 || evaluated.issues.length > 0 ? 'partial' : 'complete',
          freshness: external ? 'source-projection' : 'native-current',
          issues: evaluated.issues
        });
      });
    });
  }

  /**
   * Patches the index for a record that has just committed. The write is already durable, so a
   * failure here cannot be reported as "nothing happened": the repository fences and the
   * operation is reported indeterminate until the indexes are rebuilt from disk.
   */
  private _applyIndex(
    taskId: TaskId,
    record: ITaskCommitRecord,
    operationId: OperationId | undefined
  ): TaskResult<ITaskCommitRecord> {
    const index: TaskIndex = this._index!;
    const applied: Result<true> = captureResult(() =>
      index.put(taskId, indexContentOf(record, true)).onSuccess(() => {
        index.putOwed(taskId, updatesOf(record));
        return succeed<true>(true);
      })
    ).onSuccess((inner) => inner);
    if (applied.isSuccess()) {
      return ok(record);
    }
    const message: string = `task ${taskId}: committed, but the index update failed (${applied.message}); rebuild the indexes`;
    this._fence(message);
    return operationId !== undefined
      ? taskFailure(message, 'commit-indeterminate', 'reconcile-first', { operationId })
      : taskFailure(message, 'storage-unavailable', 'reconcile-first');
  }

  /** A source binding maps to exactly one retained task, archived ones included. */
  private _checkSource(taskId: TaskId, draft: ITaskRecordDraft, operationId: OperationId): TaskResult<true> {
    const binding: ISourceBinding | undefined =
      draft.recordType === 'resolved' ? draft.task.envelope.binding : draft.reference.binding;
    if (binding === undefined) {
      return ok(true);
    }
    return classify(this._index!.sourceHolder(binding, taskId), 'invalid', 'after-host-action').onSuccess(
      (holder) =>
        holder === undefined
          ? ok<true>(true)
          : taskFailure<true>(
              `register ${taskId}: source ${binding.sourceId} already binds this reference to task ${holder}`,
              'conflict',
              'after-host-action',
              { operationId }
            )
    );
  }

  /** {@inheritDoc ITaskRepository.health} */
  public health(): ITaskRepositoryHealth {
    return { state: this._state, generation: this._generation, issues: [...this._issues] };
  }

  /** {@inheritDoc ITaskRepository.close} */
  public close(): Result<boolean> {
    if (this._state === 'closed') {
      return ok(false);
    }
    // Releasing the root while a writer callback is between writes would let a second instance
    // open it and interleave commits with the first.
    if (this._writer !== undefined) {
      return taskFailure('close: a writer callback is active; close after it returns', 'conflict', 'safe');
    }
    // A rebuild is between reads of the root it holds; releasing it mid-scan would let the scan
    // publish a ready generation over a root this instance no longer owns.
    if (this._state === 'rebuilding') {
      return taskFailure('close: a rebuild is in progress; close after it returns', 'conflict', 'safe');
    }
    this._state = 'closed';
    this._writer = undefined;
    this._cursors.clear();
    this._cache.clear();
    this._ownership.release();
    return ok(true);
  }

  // ------------------------------------------------------------------------------------------
  // The writer
  // ------------------------------------------------------------------------------------------

  /** {@inheritDoc ITaskRepository.withWriter} */
  public async withWriter<T>(
    action: (writer: ITaskRepositoryWriter) => Promise<TaskResult<T>>
  ): Promise<TaskResult<T>> {
    const usable: TaskResult<true> = this._usable();
    if (usable.isFailure()) {
      return propagate(usable);
    }
    if (this._writer !== undefined) {
      return taskFailure(
        'withWriter: a writer is already active; nesting is rejected and a concurrent caller retries',
        'conflict',
        'safe'
      );
    }
    const handle: IWriterHandle = { active: true };
    this._writer = handle;
    const writer: ITaskRepositoryWriter = this._createWriter(handle);
    try {
      const outcome: Result<TaskResult<T>> = await captureAsyncResult(() => action(writer));
      if (outcome.isFailure()) {
        return taskFailure(
          `withWriter: the callback threw: ${outcome.message}`,
          'invalid',
          'after-host-action'
        );
      }
      return outcome.value;
    } finally {
      handle.active = false;
      if (this._writer === handle) {
        this._writer = undefined;
      }
    }
  }

  private _createWriter(handle: IWriterHandle): ITaskRepositoryWriter {
    const guard = (): TaskResult<true> =>
      handle.active && this._writer === handle
        ? this._usable()
        : taskFailure('writer: this handle is no longer active', 'invalid', 'after-host-action');
    return {
      readCommit: async (id: TaskId) =>
        guard().onSuccess(() => this._readCommitted(id, true).onSuccess((read) => ok(read?.record))),
      register: async (request: ITaskRegistrationRequest) => guard().onSuccess(() => this._register(request)),
      commit: async (request: ITaskCommitRequest) => guard().onSuccess(() => this._commit(request)),
      readSource: async (sourceId: string) =>
        guard().onSuccess(() =>
          classify(this._converters.ids.sourceId.convert(sourceId), 'invalid', 'after-host-action').onSuccess(
            (id) => ok(this._sources.get(id)?.record)
          )
        ),
      commitSource: async (request: ITaskSourceCommitRequest) =>
        guard().onSuccess(() => this._sourceRecords.commit(request)),
      extendReplayEnvelope: async (taskId: TaskId, add: ISourceReplayEnvelope) =>
        guard().onSuccess(() => this._extendReplay(taskId, add)),
      raiseCapacityLimits: async (profile: ITaskCapacityProfile) =>
        guard().onSuccess(() => this._raiseLimits(profile)),
      registerSubscription: async (request: ITaskSubscriptionRegistration) =>
        guard().onSuccess(() => this._records.register(request)),
      readSubscription: async (subscriptionId: SubscriptionId) =>
        guard().onSuccess(() => this._records.read(subscriptionId)),
      issueReceipt: async (request: ITaskReceiptIssue) =>
        guard().onSuccess(() => this._records.issue(request)),
      acknowledgeReceipt: async (request: ITaskReceiptAcknowledgement) =>
        guard().onSuccess(() => this._records.acknowledge(request)),
      abandonReceipt: async (request: ITaskReceiptAbandonment) =>
        guard().onSuccess(() => this._records.abandon(request))
    };
  }

  /** What the subscription-record operations may reach of this repository. */
  private _deliveryHost(): ISubscriptionHost {
    return {
      converters: this._converters,
      environment: this._environment,
      checkpoints: this._checkpoints,
      durability: this.mode === 'session' ? 'session' : 'process-crash',
      profile: () => this.profile,
      ledger: () => this._ledger,
      index: () => this._index!,
      tasks: () => this._tasks,
      book: () => this._book,
      manifest: () => this._manifest,
      manifestEntry: (manifest) =>
        this._encodeManifest(manifest).onSuccess((encoded) => ok(manifestEntry(encoded.bytes, this.profile))),
      writeManifest: (manifest, operationId) =>
        this._encodeManifest(manifest).onSuccess((encoded) =>
          this._writeFile(manifestName, encoded.text, operationId).onSuccess(() => {
            this._setManifest(manifest);
            return ok<true>(true);
          })
        ),
      fence: (reason) => this._fence(reason),
      committed: () => {
        this._generation++;
      }
    };
  }

  /** Applies a delivery plan whose record committed, and re-derives the entries it touched. */
  private _commitDelivery(plan: ITaskDeliveryPlan): void {
    this._book.commit(plan);
    const entries: Map<string, ILedgerEntry> = new Map();
    for (const id of plan.units.keys()) {
      entries.set(subscriptionKey(id), this._book.entry(id, this._index!, this.profile));
    }
    this._ledger.apply(entries);
  }

  /** Plans a commit's effect on subscriptions against the live index. */
  private _plan(
    taskId: TaskId,
    before: ITaskCommitRecord | undefined,
    next: ITaskCommitRecord,
    adopted: boolean = false
  ): TaskResult<ITaskDeliveryPlan> {
    return this._book.plan({ taskId, before, next, index: this._index!, profile: this.profile, adopted });
  }

  // ------------------------------------------------------------------------------------------
  // Registration — the ordered inventory protocol (design §8.3)
  // ------------------------------------------------------------------------------------------

  private _register(request: ITaskRegistrationRequest): TaskResult<ITaskCommitRecord> {
    const converters: TaskConverters = this._converters;
    const inputs: Result<{ taskId: TaskId; operationId: OperationId; draft: ITaskRecordDraft }> =
      converters.ids.taskId
        .convert(request.taskId)
        .onSuccess((taskId) =>
          converters.ids.operationId
            .convert(request.operationId)
            .onSuccess((operationId) =>
              converters.storage.draft
                .convert(request.record)
                .onSuccess((draft) => ok({ taskId, operationId, draft }))
            )
        );
    if (inputs.isFailure()) {
      return taskFailure(`register: ${inputs.message}`, 'invalid', 'after-host-action');
    }
    const { taskId, operationId, draft } = inputs.value;
    if (idOf(draft) !== taskId) {
      return taskFailure(
        `register ${taskId}: the record describes ${idOf(draft)}`,
        'invalid',
        'after-host-action'
      );
    }
    const replay: TaskResult<ISourceReplayAdmission | undefined> = this._replayAdmission(
      taskId,
      draft,
      request
    );
    if (replay.isFailure()) {
      return propagate(replay);
    }
    const shape: Result<IStoredCatalogOperation> = checkRegistrationDraft(
      draft,
      operationId,
      request.request
    );
    if (shape.isFailure()) {
      return taskFailure(`register ${taskId}: ${shape.message}`, 'invalid', 'after-host-action');
    }
    const identity: IRegistrationIdentity = registrationIdentity(draft, shape.value);

    // An identity already in the inventory is either this registration again — a lost-response
    // retry, which must neither charge twice nor release early — or a different one, refused.
    const live: ITaskProjection | undefined = this._tasks.get(taskId);
    if (live !== undefined) {
      // A replay rewrites the record to re-establish its flush boundary, and a quarantined
      // record is never rewritten.
      if (!live.known) {
        return taskFailure(
          `register ${taskId}: ${live.kind}@${live.detailVersion} is not registered; the record is quarantined`,
          'unknown-kind-version',
          'after-host-action',
          { operationId }
        );
      }
      return this._replayRegistration(taskId, operationId, identity);
    }
    const pending: IPendingInventoryEntry | undefined = this._pending.get(taskId);
    if (pending !== undefined) {
      if (!canonicallyEqual(pendingIdentity(pending), identity)) {
        return taskFailure(
          `register ${taskId}: a different registration of this id is pending`,
          'conflict',
          'after-host-action',
          { operationId }
        );
      }
    }

    return this._validateDraft(draft)
      .onSuccess((validated) => this._checkParent(taskId, validated).onSuccess(() => ok(validated)))
      .onSuccess((validated) =>
        this._checkSource(taskId, validated, operationId).onSuccess(() => ok(validated))
      )
      .onSuccess((validated) =>
        this._checkOperationCount(taskId, validated.operations.length, 2).onSuccess(() => ok(validated))
      )
      .onSuccess((validated) =>
        pending !== undefined
          ? this._resumeRegistration(taskId, operationId, validated, pending)
          : this._checkUnclaimedName(taskId, operationId).onSuccess(() =>
              this._newRegistration(taskId, identity, validated, replay.value)
            )
      );
  }

  /**
   * Validates a registration's `source-replay` envelope: an external registration of the source its
   * binding names, with a finite envelope the profile's update bound can carry.
   */
  private _replayAdmission(
    taskId: TaskId,
    draft: ITaskRecordDraft,
    request: ITaskRegistrationRequest
  ): TaskResult<ISourceReplayAdmission | undefined> {
    if (request.sourceReplay === undefined) {
      return ok(undefined);
    }
    return classify(
      replayAdmission(draft, request.sourceReplay, this._converters, this.profile),
      'invalid',
      'after-host-action'
    ).withErrorFormat((message) => `register ${taskId}: ${message}`);
  }

  /**
   * A new identity's record name must be free on disk, not only in the inventory. Open keeps a
   * record-shaped file the inventory does not name as unexpected data and never touches it, so
   * registering over it would overwrite exactly what open promised to leave alone. The root is
   * re-listed first: the file may have appeared since the last listing.
   */
  private _checkUnclaimedName(taskId: TaskId, operationId: OperationId): TaskResult<true> {
    const name: string = recordName('task', taskId);
    const listed: Result<ReadonlyArray<string>> = this._store.list();
    if (listed.isFailure()) {
      return taskFailure(`register ${taskId}: ${listed.message}`, 'storage-unavailable', 'safe', {
        operationId
      });
    }
    return listed.value.includes(name)
      ? taskFailure(
          `register ${taskId}: ${name} already exists but this repository never committed it; it is left untouched`,
          'conflict',
          'after-host-action',
          { operationId }
        )
      : ok(true);
  }

  /** Step 1: preflight every dimension, then commit the pending inventory entry. */
  private _newRegistration(
    taskId: TaskId,
    identity: IRegistrationIdentity,
    draft: ITaskRecordDraft,
    replay: ISourceReplayAdmission | undefined
  ): TaskResult<ITaskCommitRecord> {
    const operationId: OperationId = identity.operationId;
    const profile: ITaskCapacityProfile = this.profile;
    const claims: Result<ReadonlyArray<ITaskCapacityClaim>> = mintRegistrationClaims(
      taskId,
      draft.recordType === 'unresolved',
      profile,
      this._environment,
      this._converters.ids.capacityClaimId,
      replay
    );
    if (claims.isFailure()) {
      return taskFailure(`register ${taskId}: ${claims.message}`, 'storage-unavailable', 'safe');
    }
    const entry: IPendingInventoryEntry = {
      id: taskId,
      state: 'pending',
      ...identity,
      capacityClaims: claims.value
    };
    const pendingManifest: ITaskRepositoryManifest = this._withEntry(entry);

    // Preflight the widest state the protocol passes through: the record written while its
    // pending entry (and the request it carries) is still in the manifest. The final state,
    // with the request cleared, is no larger.
    return this._encodeManifest(pendingManifest)
      .onSuccess((manifestEncoded) =>
        this._buildRecord(draft, 1, withOwnership(claims.value, 'live')).onSuccess((built) =>
          this._plan(taskId, undefined, built.record).onSuccess((plan) =>
            this._ledger
              .admit(
                new Map<string, ILedgerEntry>([
                  [taskKey(taskId), this._ledgerForRecord(taskId, built.record, built.encoded)],
                  ['repository', manifestEntry(manifestEncoded.bytes, profile)],
                  ...plan.entries
                ])
              )
              .onSuccess(() => ok(manifestEncoded))
          )
        )
      )
      .onSuccess((manifestEncoded) =>
        this._writeFile(manifestName, manifestEncoded.text, operationId).onSuccess(() => {
          this._setManifest(pendingManifest);
          this._pending.set(taskId, entry);
          // The manifest that now holds the pending entry, request and claims is the committed
          // one; if the record write then fails cleanly, the repository stays usable and must
          // count exactly what is on disk.
          this._ledger.apply(
            new Map([
              [taskKey(taskId), pendingEntry(entry, taskRecordLimit(profile))],
              ['repository', manifestEntry(manifestEncoded.bytes, profile)]
            ])
          );
          this._generation++;
          return this._writeRegistration(taskId, operationId, draft, entry);
        })
      );
  }

  /** Steps 2 and 3: write the record with the entry's claims, then mark the entry live. */
  private _writeRegistration(
    taskId: TaskId,
    operationId: OperationId,
    draft: ITaskRecordDraft,
    entry: IPendingInventoryEntry
  ): TaskResult<ITaskCommitRecord> {
    return this._buildRecord(draft, 1, withOwnership(entry.capacityClaims, 'live')).onSuccess((built) =>
      this._finishRegistration(taskId, operationId, built, true)
    );
  }

  /**
   * A resumed registration. If its record never landed, steps 2 and 3 run as usual. If a file
   * is already at its name, it is either this registration's own first record — step 2 landed
   * and step 3 failed cleanly — in which case only step 3 runs, over the record as it is on
   * disk; or it is something else, which is refused and left untouched.
   */
  private _resumeRegistration(
    taskId: TaskId,
    operationId: OperationId,
    draft: ITaskRecordDraft,
    entry: IPendingInventoryEntry
  ): TaskResult<ITaskCommitRecord> {
    const name: string = recordName('task', taskId);
    const listed: Result<ReadonlyArray<string>> = this._store.list();
    if (listed.isFailure()) {
      return taskFailure(`register ${taskId}: ${listed.message}`, 'storage-unavailable', 'safe', {
        operationId
      });
    }
    if (!listed.value.includes(name)) {
      return this._writeRegistration(taskId, operationId, draft, entry);
    }
    // A record parse like any other: inside the materialization gate.
    const gated: TaskResult<Result<IReadRecord>> = this._gate.run(`register ${taskId}`, () =>
      ok(this._readLanded(name, entry))
    );
    if (gated.isFailure()) {
      return propagate(gated);
    }
    const landed: Result<IReadRecord> = gated.value;
    if (landed.isFailure()) {
      return taskFailure(
        `register ${taskId}: ${name} already exists but is not this registration's first record ` +
          `(${landed.message}); it is left untouched`,
        'conflict',
        'after-host-action',
        { operationId }
      );
    }
    return this._finishRegistration(taskId, operationId, landed.value, false);
  }

  /** Reads a task record's text, refusing it before any parse when it is over the record bound. */
  private _readBounded(name: string): Result<{ text: string; bytes: number }> {
    const limit: number = taskRecordLimit(this.profile);
    return this._store.read(name).onSuccess((text) => {
      const bytes: number = utf8Length(text);
      return bytes > limit ? fail(`${name}: ${bytes} bytes exceeds ${limit}`) : succeed({ text, bytes });
    });
  }

  /** Reads a landed record and checks it is exactly the pending registration's first record. */
  private _readLanded(name: string, entry: IPendingInventoryEntry): Result<IReadRecord> {
    return this._readBounded(name).onSuccess(({ text }) =>
      parseJson(text)
        .onSuccess((parsed) => this._converters.storage.record.convert(parsed))
        .onSuccess((record) =>
          checkRegistrationDraft(record, entry.operationId, entry.request).onSuccess((creation) =>
            record.recordRevision === 1 &&
            canonicallyEqual(registrationIdentity(record, creation), pendingIdentity(entry)) &&
            canonicallyEqual(record.capacityClaims, withOwnership(entry.capacityClaims, 'live'))
              ? succeed<IReadRecord>({ record, encoded: { text, bytes: utf8Length(text) } })
              : fail<IReadRecord>(`its identity or claims differ from the pending registration`)
          )
        )
    );
  }

  /** Admits the record, writes it if it has not landed, then marks the entry live. */
  private _finishRegistration(
    taskId: TaskId,
    operationId: OperationId,
    built: IReadRecord,
    writeRecord: boolean
  ): TaskResult<ITaskCommitRecord> {
    const profile: ITaskCapacityProfile = this.profile;
    const liveManifest: ITaskRepositoryManifest = this._withEntry({ id: taskId, state: 'live' });
    const recordEntry: ILedgerEntry = this._ledgerForRecord(taskId, built.record, built.encoded);
    // A record that landed before a crash was written against the subscriptions of its day; one
    // activated since may be missing from its audiences, and the record is not rewritten for it.
    const planned: TaskResult<ITaskDeliveryPlan> = this._plan(taskId, undefined, built.record, !writeRecord);
    if (planned.isFailure()) {
      return propagate(planned);
    }
    const plan: ITaskDeliveryPlan = planned.value;
    // The claims move from the pending entry to the record by the same IDs: the record's
    // entry replaces the pending one, so nothing is charged twice or released early.
    return this._ledger
      .admit(new Map([[taskKey(taskId), recordEntry], ...plan.entries]))
      .onSuccess(() => this._encodeManifest(liveManifest))
      .onSuccess((manifestEncoded) =>
        (writeRecord
          ? this._writeFile(recordName('task', taskId), built.encoded.text, operationId).onSuccess(() =>
              this._relist(operationId)
            )
          : ok<true>(true)
        )
          .onSuccess(() => this._writeFile(manifestName, manifestEncoded.text, operationId))
          .onSuccess(() => {
            this._setManifest(liveManifest);
            this._pending.delete(taskId);
            this._tasks.set(taskId, projectRecord(built.record, true, built.encoded.text));
            this._ledger.apply(
              new Map([
                [taskKey(taskId), recordEntry],
                ['repository', manifestEntry(manifestEncoded.bytes, profile)]
              ])
            );
            this._generation++;
            return this._applyIndex(taskId, built.record, operationId).onSuccess((record) => {
              this._commitDelivery(plan);
              return ok(record);
            });
          })
      );
  }

  /**
   * A registration whose identity is already live: the same operation and request is a replay
   * and returns the committed record; anything else is refused.
   */
  private _replayRegistration(
    taskId: TaskId,
    operationId: OperationId,
    identity: IRegistrationIdentity
  ): TaskResult<ITaskCommitRecord> {
    return this._readCommitted(taskId, true).onSuccess((read) => {
      const record: ITaskCommitRecord = read!.record;
      // Only the record's creation evidence — its first operation — can answer a registration
      // replay, and it is compared with the whole registration identity, first-record type
      // included. A later operation that happens to share the id and request is not a creation.
      const offered: IStoredCatalogOperation = {
        type: 'catalog',
        operationId: identity.operationId,
        operation: identity.operation,
        principalKey: identity.principalKey,
        request: identity.request,
        receipt: null
      };
      const same: boolean =
        sameOperation(record.operations[0], offered) && firstRecordType(record) === identity.recordType;
      if (!same) {
        return taskFailure<ITaskCommitRecord>(
          `register ${taskId}: this id is already registered by a different operation or request`,
          'conflict',
          'after-host-action',
          { operationId }
        );
      }
      return this._reestablish(read!, operationId).onSuccess(() => ok(record));
    });
  }

  // ------------------------------------------------------------------------------------------
  // Commit — one-task atomic replacement
  // ------------------------------------------------------------------------------------------

  private _commit(request: ITaskCommitRequest): TaskResult<ITaskCommitRecord> {
    const converters: TaskConverters = this._converters;
    const inputs: Result<{ taskId: TaskId; draft: ITaskRecordDraft; operationId: OperationId | undefined }> =
      converters.ids.taskId
        .convert(request.taskId)
        .onSuccess((taskId) =>
          this._commitKind
            .convert(request)
            .onSuccess((converted) =>
              converters.storage.draft
                .convert(request.record)
                .onSuccess((draft) => ok({ taskId, draft, operationId: converted.operationId }))
            )
        );
    if (inputs.isFailure()) {
      return taskFailure(`commit: ${inputs.message}`, 'invalid', 'after-host-action');
    }
    const { taskId, draft, operationId } = inputs.value;
    // Validated before anything else, replays included: a malformed request never succeeds.
    const requiredUpdates: number = request.purpose === 'observation' ? request.requiredUpdates ?? 0 : 0;
    if (!Number.isSafeInteger(requiredUpdates) || requiredUpdates < 0) {
      return taskFailure(
        `commit ${taskId}: requiredUpdates must be a non-negative safe integer`,
        'invalid',
        'after-host-action'
      );
    }
    const projection: ITaskProjection | undefined = this._tasks.get(taskId);
    if (projection === undefined) {
      return taskFailure(`commit ${taskId}: no live task`, 'not-found-or-denied', 'after-host-action');
    }
    if (!projection.known) {
      return taskFailure(
        `commit ${taskId}: ${projection.kind}@${projection.detailVersion} is not registered; the record is quarantined`,
        'unknown-kind-version',
        'after-host-action'
      );
    }
    if (idOf(draft) !== taskId) {
      return taskFailure(
        `commit ${taskId}: the record describes ${idOf(draft)}`,
        'invalid',
        'after-host-action'
      );
    }

    return this._readCommitted(taskId, true).onSuccess((read) => {
      const current: ITaskCommitRecord = read!.record;

      // Replay is checked before the preconditions: a lost-response retry carries the revision
      // it expected *before* its own commit, which is now stale.
      if (operationId !== undefined) {
        const stored = current.operations.find((op) => op.operationId === operationId);
        if (stored !== undefined) {
          const offered = draft.operations.find((op) => op.operationId === operationId);
          // A replay reports success for what is committed, so everything the retry offers
          // must already be committed, identically. An extra operation was never applied.
          const allCommitted: boolean = draft.operations.every((op) =>
            current.operations.some((committed) => sameOperation(committed, op))
          );
          if (offered === undefined || !sameOperation(stored, offered) || !allCommitted) {
            return taskFailure<ITaskCommitRecord>(
              offered !== undefined && sameOperation(stored, offered)
                ? `commit ${taskId}: a replay of '${operationId}' offers operations that were never committed`
                : `commit ${taskId}: operation '${operationId}' is already recorded with a different request`,
              'conflict',
              'after-host-action',
              { operationId }
            );
          }
          return this._reestablish(read!, operationId).onSuccess(() => ok(current));
        }
      }

      // An observation whose source revision is already committed is a replay when it projects
      // the same semantic state, and a source contract violation when it does not (design §5).
      if (
        request.purpose === 'observation' &&
        current.recordType === 'resolved' &&
        draft.recordType === 'resolved'
      ) {
        if (
          current.sourceRevision !== undefined &&
          canonicallyEqual(current.sourceRevision, draft.sourceRevision)
        ) {
          const semantic = (r: typeof draft | typeof current): unknown => ({
            lifecycle: r.task.envelope.lifecycle,
            progress: r.task.envelope.progress,
            attention: r.task.envelope.attention,
            details: r.task.details
          });
          if (!canonicallyEqual(semantic(current), semantic(draft))) {
            return taskFailure<ITaskCommitRecord>(
              `commit ${taskId}: source revision ${current.sourceRevision.epoch}/${current.sourceRevision.token} ` +
                `is already committed with a different projection; the source violated its revision contract`,
              'source-gap',
              'after-host-action'
            );
          }
          // The same projection again is a replay — unless observation health changed, which is
          // semantic (an outage beginning or ending) and commits at the same source revision.
          const health = (r: typeof draft | typeof current): unknown => {
            const h = r.task.envelope.observation;
            return h.state === 'current' ? { state: h.state } : { state: h.state, reason: h.reason };
          };
          if (canonicallyEqual(health(current), health(draft))) {
            return this._reestablish(read!, undefined).onSuccess(() => ok(current));
          }
        }
      }

      if (projection.archived) {
        return taskFailure<ITaskCommitRecord>(
          `commit ${taskId}: an archived tombstone is immutable`,
          'conflict',
          'after-host-action',
          operationId !== undefined ? { operationId } : undefined
        );
      }
      if (
        revisionOf(current) !== request.expectedRevision ||
        current.recordRevision !== request.expectedRecordRevision
      ) {
        return taskFailure<ITaskCommitRecord>(
          `commit ${taskId}: expected revision ${request.expectedRevision}/record ${request.expectedRecordRevision}, ` +
            `found ${revisionOf(current)}/${current.recordRevision}`,
          'conflict',
          'reconcile-first',
          operationId !== undefined ? { operationId } : undefined
        );
      }
      return this._checkReplacement(current, draft, request)
        .onSuccess(() => this._validateDraft(draft))
        .onSuccess((validated) => this._checkParent(taskId, validated).onSuccess(() => ok(validated)))
        .onSuccess((validated) => this._replace(taskId, read!, validated, operationId, requiredUpdates));
    });
  }

  private _checkReplacement(
    current: ITaskCommitRecord,
    draft: ITaskRecordDraft,
    request: ITaskCommitRequest
  ): TaskResult<true> {
    const maintenance: boolean = request.purpose === 'maintenance';
    const checked: Result<true> = checkIdentity(current, draft)
      .onSuccess((resolved) => checkPurpose(current, resolved, request.purpose).onSuccess(() => ok(resolved)))
      .onSuccess((resolved) => {
        const nextRevision = revisionOf(draft);
        const currentRevision = revisionOf(current);
        if (maintenance ? nextRevision !== currentRevision : nextRevision < currentRevision) {
          return fail<true>(
            maintenance
              ? `maintenance cannot change the semantic revision`
              : `the revision cannot move backwards from ${currentRevision} to ${nextRevision}`
          );
        }
        if (request.purpose === 'observation' && resolved.sourceRevision === undefined) {
          return fail<true>(`an observation carries the source revision that deduplicates it`);
        }
        return ok<true>(true);
      })
      .onSuccess(() =>
        checkOperations(
          current.operations,
          draft.operations,
          request.purpose === 'operation' ? request.operationId : undefined
        )
      )
      .onSuccess(() => checkCommandEvolution(current.operations, draft.operations))
      .onSuccess(() =>
        // An unresolved draft never reaches here (identity refuses it), and an unresolved current
        // record has no updates: first resolution adds them all.
        checkUpdates(updatesOf(current), updatesOf(draft), revisionOf(draft), maintenance)
      );
    return checked.isSuccess()
      ? ok(true)
      : taskFailure(
          `commit ${idOf(current)}: ${checked.message}`,
          'invalid',
          'after-host-action',
          request.purpose === 'operation' ? { operationId: request.operationId } : undefined
        );
  }

  /** Builds, admits and writes the replacement, spending protected steps from their claims. */
  private _replace(
    taskId: TaskId,
    current: IReadRecord,
    draft: ITaskRecordDraft,
    operationId: OperationId | undefined,
    requiredUpdates: number = 0
  ): TaskResult<ITaskCommitRecord> {
    const record: ITaskCommitRecord = current.record;
    const recordRevision: number = record.recordRevision + 1;
    if (draft.operations.length > record.operations.length) {
      // Closeout slots still owed after this step: the archive, and before that the terminal.
      const terminal: boolean =
        draft.recordType === 'resolved' && isTerminalTaskStatus(draft.task.envelope.lifecycle.status);
      const archived: boolean = draft.recordType === 'resolved' && draft.archived;
      const counted: TaskResult<true> = this._checkOperationCount(
        taskId,
        draft.operations.length,
        archived ? 0 : terminal ? 1 : 2
      );
      if (counted.isFailure()) {
        return propagate(counted);
      }
    }
    // Growth is measured against the current record's own usage — the same figure its ledger
    // entry holds — so a step spends exactly what it adds.
    const previous: ILedgerEntry = this._ledgerForRecord(taskId, record, current.encoded);
    const minted: TaskResult<ReadonlyArray<ITaskCapacityClaim>> = mintSettlements(
      taskId,
      this.profile,
      this._environment,
      this._converters.ids.capacityClaimId,
      record,
      draft
    );
    if (minted.isFailure()) {
      return propagate(minted);
    }
    const startingClaims: ReadonlyArray<ITaskCapacityClaim> = minted.value;
    return this._buildRecord(draft, recordRevision, startingClaims)
      .onSuccess((provisional) => {
        const provisionalEntry: ILedgerEntry = this._ledgerForRecord(
          taskId,
          provisional.record,
          provisional.encoded
        );
        const growth: DimensionAmounts = zeroAmounts();
        for (const dimension of Object.keys(growth) as Array<keyof DimensionAmounts>) {
          growth[dimension] = provisionalEntry.used[dimension] - previous.used[dimension];
        }
        // The acknowledgement evidence of every link this commit adds is part of its growth, so a
        // protected step pays for it from its own claim and the subscriptions hold it from there —
        // a transfer, never a second charge (T7; the T6 hand-off).
        const links: number = newLinks(record, provisional.record);
        growth['acknowledgement-ids'] += links;
        growth['logical-bytes'] += links * this.profile.encoded.maxAcknowledgementEvidenceBytes;
        const next: ITaskCommitRecord = provisional.record;
        // Settlements and the replay envelope spend first, from a shared growth figure each spend
        // reduces, so no two claims are credited with the same growth.
        const spent: TaskResult<ReadonlyArray<ITaskCapacityClaim>> = spendExecutionClaims(
          taskId,
          record,
          next,
          startingClaims,
          growth,
          requiredUpdates
        );
        if (spent.isFailure()) {
          return propagate<{ built: IReadRecord; entry: ILedgerEntry }>(spent);
        }
        let claims: ReadonlyArray<ITaskCapacityClaim> = spent.value;
        if (record.recordType === 'unresolved' && next.recordType === 'resolved') {
          claims = spendClaim(claims, 'first-resolution', growth, true);
        } else if (
          !isTerminalRecord(record) &&
          isTerminalRecord(next) &&
          !(next.recordType === 'resolved' && next.archived)
        ) {
          claims = spendClaim(claims, 'terminal-closeout', growth, false);
        }
        if (next.recordType === 'resolved' && next.archived) {
          claims = spendClaim(claims, 'terminal-closeout', growth, true);
        }
        return claims === startingClaims
          ? ok({ built: provisional, entry: provisionalEntry })
          : this._buildRecord(draft, recordRevision, claims).onSuccess((built) =>
              ok({ built, entry: this._ledgerForRecord(taskId, built.record, built.encoded) })
            );
      })
      .onSuccess(({ built, entry }) =>
        this._plan(taskId, record, built.record).onSuccess((plan) =>
          this._ledger
            .admit(new Map([[taskKey(taskId), entry], ...plan.entries]))
            .onSuccess(() => this._writeFile(recordName('task', taskId), built.encoded.text, operationId))
            .onSuccess(() => {
              this._cache.delete(taskId);
              this._tasks.set(taskId, projectRecord(built.record, true, built.encoded.text));
              this._ledger.apply(new Map([[taskKey(taskId), entry]]));
              this._generation++;
              return this._applyIndex(taskId, built.record, operationId).onSuccess((committed) => {
                this._commitDelivery(plan);
                return ok(committed);
              });
            })
        )
      );
  }

  /** {@inheritDoc ITaskRepositoryWriter.extendReplayEnvelope} */
  private _extendReplay(taskId: TaskId, add: ISourceReplayEnvelope): TaskResult<ISourceReplayEnvelope> {
    const added = this._converters.values.sourceReplayEnvelope
      .convert(add)
      .onSuccess((envelope) =>
        replayCharges(envelope, this.profile).onSuccess((charges) => succeed({ envelope, charges }))
      );
    if (added.isFailure()) {
      return taskFailure(`extendReplayEnvelope ${taskId}: ${added.message}`, 'invalid', 'after-host-action');
    }
    const projection: ITaskProjection | undefined = this._tasks.get(taskId);
    if (projection === undefined || !projection.known || projection.archived) {
      return taskFailure(
        `extendReplayEnvelope ${taskId}: no live, writable task`,
        'not-found-or-denied',
        'after-host-action'
      );
    }
    return this._readCommitted(taskId, true).onSuccess((read) => {
      const record: ITaskCommitRecord = read!.record;
      const extended = extendReplayClaims(record, added.value.envelope, added.value.charges);
      if (extended.isFailure()) {
        return taskFailure<ISourceReplayEnvelope>(
          `extendReplayEnvelope ${taskId}: ${extended.message}`,
          'invalid',
          'after-host-action'
        );
      }
      const { claims, envelope, draft } = extended.value;
      return this._buildRecord(draft, record.recordRevision + 1, claims).onSuccess((built) => {
        const entry: ILedgerEntry = this._ledgerForRecord(taskId, built.record, built.encoded);
        // More remaining replay revisions are more future links for every subscription covering it.
        return this._plan(taskId, record, built.record).onSuccess((plan) =>
          this._ledger
            .admit(new Map([[taskKey(taskId), entry], ...plan.entries]))
            .onSuccess(() => this._writeFile(recordName('task', taskId), built.encoded.text, undefined))
            .onSuccess(() => {
              this._cache.delete(taskId);
              this._tasks.set(taskId, projectRecord(built.record, true, built.encoded.text));
              this._ledger.apply(new Map([[taskKey(taskId), entry]]));
              this._generation++;
              return this._applyIndex(taskId, built.record, undefined);
            })
            .onSuccess(() => {
              this._commitDelivery(plan);
              return ok<ISourceReplayEnvelope>(envelope);
            })
        );
      });
    });
  }

  // ------------------------------------------------------------------------------------------
  // Capacity policy
  // ------------------------------------------------------------------------------------------

  private _raiseLimits(requested: ITaskCapacityProfile): TaskResult<ITaskCapacityProfile> {
    const converted: Result<ITaskCapacityProfile> = this._converters.capacity.profile.convert(requested);
    if (converted.isFailure()) {
      return taskFailure(`raiseCapacityLimits: ${converted.message}`, 'invalid', 'after-host-action');
    }
    const profile: ITaskCapacityProfile = converted.value;
    const stored: ITaskCapacityProfile = this.profile;
    const lowered: string[] = [];
    const compare = (
      group: string,
      before: Readonly<Record<string, number>>,
      after: Readonly<Record<string, number>>
    ): void => {
      for (const key of Object.keys(before)) {
        if (after[key] < before[key]) {
          lowered.push(`${group}.${key}`);
        }
      }
    };
    compare('limits', stored.limits, profile.limits);
    compare('perOwner', { ...stored.perOwner }, { ...profile.perOwner });
    compare('encoded', { ...stored.encoded }, { ...profile.encoded });
    if (lowered.length > 0) {
      return taskFailure(
        `raiseCapacityLimits: lowering limits in place is unsupported (${lowered.join(', ')})`,
        'unsupported',
        'after-host-action'
      );
    }
    const manifest: ITaskRepositoryManifest = {
      ...this._manifest,
      manifestRevision: this._manifest.manifestRevision + 1,
      profile
    };
    // Preflighted like every other write, against the policy being committed: the manifest
    // that stores the new profile must itself fit it, or the next open would find it over.
    return this._encodeManifest(manifest).onSuccess((encoded) =>
      this._ledger
        .admit(new Map([['repository', manifestEntry(encoded.bytes, profile)]]), profile)
        .onSuccess(() => this._writeFile(manifestName, encoded.text, undefined))
        .onSuccess(() => {
          this._setManifest(manifest);
          this._ledger.setProfile(profile, (key) => recordLimitFor(key, profile));
          this._ledger.apply(new Map([['repository', manifestEntry(encoded.bytes, profile)]]));
          // A subscription's per-owner history limit is a profile value too.
          this._ledger.apply(this._book.entries(this._index!, profile));
          this._generation++;
          return ok(profile);
        })
    );
  }

  // ------------------------------------------------------------------------------------------
  // Shared machinery
  // ------------------------------------------------------------------------------------------

  private _usable(): TaskResult<true> {
    if (this._state === 'closed') {
      return taskFailure('repository: closed', 'storage-unavailable', 'after-host-action');
    }
    if (this._state === 'rebuilding') {
      return taskFailure('repository: the indexes are being rebuilt; retry', 'storage-unavailable', 'safe');
    }
    if (this._state === 'unavailable') {
      return taskFailure(
        `repository: fenced (${this._issues.join('; ')}); rebuild the indexes, or close and reopen, to ` +
          `reconcile with what is on disk`,
        'storage-unavailable',
        'reconcile-first'
      );
    }
    return ok(true);
  }

  private _fence(reason: string): void {
    this._state = 'unavailable';
    this._issues.push(reason);
    this._environment.logger.error(`ts-agent-tasks repository ${this.repositoryId}: fenced: ${reason}`);
  }

  /**
   * Validates a draft's content: registered kind, details through the registered converter
   * (whose canonical output is what gets stored), and the stored profile's value bounds.
   */
  private _validateDraft(draft: ITaskRecordDraft): TaskResult<ITaskRecordDraft> {
    const bounds: Result<true> = checkBounds(draft, this.profile);
    if (bounds.isFailure()) {
      return taskFailure(`task ${idOf(draft)}: ${bounds.message}`, 'invalid', 'after-host-action');
    }
    if (draft.recordType === 'unresolved') {
      const reference = draft.reference;
      return this._registry.has(reference.kind, reference.detailVersion)
        ? ok(draft)
        : taskFailure(
            `task ${reference.id}: ${reference.kind}@${reference.detailVersion} is not registered`,
            'unknown-kind-version',
            'after-host-action'
          );
    }
    // The registered converter's canonical output is what gets stored, and its encoder can
    // grow the details, so the bounds hold for the normalized draft too.
    return this._registry.convert(draft.task).onSuccess((task) => {
      const normalized: ITaskRecordDraft = { ...draft, task };
      const rebounded: Result<true> = checkBounds(normalized, this.profile);
      return rebounded.isSuccess()
        ? ok(normalized)
        : taskFailure<ITaskRecordDraft>(
            `task ${idOf(draft)}: as normalized by its kind: ${rebounded.message}`,
            'invalid',
            'after-host-action'
          );
    });
  }

  /**
   * The per-task operation limit, with the closeout path's own slots held back.
   *
   * @remarks
   * Every accepted task reserves room for a terminal operation and an archive operation
   * (`maximumClosureCharges`). The repository-wide ledger holds those as claims; the per-task
   * bound needs the same protection, or a task could spend its last slot on ordinary work and
   * be unable to finish. So an ordinary operation may use the limit less the closeout slots
   * still owed, and a closeout step may use the whole limit.
   */
  private _checkOperationCount(taskId: TaskId, count: number, heldBack: number): TaskResult<true> {
    const limit: number = this.profile.perOwner.maxOperationsPerTask;
    if (count <= limit - heldBack) {
      return ok(true);
    }
    return taskFailure(
      `capacity: task ${taskId} would hold ${count} operations; its limit is ${limit}, ` +
        `of which ${heldBack} are held for closeout`,
      'backpressure',
      'after-host-action',
      {
        capacity: {
          reason: 'capacity-exhausted',
          dimension: 'operations',
          recordId: taskId,
          used: count - 1,
          reserved: heldBack,
          requested: 1,
          limit,
          reclaimableByCleanup: false
        }
      }
    );
  }

  /** A parent edge must name a live task, and must not close a cycle. */
  private _checkParent(taskId: TaskId, draft: ITaskRecordDraft): TaskResult<true> {
    const parentId: TaskId | undefined =
      draft.recordType === 'resolved' ? draft.task.envelope.parentId : draft.reference.parentId;
    if (parentId === undefined || parentId === this._tasks.get(taskId)?.parentId) {
      return ok(true);
    }
    const seen: Set<TaskId> = new Set<TaskId>([taskId]);
    let cursor: TaskId | undefined = parentId;
    while (cursor !== undefined) {
      if (seen.has(cursor)) {
        return taskFailure(
          `task ${taskId}: parent ${parentId} would close a cycle`,
          'invalid',
          'after-host-action'
        );
      }
      const parent: ITaskProjection | undefined = this._tasks.get(cursor);
      if (parent === undefined) {
        return taskFailure(
          `task ${taskId}: parent ${cursor} is not a live task`,
          'invalid',
          'after-host-action'
        );
      }
      seen.add(cursor);
      cursor = parent.parentId;
    }
    return ok(true);
  }

  /** Completes a record from a draft and validates it through the read-path converter. */
  private _buildRecord(
    draft: ITaskRecordDraft,
    recordRevision: number,
    claims: ReadonlyArray<ITaskCapacityClaim>
  ): TaskResult<{ record: ITaskCommitRecord; encoded: IEncodedRecord }> {
    // The two branches are textually identical; the ternary is what lets the compiler narrow the
    // discriminated union through the spread. Collapsing it is a type error.
    const record: ITaskCommitRecord =
      draft.recordType === 'resolved'
        ? { ...draft, formatVersion: 1, recordRevision, capacityClaims: claims }
        : { ...draft, formatVersion: 1, recordRevision, capacityClaims: claims };
    const converter = this._converters.storage.record;
    return classify(
      encodeValidated(record, (from) => converter.convert(from)).onSuccess((encoded) =>
        succeed({ record, encoded })
      ),
      'invalid',
      'after-host-action'
    ).withErrorFormat((message) => `task ${idOf(draft)}: ${message}`);
  }

  private _ledgerForRecord(taskId: TaskId, record: ITaskCommitRecord, encoded: IEncodedRecord): ILedgerEntry {
    return ledgerEntry(
      taskId,
      taskUsage(record, encoded.bytes),
      record.capacityClaims,
      taskRecordLimit(this.profile)
    );
  }

  private _withEntry(entry: ITaskInventoryEntry): ITaskRepositoryManifest {
    const others: ReadonlyArray<ITaskInventoryEntry> = this._manifest.tasks.filter((e) => e.id !== entry.id);
    return {
      ...this._manifest,
      manifestRevision: this._manifest.manifestRevision + 1,
      tasks: [...others, entry].sort((a, b) => (a.id < b.id ? -1 : 1))
    };
  }

  private _encodeManifest(manifest: ITaskRepositoryManifest): TaskResult<IEncodedRecord> {
    const converter = this._converters.storage.manifest;
    return classify(
      encodeValidated(manifest, (from) => converter.convert(from)),
      'invalid',
      'after-host-action'
    );
  }

  private _setManifest(manifest: ITaskRepositoryManifest): void {
    this._manifest = manifest;
  }

  /**
   * One atomic write at the repository's guarantee, classified by what a reader can now see.
   *
   * @remarks
   * `'unchanged'` is positive evidence nothing happened: the failure is safe to retry and no
   * in-memory state moves. `'replaced'` or `'unknown'` means the write may have landed: the
   * repository fences itself and reports `commit-indeterminate` with the operation ID the host
   * resolves it by, after a reopen that reads what is actually on disk. A failed call is never
   * treated as proof that nothing happened (design §8.2).
   */
  private _writeFile(name: string, text: string, operationId: OperationId | undefined): TaskResult<true> {
    if (name === manifestName) {
      const current: TaskResult<true> = this._checkManifest(operationId);
      if (current.isFailure()) {
        return current;
      }
    }
    const written = this._store.write(name, text);
    if (written.isSuccess()) {
      if (name === manifestName) {
        this._manifestFingerprint = fingerprintOf(text);
      }
      return ok(true);
    }
    // A store that fails without classifying the failure has told us nothing about what a
    // reader can see, which is exactly 'unknown'.
    const visibility: FileTree.IAtomicWriteFailure['visibility'] = written.detail?.visibility ?? 'unknown';
    const stage: string = written.detail?.stage ?? 'unclassified';
    if (visibility === 'unchanged') {
      return taskFailure(
        `${name}: write failed before anything became visible: ${written.message}`,
        'storage-unavailable',
        'safe',
        operationId !== undefined ? { operationId } : undefined
      );
    }
    this._fence(`${name}: write outcome is ${visibility} after '${stage}'`);
    return operationId !== undefined
      ? taskFailure(
          `${name}: the write may have landed (${visibility}): ${written.message}`,
          'commit-indeterminate',
          'reconcile-first',
          { operationId }
        )
      : taskFailure(
          `${name}: the write may have landed (${visibility}): ${written.message}`,
          'storage-unavailable',
          'reconcile-first'
        );
  }

  /**
   * The manifest is committed state as much as a task record is: before it is rewritten, the
   * one on disk must still be the one this instance last wrote or read. Anything else is an
   * out-of-band change — an entry removed, a policy edited — and rewriting over it would erase
   * it, so the repository fences instead.
   */
  private _checkManifest(operationId: OperationId | undefined): TaskResult<true> {
    const detail = operationId !== undefined ? { operationId } : undefined;
    // Re-list first: a store may hand out file items that snapshot their content.
    const text: Result<string> = this._store.list().onSuccess(() => this._store.read(manifestName));
    if (text.isFailure()) {
      return taskFailure(
        `${manifestName}: cannot be re-read before rewriting it: ${text.message}`,
        'storage-unavailable',
        'safe',
        detail
      );
    }
    if (fingerprintOf(text.value) === this._manifestFingerprint) {
      return ok(true);
    }
    const message: string = `${manifestName} differs from the one this repository committed`;
    this._fence(message);
    return taskFailure(message, 'storage-corrupt', 'after-host-action', detail);
  }

  private _relist(operationId: OperationId): TaskResult<true> {
    const listed: Result<ReadonlyArray<string>> = this._store.list();
    if (listed.isSuccess()) {
      return ok(true);
    }
    this._fence(`relist failed after a committed write: ${listed.message}`);
    return taskFailure(
      `relist failed after a committed write: ${listed.message}`,
      'commit-indeterminate',
      'reconcile-first',
      { operationId }
    );
  }

  /**
   * Re-establishes the flush boundary of an already-committed record on replay, by atomically
   * rewriting it byte for byte (design §8.2). A replay after a failure at the directory flush
   * would otherwise report success for a record whose directory entry was never flushed.
   * Nothing semantic changes: same text, same record revision.
   */
  private _reestablish(read: IReadRecord, operationId: OperationId | undefined): TaskResult<true> {
    const name: string = recordName('task', idOf(read.record));
    return this._writeFile(name, read.encoded.text, operationId)
      .onSuccess(() => this._encodeManifest(this._manifest))
      .onSuccess((encoded) => this._writeFile(manifestName, encoded.text, operationId));
  }

  /**
   * Reads a live task's record from disk and checks it is still the record this instance
   * committed. A record that disagrees is out-of-band change or loss, and fences.
   */
  /**
   * Reads a live task's record. `uncached` reads the file even when the cache holds the record:
   * every writer path uses it, because a write's precondition must be checked against what is
   * on disk — a cached copy cannot notice that the file changed out of band, and a write over it
   * would erase that change instead of fencing.
   */
  private _readCommitted(id: TaskId, uncached: boolean = false): TaskResult<IReadRecord | undefined> {
    const usable: TaskResult<true> = this._usable();
    if (usable.isFailure()) {
      return propagate(usable);
    }
    const projection: ITaskProjection | undefined = this._tasks.get(id);
    if (projection === undefined) {
      return ok(undefined);
    }
    const cached: ICachedRecord | undefined = uncached
      ? undefined
      : this._cache.get(id, projection.recordRevision, projection.fingerprint);
    if (cached !== undefined) {
      return ok(cached);
    }
    const name: string = recordName('task', id);
    return this._gate.run(`read ${id}`, () => {
      const read: Result<IReadRecord> = this._readBounded(name).onSuccess(({ text, bytes }) =>
        parseJson(text)
          .onSuccess((parsed) => this._converters.storage.record.convert(parsed))
          .onSuccess((record) => {
            if (idOf(record) !== id || record.recordRevision !== projection.recordRevision) {
              return fail<IReadRecord>(
                `${name}: holds ${idOf(record)} record ${record.recordRevision}, expected ${id} record ${
                  projection.recordRevision
                }`
              );
            }
            if (fingerprintOf(text) !== projection.fingerprint) {
              return fail<IReadRecord>(
                `${name}: record ${record.recordRevision} differs from the one this repository committed`
              );
            }
            return ok<IReadRecord>({ record, encoded: { text, bytes } });
          })
      );
      if (read.isFailure()) {
        this._fence(read.message);
        return taskFailure<IReadRecord | undefined>(read.message, 'storage-corrupt', 'after-host-action');
      }
      this._cache.put(id, read.value, projection.fingerprint);
      return ok<IReadRecord | undefined>(read.value);
    });
  }
}
