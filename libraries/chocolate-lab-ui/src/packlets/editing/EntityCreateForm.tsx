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
 * Renders name/ID fields, an AI drop zone, AI action buttons (copy prompt
 * and/or direct generation), and Create/Cancel actions. Parameterized so
 * it can be reused across entity types (ingredients, fillings, molds, etc.).
 *
 * When multiple AI providers are enabled in settings, the AI button becomes
 * a dropdown with all available actions.
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ChevronDownIcon, ClipboardDocumentIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/20/solid';

import type { Result } from '@fgv/ts-utils';

import { AiAssist } from '@fgv/ts-extras';

import { checkForAiErrorObject } from '@fgv/ts-app-shell';

import { useAiAssist, type IAiAssistAction } from './useAiAssist';

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
  /** Build a structured AI prompt from the entity name and optional additional instructions */
  readonly buildPrompt: (name: string, additionalInstructions?: string) => AiAssist.AiPrompt;
  /** Convert unknown JSON into a validated entity */
  readonly convert: (from: unknown) => Result<TEntity>;
  /** Build a blank entity from name and ID (for manual creation) */
  readonly makeBlank: (name: string, id: string) => TEntity;
  /** Called when the user creates an entity (manual or AI) */
  readonly onCreate: (entity: TEntity, source: 'manual' | 'ai', targetCollectionId?: string) => void;
  /** Called when the user cancels */
  readonly onCancel: () => void;
  /** Placeholder text for the name field */
  readonly namePlaceholder?: string;
  /** Label for the entity type (e.g. "Ingredient") — used in UI text */
  readonly entityLabel?: string;
  /** Initial value for the name field (e.g. from typeahead seed) */
  readonly initialName?: string;

  /** Existing entities available for copy/derive flows */
  readonly sourceOptions?: ReadonlyArray<IEntityCreateSourceOption>;

  /** Mode used when creating from an existing source option (default: 'derive') */
  readonly sourceCreateMode?: IEntityCreateFromSourceParams['mode'];

  /** Invoked when creating from an existing source */
  readonly onCreateFromSource?: (params: IEntityCreateFromSourceParams) => void;

  /** Writable target collections (if provided, shown in the form) */
  readonly writableCollections?: ReadonlyArray<IEntityCreateCollectionOption>;

  /** Optional preferred target collection */
  readonly defaultTargetCollectionId?: string;
}

/**
 * Source entity option for copy/derive flows.
 * @public
 */
export interface IEntityCreateSourceOption {
  readonly id: string;
  readonly name: string;
}

/**
 * Target collection option for create flows.
 * @public
 */
export interface IEntityCreateCollectionOption {
  readonly id: string;
  readonly label?: string;
}

/**
 * Parameters for create-from-source callbacks.
 * @public
 */
export interface IEntityCreateFromSourceParams {
  readonly mode: 'copy' | 'derive';
  readonly sourceId: string;
  readonly name: string;
  readonly id: string;
  readonly targetCollectionId?: string;
}

// ============================================================================
// EntityCreateForm Component
// ============================================================================

/**
 * Generic create form for the cascade 'create' mode.
 *
 * Displays name, auto-derived ID, a paste/drop zone for AI-generated JSON,
 * AI action button(s), and Create/Cancel actions. All fields are always
 * visible — no progressive disclosure.
 *
 * When multiple AI providers are enabled, the copy prompt button becomes
 * a dropdown showing all available actions (copy prompt, generate with Grok, etc.).
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
    initialName,
    sourceOptions,
    sourceCreateMode = 'derive',
    onCreateFromSource,
    writableCollections,
    defaultTargetCollectionId
  } = props;

  const [name, setName] = useState(initialName ?? '');
  const [idOverride, setIdOverride] = useState('');
  const [pasteError, setPasteError] = useState<string | undefined>(undefined);
  const [promptCopied, setPromptCopied] = useState(false);
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);

  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [targetCollectionId, setTargetCollectionId] = useState<string>(
    defaultTargetCollectionId ?? writableCollections?.[0]?.id ?? ''
  );

  const aiAssist = useAiAssist();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const trimmedName = name.trim();
  const derivedId = trimmedName ? slugify(trimmedName) : '';
  const effectiveId = idOverride.trim() || derivedId;
  const hasValidId = effectiveId.length > 0;

  const hasSourceSelection = sourceOptions !== undefined && onCreateFromSource !== undefined;
  const canCreateFromSource = selectedSourceId.trim().length > 0 && onCreateFromSource !== undefined;

  useEffect(() => {
    if (defaultTargetCollectionId !== undefined) {
      setTargetCollectionId(defaultTargetCollectionId);
      return;
    }

    if (writableCollections === undefined || writableCollections.length === 0) {
      return;
    }

    const found = writableCollections.some((option) => option.id === targetCollectionId);
    if (!found) {
      setTargetCollectionId(writableCollections[0].id);
    }
  }, [defaultTargetCollectionId, writableCollections, targetCollectionId]);

  useEffect(() => {
    if (!selectedSourceId) {
      return;
    }
    const sourceExists = (sourceOptions ?? []).some((source) => source.id === selectedSourceId);
    if (!sourceExists) {
      setSelectedSourceId('');
    }
  }, [sourceOptions, selectedSourceId]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!aiDropdownOpen) return;
    const handleClick = (e: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAiDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return (): void => document.removeEventListener('mousedown', handleClick);
  }, [aiDropdownOpen]);

  // Determine if we have multiple actions (i.e. more than just copy-paste)
  const hasMultipleActions = aiAssist.actions.length > 1;
  const directActions = aiAssist.actions.filter((a) => a.provider !== 'copy-paste');
  const defaultAction = aiAssist.actions.find((a) => a.isDefault);
  const defaultIsDirect = defaultAction !== undefined && defaultAction.provider !== 'copy-paste';

  // ---- Handlers ----

  const handleCreate = useCallback((): void => {
    if (!trimmedName) return;
    if (selectedSourceId.trim().length > 0) {
      if (!canCreateFromSource) {
        return;
      }

      onCreateFromSource({
        mode: sourceCreateMode,
        sourceId: selectedSourceId,
        name: trimmedName,
        id: effectiveId,
        targetCollectionId: targetCollectionId || undefined
      });
      return;
    }

    const entity = makeBlank(trimmedName, effectiveId);
    onCreate(entity, 'manual', targetCollectionId || undefined);
  }, [
    trimmedName,
    selectedSourceId,
    canCreateFromSource,
    onCreateFromSource,
    sourceCreateMode,
    effectiveId,
    targetCollectionId,
    makeBlank,
    onCreate
  ]);

  const handleCopyPrompt = useCallback((): void => {
    if (!trimmedName) return;
    const instructions = additionalInstructions.trim() || undefined;
    const prompt = buildPrompt(trimmedName, instructions);
    aiAssist.copyPrompt(prompt).then(
      () => {
        setPromptCopied(true);
        setTimeout(() => setPromptCopied(false), 2000);
      },
      () => {
        setPasteError('Failed to copy prompt to clipboard');
      }
    );
    setAiDropdownOpen(false);
  }, [trimmedName, additionalInstructions, buildPrompt, aiAssist]);

  const handleDirectGenerate = useCallback(
    (action: IAiAssistAction): void => {
      if (!trimmedName) return;
      setPasteError(undefined);
      setAiDropdownOpen(false);

      const instructions = additionalInstructions.trim() || undefined;
      const prompt = buildPrompt(trimmedName, instructions);
      aiAssist.generateDirect<TEntity>(action.provider, prompt, convert).then(
        (result) => {
          if (result.isFailure()) {
            setPasteError(result.message);
            return;
          }
          onCreate(result.value.entity, 'ai', targetCollectionId || undefined);
        },
        (err: unknown) => {
          const detail = err instanceof Error ? err.message : String(err);
          setPasteError(`AI generation failed: ${detail}`);
        }
      );
    },
    [trimmedName, additionalInstructions, buildPrompt, convert, onCreate, targetCollectionId, aiAssist]
  );

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

      // Check for AI error object (model declined to generate)
      const aiError = checkForAiErrorObject(parsed);
      if (aiError !== undefined) {
        setPasteError(aiError.message);
        return;
      }

      const result = convert(parsed);
      if (result.isFailure()) {
        setPasteError(`Validation failed: ${result.message}`);
        return;
      }

      onCreate(result.value, 'ai', targetCollectionId || undefined);
    },
    [convert, onCreate, targetCollectionId]
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

  // ---- Render helpers ----

  const renderAiButton = (): React.ReactElement => {
    // Single action (copy-paste only) — simple button
    if (!hasMultipleActions) {
      return (
        <button
          onClick={handleCopyPrompt}
          disabled={!hasValidId}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={hasValidId ? 'Copy AI prompt to clipboard' : 'Enter a name to generate an AI prompt'}
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
      );
    }

    // Multiple actions — split button with dropdown
    const handleMainButtonClick =
      defaultIsDirect && defaultAction ? (): void => handleDirectGenerate(defaultAction) : handleCopyPrompt;
    const mainButtonLabel = defaultIsDirect && defaultAction ? defaultAction.label : 'AI Assist';

    return (
      <div ref={dropdownRef} className="relative">
        <div className="flex items-center">
          {/* Main button — uses the configured default action */}
          <button
            onClick={handleMainButtonClick}
            disabled={
              !hasValidId ||
              aiAssist.isWorking ||
              (defaultIsDirect && defaultAction !== undefined && !defaultAction.isAvailable)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-l transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              hasValidId
                ? defaultIsDirect
                  ? `Generate with ${mainButtonLabel}`
                  : 'Copy AI prompt to clipboard'
                : 'Enter a name to generate an AI prompt'
            }
          >
            {aiAssist.isWorking ? (
              <>
                <SparklesIcon className="w-4 h-4 animate-pulse" />
                Generating...
              </>
            ) : promptCopied ? (
              <>
                <ClipboardDocumentIcon className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                {mainButtonLabel}
              </>
            )}
          </button>
          {/* Dropdown toggle */}
          <button
            onClick={(): void => setAiDropdownOpen(!aiDropdownOpen)}
            disabled={!hasValidId || aiAssist.isWorking}
            className="flex items-center px-1.5 py-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-r border-l border-purple-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="More AI options"
          >
            <ChevronDownIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dropdown menu */}
        {aiDropdownOpen && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
            {/* Copy prompt — always first */}
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-gray-700 hover:bg-purple-50 hover:text-purple-900"
            >
              <ClipboardDocumentIcon className="w-4 h-4 text-purple-500" />
              <span>Copy AI Prompt</span>
            </button>
            {/* Direct providers */}
            {directActions.map((action) => (
              <button
                key={action.provider}
                onClick={(): void => handleDirectGenerate(action)}
                disabled={!action.isAvailable}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left text-gray-700 hover:bg-purple-50 hover:text-purple-900 disabled:opacity-40 disabled:cursor-not-allowed"
                title={action.unavailableReason}
              >
                <SparklesIcon className="w-4 h-4 text-purple-500" />
                <div className="flex flex-col">
                  <span>{action.label}</span>
                  {action.unavailableReason && (
                    <span className="text-[10px] text-gray-400">{action.unavailableReason}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ---- Render ----

  return (
    <div className="flex flex-col p-4 gap-4">
      {/* Source picker */}
      {hasSourceSelection && (
        <div>
          <label className="text-sm font-medium text-gray-700">
            {sourceCreateMode === 'copy' ? 'Copy from' : 'Derive from'}
          </label>
          <select
            value={selectedSourceId}
            onChange={(e): void => setSelectedSourceId(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
          >
            <option value="">(none)</option>
            {(sourceOptions ?? []).map((source) => (
              <option key={source.id} value={source.id}>
                {source.name} ({source.id})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Name field */}
      <div>
        <label className="text-sm font-medium text-gray-700">{entityLabel} Name</label>
        <input
          type="text"
          value={name}
          onChange={(e): void => setName(e.target.value)}
          onKeyDown={(e): void => {
            if (e.key === 'Enter' && trimmedName && !aiAssist.isWorking) handleCreate();
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
            if (e.key === 'Enter' && trimmedName && !aiAssist.isWorking) handleCreate();
          }}
          placeholder={derivedId || 'auto-derived from name'}
          className="mt-1 w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
        />
      </div>

      {/* Target collection */}
      {(writableCollections?.length ?? 0) > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700">Target Collection</label>
          <select
            value={targetCollectionId}
            onChange={(e): void => setTargetCollectionId(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-choco-primary focus:border-choco-primary"
          >
            {writableCollections?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label ?? option.id}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* AI Drop Zone */}
      {selectedSourceId.trim().length === 0 && (
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
      )}

      {/* Additional Instructions */}
      {selectedSourceId.trim().length === 0 && (
        <div>
          <label className="text-xs font-medium text-gray-500">Additional Instructions (optional)</label>
          <textarea
            value={additionalInstructions}
            onChange={(e): void => setAdditionalInstructions(e.target.value)}
            placeholder="e.g. This is a 275×135mm frame mold, use metric units..."
            rows={2}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
          />
        </div>
      )}

      {/* Paste error */}
      {pasteError && <p className="text-xs text-red-600">{pasteError}</p>}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        {selectedSourceId.trim().length === 0 ? renderAiButton() : <div />}

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
            disabled={!trimmedName || aiAssist.isWorking}
            className="px-3 py-1.5 text-xs font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
