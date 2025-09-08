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
import { SystemConfiguration } from '../../../packlets/config';
import {
  Model,
  IConfigInitFactory,
  ChainedConfigInitFactory,
  QualifierTypeFactory,
  ResourceTypeFactory
} from '../../../packlets/config';
import { fail, succeed } from '@fgv/ts-utils';
import { QualifierType } from '../../../packlets/qualifier-types';
import * as QualifierTypes from '../../../packlets/qualifier-types';
import * as ResourceTypes from '../../../packlets/resource-types';
import { ResourceType } from '../../../packlets/resource-types';
import * as path from 'path';
import { Convert } from '../../../packlets/common';

describe('SystemConfiguration', () => {
  describe('constructor and create', () => {
    test('should create SystemConfiguration with valid minimal configuration', () => {
      const config: Model.ISystemConfiguration = {
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language',
            configuration: {}
          }
        ],
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100
          }
        ],
        resourceTypes: [
          {
            name: 'json',
            typeName: 'json'
          }
        ]
      };

      expect(SystemConfiguration.create(config)).toSucceedAndSatisfy((systemConfig) => {
        expect(systemConfig.qualifierTypes).toBeDefined();
        expect(systemConfig.qualifiers).toBeDefined();
        expect(systemConfig.resourceTypes).toBeDefined();
        expect(systemConfig.name).toBeUndefined();
        expect(systemConfig.description).toBeUndefined();

        // Check that collections have expected items
        expect(systemConfig.qualifierTypes.size).toBe(1);
        expect(systemConfig.qualifiers.size).toBe(1);
        expect(systemConfig.resourceTypes.size).toBe(1);
      });
    });

    test('should create SystemConfiguration with optional name and description', () => {
      const config: Model.ISystemConfiguration = {
        name: 'Test Configuration',
        description: 'A test configuration for unit testing',
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language',
            configuration: {}
          }
        ],
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100
          }
        ],
        resourceTypes: [
          {
            name: 'json',
            typeName: 'json'
          }
        ]
      };

      expect(SystemConfiguration.create(config)).toSucceedAndSatisfy((systemConfig) => {
        expect(systemConfig.qualifierTypes).toBeDefined();
        expect(systemConfig.qualifiers).toBeDefined();
        expect(systemConfig.resourceTypes).toBeDefined();
        expect(systemConfig.name).toBe('Test Configuration');
        expect(systemConfig.description).toBe('A test configuration for unit testing');

        // Check that collections have expected items
        expect(systemConfig.qualifierTypes.size).toBe(1);
        expect(systemConfig.qualifiers.size).toBe(1);
        expect(systemConfig.resourceTypes.size).toBe(1);
      });
    });

    test('should create SystemConfiguration with only name', () => {
      const config: Model.ISystemConfiguration = {
        name: 'Named Configuration',
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language',
            configuration: {}
          }
        ],
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100
          }
        ],
        resourceTypes: [
          {
            name: 'json',
            typeName: 'json'
          }
        ]
      };

      expect(SystemConfiguration.create(config)).toSucceedAndSatisfy((systemConfig) => {
        expect(systemConfig.qualifierTypes).toBeDefined();
        expect(systemConfig.qualifiers).toBeDefined();
        expect(systemConfig.resourceTypes).toBeDefined();
        expect(systemConfig.name).toBe('Named Configuration');
        expect(systemConfig.description).toBeUndefined();

        // Check that collections have expected items
        expect(systemConfig.qualifierTypes.size).toBe(1);
        expect(systemConfig.qualifiers.size).toBe(1);
        expect(systemConfig.resourceTypes.size).toBe(1);
      });
    });

    test('should create SystemConfiguration with only description', () => {
      const config: Model.ISystemConfiguration = {
        description: 'A configuration with only description',
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language',
            configuration: {}
          }
        ],
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100
          }
        ],
        resourceTypes: [
          {
            name: 'json',
            typeName: 'json'
          }
        ]
      };

      expect(SystemConfiguration.create(config)).toSucceedAndSatisfy((systemConfig) => {
        expect(systemConfig.qualifierTypes).toBeDefined();
        expect(systemConfig.qualifiers).toBeDefined();
        expect(systemConfig.resourceTypes).toBeDefined();
        expect(systemConfig.name).toBeUndefined();
        expect(systemConfig.description).toBe('A configuration with only description');

        // Check that collections have expected items
        expect(systemConfig.qualifierTypes.size).toBe(1);
        expect(systemConfig.qualifiers.size).toBe(1);
        expect(systemConfig.resourceTypes.size).toBe(1);
      });
    });

    test('should create SystemConfiguration with complete configuration', () => {
      const config: Model.ISystemConfiguration = {
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language',
            configuration: {}
          },
          {
            name: 'territory',
            systemType: 'territory',
            configuration: {
              allowContextList: false,
              allowedTerritories: ['US', 'CA', 'GB', 'AU']
            }
          },
          {
            name: 'role',
            systemType: 'literal',
            configuration: {
              allowContextList: false,
              caseSensitive: false,
              enumeratedValues: ['admin', 'user', 'guest']
            }
          }
        ],
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 600
          },
          {
            name: 'homeTerritory',
            typeName: 'territory',
            defaultPriority: 800,
            token: 'home',
            tokenIsOptional: true
          },
          {
            name: 'role',
            typeName: 'role',
            defaultPriority: 500
          }
        ],
        resourceTypes: [
          {
            name: 'json',
            typeName: 'json'
          }
        ]
      };

      expect(SystemConfiguration.create(config)).toSucceedAndSatisfy((systemConfig) => {
        // Verify collections have expected counts
        expect(systemConfig.qualifierTypes.size).toBe(3);
        expect(systemConfig.qualifiers.size).toBe(3);
        expect(systemConfig.resourceTypes.size).toBe(1);
      });
    });

    test('should create SystemConfiguration with literal qualifier type', () => {
      const config: Model.ISystemConfiguration = {
        qualifierTypes: [
          {
            name: 'platform',
            systemType: 'literal',
            configuration: {
              enumeratedValues: ['ios', 'android', 'web', 'mobile', 'desktop']
            }
          }
        ],
        qualifiers: [
          {
            name: 'platform',
            typeName: 'platform',
            defaultPriority: 300
          }
        ],
        resourceTypes: [
          {
            name: 'json',
            typeName: 'json'
          }
        ]
      };

      expect(SystemConfiguration.create(config)).toSucceedAndSatisfy((systemConfig) => {
        expect(systemConfig.qualifierTypes.size).toBe(1);
        expect(systemConfig.qualifiers.size).toBe(1);
        expect(systemConfig.resourceTypes.size).toBe(1);
      });
    });
  });

  describe('error cases', () => {
    test('should fail with invalid qualifier type configuration', () => {
      const config: Model.ISystemConfiguration = {
        qualifierTypes: [
          {
            name: 'invalid',
            systemType: 'unknown' // Invalid system type - testing error case
          }
        ],
        qualifiers: [],
        resourceTypes: []
      };

      expect(SystemConfiguration.create(config)).toFailWith(/unknown.*qualifier.*type/i);
    });

    test('should fail when qualifier references unknown qualifier type', () => {
      const config: Model.ISystemConfiguration = {
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language',
            configuration: {}
          }
        ],
        qualifiers: [
          {
            name: 'territory',
            typeName: 'unknownType', // References non-existent qualifier type
            defaultPriority: 100
          }
        ],
        resourceTypes: [
          {
            name: 'json',
            typeName: 'json'
          }
        ]
      };

      expect(SystemConfiguration.create(config)).toFailWith(/not.*found/i);
    });

    test('should fail with invalid resource type configuration', () => {
      const config: Model.ISystemConfiguration = {
        qualifierTypes: [],
        qualifiers: [],
        resourceTypes: [
          {
            name: 'invalid',
            typeName: 'unknownResourceType' // Invalid resource type
          }
        ]
      };

      expect(SystemConfiguration.create(config)).toFailWith(/unknown.*resource.*type/i);
    });

    test('should fail with duplicate qualifier type names', () => {
      const config: Model.ISystemConfiguration = {
        qualifierTypes: [
          {
            name: 'duplicate',
            systemType: 'language'
          },
          {
            name: 'duplicate', // Duplicate name
            systemType: 'territory'
          }
        ],
        qualifiers: [],
        resourceTypes: []
      };

      expect(SystemConfiguration.create(config)).toFailWith(/already exists/i);
    });

    test('should fail with duplicate qualifier names', () => {
      const config: Model.ISystemConfiguration = {
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language',
            configuration: {}
          }
        ],
        qualifiers: [
          {
            name: 'duplicate',
            typeName: 'language',
            defaultPriority: 100
          },
          {
            name: 'duplicate', // Duplicate name
            typeName: 'language',
            defaultPriority: 200
          }
        ],
        resourceTypes: []
      };

      expect(SystemConfiguration.create(config)).toFailWith(/already exists/i);
    });
  });

  describe('loadFromFile', () => {
    const testDataPath = path.resolve(__dirname, '../../../../../../data/test/ts-res');

    describe('positive cases', () => {
      test('should load configuration from valid JSON file', () => {
        const configPath = path.join(testDataPath, 'default/default-config.json');
        expect(SystemConfiguration.loadFromFile(configPath)).toSucceedAndSatisfy((systemConfig) => {
          expect(systemConfig.qualifierTypes.size).toBe(2);
          expect(systemConfig.qualifiers.size).toBe(2);
          expect(systemConfig.resourceTypes.size).toBe(1);
        });
      });

      test('should load configuration with name and description', () => {
        const configPath = path.join(testDataPath, 'default/language-priority.json');
        expect(SystemConfiguration.loadFromFile(configPath)).toSucceedAndSatisfy((systemConfig) => {
          expect(systemConfig.name).toBe('language-priority');
          expect(systemConfig.description).toBe('Language priority system configuration');
          expect(systemConfig.qualifierTypes.size).toBeGreaterThan(0);
        });
      });

      test('should load configuration with custom qualifier default values', () => {
        const configPath = path.join(testDataPath, 'default/default-config.json');
        const initParams = {
          qualifierDefaultValues: {
            language: 'en-US',
            currentTerritory: 'US'
          }
        };

        expect(SystemConfiguration.loadFromFile(configPath, initParams)).toSucceedAndSatisfy(
          (systemConfig) => {
            expect(systemConfig.qualifiers.size).toBe(2);
            const langQualifier = systemConfig.qualifiers.get(
              Convert.qualifierName.convert('language').orThrow()
            );
            const territoryQualifier = systemConfig.qualifiers.get(
              Convert.qualifierName.convert('currentTerritory').orThrow()
            );
            expect(langQualifier?.value?.defaultValue).toBe('en-US');
            expect(territoryQualifier?.value?.defaultValue).toBe('US');
          }
        );
      });

      test('should load configuration and remove default values with null', () => {
        const configPath = path.join(testDataPath, 'default/language-priority.json');
        const initParams = {
          qualifierDefaultValues: {
            language: null
          }
        };

        expect(SystemConfiguration.loadFromFile(configPath, initParams)).toSucceedAndSatisfy(
          (systemConfig) => {
            const langQualifier = systemConfig.qualifiers.get(
              Convert.qualifierName.convert('language').orThrow()
            );
            expect(langQualifier?.value?.defaultValue).toBeUndefined();
          }
        );
      });

      test('should load configuration with extended example config', () => {
        const configPath = path.join(testDataPath, 'extended-example/configuration.json');
        expect(SystemConfiguration.loadFromFile(configPath)).toSucceedAndSatisfy((systemConfig) => {
          expect(systemConfig.qualifierTypes.size).toBe(6); // Has 6 qualifier types
          expect(systemConfig.qualifiers.size).toBe(7); // Has 7 qualifiers
          expect(systemConfig.resourceTypes.size).toBe(2);
        });
      });
    });

    describe('error cases', () => {
      test('should fail when file does not exist', () => {
        const configPath = path.join(testDataPath, 'non-existent-file.json');
        expect(SystemConfiguration.loadFromFile(configPath)).toFailWith(/ENOENT/i);
      });

      test('should fail with invalid JSON syntax', () => {
        // Create a temp file with invalid JSON for testing
        const configPath = path.join(testDataPath, 'README.md'); // Using a non-JSON file
        expect(SystemConfiguration.loadFromFile(configPath)).toFailWith(/unexpected/i);
      });

      test('should fail with invalid configuration structure', () => {
        const configPath = path.join(testDataPath, 'default/resources/greeting.json'); // Not a config file
        expect(SystemConfiguration.loadFromFile(configPath)).toFailWith(/field.*not found/i);
      });

      test('should fail when updating non-existent qualifier with default values', () => {
        const configPath = path.join(testDataPath, 'default/default-config.json');
        const initParams = {
          qualifierDefaultValues: {
            nonExistentQualifier: 'value'
          }
        };

        expect(SystemConfiguration.loadFromFile(configPath, initParams)).toFailWith(/not found/i);
      });

      test('should fail with malformed qualifier type in loaded file', () => {
        // This would require a test file with invalid qualifier type
        // For now, we'll test with initParams that would cause failure
        const configPath = path.join(testDataPath, 'default/default-config.json');

        // Mock a factory that always fails to test error handling
        const failingQualifierTypeFactory: IConfigInitFactory<
          QualifierTypes.Config.IAnyQualifierTypeConfig,
          QualifierType
        > = {
          create: () => fail('Test failure for invalid qualifier type')
        };

        const initParams = {
          qualifierTypeFactory: failingQualifierTypeFactory
        };

        expect(SystemConfiguration.loadFromFile(configPath, initParams)).toFailWith(/test failure/i);
      });
    });

    describe('edge cases', () => {
      test('should handle empty qualifier default values object', () => {
        const configPath = path.join(testDataPath, 'default/default-config.json');
        const initParams = {
          qualifierDefaultValues: {}
        };

        expect(SystemConfiguration.loadFromFile(configPath, initParams)).toSucceedAndSatisfy(
          (systemConfig) => {
            expect(systemConfig.qualifiers.size).toBe(2);
          }
        );
      });

      test('should handle configuration with no optional fields', () => {
        const configPath = path.join(testDataPath, 'default/default-config.json');
        expect(SystemConfiguration.loadFromFile(configPath)).toSucceedAndSatisfy((systemConfig) => {
          expect(systemConfig.name).toBeUndefined();
          expect(systemConfig.description).toBeUndefined();
        });
      });

      test('should handle relative file paths', () => {
        const relativePath = './data/test/ts-res/default/default-config.json';
        const absolutePath = path.resolve(process.cwd(), relativePath);

        // Only test if the file exists at the expected location
        const fs = require('fs');
        if (fs.existsSync(absolutePath)) {
          expect(SystemConfiguration.loadFromFile(relativePath)).toSucceedAndSatisfy((systemConfig) => {
            expect(systemConfig.qualifierTypes.size).toBe(2);
          });
        }
      });
    });
  });

  describe('factory functionality', () => {
    describe('custom qualifier type factory', () => {
      test('should use custom qualifier type factory for creating qualifier types', () => {
        const customQualifierType = QualifierTypes.LiteralQualifierType.create({
          name: 'custom',
          enumeratedValues: ['value1', 'value2']
        }).orThrow();

        const customFactory: IConfigInitFactory<
          QualifierTypes.Config.IAnyQualifierTypeConfig,
          QualifierType
        > = {
          create: (config) => {
            if (config.name === 'custom') {
              return succeed(customQualifierType);
            }
            return fail('Not handled by custom factory');
          }
        };

        const config: Model.ISystemConfiguration = {
          qualifierTypes: [
            {
              name: 'custom',
              systemType: 'custom'
            },
            {
              name: 'language',
              systemType: 'language'
            }
          ],
          qualifiers: [],
          resourceTypes: []
        };

        const initParams = {
          qualifierTypeFactory: new QualifierTypeFactory([customFactory])
        };

        expect(SystemConfiguration.create(config, initParams)).toSucceedAndSatisfy((systemConfig) => {
          expect(systemConfig.qualifierTypes.size).toBe(2);
          const customType = systemConfig.qualifierTypes.get(
            Convert.qualifierTypeName.convert('custom').orThrow()
          );
          expect(customType?.value).toBe(customQualifierType);
        });
      });

      test('should fall back to built-in factory when custom factory fails', () => {
        const customFactory: IConfigInitFactory<
          QualifierTypes.Config.IAnyQualifierTypeConfig,
          QualifierType
        > = {
          create: () => fail('Custom factory does not handle this')
        };

        const config: Model.ISystemConfiguration = {
          qualifierTypes: [
            {
              name: 'language',
              systemType: 'language'
            }
          ],
          qualifiers: [],
          resourceTypes: []
        };

        const initParams = {
          qualifierTypeFactory: new QualifierTypeFactory([customFactory])
        };

        expect(SystemConfiguration.create(config, initParams)).toSucceedAndSatisfy((systemConfig) => {
          expect(systemConfig.qualifierTypes.size).toBe(1);
          const langType = systemConfig.qualifierTypes.get(
            Convert.qualifierTypeName.convert('language').orThrow()
          );
          expect(langType?.value).toBeDefined();
        });
      });

      test('should fail when no factory can handle the qualifier type', () => {
        const customFactory: IConfigInitFactory<
          QualifierTypes.Config.IAnyQualifierTypeConfig,
          QualifierType
        > = {
          create: () => fail('Custom factory failure')
        };

        const config: Model.ISystemConfiguration = {
          qualifierTypes: [
            {
              name: 'unknown',
              systemType: 'unknownType' // Testing factory failure with invalid type
            }
          ],
          qualifiers: [],
          resourceTypes: []
        };

        const initParams = {
          qualifierTypeFactory: customFactory
        };

        expect(SystemConfiguration.create(config, initParams)).toFailWith(/custom factory failure/i);
      });
    });

    describe('custom resource type factory', () => {
      test('should use custom resource type factory for creating resource types', () => {
        let customFactoryCalled = false;
        const customFactory: IConfigInitFactory<ResourceTypes.Config.IResourceTypeConfig, ResourceType> = {
          create: (config) => {
            if (config.name === 'custom') {
              customFactoryCalled = true;
              // Return a custom resource type for 'custom' type
              return ResourceTypes.JsonResourceType.create({});
            }
            return fail('Not handled by custom factory');
          }
        };

        const config: Model.ISystemConfiguration = {
          qualifierTypes: [],
          qualifiers: [],
          resourceTypes: [
            {
              name: 'custom',
              typeName: 'custom'
            },
            {
              name: 'standard',
              typeName: 'json'
            }
          ]
        };

        const initParams = {
          resourceTypeFactory: new ResourceTypeFactory([customFactory])
        };

        expect(SystemConfiguration.create(config, initParams)).toSucceedAndSatisfy((systemConfig) => {
          expect(customFactoryCalled).toBe(true);
          expect(systemConfig.resourceTypes.size).toBe(2);
          // Verify that both resource types were created
          expect(
            systemConfig.resourceTypes.get(Convert.resourceTypeName.convert('custom').orThrow())
          ).toBeDefined();
          expect(
            systemConfig.resourceTypes.get(Convert.resourceTypeName.convert('standard').orThrow())
          ).toBeDefined();
        });
      });

      test('should fall back to built-in factory when custom factory fails', () => {
        const customFactory: IConfigInitFactory<ResourceTypes.Config.IResourceTypeConfig, ResourceType> = {
          create: () => fail('Custom factory does not handle this')
        };

        const config: Model.ISystemConfiguration = {
          qualifierTypes: [],
          qualifiers: [],
          resourceTypes: [
            {
              name: 'json',
              typeName: 'json'
            }
          ]
        };

        const initParams = {
          resourceTypeFactory: new ResourceTypeFactory([customFactory])
        };

        expect(SystemConfiguration.create(config, initParams)).toSucceedAndSatisfy((systemConfig) => {
          expect(systemConfig.resourceTypes.size).toBe(1);
          const jsonType = systemConfig.resourceTypes.get(Convert.resourceTypeName.convert('json').orThrow());
          expect(jsonType?.value).toBeDefined();
        });
      });

      test('should fail when no factory can handle the resource type', () => {
        const customFactory: IConfigInitFactory<ResourceTypes.Config.IResourceTypeConfig, ResourceType> = {
          create: () => fail('Custom factory failure')
        };

        const config: Model.ISystemConfiguration = {
          qualifierTypes: [],
          qualifiers: [],
          resourceTypes: [
            {
              name: 'unknown',
              typeName: 'unknownType'
            }
          ]
        };

        const initParams = {
          resourceTypeFactory: customFactory
        };

        expect(SystemConfiguration.create(config, initParams)).toFailWith(/custom factory failure/i);
      });
    });

    describe('combined factory usage', () => {
      test('should use both custom qualifier and resource type factories', () => {
        let qualifierFactoryCalled = false;
        let resourceFactoryCalled = false;

        const customQualifierType = QualifierTypes.LiteralQualifierType.create({
          name: 'customQualifier',
          enumeratedValues: ['a', 'b']
        }).orThrow();

        const qualifierFactory: IConfigInitFactory<
          QualifierTypes.Config.IAnyQualifierTypeConfig,
          QualifierType
        > = {
          create: (config) => {
            if (config.name === 'customQualifier') {
              qualifierFactoryCalled = true;
              return succeed(customQualifierType);
            }
            return fail('Not handled');
          }
        };

        const resourceFactory: IConfigInitFactory<ResourceTypes.Config.IResourceTypeConfig, ResourceType> = {
          create: (config) => {
            if (config.name === 'customResource') {
              resourceFactoryCalled = true;
              return ResourceTypes.JsonResourceType.create({});
            }
            return fail('Not handled');
          }
        };

        const config: Model.ISystemConfiguration = {
          qualifierTypes: [
            {
              name: 'customQualifier',
              systemType: 'custom'
            }
          ],
          qualifiers: [],
          resourceTypes: [
            {
              name: 'customResource',
              typeName: 'custom'
            }
          ]
        };

        const initParams = {
          qualifierTypeFactory: new QualifierTypeFactory([qualifierFactory]),
          resourceTypeFactory: new ResourceTypeFactory([resourceFactory])
        };

        expect(SystemConfiguration.create(config, initParams)).toSucceedAndSatisfy((systemConfig) => {
          expect(qualifierFactoryCalled).toBe(true);
          expect(resourceFactoryCalled).toBe(true);
          const qualType = systemConfig.qualifierTypes.get(
            Convert.qualifierTypeName.convert('customQualifier').orThrow()
          );
          expect(qualType?.value).toBe(customQualifierType);
          // Verify resource type was created (it exists in the collection)
          expect(systemConfig.resourceTypes.size).toBe(1);
        });
      });

      test('should work with loadFromFile and custom factories', () => {
        const configPath = path.join(
          path.resolve(__dirname, '../../../../../../data/test/ts-res'),
          'default/default-config.json'
        );

        let qualifierFactoryCalled = false;
        let resourceFactoryCalled = false;

        const qualifierFactory: IConfigInitFactory<
          QualifierTypes.Config.IAnyQualifierTypeConfig,
          QualifierType
        > = {
          create: () => {
            qualifierFactoryCalled = true;
            return fail('Let built-in handle it');
          }
        };

        const resourceFactory: IConfigInitFactory<ResourceTypes.Config.IResourceTypeConfig, ResourceType> = {
          create: () => {
            resourceFactoryCalled = true;
            return fail('Let built-in handle it');
          }
        };

        const initParams = {
          qualifierTypeFactory: new QualifierTypeFactory([qualifierFactory]),
          resourceTypeFactory: new ResourceTypeFactory([resourceFactory])
        };

        expect(SystemConfiguration.loadFromFile(configPath, initParams)).toSucceedAndSatisfy(
          (systemConfig) => {
            expect(qualifierFactoryCalled).toBe(true);
            expect(resourceFactoryCalled).toBe(true);
            expect(systemConfig.qualifierTypes.size).toBe(2);
            expect(systemConfig.resourceTypes.size).toBe(1);
          }
        );
      });
    });

    describe('ChainedConfigInitFactory', () => {
      test('should try factories in order until one succeeds', () => {
        const factory1: IConfigInitFactory<string, string> = {
          create: (config) => (config === 'first' ? succeed('from factory 1') : fail('not handled'))
        };

        const factory2: IConfigInitFactory<string, string> = {
          create: (config) => (config === 'second' ? succeed('from factory 2') : fail('not handled'))
        };

        const factory3: IConfigInitFactory<string, string> = {
          create: (config) => succeed(`default: ${config}`)
        };

        const chained = new ChainedConfigInitFactory([factory1, factory2, factory3]);

        expect(chained.create('first')).toSucceedWith('from factory 1');
        expect(chained.create('second')).toSucceedWith('from factory 2');
        expect(chained.create('third')).toSucceedWith('default: third');
      });

      test('should fail if no factory succeeds', () => {
        const factory1: IConfigInitFactory<string, string> = {
          create: () => fail('factory 1 failed')
        };

        const factory2: IConfigInitFactory<string, string> = {
          create: () => fail('factory 2 failed')
        };

        const chained = new ChainedConfigInitFactory([factory1, factory2]);

        expect(chained.create('test')).toFailWith(/no factory was able/i);
      });

      test('should work with empty factory list', () => {
        const chained = new ChainedConfigInitFactory<string, string>([]);
        expect(chained.create('test')).toFailWith(/no factory was able/i);
      });
    });
  });

  describe('configuration from sample file', () => {
    // This test uses the actual sample configuration from the ts-res-browser
    const sampleConfig: Model.ISystemConfiguration = {
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
          systemType: 'literal',
          configuration: {
            allowContextList: false,
            caseSensitive: false,
            enumeratedValues: ['admin', 'user', 'guest', 'anonymous']
          }
        },
        {
          name: 'environment',
          systemType: 'literal',
          configuration: {
            enumeratedValues: ['development', 'integration', 'production', 'test']
          }
        },
        {
          name: 'platform',
          systemType: 'literal',
          configuration: {
            enumeratedValues: ['ios', 'android', 'web', 'mobile', 'tv', 'desktop']
          }
        },
        {
          name: 'density',
          systemType: 'literal',
          configuration: {
            allowContextList: false,
            caseSensitive: false,
            enumeratedValues: ['hdpi', 'mdpi', 'ldpi']
          }
        }
      ],
      qualifiers: [
        {
          name: 'language',
          typeName: 'language',
          defaultPriority: 600
        },
        {
          name: 'homeTerritory',
          typeName: 'territory',
          defaultPriority: 800,
          token: 'home',
          tokenIsOptional: true
        },
        {
          name: 'currentTerritory',
          typeName: 'territory',
          defaultPriority: 700
        },
        {
          name: 'role',
          typeName: 'role',
          defaultPriority: 500
        },
        {
          name: 'env',
          typeName: 'environment',
          defaultPriority: 400
        },
        {
          name: 'platform',
          typeName: 'platform',
          defaultPriority: 300
        },
        {
          name: 'density',
          typeName: 'density',
          defaultPriority: 200
        }
      ],
      resourceTypes: [
        {
          name: 'json',
          typeName: 'json'
        }
      ]
    };

    test('should successfully create SystemConfiguration from sample file', () => {
      expect(SystemConfiguration.create(sampleConfig)).toSucceedAndSatisfy((systemConfig) => {
        // Verify all collections have expected counts
        expect(systemConfig.qualifierTypes.size).toBe(6);
        expect(systemConfig.qualifiers.size).toBe(7);
        expect(systemConfig.resourceTypes.size).toBe(1);
      });
    });

    test('should validate all qualifiers and types are created', () => {
      expect(SystemConfiguration.create(sampleConfig)).toSucceedAndSatisfy((systemConfig) => {
        // Basic validation that the SystemConfiguration was created successfully
        // and that all the collections have the expected sizes
        expect(systemConfig.qualifierTypes.size).toBe(6);
        expect(systemConfig.qualifiers.size).toBe(7);
        expect(systemConfig.resourceTypes.size).toBe(1);
      });
    });
  });

  describe('getConfig', () => {
    test('should return the original configuration', () => {
      const config: Model.ISystemConfiguration = {
        name: 'Test Config',
        description: 'Test Description',
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language',
            configuration: {}
          }
        ],
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100,
            defaultValue: 'en-US'
          }
        ],
        resourceTypes: [
          {
            name: 'json',
            typeName: 'json'
          }
        ]
      };

      expect(SystemConfiguration.create(config)).toSucceedAndSatisfy((systemConfig) => {
        expect(systemConfig.getConfig()).toSucceedAndSatisfy((returnedConfig) => {
          expect(returnedConfig.name).toBe(config.name);
          expect(returnedConfig.description).toBe(config.description);
          expect(returnedConfig.qualifierTypes).toEqual(config.qualifierTypes);
          expect(returnedConfig.qualifiers).toEqual(config.qualifiers);
          expect(returnedConfig.resourceTypes).toEqual(config.resourceTypes);
        });
      });
    });

    test('should return configuration modified by initParams', () => {
      const config: Model.ISystemConfiguration = {
        qualifierTypes: [
          {
            name: 'language',
            systemType: 'language'
          }
        ],
        qualifiers: [
          {
            name: 'language',
            typeName: 'language',
            defaultPriority: 100
          }
        ],
        resourceTypes: []
      };

      const initParams = {
        qualifierDefaultValues: {
          language: 'fr-FR'
        }
      };

      expect(SystemConfiguration.create(config, initParams)).toSucceedAndSatisfy((systemConfig) => {
        expect(systemConfig.getConfig()).toSucceedAndSatisfy((returnedConfig) => {
          expect(returnedConfig.qualifiers[0].defaultValue).toBe('fr-FR');
        });
      });
    });
  });
});
