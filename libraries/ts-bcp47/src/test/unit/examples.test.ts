/*
 * Copyright (c) 2022 Erik Fortune
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
import * as Bcp47 from '../../packlets/bcp47';

describe('README examples recast to jest tests', () => {
  describe('tl;dr examples', () => {
    test('parse a tag to extract primary language and region', () => {
      expect(() => {
        const { primaryLanguage, region } = Bcp47.tag('en-us').orThrow().subtags;
        expect(primaryLanguage).toBe('en');
        expect(region).toBe('us');
      }).not.toThrow();
    });

    test('parse a tag to extract primary language and region in canonical form', () => {
      expect(() => {
        const { primaryLanguage, region } = Bcp47.tag('en-us', { normalization: 'canonical' }).orThrow()
          .subtags;
        expect(primaryLanguage).toBe('en');
        expect(region).toBe('US');
      }).not.toThrow();
    });

    test('normalize a tag to fully-preferred form', () => {
      expect(() => {
        const preferred = Bcp47.tag('art-lojban', { normalization: 'preferred' }).orThrow().tag;
        expect(preferred).toBe('jbo');
      }).not.toThrow();
    });

    test('tags match regardless of case', () => {
      expect(() => {
        expect(Bcp47.similarity('es-MX', 'es-mx')).toSucceedWith(1.0);
      }).not.toThrow();
    });

    test('suppressed script matches explicit script', () => {
      expect(() => {
        expect(Bcp47.similarity('es-MX', 'es-latn-mx')).toSucceedWith(1.0);
      }).not.toThrow();
    });

    test('macro-region matches contained region well', () => {
      expect(() => {
        expect(Bcp47.similarity('es-419', 'es-MX')).toSucceedWith(0.65);
        expect(Bcp47.similarity('es-419', 'es-ES')).toSucceedWith(0.3);
      }).not.toThrow();
    });

    test('region matches neutral fairly well', () => {
      expect(() => {
        expect(Bcp47.similarity('es', 'es-MX')).toSucceedWith(0.5);
      }).not.toThrow();
    });

    test('unlike tags do not match', () => {
      expect(() => {
        expect(Bcp47.similarity('en', 'es')).toSucceedWith(0.0);
      }).not.toThrow();
    });

    test('different scripts do not match', () => {
      expect(() => {
        expect(Bcp47.similarity('zh-Hans', 'zh-Hant')).toSucceedWith(0.0);
      }).not.toThrow();
    });
  });

  describe('validation examples', () => {
    test('eng-US', () => {
      const tag = Bcp47.tag('eng-US').orDefault();
      expect(tag).toBeDefined();
      expect(tag!.isValid).toBe(false);
    });

    test('en-US', () => {
      const tag = Bcp47.tag('en-US').orDefault();
      expect(tag).toBeDefined();
      expect(tag!.isValid).toBe(true);
    });

    test('es-valencia-valencia', () => {
      const tag = Bcp47.tag('es-valencia-valencia').orDefault();
      expect(tag).toBeDefined();
      expect(tag?.isValid).toBe(false);
    });

    test('es-valencia', () => {
      const tag = Bcp47.tag('es-valencia').orDefault();
      expect(tag).toBeDefined();
      expect(tag!.isValid).toBe(true);
      expect(tag!.isStrictlyValid).toBe(false);
    });

    test('ca-valencia', () => {
      const tag = Bcp47.tag('ca-valencia').orDefault();
      expect(tag).toBeDefined();
      expect(tag!.isValid).toBe(true);
      expect(tag!.isStrictlyValid).toBe(true);
    });
  });

  describe('normalization examples', () => {
    test('zh-cmn-hans', () => {
      const tag = Bcp47.tag('zh-cmn-hans').orDefault();
      expect(tag).toBeDefined();
      expect(tag!.isStrictlyValid).toBe(true);
      expect(tag!.isCanonical).toBe(false);
    });

    test('zh-cmn-Hans', () => {
      const tag = Bcp47.tag('zh-cmn-Hans').orDefault();
      expect(tag).toBeDefined();
      expect(tag!.isStrictlyValid).toBe(true);
      expect(tag!.isCanonical).toBe(true);
      expect(tag!.isPreferred).toBe(false);
    });

    test('cmn-Hans', () => {
      const tag = Bcp47.tag('cmn-Hans').orDefault();
      expect(tag).toBeDefined();
      expect(tag!.isStrictlyValid).toBe(true);
      expect(tag!.isCanonical).toBe(true);
      expect(tag!.isPreferred).toBe(true);
    });

    test('en-latn-us', () => {
      const tag = Bcp47.tag('en-latn-us').orDefault();
      expect(tag).toBeDefined();
      expect(tag!.isStrictlyValid).toBe(true);
      expect(tag!.isCanonical).toBe(false);
    });

    test('en-Latn-US', () => {
      const tag = Bcp47.tag('en-Latn-US').orDefault();
      expect(tag).toBeDefined();
      expect(tag!.isStrictlyValid).toBe(true);
      expect(tag!.isCanonical).toBe(true);
      expect(tag!.isPreferred).toBe(false);
    });

    test('en-US', () => {
      const tag = Bcp47.tag('en-US').orDefault();
      expect(tag).toBeDefined();
      expect(tag!.isStrictlyValid).toBe(true);
      expect(tag!.isCanonical).toBe(true);
      expect(tag!.isPreferred).toBe(true);
    });
  });
});
