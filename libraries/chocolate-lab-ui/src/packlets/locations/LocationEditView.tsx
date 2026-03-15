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
 * Edit form for a location entity.
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';

import type { Entities, LocationId, Model as CommonModel } from '@fgv/ts-chocolate';

type ILocationEntity = Entities.Locations.ILocationEntity;

import { NotesEditor, UrlsEditor } from '../editing';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the LocationEditView component.
 * @public
 */
export interface ILocationEditViewProps {
  /** Composite location ID */
  readonly locationId: LocationId;
  /** The location entity being edited */
  readonly entity: ILocationEntity;
  /** Called with the updated entity when the user saves */
  readonly onSave: (entity: ILocationEntity) => void;
  /** Called when the user cancels editing */
  readonly onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Edit form for a location entity.
 *
 * Allows editing name, description, and notes. The base ID is read-only.
 *
 * @public
 */
export function LocationEditView(props: ILocationEditViewProps): React.ReactElement {
  const { locationId, entity, onSave, onCancel } = props;

  const [name, setName] = useState(entity.name);
  const [description, setDescription] = useState(entity.description ?? '');
  const [notes, setNotes] = useState<ReadonlyArray<CommonModel.ICategorizedNote> | undefined>(
    entity.notes as ReadonlyArray<CommonModel.ICategorizedNote> | undefined
  );
  const [urls, setUrls] = useState<ReadonlyArray<CommonModel.ICategorizedUrl> | undefined>(
    entity.urls as ReadonlyArray<CommonModel.ICategorizedUrl> | undefined
  );

  const handleSave = useCallback((): void => {
    const updated: ILocationEntity = {
      baseId: entity.baseId,
      name: name.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(notes && notes.length > 0 ? { notes } : {}),
      ...(urls && urls.length > 0 ? { urls } : {})
    };
    onSave(updated);
  }, [entity, name, description, notes, urls, onSave]);

  const isValid = name.trim().length > 0;

  return (
    <div className="p-4 overflow-y-auto h-full">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{entity.name}</h2>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{locationId}</p>
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e): void => setName(e.target.value)}
          placeholder="e.g. Kitchen Shelf"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e): void => setDescription(e.target.value)}
          placeholder="Optional description of this location"
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary resize-y"
        />
      </div>

      {/* Notes */}
      <NotesEditor value={notes} onChange={setNotes} />

      {/* URLs */}
      <UrlsEditor value={urls} onChange={setUrls} />

      {/* Actions */}
      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="px-4 py-2 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
