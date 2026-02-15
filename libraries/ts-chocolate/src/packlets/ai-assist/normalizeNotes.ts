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
 * Helpers for AI-generated entity notes.
 * @packageDocumentation
 */

import { type NoteCategory, type Model as CommonModel } from '../common';

/**
 * The note category used for AI-generated notes.
 * @public
 */
export const AI_NOTE_CATEGORY: NoteCategory = 'ai' as NoteCategory;

/**
 * Extracts the first AI-category note text from a notes array.
 * @param notes - Array of categorized notes
 * @returns The first AI note text, or undefined
 * @public
 */
export function extractAiNote(
  notes: ReadonlyArray<CommonModel.ICategorizedNote> | undefined
): string | undefined {
  return notes?.find((n) => n.category === AI_NOTE_CATEGORY)?.note;
}
