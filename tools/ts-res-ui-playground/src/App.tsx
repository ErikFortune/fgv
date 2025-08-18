import React, { useCallback, useEffect, useState } from 'react';
import {
  DocumentTextIcon,
  FunnelIcon,
  CodeBracketIcon,
  MagnifyingGlassIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
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
import ViewWithPresentationSelector, {
  PresentationGearIcon
} from './components/common/ViewWithPresentationSelector';
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

  // Picker options presentation state for each view
  const [pickerPresentation, setPickerPresentation] = useState<{
    source: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
    filter: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
    compiled: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
    resolution: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
    picker: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
  }>({
    source: 'popover',
    filter: 'popover',
    compiled: 'popover',
    resolution: 'popover',
    picker: 'popover'
  });

  // Playground toggle: lock ResolutionView to a specific mode (or keep unlocked)
  const [resolutionLockedMode, setResolutionLockedMode] = useState<
    'none' | 'composed' | 'best' | 'all' | 'raw'
  >('none');

  // Playground toggle: customize section titles
  const [customSectionTitles, setCustomSectionTitles] = useState<{
    resources: string;
    results: string;
  }>({
    resources: 'Resources',
    results: 'Results'
  });

  // Playground context options for FilterView
  const [filterContextOptions, setFilterContextOptions] = useState<{
    showDemo: boolean;
    hostManagedLanguage: string;
    hideTerritory: boolean;
  }>({
    showDemo: false,
    hostManagedLanguage: '',
    hideTerritory: false
  });

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
              // Use ts-res zip-archive packlet for unified ZIP handling
              const { ZipArchive } = await import('@fgv/ts-res');

              const loader = new ZipArchive.ZipArchiveLoader();
              const loadResult = await loader.loadFromFile(zipFile, {
                strictManifestValidation: false // Be lenient with manifests
              });

              if (loadResult.isFailure()) {
                actions.addMessage('error', `Failed to load ZIP: ${loadResult.message}`);
                return;
              }

              const zipData = loadResult.value;

              // Check for manifest (now provided by zip-archive packlet)
              if (zipData.manifest) {
                const manifestData = zipData.manifest;
                actions.addMessage(
                  'info',
                  `Manifest found: created ${new Date(manifestData.timestamp).toLocaleString()}`
                );
              }

              // Load configuration FIRST, before processing resources
              if (zipData.config) {
                // Apply configuration immediately before processing resources
                await actions.applyConfiguration(zipData.config);
                actions.addMessage('success', 'Configuration loaded and applied from ZIP');

                // Add a small delay to ensure configuration is applied
                await new Promise((resolve) => setTimeout(resolve, 100));
              } else {
                actions.addMessage('warning', 'No configuration found in ZIP - using default configuration');
              }

              // Process the ZIP data directly (no need for FileTreeConverter anymore)
              if (zipData.directory) {
                actions.importDirectory(zipData.directory);
                actions.addMessage('success', 'ZIP directory structure imported successfully');
              } else if (zipData.files.length > 0) {
                actions.importFiles(zipData.files);
                actions.addMessage('success', `${zipData.files.length} files imported from ZIP`);
              } else {
                actions.addMessage('error', 'No files or directory structure found in ZIP');
              }
            }}
          />
        );

      case 'source':
        return (
          <div>
            {/* Title with gear icon */}
            <div className="flex items-center space-x-3 p-6 pb-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Source Browser</h2>
              <PresentationGearIcon
                currentPresentation={pickerPresentation.source}
                onPresentationChange={(presentation) =>
                  setPickerPresentation((prev) => ({ ...prev, source: presentation }))
                }
              />
            </div>
            {/* View content - hide original title */}
            <div className="[&>div]:pt-0 [&>div>div:first-child]:hidden">
              <SourceView
                onMessage={actions.addMessage}
                resources={state.resources}
                pickerOptionsPresentation={pickerPresentation.source}
                onExport={(data, type) => {
                  // TODO: Implement export functionality
                  actions.addMessage('info', `Export ${type} requested`);
                }}
              />
            </div>
          </div>
        );

      case 'filter':
        return (
          <div>
            {/* Title with gear icon */}
            <div className="flex items-center space-x-3 p-6 pb-0">
              <FunnelIcon className="h-8 w-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Filter Tool</h2>
              <PresentationGearIcon
                currentPresentation={pickerPresentation.filter}
                onPresentationChange={(presentation) =>
                  setPickerPresentation((prev) => ({ ...prev, filter: presentation }))
                }
              />
            </div>

            {/* Playground Controls */}
            <div className="px-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-800">Context Options Demo</span>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterContextOptions.showDemo}
                      onChange={(e) =>
                        setFilterContextOptions((prev) => ({ ...prev, showDemo: e.target.checked }))
                      }
                      className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="ml-2 text-sm text-yellow-700">Enable</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-yellow-700" htmlFor="host-language">
                      Host language:
                    </label>
                    <input
                      id="host-language"
                      type="text"
                      value={filterContextOptions.hostManagedLanguage}
                      onChange={(e) =>
                        setFilterContextOptions((prev) => ({
                          ...prev,
                          hostManagedLanguage: e.target.value
                        }))
                      }
                      placeholder="e.g., en-US"
                      className="px-2 py-1 text-sm border border-yellow-300 rounded bg-white text-gray-700 w-24"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center text-sm text-yellow-700">
                      <input
                        type="checkbox"
                        checked={filterContextOptions.hideTerritory}
                        onChange={(e) =>
                          setFilterContextOptions((prev) => ({
                            ...prev,
                            hideTerritory: e.target.checked
                          }))
                        }
                        className="mr-2 rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      Hide territory
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* View content - hide original title */}
            <div className="[&>div]:pt-0 [&>div>div:first-child]:hidden">
              <FilterView
                onMessage={actions.addMessage}
                resources={state.resources}
                filterState={state.filterState}
                filterActions={{
                  updateFilterEnabled: (enabled) => actions.updateFilterState({ enabled }),
                  updateFilterValues: (values) => actions.updateFilterState({ values }),
                  applyFilterValues: () => actions.applyFilter(),
                  resetFilterValues: () => actions.resetFilter(),
                  updateReduceQualifiers: (reduceQualifiers) =>
                    actions.updateFilterState({ reduceQualifiers })
                }}
                filterResult={state.filterResult}
                pickerOptionsPresentation={pickerPresentation.filter}
                contextOptions={
                  filterContextOptions.showDemo
                    ? {
                        contextPanelTitle: 'Filter Context (Demo Mode)',
                        globalPlaceholder: 'Filter by {qualifierName}...',
                        qualifierOptions: {
                          territory: {
                            visible: !filterContextOptions.hideTerritory
                          }
                        },
                        hostManagedValues: filterContextOptions.hostManagedLanguage
                          ? {
                              language: filterContextOptions.hostManagedLanguage
                            }
                          : undefined
                      }
                    : undefined
                }
                onFilterResult={(result) => {
                  // The orchestrator manages filter results internally
                }}
              />
            </div>
          </div>
        );

      case 'compiled':
        return (
          <div>
            {/* Title with gear icon */}
            <div className="flex items-center space-x-3 p-6 pb-0">
              <CodeBracketIcon className="h-8 w-8 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Compiled View</h2>
              <PresentationGearIcon
                currentPresentation={pickerPresentation.compiled}
                onPresentationChange={(presentation) =>
                  setPickerPresentation((prev) => ({ ...prev, compiled: presentation }))
                }
              />
            </div>
            {/* View content - hide original title */}
            <div className="[&>div]:pt-0 [&>div>div:first-child]:hidden">
              <CompiledView
                onMessage={actions.addMessage}
                resources={state.resources}
                filterState={state.filterState}
                filterResult={state.filterResult}
                useNormalization={true}
                pickerOptionsPresentation={pickerPresentation.compiled}
                onExport={(data, type) => {
                  // TODO: Implement export functionality
                  actions.addMessage('info', `Export ${type} requested`);
                }}
              />
            </div>
          </div>
        );

      case 'resolution':
        return (
          <div>
            {/* Title with gear icon */}
            <div className="flex items-center space-x-3 p-6 pb-0">
              <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Resolution Viewer</h2>
              <PresentationGearIcon
                currentPresentation={pickerPresentation.resolution}
                onPresentationChange={(presentation) =>
                  setPickerPresentation((prev) => ({ ...prev, resolution: presentation }))
                }
              />
              <div className="ml-auto flex items-center space-x-4">
                {/* Section Titles Configuration */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600" htmlFor="resources-title">
                    Resources:
                  </label>
                  <input
                    id="resources-title"
                    type="text"
                    value={customSectionTitles.resources}
                    onChange={(e) =>
                      setCustomSectionTitles((prev) => ({ ...prev, resources: e.target.value }))
                    }
                    className="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 w-24"
                    placeholder="Resources"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600" htmlFor="results-title">
                    Results:
                  </label>
                  <input
                    id="results-title"
                    type="text"
                    value={customSectionTitles.results}
                    onChange={(e) => setCustomSectionTitles((prev) => ({ ...prev, results: e.target.value }))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700 w-24"
                    placeholder="Results"
                  />
                </div>
                {/* View Mode Lock */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600" htmlFor="locked-view-mode">
                    Lock view:
                  </label>
                  <select
                    id="locked-view-mode"
                    value={resolutionLockedMode}
                    onChange={(e) =>
                      setResolutionLockedMode(e.target.value as 'none' | 'composed' | 'best' | 'all' | 'raw')
                    }
                    className="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700"
                  >
                    <option value="none">Unlocked</option>
                    <option value="composed">Composed</option>
                    <option value="best">Best</option>
                    <option value="all">All</option>
                    <option value="raw">Raw</option>
                  </select>
                </div>
              </div>
            </div>
            {/* View content - hide original title */}
            <div className="[&>div]:pt-0 [&>div>div:first-child]:hidden">
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
                pickerOptionsPresentation={pickerPresentation.resolution}
                lockedViewMode={resolutionLockedMode === 'none' ? undefined : resolutionLockedMode}
                sectionTitles={customSectionTitles}
              />
            </div>
          </div>
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
        return (
          <div>
            {/* Title with gear icon */}
            <div className="flex items-center space-x-3 p-6 pb-0">
              <CubeIcon className="h-8 w-8 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900">Resource Picker</h2>
              <PresentationGearIcon
                currentPresentation={pickerPresentation.picker}
                onPresentationChange={(presentation) =>
                  setPickerPresentation((prev) => ({ ...prev, picker: presentation }))
                }
              />
            </div>
            {/* View content - hide original title */}
            <div className="[&>div]:pt-0 [&>div>div:first-child]:hidden">
              <ResourcePickerTool resources={state.resources} onMessage={actions.addMessage} />
            </div>
          </div>
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
