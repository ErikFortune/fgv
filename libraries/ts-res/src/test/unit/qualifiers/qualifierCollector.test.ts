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

describe('QualifierCollector class', () => {
  let qualifierTypes: TsRes.QualifierTypes.QualifierTypeCollector;

  beforeEach(() => {
    qualifierTypes = TsRes.QualifierTypes.QualifierTypeCollector.create({
      qualifierTypes: [
        TsRes.QualifierTypes.LanguageQualifierType.create().orThrow(),
        TsRes.QualifierTypes.TerritoryQualifierType.create().orThrow(),
        TsRes.QualifierTypes.LiteralQualifierType.create().orThrow()
      ]
    }).orThrow();
  });

  describe('create static method', () => {
    test('creates an empty QualifierCollector by default', () => {
      expect(TsRes.Qualifiers.QualifierCollector.create({ qualifierTypes })).toSucceedAndSatisfy((qc) => {
        expect(qc.size).toBe(0);
        expect(qc.qualifierTypes).toBe(qualifierTypes);
      });
    });

    test('creates a QualifierCollector with initial qualifiers from supplied declarations', () => {
      expect(
        TsRes.Qualifiers.QualifierCollector.create({
          qualifierTypes,
          qualifiers: [
            { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 },
            { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
            { name: 'language', typeName: 'language', defaultPriority: 600 }
          ]
        })
      ).toSucceedAndSatisfy((qc) => {
        expect(qc.size).toBe(3);
        expect(qc.qualifierTypes).toBe(qualifierTypes);
        expect(qc.validating.get('homeTerritory')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('homeTerritory');
          expect(q.type.name).toBe('territory');
          expect(q.defaultPriority).toBe(800);
        });
        expect(qc.validating.get('currentTerritory')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('currentTerritory');
          expect(q.type.name).toBe('territory');
          expect(q.defaultPriority).toBe(700);
        });
        expect(qc.validating.get('language')).toSucceedAndSatisfy((q) => {
          expect(q.name).toBe('language');
          expect(q.type.name).toBe('language');
          expect(q.defaultPriority).toBe(600);
        });
      });
    });

    test('fails if any of the supplied qualifiers specify an unknown qualifier type', () => {
      expect(
        TsRes.Qualifiers.QualifierCollector.create({
          qualifierTypes,
          qualifiers: [
            { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 },
            { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
            { name: 'language', typeName: 'language', defaultPriority: 600 },
            { name: 'bogus', typeName: 'invalid', defaultPriority: 500 }
          ]
        })
      ).toFailWith(/not found/i);
    });

    test('fails if any of the supplied qualifiers specify an invalid priority', () => {
      expect(
        TsRes.Qualifiers.QualifierCollector.create({
          qualifierTypes,
          qualifiers: [
            { name: 'homeTerritory', typeName: 'territory', defaultPriority: 1000000 },
            { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
            { name: 'language', typeName: 'language', defaultPriority: 600 }
          ]
        })
      ).toFailWith(/not a valid priority/i);
    });

    test('fails if there are duplicate qualifiers', () => {
      expect(
        TsRes.Qualifiers.QualifierCollector.create({
          qualifierTypes,
          qualifiers: [
            { name: 'homeTerritory', typeName: 'territory', defaultPriority: 900 },
            { name: 'currentTerritory', typeName: 'territory', defaultPriority: 700 },
            { name: 'language', typeName: 'language', defaultPriority: 600 },
            { name: 'homeTerritory', typeName: 'territory', defaultPriority: 800 }
          ]
        })
      ).toFailWith(/already exists/i);
    });
  });

  describe('validating getOrAdd method', () => {
    test('adds a new qualifier from a declaration if it does not already exist', () => {
      const qc = TsRes.Qualifiers.QualifierCollector.create({ qualifierTypes }).orThrow();
      expect(qc.size).toBe(0);
      expect(
        qc.validating.getOrAdd('someTerritory', {
          name: 'someTerritory',
          typeName: 'territory',
          defaultPriority: 800
        })
      ).toSucceedAndSatisfy((q) => {
        expect(q.name).toBe('someTerritory');
        expect(q.type.name).toBe('territory');
        expect(q.defaultPriority).toBe(800);
        expect(qc.size).toBe(1);
      });
    });

    test('returns an existing qualifier for a declaration', () => {
      const decl = { name: 'someTerritory', typeName: 'territory', defaultPriority: 800 };
      const qc = TsRes.Qualifiers.QualifierCollector.create({ qualifierTypes }).orThrow();
      expect(qc.size).toBe(0);
      const q = qc.validating.getOrAdd('someTerritory', decl).orThrow();
      expect(qc.size).toBe(1);
      expect(qc.validating.getOrAdd('someTerritory', decl)).toSucceedAndSatisfy((q2) => {
        expect(q2).toBe(q);
        expect(qc.size).toBe(1);
      });
    });
  });
});
