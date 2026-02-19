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
import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

import { EntityRow } from '@fgv/ts-app-shell';
import type { LibraryRuntime, Entities, Measurement, MeasurementUnit } from '@fgv/ts-chocolate';
import { LibraryRuntime as LR } from '@fgv/ts-chocolate';
import type { IngredientId, FillingRecipeVariationSpec, ProcedureId } from '@fgv/ts-chocolate';

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
  /** Callback when a procedure is clicked for cascade drill-down */
  readonly onProcedureClick?: (procedureId: ProcedureId) => void;
  /** Callback to compare selected variations side-by-side */
  readonly onCompareVariations?: (specs: ReadonlyArray<FillingRecipeVariationSpec>) => void;
  /** Override the initially selected variation (defaults to golden) */
  readonly defaultVariationSpec?: FillingRecipeVariationSpec;
  /** Optional callback to enter edit mode for the currently viewed variation */
  readonly onEdit?: (variationSpec: FillingRecipeVariationSpec) => void;
  /** Optional callback to open the preview pane */
  readonly onPreview?: () => void;
  /** Target yield in grams for scaling ingredient quantities */
  readonly targetYield?: number;
  /** Callback when the user changes the target yield */
  readonly onTargetYieldChange?: (grams: number | undefined) => void;
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
// Amount Formatting
// ============================================================================

function formatIngredientAmount(
  amount: number,
  unit?: MeasurementUnit,
  modifiers?: Entities.Fillings.IIngredientModifiers
): string {
  const u = unit ?? 'g';
  const result = LR.Internal.scaleAmount(amount as Measurement, u, 1.0);
  const base = result.isSuccess() ? result.value.displayValue : `${amount}${u}`;
  if (modifiers?.toTaste) return `${base}, to taste`;
  if (modifiers?.spoonLevel) return `${base} (${modifiers.spoonLevel})`;
  return base;
}

function formatScaledIngredientAmount(
  amount: number,
  unit?: MeasurementUnit,
  scaleFactor?: number,
  modifiers?: Entities.Fillings.IIngredientModifiers
): string {
  if (scaleFactor === undefined) return formatIngredientAmount(amount, unit, modifiers);
  const u = unit ?? 'g';
  const result = LR.Internal.scaleAmount(amount as Measurement, u, scaleFactor);
  const base = result.isSuccess()
    ? result.value.displayValue
    : formatIngredientAmount(amount * scaleFactor, u);
  if (modifiers?.toTaste) return `${base}, to taste`;
  if (modifiers?.spoonLevel) return `${base} (${modifiers.spoonLevel})`;
  return base;
}

// ============================================================================
// Ingredient Row (clickable for drill-down)
// ============================================================================

function IngredientRow({
  resolved,
  onClick,
  scaleFactor
}: {
  readonly resolved: LibraryRuntime.IResolvedFillingIngredient;
  readonly onClick?: (ingredientId: IngredientId) => void;
  readonly scaleFactor?: number;
}): React.ReactElement {
  const items = useMemo(() => {
    const result = [{ id: resolved.ingredient.id, label: resolved.ingredient.name }];
    for (const alt of resolved.alternates) {
      result.push({ id: alt.id, label: alt.name });
    }
    return result;
  }, [resolved]);

  const displayAmount = formatScaledIngredientAmount(
    resolved.amount,
    resolved.entity.unit,
    scaleFactor,
    resolved.entity.modifiers
  );

  const processNote = resolved.entity.modifiers?.processNote;
  const yieldFactor = resolved.entity.modifiers?.yieldFactor;
  const unit = resolved.entity.unit ?? 'g';
  const hasYield = yieldFactor !== undefined && yieldFactor !== 1.0 && (unit === 'g' || unit === 'mL');
  const contributedAmount = hasYield
    ? formatIngredientAmount(resolved.amount * (yieldFactor ?? 1), unit)
    : undefined;

  return (
    <div>
      <EntityRow<IngredientId>
        items={items}
        preferredId={resolved.ingredient.id}
        onClick={onClick}
        rightContent={<span className="text-xs text-gray-500 tabular-nums shrink-0">{displayAmount}</span>}
      />
      {hasYield && (
        <div className="flex items-baseline justify-between pl-[22px] pr-2 -mt-1 mb-1">
          <span className="text-xs text-gray-400 italic">
            {processNote ? `${processNote} (×${yieldFactor!.toFixed(2)})` : `×${yieldFactor!.toFixed(2)}`}
          </span>
          <span className="text-xs text-gray-400 tabular-nums">{contributedAmount}</span>
        </div>
      )}
      {!hasYield && processNote && (
        <div className="pl-[22px] pr-2 -mt-1 mb-1">
          <span className="text-xs text-gray-400 italic">{processNote}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Procedures Section
// ============================================================================

function ProceduresSection({
  procedures,
  onProcedureClick
}: {
  readonly procedures: LibraryRuntime.IResolvedProcedures;
  readonly onProcedureClick?: (id: ProcedureId) => void;
}): React.ReactElement {
  const items = useMemo(() => {
    return procedures.procedures.map((p) => ({
      id: p.id,
      label: p.procedure.name,
      sublabel: p.procedure.category
    }));
  }, [procedures]);

  const preferredId = procedures.recommendedProcedure?.id;

  return (
    <DetailSection title="Procedures">
      <EntityRow<ProcedureId> items={items} preferredId={preferredId} onClick={onProcedureClick} />
    </DetailSection>
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
  const {
    filling,
    onIngredientClick,
    onProcedureClick,
    onCompareVariations,
    defaultVariationSpec,
    onEdit,
    onPreview,
    targetYield,
    onTargetYieldChange
  } = props;

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
      label: v.name ?? v.variationSpec
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

  // Compute scale factor and ProducedFilling-based scaled amounts
  const scaleFactor = useMemo<number | undefined>(() => {
    if (targetYield === undefined || selectedVariation.baseWeight <= 0) return undefined;
    const factor = targetYield / selectedVariation.baseWeight;
    return Math.abs(factor - 1.0) < 0.001 ? undefined : factor;
  }, [targetYield, selectedVariation]);

  const scaledAmounts = useMemo<ReadonlyArray<number> | undefined>(() => {
    if (scaleFactor === undefined) return undefined;
    const result = LR.ProducedFilling.fromSource(selectedVariation, scaleFactor);
    if (!result.isSuccess()) return undefined;
    return result.value.ingredients.map((ing) => ing.amount);
  }, [selectedVariation, scaleFactor]);

  // Per-ingredient scale factor for display (uses ProducedFilling amounts when available)
  const ingredientScaleFactors = useMemo<ReadonlyArray<number | undefined>>(() => {
    if (scaledAmounts === undefined || scaleFactor === undefined) {
      return ingredients.map(() => undefined);
    }
    return ingredients.map((ing, i) => {
      const scaledAmount = scaledAmounts[i];
      if (scaledAmount === undefined) return scaleFactor;
      // Detect non-scaling units: if scaled == original, pass undefined (no scaling indicator)
      return Math.abs(scaledAmount - ing.amount) < 0.001 ? undefined : scaledAmount / ing.amount;
    });
  }, [ingredients, scaledAmounts, scaleFactor]);

  // Local state for the yield input string
  const [yieldInputValue, setYieldInputValue] = useState<string>(
    targetYield !== undefined ? String(targetYield) : ''
  );

  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-choco-primary flex-1">{filling.name}</h3>
          <CategoryBadge category={filling.entity.category} />
          {onPreview && (
            <button
              type="button"
              onClick={onPreview}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
              title="Preview filling"
            >
              <EyeIcon className="w-4 h-4" />
              Preview
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={(): void => onEdit(selectedSpec)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
              title="Edit filling"
            >
              <PencilSquareIcon className="w-4 h-4" />
              Edit
            </button>
          )}
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
            Yield: {formatIngredientAmount(selectedVariation.baseWeight, 'g')}
            {selectedVariation.yield && <span className="text-gray-400"> ({selectedVariation.yield})</span>}
          </div>
        </div>
      )}

      {/* Variation Info (single-variation fallback) */}
      {filling.variations.length <= 1 && (
        <DetailSection title="Recipe">
          <DetailRow
            label="Created"
            value={new Date(selectedVariation.createdDate).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          />
          <DetailRow label="Base Weight" value={formatIngredientAmount(selectedVariation.baseWeight, 'g')} />
          {selectedVariation.yield && <DetailRow label="Yield" value={selectedVariation.yield} />}
        </DetailSection>
      )}

      {/* Target Yield Scaler */}
      {onTargetYieldChange && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-gray-500 shrink-0">Scale to</span>
          <input
            type="number"
            min={1}
            step={10}
            className="w-24 text-sm border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-choco-primary tabular-nums"
            value={yieldInputValue}
            placeholder={String(Math.round(selectedVariation.baseWeight))}
            onChange={(e): void => setYieldInputValue(e.target.value)}
            onBlur={(): void => {
              const num = parseFloat(yieldInputValue);
              if (!isNaN(num) && num > 0) {
                onTargetYieldChange(num);
              } else {
                setYieldInputValue('');
                onTargetYieldChange(undefined);
              }
            }}
            onKeyDown={(e): void => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              } else if (e.key === 'Escape') {
                setYieldInputValue(targetYield !== undefined ? String(targetYield) : '');
                onTargetYieldChange(undefined);
              }
            }}
          />
          <span className="text-xs text-gray-500">g</span>
          {scaleFactor !== undefined && (
            <span className="text-xs text-amber-600 font-medium">×{scaleFactor.toFixed(2)}</span>
          )}
          {yieldInputValue && (
            <button
              type="button"
              onClick={(): void => {
                setYieldInputValue('');
                onTargetYieldChange(undefined);
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
              title="Reset to base weight"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Ingredients */}
      <DetailSection title={`Ingredients (${ingredients.length})`}>
        <div className="divide-y divide-gray-100">
          {ingredients.map((ri, i) => (
            <IngredientRow
              key={ri.ingredient.id}
              resolved={ri}
              onClick={onIngredientClick}
              scaleFactor={ingredientScaleFactors[i]}
            />
          ))}
        </div>
        {ingredients.length === 0 && <p className="text-xs text-gray-400 italic">No ingredients resolved.</p>}
      </DetailSection>

      {/* Procedures */}
      {selectedVariation.procedures && (
        <ProceduresSection procedures={selectedVariation.procedures} onProcedureClick={onProcedureClick} />
      )}

      {/* Ratings */}
      <RatingsSection ratings={selectedVariation.ratings} />

      {/* Notes */}
      {selectedVariation.notes && selectedVariation.notes.length > 0 && (
        <DetailSection title="Notes">
          {selectedVariation.notes.map((note, i) => (
            <div key={i} className="text-sm text-gray-700 mb-1">
              <span className="text-xs text-gray-400 mr-1">[{note.category}]</span>
              {note.note}
            </div>
          ))}
        </DetailSection>
      )}

      {/* Tags */}
      {filling.tags.length > 0 && (
        <DetailSection title="Tags">
          <TagList tags={filling.tags} />
        </DetailSection>
      )}
    </div>
  );
}
