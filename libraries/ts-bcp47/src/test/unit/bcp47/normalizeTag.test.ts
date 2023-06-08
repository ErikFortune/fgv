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

import * as Bcp47 from '../../../packlets/bcp47';

import { subtagsTestCases } from './commonTestCases';

describe('NormalizeTag helpers', () => {
  describe('normalization with subtags', () => {
    class NormalizeTagTestCase extends SimpleTagTestCaseBase<Bcp47.ISubtags> {
      public static get factory(): GenericTagTestCaseFactory<Bcp47.ISubtags, NormalizeTagTestCase> {
        return new GenericTagTestCaseFactory(NormalizeTagTestCase.create);
      }

      public static create(
        gtc: GenericLanguageTagTest<Bcp47.ISubtags>,
        which: TestKey
      ): NormalizeTagTestCase {
        return new NormalizeTagTestCase(gtc, which);
      }

      public invoke(): void {
        const normalization = this.options?.normalization ?? 'unknown';
        if (this.isSuccessTest) {
          expect(Bcp47.NormalizeTag.normalizeSubtags(this.from, normalization)).toSucceedAndSatisfy((lt) => {
            expect(Bcp47.subtagsToString(lt)).toEqual(this.expected);
          });

          if (normalization === 'preferred') {
            expect(Bcp47.NormalizeTag.toPreferred(this.from)).toSucceedAndSatisfy((lt) => {
              expect(Bcp47.subtagsToString(lt)).toEqual(this.expected);
            });
          } else if (normalization === 'canonical') {
            expect(Bcp47.NormalizeTag.toCanonical(this.from)).toSucceedAndSatisfy((lt) => {
              expect(Bcp47.subtagsToString(lt)).toEqual(this.expected);
            });
          }
        } else if (this.isFailureTest) {
          // check validation first as we aren't sure if the test expects validation or
          // normalization to fail.
          const validate = Bcp47.ValidateTag.validateSubtags(this.from, this.options?.validity ?? 'unknown');
          if (validate.isSuccess()) {
            expect(Bcp47.NormalizeTag.normalizeSubtags(this.from, normalization)).toFailWith(this.expected);

            if (normalization === 'preferred') {
              expect(Bcp47.NormalizeTag.toPreferred(this.from)).toFailWith(this.expected);
            } else if (normalization === 'canonical') {
              expect(Bcp47.NormalizeTag.toCanonical(this.from)).toFailWith(this.expected);
            }
          } else {
            expect(validate).toFailWith(this.expected);
          }
        }
      }
    }
    test.each(NormalizeTagTestCase.factory.emit(allTestKeys, subtagsTestCases))('%p', (__desc, tc) => {
      tc.invoke();
    });
  });

  describe('chooseNormalizer method', () => {
    test('returns a normalizer for the selected normalization level by default', () => {
      expect(Bcp47.NormalizeTag.chooseNormalizer('unknown')?.normalization).toBeUndefined();
      expect(Bcp47.NormalizeTag.chooseNormalizer('none')?.normalization).toBeUndefined();
      expect(Bcp47.NormalizeTag.chooseNormalizer('canonical')?.normalization).toBe('canonical');
      expect(Bcp47.NormalizeTag.chooseNormalizer('preferred')?.normalization).toBe('preferred');
    });

    test('chooses an upgrade if necessary or undefined if not', () => {
      expect(Bcp47.NormalizeTag.chooseNormalizer('unknown', 'unknown')?.normalization).toBeUndefined();
      expect(Bcp47.NormalizeTag.chooseNormalizer('unknown', 'none')?.normalization).toBeUndefined();
      expect(Bcp47.NormalizeTag.chooseNormalizer('unknown', 'canonical')?.normalization).toBeUndefined();
      expect(Bcp47.NormalizeTag.chooseNormalizer('unknown', 'preferred')?.normalization).toBeUndefined();

      expect(Bcp47.NormalizeTag.chooseNormalizer('none', 'unknown')?.normalization).toBeUndefined();
      expect(Bcp47.NormalizeTag.chooseNormalizer('none', 'none')?.normalization).toBeUndefined();
      expect(Bcp47.NormalizeTag.chooseNormalizer('none', 'canonical')?.normalization).toBeUndefined();
      expect(Bcp47.NormalizeTag.chooseNormalizer('none', 'preferred')?.normalization).toBeUndefined();

      expect(Bcp47.NormalizeTag.chooseNormalizer('canonical', 'unknown')?.normalization).toBe('canonical');
      expect(Bcp47.NormalizeTag.chooseNormalizer('canonical', 'none')?.normalization).toBe('canonical');
      expect(Bcp47.NormalizeTag.chooseNormalizer('canonical', 'canonical')?.normalization).toBeUndefined();
      expect(Bcp47.NormalizeTag.chooseNormalizer('canonical', 'preferred')?.normalization).toBeUndefined();

      expect(Bcp47.NormalizeTag.chooseNormalizer('preferred', 'unknown')?.normalization).toBe('preferred');
      expect(Bcp47.NormalizeTag.chooseNormalizer('preferred', 'none')?.normalization).toBe('preferred');
      expect(Bcp47.NormalizeTag.chooseNormalizer('preferred', 'canonical')?.normalization).toBe('preferred');
      expect(Bcp47.NormalizeTag.chooseNormalizer('preferred', 'preferred')?.normalization).toBeUndefined();
    });
  });
});
