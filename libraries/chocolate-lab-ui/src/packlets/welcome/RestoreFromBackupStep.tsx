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
 * Restore-from-backup step for the welcome screen.
 * @packageDocumentation
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';

import { LibraryData, restoreRoot, type IBackupManifest } from '@fgv/ts-chocolate';
import { ZipFileTree } from '@fgv/ts-extras';
import { FileTree } from '@fgv/ts-json-base';

import { useReactiveWorkspace, useWorkspace } from '../workspace';
import { SUB_LIBRARY_LABELS } from './model';

// ============================================================================
// Types
// ============================================================================

interface IBackupCollectionEntry {
  readonly subLibraryId: string;
  readonly collectionFile: string;
  enabled: boolean;
}

interface IBackupRootInfo {
  readonly rootId: string;
  readonly label: string;
  readonly collections: ReadonlyArray<IBackupCollectionEntry>;
  readonly hasSettings: boolean;
  readonly hasKeystore: boolean;
}

interface IParsedBackup {
  readonly manifest: IBackupManifest;
  readonly roots: ReadonlyArray<IBackupRootInfo>;
  readonly zipData: ArrayBuffer;
}

// ============================================================================
// Props
// ============================================================================

/**
 * @public
 */
export interface IRestoreFromBackupStepProps {
  /** Write cold-start default settings (but don't transition yet). */
  readonly onWriteSettings: () => Promise<void>;
  /** Transition away from the welcome screen (call AFTER sync). */
  readonly onTransition: () => void;
  readonly onBack: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

const MANIFEST_FILE: string = '_backup-manifest.json';

/**
 * Maps directory names under `data/` to their SubLibraryId.
 * LibraryPaths values are like `data/ingredients` — we extract the last segment.
 */
const DIR_NAME_TO_SUB_LIBRARY: ReadonlyMap<string, LibraryData.SubLibraryId> = new Map(
  LibraryData.allSubLibraryIds.map((id) => {
    const path = LibraryData.LibraryPaths[id];
    const dirName = path.includes('/') ? path.slice(path.lastIndexOf('/') + 1) : path;
    return [dirName, id];
  })
);

function getSubLibraryIdForDirName(dirName: string): LibraryData.SubLibraryId | undefined {
  return DIR_NAME_TO_SUB_LIBRARY.get(dirName);
}

async function parseBackupZip(zipData: ArrayBuffer): Promise<IParsedBackup> {
  const accessorsResult = await ZipFileTree.ZipFileTreeAccessors.fromBufferAsync(zipData);
  if (accessorsResult.isFailure()) {
    throw new Error(`Failed to open backup archive: ${accessorsResult.message}`);
  }

  const zipAccessors = accessorsResult.value;

  // Read manifest
  const manifestResult = zipAccessors.getFileContents(`/${MANIFEST_FILE}`);
  if (manifestResult.isFailure()) {
    throw new Error('This file does not appear to be a valid Chocolate Lab backup.');
  }

  const manifest = JSON.parse(manifestResult.value) as IBackupManifest;

  // Enumerate collections per root
  const roots: IBackupRootInfo[] = [];

  for (const rootEntry of manifest.roots) {
    const collections: IBackupCollectionEntry[] = [];
    let hasSettings = false;
    let hasKeystore = false;

    // Check for data directories
    const dataDirResult = zipAccessors.getItem(`/${rootEntry.id}/data`);
    if (dataDirResult.isSuccess() && dataDirResult.value.type === 'directory') {
      const dataDir = dataDirResult.value as FileTree.IFileTreeDirectoryItem;
      const childrenResult = dataDir.getChildren();
      if (childrenResult.isSuccess()) {
        for (const child of childrenResult.value) {
          if (child.type !== 'directory') continue;

          if (child.name === 'settings') {
            hasSettings = true;
            continue;
          }

          if (child.name === 'keystore') {
            hasKeystore = true;
            continue;
          }

          if (!DIR_NAME_TO_SUB_LIBRARY.has(child.name)) continue;

          // Enumerate collection files within this sublibrary
          const subDir = child as FileTree.IFileTreeDirectoryItem;
          const subChildrenResult = subDir.getChildren();
          if (subChildrenResult.isSuccess()) {
            for (const file of subChildrenResult.value) {
              if (file.type === 'file') {
                collections.push({
                  subLibraryId: child.name,
                  collectionFile: file.name,
                  enabled: true
                });
              }
            }
          }
        }
      }
    }

    // Also check for keystore at root level
    const keystoreResult = zipAccessors.getItem(`/${rootEntry.id}/keystore`);
    if (keystoreResult.isSuccess()) {
      hasKeystore = true;
    }

    roots.push({ rootId: rootEntry.id, label: rootEntry.label, collections, hasSettings, hasKeystore });
  }

  return { manifest, roots, zipData };
}

// ============================================================================
// Component
// ============================================================================

/**
 * @public
 */
export function RestoreFromBackupStep(props: IRestoreFromBackupStepProps): React.ReactElement {
  const { onWriteSettings, onTransition, onBack } = props;
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedBackup, setParsedBackup] = useState<IParsedBackup | undefined>(undefined);
  const [importSettings, setImportSettings] = useState(true);
  const [collectionSelections, setCollectionSelections] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [parseError, setParseError] = useState<string | undefined>(undefined);

  // Group collections by sublibrary for display
  const collectionsBySubLibrary = useMemo(() => {
    if (!parsedBackup) return new Map<string, ReadonlyArray<IBackupCollectionEntry>>();
    const map = new Map<string, IBackupCollectionEntry[]>();
    for (const root of parsedBackup.roots) {
      for (const col of root.collections) {
        const existing = map.get(col.subLibraryId) ?? [];
        existing.push(col);
        map.set(col.subLibraryId, existing);
      }
    }
    return map;
  }, [parsedBackup]);

  const totalCollections = useMemo(() => {
    if (!parsedBackup) return 0;
    return parsedBackup.roots.reduce((sum, r) => sum + r.collections.length, 0);
  }, [parsedBackup]);

  const selectedCount = useMemo(() => {
    return Object.values(collectionSelections).filter(Boolean).length;
  }, [collectionSelections]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(undefined);
    setBusy(true);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parseBackupZip(buffer);
      setParsedBackup(parsed);

      // Default all collections to selected
      const selections: Record<string, boolean> = {};
      for (const root of parsed.roots) {
        for (const col of root.collections) {
          selections[`${root.rootId}/${col.subLibraryId}/${col.collectionFile}`] = true;
        }
      }
      setCollectionSelections(selections);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const toggleCollection = useCallback((key: string): void => {
    setCollectionSelections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleSubLibrary = useCallback((subLibraryDir: string): void => {
    setCollectionSelections((prev) => {
      const next = { ...prev };
      const keys = Object.keys(next).filter((k) => k.includes(`/${subLibraryDir}/`));
      const allSelected = keys.every((k) => next[k]);
      for (const key of keys) {
        next[key] = !allSelected;
      }
      return next;
    });
  }, []);

  const handleRestore = useCallback(async (): Promise<void> => {
    if (!parsedBackup) return;

    setBusy(true);
    setError(undefined);

    try {
      // Get the target directory — prefer cloud root, fall back to localStorage
      const roots = reactiveWorkspace.storageSummary.roots;
      const cloudRoot = roots.find((r) => r.isCloud && r.isMutable);
      const targetRootName = cloudRoot?.sourceName;
      const targetDir =
        (targetRootName ? reactiveWorkspace.additionalRootDirs.get(targetRootName) : undefined) ??
        reactiveWorkspace.localStorageRootDir;

      if (!targetDir) {
        setError('No writable storage root available for restore.');
        setBusy(false);
        return;
      }

      for (const rootInfo of parsedBackup.roots) {
        // Build a set of selected file path prefixes for this root
        const selectedPrefixes = new Set<string>();

        // Always include settings and keystore if importSettings is checked
        if (importSettings) {
          if (rootInfo.hasSettings) {
            selectedPrefixes.add('data/settings/');
          }
          if (rootInfo.hasKeystore) {
            selectedPrefixes.add('keystore/');
          }
        }

        // Include selected collection files
        for (const col of rootInfo.collections) {
          const key = `${rootInfo.rootId}/${col.subLibraryId}/${col.collectionFile}`;
          if (collectionSelections[key]) {
            selectedPrefixes.add(`data/${col.subLibraryId}/${col.collectionFile}`);
          }
        }

        if (selectedPrefixes.size === 0) continue;

        const result = await restoreRoot(parsedBackup.zipData, rootInfo.rootId, targetDir, {
          pathPrefixes: selectedPrefixes
        });
        if (result.isFailure()) {
          setError(`Restore failed for root '${rootInfo.label}': ${result.message}`);
          setBusy(false);
          return;
        }
      }

      // Hot-load restored collections into the running workspace (same pattern
      // as useAddStorageRoot / restoreSavedDirectories) so we don't need a
      // page reload, which would lose in-memory data and trigger beforeunload.
      const entities = workspace.data.entities;
      const userEntities = workspace.userData.entities;
      const sourceName = targetRootName ?? 'restored';

      const subLibraries: ReadonlyArray<LibraryData.SubLibraryBase<string, string, unknown>> = [
        entities.ingredients,
        entities.fillings,
        entities.confections,
        entities.decorations,
        entities.molds,
        entities.procedures,
        entities.tasks,
        userEntities.sessions,
        userEntities.journals,
        userEntities.moldInventory,
        userEntities.ingredientInventory
      ];

      for (const lib of subLibraries) {
        lib.loadFromFileTreeSource({
          sourceName,
          directory: targetDir,
          load: true,
          mutable: true,
          skipMissingDirectories: true
        });
      }

      workspace.data.clearCache();

      // Write bootstrap/preferences settings (but don't transition yet).
      await onWriteSettings();

      // Flush all in-memory writes (restored data + settings) to persistent storage.
      // This must complete BEFORE the transition — otherwise React renders the main
      // app while the autoSync is still in-flight and sees dirty trees.
      const syncResult = await reactiveWorkspace.syncAllToDisk();
      if (syncResult.isFailure()) {
        setError(`Restore succeeded but failed to persist: ${syncResult.message}`);
        setBusy(false);
        return;
      }

      // Now transition — trees are clean, so the main app renders without dirty state.
      reactiveWorkspace.notifyChange();
      onTransition();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }, [
    parsedBackup,
    importSettings,
    collectionSelections,
    workspace,
    reactiveWorkspace,
    onWriteSettings,
    onTransition
  ]);

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

        <h1 className="text-2xl font-bold text-primary mb-1">Restore from Backup</h1>
        <p className="text-muted mb-6">Upload a backup archive to restore your workspace.</p>

        {/* File picker */}
        {!parsedBackup && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-brand-accent transition-colors"
              onClick={(): void => fileInputRef.current?.click()}
            >
              <p className="text-primary font-medium">Choose a backup file</p>
              <p className="text-sm text-muted mt-1">Select a .zip file created from the Storage settings</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            {parseError && (
              <div className="p-3 bg-status-error-bg border border-status-error-border rounded-md">
                <p className="text-sm text-status-error-accent">{parseError}</p>
              </div>
            )}
          </div>
        )}

        {/* Backup contents */}
        {parsedBackup && (
          <div className="space-y-4">
            {/* Manifest info */}
            <div className="bg-surface border border-border rounded-lg p-3">
              <div className="text-sm text-muted">
                Backup from{' '}
                <span className="text-primary font-medium">
                  {new Date(parsedBackup.manifest.createdAt).toLocaleDateString()}
                </span>
                {' \u2014 '}
                {totalCollections} collection{totalCollections !== 1 ? 's' : ''} across{' '}
                {parsedBackup.roots.length} root{parsedBackup.roots.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Settings & keystore toggle */}
            {parsedBackup.roots.some((r) => r.hasSettings || r.hasKeystore) && (
              <section className="bg-surface border border-border rounded-lg p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importSettings}
                    onChange={(e): void => setImportSettings(e.target.checked)}
                    disabled={busy}
                    className="rounded border-border text-brand-accent focus:ring-focus-ring"
                  />
                  <span className="font-semibold text-primary">Import settings & keystore</span>
                </label>
                <p className="text-xs text-muted mt-1 ml-6">
                  Restores your preferences, storage configuration, and keystore.
                </p>
              </section>
            )}

            {/* Collection selection */}
            <section className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-primary">Collections</h2>
                  <p className="text-xs text-muted">
                    {selectedCount} of {totalCollections} selected
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Array.from(collectionsBySubLibrary.entries()).map(([dirName, collections]) => {
                  const subLibId = getSubLibraryIdForDirName(dirName);
                  const label = subLibId ? SUB_LIBRARY_LABELS[subLibId] : dirName;
                  const keys = collections.map(
                    (c) =>
                      `${parsedBackup.roots.find((r) => r.collections.includes(c))?.rootId ?? ''}/${
                        c.subLibraryId
                      }/${c.collectionFile}`
                  );
                  const allSelected = keys.every((k) => collectionSelections[k]);

                  return (
                    <div key={dirName}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(): void => toggleSubLibrary(dirName)}
                          disabled={busy}
                          className="rounded border-border text-brand-accent focus:ring-focus-ring"
                        />
                        <span className="text-sm font-medium text-primary">{label}</span>
                        <span className="text-xs text-muted">
                          ({collections.length} collection{collections.length !== 1 ? 's' : ''})
                        </span>
                      </label>
                      <div className="ml-6 mt-1 space-y-1">
                        {collections.map((col) => {
                          const rootId =
                            parsedBackup.roots.find((r) => r.collections.includes(col))?.rootId ?? '';
                          const key = `${rootId}/${col.subLibraryId}/${col.collectionFile}`;
                          const displayName = col.collectionFile.replace(/\.(yaml|json)$/, '');
                          return (
                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={collectionSelections[key] ?? false}
                                onChange={(): void => toggleCollection(key)}
                                disabled={busy}
                                className="rounded border-border text-brand-accent focus:ring-focus-ring"
                              />
                              <span className="text-sm text-secondary">{displayName}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
                type="button"
                onClick={handleRestore}
                disabled={busy || (selectedCount === 0 && !importSettings)}
                className="px-4 py-2 text-sm font-medium text-inverted bg-brand-accent rounded-md hover:bg-brand-accent/90 disabled:opacity-50"
              >
                {busy ? 'Restoring…' : 'Restore & Continue'}
              </button>
            </div>
          </div>
        )}

        {busy && !parsedBackup && <p className="text-sm text-muted mt-4">Reading backup file…</p>}
      </div>
    </div>
  );
}
