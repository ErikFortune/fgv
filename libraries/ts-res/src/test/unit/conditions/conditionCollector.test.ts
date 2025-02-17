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

describe('ConditionCollector class', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifierDecls: TsRes.Qualifiers.IQualifierDecl[];
  let qualifiers: TsRes.Qualifiers.QualifierCollector;

  beforeAll(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
      ]
    }).orThrow();
  });

  beforeEach(() => {
    qualifierDecls = [
      { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 },
      { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
      { name: 'language', typeName: 'language', defaultPriority: 600 },
      { name: 'some_thing', typeName: 'literal', defaultPriority: 500 }
    ];

    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: qualifierDecls
    }).orThrow();
  });

  describe('create static method', () => {
    test('creates an empty ConditionCollector by default', () => {
      expect(TsRes.Conditions.ConditionCollector.create({ qualifiers })).toSucceedAndSatisfy((cc) => {
        expect(cc.size).toBe(0);
        expect(cc.qualifiers).toBe(qualifiers);
      });
    });

    test('creates a ConditionCollector with initial conditions from supplied declarations', () => {
      const conditionDecls: TsRes.Conditions.IConditionDecl[] = [
        { name: 'homeTerritory', value: 'US' },
        { name: 'currentTerritory', value: 'CA' },
        { name: 'homeTerritory', value: 'CA' },
        { name: 'language', value: 'en-US', operator: 'matches' },
        { name: 'some_thing', value: 'some_value', priority: 700 }
      ];
      expect(
        TsRes.Conditions.ConditionCollector.create({
          qualifiers,
          conditions: conditionDecls
        })
      ).toSucceedAndSatisfy((cc) => {
        expect(cc.size).toBe(conditionDecls.length);
        expect(cc.qualifiers).toBe(qualifiers);
        conditionDecls.forEach((cd, index) => {
          expect(cc.getAt(index)).toSucceedAndSatisfy((c) => {
            expect(c.qualifier.name).toBe(cd.name);
            expect(c.value).toBe(cd.value);
            if (cd.priority) {
              expect(c.priority).toBe(cd.priority);
            } else {
              const expected = qualifiers.validating.get(cd.name).orDefault()?.defaultPriority;
              expect(c.priority).toBe(expected);
            }
            expect(c.operator).toBe(cd.operator ?? 'matches');
            expect(cc.get(c.key)).toSucceedWith(c);
          });
        });
      });
    });

    test('fails if any of the supplied conditions specify an unknown qualifier', () => {
      expect(
        TsRes.Conditions.ConditionCollector.create({
          qualifiers,
          conditions: [
            { name: 'language', value: 'en-US', operator: 'matches' },
            { name: 'bogus', value: 'some_value' }
          ]
        })
      ).toFailWith(/not found/i);
    });
  });
});
