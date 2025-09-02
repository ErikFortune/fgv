'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResourcePickerList = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const ResourceItem_1 = require('./ResourceItem');
const treeNavigation_1 = require('./utils/treeNavigation');
/**
 * List view for the ResourcePicker component
 * Enhanced version of ResourceListView with annotation and pending resource support
 */
const ResourcePickerList = ({
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
}) => {
  // Merge existing and pending resources
  const allResourceIds = (0, react_1.useMemo)(() => {
    return (0, treeNavigation_1.mergeWithPendingResources)(resourceIds, pendingResources);
  }, [resourceIds, pendingResources]);
  // Apply branch isolation filtering
  const branchFilteredIds = (0, react_1.useMemo)(() => {
    return (0, treeNavigation_1.filterTreeBranch)(allResourceIds, rootPath, hideRootNode);
  }, [allResourceIds, rootPath, hideRootNode]);
  // Filter by search term and sort
  const filteredResourceIds = (0, react_1.useMemo)(() => {
    const filtered = searchTerm
      ? branchFilteredIds.filter((id) => id.toLowerCase().includes(searchTerm.toLowerCase()))
      : branchFilteredIds;
    return filtered.sort();
  }, [branchFilteredIds, searchTerm]);
  // Helper function to get display name with prefix truncation
  const getDisplayName = (0, react_1.useMemo)(() => {
    return (resourceId, pendingDisplayName) => {
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
  const pendingResourceMap = (0, react_1.useMemo)(() => {
    const map = new Map();
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
    return react_1.default.createElement(
      'div',
      { className: `${className} p-4 text-center text-gray-500` },
      react_1.default.createElement('p', null, searchTerm ? 'No resources match your search' : emptyMessage)
    );
  }
  return react_1.default.createElement(
    'div',
    { className: `${className} overflow-y-auto` },
    filteredResourceIds.map((resourceId) => {
      const pendingInfo = pendingResourceMap.get(resourceId);
      const isPending = Boolean(pendingInfo?.isPending);
      const pendingResource = pendingResources?.find((pr) => pr.id === resourceId);
      const truncatedDisplayName = getDisplayName(resourceId, pendingResource?.displayName);
      return react_1.default.createElement(ResourceItem_1.ResourceItem, {
        key: resourceId,
        resourceId: resourceId,
        displayName: truncatedDisplayName,
        isSelected: selectedResourceId === resourceId,
        isPending: isPending,
        annotation: resourceAnnotations?.[resourceId],
        onClick: onResourceSelect,
        searchTerm: searchTerm,
        resourceData: pendingInfo?.resourceData,
        pendingType: pendingInfo?.type
      });
    })
  );
};
exports.ResourcePickerList = ResourcePickerList;
exports.default = exports.ResourcePickerList;
//# sourceMappingURL=ResourcePickerList.js.map
