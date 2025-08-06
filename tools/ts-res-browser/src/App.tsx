import React, { useCallback, useEffect, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import {
  ImportView,
  SourceView,
  FilterView,
  CompiledView,
  ResolutionView,
  ConfigurationView,
  ZipLoaderView,
  ResourceOrchestrator,
  OrchestratorState,
  OrchestratorActions
} from '@fgv/ts-res-ui-components';
import NavigationWarningModal from './components/common/NavigationWarningModal';
import { useNavigationWarning } from './hooks/useNavigationWarning';
import { useUrlParams } from './hooks/useUrlParams';
import { parseContextFilter } from './utils/urlParams';
import { Tool } from './types/app';
import * as TsRes from '@fgv/ts-res';

// Separate component to handle initialization logic
interface AppContentProps {
  orchestrator: { state: OrchestratorState; actions: OrchestratorActions };
}

const AppContent: React.FC<AppContentProps> = ({ orchestrator }) => {
  const { state, actions } = orchestrator;
  const [selectedTool, setSelectedTool] = useState<Tool>('import');
  const navigationWarning = useNavigationWarning();
  const { urlParams, hasUrlParams } = useUrlParams();

  // Ref to track if we've already initialized from URL parameters
  const initializedFromUrlRef = React.useRef(false);

  // Initialize app state from URL parameters (only run once)
  useEffect(() => {
    if (hasUrlParams && !initializedFromUrlRef.current) {
      initializedFromUrlRef.current = true;

      // Load and apply configuration if provided
      if (urlParams.config) {
        const loadConfiguration = async () => {
          try {
            // Check if it's a predefined configuration name
            const predefinedNames: TsRes.Config.PredefinedSystemConfiguration[] = [
              'default',
              'language-priority',
              'territory-priority',
              'extended-example'
            ];

            if (predefinedNames.includes(urlParams.config as TsRes.Config.PredefinedSystemConfiguration)) {
              // Load predefined configuration
              const configResult = TsRes.Config.getPredefinedDeclaration(
                urlParams.config as TsRes.Config.PredefinedSystemConfiguration
              );

              if (configResult.isSuccess()) {
                actions.updateConfiguration(configResult.value);
                actions.addMessage('success', `Loaded predefined configuration: ${urlParams.config}`);
              } else {
                actions.addMessage(
                  'error',
                  `Failed to load predefined configuration '${urlParams.config}': ${configResult.message}`
                );
              }
            } else {
              // It might be a file path - show a message for now
              actions.addMessage(
                'info',
                `Configuration file specified: ${urlParams.config} (file loading not yet supported)`
              );
            }
          } catch (error) {
            actions.addMessage('error', `Error loading configuration: ${error}`);
          }
        };

        loadConfiguration();
      }

      // Apply context filter if provided
      if (urlParams.contextFilter) {
        try {
          const contextObj = parseContextFilter(urlParams.contextFilter);
          actions.updateFilterState({
            values: contextObj,
            enabled: true,
            appliedValues: contextObj
          });
          actions.addMessage('info', `Applied context filter from URL: ${urlParams.contextFilter}`);
        } catch (error) {
          actions.addMessage('error', `Invalid context filter in URL: ${urlParams.contextFilter}`);
        }
      }

      // Apply reduceQualifiers setting
      if (urlParams.reduceQualifiers) {
        actions.updateFilterState({ reduceQualifiers: true });
      }

      // Handle ZIP loading
      if (urlParams.loadZip) {
        setSelectedTool('zip-loader');
        if (urlParams.zipFile || urlParams.zipPath) {
          actions.addMessage('info', `ZIP archive ready to load: ${urlParams.zipFile || 'Bundle file'}`);
          actions.addMessage('info', 'You can also use the File Browser for other resources');
        } else {
          actions.addMessage('info', 'ZIP loader opened - select a ZIP file to load');
        }
      }

      // Show appropriate messages for other parameters
      if (urlParams.input) {
        actions.addMessage('info', `Ready to load resource file: ${urlParams.input}`);
      }

      if (urlParams.resourceTypes) {
        actions.addMessage('info', `Resource types filter: ${urlParams.resourceTypes}`);
      }

      if (urlParams.maxDistance !== undefined) {
        actions.addMessage('info', `Language matching distance: ${urlParams.maxDistance}`);
      }

      if (urlParams.interactive) {
        actions.addMessage('info', 'Launched in interactive mode - sample data will be loaded');
      }

      // Navigate to appropriate tool based on URL params
      if (urlParams.input) {
        setSelectedTool('import');
      } else if (urlParams.interactive) {
        setSelectedTool('source');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUrlParams, urlParams]);

  // Handle navigation with unsaved changes check
  const handleToolSelect = useCallback(
    (tool: Tool) => {
      // If we're trying to navigate away from configuration and have unsaved changes
      if (selectedTool === 'configuration' && navigationWarning.state.hasUnsavedChanges) {
        navigationWarning.actions.showWarning(tool);
        return;
      }

      // Otherwise, navigate normally
      setSelectedTool(tool);
    },
    [selectedTool, navigationWarning]
  );

  // Handle save and continue from navigation warning
  const handleSaveAndContinue = useCallback(() => {
    // TODO: Implement save functionality through orchestrator
    const pendingTool = navigationWarning.actions.confirmNavigation();
    if (pendingTool) {
      setSelectedTool(pendingTool);
    }
  }, [navigationWarning]);

  // Handle discard changes and continue
  const handleDiscardAndContinue = useCallback(() => {
    const pendingTool = navigationWarning.actions.confirmNavigation();
    if (pendingTool) {
      setSelectedTool(pendingTool);
    }
  }, [navigationWarning]);

  const renderTool = () => {
    switch (selectedTool) {
      case 'import':
        return (
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
        );

      case 'source':
        return (
          <SourceView
            onMessage={actions.addMessage}
            resources={state.resources}
            selectedResourceId={state.selectedResourceId}
            onResourceSelect={actions.selectResource}
            onExport={(data, type) => {
              // TODO: Implement export functionality
              actions.addMessage('info', `Export ${type} requested`);
            }}
          />
        );

      case 'filter':
        return (
          <FilterView
            onMessage={actions.addMessage}
            resources={state.resources}
            filterState={state.filterState}
            filterActions={{
              updateFilterEnabled: (enabled) => actions.updateFilterState({ enabled }),
              updateFilterValues: (values) => actions.updateFilterState({ values }),
              applyFilterValues: () => actions.applyFilter(),
              resetFilterValues: () => actions.resetFilter(),
              updateReduceQualifiers: (reduceQualifiers) => actions.updateFilterState({ reduceQualifiers })
            }}
            filterResult={state.filterResult}
            onFilterResult={(result) => {
              // The orchestrator manages filter results internally
            }}
          />
        );

      case 'compiled':
        return (
          <CompiledView
            onMessage={actions.addMessage}
            resources={state.resources}
            filterState={state.filterState}
            filterResult={state.filterResult}
            useNormalization={true}
            onExport={(data, type) => {
              // TODO: Implement export functionality
              actions.addMessage('info', `Export ${type} requested`);
            }}
          />
        );

      case 'resolution':
        return (
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
              resetCache: actions.resetResolutionCache
            }}
            availableQualifiers={
              state.resources?.compiledCollection.qualifiers?.map((q: any) => q.name) ||
              state.configuration?.qualifiers?.map((q) => q.name) ||
              []
            }
          />
        );

      case 'configuration':
        return (
          <ConfigurationView
            onMessage={actions.addMessage}
            configuration={state.configuration}
            onConfigurationChange={actions.updateConfiguration}
            onSave={(config) => {
              actions.applyConfiguration(config);
              actions.addMessage('success', 'Configuration saved successfully');
            }}
            hasUnsavedChanges={navigationWarning.state.hasUnsavedChanges}
          />
        );

      case 'zip-loader':
        return (
          <ZipLoaderView
            onMessage={actions.addMessage}
            zipFileUrl={urlParams.zipFile}
            zipPath={urlParams.zipPath}
            onLoadComplete={() => {
              // Switch to source browser after successful load
              setSelectedTool('source');
            }}
          />
        );

      default:
        return (
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
        );
    }
  };

  return (
    <>
      <AppLayout
        selectedTool={selectedTool}
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

const App: React.FC = () => {
  return (
    <ResourceOrchestrator>
      {(orchestrator) => <AppContent orchestrator={orchestrator} />}
    </ResourceOrchestrator>
  );
};

export default App;
