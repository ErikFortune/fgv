// Copyright (c) 2026 Erik Fortune
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
 * Converters for confection types
 * @packageDocumentation
 */

import { Conversion, Converter, Converters, Failure, Result, Success } from '@fgv/ts-utils';

import { Converters as CommonConverters, IOptionsWithPreferred, MoldId, ProcedureId } from '../common';
import {
  AnyFillingOption,
  ConfectionData,
  FillingOptionId,
  IAdditionalChocolate,
  IBarTruffle,
  IBonBonDimensions,
  IChocolateSpec,
  ICoatings,
  IConfection,
  IConfectionDecoration,
  IConfectionMoldRef,
  IConfectionProcedureRef,
  IConfectionVersion,
  IConfectionYield,
  IFillingSlot,
  IFrameDimensions,
  IIngredientFillingOption,
  IMoldedBonBon,
  IRecipeFillingOption,
  IRolledTruffle
} from './model';

// ============================================================================
// Yield and Decoration Converters
// ============================================================================

/**
 * Converter for IConfectionYield
 * @public
 */
export const confectionYield: Converter<IConfectionYield> = Converters.object<IConfectionYield>({
  count: Converters.number,
  unit: Converters.string.optional(),
  weightPerPiece: CommonConverters.grams.optional()
});

/**
 * Converter for IConfectionDecoration
 * @public
 */
export const confectionDecoration: Converter<IConfectionDecoration> =
  Converters.object<IConfectionDecoration>({
    description: Converters.string,
    preferred: Converters.boolean.optional()
  });

// ============================================================================
// Filling Converters
// ============================================================================

/**
 * Converter for filling option ID (can be recipe or ingredient)
 * Both are composite IDs with the same format
 * @internal
 */
const fillingOptionId: Converter<FillingOptionId> = Converters.oneOf<FillingOptionId>([
  CommonConverters.recipeId,
  CommonConverters.ingredientId
]);

/**
 * Converter for IRecipeFillingOption
 * @public
 */
export const recipeFillingOption: Converter<IRecipeFillingOption> = Converters.object<IRecipeFillingOption>({
  type: Converters.literal('recipe'),
  id: CommonConverters.recipeId,
  notes: Converters.string.optional()
});

/**
 * Converter for IIngredientFillingOption
 * @public
 */
export const ingredientFillingOption: Converter<IIngredientFillingOption> =
  Converters.object<IIngredientFillingOption>({
    type: Converters.literal('ingredient'),
    id: CommonConverters.ingredientId,
    notes: Converters.string.optional()
  });

/**
 * Converter for AnyFillingOption (discriminated union)
 * @public
 */
export const anyFillingOption: Converter<AnyFillingOption> = Converters.oneOf<AnyFillingOption>([
  recipeFillingOption,
  ingredientFillingOption
]);

/**
 * Converter for filling options with preferred selection.
 * Validates that preferredId (if specified) exists in options.
 * @public
 */
export const fillingOptions: Converter<IOptionsWithPreferred<AnyFillingOption, FillingOptionId>> =
  CommonConverters.optionsWithPreferred(anyFillingOption, fillingOptionId, 'fillingOptions');

/**
 * Converter for IFillingSlot
 * @public
 */
export const fillingSlot: Converter<IFillingSlot> = Converters.object<IFillingSlot>({
  slotId: CommonConverters.slotId,
  name: Converters.string.optional(),
  filling: fillingOptions
});

// ============================================================================
// Chocolate Specification Converters
// ============================================================================

/**
 * Converter for IChocolateSpec (IIdsWithPreferred<IngredientId>).
 * Validates that preferredId (if specified) exists in ids.
 * @public
 */
export const chocolateSpec: Converter<IChocolateSpec> = CommonConverters.idsWithPreferred(
  CommonConverters.ingredientId,
  'chocolateSpec'
);

/**
 * Converter for IAdditionalChocolate
 * @public
 */
export const additionalChocolate: Converter<IAdditionalChocolate> = Converters.object<IAdditionalChocolate>({
  chocolate: CommonConverters.idsWithPreferred(CommonConverters.ingredientId, 'additionalChocolate'),
  purpose: CommonConverters.additionalChocolatePurpose
});

// ============================================================================
// Mold Converters
// ============================================================================

/**
 * Converter for IConfectionMoldRef
 * @public
 */
export const confectionMoldRef: Converter<IConfectionMoldRef> = CommonConverters.refWithNotes(
  CommonConverters.moldId
);

/**
 * Converter for confection molds with preferred selection.
 * Validates that preferredId (if specified) exists in options.
 * @public
 */
export const confectionMolds: Converter<IOptionsWithPreferred<IConfectionMoldRef, MoldId>> =
  CommonConverters.optionsWithPreferred(confectionMoldRef, CommonConverters.moldId, 'confectionMolds');

// ============================================================================
// Procedure Converters
// ============================================================================

/**
 * Converter for IConfectionProcedureRef
 * @public
 */
export const confectionProcedureRef: Converter<IConfectionProcedureRef> = CommonConverters.refWithNotes(
  CommonConverters.procedureId
);

/**
 * Converter for confection procedures with preferred selection.
 * Validates that preferredId (if specified) exists in options.
 * @public
 */
export const confectionProcedures: Converter<IOptionsWithPreferred<IConfectionProcedureRef, ProcedureId>> =
  CommonConverters.optionsWithPreferred(
    confectionProcedureRef,
    CommonConverters.procedureId,
    'confectionProcedures'
  );

// ============================================================================
// Dimension Converters
// ============================================================================

/**
 * Converter for IFrameDimensions
 * @public
 */
export const frameDimensions: Converter<IFrameDimensions> = Converters.object<IFrameDimensions>({
  width: CommonConverters.millimeters,
  height: CommonConverters.millimeters,
  depth: CommonConverters.millimeters
});

/**
 * Converter for IBonBonDimensions
 * @public
 */
export const bonBonDimensions: Converter<IBonBonDimensions> = Converters.object<IBonBonDimensions>({
  width: CommonConverters.millimeters,
  height: CommonConverters.millimeters
});

// ============================================================================
// Coating Converters
// ============================================================================

/**
 * Converter for ICoatings (IIdsWithPreferred<IngredientId>).
 * Validates that preferredId (if specified) exists in ids.
 * @public
 */
export const coatings: Converter<ICoatings> = CommonConverters.idsWithPreferred(
  CommonConverters.ingredientId,
  'coatings'
);

// ============================================================================
// Version Converters
// ============================================================================

/**
 * Converter for IConfectionVersion
 * @public
 */
export const confectionVersion: Converter<IConfectionVersion> = Converters.object<IConfectionVersion>({
  versionSpec: CommonConverters.confectionVersionSpec,
  createdDate: Converters.string, // ISO 8601 date string
  notes: Converters.string.optional()
});

// ============================================================================
// Base Confection Converter
// ============================================================================

/**
 * Common fields shared by all confection types
 * @internal
 */
const commonConfectionFields: Conversion.FieldConverters<Omit<IConfection, 'confectionType'>> = {
  baseId: CommonConverters.baseConfectionId,
  name: CommonConverters.confectionName,
  description: Converters.string.optional(),
  decorations: Converters.arrayOf(confectionDecoration).optional(),
  tags: Converters.arrayOf(Converters.string).optional(),
  yield: confectionYield,
  fillings: Converters.arrayOf(fillingSlot).optional(),
  confectionProcedures: confectionProcedures.optional(),
  versions: Converters.arrayOf(confectionVersion),
  goldenVersionSpec: CommonConverters.confectionVersionSpec
};

/**
 * Converter for base IConfection properties
 * @public
 */
export const baseConfection: Converter<IConfection> = Converters.object<IConfection>({
  ...commonConfectionFields,
  confectionType: CommonConverters.confectionType
});

// ============================================================================
// Discriminated Confection Converters
// ============================================================================

/**
 * Converter for IMoldedBonBon
 * @public
 */
export const moldedBonBon: Converter<IMoldedBonBon> = Converters.object<IMoldedBonBon>({
  ...commonConfectionFields,
  confectionType: Converters.literal('molded-bonbon'),
  molds: confectionMolds,
  shellChocolate: chocolateSpec,
  additionalChocolates: Converters.arrayOf(additionalChocolate).optional()
});

/**
 * Converter for IBarTruffle
 * @public
 */
export const barTruffle: Converter<IBarTruffle> = Converters.object<IBarTruffle>({
  ...commonConfectionFields,
  confectionType: Converters.literal('bar-truffle'),
  frameDimensions,
  singleBonBonDimensions: bonBonDimensions,
  enrobingChocolate: chocolateSpec.optional()
});

/**
 * Converter for IRolledTruffle
 * @public
 */
export const rolledTruffle: Converter<IRolledTruffle> = Converters.object<IRolledTruffle>({
  ...commonConfectionFields,
  confectionType: Converters.literal('rolled-truffle'),
  enrobingChocolate: chocolateSpec.optional(),
  coatings: coatings.optional()
});

// ============================================================================
// Discriminated Union Converter
// ============================================================================

/**
 * Converter for ConfectionData (discriminated union)
 * Dispatches to the appropriate type-specific converter based on confectionType
 * @public
 */
export const confectionData: Converter<ConfectionData> = Converters.oneOf<ConfectionData>([
  moldedBonBon,
  barTruffle,
  rolledTruffle
]);

/**
 * Converter for {@link Confections.ConfectionData | ConfectionData} with validation.
 * Validates that goldenVersionSpec exists in versions.
 * Returns the plain data object (discriminated union), not a class instance.
 * @public
 */
export const confection: Converter<ConfectionData> = Converters.generic<ConfectionData>(
  (from: unknown): Result<ConfectionData> => {
    return confectionData.convert(from).onSuccess((data) => {
      if (data.versions.length === 0) {
        return Failure.with('Confection must have at least one version');
      }

      // Validate that goldenVersionSpec exists in versions
      const goldenExists = data.versions.some((v) => v.versionSpec === data.goldenVersionSpec);
      if (!goldenExists) {
        return Failure.with(
          `Golden version ${data.goldenVersionSpec} not found in versions for confection ${data.baseId}`
        );
      }

      return Success.with(data);
    });
  }
);
