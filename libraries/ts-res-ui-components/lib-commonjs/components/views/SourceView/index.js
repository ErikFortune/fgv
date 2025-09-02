'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.SourceView = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const ResourcePicker_1 = require('../../pickers/ResourcePicker');
const SourceResourceDetail_1 = require('../../common/SourceResourceDetail');
const ResourcePickerOptionsControl_1 = require('../../common/ResourcePickerOptionsControl');
/**
 * SourceView component for browsing and managing source resource collections.
 *
 * Provides an interface for browsing source resources in their original form,
 * viewing resource details including candidates and conditions, and exporting
 * the complete source resource collection.
 *
 * **Key Features:**
 * - **Resource browsing**: Navigate through all resources with search and filtering
 * - **Detailed resource view**: See resource structure, candidates, conditions, and values
 * - **Export functionality**: Export the complete source resource collection as JSON
 * - **Source-specific details**: View resources in their original source form
 * - **Candidate analysis**: Examine resource candidates and their conditions
 *
 * @example
 * ```tsx
 * import { SourceView } from '@fgv/ts-res-ui-components';
 *
 * function MySourceBrowser() {
 *   const handleExport = () => {
 *     // Export source resources
 *     console.log('Exporting source resources...');
 *   };
 *
 *   return (
 *     <SourceView
 *       resources={processedResources}
 *       onExport={handleExport}
 *       onMessage={(type, message) => console.log(`${type}: ${message}`)}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
const SourceView = ({
  resources,
  onExport,
  onMessage,
  pickerOptions,
  pickerOptionsPresentation = 'hidden',
  className = ''
}) => {
  const [selectedResourceId, setSelectedResourceId] = (0, react_1.useState)(null);
  const [showJsonView, setShowJsonView] = (0, react_1.useState)(false);
  // State for picker options control
  const [currentPickerOptions, setCurrentPickerOptions] = (0, react_1.useState)(pickerOptions || {});
  // Merge picker options with view-specific defaults
  const effectivePickerOptions = (0, react_1.useMemo)(
    () => ({
      defaultView: 'list',
      showViewToggle: true,
      enableSearch: true,
      searchPlaceholder: 'Search resources...',
      searchScope: 'all',
      height: '560px',
      emptyMessage: 'No resources available',
      // Override with user-provided options
      ...pickerOptions,
      // Override with current picker options from control
      ...currentPickerOptions
    }),
    [pickerOptions, currentPickerOptions]
  );
  // Handle resource selection with new enhanced callback
  const handleResourceSelect = (0, react_1.useCallback)(
    (selection) => {
      setSelectedResourceId(selection.resourceId);
      if (selection.resourceId) {
        onMessage?.('info', `Selected resource: ${selection.resourceId}`);
      }
    },
    [onMessage]
  );
  // Get full resource collection data using the new method
  const getResourceCollectionData = (0, react_1.useCallback)(() => {
    if (!resources?.system.resourceManager) {
      return null;
    }
    // Check if this is a ResourceManagerBuilder (has getResourceCollectionDecl method)
    if ('getResourceCollectionDecl' in resources.system.resourceManager) {
      const collectionResult = resources.system.resourceManager.getResourceCollectionDecl();
      if (collectionResult.isSuccess()) {
        return {
          ...collectionResult.value,
          metadata: {
            exportedAt: new Date().toISOString(),
            totalResources: resources.summary.totalResources,
            type: 'ts-res-resource-collection'
          }
        };
      } else {
        onMessage?.('error', `Failed to get resource collection: ${collectionResult.message}`);
        return null;
      }
    } else if (resources.compiledCollection) {
      // For IResourceManager from bundles, use the compiled collection directly
      return {
        resources: resources.compiledCollection.resources || [],
        metadata: {
          exportedAt: new Date().toISOString(),
          totalResources: resources.summary.totalResources,
          type: 'ts-res-resource-collection'
        }
      };
    } else {
      onMessage?.('error', 'Resource collection data not available');
      return null;
    }
  }, [resources, onMessage]);
  // Export source data to JSON file
  const handleExportSourceData = (0, react_1.useCallback)(() => {
    try {
      const collectionData = getResourceCollectionData();
      if (!collectionData) {
        onMessage?.('error', 'No source collection data available to export');
        return;
      }
      onExport?.(collectionData, 'json');
      onMessage?.('success', 'Resource collection exported successfully');
    } catch (error) {
      onMessage?.(
        'error',
        `Failed to export resource collection: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }, [getResourceCollectionData, onExport, onMessage]);
  if (!resources) {
    return react_1.default.createElement(
      'div',
      { className: `p-6 ${className}` },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3 mb-6' },
        react_1.default.createElement(outline_1.DocumentTextIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Source Browser'
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
            'No Resources Loaded'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-gray-600 mb-6' },
            'Import resources to explore them here.'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-blue-50 rounded-lg p-4' },
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-blue-800' },
              react_1.default.createElement('strong', null, 'Tip:'),
              ' Use the Import View to load ts-res resource files or directories, then return here to browse and explore the loaded resources.'
            )
          )
        )
      )
    );
  }
  return react_1.default.createElement(
    'div',
    { className: `p-6 ${className}` },
    react_1.default.createElement(
      'div',
      { className: 'flex items-center justify-between mb-6' },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3' },
        react_1.default.createElement(outline_1.DocumentTextIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Source Browser'
        )
      ),
      resources &&
        react_1.default.createElement(
          'div',
          { className: 'flex items-center space-x-2' },
          react_1.default.createElement(
            'button',
            {
              onClick: handleExportSourceData,
              className:
                'inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            },
            react_1.default.createElement(outline_1.DocumentArrowDownIcon, { className: 'h-4 w-4 mr-1' }),
            'Export JSON'
          )
        )
    ),
    react_1.default.createElement(ResourcePickerOptionsControl_1.ResourcePickerOptionsControl, {
      options: currentPickerOptions,
      onOptionsChange: setCurrentPickerOptions,
      presentation: pickerOptionsPresentation,
      title: 'Source Browser Picker Options',
      className: 'mb-6'
    }),
    resources &&
      react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6' },
        react_1.default.createElement(
          'button',
          {
            onClick: () => setShowJsonView(!showJsonView),
            className:
              'inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          },
          react_1.default.createElement(outline_1.CodeBracketIcon, { className: 'h-4 w-4 mr-2' }),
          showJsonView ? 'Hide' : 'Show',
          ' JSON Resource Collection',
          showJsonView
            ? react_1.default.createElement(outline_1.ChevronUpIcon, { className: 'h-4 w-4 ml-2' })
            : react_1.default.createElement(outline_1.ChevronDownIcon, { className: 'h-4 w-4 ml-2' })
        ),
        showJsonView &&
          react_1.default.createElement(
            'div',
            { className: 'mt-4' },
            react_1.default.createElement(
              'div',
              { className: 'bg-gray-50 rounded-lg border border-gray-200 p-4' },
              react_1.default.createElement(
                'div',
                { className: 'flex items-center justify-between mb-2' },
                react_1.default.createElement(
                  'h3',
                  { className: 'text-sm font-medium text-gray-900' },
                  'Resource Collection (JSON)'
                ),
                react_1.default.createElement(
                  'button',
                  {
                    onClick: handleExportSourceData,
                    className:
                      'inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  },
                  react_1.default.createElement(outline_1.DocumentArrowDownIcon, {
                    className: 'h-3 w-3 mr-1'
                  }),
                  'Export'
                )
              ),
              react_1.default.createElement(
                'pre',
                {
                  className:
                    'text-xs text-gray-800 bg-white p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto'
                },
                JSON.stringify(getResourceCollectionData(), null, 2)
              )
            )
          )
      ),
    react_1.default.createElement(
      'div',
      { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
      react_1.default.createElement(
        'div',
        { className: 'flex flex-col lg:flex-row gap-6 h-[600px]' },
        react_1.default.createElement(
          'div',
          { className: 'lg:w-1/2 flex flex-col' },
          react_1.default.createElement(
            'div',
            { className: 'flex items-center mb-4' },
            react_1.default.createElement(
              'h3',
              { className: 'text-lg font-semibold text-gray-900' },
              'Resources'
            )
          ),
          react_1.default.createElement(
            'div',
            { className: 'flex-1 min-h-0' },
            react_1.default.createElement(ResourcePicker_1.ResourcePicker, {
              resources: resources,
              selectedResourceId: selectedResourceId,
              onResourceSelect: handleResourceSelect,
              options: effectivePickerOptions,
              onMessage: onMessage
            })
          )
        ),
        react_1.default.createElement(
          'div',
          { className: 'lg:w-1/2 flex flex-col' },
          selectedResourceId
            ? react_1.default.createElement(SourceResourceDetail_1.SourceResourceDetail, {
                resourceId: selectedResourceId,
                processedResources: resources,
                onMessage: onMessage
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
                  react_1.default.createElement(outline_1.DocumentTextIcon, {
                    className: 'h-12 w-12 text-gray-400 mx-auto mb-4'
                  }),
                  react_1.default.createElement(
                    'p',
                    { className: 'text-gray-500' },
                    'Select a resource to view details'
                  )
                )
              )
        )
      )
    )
  );
};
exports.SourceView = SourceView;
exports.default = exports.SourceView;
//# sourceMappingURL=index.js.map
