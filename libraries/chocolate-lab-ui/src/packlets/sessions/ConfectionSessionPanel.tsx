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
 * Confection session detail panel.
 * Displays confection info, yield editing, filling slots, and type-specific properties.
 * Filling slot editing is delegated to cascade columns via callback props.
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ArrowPathIcon, CheckIcon } from '@heroicons/react/20/solid';
import { DetailRow, EditSection, TypeaheadInput, type ITypeaheadSuggestion } from '@fgv/ts-app-shell';
import {
  Entities,
  LibraryRuntime,
  type FillingId,
  type IngredientId,
  type IWorkspace,
  type Model,
  type ProcedureId,
  type SessionId,
  type SlotId,
  type UserLibrary
} from '@fgv/ts-chocolate';

import { EntityDetailHeader } from '../common';
import { NotesEditor } from '../editing';
import { useWorkspace, useReactiveWorkspace } from '../workspace';
import { SessionStatusBar, type SaveMode } from './SessionStatusBar';
import { useSessionActions } from './useSessionActions';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the ConfectionSessionPanel component.
 * @public
 */
export interface IConfectionSessionPanelProps {
  /** The composite session ID */
  readonly sessionId: SessionId;
  /** The confection editing session */
  readonly session: UserLibrary.Session.AnyConfectionEditingSession;
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
  /** Optional callback when user selects a filling slot for cascade browsing */
  readonly onSelectFillingSlot?: (slotId: SlotId, label: string) => void;
  /** Optional callback to browse an ingredient in a cascade detail panel */
  readonly onBrowseIngredient?: (ingredientId: IngredientId) => void;
  /** Optional callback to browse a procedure in a cascade detail panel */
  readonly onBrowseProcedure?: (procedureId: ProcedureId) => void;
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

function formatConfectionType(type: string): string {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// Component
// ============================================================================

/**
 * Confection session detail panel with type-specific sections.
 *
 * Shows confection info, yield editing, filling slots list, and type-specific
 * properties (mold, chocolates, etc.). Filling slot editing is delegated to
 * cascade columns via callback props.
 *
 * @public
 */
export function ConfectionSessionPanel({
  sessionId,
  session,
  onClose,
  onSelectFillingSlot,
  onBrowseIngredient,
  onBrowseProcedure
}: IConfectionSessionPanelProps): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const sessionActions = useSessionActions();

  // ---- Version counter for re-renders after session mutations ----
  const [sessionVersion, setSessionVersion] = useState(0);
  const notifySession = useCallback((): void => {
    setSessionVersion((v) => v + 1);
  }, []);

  // ---- Save mode ----
  const defaultSaveMode: SaveMode = session.status === 'planning' ? 'manual' : 'autosave';
  const [saveMode, setSaveMode] = useState<SaveMode>(defaultSaveMode);

  const hasChanges = useMemo(() => session.hasChanges, [session, sessionVersion]);

  // ---- Status change ----
  const handleStatusChange = useCallback(
    async (status: Entities.PersistedSessionStatus): Promise<void> => {
      await sessionActions.updateSessionStatus(sessionId, status);
      setSaveMode(status === 'planning' ? 'manual' : 'autosave');
      notifySession();
    },
    [sessionActions, sessionId, notifySession]
  );

  // ---- Save ----
  const handleSave = useCallback(async (): Promise<void> => {
    await sessionActions.saveSession(sessionId);
    notifySession();
  }, [sessionActions, sessionId, notifySession]);

  const handleSaveModeChange = useCallback(
    (mode: SaveMode): void => {
      setSaveMode(mode);
      if (mode === 'autosave' && hasChanges) {
        sessionActions
          .saveSession(sessionId)
          .then(() => {
            notifySession();
            return undefined;
          })
          .catch(() => undefined);
      }
    },
    [hasChanges, sessionActions, sessionId, notifySession]
  );

  const handlePanelBlur = useCallback((): void => {
    if (saveMode === 'autosave' && hasChanges) {
      sessionActions
        .saveSession(sessionId)
        .then(() => {
          notifySession();
          return undefined;
        })
        .catch(() => undefined);
    }
  }, [saveMode, hasChanges, sessionActions, sessionId, notifySession]);

  const autosaveIfNeeded = useCallback((): void => {
    if (saveMode !== 'autosave') return;
    sessionActions
      .saveSession(sessionId)
      .then(() => {
        notifySession();
        return undefined;
      })
      .catch(() => undefined);
  }, [saveMode, sessionActions, sessionId, notifySession]);

  // ---- Undo/Redo (confection sessions don't yet expose undo/redo) ----
  const canUndo = false;
  const canRedo = false;
  const handleUndo = useCallback((): void => undefined, []);
  const handleRedo = useCallback((): void => undefined, []);

  // ---- Notes ----
  const currentNotes = useMemo(() => session.produced.notes, [session, sessionVersion]);

  const handleNotesChange = useCallback(
    (value: ReadonlyArray<Model.ICategorizedNote> | undefined): void => {
      const result = session.produced.setNotes(value ? [...value] : []);
      if (result.isFailure()) return;
      notifySession();
      autosaveIfNeeded();
    },
    [session, notifySession, autosaveIfNeeded]
  );

  // ---- Filling slots ----
  const fillingSlots = useMemo(() => {
    const slots = session.produced.fillings ?? [];
    return slots.map((slot) => {
      const fillingSession = slot.slotType === 'recipe' ? session.getFillingSession(slot.slotId) : undefined;
      const name =
        slot.slotType === 'recipe'
          ? fillingSession?.baseRecipe.fillingRecipe.name ?? String(slot.fillingId)
          : getIngredientName(slot.ingredientId, workspace);
      const targetWeight = fillingSession?.targetWeight;
      return { ...slot, name, targetWeight };
    });
  }, [session, sessionVersion, workspace, reactiveWorkspace.version]);

  const handleSlotClick = useCallback(
    (slotId: SlotId, label: string): void => {
      onSelectFillingSlot?.(slotId, label);
    },
    [onSelectFillingSlot]
  );

  const handleRemoveSlot = useCallback(
    (slotId: SlotId): void => {
      const result = session.produced.removeFillingSlot(slotId);
      if (result.isFailure()) return;
      notifySession();
      autosaveIfNeeded();
    },
    [session, notifySession, autosaveIfNeeded]
  );

  // ---- Filling suggestions ----
  const fillingSuggestions = useMemo(
    () =>
      Array.from(workspace.data.fillings.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((f) => ({ id: f.id, name: f.name })),
    [workspace, reactiveWorkspace.version]
  );

  const fillingAlternates = useMemo((): ReadonlyArray<ITypeaheadSuggestion<FillingId>> => {
    const variation = session.baseConfection.goldenVariation;
    const slots = variation.fillings;
    if (!slots) return [];
    const seen = new Set<string>();
    const alts: Array<{ id: FillingId; name: string }> = [];
    for (const slot of slots) {
      for (const opt of slot.filling.options) {
        if (opt.type === 'recipe' && !seen.has(opt.id)) {
          seen.add(opt.id);
          const recipe = workspace.data.fillings.get(opt.id);
          alts.push({ id: opt.id, name: recipe.isSuccess() ? recipe.value.name : String(opt.id) });
        }
      }
    }
    return alts;
  }, [session, workspace, reactiveWorkspace.version]);

  const [newFillingText, setNewFillingText] = useState('');

  const handleAddFilling = useCallback(
    (suggestion: ITypeaheadSuggestion<FillingId>): void => {
      const slotId = suggestion.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') as unknown as SlotId;
      const result = session.produced.setFillingSlot(slotId, { type: 'recipe', fillingId: suggestion.id });
      if (result.isFailure()) return;
      setNewFillingText('');
      notifySession();
      autosaveIfNeeded();
    },
    [session, notifySession, autosaveIfNeeded]
  );

  // ---- Suggestions for typeahead inputs ----
  const ingredientSuggestions = useMemo(
    () =>
      Array.from(workspace.data.ingredients.values()).map((ing: LibraryRuntime.AnyIngredient) => ({
        id: ing.id,
        name: ing.name
      })),
    [workspace, reactiveWorkspace.version]
  );

  const procedureSuggestions = useMemo(
    () =>
      Array.from(workspace.data.procedures.values()).map((proc: LibraryRuntime.IProcedure) => ({
        id: proc.id,
        name: proc.name
      })),
    [workspace, reactiveWorkspace.version]
  );

  // ---- Priority suggestions from base variation ----
  const procedureAlternates = useMemo(() => {
    const procs = session.baseConfection.goldenVariation.procedures;
    if (!procs) return [];
    return procs.options.map((rp) => ({
      id: rp.id,
      name: rp.procedure.name
    }));
  }, [session]);

  const ingredientAlternates = useMemo((): ReadonlyArray<ITypeaheadSuggestion<IngredientId>> => {
    const variation = session.baseConfection.goldenVariation;
    const alternates: Array<{ id: IngredientId; name: string }> = [];
    const seen = new Set<string>();

    const addChocolateSpec = (spec: LibraryRuntime.IResolvedChocolateSpec | undefined): void => {
      if (!spec) return;
      if (!seen.has(spec.chocolate.id)) {
        seen.add(spec.chocolate.id);
        alternates.push({ id: spec.chocolate.id, name: spec.chocolate.name });
      }
      for (const alt of spec.alternates) {
        if (!seen.has(alt.id)) {
          seen.add(alt.id);
          alternates.push({ id: alt.id, name: alt.name });
        }
      }
    };

    if ('shellChocolate' in variation) {
      const molded = variation as LibraryRuntime.IMoldedBonBonRecipeVariation;
      addChocolateSpec(molded.shellChocolate);
      for (const ac of molded.additionalChocolates ?? []) {
        addChocolateSpec(ac.chocolate);
      }
    }
    if ('enrobingChocolate' in variation) {
      const withEnrobing = variation as
        | LibraryRuntime.IBarTruffleRecipeVariation
        | LibraryRuntime.IRolledTruffleRecipeVariation;
      addChocolateSpec(withEnrobing.enrobingChocolate);
    }
    if ('coatings' in variation) {
      const rolled = variation as LibraryRuntime.IRolledTruffleRecipeVariation;
      if (rolled.coatings) {
        for (const opt of rolled.coatings.options) {
          if (!seen.has(opt.ingredient.id)) {
            seen.add(opt.ingredient.id);
            alternates.push({ id: opt.ingredient.id, name: opt.ingredient.name });
          }
        }
      }
    }

    return alternates;
  }, [session]);

  // ---- Procedure ----
  const currentProcedureId = useMemo(() => session.produced.procedureId, [session, sessionVersion]);
  const [editingProcedure, setEditingProcedure] = useState(false);
  const [newProcedureText, setNewProcedureText] = useState('');

  const handleProcedureSelect = useCallback(
    (suggestion: ITypeaheadSuggestion<ProcedureId>): void => {
      const result = session.produced.setProcedure(suggestion.id);
      if (result.isFailure()) return;
      setEditingProcedure(false);
      setNewProcedureText('');
      notifySession();
      autosaveIfNeeded();
    },
    [session, notifySession, autosaveIfNeeded]
  );

  const handleClearProcedure = useCallback((): void => {
    const result = session.produced.setProcedure(undefined);
    if (result.isFailure()) return;
    setEditingProcedure(false);
    setNewProcedureText('');
    notifySession();
    autosaveIfNeeded();
  }, [session, notifySession, autosaveIfNeeded]);

  // ---- Render ----
  return (
    <div className="flex h-full flex-col overflow-y-auto" onBlur={handlePanelBlur}>
      <EntityDetailHeader
        title={session.label ?? session.baseConfection.name}
        subtitle={sessionId}
        onClose={onClose}
      />

      <SessionStatusBar
        session={session}
        onStatusChange={handleStatusChange}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={(): void => {
          handleSave().catch(() => undefined);
        }}
        hasChanges={hasChanges}
        saveMode={saveMode}
        onSaveModeChange={handleSaveModeChange}
        onClose={onClose}
      />

      <div className="flex flex-col gap-4 p-4">
        {/* Recipe name with variation */}
        <div className="text-center">
          <div className="text-base font-semibold text-gray-900">
            {session.baseConfection.name}
            <span className="ml-1 font-normal text-gray-500">
              (
              {session.baseConfection.goldenVariation.name ??
                session.baseConfection.goldenVariation.variationSpec}
              )
            </span>
          </div>
          <div className="text-xs text-gray-400">{formatConfectionType(session.confectionType)}</div>
        </div>

        {/* Yield — compact inline */}
        <YieldSection
          session={session}
          sessionVersion={sessionVersion}
          notifySession={notifySession}
          autosaveIfNeeded={autosaveIfNeeded}
        />

        {/* Type-specific ingredient properties (no heading) */}
        <TypeSpecificSection
          session={session}
          workspace={workspace}
          reactiveVersion={reactiveWorkspace.version}
          ingredientSuggestions={ingredientSuggestions}
          ingredientAlternates={ingredientAlternates}
          notifySession={notifySession}
          autosaveIfNeeded={autosaveIfNeeded}
          onBrowseIngredient={onBrowseIngredient}
        />

        {/* Fillings */}
        <EditSection title="Fillings">
          {fillingSlots.length === 0 ? (
            <p className="text-sm text-gray-500">No fillings configured.</p>
          ) : (
            <div className="space-y-1">
              {fillingSlots.map((slot) => (
                <div
                  key={slot.slotId as string}
                  className="flex w-full items-center rounded border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <button
                    type="button"
                    onClick={(): void => handleSlotClick(slot.slotId, slot.name)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="text-sm font-medium text-gray-900">{slot.name}</div>
                    <div className="text-xs text-gray-500">
                      {slot.slotId as string}
                      {slot.slotType === 'ingredient' && ' (ingredient)'}
                    </div>
                  </button>
                  {slot.targetWeight !== undefined && (
                    <span className="ml-2 shrink-0 text-xs text-gray-500">{slot.targetWeight}g</span>
                  )}
                  <button
                    type="button"
                    onClick={(): void => handleRemoveSlot(slot.slotId)}
                    className="ml-2 text-gray-300 hover:text-red-500 p-0.5 shrink-0"
                    aria-label={`Remove ${slot.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2">
            <TypeaheadInput<FillingId>
              value={newFillingText}
              onChange={setNewFillingText}
              suggestions={fillingSuggestions}
              prioritySuggestions={fillingAlternates}
              onSelect={handleAddFilling}
              placeholder="Add filling…"
              className="text-sm border border-dashed border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-choco-primary"
            />
          </div>
        </EditSection>

        {/* Procedure */}
        <EditSection title="Procedure">
          <div className="space-y-2">
            {currentProcedureId && !editingProcedure && (
              <div className="rounded border border-gray-200 p-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(): void => setEditingProcedure(true)}
                  title="Edit procedure"
                  className="text-gray-400 hover:text-choco-primary p-0.5 shrink-0"
                >
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(): void => onBrowseProcedure?.(currentProcedureId)}
                  className="flex-1 text-sm text-gray-800 hover:text-choco-primary text-left truncate"
                  title="Browse procedure"
                >
                  {getProcedureName(currentProcedureId, workspace)}
                </button>
              </div>
            )}

            {currentProcedureId && editingProcedure && (
              <div className="rounded border border-choco-primary/30 bg-choco-primary/5 p-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(): void => setEditingProcedure(false)}
                    title="Done editing"
                    className="text-green-600 hover:text-green-700 p-0.5 shrink-0"
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                  </button>
                  <TypeaheadInput<ProcedureId>
                    value={getProcedureName(currentProcedureId, workspace)}
                    onChange={setNewProcedureText}
                    suggestions={procedureSuggestions}
                    prioritySuggestions={procedureAlternates}
                    onSelect={handleProcedureSelect}
                    autoFocus
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
                  />
                  <button
                    type="button"
                    onClick={handleClearProcedure}
                    className="text-gray-400 hover:text-red-500 p-1 shrink-0"
                    aria-label="Remove procedure"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {!currentProcedureId && (
              <TypeaheadInput<ProcedureId>
                value={newProcedureText}
                onChange={setNewProcedureText}
                suggestions={procedureSuggestions}
                prioritySuggestions={procedureAlternates}
                onSelect={handleProcedureSelect}
                placeholder="Type procedure name to set"
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
              />
            )}
          </div>
        </EditSection>

        {/* Notes */}
        <NotesEditor title="Session Notes" value={currentNotes} onChange={handleNotesChange} />
      </div>
    </div>
  );
}

// ============================================================================
// Yield Section (compact inline)
// ============================================================================

function YieldSection({
  session,
  sessionVersion,
  notifySession,
  autosaveIfNeeded
}: {
  readonly session: UserLibrary.Session.AnyConfectionEditingSession;
  readonly sessionVersion: number;
  readonly notifySession: () => void;
  readonly autosaveIfNeeded: () => void;
}): React.ReactElement {
  const currentYield = useMemo(() => session.produced.yield, [session, sessionVersion]);
  const isMolded = Entities.Confections.isMoldedBonBonYield(currentYield);

  if (isMolded) {
    return (
      <MoldedBonBonYieldEditor
        session={session as UserLibrary.Session.MoldedBonBonEditingSession}
        currentYield={currentYield}
        notifySession={notifySession}
        autosaveIfNeeded={autosaveIfNeeded}
      />
    );
  }

  return (
    <CountYieldEditor
      session={session}
      currentYield={currentYield}
      notifySession={notifySession}
      autosaveIfNeeded={autosaveIfNeeded}
    />
  );
}

// ============================================================================
// Count Yield Editor (bar truffle, rolled truffle) — compact inline
// ============================================================================

function CountYieldEditor({
  session,
  currentYield,
  notifySession,
  autosaveIfNeeded
}: {
  readonly session: UserLibrary.Session.AnyConfectionEditingSession;
  readonly currentYield: Entities.Confections.IConfectionYield;
  readonly notifySession: () => void;
  readonly autosaveIfNeeded: () => void;
}): React.ReactElement {
  const [countInput, setCountInput] = useState<string>(String(currentYield.count));
  const [error, setError] = useState<string | undefined>(undefined);

  const handleApply = useCallback((): void => {
    const parsed = Number(countInput.trim());
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Count must be a positive number.');
      return;
    }

    const result = session.scaleToYield({ count: parsed, unit: 'pieces' });
    if (result.isFailure()) {
      setError(result.message);
      return;
    }

    setError(undefined);
    notifySession();
    autosaveIfNeeded();
  }, [countInput, session, notifySession, autosaveIfNeeded]);

  return (
    <div>
      <div className="text-xs font-medium text-gray-500 uppercase mb-0.5">Yield</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          step="1"
          value={countInput}
          onChange={(e): void => setCountInput(e.target.value)}
          onBlur={handleApply}
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <span className="text-sm text-gray-700">{currentYield.unit ?? 'pieces'}</span>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ============================================================================
// Molded BonBon Yield Editor — compact inline
// ============================================================================

function MoldedBonBonYieldEditor({
  session,
  currentYield,
  notifySession,
  autosaveIfNeeded
}: {
  readonly session: UserLibrary.Session.MoldedBonBonEditingSession;
  readonly currentYield: Entities.Confections.IMoldedBonBonYield;
  readonly notifySession: () => void;
  readonly autosaveIfNeeded: () => void;
}): React.ReactElement {
  const [framesInput, setFramesInput] = useState<string>(String(currentYield.frames));
  const [bufferInput, setBufferInput] = useState<string>(
    String(Math.round(currentYield.bufferPercentage * 100))
  );
  const [error, setError] = useState<string | undefined>(undefined);

  const handleApply = useCallback((): void => {
    const frames = Number(framesInput.trim());
    const bufferPercent = Number(bufferInput.trim());
    if (!Number.isFinite(frames) || frames <= 0) {
      setError('Frames must be a positive number.');
      return;
    }
    if (!Number.isFinite(bufferPercent) || bufferPercent < 0 || bufferPercent > 100) {
      setError('Buffer % must be between 0 and 100.');
      return;
    }

    const result = session.setFrames(frames, bufferPercent / 100);
    if (result.isFailure()) {
      setError(result.message);
      return;
    }

    setError(undefined);
    notifySession();
    autosaveIfNeeded();
  }, [framesInput, bufferInput, session, notifySession, autosaveIfNeeded]);

  return (
    <div>
      <div className="text-xs font-medium text-gray-500 uppercase mb-0.5">Yield</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          step="1"
          value={framesInput}
          onChange={(e): void => setFramesInput(e.target.value)}
          onBlur={handleApply}
          className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <span className="text-xs text-gray-500">frames</span>
        <input
          type="number"
          min="0"
          max="100"
          step="1"
          value={bufferInput}
          onChange={(e): void => setBufferInput(e.target.value)}
          onBlur={handleApply}
          className="w-14 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <span className="text-xs text-gray-500">% buffer</span>
        <span className="text-xs text-gray-400">
          = {currentYield.count} {currentYield.unit ?? 'pieces'}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ============================================================================
// Type-Specific Section (no heading — controls shown directly)
// ============================================================================

function TypeSpecificSection({
  session,
  workspace,
  reactiveVersion,
  ingredientSuggestions,
  ingredientAlternates,
  notifySession,
  autosaveIfNeeded,
  onBrowseIngredient
}: {
  readonly session: UserLibrary.Session.AnyConfectionEditingSession;
  readonly workspace: IWorkspace;
  readonly reactiveVersion: number;
  readonly ingredientSuggestions: ReadonlyArray<ITypeaheadSuggestion<IngredientId>>;
  readonly ingredientAlternates: ReadonlyArray<ITypeaheadSuggestion<IngredientId>>;
  readonly notifySession: () => void;
  readonly autosaveIfNeeded: () => void;
  readonly onBrowseIngredient?: (ingredientId: IngredientId) => void;
}): React.ReactElement | null {
  const produced = session.produced;

  if (produced instanceof LibraryRuntime.ProducedMoldedBonBon) {
    return (
      <div className="space-y-1">
        <DetailRow label="Mold" value={String(produced.moldId)} />
        <IngredientEditRow
          label="Shell Chocolate"
          ingredientId={produced.shellChocolateId}
          workspace={workspace}
          reactiveVersion={reactiveVersion}
          suggestions={ingredientSuggestions}
          prioritySuggestions={ingredientAlternates}
          onSelect={(id): void => {
            const result = produced.setShellChocolate(id);
            if (result.isFailure()) return;
            notifySession();
            autosaveIfNeeded();
          }}
          onBrowse={onBrowseIngredient}
        />
        <IngredientEditRow
          label="Seal Chocolate"
          ingredientId={produced.sealChocolateId}
          workspace={workspace}
          reactiveVersion={reactiveVersion}
          suggestions={ingredientSuggestions}
          prioritySuggestions={ingredientAlternates}
          onSelect={(id): void => {
            const result = produced.setSealChocolate(id);
            if (result.isFailure()) return;
            notifySession();
            autosaveIfNeeded();
          }}
          onClear={(): void => {
            const result = produced.setSealChocolate(undefined);
            if (result.isFailure()) return;
            notifySession();
            autosaveIfNeeded();
          }}
          onBrowse={onBrowseIngredient}
        />
        <IngredientEditRow
          label="Decoration Chocolate"
          ingredientId={produced.decorationChocolateId}
          workspace={workspace}
          reactiveVersion={reactiveVersion}
          suggestions={ingredientSuggestions}
          prioritySuggestions={ingredientAlternates}
          onSelect={(id): void => {
            const result = produced.setDecorationChocolate(id);
            if (result.isFailure()) return;
            notifySession();
            autosaveIfNeeded();
          }}
          onClear={(): void => {
            const result = produced.setDecorationChocolate(undefined);
            if (result.isFailure()) return;
            notifySession();
            autosaveIfNeeded();
          }}
          onBrowse={onBrowseIngredient}
        />
      </div>
    );
  }

  if (produced instanceof LibraryRuntime.ProducedBarTruffle) {
    return (
      <div>
        <div className="text-xs font-medium text-gray-500 uppercase mb-0.5">Enrobing Chocolate</div>
        <IngredientEditRow
          label="Enrobing Chocolate"
          ingredientId={produced.enrobingChocolateId}
          workspace={workspace}
          reactiveVersion={reactiveVersion}
          suggestions={ingredientSuggestions}
          prioritySuggestions={ingredientAlternates}
          hideLabel
          onSelect={(id): void => {
            const result = produced.setEnrobingChocolate(id);
            if (result.isFailure()) return;
            notifySession();
            autosaveIfNeeded();
          }}
          onClear={(): void => {
            const result = produced.setEnrobingChocolate(undefined);
            if (result.isFailure()) return;
            notifySession();
            autosaveIfNeeded();
          }}
          onBrowse={onBrowseIngredient}
        />
      </div>
    );
  }

  if (produced instanceof LibraryRuntime.ProducedRolledTruffle) {
    return (
      <div className="space-y-1">
        <IngredientEditRow
          label="Enrobing Chocolate"
          ingredientId={produced.enrobingChocolateId}
          workspace={workspace}
          reactiveVersion={reactiveVersion}
          suggestions={ingredientSuggestions}
          prioritySuggestions={ingredientAlternates}
          onSelect={(id): void => {
            const result = produced.setEnrobingChocolate(id);
            if (result.isFailure()) return;
            notifySession();
            autosaveIfNeeded();
          }}
          onClear={(): void => {
            const result = produced.setEnrobingChocolate(undefined);
            if (result.isFailure()) return;
            notifySession();
            autosaveIfNeeded();
          }}
          onBrowse={onBrowseIngredient}
        />
        <IngredientEditRow
          label="Coating"
          ingredientId={produced.coatingId}
          workspace={workspace}
          reactiveVersion={reactiveVersion}
          suggestions={ingredientSuggestions}
          prioritySuggestions={ingredientAlternates}
          onSelect={(id): void => {
            const result = produced.setCoating(id);
            if (result.isFailure()) return;
            notifySession();
            autosaveIfNeeded();
          }}
          onClear={(): void => {
            const result = produced.setCoating(undefined);
            if (result.isFailure()) return;
            notifySession();
            autosaveIfNeeded();
          }}
          onBrowse={onBrowseIngredient}
        />
      </div>
    );
  }

  return null;
}

// ============================================================================
// Ingredient Edit Row (browse + typeahead edit with priority suggestions)
// ============================================================================

function IngredientEditRow({
  label,
  ingredientId,
  workspace,
  reactiveVersion,
  suggestions,
  prioritySuggestions,
  onSelect,
  onClear,
  hideLabel,
  onBrowse
}: {
  readonly label: string;
  readonly ingredientId: IngredientId | undefined;
  readonly workspace: IWorkspace;
  readonly reactiveVersion: number;
  readonly suggestions: ReadonlyArray<ITypeaheadSuggestion<IngredientId>>;
  readonly prioritySuggestions?: ReadonlyArray<ITypeaheadSuggestion<IngredientId>>;
  readonly onSelect: (id: IngredientId) => void;
  readonly onClear?: () => void;
  readonly hideLabel?: boolean;
  readonly onBrowse?: (ingredientId: IngredientId) => void;
}): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState('');

  const name = useMemo(
    () => (ingredientId ? getIngredientName(ingredientId, workspace) : undefined),
    [ingredientId, workspace, reactiveVersion]
  );

  const handleSelect = useCallback(
    (suggestion: ITypeaheadSuggestion<IngredientId>): void => {
      onSelect(suggestion.id);
      setEditing(false);
      setInputText('');
    },
    [onSelect]
  );

  const handleClear = useCallback((): void => {
    onClear?.();
    setEditing(false);
    setInputText('');
  }, [onClear]);

  // Has a value and not editing — show view mode with edit toggle
  if (ingredientId && name && !editing) {
    return (
      <div className="flex items-center justify-between py-0.5">
        {!hideLabel && <span className="text-xs text-gray-500">{label}</span>}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(): void => setEditing(true)}
            title={`Edit ${label.toLowerCase()}`}
            className="text-gray-400 hover:text-choco-primary p-0.5 shrink-0"
          >
            <ArrowPathIcon className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={(): void => onBrowse?.(ingredientId)}
            className="text-sm text-choco-primary hover:underline"
          >
            {name}
          </button>
        </div>
      </div>
    );
  }

  // Editing mode or no current value — show typeahead (full width)
  return (
    <div className="py-0.5">
      {!hideLabel && <div className="text-xs text-gray-500 mb-0.5">{label}</div>}
      <div className="flex items-center gap-1.5">
        {editing && (
          <button
            type="button"
            onClick={(): void => setEditing(false)}
            title="Done editing"
            className="text-green-600 hover:text-green-700 p-0.5 shrink-0"
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </button>
        )}
        <TypeaheadInput<IngredientId>
          value={editing && name ? name : inputText}
          onChange={setInputText}
          suggestions={suggestions}
          prioritySuggestions={prioritySuggestions}
          onSelect={handleSelect}
          placeholder={`Type ${label.toLowerCase()} name`}
          autoFocus={editing}
          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-choco-primary"
        />
        {editing && onClear && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-red-500 p-1 shrink-0"
            aria-label={`Remove ${label.toLowerCase()}`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
