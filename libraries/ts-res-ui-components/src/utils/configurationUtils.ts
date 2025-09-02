import { Result, succeed, fail } from '@fgv/ts-utils';
import { Config, QualifierTypes, Qualifiers, ResourceTypes } from '@fgv/ts-res';

/**
 * Configuration change tracking
 * @internal
 */
export interface ConfigurationChanges {
  hasChanges: boolean;
  changedSections: string[];
  timestamp: Date;
}

/**
 * Configuration validation result
 * @internal
 */
export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration export options
 * @internal
 */
export interface ConfigurationExportOptions {
  format: 'json' | 'yaml';
  pretty: boolean;
  includeComments?: boolean;
  filename?: string;
}

/**
 * Configuration template using predefined configurations from ts-res
 * @internal
 */
export interface ConfigurationTemplate {
  id: Config.PredefinedSystemConfiguration;
  name: string;
  description: string;
  configuration: Config.Model.ISystemConfiguration;
  category: 'basic' | 'intermediate' | 'advanced';
}

/**
 * Default system configuration
 * @public
 */
export function getDefaultConfiguration(): Config.Model.ISystemConfiguration {
  return Config.getPredefinedDeclaration('default').orThrow();
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
export function validateConfiguration(
  config: Config.Model.ISystemConfiguration
): ConfigurationValidationResult {
  const validate = Config.Convert.validateSystemConfiguration(config);
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
export function cloneConfiguration(
  config: Config.Model.ISystemConfiguration
): Config.Model.ISystemConfiguration {
  return JSON.parse(JSON.stringify(config));
}

/**
 * Compare two configurations for equality
 */
/** @internal */
export function compareConfigurations(
  config1: Config.Model.ISystemConfiguration,
  config2: Config.Model.ISystemConfiguration
): boolean {
  return JSON.stringify(config1) === JSON.stringify(config2);
}

/**
 * Track changes between configurations
 */
/** @internal */
export function trackConfigurationChanges(
  original: Config.Model.ISystemConfiguration,
  current: Config.Model.ISystemConfiguration
): ConfigurationChanges {
  const changedSections: string[] = [];

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
export function exportConfiguration(
  config: Config.Model.ISystemConfiguration,
  options: ConfigurationExportOptions = { format: 'json', pretty: true }
): Result<string> {
  try {
    if (options.format === 'json') {
      return succeed(JSON.stringify(config, null, options.pretty ? 2 : 0));
    } else {
      return fail('YAML export not implemented yet');
    }
  } catch (error) {
    return fail(`Failed to export configuration: ${error instanceof Error ? error.message : String(error)}`);
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
export function importConfiguration(data: string): Result<Config.Model.ISystemConfiguration> {
  try {
    const parsed = JSON.parse(data);
    return Config.Convert.validateSystemConfiguration(parsed);
  } catch (error) {
    return fail(`Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get predefined configuration templates from ts-res
 */
/** @internal */
export function getConfigurationTemplates(): ConfigurationTemplate[] {
  return Config.allPredefinedSystemConfigurations.map((configId) => {
    const config = Config.getPredefinedDeclaration(configId).orThrow();

    // Determine category based on configuration complexity
    let category: 'basic' | 'intermediate' | 'advanced';
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
export function generateConfigurationFilename(configName?: string, format: 'json' | 'yaml' = 'json'): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  const baseName = configName ? `${configName}-config` : 'ts-res-config';
  return `${baseName}-${timestamp}.${format}`;
}
