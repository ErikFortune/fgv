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
import { cavityDimensions, moldData, mold, moldConverter } from '../../../packlets/molds/converters';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { Mold } from '../../../packlets/molds/mold';

describe('Mold Converters', () => {
  // ============================================================================
  // Test Data
  // ============================================================================

  const validCavityDimensions = {
    width: 30,
    length: 30,
    depth: 16
  };

  const validMoldData = {
    baseId: 'chocolate-world-cw-2227',
    manufacturer: 'Chocolate World',
    productNumber: 'CW 2227',
    description: 'Hex Swirl',
    cavityCount: 32,
    cavityWeight: 10,
    cavityDimensions: validCavityDimensions,
    format: 'series-2000',
    tags: ['hex-swirl', 'praline']
  };

  // ============================================================================
  // cavityDimensions Converter
  // ============================================================================

  describe('cavityDimensions', () => {
    test('converts valid cavity dimensions', () => {
      expect(cavityDimensions.convert(validCavityDimensions)).toSucceedAndSatisfy((result) => {
        expect(result.width).toBe(30);
        expect(result.length).toBe(30);
        expect(result.depth).toBe(16);
      });
    });

    test('fails for missing width', () => {
      const input = {
        length: 30,
        depth: 16
      };
      expect(cavityDimensions.convert(input)).toFail();
    });

    test('fails for missing length', () => {
      const input = {
        width: 30,
        depth: 16
      };
      expect(cavityDimensions.convert(input)).toFail();
    });

    test('fails for missing depth', () => {
      const input = {
        width: 30,
        length: 30
      };
      expect(cavityDimensions.convert(input)).toFail();
    });

    test('fails for non-numeric values', () => {
      const input = {
        ...validCavityDimensions,
        width: 'thirty'
      };
      expect(cavityDimensions.convert(input)).toFail();
    });

    test('fails for negative values', () => {
      const input = {
        ...validCavityDimensions,
        depth: -5
      };
      expect(cavityDimensions.convert(input)).toFail();
    });

    test('converts zero dimensions', () => {
      const input = {
        width: 0,
        length: 0,
        depth: 0
      };
      expect(cavityDimensions.convert(input)).toSucceed();
    });
  });

  // ============================================================================
  // moldData Converter
  // ============================================================================

  describe('moldData', () => {
    test('converts valid mold data with all fields', () => {
      expect(moldData.convert(validMoldData)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('chocolate-world-cw-2227');
        expect(result.manufacturer).toBe('Chocolate World');
        expect(result.productNumber).toBe('CW 2227');
        expect(result.description).toBe('Hex Swirl');
        expect(result.cavityCount).toBe(32);
        expect(result.cavityWeight).toBe(10);
        expect(result.cavityDimensions).toBeDefined();
        expect(result.format).toBe('series-2000');
        expect(result.tags).toEqual(['hex-swirl', 'praline']);
      });
    });

    test('converts mold data with only required fields', () => {
      const input = {
        baseId: 'test-mold',
        manufacturer: 'Test Maker',
        productNumber: 'TM-001',
        cavityCount: 24,
        format: 'series-1000'
      };
      expect(moldData.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('test-mold');
        expect(result.manufacturer).toBe('Test Maker');
        expect(result.productNumber).toBe('TM-001');
        expect(result.cavityCount).toBe(24);
        expect(result.format).toBe('series-1000');
        expect(result.description).toBeUndefined();
        expect(result.cavityWeight).toBeUndefined();
        expect(result.cavityDimensions).toBeUndefined();
        expect(result.tags).toBeUndefined();
        expect(result.notes).toBeUndefined();
      });
    });

    test('converts mold data with notes', () => {
      const input = {
        ...validMoldData,
        notes: 'Great for pralines'
      };
      expect(moldData.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.notes).toBe('Great for pralines');
      });
    });

    test('fails for missing baseId', () => {
      const input = {
        manufacturer: 'Chocolate World',
        productNumber: 'CW 2227',
        cavityCount: 32,
        format: 'series-2000'
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for invalid baseId (contains dot)', () => {
      const input = {
        ...validMoldData,
        baseId: 'invalid.id'
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for missing manufacturer', () => {
      const input = {
        baseId: 'test-mold',
        productNumber: 'TM-001',
        cavityCount: 24,
        format: 'series-1000'
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for missing productNumber', () => {
      const input = {
        baseId: 'test-mold',
        manufacturer: 'Test Maker',
        cavityCount: 24,
        format: 'series-1000'
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for missing cavityCount', () => {
      const input = {
        baseId: 'test-mold',
        manufacturer: 'Test Maker',
        productNumber: 'TM-001',
        format: 'series-1000'
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for missing format', () => {
      const input = {
        baseId: 'test-mold',
        manufacturer: 'Test Maker',
        productNumber: 'TM-001',
        cavityCount: 24
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for invalid format', () => {
      const input = {
        ...validMoldData,
        format: 'invalid-format'
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for non-numeric cavityCount', () => {
      const input = {
        ...validMoldData,
        cavityCount: 'thirty-two'
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for non-numeric cavityWeight', () => {
      const input = {
        ...validMoldData,
        cavityWeight: 'ten'
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for invalid cavityDimensions', () => {
      const input = {
        ...validMoldData,
        cavityDimensions: { width: 30 } // missing length and depth
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for non-array tags', () => {
      const input = {
        ...validMoldData,
        tags: 'not-an-array'
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for non-string tag values', () => {
      const input = {
        ...validMoldData,
        tags: [123, 456]
      };
      expect(moldData.convert(input)).toFail();
    });

    test('converts with series-1000 format', () => {
      const input = {
        ...validMoldData,
        format: 'series-1000'
      };
      expect(moldData.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.format).toBe('series-1000');
      });
    });
  });

  // ============================================================================
  // mold Converter
  // ============================================================================

  describe('mold', () => {
    test('converts valid mold data to Mold instance', () => {
      expect(mold.convert(validMoldData)).toSucceedAndSatisfy((result) => {
        expect(result).toBeInstanceOf(Mold);
        expect(result.baseId).toBe('chocolate-world-cw-2227');
        expect(result.manufacturer).toBe('Chocolate World');
        expect(result.productNumber).toBe('CW 2227');
      });
    });

    test('fails for invalid mold data', () => {
      const input = {
        baseId: 'invalid.id',
        manufacturer: 'Test',
        productNumber: 'T1',
        cavityCount: 1,
        format: 'series-1000'
      };
      expect(mold.convert(input)).toFail();
    });

    test('fails for non-object input', () => {
      expect(mold.convert('not an object')).toFail();
      expect(mold.convert(null)).toFail();
      expect(mold.convert(123)).toFail();
    });
  });

  // ============================================================================
  // moldConverter (alias)
  // ============================================================================

  describe('moldConverter', () => {
    test('is an alias for mold converter', () => {
      expect(moldConverter.convert(validMoldData)).toSucceedAndSatisfy((result) => {
        expect(result).toBeInstanceOf(Mold);
      });
    });
  });
});
