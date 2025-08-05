'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.useResourceData = useResourceData;
var tslib_1 = require('tslib');
var react_1 = require('react');
var ts_utils_1 = require('@fgv/ts-utils');
var tsResIntegration_1 = require('../utils/tsResIntegration');
var initialState = {
  isProcessing: false,
  processedResources: null,
  error: null,
  hasProcessedData: false,
  activeConfiguration: null,
  isLoadedFromBundle: false,
  bundleMetadata: null
};
function useResourceData() {
  var _this = this;
  var _a = (0, react_1.useState)(initialState),
    state = _a[0],
    setState = _a[1];
  var processDirectory = (0, react_1.useCallback)(
    function (directory) {
      return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var result_1;
        return tslib_1.__generator(this, function (_a) {
          setState(function (prev) {
            return tslib_1.__assign(tslib_1.__assign({}, prev), { isProcessing: true, error: null });
          });
          try {
            result_1 = (0, tsResIntegration_1.processImportedDirectory)(
              directory,
              state.activeConfiguration || undefined
            );
            if (result_1.isSuccess()) {
              setState(function (prev) {
                return tslib_1.__assign(tslib_1.__assign({}, prev), {
                  isProcessing: false,
                  processedResources: result_1.value,
                  hasProcessedData: true,
                  isLoadedFromBundle: false,
                  bundleMetadata: null
                });
              });
            } else {
              throw new Error(result_1.message);
            }
          } catch (error) {
            setState(function (prev) {
              return tslib_1.__assign(tslib_1.__assign({}, prev), {
                isProcessing: false,
                error: error instanceof Error ? error.message : String(error)
              });
            });
          }
          return [2 /*return*/];
        });
      });
    },
    [state.activeConfiguration]
  );
  var processFiles = (0, react_1.useCallback)(
    function (files) {
      return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var result_2;
        return tslib_1.__generator(this, function (_a) {
          setState(function (prev) {
            return tslib_1.__assign(tslib_1.__assign({}, prev), { isProcessing: true, error: null });
          });
          try {
            result_2 = (0, tsResIntegration_1.processImportedFiles)(
              files,
              state.activeConfiguration || undefined
            );
            if (result_2.isSuccess()) {
              setState(function (prev) {
                return tslib_1.__assign(tslib_1.__assign({}, prev), {
                  isProcessing: false,
                  processedResources: result_2.value,
                  hasProcessedData: true,
                  isLoadedFromBundle: false,
                  bundleMetadata: null
                });
              });
            } else {
              throw new Error(result_2.message);
            }
          } catch (error) {
            setState(function (prev) {
              return tslib_1.__assign(tslib_1.__assign({}, prev), {
                isProcessing: false,
                error: error instanceof Error ? error.message : String(error)
              });
            });
          }
          return [2 /*return*/];
        });
      });
    },
    [state.activeConfiguration]
  );
  var processBundleFile = (0, react_1.useCallback)(function (bundle) {
    return tslib_1.__awaiter(_this, void 0, void 0, function () {
      return tslib_1.__generator(this, function (_a) {
        setState(function (prev) {
          return tslib_1.__assign(tslib_1.__assign({}, prev), { isProcessing: true, error: null });
        });
        try {
          // For now, bundle processing is simplified - this would need actual bundle loading implementation
          // The working ts-res-browser has more complex bundle loading logic that we'd need to replicate
          throw new Error('Bundle processing not yet implemented in component library');
        } catch (error) {
          setState(function (prev) {
            return tslib_1.__assign(tslib_1.__assign({}, prev), {
              isProcessing: false,
              error: error instanceof Error ? error.message : String(error)
            });
          });
        }
        return [2 /*return*/];
      });
    });
  }, []);
  var clearError = (0, react_1.useCallback)(function () {
    setState(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), { error: null });
    });
  }, []);
  var reset = (0, react_1.useCallback)(function () {
    setState(initialState);
  }, []);
  var resolveResource = (0, react_1.useCallback)(
    function (resourceId, context) {
      return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var resourceResult;
        var _a, _b;
        return tslib_1.__generator(this, function (_c) {
          if (
            !((_b = (_a = state.processedResources) === null || _a === void 0 ? void 0 : _a.system) ===
              null || _b === void 0
              ? void 0
              : _b.resourceManager)
          ) {
            return [2 /*return*/, (0, ts_utils_1.fail)('No resources loaded')];
          }
          try {
            resourceResult = state.processedResources.system.resourceManager.getBuiltResource(resourceId);
            if (resourceResult.isFailure()) {
              return [2 /*return*/, (0, ts_utils_1.fail)('Resource not found: '.concat(resourceId))];
            }
            // For now, return the resource object itself
            // Full resolution with context would require more complex logic
            return [2 /*return*/, (0, ts_utils_1.succeed)(resourceResult.value)];
          } catch (error) {
            return [
              2 /*return*/,
              (0, ts_utils_1.fail)(
                'Failed to resolve resource: '.concat(error instanceof Error ? error.message : String(error))
              )
            ];
          }
          return [2 /*return*/];
        });
      });
    },
    [state.processedResources]
  );
  var applyConfiguration = (0, react_1.useCallback)(function (config) {
    setState(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), { activeConfiguration: config });
    });
  }, []);
  var updateProcessedResources = (0, react_1.useCallback)(function (processedResources) {
    setState(function (prev) {
      return tslib_1.__assign(tslib_1.__assign({}, prev), {
        processedResources: processedResources,
        hasProcessedData: true
      });
    });
  }, []);
  return {
    state: state,
    actions: {
      processDirectory: processDirectory,
      processFiles: processFiles,
      processBundleFile: processBundleFile,
      clearError: clearError,
      reset: reset,
      resolveResource: resolveResource,
      applyConfiguration: applyConfiguration,
      updateProcessedResources: updateProcessedResources
    }
  };
}
//# sourceMappingURL=useResourceData.js.map
