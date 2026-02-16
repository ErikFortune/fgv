import React, { useCallback, useMemo, useState } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout, type IComparisonColumn } from '@fgv/ts-app-shell';
import { LibraryRuntime } from '@fgv/ts-chocolate';
import type { IngredientId, FillingId, TaskId, ProcedureId } from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useNavigationStore,
  useWorkspace,
  useReactiveWorkspace,
  IngredientDetail,
  FillingDetail,
  ProcedureDetail,
  TaskDetail,
  useFilteredEntities
} from '@fgv/chocolate-lab-ui';

import { FILLING_DESCRIPTOR, FILLING_FILTER_SPEC } from '../shared';

export function FillingsTabContent(): React.ReactElement {
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
  const [variationCompare, setVariationCompare] = useState<
    { id: FillingId; specs: ReadonlyArray<string> } | undefined
  >(undefined);

  // Collect all fillings into a sorted array (memoized on workspace version)
  const fillings = useMemo<ReadonlyArray<LibraryRuntime.FillingRecipe>>(() => {
    return Array.from(workspace.data.fillings.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  // Selected filling ID = first cascade entry of type 'filling'
  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'filling'
      ? (cascadeStack[0].entityId as FillingId)
      : undefined;

  const handleSelect = useCallback(
    (id: FillingId): void => {
      const entry: ICascadeEntry = { entityType: 'filling', entityId: id, mode: 'view' };
      squashCascade([entry]);
    },
    [squashCascade]
  );

  // Depth-aware squash: keep stack up to and including the pane at `depth`, then append the new entry.
  const squashAt = useCallback(
    (depth: number, entry: ICascadeEntry): void => {
      squashCascade([...cascadeStack.slice(0, depth + 1), entry]);
    },
    [squashCascade, cascadeStack]
  );

  // Build cascade columns from the cascade stack
  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, index) => {
      const onIngredientClick = (id: IngredientId): void => {
        squashAt(index, { entityType: 'ingredient', entityId: id, mode: 'view' });
      };
      const onProcedureClick = (id: ProcedureId): void => {
        squashAt(index, { entityType: 'procedure', entityId: id, mode: 'view' });
      };
      const onTaskClick = (id: TaskId): void => {
        squashAt(index, { entityType: 'task', entityId: id, mode: 'view' });
      };

      if (entry.entityType === 'filling') {
        const result = workspace.data.fillings.get(entry.entityId as FillingId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load filling: {entry.entityId}</div>
          };
        }
        const fillingId = entry.entityId as FillingId;
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <FillingDetail
              filling={result.value}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
              onCompareVariations={(specs): void => setVariationCompare({ id: fillingId, specs })}
            />
          )
        };
      }
      if (entry.entityType === 'ingredient') {
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
          content: <IngredientDetail ingredient={result.value} />
        };
      }
      if (entry.entityType === 'procedure') {
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
          content: <ProcedureDetail procedure={result.value} onTaskClick={onTaskClick} />
        };
      }
      if (entry.entityType === 'task') {
        const result = workspace.data.tasks.get(entry.entityId as TaskId);
        if (result.isFailure()) {
          // Check for inline task from parent procedure
          const parentProcEntry = cascadeStack
            .slice(0, index)
            .reverse()
            .find((e) => e.entityType === 'procedure');
          if (parentProcEntry) {
            const proc = workspace.data.procedures.get(parentProcEntry.entityId as ProcedureId);
            const steps = proc.isSuccess() ? proc.value.getSteps() : undefined;
            const inlineStep = steps?.isSuccess()
              ? steps.value.find((s) => s.isInline && s.resolvedTask.id === entry.entityId)
              : undefined;
            if (inlineStep) {
              return {
                key: entry.entityId,
                label: `${inlineStep.resolvedTask.name} (inline)`,
                content: <TaskDetail task={inlineStep.resolvedTask} />
              };
            }
          }
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load task: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: <TaskDetail task={result.value} />
        };
      }
      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4 text-gray-500">Unknown entity type: {entry.entityType}</div>
      };
    });
  }, [cascadeStack, workspace, squashAt]);

  const comparisonColumns = useMemo<ReadonlyArray<IComparisonColumn>>(() => {
    return Array.from(compareIds).map((id) => {
      const result = workspace.data.fillings.get(id as FillingId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <FillingDetail filling={result.value} /> };
    });
  }, [compareIds, workspace]);

  const variationCompareColumns = useMemo<ReadonlyArray<IComparisonColumn> | undefined>(() => {
    if (variationCompare === undefined) {
      return undefined;
    }
    const result = workspace.data.fillings.get(variationCompare.id);
    if (result.isFailure()) {
      return undefined;
    }
    const filling = result.value;
    const specsSet = new Set(variationCompare.specs);
    return filling.variations
      .filter((v) => specsSet.has(v.variationSpec))
      .map((v) => ({
        key: v.variationSpec,
        label: `${filling.name} — ${v.variationSpec}${
          v.variationSpec === filling.goldenVariationSpec ? ' ★' : ''
        }`,
        content: <FillingDetail filling={filling} defaultVariationSpec={v.variationSpec} />
      }));
  }, [variationCompare, workspace]);

  return (
    <EntityTabLayout
      list={
        <EntityList<LibraryRuntime.FillingRecipe, FillingId>
          entities={useFilteredEntities(fillings, FILLING_FILTER_SPEC)}
          descriptor={FILLING_DESCRIPTOR}
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
            title: 'No Fillings',
            description: 'No filling recipes found in the library.'
          }}
        />
      }
      cascadeColumns={cascadeColumns}
      onPopTo={popCascadeTo}
      listCollapsed={listCollapsed}
      onListCollapse={collapseList}
      compareMode={compareMode}
      comparisonColumns={comparisonColumns}
      showingComparison={showingComparison}
      onExitComparison={exitComparison}
      variationCompareColumns={variationCompareColumns}
      onExitVariationCompare={(): void => setVariationCompare(undefined)}
    />
  );
}
