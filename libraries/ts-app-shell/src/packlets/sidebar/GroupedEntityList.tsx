/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { IEntityDescriptor, IEmptyStateConfig, IEntityStatus } from './EntityList';

// ============================================================================
// Group Descriptor
// ============================================================================

/**
 * Extends {@link IEntityDescriptor} with grouping support.
 * @public
 */
export interface IEntityGroupDescriptor<TEntity, TId extends string = string>
  extends IEntityDescriptor<TEntity, TId> {
  /** Extract a group key from an entity. Entities with the same key are grouped together. */
  readonly getGroupKey: (entity: TEntity) => string;
  /** Extract a display label for a group. Called on the first entity in each group. */
  readonly getGroupLabel: (entity: TEntity) => string;
  /** Optional sort comparator for group ordering. Receives group keys. */
  readonly compareGroups?: (a: string, b: string) => number;
}

// ============================================================================
// GroupedEntityList Props
// ============================================================================

/**
 * Props for the {@link GroupedEntityList} component.
 * @public
 */
export interface IGroupedEntityListProps<TEntity, TId extends string = string> {
  /** The entities to display (pre-sorted within groups by the caller). */
  readonly entities: ReadonlyArray<TEntity>;
  /** Descriptor for extracting display and grouping properties. */
  readonly descriptor: IEntityGroupDescriptor<TEntity, TId>;
  /** Currently selected entity ID (if any). */
  readonly selectedId?: TId;
  /** Callback when an entity is selected (browse — list stays open). */
  readonly onSelect: (id: TId) => void;
  /** Callback when the user drills into the selected entity (Enter/Arrow Right — collapses list). */
  readonly onDrill?: () => void;
  /** Whether compare mode is active. */
  readonly compareMode?: boolean;
  /** Entity IDs currently checked for comparison. */
  readonly checkedIds?: ReadonlySet<string>;
  /** Callback to toggle an entity ID in/out of compare selection. */
  readonly onCheckedChange?: (id: TId) => void;
  /** Empty state configuration. */
  readonly emptyState?: IEmptyStateConfig;
  /** Callback to toggle compare mode. */
  readonly onToggleCompare?: () => void;
  /** Number of items selected for comparison. */
  readonly compareCount?: number;
  /** Callback to start comparison view. */
  readonly onStartComparison?: () => void;
  /** Callback to delete an entity. */
  readonly onDelete?: (id: TId) => void;
  /** Predicate to control per-entity delete button visibility. */
  readonly canDelete?: (id: TId) => boolean;
}

// ============================================================================
// Internal types
// ============================================================================

interface IEntityGroup<TEntity> {
  readonly key: string;
  readonly label: string;
  readonly items: ReadonlyArray<TEntity>;
}

// ============================================================================
// Row Component (mirrors EntityList row markup)
// ============================================================================

interface IGroupedEntityRowProps<TEntity, TId extends string> {
  readonly entity: TEntity;
  readonly descriptor: IEntityGroupDescriptor<TEntity, TId>;
  readonly selectedId?: TId;
  readonly compareMode?: boolean;
  readonly checkedIds?: ReadonlySet<string>;
  readonly onSelect: (id: TId) => void;
  readonly onDrill?: () => void;
  readonly onCheckedChange?: (id: TId) => void;
  readonly onDelete?: (id: TId) => void;
  readonly canDelete?: (id: TId) => boolean;
}

function GroupedEntityRowInner<TEntity, TId extends string>(
  props: IGroupedEntityRowProps<TEntity, TId>
): React.ReactElement {
  const {
    entity,
    descriptor,
    selectedId,
    compareMode,
    checkedIds,
    onSelect,
    onDrill,
    onCheckedChange,
    onDelete,
    canDelete
  } = props;

  const id = descriptor.getId(entity);
  const label = descriptor.getLabel(entity);
  const sublabel = descriptor.getSublabel?.(entity);
  const status: IEntityStatus | undefined = descriptor.getStatus?.(entity);
  const isSelected = id === selectedId;
  const isChecked = compareMode === true && checkedIds !== undefined && checkedIds.has(id);

  return (
    <div
      className={`group flex items-center gap-2 w-full border-b border-gray-50 transition-colors ${
        isChecked
          ? 'bg-choco-accent/10 border-l-2 border-l-choco-accent'
          : isSelected && !compareMode
          ? 'bg-choco-accent/10 border-l-2 border-l-choco-accent'
          : 'hover:bg-gray-50 border-l-2 border-l-transparent'
      }`}
    >
      <button
        data-entity-id={id}
        onClick={(): void => {
          if (compareMode && onCheckedChange) {
            onCheckedChange(id);
          } else if (isSelected && onDrill) {
            onDrill();
          } else {
            onSelect(id);
          }
        }}
        className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 text-left"
      >
        {compareMode && (
          <span
            className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors ${
              isChecked ? 'bg-choco-accent border-choco-accent text-white' : 'border-gray-300 bg-white'
            }`}
          >
            {isChecked && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm truncate ${
              (isSelected && !compareMode) || isChecked ? 'font-medium text-choco-primary' : 'text-gray-800'
            }`}
          >
            {label}
          </div>
          {sublabel && <div className="text-xs text-gray-500 truncate mt-0.5">{sublabel}</div>}
        </div>
        {status && (
          <span className="flex items-center gap-1 shrink-0 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${status.colorClass}`} />
            <span className="text-xs text-gray-500">{status.label}</span>
          </span>
        )}
      </button>

      {onDelete && !compareMode && (!canDelete || canDelete(id)) && (
        <button
          onClick={(e): void => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="shrink-0 mr-1 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded"
          title={`Delete ${label}`}
          aria-label={`Delete ${label}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

const GroupedEntityRow: typeof GroupedEntityRowInner = React.memo(
  GroupedEntityRowInner
) as typeof GroupedEntityRowInner;

// ============================================================================
// GroupedEntityList Component
// ============================================================================

/**
 * Entity list with sticky group headers.
 *
 * Groups entities by a key extracted via the descriptor, renders a sticky
 * header per group, and delegates item rendering to the same visual pattern
 * as {@link EntityList}.
 *
 * @public
 */
export function GroupedEntityList<TEntity, TId extends string = string>(
  props: IGroupedEntityListProps<TEntity, TId>
): React.ReactElement {
  const {
    entities,
    descriptor,
    selectedId,
    onSelect,
    onDrill,
    compareMode,
    checkedIds,
    onCheckedChange,
    emptyState,
    onDelete,
    canDelete
  } = props;
  const listRef = useRef<HTMLDivElement>(null);

  // Build groups and flat entity list for keyboard navigation
  const { groups, flatEntities } = useMemo(() => {
    const groupMap = new Map<string, { label: string; items: TEntity[] }>();

    for (const entity of entities) {
      const key = descriptor.getGroupKey(entity);
      let group = groupMap.get(key);
      if (!group) {
        group = { label: descriptor.getGroupLabel(entity), items: [] };
        groupMap.set(key, group);
      }
      group.items.push(entity);
    }

    const sortedKeys = Array.from(groupMap.keys());
    if (descriptor.compareGroups) {
      const cmp = descriptor.compareGroups;
      sortedKeys.sort((a, b) => cmp(a, b));
    }

    const builtGroups: IEntityGroup<TEntity>[] = [];
    const flat: TEntity[] = [];

    for (const key of sortedKeys) {
      const group = groupMap.get(key)!;
      builtGroups.push({ key, label: group.label, items: group.items });
      flat.push(...group.items);
    }

    return { groups: builtGroups, flatEntities: flat };
  }, [entities, descriptor]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedId && listRef.current) {
      const selectedButton = listRef.current.querySelector(`[data-entity-id="${selectedId}"]`);
      if (selectedButton) {
        selectedButton.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedId]);

  const selectedIndex = flatEntities.findIndex((e) => descriptor.getId(e) === selectedId);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = selectedIndex < flatEntities.length - 1 ? selectedIndex + 1 : 0;
          onSelect(descriptor.getId(flatEntities[nextIndex]));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : flatEntities.length - 1;
          onSelect(descriptor.getId(flatEntities[prevIndex]));
          break;
        }
        case 'Enter':
        case 'ArrowRight': {
          if (selectedId !== undefined && onDrill) {
            e.preventDefault();
            onDrill();
          }
          break;
        }
        default:
          break;
      }
    },
    [flatEntities, descriptor, selectedId, selectedIndex, onSelect, onDrill]
  );

  // Empty state
  if (entities.length === 0 && emptyState) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
        <h3 className="text-sm font-medium text-gray-700 mb-1">{emptyState.title}</h3>
        <p className="text-xs text-gray-500 mb-4">{emptyState.description}</p>
        {emptyState.action && (
          <button
            onClick={emptyState.action.onClick}
            className="px-3 py-1.5 text-xs font-medium text-white bg-choco-accent rounded-md hover:bg-choco-primary transition-colors"
          >
            {emptyState.action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" onKeyDown={handleKeyDown}>
      {/* Header with total count */}
      {flatEntities.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
          <span className="text-xs text-gray-400">
            {flatEntities.length} item{flatEntities.length !== 1 ? 's' : ''}
            {compareMode && props.compareCount !== undefined && props.compareCount > 0 && (
              <span className="ml-1.5 text-choco-accent">&middot; {props.compareCount} selected</span>
            )}
          </span>
          <div className="flex items-center gap-1">
            {compareMode &&
              props.onStartComparison &&
              props.compareCount !== undefined &&
              props.compareCount >= 2 && (
                <button
                  onClick={(e): void => {
                    e.stopPropagation();
                    props.onStartComparison?.();
                  }}
                  className="px-2 py-0.5 text-[11px] rounded border transition-colors bg-choco-primary text-white border-choco-primary hover:bg-choco-primary/90"
                >
                  Compare Now
                </button>
              )}
            {props.onToggleCompare && (
              <button
                onClick={(e): void => {
                  e.stopPropagation();
                  props.onToggleCompare?.();
                }}
                className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                  compareMode
                    ? 'bg-choco-accent text-white border-choco-accent'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-choco-accent hover:text-choco-accent'
                }`}
              >
                {compareMode ? 'Cancel' : 'Compare'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grouped list */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.key}>
            {/* Sticky group header */}
            <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              {group.label}
              <span className="text-gray-400 normal-case font-normal ml-1">({group.items.length})</span>
            </div>

            {/* Items in group */}
            {group.items.map((entity) => (
              <GroupedEntityRow
                key={descriptor.getId(entity)}
                entity={entity}
                descriptor={descriptor}
                selectedId={selectedId}
                compareMode={compareMode}
                checkedIds={checkedIds}
                onSelect={onSelect}
                onDrill={onDrill}
                onCheckedChange={onCheckedChange}
                onDelete={onDelete}
                canDelete={canDelete}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
