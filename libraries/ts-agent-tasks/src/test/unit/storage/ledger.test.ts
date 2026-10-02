/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { defaultTaskCapacityProfile } from '../../../index';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { CapacityLedger, ILedgerEntry, zeroAmounts } from '../../../packlets/storage/ledger';

/** A minimal ledger entry, `amount`/`limit` only relevant when `perOwner` is supplied. */
function entry(recordId: string, perOwner?: { amount: number; limit: number }): ILedgerEntry {
  return {
    recordId,
    used: zeroAmounts(),
    reserved: zeroAmounts(),
    recordLimit: Number.MAX_SAFE_INTEGER,
    indeterminate: false,
    ...(perOwner !== undefined ? { perOwner } : {})
  };
}

function ledger(): CapacityLedger {
  return new CapacityLedger(defaultTaskCapacityProfile, entry('repository'));
}

describe('CapacityLedger.admit: the per-owner history commitment', () => {
  test('an entry with no perOwner is skipped entirely', () => {
    const l = ledger();
    expect(l.admit(new Map([['consumer:sub', entry('sub')]]))).toSucceedWith(true);
  });

  test('a first-time commitment within its limit is admitted', () => {
    const l = ledger();
    expect(l.admit(new Map([['consumer:sub', entry('sub', { amount: 5, limit: 10 })]]))).toSucceedWith(true);
  });

  test('growing within the limit is admitted', () => {
    const l = ledger();
    l.admit(new Map([['consumer:sub', entry('sub', { amount: 5, limit: 10 })]])).orThrow();
    l.apply(new Map([['consumer:sub', entry('sub', { amount: 5, limit: 10 })]]));
    expect(l.admit(new Map([['consumer:sub', entry('sub', { amount: 8, limit: 10 })]]))).toSucceedWith(true);
  });

  test('growing past the limit is refused', () => {
    const l = ledger();
    l.admit(new Map([['consumer:sub', entry('sub', { amount: 5, limit: 10 })]])).orThrow();
    l.apply(new Map([['consumer:sub', entry('sub', { amount: 5, limit: 10 })]]));
    expect(l.admit(new Map([['consumer:sub', entry('sub', { amount: 11, limit: 10 })]]))).toFailWithDetail(
      /would commit 11 acknowledgement ids, over its limit of 10/,
      expect.objectContaining({ code: 'backpressure' })
    );
  });

  test('an amount already over its limit that does not grow further is admitted, not refused', () => {
    const l = ledger();
    // Committed once, already at 12 against a limit of 10 (e.g. the limit was lowered since).
    l.admit(new Map([['consumer:sub', entry('sub', { amount: 12, limit: 12 })]])).orThrow();
    l.apply(new Map([['consumer:sub', entry('sub', { amount: 12, limit: 12 })]]));
    expect(l.admit(new Map([['consumer:sub', entry('sub', { amount: 12, limit: 10 })]]))).toSucceedWith(true);
    // Shrinking the same already-over-limit commitment is admitted too.
    expect(l.admit(new Map([['consumer:sub', entry('sub', { amount: 9, limit: 10 })]]))).toSucceedWith(true);
  });
});
