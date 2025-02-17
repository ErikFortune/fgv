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

describe('ConditionSet', () => {
  const qualifierDecls: TsRes.Qualifiers.IQualifierDecl[] = [
    { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 },
    { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
    { name: 'language', typeName: 'language', defaultPriority: 600 },
    { name: 'some_thing', typeName: 'literal', defaultPriority: 500 },
    { name: 'testThing', typeName: 'test', defaultPriority: 400 }
  ];
  const conditionDecls: TsRes.Conditions.IConditionDecl[] = [
    { qualifierName: 'homeTerritory', value: 'CA' },
    { qualifierName: 'currentTerritory', value: 'US' },
    { qualifierName: 'language', value: 'en' },
    { qualifierName: 'some_thing', value: 'some_value' },
    { qualifierName: 'testThing', value: 'test value' }
  ];

  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let conditions: TsRes.Conditions.ConditionCollector;
  let allConditions: TsRes.Conditions.Condition[];

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow(),
        new TestQualifierType()
      ]
    }).orThrow();

    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: qualifierDecls
    }).orThrow();

    conditions = TsRes.Conditions.ConditionCollector.create({
      qualifiers,
      conditions: conditionDecls
    }).orThrow();

    allConditions = Array.from(conditions.values());
  });

  describe('create static method', () => {
    test('creates a condition set from a list of conditions', () => {
      const expectedKey = Array.from(allConditions)
        .sort(TsRes.Conditions.Condition.compare)
        .reverse()
        .map((c) => c.key)
        .join('+');

      expect(TsRes.Conditions.ConditionSet.create({ conditions: allConditions })).toSucceedAndSatisfy(
        (cs) => {
          expect(cs.size).toBe(allConditions.length);
          expect(cs.key).toBe(expectedKey);
          expect(cs.toKey()).toBe(cs.key);
          expect(cs.toString()).toBe(cs.key);
        }
      );
    });

    test('normalizes the conditions in the set', () => {
      const cs1 = TsRes.Conditions.ConditionSet.create({ conditions: allConditions }).orThrow();
      const cs2 = TsRes.Conditions.ConditionSet.create({
        conditions: Array.from(allConditions).reverse()
      }).orThrow();
      expect(cs1.key).toBe(cs2.key);
      expect(cs1.toHash()).toBe(cs2.toHash());
      for (let i = 0; i < cs1.size; i++) {
        expect(cs1.conditions[i].key).toBe(cs2.conditions[i].key);
      }
    });

    test('fails if there are duplicate conditions for the same qualifier', () => {
      const cExtra = conditions.validating
        .add({
          qualifierName: 'homeTerritory',
          value: 'AQ'
        })
        .orThrow();
      allConditions.push(cExtra);
      expect(TsRes.Conditions.ConditionSet.create({ conditions: allConditions })).toFailWith(
        /duplicate conditions/i
      );
    });
  });

  describe('compare static method', () => {
    test('chooses the condition set with highest priority', () => {
      const normalized1 = Array.from(allConditions).sort(TsRes.Conditions.Condition.compare).reverse();
      const normalized2 = Array.from(normalized1).splice(1);
      const cs1 = TsRes.Conditions.ConditionSet.create({ conditions: normalized1 }).orThrow();
      const cs2 = TsRes.Conditions.ConditionSet.create({ conditions: normalized2 }).orThrow();
      expect(TsRes.Conditions.ConditionSet.compare(cs1, cs2)).toBeGreaterThan(0);
    });

    test('chooses the longest condition set if priorities are equal', () => {
      const normalized1 = Array.from(allConditions).sort(TsRes.Conditions.Condition.compare).reverse();
      const normalized2 = Array.from(normalized1);
      normalized2.pop();
      const cs1 = TsRes.Conditions.ConditionSet.create({ conditions: normalized1 }).orThrow();
      const cs2 = TsRes.Conditions.ConditionSet.create({ conditions: normalized2 }).orThrow();
      expect(TsRes.Conditions.ConditionSet.compare(cs1, cs2)).toBeGreaterThan(0);
      expect(TsRes.Conditions.ConditionSet.compare(cs2, cs1)).toBeLessThan(0);
    });

    test('returns 0 if condition sets are equal', () => {
      const normalized1 = Array.from(allConditions).sort(TsRes.Conditions.Condition.compare).reverse();
      const normalized2 = Array.from(normalized1);
      const cs1 = TsRes.Conditions.ConditionSet.create({ conditions: normalized1 }).orThrow();
      const cs2 = TsRes.Conditions.ConditionSet.create({ conditions: normalized2 }).orThrow();
      expect(TsRes.Conditions.ConditionSet.compare(cs1, cs2)).toBe(0);
    });
  });

  describe('index properties and methods', () => {
    test('sets the index for a condition set on creation', () => {
      const index = 10;
      const cs = TsRes.Conditions.ConditionSet.create({
        conditions: allConditions,
        index
      }).orThrow();
      expect(cs.index).toBe(index);
    });

    test('succeeds and sets index if not already set', () => {
      const cs = TsRes.Conditions.ConditionSet.create({ conditions: allConditions }).orThrow();
      const index = 10;
      expect(cs.setIndex(index)).toSucceedWith(index as TsRes.ConditionSetIndex);
      expect(cs.index).toBe(index);
    });

    test('fails if index is already set', () => {
      const cs = TsRes.Conditions.ConditionSet.create({ conditions: allConditions, index: 10 }).orThrow();
      expect(cs.setIndex(20)).toFailWith(/cannot be change/i);
    });

    test('succeeds if set to the current index', () => {
      const cs = TsRes.Conditions.ConditionSet.create({ conditions: allConditions, index: 10 }).orThrow();
      expect(cs.setIndex(10)).toSucceedWith(10 as TsRes.ConditionSetIndex);
    });
  });
});
