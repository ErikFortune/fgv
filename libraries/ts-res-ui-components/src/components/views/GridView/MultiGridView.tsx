import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { TableCellsIcon } from '@heroicons/react/24/outline';
import { IMultiGridViewProps } from '../../../types';
import { selectResources } from '../../../utils/resourceSelector';
import { SharedContextControls } from './SharedContextControls';
import { GridSelector } from './GridSelector';
import { GridView } from './index';
import { UnifiedChangeControls } from '../ResolutionView/UnifiedChangeControls';
import { hasGridValidationErrors, clearAllGridValidationErrors } from './EditableGridCell';

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
export const MultiGridView: React.FC<IMultiGridViewProps> = ({
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
  const [activeGridId, setActiveGridId] = useState(() => {
    return defaultActiveGrid || gridConfigurations[0]?.id || '';
  });

  // Update active grid if default changes or configurations change
  useEffect(() => {
    if (defaultActiveGrid && defaultActiveGrid !== activeGridId) {
      setActiveGridId(defaultActiveGrid);
    } else if (!gridConfigurations.find((g) => g.id === activeGridId)) {
      // Active grid no longer exists, switch to first available
      setActiveGridId(gridConfigurations[0]?.id || '');
    }
  }, [defaultActiveGrid, activeGridId, gridConfigurations]);

  // Get current grid configuration
  const currentGridConfig = useMemo(() => {
    return gridConfigurations.find((grid) => grid.id === activeGridId);
  }, [gridConfigurations, activeGridId]);

  // Use filtered resources when filtering is active and successful
  const isFilteringActive = filterState?.enabled && filterResult?.success === true;
  const baseProcessedResources = isFilteringActive ? filterResult?.processedResources : resources;

  // Calculate total selected resources across all grids for summary
  const totalResourceCounts = useMemo(() => {
    if (!baseProcessedResources) return { total: 0, byGrid: new Map<string, number>() };

    const byGrid = new Map<string, number>();
    let total = 0;

    gridConfigurations.forEach((gridConfig) => {
      const selectionResult = selectResources(gridConfig.resourceSelection, baseProcessedResources);
      const count = selectionResult.isSuccess() ? selectionResult.value.length : 0;
      byGrid.set(gridConfig.id, count);
      total += count;
    });

    return { total, byGrid };
  }, [baseProcessedResources, gridConfigurations]);

  // Handle grid changes
  const handleGridChange = useCallback((gridId: string) => {
    setActiveGridId(gridId);
  }, []);

  // Enhanced apply handler that checks for validation errors
  const handleApplyPendingResources = useCallback(async () => {
    // Check for validation errors before applying
    if (hasGridValidationErrors()) {
      onMessage?.(
        'warning',
        'Cannot apply changes: There are validation errors in the grid. Please fix them first.'
      );
      return;
    }

    await resolutionActions?.applyPendingResources();
  }, [resolutionActions, onMessage]);

  // Enhanced discard handler
  const handleDiscardAll = useCallback(() => {
    resolutionActions?.discardEdits?.();
    resolutionActions?.discardPendingResources?.();
    // Clear validation errors when discarding
    clearAllGridValidationErrors();
  }, [resolutionActions]);

  if (!resources) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <TableCellsIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Multi-Grid Resource Manager</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Resources Loaded</h3>
            <p className="text-gray-600 mb-6">
              Import resources first to manage them across multiple specialized grid views.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Multi-Grid View:</strong> Manage related resources across multiple grids with shared
                context and batch operations. Perfect for administrative workflows.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gridConfigurations.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <TableCellsIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Multi-Grid Resource Manager</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Grid Configurations</h3>
            <p className="text-gray-600">
              Configure grid definitions to display and manage your resources in specialized views.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TableCellsIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Multi-Grid Resource Manager</h2>
          {isFilteringActive && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Filtered
            </span>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <span className="font-medium">{totalResourceCounts.total}</span> resources across{' '}
          <span className="font-medium">{gridConfigurations.length}</span> grid
          {gridConfigurations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Shared Context Controls */}
      <SharedContextControls
        availableQualifiers={availableQualifiers}
        resolutionState={resolutionState}
        resolutionActions={resolutionActions}
        contextOptions={contextOptions}
        resources={baseProcessedResources}
        className="mb-6"
      />

      {/* Grid Selector */}
      <GridSelector
        gridConfigurations={gridConfigurations}
        activeGridId={activeGridId}
        onGridChange={handleGridChange}
        presentation={tabsPresentation}
        allowReordering={allowGridReordering}
        className="mb-6"
      />

      {/* Active Grid Display */}
      {currentGridConfig && (
        <div className="mb-6">
          <GridView
            gridConfig={currentGridConfig}
            resources={baseProcessedResources}
            resolutionState={resolutionState}
            resolutionActions={resolutionActions}
            availableQualifiers={availableQualifiers}
            contextOptions={contextOptions}
            filterState={filterState}
            filterResult={filterResult}
            showContextControls={false} // Context is managed at the multi-grid level
            showChangeControls={false} // Change controls are managed at the multi-grid level
            onMessage={onMessage}
          />
        </div>
      )}

      {/* Unified Change Controls for all grids */}
      {(resolutionState?.hasUnsavedEdits || resolutionState?.hasPendingResourceChanges) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <UnifiedChangeControls
            editCount={resolutionState?.editedResources?.size || 0}
            addCount={resolutionState?.pendingResources?.size || 0}
            deleteCount={resolutionState?.pendingResourceDeletions?.size || 0}
            isApplying={resolutionState?.isApplyingEdits}
            disabled={!resolutionState?.currentResolver}
            onApplyAll={handleApplyPendingResources}
            onDiscardAll={handleDiscardAll}
          />

          {/* Validation warning */}
          {hasGridValidationErrors() && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="text-sm text-yellow-800">
                <strong>Validation Errors:</strong> Some fields have validation errors. Please review and fix
                them before applying changes.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiGridView;
