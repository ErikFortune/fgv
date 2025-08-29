import React, { useCallback, useMemo } from 'react';
import {
  ProcessedResources,
  ResolutionActions,
  ResolutionState,
  ResolutionContextOptions
} from '../../../types';
import { QualifierContextControl } from '../../common/QualifierContextControl';

/**
 * Props for the SharedContextControls component.
 */
export interface SharedContextControlsProps {
  /** Available qualifiers for context building */
  availableQualifiers: string[];
  /** Current resolution state */
  resolutionState?: ResolutionState;
  /** Resolution actions for context management */
  resolutionActions?: ResolutionActions;
  /** Context configuration options */
  contextOptions?: ResolutionContextOptions;
  /** The resource system for qualifier value suggestions */
  resources?: ProcessedResources | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SharedContextControls component for managing resolution context across multiple grids.
 *
 * Provides a unified context management interface that is shared across all grid instances
 * in a MultiGridView. Changes to context values are immediately reflected in all grids,
 * enabling consistent administrative workflows.
 *
 * @example
 * ```tsx
 * <SharedContextControls
 *   availableQualifiers={['language', 'territory', 'platform']}
 *   resolutionState={sharedResolutionState}
 *   resolutionActions={sharedResolutionActions}
 *   contextOptions={{
 *     qualifierOptions: {
 *       language: { editable: true },
 *       platform: { editable: false, hostValue: 'web' }
 *     },
 *     hostManagedValues: { environment: 'production' }
 *   }}
 *   resources={processedResources}
 * />
 * ```
 * @public
 */
export const SharedContextControls: React.FC<SharedContextControlsProps> = ({
  availableQualifiers,
  resolutionState,
  resolutionActions,
  contextOptions,
  resources,
  className = ''
}) => {
  // Handle context value changes
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

  // Don't render if context controls are disabled
  if (contextOptions?.showContextControls === false) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {contextOptions?.contextPanelTitle || 'Shared Context Configuration'}
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

              // Merge host-managed values with qualifier options
              const mergedOptions = {
                ...qualifierOptions,
                hostValue: hostManagedValue !== undefined ? hostManagedValue : qualifierOptions?.hostValue
              };

              return (
                <QualifierContextControl
                  key={qualifierName}
                  qualifierName={qualifierName}
                  value={resolutionState?.pendingContextValues[qualifierName]}
                  onChange={handleQualifierChange}
                  placeholder={globalPlaceholder || `Enter ${qualifierName} value`}
                  resources={resources}
                  options={mergedOptions}
                />
              );
            })}
          </div>
        </div>

        {contextOptions?.showCurrentContext !== false && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <strong>Current Context:</strong>{' '}
              {Object.entries(effectiveContextValues).length > 0 ? (
                Object.entries(effectiveContextValues)
                  .map(([key, value]) => `${key}=${value === undefined ? '(undefined)' : value}`)
                  .join(', ')
              ) : (
                <span className="italic">No context values set</span>
              )}
            </div>

            {contextOptions?.showContextActions !== false && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={resolutionActions?.resetCache}
                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  title="Clear resolution cache for all grids"
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
                  title="Apply context changes to all grids"
                >
                  {resolutionState?.hasPendingChanges
                    ? 'Apply Context to All Grids'
                    : resolutionState?.currentResolver
                    ? 'Context Applied'
                    : 'Apply Context'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Context change summary */}
        {resolutionState?.hasPendingChanges && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm text-blue-800">
              <strong>Pending Context Changes:</strong> Changes will be applied to all visible grids
              simultaneously. This ensures consistent data across all administrative views.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedContextControls;
