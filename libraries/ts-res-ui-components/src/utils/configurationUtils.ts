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
 * Predefined configuration templates
 * @internal
 */
export interface ConfigurationTemplate {
  id: string;
  name: string;
  description: string;
  configuration: Config.Model.ISystemConfiguration;
  category: 'basic' | 'intermediate' | 'advanced' | 'enterprise';
}

/**
 * Default system configuration
 * @public
 */
export function getDefaultConfiguration(): Config.Model.ISystemConfiguration {
  return {
    qualifierTypes: [
      {
        name: 'language',
        systemType: 'language'
      },
      {
        name: 'territory',
        systemType: 'territory'
      }
    ],
    qualifiers: [
      {
        name: 'language',
        typeName: 'language',
        defaultPriority: 100,
        token: 'lang'
      },
      {
        name: 'territory',
        typeName: 'territory',
        defaultPriority: 90,
        token: 'territory'
      }
    ],
    resourceTypes: [
      {
        name: 'string',
        typeName: 'string'
      },
      {
        name: 'object',
        typeName: 'object'
      }
    ]
  };
}

/**
 * Validate a system configuration
 */
/** @public */
export function validateConfiguration(
  config: Config.Model.ISystemConfiguration
): ConfigurationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate qualifierTypes
  if (!config.qualifierTypes || config.qualifierTypes.length === 0) {
    errors.push('Configuration must have at least one qualifier type');
  } else {
    const typeNames = new Set<string>();
    (config.qualifierTypes as QualifierTypes.Config.ISystemQualifierTypeConfig[]).forEach((type, index) => {
      const typeName = type.name || `<type-${index}>`;

      if (!type.name) {
        errors.push(`Qualifier type at index ${index} is missing a name`);
      } else if (typeNames.has(type.name)) {
        errors.push(`Duplicate qualifier type name: ${type.name}`);
      } else {
        typeNames.add(type.name);
      }

      if (!type.systemType) {
        errors.push(`Qualifier type '${typeName}' is missing systemType`);
      }
    });
  }

  // Validate qualifiers
  if (!config.qualifiers || config.qualifiers.length === 0) {
    warnings.push('Configuration has no qualifiers defined');
  } else {
    const qualifierNames = new Set<string>();
    const qualifierTypeNames = new Set(config.qualifierTypes?.map((t) => t.name) || []);

    (config.qualifiers as Qualifiers.IQualifierDecl[]).forEach((qualifier, index) => {
      if (!qualifier.name) {
        errors.push(`Qualifier at index ${index} is missing a name`);
      } else if (qualifierNames.has(qualifier.name)) {
        errors.push(`Duplicate qualifier name: ${qualifier.name}`);
      } else {
        qualifierNames.add(qualifier.name);
      }

      if (!qualifier.typeName) {
        errors.push(`Qualifier '${qualifier.name}' is missing typeName`);
      } else if (!qualifierTypeNames.has(qualifier.typeName)) {
        errors.push(`Qualifier '${qualifier.name}' references unknown qualifier type: ${qualifier.typeName}`);
      }

      if (qualifier.defaultPriority === undefined || qualifier.defaultPriority < 0) {
        errors.push(`Qualifier '${qualifier.name}' has invalid defaultPriority`);
      }
    });
  }

  // Validate resourceTypes
  if (!config.resourceTypes || config.resourceTypes.length === 0) {
    errors.push('Configuration must have at least one resource type');
  } else {
    const resourceTypeNames = new Set<string>();
    (config.resourceTypes as ResourceTypes.Config.IResourceTypeConfig[]).forEach((type, index) => {
      if (!type.name) {
        errors.push(`Resource type at index ${index} is missing a name`);
      } else if (resourceTypeNames.has(type.name)) {
        errors.push(`Duplicate resource type name: ${type.name}`);
      } else {
        resourceTypeNames.add(type.name);
      }

      if (!type.typeName) {
        errors.push(`Resource type '${type.name}' is missing typeName`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create a deep copy of a configuration
 */
/** @public */
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
/** @public */
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
/** @public */
export function importConfiguration(data: string): Result<Config.Model.ISystemConfiguration> {
  try {
    const parsed = JSON.parse(data);

    // Basic structure validation
    if (!parsed || typeof parsed !== 'object') {
      return fail('Invalid configuration: not an object');
    }

    const validation = validateConfiguration(parsed);
    if (!validation.isValid) {
      return fail(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    return succeed(parsed as Config.Model.ISystemConfiguration);
  } catch (error) {
    return fail(`Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get predefined configuration templates
 */
/** @internal */
export function getConfigurationTemplates(): ConfigurationTemplate[] {
  return [
    {
      id: 'basic',
      name: 'Basic Configuration',
      description: 'Simple language and territory-based configuration',
      category: 'basic',
      configuration: getDefaultConfiguration()
    },
    {
      id: 'multilingual',
      name: 'Multilingual Application',
      description: 'Configuration for applications with multiple languages and regions',
      category: 'intermediate',
      configuration: {
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language'
          },
          {
            name: 'territory',
            systemType: 'territory'
          },
          {
            name: 'platform',
            systemType: 'literal'
          }
        ],
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100,
            token: 'lang'
          },
          {
            name: 'territory',
            typeName: 'territory',
            defaultPriority: 90,
            token: 'territory'
          },
          {
            name: 'platform',
            typeName: 'platform',
            defaultPriority: 80,
            token: 'platform'
          }
        ],
        resourceTypes: [
          {
            name: 'string',
            typeName: 'string'
          },
          {
            name: 'object',
            typeName: 'object'
          },
          {
            name: 'array',
            typeName: 'array'
          }
        ]
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise Configuration',
      description: 'Complex configuration for enterprise applications with roles and departments',
      category: 'enterprise',
      configuration: {
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language'
          },
          {
            name: 'territory',
            systemType: 'territory'
          },
          {
            name: 'role',
            systemType: 'literal'
          },
          {
            name: 'department',
            systemType: 'literal'
          },
          {
            name: 'securityLevel',
            systemType: 'literal'
          }
        ],
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100,
            token: 'lang'
          },
          {
            name: 'territory',
            typeName: 'territory',
            defaultPriority: 95,
            token: 'territory'
          },
          {
            name: 'role',
            typeName: 'role',
            defaultPriority: 90,
            token: 'role'
          },
          {
            name: 'department',
            typeName: 'department',
            defaultPriority: 85,
            token: 'dept'
          },
          {
            name: 'securityLevel',
            typeName: 'securityLevel',
            defaultPriority: 80,
            token: 'security'
          }
        ],
        resourceTypes: [
          {
            name: 'string',
            typeName: 'string'
          },
          {
            name: 'localizedString',
            typeName: 'string'
          },
          {
            name: 'config',
            typeName: 'object'
          },
          {
            name: 'permissions',
            typeName: 'array'
          },
          {
            name: 'settings',
            typeName: 'object'
          }
        ]
      }
    }
  ];
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
