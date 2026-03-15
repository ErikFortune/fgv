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
 * Dialog for setting a password when creating a new secret for a protected collection.
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Props
// ============================================================================

/**
 * Props for the SetSecretPasswordDialog component.
 * @public
 */
export interface ISetSecretPasswordDialogProps {
  /** Whether the dialog is open */
  readonly isOpen: boolean;
  /** The secret name being created */
  readonly secretName: string;
  /** Called when the user submits a password. Returns an error message on failure, undefined on success. */
  readonly onSetPassword: (password: string) => Promise<string | undefined>;
  /** Called when the user cancels (collection will be created without encryption) */
  readonly onSkip: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Modal dialog for setting a master password when creating a new secret.
 *
 * Shown when the user specifies a secretName that doesn't yet exist in the
 * keystore. If the keystore itself is new (no password set), this also
 * initializes it.
 *
 * @public
 */
export function SetSecretPasswordDialog(props: ISetSecretPasswordDialogProps): React.ReactElement | null {
  const { isOpen, secretName, onSetPassword, onSkip } = props;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirm('');
      setError(undefined);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length > 0 && password === confirm && !isSubmitting;

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (!canSubmit) return;
      setIsSubmitting(true);
      setError(undefined);
      const errorMsg = await onSetPassword(password);
      if (errorMsg) {
        setError(errorMsg);
        setIsSubmitting(false);
        inputRef.current?.focus();
      }
    },
    [canSubmit, password, onSetPassword]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onSkip();
      }
    },
    [onSkip]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-choco-accent/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-choco-accent"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Set Secret Password</h2>
            <p className="text-xs text-gray-500">
              Create a password for secret <span className="font-medium text-gray-700">{secretName}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="ssp-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              ref={inputRef}
              id="ssp-password"
              type="password"
              value={password}
              onChange={(e): void => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent"
              placeholder="New password"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="ssp-confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              id="ssp-confirm"
              type="password"
              value={confirm}
              onChange={(e): void => setConfirm(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-choco-accent focus:border-transparent ${
                mismatch ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Confirm password"
              autoComplete="new-password"
              disabled={isSubmitting}
            />
            {mismatch && <p className="mt-1 text-xs text-red-600">Passwords do not match</p>}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onSkip}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Skip encryption
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-3 py-1.5 text-sm font-medium text-white bg-choco-accent rounded-md hover:bg-choco-accent/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Setting up…' : 'Set password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
