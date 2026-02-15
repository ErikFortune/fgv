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
      expect(prompt).toContain('"cocoa-butter"');
    });

    test('strips leading and trailing hyphens', () => {
      const prompt = buildIngredientAiPrompt('--Test Ingredient--');
      expect(prompt).toContain('"test-ingredient"');
    });

    test('collapses non-alphanumeric characters into single hyphens', () => {
      const prompt = buildIngredientAiPrompt('Valrhona Guanaja 70%');
      expect(prompt).toContain('"valrhona-guanaja-70"');
    });

    test('handles single-word name', () => {
      const prompt = buildIngredientAiPrompt('Sugar');
      expect(prompt).toContain('"sugar"');
    });
  });

  describe('prompt content', () => {
    const prompt = buildIngredientAiPrompt('Test Chocolate');

    test('includes the ingredient name in the prompt', () => {
      expect(prompt).toContain('Test Chocolate');
    });

    test('includes all ingredient categories', () => {
      for (const category of Model.Enums.allIngredientCategories) {
        expect(prompt).toContain(`"${category}"`);
      }
    });

    test('includes all allergens', () => {
      for (const allergen of Model.Enums.allAllergens) {
        expect(prompt).toContain(`"${allergen}"`);
      }
    });

    test('includes all certifications', () => {
      for (const cert of Model.Enums.allCertifications) {
        expect(prompt).toContain(`"${cert}"`);
      }
    });

    test('includes all ingredient phases', () => {
      for (const phase of Model.Enums.allIngredientPhases) {
        expect(prompt).toContain(`"${phase}"`);
      }
    });

    test('includes all measurement units', () => {
      for (const unit of Model.Enums.allMeasurementUnits) {
        expect(prompt).toContain(`"${unit}"`);
      }
    });

    test('includes all chocolate types', () => {
      for (const type of Model.Enums.allChocolateTypes) {
        expect(prompt).toContain(`"${type}"`);
      }
    });

    test('includes all fluidity stars values', () => {
      for (const stars of Model.Enums.allFluidityStars) {
        expect(prompt).toContain(`${stars}`);
      }
    });

    test('includes all cacao varieties', () => {
      for (const variety of Model.Enums.allCacaoVarieties) {
        expect(prompt).toContain(`"${variety}"`);
      }
    });

    test('includes all chocolate applications', () => {
      for (const app of Model.Enums.allChocolateApplications) {
        expect(prompt).toContain(`"${app}"`);
      }
    });

    test('includes ganacheCharacteristics fields', () => {
      expect(prompt).toContain('cacaoFat');
      expect(prompt).toContain('sugar');
      expect(prompt).toContain('milkFat');
      expect(prompt).toContain('water');
      expect(prompt).toContain('solids');
      expect(prompt).toContain('otherFats');
    });

    test('includes category-specific sections', () => {
      expect(prompt).toContain('category is "chocolate"');
      expect(prompt).toContain('category is "sugar"');
      expect(prompt).toContain('category is "dairy"');
      expect(prompt).toContain('category is "fat"');
      expect(prompt).toContain('category is "alcohol"');
    });

    test('includes notes instruction', () => {
      expect(prompt).toContain('"notes"');
      expect(prompt).toContain('assumptions');
    });

    test('instructs to return only JSON', () => {
      expect(prompt).toContain('Return ONLY valid JSON');
      expect(prompt).toContain('no markdown');
      expect(prompt).toContain('no code fences');
    });
  });
});
