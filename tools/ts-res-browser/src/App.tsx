import React, { useCallback, useEffect } from 'react';
import AppLayout from './components/layout/AppLayout';
import ImportTool from './components/tools/ImportTool';
import SourceBrowser from './components/tools/SourceBrowser';
import FilterTool from './components/tools/FilterTool';
import CompiledBrowser from './components/tools/CompiledBrowser';
import ResolutionViewer from './components/tools/ResolutionViewer';
import ConfigurationTool from './components/tools/ConfigurationTool';
import ZipLoader from './components/tools/ZipLoader';
import NavigationWarningModal from './components/common/NavigationWarningModal';
import { useAppState } from './hooks/useAppState';
import { useFileImport } from './hooks/useFileImport';
import { useResourceManager } from './hooks/useResourceManager';
import { useNavigationWarning } from './hooks/useNavigationWarning';
import { useUrlParams } from './hooks/useUrlParams';
import { FilterResult } from './utils/filterResources';
import { parseContextFilter } from './utils/urlParams';
import { Tool } from './types/app';
import * as TsRes from '@fgv/ts-res';

const App: React.FC = () => {
  const { state, actions } = useAppState();
  const fileImport = useFileImport();
  const resourceManager = useResourceManager();
  const navigationWarning = useNavigationWarning();
  const { urlParams, hasUrlParams } = useUrlParams();

  // State to share filter result between components
  const [filterResult, setFilterResult] = React.useState<FilterResult | null>(null);

  // Ref to store the configuration tool's save handler
  const configSaveHandlerRef = React.useRef<(() => void) | null>(null);

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
                // Store the declaration directly, not the SystemConfiguration instance
                resourceManager.actions.applyConfiguration(configResult.value);
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
          actions.updateFilterValues(contextObj);
          actions.updateFilterEnabled(true);
          actions.applyFilterValues();
          actions.addMessage('info', `Applied context filter from URL: ${urlParams.contextFilter}`);
        } catch (error) {
          actions.addMessage('error', `Invalid context filter in URL: ${urlParams.contextFilter}`);
        }
      }

      // Apply reduceQualifiers setting
      if (urlParams.reduceQualifiers) {
        actions.updateReduceQualifiers(true);
      }

      // Handle ZIP loading - start with ZIP tool but make other tools easily accessible
      if (urlParams.loadZip) {
        actions.setActiveTool('zip-loader');
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
        // If input is specified, start with import tool
        actions.setSelectedTool('import');
      } else if (urlParams.interactive) {
        // If interactive mode, might want to go straight to source browser with sample data
        actions.setSelectedTool('source');
      }
    }
  }, [hasUrlParams]); // Depend on hasUrlParams to handle async URL param loading; ref prevents duplicate initialization

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
      case 'zip-loader':
        return (
          <ZipLoader
            onMessage={actions.addMessage}
            resourceManager={resourceManager}
            zipFile={urlParams.zipFile}
            zipPath={urlParams.zipPath}
            onLoadComplete={() => {
              // Switch to source browser after successful load
              actions.setSelectedTool('source');
            }}
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
