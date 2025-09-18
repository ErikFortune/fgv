import React, { useCallback, useEffect, useState } from 'react';
import {
  DocumentTextIcon,
  FunnelIcon,
  CodeBracketIcon,
  MagnifyingGlassIcon,
  CubeIcon,
  TableCellsIcon,
  Squares2X2Icon
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
  IOrchestratorState,
  IOrchestratorActions,
  GridTools,
  ObservabilityTools
} from '@fgv/ts-res-ui-components';
import NavigationWarningModal from './components/common/NavigationWarningModal';
import ResourcePickerTool from './components/tools/ResourcePickerTool';
import { playgroundResourceEditorFactory } from './utils/resourceEditorFactory';
// Unified tool: HostControlledResolution and ResourceCreationTest functionality
// will be merged into the main Resolution Viewer via mode and panels
import ViewWithPresentationSelector, {
  PresentationGearIcon
} from './components/common/ViewWithPresentationSelector';
import { useNavigationWarning } from './hooks/useNavigationWarning';
import { useUrlParams } from './hooks/useUrlParams';
import { parseContextFilter } from '@fgv/ts-web-extras';
import { Tool } from './types/app';
import * as TsRes from '@fgv/ts-res';
import { ContrastQualifierType } from './factories/ContrastQualifierType';
import { allGridConfigurations, multiGridConfigurations } from './utils/gridConfigurations';
import { createObservableContrastFactory } from './factories';

/**
 * Discriminated union type that combines built-in system qualifier types
 * with custom playground qualifier types. This allows the playground to use
 * type discrimination for both built-in types (language, territory, literal)
 * and custom types (contrast) in a type-safe manner.
 */
type PlaygroundQualifierType = TsRes.QualifierTypes.SystemQualifierType | ContrastQualifierType;
import {
  createPlaygroundObservabilityContext,
  logImportStage,
  logConfigurationProcessing
} from './utils/observability';

// Separate component to handle initialization logic
interface AppContentProps {
  orchestrator: { state: IOrchestratorState; actions: IOrchestratorActions };
}

const AppContent: React.FC<AppContentProps> = ({ orchestrator }) => {
  const { state, actions } = orchestrator;

  // Use observability context from orchestrator actions
  const { o11y } = actions;
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
    grid: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
    multiGrid: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
  }>({
    source: 'popover',
    filter: 'popover',
    compiled: 'popover',
    resolution: 'popover',
    picker: 'popover',
    grid: 'popover',
    multiGrid: 'popover'
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

  // Host-controlled qualifiers for ResolutionView
  const [hostControlledQualifiers, setHostControlledQualifiers] = useState<{
    enabled: boolean;
    values: Record<string, string | undefined>;
  }>({
    enabled: false,
    values: {}
  });

  // Factory options for demonstrating custom types
  const [factoryOptions, setFactoryOptions] = useState<{
    useCustomFactories: boolean;
    customQualifierType: string;
    customResourceType: string;
  }>({
    useCustomFactories: false,
    customQualifierType: '',
    customResourceType: ''
  });

  // Grid configuration selection
  const [selectedGridConfig, setSelectedGridConfig] = useState<string>('app-config');
  const [selectedMultiGridTabs, setSelectedMultiGridTabs] = useState<'tabs' | 'cards'>('tabs');

  // Memoize resolution actions to prevent re-renders in GridView
  const resolutionActions = React.useMemo(
    () => ({
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
      // Resource creation actions
      startNewResource: actions.startNewResource,
      updateNewResourceId: actions.updateNewResourceId,
      selectResourceType: actions.selectResourceType,
      saveNewResourceAsPending: actions.saveNewResourceAsPending,
      cancelNewResource: actions.cancelNewResource,
      removePendingResource: actions.removePendingResource,
      markResourceForDeletion: actions.markResourceForDeletion,
      applyPendingResources: actions.applyPendingResources,
      discardPendingResources: actions.discardPendingResources,
      // Missing actions that are required by IResolutionActions
      createPendingResource: actions.createPendingResource,
      updateNewResourceJson: actions.updateNewResourceJson
    }),
    [actions]
  );

  // Memoize available qualifiers to prevent re-renders
  const availableQualifiers = React.useMemo(
    () =>
      state.resources?.compiledCollection.qualifiers?.map((q: any) => q.name) ||
      state.configuration?.qualifiers?.map((q) => q.name) ||
      [],
    [state.resources, state.configuration]
  );

  // Memoize selected grid configuration to prevent re-renders
  const selectedGridConfiguration = React.useMemo(
    () =>
      allGridConfigurations.find((config) => config.id === selectedGridConfig) || allGridConfigurations[0],
    [selectedGridConfig]
  );

  // Note: Resource editor factory is configured at the ResourceOrchestrator level and passed to ResolutionView via orchestrator state

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
                logConfigurationProcessing(o11y, configResult.value);
                actions.updateConfiguration(configResult.value);
                actions.addMessage('success', `Loaded predefined configuration: ${urlParams.config}`);
                o11y.diag.info(
                  '[URL_PARAMS] Successfully loaded predefined configuration:',
                  urlParams.config
                );
              } else {
                o11y.diag.error(
                  '[URL_PARAMS] Failed to load predefined configuration:',
                  configResult.message
                );
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

  const renderTool = useCallback(() => {
    switch (selectedTool) {
      case 'import':
        return (
          <ImportView
            importError={state.error}
            onImport={async (data) => {
              logImportStage(o11y, 'start');
              try {
                if (Array.isArray(data)) {
                  logImportStage(o11y, 'resource-load', { fileCount: data.length });
                  await actions.importFiles(data);
                  logImportStage(o11y, 'complete', { filesImported: data.length });
                } else {
                  logImportStage(o11y, 'resource-load', { type: 'directory' });
                  await actions.importDirectory(data);
                  logImportStage(o11y, 'complete', { type: 'directory' });
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logImportStage(o11y, 'error', { error: errorMessage });
              }
            }}
            onBundleImport={actions.importBundle}
            onZipImport={async (zipData, config) => {
              // The ImportView has already processed the ZIP file and extracted the data
              // zipData is either IImportedDirectory or IImportedFile[]

              // Load configuration FIRST, before processing resources
              if (config) {
                logImportStage(o11y, 'config-load', { source: 'ZIP archive' });
                logConfigurationProcessing(o11y, config);

                // Apply configuration immediately before processing resources
                logImportStage(o11y, 'config-apply');
                await actions.applyConfiguration(config);
                actions.addMessage('success', 'Configuration loaded and applied from ZIP');
                o11y.diag.info('[ZIP_IMPORT] Configuration applied successfully');

                // Add a small delay to ensure configuration is applied
                await new Promise((resolve) => setTimeout(resolve, 100));
              } else {
                o11y.diag.warn('[ZIP_IMPORT] No configuration found in ZIP - using default configuration');
                actions.addMessage('warning', 'No configuration found in ZIP - using default configuration');
              }

              // Process the ZIP data (already extracted by ImportView)
              if (Array.isArray(zipData)) {
                // It's an array of IImportedFile[]
                actions.importFiles(zipData);
                actions.addMessage('success', `${zipData.length} files imported from ZIP`);
              } else {
                // It's an IImportedDirectory
                actions.importDirectory(zipData);
                actions.addMessage('success', 'ZIP directory structure imported successfully');
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
                resources={state.resources}
                filterState={state.filterState}
                filterResult={state.filterResult}
                pickerOptionsPanelPresentation={pickerPresentation.source}
                onExport={(data, type) => {
                  switch (type) {
                    case 'json':
                      actions.exportSource();
                      break;
                    default:
                      actions.addMessage(
                        'warning',
                        `Unknown export type: ${type}. Using source export as fallback.`
                      );
                      actions.exportSource();
                  }
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
                pickerOptionsPanelPresentation={pickerPresentation.filter}
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
                resources={state.resources}
                filterState={state.filterState}
                filterResult={state.filterResult}
                useNormalization={true}
                pickerOptionsPanelPresentation={pickerPresentation.compiled}
                onExport={(data, type) => {
                  switch (type) {
                    case 'bundle':
                      actions.exportBundle();
                      break;
                    case 'json':
                      actions.exportCompiled();
                      break;
                    default:
                      actions.addMessage(
                        'warning',
                        `Unknown export type: ${type}. Using compiled export as fallback.`
                      );
                      actions.exportCompiled();
                  }
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
                {/* Mode selector */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600" htmlFor="mode-select">
                    Mode:
                  </label>
                  <select
                    id="mode-select"
                    value={
                      hostControlledQualifiers.enabled
                        ? 'host'
                        : resolutionLockedMode === 'none'
                        ? 'edit'
                        : 'edit'
                    }
                    onChange={(e) => {
                      const mode = e.target.value;
                      if (mode === 'host') {
                        setHostControlledQualifiers((prev) => ({ ...prev, enabled: true }));
                      } else {
                        // disable host-controlled to return to user-controlled modes
                        setHostControlledQualifiers((prev) => ({ ...prev, enabled: false }));
                        // For 'create' we just rely on props below to enable creation UI
                      }
                      // Store chosen mode in a data-attr via state if needed (simple approach: reuse sectionTitles state key)
                      // No-op here; rendering below will pass props based on select value
                      (window as any).__resolutionMode = mode;
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700"
                  >
                    <option value="edit">Resolve & Edit</option>
                    <option value="host">Host-controlled</option>
                    <option value="create">Editing & Creation</option>
                  </select>
                </div>
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
              {(() => {
                const mode =
                  (window as any).__resolutionMode || (hostControlledQualifiers.enabled ? 'host' : 'edit');
                const allowCreation = mode === 'create';
                const showPendingInList = mode === 'create';
                return (
                  <ResolutionView
                    resources={state.resources}
                    filterState={state.filterState}
                    filterResult={state.filterResult}
                    resolutionState={state.resolutionState}
                    resolutionActions={resolutionActions}
                    availableQualifiers={availableQualifiers}
                    resourceEditorFactory={state.resourceEditorFactory}
                    pickerOptionsPanelPresentation={pickerPresentation.resolution}
                    lockedViewMode={resolutionLockedMode === 'none' ? undefined : resolutionLockedMode}
                    sectionTitles={customSectionTitles}
                    contextOptions={
                      hostControlledQualifiers.enabled
                        ? {
                            showContextControls: true,
                            hostManagedValues: hostControlledQualifiers.values,
                            qualifierOptions: {},
                            contextPanelTitle: 'Context (Host-controlled)'
                          }
                        : undefined
                    }
                    allowResourceCreation={allowCreation}
                    showPendingResourcesInList={showPendingInList}
                  />
                );
              })()}
            </div>
          </div>
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
            {/* View content */}
            <div className="[&>div]:pt-0">
              <ResourcePickerTool resources={state.resources} presentation={pickerPresentation.picker} />
            </div>
          </div>
        );

      case 'grid':
        // Only render GridView when we have the necessary data to prevent re-render loops
        if (!state.resources || !state.resolutionState) {
          return (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-3 mb-6">
                  <TableCellsIcon className="h-8 w-8 text-emerald-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Grid View</h2>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="text-gray-500">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Grid View...</h3>
                    <p className="text-sm">Please load resources first to use the Grid View.</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div>
            {/* Title with controls */}
            <div className="flex items-center space-x-3 p-6 pb-0">
              <TableCellsIcon className="h-8 w-8 text-emerald-600" />
              <h2 className="text-2xl font-bold text-gray-900">Grid View</h2>
              <PresentationGearIcon
                currentPresentation={pickerPresentation.grid}
                onPresentationChange={(presentation) =>
                  setPickerPresentation((prev) => ({ ...prev, grid: presentation }))
                }
              />
              <div className="ml-auto flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600" htmlFor="grid-config-select">
                    Configuration:
                  </label>
                  <select
                    id="grid-config-select"
                    value={selectedGridConfig}
                    onChange={(e) => setSelectedGridConfig(e.target.value)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700"
                  >
                    {allGridConfigurations.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Configuration description */}
            {selectedGridConfiguration.description && (
              <div className="px-6 pb-4">
                <p className="text-sm text-gray-600">{selectedGridConfiguration.description}</p>
              </div>
            )}

            {/* View content - hide original title */}
            <div className="[&>div]:pt-0 [&>div>div:first-child]:hidden">
              <GridTools.GridView
                gridConfig={selectedGridConfiguration}
                resources={state.resources}
                resolutionState={state.resolutionState}
                resolutionActions={resolutionActions}
                availableQualifiers={availableQualifiers}
                pickerOptionsPanelPresentation={pickerPresentation.grid}
              />
            </div>
          </div>
        );

      case 'multi-grid':
        return (
          <div>
            {/* Title with controls */}
            <div className="flex items-center space-x-3 p-6 pb-0">
              <Squares2X2Icon className="h-8 w-8 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Multi-Grid View</h2>
              <PresentationGearIcon
                currentPresentation={pickerPresentation.multiGrid}
                onPresentationChange={(presentation) =>
                  setPickerPresentation((prev) => ({ ...prev, multiGrid: presentation }))
                }
              />
              <div className="ml-auto flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">Presentation:</label>
                  <select
                    value={selectedMultiGridTabs}
                    onChange={(e) => setSelectedMultiGridTabs(e.target.value as 'tabs' | 'cards')}
                    className="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-gray-700"
                  >
                    <option value="tabs">Tabs</option>
                    <option value="cards">Cards</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="px-6 pb-4">
              <p className="text-sm text-gray-600">
                Administrative workflow demonstrating shared context across multiple grids for territory
                setup.
              </p>
            </div>

            {/* View content - hide original title */}
            <div className="[&>div]:pt-0 [&>div>div:first-child]:hidden">
              <GridTools.MultiGridView
                gridConfigurations={multiGridConfigurations}
                resources={state.resources}
                resolutionState={state.resolutionState}
                resolutionActions={resolutionActions}
                availableQualifiers={availableQualifiers}
                tabsPresentation={selectedMultiGridTabs}
                pickerOptionsPanelPresentation={pickerPresentation.multiGrid}
              />
            </div>
          </div>
        );

      // Removed dedicated tools: unified into Resolution Viewer

      default:
        return (
          <ImportView
            importError={state.error}
            onImport={async (data) => {
              logImportStage(o11y, 'start');
              try {
                if (Array.isArray(data)) {
                  logImportStage(o11y, 'resource-load', { fileCount: data.length });
                  await actions.importFiles(data);
                  logImportStage(o11y, 'complete', { filesImported: data.length });
                } else {
                  logImportStage(o11y, 'resource-load', { type: 'directory' });
                  await actions.importDirectory(data);
                  logImportStage(o11y, 'complete', { type: 'directory' });
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logImportStage(o11y, 'error', { error: errorMessage });
              }
            }}
            onBundleImport={actions.importBundle}
          />
        );
    }
  }, [
    selectedTool,
    state,
    actions,
    o11y,
    pickerPresentation,
    resolutionActions,
    availableQualifiers,
    selectedGridConfiguration,
    resolutionLockedMode,
    customSectionTitles,
    hostControlledQualifiers,
    filterContextOptions,
    navigationWarning,
    selectedMultiGridTabs
  ]);

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
  // Create enhanced observability context with diagnostic logging for factories
  // Note: This is only used for the factory chain, not for UI messages
  const appO11yContext = createPlaygroundObservabilityContext();

  // Create observable custom factory and wrap in GenericQualifierTypeFactory for proper chaining
  const observableContrastFactory = createObservableContrastFactory<PlaygroundQualifierType>(appO11yContext);
  const qualifierTypeFactory = new TsRes.Config.GenericQualifierTypeFactory<PlaygroundQualifierType>([
    observableContrastFactory
  ]);
  const demoResourceTypeFactory = undefined;

  // Log initialization
  appO11yContext.diag.info('[PLAYGROUND] Initializing ts-res-ui-playground with observable factory chain');

  return (
    <ResourceOrchestrator
      qualifierTypeFactory={qualifierTypeFactory}
      resourceTypeFactory={demoResourceTypeFactory}
      resourceEditorFactory={playgroundResourceEditorFactory}
      // DO NOT pass observabilityContext - let ResourceOrchestrator create the default
      // ViewState-connected context so messages appear in the UI
    >
      {(orchestrator) => {
        // Log when orchestrator is ready
        appO11yContext.diag.info('[PLAYGROUND] ResourceOrchestrator initialized and ready');
        return <AppContent orchestrator={orchestrator} />;
      }}
    </ResourceOrchestrator>
  );
};

export default App;
