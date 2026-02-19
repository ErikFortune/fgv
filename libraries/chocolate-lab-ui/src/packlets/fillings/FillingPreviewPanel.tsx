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

import React, { useMemo } from 'react';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';

import type { Entities, LibraryRuntime, Measurement, MeasurementUnit } from '@fgv/ts-chocolate';
import { LibraryRuntime as LR } from '@fgv/ts-chocolate';

import { renderPreview } from '../tasks';

// ============================================================================
// Props
// ============================================================================

export interface IFillingPreviewPanelProps {
  readonly filling: LibraryRuntime.FillingRecipe;
  readonly draftEntity?: Entities.Fillings.IFillingRecipeEntity;
  readonly targetYield?: number;
  readonly onClose?: () => void;
}

// ============================================================================
// Helpers
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
  const { filling, draftEntity, targetYield, onClose } = props;

  const entity = draftEntity ?? filling.entity;

  const goldenVariation = filling.goldenVariation;
  const goldenVariationEntity = entity.variations.find((v) => v.variationSpec === entity.goldenVariationSpec);

  const ingredientsResult = goldenVariation.getIngredients();
  const ingredients = ingredientsResult.isSuccess() ? Array.from(ingredientsResult.value) : [];

  const selectedProcedure = goldenVariation.preferredProcedure;
  const stepsResult = selectedProcedure?.procedure.getSteps();
  const steps = stepsResult?.isSuccess() ? stepsResult.value : [];

  const ratings = goldenVariationEntity?.ratings ?? [];
  const notes = goldenVariationEntity?.notes ?? [];

  // Compute scaling via ProducedFilling (handles non-scaling units correctly)
  const scaleFactor = useMemo<number | undefined>(() => {
    if (targetYield === undefined || goldenVariation.baseWeight <= 0) return undefined;
    const factor = targetYield / goldenVariation.baseWeight;
    return Math.abs(factor - 1.0) < 0.001 ? undefined : factor;
  }, [targetYield, goldenVariation]);

  const scaledAmounts = useMemo<ReadonlyArray<number> | undefined>(() => {
    if (scaleFactor === undefined) return undefined;
    const result = LR.ProducedFilling.fromSource(goldenVariation, scaleFactor);
    if (!result.isSuccess()) return undefined;
    return result.value.ingredients.map((ing) => ing.amount);
  }, [goldenVariation, scaleFactor]);

  return (
    <div className="p-4 overflow-y-auto h-full bg-gray-50">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{entity.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Filling Recipe</p>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
              {entity.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(): void => window.print()}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Print recipe"
          >
            <PrinterIcon className="w-5 h-5" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Close preview"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {entity.description && (
        <div className="mb-6 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-r">
          <p className="text-sm text-gray-700 italic">{entity.description}</p>
        </div>
      )}

      {/* Yield / Base Weight */}
      {goldenVariationEntity && (
        <div className="mb-6 flex items-center gap-6 bg-white rounded-lg border border-gray-200 px-4 py-3">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide block">Base Weight</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatIngredientAmount(goldenVariationEntity.baseWeight, 'g')}
            </span>
          </div>
          {goldenVariationEntity.yield && (
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wide block">Yield</span>
              <span className="text-lg font-semibold text-gray-900">{goldenVariationEntity.yield}</span>
            </div>
          )}
          {scaleFactor !== undefined && targetYield !== undefined && (
            <div className="ml-auto">
              <span className="text-xs text-gray-500 uppercase tracking-wide block">Scaled To</span>
              <span className="text-lg font-semibold text-amber-700">{targetYield}g</span>
              <span className="text-xs text-amber-600 ml-1">×{scaleFactor.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Ingredients Section */}
      {ingredients.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Ingredients</h3>
            <span className="text-xs text-gray-500">{ingredients.length} items</span>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {ingredients.map((ing, i) => {
              const unit = ing.entity.unit;
              const modifiers = ing.entity.modifiers;
              const rawScaled = scaledAmounts?.[i];
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
                <div key={ing.ingredient.id} className="hover:bg-gray-50">
                  <div className="px-4 py-2.5 flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{ing.ingredient.name}</span>
                      {ing.alternates.length > 0 && (
                        <span className="ml-2 text-xs text-amber-600">
                          or {ing.alternates.map((alt) => alt.name).join(', ')}
                        </span>
                      )}
                      {!hasYield && processNote && (
                        <p className="text-xs text-gray-400 italic mt-0.5">{processNote}</p>
                      )}
                    </div>
                    <span
                      className={`text-sm font-mono ml-4 shrink-0 ${
                        isScaled ? 'text-amber-700 font-semibold' : 'text-gray-600'
                      }`}
                    >
                      {displayAmount}
                    </span>
                  </div>
                  {hasYield && (
                    <div className="flex items-baseline justify-between px-4 -mt-1.5 pb-2">
                      <span className="text-xs text-gray-400 italic">
                        {processNote
                          ? `${processNote} (×${yieldFactor!.toFixed(2)})`
                          : `×${yieldFactor!.toFixed(2)}`}
                      </span>
                      <span className="text-xs text-gray-400 tabular-nums">{contributedAmount}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions Section */}
      {steps.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Instructions</h3>
            {selectedProcedure && (
              <span className="text-xs text-gray-500">{selectedProcedure.procedure.name}</span>
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
                <div key={step.order} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center">
                      {step.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                        {rendered}
                      </div>
                      {timingText && (
                        <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-gray-400"></span>
                          {timingText}
                        </div>
                      )}
                      {step.notes && step.notes.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {step.notes.map((note, noteIndex) => (
                            <div key={noteIndex} className="text-xs text-gray-600">
                              <span className="font-semibold text-gray-500">[{note.category}]</span>{' '}
                              {note.note}
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
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ratings</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {ratings.map((rating, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 capitalize">{rating.category}</span>
                  <span className="text-sm text-amber-500">
                    {'★'.repeat(rating.score)}
                    <span className="text-gray-300">{'★'.repeat(5 - rating.score)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {entity.tags && entity.tags.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {notes.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
            <div className="space-y-2">
              {notes.map((note, i) => (
                <div key={i} className="text-sm text-gray-700">
                  <span className="inline-block px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600 mr-2">
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
