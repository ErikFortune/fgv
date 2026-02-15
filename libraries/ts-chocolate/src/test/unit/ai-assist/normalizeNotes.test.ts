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

import { extractAiNote, AI_NOTE_CATEGORY } from '../../../packlets/ai-assist';

describe('extractAiNote', () => {
  test('extracts the first AI note from an array', () => {
    const notes = [
      { category: AI_NOTE_CATEGORY, note: 'AI generated' },
      { category: 'user' as never, note: 'User note' }
    ];
    expect(extractAiNote(notes)).toBe('AI generated');
  });

  test('returns undefined when no AI notes present', () => {
    const notes = [{ category: 'user' as never, note: 'User note' }];
    expect(extractAiNote(notes)).toBeUndefined();
  });

  test('returns undefined for undefined input', () => {
    expect(extractAiNote(undefined)).toBeUndefined();
  });

  test('returns undefined for empty array', () => {
    expect(extractAiNote([])).toBeUndefined();
  });
});
