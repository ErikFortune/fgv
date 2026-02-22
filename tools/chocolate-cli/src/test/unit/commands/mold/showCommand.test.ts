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

// Mock ESM-only module before imports
jest.mock('@inquirer/prompts', () => ({
  search: jest.fn()
}));

import '@fgv/ts-utils-jest';
import { Entities, MoldId } from '@fgv/ts-chocolate';

import { formatMoldHuman } from '../../../../commands/mold/showCommand';

// ============================================================================
// Test Data
// ============================================================================

function createGridMold(overrides?: Record<string, unknown>): Entities.Molds.IMoldEntity {
  return {
    baseId: 'cw1000',
    manufacturer: 'Chocolate World',
    productNumber: 'CW1000',
    format: 'series-1000',
    cavities: {
      kind: 'grid',
      columns: 4,
      rows: 6
    },
    ...overrides
  } as unknown as Entities.Molds.IMoldEntity;
}

function createCountMold(overrides?: Record<string, unknown>): Entities.Molds.IMoldEntity {
  return {
    baseId: 'custom-12',
    manufacturer: 'Custom Molds',
    productNumber: 'CM-12',
    format: 'other',
    cavities: {
      kind: 'count',
      count: 12
    },
    ...overrides
  } as unknown as Entities.Molds.IMoldEntity;
}

// ============================================================================
// Tests
// ============================================================================

describe('formatMoldHuman', () => {
  test('formats grid mold', () => {
    const mold = createGridMold();
    const output = formatMoldHuman(mold, 'coll.cw1000' as MoldId);
    expect(output).toContain('Mold: CW1000');
    expect(output).toContain('ID: coll.cw1000');
    expect(output).toContain('Manufacturer: Chocolate World');
    expect(output).toContain('Product Number: CW1000');
    expect(output).toContain('Format: series-1000');
    expect(output).toContain('Layout: 4 x 6 grid');
    expect(output).toContain('Total Count: 24');
  });

  test('formats count mold', () => {
    const mold = createCountMold();
    const output = formatMoldHuman(mold, 'coll.custom-12' as MoldId);
    expect(output).toContain('Count: 12');
    expect(output).not.toContain('Layout:');
  });

  test('formats mold with description', () => {
    const mold = createGridMold({ description: 'Semi-sphere 25mm' });
    const output = formatMoldHuman(mold, 'coll.cw1000' as MoldId);
    expect(output).toContain('Mold: Semi-sphere 25mm');
    expect(output).toContain('Description: Semi-sphere 25mm');
  });

  test('uses product number when no description', () => {
    const mold = createGridMold();
    const output = formatMoldHuman(mold, 'coll.cw1000' as MoldId);
    expect(output).toContain('Mold: CW1000');
  });

  test('formats mold with tags', () => {
    const mold = createGridMold({ tags: ['bonbon', 'sphere'] });
    const output = formatMoldHuman(mold, 'coll.cw1000' as MoldId);
    expect(output).toContain('Tags: bonbon, sphere');
  });

  test('formats cavity info with weight', () => {
    const mold = createGridMold({
      cavities: {
        kind: 'grid',
        columns: 4,
        rows: 6,
        info: { weight: 10 }
      }
    });
    const output = formatMoldHuman(mold, 'coll.cw1000' as MoldId);
    expect(output).toContain('Weight per cavity: 10g');
  });

  test('formats cavity info with dimensions', () => {
    const mold = createGridMold({
      cavities: {
        kind: 'grid',
        columns: 4,
        rows: 6,
        info: {
          dimensions: { width: 25, length: 25, depth: 12 }
        }
      }
    });
    const output = formatMoldHuman(mold, 'coll.cw1000' as MoldId);
    expect(output).toContain('Dimensions: 25 x 25 x 12 mm');
  });

  test('formats related molds', () => {
    const mold = createGridMold({
      related: ['coll.cw1001', 'coll.cw1002']
    });
    const output = formatMoldHuman(mold, 'coll.cw1000' as MoldId);
    expect(output).toContain('Related Molds:');
    expect(output).toContain('coll.cw1001');
    expect(output).toContain('coll.cw1002');
  });

  test('formats notes', () => {
    const mold = createGridMold({
      notes: 'Best for ganache fillings'
    });
    const output = formatMoldHuman(mold, 'coll.cw1000' as MoldId);
    expect(output).toContain('Notes: Best for ganache fillings');
  });

  test('formats URLs', () => {
    const mold = createGridMold({
      urls: [{ url: 'https://shop.example.com/cw1000', category: 'shop' }]
    });
    const output = formatMoldHuman(mold, 'coll.cw1000' as MoldId);
    expect(output).toContain('https://shop.example.com/cw1000');
  });
});
