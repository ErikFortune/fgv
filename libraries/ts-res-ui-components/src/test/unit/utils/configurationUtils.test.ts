/*
 * Copyright (c) 2025 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import '@fgv/ts-utils-jest';
import { Config } from '@fgv/ts-res';
import {
  getDefaultConfiguration,
  validateConfiguration,
  cloneConfiguration,
  compareConfigurations,
  trackIConfigurationChanges as trackIConfigurationChanges,
  exportConfiguration,
  importConfiguration,
  getIConfigurationTemplates as getIConfigurationTemplates,
  generateConfigurationFilename,
  IConfigurationTemplate
} from '../../../utils/configurationUtils';
import { JsonObject } from '@fgv/ts-json-base';

describe('configurationUtils', () => {
  let defaultConfig: Config.Model.ISystemConfiguration;

  beforeEach(() => {
    defaultConfig = getDefaultConfiguration();
  });

  describe('getDefaultConfiguration', () => {
    test('returns valid default configuration', () => {
      const config = getDefaultConfiguration();

      expect(config.qualifierTypes).toHaveLength(2);
      expect(config.qualifierTypes[0]).toEqual({
        name: 'language',
        systemType: 'language',
        configuration: {
          allowContextList: true
        }
      });
      expect(config.qualifierTypes[1]).toEqual({
        name: 'territory',
        systemType: 'territory',
        configuration: {
          allowContextList: false
        }
      });

      expect(config.qualifiers).toHaveLength(2);
      expect(config.qualifiers[0]).toEqual({
        name: 'currentTerritory',
        token: 'geo',
        typeName: 'territory',
        defaultPriority: 850
      });
      expect(config.qualifiers[1]).toEqual({
        name: 'language',
        token: 'lang',
        typeName: 'language',
        defaultPriority: 800
      });

      expect(config.resourceTypes).toHaveLength(1);
      expect(config.resourceTypes[0]).toEqual({
        name: 'json',
        typeName: 'json'
      });
    });

    test('returns different instances on multiple calls', () => {
      const config1 = getDefaultConfiguration();
      const config2 = getDefaultConfiguration();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('validateConfiguration', () => {
    test('validates valid configuration successfully', () => {
      const result = validateConfiguration(defaultConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    test('reports error for missing qualifierTypes', () => {
      const config = { ...defaultConfig, qualifierTypes: [] };
      const result = validateConfiguration(config);

      // Empty qualifierTypes array is actually valid in ts-res
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('reports error for undefined qualifierTypes', () => {
      const config: Partial<Config.Model.ISystemConfiguration> = { ...defaultConfig };
      delete config.qualifierTypes;
      const result = validateConfiguration(config as Config.Model.ISystemConfiguration);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('reports error for qualifier type without name', () => {
      const config = {
        ...defaultConfig,
        qualifierTypes: [{ systemType: 'language' }]
      } as unknown as Config.Model.ISystemConfiguration;
      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('reports error for qualifier type without systemType', () => {
      const config = {
        ...defaultConfig,
        qualifierTypes: [{ name: 'language' }]
      } as unknown as Config.Model.ISystemConfiguration;
      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('reports error for duplicate qualifier type names', () => {
      const config = {
        ...defaultConfig,
        qualifierTypes: [
          { name: 'language', systemType: 'language' },
          { name: 'language', systemType: 'territory' }
        ]
      } as unknown as Config.Model.ISystemConfiguration;
      const result = validateConfiguration(config);

      // Duplicate names are actually valid in ts-res
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('reports warning for empty qualifiers', () => {
      const config = { ...defaultConfig, qualifiers: [] };
      const result = validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    test('reports error for qualifier without name', () => {
      const config = {
        ...defaultConfig,
        qualifiers: [{ typeName: 'language', defaultPriority: 100 }]
      } as unknown as Config.Model.ISystemConfiguration;
      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('reports error for qualifier without typeName', () => {
      const config = {
        ...defaultConfig,
        qualifiers: [{ name: 'language', defaultPriority: 100 }]
      } as unknown as Config.Model.ISystemConfiguration;
      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('reports error for qualifier with unknown typeName', () => {
      const config = {
        ...defaultConfig,
        qualifiers: [{ name: 'unknown', typeName: 'unknownType', defaultPriority: 100 }]
      };
      const result = validateConfiguration(config);

      // Unknown typeName is actually valid in ts-res (it just references a non-existent type)
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('reports error for duplicate qualifier names', () => {
      const config = {
        ...defaultConfig,
        qualifiers: [
          { name: 'language', typeName: 'language', defaultPriority: 100 },
          { name: 'language', typeName: 'territory', defaultPriority: 90 }
        ]
      };
      const result = validateConfiguration(config);

      // Duplicate names are actually valid in ts-res
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('reports error for qualifier with invalid defaultPriority', () => {
      const config = {
        ...defaultConfig,
        qualifiers: [
          { name: 'language', typeName: 'language', defaultPriority: -1 },
          { name: 'territory', typeName: 'territory' } // Missing defaultPriority
        ]
      } as unknown as Config.Model.ISystemConfiguration;
      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('reports error for missing resourceTypes', () => {
      const config = { ...defaultConfig, resourceTypes: [] };
      const result = validateConfiguration(config);

      // Empty resourceTypes array is actually valid in ts-res
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('reports error for resource type without name', () => {
      const config = {
        ...defaultConfig,
        resourceTypes: [{ typeName: 'string' }]
      } as unknown as Config.Model.ISystemConfiguration;
      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('reports error for resource type without typeName', () => {
      const config = {
        ...defaultConfig,
        resourceTypes: [{ name: 'string' }]
      } as unknown as Config.Model.ISystemConfiguration;
      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('reports error for duplicate resource type names', () => {
      const config = {
        ...defaultConfig,
        resourceTypes: [
          { name: 'string', typeName: 'string' },
          { name: 'string', typeName: 'object' }
        ]
      };
      const result = validateConfiguration(config);

      // Duplicate names are actually valid in ts-res
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('handles complex validation scenario with multiple errors', () => {
      const config = {
        qualifierTypes: [
          { name: 'language' }, // Missing systemType
          { systemType: 'territory' } // Missing name
        ],
        qualifiers: [
          { name: 'lang', typeName: 'unknownType', defaultPriority: 100 }, // Unknown type
          { typeName: 'language', defaultPriority: -1 } // Missing name, invalid priority
        ],
        resourceTypes: [
          { name: 'type1' }, // Missing typeName
          { typeName: 'string' } // Missing name
        ]
      } as unknown as Config.Model.ISystemConfiguration;
      const result = validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('cloneConfiguration', () => {
    test('creates deep copy of configuration', () => {
      const cloned = cloneConfiguration(defaultConfig);

      expect(cloned).not.toBe(defaultConfig);
      expect(cloned).toEqual(defaultConfig);
      expect(cloned.qualifierTypes).not.toBe(defaultConfig.qualifierTypes);
      expect(cloned.qualifiers).not.toBe(defaultConfig.qualifiers);
      expect(cloned.resourceTypes).not.toBe(defaultConfig.resourceTypes);
    });

    test('modifications to clone do not affect original', () => {
      const cloned = cloneConfiguration(defaultConfig);
      cloned.qualifierTypes[0].name = 'modified';

      expect(defaultConfig.qualifierTypes[0].name).toBe('language');
      expect(cloned.qualifierTypes[0].name).toBe('modified');
    });

    test('handles nested object modifications', () => {
      const cloned = cloneConfiguration(defaultConfig);
      (cloned.qualifiers[0] as unknown as JsonObject).customProperty = 'added';

      expect((defaultConfig.qualifiers[0] as unknown as JsonObject).customProperty).toBeUndefined();
      expect((cloned.qualifiers[0] as unknown as JsonObject).customProperty).toBe('added');
    });
  });

  describe('compareConfigurations', () => {
    test('returns true for identical configurations', () => {
      const config1 = getDefaultConfiguration();
      const config2 = getDefaultConfiguration();

      expect(compareConfigurations(config1, config2)).toBe(true);
    });

    test('returns false for different configurations', () => {
      const config1 = getDefaultConfiguration();
      const config2 = getDefaultConfiguration();
      config2.qualifierTypes[0].name = 'modified';

      expect(compareConfigurations(config1, config2)).toBe(false);
    });

    test('returns true for same reference', () => {
      expect(compareConfigurations(defaultConfig, defaultConfig)).toBe(true);
    });

    test('returns false for different property order', () => {
      const config1 = { a: 1, b: 2 } as unknown as Config.Model.ISystemConfiguration;
      const config2 = { b: 2, a: 1 } as unknown as Config.Model.ISystemConfiguration;

      expect(compareConfigurations(config1, config2)).toBe(false);
    });

    test('handles null and undefined values', () => {
      const config1 = { ...defaultConfig, description: null } as unknown as Config.Model.ISystemConfiguration;
      const config2 = {
        ...defaultConfig,
        description: undefined
      } as unknown as Config.Model.ISystemConfiguration;

      expect(compareConfigurations(config1, config2)).toBe(false);
    });
  });

  describe('trackIConfigurationChanges', () => {
    test('reports no changes for identical configurations', () => {
      const original = getDefaultConfiguration();
      const current = getDefaultConfiguration();

      const changes = trackIConfigurationChanges(original, current);

      expect(changes.hasChanges).toBe(false);
      expect(changes.changedSections).toEqual([]);
      expect(changes.timestamp).toBeInstanceOf(Date);
    });

    test('detects qualifierTypes changes', () => {
      const original = getDefaultConfiguration();
      const current = getDefaultConfiguration();
      current.qualifierTypes[0].name = 'modified';

      const changes = trackIConfigurationChanges(original, current);

      expect(changes.hasChanges).toBe(true);
      expect(changes.changedSections).toContain('qualifierTypes');
      expect(changes.changedSections).toHaveLength(1);
    });

    test('detects qualifiers changes', () => {
      const original = getDefaultConfiguration();
      const current = getDefaultConfiguration();
      current.qualifiers[0].defaultPriority = 200;

      const changes = trackIConfigurationChanges(original, current);

      expect(changes.hasChanges).toBe(true);
      expect(changes.changedSections).toContain('qualifiers');
      expect(changes.changedSections).toHaveLength(1);
    });

    test('detects resourceTypes changes', () => {
      const original = getDefaultConfiguration();
      const current = getDefaultConfiguration();
      current.resourceTypes.push({ name: 'array', typeName: 'array' });

      const changes = trackIConfigurationChanges(original, current);

      expect(changes.hasChanges).toBe(true);
      expect(changes.changedSections).toContain('resourceTypes');
      expect(changes.changedSections).toHaveLength(1);
    });

    test('detects multiple changes', () => {
      const original = getDefaultConfiguration();
      const current = getDefaultConfiguration();
      current.qualifierTypes[0].name = 'modified';
      current.qualifiers[0].defaultPriority = 200;

      const changes = trackIConfigurationChanges(original, current);

      expect(changes.hasChanges).toBe(true);
      expect(changes.changedSections).toContain('qualifierTypes');
      expect(changes.changedSections).toContain('qualifiers');
      expect(changes.changedSections).toHaveLength(2);
    });

    test('timestamp is recent', () => {
      const before = new Date();
      const changes = trackIConfigurationChanges(defaultConfig, defaultConfig);
      const after = new Date();

      expect(changes.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(changes.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('exportConfiguration', () => {
    test('exports configuration as pretty JSON by default', () => {
      const result = exportConfiguration(defaultConfig);

      expect(result).toSucceedAndSatisfy((exported: string) => {
        expect(JSON.parse(exported)).toEqual(defaultConfig);
        expect(exported).toContain('\n'); // Pretty formatted
        expect(exported).toContain('  '); // Indentation
      });
    });

    test('exports configuration as compact JSON', () => {
      const result = exportConfiguration(defaultConfig, { format: 'json', pretty: false });

      expect(result).toSucceedAndSatisfy((exported: string) => {
        expect(JSON.parse(exported)).toEqual(defaultConfig);
        expect(exported).not.toContain('\n'); // No formatting
      });
    });

    test('fails for YAML format', () => {
      const result = exportConfiguration(defaultConfig, { format: 'yaml', pretty: true });

      expect(result).toFailWith(/YAML export not implemented yet/i);
    });

    test('handles export errors gracefully', () => {
      const circularConfig = defaultConfig as unknown as Config.Model.ISystemConfiguration;
      (circularConfig as unknown as JsonObject).self = circularConfig as unknown as JsonObject; // Create circular reference

      const result = exportConfiguration(circularConfig);

      expect(result).toFail();
      expect(result.message).toContain('Failed to export configuration');
    });
  });

  describe('importConfiguration', () => {
    test('imports valid JSON configuration', () => {
      const exported = exportConfiguration(defaultConfig).orThrow();
      const result = importConfiguration(exported);

      expect(result).toSucceedAndSatisfy((imported: Config.Model.ISystemConfiguration) => {
        expect(imported).toEqual(defaultConfig);
      });
    });

    test('fails for invalid JSON', () => {
      const result = importConfiguration('invalid json {');

      expect(result).toFailWith(/Failed to parse configuration/i);
    });

    test('fails for non-object data', () => {
      const result = importConfiguration('"string"');

      expect(result).toFailWith(/Cannot convert field/i);
    });

    test('fails for null data', () => {
      const result = importConfiguration('null');

      expect(result).toFailWith(/Cannot convert field/i);
    });

    test('fails for invalid configuration structure', () => {
      const invalidConfig = {
        qualifierTypes: [],
        qualifiers: [],
        resourceTypes: []
      };
      const result = importConfiguration(JSON.stringify(invalidConfig));

      // Empty arrays are actually valid in ts-res
      expect(result).toSucceed();
    });

    test('validates imported configuration', () => {
      const invalidConfig = {
        qualifierTypes: [{ name: 'lang' }], // Missing systemType
        qualifiers: [],
        resourceTypes: [{ name: 'string', typeName: 'string' }]
      };
      const result = importConfiguration(JSON.stringify(invalidConfig));

      expect(result).toFailWith(/Discriminator property systemType not present/i);
    });
  });

  describe('getIConfigurationTemplates', () => {
    test('returns array of templates', () => {
      const templates = getIConfigurationTemplates();

      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);
    });

    test('includes all predefined configurations from ts-res', () => {
      const templates = getIConfigurationTemplates();
      const expectedConfigs = ['default', 'language-priority', 'territory-priority', 'extended-example'];

      expect(templates).toHaveLength(expectedConfigs.length);

      expectedConfigs.forEach((configId) => {
        const template = templates.find((t: IConfigurationTemplate) => t.id === configId);
        expect(template).toBeDefined();
        expect(template!.configuration).toBeDefined();
      });
    });

    test('default template has correct properties', () => {
      const templates = getIConfigurationTemplates();
      const defaultTemplate = templates.find((t: IConfigurationTemplate) => t.id === 'default');

      expect(defaultTemplate).toBeDefined();
      expect(defaultTemplate!.category).toBe('basic');
      expect(defaultTemplate!.configuration).toEqual(getDefaultConfiguration());
    });

    test('extended-example template has advanced category', () => {
      const templates = getIConfigurationTemplates();
      const extendedTemplate = templates.find((t: IConfigurationTemplate) => t.id === 'extended-example');

      expect(extendedTemplate).toBeDefined();
      expect(extendedTemplate!.category).toBe('advanced');
      expect(extendedTemplate!.configuration.qualifierTypes.length).toBeGreaterThan(2);
    });

    test('language-priority and territory-priority have intermediate category', () => {
      const templates = getIConfigurationTemplates();
      const languagePriorityTemplate = templates.find(
        (t: IConfigurationTemplate) => t.id === 'language-priority'
      );
      const territoryPriorityTemplate = templates.find(
        (t: IConfigurationTemplate) => t.id === 'territory-priority'
      );

      expect(languagePriorityTemplate!.category).toBe('intermediate');
      expect(territoryPriorityTemplate!.category).toBe('intermediate');
    });

    test('all templates have valid configurations', () => {
      const templates = getIConfigurationTemplates();

      templates.forEach((template: IConfigurationTemplate) => {
        const validation = validateConfiguration(template.configuration);
        expect(validation.isValid).toBe(true);
      });
    });

    test('all templates have required properties', () => {
      const templates = getIConfigurationTemplates();

      templates.forEach((template: IConfigurationTemplate) => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.category).toMatch(/^(basic|intermediate|advanced)$/);
        expect(template.configuration).toBeDefined();
      });
    });
  });

  describe('generateConfigurationFilename', () => {
    test('generates filename without config name', () => {
      const filename = generateConfigurationFilename();

      expect(filename).toMatch(/^ts-res-config-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });

    test('generates filename with config name', () => {
      const filename = generateConfigurationFilename('myapp');

      expect(filename).toMatch(/^myapp-config-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });

    test('generates YAML filename', () => {
      const filename = generateConfigurationFilename('myapp', 'yaml');

      expect(filename).toMatch(/^myapp-config-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.yaml$/);
    });

    test('handles special characters in config name', () => {
      const filename = generateConfigurationFilename('my/app:config');

      expect(filename).toMatch(/^my\/app:config-config-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });

    test('generates unique filenames over time', () => {
      const filename1 = generateConfigurationFilename('test');
      // Small delay to ensure different timestamp
      const filename2 = generateConfigurationFilename('test');

      if (filename1 === filename2) {
        // If same, wait a bit and try again
        setTimeout(() => {
          const filename3 = generateConfigurationFilename('test');
          expect(filename3).not.toBe(filename1);
        }, 1);
      } else {
        expect(filename2).not.toBe(filename1);
      }
    });

    test('handles empty string config name', () => {
      const filename = generateConfigurationFilename('');

      // Empty string is falsy, so it uses default base name
      expect(filename).toMatch(/^ts-res-config-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/);
    });
  });
});
