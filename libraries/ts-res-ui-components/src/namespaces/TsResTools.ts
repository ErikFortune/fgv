/**
 * Tools and components for ts-res system integration and browsing.
 *
 * This namespace contains SourceView and CompiledView components for browsing ts-res
 * resource structures, plus utility functions for creating ts-res systems from
 * configurations, processing imported files, and converting between different resource formats.
 *
 * @example
 * ```tsx
 * import { TsResTools } from '@fgv/ts-res-ui-components';
 *
 * // Use the SourceView component for browsing source resources
 * <TsResTools.SourceView
 *   resources={processedResources}
 *   onExport={handleExport}
 * />
 *
 * // Use the CompiledView component for browsing compiled resources
 * <TsResTools.CompiledView
 *   resources={processedResources}
 *   filterState={filterState}
 *   filterResult={filterResult}
 * />
 *
 * // Or use utility functions
 * const system = await TsResTools.createTsResSystemFromConfig(config);
 * ```
 *
 * @public
 */

// Export view components for browsing ts-res structures
export { SourceView } from '../components/views/SourceView';
export { CompiledView } from '../components/views/CompiledView';

// Export utility functions
export {
  getDefaultSystemConfiguration,
  createSimpleContext,
  convertImportedDirectoryToFileTree,
  createTsResSystemFromConfig,
  processImportedFiles,
  processImportedDirectory
} from '../utils/tsResIntegration';

// Export view component props
export type { ISourceViewProps, ICompiledViewProps } from '../types';
