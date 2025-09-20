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
import { Converters } from '@fgv/ts-utils';
import * as TsRes from '../../../index';

describe('qualifierType converter', () => {
  let instantiatedTypes: TsRes.QualifierTypes.QualifierType[];
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;

  beforeEach(() => {
    instantiatedTypes = [
      TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
      TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
      TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
    ];

    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: instantiatedTypes
    }).orThrow();
  });

  test('converts a string to the like named qualifier type', () => {
    for (const qt of instantiatedTypes) {
      expect(TsRes.QualifierTypes.Convert.qualifierType.convert(qt.key, { qualifierTypes })).toSucceedWith(
        qt
      );
    }
  });

  test('converts a number to the qualifier type at that index', () => {
    for (let i = 0; i < instantiatedTypes.length; i++) {
      expect(TsRes.QualifierTypes.Convert.qualifierType.convert(i, { qualifierTypes })).toSucceedWith(
        instantiatedTypes[i]
      );
    }
  });

  test('fails if a string references an unknown qualifier type', () => {
    expect(TsRes.QualifierTypes.Convert.qualifierType.convert('unknown', { qualifierTypes })).toFailWith(
      /unknown/
    );
  });

  test('fails if a number is out of range', () => {
    expect(
      TsRes.QualifierTypes.Convert.qualifierType.convert(instantiatedTypes.length * 2, {
        qualifierTypes
      })
    ).toFailWith(/out of range/);
  });

  test('fails if the input is not a string or number', () => {
    expect(TsRes.QualifierTypes.Convert.qualifierType.convert(true, { qualifierTypes })).toFailWith(
      /requires a string or number/
    );
  });

  test('fails if no context is supplied', () => {
    expect(TsRes.QualifierTypes.Convert.qualifierType.convert('literal')).toFailWith(/requires a context/);
  });
});

describe('literalValueHierarchyCreateParams', () => {
  const stringConverter = Converters.string;
  const converter = TsRes.QualifierTypes.Convert.literalValueHierarchyCreateParams(stringConverter);

  test('converts valid hierarchy params', () => {
    const input = {
      values: ['a', 'b', 'c'],
      hierarchy: {
        a: 'parent',
        b: 'parent'
      }
    };
    expect(converter.convert(input)).toSucceedWith(input);
  });

  test('converts params with only values', () => {
    const input = {
      values: ['a', 'b', 'c'],
      hierarchy: {}
    };
    expect(converter.convert(input)).toSucceedWith(input);
  });

  test('fails if values is not an array', () => {
    const input = {
      values: 'not-an-array',
      hierarchy: {}
    };
    expect(converter.convert(input)).toFailWith(/array/);
  });

  test('fails if hierarchy is not a record', () => {
    const input = {
      values: ['a', 'b'],
      hierarchy: 'not-a-record'
    };
    expect(converter.convert(input)).toFailWith(/object/);
  });

  test('succeeds with invalid hierarchy keys (validation happens later)', () => {
    const input = {
      values: ['a', 'b'],
      hierarchy: {
        'invalid-key': 'a'
      }
    };
    // The converter only validates the structure, not the content
    expect(converter.convert(input)).toSucceedWith(input);
  });

  test('succeeds with invalid hierarchy values (validation happens later)', () => {
    const input = {
      values: ['a', 'b'],
      hierarchy: {
        a: 'invalid-value'
      }
    };
    // The converter only validates the structure, not the content
    expect(converter.convert(input)).toSucceedWith(input);
  });
});
