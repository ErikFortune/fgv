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
 * Read-only journal entry detail view with interactive cascade browsing.
 * @packageDocumentation
 */

import React, { useCallback } from 'react';

import { DetailSection, DetailRow } from '@fgv/ts-app-shell';
import {
  Entities,
  Helpers,
  type ConfectionId,
  type FillingId,
  type FillingRecipeVariationSpec,
  type IngredientId,
  type IWorkspace,
  type MoldId,
  type ProcedureId,
  type UserLibrary
} from '@fgv/ts-chocolate';
import { EntityDetailHeader, copyJsonToClipboard } from '../common';
import { useWorkspace } from '../workspace';
import { ProducedFillingContent } from './ProducedFillingContent';

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
  /** Optional callback to browse an ingredient in a cascade detail panel */
  readonly onBrowseIngredient?: (ingredientId: IngredientId) => void;
  /** Optional callback to browse a procedure in a cascade detail panel */
  readonly onBrowseProcedure?: (procedureId: ProcedureId) => void;
  /** Optional callback to open a filling recipe at a specific variation */
  readonly onOpenFillingRecipe?: (fillingId: FillingId, variationSpec: FillingRecipeVariationSpec) => void;
  /** Optional callback to view a produced filling slot in a cascade detail panel */
  readonly onViewFillingSlot?: (fillingId: FillingId, slotId: string) => void;
  /** Optional callback to browse a mold in a cascade detail panel */
  readonly onBrowseMold?: (moldId: MoldId) => void;
  /** Optional callback to browse the source confection recipe in a cascade detail panel */
  readonly onBrowseConfectionRecipe?: (confectionId: ConfectionId) => void;
}

// ============================================================================
// Name Resolution Helpers
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

function getMoldName(id: MoldId, workspace: IWorkspace): string {
  const result = workspace.data.molds.get(id);
  return result.isSuccess() ? result.value.name : String(id);
}

function formatTimestamp(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

// ============================================================================
// Local type guards for narrowing AnyJournalEntry in JSX
// ============================================================================

function isFillingProductionEntry(
  entry: UserLibrary.AnyJournalEntry
): entry is UserLibrary.IFillingProductionJournalEntry {
  return entry.entity.type === 'filling-production';
}

function isConfectionProductionEntry(
  entry: UserLibrary.AnyJournalEntry
): entry is UserLibrary.IConfectionProductionJournalEntry {
  return entry.entity.type === 'confection-production';
}

function isFillingEditEntry(
  entry: UserLibrary.AnyJournalEntry
): entry is UserLibrary.IFillingEditJournalEntry {
  return entry.entity.type === 'filling-edit';
}

function isConfectionEditEntry(
  entry: UserLibrary.AnyJournalEntry
): entry is UserLibrary.IConfectionEditJournalEntry {
  return entry.entity.type === 'confection-edit';
}

// ============================================================================
// Browsable Text — a value that optionally opens a cascade panel on click
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

// ============================================================================
// Simple labeled section — "LABEL\nvalue" matching session panel style
// ============================================================================

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
// Notes section — always visible, shows "None" when empty
// ============================================================================

function JournalNotesSection({
  notes
}: {
  readonly notes: ReadonlyArray<{ readonly category: string; readonly note: string }> | undefined;
}): React.ReactElement {
  return (
    <LabeledValue label="Notes">
      {!notes || notes.length === 0 ? (
        <span className="text-sm text-gray-400 italic">None</span>
      ) : (
        <div className="space-y-0.5">
          {notes.map((note, i) => (
            <div key={i} className="text-sm text-gray-700">
              {note.category !== 'general' && <span className="text-gray-500">{note.category}: </span>}
              {note.note || <span className="text-gray-400 italic">empty</span>}
            </div>
          ))}
        </div>
      )}
    </LabeledValue>
  );
}

// ============================================================================
// Source Recipe Section (clickable link + change summary)
// ============================================================================

function SourceRecipeSection({
  entry,
  onOpenFillingRecipe
}: {
  readonly entry: UserLibrary.IFillingEditJournalEntry | UserLibrary.IFillingProductionJournalEntry;
  readonly onOpenFillingRecipe?: (fillingId: FillingId, variationSpec: FillingRecipeVariationSpec) => void;
}): React.ReactElement {
  const recipeName = entry.recipe.name;
  const variationName = entry.variation.name ?? entry.variation.variationSpec;
  const displayName = `${recipeName} (${variationName})`;
  const fillingId = Helpers.getFillingRecipeVariationFillingId(entry.variationId);
  const variationSpec = Helpers.getFillingRecipeVariationSpec(entry.variationId);
  const hasChanges = entry.updated !== undefined;

  return (
    <LabeledValue label="Source Recipe">
      {onOpenFillingRecipe ? (
        <button
          type="button"
          onClick={(): void => onOpenFillingRecipe(fillingId, variationSpec)}
          className="text-sm text-choco-primary hover:underline text-left truncate w-full"
        >
          {displayName}
        </button>
      ) : (
        <span className="text-sm text-gray-800">{displayName}</span>
      )}
      {hasChanges && <ChangesSummary entity={entry.entity} />}
    </LabeledValue>
  );
}

// ============================================================================
// Source Confection Recipe Section (clickable link)
// ============================================================================

function SourceConfectionRecipeSection({
  entry,
  onBrowseConfectionRecipe
}: {
  readonly entry: UserLibrary.IConfectionEditJournalEntry | UserLibrary.IConfectionProductionJournalEntry;
  readonly onBrowseConfectionRecipe?: (confectionId: ConfectionId) => void;
}): React.ReactElement {
  const recipeName = entry.recipe.name;
  const variationName = entry.variation.name ?? String(entry.variationId);
  const displayName = `${recipeName} (${variationName})`;

  // Extract confection ID from the variation ID
  const parsedId = Helpers.parseConfectionRecipeVariationId(entry.variationId);
  const confectionId = parsedId.isSuccess() ? parsedId.value.collectionId : undefined;

  return (
    <LabeledValue label="Source Recipe">
      {onBrowseConfectionRecipe && confectionId ? (
        <button
          type="button"
          onClick={(): void => onBrowseConfectionRecipe(confectionId)}
          className="text-sm text-choco-primary hover:underline text-left truncate w-full"
        >
          {displayName}
        </button>
      ) : (
        <span className="text-sm text-gray-800">{displayName}</span>
      )}
    </LabeledValue>
  );
}

// ============================================================================
// Changes Summary (shows what was modified vs original recipe)
// ============================================================================

function ChangesSummary({
  entity
}: {
  readonly entity:
    | Entities.Journal.IFillingProductionJournalEntryEntity
    | Entities.Journal.IFillingEditJournalEntryEntity;
}): React.ReactElement {
  const changes: string[] = [];

  if (entity.updated) {
    const original = entity.recipe;
    const updated = entity.updated;

    const origIngs = original.ingredients ?? [];
    const updIngs = updated.ingredients ?? [];
    if (updIngs.length > origIngs.length) {
      changes.push(
        `${updIngs.length - origIngs.length} ingredient${
          updIngs.length - origIngs.length > 1 ? 's' : ''
        } added`
      );
    } else if (updIngs.length < origIngs.length) {
      changes.push(
        `${origIngs.length - updIngs.length} ingredient${
          origIngs.length - updIngs.length > 1 ? 's' : ''
        } removed`
      );
    }

    if (origIngs.length === updIngs.length && origIngs.length > 0) {
      const origIds = new Set(origIngs.map((i) => i.ingredient.preferredId ?? i.ingredient.ids[0]));
      const updIds = new Set(updIngs.map((i) => i.ingredient.preferredId ?? i.ingredient.ids[0]));
      const allSame = [...origIds].every((id) => updIds.has(id));
      if (!allSame) {
        changes.push('ingredients changed');
      }
    }

    const origProcId = original.procedures?.preferredId;
    const updProcId = updated.procedures?.preferredId;
    if (origProcId !== updProcId) {
      changes.push('procedure changed');
    }

    if (original.baseWeight !== updated.baseWeight) {
      changes.push('base weight changed');
    }
  }

  if (changes.length === 0) {
    changes.push('variation modified');
  }

  return (
    <div className="mt-1 text-xs text-amber-600">
      <span className="font-medium">Modified: </span>
      {changes.join(', ')}
    </div>
  );
}

// ============================================================================
// Confection Filling Slots — names with quantity, click opens cascade panel
// ============================================================================

function ConfectionFillingSlotsSection({
  fillings,
  workspace,
  onBrowseIngredient,
  onViewFillingSlot
}: {
  readonly fillings: ReadonlyArray<Entities.Confections.AnyResolvedFillingSlotEntity>;
  readonly workspace: IWorkspace;
  readonly onBrowseIngredient?: (id: IngredientId) => void;
  readonly onViewFillingSlot?: (fillingId: FillingId, slotId: string) => void;
}): React.ReactElement | null {
  if (fillings.length === 0) return null;

  return (
    <LabeledValue label="Fillings">
      <div className="space-y-0.5">
        {fillings.map((slot) => {
          if (slot.slotType === 'ingredient') {
            return (
              <div key={slot.slotId} className="py-0.5">
                <BrowsableText
                  text={getIngredientName(slot.ingredientId, workspace)}
                  onBrowse={
                    onBrowseIngredient ? (): void => onBrowseIngredient(slot.ingredientId) : undefined
                  }
                />
                <span className="text-xs text-gray-400 ml-1">(ingredient)</span>
              </div>
            );
          }

          const fillingName = getFillingName(slot.fillingId, workspace);
          const produced = slot.produced;
          const targetWeight = produced ? Math.round(Number(produced.targetWeight)) : undefined;
          const label = targetWeight !== undefined ? `${fillingName} — ${targetWeight}g` : fillingName;

          return (
            <div key={slot.slotId} className="py-0.5">
              <BrowsableText
                text={label}
                onBrowse={
                  onViewFillingSlot ? (): void => onViewFillingSlot(slot.fillingId, slot.slotId) : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </LabeledValue>
  );
}

// ============================================================================
// Confection Type-Specific Sections — individual labeled sections
// ============================================================================

function ConfectionTypeSpecificSections({
  produced,
  workspace,
  onBrowseIngredient,
  onBrowseMold
}: {
  readonly produced: Entities.Confections.AnyProducedConfectionEntity;
  readonly workspace: IWorkspace;
  readonly onBrowseIngredient?: (id: IngredientId) => void;
  readonly onBrowseMold?: (id: MoldId) => void;
}): React.ReactElement | null {
  if (produced.confectionType === 'molded-bonbon') {
    const molded = produced as Entities.Confections.IProducedMoldedBonBonEntity;
    return (
      <>
        <LabeledValue label="Mold">
          <BrowsableText
            text={getMoldName(molded.moldId, workspace)}
            onBrowse={onBrowseMold ? (): void => onBrowseMold(molded.moldId) : undefined}
          />
        </LabeledValue>
        <LabeledValue label="Shell Chocolate">
          <BrowsableText
            text={getIngredientName(molded.shellChocolateId, workspace)}
            onBrowse={
              onBrowseIngredient ? (): void => onBrowseIngredient(molded.shellChocolateId) : undefined
            }
          />
        </LabeledValue>
        {molded.sealChocolateId && (
          <LabeledValue label="Seal Chocolate">
            <BrowsableText
              text={getIngredientName(molded.sealChocolateId, workspace)}
              onBrowse={
                onBrowseIngredient ? (): void => onBrowseIngredient(molded.sealChocolateId!) : undefined
              }
            />
          </LabeledValue>
        )}
        {molded.decorationChocolateId && (
          <LabeledValue label="Decoration Chocolate">
            <BrowsableText
              text={getIngredientName(molded.decorationChocolateId, workspace)}
              onBrowse={
                onBrowseIngredient ? (): void => onBrowseIngredient(molded.decorationChocolateId!) : undefined
              }
            />
          </LabeledValue>
        )}
      </>
    );
  }

  if (produced.confectionType === 'bar-truffle') {
    const bar = produced as Entities.Confections.IProducedBarTruffleEntity;
    if (!bar.enrobingChocolateId) return null;
    return (
      <LabeledValue label="Enrobing Chocolate">
        <BrowsableText
          text={getIngredientName(bar.enrobingChocolateId, workspace)}
          onBrowse={onBrowseIngredient ? (): void => onBrowseIngredient(bar.enrobingChocolateId!) : undefined}
        />
      </LabeledValue>
    );
  }

  if (produced.confectionType === 'rolled-truffle') {
    const rolled = produced as Entities.Confections.IProducedRolledTruffleEntity;
    if (!rolled.enrobingChocolateId && !rolled.coatingId) return null;
    return (
      <>
        {rolled.enrobingChocolateId && (
          <LabeledValue label="Enrobing Chocolate">
            <BrowsableText
              text={getIngredientName(rolled.enrobingChocolateId, workspace)}
              onBrowse={
                onBrowseIngredient ? (): void => onBrowseIngredient(rolled.enrobingChocolateId!) : undefined
              }
            />
          </LabeledValue>
        )}
        {rolled.coatingId && (
          <LabeledValue label="Coating">
            <BrowsableText
              text={getIngredientName(rolled.coatingId, workspace)}
              onBrowse={onBrowseIngredient ? (): void => onBrowseIngredient(rolled.coatingId!) : undefined}
            />
          </LabeledValue>
        )}
      </>
    );
  }

  return null;
}

// ============================================================================
// Confection Yield Display
// ============================================================================

function formatConfectionYield(
  yieldSpec: Entities.Confections.BufferedConfectionYield,
  moldCavityCount?: number
): string {
  if (Entities.Confections.isBufferedYieldInFrames(yieldSpec)) {
    const framePart = `${yieldSpec.numFrames} frame${yieldSpec.numFrames !== 1 ? 's' : ''}`;
    const pieceCount = moldCavityCount !== undefined ? yieldSpec.numFrames * moldCavityCount : undefined;
    const piecePart = pieceCount !== undefined ? ` (${pieceCount} piece${pieceCount !== 1 ? 's' : ''})` : '';
    return `${framePart}${piecePart} · ${yieldSpec.bufferPercentage}% buffer`;
  }
  if (Entities.Confections.isBufferedBarTruffleYield(yieldSpec)) {
    const dims = yieldSpec.dimensions;
    return `${yieldSpec.count} piece${yieldSpec.count !== 1 ? 's' : ''} · ${Number(
      yieldSpec.weightPerPiece
    )}g each · ${dims.width}×${dims.depth}×${dims.height}mm · ${yieldSpec.bufferPercentage}% buffer`;
  }
  return `${yieldSpec.count} piece${yieldSpec.count !== 1 ? 's' : ''} · ${Number(
    yieldSpec.weightPerPiece
  )}g each · ${yieldSpec.bufferPercentage}% buffer`;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Read-only detail view for a journal entry.
 *
 * Displays type-specific content matching the session panel presentation
 * (minus edit controls). All entity references are interactive when browse
 * callbacks are provided, supporting cascade drill-down navigation.
 *
 * @public
 */
export function JournalEntryDetail({
  entry,
  onClose,
  onBrowseIngredient,
  onBrowseProcedure,
  onOpenFillingRecipe,
  onViewFillingSlot,
  onBrowseMold,
  onBrowseConfectionRecipe
}: IJournalEntryDetailProps): React.ReactElement {
  const workspace = useWorkspace();

  const handleCopyJson = useCallback((): void => {
    copyJsonToClipboard(entry.entity);
  }, [entry]);

  const typeBadge = {
    label: JOURNAL_TYPE_LABELS[entry.entity.type] ?? entry.entity.type,
    colorClass: JOURNAL_TYPE_COLORS[entry.entity.type] ?? 'bg-gray-100 text-gray-800'
  };

  // Narrow entry to specific types so TypeScript can see .entity.produced etc.
  const fillingProd = isFillingProductionEntry(entry) ? entry : undefined;
  const confectionProd = isConfectionProductionEntry(entry) ? entry : undefined;
  const fillingEdit = isFillingEditEntry(entry) ? entry : undefined;
  const confectionEdit = isConfectionEditEntry(entry) ? entry : undefined;

  // For molded bon-bons, resolve the mold to get cavity count for piece display
  const moldCavityCount = ((): number | undefined => {
    if (confectionProd?.entity.produced.confectionType !== 'molded-bonbon') return undefined;
    const molded = confectionProd.entity.produced as Entities.Confections.IProducedMoldedBonBonEntity;
    const moldResult = workspace.data.molds.get(molded.moldId);
    return moldResult.isSuccess() ? moldResult.value.cavityCount : undefined;
  })();

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

      {/* Content area — matches session panel gap-4 layout */}
      <div className="flex flex-col gap-4">
        {/* ============================================================ */}
        {/* Filling Production Entry                                      */}
        {/* ============================================================ */}
        {fillingProd && (
          <ProducedFillingContent
            produced={fillingProd.entity.produced}
            onBrowseIngredient={onBrowseIngredient}
            onBrowseProcedure={onBrowseProcedure}
            onOpenFillingRecipe={onOpenFillingRecipe}
          />
        )}

        {/* ============================================================ */}
        {/* Confection Production Entry                                   */}
        {/* ============================================================ */}
        {confectionProd && (
          <>
            <LabeledValue label="Yield">
              <span className="text-sm text-gray-700">
                {formatConfectionYield(confectionProd.entity.yield, moldCavityCount)}
              </span>
            </LabeledValue>

            {confectionProd.entity.produced.fillings &&
              confectionProd.entity.produced.fillings.length > 0 && (
                <ConfectionFillingSlotsSection
                  fillings={confectionProd.entity.produced.fillings}
                  workspace={workspace}
                  onBrowseIngredient={onBrowseIngredient}
                  onViewFillingSlot={onViewFillingSlot}
                />
              )}

            <ConfectionTypeSpecificSections
              produced={confectionProd.entity.produced}
              workspace={workspace}
              onBrowseIngredient={onBrowseIngredient}
              onBrowseMold={onBrowseMold}
            />

            {confectionProd.entity.produced.procedureId && (
              <LabeledValue label="Procedure">
                <BrowsableText
                  text={getProcedureName(confectionProd.entity.produced.procedureId, workspace)}
                  onBrowse={
                    onBrowseProcedure
                      ? (): void => onBrowseProcedure(confectionProd.entity.produced.procedureId!)
                      : undefined
                  }
                />
              </LabeledValue>
            )}

            <SourceConfectionRecipeSection
              entry={confectionProd}
              onBrowseConfectionRecipe={onBrowseConfectionRecipe}
            />
          </>
        )}

        {/* Edit entries — source recipe only */}
        {fillingEdit && <SourceRecipeSection entry={fillingEdit} onOpenFillingRecipe={onOpenFillingRecipe} />}
        {confectionEdit && (
          <SourceConfectionRecipeSection
            entry={confectionEdit}
            onBrowseConfectionRecipe={onBrowseConfectionRecipe}
          />
        )}

        {/* Notes — always shown */}
        <JournalNotesSection notes={entry.notes} />
      </div>
    </div>
  );
}
