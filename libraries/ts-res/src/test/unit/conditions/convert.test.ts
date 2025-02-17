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
import { TestQualifierType } from '../qualifier-types/testQualifierType';

describe('conditions converters', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;

  beforeAll(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow(),
        new TestQualifierType()
      ]
    }).orThrow();

    const qualifierDecls: TsRes.Qualifiers.IQualifierDecl[] = [
      { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 },
      { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
      { name: 'language', typeName: 'language', defaultPriority: 600 },
      { name: 'some_thing', typeName: 'literal', defaultPriority: 500 },
      { name: 'testThing', typeName: 'test', defaultPriority: 400 }
    ];
    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: qualifierDecls
    }).orThrow();
  });

  describe('validatedConditionDecl', () => {
    test('converts a condition declaration to a validated condition declaration', () => {
      const decl = { qualifierName: 'homeTerritory', value: 'CA' };

      const condition = TsRes.Conditions.Convert.validatedConditionDecl.convert(decl, { qualifiers });
      expect(condition).toSucceedAndSatisfy((c) => {
        expect(c.qualifier.name).toBe('homeTerritory');
        expect(c.qualifier.type.name).toBe('territory');
        expect(c.value).toBe('CA');
        expect(c.priority).toBe(c.qualifier.defaultPriority);
      });
    });

    test('assigns and increments index if supplied', () => {
      const decl = { qualifierName: 'homeTerritory', value: 'CA' };
      const context = { qualifiers, conditionIndex: 2 };

      const condition = TsRes.Conditions.Convert.validatedConditionDecl.convert(decl, context);
      expect(condition).toSucceedAndSatisfy((c) => {
        expect(c.qualifier.name).toBe('homeTerritory');
        expect(c.qualifier.type.name).toBe('territory');
        expect(c.value).toBe('CA');
        expect(c.priority).toBe(c.qualifier.defaultPriority);
        expect(c.index).toBe(2);
        expect(context.conditionIndex).toBe(3);
      });
    });

    test('fails if the qualifier is not found', () => {
      const decl = { qualifierName: 'unknown', value: 'CA' };
      expect(TsRes.Conditions.Convert.validatedConditionDecl.convert(decl, { qualifiers })).toFailWith(
        /unknown/
      );
    });

    test('fails if the context is missing', () => {
      const decl = { qualifierName: 'homeTerritory', value: 'CA' };
      expect(TsRes.Conditions.Convert.validatedConditionDecl.convert(decl)).toFailWith(/context/);
    });
  });
});
