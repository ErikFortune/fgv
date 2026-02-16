import React, { useCallback, useMemo, useRef } from 'react';
import { CursorArrowRaysIcon } from '@heroicons/react/20/solid';
import { EntityList, type ICascadeColumn, EntityTabLayout, type IComparisonColumn } from '@fgv/ts-app-shell';
import { AiAssist, Editing, Entities, LibraryRuntime } from '@fgv/ts-chocolate';
import type { BaseIngredientId, CollectionId, IngredientId } from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useNavigationStore,
  useWorkspace,
  useReactiveWorkspace,
  IngredientDetail,
  IngredientEditView,
  EntityCreateForm,
  useFilteredEntities
} from '@fgv/chocolate-lab-ui';

import {
  INGREDIENT_DESCRIPTOR,
  INGREDIENT_FILTER_SPEC,
  slugify,
  createBlankIngredientEntity
} from '../shared';

export function IngredientsTabContent(): React.ReactElement {
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

  // Editing wrapper ref — persists the EditedIngredient across re-renders while editing.
  // Keyed by entity ID so switching ingredients creates a fresh wrapper.
  const editingRef = useRef<{ id: string; wrapper: LibraryRuntime.EditedIngredient } | undefined>(undefined);

  // Find the first mutable collection ID (memoized)
  const mutableCollectionId = useMemo<CollectionId | undefined>(() => {
    const collections = workspace.data.entities.ingredients.collections;
    for (const [id, col] of collections.entries()) {
      if (col.isMutable) {
        return id as CollectionId;
      }
    }
    return undefined;
  }, [workspace, reactiveWorkspace.version]);

  // Create a new ingredient from an entity, add to mutable collection, and open in edit mode
  const handleCreateIngredient = useCallback(
    (entity: Entities.Ingredients.IngredientEntity, source: 'manual' | 'ai'): void => {
      if (!mutableCollectionId) {
        workspace.data.logger.error('Cannot add ingredient: no mutable collection available');
        return;
      }

      const baseId = entity.baseId as BaseIngredientId;
      const compositeId = `${mutableCollectionId}.${baseId}` as IngredientId;

      // Check for duplicate
      const existing = workspace.data.ingredients.get(compositeId);
      if (existing.isSuccess()) {
        workspace.data.logger.error(`Ingredient '${compositeId}' already exists`);
        return;
      }

      // Add to in-memory collection
      const colResult = workspace.data.entities.ingredients.collections.get(mutableCollectionId);
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
        workspace.data.logger.error(`Failed to add ingredient: ${setResult.message}`);
        return;
      }

      // Invalidate caches so the new ingredient appears in the list
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

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

      const entry: ICascadeEntry = { entityType: 'ingredient', entityId: compositeId, mode: 'edit' };
      squashCascade([entry]);
    },
    [workspace, reactiveWorkspace, mutableCollectionId, squashCascade]
  );

  // Handle paste from the list header drop target button
  const handleListHeaderPaste = useCallback((): void => {
    navigator.clipboard.readText().then(
      (text) => {
        if (!text.trim()) {
          workspace.data.logger.info('Clipboard is empty');
          return;
        }

        // Strip markdown code fences
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

        const result = Entities.Ingredients.Converters.ingredientEntity.convert(parsed);
        if (result.isFailure()) {
          workspace.data.logger.error(`AI ingredient validation failed: ${result.message}`);
          return;
        }

        handleCreateIngredient(result.value, 'ai');
        workspace.data.logger.info(`Opened '${result.value.name}' for review — save when ready`);
      },
      () => {
        workspace.data.logger.error('Could not read clipboard — permission may be required');
      }
    );
  }, [workspace, handleCreateIngredient]);

  // Collect all ingredients into a sorted array (memoized on workspace version)
  const ingredients = useMemo<ReadonlyArray<LibraryRuntime.AnyIngredient>>(() => {
    return Array.from(workspace.data.ingredients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  // Selected ingredient ID = first cascade entry of type 'ingredient'
  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'ingredient'
      ? (cascadeStack[0].entityId as IngredientId)
      : undefined;

  const handleSelect = useCallback(
    (id: IngredientId): void => {
      const entry: ICascadeEntry = { entityType: 'ingredient', entityId: id, mode: 'view' };
      // Replace the cascade with just this ingredient
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // Switch a cascade entry from view → edit mode
  const handleEdit = useCallback(
    (entityId: string): void => {
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'ingredient' ? { ...e, mode: 'edit' as const } : e
      );
      squashCascade(updated);
    },
    [cascadeStack, squashCascade]
  );

  // Switch a cascade entry from edit → view mode (cancel editing)
  const handleCancelEdit = useCallback(
    (entityId: string): void => {
      // Discard the editing wrapper
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

  // "Save to..." handler — triggered when editing a read-only ingredient.
  const handleSaveAs = useCallback(
    (wrapper: LibraryRuntime.EditedIngredient): void => {
      const entity = wrapper.current;
      workspace.data.logger.info(
        `Save to... requested for '${entity.name}' — collection picker not yet implemented`
      );
    },
    [workspace]
  );

  // Save handler — persists the edited entity back to its collection via EditableCollection
  const handleSave = useCallback(
    (wrapper: LibraryRuntime.EditedIngredient): void => {
      const entity = wrapper.current;
      const compositeId = editingRef.current?.id;
      if (!compositeId) {
        workspace.data.logger.error('Save failed: no composite ID for editing wrapper');
        return;
      }

      // Semantic validation before persisting
      const validationResult = Editing.Ingredients.Validators.validateIngredientEntity(entity);
      if (validationResult.isFailure()) {
        workspace.data.logger.error(`Save failed: ${validationResult.message}`);
        return;
      }

      // Derive collection ID from composite ID (prefix before '.')
      const collectionId = compositeId.split('.')[0] as CollectionId;
      const baseId = entity.baseId as BaseIngredientId;

      // 1. Update the underlying library collection in-memory so the data is immediately consistent
      const collectionEntry = workspace.data.entities.ingredients.collections.get(collectionId);
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

      // 2. Persist to disk via EditableCollection (snapshot + sourceItem for YAML write)
      const editableResult = workspace.data.entities.getEditableIngredientsEntityCollection(collectionId);
      if (editableResult.isSuccess()) {
        const editable = editableResult.value;
        editable.set(baseId, entity);
        if (editable.canSave()) {
          const saveResult = editable.save();
          if (saveResult.isFailure()) {
            workspace.data.logger.error(`Disk save failed: ${saveResult.message}`);
          } else {
            workspace.data.logger.info(`Saved ingredient '${entity.name}' to collection '${collectionId}'`);
          }
        } else {
          workspace.data.logger.info(
            `Updated ingredient '${entity.name}' in-memory (collection '${collectionId}' has no backing file)`
          );
        }
      } else {
        workspace.data.logger.info(
          `Updated ingredient '${entity.name}' in-memory only: ${editableResult.message}`
        );
      }

      // 3. Invalidate caches and notify React so the UI reflects the saved data
      workspace.data.clearCache();
      reactiveWorkspace.notifyChange();

      // 4. Discard wrapper and switch back to view mode
      const entityId = compositeId;
      if (editingRef.current?.id === entityId) {
        editingRef.current = undefined;
      }
      const updated = cascadeStack.map((e) =>
        e.entityId === entityId && e.entityType === 'ingredient' ? { ...e, mode: 'view' as const } : e
      );
      squashCascade(updated);
    },
    [workspace, reactiveWorkspace, cascadeStack, squashCascade]
  );

  // Get or create an EditedIngredient wrapper for the given entity
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

  // Open the cascade in 'create' mode for a new ingredient
  const handleNewIngredient = useCallback((): void => {
    const entry: ICascadeEntry = { entityType: 'ingredient', entityId: '__new__', mode: 'create' };
    squashCascade([entry]);
  }, [squashCascade]);

  // EntityCreateForm onCreate callback — wraps handleCreateIngredient with the blank entity builder
  const handleCreateFormSubmit = useCallback(
    (entity: Entities.Ingredients.IngredientEntity, source: 'manual' | 'ai'): void => {
      handleCreateIngredient(entity, source);
    },
    [handleCreateIngredient]
  );

  // Cancel the create form — clear the cascade
  const handleCreateFormCancel = useCallback((): void => {
    squashCascade([]);
  }, [squashCascade]);

  // Build cascade columns from the cascade stack
  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack
      .filter((e) => e.entityType === 'ingredient')
      .map((entry) => {
        // Create mode: render EntityCreateForm
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
                onCreate={handleCreateFormSubmit}
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

        // Edit mode: render IngredientEditView
        if (entry.mode === 'edit') {
          const wrapper = getOrCreateWrapper(result.value);
          if (wrapper === undefined) {
            return {
              key: entry.entityId,
              label: result.value.name,
              content: <div className="p-4 text-red-500">Failed to create editing wrapper</div>
            };
          }

          // Detect whether the source collection is immutable
          const collectionId = entry.entityId.split('.')[0] as CollectionId;
          const collectionEntry = workspace.data.entities.ingredients.collections.get(collectionId);
          const isReadOnly = collectionEntry.isSuccess() && !collectionEntry.value.isMutable;

          return {
            key: `${entry.entityId}:edit`,
            label: `${result.value.name} (editing)`,
            content: (
              <IngredientEditView
                wrapper={wrapper}
                onSave={handleSave}
                onSaveAs={isReadOnly ? handleSaveAs : undefined}
                onCancel={(): void => handleCancelEdit(entry.entityId)}
                readOnly={isReadOnly}
              />
            )
          };
        }

        // View mode: render IngredientDetail with Edit button
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <IngredientDetail ingredient={result.value} onEdit={(): void => handleEdit(entry.entityId)} />
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
    handleCreateFormSubmit,
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
  );
}
