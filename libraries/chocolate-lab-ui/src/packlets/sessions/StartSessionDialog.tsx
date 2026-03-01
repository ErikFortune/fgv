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
 * Dialog for prompting the user for a session name before creation.
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useState } from 'react';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Converts a display name to a kebab-case slug suitable for inclusion in a session ID.
 * Strips non-alphanumeric characters, lowercases, and joins with hyphens.
 * @internal
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the StartSessionDialog component.
 * @public
 */
export interface IStartSessionDialogProps {
  /** Whether the dialog is open */
  readonly isOpen: boolean;
  /** Display name of the entity the session is for (e.g. "Hazelnut Gianduja") */
  readonly entityName: string;
  /** Suggested slug (auto-generated from entity name) */
  readonly suggestedSlug?: string;
  /** Called with the chosen label and slug when confirmed */
  readonly onConfirm: (label: string, slug: string) => void;
  /** Called when the user cancels */
  readonly onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Dialog that prompts the user for a session name/slug before creating a session.
 *
 * The user sees a text field pre-filled with a suggested name. Below it, a
 * read-only preview shows the kebab-case slug that will be appended to the
 * generated session ID.
 *
 * @public
 */
export function StartSessionDialog(props: IStartSessionDialogProps): React.ReactElement | null {
  const { isOpen, entityName, suggestedSlug, onConfirm, onCancel } = props;

  const defaultLabel = entityName;
  const defaultSlug = suggestedSlug ?? toSlug(entityName);

  const [label, setLabel] = useState(defaultLabel);
  const [slug, setSlug] = useState(defaultSlug);
  const [slugEdited, setSlugEdited] = useState(false);

  // Reset when opened with a new entity
  useEffect(() => {
    if (isOpen) {
      setLabel(defaultLabel);
      setSlug(defaultSlug);
      setSlugEdited(false);
    }
  }, [isOpen, defaultLabel, defaultSlug]);

  // Keep slug in sync with label unless the user edited it directly
  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newLabel = e.target.value;
      setLabel(newLabel);
      if (!slugEdited) {
        setSlug(toSlug(newLabel));
      }
    },
    [slugEdited]
  );

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSlugEdited(true);
    setSlug(toSlug(e.target.value));
  }, []);

  const handleSubmit = useCallback((): void => {
    const trimmedLabel = label.trim();
    const trimmedSlug = slug.trim();
    if (trimmedLabel && trimmedSlug) {
      onConfirm(trimmedLabel, trimmedSlug);
    }
  }, [label, slug, onConfirm]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return (): void => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  const isValid = label.trim().length > 0 && slug.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} role="presentation" />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-session-title"
      >
        <div className="p-6">
          <h3 id="start-session-title" className="text-base font-semibold text-gray-900 leading-6">
            Start Session
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a new production session for <strong>{entityName}</strong>.
          </p>

          {/* Label field */}
          <div className="mt-4">
            <label htmlFor="session-label" className="block text-xs font-medium text-gray-700 mb-1">
              Session Name
            </label>
            <input
              id="session-label"
              type="text"
              value={label}
              onChange={handleLabelChange}
              onKeyDown={(e): void => {
                if (e.key === 'Enter' && isValid) handleSubmit();
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
              autoFocus
            />
          </div>

          {/* Slug field */}
          <div className="mt-3">
            <label htmlFor="session-slug" className="block text-xs font-medium text-gray-700 mb-1">
              ID Slug
            </label>
            <input
              id="session-slug"
              type="text"
              value={slug}
              onChange={handleSlugChange}
              onKeyDown={(e): void => {
                if (e.key === 'Enter' && isValid) handleSubmit();
              }}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono text-gray-600 focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Appended to the session ID for easy identification.
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid}
              className="px-4 py-2 text-sm font-medium text-white rounded-md bg-choco-primary hover:bg-choco-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-choco-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
