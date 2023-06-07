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

import { Result, succeed } from '@fgv/ts-utils';
import { TagNormalization, compareNormalization } from './common';

import { ISubtags } from '../common';
import { ITagNormalizer } from './baseNormalizer';
import { CanonicalNormalizer } from './canonicalNormalizer';
import { PreferredNormalizer } from './preferredTagNormalizer';

/**
 * Normalization helpers for BCP-47 language tags.
 * @public
 */
export class NormalizeTag {
  /**
   * @internal
   */
  private static _normalizers: Record<TagNormalization, ITagNormalizer | undefined> | undefined = undefined;

  /**
   * Converts a BCP-47 language tag to canonical form.  Canonical form uses the recommended capitalization rules
   * specified in {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-2.1.1 | RFC 5646} but are not
   * otherwise modified.
   *
   * @param subtags - The individual {@link Bcp47.Subtags | subtags} to be normalized.
   * @returns `Success` with the normalized equivalent {@link Bcp47.Subtags | subtags},
   * or `Failure` with details if an error occurs.
   */
  public static toCanonical(subtags: ISubtags): Result<ISubtags> {
    return this.normalizeSubtags(subtags, 'canonical');
  }

  /**
   * Converts a BCP-47 language tag to preferred form.  Preferred form uses the recommended capitalization rules
   * specified in {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-2.1.1 | RFC 5646} and also
   * applies additional preferred values specified in the
   * {@link https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry | language subtag registry}:
   * extraneous (suppressed) script tags are removed, deprecated language, extlang, script or region tags are replaced
   * with up-to-date preferred values, and grandfathered or redundant tags with a defined preferred-value are replaced
   * in their entirety with the new preferred value.
   * @param subtags - The individual {@link Bcp47.Subtags | subtags} to be normalized.
   * @returns `Success` with the normalized equivalent {@link Bcp47.Subtags | subtags},
   * or `Failure` with details if an error occurs.
   */
  public static toPreferred(subtags: ISubtags): Result<ISubtags> {
    return this.normalizeSubtags(subtags, 'preferred');
  }

  /**
   * Chooses an appropriate default tag normalizer given desired and optional current
   * {@link Bcp47.TagNormalization | normalization level}.
   * @param wantNormalization - The desired {@link Bcp47.TagNormalization | normalization level}.
   * @param haveNormalization - (optional) The current {@link Bcp47.TagNormalization | normalization level}.
   * @returns An appropriate {@link Bcp47.TagNormalizer | tag normalizer} or `undefined` if no additional
   * normalization is necessary.
   * @internal
   */
  public static chooseNormalizer(
    wantNormalization: TagNormalization,
    haveNormalization?: TagNormalization
  ): ITagNormalizer | undefined {
    if (haveNormalization && compareNormalization(haveNormalization, wantNormalization) >= 0) {
      return undefined;
    }

    if (!this._normalizers) {
      this._normalizers = {
        unknown: undefined,
        none: undefined,
        canonical: new CanonicalNormalizer(),
        preferred: new PreferredNormalizer()
      };
    }
    return this._normalizers![wantNormalization];
  }

  /**
   * Normalizes supplied {@link Bcp47.Subtags | subtags} to a requested
   * {@link Bcp47.TagNormalization | normalization level}, if necessary.  If
   * no normalization is necessary, returns the supplied subtags.
   * @param subtags - The {@link Bcp47.Subtags | subtags} to be normalized.
   * @param wantNormalization - The desired {@link Bcp47.TagNormalization | normalization level}.
   * @param haveNormalization - (optional) The current {@link Bcp47.TagNormalization | normalization level}.
   * @returns `Success` with the normalized {@link Bcp47.Subtags | subtags}, or
   * `Failure` with details if an error occurs.
   */
  public static normalizeSubtags(
    subtags: ISubtags,
    wantNormalization: TagNormalization,
    haveNormalization?: TagNormalization
  ): Result<ISubtags> {
    const normalizer = this.chooseNormalizer(wantNormalization, haveNormalization);
    return normalizer?.processSubtags(subtags) ?? succeed(subtags);
  }
}
