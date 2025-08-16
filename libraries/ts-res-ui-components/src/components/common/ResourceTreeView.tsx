import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { Resources, Runtime } from '@fgv/ts-res';

interface ResourceTreeViewProps {
  resources: Resources.ResourceManagerBuilder | Runtime.CompiledResourceCollection;
  selectedResourceId: string | null;
  onResourceSelect: (resourceId: string) => void;
  searchTerm?: string;
  className?: string;
}

interface TreeNode {
  id: string;
  name: string;
  isLeaf: boolean;
  resource?: Resources.Resource | Runtime.IResource;
  children?: Map<string, TreeNode>;
  isExpanded?: boolean;
  isVisible?: boolean;
  matchesSearch?: boolean;
}

/** @public */
export const ResourceTreeView: React.FC<ResourceTreeViewProps> = ({
  resources,
  selectedResourceId,
  onResourceSelect,
  searchTerm = '',
  className = ''
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build the tree structure from resources
  const treeData = useMemo(() => {
    if (!resources) return null;

    // Get the tree from the resources
    const treeResult = resources.getBuiltResourceTree();
    if (treeResult.isFailure()) {
      console.error('Failed to build resource tree:', treeResult.message);
      return null;
    }

    return treeResult.value;
  }, [resources]);

  // Filter tree based on search term
  const filteredTree = useMemo(() => {
    if (!treeData || !searchTerm) return treeData;

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

  // Toggle node expansion
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  }, []);

  // Expand all nodes that contain search matches
  const expandMatchingNodes = useCallback(() => {
    if (!searchTerm || !filteredTree) return;

    const searchLower = searchTerm.toLowerCase();
    const nodesToExpand = new Set<string>();

    const checkNode = (node: Runtime.ResourceTree.IReadOnlyResourceTreeNode<any>) => {
      if (node.id.toLowerCase().includes(searchLower)) {
        // Expand all parent nodes
        const parts = node.id.split('.');
        for (let i = 1; i < parts.length; i++) {
          nodesToExpand.add(parts.slice(0, i).join('.'));
        }
      }

      if (!node.isLeaf && node.children) {
        for (const child of node.children.values()) {
          checkNode(child);
        }
      }
    };

    for (const child of filteredTree.children.values()) {
      checkNode(child);
    }

    setExpandedNodes(nodesToExpand);
  }, [searchTerm, filteredTree]);

  // Auto-expand when search term changes
  React.useEffect(() => {
    if (searchTerm) {
      expandMatchingNodes();
    }
  }, [searchTerm, expandMatchingNodes]);

  // Render a single tree node
  const renderTreeNode = (
    node: Runtime.ResourceTree.IReadOnlyResourceTreeNode<Resources.Resource | Runtime.IResource>,
    level: number = 0
  ): React.ReactElement | null => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedResourceId === node.id;
    const nodeIdLower = node.id.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || nodeIdLower.includes(searchLower);

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
      <div key={node.id}>
        <div
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-purple-50 border-l-2 border-purple-500' : ''
          } ${matchesSearch && searchTerm ? 'bg-yellow-50' : ''}`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            if (node.isLeaf) {
              onResourceSelect(node.id);
            } else {
              toggleNode(node.id);
            }
          }}
        >
          {/* Expand/Collapse icon for branches */}
          {!node.isLeaf && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-gray-600" />
              )}
            </button>
          )}

          {/* Folder or document icon */}
          {node.isLeaf ? (
            <DocumentTextIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
          ) : isExpanded ? (
            <FolderOpenIcon className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
          ) : (
            <FolderIcon className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
          )}

          {/* Node name */}
          <span
            className={`text-sm truncate ${isSelected ? 'font-medium text-purple-900' : 'text-gray-700'} ${
              matchesSearch && searchTerm ? 'font-medium' : ''
            }`}
            title={node.id}
          >
            {node.name}
          </span>

          {/* Show child count for branches */}
          {!node.isLeaf && node.children && (
            <span className="ml-2 text-xs text-gray-500">({node.children.size})</span>
          )}
        </div>

        {/* Render children if expanded */}
        {!node.isLeaf && node.children && isExpanded && (
          <div>
            {Array.from(node.children.values())
              .sort((a, b) => {
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

  if (!filteredTree) {
    return (
      <div className={`${className} p-4 text-center text-gray-500`}>
        <p>No resources available</p>
      </div>
    );
  }

  return (
    <div className={`${className} overflow-y-auto`}>
      {Array.from(filteredTree.children.values())
        .sort((a, b) => {
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

export default ResourceTreeView;
