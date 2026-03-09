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

import React, { useMemo } from 'react';
import { ArrowUturnLeftIcon, ArrowUturnRightIcon, CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { MultiActionButton, type IMultiActionButtonAction } from '@fgv/ts-app-shell';
import { Entities, type UserLibrary } from '@fgv/ts-chocolate';

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
// Status Colors
// ============================================================================

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  committing: 'bg-yellow-100 text-yellow-800',
  committed: 'bg-gray-100 text-gray-800',
  abandoned: 'bg-red-100 text-red-800'
};

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
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
  /** Optional callback to commit the session to the journal */
  readonly onCommit?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Compact status bar for session panels.
 *
 * Provides undo/redo controls, a status dropdown for toggling session
 * lifecycle state, a save/autosave button, and session metadata display.
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
  onClose,
  onCommit
}: ISessionStatusBarProps): React.ReactElement {
  const statusColor = STATUS_COLORS[session.status] ?? 'bg-gray-100 text-gray-800';
  const hasMetadata = !!(session.group || session.updatedAt);

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

        {/* Divider */}
        <div className="w-px h-4 bg-gray-300 mx-1" />

        {/* Status dropdown (styled with color) */}
        <select
          value={session.status}
          onChange={(e): void => onStatusChange(e.target.value as Entities.PersistedSessionStatus)}
          className={`text-xs font-medium border-none rounded px-1.5 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-choco-primary ${statusColor}`}
        >
          {Entities.Session.allPersistedSessionStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Close button */}
        {onClose && (
          <>
            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
          </>
        )}

        {/* Commit button — only for uncommitted sessions */}
        {onCommit && session.status !== 'committed' && session.status !== 'abandoned' && (
          <>
            <button
              type="button"
              onClick={onCommit}
              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded transition-colors bg-choco-primary text-white hover:bg-choco-primary/90"
            >
              Commit
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
          </>
        )}

        {/* Save / Autosave button */}
        <MultiActionButton
          primaryAction={saveAction}
          alternativeActions={saveAlternatives}
          disabled={isSaveDisabled}
          dropdownDisabled={false}
        />
      </div>

      {/* Metadata row — wraps naturally, only shown when there's metadata */}
      {hasMetadata && (
        <div className="flex flex-wrap items-center gap-x-3 px-3 pb-1.5 text-[11px] text-gray-400">
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
