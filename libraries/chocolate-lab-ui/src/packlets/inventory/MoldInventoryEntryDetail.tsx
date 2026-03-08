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
 * Read-only mold inventory entry detail view.
 * @packageDocumentation
 */

import React from 'react';

import { DetailSection, DetailRow } from '@fgv/ts-app-shell';
import type { MoldId, UserLibrary } from '@fgv/ts-chocolate';
import { EntityDetailHeader, NotesSection } from '../common';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the MoldInventoryEntryDetail component.
 * @public
 */
export interface IMoldInventoryEntryDetailProps {
  /** The materialized mold inventory entry to display */
  readonly entry: UserLibrary.IMoldInventoryEntry;
  /** Optional callback to switch to edit mode */
  readonly onEdit?: () => void;
  /** Optional callback to delete this entry */
  readonly onDelete?: () => void;
  /** Optional callback to browse the referenced mold in cascade */
  readonly onBrowseMold?: (moldId: MoldId) => void;
  /** Optional callback to close this panel */
  readonly onClose?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Read-only detail view for a mold inventory entry.
 *
 * Displays:
 * - Header with mold display name and format badge
 * - Clickable mold reference for cascade drill-down
 * - Count, location
 * - Notes
 *
 * @public
 */
export function MoldInventoryEntryDetail(props: IMoldInventoryEntryDetailProps): React.ReactElement {
  const { entry, onEdit, onDelete, onClose, onBrowseMold } = props;
  const mold = entry.item;

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <EntityDetailHeader
        title={mold.displayName}
        description={`Inventory entry · ${entry.quantity}×`}
        badge={{ label: mold.format, colorClass: 'bg-choco-primary/10 text-choco-primary' }}
        subtitle={entry.id}
        onEdit={onEdit}
        onClose={onClose}
      />

      {/* Mold Reference */}
      <DetailSection title="Mold">
        <div className="flex items-center gap-2">
          {onBrowseMold ? (
            <button
              onClick={(): void => onBrowseMold(mold.id as MoldId)}
              className="text-sm text-choco-primary hover:underline"
            >
              {mold.displayName}
            </button>
          ) : (
            <span className="text-sm text-gray-700">{mold.displayName}</span>
          )}
          <span className="text-xs text-gray-400 font-mono">{mold.id}</span>
        </div>
        {mold.manufacturer && <DetailRow label="Manufacturer" value={mold.manufacturer} />}
        {mold.cavityCount !== undefined && (
          <DetailRow label="Cavities" value={`${mold.cavityCount} cavities`} />
        )}
      </DetailSection>

      {/* Inventory Details */}
      <DetailSection title="Inventory">
        <DetailRow label="Count" value={entry.quantity} />
        {entry.location && <DetailRow label="Location" value={entry.location} />}
      </DetailSection>

      {/* Notes */}
      {entry.notes && <NotesSection notes={entry.notes} />}

      {/* Delete */}
      {onDelete && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          >
            Delete Entry
          </button>
        </div>
      )}
    </div>
  );
}
