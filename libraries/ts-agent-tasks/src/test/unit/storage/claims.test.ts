/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { CapacityClaimId, ITaskCapacityClaim, SubscriptionId } from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { checkSubscriptionClaims } from '../../../packlets/storage/claims';

const subscriptionId = 'sub-1' as SubscriptionId;

function activation(disposition: ITaskCapacityClaim['disposition'] = 'consumed'): ITaskCapacityClaim {
  return {
    claimVersion: 1,
    claimId: 'c-activation' as CapacityClaimId,
    owner: { owner: 'subscription', subscriptionId },
    ownership: 'live',
    disposition,
    charges: [],
    purpose: 'subscription-activation',
    subscriptionId
  };
}

function preparation(
  amount: number,
  disposition: ITaskCapacityClaim['disposition'] = 'reserved'
): ITaskCapacityClaim {
  return {
    claimVersion: 1,
    claimId: 'c-preparation' as CapacityClaimId,
    owner: { owner: 'subscription', subscriptionId },
    ownership: 'live',
    disposition,
    charges: [
      { dimension: 'record-bytes', amount },
      { dimension: 'logical-bytes', amount }
    ],
    purpose: 'receipt-preparation',
    subscriptionId
  };
}

describe('checkSubscriptionClaims', () => {
  test('a live pair with no preparationBytes given defaults the expected charge to zero', () => {
    expect(
      checkSubscriptionClaims([activation(), preparation(0)], { subscriptionId, ownership: 'live' })
    ).toSucceedWith(true);
    expect(
      checkSubscriptionClaims([activation(), preparation(1)], { subscriptionId, ownership: 'live' })
    ).toFailWith(/reserves exactly 0 record and logical bytes/);
  });
});
