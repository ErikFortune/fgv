import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Editing,
  Entities,
  Converters as ChocolateConverters,
  type BaseProcedureId,
  type SourceId
} from '@fgv/ts-chocolate';
import { succeed, type Result } from '@fgv/ts-utils';
import { useChocolate } from '../../contexts/ChocolateContext';
import { useEditing, useProcedureCollectionManager } from '../../contexts/EditingContext';
import { CollectionManagementPanelBase, type ICollectionInfo } from './CollectionManagementPanelBase';

export interface IProcedureCollectionManagementPanelProps {
  className?: string;
  toolId?: string;
  selectedCollectionIds?: ReadonlyArray<string>;
  onToggleSelected?: (collectionId: string) => void;
  showHeader?: boolean;
  headerTitle?: string | null;
}

export function AddProcedureDialog({
  collectionId,
  onClose
}: {
  collectionId: SourceId;
  onClose: () => void;
}): React.ReactElement {
  const { runtime } = useChocolate();
  const { commitProcedureCollection } = useEditing();

  const [targetCollectionId, setTargetCollectionId] = useState<SourceId>(collectionId);

  const mutableCollectionIds = useMemo((): ReadonlyArray<SourceId> => {
    if (!runtime) {
      return [];
    }
    const ids = Array.from(runtime.library.procedures.collections.keys()) as SourceId[];
    return ids.filter((id) => {
      const result = runtime.library.procedures.collections.get(id);
      return result.isSuccess() && !!result.value && result.value.isMutable;
    });
  }, [runtime]);

  useEffect(() => {
    if (mutableCollectionIds.length === 0) {
      return;
    }

    if (!mutableCollectionIds.includes(targetCollectionId)) {
      setTargetCollectionId(mutableCollectionIds[0]);
    }
  }, [mutableCollectionIds, targetCollectionId]);

  const existingBaseIds = useMemo((): ReadonlyArray<BaseProcedureId> => {
    if (!runtime) {
      return [];
    }
    const collectionResult = runtime.library.procedures.collections.get(targetCollectionId).asResult;
    if (collectionResult.isFailure()) {
      return [];
    }
    return Array.from(collectionResult.value.items.keys()) as BaseProcedureId[];
  }, [runtime, targetCollectionId]);

  const [name, setName] = useState('');
  const [baseId, setBaseId] = useState('');
  const [isIdManuallyEdited, setIsIdManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const derivedBaseId = useMemo((): string => {
    if (isIdManuallyEdited) {
      return baseId;
    }
    if (name.trim().length === 0) {
      return '';
    }
    const deriveResult = Editing.Helpers.generateUniqueBaseIdFromName(
      name,
      existingBaseIds as unknown as string[]
    );
    return deriveResult.isSuccess() ? (deriveResult.value as string) : '';
  }, [baseId, existingBaseIds, isIdManuallyEdited, name]);

  useEffect(() => {
    if (!isIdManuallyEdited) {
      setBaseId(derivedBaseId);
    }
  }, [derivedBaseId, isIdManuallyEdited]);

  const isValid = baseId.trim().length > 0 && /^[a-z0-9-]+$/.test(baseId) && name.trim().length > 0;

  const handleSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();

      if (!runtime) {
        setSaveError('Runtime not loaded');
        return;
      }

      setIsSaving(true);
      setSaveError(null);

      const idResult = ChocolateConverters.baseProcedureId.convert(baseId);
      if (idResult.isFailure()) {
        setSaveError(`Invalid procedure ID: ${idResult.message}`);
        setIsSaving(false);
        return;
      }
      const validatedBaseId = idResult.value;

      const collectionResult = runtime.library.procedures.collections.get(targetCollectionId).asResult;
      if (collectionResult.isFailure()) {
        setSaveError(`Collection "${targetCollectionId}" not found ${collectionResult.message}`);
        setIsSaving(false);
        return;
      }
      const collectionEntry = collectionResult.value;
      if (!collectionEntry.isMutable) {
        setSaveError(`Collection "${targetCollectionId}" is not mutable`);
        setIsSaving(false);
        return;
      }
      if (collectionEntry.items.has(validatedBaseId)) {
        setSaveError(`Procedure ID "${validatedBaseId}" already exists in "${targetCollectionId}"`);
        setIsSaving(false);
        return;
      }

      const newProcedure: Record<string, unknown> = {
        baseId: validatedBaseId,
        name: name.trim(),
        steps: []
      };

      if (description.trim().length > 0) {
        newProcedure.description = description.trim();
      }

      const normalizedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      if (normalizedTags.length > 0) {
        newProcedure.tags = normalizedTags;
      }

      if (notes.trim().length > 0) {
        newProcedure.notes = notes.trim();
      }

      const validatedResult = Entities.Procedures.Converters.procedureData.convert(newProcedure);
      if (validatedResult.isFailure()) {
        setSaveError(validatedResult.message);
        setIsSaving(false);
        return;
      }

      const addResult = collectionEntry.items.validating.add(validatedBaseId, validatedResult.value).asResult;
      if (addResult.isFailure()) {
        setSaveError(addResult.message);
        setIsSaving(false);
        return;
      }

      void (async () => {
        const commitResult = await commitProcedureCollection(targetCollectionId);
        if (commitResult.isFailure()) {
          setSaveError(commitResult.message);
          setIsSaving(false);
          return;
        }

        setIsSaving(false);
        onClose();
      })();
    },
    [baseId, commitProcedureCollection, description, name, notes, onClose, runtime, tags, targetCollectionId]
  );

  if (!runtime) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Procedure</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Procedure</h3>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mb-4">
            <p className="text-sm text-red-600 dark:text-red-400">
              No editable procedure collections available. Create or import a mutable collection first.
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Procedure</h3>

        {saveError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap">{saveError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Collection
              </label>
              <select
                value={targetCollectionId as string}
                onChange={(e) => setTargetCollectionId(e.target.value as SourceId)}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                {mutableCollectionIds.map((id) => (
                  <option key={id as string} value={id as string}>
                    {id as string}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Procedure ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={baseId}
                  onChange={(e) => {
                    const next = e.target.value.toLowerCase().replace(/\s+/g, '-');
                    setBaseId(next);
                    setIsIdManuallyEdited(next.trim().length > 0);
                  }}
                  placeholder="derived-from-name"
                  disabled={isSaving}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsIdManuallyEdited(false);
                    setBaseId(derivedBaseId);
                    setSaveError(null);
                  }}
                  disabled={isSaving || derivedBaseId.length === 0}
                  title="Reset to derived value"
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isSaving}
                placeholder="comma-separated"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              className="px-4 py-2 text-sm font-medium text-white bg-chocolate-600 hover:bg-chocolate-700 rounded-md disabled:opacity-50"
            >
              Add Procedure
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProcedureCollectionManagementPanel({
  className = '',
  toolId = 'procedures',
  selectedCollectionIds,
  onToggleSelected,
  showHeader = true,
  headerTitle = toolId === 'procedures' ? 'Procedure Collections' : 'Collections'
}: IProcedureCollectionManagementPanelProps): React.ReactElement {
  const { runtime, collections } = useChocolate();
  const { dirtyCollections, editingVersion, commitProcedureCollection } = useEditing();
  const { createCollection, deleteCollection, renameCollection, exportCollection, importCollection } =
    useProcedureCollectionManager();

  const [showAddProcedure, setShowAddProcedure] = useState<SourceId | null>(null);

  const collectionInfos = useMemo((): ICollectionInfo[] => {
    if (!runtime) return [];

    const infos: ICollectionInfo[] = [];

    const ctxCollections = collections.filter((c) => c.subLibraries.includes('procedures'));
    const allIds = new Set<string>();
    for (const c of ctxCollections) {
      allIds.add(c.id);
    }
    for (const id of runtime.library.procedures.collections.keys()) {
      allIds.add(id as string);
    }

    for (const id of allIds) {
      const collectionId = id as SourceId;
      const collectionCtx = ctxCollections.find((c) => c.id === id);
      const isProtected = collectionCtx?.isProtected ?? false;
      const isUnlocked = collectionCtx?.isUnlocked ?? true;
      const isLocked = isProtected && !isUnlocked;

      const collectionResult = runtime.library.procedures.collections.get(collectionId);
      const runtimeCollection = collectionResult.isSuccess() ? collectionResult.value : undefined;
      const isLoaded = !!runtimeCollection;
      const metadata = runtimeCollection?.metadata;

      infos.push({
        id: collectionId,
        name: metadata?.name ?? collectionCtx?.name ?? collectionId,
        description: metadata?.description,
        secretName: metadata?.secretName,
        isMutable: runtimeCollection?.isMutable ?? false,
        isProtected,
        isLocked,
        isLoaded,
        isDirty: dirtyCollections.includes(collectionId),
        itemCount: runtimeCollection?.items.size ?? 0
      });
    }

    return infos.sort((a, b) => {
      if (a.isMutable !== b.isMutable) return a.isMutable ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [runtime, collections, dirtyCollections, editingVersion]);

  const saveAll = useCallback(async (): Promise<Result<void>> => {
    const visibleIds = new Set(collectionInfos.map((c) => c.id));
    for (const id of dirtyCollections) {
      if (!visibleIds.has(id)) {
        continue;
      }
      const result = await commitProcedureCollection(id);
      if (result.isFailure()) {
        return result;
      }
    }
    return succeed(undefined);
  }, [collectionInfos, commitProcedureCollection, dirtyCollections]);

  return (
    <>
      <CollectionManagementPanelBase
        className={className}
        toolId={toolId}
        collectionInfos={collectionInfos}
        createCollection={createCollection}
        deleteCollection={deleteCollection}
        renameCollection={renameCollection}
        exportCollection={exportCollection}
        importCollection={importCollection}
        saveCollection={commitProcedureCollection}
        saveAll={saveAll}
        selectedCollectionIds={selectedCollectionIds}
        onToggleSelected={onToggleSelected}
        showHeader={showHeader}
        headerTitle={headerTitle}
        itemLabelSingular="procedure"
        itemLabelPlural="procedures"
        addItemTitle="Add procedure"
        onAddItem={(collectionId) => setShowAddProcedure(collectionId)}
      />

      {showAddProcedure && (
        <AddProcedureDialog collectionId={showAddProcedure} onClose={() => setShowAddProcedure(null)} />
      )}
    </>
  );
}
