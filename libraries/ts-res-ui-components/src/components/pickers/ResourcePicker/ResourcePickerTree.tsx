import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { ResourcePickerTreeProps, PendingResource } from './types';
import { Runtime } from '@fgv/ts-res';

/**
 * Virtual tree node that can represent both real and pending resources
 */
interface VirtualTreeNode {
  id: string;
  name: string;
  isLeaf: boolean;
  isPending: boolean;
  pendingResource?: PendingResource;
  realNode?: Runtime.ResourceTree.IReadOnlyResourceTreeNode<any>;
  children: Map<string, VirtualTreeNode>;
}

/**
 * Creates a virtual tree by merging real resource tree with pending resources
 */
function createVirtualTree(
  realTree: Runtime.ResourceTree.IReadOnlyResourceTreeRoot<any> | null,
  pendingResources: PendingResource[] = []
): VirtualTreeNode | null {
  if (!realTree) return null;

  // Helper to convert real node to virtual node
  const convertRealNode = (
    realNode: Runtime.ResourceTree.IReadOnlyResourceTreeNode<any>
  ): VirtualTreeNode => {
    const virtualNode: VirtualTreeNode = {
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
  const rootNode: VirtualTreeNode = {
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
        const parentNode: VirtualTreeNode = {
          id: partialPath,
          name: pathParts[i],
          isLeaf: false,
          isPending: false,
          children: new Map()
        };
        currentNode.children.set(partialPath, parentNode);
      }

      currentNode = currentNode.children.get(partialPath)!;
      currentNode.isLeaf = false; // Ensure parent is not a leaf
    }

    // Create the pending resource node
    const pendingNode: VirtualTreeNode = {
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
export const ResourcePickerTree: React.FC<ResourcePickerTreeProps> = ({
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
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build the virtual tree structure from resources and pending resources
  const virtualTree = useMemo(() => {
    if (!resources) return null;

    // Get the tree from the resource manager
    const resourceManager = resources.system.resourceManager;
    const treeResult = resourceManager.getBuiltResourceTree();
    if (treeResult.isFailure()) {
      console.error('Failed to build resource tree:', treeResult.message);
      return null;
    }

    // Create virtual tree that includes pending resources
    return createVirtualTree(treeResult.value, pendingResources);
  }, [resources, pendingResources]);

  // Find the effective root node(s) to display
  const effectiveRootNodes = useMemo(() => {
    if (!virtualTree) return [];

    // If no rootPath, show all top-level nodes
    if (!rootPath) {
      return Array.from(virtualTree.children.values());
    }

    // Find the target node in the virtual tree
    const findVirtualNodeById = (node: VirtualTreeNode, targetId: string): VirtualTreeNode | null => {
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
    let targetNode: VirtualTreeNode | null = null;
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
  const pendingResourceMap = useMemo(() => {
    const map = new Map<string, PendingResource>();
    pendingResources?.forEach((pr) => {
      map.set(pr.id, pr);
    });
    return map;
  }, [pendingResources]);

  const toggleNode = useCallback((nodeId: string) => {
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

  const renderTreeNode = (node: VirtualTreeNode, level: number = 0): React.ReactElement | null => {
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
      const checkChildren = (n: VirtualTreeNode): boolean => {
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

    return (
      <div key={node.id} className="select-none">
        <div
          className={`
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
          `}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            if (node.isLeaf) {
              onResourceSelect(node.id);
            } else {
              toggleNode(node.id);
            }
          }}
        >
          {/* Expand/Collapse chevron */}
          {!node.isLeaf && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="mr-1 hover:bg-gray-200 rounded p-0.5"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-gray-600" />
              )}
            </button>
          )}

          {/* Spacer for alignment when no children */}
          {node.isLeaf && <div className="w-4 mr-1" />}

          {/* Folder/Document icon */}
          {node.isLeaf ? (
            <DocumentTextIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
          ) : isExpanded ? (
            <FolderOpenIcon className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
          ) : (
            <FolderIcon className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
          )}

          {/* Node name with search highlighting */}
          <span
            className={`
              text-sm truncate flex-1
              ${isSelected ? 'font-medium text-purple-900' : 'text-gray-700'}
              ${isPending && pendingResource?.type === 'new' ? 'font-medium text-emerald-800' : ''}
              ${isPending && pendingResource?.type === 'modified' ? 'font-medium text-amber-800' : ''}
              ${matchesSearch && searchTerm ? 'font-medium' : ''}
            `}
            title={node.id}
          >
            {searchTerm ? <HighlightedText text={displayName} searchTerm={searchTerm} /> : displayName}
          </span>

          {/* Annotations for any nodes */}
          {resourceAnnotations?.[node.id] && (
            <div className="flex items-center gap-1 ml-2">
              {renderAnnotation(resourceAnnotations[node.id])}
            </div>
          )}

          {/* Show child count for branches */}
          {!node.isLeaf && node.children && (
            <span className="ml-2 text-xs text-gray-500">({node.children.size})</span>
          )}
        </div>

        {/* Render children if expanded */}
        {!node.isLeaf && node.children && isExpanded && (
          <div>
            {Array.from(node.children.values())
              .sort((a: VirtualTreeNode, b: VirtualTreeNode) => {
                // Sort folders first, then by name
                if (a.isLeaf !== b.isLeaf) {
                  return a.isLeaf ? 1 : -1;
                }
                return a.name.localeCompare(b.name);
              })
              .map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderAnnotation = (annotation: any) => {
    const elements: React.ReactNode[] = [];

    if (annotation.indicator) {
      elements.push(
        <span key="indicator" className="text-xs" title={annotation.indicator.tooltip}>
          {annotation.indicator.type === 'dot' ? (
            <span className="text-orange-500">●</span>
          ) : (
            annotation.indicator.value
          )}
        </span>
      );
    }

    if (annotation.badge) {
      const getBadgeClasses = (variant: string) => {
        const baseClasses = 'px-1.5 py-0.5 text-xs font-medium rounded';
        const variantClasses: Record<string, string> = {
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
        <span key="badge" className={getBadgeClasses(annotation.badge.variant)}>
          {annotation.badge.text}
        </span>
      );
    }

    if (annotation.suffix) {
      elements.push(
        <span key="suffix" className="text-xs text-gray-500">
          {annotation.suffix}
        </span>
      );
    }

    return elements;
  };

  if (!virtualTree || effectiveRootNodes.length === 0) {
    return (
      <div className={`${className} p-4 text-center text-gray-500`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${className} overflow-y-auto`}>
      {effectiveRootNodes
        .sort((a: VirtualTreeNode, b: VirtualTreeNode) => {
          // Sort folders first, then by name
          if (a.isLeaf !== b.isLeaf) {
            return a.isLeaf ? 1 : -1;
          }
          return a.name.localeCompare(b.name);
        })
        .map((child) => renderTreeNode(child))}
    </div>
  );
};

/**
 * Component to highlight search terms in text
 */
const HighlightedText: React.FC<{ text: string; searchTerm: string }> = ({ text, searchTerm }) => {
  if (!searchTerm) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

export default ResourcePickerTree;
