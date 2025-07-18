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

describe('Config Helper Functions', () => {
  describe('allPredefinedSystemConfigurations', () => {
    test('exports all predefined system configuration names', () => {
      expect(TsRes.Config.allPredefinedSystemConfigurations).toBeDefined();
      expect(Array.isArray(TsRes.Config.allPredefinedSystemConfigurations)).toBe(true);
      expect(TsRes.Config.allPredefinedSystemConfigurations).toHaveLength(4);
      expect(TsRes.Config.allPredefinedSystemConfigurations).toEqual([
        'default',
        'language-priority',
        'territory-priority',
        'extended-example'
      ]);
    });
  });

  describe('getPredefinedDeclaration', () => {
    test('returns declaration for default configuration', () => {
      expect(TsRes.Config.getPredefinedDeclaration('default')).toSucceedAndSatisfy((decl) => {
        expect(decl.name).toBe('default');
        expect(decl.description).toBe('Default system configuration');
        expect(decl.qualifierTypes).toHaveLength(2);
        expect(decl.qualifiers).toHaveLength(2);
        expect(decl.resourceTypes).toHaveLength(1);
      });
    });

    test('returns declaration for language-priority configuration', () => {
      expect(TsRes.Config.getPredefinedDeclaration('language-priority')).toSucceedAndSatisfy((decl) => {
        expect(decl.name).toBe('default');
        expect(decl.description).toBe('Default system configuration');
        expect(decl.qualifierTypes).toHaveLength(2);
        expect(decl.qualifiers).toHaveLength(2);
        expect(decl.resourceTypes).toHaveLength(1);

        // Verify language priority
        const languageQualifier = decl.qualifiers.find((q) => q.name === 'language');
        const territoryQualifier = decl.qualifiers.find((q) => q.name === 'currentTerritory');
        expect(languageQualifier?.defaultPriority).toBe(850);
        expect(territoryQualifier?.defaultPriority).toBe(800);
      });
    });

    test('returns declaration for territory-priority configuration', () => {
      expect(TsRes.Config.getPredefinedDeclaration('territory-priority')).toSucceedAndSatisfy((decl) => {
        expect(decl.name).toBe('default');
        expect(decl.description).toBe('Default system configuration');
        expect(decl.qualifierTypes).toHaveLength(2);
        expect(decl.qualifiers).toHaveLength(2);
        expect(decl.resourceTypes).toHaveLength(1);

        // Verify territory priority
        const languageQualifier = decl.qualifiers.find((q) => q.name === 'language');
        const territoryQualifier = decl.qualifiers.find((q) => q.name === 'currentTerritory');
        expect(territoryQualifier?.defaultPriority).toBe(850);
        expect(languageQualifier?.defaultPriority).toBe(800);
      });
    });

    test('returns declaration for extended-example configuration', () => {
      expect(TsRes.Config.getPredefinedDeclaration('extended-example')).toSucceedAndSatisfy((decl) => {
        expect(decl.name).toBe('example');
        expect(decl.description).toBe(
          'An example system configuration demonstrating various configuration options'
        );
        expect(decl.qualifierTypes).toHaveLength(6);
        expect(decl.qualifiers).toHaveLength(7);
        expect(decl.resourceTypes).toHaveLength(1);
      });
    });

    test('fails for unknown configuration name', () => {
      expect(
        TsRes.Config.getPredefinedDeclaration('unknown' as TsRes.Config.PredefinedSystemConfiguration)
      ).toFailWith(/Unknown predefined system configuration/i);
    });
  });

  describe('getPredefinedSystemConfiguration', () => {
    test('returns SystemConfiguration for default configuration', () => {
      expect(TsRes.Config.getPredefinedSystemConfiguration('default')).toSucceedAndSatisfy((sysConfig) => {
        expect(sysConfig.name).toBe('default');
        expect(sysConfig.description).toBe('Default system configuration');
        expect(sysConfig.qualifierTypes.size).toBe(2);
        expect(sysConfig.qualifiers.size).toBe(2);
        expect(sysConfig.resourceTypes.size).toBe(1);

        // Verify the configuration matches the declaration
        const originalDecl = TsRes.Config.getPredefinedDeclaration('default').orThrow();
        expect(sysConfig.getConfig()).toSucceedWith(originalDecl);
      });
    });

    test('returns SystemConfiguration for language-priority configuration', () => {
      expect(TsRes.Config.getPredefinedSystemConfiguration('language-priority')).toSucceedAndSatisfy(
        (sysConfig) => {
          expect(sysConfig.name).toBe('default');
          expect(sysConfig.description).toBe('Default system configuration');
          expect(sysConfig.qualifierTypes.size).toBe(2);
          expect(sysConfig.qualifiers.size).toBe(2);
          expect(sysConfig.resourceTypes.size).toBe(1);

          // Verify language priority
          const languageQ = sysConfig.qualifiers.validating.get('language').orThrow();
          const territoryQ = sysConfig.qualifiers.validating.get('currentTerritory').orThrow();
          expect(languageQ.defaultPriority).toBeGreaterThan(territoryQ.defaultPriority);

          // Verify the configuration matches the declaration
          const originalDecl = TsRes.Config.getPredefinedDeclaration('language-priority').orThrow();
          expect(sysConfig.getConfig()).toSucceedWith(originalDecl);
        }
      );
    });

    test('returns SystemConfiguration for territory-priority configuration', () => {
      expect(TsRes.Config.getPredefinedSystemConfiguration('territory-priority')).toSucceedAndSatisfy(
        (sysConfig) => {
          expect(sysConfig.name).toBe('default');
          expect(sysConfig.description).toBe('Default system configuration');
          expect(sysConfig.qualifierTypes.size).toBe(2);
          expect(sysConfig.qualifiers.size).toBe(2);
          expect(sysConfig.resourceTypes.size).toBe(1);

          // Verify territory priority
          const territoryQ = sysConfig.qualifiers.validating.get('currentTerritory').orThrow();
          const languageQ = sysConfig.qualifiers.validating.get('language').orThrow();
          expect(territoryQ.defaultPriority).toBeGreaterThan(languageQ.defaultPriority);

          // Verify the configuration matches the declaration
          const originalDecl = TsRes.Config.getPredefinedDeclaration('territory-priority').orThrow();
          expect(sysConfig.getConfig()).toSucceedWith(originalDecl);
        }
      );
    });

    test('returns SystemConfiguration for extended-example configuration', () => {
      expect(TsRes.Config.getPredefinedSystemConfiguration('extended-example')).toSucceedAndSatisfy(
        (sysConfig) => {
          expect(sysConfig.name).toBe('example');
          expect(sysConfig.description).toBe(
            'An example system configuration demonstrating various configuration options'
          );
          expect(sysConfig.qualifierTypes.size).toBe(6);
          expect(sysConfig.qualifiers.size).toBe(7);
          expect(sysConfig.resourceTypes.size).toBe(1);

          // Verify priority ordering
          const homeTerritory = sysConfig.qualifiers.validating.get('homeTerritory').orThrow();
          const currentTerritory = sysConfig.qualifiers.validating.get('currentTerritory').orThrow();
          const language = sysConfig.qualifiers.validating.get('language').orThrow();
          const market = sysConfig.qualifiers.validating.get('market').orThrow();
          const role = sysConfig.qualifiers.validating.get('role').orThrow();
          const environment = sysConfig.qualifiers.validating.get('environment').orThrow();
          const currency = sysConfig.qualifiers.validating.get('currency').orThrow();

          expect(homeTerritory.defaultPriority).toBe(900);
          expect(currentTerritory.defaultPriority).toBe(850);
          expect(language.defaultPriority).toBe(800);
          expect(market.defaultPriority).toBe(750);
          expect(role.defaultPriority).toBe(700);
          expect(environment.defaultPriority).toBe(650);
          expect(currency.defaultPriority).toBe(600);

          // Verify the configuration matches the declaration
          const originalDecl = TsRes.Config.getPredefinedDeclaration('extended-example').orThrow();
          expect(sysConfig.getConfig()).toSucceedWith(originalDecl);
        }
      );
    });

    test('fails for unknown configuration name', () => {
      expect(
        TsRes.Config.getPredefinedSystemConfiguration('unknown' as TsRes.Config.PredefinedSystemConfiguration)
      ).toFailWith(/Unknown predefined system configuration/i);
    });
  });

  describe('PredefinedSystemConfiguration type', () => {
    test('includes all expected configuration names', () => {
      // This test ensures that all predefined configurations are properly typed
      const validNames: TsRes.Config.PredefinedSystemConfiguration[] = [
        'default',
        'language-priority',
        'territory-priority',
        'extended-example'
      ];

      validNames.forEach((name) => {
        expect(TsRes.Config.getPredefinedSystemConfiguration(name)).toSucceed();
      });
    });
  });
});
