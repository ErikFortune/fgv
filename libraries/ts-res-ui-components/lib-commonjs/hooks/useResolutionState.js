'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.useResolutionState = useResolutionState;
var tslib_1 = require('tslib');
var react_1 = tslib_1.__importStar(require('react'));
var resolutionUtils_1 = require('../utils/resolutionUtils');
function useResolutionState(processedResources, onMessage) {
  // Get available qualifiers
  var availableQualifiers = (0, react_1.useMemo)(
    function () {
      if (!processedResources) return [];
      return (0, resolutionUtils_1.getAvailableQualifiers)(processedResources);
    },
    [processedResources]
  );
  // Initialize context with all qualifiers undefined
  var defaultContextValues = (0, react_1.useMemo)(
    function () {
      var defaults = {};
      availableQualifiers.forEach(function (qualifierName) {
        defaults[qualifierName] = undefined;
      });
      return defaults;
    },
    [availableQualifiers]
  );
  // Resolution state
  var _a = (0, react_1.useState)({}),
    contextValues = _a[0],
    setContextValues = _a[1];
  var _b = (0, react_1.useState)({}),
    pendingContextValues = _b[0],
    setPendingContextValues = _b[1];
  var _c = (0, react_1.useState)(null),
    selectedResourceId = _c[0],
    setSelectedResourceId = _c[1];
  var _d = (0, react_1.useState)(null),
    currentResolver = _d[0],
    setCurrentResolver = _d[1];
  var _e = (0, react_1.useState)(null),
    resolutionResult = _e[0],
    setResolutionResult = _e[1];
  var _f = (0, react_1.useState)('composed'),
    viewMode = _f[0],
    setViewMode = _f[1];
  // Update context state when defaults change
  react_1.default.useEffect(
    function () {
      setContextValues(defaultContextValues);
      setPendingContextValues(defaultContextValues);
    },
    [defaultContextValues]
  );
  // Check for pending changes
  var hasPendingChanges = (0, react_1.useMemo)(
    function () {
      return (0, resolutionUtils_1.hasPendingContextChanges)(contextValues, pendingContextValues);
    },
    [contextValues, pendingContextValues]
  );
  // Update context value
  var updateContextValue = (0, react_1.useCallback)(function (qualifierName, value) {
    setPendingContextValues(function (prev) {
      var _a;
      return tslib_1.__assign(tslib_1.__assign({}, prev), ((_a = {}), (_a[qualifierName] = value), _a));
    });
  }, []);
  // Apply context changes
  var applyContext = (0, react_1.useCallback)(
    function () {
      if (!processedResources) {
        onMessage === null || onMessage === void 0 ? void 0 : onMessage('error', 'No resources loaded');
        return;
      }
      try {
        // Create resolver with new context
        var resolverResult = (0, resolutionUtils_1.createResolverWithContext)(
          processedResources,
          pendingContextValues,
          { enableCaching: true, enableDebugLogging: false }
        );
        if (resolverResult.isFailure()) {
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('error', 'Failed to create resolver: '.concat(resolverResult.message));
          return;
        }
        // Update state
        setContextValues(tslib_1.__assign({}, pendingContextValues));
        setCurrentResolver(resolverResult.value);
        // If a resource is selected, resolve it with the new context
        if (selectedResourceId) {
          var resolutionResult_1 = (0, resolutionUtils_1.resolveResourceDetailed)(
            resolverResult.value,
            selectedResourceId,
            processedResources
          );
          if (resolutionResult_1.isSuccess()) {
            setResolutionResult(resolutionResult_1.value);
          } else {
            onMessage === null || onMessage === void 0
              ? void 0
              : onMessage('error', 'Failed to resolve resource: '.concat(resolutionResult_1.message));
          }
        }
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage('success', 'Context applied successfully');
      } catch (error) {
        onMessage === null || onMessage === void 0
          ? void 0
          : onMessage(
              'error',
              'Failed to apply context: '.concat(error instanceof Error ? error.message : String(error))
            );
      }
    },
    [processedResources, pendingContextValues, selectedResourceId, onMessage]
  );
  // Select resource and resolve it
  var selectResource = (0, react_1.useCallback)(
    function (resourceId) {
      setSelectedResourceId(resourceId);
      setResolutionResult(null);
      if (currentResolver && processedResources) {
        var resolutionResult_2 = (0, resolutionUtils_1.resolveResourceDetailed)(
          currentResolver,
          resourceId,
          processedResources
        );
        if (resolutionResult_2.isSuccess()) {
          setResolutionResult(resolutionResult_2.value);
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('info', 'Selected resource: '.concat(resourceId));
        } else {
          onMessage === null || onMessage === void 0
            ? void 0
            : onMessage('error', 'Failed to resolve resource: '.concat(resolutionResult_2.message));
        }
      }
    },
    [currentResolver, processedResources, onMessage]
  );
  // Reset cache
  var resetCache = (0, react_1.useCallback)(
    function () {
      if (currentResolver) {
        currentResolver.clearConditionCache();
        onMessage === null || onMessage === void 0 ? void 0 : onMessage('info', 'Cache cleared');
      }
    },
    [currentResolver, onMessage]
  );
  // Auto-apply default context when resources are loaded
  react_1.default.useEffect(
    function () {
      if (processedResources && Object.keys(defaultContextValues).length > 0) {
        applyContext();
      }
    },
    [processedResources, defaultContextValues]
  );
  var state = {
    contextValues: contextValues,
    pendingContextValues: pendingContextValues,
    selectedResourceId: selectedResourceId,
    currentResolver: currentResolver,
    resolutionResult: resolutionResult,
    viewMode: viewMode,
    hasPendingChanges: hasPendingChanges
  };
  var actions = {
    updateContextValue: updateContextValue,
    applyContext: applyContext,
    selectResource: selectResource,
    setViewMode: setViewMode,
    resetCache: resetCache
  };
  return {
    state: state,
    actions: actions,
    availableQualifiers: availableQualifiers
  };
}
//# sourceMappingURL=useResolutionState.js.map
