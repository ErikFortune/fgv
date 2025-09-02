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

describe('ContextToken', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;
  let tokens: TsRes.Context.ContextTokens;
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

    tokens = new TsRes.Context.ContextTokens(qualifiers);
  });

  describe('constructor', () => {
    test('constructs a new instance with supplied qualifiers', () => {
      const tokens = new TsRes.Context.ContextTokens(qualifiers);
      expect(tokens.qualifiers).toBe(qualifiers);
    });
  });

  describe('parseContextQualifierToken', () => {
    test('parses a valid context qualifier token with qualifier and value', () => {
      const qualifier = qualifiers.validating.get('currentTerritory').orThrow();
      const expected: TsRes.Context.IValidatedContextQualifierValueDecl = {
        qualifier,
        value: 'US' as TsRes.QualifierContextValue
      };
      const result = tokens.parseContextQualifierToken('currentTerritory=US');
      expect(result).toSucceedAndSatisfy((decl) => {
        expect(decl.qualifier).toBe(expected.qualifier);
        expect(decl.value).toBe(expected.value);
      });
    });

    test('parses a valid context qualifier token with comma-separated values', () => {
      const qualifier = qualifiers.validating.get('language').orThrow();
      const result = tokens.parseContextQualifierToken('language=en-US, de-DE');
      expect(result).toSucceedAndSatisfy((decl) => {
        expect(decl.qualifier).toBe(qualifier);
        expect(decl.value).toBe('en-US, de-DE' as TsRes.QualifierContextValue);
      });
    });

    test('parses a valid context qualifier token with just a value (token-optional qualifier)', () => {
      const qualifier = qualifiers.validating.get('homeTerritory').orThrow();
      const expected: TsRes.Context.IValidatedContextQualifierValueDecl = {
        qualifier,
        value: 'US' as TsRes.QualifierContextValue
      };
      const result = tokens.parseContextQualifierToken('US');
      expect(result).toSucceedAndSatisfy((decl) => {
        expect(decl.qualifier).toBe(expected.qualifier);
        expect(decl.value).toBe(expected.value);
      });
    });

    test('fails for invalid qualifier', () => {
      expect(tokens.parseContextQualifierToken('invalidQualifier=US')).toFailWith(/not found/i);
    });

    test('fails for invalid value', () => {
      expect(tokens.parseContextQualifierToken('currentTerritory=INVALID')).toFailWith(/invalid.*territory/i);
    });

    test('fails for ambiguous token-optional value', () => {
      // Add another token-optional qualifier that could match 'US'
      const additionalQualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          ...qualifierDecls,
          {
            name: 'anotherTerritory',
            typeName: 'territory',
            defaultPriority: 750,
            token: 'another',
            tokenIsOptional: true
          }
        ]
      }).orThrow();
      const ambiguousTokens = new TsRes.Context.ContextTokens(additionalQualifiers);
      expect(ambiguousTokens.parseContextQualifierToken('US')).toFailWith(/matches multiple qualifiers/i);
    });
  });

  describe('parseContextToken', () => {
    test('parses a valid context token with multiple parts', () => {
      const languageQualifier = qualifiers.validating.get('language').orThrow();
      const territoryQualifier = qualifiers.validating.get('currentTerritory').orThrow();
      const homeQualifier = qualifiers.validating.get('homeTerritory').orThrow();

      const result = tokens.parseContextToken('language=en-US, de-DE|currentTerritory=US|GB');
      expect(result).toSucceedAndSatisfy((decls) => {
        expect(decls).toHaveLength(3);
        expect(decls[0].qualifier).toBe(languageQualifier);
        expect(decls[0].value).toBe('en-US, de-DE' as TsRes.QualifierContextValue);
        expect(decls[1].qualifier).toBe(territoryQualifier);
        expect(decls[1].value).toBe('US' as TsRes.QualifierContextValue);
        expect(decls[2].qualifier).toBe(homeQualifier);
        expect(decls[2].value).toBe('GB' as TsRes.QualifierContextValue);
      });
    });

    test('parses a valid context token with single part', () => {
      const qualifier = qualifiers.validating.get('language').orThrow();
      const result = tokens.parseContextToken('language=en-US');
      expect(result).toSucceedAndSatisfy((decls) => {
        expect(decls).toHaveLength(1);
        expect(decls[0].qualifier).toBe(qualifier);
        expect(decls[0].value).toBe('en-US' as TsRes.QualifierContextValue);
      });
    });

    test('handles whitespace around pipe separators', () => {
      const languageQualifier = qualifiers.validating.get('language').orThrow();
      const territoryQualifier = qualifiers.validating.get('currentTerritory').orThrow();

      const result = tokens.parseContextToken('language=en-US | currentTerritory=US');
      expect(result).toSucceedAndSatisfy((decls) => {
        expect(decls).toHaveLength(2);
        expect(decls[0].qualifier).toBe(languageQualifier);
        expect(decls[1].qualifier).toBe(territoryQualifier);
      });
    });

    test('fails if any part is invalid', () => {
      expect(tokens.parseContextToken('language=en-US|invalidQualifier=value')).toFailWith(/not found/i);
    });
  });

  describe('validateContextTokenParts', () => {
    test('validates parts with qualifier and value', () => {
      const parts: TsRes.Helpers.IContextTokenParts = {
        qualifier: 'language',
        value: 'en-US'
      };
      const qualifier = qualifiers.validating.get('language').orThrow();
      const result = tokens.validateContextTokenParts(parts);
      expect(result).toSucceedAndSatisfy((decl) => {
        expect(decl.qualifier).toBe(qualifier);
        expect(decl.value).toBe('en-US' as TsRes.QualifierContextValue);
      });
    });

    test('validates parts with just value (token-optional)', () => {
      const parts: TsRes.Helpers.IContextTokenParts = {
        value: 'US'
      };
      const qualifier = qualifiers.validating.get('homeTerritory').orThrow();
      const result = tokens.validateContextTokenParts(parts);
      expect(result).toSucceedAndSatisfy((decl) => {
        expect(decl.qualifier).toBe(qualifier);
        expect(decl.value).toBe('US' as TsRes.QualifierContextValue);
      });
    });
  });

  describe('findQualifierForValue', () => {
    test('finds token-optional qualifier for valid value', () => {
      const qualifier = qualifiers.validating.get('homeTerritory').orThrow();
      expect(tokens.findQualifierForValue('US')).toSucceedWith(qualifier);
    });

    test('fails for value with no matching qualifiers', () => {
      expect(tokens.findQualifierForValue('nomatch')).toFailWith(/does not match any qualifier/i);
    });
  });

  describe('contextTokenToPartialContext', () => {
    test('converts context token to partial context', () => {
      const result = tokens.contextTokenToPartialContext('language=en-US|currentTerritory=US');
      expect(result).toSucceedAndSatisfy((context) => {
        const expectedContext: TsRes.Context.IValidatedContextDecl = {};
        expectedContext['language' as TsRes.QualifierName] = 'en-US' as TsRes.QualifierContextValue;
        expectedContext['currentTerritory' as TsRes.QualifierName] = 'US' as TsRes.QualifierContextValue;
        expect(context).toEqual(expectedContext);
      });
    });

    test('converts context token with comma-separated values', () => {
      const result = tokens.contextTokenToPartialContext('language=en-US, de-DE|currentTerritory=US');
      expect(result).toSucceedAndSatisfy((context) => {
        const expectedContext: TsRes.Context.IValidatedContextDecl = {};
        expectedContext['language' as TsRes.QualifierName] = 'en-US, de-DE' as TsRes.QualifierContextValue;
        expectedContext['currentTerritory' as TsRes.QualifierName] = 'US' as TsRes.QualifierContextValue;
        expect(context).toEqual(expectedContext);
      });
    });

    test('converts empty token to empty context', () => {
      const result = tokens.contextTokenToPartialContext('');
      expect(result).toSucceedWith({});
    });

    test('fails for duplicate qualifiers', () => {
      expect(tokens.contextTokenToPartialContext('language=en-US|language=de-DE')).toFailWith(
        /duplicate qualifier/i
      );
    });
  });

  describe('partialContextToContextToken', () => {
    test('converts partial context to context token', () => {
      const context: TsRes.Context.IValidatedContextDecl = {};
      context['language' as TsRes.QualifierName] = 'en-US' as TsRes.QualifierContextValue;
      context['currentTerritory' as TsRes.QualifierName] = 'US' as TsRes.QualifierContextValue;
      const result = tokens.partialContextToContextToken(context);
      expect(result).toSucceed();
      // Note: Order may vary, so we check both possible orders
      expect(result.value).toMatch(
        /^(language=en-US\|currentTerritory=US|currentTerritory=US\|language=en-US)$/
      );
    });

    test('converts empty context to empty token', () => {
      const context: TsRes.Context.IValidatedContextDecl = {};
      const result = tokens.partialContextToContextToken(context);
      expect(result).toSucceedWith('');
    });

    test('handles comma-separated values', () => {
      const context: TsRes.Context.IValidatedContextDecl = {};
      context['language' as TsRes.QualifierName] = 'en-US, de-DE' as TsRes.QualifierContextValue;
      const result = tokens.partialContextToContextToken(context);
      expect(result).toSucceedWith('language=en-US, de-DE');
    });
  });

  describe('static methods', () => {
    test('parseContextQualifierToken static method works', () => {
      const qualifier = qualifiers.validating.get('language').orThrow();
      const result = TsRes.Context.ContextTokens.parseContextQualifierToken('language=en-US', qualifiers);
      expect(result).toSucceedAndSatisfy((decl) => {
        expect(decl.qualifier).toBe(qualifier);
        expect(decl.value).toBe('en-US' as TsRes.QualifierContextValue);
      });
    });

    test('contextTokenToPartialContext static method works', () => {
      const result = TsRes.Context.ContextTokens.contextTokenToPartialContext(
        'language=en-US|currentTerritory=US',
        qualifiers
      );
      expect(result).toSucceedAndSatisfy((context) => {
        const expectedContext: TsRes.Context.IValidatedContextDecl = {};
        expectedContext['language' as TsRes.QualifierName] = 'en-US' as TsRes.QualifierContextValue;
        expectedContext['currentTerritory' as TsRes.QualifierName] = 'US' as TsRes.QualifierContextValue;
        expect(context).toEqual(expectedContext);
      });
    });

    test('partialContextToContextToken static method works', () => {
      const context: TsRes.Context.IValidatedContextDecl = {};
      context['language' as TsRes.QualifierName] = 'en-US' as TsRes.QualifierContextValue;
      const result = TsRes.Context.ContextTokens.partialContextToContextToken(context);
      expect(result).toSucceedWith('language=en-US');
    });
  });
});
