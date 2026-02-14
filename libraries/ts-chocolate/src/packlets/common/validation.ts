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
  CONFECTION_RECIPE_VARIATION_SPEC_PATTERN,
  FILLING_RECIPE_VARIATION_SPEC_PATTERN,
  IHasId,
  IIdsWithPreferred,
  IOptionsWithPreferred,
  BASE_JOURNAL_ID_PATTERN,
  JOURNAL_ID_PATTERN,
  SESSION_ID_PATTERN,
  BASE_SESSION_ID_PATTERN,
  SESSION_SPEC_PATTERN
} from './model';
import {
  BaseConfectionId,
  BaseDecorationId,
  BaseFillingId,
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  BaseTaskId,
  Celsius,
  ConfectionName,
  ConfectionRecipeVariationSpec,
  DegreesMacMichael,
  FillingName,
  FillingRecipeVariationSpec,
  BaseJournalId,
  JournalId,
  Measurement,
  Millimeters,
  Minutes,
  Percentage,
  SessionId,
  RatingScore,
  BaseSessionId,
  SessionSpec,
  SlotId,
  CollectionId,
  UrlCategory,
  NoteCategory,
  GroupName
} from './ids';

// ============================================================================
// Base ID Validators (no dots allowed)
// ============================================================================

/**
 * Type guard for {@link CollectionId | CollectionId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link CollectionId | CollectionId}.
 * @public
 */
export function isValidCollectionId(from: unknown): from is CollectionId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link CollectionId | CollectionId}.
 * @param from - Value to validate
 * @returns `Success` with {@link CollectionId | CollectionId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toCollectionId(from: unknown): Result<CollectionId> {
  if (isValidCollectionId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid CollectionId: must be non-empty alphanumeric with dashes/underscores, no dots'
  );
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
 * Type guard for {@link BaseDecorationId | BaseDecorationId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link BaseDecorationId | BaseDecorationId}.
 * @public
 */
export function isValidBaseDecorationId(from: unknown): from is BaseDecorationId {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link BaseDecorationId | BaseDecorationId}.
 * @param from - Value to validate
 * @returns `Success` with {@link BaseDecorationId | BaseDecorationId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toBaseDecorationId(from: unknown): Result<BaseDecorationId> {
  if (isValidBaseDecorationId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid BaseDecorationId: must be non-empty alphanumeric with dashes/underscores, no dots'
  );
}

/**
 * Type guard for {@link NoteCategory | NoteCategory}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link NoteCategory | NoteCategory}.
 * @public
 */
export function isValidNoteCategory(from: unknown): from is NoteCategory {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link NoteCategory | NoteCategory}.
 * @param from - Value to validate
 * @returns `Success` with {@link NoteCategory | NoteCategory} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toNoteCategory(from: unknown): Result<NoteCategory> {
  if (isValidNoteCategory(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid NoteCategory: must be non-empty alphanumeric with dashes/underscores, no dots'
  );
}

/**
 * Type guard for {@link GroupName | GroupName}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link GroupName | GroupName}.
 * @public
 */
export function isValidGroupName(from: unknown): from is GroupName {
  return typeof from === 'string' && from.length > 0 && BASE_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link GroupName | GroupName}.
 * @param from - Value to validate
 * @returns `Success` with {@link GroupName | GroupName} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toGroupName(from: unknown): Result<GroupName> {
  if (isValidGroupName(from)) {
    return Success.with(from);
  }
  return Failure.with('Invalid GroupName: must be non-empty alphanumeric with dashes/underscores, no dots');
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
 * Type guard for {@link FillingRecipeVariationSpec | FillingRecipeVariationSpec}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link FillingRecipeVariationSpec | FillingRecipeVariationSpec}.
 * @public
 */
export function isValidFillingRecipeVariationSpec(from: unknown): from is FillingRecipeVariationSpec {
  return typeof from === 'string' && FILLING_RECIPE_VARIATION_SPEC_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link FillingRecipeVariationSpec | FillingRecipeVariationSpec}.
 * @param from - Value to validate
 * @returns `Success` with {@link FillingRecipeVariationSpec | FillingRecipeVariationSpec} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toFillingRecipeVariationSpec(from: unknown): Result<FillingRecipeVariationSpec> {
  if (isValidFillingRecipeVariationSpec(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid FillingRecipeVariationSpec: must be in format YYYY-MM-DD-NN with optional lowercase label (e.g., "2026-01-03-01" or "2026-01-03-02-tweaked")'
  );
}

/**
 * Type guard for {@link ConfectionRecipeVariationSpec | ConfectionRecipeVariationSpec}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link ConfectionRecipeVariationSpec | ConfectionRecipeVariationSpec}.
 * @public
 */
export function isValidConfectionRecipeVariationSpec(from: unknown): from is ConfectionRecipeVariationSpec {
  return typeof from === 'string' && CONFECTION_RECIPE_VARIATION_SPEC_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link ConfectionRecipeVariationSpec | ConfectionRecipeVariationSpec}.
 * @param from - Value to validate
 * @returns `Success` with {@link ConfectionRecipeVariationSpec | ConfectionRecipeVariationSpec} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toConvectionRecipeVariationSpec(from: unknown): Result<ConfectionRecipeVariationSpec> {
  if (isValidConfectionRecipeVariationSpec(from)) {
    return Success.with(from);
  }
  return Failure.with(
    'Invalid ConfectionRecipeVariationSpec: must be in format YYYY-MM-DD-NN with optional lowercase label (e.g., "2026-01-03-01" or "2026-01-03-02-tweaked")'
  );
}

/**
 * Type guard for {@link SessionSpec | SessionSpec}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link SessionSpec | SessionSpec}.
 * @public
 */
export function isValidSessionSpec(from: unknown): from is SessionSpec {
  return typeof from === 'string' && SESSION_SPEC_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link SessionSpec | SessionSpec}.
 * @param from - Value to validate
 * @returns `Success` with {@link SessionSpec | SessionSpec} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toSessionSpec(from: unknown): Result<SessionSpec> {
  if (isValidSessionSpec(from)) {
    return Success.with(from);
  }
  return Failure.with(
    `${from}: Invalid SessionSpec: must be in format YYYY-MM-DD-HHMMSS-xxxxxxxx (e.g., "2026-01-15-143025-a1b2c3d4")`
  );
}

/**
 * Type guard for {@link BaseSessionId | BaseSessionId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link BaseSessionId | BaseSessionId}.
 * @public
 */
export function isValidBaseSessionId(from: unknown): from is BaseSessionId {
  return typeof from === 'string' && BASE_SESSION_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link BaseSessionId | BaseSessionId}.
 * @param from - Value to validate
 * @returns `Success` with {@link BaseSessionId | BaseSessionId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toBaseSessionId(from: unknown): Result<BaseSessionId> {
  if (isValidBaseSessionId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    `Invalid BaseSessionId: must be in format YYYY-MM-DD-HHMMSS-xxxxxxxx (e.g., "2026-01-15-143025-a1b2c3d4")`
  );
}

/**
 * Type guard for {@link SessionId | SessionId} (composite).
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link SessionId | SessionId}
 * @public
 */
export function isValidSessionId(from: unknown): from is SessionId {
  return typeof from === 'string' && SESSION_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link SessionId | SessionId} (composite).
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
    `Invalid SessionId: must be in format collectionId.baseSessionId (e.g., "user-sessions.2026-01-15-143025-a1b2c3d4")`
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
 * Type guard for {@link BaseJournalId | BaseJournalId}.
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link BaseJournalId | JournalBaseId}
 * @public
 */
export function isValidBaseJournalId(from: unknown): from is BaseJournalId {
  return typeof from === 'string' && BASE_JOURNAL_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link BaseJournalId | JournalBaseId}.
 * @param from - Value to validate
 * @returns `Success` with {@link BaseJournalId | JournalBaseId} or `Failure` with an error
 * message if validation fails.
 * @public
 */
export function toBaseJournalId(from: unknown): Result<BaseJournalId> {
  if (isValidBaseJournalId(from)) {
    return Success.with(from);
  }
  return Failure.with(
    `Invalid BaseJournalId: must be in format YYYY-MM-DD-HHMMSS-xxxxxxxx (e.g., "2026-01-15-143025-a1b2c3d4")`
  );
}

/**
 * Type guard for {@link JournalId | JournalId} (composite).
 * @param from - Value to check
 * @returns `true` if the value is a valid {@link JournalId | JournalId}
 * @public
 */
export function isValidJournalId(from: unknown): from is JournalId {
  return typeof from === 'string' && JOURNAL_ID_PATTERN.test(from);
}

/**
 * Validates unknown value is a {@link JournalId | JournalId} (composite).
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
    `Invalid JournalId: must be in format collectionId.baseJournalId (e.g., "user-journals.2026-01-15-143025-a1b2c3d4")`
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

// ============================================================================
// Generic Validation Functions
// ============================================================================

/**
 * Validate kebab-case string.
 * @param input - String to validate
 * @returns Result with validated string or failure with error message
 * @public
 */
export function validateKebabCase(input: string): Result<string> {
  if (!input || input.length === 0) {
    return Failure.with('Kebab-case string cannot be empty');
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input)) {
    return Failure.with('String must be in kebab-case format (lowercase letters, numbers, and hyphens only)');
  }

  return Success.with(input);
}

/**
 * Validate that a string is not empty.
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @returns Result with validated string or failure with error message
 * @public
 */
export function validateNonEmptyString<T extends string = string>(value: T, fieldName: string): Result<T> {
  if (value.trim().length === 0) {
    return Failure.with(`${fieldName} cannot be empty`);
  }

  return Success.with(value);
}

/**
 * Validate string length constraints.
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @param options - Length constraints
 * @returns Result with validated string or failure with error message
 * @public
 */
export function validateStringLength<T extends string = string>(
  value: T,
  fieldName: string,
  options: { minLength?: number; maxLength?: number }
): Result<T> {
  if (options.minLength !== undefined && value.length < options.minLength) {
    return Failure.with(`${fieldName} must be at least ${options.minLength} characters`);
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    return Failure.with(`${fieldName} must be at most ${options.maxLength} characters`);
  }

  return Success.with(value);
}

/**
 * Validate that a value is a positive number.
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @returns Result with validated number or failure with error message
 * @public
 */
export function validatePositiveNumber(value: unknown, fieldName: string): Result<number> {
  if (typeof value !== 'number' || isNaN(value)) {
    return Failure.with(`${fieldName} must be a number`);
  }

  if (value < 0) {
    return Failure.with(`${fieldName} must be positive`);
  }

  return Success.with(value);
}

/**
 * Validate that a value is a number within a range.
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Result with validated number or failure with error message
 * @public
 */
export function validateNumberRange(
  value: unknown,
  fieldName: string,
  min: number,
  max: number
): Result<number> {
  if (typeof value !== 'number' || isNaN(value)) {
    return Failure.with(`${fieldName} must be a number`);
  }

  if (value < min || value > max) {
    return Failure.with(`${fieldName} must be between ${min} and ${max}`);
  }

  return Success.with(value);
}

/**
 * Check if a base ID exists in a collection.
 * @param baseId - Base ID to check
 * @param existingIds - Collection of existing IDs
 * @returns True if ID exists
 * @public
 */
export function baseIdExists(
  baseId: string,
  existingIds: ReadonlySet<string> | ReadonlyArray<string>
): boolean {
  if (existingIds instanceof Set) {
    return existingIds.has(baseId);
  }
  return (existingIds as ReadonlyArray<string>).includes(baseId);
}

/**
 * Validate that a base ID is unique in a collection.
 * @param baseId - Base ID to validate
 * @param existingIds - Collection of existing IDs
 * @param fieldName - Name of field for error message
 * @returns Result with validated ID or failure with error message
 * @public
 */
export function validateUniqueBaseId<T extends string = string>(
  baseId: T,
  existingIds: ReadonlySet<T> | ReadonlyArray<T>,
  fieldName: string = 'baseId'
): Result<T> {
  if (baseIdExists(baseId, existingIds)) {
    return Failure.with(`${fieldName} "${baseId}" already exists in this collection`);
  }
  return Success.with(baseId);
}
