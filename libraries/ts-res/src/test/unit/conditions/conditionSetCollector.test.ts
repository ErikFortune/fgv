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

describe('ConditionSetCollector class', () => {
  const qualifierDecls: TsRes.Qualifiers.IQualifierDecl[] = [
    { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 },
    { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
    { name: 'language', typeName: 'language', defaultPriority: 600 },
    { name: 'some_thing', typeName: 'literal', defaultPriority: 500 },
    { name: 'testThing', typeName: 'test', defaultPriority: 400 },
    { name: 'extra', typeName: 'literal', defaultPriority: 300 }
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
    test('creates an empty ConditionSetCollector by default', () => {
      expect(TsRes.Conditions.ConditionSetCollector.create({ conditions })).toSucceedAndSatisfy((cc) => {
        // condition set collector is created with the unconditional condition set in position 0
        expect(cc.size).toBe(1);
        expect(cc.conditions).toBe(conditions);

        const unconditional = cc.unconditionalConditionSet;
        expect(unconditional.size).toBe(0);
        expect(unconditional.index).toBe(TsRes.Conditions.ConditionSetCollector.UnconditionalIndex);
        expect(unconditional.key).toBe(TsRes.Conditions.ConditionSet.UnconditionalKey);

        expect(cc.getAt(TsRes.Conditions.ConditionSetCollector.UnconditionalIndex)).toSucceedWith(
          unconditional
        );
        expect(cc.get(TsRes.Conditions.ConditionSet.UnconditionalKey)).toSucceedWith(unconditional);
      });
    });

    test('creates a ConditionSetCollector with initial conditions from supplied declarations', () => {
      const conditionSetDecls: TsRes.Conditions.IConditionSetDecl[] = [
        { conditions: [conditionDecls[0]] },
        { conditions: [conditionDecls[1], conditionDecls[2]] },
        { conditions: [conditionDecls[3], conditionDecls[4]] }
      ];
      expect(
        TsRes.Conditions.ConditionSetCollector.create({
          conditions,
          conditionSets: conditionSetDecls
        })
      ).toSucceedAndSatisfy((cc) => {
        expect(cc.size).toBe(conditionSetDecls.length + 1);
        expect(cc.conditions).toBe(conditions);
      });
    });

    test('fails if a condition cannot be constructed', () => {
      const conditionSetDecls: TsRes.Conditions.IConditionSetDecl[] = [
        { conditions: [conditionDecls[0]] },
        { conditions: [conditionDecls[1], conditionDecls[2]] },
        { conditions: [conditionDecls[3], conditionDecls[4]] }
      ];
      const badCondition = { qualifierName: 'unknown', value: 'CA' };
      conditionSetDecls[1].conditions.push(badCondition);

      expect(
        TsRes.Conditions.ConditionSetCollector.create({
          conditions,
          conditionSets: conditionSetDecls
        })
      ).toFailWith(/unknown/);
    });

    test('fails if multiple conditions have the same qualifier', () => {
      const conditionSetDecls: TsRes.Conditions.IConditionSetDecl[] = [
        { conditions: [conditionDecls[0]] },
        { conditions: [conditionDecls[1], conditionDecls[2]] },
        { conditions: [conditionDecls[3], conditionDecls[4]] }
      ];
      const duplicateCondition = { qualifierName: 'homeTerritory', value: 'NZ' };
      conditionSetDecls[0].conditions.push(duplicateCondition);

      expect(
        TsRes.Conditions.ConditionSetCollector.create({
          conditions,
          conditionSets: conditionSetDecls
        })
      ).toFailWith(/duplicate conditions/i);
    });
  });

  describe('add method', () => {
    test('adds an instantiated condition set to the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const conditionSet = TsRes.Conditions.ConditionSet.create({ conditions: allConditions }).orThrow();
      expect(cc.add(conditionSet)).toSucceedWith(conditionSet);
      expect(cc.size).toBe(2);
      expect(cc.get(conditionSet.key)).toSucceedWith(conditionSet);
    });

    test('succeeds if the object is already in the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const conditionSet = TsRes.Conditions.ConditionSet.create({ conditions: allConditions }).orThrow();
      cc.add(conditionSet).orThrow();
      expect(cc.add(conditionSet)).toSucceedWith(conditionSet);
      expect(cc.size).toBe(2);
    });

    test('fails to add an empty (unconditional) condition set to the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const conditionSet = TsRes.Conditions.ConditionSet.create({ conditions: [] }).orThrow();
      expect(cc.add(conditionSet)).toFailWith(/already exists/i);
    });

    test('fails if another object with the same key is already in the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const conditionSet = TsRes.Conditions.ConditionSet.create({ conditions: allConditions }).orThrow();
      const cs2 = TsRes.Conditions.ConditionSet.create({ conditions: allConditions }).orThrow();
      cc.add(conditionSet).orThrow();
      expect(cc.add(cs2)).toFailWith(/already exists/i);
      expect(cc.size).toBe(2);
    });
  });

  describe('getOrAdd method', () => {
    test('returns the existing condition set if the key is already in the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const conditionSet = TsRes.Conditions.ConditionSet.create({ conditions: allConditions }).orThrow();
      const cs2 = TsRes.Conditions.ConditionSet.create({ conditions: allConditions }).orThrow();
      cc.validating.add(conditionSet).orThrow();
      expect(cc.add(conditionSet)).toSucceedWith(conditionSet);
      expect(cc.size).toBe(2);
      expect(cc.getOrAdd(cs2)).toSucceedAndSatisfy((cs) => {
        expect(cs).toBe(conditionSet);
        expect(cs).not.toBe(cs2);
        expect(cc.size).toBe(2);
      });
    });

    test('returns an unconditional condition set', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const cs = TsRes.Conditions.ConditionSet.create({ conditions: [] }).orThrow();
      expect(cc.getOrAdd(cs)).toSucceedAndSatisfy((cs) => {
        expect(cs.size).toBe(0);
        expect(cc.size).toBe(1);
      });
    });
  });

  describe('validating add method', () => {
    test('adds an instantiated condition set to the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const conditionSet = TsRes.Conditions.ConditionSet.create({ conditions: allConditions }).orThrow();
      expect(cc.validating.add(conditionSet)).toSucceedWith(conditionSet);
      expect(cc.size).toBe(2);
      expect(cc.get(conditionSet.key)).toSucceedWith(conditionSet);
    });

    test('adds a condition set from a declaration to the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const decl: TsRes.Conditions.IConditionSetDecl = { conditions: conditionDecls };
      expect(cc.validating.add(decl)).toSucceedAndSatisfy((conditionSet) => {
        expect(conditionSet.size).toBe(conditionDecls.length);
      });
    });

    test('adds a condition set from an array of declarations to the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      expect(cc.validating.add(conditionDecls)).toSucceedAndSatisfy((conditionSet) => {
        expect(conditionSet.size).toBe(conditionDecls.length);
      });
    });

    test('adds a condition set from an array of instantiated conditions to the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      expect(cc.validating.add(allConditions)).toSucceedAndSatisfy((conditionSet) => {
        expect(conditionSet.size).toBe(allConditions.length);
      });
      expect(cc.size).toBe(2);
    });

    test('adds a condition set from a mixed array to the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const toAdd = [...allConditions, { qualifierName: 'extra', value: 'bonus' }];
      expect(cc.validating.add(toAdd)).toSucceedAndSatisfy((conditionSet) => {
        expect(conditionSet.size).toBe(allConditions.length + 1);
      });
      expect(cc.size).toBe(2);
    });

    test('fails if a condition set with the same key is already in the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const decl: TsRes.Conditions.IConditionSetDecl = { conditions: conditionDecls };
      cc.validating.add(decl).orThrow();
      expect(cc.validating.add(decl)).toFailWith(/already exists/i);
      expect(cc.size).toBe(2);
    });

    test('fails if a condition cannot be constructed', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      expect(cc.validating.add({})).toFailWith(/invalid/);
    });

    test('adds a condition set from a plain object declaration to the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const plainObjectDecl = { conditions: conditionDecls.slice(0, 2) };
      expect(cc.validating.add(plainObjectDecl)).toSucceedAndSatisfy((conditionSet) => {
        expect(conditionSet.size).toBe(2);
      });
      expect(cc.size).toBe(2);
    });
  });

  describe('validating getOrAdd method', () => {
    test('returns the existing condition set if the key is already in the collector', () => {
      const cc = TsRes.Conditions.ConditionSetCollector.create({ conditions }).orThrow();
      const decl: TsRes.Conditions.IConditionSetDecl = { conditions: conditionDecls };
      const cs1 = cc.validating.add(decl).orThrow();
      const cs2 = cc.validating.getOrAdd(decl).orThrow();
      expect(cs1).toBe(cs2);
    });
  });
});
