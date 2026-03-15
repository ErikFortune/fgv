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
 * Dialog for AI re-roll — regenerate an existing entity with AI from the edit view.
 *
 * Presents entity name (pre-filled, editable), additional instructions textarea,
 * provider selection, and generate/cancel buttons. Uses the existing useAiAssist
 * hook for provider discovery and API calls.
 *
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';

import { ClipboardDocumentIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/20/solid';

import type { Result } from '@fgv/ts-utils';

import { AiAssist } from '@fgv/ts-extras';

import { useAiAssist, type IAiAssistAction } from './useAiAssist';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the AiRerollDialog component.
 * @public
 */
export interface IAiRerollDialogProps<TEntity> {
  /** Current entity name (pre-filled, editable) */
  readonly entityName: string;
  /** Entity label for UI text (e.g. "Mold") */
  readonly entityLabel: string;
  /** Build the AI prompt from name and optional instructions */
  readonly buildPrompt: (name: string, additionalInstructions?: string) => AiAssist.AiPrompt;
  /** Convert AI response JSON to a validated entity */
  readonly convert: (from: unknown) => Result<TEntity>;
  /** Called with the generated entity on success */
  readonly onResult: (entity: TEntity) => void;
  /** Called when the user cancels */
  readonly onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Inline dialog for AI re-roll in edit views.
 *
 * Provides entity name input, additional instructions, provider selection,
 * and generate/cancel buttons. Supports both direct generation and copy-paste
 * workflows.
 *
 * @public
 */
export function AiRerollDialog<TEntity>(props: IAiRerollDialogProps<TEntity>): React.ReactElement {
  const { entityName, entityLabel, buildPrompt, convert, onResult, onCancel } = props;

  const [name, setName] = useState(entityName);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [promptCopied, setPromptCopied] = useState(false);

  const aiAssist = useAiAssist();
  const trimmedName = name.trim();

  const defaultAction = aiAssist.actions.find((a) => a.isDefault);
  const directActions = aiAssist.actions.filter((a) => a.provider !== 'copy-paste');

  const handleGenerate = useCallback(
    (action: IAiAssistAction): void => {
      if (!trimmedName) return;
      setError(undefined);

      const instructions = additionalInstructions.trim() || undefined;
      const prompt = buildPrompt(trimmedName, instructions);
      aiAssist.generateDirect<TEntity>(action.provider, prompt, convert).then(
        (result) => {
          if (result.isFailure()) {
            setError(result.message);
            return;
          }
          onResult(result.value.entity);
        },
        (err: unknown) => {
          const detail = err instanceof Error ? err.message : String(err);
          setError(`AI generation failed: ${detail}`);
        }
      );
    },
    [trimmedName, additionalInstructions, buildPrompt, convert, onResult, aiAssist]
  );

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
        setError('Failed to copy prompt to clipboard');
      }
    );
  }, [trimmedName, additionalInstructions, buildPrompt, aiAssist]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  // Determine main action: use default provider if it's a direct one, otherwise first available direct action
  const primaryAction =
    defaultAction && defaultAction.provider !== 'copy-paste' ? defaultAction : directActions[0];

  return (
    <div
      className="flex flex-col gap-3 p-4 border border-purple-200 rounded-lg bg-purple-50/50"
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-purple-700">Re-generate {entityLabel} with AI</label>
        <button
          type="button"
          onClick={onCancel}
          disabled={aiAssist.isWorking}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          title="Cancel"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Entity name */}
      <div>
        <label className="text-xs font-medium text-gray-600">{entityLabel} Name</label>
        <input
          type="text"
          value={name}
          onChange={(e): void => setName(e.target.value)}
          disabled={aiAssist.isWorking}
          placeholder={`${entityLabel} name...`}
          className="mt-1 w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
          autoFocus
        />
      </div>

      {/* Additional instructions */}
      <div>
        <label className="text-xs font-medium text-gray-600">Additional Instructions (optional)</label>
        <textarea
          value={additionalInstructions}
          onChange={(e): void => setAdditionalInstructions(e.target.value)}
          disabled={aiAssist.isWorking}
          placeholder="e.g. This is a 275x135mm frame mold, use metric units..."
          rows={2}
          className="mt-1 w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none disabled:opacity-50"
        />
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Primary generate button */}
        {primaryAction && (
          <button
            type="button"
            onClick={(): void => handleGenerate(primaryAction)}
            disabled={!trimmedName || aiAssist.isWorking || !primaryAction.isAvailable}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={primaryAction.unavailableReason}
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            {aiAssist.isWorking ? 'Generating...' : primaryAction.label}
          </button>
        )}

        {/* Other direct providers */}
        {directActions
          .filter((a) => a.provider !== primaryAction?.provider)
          .map((action) => (
            <button
              key={action.provider}
              type="button"
              onClick={(): void => handleGenerate(action)}
              disabled={!trimmedName || aiAssist.isWorking || !action.isAvailable}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title={action.unavailableReason}
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              {action.label}
            </button>
          ))}

        {/* Copy prompt */}
        <button
          type="button"
          onClick={handleCopyPrompt}
          disabled={!trimmedName || aiAssist.isWorking}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Copy AI prompt to clipboard"
        >
          <ClipboardDocumentIcon className="w-3.5 h-3.5" />
          {promptCopied ? 'Copied!' : 'Copy Prompt'}
        </button>

        <div className="flex-1" />

        {/* Cancel */}
        <button
          type="button"
          onClick={onCancel}
          disabled={aiAssist.isWorking}
          className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
