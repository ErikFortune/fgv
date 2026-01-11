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
  COMPOSITE_ID_PATTERN,
  CONFECTION_VERSION_SPEC_PATTERN,
  ConfectionId,
  ConfectionName,
  ConfectionVersionId,
  ConfectionVersionSpec,
  DegreesMacMichael,
  FillingId,
  FillingName,
  FillingVersionId,
  FillingVersionSpec,
  FILLING_VERSION_SPEC_PATTERN,
  IHasId,
  IIdsWithPreferred,
  IngredientId,
  IOptionsWithPreferred,
  JOURNAL_ID_PATTERN,
  JournalId,
  Measurement,
  Millimeters,
  Minutes,
  MoldId,
  Percentage,
  ProcedureId,
  RatingScore,
  SESSION_ID_PATTERN,
  SessionId,
  SlotId,
  SourceId,
  TaskId,
  UrlCategory,
  VERSION_ID_SEPARATOR
} from './model';

// ============================================================================
// Base ID Validators (no dots allowed)
// ============================================================================

/**
 * Type guard for SourceId
 * @param from - Value to check
 * @returns True if the value is a valid SourceId
 * @public
 */
export function isValidSourceId(from: unknown): from is SourceId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to SourceId
 * @param from - Value to convert
 * @returns Result with SourceId or error
 * @public
 */
export function toSourceId(from: unknown): Result<SourceId> {
  if (isValidSourceId(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid SourceId: must be non-empty alphanumeric with dashes/underscores, no dots');
}

/**
 * Type guard for BaseIngredientId
 * @param from - Value to check
 * @returns True if the value is a valid BaseIngredientId
 * @public
 */
export function isValidBaseIngredientId(from: unknown): from is BaseIngredientId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to BaseIngredientId
 * @param from - Value to convert
 * @returns Result with BaseIngredientId or error
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
 * Type guard for BaseFillingId
 * @param from - Value to check
 * @returns True if the value is a valid BaseFillingId
 * @public
 */
export function isValidBaseFillingId(from: unknown): from is BaseFillingId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to BaseFillingId
 * @param from - Value to convert
 * @returns Result with BaseFillingId or error
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
 * Type guard for BaseMoldId
 * @param from - Value to check
 * @returns True if the value is a valid BaseMoldId
 * @public
 */
export function isValidBaseMoldId(from: unknown): from is BaseMoldId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to BaseMoldId
 * @param from - Value to convert
 * @returns Result with BaseMoldId or error
 * @public
 */
export function toBaseMoldId(from: unknown): Result<BaseMoldId> {
  if (isValidBaseMoldId(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid BaseMoldId: must be non-empty alphanumeric with dashes/underscores, no dots');
}

/**
 * Type guard for BaseProcedureId
 * @param from - Value to check
 * @returns True if the value is a valid BaseProcedureId
 * @public
 */
export function isValidBaseProcedureId(from: unknown): from is BaseProcedureId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to BaseProcedureId
 * @param from - Value to convert
 * @returns Result with BaseProcedureId or error
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
 * Type guard for BaseTaskId
 * @param from - Value to check
 * @returns True if the value is a valid BaseTaskId
 * @public
 */
export function isValidBaseTaskId(from: unknown): from is BaseTaskId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to BaseTaskId
 * @param from - Value to convert
 * @returns Result with BaseTaskId or error
 * @public
 */
export function toBaseTaskId(from: unknown): Result<BaseTaskId> {
  if (isValidBaseTaskId(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid BaseTaskId: must be non-empty alphanumeric with dashes/underscores, no dots');
}

/**
 * Type guard for BaseConfectionId
 * @param from - Value to check
 * @returns True if the value is a valid BaseConfectionId
 * @public
 */
export function isValidBaseConfectionId(from: unknown): from is BaseConfectionId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to BaseConfectionId
 * @param from - Value to convert
 * @returns Result with BaseConfectionId or error
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
 * Type guard for UrlCategory
 * @param from - Value to check
 * @returns True if the value is a valid UrlCategory
 * @public
 */
export function isValidUrlCategory(from: unknown): from is UrlCategory {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to UrlCategory
 * @param from - Value to convert
 * @returns Result with UrlCategory or error
 * @public
 */
export function toUrlCategory(from: unknown): Result<UrlCategory> {
  if (isValidUrlCategory(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid UrlCategory: must be non-empty alphanumeric with dashes/underscores, no dots');
}

// ============================================================================
// Composite ID Validators (exactly one dot)
// ============================================================================

/**
 * Type guard for IngredientId
 * @param from - Value to check
 * @returns True if the value is a valid composite IngredientId
 * @public
 */
export function isValidIngredientId(from: unknown): from is IngredientId {
  return typeof from === 'string' && COMPOSITE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to IngredientId
 * @param from - Value to convert
 * @returns Result with IngredientId or error
 * @public
 */
export function toIngredientId(from: unknown): Result<IngredientId> {
  if (isValidIngredientId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid IngredientId: must be in format "sourceId.baseId" with alphanumeric characters, dashes, and underscores'
  );
}

/**
 * Type guard for FillingId
 * @param from - Value to check
 * @returns True if the value is a valid composite FillingId
 * @public
 */
export function isValidFillingId(from: unknown): from is FillingId {
  return typeof from === 'string' && COMPOSITE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to FillingId
 * @param from - Value to convert
 * @returns Result with FillingId or error
 * @public
 */
export function toFillingId(from: unknown): Result<FillingId> {
  if (isValidFillingId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid FillingId: must be in format "sourceId.baseId" with alphanumeric characters, dashes, and underscores'
  );
}

/**
 * Type guard for MoldId
 * @param from - Value to check
 * @returns True if the value is a valid composite MoldId
 * @public
 */
export function isValidMoldId(from: unknown): from is MoldId {
  return typeof from === 'string' && COMPOSITE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to MoldId
 * @param from - Value to convert
 * @returns Result with MoldId or error
 * @public
 */
export function toMoldId(from: unknown): Result<MoldId> {
  if (isValidMoldId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid MoldId: must be in format "sourceId.baseId" with alphanumeric characters, dashes, and underscores'
  );
}

/**
 * Type guard for ProcedureId
 * @param from - Value to check
 * @returns True if the value is a valid composite ProcedureId
 * @public
 */
export function isValidProcedureId(from: unknown): from is ProcedureId {
  return typeof from === 'string' && COMPOSITE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to ProcedureId
 * @param from - Value to convert
 * @returns Result with ProcedureId or error
 * @public
 */
export function toProcedureId(from: unknown): Result<ProcedureId> {
  if (isValidProcedureId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid ProcedureId: must be in format "sourceId.baseId" with alphanumeric characters, dashes, and underscores'
  );
}

/**
 * Type guard for TaskId
 * @param from - Value to check
 * @returns True if the value is a valid composite TaskId
 * @public
 */
export function isValidTaskId(from: unknown): from is TaskId {
  return typeof from === 'string' && COMPOSITE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to TaskId
 * @param from - Value to convert
 * @returns Result with TaskId or error
 * @public
 */
export function toTaskId(from: unknown): Result<TaskId> {
  if (isValidTaskId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid TaskId: must be in format "sourceId.baseId" with alphanumeric characters, dashes, and underscores'
  );
}

/**
 * Type guard for ConfectionId
 * @param from - Value to check
 * @returns True if the value is a valid composite ConfectionId
 * @public
 */
export function isValidConfectionId(from: unknown): from is ConfectionId {
  return typeof from === 'string' && COMPOSITE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to ConfectionId
 * @param from - Value to convert
 * @returns Result with ConfectionId or error
 * @public
 */
export function toConfectionId(from: unknown): Result<ConfectionId> {
  if (isValidConfectionId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid ConfectionId: must be in format "sourceId.baseId" with alphanumeric characters, dashes, and underscores'
  );
}

// ============================================================================
// Other String Validators
// ============================================================================

/**
 * Type guard for FillingName
 * @param from - Value to check
 * @returns True if the value is a valid FillingName
 * @public
 */
export function isValidFillingName(from: unknown): from is FillingName {
  return typeof from === 'string' && from.length > 0;
}

/**
 * Converts unknown value to FillingName
 * @param from - Value to convert
 * @returns Result with FillingName or error
 * @public
 */
export function toFillingName(from: unknown): Result<FillingName> {
  if (isValidFillingName(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid FillingName: must be a non-empty string');
}

/**
 * Type guard for ConfectionName
 * @param from - Value to check
 * @returns True if the value is a valid ConfectionName
 * @public
 */
export function isValidConfectionName(from: unknown): from is ConfectionName {
  return typeof from === 'string' && from.length > 0;
}

/**
 * Converts unknown value to ConfectionName
 * @param from - Value to convert
 * @returns Result with ConfectionName or error
 * @public
 */
export function toConfectionName(from: unknown): Result<ConfectionName> {
  if (isValidConfectionName(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid ConfectionName: must be a non-empty string');
}

/**
 * Type guard for FillingVersionSpec
 * @param from - Value to check
 * @returns True if the value is a valid FillingVersionSpec
 * @public
 */
export function isValidFillingVersionSpec(from: unknown): from is FillingVersionSpec {
  return typeof from === 'string' && FILLING_VERSION_SPEC_PATTERN.test(from);
}

/**
 * Converts unknown value to FillingVersionSpec
 * @param from - Value to convert
 * @returns Result with {@link FillingVersionSpec | FillingVersionSpec} or error
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
 * Type guard for FillingVersionId
 * @param from - Value to check
 * @returns True if the value is a valid FillingVersionId
 * @public
 */
export function isValidFillingVersionId(from: unknown): from is FillingVersionId {
  if (typeof from !== 'string') {
    return false;
  }
  const parts = from.split(VERSION_ID_SEPARATOR);
  if (parts.length !== 2) {
    return false;
  }
  return isValidFillingId(parts[0]) && isValidFillingVersionSpec(parts[1]);
}

/**
 * Converts unknown value to FillingVersionId
 * @param from - Value to convert
 * @returns Result with {@link FillingVersionId | FillingVersionId} or error
 * @public
 */
export function toFillingVersionId(from: unknown): Result<FillingVersionId> {
  if (isValidFillingVersionId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid FillingVersionId: must be in format "fillingId@versionSpec" (e.g., "user.ganache@2026-01-03-01")'
  );
}

/**
 * Type guard for ConfectionVersionSpec
 * @param from - Value to check
 * @returns True if the value is a valid ConfectionVersionSpec
 * @public
 */
export function isValidConfectionVersionSpec(from: unknown): from is ConfectionVersionSpec {
  return typeof from === 'string' && CONFECTION_VERSION_SPEC_PATTERN.test(from);
}

/**
 * Converts unknown value to ConfectionVersionSpec
 * @param from - Value to convert
 * @returns Result with {@link ConfectionVersionSpec | ConfectionVersionSpec} or error
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
 * Type guard for ConfectionVersionId
 * @param from - Value to check
 * @returns True if the value is a valid ConfectionVersionId
 * @public
 */
export function isValidConfectionVersionId(from: unknown): from is ConfectionVersionId {
  if (typeof from !== 'string') {
    return false;
  }
  const parts = from.split(VERSION_ID_SEPARATOR);
  if (parts.length !== 2) {
    return false;
  }
  return isValidConfectionId(parts[0]) && isValidConfectionVersionSpec(parts[1]);
}

/**
 * Converts unknown value to ConfectionVersionId
 * @param from - Value to convert
 * @returns Result with {@link ConfectionVersionId | ConfectionVersionId} or error
 * @public
 */
export function toConfectionVersionId(from: unknown): Result<ConfectionVersionId> {
  if (isValidConfectionVersionId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid ConfectionVersionId: must be in format "confectionId@versionSpec" (e.g., "user.dark-dome-bonbon@2026-01-03-01")'
  );
}

/**
 * Type guard for {@link SessionId | SessionId}.
 * @param from - Value to check
 * @returns True if the value is a valid SessionId
 * @public
 */
export function isValidSessionId(from: unknown): from is SessionId {
  return typeof from === 'string' && SESSION_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to {@link SessionId | SessionId}.
 * @param from - Value to convert
 * @returns Result with SessionId or error
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
 * Type guard for Measurement
 * @param from - Value to check
 * @returns True if the value is a valid Measurement value
 * @public
 */
export function isValidMeasurement(from: unknown): from is Measurement {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0;
}

/**
 * Converts unknown value to Measurement
 * @param from - Value to convert
 * @returns Result with Measurement or error
 * @public
 */
export function toMeasurement(from: unknown): Result<Measurement> {
  if (isValidMeasurement(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Measurement: must be a non-negative finite number');
}

/**
 * Type guard for Percentage
 * @param from - Value to check
 * @returns True if the value is a valid Percentage (0-100)
 * @public
 */
export function isValidPercentage(from: unknown): from is Percentage {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0 && from <= 100;
}

/**
 * Converts unknown value to Percentage
 * @param from - Value to convert
 * @returns Result with Percentage or error
 * @public
 */
export function toPercentage(from: unknown): Result<Percentage> {
  if (isValidPercentage(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Percentage: must be a number between 0 and 100');
}

/**
 * Type guard for Celsius
 * @param from - Value to check
 * @returns True if the value is a valid Celsius temperature
 * @public
 */
export function isValidCelsius(from: unknown): from is Celsius {
  return typeof from === 'number' && Number.isFinite(from);
}

/**
 * Converts unknown value to Celsius
 * @param from - Value to convert
 * @returns Result with Celsius or error
 * @public
 */
export function toCelsius(from: unknown): Result<Celsius> {
  if (isValidCelsius(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Celsius: must be a finite number');
}

/**
 * Type guard for DegreesMacMichael
 * @param from - Value to check
 * @returns True if the value is a valid DegreesMacMichael
 * @public
 */
export function isValidDegreesMacMichael(from: unknown): from is DegreesMacMichael {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0;
}

/**
 * Converts unknown value to DegreesMacMichael
 * @param from - Value to convert
 * @returns Result with DegreesMacMichael or error
 * @public
 */
export function toDegreesMacMichael(from: unknown): Result<DegreesMacMichael> {
  if (isValidDegreesMacMichael(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid DegreesMacMichael: must be a non-negative finite number');
}

/**
 * Type guard for RatingScore
 * @param from - Value to check
 * @returns True if the value is a valid RatingScore (1-5)
 * @public
 */
export function isValidRatingScore(from: unknown): from is RatingScore {
  return typeof from === 'number' && Number.isInteger(from) && from >= 1 && from <= 5;
}

/**
 * Converts unknown value to RatingScore
 * @param from - Value to convert
 * @returns Result with RatingScore or error
 * @public
 */
export function toRatingScore(from: unknown): Result<RatingScore> {
  if (isValidRatingScore(from)) {
    return Success.with(from);
  }
  return Failure.with(`${from}: Invalid RatingScore: must be an integer between 1 and 5`);
}

/**
 * Type guard for Minutes
 * @param from - Value to check
 * @returns True if the value is a valid Minutes value
 * @public
 */
export function isValidMinutes(from: unknown): from is Minutes {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0;
}

/**
 * Converts unknown value to Minutes
 * @param from - Value to convert
 * @returns Result with Minutes or error
 * @public
 */
export function toMinutes(from: unknown): Result<Minutes> {
  if (isValidMinutes(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid Minutes: must be a non-negative finite number');
}

/**
 * Type guard for Millimeters
 * @param from - Value to check
 * @returns True if the value is a valid Millimeters value
 * @public
 */
export function isValidMillimeters(from: unknown): from is Millimeters {
  return typeof from === 'number' && Number.isFinite(from) && from >= 0;
}

/**
 * Converts unknown value to Millimeters
 * @param from - Value to convert
 * @returns Result with Millimeters or error
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
 * Type guard for JournalId
 * @param from - Value to check
 * @returns True if the value is a valid JournalId
 * @public
 */
export function isValidJournalId(from: unknown): from is JournalId {
  return typeof from === 'string' && JOURNAL_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to JournalId
 * @param from - Value to convert
 * @returns Result with JournalId or error
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
 * Type guard for SlotId
 * @param from - Value to check
 * @returns True if the value is a valid SlotId
 * @public
 */
export function isValidSlotId(from: unknown): from is SlotId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Converts unknown value to SlotId
 * @param from - Value to convert
 * @returns Result with SlotId or error
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
