'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CompiledView = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const ts_res_1 = require('@fgv/ts-res');
const ts_utils_1 = require('@fgv/ts-utils');
const ResourcePicker_1 = require('../../pickers/ResourcePicker');
const ResourcePickerOptionsControl_1 = require('../../common/ResourcePickerOptionsControl');
/**
 * CompiledView component for browsing compiled resource collections and metadata.
 *
 * Provides an interface for exploring the compiled resource collection structure,
 * including resources, configuration metadata, qualifiers, and resource types.
 * Supports both filtered and unfiltered views with export functionality.
 *
 * **Key Features:**
 * - **Compiled structure browsing**: Navigate through compiled resource collections
 * - **Metadata exploration**: View system configuration, qualifiers, and resource types
 * - **Filter integration**: Works with filtered resource collections
 * - **Tree-based navigation**: Hierarchical view of resources and metadata
 * - **Export functionality**: Export compiled collections in various formats
 * - **Bundle support**: View and export as ts-res bundles for distribution
 *
 * @example
 * ```tsx
 * import { CompiledView } from '@fgv/ts-res-ui-components';
 *
 * function MyCompiledBrowser() {
 *   const handleExport = (format) => {
 *     console.log(`Exporting compiled resources as ${format}...`);
 *   };
 *
 *   return (
 *     <CompiledView
 *       resources={processedResources}
 *       filterState={filterState}
 *       filterResult={filterResult}
 *       useNormalization={true}
 *       onExport={handleExport}
 *       onMessage={(type, message) => console.log(`${type}: ${message}`)}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
const CompiledView = ({
  resources,
  filterState,
  filterResult,
  useNormalization: useNormalizationProp = false,
  onExport,
  onMessage,
  pickerOptions,
  pickerOptionsPresentation = 'hidden',
  className = ''
}) => {
  const [selectedResourceId, setSelectedResourceId] = (0, react_1.useState)(null);
  const [selectedMetadataSection, setSelectedMetadataSection] = (0, react_1.useState)(null);
  const [expandedNodes, setExpandedNodes] = (0, react_1.useState)(new Set(['metadata']));
  const [showJsonView, setShowJsonView] = (0, react_1.useState)(false);
  const [useNormalization, setUseNormalization] = (0, react_1.useState)(useNormalizationProp);
  // State for picker options control
  const [currentPickerOptions, setCurrentPickerOptions] = (0, react_1.useState)(pickerOptions || {});
  const [activeTab, setActiveTab] = (0, react_1.useState)('resources');
  // Merge picker options with compiled view-specific defaults
  const effectivePickerOptions = (0, react_1.useMemo)(
    () => ({
      defaultView: 'tree',
      showViewToggle: true,
      enableSearch: true,
      searchPlaceholder: 'Search compiled resources...',
      searchScope: 'all',
      height: '500px',
      emptyMessage: 'No compiled resources available',
      // Override with user-provided options
      ...pickerOptions,
      // Override with current picker options from control
      ...currentPickerOptions
    }),
    [pickerOptions, currentPickerOptions]
  );
  // Update normalization default when bundle state changes
  (0, react_1.useEffect)(() => {
    if (resources?.isLoadedFromBundle && !useNormalization) {
      setUseNormalization(true);
    }
  }, [resources?.isLoadedFromBundle, useNormalization]);
  // Use filtered resources when filtering is active and successful
  const isFilteringActive = filterState?.enabled && filterResult?.success === true;
  const activeProcessedResources = isFilteringActive ? filterResult?.processedResources : resources;
  // Get the active compiled collection
  const activeCompiledCollection = (0, react_1.useMemo)(() => {
    return isFilteringActive
      ? filterResult?.processedResources?.compiledCollection
      : resources?.compiledCollection;
  }, [
    isFilteringActive,
    filterResult?.processedResources?.compiledCollection,
    resources?.compiledCollection
  ]);
  // Build metadata tree structure for non-resource sections
  const metadataTree = (0, react_1.useMemo)(() => {
    if (!activeCompiledCollection) {
      return null;
    }
    const tree = {
      id: 'metadata',
      name: 'Compiled Collection Metadata',
      type: 'folder',
      children: []
    };
    try {
      // Collectors section - showing from compiled collection
      tree.children.push({
        id: 'qualifiers',
        name: `Qualifiers (${activeCompiledCollection.qualifiers?.length ?? 0})`,
        type: 'section',
        data: { type: 'qualifiers', items: activeCompiledCollection.qualifiers }
      });
      tree.children.push({
        id: 'qualifier-types',
        name: `Qualifier Types (${activeCompiledCollection.qualifierTypes?.length ?? 0})`,
        type: 'section',
        data: { type: 'qualifier-types', items: activeCompiledCollection.qualifierTypes }
      });
      tree.children.push({
        id: 'resource-types',
        name: `Resource Types (${activeCompiledCollection.resourceTypes?.length ?? 0})`,
        type: 'section',
        data: { type: 'resource-types', items: activeCompiledCollection.resourceTypes }
      });
      tree.children.push({
        id: 'conditions',
        name: `Conditions (${activeCompiledCollection.conditions?.length ?? 0})`,
        type: 'section',
        data: { type: 'conditions', items: activeCompiledCollection.conditions }
      });
      tree.children.push({
        id: 'condition-sets',
        name: `Condition Sets (${activeCompiledCollection.conditionSets?.length ?? 0})`,
        type: 'section',
        data: { type: 'condition-sets', items: activeCompiledCollection.conditionSets }
      });
      tree.children.push({
        id: 'decisions',
        name: `Decisions (${activeCompiledCollection.decisions?.length ?? 0})`,
        type: 'section',
        data: { type: 'decisions', items: activeCompiledCollection.decisions }
      });
      tree.children.push({
        id: 'candidate-values',
        name: `Candidate Values (${activeCompiledCollection.candidateValues?.length ?? 0})`,
        type: 'section',
        data: { type: 'candidate-values', items: activeCompiledCollection.candidateValues }
      });
    } catch (error) {
      onMessage?.(
        'error',
        `Error building metadata tree: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    return tree;
  }, [activeCompiledCollection, onMessage]);
  // Create resource annotations for compiled collection metadata
  const resourceAnnotations = (0, react_1.useMemo)(() => {
    const annotations = {};
    if (activeCompiledCollection?.resources) {
      activeCompiledCollection.resources.forEach((resource) => {
        const resourceId = String(resource.id);
        // Get compiled resource metadata
        const decision = activeCompiledCollection.decisions?.[resource.decision];
        const candidateCount = decision?.conditionSets?.length ?? 0;
        const resourceType = activeCompiledCollection.resourceTypes?.[resource.type];
        annotations[resourceId] = {
          suffix: `${candidateCount} candidate${candidateCount !== 1 ? 's' : ''}`,
          badge: resourceType
            ? {
                text: resourceType.name ?? 'unknown',
                variant: 'info'
              }
            : undefined
        };
        // Add indicator for resources with no candidates
        if (candidateCount === 0) {
          annotations[resourceId].indicator = {
            type: 'icon',
            value: '⚠️',
            tooltip: 'No candidates in compiled resource'
          };
        }
      });
    }
    return annotations;
  }, [activeCompiledCollection]);
  const handleExportCompiledData = (0, react_1.useCallback)(async () => {
    if (!activeProcessedResources?.compiledCollection) {
      onMessage?.('error', 'No compiled data available to export');
      return;
    }
    let compiledCollection = activeProcessedResources.compiledCollection;
    if (useNormalization && resources?.activeConfiguration) {
      const systemConfigResult = ts_res_1.Config.SystemConfiguration.create(resources.activeConfiguration);
      if (systemConfigResult.isSuccess()) {
        // Check if we have a ResourceManagerBuilder (which supports normalization)
        if ('getCompiledResourceCollection' in activeProcessedResources.system.resourceManager) {
          const resourceManagerResult = ts_res_1.Bundle.BundleNormalizer.normalize(
            activeProcessedResources.system.resourceManager,
            systemConfigResult.value
          );
          if (resourceManagerResult.isSuccess()) {
            const normalizedCompiledResult = resourceManagerResult.value.getCompiledResourceCollection({
              includeMetadata: true
            });
            if (normalizedCompiledResult.isSuccess()) {
              compiledCollection = normalizedCompiledResult.value;
            } else {
              console.warn('Failed to get normalized compiled collection:', normalizedCompiledResult.message);
            }
          } else {
            console.warn('Failed to normalize bundle:', resourceManagerResult.message);
          }
        }
        // For IResourceManager from bundles, the compiled collection is already normalized
      } else {
        console.warn('Failed to create system configuration for normalization:', systemConfigResult.message);
      }
    }
    const compiledData = {
      ...compiledCollection,
      metadata: {
        exportedAt: new Date().toISOString(),
        type: isFilteringActive ? 'ts-res-filtered-compiled-collection' : 'ts-res-compiled-collection',
        normalized: useNormalization,
        ...(resources?.isLoadedFromBundle && { loadedFromBundle: true }),
        ...(isFilteringActive && { filterContext: filterState?.appliedValues })
      }
    };
    onExport?.(compiledData, 'json');
  }, [
    activeProcessedResources,
    onMessage,
    isFilteringActive,
    filterState?.appliedValues,
    useNormalization,
    resources,
    onExport
  ]);
  const handleExportBundle = (0, react_1.useCallback)(async () => {
    if (!activeProcessedResources?.system?.resourceManager || !resources?.activeConfiguration) {
      onMessage?.('error', 'No resource manager or configuration available to create bundle');
      return;
    }
    const systemConfigResult = ts_res_1.Config.SystemConfiguration.create(resources.activeConfiguration);
    if (systemConfigResult.isFailure()) {
      onMessage?.('error', `Failed to create system configuration: ${systemConfigResult.message}`);
      return;
    }
    const systemConfig = systemConfigResult.value;
    const bundleParams = {
      version: '1.0.0',
      description: isFilteringActive
        ? 'Bundle exported from ts-res-ui-components (filtered)'
        : 'Bundle exported from ts-res-ui-components',
      normalize: true
    };
    // Check if we have a ResourceManagerBuilder (which supports bundle creation)
    if (!('getCompiledResourceCollection' in activeProcessedResources.system.resourceManager)) {
      onMessage?.('error', 'Bundle export is not supported for resources loaded from bundles');
      return;
    }
    const bundleResult = ts_res_1.Bundle.BundleBuilder.create(
      activeProcessedResources.system.resourceManager,
      systemConfig,
      bundleParams
    );
    if (bundleResult.isFailure()) {
      onMessage?.('error', `Failed to create bundle: ${bundleResult.message}`);
      return;
    }
    const bundle = bundleResult.value;
    const exportBundle = {
      ...bundle,
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedFrom: 'ts-res-ui-components',
        type: isFilteringActive ? 'ts-res-bundle-filtered' : 'ts-res-bundle',
        ...(isFilteringActive && { filterContext: filterState?.appliedValues })
      }
    };
    onExport?.(exportBundle, 'bundle');
  }, [
    activeProcessedResources?.system?.resourceManager,
    resources?.activeConfiguration,
    onMessage,
    isFilteringActive,
    filterState?.appliedValues,
    onExport
  ]);
  // Handle resource selection from ResourcePicker
  const handleResourceSelect = (0, react_1.useCallback)(
    (selection) => {
      setSelectedResourceId(selection.resourceId);
      setSelectedMetadataSection(null); // Clear metadata selection when resource is selected
      setActiveTab('resources');
      if (selection.resourceId) {
        onMessage?.('info', `Selected compiled resource: ${selection.resourceId}`);
      }
    },
    [onMessage]
  );
  // Handle metadata node selection
  const handleMetadataNodeClick = (node) => {
    setSelectedMetadataSection(node.id);
    setSelectedResourceId(null); // Clear resource selection when metadata is selected
    setActiveTab('metadata');
    onMessage?.('info', `Selected metadata: ${node.name}`);
    if (node.type === 'folder' || (node.type === 'section' && node.children)) {
      setExpandedNodes((prev) => {
        const newExpanded = new Set(prev);
        if (newExpanded.has(node.id)) {
          newExpanded.delete(node.id);
        } else {
          newExpanded.add(node.id);
        }
        return newExpanded;
      });
    }
  };
  const renderTreeNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedMetadataSection === node.id;
    const hasChildren = node.children && node.children.length > 0;
    return react_1.default.createElement(
      'div',
      { key: node.id },
      react_1.default.createElement(
        'div',
        {
          className: `flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
          }`,
          style: { paddingLeft: `${8 + level * 16}px` },
          onClick: () => handleMetadataNodeClick(node)
        },
        hasChildren &&
          react_1.default.createElement(
            'div',
            { className: 'w-4 h-4 mr-1 flex items-center justify-center' },
            isExpanded
              ? react_1.default.createElement(outline_1.ChevronDownIcon, {
                  className: 'w-3 h-3 text-gray-500'
                })
              : react_1.default.createElement(outline_1.ChevronRightIcon, {
                  className: 'w-3 h-3 text-gray-500'
                })
          ),
        !hasChildren && react_1.default.createElement('div', { className: 'w-5 mr-1' }),
        react_1.default.createElement(
          'div',
          { className: 'w-4 h-4 mr-2 flex items-center justify-center' },
          node.type === 'folder'
            ? isExpanded
              ? react_1.default.createElement(outline_1.FolderOpenIcon, {
                  className: 'w-4 h-4 text-blue-500'
                })
              : react_1.default.createElement(outline_1.FolderIcon, { className: 'w-4 h-4 text-blue-500' })
            : node.type === 'resource'
            ? react_1.default.createElement(outline_1.DocumentTextIcon, {
                className: 'w-4 h-4 text-green-500'
              })
            : react_1.default.createElement(outline_1.CubeIcon, { className: 'w-4 h-4 text-purple-500' })
        ),
        react_1.default.createElement(
          'span',
          { className: `text-sm ${isSelected ? 'font-medium text-blue-900' : 'text-gray-700'}` },
          node.name
        )
      ),
      hasChildren &&
        isExpanded &&
        react_1.default.createElement(
          'div',
          null,
          node.children.map((child) => renderTreeNode(child, level + 1))
        )
    );
  };
  if (!resources) {
    return react_1.default.createElement(
      'div',
      { className: `p-6 ${className}` },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3 mb-6' },
        react_1.default.createElement(outline_1.CubeIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Compiled Resources'
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center' },
        react_1.default.createElement(
          'div',
          { className: 'max-w-2xl mx-auto' },
          react_1.default.createElement(
            'h3',
            { className: 'text-xl font-semibold text-gray-900 mb-4' },
            'No Compiled Resources'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-gray-600 mb-6' },
            'Import resources to explore the compiled resource collection.'
          )
        )
      )
    );
  }
  // Get selected metadata node or resource data
  const selectedMetadataNode = selectedMetadataSection
    ? findNodeById(metadataTree, selectedMetadataSection)
    : null;
  const selectedCompiledResource =
    selectedResourceId && activeCompiledCollection?.resources
      ? activeCompiledCollection.resources.find((r) => String(r.id) === selectedResourceId)
      : null;
  return react_1.default.createElement(
    'div',
    { className: `p-6 ${className}` },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-6' },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3' },
        react_1.default.createElement(outline_1.CubeIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Compiled Resources'
        ),
        isFilteringActive &&
          react_1.default.createElement(
            'span',
            {
              className:
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'
            },
            'Filtered'
          )
      ),
      activeProcessedResources &&
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2' },
          react_1.default.createElement(
            'button',
            {
              onClick: handleExportCompiledData,
              className:
                'inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            },
            react_1.default.createElement(outline_1.DocumentArrowDownIcon, { className: 'h-4 w-4 mr-1' }),
            'Export JSON'
          ),
          react_1.default.createElement(
            'button',
            {
              onClick: handleExportBundle,
              className:
                'inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            },
            react_1.default.createElement(outline_1.ArchiveBoxIcon, { className: 'h-4 w-4 mr-1' }),
            'Export Bundle'
          )
        )
    ),
    react_1.default.createElement(ResourcePickerOptionsControl_1.ResourcePickerOptionsControl, {
      options: currentPickerOptions,
      onOptionsChange: setCurrentPickerOptions,
      presentation: pickerOptionsPresentation,
      title: 'Compiled View Picker Options',
      className: 'mb-6'
    }),
    activeProcessedResources &&
      react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6' },
        react_1.default.createElement(
          'div',
          { className: 'flex items-center justify-between' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center space-x-6' },
            react_1.default.createElement(
              'div',
              { className: 'flex items-center space-x-2' },
              resources?.isLoadedFromBundle
                ? react_1.default.createElement(outline_1.ArchiveBoxIcon, {
                    className: 'h-4 w-4 text-blue-600'
                  })
                : react_1.default.createElement(outline_1.CubeIcon, { className: 'h-4 w-4 text-gray-600' }),
              react_1.default.createElement(
                'label',
                { className: 'text-sm font-medium text-gray-700' },
                'Normalize Output:'
              ),
              react_1.default.createElement(
                'button',
                {
                  onClick: () => setUseNormalization(!useNormalization),
                  className: `relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    useNormalization ? 'bg-blue-600' : 'bg-gray-300'
                  }`
                },
                react_1.default.createElement('span', {
                  className: `inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    useNormalization ? 'translate-x-5' : 'translate-x-1'
                  }`
                })
              ),
              react_1.default.createElement(
                'span',
                { className: 'text-xs text-gray-500' },
                useNormalization ? 'ON' : 'OFF'
              )
            ),
            react_1.default.createElement(
              'button',
              {
                onClick: () => setShowJsonView(!showJsonView),
                className:
                  'inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              },
              react_1.default.createElement(outline_1.CodeBracketIcon, { className: 'h-4 w-4 mr-2' }),
              showJsonView ? 'Hide' : 'Show',
              ' JSON',
              showJsonView
                ? react_1.default.createElement(outline_1.ChevronUpIcon, { className: 'h-4 w-4 ml-2' })
                : react_1.default.createElement(outline_1.ChevronDownIcon, { className: 'h-4 w-4 ml-2' })
            )
          )
        ),
        showJsonView &&
          react_1.default.createElement(
            'div',
            { className: 'mt-4' },
            react_1.default.createElement(
              'div',
              { className: 'bg-gray-50 rounded-lg border border-gray-200 p-4' },
              react_1.default.createElement(
                'pre',
                {
                  className:
                    'text-xs text-gray-800 bg-white p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto'
                },
                JSON.stringify(activeProcessedResources.compiledCollection, null, 2)
              )
            )
          )
      ),
    react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      react_1.default.createElement(
        'div',
        { className: 'mb-6' },
        react_1.default.createElement(
          'div',
          { className: 'border-b border-gray-200' },
          react_1.default.createElement(
            'nav',
            { className: '-mb-px flex space-x-8' },
            react_1.default.createElement(
              'button',
              {
                onClick: () => {
                  setActiveTab('resources');
                  setSelectedMetadataSection(null);
                },
                className: `py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'resources'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center space-x-2' },
                react_1.default.createElement(outline_1.DocumentTextIcon, { className: 'h-4 w-4' }),
                react_1.default.createElement(
                  'span',
                  null,
                  'Resources (',
                  activeCompiledCollection?.resources?.length || 0,
                  ')'
                )
              )
            ),
            react_1.default.createElement(
              'button',
              {
                onClick: () => {
                  setActiveTab('metadata');
                  setSelectedResourceId(null);
                },
                className: `py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'metadata'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`
              },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center space-x-2' },
                react_1.default.createElement(outline_1.CubeIcon, { className: 'h-4 w-4' }),
                react_1.default.createElement('span', null, 'Collection Metadata')
              )
            )
          )
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'flex flex-col lg:flex-row gap-6 h-[600px]' },
        react_1.default.createElement(
          'div',
          { className: 'lg:w-1/2 flex flex-col' },
          activeTab === 'resources'
            ? react_1.default.createElement(
                react_1.default.Fragment,
                null,
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-center mb-4' },
                  react_1.default.createElement(
                    'h3',
                    { className: 'text-lg font-semibold text-gray-900' },
                    'Compiled Resources'
                  )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'flex-1' },
                  react_1.default.createElement(ResourcePicker_1.ResourcePicker, {
                    resources: activeProcessedResources || null,
                    selectedResourceId: selectedResourceId,
                    onResourceSelect: handleResourceSelect,
                    resourceAnnotations: resourceAnnotations,
                    options: effectivePickerOptions,
                    onMessage: onMessage
                  })
                )
              )
            : react_1.default.createElement(
                react_1.default.Fragment,
                null,
                react_1.default.createElement(
                  'h3',
                  { className: 'text-lg font-semibold text-gray-900 mb-4' },
                  'Collection Metadata'
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50' },
                  metadataTree && renderTreeNode(metadataTree)
                )
              )
        ),
        react_1.default.createElement(
          'div',
          { className: 'lg:w-1/2 flex flex-col' },
          activeTab === 'resources' && selectedResourceId
            ? react_1.default.createElement(CompiledResourceDetail, {
                resourceId: selectedResourceId,
                compiledResource: selectedCompiledResource,
                activeCompiledCollection: activeCompiledCollection,
                onMessage: onMessage
              })
            : activeTab === 'metadata' && selectedMetadataNode
            ? react_1.default.createElement(NodeDetail, {
                node: selectedMetadataNode,
                activeCompiledCollection: activeCompiledCollection
              })
            : react_1.default.createElement(
                'div',
                {
                  className:
                    'flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50'
                },
                react_1.default.createElement(
                  'div',
                  { className: 'text-center' },
                  react_1.default.createElement(outline_1.CubeIcon, {
                    className: 'h-12 w-12 text-gray-400 mx-auto mb-4'
                  }),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-gray-500' },
                    activeTab === 'resources'
                      ? 'Select a resource to view details'
                      : 'Select a metadata item to view details'
                  )
                )
              )
        )
      )
    )
  );
};
exports.CompiledView = CompiledView;
// Helper function to find node by ID
const findNodeById = (tree, id) => {
  if (tree.id === id) return tree;
  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};
const NodeDetail = ({ node, activeCompiledCollection }) => {
  const [showRawJson, setShowRawJson] = (0, react_1.useState)(false);
  const renderDetails = () => {
    if (!node.data) {
      return react_1.default.createElement(
        'div',
        { className: 'space-y-4' },
        react_1.default.createElement(
          'div',
          { className: 'bg-white rounded-lg border p-4' },
          react_1.default.createElement(
            'h4',
            { className: 'font-medium text-gray-700 mb-2' },
            '\uD83D\uDCC1 ',
            node.name
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-sm text-gray-600' },
            node.children ? `Contains ${node.children.length} items` : 'Empty folder'
          )
        )
      );
    }
    const { type, resource, items } = node.data;
    switch (type) {
      case 'compiled-resource':
        return renderCompiledResource(resource);
      case 'qualifiers':
      case 'qualifier-types':
      case 'resource-types':
      case 'conditions':
      case 'condition-sets':
      case 'decisions':
      case 'candidate-values':
        return renderCompiledCollection(type, items);
      default:
        return renderRawData();
    }
  };
  // Function that renders compiled resource data with indices
  const renderCompiledResource = (resource) => {
    if (!resource) {
      return react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg border p-4' },
        react_1.default.createElement(
          'h4',
          { className: 'font-medium text-red-700 mb-2' },
          'Error Loading Resource'
        ),
        react_1.default.createElement(
          'p',
          { className: 'text-sm text-red-600' },
          'Resource data not available'
        )
      );
    }
    return react_1.default.createElement(
      'div',
      { className: 'space-y-6' },
      react_1.default.createElement(
        'div',
        { className: 'bg-gray-50 rounded-lg p-4' },
        react_1.default.createElement(
          'h3',
          { className: 'text-lg font-semibold text-gray-900 mb-4' },
          'Compiled Resource Details'
        ),
        react_1.default.createElement(
          'div',
          { className: 'bg-white rounded-lg border p-4 space-y-3' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-start' },
            react_1.default.createElement('span', { className: 'font-semibold text-gray-700 w-32' }, 'ID:'),
            react_1.default.createElement('span', { className: 'font-mono text-gray-900' }, resource.id)
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex items-start' },
            react_1.default.createElement(
              'span',
              { className: 'font-semibold text-gray-700 w-32' },
              'Resource Type:'
            ),
            react_1.default.createElement('span', { className: 'text-gray-900' }, 'Index: ', resource.type)
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex items-start' },
            react_1.default.createElement(
              'span',
              { className: 'font-semibold text-gray-700 w-32' },
              'Decision:'
            ),
            react_1.default.createElement(
              'span',
              { className: 'text-gray-900' },
              react_1.default.createElement(
                'span',
                { className: 'font-mono' },
                'Decision Index: ',
                resource.decision,
                ' with ',
                resource.candidates?.length || 0,
                ' candidates'
              )
            )
          )
        )
      ),
      react_1.default.createElement(
        'div',
        { className: 'bg-gray-50 rounded-lg p-4' },
        react_1.default.createElement(
          'h3',
          { className: 'text-lg font-semibold text-gray-900 mb-4' },
          'Candidates (',
          resource.candidates?.length || 0,
          ')'
        ),
        react_1.default.createElement(
          'div',
          { className: 'space-y-4' },
          resource.candidates &&
            resource.candidates.map((candidate, candidateIdx) => {
              // Get the condition set index for this candidate from the decision
              const compiledCollection = activeCompiledCollection;
              const decision = compiledCollection?.decisions?.[resource.decision];
              const conditionSetIndex = decision?.conditionSets?.[candidateIdx];
              const conditionSet =
                conditionSetIndex !== undefined
                  ? compiledCollection?.conditionSets?.[conditionSetIndex]
                  : null;
              return react_1.default.createElement(
                'div',
                { key: candidateIdx, className: 'bg-white rounded-lg border p-4' },
                react_1.default.createElement(
                  'div',
                  { className: 'mb-3 flex items-center justify-between' },
                  react_1.default.createElement(
                    'h4',
                    { className: 'font-semibold text-gray-900' },
                    'Candidate ',
                    candidateIdx,
                    candidate.isPartial &&
                      react_1.default.createElement(
                        'span',
                        { className: 'ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs' },
                        'Partial'
                      )
                  ),
                  conditionSetIndex !== undefined &&
                    react_1.default.createElement(
                      'span',
                      { className: 'text-xs font-mono bg-gray-100 px-2 py-1 rounded' },
                      'ConditionSet: ',
                      conditionSetIndex
                    )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'space-y-3 mb-3' },
                  candidate.valueIndex !== undefined &&
                    react_1.default.createElement(
                      'div',
                      { className: 'bg-blue-50 rounded p-3' },
                      react_1.default.createElement(
                        'div',
                        { className: 'flex items-center justify-between mb-2' },
                        react_1.default.createElement(
                          'h6',
                          { className: 'text-sm font-semibold text-blue-700' },
                          'Candidate Value Reference:'
                        ),
                        react_1.default.createElement(
                          'span',
                          { className: 'text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded' },
                          'Index: ',
                          candidate.valueIndex
                        )
                      ),
                      react_1.default.createElement(
                        'div',
                        { className: 'text-xs text-blue-600' },
                        'This candidate references candidateValues[',
                        candidate.valueIndex,
                        '] from the compiled collection'
                      )
                    ),
                  (candidate || typeof candidate === 'object') &&
                    react_1.default.createElement(
                      'div',
                      { className: 'bg-gray-50 rounded p-3' },
                      react_1.default.createElement(
                        'h6',
                        { className: 'text-sm font-semibold text-gray-700 mb-2' },
                        candidate.valueIndex !== undefined
                          ? 'Resolved Resource Content:'
                          : 'Resource Content:'
                      ),
                      react_1.default.createElement(
                        'pre',
                        {
                          className:
                            'text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto'
                        },
                        JSON.stringify(candidate, null, 2)
                      ),
                      candidate.valueIndex !== undefined &&
                        activeCompiledCollection?.candidateValues &&
                        react_1.default.createElement(
                          'div',
                          { className: 'mt-2 pt-2 border-t border-gray-200' },
                          react_1.default.createElement(
                            'div',
                            { className: 'text-xs text-gray-600 mb-1' },
                            'From candidateValues array:'
                          ),
                          react_1.default.createElement(
                            'pre',
                            {
                              className:
                                'text-xs font-mono text-gray-700 bg-white p-2 rounded border overflow-x-auto max-h-32 overflow-y-auto'
                            },
                            JSON.stringify(
                              activeCompiledCollection.candidateValues[candidate.valueIndex],
                              null,
                              2
                            )
                          )
                        )
                    )
                ),
                conditionSet &&
                  conditionSet.conditions &&
                  conditionSet.conditions.length > 0 &&
                  react_1.default.createElement(
                    'div',
                    { className: 'border-t pt-3' },
                    react_1.default.createElement(
                      'h5',
                      { className: 'text-sm font-semibold text-gray-700 mb-2' },
                      'Conditions:'
                    ),
                    react_1.default.createElement(
                      'div',
                      { className: 'space-y-2' },
                      conditionSet.conditions.map((conditionIndex, idx) => {
                        const condition = compiledCollection?.conditions?.[conditionIndex];
                        if (!condition) return null;
                        const qualifier = compiledCollection?.qualifiers?.[condition.qualifierIndex];
                        return react_1.default.createElement(
                          'div',
                          { key: idx, className: 'flex items-center text-sm bg-blue-50 rounded px-3 py-2' },
                          react_1.default.createElement(
                            'span',
                            { className: 'font-mono text-blue-700 mr-2 text-xs' },
                            '[',
                            conditionIndex,
                            ']'
                          ),
                          react_1.default.createElement(
                            'span',
                            { className: 'font-medium text-blue-900 mr-2' },
                            qualifier?.name || `Q${condition.qualifierIndex}`
                          ),
                          react_1.default.createElement(
                            'span',
                            { className: 'text-blue-700 mr-2' },
                            condition.operator || 'matches'
                          ),
                          react_1.default.createElement(
                            'span',
                            { className: 'font-mono text-blue-800' },
                            condition.value
                          ),
                          react_1.default.createElement(
                            'span',
                            { className: 'ml-auto text-xs text-blue-600' },
                            'Priority: ',
                            condition.priority || 0,
                            condition.scoreAsDefault !== undefined &&
                              react_1.default.createElement(
                                'span',
                                { className: 'ml-2' },
                                'Default: ',
                                condition.scoreAsDefault
                              )
                          )
                        );
                      })
                    )
                  ),
                (!conditionSet || !conditionSet.conditions || conditionSet.conditions.length === 0) &&
                  react_1.default.createElement(
                    'div',
                    { className: 'border-t pt-3' },
                    react_1.default.createElement(
                      'span',
                      { className: 'text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded' },
                      'No conditions (default candidate)'
                    )
                  )
              );
            })
        )
      )
    );
  };
  // Function that renders compiled collection data
  const renderCompiledCollection = (collectionType, items) => {
    if (!items) {
      return react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg border p-4' },
        react_1.default.createElement('p', { className: 'text-sm text-gray-500' }, 'No data available')
      );
    }
    let title;
    switch (collectionType) {
      case 'qualifiers':
        title = 'Qualifiers';
        break;
      case 'qualifier-types':
        title = 'Qualifier Types';
        break;
      case 'resource-types':
        title = 'Resource Types';
        break;
      case 'conditions':
        title = 'Conditions';
        break;
      case 'condition-sets':
        title = 'Condition Sets';
        break;
      case 'decisions':
        title = 'Decisions';
        break;
      case 'candidate-values':
        title = 'Candidate Values';
        break;
      default:
        title = collectionType;
    }
    return react_1.default.createElement(
      'div',
      { className: 'bg-gray-50 rounded-lg p-4' },
      react_1.default.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900 mb-4' },
        title,
        ' ',
        react_1.default.createElement(
          'span',
          { className: 'text-sm font-normal text-gray-600' },
          '(',
          items.length,
          ')'
        )
      ),
      items.length === 0
        ? react_1.default.createElement(
            'div',
            { className: 'bg-white rounded-lg border p-4' },
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-gray-500' },
              'No ',
              title.toLowerCase(),
              ' available'
            )
          )
        : react_1.default.createElement(
            'div',
            { className: 'space-y-3 max-h-96 overflow-y-auto' },
            items.map((item, index) =>
              react_1.default.createElement(
                'div',
                { key: index, className: 'bg-white rounded-lg border p-4' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-start justify-between mb-3' },
                  react_1.default.createElement(
                    'div',
                    null,
                    react_1.default.createElement(
                      'h4',
                      { className: 'font-semibold text-gray-900' },
                      getCompiledItemDisplayName(item, collectionType, index)
                    ),
                    react_1.default.createElement(
                      'p',
                      { className: 'text-sm text-gray-600 font-mono mt-1' },
                      getCompiledItemDisplayKey(item, collectionType, index)
                    )
                  ),
                  react_1.default.createElement(
                    'span',
                    { className: 'bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono' },
                    'Index: ',
                    index
                  )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'border-t pt-3' },
                  renderCompiledItemDetail(item, collectionType, index)
                )
              )
            )
          )
    );
  };
  // Helper functions for compiled object display
  const getCompiledItemDisplayName = (item, collectionType, index) => {
    switch (collectionType) {
      case 'qualifiers':
        return `${index}: ${item?.name || 'unnamed'}`;
      case 'qualifier-types':
        return `${index}: ${item?.name || 'unnamed'}`;
      case 'resource-types':
        return `${index}: ${item?.name || item?.key || 'unnamed'}`;
      case 'conditions':
        const qualifier = activeCompiledCollection?.qualifiers?.[item?.qualifierIndex];
        return `${index}: ${qualifier?.name || `Q${item?.qualifierIndex}`} ${item?.operator || 'matches'} "${
          item?.value || ''
        }"`;
      case 'condition-sets':
        return `${index}: ${
          item?.conditions?.length === 0 || !item?.conditions
            ? 'Unconditional'
            : `${item.conditions.length} conditions`
        }`;
      case 'decisions':
        return `${index}: Decision with ${item?.conditionSets?.length || 0} condition sets`;
      case 'candidate-values':
        try {
          const normalizer = new ts_utils_1.Hash.Crc32Normalizer();
          const hashResult = normalizer.computeHash(item);
          const jsonStr = JSON.stringify(item);
          if (hashResult.isSuccess()) {
            return `${index}: ${typeof item}, ${jsonStr.length} chars (CRC32: ${String(hashResult.value)})`;
          } else {
            return `${index}: ${typeof item}, ${jsonStr.length} chars`;
          }
        } catch (error) {
          return `${index}: ${typeof item}, size unknown`;
        }
      default:
        return `${index}: Item ${index}`;
    }
  };
  const getCompiledItemDisplayKey = (item, collectionType, index) => {
    try {
      switch (collectionType) {
        case 'qualifiers':
          return `type: ${item?.type || 'N/A'}, defaultPriority: ${item?.defaultPriority ?? 'N/A'}`;
        case 'qualifier-types':
          return `systemType: ${item?.systemType ?? 'N/A'}`;
        case 'resource-types':
          return `key: ${item?.key ?? 'N/A'}`;
        case 'conditions':
          return `priority: ${item?.priority ?? 0}`;
        case 'condition-sets':
          if (!item?.conditions || item.conditions.length === 0) return 'default';
          return `${item.conditions.length} condition${item.conditions.length !== 1 ? 's' : ''}`;
        case 'decisions':
          return `${item?.conditionSets?.length ?? 0} condition set${
            (item?.conditionSets?.length ?? 0) !== 1 ? 's' : ''
          }`;
        case 'candidate-values':
          return ''; // All info now in main header
        default:
          return '';
      }
    } catch (error) {
      console.warn('Error in getCompiledItemDisplayKey:', error, { item, collectionType, index });
      return 'Display error';
    }
  };
  const renderCompiledItemDetail = (item, collectionType, index) => {
    switch (collectionType) {
      case 'qualifiers':
        const qualifierType = activeCompiledCollection?.qualifierTypes?.[item?.type];
        return react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Name:'),
            ' ',
            item?.name || 'N/A'
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Type Index:'),
            ' ',
            item?.type ?? 'N/A',
            qualifierType &&
              react_1.default.createElement(
                'span',
                { className: 'ml-2 text-gray-600' },
                '(',
                qualifierType.name || 'unnamed',
                ')'
              )
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Default Priority:'),
            ' ',
            item?.defaultPriority ?? 'N/A'
          ),
          item?.token &&
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement('span', { className: 'font-medium' }, 'Token:'),
              ' ',
              item.token
            ),
          item?.defaultValue !== undefined &&
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement('span', { className: 'font-medium' }, 'Default Value:'),
              ' ',
              item.defaultValue
            )
        );
      case 'qualifier-types':
        return react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Name:'),
            ' ',
            item?.name || 'N/A'
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'System Type:'),
            ' ',
            item?.systemType || 'N/A'
          ),
          item?.configuration &&
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement('span', { className: 'font-medium' }, 'Configuration:'),
              react_1.default.createElement(
                'pre',
                { className: 'text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto' },
                JSON.stringify(item.configuration, null, 2)
              )
            )
        );
      case 'resource-types':
        return react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Name:'),
            ' ',
            item?.name || 'N/A'
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Key:'),
            ' ',
            item?.key || 'N/A'
          )
        );
      case 'conditions':
        const qualifier = activeCompiledCollection?.qualifiers?.[item?.qualifierIndex];
        return react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Qualifier Index:'),
            ' ',
            item?.qualifierIndex ?? 'N/A',
            qualifier &&
              react_1.default.createElement(
                'span',
                { className: 'ml-2 text-gray-600' },
                '(',
                qualifier.name || 'unnamed',
                ')'
              )
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Operator:'),
            ' ',
            item?.operator || 'matches'
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Value:'),
            ' ',
            item?.value || 'N/A'
          ),
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Priority:'),
            ' ',
            item?.priority ?? 0
          ),
          item?.scoreAsDefault !== undefined &&
            react_1.default.createElement(
              'div',
              null,
              react_1.default.createElement('span', { className: 'font-medium' }, 'Score As Default:'),
              ' ',
              item.scoreAsDefault
            )
        );
      case 'condition-sets':
        return react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Conditions:'),
            ' ',
            item?.conditions?.length ?? 0
          ),
          item?.conditions &&
            item.conditions.length > 0 &&
            react_1.default.createElement(
              'div',
              { className: 'space-y-1' },
              react_1.default.createElement(
                'div',
                { className: 'font-medium text-sm' },
                'Condition Indices:'
              ),
              item.conditions.map((conditionIndex, idx) => {
                const condition = activeCompiledCollection?.conditions?.[conditionIndex];
                const qualifier = condition
                  ? activeCompiledCollection?.qualifiers?.[condition.qualifierIndex]
                  : null;
                return react_1.default.createElement(
                  'div',
                  { key: idx, className: 'text-xs bg-blue-50 rounded px-2 py-1' },
                  '[',
                  conditionIndex,
                  '] ',
                  qualifier?.name || `Q${condition?.qualifierIndex}`,
                  ' ',
                  condition?.operator || 'matches',
                  ' "',
                  condition?.value || '',
                  '" (p:',
                  condition?.priority || 0,
                  ')'
                );
              })
            )
        );
      case 'decisions':
        return react_1.default.createElement(
          'div',
          { className: 'space-y-2' },
          react_1.default.createElement(
            'div',
            null,
            react_1.default.createElement('span', { className: 'font-medium' }, 'Condition Sets:'),
            ' ',
            item?.conditionSets?.length ?? 0
          ),
          item?.conditionSets &&
            item.conditionSets.length > 0 &&
            react_1.default.createElement(
              'div',
              { className: 'space-y-1' },
              react_1.default.createElement(
                'div',
                { className: 'font-medium text-sm' },
                'Condition Set Indices:'
              ),
              react_1.default.createElement(
                'div',
                { className: 'flex flex-wrap gap-1' },
                item.conditionSets.map((conditionSetIndex, idx) =>
                  react_1.default.createElement(
                    'span',
                    { key: idx, className: 'text-xs bg-green-50 text-green-800 px-2 py-1 rounded' },
                    '[',
                    conditionSetIndex,
                    ']'
                  )
                )
              )
            )
        );
      case 'candidate-values':
        return react_1.default.createElement(
          'div',
          { className: 'bg-gray-50 rounded p-3' },
          react_1.default.createElement(
            'pre',
            {
              className:
                'text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto'
            },
            JSON.stringify(item, null, 2)
          )
        );
      default:
        return react_1.default.createElement(
          'pre',
          { className: 'text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto' },
          JSON.stringify(item, null, 2)
        );
    }
  };
  const renderRawData = () => {
    return react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg border p-4' },
      react_1.default.createElement('h4', { className: 'font-medium text-gray-700 mb-2' }, node.name),
      react_1.default.createElement(
        'pre',
        { className: 'text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-96 overflow-y-auto' },
        JSON.stringify(node.data, null, 2)
      )
    );
  };
  return react_1.default.createElement(
    'div',
    { className: 'flex flex-col h-full' },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-4' },
      react_1.default.createElement('h3', { className: 'text-lg font-semibold text-gray-900' }, 'Details'),
      react_1.default.createElement(
        'button',
        {
          onClick: () => setShowRawJson(!showRawJson),
          className: 'text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100'
        },
        showRawJson ? 'Rich View' : 'Raw JSON'
      )
    ),
    react_1.default.createElement(
      'div',
      { className: 'flex-1 overflow-y-auto' },
      showRawJson
        ? react_1.default.createElement(
            'div',
            { className: 'bg-white rounded-lg border p-4' },
            react_1.default.createElement(
              'pre',
              { className: 'text-xs bg-gray-50 p-3 rounded overflow-x-auto' },
              JSON.stringify(node.data, null, 2)
            )
          )
        : renderDetails()
    )
  );
};
const CompiledResourceDetail = ({ resourceId, compiledResource, activeCompiledCollection, onMessage }) => {
  const [showRawJson, setShowRawJson] = (0, react_1.useState)(false);
  if (!compiledResource) {
    return react_1.default.createElement(
      'div',
      { className: 'flex flex-col h-full' },
      react_1.default.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900 mb-4' },
        'Resource Details'
      ),
      react_1.default.createElement(
        'div',
        { className: 'flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-red-50' },
        react_1.default.createElement(
          'div',
          { className: 'text-center' },
          react_1.default.createElement(
            'p',
            { className: 'text-red-600 font-medium mb-2' },
            'Resource Not Found'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-red-500 text-sm' },
            'Resource ',
            resourceId,
            ' not found in compiled collection'
          )
        )
      )
    );
  }
  return react_1.default.createElement(
    'div',
    { className: 'flex flex-col h-full' },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-4' },
      react_1.default.createElement(
        'h3',
        { className: 'text-lg font-semibold text-gray-900' },
        'Compiled Resource Details'
      ),
      react_1.default.createElement(
        'button',
        {
          onClick: () => setShowRawJson(!showRawJson),
          className: 'text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100'
        },
        showRawJson ? 'Rich View' : 'Raw JSON'
      )
    ),
    react_1.default.createElement(
      'div',
      { className: 'flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50' },
      showRawJson
        ? react_1.default.createElement(
            'div',
            { className: 'bg-white rounded-lg border p-4' },
            react_1.default.createElement(
              'pre',
              { className: 'text-xs bg-gray-50 p-3 rounded overflow-x-auto' },
              JSON.stringify(compiledResource, null, 2)
            )
          )
        : react_1.default.createElement(
            'div',
            { className: 'space-y-6' },
            react_1.default.createElement(
              'div',
              { className: 'bg-gray-50 rounded-lg p-4' },
              react_1.default.createElement(
                'h3',
                { className: 'text-lg font-semibold text-gray-900 mb-4' },
                'Compiled Resource Details'
              ),
              react_1.default.createElement(
                'div',
                { className: 'bg-white rounded-lg border p-4 space-y-3' },
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-start' },
                  react_1.default.createElement(
                    'span',
                    { className: 'font-semibold text-gray-700 w-32' },
                    'ID:'
                  ),
                  react_1.default.createElement(
                    'span',
                    { className: 'font-mono text-gray-900' },
                    compiledResource.id
                  )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-start' },
                  react_1.default.createElement(
                    'span',
                    { className: 'font-semibold text-gray-700 w-32' },
                    'Resource Type:'
                  ),
                  react_1.default.createElement(
                    'span',
                    { className: 'text-gray-900' },
                    'Index: ',
                    compiledResource.type
                  )
                ),
                react_1.default.createElement(
                  'div',
                  { className: 'flex items-start' },
                  react_1.default.createElement(
                    'span',
                    { className: 'font-semibold text-gray-700 w-32' },
                    'Decision:'
                  ),
                  react_1.default.createElement(
                    'span',
                    { className: 'text-gray-900' },
                    react_1.default.createElement(
                      'span',
                      { className: 'font-mono' },
                      'Decision Index: ',
                      compiledResource.decision,
                      ' with',
                      ' ',
                      compiledResource.candidates?.length || 0,
                      ' candidates'
                    )
                  )
                )
              )
            ),
            react_1.default.createElement(
              'div',
              { className: 'bg-gray-50 rounded-lg p-4' },
              react_1.default.createElement(
                'h3',
                { className: 'text-lg font-semibold text-gray-900 mb-4' },
                'Candidates (',
                compiledResource.candidates?.length || 0,
                ')'
              ),
              react_1.default.createElement(
                'div',
                { className: 'space-y-4' },
                compiledResource.candidates &&
                  compiledResource.candidates.map((candidate, candidateIdx) => {
                    // Get the condition set index for this candidate from the decision
                    const decision = activeCompiledCollection?.decisions?.[compiledResource.decision];
                    const conditionSetIndex = decision?.conditionSets?.[candidateIdx];
                    const conditionSet =
                      conditionSetIndex !== undefined
                        ? activeCompiledCollection?.conditionSets?.[conditionSetIndex]
                        : null;
                    return react_1.default.createElement(
                      'div',
                      { key: candidateIdx, className: 'bg-white rounded-lg border p-4' },
                      react_1.default.createElement(
                        'div',
                        { className: 'mb-3 flex items-center justify-between' },
                        react_1.default.createElement(
                          'h4',
                          { className: 'font-semibold text-gray-900' },
                          'Candidate ',
                          candidateIdx
                        ),
                        conditionSetIndex !== undefined &&
                          react_1.default.createElement(
                            'span',
                            { className: 'text-xs font-mono bg-gray-100 px-2 py-1 rounded' },
                            'ConditionSet: ',
                            conditionSetIndex
                          )
                      ),
                      (candidate.isPartial || candidate.mergeMethod) &&
                        react_1.default.createElement(
                          'div',
                          { className: 'mb-3 flex items-center gap-2 text-xs' },
                          candidate.isPartial &&
                            react_1.default.createElement(
                              'span',
                              { className: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded' },
                              'Partial'
                            ),
                          candidate.mergeMethod &&
                            react_1.default.createElement(
                              'span',
                              { className: 'bg-blue-100 text-blue-800 px-2 py-1 rounded' },
                              'Merge: ',
                              candidate.mergeMethod
                            )
                        ),
                      react_1.default.createElement(
                        'div',
                        { className: 'mb-3' },
                        react_1.default.createElement(
                          'div',
                          { className: 'text-xs text-gray-600 mb-1' },
                          'Value',
                          candidate.valueIndex !== undefined
                            ? ` (candidateValues[${candidate.valueIndex}])`
                            : '',
                          ':'
                        ),
                        react_1.default.createElement(
                          'pre',
                          {
                            className:
                              'text-xs font-mono text-gray-700 bg-white p-2 rounded border overflow-x-auto max-h-32 overflow-y-auto'
                          },
                          candidate.valueIndex !== undefined && activeCompiledCollection?.candidateValues
                            ? JSON.stringify(
                                activeCompiledCollection.candidateValues[candidate.valueIndex],
                                null,
                                2
                              )
                            : JSON.stringify(candidate, null, 2)
                        )
                      ),
                      conditionSet &&
                        conditionSet.conditions &&
                        conditionSet.conditions.length > 0 &&
                        react_1.default.createElement(
                          'div',
                          { className: 'border-t pt-3' },
                          react_1.default.createElement(
                            'h5',
                            { className: 'text-sm font-semibold text-gray-700 mb-2' },
                            'Conditions:'
                          ),
                          react_1.default.createElement(
                            'div',
                            { className: 'space-y-2' },
                            conditionSet.conditions.map((conditionIndex, idx) => {
                              const condition = activeCompiledCollection?.conditions?.[conditionIndex];
                              if (!condition) return null;
                              const qualifier =
                                activeCompiledCollection?.qualifiers?.[condition.qualifierIndex];
                              return react_1.default.createElement(
                                'div',
                                {
                                  key: idx,
                                  className: 'flex items-center text-sm bg-blue-50 rounded px-3 py-2'
                                },
                                react_1.default.createElement(
                                  'span',
                                  { className: 'font-mono text-blue-700 mr-2 text-xs' },
                                  '[',
                                  conditionIndex,
                                  ']'
                                ),
                                react_1.default.createElement(
                                  'span',
                                  { className: 'font-medium text-blue-900 mr-2' },
                                  qualifier?.name || `Q${condition.qualifierIndex}`
                                ),
                                react_1.default.createElement(
                                  'span',
                                  { className: 'text-blue-700 mr-2' },
                                  condition.operator || 'matches'
                                ),
                                react_1.default.createElement(
                                  'span',
                                  { className: 'font-mono text-blue-800' },
                                  condition.value
                                ),
                                react_1.default.createElement(
                                  'span',
                                  { className: 'ml-auto text-xs text-blue-600' },
                                  'Priority: ',
                                  condition.priority || 0,
                                  condition.scoreAsDefault !== undefined &&
                                    react_1.default.createElement(
                                      'span',
                                      { className: 'ml-2' },
                                      'Default: ',
                                      condition.scoreAsDefault
                                    )
                                )
                              );
                            })
                          )
                        ),
                      (!conditionSet || !conditionSet.conditions || conditionSet.conditions.length === 0) &&
                        react_1.default.createElement(
                          'div',
                          { className: 'border-t pt-3' },
                          react_1.default.createElement(
                            'span',
                            { className: 'text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded' },
                            'No conditions (default candidate)'
                          )
                        )
                    );
                  })
              )
            )
          )
    )
  );
};
exports.default = exports.CompiledView;
//# sourceMappingURL=index.js.map
