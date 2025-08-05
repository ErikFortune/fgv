'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.createFilteredResourceManagerSimple = void 0;
exports.hasFilterValues = hasFilterValues;
exports.getFilterSummary = getFilterSummary;
exports.analyzeFilteredResources = analyzeFilteredResources;
var tslib_1 = require('tslib');
var ts_utils_1 = require('@fgv/ts-utils');
var ts_res_1 = require('@fgv/ts-res');
// Helper function for conditional debug logging
var debugLog = function (enableDebug) {
  var args = [];
  for (var _i = 1; _i < arguments.length; _i++) {
    args[_i - 1] = arguments[_i];
  }
  if (enableDebug) {
    console.log.apply(console, args);
  }
};
/**
 * Check if filter values object has any meaningful values
 */
function hasFilterValues(values) {
  return Object.values(values).some(function (value) {
    return value !== undefined && value !== '';
  });
}
/**
 * Get a summary string of active filter values
 */
function getFilterSummary(values) {
  var activeFilters = Object.entries(values)
    .filter(function (_a) {
      var value = _a[1];
      return value !== undefined && value !== '';
    })
    .map(function (_a) {
      var key = _a[0],
        value = _a[1];
      return ''.concat(key, '=').concat(value);
    });
  return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters';
}
/**
 * Creates a filtered resource manager using the ResourceManagerBuilder.clone() method.
 * This is a simplified implementation that leverages the built-in filtering functionality.
 */
var createFilteredResourceManagerSimple = function (originalSystem_1, partialContext_1) {
  var args_1 = [];
  for (var _i = 2; _i < arguments.length; _i++) {
    args_1[_i - 2] = arguments[_i];
  }
  return tslib_1.__awaiter(
    void 0,
    tslib_1.__spreadArray([originalSystem_1, partialContext_1], args_1, true),
    void 0,
    function (originalSystem, partialContext, options) {
      var enableDebug_1,
        filteredContext,
        cloneResult,
        filteredManager,
        newImportManagerResult,
        newContextQualifierProviderResult,
        newSystem,
        compiledCollectionResult,
        resolverResult,
        resourceIds,
        summary,
        processedResources;
      if (options === void 0) {
        options = { partialContextMatch: true };
      }
      return tslib_1.__generator(this, function (_a) {
        try {
          enableDebug_1 = options.enableDebugLogging === true;
          debugLog(enableDebug_1, '=== SIMPLE FILTER CREATION ===');
          debugLog(enableDebug_1, 'Original system:', originalSystem);
          debugLog(enableDebug_1, 'Partial context:', partialContext);
          // Validate the original system
          if (
            !(originalSystem === null || originalSystem === void 0 ? void 0 : originalSystem.resourceManager)
          ) {
            return [2 /*return*/, (0, ts_utils_1.fail)('Original system or resourceManager is undefined')];
          }
          filteredContext = Object.fromEntries(
            Object.entries(partialContext).filter(function (_a) {
              var value = _a[1];
              return value !== undefined;
            })
          );
          // Use Result pattern chaining as recommended
          debugLog(enableDebug_1, 'Validating context and cloning manager:', filteredContext);
          cloneResult = originalSystem.resourceManager
            .validateContext(filteredContext)
            .onSuccess(function (validatedContext) {
              debugLog(enableDebug_1, 'Context validated, creating clone with context:', validatedContext);
              return originalSystem.resourceManager.clone({
                filterForContext: validatedContext,
                reduceQualifiers: options.reduceQualifiers
              });
            })
            .onFailure(function (error) {
              debugLog(enableDebug_1, 'Failed to validate context or clone:', error);
              return (0, ts_utils_1.fail)(error);
            });
          if (cloneResult.isFailure()) {
            return [
              2 /*return*/,
              (0, ts_utils_1.fail)('Failed to create filtered resource manager: '.concat(cloneResult.message))
            ];
          }
          filteredManager = cloneResult.value;
          debugLog(enableDebug_1, 'Filtered manager created:', filteredManager);
          newImportManagerResult = ts_res_1.Import.ImportManager.create({
            resources: filteredManager
          });
          if (newImportManagerResult.isFailure()) {
            return [
              2 /*return*/,
              (0, ts_utils_1.fail)(
                'Failed to create filtered import manager: '.concat(newImportManagerResult.message)
              )
            ];
          }
          newContextQualifierProviderResult =
            ts_res_1.Runtime.ValidatingSimpleContextQualifierProvider.create({
              qualifiers: originalSystem.qualifiers
            });
          if (newContextQualifierProviderResult.isFailure()) {
            return [
              2 /*return*/,
              (0, ts_utils_1.fail)(
                'Failed to create filtered context provider: '.concat(
                  newContextQualifierProviderResult.message
                )
              )
            ];
          }
          newSystem = {
            qualifierTypes: originalSystem.qualifierTypes,
            qualifiers: originalSystem.qualifiers,
            resourceTypes: originalSystem.resourceTypes,
            resourceManager: filteredManager,
            importManager: newImportManagerResult.value,
            contextQualifierProvider: newContextQualifierProviderResult.value
          };
          compiledCollectionResult = filteredManager.getCompiledResourceCollection({ includeMetadata: true });
          if (compiledCollectionResult.isFailure()) {
            return [
              2 /*return*/,
              (0, ts_utils_1.fail)(
                'Failed to get compiled collection: '.concat(compiledCollectionResult.message)
              )
            ];
          }
          resolverResult = ts_res_1.Runtime.ResourceResolver.create({
            resourceManager: filteredManager,
            qualifierTypes: originalSystem.qualifierTypes,
            contextQualifierProvider: newContextQualifierProviderResult.value
          });
          if (resolverResult.isFailure()) {
            return [
              2 /*return*/,
              (0, ts_utils_1.fail)('Failed to create resolver: '.concat(resolverResult.message))
            ];
          }
          resourceIds = Array.from(filteredManager.resources.keys());
          summary = {
            totalResources: resourceIds.length,
            resourceIds: resourceIds,
            errorCount: 0,
            warnings: []
          };
          processedResources = {
            system: newSystem,
            compiledCollection: compiledCollectionResult.value,
            resolver: resolverResult.value,
            resourceCount: resourceIds.length,
            summary: summary
          };
          debugLog(enableDebug_1, '=== FILTERED PROCESSING COMPLETE ===');
          debugLog(enableDebug_1, 'Filtered resource count:', resourceIds.length);
          debugLog(enableDebug_1, 'Filtered resource IDs:', resourceIds);
          return [2 /*return*/, (0, ts_utils_1.succeed)(processedResources)];
        } catch (error) {
          return [
            2 /*return*/,
            (0, ts_utils_1.fail)(
              'Failed to create filtered resource manager: '.concat(
                error instanceof Error ? error.message : String(error)
              )
            )
          ];
        }
        return [2 /*return*/];
      });
    }
  );
};
exports.createFilteredResourceManagerSimple = createFilteredResourceManagerSimple;
/**
 * Analyze filtered resources compared to original resources
 */
function analyzeFilteredResources(
  originalResourceIds,
  filteredProcessedResources,
  originalProcessedResources
) {
  var filteredResources = [];
  var warnings = [];
  for (var _i = 0, originalResourceIds_1 = originalResourceIds; _i < originalResourceIds_1.length; _i++) {
    var resourceId = originalResourceIds_1[_i];
    // Get original resource info
    var originalResourceResult =
      originalProcessedResources.system.resourceManager.getBuiltResource(resourceId);
    var originalCandidateCount = originalResourceResult.isSuccess()
      ? originalResourceResult.value.candidates.length
      : 0;
    // Get filtered resource info
    var filteredResourceResult =
      filteredProcessedResources.system.resourceManager.getBuiltResource(resourceId);
    var filteredCandidateCount = filteredResourceResult.isSuccess()
      ? filteredResourceResult.value.candidates.length
      : 0;
    var hasWarning = filteredCandidateCount === 0 && originalCandidateCount > 0;
    if (hasWarning) {
      warnings.push('Resource '.concat(resourceId, ' has no matching candidates after filtering'));
    }
    filteredResources.push({
      id: resourceId,
      originalCandidateCount: originalCandidateCount,
      filteredCandidateCount: filteredCandidateCount,
      hasWarning: hasWarning
    });
  }
  return {
    success: true,
    filteredResources: filteredResources,
    processedResources: filteredProcessedResources,
    warnings: warnings
  };
}
//# sourceMappingURL=filterResources.js.map
