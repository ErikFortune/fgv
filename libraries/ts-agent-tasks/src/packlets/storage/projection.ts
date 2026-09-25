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
  TaskLifecycleStatus,
  TaskRevision,
  isTerminalTaskStatus
} from '../types';
import { DimensionAmounts, ILedgerEntry, heldCharges, zeroAmounts } from './ledger';
import { fingerprintOf, utf8Length } from './layout';

/**
 * The minimal resident projection of one live task (design §7): identity, graph edge,
 * revisions, final status, and what the ledger needs. This is all an archived task keeps
 * resident. No summary, no details, no update payloads: a non-archived task's summary and
 * memberships live in the query index, and everything else is read on demand.
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
  /** The lifecycle status; absent for an unresolved record, which has none. */
  readonly status?: TaskLifecycleStatus;
  readonly archived: boolean;
  /** False when the kind/version is not registered: the record is quarantined. */
  readonly known: boolean;
  /** The `fingerprintOf` fingerprint of the record text this instance read or wrote. */
  readonly fingerprint: string;
  /**
   * Future commits that may owe a required update to a subscription: see `deliveryUnits`. What a
   * subscription's admission reads of a live task without reading its record (T7). Absent on an
   * archived projection, which keeps its minimal shape: an archived task is owed no future commit
   * and is never in a subscription's potential audience.
   */
  readonly deliveryUnits?: number;
  /** The task is bound to an external source. Absent when archived. */
  readonly external?: boolean;
  /** The task was admitted with a finite `source-replay` envelope. Absent when archived. */
  readonly sourceReplay?: boolean;
}

/**
 * Projects a validated record.
 * @internal
 */
export function projectRecord(record: ITaskCommitRecord, known: boolean, text: string): ITaskProjection {
  const fingerprint: string = fingerprintOf(text);
  const delivery = {
    deliveryUnits: deliveryUnits(record),
    sourceReplay: record.capacityClaims.some((claim) => claim.purpose === 'admitted-source-replay')
  };
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
      status: envelope.lifecycle.status,
      archived: record.archived,
      known,
      fingerprint,
      ...(record.archived ? {} : { ...delivery, external: envelope.binding !== undefined })
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
    known,
    fingerprint,
    ...delivery,
    external: true
  };
}

/**
 * The delivery units a task holds against every subscription that could be in its audience.
 *
 * @remarks
 * One unit is one future commit that may owe such a subscription a required update the task has
 * already reserved room for: its first resolution and its terminal transition while they are still
 * ahead, each unsettled external command, and each remaining `source-replay` revision. A
 * subscription's own record reserves the acknowledgement evidence of those future links against its
 * per-record ceiling and its per-subscription history limit, so the commit that makes them can never
 * be refused on the subscription's account. (The repository-wide acknowledgement ids and bytes for
 * them are in the task's own claims.) An archived task holds none.
 * @internal
 */
export function deliveryUnits(record: ITaskCommitRecord): number {
  if (record.recordType === 'resolved' && record.archived) {
    return 0;
  }
  const lifecycle: number =
    record.recordType === 'unresolved'
      ? 2
      : isTerminalTaskStatus(record.task.envelope.lifecycle.status)
      ? 0
      : 1;
  const commands: number = record.operations.filter(
    (op) => op.type === 'command' && op.dispatch !== 'settled'
  ).length;
  const replay: number = record.capacityClaims.reduce(
    (total, claim) =>
      claim.purpose === 'admitted-source-replay' && claim.disposition !== 'consumed'
        ? total + claim.envelope.remainingRequiredUpdates
        : total,
    0
  );
  return lifecycle + commands + replay;
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
 * The per-record ceiling of any ledger entry, by its key: the manifest, a consumer or source
 * record, or a task record. The one place the mapping lives, so an entry built at open and an
 * entry re-limited after `raiseCapacityLimits` cannot disagree.
 * @internal
 */
export function recordLimitFor(key: string, profile: ITaskCapacityProfile): number {
  const cap: number = profile.limits['record-bytes'];
  if (key === 'repository') {
    return Math.min(cap, profile.encoded.maxInventoryRecordBytes);
  }
  if (key.startsWith('consumer:')) {
    return Math.min(cap, profile.encoded.maxConsumerRecordBytes);
  }
  if (key.startsWith('source:')) {
    return Math.min(cap, profile.encoded.maxSourceRecordBytes);
  }
  return taskRecordLimit(profile);
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
  return ledgerEntry('repository', used, [], recordLimitFor('repository', profile));
}

/**
 * The ledger entry of a broker source-checkpoint record: one retained source identity and its bytes.
 * @internal
 */
export function sourceEntry(id: string, bytes: number, profile: ITaskCapacityProfile): ILedgerEntry {
  const used: DimensionAmounts = zeroAmounts();
  used.sources = 1;
  used['record-bytes'] = bytes;
  used['logical-bytes'] = bytes;
  return ledgerEntry(id, used, [], recordLimitFor(`source:${id}`, profile));
}
