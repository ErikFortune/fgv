/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useState, useMemo } from 'react';
import { SearchInput, CollapsibleSection } from '../../components/common';
import { ConfectionCollectionManagementPanel } from '../../components/collections';
import { useChocolate } from '../../contexts/ChocolateContext';
import { TagBadge } from '@fgv/ts-chocolate-ui';
import type { ConfectionType } from '@fgv/ts-chocolate';
import type { IConfectionFilters } from './types';

/**
 * Props for the ConfectionsToolSidebar component
 */
export interface IConfectionsToolSidebarProps {
  /** Current filters */
  filters: IConfectionFilters;
  /** Callback when filters change */
  onFiltersChange: (filters: IConfectionFilters) => void;
}

/**
 * Confection types for filtering
 */
const CONFECTION_TYPES: { value: ConfectionType; label: string }[] = [
  { value: 'molded-bonbon', label: 'Molded Bonbon' },
  { value: 'bar-truffle', label: 'Bar Truffle' },
  { value: 'rolled-truffle', label: 'Rolled Truffle' }
];

/**
 * Sidebar for the confections tool with filtering options
 */
export function ConfectionsToolSidebar({
  filters,
  onFiltersChange
}: IConfectionsToolSidebarProps): React.ReactElement {
  const { runtime } = useChocolate();
  const [showFilters, setShowFilters] = useState(true);
  const [showTags, setShowTags] = useState(false);
  const [showCollections, setShowCollections] = useState(true);

  // Get all unique tags from confections
  const allTags = useMemo(() => {
    if (!runtime) return [];
    return runtime.getAllConfectionTags();
  }, [runtime]);

  // Handle confection type toggle
  const toggleConfectionType = (confectionType: ConfectionType): void => {
    const newTypes = filters.confectionTypes.includes(confectionType)
      ? filters.confectionTypes.filter((t) => t !== confectionType)
      : [...filters.confectionTypes, confectionType];
    onFiltersChange({ ...filters, confectionTypes: newTypes });
  };

  // Handle collection toggle
  const toggleCollection = (collectionId: string): void => {
    const newCollections = filters.collections.includes(collectionId)
      ? filters.collections.filter((c) => c !== collectionId)
      : [...filters.collections, collectionId];
    onFiltersChange({ ...filters, collections: newCollections });
  };

  // Handle tag toggle
  const toggleTag = (tag: string): void => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  // Clear all filters
  const clearFilters = (): void => {
    onFiltersChange({
      search: '',
      confectionTypes: [],
      collections: [],
      tags: []
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.confectionTypes.length > 0 ||
    filters.collections.length > 0 ||
    filters.tags.length > 0;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
          Search
        </label>
        <SearchInput
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
          placeholder="Search confections..."
        />
      </div>

      <CollapsibleSection title="Filters" isOpen={showFilters} onToggle={() => setShowFilters(!showFilters)}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Confection Types
            </label>
            <div className="flex flex-wrap gap-2">
              {CONFECTION_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleConfectionType(value)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    filters.confectionTypes.includes(value)
                      ? 'bg-chocolate-600 text-white dark:bg-chocolate-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {allTags.length > 0 && (
            <CollapsibleSection title="Tags" isOpen={showTags} onToggle={() => setShowTags(!showTags)}>
              <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                {allTags.map((tag) => (
                  <TagBadge
                    key={tag}
                    tag={tag}
                    size="sm"
                    isActive={filters.tags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </CollapsibleSection>
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="w-full py-2 text-sm text-chocolate-600 dark:text-chocolate-400 hover:text-chocolate-700 dark:hover:text-chocolate-300"
            >
              Clear all filters
            </button>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Collections"
        isOpen={showCollections}
        onToggle={() => setShowCollections(!showCollections)}
      >
        <ConfectionCollectionManagementPanel
          toolId="confections"
          selectedCollectionIds={filters.collections}
          onToggleSelected={toggleCollection}
          showHeader={true}
          headerTitle={null}
        />
      </CollapsibleSection>
    </div>
  );
}
