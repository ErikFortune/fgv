/**
 * Utility functions for tree navigation and branch isolation
 */

/**
 * Filters resources to show only those under a specific path
 */
export function filterTreeBranch(resourceIds: string[], rootPath?: string, hideRootNode?: boolean): string[] {
  if (!rootPath) {
    return resourceIds;
  }

  const filtered = resourceIds.filter((id) => {
    if (hideRootNode) {
      // Show children of the root path, but not the root itself
      return id.startsWith(rootPath + '/') && id !== rootPath;
    }
    // Show the root path and all its children
    return id === rootPath || id.startsWith(rootPath + '/');
  });

  return filtered;
}

/**
 * Adjusts resource IDs for display when showing an isolated branch
 * This makes the branch appear as if it's the root
 */
export function adjustResourcePath(resourceId: string, rootPath?: string, hideRootNode?: boolean): string {
  if (!rootPath || !hideRootNode) {
    return resourceId;
  }

  // Remove the root path prefix to make children appear as top-level
  if (resourceId.startsWith(rootPath + '/')) {
    return resourceId.substring(rootPath.length + 1);
  }

  return resourceId;
}

/**
 * Gets the display name for a resource, handling path adjustments
 */
export function getResourceDisplayName(
  resourceId: string,
  rootPath?: string,
  hideRootNode?: boolean
): string {
  const adjustedPath = adjustResourcePath(resourceId, rootPath, hideRootNode);

  // Extract just the last segment for display
  const segments = adjustedPath.split('/');
  return segments[segments.length - 1] || adjustedPath;
}

/**
 * Builds a tree structure from flat resource IDs
 */
export interface TreeNode {
  id: string;
  displayName: string;
  children: TreeNode[];
  isExpanded?: boolean;
  isPending?: boolean;
}

export function buildResourceTree(
  resourceIds: string[],
  rootPath?: string,
  hideRootNode?: boolean,
  expandedNodes?: Set<string>
): TreeNode[] {
  const tree: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Filter resources based on root path
  const filteredIds = filterTreeBranch(resourceIds, rootPath, hideRootNode);

  // Sort IDs to ensure parents come before children
  const sortedIds = [...filteredIds].sort();

  for (const id of sortedIds) {
    const segments = id.split('/');
    const adjustedId = adjustResourcePath(id, rootPath, hideRootNode);
    const adjustedSegments = adjustedId.split('/');

    const node: TreeNode = {
      id,
      displayName: segments[segments.length - 1],
      children: [],
      isExpanded: expandedNodes?.has(id)
    };

    nodeMap.set(id, node);

    if (adjustedSegments.length === 1) {
      // Top-level node in the adjusted tree
      tree.push(node);
    } else {
      // Find parent node
      const parentSegments = segments.slice(0, -1);
      const parentId = parentSegments.join('/');
      const parentNode = nodeMap.get(parentId);

      if (parentNode) {
        parentNode.children.push(node);
      }
    }
  }

  return tree;
}

/**
 * Flattens a tree structure back to a list of IDs
 */
export function flattenTree(nodes: TreeNode[]): string[] {
  const result: string[] = [];

  function traverse(node: TreeNode) {
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
export function searchResources(
  resourceIds: string[],
  searchTerm: string,
  searchScope: 'all' | 'current-branch' = 'all',
  rootPath?: string
): string[] {
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
export function mergeWithPendingResources(
  existingIds: string[],
  pendingResources?: Array<{ id: string; type: 'new' | 'deleted' }>
): string[] {
  if (!pendingResources || pendingResources.length === 0) {
    return existingIds;
  }

  // Filter out deleted resources
  const filteredExisting = existingIds.filter(
    (id) => !pendingResources.some((pr) => pr.id === id && pr.type === 'deleted')
  );

  // Add new resources
  const newResourceIds = pendingResources.filter((pr) => pr.type === 'new').map((pr) => pr.id);

  // Combine and sort
  return [...filteredExisting, ...newResourceIds].sort();
}
