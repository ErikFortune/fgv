'use strict';
/**
 * Utility functions for tree navigation and branch isolation
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.filterTreeBranch = filterTreeBranch;
exports.adjustResourcePath = adjustResourcePath;
exports.getResourceDisplayName = getResourceDisplayName;
exports.buildResourceTree = buildResourceTree;
exports.flattenTree = flattenTree;
exports.searchResources = searchResources;
exports.mergeWithPendingResources = mergeWithPendingResources;
/**
 * Filters resources to show only those under a specific path
 */
function filterTreeBranch(resourceIds, rootPath, hideRootNode) {
  if (!rootPath) {
    return resourceIds;
  }
  const filtered = resourceIds.filter((id) => {
    if (hideRootNode) {
      // Show children of the root path, but not the root itself
      return id.startsWith(rootPath + '.') && id !== rootPath;
    }
    // Show the root path and all its children
    return id === rootPath || id.startsWith(rootPath + '.');
  });
  return filtered;
}
/**
 * Adjusts resource IDs for display when showing an isolated branch
 * This makes the branch appear as if it's the root
 */
function adjustResourcePath(resourceId, rootPath, hideRootNode) {
  if (!rootPath || !hideRootNode) {
    return resourceId;
  }
  // Remove the root path prefix to make children appear as top-level
  if (resourceId.startsWith(rootPath + '.')) {
    return resourceId.substring(rootPath.length + 1);
  }
  return resourceId;
}
/**
 * Gets the display name for a resource, handling path adjustments
 */
function getResourceDisplayName(resourceId, rootPath, hideRootNode) {
  const adjustedPath = adjustResourcePath(resourceId, rootPath, hideRootNode);
  // Extract just the last segment for display
  const segments = adjustedPath.split('/');
  return segments[segments.length - 1] || adjustedPath;
}
function buildResourceTree(resourceIds, rootPath, hideRootNode, expandedNodes) {
  const tree = [];
  const nodeMap = new Map();
  // Filter resources based on root path
  const filteredIds = filterTreeBranch(resourceIds, rootPath, hideRootNode);
  // Sort IDs to ensure parents come before children
  const sortedIds = [...filteredIds].sort();
  // Convert dot notation to slash notation for tree building
  const convertedIds = sortedIds.map((id) => id.replace(/\./g, '/'));
  // Check for conflicts where a converted ID would be both a parent and leaf
  const conflicts = new Set();
  for (const convertedId of convertedIds) {
    const hasChildren = convertedIds.some(
      (otherId) => otherId !== convertedId && otherId.startsWith(convertedId + '/')
    );
    if (hasChildren && convertedIds.includes(convertedId)) {
      conflicts.add(convertedId);
    }
  }
  if (conflicts.size > 0) {
    throw new Error(`${Array.from(conflicts)[0]}: Duplicate resource at path.`);
  }
  // Build tree with converted IDs but keep original IDs for node references
  for (let i = 0; i < sortedIds.length; i++) {
    const originalId = sortedIds[i];
    const convertedId = convertedIds[i];
    const segments = convertedId.split('/');
    const adjustedId = adjustResourcePath(convertedId, rootPath, hideRootNode);
    const adjustedSegments = adjustedId.split('/');
    const node = {
      id: originalId, // Keep original ID
      displayName: segments[segments.length - 1],
      children: [],
      isExpanded: expandedNodes?.has(originalId)
    };
    nodeMap.set(originalId, node);
    if (adjustedSegments.length === 1) {
      // Top-level node in the adjusted tree
      tree.push(node);
    } else {
      // Find parent node using converted path logic
      const parentSegments = segments.slice(0, -1);
      const parentConvertedId = parentSegments.join('/');
      // Find the original ID that corresponds to this parent path
      const parentOriginalIndex = convertedIds.indexOf(parentConvertedId);
      if (parentOriginalIndex >= 0) {
        const parentOriginalId = sortedIds[parentOriginalIndex];
        const parentNode = nodeMap.get(parentOriginalId);
        if (parentNode) {
          parentNode.children.push(node);
        }
      }
    }
  }
  return tree;
}
/**
 * Flattens a tree structure back to a list of IDs
 */
function flattenTree(nodes) {
  const result = [];
  function traverse(node) {
    result.push(node.id);
    for (const child of node.children) {
      traverse(child);
    }
  }
  for (const node of nodes) {
    traverse(node);
  }
  return result;
}
/**
 * Searches for resources matching a search term
 */
function searchResources(resourceIds, searchTerm, searchScope = 'all', rootPath) {
  if (!searchTerm) {
    return resourceIds;
  }
  const term = searchTerm.toLowerCase();
  let searchableIds = resourceIds;
  // If searching only current branch, filter first
  if (searchScope === 'current-branch' && rootPath) {
    searchableIds = filterTreeBranch(resourceIds, rootPath, false);
  }
  return searchableIds.filter((id) => id.toLowerCase().includes(term));
}
/**
 * Merges pending resources with existing resources
 */
function mergeWithPendingResources(existingIds, pendingResources) {
  if (!pendingResources || pendingResources.length === 0) {
    return existingIds;
  }
  // Filter out deleted resources
  const filteredExisting = existingIds.filter(
    (id) => !pendingResources.some((pr) => pr.id === id && pr.type === 'deleted')
  );
  // Add new and modified resources (modified resources might not exist in existingIds yet)
  const newResourceIds = pendingResources
    .filter((pr) => pr.type === 'new' || pr.type === 'modified')
    .map((pr) => pr.id)
    .filter((id) => !filteredExisting.includes(id)); // Avoid duplicates
  // Combine and sort
  return [...filteredExisting, ...newResourceIds].sort();
}
//# sourceMappingURL=treeNavigation.js.map
