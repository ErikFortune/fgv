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

describe('Condition', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;

  beforeEach(() => {
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

  describe('create static method', () => {
    test('creates a condition from a validated declaration', () => {
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'CA'
          },
          { qualifiers }
        )
        .orThrow();
      expect(TsRes.Conditions.Condition.create(decl)).toSucceedAndSatisfy((c) => {
        expect(c.qualifier.name).toBe('homeTerritory');
        expect(c.value).toBe('CA');
        expect(c.operator).toBe('matches');
        expect(c.priority).toBe(800);
        expect(c.scoreAsDefault).toBeUndefined();
        expect(c.key).toBe('homeTerritory-[CA]@800');
        expect(c.toString()).toBe('homeTerritory-[CA]@800');
      });
    });

    test('creates a condition from a validated declaration with scoreAsDefault', () => {
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'CA',
            scoreAsDefault: 0.5
          },
          { qualifiers }
        )
        .orThrow();
      expect(TsRes.Conditions.Condition.create(decl)).toSucceedAndSatisfy((c) => {
        expect(c.qualifier.name).toBe('homeTerritory');
        expect(c.value).toBe('CA');
        expect(c.operator).toBe('matches');
        expect(c.priority).toBe(800);
        expect(c.scoreAsDefault).toBe(0.5);
        expect(c.key).toBe('homeTerritory-[CA]@800(0.5)');
        expect(c.toString()).toBe('homeTerritory-[CA]@800(0.5)');
      });
    });
  });

  describe('compare static method', () => {
    test('considers priority first', () => {
      const c1 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'currentTerritory',
            value: 'AQ',
            priority: 800
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      const c2 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'CA',
            priority: 700
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();

      expect(TsRes.Conditions.Condition.compare(c1, c2)).toBeGreaterThan(0);
    });

    test('falls back to scoreAsDefault if priorities are equal', () => {
      const c1 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'CA',
            priority: 800,
            scoreAsDefault: 0.5
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      const c2 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'AQ',
            priority: 800,
            scoreAsDefault: 0.6
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();

      expect(TsRes.Conditions.Condition.compare(c1, c2)).toBeLessThan(0);
    });

    test('falls back to qualifier name if scores as default are equal', () => {
      const c1 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'AQ',
            priority: 800
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      const c2 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'currentTerritory',
            value: 'CA',
            priority: 800
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();

      expect(TsRes.Conditions.Condition.compare(c1, c2)).toBeGreaterThan(0);
    });

    test('falls back to value if priorities and qualifiers are equal', () => {
      const c1 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'CA',
            priority: 800
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      const c2 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'AQ',
            priority: 800
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();

      expect(TsRes.Conditions.Condition.compare(c1, c2)).toBeGreaterThan(0);
    });

    test('returns 0 if conditions are equal', () => {
      const c1 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'CA',
            priority: 800
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      const c2 = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'CA',
            priority: 800
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();

      expect(TsRes.Conditions.Condition.compare(c1, c2)).toBe(0);
    });
  });

  describe('getKeyForDecl', () => {
    test('gets the key for a validated condition declaration', () => {
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'CA'
          },
          { qualifiers }
        )
        .orThrow();
      expect(TsRes.Conditions.Condition.getKeyForDecl(decl)).toSucceedWith(
        'homeTerritory-[CA]@800' as TsRes.ConditionKey
      );
    });

    test('includes the operator in the key if present and other than "matches"', () => {
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'testThing',
            value: 'whatevs',
            operator: 'matches'
          },
          { qualifiers }
        )
        .orThrow();
      decl.operator = 'always';
      expect(TsRes.Conditions.Condition.getKeyForDecl(decl)).toSucceedWith(
        'testThing-always-[whatevs]@400' as TsRes.ConditionKey
      );
    });
  });
});
