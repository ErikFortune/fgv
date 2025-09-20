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
import { Hash } from '@fgv/ts-utils';

describe('ConcreteDecision', () => {
  const qualifierDecls: TsRes.Qualifiers.IQualifierDecl[] = [
    { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 },
    { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
    { name: 'language', typeName: 'language', defaultPriority: 600 },
    { name: 'some_thing', typeName: 'literal', defaultPriority: 500 }
  ];
  const conditionDecls: TsRes.Conditions.IConditionDecl[] = [
    { qualifierName: 'homeTerritory', value: 'CA' },
    { qualifierName: 'currentTerritory', value: 'US' },
    { qualifierName: 'language', value: 'en' },
    { qualifierName: 'some_thing', value: 'some_value' }
  ];
  const values: JsonValue[] = [{ value: 0 }, { value: 'one' }, 'value two'];

  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let conditions: TsRes.Conditions.ConditionCollector;
  let conditionSets: TsRes.Conditions.ConditionSetCollector;
  let decisions: TsRes.Decisions.AbstractDecisionCollector;
  let candidates: TsRes.Decisions.Candidate[];

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

    decisions = TsRes.Decisions.AbstractDecisionCollector.create({
      conditionSets
    }).orThrow();

    const cs1 = conditionSets.validating
      .add({
        conditions: [conditionDecls[0]]
      })
      .orThrow();

    const cs2 = conditionSets.validating
      .add({
        conditions: [conditionDecls[1], conditionDecls[2]]
      })
      .orThrow();

    const cs3 = conditionSets.validating
      .add({
        conditions: [conditionDecls[1], conditionDecls[3]]
      })
      .orThrow();

    candidates = [
      TsRes.Decisions.Candidate.createCandidate({
        conditionSet: cs1,
        value: values[0]
      }).orThrow(),
      TsRes.Decisions.Candidate.createCandidate({
        conditionSet: cs2,
        value: values[1]
      }).orThrow(),
      TsRes.Decisions.Candidate.createCandidate({
        conditionSet: cs3,
        value: values[2]
      }).orThrow()
    ];
  });

  describe('create static method', () => {
    test('creates a ConcreteDecision from candidates', () => {
      const expectedOrder = Array.from(candidates).sort(TsRes.Decisions.Candidate.compare).reverse();
      const expectedAbstractKey = expectedOrder.map((c) => c.conditionSet.toHash()).join('+');
      const expectedValueKey = Hash.Crc32Normalizer.crc32Hash(
        expectedOrder.map((c) => JSON.stringify(c.value))
      );
      const expectedKey = `${expectedAbstractKey}|${expectedValueKey}`;

      expect(decisions.size).toBe(2);
      expect(decisions.validating.has(expectedAbstractKey)).toBe(false);
      expect(TsRes.Decisions.ConcreteDecision.create({ decisions, candidates })).toSucceedAndSatisfy((d) => {
        expect(d.candidates.length).toBe(candidates.length);
        expect(d.key).toBe(expectedKey);
        expect(d.index).toBeUndefined();
        expect(decisions.validating.has(expectedAbstractKey)).toBe(true);
        expect(decisions.size).toBe(3);
      });
    });

    test('fails with invalid index during create', () => {
      expect(
        TsRes.Decisions.ConcreteDecision.create({
          decisions,
          candidates,
          index: 'invalid' as unknown as number
        })
      ).toFailWith(/Not a number/);
    });
  });

  describe('index methods', () => {
    test('index can be set in create', () => {
      expect(
        TsRes.Decisions.ConcreteDecision.create({ decisions, candidates, index: 1 })
      ).toSucceedAndSatisfy((d) => {
        expect(d.index).toBe(1);
      });
    });

    test('setIndex sets the index on a decision with undefined index', () => {
      const decision = TsRes.Decisions.ConcreteDecision.create({ decisions, candidates }).orThrow();
      expect(decision.setIndex(1)).toSucceedWith(1 as TsRes.DecisionIndex);
      expect(decision.index).toBe(1);
    });

    test('setIndex fails if the index is out-of-range', () => {
      const decision = TsRes.Decisions.ConcreteDecision.create({ decisions, candidates }).orThrow();
      expect(decision.setIndex(-1)).toFailWith(/index/);
    });

    test('setIndex fails if the index is already set', () => {
      const decision = TsRes.Decisions.ConcreteDecision.create({ decisions, candidates }).orThrow();
      expect(decision.setIndex(1)).toSucceedWith(1 as TsRes.DecisionIndex);
      expect(decision.setIndex(2)).toFailWith(/index/);
    });

    test('setIndex succeeds if the index is already set to the same value', () => {
      const decision = TsRes.Decisions.ConcreteDecision.create({ decisions, candidates }).orThrow();
      expect(decision.setIndex(1)).toSucceedWith(1 as TsRes.DecisionIndex);
      expect(decision.setIndex(1)).toSucceedWith(1 as TsRes.DecisionIndex);
    });
  });
});
