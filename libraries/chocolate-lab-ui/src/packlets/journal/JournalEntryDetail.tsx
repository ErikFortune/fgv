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
 * Read-only journal entry detail view.
 * @packageDocumentation
 */

import React, { useCallback, useMemo } from 'react';

import { DetailSection, DetailRow } from '@fgv/ts-app-shell';
import type { Entities, IngredientId, IWorkspace, ProcedureId, UserLibrary } from '@fgv/ts-chocolate';
import { EntityDetailHeader, NotesSection, copyJsonToClipboard } from '../common';
import { useWorkspace } from '../workspace';

// ============================================================================
// Types
// ============================================================================

const JOURNAL_TYPE_COLORS: Record<string, string> = {
  'filling-edit': 'bg-blue-100 text-blue-800',
  'filling-production': 'bg-green-100 text-green-800',
  'confection-edit': 'bg-purple-100 text-purple-800',
  'confection-production': 'bg-amber-100 text-amber-800'
};

const JOURNAL_TYPE_LABELS: Record<string, string> = {
  'filling-edit': 'Filling Edit',
  'filling-production': 'Filling Production',
  'confection-edit': 'Confection Edit',
  'confection-production': 'Confection Production'
};

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the JournalEntryDetail component.
 * @public
 */
export interface IJournalEntryDetailProps {
  /** The materialized journal entry to display */
  readonly entry: UserLibrary.AnyJournalEntry;
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function formatTimestamp(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function getIngredientName(id: IngredientId, workspace: IWorkspace): string {
  const result = workspace.data.ingredients.get(id);
  return result.isSuccess() ? result.value.name : String(id);
}

function getProcedureName(id: ProcedureId, workspace: IWorkspace): string {
  const result = workspace.data.procedures.get(id);
  return result.isSuccess() ? result.value.name : String(id);
}

function formatUnit(unit: string | undefined): string {
  return unit ?? 'g';
}

// ============================================================================
// Produced Filling Section (for production entries)
// ============================================================================

function ProducedFillingSection({
  produced,
  workspace
}: {
  readonly produced: Entities.Fillings.IProducedFillingEntity;
  readonly workspace: IWorkspace;
}): React.ReactElement {
  return (
    <DetailSection title="Produced">
      <div className="space-y-1">
        {produced.ingredients.map((ing, index) => (
          <div key={`${ing.ingredientId}-${index}`} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">
              {getIngredientName(ing.ingredientId, workspace)}
              {ing.modifiers?.toTaste && <span className="ml-1 text-xs text-gray-400 italic">to taste</span>}
            </span>
            <span className="text-gray-500 tabular-nums">
              {Number(ing.amount)}
              {formatUnit(ing.unit)}
            </span>
          </div>
        ))}
      </div>
      {produced.procedureId && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <DetailRow label="Procedure" value={getProcedureName(produced.procedureId, workspace)} />
        </div>
      )}
    </DetailSection>
  );
}

// ============================================================================
// Source Recipe Ingredients (for filling entries — shows original recipe variation)
// ============================================================================

function FillingRecipeIngredientSummary({
  entry
}: {
  readonly entry: UserLibrary.IFillingEditJournalEntry | UserLibrary.IFillingProductionJournalEntry;
}): React.ReactElement {
  const variation = entry.updated ?? entry.variation;

  const ingredients = useMemo(() => {
    const result = variation.getIngredients();
    if (result.isFailure()) return [];
    return Array.from(result.value);
  }, [variation]);

  if (ingredients.length === 0) {
    return (
      <DetailSection title="Source Recipe">
        <p className="text-sm text-gray-500 italic">No ingredients</p>
      </DetailSection>
    );
  }

  return (
    <DetailSection title="Source Recipe">
      <div className="space-y-1">
        {ingredients.map((ing) => (
          <div key={ing.ingredient.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{ing.ingredient.name}</span>
            <span className="text-gray-500 tabular-nums">{Number(ing.amount)}g</span>
          </div>
        ))}
      </div>
    </DetailSection>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * Read-only detail view for a journal entry.
 *
 * Displays:
 * - Header with recipe/confection name, type badge, timestamp
 * - Source variation ID
 * - Ingredient summary (for filling entries)
 * - Notes
 *
 * @public
 */
export function JournalEntryDetail({ entry, onClose }: IJournalEntryDetailProps): React.ReactElement {
  const workspace = useWorkspace();

  const handleCopyJson = useCallback((): void => {
    copyJsonToClipboard(entry.entity);
  }, [entry]);

  const typeBadge = {
    label: JOURNAL_TYPE_LABELS[entry.entity.type] ?? entry.entity.type,
    colorClass: JOURNAL_TYPE_COLORS[entry.entity.type] ?? 'bg-gray-100 text-gray-800'
  };

  const isFillingEntry = entry.entity.type === 'filling-edit' || entry.entity.type === 'filling-production';

  return (
    <div className="flex flex-col p-4 overflow-y-auto">
      {/* Header */}
      <EntityDetailHeader
        title={entry.recipe.name}
        badge={typeBadge}
        subtitle={entry.id}
        onCopyJson={handleCopyJson}
        onClose={onClose}
      />

      {/* Metadata */}
      <DetailSection title="Entry Details">
        <DetailRow label="Timestamp" value={formatTimestamp(entry.timestamp)} />
        <DetailRow label="Variation" value={String(entry.variationId)} />
        {entry.updated && <DetailRow label="Modified" value="Yes — variation was edited" />}
      </DetailSection>

      {/* Production details for filling production entries */}
      {entry.entity.type === 'filling-production' && (
        <>
          <DetailSection title="Production">
            <DetailRow label="Target Weight" value={`${Number(entry.entity.yield)}g`} />
            <DetailRow label="Scale Factor" value={`${entry.entity.produced.scaleFactor}×`} />
          </DetailSection>
          <ProducedFillingSection produced={entry.entity.produced} workspace={workspace} />
        </>
      )}

      {/* Source recipe ingredients for filling entries (collapsed under production) */}
      {isFillingEntry && (
        <FillingRecipeIngredientSummary
          entry={entry as UserLibrary.IFillingEditJournalEntry | UserLibrary.IFillingProductionJournalEntry}
        />
      )}

      {/* Notes */}
      {entry.notes && <NotesSection notes={entry.notes} />}
    </div>
  );
}
