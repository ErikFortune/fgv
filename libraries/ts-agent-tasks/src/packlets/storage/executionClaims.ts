/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Result, fail, succeed } from '@fgv/ts-utils';
import { TaskConverters } from '../converters';
import {
  CapacityClaimId,
  ISourceReplayEnvelope,
  ITaskCapacityCharge,
  ITaskCapacityClaim,
  ITaskCapacityProfile,
  ITaskCommitRecord,
  ITaskEnvironment,
  ITaskRecordDraft,
  OperationId,
  TaskId,
  TaskResult
} from '../types';
import { ISourceReplayAdmission, mintSettlementClaim, replayCharges, spendOne } from './claims';
import { commandSettlement, sourceIdOf } from './commitRules';
import { ok, taskFailure } from './failures';
import { DimensionAmounts, zeroAmounts } from './ledger';
import { isTerminalRecord } from './projection';

// The execution claims (T6): an external command's settlement reservation, and a source-replay
// task's finite envelope. Both are spent by the commits that do the work they reserved for.

/**
 * Mints a settlement claim for each command the draft adds without settling it: an external
 * intent reserves its maximum settled receipt and owed result before it can be dispatched
 * (design § 8.6, protected allocation 3). Admission then charges the reservation like any other.
 * @internal
 */
export function mintSettlements(
  taskId: TaskId,
  profile: ITaskCapacityProfile,
  environment: ITaskEnvironment,
  claimId: Converter<CapacityClaimId>,
  record: ITaskCommitRecord,
  draft: ITaskRecordDraft
): TaskResult<ReadonlyArray<ITaskCapacityClaim>> {
  const before: ReadonlyMap<OperationId, boolean> = commandSettlement(record);
  const claims: ITaskCapacityClaim[] = [...record.capacityClaims];
  for (const [operationId, settled] of commandSettlement(draft)) {
    if (!before.has(operationId) && !settled) {
      const claim: Result<ITaskCapacityClaim> = mintSettlementClaim(
        taskId,
        operationId,
        profile,
        environment,
        claimId
      );
      if (claim.isFailure()) {
        return taskFailure(`task ${taskId}: ${claim.message}`, 'storage-unavailable', 'safe', {
          operationId
        });
      }
      claims.push(claim.value);
    }
  }
  return ok(claims.length === record.capacityClaims.length ? record.capacityClaims : claims);
}

/**
 * Spends the growth of a commit from the execution claims it draws on: each command this commit
 * settles consumes its settlement claim; a `source-replay` observation spends its required updates
 * from the task's envelope, and a terminal one releases what the envelope has left.
 * @internal
 */
export function spendExecutionClaims(
  taskId: TaskId,
  record: ITaskCommitRecord,
  next: ITaskCommitRecord,
  claims: ReadonlyArray<ITaskCapacityClaim>,
  growth: DimensionAmounts,
  requiredUpdates: number
): TaskResult<ReadonlyArray<ITaskCapacityClaim>> {
  const before: ReadonlyMap<OperationId, boolean> = commandSettlement(record);
  let spent: ReadonlyArray<ITaskCapacityClaim> = claims;
  for (const [operationId, settled] of commandSettlement(next)) {
    if (settled && before.get(operationId) === false) {
      spent = spendOne(
        spent,
        (c) => c.purpose === 'accepted-operation-settlement' && c.operationId === operationId,
        growth,
        true
      );
    }
  }
  const replay = spent.find(
    (c): c is Extract<ITaskCapacityClaim, { purpose: 'admitted-source-replay' }> =>
      c.purpose === 'admitted-source-replay' && c.disposition === 'reserved'
  );
  if (replay === undefined) {
    return ok(spent);
  }
  const terminal: boolean = !isTerminalRecord(record) && isTerminalRecord(next);
  if (requiredUpdates > replay.envelope.remainingRequiredUpdates) {
    return taskFailure(
      `task ${taskId}: the observation delivers ${requiredUpdates} required update(s), but source ` +
        `'${replay.sourceId}' declared only ${replay.envelope.remainingRequiredUpdates} remaining; the ` +
        `source broke its declared finite contract`,
      'source-gap',
      'after-host-action'
    );
  }
  if (requiredUpdates === 0 && !terminal) {
    return ok(spent);
  }
  const resolution: boolean = record.recordType === 'unresolved';
  const bytes: number = growth['resident-payload-bytes'];
  if (!terminal && !resolution && bytes > replay.envelope.remainingRequiredBytes) {
    return taskFailure(
      `task ${taskId}: the observation adds ${bytes} resident bytes, but source '${replay.sourceId}' ` +
        `declared only ${replay.envelope.remainingRequiredBytes} remaining; the source broke its ` +
        `declared finite contract`,
      'source-gap',
      'after-host-action'
    );
  }
  // A terminal observation's own payloads come out of the closeout reservation, and a first
  // resolution's out of its own claim, so the envelope gives nothing to either: it counts the
  // update, and a terminal one releases the rest.
  return ok(
    spendOne(
      spent,
      (c) => c.claimId === replay.claimId,
      terminal || resolution ? zeroAmounts() : growth,
      terminal
    ).map((c) =>
      c.claimId !== replay.claimId
        ? c
        : {
            ...replay,
            charges: c.charges,
            disposition: c.disposition,
            envelope: {
              remainingRequiredUpdates: replay.envelope.remainingRequiredUpdates - requiredUpdates,
              // The claim's resident charge *is* the remaining byte envelope: both start equal
              // (see `replayCharges`) and every spend shrinks the charge, so reading it back keeps
              // the two in lockstep rather than accounting the bytes twice.
              remainingRequiredBytes: amountsOf(c.charges)['resident-payload-bytes']
            }
          }
    )
  );
}

/** Charges as an amount per dimension; a dimension a list does not charge is zero. */
function amountsOf(charges: ReadonlyArray<ITaskCapacityCharge>): DimensionAmounts {
  const amounts: DimensionAmounts = zeroAmounts();
  for (const charge of charges) {
    amounts[charge.dimension] += charge.amount;
  }
  return amounts;
}

/**
 * Validates a registration's `source-replay` envelope: reserved only for the source the task's own
 * binding names, and finite in a way the profile's update bound can carry.
 * @internal
 */
export function replayAdmission(
  draft: ITaskRecordDraft,
  requested: { readonly sourceId: string; readonly envelope: ISourceReplayEnvelope },
  converters: TaskConverters,
  profile: ITaskCapacityProfile
): Result<ISourceReplayAdmission | undefined> {
  const sourceId: string = requested.sourceId;
  return converters.values.sourceReplayEnvelope
    .convert(requested.envelope)
    .onSuccess((envelope) =>
      sourceIdOf(draft) !== sourceId
        ? fail<ISourceReplayAdmission | undefined>(
            `a replay envelope is reserved only for the source the task's own binding names`
          )
        : replayCharges(envelope, profile).onSuccess(() =>
            succeed<ISourceReplayAdmission | undefined>({ sourceId, envelope })
          )
    );
}

/**
 * A record's claims with its open replay envelope extended by `add` (whose charges are `charges`),
 * the envelope it then holds, and the unchanged record as a draft to rewrite with them.
 * @internal
 */
export function extendReplayClaims(
  record: ITaskCommitRecord,
  add: ISourceReplayEnvelope,
  charges: ReadonlyArray<ITaskCapacityCharge>
): Result<{
  readonly claims: ReadonlyArray<ITaskCapacityClaim>;
  readonly envelope: ISourceReplayEnvelope;
  readonly draft: ITaskRecordDraft;
}> {
  const open = record.capacityClaims.find(
    (c): c is Extract<ITaskCapacityClaim, { purpose: 'admitted-source-replay' }> =>
      c.purpose === 'admitted-source-replay' && c.disposition === 'reserved'
  );
  if (open === undefined) {
    return fail(`the task holds no open source-replay envelope`);
  }
  const envelope: ISourceReplayEnvelope = {
    remainingRequiredUpdates: open.envelope.remainingRequiredUpdates + add.remainingRequiredUpdates,
    remainingRequiredBytes: open.envelope.remainingRequiredBytes + add.remainingRequiredBytes
  };
  const added: DimensionAmounts = amountsOf(charges);
  const claims: ReadonlyArray<ITaskCapacityClaim> = record.capacityClaims.map((c) =>
    c.claimId !== open.claimId
      ? c
      : {
          ...open,
          envelope,
          charges: open.charges.map((charge) => ({
            dimension: charge.dimension,
            amount: charge.amount + added[charge.dimension]
          }))
        }
  );
  const draft: ITaskRecordDraft =
    record.recordType === 'resolved'
      ? {
          recordType: 'resolved',
          task: record.task,
          ...(record.sourceRevision !== undefined ? { sourceRevision: record.sourceRevision } : {}),
          operations: record.operations,
          updates: record.updates,
          archived: record.archived
        }
      : { recordType: 'unresolved', reference: record.reference, operations: record.operations };
  return succeed({ claims, envelope, draft });
}
