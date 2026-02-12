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

import { LibraryRuntime } from '@fgv/ts-chocolate';

import { formatNumber, formatUrls, padRight } from '../../shared/outputFormatter';
import { IEntityAction, IRenderContext, IRenderResult } from './rendererTypes';

/**
 * Renders a one-line summary for an ingredient (for list display).
 */
export function renderIngredientSummary(ingredient: LibraryRuntime.IIngredient): string {
  const categoryInfo = ingredient.isChocolate()
    ? `${ingredient.category}:${ingredient.chocolateType}`
    : ingredient.category;
  return `${ingredient.id} - ${ingredient.name} [${categoryInfo}]`;
}

/**
 * Renders a full detail view for an ingredient.
 */
export function renderIngredientDetail(
  ingredient: LibraryRuntime.IIngredient,
  context: IRenderContext
): IRenderResult {
  const lines: string[] = [];
  const actions: IEntityAction[] = [];

  lines.push(`Ingredient: ${ingredient.name}`);
  lines.push(`ID: ${ingredient.id}`);
  lines.push(`Category: ${ingredient.category}`);

  if (ingredient.manufacturer) {
    lines.push(`Manufacturer: ${ingredient.manufacturer}`);
  }

  if (ingredient.description) {
    lines.push(`Description: ${ingredient.description}`);
  }

  if (ingredient.tags && ingredient.tags.length > 0) {
    lines.push(`Tags: ${ingredient.tags.join(', ')}`);
  }

  // Chocolate-specific information
  if (ingredient.isChocolate()) {
    lines.push('');
    lines.push('Chocolate Details:');
    lines.push(`  Type: ${ingredient.chocolateType}`);
    lines.push(`  Cacao: ${ingredient.cacaoPercentage}%`);

    if (ingredient.fluidityStars !== undefined) {
      lines.push(`  Fluidity: ${ingredient.fluidityStars} stars`);
    }

    if (ingredient.viscosityMcM !== undefined) {
      lines.push(`  Viscosity: ${ingredient.viscosityMcM} McM`);
    }

    if (ingredient.applications && ingredient.applications.length > 0) {
      lines.push(`  Applications: ${ingredient.applications.join(', ')}`);
    }

    if (ingredient.origins && ingredient.origins.length > 0) {
      lines.push(`  Origins: ${ingredient.origins.join(', ')}`);
    }

    if (ingredient.beanVarieties && ingredient.beanVarieties.length > 0) {
      lines.push(`  Bean Varieties: ${ingredient.beanVarieties.join(', ')}`);
    }

    if (ingredient.temperatureCurve) {
      lines.push('');
      lines.push('Tempering Curve:');
      lines.push(`  Melt: ${ingredient.temperatureCurve.melt}\u00B0C`);
      lines.push(`  Cool: ${ingredient.temperatureCurve.cool}\u00B0C`);
      lines.push(`  Working: ${ingredient.temperatureCurve.working}\u00B0C`);
    }
  }

  // Sugar-specific information
  if (ingredient.isSugar()) {
    if (ingredient.sweetnessPotency !== undefined) {
      lines.push(`Sweetness Potency: ${ingredient.sweetnessPotency}x (vs sucrose)`);
    }
    if (ingredient.hydrationNumber !== undefined) {
      lines.push(`Hydration Number: ${ingredient.hydrationNumber}`);
    }
  }

  // Dairy-specific information
  if (ingredient.isDairy()) {
    if (ingredient.fatContent !== undefined) {
      lines.push(`Fat Content: ${ingredient.fatContent}%`);
    }
    if (ingredient.waterContent !== undefined) {
      lines.push(`Water Content: ${ingredient.waterContent}%`);
    }
  }

  // Fat-specific information
  if (ingredient.isFat()) {
    if (ingredient.meltingPoint !== undefined) {
      lines.push(`Melting Point: ${ingredient.meltingPoint}\u00B0C`);
    }
  }

  // Alcohol-specific information
  if (ingredient.isAlcohol()) {
    if (ingredient.alcoholByVolume !== undefined) {
      lines.push(`ABV: ${ingredient.alcoholByVolume}%`);
    }
    if (ingredient.flavorProfile) {
      lines.push(`Flavor Profile: ${ingredient.flavorProfile}`);
    }
  }

  // Ganache characteristics
  const gc = ingredient.ganacheCharacteristics;
  lines.push('');
  lines.push('Ganache Characteristics:');
  lines.push(`  ${padRight('Cacao Fat:', 14)} ${formatNumber(gc.cacaoFat, 1)}%`);
  lines.push(`  ${padRight('Sugar:', 14)} ${formatNumber(gc.sugar, 1)}%`);
  lines.push(`  ${padRight('Milk Fat:', 14)} ${formatNumber(gc.milkFat, 1)}%`);
  lines.push(`  ${padRight('Water:', 14)} ${formatNumber(gc.water, 1)}%`);
  lines.push(`  ${padRight('Solids:', 14)} ${formatNumber(gc.solids, 1)}%`);
  lines.push(`  ${padRight('Other Fats:', 14)} ${formatNumber(gc.otherFats, 1)}%`);

  // Allergens
  if (ingredient.allergens && ingredient.allergens.length > 0) {
    lines.push('');
    lines.push(`Allergens: ${ingredient.allergens.join(', ')}`);
  }

  if (ingredient.traceAllergens && ingredient.traceAllergens.length > 0) {
    lines.push(`Trace Allergens: ${ingredient.traceAllergens.join(', ')}`);
  }

  // Certifications
  if (ingredient.certifications && ingredient.certifications.length > 0) {
    lines.push('');
    lines.push(`Certifications: ${ingredient.certifications.join(', ')}`);
  }

  if (ingredient.vegan !== undefined) {
    lines.push(`Vegan: ${ingredient.vegan ? 'Yes' : 'No'}`);
  }

  // URLs from entity
  if (ingredient.entity.urls && ingredient.entity.urls.length > 0) {
    formatUrls(ingredient.entity.urls, lines);
  }

  // Build actions: fillings using this ingredient
  const usedByFillings = ingredient.usedByFillings();
  if (usedByFillings.length > 0) {
    actions.push({
      label: `View fillings using this ingredient (${usedByFillings.length})`,
      key: 'view-fillings',
      description: `${usedByFillings.length} filling(s) use this ingredient`
    });
  }

  return { text: lines.join('\n'), actions };
}
