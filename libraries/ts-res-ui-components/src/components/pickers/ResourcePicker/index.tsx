import React, { useState, useMemo, useCallback } from 'react';
import { MagnifyingGlassIcon, ListBulletIcon, FolderIcon } from '@heroicons/react/24/outline';
import { ResourcePickerProps, ResourceSelection, ResourcePickerOptions } from './types';
import { ResourcePickerList } from './ResourcePickerList';
import { ResourcePickerTree } from './ResourcePickerTree';
import { searchResources, filterTreeBranch } from './utils/treeNavigation';

/**
 * Comprehensive resource picker component with search, view modes, and annotation support.
 *
 * The ResourcePicker provides a flexible interface for browsing and selecting resources
 * from processed resource collections. It supports both list and tree view modes,
 * search functionality, visual annotations, and pending resource management.
 *
 * Key features:
 * - **Multiple view modes**: List view for simple browsing, tree view for hierarchical navigation
 * - **Search functionality**: Search across all resources or within a specific branch
 * - **Visual annotations**: Display badges, indicators, and suffixes for enhanced UX
 * - **Pending resources**: Show unsaved changes alongside persisted resources
 * - **Branch isolation**: Focus on a specific branch node of the resource tree
 * - **Type safety**: Full TypeScript support with generic resource data types
 *
 * @example
 * ```tsx
 * function MyResourceEditor() {
 *   const [selectedId, setSelectedId] = useState<string | null>(null);
 *   const [selectedData, setSelectedData] = useState<MyResourceType | null>(null);
 *
 *   return (
 *     <ResourcePicker<MyResourceType>
 *       resources={processedResources}
 *       selectedResourceId={selectedId}
 *       onResourceSelect={(selection) => {
 *         setSelectedId(selection.resourceId);
 *         setSelectedData(selection.resourceData || null);
 *
 *         if (selection.isPending) {
 *           console.log(`Pending ${selection.pendingType} operation`);
 *         }
 *       }}
 *       defaultView="tree"
 *       enableSearch={true}
 *       searchPlaceholder="Search resources..."
 *       resourceAnnotations={{
 *         'user.welcome': {
 *           badge: { text: '3', variant: 'info' },
 *           suffix: '(3 candidates)'
 *         }
 *       }}
 *       pendingResources={[{
 *         id: 'user.new-item',
 *         type: 'new',
 *         displayName: 'New Welcome Message',
 *         resourceData: { text: 'Hello World!' }
 *       }]}
 *       height="500px"
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
export const ResourcePicker = <T = unknown,>({
  resources,
  selectedResourceId,
  onResourceSelect,
  resourceAnnotations,
  pendingResources,
  options,
  className = '',
  onMessage
}: ResourcePickerProps<T>) => {
  // Extract options with defaults
  const {
    defaultView = 'list',
    showViewToggle = true,
    rootPath,
    hideRootNode = false,
    enableSearch = true,
    searchPlaceholder,
    searchScope = 'current-branch',
    emptyMessage,
    height = '600px'
  } = options || {};
  const [viewMode, setViewMode] = useState<'list' | 'tree'>(defaultView);
  const [searchTerm, setSearchTerm] = useState('');

  // Get resource IDs based on current filters
  const resourceIds = useMemo(() => {
    if (!resources?.summary.resourceIds) {
      return [];
    }

    let ids = resources.summary.resourceIds;

    // Apply branch filtering if specified
    if (rootPath) {
      ids = filterTreeBranch(ids, rootPath, hideRootNode);
    }

    // Apply search filtering
    if (searchTerm) {
      ids = searchResources(ids, searchTerm, searchScope, rootPath);
    }

    return ids;
  }, [resources?.summary.resourceIds, rootPath, hideRootNode, searchTerm, searchScope]);

  // Handle resource selection
  const handleResourceSelect = useCallback(
    (selection: ResourceSelection<T>) => {
      onResourceSelect(selection);
      if (selection.resourceId) {
        onMessage?.('info', `Selected resource: ${selection.resourceId}`);
      }
    },
    [onResourceSelect, onMessage]
  );

  // Calculate dynamic search placeholder
  const getSearchPlaceholder = () => {
    if (searchPlaceholder) {
      return searchPlaceholder;
    }
    if (rootPath && hideRootNode) {
      const segments = rootPath.split('/');
      const branchName = segments[segments.length - 1];
      return `Search ${branchName}...`;
    }
    return 'Search resources...';
  };

  // Handle empty state
  if (!resources) {
    return (
      <div className={`${className} p-4 text-center text-gray-500`}>
        <p>{emptyMessage || 'No resources loaded'}</p>
      </div>
    );
  }

  const containerHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`flex flex-col !relative !z-auto !min-h-[400px] ${className}`}
      style={{
        height: containerHeight
      }}
    >
      {/* Header with search and view toggle */}
      {(enableSearch || showViewToggle) && (
        <div className="flex flex-col gap-3 mb-4">
          {/* Search Box */}
          {enableSearch && (
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          )}

          {/* View Mode Toggle */}
          {showViewToggle && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {resourceIds.length} resource{resourceIds.length !== 1 ? 's' : ''}
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List View"
                >
                  <ListBulletIcon className="h-4 w-4" />
                  <span className="ml-1">List</span>
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={`flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === 'tree'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Tree View"
                >
                  <FolderIcon className="h-4 w-4" />
                  <span className="ml-1">Tree</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resource List or Tree */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 !relative !z-auto !min-h-[300px]">
        {viewMode === 'tree' ? (
          <ResourcePickerTree<T>
            resources={resources}
            pendingResources={pendingResources}
            selectedResourceId={selectedResourceId}
            onResourceSelect={handleResourceSelect}
            resourceAnnotations={resourceAnnotations}
            searchTerm={searchTerm}
            rootPath={rootPath}
            hideRootNode={hideRootNode}
            emptyMessage={emptyMessage}
          />
        ) : (
          <ResourcePickerList<T>
            resourceIds={resources.summary.resourceIds || []}
            pendingResources={pendingResources}
            selectedResourceId={selectedResourceId}
            onResourceSelect={handleResourceSelect}
            resourceAnnotations={resourceAnnotations}
            searchTerm={searchTerm}
            rootPath={rootPath}
            hideRootNode={hideRootNode}
            emptyMessage={emptyMessage}
          />
        )}
      </div>
    </div>
  );
};

export default ResourcePicker;
