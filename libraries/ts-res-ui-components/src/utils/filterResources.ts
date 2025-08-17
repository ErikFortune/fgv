import { Result, succeed, fail } from '@fgv/ts-utils';
import { Runtime, Import, Resources } from '@fgv/ts-res';
import { ProcessedResources } from '../types';

/**
 * Options for configuring filtering behavior and output.
 *
 * @public
 */
export interface FilterOptions {
  /** Allow partial context matches when filtering resources */
  partialContextMatch?: boolean;
  /** Enable detailed console logging for debugging filter operations */
  enableDebugLogging?: boolean;
  /** Attempt to reduce qualifier complexity during filtering */
  reduceQualifiers?: boolean;
}

/**
 * Information about a single resource after filtering has been applied.
 *
 * @public
 */
export interface FilteredResource {
  /** The resource ID */
  id: string;
  /** Number of candidates before filtering */
  originalCandidateCount: number;
  /** Number of candidates after filtering */
  filteredCandidateCount: number;
  /** Whether this resource has potential filtering issues */
  hasWarning: boolean;
}

/**
 * Complete result of a filtering operation including processed data and analysis.
 *
 * @public
 */
export interface FilterResult {
  /** Whether the filtering operation completed successfully */
  success: boolean;
  /** Analysis of individual resources after filtering */
  filteredResources: FilteredResource[];
  /** The filtered processed resources, if successful */
  processedResources?: ProcessedResources;
  /** Error message if filtering failed */
  error?: string;
  /** Warning messages about potential filtering issues */
  warnings: string[];
}

// Helper function for conditional debug logging
const debugLog = (enableDebug: boolean, ...args: unknown[]) => {
  if (enableDebug) {
    console.log(...args);
  }
};

/**
 * Checks if a filter values object contains any meaningful (non-empty) filter values.
 *
 * Utility function to determine whether filtering should be applied based on
 * the presence of actual filter values. Ignores undefined and empty string values.
 *
 * @example
 * ```typescript
 * import { FilterTools } from '@fgv/ts-res-ui-components';
 *
 * const filterValues = { language: 'en-US', platform: '', region: undefined };
 *
 * if (FilterTools.hasFilterValues(filterValues)) {
 *   console.log('Has active filters'); // Will print this
 *   const result = await FilterTools.createFilteredResourceManagerSimple(resources, filterValues);
 * } else {
 *   console.log('No filters applied');
 * }
 * ```
 *
 * @param values - Object containing filter key-value pairs
 * @returns True if any filter has a meaningful value, false otherwise
 * @public
 */
export function hasFilterValues(values: Record<string, string | undefined>): boolean {
  return Object.values(values).some((value) => value !== undefined && value !== '');
}

/**
 * Creates a human-readable summary string of active filter values.
 *
 * Generates a comma-separated string representation of all non-empty filter values,
 * useful for displaying current filter state to users or in debug output.
 *
 * @example
 * ```typescript
 * import { FilterTools } from '@fgv/ts-res-ui-components';
 *
 * const filterValues = {
 *   language: 'en-US',
 *   platform: 'web',
 *   region: '',
 *   theme: undefined
 * };
 *
 * const summary = FilterTools.getFilterSummary(filterValues);
 * console.log(summary); // "language=en-US, platform=web"
 *
 * // For empty filters
 * const emptyFilters = {};
 * console.log(FilterTools.getFilterSummary(emptyFilters)); // "No filters"
 * ```
 *
 * @param values - Object containing filter key-value pairs
 * @returns Human-readable string summarizing active filters
 * @public
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
/**
 * Creates a filtered resource manager by applying context filters to reduce resource candidates.
 *
 * This function takes an original resource system and applies partial context filtering
 * to create a new resource manager with reduced candidate sets. Useful for creating
 * preview modes, testing specific configurations, or optimizing resource resolution.
 *
 * @example
 * ```typescript
 * import { FilterTools } from '@fgv/ts-res-ui-components';
 *
 * // Basic filtering with partial context
 * const originalResources = getProcessedResources();
 * const filterContext = { language: 'en-US', platform: 'web' };
 *
 * const filteredResult = await FilterTools.createFilteredResourceManagerSimple(
 *   originalResources.system,
 *   filterContext
 * );
 *
 * if (filteredResult.isSuccess()) {
 *   console.log('Filtered resources created successfully');
 *   const analysis = FilterTools.analyzeFilteredResources(
 *     originalResources.summary.resourceIds,
 *     filteredResult.value,
 *     originalResources
 *   );
 *   console.log(`Reduced candidates in ${analysis.filteredResources.length} resources`);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With advanced options and debug logging
 * const result = await FilterTools.createFilteredResourceManagerSimple(
 *   originalSystem,
 *   { language: 'fr-CA', region: 'quebec' },
 *   {
 *     partialContextMatch: true,
 *     enableDebugLogging: true,
 *     reduceQualifiers: false
 *   }
 * );
 *
 * if (result.isFailure()) {
 *   console.error('Filtering failed:', result.message);
 * }
 * ```
 *
 * @param originalSystem - The original resource system to filter
 * @param partialContext - Filter values to apply for candidate reduction
 * @param options - Configuration options for filtering behavior
 * @returns Result containing the filtered ProcessedResources or error message
 * @public
 */
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
/**
 * Analyzes the impact of filtering on resources by comparing original and filtered resource sets.
 *
 * Compares original and filtered resources to provide detailed analysis of how filtering
 * affected each resource's candidate count. Identifies resources with potential issues
 * and provides warnings for resources that may have been over-filtered or have no candidates.
 *
 * @example
 * ```typescript
 * import { FilterTools } from '@fgv/ts-res-ui-components';
 *
 * // After creating filtered resources
 * const originalIds = originalResources.summary.resourceIds;
 * const analysis = FilterTools.analyzeFilteredResources(
 *   originalIds,
 *   filteredResources,
 *   originalResources
 * );
 *
 * if (analysis.success) {
 *   console.log(`Analyzed ${analysis.filteredResources.length} resources`);
 *
 *   // Find resources with significant candidate reduction
 *   const heavilyFiltered = analysis.filteredResources.filter(r =>
 *     r.originalCandidateCount > 5 && r.filteredCandidateCount === 1
 *   );
 *   console.log(`${heavilyFiltered.length} resources heavily filtered`);
 *
 *   // Check for warnings
 *   if (analysis.warnings.length > 0) {
 *     console.warn('Filter warnings:', analysis.warnings);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Using analysis for UI display
 * const analysis = FilterTools.analyzeFilteredResources(resourceIds, filtered, original);
 *
 * const resourcesWithIssues = analysis.filteredResources.filter(r => r.hasWarning);
 * if (resourcesWithIssues.length > 0) {
 *   showWarningDialog(
 *     `${resourcesWithIssues.length} resources may be over-filtered`,
 *     resourcesWithIssues.map(r => r.id)
 *   );
 * }
 * ```
 *
 * @param originalResourceIds - Array of resource IDs from the original system
 * @param filteredProcessedResources - The filtered resource system to analyze
 * @param originalProcessedResources - The original resource system for comparison
 * @returns Analysis result with per-resource filtering impact and warnings
 * @public
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
