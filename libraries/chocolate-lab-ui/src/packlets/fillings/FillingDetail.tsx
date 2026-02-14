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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PreferredSelector } from '@fgv/ts-app-shell';
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
  const ingredient = resolved.ingredient;
  const amount = resolved.amount;
  const hasAlternates = resolved.alternates.length > 0;

  const [displayedId, setDisplayedId] = useState<IngredientId>(ingredient.id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const pickerBtnRef = useRef<HTMLButtonElement>(null);

  const allIngredients = useMemo(() => {
    const items = [{ id: ingredient.id, label: ingredient.name }];
    for (const alt of resolved.alternates) {
      items.push({ id: alt.id, label: alt.name });
    }
    return items;
  }, [ingredient, resolved.alternates]);

  const displayedName = allIngredients.find((i) => i.id === displayedId)?.label ?? ingredient.name;
  const isPreferred = displayedId === ingredient.id;

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) {
      return;
    }
    const handleClickOutside = (e: MouseEvent): void => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        pickerBtnRef.current &&
        !pickerBtnRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pickerOpen]);

  const handleRowClick = useCallback((): void => {
    if (onClick) {
      onClick(displayedId);
    }
  }, [onClick, displayedId]);

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick(displayedId);
      }
    },
    [onClick, displayedId]
  );

  const handlePickerToggle = useCallback((e: React.MouseEvent): void => {
    e.stopPropagation();
    setPickerOpen((prev) => !prev);
  }, []);

  const handlePickItem = useCallback((id: IngredientId): void => {
    setDisplayedId(id);
    setPickerOpen(false);
  }, []);

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-1.5 py-1.5 pl-0 pr-2 rounded-md ${
          onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
        }`}
        onClick={handleRowClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={handleRowKeyDown}
      >
        {/* Fixed-width left slot for swap icon — keeps names aligned */}
        <span className="w-4 shrink-0 flex items-center justify-center">
          {hasAlternates ? (
            <button
              ref={pickerBtnRef}
              onClick={handlePickerToggle}
              className="text-gray-400 hover:text-choco-accent p-0 transition-colors"
              aria-label="Switch alternate"
              tabIndex={-1}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          ) : null}
        </span>
        <span className="text-sm text-gray-800 flex-1 truncate">
          {displayedName}
          {hasAlternates && isPreferred && <span className="ml-1 text-xs text-amber-500">★</span>}
        </span>
        <span className="text-xs text-gray-500 tabular-nums shrink-0">{amount}g</span>
        {onClick && <span className="text-gray-300 text-xs shrink-0">›</span>}
      </div>

      {/* Alternate picker popover */}
      {pickerOpen && (
        <div
          ref={pickerRef}
          className="absolute right-0 z-50 mt-0.5 min-w-[180px] max-h-[200px] bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col overflow-hidden"
        >
          <div className="px-2.5 py-1 border-b border-gray-100 shrink-0">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Alternates</span>
          </div>
          <div className="overflow-y-auto flex-1">
            {allIngredients.map((item) => {
              const isCurrent = item.id === displayedId;
              const isPref = item.id === ingredient.id;
              return (
                <button
                  key={item.id}
                  onClick={(e): void => {
                    e.stopPropagation();
                    handlePickItem(item.id);
                  }}
                  className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-sm transition-colors ${
                    isCurrent
                      ? 'bg-choco-accent/10 text-choco-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="w-3 shrink-0 text-center text-xs">
                    {isPref ? <span className="text-amber-500">★</span> : ''}
                  </span>
                  <span className="flex-1 min-w-0 truncate">{item.label}</span>
                  {isCurrent && (
                    <svg
                      className="w-3.5 h-3.5 text-choco-accent shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
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
      label: v.variationSpec,
      sublabel: v.createdDate
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
        <PreferredSelector<FillingRecipeVariationSpec>
          items={variationItems}
          selectedId={selectedSpec}
          preferredId={filling.goldenVariationSpec}
          onSelect={setSelectedSpec}
          onCompare={onCompareVariations}
          label="Variations"
        />
      )}

      {/* Variation Info */}
      <DetailSection title={`Variation: ${selectedVariation.variationSpec}`}>
        <DetailRow label="Created" value={selectedVariation.createdDate} />
        <DetailRow label="Base Weight" value={`${selectedVariation.baseWeight}g`} />
        {selectedVariation.yield && <DetailRow label="Yield" value={selectedVariation.yield} />}
      </DetailSection>

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
