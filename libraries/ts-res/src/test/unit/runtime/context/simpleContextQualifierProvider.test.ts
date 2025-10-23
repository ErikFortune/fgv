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

describe('SimpleContextQualifierProvider class', () => {
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
    test('creates an empty SimpleContextQualifierProvider by default', () => {
      expect(TsRes.Runtime.SimpleContextQualifierProvider.create({ qualifiers })).toSucceedAndSatisfy(
        (provider) => {
          expect(provider.size).toBe(0);
          expect(provider.qualifiers).toBe(qualifiers);
        }
      );
    });

    test('handles constructor failures gracefully', () => {
      // Test with invalid qualifier values to trigger constructor failure
      const invalidValues: Record<string, TsRes.QualifierContextValue> = {};
      invalidValues['invalid-name!'] = 'invalid' as TsRes.QualifierContextValue;

      expect(
        TsRes.Runtime.SimpleContextQualifierProvider.create({
          qualifiers,
          qualifierValues: invalidValues
        })
      ).toFail();
    });

    test('creates a SimpleContextQualifierProvider with initial qualifier values', () => {
      const initialValues = {
        language: 'en-US' as TsRes.QualifierContextValue,
        territory: 'US' as TsRes.QualifierContextValue,
        priority: 'high' as TsRes.QualifierContextValue
      };

      expect(
        TsRes.Runtime.SimpleContextQualifierProvider.create({
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
      const invalidValues: Record<string, TsRes.QualifierContextValue> = {};
      invalidValues[''] = 'invalid' as TsRes.QualifierContextValue;

      expect(
        TsRes.Runtime.SimpleContextQualifierProvider.create({
          qualifiers,
          qualifierValues: invalidValues
        })
      ).toFail();
    });
  });

  describe('get method with different input types', () => {
    let provider: TsRes.Runtime.SimpleContextQualifierProvider;

    beforeEach(() => {
      provider = TsRes.Runtime.SimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US' as TsRes.QualifierContextValue,
          territory: 'US' as TsRes.QualifierContextValue,
          priority: 'high' as TsRes.QualifierContextValue
        }
      }).orThrow();
    });

    test('accepts QualifierName (string) parameter', () => {
      expect(provider.get('language' as TsRes.QualifierName)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
      expect(provider.get('territory' as TsRes.QualifierName)).toSucceedWith(
        'US' as TsRes.QualifierContextValue
      );
      expect(provider.get('priority' as TsRes.QualifierName)).toSucceedWith(
        'high' as TsRes.QualifierContextValue
      );
      expect(provider.get('nonexistent' as TsRes.QualifierName)).toFail();
    });

    test('accepts QualifierIndex (number) parameter', () => {
      expect(provider.get(0 as TsRes.QualifierIndex)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(provider.get(1 as TsRes.QualifierIndex)).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(provider.get(2 as TsRes.QualifierIndex)).toSucceedWith('high' as TsRes.QualifierContextValue);
      expect(provider.get(99 as TsRes.QualifierIndex)).toFailWith(/99: invalid qualifier index/i);
    });

    test('accepts Qualifier object parameter', () => {
      const languageQualifier = qualifiers.getByNameOrToken('language').orThrow();
      const territoryQualifier = qualifiers.getByNameOrToken('territory').orThrow();
      const priorityQualifier = qualifiers.getByNameOrToken('priority').orThrow();

      expect(provider.get(languageQualifier)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(provider.get(territoryQualifier)).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(provider.get(priorityQualifier)).toSucceedWith('high' as TsRes.QualifierContextValue);
    });

    test('fails with invalid parameter types', () => {
      expect(provider.get('this is an invalid qualifier name' as TsRes.QualifierName)).toFailWith(
        /invalid qualifier name/i
      );
      expect(provider.get({} as unknown as TsRes.QualifierName)).toFailWith(
        /invalid Qualifier, name or index/i
      );
      expect(provider.get(null as unknown as TsRes.QualifierName)).toFailWith(
        /invalid Qualifier, name or index/i
      );
      expect(provider.get(undefined as unknown as TsRes.QualifierName)).toFailWith(
        /invalid Qualifier, name or index/i
      );
      expect(provider.get([] as unknown as TsRes.QualifierName)).toFailWith(
        /invalid Qualifier, name or index/i
      );
    });

    test('handles _resolveQualifierName failure in get method', () => {
      // Test with a mock object that has name but causes resolution failure
      const mockQualifier = { name: 'nonexistent' as TsRes.QualifierName };
      expect(provider.get(mockQualifier as unknown as TsRes.Qualifiers.Qualifier)).toFailWith(
        /invalid Qualifier, name or index/
      );
    });

    test('fails with object that looks like qualifier but is not', () => {
      const fakeQualifier = { name: 'fake' };
      expect(provider.get(fakeQualifier as unknown as TsRes.Qualifiers.Qualifier)).toFailWith(
        /invalid Qualifier, name or index/
      );
    });
  });

  describe('getValidated method with different input types', () => {
    let provider: TsRes.Runtime.SimpleContextQualifierProvider;

    beforeEach(() => {
      provider = TsRes.Runtime.SimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US' as TsRes.QualifierContextValue,
          territory: 'US' as TsRes.QualifierContextValue,
          priority: 'high' as TsRes.QualifierContextValue
        }
      }).orThrow();
    });

    test('successfully validates and returns valid context values with string names', () => {
      expect(provider.getValidated('language' as TsRes.QualifierName)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
      expect(provider.getValidated('territory' as TsRes.QualifierName)).toSucceedWith(
        'US' as TsRes.QualifierContextValue
      );
      expect(provider.getValidated('priority' as TsRes.QualifierName)).toSucceedWith(
        'high' as TsRes.QualifierContextValue
      );
    });

    test('successfully validates and returns valid context values with indices', () => {
      expect(provider.getValidated(0 as TsRes.QualifierIndex)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
      expect(provider.getValidated(1 as TsRes.QualifierIndex)).toSucceedWith(
        'US' as TsRes.QualifierContextValue
      );
      expect(provider.getValidated(2 as TsRes.QualifierIndex)).toSucceedWith(
        'high' as TsRes.QualifierContextValue
      );
    });

    test('successfully validates and returns valid context values with Qualifier objects', () => {
      const languageQualifier = qualifiers.getByNameOrToken('language').orThrow();
      const territoryQualifier = qualifiers.getByNameOrToken('territory').orThrow();
      const priorityQualifier = qualifiers.getByNameOrToken('priority').orThrow();

      expect(provider.getValidated(languageQualifier)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(provider.getValidated(territoryQualifier)).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(provider.getValidated(priorityQualifier)).toSucceedWith('high' as TsRes.QualifierContextValue);
    });

    test('fails for non-existent qualifiers by name', () => {
      expect(provider.getValidated('nonexistent' as TsRes.QualifierName)).toFailWith(
        /invalid qualifier name/i
      );
    });

    test('fails for qualifiers that exist but have no value set', () => {
      const emptyProvider = TsRes.Runtime.SimpleContextQualifierProvider.create({ qualifiers }).orThrow();
      expect(emptyProvider.getValidated('language' as TsRes.QualifierName)).toFail();
    });

    test('fails with invalid parameter types', () => {
      expect(provider.getValidated({} as unknown as TsRes.QualifierName)).toFailWith(
        /invalid Qualifier, name or index/i
      );
      expect(provider.getValidated(99 as TsRes.QualifierIndex)).toFailWith(/invalid qualifier index/i);
    });

    test('handles _resolveQualifier failure in getValidated method', () => {
      // Test with a mock object that has name but causes resolution failure
      const mockQualifier = { name: 'nonexistent' as TsRes.QualifierName };
      expect(provider.getValidated(mockQualifier as unknown as TsRes.Qualifiers.Qualifier)).toFailWith(
        /invalid Qualifier, name or index/i
      );
    });

    test('validates values using qualifier type-specific validation', () => {
      // Set up a provider with invalid values that would pass get() but fail validation
      const providerWithInvalidValue = TsRes.Runtime.SimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'invalid-language-tag' as TsRes.QualifierContextValue, // Invalid BCP47 tag
          territory: 'INVALID' as TsRes.QualifierContextValue, // Invalid territory
          priority: 'invalid-priority' as TsRes.QualifierContextValue // Invalid literal value
        }
      }).orThrow();

      // These should fail validation even though the values are stored
      expect(providerWithInvalidValue.get('language' as TsRes.QualifierName)).toSucceedWith(
        'invalid-language-tag' as TsRes.QualifierContextValue
      );
      expect(providerWithInvalidValue.getValidated('language' as TsRes.QualifierName)).toFail();

      expect(providerWithInvalidValue.get('territory' as TsRes.QualifierName)).toSucceedWith(
        'INVALID' as TsRes.QualifierContextValue
      );
      expect(providerWithInvalidValue.getValidated('territory' as TsRes.QualifierName)).toFail();

      expect(providerWithInvalidValue.get('priority' as TsRes.QualifierName)).toSucceedWith(
        'invalid-priority' as TsRes.QualifierContextValue
      );
      expect(providerWithInvalidValue.getValidated('priority' as TsRes.QualifierName)).toFail();
    });

    test('validates literal values against enumerated options', () => {
      // Test all valid enumerated values for priority
      const allValidValues = ['high', 'medium', 'low'];
      for (const value of allValidValues) {
        provider.set('priority' as TsRes.QualifierName, value as TsRes.QualifierContextValue).orThrow();
        expect(provider.getValidated('priority' as TsRes.QualifierName)).toSucceedWith(
          value as TsRes.QualifierContextValue
        );
      }
    });
  });

  describe('has method', () => {
    let provider: TsRes.Runtime.SimpleContextQualifierProvider;

    beforeEach(() => {
      provider = TsRes.Runtime.SimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US' as TsRes.QualifierContextValue,
          territory: 'US' as TsRes.QualifierContextValue
        }
      }).orThrow();
    });

    test('returns true for existing qualifiers', () => {
      expect(provider.has('language' as TsRes.QualifierName)).toSucceedWith(true);
      expect(provider.has('territory' as TsRes.QualifierName)).toSucceedWith(true);
    });

    test('returns false for non-existing qualifiers', () => {
      expect(provider.has('priority' as TsRes.QualifierName)).toSucceedWith(false);
      expect(provider.has('nonexistent' as TsRes.QualifierName)).toSucceedWith(false);
    });
  });

  describe('getNames method', () => {
    test('returns empty array for empty provider', () => {
      const provider = TsRes.Runtime.SimpleContextQualifierProvider.create({ qualifiers }).orThrow();
      expect(provider.getNames()).toSucceedAndSatisfy((names) => {
        expect(names).toHaveLength(0);
      });
    });

    test('returns all qualifier names for populated provider', () => {
      const provider = TsRes.Runtime.SimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US' as TsRes.QualifierContextValue,
          territory: 'US' as TsRes.QualifierContextValue,
          priority: 'high' as TsRes.QualifierContextValue
        }
      }).orThrow();

      expect(provider.getNames()).toSucceedAndSatisfy((names) => {
        expect(names).toHaveLength(3);
        expect(names).toContain('language');
        expect(names).toContain('territory');
        expect(names).toContain('priority');
      });
    });
  });

  describe('set method', () => {
    let provider: TsRes.Runtime.SimpleContextQualifierProvider;

    beforeEach(() => {
      provider = TsRes.Runtime.SimpleContextQualifierProvider.create({ qualifiers }).orThrow();
    });

    test('sets a new qualifier value', () => {
      expect(
        provider.set('language' as TsRes.QualifierName, 'fr-FR' as TsRes.QualifierContextValue)
      ).toSucceedWith('fr-FR' as TsRes.QualifierContextValue);
      expect(provider.get('language' as TsRes.QualifierName)).toSucceedWith(
        'fr-FR' as TsRes.QualifierContextValue
      );
      expect(provider.size).toBe(1);
    });

    test('overwrites an existing qualifier value', () => {
      provider.set('language' as TsRes.QualifierName, 'en-US' as TsRes.QualifierContextValue).orThrow();
      expect(
        provider.set('language' as TsRes.QualifierName, 'fr-FR' as TsRes.QualifierContextValue)
      ).toSucceedWith('fr-FR' as TsRes.QualifierContextValue);
      expect(provider.get('language' as TsRes.QualifierName)).toSucceedWith(
        'fr-FR' as TsRes.QualifierContextValue
      );
      expect(provider.size).toBe(1);
    });
  });

  describe('remove method', () => {
    let provider: TsRes.Runtime.SimpleContextQualifierProvider;

    beforeEach(() => {
      provider = TsRes.Runtime.SimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US' as TsRes.QualifierContextValue,
          territory: 'US' as TsRes.QualifierContextValue
        }
      }).orThrow();
    });

    test('removes an existing qualifier value', () => {
      expect(provider.remove('language' as TsRes.QualifierName)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
      expect(provider.get('language' as TsRes.QualifierName)).toFail();
      expect(provider.size).toBe(1);
    });

    test('fails to remove non-existing qualifier value', () => {
      expect(provider.remove('nonexistent' as TsRes.QualifierName)).toFail();
      expect(provider.size).toBe(2);
    });
  });

  describe('clear method', () => {
    test('clears all qualifier values', () => {
      const provider = TsRes.Runtime.SimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US' as TsRes.QualifierContextValue,
          territory: 'US' as TsRes.QualifierContextValue,
          priority: 'high' as TsRes.QualifierContextValue
        }
      }).orThrow();

      expect(provider.size).toBe(3);
      provider.clear();
      expect(provider.size).toBe(0);
      expect(provider.get('language' as TsRes.QualifierName)).toFail();
    });
  });

  describe('size property', () => {
    test('returns correct size for empty provider', () => {
      const provider = TsRes.Runtime.SimpleContextQualifierProvider.create({ qualifiers }).orThrow();
      expect(provider.size).toBe(0);
    });

    test('returns correct size for populated provider', () => {
      const provider = TsRes.Runtime.SimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US' as TsRes.QualifierContextValue,
          territory: 'US' as TsRes.QualifierContextValue
        }
      }).orThrow();
      expect(provider.size).toBe(2);
    });

    test('updates size when values are added', () => {
      const provider = TsRes.Runtime.SimpleContextQualifierProvider.create({ qualifiers }).orThrow();
      expect(provider.size).toBe(0);

      provider.set('language' as TsRes.QualifierName, 'en-US' as TsRes.QualifierContextValue).orThrow();
      expect(provider.size).toBe(1);

      provider.set('territory' as TsRes.QualifierName, 'US' as TsRes.QualifierContextValue).orThrow();
      expect(provider.size).toBe(2);
    });
  });

  describe('qualifiers property', () => {
    test('exposes the readonly qualifier collector', () => {
      const provider = TsRes.Runtime.SimpleContextQualifierProvider.create({ qualifiers }).orThrow();
      expect(provider.qualifiers).toBe(qualifiers);
      expect(provider.qualifiers.size).toBe(3);
    });
  });

  describe('_resolveQualifierName method coverage', () => {
    let provider: TsRes.Runtime.SimpleContextQualifierProvider;

    beforeEach(() => {
      provider = TsRes.Runtime.SimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US' as TsRes.QualifierContextValue,
          territory: 'US' as TsRes.QualifierContextValue
        }
      }).orThrow();
    });

    test('resolves string parameter type correctly', () => {
      // This tests the string branch in _resolveQualifierName (lines 199-200)
      expect(provider.get('language' as TsRes.QualifierName)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
    });

    test('resolves number parameter type correctly', () => {
      // This tests the number branch in _resolveQualifierName (lines 212-217)
      expect(provider.get(0 as TsRes.QualifierIndex)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
    });

    test('resolves object parameter type correctly', () => {
      // This tests the object branch in _resolveQualifierName (lines 203-208)
      const languageQualifier = qualifiers.getByNameOrToken('language').orThrow();
      expect(provider.get(languageQualifier)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
    });

    test('fails with invalid parameter that falls through to final error', () => {
      // This tests the final error case in _resolveQualifierName (line 220)
      expect(provider.get(true as unknown as TsRes.QualifierName)).toFailWith(
        /invalid Qualifier, name or index/i
      );
      expect(provider.get(function () {} as unknown as TsRes.QualifierName)).toFailWith(
        /invalid Qualifier, name or index/i
      );
    });

    test('fails with number parameter for non-existent index', () => {
      // This tests the number branch failure case in _resolveQualifierName (line 217)
      expect(provider.get(999 as TsRes.QualifierIndex)).toFailWith(/999: invalid qualifier index/i);
    });

    test('covers successful paths in _resolveQualifierName', () => {
      // Test successful string resolution (line 199)
      expect(provider.get('language' as TsRes.QualifierName)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );

      // Test successful object resolution (line 208)
      const languageQualifier = qualifiers.getByNameOrToken('language').orThrow();
      expect(provider.get(languageQualifier)).toSucceedWith('en-US' as TsRes.QualifierContextValue);

      // Test successful number resolution (line 215)
      expect(provider.get(0 as TsRes.QualifierIndex)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
    });
  });

  describe('comprehensive get method parameter testing', () => {
    let provider: TsRes.Runtime.SimpleContextQualifierProvider;

    beforeEach(() => {
      provider = TsRes.Runtime.SimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US' as TsRes.QualifierContextValue,
          territory: 'US' as TsRes.QualifierContextValue
        }
      }).orThrow();
    });

    test('handles string parameter (QualifierName) - covers lines 199-200', () => {
      // Test successful string parameter resolution
      expect(provider.get('language' as TsRes.QualifierName)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
      expect(provider.get('territory' as TsRes.QualifierName)).toSucceedWith(
        'US' as TsRes.QualifierContextValue
      );
    });

    test('handles number parameter (QualifierIndex) - covers lines 212-217', () => {
      // Test successful number parameter resolution
      expect(provider.get(0 as TsRes.QualifierIndex)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(provider.get(1 as TsRes.QualifierIndex)).toSucceedWith('US' as TsRes.QualifierContextValue);

      // Test failed number parameter resolution - covers lines 101-102 via line 217
      expect(provider.get(999 as TsRes.QualifierIndex)).toFailWith(/999: invalid qualifier index/i);
    });

    test('handles object parameter (Qualifier) - covers lines 203-208', () => {
      // Test successful object parameter resolution
      const languageQualifier = qualifiers.getByNameOrToken('language').orThrow();
      expect(provider.get(languageQualifier)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
    });

    test('handles invalid parameter types - covers lines 101-102 via line 220', () => {
      // Test with invalid parameter types that cause _resolveQualifierName to fail
      expect(provider.get(true as unknown as TsRes.QualifierName)).toFailWith(
        /invalid Qualifier, name or index/i
      );
      expect(provider.get(null as unknown as TsRes.QualifierName)).toFailWith(
        /invalid Qualifier, name or index/i
      );
      expect(provider.get(undefined as unknown as TsRes.QualifierName)).toFailWith(
        /invalid Qualifier, name or index/i
      );
      expect(provider.get([] as unknown as TsRes.QualifierName)).toFailWith(
        /invalid Qualifier, name or index/i
      );
    });
  });

  describe('edge cases for complete coverage', () => {
    test('covers all branches in has method', () => {
      const provider = TsRes.Runtime.SimpleContextQualifierProvider.create({ qualifiers }).orThrow();
      // Test the succeed return path (line 131)
      expect(provider.has('nonexistent' as TsRes.QualifierName)).toSucceedWith(false);
    });

    test('covers all branches in getNames method', () => {
      const provider = TsRes.Runtime.SimpleContextQualifierProvider.create({ qualifiers }).orThrow();
      // Test the succeed return path (line 140)
      expect(provider.getNames()).toSucceedWith([]);
    });

    test('covers all branches in remove method', () => {
      const provider = TsRes.Runtime.SimpleContextQualifierProvider.create({
        qualifiers,
        qualifierValues: {
          language: 'en-US' as TsRes.QualifierContextValue
        }
      }).orThrow();

      // Test the onSuccess callback path (lines 164-167)
      expect(provider.remove('language' as TsRes.QualifierName)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
      expect(provider.size).toBe(0);
    });

    test('covers size property getter', () => {
      const provider = TsRes.Runtime.SimpleContextQualifierProvider.create({ qualifiers }).orThrow();
      // Test the size getter (line 176)
      expect(provider.size).toBe(0);
    });
  });
});
