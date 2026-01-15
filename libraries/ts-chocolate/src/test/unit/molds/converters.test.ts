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
import { cavityDimensions, moldData } from '../../../packlets/entities/molds/converters';

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
    cavities: {
      kind: 'count',
      count: 32,
      info: {
        weight: 10,
        dimensions: validCavityDimensions
      }
    },
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
        expect(result.cavities.kind).toBe('count');
        if (result.cavities.kind === 'count') {
          expect(result.cavities.count).toBe(32);
        }
        expect(result.cavities.info?.weight).toBe(10);
        expect(result.cavities.info?.dimensions).toBeDefined();
        expect(result.format).toBe('series-2000');
        expect(result.tags).toEqual(['hex-swirl', 'praline']);
      });
    });

    test('converts mold data with only required fields', () => {
      const input = {
        baseId: 'test-mold',
        manufacturer: 'Test Maker',
        productNumber: 'TM-001',
        cavities: { kind: 'count', count: 24 },
        format: 'series-1000'
      };
      expect(moldData.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('test-mold');
        expect(result.manufacturer).toBe('Test Maker');
        expect(result.productNumber).toBe('TM-001');
        expect(result.cavities.kind).toBe('count');
        if (result.cavities.kind === 'count') {
          expect(result.cavities.count).toBe(24);
        }
        expect(result.format).toBe('series-1000');
        expect(result.description).toBeUndefined();
        expect(result.cavities.info?.weight).toBeUndefined();
        expect(result.cavities.info?.dimensions).toBeUndefined();
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
        cavities: { kind: 'count', count: 32 },
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
        cavities: { kind: 'count', count: 24 },
        format: 'series-1000'
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for missing productNumber', () => {
      const input = {
        baseId: 'test-mold',
        manufacturer: 'Test Maker',
        cavities: { kind: 'count', count: 24 },
        format: 'series-1000'
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for missing cavities', () => {
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
        cavities: { kind: 'count', count: 24 }
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

    test('fails for non-numeric cavities.count', () => {
      const input = {
        ...validMoldData,
        cavities: {
          kind: 'count',
          count: 'thirty-two'
        }
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for non-numeric cavities.info.weight', () => {
      const input = {
        ...validMoldData,
        cavities: {
          kind: 'count',
          count: 32,
          info: {
            weight: 'ten'
          }
        }
      };
      expect(moldData.convert(input)).toFail();
    });

    test('fails for invalid cavities.info.dimensions', () => {
      const input = {
        ...validMoldData,
        cavities: {
          kind: 'count',
          count: 32,
          info: {
            dimensions: { width: 30 } // missing length and depth
          }
        }
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

    test('converts with other format', () => {
      const input = {
        ...validMoldData,
        format: 'other'
      };
      expect(moldData.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.format).toBe('other');
      });
    });
  });
});
