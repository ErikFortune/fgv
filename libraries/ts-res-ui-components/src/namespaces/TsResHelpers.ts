/**
 * Helper functions and utilities for ts-res system integration.
 *
 * This namespace contains functions for creating ts-res systems from configurations,
 * processing imported files, and converting between different resource formats.
 *
 * @example
 * ```tsx
 * import { TsResHelpers } from '@fgv/ts-res-ui-components';
 *
 * // Create simple context
 * const context = TsResHelpers.createSimpleContext({
 *   language: 'en-US',
 *   platform: 'web'
 * });
 *
 * // Create ts-res system from configuration
 * const system = await TsResHelpers.createTsResSystemFromConfig(config);
 *
 * // Process imported files
 * const result = await TsResHelpers.processImportedFiles(files, config);
 * ```
 *
 * @public
 */

export {
  getDefaultSystemConfiguration,
  createSimpleContext,
  convertImportedDirectoryToFileTree,
  createTsResSystemFromConfig,
  processImportedFiles,
  processImportedDirectory
} from '../utils/tsResIntegration';
