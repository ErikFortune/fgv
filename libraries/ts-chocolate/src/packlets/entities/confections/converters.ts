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

import { Converters as CommonConverters, Model, MoldId } from '../../common';
import { Converters as DecorationConverters } from '../decorations';
import {
  AnyConfectionRecipeVariationEntity,
  AnyFillingOptionEntity,
  AnyConfectionRecipeEntity,
  BarTruffleRecipeEntity,
  BufferedConfectionYield,
  ConfectionYield,
  FillingOptionId,
  IAdditionalChocolateEntity,
  IBarTruffleRecipeVariationEntity,
  IBarTruffleYield,
  IBufferedBarTruffleYield,
  IBufferedYieldInFrames,
  IBufferedYieldInPieces,
  IChocolateSpec,
  ICoatingsEntity,
  IConfectionDecoration,
  IConfectionDerivationEntity,
  IConfectionMoldRef,
  IConfectionRecipeEntityBase,
  IConfectionRecipeVariationEntityBase,
  IFillingSlotEntity,
  IIngredientFillingOptionEntity,
  IPieceDimensions,
  IRecipeFillingOptionEntity,
  IRolledTruffleRecipeVariationEntity,
  IMoldedBonBonRecipeVariationEntity,
  IYieldInFrames,
  IYieldInPieces,
  MoldedBonBonRecipeEntity,
  RolledTruffleRecipeEntity
} from './model';
import { Converters as RecipeConverters } from '../fillings';

// ============================================================================
// Yield Converters — Recipe Variation Layer
// ============================================================================

/**
 * `Converter` for {@link Entities.Confections.IYieldInFrames | IYieldInFrames}.
 * @public
 */
export const yieldInFrames: Converter<IYieldInFrames> = Converters.strictObject<IYieldInFrames>({
  numFrames: Converters.number
});

/**
 * `Converter` for {@link Entities.Confections.IYieldInPieces | IYieldInPieces}.
 * @public
 */
export const yieldInPieces: Converter<IYieldInPieces> = Converters.strictObject<IYieldInPieces>({
  numPieces: Converters.number,
  weightPerPiece: CommonConverters.measurement
});

/**
 * `Converter` for {@link Entities.Confections.IBarTruffleYield | IBarTruffleYield}.
 * Note: must be tried before `yieldInPieces` in union converters since it is a superset.
 * @public
 */
export const barTruffleYield: Converter<IBarTruffleYield> = Converters.strictObject<IBarTruffleYield>({
  numPieces: Converters.number,
  weightPerPiece: CommonConverters.measurement,
  dimensions: Converters.strictObject<IPieceDimensions>({
    width: CommonConverters.millimeters,
    height: CommonConverters.millimeters,
    depth: CommonConverters.millimeters
  })
});

/**
 * `Converter` for {@link Entities.Confections.ConfectionYield | ConfectionYield} (union).
 * Used for the base variation entity and when the specific type is not known.
 * @public
 */
export const anyConfectionYield: Converter<ConfectionYield> = Converters.oneOf<ConfectionYield>([
  barTruffleYield, // must come before yieldInPieces (superset)
  yieldInPieces,
  yieldInFrames
]);

// ============================================================================
// Yield Converters — Produced/Session Layer
// ============================================================================

/**
 * `Converter` for {@link Entities.Confections.IBufferedYieldInFrames | IBufferedYieldInFrames}.
 * @public
 */
export const bufferedYieldInFrames: Converter<IBufferedYieldInFrames> =
  Converters.strictObject<IBufferedYieldInFrames>({
    numFrames: Converters.number,
    bufferPercentage: CommonConverters.percentage
  });

/**
 * `Converter` for {@link Entities.Confections.IBufferedYieldInPieces | IBufferedYieldInPieces}.
 * @public
 */
export const bufferedYieldInPieces: Converter<IBufferedYieldInPieces> =
  Converters.strictObject<IBufferedYieldInPieces>({
    count: Converters.number,
    weightPerPiece: CommonConverters.measurement,
    bufferPercentage: CommonConverters.percentage
  });

/**
 * `Converter` for {@link Entities.Confections.IBufferedBarTruffleYield | IBufferedBarTruffleYield}.
 * Note: must be tried before `bufferedYieldInPieces` in union converters since it is a superset.
 * @public
 */
export const bufferedBarTruffleYield: Converter<IBufferedBarTruffleYield> =
  Converters.strictObject<IBufferedBarTruffleYield>({
    count: Converters.number,
    weightPerPiece: CommonConverters.measurement,
    bufferPercentage: CommonConverters.percentage,
    dimensions: Converters.strictObject<IPieceDimensions>({
      width: CommonConverters.millimeters,
      height: CommonConverters.millimeters,
      depth: CommonConverters.millimeters
    })
  });

/**
 * `Converter` for {@link Entities.Confections.BufferedConfectionYield | BufferedConfectionYield} (union).
 * @public
 */
export const anyBufferedConfectionYield: Converter<BufferedConfectionYield> =
  Converters.oneOf<BufferedConfectionYield>([
    bufferedBarTruffleYield, // must come before bufferedYieldInPieces (superset)
    bufferedYieldInPieces,
    bufferedYieldInFrames
  ]);

// ============================================================================
// Decoration Converters
// ============================================================================

/**
 * `Converter` for {@link Entities.Confections.IConfectionDecoration | IConfectionDecoration}.
 * @public
 */
export const confectionDecoration: Converter<IConfectionDecoration> =
  Converters.strictObject<IConfectionDecoration>({
    description: Converters.string,
    preferred: Converters.boolean.optional()
  });

// ============================================================================
// Filling Converters
// ============================================================================

/**
 * `Converter` for {@link Entities.Confections.FillingOptionId | filling option ID}
 * (can be recipe or ingredient)
 * Both are composite IDs with the same format
 * @internal
 */
const fillingOptionId: Converter<FillingOptionId> = Converters.oneOf<FillingOptionId>([
  CommonConverters.fillingId,
  CommonConverters.ingredientId
]);

/**
 * `Converter` for {@link Entities.Confections.IRecipeFillingOptionEntity | IRecipeFillingOptionEntity}.
 * @public
 */
export const recipeFillingOptionEntity: Converter<IRecipeFillingOptionEntity> =
  Converters.strictObject<IRecipeFillingOptionEntity>({
    type: Converters.literal('recipe'),
    id: CommonConverters.fillingId,
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * `Converter` for {@link Entities.Confections.IIngredientFillingOptionEntity | IIngredientFillingOptionEntity}.
 * @public
 */
export const ingredientFillingOptionEntity: Converter<IIngredientFillingOptionEntity> =
  Converters.strictObject<IIngredientFillingOptionEntity>({
    type: Converters.literal('ingredient'),
    id: CommonConverters.ingredientId,
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * `Converter` for {@link Entities.Confections.AnyFillingOptionEntity | AnyFillingOptionEntity} (discriminated union)
 * @public
 */
export const anyFillingOptionEntity: Converter<AnyFillingOptionEntity> =
  Converters.oneOf<AnyFillingOptionEntity>([recipeFillingOptionEntity, ingredientFillingOptionEntity]);

/**
 * Converter for filling options with preferred selection.
 * Validates that preferredId (if specified) exists in options.
 * @public
 */
export const fillingOptionEntities: Converter<
  Model.IOptionsWithPreferred<AnyFillingOptionEntity, FillingOptionId>
> = CommonConverters.optionsWithPreferred(anyFillingOptionEntity, fillingOptionId, 'fillingOptions');

/**
 * `Converter` for {@link Entities.Confections.IFillingSlotEntity | IFillingSlotEntity}.
 * @public
 */
export const fillingSlotEntity: Converter<IFillingSlotEntity> = Converters.strictObject<IFillingSlotEntity>({
  slotId: CommonConverters.slotId,
  name: Converters.string.optional(),
  filling: fillingOptionEntities
});

// ============================================================================
// Chocolate Specification Converters
// ============================================================================

/**
 * `Converter` for {@link Entities.Confections.IChocolateSpec | IChocolateSpec} (IIdsWithPreferred<IngredientId>).
 * Validates that preferredId (if specified) exists in ids.
 * @public
 */
export const chocolateSpec: Converter<IChocolateSpec> = CommonConverters.idsWithPreferred(
  CommonConverters.ingredientId,
  'chocolateSpec'
);

/**
 * Converter for {@link Entities.Confections.IAdditionalChocolateEntity | IAdditionalChocolateEntity}.
 * @public
 */
export const additionalChocolateEntity: Converter<IAdditionalChocolateEntity> =
  Converters.strictObject<IAdditionalChocolateEntity>({
    chocolate: CommonConverters.idsWithPreferred(CommonConverters.ingredientId, 'additionalChocolate'),
    purpose: CommonConverters.additionalChocolatePurpose
  });

// ============================================================================
// Mold Converters
// ============================================================================

/**
 * Converter for {@link Entities.Confections.IConfectionMoldRef | IConfectionMoldRef}.
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
export const confectionMolds: Converter<Model.IOptionsWithPreferred<IConfectionMoldRef, MoldId>> =
  CommonConverters.optionsWithPreferred(confectionMoldRef, CommonConverters.moldId, 'confectionMolds');

// ============================================================================
// Coating Converters
// ============================================================================

/**
 * Converter for {@link Entities.Confections.ICoatingsEntity | ICoatingsEntity} (IIdsWithPreferred<IngredientId>).
 * Validates that preferredId (if specified) exists in ids.
 * @public
 */
export const coatingsEntity: Converter<ICoatingsEntity> = CommonConverters.idsWithPreferred(
  CommonConverters.ingredientId,
  'coatings'
);

// ============================================================================
// Variation Converters
// ============================================================================

/**
 * Common fields shared by all variation types.
 * The `yield` field uses the union converter; each type-specific converter overrides it with a narrower type.
 * @internal
 */
export const commonVariationFields: Conversion.FieldConverters<IConfectionRecipeVariationEntityBase> = {
  variationSpec: CommonConverters.confectionRecipeVariationSpec,
  name: Converters.string.optional(),
  createdDate: Converters.string, // ISO 8601 date string
  yield: anyConfectionYield,
  fillings: Converters.arrayOf(fillingSlotEntity).optional(),
  decorations: CommonConverters.optionsWithPreferred(
    DecorationConverters.decorationRefEntity,
    CommonConverters.decorationId,
    'decoration'
  ).optional(),
  procedures: RecipeConverters.procedureEntities.optional(),
  notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
  additionalTags: Converters.arrayOf(Converters.string).optional(),
  additionalUrls: Converters.arrayOf(CommonConverters.categorizedUrl).optional()
};

/**
 * Fields specific to molded bonbon variations (beyond commonVariationFields).
 * @internal
 */
export const moldedBonBonVariationFields: Conversion.FieldConverters<
  Omit<IMoldedBonBonRecipeVariationEntity, keyof IConfectionRecipeVariationEntityBase>
> = {
  molds: confectionMolds,
  shellChocolate: chocolateSpec,
  additionalChocolates: Converters.arrayOf(additionalChocolateEntity).optional()
};

/**
 * Converter for {@link Entities.Confections.IMoldedBonBonVariationEntity | IMoldedBonBonRecipeVariationEntity}.
 * @public
 */
export const moldedBonBonRecipeVariationEntity: Converter<IMoldedBonBonRecipeVariationEntity> =
  Converters.strictObject<IMoldedBonBonRecipeVariationEntity>({
    ...commonVariationFields,
    yield: yieldInFrames,
    ...moldedBonBonVariationFields
  });

/**
 * Fields specific to bar truffle variations (beyond commonVariationFields).
 * @internal
 */
export const barTruffleVariationFields: Conversion.FieldConverters<
  Omit<IBarTruffleRecipeVariationEntity, keyof IConfectionRecipeVariationEntityBase>
> = {
  enrobingChocolate: chocolateSpec.optional()
};

/**
 * Converter for {@link Entities.Confections.IBarTruffleRecipeVariationEntity | IBarTruffleRecipeVariationEntity}.
 * @public
 */
export const barTruffleRecipeVariationEntity: Converter<IBarTruffleRecipeVariationEntity> =
  Converters.strictObject<IBarTruffleRecipeVariationEntity>({
    ...commonVariationFields,
    yield: barTruffleYield,
    ...barTruffleVariationFields
  });

/**
 * Fields specific to rolled truffle variations (beyond commonVariationFields).
 * @internal
 */
export const rolledTruffleVariationFields: Conversion.FieldConverters<
  Omit<IRolledTruffleRecipeVariationEntity, keyof IConfectionRecipeVariationEntityBase>
> = {
  enrobingChocolate: chocolateSpec.optional(),
  coatings: coatingsEntity.optional()
};

/**
 * Converter for {@link Entities.Confections.IRolledTruffleRecipeVariationEntity | IRolledTruffleRecipeVariationEntity}.
 * @public
 */
export const rolledTruffleRecipeVariationEntity: Converter<IRolledTruffleRecipeVariationEntity> =
  Converters.strictObject<IRolledTruffleRecipeVariationEntity>({
    ...commonVariationFields,
    yield: yieldInPieces,
    ...rolledTruffleVariationFields
  });

/**
 * Converter for {@link Entities.Confections.AnyConfectionRecipeVariationEntity | AnyConfectionRecipeVariationEntity} (discriminated by presence of type-specific fields)
 * @public
 */
export const anyConfectionRecipeVariationEntity: Converter<AnyConfectionRecipeVariationEntity> =
  Converters.oneOf<AnyConfectionRecipeVariationEntity>([
    moldedBonBonRecipeVariationEntity,
    barTruffleRecipeVariationEntity,
    rolledTruffleRecipeVariationEntity
  ]);

// ============================================================================
// Base Confection Converter
// ============================================================================

/**
 * Converter for {@link Entities.Confections.IConfectionDerivationEntity | IConfectionDerivationEntity}.
 * @public
 */
export const confectionDerivationEntity: Converter<IConfectionDerivationEntity> =
  Converters.strictObject<IConfectionDerivationEntity>({
    sourceVariationId: CommonConverters.confectionRecipeVariationId,
    derivedDate: Converters.string, // ISO 8601 date string
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * Common fields shared by all confection types (identity and metadata only)
 * @internal
 */
const commonConfectionFields: Conversion.FieldConverters<
  Omit<IConfectionRecipeEntityBase, 'confectionType' | 'variations'>
> = {
  baseId: CommonConverters.baseConfectionId,
  name: CommonConverters.confectionName,
  description: Converters.string.optional(),
  tags: Converters.arrayOf(Converters.string).optional(),
  urls: Converters.arrayOf(CommonConverters.categorizedUrl).optional(),
  goldenVariationSpec: CommonConverters.confectionRecipeVariationSpec,
  derivedFrom: confectionDerivationEntity.optional()
};

/**
 * Converter for base {@link Entities.Confections.IConfectionEntityBase | IConfectionEntityBase} properties.
 * @public
 */
export const baseConfectionEntity: Converter<IConfectionRecipeEntityBase> =
  Converters.strictObject<IConfectionRecipeEntityBase>({
    ...commonConfectionFields,
    confectionType: CommonConverters.confectionType,
    variations: Converters.arrayOf(anyConfectionRecipeVariationEntity)
  });

// ============================================================================
// Discriminated Confection Converters
// ============================================================================

/**
 * Converter for {@link Entities.Confections.IMoldedBonBonEntity | IMoldedBonBonEntity}
 * @public
 */
export const moldedBonBonEntity: Converter<MoldedBonBonRecipeEntity> =
  Converters.strictObject<MoldedBonBonRecipeEntity>({
    ...commonConfectionFields,
    confectionType: Converters.literal('molded-bonbon'),
    variations: Converters.arrayOf(moldedBonBonRecipeVariationEntity)
  });

/**
 * Converter for {@link Entities.Confections.IBarTruffleEntity | IBarTruffleEntity}
 * @public
 */
export const barTruffleEntity: Converter<BarTruffleRecipeEntity> =
  Converters.strictObject<BarTruffleRecipeEntity>({
    ...commonConfectionFields,
    confectionType: Converters.literal('bar-truffle'),
    variations: Converters.arrayOf(barTruffleRecipeVariationEntity)
  });

/**
 * Converter for {@link Entities.Confections.IRolledTruffleEntity | IRolledTruffleEntity}
 * @public
 */
export const rolledTruffleEntity: Converter<RolledTruffleRecipeEntity> =
  Converters.strictObject<RolledTruffleRecipeEntity>({
    ...commonConfectionFields,
    confectionType: Converters.literal('rolled-truffle'),
    variations: Converters.arrayOf(rolledTruffleRecipeVariationEntity)
  });

// ============================================================================
// Discriminated Union Converter
// ============================================================================

/**
 * Converter for {@link Entities.Confections.AnyConfectionEntity | AnyConfectionEntity} (discriminated union)
 * Dispatches to the appropriate type-specific converter based on confectionType
 * @public
 */
export const anyConfectionRawEntity: Converter<AnyConfectionRecipeEntity> =
  Converters.oneOf<AnyConfectionRecipeEntity>([moldedBonBonEntity, barTruffleEntity, rolledTruffleEntity]);

/**
 * Converter for {@link Entities.Confections.AnyConfectionEntity | AnyConfectionEntity} with validation.
 * Validates that goldenVariationSpec exists in variations.
 * Returns the plain data object (discriminated union), not a class instance.
 * @public
 */
export const anyConfectionEntity: Converter<AnyConfectionRecipeEntity> =
  Converters.generic<AnyConfectionRecipeEntity>((from: unknown): Result<AnyConfectionRecipeEntity> => {
    return anyConfectionRawEntity.convert(from).onSuccess((data) => {
      if (data.variations.length === 0) {
        return Failure.with('Confection must have at least one variation');
      }

      // Validate that goldenVariationSpec exists in variations
      const goldenExists = data.variations.some((v) => v.variationSpec === data.goldenVariationSpec);
      if (!goldenExists) {
        return Failure.with(
          `Golden variation ${data.goldenVariationSpec} not found in variations for confection ${data.baseId}`
        );
      }

      return Success.with(data);
    });
  });
