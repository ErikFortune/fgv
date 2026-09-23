/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Result, captureAsyncResult, fail, succeed } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import {
  IPendingInventoryEntry,
  ITaskCapacityClaim,
  ITaskCapacityProfile,
  ITaskCapacityStatus,
  ITaskCommitRecord,
  ITaskEnvironment,
  ITaskInventoryEntry,
  ITaskKindRegistry,
  ITaskRecordDraft,
  IStoredTaskOperation,
  ITaskRecoveryReport,
  ITaskRepositoryManifest,
  ITaskSnapshot,
  OperationId,
  TaskId,
  TaskRegistrationResult,
  TaskResult,
  isTerminalTaskStatus
} from '../types';
import { mintRegistrationClaims, spendClaim, withOwnership } from './claims';
import {
  checkBounds,
  checkIdentity,
  checkOperations,
  checkPurpose,
  checkRegistrationDraft,
  checkUpdates,
  idOf,
  revisionOf,
  sameOperation,
  updatesOf
} from './commitRules';
import { classify, ok, propagate, taskFailure } from './failures';
import {
  canonicallyEqual,
  encodeRecord,
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
  ITaskRepository,
  ITaskRepositoryHealth,
  ITaskRepositoryOpenParams,
  ITaskRepositoryWriter,
  TaskRepositoryMode,
  TaskRepositoryOpenResult
} from './model';
import { IRepositoryState, initializeRepository, openRepository } from './openRepository';
import {
  ITaskProjection,
  isTerminalRecord,
  ledgerEntry,
  manifestEntry,
  pendingEntry,
  projectRecord,
  taskKey,
  taskRecordLimit,
  taskUsage
} from './projection';
import { RecordStore } from './recordStore';
import { IRootOwnership } from './rootOwnership';

interface IReadRecord {
  readonly record: ITaskCommitRecord;
  readonly encoded: IEncodedRecord;
}

interface IWriterHandle {
  active: boolean;
}

/**
 * Encodes a record after running the storage converter over it — the same converter the read
 * path runs — so nothing is written that a restart would refuse to read.
 */
function _encodeValidated<T>(value: T, convert: (from: unknown) => Result<T>): Result<IEncodedRecord> {
  return encodeRecord(value)
    .onSuccess((encoded) => parseJson(encoded.text))
    .onSuccess((parsed) => convert(parsed))
    .onSuccess((converted) => encodeRecord(converted));
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
  /** {@inheritDoc ITaskRepository.report} */
  public readonly report: ITaskRecoveryReport;

  private readonly _store: RecordStore;
  private readonly _ownership: IRootOwnership;
  private readonly _converters: TaskConverters;
  private readonly _registry: ITaskKindRegistry;
  private readonly _environment: ITaskEnvironment;
  private readonly _tasks: Map<TaskId, ITaskProjection>;
  private readonly _pending: Map<string, IPendingInventoryEntry>;
  private readonly _ledger: CapacityLedger;
  private _manifest: ITaskRepositoryManifest;
  private _state: ITaskRepositoryHealth['state'];
  private _generation: number;
  private readonly _issues: string[];
  private _writer: IWriterHandle | undefined;

  private constructor(state: IRepositoryState) {
    this.repositoryId = state.manifest.repositoryId;
    this.mode = state.mode;
    this.report = state.report;
    this._store = state.store;
    this._ownership = state.ownership;
    this._converters = state.converters;
    this._registry = state.registry;
    this._environment = state.environment;
    this._tasks = state.tasks;
    this._pending = state.pending;
    this._ledger = state.ledger;
    this._manifest = state.manifest;
    this._state = 'ready';
    this._generation = 0;
    this._issues = [];
    this._writer = undefined;
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

  /** {@inheritDoc ITaskRepository.health} */
  public health(): ITaskRepositoryHealth {
    return { state: this._state, generation: this._generation, issues: [...this._issues] };
  }

  /** {@inheritDoc ITaskRepository.close} */
  public close(): Result<boolean> {
    if (this._state === 'closed') {
      return ok(false);
    }
    this._state = 'closed';
    this._writer = undefined;
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
        guard().onSuccess(() => this._readCommitted(id).onSuccess((read) => ok(read?.record))),
      register: async (request: ITaskRegistrationRequest) => guard().onSuccess(() => this._register(request)),
      commit: async (request: ITaskCommitRequest) => guard().onSuccess(() => this._commit(request)),
      raiseCapacityLimits: async (profile: ITaskCapacityProfile) =>
        guard().onSuccess(() => this._raiseLimits(profile))
    };
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
    const shape: Result<true> = checkRegistrationDraft(draft, operationId, request.request);
    if (shape.isFailure()) {
      return taskFailure(`register ${taskId}: ${shape.message}`, 'invalid', 'after-host-action');
    }

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
      return this._replayRegistration(taskId, operationId, draft.operations[0]);
    }
    const pending: IPendingInventoryEntry | undefined = this._pending.get(taskId);
    if (pending !== undefined) {
      const same: boolean = canonicallyEqual(
        { operationId: pending.operationId, request: pending.request },
        { operationId, request: request.request }
      );
      if (!same) {
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
        this._checkOperationCount(taskId, validated.operations.length, 2).onSuccess(() => ok(validated))
      )
      .onSuccess((validated) =>
        pending !== undefined
          ? this._writeRegistration(taskId, operationId, validated, pending)
          : this._checkUnclaimedName(taskId, operationId).onSuccess(() =>
              this._newRegistration(taskId, operationId, request, validated)
            )
      );
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
          `register ${taskId}: ${name} already exists but the inventory does not name it; it is left untouched`,
          'conflict',
          'after-host-action',
          { operationId }
        )
      : ok(true);
  }

  /** Step 1: preflight every dimension, then commit the pending inventory entry. */
  private _newRegistration(
    taskId: TaskId,
    operationId: OperationId,
    request: ITaskRegistrationRequest,
    draft: ITaskRecordDraft
  ): TaskResult<ITaskCommitRecord> {
    const profile: ITaskCapacityProfile = this.profile;
    const claims: Result<ReadonlyArray<ITaskCapacityClaim>> = mintRegistrationClaims(
      taskId,
      draft.recordType === 'unresolved',
      profile,
      this._environment,
      this._converters.ids.capacityClaimId
    );
    if (claims.isFailure()) {
      return taskFailure(`register ${taskId}: ${claims.message}`, 'storage-unavailable', 'safe');
    }
    const entry: IPendingInventoryEntry = {
      id: taskId,
      state: 'pending',
      operationId,
      request: request.request,
      capacityClaims: claims.value
    };
    const pendingManifest: ITaskRepositoryManifest = this._withEntry(entry);

    // Preflight the widest state the protocol passes through: the record written while its
    // pending entry (and the request it carries) is still in the manifest. The final state,
    // with the request cleared, is no larger.
    return this._encodeManifest(pendingManifest)
      .onSuccess((manifestEncoded) =>
        this._buildRecord(draft, 1, withOwnership(claims.value, 'live')).onSuccess((built) =>
          this._ledger
            .admit(
              new Map<string, ILedgerEntry>([
                [taskKey(taskId), this._ledgerForRecord(taskId, built.record, built.encoded)],
                ['repository', manifestEntry(manifestEncoded.bytes, profile)]
              ])
            )
            .onSuccess(() => ok(manifestEncoded))
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
    const profile: ITaskCapacityProfile = this.profile;
    const liveManifest: ITaskRepositoryManifest = this._withEntry({ id: taskId, state: 'live' });
    return this._buildRecord(draft, 1, withOwnership(entry.capacityClaims, 'live')).onSuccess((built) => {
      const recordEntry: ILedgerEntry = this._ledgerForRecord(taskId, built.record, built.encoded);
      // The claims move from the pending entry to the record by the same IDs: the record's
      // entry replaces the pending one, so nothing is charged twice or released early.
      return this._ledger
        .admit(new Map([[taskKey(taskId), recordEntry]]))
        .onSuccess(() => this._encodeManifest(liveManifest))
        .onSuccess((manifestEncoded) =>
          this._writeFile(recordName('task', taskId), built.encoded.text, operationId)
            .onSuccess(() => this._relist(operationId))
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
              return ok(built.record);
            })
        );
    });
  }

  /**
   * A registration whose identity is already live: the same operation and request is a replay
   * and returns the committed record; anything else is refused.
   */
  private _replayRegistration(
    taskId: TaskId,
    operationId: OperationId,
    creation: IStoredTaskOperation
  ): TaskResult<ITaskCommitRecord> {
    return this._readCommitted(taskId).onSuccess((read) => {
      const record: ITaskCommitRecord = read!.record;
      // Only the record's creation evidence — its first operation — can answer a registration
      // replay. A later operation that happens to share the id and request is not a creation.
      if (!sameOperation(record.operations[0], creation)) {
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
    const inputs: Result<{ taskId: TaskId; draft: ITaskRecordDraft }> = converters.ids.taskId
      .convert(request.taskId)
      .onSuccess((taskId) =>
        converters.storage.draft.convert(request.record).onSuccess((draft) => ok({ taskId, draft }))
      );
    if (inputs.isFailure()) {
      return taskFailure(`commit: ${inputs.message}`, 'invalid', 'after-host-action');
    }
    const { taskId, draft } = inputs.value;
    const operationId: OperationId | undefined =
      request.purpose === 'operation' ? request.operationId : undefined;
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

    return this._readCommitted(taskId).onSuccess((read) => {
      const current: ITaskCommitRecord = read!.record;

      // Replay is checked before the preconditions: a lost-response retry carries the revision
      // it expected *before* its own commit, which is now stale.
      if (operationId !== undefined) {
        const stored = current.operations.find((op) => op.operationId === operationId);
        if (stored !== undefined) {
          const offered = draft.operations.find((op) => op.operationId === operationId);
          if (offered === undefined || !sameOperation(stored, offered)) {
            return taskFailure<ITaskCommitRecord>(
              `commit ${taskId}: operation '${operationId}' is already recorded with a different request`,
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
          return this._reestablish(read!, undefined).onSuccess(() => ok(current));
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
        .onSuccess((validated) => this._replace(taskId, read!, validated, operationId));
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
    operationId: OperationId | undefined
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
    return this._buildRecord(draft, recordRevision, record.capacityClaims)
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
        let claims: ReadonlyArray<ITaskCapacityClaim> = record.capacityClaims;
        const next: ITaskCommitRecord = provisional.record;
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
        return claims === record.capacityClaims
          ? ok({ built: provisional, entry: provisionalEntry })
          : this._buildRecord(draft, recordRevision, claims).onSuccess((built) =>
              ok({ built, entry: this._ledgerForRecord(taskId, built.record, built.encoded) })
            );
      })
      .onSuccess(({ built, entry }) =>
        this._ledger
          .admit(new Map([[taskKey(taskId), entry]]))
          .onSuccess(() => this._writeFile(recordName('task', taskId), built.encoded.text, operationId))
          .onSuccess(() => {
            this._tasks.set(taskId, projectRecord(built.record, true, built.encoded.text));
            this._ledger.apply(new Map([[taskKey(taskId), entry]]));
            this._generation++;
            return ok(built.record);
          })
      );
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
          this._ledger.setProfile(profile);
          this._ledger.apply(new Map([['repository', manifestEntry(encoded.bytes, profile)]]));
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
    if (this._state === 'unavailable') {
      return taskFailure(
        `repository: fenced (${this._issues.join('; ')}); close and reopen to reconcile with what is on disk`,
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
      _encodeValidated(record, (from) => converter.convert(from)).onSuccess((encoded) =>
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
      _encodeValidated(manifest, (from) => converter.convert(from)),
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
    const written = this._store.write(name, text);
    if (written.isSuccess()) {
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
  private _readCommitted(id: TaskId): TaskResult<IReadRecord | undefined> {
    const usable: TaskResult<true> = this._usable();
    if (usable.isFailure()) {
      return propagate(usable);
    }
    const projection: ITaskProjection | undefined = this._tasks.get(id);
    if (projection === undefined) {
      return ok(undefined);
    }
    const name: string = recordName('task', id);
    const limit: number = taskRecordLimit(this.profile);
    const read: Result<IReadRecord> = this._store
      .read(name)
      .onSuccess((text) => {
        const bytes: number = utf8Length(text);
        return bytes > limit
          ? fail<{ text: string; bytes: number }>(`${name}: ${bytes} bytes exceeds ${limit}`)
          : succeed({ text, bytes });
      })
      .onSuccess(({ text, bytes }) =>
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
      return taskFailure(read.message, 'storage-corrupt', 'after-host-action');
    }
    return ok(read.value);
  }
}
