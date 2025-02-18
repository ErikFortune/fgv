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

describe('qualifier converter', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;

  beforeAll(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
      ]
    }).orThrow();
  });

  describe('validatedQualifierDecl', () => {
    test('converts a qualifier declaration to a validated qualifier declaration', () => {
      const decl = { name: 'languages', typeName: 'language', defaultPriority: 600 };

      const qualifier = TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(decl, { qualifierTypes });
      expect(qualifier).toSucceedAndSatisfy((q) => {
        expect(q.name).toBe('languages');
        expect(q.type.name).toBe('language');
        expect(q.defaultPriority).toBe(600);
        expect(q.index).toBeUndefined();
      });
    });

    test('assigns and increments index if supplied', () => {
      const decl = { name: 'languages', typeName: 'language', defaultPriority: 600 };
      const context = { qualifierTypes, qualifierIndex: 2 };

      const qualifier = TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(decl, context);
      expect(qualifier).toSucceedAndSatisfy((q) => {
        expect(q.name).toBe('languages');
        expect(q.type.name).toBe('language');
        expect(q.defaultPriority).toBe(600);
        expect(q.index).toBe(2);
        expect(context.qualifierIndex).toBe(3);
      });
    });

    test('fails if the context is missing', () => {
      const decl = { name: 'languages', typeName: 'language', defaultPriority: 600 };

      const qualifier = TsRes.Qualifiers.Convert.validatedQualifierDecl.convert(decl);
      expect(qualifier).toFailWith(/validatedQualifierDecl converter requires a context/);
    });
  });

  describe('qualifier converter', () => {
    let qualifiers: TsRes.Qualifiers.QualifierCollector;

    beforeEach(() => {
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 },
          { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
          { name: 'language', typeName: 'language', defaultPriority: 600 }
        ]
      }).orThrow();
    });

    test('converts a string to the like named qualifier', () => {
      for (const [key, value] of qualifiers) {
        expect(TsRes.Qualifiers.Convert.qualifier.convert(key, { qualifiers })).toSucceedWith(value);
      }
    });

    test('converts a number to the qualifier at that index', () => {
      qualifiers.forEach((q, i) => {
        expect(TsRes.Qualifiers.Convert.qualifier.convert(i, { qualifiers })).toSucceedWith(q);
      });
    });

    test('fails if a string references an unknown qualifier', () => {
      expect(TsRes.Qualifiers.Convert.qualifier.convert('unknown', { qualifiers })).toFailWith(/unknown/);
    });

    test('fails if a number is out of range', () => {
      expect(TsRes.Qualifiers.Convert.qualifier.convert(qualifiers.size * 2, { qualifiers })).toFailWith(
        /out of range/
      );
    });

    test('fails if the input is not a string or number', () => {
      expect(TsRes.Qualifiers.Convert.qualifier.convert(true, { qualifiers })).toFailWith(
        /requires a string or number/
      );
    });

    test('fails if no context is supplied', () => {
      expect(TsRes.Qualifiers.Convert.qualifier.convert('literal')).toFailWith(/requires a context/);
    });
  });
});
