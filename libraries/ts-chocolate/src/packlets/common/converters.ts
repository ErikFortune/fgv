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
 * Converters for branded types
 * @packageDocumentation
 */

import { Converter, Converters, Result } from '@fgv/ts-utils';

import {
  AdditionalChocolatePurpose,
  Allergen,
  allAdditionalChocolatePurposes,
  allAllergens,
  allCacaoVarieties,
  allCertifications,
  allChocolateApplications,
  allChocolateTypes,
  allConfectionTypes,
  allFillingCategories,
  allFluidityStars,
  allIngredientCategories,
  allIngredientPhases,
  allMeasurementUnits,
  allMoldFormats,
  allSpoonLevels,
  allWeightUnits,
  BaseConfectionId,
  BaseFillingId,
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  BaseTaskId,
  JournalBaseId,
  CacaoVariety,
  Celsius,
  Certification,
  ChocolateApplication,
  ChocolateType,
  ConfectionId,
  ConfectionName,
  ConfectionType,
  ConfectionVersionId,
  ConfectionVersionSpec,
  DegreesMacMichael,
  FillingCategory,
  FillingId,
  FillingName,
  FillingVersionId,
  FillingVersionSpec,
  FluidityStars,
  IngredientCategory,
  IngredientId,
  IngredientPhase,
  JournalId,
  Measurement,
  MeasurementUnit,
  Millimeters,
  Minutes,
  MoldFormat,
  MoldId,
  Percentage,
  PersistedSessionId,
  ProcedureId,
  RatingScore,
  SessionBaseId,
  SessionId,
  SlotId,
  SourceId,
  SpoonLevel,
  TaskId,
  UrlCategory,
  WeightUnit,
  allProcedureTypes,
  ProcedureType,
  NoteCategory
} from './ids';

import {
  ICategorizedUrl,
  ID_SEPARATOR,
  IHasId,
  IIdsWithPreferred,
  IMeasurementUnitOption,
  IOptionsWithPreferred,
  IRefWithNotes,
  VERSION_ID_SEPARATOR,
  ICategorizedNote
} from './model';
import {
  toBaseConfectionId,
  toBaseFillingId,
  toBaseIngredientId,
  toBaseMoldId,
  toBaseProcedureId,
  toBaseTaskId,
  toJournalBaseId,
  toCelsius,
  toConfectionName,
  toConfectionVersionSpec,
  toDegreesMacMichael,
  toFillingName,
  toFillingVersionSpec,
  toMeasurement,
  toMillimeters,
  toMinutes,
  toNoteCategory,
  toPercentage,
  toRatingScore,
  toSessionBaseId,
  toSessionId,
  toSlotId,
  toSourceId,
  toUrlCategory,
  validateIdsWithPreferred,
  validateOptionsWithPreferred
} from './validation';

import * as CommonValidators from './validators';

// ============================================================================
// ID Converters
// ============================================================================
//
// These converters handle CONVERSION between representations:
// - String input -> branded string output
// - Object input (e.g., { collectionId, itemId }) -> branded string output
//
// Converters may return a different value than the input. For in-place
// validation (where the output must be the same identity as input), use
// the validators in validation.ts instead.
// ============================================================================

/**
 * Converter for {@link SourceId | SourceId}.
 * @public
 */
export const sourceId: Converter<SourceId> = Converters.generic(toSourceId);

/**
 * Converter for {@link BaseIngredientId | BaseIngredientId}.
 * @public
 */
export const baseIngredientId: Converter<BaseIngredientId> = Converters.generic(toBaseIngredientId);

/**
 * Converter for {@link BaseFillingId | BaseFillingId}.
 * @public
 */

export const baseFillingId: Converter<BaseFillingId> = Converters.generic(toBaseFillingId);

/**
 * Converter for {@link BaseMoldId | BaseMoldId}.
 * @public
 */
export const baseMoldId: Converter<BaseMoldId> = Converters.generic(toBaseMoldId);

/**
 * Converter for {@link BaseProcedureId | BaseProcedureId}.
 * @public
 */
export const baseProcedureId: Converter<BaseProcedureId> = Converters.generic(toBaseProcedureId);

/**
 * Converter for {@link BaseTaskId | BaseTaskId}.
 * @public
 */
export const baseTaskId: Converter<BaseTaskId> = Converters.generic(toBaseTaskId);

/**
 * Converter for {@link BaseConfectionId | BaseConfectionId}.
 * @public
 */
export const baseConfectionId: Converter<BaseConfectionId> = Converters.generic(toBaseConfectionId);

/**
 * Converter for {@link JournalBaseId | JournalBaseId}.
 * @public
 */
export const journalBaseId: Converter<JournalBaseId> = Converters.generic(toJournalBaseId);

/**
 * Converter for {@link IngredientId | IngredientId} (composite string).
 * Accepts either an {@link IngredientId | IngredientId} string or a `CompositeId` object representation.
 * @public
 */
export const ingredientId: Converter<IngredientId> = Converters.compositeIdString(
  CommonValidators.ingredientId,
  sourceId,
  ID_SEPARATOR,
  baseIngredientId
);

/**
 * Converter for {@link FillingId | FillingId} (composite string).
 * Accepts either an {@link FillingId | FillingId} string or a `CompositeId` object representation.
 * @public
 */
export const fillingId: Converter<FillingId> = Converters.compositeIdString(
  CommonValidators.fillingId,
  sourceId,
  ID_SEPARATOR,
  baseFillingId
);

/**
 * Converter for {@link MoldId | MoldId} (composite string).
 * Accepts either an {@link MoldId | MoldId} string or a `CompositeId` object representation.
 * @public
 */
export const moldId: Converter<MoldId> = Converters.compositeIdString(
  CommonValidators.moldId,
  sourceId,
  ID_SEPARATOR,
  baseMoldId
);

/**
 * Converter for {@link ProcedureId | ProcedureId} (composite string).
 * Accepts either an {@link ProcedureId | ProcedureId} string or a `CompositeId` object representation.
 * @public
 */
export const procedureId: Converter<ProcedureId> = Converters.compositeIdString(
  CommonValidators.procedureId,
  sourceId,
  ID_SEPARATOR,
  baseProcedureId
);

/**
 * Converter for {@link TaskId | TaskId} (composite string).
 * Accepts either an {@link TaskId | TaskId} string or a `CompositeId` object representation.
 * @public
 */
export const taskId: Converter<TaskId> = Converters.compositeIdString(
  CommonValidators.taskId,
  sourceId,
  ID_SEPARATOR,
  baseTaskId
);

/**
 * Converter for {@link ConfectionId | ConfectionId} (composite string).
 * Accepts either an {@link ConfectionId | ConfectionId} string or a `CompositeId` object representation.
 * @public
 */
export const confectionId: Converter<ConfectionId> = Converters.compositeIdString(
  CommonValidators.confectionId,
  sourceId,
  ID_SEPARATOR,
  baseConfectionId
);

/**
 * Converter for {@link JournalId | JournalId} (composite string).
 * Accepts either an {@link JournalId | JournalId} string or a `CompositeId` object representation.
 * @public
 */
export const journalId: Converter<JournalId> = Converters.compositeIdString(
  CommonValidators.journalId,
  sourceId,
  ID_SEPARATOR,
  journalBaseId
);

// ============================================================================
// Composite ID Converters (parsing to structured form)
// ============================================================================

/**
 * Type alias for parsed {@link IngredientId | IngredientId}' components
 * @public
 */
export type ParsedIngredientId = Converters.ICompositeId<SourceId, BaseIngredientId>;

/**
 * Converter that parses an {@link IngredientId | IngredientId} string into its component parts
 * or validates a `CompositeId` object representation.
 * @public
 */
export const parsedIngredientId: Converter<ParsedIngredientId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  baseIngredientId
);

/**
 * Type alias for parsed {@link FillingId | FillingId} components.
 * @public
 */
export type ParsedFillingId = Converters.ICompositeId<SourceId, BaseFillingId>;

/**
 * Converter that parses a {@link FillingId | FillingId} string into its component parts
 * or validates a `CompositeId` object representation.
 * @public
 */
export const parsedFillingId: Converter<ParsedFillingId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  baseFillingId
);

/**
 * Type alias for parsed {@link MoldId | MoldId} components.
 * @public
 */
export type ParsedMoldId = Converters.ICompositeId<SourceId, BaseMoldId>;

/**
 * Converter that parses a {@link MoldId | MoldId} string into its component parts
 * or validates a `CompositeId` object representation.
 * @public
 */
export const parsedMoldId: Converter<ParsedMoldId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  baseMoldId
);

/**
 * Type alias for parsed {@link ProcedureId | ProcedureId} components.
 * @public
 */
export type ParsedProcedureId = Converters.ICompositeId<SourceId, BaseProcedureId>;

/**
 * Converter that parses a {@link ProcedureId | ProcedureId} string into its component parts
 * or validates a `CompositeId` object representation.
 * @public
 */
export const parsedProcedureId: Converter<ParsedProcedureId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  baseProcedureId
);

/**
 * Type alias for parsed {@link TaskId | TaskId} components.
 * @public
 */
export type ParsedTaskId = Converters.ICompositeId<SourceId, BaseTaskId>;

/**
 * Converter that parses a {@link TaskId | TaskId} string into its component parts
 * or validates a `CompositeId` object representation.
 * @public
 */
export const parsedTaskId: Converter<ParsedTaskId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  baseTaskId
);

/**
 * Type alias for parsed {@link JournalId | JournalId} components.
 * @public
 */
export type ParsedJournalId = Converters.ICompositeId<SourceId, JournalBaseId>;

/**
 * Converter that parses a {@link JournalId | JournalId} string into its component parts
 * or validates a `CompositeId` object representation.
 * @public
 */
export const parsedJournalId: Converter<ParsedJournalId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  journalBaseId
);

/**
 * Converter for {@link FillingName | FillingName}.
 * @public
 */
export const fillingName: Converter<FillingName> = Converters.generic(toFillingName);

/**
 * Converter for {@link FillingVersionSpec | FillingVersionSpec}.
 * @public
 */
export const fillingVersionSpec: Converter<FillingVersionSpec> = Converters.generic(toFillingVersionSpec);

/**
 * Converter for {@link FillingVersionId | FillingVersionId} (composite string).
 * Accepts either a {@link FillingVersionId | FillingVersionId} string or a `CompositeId` object representation.
 * @public
 */
export const fillingVersionId: Converter<FillingVersionId> = Converters.compositeIdString(
  CommonValidators.fillingVersionId,
  fillingId,
  VERSION_ID_SEPARATOR,
  fillingVersionSpec
);

/**
 * Type alias for parsed {@link FillingVersionId | FillingVersionId} components.
 * @public
 */
export type ParsedFillingVersionId = Converters.ICompositeId<FillingId, FillingVersionSpec>;

/**
 * Converter that parses a {@link FillingVersionId | FillingVersionId} string into its component parts
 * or validates a `CompositeId` object representation.
 * @public
 */
export const parsedFillingVersionId: Converter<ParsedFillingVersionId> = Converters.compositeId(
  fillingId,
  VERSION_ID_SEPARATOR,
  fillingVersionSpec
);

/**
 * Converter for {@link SessionId | SessionId}.
 * @public
 */
export const sessionId: Converter<SessionId> = Converters.generic(toSessionId);

/**
 * Converter for {@link SessionBaseId | SessionBaseId}.
 * @public
 */
export const sessionBaseId: Converter<SessionBaseId> = Converters.generic(toSessionBaseId);

/**
 * Converter for {@link PersistedSessionId | PersistedSessionId} (composite string).
 * Accepts either a {@link PersistedSessionId | PersistedSessionId} string or a `CompositeId` object representation.
 * @public
 */
export const persistedSessionId: Converter<PersistedSessionId> = Converters.compositeIdString(
  CommonValidators.persistedSessionId,
  sourceId,
  ID_SEPARATOR,
  sessionBaseId
);

/**
 * Type alias for parsed {@link PersistedSessionId | PersistedSessionId} components.
 * @public
 */
export type ParsedPersistedSessionId = Converters.ICompositeId<SourceId, SessionBaseId>;

/**
 * Converter that parses a {@link PersistedSessionId | PersistedSessionId} string into its component parts
 * or validates a `CompositeId` object representation.
 * @public
 */
export const parsedPersistedSessionId: Converter<ParsedPersistedSessionId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  sessionBaseId
);

/**
 * Converter for {@link SlotId | SlotId}.
 * @public
 */
export const slotId: Converter<SlotId> = Converters.generic(toSlotId);

/**
 * Type alias for parsed {@link ConfectionId | ConfectionId} components.
 * @public
 */
export type ParsedConfectionId = Converters.ICompositeId<SourceId, BaseConfectionId>;

/**
 * Converter that parses a {@link ConfectionId | ConfectionId} string into its component parts
 * or validates a `CompositeId` object representation.
 * @public
 */
export const parsedConfectionId: Converter<ParsedConfectionId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  baseConfectionId
);

/**
 * Converter for {@link ConfectionName | ConfectionName}.
 * @public
 */
export const confectionName: Converter<ConfectionName> = Converters.generic(toConfectionName);

/**
 * Converter for {@link ConfectionVersionSpec | ConfectionVersionSpec}.
 * @public
 */
export const confectionVersionSpec: Converter<ConfectionVersionSpec> =
  Converters.generic(toConfectionVersionSpec);

/**
 * Converter for {@link ConfectionVersionId | ConfectionVersionId} (composite string).
 * Accepts either a {@link ConfectionVersionId | ConfectionVersionId} string or a `CompositeId` object representation.
 * @public
 */
export const confectionVersionId: Converter<ConfectionVersionId> = Converters.compositeIdString(
  CommonValidators.confectionVersionId,
  confectionId,
  VERSION_ID_SEPARATOR,
  confectionVersionSpec
);

/**
 * Type alias for parsed {@link ConfectionVersionId | ConfectionVersionId} components.
 * @public
 */
export type ParsedConfectionVersionId = Converters.ICompositeId<ConfectionId, ConfectionVersionSpec>;

/**
 * Converter that parses a {@link ConfectionVersionId | ConfectionVersionId} string into its component parts
 * or validates a `CompositeId` object representation.
 * @public
 */
export const parsedConfectionVersionId: Converter<ParsedConfectionVersionId> = Converters.compositeId(
  confectionId,
  VERSION_ID_SEPARATOR,
  confectionVersionSpec
);

// ============================================================================
// Numeric Converters
// ============================================================================

/**
 * Converter for {@link Measurement | Measurement} (non-negative number for ingredient amounts)
 * @public
 */
export const measurement: Converter<Measurement> = Converters.generic(toMeasurement);

/**
 * Converter for {@link Percentage | Percentage}.
 * @public
 */
export const percentage: Converter<Percentage> = Converters.generic(toPercentage);

/**
 * Converter for {@link Celsius | Celsius}.
 * @public
 */
export const celsius: Converter<Celsius> = Converters.generic(toCelsius);

/**
 * Converter for {@link DegreesMacMichael | DegreesMacMichael}.
 * @public
 */
export const degreesMacMichael: Converter<DegreesMacMichael> = Converters.generic(toDegreesMacMichael);

/**
 * Converter for {@link RatingScore | RatingScore} (1-5)
 * @public
 */
export const ratingScore: Converter<RatingScore> = Converters.generic(toRatingScore);

/**
 * Converter for {@link Minutes | Minutes}.
 * @public
 */
export const minutes: Converter<Minutes> = Converters.generic(toMinutes);

/**
 * Converter for {@link Millimeters | Millimeters}.
 * @public
 */
export const millimeters: Converter<Millimeters> = Converters.generic(toMillimeters);

// ============================================================================
// Enum Converters
// ============================================================================

/**
 * Converter for {@link IngredientCategory | IngredientCategory}.
 * @public
 */
export const ingredientCategory: Converter<IngredientCategory> =
  Converters.enumeratedValue(allIngredientCategories);

/**
 * Converter for {@link ChocolateType | ChocolateType}.
 * @public
 */
export const chocolateType: Converter<ChocolateType> = Converters.enumeratedValue(allChocolateTypes);

/**
 * Converter for {@link CacaoVariety | CacaoVariety}.
 * @public
 */
export const cacaoVariety: Converter<CacaoVariety> = Converters.enumeratedValue(allCacaoVarieties);

/**
 * Converter for {@link FluidityStars | FluidityStars}.
 * @public
 */
export const fluidityStars: Converter<FluidityStars> = Converters.enumeratedValue(allFluidityStars);

/**
 * Converter for {@link WeightUnit | WeightUnit}.
 * @public
 */
export const weightUnit: Converter<WeightUnit> = Converters.enumeratedValue(allWeightUnits);

/**
 * Converter for {@link Allergen | Allergen}.
 * @public
 */
export const allergen: Converter<Allergen> = Converters.enumeratedValue(allAllergens);

/**
 * Converter for {@link Certification | Certification}.
 * @public
 */
export const certification: Converter<Certification> = Converters.enumeratedValue(allCertifications);

/**
 * Converter for {@link ChocolateApplication | ChocolateApplication}.
 * @public
 */
export const chocolateApplication: Converter<ChocolateApplication> =
  Converters.enumeratedValue(allChocolateApplications);

/**
 * Converter for {@link MoldFormat | MoldFormat}.
 * @public
 */
export const moldFormat: Converter<MoldFormat> = Converters.enumeratedValue(allMoldFormats);

/**
 * Converter for {@link ConfectionType | ConfectionType}.
 * @public
 */
export const confectionType: Converter<ConfectionType> = Converters.enumeratedValue(allConfectionTypes);

/**
 * Converter for {@link AdditionalChocolatePurpose | AdditionalChocolatePurpose}.
 * @public
 */
export const additionalChocolatePurpose: Converter<AdditionalChocolatePurpose> = Converters.enumeratedValue(
  allAdditionalChocolatePurposes
);

/**
 * Converter for {@link FillingCategory | FillingCategory}.
 * @public
 */
export const fillingCategory: Converter<FillingCategory> = Converters.enumeratedValue(allFillingCategories);

/**
 * Converter for {@link ProcedureType | ProcedureType}.
 * @public
 */
export const procedureType: Converter<ProcedureType> = Converters.enumeratedValue(allProcedureTypes);

/**
 * Converter for {@link MeasurementUnit | MeasurementUnit}.
 * @public
 */
export const measurementUnit: Converter<MeasurementUnit> = Converters.enumeratedValue(allMeasurementUnits);

/**
 * Converter for {@link SpoonLevel | SpoonLevel}.
 * @public
 */
export const spoonLevel: Converter<SpoonLevel> = Converters.enumeratedValue(allSpoonLevels);

/**
 * Converter for IngredientPhase
 * @public
 */
export const ingredientPhase: Converter<IngredientPhase> = Converters.enumeratedValue(allIngredientPhases);

/**
 * Converter for {@link Model.IMeasurementUnitOption | IMeasurementUnitOption}.
 * @public
 */
export const measurementUnitOption: Converter<IMeasurementUnitOption> =
  Converters.object<IMeasurementUnitOption>({
    id: measurementUnit
  });

// ============================================================================
// Options with Preferred Converters
// ============================================================================

/**
 * Creates a converter for {@link Model.IOptionsWithPreferred | IOptionsWithPreferred\<TOption, TId\>} collections.
 * Validates that preferredId (if specified) exists in the options array.
 *
 * @typeParam TOption - The option object type (must have an `id` property)
 * @typeParam TId - The ID type for the preferred selection
 * @param optionConverter - Converter for individual option objects
 * @param idConverter - Converter for the ID type (used for preferredId)
 * @param context - Optional context string for error messages
 * @returns A converter that produces validated IOptionsWithPreferred collections
 * @public
 */
export function optionsWithPreferred<TOption extends IHasId<TId>, TId extends string>(
  optionConverter: Converter<TOption>,
  idConverter: Converter<TId>,
  context?: string
): Converter<IOptionsWithPreferred<TOption, TId>> {
  return Converters.generic<IOptionsWithPreferred<TOption, TId>>(
    (from: unknown): Result<IOptionsWithPreferred<TOption, TId>> => {
      const baseConverter = Converters.object<IOptionsWithPreferred<TOption, TId>>({
        options: Converters.arrayOf(optionConverter),
        preferredId: idConverter.optional()
      });

      return baseConverter.convert(from).onSuccess((collection) => {
        return validateOptionsWithPreferred(collection, context);
      });
    }
  );
}

/**
 * Creates a converter for {@link Model.IIdsWithPreferred | IIdsWithPreferred\<TId\>} collections.
 * Validates that preferredId (if specified) exists in the ids array.
 *
 * @typeParam TId - The ID type
 * @param idConverter - Converter for individual IDs
 * @param context - Optional context string for error messages
 * @returns A converter that produces validated IIdsWithPreferred collections
 * @public
 */
export function idsWithPreferred<TId extends string>(
  idConverter: Converter<TId>,
  context?: string
): Converter<IIdsWithPreferred<TId>> {
  return Converters.generic<IIdsWithPreferred<TId>>((from: unknown): Result<IIdsWithPreferred<TId>> => {
    const baseConverter = Converters.object<IIdsWithPreferred<TId>>({
      slotId: slotId.optional(),
      ids: Converters.arrayOf(idConverter),
      preferredId: idConverter.optional()
    });

    return baseConverter.convert(from).onSuccess((collection) => {
      return validateIdsWithPreferred(collection, context);
    });
  });
}

// ============================================================================
// Note Converters
// ============================================================================

/**
 * Converter for {@link NoteCategory | NoteCategory}.
 * @public
 */
export const noteCategory: Converter<NoteCategory> = Converters.generic(toNoteCategory);

/**
 * Converter for {@link Model.ICategorizedNote | ICategorizedNote}.
 * @public
 */
export const categorizedNote: Converter<ICategorizedNote> = Converters.object<ICategorizedNote>({
  category: noteCategory,
  note: Converters.string
});

/**
 * Creates a converter for {@link Model.IRefWithNotes | IRefWithNotes\<TId\>} objects.
 * A simple reference with an ID and optional notes.
 *
 * @typeParam TId - The ID type
 * @param idConverter - Converter for the ID type
 * @returns A converter that produces IRefWithNotes objects
 * @public
 */
export function refWithNotes<TId extends string>(idConverter: Converter<TId>): Converter<IRefWithNotes<TId>> {
  return Converters.object<IRefWithNotes<TId>>({
    id: idConverter,
    notes: Converters.arrayOf(categorizedNote).optional()
  });
}

// ============================================================================
// URL Converters
// ============================================================================

/**
 * Converter for {@link UrlCategory | UrlCategory}.
 * @public
 */
export const urlCategory: Converter<UrlCategory> = Converters.generic(toUrlCategory);

/**
 * Converter for {@link Model.ICategorizedUrl | ICategorizedUrl}.
 * @public
 */
export const categorizedUrl: Converter<ICategorizedUrl> = Converters.object<ICategorizedUrl>({
  category: urlCategory,
  url: Converters.string
});
