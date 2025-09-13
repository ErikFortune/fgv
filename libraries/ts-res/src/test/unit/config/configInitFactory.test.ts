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
import { succeed, fail, Result } from '@fgv/ts-utils';

import * as TsRes from '../../../index';
import * as Config from '../../../packlets/config';

// Mock configuration types for testing
interface ITestConfig {
  type: string;
  value?: string;
}

interface ITestResult {
  name: string;
  processed: boolean;
}

// Mock factory implementations for testing chaining
class TestFactoryA implements Config.IConfigInitFactory<ITestConfig, ITestResult> {
  public create(config: ITestConfig): Result<ITestResult> {
    if (config.type === 'typeA') {
      return succeed({ name: 'FactoryA', processed: true });
    }
    return fail('TestFactoryA cannot handle this config');
  }
}

class TestFactoryB implements Config.IConfigInitFactory<ITestConfig, ITestResult> {
  public create(config: ITestConfig): Result<ITestResult> {
    if (config.type === 'typeB') {
      return succeed({ name: 'FactoryB', processed: true });
    }
    return fail('TestFactoryB cannot handle this config');
  }
}

class AlwaysFailingFactory implements Config.IConfigInitFactory<ITestConfig, ITestResult> {
  public create(unusedConfig: ITestConfig): Result<ITestResult> {
    return fail('AlwaysFailingFactory always fails');
  }
}

// Simple mock factory that returns a language qualifier type with a custom name
class CustomQualifierTypeFactory
  implements
    Config.IConfigInitFactory<
      TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig,
      TsRes.QualifierTypes.LanguageQualifierType
    >
{
  public create(
    config: TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig
  ): Result<TsRes.QualifierTypes.LanguageQualifierType> {
    if (config.systemType === 'custom') {
      // Create a language qualifier type with a custom name for testing
      return TsRes.QualifierTypes.LanguageQualifierType.createFromConfig({
        name: config.name,
        systemType: 'language',
        configuration: { allowContextList: true }
      });
    }
    return fail('CustomQualifierTypeFactory cannot handle this config');
  }
}

describe('Config Init Factory', () => {
  describe('ChainedConfigInitFactory', () => {
    describe('constructor', () => {
      test('should create factory with provided factories array', () => {
        const factory = new Config.ChainedConfigInitFactory([new TestFactoryA(), new TestFactoryB()]);
        expect(factory.factories).toHaveLength(2);
        expect(factory.factories[0]).toBeInstanceOf(TestFactoryA);
        expect(factory.factories[1]).toBeInstanceOf(TestFactoryB);
      });

      test('should create factory with empty array', () => {
        const factory = new Config.ChainedConfigInitFactory<ITestConfig, ITestResult>([]);
        expect(factory.factories).toHaveLength(0);
      });
    });

    describe('create', () => {
      test('should use first factory that succeeds', () => {
        const factory = new Config.ChainedConfigInitFactory([new TestFactoryA(), new TestFactoryB()]);

        expect(factory.create({ type: 'typeA' })).toSucceedAndSatisfy((result) => {
          expect(result.name).toBe('FactoryA');
          expect(result.processed).toBe(true);
        });
      });

      test('should try factories in order until one succeeds', () => {
        const factory = new Config.ChainedConfigInitFactory([new TestFactoryA(), new TestFactoryB()]);

        expect(factory.create({ type: 'typeB' })).toSucceedAndSatisfy((result) => {
          expect(result.name).toBe('FactoryB');
          expect(result.processed).toBe(true);
        });
      });

      test('should return failure when no factory can handle config', () => {
        const factory = new Config.ChainedConfigInitFactory([new TestFactoryA(), new TestFactoryB()]);

        expect(factory.create({ type: 'unsupportedType' })).toFailWith(
          /No factory was able to create the configuration object/
        );
      });

      test('should return failure when all factories are failing factories', () => {
        const factory = new Config.ChainedConfigInitFactory([
          new AlwaysFailingFactory(),
          new AlwaysFailingFactory()
        ]);

        expect(factory.create({ type: 'anything' })).toFailWith(
          /No factory was able to create the configuration object/
        );
      });

      test('should work with single factory', () => {
        const factory = new Config.ChainedConfigInitFactory([new TestFactoryA()]);

        expect(factory.create({ type: 'typeA' })).toSucceedAndSatisfy((result) => {
          expect(result.name).toBe('FactoryA');
        });
      });

      test('should return failure with empty factories array', () => {
        const factory = new Config.ChainedConfigInitFactory<ITestConfig, ITestResult>([]);

        expect(factory.create({ type: 'anything' })).toFailWith(
          /No factory was able to create the configuration object/
        );
      });
    });
  });

  describe('BuiltInQualifierTypeFactory', () => {
    let factory: Config.BuiltInQualifierTypeFactory;

    beforeEach(() => {
      factory = new Config.BuiltInQualifierTypeFactory();
    });

    describe('create', () => {
      test('should create language qualifier type from system config', () => {
        const config: TsRes.QualifierTypes.Config.ISystemLanguageQualifierTypeConfig = {
          name: 'language',
          systemType: 'language',
          configuration: { allowContextList: true }
        };

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
          expect(qualifierType.name).toBe('language');
          expect(qualifierType.getConfiguration()).toSucceedWith({
            name: 'language',
            systemType: 'language',
            configuration: { allowContextList: true }
          });
        });
      });

      test('should create territory qualifier type from system config', () => {
        const config: TsRes.QualifierTypes.Config.ISystemTerritoryQualifierTypeConfig = {
          name: 'territory',
          systemType: 'territory',
          configuration: {
            allowContextList: false,
            acceptLowercase: true,
            allowedTerritories: ['US', 'CA']
          }
        };

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
          expect(qualifierType.name).toBe('territory');
          expect(qualifierType.getConfiguration()).toSucceedWith({
            name: 'territory',
            systemType: 'territory',
            configuration: {
              allowContextList: false,
              acceptLowercase: true,
              allowedTerritories: ['US', 'CA']
            }
          });
        });
      });

      test('should create literal qualifier type from system config', () => {
        const config: TsRes.QualifierTypes.Config.ISystemLiteralQualifierTypeConfig = {
          name: 'theme',
          systemType: 'literal',
          configuration: {
            caseSensitive: false,
            enumeratedValues: ['light', 'dark'],
            allowContextList: true
          }
        };

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
          expect(qualifierType.name).toBe('theme');
          expect(qualifierType.getConfiguration()).toSucceedWith({
            name: 'theme',
            systemType: 'literal',
            configuration: {
              caseSensitive: false,
              enumeratedValues: ['light', 'dark'],
              allowContextList: true
            }
          });
        });
      });

      test('should handle minimal language config', () => {
        const config: TsRes.QualifierTypes.Config.ISystemLanguageQualifierTypeConfig = {
          name: 'lang',
          systemType: 'language'
        };

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
          expect(qualifierType.name).toBe('lang');
        });
      });

      test('should handle minimal territory config', () => {
        const config: TsRes.QualifierTypes.Config.ISystemTerritoryQualifierTypeConfig = {
          name: 'region',
          systemType: 'territory'
        };

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.TerritoryQualifierType);
          expect(qualifierType.name).toBe('region');
        });
      });

      test('should handle minimal literal config', () => {
        const config: TsRes.QualifierTypes.Config.ISystemLiteralQualifierTypeConfig = {
          name: 'platform',
          systemType: 'literal'
        };

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
          expect(qualifierType.name).toBe('platform');
        });
      });

      test('should fail for non-system qualifier type config', () => {
        const config = {
          name: 'custom',
          systemType: 'custom-type',
          configuration: {}
        } as unknown as TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig;

        expect(factory.create(config)).toFailWith(/custom: unknown built-in qualifier type \(custom-type\)/);
      });

      test('should fail for unrecognized system type', () => {
        const config = {
          name: 'invalid',
          systemType: 'invalid-system-type',
          configuration: {}
        } as unknown as TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig;

        expect(factory.create(config)).toFailWith(
          /invalid: unknown built-in qualifier type \(invalid-system-type\)/
        );
      });

      test('should fail for non-system qualifier type config', () => {
        // Create a config that will fail the isSystemQualifierTypeConfig check
        const config = {
          name: 'custom-type',
          systemType: 'custom', // This is not a system type (not language/territory/literal)
          configuration: {}
        } as unknown as TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig;

        expect(factory.create(config)).toFailWith(/custom-type: unknown built-in qualifier type \(custom\)/);
      });
    });
  });

  describe('QualifierTypeFactory', () => {
    describe('constructor', () => {
      test('should create factory with custom factories and built-in factory', () => {
        const customFactory = new CustomQualifierTypeFactory();
        const factory = new Config.QualifierTypeFactory([customFactory]);

        // Should have custom factory + built-in factory
        expect(factory.factories).toHaveLength(2);
        expect(factory.factories[0]).toEqual(customFactory);
        expect(factory.factories[1]).toBeInstanceOf(Config.BuiltInQualifierTypeFactory);
      });

      test('should accept factory functions', () => {
        const factoryFunction: Config.QualifierTypeFactoryFunction = (config) => {
          if (config.systemType === 'custom-fn') {
            return TsRes.QualifierTypes.LanguageQualifierType.createFromConfig({
              name: config.name,
              systemType: 'language',
              configuration: { allowContextList: true }
            });
          }
          return fail('Not supported');
        };

        const factory = new Config.QualifierTypeFactory([factoryFunction]);

        // Should have wrapped function + built-in factory
        expect(factory.factories).toHaveLength(2);
        expect(factory.factories[1]).toBeInstanceOf(Config.BuiltInQualifierTypeFactory);
      });

      test('should accept mix of functions and interface implementations', () => {
        const customFactory = new CustomQualifierTypeFactory();
        const factoryFunction: Config.QualifierTypeFactoryFunction = (config) => {
          return fail('Function factory');
        };

        const factory = new Config.QualifierTypeFactory([customFactory, factoryFunction]);

        // Should have both custom factories + built-in factory
        expect(factory.factories).toHaveLength(3);
        expect(factory.factories[2]).toBeInstanceOf(Config.BuiltInQualifierTypeFactory);
      });

      test('should create factory with empty custom factories array', () => {
        const factory = new Config.QualifierTypeFactory([]);

        // Should have only built-in factory
        expect(factory.factories).toHaveLength(1);
        expect(factory.factories[0]).toBeInstanceOf(Config.BuiltInQualifierTypeFactory);
      });

      test('should create factory with multiple custom factories', () => {
        const factory1 = new CustomQualifierTypeFactory();
        const factory2 = new CustomQualifierTypeFactory();
        const factory = new Config.QualifierTypeFactory([factory1, factory2]);

        // Should have both custom factories + built-in factory
        expect(factory.factories).toHaveLength(3);
        expect(factory.factories[0]).toBe(factory1);
        expect(factory.factories[1]).toBe(factory2);
        expect(factory.factories[2]).toBeInstanceOf(Config.BuiltInQualifierTypeFactory);
      });
    });

    describe('create', () => {
      test('should use custom factory for custom types', () => {
        const customFactory = new CustomQualifierTypeFactory();
        const factory = new Config.QualifierTypeFactory([customFactory]);

        const config = {
          name: 'my-custom',
          systemType: 'custom',
          configuration: {}
        } as unknown as TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig;

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
          expect(qualifierType.name).toBe('my-custom');
        });
      });

      test('should fall back to built-in factory for system types', () => {
        const customFactory = new CustomQualifierTypeFactory();
        const factory = new Config.QualifierTypeFactory([customFactory]);

        const config: TsRes.QualifierTypes.Config.ISystemLanguageQualifierTypeConfig = {
          name: 'language',
          systemType: 'language',
          configuration: { allowContextList: true }
        };

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
          expect(qualifierType.name).toBe('language');
        });
      });

      test('should try custom factories in order before built-in', () => {
        const factory1 = new CustomQualifierTypeFactory();
        const factory2 = new AlwaysFailingFactory() as unknown as Config.IConfigInitFactory<
          TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig,
          TsRes.QualifierTypes.LanguageQualifierType
        >;
        const factory = new Config.QualifierTypeFactory([factory2, factory1]);

        const config = {
          name: 'custom-test',
          systemType: 'custom',
          configuration: {}
        } as unknown as TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig;

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
          expect(qualifierType.name).toBe('custom-test');
        });
      });

      test('should fail when no factory can handle the config', () => {
        const alwaysFailingFactory = new AlwaysFailingFactory() as unknown as Config.IConfigInitFactory<
          TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig,
          TsRes.QualifierTypes.LanguageQualifierType
        >;
        const factory = new Config.QualifierTypeFactory([alwaysFailingFactory]);

        const config = {
          name: 'unsupported',
          systemType: 'unsupported-type',
          configuration: {}
        } as unknown as TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig;

        expect(factory.create(config)).toFailWith(/No factory was able to create the configuration object/);
      });

      test('should work with factory functions', () => {
        const factoryFunction: Config.QualifierTypeFactoryFunction = (config) => {
          if (config.systemType === 'test-function') {
            return TsRes.QualifierTypes.LanguageQualifierType.createFromConfig({
              name: `fn-${config.name}`,
              systemType: 'language',
              configuration: { allowContextList: false }
            });
          }
          return fail('Unsupported type');
        };

        const factory = new Config.QualifierTypeFactory([factoryFunction]);

        const config = {
          name: 'test',
          systemType: 'test-function',
          configuration: {}
        } as unknown as TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig;

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
          expect(qualifierType.name).toBe('fn-test');
        });
      });

      test('should work with default generic type parameter', () => {
        // Test that QualifierTypeFactory with default generic works
        const factory = new Config.QualifierTypeFactory([]);

        const config: TsRes.QualifierTypes.Config.ISystemLiteralQualifierTypeConfig = {
          name: 'test-literal',
          systemType: 'literal',
          configuration: { caseSensitive: true }
        };

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
          expect(qualifierType.name).toBe('test-literal');
        });
      });
    });
  });

  describe('BuiltInResourceTypeFactory', () => {
    let factory: Config.BuiltInResourceTypeFactory;

    beforeEach(() => {
      factory = new Config.BuiltInResourceTypeFactory();
    });

    describe('create', () => {
      test('should create json resource type from config', () => {
        const config: TsRes.ResourceTypes.Config.IResourceTypeConfig = {
          name: 'test-json',
          typeName: 'json'
        };

        expect(factory.create(config)).toSucceedAndSatisfy((resourceType) => {
          expect(resourceType).toBeInstanceOf(TsRes.ResourceTypes.JsonResourceType);
          expect(resourceType.key).toBe('test-json');
        });
      });

      test('should handle minimal json config', () => {
        const config: TsRes.ResourceTypes.Config.IResourceTypeConfig = {
          name: 'minimal-json',
          typeName: 'json'
        };

        expect(factory.create(config)).toSucceedAndSatisfy((resourceType) => {
          expect(resourceType).toBeInstanceOf(TsRes.ResourceTypes.JsonResourceType);
          expect(resourceType.key).toBe('minimal-json');
        });
      });

      test('should fail for invalid resource type config', () => {
        const config: TsRes.ResourceTypes.Config.IResourceTypeConfig = {
          name: 'invalid',
          typeName: 'invalid-type'
        };

        expect(factory.create(config)).toFailWith(/invalid-type: Unknown resource type/);
      });
    });
  });

  describe('ValidatingQualifierTypeFactory', () => {
    describe('constructor', () => {
      test('should create validating factory with custom factories', () => {
        const customFactory = new CustomQualifierTypeFactory();
        const factory = new Config.ValidatingQualifierTypeFactory([customFactory]);

        expect(factory).toBeInstanceOf(Config.ValidatingQualifierTypeFactory);
      });

      test('should accept factory functions', () => {
        const factoryFunction: Config.QualifierTypeFactoryFunction = (config) => {
          return fail('Test function');
        };

        const factory = new Config.ValidatingQualifierTypeFactory([factoryFunction]);
        expect(factory).toBeInstanceOf(Config.ValidatingQualifierTypeFactory);
      });
    });

    describe('create', () => {
      test('should validate and create from weakly-typed config', () => {
        const factory = new Config.ValidatingQualifierTypeFactory([]);

        // Plain object with string properties (not branded types)
        const weakConfig = {
          name: 'test-language',
          systemType: 'language',
          configuration: { allowContextList: true }
        };

        expect(factory.create(weakConfig)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
          expect(qualifierType.name).toBe('test-language');
        });
      });

      test('should fail with invalid config structure', () => {
        const factory = new Config.ValidatingQualifierTypeFactory([]);

        const invalidConfig = {
          // Missing name
          systemType: 'language'
        };

        expect(factory.create(invalidConfig)).toFailWith(/field name not found/i);
      });

      test('should fail with non-object config', () => {
        const factory = new Config.ValidatingQualifierTypeFactory([]);

        expect(factory.create('not an object')).toFailWith(/must be an object/i);
        expect(factory.create(null)).toFailWith(/must be an object/i);
        expect(factory.create(undefined)).toFailWith(/must be an object/i);
      });

      test('should work with custom factory functions and weak types', () => {
        const factoryFunction: Config.QualifierTypeFactoryFunction = (config) => {
          if (config.systemType === 'custom-validated') {
            return TsRes.QualifierTypes.LiteralQualifierType.createFromConfig({
              name: config.name,
              systemType: 'literal',
              configuration: { caseSensitive: false }
            });
          }
          return fail('Not supported');
        };

        const factory = new Config.ValidatingQualifierTypeFactory([factoryFunction]);

        // Weakly-typed config
        const weakConfig = {
          name: 'my-custom',
          systemType: 'custom-validated',
          configuration: {}
        };

        expect(factory.create(weakConfig)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
          expect(qualifierType.name).toBe('my-custom');
        });
      });
    });
  });

  describe('ValidatingResourceTypeFactory', () => {
    describe('constructor', () => {
      test('should create validating factory with custom factories', () => {
        const customFactory: Config.IConfigInitFactory<
          TsRes.ResourceTypes.Config.IResourceTypeConfig,
          TsRes.ResourceTypes.ResourceType
        > = {
          create: () => fail('Custom factory')
        };

        const factory = new Config.ValidatingResourceTypeFactory([customFactory]);
        expect(factory).toBeInstanceOf(Config.ValidatingResourceTypeFactory);
      });
    });

    describe('create', () => {
      test('should validate and create from weakly-typed config', () => {
        const factory = new Config.ValidatingResourceTypeFactory([]);

        // Plain object with string properties
        const weakConfig = {
          name: 'test-json',
          typeName: 'json'
        };

        expect(factory.create(weakConfig)).toSucceedAndSatisfy((resourceType) => {
          expect(resourceType).toBeInstanceOf(TsRes.ResourceTypes.JsonResourceType);
          expect(resourceType.key).toBe('test-json');
        });
      });

      test('should fail with invalid config structure', () => {
        const factory = new Config.ValidatingResourceTypeFactory([]);

        const invalidConfig = {
          name: 'test'
          // Missing typeName
        };

        expect(factory.create(invalidConfig)).toFailWith(/field typeName not found/i);
      });

      test('should work with factory functions and weak types', () => {
        const factoryFunction: Config.ResourceTypeFactoryFunction = (config) => {
          if (config.typeName === 'custom-resource') {
            return TsRes.ResourceTypes.JsonResourceType.create({
              key: `custom-${config.name}`
            });
          }
          return fail('Not supported');
        };

        const factory = new Config.ValidatingResourceTypeFactory([factoryFunction]);

        const weakConfig = {
          name: 'test',
          typeName: 'custom-resource'
        };

        expect(factory.create(weakConfig)).toSucceedAndSatisfy((resourceType) => {
          expect(resourceType.key).toBe('custom-test');
        });
      });
    });
  });

  describe('ResourceTypeFactory', () => {
    describe('constructor', () => {
      test('should create factory with custom factories and built-in factory', () => {
        const customFactory: Config.IConfigInitFactory<
          TsRes.ResourceTypes.Config.IResourceTypeConfig,
          TsRes.ResourceTypes.ResourceType
        > = {
          create: (unusedConfig) => fail('Custom factory')
        };
        const factory = new Config.ResourceTypeFactory([customFactory]);

        // Should have custom factory + built-in factory
        expect(factory.factories).toHaveLength(2);
        expect(factory.factories[0]).toBe(customFactory);
        expect(factory.factories[1]).toBeInstanceOf(Config.BuiltInResourceTypeFactory);
      });

      test('should create factory with empty custom factories array', () => {
        const factory = new Config.ResourceTypeFactory([]);

        // Should have only built-in factory
        expect(factory.factories).toHaveLength(1);
        expect(factory.factories[0]).toBeInstanceOf(Config.BuiltInResourceTypeFactory);
      });

      test('should handle undefined factories array', () => {
        const factory = new Config.ResourceTypeFactory(
          undefined as unknown as Config.IConfigInitFactory<
            TsRes.ResourceTypes.Config.IResourceTypeConfig,
            TsRes.ResourceTypes.ResourceType
          >[]
        );

        // Should treat undefined as empty array and have only built-in factory
        expect(factory.factories).toHaveLength(1);
        expect(factory.factories[0]).toBeInstanceOf(Config.BuiltInResourceTypeFactory);
      });

      test('should create factory with multiple custom factories', () => {
        const factory1: Config.IConfigInitFactory<
          TsRes.ResourceTypes.Config.IResourceTypeConfig,
          TsRes.ResourceTypes.ResourceType
        > = {
          create: (unusedConfig) => fail('Factory 1')
        };
        const factory2: Config.IConfigInitFactory<
          TsRes.ResourceTypes.Config.IResourceTypeConfig,
          TsRes.ResourceTypes.ResourceType
        > = {
          create: (unusedConfig) => fail('Factory 2')
        };
        const factory = new Config.ResourceTypeFactory([factory1, factory2]);

        // Should have both custom factories + built-in factory
        expect(factory.factories).toHaveLength(3);
        expect(factory.factories[0]).toBe(factory1);
        expect(factory.factories[1]).toBe(factory2);
        expect(factory.factories[2]).toBeInstanceOf(Config.BuiltInResourceTypeFactory);
      });
    });

    describe('create', () => {
      test('should use custom factory when it succeeds', () => {
        const customFactory: Config.IConfigInitFactory<
          TsRes.ResourceTypes.Config.IResourceTypeConfig,
          TsRes.ResourceTypes.ResourceType
        > = {
          create: (config) => {
            if (config.typeName === 'custom') {
              // Create a minimal custom resource type for testing
              return TsRes.ResourceTypes.JsonResourceType.create({ key: config.name + '-custom' });
            }
            return fail('Custom factory cannot handle this');
          }
        };
        const factory = new Config.ResourceTypeFactory([customFactory]);

        const config: TsRes.ResourceTypes.Config.IResourceTypeConfig = {
          name: 'test',
          typeName: 'custom'
        };

        expect(factory.create(config)).toSucceedAndSatisfy((resourceType) => {
          expect(resourceType.key).toBe('test-custom');
        });
      });

      test('should fall back to built-in factory for system types', () => {
        const customFactory: Config.IConfigInitFactory<
          TsRes.ResourceTypes.Config.IResourceTypeConfig,
          TsRes.ResourceTypes.ResourceType
        > = {
          create: (unusedConfig) => fail('Custom factory cannot handle this')
        };
        const factory = new Config.ResourceTypeFactory([customFactory]);

        const config: TsRes.ResourceTypes.Config.IResourceTypeConfig = {
          name: 'test-json',
          typeName: 'json'
        };

        expect(factory.create(config)).toSucceedAndSatisfy((resourceType) => {
          expect(resourceType).toBeInstanceOf(TsRes.ResourceTypes.JsonResourceType);
          expect(resourceType.key).toBe('test-json');
        });
      });

      test('should fail when no factory can handle the config', () => {
        const alwaysFailingFactory: Config.IConfigInitFactory<
          TsRes.ResourceTypes.Config.IResourceTypeConfig,
          TsRes.ResourceTypes.ResourceType
        > = {
          create: (unusedConfig) => fail('Always failing factory')
        };
        const factory = new Config.ResourceTypeFactory([alwaysFailingFactory]);

        const config: TsRes.ResourceTypes.Config.IResourceTypeConfig = {
          name: 'unsupported',
          typeName: 'unsupported-type'
        };

        expect(factory.create(config)).toFailWith(/No factory was able to create the configuration object/);
      });
    });
  });

  describe('Factory helper functions', () => {
    describe('createQualifierTypeFactory', () => {
      test('should wrap a factory function in IConfigInitFactory interface', () => {
        const factoryFn: Config.QualifierTypeFactoryFunction = (config) => {
          if (config.systemType === 'wrapped') {
            return TsRes.QualifierTypes.LanguageQualifierType.createFromConfig({
              name: `wrapped-${config.name}`,
              systemType: 'language'
            });
          }
          return fail('Not supported');
        };

        const wrappedFactory = Config.createQualifierTypeFactory(factoryFn);

        const config = {
          name: 'test',
          systemType: 'wrapped',
          configuration: {}
        } as unknown as TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig;

        expect(wrappedFactory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
          expect(qualifierType.name).toBe('wrapped-test');
        });
      });

      test('should work in QualifierTypeFactory chain', () => {
        const factoryFn: Config.QualifierTypeFactoryFunction = (config) => {
          if (config.systemType === 'helper-test') {
            return TsRes.QualifierTypes.LiteralQualifierType.createFromConfig({
              name: config.name,
              systemType: 'literal'
            });
          }
          return fail('Not supported');
        };

        const factory = new Config.QualifierTypeFactory([Config.createQualifierTypeFactory(factoryFn)]);

        const config = {
          name: 'test',
          systemType: 'helper-test'
        } as unknown as TsRes.QualifierTypes.Config.IAnyQualifierTypeConfig;

        expect(factory.create(config)).toSucceedAndSatisfy((qualifierType) => {
          expect(qualifierType).toBeInstanceOf(TsRes.QualifierTypes.LiteralQualifierType);
        });
      });
    });

    describe('createResourceTypeFactory', () => {
      test('should wrap a factory function in IConfigInitFactory interface', () => {
        const factoryFn: Config.ResourceTypeFactoryFunction = (config) => {
          if (config.typeName === 'wrapped-resource') {
            return TsRes.ResourceTypes.JsonResourceType.create({
              key: `wrapped-${config.name}`
            });
          }
          return fail('Not supported');
        };

        const wrappedFactory = Config.createResourceTypeFactory(factoryFn);

        const config: TsRes.ResourceTypes.Config.IResourceTypeConfig = {
          name: 'test',
          typeName: 'wrapped-resource'
        };

        expect(wrappedFactory.create(config)).toSucceedAndSatisfy((resourceType) => {
          expect(resourceType.key).toBe('wrapped-test');
        });
      });

      test('should work in ResourceTypeFactory chain', () => {
        const factoryFn: Config.ResourceTypeFactoryFunction = (config) => {
          if (config.typeName === 'helper-resource') {
            return TsRes.ResourceTypes.JsonResourceType.create({
              key: `helper-${config.name}`
            });
          }
          return fail('Not supported');
        };

        const factory = new Config.ResourceTypeFactory([Config.createResourceTypeFactory(factoryFn)]);

        const config: TsRes.ResourceTypes.Config.IResourceTypeConfig = {
          name: 'test',
          typeName: 'helper-resource'
        };

        expect(factory.create(config)).toSucceedAndSatisfy((resourceType) => {
          expect(resourceType.key).toBe('helper-test');
        });
      });
    });
  });
});
