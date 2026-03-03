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

import { LibraryRuntime, MoldId } from '@fgv/ts-chocolate';

import {
  renderMoldSummary,
  renderMoldDetail
} from '../../../../../commands/workspace/renderers/moldRenderer';
import { createTestLibrary } from './helpers/testLibrary';

describe('moldRenderer', () => {
  let lib: LibraryRuntime.ChocolateLibrary;
  let gridMold: LibraryRuntime.IMold;
  let countMold: LibraryRuntime.IMold;

  beforeEach(() => {
    lib = createTestLibrary();
    gridMold = lib.molds.get('test.cw-2227' as MoldId).orThrow();
    countMold = lib.molds.get('test.cw-1000' as MoldId).orThrow();
  });

  // ============================================================================
  // renderMoldSummary
  // ============================================================================

  describe('renderMoldSummary', () => {
    test('formats grid mold summary', () => {
      const result = renderMoldSummary(gridMold);
      expect(result).toContain('test.cw-2227');
      expect(result).toContain(gridMold.displayName);
      expect(result).toContain('series-1000');
      expect(result).toContain('24 cavities');
    });

    test('formats count mold summary', () => {
      const result = renderMoldSummary(countMold);
      expect(result).toContain('test.cw-1000');
      expect(result).toContain(countMold.displayName);
      expect(result).toContain('series-2000');
      expect(result).toContain('12 cavities');
    });
  });

  // ============================================================================
  // renderMoldDetail
  // ============================================================================

  describe('renderMoldDetail', () => {
    test('renders grid mold with all fields', () => {
      const context = { library: lib };
      const result = renderMoldDetail(gridMold, context);

      // Basic fields
      expect(result.text).toContain('Mold:');
      expect(result.text).toContain(gridMold.displayName);
      expect(result.text).toContain('ID: test.cw-2227');
      expect(result.text).toContain('Manufacturer: Chocolate World');
      expect(result.text).toContain('Product Number: CW2227');
      expect(result.text).toContain('Format: series-1000');

      // Optional fields
      expect(result.text).toContain('Name: Classic praline mold');
      expect(result.text).toContain('Tags: praline');

      // Cavity information (grid layout)
      expect(result.text).toContain('Cavities:');
      expect(result.text).toContain('4 x 6 grid');
      expect(result.text).toContain('Total Count: 24');
      expect(result.text).toContain('Weight per cavity: 10g');
      expect(result.text).toContain('Dimensions: 30 x 30 x 15 mm');

      // Related molds
      expect(result.text).toContain('Related Molds:');
      expect(result.text).toContain('test.cw-1000');

      // Notes
      expect(result.text).toContain('Notes: Great for ganache');

      // URLs
      expect(result.text).toContain('https://example.com/mold');

      // Actions - should have one for the related mold
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe('view-mold:test.cw-1000');
      expect(result.actions[0].label).toContain(countMold.displayName);
    });

    test('renders count mold with minimal fields', () => {
      const context = { library: lib };
      const result = renderMoldDetail(countMold, context);

      // Basic fields
      expect(result.text).toContain('Mold:');
      expect(result.text).toContain(countMold.displayName);
      expect(result.text).toContain('ID: test.cw-1000');
      expect(result.text).toContain('Manufacturer: Chocolate World');
      expect(result.text).toContain('Product Number: CW1000');
      expect(result.text).toContain('Format: series-2000');

      // Should NOT have optional fields
      expect(result.text).not.toContain('Description:');
      expect(result.text).not.toContain('Tags:');

      // Cavity information (count only)
      expect(result.text).toContain('Cavities:');
      expect(result.text).toContain('Count: 12');
      expect(result.text).not.toContain('grid');
      expect(result.text).not.toContain('Weight per cavity');
      expect(result.text).not.toContain('Dimensions:');
      expect(result.text).not.toContain('Total Capacity:');

      // Should NOT have optional sections
      expect(result.text).not.toContain('Related Molds:');
      expect(result.text).not.toContain('Notes:');
      expect(result.text).not.toContain('http');

      // No actions (no related molds)
      expect(result.actions).toHaveLength(0);
    });

    test('related mold action created on successful lookup', () => {
      const context = { library: lib };
      const result = renderMoldDetail(gridMold, context);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe('view-mold:test.cw-1000');
      expect(result.actions[0].label).toBe(`View related mold: ${countMold.displayName}`);
      expect(result.actions[0].description).toBe('Navigate to test.cw-1000');
    });
  });
});
