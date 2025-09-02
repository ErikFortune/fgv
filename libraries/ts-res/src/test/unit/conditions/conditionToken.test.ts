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

describe('ConditionToken', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let tokens: TsRes.Conditions.ConditionTokens;
  let qualifierDecls: TsRes.Qualifiers.IQualifierDecl[];

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow(),
        new TestQualifierType()
      ]
    }).orThrow();

    qualifierDecls = [
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

    tokens = new TsRes.Conditions.ConditionTokens(qualifiers);
  });

  describe('constructor', () => {
    test('constructs a new instance with supplied qualifiers', () => {
      const tokens = new TsRes.Conditions.ConditionTokens(qualifiers);
      expect(tokens.qualifiers).toBe(qualifiers);
    });
  });

  describe('parseConditionToken', () => {
    test('parses a valid condition token with qualifier and value', () => {
      const qualifier = qualifiers.validating.get('currentTerritory').orThrow();
      const expected: TsRes.Conditions.IValidatedConditionDecl = {
        qualifier,
        operator: 'matches',
        value: 'US' as TsRes.QualifierConditionValue,
        priority: qualifier.defaultPriority
      };
      const result = tokens.parseConditionToken('currentTerritory=US');
      expect(result).toSucceedWith(expected);
    });

    test('parses a valid condition token with a qualifier token and value', () => {
      const qualifier = qualifiers.validating.get('homeTerritory').orThrow();
      const expected: TsRes.Conditions.IValidatedConditionDecl = {
        qualifier,
        operator: 'matches',
        value: 'US' as TsRes.QualifierConditionValue,
        priority: qualifier.defaultPriority
      };
      const result = tokens.parseConditionToken('home=US');
      expect(result).toSucceedWith(expected);
    });

    test('parses a valid condition token with just a value', () => {
      const qualifier = qualifiers.validating.get('homeTerritory').orThrow();
      const expected: TsRes.Conditions.IValidatedConditionDecl = {
        qualifier,
        operator: 'matches',
        value: 'CA' as TsRes.QualifierConditionValue,
        priority: qualifier.defaultPriority
      };
      const result = tokens.parseConditionToken('CA');
      expect(result).toSucceedWith(expected);
    });

    test('fails to parse a condition token with an invalid qualifier', () => {
      expect(tokens.parseConditionToken('invalidQualifier=US')).toFailWith(/invalidQualifier/);
    });

    test('fails to parse a condition token with an invalid value', () => {
      expect(tokens.parseConditionToken('currentTerritory=Bogus')).toFailWith(/invalid condition value/);
    });

    test('fails to parse a condition token with an unrecognized value', () => {
      expect(tokens.parseConditionToken('currentTerritory')).toFailWith(/does not match any qualifier/);
    });

    test('fails to parse a terse token with an ambiguous value', () => {
      qualifierDecls = qualifierDecls.map((q) => {
        if (q.name !== 'currentTerritory') {
          return q;
        }
        return { ...q, tokenIsOptional: true };
      });
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: qualifierDecls
      }).orThrow();
      tokens = new TsRes.Conditions.ConditionTokens(qualifiers);
      expect(tokens.parseConditionToken('US')).toFailWith(/matches multiple qualifiers/);
    });
  });

  describe('parseConditionSetToken', () => {
    test('parses a valid condition set token with multiple conditions', () => {
      const expected: TsRes.Conditions.IValidatedConditionDecl[] = [
        {
          qualifier: qualifiers.validating.get('homeTerritory').orThrow(),
          operator: 'matches',
          value: 'CA' as TsRes.QualifierConditionValue,
          priority: 800 as TsRes.ConditionPriority
        },
        {
          qualifier: qualifiers.validating.get('currentTerritory').orThrow(),
          operator: 'matches',
          value: 'US' as TsRes.QualifierConditionValue,
          priority: 700 as TsRes.ConditionPriority
        },
        {
          qualifier: qualifiers.validating.get('language').orThrow(),
          operator: 'matches',
          value: 'en' as TsRes.QualifierConditionValue,
          priority: 600 as TsRes.ConditionPriority
        },
        {
          qualifier: qualifiers.validating.get('some_thing').orThrow(),
          operator: 'matches',
          value: 'some_value' as TsRes.QualifierConditionValue,
          priority: 500 as TsRes.ConditionPriority
        },
        {
          qualifier: qualifiers.validating.get('testThing').orThrow(),
          operator: 'matches',
          value: 'test-value' as TsRes.QualifierConditionValue,
          priority: 400 as TsRes.ConditionPriority
        }
      ];
      const result = tokens.parseConditionSetToken(
        'home=CA,currentTerritory=US,language=en,some_thing=some_value,testThing=test-value'
      );
      expect(result).toSucceedWith(expected);
    });

    test('parses a valid condition set token with a single condition', () => {
      const expected: TsRes.Conditions.IValidatedConditionDecl[] = [
        {
          qualifier: qualifiers.validating.get('homeTerritory').orThrow(),
          operator: 'matches',
          value: 'CA' as TsRes.QualifierConditionValue,
          priority: 800 as TsRes.ConditionPriority
        }
      ];
      const result = tokens.parseConditionSetToken('home=CA');
      expect(result).toSucceedWith(expected);
    });

    test('parses a valid condition set token with a single terse condition', () => {
      const expected: TsRes.Conditions.IValidatedConditionDecl[] = [
        {
          qualifier: qualifiers.validating.get('homeTerritory').orThrow(),
          operator: 'matches',
          value: 'CA' as TsRes.QualifierConditionValue,
          priority: 800 as TsRes.ConditionPriority
        }
      ];
      const result = tokens.parseConditionSetToken('CA');
      expect(result).toSucceedWith(expected);
    });

    test('parses a valid condition set token including a terse condition', () => {
      const expected: TsRes.Conditions.IValidatedConditionDecl[] = [
        {
          qualifier: qualifiers.validating.get('homeTerritory').orThrow(),
          operator: 'matches',
          value: 'CA' as TsRes.QualifierConditionValue,
          priority: 800 as TsRes.ConditionPriority
        },
        {
          qualifier: qualifiers.validating.get('currentTerritory').orThrow(),
          operator: 'matches',
          value: 'US' as TsRes.QualifierConditionValue,
          priority: 700 as TsRes.ConditionPriority
        }
      ];
      const result = tokens.parseConditionSetToken('CA,currentTerritory=US');
      expect(result).toSucceedWith(expected);
    });
  });

  describe('validateConditionTokenParts', () => {
    test('validates a condition token with a qualifier and value', () => {
      const parts: TsRes.Helpers.IConditionTokenParts = {
        qualifier: 'currentTerritory',
        value: 'US'
      };
      const qualifier = qualifiers.validating.get('currentTerritory').orThrow();
      const expected: TsRes.Conditions.IValidatedConditionDecl = {
        qualifier,
        operator: 'matches',
        value: 'US' as TsRes.QualifierConditionValue,
        priority: qualifier.defaultPriority
      };
      const result = tokens.validateConditionTokenParts(parts);
      expect(result).toSucceedWith(expected);
    });

    test('validates a condition token with a qualifier token and value', () => {
      const parts: TsRes.Helpers.IConditionTokenParts = {
        qualifier: 'home',
        value: 'US'
      };
      const qualifier = qualifiers.validating.get('homeTerritory').orThrow();
      const expected: TsRes.Conditions.IValidatedConditionDecl = {
        qualifier,
        operator: 'matches',
        value: 'US' as TsRes.QualifierConditionValue,
        priority: qualifier.defaultPriority
      };
      const result = tokens.validateConditionTokenParts(parts);
      expect(result).toSucceedWith(expected);
    });

    test('validates a condition token with just a value', () => {
      const parts: TsRes.Helpers.IConditionTokenParts = {
        value: 'CA'
      };
      const qualifier = qualifiers.validating.get('homeTerritory').orThrow();
      const expected: TsRes.Conditions.IValidatedConditionDecl = {
        qualifier,
        operator: 'matches',
        value: 'CA' as TsRes.QualifierConditionValue,
        priority: qualifier.defaultPriority
      };
      const result = tokens.validateConditionTokenParts(parts);
      expect(result).toSucceedWith(expected);
    });

    test('fails to validate a condition token with an invalid qualifier', () => {
      const parts: TsRes.Helpers.IConditionTokenParts = {
        qualifier: 'invalidQualifier',
        value: 'US'
      };
      expect(tokens.validateConditionTokenParts(parts)).toFailWith(/invalidQualifier/);
    });

    test('fails to validate a condition token with an invalid value', () => {
      const parts: TsRes.Helpers.IConditionTokenParts = {
        qualifier: 'currentTerritory',
        value: 'Bogus'
      };
      expect(tokens.validateConditionTokenParts(parts)).toFailWith(/invalid condition value/);
    });

    test('fails to validate a condition token with an unrecognized value', () => {
      const parts: TsRes.Helpers.IConditionTokenParts = {
        value: 'currentTerritory'
      };
      expect(tokens.validateConditionTokenParts(parts)).toFailWith(/does not match any qualifier/);
    });

    test('fails to validate a terse token with an ambiguous value', () => {
      qualifierDecls = qualifierDecls.map((q) => {
        if (q.name !== 'currentTerritory') {
          return q;
        }
        return { ...q, tokenIsOptional: true };
      });
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: qualifierDecls
      }).orThrow();
      tokens = new TsRes.Conditions.ConditionTokens(qualifiers);
      const parts: TsRes.Helpers.IConditionTokenParts = {
        value: 'US'
      };
      expect(tokens.validateConditionTokenParts(parts)).toFailWith(/matches multiple qualifiers/);
    });
  });

  describe('findQualifierForValue', () => {
    test('finds a single qualifier for a valid value', () => {
      const value = 'US';
      const expected = qualifiers.validating.get('homeTerritory').orThrow();
      const result = tokens.findQualifierForValue(value);
      expect(result).toSucceedWith(expected);
    });

    test('fails to find a qualifier for an invalid value', () => {
      const value = 'Bogus';
      expect(tokens.findQualifierForValue(value)).toFailWith(/does not match any qualifier/);
    });

    test('fails to find a qualifier for an ambiguous value', () => {
      const value = 'US';
      qualifierDecls = qualifierDecls.map((q) => {
        if (q.name !== 'currentTerritory') {
          return q;
        }
        return { ...q, tokenIsOptional: true };
      });
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: qualifierDecls
      }).orThrow();
      tokens = new TsRes.Conditions.ConditionTokens(qualifiers);
      expect(tokens.findQualifierForValue(value)).toFailWith(/matches multiple qualifiers/);
    });
  });
});
