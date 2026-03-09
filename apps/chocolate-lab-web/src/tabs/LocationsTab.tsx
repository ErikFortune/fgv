import React, { useCallback, useMemo, useState } from 'react';
import {
  ConfirmDialog,
  EntityList,
  type ICascadeColumn,
  EntityTabLayout,
  useMessages
} from '@fgv/ts-app-shell';
import { type BaseLocationId, type LocationId, Entities } from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useTabNavigation,
  useEntityList,
  useFilteredEntities,
  LocationDetail,
  LocationEditView,
  CreateLocationPanel,
  useLocationActions
} from '@fgv/chocolate-lab-ui';

import {
  LOCATION_DESCRIPTOR,
  LOCATION_FILTER_SPEC,
  type ILocationListEntry,
  createBlankLocationEntity
} from '../shared';

type ILocationEntity = Entities.Locations.ILocationEntity;

// ============================================================================
// Tab Content
// ============================================================================

export function LocationsTabContent(): React.ReactElement {
  const {
    workspace,
    reactiveWorkspace,
    squashCascade,
    popCascadeTo,
    cascadeStack,
    listCollapsed,
    collapseList
  } = useTabNavigation();

  const locationActions = useLocationActions();
  const { addMessage } = useMessages();

  // ============================================================================
  // Entity List — wraps location entities with composite IDs
  // ============================================================================

  const { entities: locationEntries, selectedId } = useEntityList<ILocationListEntry, LocationId>({
    getAll: () => {
      const entries: ILocationListEntry[] = [];
      for (const [id, entity] of workspace.userData.entities.locations.entries()) {
        entries.push({ id, entity });
      }
      return entries;
    },
    compare: (a, b) => {
      return a.entity.name.localeCompare(b.entity.name);
    },
    entityType: 'location',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  // ============================================================================
  // Selection Handler
  // ============================================================================

  const handleSelect = useCallback(
    (id: LocationId): void => {
      const entry: ICascadeEntry = { entityType: 'location', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // ============================================================================
  // Delete Handler
  // ============================================================================

  const [locationToDelete, setLocationToDelete] = useState<{
    id: LocationId;
    name: string;
  } | null>(null);

  const handleRequestDelete = useCallback(
    (id: LocationId): void => {
      const result = workspace.userData.entities.locations.get(id);
      const name = result.isSuccess() ? result.value.name : id;
      setLocationToDelete({ id, name });
    },
    [workspace]
  );

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    if (locationToDelete) {
      const result = await locationActions.deleteLocation(locationToDelete.id);
      if (result.isSuccess()) {
        if (selectedId === locationToDelete.id) {
          squashCascade([]);
        }
      } else {
        addMessage('error', `Failed to delete location: ${result.message}`);
      }
    }
    setLocationToDelete(null);
  }, [locationToDelete, locationActions, selectedId, squashCascade, addMessage]);

  const handleCancelDelete = useCallback((): void => {
    setLocationToDelete(null);
  }, []);

  const canDelete = useCallback(
    (_id: LocationId): boolean => {
      return locationActions.defaultCollectionId !== undefined;
    },
    [locationActions]
  );

  // ============================================================================
  // New Location
  // ============================================================================

  const handleNewLocation = useCallback((): void => {
    const entry: ICascadeEntry = {
      entityType: 'location',
      entityId: '__new__',
      mode: 'create'
    };
    squashCascade([entry]);
  }, [squashCascade]);

  const handleCreateConfirm = useCallback(
    async (baseId: string, name: string, description?: string): Promise<void> => {
      const entity = createBlankLocationEntity(baseId as BaseLocationId, name);
      const entityWithDescription: ILocationEntity = description ? { ...entity, description } : entity;

      const result = await locationActions.addLocation(baseId as BaseLocationId, entityWithDescription);
      if (result.isSuccess()) {
        squashCascade([{ entityType: 'location', entityId: result.value, mode: 'view' }]);
      } else {
        addMessage('error', `Failed to create location: ${result.message}`);
      }
    },
    [locationActions, squashCascade, addMessage]
  );

  const handleCancelCreate = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  // ============================================================================
  // Edit Handler
  // ============================================================================

  const handleEdit = useCallback(
    (entityId: string): void => {
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'location' ? { ...e, mode: 'edit' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  const handleCancelEdit = useCallback(
    (entityId: string): void => {
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'location' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  const handleSave = useCallback(
    async (locationId: LocationId, entity: ILocationEntity): Promise<void> => {
      const result = await locationActions.updateLocation(locationId, entity);
      if (result.isSuccess()) {
        const updated = cascadeStack.map((e) =>
          e.entityId === locationId && e.entityType === 'location' ? { ...e, mode: 'view' as const } : e
        );
        squashCascade(updated);
      } else {
        addMessage('error', `Failed to update location: ${result.message}`);
      }
    },
    [locationActions, cascadeStack, squashCascade, addMessage]
  );

  // ============================================================================
  // Cascade Columns
  // ============================================================================

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, _index) => {
      // Location create
      if (entry.entityType === 'location' && entry.mode === 'create') {
        return {
          key: '__new__location',
          label: 'New Location',
          content: (
            <CreateLocationPanel
              onConfirm={handleCreateConfirm}
              onCancel={handleCancelCreate}
              initialName={entry.prefillName}
            />
          )
        };
      }

      // Location view
      if (entry.entityType === 'location' && entry.mode === 'view') {
        const result = workspace.userData.entities.locations.get(entry.entityId as LocationId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load location: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <LocationDetail
              locationId={entry.entityId as LocationId}
              entity={result.value}
              onEdit={(): void => handleEdit(entry.entityId)}
              onDelete={(): void => handleRequestDelete(entry.entityId as LocationId)}
              onClose={(): void => popCascadeTo(_index)}
            />
          )
        };
      }

      // Location edit
      if (entry.entityType === 'location' && entry.mode === 'edit') {
        const result = workspace.userData.entities.locations.get(entry.entityId as LocationId);
        if (result.isFailure()) {
          return {
            key: `${entry.entityId}:edit`,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load location: {entry.entityId}</div>
          };
        }

        return {
          key: `${entry.entityId}:edit`,
          label: `${result.value.name} (editing)`,
          content: (
            <LocationEditView
              locationId={entry.entityId as LocationId}
              entity={result.value}
              onSave={(entity): void => {
                void handleSave(entry.entityId as LocationId, entity);
              }}
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
    popCascadeTo,
    handleCreateConfirm,
    handleCancelCreate,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleRequestDelete
  ]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <ConfirmDialog
        isOpen={locationToDelete !== null}
        title="Delete Location"
        message={
          <>
            Remove <strong>{locationToDelete?.name}</strong>? This cannot be undone.
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
                onClick={handleNewLocation}
                data-testid="locations-new-entry-button"
                disabled={locationActions.defaultCollectionId === undefined}
                title={
                  locationActions.defaultCollectionId === undefined
                    ? 'No mutable collection available'
                    : undefined
                }
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-choco-primary hover:bg-choco-primary/90 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                + New Location
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EntityList<ILocationListEntry, LocationId>
                entities={useFilteredEntities(locationEntries, LOCATION_FILTER_SPEC)}
                descriptor={LOCATION_DESCRIPTOR}
                selectedId={selectedId}
                onSelect={handleSelect}
                onDelete={handleRequestDelete}
                canDelete={canDelete}
                onDrill={collapseList}
                emptyState={{
                  title: 'No Locations',
                  description: 'No locations defined. Add your first location to start organizing.'
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
