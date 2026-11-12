/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, failWithDetail, succeed, succeedWithDetail } from '@fgv/ts-utils';
import { IEnvelopeCarrier, MemoryId } from '../types';
import {
  IMemoryWriteFailure,
  MemoryWriteExpectation,
  MemoryWriteFailureCode,
  MemoryWriteResult
} from './writeFailure';

/**
 * A write the store decided not to make — a precondition mismatch or a policy refusal — carried
 * as a value through the write pipeline so it reaches the caller with its classification intact.
 * A pipeline `Failure` is a fault, not a decision, and is classified `io` (see {@link settleWrite}).
 * @internal
 */
export class WriteRefusal {
  public readonly failure: IMemoryWriteFailure;
  public readonly message: string;

  public constructor(failure: IMemoryWriteFailure, message: string) {
    this.failure = failure;
    this.message = message;
  }
}

/**
 * Require `expected` to be a non-negative integer, or `'absent'` where `allowAbsent` (a `put`; a
 * delete that expects nothing has no meaning). A malformed value is a caller error, refused before
 * the store looks at the vault.
 * @internal
 */
export function validateExpectation(
  expected: MemoryWriteExpectation | undefined,
  label: string,
  allowAbsent: boolean
): Result<MemoryWriteExpectation | undefined> {
  if (
    expected === undefined ||
    (allowAbsent && expected === 'absent') ||
    (Number.isSafeInteger(expected) && Number(expected) >= 0)
  ) {
    return succeed(expected);
  }
  const allowed: string = allowAbsent
    ? "a non-negative integer seq or 'absent'"
    : 'a non-negative integer seq';
  return fail(`${label}: expected must be ${allowed} (got ${String(JSON.stringify(expected))})`);
}

/** What a conditional write compares against: the record's `seq`, or `'absent'`. @internal */
export function currentSeq(current: IEnvelopeCarrier | undefined): MemoryWriteExpectation {
  return current === undefined ? 'absent' : current.envelope.seq;
}

/**
 * Compare a write's expectation with what the store holds. `undefined` when the write may go
 * ahead — no expectation, or a match — and a conflict refusal otherwise.
 * @internal
 */
export function checkExpectation(
  expected: MemoryWriteExpectation | undefined,
  current: IEnvelopeCarrier | undefined,
  label: string
): WriteRefusal | undefined {
  const found: MemoryWriteExpectation = currentSeq(current);
  if (expected === undefined || expected === found) {
    return undefined;
  }
  return new WriteRefusal(
    { code: 'conflict', expected, current: found },
    `${label}: conflict: expected ${expected === 'absent' ? 'no record' : `seq ${expected}`}, found ${
      found === 'absent' ? 'no record' : `seq ${found}`
    }`
  );
}

/**
 * Refuse a conditional `put` whose content already exists under `existing`'s (different) id.
 * @internal
 */
export function duplicateRefusal(existing: IEnvelopeCarrier, label: string): WriteRefusal {
  const existingId: MemoryId = existing.envelope.id;
  return new WriteRefusal(
    { code: 'duplicate', existingId },
    `${label}: duplicate: the content already exists as '${existingId}'; nothing was written`
  );
}

/**
 * Turn a plain `Result` into a classified one: a failure takes `code`.
 * @internal
 */
export function classify<T>(
  result: Result<T>,
  code: Exclude<MemoryWriteFailureCode, 'conflict' | 'duplicate'>
): Result<T | WriteRefusal> {
  return result.isSuccess() ? result : succeed(new WriteRefusal({ code }, result.message));
}

/**
 * Settle a write pipeline's outcome for the caller: a refusal keeps its classification, any other
 * failure is `io`.
 * @internal
 */
export function settleWrite<T>(step: Result<T | WriteRefusal>): MemoryWriteResult<T> {
  if (step.isFailure()) {
    return failWithDetail(step.message, { code: 'io' });
  }
  const value: T | WriteRefusal = step.value;
  return value instanceof WriteRefusal
    ? failWithDetail(value.message, value.failure)
    : succeedWithDetail<T, IMemoryWriteFailure>(value);
}
