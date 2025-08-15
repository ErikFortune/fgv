import React, { useState, useCallback } from 'react';
import AppLayout from './components/layout/AppLayout';
import ConfigurationToolView from './components/views/ConfigurationToolView';
import ImportToolView from './components/views/ImportToolView';
import ResourcePickerToolView from './components/views/ResourcePickerToolView';
import { Tool } from './types/app';
import { ResourceOrchestrator, OrchestratorState, OrchestratorActions } from '@fgv/ts-res-ui-components';

// Separate component to handle the app content with orchestrator
interface AppContentProps {
  orchestrator: { state: OrchestratorState; actions: OrchestratorActions };
}

const AppContent: React.FC<AppContentProps> = ({ orchestrator }) => {
  const { state, actions } = orchestrator;
  const [selectedTool, setSelectedTool] = useState<Tool>('configuration');

  const handleToolSelect = useCallback(
    (tool: Tool) => {
      setSelectedTool(tool);
      actions.addMessage('info', `Switched to ${tool} tool`);
    },
    [actions]
  );

  const renderCurrentTool = () => {
    switch (selectedTool) {
      case 'configuration':
        return <ConfigurationToolView orchestrator={orchestrator} />;
      case 'import':
        return <ImportToolView orchestrator={orchestrator} />;
      case 'picker':
        return <ResourcePickerToolView resources={state.resources} onMessage={actions.addMessage} />;
      default:
        return null;
    }
  };

  return (
    <AppLayout
      selectedTool={selectedTool}
      onToolSelect={handleToolSelect}
      messages={state.messages}
      onClearMessages={actions.clearMessages}
    >
      {renderCurrentTool()}
    </AppLayout>
  );
};

const App: React.FC = () => {
  return (
    <ResourceOrchestrator>
      {(orchestrator) => <AppContent orchestrator={orchestrator} />}
    </ResourceOrchestrator>
  );
};

export default App;
