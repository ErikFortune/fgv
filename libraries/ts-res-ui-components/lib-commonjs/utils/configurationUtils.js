'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getDefaultConfiguration = getDefaultConfiguration;
exports.validateConfiguration = validateConfiguration;
exports.cloneConfiguration = cloneConfiguration;
exports.compareConfigurations = compareConfigurations;
exports.trackConfigurationChanges = trackConfigurationChanges;
exports.exportConfiguration = exportConfiguration;
exports.importConfiguration = importConfiguration;
exports.getConfigurationTemplates = getConfigurationTemplates;
exports.generateConfigurationFilename = generateConfigurationFilename;
const ts_utils_1 = require('@fgv/ts-utils');
const ts_res_1 = require('@fgv/ts-res');
/**
 * Default system configuration
 * @public
 */
function getDefaultConfiguration() {
  return ts_res_1.Config.getPredefinedDeclaration('default').orThrow();
}
/**
 * Validate a system configuration
 */
/**
 * Validates a ts-res system configuration for completeness and correctness.
 *
 * Performs comprehensive validation of configuration structure, required fields,
 * type relationships, and logical consistency. Returns detailed validation results
 * with specific error and warning messages for debugging and user feedback.
 *
 * @example
 * ```typescript
 * import { ConfigurationTools } from '@fgv/ts-res-ui-components';
 *
 * const config = {
 *   qualifierTypes: [{ name: 'language', systemType: 'language' }],
 *   qualifiers: [{ name: 'en', typeName: 'language', defaultPriority: 100 }],
 *   resourceTypes: [{ name: 'string', defaultValue: '' }]
 * };
 *
 * const validation = ConfigurationTools.validateConfiguration(config);
 * if (!validation.isValid) {
 *   console.error('Configuration errors:', validation.errors);
 *   console.warn('Configuration warnings:', validation.warnings);
 * }
 * ```
 *
 * @param config - The system configuration to validate
 * @returns Validation result with errors, warnings, and validity status
 * @public
 */
function validateConfiguration(config) {
  const validate = ts_res_1.Config.Convert.validateSystemConfiguration(config);
  if (validate.isSuccess()) {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  } else {
    return {
      isValid: false,
      errors: [validate.message],
      warnings: []
    };
  }
}
/**
 * Create a deep copy of a configuration
 */
/**
 * Creates a deep copy of a system configuration object.
 *
 * Performs a deep clone of the configuration to ensure complete isolation
 * from the original. Useful for creating editable copies, implementing undo/redo,
 * or preserving original state during modifications.
 *
 * @example
 * ```typescript
 * import { ConfigurationTools } from '@fgv/ts-res-ui-components';
 *
 * const originalConfig = getSystemConfiguration();
 * const editableConfig = ConfigurationTools.cloneConfiguration(originalConfig);
 *
 * // Modify the clone without affecting the original
 * editableConfig.qualifiers.push(newQualifier);
 * console.log('Original unchanged:', originalConfig.qualifiers.length);
 * console.log('Clone modified:', editableConfig.qualifiers.length);
 * ```
 *
 * @param config - The configuration to clone
 * @returns A deep copy of the configuration
 * @public
 */
function cloneConfiguration(config) {
  return JSON.parse(JSON.stringify(config));
}
/**
 * Compare two configurations for equality
 */
/** @internal */
function compareConfigurations(config1, config2) {
  return JSON.stringify(config1) === JSON.stringify(config2);
}
/**
 * Track changes between configurations
 */
/** @internal */
function trackConfigurationChanges(original, current) {
  const changedSections = [];
  // Check qualifierTypes
  if (JSON.stringify(original.qualifierTypes) !== JSON.stringify(current.qualifierTypes)) {
    changedSections.push('qualifierTypes');
  }
  // Check qualifiers
  if (JSON.stringify(original.qualifiers) !== JSON.stringify(current.qualifiers)) {
    changedSections.push('qualifiers');
  }
  // Check resourceTypes
  if (JSON.stringify(original.resourceTypes) !== JSON.stringify(current.resourceTypes)) {
    changedSections.push('resourceTypes');
  }
  return {
    hasChanges: changedSections.length > 0,
    changedSections,
    timestamp: new Date()
  };
}
/**
 * Export configuration to JSON string
 */
/**
 * Exports a system configuration to a formatted string representation.
 *
 * Converts the configuration object to a serialized format (JSON or YAML) with
 * optional formatting and metadata. Supports pretty-printing for human readability
 * and can include comments and custom filenames for enhanced usability.
 *
 * @example
 * ```typescript
 * import { ConfigurationTools } from '@fgv/ts-res-ui-components';
 *
 * const config = getCurrentConfiguration();
 *
 * // Export as pretty-printed JSON
 * const jsonResult = ConfigurationTools.exportConfiguration(config, {
 *   format: 'json',
 *   pretty: true,
 *   includeComments: true
 * });
 *
 * if (jsonResult.isSuccess()) {
 *   downloadFile(jsonResult.value, 'my-config.json');
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Export as compact JSON for API transmission
 * const compactResult = ConfigurationTools.exportConfiguration(config, {
 *   format: 'json',
 *   pretty: false
 * });
 *
 * if (compactResult.isSuccess()) {
 *   await sendToApi(compactResult.value);
 * }
 * ```
 *
 * @param config - The configuration to export
 * @param options - Export formatting options
 * @returns Result containing the formatted configuration string or error message
 * @public
 */
function exportConfiguration(config, options = { format: 'json', pretty: true }) {
  try {
    if (options.format === 'json') {
      return (0, ts_utils_1.succeed)(JSON.stringify(config, null, options.pretty ? 2 : 0));
    } else {
      return (0, ts_utils_1.fail)('YAML export not implemented yet');
    }
  } catch (error) {
    return (0, ts_utils_1.fail)(
      `Failed to export configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
/**
 * Import configuration from JSON string
 */
/**
 * Imports and validates a system configuration from a serialized string.
 *
 * Parses configuration data from JSON or YAML format and performs validation
 * to ensure the imported configuration is structurally sound and contains
 * required fields. Provides detailed error messages for parsing or validation failures.
 *
 * @example
 * ```typescript
 * import { ConfigurationTools } from '@fgv/ts-res-ui-components';
 *
 * // Import from JSON string
 * const jsonData = '{"qualifierTypes": [...], "qualifiers": [...]}';
 * const importResult = ConfigurationTools.importConfiguration(jsonData);
 *
 * if (importResult.isSuccess()) {
 *   console.log('Configuration imported successfully');
 *   applyConfiguration(importResult.value);
 * } else {
 *   console.error('Import failed:', importResult.message);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Import from file upload
 * const handleFileImport = async (file: File) => {
 *   const text = await file.text();
 *   const result = ConfigurationTools.importConfiguration(text);
 *
 *   if (result.isFailure()) {
 *     showError(`Failed to import ${file.name}: ${result.message}`);
 *     return;
 *   }
 *
 *   // Validate before applying
 *   const validation = ConfigurationTools.validateConfiguration(result.value);
 *   if (!validation.isValid) {
 *     showWarning('Configuration has validation issues', validation.warnings);
 *   }
 *
 *   setConfiguration(result.value);
 * };
 * ```
 *
 * @param data - The serialized configuration string (JSON or YAML)
 * @returns Result containing the parsed configuration or error message
 * @public
 */
function importConfiguration(data) {
  try {
    const parsed = JSON.parse(data);
    return ts_res_1.Config.Convert.validateSystemConfiguration(parsed);
  } catch (error) {
    return (0, ts_utils_1.fail)(
      `Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
/**
 * Get predefined configuration templates from ts-res
 */
/** @internal */
function getConfigurationTemplates() {
  return ts_res_1.Config.allPredefinedSystemConfigurations.map((configId) => {
    const config = ts_res_1.Config.getPredefinedDeclaration(configId).orThrow();
    // Determine category based on configuration complexity
    let category;
    if (configId === 'default') {
      category = 'basic';
    } else if (configId === 'extended-example') {
      category = 'advanced';
    } else {
      category = 'intermediate';
    }
    return {
      id: configId,
      name: config.name || `${configId.charAt(0).toUpperCase() + configId.slice(1).replace(/-/g, ' ')}`,
      description: config.description || `Predefined ${configId} system configuration`,
      category,
      configuration: config
    };
  });
}
/**
 * Generate a filename for configuration export
 */
/** @internal */
function generateConfigurationFilename(configName, format = 'json') {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const baseName = configName ? `${configName}-config` : 'ts-res-config';
  return `${baseName}-${timestamp}.${format}`;
}
//# sourceMappingURL=configurationUtils.js.map
