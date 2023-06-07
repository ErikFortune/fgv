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
import * as Converters from '../../../../../../src/iana/jar/language-subtags/tags/converters';
import {
  ExtLangSubtag,
  GrandfatheredTag,
  LanguageSubtag,
  RedundantTag,
  RegionSubtag,
  ScriptSubtag,
  VariantSubtag
} from '../../../../../../src/iana/jar/language-subtags/tags';
import { Validate } from '../../../../../../src/iana/jar/language-subtags/tags';

describe('Iana common validators', () => {
  describe('language subtag', () => {
    const v = Validate.languageSubtag;
    const c = Converters.languageSubtag;

    test.each(['en', 'enu', 'zh'])('%p is a well-formed canonical language subtag', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as LanguageSubtag);
      expect(c.convert(code)).toSucceedWith(code as LanguageSubtag);

      expect(v.isCanonical(code)).toBe(true);
      expect(v.toCanonical(code)).toSucceedWith(code as LanguageSubtag);
    });

    test.each(['EN', 'SpA', 'fR'])('%p is a well-formed non-canonical language subtag', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as LanguageSubtag);
      expect(c.convert(code)).toSucceedWith(code as LanguageSubtag);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toSucceedWith(code.toLowerCase() as LanguageSubtag);
    });

    test.each(['us1', 'Deutsch', 'f', '12'])(
      '%p is not a well-formed or canonical language subtag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(false);
        expect(v.converter.convert(code)).toFailWith(/invalid.*language subtag/i);
        expect(c.convert(code)).toFailWith(/invalid.*language subtag/i);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toFailWith(/invalid.*language subtag/i);
      }
    );
  });

  describe('extlang subtag', () => {
    const v = Validate.extlangSubtag;
    const c = Converters.extlangSubtag;

    test.each(['enu', 'cmn', 'yue'])('%p is a well-formed canonical extlang subtag', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as ExtLangSubtag);
      expect(c.convert(code)).toSucceedWith(code as ExtLangSubtag);

      expect(v.isCanonical(code)).toBe(true);
      expect(v.toCanonical(code)).toSucceedWith(code as ExtLangSubtag);
    });

    test.each(['ENU', 'SpA', 'DEu'])('%p is a well-formed non-canonical extlang subtag', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as ExtLangSubtag);
      expect(c.convert(code)).toSucceedWith(code as ExtLangSubtag);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toSucceedWith(code.toLowerCase() as ExtLangSubtag);
    });

    test.each(['us1', 'Deutsch', 'f', '123'])(
      '%p is not a well-formed or canonical extlang subtag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(false);
        expect(v.converter.convert(code)).toFailWith(/invalid.*extlang subtag/i);
        expect(c.convert(code)).toFailWith(/invalid.*extlang subtag/i);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toFailWith(/invalid.*extlang subtag/i);
      }
    );
  });

  describe('script subtag', () => {
    const v = Validate.scriptSubtag;
    const c = Converters.scriptSubtag;

    test.each(['Cyrl', 'Latn'])('%p is a well-formed canonical script subtag', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as ScriptSubtag);
      expect(c.convert(code)).toSucceedWith(code as ScriptSubtag);

      expect(v.isCanonical(code)).toBe(true);
      expect(v.toCanonical(code)).toSucceedWith(code as ScriptSubtag);
    });

    test.each([
      ['latn', 'Latn'],
      ['LATN', 'Latn'],
      ['cyrl', 'Cyrl']
    ])('%p is a well-formed non-canonical script subtag', (code, canonical) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as ScriptSubtag);
      expect(c.convert(code)).toSucceedWith(code as ScriptSubtag);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toSucceedWith(canonical as ScriptSubtag);
    });

    test.each(['001', 'abcde', 'AB1', '1ABC'])(
      '%p is not a well-formed or canonical script subtag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(false);
        expect(v.converter.convert(code)).toFailWith(/invalid.*script subtag/i);
        expect(c.convert(code)).toFailWith(/invalid.*script subtag/i);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toFailWith(/invalid.*script subtag/i);
      }
    );
  });

  describe('region subtag', () => {
    const v = Validate.regionSubtag;
    const c = Converters.regionSubtag;

    test.each(['CH', 'DE', 'US', '001', '419'])('%p is a well-formed canonical region subtag', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as RegionSubtag);
      expect(c.convert(code)).toSucceedWith(code as RegionSubtag);

      expect(v.isCanonical(code)).toBe(true);
      expect(v.toCanonical(code)).toSucceedWith(code as RegionSubtag);
    });

    test.each(['us', 'Jp', 'cA'])('%p is a well-formed non-canonical region subtag', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as RegionSubtag);
      expect(c.convert(code)).toSucceedWith(code as RegionSubtag);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toSucceedWith(code.toUpperCase() as RegionSubtag);
    });

    test.each(['0001', 'abcde', 'AB1', '1ABC'])(
      '%p is not a well-formed or canonical region subtag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(false);
        expect(v.converter.convert(code)).toFailWith(/invalid.*region subtag/i);
        expect(c.convert(code)).toFailWith(/invalid.*region subtag/i);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toFailWith(/invalid.*region subtag/i);
      }
    );
  });

  describe('variant subtag', () => {
    const v = Validate.variantSubtag;
    const c = Converters.variantSubtag;

    test.each(['1920', 'variant', '1920de', 'varia', 'varian', 'variantx', 'variant8'])(
      '%p is a well-formed canonical variant subtag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(true);
        expect(v.converter.convert(code)).toSucceedWith(code as VariantSubtag);
        expect(c.convert(code)).toSucceedWith(code as VariantSubtag);

        expect(v.isCanonical(code)).toBe(true);
        expect(v.toCanonical(code)).toSucceedWith(code as VariantSubtag);
      }
    );

    test.each(['Variant', '1920DE'])('%p is a well-formed non-canonical variant subtag', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as VariantSubtag);
      expect(c.convert(code)).toSucceedWith(code as VariantSubtag);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toSucceedWith(code.toLowerCase() as VariantSubtag);
    });

    test.each(['l', 'la', 'lat', 'latin-variant', 'longVariant'])(
      '%p is not a well-formed or variant subtag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(false);
        expect(v.converter.convert(code)).toFailWith(/invalid.*variant subtag/i);
        expect(c.convert(code)).toFailWith(/invalid.*variant subtag/i);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toFailWith(/invalid.*variant subtag/i);
      }
    );
  });

  describe('grandfathered tag', () => {
    const v = Validate.grandfatheredTag;
    const c = Converters.grandfatheredTag;

    test.each(['art-lojban', 'en-GB-oed', 'i-klingon', 'sgn-BE-FR', 'zh-min-nan'])(
      '%p is a well-formed grandfathered tag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(true);
        expect(v.converter.convert(code)).toSucceedWith(code as GrandfatheredTag);
        expect(c.convert(code)).toSucceedWith(code as GrandfatheredTag);

        expect(v.isCanonical(code)).toBe(true);
        expect(v.toCanonical(code)).toSucceedWith(code as GrandfatheredTag);
      }
    );

    test.each([
      ['en-gb-oed', 'en-GB-oed'],
      ['i-Klingon', 'i-klingon'],
      ['SGN-BE-FR', 'sgn-BE-FR'],
      ['sgn-be-nl', 'sgn-BE-NL'],
      ['zh-min-Nan', 'zh-min-nan']
    ])('%p is a well-formed non-canonical grandfathered tag', (code, canonical) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as GrandfatheredTag);
      expect(c.convert(code)).toSucceedWith(code as GrandfatheredTag);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toSucceedWith(canonical as GrandfatheredTag);
    });

    test.each(['*$!', 'this-that!', 'en-us+something'])(
      '%p is not a well-formed or grandfathered tag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(false);
        expect(v.converter.convert(code)).toFailWith(/invalid.*grandfathered tag/i);
        expect(c.convert(code)).toFailWith(/invalid.*grandfathered tag/i);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toFailWith(/invalid.*grandfathered tag/i);
      }
    );
  });

  describe('redundant tag', () => {
    const v = Validate.redundantTag;
    const c = Converters.redundantTag;

    test.each(['art-lojban', 'en-GB-oed', 'i-klingon', 'sgn-BE-FR', 'zh-min-nan'])(
      '%p is a well-formed redundant tag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(true);
        expect(v.converter.convert(code)).toSucceedWith(code as RedundantTag);
        expect(c.convert(code)).toSucceedWith(code as RedundantTag);

        expect(v.isCanonical(code)).toBe(true);
        expect(v.toCanonical(code)).toSucceedWith(code as RedundantTag);
      }
    );

    test.each([
      ['en-gb-oed', 'en-GB-oed'],
      ['i-Klingon', 'i-klingon'],
      ['SGN-BE-FR', 'sgn-BE-FR'],
      ['sgn-be-nl', 'sgn-BE-NL'],
      ['zh-min-Nan', 'zh-min-nan']
    ])('%p is a well-formed non-canonical redundant tag', (code, canonical) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as RedundantTag);
      expect(c.convert(code)).toSucceedWith(code as RedundantTag);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toSucceedWith(canonical as RedundantTag);
    });

    test.each(['*$!', 'this-that!', 'en-us+something'])(
      '%p is not a well-formed or redundant tag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(false);
        expect(v.converter.convert(code)).toFailWith(/invalid.*redundant tag/i);
        expect(c.convert(code)).toFailWith(/invalid.*redundant tag/i);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toFailWith(/invalid.*redundant tag/i);
      }
    );
  });
});
