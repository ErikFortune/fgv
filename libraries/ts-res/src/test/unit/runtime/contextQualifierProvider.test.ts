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

class TestContextQualifierProvider extends TsRes.Runtime.ContextQualifierProvider {
  public readonly qualifiers: TsRes.Qualifiers.IReadOnlyQualifierCollector;
  private readonly _values: Map<TsRes.QualifierName, TsRes.QualifierContextValue> = new Map<
    TsRes.QualifierName,
    TsRes.QualifierContextValue
  >();

  public constructor(qualifiers: TsRes.Qualifiers.IReadOnlyQualifierCollector) {
    super();
    this.qualifiers = qualifiers;
  }

  public get(
    nameOrIndexOrQualifier: TsRes.QualifierName | TsRes.QualifierIndex | TsRes.Qualifiers.Qualifier
  ): Result<TsRes.QualifierContextValue> {
    if (typeof nameOrIndexOrQualifier === 'string') {
      const value = this._values.get(nameOrIndexOrQualifier as TsRes.QualifierName);
      return value !== undefined ? succeed(value) : fail(`Qualifier "${nameOrIndexOrQualifier}" not found`);
    }
    if (
      typeof nameOrIndexOrQualifier === 'object' &&
      nameOrIndexOrQualifier !== null &&
      'name' in nameOrIndexOrQualifier
    ) {
      return this.get(nameOrIndexOrQualifier.name);
    }
    if (typeof nameOrIndexOrQualifier === 'number') {
      const qualifier = this.qualifiers.getAt(nameOrIndexOrQualifier as TsRes.QualifierIndex);
      if (qualifier.isSuccess()) {
        return this.get(qualifier.value.name);
      }
      return fail(`Qualifier not found at index ${nameOrIndexOrQualifier}`);
    }
    return fail(`Invalid qualifier parameter: ${nameOrIndexOrQualifier}`);
  }

  public getValidated(
    nameOrIndexOrQualifier: TsRes.QualifierName | TsRes.QualifierIndex | TsRes.Qualifiers.Qualifier
  ): Result<TsRes.QualifierContextValue> {
    return this.get(nameOrIndexOrQualifier);
  }

  public has(name: TsRes.QualifierName): Result<boolean> {
    return succeed(this._values.has(name));
  }

  public getNames(): Result<ReadonlyArray<TsRes.QualifierName>> {
    return succeed(Array.from(this._values.keys()));
  }

  public setValue(name: TsRes.QualifierName, value: TsRes.QualifierContextValue): void {
    this._values.set(name, value);
  }
}

describe('ContextQualifierProvider abstract base class', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let provider: TestContextQualifierProvider;

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

    provider = new TestContextQualifierProvider(qualifiers);
    provider.setValue('language' as TsRes.QualifierName, 'en-US' as TsRes.QualifierContextValue);
    provider.setValue('territory' as TsRes.QualifierName, 'US' as TsRes.QualifierContextValue);
    provider.setValue('priority' as TsRes.QualifierName, 'high' as TsRes.QualifierContextValue);
  });

  describe('get method', () => {
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
      expect(provider.get('nonexistent' as TsRes.QualifierName)).toFailWith(
        'Qualifier "nonexistent" not found'
      );
    });

    test('accepts QualifierIndex (number) parameter', () => {
      expect(provider.get(0 as TsRes.QualifierIndex)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
      expect(provider.get(1 as TsRes.QualifierIndex)).toSucceedWith('US' as TsRes.QualifierContextValue);
      expect(provider.get(2 as TsRes.QualifierIndex)).toSucceedWith('high' as TsRes.QualifierContextValue);
      expect(provider.get(99 as TsRes.QualifierIndex)).toFail();
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
      expect(provider.get({} as unknown as TsRes.QualifierName)).toFailWith(/Invalid qualifier parameter/);
      expect(provider.get(null as unknown as TsRes.QualifierName)).toFailWith(/Invalid qualifier parameter/);
      expect(provider.get(undefined as unknown as TsRes.QualifierName)).toFailWith(
        /Invalid qualifier parameter/
      );
    });
  });

  describe('getValidated method', () => {
    test('accepts QualifierName (string) parameter', () => {
      expect(provider.getValidated('language' as TsRes.QualifierName)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
      expect(provider.getValidated('nonexistent' as TsRes.QualifierName)).toFail();
    });

    test('accepts QualifierIndex (number) parameter', () => {
      expect(provider.getValidated(0 as TsRes.QualifierIndex)).toSucceedWith(
        'en-US' as TsRes.QualifierContextValue
      );
      expect(provider.getValidated(99 as TsRes.QualifierIndex)).toFail();
    });

    test('accepts Qualifier object parameter', () => {
      const languageQualifier = qualifiers.getByNameOrToken('language').orThrow();
      expect(provider.getValidated(languageQualifier)).toSucceedWith('en-US' as TsRes.QualifierContextValue);
    });
  });

  describe('has method', () => {
    test('returns true for existing qualifiers', () => {
      expect(provider.has('language' as TsRes.QualifierName)).toSucceedWith(true);
      expect(provider.has('territory' as TsRes.QualifierName)).toSucceedWith(true);
      expect(provider.has('priority' as TsRes.QualifierName)).toSucceedWith(true);
    });

    test('returns false for non-existing qualifiers', () => {
      expect(provider.has('nonexistent' as TsRes.QualifierName)).toSucceedWith(false);
    });
  });

  describe('getNames method', () => {
    test('returns all qualifier names', () => {
      expect(provider.getNames()).toSucceedAndSatisfy((names) => {
        expect(names).toHaveLength(3);
        expect(names).toContain('language');
        expect(names).toContain('territory');
        expect(names).toContain('priority');
      });
    });
  });

  describe('qualifiers property', () => {
    test('exposes the readonly qualifier collector', () => {
      expect(provider.qualifiers).toBe(qualifiers);
      expect(provider.qualifiers.size).toBe(3);
    });
  });
});
