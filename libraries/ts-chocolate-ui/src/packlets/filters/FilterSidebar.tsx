/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState } from 'react';
import { TagBadge } from '../common';
import { SearchInput } from './SearchInput';
import { CollapsibleSection } from './CollapsibleSection';
import type { IBaseFilterState, IFilterActions } from '../hooks';

/**
 * Props for the FilterSidebar component
 * @public
 */
export interface IFilterSidebarProps<TFilters extends IBaseFilterState> {
  /**
   * Current filter state
   */
  filters: TFilters;
  /**
   * Filter actions from useFilterState hook
   */
  actions: IFilterActions<TFilters>;
  /**
   * All available tags for filtering
   */
  tags: ReadonlyArray<string>;
  /**
   * Collection management panel (app-specific, rendered in Collections section)
   */
  collectionsPanel: React.ReactNode;
  /**
   * Tool-specific filter controls (rendered in Filters section)
   */
  children?: React.ReactNode;
  /**
   * Placeholder text for search input
   */
  searchPlaceholder?: string;
  /**
   * Whether to show tags section (defaults to true when tags exist)
   */
  showTags?: boolean;
  /**
   * Label for the filters section (default: "Filters")
   */
  filtersLabel?: string;
  /**
   * Label for the tags section (default: "Tags")
   */
  tagsLabel?: string;
  /**
   * Label for the collections section (default: "Collections")
   */
  collectionsLabel?: string;
}

/**
 * Composable sidebar for filtering tool content.
 *
 * Provides consistent filter UI across all tools with search, tags,
 * and collections sections. Tool-specific filters can be added via children.
 *
 * @example
 * ```tsx
 * function MyToolSidebar() {
 *   const { state, actions } = useFilterState(createInitialFilterState());
 *   const allTags = useAllTags();
 *
 *   return (
 *     <FilterSidebar
 *       filters={state}
 *       actions={actions}
 *       tags={allTags}
 *       collectionsPanel={<MyCollectionPanel />}
 *       searchPlaceholder="Search items..."
 *     >
 *       <CustomCategoryFilter />
 *     </FilterSidebar>
 *   );
 * }
 * ```
 *
 * @param props - Filter sidebar props
 * @returns Filter sidebar element
 * @public
 */
export function FilterSidebar<TFilters extends IBaseFilterState>({
  filters,
  actions,
  tags,
  collectionsPanel,
  children,
  searchPlaceholder = 'Search...',
  showTags,
  filtersLabel = 'Filters',
  tagsLabel = 'Tags',
  collectionsLabel = 'Collections'
}: IFilterSidebarProps<TFilters>): React.ReactElement {
  const [showFilters, setShowFilters] = useState(true);
  const [showTagsSection, setShowTagsSection] = useState(false);
  const [showCollections, setShowCollections] = useState(true);

  const shouldShowTags = showTags ?? tags.length > 0;
  // Only show Filters section if there's content (tags, children, or clear button)
  const hasFiltersContent = shouldShowTags || children !== undefined || actions.hasActiveFilters;

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Search
        </label>
        <SearchInput value={filters.search} onChange={actions.setSearch} placeholder={searchPlaceholder} />
      </div>

      {hasFiltersContent && (
        <CollapsibleSection
          title={filtersLabel}
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        >
          <div className="space-y-4">
            {shouldShowTags && (
              <CollapsibleSection
                title={tagsLabel}
                isOpen={showTagsSection}
                onToggle={() => setShowTagsSection(!showTagsSection)}
              >
                <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                  {tags.map((tag) => (
                    <TagBadge
                      key={tag}
                      tag={tag}
                      size="sm"
                      isActive={filters.tags.includes(tag)}
                      onClick={() => actions.toggleTag(tag)}
                    />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {children}

            {actions.hasActiveFilters && (
              <button
                type="button"
                onClick={actions.clearFilters}
                className="w-full py-2 text-sm text-chocolate-600 dark:text-chocolate-400 hover:text-chocolate-700 dark:hover:text-chocolate-300"
              >
                Clear all filters
              </button>
            )}
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title={collectionsLabel}
        isOpen={showCollections}
        onToggle={() => setShowCollections(!showCollections)}
      >
        {collectionsPanel}
      </CollapsibleSection>
    </div>
  );
}
