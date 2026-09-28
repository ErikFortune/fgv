/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  ITaskCapacityProfile,
  allCapacityDimensions,
  allStopIntentStates,
  allStopTargetStates,
  allTaskStatuses,
  defaultMaxStopTargets,
  defaultTaskFieldBounds,
  maximumSettlementCharges
} from '../types';
import { DimensionAmounts, ILedgerEntry, zeroAmounts } from './ledger';
import { IStopFacts } from './stopBook';

// The stop reservations (T9, A3): what an accepted cascade stop holds so that every attempt it has
// persisted can land, and the intent can be maintained and released, at a full repository. None of
// it is a stored claim: it is derived from the root's intents and the targets' records, like every
// other ledger figure, so open recomputes it and nothing can drift.

/**
 * A worst-case encoded width per UTF-16 unit of free single-line text. A BMP character is at most three
 * UTF-8 bytes, but a lone surrogate — which a single-line bound admits — is written by the record
 * encoder as a six-byte `\uXXXX` escape. Control characters, the only other escaped units, are refused.
 */
const worstBytesPerUnit: number = 6;

function _longest(values: ReadonlyArray<string>): string {
  return values.reduce((a, b) => (b.length > a.length ? b : a));
}

/**
 * The most bytes one stop target can encode to, every optional member present at its widest.
 *
 * @remarks
 * Identifiers are ASCII by their syntax and bounded by the default identifier bound, which
 * construction may lower and never raise, so it is a ceiling for every repository. Free single-line
 * text — a source revision's epoch and token, a contract version — is counted at its widest encoding,
 * six bytes per unit. Every other field is fixed framing.
 * @internal
 */
export function maximumStopTargetBytes(): number {
  const id: string = 'x'.repeat(defaultTaskFieldBounds.maxIdLength);
  const wide = (units: number): string => 'x'.repeat(units * worstBytesPerUnit);
  return JSON.stringify({
    attempt: Number.MAX_SAFE_INTEGER,
    confirmedRevision: Number.MAX_SAFE_INTEGER,
    operationId: id,
    stableSourceEvidence: {
      contractVersion: wide(defaultTaskFieldBounds.maxCodeLength),
      sourceId: id,
      sourceRevision: {
        epoch: wide(defaultTaskFieldBounds.maxIdLength),
        token: wide(defaultTaskFieldBounds.maxIdLength)
      }
    },
    state: _longest(allStopTargetStates),
    taskId: id,
    violation: { observedRevision: Number.MAX_SAFE_INTEGER, observedStatus: _longest(allTaskStatuses) }
  }).length;
}

/**
 * The most bytes one intent's framing — everything but its targets — can encode to, plus the
 * separators an intent adds to the record's `stops` array.
 * @internal
 */
export function maximumStopFramingBytes(): number {
  const id: string = 'x'.repeat(defaultTaskFieldBounds.maxIdLength);
  const framing: number = JSON.stringify({
    id,
    mode: 'cancel',
    requestedBy: 'x'.repeat(defaultTaskFieldBounds.maxSummaryLength * worstBytesPerUnit),
    rootId: id,
    state: _longest(allStopIntentStates),
    targets: [],
    topologyGeneration: Number.MAX_SAFE_INTEGER
  }).length;
  // The record's `"stops":[` key and brackets, and a separating comma per intent.
  return framing + JSON.stringify({ stops: [] }).length + 1;
}

/**
 * What one unlanded attempt reserves: one stop command landing on its target.
 *
 * @remarks
 * The command is one operation, at most `maxStoredOperationBytes`, and — for an external target —
 * the settlement claim T6 mints when the command's intent is recorded, which reserves the settled
 * receipt and the owed result (`maximumSettlementCharges`). A native pause or cancel lands as one
 * settled operation and its owed lifecycle update, which the same bundle covers. The additive
 * dimensions are held by the intent's root; `record-bytes` — a per-record dimension — by the
 * target, since that is the record that grows.
 * @internal
 */
export function stopAttemptBundle(profile: ITaskCapacityProfile): Result<DimensionAmounts> {
  return maximumSettlementCharges(profile).onSuccess((charges) => {
    const bundle: DimensionAmounts = zeroAmounts();
    for (const charge of charges) {
      bundle[charge.dimension] += charge.amount;
    }
    bundle.operations += 1;
    bundle['record-bytes'] += profile.encoded.maxStoredOperationBytes;
    bundle['logical-bytes'] += profile.encoded.maxStoredOperationBytes;
    return _safe(bundle, 'stop attempt bundle').onSuccess(() => _bounded(bundle, profile));
  });
}

/**
 * The most attempts a task's stop facts can count at once. As a root: its latching intents — one per
 * mode — times the target bound. As a target: the attempts bound for it, each of which holds one of
 * its operation slots, so at most the per-task operation limit.
 */
function _maximumAttempts(profile: ITaskCapacityProfile): number {
  return Math.max(2 * defaultMaxStopTargets, profile.perOwner.maxOperationsPerTask);
}

/**
 * The bundle, once every reservation {@link stopReserve} can derive from it is known to be exactly
 * representable: at most the most attempts times the bundle plus one intent's framing, one target's
 * encoding and one release operation — each counted at most that many times.
 */
function _bounded(bundle: DimensionAmounts, profile: ITaskCapacityProfile): Result<DimensionAmounts> {
  const most: number = _maximumAttempts(profile);
  const each: number =
    maximumStopFramingBytes() + maximumStopTargetBytes() + 1 + profile.encoded.maxStoredOperationBytes;
  const ceiling: DimensionAmounts = zeroAmounts();
  for (const dimension of allCapacityDimensions) {
    ceiling[dimension] = most * (bundle[dimension] + each);
  }
  return _safe(ceiling, 'stop reservation').onSuccess(() => succeed(bundle));
}

function _safe(amounts: DimensionAmounts, what: string): Result<DimensionAmounts> {
  for (const dimension of allCapacityDimensions) {
    if (!Number.isSafeInteger(amounts[dimension])) {
      return fail(`${what}: '${dimension}' is not exactly representable; the profile's bounds are too large`);
    }
  }
  return succeed(amounts);
}

/**
 * What a task's stop facts reserve, given the profile's attempt bundle.
 *
 * @remarks
 * - As a **root**: the additive dimensions of one attempt bundle per unlanded attempt of its latching
 *   intents; and per latching intent, the room its record needs to grow the intent to its widest
 *   (each target at {@link maximumStopTargetBytes}) plus one release operation — so the pump can
 *   always record what it learns, and a host can always release, at a full repository.
 * - As a **target**: the `record-bytes` of one attempt bundle per unlanded attempt that targets it.
 *
 * Every figure is exactly representable: {@link stopAttemptBundle} yields a bundle only when the
 * largest reservation any count of attempts could derive from it is.
 * @internal
 */
export function stopReserve(
  facts: IStopFacts,
  bundle: DimensionAmounts,
  profile: ITaskCapacityProfile
): DimensionAmounts {
  const reserve: DimensionAmounts = zeroAmounts();
  for (const dimension of allCapacityDimensions) {
    reserve[dimension] =
      bundle[dimension] * (dimension === 'record-bytes' ? facts.unlandedOn : facts.unlandedOf);
  }
  const widest: number =
    facts.latching * maximumStopFramingBytes() + facts.intentTargets * (maximumStopTargetBytes() + 1);
  const headroom: number =
    Math.max(0, widest - facts.intentBytes) + facts.latching * profile.encoded.maxStoredOperationBytes;
  reserve['record-bytes'] += headroom;
  reserve['logical-bytes'] += headroom;
  reserve.operations += facts.latching;
  return reserve;
}

/**
 * An entry with one stop reservation replaced by another. Every other figure is untouched.
 * @internal
 */
export function withStopReserve(
  entry: ILedgerEntry,
  previous: DimensionAmounts,
  next: DimensionAmounts
): ILedgerEntry {
  const reserved: DimensionAmounts = { ...entry.reserved };
  for (const dimension of allCapacityDimensions) {
    reserved[dimension] += next[dimension] - previous[dimension];
  }
  return { ...entry, reserved };
}
