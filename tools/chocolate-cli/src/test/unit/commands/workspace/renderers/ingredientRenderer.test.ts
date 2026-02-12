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

import { IngredientId } from '@fgv/ts-chocolate';

import {
  renderIngredientSummary,
  renderIngredientDetail
} from '../../../../../commands/workspace/renderers/ingredientRenderer';
import { createTestLibrary } from './helpers/testLibrary';

describe('ingredientRenderer', () => {
  const lib = createTestLibrary();

  // ============================================================================
  // renderIngredientSummary
  // ============================================================================

  describe('renderIngredientSummary', () => {
    test('formats chocolate ingredient with type', () => {
      const ingredient = lib.ingredients.get('test.dark-choc-70' as IngredientId).orThrow();

      const summary = renderIngredientSummary(ingredient);

      expect(summary).toContain('dark-choc-70');
      expect(summary).toContain('chocolate:dark');
    });

    test('formats non-chocolate ingredient', () => {
      const ingredient = lib.ingredients.get('test.white-sugar' as IngredientId).orThrow();

      const summary = renderIngredientSummary(ingredient);

      expect(summary).toContain('white-sugar');
      expect(summary).toContain('sugar');
      expect(summary).not.toContain('sugar:');
    });
  });

  // ============================================================================
  // renderIngredientDetail
  // ============================================================================

  describe('renderIngredientDetail', () => {
    const context = { library: lib };

    test('renders chocolate-specific detail with ALL fields', () => {
      const ingredient = lib.ingredients.get('test.dark-choc-70' as IngredientId).orThrow();

      const result = renderIngredientDetail(ingredient, context);

      expect(result.text).toContain('Ingredient: Test Dark Chocolate 70%');
      expect(result.text).toContain('ID: test.dark-choc-70');
      expect(result.text).toContain('Category: chocolate');
      expect(result.text).toContain('Manufacturer: TestCo');
      expect(result.text).toContain('Description: A test dark chocolate');
      expect(result.text).toContain('Tags: dark, test');

      expect(result.text).toContain('Chocolate Details:');
      expect(result.text).toContain('Type: dark');
      expect(result.text).toContain('Cacao: 70%');
      expect(result.text).toContain('Fluidity: 3 stars');
      expect(result.text).toContain('Viscosity: 45 McM');
      expect(result.text).toContain('Applications: molding');
      expect(result.text).toContain('Origins: Venezuela');
      expect(result.text).toContain('Bean Varieties: Criollo');

      expect(result.text).toContain('Tempering Curve:');
      expect(result.text).toContain('Melt: 50°C');
      expect(result.text).toContain('Cool: 27°C');
      expect(result.text).toContain('Working: 31°C');

      expect(result.text).toContain('Ganache Characteristics:');
      expect(result.text).toContain('Cacao Fat:');
      expect(result.text).toContain('Sugar:');
      expect(result.text).toContain('Milk Fat:');
      expect(result.text).toContain('Water:');
      expect(result.text).toContain('Solids:');
      expect(result.text).toContain('Other Fats:');

      expect(result.text).toContain('Allergens: milk');
      expect(result.text).toContain('Trace Allergens: nuts');
      expect(result.text).toContain('Certifications: organic');
      expect(result.text).toContain('Vegan: No');
      expect(result.text).toContain('https://example.com/choc');
    });

    test('renders sugar-specific detail', () => {
      const ingredient = lib.ingredients.get('test.white-sugar' as IngredientId).orThrow();

      const result = renderIngredientDetail(ingredient, context);

      expect(result.text).toContain('Ingredient: White Sugar');
      expect(result.text).toContain('ID: test.white-sugar');
      expect(result.text).toContain('Category: sugar');

      expect(result.text).not.toContain('Chocolate Details');
      expect(result.text).toContain('Sweetness Potency: 1x (vs sucrose)');
      expect(result.text).toContain('Hydration Number: 0.9');

      expect(result.text).toContain('Ganache Characteristics:');
    });

    test('renders dairy-specific detail', () => {
      const ingredient = lib.ingredients.get('test.heavy-cream' as IngredientId).orThrow();

      const result = renderIngredientDetail(ingredient, context);

      expect(result.text).toContain('Ingredient: Heavy Cream');
      expect(result.text).toContain('ID: test.heavy-cream');
      expect(result.text).toContain('Category: dairy');

      expect(result.text).toContain('Fat Content: 36%');
      expect(result.text).toContain('Water Content: 58%');

      expect(result.text).toContain('Ganache Characteristics:');
    });

    test('renders fat-specific detail', () => {
      const ingredient = lib.ingredients.get('test.cocoa-butter' as IngredientId).orThrow();

      const result = renderIngredientDetail(ingredient, context);

      expect(result.text).toContain('Ingredient: Cocoa Butter');
      expect(result.text).toContain('ID: test.cocoa-butter');
      expect(result.text).toContain('Category: fat');

      expect(result.text).toContain('Melting Point: 34°C');

      expect(result.text).toContain('Ganache Characteristics:');
    });

    test('renders alcohol-specific detail', () => {
      const ingredient = lib.ingredients.get('test.dark-rum' as IngredientId).orThrow();

      const result = renderIngredientDetail(ingredient, context);

      expect(result.text).toContain('Ingredient: Dark Rum');
      expect(result.text).toContain('ID: test.dark-rum');
      expect(result.text).toContain('Category: alcohol');

      expect(result.text).toContain('ABV: 40%');
      expect(result.text).toContain('Flavor Profile: Rich and spiced');

      expect(result.text).toContain('Ganache Characteristics:');
    });

    test('renders plain ingredient without type-specific fields', () => {
      const ingredient = lib.ingredients.get('test.vanilla-extract' as IngredientId).orThrow();

      const result = renderIngredientDetail(ingredient, context);

      expect(result.text).toContain('Ingredient: Vanilla Extract');
      expect(result.text).toContain('ID: test.vanilla-extract');
      expect(result.text).toContain('Category: flavor');

      expect(result.text).not.toContain('Chocolate Details');
      expect(result.text).not.toContain('Sweetness Potency');
      expect(result.text).not.toContain('Fat Content');
      expect(result.text).not.toContain('Melting Point');
      expect(result.text).not.toContain('ABV');

      expect(result.text).toContain('Ganache Characteristics:');
    });

    test('includes usedByFillings action when ingredient is used', () => {
      const ingredient = lib.ingredients.get('test.dark-choc-70' as IngredientId).orThrow();

      const result = renderIngredientDetail(ingredient, context);

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].key).toBe('view-fillings');
      expect(result.actions[0].label).toContain('View fillings using this ingredient');
      expect(result.actions[0].label).toContain('(1)');
      expect(result.actions[0].description).toBe('1 filling(s) use this ingredient');
    });

    test('no usedByFillings action for unused ingredient', () => {
      const ingredient = lib.ingredients.get('test.vanilla-extract' as IngredientId).orThrow();

      const result = renderIngredientDetail(ingredient, context);

      expect(result.actions).toHaveLength(0);
    });
  });
});
