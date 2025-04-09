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

describe('context converters', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
  let qualifiers: TsRes.Qualifiers.QualifierCollector;

  beforeAll(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
      ]
    }).orThrow();

    const qualifierDecls: TsRes.Qualifiers.IQualifierDecl[] = [
      { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 },
      { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
      { name: 'language', typeName: 'language', defaultPriority: 600 }
    ];
    qualifiers = TsRes.Qualifiers.QualifierCollector.create({
      qualifierTypes,
      qualifiers: qualifierDecls
    }).orThrow();
  });

  describe('validatedContextQualifierValueDecl', () => {
    test('converts a context qualifier value declaration to a validated context qualifier value declaration', () => {
      const decl = { qualifier: 'homeTerritory', value: 'CA' };
      const contextQualifierValue = TsRes.Context.Convert.validatedContextQualifierValueDecl.convert(decl, {
        qualifiers
      });
      expect(contextQualifierValue).toSucceedAndSatisfy((c) => {
        expect(c.qualifier).toEqual('homeTerritory');
        expect(c.value).toEqual('CA');
      });
    });

    test('fails if the qualifier is not found', () => {
      const decl = { qualifier: 'unknownQualifier', value: 'CA' };
      const contextQualifierValue = TsRes.Context.Convert.validatedContextQualifierValueDecl.convert(decl, {
        qualifiers
      });
      expect(contextQualifierValue).toFailWith(/not found/);
    });

    test('fails if the value is invalid', () => {
      const decl = { qualifier: 'homeTerritory', value: 'invalidValue' };
      const contextQualifierValue = TsRes.Context.Convert.validatedContextQualifierValueDecl.convert(decl, {
        qualifiers
      });
      expect(contextQualifierValue).toFailWith(/invalid context value/);
    });

    test('fails if the context is not provided', () => {
      const decl = { qualifier: 'homeTerritory', value: 'CA' };
      const contextQualifierValue = TsRes.Context.Convert.validatedContextQualifierValueDecl.convert(decl);
      expect(contextQualifierValue).toFailWith(
        /validatedContextQualifierValueDecl converter requires a context/
      );
    });

    test('fails if the supplied value is not well-formed', () => {
      const decl = { test: 123 };
      const contextQualifierValue = TsRes.Context.Convert.validatedContextQualifierValueDecl.convert(decl, {
        qualifiers
      });
      expect(contextQualifierValue).toFailWith(/value not found/);
    });
  });

  describe('validatedContextDecl', () => {
    test('converts a context declaration to a validated context declaration', () => {
      const decl = { homeTerritory: 'CA', currentTerritory: 'US' };
      const context = TsRes.Context.Convert.validatedContextDecl.convert(decl, { qualifiers });
      expect(context).toSucceedAndSatisfy((c) => {
        expect(c).toEqual(decl);
      });
    });

    test('fails if the context has an unknown qualifier', () => {
      const decl = { homeTerritory: 'CA', unknown: 'also CA' };
      const context = TsRes.Context.Convert.validatedContextDecl.convert(decl, { qualifiers });
      expect(context).toFailWith(/not found/);
    });

    test('fails if the context has an invalid value', () => {
      const decl = { homeTerritory: 'CA', currentTerritory: 'also CA' };
      const context = TsRes.Context.Convert.validatedContextDecl.convert(decl, { qualifiers });
      expect(context).toFailWith(/invalid context value/);
    });

    test('fails if the context is not provided', () => {
      const decl = { homeTerritory: 'CA', currentTerritory: 'US' };
      const context = TsRes.Context.Convert.validatedContextDecl.convert(decl);
      expect(context).toFailWith(/validatedContextDecl converter requires a context/);
    });

    test('fails if the supplied context is not well-formed', () => {
      const decl = { test: 123 };
      const context = TsRes.Context.Convert.validatedContextDecl.convert(decl, { qualifiers });
      expect(context).toFailWith(/not a string/i);
    });
  });
});
