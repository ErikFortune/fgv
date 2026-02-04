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

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  ganacheCharacteristics,
  temperatureCurve,
  baseIngredientEntity,
  chocolateIngredientEntity,
  sugarIngredientEntity,
  dairyIngredientEntity,
  fatIngredientEntity,
  alcoholIngredientEntity,
  ingredientEntity
} from '../../../packlets/entities/ingredients/converters';

describe('Ingredient Converters', () => {
  // ============================================================================
  // Test Data - Common
  // ============================================================================

  const validGanacheCharacteristics = {
    cacaoFat: 36,
    sugar: 34,
    milkFat: 0,
    water: 1,
    solids: 29,
    otherFats: 0
  };

  const validTemperatureCurve = {
    melt: 45,
    cool: 27,
    working: 31
  };

  // ============================================================================
  // ganacheCharacteristics Converter
  // ============================================================================

  describe('ganacheCharacteristics', () => {
    test('converts valid ganache characteristics', () => {
      expect(ganacheCharacteristics.convert(validGanacheCharacteristics)).toSucceedAndSatisfy((result) => {
        expect(result.cacaoFat).toBe(36);
        expect(result.sugar).toBe(34);
        expect(result.milkFat).toBe(0);
        expect(result.water).toBe(1);
        expect(result.solids).toBe(29);
        expect(result.otherFats).toBe(0);
      });
    });

    test('fails for missing cacaoFat', () => {
      const input = {
        sugar: 34,
        milkFat: 0,
        water: 1,
        solids: 29,
        otherFats: 0
      };
      expect(ganacheCharacteristics.convert(input)).toFail();
    });

    test('fails for non-numeric values', () => {
      const input = {
        ...validGanacheCharacteristics,
        cacaoFat: 'not a number'
      };
      expect(ganacheCharacteristics.convert(input)).toFail();
    });

    test('fails for negative percentages', () => {
      const input = {
        ...validGanacheCharacteristics,
        sugar: -10
      };
      expect(ganacheCharacteristics.convert(input)).toFail();
    });

    test('fails for percentages over 100', () => {
      const input = {
        ...validGanacheCharacteristics,
        cacaoFat: 150
      };
      expect(ganacheCharacteristics.convert(input)).toFail();
    });
  });

  // ============================================================================
  // temperatureCurve Converter
  // ============================================================================

  describe('temperatureCurve', () => {
    test('converts valid temperature curve', () => {
      expect(temperatureCurve.convert(validTemperatureCurve)).toSucceedAndSatisfy((result) => {
        expect(result.melt).toBe(45);
        expect(result.cool).toBe(27);
        expect(result.working).toBe(31);
      });
    });

    test('fails for missing melt temperature', () => {
      const input = {
        cool: 27,
        working: 31
      };
      expect(temperatureCurve.convert(input)).toFail();
    });

    test('fails for non-numeric temperature', () => {
      const input = {
        ...validTemperatureCurve,
        melt: 'hot'
      };
      expect(temperatureCurve.convert(input)).toFail();
    });

    test('converts with negative temperatures', () => {
      const input = {
        melt: 0,
        cool: -5,
        working: -2
      };
      expect(temperatureCurve.convert(input)).toSucceed();
    });
  });

  // ============================================================================
  // baseIngredient Converter
  // ============================================================================

  describe('baseIngredient', () => {
    const validBaseIngredient = {
      baseId: 'test-ingredient',
      name: 'Test Ingredient',
      category: 'other',
      ganacheCharacteristics: validGanacheCharacteristics
    };

    test('converts valid base ingredient', () => {
      expect(baseIngredientEntity.convert(validBaseIngredient)).toSucceedAndSatisfy((result) => {
        expect(result.baseId).toBe('test-ingredient');
        expect(result.name).toBe('Test Ingredient');
        expect(result.category).toBe('other');
        expect(result.ganacheCharacteristics).toBeDefined();
      });
    });

    test('converts base ingredient with optional fields', () => {
      const input = {
        ...validBaseIngredient,
        description: 'A test ingredient',
        manufacturer: 'Test Co.',
        allergens: ['milk', 'soy'],
        traceAllergens: ['nuts'],
        certifications: ['organic', 'vegan'],
        tags: ['premium', 'artisan']
      };

      expect(baseIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.description).toBe('A test ingredient');
        expect(result.manufacturer).toBe('Test Co.');
        expect(result.allergens).toEqual(['milk', 'soy']);
        expect(result.traceAllergens).toEqual(['nuts']);
        expect(result.certifications).toEqual(['organic', 'vegan']);
        expect(result.tags).toEqual(['premium', 'artisan']);
      });
    });

    test('fails for missing baseId', () => {
      const input = {
        name: 'Test',
        category: 'other',
        ganacheCharacteristics: validGanacheCharacteristics
      };
      expect(baseIngredientEntity.convert(input)).toFail();
    });

    test('fails for invalid baseId (contains dot)', () => {
      const input = {
        ...validBaseIngredient,
        baseId: 'invalid.id'
      };
      expect(baseIngredientEntity.convert(input)).toFail();
    });

    test('fails with empty name', () => {
      const input = {
        ...validBaseIngredient,
        name: ''
      };
      expect(baseIngredientEntity.convert(input)).toFail();
    });

    test('fails for invalid category', () => {
      const input = {
        ...validBaseIngredient,
        category: 'invalid-category'
      };
      expect(baseIngredientEntity.convert(input)).toFail();
    });

    test('fails for invalid allergen', () => {
      const input = {
        ...validBaseIngredient,
        allergens: ['milk', 'invalid-allergen']
      };
      expect(baseIngredientEntity.convert(input)).toFail();
    });

    test('fails for invalid certification', () => {
      const input = {
        ...validBaseIngredient,
        certifications: ['organic', 'invalid-cert']
      };
      expect(baseIngredientEntity.convert(input)).toFail();
    });
  });

  // ============================================================================
  // chocolateIngredient Converter
  // ============================================================================

  describe('chocolateIngredient', () => {
    const validChocolateIngredient = {
      baseId: 'dark-chocolate',
      name: 'Dark Chocolate 70%',
      category: 'chocolate',
      ganacheCharacteristics: validGanacheCharacteristics,
      chocolateType: 'dark',
      cacaoPercentage: 70
    };

    test('converts valid chocolate ingredient', () => {
      expect(chocolateIngredientEntity.convert(validChocolateIngredient)).toSucceedAndSatisfy((result) => {
        expect(result.category).toBe('chocolate');
        expect(result.chocolateType).toBe('dark');
        expect(result.cacaoPercentage).toBe(70);
      });
    });

    test('converts chocolate ingredient with all optional fields', () => {
      const input = {
        ...validChocolateIngredient,
        fluidityStars: 3,
        viscosityMcM: 8,
        temperatureCurve: validTemperatureCurve,
        origins: ['Ecuador', 'Madagascar'],
        beanVarieties: ['Criollo', 'Trinitario'],
        applications: ['ganache', 'molding']
      };

      expect(chocolateIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.fluidityStars).toBe(3);
        expect(result.viscosityMcM).toBe(8);
        expect(result.temperatureCurve).toBeDefined();
        expect(result.origins).toEqual(['Ecuador', 'Madagascar']);
        expect(result.beanVarieties).toEqual(['Criollo', 'Trinitario']);
        expect(result.applications).toEqual(['ganache', 'molding']);
      });
    });

    test('fails for category other than "chocolate"', () => {
      const input = {
        ...validChocolateIngredient,
        category: 'sugar'
      };
      expect(chocolateIngredientEntity.convert(input)).toFail();
    });

    test('fails for missing chocolateType', () => {
      const input = {
        baseId: 'dark-chocolate',
        name: 'Dark Chocolate',
        category: 'chocolate',
        ganacheCharacteristics: validGanacheCharacteristics,
        cacaoPercentage: 70
      };
      expect(chocolateIngredientEntity.convert(input)).toFail();
    });

    test('fails for invalid chocolateType', () => {
      const input = {
        ...validChocolateIngredient,
        chocolateType: 'invalid-type'
      };
      expect(chocolateIngredientEntity.convert(input)).toFail();
    });

    test('fails for invalid fluidityStars', () => {
      const input = {
        ...validChocolateIngredient,
        fluidityStars: 6
      };
      expect(chocolateIngredientEntity.convert(input)).toFail();
    });

    test('fails for invalid bean variety', () => {
      const input = {
        ...validChocolateIngredient,
        beanVarieties: ['Criollo', 'InvalidVariety']
      };
      expect(chocolateIngredientEntity.convert(input)).toFail();
    });

    test('fails for invalid application', () => {
      const input = {
        ...validChocolateIngredient,
        applications: ['ganache', 'invalid-application']
      };
      expect(chocolateIngredientEntity.convert(input)).toFail();
    });
  });

  // ============================================================================
  // sugarIngredient Converter
  // ============================================================================

  describe('sugarIngredient', () => {
    const validSugarIngredient = {
      baseId: 'granulated-sugar',
      name: 'Granulated Sugar',
      category: 'sugar',
      ganacheCharacteristics: validGanacheCharacteristics
    };

    test('converts valid sugar ingredient', () => {
      expect(sugarIngredientEntity.convert(validSugarIngredient)).toSucceedAndSatisfy((result) => {
        expect(result.category).toBe('sugar');
        expect(result.baseId).toBe('granulated-sugar');
        expect(result.name).toBe('Granulated Sugar');
      });
    });

    test('converts sugar ingredient with optional fields', () => {
      const input = {
        ...validSugarIngredient,
        hydrationNumber: 1.5,
        sweetnessPotency: 1.0
      };

      expect(sugarIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.hydrationNumber).toBe(1.5);
        expect(result.sweetnessPotency).toBe(1.0);
      });
    });

    test('fails for category other than "sugar"', () => {
      const input = {
        ...validSugarIngredient,
        category: 'chocolate'
      };
      expect(sugarIngredientEntity.convert(input)).toFail();
    });

    test('converts with zero hydration number', () => {
      const input = {
        ...validSugarIngredient,
        hydrationNumber: 0
      };
      expect(sugarIngredientEntity.convert(input)).toSucceed();
    });

    test('converts with sweetness potency greater than 1', () => {
      const input = {
        ...validSugarIngredient,
        sweetnessPotency: 2.5
      };
      expect(sugarIngredientEntity.convert(input)).toSucceed();
    });

    test('fails for non-numeric hydrationNumber', () => {
      const input = {
        ...validSugarIngredient,
        hydrationNumber: 'sweet'
      };
      expect(sugarIngredientEntity.convert(input)).toFail();
    });
  });

  // ============================================================================
  // dairyIngredient Converter
  // ============================================================================

  describe('dairyIngredient', () => {
    const validDairyIngredient = {
      baseId: 'heavy-cream',
      name: 'Heavy Cream 35%',
      category: 'dairy',
      ganacheCharacteristics: validGanacheCharacteristics
    };

    test('converts valid dairy ingredient', () => {
      expect(dairyIngredientEntity.convert(validDairyIngredient)).toSucceedAndSatisfy((result) => {
        expect(result.category).toBe('dairy');
        expect(result.baseId).toBe('heavy-cream');
        expect(result.name).toBe('Heavy Cream 35%');
      });
    });

    test('converts dairy ingredient with optional fields', () => {
      const input = {
        ...validDairyIngredient,
        fatContent: 35,
        waterContent: 60
      };

      expect(dairyIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.fatContent).toBe(35);
        expect(result.waterContent).toBe(60);
      });
    });

    test('fails for category other than "dairy"', () => {
      const input = {
        ...validDairyIngredient,
        category: 'fat'
      };
      expect(dairyIngredientEntity.convert(input)).toFail();
    });

    test('fails for invalid fatContent percentage', () => {
      const input = {
        ...validDairyIngredient,
        fatContent: 150
      };
      expect(dairyIngredientEntity.convert(input)).toFail();
    });

    test('fails for negative waterContent', () => {
      const input = {
        ...validDairyIngredient,
        waterContent: -10
      };
      expect(dairyIngredientEntity.convert(input)).toFail();
    });

    test('converts with zero fat content', () => {
      const input = {
        ...validDairyIngredient,
        fatContent: 0
      };
      expect(dairyIngredientEntity.convert(input)).toSucceed();
    });
  });

  // ============================================================================
  // fatIngredient Converter
  // ============================================================================

  describe('fatIngredient', () => {
    const validFatIngredient = {
      baseId: 'cocoa-butter',
      name: 'Cocoa Butter',
      category: 'fat',
      ganacheCharacteristics: validGanacheCharacteristics
    };

    test('converts valid fat ingredient', () => {
      expect(fatIngredientEntity.convert(validFatIngredient)).toSucceedAndSatisfy((result) => {
        expect(result.category).toBe('fat');
        expect(result.baseId).toBe('cocoa-butter');
        expect(result.name).toBe('Cocoa Butter');
      });
    });

    test('converts fat ingredient with melting point', () => {
      const input = {
        ...validFatIngredient,
        meltingPoint: 34
      };

      expect(fatIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.meltingPoint).toBe(34);
      });
    });

    test('fails for category other than "fat"', () => {
      const input = {
        ...validFatIngredient,
        category: 'dairy'
      };
      expect(fatIngredientEntity.convert(input)).toFail();
    });

    test('converts with negative melting point', () => {
      const input = {
        ...validFatIngredient,
        meltingPoint: -10
      };
      expect(fatIngredientEntity.convert(input)).toSucceed();
    });

    test('fails for non-numeric melting point', () => {
      const input = {
        ...validFatIngredient,
        meltingPoint: 'warm'
      };
      expect(fatIngredientEntity.convert(input)).toFail();
    });
  });

  // ============================================================================
  // alcoholIngredient Converter (NEW)
  // ============================================================================

  describe('alcoholIngredient', () => {
    const validAlcoholIngredient = {
      baseId: 'grand-marnier',
      name: 'Grand Marnier',
      category: 'alcohol',
      ganacheCharacteristics: validGanacheCharacteristics
    };

    test('converts valid alcohol ingredient without optional fields', () => {
      expect(alcoholIngredientEntity.convert(validAlcoholIngredient)).toSucceedAndSatisfy((result) => {
        expect(result.category).toBe('alcohol');
        expect(result.baseId).toBe('grand-marnier');
        expect(result.name).toBe('Grand Marnier');
        expect(result.alcoholByVolume).toBeUndefined();
        expect(result.flavorProfile).toBeUndefined();
      });
    });

    test('converts alcohol ingredient with alcoholByVolume', () => {
      const input = {
        ...validAlcoholIngredient,
        alcoholByVolume: 40
      };

      expect(alcoholIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.alcoholByVolume).toBe(40);
      });
    });

    test('converts alcohol ingredient with flavorProfile', () => {
      const input = {
        ...validAlcoholIngredient,
        flavorProfile: 'Orange liqueur with cognac base'
      };

      expect(alcoholIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.flavorProfile).toBe('Orange liqueur with cognac base');
      });
    });

    test('converts alcohol ingredient with all optional fields', () => {
      const input = {
        ...validAlcoholIngredient,
        alcoholByVolume: 40,
        flavorProfile: 'Rich orange with cognac notes',
        description: 'Premium French liqueur',
        manufacturer: 'Marnier-Lapostolle',
        tags: ['liqueur', 'orange', 'premium']
      };

      expect(alcoholIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.alcoholByVolume).toBe(40);
        expect(result.flavorProfile).toBe('Rich orange with cognac notes');
        expect(result.description).toBe('Premium French liqueur');
        expect(result.manufacturer).toBe('Marnier-Lapostolle');
        expect(result.tags).toEqual(['liqueur', 'orange', 'premium']);
      });
    });

    test('fails for category other than "alcohol"', () => {
      const input = {
        ...validAlcoholIngredient,
        category: 'liquid'
      };
      expect(alcoholIngredientEntity.convert(input)).toFail();
    });

    test('fails for invalid alcoholByVolume (negative)', () => {
      const input = {
        ...validAlcoholIngredient,
        alcoholByVolume: -5
      };
      expect(alcoholIngredientEntity.convert(input)).toFail();
    });

    test('fails for invalid alcoholByVolume (over 100)', () => {
      const input = {
        ...validAlcoholIngredient,
        alcoholByVolume: 150
      };
      expect(alcoholIngredientEntity.convert(input)).toFail();
    });

    test('converts with zero alcoholByVolume', () => {
      const input = {
        ...validAlcoholIngredient,
        alcoholByVolume: 0
      };
      expect(alcoholIngredientEntity.convert(input)).toSucceed();
    });

    test('converts with 100% alcoholByVolume', () => {
      const input = {
        ...validAlcoholIngredient,
        alcoholByVolume: 100
      };
      expect(alcoholIngredientEntity.convert(input)).toSucceed();
    });

    test('fails for non-numeric alcoholByVolume', () => {
      const input = {
        ...validAlcoholIngredient,
        alcoholByVolume: 'strong'
      };
      expect(alcoholIngredientEntity.convert(input)).toFail();
    });

    test('converts with empty flavorProfile (no validation on empty strings)', () => {
      const input = {
        ...validAlcoholIngredient,
        flavorProfile: ''
      };
      expect(alcoholIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.flavorProfile).toBe('');
      });
    });

    test('fails for non-string flavorProfile', () => {
      const input = {
        ...validAlcoholIngredient,
        flavorProfile: 123
      };
      expect(alcoholIngredientEntity.convert(input)).toFail();
    });

    test('converts various common alcohol types', () => {
      const testCases = [
        { name: 'Rum', abv: 40 },
        { name: 'Vodka', abv: 40 },
        { name: 'Whiskey', abv: 43 },
        { name: 'Kirsch', abv: 45 },
        { name: 'Amaretto', abv: 28 },
        { name: "Bailey's", abv: 17 }
      ];

      testCases.forEach((tc) => {
        const input = {
          ...validAlcoholIngredient,
          baseId: tc.name.toLowerCase().replace(/'/g, ''),
          name: tc.name,
          alcoholByVolume: tc.abv
        };
        expect(alcoholIngredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
          expect(result.name).toBe(tc.name);
          expect(result.alcoholByVolume).toBe(tc.abv);
        });
      });
    });
  });

  // ============================================================================
  // ingredient (Discriminated Union) Converter
  // ============================================================================

  describe('ingredient (discriminated union)', () => {
    test('converts chocolate ingredient via union', () => {
      const input = {
        baseId: 'dark-chocolate',
        name: 'Dark Chocolate',
        category: 'chocolate',
        ganacheCharacteristics: validGanacheCharacteristics,
        chocolateType: 'dark',
        cacaoPercentage: 70
      };
      expect(ingredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.category).toBe('chocolate');
      });
    });

    test('converts sugar ingredient via union', () => {
      const input = {
        baseId: 'sugar',
        name: 'Sugar',
        category: 'sugar',
        ganacheCharacteristics: validGanacheCharacteristics
      };
      expect(ingredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.category).toBe('sugar');
      });
    });

    test('converts dairy ingredient via union', () => {
      const input = {
        baseId: 'cream',
        name: 'Cream',
        category: 'dairy',
        ganacheCharacteristics: validGanacheCharacteristics
      };
      expect(ingredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.category).toBe('dairy');
      });
    });

    test('converts fat ingredient via union', () => {
      const input = {
        baseId: 'butter',
        name: 'Butter',
        category: 'fat',
        ganacheCharacteristics: validGanacheCharacteristics
      };
      expect(ingredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.category).toBe('fat');
      });
    });

    test('converts alcohol ingredient via union', () => {
      const input = {
        baseId: 'rum',
        name: 'Dark Rum',
        category: 'alcohol',
        ganacheCharacteristics: validGanacheCharacteristics,
        alcoholByVolume: 40
      };
      expect(ingredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.category).toBe('alcohol');
      });
    });

    test('converts base ingredient via union', () => {
      const input = {
        baseId: 'vanilla',
        name: 'Vanilla Extract',
        category: 'flavor',
        ganacheCharacteristics: validGanacheCharacteristics
      };
      expect(ingredientEntity.convert(input)).toSucceedAndSatisfy((result) => {
        expect(result.category).toBe('flavor');
      });
    });

    test('fails for invalid input', () => {
      const input = {
        baseId: 'invalid',
        category: 'chocolate'
        // Missing required fields
      };
      expect(ingredientEntity.convert(input)).toFail();
    });

    test('fails for completely invalid object', () => {
      expect(ingredientEntity.convert({ foo: 'bar' })).toFail();
    });

    test('fails for non-object input', () => {
      expect(ingredientEntity.convert('not an object')).toFail();
      expect(ingredientEntity.convert(null)).toFail();
      expect(ingredientEntity.convert(123)).toFail();
    });
  });
});
