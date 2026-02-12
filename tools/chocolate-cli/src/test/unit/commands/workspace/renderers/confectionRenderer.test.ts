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

import { ConfectionId } from '@fgv/ts-chocolate';

import {
  renderConfectionSummary,
  renderConfectionDetail
} from '../../../../../commands/workspace/renderers/confectionRenderer';
import { createTestLibrary } from './helpers/testLibrary';

describe('confectionRenderer', () => {
  const lib = createTestLibrary();

  // ============================================================================
  // renderConfectionSummary
  // ============================================================================

  describe('renderConfectionSummary', () => {
    test('formats molded bonbon', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const summary = renderConfectionSummary(bonbon);

      expect(summary).toContain('test.test-bonbon');
      expect(summary).toContain('Test BonBon');
      expect(summary).toContain('[molded-bonbon]');
    });

    test('formats bar truffle', () => {
      const barTruffle = lib.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();

      const summary = renderConfectionSummary(barTruffle);

      expect(summary).toContain('test.test-bar-truffle');
      expect(summary).toContain('Test Bar Truffle');
      expect(summary).toContain('[bar-truffle]');
    });

    test('formats rolled truffle', () => {
      const rolledTruffle = lib.confections.get('test.test-rolled-truffle' as ConfectionId).orThrow();

      const summary = renderConfectionSummary(rolledTruffle);

      expect(summary).toContain('test.test-rolled-truffle');
      expect(summary).toContain('Test Rolled Truffle');
      expect(summary).toContain('[rolled-truffle]');
    });
  });

  // ============================================================================
  // renderConfectionDetail - MoldedBonBon
  // ============================================================================

  describe('renderConfectionDetail - MoldedBonBon', () => {
    test('renders basic fields', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      expect(result.text).toContain('Confection: Test BonBon');
      expect(result.text).toContain('ID: test.test-bonbon');
      expect(result.text).toContain('Type: molded-bonbon');
      expect(result.text).toContain('Description: A test molded bonbon');
      expect(result.text).toContain('Tags: bonbon, test');
    });

    test('renders yield with weight per piece', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      expect(result.text).toContain('Yield: 24 pieces');
      expect(result.text).toContain('Weight per piece: 12g');
    });

    test('renders molds with preferred and notes', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      expect(result.text).toContain('Molds:');
      expect(result.text).toContain('test.cw-2227');
      expect(result.text).toContain('(preferred)');
      expect(result.text).toContain('Primary mold');
    });

    test('renders shell chocolate', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      expect(result.text).toContain('Shell Chocolate:');
      expect(result.text).toContain('Test Dark Chocolate 70%');
      expect(result.text).toContain('test.dark-choc-70');
    });

    test('renders additional chocolates with purpose', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      expect(result.text).toContain('seal Chocolate:');
      expect(result.text).toContain('Test Dark Chocolate 70%');
      expect(result.text).toContain('test.dark-choc-70');
    });

    test('renders fillings with type and preferred', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      expect(result.text).toContain('Fillings:');
      expect(result.text).toContain('Center Filling:');
      expect(result.text).toContain('test.dark-ganache');
      expect(result.text).toContain('[recipe]');
      expect(result.text).toContain('(preferred)');
      expect(result.text).toContain('Main filling');
    });

    test('renders decorations with preferred', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      expect(result.text).toContain('Decorations:');
      expect(result.text).toContain('Gold leaf (preferred)');
      expect(result.text).toContain('Cocoa powder');
    });

    test('renders procedures with preferred and notes', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      expect(result.text).toContain('Procedures:');
      expect(result.text).toContain('Basic Ganache');
      expect(result.text).toContain('test.ganache-basic');
      expect(result.text).toContain('(preferred)');
      expect(result.text).toContain('Standard process');
    });

    test('renders URLs', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      expect(result.text).toContain('https://example.com/bonbon');
    });

    test('creates mold action', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      const moldAction = result.actions.find((a) => a.key === 'view-mold:test.cw-2227');
      expect(moldAction).toBeDefined();
      expect(moldAction?.label).toContain('View mold:');
      expect(moldAction?.description).toContain('Navigate to mold test.cw-2227');
    });

    test('creates shell chocolate action', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      const chocolateAction = result.actions.find((a) => a.key === 'view-ingredient:test.dark-choc-70');
      expect(chocolateAction).toBeDefined();
      expect(chocolateAction?.label).toContain('View chocolate:');
      expect(chocolateAction?.description).toContain('Navigate to test.dark-choc-70');
    });

    test('creates filling action for recipe type', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      const fillingAction = result.actions.find((a) => a.key === 'view-filling:test.dark-ganache');
      expect(fillingAction).toBeDefined();
      expect(fillingAction?.label).toContain('View filling:');
      expect(fillingAction?.description).toContain('Navigate to filling test.dark-ganache');
    });

    test('renders other variations section', () => {
      const bonbon = lib.confections.get('test.test-bonbon' as ConfectionId).orThrow();

      const result = renderConfectionDetail(bonbon);

      expect(result.text).toContain('Other variations (1):');
      expect(result.text).toContain('2026-02-01-01');
      expect(result.text).toContain('2026-02-01');
    });
  });

  // ============================================================================
  // renderConfectionDetail - BarTruffle
  // ============================================================================

  describe('renderConfectionDetail - BarTruffle', () => {
    test('renders frame dimensions', () => {
      const barTruffle = lib.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();

      const result = renderConfectionDetail(barTruffle);

      expect(result.text).toContain('Frame Dimensions:');
      expect(result.text).toContain('250 x 20 x 300 mm');
    });

    test('renders bonbon dimensions', () => {
      const barTruffle = lib.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();

      const result = renderConfectionDetail(barTruffle);

      expect(result.text).toContain('BonBon Dimensions:');
      expect(result.text).toContain('25 x 20 mm');
    });

    test('renders enrobing chocolate', () => {
      const barTruffle = lib.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();

      const result = renderConfectionDetail(barTruffle);

      expect(result.text).toContain('Enrobing Chocolate:');
      expect(result.text).toContain('Test Dark Chocolate 70%');
      expect(result.text).toContain('test.dark-choc-70');
    });

    test('renders yield without unit (defaults to pieces)', () => {
      const barTruffle = lib.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();

      const result = renderConfectionDetail(barTruffle);

      expect(result.text).toContain('Yield: 30 pieces');
    });

    test('no weightPerPiece shown', () => {
      const barTruffle = lib.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();

      const result = renderConfectionDetail(barTruffle);

      expect(result.text).not.toContain('Weight per piece:');
    });

    test('creates enrobing chocolate action', () => {
      const barTruffle = lib.confections.get('test.test-bar-truffle' as ConfectionId).orThrow();

      const result = renderConfectionDetail(barTruffle);

      const chocolateAction = result.actions.find((a) => a.key === 'view-ingredient:test.dark-choc-70');
      expect(chocolateAction).toBeDefined();
      expect(chocolateAction?.label).toContain('View chocolate:');
    });
  });

  // ============================================================================
  // renderConfectionDetail - RolledTruffle
  // ============================================================================

  describe('renderConfectionDetail - RolledTruffle', () => {
    test('renders enrobing chocolate', () => {
      const rolledTruffle = lib.confections.get('test.test-rolled-truffle' as ConfectionId).orThrow();

      const result = renderConfectionDetail(rolledTruffle);

      expect(result.text).toContain('Enrobing Chocolate:');
      expect(result.text).toContain('Test Dark Chocolate 70%');
      expect(result.text).toContain('test.dark-choc-70');
    });

    test('renders coatings with preferred', () => {
      const rolledTruffle = lib.confections.get('test.test-rolled-truffle' as ConfectionId).orThrow();

      const result = renderConfectionDetail(rolledTruffle);

      expect(result.text).toContain('Coatings:');
      expect(result.text).toContain('Cocoa Butter');
      expect(result.text).toContain('test.cocoa-butter');
      expect(result.text).toContain('(preferred)');
      expect(result.text).toContain('White Sugar');
      expect(result.text).toContain('test.white-sugar');
    });

    test('renders yield with custom unit', () => {
      const rolledTruffle = lib.confections.get('test.test-rolled-truffle' as ConfectionId).orThrow();

      const result = renderConfectionDetail(rolledTruffle);

      expect(result.text).toContain('Yield: 20 truffles');
    });
  });
});
