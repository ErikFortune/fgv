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
import { allJournalEventTypes, IJournalEntry, IJournalRecord, JournalEventType } from './model';

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
 * Converter for {@link Journal.IJournalRecord | IJournalRecord}.
 * @public
 */
export const journalRecord: Converter<IJournalRecord> = Converters.object<IJournalRecord>({
  journalId: CommonConverters.journalId,
  recipeVersionId: CommonConverters.recipeVersionId,
  date: Converters.string, // ISO 8601 date string
  targetWeight: CommonConverters.grams,
  scaleFactor: Converters.number,
  notes: Converters.string.optional(),
  modifiedVersionId: CommonConverters.recipeVersionId.optional(),
  entries: Converters.arrayOf(journalEntry).optional()
});
