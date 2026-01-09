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

import { Converter, Converters } from '@fgv/ts-utils';

import {
  AdditionalChocolatePurpose,
  Allergen,
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
  Grams,
  ID_SEPARATOR,
  IngredientCategory,
  IngredientId,
  JournalId,
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
  SourceId,
  VERSION_ID_SEPARATOR,
  WeightUnit,
  allAdditionalChocolatePurposes,
  allAllergens,
  allCacaoVarieties,
  allCertifications,
  allChocolateApplications,
  allChocolateTypes,
  allConfectionTypes,
  allFluidityStars,
  allIngredientCategories,
  allMoldFormats,
  allRecipeCategories,
  allWeightUnits
} from './model';
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
  toGrams,
  toIngredientId,
  toJournalId,
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
 * Converter for Grams
 * @public
 */
export const grams: Converter<Grams> = Converters.generic(toGrams);

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
