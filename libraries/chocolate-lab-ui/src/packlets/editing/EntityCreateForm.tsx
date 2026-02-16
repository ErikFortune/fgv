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
 * Generic entity create form for the cascade 'create' mode.
 *
 * Renders name/ID fields, an AI drop zone, a Copy AI Prompt button,
 * and Create/Cancel actions. Parameterized so it can be reused across
 * entity types (ingredients, fillings, molds, etc.).
 *
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';

import { ClipboardDocumentIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/20/solid';

import type { Result } from '@fgv/ts-utils';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the EntityCreateForm component.
 * @public
 */
export interface IEntityCreateFormProps<TEntity> {
  /** Convert a display name to a slug ID */
  readonly slugify: (name: string) => string;
  /** Build an AI prompt string from the ingredient name */
  readonly buildPrompt: (name: string) => string;
  /** Convert unknown JSON into a validated entity */
  readonly convert: (from: unknown) => Result<TEntity>;
  /** Build a blank entity from name and ID (for manual creation) */
  readonly makeBlank: (name: string, id: string) => TEntity;
  /** Called when the user creates an entity (manual or AI) */
  readonly onCreate: (entity: TEntity, source: 'manual' | 'ai') => void;
  /** Called when the user cancels */
  readonly onCancel: () => void;
  /** Placeholder text for the name field */
  readonly namePlaceholder?: string;
  /** Label for the entity type (e.g. "Ingredient") — used in UI text */
  readonly entityLabel?: string;
  /** Initial value for the name field (e.g. from typeahead seed) */
  readonly initialName?: string;
}

// ============================================================================
// EntityCreateForm Component
// ============================================================================

/**
 * Generic create form for the cascade 'create' mode.
 *
 * Displays name, auto-derived ID, a paste/drop zone for AI-generated JSON,
 * a Copy AI Prompt button, and Create/Cancel actions. All fields are always
 * visible — no progressive disclosure.
 *
 * @public
 */
export function EntityCreateForm<TEntity>(props: IEntityCreateFormProps<TEntity>): React.ReactElement {
  const {
    slugify,
    buildPrompt,
    convert,
    makeBlank,
    onCreate,
    onCancel,
    namePlaceholder = 'e.g. Callebaut 811 Dark',
    entityLabel = 'Entity',
    initialName
  } = props;

  const [name, setName] = useState(initialName ?? '');
  const [idOverride, setIdOverride] = useState('');
  const [pasteError, setPasteError] = useState<string | undefined>(undefined);
  const [promptCopied, setPromptCopied] = useState(false);

  const trimmedName = name.trim();
  const derivedId = trimmedName ? slugify(trimmedName) : '';
  const effectiveId = idOverride.trim() || derivedId;
  const hasValidId = effectiveId.length > 0;

  // ---- Handlers ----

  const handleCreate = useCallback((): void => {
    if (!trimmedName) return;
    const entity = makeBlank(trimmedName, effectiveId);
    onCreate(entity, 'manual');
  }, [trimmedName, effectiveId, makeBlank, onCreate]);

  const handleCopyPrompt = useCallback((): void => {
    if (!trimmedName) return;
    const prompt = buildPrompt(trimmedName);
    navigator.clipboard.writeText(prompt).then(
      () => {
        setPromptCopied(true);
        setTimeout(() => setPromptCopied(false), 2000);
      },
      () => {
        setPasteError('Failed to copy prompt to clipboard');
      }
    );
  }, [trimmedName, buildPrompt]);

  const handleJsonInput = useCallback(
    (text: string): void => {
      setPasteError(undefined);

      // Strip markdown code fences that AI agents often wrap JSON in
      const stripped = text
        .trim()
        .replace(/^```(?:\w+)?\s*\n?([\s\S]*?)\n?\s*```$/, '$1')
        .trim();

      let parsed: unknown;
      try {
        parsed = JSON.parse(stripped);
      } catch (err: unknown) {
        const detail = err instanceof Error ? err.message : String(err);
        setPasteError(`Invalid JSON: ${detail}`);
        return;
      }

      const result = convert(parsed);
      if (result.isFailure()) {
        setPasteError(`Validation failed: ${result.message}`);
        return;
      }

      onCreate(result.value, 'ai');
    },
    [convert, onCreate]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent): void => {
      const text = e.clipboardData.getData('text/plain') || e.clipboardData.getData('text');
      if (!text) return;

      // Only intercept if the pasted text looks like JSON (starts with { or [)
      const trimmed = text.trim().replace(/^```(?:\w+)?\s*\n?/, '');
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return;

      e.preventDefault();
      handleJsonInput(text);
    },
    [handleJsonInput]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent): void => {
      e.preventDefault();
      const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text');
      if (text) handleJsonInput(text);
    },
    [handleJsonInput]
  );

  const handleDragOver = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // ---- Render ----

  return (
    <div className="flex flex-col p-4 gap-4">
      {/* Name field */}
      <div>
        <label className="text-sm font-medium text-gray-700">{entityLabel} Name</label>
        <input
          type="text"
          value={name}
          onChange={(e): void => setName(e.target.value)}
          onKeyDown={(e): void => {
            if (e.key === 'Enter' && trimmedName) handleCreate();
          }}
          placeholder={namePlaceholder}
          className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
          autoFocus
        />
      </div>

      {/* ID field */}
      <div>
        <label className="text-sm font-medium text-gray-700">ID</label>
        <input
          type="text"
          value={idOverride}
          onChange={(e): void => setIdOverride(e.target.value)}
          onKeyDown={(e): void => {
            if (e.key === 'Enter' && trimmedName) handleCreate();
          }}
          placeholder={derivedId || 'auto-derived from name'}
          className="mt-1 w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* AI Drop Zone */}
      <div
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        tabIndex={0}
        className={`flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg cursor-default transition-colors focus-within:border-choco-primary focus-within:bg-choco-primary/5 ${
          pasteError ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <span className="text-sm text-gray-500">Paste or drop AI-generated JSON here</span>
        <span className="text-xs text-gray-400">Ctrl+V to paste, or drag a text file</span>
      </div>

      {/* Paste error */}
      {pasteError && <p className="text-xs text-red-600">{pasteError}</p>}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleCopyPrompt}
          disabled={!hasValidId}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={hasValidId ? 'Copy AI prompt to clipboard' : `Enter a name to generate an AI prompt`}
        >
          {promptCopied ? (
            <>
              <ClipboardDocumentIcon className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4" />
              Copy AI Prompt
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!trimmedName}
            className="px-3 py-1.5 text-xs font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
