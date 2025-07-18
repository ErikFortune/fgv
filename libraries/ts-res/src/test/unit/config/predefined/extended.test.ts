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

describe('Extended Example Configuration', () => {
  describe('ExtendedQualifierTypes', () => {
    test('exports extended qualifier types array', () => {
      expect(TsRes.Config.Example.ExtendedQualifierTypes).toBeDefined();
      expect(Array.isArray(TsRes.Config.Example.ExtendedQualifierTypes)).toBe(true);
      expect(TsRes.Config.Example.ExtendedQualifierTypes).toHaveLength(6);
    });

    test('can be used to create a working system configuration', () => {
      // This validates the structure is correct by attempting to use it
      const config: TsRes.Config.Model.ISystemConfiguration = {
        name: 'test-extended',
        description: 'Test extended configuration',
        qualifierTypes: [...TsRes.Config.Example.ExtendedQualifierTypes],
        qualifiers: [...TsRes.Config.Example.ExtendedQualifiers],
        resourceTypes: [...TsRes.Config.Example.ExtendedResourceTypes]
      };

      expect(TsRes.Config.SystemConfiguration.create(config)).toSucceedAndSatisfy((sysConfig) => {
        expect(sysConfig.qualifierTypes.size).toBe(6);

        // Verify language type
        expect(sysConfig.qualifierTypes.validating.get('language')).toSucceedAndSatisfy((qt) => {
          expect(qt.name).toBe('language');
          expect(qt.allowContextList).toBe(true);
        });

        // Verify territory type
        expect(sysConfig.qualifierTypes.validating.get('territory')).toSucceedAndSatisfy((qt) => {
          expect(qt.name).toBe('territory');
          expect(qt.allowContextList).toBe(false);
        });

        // Verify role type
        expect(sysConfig.qualifierTypes.validating.get('role')).toSucceedAndSatisfy((qt) => {
          expect(qt.name).toBe('role');
        });

        // Verify environment type
        expect(sysConfig.qualifierTypes.validating.get('environment')).toSucceedAndSatisfy((qt) => {
          expect(qt.name).toBe('environment');
        });

        // Verify currency type
        expect(sysConfig.qualifierTypes.validating.get('currency')).toSucceedAndSatisfy((qt) => {
          expect(qt.name).toBe('currency');
        });

        // Verify market type
        expect(sysConfig.qualifierTypes.validating.get('market')).toSucceedAndSatisfy((qt) => {
          expect(qt.name).toBe('market');
        });
      });
    });
  });

  describe('ExtendedQualifiers', () => {
    test('exports extended qualifiers array', () => {
      expect(TsRes.Config.Example.ExtendedQualifiers).toBeDefined();
      expect(Array.isArray(TsRes.Config.Example.ExtendedQualifiers)).toBe(true);
      expect(TsRes.Config.Example.ExtendedQualifiers).toHaveLength(7);
    });

    test('can be used to create a working system configuration', () => {
      const config: TsRes.Config.Model.ISystemConfiguration = {
        name: 'test-extended-qualifiers',
        description: 'Test extended qualifiers configuration',
        qualifierTypes: [...TsRes.Config.Example.ExtendedQualifierTypes],
        qualifiers: [...TsRes.Config.Example.ExtendedQualifiers],
        resourceTypes: [...TsRes.Config.Example.ExtendedResourceTypes]
      };

      expect(TsRes.Config.SystemConfiguration.create(config)).toSucceedAndSatisfy((sysConfig) => {
        expect(sysConfig.qualifiers.size).toBe(7);

        // Verify priority ordering
        expect(sysConfig.qualifiers.validating.get('homeTerritory')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('homeTerritory');
          expect(q.token).toBe('home');
          expect(q.type.name).toBe('territory');
          expect(q.defaultPriority).toBe(900);
        });

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

        expect(sysConfig.qualifiers.validating.get('market')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('market');
          expect(q.type.name).toBe('market');
          expect(q.defaultPriority).toBe(750);
        });

        expect(sysConfig.qualifiers.validating.get('role')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('role');
          expect(q.type.name).toBe('role');
          expect(q.defaultPriority).toBe(700);
        });

        expect(sysConfig.qualifiers.validating.get('environment')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('environment');
          expect(q.token).toBe('env');
          expect(q.type.name).toBe('environment');
          expect(q.defaultPriority).toBe(650);
        });

        expect(sysConfig.qualifiers.validating.get('currency')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('currency');
          expect(q.type.name).toBe('currency');
          expect(q.defaultPriority).toBe(600);
        });
      });
    });
  });

  describe('ExtendedResourceTypes', () => {
    test('exports extended resource types array', () => {
      expect(TsRes.Config.Example.ExtendedResourceTypes).toBeDefined();
      expect(Array.isArray(TsRes.Config.Example.ExtendedResourceTypes)).toBe(true);
      expect(TsRes.Config.Example.ExtendedResourceTypes).toHaveLength(1);
    });

    test('can be used to create a working system configuration', () => {
      const config: TsRes.Config.Model.ISystemConfiguration = {
        name: 'test-extended-resources',
        description: 'Test extended resource types configuration',
        qualifierTypes: [...TsRes.Config.Example.ExtendedQualifierTypes],
        qualifiers: [...TsRes.Config.Example.ExtendedQualifiers],
        resourceTypes: [...TsRes.Config.Example.ExtendedResourceTypes]
      };

      expect(TsRes.Config.SystemConfiguration.create(config)).toSucceedAndSatisfy((sysConfig) => {
        expect(sysConfig.resourceTypes.size).toBe(1);
        expect(sysConfig.resourceTypes.validating.get('json')).toSucceedAndSatisfy((rt) => {
          expect(rt.key).toBe('json');
        });
      });
    });
  });

  describe('ExtendedSystemConfiguration', () => {
    test('exports extended system configuration', () => {
      expect(TsRes.Config.Example.ExtendedSystemConfiguration).toBeDefined();
      expect(typeof TsRes.Config.Example.ExtendedSystemConfiguration).toBe('object');
    });

    test('can be used to create a SystemConfiguration', () => {
      expect(
        TsRes.Config.SystemConfiguration.create(TsRes.Config.Example.ExtendedSystemConfiguration)
      ).toSucceedAndSatisfy((sysConfig) => {
        expect(sysConfig.name).toBe('example');
        expect(sysConfig.description).toBe(
          'An example system configuration demonstrating various configuration options'
        );
        expect(sysConfig.qualifierTypes.size).toBe(6);
        expect(sysConfig.qualifiers.size).toBe(7);
        expect(sysConfig.resourceTypes.size).toBe(1);
      });
    });
  });

  describe('Extended Configuration Structure', () => {
    test('basic array structure is consistent', () => {
      expect(TsRes.Config.Example.ExtendedQualifierTypes).toHaveLength(6);
      expect(TsRes.Config.Example.ExtendedQualifiers).toHaveLength(7);
      expect(TsRes.Config.Example.ExtendedResourceTypes).toHaveLength(1);
    });

    test('extended configuration can be used together', () => {
      expect(
        TsRes.Config.SystemConfiguration.create(TsRes.Config.Example.ExtendedSystemConfiguration)
      ).toSucceed();

      // Test that components are reusable
      const customConfig: TsRes.Config.Model.ISystemConfiguration = {
        name: 'custom-extended',
        description: 'Custom configuration using extended components',
        qualifierTypes: [...TsRes.Config.Example.ExtendedQualifierTypes],
        qualifiers: [...TsRes.Config.Example.ExtendedQualifiers],
        resourceTypes: [...TsRes.Config.Example.ExtendedResourceTypes]
      };

      expect(TsRes.Config.SystemConfiguration.create(customConfig)).toSucceed();
    });
  });
});
