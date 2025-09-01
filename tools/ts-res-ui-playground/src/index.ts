/**
 * Public API exports for ts-res-ui-playground
 * Provides reusable utilities and components for other projects
 *
 * ## ObservabilityTools
 * Observability utilities are now available from @fgv/ts-res-ui-components ObservabilityTools namespace.
 */

// Observability utilities are now available from @fgv/ts-res-ui-components ObservabilityTools

// Export custom qualifier types and factories for reuse
export * from './factories';

// Export useful types
export type { Tool } from './types/app';

// Re-export key utilities that might be useful for consumers
export {
  getDefaultSystemConfiguration,
  getAvailablePredefinedConfigurations,
  getPredefinedConfiguration,
  createTsResSystemFromConfig,
  processImportedFiles,
  processImportedDirectory,
  processFileTreeDirectly,
  finalizeProcessing,
  createProcessedResourcesFromManager,
  createSimpleContext
} from './utils/tsResIntegration';

export type { TsResConfig, TsResSystem, ProcessedResources } from './utils/tsResIntegration';
