// Copyright (c) 2024 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Validation helpers for branded types
 * @packageDocumentation
 */

import { Failure, Result, Success } from '@fgv/ts-utils';

import {
  BASE_ID_PATTERN,
  BaseConfectionId,
  BaseFillingId,
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  BaseTaskId,
  Celsius,
  CONFECTION_VERSION_SPEC_PATTERN,
  ConfectionName,
  ConfectionVersionSpec,
  DegreesMacMichael,
  FillingName,
  FillingVersionSpec,
  FILLING_VERSION_SPEC_PATTERN,
  IHasId,
  IIdsWithPreferred,
  IOptionsWithPreferred,
  JOURNAL_ID_PATTERN,
  JournalId,
  Measurement,
  Millimeters,
  Minutes,
  Percentage,
  RatingScore,
  SESSION_ID_PATTERN,
  SessionId,
  SlotId,
  SourceId,
  UrlCategory
} from './model';

// ============================================================================
// Base ID Validators (no dots allowed)
// ============================================================================

/**
 * Type guard for {@link SourceId | SourceId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link SourceId | SourceId}.
 * @public
 */
export function isValidSourceId(from: unknown): from is SourceId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link SourceId | SourceId}.
 * @param from - Value to validate
 * @returns `Success` with {@link SourceId | SourceId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toSourceId(from: unknown): Result<SourceId> {
  if (isValidSourceId(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid SourceId: must be non-empty alphanumeric with dashes/underscores, no dots');
}

/**
 * Type guard for {@link BaseIngredientId | BaseIngredientId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link BaseIngredientId | BaseIngredientId}.
 * @public
 */
export function isValidBaseIngredientId(from: unknown): from is BaseIngredientId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link BaseIngredientId | BaseIngredientId}.
 * @param from - Value to validate
 * @returns `Success` with {@link BaseIngredientId | BaseIngredientId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toBaseIngredientId(from: unknown): Result<BaseIngredientId> {
  if (isValidBaseIngredientId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid BaseIngredientId: must be non-empty alphanumeric with dashes/underscores, no dots'
  );
}

/**
 * Type guard for {@link BaseFillingId | BaseFillingId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link BaseFillingId | BaseFillingId}.
 * @public
 */
export function isValidBaseFillingId(from: unknown): from is BaseFillingId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link BaseFillingId | BaseFillingId}.
 * @param from - Value to validate
 * @returns `Success` with {@link BaseFillingId | BaseFillingId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toBaseFillingId(from: unknown): Result<BaseFillingId> {
  if (isValidBaseFillingId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid BaseFillingId: must be non-empty alphanumeric with dashes/underscores, no dots'
  );
}

/**
 * Type guard for {@link BaseMoldId | BaseMoldId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link BaseMoldId | BaseMoldId}.
 * @public
 */
export function isValidBaseMoldId(from: unknown): from is BaseMoldId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link BaseMoldId | BaseMoldId}.
 * @param from - Value to validate
 * @returns `Success` with {@link BaseMoldId | BaseMoldId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toBaseMoldId(from: unknown): Result<BaseMoldId> {
  if (isValidBaseMoldId(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid BaseMoldId: must be non-empty alphanumeric with dashes/underscores, no dots');
}

/**
 * Type guard for {@link BaseProcedureId | BaseProcedureId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link BaseProcedureId | BaseProcedureId}.
 * @public
 */
export function isValidBaseProcedureId(from: unknown): from is BaseProcedureId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link BaseProcedureId | BaseProcedureId}.
 * @param from - Value to validate
 * @returns `Success` with {@link BaseProcedureId | BaseProcedureId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toBaseProcedureId(from: unknown): Result<BaseProcedureId> {
  if (isValidBaseProcedureId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid BaseProcedureId: must be non-empty alphanumeric with dashes/underscores, no dots'
  );
}

/**
 * Type guard for {@link BaseTaskId | BaseTaskId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link BaseTaskId | BaseTaskId}.
 * @public
 */
export function isValidBaseTaskId(from: unknown): from is BaseTaskId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link BaseTaskId | BaseTaskId}.
 * @param from - Value to validate
 * @returns `Success` with {@link BaseTaskId | BaseTaskId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toBaseTaskId(from: unknown): Result<BaseTaskId> {
  if (isValidBaseTaskId(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid BaseTaskId: must be non-empty alphanumeric with dashes/underscores, no dots');
}

/**
 * Type guard for {@link BaseConfectionId | BaseConfectionId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link BaseConfectionId | BaseConfectionId}.
 * @public
 */
export function isValidBaseConfectionId(from: unknown): from is BaseConfectionId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link BaseConfectionId | BaseConfectionId}.
 * @param from - Value to validate
 * @returns `Success` with {@link BaseConfectionId | BaseConfectionId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toBaseConfectionId(from: unknown): Result<BaseConfectionId> {
  if (isValidBaseConfectionId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid BaseConfectionId: must be non-empty alphanumeric with dashes/underscores, no dots'
  );
}

/**
 * Type guard for {@link UrlCategory | UrlCategory}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link UrlCategory | UrlCategory}.
 * @public
 */
export function isValidUrlCategory(from: unknown): from is UrlCategory {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link UrlCategory | UrlCategory}.
 * @param from - Value to validate
 * @returns `Success` with {@link UrlCategory | UrlCategory} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toUrlCategory(from: unknown): Result<UrlCategory> {
  if (isValidUrlCategory(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid UrlCategory: must be non-empty alphanumeric with dashes/underscores, no dots');
}

// ============================================================================
// Other String Validators
// ============================================================================

/**
 * Type guard for {@link FillingName | FillingName}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link FillingName | FillingName}.
 * @public
 */
export function isValidFillingName(from: unknown): from is FillingName {
  return typeof from === 'string' && from.length > 0;
}

/**
 * Validates unknown value is a {@link FillingName | FillingName}.
 * @param from - Value to validate
 * @returns `Success` with {@link FillingName | FillingName} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toFillingName(from: unknown): Result<FillingName> {
  if (isValidFillingName(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid FillingName: must be a non-empty string');
}

/**
 * Type guard for {@link ConfectionName | ConfectionName}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link ConfectionName | ConfectionName}.
 * @public
 */
export function isValidConfectionName(from: unknown): from is ConfectionName {
  return typeof from === 'string' && from.length > 0;
}

/**
 * Validates unknown value is a {@link ConfectionName | ConfectionName}.
 * @param from - Value to validate
 * @returns `Success` with {@link ConfectionName | ConfectionName} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toConfectionName(from: unknown): Result<ConfectionName> {
  if (isValidConfectionName(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid ConfectionName: must be a non-empty string');
}

/**
 * Type guard for {@link FillingVersionSpec | FillingVersionSpec}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link FillingVersionSpec | FillingVersionSpec}.
 * @public
 */
export function isValidFillingVersionSpec(from: unknown): from is FillingVersionSpec {
  return typeof from === 'string' && FILLING_VERSION_SPEC_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link FillingVersionSpec | FillingVersionSpec}.
 * @param from - Value to validate
 * @returns `Success` with {@link FillingVersionSpec | FillingVersionSpec} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toFillingVersionSpec(from: unknown): Result<FillingVersionSpec> {
  if (isValidFillingVersionSpec(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid FillingVersionSpec: must be in format YYYY-MM-DD-NN with optional lowercase label (e.g., "2026-01-03-01" or "2026-01-03-02-tweaked")'
  );
}

/**
 * Type guard for {@link ConfectionVersionSpec | ConfectionVersionSpec}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link ConfectionVersionSpec | ConfectionVersionSpec}.
 * @public
 */
export function isValidConfectionVersionSpec(from: unknown): from is ConfectionVersionSpec {
  return typeof from === 'string' && CONFECTION_VERSION_SPEC_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link ConfectionVersionSpec | ConfectionVersionSpec}.
 * @param from - Value to validate
 * @returns `Success` with {@link ConfectionVersionSpec | ConfectionVersionSpec} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toConfectionVersionSpec(from: unknown): Result<ConfectionVersionSpec> {
  if (isValidConfectionVersionSpec(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid ConfectionVersionSpec: must be in format YYYY-MM-DD-NN with optional lowercase label (e.g., "2026-01-03-01" or "2026-01-03-02-tweaked")'
  );
}

/**
 * Type guard for {@link SessionId | SessionId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link SessionId | SessionId}.
 * @public
 */
export function isValidSessionId(from: unknown): from is SessionId {
  return typeof from === 'string' && SESSION_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link SessionId | SessionId}.
 * @param from - Value to validate
 * @returns `Success` with {@link SessionId | SessionId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toSessionId(from: unknown): Result<SessionId> {
  if (isValidSessionId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    `${from}: Invalid SessionId: must be in format YYYY-MM-DD-HHMMSS-xxxxxxxx (e.g., "2026-01-15-143025-a1b2c3d4")`
  );
}

// ============================================================================
// Numeric Validators
// ============================================================================

/**
 * Type guard for {@link Measurement | Measurement}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link Measurement | Measurement} value.
 * @public
 */
export function isValidMeasurement(from: unknown): from is Measurement {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0;
}

/**
 * Validates unknown value is a {@link Measurement | Measurement}.
 * @param from - Value to validate
 * @returns `Success` with {@link Measurement | Measurement} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toMeasurement(from: unknown): Result<Measurement> {
  if (isValidMeasurement(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Measurement: must be a non-negative finite number');
}

/**
 * Type guard for {@link Percentage | Percentage}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link Percentage | Percentage} (0-100).
 * @public
 */
export function isValidPercentage(from: unknown): from is Percentage {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0 && from <= 100;
}

/**
 * Validates unknown value is a {@link Percentage | Percentage}.
 * @param from - Value to validate
 * @returns `Success` with {@link Percentage | Percentage} or `Failure` with an
 * error message if validation fails.
 * @public
 */
export function toPercentage(from: unknown): Result<Percentage> {
  if (isValidPercentage(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Percentage: must be a number between 0 and 100');
}

/**
 * Type guard for {@link Celsius | Celsius}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link Celsius | Celsius} temperature.
 * @public
 */
export function isValidCelsius(from: unknown): from is Celsius {
  return typeof from === 'number' && Number.isFinite(from);
}

/**
 * Validates unknown value is a {@link Celsius | Celsius}.
 * @param from - Value to validate
 * @returns `Success` with {@link Celsius | Celsius} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toCelsius(from: unknown): Result<Celsius> {
  if (isValidCelsius(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Celsius: must be a finite number');
}

/**
 * Type guard for {@link DegreesMacMichael | DegreesMacMichael}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link DegreesMacMichael | DegreesMacMichael}.
 * @public
 */
export function isValidDegreesMacMichael(from: unknown): from is DegreesMacMichael {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0;
}

/**
 * Validates unknown value is a {@link DegreesMacMichael | DegreesMacMichael}.
 * @param from - Value to validate
 * @returns `Success` with {@link DegreesMacMichael | DegreesMacMichael} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toDegreesMacMichael(from: unknown): Result<DegreesMacMichael> {
  if (isValidDegreesMacMichael(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid DegreesMacMichael: must be a non-negative finite number');
}

/**
 * Type guard for {@link RatingScore | RatingScore}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link RatingScore | RatingScore} (1-5)
 * @public
 */
export function isValidRatingScore(from: unknown): from is RatingScore {
  return typeof from === 'number' && Number.isInteger(from) && from >= 1 && from <= 5;
}

/**
 * Validates unknown value is a {@link RatingScore | RatingScore}.
 * @param from - Value to validate
 * @returns `Success` with {@link RatingScore | RatingScore} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toRatingScore(from: unknown): Result<RatingScore> {
  if (isValidRatingScore(from)) {
    return Success.with(from);
  }
  return Failure.with(`${from}: Invalid RatingScore: must be an integer between 1 and 5`);
}

/**
 * Type guard for {@link Minutes | Minutes}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link Minutes | Minutes} value
 * @public
 */
export function isValidMinutes(from: unknown): from is Minutes {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0;
}

/**
 * Validates unknown value is a {@link Minutes | Minutes}.
 * @param from - Value to validate
 * @returns `Success` with {@link Minutes | Minutes} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toMinutes(from: unknown): Result<Minutes> {
  if (isValidMinutes(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Minutes: must be a non-negative finite number');
}

/**
 * Type guard for {@link Millimeters | Millimeters}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link Millimeters | Millimeters} value
 * @public
 */
export function isValidMillimeters(from: unknown): from is Millimeters {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0;
}

/**
 * Validates unknown value is a {@link Millimeters | Millimeters}.
 * @param from - Value to validate
 * @returns `Success` with {@link Millimeters | Millimeters} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toMillimeters(from: unknown): Result<Millimeters> {
  if (isValidMillimeters(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Millimeters: must be a non-negative finite number');
}

// ============================================================================
// Journal ID Validators
// ============================================================================

/**
 * Type guard for {@link JournalId | JournalId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link JournalId | JournalId}
 * @public
 */
export function isValidJournalId(from: unknown): from is JournalId {
  return typeof from === 'string' && JOURNAL_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link JournalId | JournalId}.
 * @param from - Value to validate
 * @returns `Success` with {@link JournalId | JournalId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toJournalId(from: unknown): Result<JournalId> {
  if (isValidJournalId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    `${from}: Invalid JournalId: must be in format YYYY-MM-DD-HHMMSS-xxxxxxxx (e.g., "2026-01-15-143025-a1b2c3d4")`
  );
}

// ============================================================================
// Slot ID Validators
// ============================================================================

/**
 * Type guard for {@link SlotId | SlotId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link SlotId | SlotId}.
 * @public
 */
export function isValidSlotId(from: unknown): from is SlotId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link SlotId | SlotId}.
 * @param from - Value to validate
 * @returns `Success` with {@link SlotId | SlotId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toSlotId(from: unknown): Result<SlotId> {
  if (isValidSlotId(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid SlotId: must be non-empty alphanumeric with dashes/underscores, no dots');
}

// ============================================================================
// Options with Preferred Validators
// ============================================================================

/**
 * Validates that preferredId (if specified) exists in the options array.
 *
 * @typeParam TOption - The option object type
 * @typeParam TId - The ID type
 * @param collection - The options collection to validate
 * @param context - Optional context string for error messages
 * @returns Success with the collection if valid, Failure if preferredId is not found in options
 * @public
 */
export function validateOptionsWithPreferred<TOption extends IHasId<TId>, TId extends string>(
  collection: IOptionsWithPreferred<TOption, TId>,
  context?: string
): Result<IOptionsWithPreferred<TOption, TId>> {
  if (collection.preferredId === undefined) {
    return Success.with(collection);
  }
  const found = collection.options.some((opt) => opt.id === collection.preferredId);
  if (found) {
    return Success.with(collection);
  }
  const prefix = context ? `${context}: ` : '';
  return Failure.with(`${prefix}preferredId '${collection.preferredId}' not found in options`);
}

/**
 * Validates that preferredId (if specified) exists in the ids array.
 *
 * @typeParam TId - The ID type
 * @param collection - The IDs collection to validate
 * @param context - Optional context string for error messages
 * @returns Success with the collection if valid, Failure if preferredId is not found in ids
 * @public
 */
export function validateIdsWithPreferred<TId extends string>(
  collection: IIdsWithPreferred<TId>,
  context?: string
): Result<IIdsWithPreferred<TId>> {
  if (collection.preferredId === undefined) {
    return Success.with(collection);
  }
  if (collection.ids.includes(collection.preferredId)) {
    return Success.with(collection);
  }
  const prefix = context ? `${context}: ` : '';
  return Failure.with(`${prefix}preferredId '${collection.preferredId}' not found in ids`);
}
