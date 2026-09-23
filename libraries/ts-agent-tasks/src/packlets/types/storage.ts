/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { JsonValue } from '@fgv/ts-json-base';
import { ITaskCapacityClaim, ITaskCapacityProfile } from './capacity';
import { ICommandReceipt, ICommandRequest } from './commands';
import { ITaskSnapshot } from './envelope';
import { OperationId, TaskId } from './ids';
import { ISourceRevision } from './source';
import { IUnresolvedTaskReference } from './summary';
import { ITaskUpdate } from './updates';

/**
 * The storage format version every record this release writes carries.
 *
 * @remarks
 * Versioned independently of the envelope's `schemaVersion`, a kind's `detailVersion` and a
 * source reference's `referenceVersion`. A record carrying any other value is never
 * rewritten by this release: it is reported, and its bytes are left exactly as found.
 * @public
 */
export const taskStorageFormatVersion: 1 = 1;

/**
 * What a stored command's dispatch has reached.
 *
 * @remarks
 * `possibly-sent` is the marker written *before* an external send: once it is on disk, the
 * outcome is uncertain until the source settles it, even if the process died before the
 * send actually happened (design §5).
 * @public
 */
export type StoredCommandDispatch = 'not-sent' | 'possibly-sent' | 'settled';

/**
 * The catalog (non-command) operations a task record can hold evidence for.
 *
 * @remarks
 * Metadata changes and creation are their own discriminated variants, never fake execution
 * commands (design §8.3). T3 declares the closed set so records written today can carry any
 * of them; the typed request and receipt shapes of each belong to the slices that implement
 * the operation, so both are stored as validated JSON here.
 * @public
 */
export type TaskCatalogOperationType =
  | 'create-tracked'
  | 'create-list'
  | 'register-external'
  | 'update-tracked'
  | 'reassign'
  | 'change-scopes'
  | 'reparent'
  | 'stop'
  | 'release-stop'
  | 'archive'
  | 'complete-list';

/**
 * Every {@link TaskCatalogOperationType}.
 * @public
 */
export const allTaskCatalogOperationTypes: ReadonlyArray<TaskCatalogOperationType> = [
  'create-tracked',
  'create-list',
  'register-external',
  'update-tracked',
  'reassign',
  'change-scopes',
  'reparent',
  'stop',
  'release-stop',
  'archive',
  'complete-list'
];

/**
 * Stored evidence of one execution command: its dedup key, request and evolving receipt.
 * @public
 */
export interface IStoredCommandOperation {
  readonly type: 'command';
  readonly operationId: OperationId;
  readonly request: ICommandRequest;
  readonly principalKey: string;
  readonly dispatch: StoredCommandDispatch;
  readonly receipt: ICommandReceipt;
}

/**
 * Stored evidence of one catalog operation.
 * @public
 */
export interface IStoredCatalogOperation {
  readonly type: 'catalog';
  readonly operationId: OperationId;
  readonly operation: TaskCatalogOperationType;
  readonly request: JsonValue;
  readonly principalKey: string;
  readonly receipt: JsonValue;
}

/**
 * One operation's dedup evidence, retained for the task's whole retained lifetime.
 *
 * @remarks
 * `request` is what a replay is compared against, canonically and in full. Storage never
 * drops an operation from a record once it is there — pruning applies to update payloads,
 * never to dedup evidence.
 * @public
 */
export type IStoredTaskOperation = IStoredCommandOperation | IStoredCatalogOperation;

/**
 * A resolved task's single atomic commit record — current state, owed updates and dedup
 * evidence together (design §8.3).
 *
 * @remarks
 * `recordRevision` advances on every replacement, including maintenance that leaves the
 * task's semantic `revision` unchanged. `archived: true` makes this record the task's
 * tombstone: its final snapshot, source revision and operation evidence are retained.
 * @public
 */
export interface IResolvedTaskCommitRecord {
  readonly formatVersion: 1;
  readonly recordType: 'resolved';
  readonly recordRevision: number;
  readonly task: ITaskSnapshot;
  readonly sourceRevision?: ISourceRevision;
  readonly operations: ReadonlyArray<IStoredTaskOperation>;
  readonly updates: ReadonlyArray<ITaskUpdate>;
  readonly capacityClaims: ReadonlyArray<ITaskCapacityClaim>;
  readonly archived: boolean;
}

/**
 * The record of a registered external task whose first usable observation has not arrived.
 *
 * @remarks
 * No lifecycle is invented for it. Its registration operation is the first entry of
 * `operations`, so the unresolved and resolved variants carry dedup evidence the same way.
 * @public
 */
export interface IUnresolvedTaskCommitRecord {
  readonly formatVersion: 1;
  readonly recordType: 'unresolved';
  readonly recordRevision: number;
  readonly reference: IUnresolvedTaskReference;
  readonly operations: ReadonlyArray<IStoredTaskOperation>;
  readonly capacityClaims: ReadonlyArray<ITaskCapacityClaim>;
}

/**
 * A task's commit record, resolved or unresolved.
 * @public
 */
export type ITaskCommitRecord = IResolvedTaskCommitRecord | IUnresolvedTaskCommitRecord;

/**
 * What a caller supplies for a resolved record: everything except the fields the repository
 * owns — the format version, the record revision and the capacity claims.
 *
 * @remarks
 * Claims are computed by the repository and are never caller-issued authority. There is no
 * `capacityClaims` field here to pass, and the draft converter is strict.
 * @public
 */
export interface IResolvedTaskRecordDraft {
  readonly recordType: 'resolved';
  readonly task: ITaskSnapshot;
  readonly sourceRevision?: ISourceRevision;
  readonly operations: ReadonlyArray<IStoredTaskOperation>;
  readonly updates: ReadonlyArray<ITaskUpdate>;
  readonly archived: boolean;
}

/**
 * What a caller supplies for an unresolved record.
 * @public
 */
export interface IUnresolvedTaskRecordDraft {
  readonly recordType: 'unresolved';
  readonly reference: IUnresolvedTaskReference;
  readonly operations: ReadonlyArray<IStoredTaskOperation>;
}

/**
 * A caller-supplied record draft.
 * @public
 */
export type ITaskRecordDraft = IResolvedTaskRecordDraft | IUnresolvedTaskRecordDraft;

/**
 * Which kind of record an inventory entry names.
 * @public
 */
export type TaskInventoryRecordKind = 'task' | 'consumer' | 'source';

/**
 * A live inventory entry: the named record must exist.
 * @public
 */
export interface ILiveInventoryEntry {
  readonly id: string;
  readonly state: 'live';
}

/**
 * A pending registration: the intent was accepted into the inventory, the record may or may
 * not have been written yet.
 *
 * @remarks
 * The creation operation's identity — its id, catalog operation, principal and canonical
 * request — and the first record's type are kept here only while the entry is pending: they are
 * what a resumed registration must match. They are cleared when the entry goes live, because the
 * accepted evidence is then in the record. The entry owns its capacity claims until then.
 * @public
 */
export interface IPendingInventoryEntry {
  readonly id: string;
  readonly state: 'pending';
  readonly operationId: OperationId;
  /** The creation catalog operation, part of what a resumed registration must match. */
  readonly operation: TaskCatalogOperationType;
  /** The principal the registration was accepted for. */
  readonly principalKey: string;
  /** Whether the registration writes a resolved or an unresolved first record. */
  readonly recordType: ITaskCommitRecord['recordType'];
  readonly request: JsonValue;
  readonly capacityClaims: ReadonlyArray<ITaskCapacityClaim>;
}

/**
 * One inventory entry.
 * @public
 */
export type ITaskInventoryEntry = ILiveInventoryEntry | IPendingInventoryEntry;

/**
 * The repository manifest (`repository.json`): format, identity, the stored capacity
 * policy, and the flat inventory of records that must exist.
 *
 * @remarks
 * The inventory is **not** a projection of task status. It names records and pending
 * registration intents, which is what makes a missing accepted record detectable. It is
 * rewritten on registration only — never on an ordinary task mutation, and not on archive
 * (the archived record is itself the tombstone).
 * @public
 */
export interface ITaskRepositoryManifest {
  readonly formatVersion: 1;
  readonly repositoryId: string;
  readonly manifestRevision: number;
  readonly profile: ITaskCapacityProfile;
  readonly tasks: ReadonlyArray<ITaskInventoryEntry>;
  readonly consumers: ReadonlyArray<ITaskInventoryEntry>;
  readonly sources: ReadonlyArray<ITaskInventoryEntry>;
}

/**
 * The part of a consumer or source record this release validates.
 *
 * @remarks
 * T3 names consumer and source records in the inventory so their absence is detectable; their
 * contents belong to the slices that write them (subscriptions and source reconciliation).
 * Until then storage checks only what it owns — the format version and that the record's id
 * agrees with its filename — and never rewrites them.
 * @public
 */
export interface ITaskRecordHeader {
  readonly formatVersion: 1;
  readonly id: string;
}

/**
 * The result of registering, or reading, one task.
 *
 * @remarks
 * An unresolved registration returns its reference with no lifecycle invented.
 * @public
 */
export type TaskRegistrationResult =
  | { readonly state: 'resolved'; readonly task: ITaskSnapshot; readonly archived: boolean }
  | { readonly state: 'unresolved'; readonly reference: IUnresolvedTaskReference };

/**
 * The kinds of problem open and recovery report.
 *
 * @remarks
 * - `manifest-missing` — no `repository.json` in a root that has other content; open never
 *   initializes over it.
 * - `manifest-invalid` / `record-invalid` — valid JSON that fails the strict converters.
 * - `unreadable` — not strict UTF-8, or not JSON.
 * - `unknown-format-version` — a record written by a newer storage format; retained untouched.
 * - `record-missing` — the inventory names a live record that is not there.
 * - `record-id-mismatch` — the record's id disagrees with its filename.
 * - `integrity` — a cross-record invariant failed: a duplicate claim id, a dangling or cyclic
 *   parent edge, update identity that disagrees with its task.
 * - `unknown-kind` — a structurally valid task whose kind/version is not registered. Advisory:
 *   the record is quarantined and never rewritten.
 * - `unexpected-record` — a task/consumer/source-shaped file the inventory does not name.
 *   Advisory: registration never writes one, so this is out-of-band content, left alone.
 * - `pending-registration` — a pending entry whose record was never written. Advisory: its
 *   reservations stay held and the host may resume it by retrying the same registration.
 * @public
 */
export type TaskRecoveryIssueCode =
  | 'manifest-missing'
  | 'manifest-invalid'
  | 'unreadable'
  | 'unknown-format-version'
  | 'record-invalid'
  | 'record-missing'
  | 'record-id-mismatch'
  | 'integrity'
  | 'unknown-kind'
  | 'unexpected-record'
  | 'pending-registration';

/**
 * One problem found while opening a repository.
 *
 * @remarks
 * `blocking` issues prevent a writable repository: open returns a read-only recovery handle
 * instead. `advisory` issues are reported and the repository still opens.
 * @public
 */
export interface ITaskRecoveryIssue {
  readonly code: TaskRecoveryIssueCode;
  readonly severity: 'blocking' | 'advisory';
  readonly recordName?: string;
  readonly message: string;
}

/**
 * Everything open found and did.
 * @public
 */
export interface ITaskRecoveryReport {
  readonly repositoryId?: string;
  readonly issues: ReadonlyArray<ITaskRecoveryIssue>;
  /** Pending registrations whose record was present, completed (marked live) by this open. */
  readonly completedRegistrations: ReadonlyArray<TaskId>;
  /** Pending registrations whose record was never written; their reservations remain held. */
  readonly pendingRegistrations: ReadonlyArray<{
    readonly taskId: TaskId;
    readonly operationId: OperationId;
  }>;
  /** Working files of interrupted atomic writes, removed at exclusive open. */
  readonly removedTemporaries: ReadonlyArray<string>;
}
