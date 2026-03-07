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
import { DetailSection, DetailRow } from '@fgv/ts-app-shell';
import {
  Entities,
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

  // ---- Procedure ----
  const currentProcedureId = useMemo(() => session.produced.procedureId, [session, sessionVersion]);

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
        {/* Session info */}
        <DetailSection title="Confection">
          <DetailRow label="Recipe" value={session.baseConfection.name} />
          <DetailRow label="Type" value={formatConfectionType(session.confectionType)} />
          <DetailRow label="Variation" value={session.sourceVariationId} />
        </DetailSection>

        {/* Yield section — type-dispatched */}
        <YieldSection
          session={session}
          sessionVersion={sessionVersion}
          notifySession={notifySession}
          autosaveIfNeeded={autosaveIfNeeded}
        />

        {/* Type-specific properties */}
        <TypeSpecificSection
          session={session}
          sessionVersion={sessionVersion}
          workspace={workspace}
          reactiveVersion={reactiveWorkspace.version}
          onBrowseIngredient={onBrowseIngredient}
        />

        {/* Filling slots */}
        <DetailSection title="Filling Slots">
          {fillingSlots.length === 0 ? (
            <p className="text-sm text-gray-500">No filling slots configured.</p>
          ) : (
            <div className="space-y-1">
              {fillingSlots.map((slot) => (
                <button
                  key={slot.slotId as string}
                  type="button"
                  onClick={(): void => handleSlotClick(slot.slotId, slot.name)}
                  className="flex w-full items-center justify-between rounded border border-gray-200 bg-white px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">{slot.name}</div>
                    <div className="text-xs text-gray-500">
                      {slot.slotId as string}
                      {slot.slotType === 'ingredient' && ' (ingredient)'}
                    </div>
                  </div>
                  {slot.targetWeight !== undefined && (
                    <div className="ml-2 shrink-0 text-xs text-gray-500">{slot.targetWeight}g</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </DetailSection>

        {/* Procedure */}
        {currentProcedureId && (
          <DetailSection title="Procedure">
            <button
              type="button"
              onClick={(): void => onBrowseProcedure?.(currentProcedureId)}
              className="text-sm text-choco-primary hover:underline"
            >
              {getProcedureName(currentProcedureId, workspace)}
            </button>
          </DetailSection>
        )}

        {/* Notes */}
        <NotesEditor title="Session Notes" value={currentNotes} onChange={handleNotesChange} />
      </div>
    </div>
  );
}

// ============================================================================
// Yield Section
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
// Count Yield Editor (bar truffle, rolled truffle)
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
    <DetailSection title="Yield">
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          Count
          <input
            type="number"
            min="1"
            step="1"
            value={countInput}
            onChange={(e): void => setCountInput(e.target.value)}
            onBlur={handleApply}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <span className="pb-1 text-xs text-gray-500">{currentYield.unit ?? 'pieces'}</span>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </DetailSection>
  );
}

// ============================================================================
// Molded BonBon Yield Editor
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
    <DetailSection title="Yield">
      <div className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          Frames
          <input
            type="number"
            min="1"
            step="1"
            value={framesInput}
            onChange={(e): void => setFramesInput(e.target.value)}
            onBlur={handleApply}
            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          Buffer %
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={bufferInput}
            onChange={(e): void => setBufferInput(e.target.value)}
            onBlur={handleApply}
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {currentYield.count} {currentYield.unit ?? 'pieces'}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </DetailSection>
  );
}

// ============================================================================
// Type-Specific Section
// ============================================================================

function TypeSpecificSection({
  session,
  sessionVersion,
  workspace,
  reactiveVersion,
  onBrowseIngredient
}: {
  readonly session: UserLibrary.Session.AnyConfectionEditingSession;
  readonly sessionVersion: number;
  readonly workspace: IWorkspace;
  readonly reactiveVersion: number;
  readonly onBrowseIngredient?: (ingredientId: IngredientId) => void;
}): React.ReactElement | null {
  const produced = useMemo(() => session.produced.current, [session, sessionVersion]);

  if (Entities.Confections.isProducedMoldedBonBonEntity(produced)) {
    return (
      <DetailSection title="Molded Bonbon">
        <DetailRow label="Mold" value={String(produced.moldId)} />
        <IngredientBrowseRow
          label="Shell Chocolate"
          ingredientId={produced.shellChocolateId}
          workspace={workspace}
          reactiveVersion={reactiveVersion}
          onBrowse={onBrowseIngredient}
        />
        {produced.sealChocolateId && (
          <IngredientBrowseRow
            label="Seal Chocolate"
            ingredientId={produced.sealChocolateId}
            workspace={workspace}
            reactiveVersion={reactiveVersion}
            onBrowse={onBrowseIngredient}
          />
        )}
        {produced.decorationChocolateId && (
          <IngredientBrowseRow
            label="Decoration Chocolate"
            ingredientId={produced.decorationChocolateId}
            workspace={workspace}
            reactiveVersion={reactiveVersion}
            onBrowse={onBrowseIngredient}
          />
        )}
      </DetailSection>
    );
  }

  if (Entities.Confections.isProducedBarTruffleEntity(produced)) {
    if (!produced.enrobingChocolateId) return null;
    return (
      <DetailSection title="Bar Truffle">
        <IngredientBrowseRow
          label="Enrobing Chocolate"
          ingredientId={produced.enrobingChocolateId}
          workspace={workspace}
          reactiveVersion={reactiveVersion}
          onBrowse={onBrowseIngredient}
        />
      </DetailSection>
    );
  }

  if (Entities.Confections.isProducedRolledTruffleEntity(produced)) {
    if (!produced.enrobingChocolateId && !produced.coatingId) return null;
    return (
      <DetailSection title="Rolled Truffle">
        {produced.enrobingChocolateId && (
          <IngredientBrowseRow
            label="Enrobing Chocolate"
            ingredientId={produced.enrobingChocolateId}
            workspace={workspace}
            reactiveVersion={reactiveVersion}
            onBrowse={onBrowseIngredient}
          />
        )}
        {produced.coatingId && (
          <IngredientBrowseRow
            label="Coating"
            ingredientId={produced.coatingId}
            workspace={workspace}
            reactiveVersion={reactiveVersion}
            onBrowse={onBrowseIngredient}
          />
        )}
      </DetailSection>
    );
  }

  return null;
}

// ============================================================================
// Ingredient Browse Row
// ============================================================================

function IngredientBrowseRow({
  label,
  ingredientId,
  workspace,
  reactiveVersion,
  onBrowse
}: {
  readonly label: string;
  readonly ingredientId: IngredientId;
  readonly workspace: IWorkspace;
  readonly reactiveVersion: number;
  readonly onBrowse?: (ingredientId: IngredientId) => void;
}): React.ReactElement {
  const name = useMemo(
    () => getIngredientName(ingredientId, workspace),
    [ingredientId, workspace, reactiveVersion]
  );

  if (onBrowse) {
    return (
      <div className="flex items-center justify-between py-0.5">
        <span className="text-xs text-gray-500">{label}</span>
        <button
          type="button"
          onClick={(): void => onBrowse(ingredientId)}
          className="text-sm text-choco-primary hover:underline"
        >
          {name}
        </button>
      </div>
    );
  }

  return <DetailRow label={label} value={name} />;
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function formatConfectionType(type: string): string {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
