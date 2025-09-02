'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResourcePicker = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const ResourcePickerList_1 = require('./ResourcePickerList');
const ResourcePickerTree_1 = require('./ResourcePickerTree');
const treeNavigation_1 = require('./utils/treeNavigation');
/**
 * Comprehensive resource picker component with search, view modes, and annotation support.
 *
 * The ResourcePicker provides a flexible interface for browsing and selecting resources
 * from processed resource collections. It supports both list and tree view modes,
 * search functionality, visual annotations, and pending resource management.
 *
 * Key features:
 * - **Multiple view modes**: List view for simple browsing, tree view for hierarchical navigation
 * - **Search functionality**: Search across all resources or within a specific branch
 * - **Visual annotations**: Display badges, indicators, and suffixes for enhanced UX
 * - **Pending resources**: Show unsaved changes alongside persisted resources
 * - **Branch isolation**: Focus on a specific branch node of the resource tree
 * - **Type safety**: Full TypeScript support with generic resource data types
 *
 * @example
 * ```tsx
 * function MyResourceEditor() {
 *   const [selectedId, setSelectedId] = useState<string | null>(null);
 *   const [selectedData, setSelectedData] = useState<MyResourceType | null>(null);
 *
 *   return (
 *     <ResourcePicker<MyResourceType>
 *       resources={processedResources}
 *       selectedResourceId={selectedId}
 *       onResourceSelect={(selection) => {
 *         setSelectedId(selection.resourceId);
 *         setSelectedData(selection.resourceData || null);
 *
 *         if (selection.isPending) {
 *           console.log(`Pending ${selection.pendingType} operation`);
 *         }
 *       }}
 *       defaultView="tree"
 *       enableSearch={true}
 *       searchPlaceholder="Search resources..."
 *       resourceAnnotations={{
 *         'user.welcome': {
 *           badge: { text: '3', variant: 'info' },
 *           suffix: '(3 candidates)'
 *         }
 *       }}
 *       pendingResources={[{
 *         id: 'user.new-item',
 *         type: 'new',
 *         displayName: 'New Welcome Message',
 *         resourceData: { text: 'Hello World!' }
 *       }]}
 *       height="500px"
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
const ResourcePicker = ({
  resources,
  selectedResourceId,
  onResourceSelect,
  resourceAnnotations,
  pendingResources,
  options,
  className = '',
  onMessage
}) => {
  // Extract options with defaults
  const {
    defaultView = 'list',
    showViewToggle = true,
    rootPath,
    hideRootNode = false,
    enableSearch = true,
    searchPlaceholder,
    searchScope = 'current-branch',
    emptyMessage,
    height = '600px'
  } = options || {};
  const [viewMode, setViewMode] = (0, react_1.useState)(defaultView);
  const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
  // Get resource IDs based on current filters
  const resourceIds = (0, react_1.useMemo)(() => {
    if (!resources?.summary.resourceIds) {
      return [];
    }
    let ids = resources.summary.resourceIds;
    // Apply branch filtering if specified
    if (rootPath) {
      ids = (0, treeNavigation_1.filterTreeBranch)(ids, rootPath, hideRootNode);
    }
    // Apply search filtering
    if (searchTerm) {
      ids = (0, treeNavigation_1.searchResources)(ids, searchTerm, searchScope, rootPath);
    }
    return ids;
  }, [resources?.summary.resourceIds, rootPath, hideRootNode, searchTerm, searchScope]);
  // Handle resource selection
  const handleResourceSelect = (0, react_1.useCallback)(
    (selection) => {
      onResourceSelect(selection);
      if (selection.resourceId) {
        onMessage?.('info', `Selected resource: ${selection.resourceId}`);
      }
    },
    [onResourceSelect, onMessage]
  );
  // Calculate dynamic search placeholder
  const getSearchPlaceholder = () => {
    if (searchPlaceholder) {
      return searchPlaceholder;
    }
    if (rootPath && hideRootNode) {
      const segments = rootPath.split('/');
      const branchName = segments[segments.length - 1];
      return `Search ${branchName}...`;
    }
    return 'Search resources...';
  };
  // Handle empty state
  if (!resources) {
    return react_1.default.createElement(
      'div',
      { className: `${className} p-4 text-center text-gray-500` },
      react_1.default.createElement('p', null, emptyMessage || 'No resources loaded')
    );
  }
  const containerHeight = typeof height === 'number' ? `${height}px` : height;
  return react_1.default.createElement(
    'div',
    {
      className: `flex flex-col !relative !z-auto !min-h-[400px] ${className}`,
      style: {
        height: containerHeight
      }
    },
    (enableSearch || showViewToggle) &&
      react_1.default.createElement(
        'div',
        { className: 'flex flex-col gap-3 mb-4' },
        enableSearch &&
          react_1.default.createElement(
            'div',
            { className: 'relative' },
            react_1.default.createElement(outline_1.MagnifyingGlassIcon, {
              className: 'absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400'
            }),
            react_1.default.createElement('input', {
              type: 'text',
              placeholder: getSearchPlaceholder(),
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className:
                'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            })
          ),
        showViewToggle &&
          react_1.default.createElement(
            'div',
            { className: 'flex items-center justify-between' },
            react_1.default.createElement(
              'span',
              { className: 'text-sm text-gray-600' },
              resourceIds.length,
              ' resource',
              resourceIds.length !== 1 ? 's' : '',
              searchTerm && ` matching "${searchTerm}"`
            ),
            react_1.default.createElement(
              'div',
              { className: 'flex items-center space-x-1 bg-gray-100 rounded-lg p-1' },
              react_1.default.createElement(
                'button',
                {
                  onClick: () => setViewMode('list'),
                  className: `flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`,
                  title: 'List View'
                },
                react_1.default.createElement(outline_1.ListBulletIcon, { className: 'h-4 w-4' }),
                react_1.default.createElement('span', { className: 'ml-1' }, 'List')
              ),
              react_1.default.createElement(
                'button',
                {
                  onClick: () => setViewMode('tree'),
                  className: `flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === 'tree'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`,
                  title: 'Tree View'
                },
                react_1.default.createElement(outline_1.FolderIcon, { className: 'h-4 w-4' }),
                react_1.default.createElement('span', { className: 'ml-1' }, 'Tree')
              )
            )
          )
      ),
    react_1.default.createElement(
      'div',
      {
        className:
          'flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 !relative !z-auto !min-h-[300px]'
      },
      viewMode === 'tree'
        ? react_1.default.createElement(ResourcePickerTree_1.ResourcePickerTree, {
            resources: resources,
            pendingResources: pendingResources,
            selectedResourceId: selectedResourceId,
            onResourceSelect: handleResourceSelect,
            resourceAnnotations: resourceAnnotations,
            searchTerm: searchTerm,
            rootPath: rootPath,
            hideRootNode: hideRootNode,
            emptyMessage: emptyMessage
          })
        : react_1.default.createElement(ResourcePickerList_1.ResourcePickerList, {
            resourceIds: resources.summary.resourceIds || [],
            pendingResources: pendingResources,
            selectedResourceId: selectedResourceId,
            onResourceSelect: handleResourceSelect,
            resourceAnnotations: resourceAnnotations,
            searchTerm: searchTerm,
            rootPath: rootPath,
            hideRootNode: hideRootNode,
            emptyMessage: emptyMessage
          })
    )
  );
};
exports.ResourcePicker = ResourcePicker;
exports.default = exports.ResourcePicker;
//# sourceMappingURL=index.js.map
