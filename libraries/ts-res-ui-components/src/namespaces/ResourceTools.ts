/**
 * Tools and hooks for resource data management and orchestration.
 *
 * This namespace contains the core data management functionality for ts-res resources,
 * including the main orchestrator hook that handles resource import, processing, configuration,
 * and resolution. This is the primary entry point for managing resource data state.
 *
 * @example
 * ```typescript
 * import { ResourceTools } from '@fgv/ts-res-ui-components';
 *
 * function ResourceManager() {
 *   const { state, actions } = ResourceTools.useResourceData();
 *
 *   const handleFileImport = async (files: ImportedFile[]) => {
 *     await actions.processFiles(files);
 *     if (state.error) {
 *       console.error('Import failed:', state.error);
 *     } else {
 *       console.log('Resources processed:', state.processedResources);
 *     }
 *   };
 *
 *   return React.createElement('div', {},
 *     React.createElement('button',
 *       { onClick: () => handleFileImport(importedFiles) },
 *       'Process Resources'
 *     ),
 *     state.isProcessing && React.createElement('div', {}, 'Processing...'),
 *     state.error && React.createElement('div', { className: 'error' }, state.error)
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Resource resolution example
 * import { ResourceTools } from '@fgv/ts-res-ui-components';
 *
 * function ResourceResolver() {
 *   const { state, actions } = ResourceTools.useResourceData();
 *
 *   const resolveResource = async (resourceId: string, context: Record<string, string>) => {
 *     const result = await actions.resolveResource(resourceId, context);
 *     if (result.isSuccess()) {
 *       console.log('Resolved:', result.value);
 *     } else {
 *       console.error('Resolution failed:', result.message);
 *     }
 *   };
 *
 *   // Only show resolver if we have processed resources
 *   if (!state.processedResources) {
 *     return React.createElement('div', {}, 'No resources loaded');
 *   }
 *
 *   return React.createElement('button', {
 *     onClick: () => resolveResource('user.welcome', { language: 'en-US' })
 *   }, 'Resolve Resource');
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Configuration and bundle processing
 * import { ResourceTools } from '@fgv/ts-res-ui-components';
 *
 * function ConfigurationManager() {
 *   const { state, actions } = ResourceTools.useResourceData();
 *
 *   const applyNewConfiguration = (config: Config.Model.ISystemConfiguration) => {
 *     actions.applyConfiguration(config);
 *     console.log('Configuration applied:', state.activeConfiguration);
 *   };
 *
 *   const processBundleFile = async (bundle: Bundle.IBundle) => {
 *     await actions.processBundleFile(bundle);
 *     if (state.isLoadedFromBundle) {
 *       console.log('Bundle loaded:', state.bundleMetadata);
 *     }
 *   };
 *
 *   return React.createElement('div', {},
 *     React.createElement('h3', {}, 'Resource Orchestrator'),
 *     React.createElement('p', {}, `Has data: ${state.hasProcessedData}`),
 *     React.createElement('p', {}, `From bundle: ${state.isLoadedFromBundle}`)
 *   );
 * }
 * ```
 *
 * @public
 */

// Export the main resource data orchestrator hook
export { useResourceData } from '../hooks/useResourceData';

// Export types related to resource management and processing
export type {
  ProcessedResources,
  ExtendedProcessedResources,
  ResourceManagerState,
  ResourceEditorFactory,
  ResourceEditorResult,
  ResourceEditorProps,
  ResourceDetailData
} from '../types';
