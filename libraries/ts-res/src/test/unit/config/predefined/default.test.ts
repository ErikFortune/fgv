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
import * as TsRes from '../../../../index';

describe('Default Configurations', () => {
  describe('DefaultQualifierTypes', () => {
    test('exports default qualifier types array', () => {
      expect(TsRes.Config.Default.DefaultQualifierTypes).toBeDefined();
      expect(Array.isArray(TsRes.Config.Default.DefaultQualifierTypes)).toBe(true);
      expect(TsRes.Config.Default.DefaultQualifierTypes).toHaveLength(2);
    });
    test('can be used to create a working system configuration', () => {
      // This validates the structure is correct by attempting to use it
      const config: TsRes.Config.Model.ISystemConfiguration = {
        name: 'test',
        description: 'Test configuration',
        qualifierTypes: [...TsRes.Config.Default.DefaultQualifierTypes],
        qualifiers: [...TsRes.Config.Default.TerritoryPriorityQualifiers],
        resourceTypes: [...TsRes.Config.Default.DefaultResourceTypes]
      };

      expect(TsRes.Config.SystemConfiguration.create(config)).toSucceedAndSatisfy((sysConfig) => {
        expect(sysConfig.qualifierTypes.size).toBe(2);
        expect(sysConfig.qualifierTypes.validating.get('language')).toSucceedAndSatisfy((qt) => {
          expect(qt.name).toBe('language');
          expect(qt.allowContextList).toBe(true);
        });
        expect(sysConfig.qualifierTypes.validating.get('territory')).toSucceedAndSatisfy((qt) => {
          expect(qt.name).toBe('territory');
          expect(qt.allowContextList).toBe(false);
        });

        expect(sysConfig.qualifiers.size).toBe(2);
        expect(sysConfig.qualifiers.validating.get('currentTerritory')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('currentTerritory');
          expect(q.token).toBe('geo');
          expect(q.type.name).toBe('territory');
          expect(q.defaultPriority).toBe(850);
        });
        expect(sysConfig.qualifiers.validating.get('language')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('language');
          expect(q.token).toBe('lang');
          expect(q.type.name).toBe('language');
          expect(q.defaultPriority).toBe(800);
        });

        expect(sysConfig.resourceTypes.size).toBe(1);
        expect(sysConfig.resourceTypes.validating.get('json')).toSucceedAndSatisfy((rt) => {
          expect(rt.key).toBe('json');
        });
      });
    });
  });

  describe('TerritoryPriorityQualifiers', () => {
    test('exports territory priority qualifiers array', () => {
      expect(TsRes.Config.Default.TerritoryPriorityQualifiers).toBeDefined();
      expect(Array.isArray(TsRes.Config.Default.TerritoryPriorityQualifiers)).toBe(true);
      expect(TsRes.Config.Default.TerritoryPriorityQualifiers).toHaveLength(2);
    });

    test('can be used to create a working system configuration with territory priority', () => {
      // This validates the structure is correct by attempting to use it
      const config: TsRes.Config.Model.ISystemConfiguration = {
        name: 'test-territory',
        description: 'Test territory priority configuration',
        qualifierTypes: [...TsRes.Config.Default.DefaultQualifierTypes],
        qualifiers: [...TsRes.Config.Default.TerritoryPriorityQualifiers],
        resourceTypes: [...TsRes.Config.Default.DefaultResourceTypes]
      };

      expect(TsRes.Config.SystemConfiguration.create(config)).toSucceedAndSatisfy((sysConfig) => {
        expect(sysConfig.qualifiers.size).toBe(2);
        expect(sysConfig.qualifiers.validating.get('currentTerritory')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('currentTerritory');
          expect(q.token).toBe('geo');
          expect(q.type.name).toBe('territory');
          expect(q.defaultPriority).toBe(850);
        });
        expect(sysConfig.qualifiers.validating.get('language')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('language');
          expect(q.token).toBe('lang');
          expect(q.type.name).toBe('language');
          expect(q.defaultPriority).toBe(800);
        });

        // Territory should have higher priority than language
        const territoryQ = sysConfig.qualifiers.validating.get('currentTerritory').orThrow();
        const languageQ = sysConfig.qualifiers.validating.get('language').orThrow();
        expect(territoryQ.defaultPriority).toBeGreaterThan(languageQ.defaultPriority);
      });
    });
  });

  describe('LanguagePriorityQualifiers', () => {
    test('exports language priority qualifiers array', () => {
      expect(TsRes.Config.Default.LanguagePriorityQualifiers).toBeDefined();
      expect(Array.isArray(TsRes.Config.Default.LanguagePriorityQualifiers)).toBe(true);
      expect(TsRes.Config.Default.LanguagePriorityQualifiers).toHaveLength(2);
    });

    test('can be used to create a working system configuration with language priority', () => {
      // This validates the structure is correct by attempting to use it
      const config: TsRes.Config.Model.ISystemConfiguration = {
        name: 'test-language',
        description: 'Test language priority configuration',
        qualifierTypes: [...TsRes.Config.Default.DefaultQualifierTypes],
        qualifiers: [...TsRes.Config.Default.LanguagePriorityQualifiers],
        resourceTypes: [...TsRes.Config.Default.DefaultResourceTypes]
      };

      expect(TsRes.Config.SystemConfiguration.create(config)).toSucceedAndSatisfy((sysConfig) => {
        expect(sysConfig.qualifiers.size).toBe(2);
        expect(sysConfig.qualifiers.validating.get('language')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('language');
          expect(q.token).toBe('lang');
          expect(q.type.name).toBe('language');
          expect(q.defaultPriority).toBe(850);
        });
        expect(sysConfig.qualifiers.validating.get('currentTerritory')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('currentTerritory');
          expect(q.token).toBe('geo');
          expect(q.type.name).toBe('territory');
          expect(q.defaultPriority).toBe(800);
        });

        // Language should have higher priority than territory
        const languageQ = sysConfig.qualifiers.validating.get('language').orThrow();
        const territoryQ = sysConfig.qualifiers.validating.get('currentTerritory').orThrow();
        expect(languageQ.defaultPriority).toBeGreaterThan(territoryQ.defaultPriority);
      });
    });
  });

  describe('DefaultResourceTypes', () => {
    test('exports default resource types array', () => {
      expect(TsRes.Config.Default.DefaultResourceTypes).toBeDefined();
      expect(Array.isArray(TsRes.Config.Default.DefaultResourceTypes)).toBe(true);
      expect(TsRes.Config.Default.DefaultResourceTypes).toHaveLength(1);
    });

    test('can be used to create a working system configuration', () => {
      // This validates the structure is correct by attempting to use it
      const config: TsRes.Config.Model.ISystemConfiguration = {
        name: 'test-resource-types',
        description: 'Test resource types configuration',
        qualifierTypes: [...TsRes.Config.Default.DefaultQualifierTypes],
        qualifiers: [...TsRes.Config.Default.TerritoryPriorityQualifiers],
        resourceTypes: [...TsRes.Config.Default.DefaultResourceTypes]
      };

      expect(TsRes.Config.SystemConfiguration.create(config)).toSucceedAndSatisfy((sysConfig) => {
        expect(sysConfig.resourceTypes.size).toBe(1);
        expect(sysConfig.resourceTypes.validating.get('json')).toSucceedAndSatisfy((rt) => {
          expect(rt.key).toBe('json');
        });
      });
    });
  });

  describe('TerritoryPrioritySystemConfiguration', () => {
    test('exports territory priority system configuration', () => {
      expect(TsRes.Config.Default.TerritoryPrioritySystemConfiguration).toBeDefined();
      expect(typeof TsRes.Config.Default.TerritoryPrioritySystemConfiguration).toBe('object');
    });

    test('can be used to create a SystemConfiguration with territory priority', () => {
      expect(
        TsRes.Config.SystemConfiguration.create(TsRes.Config.Default.TerritoryPrioritySystemConfiguration)
      ).toSucceedAndSatisfy((sysConfig) => {
        expect(sysConfig.name).toBe('default');
        expect(sysConfig.description).toBe('Default system configuration');
        expect(sysConfig.qualifierTypes.size).toBe(2);
        expect(sysConfig.qualifiers.size).toBe(2);
        expect(sysConfig.resourceTypes.size).toBe(1);

        // Verify territory priority
        const territoryQ = sysConfig.qualifiers.validating.get('currentTerritory').orThrow();
        const languageQ = sysConfig.qualifiers.validating.get('language').orThrow();
        expect(territoryQ.defaultPriority).toBeGreaterThan(languageQ.defaultPriority);
      });
    });
  });

  describe('LanguagePrioritySystemConfiguration', () => {
    test('exports language priority system configuration', () => {
      expect(TsRes.Config.Default.LanguagePrioritySystemConfiguration).toBeDefined();
      expect(typeof TsRes.Config.Default.LanguagePrioritySystemConfiguration).toBe('object');
    });

    test('can be used to create a SystemConfiguration with language priority', () => {
      expect(
        TsRes.Config.SystemConfiguration.create(TsRes.Config.Default.LanguagePrioritySystemConfiguration)
      ).toSucceedAndSatisfy((sysConfig) => {
        expect(sysConfig.name).toBe('default');
        expect(sysConfig.description).toBe('Default system configuration');
        expect(sysConfig.qualifierTypes.size).toBe(2);
        expect(sysConfig.qualifiers.size).toBe(2);
        expect(sysConfig.resourceTypes.size).toBe(1);

        // Verify language priority
        const languageQ = sysConfig.qualifiers.validating.get('language').orThrow();
        const territoryQ = sysConfig.qualifiers.validating.get('currentTerritory').orThrow();
        expect(languageQ.defaultPriority).toBeGreaterThan(territoryQ.defaultPriority);
      });
    });
  });

  describe('DefaultSystemConfiguration', () => {
    test('exports default system configuration', () => {
      expect(TsRes.Config.Default.DefaultSystemConfiguration).toBeDefined();
      expect(typeof TsRes.Config.Default.DefaultSystemConfiguration).toBe('object');
    });

    test('is identical to TerritoryPrioritySystemConfiguration', () => {
      expect(TsRes.Config.Default.DefaultSystemConfiguration).toBe(
        TsRes.Config.Default.TerritoryPrioritySystemConfiguration
      );
    });

    test('gives priority to territory over language', () => {
      expect(
        TsRes.Config.SystemConfiguration.create(TsRes.Config.Default.DefaultSystemConfiguration)
      ).toSucceedAndSatisfy((sysConfig) => {
        const territoryQ = sysConfig.qualifiers.validating.get('currentTerritory').orThrow();
        const languageQ = sysConfig.qualifiers.validating.get('language').orThrow();
        expect(territoryQ.defaultPriority).toBeGreaterThan(languageQ.defaultPriority);
      });
    });

    test('can be used to create a complete working system', () => {
      expect(
        TsRes.Config.SystemConfiguration.create(TsRes.Config.Default.DefaultSystemConfiguration)
      ).toSucceedAndSatisfy((sysConfig) => {
        // Create a resource manager using the default configuration
        expect(
          TsRes.Resources.ResourceManagerBuilder.create({
            qualifiers: sysConfig.qualifiers,
            resourceTypes: sysConfig.resourceTypes
          })
        ).toSucceedAndSatisfy((resourceManager) => {
          // Add a test resource
          expect(
            resourceManager.addResource({
              id: 'test-resource',
              resourceTypeName: 'json',
              candidates: [
                {
                  json: { message: 'Hello US' },
                  conditions: {
                    currentTerritory: 'US',
                    language: 'en'
                  }
                },
                {
                  json: { message: 'Hello World' },
                  conditions: {
                    language: 'en'
                  }
                }
              ]
            })
          ).toSucceed();

          // Build the resources
          expect(resourceManager.build()).toSucceed();

          // Create a context provider and resolver
          const contextProvider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
            qualifiers: sysConfig.qualifiers,
            qualifierValues: {
              currentTerritory: 'US',
              language: 'en'
            }
          }).orThrow();

          const resolver = TsRes.Runtime.ResourceResolver.create({
            resourceManager,
            qualifierTypes: sysConfig.qualifierTypes,
            contextQualifierProvider: contextProvider
          }).orThrow();

          // Verify the system works with territory priority
          expect(resourceManager.getBuiltResource('test-resource')).toSucceedAndSatisfy((resource) => {
            expect(resolver.resolveResource(resource)).toSucceedAndSatisfy((candidate) => {
              expect(candidate.json).toEqual({ message: 'Hello US' });
            });
          });
        });
      });
    });
  });

  describe('Configuration Consistency', () => {
    test('basic array structure is consistent', () => {
      expect(TsRes.Config.Default.DefaultQualifierTypes).toHaveLength(2);
      expect(TsRes.Config.Default.TerritoryPriorityQualifiers).toHaveLength(2);
      expect(TsRes.Config.Default.LanguagePriorityQualifiers).toHaveLength(2);
      expect(TsRes.Config.Default.DefaultResourceTypes).toHaveLength(1);
    });

    test('all default configurations can be used together', () => {
      // Test that both priority systems work
      expect(
        TsRes.Config.SystemConfiguration.create(TsRes.Config.Default.TerritoryPrioritySystemConfiguration)
      ).toSucceed();

      expect(
        TsRes.Config.SystemConfiguration.create(TsRes.Config.Default.LanguagePrioritySystemConfiguration)
      ).toSucceed();

      // Test that components are reusable
      const customConfig: TsRes.Config.Model.ISystemConfiguration = {
        name: 'custom',
        description: 'Custom configuration using default components',
        qualifierTypes: [...TsRes.Config.Default.DefaultQualifierTypes],
        qualifiers: [...TsRes.Config.Default.TerritoryPriorityQualifiers],
        resourceTypes: [...TsRes.Config.Default.DefaultResourceTypes]
      };

      expect(TsRes.Config.SystemConfiguration.create(customConfig)).toSucceed();
    });
  });
});
