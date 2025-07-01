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
      {
        name: 'homeTerritory',
        typeName: 'territory',
        defaultPriority: 800,
        token: 'home',
        tokenIsOptional: true
      },
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
        expect(c.toToken()).toSucceedWith('home=CA' as TsRes.ConditionToken);
        expect(c.toToken(true)).toSucceedWith('CA' as TsRes.ConditionToken);
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

  describe('toToken method', () => {
    test('uses qualifier token if present instead of name', () => {
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'CA'
          },
          { qualifiers }
        )
        .orThrow();
      const condition = TsRes.Conditions.Condition.create(decl).orThrow();
      expect(condition.toToken()).toSucceedWith('home=CA' as TsRes.ConditionToken);
    });

    test('uses qualifier name if token is not present', () => {
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'currentTerritory',
            value: 'CA'
          },
          { qualifiers }
        )
        .orThrow();
      const condition = TsRes.Conditions.Condition.create(decl).orThrow();
      expect(condition.toToken()).toSucceedWith('currentTerritory=CA' as TsRes.ConditionToken);
    });

    test('omits qualifier name if terse is true and token is optional', () => {
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'CA'
          },
          { qualifiers }
        )
        .orThrow();
      const condition = TsRes.Conditions.Condition.create(decl).orThrow();
      expect(condition.toToken(true)).toSucceedWith('CA' as TsRes.ConditionToken);
    });

    test('does not omit qualifier name if terse is true and token is not optional', () => {
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'currentTerritory',
            value: 'CA'
          },
          { qualifiers }
        )
        .orThrow();
      const condition = TsRes.Conditions.Condition.create(decl).orThrow();
      expect(condition.toToken(true)).toSucceedWith('currentTerritory=CA' as TsRes.ConditionToken);
    });

    test('fails if the priority is not the default', () => {
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            value: 'CA',
            priority: 700
          },
          { qualifiers }
        )
        .orThrow();
      const condition = TsRes.Conditions.Condition.create(decl).orThrow();
      expect(condition.toToken()).toFailWith(/cannot create condition token for non-default priority/i);
    });

    test('uses qualifier name if token is not present (fallback)', () => {
      const decl = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'currentTerritory', // has no token
            value: 'CA'
          },
          { qualifiers }
        )
        .orThrow();
      const condition = TsRes.Conditions.Condition.create(decl).orThrow();
      expect(condition.toToken()).toSucceedWith('currentTerritory=CA' as TsRes.ConditionToken);
    });
  });

  describe('toChildConditionDecl method', () => {
    test('returns the child condition declaration with defaults', () => {
      const decl: TsRes.ResourceJson.Json.IChildConditionDecl = {
        value: 'CA'
      };
      const condition = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            ...decl
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      expect(condition.toChildConditionDecl()).toEqual(decl);
    });

    test('returns all condition properties if showDefaults is true', () => {
      const decl: TsRes.ResourceJson.Json.IChildConditionDecl = {
        value: 'CA'
      };
      const condition = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            ...decl
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      expect(condition.toChildConditionDecl({ showDefaults: true })).toEqual({
        ...decl,
        operator: 'matches',
        priority: 800
      });
    });

    test('returns the child condition declaration with non-defaults', () => {
      const decl: TsRes.ResourceJson.Json.IChildConditionDecl = {
        value: 'CA',
        priority: 700,
        scoreAsDefault: 0.5
      };
      const condition = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            ...decl
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      expect(condition.toChildConditionDecl()).toEqual(decl);
    });
  });

  describe('toValueOrChildConditionDecl method', () => {
    test('returns the value if defaults', () => {
      const decl: TsRes.ResourceJson.Json.IChildConditionDecl = {
        value: 'CA'
      };
      const condition = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            ...decl
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      expect(condition.toValueOrChildConditionDecl()).toEqual(decl.value);
    });

    test('returns all properties if showDefaults is true', () => {
      const decl: TsRes.ResourceJson.Json.IChildConditionDecl = {
        value: 'CA'
      };
      const condition = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            ...decl
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      expect(condition.toValueOrChildConditionDecl({ showDefaults: true })).toEqual({
        ...decl,
        operator: 'matches',
        priority: 800
      });
    });

    test('returns the child condition declaration with non-defaults', () => {
      const decl: TsRes.ResourceJson.Json.IChildConditionDecl = {
        value: 'CA',
        priority: 700,
        scoreAsDefault: 0.5
      };
      const condition = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(
          {
            qualifierName: 'homeTerritory',
            ...decl
          },
          { qualifiers }
        )
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      expect(condition.toValueOrChildConditionDecl()).toEqual(decl);
    });
  });

  describe('toLooseConditionDecl method', () => {
    test('returns the loose condition declaration with defaults', () => {
      const decl: TsRes.ResourceJson.Json.ILooseConditionDecl = {
        qualifierName: 'homeTerritory',
        value: 'CA'
      };
      const condition = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(decl, { qualifiers })
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      expect(condition.toLooseConditionDecl()).toEqual(decl);
    });

    test('returns the loose condition declaration with all properties if showDefaults is true', () => {
      const decl: TsRes.ResourceJson.Json.ILooseConditionDecl = {
        qualifierName: 'homeTerritory',
        value: 'CA'
      };
      const condition = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(decl, { qualifiers })
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      expect(condition.toLooseConditionDecl({ showDefaults: true })).toEqual({
        ...decl,
        operator: 'matches',
        priority: 800
      });
    });

    test('returns the loose condition declaration with non-defaults', () => {
      const decl: TsRes.ResourceJson.Json.ILooseConditionDecl = {
        qualifierName: 'homeTerritory',
        value: 'CA',
        priority: 700,
        scoreAsDefault: 0.5
      };
      const condition = TsRes.Conditions.Convert.validatedConditionDecl
        .convert(decl, { qualifiers })
        .onSuccess(TsRes.Conditions.Condition.create)
        .orThrow();
      expect(condition.toLooseConditionDecl()).toEqual(decl);
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

  describe('getContextMatch method', () => {
    let condition: TsRes.Conditions.Condition;
    beforeEach(() => {
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
      condition = TsRes.Conditions.Condition.create(decl).orThrow();
    });

    test('returns match score when qualifier is present and matches', () => {
      const context = { homeTerritory: 'CA' };
      const score = condition.getContextMatch(context);
      expect(score).toBe(TsRes.PerfectMatch);
    });

    test('returns scoreAsDefault if match is NoMatch and acceptDefaultScore is true', () => {
      const context = { homeTerritory: 'US' };
      const score = condition.getContextMatch(context, { acceptDefaultScore: true });
      expect(score).toBe(0.5);
    });

    test('returns NoMatch if match is NoMatch and acceptDefaultScore is false/undefined', () => {
      const context = { homeTerritory: 'US' };
      const score = condition.getContextMatch(context);
      expect(score).toBe(TsRes.NoMatch);
    });

    test('returns undefined if qualifier is not present and partialContextMatch is true', () => {
      const context = { currentTerritory: 'CA' };
      const score = condition.getContextMatch(context, { partialContextMatch: true });
      expect(score).toBeUndefined();
    });

    test('returns NoMatch if qualifier is not present and partialContextMatch is false/undefined', () => {
      const context = { currentTerritory: 'CA' };
      const score = condition.getContextMatch(context);
      expect(score).toBe(TsRes.NoMatch);
    });
  });

  describe('matchesContext method', () => {
    let condition: TsRes.Conditions.Condition;
    beforeEach(() => {
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
      condition = TsRes.Conditions.Condition.create(decl).orThrow();
    });

    test('returns true when qualifier is present and matches', () => {
      const context = { homeTerritory: 'CA' };
      expect(condition.matchesContext(context)).toBe(true);
    });

    test('returns false when qualifier is present and does not match', () => {
      const context = { homeTerritory: 'US' };
      expect(condition.matchesContext(context)).toBe(false);
    });

    test('returns true when qualifier is not present in context', () => {
      const context = { currentTerritory: 'CA' };
      expect(condition.matchesContext(context)).toBe(true);
    });
  });
});
