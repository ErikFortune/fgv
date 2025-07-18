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

describe('AbstractDecisionCollector', () => {
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

  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let conditions: TsRes.Conditions.ConditionCollector;
  let conditionSetCollector: TsRes.Conditions.ConditionSetCollector;
  let conditionSets: TsRes.Conditions.ConditionSet[];
  let conditionSetsKey: string;

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

    conditionSetCollector = TsRes.Conditions.ConditionSetCollector.create({
      conditions
    }).orThrow();

    conditionSets = [
      conditionSetCollector.validating
        .add({
          conditions: [conditionDecls[0]]
        })
        .orThrow(),

      conditionSetCollector.validating
        .add({
          conditions: [conditionDecls[1], conditionDecls[2]]
        })
        .orThrow(),

      conditionSetCollector.validating
        .add({
          conditions: [conditionDecls[1], conditionDecls[3]]
        })
        .orThrow()
    ];

    conditionSetsKey = Array.from(conditionSets)
      .sort(TsRes.Conditions.ConditionSet.compare)
      .reverse()
      .map((cs) => cs.toHash())
      .join('+');
  });

  describe('createStatic method', () => {
    test('creates an empty AbstractDecisionCollector by default', () => {
      expect(
        TsRes.Decisions.AbstractDecisionCollector.create({ conditionSets: conditionSetCollector })
      ).toSucceedAndSatisfy((cc) => {
        // abstract decision collector is initialized with:
        // 0: empty decision (no condition sets)
        // 1: single default value decision (unconditional condition set)
        expect(cc.size).toBe(2);

        const empty = cc.emptyDecision;
        expect(empty.candidates.length).toBe(0);
        expect(empty.key).toBe(TsRes.Decisions.Decision.EmptyDecisionKey);
        expect(empty.index).toBe(TsRes.Decisions.AbstractDecisionCollector.EmptyDecisionIndex);

        const defaultOnly = cc.defaultOnlyDecision;
        expect(defaultOnly.candidates.length).toBe(1);
        expect(defaultOnly.candidates[0].conditionSet.conditions.length).toBe(0);
        expect(defaultOnly.key).toBe(TsRes.Decisions.Decision.DefaultOnlyDecisionKey);
        expect(defaultOnly.index).toBe(TsRes.Decisions.AbstractDecisionCollector.DefaultOnlyDecisionIndex);

        expect(cc.getAt(TsRes.Decisions.AbstractDecisionCollector.EmptyDecisionIndex)).toSucceedWith(empty);
        expect(cc.getAt(TsRes.Decisions.AbstractDecisionCollector.DefaultOnlyDecisionIndex)).toSucceedWith(
          defaultOnly
        );
        expect(cc.get(TsRes.Decisions.Decision.EmptyDecisionKey)).toSucceedWith(empty);
        expect(cc.get(TsRes.Decisions.Decision.DefaultOnlyDecisionKey)).toSucceedWith(defaultOnly);
      });
    });
  });

  describe('add method', () => {
    test('adds a new instantiated AbstractDecision to the collector', () => {
      const decision = TsRes.Decisions.AbstractDecision.createAbstractDecision({ conditionSets }).orThrow();
      const dc = TsRes.Decisions.AbstractDecisionCollector.create({
        conditionSets: conditionSetCollector
      }).orThrow();
      expect(dc.add(decision)).toSucceedAndSatisfy((d) => {
        expect(d).toBe(decision);
        expect(dc.size).toBe(3);
        expect(dc.get(decision.key)).toSucceedWith(decision);
      });
    });

    test('succeeds if the object already exists in the collector', () => {
      const decision = TsRes.Decisions.AbstractDecision.createAbstractDecision({ conditionSets }).orThrow();
      const dc = TsRes.Decisions.AbstractDecisionCollector.create({
        conditionSets: conditionSetCollector
      }).orThrow();
      dc.add(decision).orThrow();
      expect(dc.add(decision)).toSucceedWith(decision);
    });

    test('fails if another object with the same key is already in the collector', () => {
      const decision = TsRes.Decisions.AbstractDecision.createAbstractDecision({ conditionSets }).orThrow();
      const dc = TsRes.Decisions.AbstractDecisionCollector.create({
        conditionSets: conditionSetCollector
      }).orThrow();
      const dc2 = TsRes.Decisions.AbstractDecision.createAbstractDecision({ conditionSets }).orThrow();
      dc.add(decision).orThrow();
      expect(dc.add(dc2)).toFailWith(/already exists/);
    });
  });

  describe('getOrAddMethod', () => {
    test('returns the existing decision if the key is already in the collector', () => {
      const decision = TsRes.Decisions.AbstractDecision.createAbstractDecision({ conditionSets }).orThrow();
      const d2 = TsRes.Decisions.AbstractDecision.createAbstractDecision({ conditionSets }).orThrow();
      const dc = TsRes.Decisions.AbstractDecisionCollector.create({
        conditionSets: conditionSetCollector
      }).orThrow();
      dc.validating.add(decision).orThrow();
      expect(dc.getOrAdd(d2)).toSucceedWith(decision);
      expect(dc.size).toBe(3);
    });
  });

  describe('validating add method', () => {
    test('adds a new instantiated AbstractDecision to the validating collector', () => {
      const decision = TsRes.Decisions.AbstractDecision.createAbstractDecision({ conditionSets }).orThrow();
      const dc = TsRes.Decisions.AbstractDecisionCollector.create({
        conditionSets: conditionSetCollector
      }).orThrow();
      expect(dc.validating.add(decision)).toSucceedWith(decision);
      expect(dc.size).toBe(3);
      expect(dc.get(decision.key)).toSucceedWith(decision);
    });

    test('adds a decision to the collector from an array of condition sets', () => {
      const dc = TsRes.Decisions.AbstractDecisionCollector.create({
        conditionSets: conditionSetCollector
      }).orThrow();
      expect(dc.validating.add(conditionSets)).toSucceedAndSatisfy((d) => {
        expect(d.candidates.length).toBe(conditionSets.length);
        expect(d.key).toBe(conditionSetsKey);
      });
    });

    test('fails if another object with the same key is already in the collector', () => {
      const dc = TsRes.Decisions.AbstractDecisionCollector.create({
        conditionSets: conditionSetCollector
      }).orThrow();
      dc.validating.add(conditionSets).orThrow();
      expect(dc.validating.add(conditionSets)).toFailWith(/already exists/);
    });

    test('fails if the object to be added cannot be converted', () => {
      const dc = TsRes.Decisions.AbstractDecisionCollector.create({
        conditionSets: conditionSetCollector
      }).orThrow();
      expect(dc.validating.add({})).toFailWith(/invalid/);
    });

    test('adds existing AbstractDecision instance directly', () => {
      const decision = TsRes.Decisions.AbstractDecision.createAbstractDecision({ conditionSets }).orThrow();
      const dc = TsRes.Decisions.AbstractDecisionCollector.create({
        conditionSets: conditionSetCollector
      }).orThrow();
      expect(dc.validating.add(decision)).toSucceedWith(decision);
      expect(dc.size).toBe(3);
    });

    test('fails for invalid input that is not AbstractDecision or ConditionSet array', () => {
      const dc = TsRes.Decisions.AbstractDecisionCollector.create({
        conditionSets: conditionSetCollector
      }).orThrow();
      expect(dc.validating.add('invalid')).toFailWith(/invalid value/);
      expect(dc.validating.add(42)).toFailWith(/invalid value/);
      expect(dc.validating.add(null)).toFailWith(/invalid value/);
    });
  });

  describe('validating getOrAdd method', () => {
    test('returns the existing decision if the key is already in the collector', () => {
      const dc = TsRes.Decisions.AbstractDecisionCollector.create({
        conditionSets: conditionSetCollector
      }).orThrow();
      const decision = dc.validating.add(conditionSets).orThrow();
      expect(dc.validating.getOrAdd(conditionSets)).toSucceedWith(decision);
      expect(dc.size).toBe(3);
    });
  });
});
