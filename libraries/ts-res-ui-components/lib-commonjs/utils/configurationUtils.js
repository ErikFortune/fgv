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
var ts_utils_1 = require('@fgv/ts-utils');
/**
 * Default system configuration
 */
function getDefaultConfiguration() {
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
function validateConfiguration(config) {
  var _a;
  var errors = [];
  var warnings = [];
  // Validate qualifierTypes
  if (!config.qualifierTypes || config.qualifierTypes.length === 0) {
    errors.push('Configuration must have at least one qualifier type');
  } else {
    var typeNames_1 = new Set();
    config.qualifierTypes.forEach(function (type, index) {
      var typeName = type.name || '<type-'.concat(index, '>');
      if (!type.name) {
        errors.push('Qualifier type at index '.concat(index, ' is missing a name'));
      } else if (typeNames_1.has(type.name)) {
        errors.push('Duplicate qualifier type name: '.concat(type.name));
      } else {
        typeNames_1.add(type.name);
      }
      if (!type.systemType) {
        errors.push("Qualifier type '".concat(typeName, "' is missing systemType"));
      }
    });
  }
  // Validate qualifiers
  if (!config.qualifiers || config.qualifiers.length === 0) {
    warnings.push('Configuration has no qualifiers defined');
  } else {
    var qualifierNames_1 = new Set();
    var qualifierTypeNames_1 = new Set(
      ((_a = config.qualifierTypes) === null || _a === void 0
        ? void 0
        : _a.map(function (t) {
            return t.name;
          })) || []
    );
    config.qualifiers.forEach(function (qualifier, index) {
      if (!qualifier.name) {
        errors.push('Qualifier at index '.concat(index, ' is missing a name'));
      } else if (qualifierNames_1.has(qualifier.name)) {
        errors.push('Duplicate qualifier name: '.concat(qualifier.name));
      } else {
        qualifierNames_1.add(qualifier.name);
      }
      if (!qualifier.typeName) {
        errors.push("Qualifier '".concat(qualifier.name, "' is missing typeName"));
      } else if (!qualifierTypeNames_1.has(qualifier.typeName)) {
        errors.push(
          "Qualifier '"
            .concat(qualifier.name, "' references unknown qualifier type: ")
            .concat(qualifier.typeName)
        );
      }
      if (qualifier.defaultPriority === undefined || qualifier.defaultPriority < 0) {
        errors.push("Qualifier '".concat(qualifier.name, "' has invalid defaultPriority"));
      }
    });
  }
  // Validate resourceTypes
  if (!config.resourceTypes || config.resourceTypes.length === 0) {
    errors.push('Configuration must have at least one resource type');
  } else {
    var resourceTypeNames_1 = new Set();
    config.resourceTypes.forEach(function (type, index) {
      if (!type.name) {
        errors.push('Resource type at index '.concat(index, ' is missing a name'));
      } else if (resourceTypeNames_1.has(type.name)) {
        errors.push('Duplicate resource type name: '.concat(type.name));
      } else {
        resourceTypeNames_1.add(type.name);
      }
      if (!type.typeName) {
        errors.push("Resource type '".concat(type.name, "' is missing typeName"));
      }
    });
  }
  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}
/**
 * Create a deep copy of a configuration
 */
function cloneConfiguration(config) {
  return JSON.parse(JSON.stringify(config));
}
/**
 * Compare two configurations for equality
 */
function compareConfigurations(config1, config2) {
  return JSON.stringify(config1) === JSON.stringify(config2);
}
/**
 * Track changes between configurations
 */
function trackConfigurationChanges(original, current) {
  var changedSections = [];
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
    changedSections: changedSections,
    timestamp: new Date()
  };
}
/**
 * Export configuration to JSON string
 */
function exportConfiguration(config, options) {
  if (options === void 0) {
    options = { format: 'json', pretty: true };
  }
  try {
    if (options.format === 'json') {
      return (0, ts_utils_1.succeed)(JSON.stringify(config, null, options.pretty ? 2 : 0));
    } else {
      return (0, ts_utils_1.fail)('YAML export not implemented yet');
    }
  } catch (error) {
    return (0, ts_utils_1.fail)(
      'Failed to export configuration: '.concat(error instanceof Error ? error.message : String(error))
    );
  }
}
/**
 * Import configuration from JSON string
 */
function importConfiguration(data) {
  try {
    var parsed = JSON.parse(data);
    // Basic structure validation
    if (!parsed || typeof parsed !== 'object') {
      return (0, ts_utils_1.fail)('Invalid configuration: not an object');
    }
    var validation = validateConfiguration(parsed);
    if (!validation.isValid) {
      return (0, ts_utils_1.fail)('Invalid configuration: '.concat(validation.errors.join(', ')));
    }
    return (0, ts_utils_1.succeed)(parsed);
  } catch (error) {
    return (0, ts_utils_1.fail)(
      'Failed to parse configuration: '.concat(error instanceof Error ? error.message : String(error))
    );
  }
}
/**
 * Get predefined configuration templates
 */
function getConfigurationTemplates() {
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
function generateConfigurationFilename(configName, format) {
  if (format === void 0) {
    format = 'json';
  }
  var timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  var baseName = configName ? ''.concat(configName, '-config') : 'ts-res-config';
  return ''.concat(baseName, '-').concat(timestamp, '.').concat(format);
}
//# sourceMappingURL=configurationUtils.js.map
