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

import { Converters as CommonConverters } from '../common';
import {
  allChocolateRoles,
  allConfectionJournalEventTypes,
  allJournalEventTypes,
  allJournalTypes,
  AnyJournalRecord,
  ChocolateRole,
  ConfectionJournalEventType,
  IConfectionJournalEntry,
  IConfectionJournalRecord,
  IJournalEntry,
  IRecipeJournalRecord,
  JournalEventType,
  JournalType
} from './model';

/**
 * Converter for {@link Journal.JournalEventType | JournalEventType}.
 * @public
 */
export const journalEventType: Converter<JournalEventType> = Converters.enumeratedValue(allJournalEventTypes);

/**
 * Converter for {@link Journal.IJournalEntry | IJournalEntry}.
 * @public
 */
export const journalEntry: Converter<IJournalEntry> = Converters.object<IJournalEntry>({
  timestamp: Converters.string, // ISO 8601 timestamp
  eventType: journalEventType,
  ingredientId: CommonConverters.ingredientId.optional(),
  originalAmount: CommonConverters.grams.optional(),
  newAmount: CommonConverters.grams.optional(),
  substituteIngredientId: CommonConverters.ingredientId.optional(),
  text: Converters.string.optional()
});

/**
 * Converter for {@link Journal.JournalType | JournalType}.
 * @public
 */
export const journalType: Converter<JournalType> = Converters.enumeratedValue(allJournalTypes);

/**
 * Converter for {@link Journal.IRecipeJournalRecord | IRecipeJournalRecord}.
 * @public
 */
export const recipeJournalRecord: Converter<IRecipeJournalRecord> = Converters.object<IRecipeJournalRecord>({
  journalType: Converters.literal('recipe'),
  journalId: CommonConverters.journalId,
  recipeVersionId: CommonConverters.recipeVersionId,
  date: Converters.string, // ISO 8601 date string
  targetWeight: CommonConverters.grams,
  scaleFactor: Converters.number,
  notes: Converters.string.optional(),
  modifiedVersionId: CommonConverters.recipeVersionId.optional(),
  entries: Converters.arrayOf(journalEntry).optional()
});

/**
 * Converter for {@link Journal.ConfectionJournalEventType | ConfectionJournalEventType}.
 * @public
 */
export const confectionJournalEventType: Converter<ConfectionJournalEventType> = Converters.enumeratedValue(
  allConfectionJournalEventTypes
);

/**
 * Converter for {@link Journal.ChocolateRole | ChocolateRole}.
 * @public
 */
export const chocolateRole: Converter<ChocolateRole> = Converters.enumeratedValue(allChocolateRoles);

/**
 * Converter for {@link Journal.IConfectionJournalEntry | IConfectionJournalEntry}.
 * @public
 */
export const confectionJournalEntry: Converter<IConfectionJournalEntry> =
  Converters.object<IConfectionJournalEntry>({
    timestamp: Converters.string, // ISO 8601 timestamp
    eventType: confectionJournalEventType,
    // filling-select fields
    fillingRecipeId: CommonConverters.recipeId.optional(),
    previousFillingRecipeId: CommonConverters.recipeId.optional(),
    fillingIngredientId: CommonConverters.ingredientId.optional(),
    previousFillingIngredientId: CommonConverters.ingredientId.optional(),
    // mold-select fields
    moldId: CommonConverters.moldId.optional(),
    previousMoldId: CommonConverters.moldId.optional(),
    // chocolate-select fields
    chocolateRole: chocolateRole.optional(),
    ingredientId: CommonConverters.ingredientId.optional(),
    previousIngredientId: CommonConverters.ingredientId.optional(),
    // yield-modify fields
    newYieldCount: Converters.number.optional(),
    previousYieldCount: Converters.number.optional(),
    newWeightPerPiece: CommonConverters.grams.optional(),
    previousWeightPerPiece: CommonConverters.grams.optional(),
    // procedure-select fields
    procedureId: CommonConverters.procedureId.optional(),
    previousProcedureId: CommonConverters.procedureId.optional(),
    // coating-select fields
    coatingIngredientId: CommonConverters.ingredientId.optional(),
    previousCoatingIngredientId: CommonConverters.ingredientId.optional(),
    // note fields
    text: Converters.string.optional()
  });

/**
 * Converter for {@link Journal.IConfectionJournalRecord | IConfectionJournalRecord}.
 * @public
 */
export const confectionJournalRecord: Converter<IConfectionJournalRecord> =
  Converters.object<IConfectionJournalRecord>({
    journalType: Converters.literal('confection'),
    journalId: CommonConverters.journalId,
    confectionVersionId: CommonConverters.confectionVersionId,
    date: Converters.string, // ISO 8601 date string
    yieldCount: Converters.number,
    weightPerPiece: CommonConverters.grams.optional(),
    notes: Converters.string.optional(),
    modifiedVersionId: CommonConverters.confectionVersionId.optional(),
    linkedRecipeJournalId: CommonConverters.journalId.optional(),
    entries: Converters.arrayOf(confectionJournalEntry).optional()
  });

/**
 * Converter for {@link Journal.AnyJournalRecord | AnyJournalRecord}.
 * Uses the `journalType` discriminator to select the appropriate converter.
 * @public
 */
export const anyJournalRecord: Converter<AnyJournalRecord> = Converters.discriminatedObject<AnyJournalRecord>(
  'journalType',
  {
    recipe: recipeJournalRecord,
    confection: confectionJournalRecord
  }
);
