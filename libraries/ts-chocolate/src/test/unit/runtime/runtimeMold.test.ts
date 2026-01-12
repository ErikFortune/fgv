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

import { BaseMoldId, Measurement, Millimeters, MoldFormat, MoldId } from '../../../packlets/common';
import { IMold } from '../../../packlets/entities';
import { RuntimeMold, IMoldContext } from '../../../packlets/runtime';

describe('RuntimeMold', () => {
  // Mock mold context (currently empty, reserved for future use)
  const mockContext: IMoldContext = {};

  // Sample mold data
  const simpleMold: IMold = {
    baseId: 'cw-2227' as BaseMoldId,
    manufacturer: 'Chocolate World',
    productNumber: 'CW 2227',
    description: 'Rectangle bar mold',
    cavityCount: 8,
    cavityWeight: 10 as Measurement,
    cavityDimensions: {
      width: 30 as Millimeters,
      length: 50 as Millimeters,
      depth: 10 as Millimeters
    },
    format: 'chocolate-world-275x135' as MoldFormat,
    tags: ['bar', 'rectangle'],
    notes: 'Classic bar mold'
  };

  const moldWithoutWeight: IMold = {
    baseId: 'custom-mold' as BaseMoldId,
    manufacturer: 'Custom',
    productNumber: 'CUSTOM-001',
    cavityCount: 12,
    format: 'custom' as MoldFormat
  };

  describe('create', () => {
    test('should create RuntimeMold from IMold', () => {
      const moldId = 'cw.cw-2227' as MoldId;

      expect(RuntimeMold.create(mockContext, moldId, simpleMold)).toSucceedAndSatisfy((runtimeMold) => {
        expect(runtimeMold.id).toBe(moldId);
        expect(runtimeMold.sourceId).toBe('cw');
        expect(runtimeMold.baseId).toBe('cw-2227');
        expect(runtimeMold.manufacturer).toBe('Chocolate World');
        expect(runtimeMold.productNumber).toBe('CW 2227');
      });
    });

    test('should expose all mold properties', () => {
      const moldId = 'cw.cw-2227' as MoldId;

      expect(RuntimeMold.create(mockContext, moldId, simpleMold)).toSucceedAndSatisfy((runtimeMold) => {
        expect(runtimeMold.description).toBe('Rectangle bar mold');
        expect(runtimeMold.cavityCount).toBe(8);
        expect(runtimeMold.cavityWeight).toBe(10);
        expect(runtimeMold.cavityDimensions).toEqual({
          width: 30,
          length: 50,
          depth: 10
        });
        expect(runtimeMold.format).toBe('chocolate-world-275x135');
        expect(runtimeMold.tags).toEqual(['bar', 'rectangle']);
        expect(runtimeMold.notes).toBe('Classic bar mold');
      });
    });
  });

  describe('computed properties', () => {
    describe('displayName', () => {
      test('should return manufacturer + product number', () => {
        const moldId = 'cw.cw-2227' as MoldId;
        const runtimeMold = RuntimeMold.create(mockContext, moldId, simpleMold).orThrow();

        expect(runtimeMold.displayName).toBe('Chocolate World CW 2227');
      });
    });

    describe('totalCapacity', () => {
      test('should calculate total capacity from cavity weight and count', () => {
        const moldId = 'cw.cw-2227' as MoldId;
        const runtimeMold = RuntimeMold.create(mockContext, moldId, simpleMold).orThrow();

        // 8 cavities * 10g each = 80g
        expect(runtimeMold.totalCapacity).toBe(80);
      });

      test('should return undefined when cavity weight is not set', () => {
        const moldId = 'custom.custom-mold' as MoldId;
        const runtimeMold = RuntimeMold.create(mockContext, moldId, moldWithoutWeight).orThrow();

        expect(runtimeMold.totalCapacity).toBeUndefined();
      });
    });
  });

  describe('raw', () => {
    test('should expose underlying IMold', () => {
      const moldId = 'cw.cw-2227' as MoldId;
      const runtimeMold = RuntimeMold.create(mockContext, moldId, simpleMold).orThrow();

      expect(runtimeMold.raw).toBe(simpleMold);
    });
  });

  describe('optional properties', () => {
    test('should handle mold with minimal properties', () => {
      const moldId = 'custom.custom-mold' as MoldId;

      expect(RuntimeMold.create(mockContext, moldId, moldWithoutWeight)).toSucceedAndSatisfy(
        (runtimeMold) => {
          expect(runtimeMold.description).toBeUndefined();
          expect(runtimeMold.cavityWeight).toBeUndefined();
          expect(runtimeMold.cavityDimensions).toBeUndefined();
          expect(runtimeMold.tags).toBeUndefined();
          expect(runtimeMold.notes).toBeUndefined();
        }
      );
    });
  });
});
