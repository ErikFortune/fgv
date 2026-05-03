/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { generateUuid, isValidUuid } from '../../packlets/base';

describe('uuid module', () => {
  describe('isValidUuid', () => {
    test('accepts a canonical lowercase UUIDv4 string', () => {
      expect(isValidUuid('1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed')).toBe(true);
    });

    test.each([
      ['empty string', ''],
      ['arbitrary text', 'not-a-uuid'],
      ['uppercase hex (non-canonical)', '1B9D6BCD-BBFD-4B2D-9B5D-AB8DFBBD4BED'],
      ['missing a group', '1b9d6bcd-bbfd-4b2d-9b5d'],
      ['extra characters', '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bedX'],
      ['nil UUID (version nibble is 0)', '00000000-0000-0000-0000-000000000000'],
      ['invalid variant nibble', '1b9d6bcd-bbfd-4b2d-7b5d-ab8dfbbd4bed'],
      ['non-hex character', '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4beZ']
    ])('rejects %s', (__label, value) => {
      expect(isValidUuid(value)).toBe(false);
    });
  });

  describe('generateUuid', () => {
    test('returns a string that satisfies isValidUuid', () => {
      const uuid = generateUuid();
      expect(typeof uuid).toBe('string');
      expect(isValidUuid(uuid)).toBe(true);
    });

    test('returns a different value on each call', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUuid());
      }
      expect(uuids.size).toBe(100);
    });
  });
});
