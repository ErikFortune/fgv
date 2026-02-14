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
 * Read-only filling recipe detail view with variation selector.
 * @packageDocumentation
 */

import React, { useMemo, useState } from 'react';

import { EntityRow } from '@fgv/ts-app-shell';
import type { LibraryRuntime, Entities } from '@fgv/ts-chocolate';
import type { IngredientId, FillingRecipeVariationSpec } from '@fgv/ts-chocolate';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the FillingDetail component.
 * @public
 */
export interface IFillingDetailProps {
  /** The resolved runtime filling recipe to display */
  readonly filling: LibraryRuntime.FillingRecipe;
  /** Callback when an ingredient is clicked for cascade drill-down */
  readonly onIngredientClick?: (ingredientId: IngredientId) => void;
  /** Callback to compare selected variations side-by-side */
  readonly onCompareVariations?: (specs: ReadonlyArray<FillingRecipeVariationSpec>) => void;
  /** Override the initially selected variation (defaults to golden) */
  readonly defaultVariationSpec?: FillingRecipeVariationSpec;
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
  ganache: 'bg-amber-100 text-amber-800',
  caramel: 'bg-orange-100 text-orange-800',
  gianduja: 'bg-emerald-100 text-emerald-800'
};

function CategoryBadge({ category }: { readonly category: string }): React.ReactElement {
  const colorClass = CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colorClass}`}>
      {category}
    </span>
  );
}

// ============================================================================
// Ingredient Row (clickable for drill-down)
// ============================================================================

function IngredientRow({
  resolved,
  onClick
}: {
  readonly resolved: LibraryRuntime.IResolvedFillingIngredient;
  readonly onClick?: (ingredientId: IngredientId) => void;
}): React.ReactElement {
  const items = useMemo(() => {
    const result = [{ id: resolved.ingredient.id, label: resolved.ingredient.name }];
    for (const alt of resolved.alternates) {
      result.push({ id: alt.id, label: alt.name });
    }
    return result;
  }, [resolved]);

  return (
    <EntityRow<IngredientId>
      items={items}
      preferredId={resolved.ingredient.id}
      onClick={onClick}
      rightContent={<span className="text-xs text-gray-500 tabular-nums shrink-0">{resolved.amount}g</span>}
    />
  );
}

// ============================================================================
// Ratings Section
// ============================================================================

function RatingsSection({
  ratings
}: {
  readonly ratings: ReadonlyArray<Entities.IFillingRating>;
}): React.ReactElement | null {
  if (ratings.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Ratings">
      {ratings.map((r) => (
        <DetailRow
          key={r.category}
          label={r.category}
          value={'★'.repeat(r.score) + '☆'.repeat(5 - r.score)}
        />
      ))}
    </DetailSection>
  );
}

// ============================================================================
// FillingDetail Component
// ============================================================================

/**
 * Read-only detail view for a filling recipe.
 *
 * Displays:
 * - Header with name, category badge, description
 * - Variation selector (when multiple variations exist)
 * - Ingredient list for the selected variation (clickable for drill-down)
 * - Base weight and yield
 * - Ratings
 * - Tags
 *
 * @public
 */
export function FillingDetail(props: IFillingDetailProps): React.ReactElement {
  const { filling, onIngredientClick, onCompareVariations, defaultVariationSpec } = props;

  // Track selected variation (default to golden or override)
  const [selectedSpec, setSelectedSpec] = useState<FillingRecipeVariationSpec>(
    defaultVariationSpec ?? filling.goldenVariationSpec
  );

  // Get the selected variation
  const selectedVariation = useMemo<LibraryRuntime.FillingRecipeVariation>(() => {
    const result = filling.getVariation(selectedSpec);
    if (result.isSuccess()) {
      return result.value;
    }
    // Fall back to golden if selected variation not found
    return filling.goldenVariation;
  }, [filling, selectedSpec]);

  // Build variation items for PreferredSelector
  const variationItems = useMemo(() => {
    return filling.variations.map((v) => ({
      id: v.variationSpec,
      label: v.variationSpec
    }));
  }, [filling]);

  // Resolve ingredients for the selected variation
  const ingredients = useMemo<ReadonlyArray<LibraryRuntime.IResolvedFillingIngredient>>(() => {
    const result = selectedVariation.getIngredients();
    if (result.isSuccess()) {
      return Array.from(result.value);
    }
    return [];
  }, [selectedVariation]);

  return (
    <div className="flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-choco-primary">{filling.name}</h3>
          <CategoryBadge category={filling.entity.category} />
        </div>
        {filling.description && <p className="text-sm text-gray-600 mt-1">{filling.description}</p>}
        <p className="text-xs text-gray-400 mt-1 font-mono">{filling.id}</p>
      </div>

      {/* Variation Selector */}
      {filling.variations.length > 1 && (
        <div className="mb-4">
          <EntityRow<FillingRecipeVariationSpec>
            items={variationItems}
            selectedId={selectedSpec}
            preferredId={filling.goldenVariationSpec}
            onSelect={setSelectedSpec}
            onCompare={onCompareVariations}
            label="Variations"
          />
          <div className="pl-[22px] mt-1 text-sm text-gray-600">
            Yield: {selectedVariation.baseWeight}g
            {selectedVariation.yield && <span className="text-gray-400"> ({selectedVariation.yield})</span>}
          </div>
        </div>
      )}

      {/* Variation Info (single-variation fallback) */}
      {filling.variations.length <= 1 && (
        <DetailSection title="Recipe">
          <DetailRow label="Created" value={selectedVariation.createdDate} />
          <DetailRow label="Base Weight" value={`${selectedVariation.baseWeight}g`} />
          {selectedVariation.yield && <DetailRow label="Yield" value={selectedVariation.yield} />}
        </DetailSection>
      )}

      {/* Ingredients */}
      <DetailSection title={`Ingredients (${ingredients.length})`}>
        <div className="divide-y divide-gray-100">
          {ingredients.map((ri) => (
            <IngredientRow key={ri.ingredient.id} resolved={ri} onClick={onIngredientClick} />
          ))}
        </div>
        {ingredients.length === 0 && <p className="text-xs text-gray-400 italic">No ingredients resolved.</p>}
      </DetailSection>

      {/* Ratings */}
      <RatingsSection ratings={selectedVariation.ratings} />

      {/* Tags */}
      {filling.tags.length > 0 && (
        <DetailSection title="Tags">
          <TagList tags={filling.tags} />
        </DetailSection>
      )}

      {/* Variation count summary */}
      {filling.variationCount > 1 && (
        <p className="text-xs text-gray-400 mt-2">
          {filling.variationCount} variation{filling.variationCount > 1 ? 's' : ''} · golden:{' '}
          {filling.goldenVariationSpec}
        </p>
      )}
    </div>
  );
}
