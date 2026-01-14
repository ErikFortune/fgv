/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  LockOpenIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline';
import { useChocolate } from '../../contexts/ChocolateContext';
import {
  useEditing,
  useCollectionManager,
  useIngredientEditor,
  type ICreateCollectionParams
} from '../../contexts/EditingContext';
import {
  type SourceId,
  type IngredientCategory,
  type Allergen,
  type Certification,
  allAllergens,
  allCertifications,
  allIngredientCategories,
  Converters as ChocolateConverters,
  Editing
} from '@fgv/ts-chocolate';

/**
 * Information about a collection for display
 */
interface ICollectionInfo {
  id: SourceId;
  name: string;
  description?: string;
  isMutable: boolean;
  isProtected: boolean;
  isDirty: boolean;
  itemCount: number;
}

/**
 * Props for CollectionManagementPanel
 */
export interface ICollectionManagementPanelProps {
  /** Optional class name */
  className?: string;
}

/**
 * Panel for managing ingredient collections
 */
export function CollectionManagementPanel({
  className = ''
}: ICollectionManagementPanelProps): React.ReactElement {
  const { runtime, collections } = useChocolate();
  const { dirtyCollections, editingVersion } = useEditing();
  const { createCollection, deleteCollection, exportCollection, importCollection } = useCollectionManager();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<SourceId | null>(null);
  const [showExportDialog, setShowExportDialog] = useState<SourceId | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState<SourceId | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get collection info directly from the runtime library
  // This ensures newly created collections are visible immediately
  const collectionInfos = useMemo((): ICollectionInfo[] => {
    if (!runtime) return [];

    const infos: ICollectionInfo[] = [];

    // Get all collection IDs directly from the library
    const collectionIds = Array.from(runtime.library.ingredients.collections.keys());

    for (const collectionId of collectionIds) {
      const collectionResult = runtime.library.ingredients.collections.get(collectionId);

      if (!collectionResult.isSuccess() || !collectionResult.value) {
        continue;
      }

      const collection = collectionResult.value;
      const metadata = collection.metadata;

      // Check if this collection is in the context's collection list (for protected status)
      const collectionCtx = collections.find((c) => c.id === collectionId);

      infos.push({
        id: collectionId,
        name: metadata?.name ?? collectionId,
        description: metadata?.description,
        isMutable: collection.isMutable,
        isProtected: collectionCtx?.isProtected ?? false,
        isDirty: dirtyCollections.includes(collectionId),
        itemCount: collection.items.size
      });
    }

    // Sort: mutable first, then by name
    return infos.sort((a, b) => {
      if (a.isMutable !== b.isMutable) return a.isMutable ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [runtime, collections, dirtyCollections, editingVersion]);

  // Handle delete confirmation
  const handleDelete = useCallback(
    (collectionId: SourceId) => {
      setError(null);
      const result = deleteCollection(collectionId);
      if (result.isFailure()) {
        setError(result.message);
      } else {
        setShowDeleteConfirm(null);
      }
    },
    [deleteCollection]
  );

  // Handle export
  const handleExport = useCallback(
    (collectionId: SourceId, format: 'yaml' | 'json') => {
      setError(null);
      const result = exportCollection({ collectionId, format });
      if (result.isFailure()) {
        setError(result.message);
        return;
      }

      // Create download
      const blob = new Blob([result.value], { type: format === 'yaml' ? 'text/yaml' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collectionId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setShowExportDialog(null);
    },
    [exportCollection]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Ingredient Collections</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowImportDialog(true)}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Import collection"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowCreateDialog(true)}
            className="p-1.5 text-chocolate-600 hover:text-chocolate-700 dark:text-chocolate-400 dark:hover:text-chocolate-300"
            title="Create new collection"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Collection list */}
      <div className="space-y-2">
        {collectionInfos.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No collections loaded</p>
        ) : (
          collectionInfos.map((info) => (
            <CollectionListItem
              key={info.id}
              info={info}
              onDelete={() => setShowDeleteConfirm(info.id)}
              onExport={() => setShowExportDialog(info.id)}
              onAddIngredient={() => setShowAddIngredient(info.id)}
            />
          ))
        )}
      </div>

      {/* Create Dialog */}
      {showCreateDialog && (
        <CreateCollectionDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={(params) => {
            setError(null);
            const result = createCollection(params);
            if (result.isFailure()) {
              setError(result.message);
            } else {
              setShowCreateDialog(false);
            }
          }}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          collectionId={showDeleteConfirm}
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          collectionId={showExportDialog}
          onExport={(format) => handleExport(showExportDialog, format)}
          onCancel={() => setShowExportDialog(null)}
        />
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <ImportDialog
          onClose={() => setShowImportDialog(false)}
          onImport={(params) => {
            setError(null);
            const result = importCollection(params);
            if (result.isFailure()) {
              setError(result.message);
            } else {
              setShowImportDialog(false);
            }
          }}
        />
      )}

      {/* Add Ingredient Dialog */}
      {showAddIngredient && (
        <AddIngredientDialog collectionId={showAddIngredient} onClose={() => setShowAddIngredient(null)} />
      )}
    </div>
  );
}

/**
 * Individual collection list item
 */
function CollectionListItem({
  info,
  onDelete,
  onExport,
  onAddIngredient
}: {
  info: ICollectionInfo;
  onDelete: () => void;
  onExport: () => void;
  onAddIngredient: () => void;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 min-w-0">
        {/* Mutable indicator */}
        {info.isMutable ? (
          <LockOpenIcon className="w-4 h-4 text-green-500 flex-shrink-0" title="Editable" />
        ) : (
          <LockClosedIcon className="w-4 h-4 text-gray-400 flex-shrink-0" title="Read-only" />
        )}

        {/* Collection info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{info.name}</span>
            {info.isDirty && (
              <span className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full" title="Unsaved changes" />
            )}
            {info.isProtected && (
              <span className="text-xs text-amber-600 dark:text-amber-400" title="Protected collection">
                *
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {info.itemCount} {info.itemCount === 1 ? 'ingredient' : 'ingredients'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {info.isMutable && (
          <button
            type="button"
            onClick={onAddIngredient}
            className="p-1 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
            title="Add ingredient"
          >
            <DocumentPlusIcon className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onExport}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Export"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
        </button>
        {info.isMutable && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500"
            title="Delete collection"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Dialog for creating a new collection
 */
function CreateCollectionDialog({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (params: ICreateCollectionParams) => void;
}): React.ReactElement {
  const [collectionId, setCollectionId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onCreate({
      collectionId: collectionId as SourceId,
      name: name || collectionId,
      description: description || undefined
    });
  };

  const isValid = collectionId.trim().length > 0 && /^[a-z0-9-]+$/.test(collectionId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Collection</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Collection ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value.toLowerCase())}
              placeholder="my-collection"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Collection"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Dialog for confirming collection deletion
 */
function DeleteConfirmDialog({
  collectionId,
  onConfirm,
  onCancel
}: {
  collectionId: SourceId;
  onConfirm: () => void;
  onCancel: () => void;
}): React.ReactElement {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900/20 rounded-full">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Collection?</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete <strong>{collectionId}</strong>? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Dialog for exporting a collection
 */
function ExportDialog({
  collectionId,
  onExport,
  onCancel
}: {
  collectionId: SourceId;
  onExport: (format: 'yaml' | 'json') => void;
  onCancel: () => void;
}): React.ReactElement {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Export {collectionId}</h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose export format:</p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onExport('yaml')}
            className="flex-1 px-4 py-2 text-sm font-medium text-chocolate-600 dark:text-chocolate-400 bg-chocolate-50 dark:bg-chocolate-900/20 border border-chocolate-200 dark:border-chocolate-800 rounded-md hover:bg-chocolate-100 dark:hover:bg-chocolate-900/30"
          >
            YAML
          </button>
          <button
            type="button"
            onClick={() => onExport('json')}
            className="flex-1 px-4 py-2 text-sm font-medium text-chocolate-600 dark:text-chocolate-400 bg-chocolate-50 dark:bg-chocolate-900/20 border border-chocolate-200 dark:border-chocolate-800 rounded-md hover:bg-chocolate-100 dark:hover:bg-chocolate-900/30"
          >
            JSON
          </button>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full mt-4 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Dialog for importing a collection
 */
function ImportDialog({
  onClose,
  onImport
}: {
  onClose: () => void;
  onImport: (params: { content: string; mode: 'replace' | 'create-new'; collectionId: SourceId }) => void;
}): React.ReactElement {
  const [collectionId, setCollectionId] = useState('');
  const [mode, setMode] = useState<'create-new' | 'replace'>('create-new');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Try to extract collection ID from filename
    const baseName = file.name.replace(/\.(yaml|yml|json)$/i, '');
    if (!collectionId && /^[a-z0-9-]+$/i.test(baseName)) {
      setCollectionId(baseName.toLowerCase());
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onImport({
      content,
      mode,
      collectionId: collectionId as SourceId
    });
  };

  const isValid = collectionId.trim().length > 0 && /^[a-z0-9-]+$/.test(collectionId) && content.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Import Collection</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".yaml,.yml,.json"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-chocolate-50 file:text-chocolate-600 dark:file:bg-chocolate-900/20 dark:file:text-chocolate-400 hover:file:bg-chocolate-100 dark:hover:file:bg-chocolate-900/30"
            />
            {fileName && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Selected: {fileName}</p>
            )}
          </div>

          {/* Collection ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Collection ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value.toLowerCase())}
              placeholder="my-collection"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500"
            />
          </div>

          {/* Import mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Import Mode
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="create-new"
                  checked={mode === 'create-new'}
                  onChange={() => setMode('create-new')}
                  className="text-chocolate-600 focus:ring-chocolate-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Create new collection</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mode"
                  value="replace"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                  className="text-chocolate-600 focus:ring-chocolate-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Replace existing collection</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Category options for select field
 */
const categoryOptions = allIngredientCategories.map((cat) => ({
  value: cat,
  label: cat.charAt(0).toUpperCase() + cat.slice(1)
}));

/**
 * Ganache field type - stores string for form, empty string means undefined/unknown
 */
type GanacheFields = {
  cacaoFat: string;
  sugar: string;
  milkFat: string;
  water: string;
  solids: string;
  otherFats: string;
};

/**
 * Default ganache characteristics by category (as strings for form input)
 * Empty string means "unknown" - will be sent as 0 to the API
 */
function getDefaultGanacheCharacteristics(category: IngredientCategory): GanacheFields {
  switch (category) {
    case 'chocolate':
      return { cacaoFat: '35', sugar: '30', milkFat: '0', water: '0', solids: '35', otherFats: '0' };
    case 'sugar':
      return { cacaoFat: '0', sugar: '100', milkFat: '0', water: '0', solids: '0', otherFats: '0' };
    case 'dairy':
      return { cacaoFat: '0', sugar: '0', milkFat: '35', water: '60', solids: '5', otherFats: '0' };
    case 'fat':
      return { cacaoFat: '0', sugar: '0', milkFat: '0', water: '0', solids: '0', otherFats: '100' };
    case 'liquid':
      return { cacaoFat: '0', sugar: '0', milkFat: '0', water: '100', solids: '0', otherFats: '0' };
    case 'alcohol':
      return { cacaoFat: '0', sugar: '15', milkFat: '0', water: '60', solids: '0', otherFats: '0' };
    case 'flavor':
      return { cacaoFat: '0', sugar: '0', milkFat: '0', water: '0', solids: '100', otherFats: '0' };
    default:
      // Empty strings = unknown
      return { cacaoFat: '', sugar: '', milkFat: '', water: '', solids: '', otherFats: '' };
  }
}

/**
 * Convert ganache form fields to API format
 * Empty string becomes 0 (API requires all fields)
 */
function ganacheToApi(fields: GanacheFields): {
  cacaoFat: number;
  sugar: number;
  milkFat: number;
  water: number;
  solids: number;
  otherFats: number;
} {
  const toNum = (s: string): number => (s === '' ? 0 : parseFloat(s) || 0);
  return {
    cacaoFat: toNum(fields.cacaoFat),
    sugar: toNum(fields.sugar),
    milkFat: toNum(fields.milkFat),
    water: toNum(fields.water),
    solids: toNum(fields.solids),
    otherFats: toNum(fields.otherFats)
  };
}

/**
 * Calculate total of ganache fields (for display)
 */
function ganacheTotal(fields: GanacheFields): number {
  const api = ganacheToApi(fields);
  return api.cacaoFat + api.sugar + api.milkFat + api.water + api.solids + api.otherFats;
}

/**
 * Dialog for adding a new ingredient to a collection
 */
export function AddIngredientDialog({
  collectionId,
  onClose
}: {
  collectionId: SourceId;
  onClose: () => void;
}): React.ReactElement {
  const { runtime } = useChocolate();
  const { markDirty, commitCollection } = useEditing();

  const [targetCollectionId, setTargetCollectionId] = useState<SourceId>(collectionId);
  const { editor, error: editorError } = useIngredientEditor(targetCollectionId);

  const mutableCollectionIds = useMemo((): ReadonlyArray<SourceId> => {
    if (!runtime) {
      return [];
    }

    const ids = Array.from(runtime.library.ingredients.collections.keys()) as SourceId[];
    return ids.filter((id) => {
      const result = runtime.library.ingredients.collections.get(id);
      return result.isSuccess() && !!result.value && result.value.isMutable;
    });
  }, [runtime]);

  useEffect(() => {
    if (mutableCollectionIds.length === 0) {
      return;
    }

    // Ensure we never point at an immutable collection (which would cause editor load failures)
    if (!mutableCollectionIds.includes(targetCollectionId)) {
      setTargetCollectionId(mutableCollectionIds[0]);
    }
  }, [mutableCollectionIds, targetCollectionId]);

  // Basic info
  const [ingredientId, setIngredientId] = useState('');
  const [isIdManuallyEdited, setIsIdManuallyEdited] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('other');
  const [description, setDescription] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [density, setDensity] = useState('');

  const [tags, setTags] = useState('');
  const [vegan, setVegan] = useState(false);
  const [certifications, setCertifications] = useState<ReadonlyArray<Certification>>([]);
  const [allergens, setAllergens] = useState<ReadonlyArray<Allergen>>([]);
  const [traceAllergens, setTraceAllergens] = useState<ReadonlyArray<Allergen>>([]);

  const [urls, setUrls] = useState<ReadonlyArray<{ category: string; url: string }>>([]);

  // Ganache characteristics (required for all ingredients)
  const [ganache, setGanache] = useState(() => getDefaultGanacheCharacteristics('other'));

  // Category-specific fields
  const [alcoholByVolume, setAlcoholByVolume] = useState('');
  const [flavorProfile, setFlavorProfile] = useState('');
  const [fatContent, setFatContent] = useState('');
  const [waterContent, setWaterContent] = useState('');
  const [meltingPoint, setMeltingPoint] = useState('');
  const [hydrationNumber, setHydrationNumber] = useState('');
  const [sweetnessPotency, setSweetnessPotency] = useState('');

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCommonAdvanced, setShowCommonAdvanced] = useState(false);

  // Update ganache defaults when category changes
  const handleCategoryChange = (newCategory: IngredientCategory): void => {
    setCategory(newCategory);
    setGanache(getDefaultGanacheCharacteristics(newCategory));
  };

  const updateGanache = (field: keyof typeof ganache, value: string): void => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setGanache((prev) => ({ ...prev, [field]: isNaN(numValue) ? 0 : numValue }));
  };

  const existingBaseIds = useMemo((): ReadonlyArray<string> => {
    if (!runtime) {
      return [];
    }

    const collectionResult = runtime.library.ingredients.collections.get(targetCollectionId);
    if (!collectionResult.isSuccess() || !collectionResult.value) {
      return [];
    }

    return Array.from(collectionResult.value.items.keys());
  }, [runtime, targetCollectionId]);

  const derivedBaseId = useMemo((): string => {
    if (name.trim().length === 0) {
      return '';
    }
    const deriveResult = Editing.Helpers.generateUniqueBaseIdFromName(name, existingBaseIds);
    return deriveResult.isSuccess() ? deriveResult.value : '';
  }, [existingBaseIds, name]);

  useEffect(() => {
    if (isIdManuallyEdited) {
      return;
    }

    setIngredientId(derivedBaseId);
  }, [derivedBaseId, isIdManuallyEdited]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (!editor) {
      setSaveError('Editor not available');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    // Validate ingredient ID format
    const idResult = ChocolateConverters.baseIngredientId.convert(ingredientId);
    if (idResult.isFailure()) {
      setSaveError(`Invalid ingredient ID: ${idResult.message}`);
      setIsSaving(false);
      return;
    }

    const baseId = idResult.value;

    // Build the ingredient object with all required fields
    const newIngredient: Record<string, unknown> = {
      baseId, // Required: include in entity data
      name: name.trim(),
      category,
      ganacheCharacteristics: ganacheToApi(ganache), // Required for all ingredients - convert strings to numbers
      description: description.trim() || undefined,
      manufacturer: manufacturer.trim() || undefined,
      density: density && parseFloat(density) >= 0.1 ? parseFloat(density) : undefined
    };

    const normalizedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (normalizedTags.length > 0) {
      newIngredient.tags = normalizedTags;
    }

    if (vegan) {
      newIngredient.vegan = true;
    }

    if (certifications.length > 0) {
      newIngredient.certifications = certifications;
    }

    if (allergens.length > 0) {
      newIngredient.allergens = allergens;
    }

    if (traceAllergens.length > 0) {
      newIngredient.traceAllergens = traceAllergens;
    }

    const normalizedUrls = urls
      .map((u) => ({ category: u.category.trim(), url: u.url.trim() }))
      .filter((u) => u.category.length > 0 && u.url.length > 0);
    if (normalizedUrls.length > 0) {
      newIngredient.urls = normalizedUrls;
    }

    // Add category-specific fields
    switch (category) {
      case 'alcohol':
        if (alcoholByVolume) newIngredient.alcoholByVolume = parseFloat(alcoholByVolume);
        if (flavorProfile.trim()) newIngredient.flavorProfile = flavorProfile.trim();
        break;
      case 'dairy':
        if (fatContent) newIngredient.fatContent = parseFloat(fatContent);
        if (waterContent) newIngredient.waterContent = parseFloat(waterContent);
        break;
      case 'fat':
        if (meltingPoint) newIngredient.meltingPoint = parseFloat(meltingPoint);
        break;
      case 'sugar':
        if (hydrationNumber) newIngredient.hydrationNumber = parseFloat(hydrationNumber);
        if (sweetnessPotency) newIngredient.sweetnessPotency = parseFloat(sweetnessPotency);
        break;
    }

    // Use the validating accessor to create the ingredient
    const result = editor.validating.create(baseId, newIngredient);

    if (result.isFailure()) {
      setSaveError(result.message);
      setIsSaving(false);
      return;
    }

    markDirty(targetCollectionId);

    const commitResult = commitCollection(targetCollectionId);
    if (commitResult.isFailure()) {
      setSaveError(commitResult.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onClose();
  };

  const ganacheTotalValue = ganacheTotal(ganache);
  const isValid =
    ingredientId.trim().length > 0 &&
    /^[a-z0-9-]+$/.test(ingredientId) &&
    name.trim().length > 0 &&
    name.trim().length <= 200 &&
    ganacheTotalValue >= 0 &&
    ganacheTotalValue <= 100;

  if (!runtime) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Ingredient</h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">Runtime not loaded</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (mutableCollectionIds.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Ingredient</h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              No editable ingredient collections available. Create or import a mutable collection first.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (editorError) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Ingredient</h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">Failed to load editor: {editorError}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Ingredient</h3>

        {saveError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{saveError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Basic Info
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Collection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Collection <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetCollectionId}
                  onChange={(e) => {
                    setTargetCollectionId(e.target.value as SourceId);
                    setSaveError(null);
                  }}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                >
                  {mutableCollectionIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as IngredientCategory)}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Ingredient"
                maxLength={200}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
              />
            </div>

            {/* Ingredient ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ingredient ID <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ingredientId}
                  onChange={(e) => {
                    const next = e.target.value.toLowerCase().replace(/\s+/g, '-');
                    setIngredientId(next);
                    setIsIdManuallyEdited(next.trim().length > 0);
                  }}
                  placeholder="derived-from-name"
                  disabled={isSaving}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsIdManuallyEdited(false);
                    setIngredientId(derivedBaseId);
                    setSaveError(null);
                  }}
                  disabled={isSaving || derivedBaseId.length === 0}
                  title="Reset to derived value"
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  X
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowCommonAdvanced(!showCommonAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200"
              >
                <span>{showCommonAdvanced ? '▼' : '▶'}</span>
                Additional Properties
              </button>

              {showCommonAdvanced && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        value={manufacturer}
                        onChange={(e) => setManufacturer(e.target.value)}
                        placeholder="Optional"
                        maxLength={200}
                        disabled={isSaving}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Density (g/mL)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={density}
                          onChange={(e) => setDensity(e.target.value)}
                          placeholder="0.1 - 5.0"
                          min="0.1"
                          max="5.0"
                          step="0.01"
                          disabled={isSaving}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                        />
                        {density && (
                          <button
                            type="button"
                            onClick={() => setDensity('')}
                            disabled={isSaving}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title="Clear"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Additional Tags
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="comma-separated"
                      disabled={isSaving}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={vegan}
                      onChange={(e) => setVegan(e.target.checked)}
                      disabled={isSaving}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-chocolate-600 focus:ring-chocolate-500"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Vegan</label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Certifications
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        {allCertifications.map((c) => (
                          <label
                            key={c}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <input
                              type="checkbox"
                              checked={certifications.includes(c)}
                              onChange={() =>
                                setCertifications((prev) =>
                                  prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                                )
                              }
                              disabled={isSaving}
                              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-chocolate-600 focus:ring-chocolate-500"
                            />
                            <span className="truncate" title={c}>
                              {c}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Allergens
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        {allAllergens.map((a) => (
                          <label
                            key={a}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <input
                              type="checkbox"
                              checked={allergens.includes(a)}
                              onChange={() =>
                                setAllergens((prev) =>
                                  prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                                )
                              }
                              disabled={isSaving}
                              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-chocolate-600 focus:ring-chocolate-500"
                            />
                            <span className="truncate" title={a}>
                              {a}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Trace Allergens
                    </h5>
                    <div className="grid grid-cols-3 gap-2">
                      {allAllergens.map((a) => (
                        <label
                          key={a}
                          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <input
                            type="checkbox"
                            checked={traceAllergens.includes(a)}
                            onChange={() =>
                              setTraceAllergens((prev) =>
                                prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                              )
                            }
                            disabled={isSaving}
                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-chocolate-600 focus:ring-chocolate-500"
                          />
                          <span className="truncate" title={a}>
                            {a}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        URLs
                      </h5>
                      <button
                        type="button"
                        onClick={() => setUrls((prev) => [...prev, { category: '', url: '' }])}
                        disabled={isSaving}
                        className="text-xs font-medium text-chocolate-600 dark:text-chocolate-400 hover:underline disabled:opacity-50"
                      >
                        Add URL
                      </button>
                    </div>

                    {urls.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No URLs</p>
                    ) : (
                      <div className="space-y-2">
                        {urls.map((row, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              value={row.category}
                              onChange={(e) => {
                                const next = e.target.value;
                                setUrls((prev) =>
                                  prev.map((u, i) => (i === idx ? { ...u, category: next } : u))
                                );
                              }}
                              placeholder="category (e.g., manufacturer)"
                              disabled={isSaving}
                              className="col-span-4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                            />
                            <input
                              type="url"
                              value={row.url}
                              onChange={(e) => {
                                const next = e.target.value;
                                setUrls((prev) => prev.map((u, i) => (i === idx ? { ...u, url: next } : u)));
                              }}
                              placeholder="https://..."
                              disabled={isSaving}
                              className="col-span-7 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setUrls((prev) => prev.filter((_, i) => i !== idx))}
                              disabled={isSaving}
                              className="col-span-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
                              title="Remove"
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category-Specific Fields */}
          {category === 'alcohol' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Alcohol Properties
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ABV (%)
                  </label>
                  <input
                    type="number"
                    value={alcoholByVolume}
                    onChange={(e) => setAlcoholByVolume(e.target.value)}
                    placeholder="0-100"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Flavor Profile
                  </label>
                  <input
                    type="text"
                    value={flavorProfile}
                    onChange={(e) => setFlavorProfile(e.target.value)}
                    placeholder="e.g., Cream liqueur"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'dairy' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Dairy Properties
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fat Content (%)
                  </label>
                  <input
                    type="number"
                    value={fatContent}
                    onChange={(e) => setFatContent(e.target.value)}
                    placeholder="0-100"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Water Content (%)
                  </label>
                  <input
                    type="number"
                    value={waterContent}
                    onChange={(e) => setWaterContent(e.target.value)}
                    placeholder="0-100"
                    min="0"
                    max="100"
                    step="0.1"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'fat' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Fat Properties
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Melting Point (C)
                </label>
                <input
                  type="number"
                  value={meltingPoint}
                  onChange={(e) => setMeltingPoint(e.target.value)}
                  placeholder="Temperature in Celsius"
                  min="-40"
                  max="100"
                  step="0.1"
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                />
              </div>
            </div>
          )}

          {category === 'sugar' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Sugar Properties
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hydration Number
                  </label>
                  <input
                    type="number"
                    value={hydrationNumber}
                    onChange={(e) => setHydrationNumber(e.target.value)}
                    placeholder="Water molecules per sugar"
                    min="0"
                    step="0.1"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sweetness Potency
                  </label>
                  <input
                    type="number"
                    value={sweetnessPotency}
                    onChange={(e) => setSweetnessPotency(e.target.value)}
                    placeholder="1.0 = sucrose"
                    min="0"
                    step="0.1"
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500 disabled:opacity-50 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ganache Characteristics (Collapsible) */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-200"
            >
              <span>{showAdvanced ? '▼' : '▶'}</span>
              Ganache Characteristics
              <span className="normal-case text-xs font-normal">(for recipe calculations)</span>
            </button>

            {showAdvanced && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  These percentages define how the ingredient affects ganache calculations. Total should
                  ideally equal 100%.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Cacao Fat (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.cacaoFat}
                      onChange={(e) => updateGanache('cacaoFat', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Sugar (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.sugar}
                      onChange={(e) => updateGanache('sugar', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Milk Fat (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.milkFat}
                      onChange={(e) => updateGanache('milkFat', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Water (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.water}
                      onChange={(e) => updateGanache('water', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Solids (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.solids}
                      onChange={(e) => updateGanache('solids', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Other Fats (%)
                    </label>
                    <input
                      type="number"
                      value={ganache.otherFats}
                      onChange={(e) => updateGanache('otherFats', e.target.value)}
                      min="0"
                      max="100"
                      step="0.1"
                      disabled={isSaving}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                </div>
                <div
                  className={`text-xs ${
                    ganacheTotalValue >= 90 && ganacheTotalValue <= 110
                      ? 'text-green-600 dark:text-green-400'
                      : ganacheTotalValue >= 80 && ganacheTotalValue <= 120
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  Total: {ganacheTotalValue.toFixed(1)}%
                  {ganacheTotalValue < 90 || ganacheTotalValue > 110
                    ? ' (should be close to 100%)'
                    : ganacheTotalValue >= 90 && ganacheTotalValue <= 110
                    ? ' ✓'
                    : ' (acceptable range: 80-120%)'}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Adding...' : 'Add Ingredient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
