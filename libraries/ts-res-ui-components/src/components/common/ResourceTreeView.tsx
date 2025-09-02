import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  FolderIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { Resources, Runtime } from '@fgv/ts-res';
import { useObservability } from '../../contexts';

/**
 * Props for the ResourceTreeView component.
 *
 * @public
 */
interface ResourceTreeViewProps {
  /** Resource manager or compiled collection to display as a tree */
  resources: Resources.ResourceManagerBuilder | Runtime.CompiledResourceCollection;
  /** Currently selected resource ID for highlighting */
  selectedResourceId: string | null;
  /** Callback fired when a resource is selected */
  onResourceSelect: (resourceId: string) => void;
  /** Optional search term to filter and highlight resources */
  searchTerm?: string;
  /** Optional CSS classes to apply to the container */
  className?: string;
}

/**
 * Internal tree node structure for rendering.
 *
 * @internal
 */
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

/**
 * A hierarchical tree view component for displaying and navigating resource structures.
 *
 * ResourceTreeView provides an interactive tree interface for browsing resource hierarchies,
 * with support for expansion/collapse, search filtering, selection highlighting, and intelligent
 * tree navigation. It automatically builds the tree structure from ts-res resource managers
 * and supports both builder and compiled resource collections.
 *
 * @example
 * ```tsx
 * import { ResourceTreeView } from '@fgv/ts-res-ui-components';
 *
 * function HierarchicalResourceBrowser() {
 *   const [selectedId, setSelectedId] = useState<string | null>(null);
 *   const [searchTerm, setSearchTerm] = useState('');
 *
 *   return (
 *     <div className="flex flex-col h-full">
 *       <div className="p-4 border-b">
 *         <input
 *           type="search"
 *           placeholder="Search in tree..."
 *           value={searchTerm}
 *           onChange={(e) => setSearchTerm(e.target.value)}
 *           className="w-full px-3 py-2 border rounded-md"
 *         />
 *       </div>
 *       <ResourceTreeView
 *         resources={resourceManager}
 *         selectedResourceId={selectedId}
 *         onResourceSelect={setSelectedId}
 *         searchTerm={searchTerm}
 *         className="flex-1 min-h-0 p-2"
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using with orchestrator state for integrated navigation
 * import { ResourceTools } from '@fgv/ts-res-ui-components';
 *
 * function OrchestratorTreeView() {
 *   const { state, actions } = ResourceTools.useResourceData();
 *   const [searchTerm, setSearchTerm] = useState('');
 *
 *   if (!state.resources) {
 *     return <div className="p-4 text-gray-500">No resources loaded</div>;
 *   }
 *
 *   return (
 *     <div className="h-full flex flex-col">
 *       <div className="flex items-center gap-2 p-2 border-b">
 *         <input
 *           type="search"
 *           placeholder="Search resources..."
 *           value={searchTerm}
 *           onChange={(e) => setSearchTerm(e.target.value)}
 *           className="flex-1 px-3 py-1 text-sm border rounded"
 *         />
 *         <span className="text-xs text-gray-500">
 *           {state.resources.summary?.resourceCount || 0} resources
 *         </span>
 *       </div>
 *       <ResourceTreeView
 *         resources={state.resources.resourceManager}
 *         selectedResourceId={state.selectedResourceId}
 *         onResourceSelect={(id) => actions.selectResource(id)}
 *         searchTerm={searchTerm}
 *         className="flex-1 min-h-0 overflow-auto"
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Advanced usage with custom tree navigation
 * function AdvancedResourceTree({ resources, onResourceAction }) {
 *   const [selectedId, setSelectedId] = useState<string | null>(null);
 *   const [searchTerm, setSearchTerm] = useState('');
 *
 *   const handleResourceSelect = (resourceId: string) => {
 *     setSelectedId(resourceId);
 *     onResourceAction('select', resourceId);
 *   };
 *
 *   const handleKeyDown = (event: React.KeyboardEvent) => {
 *     if (event.key === 'Enter' && selectedId) {
 *       onResourceAction('open', selectedId);
 *     }
 *   };
 *
 *   return (
 *     <div
 *       className="resource-tree-container"
 *       onKeyDown={handleKeyDown}
 *       tabIndex={0}
 *     >
 *       <div className="tree-header">
 *         <input
 *           type="search"
 *           placeholder="Find resources in tree..."
 *           value={searchTerm}
 *           onChange={(e) => setSearchTerm(e.target.value)}
 *         />
 *         <div className="tree-stats">
 *           {resources && (
 *             <span>
 *               Tree: {resources.getBuiltResourceTree().isSuccess() ? 'Built' : 'Error'}
 *             </span>
 *           )}
 *         </div>
 *       </div>
 *       <ResourceTreeView
 *         resources={resources}
 *         selectedResourceId={selectedId}
 *         onResourceSelect={handleResourceSelect}
 *         searchTerm={searchTerm}
 *         className="tree-content"
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @public
 */
export const ResourceTreeView: React.FC<ResourceTreeViewProps> = ({
  resources,
  selectedResourceId,
  onResourceSelect,
  searchTerm = '',
  className = ''
}) => {
  // Get observability context
  const o11y = useObservability();

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build the tree structure from resources
  const treeData = useMemo(() => {
    if (!resources) return null;

    // Get the tree from the resources
    const treeResult = resources.getBuiltResourceTree();
    if (treeResult.isFailure()) {
      o11y.diag.error('Failed to build resource tree:', treeResult.message);
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
