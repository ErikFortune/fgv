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

import React, { useCallback, useState } from 'react';

import {
  getOrCreateKeystoreFileItem,
  saveKeystoreToFile,
  useReactiveWorkspace,
  useWorkspace,
  useWorkspaceState
} from '../../workspace';

// ============================================================================
// Lock/Unlock Icons
// ============================================================================

function LockClosedIcon(): React.ReactElement {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function LockOpenIcon(): React.ReactElement {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  );
}

// ============================================================================
// Password Input Component
// ============================================================================

interface IPasswordInputProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly autoFocus?: boolean;
}

function PasswordInput({ value, onChange, placeholder, autoFocus }: IPasswordInputProps): React.ReactElement {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-16"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

// ============================================================================
// SecuritySection Component
// ============================================================================

export function SecuritySection(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const { unlock: workspaceUnlock, lock: workspaceLock } = useWorkspaceState();
  const keyStore = workspace.keyStore;
  const workspaceState = workspace.state;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'idle' | 'set-password' | 'unlock' | 'change-password'>('idle');
  const [apiKeyName, setApiKeyName] = useState('');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [apiKeyError, setApiKeyError] = useState<string | undefined>();
  const [apiKeySuccess, setApiKeySuccess] = useState(false);
  const [apiKeySuccessMessage, setApiKeySuccessMessage] = useState('Saved!');

  // Master password is stored on the reactive workspace so it survives
  // component unmount/remount cycles (e.g. navigating away from settings).
  const masterPassword = reactiveWorkspace.masterPassword;
  const setMasterPassword = useCallback(
    (pw: string | undefined): void => {
      reactiveWorkspace.masterPassword = pw;
    },
    [reactiveWorkspace]
  );

  const clearForm = useCallback((): void => {
    setPassword('');
    setConfirmPassword('');
    setError(undefined);
    setMode('idle');
  }, []);

  const persistKeyStore = useCallback(
    async (ks: NonNullable<typeof keyStore>, pw: string): Promise<void> => {
      const rootDir = reactiveWorkspace.localStorageRootDir;
      if (!rootDir) return;

      const fileItemResult = getOrCreateKeystoreFileItem(rootDir);
      if (fileItemResult.isFailure()) {
        workspace.data.logger.warn(`Keystore persist: ${fileItemResult.message}`);
        return;
      }
      const saveResult = await saveKeystoreToFile(ks, pw, fileItemResult.value);
      if (saveResult.isFailure()) {
        workspace.data.logger.warn(`Keystore persist: ${saveResult.message}`);
      }
    },
    [reactiveWorkspace, workspace]
  );

  // ---- Set Password (new keystore) ----
  const handleSetPassword = useCallback(async (): Promise<void> => {
    if (!keyStore) {
      setError('No keystore available');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setBusy(true);
    setError(undefined);
    try {
      const initResult = await keyStore.initialize(password);
      if (initResult.isFailure()) {
        setError(initResult.message);
        return;
      }
      await persistKeyStore(keyStore, password);
      reactiveWorkspace.notifyChange();
      setMasterPassword(password);
      clearForm();
    } finally {
      setBusy(false);
    }
  }, [keyStore, password, confirmPassword, persistKeyStore, reactiveWorkspace, clearForm]);

  // ---- Unlock ----
  const handleUnlock = useCallback(async (): Promise<void> => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setBusy(true);
    setError(undefined);
    try {
      const errorMsg = await workspaceUnlock(password);
      if (errorMsg) {
        setError('Incorrect password');
        return;
      }
      setMasterPassword(password);
      clearForm();
    } finally {
      setBusy(false);
    }
  }, [password, workspaceUnlock, clearForm]);

  // ---- Lock ----
  const handleLock = useCallback((): void => {
    workspaceLock();
    setMasterPassword(undefined);
  }, [workspaceLock]);

  // ---- Change Password ----
  const handleChangePassword = useCallback(async (): Promise<void> => {
    if (!keyStore) return;
    if (!password) {
      setError('New password is required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setBusy(true);
    setError(undefined);
    try {
      await persistKeyStore(keyStore, password);
      reactiveWorkspace.notifyChange();
      setMasterPassword(password);
      clearForm();
    } finally {
      setBusy(false);
    }
  }, [keyStore, password, confirmPassword, persistKeyStore, reactiveWorkspace, clearForm]);

  // ---- Import API Key ----
  const handleImportApiKey = useCallback(async (): Promise<void> => {
    if (!keyStore) {
      setApiKeyError('No keystore available');
      return;
    }
    const trimmedName = apiKeyName.trim();
    const trimmedValue = apiKeyValue.trim();
    if (!trimmedName) {
      setApiKeyError('Secret name is required');
      return;
    }
    if (!trimmedValue) {
      setApiKeyError('API key is required');
      return;
    }

    setApiKeyError(undefined);
    const result = keyStore.importApiKey(trimmedName, trimmedValue, { replace: true });
    if (result.isFailure()) {
      setApiKeyError(result.message);
      return;
    }

    // Persist keystore after adding secret
    if (masterPassword) {
      await persistKeyStore(keyStore, masterPassword);
    } else {
      workspace.data.logger.warn('Keystore: master password not available, key added to memory only');
      setApiKeyError('Key added but could not persist — please lock and unlock to re-enter password');
    }
    reactiveWorkspace.notifyChange();

    setApiKeyName('');
    setApiKeyValue('');
    setApiKeySuccess(true);
    setApiKeySuccessMessage(result.value.replaced ? 'Replaced!' : 'Saved!');
    setTimeout(() => setApiKeySuccess(false), 2000);
  }, [keyStore, apiKeyName, apiKeyValue, masterPassword, persistKeyStore, reactiveWorkspace]);

  // ---- Secret List ----
  const secretNames: ReadonlyArray<string> = (() => {
    if (!keyStore) return [];
    const result = keyStore.listSecrets();
    return result.isSuccess() ? result.value : [];
  })();

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
        <div className="space-y-4">
          {/* Keystore Status Card */}
          <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  workspaceState === 'unlocked'
                    ? 'bg-green-100 text-green-600'
                    : workspaceState === 'locked'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {workspaceState === 'unlocked' ? <LockOpenIcon /> : <LockClosedIcon />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Keystore</p>
                <p className="text-xs text-gray-500">
                  {workspaceState === 'no-keystore' && 'No keystore configured'}
                  {workspaceState === 'locked' && 'Locked'}
                  {workspaceState === 'unlocked' && `Unlocked - ${secretNames.length} secret(s)`}
                </p>
              </div>
            </div>

            {/* Action Buttons (idle mode) */}
            {mode === 'idle' && (
              <div className="flex gap-2 flex-wrap">
                {workspaceState === 'no-keystore' && (
                  <button
                    type="button"
                    onClick={() => setMode('set-password')}
                    className="px-3 py-1.5 text-sm border border-amber-500 rounded-md text-amber-700 hover:bg-amber-50"
                  >
                    Set Password
                  </button>
                )}
                {workspaceState === 'locked' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode('unlock')}
                      className="px-3 py-1.5 text-sm bg-amber-500 rounded-md text-white hover:bg-amber-600"
                    >
                      Unlock
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('set-password')}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"
                    >
                      Reset Password
                    </button>
                  </>
                )}
                {workspaceState === 'unlocked' && (
                  <>
                    <button
                      type="button"
                      onClick={handleLock}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"
                    >
                      Lock
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('change-password')}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"
                    >
                      Change Password
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Set Password Form */}
            {mode === 'set-password' && (
              <div className="space-y-3 mt-2">
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter password"
                  autoFocus
                />
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm password"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSetPassword}
                    disabled={busy}
                    className="px-3 py-1.5 text-sm bg-amber-500 rounded-md text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    {busy ? 'Setting...' : 'Set Password'}
                  </button>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Unlock Form */}
            {mode === 'unlock' && (
              <div className="space-y-3 mt-2">
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter password"
                  autoFocus
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUnlock}
                    disabled={busy}
                    className="px-3 py-1.5 text-sm bg-amber-500 rounded-md text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    {busy ? 'Unlocking...' : 'Unlock'}
                  </button>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Change Password Form */}
            {mode === 'change-password' && (
              <div className="space-y-3 mt-2">
                <PasswordInput value={password} onChange={setPassword} placeholder="New password" autoFocus />
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm new password"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={busy}
                    className="px-3 py-1.5 text-sm bg-amber-500 rounded-md text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    {busy ? 'Saving...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Secrets List (only when unlocked) */}
          {workspaceState === 'unlocked' && secretNames.length > 0 && (
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Secrets</p>
              <ul className="space-y-1">
                {secretNames.map((name) => (
                  <li key={name} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="flex-1">{name}</span>
                    <button
                      type="button"
                      onClick={(): void => {
                        setApiKeyName(name);
                        setApiKeyValue('');
                        setApiKeyError(undefined);
                      }}
                      className="text-xs text-amber-600 hover:text-amber-800"
                    >
                      Replace
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Import API Key (only when unlocked) */}
          {workspaceState === 'unlocked' && (
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Import API Key</p>
              <p className="text-xs text-gray-500 mb-3">
                Store or replace an API key secret for use with AI assist providers.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={apiKeyName}
                  onChange={(e): void => setApiKeyName(e.target.value)}
                  placeholder="Secret name (e.g. xai-api-key)"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <input
                  type="password"
                  value={apiKeyValue}
                  onChange={(e): void => setApiKeyValue(e.target.value)}
                  placeholder="API key"
                  className="w-full px-3 py-1.5 text-sm font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                {apiKeyError && <p className="text-xs text-red-600">{apiKeyError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleImportApiKey}
                    disabled={!apiKeyName.trim() || !apiKeyValue.trim()}
                    className="px-3 py-1.5 text-sm bg-amber-500 rounded-md text-white hover:bg-amber-600 disabled:opacity-50"
                  >
                    Import
                  </button>
                  {apiKeySuccess && <span className="text-xs text-green-600">{apiKeySuccessMessage}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
