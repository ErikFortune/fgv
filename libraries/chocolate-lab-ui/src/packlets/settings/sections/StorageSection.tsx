import React, { useCallback, useState } from 'react';

import type { ICascadeColumn } from '@fgv/ts-app-shell';
import { ConfirmDialog } from '@fgv/ts-app-shell';
import { type Settings, type LibraryData } from '@fgv/ts-chocolate';

import {
  useReactiveWorkspace,
  useWorkspace,
  useAddStorageRoot,
  useRemoveStorageRoot,
  type IStorageRootSummary,
  type StorageCategory
} from '../../workspace';

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
  if (root.isLocal) return root.isMutable ? 'Local directory' : 'Local directory (read-only)';
  return 'Browser storage';
}

function rootAccessLabel(root: IStorageRootSummary): string {
  return root.isMutable ? 'Read / write' : 'Read only';
}

function rootBadgeClass(root: IStorageRootSummary): string {
  if (root.isBuiltIn) return 'bg-blue-50 text-blue-600 border-blue-200';
  if (root.isLocal) return 'bg-green-50 text-green-600 border-green-200';
  return 'bg-purple-50 text-purple-600 border-purple-200';
}

function rootBadgeLabel(root: IStorageRootSummary): string {
  if (root.isBuiltIn) return 'built-in';
  if (root.isLocal) return 'local';
  return 'browser';
}

const CATEGORY_LABELS: Record<StorageCategory, string> = {
  library: 'Library data',
  'user-data': 'User data',
  settings: 'Settings'
};

const CATEGORY_BADGE_CLASS: Record<StorageCategory, string> = {
  library: 'bg-blue-50 text-blue-600 border-blue-200',
  'user-data': 'bg-amber-50 text-amber-600 border-amber-200',
  settings: 'bg-gray-50 text-gray-500 border-gray-200'
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
                className={`leading-none ${
                  isDefault ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'
                }`}
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
          <h3 className="text-sm font-semibold text-gray-900">{subLibLabel}</h3>
          <p className="text-xs text-gray-400 mt-0.5">Collections in {rootLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-2"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      {collections.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No collections loaded.</p>
      ) : (
        <table className="w-full text-sm text-gray-700">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-200">
              <th className="text-left font-medium pb-2">Collection</th>
              <th className="text-right font-medium pb-2">Items</th>
              <th className="text-right font-medium pb-2">Access</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((col) => (
              <tr key={col.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 font-mono text-xs">{col.id}</td>
                <td className="py-2 text-right tabular-nums">{col.itemCount}</td>
                <td className="py-2 text-right">
                  <span
                    className={`text-xs border rounded px-1.5 py-0.5 ${
                      col.isMutable
                        ? 'bg-green-50 text-green-600 border-green-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
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
  readonly onToggleDefault: (field: 'libraryDefault' | 'userDataDefault') => void;
  readonly onToggleSublibraryOverride: (subLibKey: string) => void;
  readonly onPushColumn: (col: ICascadeColumn) => void;
  readonly onClose: () => void;
}

export function StorageRootDetail(props: IStorageRootDetailProps): React.ReactElement {
  const { root, subLibraries, targets, onToggleDefault, onToggleSublibraryOverride, onPushColumn, onClose } =
    props;
  const [selectedSubLibKey, setSelectedSubLibKey] = useState<string | undefined>(undefined);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const { removeStorageRoot } = useRemoveStorageRoot();

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
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{root.label}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{rootTypeLabel(root)}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {root.isLocal && (
              <button
                type="button"
                onClick={(): void => setConfirmRemove(true)}
                className="text-xs text-red-500 hover:text-red-700 hover:underline"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <dt className="text-gray-400">Access</dt>
          <dd className="text-gray-700 font-medium">{rootAccessLabel(root)}</dd>
          <dt className="text-gray-400">Type</dt>
          <dd className="text-gray-700">{rootTypeLabel(root)}</dd>
          <dt className="text-gray-400">Stores</dt>
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
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sub-libraries</p>
          {subLibraries.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No sub-libraries loaded.</p>
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
                              ? 'text-amber-500'
                              : starState === 'inherited'
                              ? 'text-amber-300/50'
                              : 'text-gray-300 hover:text-amber-400'
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
                            ? 'bg-choco-accent/10 text-choco-accent'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            selectedSubLibKey === sub.key
                              ? 'text-choco-accent'
                              : 'text-gray-800 group-hover:text-gray-900'
                          }`}
                        >
                          {sub.label}
                        </span>
                        <span className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                          <span>
                            {sub.collectionCount} collection{sub.collectionCount !== 1 ? 's' : ''}
                          </span>
                          <span>
                            {sub.itemCount} item{sub.itemCount !== 1 ? 's' : ''}
                          </span>
                          <span className="text-gray-300">{selectedSubLibKey === sub.key ? '‹' : '›'}</span>
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
// StorageSection — level 1: list of storage roots
// ============================================================================

export function StorageSection(props: IStorageSectionProps): React.ReactElement {
  const { onSquashColumns, onUpdateCommon, currentStorageTargets } = props;
  const reactiveWorkspace = useReactiveWorkspace();
  const workspace = useWorkspace();
  const summary = reactiveWorkspace.storageSummary;
  const entities = workspace.data.entities;
  const [selectedRootId, setSelectedRootId] = useState<string | undefined>(undefined);

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
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Storage</h2>
        <p className="text-xs text-gray-400 mb-4">Active storage roots for this session.</p>
      </div>

      {summary.roots.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No storage roots active.</p>
      ) : (
        <ul className="space-y-1">
          {summary.roots.map((root) => (
            <li key={root.id}>
              <button
                type="button"
                onClick={(): void => handleSelectRoot(root)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors group ${
                  selectedRootId === root.id ? 'bg-choco-accent/10' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm font-medium truncate block ${
                      selectedRootId === root.id
                        ? 'text-choco-accent'
                        : 'text-gray-800 group-hover:text-gray-900'
                    }`}
                  >
                    {root.label}
                  </span>
                  <span className="text-xs text-gray-400">
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
                <span className="text-gray-300 text-sm shrink-0">
                  {selectedRootId === root.id ? '‹' : '›'}
                </span>
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
      <p className="text-xs text-gray-400 pt-2">Local directory storage is not supported in this browser.</p>
    );
  }

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={(): Promise<void> => addStorageRoot()}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-choco-accent border border-choco-accent/30 rounded-md hover:bg-choco-accent/5 transition-colors"
      >
        <span className="text-base leading-none">+</span>
        Add Local Directory
      </button>
      <p className="text-xs text-gray-400 mt-1.5">
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
