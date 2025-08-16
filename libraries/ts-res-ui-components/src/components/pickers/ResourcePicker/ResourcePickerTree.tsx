import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { ResourcePickerTreeProps } from './types';
import { Runtime } from '@fgv/ts-res';

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

  // Build the tree structure from resources using the proper ts-res API
  const treeData = useMemo(() => {
    if (!resources) return null;

    // Get the tree from the resource manager
    const resourceManager = resources.system.resourceManager;
    const treeResult = resourceManager.getBuiltResourceTree();
    if (treeResult.isFailure()) {
      console.error('Failed to build resource tree:', treeResult.message);
      return null;
    }

    return treeResult.value;
  }, [resources]);

  // Filter tree based on search term and root path
  const filteredTree = useMemo(() => {
    if (!treeData) return null;

    // TODO: Implement rootPath filtering and hideRootNode logic
    // For now, just handle search filtering similar to ResourceTreeView
    if (!searchTerm) return treeData;

    // Helper function to check if a node or its descendants match the search
    const markMatchingNodes = (
      node: Runtime.ResourceTree.IReadOnlyResourceTreeNode<any>,
      searchLower: string
    ): boolean => {
      const nodeIdLower = node.id.toLowerCase();
      let matches = nodeIdLower.includes(searchLower);

      if (!node.isLeaf && node.children) {
        // Check children recursively
        for (const child of node.children.values()) {
          if (markMatchingNodes(child, searchLower)) {
            matches = true;
          }
        }
      }

      return matches;
    };

    // Mark all matching nodes
    const searchLower = searchTerm.toLowerCase();
    for (const child of treeData.children.values()) {
      markMatchingNodes(child, searchLower);
    }

    return treeData;
  }, [treeData, searchTerm]);

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

  const renderTreeNode = (
    node: Runtime.ResourceTree.IReadOnlyResourceTreeNode<any>,
    level: number = 0
  ): React.ReactElement | null => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedResourceId === node.id;
    const nodeIdLower = node.id.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || nodeIdLower.includes(searchLower);
    const isPending = pendingResourceMap.has(node.id);
    const pendingResource = pendingResources?.find((pr) => pr.id === node.id);
    const displayName = pendingResource?.displayName || node.name;

    // Check if any children match
    let hasMatchingChildren = false;
    if (!node.isLeaf && node.children && searchTerm) {
      const checkChildren = (n: Runtime.ResourceTree.IReadOnlyResourceTreeNode<any>): boolean => {
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
              ${isPending ? 'italic opacity-70' : ''}
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
              .sort(
                (
                  a: Runtime.ResourceTree.IReadOnlyResourceTreeNode<any>,
                  b: Runtime.ResourceTree.IReadOnlyResourceTreeNode<any>
                ) => {
                  // Sort folders first, then by name
                  if (a.isLeaf !== b.isLeaf) {
                    return a.isLeaf ? 1 : -1;
                  }
                  return a.name.localeCompare(b.name);
                }
              )
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

  if (!filteredTree) {
    return (
      <div className={`${className} p-4 text-center text-gray-500`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${className} overflow-y-auto`}>
      {Array.from(filteredTree.children.values())
        .sort(
          (
            a: Runtime.ResourceTree.IReadOnlyResourceTreeNode<any>,
            b: Runtime.ResourceTree.IReadOnlyResourceTreeNode<any>
          ) => {
            // Sort folders first, then by name
            if (a.isLeaf !== b.isLeaf) {
              return a.isLeaf ? 1 : -1;
            }
            return a.name.localeCompare(b.name);
          }
        )
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
