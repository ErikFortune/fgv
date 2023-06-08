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

import * as Iana from '../../iana';

import { Result, fail, succeed } from '@fgv/ts-utils';
import { ISubtags, subtagsToString } from '../common';
import { NormalizeTag } from '../normalization';
import { ITagValidator } from './baseValidator';
import { TagValidity } from './common';

/**
 * @internal
 */
export class IsInPreferredFromValidator implements ITagValidator {
  public readonly iana: Iana.LanguageRegistries;
  public readonly validity: TagValidity = 'valid';

  public constructor(iana?: Iana.LanguageRegistries) {
    /* c8 ignore next */
    this.iana = iana ?? Iana.DefaultRegistries.languageRegistries;
  }

  public validateSubtags(subtags: ISubtags): Result<true> {
    return NormalizeTag.toPreferred(subtags).onSuccess((preferred) => {
      const want = subtagsToString(preferred);
      const have = subtagsToString(subtags);
      if (want !== have) {
        return fail(`${have}: does not match preferred form ${want}`);
      }
      return succeed(true);
    });
  }
}
