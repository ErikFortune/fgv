import { Result, succeed, fail, MessageAggregator } from '@fgv/ts-utils';
import { Runtime } from '@fgv/ts-res';
import { ProcessedResources, ResolutionResult, CandidateInfo, ConditionEvaluationResult } from '../types';

/**
 * Configuration options for resource resolution operations.
 *
 * ResolutionOptions provides control over performance and debugging features
 * during resource resolution operations. These options affect resolver creation,
 * resolution processing, and diagnostic output.
 *
 * @example
 * ```typescript
 * import { ResolutionTools } from '@fgv/ts-res-ui-components';
 *
 * // Basic resolution with default options
 * const basicResolver = ResolutionTools.createResolverWithContext(
 *   processedResources,
 *   { language: 'en-US', platform: 'web' }
 * );
 *
 * // Resolution with caching enabled for performance
 * const cachedResolver = ResolutionTools.createResolverWithContext(
 *   processedResources,
 *   { language: 'en-US', region: 'US' },
 *   { enableCaching: true }
 * );
 *
 * // Resolution with debugging for troubleshooting
 * const debugResolver = ResolutionTools.createResolverWithContext(
 *   processedResources,
 *   { language: 'fr-CA', platform: 'mobile' },
 *   { enableDebugLogging: true }
 * );
 *
 * // Full-featured resolution with both caching and debugging
 * const fullResolver = ResolutionTools.createResolverWithContext(
 *   processedResources,
 *   { language: 'es-MX', region: 'MX', platform: 'desktop' },
 *   { enableCaching: true, enableDebugLogging: true }
 * );
 * ```
 *
 * @public
 */
export interface ResolutionOptions {
  /** Enable caching for improved performance during repeated resolutions */
  enableCaching?: boolean;
  /** Enable detailed console logging for debugging resolution processes */
  enableDebugLogging?: boolean;
}

// Helper function for conditional debug logging
const debugLog = (enableDebug: boolean, ...args: any[]) => {
  if (enableDebug) {
    console.log(...args);
  }
};

/**
 * Create a resolver with context for resource resolution.
 *
 * Creates a fully configured ResourceResolver with the specified context values
 * and options. The resolver can be used to resolve resources based on the provided
 * qualification context, with optional caching and debugging features.
 *
 * @param processedResources - The processed resource system containing all resources and configuration
 * @param contextValues - Context values for qualification (e.g., language, region, platform)
 * @param options - Configuration options for resolution behavior
 * @returns A Result containing the configured ResourceResolver or an error message
 *
 * @example
 * ```typescript
 * import { ResolutionTools } from '@fgv/ts-res-ui-components';
 *
 * // Basic resolver creation for web platform
 * const webResolver = ResolutionTools.createResolverWithContext(
 *   processedResources,
 *   {
 *     language: 'en-US',
 *     platform: 'web',
 *     region: 'US'
 *   }
 * );
 *
 * if (webResolver.isSuccess()) {
 *   const resolver = webResolver.value;
 *   // Use resolver to resolve resources...
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Resolver with caching for performance-critical scenarios
 * const performanceResolver = ResolutionTools.createResolverWithContext(
 *   processedResources,
 *   {
 *     language: 'fr-CA',
 *     platform: 'mobile',
 *     deviceType: 'tablet'
 *   },
 *   { enableCaching: true }
 * );
 * ```
 *
 * @example
 * ```typescript
 * // Resolver with debugging for troubleshooting resolution issues
 * const debugResolver = ResolutionTools.createResolverWithContext(
 *   processedResources,
 *   {
 *     language: 'es-MX',
 *     region: 'MX',
 *     platform: 'desktop'
 *   },
 *   { enableDebugLogging: true }
 * ).onSuccess((resolver) => {
 *   // Debug output will show context creation and resolver setup
 *   console.log('Resolver created with debug logging enabled');
 *   return succeed(resolver);
 * });
 * ```
 *
 * @public
 */
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
 * Evaluate conditions for a specific candidate and return detailed evaluation results.
 *
 * Analyzes how each condition in a candidate's condition set evaluates against the
 * current resolution context. This provides detailed insight into why a candidate
 * matches or doesn't match, including qualification values, condition operators,
 * match scores, and match types.
 *
 * @param resolver - The configured ResourceResolver with context
 * @param candidateIndex - Zero-based index of the candidate to evaluate
 * @param compiledResource - The compiled resource containing decision information
 * @param compiledCollection - The compiled collection with condition and qualifier data
 * @returns Array of condition evaluation results showing how each condition performed
 *
 * @example
 * ```typescript
 * import { ResolutionTools } from '@fgv/ts-res-ui-components';
 *
 * // Evaluate conditions for the first candidate of a resource
 * const resolver = ResolutionTools.createResolverWithContext(
 *   processedResources,
 *   { language: 'en-US', platform: 'web' }
 * ).orThrow();
 *
 * const compiledResource = processedResources.compiledCollection.resources
 *   .find(r => r.id === 'welcome-message');
 *
 * const evaluations = ResolutionTools.evaluateConditionsForCandidate(
 *   resolver,
 *   0, // First candidate
 *   compiledResource,
 *   processedResources.compiledCollection
 * );
 *
 * // Analyze the results
 * evaluations.forEach(evaluation => {
 *   console.log(`${evaluation.qualifierName}: ${evaluation.qualifierValue} ${evaluation.operator} ${evaluation.conditionValue}`);
 *   console.log(`  Matched: ${evaluation.matched}, Score: ${evaluation.score}`);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Use in resolution analysis to understand candidate selection
 * function analyzeResourceResolution(resourceId: string) {
 *   const resolver = ResolutionTools.createResolverWithContext(
 *     processedResources,
 *     getCurrentContext()
 *   ).orThrow();
 *
 *   const resource = processedResources.system.resourceManager
 *     .getBuiltResource(resourceId).orThrow();
 *
 *   const compiledResource = processedResources.compiledCollection.resources
 *     .find(r => r.id === resourceId);
 *
 *   // Evaluate all candidates
 *   resource.candidates.forEach((candidate, index) => {
 *     const evaluations = ResolutionTools.evaluateConditionsForCandidate(
 *       resolver,
 *       index,
 *       compiledResource,
 *       processedResources.compiledCollection
 *     );
 *
 *     console.log(`Candidate ${index}:`);
 *     evaluations.forEach(eval => {
 *       console.log(`  ${eval.qualifierName}: ${eval.matched ? '✓' : '✗'} (${eval.score})`);
 *     });
 *   });
 * }
 * ```
 *
 * @public
 */
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
 * Resolve a resource and create detailed resolution result with comprehensive analysis.
 *
 * Performs complete resource resolution including best candidate selection, all candidate
 * analysis, composed value resolution, and detailed condition evaluation for each candidate.
 * This provides the most comprehensive view of how resource resolution works for a given
 * resource and context.
 *
 * @param resolver - The configured ResourceResolver with context
 * @param resourceId - The ID of the resource to resolve
 * @param processedResources - The processed resource system
 * @param options - Configuration options for resolution behavior
 * @returns A Result containing detailed resolution information or an error
 *
 * @example
 * ```typescript
 * import { ResolutionTools } from '@fgv/ts-res-ui-components';
 *
 * // Detailed resolution of a welcome message
 * const resolver = ResolutionTools.createResolverWithContext(
 *   processedResources,
 *   { language: 'en-US', platform: 'web', region: 'US' }
 * ).orThrow();
 *
 * const result = ResolutionTools.resolveResourceDetailed(
 *   resolver,
 *   'welcome-message',
 *   processedResources
 * );
 *
 * if (result.isSuccess() && result.value.success) {
 *   const resolution = result.value;
 *   console.log('Best candidate:', resolution.bestCandidate);
 *   console.log('Composed value:', resolution.composedValue);
 *
 *   // Analyze each candidate
 *   resolution.candidateDetails.forEach((candidate, index) => {
 *     console.log(`Candidate ${index}: ${candidate.matched ? 'MATCHED' : 'no match'}`);
 *     candidate.conditionEvaluations.forEach(eval => {
 *       console.log(`  ${eval.qualifierName}: ${eval.matched ? '✓' : '✗'}`);
 *     });
 *   });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Resolution with debugging for troubleshooting
 * const debugResult = ResolutionTools.resolveResourceDetailed(
 *   resolver,
 *   'error-messages',
 *   processedResources,
 *   { enableDebugLogging: true }
 * );
 *
 * // Debug output will show detailed resolution steps
 * ```
 *
 * @example
 * ```typescript
 * // Use in resolution testing workflow
 * async function testResourceResolution(resourceId: string, context: Record<string, string>) {
 *   const resolver = ResolutionTools.createResolverWithContext(
 *     processedResources,
 *     context
 *   ).orThrow();
 *
 *   const result = ResolutionTools.resolveResourceDetailed(
 *     resolver,
 *     resourceId,
 *     processedResources
 *   );
 *
 *   if (result.isSuccess() && result.value.success) {
 *     const resolution = result.value;
 *
 *     return {
 *       resourceId,
 *       context,
 *       bestValue: resolution.bestCandidate?.value,
 *       composedValue: resolution.composedValue,
 *       matchedCandidates: resolution.candidateDetails.filter(c => c.matched).length,
 *       totalCandidates: resolution.candidateDetails.length,
 *       conditionAnalysis: resolution.candidateDetails.map(c => ({
 *         matched: c.matched,
 *         matchType: c.matchType,
 *         conditions: c.conditionEvaluations.length
 *       }))
 *     };
 *   }
 *
 *   throw new Error(`Resolution failed: ${result.value.error}`);
 * }
 * ```
 *
 * @public
 */
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
 * Get available qualifiers from processed resources.
 *
 * Extracts all qualifier names from the compiled resource collection, providing
 * a list of qualification dimensions available for context setting and resource
 * resolution. This is useful for building dynamic UI controls and validation.
 *
 * @param processedResources - The processed resource system
 * @returns Array of qualifier names available in the system
 *
 * @example
 * ```typescript
 * import { ResolutionTools } from '@fgv/ts-res-ui-components';
 *
 * // Get all available qualifiers for UI generation
 * const availableQualifiers = ResolutionTools.getAvailableQualifiers(processedResources);
 * console.log('Available qualifiers:', availableQualifiers);
 * // Output: ['language', 'region', 'platform', 'deviceType']
 *
 * // Use to build dynamic context controls
 * const contextControls = availableQualifiers.map(qualifierName => (
 *   <QualifierContextControl
 *     key={qualifierName}
 *     qualifierName={qualifierName}
 *     value={context[qualifierName]}
 *     onChange={handleContextChange}
 *   />
 * ));
 * ```
 *
 * @example
 * ```typescript
 * // Validate context against available qualifiers
 * function validateResolutionContext(
 *   context: Record<string, string>,
 *   processedResources: ProcessedResources
 * ): string[] {
 *   const availableQualifiers = ResolutionTools.getAvailableQualifiers(processedResources);
 *   const errors: string[] = [];
 *
 *   // Check for unknown qualifiers
 *   Object.keys(context).forEach(key => {
 *     if (!availableQualifiers.includes(key)) {
 *       errors.push(`Unknown qualifier: ${key}`);
 *     }
 *   });
 *
 *   return errors;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Build qualifier documentation
 * function generateQualifierDocs(processedResources: ProcessedResources) {
 *   const qualifiers = ResolutionTools.getAvailableQualifiers(processedResources);
 *
 *   return qualifiers.map(name => {
 *     const qualifier = processedResources.system.qualifiers.validating.get(name).orThrow();
 *     return {
 *       name,
 *       type: qualifier.type.systemType,
 *       description: `Controls ${name} resolution behavior`
 *     };
 *   });
 * }
 * ```
 *
 * @public
 */
export function getAvailableQualifiers(processedResources: ProcessedResources): string[] {
  if (processedResources.compiledCollection.qualifiers) {
    return processedResources.compiledCollection.qualifiers.map((q) => q.name);
  }
  return [];
}

/**
 * Check if context has any pending changes by comparing current and pending values.
 *
 * Performs a deep comparison between current context values and pending context values
 * to determine if there are unsaved changes. This is useful for UI state management
 * and preventing data loss in resolution interfaces.
 *
 * @param contextValues - The current/saved context values
 * @param pendingContextValues - The pending/unsaved context values
 * @returns True if there are pending changes, false if contexts are identical
 *
 * @example
 * ```typescript
 * import { ResolutionTools } from '@fgv/ts-res-ui-components';
 *
 * // Check for unsaved context changes in resolution UI
 * const ResolutionInterface = () => {
 *   const [savedContext, setSavedContext] = useState({
 *     language: 'en-US',
 *     platform: 'web'
 *   });
 *
 *   const [pendingContext, setPendingContext] = useState(savedContext);
 *
 *   const hasChanges = ResolutionTools.hasPendingContextChanges(
 *     savedContext,
 *     pendingContext
 *   );
 *
 *   const handleApplyChanges = () => {
 *     if (hasChanges) {
 *       setSavedContext(pendingContext);
 *       // Trigger re-resolution with new context...
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {hasChanges && (
 *         <div className="warning">
 *           You have unsaved context changes.
 *           <button onClick={handleApplyChanges}>Apply Changes</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Prevent navigation with unsaved changes
 * function useUnsavedChangesWarning(
 *   currentContext: Record<string, string | undefined>,
 *   pendingContext: Record<string, string | undefined>
 * ) {
 *   const hasChanges = ResolutionTools.hasPendingContextChanges(
 *     currentContext,
 *     pendingContext
 *   );
 *
 *   useEffect(() => {
 *     const handleBeforeUnload = (event: BeforeUnloadEvent) => {
 *       if (hasChanges) {
 *         event.preventDefault();
 *         event.returnValue = 'You have unsaved context changes. Are you sure you want to leave?';
 *       }
 *     };
 *
 *     window.addEventListener('beforeunload', handleBeforeUnload);
 *     return () => window.removeEventListener('beforeunload', handleBeforeUnload);
 *   }, [hasChanges]);
 *
 *   return hasChanges;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Context change management in resolution workflow
 * class ResolutionContextManager {
 *   private savedContext: Record<string, string | undefined> = {};
 *   private pendingContext: Record<string, string | undefined> = {};
 *
 *   updatePendingValue(qualifier: string, value: string | undefined) {
 *     this.pendingContext = { ...this.pendingContext, [qualifier]: value };
 *   }
 *
 *   hasPendingChanges(): boolean {
 *     return ResolutionTools.hasPendingContextChanges(
 *       this.savedContext,
 *       this.pendingContext
 *     );
 *   }
 *
 *   applyChanges(): boolean {
 *     if (this.hasPendingChanges()) {
 *       this.savedContext = { ...this.pendingContext };
 *       return true; // Changes were applied
 *     }
 *     return false; // No changes to apply
 *   }
 *
 *   discardChanges(): boolean {
 *     if (this.hasPendingChanges()) {
 *       this.pendingContext = { ...this.savedContext };
 *       return true; // Changes were discarded
 *     }
 *     return false; // No changes to discard
 *   }
 * }
 * ```
 *
 * @public
 */
export function hasPendingContextChanges(
  contextValues: Record<string, string | undefined>,
  pendingContextValues: Record<string, string | undefined>
): boolean {
  return JSON.stringify(contextValues) !== JSON.stringify(pendingContextValues);
}
