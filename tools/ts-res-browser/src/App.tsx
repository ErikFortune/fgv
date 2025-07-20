import React, { useCallback } from 'react';
import AppLayout from './components/layout/AppLayout';
import ImportTool from './components/tools/ImportTool';
import SourceBrowser from './components/tools/SourceBrowser';
import FilterTool from './components/tools/FilterTool';
import CompiledBrowser from './components/tools/CompiledBrowser';
import ResolutionViewer from './components/tools/ResolutionViewer';
import ConfigurationTool from './components/tools/ConfigurationTool';
import NavigationWarningModal from './components/common/NavigationWarningModal';
import { useAppState } from './hooks/useAppState';
import { useFileImport } from './hooks/useFileImport';
import { useResourceManager } from './hooks/useResourceManager';
import { useNavigationWarning } from './hooks/useNavigationWarning';
import { FilterResult } from './utils/filterResources';
import { Tool } from './types/app';

const App: React.FC = () => {
  const { state, actions } = useAppState();
  const fileImport = useFileImport();
  const resourceManager = useResourceManager();
  const navigationWarning = useNavigationWarning();

  // State to share filter result between components
  const [filterResult, setFilterResult] = React.useState<FilterResult | null>(null);

  // Ref to store the configuration tool's save handler
  const configSaveHandlerRef = React.useRef<(() => void) | null>(null);

  // Handle navigation with unsaved changes check
  const handleToolSelect = useCallback(
    (tool: Tool) => {
      // If we're trying to navigate away from configuration and have unsaved changes
      if (state.selectedTool === 'configuration' && navigationWarning.state.hasUnsavedChanges) {
        navigationWarning.actions.showWarning(tool);
        return;
      }

      // Otherwise, navigate normally
      actions.setSelectedTool(tool);
    },
    [state.selectedTool, navigationWarning, actions]
  );

  // Handle save and continue from navigation warning
  const handleSaveAndContinue = useCallback(() => {
    // Call the configuration tool's save handler if available
    if (configSaveHandlerRef.current) {
      configSaveHandlerRef.current();
    }

    const pendingTool = navigationWarning.actions.confirmNavigation();
    if (pendingTool) {
      actions.setSelectedTool(pendingTool);
    }
  }, [navigationWarning, actions]);

  // Handle discard changes and continue
  const handleDiscardAndContinue = useCallback(() => {
    const pendingTool = navigationWarning.actions.confirmNavigation();
    if (pendingTool) {
      actions.setSelectedTool(pendingTool);
    }
  }, [navigationWarning, actions]);

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
      case 'filter':
        return (
          <FilterTool
            onMessage={actions.addMessage}
            resourceManager={resourceManager}
            filterState={state.filterState}
            filterActions={{
              updateFilterEnabled: actions.updateFilterEnabled,
              updateFilterValues: actions.updateFilterValues,
              applyFilterValues: actions.applyFilterValues,
              resetFilterValues: actions.resetFilterValues,
              updateReduceQualifiers: actions.updateReduceQualifiers
            }}
            onFilterResult={setFilterResult}
          />
        );
      case 'compiled':
        return (
          <CompiledBrowser
            onMessage={actions.addMessage}
            resourceManager={resourceManager}
            filterState={state.filterState}
            filterResult={filterResult}
          />
        );
      case 'resolution':
        return (
          <ResolutionViewer
            onMessage={actions.addMessage}
            resourceManager={resourceManager}
            filterState={state.filterState}
            filterResult={filterResult}
          />
        );
      case 'configuration':
        return (
          <ConfigurationTool
            onMessage={actions.addMessage}
            resourceManager={resourceManager}
            onUnsavedChanges={navigationWarning.actions.setHasUnsavedChanges}
            onSaveHandlerRef={configSaveHandlerRef}
          />
        );
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
    <>
      <AppLayout
        selectedTool={state.selectedTool}
        onToolSelect={handleToolSelect}
        messages={state.messages}
        onClearMessages={actions.clearMessages}
      >
        {renderTool()}
      </AppLayout>

      <NavigationWarningModal
        isOpen={navigationWarning.state.isWarningOpen}
        onCancel={navigationWarning.actions.hideWarning}
        onConfirm={handleDiscardAndContinue}
        onSave={handleSaveAndContinue}
        hasUnsavedChanges={navigationWarning.state.hasUnsavedChanges}
      />
    </>
  );
};

export default App;
