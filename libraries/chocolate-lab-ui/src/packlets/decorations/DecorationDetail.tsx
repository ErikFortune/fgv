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

import React, { useMemo } from 'react';
import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

import { EntityRow } from '@fgv/ts-app-shell';
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
  /** Optional callback to enter edit mode */
  readonly onEdit?: () => void;
  /** Optional callback to open preview pane */
  readonly onPreview?: () => void;
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
// Ingredient Row (clickable for drill-down with alternate swap)
// ============================================================================

function IngredientRow({
  resolved,
  onClick
}: {
  readonly resolved: LibraryRuntime.IResolvedDecorationIngredient;
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
// Procedures Section
// ============================================================================

function ProceduresSection({
  procedures,
  onProcedureClick
}: {
  readonly procedures: LibraryRuntime.IDecoration['procedures'] & {};
  readonly onProcedureClick?: (id: ProcedureId) => void;
}): React.ReactElement {
  const items = useMemo(() => {
    return procedures.options.map((opt) => ({
      id: opt.id,
      label: opt.procedure.name
    }));
  }, [procedures]);

  return (
    <DetailSection title="Procedures">
      <EntityRow<ProcedureId> items={items} preferredId={procedures.preferredId} onClick={onProcedureClick} />
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
  const { decoration, onIngredientClick, onProcedureClick, onEdit, onPreview } = props;

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{decoration.name}</h2>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400 font-mono">{decoration.id}</span>
          <div className="flex items-center gap-1 shrink-0">
            {onPreview && (
              <button
                type="button"
                onClick={onPreview}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
                title="Preview decoration"
              >
                <EyeIcon className="w-4 h-4" />
                Preview
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors"
                title="Edit decoration"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
        {decoration.description && <p className="text-sm text-gray-600 mt-1">{decoration.description}</p>}
      </div>

      {/* Ingredients */}
      {decoration.ingredients.length > 0 && (
        <DetailSection title={`Ingredients (${decoration.ingredients.length})`}>
          <div className="divide-y divide-gray-100">
            {decoration.ingredients.map((ri) => (
              <IngredientRow key={ri.ingredient.id} resolved={ri} onClick={onIngredientClick} />
            ))}
          </div>
        </DetailSection>
      )}

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
