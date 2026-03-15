/*
 * MIT License
 *
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Mock the shared module (which wraps @inquirer/prompts + chalk)
const mockPromptInput = jest.fn();
const mockConfirmAction = jest.fn();
const mockShowMenu = jest.fn();
jest.mock('../../../../../../commands/workspace/shared', () => ({
  promptInput: mockPromptInput,
  confirmAction: mockConfirmAction,
  showMenu: mockShowMenu,
  showInfo: jest.fn(),
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn()
}));

import '@fgv/ts-utils-jest';
import type { Entities, BaseIngredientId, Percentage } from '@fgv/ts-chocolate';
import {
  promptNewIngredient,
  promptEditIngredient
} from '../../../../../../commands/workspace/edit/prompts/ingredientPrompts';
import { createResponder } from './helpers/promptTestHelper';
import type { IMockSharedPrompts } from './helpers/promptTestHelper';

const mocks: IMockSharedPrompts = {
  promptInput: mockPromptInput,
  confirmAction: mockConfirmAction,
  showMenu: mockShowMenu
};

/**
 * Helper to set standard ganache characteristic responses.
 */
function withGanache(
  responder: ReturnType<typeof createResponder>,
  values: {
    cacaoFat: string;
    sugar: string;
    milkFat: string;
    water: string;
    solids: string;
    otherFats: string;
  }
): ReturnType<typeof createResponder> {
  return responder
    .onInput(/^Cacao fat percentage/i, values.cacaoFat)
    .onInput(/^Sugar percentage/i, values.sugar)
    .onInput(/^Milk fat percentage/i, values.milkFat)
    .onInput(/^Water percentage/i, values.water)
    .onInput(/^Solids percentage/i, values.solids)
    .onInput(/^Other fats percentage/i, values.otherFats);
}

describe('ingredientPrompts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('promptNewIngredient', () => {
    describe('with valid inputs', () => {
      test('should create chocolate ingredient with all required fields', async () => {
        const responder = createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate 70%')
          .onInput(/^Base ID/i, 'dark-choc-70')
          .onInput(/^Description/i, 'Premium dark chocolate')
          .onInput(/^Manufacturer/i, 'Valrhona')
          .onInput(/^Cacao percentage/i, '70')
          .onMenu(/^Select ingredient category/i, 'chocolate')
          .onMenu(/^Select chocolate type/i, 'dark');
        withGanache(responder, {
          cacaoFat: '35',
          sugar: '28',
          milkFat: '0',
          water: '2',
          solids: '35',
          otherFats: '0'
        }).install(mocks);

        expect(await promptNewIngredient()).toSucceedAndSatisfy((entity) => {
          expect(entity.name).toBe('Dark Chocolate 70%');
          expect(entity.baseId).toBe('dark-choc-70');
          expect(entity.description).toBe('Premium dark chocolate');
          expect(entity.manufacturer).toBe('Valrhona');
          expect(entity.category).toBe('chocolate');
          expect(entity.ganacheCharacteristics).toEqual({
            cacaoFat: 35,
            sugar: 28,
            milkFat: 0,
            water: 2,
            solids: 35,
            otherFats: 0
          });

          const chocolateEntity = entity as Entities.Ingredients.IChocolateIngredientEntity;
          expect(chocolateEntity.chocolateType).toBe('dark');
          expect(chocolateEntity.cacaoPercentage).toBe(70);
        });
      });

      test('should create dairy ingredient with optional fatContent', async () => {
        const responder = createResponder()
          .onInput(/^Ingredient name/i, 'Heavy Cream')
          .onInput(/^Base ID/i, 'heavy-cream')
          .onInput(/^Description/i, 'Rich dairy cream')
          .onInput(/^Manufacturer/i, 'Local Farm')
          .onInput(/^Fat content/i, '36')
          .onMenu(/^Select ingredient category/i, 'dairy');
        withGanache(responder, {
          cacaoFat: '0',
          sugar: '3',
          milkFat: '36',
          water: '58',
          solids: '3',
          otherFats: '0'
        }).install(mocks);

        expect(await promptNewIngredient()).toSucceedAndSatisfy((entity) => {
          expect(entity.name).toBe('Heavy Cream');
          expect(entity.category).toBe('dairy');

          const dairyEntity = entity as Entities.Ingredients.IDairyIngredientEntity;
          expect(dairyEntity.fatContent).toBe(36);
        });
      });

      test('should create sugar ingredient without category-specific fields', async () => {
        const responder = createResponder()
          .onInput(/^Ingredient name/i, 'Cane Sugar')
          .onInput(/^Base ID/i, 'cane-sugar')
          .onInput(/^Description/i, 'Organic cane sugar')
          .onInput(/^Manufacturer/i, '')
          .onMenu(/^Select ingredient category/i, 'sugar');
        withGanache(responder, {
          cacaoFat: '0',
          sugar: '100',
          milkFat: '0',
          water: '0',
          solids: '0',
          otherFats: '0'
        }).install(mocks);

        expect(await promptNewIngredient()).toSucceedAndSatisfy((entity) => {
          expect(entity.name).toBe('Cane Sugar');
          expect(entity.category).toBe('sugar');
          expect(entity.manufacturer).toBeUndefined();
          expect(entity.ganacheCharacteristics.sugar).toBe(100);
        });
      });

      test('should create fat ingredient with optional meltingPoint', async () => {
        const responder = createResponder()
          .onInput(/^Ingredient name/i, 'Cocoa Butter')
          .onInput(/^Base ID/i, 'cocoa-butter')
          .onInput(/^Description/i, 'Pure cocoa butter')
          .onInput(/^Manufacturer/i, 'Cacao Barry')
          .onInput(/^Melting point/i, '34')
          .onMenu(/^Select ingredient category/i, 'fat');
        withGanache(responder, {
          cacaoFat: '0',
          sugar: '0',
          milkFat: '0',
          water: '0',
          solids: '0',
          otherFats: '100'
        }).install(mocks);

        expect(await promptNewIngredient()).toSucceedAndSatisfy((entity) => {
          expect(entity.name).toBe('Cocoa Butter');
          expect(entity.category).toBe('fat');

          const fatEntity = entity as Entities.Ingredients.IFatIngredientEntity;
          expect(fatEntity.meltingPoint).toBe(34);
        });
      });

      test('should create alcohol ingredient with optional alcoholByVolume', async () => {
        const responder = createResponder()
          .onInput(/^Ingredient name/i, 'Cognac')
          .onInput(/^Base ID/i, 'cognac')
          .onInput(/^Description/i, 'Fine cognac')
          .onInput(/^Manufacturer/i, 'Hennessy')
          .onInput(/^Alcohol by volume/i, '40')
          .onMenu(/^Select ingredient category/i, 'alcohol');
        withGanache(responder, {
          cacaoFat: '0',
          sugar: '0',
          milkFat: '0',
          water: '60',
          solids: '0',
          otherFats: '0'
        }).install(mocks);

        expect(await promptNewIngredient()).toSucceedAndSatisfy((entity) => {
          expect(entity.name).toBe('Cognac');
          expect(entity.category).toBe('alcohol');

          const alcoholEntity = entity as Entities.Ingredients.IAlcoholIngredientEntity;
          expect(alcoholEntity.alcoholByVolume).toBe(40);
        });
      });

      test('should auto-generate baseId from name when not provided', async () => {
        const responder = createResponder()
          .onInput(/^Ingredient name/i, 'Milk Chocolate')
          .onInput(/^Base ID/i, '')
          .onInput(/^Description/i, '')
          .onInput(/^Manufacturer/i, '')
          .onInput(/^Cacao percentage/i, '33')
          .onMenu(/^Select ingredient category/i, 'chocolate')
          .onMenu(/^Select chocolate type/i, 'milk');
        withGanache(responder, {
          cacaoFat: '20',
          sugar: '45',
          milkFat: '20',
          water: '5',
          solids: '10',
          otherFats: '0'
        }).install(mocks);

        expect(await promptNewIngredient()).toSucceedAndSatisfy((entity) => {
          expect(entity.baseId).toBe('milk-chocolate');
        });
      });
    });

    describe('with invalid inputs', () => {
      test('should return failure for empty name', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, '')
          .install(mocks);

        expect(await promptNewIngredient()).toFailWith(/name.*required/i);
      });

      test('should return failure for invalid explicit baseId', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, 'Valid Name')
          .onInput(/^Base ID/i, 'invalid.with.dots')
          .install(mocks);

        expect(await promptNewIngredient()).toFailWith(/invalid base id/i);
      });

      test('should return failure for cancelled category selection', async () => {
        const responder = createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate')
          .onInput(/^Base ID/i, 'dark-choc')
          .onInput(/^Description/i, '')
          .onInput(/^Manufacturer/i, '')
          .onMenuBack(/^Select ingredient category/i);
        withGanache(responder, {
          cacaoFat: '35',
          sugar: '28',
          milkFat: '0',
          water: '2',
          solids: '35',
          otherFats: '0'
        }).install(mocks);

        expect(await promptNewIngredient()).toFailWith(/cancelled/i);
      });

      test('should return failure for empty ganache cacaoFat percentage', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate')
          .onInput(/^Base ID/i, 'dark-choc')
          .onInput(/^Description/i, '')
          .onInput(/^Manufacturer/i, '')
          .onInput(/^Cacao fat percentage/i, '')
          .onMenu(/^Select ingredient category/i, 'chocolate')
          .install(mocks);

        expect(await promptNewIngredient()).toFailWith(/cacao.*fat.*required/i);
      });

      test('should return failure for out-of-range ganache percentage above 100', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate')
          .onInput(/^Base ID/i, 'dark-choc')
          .onInput(/^Description/i, '')
          .onInput(/^Manufacturer/i, '')
          .onInput(/^Cacao fat percentage/i, '150')
          .onMenu(/^Select ingredient category/i, 'chocolate')
          .install(mocks);

        expect(await promptNewIngredient()).toFailWith(/percentage.*between.*0.*100/i);
      });

      test('should return failure for out-of-range ganache percentage below 0', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate')
          .onInput(/^Base ID/i, 'dark-choc')
          .onInput(/^Description/i, '')
          .onInput(/^Manufacturer/i, '')
          .onInput(/^Cacao fat percentage/i, '-5')
          .onMenu(/^Select ingredient category/i, 'chocolate')
          .install(mocks);

        expect(await promptNewIngredient()).toFailWith(/percentage.*between.*0.*100/i);
      });

      test('should return failure for NaN ganache percentage', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate')
          .onInput(/^Base ID/i, 'dark-choc')
          .onInput(/^Description/i, '')
          .onInput(/^Manufacturer/i, '')
          .onInput(/^Cacao fat percentage/i, 'not-a-number')
          .onMenu(/^Select ingredient category/i, 'chocolate')
          .install(mocks);

        expect(await promptNewIngredient()).toFailWith(/percentage.*between.*0.*100/i);
      });

      test('should return failure for empty cacaoPercentage on chocolate type', async () => {
        const responder = createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate')
          .onInput(/^Base ID/i, 'dark-choc')
          .onInput(/^Description/i, '')
          .onInput(/^Manufacturer/i, '')
          .onInput(/^Cacao percentage/i, '')
          .onMenu(/^Select ingredient category/i, 'chocolate')
          .onMenu(/^Select chocolate type/i, 'dark');
        withGanache(responder, {
          cacaoFat: '35',
          sugar: '28',
          milkFat: '0',
          water: '2',
          solids: '35',
          otherFats: '0'
        }).install(mocks);

        expect(await promptNewIngredient()).toFailWith(/cacao.*percentage.*required/i);
      });

      test('should return failure for cancelled chocolate type selection', async () => {
        const responder = createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate')
          .onInput(/^Base ID/i, 'dark-choc')
          .onInput(/^Description/i, '')
          .onInput(/^Manufacturer/i, '')
          .onMenuBack(/^Select chocolate type/i)
          .onMenu(/^Select ingredient category/i, 'chocolate');
        withGanache(responder, {
          cacaoFat: '35',
          sugar: '28',
          milkFat: '0',
          water: '2',
          solids: '35',
          otherFats: '0'
        }).install(mocks);

        expect(await promptNewIngredient()).toFailWith(/cancelled/i);
      });
    });
  });

  describe('promptEditIngredient', () => {
    const existingIngredient: Entities.Ingredients.IChocolateIngredientEntity = {
      baseId: 'dark-70' as unknown as BaseIngredientId,
      name: 'Dark Chocolate 70%',
      description: 'Premium dark chocolate',
      manufacturer: 'Valrhona',
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: 70 as unknown as Percentage,
      ganacheCharacteristics: {
        cacaoFat: 35 as unknown as Percentage,
        sugar: 28 as unknown as Percentage,
        milkFat: 0 as unknown as Percentage,
        water: 2 as unknown as Percentage,
        solids: 35 as unknown as Percentage,
        otherFats: 0 as unknown as Percentage
      },
      allergens: ['nuts'],
      traceAllergens: ['milk'],
      certifications: ['organic'],
      vegan: false,
      tags: ['premium'],
      density: 1.2,
      phase: 'solid'
    };

    describe('with valid edits', () => {
      test('should edit ingredient name and description without changing other fields', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate 75%')
          .onInput(/^Description/i, 'Updated description')
          .onInput(/^Manufacturer/i, 'Valrhona')
          .onConfirm(/^Edit ganache/i, false)
          .onConfirm(/^Edit category-specific/i, false)
          .install(mocks);

        expect(await promptEditIngredient(existingIngredient)).toSucceedAndSatisfy((entity) => {
          expect(entity.name).toBe('Dark Chocolate 75%');
          expect(entity.description).toBe('Updated description');
          expect(entity.baseId).toBe('dark-70');
          expect(entity.manufacturer).toBe('Valrhona');
          expect(entity.category).toBe('chocolate');
          expect(entity.ganacheCharacteristics).toEqual(existingIngredient.ganacheCharacteristics);

          const chocolateEntity = entity as Entities.Ingredients.IChocolateIngredientEntity;
          expect(chocolateEntity.chocolateType).toBe('dark');
          expect(chocolateEntity.cacaoPercentage).toBe(70);
        });
      });

      test('should preserve allergens, certifications, and other metadata', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate 70%')
          .onInput(/^Description/i, 'Premium dark chocolate')
          .onInput(/^Manufacturer/i, 'Valrhona')
          .onConfirm(/^Edit ganache/i, false)
          .onConfirm(/^Edit category-specific/i, false)
          .install(mocks);

        expect(await promptEditIngredient(existingIngredient)).toSucceedAndSatisfy((entity) => {
          expect(entity.allergens).toEqual(['nuts']);
          expect(entity.traceAllergens).toEqual(['milk']);
          expect(entity.certifications).toEqual(['organic']);
          expect(entity.vegan).toBe(false);
          expect(entity.tags).toEqual(['premium']);
          expect(entity.density).toBe(1.2);
          expect(entity.phase).toBe('solid');
        });
      });

      test('should edit ganache characteristics when confirmed', async () => {
        const responder = createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate 70%')
          .onInput(/^Description/i, 'Premium dark chocolate')
          .onInput(/^Manufacturer/i, 'Valrhona')
          .onConfirm(/^Edit ganache/i, true)
          .onConfirm(/^Edit category-specific/i, false);
        withGanache(responder, {
          cacaoFat: '40',
          sugar: '25',
          milkFat: '0',
          water: '2',
          solids: '33',
          otherFats: '0'
        }).install(mocks);

        expect(await promptEditIngredient(existingIngredient)).toSucceedAndSatisfy((entity) => {
          expect(entity.ganacheCharacteristics).toEqual({
            cacaoFat: 40,
            sugar: 25,
            milkFat: 0,
            water: 2,
            solids: 33,
            otherFats: 0
          });
        });
      });

      test('should edit category-specific fields when confirmed for chocolate', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate 70%')
          .onInput(/^Description/i, 'Premium dark chocolate')
          .onInput(/^Manufacturer/i, 'Valrhona')
          .onInput(/^Cacao percentage/i, '75')
          .onConfirm(/^Edit ganache/i, false)
          .onConfirm(/^Edit category-specific/i, true)
          .onMenu(/^Select chocolate type/i, 'milk')
          .install(mocks);

        expect(await promptEditIngredient(existingIngredient)).toSucceedAndSatisfy((entity) => {
          const chocolateEntity = entity as Entities.Ingredients.IChocolateIngredientEntity;
          expect(chocolateEntity.chocolateType).toBe('milk');
          expect(chocolateEntity.cacaoPercentage).toBe(75);
        });
      });

      test('should preserve category-specific fields when not editing', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate 70%')
          .onInput(/^Description/i, 'Premium dark chocolate')
          .onInput(/^Manufacturer/i, 'Valrhona')
          .onConfirm(/^Edit ganache/i, false)
          .onConfirm(/^Edit category-specific/i, false)
          .install(mocks);

        expect(await promptEditIngredient(existingIngredient)).toSucceedAndSatisfy((entity) => {
          const chocolateEntity = entity as Entities.Ingredients.IChocolateIngredientEntity;
          expect(chocolateEntity.chocolateType).toBe('dark');
          expect(chocolateEntity.cacaoPercentage).toBe(70);
        });
      });

      test('should handle editing dairy ingredient with fatContent', async () => {
        const dairyIngredient: Entities.Ingredients.IDairyIngredientEntity = {
          baseId: 'heavy-cream' as unknown as BaseIngredientId,
          name: 'Heavy Cream',
          description: 'Rich cream',
          manufacturer: 'Local Farm',
          category: 'dairy',
          fatContent: 36 as unknown as Percentage,
          ganacheCharacteristics: {
            cacaoFat: 0 as unknown as Percentage,
            sugar: 3 as unknown as Percentage,
            milkFat: 36 as unknown as Percentage,
            water: 58 as unknown as Percentage,
            solids: 3 as unknown as Percentage,
            otherFats: 0 as unknown as Percentage
          }
        };

        createResponder()
          .onInput(/^Ingredient name/i, 'Heavy Cream')
          .onInput(/^Description/i, 'Rich cream')
          .onInput(/^Manufacturer/i, 'Local Farm')
          .onInput(/^Fat content/i, '38')
          .onConfirm(/^Edit ganache/i, false)
          .onConfirm(/^Edit category-specific/i, true)
          .install(mocks);

        expect(await promptEditIngredient(dairyIngredient)).toSucceedAndSatisfy((entity) => {
          const dairyEntity = entity as Entities.Ingredients.IDairyIngredientEntity;
          expect(dairyEntity.fatContent).toBe(38);
        });
      });

      test('should handle editing sugar ingredient without category-specific fields', async () => {
        const sugarIngredient: Entities.Ingredients.ISugarIngredientEntity = {
          baseId: 'cane-sugar' as unknown as BaseIngredientId,
          name: 'Cane Sugar',
          description: 'Organic sugar',
          category: 'sugar',
          ganacheCharacteristics: {
            cacaoFat: 0 as unknown as Percentage,
            sugar: 100 as unknown as Percentage,
            milkFat: 0 as unknown as Percentage,
            water: 0 as unknown as Percentage,
            solids: 0 as unknown as Percentage,
            otherFats: 0 as unknown as Percentage
          }
        };

        createResponder()
          .onInput(/^Ingredient name/i, 'Organic Cane Sugar')
          .onInput(/^Description/i, 'Organic sugar')
          .onInput(/^Manufacturer/i, '')
          .onConfirm(/^Edit ganache/i, false)
          .onConfirm(/^Edit category-specific/i, false)
          .install(mocks);

        expect(await promptEditIngredient(sugarIngredient)).toSucceedAndSatisfy((entity) => {
          expect(entity.name).toBe('Organic Cane Sugar');
          expect(entity.category).toBe('sugar');
        });
      });
    });

    describe('with invalid inputs', () => {
      test('should return failure for empty name', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, '')
          .install(mocks);

        expect(await promptEditIngredient(existingIngredient)).toFailWith(/name.*required/i);
      });

      test('should return failure for invalid ganache percentage during edit', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate 70%')
          .onInput(/^Description/i, 'Premium dark chocolate')
          .onInput(/^Manufacturer/i, 'Valrhona')
          .onInput(/^Cacao fat percentage/i, '150')
          .onConfirm(/^Edit ganache/i, true)
          .install(mocks);

        expect(await promptEditIngredient(existingIngredient)).toFailWith(/percentage.*between.*0.*100/i);
      });

      test('should return failure for cancelled chocolate type selection during edit', async () => {
        createResponder()
          .onInput(/^Ingredient name/i, 'Dark Chocolate 70%')
          .onInput(/^Description/i, 'Premium dark chocolate')
          .onInput(/^Manufacturer/i, 'Valrhona')
          .onConfirm(/^Edit ganache/i, false)
          .onConfirm(/^Edit category-specific/i, true)
          .onMenuBack(/^Select chocolate type/i)
          .install(mocks);

        expect(await promptEditIngredient(existingIngredient)).toFailWith(/cancelled/i);
      });
    });
  });
});
