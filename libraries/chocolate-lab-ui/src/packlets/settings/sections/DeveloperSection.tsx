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

import React, { useEffect, useState } from 'react';

import { ConfirmDialog } from '@fgv/ts-app-shell';
import { FileTree } from '@fgv/ts-json-base';

import { useReactiveWorkspace, useWorkspace } from '../../workspace';

// ============================================================================
// Props
// ============================================================================

export interface IDeveloperSectionProps {
  readonly currentConfigNamespace?: string;
}

// ============================================================================
// Helpers
// ============================================================================

type ConfirmTarget = 'settings' | 'local' | 'cloud' | 'full-reset' | undefined;

const CONFIRM_CONFIG: Record<
  NonNullable<ConfirmTarget>,
  { title: string; message: string; confirmLabel: string }
> = {
  settings: {
    title: 'Reset Settings',
    message:
      'Delete bootstrap.json and preferences.json from local storage and reload the page? The app will start with default settings.',
    confirmLabel: 'Reset Settings'
  },
  local: {
    title: 'Clear Local Data',
    message:
      'Remove all Chocolate Lab entries from browser localStorage and reload the page? This cannot be undone.',
    confirmLabel: 'Clear Local Data'
  },
  cloud: {
    title: 'Clear Cloud Data',
    message:
      'Delete ALL files from cloud storage roots and reload the page? This is irreversible and will permanently destroy your cloud data.',
    confirmLabel: 'Clear Cloud Data'
  },
  'full-reset': {
    title: 'Full Reset',
    message:
      'This will clear ALL cloud data, remove ALL local storage entries, and reload the page. ' +
      'The app will return to the cold-start welcome screen. This cannot be undone.',
    confirmLabel: 'Full Reset'
  }
};

/**
 * Finds a child directory item by name within a directory.
 */
function findChildDir(
  dir: FileTree.IFileTreeDirectoryItem,
  name: string
): FileTree.AnyFileTreeDirectoryItem | undefined {
  const childrenResult = dir.getChildren();
  if (childrenResult.isFailure()) {
    return undefined;
  }
  return childrenResult.value.find(
    (child): child is FileTree.AnyFileTreeDirectoryItem => child.type === 'directory' && child.name === name
  );
}

/**
 * Attempts to delete a named file within a mutable directory.
 * Silently succeeds if the file does not exist.
 */
function tryDeleteFileFromDir(dir: FileTree.AnyFileTreeDirectoryItem, fileName: string): void {
  if (!FileTree.isMutableDirectoryItem(dir)) {
    return;
  }
  const childrenResult = dir.getChildren();
  if (childrenResult.isFailure()) {
    return;
  }
  const fileExists = childrenResult.value.some((child) => child.type === 'file' && child.name === fileName);
  if (fileExists) {
    dir.deleteChild(fileName);
  }
}

/**
 * Recursively deletes all children of a mutable directory item.
 */
function deleteAllChildren(dir: FileTree.AnyFileTreeDirectoryItem): void {
  if (!FileTree.isMutableDirectoryItem(dir)) {
    return;
  }
  const childrenResult = dir.getChildren();
  if (childrenResult.isFailure()) {
    return;
  }
  for (const child of childrenResult.value) {
    dir.deleteChild(child.name, { recursive: true });
  }
}

// ============================================================================
// DeveloperSection Component
// ============================================================================

export function DeveloperSection({ currentConfigNamespace }: IDeveloperSectionProps): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(undefined);
  const [effectiveUserId, setEffectiveUserId] = useState<string | undefined>(undefined);

  // Fetch effective user ID from server config
  useEffect(() => {
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : undefined))
      .then((config: { cloudStorage?: { userId?: string } } | undefined) => {
        setEffectiveUserId(config?.cloudStorage?.userId);
      })
      .catch(() => undefined);
  }, []);

  // ---- Diagnostic info ----

  const deviceId = workspace.settings?.deviceId;

  const storageSummary = reactiveWorkspace.storageSummary;
  const settingsRoots = storageSummary.roots.filter((r) => r.categories.includes('settings'));
  const settingsLocation =
    settingsRoots.length === 0 ? 'Not configured' : settingsRoots.map((r) => r.label).join(', ');

  const keystoreRootDir = reactiveWorkspace.keystoreRootDir;
  const keystoreLocation = keystoreRootDir !== undefined ? 'Configured' : 'Not configured';

  // ---- Reset handlers ----

  function handleConfirm(): void {
    const target = confirmTarget;
    setConfirmTarget(undefined);

    switch (target) {
      case 'settings':
        handleResetSettings();
        break;
      case 'local':
        handleClearLocalData();
        break;
      case 'cloud':
        handleClearCloudData();
        break;
      case 'full-reset':
        handleFullReset();
        break;
      default:
        break;
    }
  }

  function handleResetSettings(): void {
    const rootDir = reactiveWorkspace.localStorageRootDir;
    if (rootDir) {
      const dataDir = findChildDir(rootDir, 'data');
      if (dataDir) {
        const settingsDir = findChildDir(dataDir, 'settings');
        if (settingsDir) {
          tryDeleteFileFromDir(settingsDir, 'bootstrap.json');
          tryDeleteFileFromDir(settingsDir, 'preferences.json');
        }
      }
    }
    window.location.reload();
  }

  function handleClearLocalData(): void {
    const prefix = 'chocolate-lab';
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }

  function handleClearCloudData(): void {
    for (const rootDir of reactiveWorkspace.additionalRootDirs.values()) {
      deleteAllChildren(rootDir);
    }
    window.location.reload();
  }

  function handleFullReset(): void {
    // 1. Clear all cloud storage roots
    for (const rootDir of reactiveWorkspace.additionalRootDirs.values()) {
      deleteAllChildren(rootDir);
    }

    // 2. Clear all local storage entries
    const prefix = 'chocolate-lab';
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // 3. Reload — with everything cleared, the app returns to cold-start
    window.location.reload();
  }

  // ---- Render ----

  const activeConfirm = confirmTarget !== undefined ? CONFIRM_CONFIG[confirmTarget] : undefined;

  return (
    <>
      {activeConfirm !== undefined && (
        <ConfirmDialog
          isOpen={true}
          title={activeConfirm.title}
          message={activeConfirm.message}
          confirmLabel={activeConfirm.confirmLabel}
          severity="danger"
          onConfirm={handleConfirm}
          onCancel={(): void => setConfirmTarget(undefined)}
        />
      )}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-primary mb-1">Developer</h2>
          <p className="text-xs text-muted">Diagnostic tools for development and testing.</p>
        </div>

        {/* Diagnostic Info */}
        <div className="rounded-lg border border-border p-4 bg-surface-alt">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Diagnostics</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <dt className="text-muted">Config namespace</dt>
            <dd className="text-secondary font-mono break-all">
              {currentConfigNamespace ?? <span className="italic text-muted">default</span>}
            </dd>

            <dt className="text-muted">Settings location</dt>
            <dd className="text-secondary">{settingsLocation}</dd>

            <dt className="text-muted">Keystore location</dt>
            <dd className="text-secondary">{keystoreLocation}</dd>

            <dt className="text-muted">Device ID</dt>
            <dd className="text-secondary font-mono break-all">
              {deviceId ?? <span className="italic text-muted">not set</span>}
            </dd>

            <dt className="text-muted">Effective user ID</dt>
            <dd className="text-secondary font-mono break-all">
              {effectiveUserId ?? <span className="italic text-muted">unknown</span>}
            </dd>
          </dl>
        </div>

        {/* Reset & Clear */}
        <div className="rounded-lg border border-status-error-border p-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Reset &amp; Clear</p>
          <p className="text-xs text-muted mb-4">
            These actions are destructive and cannot be undone. Each will reload the page.
          </p>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary">Full Reset</p>
                <p className="text-xs text-muted mt-0.5">
                  Clears all cloud data and local storage, then reloads. Returns to cold-start welcome screen.
                </p>
              </div>
              <button
                type="button"
                onClick={(): void => setConfirmTarget('full-reset')}
                className="shrink-0 px-3 py-1.5 text-sm border border-status-error-border-strong rounded-md text-inverted bg-status-error-strong hover:bg-status-error-strong/90 transition-colors"
              >
                Full Reset
              </button>
            </div>

            <div className="border-t border-border-subtle" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary">Reset Settings</p>
                <p className="text-xs text-muted mt-0.5">
                  Deletes bootstrap and preferences files from local storage. The app starts with defaults.
                </p>
              </div>
              <button
                type="button"
                onClick={(): void => setConfirmTarget('settings')}
                className="shrink-0 px-3 py-1.5 text-sm border border-status-error-border-strong rounded-md text-status-error-strong hover:bg-status-error-bg transition-colors"
              >
                Reset Settings
              </button>
            </div>

            <div className="border-t border-border-subtle" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary">Clear Local Data</p>
                <p className="text-xs text-muted mt-0.5">
                  Removes all Chocolate Lab keys from browser localStorage and reloads.
                </p>
              </div>
              <button
                type="button"
                onClick={(): void => setConfirmTarget('local')}
                className="shrink-0 px-3 py-1.5 text-sm border border-status-error-border-strong rounded-md text-status-error-strong hover:bg-status-error-bg transition-colors"
              >
                Clear Local Data
              </button>
            </div>

            <div className="border-t border-border-subtle" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary">Clear Cloud Data</p>
                <p className="text-xs text-muted mt-0.5">
                  Deletes all files from cloud storage roots. This is irreversible.
                </p>
              </div>
              <button
                type="button"
                onClick={(): void => setConfirmTarget('cloud')}
                className="shrink-0 px-3 py-1.5 text-sm border border-status-error-border-strong rounded-md text-status-error-strong hover:bg-status-error-bg transition-colors"
              >
                Clear Cloud Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
