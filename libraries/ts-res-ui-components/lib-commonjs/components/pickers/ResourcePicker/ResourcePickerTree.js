'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResourcePickerTree = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const contexts_1 = require('../../../contexts');
/**
 * Creates a virtual tree by merging real resource tree with pending resources
 */
function createVirtualTree(realTree, pendingResources = []) {
  if (!realTree) {
    return null;
  }
  // Helper to convert real node to virtual node
  const convertRealNode = (realNode) => {
    const virtualNode = {
      id: realNode.id,
      name: realNode.name,
      isLeaf: realNode.isLeaf,
      isPending: false,
      realNode,
      children: new Map()
    };
    // Convert children
    if (!realNode.isLeaf && realNode.children) {
      for (const child of realNode.children.values()) {
        const virtualChild = convertRealNode(child);
        virtualNode.children.set(child.id, virtualChild);
      }
    }
    return virtualNode;
  };
  // Start with the real tree structure
  const rootNode = {
    id: '',
    name: 'root',
    isLeaf: false,
    isPending: false,
    children: new Map()
  };
  // Convert all real children
  for (const realChild of realTree.children.values()) {
    const virtualChild = convertRealNode(realChild);
    rootNode.children.set(realChild.id, virtualChild);
  }
  // Add pending resources
  for (const pendingResource of pendingResources) {
    if (pendingResource.type === 'deleted') continue; // Skip deleted resources
    const pathParts = pendingResource.id.split('.');
    const displayName = pendingResource.displayName || pathParts[pathParts.length - 1];
    // Find or create parent nodes
    let currentNode = rootNode;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const partialPath = pathParts.slice(0, i + 1).join('.');
      if (!currentNode.children.has(partialPath)) {
        // Create virtual parent node
        const parentNode = {
          id: partialPath,
          name: pathParts[i],
          isLeaf: false,
          isPending: false,
          children: new Map()
        };
        currentNode.children.set(partialPath, parentNode);
      }
      currentNode = currentNode.children.get(partialPath);
      currentNode.isLeaf = false; // Ensure parent is not a leaf
    }
    // Create the pending resource node
    const pendingNode = {
      id: pendingResource.id,
      name: displayName,
      isLeaf: true,
      isPending: true,
      pendingResource,
      children: new Map()
    };
    currentNode.children.set(pendingResource.id, pendingNode);
  }
  return rootNode;
}
/**
 * Tree view for the ResourcePicker component
 * Enhanced version of ResourceTreeView with branch isolation and annotation support
 */
const ResourcePickerTree = ({
  resources,
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
  // Get observability context
  const o11y = (0, contexts_1.useObservability)();
  const [expandedNodes, setExpandedNodes] = (0, react_1.useState)(new Set());
  // Build the virtual tree structure from resources and pending resources
  const virtualTree = (0, react_1.useMemo)(() => {
    if (!resources) {
      return null;
    }
    // Get the tree from the resource manager
    const resourceManager = resources.system.resourceManager;
    const treeResult = resourceManager.getBuiltResourceTree();
    if (treeResult.isFailure()) {
      o11y.diag.error('ResourcePickerTree: Failed to build resource tree:', treeResult.message);
      return null;
    }
    // Create virtual tree that includes pending resources
    try {
      const virtualTree = createVirtualTree(treeResult.value, pendingResources);
      return virtualTree;
    } catch (error) {
      o11y.diag.error('ResourcePickerTree: Error in createVirtualTree:', error);
      return null;
    }
  }, [resources, pendingResources]);
  // Find the effective root node(s) to display
  const effectiveRootNodes = (0, react_1.useMemo)(() => {
    try {
      if (!virtualTree) {
        return [];
      }
      // If no rootPath, show all top-level nodes
      if (!rootPath) {
        const nodes = Array.from(virtualTree.children.values());
        return nodes;
      }
    } catch (error) {
      o11y.diag.error('ResourcePickerTree: Error in effectiveRootNodes calculation:', error);
      return [];
    }
    // Find the target node in the virtual tree
    const findVirtualNodeById = (node, targetId) => {
      if (node.id === targetId) {
        return node;
      }
      if (!node.isLeaf && node.children) {
        for (const child of node.children.values()) {
          const found = findVirtualNodeById(child, targetId);
          if (found) return found;
        }
      }
      return null;
    };
    // Search through all top-level children to find the target
    let targetNode = null;
    for (const child of virtualTree.children.values()) {
      targetNode = findVirtualNodeById(child, rootPath);
      if (targetNode) break;
    }
    if (!targetNode) {
      return []; // Target node not found
    }
    // If hideRootNode is true, show the target's children instead of the target itself
    if (hideRootNode && !targetNode.isLeaf && targetNode.children) {
      return Array.from(targetNode.children.values());
    } else {
      // Show the target node as the new root
      return [targetNode];
    }
  }, [virtualTree, rootPath, hideRootNode]);
  // Create a map of pending resource IDs for quick lookup
  const pendingResourceMap = (0, react_1.useMemo)(() => {
    const map = new Map();
    pendingResources?.forEach((pr) => {
      map.set(pr.id, pr);
    });
    return map;
  }, [pendingResources]);
  const toggleNode = (0, react_1.useCallback)((nodeId) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);
  const renderTreeNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedResourceId === node.id;
    const nodeIdLower = node.id.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || nodeIdLower.includes(searchLower);
    const isPending = node.isPending;
    const pendingResource = node.pendingResource;
    const displayName = node.name; // Virtual node already has the correct display name
    // Determine if this resource should be shown (not deleted)
    const isDeleted = pendingResource?.type === 'deleted';
    if (isDeleted) {
      return null; // Don't render deleted resources
    }
    // Check if any children match
    let hasMatchingChildren = false;
    if (!node.isLeaf && node.children && searchTerm) {
      const checkChildren = (n) => {
        if (n.id.toLowerCase().includes(searchLower)) return true;
        if (!n.isLeaf && n.children) {
          for (const child of n.children.values()) {
            if (checkChildren(child)) return true;
          }
        }
        return false;
      };
      for (const child of node.children.values()) {
        if (checkChildren(child)) {
          hasMatchingChildren = true;
          break;
        }
      }
    }
    // Hide nodes that don't match search and don't have matching children
    if (searchTerm && !matchesSearch && !hasMatchingChildren) {
      return null;
    }
    return react_1.default.createElement(
      'div',
      { key: node.id, className: 'select-none' },
      react_1.default.createElement(
        'div',
        {
          className: `
            flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100
            ${isSelected ? 'bg-purple-50 border-l-2 border-purple-500' : ''}
            ${matchesSearch && searchTerm ? 'bg-yellow-50' : ''}
            ${
              isPending && pendingResource?.type === 'new'
                ? 'bg-emerald-25 border-l-2 border-emerald-300'
                : ''
            }
            ${
              isPending && pendingResource?.type === 'modified'
                ? 'bg-amber-25 border-l-2 border-amber-300'
                : ''
            }
          `,
          style: { paddingLeft: `${level * 20 + 8}px` },
          onClick: () => {
            if (node.isLeaf) {
              onResourceSelect({
                resourceId: node.id,
                resourceData: node.pendingResource?.resourceData,
                isPending: node.isPending,
                pendingType: node.pendingResource?.type
              });
            } else {
              toggleNode(node.id);
            }
          }
        },
        !node.isLeaf &&
          react_1.default.createElement(
            'button',
            {
              onClick: (e) => {
                e.stopPropagation();
                toggleNode(node.id);
              },
              className: 'mr-1 hover:bg-gray-200 rounded p-0.5'
            },
            isExpanded
              ? react_1.default.createElement(outline_1.ChevronDownIcon, {
                  className: 'w-3 h-3 text-gray-600'
                })
              : react_1.default.createElement(outline_1.ChevronRightIcon, {
                  className: 'w-3 h-3 text-gray-600'
                })
          ),
        node.isLeaf && react_1.default.createElement('div', { className: 'w-4 mr-1' }),
        node.isLeaf
          ? react_1.default.createElement(outline_1.DocumentTextIcon, {
              className: 'w-4 h-4 text-green-500 mr-2 flex-shrink-0'
            })
          : isExpanded
          ? react_1.default.createElement(outline_1.FolderOpenIcon, {
              className: 'w-4 h-4 text-blue-500 mr-2 flex-shrink-0'
            })
          : react_1.default.createElement(outline_1.FolderIcon, {
              className: 'w-4 h-4 text-blue-500 mr-2 flex-shrink-0'
            }),
        react_1.default.createElement(
          'span',
          {
            className: `
              text-sm truncate flex-1
              ${isSelected ? 'font-medium text-purple-900' : 'text-gray-700'}
              ${isPending && pendingResource?.type === 'new' ? 'font-medium text-emerald-800' : ''}
              ${isPending && pendingResource?.type === 'modified' ? 'font-medium text-amber-800' : ''}
              ${matchesSearch && searchTerm ? 'font-medium' : ''}
            `,
            title: node.id
          },
          searchTerm
            ? react_1.default.createElement(HighlightedText, { text: displayName, searchTerm: searchTerm })
            : displayName
        ),
        resourceAnnotations?.[node.id] &&
          react_1.default.createElement(
            'div',
            { className: 'flex items-center gap-1 ml-2' },
            renderAnnotation(resourceAnnotations[node.id])
          ),
        !node.isLeaf &&
          node.children &&
          react_1.default.createElement(
            'span',
            { className: 'ml-2 text-xs text-gray-500' },
            '(',
            node.children.size,
            ')'
          )
      ),
      !node.isLeaf &&
        node.children &&
        isExpanded &&
        react_1.default.createElement(
          'div',
          null,
          Array.from(node.children.values())
            .sort((a, b) => {
              // Sort folders first, then by name
              if (a.isLeaf !== b.isLeaf) {
                return a.isLeaf ? 1 : -1;
              }
              return a.name.localeCompare(b.name);
            })
            .map((child) => renderTreeNode(child, level + 1))
        )
    );
  };
  const renderAnnotation = (annotation) => {
    const elements = [];
    if (annotation.indicator) {
      elements.push(
        react_1.default.createElement(
          'span',
          { key: 'indicator', className: 'text-xs', title: annotation.indicator.tooltip },
          annotation.indicator.type === 'dot'
            ? react_1.default.createElement('span', { className: 'text-orange-500' }, '\u25CF')
            : annotation.indicator.value
        )
      );
    }
    if (annotation.badge) {
      const getBadgeClasses = (variant) => {
        const baseClasses = 'px-1.5 py-0.5 text-xs font-medium rounded';
        const variantClasses = {
          info: 'bg-blue-100 text-blue-800',
          warning: 'bg-yellow-100 text-yellow-800',
          success: 'bg-green-100 text-green-800',
          error: 'bg-red-100 text-red-800',
          edited: 'bg-purple-100 text-purple-800',
          new: 'bg-emerald-100 text-emerald-800'
        };
        return `${baseClasses} ${variantClasses[variant] || variantClasses.info}`;
      };
      elements.push(
        react_1.default.createElement(
          'span',
          { key: 'badge', className: getBadgeClasses(annotation.badge.variant) },
          annotation.badge.text
        )
      );
    }
    if (annotation.suffix) {
      elements.push(
        react_1.default.createElement(
          'span',
          { key: 'suffix', className: 'text-xs text-gray-500' },
          annotation.suffix
        )
      );
    }
    return elements;
  };
  if (!virtualTree || effectiveRootNodes.length === 0) {
    return react_1.default.createElement(
      'div',
      { className: `${className} p-4 text-center text-gray-500` },
      react_1.default.createElement('p', null, emptyMessage)
    );
  }
  return react_1.default.createElement(
    'div',
    { className: `${className} overflow-y-auto !relative !z-auto !min-h-[200px]` },
    effectiveRootNodes
      .sort((a, b) => {
        // Sort folders first, then by name
        if (a.isLeaf !== b.isLeaf) {
          return a.isLeaf ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      })
      .map((child) => {
        return renderTreeNode(child);
      })
  );
};
exports.ResourcePickerTree = ResourcePickerTree;
/**
 * Component to highlight search terms in text
 */
const HighlightedText = ({ text, searchTerm }) => {
  if (!searchTerm) {
    return react_1.default.createElement('span', null, text);
  }
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);
  return react_1.default.createElement(
    'span',
    null,
    parts.map((part, index) =>
      regex.test(part)
        ? react_1.default.createElement('mark', { key: index, className: 'bg-yellow-200' }, part)
        : react_1.default.createElement('span', { key: index }, part)
    )
  );
};
exports.default = exports.ResourcePickerTree;
//# sourceMappingURL=ResourcePickerTree.js.map
