/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import {
  IPendingInventoryEntry,
  ITaskCapacityClaim,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  TaskId,
  TaskKind,
  TaskRevision,
  isTerminalTaskStatus
} from '../types';
import { DimensionAmounts, ILedgerEntry, heldCharges, zeroAmounts } from './ledger';
import { utf8Length } from './layout';

/**
 * The minimal resident projection of one live task (design §7): identity, graph edge,
 * revisions, and what the ledger needs. No summary, no details, no update payloads — those
 * are read on demand, and the query indexes are T4's.
 * @internal
 */
export interface ITaskProjection {
  readonly id: TaskId;
  readonly recordType: ITaskCommitRecord['recordType'];
  readonly recordRevision: number;
  readonly revision: TaskRevision;
  readonly kind: TaskKind;
  readonly detailVersion: number;
  readonly parentId?: TaskId;
  readonly archived: boolean;
  /** False when the kind/version is not registered: the record is quarantined. */
  readonly known: boolean;
}

/**
 * Projects a validated record.
 * @internal
 */
export function projectRecord(record: ITaskCommitRecord, known: boolean): ITaskProjection {
  if (record.recordType === 'resolved') {
    const envelope = record.task.envelope;
    return {
      id: envelope.id,
      recordType: 'resolved',
      recordRevision: record.recordRevision,
      revision: envelope.revision,
      kind: envelope.kind,
      detailVersion: envelope.detailVersion,
      ...(envelope.parentId !== undefined ? { parentId: envelope.parentId } : {}),
      archived: record.archived,
      known
    };
  }
  const reference = record.reference;
  return {
    id: reference.id,
    recordType: 'unresolved',
    recordRevision: record.recordRevision,
    revision: reference.revision,
    kind: reference.kind,
    detailVersion: reference.detailVersion,
    ...(reference.parentId !== undefined ? { parentId: reference.parentId } : {}),
    archived: false,
    known
  };
}

/**
 * Whether a record's task is in a terminal lifecycle state. An unresolved record has no
 * lifecycle and is never terminal.
 * @internal
 */
export function isTerminalRecord(record: ITaskCommitRecord): boolean {
  return record.recordType === 'resolved' && isTerminalTaskStatus(record.task.envelope.lifecycle.status);
}

/**
 * The ledger key of a task record.
 * @internal
 */
export function taskKey(id: string): string {
  return `task:${id}`;
}

/**
 * The per-record ceiling for a task record: the smaller of the per-record dimension limit and
 * the task-record encoded bound.
 * @internal
 */
export function taskRecordLimit(profile: ITaskCapacityProfile): number {
  return Math.min(profile.limits['record-bytes'], profile.encoded.maxTaskRecordBytes);
}

/**
 * A task record's usage, as the ledger counts it.
 *
 * @remarks
 * Update payload bytes are the canonical encoded size of each update — the same unit the
 * encoded bounds and the resident-payload dimension are stated in. Every retained update is
 * charged, including ones every audience has already acknowledged, until a maintenance commit
 * prunes it: storage cannot see consumer records' acknowledgements in this release.
 * @internal
 */
export function taskUsage(record: ITaskCommitRecord, recordBytes: number): DimensionAmounts {
  const updates = record.recordType === 'resolved' ? record.updates : [];
  // `JSON.stringify` of a validated value is the same *length* as its RFC 8785 canonical form:
  // the canonicalizer serializes every string and number through `JSON.stringify`, and only key
  // order differs. So this is the canonical byte count, without a failure path that cannot fire.
  const payloadBytes: number = updates.reduce(
    (total, update) => total + utf8Length(JSON.stringify(update)),
    0
  );
  {
    const used: DimensionAmounts = zeroAmounts();
    used['retained-tasks'] = 1;
    used['non-archived-tasks'] = record.recordType === 'resolved' && record.archived ? 0 : 1;
    used.updates = updates.length;
    used['audience-links'] = updates.reduce((total, update) => total + update.audience.length, 0);
    used.operations = record.operations.length;
    used['record-bytes'] = recordBytes;
    used['logical-bytes'] = recordBytes;
    used['resident-payload-bytes'] = payloadBytes;
    return used;
  }
}

/**
 * A ledger entry from usage and the claims that record holds.
 * @internal
 */
export function ledgerEntry(
  recordId: string,
  used: DimensionAmounts,
  claims: ReadonlyArray<ITaskCapacityClaim>,
  recordLimit: number
): ILedgerEntry {
  return {
    recordId,
    used,
    reserved: heldCharges(claims),
    recordLimit,
    indeterminate: claims.some((claim) => claim.disposition === 'indeterminate')
  };
}

/**
 * The ledger entry of a pending registration whose record does not exist yet: one retained
 * and one non-archived identity, and the claims the entry owns. Its request bytes are charged
 * through the manifest's own size.
 * @internal
 */
export function pendingEntry(entry: IPendingInventoryEntry, recordLimit: number): ILedgerEntry {
  const used: DimensionAmounts = zeroAmounts();
  used['retained-tasks'] = 1;
  used['non-archived-tasks'] = 1;
  return ledgerEntry(entry.id, used, entry.capacityClaims, recordLimit);
}

/**
 * The ledger entry of the manifest itself.
 * @internal
 */
export function manifestEntry(bytes: number, profile: ITaskCapacityProfile): ILedgerEntry {
  const used: DimensionAmounts = zeroAmounts();
  used['record-bytes'] = bytes;
  used['logical-bytes'] = bytes;
  return ledgerEntry(
    'repository',
    used,
    [],
    Math.min(profile.limits['record-bytes'], profile.encoded.maxInventoryRecordBytes)
  );
}

/**
 * The ledger entry of a consumer or source record whose contents this release does not own.
 * @internal
 */
export function opaqueEntry(
  id: string,
  kind: 'consumer' | 'source',
  bytes: number,
  profile: ITaskCapacityProfile
): ILedgerEntry {
  const used: DimensionAmounts = zeroAmounts();
  used[kind === 'consumer' ? 'subscriptions' : 'sources'] = 1;
  used['record-bytes'] = bytes;
  used['logical-bytes'] = bytes;
  const limit: number =
    kind === 'consumer' ? profile.encoded.maxConsumerRecordBytes : profile.encoded.maxSourceRecordBytes;
  return ledgerEntry(id, used, [], Math.min(profile.limits['record-bytes'], limit));
}
