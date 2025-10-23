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
import { TagValidity, compareValidity } from './common';

import { ISubtags } from '../common';
import { ITagValidator } from './baseValidator';
import { IsCanonicalValidator } from './isCanonical';
import { IsInPreferredFromValidator } from './isInPreferredForm';
import { IsStrictlyValidValidator } from './isStrictlyValid';
import { IsValidValidator } from './isValid';
import { IsWellFormedValidator } from './isWellFormed';

/**
 * Validation helpers for BCP-47 language tags.
 * @public
 */
export class ValidateTag {
  private static _isCanonical?: ITagValidator;
  private static _isInPreferredForm?: ITagValidator;
  private static _validators: Record<TagValidity, ITagValidator> | undefined = undefined;

  /**
   * Determines if supplied {@link Bcp47.Subtags | subtags } are in canonical form,
   * meaning that they are at least well-formed as specified by
   * {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | RFC 5646}, and
   * all subtags are also
   * {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-2.1.1 | capitalized as recommended}.
   * @param subtags - The {@link Bcp47.Subtags | subtags } to test.
   * @returns `true` if the {@link Bcp47.Subtags | subtags } represent
   * a language tag in canonical, false otherwise.
   * @example `en-US` is in canonical form, `en-us` is not.
   * @example `eng-US` is in canonical form, `eng-us` is not.
   */
  public static isCanonical(subtags: ISubtags): boolean {
    if (!this._isCanonical) {
      this._isCanonical = new IsCanonicalValidator();
    }
    return this._isCanonical.validateSubtags(subtags).isSuccess();
  }

  /**
   * Determines if supplied {@link Bcp47.Subtags | subtags } are
   * in preferred form. Preferred form is valid as specified by
   * {@link  https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | RFC 5646} and
   * also meets additional preferences specified in the
   * {@link https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry | language subtag registry} -
   * extraneous (suppressed) script tags, deprecated language, extlang, script or region tags or
   * deprecated grandfathered or redundant tags (with a defined preferred-value) are not allowed.
   * @param subtags - The {@link Bcp47.Subtags | subtags } to test.
   * @returns `true` if the {@link Bcp47.Subtags | subtags } represent
   * a valid language tag in preferred form, false otherwise.
   * @example `en-US` is in preferred form, `en-Latn-US` is not.
   * @example `cmn` is in preferred form, `zh-cmn-Hans` is not.
   */
  public static isInPreferredForm(subtags: ISubtags): boolean {
    if (!this._isInPreferredForm) {
      this._isInPreferredForm = new IsInPreferredFromValidator();
    }
    return this._isInPreferredForm.validateSubtags(subtags).isSuccess();
  }

  /**
   * Determines if supplied {@link Bcp47.Subtags | subtags } are
   * strictly valid.  A strictly valid tag is both
   * {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | valid as defined in the RFC}
   * and meets any other requirements such as
   * {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-3.1.8 | prefix validity}.
   * @param subtags - The {@link Bcp47.Subtags | subtags } to test.
   * @returns `true` if the {@link Bcp47.Subtags | subtags } represent
   * a strictly valid language tag, false otherwise.
   * @example `ca-valencia` is strictly valid, `es-valencia` is not.
   */
  public static isStrictlyValid(subtags: ISubtags): boolean {
    return this.validateSubtags(subtags, 'strictly-valid').isSuccess();
  }

  /**
   * Determines if supplied {@link Bcp47.Subtags | subtags } are
   * valid as specified by {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | RFC 5646},
   * meaning that all subtags, or the tag itself for grandfathered tags, are defined in the
   * {@link https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry | IANA language subtag registry}.
   * @param subtags - The {@link Bcp47.Subtags | subtags } to test.
   * @returns `true` if the {@link Bcp47.Subtags | subtags } represent
   * a valid language tag, false otherwise.
   * @example `en-US` is valid, `eng-US` is not.
   */
  public static isValid(subtags: ISubtags): boolean {
    return this.validateSubtags(subtags, 'valid').isSuccess();
  }

  /**
   * Determines if supplied {@link Bcp47.Subtags | subtags } are
   * well-formed as specified by {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | RFC 5646},
   * meaning that all subtags meet the grammar defined in the specification.
   * @param subtags - The {@link Bcp47.Subtags | subtags } to test.
   * @returns `true` if the {@link Bcp47.Subtags | subtags } represent
   * a well-formed language tag, false otherwise.
   * @example `en-US` is valid, `english-US` is not.
   * @public
   */
  public static isWellFormed(subtags: ISubtags): boolean {
    return this.validateSubtags(subtags, 'well-formed').isSuccess();
  }

  /**
   * Chooses an appropriate default tag validator given desired and optional current
   * {@link Bcp47.TagValidity | validation level}.
   * @param wantValidity - The desired {@link Bcp47.TagValidity | validity level}.
   * @param haveValidity - (optional) The current {@link Bcp47.TagValidity | validity level}.
   * @returns An appropriate {@link Bcp47.TagValidator | tag validator} or `undefined` if no
   * additional validation is necessary.
   * @internal
   */
  public static chooseValidator(
    wantValidity: TagValidity,
    haveValidity?: TagValidity
  ): ITagValidator | undefined {
    if (haveValidity && compareValidity(haveValidity, wantValidity) >= 0) {
      return undefined;
    }

    if (!this._validators) {
      this._validators = {
        unknown: new IsWellFormedValidator(),
        'well-formed': new IsWellFormedValidator(),
        valid: new IsValidValidator(),
        'strictly-valid': new IsStrictlyValidValidator()
      };
    }
    return this._validators![wantValidity];
  }

  /**
   * Validates supplied {@link Bcp47.Subtags | subtags } to a requested
   * {@link Bcp47.TagValidity | validity level}, if necessary.
   * @param subtags - The {@link Bcp47.Subtags | subtags } to be validated.
   * @param wantValidity - The desired {@link Bcp47.TagValidity | validity level}.
   * @param haveValidity - (optional) The current {@link Bcp47.TagValidity | validity level}.
   * @returns `Success` with the validated {@link Bcp47.Subtags | subtags }, or
   * `Failure` with details if an error occurs.
   * @public
   */
  public static validateSubtags(
    subtags: ISubtags,
    wantValidity: TagValidity,
    haveValidity?: TagValidity
  ): Result<boolean> {
    const validator = this.chooseValidator(wantValidity, haveValidity);
    // istanbul ignore next - a pain to test
    return validator?.validateSubtags(subtags) ?? succeed(true);
  }
}
