'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.ResourceOrchestrator = void 0;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var useResourceData_1 = require('../../hooks/useResourceData');
var useFilterState_1 = require('../../hooks/useFilterState');
var useViewState_1 = require('../../hooks/useViewState');
var useResolutionState_1 = require('../../hooks/useResolutionState');
var filterResources_1 = require('../../utils/filterResources');
var ResourceOrchestrator = function (_a) {
  var children = _a.children,
    initialConfiguration = _a.initialConfiguration,
    onStateChange = _a.onStateChange;
  // Core hooks
  var resourceData = (0, useResourceData_1.useResourceData)();
  var filterState = (0, useFilterState_1.useFilterState)();
  var viewState = (0, useViewState_1.useViewState)();
  var resolutionData = (0, useResolutionState_1.useResolutionState)(
    resourceData.state.processedResources,
    viewState.addMessage
  );
  // Local state for filter results
  var _b = (0, react_1.useState)(null),
    filterResult = _b[0],
    setFilterResult = _b[1];
  // Initialize with configuration if provided
  react_1.default.useEffect(
    function () {
      if (initialConfiguration && !resourceData.state.activeConfiguration) {
        resourceData.actions.applyConfiguration(initialConfiguration);
      }
    },
    [initialConfiguration, resourceData.state.activeConfiguration, resourceData.actions]
  );
  // Notify parent of state changes
  react_1.default.useEffect(
    function () {
      if (onStateChange) {
        onStateChange({
          resources: resourceData.state.processedResources,
          configuration: resourceData.state.activeConfiguration,
          filterState: filterState.state,
          filterResult: filterResult,
          selectedResourceId: viewState.selectedResourceId,
          isProcessing: resourceData.state.isProcessing,
          error: resourceData.state.error,
          messages: viewState.messages
        });
      }
    },
    [
      resourceData.state,
      filterState.state,
      filterResult,
      viewState.selectedResourceId,
      viewState.messages,
      onStateChange
    ]
  );
  // Apply filter action with comprehensive filtering logic
  var applyFilter = (0, react_1.useCallback)(
    function () {
      return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var hasAppliedFilterValues,
          system,
          filteredResult,
          result_1,
          originalResources,
          analysis,
          result,
          error_1,
          errorMessage,
          result;
        return tslib_1.__generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              if (!resourceData.state.processedResources || !filterState.state.enabled) {
                setFilterResult(null);
                return [2 /*return*/, null];
              }
              hasAppliedFilterValues = (0, filterResources_1.hasFilterValues)(
                filterState.state.appliedValues
              );
              if (!hasAppliedFilterValues) {
                setFilterResult(null);
                return [2 /*return*/, null];
              }
              _a.label = 1;
            case 1:
              _a.trys.push([1, 3, , 4]);
              system = resourceData.state.processedResources.system;
              viewState.addMessage('info', 'Starting filtering process...');
              return [
                4 /*yield*/,
                (0, filterResources_1.createFilteredResourceManagerSimple)(
                  system,
                  filterState.state.appliedValues,
                  {
                    partialContextMatch: true,
                    enableDebugLogging: false,
                    reduceQualifiers: filterState.state.reduceQualifiers
                  }
                )
              ];
            case 2:
              filteredResult = _a.sent();
              if (filteredResult.isFailure()) {
                result_1 = {
                  success: false,
                  error: 'Filtering failed: '.concat(filteredResult.message)
                };
                setFilterResult(result_1);
                viewState.addMessage('error', 'Filtering failed: '.concat(filteredResult.message));
                return [2 /*return*/, result_1];
              }
              originalResources = resourceData.state.processedResources.summary.resourceIds || [];
              analysis = (0, filterResources_1.analyzeFilteredResources)(
                originalResources,
                filteredResult.value,
                resourceData.state.processedResources
              );
              result = {
                success: true,
                processedResources: analysis.processedResources,
                filteredResources: analysis.filteredResources,
                warnings: analysis.warnings
              };
              setFilterResult(result);
              filterState.actions.applyFilterValues();
              if (analysis.warnings.length > 0) {
                viewState.addMessage(
                  'warning',
                  'Filtering completed with '.concat(analysis.warnings.length, ' warning(s)')
                );
              } else {
                viewState.addMessage(
                  'success',
                  'Filtering completed: '.concat(analysis.filteredResources.length, ' resources')
                );
              }
              return [2 /*return*/, result];
            case 3:
              error_1 = _a.sent();
              errorMessage = error_1 instanceof Error ? error_1.message : String(error_1);
              result = {
                success: false,
                error: errorMessage
              };
              setFilterResult(result);
              viewState.addMessage('error', 'Filtering error: '.concat(errorMessage));
              return [2 /*return*/, result];
            case 4:
              return [2 /*return*/];
          }
        });
      });
    },
    [resourceData.state.processedResources, filterState.state, filterState.actions, viewState]
  );
  // Reset filter action
  var resetFilter = (0, react_1.useCallback)(
    function () {
      setFilterResult(null);
      filterState.actions.resetFilterValues();
      viewState.addMessage('info', 'Filter reset');
    },
    [filterState.actions, viewState]
  );
  // Automatically apply filter when applied filter values change
  react_1.default.useEffect(
    function () {
      if (!resourceData.state.processedResources || !filterState.state.enabled) {
        setFilterResult(null);
        return;
      }
      var hasAppliedFilterValues = (0, filterResources_1.hasFilterValues)(filterState.state.appliedValues);
      if (!hasAppliedFilterValues) {
        setFilterResult(null);
        return;
      }
      // Apply filter automatically when appliedValues change
      applyFilter();
    },
    [
      filterState.state.appliedValues,
      filterState.state.enabled,
      resourceData.state.processedResources,
      applyFilter
    ]
  );
  // Combined state
  var state = (0, react_1.useMemo)(
    function () {
      return {
        resources: resourceData.state.processedResources,
        configuration: resourceData.state.activeConfiguration,
        filterState: filterState.state,
        filterResult: filterResult,
        resolutionState: resolutionData.state,
        selectedResourceId: viewState.selectedResourceId,
        isProcessing: resourceData.state.isProcessing,
        error: resourceData.state.error,
        messages: viewState.messages
      };
    },
    [
      resourceData.state,
      filterState.state,
      filterResult,
      resolutionData.state,
      viewState.selectedResourceId,
      viewState.messages
    ]
  );
  // Combined actions
  var actions = (0, react_1.useMemo)(
    function () {
      return {
        // Resource management
        importDirectory: function (directory) {
          return tslib_1.__awaiter(void 0, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  viewState.addMessage('info', 'Importing directory...');
                  return [4 /*yield*/, resourceData.actions.processDirectory(directory)];
                case 1:
                  _a.sent();
                  if (!resourceData.state.error) {
                    viewState.addMessage('success', 'Directory imported successfully');
                  }
                  return [2 /*return*/];
              }
            });
          });
        },
        importFiles: function (files) {
          return tslib_1.__awaiter(void 0, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  viewState.addMessage('info', 'Importing files...');
                  return [4 /*yield*/, resourceData.actions.processFiles(files)];
                case 1:
                  _a.sent();
                  if (!resourceData.state.error) {
                    viewState.addMessage('success', 'Files imported successfully');
                  }
                  return [2 /*return*/];
              }
            });
          });
        },
        importBundle: function (bundle) {
          return tslib_1.__awaiter(void 0, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  viewState.addMessage('info', 'Importing bundle...');
                  return [4 /*yield*/, resourceData.actions.processBundleFile(bundle)];
                case 1:
                  _a.sent();
                  if (!resourceData.state.error) {
                    viewState.addMessage('success', 'Bundle imported successfully');
                  }
                  return [2 /*return*/];
              }
            });
          });
        },
        clearResources: function () {
          resourceData.actions.reset();
          setFilterResult(null);
          viewState.addMessage('info', 'Resources cleared');
        },
        // Configuration management
        updateConfiguration: function (config) {
          resourceData.actions.applyConfiguration(config);
          viewState.addMessage('info', 'Configuration updated');
        },
        applyConfiguration: function (config) {
          resourceData.actions.applyConfiguration(config);
          viewState.addMessage('success', 'Configuration applied');
        },
        // Filter management
        updateFilterState: function (updates) {
          if (updates.enabled !== undefined) {
            filterState.actions.updateFilterEnabled(updates.enabled);
          }
          if (updates.values !== undefined) {
            filterState.actions.updateFilterValues(updates.values);
          }
          if (updates.reduceQualifiers !== undefined) {
            filterState.actions.updateReduceQualifiers(updates.reduceQualifiers);
          }
        },
        applyFilter: applyFilter,
        resetFilter: resetFilter,
        // Resolution management
        updateResolutionContext: resolutionData.actions.updateContextValue,
        applyResolutionContext: resolutionData.actions.applyContext,
        selectResourceForResolution: resolutionData.actions.selectResource,
        setResolutionViewMode: resolutionData.actions.setViewMode,
        resetResolutionCache: resolutionData.actions.resetCache,
        // UI state management
        selectResource: viewState.selectResource,
        addMessage: viewState.addMessage,
        clearMessages: viewState.clearMessages,
        // Resource resolution
        resolveResource: resourceData.actions.resolveResource
      };
    },
    [resourceData.actions, filterState.actions, resolutionData.actions, viewState, applyFilter, resetFilter]
  );
  return react_1.default.createElement(
    react_1.default.Fragment,
    null,
    children({ state: state, actions: actions })
  );
};
exports.ResourceOrchestrator = ResourceOrchestrator;
exports.default = exports.ResourceOrchestrator;
//# sourceMappingURL=ResourceOrchestrator.js.map
