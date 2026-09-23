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
  TaskId,
  maximumClosureCharges,
  maximumResolutionCharges
} from '../types';
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
  claimId: Converter<CapacityClaimId>
): Result<ReadonlyArray<ITaskCapacityClaim>> {
  const mint = (): Result<CapacityClaimId> => environment.newId().onSuccess((raw) => claimId.convert(raw));
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
  if (!unresolved) {
    return mapResults([closeout]);
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
  return mapResults([closeout, resolution]);
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
  readonly archived: boolean;
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
    maximumResolutionCharges(profile).onSuccess((resolution) => {
      const seen: Set<CapacityClaimPurpose> = new Set<CapacityClaimPurpose>();
      for (const claim of claims) {
        if (claim.purpose !== 'terminal-closeout' && claim.purpose !== 'first-resolution') {
          return fail<true>(`claim ${claim.claimId}: a task record does not hold a '${claim.purpose}' claim`);
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
      return succeed<true>(true);
    })
  );
}

type TaskHeldClaim = Extract<ITaskCapacityClaim, { purpose: 'terminal-closeout' | 'first-resolution' }>;

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
