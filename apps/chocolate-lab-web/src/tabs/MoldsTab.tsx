import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CursorArrowRaysIcon } from '@heroicons/react/20/solid';
import {
  ConfirmDialog,
  EntityList,
  type ICascadeColumn,
  EntityTabLayout,
  type IComparisonColumn
} from '@fgv/ts-app-shell';
import { AiAssist, Editing, Entities, LibraryRuntime } from '@fgv/ts-chocolate';
import type { BaseMoldId, CollectionId, MoldId } from '@fgv/ts-chocolate';
import type { ResultMapValueType } from '@fgv/ts-utils';
import {
  isMoldCascadeEntry,
  CASCADE_NEW_ENTITY_ID,
  type IReferenceScanResult,
  useTabNavigation,
  useCascadeOps,
  useEntityList,
  useMutableCollection,
  useCanDeleteFromCollections,
  useEntityActions,
  createSetInMutableCollection,
  type MutableCollectionEntryWithSet,
  useEntityMutation,
  useClipboardJsonImport,
  MoldDetail,
  MoldEditView,
  EntityCreateForm,
  getWritableCollectionOptions,
  useFilteredEntities,
  useNavigationStore,
  ReadOnlyEditGate
} from '@fgv/chocolate-lab-ui';

import { MOLD_DESCRIPTOR, MOLD_FILTER_SPEC, slugify, createBlankMoldEntity } from '../shared';

export function MoldsTabContent(): React.ReactElement {
  const {
    workspace,
    reactiveWorkspace,
    popCascadeTo,
    listCollapsed,
    collapseList,
    compareMode,
    compareIds,
    toggleCompareMode,
    toggleCompareId,
    showingComparison,
    startComparison,
    exitComparison
  } = useTabNavigation();
  const cascade = useCascadeOps();

  type MoldCollectionEntry = ResultMapValueType<typeof workspace.data.entities.molds.collections>;
  type MoldMutableCollectionEntry = MutableCollectionEntryWithSet<
    MoldCollectionEntry,
    BaseMoldId,
    Entities.Molds.IMoldEntity
  >;

  const editingRef = useRef<{ id: MoldId; wrapper: LibraryRuntime.EditedMold } | undefined>(undefined);
  const [moldToDelete, setMoldToDelete] = useState<{
    id: MoldId;
    name: string;
    references: IReferenceScanResult;
  } | null>(null);
  const entityActions = useEntityActions();
  const updateCascadeEntryChanges = useNavigationStore((s) => s.updateCascadeEntryChanges);

  const mutableCollectionId = useMutableCollection(
    workspace.data.entities.molds.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.molds
  );

  const writableMoldCollections = useMemo(
    (): ReadonlyArray<{ id: string; label?: string }> =>
      getWritableCollectionOptions(
        workspace.data.entities.molds.collections.entries(),
        workspace.settings?.getResolvedSettings().defaultTargets.molds
      ),
    [workspace, reactiveWorkspace.version]
  );

  const canDeleteMold = useCanDeleteFromCollections(workspace.data.entities.molds.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  const moldMutation = useEntityMutation<Entities.Molds.IMoldEntity, BaseMoldId, MoldId>({
    setInMutableCollection: createSetInMutableCollection<
      Entities.Molds.IMoldEntity,
      BaseMoldId,
      MoldCollectionEntry,
      MoldMutableCollectionEntry
    >({
      getCollection: (collectionId: CollectionId) =>
        workspace.data.entities.molds.collections.get(collectionId),
      isMutable: (entry: MoldCollectionEntry): entry is MoldMutableCollectionEntry =>
        entry.isMutable && 'set' in entry.items,
      setEntity: (
        entry: MoldMutableCollectionEntry,
        baseId: BaseMoldId,
        entity: Entities.Molds.IMoldEntity
      ) => entry.items.set(baseId, entity),
      entityLabel: 'mold'
    }),
    entityLabel: 'mold',
    getPersistedCollection: (collectionId: CollectionId) =>
      workspace.data.entities.getPersistedMoldsCollection(collectionId)
  });

  const handleCreateMold = useCallback(
    async (
      entity: Entities.Molds.IMoldEntity,
      source: 'manual' | 'ai',
      targetCollectionId?: string
    ): Promise<void> => {
      const baseId = entity.baseId as BaseMoldId;
      const createResult = await moldMutation.createEntity({
        targetCollectionId: targetCollectionId as CollectionId | undefined,
        defaultCollectionId: mutableCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseMoldId) =>
          `${collectionId}.${nextBaseId}` as MoldId,
        baseId,
        entity,
        exists: (id: MoldId) => workspace.data.molds.get(id).isSuccess(),
        persistToDisk: false
      });
      if (createResult.isFailure()) {
        return;
      }

      const compositeId = createResult.value;

      const wrapperResult = LibraryRuntime.EditedMold.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing wrapper: ${wrapperResult.message}`);
        return;
      }
      editingRef.current = { id: compositeId, wrapper: wrapperResult.value };

      if (source === 'ai') {
        workspace.data.logger.info(
          `Created mold '${entity.manufacturer} ${entity.productNumber}' from AI-generated data`
        );
      }

      cascade.select({
        entityType: 'mold',
        entityId: compositeId,
        mode: 'edit',
        hasChanges: true,
        entity: workspace.data.molds.get(compositeId).report(workspace.data.logger).orDefault()
      });
    },
    [workspace, mutableCollectionId, moldMutation, cascade]
  );

  const handleListHeaderPaste = useClipboardJsonImport<Entities.Molds.IMoldEntity>({
    entityLabel: 'mold',
    convert: (from: unknown) => Entities.Molds.Converters.moldEntity.convert(from),
    onValid: (entity: Entities.Molds.IMoldEntity) => handleCreateMold(entity, 'ai'),
    onValidSuccessMessage: (entity: Entities.Molds.IMoldEntity) =>
      `Opened '${entity.manufacturer} ${entity.productNumber}' for review — save when ready`
  });

  const { entities: molds, selectedId } = useEntityList<LibraryRuntime.IMold, MoldId>({
    getAll: () => workspace.data.molds.values(),
    compare: (a, b) => a.id.localeCompare(b.id),
    entityType: 'mold',
    cascadeStack: cascade.stack,
    deps: [workspace, reactiveWorkspace.version]
  });

  const moldCreateSourceOptions = useMemo(
    (): ReadonlyArray<{ id: string; name: string }> =>
      molds.map((mold) => ({
        id: mold.id,
        name: mold.displayName
      })),
    [molds]
  );

  const handleCreateMoldFromSource = useCallback(
    (params: {
      mode: 'copy' | 'derive';
      sourceId: string;
      name: string;
      id: string;
      targetCollectionId?: string;
    }): void => {
      const sourceResult = workspace.data.molds.get(params.sourceId as MoldId);
      if (sourceResult.isFailure()) {
        workspace.data.logger.error(`Cannot copy mold '${params.sourceId}': not found`);
        return;
      }

      const source = sourceResult.value.entity;
      const nextEntity: Entities.Molds.IMoldEntity = {
        ...source,
        baseId: params.id as BaseMoldId,
        manufacturer: params.name as typeof source.manufacturer
      };

      void handleCreateMold(nextEntity, 'manual', params.targetCollectionId);
    },
    [workspace, handleCreateMold]
  );

  const handleSelect = useCallback(
    (id: MoldId): void => {
      cascade.select({
        entityType: 'mold',
        entityId: id,
        entity: workspace.data.molds.get(id).report(workspace.data.logger).orDefault()
      });
    },
    [cascade, workspace]
  );

  const handleRequestDelete = useCallback(
    (id: MoldId): void => {
      const result = workspace.data.molds.get(id);
      const name = result.isSuccess() ? result.value.displayName : id;
      const references = entityActions.scanReferences(id);
      setMoldToDelete({ id, name, references });
    },
    [workspace, entityActions]
  );

  const handleConfirmDelete = useCallback((): void => {
    if (moldToDelete) {
      entityActions.deleteEntity(moldToDelete.id).catch((err) => {
        workspace.data.logger.error(`Failed to delete mold '${moldToDelete.name}': ${err}`);
      });
      cascade.clearById(moldToDelete.id);
    }
    setMoldToDelete(null);
  }, [moldToDelete, entityActions, cascade]);

  const handleCancelDelete = useCallback((): void => {
    setMoldToDelete(null);
  }, []);

  const handleEdit = useCallback(
    (entityId: string): void => {
      cascade
        .find((e) => e.entityId === entityId && e.entityType === 'mold')
        .onSuccess(({ depth }) => cascade.openEditor(depth));
    },
    [cascade]
  );

  const handleCancelEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      cascade
        .find((e) => e.entityId === entityId && e.entityType === 'mold')
        .onSuccess(({ depth }) => cascade.popToView(depth));
    },
    [cascade]
  );

  const handleSaveAs = useCallback(
    (wrapper: LibraryRuntime.EditedMold): void => {
      const entity = wrapper.current;
      workspace.data.logger.info(
        `Save to... requested for '${entity.manufacturer} ${entity.productNumber}' — collection picker not yet implemented`
      );
    },
    [workspace]
  );

  const handleSave = useCallback(
    async (wrapper: LibraryRuntime.EditedMold): Promise<void> => {
      const entity = wrapper.current;
      const compositeId = editingRef.current?.id;
      if (!compositeId) {
        workspace.data.logger.error('Save failed: no composite ID for editing wrapper');
        return;
      }

      const validationResult = Editing.Molds.Validators.validateMoldEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      const baseId = entity.baseId as BaseMoldId;

      const saveResult = await moldMutation.saveEntity({
        compositeId,
        baseId,
        entity,
        persistToDisk: true
      });
      if (saveResult.isFailure()) {
        return;
      }

      if (editingRef.current?.id === compositeId) {
        editingRef.current = undefined;
      }
      const refreshedEntity = workspace.data.molds
        .get(compositeId as MoldId)
        .report(workspace.data.logger)
        .orDefault();
      cascade
        .find((e) => e.entityId === compositeId && e.entityType === 'mold')
        .onSuccess(({ depth }) => cascade.popToView(depth, refreshedEntity));
    },
    [workspace, moldMutation, cascade]
  );

  const getOrCreateWrapper = useCallback(
    (mold: LibraryRuntime.IMold): LibraryRuntime.EditedMold | undefined => {
      const id = mold.id;
      if (editingRef.current?.id === id) {
        return editingRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedMold.create(mold.entity);
      if (result.isFailure()) {
        return undefined;
      }
      editingRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  const handleNewMold = useCallback((): void => {
    cascade.select({ entityType: 'mold', entityId: CASCADE_NEW_ENTITY_ID, mode: 'create' });
  }, [cascade]);

  const handleCreateFormCancel = useCallback((): void => {
    cascade.clear();
  }, [cascade]);

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascade.stack.filter(isMoldCascadeEntry).map((entry) => {
      if (entry.mode === 'create') {
        return {
          key: CASCADE_NEW_ENTITY_ID,
          label: 'New Mold',
          content: (
            <EntityCreateForm<Entities.Molds.IMoldEntity>
              slugify={slugify}
              buildPrompt={AiAssist.buildMoldAiPrompt}
              convert={(from: unknown) => Entities.Molds.Converters.moldEntity.convert(from)}
              makeBlank={(name: string, id: string): Entities.Molds.IMoldEntity =>
                createBlankMoldEntity(id as BaseMoldId, name)
              }
              onCreate={handleCreateMold}
              sourceCreateMode="copy"
              sourceOptions={moldCreateSourceOptions}
              onCreateFromSource={handleCreateMoldFromSource}
              writableCollections={writableMoldCollections}
              defaultTargetCollectionId={mutableCollectionId}
              onCancel={handleCreateFormCancel}
              namePlaceholder="e.g. Chocolate World CW1000"
              entityLabel="Mold"
            />
          )
        };
      }

      const mold = entry.entity;
      if (!mold) {
        return {
          key: entry.entityId,
          label: entry.entityId,
          content: <div className="p-4 text-red-500">Failed to load mold: {entry.entityId}</div>
        };
      }

      if (entry.mode === 'edit') {
        const wrapper = getOrCreateWrapper(mold);
        if (wrapper === undefined) {
          return {
            key: entry.entityId,
            label: mold.displayName,
            content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
          };
        }

        const collectionId = entry.entityId.split('.')[0] as CollectionId;
        const collectionEntry = workspace.data.entities.molds.collections.get(collectionId);
        const isReadOnly = collectionEntry.isSuccess() && !collectionEntry.value.isMutable;

        // Read-only source: show gate instead of full editor
        if (isReadOnly) {
          return {
            key: `${entry.entityId}:edit`,
            label: mold.displayName,
            content: (
              <ReadOnlyEditGate
                entityName={mold.displayName}
                onSaveCopy={
                  mutableCollectionId
                    ? (): void => {
                        const today = new Date().toISOString().split('T')[0]!;
                        handleCreateMoldFromSource({
                          mode: 'copy',
                          sourceId: entry.entityId,
                          name: mold.displayName,
                          id: `${mold.entity.baseId}-copy-${today}`
                        });
                      }
                    : undefined
                }
                onCancel={(): void => handleCancelEdit(entry.entityId)}
              />
            )
          };
        }

        return {
          key: `${entry.entityId}:edit`,
          label: `${mold.displayName} (editing)`,
          content: (
            <MoldEditView
              wrapper={wrapper}
              onSave={handleSave}
              onCancel={(): void => handleCancelEdit(entry.entityId)}
              onMutation={(): void => {
                updateCascadeEntryChanges(entry.entityId, wrapper.hasChanges(wrapper.initial));
              }}
              buildPrompt={AiAssist.buildMoldAiPrompt}
              convert={(from: unknown) => Entities.Molds.Converters.moldEntity.convert(from)}
            />
          )
        };
      }

      return {
        key: entry.entityId,
        label: mold.displayName,
        content: (
          <MoldDetail
            mold={mold}
            onEdit={(): void => handleEdit(entry.entityId)}
            onClose={(): void => popCascadeTo(cascade.stack.indexOf(entry))}
          />
        )
      };
    });
  }, [
    cascade,
    workspace,
    getOrCreateWrapper,
    handleSave,
    handleSaveAs,
    handleCancelEdit,
    handleEdit,
    handleCreateMold,
    handleCreateMoldFromSource,
    moldCreateSourceOptions,
    writableMoldCollections,
    handleCreateFormCancel,
    popCascadeTo
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.molds.get(id as MoldId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.displayName, content: <MoldDetail mold={result.value} /> };
    });
  }, [compareIds, workspace]);

  return (
    <>
      <ConfirmDialog
        isOpen={moldToDelete !== null}
        title="Delete Mold"
        message={
          <>
            Delete <strong>{moldToDelete?.name}</strong>? This cannot be undone.
            {moldToDelete?.references.hasReferences && (
              <>
                <br />
                <br />
                <span className="text-red-600 font-medium">Referenced by:</span>
                <ul className="mt-1 ml-4 list-disc text-sm">
                  {moldToDelete.references.hits.map((hit) => (
                    <li key={hit.compositeId}>
                      <span className="capitalize">{hit.entityType}</span>:{' '}
                      <strong>{hit.displayName ?? hit.compositeId}</strong>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        }
        confirmLabel="Delete"
        severity="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <EntityTabLayout
        list={
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
              <button
                onClick={handleNewMold}
                disabled={mutableCollectionId === undefined}
                title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                + New Mold
              </button>
              <button
                onClick={handleListHeaderPaste}
                disabled={mutableCollectionId === undefined}
                title="Paste mold from clipboard (AI-generated JSON)"
                className="p-1.5 text-gray-500 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CursorArrowRaysIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EntityList<LibraryRuntime.IMold, MoldId>
                entities={useFilteredEntities(molds, MOLD_FILTER_SPEC)}
                descriptor={MOLD_DESCRIPTOR}
                selectedId={selectedId}
                onSelect={handleSelect}
                onDrill={collapseList}
                compareMode={compareMode}
                checkedIds={compareIds}
                onCheckedChange={toggleCompareId}
                onToggleCompare={toggleCompareMode}
                compareCount={compareIds.size}
                onStartComparison={startComparison}
                onDelete={handleRequestDelete}
                canDelete={canDeleteMold}
                emptyState={{
                  title: 'No Molds',
                  description: 'No molds found in the library.'
                }}
              />
            </div>
          </div>
        }
        cascadeColumns={cascadeColumns}
        onPopTo={popCascadeTo}
        listCollapsed={listCollapsed}
        onListCollapse={collapseList}
        compareMode={compareMode}
        comparisonColumns={comparisonColumns}
        showingComparison={showingComparison}
        onExitComparison={exitComparison}
      />
    </>
  );
}
