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
 * Dialog for creating a new collection with name, ID, description, and tags.
 *
 * Auto-generates a kebab-case collection ID from the name using
 * {@link @fgv/ts-chocolate#Helpers.nameToBaseId}, with user override.
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Modal, useTypeaheadMatch } from '@fgv/ts-app-shell';
import { Helpers } from '@fgv/ts-chocolate';

// ============================================================================
// Types
// ============================================================================

/**
 * Data returned when the user confirms collection creation.
 * @public
 */
export interface ICreateCollectionData {
  /** The collection ID (kebab-case, validated) */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Optional description */
  readonly description?: string;
  /** Optional tags */
  readonly tags?: ReadonlyArray<string>;
  /** Optional secret name for encryption (protection) */
  readonly secretName?: string;
}

/**
 * Props for the CreateCollectionDialog component.
 * @public
 */
export interface ICreateCollectionDialogProps {
  /** Whether the dialog is open */
  readonly isOpen: boolean;
  /** Callback to close the dialog without creating */
  readonly onClose: () => void;
  /** Callback when the user confirms creation */
  readonly onCreate: (data: ICreateCollectionData) => void;
  /** Set of existing collection IDs (for duplicate detection) */
  readonly existingIds?: ReadonlySet<string>;
  /** Existing secret names for typeahead (only available when workspace is unlocked) */
  readonly existingSecretNames?: ReadonlyArray<string>;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Modal dialog for creating a new collection.
 *
 * The user enters a name and the ID is auto-generated via kebab-case
 * conversion. The user can override the generated ID. Optional fields
 * for description and tags (comma-separated) are also provided.
 *
 * @public
 */
export function CreateCollectionDialog(props: ICreateCollectionDialogProps): React.ReactElement | null {
  const { isOpen, onClose, onCreate, existingIds, existingSecretNames } = props;

  const [name, setName] = useState('');
  const [idOverride, setIdOverride] = useState('');
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const secretInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setIdOverride('');
      setIdManuallyEdited(false);
      setDescription('');
      setTagsInput('');
      setSecretInput('');
    }
  }, [isOpen]);

  const secretSuggestions = useMemo(
    () => (existingSecretNames ?? []).map((n) => ({ id: n, name: n })),
    [existingSecretNames]
  );
  const secretMatcher = useTypeaheadMatch(secretSuggestions);

  // Auto-generate ID from name (unless manually edited)
  const generatedId = useMemo(() => {
    const result = Helpers.nameToBaseId(name);
    return result.isSuccess() ? result.value : '';
  }, [name]);

  const effectiveId = idManuallyEdited ? idOverride : generatedId;

  // Validation
  const idError = useMemo(() => {
    if (effectiveId.length === 0) {
      return name.length > 0 ? 'Name must contain at least one alphanumeric character' : undefined;
    }
    if (existingIds?.has(effectiveId)) {
      return `Collection "${effectiveId}" already exists`;
    }
    // Validate the ID format (alphanumeric + hyphens)
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(effectiveId)) {
      return 'ID must start with a letter or digit and contain only letters, digits, hyphens, or underscores';
    }
    return undefined;
  }, [effectiveId, existingIds, name.length]);

  const canSubmit = name.trim().length > 0 && effectiveId.length > 0 && idError === undefined;

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value);
  }, []);

  const handleIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setIdOverride(e.target.value);
    setIdManuallyEdited(true);
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setDescription(e.target.value);
  }, []);

  const handleTagsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setTagsInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();
      if (!canSubmit) {
        return;
      }

      const trimmedName = name.trim();
      const trimmedDescription = description.trim();
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const trimmedSecret = secretInput.trim();
      const resolvedSecret = secretMatcher.resolveOnBlur(trimmedSecret);
      const effectiveSecret = resolvedSecret ? resolvedSecret.id : trimmedSecret || undefined;

      const data: ICreateCollectionData = {
        id: effectiveId,
        name: trimmedName,
        ...(trimmedDescription.length > 0 ? { description: trimmedDescription } : {}),
        ...(tags.length > 0 ? { tags } : {}),
        ...(effectiveSecret ? { secretName: effectiveSecret } : {})
      };

      onCreate(data);
      onClose();
    },
    [canSubmit, name, effectiveId, description, tagsInput, secretInput, secretMatcher, onCreate, onClose]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Collection">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name field */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cc-name" className="text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="cc-name"
            data-testid="collections-create-name-input"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. My Truffles"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent"
            autoFocus
          />
        </div>

        {/* ID field (auto-generated, overridable) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cc-id" className="text-sm font-medium text-gray-700">
            Collection ID
            {!idManuallyEdited && effectiveId.length > 0 && (
              <span className="ml-1 text-xs text-gray-400 font-normal">(auto-generated)</span>
            )}
          </label>
          <input
            id="cc-id"
            data-testid="collections-create-id-input"
            type="text"
            value={effectiveId}
            onChange={handleIdChange}
            placeholder="auto-generated from name"
            className={`px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent ${
              idError ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
          />
          {idError && <p className="text-xs text-red-500">{idError}</p>}
        </div>

        {/* Description field */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cc-description" className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="cc-description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Optional description"
            rows={2}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent resize-y"
          />
        </div>

        {/* Tags field */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cc-tags" className="text-sm font-medium text-gray-700">
            Tags
          </label>
          <input
            id="cc-tags"
            type="text"
            value={tagsInput}
            onChange={handleTagsChange}
            placeholder="comma-separated, e.g. seasonal, premium"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent"
          />
        </div>

        {/* Secret name field (protection) */}
        <div className="flex flex-col gap-1">
          <label htmlFor="cc-secret" className="text-sm font-medium text-gray-700">
            Protect with secret
            <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            ref={secretInputRef}
            id="cc-secret"
            data-testid="collections-create-secret-input"
            type="text"
            value={secretInput}
            onChange={(e): void => setSecretInput(e.target.value)}
            onBlur={(e): void => {
              const resolved = secretMatcher.resolveOnBlur(e.target.value);
              if (resolved) setSecretInput(resolved.id);
            }}
            list="cc-secret-suggestions"
            placeholder={existingSecretNames?.length ? 'Secret name or type a new one…' : 'Secret name…'}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent"
          />
          {secretSuggestions.length > 0 && (
            <datalist id="cc-secret-suggestions">
              {secretSuggestions.map((s) => (
                <option key={s.id} value={s.id} />
              ))}
            </datalist>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            data-testid="collections-create-submit-button"
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-choco-accent rounded-md hover:bg-choco-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}
