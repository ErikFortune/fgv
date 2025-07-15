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
import { Model } from '../../../packlets/config';

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
            systemType: 'unknown' as unknown as 'language' // Invalid system type
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
});
