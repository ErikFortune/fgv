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
import type { BaseIngredientId, CollectionId, IngredientId } from '@fgv/ts-chocolate';
import type { Result, ResultMapValueType } from '@fgv/ts-utils';
import {
  type ICascadeEntry,
  type IReferenceScanResult,
  useTabNavigation,
  useEntityList,
  useMutableCollection,
  useCanDeleteFromCollections,
  useEntityActions,
  createSetInMutableCollection,
  type MutableCollectionEntryWithSet,
  useEntityMutation,
  useClipboardJsonImport,
  IngredientDetail,
  IngredientEditView,
  EntityCreateForm,
  getWritableCollectionOptions,
  useFilteredEntities,
  useNavigationStore,
  ReadOnlyEditGate
} from '@fgv/chocolate-lab-ui';

import {
  INGREDIENT_DESCRIPTOR,
  INGREDIENT_FILTER_SPEC,
  slugify,
  createBlankIngredientEntity
} from '../shared';

export function IngredientsTabContent(): React.ReactElement {
  const {
    workspace,
    reactiveWorkspace,
    squashCascade,
    popCascadeTo,
    cascadeStack,
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
  const updateCascadeEntryChanges = useNavigationStore((s) => s.updateCascadeEntryChanges);

  type IngredientCollectionEntry = ResultMapValueType<typeof workspace.data.entities.ingredients.collections>;
  type IngredientMutableCollectionEntry = MutableCollectionEntryWithSet<
    IngredientCollectionEntry,
    BaseIngredientId,
    Entities.Ingredients.IngredientEntity
  >;

  const editingRef = useRef<{ id: IngredientId; wrapper: LibraryRuntime.EditedIngredient } | undefined>(
    undefined
  );
  const [ingredientToDelete, setIngredientToDelete] = useState<{
    id: IngredientId;
    name: string;
    references: IReferenceScanResult;
  } | null>(null);
  const entityActions = useEntityActions();

  const mutableCollectionId = useMutableCollection(
    workspace.data.entities.ingredients.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.ingredients
  );

  const writableIngredientCollections = useMemo(
    (): ReadonlyArray<{ id: string; label?: string }> =>
      getWritableCollectionOptions(
        workspace.data.entities.ingredients.collections.entries(),
        workspace.settings?.getResolvedSettings().defaultTargets.ingredients
      ),
    [workspace, reactiveWorkspace.version]
  );

  const canDeleteIngredient = useCanDeleteFromCollections(workspace.data.entities.ingredients.collections, [
    workspace,
    reactiveWorkspace.version
  ]);

  const ingredientMutation = useEntityMutation<
    Entities.Ingredients.IngredientEntity,
    BaseIngredientId,
    IngredientId
  >({
    setInMutableCollection: createSetInMutableCollection<
      Entities.Ingredients.IngredientEntity,
      BaseIngredientId,
      IngredientCollectionEntry,
      IngredientMutableCollectionEntry
    >({
      getCollection: (collectionId: CollectionId) =>
        workspace.data.entities.ingredients.collections.get(collectionId),
      isMutable: (entry: IngredientCollectionEntry): entry is IngredientMutableCollectionEntry =>
        entry.isMutable && 'set' in entry.items,
      setEntity: (
        entry: IngredientMutableCollectionEntry,
        baseId: BaseIngredientId,
        entity: Entities.Ingredients.IngredientEntity
      ) => entry.items.set(baseId, entity),
      entityLabel: 'ingredient'
    }),
    entityLabel: 'ingredient',
    getPersistedCollection: (collectionId: CollectionId) =>
      workspace.data.entities.getPersistedIngredientsCollection(collectionId)
  });

  const { entities: ingredients, selectedId } = useEntityList<LibraryRuntime.AnyIngredient, IngredientId>({
    getAll: () => workspace.data.ingredients.values(),
    compare: (a, b) => a.name.localeCompare(b.name),
    entityType: 'ingredient',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  const ingredientCreateSourceOptions = useMemo(
    (): ReadonlyArray<{ id: string; name: string }> =>
      ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name
      })),
    [ingredients]
  );

  // Create a new ingredient from an entity, add to mutable collection, and open in edit mode
  const handleCreateIngredient = useCallback(
    async (
      entity: Entities.Ingredients.IngredientEntity,
      source: 'manual' | 'ai',
      targetCollectionId?: string
    ): Promise<void> => {
      const baseId = entity.baseId as BaseIngredientId;
      const createResult = await ingredientMutation.createEntity({
        targetCollectionId: targetCollectionId as CollectionId | undefined,
        defaultCollectionId: mutableCollectionId,
        getCompositeId: (collectionId: CollectionId, nextBaseId: BaseIngredientId) =>
          `${collectionId}.${nextBaseId}` as IngredientId,
        baseId,
        entity,
        exists: (id: IngredientId) => workspace.data.ingredients.get(id).isSuccess(),
        persistToDisk: false
      });
      if (createResult.isFailure()) {
        return;
      }

      const compositeId = createResult.value;

      // Create editing wrapper and open in edit mode
      const wrapperResult = LibraryRuntime.EditedIngredient.create(entity);
      if (wrapperResult.isFailure()) {
        workspace.data.logger.error(`Failed to create editing wrapper: ${wrapperResult.message}`);
        return;
      }
      editingRef.current = { id: compositeId, wrapper: wrapperResult.value };

      if (source === 'ai') {
        workspace.data.logger.info(`Created ingredient '${entity.name}' from AI-generated data`);
      }

      const entry: ICascadeEntry = {
        entityType: 'ingredient',
        entityId: compositeId,
        mode: 'edit',
        hasChanges: true
      };
      squashCascade([entry]);
    },
    [workspace, mutableCollectionId, ingredientMutation, squashCascade]
  );

  const handleCreateIngredientFromSource = useCallback(
    (params: {
      mode: 'copy' | 'derive';
      sourceId: string;
      name: string;
      id: string;
      targetCollectionId?: string;
    }): void => {
      const sourceResult = workspace.data.ingredients.get(params.sourceId as IngredientId);
      if (sourceResult.isFailure()) {
        workspace.data.logger.error(`Cannot copy ingredient '${params.sourceId}': not found`);
        return;
      }

      const nextEntity: Entities.Ingredients.IngredientEntity = {
        ...sourceResult.value.entity,
        baseId: params.id as BaseIngredientId,
        name: params.name as typeof sourceResult.value.entity.name
      };

      void handleCreateIngredient(nextEntity, 'manual', params.targetCollectionId);
    },
    [workspace, handleCreateIngredient]
  );

  const handleListHeaderPaste = useClipboardJsonImport<Entities.Ingredients.IngredientEntity>({
    entityLabel: 'ingredient',
    convert: (from: unknown) => Entities.Ingredients.Converters.ingredientEntity.convert(from),
    onValid: (entity: Entities.Ingredients.IngredientEntity) => handleCreateIngredient(entity, 'ai'),
    onValidSuccessMessage: (entity: Entities.Ingredients.IngredientEntity) =>
      `Opened '${entity.name}' for review — save when ready`
  });

  const handleSelect = useCallback(
    (id: IngredientId): void => {
      squashCascade([{ entityType: 'ingredient', entityId: id, mode: 'view' }]);
    },
    [squashCascade]
  );

  const handleRequestDelete = useCallback(
    (id: IngredientId): void => {
      const result = workspace.data.ingredients.get(id);
      const name = result.isSuccess() ? result.value.name : id;
      const references = entityActions.scanReferences(id);
      setIngredientToDelete({ id, name, references });
    },
    [workspace, entityActions]
  );

  const handleConfirmDelete = useCallback((): void => {
    if (ingredientToDelete) {
      entityActions.deleteEntity(ingredientToDelete.id);
      // If the deleted entity is currently selected, clear the cascade
      if (cascadeStack.some((e) => e.entityId === ingredientToDelete.id)) {
        squashCascade([]);
      }
    }
    setIngredientToDelete(null);
  }, [ingredientToDelete, entityActions, cascadeStack, squashCascade]);

  const handleCancelDelete = useCallback((): void => {
    setIngredientToDelete(null);
  }, []);

  const handleEdit = useCallback(
    (entityId: string): void => {
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'ingredient' ? { ...e, mode: 'edit' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  const handleCancelEdit = useCallback(
    (entityId: string): void => {
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'ingredient' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  const handleSaveAs = useCallback(
    (wrapper: LibraryRuntime.EditedIngredient): void => {
      const entity = wrapper.current;
      workspace.data.logger.info(
        `Save to... requested for '${entity.name}' — collection picker not yet implemented`
      );
    },
    [workspace]
  );

  const handleSave = useCallback(
    async (wrapper: LibraryRuntime.EditedIngredient): Promise<void> => {
      const entity = wrapper.current;
      const compositeId = editingRef.current?.id;
      if (!compositeId) {
        workspace.data.logger.error('Save failed: no composite ID for editing wrapper');
        return;
      }

      const validationResult = Editing.Ingredients.Validators.validateIngredientEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      const baseId = entity.baseId as BaseIngredientId;

      const saveResult = await ingredientMutation.saveEntity({
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
      const updated = cascadeStack.map((e) =>
        e.entityId === compositeId && e.entityType === 'ingredient' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [workspace, ingredientMutation, cascadeStack, squashCascade]
  );

  const getOrCreateWrapper = useCallback(
    (ingredient: LibraryRuntime.AnyIngredient): LibraryRuntime.EditedIngredient | undefined => {
      const id = ingredient.id;
      if (editingRef.current?.id === id) {
        return editingRef.current.wrapper;
      }
      const result = LibraryRuntime.EditedIngredient.create(ingredient.entity);
      if (result.isFailure()) {
        return undefined;
      }
      editingRef.current = { id, wrapper: result.value };
      return result.value;
    },
    []
  );

  const handleNewIngredient = useCallback((): void => {
    squashCascade([{ entityType: 'ingredient', entityId: '__new__', mode: 'create' }]);
  }, [squashCascade]);

  const handleCreateFormCancel = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack
      .filter((e) => e.entityType === 'ingredient')
      .map((entry) => {
        if (entry.mode === 'create') {
          return {
            key: '__new__',
            label: 'New Ingredient',
            content: (
              <EntityCreateForm<Entities.Ingredients.IngredientEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildIngredientAiPrompt}
                convert={(from: unknown) => Entities.Ingredients.Converters.ingredientEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Ingredients.IngredientEntity =>
                  createBlankIngredientEntity(id as BaseIngredientId, name)
                }
                onCreate={handleCreateIngredient}
                sourceCreateMode="copy"
                sourceOptions={ingredientCreateSourceOptions}
                onCreateFromSource={handleCreateIngredientFromSource}
                writableCollections={writableIngredientCollections}
                defaultTargetCollectionId={mutableCollectionId}
                onCancel={handleCreateFormCancel}
                namePlaceholder="e.g. Callebaut 811 Dark"
                entityLabel="Ingredient"
              />
            )
          };
        }

        const result = workspace.data.ingredients.get(entry.entityId as IngredientId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load ingredient: {entry.entityId}</div>
          };
        }

        if (entry.mode === 'edit') {
          const wrapper = getOrCreateWrapper(result.value);
          if (wrapper === undefined) {
            return {
              key: entry.entityId,
              label: result.value.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }

          const collectionId = entry.entityId.split('.')[0] as CollectionId;
          const collectionEntry = workspace.data.entities.ingredients.collections.get(collectionId);
          const isReadOnly = collectionEntry.isSuccess() && !collectionEntry.value.isMutable;

          // Read-only source: show gate instead of full editor
          if (isReadOnly) {
            return {
              key: `${entry.entityId}:edit`,
              label: result.value.name,
              content: (
                <ReadOnlyEditGate
                  entityName={result.value.name}
                  onSaveCopy={
                    mutableCollectionId
                      ? (): void => {
                          const today = new Date().toISOString().split('T')[0]!;
                          handleCreateIngredientFromSource({
                            mode: 'copy',
                            sourceId: entry.entityId,
                            name: result.value.name,
                            id: `${result.value.entity.baseId}-copy-${today}`
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
            label: `${result.value.name} (editing)`,
            content: (
              <IngredientEditView
                wrapper={wrapper}
                onSave={handleSave}
                onSaveAs={handleSaveAs}
                onCancel={(): void => handleCancelEdit(entry.entityId)}
                onMutation={(): void => {
                  updateCascadeEntryChanges(entry.entityId, wrapper.hasChanges(wrapper.initial));
                }}
                buildPrompt={AiAssist.buildIngredientAiPrompt}
                convert={(from: unknown) => Entities.Ingredients.Converters.ingredientEntity.convert(from)}
              />
            )
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <IngredientDetail
              ingredient={result.value}
              onEdit={(): void => handleEdit(entry.entityId)}
              onClose={(): void => popCascadeTo(cascadeStack.indexOf(entry))}
            />
          )
        };
      });
  }, [
    cascadeStack,
    workspace,
    getOrCreateWrapper,
    handleSave,
    handleSaveAs,
    handleCancelEdit,
    handleEdit,
    handleCreateIngredient,
    handleCreateIngredientFromSource,
    ingredientCreateSourceOptions,
    writableIngredientCollections,
    handleCreateFormCancel
  ]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.ingredients.get(id as IngredientId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <IngredientDetail ingredient={result.value} /> };
    });
  }, [compareIds, workspace]);

  return (
    <>
      <ConfirmDialog
        isOpen={ingredientToDelete !== null}
        title="Delete Ingredient"
        message={
          <>
            Delete <strong>{ingredientToDelete?.name}</strong>? This cannot be undone.
            {ingredientToDelete?.references.hasReferences && (
              <>
                <br />
                <br />
                <span className="text-red-600 font-medium">Referenced by:</span>
                <ul className="mt-1 ml-4 list-disc text-sm">
                  {ingredientToDelete.references.hits.map((hit) => (
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
                onClick={handleNewIngredient}
                disabled={mutableCollectionId === undefined}
                title={mutableCollectionId === undefined ? 'No mutable collection available' : undefined}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                + New Ingredient
              </button>
              <button
                onClick={handleListHeaderPaste}
                disabled={mutableCollectionId === undefined}
                title="Paste ingredient from clipboard (AI-generated JSON)"
                className="p-1.5 text-gray-500 hover:text-choco-primary hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CursorArrowRaysIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EntityList<LibraryRuntime.AnyIngredient, IngredientId>
                entities={useFilteredEntities(ingredients, INGREDIENT_FILTER_SPEC)}
                descriptor={INGREDIENT_DESCRIPTOR}
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
                canDelete={canDeleteIngredient}
                emptyState={{
                  title: 'No Ingredients',
                  description: 'No ingredients found in the library.'
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
