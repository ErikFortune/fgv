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

import '@fgv/ts-utils-jest';
import {
  Ingredient,
  IChocolateIngredient,
  IDairyIngredient,
  IAlcoholIngredient,
  IGanacheCharacteristics
} from '../../../../packlets/entities';
// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  validateGanacheCharacteristics,
  validateTemperatureCurve,
  validateChocolateFields,
  validateDairyFields,
  validateAlcoholFields,
  validateIngredientEntity
} from '../../../../packlets/editing/ingredients/validators';
import { BaseIngredientId, Celsius, DegreesMacMichael, Percentage } from '../../../../index';

// Helper to create branded types
const pct = (n: number): Percentage => n as Percentage;
const temp = (n: number): Celsius => n as Celsius;
const visc = (n: number): DegreesMacMichael => n as DegreesMacMichael;

// Helper to create ganache characteristics
const createGanache = (
  cacaoFat: number,
  sugar: number,
  milkFat: number,
  water: number,
  solids: number,
  otherFats: number
): IGanacheCharacteristics => ({
  cacaoFat: pct(cacaoFat),
  sugar: pct(sugar),
  milkFat: pct(milkFat),
  water: pct(water),
  solids: pct(solids),
  otherFats: pct(otherFats)
});

// Helper to create a valid base ingredient
const createBaseIngredient = (): Ingredient => ({
  baseId: 'test-ingredient' as BaseIngredientId,
  name: 'Test Ingredient',
  category: 'other',
  ganacheCharacteristics: createGanache(0, 50, 0, 30, 20, 0)
});

describe('validateGanacheCharacteristics', () => {
  test('should succeed for valid ganache characteristics', () => {
    const ingredient = createBaseIngredient();
    expect(validateGanacheCharacteristics(ingredient)).toSucceed();
  });

  test('should fail if ganacheCharacteristics is missing', () => {
    const ingredient = {
      ...createBaseIngredient(),
      ganacheCharacteristics: undefined as unknown as IGanacheCharacteristics
    };
    expect(validateGanacheCharacteristics(ingredient)).toFailWith(/ganacheCharacteristics is required/i);
  });

  test('should fail if percentage is negative', () => {
    const ingredient = {
      ...createBaseIngredient(),
      ganacheCharacteristics: {
        ...createBaseIngredient().ganacheCharacteristics,
        sugar: pct(-10)
      }
    };
    expect(validateGanacheCharacteristics(ingredient)).toFailWith(/sugar.*must be between 0 and 100/i);
  });

  test('should fail if percentage exceeds 100', () => {
    const ingredient = {
      ...createBaseIngredient(),
      ganacheCharacteristics: {
        ...createBaseIngredient().ganacheCharacteristics,
        cacaoFat: pct(150)
      }
    };
    expect(validateGanacheCharacteristics(ingredient)).toFailWith(/cacaoFat.*must be between 0 and 100/i);
  });

  test('should fail if total exceeds 100', () => {
    const ingredient = {
      ...createBaseIngredient(),
      ganacheCharacteristics: createGanache(40, 40, 20, 10, 5, 5) // Total: 120
    };
    expect(validateGanacheCharacteristics(ingredient)).toFailWith(/percentages total.*exceeds 100/i);
  });

  test('should succeed if total is exactly 100', () => {
    const ingredient = {
      ...createBaseIngredient(),
      ganacheCharacteristics: createGanache(35, 45, 10, 5, 5, 0) // Total: 100
    };
    expect(validateGanacheCharacteristics(ingredient)).toSucceed();
  });

  test('should succeed if total is less than 100', () => {
    const ingredient = {
      ...createBaseIngredient(),
      ganacheCharacteristics: createGanache(20, 30, 0, 10, 10, 0) // Total: 70
    };
    expect(validateGanacheCharacteristics(ingredient)).toSucceed();
  });
});

describe('validateTemperatureCurve', () => {
  const createChocolateIngredient = (): IChocolateIngredient => ({
    ...createBaseIngredient(),
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: pct(70)
  });

  test('should succeed for non-chocolate ingredients', () => {
    const ingredient = createBaseIngredient();
    expect(validateTemperatureCurve(ingredient)).toSucceed();
  });

  test('should succeed if temperatureCurve is not provided', () => {
    const ingredient = createChocolateIngredient();
    expect(validateTemperatureCurve(ingredient)).toSucceed();
  });

  test('should succeed for valid temperature curve', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      temperatureCurve: {
        melt: temp(50),
        cool: temp(32),
        working: temp(31)
      }
    };
    expect(validateTemperatureCurve(ingredient)).toSucceed();
  });

  test('should fail if melt <= cool', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      temperatureCurve: {
        melt: temp(45),
        cool: temp(50),
        working: temp(31)
      }
    };
    expect(validateTemperatureCurve(ingredient)).toFailWith(/melt.*must be greater than cool/i);
  });

  test('should fail if cool <= working', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      temperatureCurve: {
        melt: temp(50),
        cool: temp(30),
        working: temp(32)
      }
    };
    expect(validateTemperatureCurve(ingredient)).toFailWith(/cool.*must be greater than working/i);
  });

  test('should fail if melt temperature is too low', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      temperatureCurve: {
        melt: temp(30),
        cool: temp(27),
        working: temp(25)
      }
    };
    expect(validateTemperatureCurve(ingredient)).toFailWith(/melt temperature.*outside reasonable range/i);
  });

  test('should fail if melt temperature is too high', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      temperatureCurve: {
        melt: temp(70),
        cool: temp(32),
        working: temp(31)
      }
    };
    expect(validateTemperatureCurve(ingredient)).toFailWith(/melt temperature.*outside reasonable range/i);
  });

  test('should fail if working temperature is too low', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      temperatureCurve: {
        melt: temp(50),
        cool: temp(27),
        working: temp(20)
      }
    };
    expect(validateTemperatureCurve(ingredient)).toFailWith(/working temperature.*outside reasonable range/i);
  });

  test('should fail if working temperature is too high', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      temperatureCurve: {
        melt: temp(50),
        cool: temp(40),
        working: temp(38)
      }
    };
    expect(validateTemperatureCurve(ingredient)).toFailWith(/working temperature.*outside reasonable range/i);
  });
});

describe('validateChocolateFields', () => {
  const createChocolateIngredient = (): IChocolateIngredient => ({
    ...createBaseIngredient(),
    category: 'chocolate',
    chocolateType: 'dark',
    cacaoPercentage: pct(70)
  });

  test('should succeed for non-chocolate ingredients', () => {
    const ingredient = createBaseIngredient();
    expect(validateChocolateFields(ingredient)).toSucceed();
  });

  test('should succeed for valid chocolate ingredient', () => {
    const ingredient = createChocolateIngredient();
    expect(validateChocolateFields(ingredient)).toSucceed();
  });

  test('should fail if cacaoPercentage is negative', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      cacaoPercentage: pct(-10)
    };
    expect(validateChocolateFields(ingredient)).toFailWith(/cacaoPercentage.*must be between 0 and 100/i);
  });

  test('should fail if cacaoPercentage exceeds 100', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      cacaoPercentage: pct(150)
    };
    expect(validateChocolateFields(ingredient)).toFailWith(/cacaoPercentage.*must be between 0 and 100/i);
  });

  test('should succeed for cacaoPercentage of 0', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      cacaoPercentage: pct(0)
    };
    expect(validateChocolateFields(ingredient)).toSucceed();
  });

  test('should succeed for cacaoPercentage of 100', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      cacaoPercentage: pct(100)
    };
    expect(validateChocolateFields(ingredient)).toSucceed();
  });

  test('should fail if fluidityStars is less than 1', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      fluidityStars: 0 as unknown as 1 | 2 | 3 | 4 | 5
    };
    expect(validateChocolateFields(ingredient)).toFailWith(/fluidityStars.*must be between 1 and 5/i);
  });

  test('should fail if fluidityStars is greater than 5', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      fluidityStars: 6 as unknown as 1 | 2 | 3 | 4 | 5
    };
    expect(validateChocolateFields(ingredient)).toFailWith(/fluidityStars.*must be between 1 and 5/i);
  });

  test('should succeed for valid fluidityStars', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      fluidityStars: 3
    };
    expect(validateChocolateFields(ingredient)).toSucceed();
  });

  test('should fail if viscosityMcM is negative', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      viscosityMcM: visc(-10)
    };
    expect(validateChocolateFields(ingredient)).toFailWith(/viscosityMcM.*must be positive/i);
  });

  test('should succeed for valid viscosityMcM', () => {
    const ingredient: IChocolateIngredient = {
      ...createChocolateIngredient(),
      viscosityMcM: visc(450)
    };
    expect(validateChocolateFields(ingredient)).toSucceed();
  });
});

describe('validateDairyFields', () => {
  const createDairyIngredient = (): IDairyIngredient => ({
    ...createBaseIngredient(),
    category: 'dairy'
  });

  test('should succeed for non-dairy ingredients', () => {
    const ingredient = createBaseIngredient();
    expect(validateDairyFields(ingredient)).toSucceed();
  });

  test('should succeed for valid dairy ingredient', () => {
    const ingredient = createDairyIngredient();
    expect(validateDairyFields(ingredient)).toSucceed();
  });

  test('should fail if fatContent is negative', () => {
    const ingredient: IDairyIngredient = {
      ...createDairyIngredient(),
      fatContent: pct(-10)
    };
    expect(validateDairyFields(ingredient)).toFailWith(/fatContent.*must be between 0 and 100/i);
  });

  test('should fail if fatContent exceeds 100', () => {
    const ingredient: IDairyIngredient = {
      ...createDairyIngredient(),
      fatContent: pct(150)
    };
    expect(validateDairyFields(ingredient)).toFailWith(/fatContent.*must be between 0 and 100/i);
  });

  test('should fail if waterContent is negative', () => {
    const ingredient: IDairyIngredient = {
      ...createDairyIngredient(),
      waterContent: pct(-10)
    };
    expect(validateDairyFields(ingredient)).toFailWith(/waterContent.*must be between 0 and 100/i);
  });

  test('should fail if waterContent exceeds 100', () => {
    const ingredient: IDairyIngredient = {
      ...createDairyIngredient(),
      waterContent: pct(150)
    };
    expect(validateDairyFields(ingredient)).toFailWith(/waterContent.*must be between 0 and 100/i);
  });

  test('should fail if fatContent + waterContent exceeds 100', () => {
    const ingredient: IDairyIngredient = {
      ...createDairyIngredient(),
      fatContent: pct(60),
      waterContent: pct(50)
    };
    expect(validateDairyFields(ingredient)).toFailWith(/fatContent \+ waterContent exceeds 100/i);
  });

  test('should succeed if fatContent + waterContent equals 100', () => {
    const ingredient: IDairyIngredient = {
      ...createDairyIngredient(),
      fatContent: pct(40),
      waterContent: pct(60)
    };
    expect(validateDairyFields(ingredient)).toSucceed();
  });

  test('should succeed if fatContent + waterContent is less than 100', () => {
    const ingredient: IDairyIngredient = {
      ...createDairyIngredient(),
      fatContent: pct(30),
      waterContent: pct(50)
    };
    expect(validateDairyFields(ingredient)).toSucceed();
  });
});

describe('validateAlcoholFields', () => {
  const createAlcoholIngredient = (): IAlcoholIngredient => ({
    ...createBaseIngredient(),
    category: 'alcohol'
  });

  test('should succeed for non-alcohol ingredients', () => {
    const ingredient = createBaseIngredient();
    expect(validateAlcoholFields(ingredient)).toSucceed();
  });

  test('should succeed for valid alcohol ingredient', () => {
    const ingredient = createAlcoholIngredient();
    expect(validateAlcoholFields(ingredient)).toSucceed();
  });

  test('should fail if alcoholByVolume is negative', () => {
    const ingredient: IAlcoholIngredient = {
      ...createAlcoholIngredient(),
      alcoholByVolume: pct(-10)
    };
    expect(validateAlcoholFields(ingredient)).toFailWith(/alcoholByVolume.*must be between 0 and 100/i);
  });

  test('should fail if alcoholByVolume exceeds 100', () => {
    const ingredient: IAlcoholIngredient = {
      ...createAlcoholIngredient(),
      alcoholByVolume: pct(150)
    };
    expect(validateAlcoholFields(ingredient)).toFailWith(/alcoholByVolume.*must be between 0 and 100/i);
  });

  test('should succeed for alcoholByVolume of 0', () => {
    const ingredient: IAlcoholIngredient = {
      ...createAlcoholIngredient(),
      alcoholByVolume: pct(0)
    };
    expect(validateAlcoholFields(ingredient)).toSucceed();
  });

  test('should succeed for alcoholByVolume of 100', () => {
    const ingredient: IAlcoholIngredient = {
      ...createAlcoholIngredient(),
      alcoholByVolume: pct(100)
    };
    expect(validateAlcoholFields(ingredient)).toSucceed();
  });

  test('should succeed for valid alcoholByVolume', () => {
    const ingredient: IAlcoholIngredient = {
      ...createAlcoholIngredient(),
      alcoholByVolume: pct(40)
    };
    expect(validateAlcoholFields(ingredient)).toSucceed();
  });
});

describe('validateIngredientEntity', () => {
  test('should succeed for completely valid ingredient', () => {
    const ingredient = createBaseIngredient();
    expect(validateIngredientEntity(ingredient)).toSucceed();
  });

  test('should fail if ganache characteristics are invalid', () => {
    const ingredient = {
      ...createBaseIngredient(),
      ganacheCharacteristics: {
        ...createBaseIngredient().ganacheCharacteristics,
        sugar: pct(150)
      }
    };
    expect(validateIngredientEntity(ingredient)).toFailWith(/sugar.*must be between 0 and 100/i);
  });

  test('should fail if chocolate fields are invalid', () => {
    const ingredient: IChocolateIngredient = {
      ...createBaseIngredient(),
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: pct(150) // Invalid
    };
    expect(validateIngredientEntity(ingredient)).toFailWith(/cacaoPercentage/i);
  });

  test('should fail if dairy fields are invalid', () => {
    const ingredient: IDairyIngredient = {
      ...createBaseIngredient(),
      category: 'dairy',
      fatContent: pct(70),
      waterContent: pct(50) // Total exceeds 100
    };
    expect(validateIngredientEntity(ingredient)).toFailWith(/fatContent \+ waterContent exceeds 100/i);
  });

  test('should fail if alcohol fields are invalid', () => {
    const ingredient: IAlcoholIngredient = {
      ...createBaseIngredient(),
      category: 'alcohol',
      alcoholByVolume: pct(150) // Invalid
    };
    expect(validateIngredientEntity(ingredient)).toFailWith(/alcoholByVolume/i);
  });

  test('should succeed for valid chocolate ingredient', () => {
    const ingredient: IChocolateIngredient = {
      ...createBaseIngredient(),
      category: 'chocolate',
      chocolateType: 'dark',
      cacaoPercentage: pct(70),
      temperatureCurve: {
        melt: temp(50),
        cool: temp(32),
        working: temp(31)
      }
    };
    expect(validateIngredientEntity(ingredient)).toSucceed();
  });
});
