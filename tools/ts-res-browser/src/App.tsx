import React from 'react';
import AppLayout from './components/layout/AppLayout';
import ImportTool from './components/tools/ImportTool';
import SourceBrowser from './components/tools/SourceBrowser';
import CompiledBrowser from './components/tools/CompiledBrowser';
import ResolutionViewer from './components/tools/ResolutionViewer';
import { useAppState } from './hooks/useAppState';

const App: React.FC = () => {
  const { state, actions } = useAppState();

  const renderTool = () => {
    switch (state.selectedTool) {
      case 'import':
        return <ImportTool onMessage={actions.addMessage} />;
      case 'source':
        return <SourceBrowser />;
      case 'compiled':
        return <CompiledBrowser />;
      case 'resolution':
        return <ResolutionViewer />;
      default:
        return <ImportTool onMessage={actions.addMessage} />;
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
