/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { Converter, Converters, Result, fail } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import {
  IPendingInventoryEntry,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskRecoveryIssue,
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
import { classify, ok, propagate, taskFailure } from './failures';
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
import { IRepositoryState } from './state';
import { IRootOwnership, acquireRoot } from './rootOwnership';

type Guarantee = FileTree.AtomicWriteGuarantee;

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
  const converters: Result<TaskConverters> =
    params.converters !== undefined ? ok(params.converters) : TaskConverters.create();
  if (converters.isFailure()) {
    return taskFailure(converters.message, 'invalid', 'after-host-action');
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
    params.registry.freeze();
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
      converters: converters.value,
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
          params.environment
            .newId()
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
    const ledger: CapacityLedger = new CapacityLedger(profile);
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
        written.detail?.visibility === 'unchanged' ? 'safe' : 'reconcile-first'
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
        manifestBytes: created.value.bytes,
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

  public advisory(code: TaskRecoveryIssueCode, message: string, recordName?: string): void {
    this.issues.push({
      code,
      severity: 'advisory',
      message,
      ...(recordName !== undefined ? { recordName } : {})
    });
  }

  public get isBlocked(): boolean {
    return this.issues.some((issue) => issue.severity === 'blocking');
  }
}

/**
 * Reads and parses one file, classifying failures. `undefined` means absent or already
 * reported.
 */
function _readJson(
  store: RecordStore,
  scan: Scan,
  name: string,
  limit: number | undefined
): { readonly parsed: unknown; readonly bytes: number } | undefined {
  const text: Result<string | undefined> = store.read(name);
  if (text.isFailure()) {
    scan.blocking('unreadable', text.message, name);
    return undefined;
  }
  if (text.value === undefined) {
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
  return { parsed: parsed.value, bytes };
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

function _recovery(acquired: IAcquired, report: ITaskRecoveryReport): TaskResult<TaskRepositoryOpenResult> {
  let closed: boolean = false;
  const recovery: ITaskRecoveryHandle = {
    report,
    readRaw: (name: string): Result<string> => {
      if (closed) {
        return fail(`recovery: closed`);
      }
      return acquired.store
        .read(name)
        .onSuccess((text) => (text === undefined ? fail<string>(`${name}: not present`) : ok(text)));
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
    const same: Result<boolean> = canonicallyEqual(params.profile, profile);
    if (same.isFailure() || !same.value) {
      return taskFailure(
        `open: the requested capacity profile differs from the stored one; the stored profile governs, ` +
          `and raising it is an explicit operation (lowering is unsupported)`,
        'unsupported',
        'after-host-action'
      );
    }
  }

  const ledger: CapacityLedger = new CapacityLedger(profile);
  ledger.apply(new Map([['repository', manifestEntry(manifestRead.bytes, profile)]]));
  const tasks: Map<TaskId, ITaskProjection> = new Map<TaskId, ITaskProjection>();
  const pending: Map<string, IPendingInventoryEntry> = new Map<string, IPendingInventoryEntry>();
  const completed: TaskId[] = [];
  const stillPending: Array<{ taskId: TaskId; operationId: OperationId }> = [];
  const claimOwners: Map<string, string> = new Map<string, string>();
  const named: Set<string> = new Set<string>([manifestName]);
  // Every task the inventory names, whether or not its record validated: a child of a parent
  // whose record is already reported broken is not *also* a dangling edge.
  const inventoried: Set<string> = new Set<string>(manifest.tasks.map((entry) => entry.id));

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

    let known: boolean = true;
    if (record.recordType === 'resolved') {
      const converted = params.registry.convert(record.task);
      if (converted.isFailure()) {
        if (converted.detail?.code === 'unknown-kind-version') {
          known = false;
          scan.advisory(
            'unknown-kind',
            `${name}: ${converted.message}; quarantined and never rewritten until the kind is registered`,
            name
          );
        } else {
          scan.blocking('record-invalid', `${name}: ${converted.message}`, name);
          continue;
        }
      }
    } else if (!params.registry.has(record.reference.kind, record.reference.detailVersion)) {
      known = false;
      scan.advisory(
        'unknown-kind',
        `${name}: ${record.reference.kind}@${record.reference.detailVersion} is not registered; quarantined`,
        name
      );
    }

    if (entry.state === 'pending') {
      // Pending with a present record: the protocol died after step 2. Complete step 3, but
      // only if the record really is this registration — same operation, same claims.
      const pendingClaims: Set<string> = new Set<string>(entry.capacityClaims.map((c) => c.claimId));
      const sameClaims: boolean =
        pendingClaims.size === record.capacityClaims.length &&
        record.capacityClaims.every((c) => pendingClaims.has(c.claimId));
      const hasOperation: boolean = record.operations.some((op) => op.operationId === entry.operationId);
      if (!sameClaims || !hasOperation) {
        scan.blocking(
          'integrity',
          `${name}: present for pending registration '${entry.operationId}' but does not carry its operation and claims`,
          name
        );
        continue;
      }
      completed.push(taskId);
    }

    const usage = taskUsage(record, read.bytes);
    if (usage.isFailure()) {
      scan.blocking('record-invalid', `${name}: ${usage.message}`, name);
      continue;
    }
    tasks.set(taskId, projectRecord(record, known));
    ledger.apply(
      new Map([[taskKey(taskId), ledgerEntry(taskId, usage.value, record.capacityClaims, recordLimit)]])
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
  let finalManifest: ITaskRepositoryManifest = manifest;
  let finalBytes: number = manifestRead.bytes;
  if (completed.length > 0) {
    const done: Set<string> = new Set<string>(completed);
    finalManifest = {
      ...manifest,
      manifestRevision: manifest.manifestRevision + 1,
      tasks: manifest.tasks.map((entry) => (done.has(entry.id) ? { id: entry.id, state: 'live' } : entry))
    };
    const encoded = classify(
      encodeRecord(finalManifest).onSuccess((e) =>
        parseJson(e.text)
          .onSuccess((p) => converters.storage.manifest.convert(p))
          .onSuccess(() => ok(e))
      ),
      'storage-corrupt',
      'after-host-action'
    );
    if (encoded.isFailure()) {
      return propagate(encoded);
    }
    const written = store.write(manifestName, encoded.value.text);
    if (written.isFailure()) {
      return taskFailure(
        `open: completing pending registrations failed: ${written.message}`,
        'storage-unavailable',
        written.detail?.visibility === 'unchanged' ? 'safe' : 'reconcile-first'
      );
    }
    finalBytes = encoded.value.bytes;
    ledger.apply(new Map([['repository', manifestEntry(finalBytes, profile)]]));
  }

  const state: IRepositoryState = {
    store,
    ownership: acquired.ownership,
    converters,
    registry: params.registry,
    environment: params.environment,
    mode: acquired.mode,
    manifest: finalManifest,
    manifestBytes: finalBytes,
    tasks,
    pending,
    ledger,
    report: report()
  };
  return ok<TaskRepositoryOpenResult>({ state: 'ready', repository: factory(state) });
}
