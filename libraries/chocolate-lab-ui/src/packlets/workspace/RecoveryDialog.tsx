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
 * Three-option recovery dialog for settings validation failures.
 *
 * Shown when post-construction validation detects unavailable storage roots
 * or missing collections. Offers three recovery paths:
 * 1. Quit — close the app so the user can fix the issue externally
 * 2. Reset — clear the invalid references and proceed with defaults
 * 3. Proceed mitigated — start with defaults, block writes to missing roots
 *
 * @packageDocumentation
 */

import React, { useCallback } from 'react';
import type { ISettingsValidationWarning } from '@fgv/ts-chocolate';

// ============================================================================
// Recovery Action Type
// ============================================================================

/**
 * The recovery action chosen by the user.
 * @public
 */
export type RecoveryAction = 'quit' | 'reset' | 'mitigate';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the RecoveryDialog component.
 * @public
 */
export interface IRecoveryDialogProps {
  /** Whether the dialog is open */
  readonly isOpen: boolean;
  /** The validation warnings that triggered this dialog */
  readonly warnings: ReadonlyArray<ISettingsValidationWarning>;
  /** Called when the user chooses a recovery action */
  readonly onRecover: (action: RecoveryAction) => void;
}

// ============================================================================
// Helper: Warning Summary
// ============================================================================

function WarningList({
  warnings
}: {
  readonly warnings: ReadonlyArray<ISettingsValidationWarning>;
}): React.ReactElement {
  return (
    <ul className="mt-2 space-y-1 text-sm text-gray-600 max-h-40 overflow-y-auto">
      {warnings.map((w, i) => {
        if (w.kind === 'missing-root') {
          return (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-0.5 text-amber-500 flex-shrink-0">⚠</span>
              <span>
                Storage root <strong>{w.rootId}</strong> is unavailable
                <span className="text-gray-400 text-xs ml-1">({w.context})</span>
              </span>
            </li>
          );
        }
        if (w.kind === 'missing-collection') {
          return (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-0.5 text-amber-500 flex-shrink-0">⚠</span>
              <span>
                Default collection <strong>{w.collectionId}</strong> not found in{' '}
                <strong>{w.subLibraryId}</strong>
                <span className="text-gray-400 text-xs ml-1">({w.context})</span>
              </span>
            </li>
          );
        }
        return (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-0.5 text-amber-500 flex-shrink-0">⚠</span>
            <span>{w.context}</span>
          </li>
        );
      })}
    </ul>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * Three-option recovery dialog for settings validation failures.
 * @public
 */
export function RecoveryDialog(props: IRecoveryDialogProps): React.ReactElement | null {
  const { isOpen, warnings, onRecover } = props;

  const handleQuit = useCallback((): void => onRecover('quit'), [onRecover]);
  const handleReset = useCallback((): void => onRecover('reset'), [onRecover]);
  const handleMitigate = useCallback((): void => onRecover('mitigate'), [onRecover]);

  if (!isOpen || warnings.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Configuration Problem Detected</h2>
            <p className="text-xs text-gray-500">
              Some settings reference resources that are not currently available.
            </p>
          </div>
        </div>

        {/* Warning list */}
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs font-medium text-amber-800 mb-1">
            {warnings.length === 1 ? '1 issue found:' : `${warnings.length} issues found:`}
          </p>
          <WarningList warnings={warnings} />
        </div>

        {/* Recovery options */}
        <p className="text-sm font-medium text-gray-700 mb-3">How would you like to proceed?</p>

        <div className="space-y-2">
          {/* Option 1: Quit */}
          <button
            onClick={handleQuit}
            className="w-full text-left px-4 py-3 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <div className="text-sm font-medium text-gray-900">Quit and fix</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Close the app so you can reconnect the missing storage or fix the configuration.
            </div>
          </button>

          {/* Option 2: Reset */}
          <button
            onClick={handleReset}
            className="w-full text-left px-4 py-3 rounded-md border border-amber-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
          >
            <div className="text-sm font-medium text-amber-900">Reset configuration</div>
            <div className="text-xs text-amber-700 mt-0.5">
              Clear the references to missing resources and start with defaults. You can reconfigure later in
              Settings.
            </div>
          </button>

          {/* Option 3: Mitigate */}
          <button
            onClick={handleMitigate}
            className="w-full text-left px-4 py-3 rounded-md border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="text-sm font-medium text-blue-900">Proceed with caution</div>
            <div className="text-xs text-blue-700 mt-0.5">
              Start with defaults for missing resources. Writes to unavailable storage will be blocked to
              prevent data loss. A warning banner will remain visible.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
