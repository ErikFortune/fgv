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
import { Result, succeed, fail } from '@fgv/ts-utils';

// Mock provider for testing the validator
class MockContextQualifierProvider implements TsRes.Runtime.IContextQualifierProvider {
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
}

describe('ContextQualifierProviderValidator class', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let mockProvider: MockContextQualifierProvider;
  let validator: TsRes.Runtime.ContextQualifierProviderValidator;

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

    mockProvider = new MockContextQualifierProvider(qualifiers);
    validator = new TsRes.Runtime.ContextQualifierProviderValidator({ provider: mockProvider });
  });

  describe('constructor', () => {
    test('creates validator with wrapped provider', () => {
      expect(validator.provider).toBe(mockProvider);
      expect(validator.qualifiers).toBe(qualifiers);
    });
  });

  describe('get method', () => {
    test('successfully gets values using string names', () => {
      expect(validator.get('language')).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(validator.get('territory')).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(validator.get('priority')).toSucceedWith('high' as TsRes.QualifierContextValue);
    });

    test('fails for non-existent qualifier names', () => {
      expect(validator.get('nonexistent')).toFailWith(/Not found:/);
    });

    test('fails with invalid qualifier names', () => {
      expect(validator.get('')).toFailWith(/Invalid qualifier name/);
    });
  });

  describe('getByIndex method', () => {
    test('successfully gets values using number indices', () => {
      expect(validator.getByIndex(0)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(validator.getByIndex(1)).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(validator.getByIndex(2)).toSucceedWith('high' as TsRes.QualifierContextValue);
    });

    test('fails for invalid indices', () => {
      expect(validator.getByIndex(99)).toFailWith(/Index not found:/);
      expect(validator.getByIndex(-1)).toFailWith(/Invalid qualifier index/);
      expect(validator.getByIndex(1.5)).toFailWith(/Invalid qualifier index/);
    });
  });

  describe('getValidated method', () => {
    test('successfully gets validated values using string names', () => {
      expect(validator.getValidated('language')).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(validator.getValidated('territory')).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(validator.getValidated('priority')).toSucceedWith('high' as TsRes.QualifierContextValue);
    });

    test('fails for non-existent qualifier names', () => {
      expect(validator.getValidated('nonexistent')).toFailWith(/Not found:/);
    });

    test('fails with invalid qualifier names', () => {
      expect(validator.getValidated('')).toFailWith(/Invalid qualifier name/);
    });
  });

  describe('getValidatedByIndex method', () => {
    test('successfully gets validated values using number indices', () => {
      expect(validator.getValidatedByIndex(0)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(validator.getValidatedByIndex(1)).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(validator.getValidatedByIndex(2)).toSucceedWith('high' as TsRes.QualifierContextValue);
    });

    test('fails for invalid indices', () => {
      expect(validator.getValidatedByIndex(99)).toFailWith(/Index not found:/);
      expect(validator.getValidatedByIndex(-1)).toFailWith(/Invalid qualifier index/);
    });
  });

  describe('has method', () => {
    test('returns true for existing qualifiers', () => {
      expect(validator.has('language')).toSucceedWith(true);
      expect(validator.has('territory')).toSucceedWith(true);
      expect(validator.has('priority')).toSucceedWith(true);
    });

    test('returns false for non-existing qualifiers', () => {
      expect(validator.has('nonexistent')).toSucceedWith(false);
    });

    test('fails with invalid qualifier names', () => {
      expect(validator.has('')).toFailWith(/Invalid qualifier name/);
    });
  });

  describe('set method', () => {
    test('successfully sets qualifier values using string inputs', () => {
      expect(validator.set('language', 'fr-FR')).toSucceedWith('fr-FR' as TsRes.QualifierContextValue);
      expect(validator.get('language')).toSucceedWith('fr-FR' as TsRes.QualifierContextValue);
    });

    test('fails with invalid qualifier names', () => {
      expect(validator.set('', 'value')).toFailWith(/Invalid qualifier name/);
    });

    test('fails with invalid qualifier context value type', () => {
      // Create a validator and try to set with a non-string value (edge case coverage)
      const invalidValidator = validator as unknown as {
        set: (name: string, value: unknown) => Result<TsRes.QualifierContextValue>;
      };
      expect(invalidValidator.set('language', 123)).toFailWith(/Invalid qualifier context value/);
    });

    test('fails with provider that does not support setting', () => {
      // Create a provider without set method
      const readOnlyProvider = {
        qualifiers,
        get: mockProvider.get.bind(mockProvider),
        getValidated: mockProvider.getValidated.bind(mockProvider),
        has: mockProvider.has.bind(mockProvider),
        getNames: mockProvider.getNames.bind(mockProvider)
      };
      const readOnlyValidator = new TsRes.Runtime.ContextQualifierProviderValidator({
        provider: readOnlyProvider
      });
      expect(readOnlyValidator.set('language', 'fr-FR')).toFailWith(
        /Provider does not support setting values/
      );
    });

    test('handles provider that throws during setting', () => {
      // Create a provider that throws during set operation to test error handling
      const throwingProvider = {
        qualifiers,
        get: mockProvider.get.bind(mockProvider),
        getValidated: mockProvider.getValidated.bind(mockProvider),
        has: mockProvider.has.bind(mockProvider),
        getNames: mockProvider.getNames.bind(mockProvider),
        set: () => {
          throw new Error('Set operation failed');
        }
      };
      const throwingValidator = new TsRes.Runtime.ContextQualifierProviderValidator({
        provider: throwingProvider
      });
      // The validator should catch the exception and return a failure
      expect(throwingValidator.set('language', 'fr-FR')).toFailWith(
        /Provider does not support setting values/
      );
    });
  });

  describe('remove method', () => {
    test('successfully removes qualifier values using string inputs', () => {
      expect(validator.remove('language')).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(validator.get('language')).toFail();
    });

    test('fails for non-existent qualifiers', () => {
      expect(validator.remove('nonexistent')).toFailWith(/Not found:/);
    });

    test('fails with invalid qualifier names', () => {
      expect(validator.remove('')).toFailWith(/Invalid qualifier name/);
    });

    test('fails with provider that does not support removing', () => {
      // Create a provider without remove method
      const readOnlyProvider = {
        qualifiers,
        get: mockProvider.get.bind(mockProvider),
        getValidated: mockProvider.getValidated.bind(mockProvider),
        has: mockProvider.has.bind(mockProvider),
        getNames: mockProvider.getNames.bind(mockProvider)
      };
      const readOnlyValidator = new TsRes.Runtime.ContextQualifierProviderValidator({
        provider: readOnlyProvider
      });
      expect(readOnlyValidator.remove('language')).toFailWith(/Provider does not support removing values/);
    });

    test('handles provider that throws during removal', () => {
      // Create a provider that throws during remove operation to test error handling
      const throwingProvider = {
        qualifiers,
        get: mockProvider.get.bind(mockProvider),
        getValidated: mockProvider.getValidated.bind(mockProvider),
        has: mockProvider.has.bind(mockProvider),
        getNames: mockProvider.getNames.bind(mockProvider),
        remove: () => {
          throw new Error('Remove operation failed');
        }
      };
      const throwingValidator = new TsRes.Runtime.ContextQualifierProviderValidator({
        provider: throwingProvider
      });
      // The validator should catch the exception and return a failure
      expect(throwingValidator.remove('language')).toFailWith(/Provider does not support removing values/);
    });
  });
});
