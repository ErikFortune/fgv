'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.createResolverWithContext = createResolverWithContext;
exports.evaluateConditionsForCandidate = evaluateConditionsForCandidate;
exports.resolveResourceDetailed = resolveResourceDetailed;
exports.getAvailableQualifiers = getAvailableQualifiers;
exports.hasPendingContextChanges = hasPendingContextChanges;
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
 * Create a resolver with context for resource resolution
 */
function createResolverWithContext(processedResources, contextValues, options) {
  if (options === void 0) {
    options = {};
  }
  var enableDebug = options.enableDebugLogging === true;
  debugLog(enableDebug, '=== CREATING RESOLVER WITH CONTEXT ===');
  debugLog(enableDebug, 'Context values:', contextValues);
  try {
    // Create context provider with filtered values (remove undefined)
    var filteredContext = Object.fromEntries(
      Object.entries(contextValues).filter(function (_a) {
        var value = _a[1];
        return value !== undefined;
      })
    );
    var contextProviderResult = ts_res_1.Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers: processedResources.system.qualifiers
    });
    if (contextProviderResult.isFailure()) {
      return (0, ts_utils_1.fail)(
        'Failed to create context provider: '.concat(contextProviderResult.message)
      );
    }
    var contextProvider = contextProviderResult.value;
    // Set context values
    for (var _i = 0, _a = Object.entries(filteredContext); _i < _a.length; _i++) {
      var _b = _a[_i],
        qualifierName = _b[0],
        value = _b[1];
      try {
        contextProvider.set(qualifierName, value);
      } catch (error) {
        return (0, ts_utils_1.fail)(
          'Failed to set context value '
            .concat(qualifierName, '=')
            .concat(value, ': ')
            .concat(error instanceof Error ? error.message : String(error))
        );
      }
    }
    // Create resolver
    var resolverParams = {
      resourceManager: processedResources.system.resourceManager,
      qualifierTypes: processedResources.system.qualifierTypes,
      contextQualifierProvider: contextProvider
    };
    // Add cache metrics listener if caching is enabled
    if (options.enableCaching) {
      var metricsListener = new ts_res_1.Runtime.ResourceResolverCacheMetricsListener(function () {
        return new ts_res_1.Runtime.AggregateCacheMetrics();
      });
      resolverParams.listener = metricsListener;
    }
    var resolverResult = ts_res_1.Runtime.ResourceResolver.create(resolverParams);
    if (resolverResult.isFailure()) {
      return (0, ts_utils_1.fail)('Failed to create resolver: '.concat(resolverResult.message));
    }
    debugLog(enableDebug, 'Resolver created successfully');
    return (0, ts_utils_1.succeed)(resolverResult.value);
  } catch (error) {
    return (0, ts_utils_1.fail)(
      'Failed to create resolver: '.concat(error instanceof Error ? error.message : String(error))
    );
  }
}
/**
 * Evaluate conditions for a specific candidate
 */
function evaluateConditionsForCandidate(resolver, candidateIndex, compiledResource, compiledCollection) {
  var _a;
  try {
    var decision = compiledCollection.decisions[compiledResource.decision];
    if (!decision || !decision.conditionSets || candidateIndex >= decision.conditionSets.length) {
      return [];
    }
    var conditionSetIndex = decision.conditionSets[candidateIndex];
    var conditionSet = compiledCollection.conditionSets[conditionSetIndex];
    if (!conditionSet || !conditionSet.conditions) {
      return [];
    }
    var evaluations = [];
    for (var _i = 0, _b = conditionSet.conditions; _i < _b.length; _i++) {
      var conditionIndex = _b[_i];
      var condition = compiledCollection.conditions[conditionIndex];
      if (!condition) continue;
      var qualifier = compiledCollection.qualifiers[condition.qualifierIndex];
      if (!qualifier) continue;
      // Get the qualifier value from context
      var qualifierValueResult = resolver.contextQualifierProvider.get(qualifier);
      var qualifierValue = qualifierValueResult.isSuccess() ? qualifierValueResult.value : null;
      // Get the cached condition result from resolver (if available)
      var cachedResult =
        (_a = resolver.conditionCache) === null || _a === void 0 ? void 0 : _a[conditionIndex];
      var score = (cachedResult === null || cachedResult === void 0 ? void 0 : cachedResult.score) || 0;
      var matchType =
        (cachedResult === null || cachedResult === void 0 ? void 0 : cachedResult.matchType) || 'noMatch';
      var matched = matchType !== 'noMatch';
      evaluations.push({
        qualifierName: qualifier.name,
        qualifierValue: qualifierValue,
        conditionValue: condition.value,
        operator: condition.operator || 'eq',
        score: score,
        matched: matched,
        matchType: matchType,
        scoreAsDefault: condition.scoreAsDefault,
        conditionIndex: conditionIndex
      });
    }
    return evaluations;
  } catch (error) {
    console.warn('Error evaluating conditions for candidate:', error);
    return [];
  }
}
/**
 * Resolve a resource and create detailed resolution result
 */
function resolveResourceDetailed(resolver, resourceId, processedResources, options) {
  if (options === void 0) {
    options = {};
  }
  var enableDebug = options.enableDebugLogging === true;
  debugLog(enableDebug, '=== RESOLVING RESOURCE ===');
  debugLog(enableDebug, 'Resource ID:', resourceId);
  try {
    // Get the resource
    var resourceResult = processedResources.system.resourceManager.getBuiltResource(resourceId);
    if (resourceResult.isFailure()) {
      return (0, ts_utils_1.succeed)({
        success: false,
        resourceId: resourceId,
        error: 'Failed to get resource: '.concat(resourceResult.message)
      });
    }
    var resource_1 = resourceResult.value;
    var compiledCollection_1 = processedResources.compiledCollection;
    // Find the compiled resource for condition analysis
    var compiledResource_1 = compiledCollection_1.resources.find(function (r) {
      return r.id === resourceId;
    });
    if (!compiledResource_1) {
      return (0, ts_utils_1.succeed)({
        success: false,
        resourceId: resourceId,
        error: 'Failed to find compiled resource'
      });
    }
    // Resolve best candidate
    var bestResult = resolver.resolveResource(resource_1);
    // Resolve all candidates
    var allResult = resolver.resolveAllResourceCandidates(resource_1);
    // Resolve composed value
    var composedResult = resolver.resolveComposedResourceValue(resource_1);
    // Get decision resolution result
    var decisionResult = resolver.resolveDecision(resource_1.decision.baseDecision);
    var decision = decisionResult.isSuccess() ? decisionResult.value : null;
    // Build detailed candidate information
    var candidateDetails_1 = [];
    var matchedCandidates_1 = allResult.isSuccess() ? allResult.value : [];
    // Create lookup sets for regular and default matches
    var regularMatchIndices_1 = new Set(
      (decision === null || decision === void 0 ? void 0 : decision.success) ? decision.instanceIndices : []
    );
    var defaultMatchIndices_1 = new Set(
      (decision === null || decision === void 0 ? void 0 : decision.success)
        ? decision.defaultInstanceIndices
        : []
    );
    // Add matched candidates first
    matchedCandidates_1.forEach(function (matchedCandidate) {
      var index = resource_1.candidates.findIndex(function (candidate) {
        return candidate === matchedCandidate;
      });
      if (index !== -1) {
        var conditionSetKey = 'cs-'.concat(index);
        var conditionEvaluations = evaluateConditionsForCandidate(
          resolver,
          index,
          compiledResource_1,
          compiledCollection_1
        );
        var isDefaultMatch = defaultMatchIndices_1.has(index);
        var isRegularMatch = regularMatchIndices_1.has(index);
        var candidateMatchType = isRegularMatch ? 'match' : isDefaultMatch ? 'matchAsDefault' : 'noMatch';
        candidateDetails_1.push({
          candidate: resource_1.candidates[index],
          conditionSetKey: conditionSetKey,
          candidateIndex: index,
          matched: true,
          matchType: candidateMatchType,
          isDefaultMatch: isDefaultMatch,
          conditionEvaluations: conditionEvaluations
        });
      }
    });
    // Add non-matching candidates
    resource_1.candidates.forEach(function (candidate, index) {
      var isMatched = matchedCandidates_1.some(function (mc) {
        return mc === candidate;
      });
      if (!isMatched) {
        var conditionSetKey = candidate.conditions.toHash();
        var conditionEvaluations = evaluateConditionsForCandidate(
          resolver,
          index,
          compiledResource_1,
          compiledCollection_1
        );
        candidateDetails_1.push({
          candidate: candidate,
          conditionSetKey: conditionSetKey,
          candidateIndex: index,
          matched: false,
          matchType: 'noMatch',
          isDefaultMatch: false,
          conditionEvaluations: conditionEvaluations
        });
      }
    });
    var result = {
      success: true,
      resourceId: resourceId,
      resource: resource_1,
      bestCandidate: bestResult.isSuccess() ? bestResult.value : undefined,
      allCandidates: allResult.isSuccess() ? allResult.value : undefined,
      candidateDetails: candidateDetails_1,
      composedValue: composedResult.isSuccess() ? composedResult.value : undefined,
      error: bestResult.isFailure() ? bestResult.message : undefined
    };
    debugLog(enableDebug, 'Resolution completed successfully');
    return (0, ts_utils_1.succeed)(result);
  } catch (error) {
    return (0, ts_utils_1.succeed)({
      success: false,
      resourceId: resourceId,
      error: 'Resolution error: '.concat(error instanceof Error ? error.message : String(error))
    });
  }
}
/**
 * Get available qualifiers from processed resources
 */
function getAvailableQualifiers(processedResources) {
  if (processedResources.compiledCollection.qualifiers) {
    return processedResources.compiledCollection.qualifiers.map(function (q) {
      return q.name;
    });
  }
  return [];
}
/**
 * Check if context has any pending changes
 */
function hasPendingContextChanges(contextValues, pendingContextValues) {
  return JSON.stringify(contextValues) !== JSON.stringify(pendingContextValues);
}
//# sourceMappingURL=resolutionUtils.js.map
