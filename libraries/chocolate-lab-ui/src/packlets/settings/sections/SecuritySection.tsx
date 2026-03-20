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
        className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-status-warning-btn focus:border-transparent pr-16"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-secondary"
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
      const rootDir = reactiveWorkspace.keystoreRootDir;
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

  // ---- Add/Edit Encryption Key ----
  const [encKeyName, setEncKeyName] = useState('');
  const [encKeyPassword, setEncKeyPassword] = useState('');
  const [encKeyConfirm, setEncKeyConfirm] = useState('');
  const [encKeyError, setEncKeyError] = useState<string | undefined>();
  const [encKeyBusy, setEncKeyBusy] = useState(false);
  const [encKeySuccess, setEncKeySuccess] = useState(false);
  const [encKeySuccessMessage, setEncKeySuccessMessage] = useState('Saved!');

  const handleAddEncryptionKey = useCallback(async (): Promise<void> => {
    if (!keyStore) {
      setEncKeyError('No keystore available');
      return;
    }
    const trimmedName = encKeyName.trim();
    if (!trimmedName) {
      setEncKeyError('Key name is required');
      return;
    }
    if (!encKeyPassword) {
      setEncKeyError('Password is required');
      return;
    }
    if (encKeyPassword !== encKeyConfirm) {
      setEncKeyError('Passwords do not match');
      return;
    }

    setEncKeyBusy(true);
    setEncKeyError(undefined);
    try {
      const result = await keyStore.addSecretFromPassword(trimmedName, encKeyPassword, { replace: true });
      if (result.isFailure()) {
        setEncKeyError(result.message);
        return;
      }

      // Persist keystore after adding key
      if (masterPassword) {
        await persistKeyStore(keyStore, masterPassword);
      } else {
        workspace.data.logger.warn('Keystore: master password not available, key added to memory only');
        setEncKeyError('Key added but could not persist — please lock and unlock to re-enter password');
      }
      reactiveWorkspace.notifyChange();

      setEncKeyName('');
      setEncKeyPassword('');
      setEncKeyConfirm('');
      setEncKeySuccess(true);
      setEncKeySuccessMessage(result.value.replaced ? 'Replaced!' : 'Saved!');
      setTimeout(() => setEncKeySuccess(false), 2000);
    } finally {
      setEncKeyBusy(false);
    }
  }, [
    keyStore,
    encKeyName,
    encKeyPassword,
    encKeyConfirm,
    masterPassword,
    persistKeyStore,
    reactiveWorkspace,
    workspace
  ]);

  // ---- Secret Lists (split by type) ----
  const encryptionKeyNames: ReadonlyArray<string> = (() => {
    if (!keyStore) return [];
    const result = keyStore.listSecretsByType('encryption-key');
    return result.isSuccess() ? result.value : [];
  })();

  const apiKeyNames: ReadonlyArray<string> = (() => {
    if (!keyStore) return [];
    const result = keyStore.listSecretsByType('api-key');
    return result.isSuccess() ? result.value : [];
  })();

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
        <h2 className="text-lg font-semibold text-primary mb-4">Security</h2>
        <div className="space-y-4">
          {/* Keystore Status Card */}
          <div className="rounded-lg border border-border p-4 bg-surface-alt">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  workspaceState === 'unlocked'
                    ? 'bg-status-success-surface text-status-success-accent'
                    : workspaceState === 'locked'
                    ? 'bg-status-warning-surface text-status-warning-strong'
                    : 'bg-surface-raised text-muted'
                }`}
              >
                {workspaceState === 'unlocked' ? <LockOpenIcon /> : <LockClosedIcon />}
              </div>
              <div>
                <p className="text-sm font-medium text-secondary">Keystore</p>
                <p className="text-xs text-muted">
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
                    className="px-3 py-1.5 text-sm border border-status-warning-btn rounded-md text-status-warning-strong hover:bg-status-warning-bg"
                  >
                    Set Password
                  </button>
                )}
                {workspaceState === 'locked' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode('unlock')}
                      className="px-3 py-1.5 text-sm bg-status-warning-btn rounded-md text-white hover:bg-status-warning-btn-hover"
                    >
                      Unlock
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('set-password')}
                      className="px-3 py-1.5 text-sm border border-border rounded-md text-secondary hover:bg-hover"
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
                      className="px-3 py-1.5 text-sm border border-border rounded-md text-secondary hover:bg-hover"
                    >
                      Lock
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('change-password')}
                      className="px-3 py-1.5 text-sm border border-border rounded-md text-secondary hover:bg-hover"
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
                {error && <p className="text-xs text-status-error-accent">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSetPassword}
                    disabled={busy}
                    className="px-3 py-1.5 text-sm bg-status-warning-btn rounded-md text-white hover:bg-status-warning-btn-hover disabled:opacity-50"
                  >
                    {busy ? 'Setting...' : 'Set Password'}
                  </button>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="px-3 py-1.5 text-sm border border-border rounded-md text-secondary hover:bg-hover"
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
                {error && <p className="text-xs text-status-error-accent">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleUnlock}
                    disabled={busy}
                    className="px-3 py-1.5 text-sm bg-status-warning-btn rounded-md text-white hover:bg-status-warning-btn-hover disabled:opacity-50"
                  >
                    {busy ? 'Unlocking...' : 'Unlock'}
                  </button>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="px-3 py-1.5 text-sm border border-border rounded-md text-secondary hover:bg-hover"
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
                {error && <p className="text-xs text-status-error-accent">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={busy}
                    className="px-3 py-1.5 text-sm bg-status-warning-btn rounded-md text-white hover:bg-status-warning-btn-hover disabled:opacity-50"
                  >
                    {busy ? 'Saving...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={clearForm}
                    className="px-3 py-1.5 text-sm border border-border rounded-md text-secondary hover:bg-hover"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Encryption Keys List (only when unlocked) */}
          {workspaceState === 'unlocked' && encryptionKeyNames.length > 0 && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-secondary mb-2">Encryption Keys</p>
              <p className="text-xs text-muted mb-2">
                Password-derived keys used to encrypt and decrypt collections.
              </p>
              <ul className="space-y-1">
                {encryptionKeyNames.map((name) => (
                  <li key={name} className="text-sm text-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-warning-icon" />
                    <span className="flex-1 font-mono text-xs">{name}</span>
                    <button
                      type="button"
                      onClick={(): void => {
                        setEncKeyName(name);
                        setEncKeyPassword('');
                        setEncKeyConfirm('');
                        setEncKeyError(undefined);
                      }}
                      className="text-xs text-status-warning-strong hover:text-status-warning-text"
                    >
                      Replace
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add/Edit Encryption Key (only when unlocked) */}
          {workspaceState === 'unlocked' && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-secondary mb-2">Add Encryption Key</p>
              <p className="text-xs text-muted mb-3">
                Create or replace a named encryption key derived from a password. Use to encrypt collections.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={encKeyName}
                  onChange={(e): void => setEncKeyName(e.target.value)}
                  placeholder="Key name (e.g. my-secret)"
                  className="w-full px-3 py-1.5 text-sm font-mono border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-status-warning-btn focus:border-transparent"
                />
                <PasswordInput value={encKeyPassword} onChange={setEncKeyPassword} placeholder="Password" />
                <PasswordInput
                  value={encKeyConfirm}
                  onChange={setEncKeyConfirm}
                  placeholder="Confirm password"
                />
                {encKeyError && <p className="text-xs text-status-error-accent">{encKeyError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(): void => {
                      handleAddEncryptionKey().catch(() => undefined);
                    }}
                    disabled={encKeyBusy || !encKeyName.trim() || !encKeyPassword || !encKeyConfirm}
                    className="px-3 py-1.5 text-sm bg-status-warning-btn rounded-md text-white hover:bg-status-warning-btn-hover disabled:opacity-50"
                  >
                    {encKeyBusy ? 'Saving…' : 'Save'}
                  </button>
                  {encKeySuccess && (
                    <span className="text-xs text-status-success-accent">{encKeySuccessMessage}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* API Keys List (only when unlocked) */}
          {workspaceState === 'unlocked' && apiKeyNames.length > 0 && (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-secondary mb-2">API Keys</p>
              <p className="text-xs text-muted mb-2">Stored API keys for AI assist providers.</p>
              <ul className="space-y-1">
                {apiKeyNames.map((name) => (
                  <li key={name} className="text-sm text-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-status-success-icon" />
                    <span className="flex-1">{name}</span>
                    <button
                      type="button"
                      onClick={(): void => {
                        setApiKeyName(name);
                        setApiKeyValue('');
                        setApiKeyError(undefined);
                      }}
                      className="text-xs text-status-warning-strong hover:text-status-warning-text"
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
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-secondary mb-2">Import API Key</p>
              <p className="text-xs text-muted mb-3">
                Store or replace an API key secret for use with AI assist providers.
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={apiKeyName}
                  onChange={(e): void => setApiKeyName(e.target.value)}
                  placeholder="Secret name (e.g. xai-api-key)"
                  className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-status-warning-btn focus:border-transparent"
                />
                <input
                  type="password"
                  value={apiKeyValue}
                  onChange={(e): void => setApiKeyValue(e.target.value)}
                  placeholder="API key"
                  className="w-full px-3 py-1.5 text-sm font-mono border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                {apiKeyError && <p className="text-xs text-status-error-accent">{apiKeyError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleImportApiKey}
                    disabled={!apiKeyName.trim() || !apiKeyValue.trim()}
                    className="px-3 py-1.5 text-sm bg-status-warning-btn rounded-md text-white hover:bg-status-warning-btn-hover disabled:opacity-50"
                  >
                    Import
                  </button>
                  {apiKeySuccess && (
                    <span className="text-xs text-status-success-accent">{apiKeySuccessMessage}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
