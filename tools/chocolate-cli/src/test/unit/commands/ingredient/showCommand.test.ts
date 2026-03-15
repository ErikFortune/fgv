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
import { Entities, IngredientId } from '@fgv/ts-chocolate';

import { formatIngredientHuman } from '../../../../commands/ingredient/showCommand';

// ============================================================================
// Test Data
// ============================================================================

const defaultGanache = {
  cacaoFat: 38,
  sugar: 29,
  milkFat: 0,
  water: 1,
  solids: 32,
  otherFats: 0
};

function createChocolateIngredient(
  overrides?: Record<string, unknown>
): Entities.Ingredients.IngredientEntity {
  return {
    baseId: 'dark-70',
    name: 'Dark Chocolate 70%',
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: 70,
    ganacheCharacteristics: defaultGanache,
    ...overrides
  } as unknown as Entities.Ingredients.IngredientEntity;
}

function createOtherIngredient(overrides?: Record<string, unknown>): Entities.Ingredients.IngredientEntity {
  return {
    baseId: 'vanilla-extract',
    name: 'Vanilla Extract',
    category: 'other',
    ganacheCharacteristics: {
      cacaoFat: 0,
      sugar: 0,
      milkFat: 0,
      water: 50,
      solids: 0,
      otherFats: 0
    },
    ...overrides
  } as unknown as Entities.Ingredients.IngredientEntity;
}

// ============================================================================
// Tests
// ============================================================================

describe('formatIngredientHuman', () => {
  test('formats basic ingredient', () => {
    const ingredient = createOtherIngredient();
    const output = formatIngredientHuman(ingredient, 'coll.vanilla-extract' as IngredientId, {});
    expect(output).toContain('Ingredient: Vanilla Extract');
    expect(output).toContain('ID: coll.vanilla-extract');
    expect(output).toContain('Category: other');
  });

  test('formats ingredient with manufacturer and description', () => {
    const ingredient = createOtherIngredient({
      manufacturer: 'Test Brand',
      description: 'Pure Madagascar vanilla'
    });
    const output = formatIngredientHuman(ingredient, 'coll.vanilla-extract' as IngredientId, {});
    expect(output).toContain('Manufacturer: Test Brand');
    expect(output).toContain('Description: Pure Madagascar vanilla');
  });

  test('formats ingredient with tags', () => {
    const ingredient = createOtherIngredient({ tags: ['organic', 'fair-trade'] });
    const output = formatIngredientHuman(ingredient, 'coll.vanilla-extract' as IngredientId, {});
    expect(output).toContain('Tags: organic, fair-trade');
  });

  test('formats chocolate ingredient with details', () => {
    const ingredient = createChocolateIngredient({
      fluidityStars: 3,
      viscosityMcM: 120,
      applications: ['molding', 'enrobing'],
      origins: ['Ecuador', 'Venezuela'],
      beanVarieties: ['Criollo', 'Trinitario']
    });
    const output = formatIngredientHuman(ingredient, 'coll.dark-70' as IngredientId, {});
    expect(output).toContain('Chocolate Details:');
    expect(output).toContain('Type: dark');
    expect(output).toContain('Cacao: 70%');
    expect(output).toContain('Fluidity: 3 stars');
    expect(output).toContain('Viscosity: 120 McM');
    expect(output).toContain('Applications: molding, enrobing');
    expect(output).toContain('Origins: Ecuador, Venezuela');
    expect(output).toContain('Bean Varieties: Criollo, Trinitario');
  });

  test('formats tempering curve', () => {
    const ingredient = createChocolateIngredient({
      temperatureCurve: { melt: 50, cool: 27, working: 31 }
    });
    const output = formatIngredientHuman(ingredient, 'coll.dark-70' as IngredientId, {});
    expect(output).toContain('Tempering Curve:');
    expect(output).toContain('Melt: 50°C');
    expect(output).toContain('Cool: 27°C');
    expect(output).toContain('Working: 31°C');
  });

  test('hides tempering when ganache-only mode', () => {
    const ingredient = createChocolateIngredient({
      temperatureCurve: { melt: 50, cool: 27, working: 31 }
    });
    const output = formatIngredientHuman(ingredient, 'coll.dark-70' as IngredientId, {
      ganache: true,
      tempering: false
    });
    expect(output).not.toContain('Tempering Curve:');
  });

  test('shows tempering when tempering flag is set', () => {
    const ingredient = createChocolateIngredient({
      temperatureCurve: { melt: 50, cool: 27, working: 31 }
    });
    const output = formatIngredientHuman(ingredient, 'coll.dark-70' as IngredientId, {
      tempering: true,
      ganache: true
    });
    expect(output).toContain('Tempering Curve:');
  });

  test('formats sugar ingredient', () => {
    const ingredient = {
      baseId: 'sucrose',
      name: 'Granulated Sugar',
      category: 'sugar',
      sweetnessPotency: 1.0,
      hydrationNumber: 0,
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 100,
        milkFat: 0,
        water: 0,
        solids: 0,
        otherFats: 0
      }
    } as unknown as Entities.Ingredients.IngredientEntity;
    const output = formatIngredientHuman(ingredient, 'coll.sucrose' as IngredientId, {});
    expect(output).toContain('Sweetness Potency: 1x (vs sucrose)');
    expect(output).toContain('Hydration Number: 0');
  });

  test('formats dairy ingredient', () => {
    const ingredient = {
      baseId: 'cream',
      name: 'Heavy Cream 35%',
      category: 'dairy',
      fatContent: 35,
      waterContent: 58,
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 0,
        milkFat: 35,
        water: 58,
        solids: 7,
        otherFats: 0
      }
    } as unknown as Entities.Ingredients.IngredientEntity;
    const output = formatIngredientHuman(ingredient, 'coll.cream' as IngredientId, {});
    expect(output).toContain('Fat Content: 35%');
    expect(output).toContain('Water Content: 58%');
  });

  test('formats fat ingredient', () => {
    const ingredient = {
      baseId: 'cocoa-butter',
      name: 'Cocoa Butter',
      category: 'fat',
      meltingPoint: 34,
      ganacheCharacteristics: {
        cacaoFat: 100,
        sugar: 0,
        milkFat: 0,
        water: 0,
        solids: 0,
        otherFats: 0
      }
    } as unknown as Entities.Ingredients.IngredientEntity;
    const output = formatIngredientHuman(ingredient, 'coll.cocoa-butter' as IngredientId, {});
    expect(output).toContain('Melting Point: 34°C');
  });

  test('formats alcohol ingredient', () => {
    const ingredient = {
      baseId: 'grand-marnier',
      name: 'Grand Marnier',
      category: 'alcohol',
      alcoholByVolume: 40,
      flavorProfile: 'Orange, cognac, warm spice',
      ganacheCharacteristics: {
        cacaoFat: 0,
        sugar: 20,
        milkFat: 0,
        water: 40,
        solids: 0,
        otherFats: 0
      }
    } as unknown as Entities.Ingredients.IngredientEntity;
    const output = formatIngredientHuman(ingredient, 'coll.grand-marnier' as IngredientId, {});
    expect(output).toContain('ABV: 40%');
    expect(output).toContain('Flavor Profile: Orange, cognac, warm spice');
  });

  test('formats ganache characteristics', () => {
    const ingredient = createOtherIngredient();
    const output = formatIngredientHuman(ingredient, 'coll.vanilla-extract' as IngredientId, {});
    expect(output).toContain('Ganache Characteristics:');
    expect(output).toContain('Water:');
    expect(output).toContain('50.0%');
  });

  test('hides ganache when ganache option is false', () => {
    const ingredient = createOtherIngredient();
    const output = formatIngredientHuman(ingredient, 'coll.vanilla-extract' as IngredientId, {
      ganache: false
    });
    expect(output).not.toContain('Ganache Characteristics:');
  });

  test('formats allergens', () => {
    const ingredient = createOtherIngredient({
      allergens: ['milk', 'soy'],
      traceAllergens: ['nuts']
    });
    const output = formatIngredientHuman(ingredient, 'coll.vanilla-extract' as IngredientId, {});
    expect(output).toContain('Allergens: milk, soy');
    expect(output).toContain('Trace Allergens: nuts');
  });

  test('formats certifications and vegan', () => {
    const ingredient = createOtherIngredient({
      certifications: ['organic', 'fair-trade'],
      vegan: true
    });
    const output = formatIngredientHuman(ingredient, 'coll.vanilla-extract' as IngredientId, {});
    expect(output).toContain('Certifications: organic, fair-trade');
    expect(output).toContain('Vegan: Yes');
  });

  test('formats vegan false', () => {
    const ingredient = createOtherIngredient({ vegan: false });
    const output = formatIngredientHuman(ingredient, 'coll.vanilla-extract' as IngredientId, {});
    expect(output).toContain('Vegan: No');
  });

  test('formats density and phase', () => {
    const ingredient = createOtherIngredient({
      density: 0.95,
      phase: 'pour'
    });
    const output = formatIngredientHuman(ingredient, 'coll.vanilla-extract' as IngredientId, {});
    expect(output).toContain('Density: 0.95 g/mL');
    expect(output).toContain('Phase: pour');
  });

  test('formats URLs', () => {
    const ingredient = createOtherIngredient({
      urls: [{ url: 'https://example.com', category: 'shop' }]
    });
    const output = formatIngredientHuman(ingredient, 'coll.vanilla-extract' as IngredientId, {});
    expect(output).toContain('https://example.com');
  });
});
