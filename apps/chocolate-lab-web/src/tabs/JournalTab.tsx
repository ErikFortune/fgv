import React, { useCallback, useMemo } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout } from '@fgv/ts-app-shell';
import type {
  ConfectionId,
  Entities,
  FillingId,
  FillingRecipeVariationSpec,
  IngredientId,
  JournalId,
  MoldId,
  ProcedureId
} from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useTabNavigation,
  useEntityList,
  useFilteredEntities,
  JournalEntryDetail,
  ProducedFillingDetail,
  IngredientDetail,
  ProcedureDetail,
  FillingDetail,
  MoldDetail,
  ConfectionDetail
} from '@fgv/chocolate-lab-ui';

import { JOURNAL_DESCRIPTOR, JOURNAL_FILTER_SPEC, type IJournalListEntry } from '../shared';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Finds the produced filling for a given slot ID within a confection production
 * journal entry's embedded filling slots.
 */
function findProducedFilling(
  journalEntry: ICascadeEntry,
  slotId: string,
  workspace: ReturnType<typeof useTabNavigation>['workspace']
): Entities.Fillings.IProducedFillingEntity | undefined {
  const journalResult = workspace.userData.journals.get(journalEntry.entityId as JournalId);
  if (journalResult.isFailure()) return undefined;

  const entry = journalResult.value;
  if (entry.entity.type !== 'confection-production') return undefined;

  const confectionEntry = entry.entity as Entities.Journal.IConfectionProductionJournalEntryEntity;
  const slot = confectionEntry.produced.fillings?.find((s) => s.slotId === slotId);
  if (!slot || slot.slotType !== 'recipe') return undefined;
  return slot.produced;
}

// ============================================================================
// Tab Content
// ============================================================================

export function JournalTabContent(): React.ReactElement {
  const {
    workspace,
    reactiveWorkspace,
    squashCascade,
    popCascadeTo,
    cascadeStack,
    listCollapsed,
    collapseList
  } = useTabNavigation();

  // ============================================================================
  // Entity List — wraps materialized journal entries with composite IDs
  // ============================================================================

  const { entities: journalEntries, selectedId } = useEntityList<IJournalListEntry, JournalId>({
    getAll: () => {
      const entries: IJournalListEntry[] = [];
      for (const [id, entry] of workspace.userData.journals.entries()) {
        entries.push({ id, entry });
      }
      return entries;
    },
    compare: (a, b) => {
      // Newest first
      return b.entry.timestamp.localeCompare(a.entry.timestamp);
    },
    entityType: 'journal-entry',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  // ============================================================================
  // Selection Handler
  // ============================================================================

  const handleSelect = useCallback(
    (id: JournalId): void => {
      const entry: ICascadeEntry = { entityType: 'journal-entry', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // ============================================================================
  // Cascade Drill-Down Helpers
  // ============================================================================

  const handleBrowseIngredientFromJournal = useCallback(
    (journalEntry: ICascadeEntry, ingredientId: IngredientId): void => {
      squashCascade([journalEntry, { entityType: 'ingredient', entityId: ingredientId, mode: 'view' }]);
    },
    [squashCascade]
  );

  const handleBrowseProcedureFromJournal = useCallback(
    (journalEntry: ICascadeEntry, procedureId: ProcedureId): void => {
      squashCascade([journalEntry, { entityType: 'procedure', entityId: procedureId, mode: 'view' }]);
    },
    [squashCascade]
  );

  const handleOpenFillingRecipeFromJournal = useCallback(
    (journalEntry: ICascadeEntry, fillingId: FillingId, variationSpec: FillingRecipeVariationSpec): void => {
      squashCascade([
        journalEntry,
        { entityType: 'filling', entityId: fillingId, mode: 'view', prefillName: variationSpec }
      ]);
    },
    [squashCascade]
  );

  const handleViewFillingSlotFromJournal = useCallback(
    (journalEntry: ICascadeEntry, fillingId: FillingId, slotId: string): void => {
      squashCascade([
        journalEntry,
        { entityType: 'filling', entityId: fillingId, mode: 'view', embeddedSlotId: slotId }
      ]);
    },
    [squashCascade]
  );

  const handleBrowseMoldFromJournal = useCallback(
    (journalEntry: ICascadeEntry, moldId: MoldId): void => {
      squashCascade([journalEntry, { entityType: 'mold', entityId: moldId, mode: 'view' }]);
    },
    [squashCascade]
  );

  const handleBrowseConfectionRecipeFromJournal = useCallback(
    (journalEntry: ICascadeEntry, confectionId: ConfectionId): void => {
      squashCascade([journalEntry, { entityType: 'confection', entityId: confectionId, mode: 'view' }]);
    },
    [squashCascade]
  );

  // ============================================================================
  // Cascade Columns
  // ============================================================================

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, _index) => {
      if (entry.entityType === 'journal-entry') {
        const result = workspace.userData.journals.get(entry.entityId as JournalId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load journal entry: {entry.entityId}</div>
          };
        }

        const journalEntry = result.value;
        return {
          key: entry.entityId,
          label: journalEntry.recipe.name,
          content: (
            <JournalEntryDetail
              entry={journalEntry}
              onClose={(): void => popCascadeTo(_index)}
              onBrowseIngredient={(id: IngredientId): void => handleBrowseIngredientFromJournal(entry, id)}
              onBrowseProcedure={(id: ProcedureId): void => handleBrowseProcedureFromJournal(entry, id)}
              onOpenFillingRecipe={(id: FillingId, spec: FillingRecipeVariationSpec): void =>
                handleOpenFillingRecipeFromJournal(entry, id, spec)
              }
              onViewFillingSlot={(fillingId: FillingId, slotId: string): void =>
                handleViewFillingSlotFromJournal(entry, fillingId, slotId)
              }
              onBrowseMold={(id: MoldId): void => handleBrowseMoldFromJournal(entry, id)}
              onBrowseConfectionRecipe={(id: ConfectionId): void =>
                handleBrowseConfectionRecipeFromJournal(entry, id)
              }
            />
          )
        };
      }

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

      if (entry.entityType === 'procedure' && entry.mode === 'view') {
        const result = workspace.data.procedures.get(entry.entityId as ProcedureId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load procedure: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: <ProcedureDetail procedure={result.value} onClose={(): void => popCascadeTo(_index)} />
        };
      }

      if (entry.entityType === 'filling') {
        // Embedded produced filling from a confection production journal entry
        if (entry.embeddedSlotId && _index > 0) {
          const parentEntry = cascadeStack[_index - 1];
          const produced = findProducedFilling(parentEntry, entry.embeddedSlotId, workspace);
          const fillingResult = workspace.data.fillings.get(entry.entityId as FillingId);
          const fillingName = fillingResult.isSuccess() ? fillingResult.value.name : String(entry.entityId);

          if (produced) {
            return {
              key: `${entry.entityId}:slot:${entry.embeddedSlotId}`,
              label: fillingName,
              content: (
                <ProducedFillingDetail
                  produced={produced}
                  fillingName={fillingName}
                  onClose={(): void => popCascadeTo(_index)}
                  onBrowseIngredient={(id: IngredientId): void =>
                    squashCascade([
                      ...cascadeStack.slice(0, _index + 1),
                      { entityType: 'ingredient', entityId: id, mode: 'view' }
                    ])
                  }
                  onBrowseProcedure={(id: ProcedureId): void =>
                    squashCascade([
                      ...cascadeStack.slice(0, _index + 1),
                      { entityType: 'procedure', entityId: id, mode: 'view' }
                    ])
                  }
                  onOpenFillingRecipe={(id: FillingId, spec: FillingRecipeVariationSpec): void =>
                    squashCascade([
                      ...cascadeStack.slice(0, _index + 1),
                      { entityType: 'filling', entityId: id, mode: 'view', prefillName: spec }
                    ])
                  }
                />
              )
            };
          }

          // Fall through to generic filling detail if produced data not found
        }

        // Standard filling recipe browser
        const result = workspace.data.fillings.get(entry.entityId as FillingId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load filling: {entry.entityId}</div>
          };
        }

        return {
          key: `${entry.entityId}:${entry.prefillName ?? ''}`,
          label: result.value.name,
          content: (
            <FillingDetail
              filling={result.value}
              defaultVariationSpec={entry.prefillName as FillingRecipeVariationSpec | undefined}
              onClose={(): void => popCascadeTo(_index)}
            />
          )
        };
      }

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

      if (entry.entityType === 'confection' && entry.mode === 'view') {
        const result = workspace.data.confections.get(entry.entityId as ConfectionId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load confection: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: result.value.name,
          content: <ConfectionDetail confection={result.value} />
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
    squashCascade,
    handleBrowseIngredientFromJournal,
    handleBrowseProcedureFromJournal,
    handleOpenFillingRecipeFromJournal,
    handleViewFillingSlotFromJournal,
    handleBrowseMoldFromJournal,
    handleBrowseConfectionRecipeFromJournal
  ]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <EntityTabLayout
      list={
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <EntityList<IJournalListEntry, JournalId>
              entities={useFilteredEntities(journalEntries, JOURNAL_FILTER_SPEC)}
              descriptor={JOURNAL_DESCRIPTOR}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDrill={collapseList}
              emptyState={{
                title: 'No Journal Entries',
                description: 'Journal entries are created when you commit a session.'
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
  );
}
