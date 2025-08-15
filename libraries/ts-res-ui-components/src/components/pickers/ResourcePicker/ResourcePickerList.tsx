import React, { useMemo } from 'react';
import { ResourcePickerListProps } from './types';
import { ResourceItem } from './ResourceItem';
import { mergeWithPendingResources } from './utils/treeNavigation';

/**
 * List view for the ResourcePicker component
 * Enhanced version of ResourceListView with annotation and pending resource support
 */
export const ResourcePickerList: React.FC<ResourcePickerListProps> = ({
  resourceIds,
  pendingResources,
  selectedResourceId,
  onResourceSelect,
  resourceAnnotations,
  searchTerm = '',
  className = '',
  emptyMessage = 'No resources available'
}) => {
  // Merge existing and pending resources
  const allResourceIds = useMemo(() => {
    return mergeWithPendingResources(resourceIds, pendingResources);
  }, [resourceIds, pendingResources]);

  // Filter by search term and sort
  const filteredResourceIds = useMemo(() => {
    const filtered = searchTerm
      ? allResourceIds.filter((id) => id.toLowerCase().includes(searchTerm.toLowerCase()))
      : allResourceIds;

    return filtered.sort();
  }, [allResourceIds, searchTerm]);

  // Create a map of pending resource IDs for quick lookup
  const pendingResourceMap = useMemo(() => {
    const map = new Map<string, boolean>();
    pendingResources?.forEach((pr) => {
      if (pr.type === 'new') {
        map.set(pr.id, true);
      }
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
        const isPending = pendingResourceMap.has(resourceId);
        const pendingResource = pendingResources?.find((pr) => pr.id === resourceId);
        const displayName = pendingResource?.displayName;

        return (
          <ResourceItem
            key={resourceId}
            resourceId={resourceId}
            displayName={displayName}
            isSelected={selectedResourceId === resourceId}
            isPending={isPending}
            annotation={resourceAnnotations?.[resourceId]}
            onClick={onResourceSelect}
            searchTerm={searchTerm}
          />
        );
      })}
    </div>
  );
};

export default ResourcePickerList;
