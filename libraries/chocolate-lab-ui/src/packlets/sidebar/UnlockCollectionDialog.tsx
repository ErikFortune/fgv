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
 * Dialog for unlocking a single protected (encrypted) collection.
 *
 * Adapts its UI based on available unlock paths:
 * - Keystore password: unlock the keystore, then load the collection using its stored secret.
 * - Collection password: derive the key directly from a per-collection password.
 *
 * When both paths are available (keystore is locked and key derivation params exist),
 * the dialog shows a toggle between the two.
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * The method used to unlock a collection.
 * - `'keystore'`: The user enters the keystore master password.
 * - `'collection'`: The user enters a per-collection password (key derived via PBKDF2).
 * @public
 */
export type UnlockCollectionMode = 'keystore' | 'collection';

/**
 * Props for the UnlockCollectionDialog component.
 * @public
 */
export interface IUnlockCollectionDialogProps {
  /** Whether the dialog is open */
  readonly isOpen: boolean;
  /** Display name for the collection being unlocked */
  readonly collectionName: string;
  /** Name of the secret required by this collection */
  readonly secretName: string;
  /** Which unlock modes are available to the user */
  readonly availableModes: ReadonlyArray<UnlockCollectionMode>;
  /**
   * Called when the user submits a password.
   * @param password - The entered password
   * @param mode - Which unlock path was used
   * @param saveToKeystore - Whether to save the derived secret to the keystore (collection mode only)
   * @returns An error message on failure, undefined on success.
   */
  readonly onUnlock: (
    password: string,
    mode: UnlockCollectionMode,
    saveToKeystore: boolean
  ) => Promise<string | undefined>;
  /** Called when the user cancels */
  readonly onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Modal dialog for unlocking a protected collection.
 * @public
 */
export function UnlockCollectionDialog(props: IUnlockCollectionDialogProps): React.ReactElement | null {
  const { isOpen, collectionName, secretName, availableModes, onUnlock, onCancel } = props;

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<UnlockCollectionMode>(availableModes[0] ?? 'keystore');
  const [saveToKeystore, setSaveToKeystore] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasMultipleModes = availableModes.length > 1;

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(undefined);
      setIsSubmitting(false);
      setMode(availableModes[0] ?? 'keystore');
      setSaveToKeystore(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, availableModes]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (!password || isSubmitting) return;
      setIsSubmitting(true);
      setError(undefined);
      const errorMsg = await onUnlock(password, mode, mode === 'collection' && saveToKeystore);
      if (errorMsg) {
        setError(errorMsg);
        setIsSubmitting(false);
        inputRef.current?.focus();
      }
    },
    [password, isSubmitting, onUnlock, mode, saveToKeystore]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  const handleModeChange = useCallback((newMode: UnlockCollectionMode): void => {
    setMode(newMode);
    setPassword('');
    setError(undefined);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
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
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Unlock Collection</h2>
            <p className="text-xs text-gray-500">
              <span className="font-medium text-gray-700">{collectionName}</span> (secret: {secretName})
            </p>
          </div>
        </div>

        {/* Mode Toggle */}
        {hasMultipleModes && (
          <div className="flex rounded-md border border-gray-300 mb-4 text-sm">
            {availableModes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={(): void => handleModeChange(m)}
                className={`flex-1 py-1.5 px-2 text-center transition-colors ${
                  mode === m ? 'bg-amber-500 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
                } ${m === availableModes[0] ? 'rounded-l-md' : ''} ${
                  m === availableModes[availableModes.length - 1] ? 'rounded-r-md' : ''
                }`}
              >
                {m === 'keystore' ? 'Keystore Password' : 'Collection Password'}
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="unlock-col-password" className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'keystore' ? 'Keystore master password' : 'Collection password'}
            </label>
            <input
              ref={inputRef}
              id="unlock-col-password"
              type="password"
              value={password}
              onChange={(e): void => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder={mode === 'keystore' ? 'Master password' : 'Collection password'}
              autoComplete="current-password"
              disabled={isSubmitting}
            />
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          </div>

          {/* Save to keystore checkbox (collection mode only) */}
          {mode === 'collection' && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={saveToKeystore}
                onChange={(e): void => setSaveToKeystore(e.target.checked)}
                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                disabled={isSubmitting}
              />
              Save secret to keystore
            </label>
          )}

          {/* Hint text */}
          <p className="text-xs text-gray-400">
            {mode === 'keystore'
              ? 'Unlock the keystore to access the stored secret for this collection.'
              : 'Derive the decryption key directly from a per-collection password.'}
          </p>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-1">
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
              className="px-3 py-1.5 text-sm font-medium text-white bg-amber-500 rounded-md hover:bg-amber-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Unlocking\u2026' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
