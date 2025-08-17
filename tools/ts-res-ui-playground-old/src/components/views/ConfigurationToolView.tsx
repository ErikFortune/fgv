import React from 'react';
import { ConfigurationView, OrchestratorState, OrchestratorActions } from '@fgv/ts-res-ui-components';

interface ConfigurationToolViewProps {
  orchestrator: { state: OrchestratorState; actions: OrchestratorActions };
}

const ConfigurationToolView: React.FC<ConfigurationToolViewProps> = ({ orchestrator }) => {
  const { state, actions } = orchestrator;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Configuration</h1>
          <p className="text-gray-600 mt-2">
            Select a predefined configuration to set up qualifier types, qualifiers, and resource types for
            the ts-res system.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <ConfigurationView
            onMessage={actions.addMessage}
            configuration={state.configuration}
            onConfigurationChange={actions.updateConfiguration}
            onSave={(config) => {
              actions.applyConfiguration(config);
              actions.addMessage('success', 'Configuration saved successfully');
            }}
            hasUnsavedChanges={false}
            showBundles={false}
            predefinedConfigurations={[
              'default',
              'extended-example',
              'language-priority',
              'territory-priority'
            ]}
            defaultConfiguration="extended-example"
          />
        </div>
      </div>
    </div>
  );
};

export default ConfigurationToolView;
