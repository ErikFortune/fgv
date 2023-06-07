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

import {
  GenericLanguageTagTest,
  GenericTagTestCaseFactory,
  SimpleTagTestCaseBase,
  TestKey,
  allTestKeys
} from './languageTagHelpers';

import { Subtags } from '../../../src/bcp47';
import { ValidateTag } from '../../../src/bcp47';
import { subtagsTestCases } from './commonTestCases';

describe('ValidateTag helpers', () => {
  describe('validation with subtags', () => {
    class ValidateTagTestCase extends SimpleTagTestCaseBase<Subtags> {
      public static get factory(): GenericTagTestCaseFactory<Subtags, ValidateTagTestCase> {
        return new GenericTagTestCaseFactory(ValidateTagTestCase.create);
      }

      public static create(gtc: GenericLanguageTagTest<Subtags>, which: TestKey): ValidateTagTestCase {
        return new ValidateTagTestCase(gtc, which);
      }

      public invoke(): void {
        const validity = this.options?.validity ?? 'unknown';
        if (typeof this.expected === 'string') {
          expect(ValidateTag.validateSubtags(this.from, validity)).toSucceed();

          if (validity === 'strictly-valid') {
            expect(ValidateTag.isStrictlyValid(this.from)).toBe(true);
          } else if (validity === 'valid') {
            expect(ValidateTag.isValid(this.from)).toBe(true);
          } else {
            expect(ValidateTag.isWellFormed(this.from)).toBe(true);
          }
        } else if (this.expected instanceof RegExp) {
          expect(ValidateTag.validateSubtags(this.from, validity)).toFailWith(this.expected);

          if (validity === 'strictly-valid') {
            expect(ValidateTag.isStrictlyValid(this.from)).toBe(false);
          } else if (validity === 'valid') {
            expect(ValidateTag.isValid(this.from)).toBe(false);
          } else {
            expect(ValidateTag.isWellFormed(this.from)).toBe(false);
          }
        }
      }

      protected _getSuccessTestDescription(which: TestKey, from: Subtags, description: string): string {
        const fromDesc = JSON.stringify(from, undefined, 2);
        return `${which} succeeds for "${description}" (${fromDesc})`;
      }
    }
    test.each(ValidateTagTestCase.factory.emit(allTestKeys, subtagsTestCases))('%p', (_desc, tc) => {
      tc.invoke();
    });
  });

  describe('chooseValidator method', () => {
    test('returns a validator for the selected validity level by default', () => {
      expect(ValidateTag.chooseValidator('unknown')?.validity).toBe('well-formed');
      expect(ValidateTag.chooseValidator('well-formed')?.validity).toBe('well-formed');
      expect(ValidateTag.chooseValidator('valid')?.validity).toBe('valid');
      expect(ValidateTag.chooseValidator('strictly-valid')?.validity).toBe('strictly-valid');
    });

    test('chooses an upgrade if necessary or undefined if not', () => {
      expect(ValidateTag.chooseValidator('unknown', 'unknown')?.validity).toBeUndefined();
      expect(ValidateTag.chooseValidator('unknown', 'well-formed')?.validity).toBeUndefined();
      expect(ValidateTag.chooseValidator('unknown', 'valid')?.validity).toBeUndefined();
      expect(ValidateTag.chooseValidator('unknown', 'strictly-valid')?.validity).toBeUndefined();

      expect(ValidateTag.chooseValidator('well-formed', 'unknown')?.validity).toBe('well-formed');
      expect(ValidateTag.chooseValidator('well-formed', 'well-formed')?.validity).toBeUndefined();
      expect(ValidateTag.chooseValidator('well-formed', 'valid')?.validity).toBeUndefined();
      expect(ValidateTag.chooseValidator('well-formed', 'strictly-valid')?.validity).toBeUndefined();

      expect(ValidateTag.chooseValidator('valid', 'unknown')?.validity).toBe('valid');
      expect(ValidateTag.chooseValidator('valid', 'well-formed')?.validity).toBe('valid');
      expect(ValidateTag.chooseValidator('valid', 'valid')?.validity).toBeUndefined();
      expect(ValidateTag.chooseValidator('valid', 'strictly-valid')?.validity).toBeUndefined();

      expect(ValidateTag.chooseValidator('strictly-valid', 'unknown')?.validity).toBe('strictly-valid');
      expect(ValidateTag.chooseValidator('strictly-valid', 'well-formed')?.validity).toBe('strictly-valid');
      expect(ValidateTag.chooseValidator('strictly-valid', 'valid')?.validity).toBe('strictly-valid');
      expect(ValidateTag.chooseValidator('strictly-valid', 'strictly-valid')?.validity).toBeUndefined();
    });
  });
});
