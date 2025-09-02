'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.MultiGridView = void 0;
const tslib_1 = require('tslib');
const react_1 = tslib_1.__importStar(require('react'));
const outline_1 = require('@heroicons/react/24/outline');
const resourceSelector_1 = require('../../../utils/resourceSelector');
const SharedContextControls_1 = require('./SharedContextControls');
const GridSelector_1 = require('./GridSelector');
const index_1 = require('./index');
const UnifiedChangeControls_1 = require('../ResolutionView/UnifiedChangeControls');
const EditableGridCell_1 = require('./EditableGridCell');
/**
 * MultiGridView component for managing multiple grid instances with shared context.
 *
 * Provides a comprehensive interface for displaying multiple related grids that share
 * the same resolution context and batch operations. Perfect for administrative workflows
 * where users need to configure related data across multiple resource types.
 *
 * **Key Features:**
 * - **Multiple Grids**: Display multiple grid configurations with different resource selections
 * - **Shared Context**: Single context management that applies to all grids simultaneously
 * - **Unified Changes**: Batch operations work across all grids and resource types
 * - **Flexible Presentation**: Support for tabs, cards, accordion, and dropdown grid selection
 * - **Validation Integration**: Prevents batch operations when validation errors exist
 *
 * @example
 * ```tsx
 * import { MultiGridView } from '@fgv/ts-res-ui-components';
 *
 * // Configure multiple grids for admin workflow
 * const gridConfigurations = [
 *   {
 *     id: 'languages',
 *     title: 'Languages',
 *     description: 'Language configuration settings',
 *     resourceSelection: { type: 'resourceTypes', types: ['language-config'] },
 *     columnMapping: [{
 *       resourceType: 'language-config',
 *       columns: [
 *         { id: 'code', title: 'Code', dataPath: 'code' },
 *         { id: 'name', title: 'Name', dataPath: 'displayName', editable: true, cellType: 'string' },
 *         { id: 'enabled', title: 'Enabled', dataPath: 'enabled', editable: true, cellType: 'boolean' }
 *       ]
 *     }]
 *   },
 *   {
 *     id: 'payment-methods',
 *     title: 'Payment Methods',
 *     description: 'Payment method configuration',
 *     resourceSelection: { type: 'prefix', prefix: 'payment.methods.' },
 *     columnMapping: [{
 *       resourceType: 'payment-config',
 *       columns: [
 *         { id: 'method', title: 'Method', dataPath: 'method' },
 *         { id: 'enabled', title: 'Enabled', dataPath: 'enabled', editable: true, cellType: 'tristate' },
 *         { id: 'priority', title: 'Priority', dataPath: 'priority', editable: true, cellType: 'dropdown',
 *           dropdownOptions: [
 *             { value: 'high', label: 'High Priority' },
 *             { value: 'medium', label: 'Medium Priority' },
 *             { value: 'low', label: 'Low Priority' }
 *           ]
 *         }
 *       ]
 *     }]
 *   }
 * ];
 *
 * function AdminPanel() {
 *   return (
 *     <MultiGridView
 *       gridConfigurations={gridConfigurations}
 *       resources={processedResources}
 *       resolutionState={resolutionState}
 *       resolutionActions={resolutionActions}
 *       availableQualifiers={['country', 'language', 'environment']}
 *       contextOptions={{
 *         qualifierOptions: {
 *           country: { editable: true, placeholder: 'Select country...' },
 *           environment: { editable: false, hostValue: 'production' }
 *         },
 *         hostManagedValues: { environment: 'production' }
 *       }}
 *       tabsPresentation="tabs"
 *       defaultActiveGrid="languages"
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
const MultiGridView = ({
  gridConfigurations,
  resources,
  resolutionState,
  resolutionActions,
  availableQualifiers = [],
  contextOptions,
  filterState,
  filterResult,
  tabsPresentation = 'tabs',
  defaultActiveGrid,
  allowGridReordering = false,
  onMessage,
  className = ''
}) => {
  // State for active grid
  const [activeGridId, setActiveGridId] = (0, react_1.useState)(() => {
    return defaultActiveGrid || gridConfigurations[0]?.id || '';
  });
  // Update active grid if default changes or configurations change
  (0, react_1.useEffect)(() => {
    if (defaultActiveGrid && defaultActiveGrid !== activeGridId) {
      setActiveGridId(defaultActiveGrid);
    } else if (!gridConfigurations.find((g) => g.id === activeGridId)) {
      // Active grid no longer exists, switch to first available
      setActiveGridId(gridConfigurations[0]?.id || '');
    }
  }, [defaultActiveGrid, activeGridId, gridConfigurations]);
  // Get current grid configuration
  const currentGridConfig = (0, react_1.useMemo)(() => {
    return gridConfigurations.find((grid) => grid.id === activeGridId);
  }, [gridConfigurations, activeGridId]);
  // Use filtered resources when filtering is active and successful
  const isFilteringActive = filterState?.enabled && filterResult?.success === true;
  const baseProcessedResources = isFilteringActive ? filterResult?.processedResources : resources;
  // Calculate total selected resources across all grids for summary
  const totalResourceCounts = (0, react_1.useMemo)(() => {
    if (!baseProcessedResources) return { total: 0, byGrid: new Map() };
    const byGrid = new Map();
    let total = 0;
    gridConfigurations.forEach((gridConfig) => {
      const selectionResult = (0, resourceSelector_1.selectResources)(
        gridConfig.resourceSelection,
        baseProcessedResources
      );
      const count = selectionResult.isSuccess() ? selectionResult.value.length : 0;
      byGrid.set(gridConfig.id, count);
      total += count;
    });
    return { total, byGrid };
  }, [baseProcessedResources, gridConfigurations]);
  // Handle grid changes
  const handleGridChange = (0, react_1.useCallback)((gridId) => {
    setActiveGridId(gridId);
  }, []);
  // Enhanced apply handler that checks for validation errors
  const handleApplyPendingResources = (0, react_1.useCallback)(async () => {
    // Check for validation errors before applying
    if ((0, EditableGridCell_1.hasGridValidationErrors)()) {
      onMessage?.(
        'warning',
        'Cannot apply changes: There are validation errors in the grid. Please fix them first.'
      );
      return;
    }
    await resolutionActions?.applyPendingResources();
  }, [resolutionActions, onMessage]);
  // Enhanced discard handler
  const handleDiscardAll = (0, react_1.useCallback)(() => {
    resolutionActions?.discardEdits?.();
    resolutionActions?.discardPendingResources?.();
    // Clear validation errors when discarding
    Promise.resolve()
      .then(() => tslib_1.__importStar(require('./EditableGridCell')))
      .then((module) => {
        module.clearAllGridValidationErrors();
      });
  }, [resolutionActions]);
  if (!resources) {
    return react_1.default.createElement(
      'div',
      { className: `p-6 ${className}` },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3 mb-6' },
        react_1.default.createElement(outline_1.TableCellsIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Multi-Grid Resource Manager'
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
            'Import resources first to manage them across multiple specialized grid views.'
          ),
          react_1.default.createElement(
            'div',
            { className: 'bg-blue-50 rounded-lg p-4' },
            react_1.default.createElement(
              'p',
              { className: 'text-sm text-blue-800' },
              react_1.default.createElement('strong', null, 'Multi-Grid View:'),
              ' Manage related resources across multiple grids with shared context and batch operations. Perfect for administrative workflows.'
            )
          )
        )
      )
    );
  }
  if (gridConfigurations.length === 0) {
    return react_1.default.createElement(
      'div',
      { className: `p-6 ${className}` },
      react_1.default.createElement(
        'div',
        { className: 'flex items-center space-x-3 mb-6' },
        react_1.default.createElement(outline_1.TableCellsIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Multi-Grid Resource Manager'
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
            'No Grid Configurations'
          ),
          react_1.default.createElement(
            'p',
            { className: 'text-gray-600' },
            'Configure grid definitions to display and manage your resources in specialized views.'
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
        react_1.default.createElement(outline_1.TableCellsIcon, { className: 'h-8 w-8 text-blue-600' }),
        react_1.default.createElement(
          'h2',
          { className: 'text-2xl font-bold text-gray-900' },
          'Multi-Grid Resource Manager'
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
      react_1.default.createElement(
        'div',
        { className: 'text-sm text-gray-600' },
        react_1.default.createElement('span', { className: 'font-medium' }, totalResourceCounts.total),
        ' resources across',
        ' ',
        react_1.default.createElement('span', { className: 'font-medium' }, gridConfigurations.length),
        ' grid',
        gridConfigurations.length !== 1 ? 's' : ''
      )
    ),
    react_1.default.createElement(SharedContextControls_1.SharedContextControls, {
      availableQualifiers: availableQualifiers,
      resolutionState: resolutionState,
      resolutionActions: resolutionActions,
      contextOptions: contextOptions,
      resources: baseProcessedResources,
      className: 'mb-6'
    }),
    react_1.default.createElement(GridSelector_1.GridSelector, {
      gridConfigurations: gridConfigurations,
      activeGridId: activeGridId,
      onGridChange: handleGridChange,
      presentation: tabsPresentation,
      allowReordering: allowGridReordering,
      className: 'mb-6'
    }),
    currentGridConfig &&
      react_1.default.createElement(
        'div',
        { className: 'mb-6' },
        react_1.default.createElement(index_1.GridView, {
          gridConfig: currentGridConfig,
          resources: baseProcessedResources,
          resolutionState: resolutionState,
          resolutionActions: resolutionActions,
          availableQualifiers: availableQualifiers,
          contextOptions: contextOptions,
          filterState: filterState,
          filterResult: filterResult,
          showContextControls: false,
          showChangeControls: false,
          onMessage: onMessage
        })
      ),
    (resolutionState?.hasUnsavedEdits || resolutionState?.hasPendingResourceChanges) &&
      react_1.default.createElement(
        'div',
        { className: 'bg-white rounded-lg shadow-sm border border-gray-200 p-6' },
        react_1.default.createElement(UnifiedChangeControls_1.UnifiedChangeControls, {
          editCount: resolutionState?.editedResources?.size || 0,
          addCount: resolutionState?.pendingResources?.size || 0,
          deleteCount: resolutionState?.pendingResourceDeletions?.size || 0,
          isApplying: resolutionState?.isApplyingEdits,
          disabled: !resolutionState?.currentResolver,
          onApplyAll: handleApplyPendingResources,
          onDiscardAll: handleDiscardAll
        }),
        (0, EditableGridCell_1.hasGridValidationErrors)() &&
          react_1.default.createElement(
            'div',
            { className: 'mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md' },
            react_1.default.createElement(
              'div',
              { className: 'text-sm text-yellow-800' },
              react_1.default.createElement('strong', null, 'Validation Errors:'),
              ' Some fields have validation errors. Please review and fix them before applying changes.'
            )
          )
      )
  );
};
exports.MultiGridView = MultiGridView;
exports.default = exports.MultiGridView;
//# sourceMappingURL=MultiGridView.js.map
