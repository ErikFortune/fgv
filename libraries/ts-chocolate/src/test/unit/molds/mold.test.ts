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
import { Mold } from '../../../packlets/molds/mold';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { IMold, ICavityDimensions } from '../../../packlets/molds/model';
import { BaseMoldId, Measurement, Millimeters, MoldFormat } from '../../../packlets/common';

/**
 * Tests for Mold - pure data layer class.
 */
describe('Mold', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const validCavityDimensions: ICavityDimensions = {
    width: 30 as Millimeters,
    length: 30 as Millimeters,
    depth: 16 as Millimeters
  };

  const validMoldData: IMold = {
    baseId: 'chocolate-world-cw-2227' as BaseMoldId,
    manufacturer: 'Chocolate World',
    productNumber: 'CW 2227',
    description: 'Hex Swirl',
    cavityCount: 32,
    cavityWeight: 10 as Measurement,
    cavityDimensions: validCavityDimensions,
    format: 'series-2000' as MoldFormat,
    tags: ['hex-swirl', 'praline']
  };

  const minimalMoldData: IMold = {
    baseId: 'test-mold' as BaseMoldId,
    manufacturer: 'Test Maker',
    productNumber: 'TM-001',
    cavityCount: 24,
    format: 'series-1000' as MoldFormat
  };

  // ============================================================================
  // Mold.create()
  // ============================================================================

  describe('Mold.create()', () => {
    test('creates mold with all fields', () => {
      expect(Mold.create(validMoldData)).toSucceedAndSatisfy((mold) => {
        expect(mold.baseId).toBe('chocolate-world-cw-2227');
        expect(mold.manufacturer).toBe('Chocolate World');
        expect(mold.productNumber).toBe('CW 2227');
        expect(mold.description).toBe('Hex Swirl');
        expect(mold.cavityCount).toBe(32);
        expect(mold.cavityWeight).toBe(10);
        expect(mold.cavityDimensions).toEqual(validCavityDimensions);
        expect(mold.format).toBe('series-2000');
        expect(mold.tags).toEqual(['hex-swirl', 'praline']);
      });
    });

    test('creates mold with only required fields', () => {
      expect(Mold.create(minimalMoldData)).toSucceedAndSatisfy((mold) => {
        expect(mold.baseId).toBe('test-mold');
        expect(mold.manufacturer).toBe('Test Maker');
        expect(mold.productNumber).toBe('TM-001');
        expect(mold.cavityCount).toBe(24);
        expect(mold.format).toBe('series-1000');
        expect(mold.description).toBeUndefined();
        expect(mold.cavityWeight).toBeUndefined();
        expect(mold.cavityDimensions).toBeUndefined();
        expect(mold.tags).toBeUndefined();
        expect(mold.notes).toBeUndefined();
      });
    });

    test('creates mold with notes', () => {
      const moldData: IMold = {
        ...minimalMoldData,
        notes: 'Great for pralines'
      };
      expect(Mold.create(moldData)).toSucceedAndSatisfy((mold) => {
        expect(mold.notes).toBe('Great for pralines');
      });
    });
  });

  // ============================================================================
  // IMold interface implementation
  // ============================================================================

  describe('IMold interface implementation', () => {
    test('implements all IMold properties', () => {
      expect(Mold.create(validMoldData)).toSucceedAndSatisfy((mold) => {
        // Required properties
        expect(typeof mold.baseId).toBe('string');
        expect(typeof mold.manufacturer).toBe('string');
        expect(typeof mold.productNumber).toBe('string');
        expect(typeof mold.cavityCount).toBe('number');
        expect(typeof mold.format).toBe('string');

        // Optional properties
        expect(mold.description).toBeDefined();
        expect(mold.cavityWeight).toBeDefined();
        expect(mold.cavityDimensions).toBeDefined();
        expect(mold.tags).toBeDefined();
      });
    });

    test('mold can be used as IMold', () => {
      expect(Mold.create(validMoldData)).toSucceedAndSatisfy((mold) => {
        // Type check - this compiles if Mold implements IMold correctly
        const moldInterface: IMold = mold;
        expect(moldInterface.baseId).toBe(mold.baseId);
      });
    });
  });
});
