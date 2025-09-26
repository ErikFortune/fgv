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
import * as TsRes from '../../../index';

// Helper interface for testing JsonObject results with known structure
interface ILanguageConfigJsonResult {
  name: string;
  systemType: string;
  configuration?: {
    allowContextList?: boolean;
  };
}

const validTags: string[] = [
  'en-US',
  'en-us',
  'EN-GB',
  'fr',
  'sr-Cyrl-RS',
  'cmn-Hans-CN',
  'es-419',
  'ca-valencia'
];

const invalidTags: string[] = ['en_US', 'fr-', 'sr-Cyrl_RS', 'cmn-Hans_CN', 'es-', 'ca-valencia-'];

describe('LanguageQualifierType', () => {
  describe('create static method', () => {
    test('creates a new LanguageQualifierType with defaults', () => {
      expect(TsRes.QualifierTypes.LanguageQualifierType.create()).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('language');
        expect(q.name).toBe('language');
        expect(q.allowContextList).toBe(true);
        expect(q.index).toBeUndefined();
      });
    });

    test('creates a new LanguageQualifierType with specified values', () => {
      expect(
        TsRes.QualifierTypes.LanguageQualifierType.create({
          name: 'lang',
          allowContextList: false,
          index: 10
        })
      ).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('lang');
        expect(q.name).toBe('lang');
        expect(q.allowContextList).toBe(false);
        expect(q.index).toBe(10);
      });
    });

    test('fails if the name is not a valid qualifier type name', () => {
      expect(
        TsRes.QualifierTypes.LanguageQualifierType.create({
          name: 'not a valid name'
        })
      ).toFailWith(/invalid qualifier type name/i);
    });
  });

  describe('isValidConditionValue', () => {
    let qt: TsRes.QualifierTypes.LanguageQualifierType;

    beforeEach(() => {
      qt = TsRes.QualifierTypes.LanguageQualifierType.create().getValueOrThrow();
    });

    test('returns true for well-formed BCP-47 tags', () => {
      validTags.forEach((tag) => {
        expect(qt.isValidConditionValue(tag)).toBe(true);
      });
    });

    test('returns false for malformed BCP-47 tags', () => {
      invalidTags.forEach((tag) => {
        expect(qt.isValidConditionValue(tag)).toBe(false);
      });
    });

    describe('matches', () => {
      test('returns a match score for matching tags', () => {
        const condition = 'en-US' as TsRes.QualifierConditionValue;
        const context = 'en-US' as TsRes.QualifierContextValue;
        expect(qt.matches(condition, context, 'matches')).toBe(TsRes.PerfectMatch);
      });

      test('matches using linguistic similarity', () => {
        const condition = 'en' as TsRes.QualifierConditionValue;
        const context = 'en-us' as TsRes.QualifierContextValue;
        const match = qt.matches(condition, context, 'matches');
        expect(match).toBeGreaterThan(TsRes.NoMatch);
        expect(match).toBeLessThan(TsRes.PerfectMatch);
      });

      test('fails for dissimilar tags', () => {
        const condition = 'en' as TsRes.QualifierConditionValue;
        const context = 'fr' as TsRes.QualifierContextValue;
        expect(qt.matches(condition, context, 'matches')).toBe(TsRes.NoMatch);
      });

      test('returns decreasing match scores for subsequent values in a list', () => {
        const context = 'en-US,fr-CA,es-419' as TsRes.QualifierContextValue;
        const exactMatches = ['en-US', 'fr-CA', 'es-419'] as TsRes.QualifierConditionValue[];
        const similarMatches = ['en-GB', 'fr-BE', 'es-ES'] as TsRes.QualifierConditionValue[];

        let score = qt.matches(exactMatches[0], context, 'matches');
        let partialScore = qt.matches(similarMatches[0], context, 'matches');
        expect(score).toBe(TsRes.PerfectMatch);
        expect(partialScore).toBeLessThan(TsRes.PerfectMatch);
        expect(partialScore).toBeGreaterThan(TsRes.NoMatch);

        let lastScore = score;
        let lastPartialScore = partialScore;

        for (let i = 1; i < exactMatches.length; i++) {
          score = qt.matches(exactMatches[i], context, 'matches');
          partialScore = qt.matches(similarMatches[i], context, 'matches');

          expect(score).toBeLessThan(lastScore);
          expect(score).toBeLessThan(lastPartialScore);
          expect(partialScore).toBeLessThan(lastPartialScore);
          expect(partialScore).toBeLessThan(score);
          expect(partialScore).toBeGreaterThan(TsRes.NoMatch);
          lastScore = score;
          lastPartialScore = partialScore;
        }
      });
    });
  });

  describe('createFromConfig static method', () => {
    test('creates a new LanguageQualifierType with minimal config', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILanguageQualifierTypeConfig> =
        {
          name: 'language',
          systemType: 'language'
        };

      expect(TsRes.QualifierTypes.LanguageQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('language');
        expect(q.name).toBe('language');
        expect(q.allowContextList).toBe(false);
        expect(q.index).toBeUndefined();
      });
    });

    test('creates a new LanguageQualifierType with custom name', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILanguageQualifierTypeConfig> =
        {
          name: 'lang',
          systemType: 'language'
        };

      expect(TsRes.QualifierTypes.LanguageQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('lang');
        expect(q.name).toBe('lang');
        expect(q.allowContextList).toBe(false);
        expect(q.index).toBeUndefined();
      });
    });

    test('creates a new LanguageQualifierType with allowContextList enabled', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILanguageQualifierTypeConfig> =
        {
          name: 'language',
          systemType: 'language',
          configuration: {
            allowContextList: true
          }
        };

      expect(TsRes.QualifierTypes.LanguageQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('language');
        expect(q.name).toBe('language');
        expect(q.allowContextList).toBe(true);
        expect(q.index).toBeUndefined();
      });
    });

    test('creates a new LanguageQualifierType with allowContextList disabled', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILanguageQualifierTypeConfig> =
        {
          name: 'language',
          systemType: 'language',
          configuration: {
            allowContextList: false
          }
        };

      expect(TsRes.QualifierTypes.LanguageQualifierType.createFromConfig(config)).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.LanguageQualifierType);
        expect(q.key).toBe('language');
        expect(q.name).toBe('language');
        expect(q.allowContextList).toBe(false);
        expect(q.index).toBeUndefined();
      });
    });

    test('fails if the name is not a valid qualifier type name', () => {
      const config: TsRes.QualifierTypes.Config.IQualifierTypeConfig<TsRes.QualifierTypes.Config.ILanguageQualifierTypeConfig> =
        {
          name: 'not a valid name',
          systemType: 'language'
        };

      expect(TsRes.QualifierTypes.LanguageQualifierType.createFromConfig(config)).toFailWith(
        /invalid qualifier type name/i
      );
    });
  });

  describe('getConfigurationJson', () => {
    test('returns valid configuration JSON with default settings', () => {
      expect(TsRes.QualifierTypes.LanguageQualifierType.create()).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((config) => {
          expect(config).toEqual({
            name: 'language',
            systemType: 'language',
            configuration: {
              allowContextList: true
            }
          });
        });
      });
    });

    test('returns valid configuration JSON with custom name', () => {
      expect(TsRes.QualifierTypes.LanguageQualifierType.create({ name: 'custom-lang' })).toSucceedAndSatisfy(
        (qt) => {
          expect(qt.getConfigurationJson()).toSucceedAndSatisfy((config) => {
            expect(config).toEqual({
              name: 'custom-lang',
              systemType: 'language',
              configuration: {
                allowContextList: true
              }
            });
          });
        }
      );
    });

    test('returns valid configuration JSON with allowContextList disabled', () => {
      expect(
        TsRes.QualifierTypes.LanguageQualifierType.create({ allowContextList: false })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((config) => {
          expect(config).toEqual({
            name: 'language',
            systemType: 'language',
            configuration: {
              allowContextList: false
            }
          });
        });
      });
    });

    test('returns valid configuration JSON with all custom settings', () => {
      const params = {
        name: 'specialized-language',
        allowContextList: false,
        index: 42
      };
      expect(TsRes.QualifierTypes.LanguageQualifierType.create(params)).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((config) => {
          expect(config).toEqual({
            name: 'specialized-language',
            systemType: 'language',
            configuration: {
              allowContextList: false
            }
          });
        });
      });
    });
  });

  describe('getConfiguration', () => {
    test('strongly-typed getConfiguration method exists', () => {
      expect(TsRes.QualifierTypes.LanguageQualifierType.create()).toSucceedAndSatisfy((qt) => {
        expect(typeof qt.getConfiguration).toBe('function');
      });
    });

    test('returns strongly-typed configuration matching getConfigurationJson', () => {
      expect(TsRes.QualifierTypes.LanguageQualifierType.create()).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfiguration()).toSucceedWith({
          name: 'language',
          systemType: 'language',
          configuration: {
            allowContextList: true
          }
        });
      });
    });

    test('getConfiguration returns correct values for custom name', () => {
      expect(TsRes.QualifierTypes.LanguageQualifierType.create({ name: 'custom-lang' })).toSucceedAndSatisfy(
        (qt) => {
          expect(qt.getConfiguration()).toSucceedWith({
            name: 'custom-lang',
            systemType: 'language',
            configuration: {
              allowContextList: true
            }
          });
        }
      );
    });

    test('getConfiguration returns correct values with allowContextList disabled', () => {
      expect(
        TsRes.QualifierTypes.LanguageQualifierType.create({ allowContextList: false })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfiguration()).toSucceedWith({
          name: 'language',
          systemType: 'language',
          configuration: {
            allowContextList: false
          }
        });
      });
    });

    test('getConfiguration returns correct values with all custom settings', () => {
      const params = {
        name: 'specialized-language',
        allowContextList: false,
        index: 42
      };
      expect(TsRes.QualifierTypes.LanguageQualifierType.create(params)).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfiguration()).toSucceedWith({
          name: 'specialized-language',
          systemType: 'language',
          configuration: {
            allowContextList: false
          }
        });
      });
    });

    test('getConfiguration and getConfigurationJson return equivalent data', () => {
      expect(TsRes.QualifierTypes.LanguageQualifierType.create()).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((jsonConfig) => {
          expect(qt.getConfiguration()).toSucceedAndSatisfy((typedConfig) => {
            // Both should return equivalent data structures
            expect(typedConfig).toEqual(jsonConfig);
            expect(typedConfig).toEqual({
              name: 'language',
              systemType: 'language',
              configuration: {
                allowContextList: true
              }
            });
          });
        });
      });
    });

    test('getConfiguration and getConfigurationJson return equivalent data with custom name', () => {
      expect(TsRes.QualifierTypes.LanguageQualifierType.create({ name: 'custom-lang' })).toSucceedAndSatisfy(
        (qt) => {
          expect(qt.getConfigurationJson()).toSucceedAndSatisfy((jsonConfig) => {
            expect(qt.getConfiguration()).toSucceedAndSatisfy((typedConfig) => {
              expect(typedConfig).toEqual(jsonConfig);
              expect(typedConfig).toEqual({
                name: 'custom-lang',
                systemType: 'language',
                configuration: {
                  allowContextList: true
                }
              });
            });
          });
        }
      );
    });

    test('getConfiguration and getConfigurationJson return equivalent data with allowContextList disabled', () => {
      expect(
        TsRes.QualifierTypes.LanguageQualifierType.create({ allowContextList: false })
      ).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((jsonConfig) => {
          expect(qt.getConfiguration()).toSucceedAndSatisfy((typedConfig) => {
            expect(typedConfig).toEqual(jsonConfig);
            expect(typedConfig).toEqual({
              name: 'language',
              systemType: 'language',
              configuration: {
                allowContextList: false
              }
            });
          });
        });
      });
    });

    test('getConfiguration and getConfigurationJson return equivalent data with all custom settings', () => {
      const params = {
        name: 'specialized-language',
        allowContextList: false,
        index: 42
      };
      expect(TsRes.QualifierTypes.LanguageQualifierType.create(params)).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfigurationJson()).toSucceedAndSatisfy((jsonConfig) => {
          expect(qt.getConfiguration()).toSucceedAndSatisfy((typedConfig) => {
            expect(typedConfig).toEqual(jsonConfig);
            expect(typedConfig).toEqual({
              name: 'specialized-language',
              systemType: 'language',
              configuration: {
                allowContextList: false
              }
            });
          });
        });
      });
    });

    test('getConfiguration method returns strongly typed results', () => {
      expect(TsRes.QualifierTypes.LanguageQualifierType.create()).toSucceedAndSatisfy((qt) => {
        expect(qt.getConfiguration()).toSucceedAndSatisfy((config) => {
          // Verify the configuration has the expected structure and types
          expect(config.name).toBe('language');
          expect(config.systemType).toBe('language');
          expect(config.configuration).toBeDefined();
          if (config.configuration) {
            expect(config.configuration.allowContextList).toBe(true);

            // The method should provide compile-time type safety
            // (this is verified by TypeScript compilation, not runtime assertions)
            expect(typeof config.name).toBe('string');
            expect(typeof config.systemType).toBe('string');
            expect(typeof config.configuration.allowContextList).toBe('boolean');
          }
        });
      });
    });
  });

  describe('validateConfigurationJson', () => {
    let qualifierType: TsRes.QualifierTypes.LanguageQualifierType;

    beforeEach(() => {
      qualifierType = TsRes.QualifierTypes.LanguageQualifierType.create().orThrow();
    });

    test('succeeds with valid minimal configuration object', () => {
      const validConfig = {
        name: 'test-language',
        systemType: 'language'
      };

      expect(qualifierType.validateConfigurationJson(validConfig)).toSucceedAndSatisfy((result) => {
        const typedResult = result as unknown as ILanguageConfigJsonResult;
        expect(typedResult.name).toBe('test-language');
        expect(typedResult.systemType).toBe('language');
        expect(typedResult.configuration).toBeUndefined();
      });
    });

    test('succeeds with valid configuration including allowContextList', () => {
      const validConfig = {
        name: 'test-language',
        systemType: 'language',
        configuration: {
          allowContextList: false
        }
      };

      expect(qualifierType.validateConfigurationJson(validConfig)).toSucceedAndSatisfy((result) => {
        const typedResult = result as unknown as ILanguageConfigJsonResult;
        expect(typedResult.name).toBe('test-language');
        expect(typedResult.systemType).toBe('language');
        expect(typedResult.configuration).toEqual({ allowContextList: false });
      });
    });

    test('succeeds with valid configuration with allowContextList true', () => {
      const validConfig = {
        name: 'language-with-context',
        systemType: 'language' as const,
        configuration: {
          allowContextList: true
        }
      };

      expect(qualifierType.validateConfigurationJson(validConfig)).toSucceedWith(validConfig);
    });

    test('fails with missing name field', () => {
      const invalidConfig = {
        systemType: 'language'
      };

      expect(qualifierType.validateConfigurationJson(invalidConfig)).toFailWith(/field name not found/i);
    });

    test('fails with missing systemType field', () => {
      const invalidConfig = {
        name: 'test-language'
      };

      expect(qualifierType.validateConfigurationJson(invalidConfig)).toFailWith(
        /field systemType not found/i
      );
    });

    test('fails with incorrect systemType value', () => {
      const invalidConfig = {
        name: 'test-language',
        systemType: 'territory'
      };

      expect(qualifierType.validateConfigurationJson(invalidConfig)).toFailWith(/systemType.*language/i);
    });

    test('fails with non-string name', () => {
      const invalidConfig = {
        name: 123 as unknown as string,
        systemType: 'language'
      };

      expect(qualifierType.validateConfigurationJson(invalidConfig)).toFailWith(/name.*string/i);
    });

    test('fails with non-boolean allowContextList in configuration', () => {
      const invalidConfig = {
        name: 'test-language',
        systemType: 'language',
        configuration: {
          allowContextList: 'invalid' as unknown as boolean
        }
      };

      expect(qualifierType.validateConfigurationJson(invalidConfig)).toFailWith(/not a boolean/i);
    });

    test('fails with null input', () => {
      expect(qualifierType.validateConfigurationJson(null)).toFailWith(/object/i);
    });

    test('fails with undefined input', () => {
      expect(qualifierType.validateConfigurationJson(undefined)).toFailWith(/object/i);
    });

    test('fails with non-object input', () => {
      expect(qualifierType.validateConfigurationJson('not an object')).toFailWith(/object/i);
    });

    test('fails with array input', () => {
      expect(qualifierType.validateConfigurationJson([])).toFailWith(/object/i);
    });

    test('fails with additional unexpected properties', () => {
      const invalidConfig = {
        name: 'test-language',
        systemType: 'language',
        unexpectedProperty: 'value'
      };

      expect(qualifierType.validateConfigurationJson(invalidConfig)).toFailWith(/unexpected.*property/i);
    });

    test('fails with invalid configuration object structure', () => {
      const invalidConfig = {
        name: 'test-language',
        systemType: 'language',
        configuration: 'invalid'
      };

      expect(qualifierType.validateConfigurationJson(invalidConfig)).toFailWith(/configuration.*object/i);
    });
  });

  describe('validateConfiguration', () => {
    let qualifierType: TsRes.QualifierTypes.LanguageQualifierType;

    beforeEach(() => {
      qualifierType = TsRes.QualifierTypes.LanguageQualifierType.create().orThrow();
    });

    test('succeeds with valid minimal configuration object', () => {
      const validConfig = {
        name: 'test-language',
        systemType: 'language'
      };

      expect(qualifierType.validateConfiguration(validConfig)).toSucceedAndSatisfy((result) => {
        expect(result.name).toBe('test-language');
        expect(result.systemType).toBe('language');
        expect(result.configuration).toBeUndefined();
      });
    });

    test('succeeds with valid configuration including allowContextList', () => {
      const validConfig = {
        name: 'test-language',
        systemType: 'language',
        configuration: {
          allowContextList: false
        }
      };

      expect(qualifierType.validateConfiguration(validConfig)).toSucceedAndSatisfy((result) => {
        expect(result.name).toBe('test-language');
        expect(result.systemType).toBe('language');
        expect(result.configuration?.allowContextList).toBe(false);
      });
    });

    test('returns strongly typed configuration object', () => {
      const validConfig = {
        name: 'typed-language',
        systemType: 'language',
        configuration: {
          allowContextList: true
        }
      };

      expect(qualifierType.validateConfiguration(validConfig)).toSucceedAndSatisfy((result) => {
        // Verify strong typing - these should compile without errors
        const name: string = result.name;
        const systemType: 'language' = result.systemType;
        const allowContextList: boolean | undefined = result.configuration?.allowContextList;

        expect(name).toBe('typed-language');
        expect(systemType).toBe('language');
        expect(allowContextList).toBe(true);
      });
    });

    test('calls validateConfigurationJson internally', () => {
      // Test that validateConfiguration properly chains through validateConfigurationJson
      const invalidConfig = {
        name: 'test-language'
        // Missing systemType
      };

      expect(qualifierType.validateConfiguration(invalidConfig)).toFailWith(/field systemType not found/i);
    });

    test('fails with same validation errors as validateConfigurationJson', () => {
      const invalidConfig = {
        name: 'test-language',
        systemType: 'territory' // Wrong system type
      };

      // Both methods should fail with the same error pattern
      expect(qualifierType.validateConfiguration(invalidConfig)).toFailWith(/systemType.*language/i);
      expect(qualifierType.validateConfigurationJson(invalidConfig)).toFailWith(/systemType.*language/i);
    });

    test('handles complex invalid configurations', () => {
      const invalidConfig = {
        name: 123 as unknown as string,
        systemType: 'language',
        configuration: {
          allowContextList: 'invalid' as unknown as boolean,
          unexpectedField: 'value'
        }
      };

      expect(qualifierType.validateConfiguration(invalidConfig)).toFail();
    });
  });
});
