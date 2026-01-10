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
  allFluidityStars,
  allIngredientCategories,
  allIngredientPhases,
  allMeasurementUnits,
  allMoldFormats,
  allRecipeCategories,
  allSpoonLevels,
  allWeightUnits,
  BaseConfectionId,
  BaseIngredientId,
  BaseMoldId,
  BaseProcedureId,
  BaseRecipeId,
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
  FluidityStars,
  ID_SEPARATOR,
  IHasId,
  IIdsWithPreferred,
  IMeasurementUnitOption,
  IngredientCategory,
  IngredientId,
  IngredientPhase,
  IOptionsWithPreferred,
  IRefWithNotes,
  JournalId,
  Measurement,
  MeasurementUnit,
  Millimeters,
  Minutes,
  MoldFormat,
  MoldId,
  Percentage,
  ProcedureId,
  RatingScore,
  RecipeCategory,
  RecipeId,
  RecipeName,
  RecipeVersionId,
  RecipeVersionSpec,
  SessionId,
  SlotId,
  SourceId,
  SpoonLevel,
  VERSION_ID_SEPARATOR,
  WeightUnit
} from './model';
import { validateIdsWithPreferred, validateOptionsWithPreferred } from './validation';
import {
  toBaseConfectionId,
  toBaseIngredientId,
  toBaseMoldId,
  toBaseProcedureId,
  toBaseRecipeId,
  toCelsius,
  toConfectionId,
  toConfectionName,
  toConfectionVersionId,
  toConfectionVersionSpec,
  toDegreesMacMichael,
  toIngredientId,
  toJournalId,
  toMeasurement,
  toMillimeters,
  toMinutes,
  toMoldId,
  toPercentage,
  toProcedureId,
  toRatingScore,
  toRecipeId,
  toRecipeName,
  toRecipeVersionId,
  toRecipeVersionSpec,
  toSessionId,
  toSlotId,
  toSourceId
} from './validation';

// ============================================================================
// ID Converters
// ============================================================================

/**
 * Converter for SourceId
 * @public
 */
export const sourceId: Converter<SourceId> = Converters.generic(toSourceId);

/**
 * Converter for BaseIngredientId
 * @public
 */
export const baseIngredientId: Converter<BaseIngredientId> = Converters.generic(toBaseIngredientId);

/**
 * Converter for BaseRecipeId
 * @public
 */

export const baseRecipeId: Converter<BaseRecipeId> = Converters.generic(toBaseRecipeId);

/**
 * Converter for BaseMoldId
 * @public
 */
export const baseMoldId: Converter<BaseMoldId> = Converters.generic(toBaseMoldId);

/**
 * Converter for BaseProcedureId
 * @public
 */
export const baseProcedureId: Converter<BaseProcedureId> = Converters.generic(toBaseProcedureId);

/**
 * Converter for BaseConfectionId
 * @public
 */
export const baseConfectionId: Converter<BaseConfectionId> = Converters.generic(toBaseConfectionId);

/**
 * Converter for IngredientId (composite)
 * @public
 */
export const ingredientId: Converter<IngredientId> = Converters.generic(toIngredientId);

/**
 * Converter for RecipeId (composite)
 * @public
 */
export const recipeId: Converter<RecipeId> = Converters.generic(toRecipeId);

/**
 * Converter for MoldId (composite)
 * @public
 */
export const moldId: Converter<MoldId> = Converters.generic(toMoldId);

/**
 * Converter for ProcedureId (composite)
 * @public
 */
export const procedureId: Converter<ProcedureId> = Converters.generic(toProcedureId);

/**
 * Converter for ConfectionId (composite)
 * @public
 */
export const confectionId: Converter<ConfectionId> = Converters.generic(toConfectionId);

/**
 * Converter for JournalId
 * @public
 */
export const journalId: Converter<JournalId> = Converters.generic(toJournalId);

// ============================================================================
// Composite ID Converters (parsing to structured form)
// ============================================================================

/**
 * Type alias for parsed IngredientId components
 * @public
 */
export type ParsedIngredientId = Converters.ICompositeId<SourceId, BaseIngredientId>;

/**
 * Converter that parses an IngredientId string into its component parts
 * @public
 */
export const parsedIngredientId: Converter<ParsedIngredientId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  baseIngredientId
);

/**
 * Type alias for parsed RecipeId components
 * @public
 */
export type ParsedRecipeId = Converters.ICompositeId<SourceId, BaseRecipeId>;

/**
 * Converter that parses a RecipeId string into its component parts
 * @public
 */
export const parsedRecipeId: Converter<ParsedRecipeId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  baseRecipeId
);

/**
 * Type alias for parsed MoldId components
 * @public
 */
export type ParsedMoldId = Converters.ICompositeId<SourceId, BaseMoldId>;

/**
 * Converter that parses a MoldId string into its component parts
 * @public
 */
export const parsedMoldId: Converter<ParsedMoldId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  baseMoldId
);

/**
 * Type alias for parsed ProcedureId components
 * @public
 */
export type ParsedProcedureId = Converters.ICompositeId<SourceId, BaseProcedureId>;

/**
 * Converter that parses a ProcedureId string into its component parts
 * @public
 */
export const parsedProcedureId: Converter<ParsedProcedureId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  baseProcedureId
);

/**
 * Converter for RecipeName
 * @public
 */
export const recipeName: Converter<RecipeName> = Converters.generic(toRecipeName);

/**
 * Converter for RecipeVersionSpec
 * @public
 */
export const recipeVersionSpec: Converter<RecipeVersionSpec> = Converters.generic(toRecipeVersionSpec);

/**
 * Converter for RecipeVersionId (composite)
 * @public
 */
export const recipeVersionId: Converter<RecipeVersionId> = Converters.generic(toRecipeVersionId);

/**
 * Type alias for parsed RecipeVersionId components
 * @public
 */
export type ParsedRecipeVersionId = Converters.ICompositeId<RecipeId, RecipeVersionSpec>;

/**
 * Converter that parses a RecipeVersionId string into its component parts
 * @public
 */
export const parsedRecipeVersionId: Converter<ParsedRecipeVersionId> = Converters.compositeId(
  recipeId,
  VERSION_ID_SEPARATOR,
  recipeVersionSpec
);

/**
 * Converter for {@link SessionId | SessionId}.
 * @public
 */
export const sessionId: Converter<SessionId> = Converters.generic(toSessionId);

/**
 * Converter for {@link SlotId | SlotId}.
 * @public
 */
export const slotId: Converter<SlotId> = Converters.generic(toSlotId);

/**
 * Type alias for parsed ConfectionId components
 * @public
 */
export type ParsedConfectionId = Converters.ICompositeId<SourceId, BaseConfectionId>;

/**
 * Converter that parses a ConfectionId string into its component parts
 * @public
 */
export const parsedConfectionId: Converter<ParsedConfectionId> = Converters.compositeId(
  sourceId,
  ID_SEPARATOR,
  baseConfectionId
);

/**
 * Converter for ConfectionName
 * @public
 */
export const confectionName: Converter<ConfectionName> = Converters.generic(toConfectionName);

/**
 * Converter for ConfectionVersionSpec
 * @public
 */
export const confectionVersionSpec: Converter<ConfectionVersionSpec> =
  Converters.generic(toConfectionVersionSpec);

/**
 * Converter for ConfectionVersionId (composite)
 * @public
 */
export const confectionVersionId: Converter<ConfectionVersionId> = Converters.generic(toConfectionVersionId);

/**
 * Type alias for parsed ConfectionVersionId components
 * @public
 */
export type ParsedConfectionVersionId = Converters.ICompositeId<ConfectionId, ConfectionVersionSpec>;

/**
 * Converter that parses a ConfectionVersionId string into its component parts
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
 * Converter for Measurement (non-negative number for ingredient amounts)
 * @public
 */
export const measurement: Converter<Measurement> = Converters.generic(toMeasurement);

/**
 * Converter for Percentage
 * @public
 */
export const percentage: Converter<Percentage> = Converters.generic(toPercentage);

/**
 * Converter for Celsius
 * @public
 */
export const celsius: Converter<Celsius> = Converters.generic(toCelsius);

/**
 * Converter for DegreesMacMichael
 * @public
 */
export const degreesMacMichael: Converter<DegreesMacMichael> = Converters.generic(toDegreesMacMichael);

/**
 * Converter for RatingScore (1-5)
 * @public
 */
export const ratingScore: Converter<RatingScore> = Converters.generic(toRatingScore);

/**
 * Converter for Minutes
 * @public
 */
export const minutes: Converter<Minutes> = Converters.generic(toMinutes);

/**
 * Converter for Millimeters
 * @public
 */
export const millimeters: Converter<Millimeters> = Converters.generic(toMillimeters);

// ============================================================================
// Enum Converters
// ============================================================================

/**
 * Converter for IngredientCategory
 * @public
 */
export const ingredientCategory: Converter<IngredientCategory> =
  Converters.enumeratedValue(allIngredientCategories);

/**
 * Converter for ChocolateType
 * @public
 */
export const chocolateType: Converter<ChocolateType> = Converters.enumeratedValue(allChocolateTypes);

/**
 * Converter for ChocolateVariety
 * @public
 */
export const chocolateVariety: Converter<CacaoVariety> = Converters.enumeratedValue(allCacaoVarieties);

/**
 * Converter for FluidityStars
 * @public
 */
export const fluidityStars: Converter<FluidityStars> = Converters.enumeratedValue(allFluidityStars);

/**
 * Converter for WeightUnit
 * @public
 */
export const weightUnit: Converter<WeightUnit> = Converters.enumeratedValue(allWeightUnits);

/**
 * Converter for Allergen
 * @public
 */
export const allergen: Converter<Allergen> = Converters.enumeratedValue(allAllergens);

/**
 * Converter for Certification
 * @public
 */
export const certification: Converter<Certification> = Converters.enumeratedValue(allCertifications);

/**
 * Converter for ChocolateApplication
 * @public
 */
export const chocolateApplication: Converter<ChocolateApplication> =
  Converters.enumeratedValue(allChocolateApplications);

/**
 * Converter for MoldFormat
 * @public
 */
export const moldFormat: Converter<MoldFormat> = Converters.enumeratedValue(allMoldFormats);

/**
 * Converter for ConfectionType
 * @public
 */
export const confectionType: Converter<ConfectionType> = Converters.enumeratedValue(allConfectionTypes);

/**
 * Converter for AdditionalChocolatePurpose
 * @public
 */
export const additionalChocolatePurpose: Converter<AdditionalChocolatePurpose> = Converters.enumeratedValue(
  allAdditionalChocolatePurposes
);

/**
 * Converter for RecipeCategory
 * @public
 */
export const recipeCategory: Converter<RecipeCategory> = Converters.enumeratedValue(allRecipeCategories);

/**
 * Converter for MeasurementUnit
 * @public
 */
export const measurementUnit: Converter<MeasurementUnit> = Converters.enumeratedValue(allMeasurementUnits);

/**
 * Converter for SpoonLevel
 * @public
 */
export const spoonLevel: Converter<SpoonLevel> = Converters.enumeratedValue(allSpoonLevels);

/**
 * Converter for IngredientPhase
 * @public
 */
export const ingredientPhase: Converter<IngredientPhase> = Converters.enumeratedValue(allIngredientPhases);

/**
 * Converter for IMeasurementUnitOption
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
 * Creates a converter for {@link IOptionsWithPreferred} collections.
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
 * Creates a converter for {@link IIdsWithPreferred} collections.
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
      ids: Converters.arrayOf(idConverter),
      preferredId: idConverter.optional()
    });

    return baseConverter.convert(from).onSuccess((collection) => {
      return validateIdsWithPreferred(collection, context);
    });
  });
}

/**
 * Creates a converter for {@link IRefWithNotes} objects.
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
    notes: Converters.string.optional()
  });
}
