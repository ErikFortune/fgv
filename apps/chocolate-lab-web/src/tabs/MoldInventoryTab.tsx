import React, { useCallback, useMemo, useState } from 'react';
import {
  ConfirmDialog,
  EntityList,
  type ICascadeColumn,
  EntityTabLayout,
  type ITypeaheadSuggestion,
  useMessages
} from '@fgv/ts-app-shell';
import {
  AiAssist,
  Entities,
  type BaseLocationId,
  type BaseMoldId,
  type CollectionId,
  type LocationId,
  type MoldId,
  LibraryRuntime
} from '@fgv/ts-chocolate';
import type { Entities as EntitiesNS } from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useTabNavigation,
  useEntityList,
  useFilteredEntities,
  useMutableCollection,
  MoldDetail,
  MoldInventoryEntryDetail,
  MoldInventoryEntryEditView,
  CreateMoldInventoryPanel,
  CreateLocationPanel,
  useMoldInventoryActions,
  useLocationActions,
  EntityCreateForm
} from '@fgv/chocolate-lab-ui';

import {
  MOLD_INVENTORY_DESCRIPTOR,
  MOLD_INVENTORY_FILTER_SPEC,
  type IMoldInventoryListEntry,
  slugify,
  createBlankLocationEntity,
  createBlankMoldEntity
} from '../shared';

// ============================================================================
// Tab Content
// ============================================================================

type MoldInventoryEntryId = Entities.Inventory.MoldInventoryEntryId;

interface ICreateInventoryPrefillState {
  readonly moldId?: MoldId;
  readonly moldName?: string;
  readonly locationId?: LocationId;
  readonly locationName?: string;
}

type LocationCreateTarget =
  | { readonly kind: 'create'; readonly moldId?: MoldId; readonly moldName?: string }
  | { readonly kind: 'edit'; readonly entryId: MoldInventoryEntryId };

export function MoldInventoryTabContent(): React.ReactElement {
  const {
    workspace,
    reactiveWorkspace,
    squashCascade,
    popCascadeTo,
    cascadeStack,
    listCollapsed,
    collapseList
  } = useTabNavigation();

  const inventoryActions = useMoldInventoryActions();
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
  // Entity List — wraps materialized inventory entries with composite IDs
  // ============================================================================

  const { entities: inventoryEntries, selectedId } = useEntityList<
    IMoldInventoryListEntry,
    MoldInventoryEntryId
  >({
    getAll: () => {
      const entries: IMoldInventoryListEntry[] = [];
      for (const [id, entry] of workspace.userData.moldInventory.entries()) {
        entries.push({ id, entry });
      }
      return entries;
    },
    compare: (a, b) => {
      return a.entry.item.displayName.localeCompare(b.entry.item.displayName);
    },
    entityType: 'mold-inventory-entry',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  // ============================================================================
  // Mold Suggestions (for typeahead in create panel)
  // ============================================================================

  const moldSuggestions = useMemo<ReadonlyArray<ITypeaheadSuggestion<MoldId>>>(
    () =>
      Array.from(workspace.data.molds.values())
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
        .map((mold) => ({ id: mold.id, name: mold.displayName })),
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
    (id: MoldInventoryEntryId): void => {
      const entry: ICascadeEntry = { entityType: 'mold-inventory-entry', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  const handleUnresolvedLocation = useCallback(
    (text: string, currentSelection: { moldId?: MoldId; moldName?: string }): void => {
      setLocationCreateTarget({
        kind: 'create',
        moldId: currentSelection.moldId,
        moldName: currentSelection.moldName
      });
      setCreatePrefill({
        moldId: currentSelection.moldId,
        moldName: currentSelection.moldName
      });
      squashCascade([
        {
          entityType: 'mold-inventory-entry',
          entityId: '__new__',
          mode: 'create',
          prefillName: currentSelection.moldId
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
    id: MoldInventoryEntryId;
    name: string;
  } | null>(null);

  const handleRequestDelete = useCallback(
    (id: MoldInventoryEntryId): void => {
      const result = workspace.userData.moldInventory.get(id);
      const name = result.isSuccess() ? result.value.item.displayName : id;
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
    (_id: MoldInventoryEntryId): boolean => {
      // All mutable collection entries can be deleted
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
      entityType: 'mold-inventory-entry',
      entityId: '__new__',
      mode: 'create'
    };
    squashCascade([entry]);
  }, [squashCascade]);

  const handleCreateConfirm = useCallback(
    async (moldId: MoldId, count: number, locationId?: LocationId): Promise<void> => {
      // Duplicate guard: same mold + same location
      for (const [id, existing] of workspace.userData.moldInventory.entries()) {
        const existingLocationId = existing.location?.id;
        if (existing.item.id === moldId && existingLocationId === locationId) {
          addMessage(
            'warning',
            'An inventory entry for this mold at this location already exists. Navigating to it.'
          );
          squashCascade([{ entityType: 'mold-inventory-entry', entityId: id, mode: 'view' }]);
          return;
        }
      }

      const result = await inventoryActions.addEntry(moldId, count, locationId);
      if (result.isSuccess()) {
        setCreatePrefill({});
        squashCascade([{ entityType: 'mold-inventory-entry', entityId: result.value, mode: 'view' }]);
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
  // Mold On-Blur Unresolved → Cascade Mold Creation
  // ============================================================================

  const handleUnresolvedMold = useCallback(
    (text: string): void => {
      setCreatePrefill({});
      squashCascade([
        { entityType: 'mold-inventory-entry', entityId: '__new__', mode: 'create', prefillName: text },
        { entityType: 'mold', entityId: '__new__', mode: 'create', prefillName: text }
      ]);
    },
    [squashCascade]
  );

  // ============================================================================
  // Mold Created From Cascade (on-blur create flow)
  // ============================================================================

  const mutableMoldCollectionId = useMutableCollection(
    workspace.data.entities.molds.collections,
    [workspace, reactiveWorkspace.version],
    workspace.settings?.getResolvedSettings().defaultTargets.molds
  );

  const handleMoldCreated = useCallback(
    (entity: EntitiesNS.Molds.IMoldEntity, _source: 'manual' | 'ai'): void => {
      if (!mutableMoldCollectionId) return;
      const baseId = entity.baseId as BaseMoldId;
      const colResult = workspace.data.entities.molds.collections.get(mutableMoldCollectionId);
      if (colResult.isFailure() || !colResult.value.isMutable) return;
      const setResult = colResult.value.items.set(baseId, entity);
      if (setResult.isFailure()) return;
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // Pop the mold create column, return to inventory create with the new mold pre-selected
      const newMoldId = `${mutableMoldCollectionId}.${baseId}` as MoldId;
      setCreatePrefill((prev) => ({
        ...prev,
        moldId: newMoldId,
        moldName: entity.name
      }));
      squashCascade([
        {
          entityType: 'mold-inventory-entry',
          entityId: '__new__',
          mode: 'create',
          prefillName: newMoldId
        }
      ]);
    },
    [mutableMoldCollectionId, workspace, reactiveWorkspace, squashCascade]
  );

  const handleCancelMoldCreate = useCallback((): void => {
    // Pop the mold create column, return to inventory create
    squashCascade([{ entityType: 'mold-inventory-entry', entityId: '__new__', mode: 'create' }]);
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
          moldId: target.moldId,
          moldName: target.moldName,
          locationId: createResult.value,
          locationName: name
        });
        squashCascade([
          {
            entityType: 'mold-inventory-entry',
            entityId: '__new__',
            mode: 'create',
            prefillName: target.moldId
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
          entityType: 'mold-inventory-entry',
          entityId: '__new__',
          mode: 'create',
          prefillName: target.moldId
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
        e.entityId === entityId && e.entityType === 'mold-inventory-entry'
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
        e.entityId === entityId && e.entityType === 'mold-inventory-entry'
          ? { ...e, mode: 'view' as const }
          : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  const handleSave = useCallback(
    async (
      entryId: MoldInventoryEntryId,
      entity: Entities.Inventory.IMoldInventoryEntryEntity
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
        // Switch back to view mode
        const updated = cascadeStack.map((e) =>
          e.entityId === entryId && e.entityType === 'mold-inventory-entry'
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
    (entryId: MoldInventoryEntryId, text: string): void => {
      setLocationCreateTarget({ kind: 'edit', entryId });
      squashCascade([
        ...cascadeStack,
        { entityType: 'location', entityId: '__new__', mode: 'create', prefillName: text }
      ]);
    },
    [cascadeStack, squashCascade]
  );

  // ============================================================================
  // Browse Mold from Detail (drill-down)
  // ============================================================================

  const handleBrowseMold = useCallback(
    (inventoryEntry: ICascadeEntry, moldId: MoldId): void => {
      squashCascade([inventoryEntry, { entityType: 'mold', entityId: moldId, mode: 'view' }]);
    },
    [squashCascade]
  );

  // ============================================================================
  // Cascade Columns
  // ============================================================================

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, _index) => {
      // Mold create (from on-blur cascade)
      if (entry.entityType === 'mold' && entry.mode === 'create') {
        return {
          key: '__new__mold',
          label: 'New Mold',
          content: (
            <EntityCreateForm<Entities.Molds.IMoldEntity>
              slugify={slugify}
              buildPrompt={AiAssist.buildMoldAiPrompt}
              convert={(from: unknown): ReturnType<typeof Entities.Molds.Converters.moldEntity.convert> =>
                Entities.Molds.Converters.moldEntity.convert(from)
              }
              makeBlank={(name: string, id: string): Entities.Molds.IMoldEntity =>
                createBlankMoldEntity(id as BaseMoldId, '', name)
              }
              onCreate={handleMoldCreated}
              onCancel={handleCancelMoldCreate}
              namePlaceholder="e.g. Chocolate World CW1000"
              entityLabel="Mold"
              initialName={entry.prefillName}
            />
          )
        };
      }

      // Mold view (drill-down from inventory entry)
      if (entry.entityType === 'mold' && entry.mode === 'view') {
        const result = workspace.data.molds.get(entry.entityId as MoldId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load mold: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: result.value.displayName,
          content: <MoldDetail mold={result.value} onClose={(): void => popCascadeTo(_index)} />
        };
      }

      // Inventory entry create
      if (entry.entityType === 'mold-inventory-entry' && entry.mode === 'create') {
        // If prefillName looks like a MoldId (contains '.'), try to pre-select it
        const prefillMoldId = createPrefill.moldId ?? entry.prefillName;
        const preSelectedMold = prefillMoldId
          ? moldSuggestions.find((s) => s.id === prefillMoldId)
          : undefined;

        return {
          key: '__new__inventory',
          label: 'New Entry',
          content: (
            <CreateMoldInventoryPanel
              moldSuggestions={moldSuggestions}
              locationSuggestions={locationSuggestions}
              onConfirm={handleCreateConfirm}
              onUnresolvedMold={handleUnresolvedMold}
              onUnresolvedLocation={handleUnresolvedLocation}
              onCancel={handleCancelCreate}
              initialMoldId={preSelectedMold?.id ?? createPrefill.moldId}
              initialMoldName={preSelectedMold?.name ?? createPrefill.moldName}
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
      if (entry.entityType === 'mold-inventory-entry' && entry.mode === 'view') {
        const result = workspace.userData.moldInventory.get(entry.entityId as MoldInventoryEntryId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load inventory entry: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: result.value.item.displayName,
          content: (
            <MoldInventoryEntryDetail
              entry={result.value}
              onEdit={(): void => handleEdit(entry.entityId)}
              onBrowseMold={(moldId: MoldId): void => handleBrowseMold(entry, moldId)}
              onClose={(): void => popCascadeTo(_index)}
            />
          )
        };
      }

      // Inventory entry edit
      if (entry.entityType === 'mold-inventory-entry' && entry.mode === 'edit') {
        const result = workspace.userData.moldInventory.get(entry.entityId as MoldInventoryEntryId);
        if (result.isFailure()) {
          return {
            key: `${entry.entityId}:edit`,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load inventory entry: {entry.entityId}</div>
          };
        }

        return {
          key: `${entry.entityId}:edit`,
          label: `${result.value.item.displayName} (editing)`,
          content: (
            <MoldInventoryEntryEditView
              entry={result.value}
              locationSuggestions={locationSuggestions}
              initialLocationId={editLocationPrefillById[entry.entityId]?.id}
              initialLocationName={editLocationPrefillById[entry.entityId]?.name}
              onSave={(entity): void => {
                void handleSave(entry.entityId as MoldInventoryEntryId, entity);
              }}
              onUnresolvedLocation={(text: string): void =>
                handleUnresolvedLocationFromEdit(entry.entityId as MoldInventoryEntryId, text)
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
    moldSuggestions,
    locationSuggestions,
    popCascadeTo,
    handleCreateConfirm,
    handleCancelCreate,
    handleUnresolvedMold,
    handleUnresolvedLocation,
    handleCreateLocationConfirm,
    handleCancelLocationCreate,
    handleMoldCreated,
    handleCancelMoldCreate,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleUnresolvedLocationFromEdit,
    handleRequestDelete,
    handleBrowseMold,
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
                data-testid="mold-inventory-new-entry-button"
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
              <EntityList<IMoldInventoryListEntry, MoldInventoryEntryId>
                entities={useFilteredEntities(inventoryEntries, MOLD_INVENTORY_FILTER_SPEC)}
                descriptor={MOLD_INVENTORY_DESCRIPTOR}
                selectedId={selectedId}
                onSelect={handleSelect}
                onDelete={handleRequestDelete}
                canDelete={canDelete}
                onDrill={collapseList}
                emptyState={{
                  title: 'No Mold Inventory',
                  description: 'No molds in inventory. Add your first mold to start tracking.'
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
