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

import { Result, succeed, fail } from '@fgv/ts-utils';
import {
  Entities,
  BaseIngredientId,
  Percentage,
  Celsius,
  Converters as CommonConverters
} from '@fgv/ts-chocolate';

import { promptInput, confirmAction, showMenu, IMenuChoice, MenuResult } from '../../shared';

/**
 * Prompts the user to build a new ingredient entity interactively.
 * @returns Result containing the new ingredient entity
 */
export async function promptNewIngredient(): Promise<Result<Entities.Ingredients.IngredientEntity>> {
  const name = await promptInput('Ingredient name:');
  if (!name.trim()) {
    return fail('Ingredient name is required');
  }

  const baseIdInput = await promptInput('Base ID (leave empty to auto-generate from name):');
  let baseId: BaseIngredientId;
  if (baseIdInput.trim()) {
    const idResult = CommonConverters.baseIngredientId.convert(baseIdInput.trim());
    if (idResult.isFailure()) {
      return fail(`Invalid base ID: ${idResult.message}`);
    }
    baseId = idResult.value;
  } else {
    // Auto-generate from name: lowercase, replace spaces with hyphens, strip non-alphanumeric
    baseId = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '') as BaseIngredientId;
    if (!baseId) {
      return fail('Could not generate a valid base ID from the provided name');
    }
  }

  const description = await promptInput('Description (optional):');
  const manufacturer = await promptInput('Manufacturer (optional):');

  const categoryResult = await promptCategory();
  if (categoryResult.action !== 'value') {
    return fail('Category selection cancelled');
  }
  const category = categoryResult.value;

  const ganacheResult = await promptGanacheCharacteristics();
  if (ganacheResult.isFailure()) {
    return fail(ganacheResult.message);
  }

  let entity: Entities.Ingredients.IngredientEntity = {
    baseId,
    name: name.trim(),
    category,
    ganacheCharacteristics: ganacheResult.value,
    ...(description.trim() && { description: description.trim() }),
    ...(manufacturer.trim() && { manufacturer: manufacturer.trim() })
  };

  // Add category-specific fields
  const categoryFieldsResult = await promptCategorySpecificFields(category);
  if (categoryFieldsResult.isFailure()) {
    return fail(categoryFieldsResult.message);
  }

  entity = { ...entity, ...categoryFieldsResult.value };

  return validateIngredient(entity);
}

/**
 * Prompts the user to edit an existing ingredient entity interactively.
 * Fields are pre-filled with current values.
 * @param existing - The existing ingredient entity to edit
 * @returns Result containing the updated ingredient entity
 */
export async function promptEditIngredient(
  existing: Entities.Ingredients.IngredientEntity
): Promise<Result<Entities.Ingredients.IngredientEntity>> {
  const name = await promptInput('Ingredient name:', existing.name);
  if (!name.trim()) {
    return fail('Ingredient name is required');
  }

  const description = await promptInput('Description (optional):', existing.description);
  const manufacturer = await promptInput('Manufacturer (optional):', existing.manufacturer);

  const editGanache = await confirmAction('Edit ganache characteristics?', false);
  let ganacheCharacteristics = existing.ganacheCharacteristics;

  if (editGanache) {
    const ganacheResult = await promptGanacheCharacteristics(existing.ganacheCharacteristics);
    if (ganacheResult.isFailure()) {
      return fail(ganacheResult.message);
    }
    ganacheCharacteristics = ganacheResult.value;
  }

  let entity: Entities.Ingredients.IngredientEntity = {
    baseId: existing.baseId,
    name: name.trim(),
    category: existing.category,
    ganacheCharacteristics,
    ...(description.trim() && { description: description.trim() }),
    ...(manufacturer.trim() && { manufacturer: manufacturer.trim() })
  };

  // Edit category-specific fields
  const editCategoryFields = await confirmAction('Edit category-specific fields?', false);
  if (editCategoryFields) {
    const categoryFieldsResult = await promptCategorySpecificFields(existing.category, existing);
    if (categoryFieldsResult.isFailure()) {
      return fail(categoryFieldsResult.message);
    }
    entity = { ...entity, ...categoryFieldsResult.value };
  } else {
    // Preserve existing category-specific fields
    entity = { ...entity, ...getCategorySpecificFields(existing) };
  }

  // Preserve optional fields not prompted for
  if (existing.allergens) {
    entity = { ...entity, allergens: existing.allergens };
  }
  if (existing.traceAllergens) {
    entity = { ...entity, traceAllergens: existing.traceAllergens };
  }
  if (existing.certifications) {
    entity = { ...entity, certifications: existing.certifications };
  }
  if (existing.vegan !== undefined) {
    entity = { ...entity, vegan: existing.vegan };
  }
  if (existing.tags) {
    entity = { ...entity, tags: existing.tags };
  }
  if (existing.density !== undefined) {
    entity = { ...entity, density: existing.density };
  }
  if (existing.phase !== undefined) {
    entity = { ...entity, phase: existing.phase };
  }
  if (existing.measurementUnits) {
    entity = { ...entity, measurementUnits: existing.measurementUnits };
  }
  if (existing.urls) {
    entity = { ...entity, urls: existing.urls };
  }

  return validateIngredient(entity);
}

/**
 * Prompts for ingredient category selection.
 */
async function promptCategory(): Promise<MenuResult<Entities.Ingredients.IngredientEntity['category']>> {
  const choices: Array<IMenuChoice<Entities.Ingredients.IngredientEntity['category']>> = [
    { value: 'chocolate', name: 'Chocolate', description: 'Dark, milk, white, or ruby chocolate' },
    { value: 'dairy', name: 'Dairy', description: 'Cream, milk, butter, etc.' },
    { value: 'sugar', name: 'Sugar', description: 'Sucrose, glucose, etc.' },
    { value: 'fat', name: 'Fat', description: 'Oils, butter, etc.' },
    { value: 'alcohol', name: 'Alcohol', description: 'Liqueurs, spirits, etc.' }
  ];

  return showMenu({
    message: 'Select ingredient category:',
    choices,
    showBack: false,
    showExit: false
  });
}

/**
 * Prompts for ganache characteristics (7 percentage fields).
 */
async function promptGanacheCharacteristics(
  existing?: Entities.Ingredients.IGanacheCharacteristics
): Promise<Result<Entities.Ingredients.IGanacheCharacteristics>> {
  const fields: Record<string, string> = {};

  const cacaoFat = await promptInput('Cacao fat percentage (0-100):', existing?.cacaoFat?.toString());
  if (!cacaoFat.trim()) {
    return fail('Cacao fat percentage is required');
  }
  const cacaoFatNum = parseFloat(cacaoFat);
  if (isNaN(cacaoFatNum) || cacaoFatNum < 0 || cacaoFatNum > 100) {
    return fail('Cacao fat percentage must be between 0 and 100');
  }
  fields.cacaoFat = cacaoFat;

  const sugar = await promptInput('Sugar percentage (0-100):', existing?.sugar?.toString());
  if (!sugar.trim()) {
    return fail('Sugar percentage is required');
  }
  const sugarNum = parseFloat(sugar);
  if (isNaN(sugarNum) || sugarNum < 0 || sugarNum > 100) {
    return fail('Sugar percentage must be between 0 and 100');
  }
  fields.sugar = sugar;

  const milkFat = await promptInput('Milk fat percentage (0-100):', existing?.milkFat?.toString());
  if (!milkFat.trim()) {
    return fail('Milk fat percentage is required');
  }
  const milkFatNum = parseFloat(milkFat);
  if (isNaN(milkFatNum) || milkFatNum < 0 || milkFatNum > 100) {
    return fail('Milk fat percentage must be between 0 and 100');
  }
  fields.milkFat = milkFat;

  const water = await promptInput('Water percentage (0-100):', existing?.water?.toString());
  if (!water.trim()) {
    return fail('Water percentage is required');
  }
  const waterNum = parseFloat(water);
  if (isNaN(waterNum) || waterNum < 0 || waterNum > 100) {
    return fail('Water percentage must be between 0 and 100');
  }
  fields.water = water;

  const solids = await promptInput('Solids percentage (0-100):', existing?.solids?.toString());
  if (!solids.trim()) {
    return fail('Solids percentage is required');
  }
  const solidsNum = parseFloat(solids);
  if (isNaN(solidsNum) || solidsNum < 0 || solidsNum > 100) {
    return fail('Solids percentage must be between 0 and 100');
  }
  fields.solids = solids;

  const otherFats = await promptInput('Other fats percentage (0-100):', existing?.otherFats?.toString());
  if (!otherFats.trim()) {
    return fail('Other fats percentage is required');
  }
  const otherFatsNum = parseFloat(otherFats);
  if (isNaN(otherFatsNum) || otherFatsNum < 0 || otherFatsNum > 100) {
    return fail('Other fats percentage must be between 0 and 100');
  }
  fields.otherFats = otherFats;

  return succeed({
    cacaoFat: parseFloat(fields.cacaoFat) as unknown as Percentage,
    sugar: parseFloat(fields.sugar) as unknown as Percentage,
    milkFat: parseFloat(fields.milkFat) as unknown as Percentage,
    water: parseFloat(fields.water) as unknown as Percentage,
    solids: parseFloat(fields.solids) as unknown as Percentage,
    otherFats: parseFloat(fields.otherFats) as unknown as Percentage
  });
}

/**
 * Prompts for category-specific fields based on the ingredient category.
 */
async function promptCategorySpecificFields(
  category: Entities.Ingredients.IngredientEntity['category'],
  existing?: Entities.Ingredients.IngredientEntity
): Promise<Result<Record<string, unknown>>> {
  const fields: Record<string, unknown> = {};

  if (category === 'chocolate') {
    const chocolateTypeResult = await promptChocolateType(
      existing && Entities.Ingredients.isChocolateIngredientEntity(existing)
        ? existing.chocolateType
        : undefined
    );
    if (chocolateTypeResult.action !== 'value') {
      return fail('Chocolate type selection cancelled');
    }
    fields.chocolateType = chocolateTypeResult.value;

    const cacaoPercentageInput = await promptInput(
      'Cacao percentage (0-100):',
      existing && Entities.Ingredients.isChocolateIngredientEntity(existing)
        ? existing.cacaoPercentage?.toString()
        : undefined
    );
    if (!cacaoPercentageInput.trim()) {
      return fail('Cacao percentage is required for chocolate');
    }
    const cacaoPercentage = parseFloat(cacaoPercentageInput);
    if (isNaN(cacaoPercentage) || cacaoPercentage < 0 || cacaoPercentage > 100) {
      return fail('Cacao percentage must be between 0 and 100');
    }
    fields.cacaoPercentage = cacaoPercentage as unknown as Percentage;
  } else if (category === 'dairy') {
    const fatContentInput = await promptInput(
      'Fat content percentage (optional, 0-100):',
      existing && Entities.Ingredients.isDairyIngredientEntity(existing)
        ? existing.fatContent?.toString()
        : undefined
    );
    if (fatContentInput.trim()) {
      const fatContent = parseFloat(fatContentInput);
      if (isNaN(fatContent) || fatContent < 0 || fatContent > 100) {
        return fail('Fat content must be between 0 and 100');
      }
      fields.fatContent = fatContent as unknown as Percentage;
    }
  } else if (category === 'alcohol') {
    const alcoholByVolumeInput = await promptInput(
      'Alcohol by volume percentage (optional, 0-100):',
      existing && Entities.Ingredients.isAlcoholIngredientEntity(existing)
        ? existing.alcoholByVolume?.toString()
        : undefined
    );
    if (alcoholByVolumeInput.trim()) {
      const alcoholByVolume = parseFloat(alcoholByVolumeInput);
      if (isNaN(alcoholByVolume) || alcoholByVolume < 0 || alcoholByVolume > 100) {
        return fail('Alcohol by volume must be between 0 and 100');
      }
      fields.alcoholByVolume = alcoholByVolume as unknown as Percentage;
    }
  } else if (category === 'fat') {
    const meltingPointInput = await promptInput(
      'Melting point (Celsius, optional):',
      existing && Entities.Ingredients.isFatIngredientEntity(existing)
        ? existing.meltingPoint?.toString()
        : undefined
    );
    if (meltingPointInput.trim()) {
      const meltingPoint = parseFloat(meltingPointInput);
      if (isNaN(meltingPoint)) {
        return fail('Melting point must be a valid number');
      }
      fields.meltingPoint = meltingPoint as unknown as Celsius;
    }
  }
  // Sugar category has no specific required fields beyond base

  return succeed(fields);
}

/**
 * Prompts for chocolate type selection.
 */
async function promptChocolateType(_existing?: string): Promise<MenuResult<string>> {
  const choices: Array<IMenuChoice<string>> = [
    { value: 'dark', name: 'Dark Chocolate' },
    { value: 'milk', name: 'Milk Chocolate' },
    { value: 'white', name: 'White Chocolate' },
    { value: 'ruby', name: 'Ruby Chocolate' }
  ];

  return showMenu({
    message: 'Select chocolate type:',
    choices,
    showBack: false,
    showExit: false
  });
}

/**
 * Extracts category-specific fields from an existing ingredient.
 */
function getCategorySpecificFields(
  ingredient: Entities.Ingredients.IngredientEntity
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  if (Entities.Ingredients.isChocolateIngredientEntity(ingredient)) {
    fields.chocolateType = ingredient.chocolateType;
    fields.cacaoPercentage = ingredient.cacaoPercentage;
    if (ingredient.fluidityStars !== undefined) {
      fields.fluidityStars = ingredient.fluidityStars;
    }
    if (ingredient.viscosityMcM !== undefined) {
      fields.viscosityMcM = ingredient.viscosityMcM;
    }
    if (ingredient.temperatureCurve !== undefined) {
      fields.temperatureCurve = ingredient.temperatureCurve;
    }
    if (ingredient.beanVarieties !== undefined) {
      fields.beanVarieties = ingredient.beanVarieties;
    }
    if (ingredient.applications !== undefined) {
      fields.applications = ingredient.applications;
    }
    if (ingredient.origins !== undefined) {
      fields.origins = ingredient.origins;
    }
  } else if (Entities.Ingredients.isDairyIngredientEntity(ingredient)) {
    if (ingredient.fatContent !== undefined) {
      fields.fatContent = ingredient.fatContent;
    }
    if (ingredient.waterContent !== undefined) {
      fields.waterContent = ingredient.waterContent;
    }
  } else if (Entities.Ingredients.isSugarIngredientEntity(ingredient)) {
    if (ingredient.hydrationNumber !== undefined) {
      fields.hydrationNumber = ingredient.hydrationNumber;
    }
    if (ingredient.sweetnessPotency !== undefined) {
      fields.sweetnessPotency = ingredient.sweetnessPotency;
    }
  } else if (Entities.Ingredients.isFatIngredientEntity(ingredient)) {
    if (ingredient.meltingPoint !== undefined) {
      fields.meltingPoint = ingredient.meltingPoint;
    }
  } else if (Entities.Ingredients.isAlcoholIngredientEntity(ingredient)) {
    if (ingredient.alcoholByVolume !== undefined) {
      fields.alcoholByVolume = ingredient.alcoholByVolume;
    }
    if (ingredient.flavorProfile !== undefined) {
      fields.flavorProfile = ingredient.flavorProfile;
    }
  }

  return fields;
}

/**
 * Validates an ingredient entity through the converter.
 */
function validateIngredient(
  entity: Entities.Ingredients.IngredientEntity
): Result<Entities.Ingredients.IngredientEntity> {
  return Entities.Converters.Ingredients.ingredientEntity
    .convert(entity)
    .withErrorFormat((msg) => `Ingredient validation failed: ${msg}`);
}
