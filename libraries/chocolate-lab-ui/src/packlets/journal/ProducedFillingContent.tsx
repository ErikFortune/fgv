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
 * Shared produced filling content component.
 *
 * Renders the body of a produced filling session: target weight, ingredients
 * with amounts and modifiers, procedure reference, and source recipe link.
 * Used by both the standalone filling production journal view and the
 * embedded filling cascade panel.
 *
 * @packageDocumentation
 */

import React from 'react';

import {
  Entities,
  Helpers,
  type FillingId,
  type FillingRecipeVariationSpec,
  type IngredientId,
  type IWorkspace,
  type ProcedureId
} from '@fgv/ts-chocolate';
import { formatIngredientAmount } from '../common';
import { useWorkspace } from '../workspace';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the ProducedFillingContent component.
 * @public
 */
export interface IProducedFillingContentProps {
  /** The produced filling snapshot to display */
  readonly produced: Entities.Fillings.IProducedFillingEntity;
  /** Optional callback to browse an ingredient in a cascade detail panel */
  readonly onBrowseIngredient?: (ingredientId: IngredientId) => void;
  /** Optional callback to browse a procedure in a cascade detail panel */
  readonly onBrowseProcedure?: (procedureId: ProcedureId) => void;
  /** Optional callback to open the source filling recipe at a specific variation */
  readonly onOpenFillingRecipe?: (fillingId: FillingId, variationSpec: FillingRecipeVariationSpec) => void;
}

// ============================================================================
// Helpers
// ============================================================================

function getIngredientName(id: IngredientId, workspace: IWorkspace): string {
  const result = workspace.data.ingredients.get(id);
  return result.isSuccess() ? result.value.name : String(id);
}

function getProcedureName(id: ProcedureId, workspace: IWorkspace): string {
  const result = workspace.data.procedures.get(id);
  return result.isSuccess() ? result.value.name : String(id);
}

function getFillingName(id: FillingId, workspace: IWorkspace): string {
  const result = workspace.data.fillings.get(id);
  return result.isSuccess() ? result.value.name : String(id);
}

// ============================================================================
// Subcomponents
// ============================================================================

function BrowsableText({
  text,
  onBrowse
}: {
  readonly text: string;
  readonly onBrowse?: () => void;
}): React.ReactElement {
  if (onBrowse) {
    return (
      <button
        type="button"
        onClick={onBrowse}
        className="text-sm text-gray-800 hover:text-choco-primary text-left truncate"
      >
        {text}
      </button>
    );
  }
  return <span className="text-sm text-gray-700">{text}</span>;
}

function LabeledValue({
  label,
  children
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 uppercase mb-0.5">{label}</div>
      <div className="py-0.5">{children}</div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * Shared content component for displaying produced filling session data.
 *
 * Renders target weight (with scale factor), ingredient list with actual
 * amounts and modifiers, procedure reference, and source recipe link.
 *
 * Used by:
 * - `JournalEntryDetail` for standalone filling production entries
 * - `ProducedFillingDetail` for embedded filling cascade panels
 *
 * @public
 */
export function ProducedFillingContent({
  produced,
  onBrowseIngredient,
  onBrowseProcedure,
  onOpenFillingRecipe
}: IProducedFillingContentProps): React.ReactElement {
  const workspace = useWorkspace();

  // Extract filling ID and variation spec from the produced variation ID
  const fillingId = Helpers.getFillingRecipeVariationFillingId(produced.variationId);
  const variationSpec = Helpers.getFillingRecipeVariationSpec(produced.variationId);
  const sourceFillingName = getFillingName(fillingId, workspace);
  const sourceDisplayName = `${sourceFillingName} (${variationSpec})`;

  return (
    <>
      {/* Target Weight */}
      <LabeledValue label="Target Weight">
        <span className="text-sm text-gray-700">
          {Math.round(Number(produced.targetWeight))}g
          {produced.scaleFactor !== 1.0 && (
            <span className="text-xs text-amber-600 font-medium ml-1">
              {'\u00d7'}
              {produced.scaleFactor.toFixed(2)}
            </span>
          )}
        </span>
      </LabeledValue>

      {/* Ingredients */}
      <LabeledValue label="Ingredients">
        <div className="space-y-0.5">
          {produced.ingredients.map((ing, index) => {
            const hasModifiers =
              (ing.modifiers?.yieldFactor !== undefined && ing.modifiers.yieldFactor !== 1.0) ||
              !!ing.modifiers?.processNote ||
              !!ing.modifiers?.spoonLevel ||
              !!ing.modifiers?.toTaste;

            return (
              <div key={`${ing.ingredientId}-${index}`}>
                <div className="flex items-center gap-1.5 py-0.5">
                  {onBrowseIngredient ? (
                    <button
                      type="button"
                      onClick={(): void => onBrowseIngredient(ing.ingredientId)}
                      className="flex-1 min-w-0 text-sm text-gray-800 hover:text-choco-primary text-left truncate"
                    >
                      {getIngredientName(ing.ingredientId, workspace)}
                    </button>
                  ) : (
                    <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">
                      {getIngredientName(ing.ingredientId, workspace)}
                    </span>
                  )}
                  <span className="text-sm text-gray-600 tabular-nums shrink-0">
                    {formatIngredientAmount(Number(ing.amount), ing.unit)}
                  </span>
                </div>
                {hasModifiers && (
                  <div className="flex flex-wrap items-center gap-x-3 pl-1 text-xs text-gray-400">
                    {ing.modifiers?.yieldFactor !== undefined && ing.modifiers.yieldFactor !== 1.0 && (
                      <span>
                        yield {'\u00d7'}
                        {ing.modifiers.yieldFactor}
                      </span>
                    )}
                    {ing.modifiers?.processNote && (
                      <span className="italic">{ing.modifiers.processNote}</span>
                    )}
                    {ing.modifiers?.spoonLevel && <span>{ing.modifiers.spoonLevel}</span>}
                    {ing.modifiers?.toTaste && <span>to taste</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </LabeledValue>

      {/* Procedure */}
      {produced.procedureId && (
        <LabeledValue label="Procedure">
          <BrowsableText
            text={getProcedureName(produced.procedureId, workspace)}
            onBrowse={onBrowseProcedure ? (): void => onBrowseProcedure(produced.procedureId!) : undefined}
          />
        </LabeledValue>
      )}

      {/* Source Recipe */}
      <LabeledValue label="Source Recipe">
        {onOpenFillingRecipe ? (
          <button
            type="button"
            onClick={(): void => onOpenFillingRecipe(fillingId, variationSpec)}
            className="text-sm text-choco-primary hover:underline text-left truncate w-full"
          >
            {sourceDisplayName}
          </button>
        ) : (
          <span className="text-sm text-gray-800">{sourceDisplayName}</span>
        )}
      </LabeledValue>
    </>
  );
}
