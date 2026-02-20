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

import React, { useCallback, useMemo, useState } from 'react';
import { EyeIcon, PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ClipboardDocumentIcon } from '@heroicons/react/20/solid';

import { EntityRow, DetailSection, DetailRow, TagList, StatusBadge, DetailHeader } from '@fgv/ts-app-shell';
import type { LibraryRuntime, Entities } from '@fgv/ts-chocolate';
import { LibraryRuntime as LR } from '@fgv/ts-chocolate';
import type { IngredientId, FillingRecipeVariationSpec, ProcedureId } from '@fgv/ts-chocolate';
import { formatIngredientAmount, formatScaledIngredientAmount, copyJsonToClipboard } from '../common';

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
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
  /** Target yield in grams for scaling ingredient quantities */
  readonly targetYield?: number;
  /** Callback when the user changes the target yield */
  readonly onTargetYieldChange?: (grams: number | undefined) => void;
}

// ============================================================================
// Category Colors
// ============================================================================

const CATEGORY_COLORS: Record<string, string> = {
  ganache: 'bg-amber-100 text-amber-800',
  caramel: 'bg-orange-100 text-orange-800',
  gianduja: 'bg-emerald-100 text-emerald-800'
};

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
    onClose,
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

  // Copy JSON: recipe metadata + selected variation only
  const [copied, setCopied] = useState(false);
  const handleCopyJson = useCallback((): void => {
    copyJsonToClipboard({
      ...filling.entity,
      variations: [selectedVariation.entity],
      goldenVariationSpec: selectedSpec
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [filling, selectedVariation, selectedSpec]);

  return (
    <div className="flex flex-col p-4 overflow-y-auto h-full">
      {/* Header */}
      <DetailHeader
        title={filling.name}
        subtitle={filling.id}
        description={filling.description}
        indicators={
          <StatusBadge
            label={filling.entity.category}
            colorClass={CATEGORY_COLORS[filling.entity.category] ?? 'bg-gray-100 text-gray-800'}
          />
        }
        actions={
          <>
            <button
              type="button"
              onClick={handleCopyJson}
              className="p-1 text-gray-400 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
              title={copied ? 'Copied!' : 'Copy JSON to clipboard'}
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
            </button>
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
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Close"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </>
        }
      />

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
