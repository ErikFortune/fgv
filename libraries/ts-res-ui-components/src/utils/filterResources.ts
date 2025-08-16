import { Result, succeed, fail } from '@fgv/ts-utils';
import { Runtime, Import, Resources } from '@fgv/ts-res';
import { ProcessedResources } from '../types';

/** @public */
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
const debugLog = (enableDebug: boolean, ...args: unknown[]) => {
  if (enableDebug) {
    console.log(...args);
  }
};

/**
 * Check if filter values object has any meaningful values
 */
/** @public */
export function hasFilterValues(values: Record<string, string | undefined>): boolean {
  return Object.values(values).some((value) => value !== undefined && value !== '');
}

/**
 * Get a summary string of active filter values
 */
/** @public */
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
/** @public */
export const createFilteredResourceManagerSimple = async (
  originalSystem: ProcessedResources['system'],
  partialContext: Record<string, string | undefined>,
  options: FilterOptions = { partialContextMatch: true }
): Promise<Result<ProcessedResources>> => {
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

  // Try to use ResourceManagerBuilder.clone() for proper filtering first
  debugLog(enableDebug, 'Using ResourceManagerBuilder for proper filtering');
  debugLog(enableDebug, 'Validating context and cloning manager:', filteredContext);
  const resourceManagerBuilder = originalSystem.resourceManager;

  return resourceManagerBuilder
    .validateContext(filteredContext)
    .onSuccess((validatedContext) => {
      debugLog(enableDebug, 'Context validated, creating clone with context:', validatedContext);
      return resourceManagerBuilder.clone({
        filterForContext: validatedContext,
        reduceQualifiers: options.reduceQualifiers
      });
    })
    .withErrorFormat((e) => `Failed to validate context or clone: ${e}`)
    .onSuccess((filteredManager) => {
      debugLog(enableDebug, 'Filtered manager created:', filteredManager);

      // Create new ImportManager for the filtered system
      return Import.ImportManager.create({
        resources: filteredManager
      })
        .withErrorFormat((e) => `Failed to create filtered import manager: ${e}`)
        .onSuccess((newImportManager) => {
          // Create new ContextQualifierProvider for the filtered system
          return Runtime.ValidatingSimpleContextQualifierProvider.create({
            qualifiers: originalSystem.qualifiers
          })
            .withErrorFormat((e) => `Failed to create filtered context provider: ${e}`)
            .onSuccess((newContextQualifierProvider) => {
              // Build the new system object
              const newSystem = {
                qualifierTypes: originalSystem.qualifierTypes,
                qualifiers: originalSystem.qualifiers,
                resourceTypes: originalSystem.resourceTypes,
                resourceManager: filteredManager,
                importManager: newImportManager,
                contextQualifierProvider: newContextQualifierProvider
              };

              // Get compiled collection from the filtered manager
              return filteredManager
                .getCompiledResourceCollection({ includeMetadata: true })
                .withErrorFormat((e) => `Failed to get compiled collection: ${e}`)
                .onSuccess((compiledCollection) => {
                  // Create resolver for the filtered system
                  return Runtime.ResourceResolver.create({
                    resourceManager: filteredManager,
                    qualifierTypes: originalSystem.qualifierTypes,
                    contextQualifierProvider: newContextQualifierProvider
                  })
                    .withErrorFormat((e) => `Failed to create resolver: ${e}`)
                    .onSuccess((resolver) => {
                      // Create summary
                      const resourceIds = Array.from(filteredManager.resources.keys());
                      const summary = {
                        totalResources: resourceIds.length,
                        resourceIds,
                        errorCount: 0,
                        warnings: [] as string[]
                      };

                      const processedResources: ProcessedResources = {
                        system: newSystem,
                        compiledCollection,
                        resolver,
                        resourceCount: resourceIds.length,
                        summary
                      };

                      debugLog(enableDebug, '=== FILTERED PROCESSING COMPLETE ===');
                      debugLog(enableDebug, 'Filtered resource count:', resourceIds.length);
                      debugLog(enableDebug, 'Filtered resource IDs:', resourceIds);

                      return succeed(processedResources);
                    });
                });
            });
        });
    })
    .onFailure((error) => {
      debugLog(enableDebug, 'Failed to create filtered resource manager:', error);
      return fail(`Failed to create filtered resource manager: ${error}`);
    });
};

/**
 * Analyze filtered resources compared to original resources
 */
/** @public */
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
