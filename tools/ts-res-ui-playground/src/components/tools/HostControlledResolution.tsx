import React, { useState, useMemo } from 'react';
import { ResolutionView, ResolutionContextOptions } from '@fgv/ts-res-ui-components';
import { OrchestratorState, OrchestratorActions } from '@fgv/ts-res-ui-components';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface HostControlledResolutionProps {
  state: OrchestratorState;
  actions: OrchestratorActions;
}

/**
 * Component for testing ResolutionView with host-controlled qualifier values.
 * This demonstrates how a host application can control qualifier values programmatically
 * while optionally hiding the UI controls from the user.
 */
const HostControlledResolution: React.FC<HostControlledResolutionProps> = ({ state, actions }) => {
  // Host-controlled values that are applied
  const [appliedHostValues, setAppliedHostValues] = useState<Record<string, string | undefined>>({
    language: 'en-US',
    platform: 'web'
  });

  // Pending host values (being edited)
  const [pendingHostValues, setPendingHostValues] = useState<Record<string, string | undefined>>({
    language: 'en-US',
    platform: 'web'
  });

  // Debug logging
  React.useEffect(() => {
    console.log('HostControlledResolution - appliedHostValues:', appliedHostValues);
  }, [appliedHostValues]);

  // UI visibility options
  const [hideControls, setHideControls] = useState(false);
  const [hideSpecificQualifiers, setHideSpecificQualifiers] = useState<string[]>([]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Get available qualifiers from resources or configuration
  const availableQualifiers = useMemo(() => {
    return (
      state.resources?.compiledCollection.qualifiers?.map((q: any) => q.name) ||
      state.configuration?.qualifiers?.map((q) => q.name) ||
      []
    );
  }, [state.resources, state.configuration]);

  // Build context options with host-controlled values
  const contextOptions = useMemo<ResolutionContextOptions>(() => {
    console.log('Building contextOptions with appliedHostValues:', appliedHostValues);
    const options: ResolutionContextOptions = {
      showContextControls: !hideControls,
      hostManagedValues: appliedHostValues,
      qualifierOptions: {}
    };

    // Configure visibility for specific qualifiers
    hideSpecificQualifiers.forEach((qualifierName) => {
      if (!options.qualifierOptions) options.qualifierOptions = {};
      options.qualifierOptions[qualifierName] = {
        visible: false
      };
    });

    console.log('Final contextOptions:', options);
    return options;
  }, [appliedHostValues, hideControls, hideSpecificQualifiers]);

  // Apply pending host values
  const applyHostValues = () => {
    console.log('Applying host values:', pendingHostValues);
    setAppliedHostValues({ ...pendingHostValues });
  };

  return (
    <div className="flex h-full">
      {/* Left Panel: Host Controls */}
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
          <h2 className="text-xl font-bold text-gray-900 mb-6">Host Controls</h2>

          <div className="space-y-6">
            {/* Host-Managed Values Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Host-Managed Values</h3>
              <p className="text-sm text-gray-600 mb-4">
                These values are controlled by the host and automatically applied to the resolution context.
              </p>

              <div className="space-y-3">
                {availableQualifiers.map((qualifierName) => (
                  <div key={qualifierName}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{qualifierName}</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={pendingHostValues[qualifierName] || ''}
                        onChange={(e) => {
                          const value = e.target.value || undefined;
                          setPendingHostValues((prev) => ({
                            ...prev,
                            [qualifierName]: value
                          }));
                        }}
                        placeholder={`Host-controlled ${qualifierName}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          setPendingHostValues((prev) => {
                            const newValues = { ...prev };
                            delete newValues[qualifierName];
                            return newValues;
                          });
                        }}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ))}

                {/* Apply button for host values */}
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={applyHostValues}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Apply Host Values
                  </button>
                </div>
              </div>
            </div>

            {/* UI Visibility Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">UI Visibility</h3>

              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hideControls}
                    onChange={(e) => setHideControls(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Hide all context controls</span>
                </label>

                {!hideControls && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Hide specific qualifiers:</p>
                    <div className="space-y-2">
                      {availableQualifiers.map((qualifierName) => (
                        <label key={qualifierName} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={hideSpecificQualifiers.includes(qualifierName)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setHideSpecificQualifiers((prev) => [...prev, qualifierName]);
                              } else {
                                setHideSpecificQualifiers((prev) => prev.filter((q) => q !== qualifierName));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Hide {qualifierName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Display */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Applied Host Values</h3>
              <div className="text-sm text-blue-800 font-mono">
                {Object.entries(appliedHostValues).length > 0 ? (
                  <pre>{JSON.stringify(appliedHostValues, null, 2)}</pre>
                ) : (
                  <span className="text-blue-600 italic">No host values applied</span>
                )}
              </div>
              {JSON.stringify(pendingHostValues) !== JSON.stringify(appliedHostValues) && (
                <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                  Pending changes - click "Apply Host Values" to apply
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
              <h3 className="text-sm font-semibold text-yellow-900 mb-2">How This Works</h3>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>Host values are automatically applied to the resolution context</li>
                <li>Users cannot modify host-controlled values in the UI</li>
                <li>Hidden controls still apply their host values</li>
                <li>Changes to host values are applied immediately</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: ResolutionView */}
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
            discardEdits: actions.discardResourceEdits
          }}
          availableQualifiers={availableQualifiers}
          contextOptions={contextOptions}
        />
      </div>
    </div>
  );
};

export default HostControlledResolution;
