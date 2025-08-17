import React from 'react';
import { ImportView, OrchestratorState, OrchestratorActions } from '@fgv/ts-res-ui-components';

interface ImportToolViewProps {
  orchestrator: { state: OrchestratorState; actions: OrchestratorActions };
}

const ImportToolView: React.FC<ImportToolViewProps> = ({ orchestrator }) => {
  const { state, actions } = orchestrator;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Import Resources</h1>
          <p className="text-gray-600 mt-2">
            Import resource files, directories, bundles, and ZIP archives to load resources into the system.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <ImportView
            onMessage={actions.addMessage}
            onImport={(data) => {
              if (Array.isArray(data)) {
                actions.importFiles(data);
              } else {
                actions.importDirectory(data);
              }
            }}
            onBundleImport={actions.importBundle}
          />
        </div>
      </div>
    </div>
  );
};

export default ImportToolView;
