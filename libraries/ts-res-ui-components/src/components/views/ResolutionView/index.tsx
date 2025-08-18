import React, { useState, useMemo, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CubeIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ListBulletIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import {
  ResolutionViewProps,
  CandidateInfo,
  ResolutionActions,
  ResolutionState,
  ResourceEditorFactory,
  ResourceEditorResult,
  ResolutionContextOptions
} from '../../../types';
import { QualifierContextControl } from '../../common/QualifierContextControl';
import { ResolutionEditControls } from './ResolutionEditControls';
import { ResourcePicker } from '../../pickers/ResourcePicker';
import {
  ResourceSelection,
  ResourceAnnotations,
  ResourcePickerOptions
} from '../../pickers/ResourcePicker/types';
import { ResourcePickerOptionsControl } from '../../common/ResourcePickerOptionsControl';
import { ResolutionContextOptionsControl } from '../../common/ResolutionContextOptionsControl';
import { ResolutionResults } from '../../common/ResolutionResults';

/**
 * ResolutionView component for resource resolution testing and editing.
 *
 * Provides a comprehensive interface for testing resource resolution with different
 * qualifier contexts, viewing resolution results, and editing resource values with
 * custom editors. Supports real-time resolution testing and conflict detection.
 *
 * **Key Features:**
 * - **Context management**: Set and update resolution context (qualifier values)
 * - **Real-time resolution**: See how resources resolve with current context
 * - **Resource editing**: Edit resource values with custom type-specific editors
 * - **Conflict detection**: Detect when edits would conflict with existing resources
 * - **Preview mode**: See how edits affect resolution without committing changes
 * - **Custom editors**: Support for type-specific resource editors via factory pattern
 * - **Fallback editing**: JSON editor fallback when custom editors aren't available
 *
 * @example
 * ```tsx
 * import { ResolutionView } from '@fgv/ts-res-ui-components';
 *
 * // Custom editor factory for specific resource types
 * const editorFactory = {
 *   createEditor: (resourceId, resourceType, value) => {
 *     if (resourceType === 'market-info') {
 *       return {
 *         success: true,
 *         editor: MarketInfoEditor
 *       };
 *     }
 *     return { success: false };
 *   }
 * };
 *
 * function MyResolutionTool() {
 *   return (
 *     <ResolutionView
 *       resources={processedResources}
 *       resolutionState={resolutionState}
 *       resolutionActions={resolutionActions}
 *       availableQualifiers={['language', 'territory', 'platform']}
 *       resourceEditorFactory={editorFactory}
 *       onMessage={(type, message) => console.log(`${type}: ${message}`)}
 *     />
 *   );
 * }
 * ```
 *
 * @public
 */
export const ResolutionView: React.FC<ResolutionViewProps> = ({
  resources,
  filterState,
  filterResult,
  resolutionState,
  resolutionActions,
  availableQualifiers = [],
  resourceEditorFactory,
  onMessage,
  pickerOptions,
  pickerOptionsPresentation = 'hidden',
  contextOptions,
  className = ''
}) => {
  // State for picker options control
  const [currentPickerOptions, setCurrentPickerOptions] = useState<ResourcePickerOptions>(
    pickerOptions || {}
  );

  // State for context options control
  const [currentContextOptions, setCurrentContextOptions] = useState<ResolutionContextOptions>(
    contextOptions || {}
  );

  // Use filtered resources when filtering is active and successful
  const isFilteringActive = filterState?.enabled && filterResult?.success === true;
  const activeProcessedResources = isFilteringActive ? filterResult?.processedResources : resources;

  // Merge picker options with resolution-specific defaults
  const effectivePickerOptions = useMemo(
    () => ({
      defaultView: 'list' as const,
      showViewToggle: true,
      enableSearch: true,
      searchPlaceholder: 'Search resources for resolution testing...',
      searchScope: 'all' as const,
      height: '520px',
      emptyMessage: 'No resources available for resolution testing',
      // Override with user-provided options
      ...pickerOptions,
      // Override with current picker options from control
      ...currentPickerOptions
    }),
    [pickerOptions, currentPickerOptions]
  );

  // Create resource annotations for resolution results and edit states
  const resourceAnnotations = useMemo(() => {
    const annotations: ResourceAnnotations = {};

    if (!activeProcessedResources?.summary?.resourceIds) {
      return annotations;
    }

    activeProcessedResources.summary.resourceIds.forEach((resourceId) => {
      const hasEdit = resolutionActions?.hasEdit?.(resourceId);
      const isSelected = resolutionState?.selectedResourceId === resourceId;
      const hasResolutionResult = isSelected && resolutionState?.resolutionResult;

      // Base annotation with edit indicator
      annotations[resourceId] = {
        indicator: hasEdit
          ? {
              type: 'icon',
              value: '✏️',
              tooltip: 'Resource has unsaved edits'
            }
          : undefined
      };

      // Add resolution result annotations for selected resource
      if (hasResolutionResult && resolutionState?.resolutionResult?.success) {
        const result = resolutionState.resolutionResult;

        // Show match status as badge
        if (result.bestCandidate) {
          annotations[resourceId].badge = {
            text: 'Resolved',
            variant: 'info'
          };
        } else if (result.candidateDetails) {
          const matchingCount = result.candidateDetails.filter((c: CandidateInfo) => c.matched).length;
          const totalCount = result.candidateDetails.length;

          if (matchingCount === 0) {
            annotations[resourceId].badge = {
              text: 'No Match',
              variant: 'error'
            };
          } else {
            annotations[resourceId].badge = {
              text: `${matchingCount}/${totalCount}`,
              variant: 'warning'
            };
          }
        }

        // Add suffix with candidate count
        if (result.resource) {
          const totalCandidates = result.resource.candidates.length;
          annotations[resourceId].suffix = `${totalCandidates} candidate${totalCandidates !== 1 ? 's' : ''}`;
        }
      } else if (
        isSelected &&
        resolutionState?.resolutionResult &&
        !resolutionState.resolutionResult.success
      ) {
        // Show error state
        annotations[resourceId].badge = {
          text: 'Error',
          variant: 'error'
        };
      }
    });

    return annotations;
  }, [
    activeProcessedResources?.summary?.resourceIds,
    resolutionActions,
    resolutionState?.selectedResourceId,
    resolutionState?.resolutionResult
  ]);

  // Merge context options with current options from control
  const effectiveContextOptions = useMemo(
    () => ({
      ...contextOptions,
      ...currentContextOptions
    }),
    [contextOptions, currentContextOptions]
  );

  // Handle context value changes using the shared component's callback pattern
  const handleQualifierChange = useCallback(
    (qualifierName: string, value: string | undefined) => {
      // Don't update context if this qualifier is host-managed
      const qualifierOptions = effectiveContextOptions?.qualifierOptions?.[qualifierName];
      const isHostManaged = qualifierOptions?.hostValue !== undefined;

      if (!isHostManaged) {
        resolutionActions?.updateContextValue(qualifierName, value);
      }
    },
    [resolutionActions, effectiveContextOptions?.qualifierOptions]
  );

  // Determine which qualifiers to show and their options
  const visibleQualifiers = useMemo(() => {
    if (!effectiveContextOptions?.qualifierOptions) {
      return availableQualifiers;
    }

    return availableQualifiers.filter((qualifierName) => {
      const options = effectiveContextOptions.qualifierOptions![qualifierName];
      return options?.visible !== false;
    });
  }, [availableQualifiers, effectiveContextOptions?.qualifierOptions]);

  // Get effective context values including host-managed values
  const effectiveContextValues = useMemo(() => {
    const baseValues = resolutionState?.contextValues || {};
    const hostValues = effectiveContextOptions?.hostManagedValues || {};
    return { ...baseValues, ...hostValues };
  }, [resolutionState?.contextValues, effectiveContextOptions?.hostManagedValues]);

  // Handle resource selection from ResourcePicker
  const handleResourceSelect = useCallback(
    (selection: ResourceSelection) => {
      if (selection.resourceId) {
        resolutionActions?.selectResource(selection.resourceId);
      }
    },
    [resolutionActions]
  );

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (mode: 'composed' | 'best' | 'all' | 'raw') => {
      resolutionActions?.setViewMode(mode);
    },
    [resolutionActions]
  );

  if (!resources) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Resolution Viewer</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Resources Loaded</h3>
            <p className="text-gray-600 mb-6">
              Import resources first to test resource resolution with different contexts.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Resolution Viewer:</strong> Test how resources resolve with different qualifier
                contexts. Set context values and see which candidates match.
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
        <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Resolution Viewer</h2>
        {isFilteringActive && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Filtered
          </span>
        )}
      </div>

      {/* ResourcePicker Options Control */}
      <ResourcePickerOptionsControl
        options={currentPickerOptions}
        onOptionsChange={setCurrentPickerOptions}
        presentation={pickerOptionsPresentation}
        title="Resolution Viewer Picker Options"
        className="mb-6"
      />

      {/* ResolutionContext Options Control */}
      <ResolutionContextOptionsControl
        options={currentContextOptions}
        onOptionsChange={setCurrentContextOptions}
        availableQualifiers={availableQualifiers}
        presentation={pickerOptionsPresentation}
        title="Resolution Context Options"
        className="mb-6"
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Context Configuration Panel */}
        {effectiveContextOptions?.showContextControls !== false && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {effectiveContextOptions?.contextPanelTitle || 'Context Configuration'}
            </h3>
            <div
              className={`bg-gray-50 rounded-lg p-4 ${effectiveContextOptions?.contextPanelClassName || ''}`}
            >
              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {visibleQualifiers.map((qualifierName) => {
                    const qualifierOptions = effectiveContextOptions?.qualifierOptions?.[qualifierName];
                    const hostManagedValue = effectiveContextOptions?.hostManagedValues?.[qualifierName];
                    const globalPlaceholder =
                      typeof effectiveContextOptions?.globalPlaceholder === 'function'
                        ? effectiveContextOptions.globalPlaceholder(qualifierName)
                        : effectiveContextOptions?.globalPlaceholder;

                    // Merge host-managed values with qualifier options
                    const mergedOptions = {
                      ...qualifierOptions,
                      // Host-managed values override qualifier-specific host values
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
                        resources={activeProcessedResources}
                        options={mergedOptions}
                      />
                    );
                  })}
                </div>
              </div>

              {effectiveContextOptions?.showCurrentContext !== false && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Current:{' '}
                    {Object.entries(effectiveContextValues)
                      .map(([key, value]) => `${key}=${value === undefined ? '(undefined)' : value}`)
                      .join(', ')}
                  </div>
                  {effectiveContextOptions?.showContextActions !== false && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={resolutionActions?.resetCache}
                        className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                        title="Clear resolution cache"
                      >
                        Clear Cache
                      </button>
                      <button
                        onClick={resolutionActions?.applyContext}
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

        {/* Edit Controls - Show when there are unsaved edits */}
        {resolutionState?.hasUnsavedEdits && (
          <div className="mt-6">
            <ResolutionEditControls
              editCount={resolutionState.editedResources.size}
              isApplying={resolutionState.isApplyingEdits}
              hasEdits={resolutionState.hasUnsavedEdits}
              onApplyEdits={resolutionActions?.applyEdits}
              onDiscardEdits={resolutionActions?.discardEdits}
              disabled={!resolutionState.currentResolver}
            />
          </div>
        )}

        {/* Main Browser/Details Layout */}
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Left side: Resource Selection */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
            </div>

            <div className="flex-1">
              <ResourcePicker
                resources={activeProcessedResources || null}
                selectedResourceId={resolutionState?.selectedResourceId || null}
                onResourceSelect={handleResourceSelect}
                resourceAnnotations={resourceAnnotations}
                options={effectivePickerOptions}
                onMessage={onMessage}
              />
            </div>
          </div>

          {/* Right side: Resolution Results */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Results</h3>
              {resolutionState?.selectedResourceId && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewModeChange('composed')}
                    className={`px-3 py-1 text-xs rounded ${
                      resolutionState?.viewMode === 'composed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Composed
                  </button>
                  <button
                    onClick={() => handleViewModeChange('best')}
                    className={`px-3 py-1 text-xs rounded ${
                      resolutionState?.viewMode === 'best'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Best
                  </button>
                  <button
                    onClick={() => handleViewModeChange('all')}
                    className={`px-3 py-1 text-xs rounded ${
                      resolutionState?.viewMode === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleViewModeChange('raw')}
                    className={`px-3 py-1 text-xs rounded ${
                      resolutionState?.viewMode === 'raw'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Raw
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {!resolutionState?.selectedResourceId ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a resource to view resolution results</p>
                  </div>
                </div>
              ) : !resolutionState?.currentResolver ? (
                <div className="text-center text-gray-500">
                  <p>Apply a context to resolve resources</p>
                </div>
              ) : !resolutionState?.resolutionResult ? (
                <div className="text-center text-gray-500">
                  <p>Resolving...</p>
                </div>
              ) : (
                <ResolutionResults
                  result={resolutionState.resolutionResult}
                  viewMode={resolutionState.viewMode}
                  contextValues={resolutionState.contextValues}
                  resolutionActions={resolutionActions}
                  resolutionState={resolutionState}
                  resourceEditorFactory={resourceEditorFactory}
                  onMessage={onMessage}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResolutionView;
