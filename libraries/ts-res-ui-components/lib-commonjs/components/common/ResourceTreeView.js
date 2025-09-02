'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResourceTreeView = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const contexts_1 = require('../../contexts');
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
const ResourceTreeView = ({
  resources,
  selectedResourceId,
  onResourceSelect,
  searchTerm = '',
  className = ''
}) => {
  // Get observability context
  const o11y = (0, contexts_1.useObservability)();
  const [expandedNodes, setExpandedNodes] = (0, react_1.useState)(new Set());
  // Build the tree structure from resources
  const treeData = (0, react_1.useMemo)(() => {
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
  const filteredTree = (0, react_1.useMemo)(() => {
    if (!treeData || !searchTerm) return treeData;
    // Helper function to check if a node or its descendants match the search
    const markMatchingNodes = (node, searchLower) => {
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
  const toggleNode = (0, react_1.useCallback)((nodeId) => {
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
  const expandMatchingNodes = (0, react_1.useCallback)(() => {
    if (!searchTerm || !filteredTree) return;
    const searchLower = searchTerm.toLowerCase();
    const nodesToExpand = new Set();
    const checkNode = (node) => {
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
  react_1.default.useEffect(() => {
    if (searchTerm) {
      expandMatchingNodes();
    }
  }, [searchTerm, expandMatchingNodes]);
  // Render a single tree node
  const renderTreeNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedResourceId === node.id;
    const nodeIdLower = node.id.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || nodeIdLower.includes(searchLower);
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
      { key: node.id },
      react_1.default.createElement(
        'div',
        {
          className: `flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-purple-50 border-l-2 border-purple-500' : ''
          } ${matchesSearch && searchTerm ? 'bg-yellow-50' : ''}`,
          style: { paddingLeft: `${level * 20 + 8}px` },
          onClick: () => {
            if (node.isLeaf) {
              onResourceSelect(node.id);
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
              className: 'mr-1 p-0.5 hover:bg-gray-200 rounded'
            },
            isExpanded
              ? react_1.default.createElement(outline_1.ChevronDownIcon, {
                  className: 'w-3 h-3 text-gray-600'
                })
              : react_1.default.createElement(outline_1.ChevronRightIcon, {
                  className: 'w-3 h-3 text-gray-600'
                })
          ),
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
            className: `text-sm truncate ${isSelected ? 'font-medium text-purple-900' : 'text-gray-700'} ${
              matchesSearch && searchTerm ? 'font-medium' : ''
            }`,
            title: node.id
          },
          node.name
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
  if (!filteredTree) {
    return react_1.default.createElement(
      'div',
      { className: `${className} p-4 text-center text-gray-500` },
      react_1.default.createElement('p', null, 'No resources available')
    );
  }
  return react_1.default.createElement(
    'div',
    { className: `${className} overflow-y-auto` },
    Array.from(filteredTree.children.values())
      .sort((a, b) => {
        // Sort folders first, then by name
        if (a.isLeaf !== b.isLeaf) {
          return a.isLeaf ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      })
      .map((child) => renderTreeNode(child))
  );
};
exports.ResourceTreeView = ResourceTreeView;
exports.default = exports.ResourceTreeView;
//# sourceMappingURL=ResourceTreeView.js.map
