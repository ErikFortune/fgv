/*
 * Copyright (c) 2026 Erik Fortune
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

/**
 * Read-only ingredient detail view.
 * @packageDocumentation
 */

import React from 'react';

import type { LibraryRuntime } from '@fgv/ts-chocolate';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the IngredientDetail component.
 * @public
 */
export interface IIngredientDetailProps {
  /** The resolved runtime ingredient to display */
  readonly ingredient: LibraryRuntime.AnyIngredient;
}

// ============================================================================
// Section Helpers
// ============================================================================

function DetailSection({
  title,
  children
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{title}</h4>
      {children}
    </div>
  );
}

function DetailRow({
  label,
  value
}: {
  readonly label: string;
  readonly value: React.ReactNode;
}): React.ReactElement | null {
  if (value === undefined || value === null) {
    return null;
  }
  return (
    <div className="flex items-baseline gap-2 py-0.5">
      <span className="text-xs text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

function TagList({ tags }: { readonly tags: ReadonlyArray<string> }): React.ReactElement | null {
  if (tags.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span key={tag} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
          {tag}
        </span>
      ))}
    </div>
  );
}

// ============================================================================
// Category Badge
// ============================================================================

const CATEGORY_COLORS: Record<string, string> = {
  chocolate: 'bg-amber-100 text-amber-800',
  dairy: 'bg-blue-100 text-blue-800',
  sugar: 'bg-pink-100 text-pink-800',
  fat: 'bg-yellow-100 text-yellow-800',
  alcohol: 'bg-purple-100 text-purple-800',
  liquid: 'bg-cyan-100 text-cyan-800',
  flavor: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800'
};

function CategoryBadge({ category }: { readonly category: string }): React.ReactElement {
  const colorClass = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colorClass}`}>
      {category}
    </span>
  );
}

// ============================================================================
// Ganache Characteristics
// ============================================================================

function GanacheSection({
  ingredient
}: {
  readonly ingredient: LibraryRuntime.AnyIngredient;
}): React.ReactElement {
  const gc = ingredient.ganacheCharacteristics;
  return (
    <DetailSection title="Ganache Characteristics">
      <DetailRow label="Cacao Fat" value={`${gc.cacaoFat}%`} />
      <DetailRow label="Sugar" value={`${gc.sugar}%`} />
      <DetailRow label="Milk Fat" value={`${gc.milkFat}%`} />
      <DetailRow label="Water" value={`${gc.water}%`} />
      <DetailRow label="Solids" value={`${gc.solids}%`} />
      <DetailRow label="Other Fats" value={`${gc.otherFats}%`} />
    </DetailSection>
  );
}

// ============================================================================
// Chocolate-Specific Section
// ============================================================================

function ChocolateSection({
  ingredient
}: {
  readonly ingredient: LibraryRuntime.ChocolateIngredient;
}): React.ReactElement {
  return (
    <DetailSection title="Chocolate Properties">
      <DetailRow label="Type" value={ingredient.chocolateType} />
      <DetailRow label="Cacao %" value={`${ingredient.cacaoPercentage}%`} />
      <DetailRow
        label="Fluidity"
        value={ingredient.fluidityStars !== undefined ? `${ingredient.fluidityStars} stars` : undefined}
      />
      <DetailRow
        label="Viscosity"
        value={ingredient.viscosityMcM !== undefined ? `${ingredient.viscosityMcM} McM` : undefined}
      />
      {ingredient.beanVarieties && ingredient.beanVarieties.length > 0 && (
        <DetailRow label="Bean Varieties" value={ingredient.beanVarieties.join(', ')} />
      )}
      {ingredient.origins && ingredient.origins.length > 0 && (
        <DetailRow label="Origins" value={ingredient.origins.join(', ')} />
      )}
      {ingredient.applications && ingredient.applications.length > 0 && (
        <DetailRow label="Applications" value={ingredient.applications.join(', ')} />
      )}
    </DetailSection>
  );
}

// ============================================================================
// IngredientDetail Component
// ============================================================================

/**
 * Read-only detail view for an ingredient.
 *
 * Displays:
 * - Header with name, category badge, manufacturer
 * - Description
 * - Ganache characteristics
 * - Category-specific properties (chocolate type, cacao %, etc.)
 * - Tags, allergens, certifications
 *
 * @public
 */
export function IngredientDetail(props: IIngredientDetailProps): React.ReactElement {
  const { ingredient } = props;

  return (
    <div className="flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-choco-primary">{ingredient.name}</h3>
          <CategoryBadge category={ingredient.category} />
        </div>
        {ingredient.manufacturer && <p className="text-sm text-gray-500">{ingredient.manufacturer}</p>}
        {ingredient.description && <p className="text-sm text-gray-600 mt-1">{ingredient.description}</p>}
        <p className="text-xs text-gray-400 mt-1 font-mono">{ingredient.id}</p>
      </div>

      {/* Ganache Characteristics */}
      <GanacheSection ingredient={ingredient} />

      {/* Chocolate-specific properties */}
      {ingredient.isChocolate() && <ChocolateSection ingredient={ingredient} />}

      {/* Tags */}
      {ingredient.tags.length > 0 && (
        <DetailSection title="Tags">
          <TagList tags={ingredient.tags} />
        </DetailSection>
      )}

      {/* Allergens */}
      {ingredient.allergens.length > 0 && (
        <DetailSection title="Allergens">
          <TagList tags={ingredient.allergens} />
        </DetailSection>
      )}

      {/* Trace Allergens */}
      {ingredient.traceAllergens.length > 0 && (
        <DetailSection title="Trace Allergens">
          <TagList tags={ingredient.traceAllergens} />
        </DetailSection>
      )}

      {/* Certifications */}
      {ingredient.certifications.length > 0 && (
        <DetailSection title="Certifications">
          <TagList tags={ingredient.certifications} />
        </DetailSection>
      )}

      {/* Vegan */}
      {ingredient.vegan !== undefined && <DetailRow label="Vegan" value={ingredient.vegan ? 'Yes' : 'No'} />}
    </div>
  );
}
