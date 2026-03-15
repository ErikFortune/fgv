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
 * Create panel for adding a new location.
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useState } from 'react';

import { Helpers } from '@fgv/ts-chocolate';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the CreateLocationPanel component.
 * @public
 */
export interface ICreateLocationPanelProps {
  /** Called when the user confirms creation with baseId, name, and optional description */
  readonly onConfirm: (baseId: string, name: string, description?: string) => void;
  /** Called when the user cancels creation */
  readonly onCancel: () => void;
  /** Optional pre-filled name (e.g. from on-blur cascade) */
  readonly initialName?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Panel for creating a new location.
 *
 * Derives a base ID (slug) from the name, but allows the user to override it.
 *
 * @public
 */
export function CreateLocationPanel(props: ICreateLocationPanelProps): React.ReactElement {
  const { onConfirm, onCancel, initialName } = props;

  const [name, setName] = useState(initialName ?? '');
  const [idOverride, setIdOverride] = useState('');
  const [description, setDescription] = useState('');

  const generatedId = useMemo(() => {
    const result = Helpers.nameToBaseId(name);
    return result.isSuccess() ? result.value : '';
  }, [name]);

  const effectiveId = idOverride || generatedId;

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value);
  }, []);

  const handleIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    const result = Helpers.nameToBaseId(e.target.value);
    setIdOverride(result.isSuccess() ? result.value : '');
  }, []);

  const handleConfirm = useCallback((): void => {
    const trimmedName = name.trim();
    if (!trimmedName || !effectiveId) return;
    onConfirm(effectiveId, trimmedName, description.trim() || undefined);
  }, [name, effectiveId, description, onConfirm]);

  const isValid = name.trim().length > 0 && effectiveId.length > 0;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">New Location</h2>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="e.g. Kitchen Shelf"
          autoFocus
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* ID (derived from name, editable) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ID
          {!idOverride && generatedId && (
            <span className="text-gray-400 font-normal ml-1">(derived from name)</span>
          )}
        </label>
        <input
          type="text"
          value={effectiveId}
          onChange={handleIdChange}
          placeholder="e.g. kitchen-shelf"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e): void => setDescription(e.target.value)}
          placeholder="Optional description of this location"
          rows={3}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-choco-primary resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className="px-4 py-2 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Create Location
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
