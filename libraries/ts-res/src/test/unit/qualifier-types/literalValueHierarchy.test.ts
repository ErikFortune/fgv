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

type TestPlatform =
  | 'some_stb'
  | 'some_stb_variant'
  | 'other_stb'
  | 'ya_stb'
  | 'android'
  | 'ios'
  | 'androidtv'
  | 'appletv'
  | 'firetv'
  | 'webOs'
  | 'stb'
  | 'ctv'
  | 'mobile'
  | 'web';
const allTestPlatforms: TestPlatform[] = [
  'some_stb',
  'some_stb_variant',
  'other_stb',
  'ya_stb',
  'android',
  'ios',
  'androidtv',
  'appletv',
  'firetv',
  'webOs',
  'stb',
  'ctv',
  'mobile',
  'web'
];
const defaultHierarchy: TsRes.QualifierTypes.LiteralValueHierarchyDecl<TestPlatform> = {
  some_stb: 'stb',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  some_stb_variant: 'some_stb',
  other_stb: 'stb',
  ya_stb: 'stb',
  stb: 'ctv',
  android: 'mobile',
  ios: 'mobile',
  androidtv: 'ctv',
  appletv: 'ctv',
  firetv: 'ctv',
  webOs: 'ctv'
};

describe('LiteralValueHierarchy', () => {
  let values: TestPlatform[];
  let hierarchy: TsRes.QualifierTypes.LiteralValueHierarchyDecl<TestPlatform>;
  beforeEach(() => {
    values = Array.from(allTestPlatforms);
    hierarchy = { ...defaultHierarchy };
  });

  describe('create static method', () => {
    test('creates a new MatchHierarchy with no hierarchy', () => {
      expect(
        TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values
        })
      ).toSucceedAndSatisfy((h) => {
        for (const value of values) {
          expect(h.values.get(value)).toEqual({ name: value });
        }
      });
    });

    test('creates a new MatchHierarchy with an empty hierarchy', () => {
      expect(
        TsRes.QualifierTypes.LiteralValueHierarchy.create({
          values: values,
          hierarchy: {}
        })
      ).toSucceedAndSatisfy((h) => {
        for (const value of values) {
          expect(h.values.get(value)).toEqual({ name: value });
        }
      });
    });

    test('creates a new MatchHierarchy with a hierarchy', () => {
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values,
        hierarchy
      };
      expect(TsRes.QualifierTypes.LiteralValueHierarchy.create(init)).toSucceedAndSatisfy((h) => {
        let value = h.values.get('some_stb');
        expect(value).toBeDefined();
        if (value) {
          expect(value.name).toBe('some_stb');
          expect(value.parent?.name).toBe('stb');
          expect(value.children).toEqual(['some_stb_variant']);
        }

        value = h.values.get('stb');
        expect(value).toBeDefined();
        if (value) {
          expect(value.name).toBe('stb');
          expect(value.parent?.name).toBe('ctv');
          expect(value.children).toEqual(['some_stb', 'other_stb', 'ya_stb']);
        }
      });
    });

    test('fails if the hierarchy contains an invalid value', () => {
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values: values.slice(1), // remove 'some_stb'
        hierarchy
      };
      expect(TsRes.QualifierTypes.LiteralValueHierarchy.create(init)).toFailWith(/invalid literal value/i);
    });

    test('fails if the hierarchy refers to a non-existent parent', () => {
      // `mobile` is referenced from but not included in the default hierarchy
      values = values.filter((v) => v !== 'mobile');
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values,
        hierarchy
      };
      expect(TsRes.QualifierTypes.LiteralValueHierarchy.create(init)).toFailWith(
        /not a valid literal value/i
      );
    });

    test('fails if the hierarchy contains a circular reference', () => {
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values,
        hierarchy: {
          ...hierarchy,
          ctv: 'some_stb'
        }
      };
      expect(TsRes.QualifierTypes.LiteralValueHierarchy.create(init)).toFailWith(
        /circular reference detected/i
      );
    });
  });

  describe('match method', () => {
    let lvh: TsRes.QualifierTypes.LiteralValueHierarchy<TestPlatform>;

    beforeEach(() => {
      const init: TsRes.QualifierTypes.ILiteralValueHierarchyCreateParams<TestPlatform> = {
        values,
        hierarchy
      };
      lvh = TsRes.QualifierTypes.LiteralValueHierarchy.create(init).orThrow();
    });

    test('returns PerfectMatch for identical values', () => {
      expect(lvh.match('some_stb', 'some_stb')).toEqual(TsRes.PerfectMatch);
    });

    test('returns NoMatch for unrelated values', () => {
      expect(lvh.match('some_stb', 'web')).toEqual(TsRes.NoMatch);
      expect(lvh.match('some_stb', 'other_stb')).toEqual(TsRes.NoMatch);
    });

    test('returns partial match for related values', () => {
      const condition: TestPlatform = 'stb';
      const context: TestPlatform = 'some_stb';
      const score = lvh.match(condition, context);
      expect(score).toBeGreaterThan(TsRes.NoMatch);
      expect(score).toBeLessThan(TsRes.PerfectMatch);
    });

    test('returns decreasing match scores for deeper hierarchy levels', () => {
      const context: TestPlatform = 'some_stb_variant';

      const someStbScore = lvh.match(`some_stb`, context);
      expect(someStbScore).toBeGreaterThan(TsRes.NoMatch);
      expect(someStbScore).toBeLessThan(TsRes.PerfectMatch);

      const stbScore = lvh.match(`stb`, context);
      expect(stbScore).toBeGreaterThan(TsRes.NoMatch);
      expect(stbScore).toBeLessThan(someStbScore);
      expect(stbScore).toBeLessThan(TsRes.PerfectMatch);

      const ctvScore = lvh.match(`ctv`, context);
      expect(ctvScore).toBeGreaterThan(TsRes.NoMatch);
      expect(ctvScore).toBeLessThan(stbScore);
      expect(ctvScore).toBeLessThan(someStbScore);
      expect(ctvScore).toBeLessThan(TsRes.PerfectMatch);
    });
  });
});
