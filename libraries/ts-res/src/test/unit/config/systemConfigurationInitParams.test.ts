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

describe('SystemConfiguration InitParams', () => {
  let baseConfig: TsRes.Config.Model.ISystemConfiguration;

  beforeEach(() => {
    baseConfig = TsRes.Config.getPredefinedDeclaration('default').orThrow();
  });

  describe('updateSystemConfigurationQualifierDefaultValues helper function', () => {
    test('updates qualifier default values successfully', () => {
      const qualifierDefaultValues = {
        language: 'en-US',
        currentTerritory: 'US'
      };

      expect(
        TsRes.Config.updateSystemConfigurationQualifierDefaultValues(baseConfig, qualifierDefaultValues)
      ).toSucceedAndSatisfy((updatedConfig) => {
        const languageQualifier = updatedConfig.qualifiers.find((q) => q.name === 'language');
        const territoryQualifier = updatedConfig.qualifiers.find((q) => q.name === 'currentTerritory');

        expect(languageQualifier?.defaultValue).toBe('en-US');
        expect(territoryQualifier?.defaultValue).toBe('US');
      });
    });

    test('removes qualifier default values when set to null', () => {
      // First set a default value
      const configWithDefaults = TsRes.Config.updateSystemConfigurationQualifierDefaultValues(baseConfig, {
        language: 'en-US'
      }).orThrow();

      // Then remove it with null
      expect(
        TsRes.Config.updateSystemConfigurationQualifierDefaultValues(configWithDefaults, { language: null })
      ).toSucceedAndSatisfy((updatedConfig) => {
        const languageQualifier = updatedConfig.qualifiers.find((q) => q.name === 'language');
        expect(languageQualifier?.defaultValue).toBeUndefined();
      });
    });

    test('fails when qualifier does not exist in configuration', () => {
      const qualifierDefaultValues = {
        nonexistent: 'some-value'
      };

      expect(
        TsRes.Config.updateSystemConfigurationQualifierDefaultValues(baseConfig, qualifierDefaultValues)
      ).toFailWith(/Qualifier 'nonexistent' not found in system configuration/i);
    });

    test('updates only specified qualifiers, leaving others unchanged', () => {
      // Set initial default values for multiple qualifiers
      const initialConfig = TsRes.Config.updateSystemConfigurationQualifierDefaultValues(baseConfig, {
        language: 'fr-FR',
        currentTerritory: 'FR'
      }).orThrow();

      // Update only one qualifier
      expect(
        TsRes.Config.updateSystemConfigurationQualifierDefaultValues(initialConfig, { language: 'en-US' })
      ).toSucceedAndSatisfy((updatedConfig) => {
        const languageQualifier = updatedConfig.qualifiers.find((q) => q.name === 'language');
        const territoryQualifier = updatedConfig.qualifiers.find((q) => q.name === 'currentTerritory');

        expect(languageQualifier?.defaultValue).toBe('en-US');
        expect(territoryQualifier?.defaultValue).toBe('FR'); // Unchanged
      });
    });

    test('preserves original configuration structure', () => {
      const qualifierDefaultValues = { language: 'en-US' };

      expect(
        TsRes.Config.updateSystemConfigurationQualifierDefaultValues(baseConfig, qualifierDefaultValues)
      ).toSucceedAndSatisfy((updatedConfig) => {
        expect(updatedConfig.name).toBe(baseConfig.name);
        expect(updatedConfig.description).toBe(baseConfig.description);
        expect(updatedConfig.qualifierTypes).toEqual(baseConfig.qualifierTypes);
        expect(updatedConfig.resourceTypes).toEqual(baseConfig.resourceTypes);
        expect(updatedConfig.qualifiers.length).toBe(baseConfig.qualifiers.length);
      });
    });

    test('handles empty qualifier default values object', () => {
      expect(
        TsRes.Config.updateSystemConfigurationQualifierDefaultValues(baseConfig, {})
      ).toSucceedAndSatisfy((updatedConfig) => {
        expect(updatedConfig).toEqual(baseConfig);
      });
    });

    test('validates multiple qualifiers and fails if any is invalid', () => {
      const qualifierDefaultValues = {
        language: 'en-US',
        nonexistent1: 'value1',
        currentTerritory: 'US',
        nonexistent2: 'value2'
      };

      expect(
        TsRes.Config.updateSystemConfigurationQualifierDefaultValues(baseConfig, qualifierDefaultValues)
      ).toFailWith(/Qualifier 'nonexistent1' not found in system configuration/i);
    });
  });

  describe('SystemConfiguration.create with init params', () => {
    test('creates SystemConfiguration with updated qualifier default values', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          language: 'en-US',
          currentTerritory: 'US'
        }
      };

      expect(TsRes.Config.SystemConfiguration.create(baseConfig, initParams)).toSucceedAndSatisfy(
        (systemConfig) => {
          expect(systemConfig.qualifiers.validating.get('language')).toSucceedAndSatisfy(
            (languageQualifier) => {
              expect(languageQualifier.defaultValue).toBe('en-US');
            }
          );

          expect(systemConfig.qualifiers.validating.get('currentTerritory')).toSucceedAndSatisfy(
            (territoryQualifier) => {
              expect(territoryQualifier.defaultValue).toBe('US');
            }
          );
        }
      );
    });

    test('creates SystemConfiguration without init params (backward compatibility)', () => {
      expect(TsRes.Config.SystemConfiguration.create(baseConfig)).toSucceedAndSatisfy((systemConfig) => {
        expect(systemConfig.name).toBe(baseConfig.name);
        expect(systemConfig.qualifiers.size).toBeGreaterThan(0);
      });
    });

    test('creates SystemConfiguration with empty init params', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {};

      expect(TsRes.Config.SystemConfiguration.create(baseConfig, initParams)).toSucceedAndSatisfy(
        (systemConfig) => {
          expect(systemConfig.name).toBe(baseConfig.name);
          expect(systemConfig.qualifiers.size).toBeGreaterThan(0);
        }
      );
    });

    test('propagates validation errors from qualifier default value validation', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          language: 'invalid-language-tag'
        }
      };

      expect(TsRes.Config.SystemConfiguration.create(baseConfig, initParams)).toFailWith(
        /invalid.*context.*value/i
      );
    });

    test('fails when specified qualifier does not exist', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          nonexistent: 'some-value'
        }
      };

      expect(TsRes.Config.SystemConfiguration.create(baseConfig, initParams)).toFailWith(
        /Qualifier 'nonexistent' not found/i
      );
    });

    test('removes qualifier default values when set to null', () => {
      // First create a config with default values
      const configWithDefaults = TsRes.Config.updateSystemConfigurationQualifierDefaultValues(baseConfig, {
        language: 'en-US'
      }).orThrow();

      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          language: null
        }
      };

      expect(TsRes.Config.SystemConfiguration.create(configWithDefaults, initParams)).toSucceedAndSatisfy(
        (systemConfig) => {
          expect(systemConfig.qualifiers.validating.get('language')).toSucceedAndSatisfy(
            (languageQualifier) => {
              expect(languageQualifier.defaultValue).toBeUndefined();
            }
          );
        }
      );
    });
  });

  describe('getPredefinedSystemConfiguration with init params', () => {
    test('creates predefined SystemConfiguration with updated qualifier default values', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          language: 'fr-FR',
          currentTerritory: 'FR'
        }
      };

      expect(TsRes.Config.getPredefinedSystemConfiguration('default', initParams)).toSucceedAndSatisfy(
        (systemConfig) => {
          expect(systemConfig.qualifiers.validating.get('language')).toSucceedAndSatisfy(
            (languageQualifier) => {
              expect(languageQualifier.defaultValue).toBe('fr-FR');
            }
          );

          expect(systemConfig.qualifiers.validating.get('currentTerritory')).toSucceedAndSatisfy(
            (territoryQualifier) => {
              expect(territoryQualifier.defaultValue).toBe('FR');
            }
          );
        }
      );
    });

    test('maintains backward compatibility without init params', () => {
      expect(TsRes.Config.getPredefinedSystemConfiguration('default')).toSucceedAndSatisfy((systemConfig) => {
        expect(systemConfig.name).toBeDefined();
        expect(systemConfig.qualifiers.size).toBeGreaterThan(0);
      });
    });

    test('fails with invalid predefined configuration name', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: { language: 'en-US' }
      };

      expect(
        TsRes.Config.getPredefinedSystemConfiguration(
          'invalid-config' as TsRes.Config.PredefinedSystemConfiguration,
          initParams
        )
      ).toFailWith(/Unknown predefined system configuration/i);
    });
  });

  describe('Integration with qualifier validation', () => {
    test('validates language qualifier default values during system configuration creation', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          language: 'invalid-language-tag'
        }
      };

      expect(TsRes.Config.SystemConfiguration.create(baseConfig, initParams)).toFailWith(
        /invalid.*context.*value/i
      );
    });

    test('validates territory qualifier default values during system configuration creation', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          currentTerritory: 'INVALID_TERRITORY'
        }
      };

      expect(TsRes.Config.SystemConfiguration.create(baseConfig, initParams)).toFailWith(
        /invalid.*context.*value/i
      );
    });

    test('allows valid comma-separated language default values', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          language: 'en-US, fr-FR, de-DE'
        }
      };

      expect(TsRes.Config.SystemConfiguration.create(baseConfig, initParams)).toSucceedAndSatisfy(
        (systemConfig) => {
          expect(systemConfig.qualifiers.validating.get('language')).toSucceedAndSatisfy(
            (languageQualifier) => {
              expect(languageQualifier.defaultValue).toBe('en-US, fr-FR, de-DE');
            }
          );
        }
      );
    });

    test('rejects comma-separated territory default values when context list not allowed', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          currentTerritory: 'US, CA, GB'
        }
      };

      expect(TsRes.Config.SystemConfiguration.create(baseConfig, initParams)).toFailWith(
        /invalid.*context.*value/i
      );
    });
  });

  describe('Edge cases and boundary conditions', () => {
    test('handles multiple operations on the same configuration', () => {
      // Apply multiple sets of default values
      const step1 = TsRes.Config.updateSystemConfigurationQualifierDefaultValues(baseConfig, {
        language: 'en-US'
      }).orThrow();

      const step2 = TsRes.Config.updateSystemConfigurationQualifierDefaultValues(step1, {
        currentTerritory: 'US'
      }).orThrow();

      const step3 = TsRes.Config.updateSystemConfigurationQualifierDefaultValues(
        step2,
        { language: 'fr-FR' } // Override language
      ).orThrow();

      expect(TsRes.Config.SystemConfiguration.create(step3)).toSucceedAndSatisfy((systemConfig) => {
        expect(systemConfig.qualifiers.validating.get('language')).toSucceedAndSatisfy(
          (languageQualifier) => {
            expect(languageQualifier.defaultValue).toBe('fr-FR');
          }
        );

        expect(systemConfig.qualifiers.validating.get('currentTerritory')).toSucceedAndSatisfy(
          (territoryQualifier) => {
            expect(territoryQualifier.defaultValue).toBe('US');
          }
        );
      });
    });

    test('preserves qualifier properties other than defaultValue', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          language: 'en-US'
        }
      };

      expect(TsRes.Config.SystemConfiguration.create(baseConfig, initParams)).toSucceedAndSatisfy(
        (systemConfig) => {
          expect(systemConfig.qualifiers.validating.get('language')).toSucceedAndSatisfy(
            (languageQualifier) => {
              expect(languageQualifier.name).toBe('language');
              expect(languageQualifier.defaultPriority).toBeGreaterThan(0);
              expect(languageQualifier.type.name).toBe('language');
              expect(languageQualifier.defaultValue).toBe('en-US');
            }
          );
        }
      );
    });

    test('maintains original config immutability', () => {
      const originalConfigJson = JSON.stringify(baseConfig);
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          language: 'en-US'
        }
      };

      TsRes.Config.SystemConfiguration.create(baseConfig, initParams).orThrow();

      // Original config should be unchanged
      expect(JSON.stringify(baseConfig)).toBe(originalConfigJson);
    });

    test('handles special characters in default values', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          language: 'zh-Hans-CN'
        }
      };

      expect(TsRes.Config.SystemConfiguration.create(baseConfig, initParams)).toSucceedAndSatisfy(
        (systemConfig) => {
          expect(systemConfig.qualifiers.validating.get('language')).toSucceedAndSatisfy(
            (languageQualifier) => {
              expect(languageQualifier.defaultValue).toBe('zh-Hans-CN');
            }
          );
        }
      );
    });

    test('validates all qualifiers even when some succeed', () => {
      const initParams: TsRes.Config.ISystemConfigurationInitParams = {
        qualifierDefaultValues: {
          language: 'en-US', // Valid
          currentTerritory: 'INVALID', // Invalid
          nonexistent: 'value' // Non-existent (should fail first)
        }
      };

      // Should fail on the first error encountered (non-existent qualifier)
      expect(TsRes.Config.SystemConfiguration.create(baseConfig, initParams)).toFailWith(
        /Qualifier 'nonexistent' not found/i
      );
    });
  });
});
