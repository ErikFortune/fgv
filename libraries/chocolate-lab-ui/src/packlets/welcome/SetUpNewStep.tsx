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
 * Setup-new step for the welcome screen: keystore password + default collection creation.
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
  type CollectionId,
  Converters as ChocolateConverters,
  Helpers,
  LibraryData,
  type Settings
} from '@fgv/ts-chocolate';

import { useReactiveWorkspace, useWorkspace } from '../workspace';
import { getOrCreateKeystoreFileItem, saveKeystoreToFile } from '../workspace';
import { getSubLibraryById } from '../sidebar';
import { type IDefaultCollectionConfig, SUB_LIBRARY_LABELS, SUB_LIBRARY_TO_TARGET_KEY } from './model';

// ============================================================================
// Props
// ============================================================================

/**
 * @public
 */
export interface ISetUpNewStepProps {
  readonly onComplete: () => Promise<void>;
  readonly onBack: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function createInitialCollectionConfigs(): ReadonlyArray<IDefaultCollectionConfig> {
  return LibraryData.allSubLibraryIds.map((id) => ({
    subLibraryId: id,
    name: `My ${SUB_LIBRARY_LABELS[id]}`,
    enabled: true
  }));
}

// ============================================================================
// Component
// ============================================================================

/**
 * @public
 */
export function SetUpNewStep(props: ISetUpNewStepProps): React.ReactElement {
  const { onComplete, onBack } = props;
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();

  // Keystore
  const [enableKeystore, setEnableKeystore] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Collections
  const [collectionConfigs, setCollectionConfigs] = useState<ReadonlyArray<IDefaultCollectionConfig>>(
    createInitialCollectionConfigs
  );

  // Status
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const keystoreValid = !enableKeystore || (password.length > 0 && password === confirmPassword);
  const anyCollectionEnabled = collectionConfigs.some((c) => c.enabled);
  const canSubmit = keystoreValid && !busy;

  const allEnabled = useMemo(() => collectionConfigs.every((c) => c.enabled), [collectionConfigs]);

  const toggleAll = useCallback((): void => {
    const newEnabled = !allEnabled;
    setCollectionConfigs((prev) => prev.map((c) => ({ ...c, enabled: newEnabled })));
  }, [allEnabled]);

  const updateConfig = useCallback((index: number, update: Partial<IDefaultCollectionConfig>): void => {
    setCollectionConfigs((prev) => prev.map((c, i) => (i === index ? { ...c, ...update } : c)));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (!canSubmit) return;

      setBusy(true);
      setError(undefined);

      try {
        // 1. Initialize keystore if requested
        if (enableKeystore && password) {
          const keyStore = reactiveWorkspace.workspace.keyStore;
          if (!keyStore) {
            setError('Keystore is not available.');
            setBusy(false);
            return;
          }
          const initResult = await keyStore.initialize(password);
          if (initResult.isFailure()) {
            setError(`Keystore initialization failed: ${initResult.message}`);
            setBusy(false);
            return;
          }

          // Persist keystore file
          const rootDir = reactiveWorkspace.keystoreRootDir ?? reactiveWorkspace.localStorageRootDir;
          if (rootDir) {
            const fileItemResult = getOrCreateKeystoreFileItem(rootDir);
            if (fileItemResult.isSuccess()) {
              const saveResult = await saveKeystoreToFile(keyStore, password, fileItemResult.value);
              if (saveResult.isFailure()) {
                setError(`Failed to save keystore: ${saveResult.message}`);
                setBusy(false);
                return;
              }
            }
          }

          // eslint-disable-next-line require-atomic-updates
          reactiveWorkspace.masterPassword = password;
          reactiveWorkspace.notifyChange();
        }

        // 2. Create default collections
        const enabledConfigs = collectionConfigs.filter((c) => c.enabled && c.name.trim());
        const targetEntries: Array<[keyof Settings.IDefaultCollectionTargets, CollectionId]> = [];

        for (const config of enabledConfigs) {
          const subLibrary = getSubLibraryById(
            workspace.data.entities,
            workspace.userData.entities,
            config.subLibraryId
          );
          if (!subLibrary) continue;

          const idResult = Helpers.nameToBaseId(config.name.trim());
          if (idResult.isFailure()) continue;

          const collectionIdResult = ChocolateConverters.collectionId.convert(idResult.value);
          if (collectionIdResult.isFailure()) continue;
          const collectionId = collectionIdResult.value;
          const createResult = LibraryData.isUserSubLibrary(config.subLibraryId)
            ? await workspace.userData.entities
                .getCollectionManager(subLibrary)
                .createWithFile(collectionId, { name: config.name.trim() })
            : await workspace.data.entities
                .getCollectionManager(subLibrary)
                .createWithFile(collectionId, { name: config.name.trim() });
          if (createResult.isSuccess()) {
            const targetKey = SUB_LIBRARY_TO_TARGET_KEY[config.subLibraryId];
            targetEntries.push([targetKey, collectionId]);
          }
        }

        // 3. Update default collection targets in settings
        const settings = workspace.settings;
        if (settings && targetEntries.length > 0) {
          const defaultTargets = Object.fromEntries(
            targetEntries
          ) as Partial<Settings.IDefaultCollectionTargets>;
          settings.updateDefaultTargets(defaultTargets);
          await settings.save();
        }

        reactiveWorkspace.notifyChange();

        // 4. Finish setup (writes bootstrap/preferences)
        await onComplete();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
        setBusy(false);
      }
    },
    [canSubmit, enableKeystore, password, collectionConfigs, reactiveWorkspace, workspace, onComplete]
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface overflow-y-auto">
      <div className="w-full max-w-lg mx-4 my-8">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="text-sm text-muted hover:text-primary mb-4 disabled:opacity-50"
        >
          &larr; Back
        </button>

        <h1 className="text-2xl font-bold text-primary mb-1">Set Up New Workspace</h1>
        <p className="text-muted mb-6">Configure your keystore and create default collections.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Keystore Section */}
          <section className="bg-surface border border-border rounded-lg p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableKeystore}
                onChange={(e): void => setEnableKeystore(e.target.checked)}
                disabled={busy}
                className="rounded border-border text-brand-accent focus:ring-focus-ring"
              />
              <span className="font-semibold text-primary">Set a master password</span>
            </label>
            <p className="text-xs text-muted mt-1 ml-6">
              Protects your keystore and enables encrypted collections.
            </p>

            {enableKeystore && (
              <div className="mt-3 ml-6 space-y-3">
                <div>
                  <label htmlFor="setup-password" className="block text-sm font-medium text-secondary mb-1">
                    Password
                  </label>
                  <input
                    ref={passwordInputRef}
                    id="setup-password"
                    type="password"
                    value={password}
                    onChange={(e): void => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-transparent"
                    placeholder="Master password"
                    autoComplete="new-password"
                    disabled={busy}
                  />
                </div>
                <div>
                  <label htmlFor="setup-confirm" className="block text-sm font-medium text-secondary mb-1">
                    Confirm password
                  </label>
                  <input
                    id="setup-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={(e): void => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-transparent ${
                      passwordMismatch
                        ? 'border-status-error-border-strong bg-status-error-bg'
                        : 'border-border'
                    }`}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    disabled={busy}
                  />
                  {passwordMismatch && (
                    <p className="mt-1 text-xs text-status-error-accent">Passwords do not match</p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Default Collections Section */}
          <section className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-primary">Default Collections</h2>
                <p className="text-xs text-muted">Create starter collections for each section.</p>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                disabled={busy}
                className="text-xs text-brand-accent hover:underline disabled:opacity-50"
              >
                {allEnabled ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2">
              {collectionConfigs.map((config, index) => (
                <div key={config.subLibraryId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e): void => updateConfig(index, { enabled: e.target.checked })}
                    disabled={busy}
                    className="rounded border-border text-brand-accent focus:ring-focus-ring flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e): void => updateConfig(index, { name: e.target.value })}
                    disabled={busy || !config.enabled}
                    className="flex-1 px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-transparent disabled:bg-disabled disabled:text-muted"
                    placeholder={`My ${SUB_LIBRARY_LABELS[config.subLibraryId]}`}
                  />
                  <span className="text-xs text-muted w-28 flex-shrink-0 truncate">
                    {SUB_LIBRARY_LABELS[config.subLibraryId]}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="p-3 bg-status-error-bg border border-status-error-border rounded-md">
              <p className="text-sm text-status-error-accent">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onBack}
              disabled={busy}
              className="px-4 py-2 text-sm font-medium text-secondary bg-surface border border-border rounded-md hover:bg-hover disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 text-sm font-medium text-inverted bg-brand-accent rounded-md hover:bg-brand-accent/90 disabled:opacity-50"
            >
              {busy ? 'Setting up…' : anyCollectionEnabled ? 'Create & Continue' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
