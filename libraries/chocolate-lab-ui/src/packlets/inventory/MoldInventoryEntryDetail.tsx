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
  const { entry, onEdit, onClose, onBrowseMold } = props;
  const mold = entry.item;
  const locationName = entry.location?.name;

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <EntityDetailHeader
        title={mold.displayName}
        badge={{ label: mold.format, colorClass: 'bg-choco-primary/10 text-choco-primary' }}
        subtitle={entry.id}
        onEdit={onEdit}
        onClose={onClose}
      />

      {/* Location (centered, title case) */}
      {locationName && <p className="text-sm text-gray-500 text-center py-2">{locationName}</p>}

      {/* Count × Mold name */}
      <div className="py-3 text-sm text-gray-700">
        <span className="font-medium">{entry.quantity}×</span>{' '}
        {onBrowseMold ? (
          <button
            onClick={(): void => onBrowseMold(mold.id as MoldId)}
            className="text-choco-primary hover:underline"
          >
            {mold.displayName}
          </button>
        ) : (
          <span>{mold.displayName}</span>
        )}
      </div>

      {/* Notes */}
      <NotesSection notes={entry.notes ?? []} />
    </div>
  );
}
