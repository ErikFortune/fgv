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

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  generateJournalId,
  generateSessionBaseId,
  generateSessionId,
  getCurrentDateString,
  getCurrentTimestamp
} from '../../../../packlets/runtime/session/sessionUtils';

describe('Session Utils', () => {
  describe('generateSessionId', () => {
    test('generates a valid session ID', () => {
      expect(generateSessionId()).toSucceedAndSatisfy((sessionId) => {
        // Session ID format: YYYY-MM-DD-HHMMSS-xxxxxxxx
        expect(typeof sessionId).toBe('string');
        expect(sessionId).toMatch(/^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/);
      });
    });

    test('generates unique session IDs', () => {
      const id1 = generateSessionId().orThrow();
      const id2 = generateSessionId().orThrow();
      // Due to random component, IDs should be different
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateJournalId', () => {
    test('generates a valid journal ID', () => {
      expect(generateJournalId()).toSucceedAndSatisfy((journalId) => {
        // Journal ID format: YYYY-MM-DD-HHMMSS-xxxxxxxx
        expect(typeof journalId).toBe('string');
        expect(journalId).toMatch(/^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/);
      });
    });

    test('generates unique journal IDs', () => {
      const id1 = generateJournalId().orThrow();
      const id2 = generateJournalId().orThrow();
      // Due to random component, IDs should be different
      expect(id1).not.toBe(id2);
    });
  });

  describe('generateSessionBaseId', () => {
    test('generates a valid session base ID', () => {
      expect(generateSessionBaseId()).toSucceedAndSatisfy((sessionBaseId) => {
        // Session base ID format: YYYY-MM-DD-HHMMSS-xxxxxxxx
        expect(typeof sessionBaseId).toBe('string');
        expect(sessionBaseId).toMatch(/^\d{4}-\d{2}-\d{2}-\d{6}-[0-9a-f]{8}$/);
      });
    });

    test('generates unique session base IDs', () => {
      const id1 = generateSessionBaseId().orThrow();
      const id2 = generateSessionBaseId().orThrow();
      // Due to random component, IDs should be different
      expect(id1).not.toBe(id2);
    });
  });

  describe('getCurrentDateString', () => {
    test('returns a valid ISO date string', () => {
      const dateString = getCurrentDateString();
      // Date format: YYYY-MM-DD
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('returns current date', () => {
      const dateString = getCurrentDateString();
      const now = new Date();
      const expected = now.toISOString().split('T')[0];
      expect(dateString).toBe(expected);
    });
  });

  describe('getCurrentTimestamp', () => {
    test('returns a valid ISO timestamp string', () => {
      const timestamp = getCurrentTimestamp();
      // Timestamp format: YYYY-MM-DDTHH:MM:SS.sssZ
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('returns timestamp close to current time', () => {
      const before = Date.now();
      const timestamp = getCurrentTimestamp();
      const after = Date.now();

      const parsed = Date.parse(timestamp);
      expect(parsed).toBeGreaterThanOrEqual(before);
      expect(parsed).toBeLessThanOrEqual(after);
    });
  });
});
