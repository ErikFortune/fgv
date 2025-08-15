import React, { useState, useCallback } from 'react';
import { ResourcePicker, ResourceAnnotations, PendingResource } from '@fgv/ts-res-ui-components';

interface ResourcePickerToolProps {
  resources: any; // Using the orchestrator state.resources
  onMessage: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void;
}

const ResourcePickerTool: React.FC<ResourcePickerToolProps> = ({ resources, onMessage }) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree');
  const [enableSearch, setEnableSearch] = useState(true);
  const [showViewToggle, setShowViewToggle] = useState(true);
  const [rootPath, setRootPath] = useState<string>('');
  const [hideRootNode, setHideRootNode] = useState(false);
  const [useAnnotations, setUseAnnotations] = useState(true);
  const [usePendingResources, setUsePendingResources] = useState(false);

  const handleResourceSelect = useCallback(
    (resourceId: string | null) => {
      setSelectedResourceId(resourceId);
      onMessage('info', `Selected resource: ${resourceId || 'none'}`);
    },
    [onMessage]
  );

  // Sample annotations for demo
  const resourceAnnotations: ResourceAnnotations = useAnnotations
    ? {
        'dashboard-config': {
          badge: { text: 'multi', variant: 'info' },
          suffix: '(6 candidates)'
        },
        'financial-ui': {
          badge: { text: 'i18n', variant: 'success' },
          indicator: { type: 'dot', value: '●', tooltip: 'Has localized variants' }
        },
        'regional-features': {
          badge: { text: 'market', variant: 'warning' },
          suffix: 'region-specific'
        }
      }
    : {};

  // Sample pending resources for demo
  const pendingResources: PendingResource[] = usePendingResources
    ? [
        {
          id: 'new-feature-config',
          type: 'new',
          displayName: 'New Feature Config (unsaved)'
        },
        {
          id: 'updated-dashboard',
          type: 'modified',
          displayName: 'Updated Dashboard (pending)'
        }
      ]
    : [];

  // Check if we have processed resources
  const hasResources = resources && resources.compiledCollection;
  const resourceCount = hasResources ? Object.keys(resources.compiledCollection.resources || {}).length : 0;

  if (!hasResources || resourceCount === 0) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Resource Picker</h1>
            <p className="text-gray-600 mt-2">
              Interactive ResourcePicker component demo and testing environment.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Loaded</h3>
              <p className="text-sm mb-4">
                Load a configuration and import resources to start testing the ResourcePicker component.
              </p>
              <p className="text-xs text-gray-400">
                Use the Configuration or Import tools in the sidebar to get started.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Resource Picker</h1>
          <p className="text-gray-600 mt-2">
            Interactive ResourcePicker component with {resourceCount} loaded resources.
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Component Configuration</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Default View</label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'list' | 'tree')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="list">List</option>
                <option value="tree">Tree</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Root Path</label>
              <input
                type="text"
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
                placeholder="e.g., platform/territories"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={enableSearch}
                  onChange={(e) => setEnableSearch(e.target.checked)}
                  className="mr-2 rounded"
                />
                Enable Search
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={showViewToggle}
                  onChange={(e) => setShowViewToggle(e.target.checked)}
                  className="mr-2 rounded"
                />
                Show View Toggle
              </label>
            </div>

            <div className="space-y-3">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={hideRootNode}
                  onChange={(e) => setHideRootNode(e.target.checked)}
                  className="mr-2 rounded"
                />
                Hide Root Node
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={useAnnotations}
                  onChange={(e) => setUseAnnotations(e.target.checked)}
                  className="mr-2 rounded"
                />
                Show Annotations
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={usePendingResources}
                onChange={(e) => setUsePendingResources(e.target.checked)}
                className="mr-2 rounded"
              />
              Show Pending Resources
            </label>
          </div>
        </div>

        {/* Demo Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resource Picker */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">ResourcePicker Component</h2>
              <div className="border border-gray-200 rounded-lg">
                <ResourcePicker
                  resources={resources}
                  selectedResourceId={selectedResourceId}
                  onResourceSelect={handleResourceSelect}
                  defaultView={viewMode}
                  showViewToggle={showViewToggle}
                  rootPath={rootPath}
                  hideRootNode={hideRootNode}
                  enableSearch={enableSearch}
                  resourceAnnotations={resourceAnnotations}
                  pendingResources={pendingResources}
                  onMessage={onMessage}
                  height={500}
                />
              </div>
            </div>
          </div>

          {/* State Display */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Component State</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Selected Resource</label>
                  <div className="p-3 bg-gray-50 rounded border text-sm font-mono">
                    {selectedResourceId || 'null'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Resource Summary</label>
                  <div className="p-3 bg-gray-50 rounded border text-sm space-y-1">
                    <div>
                      <strong>Total:</strong> {resourceCount}
                    </div>
                    <div>
                      <strong>Resources:</strong>
                    </div>
                    <div className="ml-2 text-xs text-gray-600">
                      {Object.keys(resources.compiledCollection.resources || {})
                        .slice(0, 5)
                        .map((id) => (
                          <div key={id}>• {id}</div>
                        ))}
                      {Object.keys(resources.compiledCollection.resources || {}).length > 5 && (
                        <div>
                          ... and {Object.keys(resources.compiledCollection.resources || {}).length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Configuration</label>
                  <pre className="p-3 bg-gray-50 rounded border text-xs overflow-x-auto">
                    {JSON.stringify(
                      {
                        defaultView: viewMode,
                        showViewToggle,
                        rootPath: rootPath || undefined,
                        hideRootNode,
                        enableSearch,
                        hasAnnotations: useAnnotations,
                        hasPendingResources: usePendingResources
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcePickerTool;
