import React, { useState } from 'react';
import { ResolutionView } from '@fgv/ts-res-ui-components';
import { OrchestratorState, OrchestratorActions } from '@fgv/ts-res-ui-components';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ResourceCreationTestProps {
  state: OrchestratorState;
  actions: OrchestratorActions;
}

/**
 * Test component for the new resource creation feature in ResolutionView.
 * Demonstrates both user-controlled and host-controlled resource type selection.
 */
const ResourceCreationTest: React.FC<ResourceCreationTestProps> = ({ state, actions }) => {
  // Test configuration options
  const [allowCreation, setAllowCreation] = useState(true);
  const [useDefaultType, setUseDefaultType] = useState(false);
  const [defaultType, setDefaultType] = useState('json');
  const [showPendingInList, setShowPendingInList] = useState(true);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Get available qualifiers from resources or configuration
  const availableQualifiers = React.useMemo(() => {
    return (
      state.resources?.compiledCollection.qualifiers?.map((q: any) => q.name) ||
      state.configuration?.qualifiers?.map((q) => q.name) ||
      []
    );
  }, [state.resources, state.configuration]);

  // Get available resource types
  const availableTypes = React.useMemo(() => {
    const types: string[] = [];
    if (state.resources?.system?.resourceTypes) {
      state.resources.system.resourceTypes.forEach((type: any) => {
        types.push(type.key);
      });
    }
    return types;
  }, [state.resources]);

  // Handle when pending resources are applied
  const handlePendingResourcesApplied = (added: any[], deleted: string[]) => {
    console.log('Pending resources applied:', { added, deleted });
    actions.addMessage('success', `Applied ${added.length} additions and ${deleted.length} deletions`);
    // TODO: Actually rebuild the resource manager with the new resources
  };

  return (
    <div className="flex h-full">
      {/* Left Panel: Test Controls */}
      <div
        className={`${
          isPanelCollapsed ? 'w-12' : 'w-96'
        } bg-gray-50 border-r border-gray-200 transition-all duration-300 ease-in-out relative flex-shrink-0`}
      >
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className="absolute -right-3 top-6 z-10 bg-white border border-gray-300 rounded-full p-1 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isPanelCollapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* Panel Content */}
        <div className={`${isPanelCollapsed ? 'hidden' : 'block'} p-6 overflow-y-auto h-full`}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Resource Creation Test</h2>

          <div className="space-y-6">
            {/* Feature Configuration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Configuration</h3>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={allowCreation}
                    onChange={(e) => setAllowCreation(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Allow Resource Creation</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={useDefaultType}
                    onChange={(e) => setUseDefaultType(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Use Default Resource Type (Host-controlled)</span>
                </label>

                {useDefaultType && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Type</label>
                    <select
                      value={defaultType}
                      onChange={(e) => setDefaultType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showPendingInList}
                    onChange={(e) => setShowPendingInList(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show Pending Resources in List</span>
                </label>
              </div>
            </div>

            {/* Test Scenarios */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Test Scenarios</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Click "Add Resource" to create a new resource</li>
                <li>Enter a unique resource ID</li>
                <li>Select a resource type (if not host-controlled)</li>
                <li>Click "Add as Pending" to add to pending list</li>
                <li>Create multiple resources before applying</li>
                <li>Click "Apply Resources" to commit changes</li>
                <li>Test "Discard" to remove all pending changes</li>
              </ul>
            </div>

            {/* Feature Status */}
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">Implementation Status</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>✅ Resource type templates</li>
                <li>✅ Pending resource state management</li>
                <li>✅ UI for creating resources</li>
                <li>✅ Host-controlled type selection</li>
                <li>✅ Apply/Discard workflow</li>
                <li>⚠️ Actual system update (TODO)</li>
                <li>⚠️ Visual distinction for pending (TODO)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: ResolutionView with Resource Creation */}
      <div className="flex-1 overflow-hidden">
        <ResolutionView
          onMessage={actions.addMessage}
          resources={state.resources}
          filterState={state.filterState}
          filterResult={state.filterResult}
          resolutionState={state.resolutionState}
          resolutionActions={{
            updateContextValue: actions.updateResolutionContext,
            applyContext: actions.applyResolutionContext,
            selectResource: actions.selectResourceForResolution,
            setViewMode: actions.setResolutionViewMode,
            resetCache: actions.resetResolutionCache,
            saveEdit: actions.saveResourceEdit,
            getEditedValue: actions.getEditedValue,
            hasEdit: actions.hasResourceEdit,
            clearEdits: actions.clearResourceEdits,
            applyEdits: actions.applyResourceEdits,
            discardEdits: actions.discardResourceEdits,
            // New resource creation actions
            startNewResource: actions.startNewResource,
            updateNewResourceId: actions.updateNewResourceId,
            selectResourceType: actions.selectResourceType,
            saveNewResourceAsPending: actions.saveNewResourceAsPending,
            cancelNewResource: actions.cancelNewResource,
            removePendingResource: actions.removePendingResource,
            markResourceForDeletion: actions.markResourceForDeletion,
            applyPendingResources: actions.applyPendingResources,
            discardPendingResources: actions.discardPendingResources
          }}
          availableQualifiers={availableQualifiers}
          // Resource creation props
          allowResourceCreation={allowCreation}
          defaultResourceType={useDefaultType ? defaultType : undefined}
          onPendingResourcesApplied={handlePendingResourcesApplied}
          showPendingResourcesInList={showPendingInList}
        />
      </div>
    </div>
  );
};

export default ResourceCreationTest;
