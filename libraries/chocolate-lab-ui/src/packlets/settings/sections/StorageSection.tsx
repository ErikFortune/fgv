import React, { useCallback, useRef, useState } from 'react';

import type { ICascadeColumn } from '@fgv/ts-app-shell';
import { ConfirmDialog, MultiActionButton } from '@fgv/ts-app-shell';
import { type Settings, type LibraryData, backupRoots, restoreRoot, Presentation } from '@fgv/ts-chocolate';
import { FileTree } from '@fgv/ts-json-base';

import {
  useReactiveWorkspace,
  useWorkspace,
  useAddStorageRoot,
  useRemoveStorageRoot,
  type IStorageRootSummary,
  type StorageCategory
} from '../../workspace';

// ============================================================================
// Download helper
// ============================================================================

function _downloadFile(data: Uint8Array, filename: string, mimeType: string): void {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================================================
// Types
// ============================================================================

export interface IStorageSectionProps {
  readonly onSquashColumns: (cols: ReadonlyArray<ICascadeColumn>) => void;
  readonly onUpdateCommon: (
    updates: Partial<{ defaultStorageTargets: Settings.IDefaultStorageTargets | undefined }>
  ) => void;
  readonly currentStorageTargets: Settings.IDefaultStorageTargets | undefined;
}

interface ICollectionEntry {
  readonly id: string;
  readonly itemCount: number;
  readonly isMutable: boolean;
}

interface ISubLibraryDef {
  readonly key: string;
  readonly label: string;
  readonly collectionCount: number;
  readonly itemCount: number;
  readonly collections: ReadonlyArray<ICollectionEntry>;
}

// ============================================================================
// Helpers
// ============================================================================

function rootTypeLabel(root: IStorageRootSummary): string {
  if (root.isBuiltIn) return 'Built-in library';
  if (root.isCloud) return root.isMutable ? 'Cloud storage' : 'Cloud storage (read-only)';
  if (root.isLocal) return root.isMutable ? 'Local directory' : 'Local directory (read-only)';
  return 'Browser storage';
}

function rootAccessLabel(root: IStorageRootSummary): string {
  return root.isMutable ? 'Read / write' : 'Read only';
}

function rootBadgeClass(root: IStorageRootSummary): string {
  if (root.isBuiltIn) return 'bg-status-info-bg text-status-info-icon border-status-info-border';
  if (root.isCloud) return 'bg-status-success-bg text-status-success-accent border-status-success-border';
  if (root.isLocal) return 'bg-status-success-bg text-status-success-accent border-status-success-border';
  return 'bg-accent-ai-bg text-accent-ai-text border-accent-ai-border';
}

function rootBadgeLabel(root: IStorageRootSummary): string {
  if (root.isBuiltIn) return 'built-in';
  if (root.isCloud) return 'cloud';
  if (root.isLocal) return 'local';
  return 'browser';
}

const CATEGORY_LABELS: Record<StorageCategory, string> = {
  library: 'Library data',
  'user-data': 'User data',
  settings: 'Settings'
};

const CATEGORY_BADGE_CLASS: Record<StorageCategory, string> = {
  library: 'bg-status-info-bg text-status-info-icon border-status-info-border',
  'user-data': 'bg-status-warning-bg text-status-warning-strong border-status-warning-border',
  settings: 'bg-surface-alt text-muted border-border'
};

/**
 * Maps a storage category to the corresponding field in IDefaultStorageTargets.
 * Returns undefined for categories that don't have a default (e.g. 'settings').
 */
function categoryToTargetField(cat: StorageCategory): 'libraryDefault' | 'userDataDefault' | undefined {
  switch (cat) {
    case 'library':
      return 'libraryDefault';
    case 'user-data':
      return 'userDataDefault';
    default:
      return undefined;
  }
}

function CategoryBadges({
  categories,
  rootId,
  isMutable,
  targets,
  onToggleDefault
}: {
  readonly categories: ReadonlyArray<StorageCategory>;
  readonly rootId: string;
  readonly isMutable: boolean;
  readonly targets: Settings.IDefaultStorageTargets | undefined;
  readonly onToggleDefault: (field: 'libraryDefault' | 'userDataDefault') => void;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1">
      {categories.map((cat) => {
        const field = categoryToTargetField(cat);
        const isDefault = field !== undefined && targets?.[field] === (rootId as Settings.StorageRootId);
        const canBeDefault = field !== undefined && isMutable;

        return (
          <span
            key={cat}
            className={`text-xs border rounded px-1.5 py-0.5 inline-flex items-center gap-1 ${CATEGORY_BADGE_CLASS[cat]}`}
          >
            {CATEGORY_LABELS[cat]}
            {canBeDefault && (
              <button
                type="button"
                onClick={(e): void => {
                  e.stopPropagation();
                  onToggleDefault(field);
                }}
                className={`leading-none ${isDefault ? 'text-star' : 'text-faint hover:text-star'}`}
                title={
                  isDefault
                    ? `${CATEGORY_LABELS[cat]}: default write destination`
                    : `Set as default for ${CATEGORY_LABELS[cat]}`
                }
              >
                {isDefault ? '\u2605' : '\u2606'}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ============================================================================
// StorageCollectionsDetail — level 3: collections for a sub-library in a root
// ============================================================================

interface IStorageCollectionsDetailProps {
  readonly rootLabel: string;
  readonly subLibLabel: string;
  readonly collections: ReadonlyArray<{
    readonly id: string;
    readonly itemCount: number;
    readonly isMutable: boolean;
  }>;
  readonly onClose: () => void;
}

export function StorageCollectionsDetail(props: IStorageCollectionsDetailProps): React.ReactElement {
  const { rootLabel, subLibLabel, collections, onClose } = props;
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-primary">{subLibLabel}</h3>
          <p className="text-xs text-muted mt-0.5">Collections in {rootLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted hover:text-secondary text-lg leading-none ml-2"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      {collections.length === 0 ? (
        <p className="text-sm text-muted italic">No collections loaded.</p>
      ) : (
        <table className="w-full text-sm text-secondary">
          <thead>
            <tr className="text-xs text-muted border-b border-border">
              <th className="text-left font-medium pb-2">Collection</th>
              <th className="text-right font-medium pb-2">Items</th>
              <th className="text-right font-medium pb-2">Access</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((col) => (
              <tr key={col.id} className="border-b border-border-subtle last:border-0">
                <td className="py-2 font-mono text-xs">{col.id}</td>
                <td className="py-2 text-right tabular-nums">{col.itemCount}</td>
                <td className="py-2 text-right">
                  <span
                    className={`text-xs border rounded px-1.5 py-0.5 ${
                      col.isMutable
                        ? 'bg-status-success-bg text-status-success-accent border-status-success-border'
                        : 'bg-surface-alt text-muted border-border'
                    }`}
                  >
                    {col.isMutable ? 'r/w' : 'r/o'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ============================================================================
// StorageRootDetail — level 2: details about a storage root + sub-library list
// ============================================================================

interface IStorageRootDetailProps {
  readonly root: IStorageRootSummary;
  readonly subLibraries: ReadonlyArray<ISubLibraryDef>;
  readonly targets: Settings.IDefaultStorageTargets | undefined;
  readonly rootDir?: FileTree.IFileTreeDirectoryItem;
  readonly onToggleDefault: (field: 'libraryDefault' | 'userDataDefault') => void;
  readonly onToggleSublibraryOverride: (subLibKey: string) => void;
  readonly onPushColumn: (col: ICascadeColumn) => void;
  readonly onClose: () => void;
}

export function StorageRootDetail(props: IStorageRootDetailProps): React.ReactElement {
  const {
    root,
    subLibraries,
    targets,
    rootDir,
    onToggleDefault,
    onToggleSublibraryOverride,
    onPushColumn,
    onClose
  } = props;
  const [selectedSubLibKey, setSelectedSubLibKey] = useState<string | undefined>(undefined);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | undefined>(undefined);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const reactiveWorkspace = useReactiveWorkspace();
  const { removeStorageRoot } = useRemoveStorageRoot();

  async function handleBackup(): Promise<void> {
    if (!rootDir) return;
    setIsBackingUp(true);
    try {
      const result = await backupRoots([{ id: root.id, label: root.label, dir: rootDir }]);
      if (result.isSuccess()) {
        _downloadFile(result.value, `${root.label}-backup.zip`, 'application/zip');
      } else {
        setRestoreMessage(`Backup failed: ${result.message}`);
      }
    } finally {
      setIsBackingUp(false);
    }
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file || !rootDir) return;
    setIsRestoring(true);
    setRestoreMessage(undefined);
    try {
      const buffer = await file.arrayBuffer();
      const result = await restoreRoot(buffer, root.id, rootDir);
      if (result.isSuccess()) {
        reactiveWorkspace.notifyChange();
        setRestoreMessage(
          `Restored ${result.value.filesWritten} file${result.value.filesWritten !== 1 ? 's' : ''}.`
        );
      } else {
        setRestoreMessage(`Restore failed: ${result.message}`);
      }
    } finally {
      setIsRestoring(false);
      if (restoreInputRef.current) {
        restoreInputRef.current.value = '';
      }
    }
  }

  function handleSelectSubLib(sub: ISubLibraryDef): void {
    if (selectedSubLibKey === sub.key) {
      setSelectedSubLibKey(undefined);
      onPushColumn({ key: '__close__', label: '', content: null });
      return;
    }
    setSelectedSubLibKey(sub.key);
    onPushColumn({
      key: `${root.id}-${sub.key}`,
      label: sub.label,
      content: (
        <StorageCollectionsDetail
          rootLabel={root.label}
          subLibLabel={sub.label}
          collections={sub.collections}
          onClose={(): void => {
            setSelectedSubLibKey(undefined);
            onPushColumn({ key: '__close__', label: '', content: null });
          }}
        />
      )
    });
  }

  async function handleConfirmRemove(): Promise<void> {
    setConfirmRemove(false);
    await removeStorageRoot(root.id);
    onClose();
  }

  /**
   * Determine star state for a sub-library row.
   * - 'explicit': this root has an explicit sublibraryOverride for this sub-lib
   * - 'inherited': no override, but this root is the category-level default
   * - 'none': this root is not the default for this sub-lib
   */
  function getSubLibStarState(subLibKey: string): 'explicit' | 'inherited' | 'none' {
    const overrideRoot = targets?.sublibraryOverrides?.[subLibKey as LibraryData.SubLibraryId];
    if (overrideRoot === (root.id as Settings.StorageRootId)) {
      return 'explicit';
    }
    // Check if inherited from category default (library category only for now)
    if (
      root.categories.includes('library') &&
      targets?.libraryDefault === (root.id as Settings.StorageRootId)
    ) {
      return overrideRoot === undefined ? 'inherited' : 'none';
    }
    return 'none';
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmRemove}
        title="Remove Storage Root"
        message={`Remove "${root.label}" from this session? Collections from this directory will be unloaded and any default storage targets pointing to it will be cleared.`}
        confirmLabel="Remove"
        severity="danger"
        onConfirm={(): void => {
          handleConfirmRemove().catch(() => undefined);
        }}
        onCancel={(): void => setConfirmRemove(false)}
      />
      {/* Hidden file input for restore */}
      <input
        ref={restoreInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(e): void => {
          handleRestoreFile(e).catch(() => undefined);
        }}
      />
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-primary">{root.label}</h3>
            <p className="text-xs text-muted mt-0.5">{rootTypeLabel(root)}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {root.isMutable && rootDir && (
              <>
                <button
                  type="button"
                  onClick={(): void => {
                    handleBackup().catch(() => undefined);
                  }}
                  disabled={isBackingUp}
                  className="text-xs text-brand-accent hover:underline disabled:opacity-40"
                >
                  {isBackingUp ? 'Backing up…' : 'Backup'}
                </button>
                <button
                  type="button"
                  onClick={(): void => restoreInputRef.current?.click()}
                  disabled={isRestoring}
                  className="text-xs text-brand-accent hover:underline disabled:opacity-40"
                >
                  {isRestoring ? 'Restoring…' : 'Restore'}
                </button>
              </>
            )}
            {root.isLocal && (
              <button
                type="button"
                onClick={(): void => setConfirmRemove(true)}
                className="text-xs text-status-error-icon hover:text-status-error-strong hover:underline"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-muted hover:text-secondary text-lg leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
        {restoreMessage && (
          <p
            className={`text-xs ${
              restoreMessage.startsWith('Restore failed') || restoreMessage.startsWith('Backup failed')
                ? 'text-status-error-accent'
                : 'text-status-success-accent'
            }`}
          >
            {restoreMessage}
          </p>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <dt className="text-muted">Access</dt>
          <dd className="text-secondary font-medium">{rootAccessLabel(root)}</dd>
          <dt className="text-muted">Type</dt>
          <dd className="text-secondary">{rootTypeLabel(root)}</dd>
          <dt className="text-muted">Stores</dt>
          <dd>
            <CategoryBadges
              categories={root.categories}
              rootId={root.id}
              isMutable={root.isMutable}
              targets={targets}
              onToggleDefault={onToggleDefault}
            />
          </dd>
        </dl>

        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Sub-libraries</p>
          {subLibraries.length === 0 ? (
            <p className="text-sm text-muted italic">No sub-libraries loaded.</p>
          ) : (
            <ul className="space-y-1">
              {subLibraries.map((sub) => {
                const starState = root.isMutable ? getSubLibStarState(sub.key) : undefined;
                return (
                  <li key={sub.key}>
                    <div className="flex items-center">
                      {root.isMutable && (
                        <button
                          type="button"
                          onClick={(e): void => {
                            e.stopPropagation();
                            onToggleSublibraryOverride(sub.key);
                          }}
                          className={`mr-1 text-sm leading-none ${
                            starState === 'explicit'
                              ? 'text-star'
                              : starState === 'inherited'
                              ? 'text-star/50'
                              : 'text-faint hover:text-star'
                          }`}
                          title={
                            starState === 'explicit'
                              ? 'Explicit default (click to clear)'
                              : starState === 'inherited'
                              ? 'Inherited from category default (click to set explicit)'
                              : 'Click to set as default'
                          }
                        >
                          {starState === 'none' ? '\u2606' : '\u2605'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(): void => handleSelectSubLib(sub)}
                        className={`flex-1 flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors group ${
                          selectedSubLibKey === sub.key
                            ? 'bg-brand-accent/10 text-brand-accent'
                            : 'hover:bg-hover'
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            selectedSubLibKey === sub.key
                              ? 'text-brand-accent'
                              : 'text-primary group-hover:text-primary'
                          }`}
                        >
                          {sub.label}
                        </span>
                        <span className="flex items-center gap-3 text-xs text-muted shrink-0">
                          <span>
                            {sub.collectionCount} collection{sub.collectionCount !== 1 ? 's' : ''}
                          </span>
                          <span>
                            {sub.itemCount} item{sub.itemCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-faint">{selectedSubLibKey === sub.key ? '‹' : '›'}</span>
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// CollectionConflictsSection — shows all collection ID conflicts with repair
// ============================================================================

interface IConflictSubLibDef {
  readonly label: string;
  readonly subLib: LibraryData.SubLibraryBase<string, string, unknown>;
}

interface IConflictEntry {
  readonly subLibLabel: string;
  readonly subLib: LibraryData.SubLibraryBase<string, string, unknown>;
  readonly conflict: LibraryData.ICollectionIdConflict;
}

function buildConflictEntries(defs: ReadonlyArray<IConflictSubLibDef>): ReadonlyArray<IConflictEntry> {
  const entries: IConflictEntry[] = [];
  for (const { label, subLib } of defs) {
    for (const conflict of subLib.collectionConflicts) {
      entries.push({ subLibLabel: label, subLib, conflict });
    }
  }
  return entries;
}

function formatItemCount(count: number | undefined): string {
  if (count === undefined) return 'unknown items';
  return `${count} item${count !== 1 ? 's' : ''}`;
}

function CopyRow({
  copy,
  label,
  onRemove,
  onRename,
  onMerge,
  missingKeyName
}: {
  readonly copy: LibraryData.IConflictingCollectionCopy;
  readonly label: string;
  readonly onRemove?: () => void;
  readonly onRename?: () => void;
  readonly onMerge?: () => void;
  /** When set, the copy is encrypted and the named key is not available */
  readonly missingKeyName?: string;
}): React.ReactElement {
  return (
    <div className="space-y-0.5">
      <p className="font-medium text-muted uppercase tracking-wide text-[10px]">{label}</p>
      <p>{copy.sourceName ?? 'unknown source'}</p>
      <p>{formatItemCount(copy.itemCount)}</p>
      <p className="text-muted">
        {copy.isEncrypted ? 'encrypted' : 'loaded'} · {copy.isMutable ? 'read/write' : 'read-only'}
      </p>
      {copy.secretName && (
        <p className="text-muted font-mono truncate text-[10px]" title={copy.secretName}>
          key: {copy.secretName}
        </p>
      )}
      {missingKeyName && (
        <p className="text-xs text-status-warning-strong">
          Add key <span className="font-mono">{missingKeyName}</span> to rename or merge
        </p>
      )}
      <div className="flex flex-wrap gap-1 mt-1">
        {onRename && !missingKeyName && (
          <button
            type="button"
            onClick={onRename}
            className="text-xs px-2 py-0.5 rounded border border-border text-secondary hover:bg-hover transition-colors"
          >
            Rename
          </button>
        )}
        {onMerge && !missingKeyName && (
          <button
            type="button"
            onClick={onMerge}
            className="text-xs px-2 py-0.5 rounded border border-border text-secondary hover:bg-hover transition-colors"
          >
            Merge into active
          </button>
        )}
        {onRemove && copy.isMutable && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs px-2 py-0.5 rounded border border-status-error-border text-status-error-icon hover:bg-status-error-bg transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

interface IPendingRemove {
  readonly entry: IConflictEntry;
  /** 'active' to remove the active copy; sourceName string to remove a conflicting copy */
  readonly target: 'active' | string | undefined;
}

interface IPendingConflictRename {
  readonly entry: IConflictEntry;
  readonly sourceName: string | undefined;
  readonly newId: string;
}

interface IPendingConflictMerge {
  readonly entry: IConflictEntry;
  readonly sourceName: string | undefined;
}

function CollectionConflictsSection({
  defs,
  onRepaired
}: {
  readonly defs: ReadonlyArray<IConflictSubLibDef>;
  readonly onRepaired: () => void;
}): React.ReactElement | null {
  const workspace = useWorkspace();
  const conflicts = buildConflictEntries(defs);
  const [pendingRemove, setPendingRemove] = useState<IPendingRemove | null>(null);
  const [pendingRename, setPendingRename] = useState<IPendingConflictRename | null>(null);
  const [pendingMerge, setPendingMerge] = useState<IPendingConflictMerge | null>(null);

  if (conflicts.length === 0) return null;

  function handleRemoveConflicting(entry: IConflictEntry, sourceName: string | undefined): void {
    const result = entry.subLib.removeConflictingCopy(entry.conflict.collectionId, sourceName);
    if (result.isFailure()) {
      workspace.data.logger.error(`Failed to remove conflicting copy: ${result.message}`);
      return;
    }
    onRepaired();
  }

  function handleConfirmRemoveActive(): void {
    if (!pendingRemove) return;
    const { entry } = pendingRemove;
    const { collectionId, activeCopy } = entry.conflict;
    if (activeCopy.isEncrypted) {
      const removeResult = entry.subLib.removeProtectedCollection(collectionId);
      if (removeResult.isFailure()) {
        workspace.data.logger.error(`Failed to remove protected collection: ${removeResult.message}`);
        return;
      }
    } else {
      // Check for a protected loser that will become visible after removing the loaded winner
      const protectedCopy = entry.subLib.protectedCollections.find((pc) => pc.collectionId === collectionId);

      type CollId = Parameters<typeof entry.subLib.removeCollection>[0];
      const removeResult = entry.subLib.removeCollection(collectionId as unknown as CollId);
      if (removeResult.isFailure()) {
        workspace.data.logger.error(`Failed to remove loaded collection: ${removeResult.message}`);
        return;
      }

      // Auto-unlock the now-visible protected collection if the keystore has the key
      if (protectedCopy) {
        const ks = workspace.keyStore;
        const encConfig = ks?.getEncryptionConfig();
        if (ks && encConfig?.isSuccess() && ks.hasSecret(protectedCopy.secretName)) {
          const encryption: LibraryData.IEncryptionConfig = {
            ...encConfig.value,
            onMissingKey: 'warn'
          };
          entry.subLib
            .loadProtectedCollectionAsync(encryption, [collectionId])
            .then((loadResult) => {
              if (loadResult.isFailure()) {
                workspace.data.logger.warn(
                  `Removed active copy of '${collectionId}', but failed to auto-load protected copy: ${loadResult.message}`
                );
                return;
              }
              onRepaired();
            })
            .catch((err: unknown) => {
              workspace.data.logger.error(
                `Removed active copy of '${collectionId}', but protected auto-load threw: ${String(err)}`
              );
            });
        }
      }
    }
    setPendingRemove(null);
    onRepaired();
  }

  // Build encryption config from the workspace keystore (if unlocked)
  const encryptionConfig = (() => {
    const ks = workspace.keyStore;
    if (!ks) return undefined;
    const result = ks.getEncryptionConfig();
    return result.isSuccess() ? result.value : undefined;
  })();

  function hasKeyForSecret(secretName: string | undefined): boolean {
    if (!secretName) return false;
    const ks = workspace.keyStore;
    if (!ks) return false;
    const result = ks.hasSecret(secretName);
    return result.isSuccess() && result.value;
  }

  /**
   * Returns the missing key name if the copy is encrypted and we don't have the key,
   * or undefined if the copy can be read (either unencrypted or key available).
   */
  function getMissingKeyName(copy: LibraryData.IConflictingCollectionCopy): string | undefined {
    if (!copy.isEncrypted) return undefined;
    if (hasKeyForSecret(copy.secretName)) return undefined;
    return copy.secretName ?? 'unknown';
  }

  function handleStartRename(entry: IConflictEntry, sourceName: string | undefined): void {
    setPendingRename({
      entry,
      sourceName,
      newId: `${entry.conflict.collectionId}-2`
    });
  }

  function handleConfirmRename(): void {
    if (!pendingRename) return;
    const { entry, sourceName, newId } = pendingRename;
    const trimmed = newId.trim();
    if (!trimmed) return;

    type CollId = Parameters<typeof entry.subLib.renameConflictingCopyAsync>[2];
    entry.subLib
      .renameConflictingCopyAsync(
        entry.conflict.collectionId,
        sourceName,
        trimmed as unknown as CollId,
        encryptionConfig
      )
      .then((result) => {
        if (result.isFailure()) {
          workspace.data.logger.error(`Failed to rename conflicting copy: ${result.message}`);
        } else {
          workspace.data.logger.info(
            `Renamed conflicting copy of "${entry.conflict.collectionId}" to "${trimmed}"`
          );
        }
        setPendingRename(null);
        workspace.data.clearCache();
        onRepaired();
      })
      .catch((err: unknown) => {
        workspace.data.logger.error(`Rename failed: ${String(err)}`);
        setPendingRename(null);
      });
  }

  function handleStartMerge(entry: IConflictEntry, sourceName: string | undefined): void {
    setPendingMerge({ entry, sourceName });
  }

  function handleConfirmMerge(): void {
    if (!pendingMerge) return;
    const { entry, sourceName } = pendingMerge;

    entry.subLib
      .mergeConflictingCopyIntoActiveAsync(entry.conflict.collectionId, sourceName, 'skip', encryptionConfig)
      .then((result) => {
        if (result.isFailure()) {
          workspace.data.logger.error(`Failed to merge conflicting copy: ${result.message}`);
        } else {
          const { mergedCount, skippedCount } = result.value;
          workspace.data.logger.info(
            `Merged ${mergedCount} item(s) into active copy of "${entry.conflict.collectionId}"` +
              (skippedCount > 0 ? ` (${skippedCount} duplicate(s) skipped)` : '')
          );
        }
        setPendingMerge(null);
        workspace.data.clearCache();
        onRepaired();
      })
      .catch((err: unknown) => {
        workspace.data.logger.error(`Merge failed: ${String(err)}`);
        setPendingMerge(null);
      });
  }

  const pendingEntry = pendingRemove?.entry;
  const pendingActive = pendingEntry?.conflict.activeCopy;
  const confirmMessage = pendingEntry
    ? `Remove the ${pendingActive?.isEncrypted ? 'encrypted' : 'loaded'} copy of "${
        pendingEntry.conflict.collectionId
      }"` +
      (pendingActive?.itemCount !== undefined ? ` (${formatItemCount(pendingActive.itemCount)})` : '') +
      ` from ${pendingActive?.sourceName ?? 'unknown source'}? This cannot be undone.`
    : '';

  return (
    <>
      <ConfirmDialog
        isOpen={pendingRemove !== null}
        title="Remove Active Collection Copy"
        message={confirmMessage}
        confirmLabel="Remove"
        severity="danger"
        onConfirm={handleConfirmRemoveActive}
        onCancel={(): void => setPendingRemove(null)}
      />

      {/* Rename dialog */}
      <ConfirmDialog
        isOpen={pendingRename !== null}
        title="Rename Conflicting Copy"
        message={
          pendingRename ? (
            <div className="space-y-2">
              <p>
                Rename the conflicting copy of <strong>{pendingRename.entry.conflict.collectionId}</strong> to
                a new ID. The items will be loaded into a new collection.
              </p>
              <input
                type="text"
                value={pendingRename.newId}
                onChange={(e): void =>
                  setPendingRename((prev) => (prev ? { ...prev, newId: e.target.value } : null))
                }
                className="w-full px-3 py-1.5 text-sm font-mono border border-border rounded focus:outline-none focus:ring-1 focus:ring-focus-ring"
                placeholder="new-collection-id"
                autoFocus
              />
            </div>
          ) : (
            ''
          )
        }
        confirmLabel="Rename"
        severity="warning"
        onConfirm={handleConfirmRename}
        onCancel={(): void => setPendingRename(null)}
      />

      {/* Merge dialog */}
      <ConfirmDialog
        isOpen={pendingMerge !== null}
        title="Merge Into Active Copy"
        message={
          pendingMerge
            ? `Merge items from the conflicting copy into the active copy of "${pendingMerge.entry.conflict.collectionId}"? Duplicate items will be skipped (active copy's version kept). The conflicting copy will be deleted.`
            : ''
        }
        confirmLabel="Merge"
        severity="warning"
        onConfirm={handleConfirmMerge}
        onCancel={(): void => setPendingMerge(null)}
      />

      <div className="border border-status-warning-border bg-status-warning-bg rounded-md p-4 space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-status-warning-strong text-sm shrink-0">⚠</span>
          <div>
            <p className="text-sm font-semibold text-status-warning-strong">Collection ID Conflicts</p>
            <p className="text-xs text-status-warning-text mt-0.5">
              The following collection IDs appear in multiple storage roots. The active copy is in use; other
              copies were skipped on load. Resolve each conflict to keep your data consistent.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {conflicts.map((entry) => (
            <div
              key={`${entry.subLibLabel}-${entry.conflict.collectionId}`}
              className="bg-surface rounded border border-status-warning-border p-3 space-y-2"
            >
              <p className="text-xs font-semibold text-primary">
                {entry.subLibLabel} — <span className="font-mono">{entry.conflict.collectionId}</span>
              </p>
              <div
                className="grid gap-2 text-xs text-secondary"
                style={{
                  gridTemplateColumns: `repeat(${
                    1 + entry.conflict.conflictingCopies.length
                  }, minmax(0, 1fr))`
                }}
              >
                <CopyRow
                  copy={entry.conflict.activeCopy}
                  label="Active copy"
                  onRemove={
                    entry.conflict.activeCopy.isMutable
                      ? (): void => setPendingRemove({ entry, target: 'active' })
                      : undefined
                  }
                />
                {entry.conflict.conflictingCopies.map(
                  (copy: LibraryData.IConflictingCollectionCopy, i: number) => (
                    <CopyRow
                      key={i}
                      copy={copy}
                      label={`Conflicting copy ${entry.conflict.conflictingCopies.length > 1 ? i + 1 : ''}`}
                      missingKeyName={getMissingKeyName(copy)}
                      onRemove={
                        copy.isMutable
                          ? (): void => handleRemoveConflicting(entry, copy.sourceName)
                          : undefined
                      }
                      onRename={
                        copy.isMutable ? (): void => handleStartRename(entry, copy.sourceName) : undefined
                      }
                      onMerge={
                        copy.isMutable && entry.conflict.activeCopy.isMutable
                          ? (): void => handleStartMerge(entry, copy.sourceName)
                          : undefined
                      }
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// StorageSection — level 1: list of storage roots
// ============================================================================

export function StorageSection(props: IStorageSectionProps): React.ReactElement {
  const { onSquashColumns, onUpdateCommon, currentStorageTargets } = props;
  const reactiveWorkspace = useReactiveWorkspace();
  const workspace = useWorkspace();
  const summary = reactiveWorkspace.storageSummary;
  const entities = workspace.data.entities;
  const userEntities = workspace.userData.entities;
  const [selectedRootId, setSelectedRootId] = useState<string | undefined>(undefined);
  const [isBackingUpAll, setIsBackingUpAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | undefined>(undefined);

  function getRootDir(rootId: string): FileTree.IFileTreeDirectoryItem | undefined {
    if (rootId === 'localStorage') {
      return reactiveWorkspace.localStorageRootDir;
    }
    const additional = reactiveWorkspace.additionalRootDirs.get(rootId);
    if (additional) return additional;
    const persistent = reactiveWorkspace.persistentTrees.get(rootId);
    if (persistent) {
      const result = persistent.tree.getDirectory('/');
      return result.isSuccess() ? result.value : undefined;
    }
    return undefined;
  }

  async function handleBackupAll(): Promise<void> {
    setIsBackingUpAll(true);
    try {
      const inputs = summary.roots
        .filter((r) => r.isMutable)
        .flatMap((r) => {
          const dir = getRootDir(r.id);
          return dir ? [{ id: r.id, label: r.label, dir }] : [];
        });
      if (inputs.length === 0) return;
      const result = await backupRoots(inputs);
      if (result.isSuccess()) {
        _downloadFile(result.value, 'chocolate-lab-backup.zip', 'application/zip');
      }
    } finally {
      setIsBackingUpAll(false);
    }
  }

  async function handleExport(
    fn: () => Promise<{ value: Uint8Array } | null>,
    filename: string
  ): Promise<void> {
    setIsExporting(true);
    setExportError(undefined);
    try {
      const result = await fn();
      if (result) {
        _downloadFile(result.value, filename, 'application/zip');
      }
    } catch (e: unknown) {
      setExportError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsExporting(false);
    }
  }

  function handleExportAll(): void {
    handleExport(async () => {
      const result = await Presentation.exportAllAsMarkdown(
        workspace.data.confections.values(),
        workspace.data.fillings.values()
      );
      if (result.isFailure()) {
        setExportError(result.message);
        return null;
      }
      return result;
    }, 'recipes.zip').catch(() => undefined);
  }

  function handleExportConfections(): void {
    handleExport(async () => {
      const result = await Presentation.exportConfectionsAsMarkdown(workspace.data.confections.values());
      if (result.isFailure()) {
        setExportError(result.message);
        return null;
      }
      return result;
    }, 'confections.zip').catch(() => undefined);
  }

  function handleExportFillings(): void {
    handleExport(async () => {
      const result = await Presentation.exportFillingsAsMarkdown(workspace.data.fillings.values());
      if (result.isFailure()) {
        setExportError(result.message);
        return null;
      }
      return result;
    }, 'fillings.zip').catch(() => undefined);
  }

  const CONFLICT_SUB_LIB_DEFS: ReadonlyArray<IConflictSubLibDef> = [
    { label: 'Ingredients', subLib: entities.ingredients },
    { label: 'Fillings', subLib: entities.fillings },
    { label: 'Confections', subLib: entities.confections },
    { label: 'Decorations', subLib: entities.decorations },
    { label: 'Molds', subLib: entities.molds },
    { label: 'Procedures', subLib: entities.procedures },
    { label: 'Tasks', subLib: entities.tasks },
    { label: 'Sessions', subLib: userEntities.sessions },
    { label: 'Journals', subLib: userEntities.journals },
    { label: 'Mold Inventory', subLib: userEntities.moldInventory },
    { label: 'Ingredient Inventory', subLib: userEntities.ingredientInventory },
    { label: 'Locations', subLib: userEntities.locations }
  ];

  const SUB_LIB_DEFS: ReadonlyArray<{ key: string; label: string; lib: ISubLibWithCollections }> = [
    { key: 'ingredients', label: 'Ingredients', lib: entities.ingredients },
    { key: 'fillings', label: 'Fillings', lib: entities.fillings },
    { key: 'confections', label: 'Confections', lib: entities.confections },
    { key: 'decorations', label: 'Decorations', lib: entities.decorations },
    { key: 'molds', label: 'Molds', lib: entities.molds },
    { key: 'procedures', label: 'Procedures', lib: entities.procedures },
    { key: 'tasks', label: 'Tasks', lib: entities.tasks }
  ];

  function getSubLibrariesForRoot(root: IStorageRootSummary): ISubLibraryDef[] {
    const sn = root.sourceName;
    const result: ISubLibraryDef[] = [];
    for (const { key, label, lib } of SUB_LIB_DEFS) {
      const collections = buildCollections(lib, sn);
      if (collections.length > 0 || root.isMutable) {
        result.push({
          key,
          label,
          collectionCount: collections.length,
          itemCount: collections.reduce((sum, c) => sum + c.itemCount, 0),
          collections
        });
      }
    }
    return result;
  }

  const handleToggleCategoryDefault = useCallback(
    (rootId: string, field: 'libraryDefault' | 'userDataDefault'): void => {
      const current = currentStorageTargets?.[field];
      const typedRootId = rootId as Settings.StorageRootId;
      const newValue = current === typedRootId ? undefined : typedRootId;
      onUpdateCommon({
        defaultStorageTargets: {
          ...currentStorageTargets,
          [field]: newValue
        }
      });
    },
    [currentStorageTargets, onUpdateCommon]
  );

  const handleToggleSublibraryOverride = useCallback(
    (rootId: string, subLibKey: string): void => {
      const typedRootId = rootId as Settings.StorageRootId;
      const existing = currentStorageTargets?.sublibraryOverrides ?? {};
      const currentOverride = existing[subLibKey as LibraryData.SubLibraryId];
      const isExplicit = currentOverride === typedRootId;

      let updated: Partial<Record<string, Settings.StorageRootId>>;
      if (isExplicit) {
        // Clear explicit override → revert to category default
        updated = { ...existing };
        delete updated[subLibKey];
      } else {
        // Set explicit override for this sub-library
        updated = { ...existing, [subLibKey]: typedRootId };
      }

      onUpdateCommon({
        defaultStorageTargets: {
          ...currentStorageTargets,
          sublibraryOverrides:
            Object.keys(updated).length > 0
              ? (updated as Settings.IDefaultStorageTargets['sublibraryOverrides'])
              : undefined
        }
      });
    },
    [currentStorageTargets, onUpdateCommon]
  );

  function buildRootColumn(root: IStorageRootSummary, subLibraries: ISubLibraryDef[]): ICascadeColumn {
    const rootKey = `storage-root-${root.id}`;
    const col: ICascadeColumn = {
      key: rootKey,
      label: root.label,
      content: (
        <StorageRootDetail
          root={root}
          subLibraries={subLibraries}
          targets={currentStorageTargets}
          rootDir={getRootDir(root.id)}
          onToggleDefault={(field): void => handleToggleCategoryDefault(root.id, field)}
          onToggleSublibraryOverride={(subLibKey): void => handleToggleSublibraryOverride(root.id, subLibKey)}
          onClose={(): void => {
            setSelectedRootId(undefined);
            onSquashColumns([]);
          }}
          onPushColumn={(subCol): void => {
            if (subCol.key === '__close__') {
              onSquashColumns([buildRootColumn(root, subLibraries)]);
            } else {
              onSquashColumns([buildRootColumn(root, subLibraries), subCol]);
            }
          }}
        />
      )
    };
    return col;
  }

  function handleSelectRoot(root: IStorageRootSummary): void {
    if (selectedRootId === root.id) {
      setSelectedRootId(undefined);
      onSquashColumns([]);
      return;
    }
    setSelectedRootId(root.id);
    const subLibraries = getSubLibrariesForRoot(root);
    onSquashColumns([buildRootColumn(root, subLibraries)]);
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary mb-1">Storage</h2>
        <p className="text-xs text-muted mb-4">Active storage roots for this session.</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={(): void => {
              handleBackupAll().catch(() => undefined);
            }}
            disabled={isBackingUpAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-accent border border-brand-accent/30 rounded-md hover:bg-brand-accent/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isBackingUpAll ? 'Backing up…' : 'Backup All'}
          </button>
          <MultiActionButton
            variant="default"
            disabled={isExporting}
            primaryAction={{
              id: 'export-all',
              label: isExporting ? 'Exporting…' : 'Export All',
              onSelect: handleExportAll
            }}
            alternativeActions={[
              { id: 'export-confections', label: 'Export Confections', onSelect: handleExportConfections },
              { id: 'export-fillings', label: 'Export Fillings', onSelect: handleExportFillings }
            ]}
          />
        </div>
        {exportError !== undefined && <p className="mt-2 text-xs text-red-500">{exportError}</p>}
      </div>

      <CollectionConflictsSection
        defs={CONFLICT_SUB_LIB_DEFS}
        onRepaired={(): void => reactiveWorkspace.notifyChange()}
      />

      {summary.roots.length === 0 ? (
        <p className="text-sm text-muted italic">No storage roots active.</p>
      ) : (
        <ul className="space-y-1">
          {summary.roots.map((root) => (
            <li key={root.id}>
              <button
                type="button"
                onClick={(): void => handleSelectRoot(root)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors group ${
                  selectedRootId === root.id ? 'bg-brand-accent/10' : 'hover:bg-hover'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm font-medium truncate block ${
                      selectedRootId === root.id
                        ? 'text-brand-accent'
                        : 'text-primary group-hover:text-primary'
                    }`}
                  >
                    {root.label}
                  </span>
                  <span className="text-xs text-muted">
                    {rootTypeLabel(root)} · {rootAccessLabel(root)}
                  </span>
                  <CategoryBadges
                    categories={root.categories}
                    rootId={root.id}
                    isMutable={root.isMutable}
                    targets={currentStorageTargets}
                    onToggleDefault={(field): void => handleToggleCategoryDefault(root.id, field)}
                  />
                </div>
                <span
                  className={`flex-shrink-0 text-xs border rounded px-1.5 py-0.5 ${rootBadgeClass(root)}`}
                >
                  {rootBadgeLabel(root)}
                </span>
                <span className="text-faint text-sm shrink-0">{selectedRootId === root.id ? '‹' : '›'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <AddStorageRootButton />
    </div>
  );
}

// ============================================================================
// AddStorageRootButton — button to add a new local directory as a storage root
// ============================================================================

function AddStorageRootButton(): React.ReactElement {
  const { canAddStorageRoot, addStorageRoot } = useAddStorageRoot();

  if (!canAddStorageRoot) {
    return (
      <p className="text-xs text-muted pt-2">Local directory storage is not supported in this browser.</p>
    );
  }

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={(): Promise<void> => addStorageRoot()}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-accent border border-brand-accent/30 rounded-md hover:bg-brand-accent/5 transition-colors"
      >
        <span className="text-base leading-none">+</span>
        Add Local Directory
      </button>
      <p className="text-xs text-muted mt-1.5">
        Opens a directory picker and loads all collections from the selected folder.
      </p>
    </div>
  );
}

// ============================================================================
// Helpers for building collection lists from sub-libraries
// ============================================================================

interface ICollectionEntryRaw {
  readonly isMutable: boolean;
  readonly items: { readonly size: number };
  readonly metadata?: { readonly sourceName?: string };
}

interface ISubLibWithCollections {
  readonly collections: {
    entries(): Iterable<[string, ICollectionEntryRaw]>;
  };
}

function buildCollections(
  subLib: ISubLibWithCollections,
  sourceName: string
): ReadonlyArray<ICollectionEntry> {
  const result: ICollectionEntry[] = [];
  for (const [id, col] of subLib.collections.entries()) {
    if (col.metadata?.sourceName === sourceName) {
      result.push({ id, itemCount: col.items.size, isMutable: col.isMutable });
    }
  }
  return result;
}
