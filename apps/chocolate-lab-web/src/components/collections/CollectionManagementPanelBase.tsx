import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  LockOpenIcon,
  DocumentPlusIcon,
  KeyIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { ProvideSecretModal, UnlockCollectionModal } from '../common';
import { useSettings } from '../../contexts/SettingsContext';
import { useSecrets } from '../../contexts/SecretsContext';
import { useChocolate, type SubLibraryType } from '../../contexts/ChocolateContext';
import type { SourceId } from '@fgv/ts-chocolate';
import type { Result } from '@fgv/ts-utils';
import type { ICreateCollectionParams, IExportParams, IImportParams } from '../../contexts/EditingContext';

export interface ICollectionInfo {
  id: SourceId;
  name: string;
  description?: string;
  secretName?: string;
  isMutable: boolean;
  isProtected: boolean;
  isLocked: boolean;
  isLoaded: boolean;
  isDirty: boolean;
  itemCount: number;
}

function RenameDialog({
  collectionId,
  info,
  onRename,
  onCancel
}: {
  collectionId: SourceId;
  info: ICollectionInfo | null;
  onRename: (name: string, description?: string, secretName?: string) => void;
  onCancel: () => void;
}): React.ReactElement {
  const [name, setName] = useState(info?.name ?? (collectionId as string));
  const [description, setDescription] = useState(info?.description ?? '');
  const [secretName, setSecretName] = useState(info?.secretName ?? '');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const nextDesc = description.trim().length > 0 ? description : undefined;
    const trimmedSecret = secretName.trim();
    const nextSecret = trimmedSecret.length > 0 ? trimmedSecret : '';
    onRename(name.trim().length > 0 ? name.trim() : (collectionId as string), nextDesc, nextSecret);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Rename {collectionId as string}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Secret Name
            </label>
            <input
              type="text"
              value={secretName}
              onChange={(e) => setSecretName(e.target.value)}
              placeholder="Optional secret name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Secret Name
            </label>
            <input
              type="text"
              value={secretName}
              onChange={(e) => setSecretName(e.target.value)}
              placeholder="Optional secret name..."
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
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-chocolate-500 focus:border-chocolate-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export interface ICollectionManagementPanelBaseProps {
  className?: string;
  toolId: string;
  collectionInfos: ReadonlyArray<ICollectionInfo>;
  createCollection: (params: ICreateCollectionParams) => Promise<Result<void>>;
  deleteCollection: (collectionId: SourceId) => Result<void>;
  renameCollection: (
    collectionId: SourceId,
    newName: string,
    newDescription?: string,
    secretName?: string
  ) => Promise<Result<void>>;
  exportCollection: (params: IExportParams) => Promise<Result<string>>;
  importCollection: (params: IImportParams) => Result<void>;
  selectedCollectionIds?: ReadonlyArray<string>;
  onToggleSelected?: (collectionId: string) => void;
  showHeader?: boolean;
  headerTitle?: string | null;
  itemLabelSingular?: string;
  itemLabelPlural?: string;
  canAddItem?: (info: ICollectionInfo) => boolean;
  onAddItem?: (collectionId: SourceId) => void;
  addItemTitle?: string;
}

type ICollectionCreateParamsWithSecret = ICreateCollectionParams & { secretName?: string };

export function CollectionManagementPanelBase({
  toolId,
  collectionInfos,
  itemLabelSingular,
  itemLabelPlural,
  addItemTitle,
  canAddItem,
  onAddItem,
  className = '',
  headerTitle,
  createCollection,
  deleteCollection,
  renameCollection,
  exportCollection,
  importCollection,
  selectedCollectionIds,
  onToggleSelected,
  showHeader = true
}: ICollectionManagementPanelBaseProps): React.ReactElement {
  const { settings, setDefaultCollection } = useSettings();
  const { getSecretKeyBase64 } = useSecrets();
  const { loadSubLibraryFromZip, loadSubLibraryFromFolder, loadLibraryFromZip } = useChocolate();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<SourceId | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState<SourceId | null>(null);
  const [showExportDialog, setShowExportDialog] = useState<SourceId | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [collectionToUnlock, setCollectionToUnlock] = useState<string | null>(null);
  const [secretToProvide, setSecretToProvide] = useState<string | null>(null);
  const [importInitialFile, setImportInitialFile] = useState<File | null>(null);

  const pendingRenameRef = useRef<{
    collectionId: SourceId;
    name: string;
    description?: string;
    secretName?: string;
  } | null>(null);
  const pendingCreateRef = useRef<ICollectionCreateParamsWithSecret | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);
  const zipLoadLibraryInputRef = useRef<HTMLInputElement>(null);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [isImportFolderLoading, setIsImportFolderLoading] = useState(false);
  const [isZipLibraryLoading, setIsZipLibraryLoading] = useState(false);

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

  const handleExport = useCallback(
    (collectionId: SourceId, format: 'yaml' | 'json') => {
      setError(null);
      void (async () => {
        const result = await exportCollection({ collectionId, format });
        if (result.isFailure()) {
          setError(result.message);
          return;
        }

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
      })();
    },
    [exportCollection]
  );

  const handleRename = useCallback(
    (collectionId: SourceId, name: string, description?: string, secretName?: string) => {
      setError(null);

      const trimmedSecret = secretName?.trim();
      if (trimmedSecret && !getSecretKeyBase64(trimmedSecret)) {
        pendingRenameRef.current = { collectionId, name, description, secretName: trimmedSecret };
        setSecretToProvide(trimmedSecret);
        return;
      }

      void (async () => {
        const result = await renameCollection(collectionId, name, description, secretName);
        if (result.isFailure()) {
          setError(result.message);
        } else {
          setShowRenameDialog(null);
        }
      })();
    },
    [getSecretKeyBase64, renameCollection]
  );

  const handleCreate = useCallback(
    (params: ICollectionCreateParamsWithSecret) => {
      setError(null);
      const trimmedSecret = params.secretName?.trim();
      if (trimmedSecret && !getSecretKeyBase64(trimmedSecret)) {
        pendingCreateRef.current = { ...params, secretName: trimmedSecret };
        setSecretToProvide(trimmedSecret);
        return;
      }

      void (async () => {
        const result = await createCollection(params);
        if (result.isFailure()) {
          setError(result.message);
        } else {
          setShowCreateDialog(false);
        }
      })();
    },
    [createCollection, getSecretKeyBase64]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {showHeader && (
        <div className={`flex items-center ${headerTitle ? 'justify-between' : 'justify-end'}`}>
          {headerTitle ? (
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{headerTitle}</h3>
          ) : null}
          <div className="flex gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".zip,application/zip,.yaml,.yml,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) {
                  return;
                }
                setError(null);

                if (file.name.toLowerCase().endsWith('.zip')) {
                  setIsImportLoading(true);
                  void (async () => {
                    const result = await loadSubLibraryFromZip(toolId as SubLibraryType, file);
                    if (result.isFailure()) {
                      setError(result.message);
                    }
                    setIsImportLoading(false);
                  })();
                  return;
                }

                setImportInitialFile(file);
                setShowImportDialog(true);
              }}
            />
            <input
              ref={zipLoadLibraryInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) {
                  return;
                }
                setError(null);
                setIsZipLibraryLoading(true);
                void (async () => {
                  const result = await loadLibraryFromZip(file);
                  if (result.isFailure()) {
                    setError(result.message);
                  }
                  setIsZipLibraryLoading(false);
                })();
              }}
            />
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={isImportLoading}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              title="Import (zip or collection file)"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsImportFolderLoading(true);
                void (async () => {
                  const result = await loadSubLibraryFromFolder(toolId as SubLibraryType);
                  if (result.isFailure()) {
                    setError(result.message);
                  }
                  setIsImportFolderLoading(false);
                })();
              }}
              disabled={isImportFolderLoading}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              title="Import from folder"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => zipLoadLibraryInputRef.current?.click()}
              disabled={isZipLibraryLoading}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              title="Load full library from zip"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
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
      )}

      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {collectionInfos.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No collections loaded</p>
        ) : (
          collectionInfos.map((info) => {
            const isDefault =
              info.isMutable &&
              !info.isLocked &&
              settings.defaultCollections?.[toolId] === (info.id as string);

            return (
              <CollectionListItem
                key={info.id}
                info={info}
                isSelected={selectedCollectionIds ? selectedCollectionIds.includes(info.id as string) : false}
                isDefault={isDefault}
                itemLabelSingular={itemLabelSingular ?? 'item'}
                itemLabelPlural={itemLabelPlural ?? 'items'}
                onToggleSelected={() => {
                  if (!onToggleSelected) {
                    return;
                  }
                  if (info.isLocked) {
                    setCollectionToUnlock(info.id as string);
                    setUnlockModalOpen(true);
                    return;
                  }
                  onToggleSelected(info.id as string);
                }}
                onSetDefault={() => {
                  if (info.isLocked || !info.isMutable) {
                    return;
                  }
                  const current = settings.defaultCollections?.[toolId] ?? null;
                  setDefaultCollection(toolId, current === (info.id as string) ? null : (info.id as string));
                }}
                onRename={() => setShowRenameDialog(info.id)}
                onDelete={() => setShowDeleteConfirm(info.id)}
                onExport={() => setShowExportDialog(info.id)}
                onAddItem={() => {
                  if (!onAddItem) {
                    return;
                  }
                  onAddItem(info.id);
                }}
                canAddItem={canAddItem ? canAddItem(info) : !!onAddItem && info.isMutable && !info.isLocked}
                addItemTitle={addItemTitle ?? ''}
              />
            );
          })
        )}
      </div>

      {showCreateDialog && (
        <CreateCollectionDialog onClose={() => setShowCreateDialog(false)} onCreate={handleCreate} />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          collectionId={showDeleteConfirm}
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}

      {showRenameDialog && (
        <RenameDialog
          collectionId={showRenameDialog}
          info={collectionInfos.find((c) => c.id === showRenameDialog) ?? null}
          onRename={(name, description, secretName) =>
            handleRename(showRenameDialog, name, description, secretName)
          }
          onCancel={() => setShowRenameDialog(null)}
        />
      )}

      {showExportDialog && (
        <ExportDialog
          collectionId={showExportDialog}
          onExport={(format) => handleExport(showExportDialog, format)}
          onCancel={() => setShowExportDialog(null)}
        />
      )}

      {showImportDialog && (
        <ImportDialog
          initialFile={importInitialFile}
          onClose={() => {
            setShowImportDialog(false);
            setImportInitialFile(null);
          }}
          onImport={(params) => {
            setError(null);
            const result = importCollection(params);
            if (result.isFailure()) {
              setError(result.message);
            } else {
              setShowImportDialog(false);
              setImportInitialFile(null);
            }
          }}
        />
      )}

      {collectionToUnlock && (
        <UnlockCollectionModal
          isOpen={unlockModalOpen}
          onClose={() => {
            setUnlockModalOpen(false);
            setCollectionToUnlock(null);
          }}
          collectionId={collectionToUnlock}
        />
      )}

      {secretToProvide && (
        <ProvideSecretModal
          isOpen={true}
          secretName={secretToProvide}
          onClose={() => setSecretToProvide(null)}
          onProvided={() => {
            const pendingRename = pendingRenameRef.current;
            if (pendingRename) {
              pendingRenameRef.current = null;
              setSecretToProvide(null);
              handleRename(
                pendingRename.collectionId,
                pendingRename.name,
                pendingRename.description,
                pendingRename.secretName
              );
              return;
            }

            const pendingCreate = pendingCreateRef.current;
            if (pendingCreate) {
              pendingCreateRef.current = null;
              setSecretToProvide(null);
              handleCreate(pendingCreate);
            }
          }}
        />
      )}
    </div>
  );
}

function CollectionListItem({
  info,
  isSelected,
  isDefault,
  itemLabelSingular,
  itemLabelPlural,
  onToggleSelected,
  onSetDefault,
  onRename,
  onDelete,
  onExport,
  canAddItem,
  onAddItem,
  addItemTitle
}: {
  info: ICollectionInfo;
  isSelected: boolean;
  isDefault: boolean;
  itemLabelSingular: string;
  itemLabelPlural: string;
  onToggleSelected: () => void;
  onSetDefault: () => void;
  onRename: () => void;
  onDelete: () => void;
  onExport: () => void;
  canAddItem: boolean;
  onAddItem: () => void;
  addItemTitle: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onToggleSelected}
      className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-colors ${
        info.isLocked
          ? 'opacity-60 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
          : isSelected
          ? 'border-chocolate-400 bg-chocolate-50 dark:border-chocolate-600 dark:bg-chocolate-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      title={info.isLocked ? `Click to unlock ${info.name}` : info.name}
    >
      <div className="flex items-center gap-2 min-w-0">
        {info.isLocked ? (
          <LockClosedIcon className="w-4 h-4 text-gray-400 flex-shrink-0" title="Locked" />
        ) : info.isMutable ? (
          <LockOpenIcon className="w-4 h-4 text-green-500 flex-shrink-0" title="Editable" />
        ) : (
          <LockClosedIcon className="w-4 h-4 text-gray-400 flex-shrink-0" title="Read-only" />
        )}

        {info.isProtected && (
          <KeyIcon
            className="w-4 h-4 flex-shrink-0 text-gray-400 dark:text-gray-500"
            title="Protected collection"
          />
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{info.name}</span>
            {info.isDirty && (
              <span className="flex-shrink-0 w-2 h-2 bg-amber-500 rounded-full" title="Unsaved changes" />
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {info.itemCount} {info.itemCount === 1 ? itemLabelSingular : itemLabelPlural}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {info.isMutable && !info.isLocked && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault();
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isDefault ? 'Default collection' : 'Set as default collection'}
          >
            {isDefault ? (
              <StarIconSolid className="w-4 h-4 text-chocolate-600 dark:text-chocolate-400" />
            ) : (
              <StarIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            )}
          </button>
        )}

        {info.isMutable && !info.isLocked && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Rename"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        )}

        {canAddItem && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddItem();
            }}
            className="p-1 text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
            title={addItemTitle}
          >
            <DocumentPlusIcon className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExport();
          }}
          disabled={!info.isLoaded || info.isLocked}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          title="Export"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
        </button>

        {info.isMutable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 hover:text-red-500"
            title="Delete collection"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </button>
  );
}

function CreateCollectionDialog({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (params: ICollectionCreateParamsWithSecret) => void;
}): React.ReactElement {
  const [collectionId, setCollectionId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [secretName, setSecretName] = useState('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onCreate({
      collectionId: collectionId as SourceId,
      name: name || collectionId,
      description: description || undefined,
      secretName: secretName.trim().length > 0 ? secretName.trim() : undefined
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Secret Name
            </label>
            <input
              type="text"
              value={secretName}
              onChange={(e) => setSecretName(e.target.value)}
              placeholder="Optional secret name..."
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

function ImportDialog({
  initialFile,
  onClose,
  onImport
}: {
  initialFile: File | null;
  onClose: () => void;
  onImport: (params: { content: string; mode: 'replace' | 'create-new'; collectionId: SourceId }) => void;
}): React.ReactElement {
  const [collectionId, setCollectionId] = useState('');
  const [mode, setMode] = useState<'create-new' | 'replace'>('create-new');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (!initialFile) {
      return;
    }

    setFileName(initialFile.name);

    const baseName = initialFile.name.replace(/\.(yaml|yml|json)$/i, '');
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
    reader.readAsText(initialFile);
  }, [collectionId, initialFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

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
