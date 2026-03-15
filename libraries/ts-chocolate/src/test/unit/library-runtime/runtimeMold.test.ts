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

import {
  BaseMoldId,
  Measurement,
  Millimeters,
  Model as CommonModel,
  MoldFormat,
  MoldId
} from '../../../packlets/common';
import { IMoldEntity } from '../../../packlets/entities';
import { Mold, IMoldContext } from '../../../packlets/library-runtime';

describe('RuntimeMold', () => {
  // Mock mold context (currently empty, reserved for future use)
  const mockContext: IMoldContext = {};

  // Sample mold data
  const simpleMold: IMoldEntity = {
    baseId: 'cw-2227' as BaseMoldId,
    manufacturer: 'Chocolate World',
    productNumber: 'CW 2227',
    name: 'Rectangle bar mold',
    cavities: {
      kind: 'count',
      count: 8,
      info: {
        weight: 10 as Measurement,
        dimensions: {
          width: 30 as Millimeters,
          length: 50 as Millimeters,
          depth: 10 as Millimeters
        }
      }
    },
    format: 'chocolate-world-275x135' as MoldFormat,
    tags: ['bar', 'rectangle'],
    notes: [{ category: 'user', note: 'Classic bar mold' }] as CommonModel.ICategorizedNote[]
  };

  const moldWithoutWeight: IMoldEntity = {
    baseId: 'custom-mold' as BaseMoldId,
    manufacturer: 'Custom',
    productNumber: 'CUSTOM-001',
    name: 'Custom Mold',
    cavities: { kind: 'count', count: 12 },
    format: 'custom' as MoldFormat
  };

  const gridMold: IMoldEntity = {
    baseId: 'grid-mold' as BaseMoldId,
    manufacturer: 'Polycarbonate',
    productNumber: 'PC-GRID-001',
    name: 'Grid layout mold',
    cavities: {
      kind: 'grid',
      columns: 4,
      rows: 3,
      info: {
        weight: 5 as Measurement
      }
    },
    format: 'polycarbonate-275x175' as MoldFormat,
    related: ['cw.cw-2227' as MoldId, 'cw.cw-2228' as MoldId]
  };

  describe('create', () => {
    test('should create RuntimeMold from IMold', () => {
      const moldId = 'cw.cw-2227' as MoldId;

      expect(Mold.create(mockContext, moldId, simpleMold)).toSucceedAndSatisfy((runtimeMold) => {
        expect(runtimeMold.id).toBe(moldId);
        expect(runtimeMold.collectionId).toBe('cw');
        expect(runtimeMold.baseId).toBe('cw-2227');
        expect(runtimeMold.manufacturer).toBe('Chocolate World');
        expect(runtimeMold.productNumber).toBe('CW 2227');
      });
    });

    test('should expose all mold properties', () => {
      const moldId = 'cw.cw-2227' as MoldId;

      expect(Mold.create(mockContext, moldId, simpleMold)).toSucceedAndSatisfy((runtimeMold) => {
        expect(runtimeMold.name).toBe('Rectangle bar mold');
        expect(runtimeMold.cavityCount).toBe(8);
        expect(runtimeMold.cavityWeight).toBe(10);
        expect(runtimeMold.cavityDimensions).toEqual({
          width: 30,
          length: 50,
          depth: 10
        });
        expect(runtimeMold.format).toBe('chocolate-world-275x135');
        expect(runtimeMold.tags).toEqual(['bar', 'rectangle']);
        expect(runtimeMold.notes).toEqual([{ category: 'user', note: 'Classic bar mold' }]);
      });
    });
  });

  describe('computed properties', () => {
    describe('displayName', () => {
      test('should return name with manufacturer + product number', () => {
        const moldId = 'cw.cw-2227' as MoldId;
        const runtimeMold = Mold.create(mockContext, moldId, simpleMold).orThrow();

        expect(runtimeMold.displayName).toBe('Rectangle bar mold (Chocolate World CW 2227)');
      });

      test('should always include name in display', () => {
        const moldId = 'cw.cw-2227' as MoldId;
        const runtimeMold = Mold.create(mockContext, moldId, simpleMold).orThrow();

        expect(runtimeMold.displayName).toBe('Rectangle bar mold (Chocolate World CW 2227)');
      });
    });

    describe('totalCapacity', () => {
      test('should calculate total capacity from cavity weight and count', () => {
        const moldId = 'cw.cw-2227' as MoldId;
        const runtimeMold = Mold.create(mockContext, moldId, simpleMold).orThrow();

        // 8 cavities * 10g each = 80g
        expect(runtimeMold.totalCapacity).toBe(80);
      });

      test('should return undefined when cavity weight is not set', () => {
        const moldId = 'custom.custom-mold' as MoldId;
        const runtimeMold = Mold.create(mockContext, moldId, moldWithoutWeight).orThrow();

        expect(runtimeMold.totalCapacity).toBeUndefined();
      });
    });
  });

  describe('raw', () => {
    test('should expose underlying IMold', () => {
      const moldId = 'cw.cw-2227' as MoldId;
      const runtimeMold = Mold.create(mockContext, moldId, simpleMold).orThrow();

      expect(runtimeMold.entity).toBe(simpleMold);
    });
  });

  describe('optional properties', () => {
    test('should handle mold with minimal properties', () => {
      const moldId = 'custom.custom-mold' as MoldId;

      expect(Mold.create(mockContext, moldId, moldWithoutWeight)).toSucceedAndSatisfy((runtimeMold) => {
        expect(runtimeMold.name).toBe('Custom Mold');
        expect(runtimeMold.cavityWeight).toBeUndefined();
        expect(runtimeMold.cavityDimensions).toBeUndefined();
        expect(runtimeMold.tags).toBeUndefined();
        expect(runtimeMold.notes).toBeUndefined();
        expect(runtimeMold.related).toBeUndefined();
      });
    });
  });

  describe('description', () => {
    test('should return description when present', () => {
      const moldId = 'cw.cw-2227' as MoldId;
      const moldWithDescription: IMoldEntity = {
        ...simpleMold,
        description: 'A classic rectangular bar mold'
      };
      const runtimeMold = Mold.create(mockContext, moldId, moldWithDescription).orThrow();

      expect(runtimeMold.description).toBe('A classic rectangular bar mold');
    });

    test('should return undefined when description is absent', () => {
      const moldId = 'custom.custom-mold' as MoldId;
      const runtimeMold = Mold.create(mockContext, moldId, moldWithoutWeight).orThrow();

      expect(runtimeMold.description).toBeUndefined();
    });
  });

  describe('cavities', () => {
    test('should expose cavities definition directly', () => {
      const moldId = 'cw.cw-2227' as MoldId;
      const runtimeMold = Mold.create(mockContext, moldId, simpleMold).orThrow();

      expect(runtimeMold.cavities).toBe(simpleMold.cavities);
      expect(runtimeMold.cavities.kind).toBe('count');
    });
  });

  describe('grid mold support', () => {
    test('should calculate cavityCount for grid-type molds', () => {
      const moldId = 'pc.grid-mold' as MoldId;
      const runtimeMold = Mold.create(mockContext, moldId, gridMold).orThrow();

      // 4 columns * 3 rows = 12 cavities
      expect(runtimeMold.cavityCount).toBe(12);
    });

    test('should calculate totalCapacity for grid-type molds', () => {
      const moldId = 'pc.grid-mold' as MoldId;
      const runtimeMold = Mold.create(mockContext, moldId, gridMold).orThrow();

      // 12 cavities * 5g each = 60g
      expect(runtimeMold.totalCapacity).toBe(60);
    });

    test('should expose related molds', () => {
      const moldId = 'pc.grid-mold' as MoldId;
      const runtimeMold = Mold.create(mockContext, moldId, gridMold).orThrow();

      expect(runtimeMold.related).toEqual(['cw.cw-2227', 'cw.cw-2228']);
    });
  });
});
