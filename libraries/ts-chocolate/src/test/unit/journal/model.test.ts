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

import '@fgv/ts-utils-jest';

import { allJournalEventTypes, JournalEventType } from '../../../packlets/journal';

describe('Journal Model', () => {
  describe('allJournalEventTypes', () => {
    test('contains all expected event types', () => {
      expect(allJournalEventTypes).toContain('ingredient-add');
      expect(allJournalEventTypes).toContain('ingredient-remove');
      expect(allJournalEventTypes).toContain('ingredient-modify');
      expect(allJournalEventTypes).toContain('ingredient-substitute');
      expect(allJournalEventTypes).toContain('scale-adjust');
      expect(allJournalEventTypes).toContain('note');
    });

    test('has correct number of event types', () => {
      expect(allJournalEventTypes.length).toBe(6);
    });

    test('type assertion for JournalEventType', () => {
      // Verify each element is a valid JournalEventType
      allJournalEventTypes.forEach((eventType) => {
        const typed: JournalEventType = eventType;
        expect(typeof typed).toBe('string');
      });
    });
  });
});
