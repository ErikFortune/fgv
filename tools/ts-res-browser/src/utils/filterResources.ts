import { Result, succeed, fail } from '@fgv/ts-utils';
import { Context, ResourceJson, Runtime, Import, Resources } from '@fgv/ts-res';
import { ProcessedResources, TsResSystem, createTsResSystemFromConfig } from './tsResIntegration';

export interface FilterOptions {
  partialContextMatch?: boolean;
  enableDebugLogging?: boolean;
}

export interface FilteredResource {
  id: string;
  originalCandidateCount: number;
  filteredCandidateCount: number;
  hasWarning: boolean;
}

export interface FilterResult {
  success: boolean;
  filteredResources: FilteredResource[];
  processedResources?: ProcessedResources;
  error?: string;
  warnings: string[];
}

/**
 * Creates a filtered resource manager based on partial context matching
 */
// Helper function for conditional debug logging
const debugLog = (enableDebug: boolean, ...args: any[]) => {
  if (enableDebug) {
    console.log(...args);
  }
};

export const createFilteredResourceManager = async (
  originalSystem: TsResSystem,
  partialContext: Record<string, string>,
  options: FilterOptions = { partialContextMatch: true }
): Promise<Result<ProcessedResources>> => {
  try {
    const enableDebug = options.enableDebugLogging === true;

    debugLog(enableDebug, '=== FILTER CREATION DEBUG ===');
    debugLog(enableDebug, 'Original system:', originalSystem);
    debugLog(enableDebug, 'Partial context:', partialContext);
    debugLog(enableDebug, 'Options:', options);

    // Validate the original system has required components
    if (!originalSystem) {
      return fail('Original system is undefined - ensure resources are loaded before filtering');
    }

    debugLog(enableDebug, 'System validation - qualifiers:', originalSystem.qualifiers);
    debugLog(enableDebug, 'System validation - resourceTypes:', originalSystem.resourceTypes);
    debugLog(enableDebug, 'System validation - resourceManager:', originalSystem.resourceManager);

    if (!originalSystem.qualifiers) {
      return fail('Original system qualifiers are undefined - system may not be properly initialized');
    }

    if (!originalSystem.resourceTypes) {
      return fail('Original system resourceTypes are undefined - system may not be properly initialized');
    }

    if (!originalSystem.resourceManager) {
      return fail('Original system resourceManager is undefined - system may not be properly initialized');
    }

    // Additional validation for the objects themselves
    if (typeof originalSystem.qualifiers !== 'object') {
      return fail(`Original system qualifiers has invalid type: ${typeof originalSystem.qualifiers}`);
    }

    if (typeof originalSystem.resourceTypes !== 'object') {
      return fail(`Original system resourceTypes has invalid type: ${typeof originalSystem.resourceTypes}`);
    }

    // Create validated context from user input
    debugLog(enableDebug, 'Creating validated context...');
    debugLog(enableDebug, 'Partial context (raw):', partialContext);

    // Filter out empty string values - only include qualifiers with actual values
    const cleanedContext = Object.fromEntries(
      Object.entries(partialContext).filter(([, value]) => value.trim() !== '')
    );

    debugLog(enableDebug, 'Cleaned context (empty strings removed):', cleanedContext);
    debugLog(enableDebug, 'Available qualifiers:', originalSystem.qualifiers);

    const contextResult = Context.Convert.validatedContextDecl.convert(cleanedContext, {
      qualifiers: originalSystem.qualifiers
    });

    if (contextResult.isFailure()) {
      debugLog(enableDebug, 'Context creation failed:', contextResult.message);
      return fail(`Failed to create context: ${contextResult.message}`);
    }

    const validatedContext = contextResult.value;
    debugLog(enableDebug, 'Validated context created:', validatedContext);

    // Get filtered resource builders that match the context
    debugLog(enableDebug, 'Getting resources for context...');
    debugLog(enableDebug, 'Validated context:', validatedContext);
    debugLog(enableDebug, 'Filter options:', options);

    const filteredResourceBuilders = originalSystem.resourceManager.getResourcesForContext(
      validatedContext,
      options
    );

    debugLog(enableDebug, 'Filtered resource builders count:', filteredResourceBuilders.length);
    debugLog(enableDebug, 'Filtered resource builders:', filteredResourceBuilders);

    // Debug: Show detailed condition evaluation for each resource
    if (enableDebug) {
      debugLog(enableDebug, '=== DETAILED CANDIDATE FILTERING DEBUG ===');
      const allResourceBuilders = originalSystem.resourceManager.getAllResources();
      for (const resourceBuilder of allResourceBuilders) {
        const builtResult = resourceBuilder.build();
        if (builtResult.isSuccess()) {
          const resource = builtResult.value;
          debugLog(enableDebug, `\n--- Resource: ${resource.id} ---`);
          debugLog(enableDebug, `Candidates: ${resource.candidates.length}`);

          resource.candidates.forEach((candidate, index) => {
            debugLog(enableDebug, `  Candidate ${index}:`);
            if (candidate.conditions && candidate.conditions.conditions) {
              candidate.conditions.conditions.forEach((condition, condIndex) => {
                const canMatch = condition.canMatchPartialContext(validatedContext, options);
                const contextMatch = condition.getContextMatch(validatedContext, options);
                debugLog(
                  enableDebug,
                  `    Condition ${condIndex}: ${condition.qualifier.name}=${condition.value} (operator: ${condition.operator})`
                );
                debugLog(enableDebug, `      canMatchPartialContext: ${canMatch}`);
                debugLog(enableDebug, `      contextMatch: ${contextMatch}`);
                debugLog(
                  enableDebug,
                  `      qualifier in context: ${condition.qualifier.name in validatedContext}`
                );
                if (condition.qualifier.name in validatedContext) {
                  debugLog(enableDebug, `      context value: ${validatedContext[condition.qualifier.name]}`);
                }
              });
            } else {
              debugLog(enableDebug, `    No conditions (default candidate)`);
            }

            const candidateCanMatch = candidate.canMatchPartialContext(validatedContext, options);
            debugLog(enableDebug, `  -> Candidate ${index} canMatchPartialContext: ${candidateCanMatch}`);
          });

          const resourceCandidatesForContext = resourceBuilder.getCandidatesForContext(
            validatedContext,
            options
          );
          debugLog(
            enableDebug,
            `  -> Resource has ${resourceCandidatesForContext.length} matching candidates`
          );
          debugLog(
            enableDebug,
            `  -> Resource included in filter: ${filteredResourceBuilders.includes(resourceBuilder)}`
          );
        }
      }
    }

    // Convert filtered resources to declarations with only matching candidates
    const resourceDeclarations: ResourceJson.Json.ILooseResourceDecl[] = [];

    debugLog(enableDebug, '=== CONVERTING FILTERED RESOURCES TO DECLARATIONS ===');
    for (const resourceBuilder of filteredResourceBuilders) {
      const builtResourceResult = resourceBuilder.build();
      if (builtResourceResult.isFailure()) {
        debugLog(enableDebug, `Failed to build resource: ${builtResourceResult.message}`);
        continue;
      }

      const builtResource = builtResourceResult.value;
      debugLog(enableDebug, `\n--- Converting Resource: ${builtResource.id} ---`);
      debugLog(enableDebug, `Original candidates: ${builtResource.candidates.length}`);

      // Filter candidates to only include those that match the context
      const matchingCandidates = builtResource.candidates.filter((candidate) => {
        const canMatch = candidate.canMatchPartialContext(validatedContext, options);
        debugLog(
          enableDebug,
          `  Candidate with conditions ${
            candidate.conditions?.conditions.map((c) => `${c.qualifier.name}=${c.value}`).join(', ') || 'none'
          }: canMatch = ${canMatch}`
        );
        return canMatch;
      });

      debugLog(enableDebug, `Filtered to ${matchingCandidates.length} matching candidates`);

      // Create a new resource declaration with only the matching candidates
      const originalDeclaration = builtResource.toLooseResourceDecl();
      const filteredDeclaration: ResourceJson.Json.ILooseResourceDecl = {
        ...originalDeclaration,
        candidates: matchingCandidates.map((candidate) => candidate.toLooseResourceCandidateDecl())
      };

      debugLog(enableDebug, `Final declaration candidates: ${filteredDeclaration.candidates?.length || 0}`);

      // Debug: Check what candidates are in the final declaration
      if (enableDebug) {
        filteredDeclaration.candidates?.forEach((candidate, index) => {
          debugLog(enableDebug, `  Final Declaration Candidate ${index}:`);
          if (candidate.conditions) {
            Object.entries(candidate.conditions).forEach(([qualifier, value]) => {
              debugLog(enableDebug, `    Condition: ${qualifier}=${value}`);
            });
          } else {
            debugLog(enableDebug, `    No conditions (default candidate)`);
          }
        });
      }

      resourceDeclarations.push(filteredDeclaration);
    }

    // Validate system components before creating new manager
    if (!originalSystem.qualifiers) {
      return fail('Original system qualifiers is undefined');
    }
    if (!originalSystem.resourceTypes) {
      return fail('Original system resourceTypes is undefined');
    }

    // Create new ResourceManagerBuilder with same configuration
    debugLog(enableDebug, 'Creating new resource manager...');
    debugLog(enableDebug, 'Qualifiers for new manager:', originalSystem.qualifiers);
    debugLog(enableDebug, 'ResourceTypes for new manager:', originalSystem.resourceTypes);

    const newManagerResult = Resources.ResourceManagerBuilder.create({
      qualifiers: originalSystem.qualifiers,
      resourceTypes: originalSystem.resourceTypes
    });

    if (newManagerResult.isFailure()) {
      debugLog(enableDebug, 'New manager creation failed:', newManagerResult.message, newManagerResult);
      return fail(`Failed to create new manager: ${newManagerResult.message}`);
    }

    const newManager = newManagerResult.value;
    debugLog(enableDebug, 'New manager created successfully:', newManager);

    // Add each filtered resource to the new manager
    debugLog(enableDebug, '=== ADDING RESOURCES TO NEW FILTERED MANAGER ===');
    for (const declaration of resourceDeclarations) {
      debugLog(
        enableDebug,
        `Adding resource: ${declaration.id} with ${declaration.candidates?.length || 0} candidates`
      );
      const addResult = newManager.addResource(declaration);
      if (addResult.isFailure()) {
        debugLog(enableDebug, `Failed to add resource ${declaration.id}: ${addResult.message}`);
      } else if (enableDebug) {
        // Verify what actually got added to the manager
        const retrievedResult = newManager.getBuiltResource(declaration.id);
        if (retrievedResult.isSuccess()) {
          const retrievedResource = retrievedResult.value;
          debugLog(
            enableDebug,
            `  -> Resource added successfully with ${retrievedResource.candidates.length} candidates:`
          );
          retrievedResource.candidates.forEach((candidate, index) => {
            debugLog(enableDebug, `    Final Candidate ${index}:`);
            if (candidate.conditions && candidate.conditions.conditions) {
              candidate.conditions.conditions.forEach((condition, condIndex) => {
                debugLog(
                  enableDebug,
                  `      Condition ${condIndex}: ${condition.qualifier.name}=${condition.value}`
                );
              });
            } else {
              debugLog(enableDebug, `      No conditions (default candidate)`);
            }
          });
        }
      }
    }

    // Create new ImportManager for the filtered system
    const newImportManagerResult = Import.ImportManager.create({
      resources: newManager
    });

    if (newImportManagerResult.isFailure()) {
      return fail(`Failed to create filtered import manager: ${newImportManagerResult.message}`);
    }

    // Create new ContextQualifierProvider for the filtered system
    // Validate qualifiers again before using them
    if (!originalSystem.qualifiers) {
      return fail('Original system qualifiers became undefined during processing');
    }

    const newContextQualifierProviderResult = Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers: originalSystem.qualifiers
    });

    if (newContextQualifierProviderResult.isFailure()) {
      return fail(`Failed to create filtered context provider: ${newContextQualifierProviderResult.message}`);
    }

    // Create TsResSystem for the filtered manager
    const filteredSystem: TsResSystem = {
      qualifierTypes: originalSystem.qualifierTypes,
      qualifiers: originalSystem.qualifiers,
      resourceTypes: originalSystem.resourceTypes,
      resourceManager: newManager,
      importManager: newImportManagerResult.value,
      contextQualifierProvider: newContextQualifierProviderResult.value
    };

    // Process the filtered system into ProcessedResources
    const compiledResult = filteredSystem.resourceManager.getCompiledResourceCollection({
      includeMetadata: true
    });
    if (compiledResult.isFailure()) {
      return fail(`Failed to compile filtered resources: ${compiledResult.message}`);
    }

    const resolverResult = Runtime.ResourceResolver.create({
      resourceManager: filteredSystem.resourceManager,
      qualifierTypes: filteredSystem.qualifierTypes,
      contextQualifierProvider: filteredSystem.contextQualifierProvider
    });

    if (resolverResult.isFailure()) {
      return fail(`Failed to create filtered resolver: ${resolverResult.message}`);
    }

    // Create resource summary
    const resourceIds = Array.from(filteredSystem.resourceManager.resources.keys());
    const summary = {
      totalResources: resourceIds.length,
      resourceIds,
      errorCount: 0,
      warnings: []
    };

    const processedResources: ProcessedResources = {
      system: filteredSystem,
      compiledCollection: compiledResult.value,
      resolver: resolverResult.value,
      resourceCount: resourceIds.length,
      summary
    };

    return succeed(processedResources);
  } catch (error) {
    return fail(
      `Unexpected error during filtering: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Analyzes resources to create filter result with validation
 */
export const analyzeFilteredResources = (
  originalResources: string[],
  filteredProcessedResources: ProcessedResources | null,
  originalProcessedResources: ProcessedResources
): FilterResult => {
  const warnings: string[] = [];
  const filteredResources: FilteredResource[] = [];

  if (!filteredProcessedResources) {
    return {
      success: false,
      filteredResources: [],
      error: 'Failed to create filtered resources',
      warnings: []
    };
  }

  const filteredResourceIds = filteredProcessedResources.summary.resourceIds || [];

  // Analyze each original resource
  for (const resourceId of originalResources) {
    // Get original candidate count
    const originalResourceResult =
      originalProcessedResources.system.resourceManager.getBuiltResource(resourceId);
    const originalCandidateCount = originalResourceResult.isSuccess()
      ? originalResourceResult.value.candidates.length
      : 0;

    // Check if resource exists in filtered set
    const isInFilteredSet = filteredResourceIds.includes(resourceId);
    let filteredCandidateCount = 0;
    let hasWarning = false;

    if (isInFilteredSet) {
      // Get filtered candidate count
      const filteredResourceResult =
        filteredProcessedResources.system.resourceManager.getBuiltResource(resourceId);
      if (filteredResourceResult.isSuccess()) {
        filteredCandidateCount = filteredResourceResult.value.candidates.length;
        hasWarning = filteredCandidateCount === 0;

        if (hasWarning) {
          warnings.push(`Resource "${resourceId}" has no matching candidates`);
        }
      }
    } else {
      // Resource was completely filtered out
      hasWarning = true;
      warnings.push(`Resource "${resourceId}" was completely filtered out`);
    }

    filteredResources.push({
      id: resourceId,
      originalCandidateCount,
      filteredCandidateCount,
      hasWarning
    });
  }

  return {
    success: true,
    filteredResources,
    processedResources: filteredProcessedResources,
    warnings
  };
};

/**
 * Helper to check if context has any meaningful values
 */
export const hasFilterValues = (context: Record<string, string>): boolean => {
  return Object.values(context).some((value) => value.trim() !== '');
};

/**
 * Helper to create filter display text
 */
export const getFilterSummary = (context: Record<string, string>): string => {
  const setValues = Object.entries(context)
    .filter(([, value]) => value.trim() !== '')
    .map(([key, value]) => `${key}=${value}`);

  if (setValues.length === 0) {
    return 'No filters applied';
  }

  return `Filtering by: ${setValues.join(', ')}`;
};

/**
 * Alternative approach: Creates a filtered resource manager by recreating the system from scratch
 * This is more robust but potentially slower than the direct approach
 */
export const createFilteredResourceManagerAlternative = async (
  originalSystem: TsResSystem,
  partialContext: Record<string, string>,
  options: FilterOptions = { partialContextMatch: true }
): Promise<Result<ProcessedResources>> => {
  const enableDebug = options.enableDebugLogging === true;
  try {
    // Validate inputs first
    if (!originalSystem?.qualifiers || !originalSystem?.resourceTypes || !originalSystem?.resourceManager) {
      return fail('Original system is missing required components');
    }

    // Create a fresh system using the original system's configuration
    const freshSystemResult = createTsResSystemFromConfig();

    if (freshSystemResult.isFailure()) {
      return fail(`Failed to create fresh system: ${freshSystemResult.message}`);
    }

    const freshSystem = freshSystemResult.value;

    // Get all resources from the original system that match the context
    // Filter out empty string values - only include qualifiers with actual values
    const cleanedContext = Object.fromEntries(
      Object.entries(partialContext).filter(([, value]) => value.trim() !== '')
    );

    const contextResult = Context.Convert.validatedContextDecl.convert(cleanedContext, {
      qualifiers: originalSystem.qualifiers
    });

    if (contextResult.isFailure()) {
      return fail(`Failed to create context: ${contextResult.message}`);
    }

    const validatedContext = contextResult.value;
    const filteredResourceBuilders = originalSystem.resourceManager.getResourcesForContext(
      validatedContext,
      options
    );

    // Add each filtered resource to the fresh system
    for (const resourceBuilder of filteredResourceBuilders) {
      const builtResourceResult = resourceBuilder.build();
      if (builtResourceResult.isFailure()) {
        debugLog(enableDebug, `Failed to build resource: ${builtResourceResult.message}`);
        continue;
      }

      const builtResource = builtResourceResult.value;
      const declaration = builtResource.toLooseResourceDecl();

      const addResult = freshSystem.resourceManager.addResource(declaration);
      if (addResult.isFailure()) {
        debugLog(enableDebug, `Failed to add resource ${declaration.id}: ${addResult.message}`);
      }
    }

    // Finalize the fresh system similar to how it's done in tsResIntegration
    const compiledResult = freshSystem.resourceManager.getCompiledResourceCollection({
      includeMetadata: true
    });
    if (compiledResult.isFailure()) {
      return fail(`Failed to compile filtered resources: ${compiledResult.message}`);
    }

    const resolverResult = Runtime.ResourceResolver.create({
      resourceManager: freshSystem.resourceManager,
      qualifierTypes: freshSystem.qualifierTypes,
      contextQualifierProvider: freshSystem.contextQualifierProvider
    });

    if (resolverResult.isFailure()) {
      return fail(`Failed to create filtered resolver: ${resolverResult.message}`);
    }

    // Create resource summary
    const resourceIds = Array.from(freshSystem.resourceManager.resources.keys());
    const summary = {
      totalResources: resourceIds.length,
      resourceIds,
      errorCount: 0,
      warnings: []
    };

    const processedResources: ProcessedResources = {
      system: freshSystem,
      compiledCollection: compiledResult.value,
      resolver: resolverResult.value,
      resourceCount: resourceIds.length,
      summary
    };

    return succeed(processedResources);
  } catch (error) {
    return fail(
      `Unexpected error during alternative filtering: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
