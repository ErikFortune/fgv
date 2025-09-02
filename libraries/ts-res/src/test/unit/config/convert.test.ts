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
import { Convert } from '../../../packlets/config';

describe('Config Convert', () => {
  describe('systemConfiguration', () => {
    test('should convert valid minimal configuration', () => {
      const data = {
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

      expect(Convert.systemConfiguration.convert(data)).toSucceedAndSatisfy((config) => {
        expect(config.qualifierTypes).toBeDefined();
        expect(config.qualifiers).toBeDefined();
        expect(config.resourceTypes).toBeDefined();
        expect(config.name).toBeUndefined();
        expect(config.description).toBeUndefined();
      });
    });

    test('should convert configuration with name and description', () => {
      const data = {
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

      expect(Convert.systemConfiguration.convert(data)).toSucceedAndSatisfy((config) => {
        expect(config.name).toBe('Test Configuration');
        expect(config.description).toBe('A test configuration for unit testing');
        expect(config.qualifierTypes).toBeDefined();
        expect(config.qualifiers).toBeDefined();
        expect(config.resourceTypes).toBeDefined();
      });
    });

    test('should convert configuration with only name', () => {
      const data = {
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

      expect(Convert.systemConfiguration.convert(data)).toSucceedAndSatisfy((config) => {
        expect(config.name).toBe('Named Configuration');
        expect(config.description).toBeUndefined();
        expect(config.qualifierTypes).toBeDefined();
        expect(config.qualifiers).toBeDefined();
        expect(config.resourceTypes).toBeDefined();
      });
    });

    test('should convert configuration with only description', () => {
      const data = {
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

      expect(Convert.systemConfiguration.convert(data)).toSucceedAndSatisfy((config) => {
        expect(config.name).toBeUndefined();
        expect(config.description).toBe('A configuration with only description');
        expect(config.qualifierTypes).toBeDefined();
        expect(config.qualifiers).toBeDefined();
        expect(config.resourceTypes).toBeDefined();
      });
    });

    test('should convert configuration with empty name and description', () => {
      const data = {
        name: '',
        description: '',
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

      expect(Convert.systemConfiguration.convert(data)).toSucceedAndSatisfy((config) => {
        expect(config.name).toBe('');
        expect(config.description).toBe('');
        expect(config.qualifierTypes).toBeDefined();
        expect(config.qualifiers).toBeDefined();
        expect(config.resourceTypes).toBeDefined();
      });
    });

    test('should fail conversion with invalid name type', () => {
      const data = {
        name: 123,
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

      expect(Convert.systemConfiguration.convert(data)).toFailWith(/not a string/i);
    });

    test('should fail conversion with invalid description type', () => {
      const data = {
        description: 123,
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

      expect(Convert.systemConfiguration.convert(data)).toFailWith(/not a string/i);
    });

    test('should fail conversion with missing required fields', () => {
      const data = {
        name: 'Test Configuration',
        description: 'A test configuration for unit testing'
        // Missing qualifierTypes, qualifiers, resourceTypes
      };

      expect(Convert.systemConfiguration.convert(data)).toFailWith(/not found/i);
    });

    test('should convert complex configuration with name and description', () => {
      const data = {
        name: 'Enterprise Configuration',
        description: 'Complex configuration for enterprise applications with multiple qualifiers and types',
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

      expect(Convert.systemConfiguration.convert(data)).toSucceedAndSatisfy((config) => {
        expect(config.name).toBe('Enterprise Configuration');
        expect(config.description).toBe(
          'Complex configuration for enterprise applications with multiple qualifiers and types'
        );
        expect(config.qualifierTypes).toHaveLength(3);
        expect(config.qualifiers).toHaveLength(3);
        expect(config.resourceTypes).toHaveLength(1);
      });
    });
  });
});
