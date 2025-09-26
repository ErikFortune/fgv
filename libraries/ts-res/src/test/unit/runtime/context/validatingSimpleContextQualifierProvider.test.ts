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

describe('ValidatingSimpleContextQualifierProvider class', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create({
          name: 'priority',
          enumeratedValues: ['high', 'medium', 'low']
        }).orThrow()
      ]
    }).orThrow();

    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: [
        { name: 'language', typeName: 'language', defaultPriority: 600 },
        { name: 'territory', typeName: 'territory', defaultPriority: 700 },
        { name: 'priority', typeName: 'priority', defaultPriority: 500 }
      ]
    }).orThrow();
  });

  describe('create static method', () => {
    test('creates an empty ValidatingSimpleContextQualifierProvider by default', () => {
      expect(
        TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({ qualifiers })
      ).toSucceedAndSatisfy((provider) => {
        expect(provider.size).toBe(0);
        expect(provider.qualifiers).toBe(qualifiers);
        expect(provider.validating).toBeDefined();
        expect(provider.validating.provider).toBe(provider);
      });
    });

    test('creates a ValidatingSimpleContextQualifierProvider with initial string qualifier values', () => {
      const initialValues = {
        language: 'en-US',
        territory: 'US',
        priority: 'high'
      };

      expect(
        TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
          qualifiers,
          qualifierValues: initialValues
        })
      ).toSucceedAndSatisfy((provider) => {
        expect(provider.size).toBe(3);
        expect(provider.get('language' as TsRes.QualifierName)).toSucceedWith(
          'en-US' as TsRes.QualifierContextValue
        );
        expect(provider.get('territory' as TsRes.QualifierName)).toSucceedWith(
          'US' as TsRes.QualifierContextValue
        );
        expect(provider.get('priority' as TsRes.QualifierName)).toSucceedWith(
          'high' as TsRes.QualifierContextValue
        );
      });
    });

    test('fails with invalid qualifier name in initial values', () => {
      const invalidValues: Record<string, string> = {};
      invalidValues[''] = 'invalid';

      expect(
        TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
          qualifiers,
          qualifierValues: invalidValues
        })
      ).toFail();
    });
  });

  describe('validating property', () => {
    let provider: TsRes.Runtime.ValidatingSimpleContextQualifierProvider;

    beforeEach(() => {
      provider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US',
          priority: 'high'
        }
      }).orThrow();
    });

    test('provides string-based access to qualifier values', () => {
      expect(provider.validating.get('language')).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(provider.validating.get('territory')).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(provider.validating.get('priority')).toSucceedWith('high' as TsRes.QualifierContextValue);
      expect(provider.validating.get('nonexistent')).toFail();
    });

    test('provides index-based access to qualifier values', () => {
      expect(provider.validating.getByIndex(0)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(provider.validating.getByIndex(1)).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(provider.validating.getByIndex(2)).toSucceedWith('high' as TsRes.QualifierContextValue);
      expect(provider.validating.getByIndex(99)).toFail();
    });

    test('provides string-based validated access', () => {
      expect(provider.validating.getValidated('language')).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
      expect(provider.validating.getValidated('territory')).toSucceedWith(
        'US' as TsRes.QualifierContextValue
      );
      expect(provider.validating.getValidated('priority')).toSucceedWith(
        'high' as TsRes.QualifierContextValue
      );
      expect(provider.validating.getValidated('nonexistent')).toFailWith(/Not a valid qualifier name/);
    });

    test('provides index-based validated access', () => {
      expect(provider.validating.getValidatedByIndex(0)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
      expect(provider.validating.getValidatedByIndex(1)).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(provider.validating.getValidatedByIndex(2)).toSucceedWith('high' as TsRes.QualifierContextValue);
      expect(provider.validating.getValidatedByIndex(99)).toFailWith(/Not a valid qualifier index/);
    });

    test('validates values using qualifier type-specific validation', () => {
      // Create provider with invalid values that would pass get() but fail validation
      const providerWithInvalidValues = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'invalid-language-tag', // Invalid BCP47 tag
          territory: 'INVALID_TERRITORY', // Invalid territory
          priority: 'invalid-priority' // Invalid literal value
        }
      }).orThrow();

      // Regular get operations should succeed
      expect(providerWithInvalidValues.validating.get('language')).toSucceedWith(
        'invalid-language-tag' as TsRes.QualifierContextValue
      );
      expect(providerWithInvalidValues.validating.get('territory')).toSucceedWith(
        'INVALID_TERRITORY' as TsRes.QualifierContextValue
      );
      expect(providerWithInvalidValues.validating.get('priority')).toSucceedWith(
        'invalid-priority' as TsRes.QualifierContextValue
      );

      // But validation should fail
      expect(providerWithInvalidValues.validating.getValidated('language')).toFail();
      expect(providerWithInvalidValues.validating.getValidated('territory')).toFail();
      expect(providerWithInvalidValues.validating.getValidated('priority')).toFail();
    });

    test('validates literal values against enumerated options', () => {
      // Test all valid enumerated values for priority
      const validValues = ['high', 'medium', 'low'];
      for (const value of validValues) {
        provider.validating.set('priority', value).orThrow();
        expect(provider.validating.getValidated('priority')).toSucceedWith(
          value as TsRes.QualifierContextValue
        );
      }

      // Test that setting an invalid enumerated value fails in the validator
      expect(provider.validating.set('priority', 'invalid')).toFail();
    });

    test('provides string-based has method', () => {
      expect(provider.validating.has('language')).toSucceedWith(true);
      expect(provider.validating.has('territory')).toSucceedWith(true);
      expect(provider.validating.has('nonexistent')).toSucceedWith(false);
    });

    test('provides string-based set method', () => {
      expect(provider.validating.set('language', 'fr-FR')).toSucceedWith(
        'fr-FR' as TsRes.QualifierContextValue
      );
      expect(provider.validating.get('language')).toSucceedWith('fr-FR' as TsRes.QualifierContextValue);
      expect(provider.get('language' as TsRes.QualifierName)).toSucceedWith(
        'fr-FR' as TsRes.QualifierContextValue
      );
    });

    test('provides string-based remove method', () => {
      expect(provider.validating.remove('language')).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(provider.validating.get('language')).toFail();
      expect(provider.get('language' as TsRes.QualifierName)).toFail();
    });

    test('exposes the same qualifiers as the provider', () => {
      expect(provider.validating.qualifiers).toBe(provider.qualifiers);
      expect(provider.validating.qualifiers).toBe(qualifiers);
    });
  });

  describe('integration with base SimpleContextQualifierProvider', () => {
    test('maintains all functionality of base class', () => {
      const provider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US',
          territory: 'US'
        }
      }).orThrow();

      // Test base class methods with strongly-typed parameters
      expect(provider.get('language' as TsRes.QualifierName)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
      expect(provider.get(0 as TsRes.QualifierIndex)).toSucceedWith('en-US' as TsRes.QualifierContextValue);

      const languageQualifier = qualifiers.getByNameOrToken('language').orThrow();
      expect(provider.get(languageQualifier)).toSucceedWith('en-US' as TsRes.QualifierContextValue);

      expect(provider.has('language' as TsRes.QualifierName)).toSucceedWith(true);
      expect(provider.has('priority' as TsRes.QualifierName)).toSucceedWith(false);

      expect(provider.getNames()).toSucceedAndSatisfy((names) => {
        expect(names).toHaveLength(2);
        expect(names).toContain('language');
        expect(names).toContain('territory');
      });

      expect(provider.size).toBe(2);

      // Test mutation methods
      expect(
        provider.set('priority' as TsRes.QualifierName, 'high' as TsRes.QualifierContextValue)
      ).toSucceedWith('high' as TsRes.QualifierContextValue);
      expect(provider.size).toBe(3);

      expect(provider.remove('territory' as TsRes.QualifierName)).toSucceedWith(
        'US' as TsRes.QualifierContextValue
      );
      expect(provider.size).toBe(2);

      provider.clear();
      expect(provider.size).toBe(0);
    });

    test('covers the rarely-used special case constructor branch', () => {
      // Force testing of edge case in line 73 by passing undefined qualifierValues
      const provider = TsRes.Runtime.ValidatingSimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: undefined as unknown as Record<string, string>
      });
      expect(provider).toSucceed();
    });
  });
});
