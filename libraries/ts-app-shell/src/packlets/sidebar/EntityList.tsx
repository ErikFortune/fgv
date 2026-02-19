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

import React, { useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Entity Item Descriptor
// ============================================================================

/**
 * Describes how to extract display properties from an entity.
 * Consuming apps provide this to configure the list for their entity types.
 * @public
 */
export interface IEntityDescriptor<TEntity, TId extends string = string> {
  /** Extract the unique ID from an entity */
  readonly getId: (entity: TEntity) => TId;
  /** Extract the primary display label */
  readonly getLabel: (entity: TEntity) => string;
  /** Extract an optional secondary line (subtitle, description) */
  readonly getSublabel?: (entity: TEntity) => string | undefined;
  /** Extract an optional status badge or indicator */
  readonly getStatus?: (entity: TEntity) => IEntityStatus | undefined;
}

/**
 * Status indicator for an entity list item.
 * @public
 */
export interface IEntityStatus {
  /** Status label */
  readonly label: string;
  /** CSS color class for the status dot */
  readonly colorClass: string;
}

// ============================================================================
// EntityList Props
// ============================================================================

/**
 * Props for the EntityList component.
 * @public
 */
export interface IEntityListProps<TEntity, TId extends string = string> {
  /** The entities to display */
  readonly entities: ReadonlyArray<TEntity>;
  /** Descriptor for extracting display properties */
  readonly descriptor: IEntityDescriptor<TEntity, TId>;
  /** Currently selected entity ID (if any) */
  readonly selectedId?: TId;
  /** Callback when an entity is selected (browse — list stays open) */
  readonly onSelect: (id: TId) => void;
  /** Callback when the user drills into the selected entity (Enter/→ — collapses list) */
  readonly onDrill?: () => void;
  /** Whether compare mode is active (shows checkboxes for multi-select) */
  readonly compareMode?: boolean;
  /** Entity IDs currently checked for comparison */
  readonly checkedIds?: ReadonlySet<string>;
  /** Callback to toggle an entity ID in/out of the compare selection */
  readonly onCheckedChange?: (id: TId) => void;
  /** Empty state configuration */
  readonly emptyState?: IEmptyStateConfig;
  /** Optional header content (e.g., result count) */
  readonly header?: React.ReactNode;
  /** Callback to toggle compare mode on/off (shows compare button in header) */
  readonly onToggleCompare?: () => void;
  /** Number of items currently selected for comparison */
  readonly compareCount?: number;
  /** Callback to start the comparison view (user clicks 'Compare Now') */
  readonly onStartComparison?: () => void;
}

/**
 * Configuration for the empty state display.
 * @public
 */
export interface IEmptyStateConfig {
  /** Title for the empty state */
  readonly title: string;
  /** Description text */
  readonly description: string;
  /** Optional CTA button */
  readonly action?: IEmptyStateAction;
}

/**
 * Call-to-action for the empty state.
 * @public
 */
export interface IEmptyStateAction {
  /** Button label */
  readonly label: string;
  /** Callback when clicked */
  readonly onClick: () => void;
}

// ============================================================================
// EntityList Component
// ============================================================================

/**
 * Generic entity list component for the sidebar.
 *
 * Renders a scrollable list of entities with:
 * - Primary label + optional sublabel
 * - Optional status indicator
 * - Selection highlighting
 * - Empty state with optional CTA
 *
 * @public
 */
export function EntityList<TEntity, TId extends string = string>(
  props: IEntityListProps<TEntity, TId>
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
    header
  } = props;
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll the selected item into view when selection changes
  useEffect(() => {
    if (selectedId && listRef.current) {
      const selectedButton = listRef.current.querySelector(`[data-entity-id="${selectedId}"]`);
      if (selectedButton) {
        selectedButton.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedId]);

  // Find the index of the currently selected entity
  const selectedIndex = entities.findIndex((e) => descriptor.getId(e) === selectedId);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = selectedIndex < entities.length - 1 ? selectedIndex + 1 : 0;
          onSelect(descriptor.getId(entities[nextIndex]));
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex = selectedIndex > 0 ? selectedIndex - 1 : entities.length - 1;
          onSelect(descriptor.getId(entities[prevIndex]));
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
    [entities, descriptor, selectedId, selectedIndex, onSelect, onDrill]
  );

  if (entities.length === 0 && emptyState) {
    return <EmptyState config={emptyState} />;
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden" onKeyDown={handleKeyDown}>
      {/* Header with item count and optional compare toggle */}
      {header !== undefined ? (
        <div className="px-3 py-1.5 text-xs text-gray-500 border-b border-gray-100">{header}</div>
      ) : entities.length > 0 ? (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
          <span className="text-xs text-gray-400">
            {entities.length} item{entities.length !== 1 ? 's' : ''}
            {compareMode && props.compareCount !== undefined && props.compareCount > 0 && (
              <span className="ml-1.5 text-choco-accent">· {props.compareCount} selected</span>
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
      ) : null}

      {/* List */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {entities.map((entity) => {
          const id = descriptor.getId(entity);
          const label = descriptor.getLabel(entity);
          const sublabel = descriptor.getSublabel?.(entity);
          const status = descriptor.getStatus?.(entity);
          const isSelected = id === selectedId;
          const isChecked = compareMode === true && checkedIds !== undefined && checkedIds.has(id);

          return (
            <button
              key={id}
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
              className={`flex items-center gap-2 w-full px-3 py-2 text-left border-b border-gray-50 transition-colors ${
                isChecked
                  ? 'bg-choco-accent/10 border-l-2 border-l-choco-accent'
                  : isSelected && !compareMode
                  ? 'bg-choco-accent/10 border-l-2 border-l-choco-accent'
                  : 'hover:bg-gray-50 border-l-2 border-l-transparent'
              }`}
            >
              {compareMode && (
                <span
                  className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors ${
                    isChecked ? 'bg-choco-accent border-choco-accent text-white' : 'border-gray-300 bg-white'
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm truncate ${
                    (isSelected && !compareMode) || isChecked
                      ? 'font-medium text-choco-primary'
                      : 'text-gray-800'
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
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ config }: { readonly config: IEmptyStateConfig }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
      <h3 className="text-sm font-medium text-gray-700 mb-1">{config.title}</h3>
      <p className="text-xs text-gray-500 mb-4">{config.description}</p>
      {config.action && (
        <button
          onClick={config.action.onClick}
          className="px-3 py-1.5 text-xs font-medium text-white bg-choco-accent rounded-md hover:bg-choco-primary transition-colors"
        >
          {config.action.label}
        </button>
      )}
    </div>
  );
}
