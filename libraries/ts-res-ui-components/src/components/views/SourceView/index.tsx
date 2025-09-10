import React, { useState, useMemo, useCallback } from 'react';
import {
  DocumentTextIcon,
  DocumentArrowDownIcon,
  CodeBracketIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { ISourceViewProps } from '../../../types';
import { ResourcePicker } from '../../pickers/ResourcePicker';
import { IResourceSelection, IResourcePickerOptions } from '../../pickers/ResourcePicker/types';
import { SourceResourceDetail } from '../../common/SourceResourceDetail';
import { ResourcePickerOptionsControl } from '../../common/ResourcePickerOptionsControl';

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
export const SourceView: React.FC<ISourceViewProps> = ({
  resources,
  onExport,
  onMessage,
  pickerOptions,
  pickerOptionsPresentation = 'hidden',
  className = ''
}) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [showJsonView, setShowJsonView] = useState(false);

  // State for picker options control
  const [currentPickerOptions, setCurrentPickerOptions] = useState<IResourcePickerOptions>(
    (pickerOptions ?? {}) as IResourcePickerOptions
  );

  // Merge picker options with view-specific defaults
  const effectivePickerOptions = useMemo(
    () => ({
      defaultView: 'list' as const,
      showViewToggle: true,
      enableSearch: true,
      searchPlaceholder: 'Search resources...',
      searchScope: 'all' as const,
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
  const handleResourceSelect = useCallback(
    (selection: IResourceSelection) => {
      setSelectedResourceId(selection.resourceId);
      if (selection.resourceId) {
        onMessage?.('info', `Selected resource: ${selection.resourceId}`);
      }
    },
    [onMessage]
  );

  // Get full resource collection data using the new method
  const getResourceCollectionData = useCallback(() => {
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
  const handleExportSourceData = useCallback(() => {
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
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Source Browser</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">No Resources Loaded</h3>
            <p className="text-gray-600 mb-6">Import resources to explore them here.</p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Use the Import View to load ts-res resource files or directories, then
                return here to browse and explore the loaded resources.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Source Browser</h2>
        </div>
        {resources && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportSourceData}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              Export JSON
            </button>
          </div>
        )}
      </div>

      {/* ResourcePicker Options Control */}
      <ResourcePickerOptionsControl
        options={currentPickerOptions}
        onOptionsChange={setCurrentPickerOptions}
        presentation={pickerOptionsPresentation}
        title="Source Browser Picker Options"
        className="mb-6"
      />

      {/* JSON View Toggle */}
      {resources && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <button
            onClick={() => setShowJsonView(!showJsonView)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <CodeBracketIcon className="h-4 w-4 mr-2" />
            {showJsonView ? 'Hide' : 'Show'} JSON Resource Collection
            {showJsonView ? (
              <ChevronUpIcon className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDownIcon className="h-4 w-4 ml-2" />
            )}
          </button>

          {/* JSON View */}
          {showJsonView && (
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">Resource Collection (JSON)</h3>
                  <button
                    onClick={handleExportSourceData}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                    Export
                  </button>
                </div>
                <pre className="text-xs text-gray-800 bg-white p-3 rounded border overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(getResourceCollectionData(), null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
          {/* Left side: Resource Picker */}
          <div className="lg:w-1/2 flex flex-col">
            <div className="flex items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
            </div>

            {/* Enhanced Resource Picker */}
            <div className="flex-1 min-h-0">
              <ResourcePicker
                resources={resources}
                selectedResourceId={selectedResourceId}
                onResourceSelect={handleResourceSelect}
                options={effectivePickerOptions}
                onMessage={onMessage}
              />
            </div>
          </div>

          {/* Right side: Resource Details */}
          <div className="lg:w-1/2 flex flex-col">
            {selectedResourceId ? (
              <SourceResourceDetail resourceId={selectedResourceId} processedResources={resources} />
            ) : (
              <div className="flex-1 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a resource to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceView;
