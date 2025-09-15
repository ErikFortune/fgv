import React, { useMemo, ReactElement } from 'react';
import { IResourcePickerListProps } from './types';
import { ResourceItem } from './ResourceItem';
import { mergeWithPendingResources, filterTreeBranch } from './utils/treeNavigation';

/**
 * List view for the ResourcePicker component
 * Enhanced version of ResourceListView with annotation and pending resource support
 */
export const ResourcePickerList = <T = unknown,>({
  resourceIds,
  pendingResources,
  selectedResourceId,
  onResourceSelect,
  resourceAnnotations,
  searchTerm = '',
  rootPath,
  hideRootNode,
  className = '',
  emptyMessage = 'No resources available'
}: IResourcePickerListProps<T>): ReactElement => {
  // Merge existing and pending resources
  const allResourceIds = useMemo(() => {
    return mergeWithPendingResources(resourceIds, pendingResources);
  }, [resourceIds, pendingResources]);

  // Apply branch isolation filtering
  const branchFilteredIds = useMemo(() => {
    return filterTreeBranch(allResourceIds, rootPath, hideRootNode);
  }, [allResourceIds, rootPath, hideRootNode]);

  // Filter by search term and sort
  const filteredResourceIds = useMemo(() => {
    const filtered = searchTerm
      ? branchFilteredIds.filter((id) => id.toLowerCase().includes(searchTerm.toLowerCase()))
      : branchFilteredIds;

    return filtered.sort();
  }, [branchFilteredIds, searchTerm]);

  // Helper function to get display name with prefix truncation
  const getDisplayName = useMemo(() => {
    return (resourceId: string, pendingDisplayName?: string): string => {
      // For all resources (existing and pending), apply prefix truncation to show full relative ID
      if (rootPath) {
        if (hideRootNode && resourceId.startsWith(rootPath + '.')) {
          // Remove the root path prefix completely - show the full relative path
          return resourceId.substring(rootPath.length + 1);
        } else if (resourceId === rootPath) {
          // For the root node itself, show the full path
          return rootPath;
        } else if (resourceId.startsWith(rootPath + '.')) {
          // Show relative to root path - the full relative path
          return resourceId.substring(rootPath.length + 1);
        }
      }

      // Default: show the full resource ID
      return resourceId;
    };
  }, [rootPath, hideRootNode]);

  // Create a map of pending resources for quick lookup
  const pendingResourceMap = useMemo(() => {
    const map = new Map<
      string,
      { isPending: boolean; type?: 'new' | 'modified' | 'deleted'; resourceData?: T }
    >();
    pendingResources?.forEach((pr) => {
      map.set(pr.id, {
        isPending: true,
        type: pr.type,
        resourceData: pr.resourceData
      });
    });
    return map;
  }, [pendingResources]);

  if (filteredResourceIds.length === 0) {
    return (
      <div className={`${className} p-4 text-center text-gray-500`}>
        <p>{searchTerm ? 'No resources match your search' : emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${className} overflow-y-auto`}>
      {filteredResourceIds.map((resourceId) => {
        const pendingInfo = pendingResourceMap.get(resourceId);
        const isPending = Boolean(pendingInfo?.isPending);
        const pendingResource = pendingResources?.find((pr) => pr.id === resourceId);
        const truncatedDisplayName = getDisplayName(resourceId, pendingResource?.displayName);

        return (
          <ResourceItem<T>
            key={resourceId}
            resourceId={resourceId}
            displayName={truncatedDisplayName}
            isSelected={selectedResourceId === resourceId}
            isPending={isPending}
            annotation={resourceAnnotations?.[resourceId]}
            onClick={onResourceSelect}
            searchTerm={searchTerm}
            resourceData={pendingInfo?.resourceData}
            pendingType={pendingInfo?.type}
          />
        );
      })}
    </div>
  );
};

export default ResourcePickerList;
