import React, { useCallback, useMemo, useState } from 'react';
import {
  ConfirmDialog,
  GroupedEntityList,
  type ICascadeColumn,
  EntityTabLayout,
  type ITypeaheadSuggestion,
  useMessages
} from '@fgv/ts-app-shell';
import {
  AiAssist,
  Entities,
  type BaseIngredientId,
  type BaseLocationId,
  type CollectionId,
  type IngredientId,
  type LocationId,
  type Measurement,
  type MeasurementUnit,
  LibraryRuntime
} from '@fgv/ts-chocolate';
import type { Entities as EntitiesNS } from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useTabNavigation,
  useEntityList,
  useFilteredEntities,
  useMutableCollection,
  IngredientDetail,
  IngredientInventoryEntryDetail,
  IngredientInventoryEntryEditView,
  CreateIngredientInventoryPanel,
  CreateLocationPanel,
  useIngredientInventoryActions,
  useLocationActions,
  EntityCreateForm
} from '@fgv/chocolate-lab-ui';

import {
  INGREDIENT_INVENTORY_GROUPED_DESCRIPTOR,
  INGREDIENT_INVENTORY_FILTER_SPEC,
  type IIngredientInventoryListEntry,
  slugify,
  createBlankLocationEntity,
  createBlankIngredientEntity
} from '../shared';

// ============================================================================
// Tab Content
// ============================================================================

type IngredientInventoryEntryId = Entities.Inventory.IngredientInventoryEntryId;

interface ICreateInventoryPrefillState {
  readonly ingredientId?: IngredientId;
  readonly ingredientName?: string;
  readonly locationId?: LocationId;
  readonly locationName?: string;
}

type LocationCreateTarget =
  | { readonly kind: 'create'; readonly ingredientId?: IngredientId; readonly ingredientName?: string }
  | { readonly kind: 'edit'; readonly entryId: IngredientInventoryEntryId };

export function IngredientInventoryTabContent(): React.ReactElement {
  const {
    workspace,
    reactiveWorkspace,
    squashCascade,
    popCascadeTo,
    cascadeStack,
    listCollapsed,
    collapseList
  } = useTabNavigation();

  const inventoryActions = useIngredientInventoryActions();
  const locationActions = useLocationActions();
  const { addMessage } = useMessages();
  const [createPrefill, setCreatePrefill] = useState<ICreateInventoryPrefillState>({});
  const [locationCreateTarget, setLocationCreateTarget] = useState<LocationCreateTarget | undefined>(
    undefined
  );
  const [editLocationPrefillById, setEditLocationPrefillById] = useState<
    Readonly<Record<string, { readonly id: LocationId; readonly name: string }>>
  >({});

  // ============================================================================
  // Entity List
  // ============================================================================

  const { entities: inventoryEntries, selectedId } = useEntityList<
    IIngredientInventoryListEntry,
    IngredientInventoryEntryId
  >({
    getAll: () => {
      const entries: IIngredientInventoryListEntry[] = [];
      for (const [id, entry] of workspace.userData.ingredientInventory.entries()) {
        entries.push({ id, entry });
      }
      return entries;
    },
    compare: (a, b) => {
      return a.entry.item.name.localeCompare(b.entry.item.name);
    },
    entityType: 'ingredient-inventory-entry',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  // ============================================================================
  // Suggestions
  // ============================================================================

  const ingredientSuggestions = useMemo<ReadonlyArray<ITypeaheadSuggestion<IngredientId>>>(
    () =>
      Array.from(workspace.data.ingredients.values())
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((ingredient) => ({ id: ingredient.id, name: ingredient.name })),
    [workspace, reactiveWorkspace.version]
  );

  const locationSuggestions = useMemo<ReadonlyArray<ITypeaheadSuggestion<LocationId>>>(
    () =>
      Array.from(workspace.userData.entities.locations.entries())
        .sort(([, a], [, b]) => a.name.localeCompare(b.name))
        .map(([id, location]) => ({ id, name: location.name })),
    [workspace, reactiveWorkspace.version]
  );

  // ============================================================================
  // Selection Handler
  // ============================================================================

  const handleSelect = useCallback(
    (id: IngredientInventoryEntryId): void => {
      const entry: ICascadeEntry = {
        entityType: 'ingredient-inventory-entry',
        entityId: id,
        mode: 'view'
      };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  const handleUnresolvedLocation = useCallback(
    (text: string, currentSelection: { ingredientId?: IngredientId; ingredientName?: string }): void => {
      setLocationCreateTarget({
        kind: 'create',
        ingredientId: currentSelection.ingredientId,
        ingredientName: currentSelection.ingredientName
      });
      setCreatePrefill({
        ingredientId: currentSelection.ingredientId,
        ingredientName: currentSelection.ingredientName
      });
      squashCascade([
        {
          entityType: 'ingredient-inventory-entry',
          entityId: '__new__',
          mode: 'create',
          prefillName: currentSelection.ingredientId
        },
        { entityType: 'location', entityId: '__new__', mode: 'create', prefillName: text }
      ]);
    },
    [squashCascade]
  );

  // ============================================================================
  // Delete Handler
  // ============================================================================

  const [entryToDelete, setEntryToDelete] = useState<{
    id: IngredientInventoryEntryId;
    name: string;
  } | null>(null);

  const handleRequestDelete = useCallback(
    (id: IngredientInventoryEntryId): void => {
      const result = workspace.userData.ingredientInventory.get(id);
      const name = result.isSuccess() ? result.value.item.name : id;
      setEntryToDelete({ id, name });
    },
    [workspace]
  );

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (entryToDelete) {
      const result = await inventoryActions.deleteEntry(entryToDelete.id);
      if (result.isSuccess()) {
        if (selectedId === entryToDelete.id) {
          squashCascade([]);
        }
      } else {
        addMessage('error', `Failed to delete inventory entry: ${result.message}`);
      }
    }
    setEntryToDelete(null);
  }, [entryToDelete, inventoryActions, selectedId, squashCascade, addMessage]);

  const handleCancelDelete = useCallback((): void => {
    setEntryToDelete(null);
  }, []);

  const canDelete = useCallback(
    (_id: IngredientInventoryEntryId): boolean => {
      return inventoryActions.defaultCollectionId !== undefined;
    },
    [inventoryActions]
  );

  // ============================================================================
  // New Entry
  // ============================================================================

  const handleNewEntry = useCallback((): void => {
    setCreatePrefill({});
    const entry: ICascadeEntry = {
      entityType: 'ingredient-inventory-entry',
      entityId: '__new__',
      mode: 'create'
    };
    squashCascade([entry]);
  }, [squashCascade]);

  const handleCreateConfirm = useCallback(
    async (
      ingredientId: IngredientId,
      quantity: Measurement,
      unit?: MeasurementUnit,
      locationId?: LocationId
    ): Promise<void> => {
      // Duplicate guard: same ingredient + same location
      for (const [id, existing] of workspace.userData.ingredientInventory.entries()) {
        const existingLocationId = existing.location?.id;
        if (existing.item.id === ingredientId && existingLocationId === locationId) {
          addMessage(
            'warning',
            'An inventory entry for this ingredient at this location already exists. Navigating to it.'
          );
          squashCascade([{ entityType: 'ingredient-inventory-entry', entityId: id, mode: 'view' }]);
          return;
        }
      }

      const result = await inventoryActions.addEntry(ingredientId, quantity, unit, locationId);
      if (result.isSuccess()) {
        setCreatePrefill({});
        squashCascade([{ entityType: 'ingredient-inventory-entry', entityId: result.value, mode: 'view' }]);
      } else {
        addMessage('error', `Failed to add inventory entry: ${result.message}`);
      }
    },
    [inventoryActions, workspace, squashCascade, addMessage]
  );

  const handleCancelCreate = useCallback((): void => {
    setCreatePrefill({});
    squashCascade([]);
  }, [squashCascade]);

  // ============================================================================
  // Ingredient On-Blur Unresolved → Cascade Ingredient Creation
  // ============================================================================

  const handleUnresolvedIngredient = useCallback(
    (text: string): void => {
      setCreatePrefill({});
      squashCascade([
        {
          entityType: 'ingredient-inventory-entry',
          entityId: '__new__',
          mode: 'create',
          prefillName: text
        },
        { entityType: 'ingredient', entityId: '__new__', mode: 'create', prefillName: text }
      ]);
    },
    [squashCascade]
  );

  // ============================================================================
  // Ingredient Created From Cascade (on-blur create flow)
  // ============================================================================

  const mutableIngredientCollectionId = useMutableCollection(
    workspace.data.entities.ingredients.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.ingredients
  );

  const handleIngredientCreated = useCallback(
    (entity: EntitiesNS.Ingredients.IngredientEntity, _source: 'manual' | 'ai'): void => {
      if (!mutableIngredientCollectionId) return;
      const baseId = entity.baseId as BaseIngredientId;
      const colResult = workspace.data.entities.ingredients.collections.get(mutableIngredientCollectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) return;
      const setResult = colResult.value.items.set(baseId, entity);
      if (setResult.isFailure()) return;
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // Pop the ingredient create column, return to inventory create with the new ingredient pre-selected
      const newIngredientId = `${mutableIngredientCollectionId}.${baseId}` as IngredientId;
      setCreatePrefill((prev) => ({
        ...prev,
        ingredientId: newIngredientId,
        ingredientName: entity.name
      }));
      squashCascade([
        {
          entityType: 'ingredient-inventory-entry',
          entityId: '__new__',
          mode: 'create',
          prefillName: newIngredientId
        }
      ]);
    },
    [mutableIngredientCollectionId, workspace, reactiveWorkspace, squashCascade]
  );

  const handleCancelIngredientCreate = useCallback((): void => {
    // Pop the ingredient create column, return to inventory create
    squashCascade([{ entityType: 'ingredient-inventory-entry', entityId: '__new__', mode: 'create' }]);
  }, [squashCascade]);

  const handleCreateLocationConfirm = useCallback(
    async (baseId: string, name: string, description?: string): Promise<void> => {
      const target = locationCreateTarget;
      if (!target) {
        return;
      }

      const entity = createBlankLocationEntity(baseId as BaseLocationId, name);
      const entityWithDescription: Entities.Locations.ILocationEntity = description
        ? { ...entity, description }
        : entity;

      const createResult = await locationActions.addLocation(baseId as BaseLocationId, entityWithDescription);
      if (createResult.isFailure()) {
        addMessage('error', `Failed to create location: ${createResult.message}`);
        return;
      }

      if (target.kind === 'create') {
        setCreatePrefill({
          ingredientId: target.ingredientId,
          ingredientName: target.ingredientName,
          locationId: createResult.value,
          locationName: name
        });
        squashCascade([
          {
            entityType: 'ingredient-inventory-entry',
            entityId: '__new__',
            mode: 'create',
            prefillName: target.ingredientId
          }
        ]);
      } else {
        setEditLocationPrefillById((prev) => ({
          ...prev,
          [target.entryId]: { id: createResult.value, name }
        }));
        squashCascade(cascadeStack.slice(0, -1));
      }

      setLocationCreateTarget(undefined);
    },
    [locationCreateTarget, locationActions, addMessage, squashCascade, cascadeStack]
  );

  const handleCancelLocationCreate = useCallback((): void => {
    const target = locationCreateTarget;
    if (!target) {
      squashCascade(cascadeStack.slice(0, -1));
      return;
    }

    if (target.kind === 'create') {
      squashCascade([
        {
          entityType: 'ingredient-inventory-entry',
          entityId: '__new__',
          mode: 'create',
          prefillName: target.ingredientId
        }
      ]);
    } else {
      squashCascade(cascadeStack.slice(0, -1));
    }

    setLocationCreateTarget(undefined);
  }, [locationCreateTarget, squashCascade, cascadeStack]);

  // ============================================================================
  // Edit Handler
  // ============================================================================

  const handleEdit = useCallback(
    (entityId: string): void => {
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'ingredient-inventory-entry'
          ? { ...e, mode: 'edit' as const }
          : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  const handleCancelEdit = useCallback(
    (entityId: string): void => {
      setEditLocationPrefillById((prev) => {
        if (!(entityId in prev)) {
          return prev;
        }
        const { [entityId]: __removed, ...rest } = prev;
        return rest;
      });
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'ingredient-inventory-entry'
          ? { ...e, mode: 'view' as const }
          : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  const handleSave = useCallback(
    async (
      entryId: IngredientInventoryEntryId,
      entity: Entities.Inventory.IIngredientInventoryEntryEntity
    ): Promise<void> => {
      const result = await inventoryActions.updateEntry(entryId, entity);
      if (result.isSuccess()) {
        setEditLocationPrefillById((prev) => {
          if (!(entryId in prev)) {
            return prev;
          }
          const { [entryId]: __removed, ...rest } = prev;
          return rest;
        });
        const updated = cascadeStack.map((e) =>
          e.entityId === entryId && e.entityType === 'ingredient-inventory-entry'
            ? { ...e, mode: 'view' as const }
            : e
        );
        squashCascade(updated);
      } else {
        addMessage('error', `Failed to update inventory entry: ${result.message}`);
      }
    },
    [inventoryActions, cascadeStack, squashCascade, addMessage]
  );

  const handleUnresolvedLocationFromEdit = useCallback(
    (entryId: IngredientInventoryEntryId, text: string): void => {
      setLocationCreateTarget({ kind: 'edit', entryId });
      squashCascade([
        ...cascadeStack,
        { entityType: 'location', entityId: '__new__', mode: 'create', prefillName: text }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  // ============================================================================
  // Browse Ingredient from Detail (drill-down)
  // ============================================================================

  const handleBrowseIngredient = useCallback(
    (inventoryEntry: ICascadeEntry, ingredientId: IngredientId): void => {
      squashCascade([inventoryEntry, { entityType: 'ingredient', entityId: ingredientId, mode: 'view' }]);
    },
    [squashCascade]
  );

  // ============================================================================
  // Cascade Columns
  // ============================================================================

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, _index) => {
      // Ingredient create (from on-blur cascade)
      if (entry.entityType === 'ingredient' && entry.mode === 'create') {
        return {
          key: '__new__ingredient',
          label: 'New Ingredient',
          content: (
            <EntityCreateForm<Entities.Ingredients.IngredientEntity>
              slugify={slugify}
              buildPrompt={AiAssist.buildIngredientAiPrompt}
              convert={(
                from: unknown
              ): ReturnType<typeof Entities.Ingredients.Converters.ingredientEntity.convert> =>
                Entities.Ingredients.Converters.ingredientEntity.convert(from)
              }
              makeBlank={(name: string, id: string): Entities.Ingredients.IngredientEntity =>
                createBlankIngredientEntity(id as BaseIngredientId, name)
              }
              onCreate={handleIngredientCreated}
              onCancel={handleCancelIngredientCreate}
              namePlaceholder="e.g. Valrhona Guanaja 70%"
              entityLabel="Ingredient"
              initialName={entry.prefillName}
            />
          )
        };
      }

      // Ingredient view (drill-down from inventory entry)
      if (entry.entityType === 'ingredient' && entry.mode === 'view') {
        const result = workspace.data.ingredients.get(entry.entityId as IngredientId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load ingredient: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: <IngredientDetail ingredient={result.value} onClose={(): void => popCascadeTo(_index)} />
        };
      }

      // Inventory entry create
      if (entry.entityType === 'ingredient-inventory-entry' && entry.mode === 'create') {
        const prefillIngredientId = createPrefill.ingredientId ?? entry.prefillName;
        const preSelectedIngredient = prefillIngredientId
          ? ingredientSuggestions.find((s) => s.id === prefillIngredientId)
          : undefined;

        return {
          key: '__new__inventory',
          label: 'New Entry',
          content: (
            <CreateIngredientInventoryPanel
              ingredientSuggestions={ingredientSuggestions}
              locationSuggestions={locationSuggestions}
              onConfirm={handleCreateConfirm}
              onUnresolvedIngredient={handleUnresolvedIngredient}
              onUnresolvedLocation={handleUnresolvedLocation}
              onCancel={handleCancelCreate}
              initialIngredientId={preSelectedIngredient?.id ?? createPrefill.ingredientId}
              initialIngredientName={preSelectedIngredient?.name ?? createPrefill.ingredientName}
              initialLocationId={createPrefill.locationId}
              initialLocationName={createPrefill.locationName}
            />
          )
        };
      }

      if (entry.entityType === 'location' && entry.mode === 'create') {
        return {
          key: '__new__location',
          label: 'New Location',
          content: (
            <CreateLocationPanel
              onConfirm={handleCreateLocationConfirm}
              onCancel={handleCancelLocationCreate}
              initialName={entry.prefillName}
            />
          )
        };
      }

      // Inventory entry view
      if (entry.entityType === 'ingredient-inventory-entry' && entry.mode === 'view') {
        const result = workspace.userData.ingredientInventory.get(
          entry.entityId as IngredientInventoryEntryId
        );
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load inventory entry: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: result.value.item.name,
          content: (
            <IngredientInventoryEntryDetail
              entry={result.value}
              onEdit={(): void => handleEdit(entry.entityId)}
              onBrowseIngredient={(ingredientId: IngredientId): void =>
                handleBrowseIngredient(entry, ingredientId)
              }
              onClose={(): void => popCascadeTo(_index)}
            />
          )
        };
      }

      // Inventory entry edit
      if (entry.entityType === 'ingredient-inventory-entry' && entry.mode === 'edit') {
        const result = workspace.userData.ingredientInventory.get(
          entry.entityId as IngredientInventoryEntryId
        );
        if (result.isFailure()) {
          return {
            key: `${entry.entityId}:edit`,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load inventory entry: {entry.entityId}</div>
          };
        }

        return {
          key: `${entry.entityId}:edit`,
          label: `${result.value.item.name} (editing)`,
          content: (
            <IngredientInventoryEntryEditView
              entry={result.value}
              locationSuggestions={locationSuggestions}
              initialLocationId={editLocationPrefillById[entry.entityId]?.id}
              initialLocationName={editLocationPrefillById[entry.entityId]?.name}
              onSave={(entity): void => {
                void handleSave(entry.entityId as IngredientInventoryEntryId, entity);
              }}
              onUnresolvedLocation={(text: string): void =>
                handleUnresolvedLocationFromEdit(entry.entityId as IngredientInventoryEntryId, text)
              }
              onCancel={(): void => handleCancelEdit(entry.entityId)}
            />
          )
        };
      }

      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4 text-gray-500">Unknown entity type: {entry.entityType}</div>
      };
    });
  }, [
    cascadeStack,
    workspace,
    ingredientSuggestions,
    locationSuggestions,
    popCascadeTo,
    handleCreateConfirm,
    handleCancelCreate,
    handleUnresolvedIngredient,
    handleUnresolvedLocation,
    handleCreateLocationConfirm,
    handleCancelLocationCreate,
    handleIngredientCreated,
    handleCancelIngredientCreate,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleUnresolvedLocationFromEdit,
    handleRequestDelete,
    handleBrowseIngredient,
    createPrefill,
    editLocationPrefillById
  ]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <ConfirmDialog
        isOpen={entryToDelete !== null}
        title="Delete Inventory Entry"
        message={
          <>
            Remove <strong>{entryToDelete?.name}</strong> from inventory? This cannot be undone.
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
                onClick={handleNewEntry}
                data-testid="ingredient-inventory-new-entry-button"
                disabled={inventoryActions.defaultCollectionId === undefined}
                title={
                  inventoryActions.defaultCollectionId === undefined
                    ? 'No mutable collection available'
                    : undefined
                }
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                + New Entry
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <GroupedEntityList<IIngredientInventoryListEntry, IngredientInventoryEntryId>
                entities={useFilteredEntities(inventoryEntries, INGREDIENT_INVENTORY_FILTER_SPEC)}
                descriptor={INGREDIENT_INVENTORY_GROUPED_DESCRIPTOR}
                selectedId={selectedId}
                onSelect={handleSelect}
                onDelete={handleRequestDelete}
                canDelete={canDelete}
                onDrill={collapseList}
                emptyState={{
                  title: 'No Ingredient Inventory',
                  description: 'No ingredients in inventory. Add your first ingredient to start tracking.'
                }}
              />
            </div>
          </div>
        }
        cascadeColumns={cascadeColumns}
        onPopTo={popCascadeTo}
        listCollapsed={listCollapsed}
        onListCollapse={collapseList}
      />
    </>
  );
}
