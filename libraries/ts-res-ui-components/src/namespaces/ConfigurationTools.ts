/**
 * Tools and components for ts-res system configuration management.
 *
 * This namespace contains the ConfigurationView component and utility functions
 * for creating, validating, and managing ts-res system configurations, including
 * templates and export/import operations.
 *
 * @example
 * ```tsx
 * import { ConfigurationTools } from '@fgv/ts-res-ui-components';
 *
 * // Use the ConfigurationView component
 * <ConfigurationTools.ConfigurationView
 *   configuration={systemConfiguration}
 *   onConfigurationChange={handleConfigChange}
 *   onSave={handleSave}
 *   hasUnsavedChanges={hasChanges}
 *   onMessage={onMessage}
 * />
 *
 * // Or use utility functions
 * const config = ConfigurationTools.getDefaultConfiguration();
 * const validation = ConfigurationTools.validateConfiguration(config);
 * ```
 *
 * @public
 */

// Export the main ConfigurationView component
export { ConfigurationView } from '../components/views/ConfigurationView';

// Export domain-specific hook
export { useConfigurationState } from '../hooks/useConfigurationState';

// Export utility functions
export {
  getDefaultConfiguration,
  validateConfiguration,
  cloneConfiguration,
  exportConfiguration,
  importConfiguration
} from '../utils/configurationUtils';

// Export types related to configuration management
export type { ConfigurationViewProps } from '../types';
