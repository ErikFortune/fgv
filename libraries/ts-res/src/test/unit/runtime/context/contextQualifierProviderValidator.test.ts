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
import { Result, succeed, fail } from '@fgv/ts-utils';

// Mock provider for testing the validator
class MockContextQualifierProvider implements TsRes.Runtime.Context.IMutableContextQualifierProvider {
  /**
   * Explicit mutability marker for compile-time type discrimination.
   * Always `true` for mutable test providers.
   */
  public readonly mutable: true = true as const;

  private _values: Map<string, string> = new Map<string, string>();
  public qualifiers: TsRes.Qualifiers.QualifierCollector;

  public constructor(qualifiers: TsRes.Qualifiers.QualifierCollector) {
    this.qualifiers = qualifiers;
    this._values.set('language', 'en-US');
    this._values.set('territory', 'US');
    this._values.set('priority', 'high');
  }

  public get(
    nameOrIndexOrQualifier: TsRes.QualifierName | TsRes.QualifierIndex | TsRes.Qualifiers.Qualifier
  ): Result<TsRes.QualifierContextValue> {
    if (typeof nameOrIndexOrQualifier === 'string') {
      const value = this._values.get(nameOrIndexOrQualifier);
      return value
        ? succeed(value as TsRes.QualifierContextValue)
        : fail(`Not found: ${nameOrIndexOrQualifier}`);
    }
    if (typeof nameOrIndexOrQualifier === 'number') {
      const qualifier = this.qualifiers.getAt(nameOrIndexOrQualifier as TsRes.QualifierIndex);
      if (qualifier.isSuccess()) {
        return this.get(qualifier.value.name);
      }
      return fail(`Index not found: ${nameOrIndexOrQualifier}`);
    }
    if (
      typeof nameOrIndexOrQualifier === 'object' &&
      nameOrIndexOrQualifier !== null &&
      'name' in nameOrIndexOrQualifier
    ) {
      return this.get(nameOrIndexOrQualifier.name);
    }
    return fail('Invalid parameter');
  }

  public getValidated(
    nameOrIndexOrQualifier: TsRes.QualifierName | TsRes.QualifierIndex | TsRes.Qualifiers.Qualifier
  ): Result<TsRes.QualifierContextValue> {
    return this.get(nameOrIndexOrQualifier).onSuccess((value) => {
      // Mock validation - just check if value is not empty
      if (!value || value.length === 0) {
        return fail('Validation failed: empty value');
      }
      return succeed(value);
    });
  }

  public has(name: TsRes.QualifierName): Result<boolean> {
    return succeed(this._values.has(name));
  }

  public getNames(): Result<ReadonlyArray<TsRes.QualifierName>> {
    return succeed(Array.from(this._values.keys()) as TsRes.QualifierName[]);
  }

  public set(
    name: TsRes.QualifierName,
    value: TsRes.QualifierContextValue
  ): Result<TsRes.QualifierContextValue> {
    this._values.set(name, value);
    return succeed(value);
  }

  public remove(name: TsRes.QualifierName): Result<TsRes.QualifierContextValue> {
    const value = this._values.get(name);
    if (value) {
      this._values.delete(name);
      return succeed(value as TsRes.QualifierContextValue);
    }
    return fail(`Not found: ${name}`);
  }

  public clear(): void {
    this._values.clear();
  }
}

describe('ContextQualifierProviderValidator classes', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let mockProvider: MockContextQualifierProvider;
  let mutableValidator: TsRes.Runtime.Context.MutableContextQualifierProviderValidator;
  let readOnlyValidator: TsRes.Runtime.Context.ReadOnlyContextQualifierProviderValidator;

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create({
          name: 'priority',
          enumeratedValues: ['high', 'medium', 'low'],
          allowContextList: false // Disable context lists for clearer testing
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

    mockProvider = new MockContextQualifierProvider(qualifiers);
    mutableValidator = new TsRes.Runtime.Context.MutableContextQualifierProviderValidator({
      provider: mockProvider
    });
    readOnlyValidator = new TsRes.Runtime.Context.ReadOnlyContextQualifierProviderValidator({
      provider: {
        mutable: false as const,
        qualifiers,
        get: mockProvider.get.bind(mockProvider),
        getValidated: mockProvider.getValidated.bind(mockProvider),
        has: mockProvider.has.bind(mockProvider),
        getNames: mockProvider.getNames.bind(mockProvider)
      }
    });
  });

  describe('constructor', () => {
    test('creates validator with wrapped provider', () => {
      expect(mutableValidator.provider).toBe(mockProvider);
      expect(mutableValidator.qualifiers).toBe(qualifiers);
    });
  });

  describe('get method', () => {
    test('successfully gets values using string names', () => {
      expect(mutableValidator.get('language')).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(mutableValidator.get('territory')).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(mutableValidator.get('priority')).toSucceedWith('high' as TsRes.QualifierContextValue);
    });

    test('fails for non-existent qualifier names', () => {
      expect(mutableValidator.get('nonexistent')).toFailWith(/Not found:/);
    });

    test('fails with invalid qualifier names', () => {
      expect(mutableValidator.get('')).toFailWith(/invalid qualifier name/i);
    });
  });

  describe('getByIndex method', () => {
    test('successfully gets values using number indices', () => {
      expect(mutableValidator.getByIndex(0)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(mutableValidator.getByIndex(1)).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(mutableValidator.getByIndex(2)).toSucceedWith('high' as TsRes.QualifierContextValue);
    });

    test('fails for invalid indices', () => {
      expect(mutableValidator.getByIndex(99)).toFailWith(/Index not found:/);
      expect(mutableValidator.getByIndex(-1)).toFailWith(/invalid qualifier index/i);
      expect(mutableValidator.getByIndex(1.5)).toFailWith(/Index not found:/i);
    });
  });

  describe('getValidated method', () => {
    test('successfully gets validated values using string names', () => {
      expect(mutableValidator.getValidated('language')).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(mutableValidator.getValidated('territory')).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(mutableValidator.getValidated('priority')).toSucceedWith('high' as TsRes.QualifierContextValue);
    });

    test('fails for non-existent qualifier names', () => {
      expect(mutableValidator.getValidated('nonexistent')).toFailWith(/Not found:/);
    });

    test('fails with invalid qualifier names', () => {
      expect(mutableValidator.getValidated('')).toFailWith(/invalid qualifier name/i);
    });
  });

  describe('getValidatedByIndex method', () => {
    test('successfully gets validated values using number indices', () => {
      expect(mutableValidator.getValidatedByIndex(0)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(mutableValidator.getValidatedByIndex(1)).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(mutableValidator.getValidatedByIndex(2)).toSucceedWith('high' as TsRes.QualifierContextValue);
    });

    test('fails for invalid indices', () => {
      expect(mutableValidator.getValidatedByIndex(99)).toFailWith(/Index not found:/);
      expect(mutableValidator.getValidatedByIndex(-1)).toFailWith(/invalid qualifier index/i);
    });
  });

  describe('has method', () => {
    test('returns true for existing qualifiers', () => {
      expect(mutableValidator.has('language')).toSucceedWith(true);
      expect(mutableValidator.has('territory')).toSucceedWith(true);
      expect(mutableValidator.has('priority')).toSucceedWith(true);
    });

    test('returns false for non-existing qualifiers', () => {
      expect(mutableValidator.has('nonexistent')).toSucceedWith(false);
    });

    test('fails with invalid qualifier names', () => {
      expect(mutableValidator.has('')).toFailWith(/invalid qualifier name/i);
    });
  });

  describe('set method', () => {
    test('successfully sets qualifier values using string inputs', () => {
      expect(mutableValidator.set('language', 'fr-FR')).toSucceedWith('fr-FR' as TsRes.QualifierContextValue);
      expect(mutableValidator.get('language')).toSucceedWith('fr-FR' as TsRes.QualifierContextValue);
    });

    describe('type-specific validation', () => {
      describe('language qualifier validation', () => {
        test('accepts valid BCP47 language tags', () => {
          const validLanguageTags = [
            'en', // Basic language
            'en-US', // Language with region
            'fr-FR', // French in France
            'es-ES', // Spanish in Spain
            'zh-CN', // Chinese in China
            'pt-BR', // Portuguese in Brazil
            'sr-Cyrl-RS', // Serbian in Cyrillic script in Serbia
            'ca-valencia' // Catalan Valencia variant
          ];

          validLanguageTags.forEach((tag) => {
            expect(mutableValidator.set('language', tag)).toSucceedWith(tag as TsRes.QualifierContextValue);
            expect(mutableValidator.get('language')).toSucceedWith(tag as TsRes.QualifierContextValue);
          });
        });

        test('rejects invalid language codes', () => {
          const invalidLanguageTags = [
            'en_US', // Underscore instead of hyphen
            'fr-', // Trailing hyphen
            'invalid-lang', // Invalid language code
            'sr-Cyrl_RS', // Mixed separators
            'cmn-Hans_CN', // Mixed separators
            'es-', // Trailing hyphen
            'ca-valencia-', // Trailing hyphen
            '', // Empty string
            'ZZ-ZZ' // Invalid language-region combination
          ];

          invalidLanguageTags.forEach((tag) => {
            expect(mutableValidator.set('language', tag)).toFailWith(/invalid context value.*language/i);
          });
        });
      });

      describe('territory qualifier validation', () => {
        test('accepts valid territory codes', () => {
          const validTerritoryCodes = [
            'US', // United States
            'FR', // France
            'ES', // Spain
            'CN', // China
            'BR', // Brazil
            'DE', // Germany
            'JP', // Japan
            'GB' // Great Britain
          ];

          validTerritoryCodes.forEach((code) => {
            expect(mutableValidator.set('territory', code)).toSucceedWith(
              code as TsRes.QualifierContextValue
            );
            expect(mutableValidator.get('territory')).toSucceedWith(code as TsRes.QualifierContextValue);
          });
        });

        test('rejects invalid territory codes', () => {
          const invalidTerritoryCodes = [
            '419', // Numeric region code (not valid for territory)
            'invalid-territory', // Invalid format
            'USA', // Three-letter code (should be two)
            'mexico', // Lowercase country name
            'united-states', // Country name instead of code
            '', // Empty string
            'XX-invalid' // Invalid format with hyphen
          ];

          invalidTerritoryCodes.forEach((code) => {
            expect(mutableValidator.set('territory', code)).toFailWith(/invalid context value.*territory/i);
          });
        });
      });

      describe('literal qualifier validation with enumerated values', () => {
        test('accepts valid enumerated values for priority qualifier', () => {
          const validPriorityValues = ['high', 'medium', 'low'];

          validPriorityValues.forEach((value) => {
            expect(mutableValidator.set('priority', value)).toSucceedWith(
              value as TsRes.QualifierContextValue
            );
            expect(mutableValidator.get('priority')).toSucceedWith(value as TsRes.QualifierContextValue);
          });
        });

        test('rejects invalid literal values for priority qualifier', () => {
          const invalidPriorityValues = [
            'critical', // Not in enumerated list
            'urgent', // Not in enumerated list
            'normal', // Not in enumerated list
            'low-priority', // Contains hyphen
            '', // Empty string
            'invalid-priority', // Not in enumerated list
            '1', // Numeric value
            'high,medium' // Multiple values (not allowed when allowContextList: false)
          ];

          invalidPriorityValues.forEach((value) => {
            expect(mutableValidator.set('priority', value)).toFailWith(/invalid context value.*priority/i);
          });
        });

        test('accepts case-insensitive enumerated values for priority qualifier', () => {
          const caseVariations = ['High', 'MEDIUM', 'Low', 'HIGH', 'medium', 'LOW'];

          caseVariations.forEach((value) => {
            expect(mutableValidator.set('priority', value)).toSucceedWith(
              value as TsRes.QualifierContextValue
            );
          });
        });
      });

      describe('error message quality', () => {
        test('provides informative error messages for language validation failures', () => {
          expect(mutableValidator.set('language', 'en_US')).toFailWith(/invalid.*context.*value.*language/i);
          expect(mutableValidator.set('language', 'invalid_lang')).toFailWith(
            /invalid.*context.*value.*language/i
          );
        });

        test('provides informative error messages for territory validation failures', () => {
          expect(mutableValidator.set('territory', '419')).toFailWith(/invalid.*context.*value.*territory/i);
          expect(mutableValidator.set('territory', 'mexico')).toFailWith(
            /invalid.*context.*value.*territory/i
          );
        });

        test('provides informative error messages for literal validation failures', () => {
          expect(mutableValidator.set('priority', 'urgent')).toFailWith(/invalid.*context.*value.*priority/i);
        });

        test('includes qualifier name in error messages', () => {
          expect(mutableValidator.set('language', 'bad_tag')).toFailWith(/language/i);
          expect(mutableValidator.set('territory', 'bad-territory')).toFailWith(/territory/i);
          expect(mutableValidator.set('priority', 'bad-value')).toFailWith(/priority/i);
        });
      });

      describe('type-specific validation vs generic validation', () => {
        test('demonstrates type-specific validation is more restrictive than generic validation', () => {
          // These would pass a simple string check but fail type-specific validation
          expect(mutableValidator.set('language', 'not-a-language-tag')).toFailWith(
            /invalid.*context.*value/i
          );
          expect(mutableValidator.set('territory', 'not-a-territory')).toFailWith(/invalid.*context.*value/i);
          expect(mutableValidator.set('priority', 'not-a-priority')).toFailWith(/invalid.*context.*value/i);
        });

        test('validates using BCP47 language tag rules', () => {
          // Valid BCP47 tags should succeed
          expect(mutableValidator.set('language', 'en')).toSucceed();
          expect(mutableValidator.set('language', 'fr-FR')).toSucceed();
          expect(mutableValidator.set('language', 'zh-Hans-CN')).toSucceed();

          // Invalid BCP47 patterns should fail
          expect(mutableValidator.set('language', 'en_US')).toFailWith(/invalid.*context.*value/i); // underscore instead of hyphen
          expect(mutableValidator.set('language', 'fr-')).toFailWith(/invalid.*context.*value/i); // trailing hyphen
          expect(mutableValidator.set('language', 'invalid-123')).toFailWith(/invalid.*context.*value/i); // invalid pattern
        });

        test('validates using ISO territory code rules', () => {
          // Valid territory codes should succeed (including ZZ which is valid)
          expect(mutableValidator.set('territory', 'US')).toSucceed();
          expect(mutableValidator.set('territory', 'FR')).toSucceed();
          expect(mutableValidator.set('territory', 'ZZ')).toSucceed(); // ZZ is a valid ISO code

          // Invalid territory patterns should fail
          expect(mutableValidator.set('territory', '419')).toFailWith(/invalid.*context.*value/i); // numeric codes not valid for territory
          expect(mutableValidator.set('territory', 'mexico')).toFailWith(/invalid.*context.*value/i); // country names not valid
          expect(mutableValidator.set('territory', 'USA')).toFailWith(/invalid.*context.*value/i); // three-letter codes not valid
        });

        test('validates each qualifier according to its specific type requirements', () => {
          // Valid for identifier but invalid for language
          expect(mutableValidator.set('language', 'valid-identifier')).toFailWith(
            /invalid.*context.*value.*language/i
          );

          // Valid for identifier but invalid for territory
          expect(mutableValidator.set('territory', 'valid-identifier')).toFailWith(
            /invalid.*context.*value.*territory/i
          );

          // Valid identifier but not in enumerated values for priority
          expect(mutableValidator.set('priority', 'valid-identifier')).toFailWith(
            /invalid.*context.*value.*priority/i
          );
        });

        test('enforces enumerated value restrictions for literal qualifiers', () => {
          // Only values in the enumerated list should be accepted
          expect(mutableValidator.set('priority', 'high')).toSucceed();
          expect(mutableValidator.set('priority', 'medium')).toSucceed();
          expect(mutableValidator.set('priority', 'low')).toSucceed();

          // Values not in the enumerated list should be rejected
          expect(mutableValidator.set('priority', 'critical')).toFailWith(
            /invalid.*context.*value.*priority/i
          );
          expect(mutableValidator.set('priority', 'normal')).toFailWith(/invalid.*context.*value.*priority/i);
          expect(mutableValidator.set('priority', 'urgent')).toFailWith(/invalid.*context.*value.*priority/i);
        });

        test('demonstrates context list behavior with allowContextList setting', () => {
          // Priority qualifier was created with allowContextList: false, so lists should be rejected
          expect(mutableValidator.set('priority', 'high,medium')).toFailWith(
            /invalid.*context.*value.*priority/i
          );
          expect(mutableValidator.set('priority', 'high, low')).toFailWith(
            /invalid.*context.*value.*priority/i
          );

          // But individual valid values should still work
          expect(mutableValidator.set('priority', 'high')).toSucceed();
          expect(mutableValidator.set('priority', 'medium')).toSucceed();
          expect(mutableValidator.set('priority', 'low')).toSucceed();
        });
      });
    });

    test('fails with invalid qualifier names', () => {
      expect(mutableValidator.set('', 'value')).toFailWith(/invalid qualifier name/i);
    });

    test('fails with invalid qualifier context value type', () => {
      // Create a validator and try to set with a non-string value (edge case coverage)
      const invalidValidator = mutableValidator as unknown as {
        set: (name: string, value: unknown) => Result<TsRes.QualifierContextValue>;
      };
      expect(invalidValidator.set('language', 123)).toFailWith(/Not a string:/i);
    });

    test('read-only validators do not have set method at compile time', () => {
      // Create a provider without set method
      const readOnlyProvider = {
        mutable: false as const,
        qualifiers,
        get: mockProvider.get.bind(mockProvider),
        getValidated: mockProvider.getValidated.bind(mockProvider),
        has: mockProvider.has.bind(mockProvider),
        getNames: mockProvider.getNames.bind(mockProvider)
      };
      const readOnlyValidator = new TsRes.Runtime.Context.ReadOnlyContextQualifierProviderValidator({
        provider: readOnlyProvider
      });
      // ReadOnlyContextQualifierProviderValidator doesn't have a set method at compile time
      // This is now a compile-time type safety feature, not a runtime check
      expect('set' in readOnlyValidator).toBe(false);
    });

    test('handles provider that throws during setting', () => {
      // Create a provider that throws during set operation to test error handling
      const throwingProvider = {
        mutable: true as const,
        qualifiers,
        get: mockProvider.get.bind(mockProvider),
        getValidated: mockProvider.getValidated.bind(mockProvider),
        has: mockProvider.has.bind(mockProvider),
        getNames: mockProvider.getNames.bind(mockProvider),
        set: () => {
          throw new Error('Set operation failed');
        },
        remove: () => {
          throw new Error('Remove operation failed');
        },
        clear: () => {
          throw new Error('Clear operation failed');
        }
      };
      const throwingValidator = new TsRes.Runtime.Context.MutableContextQualifierProviderValidator({
        provider: throwingProvider as TsRes.Runtime.Context.IMutableContextQualifierProvider
      });
      // The validator should catch the exception and return a failure
      expect(throwingValidator.set('language', 'fr-FR')).toFailWith(/Set operation failed/);
    });
  });

  describe('remove method', () => {
    test('successfully removes qualifier values using string inputs', () => {
      expect(mutableValidator.remove('language')).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(mutableValidator.get('language')).toFail();
    });

    test('fails for non-existent qualifiers', () => {
      expect(mutableValidator.remove('nonexistent')).toFailWith(/Not found:/);
    });

    test('fails with invalid qualifier names', () => {
      expect(mutableValidator.remove('')).toFailWith(/invalid qualifier name/i);
    });

    test('read-only validators do not have remove method at compile time', () => {
      // Create a provider without remove method
      const readOnlyProvider = {
        mutable: false as const,
        qualifiers,
        get: mockProvider.get.bind(mockProvider),
        getValidated: mockProvider.getValidated.bind(mockProvider),
        has: mockProvider.has.bind(mockProvider),
        getNames: mockProvider.getNames.bind(mockProvider)
      };
      const readOnlyValidator = new TsRes.Runtime.Context.ReadOnlyContextQualifierProviderValidator({
        provider: readOnlyProvider
      });
      // ReadOnlyContextQualifierProviderValidator doesn't have a remove method at compile time
      // This is now a compile-time type safety feature, not a runtime check
      expect('remove' in readOnlyValidator).toBe(false);
    });

    test('handles provider that throws during removal', () => {
      // Create a provider that throws during remove operation to test error handling
      const throwingProvider = {
        mutable: true as const,
        qualifiers,
        get: mockProvider.get.bind(mockProvider),
        getValidated: mockProvider.getValidated.bind(mockProvider),
        has: mockProvider.has.bind(mockProvider),
        getNames: mockProvider.getNames.bind(mockProvider),
        set: () => {
          throw new Error('Set operation failed');
        },
        remove: () => {
          throw new Error('Remove operation failed');
        },
        clear: () => {
          throw new Error('Clear operation failed');
        }
      };
      const throwingValidator = new TsRes.Runtime.Context.MutableContextQualifierProviderValidator({
        provider: throwingProvider
      });
      // The validator should catch the exception and return a failure
      expect(throwingValidator.remove('language')).toFailWith(/Remove operation failed/);
    });
  });

  // Test type safety - these should be compile-time errors
  describe('Type safety tests', () => {
    test('ReadOnlyContextQualifierProviderValidator does not have mutation methods at runtime', () => {
      // TypeScript should prevent accessing these methods, but test runtime behavior
      const readOnlyAsUnknown = readOnlyValidator as unknown as Record<string, unknown>;
      expect(readOnlyAsUnknown.set).toBeUndefined();
      expect(readOnlyAsUnknown.remove).toBeUndefined();
    });

    test('MutableContextQualifierProviderValidator has mutation methods', () => {
      expect(typeof mutableValidator.set).toBe('function');
      expect(typeof mutableValidator.remove).toBe('function');
    });
  });

  describe('Coverage for validation methods', () => {
    test('covers validation with non-string input', () => {
      // Test with non-string input to cover validation failure
      expect(mutableValidator.get(123 as unknown as string)).toFailWith(/Not a string:/i);
    });

    test('covers validation with invalid numbers', () => {
      // Test with invalid number inputs to cover validation failure
      expect(mutableValidator.getByIndex(-1 as TsRes.QualifierIndex)).toFailWith(/invalid qualifier index/i);
      expect(mutableValidator.getByIndex(1.5 as TsRes.QualifierIndex)).toFailWith(/Index not found:/i);
      expect(mutableValidator.getByIndex(NaN as TsRes.QualifierIndex)).toFailWith(/invalid qualifier index/i);
    });

    test('covers validation with non-string value input', () => {
      // Test with non-string input to cover validation failure
      const invalidValidator = mutableValidator as unknown as {
        set: (name: string, value: unknown) => Result<TsRes.QualifierContextValue>;
      };
      expect(invalidValidator.set('language', null)).toFailWith(/Not a string:/i);
      expect(invalidValidator.set('language', undefined)).toFailWith(/Not a string:/i);
      expect(invalidValidator.set('language', 123)).toFailWith(/Not a string:/i);
    });
  });
});
