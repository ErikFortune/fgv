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
import { Converters, Model, Validate } from '../../../../src/iana/language-tag-extensions';

describe('language tag extension registry validators', () => {
  describe('extension singleton validator', () => {
    const v = Validate.extensionSingleton;
    const c = Converters.extensionSingleton;

    test.each(['a', 'c', 't', '1'])('%p is well-formed and canonical extension tag singleton', (tag) => {
      expect(v.isWellFormed(tag)).toBe(true);
      expect(v.converter.convert(tag)).toSucceedWith(tag as Model.ExtensionSingleton);
      expect(c.convert(tag)).toSucceedWith(tag as Model.ExtensionSingleton);

      expect(v.isCanonical(tag)).toBe(true);
      expect(v.toCanonical(tag)).toSucceedWith(tag as Model.ExtensionSingleton);
    });

    test.each(['E', 'F'])('%p is a well-formed non-canonical extension tag singleton', (code) => {
      expect(v.isWellFormed(code)).toBe(true);
      expect(v.converter.convert(code)).toSucceedWith(code as Model.ExtensionSingleton);
      expect(c.convert(code)).toSucceedWith(code as Model.ExtensionSingleton);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toSucceedWith(code.toLowerCase() as Model.ExtensionSingleton);
    });

    test.each(['x', 'X', '!'])('%p is not a well-formed or canonical extension tag singleton', (code) => {
      expect(v.isWellFormed(code)).toBe(false);
      expect(v.converter.convert(code)).toFailWith(/invalid.*singleton/i);
      expect(c.convert(code)).toFailWith(/invalid.*singleton/i);

      expect(v.isCanonical(code)).toBe(false);
      expect(v.toCanonical(code)).toFailWith(/invalid.*singleton/i);
    });
  });
});
