/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import {
  CapacityClaimId,
  CapacityClaimOwnership,
  CapacityClaimPurpose,
  ITaskCapacityCharge,
  ITaskCapacityClaim,
  ITaskCapacityProfile,
  ITaskEnvironment,
  ISourceReplayEnvelope,
  OperationId,
  TaskId,
  maximumClosureCharges,
  maximumResolutionCharges,
  maximumSettlementCharges
} from '../types';
import { mintId } from './failures';
import { DimensionAmounts } from './ledger';

/**
 * Mints the claims a new registration reserves (design §8.6, protected allocation 1).
 *
 * @remarks
 * Every accepted task reserves its whole terminal closeout before it exists. An unresolved
 * registration additionally reserves its first resolution, because it must be able to become a
 * real task *and then* finish. Claim IDs come from the host's ID factory once, are written into
 * the pending inventory entry, and are the IDs every later owner of the reservation keeps — a
 * resumed registration never mints again.
 *
 * The audience is empty: this release has no subscriptions, so there is no one yet whose
 * terminal obligation must be reserved. Expanding it is subscription creation's job (T7).
 * @internal
 */
export function mintRegistrationClaims(
  taskId: TaskId,
  unresolved: boolean,
  profile: ITaskCapacityProfile,
  environment: ITaskEnvironment,
  claimId: Converter<CapacityClaimId>,
  replay?: ISourceReplayAdmission
): Result<ReadonlyArray<ITaskCapacityClaim>> {
  const mint = (): Result<CapacityClaimId> => mintId(environment).onSuccess((raw) => claimId.convert(raw));
  const closeout: Result<ITaskCapacityClaim> = maximumClosureCharges(profile).onSuccess((charges) =>
    mint().onSuccess((id) =>
      succeed<ITaskCapacityClaim>({
        claimVersion: 1,
        claimId: id,
        owner: { owner: 'task', taskId },
        ownership: 'pending',
        disposition: 'reserved',
        charges,
        purpose: 'terminal-closeout',
        taskId,
        audience: []
      })
    )
  );
  const replayClaim: ReadonlyArray<Result<ITaskCapacityClaim>> =
    replay === undefined
      ? []
      : [
          replayCharges(replay.envelope, profile).onSuccess((charges) =>
            mint().onSuccess((id) =>
              succeed<ITaskCapacityClaim>({
                claimVersion: 1,
                claimId: id,
                owner: { owner: 'task', taskId },
                ownership: 'pending',
                disposition: 'reserved',
                charges,
                purpose: 'admitted-source-replay',
                sourceId: replay.sourceId,
                envelope: replay.envelope
              })
            )
          )
        ];
  if (!unresolved) {
    return mapResults([closeout, ...replayClaim]);
  }
  const resolution: Result<ITaskCapacityClaim> = maximumResolutionCharges(profile).onSuccess((charges) =>
    mint().onSuccess((id) =>
      succeed<ITaskCapacityClaim>({
        claimVersion: 1,
        claimId: id,
        owner: { owner: 'task', taskId },
        ownership: 'pending',
        disposition: 'reserved',
        charges,
        purpose: 'first-resolution',
        taskId
      })
    )
  );
  return mapResults([closeout, resolution, ...replayClaim]);
}

/**
 * What a `source-replay` registration asks storage to reserve (design § 8.6, *Source-replay
 * qualification*).
 * @internal
 */
export interface ISourceReplayAdmission {
  readonly sourceId: string;
  readonly envelope: ISourceReplayEnvelope;
}

/**
 * The charges a finite replay envelope reserves: one update, its audience links and exact
 * acknowledgement evidence per remaining required update, and the declared bytes as record,
 * logical and resident payload bytes.
 *
 * @remarks
 * The declared bytes may not exceed what the declared updates could carry at the profile's
 * update bound: an envelope that does is not a finite qualification but an inconsistent one.
 * @internal
 */
export function replayCharges(
  envelope: ISourceReplayEnvelope,
  profile: ITaskCapacityProfile
): Result<ReadonlyArray<ITaskCapacityCharge>> {
  const n: number = envelope.remainingRequiredUpdates;
  const bytes: number = envelope.remainingRequiredBytes;
  const links: number = n * profile.perOwner.maxAudiencePerUpdate;
  const carried: number = n * profile.encoded.maxUpdateBytes;
  if (!Number.isSafeInteger(links) || !Number.isSafeInteger(carried)) {
    return fail(`replay envelope of ${n} updates is past the safe-integer range`);
  }
  if (bytes > carried) {
    return fail(
      `replay envelope declares ${bytes} bytes for ${n} required updates, more than they can carry ` +
        `at ${profile.encoded.maxUpdateBytes} bytes each`
    );
  }
  return succeed([
    { dimension: 'updates', amount: n },
    { dimension: 'audience-links', amount: links },
    { dimension: 'acknowledgement-ids', amount: links },
    { dimension: 'record-bytes', amount: bytes },
    { dimension: 'logical-bytes', amount: bytes },
    { dimension: 'resident-payload-bytes', amount: bytes }
  ]);
}

/**
 * Mints the settlement claim an external command reserves before it is dispatched (design § 8.6,
 * protected allocation 3): its maximum settled receipt and owed result, held while the outcome is
 * uncertain, so an accepted attempt can always settle.
 * @internal
 */
export function mintSettlementClaim(
  taskId: TaskId,
  operationId: OperationId,
  profile: ITaskCapacityProfile,
  environment: ITaskEnvironment,
  claimId: Converter<CapacityClaimId>
): Result<ITaskCapacityClaim> {
  return maximumSettlementCharges(profile).onSuccess((charges) =>
    mintId(environment)
      .onSuccess((raw) => claimId.convert(raw))
      .onSuccess((id) =>
        succeed<ITaskCapacityClaim>({
          claimVersion: 1,
          claimId: id,
          owner: { owner: 'operation', taskId, operationId },
          ownership: 'live',
          disposition: 'reserved',
          charges,
          purpose: 'accepted-operation-settlement',
          taskId,
          operationId
        })
      )
  );
}

/**
 * Spends growth from the one claim `select` picks, and optionally consumes it. Every other claim
 * is returned untouched.
 * @internal
 */
export function spendOne(
  claims: ReadonlyArray<ITaskCapacityClaim>,
  select: (claim: ITaskCapacityClaim) => boolean,
  growth: DimensionAmounts,
  consume: boolean,
  update?: (claim: ITaskCapacityClaim) => ITaskCapacityClaim
): ReadonlyArray<ITaskCapacityClaim> {
  return claims.map((claim) => {
    if (!select(claim) || claim.disposition !== 'reserved') {
      return claim;
    }
    const charges: ReadonlyArray<ITaskCapacityCharge> = claim.charges.map((charge) => {
      const spent: number = Math.min(charge.amount, Math.max(0, growth[charge.dimension]));
      growth[charge.dimension] -= spent;
      return { dimension: charge.dimension, amount: charge.amount - spent };
    });
    const spentClaim: ITaskCapacityClaim = {
      ...claim,
      charges,
      disposition: consume ? 'consumed' : 'reserved'
    };
    return update !== undefined ? update(spentClaim) : spentClaim;
  });
}

/**
 * Moves claims to a new owning record state, keeping every ID and charge.
 * @internal
 */
export function withOwnership(
  claims: ReadonlyArray<ITaskCapacityClaim>,
  ownership: CapacityClaimOwnership
): ReadonlyArray<ITaskCapacityClaim> {
  return claims.map((claim) => ({ ...claim, ownership }));
}

/**
 * Spends a protected step's growth from the step's own claim.
 *
 * @remarks
 * For each dimension the claim charges, the step's growth in that dimension is taken from the
 * charge, which shrinks by that much; growth beyond the charge is left for ordinary admission
 * to find headroom for. So `used + reserved` does not move for a step that stays inside its
 * reservation, and a step can never spend another record's reservation. With `consume`, the
 * claim's remaining charge is released and the claim kept as `consumed` evidence.
 *
 * A claim of that purpose that is not `reserved` is left alone: nothing is left to spend, and
 * an `indeterminate` one must stay fenced.
 * @internal
 */
export function spendClaim(
  claims: ReadonlyArray<ITaskCapacityClaim>,
  purpose: CapacityClaimPurpose,
  growth: DimensionAmounts,
  consume: boolean
): ReadonlyArray<ITaskCapacityClaim> {
  return claims.map((claim) => {
    if (claim.purpose !== purpose || claim.disposition !== 'reserved') {
      return claim;
    }
    const charges: ReadonlyArray<ITaskCapacityCharge> = claim.charges.map((charge) => ({
      dimension: charge.dimension,
      amount: charge.amount - Math.min(charge.amount, Math.max(0, growth[charge.dimension]))
    }));
    return { ...claim, charges, disposition: consume ? 'consumed' : 'reserved' };
  });
}

/**
 * What a task's claims must be, given the state of the record (or pending entry) holding them.
 * @internal
 */
export interface ITaskClaimExpectation {
  readonly taskId: TaskId;
  readonly ownership: CapacityClaimOwnership;
  /** The holder is an unresolved record, or a pending registration of one. */
  readonly unresolved: boolean;
  /** The task was registered by `register-external`: the only origin a first resolution has. */
  readonly external: boolean;
  readonly archived: boolean;
  /** The task has reached a terminal state (archived tasks included). */
  readonly terminal?: boolean;
  /** The task's source id, when it has a binding. */
  readonly sourceId?: string;
  /** Every stored command, by operation id: `true` once its dispatch is settled. */
  readonly commands?: ReadonlyMap<OperationId, boolean>;
}

/**
 * Checks a task's claims against what the repository would have written for it.
 *
 * @remarks
 * The claim-id join at open proves only which reservation is which. This proves each one is a
 * reservation this release computes: owned by this task, held with the expected ownership, of
 * a purpose a task record holds, still at most its bundle's maximum in every dimension it
 * charges, and in the disposition the record's state implies — a closeout claim reserved
 * until the archive consumes it, a first-resolution claim reserved exactly while the record is
 * unresolved. An `indeterminate` claim passes: the ledger fences all growth while one stands,
 * which is the recovery posture that state exists to force.
 * @internal
 */
export function checkTaskClaims(
  claims: ReadonlyArray<ITaskCapacityClaim>,
  expected: ITaskClaimExpectation,
  profile: ITaskCapacityProfile
): Result<true> {
  return maximumClosureCharges(profile).onSuccess((closeout) =>
    maximumResolutionCharges(profile).onSuccess((resolution) =>
      maximumSettlementCharges(profile).onSuccess((settlementBundle) => {
        const seen: Set<CapacityClaimPurpose> = new Set<CapacityClaimPurpose>();
        const settled: Set<OperationId> = new Set<OperationId>();
        for (const claim of claims) {
          if (claim.purpose === 'accepted-operation-settlement') {
            const problem: string | undefined = _settlementProblem(
              claim,
              expected,
              settled,
              settlementBundle
            );
            if (problem !== undefined) {
              return fail<true>(`claim ${claim.claimId}: ${problem}`);
            }
            continue;
          }
          if (claim.purpose === 'admitted-source-replay') {
            const problem: string | undefined = _replayProblem(claim, expected, seen);
            if (problem !== undefined) {
              return fail<true>(`claim ${claim.claimId}: ${problem}`);
            }
            seen.add(claim.purpose);
            continue;
          }
          if (claim.purpose !== 'terminal-closeout' && claim.purpose !== 'first-resolution') {
            return fail<true>(
              `claim ${claim.claimId}: a task record does not hold a '${claim.purpose}' claim`
            );
          }
          const bundle: ReadonlyArray<ITaskCapacityCharge> =
            claim.purpose === 'terminal-closeout' ? closeout : resolution;
          const problem: string | undefined = _claimProblem(claim, expected, bundle, seen);
          if (problem !== undefined) {
            return fail<true>(`claim ${claim.claimId}: ${problem}`);
          }
          seen.add(claim.purpose);
        }
        if (!seen.has('terminal-closeout')) {
          return fail<true>(`task ${expected.taskId} holds no terminal-closeout claim`);
        }
        if (expected.unresolved && !seen.has('first-resolution')) {
          return fail<true>(`unresolved task ${expected.taskId} holds no first-resolution claim`);
        }
        // An uncertain or unsent command holds its settlement reservation until it settles.
        for (const [operationId, isSettled] of expected.commands ?? []) {
          if (!isSettled && !settled.has(operationId)) {
            return fail<true>(`unsettled command '${operationId}' holds no settlement claim`);
          }
        }
        return succeed<true>(true);
      })
    )
  );
}

type TaskHeldClaim = Extract<ITaskCapacityClaim, { purpose: 'terminal-closeout' | 'first-resolution' }>;
type SettlementClaim = Extract<ITaskCapacityClaim, { purpose: 'accepted-operation-settlement' }>;
type ReplayClaim = Extract<ITaskCapacityClaim, { purpose: 'admitted-source-replay' }>;

/** A disposition problem, allowing `indeterminate` — which fences rather than guesses. */
function _disposition(claim: ITaskCapacityClaim, consumed: boolean): string | undefined {
  const disposition: string = consumed ? 'consumed' : 'reserved';
  return claim.disposition === disposition || claim.disposition === 'indeterminate'
    ? undefined
    : `disposition '${claim.disposition}', expected '${disposition}'`;
}

/** Charges within a bundle's maxima, dimension by dimension. */
function _withinBundle(
  claim: ITaskCapacityClaim,
  bundle: ReadonlyArray<ITaskCapacityCharge>
): string | undefined {
  for (const charge of claim.charges) {
    const max: ITaskCapacityCharge | undefined = bundle.find((c) => c.dimension === charge.dimension);
    if (max === undefined || charge.amount > max.amount) {
      return `charges ${charge.amount} of '${charge.dimension}', more than its bundle reserves`;
    }
  }
  return undefined;
}

/**
 * A settlement claim is owned by one of this task's stored commands, is live, is the only claim of
 * that command, stays within the settlement bundle, and is reserved exactly while the command is
 * unsettled.
 */
function _settlementProblem(
  claim: SettlementClaim,
  expected: ITaskClaimExpectation,
  seen: Set<OperationId>,
  bundle: ReadonlyArray<ITaskCapacityCharge>
): string | undefined {
  const owner = claim.owner;
  if (
    owner.owner !== 'operation' ||
    owner.taskId !== expected.taskId ||
    claim.taskId !== expected.taskId ||
    owner.operationId !== claim.operationId
  ) {
    return `not owned by an operation of task ${expected.taskId}`;
  }
  if (claim.ownership !== 'live') {
    return `ownership '${claim.ownership}', expected 'live'`;
  }
  const isSettled: boolean | undefined = expected.commands?.get(claim.operationId);
  if (isSettled === undefined) {
    return `names command '${claim.operationId}', which the record does not hold`;
  }
  if (seen.has(claim.operationId)) {
    return `a second settlement claim for command '${claim.operationId}'`;
  }
  seen.add(claim.operationId);
  return _withinBundle(claim, bundle) ?? _disposition(claim, isSettled);
}

/**
 * A replay-envelope claim is owned by this task, names the task's own source, is the only one, and
 * is reserved until the task is terminal. Its charges shrink as the feed spends them, so they are
 * bounded by the claim's own (remaining) envelope.
 */
function _replayProblem(
  claim: ReplayClaim,
  expected: ITaskClaimExpectation,
  seen: ReadonlySet<CapacityClaimPurpose>
): string | undefined {
  if (claim.owner.owner !== 'task' || claim.owner.taskId !== expected.taskId) {
    return `not owned by task ${expected.taskId}`;
  }
  if (claim.ownership !== expected.ownership) {
    return `ownership '${claim.ownership}', expected '${expected.ownership}'`;
  }
  if (seen.has(claim.purpose)) {
    return `a second '${claim.purpose}' claim`;
  }
  if (!expected.external || claim.sourceId !== expected.sourceId) {
    return `names source '${claim.sourceId}', which does not execute this task`;
  }
  return _disposition(claim, expected.terminal === true || expected.archived);
}

function _claimProblem(
  claim: TaskHeldClaim,
  expected: ITaskClaimExpectation,
  bundle: ReadonlyArray<ITaskCapacityCharge>,
  seen: ReadonlySet<CapacityClaimPurpose>
): string | undefined {
  if (
    claim.owner.owner !== 'task' ||
    claim.owner.taskId !== expected.taskId ||
    claim.taskId !== expected.taskId
  ) {
    return `not owned by task ${expected.taskId}`;
  }
  if (claim.ownership !== expected.ownership) {
    return `ownership '${claim.ownership}', expected '${expected.ownership}'`;
  }
  if (seen.has(claim.purpose)) {
    return `a second '${claim.purpose}' claim`;
  }
  if (claim.purpose === 'first-resolution' && !expected.external) {
    return `a first-resolution claim on a task that was not registered by 'register-external'`;
  }
  // Spending shrinks a charge but never removes it, so a claim names exactly its bundle's
  // dimensions for its whole life. A missing one would hold nothing where the closeout path
  // still needs room.
  for (const max of bundle) {
    if (!claim.charges.some((c) => c.dimension === max.dimension)) {
      return `does not charge '${max.dimension}', which its bundle reserves`;
    }
  }
  for (const charge of claim.charges) {
    const max: ITaskCapacityCharge | undefined = bundle.find((c) => c.dimension === charge.dimension);
    if (max === undefined || charge.amount > max.amount) {
      return `charges ${charge.amount} of '${charge.dimension}', more than its bundle reserves`;
    }
  }
  // A resolved record holds a first-resolution claim only if it was registered unresolved,
  // and then its resolution consumed it.
  const consumed: boolean = claim.purpose === 'terminal-closeout' ? expected.archived : !expected.unresolved;
  const disposition: string = consumed ? 'consumed' : 'reserved';
  // `indeterminate` is the one other state a claim may be in: the ledger fences all growth
  // while it stands, so it is accounted for rather than guessed at.
  return claim.disposition === disposition || claim.disposition === 'indeterminate'
    ? undefined
    : `disposition '${claim.disposition}', expected '${disposition}'`;
}
