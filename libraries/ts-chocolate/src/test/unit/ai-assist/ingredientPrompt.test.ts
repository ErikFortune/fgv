// Copyright (c) 2024 Erik Fortune
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

import { buildIngredientAiPrompt } from '../../../packlets/ai-assist';
import { Model } from '../../../packlets/common';

describe('buildIngredientAiPrompt', () => {
  describe('baseId generation', () => {
    test('converts simple name to kebab-case', () => {
      const prompt = buildIngredientAiPrompt('Cocoa Butter');
      expect(prompt.combined).toContain('"cocoa-butter"');
    });

    test('strips leading and trailing hyphens', () => {
      const prompt = buildIngredientAiPrompt('--Test Ingredient--');
      expect(prompt.combined).toContain('"test-ingredient"');
    });

    test('collapses non-alphanumeric characters into single hyphens', () => {
      const prompt = buildIngredientAiPrompt('Valrhona Guanaja 70%');
      expect(prompt.combined).toContain('"valrhona-guanaja-70"');
    });

    test('handles single-word name', () => {
      const prompt = buildIngredientAiPrompt('Sugar');
      expect(prompt.combined).toContain('"sugar"');
    });
  });

  describe('prompt content', () => {
    const prompt = buildIngredientAiPrompt('Test Chocolate');

    test('includes the ingredient name in the prompt', () => {
      expect(prompt.combined).toContain('Test Chocolate');
    });

    test('includes all ingredient categories', () => {
      for (const category of Model.Enums.allIngredientCategories) {
        expect(prompt.combined).toContain(`"${category}"`);
      }
    });

    test('includes all allergens', () => {
      for (const allergen of Model.Enums.allAllergens) {
        expect(prompt.combined).toContain(`"${allergen}"`);
      }
    });

    test('includes all certifications', () => {
      for (const cert of Model.Enums.allCertifications) {
        expect(prompt.combined).toContain(`"${cert}"`);
      }
    });

    test('includes all ingredient phases', () => {
      for (const phase of Model.Enums.allIngredientPhases) {
        expect(prompt.combined).toContain(`"${phase}"`);
      }
    });

    test('includes all measurement units', () => {
      for (const unit of Model.Enums.allMeasurementUnits) {
        expect(prompt.combined).toContain(`"${unit}"`);
      }
    });

    test('includes all chocolate types', () => {
      for (const type of Model.Enums.allChocolateTypes) {
        expect(prompt.combined).toContain(`"${type}"`);
      }
    });

    test('includes all fluidity stars values', () => {
      for (const stars of Model.Enums.allFluidityStars) {
        expect(prompt.combined).toContain(`${stars}`);
      }
    });

    test('includes all cacao varieties', () => {
      for (const variety of Model.Enums.allCacaoVarieties) {
        expect(prompt.combined).toContain(`"${variety}"`);
      }
    });

    test('includes all chocolate applications', () => {
      for (const app of Model.Enums.allChocolateApplications) {
        expect(prompt.combined).toContain(`"${app}"`);
      }
    });

    test('includes ganacheCharacteristics fields', () => {
      expect(prompt.combined).toContain('cacaoFat');
      expect(prompt.combined).toContain('sugar');
      expect(prompt.combined).toContain('milkFat');
      expect(prompt.combined).toContain('water');
      expect(prompt.combined).toContain('solids');
      expect(prompt.combined).toContain('otherFats');
    });

    test('includes category-specific sections', () => {
      expect(prompt.combined).toContain('category is "chocolate"');
      expect(prompt.combined).toContain('category is "sugar"');
      expect(prompt.combined).toContain('category is "dairy"');
      expect(prompt.combined).toContain('category is "fat"');
      expect(prompt.combined).toContain('category is "alcohol"');
    });

    test('includes notes instruction', () => {
      expect(prompt.combined).toContain('"notes"');
      expect(prompt.combined).toContain('assumptions');
    });

    test('instructs to return only JSON', () => {
      expect(prompt.combined).toContain('Return ONLY valid JSON');
      expect(prompt.combined).toContain('no markdown');
      expect(prompt.combined).toContain('no code fences');
    });
  });
});
