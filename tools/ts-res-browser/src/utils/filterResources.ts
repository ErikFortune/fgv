import { Result, succeed } from '@fgv/ts-utils';
import { Config, Context, ResourceJson, Runtime, Import } from '@fgv/ts-res';
import { ResourceManagerBuilder } from '@fgv/ts-res/src/packlets/resources/resourceManagerBuilder';
import {
  ProcessedResources,
  TsResSystem,
  createSimpleContext,
  createTsResSystemFromConfig
} from './tsResIntegration';

export interface FilterOptions {
  partialContextMatch?: boolean;
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
export const createFilteredResourceManager = async (
  originalSystem: TsResSystem,
  partialContext: Record<string, string>,
  options: FilterOptions = { partialContextMatch: true }
): Promise<Result<ProcessedResources>> => {
  try {
    console.log('=== FILTER CREATION DEBUG ===');
    console.log('Original system:', originalSystem);
    console.log('Partial context:', partialContext);
    console.log('Options:', options);

    // Validate the original system has required components
    if (!originalSystem) {
      return Result.failure('Original system is undefined - ensure resources are loaded before filtering');
    }

    console.log('System validation - qualifiers:', originalSystem.qualifiers);
    console.log('System validation - resourceTypes:', originalSystem.resourceTypes);
    console.log('System validation - resourceManager:', originalSystem.resourceManager);

    if (!originalSystem.qualifiers) {
      return Result.failure(
        'Original system qualifiers are undefined - system may not be properly initialized'
      );
    }

    if (!originalSystem.resourceTypes) {
      return Result.failure(
        'Original system resourceTypes are undefined - system may not be properly initialized'
      );
    }

    if (!originalSystem.resourceManager) {
      return Result.failure(
        'Original system resourceManager is undefined - system may not be properly initialized'
      );
    }

    // Additional validation for the objects themselves
    if (typeof originalSystem.qualifiers !== 'object') {
      return Result.failure(
        `Original system qualifiers has invalid type: ${typeof originalSystem.qualifiers}`
      );
    }

    if (typeof originalSystem.resourceTypes !== 'object') {
      return Result.failure(
        `Original system resourceTypes has invalid type: ${typeof originalSystem.resourceTypes}`
      );
    }

    // Create validated context from user input
    console.log('Creating validated context...');
    console.log('Partial context (raw):', partialContext);

    // Filter out empty string values - only include qualifiers with actual values
    const cleanedContext = Object.fromEntries(
      Object.entries(partialContext).filter(([, value]) => value.trim() !== '')
    );

    console.log('Cleaned context (empty strings removed):', cleanedContext);
    console.log('Available qualifiers:', originalSystem.qualifiers);

    const contextResult = Context.Convert.validatedContextDecl.convert(cleanedContext, {
      qualifiers: originalSystem.qualifiers
    });

    if (contextResult.isFailure()) {
      console.error('Context creation failed:', contextResult.message);
      return Result.failure(`Failed to create context: ${contextResult.message}`);
    }

    const validatedContext = contextResult.value;
    console.log('Validated context created:', validatedContext);

    // Get filtered resource builders that match the context
    console.log('Getting resources for context...');
    console.log('Validated context:', validatedContext);
    console.log('Filter options:', options);

    const filteredResourceBuilders = originalSystem.resourceManager.getResourcesForContext(
      validatedContext,
      options
    );

    console.log('Filtered resource builders count:', filteredResourceBuilders.length);
    console.log('Filtered resource builders:', filteredResourceBuilders);

    // Convert filtered resources to declarations
    const resourceDeclarations: ResourceJson.Json.ILooseResourceDecl[] = [];

    for (const resourceBuilder of filteredResourceBuilders) {
      const builtResourceResult = resourceBuilder.build();
      if (builtResourceResult.isFailure()) {
        console.warn(`Failed to build resource: ${builtResourceResult.message}`);
        continue;
      }

      const builtResource = builtResourceResult.value;
      const declaration = builtResource.toLooseResourceDecl();
      resourceDeclarations.push(declaration);
    }

    // Validate system components before creating new manager
    if (!originalSystem.qualifiers) {
      return Result.failure('Original system qualifiers is undefined');
    }
    if (!originalSystem.resourceTypes) {
      return Result.failure('Original system resourceTypes is undefined');
    }

    // Create new ResourceManagerBuilder with same configuration
    console.log('Creating new resource manager...');
    console.log('Qualifiers for new manager:', originalSystem.qualifiers);
    console.log('ResourceTypes for new manager:', originalSystem.resourceTypes);

    const newManagerResult = ResourceManagerBuilder.create({
      qualifiers: originalSystem.qualifiers,
      resourceTypes: originalSystem.resourceTypes
    });

    if (newManagerResult.isFailure()) {
      console.error('New manager creation failed:', newManagerResult.message, newManagerResult);
      return Result.failure(`Failed to create new manager: ${newManagerResult.message}`);
    }

    const newManager = newManagerResult.value;
    console.log('New manager created successfully:', newManager);

    // Add each filtered resource to the new manager
    for (const declaration of resourceDeclarations) {
      const addResult = newManager.addResource(declaration);
      if (addResult.isFailure()) {
        console.warn(`Failed to add resource ${declaration.id}: ${addResult.message}`);
      }
    }

    // Create new ImportManager for the filtered system
    const newImportManagerResult = Import.ImportManager.create({
      resources: newManager
    });

    if (newImportManagerResult.isFailure()) {
      return Result.failure(`Failed to create filtered import manager: ${newImportManagerResult.message}`);
    }

    // Create new ContextQualifierProvider for the filtered system
    // Validate qualifiers again before using them
    if (!originalSystem.qualifiers) {
      return Result.failure('Original system qualifiers became undefined during processing');
    }

    const newContextQualifierProviderResult = Runtime.ValidatingSimpleContextQualifierProvider.create({
      qualifiers: originalSystem.qualifiers
    });

    if (newContextQualifierProviderResult.isFailure()) {
      return Result.failure(
        `Failed to create filtered context provider: ${newContextQualifierProviderResult.message}`
      );
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
      return Result.failure(`Failed to compile filtered resources: ${compiledResult.message}`);
    }

    const resolverResult = Runtime.ResourceResolver.create({
      resourceManager: filteredSystem.resourceManager,
      qualifierTypes: filteredSystem.qualifierTypes,
      contextQualifierProvider: filteredSystem.contextQualifierProvider
    });

    if (resolverResult.isFailure()) {
      return Result.failure(`Failed to create filtered resolver: ${resolverResult.message}`);
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
    return Result.failure(
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
  try {
    // Validate inputs first
    if (!originalSystem?.qualifiers || !originalSystem?.resourceTypes || !originalSystem?.resourceManager) {
      return Result.failure('Original system is missing required components');
    }

    // Create a fresh system using the original system's configuration
    const freshSystemResult = createTsResSystemFromConfig();

    if (freshSystemResult.isFailure()) {
      return Result.failure(`Failed to create fresh system: ${freshSystemResult.message}`);
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
      return Result.failure(`Failed to create context: ${contextResult.message}`);
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
        console.warn(`Failed to build resource: ${builtResourceResult.message}`);
        continue;
      }

      const builtResource = builtResourceResult.value;
      const declaration = builtResource.toLooseResourceDecl();

      const addResult = freshSystem.resourceManager.addResource(declaration);
      if (addResult.isFailure()) {
        console.warn(`Failed to add resource ${declaration.id}: ${addResult.message}`);
      }
    }

    // Finalize the fresh system similar to how it's done in tsResIntegration
    const compiledResult = freshSystem.resourceManager.getCompiledResourceCollection({
      includeMetadata: true
    });
    if (compiledResult.isFailure()) {
      return Result.failure(`Failed to compile filtered resources: ${compiledResult.message}`);
    }

    const resolverResult = Runtime.ResourceResolver.create({
      resourceManager: freshSystem.resourceManager,
      qualifierTypes: freshSystem.qualifierTypes,
      contextQualifierProvider: freshSystem.contextQualifierProvider
    });

    if (resolverResult.isFailure()) {
      return Result.failure(`Failed to create filtered resolver: ${resolverResult.message}`);
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
    return Result.failure(
      `Unexpected error during alternative filtering: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
