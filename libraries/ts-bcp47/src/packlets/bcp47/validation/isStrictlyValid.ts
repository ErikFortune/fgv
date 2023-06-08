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

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { ISubtags, subtagsToString } from '../common';
import { NormalizeTag, TagNormalization } from '../normalization';

import { TagValidity } from './common';
import { IsValidValidator } from './isValid';

/**
 * @internal
 */
export class IsStrictlyValidValidator extends IsValidValidator {
  public validity: TagValidity = 'strictly-valid';
  public normalization: TagNormalization = 'unknown';

  protected _checkExtlangs(subtags: ISubtags): Result<Iana.LanguageSubtags.ExtLangSubtag[] | undefined> {
    if (subtags.extlangs) {
      return super._checkExtlangs(subtags).onSuccess(() => this._validateExtlangPrefix(subtags));
    }
    return succeed(undefined);
  }

  protected _checkVariants(subtags: ISubtags): Result<Iana.LanguageSubtags.VariantSubtag[] | undefined> {
    if (subtags.variants) {
      return super._checkVariants(subtags).onSuccess((v) => this._validateVariantPrefix(subtags, v!));
    }
    return succeed(undefined);
  }

  protected _validateExtlangPrefix(
    subtags: Readonly<ISubtags>
  ): Result<Iana.LanguageSubtags.ExtLangSubtag[] | undefined> {
    if (subtags.extlangs) {
      const prefix = this.iana.subtags.languages.toCanonical(subtags.primaryLanguage).orDefault();
      if (!prefix) {
        return fail('missing primary language for extlang prefix validation.');
      }

      return mapResults(
        subtags.extlangs.map((extlang) => {
          const def = this.iana.subtags.extlangs.tryGet(extlang);
          /* c8 ignore next 3 - should never happen due to guards earlier in conversion */
          if (!def) {
            return fail(`invalid extlang subtag "${extlang}" (not registered).`);
          }
          if (prefix !== def.prefix) {
            return fail(
              `invalid prefix "${prefix}" for extlang subtag ${extlang} (expected "${def.prefix}").`
            );
          }
          return succeed(extlang);
        })
      );
    }
    /* c8 ignore next 2 - should be caught in the caller */
    return succeed(undefined);
  }

  protected _validateVariantPrefix(
    subtags: Readonly<ISubtags>,
    variants: Iana.LanguageSubtags.VariantSubtag[]
  ): Result<Iana.LanguageSubtags.VariantSubtag[] | undefined> {
    const { primaryLanguage, extlangs, script, region } = subtags;
    const nonCanonical = { primaryLanguage, extlangs, script, region };
    const canonical = NormalizeTag.normalizeSubtags(nonCanonical, 'canonical');
    /* c8 ignore next 3 - should be caught in the first pass */
    if (canonical.isFailure()) {
      return fail(`failed to normalize variant prefix: ${canonical.message}`);
    }
    let prefix = subtagsToString(canonical.value);

    return mapResults(
      variants.map((variant) => {
        const def = this.iana.subtags.variants.tryGet(variant);
        /* c8 ignore next 3 - should be caught in the first pass */
        if (!def) {
          return fail(`invalid variant subtag "${variant}" (not registered).`);
        }

        // only fail if registration specifies prefixes but none are present
        if (def.prefix?.includes(prefix as Iana.LanguageSubtags.ExtendedLanguageRange) === false) {
          return fail(
            `invalid prefix "${prefix}" for variant subtag ${variant} (expected "(${def.prefix.join(
              ', '
            )})").`
          );
        }
        const canonicalVariant = this.iana.subtags.variants.toCanonical(variant).orDefault();
        prefix = `${prefix}-${canonicalVariant}`;
        return succeed(variant);
      })
    );
  }
}
