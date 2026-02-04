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
  anyConfectionVersionEntity as anyConfectionVersionConverter,
  confectionYield as confectionYieldConverter
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
  fillingRecipeVersion as fillingRecipeVersionConverter,
  ingredientModifiers as ingredientModifiersConverter
} from '../fillings/converters';
import { IProducedFilling, IProducedFillingIngredient } from '../fillings';
import {
  allJournalEntryTypes,
  AnyJournalEntry,
  IConfectionEditJournalEntry,
  IConfectionProductionJournalEntry,
  IFillingEditJournalEntry,
  IFillingProductionJournalEntry,
  JournalEntryType
} from './model';

// ============================================================================
// Filling Recipe Version Converter
// ============================================================================

// ============================================================================
// Journal Entry Type Converters
// ============================================================================

/**
 * Converter for {@link Entities.Journal.JournalEntryType | JournalEntryType}.
 * @public
 */
export const journalEntryType: Converter<JournalEntryType> = Converters.enumeratedValue(allJournalEntryTypes);

// ============================================================================
// Resolved Slot Converters
// ============================================================================

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
  Converters.object<IResolvedFillingSlotEntity>({
    slotType: Converters.literal('recipe'),
    slotId: CommonConverters.slotId,
    fillingId: CommonConverters.fillingId
  });

/**
 * Converter for {@link Entities.Confections.IResolvedIngredientSlotEntity | IResolvedIngredientSlotEntity}.
 * @public
 */
export const resolvedIngredientSlotEntity: Converter<IResolvedIngredientSlotEntity> =
  Converters.object<IResolvedIngredientSlotEntity>({
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
// Produced Filling Converters
// ============================================================================

/**
 * Converter for {@link Entities.Fillings.IProducedFillingIngredient | IProducedFillingIngredient}.
 * @public
 */
export const producedFillingIngredient: Converter<IProducedFillingIngredient> =
  Converters.object<IProducedFillingIngredient>({
    ingredientId: CommonConverters.ingredientId,
    amount: CommonConverters.measurement,
    unit: CommonConverters.measurementUnit.optional(),
    modifiers: ingredientModifiersConverter.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * Converter for {@link Entities.Fillings.IProducedFilling | IProducedFilling}.
 * @public
 */
export const producedFilling: Converter<IProducedFilling> = Converters.object<IProducedFilling>({
  versionId: CommonConverters.fillingVersionId,
  scaleFactor: Converters.number,
  targetWeight: CommonConverters.measurement,
  ingredients: Converters.arrayOf(producedFillingIngredient),
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
  Converters.object<IProducedMoldedBonBonEntity>({
    confectionType: Converters.literal('molded-bonbon'),
    versionId: CommonConverters.confectionVersionId,
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
  Converters.object<IProducedBarTruffleEntity>({
    confectionType: Converters.literal('bar-truffle'),
    versionId: CommonConverters.confectionVersionId,
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
  Converters.object<IProducedRolledTruffleEntity>({
    confectionType: Converters.literal('rolled-truffle'),
    versionId: CommonConverters.confectionVersionId,
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
 * Converter for {@link Entities.Journal.IFillingEditJournalEntry | IFillingEditJournalEntry}.
 * @public
 */
export const fillingEditJournalEntry: Converter<IFillingEditJournalEntry> =
  Converters.object<IFillingEditJournalEntry>({
    type: Converters.literal('filling-edit'),
    baseId: CommonConverters.journalBaseId,
    timestamp: Converters.string,
    versionId: CommonConverters.fillingVersionId,
    recipe: fillingRecipeVersionConverter,
    updated: fillingRecipeVersionConverter.optional(),
    updatedId: CommonConverters.fillingVersionId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * Converter for {@link Entities.Journal.IConfectionEditJournalEntry | IConfectionEditJournalEntry}.
 * @public
 */
export const confectionEditJournalEntry: Converter<IConfectionEditJournalEntry> =
  Converters.object<IConfectionEditJournalEntry>({
    type: Converters.literal('confection-edit'),
    baseId: CommonConverters.journalBaseId,
    timestamp: Converters.string,
    versionId: CommonConverters.confectionVersionId,
    recipe: anyConfectionVersionConverter,
    updated: anyConfectionVersionConverter.optional(),
    updatedId: CommonConverters.confectionVersionId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional()
  });

/**
 * Converter for {@link Entities.Journal.IFillingProductionJournalEntry | IFillingProductionJournalEntry}.
 * @public
 */
export const fillingProductionJournalEntry: Converter<IFillingProductionJournalEntry> =
  Converters.object<IFillingProductionJournalEntry>({
    type: Converters.literal('filling-production'),
    baseId: CommonConverters.journalBaseId,
    timestamp: Converters.string,
    versionId: CommonConverters.fillingVersionId,
    recipe: fillingRecipeVersionConverter,
    updated: fillingRecipeVersionConverter.optional(),
    updatedId: CommonConverters.fillingVersionId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    yield: CommonConverters.measurement,
    produced: producedFilling
  });

/**
 * Converter for {@link Entities.Journal.IConfectionProductionJournalEntry | IConfectionProductionJournalEntry}.
 * @public
 */
export const confectionProductionJournalEntry: Converter<IConfectionProductionJournalEntry> =
  Converters.object<IConfectionProductionJournalEntry>({
    type: Converters.literal('confection-production'),
    baseId: CommonConverters.journalBaseId,
    timestamp: Converters.string,
    versionId: CommonConverters.confectionVersionId,
    recipe: anyConfectionVersionConverter,
    updated: anyConfectionVersionConverter.optional(),
    updatedId: CommonConverters.confectionVersionId.optional(),
    notes: Converters.arrayOf(CommonConverters.categorizedNote).optional(),
    yield: confectionYieldConverter,
    produced: anyProducedConfectionEntity
  });

/**
 * Converter for {@link Entities.Journal.AnyJournalEntry | AnyJournalEntry}.
 * Uses discriminated object pattern on `type` field.
 * Note: Kebab-case keys are intentional - they match the type discriminator values.
 * @public
 */
export const anyJournalEntry: Converter<AnyJournalEntry> = Converters.discriminatedObject<AnyJournalEntry>(
  'type',
  {
    /* eslint-disable @typescript-eslint/naming-convention */
    'filling-edit': fillingEditJournalEntry,
    'confection-edit': confectionEditJournalEntry,
    'filling-production': fillingProductionJournalEntry,
    'confection-production': confectionProductionJournalEntry
    /* eslint-enable @typescript-eslint/naming-convention */
  }
);
