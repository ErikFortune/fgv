import React, { useCallback, useMemo, useRef } from 'react';
import { CursorArrowRaysIcon } from '@heroicons/react/20/solid';
import { EntityList, type ICascadeColumn, EntityTabLayout, type IComparisonColumn } from '@fgv/ts-app-shell';
import { AiAssist, Editing, Entities, LibraryRuntime } from '@fgv/ts-chocolate';
import type { BaseMoldId, CollectionId, MoldId } from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useNavigationStore,
  useWorkspace,
  useReactiveWorkspace,
  MoldDetail,
  MoldEditView,
  EntityCreateForm,
  useFilteredEntities
} from '@fgv/chocolate-lab-ui';

import { MOLD_DESCRIPTOR, MOLD_FILTER_SPEC, slugify, createBlankMoldEntity } from '../shared';

export function MoldsTabContent(): React.ReactElement {
  const workspace = useWorkspace();
  const reactiveWorkspace = useReactiveWorkspace();
  const squashCascade = useNavigationStore((s) => s.squashCascade);
  const popCascadeTo = useNavigationStore((s) => s.popCascadeTo);
  const cascadeStack = useNavigationStore((s) => s.cascadeStack);
  const listCollapsed = useNavigationStore((s) => s.listCollapsed);
  const collapseList = useNavigationStore((s) => s.collapseList);
  const compareMode = useNavigationStore((s) => s.compareMode);
  const compareIds = useNavigationStore((s) => s.compareIds);
  const toggleCompareMode = useNavigationStore((s) => s.toggleCompareMode);
  const toggleCompareId = useNavigationStore((s) => s.toggleCompareId);
  const showingComparison = useNavigationStore((s) => s.showingComparison);
  const startComparison = useNavigationStore((s) => s.startComparison);
  const exitComparison = useNavigationStore((s) => s.exitComparison);

  const editingRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedMold } | undefined>(undefined);

  const mutableCollectionId = useMemo<CollectionId | undefined>(() => {
    const collections = workspace.data.entities.molds.collections;
    for (const [id, col] of collections.entries()) {
      if (col.isMutable) {
        return id as CollectionId;
      }
    }
    return undefined;
  }, [workspace, reactiveWorkspace.version]);

  const handleCreateMold = useCallback(
    (entity: Entities.Molds.IMoldEntity, source: 'manual' | 'ai'): void => {
      if (!mutableCollectionId) {
        workspace.data.logger.error('Cannot add mold: no mutable collection available');
        return;
      }

      const baseId = entity.baseId as BaseMoldId;
      const compositeId = `${mutableCollectionId}.${baseId}` as MoldId;

      const existing = workspace.data.molds.get(compositeId);
      if (existing.isSuccess()) {
        workspace.data.logger.error(`Mold '${compositeId}' already exists`);
        return;
      }

      const colResult = workspace.data.entities.molds.collections.get(mutableCollectionId);
      if (colResult.isFailure()) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' not found: ${colResult.message}`);
        return;
      }
      if (!colResult.value.isMutable) {
        workspace.data.logger.error(`Collection '${mutableCollectionId}' is not mutable`);
        return;
      }
      const setResult = colResult.value.items.set(baseId, entity);
      if (setResult.isFailure()) {
        workspace.data.logger.error(`Failed to add mold: ${setResult.message}`);
        return;
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

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

      const entry: ICascadeEntry = { entityType: 'mold', entityId: compositeId, mode: 'edit' };
      squashCascade([entry]);
    },
    [workspace, reactiveWorkspace, mutableCollectionId, squashCascade]
  );

  const handleListHeaderPaste = useCallback((): void => {
    navigator.clipboard.readText().then(
      (text) => {
        if (!text.trim()) {
          workspace.data.logger.info('Clipboard is empty');
          return;
        }

        const stripped = text
          .trim()
          .replace(/^```(?:\w+)?\s*\n?([\s\S]*?)\n?\s*```$/, '$1')
          .trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(stripped);
        } catch (err: unknown) {
          const detail = err instanceof Error ? err.message : String(err);
          workspace.data.logger.error(`Clipboard does not contain valid JSON: ${detail}`);
          return;
        }

        const result = Entities.Molds.Converters.moldEntity.convert(parsed);
        if (result.isFailure()) {
          workspace.data.logger.error(`AI mold validation failed: ${result.message}`);
          return;
        }

        handleCreateMold(result.value, 'ai');
        workspace.data.logger.info(
          `Opened '${result.value.manufacturer} ${result.value.productNumber}' for review — save when ready`
        );
      },
      () => {
        workspace.data.logger.error('Could not read clipboard — permission may be required');
      }
    );
  }, [workspace, handleCreateMold]);

  const molds = useMemo<ReadonlyArray<LibraryRuntime.IMold>>(() => {
    return Array.from(workspace.data.molds.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [workspace, reactiveWorkspace.version]);

  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'mold'
      ? (cascadeStack[0].entityId as MoldId)
      : undefined;

  const handleSelect = useCallback(
    (id: MoldId): void => {
      const entry: ICascadeEntry = { entityType: 'mold', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  const handleEdit = useCallback(
    (entityId: string): void => {
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'mold' ? { ...e, mode: 'edit' as const } : e
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
        e.entityId === entityId && e.entityType === 'mold' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
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
    (wrapper: LibraryRuntime.EditedMold): void => {
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

      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseMoldId;

      const collectionEntry = workspace.data.entities.molds.collections.get(collectionId);
      if (collectionEntry.isFailure()) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' not found`);
        return;
      }
      if (!collectionEntry.value.isMutable) {
        workspace.data.logger.error(`Save failed: collection '${collectionId}' is immutable`);
        return;
      }
      const inMemoryResult = collectionEntry.value.items.set(baseId, entity);
      if (inMemoryResult.isFailure()) {
        workspace.data.logger.error(`Save failed (in-memory): ${inMemoryResult.message}`);
        return;
      }

      const editableResult = workspace.data.entities.getEditableMoldsEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          } else {
            workspace.data.logger.info(
              `Saved mold '${entity.manufacturer} ${entity.productNumber}' to collection '${collectionId}'`
            );
          }
        } else {
          workspace.data.logger.info(
            `Updated mold '${entity.manufacturer} ${entity.productNumber}' in-memory (collection '${collectionId}' has no backing file)`
          );
        }
      } else {
        workspace.data.logger.info(
          `Updated mold '${entity.manufacturer} ${entity.productNumber}' in-memory only: ${editableResult.message}`
        );
      }

      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      const entityId = compositeId;
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'mold' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
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
    const entry: ICascadeEntry = { entityType: 'mold', entityId: '__new__', mode: 'create' };
    squashCascade([entry]);
  }, [squashCascade]);

  const handleCreateFormSubmit = useCallback(
    (entity: Entities.Molds.IMoldEntity, source: 'manual' | 'ai'): void => {
      handleCreateMold(entity, source);
    },
    [handleCreateMold]
  );

  const handleCreateFormCancel = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack
      .filter((e) => e.entityType === 'mold')
      .map((entry) => {
        if (entry.mode === 'create') {
          return {
            key: '__new__',
            label: 'New Mold',
            content: (
              <EntityCreateForm<Entities.Molds.IMoldEntity>
                slugify={slugify}
                buildPrompt={AiAssist.buildMoldAiPrompt}
                convert={(from: unknown) => Entities.Molds.Converters.moldEntity.convert(from)}
                makeBlank={(name: string, id: string): Entities.Molds.IMoldEntity =>
                  createBlankMoldEntity(id as BaseMoldId, name)
                }
                onCreate={handleCreateFormSubmit}
                onCancel={handleCreateFormCancel}
                namePlaceholder="e.g. Chocolate World CW1000"
                entityLabel="Mold"
              />
            )
          };
        }

        const result = workspace.data.molds.get(entry.entityId as MoldId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load mold: {entry.entityId}</div>
          };
        }

        if (entry.mode === 'edit') {
          const wrapper = getOrCreateWrapper(result.value);
          if (wrapper === undefined) {
            return {
              key: entry.entityId,
              label: result.value.displayName,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }

          const collectionId = entry.entityId.split('.')[0] as CollectionId;
          const collectionEntry = workspace.data.entities.molds.collections.get(collectionId);
          const isReadOnly = collectionEntry.isSuccess() && !collectionEntry.value.isMutable;

          return {
            key: `${entry.entityId}:edit`,
            label: `${result.value.displayName} (editing)`,
            content: (
              <MoldEditView
                wrapper={wrapper}
                onSave={handleSave}
                onSaveAs={isReadOnly ? handleSaveAs : undefined}
                onCancel={(): void => handleCancelEdit(entry.entityId)}
                readOnly={isReadOnly}
              />
            )
          };
        }

        return {
          key: entry.entityId,
          label: result.value.displayName,
          content: <MoldDetail mold={result.value} onEdit={(): void => handleEdit(entry.entityId)} />
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
    handleCreateFormSubmit,
    handleCreateFormCancel
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
  );
}
