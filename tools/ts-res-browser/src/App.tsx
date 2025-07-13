import React from 'react';
import AppLayout from './components/layout/AppLayout';
import ImportTool from './components/tools/ImportTool';
import SourceBrowser from './components/tools/SourceBrowser';
import CompiledBrowser from './components/tools/CompiledBrowser';
import ResolutionViewer from './components/tools/ResolutionViewer';
import { useAppState } from './hooks/useAppState';
import { useFileImport } from './hooks/useFileImport';
import { useResourceManager } from './hooks/useResourceManager';

const App: React.FC = () => {
  const { state, actions } = useAppState();
  const fileImport = useFileImport();
  const resourceManager = useResourceManager();

  const renderTool = () => {
    switch (state.selectedTool) {
      case 'import':
        return (
          <ImportTool
            onMessage={actions.addMessage}
            fileImport={fileImport}
            resourceManager={resourceManager}
          />
        );
      case 'source':
        return <SourceBrowser onMessage={actions.addMessage} resourceManager={resourceManager} />;
      case 'compiled':
        return <CompiledBrowser onMessage={actions.addMessage} resourceManager={resourceManager} />;
      case 'resolution':
        return <ResolutionViewer />;
      default:
        return (
          <ImportTool
            onMessage={actions.addMessage}
            fileImport={fileImport}
            resourceManager={resourceManager}
          />
        );
    }
  };

  return (
    <AppLayout
      selectedTool={state.selectedTool}
      onToolSelect={actions.setSelectedTool}
      messages={state.messages}
      onClearMessages={actions.clearMessages}
    >
      {renderTool()}
    </AppLayout>
  );
};

export default App;
