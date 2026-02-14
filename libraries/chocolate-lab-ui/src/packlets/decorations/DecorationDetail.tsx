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
 * Read-only decoration detail view.
 * @packageDocumentation
 */

import React from 'react';

import type { IngredientId, ProcedureId } from '@fgv/ts-chocolate';
import type { LibraryRuntime, Model, Entities } from '@fgv/ts-chocolate';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the DecorationDetail component.
 * @public
 */
export interface IDecorationDetailProps {
  /** The resolved decoration to display */
  readonly decoration: LibraryRuntime.IDecoration;
  /** Optional callback when an ingredient is clicked */
  readonly onIngredientClick?: (id: IngredientId) => void;
  /** Optional callback when a procedure is clicked */
  readonly onProcedureClick?: (id: ProcedureId) => void;
}

// ============================================================================
// Shared Helpers
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
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{title}</h3>
      {children}
    </div>
  );
}

function TagList({ tags }: { readonly tags: ReadonlyArray<string> }): React.ReactElement | null {
  if (tags.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Tags">
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
            {tag}
          </span>
        ))}
      </div>
    </DetailSection>
  );
}

function NotesSection({
  notes
}: {
  readonly notes: ReadonlyArray<Model.ICategorizedNote>;
}): React.ReactElement | null {
  if (notes.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Notes">
      {notes.map((note, i) => (
        <div key={i} className="text-sm text-gray-700 mb-1">
          <span className="text-xs text-gray-400 mr-1">[{note.category}]</span>
          {note.note}
        </div>
      ))}
    </DetailSection>
  );
}

// ============================================================================
// Ingredients Section
// ============================================================================

function IngredientsSection({
  ingredients,
  onIngredientClick
}: {
  readonly ingredients: ReadonlyArray<LibraryRuntime.IResolvedDecorationIngredient>;
  readonly onIngredientClick?: (id: IngredientId) => void;
}): React.ReactElement | null {
  if (ingredients.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Ingredients">
      <div className="space-y-2">
        {ingredients.map((ing, i) => {
          const preferredId = ing.ingredientIds.preferredId ?? ing.ingredientIds.ids[0];
          const alternateCount = ing.ingredientIds.ids.length - 1;
          return (
            <div key={i} className="bg-gray-50 rounded-md p-2.5 border border-gray-200">
              <div className="flex items-baseline justify-between">
                {onIngredientClick ? (
                  <button
                    className="text-sm font-medium text-choco-primary hover:underline text-left"
                    onClick={(): void => onIngredientClick(preferredId)}
                  >
                    {ing.ingredient.name}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-gray-900">{ing.ingredient.name}</span>
                )}
                <span className="text-xs text-gray-500 ml-2">{ing.amount}g</span>
              </div>
              {alternateCount > 0 && (
                <div className="text-xs text-gray-400 mt-0.5">
                  +{alternateCount} alternate{alternateCount > 1 ? 's' : ''}
                </div>
              )}
              {ing.notes && ing.notes.length > 0 && (
                <div className="mt-1">
                  {ing.notes.map((note, j) => (
                    <div key={j} className="text-xs text-gray-500">
                      <span className="text-gray-400">[{note.category}]</span> {note.note}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DetailSection>
  );
}

// ============================================================================
// Procedures Section
// ============================================================================

function ProceduresSection({
  procedures,
  onProcedureClick
}: {
  readonly procedures: LibraryRuntime.IDecoration['procedures'] & {};
  readonly onProcedureClick?: (id: ProcedureId) => void;
}): React.ReactElement {
  return (
    <DetailSection title="Procedures">
      <div className="space-y-1">
        {procedures.options.map((opt) => {
          const isPreferred = opt.id === procedures.preferredId;
          return (
            <div key={opt.id} className="flex items-center gap-1.5 text-sm">
              {isPreferred && <span className="text-amber-500 text-xs">★</span>}
              {onProcedureClick ? (
                <button
                  className="text-choco-primary hover:underline text-left"
                  onClick={(): void => onProcedureClick(opt.id)}
                >
                  {opt.procedure.name}
                </button>
              ) : (
                <span className="text-gray-900">{opt.procedure.name}</span>
              )}
            </div>
          );
        })}
      </div>
    </DetailSection>
  );
}

// ============================================================================
// Ratings Section
// ============================================================================

function RatingsSection({
  ratings
}: {
  readonly ratings: ReadonlyArray<Entities.Decorations.IDecorationRating>;
}): React.ReactElement | null {
  if (ratings.length === 0) {
    return null;
  }
  return (
    <DetailSection title="Ratings">
      <div className="space-y-1">
        {ratings.map((rating, i) => (
          <div key={i} className="flex items-baseline justify-between text-sm">
            <span className="text-gray-500 capitalize">{rating.category}</span>
            <span className="text-gray-900">
              {'★'.repeat(rating.score)}
              {'☆'.repeat(5 - rating.score)}
            </span>
          </div>
        ))}
      </div>
    </DetailSection>
  );
}

// ============================================================================
// DecorationDetail Component
// ============================================================================

/**
 * Read-only detail view for a decoration entity.
 *
 * Displays:
 * - Header with name, ID, and description
 * - Ingredients with amounts and alternates
 * - Procedures with preferred indicator
 * - Ratings (star display)
 * - Notes and tags
 *
 * @public
 */
export function DecorationDetail(props: IDecorationDetailProps): React.ReactElement {
  const { decoration, onIngredientClick, onProcedureClick } = props;

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{decoration.name}</h2>
        <p className="text-xs text-gray-400 mt-0.5 font-mono">{decoration.id}</p>
        {decoration.description && <p className="text-sm text-gray-600 mt-1">{decoration.description}</p>}
      </div>

      {/* Ingredients */}
      <IngredientsSection ingredients={decoration.ingredients} onIngredientClick={onIngredientClick} />

      {/* Procedures */}
      {decoration.procedures && (
        <ProceduresSection procedures={decoration.procedures} onProcedureClick={onProcedureClick} />
      )}

      {/* Ratings */}
      <RatingsSection ratings={decoration.ratings ?? []} />

      {/* Notes */}
      <NotesSection notes={decoration.notes ?? []} />

      {/* Tags */}
      <TagList tags={decoration.tags ?? []} />
    </div>
  );
}
