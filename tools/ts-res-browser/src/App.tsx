import React, { useCallback, useEffect, useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import {
  ImportView,
  SourceView,
  FilterView,
  CompiledView,
  ResolutionView,
  ConfigurationView,
  ResourceOrchestrator,
  IOrchestratorState,
  IOrchestratorActions
} from '@fgv/ts-res-ui-components';
import { FileTree } from '@fgv/ts-json-base';
import { NavigationWarningModal } from '@fgv/ts-res-ui-components';
import { useNavigationWarning } from './hooks/useNavigationWarning';
import { useUrlParams } from '@fgv/ts-res-ui-components';
import { parseContextFilter } from '@fgv/ts-web-extras';
import { Tool } from './types/app';
import * as TsRes from '@fgv/ts-res';

// Separate component to handle initialization logic
interface AppContentProps {
  orchestrator: { state: IOrchestratorState; actions: IOrchestratorActions };
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

      // Handle ZIP loading - redirect to import tool
      if (urlParams.loadZip) {
        setSelectedTool('import');
        if (urlParams.zipFile || urlParams.zipPath) {
          actions.addMessage('info', `ZIP archive ready to load: ${urlParams.zipFile || 'Bundle file'}`);
          actions.addMessage(
            'info',
            'Use the Import tool to select your ZIP file - ZIP files are now automatically detected!'
          );
        } else {
          actions.addMessage(
            'info',
            'Import tool opened - ZIP files are automatically detected when selected'
          );
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
            importError={state.error}
            onImport={async (data: FileTree.FileTree) => {
              await actions.importFileTree(data);
            }}
            onBundleImport={actions.importBundle}
            onZipImport={async (zipData: FileTree.FileTree, config) => {
              // The ImportView has already processed the ZIP file and extracted the data
              // zipData is now a FileTree.FileTree

              // Load configuration FIRST, before processing resources
              if (config) {
                // Apply configuration immediately before processing resources
                await actions.applyConfiguration(config);
                actions.addMessage('success', 'Configuration loaded and applied from ZIP');

                // Add a small delay to ensure configuration is applied
                await new Promise((resolve) => setTimeout(resolve, 100));
              } else {
                actions.addMessage('warning', 'No configuration found in ZIP - using default configuration');
              }

              // Process the ZIP data (now a FileTree)
              await actions.importFileTree(zipData);
              actions.addMessage('success', 'ZIP directory structure imported successfully');
            }}
          />
        );

      case 'source':
        return (
          <SourceView
            resources={state.resources}
            filterState={state.filterState}
            filterResult={state.filterResult}
            selectedResourceId={state.selectedResourceId}
            onResourceSelect={actions.selectResource}
            onExport={(data, type) => {
              switch (type) {
                case 'json':
                  actions.exportSource();
                default:
                  // For any other type, fall back to the generic export
                  actions.addMessage(
                    'warning',
                    `Unknown export type: ${type}. Using source export as fallback.`
                  );
                  actions.exportSource();
              }
            }}
          />
        );

      case 'filter':
        return (
          <FilterView
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
            resources={state.resources}
            filterState={state.filterState}
            filterResult={state.filterResult}
            useNormalization={true}
            onExport={(data, type) => {
              switch (type) {
                case 'bundle':
                  actions.exportBundle();
                  break;
                case 'json':
                  actions.exportCompiled();
                  break;
                default:
                  // For any other type, fall back to the generic export
                  actions.addMessage(
                    'warning',
                    `Unknown export type: ${type}. Using source export as fallback.`
                  );
                  actions.exportSource();
              }
            }}
          />
        );

      case 'resolution':
        return (
          <ResolutionView
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
              // Edit actions
              saveEdit: actions.saveResourceEdit,
              getEditedValue: actions.getEditedValue,
              hasEdit: actions.hasResourceEdit,
              clearEdits: actions.clearResourceEdits,
              discardEdits: actions.discardResourceEdits,
              // Creation + unified apply
              startNewResource: actions.startNewResource,
              updateNewResourceId: actions.updateNewResourceId,
              selectResourceType: actions.selectResourceType,
              saveNewResourceAsPending: actions.saveNewResourceAsPending,
              cancelNewResource: actions.cancelNewResource,
              removePendingResource: actions.removePendingResource,
              markResourceForDeletion: actions.markResourceForDeletion,
              createPendingResource: actions.createPendingResource,
              updateNewResourceJson: actions.updateNewResourceJson,
              applyPendingResources: actions.applyPendingResources,
              discardPendingResources: actions.discardPendingResources
            }}
            availableQualifiers={
              state.resources?.compiledCollection.qualifiers
                ?.map((q) =>
                  typeof q === 'object' && q && 'name' in q && typeof q.name === 'string' ? q.name : ''
                )
                .filter(Boolean) ||
              state.configuration?.qualifiers?.map((q) => q.name) ||
              []
            }
          />
        );

      case 'configuration':
        return (
          <ConfigurationView
            configuration={state.configuration}
            onConfigurationChange={actions.updateConfiguration}
            onSave={(config) => {
              actions.applyConfiguration(config);
              actions.addMessage('success', 'Configuration saved successfully');
            }}
            hasUnsavedChanges={navigationWarning.state.hasUnsavedChanges}
          />
        );

      default:
        return (
          <ImportView
            importError={state.error}
            onImport={async (data: FileTree.FileTree) => {
              await actions.importFileTree(data);
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
