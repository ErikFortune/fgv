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
 * Converters for journal types
 * @packageDocumentation
 */

import { Converter, Converters } from '@fgv/ts-utils';

import { Converters as CommonConverters } from '../../common';
import {
  barTruffleVariationFields,
  confectionYield as confectionYieldConverter,
  commonVariationFields,
  moldedBonBonVariationFields,
  rolledTruffleVariationFields
} from '../confections/converters';
import {
  AnyProducedConfectionEntity,
  AnyResolvedFillingSlotEntity,
  IProducedBarTruffleEntity,
  IProducedMoldedBonBonEntity,
  IProducedRolledTruffleEntity,
  IResolvedFillingSlotEntity,
  IResolvedIngredientSlotEntity,
  ResolvedSlotType,
  allResolvedSlotTypes
} from '../confections';
import {
  fillingRecipeVariationEntity,
  ingredientModifiers as ingredientModifiersConverter
} from '../fillings/converters';
import { IProducedFillingEntity, IProducedFillingIngredientEntity } from '../fillings';
import {
  allJournalEntryTypes,
  AnyJournalConfectionVariation,
  AnyJournalEntryEntity,
  IBarTruffleJournalVariation,
  IConfectionEditJournalEntryEntity,
  IConfectionProductionJournalEntryEntity,
  IFillingEditJournalEntryEntity,
  IFillingProductionJournalEntryEntity,
  IGroupNotesJournalEntryEntity,
  IMoldedBonBonJournalVariation,
  IRolledTruffleJournalVariation,
  JournalEntryType
} from './model';

/**
 * Converter for {@link Entities.Journal.JournalEntryType | JournalEntryType}.
 * @public
 */
export const journalEntryType: Converter<JournalEntryType> = Converters.enumeratedValue(allJournalEntryTypes);

/**
 * Converter for {@link Entities.Confections.ResolvedSlotType | ResolvedSlotType}.
 * @public
 */
export const resolvedSlotType: Converter<ResolvedSlotType> = Converters.enumeratedValue(allResolvedSlotTypes);

/**
 * Converter for {@link Entities.Confections.IResolvedFillingSlotEntity | IResolvedFillingSlotEntity}.
 * @public
 */
export const resolvedFillingSlotEntity: Converter<IResolvedFillingSlotEntity> =
  Converters.strictObject<IResolvedFillingSlotEntity>({
    slotType: Converters.literal('recipe'),
    slotId: CommonConverters.slotId,
    fillingId: CommonConverters.fillingId
  });

/**
 * Converter for {@link Entities.Confections.IResolvedIngredientSlotEntity | IResolvedIngredientSlotEntity}.
 * @public
 */
export const resolvedIngredientSlotEntity: Converter<IResolvedIngredientSlotEntity> =
  Converters.strictObject<IResolvedIngredientSlotEntity>({
    slotType: Converters.literal('ingredient'),
    slotId: CommonConverters.slotId,
    ingredientId: CommonConverters.ingredientId
  });

/**
 * Converter for {@link Entities.Confections.AnyResolvedFillingSlotEntity | AnyResolvedFillingSlot}.
 * Uses discriminated object pattern on `slotType` field.
 * @public
 */
export const anyResolvedFillingSlotEntity: Converter<AnyResolvedFillingSlotEntity> =
  Converters.discriminatedObject<AnyResolvedFillingSlotEntity>('slotType', {
    recipe: resolvedFillingSlotEntity,
    ingredient: resolvedIngredientSlotEntity
  });

// ============================================================================
// Journal Confection Variation Converters
// ============================================================================

/**
 * Converter for {@link IMoldedBonBonJournalVariation} — molded bonbon variation snapshot.
 * @public
 */
export const moldedBonBonJournalVariation: Converter<IMoldedBonBonJournalVariation> =
  Converters.strictObject<IMoldedBonBonJournalVariation>({
    ...commonVariationFields,
    ...moldedBonBonVariationFields,
    variationType: Converters.literal('molded-bonbon')
  });

/**
 * Converter for {@link IBarTruffleJournalVariation} — bar truffle variation snapshot.
 * @public
 */
export const barTruffleJournalVariation: Converter<IBarTruffleJournalVariation> =
  Converters.strictObject<IBarTruffleJournalVariation>({
    ...commonVariationFields,
    ...barTruffleVariationFields,
    variationType: Converters.literal('bar-truffle')
  });

/**
 * Converter for {@link IRolledTruffleJournalVariation} — rolled truffle variation snapshot.
 * @public
 */
export const rolledTruffleJournalVariation: Converter<IRolledTruffleJournalVariation> =
  Converters.strictObject<IRolledTruffleJournalVariation>({
    ...commonVariationFields,
    ...rolledTruffleVariationFields,
    variationType: Converters.literal('rolled-truffle')
  });

/**
 * Converter for {@link AnyJournalConfectionVariation} — discriminated on `variationType`.
 * @public
 */
export const anyJournalConfectionVariation: Converter<AnyJournalConfectionVariation> =
  Converters.discriminatedObject<AnyJournalConfectionVariation>('variationType', {
    /* eslint-disable @typescript-eslint/naming-convention */
    'molded-bonbon': moldedBonBonJournalVariation,
    'bar-truffle': barTruffleJournalVariation,
    'rolled-truffle': rolledTruffleJournalVariation
    /* eslint-enable @typescript-eslint/naming-convention */
  });

// ============================================================================
// Produced Filling Converters
// ============================================================================

/**
 * Converter for {@link Entities.Fillings.IProducedFillingIngredientEntity | IProducedFillingIngredientEntity}.
 * @public
 */
export const producedFillingIngredientEntity: Converter<IProducedFillingIngredientEntity> =
  Converters.strictObject<IProducedFillingIngredientEntity>({
    ingredientId: CommonConverters.ingredientId,
    amount: CommonConverters.measurement,
    unit: CommonConverters.measurementUnit.optional(),
    modifiers: ingredientModifiersConverter.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * Converter for {@link Entities.Fillings.IProducedFillingEntity | IProducedFillingEntity}.
 * @public
 */
export const producedFillingEntity: Converter<IProducedFillingEntity> =
  Converters.strictObject<IProducedFillingEntity>({
    variationId: CommonConverters.fillingRecipeVariationId,
    scaleFactor: Converters.number,
    targetWeight: CommonConverters.measurement,
    ingredients: Converters.arrayOf(producedFillingIngredientEntity),
    procedureId: CommonConverters.procedureId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

// ============================================================================
// Produced Confection Converters
// ============================================================================

/**
 * Converter for {@link Entities.Confections.IProducedMoldedBonBonEntity | IProducedMoldedBonBonEntity}.
 * @public
 */
export const producedMoldedBonBonEntity: Converter<IProducedMoldedBonBonEntity> =
  Converters.strictObject<IProducedMoldedBonBonEntity>({
    confectionType: Converters.literal('molded-bonbon'),
    variationId: CommonConverters.confectionRecipeVariationId,
    yield: confectionYieldConverter,
    fillings: Converters.arrayOf(anyResolvedFillingSlotEntity).optional(),
    procedureId: CommonConverters.procedureId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    moldId: CommonConverters.moldId,
    shellChocolateId: CommonConverters.ingredientId,
    sealChocolateId: CommonConverters.ingredientId.optional(),
    decorationChocolateId: CommonConverters.ingredientId.optional()
  });

/**
 * Converter for {@link Entities.Confections.IProducedBarTruffleEntity | IProducedBarTruffleEntity}.
 * @public
 */
export const producedBarTruffleEntity: Converter<IProducedBarTruffleEntity> =
  Converters.strictObject<IProducedBarTruffleEntity>({
    confectionType: Converters.literal('bar-truffle'),
    variationId: CommonConverters.confectionRecipeVariationId,
    yield: confectionYieldConverter,
    fillings: Converters.arrayOf(anyResolvedFillingSlotEntity).optional(),
    procedureId: CommonConverters.procedureId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    enrobingChocolateId: CommonConverters.ingredientId.optional()
  });

/**
 * Converter for {@link Entities.Confections.IProducedRolledTruffleEntity | IProducedRolledTruffleEntity}.
 * @public
 */
export const producedRolledTruffleEntity: Converter<IProducedRolledTruffleEntity> =
  Converters.strictObject<IProducedRolledTruffleEntity>({
    confectionType: Converters.literal('rolled-truffle'),
    variationId: CommonConverters.confectionRecipeVariationId,
    yield: confectionYieldConverter,
    fillings: Converters.arrayOf(anyResolvedFillingSlotEntity).optional(),
    procedureId: CommonConverters.procedureId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    enrobingChocolateId: CommonConverters.ingredientId.optional(),
    coatingId: CommonConverters.ingredientId.optional()
  });

/**
 * Converter for {@link Entities.Confections.AnyProducedConfectionEntity | AnyProducedConfectionEntity}.
 * Uses discriminated object pattern on `confectionType` field.
 * Note: Kebab-case keys are intentional - they match the type discriminator values.
 * @public
 */
export const anyProducedConfectionEntity: Converter<AnyProducedConfectionEntity> =
  Converters.discriminatedObject<AnyProducedConfectionEntity>('confectionType', {
    /* eslint-disable @typescript-eslint/naming-convention */
    'molded-bonbon': producedMoldedBonBonEntity,
    'bar-truffle': producedBarTruffleEntity,
    'rolled-truffle': producedRolledTruffleEntity
    /* eslint-enable @typescript-eslint/naming-convention */
  });

// ============================================================================
// Journal Entry Converters
// ============================================================================

/**
 * Converter for {@link Entities.Journal.IFillingEditJournalEntryEntity | IFillingEditJournalEntryEntity}.
 * @public
 */
export const fillingEditJournalEntryEntity: Converter<IFillingEditJournalEntryEntity> =
  Converters.strictObject<IFillingEditJournalEntryEntity>({
    type: Converters.literal('filling-edit'),
    baseId: CommonConverters.baseJournalId,
    timestamp: Converters.string,
    variationId: CommonConverters.fillingRecipeVariationId,
    recipe: fillingRecipeVariationEntity,
    updated: fillingRecipeVariationEntity.optional(),
    updatedId: CommonConverters.fillingRecipeVariationId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * Converter for {@link Entities.Journal.IConfectionEditJournalEntryEntity | IConfectionEditJournalEntryEntity}.
 * @public
 */
export const confectionEditJournalEntryEntity: Converter<IConfectionEditJournalEntryEntity> =
  Converters.strictObject<IConfectionEditJournalEntryEntity>({
    type: Converters.literal('confection-edit'),
    baseId: CommonConverters.baseJournalId,
    timestamp: Converters.string,
    variationId: CommonConverters.confectionRecipeVariationId,
    recipe: anyJournalConfectionVariation,
    updated: anyJournalConfectionVariation.optional(),
    updatedId: CommonConverters.confectionRecipeVariationId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * Converter for {@link Entities.Journal.IFillingProductionJournalEntryEntity | IFillingProductionJournalEntryEntity}.
 * @public
 */
export const fillingProductionJournalEntryEntity: Converter<IFillingProductionJournalEntryEntity> =
  Converters.strictObject<IFillingProductionJournalEntryEntity>({
    type: Converters.literal('filling-production'),
    baseId: CommonConverters.baseJournalId,
    timestamp: Converters.string,
    variationId: CommonConverters.fillingRecipeVariationId,
    recipe: fillingRecipeVariationEntity,
    updated: fillingRecipeVariationEntity.optional(),
    updatedId: CommonConverters.fillingRecipeVariationId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    yield: CommonConverters.measurement,
    produced: producedFillingEntity
  });

/**
 * Converter for {@link Entities.Journal.IConfectionProductionJournalEntryEntity | IConfectionProductionJournalEntryEntity}.
 * @public
 */
export const confectionProductionJournalEntryEntity: Converter<IConfectionProductionJournalEntryEntity> =
  Converters.strictObject<IConfectionProductionJournalEntryEntity>({
    type: Converters.literal('confection-production'),
    baseId: CommonConverters.baseJournalId,
    timestamp: Converters.string,
    variationId: CommonConverters.confectionRecipeVariationId,
    recipe: anyJournalConfectionVariation,
    updated: anyJournalConfectionVariation.optional(),
    updatedId: CommonConverters.confectionRecipeVariationId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    yield: confectionYieldConverter,
    produced: anyProducedConfectionEntity
  });

/**
 * Converter for {@link Entities.Journal.IGroupNotesJournalEntryEntity | IGroupNotesJournalEntryEntity}.
 * @public
 */
export const groupNotesJournalEntryEntity: Converter<IGroupNotesJournalEntryEntity> =
  Converters.strictObject<IGroupNotesJournalEntryEntity>({
    type: Converters.literal('group-notes'),
    baseId: CommonConverters.baseJournalId,
    timestamp: Converters.string,
    group: CommonConverters.groupName,
    label: Converters.string.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * Converter for {@link Entities.Journal.AnyJournalEntryEntity | AnyJournalEntryEntity}.
 * Uses discriminated object pattern on `type` field.
 * Note: Kebab-case keys are intentional - they match the type discriminator values.
 * @public
 */
export const anyJournalEntryEntity: Converter<AnyJournalEntryEntity> =
  Converters.discriminatedObject<AnyJournalEntryEntity>('type', {
    /* eslint-disable @typescript-eslint/naming-convention */
    'filling-edit': fillingEditJournalEntryEntity,
    'confection-edit': confectionEditJournalEntryEntity,
    'filling-production': fillingProductionJournalEntryEntity,
    'confection-production': confectionProductionJournalEntryEntity,
    'group-notes': groupNotesJournalEntryEntity
    /* eslint-enable @typescript-eslint/naming-convention */
  });
