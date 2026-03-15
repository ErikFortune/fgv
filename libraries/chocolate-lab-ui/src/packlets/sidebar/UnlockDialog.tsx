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
 * Dialog for unlocking the workspace with a master password.
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the UnlockDialog component.
 * @public
 */
export interface IUnlockDialogProps {
  /** Whether the dialog is open */
  readonly isOpen: boolean;
  /** Called when the user submits a password. Returns an error message on failure, undefined on success. */
  readonly onUnlock: (password: string) => Promise<string | undefined>;
  /** Called when the user cancels */
  readonly onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Modal dialog for entering the master password to unlock the workspace.
 * @public
 */
export function UnlockDialog(props: IUnlockDialogProps): React.ReactElement | null {
  const { isOpen, onUnlock, onCancel } = props;

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(undefined);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (!password || isSubmitting) return;
      setIsSubmitting(true);
      setError(undefined);
      const errorMsg = await onUnlock(password);
      if (errorMsg) {
        setError(errorMsg);
        setIsSubmitting(false);
        inputRef.current?.focus();
      }
    },
    [password, isSubmitting, onUnlock]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-choco-primary/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-choco-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Unlock Workspace</h2>
            <p className="text-xs text-gray-500">
              Enter your master password to access protected collections
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="unlock-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              ref={inputRef}
              id="unlock-password"
              type="password"
              value={password}
              onChange={(e): void => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-primary focus:border-transparent"
              placeholder="Master password"
              autoComplete="current-password"
              disabled={isSubmitting}
            />
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password || isSubmitting}
              className="px-3 py-1.5 text-sm font-medium text-white bg-choco-primary rounded-md hover:bg-choco-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Unlocking…' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
