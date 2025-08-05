import { Result, succeed, fail } from '@fgv/ts-utils';
import { Context, Runtime, Import, Resources } from '@fgv/ts-res';
import { ProcessedResources } from '../types';

export interface FilterOptions {
  partialContextMatch?: boolean;
  enableDebugLogging?: boolean;
  reduceQualifiers?: boolean;
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

// Helper function for conditional debug logging
const debugLog = (enableDebug: boolean, ...args: any[]) => {
  if (enableDebug) {
    console.log(...args);
  }
};

/**
 * Check if filter values object has any meaningful values
 */
export function hasFilterValues(values: Record<string, string | undefined>): boolean {
  return Object.values(values).some((value) => value !== undefined && value !== '');
}

/**
 * Get a summary string of active filter values
 */
export function getFilterSummary(values: Record<string, string | undefined>): string {
  const activeFilters = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${value}`);
  return activeFilters.length > 0 ? activeFilters.join(', ') : 'No filters';
}

/**
 * Creates a filtered resource manager using the ResourceManagerBuilder.clone() method.
 * This is a simplified implementation that leverages the built-in filtering functionality.
 */
export const createFilteredResourceManagerSimple = async (
  originalSystem: {
    resourceManager: Resources.ResourceManagerBuilder;
    qualifiers: any;
    qualifierTypes: any;
    resourceTypes: any;
    importManager: any;
    contextQualifierProvider: Runtime.ValidatingSimpleContextQualifierProvider;
  },
  partialContext: Record<string, string | undefined>,
  options: FilterOptions = { partialContextMatch: true }
): Promise<Result<ProcessedResources>> => {
  try {
    const enableDebug = options.enableDebugLogging === true;

    debugLog(enableDebug, '=== SIMPLE FILTER CREATION ===');
    debugLog(enableDebug, 'Original system:', originalSystem);
    debugLog(enableDebug, 'Partial context:', partialContext);

    // Validate the original system
    if (!originalSystem?.resourceManager) {
      return fail('Original system or resourceManager is undefined');
    }

    // Filter out undefined values from the context before processing
    const filteredContext = Object.fromEntries(
      Object.entries(partialContext).filter(([, value]) => value !== undefined)
    ) as Record<string, string>;

    // Use Result pattern chaining as recommended
    debugLog(enableDebug, 'Validating context and cloning manager:', filteredContext);
    const cloneResult = originalSystem.resourceManager
      .validateContext(filteredContext)
      .onSuccess((validatedContext) => {
        debugLog(enableDebug, 'Context validated, creating clone with context:', validatedContext);
        return originalSystem.resourceManager.clone({
          filterForContext: validatedContext,
          reduceQualifiers: options.reduceQualifiers
        });
      })
      .onFailure((error) => {
        debugLog(enableDebug, 'Failed to validate context or clone:', error);
        return fail(error);
      });

    if (cloneResult.isFailure()) {
      return fail(`Failed to create filtered resource manager: ${cloneResult.message}`);
    }

    const filteredManager = cloneResult.value;
    debugLog(enableDebug, 'Filtered manager created:', filteredManager);

    // Create new ImportManager for the filtered system
    const newImportManagerResult = Import.ImportManager.create({
      resources: filteredManager
    });

    if (newImportManagerResult.isFailure()) {
      return fail(`Failed to create filtered import manager: ${newImportManagerResult.message}`);
    }

    // Create new ContextQualifierProvider for the filtered system
    const newContextQualifierProviderResult = Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers: originalSystem.qualifiers
    });

    if (newContextQualifierProviderResult.isFailure()) {
      return fail(`Failed to create filtered context provider: ${newContextQualifierProviderResult.message}`);
    }

    // Build the new system object
    const newSystem = {
      qualifierTypes: originalSystem.qualifierTypes,
      qualifiers: originalSystem.qualifiers,
      resourceTypes: originalSystem.resourceTypes,
      resourceManager: filteredManager,
      importManager: newImportManagerResult.value,
      contextQualifierProvider: newContextQualifierProviderResult.value
    };

    // Get compiled collection from the filtered manager
    const compiledCollectionResult = filteredManager.getCompiledResourceCollection({ includeMetadata: true });
    if (compiledCollectionResult.isFailure()) {
      return fail(`Failed to get compiled collection: ${compiledCollectionResult.message}`);
    }

    // Create resolver for the filtered system
    const resolverResult = Runtime.ResourceResolver.create({
      resourceManager: filteredManager,
      qualifierTypes: originalSystem.qualifierTypes,
      contextQualifierProvider: newContextQualifierProviderResult.value
    });

    if (resolverResult.isFailure()) {
      return fail(`Failed to create resolver: ${resolverResult.message}`);
    }

    // Create summary
    const resourceIds = Array.from(filteredManager.resources.keys());
    const summary = {
      totalResources: resourceIds.length,
      resourceIds,
      errorCount: 0,
      warnings: []
    };

    const processedResources: ProcessedResources = {
      system: newSystem,
      compiledCollection: compiledCollectionResult.value,
      resolver: resolverResult.value,
      resourceCount: resourceIds.length,
      summary
    };

    debugLog(enableDebug, '=== FILTERED PROCESSING COMPLETE ===');
    debugLog(enableDebug, 'Filtered resource count:', resourceIds.length);
    debugLog(enableDebug, 'Filtered resource IDs:', resourceIds);

    return succeed(processedResources);
  } catch (error) {
    return fail(
      `Failed to create filtered resource manager: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Analyze filtered resources compared to original resources
 */
export function analyzeFilteredResources(
  originalResourceIds: string[],
  filteredProcessedResources: ProcessedResources,
  originalProcessedResources: ProcessedResources
): FilterResult {
  const filteredResources: FilteredResource[] = [];
  const warnings: string[] = [];

  for (const resourceId of originalResourceIds) {
    // Get original resource info
    const originalResourceResult =
      originalProcessedResources.system.resourceManager.getBuiltResource(resourceId);
    const originalCandidateCount = originalResourceResult.isSuccess()
      ? originalResourceResult.value.candidates.length
      : 0;

    // Get filtered resource info
    const filteredResourceResult =
      filteredProcessedResources.system.resourceManager.getBuiltResource(resourceId);
    const filteredCandidateCount = filteredResourceResult.isSuccess()
      ? filteredResourceResult.value.candidates.length
      : 0;

    const hasWarning = filteredCandidateCount === 0 && originalCandidateCount > 0;
    if (hasWarning) {
      warnings.push(`Resource ${resourceId} has no matching candidates after filtering`);
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
}
