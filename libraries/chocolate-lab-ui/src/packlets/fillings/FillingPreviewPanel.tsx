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
 * Filling recipe preview panel - printed recipe sheet format.
 * @packageDocumentation
 */

import React, { useCallback, useMemo } from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';

import { openPrintWindow } from '@fgv/ts-app-shell';

import type { Entities, FillingRecipeVariationSpec, LibraryRuntime } from '@fgv/ts-chocolate';
import { LibraryRuntime as LR } from '@fgv/ts-chocolate';

import { renderPreview } from '../tasks';
import {
  formatIngredientAmount,
  formatScaledIngredientAmount,
  groupByRole,
  RoleGroupHeader
} from '../common';
import {
  useGanacheCalculation,
  GanacheCharacteristicsDisplay,
  CollapsibleGanacheSection
} from './GanacheAnalysisSection';

// ============================================================================
// Props
// ============================================================================

export interface IFillingPreviewPanelProps {
  readonly filling: LibraryRuntime.FillingRecipe;
  readonly draftEntity?: Entities.Fillings.IFillingRecipeEntity;
  /** Variation to preview (defaults to golden variation) */
  readonly variationSpec?: FillingRecipeVariationSpec;
  readonly targetYield?: number;
  readonly onClose?: () => void;
  /** When true, renders for print layout: no buttons, no scroll constraints, page-break hints. */
  readonly printMode?: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

function formatResolvedStepTiming(step: LibraryRuntime.IResolvedProcedureStep): string | undefined {
  const parts: string[] = [];
  if (step.activeTime !== undefined) {
    parts.push(`${step.activeTime}min active`);
  }
  if (step.waitTime !== undefined) {
    parts.push(`${step.waitTime}min wait`);
  }
  if (step.holdTime !== undefined) {
    parts.push(`${step.holdTime}min hold`);
  }
  if (step.temperature !== undefined) {
    parts.push(`${step.temperature}°C`);
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

// ============================================================================
// FillingPreviewPanel Component
// ============================================================================

export function FillingPreviewPanel(props: IFillingPreviewPanelProps): React.ReactElement {
  const { filling, draftEntity, variationSpec, targetYield, onClose, printMode } = props;

  const entity = draftEntity ?? filling.entity;

  // Use requested variation, falling back to golden
  const selectedSpec = variationSpec ?? entity.goldenVariationSpec;
  const variation = useMemo(() => {
    const result = filling.getVariation(selectedSpec);
    return result.isSuccess() ? result.value : filling.goldenVariation;
  }, [filling, selectedSpec]);
  const variationEntity = entity.variations.find((v) => v.variationSpec === selectedSpec);

  const ganacheCalc = useGanacheCalculation(variation);

  const ingredientsResult = variation.getIngredients();
  const ingredients = ingredientsResult.isSuccess() ? Array.from(ingredientsResult.value) : [];

  const selectedProcedure = variation.preferredProcedure;
  const stepsResult = selectedProcedure?.procedure.getSteps();
  const steps = stepsResult?.isSuccess() ? stepsResult.value : [];

  const ratings = variationEntity?.ratings ?? [];
  const notes = variationEntity?.notes ?? [];

  // Variation display name (show when not the golden variation or when there are multiple)
  const variationLabel = useMemo(() => {
    if (entity.variations.length <= 1) return undefined;
    return variationEntity?.name ?? selectedSpec;
  }, [entity.variations.length, variationEntity, selectedSpec]);

  // Open a popup window with the recipe in print-optimized layout
  const handlePrint = useCallback((): void => {
    openPrintWindow(
      <FillingPreviewPanel
        filling={filling}
        draftEntity={draftEntity}
        variationSpec={variationSpec}
        targetYield={targetYield}
        printMode={true}
      />,
      { title: `Print: ${entity.name}` }
    );
  }, [filling, draftEntity, variationSpec, targetYield, entity.name]);

  // Compute scaling via ProducedFilling (handles non-scaling units correctly)
  const scaleFactor = useMemo<number | undefined>(() => {
    if (targetYield === undefined || variation.baseWeight <= 0) return undefined;
    const factor = targetYield / variation.baseWeight;
    return Math.abs(factor - 1.0) < 0.001 ? undefined : factor;
  }, [targetYield, variation]);

  const scaledAmounts = useMemo<ReadonlyArray<number> | undefined>(() => {
    if (scaleFactor === undefined) return undefined;
    const result = LR.ProducedFilling.fromSource(variation, scaleFactor);
    if (!result.isSuccess()) return undefined;
    return result.value.ingredients.map((ing) => ing.amount);
  }, [variation, scaleFactor]);

  return (
    <div className={printMode ? 'p-4 bg-surface-alt' : 'p-4 overflow-y-auto h-full bg-surface-alt'}>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">{entity.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted uppercase tracking-wide">Filling Recipe</p>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cat-ganache-bg text-cat-ganache-text">
              {entity.category}
            </span>
            {variationLabel && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cat-dairy-bg text-cat-dairy-text">
                {variationLabel}
              </span>
            )}
          </div>
        </div>
        {!printMode && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="p-1 text-muted hover:text-secondary hover:bg-hover rounded transition-colors"
              title="Print recipe"
            >
              <PrinterIcon className="w-5 h-5" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-muted hover:text-secondary hover:bg-hover rounded transition-colors"
                title="Close preview"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {entity.description && (
        <div className="mb-6 p-3 bg-status-warning-bg border-l-4 border-status-warning-btn rounded-r">
          <p className="text-sm text-secondary italic">{entity.description}</p>
        </div>
      )}

      {/* Yield / Base Weight */}
      {variationEntity && (
        <div className="mb-6 flex items-center gap-6 bg-surface rounded-lg border border-border px-4 py-3">
          <div>
            <span className="text-xs text-muted uppercase tracking-wide block">Base Weight</span>
            <span className="text-lg font-semibold text-primary">
              {formatIngredientAmount(variationEntity.baseWeight, 'g')}
            </span>
          </div>
          {variationEntity.yield && (
            <div>
              <span className="text-xs text-muted uppercase tracking-wide block">Yield</span>
              <span className="text-lg font-semibold text-primary">{variationEntity.yield}</span>
            </div>
          )}
          {scaleFactor !== undefined && targetYield !== undefined && (
            <div className="ml-auto">
              <span className="text-xs text-muted uppercase tracking-wide block">Scaled To</span>
              <span className="text-lg font-semibold text-status-warning-strong">{targetYield}g</span>
              <span className="text-xs text-status-warning-strong ml-1">×{scaleFactor.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Ganache Analysis */}
      {ganacheCalc && (
        <div className="mb-6">
          <CollapsibleGanacheSection category={entity.category}>
            <GanacheCharacteristicsDisplay calculation={ganacheCalc} variant="preview" />
          </CollapsibleGanacheSection>
        </div>
      )}

      {/* Ingredients Section */}
      {ingredients.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Ingredients</h3>
            <span className="text-xs text-muted">{ingredients.length} items</span>
          </div>
          <div className="bg-surface rounded-lg border border-border divide-y divide-border-subtle">
            {groupByRole(ingredients, (ing) => ing.role).map((group) => (
              <React.Fragment key={group.role ?? '__default__'}>
                <RoleGroupHeader label={group.label} className="px-4 pt-1" />
                {group.items.map(({ item: ing, originalIndex }) => {
                  const unit = ing.entity.unit;
                  const modifiers = ing.entity.modifiers;
                  const rawScaled = scaledAmounts?.[originalIndex];
                  const isScaled =
                    scaleFactor !== undefined &&
                    rawScaled !== undefined &&
                    Math.abs(rawScaled - ing.amount) >= 0.001;
                  const displayAmount = isScaled
                    ? formatScaledIngredientAmount(ing.amount, unit, scaleFactor, modifiers)
                    : formatIngredientAmount(ing.amount, unit, modifiers);
                  const processNote = ing.entity.modifiers?.processNote;
                  const yieldFactor = ing.entity.modifiers?.yieldFactor;
                  const ingUnit = ing.entity.unit ?? 'g';
                  const hasYield =
                    yieldFactor !== undefined && yieldFactor !== 1.0 && (ingUnit === 'g' || ingUnit === 'mL');
                  const contributedAmount = hasYield
                    ? formatIngredientAmount(ing.amount * (yieldFactor ?? 1), ingUnit)
                    : undefined;
                  return (
                    <div
                      key={ing.slotId ? `${ing.ingredient.id}:${ing.slotId}` : ing.ingredient.id}
                      className="hover:bg-hover"
                    >
                      <div className="px-4 py-2.5 flex items-start justify-between">
                        <div className="flex-1">
                          <span className="text-sm font-medium text-primary">
                            {ing.ingredient.name}
                            {ing.role && (
                              <span className="ml-1 text-xs font-normal text-muted">({ing.role})</span>
                            )}
                          </span>
                          {ing.alternates.length > 0 && (
                            <span className="ml-2 text-xs text-status-warning-strong">
                              or {ing.alternates.map((alt) => alt.name).join(', ')}
                            </span>
                          )}
                          {!hasYield && processNote && (
                            <p className="text-xs text-muted italic mt-0.5">{processNote}</p>
                          )}
                        </div>
                        <span
                          className={`text-sm font-mono ml-4 shrink-0 ${
                            isScaled ? 'text-status-warning-strong font-semibold' : 'text-secondary'
                          }`}
                        >
                          {displayAmount}
                        </span>
                      </div>
                      {hasYield && (
                        <div className="flex items-baseline justify-between px-4 -mt-1.5 pb-2">
                          <span className="text-xs text-muted italic">
                            {processNote
                              ? `${processNote} (×${yieldFactor!.toFixed(2)})`
                              : `×${yieldFactor!.toFixed(2)}`}
                          </span>
                          <span className="text-xs text-muted tabular-nums">{contributedAmount}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Instructions Section */}
      {steps.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Instructions</h3>
            {selectedProcedure && (
              <span className="text-xs text-muted">{selectedProcedure.procedure.name}</span>
            )}
          </div>
          <div className="space-y-3">
            {steps.map((step) => {
              const timingText = formatResolvedStepTiming(step);

              const mergedParams: Record<string, string> = {};
              if (step.resolvedTask.defaults) {
                for (const [key, value] of Object.entries(step.resolvedTask.defaults)) {
                  mergedParams[key] = String(value);
                }
              }
              for (const [key, value] of Object.entries(step.params)) {
                mergedParams[key] = String(value);
              }

              const rendered = renderPreview(step.resolvedTask.template, mergedParams);

              return (
                <div key={step.order} className="bg-surface rounded-lg border border-border p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-cat-ganache-bg text-cat-ganache-text font-bold text-sm flex items-center justify-center">
                      {step.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-primary whitespace-pre-wrap leading-relaxed">
                        {rendered}
                      </div>
                      {timingText && (
                        <div className="text-xs text-muted mt-2 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-surface-raised"></span>
                          {timingText}
                        </div>
                      )}
                      {step.notes && step.notes.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {step.notes.map((note, noteIndex) => (
                            <div key={noteIndex} className="text-xs text-secondary">
                              <span className="font-semibold text-muted">[{note.category}]</span> {note.note}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadata Sections */}
      <div className="space-y-4">
        {/* Ratings */}
        {ratings.length > 0 && (
          <div className="bg-surface rounded-lg border border-border p-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Ratings</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {ratings.map((rating, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-secondary capitalize">{rating.category}</span>
                  <span className="text-sm text-star">
                    {'★'.repeat(rating.score)}
                    <span className="text-faint">{'★'.repeat(5 - rating.score)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {entity.tags && entity.tags.length > 0 && (
          <div className="bg-surface rounded-lg border border-border p-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-xs rounded-full bg-surface-raised text-secondary border border-border"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <div className="bg-surface rounded-lg border border-border p-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Notes</h3>
            <div className="space-y-2">
              {notes.map((note, i) => (
                <div key={i} className="text-sm text-secondary">
                  <span className="inline-block px-2 py-0.5 text-xs rounded bg-surface-raised text-secondary mr-2">
                    {note.category}
                  </span>
                  {note.note}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
