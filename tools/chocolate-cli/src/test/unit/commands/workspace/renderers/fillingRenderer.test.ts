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

import { FillingId } from '@fgv/ts-chocolate';

import {
  renderFillingSummary,
  renderFillingDetail
} from '../../../../../commands/workspace/renderers/fillingRenderer';
import { createTestLibrary } from './helpers/testLibrary';

describe('fillingRenderer', () => {
  const lib = createTestLibrary();

  // ============================================================================
  // renderFillingSummary
  // ============================================================================

  describe('renderFillingSummary', () => {
    test('formats filling with multiple variations', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();

      const summary = renderFillingSummary(filling);

      expect(summary).toContain('test.dark-ganache');
      expect(summary).toContain('Dark Ganache');
      expect(summary).toContain('ganache');
      expect(summary).toContain('2 variations');
    });
  });

  // ============================================================================
  // renderFillingDetail
  // ============================================================================

  describe('renderFillingDetail', () => {
    test('renders basic fields for golden variation', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      expect(result.text).toContain('Filling: Dark Ganache');
      expect(result.text).toContain('ID: test.dark-ganache');
      expect(result.text).toContain('Category: ganache');
      expect(result.text).toContain('Description: Rich dark chocolate ganache');
      expect(result.text).toContain('Tags: dark, ganache');
    });

    test('renders variation as golden', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      expect(result.text).toContain('Variation: 2026-01-01-01 (golden)');
      expect(result.text).toContain('Created: 2026-01-01');
      expect(result.text).toContain('Base Weight: 350g');
    });

    test('renders yield', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      expect(result.text).toContain('Yield: 50 bonbons');
    });

    test('renders notes', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      expect(result.text).toContain('Notes:');
      expect(result.text).toContain('Rich and smooth');
    });

    test('renders ingredients with percentages', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      expect(result.text).toContain('Ingredients:');
      expect(result.text).toContain('test.dark-choc-70');
      expect(result.text).toContain('200.0g');
      expect(result.text).toContain('57.1%');
      expect(result.text).toContain('test.heavy-cream');
      expect(result.text).toContain('150.0g');
      expect(result.text).toContain('42.9%');
      expect(result.text).toContain('Warm first');
    });

    test('renders ratings', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      expect(result.text).toContain('Ratings:');
      expect(result.text).toContain('taste');
      expect(result.text).toContain('5/5');
      expect(result.text).toContain('texture');
      expect(result.text).toContain('4/5');
      expect(result.text).toContain('Slightly firm');
    });

    test('renders procedures', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      expect(result.text).toContain('Procedures:');
      expect(result.text).toContain('test.ganache-basic (preferred)');
      expect(result.text).toContain('Standard method');
      expect(result.text).toContain('test.simple-mix');
    });

    test('renders URLs section', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      expect(result.text).toContain('https://example.com/ganache-video');
    });

    test('renders other variations section', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      expect(result.text).toContain('Other variations (1):');
      expect(result.text).toContain('2026-02-01-01');
      expect(result.text).toContain('2026-02-01');
    });

    test('renders ganache analysis', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      expect(result.text).toContain('Ganache Analysis:');
      expect(result.text).toContain('Total Fat:');
      expect(result.text).toContain('Fat:Water Ratio:');
      expect(result.text).toContain('Sugar:Water Ratio:');
    });

    test('includes ingredient actions', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      expect(result.actions.length).toBeGreaterThan(0);

      const darkChocAction = result.actions.find((a) => a.key === 'view-ingredient:test.dark-choc-70');
      expect(darkChocAction).toBeDefined();
      expect(darkChocAction?.label).toContain('View ingredient: test.dark-choc-70');

      const creamAction = result.actions.find((a) => a.key === 'view-ingredient:test.heavy-cream');
      expect(creamAction).toBeDefined();
      expect(creamAction?.label).toContain('View ingredient: test.heavy-cream');
    });

    test('includes variation action', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const goldenVariation = filling.variations[0];

      const result = renderFillingDetail(filling, goldenVariation);

      const variationAction = result.actions.find((a) => a.key === 'view-variation');
      expect(variationAction).toBeDefined();
      expect(variationAction?.label).toBe('View another variation');
      expect(variationAction?.description).toBe('2 variations available');
    });

    test('renders without golden marker for other variation', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const otherVariation = filling.variations[1];

      const result = renderFillingDetail(filling, otherVariation);

      expect(result.text).toContain('Variation: 2026-02-01-01');
      expect(result.text).not.toContain('2026-02-01-01 (golden)');
    });

    test('renders without ratings, procedures, notes, yield for minimal variation', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const otherVariation = filling.variations[1];

      const result = renderFillingDetail(filling, otherVariation);

      expect(result.text).not.toContain('Yield:');
      expect(result.text).not.toContain('Notes:');
      expect(result.text).not.toContain('Ratings:');
      expect(result.text).not.toContain('Procedures:');
    });

    test('shows other variations with golden marker from non-golden variation', () => {
      const filling = lib.fillings.get('test.dark-ganache' as FillingId).orThrow();
      const otherVariation = filling.variations[1];

      const result = renderFillingDetail(filling, otherVariation);

      expect(result.text).toContain('Other variations (1):');
      expect(result.text).toContain('2026-01-01-01 (golden)');
      expect(result.text).toContain('2026-01-01');
    });
  });
});
