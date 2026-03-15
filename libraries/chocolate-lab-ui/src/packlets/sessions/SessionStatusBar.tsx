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
 * Session status bar with undo/redo, status toggle, save/autosave, and metadata.
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUturnLeftIcon, ArrowUturnRightIcon, CheckIcon } from '@heroicons/react/20/solid';
import { MultiActionButton, type IMultiActionButtonAction } from '@fgv/ts-app-shell';
import type { Entities, UserLibrary } from '@fgv/ts-chocolate';

// ============================================================================
// Types
// ============================================================================

/**
 * Save mode for the session status bar.
 * - `manual`: User clicks Save to persist changes.
 * - `autosave`: Changes are persisted automatically on blur.
 * @public
 */
export type SaveMode = 'manual' | 'autosave';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the SessionStatusBar component.
 * @public
 */
export interface ISessionStatusBarProps {
  /** The materialized session for metadata display */
  readonly session: UserLibrary.IMaterializedSessionBase;
  /** Called when the user changes the session status */
  readonly onStatusChange: (status: Entities.PersistedSessionStatus) => void;
  /** Whether undo is available */
  readonly canUndo: boolean;
  /** Whether redo is available */
  readonly canRedo: boolean;
  /** Called when the user clicks undo */
  readonly onUndo: () => void;
  /** Called when the user clicks redo */
  readonly onRedo: () => void;
  /** Called when the user clicks save */
  readonly onSave: () => void;
  /** Whether the session has unsaved changes */
  readonly hasChanges: boolean;
  /** Current save mode */
  readonly saveMode: SaveMode;
  /** Called when the user toggles save mode */
  readonly onSaveModeChange: (mode: SaveMode) => void;
  /** Optional callback to commit the session to the journal */
  readonly onCommit?: () => void;
  /** Whether execution is complete (all steps done or no steps to track). Defaults to true. */
  readonly isExecutionComplete?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Compact status bar for session panels.
 *
 * Provides undo/redo controls, a lifecycle multi-action button (Start / In Production / Commit),
 * a save/autosave button, and session metadata display.
 *
 * @public
 */
export function SessionStatusBar({
  session,
  onStatusChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  hasChanges,
  saveMode,
  onSaveModeChange,
  onCommit,
  isExecutionComplete = true
}: ISessionStatusBarProps): React.ReactElement {
  const hasMetadata = !!(session.group || session.updatedAt);

  // ── Local status tracking ──
  // session.status is a snapshot from the persisted entity and won't update after
  // onStatusChange is called. Track locally for immediate UI feedback, syncing
  // from the session when it changes (e.g., navigation).
  const [localStatus, setLocalStatus] = useState(session.status);
  useEffect(() => {
    setLocalStatus(session.status);
  }, [session.status]);

  const handleStatusChange = useCallback(
    (status: Entities.PersistedSessionStatus): void => {
      setLocalStatus(status);
      onStatusChange(status);
    },
    [onStatusChange]
  );

  // ── Lifecycle multi-action button ──

  const statusAction = useMemo<IMultiActionButtonAction>(() => {
    switch (localStatus) {
      case 'planning':
        return { id: 'start', label: 'Start', onSelect: (): void => handleStatusChange('active') };
      case 'active':
        return isExecutionComplete && onCommit
          ? { id: 'commit', label: 'Commit', onSelect: onCommit }
          : { id: 'in-production', label: 'In Production', onSelect: (): void => {} };
      case 'committing':
        return { id: 'committing', label: 'Committing\u2026', onSelect: (): void => {} };
      case 'committed':
        return { id: 'committed', label: 'Committed', onSelect: (): void => {} };
      case 'abandoned':
        return { id: 'abandoned', label: 'Abandoned', onSelect: (): void => {} };
    }
  }, [localStatus, isExecutionComplete, handleStatusChange, onCommit]);

  const statusAlternatives = useMemo<ReadonlyArray<IMultiActionButtonAction>>(() => {
    switch (localStatus) {
      case 'planning':
        return [
          ...(onCommit ? [{ id: 'commit', label: 'Commit', onSelect: onCommit }] : []),
          { id: 'abandon', label: 'Abandon', onSelect: (): void => handleStatusChange('abandoned') }
        ];
      case 'active':
        return [
          {
            id: 'back-to-planning',
            label: 'Back to Planning',
            onSelect: (): void => handleStatusChange('planning')
          },
          ...(onCommit && !isExecutionComplete
            ? [{ id: 'commit', label: 'Commit', onSelect: onCommit }]
            : []),
          { id: 'abandon', label: 'Abandon', onSelect: (): void => handleStatusChange('abandoned') }
        ];
      default:
        return [];
    }
  }, [session.status, isExecutionComplete, onStatusChange, onCommit]);

  const isStatusDisabled = localStatus === 'active' && !isExecutionComplete;
  const statusVariant =
    localStatus === 'planning' || (localStatus === 'active' && isExecutionComplete)
      ? ('primary' as const)
      : ('default' as const);

  // ── Save / Autosave button ──

  const saveAction = useMemo<IMultiActionButtonAction>(
    () =>
      saveMode === 'manual'
        ? { id: 'save', label: 'Save', icon: <CheckIcon className="h-3.5 w-3.5" />, onSelect: onSave }
        : {
            id: 'autosave',
            label: 'Autosave',
            icon: <CheckIcon className="h-3.5 w-3.5" />,
            onSelect: (): void => {}
          },
    [saveMode, onSave]
  );

  const saveAlternatives = useMemo<ReadonlyArray<IMultiActionButtonAction>>(
    () => [
      saveMode === 'manual'
        ? {
            id: 'switch-autosave',
            label: 'Switch to Autosave',
            onSelect: (): void => onSaveModeChange('autosave')
          }
        : { id: 'switch-manual', label: 'Switch to Save', onSelect: (): void => onSaveModeChange('manual') }
    ],
    [saveMode, onSaveModeChange]
  );

  // In manual mode, disable when no changes. In autosave mode, always disabled (indicator only).
  const isSaveDisabled = saveMode === 'manual' ? !hasChanges : true;

  return (
    <div className="flex flex-col border-b border-gray-200 bg-gray-50">
      {/* Button row — never wraps */}
      <div className="flex flex-nowrap items-center gap-1 px-3 py-1.5">
        {/* Undo / Redo group */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            <ArrowUturnRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Spacer — balances save button on the right so status button centers */}
        <div className="flex-1" />

        {/* Lifecycle multi-action button */}
        <MultiActionButton
          primaryAction={statusAction}
          alternativeActions={statusAlternatives}
          variant={statusVariant}
          disabled={isStatusDisabled}
          dropdownDisabled={statusAlternatives.length === 0}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Save / Autosave button */}
        <MultiActionButton
          primaryAction={saveAction}
          alternativeActions={saveAlternatives}
          disabled={isSaveDisabled}
          dropdownDisabled={false}
        />
      </div>

      {/* Metadata row — centered, only shown when there's metadata */}
      {hasMetadata && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 px-3 pb-1.5 text-[11px] text-gray-400">
          {session.group && (
            <span>
              Group: <span className="text-gray-600">{session.group}</span>
            </span>
          )}
          {session.updatedAt && <span>Updated: {formatTimestamp(session.updatedAt)}</span>}
        </div>
      )}
    </div>
  );
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
