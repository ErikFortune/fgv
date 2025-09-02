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
import { mapResults } from '@fgv/ts-utils';

describe('QualifierTypeCollector', () => {
  describe('create static method', () => {
    test('creates a new empty QualifierTypeCollector by default', () => {
      expect(TsRes.QualifierTypes.QualifierTypeCollector.create()).toSucceedAndSatisfy((q) => {
        expect(q).toBeInstanceOf(TsRes.QualifierTypes.QualifierTypeCollector);
        expect(q.size).toBe(0);
      });
    });

    test('creates a new QualifierTypeCollector with specified values', () => {
      const qualifierTypes = mapResults<TsRes.QualifierTypes.QualifierType>([
        TsRes.QualifierTypes.LanguageQualifierType.create(),
        TsRes.QualifierTypes.TerritoryQualifierType.create(),
        TsRes.QualifierTypes.LiteralQualifierType.create()
      ]).orThrow();
      expect(TsRes.QualifierTypes.QualifierTypeCollector.create({ qualifierTypes })).toSucceedAndSatisfy(
        (q) => {
          expect(q).toBeInstanceOf(TsRes.QualifierTypes.QualifierTypeCollector);
          expect(q.size).toBe(qualifierTypes.length);
          qualifierTypes.forEach((qt, index) => {
            expect(q.getAt(index)).toSucceedWith(qt);
            expect(q.get(qt.key)).toSucceedWith(qt);
          });
        }
      );
    });

    test('fails if the supplied values are invalid', () => {
      const qualifierTypes = mapResults<TsRes.QualifierTypes.QualifierType>([
        TsRes.QualifierTypes.LanguageQualifierType.create(),
        TsRes.QualifierTypes.TerritoryQualifierType.create(),
        TsRes.QualifierTypes.LiteralQualifierType.create(),
        TsRes.QualifierTypes.LanguageQualifierType.create()
      ]).orThrow();
      expect(TsRes.QualifierTypes.QualifierTypeCollector.create({ qualifierTypes })).toFailWith(
        /already exists/i
      );
    });
  });

  describe('getOrAdd', () => {
    let collector: TsRes.QualifierTypes.QualifierTypeCollector;
    let qt: TsRes.QualifierTypes.QualifierType;

    beforeEach(() => {
      collector = TsRes.QualifierTypes.QualifierTypeCollector.create().orThrow();
      qt = TsRes.QualifierTypes.LiteralQualifierType.create().orThrow();
    });

    test('adds a new qualifier type to the collector', () => {
      expect(collector.validating.getOrAdd('literal', qt)).toSucceedWith(qt);
      expect(collector.size).toBe(1);
      expect(collector.validating.get('literal')).toSucceedWith(qt);
    });

    test('fails if the type name is invalid', () => {
      expect(collector.validating.getOrAdd("this simply won't do", qt)).toFailWith(
        /not a valid qualifier type name/i
      );
    });

    test('fails if the value to be added is not a qualifier type', () => {
      expect(collector.validating.getOrAdd('literal', {})).toFailWith(/not a QualifierType/i);
    });

    test('fails if key does not match the key of the value to be added', () => {
      expect(
        collector.validating.getOrAdd('literal', () => TsRes.QualifierTypes.TerritoryQualifierType.create())
      ).toFailWith(/key mismatch/i);
      expect(
        collector.validating.getOrAdd(
          'literal',
          TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow()
        )
      ).toFailWith(/key mismatch/i);
    });
  });
});
