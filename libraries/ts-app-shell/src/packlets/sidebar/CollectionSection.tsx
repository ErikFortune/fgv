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

/**
 * Generic collection management section for the sidebar.
 *
 * Renders a collapsible list of collections with visibility toggles,
 * status indicators, and action buttons.
 *
 * @packageDocumentation
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  ExclamationTriangleIcon,
  BuildingLibraryIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  ArrowsPointingInIcon,
  TrashIcon,
  FolderPlusIcon,
  ArchiveBoxArrowDownIcon,
  FolderOpenIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  ChevronRightIcon
} from '@heroicons/react/20/solid';

// ============================================================================
// Collection Row Item
// ============================================================================

/**
 * Describes a single collection for rendering in the sidebar.
 * @public
 */
export interface ICollectionBadge {
  readonly kind: 'dot' | 'count';
  readonly tone?: 'info' | 'warning' | 'danger';
  readonly count?: number;
  readonly ariaLabel?: string;
}

/**
 * Describes a single collection for rendering in the sidebar.
 * @public
 */
export interface ICollectionRowItem {
  /** Collection identifier */
  readonly id: string;
  /** Display name (falls back to id if undefined) */
  readonly name: string | undefined;
  /** Number of items in this collection */
  readonly itemCount: number;
  /** Whether this collection can be modified */
  readonly isMutable: boolean;
  /** Whether this collection is encrypted/protected */
  readonly isProtected: boolean;
  /** Whether the protected collection has been unlocked */
  readonly isUnlocked: boolean;
  /** Whether this collection is currently visible */
  readonly isVisible: boolean;
  /** Whether this collection is the default target for new entities */
  readonly isDefault: boolean;
  /**
   * Whether this loaded collection has an orphaned encrypted shadow with the same ID
   * in another storage root. When true, a repair action should be offered.
   */
  readonly hasConflict?: boolean;
  /** Whether this collection is explicitly hidden by the user */
  readonly isHidden?: boolean;
  /** The name of the storage source this collection was loaded from */
  readonly sourceName?: string;
  /** Optional badge rendered alongside the collection name */
  readonly badge?: ICollectionBadge;
}

// ============================================================================
// Collection Section Props
// ============================================================================

/**
 * Props for the CollectionSection component.
 * @public
 */
/**
 * Maps source names to Tailwind border color classes for the left-border indicator.
 * @public
 */
export type SourceColorMap = Readonly<Record<string, string>>;

const BADGE_BASE_CLASSES: string =
  'inline-flex shrink-0 items-center justify-center rounded-full font-medium leading-none';

const BADGE_TONE_CLASSES: Record<NonNullable<ICollectionBadge['tone']>, string> = {
  info: 'bg-status-info-bg text-status-info-text',
  warning: 'bg-status-warning-bg text-status-warning-text',
  danger: 'bg-status-error-bg text-status-error-text'
};

function renderBadge(badge: ICollectionBadge): React.ReactElement {
  const tone = badge.tone ?? 'info';
  const ariaLabel = badge.ariaLabel;

  if (badge.kind === 'dot') {
    return (
      <span
        className={`ml-1.5 h-2 w-2 ${BADGE_BASE_CLASSES} ${BADGE_TONE_CLASSES[tone]}`}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <span
      className={`ml-1.5 min-w-4 px-1.5 py-0.5 text-[0.6875rem] ${BADGE_BASE_CLASSES} ${BADGE_TONE_CLASSES[tone]}`}
      aria-label={ariaLabel}
    >
      {badge.count ?? 0}
    </span>
  );
}

export interface ICollectionSectionProps {
  /** Collection items to display */
  readonly collections: ReadonlyArray<ICollectionRowItem>;
  /** Callback when visibility is toggled for a collection */
  readonly onToggleVisibility: (collectionId: string) => void;
  /** Callback when "Add Directory" is clicked */
  readonly onAddDirectory?: () => void;
  /** Callback when "New Collection" is clicked */
  readonly onCreateCollection?: () => void;
  /** Callback when delete is clicked for a mutable collection */
  readonly onDeleteCollection?: (collectionId: string) => void;
  /** Callback when the star/default is clicked for a collection */
  readonly onSetDefaultCollection?: (collectionId: string) => void;
  /** Callback when export is clicked for a mutable collection */
  readonly onExportCollection?: (collectionId: string) => void;
  /** Callback when "Export All as Zip" is clicked (header-level) */
  readonly onExportAllAsZip?: () => void;
  /** Callback when "Import Collection" is clicked (header-level) */
  readonly onImportCollection?: () => void;
  /** Callback when "Open from File" is clicked (header-level, File System Access API) */
  readonly onOpenCollectionFromFile?: () => void;
  /** Callback when the unlock button is clicked for a locked protected collection */
  readonly onUnlockCollection?: (collectionId: string) => void;
  /** Callback when rename is clicked for a mutable collection */
  readonly onRenameCollection?: (collectionId: string) => void;
  /** Callback when merge is clicked for a mutable collection */
  readonly onMergeCollection?: (collectionId: string) => void;
  /** Callback when hide is selected from the context menu */
  readonly onHideCollection?: (collectionId: string) => void;
  /** Callback when show (unhide) is selected from the context menu */
  readonly onShowCollection?: (collectionId: string) => void;
  /** Whether the section starts collapsed */
  readonly defaultCollapsed?: boolean;
  /** Maps sourceName values to Tailwind border-l color classes */
  readonly sourceColorMap?: SourceColorMap;
  /** Fallback border-l color class when sourceName is not in the map */
  readonly sourceColorFallback?: string;
}

// ============================================================================
// Context Menu (internal)
// ============================================================================

const LONG_PRESS_MS: number = 500;

interface IContextMenuState {
  readonly collectionId: string;
  readonly x: number;
  readonly y: number;
}

function CollectionContextMenu(props: {
  readonly menu: IContextMenuState;
  readonly isHidden: boolean;
  readonly onHide?: (id: string) => void;
  readonly onShow?: (id: string) => void;
  readonly onClose: () => void;
}): React.ReactElement {
  const { menu, isHidden, onHide, onShow, onClose } = props;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return (): void => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const action = isHidden ? onShow : onHide;
  if (!action) {
    return <></>;
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-surface-raised border border-border rounded shadow-lg py-1 min-w-[140px]"
      style={{ left: menu.x, top: menu.y }}
    >
      <button
        className="w-full text-left px-3 py-1.5 text-sm text-secondary hover:bg-hover transition-colors"
        onClick={(): void => {
          action(menu.collectionId);
          onClose();
        }}
      >
        {isHidden ? 'Show collection' : 'Hide collection'}
      </button>
    </div>
  );
}

// ============================================================================
// Long-press hook (internal)
// ============================================================================

function useLongPress(onLongPress: (e: React.TouchEvent) => void): {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const firedRef = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent): void => {
      firedRef.current = false;
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress(e);
      }, LONG_PRESS_MS);
    },
    [onLongPress]
  );

  const cancel = useCallback((): void => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  return { onTouchStart, onTouchEnd: cancel, onTouchMove: cancel };
}

// ============================================================================
// CollectionRow (internal)
// ============================================================================

function CollectionRow(props: {
  readonly collection: ICollectionRowItem;
  readonly onToggleVisibility: (id: string) => void;
  readonly onSetDefault?: (id: string) => void;
  readonly onDelete?: (id: string) => void;
  readonly onExport?: (id: string) => void;
  readonly onUnlock?: (id: string) => void;
  readonly onRename?: (id: string) => void;
  readonly onMerge?: (id: string) => void;
  readonly borderColorClass?: string;
  readonly onContextMenu?: (collectionId: string, x: number, y: number) => void;
  readonly isHiddenRow?: boolean;
}): React.ReactElement {
  const {
    collection,
    onToggleVisibility,
    onSetDefault,
    onDelete,
    onExport,
    onUnlock,
    onRename,
    onMerge,
    borderColorClass,
    onContextMenu,
    isHiddenRow
  } = props;
  const displayName = collection.name ?? collection.id;

  const handleContextMenu = useCallback(
    (e: React.MouseEvent): void => {
      if (onContextMenu) {
        e.preventDefault();
        onContextMenu(collection.id, e.clientX, e.clientY);
      }
    },
    [onContextMenu, collection.id]
  );

  const handleLongPress = useCallback(
    (e: React.TouchEvent): void => {
      if (onContextMenu && e.touches.length > 0) {
        e.preventDefault();
        const touch = e.touches[0];
        onContextMenu(collection.id, touch.clientX, touch.clientY);
      }
    },
    [onContextMenu, collection.id]
  );

  const longPress = useLongPress(handleLongPress);

  return (
    <div
      onClick={(): void => onToggleVisibility(collection.id)}
      onContextMenu={handleContextMenu}
      {...longPress}
      className={`flex flex-col px-3 py-2.5 text-sm transition-colors hover:bg-hover cursor-pointer ${
        isHiddenRow
          ? 'text-muted opacity-30 line-through'
          : collection.isVisible
          ? 'text-secondary'
          : 'text-muted opacity-50'
      } ${borderColorClass ? `border-l-4 ${borderColorClass}` : ''}`}
      role="button"
      aria-pressed={collection.isVisible}
      title={collection.sourceName ? `Source: ${collection.sourceName}` : displayName}
    >
      {/* Top line: status icons + name */}
      <div className="flex items-center gap-1.5">
        {/* Default collection star */}
        {onSetDefault && collection.isMutable && (
          <button
            onClick={(e): void => {
              e.stopPropagation();
              onSetDefault(collection.id);
            }}
            className={`shrink-0 w-5 h-5 flex items-center justify-center transition-colors ${
              collection.isDefault ? 'text-star hover:text-star' : 'text-faint hover:text-star'
            }`}
            title={
              collection.isDefault
                ? 'Default collection for new items'
                : 'Set as default collection for new items'
            }
            aria-label={collection.isDefault ? `${displayName} is default` : `Set ${displayName} as default`}
            aria-pressed={collection.isDefault}
          >
            {collection.isDefault ? (
              <StarIconSolid className="w-4 h-4" />
            ) : (
              <StarIconOutline className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Conflict indicator */}
        {collection.hasConflict && (
          <span
            className="shrink-0 text-status-warning-strong cursor-default"
            title="An encrypted copy of this collection from another storage root has the same ID. Go to Settings → Storage to resolve the conflict."
            aria-label={`Conflict: encrypted shadow for ${displayName}`}
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
          </span>
        )}

        {/* Built-in indicator */}
        {!collection.isMutable && (
          <span className="shrink-0 text-muted" title="Built-in collection (read-only)">
            <BuildingLibraryIcon className="w-4 h-4" />
          </span>
        )}

        {/* Protected/shield indicator */}
        {collection.isProtected &&
          (collection.isUnlocked || !onUnlock ? (
            <span
              className={`shrink-0 ${collection.isUnlocked ? 'text-status-success-icon' : 'text-muted'}`}
              title={collection.isUnlocked ? 'Protected (unlocked)' : 'Protected (locked)'}
            >
              {collection.isUnlocked ? (
                <ShieldCheckIcon className="w-4 h-4" />
              ) : (
                <ShieldExclamationIcon className="w-4 h-4" />
              )}
            </span>
          ) : (
            <button
              onClick={(e): void => {
                e.stopPropagation();
                onUnlock(collection.id);
              }}
              className="shrink-0 text-muted hover:text-star transition-colors"
              title="Click to unlock"
              aria-label={`Unlock ${displayName}`}
            >
              <ShieldExclamationIcon className="w-4 h-4" />
            </button>
          ))}

        {/* Name */}
        <span className="flex-1 truncate" title={displayName}>
          {displayName}
        </span>
        {collection.badge && renderBadge(collection.badge)}
        <span className="shrink-0 text-xs text-muted">{collection.itemCount}</span>
      </div>

      {/* Bottom line: action buttons or built-in label, indented to align under name */}
      <div className="flex items-center gap-1 mt-1 ml-[24px]">
        {/* Action buttons (mutable only) */}
        {collection.isMutable && onExport && (
          <button
            onClick={(e): void => {
              e.stopPropagation();
              onExport(collection.id);
            }}
            className="shrink-0 w-5 h-5 flex items-center justify-center text-faint hover:text-brand-accent transition-colors"
            title={`Export ${displayName}`}
            aria-label={`Export ${displayName}`}
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
        )}
        {collection.isMutable && onRename && (
          <button
            onClick={(e): void => {
              e.stopPropagation();
              onRename(collection.id);
            }}
            className="shrink-0 w-5 h-5 flex items-center justify-center text-faint hover:text-brand-accent transition-colors"
            title={`Rename ${displayName}`}
            aria-label={`Rename ${displayName}`}
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
        )}
        {collection.isMutable && onMerge && (
          <button
            onClick={(e): void => {
              e.stopPropagation();
              onMerge(collection.id);
            }}
            className="shrink-0 w-5 h-5 flex items-center justify-center text-faint hover:text-brand-accent transition-colors"
            title={`Merge ${displayName} into another collection`}
            aria-label={`Merge ${displayName}`}
          >
            <ArrowsPointingInIcon className="w-4 h-4" />
          </button>
        )}
        {collection.isMutable && onDelete && (
          <button
            onClick={(e): void => {
              e.stopPropagation();
              onDelete(collection.id);
            }}
            className="shrink-0 w-5 h-5 flex items-center justify-center text-faint hover:text-status-error-icon transition-colors"
            title={`Remove ${displayName}`}
            aria-label={`Remove ${displayName}`}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}

        {/* Built-in label for immutable collections */}
        {!collection.isMutable && <span className="text-xs text-muted">(built-in)</span>}
      </div>
    </div>
  );
}

// ============================================================================
// CollectionSection
// ============================================================================

/**
 * Collapsible sidebar section for managing collections.
 *
 * Renders a header with action buttons and a list of collection rows
 * with visibility toggles, status indicators, and delete actions.
 *
 * @public
 */
export function CollectionSection(props: ICollectionSectionProps): React.ReactElement {
  const {
    collections,
    onToggleVisibility,
    onAddDirectory,
    onCreateCollection,
    onDeleteCollection,
    onSetDefaultCollection,
    onExportCollection,
    onExportAllAsZip,
    onImportCollection,
    onOpenCollectionFromFile,
    onUnlockCollection,
    onRenameCollection,
    onMergeCollection,
    onHideCollection,
    onShowCollection,
    defaultCollapsed = false,
    sourceColorMap,
    sourceColorFallback
  } = props;

  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hiddenExpanded, setHiddenExpanded] = useState(false);
  const [contextMenu, setContextMenu] = useState<IContextMenuState | undefined>(undefined);

  const visibleCollections = collections.filter((c) => !c.isHidden);
  const hiddenCollections = collections.filter((c) => c.isHidden);

  const handleToggleCollapse = useCallback((): void => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleToggleHiddenExpanded = useCallback((): void => {
    setHiddenExpanded((prev) => !prev);
  }, []);

  const handleOpenContextMenu = useCallback((collectionId: string, x: number, y: number): void => {
    setContextMenu({ collectionId, x, y });
  }, []);

  const handleCloseContextMenu = useCallback((): void => {
    setContextMenu(undefined);
  }, []);

  const getBorderColor = useCallback(
    (sourceName: string | undefined): string | undefined => {
      if (!sourceColorMap) return undefined;
      if (sourceName && sourceName in sourceColorMap) {
        return sourceColorMap[sourceName];
      }
      return sourceColorFallback;
    },
    [sourceColorMap, sourceColorFallback]
  );

  const contextMenuCollection = contextMenu
    ? collections.find((c) => c.id === contextMenu.collectionId)
    : undefined;

  return (
    <div className="flex flex-col border-t border-border mt-1">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <button
          onClick={handleToggleCollapse}
          className="flex items-center gap-1 text-xs font-medium text-muted uppercase tracking-wider hover:text-secondary transition-colors"
        >
          <ChevronRightIcon className={`w-3 h-3 transition-transform ${collapsed ? '' : 'rotate-90'}`} />
          Collections
          <span className="text-muted normal-case font-normal">({collections.length})</span>
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {onAddDirectory && (
            <button
              onClick={onAddDirectory}
              className="text-xs text-muted hover:text-brand-accent transition-colors px-1"
              title="Add directory"
              aria-label="Add directory"
            >
              <FolderPlusIcon className="w-4 h-4" />
            </button>
          )}
          {onExportAllAsZip && (
            <button
              onClick={onExportAllAsZip}
              className="text-xs text-muted hover:text-brand-accent transition-colors px-1"
              title="Export all mutable collections as zip"
              aria-label="Export all as zip"
            >
              <ArchiveBoxArrowDownIcon className="w-4 h-4" />
            </button>
          )}
          {onOpenCollectionFromFile && (
            <button
              onClick={onOpenCollectionFromFile}
              className="text-xs text-muted hover:text-brand-accent transition-colors px-1"
              title="Open collection file for in-place editing"
              aria-label="Open collection from file"
            >
              <FolderOpenIcon className="w-4 h-4" />
            </button>
          )}
          {onImportCollection && (
            <button
              onClick={onImportCollection}
              className="text-xs text-muted hover:text-brand-accent transition-colors px-1"
              title="Import collection from file (in-memory)"
              aria-label="Import collection from file"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
            </button>
          )}
          {onCreateCollection && (
            <button
              onClick={onCreateCollection}
              data-testid="sidebar-new-collection-button"
              className="text-muted hover:text-brand-accent transition-colors px-1"
              title="New collection"
              aria-label="New collection"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collection list */}
      {!collapsed && (
        <div className="flex flex-col">
          {visibleCollections.length === 0 && hiddenCollections.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted">No collections</div>
          ) : (
            visibleCollections.map((collection) => (
              <CollectionRow
                key={collection.id}
                collection={collection}
                onToggleVisibility={onToggleVisibility}
                onSetDefault={onSetDefaultCollection}
                onDelete={onDeleteCollection}
                onExport={onExportCollection}
                onUnlock={onUnlockCollection}
                onRename={onRenameCollection}
                onMerge={onMergeCollection}
                borderColorClass={getBorderColor(collection.sourceName)}
                onContextMenu={onHideCollection ? handleOpenContextMenu : undefined}
              />
            ))
          )}

          {/* Hidden collections expander */}
          {hiddenCollections.length > 0 && (
            <>
              <button
                onClick={handleToggleHiddenExpanded}
                className="flex items-center gap-1 px-3 py-1 text-xs text-muted hover:text-secondary transition-colors"
              >
                <ChevronRightIcon
                  className={`w-3 h-3 transition-transform ${hiddenExpanded ? 'rotate-90' : ''}`}
                />
                {hiddenCollections.length} hidden
              </button>
              {hiddenExpanded &&
                hiddenCollections.map((collection) => (
                  <CollectionRow
                    key={collection.id}
                    collection={collection}
                    onToggleVisibility={onToggleVisibility}
                    onSetDefault={onSetDefaultCollection}
                    onDelete={onDeleteCollection}
                    onExport={onExportCollection}
                    onUnlock={onUnlockCollection}
                    onRename={onRenameCollection}
                    onMerge={onMergeCollection}
                    borderColorClass={getBorderColor(collection.sourceName)}
                    onContextMenu={onShowCollection ? handleOpenContextMenu : undefined}
                    isHiddenRow={true}
                  />
                ))}
            </>
          )}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && contextMenuCollection && (
        <CollectionContextMenu
          menu={contextMenu}
          isHidden={contextMenuCollection.isHidden ?? false}
          onHide={onHideCollection}
          onShow={onShowCollection}
          onClose={handleCloseContextMenu}
        />
      )}
    </div>
  );
}
