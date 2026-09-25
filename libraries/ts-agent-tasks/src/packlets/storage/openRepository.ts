/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Converter, Converters, Result, captureResult, fail, succeed } from '@fgv/ts-utils';
import { TaskConverters, taskListDetails } from '../converters';
import {
  IPendingConsumerEntry,
  IPendingInventoryEntry,
  IStoredCatalogOperation,
  ITaskCheckpointStore,
  ITaskConsumerRecord,
  ITaskUpdate,
  SubscriptionId,
  UpdateId,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskRecoveryIssue,
  ITaskEnvironment,
  ITaskKindRegistry,
  ITaskRecoveryReport,
  ITaskRepositoryManifest,
  ITaskSourceRecord,
  OperationId,
  TaskId,
  TaskInventoryRecordKind,
  TaskRecoveryIssueCode,
  TaskResult,
  defaultTaskCapacityProfile,
  taskListDetailVersion,
  taskListKind,
  taskStorageFormatVersion
} from '../types';
import { CheckpointPort, FileTreeCheckpointStore, IConsumerRead } from './checkpoints';
import { checkSubscriptionClaims, checkTaskClaims, withOwnership } from './claims';
import { firstRecordProblem, pendingEntryOf } from './consumerRecords';
import { DeliveryBook } from './deliveryBook';
import {
  checkBounds,
  checkCreationEvidence,
  checkOperationCount,
  checkPendingIdentity,
  checkRegistrationDraft,
  commandSettlement,
  hasUnsettledCommand,
  pendingIdentity,
  registrationIdentity,
  sourceIdOf,
  updatesOf
} from './commitRules';
import { classify, mintId, ok, propagate, taskFailure, writeRetry } from './failures';
import {
  canonicallyEqual,
  encodeRecord,
  fingerprintOf,
  manifestName,
  parseJson,
  parseRecordName,
  recordName,
  utf8Length
} from './layout';
import { CapacityLedger } from './ledger';
import {
  ITaskRecordCacheOptions,
  ITaskRecoveryHandle,
  ITaskRepository,
  ITaskRepositoryOpenParams,
  TaskRepositoryMode,
  TaskRepositoryOpenResult
} from './model';
import {
  ITaskProjection,
  isTerminalRecord,
  ledgerEntry,
  manifestEntry,
  sourceEntry,
  pendingEntry,
  projectRecord,
  recordLimitFor,
  taskKey,
  taskRecordLimit,
  taskUsage
} from './projection';
import { RecordStore } from './recordStore';
import { IRootOwnership, acquireRoot } from './rootOwnership';
import {
  ISubscriptionState,
  preparationBytes,
  subscriptionKey,
  subscriptionState,
  valueBytes
} from './subscriptions';
import { IndexContent, TaskIndex } from './taskIndex';
import { MaterializationGate, maxRecordCacheBytes, maxRecordCacheEntries } from './workingSet';

type Guarantee = FileTree.AtomicWriteGuarantee;

/**
 * Everything a scan of the root establishes, handed to the repository it opens.
 * @internal
 */
export interface IRepositoryState {
  readonly store: RecordStore;
  readonly ownership: IRootOwnership;
  readonly converters: TaskConverters;
  readonly registry: ITaskKindRegistry;
  readonly environment: ITaskEnvironment;
  readonly mode: TaskRepositoryMode;
  readonly manifest: ITaskRepositoryManifest;
  /** The manifest's exact committed text, so the instance can tell if it changes underneath. */
  readonly manifestText: string;
  readonly tasks: Map<TaskId, ITaskProjection>;
  readonly pending: Map<string, IPendingInventoryEntry>;
  readonly sources: Map<string, ISourceRecordState>;
  readonly ledger: CapacityLedger;
  readonly report: ITaskRecoveryReport;
  readonly index: TaskIndex;
  readonly evidence: IScanEvidence;
  readonly gate: MaterializationGate;
  readonly recordCache?: ITaskRecordCacheOptions;
  /** Subscriptions, pending registrations and potential audiences (T7). */
  readonly book: DeliveryBook;
  readonly checkpoints: CheckpointPort;
  readonly defaultCheckpoints: boolean;
}

const modeConverter: Converter<TaskRepositoryMode> = Converters.oneOf<TaskRepositoryMode>([
  Converters.literal('session'),
  Converters.strictObject<{ durable: 'process-crash' }>({ durable: Converters.literal('process-crash') })
]);

/** Resolves a mode to the guarantee it requests, refusing anything else before any I/O. */
function _guarantee(mode: unknown): TaskResult<Guarantee> {
  const converted: Result<TaskRepositoryMode> = modeConverter.convert(mode);
  if (converted.isFailure()) {
    return taskFailure(
      `mode: only 'session' and { durable: 'process-crash' } are supported; OS-crash and power-loss ` +
        `durability are not offered`,
      'unsupported',
      'after-host-action'
    );
  }
  return ok(converted.value === 'session' ? 'session' : 'process-crash');
}

interface IAcquired {
  readonly store: RecordStore;
  readonly ownership: IRootOwnership;
  readonly converters: TaskConverters;
  readonly mode: TaskRepositoryMode;
  readonly removed: ReadonlyArray<string>;
  readonly names: ReadonlyArray<string>;
  readonly checkpoints: CheckpointPort;
  /** Subscription records live in the root itself, so their files are expected there. */
  readonly defaultCheckpoints: boolean;
}

/**
 * The common front half of open and initialize: resolve the mode, bind the store (refusing an
 * unqualified root), take exclusive in-process ownership, freeze the registry, reclaim
 * interrupted writes' working files — valid only now, under exclusive ownership — and list.
 */
function _acquire(params: ITaskRepositoryOpenParams): TaskResult<IAcquired> {
  return classify(
    params.converters !== undefined ? ok(params.converters) : TaskConverters.create(),
    'invalid',
    'after-host-action'
  ).onSuccess((converters) => _acquireWith(params, converters));
}

const recordCacheConverter: Converter<ITaskRecordCacheOptions> =
  Converters.strictObject<ITaskRecordCacheOptions>({
    maxEntries: Converters.number.withConstraint(
      (n: number) => Number.isSafeInteger(n) && n >= 1 && n <= maxRecordCacheEntries
    ),
    maxEncodedBytes: Converters.number.withConstraint(
      (n: number) => Number.isSafeInteger(n) && n >= 1 && n <= maxRecordCacheBytes
    )
  });

function _acquireWith(params: ITaskRepositoryOpenParams, converters: TaskConverters): TaskResult<IAcquired> {
  if (params.recordCache !== undefined && recordCacheConverter.convert(params.recordCache).isFailure()) {
    return taskFailure(
      `recordCache: at most ${maxRecordCacheEntries} entries and ${maxRecordCacheBytes} encoded bytes, each at least 1`,
      'invalid',
      'after-host-action'
    );
  }
  return _guarantee(params.mode).onSuccess((guarantee) => {
    const store: Result<RecordStore> = RecordStore.create(params.root, guarantee);
    if (store.isFailure()) {
      return taskFailure<IAcquired>(store.message, 'unsupported', 'after-host-action');
    }
    const ownership: Result<IRootOwnership> = acquireRoot(store.value.root, guarantee !== 'session');
    if (ownership.isFailure()) {
      return taskFailure<IAcquired>(ownership.message, 'conflict', 'after-host-action');
    }
    // A registry that will not freeze could change kinds under committed data; refuse.
    const frozen: Result<number> = params.registry.freeze();
    if (frozen.isFailure()) {
      ownership.value.release();
      return taskFailure<IAcquired>(
        `the kind registry could not be frozen: ${frozen.message}`,
        'invalid',
        'after-host-action'
      );
    }
    // A host store's durability is host data like anything else it answers.
    const checkpointStore: ITaskCheckpointStore =
      params.checkpoints ?? new FileTreeCheckpointStore(store.value);
    const durability: Result<string> = captureResult(() => checkpointStore.durability).onSuccess((d) =>
      Converters.enumeratedValue<string>(['session', 'process-crash']).convert(d)
    );
    if (durability.isFailure() || (guarantee !== 'session' && durability.value !== 'process-crash')) {
      ownership.value.release();
      return taskFailure<IAcquired>(
        `the checkpoint store is not process-crash durable, so it cannot hold the checkpoints of a ` +
          `process-crash repository`,
        'unsupported',
        'after-host-action'
      );
    }
    const listed: Result<{ removed: ReadonlyArray<string>; names: ReadonlyArray<string> }> = store.value
      .cleanup()
      .onSuccess((removed) => store.value.list().onSuccess((names) => ok({ removed, names })));
    if (listed.isFailure()) {
      ownership.value.release();
      return taskFailure<IAcquired>(listed.message, 'storage-unavailable', 'safe');
    }
    return ok<IAcquired>({
      store: store.value,
      ownership: ownership.value,
      converters,
      mode: guarantee === 'session' ? 'session' : { durable: 'process-crash' },
      removed: listed.value.removed,
      names: listed.value.names,
      checkpoints: new CheckpointPort(checkpointStore, converters.delivery.consumerRecord),
      defaultCheckpoints: params.checkpoints === undefined
    });
  });
}

/**
 * Builds the repository a successful open or initialize returns.
 * @internal
 */
export type RepositoryFactory = (state: IRepositoryState) => ITaskRepository;

/**
 * Creates a new repository in an empty root.
 * @internal
 */
export function initializeRepository(
  params: ITaskRepositoryOpenParams,
  factory: RepositoryFactory
): TaskResult<ITaskRepository> {
  return _acquire(params).onSuccess((acquired) => {
    const refuse = (message: string, code: 'conflict' | 'invalid'): TaskResult<ITaskRepository> => {
      acquired.ownership.release();
      return taskFailure(message, code, 'after-host-action');
    };
    if (acquired.names.includes(manifestName)) {
      return refuse(`initialize: the root already holds a repository; open it instead`, 'conflict');
    }
    if (acquired.names.length > 0) {
      return refuse(
        `initialize: the root is not empty (${acquired.names.slice(0, 5).join(', ')}); a repository is ` +
          `only ever initialized into an empty root`,
        'invalid'
      );
    }
    const converters: TaskConverters = acquired.converters;
    const created: Result<{ manifest: ITaskRepositoryManifest; text: string; bytes: number }> =
      converters.capacity.profile
        .convert(params.profile ?? defaultTaskCapacityProfile)
        .onSuccess((profile) =>
          mintId(params.environment)
            .onSuccess((raw) => converters.ids.identifier.convert(raw))
            .onSuccess((repositoryId) =>
              converters.storage.manifest.convert({
                formatVersion: taskStorageFormatVersion,
                repositoryId,
                manifestRevision: 1,
                profile,
                tasks: [],
                consumers: [],
                sources: []
              })
            )
        )
        .onSuccess((manifest) => encodeRecord(manifest).onSuccess((encoded) => ok({ manifest, ...encoded })));
    if (created.isFailure()) {
      return refuse(`initialize: ${created.message}`, 'invalid');
    }
    const profile: ITaskCapacityProfile = created.value.manifest.profile;
    // Seeded with an empty manifest, so the real one is admitted as growth against the profile.
    const ledger: CapacityLedger = new CapacityLedger(profile, manifestEntry(0, profile));
    const admitted: TaskResult<true> = ledger.admit(
      new Map([['repository', manifestEntry(created.value.bytes, profile)]])
    );
    if (admitted.isFailure()) {
      acquired.ownership.release();
      return propagate(admitted);
    }
    const written = acquired.store.write(manifestName, created.value.text);
    if (written.isFailure()) {
      acquired.ownership.release();
      return taskFailure<ITaskRepository>(
        `initialize: ${written.message}`,
        'storage-unavailable',
        writeRetry(written.detail)
      );
    }
    const listed: Result<ReadonlyArray<string>> = acquired.store.list();
    if (listed.isFailure()) {
      acquired.ownership.release();
      return taskFailure<ITaskRepository>(
        `initialize: ${listed.message}`,
        'storage-unavailable',
        'reconcile-first'
      );
    }
    ledger.apply(new Map([['repository', manifestEntry(created.value.bytes, profile)]]));
    return ok<ITaskRepository>(
      factory({
        store: acquired.store,
        ownership: acquired.ownership,
        converters,
        registry: params.registry,
        environment: params.environment,
        mode: acquired.mode,
        manifest: created.value.manifest,
        manifestText: created.value.text,
        tasks: new Map(),
        pending: new Map(),
        sources: new Map(),
        ledger,
        index: new TaskIndex(),
        evidence: {
          taskPassReads: 0,
          consumerPassReads: 0,
          sourcePassReads: 0,
          selectedPassReads: 0,
          graphMarks: 0,
          owedDescriptors: 0
        },
        gate: new MaterializationGate(),
        recordCache: params.recordCache,
        book: new DeliveryBook(new Map(), new Map()),
        checkpoints: acquired.checkpoints,
        defaultCheckpoints: acquired.defaultCheckpoints,
        report: {
          repositoryId: created.value.manifest.repositoryId,
          issues: [],
          completedRegistrations: [],
          pendingRegistrations: [],
          completedSubscriptions: [],
          pendingSubscriptions: [],
          removedTemporaries: acquired.removed
        }
      })
    );
  });
}

/**
 * Accumulates what a scan finds.
 */
class Scan {
  public readonly issues: ITaskRecoveryIssue[] = [];

  public blocking(code: TaskRecoveryIssueCode, message: string, recordName?: string): void {
    this.issues.push({
      code,
      severity: 'blocking',
      message,
      ...(recordName !== undefined ? { recordName } : {})
    });
  }

  public advisory(code: TaskRecoveryIssueCode, message: string, recordName: string): void {
    this.issues.push({ code, severity: 'advisory', message, recordName });
  }

  public get isBlocked(): boolean {
    return this.issues.some((issue) => issue.severity === 'blocking');
  }
}

/**
 * Reads and parses one file the caller knows is present, classifying failures. `undefined`
 * means the problem has been reported.
 */
function _readJson(
  store: RecordStore,
  scan: Scan,
  name: string,
  limit: number | undefined
): { readonly parsed: unknown; readonly text: string; readonly bytes: number } | undefined {
  const text: Result<string> = store.read(name);
  if (text.isFailure()) {
    scan.blocking('unreadable', text.message, name);
    return undefined;
  }
  const bytes: number = utf8Length(text.value);
  if (limit !== undefined && bytes > limit) {
    scan.blocking('record-invalid', `${name}: ${bytes} bytes exceeds its ceiling of ${limit}`, name);
    return undefined;
  }
  const parsed: Result<unknown> = parseJson(text.value);
  if (parsed.isFailure()) {
    scan.blocking('unreadable', `${name}: not JSON: ${parsed.message}`, name);
    return undefined;
  }
  return { parsed: parsed.value, text: text.value, bytes };
}

/**
 * Converts, distinguishing a newer storage format from corruption. A record of an unknown
 * format version is retained untouched and blocks — the ledger cannot account for what it
 * cannot read — but it is reported as what it is.
 */
function _convertVersioned<T>(
  converters: TaskConverters,
  scan: Scan,
  name: string,
  parsed: unknown,
  convert: (from: unknown) => Result<T>,
  invalidCode: TaskRecoveryIssueCode
): T | undefined {
  const version: Result<number> = converters.storage.formatVersion.convert(parsed);
  if (version.isSuccess() && version.value !== taskStorageFormatVersion) {
    scan.blocking(
      'unknown-format-version',
      `${name}: storage format ${version.value} is not readable by this release; retained untouched`,
      name
    );
    return undefined;
  }
  const converted: Result<T> = convert(parsed);
  if (converted.isFailure()) {
    scan.blocking(invalidCode, `${name}: ${converted.message}`, name);
    return undefined;
  }
  return converted.value;
}

/**
 * Opens an existing repository.
 *
 * @remarks
 * Validates the manifest, every named record, filename/ID agreement, format versions,
 * revisions, operation identities and the parent graph before anything is writable. Never
 * initializes over a missing manifest, and performs no source I/O of any kind: external work
 * is neither started nor reattached by opening. The only writes open ever performs complete
 * pending registrations whose record is already present (design §8.3, step 3).
 * @internal
 */
export function openRepository(
  params: ITaskRepositoryOpenParams,
  factory: RepositoryFactory
): TaskResult<TaskRepositoryOpenResult> {
  return _acquire(params).onSuccess((acquired) => {
    const result: TaskResult<TaskRepositoryOpenResult> = _scan(params, acquired, factory);
    if (result.isFailure()) {
      acquired.ownership.release();
    }
    return result;
  });
}

/**
 * Step 3 of the registration protocol, for registrations whose record landed before the
 * process died: one manifest write marking them live. The only write open performs.
 */
function _completeRegistrations(
  store: RecordStore,
  converters: TaskConverters,
  scanned: { manifest: ITaskRepositoryManifest; text: string },
  done: ReadonlySet<string>,
  doneConsumers: ReadonlySet<string>
): TaskResult<{ manifest: ITaskRepositoryManifest; bytes: number; text: string }> {
  const manifest: ITaskRepositoryManifest = scanned.manifest;
  // The one write open performs is fenced like every other manifest rewrite: the manifest on
  // disk must still be the one the scan validated, or the write would erase whatever changed.
  const current: Result<string> = store.list().onSuccess(() => store.read(manifestName));
  if (current.isFailure()) {
    return taskFailure(
      `open: ${manifestName} cannot be re-read before completing registrations: ${current.message}`,
      'storage-unavailable',
      'safe'
    );
  }
  if (current.value !== scanned.text) {
    return taskFailure(
      `open: ${manifestName} changed after it was scanned; nothing was written`,
      'storage-corrupt',
      'after-host-action'
    );
  }
  const next: ITaskRepositoryManifest = {
    ...manifest,
    manifestRevision: manifest.manifestRevision + 1,
    tasks: manifest.tasks.map((entry) => (done.has(entry.id) ? { id: entry.id, state: 'live' } : entry)),
    consumers: manifest.consumers.map((entry) =>
      doneConsumers.has(entry.id) ? { id: entry.id, state: 'live' } : entry
    )
  };
  return classify(
    encodeRecord(next)
      .onSuccess((encoded) => parseJson(encoded.text))
      .onSuccess((parsed) => converters.storage.manifest.convert(parsed))
      .onSuccess(encodeRecord),
    'storage-corrupt',
    'after-host-action'
  ).onSuccess((encoded) => {
    const written = store.write(manifestName, encoded.text);
    return written.isSuccess()
      ? ok({ manifest: next, bytes: encoded.bytes, text: encoded.text })
      : taskFailure<{ manifest: ITaskRepositoryManifest; bytes: number; text: string }>(
          `open: completing pending registrations failed: ${written.message}`,
          'storage-unavailable',
          writeRetry(written.detail)
        );
  });
}

function _recovery(acquired: IAcquired, report: ITaskRecoveryReport): TaskResult<TaskRepositoryOpenResult> {
  let closed: boolean = false;
  const recovery: ITaskRecoveryHandle = {
    report,
    readRaw: (name: string): Result<string> => {
      if (closed) {
        return fail(`recovery: closed`);
      }
      return acquired.store.read(name);
    },
    close: (): Result<boolean> => {
      if (closed) {
        return ok(false);
      }
      closed = true;
      acquired.ownership.release();
      return ok(true);
    }
  };
  return ok<TaskRepositoryOpenResult>({ state: 'recovery-required', recovery });
}

function _scan(
  params: ITaskRepositoryOpenParams,
  acquired: IAcquired,
  factory: RepositoryFactory
): TaskResult<TaskRepositoryOpenResult> {
  const gate: MaterializationGate = new MaterializationGate();
  return scanRoot({
    store: acquired.store,
    converters: acquired.converters,
    registry: params.registry,
    removed: acquired.removed,
    names: acquired.names,
    expectedProfile: params.profile,
    gate,
    checkpoints: acquired.checkpoints,
    defaultCheckpoints: acquired.defaultCheckpoints
  }).onSuccess((outcome) => {
    if (outcome.state === 'blocked') {
      return _recovery(acquired, outcome.report);
    }
    const state: IRepositoryState = {
      ...outcome.scanned,
      store: acquired.store,
      ownership: acquired.ownership,
      converters: acquired.converters,
      registry: params.registry,
      environment: params.environment,
      mode: acquired.mode,
      gate,
      recordCache: params.recordCache,
      checkpoints: acquired.checkpoints,
      defaultCheckpoints: acquired.defaultCheckpoints
    };
    return ok<TaskRepositoryOpenResult>({ state: 'ready', repository: factory(state) });
  });
}

/**
 * What a scan needs: a store already listed (and, at exclusive open or rebuild, cleaned of
 * interrupted working files), the converters and registry, and the gate every record parse
 * passes through.
 * @internal
 */
export interface IScanInput {
  readonly store: RecordStore;
  readonly converters: TaskConverters;
  readonly registry: ITaskKindRegistry;
  readonly removed: ReadonlyArray<string>;
  readonly names: ReadonlyArray<string>;
  /** On open, the profile the host expects; any difference refuses. Absent on rebuild. */
  readonly expectedProfile?: ITaskCapacityProfile;
  readonly gate: MaterializationGate;
  readonly checkpoints: CheckpointPort;
  readonly defaultCheckpoints: boolean;
}

/**
 * Everything a successful scan establishes.
 * @internal
 */
export interface IScanned {
  readonly manifest: ITaskRepositoryManifest;
  readonly manifestText: string;
  readonly tasks: Map<TaskId, ITaskProjection>;
  readonly pending: Map<string, IPendingInventoryEntry>;
  readonly sources: Map<string, ISourceRecordState>;
  readonly ledger: CapacityLedger;
  readonly index: TaskIndex;
  readonly report: ITaskRecoveryReport;
  readonly evidence: IScanEvidence;
  readonly book: DeliveryBook;
}

/**
 * A committed source-checkpoint record as the repository holds it: small, bounded (at most the
 * source-record bound), and resident for the repository's lifetime.
 * @internal
 */
export interface ISourceRecordState {
  readonly record: ITaskSourceRecord;
  readonly fingerprint: string;
  readonly bytes: number;
}

/**
 * What a scan did, for the counter evidence: records read in each pass, the graph-validation
 * workspace, and the most records ever parsed at once.
 * @internal
 */
export interface IScanEvidence {
  readonly taskPassReads: number;
  readonly consumerPassReads: number;
  readonly sourcePassReads: number;
  readonly selectedPassReads: number;
  readonly graphMarks: number;
  readonly owedDescriptors: number;
}

/**
 * The outcome of a scan: a healthy projection, or the blocking problems that prevent one.
 * @internal
 */
export type ScanOutcome =
  | { readonly state: 'ready'; readonly scanned: IScanned }
  | { readonly state: 'blocked'; readonly report: ITaskRecoveryReport };

/**
 * Builds one generation of the resident projection from the committed records, in bounded
 * sequential passes (design §7, *Bounded open/rebuild*).
 *
 * @remarks
 * 1. **Task pass.** The manifest, then each task record one at a time: validated exactly as
 *    open always has, projected into the minimal entry and the query index, and its owed updates
 *    reduced to **descriptors without payloads**. The parsed record is released before the next
 *    is read. No all-record array exists at any point.
 * 2. **Consumer and source pass.** One record at a time. This release validates their headers
 *    only; the exact-acknowledgement join that decides which descriptors are already satisfied
 *    belongs to subscriptions, so every audience link is owed.
 * 3. **Graph validation**, O(N + E): one mark per task.
 * 4. **Selected-task pass.** Only records holding owed descriptors are re-read, each checked
 *    against the fingerprint the task pass saw, and only their owed payloads are kept.
 *
 * Open and rebuild both run this; the only write it performs is completing pending registrations
 * whose record already landed.
 * @internal
 */
export function scanRoot(input: IScanInput): TaskResult<ScanOutcome> {
  const { store, converters, gate } = input;
  const scan: Scan = new Scan();
  const acquired = input;
  const params = { registry: input.registry, profile: input.expectedProfile };
  const readsBefore = { ...store.reads };
  const baseReport = (): ITaskRecoveryReport => ({
    issues: scan.issues,
    completedRegistrations: [],
    pendingRegistrations: [],
    completedSubscriptions: [],
    pendingSubscriptions: [],
    removedTemporaries: acquired.removed
  });

  // ---- the manifest ----
  if (!acquired.names.includes(manifestName)) {
    if (acquired.names.length === 0) {
      return taskFailure(
        `open: the root holds no repository; initialize one explicitly`,
        'storage-unavailable',
        'after-host-action'
      );
    }
    scan.blocking(
      'manifest-missing',
      `${manifestName} is missing from a root that holds ${acquired.names.length} other file(s); ` +
        `a repository is never initialized over existing content`
    );
    return ok<ScanOutcome>({ state: 'blocked', report: baseReport() });
  }
  const manifestRead = _readJson(store, scan, manifestName, undefined);
  const manifest: ITaskRepositoryManifest | undefined =
    manifestRead === undefined
      ? undefined
      : _convertVersioned(
          converters,
          scan,
          manifestName,
          manifestRead.parsed,
          (from) => converters.storage.manifest.convert(from),
          'manifest-invalid'
        );
  if (manifest === undefined || manifestRead === undefined) {
    return ok<ScanOutcome>({ state: 'blocked', report: baseReport() });
  }
  const profile: ITaskCapacityProfile = manifest.profile;

  // A host's configuration never reinterprets a stored repository: any difference, lower or
  // higher, refuses the open and leaves the stored policy exactly as it was.
  if (params.profile !== undefined) {
    if (!canonicallyEqual(params.profile, profile)) {
      return taskFailure(
        `open: the requested capacity profile differs from the stored one; the stored profile governs, ` +
          `and raising it is an explicit operation (lowering is unsupported)`,
        'unsupported',
        'after-host-action'
      );
    }
  }

  const ledger: CapacityLedger = new CapacityLedger(profile, manifestEntry(manifestRead.bytes, profile));
  const tasks: Map<TaskId, ITaskProjection> = new Map<TaskId, ITaskProjection>();
  const pending: Map<string, IPendingInventoryEntry> = new Map<string, IPendingInventoryEntry>();
  const completed: TaskId[] = [];
  const stillPending: Array<{ taskId: TaskId; operationId: OperationId }> = [];
  const claimOwners: Map<string, string> = new Map<string, string>();
  const index: TaskIndex = new TaskIndex();
  // Pass 1 keeps only which tasks owe updates, and how many links: never a payload.
  const owedTasks: TaskId[] = [];
  let owedDescriptors: number = 0;
  // Pass 1's owed-link descriptors, which the consumer pass joins acknowledgements against.
  const linkDescriptors: Map<UpdateId, ReadonlyArray<SubscriptionId>> = new Map();
  const named: Set<string> = new Set<string>([manifestName]);
  // Every task the inventory names live, whether or not its record validated: a child of a
  // parent whose record is already reported broken is not *also* a dangling edge. A pending
  // entry is not an accepted task — registration never admits a child under one — so it joins
  // only once its registration is completed below.
  const inventoried: Set<string> = new Set<string>(
    manifest.tasks.filter((entry) => entry.state === 'live').map((entry) => entry.id)
  );

  const noteClaims = (owner: string, claimIds: ReadonlyArray<string>): void => {
    for (const claimId of claimIds) {
      const other: string | undefined = claimOwners.get(claimId);
      if (other !== undefined) {
        scan.blocking('integrity', `claim ${claimId} is held by both ${other} and ${owner}`);
      }
      claimOwners.set(claimId, owner);
    }
  };

  // A pending external registration names its source only in its stored request.
  const pendingSource = (entry: IPendingInventoryEntry): { sourceId?: string } => {
    const request = converters.broker.registerExternal.convert(entry.request);
    return request.isSuccess() ? { sourceId: request.value.binding.sourceId } : {};
  };

  // ---- task records ----
  const recordLimit: number = taskRecordLimit(profile);
  for (const entry of manifest.tasks) {
    const name: string = recordName('task', entry.id);
    named.add(name);
    // The manifest converter validated every entry id with the same bounded identifier syntax
    // the task-id converter applies, so this is a brand, not an unchecked assertion.
    const taskId: TaskId = entry.id as TaskId;
    const present: boolean = store.has(name);

    if (!present) {
      if (entry.state === 'live') {
        scan.blocking('record-missing', `${name}: named live by the inventory but missing`, name);
      } else {
        // Pending with no record: an incomplete registration, not an accepted task. Its
        // reservations stay held until the host resumes it.
        const pendingClaims: Result<true> = checkPendingIdentity(entry, profile).onSuccess(() =>
          checkTaskClaims(
            entry.capacityClaims,
            {
              taskId,
              ownership: 'pending',
              unresolved: entry.recordType === 'unresolved',
              external: entry.operation === 'register-external',
              archived: false,
              // A pending registration's record does not exist yet, so it holds no command.
              commands: new Map(),
              ...pendingSource(entry)
            },
            profile
          )
        );
        if (pendingClaims.isFailure()) {
          scan.blocking('integrity', `${name}: pending registration: ${pendingClaims.message}`, name);
          continue;
        }
        scan.advisory(
          'pending-registration',
          `${taskId}: registration '${entry.operationId}' was accepted into the inventory but its record ` +
            `was never written; retry the same registration to complete it`,
          name
        );
        pending.set(taskId, entry);
        stillPending.push({ taskId, operationId: entry.operationId });
        ledger.apply(new Map([[taskKey(taskId), pendingEntry(entry, recordLimit)]]));
        noteClaims(
          `pending ${taskId}`,
          entry.capacityClaims.map((c) => c.claimId)
        );
      }
      continue;
    }

    const materialized = gate.track(() => {
      const text = _readJson(store, scan, name, recordLimit);
      return {
        read: text,
        record:
          text === undefined
            ? undefined
            : _convertVersioned(
                converters,
                scan,
                name,
                text.parsed,
                (from) => converters.storage.record.convert(from),
                'record-invalid'
              )
      };
    });
    const read = materialized.read;
    const record: ITaskCommitRecord | undefined = materialized.record;
    if (read === undefined) {
      continue;
    }
    if (record === undefined) {
      continue;
    }
    const recordId: string = record.recordType === 'resolved' ? record.task.envelope.id : record.reference.id;
    if (recordId !== taskId) {
      scan.blocking('record-id-mismatch', `${name}: holds task ${recordId}`, name);
      continue;
    }
    // The per-value maxima the closeout claims were sized against hold for a stored record as
    // they do for a draft: a record under its total ceiling can still hold one value over them.
    const bounded: Result<IStoredCatalogOperation> = checkCreationEvidence(record).onSuccess((creation) =>
      checkBounds(record, profile)
        .onSuccess(() => checkOperationCount(record, profile))
        .onSuccess(() => succeed(creation))
    );
    if (bounded.isFailure()) {
      scan.blocking('record-invalid', `${name}: ${bounded.message}`, name);
      continue;
    }
    const claimed: Result<true> = checkTaskClaims(
      record.capacityClaims,
      {
        taskId,
        ownership: 'live',
        unresolved: record.recordType === 'unresolved',
        external: bounded.value.operation === 'register-external',
        archived: record.recordType === 'resolved' && record.archived,
        terminal: isTerminalRecord(record),
        ...(sourceIdOf(record) !== undefined ? { sourceId: sourceIdOf(record) } : {}),
        commands: commandSettlement(record)
      },
      profile
    );
    if (claimed.isFailure()) {
      scan.blocking('integrity', `${name}: ${claimed.message}`, name);
      continue;
    }

    // An unregistered kind is quarantined, never rewritten; a registered one must convert.
    const kind = record.recordType === 'resolved' ? record.task.envelope : record.reference;
    const known: boolean = params.registry.has(kind.kind, kind.detailVersion);
    if (!known) {
      scan.advisory(
        'unknown-kind',
        `${name}: ${kind.kind}@${kind.detailVersion} is not registered; quarantined and never rewritten ` +
          `until the kind is registered`,
        name
      );
    } else if (record.recordType === 'resolved') {
      const converted = params.registry.convert(record.task);
      if (converted.isFailure()) {
        scan.blocking('record-invalid', `${name}: ${converted.message}`, name);
        continue;
      }
    }

    if (entry.state === 'pending') {
      // Pending with a present record: the protocol died after step 2. Complete step 3, but
      // only if the record really is this registration — same operation, same claims.
      // The record holds exactly the entry's claims, moved to live ownership and otherwise
      // unchanged: its first write spends nothing.
      const sameClaims: boolean = canonicallyEqual(
        withOwnership(entry.capacityClaims, 'live'),
        record.capacityClaims
      );
      const sameCreation: Result<true> = checkRegistrationDraft(
        record,
        entry.operationId,
        entry.request
      ).onSuccess((creation) =>
        record.recordRevision !== 1
          ? fail<true>(`it is record revision ${record.recordRevision}, not the first record`)
          : canonicallyEqual(registrationIdentity(record, creation), pendingIdentity(entry))
          ? succeed<true>(true)
          : fail<true>(`its creation operation's catalog operation, principal or record type differs`)
      );
      if (!sameClaims || sameCreation.isFailure()) {
        scan.blocking(
          'integrity',
          `${name}: present for pending registration '${entry.operationId}' but is not that registration's ` +
            `first record: ${sameCreation.isFailure() ? sameCreation.message : 'its claims differ'}`,
          name
        );
        continue;
      }
      completed.push(taskId);
      inventoried.add(taskId);
    }

    const indexed: Result<true> = index.put(taskId, _indexContent(record, known));
    if (indexed.isFailure()) {
      scan.blocking('integrity', `${name}: ${indexed.message}`, name);
      continue;
    }
    const links: number = updatesOf(record).reduce((total, update) => total + update.audience.length, 0);
    if (links > 0) {
      owedTasks.push(taskId);
      owedDescriptors += links;
      // A descriptor is the link's identity only — update id and audience — never the payload.
      for (const update of updatesOf(record)) {
        if (update.audience.length > 0) {
          linkDescriptors.set(update.id, update.audience);
        }
      }
    }
    tasks.set(taskId, projectRecord(record, known, read.text));
    ledger.apply(
      new Map([
        [
          taskKey(taskId),
          ledgerEntry(taskId, taskUsage(record, read.bytes), record.capacityClaims, recordLimit)
        ]
      ])
    );
    noteClaims(
      taskId,
      record.capacityClaims.map((c) => c.claimId)
    );
  }

  // ---- consumer records, one at a time, through the checkpoint store (T7) ----
  const consumers = _scanConsumers({
    scan,
    manifest,
    profile,
    checkpoints: input.checkpoints,
    linkDescriptors,
    named: input.defaultCheckpoints ? named : undefined,
    gate,
    formatVersion: converters.storage.formatVersion
  });
  for (const [id, entry] of consumers.pending) {
    ledger.apply(new Map([[subscriptionKey(id), pendingEntryOf(entry, profile)]]));
    noteClaims(
      `pending subscription ${id}`,
      entry.capacityClaims.map((c) => c.claimId)
    );
  }
  for (const [id, state] of consumers.subscriptions) {
    noteClaims(
      `subscription ${id}`,
      state.claims.map((c) => c.claimId)
    );
  }
  // A link must name a live subscription: an audience member nobody can ever acknowledge for is an
  // obligation with no owner.
  for (const [updateId, audience] of linkDescriptors) {
    const unknown: SubscriptionId | undefined = audience.find((id) => !consumers.subscriptions.has(id));
    if (unknown !== undefined) {
      scan.blocking(
        'integrity',
        `update ${updateId}: its audience names ${unknown}, which is not a live subscription`
      );
    }
  }

  // ---- source records, in full ----
  const sources: Map<string, ISourceRecordState> = new Map<string, ISourceRecordState>();
  const opaque = (kind: 'source', entries: ITaskRepositoryManifest['sources']): void => {
    for (const entry of entries) {
      const name: string = recordName(kind, entry.id);
      named.add(name);
      if (entry.state === 'pending') {
        // Nothing in this release writes one; a pending entry here came from a later writer.
        scan.blocking(
          'record-invalid',
          `${name}: pending ${kind} registrations are not readable by this release`,
          name
        );
        continue;
      }
      if (!store.has(name)) {
        scan.blocking('record-missing', `${name}: named live by the inventory but missing`, name);
        continue;
      }
      const limit: number = profile.encoded.maxSourceRecordBytes;
      // Counted like every other record parse: a re-entrant read from host accessor code during
      // this pass must see it in flight.
      const materialized = gate.track(() => {
        const text = _readJson(store, scan, name, Math.min(limit, profile.limits['record-bytes']));
        return {
          read: text,
          converted:
            text === undefined
              ? undefined
              : _convertVersioned<ITaskSourceRecord>(
                  converters,
                  scan,
                  name,
                  text.parsed,
                  (from) =>
                    converters.storage.sourceRecord
                      .convert(from)
                      .onSuccess((record) =>
                        utf8Length(record.cursor ?? '') > profile.encoded.maxSourceCursorBytes
                          ? fail<ITaskSourceRecord>(
                              `its cursor is over the bound of ${profile.encoded.maxSourceCursorBytes} bytes`
                            )
                          : succeed(record)
                      ),
                  'record-invalid'
                )
        };
      });
      const read = materialized.read;
      const converted = materialized.converted;
      if (read === undefined || converted === undefined) {
        continue;
      }
      if (converted.id !== entry.id) {
        scan.blocking('record-id-mismatch', `${name}: holds ${kind} ${converted.id}`, name);
        continue;
      }
      sources.set(entry.id, {
        record: converted,
        fingerprint: fingerprintOf(read.text),
        bytes: read.bytes
      });
      ledger.apply(new Map([[`${kind}:${entry.id}`, sourceEntry(entry.id, read.bytes, profile)]]));
    }
  };
  opaque('source', manifest.sources);

  // ---- anything record-shaped the inventory does not name ----
  for (const name of acquired.names) {
    if (!named.has(name)) {
      const parsedName: { kind: TaskInventoryRecordKind; id: string } | undefined = parseRecordName(name);
      scan.advisory(
        'unexpected-record',
        parsedName !== undefined
          ? `${name}: a ${parsedName.kind} record the inventory does not name; registration never writes one, left untouched`
          : `${name}: not a repository file; left untouched`,
        name
      );
    }
  }

  // ---- the graph ----
  for (const projection of tasks.values()) {
    if (projection.parentId !== undefined && !inventoried.has(projection.parentId)) {
      scan.blocking('integrity', `task ${projection.id}: parent ${projection.parentId} is not a live task`);
    }
  }
  // One mark per task: 1 while its parent chain is being walked, 2 once known acyclic. Every
  // task is walked once, so validation is O(N + E), never O(N x depth).
  const marks: Map<TaskId, 1 | 2> = new Map<TaskId, 1 | 2>();
  for (const start of tasks.keys()) {
    const path: TaskId[] = [];
    let cursor: TaskId | undefined = start;
    while (cursor !== undefined && !marks.has(cursor)) {
      marks.set(cursor, 1);
      path.push(cursor);
      cursor = tasks.get(cursor)?.parentId;
    }
    if (cursor !== undefined && marks.get(cursor) === 1) {
      scan.blocking('integrity', `task ${start}: its parent chain is cyclic`);
    }
    for (const id of path) {
      marks.set(id, 2);
    }
  }

  // ---- pass 3: re-read only the records that owe updates, and keep just those payloads ----
  const readsBeforeSelected: number = store.reads.task;
  if (!scan.isBlocked) {
    for (const taskId of owedTasks) {
      const name: string = recordName('task', taskId);
      const projection: ITaskProjection = tasks.get(taskId)!;
      const reloaded: ITaskCommitRecord | undefined = gate.track(() => {
        const text = _readJson(store, scan, name, recordLimit);
        if (text === undefined) {
          return undefined;
        }
        if (fingerprintOf(text.text) !== projection.fingerprint) {
          scan.blocking('integrity', `${name}: changed between the task pass and the owed-update pass`, name);
          return undefined;
        }
        return _convertVersioned(
          converters,
          scan,
          name,
          text.parsed,
          (from) => converters.storage.record.convert(from),
          'record-invalid'
        );
      });
      if (reloaded !== undefined) {
        index.putOwed(taskId, updatesOf(reloaded));
      }
    }
  }

  // ---- the exact-ID join's result, baselines, and the subscriptions' derived ledger entries ----
  // An acknowledged link is satisfied, never owed and never reserved twice: it is counted once, as
  // history in its subscription's record.
  let book: DeliveryBook = new DeliveryBook(new Map(), consumers.pending);
  if (!scan.isBlocked) {
    for (const [id, updateIds] of consumers.satisfied) {
      index.satisfy(id, updateIds);
    }
    for (const [id, baseline] of consumers.baselines) {
      index.putBaseline(id, baseline);
    }
    book = DeliveryBook.build(consumers.subscriptions, consumers.pending, index, tasks);
    ledger.apply(book.entries(index, profile));
  }

  // ---- capacity: a valid repository at its ceiling opens; one over it disagrees with itself ----
  const over: ReadonlyArray<string> = ledger.overLimit();
  if (over.length > 0) {
    scan.blocking('integrity', `committed records exceed the stored capacity profile in: ${over.join(', ')}`);
  }

  const report = (extra?: Partial<ITaskRecoveryReport>): ITaskRecoveryReport => ({
    repositoryId: manifest.repositoryId,
    issues: scan.issues,
    completedRegistrations: completed,
    pendingRegistrations: stillPending,
    completedSubscriptions: consumers.completed,
    pendingSubscriptions: consumers.stillPending,
    removedTemporaries: acquired.removed,
    ...extra
  });

  if (scan.isBlocked) {
    return ok<ScanOutcome>({
      state: 'blocked',
      report: report({ completedRegistrations: [], completedSubscriptions: [] })
    });
  }

  // ---- complete registrations that died after their record was written ----
  const completion: TaskResult<{ manifest: ITaskRepositoryManifest; bytes: number; text: string }> =
    completed.length === 0 && consumers.completed.length === 0
      ? ok({ manifest, bytes: manifestRead.bytes, text: manifestRead.text })
      : _completeRegistrations(
          store,
          converters,
          { manifest, text: manifestRead.text },
          new Set<string>(completed),
          new Set<string>(consumers.completed)
        );
  if (completion.isFailure()) {
    return propagate(completion);
  }
  ledger.apply(new Map([['repository', manifestEntry(completion.value.bytes, profile)]]));

  return ok<ScanOutcome>({
    state: 'ready',
    scanned: {
      manifest: completion.value.manifest,
      manifestText: completion.value.text,
      tasks,
      pending,
      sources,
      ledger,
      index,
      book,
      report: report(),
      evidence: {
        taskPassReads: readsBeforeSelected - readsBefore.task,
        consumerPassReads: store.reads.consumer - readsBefore.consumer,
        sourcePassReads: store.reads.source - readsBefore.source,
        selectedPassReads: store.reads.task - readsBeforeSelected,
        graphMarks: marks.size,
        owedDescriptors
      }
    }
  });
}

/** What a validated record contributes to the index. */
function _indexContent(record: ITaskCommitRecord, known: boolean): IndexContent {
  if (!known) {
    const source = record.recordType === 'resolved' ? record.task.envelope : record.reference;
    return {
      category: 'quarantined',
      scopes: source.scopes,
      ...(source.parentId !== undefined ? { parentId: source.parentId } : {}),
      ...(source.binding !== undefined ? { binding: source.binding } : {}),
      archived: record.recordType === 'resolved' && record.archived
    };
  }
  if (record.recordType === 'unresolved') {
    return { category: 'unresolved', reference: record.reference };
  }
  if (record.archived) {
    return { category: 'archived', envelope: record.task.envelope };
  }
  const envelope = record.task.envelope;
  // Whether a list completes automatically lives in its details, which are never resident; it is
  // read here, where the whole record is in hand, and kept as one flag on its membership.
  const automaticList: boolean =
    envelope.kind === taskListKind &&
    envelope.detailVersion === taskListDetailVersion &&
    taskListDetails
      .convert(record.task.details)
      .onSuccess((details) => succeed(details.completion === 'all-children-succeeded'))
      .orDefault(false);
  const unsettled: boolean = hasUnsettledCommand(record);
  return {
    category: 'summary',
    envelope,
    ...(automaticList ? { automaticList } : {}),
    ...(unsettled ? { unsettledCommands: true } : {})
  };
}

/**
 * What a committed record contributes to the index. The same mapping the scan applies, used by
 * the write path so a live commit and a rebuild index a record identically.
 * @internal
 */
export const indexContentOf: (record: ITaskCommitRecord, known: boolean) => IndexContent = _indexContent;

/** What the consumer pass establishes. */
interface IScannedConsumers {
  readonly subscriptions: Map<SubscriptionId, ISubscriptionState>;
  readonly pending: Map<SubscriptionId, IPendingConsumerEntry>;
  /** Pending registrations whose first record is present and valid: completed by this open. */
  readonly completed: SubscriptionId[];
  readonly stillPending: Array<{ subscriptionId: SubscriptionId; operationId: OperationId }>;
  /** Per subscription, the acknowledged ids that are retained links of it: the exact-ID join. */
  readonly satisfied: Map<SubscriptionId, UpdateId[]>;
  /** Per subscription, its unacknowledged baseline obligations. */
  readonly baselines: Map<SubscriptionId, ReadonlyArray<ITaskUpdate>>;
}

/**
 * The consumer pass (design § 7, *Bounded open/rebuild*, step 2): each subscription record read
 * through the checkpoint store, one at a time, validated, and its exact acknowledgement history
 * joined against pass 1's owed-link descriptors by update id. Only the join's result, the
 * unacknowledged baseline and the resident descriptor survive; the history itself is released
 * with the record.
 */
function _scanConsumers(params: {
  readonly scan: Scan;
  readonly manifest: ITaskRepositoryManifest;
  readonly profile: ITaskCapacityProfile;
  readonly checkpoints: CheckpointPort;
  readonly linkDescriptors: ReadonlyMap<UpdateId, ReadonlyArray<SubscriptionId>>;
  /** The expected-file set, when records live in the root. */
  readonly named: Set<string> | undefined;
  readonly gate: MaterializationGate;
  readonly formatVersion: Converter<number>;
}): IScannedConsumers {
  const { scan, manifest, profile, checkpoints, linkDescriptors, named, gate, formatVersion } = params;
  const out: IScannedConsumers = {
    subscriptions: new Map(),
    pending: new Map(),
    completed: [],
    stillPending: [],
    satisfied: new Map(),
    baselines: new Map()
  };
  const limit: number = recordLimitFor(subscriptionKey(''), profile);
  for (const entry of manifest.consumers) {
    // The inventory converter validated the id with the subscription-id syntax.
    const id: SubscriptionId = entry.id as SubscriptionId;
    const name: string = recordName('consumer', id);
    named?.add(name);
    const read = gate.track(() => {
      const value: Result<unknown> = checkpoints.readValue(id);
      if (value.isFailure()) {
        scan.blocking('unreadable', value.message, name);
        return undefined;
      }
      if (value.value === undefined) {
        return { absent: true as const };
      }
      const version: Result<number> = formatVersion.convert(value.value);
      if (version.isSuccess() && version.value !== taskStorageFormatVersion) {
        scan.blocking(
          'unknown-format-version',
          `${name}: storage format ${version.value} is not readable by this release; retained untouched`,
          name
        );
        return undefined;
      }
      const accepted: Result<IConsumerRead> = checkpoints.accept(id, value.value);
      if (accepted.isFailure()) {
        scan.blocking('record-invalid', `${name}: ${accepted.message}`, name);
        return undefined;
      }
      if (accepted.value.bytes > limit) {
        scan.blocking(
          'record-invalid',
          `${name}: ${accepted.value.bytes} bytes exceeds its ceiling of ${limit}`,
          name
        );
        return undefined;
      }
      return { absent: false as const, read: accepted.value };
    });
    if (read === undefined) {
      continue;
    }
    if (read.absent) {
      if (entry.state === 'live') {
        scan.blocking('record-missing', `${name}: named live by the inventory but missing`, name);
        continue;
      }
      const claimed: Result<true> = checkSubscriptionClaims(entry.capacityClaims, {
        subscriptionId: id,
        ownership: 'pending'
      });
      if (claimed.isFailure()) {
        scan.blocking('integrity', `${name}: pending registration: ${claimed.message}`, name);
        continue;
      }
      scan.advisory(
        'pending-registration',
        `subscription ${id}: registration '${entry.operationId}' was accepted into the inventory but its ` +
          `record was never written; it is inactive until the same registration is retried`,
        name
      );
      out.pending.set(id, entry);
      out.stillPending.push({ subscriptionId: id, operationId: entry.operationId });
      continue;
    }
    const record: ITaskConsumerRecord = read.read.record;
    if (entry.state === 'pending') {
      const problem: string | undefined = firstRecordProblem(record, entry);
      if (problem !== undefined) {
        scan.blocking(
          'integrity',
          `${name}: present for pending registration '${entry.operationId}' but is not its first record: ${problem}`,
          name
        );
        continue;
      }
      out.completed.push(id);
    }
    const claimed: Result<true> = checkSubscriptionClaims(record.capacityClaims, {
      subscriptionId: id,
      ownership: 'live',
      preparationBytes: preparationBytes(
        profile,
        record.issued.map((m) => ({ bytes: valueBytes(m) }))
      )
    });
    if (claimed.isFailure()) {
      scan.blocking('integrity', `${name}: ${claimed.message}`, name);
      continue;
    }
    out.subscriptions.set(id, subscriptionState(record, read.read.fingerprint, read.read.bytes));
    const acknowledged: ReadonlySet<UpdateId> = new Set(record.acknowledged);
    const satisfied: UpdateId[] = record.acknowledged.filter(
      (updateId) => linkDescriptors.get(updateId)?.includes(id) === true
    );
    if (satisfied.length > 0) {
      out.satisfied.set(id, satisfied);
    }
    const owedBaseline: ReadonlyArray<ITaskUpdate> = record.baseline.filter((b) => !acknowledged.has(b.id));
    if (owedBaseline.length > 0) {
      out.baselines.set(id, owedBaseline);
    }
  }
  return out;
}
