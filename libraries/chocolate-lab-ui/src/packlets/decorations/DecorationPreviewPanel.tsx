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
 * Decoration preview panel - recipe/instruction sheet format.
 * @packageDocumentation
 */

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

import type { Entities, LibraryRuntime } from '@fgv/ts-chocolate';

import { renderPreview } from '../tasks';

export interface IDecorationPreviewPanelProps {
  readonly decoration: LibraryRuntime.IDecoration;
  readonly draftEntity?: Entities.Decorations.IDecorationEntity;
  readonly availableIngredients?: ReadonlyArray<LibraryRuntime.AnyIngredient>;
  readonly availableProcedures?: ReadonlyArray<LibraryRuntime.IProcedure>;
  readonly onClose?: () => void;
}

/**
 * Formats timing information for a resolved procedure step.
 */
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

export function DecorationPreviewPanel(props: IDecorationPreviewPanelProps): React.ReactElement {
  const { decoration, draftEntity, onClose } = props;

  const entity = draftEntity ?? decoration.entity;

  const selectedProcedure = decoration.preferredProcedure;
  const stepsResult = selectedProcedure?.procedure.getSteps();
  const steps = stepsResult?.isSuccess() ? stepsResult.value : [];

  return (
    <div className="p-4 overflow-y-auto h-full bg-gray-50">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{entity.name}</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Decoration Recipe</p>
        </div>
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

      {entity.description && (
        <div className="mb-6 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r">
          <p className="text-sm text-gray-700 italic">{entity.description}</p>
        </div>
      )}

      {/* Ingredients Section */}
      {decoration.ingredients.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Ingredients</h3>
            <span className="text-xs text-gray-500">{decoration.ingredients.length} items</span>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {decoration.ingredients.map((ing, i) => {
              const alternateCount = ing.ingredientIds.ids.length - 1;
              const displayName = ing.ingredient.name;

              return (
                <div key={i} className="px-4 py-2.5 flex items-baseline justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{displayName}</span>
                    {alternateCount > 0 && (
                      <span className="ml-2 text-xs text-amber-600">
                        +{alternateCount} alternate{alternateCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 font-mono ml-4">{ing.amount}g</span>
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

              // Merge defaults and params for rendering
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
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
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
        {entity.ratings && entity.ratings.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ratings</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {entity.ratings.map((rating, i) => (
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
        {entity.notes && entity.notes.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
            <div className="space-y-2">
              {entity.notes.map((note, i) => (
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
