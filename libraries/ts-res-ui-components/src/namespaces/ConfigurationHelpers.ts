/**
 * Helper functions and utilities for ts-res system configuration management.
 *
 * This namespace contains functions for creating, validating, and managing
 * ts-res system configurations, including templates and export/import operations.
 *
 * @example
 * ```tsx
 * import { ConfigurationHelpers } from '@fgv/ts-res-ui-components';
 *
 * // Get default configuration
 * const config = ConfigurationHelpers.getDefaultConfiguration();
 *
 * // Validate configuration
 * const validation = ConfigurationHelpers.validateConfiguration(config);
 * if (validation.isValid) {
 *   // Configuration is valid
 * }
 *
 * // Export configuration
 * const exported = ConfigurationHelpers.exportConfiguration(config, {
 *   format: 'json',
 *   pretty: true
 * });
 * ```
 *
 * @public
 */

export {
  getDefaultConfiguration,
  validateConfiguration,
  cloneConfiguration,
  exportConfiguration,
  importConfiguration
} from '../utils/configurationUtils';
