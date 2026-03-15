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
 * Small dialog for prompting an entity name before direct AI generation.
 *
 * Used by list header buttons when invoking direct AI assist — the user
 * enters a name, then the dialog calls back with the name for generation.
 *
 * @packageDocumentation
 */

import React, { useCallback, useState } from 'react';

import { SparklesIcon, XMarkIcon } from '@heroicons/react/20/solid';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the AiAssistNameDialog component.
 * @public
 */
export interface IAiAssistNameDialogProps {
  /** Label for the entity type (e.g. "Ingredient", "Mold") */
  readonly entityLabel: string;
  /** Whether a generation is in progress */
  readonly isWorking?: boolean;
  /** Error message from a failed generation */
  readonly error?: string;
  /** Called when the user submits a name for generation */
  readonly onGenerate: (name: string) => void;
  /** Called when the user cancels */
  readonly onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Inline dialog that prompts for an entity name before AI generation.
 * @public
 */
export function AiAssistNameDialog(props: IAiAssistNameDialogProps): React.ReactElement {
  const { entityLabel, isWorking, error, onGenerate, onCancel } = props;
  const [name, setName] = useState('');
  const trimmedName = name.trim();

  const handleSubmit = useCallback((): void => {
    if (trimmedName) {
      onGenerate(trimmedName);
    }
  }, [trimmedName, onGenerate]);

  return (
    <div className="flex flex-col gap-2 p-3 border border-purple-200 rounded-lg bg-purple-50/50">
      <label className="text-xs font-medium text-purple-700">Generate {entityLabel} with AI</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e): void => setName(e.target.value)}
          onKeyDown={(e): void => {
            if (e.key === 'Enter' && trimmedName) handleSubmit();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder={`${entityLabel} name...`}
          disabled={isWorking}
          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
          autoFocus
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!trimmedName || isWorking}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          {isWorking ? 'Generating...' : 'Generate'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isWorking}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          title="Cancel"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
