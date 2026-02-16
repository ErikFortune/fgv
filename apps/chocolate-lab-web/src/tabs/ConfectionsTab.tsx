import React, { useCallback, useMemo, useState } from 'react';
import { EntityList, type ICascadeColumn, EntityTabLayout, type IComparisonColumn } from '@fgv/ts-app-shell';
import { LibraryRuntime } from '@fgv/ts-chocolate';
import type {
  IngredientId,
  FillingId,
  MoldId,
  TaskId,
  ProcedureId,
  ConfectionId,
  DecorationId
} from '@fgv/ts-chocolate';
import {
  type ICascadeEntry,
  useNavigationStore,
  useWorkspace,
  useReactiveWorkspace,
  IngredientDetail,
  FillingDetail,
  MoldDetail,
  ProcedureDetail,
  TaskDetail,
  ConfectionDetail,
  DecorationDetail,
  useFilteredEntities
} from '@fgv/chocolate-lab-ui';

import { CONFECTION_DESCRIPTOR, CONFECTION_FILTER_SPEC } from '../shared';

export function ConfectionsTabContent(): React.ReactElement {
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
    { id: ConfectionId; specs: ReadonlyArray<string> } | undefined
  >(undefined);

  const confections = useMemo<ReadonlyArray<LibraryRuntime.AnyConfection>>(() => {
    return Array.from(workspace.data.confections.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [workspace, reactiveWorkspace.version]);

  const selectedId =
    cascadeStack.length > 0 && cascadeStack[0].entityType === 'confection'
      ? (cascadeStack[0].entityId as ConfectionId)
      : undefined;

  const handleSelect = useCallback(
    (id: ConfectionId): void => {
      const entry: ICascadeEntry = { entityType: 'confection', entityId: id, mode: 'view' };
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

  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry, index) => {
      // Per-pane drill-down callbacks that squash to the right of this pane
      const onIngredientClick = (id: IngredientId): void => {
        squashAt(index, { entityType: 'ingredient', entityId: id, mode: 'view' });
      };
      const onFillingClick = (id: FillingId): void => {
        squashAt(index, { entityType: 'filling', entityId: id, mode: 'view' });
      };
      const onMoldClick = (id: MoldId): void => {
        squashAt(index, { entityType: 'mold', entityId: id, mode: 'view' });
      };
      const onProcedureClick = (id: ProcedureId): void => {
        squashAt(index, { entityType: 'procedure', entityId: id, mode: 'view' });
      };
      const onDecorationClick = (id: DecorationId): void => {
        squashAt(index, { entityType: 'decoration', entityId: id, mode: 'view' });
      };
      const onTaskClick = (id: TaskId): void => {
        squashAt(index, { entityType: 'task', entityId: id, mode: 'view' });
      };

      if (entry.entityType === 'confection') {
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
          content: (
            <ConfectionDetail
              confection={result.value}
              onFillingClick={onFillingClick}
              onIngredientClick={onIngredientClick}
              onMoldClick={onMoldClick}
              onProcedureClick={onProcedureClick}
              onDecorationClick={onDecorationClick}
              onCompareVariations={(specs): void =>
                setVariationCompare({ id: entry.entityId as ConfectionId, specs })
              }
            />
          )
        };
      }
      if (entry.entityType === 'filling') {
        const result = workspace.data.fillings.get(entry.entityId as FillingId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load filling: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <FillingDetail
              filling={result.value}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
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
      if (entry.entityType === 'mold') {
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
          content: <MoldDetail mold={result.value} />
        };
      }
      if (entry.entityType === 'decoration') {
        const result = workspace.data.decorations.get(entry.entityId as DecorationId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load decoration: {entry.entityId}</div>
          };
        }
        return {
          key: entry.entityId,
          label: result.value.name,
          content: (
            <DecorationDetail
              decoration={result.value}
              onIngredientClick={onIngredientClick}
              onProcedureClick={onProcedureClick}
            />
          )
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
      const result = workspace.data.confections.get(id as ConfectionId);
      if (result.isFailure()) {
        return { key: id, label: id, content: <div className="p-4 text-red-500">Not found: {id}</div> };
      }
      return { key: id, label: result.value.name, content: <ConfectionDetail confection={result.value} /> };
    });
  }, [compareIds, workspace]);

  const variationCompareColumns = useMemo<ReadonlyArray<IComparisonColumn> | undefined>(() => {
    if (variationCompare === undefined) {
      return undefined;
    }
    const result = workspace.data.confections.get(variationCompare.id);
    if (result.isFailure()) {
      return undefined;
    }
    const confection = result.value;
    const specsSet = new Set(variationCompare.specs);
    return confection.variations
      .filter((v) => specsSet.has(v.variationSpec))
      .map((v) => ({
        key: v.variationSpec,
        label: `${confection.name} — ${v.variationSpec}${
          v.variationSpec === confection.goldenVariationSpec ? ' ★' : ''
        }`,
        content: <ConfectionDetail confection={confection} defaultVariationSpec={v.variationSpec} />
      }));
  }, [variationCompare, workspace]);

  return (
    <EntityTabLayout
      list={
        <EntityList<LibraryRuntime.IConfectionBase, ConfectionId>
          entities={useFilteredEntities(confections, CONFECTION_FILTER_SPEC)}
          descriptor={CONFECTION_DESCRIPTOR}
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
            title: 'No Confections',
            description: 'No confections found in the library.'
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
