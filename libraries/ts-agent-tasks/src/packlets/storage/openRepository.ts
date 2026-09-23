/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Converter, Converters, Result, fail, succeed } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import {
  IPendingInventoryEntry,
  IStoredCatalogOperation,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskRecoveryIssue,
  ITaskEnvironment,
  ITaskKindRegistry,
  ITaskRecoveryReport,
  ITaskRepositoryManifest,
  OperationId,
  TaskId,
  TaskInventoryRecordKind,
  TaskRecoveryIssueCode,
  TaskResult,
  defaultTaskCapacityProfile,
  taskStorageFormatVersion
} from '../types';
import { checkTaskClaims, withOwnership } from './claims';
import {
  checkBounds,
  checkCreationEvidence,
  checkOperationCount,
  checkPendingIdentity,
  checkRegistrationDraft,
  pendingIdentity,
  registrationIdentity
} from './commitRules';
import { classify, mintId, ok, propagate, taskFailure, writeRetry } from './failures';
import {
  canonicallyEqual,
  encodeRecord,
  manifestName,
  parseJson,
  parseRecordName,
  recordName,
  utf8Length
} from './layout';
import { CapacityLedger } from './ledger';
import {
  ITaskRecoveryHandle,
  ITaskRepository,
  ITaskRepositoryOpenParams,
  TaskRepositoryMode,
  TaskRepositoryOpenResult
} from './model';
import {
  ITaskProjection,
  ledgerEntry,
  manifestEntry,
  opaqueEntry,
  pendingEntry,
  projectRecord,
  taskKey,
  taskRecordLimit,
  taskUsage
} from './projection';
import { RecordStore } from './recordStore';
import { IRootOwnership, acquireRoot } from './rootOwnership';

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
  readonly ledger: CapacityLedger;
  readonly report: ITaskRecoveryReport;
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

function _acquireWith(params: ITaskRepositoryOpenParams, converters: TaskConverters): TaskResult<IAcquired> {
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
      names: listed.value.names
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
        ledger,
        report: {
          repositoryId: created.value.manifest.repositoryId,
          issues: [],
          completedRegistrations: [],
          pendingRegistrations: [],
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
  done: ReadonlySet<string>
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
    tasks: manifest.tasks.map((entry) => (done.has(entry.id) ? { id: entry.id, state: 'live' } : entry))
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
  const { store, converters } = acquired;
  const scan: Scan = new Scan();
  const baseReport = (): ITaskRecoveryReport => ({
    issues: scan.issues,
    completedRegistrations: [],
    pendingRegistrations: [],
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
    return _recovery(acquired, baseReport());
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
    return _recovery(acquired, baseReport());
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
              archived: false
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

    const read = _readJson(store, scan, name, recordLimit);
    if (read === undefined) {
      continue;
    }
    const record: ITaskCommitRecord | undefined = _convertVersioned(
      converters,
      scan,
      name,
      read.parsed,
      (from) => converters.storage.record.convert(from),
      'record-invalid'
    );
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
        archived: record.recordType === 'resolved' && record.archived
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

  // ---- consumer and source records: only what this release owns ----
  const opaque = (kind: 'consumer' | 'source', entries: ITaskRepositoryManifest['consumers']): void => {
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
      const limit: number =
        kind === 'consumer' ? profile.encoded.maxConsumerRecordBytes : profile.encoded.maxSourceRecordBytes;
      const read = _readJson(store, scan, name, Math.min(limit, profile.limits['record-bytes']));
      if (read === undefined) {
        continue;
      }
      const header = _convertVersioned(
        converters,
        scan,
        name,
        read.parsed,
        (from) => converters.storage.header.convert(from),
        'record-invalid'
      );
      if (header === undefined) {
        continue;
      }
      if (header.id !== entry.id) {
        scan.blocking('record-id-mismatch', `${name}: holds ${kind} ${header.id}`, name);
        continue;
      }
      ledger.apply(new Map([[`${kind}:${entry.id}`, opaqueEntry(entry.id, kind, read.bytes, profile)]]));
    }
  };
  opaque('consumer', manifest.consumers);
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
  for (const start of tasks.values()) {
    const seen: Set<TaskId> = new Set<TaskId>();
    let cursor: ITaskProjection | undefined = start;
    while (cursor?.parentId !== undefined) {
      if (seen.has(cursor.id)) {
        scan.blocking('integrity', `task ${start.id}: its parent chain is cyclic`);
        break;
      }
      seen.add(cursor.id);
      cursor = tasks.get(cursor.parentId);
    }
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
    removedTemporaries: acquired.removed,
    ...extra
  });

  if (scan.isBlocked) {
    return _recovery(acquired, report({ completedRegistrations: [] }));
  }

  // ---- complete registrations that died after their record was written ----
  const completion: TaskResult<{ manifest: ITaskRepositoryManifest; bytes: number; text: string }> =
    completed.length === 0
      ? ok({ manifest, bytes: manifestRead.bytes, text: manifestRead.text })
      : _completeRegistrations(
          store,
          converters,
          { manifest, text: manifestRead.text },
          new Set<string>(completed)
        );
  if (completion.isFailure()) {
    return propagate(completion);
  }
  ledger.apply(new Map([['repository', manifestEntry(completion.value.bytes, profile)]]));
  const finalManifest: ITaskRepositoryManifest = completion.value.manifest;

  const state: IRepositoryState = {
    store,
    ownership: acquired.ownership,
    converters,
    registry: params.registry,
    environment: params.environment,
    mode: acquired.mode,
    manifest: finalManifest,
    manifestText: completion.value.text,
    tasks,
    pending,
    ledger,
    report: report()
  };
  return ok<TaskRepositoryOpenResult>({ state: 'ready', repository: factory(state) });
}
