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
import { JsonValue } from '@fgv/ts-json-base';

describe('Candidate', () => {
  const qualifierDecls: TsRes.Qualifiers.IQualifierDecl[] = [
    { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 },
    { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
    { name: 'language', typeName: 'language', defaultPriority: 600 },
    { name: 'some_thing', typeName: 'literal', defaultPriority: 500 }
  ];

  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let conditions: TsRes.Conditions.ConditionCollector;
  let conditionSets: TsRes.Conditions.ConditionSetCollector;

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
      ]
    }).orThrow();

    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: qualifierDecls
    }).orThrow();

    conditions = TsRes.Conditions.ConditionCollector.create({
      qualifiers
    }).orThrow();

    conditionSets = TsRes.Conditions.ConditionSetCollector.create({
      conditions
    }).orThrow();
  });

  describe('static createCandidate method', () => {
    test('creates a Candidate with a set of conditions', () => {
      const conditionSet = conditionSets.validating
        .add({
          conditions: [{ qualifierName: 'homeTerritory', value: 'CA' }]
        })
        .orThrow();
      const value: JsonValue = { property: 'value' };
      const candidate = TsRes.Decisions.Candidate.createCandidate({ conditionSet, value });
      expect(candidate).toSucceedAndSatisfy((c) => {
        expect(c.conditionSet).toBe(conditionSet);
        expect(c.value).toBe(value);
        expect(c.isPartial).toBe(false);
        expect(c.mergeMethod).toBe('augment');
      });
    });

    test('creates a Candidate with a set of conditions and a merge method', () => {
      const conditionSet = conditionSets.validating
        .add({
          conditions: [{ qualifierName: 'homeTerritory', value: 'CA' }]
        })
        .orThrow();
      const value: JsonValue = { property: 'value' };
      const candidate = TsRes.Decisions.Candidate.createCandidate({
        conditionSet,
        value,
        mergeMethod: 'replace'
      });
      expect(candidate).toSucceedAndSatisfy((c) => {
        expect(c.conditionSet).toBe(conditionSet);
        expect(c.value).toBe(value);
        expect(c.isPartial).toBe(false);
        expect(c.mergeMethod).toBe('replace');
      });
    });

    test('creates a Candidate with a set of conditions and a partial flag', () => {
      const conditionSet = conditionSets.validating
        .add({
          conditions: [{ qualifierName: 'homeTerritory', value: 'CA' }]
        })
        .orThrow();
      const value: JsonValue = { property: 'value' };
      const candidate = TsRes.Decisions.Candidate.createCandidate({ conditionSet, value, isPartial: true });
      expect(candidate).toSucceedAndSatisfy((c) => {
        expect(c.conditionSet).toBe(conditionSet);
        expect(c.value).toBe(value);
        expect(c.isPartial).toBe(true);
        expect(c.mergeMethod).toBe('augment');
      });
    });
  });

  describe('compare method', () => {
    test('compares two candidates based on their condition sets', () => {
      const conditionSet1 = conditionSets.validating
        .add({
          conditions: [{ qualifierName: 'homeTerritory', value: 'CA', priority: 1000 }]
        })
        .orThrow();
      const conditionSet2 = conditionSets.validating
        .add({
          conditions: [{ qualifierName: 'homeTerritory', value: 'US', priority: 900 }]
        })
        .orThrow();
      const value: JsonValue = { property: 'value' };
      const candidate1 = TsRes.Decisions.Candidate.createCandidate({
        conditionSet: conditionSet1,
        value
      }).orThrow();
      const candidate2 = TsRes.Decisions.Candidate.createCandidate({
        conditionSet: conditionSet2,
        value
      }).orThrow();
      expect(TsRes.Decisions.Candidate.compare(candidate1, candidate2)).toBeGreaterThan(0);
      expect(TsRes.Decisions.Candidate.compare(candidate2, candidate1)).toBeLessThan(0);
    });
  });

  describe('key property', () => {
    test('returns the key of the condition set', () => {
      const conditionSet = conditionSets.validating
        .add({
          conditions: [{ qualifierName: 'homeTerritory', value: 'CA' }]
        })
        .orThrow();
      const value: JsonValue = { property: 'value' };
      const candidate = TsRes.Decisions.Candidate.createCandidate({ conditionSet, value }).orThrow();
      expect(candidate.key).toBe(conditionSet.key);
    });
  });

  describe('toString method', () => {
    test('returns a string representation of the candidate', () => {
      const conditionSet = conditionSets.validating
        .add({
          conditions: [{ qualifierName: 'homeTerritory', value: 'CA' }]
        })
        .orThrow();
      const value: JsonValue = { property: 'value' };
      const candidate = TsRes.Decisions.Candidate.createCandidate({ conditionSet, value }).orThrow();
      expect(candidate.toString()).toBe(`${conditionSet.key}: ${JSON.stringify(value)}`);
    });
  });
});
