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

import React, { useCallback, useState } from 'react';

// ============================================================================
// Collection Row Item
// ============================================================================

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
}

// ============================================================================
// Collection Section Props
// ============================================================================

/**
 * Props for the CollectionSection component.
 * @public
 */
export interface ICollectionSectionProps {
  /** Collection items to display */
  readonly collections: ReadonlyArray<ICollectionRowItem>;
  /** Callback when visibility is toggled for a collection */
  readonly onToggleVisibility: (collectionId: string) => void;
  /** Callback when all-visible toggle is clicked; receives true to show all, false to hide all */
  readonly onToggleAllVisibility?: (showAll: boolean) => void;
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
  /** Whether the section starts collapsed */
  readonly defaultCollapsed?: boolean;
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
}): React.ReactElement {
  const { collection, onToggleVisibility, onSetDefault, onDelete, onExport, onUnlock } = props;
  const displayName = collection.name ?? collection.id;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 ${
        collection.isVisible ? 'text-gray-700' : 'text-gray-400'
      }`}
    >
      {/* Visibility toggle */}
      <button
        onClick={(): void => onToggleVisibility(collection.id)}
        className="shrink-0 w-5 h-5 flex items-center justify-center text-xs hover:text-choco-accent transition-colors"
        title={collection.isVisible ? 'Hide collection' : 'Show collection'}
        aria-label={`${collection.isVisible ? 'Hide' : 'Show'} ${displayName}`}
      >
        {collection.isVisible ? '\u{1F441}' : '\u{1F441}\u{FE0F}\u{200D}\u{1F5E8}\u{FE0F}'}
      </button>

      {/* Default collection star */}
      {onSetDefault && collection.isMutable && (
        <button
          onClick={(): void => onSetDefault(collection.id)}
          className={`shrink-0 w-5 h-5 flex items-center justify-center transition-colors ${
            collection.isDefault
              ? 'text-yellow-400 hover:text-yellow-500'
              : 'text-gray-300 hover:text-yellow-400'
          }`}
          title={
            collection.isDefault
              ? 'Default collection for new items'
              : 'Set as default collection for new items'
          }
          aria-label={
            collection.isDefault
              ? `${collection.name ?? collection.id} is default`
              : `Set ${collection.name ?? collection.id} as default`
          }
          aria-pressed={collection.isDefault}
        >
          {collection.isDefault ? '★' : '☆'}
        </button>
      )}

      {/* Status indicators */}
      {!collection.isMutable && (
        <span className="shrink-0 text-xs text-gray-400" title="Built-in collection (read-only)">
          {'\uD83D\uDD12'}
        </span>
      )}
      {collection.isProtected &&
        (collection.isUnlocked || !onUnlock ? (
          <span
            className={`shrink-0 text-xs ${collection.isUnlocked ? 'text-green-500' : 'text-gray-400'}`}
            title={collection.isUnlocked ? 'Protected (unlocked)' : 'Protected (locked)'}
          >
            {'\uD83D\uDEE1'}
          </span>
        ) : (
          <button
            onClick={(): void => onUnlock(collection.id)}
            className="shrink-0 text-xs text-gray-400 hover:text-amber-500 transition-colors"
            title="Click to unlock"
            aria-label={`Unlock ${collection.name ?? collection.id}`}
          >
            {'\uD83D\uDEE1'}
          </button>
        ))}

      {/* Name + count */}
      <span className="flex-1 truncate" title={displayName}>
        {displayName}
      </span>
      <span className="shrink-0 text-xs text-gray-400">{collection.itemCount}</span>

      {/* Export button (mutable only) */}
      {collection.isMutable && onExport && (
        <button
          onClick={(): void => onExport(collection.id)}
          className="shrink-0 w-5 h-5 flex items-center justify-center text-xs text-gray-300 hover:text-choco-accent transition-colors"
          title={`Export ${displayName}`}
          aria-label={`Export ${displayName}`}
        >
          ↓
        </button>
      )}

      {/* Delete button (mutable only) */}
      {collection.isMutable && onDelete && (
        <button
          onClick={(): void => onDelete(collection.id)}
          className="shrink-0 w-5 h-5 flex items-center justify-center text-xs text-gray-300 hover:text-red-500 transition-colors"
          title={`Remove ${displayName}`}
          aria-label={`Remove ${displayName}`}
        >
          {'×'}
        </button>
      )}
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
    onToggleAllVisibility,
    onAddDirectory,
    onCreateCollection,
    onDeleteCollection,
    onSetDefaultCollection,
    onExportCollection,
    onExportAllAsZip,
    onImportCollection,
    onOpenCollectionFromFile,
    onUnlockCollection,
    defaultCollapsed = false
  } = props;

  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const allVisible = collections.length > 0 && collections.every((c) => c.isVisible);

  const handleToggleAllVisibility = useCallback((): void => {
    if (onToggleAllVisibility) {
      onToggleAllVisibility(!allVisible);
    } else {
      const ids = allVisible
        ? collections.map((c) => c.id)
        : collections.filter((c) => !c.isVisible).map((c) => c.id);
      ids.forEach((id) => onToggleVisibility(id));
    }
  }, [onToggleAllVisibility, onToggleVisibility, allVisible, collections]);

  const handleToggleCollapse = useCallback((): void => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col border-t border-gray-200 mt-1">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <button
          onClick={handleToggleCollapse}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
        >
          <span className={`text-[10px] transition-transform ${collapsed ? '' : 'rotate-90'}`}>
            {'\u203A'}
          </span>
          Collections
          <span className="text-gray-400 normal-case font-normal">({collections.length})</span>
        </button>
        {collections.length > 1 && (
          <button
            onClick={handleToggleAllVisibility}
            className="text-xs text-gray-400 hover:text-choco-accent transition-colors px-1"
            title={allVisible ? 'Hide all collections' : 'Show all collections'}
            aria-label={allVisible ? 'Hide all collections' : 'Show all collections'}
          >
            {allVisible ? '\u{1F441}\u{FE0F}\u{200D}\u{1F5E8}\u{FE0F}' : '\u{1F441}'}
          </button>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {onAddDirectory && (
            <button
              onClick={onAddDirectory}
              className="text-xs text-gray-400 hover:text-choco-accent transition-colors px-1"
              title="Add directory"
              aria-label="Add directory"
            >
              +{'\uD83D\uDCC1'}
            </button>
          )}
          {onExportAllAsZip && (
            <button
              onClick={onExportAllAsZip}
              className="text-xs text-gray-400 hover:text-choco-accent transition-colors px-1"
              title="Export all mutable collections as zip"
              aria-label="Export all as zip"
            >
              ↓{'🗂'}
            </button>
          )}
          {onOpenCollectionFromFile && (
            <button
              onClick={onOpenCollectionFromFile}
              className="text-xs text-gray-400 hover:text-choco-accent transition-colors px-1"
              title="Open collection file for in-place editing"
              aria-label="Open collection from file"
            >
              {'📂'}
            </button>
          )}
          {onImportCollection && (
            <button
              onClick={onImportCollection}
              className="text-xs text-gray-400 hover:text-choco-accent transition-colors px-1"
              title="Import collection from file (in-memory)"
              aria-label="Import collection from file"
            >
              ↑
            </button>
          )}
          {onCreateCollection && (
            <button
              onClick={onCreateCollection}
              className="text-xs text-gray-400 hover:text-choco-accent transition-colors px-1"
              title="New collection"
              aria-label="New collection"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Collection list */}
      {!collapsed && (
        <div className="flex flex-col">
          {collections.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">No collections</div>
          ) : (
            collections.map((collection) => (
              <CollectionRow
                key={collection.id}
                collection={collection}
                onToggleVisibility={onToggleVisibility}
                onSetDefault={onSetDefaultCollection}
                onDelete={onDeleteCollection}
                onExport={onExportCollection}
                onUnlock={onUnlockCollection}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
