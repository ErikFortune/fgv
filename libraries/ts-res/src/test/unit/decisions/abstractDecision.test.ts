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

describe('AbstractDecision', () => {
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
  });

  describe('createAbstractDecision static method', () => {
    test('creates an AbstractDecision from condition sets', () => {
      const expectedOrder = Array.from(conditionSets).sort(TsRes.Conditions.ConditionSet.compare).reverse();
      expect(TsRes.Decisions.AbstractDecision.createAbstractDecision({ conditionSets })).toSucceedAndSatisfy(
        (d) => {
          const expectedKey = expectedOrder.map((c) => c.toHash()).join('+');
          expect(d.candidates.length).toBe(conditionSets.length);
          expect(d.key).toBe(expectedKey);
          expect(d.index).toBeUndefined();
          expectedOrder.forEach((c, i) => {
            expect(d.candidates[i].value).toBe(i);
            expect(d.candidates[i].conditionSet).toBe(c);
          });
        }
      );
    });

    test('creates an empty abstract decision if no condition sets are provided', () => {
      expect(
        TsRes.Decisions.AbstractDecision.createAbstractDecision({ conditionSets: [] })
      ).toSucceedAndSatisfy((d) => {
        expect(d.candidates.length).toBe(0);
        expect(d.key).toBe('');
        expect(d.index).toBeUndefined();
      });
    });
  });

  describe('toCompiled method', () => {
    test('converts abstract decision to compiled representation without metadata by default', () => {
      const decision = TsRes.Decisions.AbstractDecision.createAbstractDecision({
        conditionSets,
        index: 1 as TsRes.DecisionIndex
      }).orThrow();

      const compiled = decision.toCompiled();
      expect(compiled).toEqual({
        conditionSets: decision.candidates.map((c) => c.conditionSet.index!)
      });
      expect(compiled.metadata).toBeUndefined();
    });

    test('converts abstract decision to compiled representation with metadata when requested', () => {
      const decision = TsRes.Decisions.AbstractDecision.createAbstractDecision({
        conditionSets,
        index: 1 as TsRes.DecisionIndex
      }).orThrow();

      const compiled = decision.toCompiled({ includeMetadata: true });
      expect(compiled).toEqual({
        conditionSets: decision.candidates.map((c) => c.conditionSet.index!),
        metadata: {
          key: decision.key
        }
      });
    });

    test('excludes metadata when explicitly disabled', () => {
      const decision = TsRes.Decisions.AbstractDecision.createAbstractDecision({
        conditionSets: [conditionSets[0]],
        index: 1 as TsRes.DecisionIndex
      }).orThrow();

      const compiled = decision.toCompiled({ includeMetadata: false });
      expect(compiled.metadata).toBeUndefined();
    });

    test('handles empty abstract decision', () => {
      const decision = TsRes.Decisions.AbstractDecision.createAbstractDecision({
        conditionSets: [],
        index: 1 as TsRes.DecisionIndex
      }).orThrow();

      const compiled = decision.toCompiled();
      expect(compiled).toEqual({
        conditionSets: []
      });
    });
  });
});
