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
import { Converters } from '@fgv/ts-utils';
import * as TsRes from '../../../index';
import { TestQualifierType } from '../qualifier-types/testQualifierType';
import { ConditionCollector } from '../../../packlets/conditions';

// Phase B-2 cast-pressure regression tests for the typed Converter siblings.
//
// The point of these tests is that a consumer who supplies a literal-string
// qualifierName converter gets convert-time rejection of typo'd qualifier
// names AND a narrowed result type — without manual casts.
//
// The synthetic consumer is qualifierNameConverter, a Converter over the
// 'tone' | 'language' union. The default (untyped) Converter exports continue
// to accept any string for qualifierName, so the cast-pressure isolates to
// the typed sibling.
describe('Phase B-2 typed Converter siblings (cast-pressure regression)', () => {
  const validNames = ['tone', 'language'] as const;
  type ValidName = (typeof validNames)[number];
  const qualifierNameConverter = Converters.enumeratedValue<ValidName>(validNames);

  describe('typedConditionDecl', () => {
    test('accepts a declaration whose qualifierName is in the literal-string union', () => {
      const decl = { qualifierName: 'tone', value: 'formal' };
      const typedConverter = TsRes.Conditions.Convert.typedConditionDecl(qualifierNameConverter);
      expect(typedConverter.convert(decl)).toSucceedAndSatisfy((converted) => {
        // The narrowed return type is `IConditionDecl<'tone' | 'language'>`;
        // `qualifierName` is narrowed to `'tone' | 'language'`.
        const narrowed: ValidName = converted.qualifierName;
        expect(narrowed).toBe('tone');
        expect(converted.value).toBe('formal');
      });
    });

    test("rejects a typo'd qualifierName at convert time", () => {
      const decl = { qualifierName: 'tonr', value: 'formal' };
      const typedConverter = TsRes.Conditions.Convert.typedConditionDecl(qualifierNameConverter);
      expect(typedConverter.convert(decl)).toFailWith(/tonr/);
    });

    test('the untyped default conditionDecl accepts any string qualifierName', () => {
      // Documents the back-compat baseline: the default export still accepts
      // unknown names at convert time. The collector membership check
      // performed by `validatedConditionDecl` is the existing teeth at the
      // collector level; B-2 adds literal-set narrowing as an opt-in.
      const decl = { qualifierName: 'tonr', value: 'formal' };
      expect(TsRes.Conditions.Convert.conditionDecl.convert(decl)).toSucceedAndSatisfy((c) => {
        expect(c.qualifierName).toBe('tonr');
      });
    });
  });

  describe('typedValidatedConditionDecl', () => {
    let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
    let qualifiers: TsRes.Qualifiers.QualifierCollector;

    beforeAll(() => {
      qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
        qualifierTypes: [
          TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
          TsRes.QualifierTypes.LiteralQualifierType.create().orThrow(),
          new TestQualifierType()
        ]
      }).orThrow();
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          { name: 'tone', typeName: 'literal', defaultPriority: 500 },
          { name: 'language', typeName: 'language', defaultPriority: 600 }
        ]
      }).orThrow();
    });

    test('layers literal-string narrowing on top of the collector check', () => {
      const typedConverter = TsRes.Conditions.Convert.typedValidatedConditionDecl(qualifierNameConverter);

      // Valid qualifier in both the literal set AND the collector — succeeds.
      expect(typedConverter.convert({ qualifierName: 'tone', value: 'formal' }, { qualifiers })).toSucceed();

      // Typo'd qualifier — rejected at the typed-Converter level, before the
      // collector check ever runs.
      expect(typedConverter.convert({ qualifierName: 'tonr', value: 'formal' }, { qualifiers })).toFailWith(
        /tonr/
      );
    });
  });

  describe('typedConditionSetDecl (Conditions namespace, object form)', () => {
    test("rejects a typo'd qualifierName inside the conditions array", () => {
      const typedConverter = TsRes.Conditions.Convert.typedConditionSetDecl(qualifierNameConverter);
      const bad = {
        conditions: [{ qualifierName: 'tonr', value: 'formal' }]
      };
      expect(typedConverter.convert(bad)).toFailWith(/tonr/);
    });

    test('accepts a condition set whose qualifiers are all in the literal union', () => {
      const typedConverter = TsRes.Conditions.Convert.typedConditionSetDecl(qualifierNameConverter);
      const good = {
        conditions: [
          { qualifierName: 'tone', value: 'formal' },
          { qualifierName: 'language', value: 'en' }
        ]
      };
      expect(typedConverter.convert(good)).toSucceedAndSatisfy((cs) => {
        // Narrowed: cs.conditions[i].qualifierName is `'tone' | 'language'`.
        const names: ReadonlyArray<ValidName> = cs.conditions.map((c) => c.qualifierName);
        expect(names).toEqual(['tone', 'language']);
      });
    });
  });

  describe('typedValidatedConditionSetDecl', () => {
    let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;
    let qualifiers: TsRes.Qualifiers.QualifierCollector;
    let conditions: ConditionCollector;

    beforeEach(() => {
      qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
        qualifierTypes: [
          TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
          TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
        ]
      }).orThrow();
      qualifiers = TsRes.Qualifiers.QualifierCollector.create({
        qualifierTypes,
        qualifiers: [
          { name: 'tone', typeName: 'literal', defaultPriority: 500 },
          { name: 'language', typeName: 'language', defaultPriority: 600 }
        ]
      }).orThrow();
      conditions = TsRes.Conditions.ConditionCollector.create({ qualifiers }).orThrow();
    });

    test("rejects a typo'd qualifier in the set before the collector check", () => {
      const typedConverter = TsRes.Conditions.Convert.typedValidatedConditionSetDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({ conditions: [{ qualifierName: 'tonr', value: 'formal' }] }, { conditions })
      ).toFailWith(/tonr/);
    });

    test('succeeds when every qualifierName is in the literal union AND in the collector', () => {
      const typedConverter = TsRes.Conditions.Convert.typedValidatedConditionSetDecl(qualifierNameConverter);
      expect(
        typedConverter.convert({ conditions: [{ qualifierName: 'tone', value: 'formal' }] }, { conditions })
      ).toSucceed();
    });
  });
});
