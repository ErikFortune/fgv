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
        { qualifierName: 'homeTerritory', value: 'US' },
        { qualifierName: 'currentTerritory', value: 'CA' },
        { qualifierName: 'homeTerritory', value: 'CA' },
        { qualifierName: 'language', value: 'en-US', operator: 'matches' },
        { qualifierName: 'some_thing', value: 'some_value', priority: 700 }
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
            expect(c.qualifier.name).toBe(cd.qualifierName);
            expect(c.value).toBe(cd.value);
            if (cd.priority) {
              expect(c.priority).toBe(cd.priority);
            } else {
              const expected = qualifiers.validating.get(cd.qualifierName).orDefault()?.defaultPriority;
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
            { qualifierName: 'language', value: 'en-US', operator: 'matches' },
            { qualifierName: 'bogus', value: 'some_value' }
          ]
        })
      ).toFailWith(/not found/i);
    });
  });

  describe('add method', () => {
    test('adds an instantiated condition to the collector', () => {
      const cc = TsRes.Conditions.ConditionCollector.create({
        qualifiers
      }).orThrow();
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'US'
          },
          { qualifiers }
        )
        .orThrow();
      const condition = TsRes.Conditions.Condition.create(decl).orThrow();
      expect(cc.add(condition)).toSucceedWith(condition);
    });
  });

  describe('validating add method', () => {
    test('adds an instantiated condition to the collector', () => {
      const cc = TsRes.Conditions.ConditionCollector.create({
        qualifiers
      }).orThrow();
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'US'
          },
          { qualifiers }
        )
        .orThrow();
      const condition = TsRes.Conditions.Condition.create(decl).orThrow();
      expect(cc.validating.add(condition)).toSucceedWith(condition);
    });

    test('adds a condition from a declaration to the collector', () => {
      const cc = TsRes.Conditions.ConditionCollector.create({
        qualifiers
      }).orThrow();
      const decl = { qualifierName: 'homeTerritory', value: 'US' };
      expect(cc.validating.add(decl)).toSucceedAndSatisfy((condition) => {
        expect(condition.qualifier.name).toBe('homeTerritory');
        expect(condition.value).toBe('US');
        expect(condition.priority).toBe(800);
        expect(condition.operator).toBe('matches');
      });
    });

    test('fails if a condition with the same key is already in the collector', () => {
      const cc = TsRes.Conditions.ConditionCollector.create({
        qualifiers
      }).orThrow();
      const decl = {
        qualifierName: 'homeTerritory',
        value: 'US'
      };
      cc.validating.add(decl).orThrow();
      expect(cc.validating.add(decl)).toFailWith(/already exists/i);
    });

    test('returns a new condition if priority is different', () => {
      const cc = TsRes.Conditions.ConditionCollector.create({
        qualifiers
      }).orThrow();
      const decl = {
        qualifierName: 'homeTerritory',
        value: 'US'
      };
      const condition = cc.validating.add(decl).orThrow();
      expect(cc.validating.add({ ...decl, priority: 123 })).toSucceedAndSatisfy((c) => {
        expect(c).not.toBe(condition);
        expect(c.priority).toBe(123);
      });
    });
  });

  describe('validating getOrAdd method', () => {
    test('returns the existing condition if the key is already in the collector', () => {
      const cc = TsRes.Conditions.ConditionCollector.create({
        qualifiers
      }).orThrow();
      const decl = {
        qualifierName: 'homeTerritory',
        value: 'US'
      };
      const condition = cc.validating.getOrAdd(decl).orThrow();
      expect(cc.validating.getOrAdd(decl)).toSucceedAndSatisfy((c) => {
        expect(c).toBe(condition);
      });
    });
  });
});
