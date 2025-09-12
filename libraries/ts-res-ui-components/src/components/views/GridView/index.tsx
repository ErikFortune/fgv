import React, { useMemo, useCallback, useEffect } from 'react';
import { TableCellsIcon } from '@heroicons/react/24/outline';
import { IGridViewProps, IResolutionResult } from '../../../types';
import { selectResources } from '../../../utils/resourceSelector';
import { QualifierContextControl } from '../../common/QualifierContextControl';
import { UnifiedChangeControls } from '../ResolutionView/UnifiedChangeControls';
import { ResourceGrid } from './ResourceGrid';
import { useSmartObservability } from '../../../hooks/useSmartObservability';

/**
 * GridView component for displaying multiple resources in a tabular format.
 *
 * Provides a grid-based interface for viewing and editing multiple resources
 * simultaneously, with configurable column mappings and shared context management.
 * Leverages the same state management and batch processing as ResolutionView.
 *
 * **Key Features:**
 * - **Multi-resource display**: View multiple resources in rows with configurable columns
 * - **Column mapping**: Host-defined extraction of properties from resolved resources
 * - **Batch editing**: Edit multiple resource values with unified batch application
 * - **Context integration**: Same context management as ResolutionView
 * - **Resource filtering**: Flexible resource selection via built-in and custom selectors
 * - **Change management**: Leverages existing UnifiedChangeControls for batch operations
 *
 * @example
 * ```tsx
 * import { GridView } from '@fgv/ts-res-ui-components';
 *
 * // Define grid configuration
 * const gridConfig = {
 *   id: 'user-messages',
 *   title: 'User Messages',
 *   resourceSelection: { type: 'prefix', prefix: 'user.' },
 *   columnMapping: [{
 *     resourceType: 'text-resource',
 *     columns: [
 *       { id: 'text', title: 'Message Text', dataPath: 'text', editable: true },
 *       { id: 'locale', title: 'Locale', dataPath: 'locale' }
 *     ]
 *   }]
 * };
 *
 * function MyGridApp() {
 *   return (
 *     <GridView
 *       gridConfig={gridConfig}
 *       resources={processedResources}
 *       resolutionState={resolutionState}
 *       resolutionActions={resolutionActions}
 *       availableQualifiers={['language', 'territory', 'platform']}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
export const GridView: React.FC<IGridViewProps> = ({
  gridConfig,
  resources,
  resolutionState,
  resolutionActions,
  availableQualifiers = [],
  contextOptions,
  filterState,
  filterResult,
  showContextControls = true,
  showChangeControls = true,
  className = ''
}) => {
  const o11y = useSmartObservability();

  // Store o11y in a ref to avoid re-render issues
  const o11yRef = React.useRef(o11y);
  React.useEffect(() => {
    o11yRef.current = o11y;
  }, [o11y]);

  // Use filtered resources when filtering is active and successful
  const isFilteringActive = filterState?.enabled && filterResult?.success === true;
  const baseProcessedResources = isFilteringActive ? filterResult?.processedResources : resources;

  // Select resources for this grid based on the configuration
  const selectedResourceIds = useMemo(() => {
    if (!baseProcessedResources || !gridConfig.resourceSelection) {
      return [];
    }

    const selectionResult = selectResources(gridConfig.resourceSelection, baseProcessedResources);
    if (selectionResult.isFailure()) {
      // Use ref to avoid dependency on o11y
      o11yRef.current.user.error(`Resource selection failed: ${selectionResult.message}`);
      return [];
    }

    return selectionResult.value;
  }, [baseProcessedResources, gridConfig.resourceSelection]); // Removed o11y from dependencies

  // Resolve all selected resources with current context
  const resourceResolutions = useMemo(() => {
    if (!resolutionState?.currentResolver || !selectedResourceIds.length) {
      return new Map<string, IResolutionResult>();
    }

    const resolutions = new Map<string, IResolutionResult>();

    selectedResourceIds.forEach((resourceId) => {
      try {
        const resolver = resolutionState.currentResolver!;
        const resourceResult = resolver.resourceManager.getBuiltResource(resourceId);

        if (resourceResult.isSuccess()) {
          const resource = resourceResult.value;
          // Resolve the resource with current context
          const resolveResult = resolver.resolveComposedResourceValue(resourceId);

          if (resolveResult.isSuccess()) {
            resolutions.set(resourceId, {
              success: true,
              resourceId,
              resource,
              composedValue: resolveResult.value
              // Note: For grid view, we mainly need the composed value
              // Full candidate analysis is available but not needed for basic grid display
            });
          } else {
            resolutions.set(resourceId, {
              success: false,
              resourceId,
              error: resolveResult.message
            });
          }
        }
      } catch (error) {
        resolutions.set(resourceId, {
          success: false,
          resourceId,
          error: error instanceof Error ? error.message : 'Unknown resolution error'
        });
      }
    });

    return resolutions;
  }, [selectedResourceIds, resolutionState?.currentResolver, resolutionState?.contextValues]);

  // Handle context value changes using the shared pattern from ResolutionView
  const handleQualifierChange = useCallback(
    (qualifierName: string, value: string | undefined) => {
      // Don't update context if this qualifier is host-managed
      const qualifierOptions = contextOptions?.qualifierOptions?.[qualifierName];
      const isHostManaged = qualifierOptions?.hostValue !== undefined;

      if (!isHostManaged) {
        resolutionActions?.updateContextValue(qualifierName, value);
      }
    },
    [resolutionActions, contextOptions?.qualifierOptions]
  );

  // Apply host-managed values when they change (same pattern as ResolutionView)
  useEffect(() => {
    if (!contextOptions?.hostManagedValues || !resolutionActions?.applyContext) return;

    resolutionActions.applyContext(contextOptions.hostManagedValues);
  }, [contextOptions?.hostManagedValues, resolutionActions]);

  // Determine which qualifiers to show
  const visibleQualifiers = useMemo(() => {
    if (!contextOptions?.qualifierOptions) {
      return availableQualifiers;
    }

    return availableQualifiers.filter((qualifierName) => {
      const options = contextOptions.qualifierOptions![qualifierName];
      return options?.visible !== false;
    });
  }, [availableQualifiers, contextOptions?.qualifierOptions]);

  // Get effective context values
  const effectiveContextValues = useMemo(() => {
    return resolutionState?.contextValues || {};
  }, [resolutionState?.contextValues]);

  if (!resources) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <TableCellsIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">{gridConfig.title || 'Resource Grid'}</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Resources Loaded</h3>
            <p className="text-gray-600 mb-6">
              Import resources first to view them in a grid format with customizable columns.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Grid View:</strong> Display multiple resources in a table format. Configure columns to
                extract and edit specific properties from resolved resources.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <TableCellsIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">{gridConfig.title || 'Resource Grid'}</h2>
        {isFilteringActive && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Filtered
          </span>
        )}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {selectedResourceIds.length} resource{selectedResourceIds.length !== 1 ? 's' : ''}
        </span>
      </div>

      {gridConfig.description && <p className="text-gray-600 mb-6">{gridConfig.description}</p>}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Context Configuration Panel */}
        {showContextControls && contextOptions?.showContextControls !== false && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {contextOptions?.contextPanelTitle || 'Context Configuration'}
            </h3>
            <div className={`bg-gray-50 rounded-lg p-4 ${contextOptions?.contextPanelClassName || ''}`}>
              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {visibleQualifiers.map((qualifierName) => {
                    const qualifierOptions = contextOptions?.qualifierOptions?.[qualifierName];
                    const hostManagedValue = contextOptions?.hostManagedValues?.[qualifierName];
                    const globalPlaceholder =
                      typeof contextOptions?.globalPlaceholder === 'function'
                        ? contextOptions.globalPlaceholder(qualifierName)
                        : contextOptions?.globalPlaceholder;

                    const mergedOptions = {
                      ...qualifierOptions,
                      hostValue:
                        hostManagedValue !== undefined ? hostManagedValue : qualifierOptions?.hostValue
                    };

                    return (
                      <QualifierContextControl
                        key={qualifierName}
                        qualifierName={qualifierName}
                        value={resolutionState?.pendingContextValues[qualifierName]}
                        onChange={handleQualifierChange}
                        placeholder={globalPlaceholder || `Enter ${qualifierName} value`}
                        resources={baseProcessedResources}
                        options={mergedOptions}
                      />
                    );
                  })}
                </div>
              </div>

              {contextOptions?.showCurrentContext !== false && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Current:{' '}
                    {Object.entries(effectiveContextValues)
                      .map(([key, value]) => `${key}=${value === undefined ? '(undefined)' : value}`)
                      .join(', ')}
                  </div>
                  {contextOptions?.showContextActions !== false && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={resolutionActions?.resetCache}
                        className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        title="Clear resolution cache"
                      >
                        Clear Cache
                      </button>
                      <button
                        onClick={() => resolutionActions?.applyContext()}
                        disabled={!resolutionState?.hasPendingChanges}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          resolutionState?.hasPendingChanges
                            ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {resolutionState?.hasPendingChanges
                          ? 'Apply Changes'
                          : resolutionState?.currentResolver
                          ? 'Context Applied'
                          : 'Apply Context'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Grid Display */}
        <ResourceGrid
          gridConfig={gridConfig}
          selectedResourceIds={selectedResourceIds}
          resourceResolutions={resourceResolutions}
          resolutionActions={resolutionActions}
          resolutionState={resolutionState}
        />

        {/* Unified Change Controls */}
        {showChangeControls &&
          (resolutionState?.hasUnsavedEdits || resolutionState?.hasPendingResourceChanges) && (
            <div className="mt-6">
              <UnifiedChangeControls
                editCount={resolutionState?.editedResources?.size || 0}
                addCount={resolutionState?.pendingResources?.size || 0}
                deleteCount={resolutionState?.pendingResourceDeletions?.size || 0}
                isApplying={resolutionState?.isApplyingEdits}
                disabled={!resolutionState?.currentResolver}
                onApplyAll={async () => {
                  await resolutionActions?.applyPendingResources();
                }}
                onDiscardAll={() => {
                  resolutionActions?.discardEdits?.();
                  resolutionActions?.discardPendingResources?.();
                }}
              />
            </div>
          )}
      </div>
    </div>
  );
};

export default GridView;
