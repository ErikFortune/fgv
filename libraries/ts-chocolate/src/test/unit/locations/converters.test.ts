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
import { locationEntity } from '../../../packlets/entities/locations/converters';

describe('Location Converters', () => {
  const validLocationData = {
    baseId: 'kitchen-shelf',
    name: 'Kitchen Shelf',
    description: 'Top shelf of the kitchen cabinet',
    notes: [{ category: 'user', note: 'Keep organized' }],
    urls: [{ category: 'reference', url: 'https://example.com' }]
  };

  describe('locationEntity', () => {
    test('converts valid location with all fields', () => {
      expect(locationEntity.convert(validLocationData)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('kitchen-shelf');
        expect(result.name).toBe('Kitchen Shelf');
        expect(result.description).toBe('Top shelf of the kitchen cabinet');
        expect(result.notes).toHaveLength(1);
        expect(result.urls).toHaveLength(1);
      });
    });

    test('converts valid location with required fields only', () => {
      const minimalData = {
        baseId: 'workshop',
        name: 'Workshop'
      };
      expect(locationEntity.convert(minimalData)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('workshop');
        expect(result.name).toBe('Workshop');
        expect(result.description).toBeUndefined();
        expect(result.notes).toBeUndefined();
        expect(result.urls).toBeUndefined();
      });
    });

    test('fails for missing baseId', () => {
      const data = { name: 'Kitchen Shelf' };
      expect(locationEntity.convert(data)).toFail();
    });

    test('fails for missing name', () => {
      const data = { baseId: 'kitchen-shelf' };
      expect(locationEntity.convert(data)).toFail();
    });

    test('fails for invalid baseId with dots', () => {
      const data = { baseId: 'invalid.id', name: 'Test' };
      expect(locationEntity.convert(data)).toFail();
    });

    test('fails for non-object input', () => {
      expect(locationEntity.convert('not-an-object')).toFail();
      expect(locationEntity.convert(null)).toFail();
      expect(locationEntity.convert(undefined)).toFail();
    });

    test('fails for extra fields (strict mode)', () => {
      const data = {
        baseId: 'test',
        name: 'Test',
        unexpected: 'field'
      };
      expect(locationEntity.convert(data)).toFail();
    });
  });
});
