/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Converter, Result, mapResults, succeed } from '@fgv/ts-utils';
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
