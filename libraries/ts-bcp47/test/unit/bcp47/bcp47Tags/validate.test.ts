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
import { Converters, Model, Validate } from '../../../../src/bcp47/bcp47Subtags';

describe('language tag extension registry validators', () => {
  describe('extension subtag validator', () => {
    const v = Validate.extensionSubtag;
    const c = Converters.extensionSubtag;

    test.each(['ab', 'abc', 'abcd', 'abcde', 'abcdef', 'abcdefg', 'abcdefgh', '2020', '2020a', 'a2020'])(
      '%p is well-formed and canonical extension subtag',
      (tag) => {
        expect(v.isWellFormed(tag)).toBe(true);
        expect(v.converter.convert(tag)).toSucceedWith(tag as Model.ExtensionSubtag);
        expect(c.convert(tag)).toSucceedWith(tag as Model.ExtensionSubtag);

        expect(v.isCanonical(tag)).toBe(true);
        expect(v.toCanonical(tag)).toSucceedWith(tag as Model.ExtensionSubtag);
      }
    );

    test.each(['AB', 'Abc', 'abcD', 'abCde', 'AbcdeF', 'ABCDEFG', 'Abcdefgh', '2020A', 'A2020'])(
      '%p is a well-formed non-canonical extension subtag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(true);
        expect(v.converter.convert(code)).toSucceedWith(code as Model.ExtensionSubtag);
        expect(c.convert(code)).toSucceedWith(code as Model.ExtensionSubtag);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toSucceedWith(code.toLowerCase() as Model.ExtensionSubtag);
      }
    );

    test.each(['x', 'X', 'u', 'bad!', 'tooTooLong'])(
      '%p is not a well-formed or canonical extension subtag',
      (code) => {
        expect(v.isWellFormed(code)).toBe(false);
        expect(v.converter.convert(code)).toFailWith(/invalid.*extension subtag/i);
        expect(c.convert(code)).toFailWith(/invalid.*extension subtag/i);

        expect(v.isCanonical(code)).toBe(false);
        expect(v.toCanonical(code)).toFailWith(/invalid.*extension subtag/i);
      }
    );
  });

  describe('private-use prefix validator', () => {
    const v = Validate.privateUsePrefix;
    const c = Converters.privateUsePrefix;

    test.each(['x'])('%p is well-formed and canonical private-use prefix', (tag) => {
      expect(v.isWellFormed(tag)).toBe(true);
      expect(v.converter.convert(tag)).toSucceedWith(tag as Model.PrivateUsePrefix);
      expect(c.convert(tag)).toSucceedWith(tag as Model.PrivateUsePrefix);

      expect(v.isCanonical(tag)).toBe(true);
      expect(v.toCanonical(tag)).toSucceedWith(tag as Model.PrivateUsePrefix);
    });

    test.each(['X'])('%p is a well-formed non-canonical private-use-prefix', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as Model.PrivateUsePrefix);
      expect(c.convert(code)).toSucceedWith(code as Model.PrivateUsePrefix);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toSucceedWith(code.toLowerCase() as Model.PrivateUsePrefix);
    });

    test.each(['u', 'bad!', '1'])('%p is not a well-formed or canonical private-use prefix', (code) => {
      expect(v.isWellFormed(code)).toBe(false);
      expect(v.converter.convert(code)).toFailWith(/invalid.*private-use prefix/i);
      expect(c.convert(code)).toFailWith(/invalid.*private-use prefix/i);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toFailWith(/invalid.*private-use prefix/i);
    });
  });
});
