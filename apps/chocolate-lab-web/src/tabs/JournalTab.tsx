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
  isJournalEntryCascadeEntry,
  isIngredientCascadeEntry,
  isProcedureCascadeEntry,
  isFillingCascadeEntry,
  isMoldCascadeEntry,
  isConfectionCascadeEntry,
  useTabNavigation,
  useCascadeOps,
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
  slotId: string
): Entities.Fillings.IProducedFillingEntity | undefined {
  if (!isJournalEntryCascadeEntry(journalEntry) || !journalEntry.entity) return undefined;

  const entry = journalEntry.entity;
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
  const { workspace, reactiveWorkspace, popCascadeTo, listCollapsed, collapseList } = useTabNavigation();

  const cascade = useCascadeOps();

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
    cascadeStack: cascade.stack,
    deps: [workspace, reactiveWorkspace.version]
  });

  // ============================================================================
  // Selection Handler
  // ============================================================================

  const handleSelect = useCallback(
    (id: JournalId): void => {
      cascade.select({
        entityType: 'journal-entry',
        entityId: id,
        entity: workspace.userData.journals.get(id).report(workspace.data.logger).orDefault()
      });
    },
    [cascade, workspace]
  );

  // ============================================================================
  // Cascade Drill-Down Helpers
  // ============================================================================

  const handleBrowseIngredientFromJournal = useCallback(
    (_journalEntry: ICascadeEntry, ingredientId: IngredientId): void => {
      cascade.drillDown(0, {
        entityType: 'ingredient',
        entityId: ingredientId,
        entity: workspace.data.ingredients.get(ingredientId).report(workspace.data.logger).orDefault()
      });
    },
    [cascade, workspace]
  );

  const handleBrowseProcedureFromJournal = useCallback(
    (_journalEntry: ICascadeEntry, procedureId: ProcedureId): void => {
      cascade.drillDown(0, {
        entityType: 'procedure',
        entityId: procedureId,
        entity: workspace.data.procedures.get(procedureId).report(workspace.data.logger).orDefault()
      });
    },
    [cascade, workspace]
  );

  const handleOpenFillingRecipeFromJournal = useCallback(
    (_journalEntry: ICascadeEntry, fillingId: FillingId, variationSpec: FillingRecipeVariationSpec): void => {
      cascade.drillDown(0, {
        entityType: 'filling',
        entityId: fillingId,
        prefillName: variationSpec,
        entity: workspace.data.fillings.get(fillingId).report(workspace.data.logger).orDefault()
      });
    },
    [cascade, workspace]
  );

  const handleViewFillingSlotFromJournal = useCallback(
    (_journalEntry: ICascadeEntry, fillingId: FillingId, slotId: string): void => {
      cascade.drillDown(0, {
        entityType: 'filling',
        entityId: fillingId,
        embeddedSlotId: slotId,
        entity: workspace.data.fillings.get(fillingId).report(workspace.data.logger).orDefault()
      });
    },
    [cascade, workspace]
  );

  const handleBrowseMoldFromJournal = useCallback(
    (_journalEntry: ICascadeEntry, moldId: MoldId): void => {
      cascade.drillDown(0, {
        entityType: 'mold',
        entityId: moldId,
        entity: workspace.data.molds.get(moldId).report(workspace.data.logger).orDefault()
      });
    },
    [cascade, workspace]
  );

  const handleBrowseConfectionRecipeFromJournal = useCallback(
    (_journalEntry: ICascadeEntry, confectionId: ConfectionId): void => {
      cascade.drillDown(0, {
        entityType: 'confection',
        entityId: confectionId,
        entity: workspace.data.confections.get(confectionId).report(workspace.data.logger).orDefault()
      });
    },
    [cascade, workspace]
  );

  // ============================================================================
  // Cascade Columns
  // ============================================================================

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascade.stack.map((entry, _index) => {
      if (isJournalEntryCascadeEntry(entry)) {
        const journalEntry = entry.entity;
        if (!journalEntry) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load journal entry: {entry.entityId}</div>
          };
        }

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

      if (isIngredientCascadeEntry(entry) && entry.mode === 'view') {
        const ingredient = entry.entity;
        if (!ingredient) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load ingredient: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: ingredient.name,
          content: <IngredientDetail ingredient={ingredient} onClose={(): void => popCascadeTo(_index)} />
        };
      }

      if (isProcedureCascadeEntry(entry) && entry.mode === 'view') {
        const procedure = entry.entity;
        if (!procedure) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load procedure: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: procedure.name,
          content: <ProcedureDetail procedure={procedure} onClose={(): void => popCascadeTo(_index)} />
        };
      }

      if (isFillingCascadeEntry(entry)) {
        // Embedded produced filling from a confection production journal entry
        if (entry.embeddedSlotId && _index > 0) {
          const parentEntry = cascade.stack[_index - 1];
          const produced = findProducedFilling(parentEntry, entry.embeddedSlotId);
          const filling = entry.entity;
          const fillingName = filling ? filling.name : String(entry.entityId);

          if (produced) {
            return {
              key: `${entry.entityId}:slot:${entry.embeddedSlotId}`,
              label: fillingName,
              content: (
                <ProducedFillingDetail
                  produced={produced}
                  fillingName={fillingName}
                  onClose={(): void => popCascadeTo(_index)}
                  onBrowseIngredient={(id: IngredientId): void => {
                    cascade.drillDown(_index, {
                      entityType: 'ingredient',
                      entityId: id,
                      entity: workspace.data.ingredients.get(id).report(workspace.data.logger).orDefault()
                    });
                  }}
                  onBrowseProcedure={(id: ProcedureId): void => {
                    cascade.drillDown(_index, {
                      entityType: 'procedure',
                      entityId: id,
                      entity: workspace.data.procedures.get(id).report(workspace.data.logger).orDefault()
                    });
                  }}
                  onOpenFillingRecipe={(id: FillingId, spec: FillingRecipeVariationSpec): void => {
                    cascade.drillDown(_index, {
                      entityType: 'filling',
                      entityId: id,
                      prefillName: spec,
                      entity: workspace.data.fillings.get(id).report(workspace.data.logger).orDefault()
                    });
                  }}
                />
              )
            };
          }

          // Fall through to generic filling detail if produced data not found
        }

        // Standard filling recipe browser
        const filling = entry.entity;
        if (!filling) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load filling: {entry.entityId}</div>
          };
        }

        return {
          key: `${entry.entityId}:${entry.prefillName ?? ''}`,
          label: filling.name,
          content: (
            <FillingDetail
              filling={filling}
              defaultVariationSpec={entry.prefillName as FillingRecipeVariationSpec | undefined}
              onClose={(): void => popCascadeTo(_index)}
            />
          )
        };
      }

      if (isMoldCascadeEntry(entry) && entry.mode === 'view') {
        const mold = entry.entity;
        if (!mold) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load mold: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: mold.displayName,
          content: <MoldDetail mold={mold} onClose={(): void => popCascadeTo(_index)} />
        };
      }

      if (isConfectionCascadeEntry(entry) && entry.mode === 'view') {
        const confection = entry.entity;
        if (!confection) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load confection: {entry.entityId}</div>
          };
        }

        return {
          key: entry.entityId,
          label: confection.name,
          content: <ConfectionDetail confection={confection} />
        };
      }

      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4 text-gray-500">Unknown entity type: {entry.entityType}</div>
      };
    });
  }, [
    cascade,
    workspace,
    popCascadeTo,
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
