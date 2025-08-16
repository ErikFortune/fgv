import { Result, succeed, fail, MessageAggregator } from '@fgv/ts-utils';
import { Runtime } from '@fgv/ts-res';
import { ProcessedResources, ResolutionResult, CandidateInfo, ConditionEvaluationResult } from '../types';

/** @public */
export interface ResolutionOptions {
  enableCaching?: boolean;
  enableDebugLogging?: boolean;
}

// Helper function for conditional debug logging
const debugLog = (enableDebug: boolean, ...args: any[]) => {
  if (enableDebug) {
    console.log(...args);
  }
};

/**
 * Create a resolver with context for resource resolution
 */
/** @public */
export function createResolverWithContext(
  processedResources: ProcessedResources,
  contextValues: Record<string, string | undefined>,
  options: ResolutionOptions = {}
): Result<Runtime.ResourceResolver> {
  const enableDebug = options.enableDebugLogging === true;

  debugLog(enableDebug, '=== CREATING RESOLVER WITH CONTEXT ===');
  debugLog(enableDebug, 'Context values:', contextValues);

  // Create context provider with filtered values (remove undefined)
  const filteredContext = Object.fromEntries(
    Object.entries(contextValues).filter(([, value]) => value !== undefined)
  ) as Record<string, string>;

  return Runtime.ValidatingSimpleContextQualifierProvider.create({
    qualifiers: processedResources.system.qualifiers
  })
    .withErrorFormat((e) => `Failed to create context provider: ${e}`)
    .onSuccess((contextProvider) => {
      const errors = new MessageAggregator();
      // Set context values
      for (const [qualifierName, value] of Object.entries(filteredContext)) {
        contextProvider.validating
          .set(qualifierName, value)
          .withErrorFormat((e) => `Failed to set context value ${qualifierName}=${value}: ${e}`)
          .aggregateError(errors);
      }

      if (errors.hasMessages) {
        return fail(`Errors setting context values: ${errors.toString()}`);
      }

      // Create resolver
      const resolverParams: any = {
        resourceManager: processedResources.system.resourceManager,
        qualifierTypes: processedResources.system.qualifierTypes,
        contextQualifierProvider: contextProvider
      };

      // Add cache metrics listener if caching is enabled
      if (options.enableCaching) {
        const metricsListener = new Runtime.ResourceResolverCacheMetricsListener(
          () => new Runtime.AggregateCacheMetrics()
        );
        resolverParams.listener = metricsListener;
      }

      return Runtime.ResourceResolver.create(resolverParams)
        .withErrorFormat((e) => `Failed to create resolver: ${e}`)
        .onSuccess((resolver) => {
          debugLog(enableDebug, 'Resolver created successfully');
          return succeed(resolver);
        });
    });
}

/**
 * Evaluate conditions for a specific candidate
 */
/** @public */
export function evaluateConditionsForCandidate(
  resolver: Runtime.ResourceResolver,
  candidateIndex: number,
  compiledResource: any,
  compiledCollection: any
): ConditionEvaluationResult[] {
  try {
    const decision = compiledCollection.decisions[compiledResource.decision];
    if (!decision || !decision.conditionSets || candidateIndex >= decision.conditionSets.length) {
      return [];
    }

    const conditionSetIndex = decision.conditionSets[candidateIndex];
    const conditionSet = compiledCollection.conditionSets[conditionSetIndex];
    if (!conditionSet || !conditionSet.conditions) {
      return [];
    }

    const evaluations: ConditionEvaluationResult[] = [];

    for (const conditionIndex of conditionSet.conditions) {
      const condition = compiledCollection.conditions[conditionIndex];
      if (!condition) continue;

      const qualifier = compiledCollection.qualifiers[condition.qualifierIndex];
      if (!qualifier) continue;

      // Get the qualifier value from context
      const qualifierValueResult = resolver.contextQualifierProvider.get(qualifier);
      const qualifierValue = qualifierValueResult.orDefault();

      // Get the cached condition result from resolver (if available)
      const cachedResult = resolver.conditionCache?.[conditionIndex];
      const score = cachedResult?.score || 0;
      const matchType = cachedResult?.matchType || 'noMatch';
      const matched = matchType !== 'noMatch';

      evaluations.push({
        qualifierName: qualifier.name,
        qualifierValue,
        conditionValue: condition.value,
        operator: condition.operator || 'matches',
        score,
        matched,
        matchType,
        scoreAsDefault: condition.scoreAsDefault,
        conditionIndex
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
/** @public */
export function resolveResourceDetailed(
  resolver: Runtime.ResourceResolver,
  resourceId: string,
  processedResources: ProcessedResources,
  options: ResolutionOptions = {}
): Result<ResolutionResult> {
  const enableDebug = options.enableDebugLogging === true;

  debugLog(enableDebug, '=== RESOLVING RESOURCE ===');
  debugLog(enableDebug, 'Resource ID:', resourceId);

  const resourceResult = processedResources.system.resourceManager.getBuiltResource(resourceId);
  if (resourceResult.isFailure()) {
    return succeed({
      success: false,
      resourceId,
      error: `Failed to get resource: ${resourceResult.message}`
    });
  }

  const resource = resourceResult.value;
  const compiledCollection = processedResources.compiledCollection;

  // Find the compiled resource for condition analysis
  const compiledResource = compiledCollection.resources.find((r) => r.id === resourceId);
  if (!compiledResource) {
    return succeed({
      success: false,
      resourceId,
      error: 'Failed to find compiled resource'
    });
  }

  // Resolve best candidate
  const bestResult = resolver.resolveResource(resource);

  // Resolve all candidates
  const allResult = resolver.resolveAllResourceCandidates(resource);

  // Resolve composed value
  const composedResult = resolver.resolveComposedResourceValue(resource);

  // Get decision resolution result
  const decisionResult = resolver.resolveDecision(resource.decision.baseDecision);
  if (decisionResult.isFailure()) {
    return succeed({
      success: false,
      resourceId,
      error: `Failed to resolve decision: ${decisionResult.message}`
    });
  }

  const decision = decisionResult.value;

  // Build detailed candidate information
  const candidateDetails: CandidateInfo[] = [];
  const matchedCandidates = allResult.isSuccess() ? allResult.value : [];

  // Create lookup sets for regular and default matches
  const regularMatchIndices = new Set(decision?.success ? decision.instanceIndices : []);
  const defaultMatchIndices = new Set(decision?.success ? decision.defaultInstanceIndices : []);

  // Add matched candidates first
  matchedCandidates.forEach((matchedCandidate) => {
    const index = resource.candidates.findIndex((candidate: any) => candidate === matchedCandidate);
    if (index !== -1) {
      const conditionSetKey = `cs-${index}`;
      const conditionEvaluations = evaluateConditionsForCandidate(
        resolver,
        index,
        compiledResource,
        compiledCollection
      );

      const isDefaultMatch = defaultMatchIndices.has(index);
      const isRegularMatch = regularMatchIndices.has(index);

      const candidateMatchType = isRegularMatch ? 'match' : isDefaultMatch ? 'matchAsDefault' : 'noMatch';

      candidateDetails.push({
        candidate: resource.candidates[index],
        conditionSetKey,
        candidateIndex: index,
        matched: true,
        matchType: candidateMatchType,
        isDefaultMatch,
        conditionEvaluations
      });
    }
  });

  // Add non-matching candidates
  resource.candidates.forEach((candidate: any, index: number) => {
    const isMatched = matchedCandidates.some((mc) => mc === candidate);
    if (!isMatched) {
      // Handle different candidate formats - IResourceCandidate doesn't have conditions
      const conditionSetKey = candidate.conditions?.toHash ? candidate.conditions.toHash() : `cs-${index}`;
      const conditionEvaluations = evaluateConditionsForCandidate(
        resolver,
        index,
        compiledResource,
        compiledCollection
      );

      candidateDetails.push({
        candidate,
        conditionSetKey,
        candidateIndex: index,
        matched: false,
        matchType: 'noMatch',
        isDefaultMatch: false,
        conditionEvaluations
      });
    }
  });

  const result: ResolutionResult = {
    success: true,
    resourceId,
    resource,
    bestCandidate: bestResult.isSuccess() ? bestResult.value : undefined,
    allCandidates: allResult.isSuccess() ? allResult.value : undefined,
    candidateDetails,
    composedValue: composedResult.isSuccess() ? composedResult.value : undefined,
    error: bestResult.isFailure() ? bestResult.message : undefined
  };

  debugLog(enableDebug, 'Resolution completed successfully');
  return succeed(result);
}

/**
 * Get available qualifiers from processed resources
 */
/** @public */
export function getAvailableQualifiers(processedResources: ProcessedResources): string[] {
  if (processedResources.compiledCollection.qualifiers) {
    return processedResources.compiledCollection.qualifiers.map((q) => q.name);
  }
  return [];
}

/**
 * Check if context has any pending changes
 */
/** @public */
export function hasPendingContextChanges(
  contextValues: Record<string, string | undefined>,
  pendingContextValues: Record<string, string | undefined>
): boolean {
  return JSON.stringify(contextValues) !== JSON.stringify(pendingContextValues);
}
