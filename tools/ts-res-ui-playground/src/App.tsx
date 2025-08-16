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
  OrchestratorState,
  OrchestratorActions
} from '@fgv/ts-res-ui-components';
import NavigationWarningModal from './components/common/NavigationWarningModal';
import ResourcePickerTool from './components/tools/ResourcePickerTool';
import { playgroundResourceEditorFactory } from './components/editors/PlaygroundResourceEditorFactory';
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
            onMessage={actions.addMessage}
            onImport={(data) => {
              if (Array.isArray(data)) {
                actions.importFiles(data);
              } else {
                actions.importDirectory(data);
              }
            }}
            onBundleImport={actions.importBundle}
            onZipImport={async (zipFile, config) => {
              // Handle ZIP file using BrowserZipFileTreeAccessors to create FileTree
              const { BrowserZipFileTreeAccessors } = await import('./utils/zip/browserZipFileTreeAccessors');
              const { FileTree } = await import('@fgv/ts-utils');

              const zipAccessorsResult = await BrowserZipFileTreeAccessors.fromFile(zipFile);
              if (zipAccessorsResult.isFailure()) {
                actions.addMessage('error', `Failed to read ZIP: ${zipAccessorsResult.message}`);
                return;
              }

              const fileTreeResult = FileTree.FileTree.create(zipAccessorsResult.value);
              if (fileTreeResult.isFailure()) {
                actions.addMessage('error', `Failed to create file tree: ${fileTreeResult.message}`);
                return;
              }

              const fileTree = fileTreeResult.value;

              // First, check for manifest to understand ZIP structure
              let manifestData: any = null;
              let configPath = '/config.json';
              let inputPath = '/input';

              const manifestResult = fileTree.getFile('/manifest.json');
              if (manifestResult.isSuccess()) {
                const manifestFile = manifestResult.value;
                const manifestContent = manifestFile.getRawContents();
                if (manifestContent.isSuccess()) {
                  try {
                    manifestData = JSON.parse(manifestContent.value);
                    actions.addMessage(
                      'info',
                      `Manifest found: created ${new Date(manifestData.timestamp).toLocaleString()}`
                    );

                    // Get actual paths from manifest
                    if (manifestData.config?.archivePath) {
                      // Ensure path starts with /
                      configPath = manifestData.config.archivePath.startsWith('/')
                        ? manifestData.config.archivePath
                        : `/${manifestData.config.archivePath}`;
                      actions.addMessage('info', `Config path from manifest: ${configPath}`);
                    }
                    if (manifestData.input?.archivePath) {
                      // Ensure path starts with /
                      inputPath = manifestData.input.archivePath.startsWith('/')
                        ? manifestData.input.archivePath
                        : `/${manifestData.input.archivePath}`;
                      actions.addMessage('info', `Input path from manifest: ${inputPath}`);
                    }
                  } catch (e) {
                    actions.addMessage('warning', 'Could not parse manifest');
                  }
                }
              }

              // Load configuration FIRST, before processing resources
              let loadedConfig = null;
              const configResult = fileTree.getFile(configPath);
              if (configResult.isSuccess()) {
                const configFile = configResult.value;
                const configContent = configFile.getRawContents();
                if (configContent.isSuccess()) {
                  try {
                    loadedConfig = JSON.parse(configContent.value);
                    // Apply configuration immediately before processing resources
                    await actions.applyConfiguration(loadedConfig);
                    actions.addMessage('success', `Configuration loaded and applied from ${configPath}`);

                    // Add a small delay to ensure configuration is applied
                    await new Promise((resolve) => setTimeout(resolve, 100));
                  } catch (e) {
                    actions.addMessage('error', `Failed to parse configuration from ${configPath}: ${e}`);
                    return;
                  }
                } else {
                  actions.addMessage(
                    'error',
                    `Could not read configuration content: ${configContent.message}`
                  );
                  return;
                }
              } else {
                actions.addMessage(
                  'warning',
                  `No configuration found at ${configPath} - using default configuration`
                );
              }

              // Now process the file tree with the configuration applied
              const { FileTreeConverter } = await import('./utils/fileTreeConverter');

              // Check if input path exists, otherwise try common patterns
              const inputResult = fileTree.getItem(inputPath);
              if (inputResult.isFailure()) {
                actions.addMessage('info', `Input path ${inputPath} not found, checking alternatives...`);

                // Try alternative paths
                const alternatives = ['/resources', '/data', '/'];
                for (const alt of alternatives) {
                  const altResult = fileTree.getItem(alt);
                  if (altResult.isSuccess() && altResult.value.type === 'directory') {
                    inputPath = alt;
                    actions.addMessage('info', `Using alternative path: ${inputPath}`);
                    break;
                  }
                }
              }

              const importedDirResult = FileTreeConverter.convertDirectory(fileTree, inputPath);
              if (importedDirResult.isSuccess()) {
                const dir = importedDirResult.value;

                // Debug: Show what we're actually importing
                let totalFiles = 0;
                const countFiles = (d: any): number => {
                  let count = d.files?.length || 0;
                  if (d.subdirectories) {
                    for (const subdir of d.subdirectories) {
                      count += countFiles(subdir);
                    }
                  }
                  return count;
                };
                totalFiles = countFiles(dir);

                actions.addMessage(
                  'info',
                  `Found ${dir.files.length} files and ${
                    dir.subdirectories?.length || 0
                  } subdirectories in ${inputPath}`
                );
                actions.addMessage('info', `Total files to import: ${totalFiles}`);

                // List first few files for debugging
                if (dir.files.length > 0) {
                  const fileNames = dir.files
                    .slice(0, 3)
                    .map((f) => f.name)
                    .join(', ');
                  actions.addMessage(
                    'info',
                    `Sample files: ${fileNames}${dir.files.length > 3 ? '...' : ''}`
                  );
                }

                // List subdirectories
                if (dir.subdirectories && dir.subdirectories.length > 0) {
                  const dirNames = dir.subdirectories.map((d) => d.name).join(', ');
                  actions.addMessage('info', `Subdirectories: ${dirNames}`);
                }

                // Import with the loaded configuration
                if (loadedConfig) {
                  await actions.importDirectoryWithConfig(dir, loadedConfig);
                } else {
                  await actions.importDirectory(dir);
                }

                // Add a small delay to ensure state updates
                await new Promise((resolve) => setTimeout(resolve, 100));

                actions.addMessage('success', `ZIP contents imported from ${inputPath}`);
              } else {
                actions.addMessage('error', `Failed to process ZIP contents: ${importedDirResult.message}`);
              }
            }}
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
              resetCache: actions.resetResolutionCache,
              // Edit actions
              saveEdit: actions.saveResourceEdit,
              getEditedValue: actions.getEditedValue,
              hasEdit: actions.hasResourceEdit,
              clearEdits: actions.clearResourceEdits,
              applyEdits: actions.applyResourceEdits,
              discardEdits: actions.discardResourceEdits
            }}
            availableQualifiers={
              state.resources?.compiledCollection.qualifiers?.map((q: any) => q.name) ||
              state.configuration?.qualifiers?.map((q) => q.name) ||
              []
            }
            resourceEditorFactory={playgroundResourceEditorFactory}
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

      case 'picker':
        return <ResourcePickerTool resources={state.resources} onMessage={actions.addMessage} />;

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
