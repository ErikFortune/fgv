import React, { useState } from 'react';

import type { ICascadeColumn } from '@fgv/ts-app-shell';

import { useReactiveWorkspace, useWorkspace, type IStorageRootSummary } from '../../workspace';

// ============================================================================
// Types
// ============================================================================

export interface IStorageSectionProps {
  readonly onSquashColumns: (cols: ReadonlyArray<ICascadeColumn>) => void;
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
  readonly onPushColumn: (col: ICascadeColumn) => void;
  readonly onClose: () => void;
}

export function StorageRootDetail(props: IStorageRootDetailProps): React.ReactElement {
  const { root, subLibraries, onPushColumn, onClose } = props;
  const [selectedSubLibKey, setSelectedSubLibKey] = useState<string | undefined>(undefined);

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

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{root.label}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{rootTypeLabel(root)}</p>
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

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <dt className="text-gray-400">Access</dt>
        <dd className="text-gray-700 font-medium">{rootAccessLabel(root)}</dd>
        <dt className="text-gray-400">Type</dt>
        <dd className="text-gray-700">{rootTypeLabel(root)}</dd>
      </dl>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sub-libraries</p>
        {subLibraries.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No sub-libraries loaded.</p>
        ) : (
          <ul className="space-y-1">
            {subLibraries.map((sub) => (
              <li key={sub.key}>
                <button
                  type="button"
                  onClick={(): void => handleSelectSubLib(sub)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors group ${
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// StorageSection — level 1: list of storage roots
// ============================================================================

export function StorageSection(props: IStorageSectionProps): React.ReactElement {
  const { onSquashColumns } = props;
  const reactiveWorkspace = useReactiveWorkspace();
  const workspace = useWorkspace();
  const summary = reactiveWorkspace.storageSummary;
  const entities = workspace.data.entities;
  const [selectedRootId, setSelectedRootId] = useState<string | undefined>(undefined);

  function getSubLibrariesForRoot(root: IStorageRootSummary): ISubLibraryDef[] {
    const allSubLibs: ISubLibraryDef[] = [
      {
        key: 'ingredients',
        label: 'Ingredients',
        collectionCount: entities.ingredients.collectionCount,
        itemCount: entities.ingredients.size,
        collections: buildCollections(entities.ingredients)
      },
      {
        key: 'fillings',
        label: 'Fillings',
        collectionCount: entities.fillings.collectionCount,
        itemCount: entities.fillings.size,
        collections: buildCollections(entities.fillings)
      },
      {
        key: 'confections',
        label: 'Confections',
        collectionCount: entities.confections.collectionCount,
        itemCount: entities.confections.size,
        collections: buildCollections(entities.confections)
      },
      {
        key: 'decorations',
        label: 'Decorations',
        collectionCount: entities.decorations.collectionCount,
        itemCount: entities.decorations.size,
        collections: buildCollections(entities.decorations)
      },
      {
        key: 'molds',
        label: 'Molds',
        collectionCount: entities.molds.collectionCount,
        itemCount: entities.molds.size,
        collections: buildCollections(entities.molds)
      },
      {
        key: 'procedures',
        label: 'Procedures',
        collectionCount: entities.procedures.collectionCount,
        itemCount: entities.procedures.size,
        collections: buildCollections(entities.procedures)
      },
      {
        key: 'tasks',
        label: 'Tasks',
        collectionCount: entities.tasks.collectionCount,
        itemCount: entities.tasks.size,
        collections: buildCollections(entities.tasks)
      }
    ];

    if (root.isBuiltIn) {
      return allSubLibs.filter((s) => s.collectionCount > 0);
    }
    return allSubLibs.filter((s) => s.collectionCount > 0);
  }

  function buildRootColumn(root: IStorageRootSummary, subLibraries: ISubLibraryDef[]): ICascadeColumn {
    const rootKey = `storage-root-${root.id}`;
    const col: ICascadeColumn = {
      key: rootKey,
      label: root.label,
      content: (
        <StorageRootDetail
          root={root}
          subLibraries={subLibraries}
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

      <p className="text-xs text-gray-400 pt-2">Use the sidebar directory picker to add local directories.</p>
    </div>
  );
}

// ============================================================================
// Helpers for building collection lists from sub-libraries
// ============================================================================

interface ISubLibWithCollections {
  readonly collections: {
    entries(): Iterable<[string, { readonly isMutable: boolean; readonly items: { readonly size: number } }]>;
  };
}

function buildCollections(subLib: ISubLibWithCollections): ReadonlyArray<ICollectionEntry> {
  const result: ICollectionEntry[] = [];
  for (const [id, col] of subLib.collections.entries()) {
    result.push({ id, itemCount: col.items.size, isMutable: col.isMutable });
  }
  return result;
}
