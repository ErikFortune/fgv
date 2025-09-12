import React, { useState, useCallback, useMemo } from 'react';
import { PickerTools } from '@fgv/ts-res-ui-components';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

// Quick Branch Selector Component
interface QuickBranchSelectorProps {
  resources: any;
  currentRootPath: string;
  onRootPathChange: (path: string) => void;
}

const QuickBranchSelector: React.FC<QuickBranchSelectorProps> = ({
  resources,
  currentRootPath,
  onRootPathChange
}) => {
  // Extract available branches from resource tree
  const availableBranches = useMemo(() => {
    if (!resources?.system?.resourceManager) return [];

    const treeResult = resources.system.resourceManager.getBuiltResourceTree();
    if (treeResult.isFailure()) return [];

    const tree = treeResult.value;
    const branches: string[] = [];

    // Get top-level branches (direct children of root that have children themselves)
    const collectBranches = (node: any, path: string = '') => {
      if (!node.isLeaf && node.children) {
        for (const [key, child] of node.children.entries()) {
          const childPath = path ? `${path}.${key}` : key;

          // Add this as a branch if it has children (non-leaf)
          if (!child.isLeaf && child.children && child.children.size > 0) {
            branches.push(childPath);

            // Also collect deeper branches if they're reasonably short
            if (childPath.split('.').length < 3) {
              collectBranches(child, childPath);
            }
          }
        }
      }
    };

    collectBranches(tree);

    // Sort and limit to most useful branches
    return branches
      .sort()
      .filter((branch) => branch.split('.').length <= 2) // Keep it to reasonable depth
      .slice(0, 8); // Limit to 8 branches max
  }, [resources]);

  if (availableBranches.length === 0) {
    return <div className="text-xs text-gray-500 italic">No branches available in current resource tree</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableBranches.map((path) => (
        <button
          key={path}
          onClick={() => onRootPathChange(path)}
          className={`px-3 py-1 text-xs rounded border ${
            currentRootPath === path
              ? 'bg-blue-100 border-blue-300 text-blue-700'
              : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {path}
        </button>
      ))}
      <button
        onClick={() => onRootPathChange('')}
        className={`px-3 py-1 text-xs rounded border ${
          !currentRootPath
            ? 'bg-blue-100 border-blue-300 text-blue-700'
            : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
        }`}
      >
        Clear
      </button>
    </div>
  );
};

interface ResourcePickerToolProps {
  resources: any; // Using the orchestrator state.resources
  onMessage: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void;
  presentation?: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
}

const ResourcePickerTool: React.FC<ResourcePickerToolProps> = ({
  resources,
  onMessage,
  presentation = 'inline'
}) => {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [useAnnotations, setUseAnnotations] = useState(true);
  const [usePendingResources, setUsePendingResources] = useState(false);

  // Use ResourcePickerOptionsControl state
  const [pickerOptions, setPickerOptions] = useState<PickerTools.IResourcePickerOptions>({
    defaultView: 'tree',
    showViewToggle: true,
    enableSearch: true,
    height: 500
  });

  // Interactive pending resources management
  const [customPendingResources, setCustomPendingResources] = useState<PickerTools.IPendingResource[]>([]);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [newResourceForm, setNewResourceForm] = useState({
    id: '',
    isAbsolute: false
  });

  const handleResourceSelect = useCallback(
    (selection: PickerTools.IResourceSelection) => {
      setSelectedResourceId(selection.resourceId);

      // Enhanced callback with resource data information
      const messageDetails = [
        `ID: ${selection.resourceId || 'none'}`,
        selection.isPending ? `Type: ${selection.pendingType}` : 'Type: existing',
        selection.resourceData ? `Has data: Yes` : 'Has data: No'
      ].join(', ');

      onMessage('info', `Selected resource - ${messageDetails}`);

      // Log the full selection object for debugging
      console.log('Resource selected:', selection);
    },
    [onMessage]
  );

  const handleAddResource = useCallback(() => {
    if (!newResourceForm.id.trim()) {
      onMessage('error', 'Resource ID is required');
      return;
    }

    let finalResourceId = newResourceForm.id.trim();

    // Handle relative vs absolute paths based on explicit toggle
    if (!newResourceForm.isAbsolute && pickerOptions.rootPath) {
      // Relative path - prepend the current root path
      finalResourceId = `${pickerOptions.rootPath}.${finalResourceId}`;
    }

    // Check if resource already exists (either as real resource or pending)
    if (resources?.summary?.resourceIds?.includes(finalResourceId)) {
      onMessage('warning', `Resource "${finalResourceId}" already exists`);
      return;
    }

    if (customPendingResources.some((pr) => pr.id === finalResourceId)) {
      onMessage('warning', `Pending resource "${finalResourceId}" already exists`);
      return;
    }

    // Check if this conflicts with an existing branch node
    // A branch node is any non-leaf node in the tree
    const checkBranchConflict = () => {
      if (!resources?.system?.resourceManager) return false;

      const treeResult = resources.system.resourceManager.getBuiltResourceTree();
      if (treeResult.isFailure()) return false;

      const tree = treeResult.value;

      // Check if finalResourceId matches any branch (non-leaf) node
      const checkNode = (node: any): boolean => {
        if (node.id === finalResourceId && !node.isLeaf) {
          return true; // Conflict - trying to add resource with same ID as a branch
        }
        if (!node.isLeaf && node.children) {
          for (const child of node.children.values()) {
            if (checkNode(child)) return true;
          }
        }
        return false;
      };

      for (const child of tree.children.values()) {
        if (checkNode(child)) return true;
      }

      return false;
    };

    if (checkBranchConflict()) {
      onMessage('error', `Cannot add resource "${finalResourceId}" - a branch with this ID already exists`);
      return;
    }

    // Derive display name from the last segment of the ID
    const displayName = finalResourceId.split('.').pop() || finalResourceId;

    const newResource: PickerTools.IPendingResource = {
      id: finalResourceId,
      type: 'new',
      displayName: displayName,
      resourceData: {
        value: `Sample value for ${displayName}`,
        createdAt: new Date().toISOString(),
        createdBy: 'playground-user',
        type: 'user-created',
        path: finalResourceId
      }
    };

    setCustomPendingResources((prev) => [...prev, newResource]);
    setShowAddResourceModal(false);
    setNewResourceForm({ id: '', isAbsolute: false });
    onMessage('success', `Added new resource: ${finalResourceId}`);
  }, [newResourceForm, pickerOptions.rootPath, resources, customPendingResources, onMessage]);

  const handleRemovePendingResource = useCallback(
    (resourceId: string) => {
      setCustomPendingResources((prev) => prev.filter((pr) => pr.id !== resourceId));
      onMessage('info', `Removed pending resource: ${resourceId}`);
    },
    [onMessage]
  );

  const handleClearAllPendingResources = useCallback(() => {
    setCustomPendingResources([]);
    onMessage('info', 'Cleared all pending resources');
  }, [onMessage]);

  // Sample annotations for demo
  const resourceAnnotations: PickerTools.IResourceAnnotations = useAnnotations
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
        },
        // Annotations for pending resources
        'new-feature-config': {
          badge: { text: 'NEW', variant: 'new' },
          suffix: '(unsaved)'
        },
        'updated-dashboard': {
          badge: { text: 'EDITED', variant: 'edited' },
          indicator: { type: 'dot', value: '●', tooltip: 'Has pending changes' }
        },
        'strings.common.greeting': {
          badge: { text: 'MODIFIED', variant: 'edited' }
        },
        'app.ui.new-component': {
          badge: { text: 'NEW', variant: 'new' },
          suffix: '(created)'
        }
      }
    : {};

  // Sample pending resources for demo with resource data
  const demoPendingResources: PickerTools.IPendingResource[] = usePendingResources
    ? [
        {
          id: 'strings.new-feature-config',
          type: 'new',
          displayName: 'new-feature-config (unsaved)',
          resourceData: {
            value: 'New Feature Configuration',
            description: 'Configuration for the upcoming feature release',
            priority: 'high'
          }
        },
        {
          id: 'updated-dashboard',
          type: 'modified',
          displayName: 'Updated Dashboard (pending changes)',
          resourceData: {
            value: 'Dashboard - Now with enhanced analytics',
            originalValue: 'Dashboard',
            modifiedAt: new Date().toISOString(),
            changes: ['Added analytics', 'Updated layout']
          }
        },
        {
          id: 'strings.common.greeting',
          type: 'modified',
          displayName: 'greeting (edited)',
          resourceData: {
            value: 'Hello, welcome to our enhanced app!',
            originalValue: 'Hello, welcome!',
            modifiedBy: 'demo-user'
          }
        },
        {
          id: 'app.ui.new-component',
          type: 'new',
          displayName: 'new-component (created)',
          resourceData: {
            componentType: 'React.FC',
            props: ['title', 'onAction'],
            status: 'draft'
          }
        }
      ]
    : [];

  // Combine demo and custom pending resources
  const allPendingResources = [...demoPendingResources, ...customPendingResources];

  // Check if we have processed resources
  const hasResources = resources && resources.compiledCollection;
  const resourceCount = hasResources ? Object.keys(resources.compiledCollection.resources || {}).length : 0;

  // Pass resources through without transformation
  const resourcesForPicker = React.useMemo(() => {
    return hasResources ? resources : null;
  }, [hasResources, resources]);

  // Debug: Log resource structure to understand the tree issue
  React.useEffect(() => {
    if (hasResources) {
      console.log('ResourcePicker Debug - resourceIds:', resources.summary?.resourceIds?.slice(0, 10));
    }
  }, [hasResources, resources]);

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
          <p className="text-gray-600">
            Interactive ResourcePicker component
            {hasResources ? ` with ${resourceCount} loaded resources` : ' demo and testing environment'}.
          </p>
          {!hasResources && (
            <p className="text-sm text-amber-600 mt-1">
              💡 Load configuration and resources to test with real data, or use the picker in empty state
              mode.
            </p>
          )}
        </div>

        {/* Configuration Panel - Use ResourcePickerOptionsControl */}
        <PickerTools.ResourcePickerOptionsControl
          options={pickerOptions}
          onOptionsChange={setPickerOptions}
          presentation={presentation}
          title="Component Configuration"
          showAdvanced={true}
        />

        {/* Additional Demo Controls */}
        {(presentation === 'inline' || presentation === 'collapsible') && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Demo Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={useAnnotations}
                    onChange={(e) => setUseAnnotations(e.target.checked)}
                    className="mr-2 rounded"
                  />
                  Show Resource Annotations
                </label>
                <p className="text-xs text-gray-500 mt-1">Display badges and indicators on resources</p>
              </div>
              <div>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={usePendingResources}
                    onChange={(e) => setUsePendingResources(e.target.checked)}
                    className="mr-2 rounded"
                  />
                  Show Demo Pending Resources
                </label>
                <p className="text-xs text-gray-500 mt-1">Include sample pending/modified resources</p>
              </div>
            </div>
          </div>
        )}

        {/* Demo Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resource Picker */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">ResourcePicker Component</h2>
              <div className="border border-gray-200 rounded-lg">
                <PickerTools.ResourcePicker
                  resources={resourcesForPicker}
                  selectedResourceId={selectedResourceId}
                  onResourceSelect={handleResourceSelect}
                  resourceAnnotations={resourceAnnotations}
                  pendingResources={allPendingResources}
                  options={pickerOptions}
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
                        ...pickerOptions,
                        features: {
                          hasAnnotations: useAnnotations,
                          hasPendingResources: usePendingResources,
                          customPendingCount: customPendingResources.length
                        }
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

      {/* Add Resource Modal */}
      {showAddResourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Resource</h3>

            <div className="space-y-4">
              {pickerOptions.rootPath && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Path Type</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!newResourceForm.isAbsolute}
                        onChange={() => setNewResourceForm((prev) => ({ ...prev, isAbsolute: false }))}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        Relative to{' '}
                        <span className="font-mono bg-gray-100 px-1 rounded">{pickerOptions.rootPath}</span>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newResourceForm.isAbsolute}
                        onChange={() => setNewResourceForm((prev) => ({ ...prev, isAbsolute: true }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Absolute path</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID *</label>
                <input
                  type="text"
                  value={newResourceForm.id}
                  onChange={(e) => setNewResourceForm((prev) => ({ ...prev, id: e.target.value }))}
                  placeholder={
                    !pickerOptions.rootPath || newResourceForm.isAbsolute
                      ? 'e.g., strings.common.my-resource'
                      : 'e.g., my-resource'
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {pickerOptions.rootPath && !newResourceForm.isAbsolute && (
                  <p className="text-xs text-gray-600 mt-1">
                    Will create:{' '}
                    <span className="font-mono">
                      {pickerOptions.rootPath}.{newResourceForm.id || '...'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddResourceModal(false);
                  setNewResourceForm({ id: '', isAbsolute: false });
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddResource}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcePickerTool;
