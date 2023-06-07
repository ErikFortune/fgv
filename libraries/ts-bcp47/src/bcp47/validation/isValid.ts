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
import * as Bcp47Subtags from '../bcp47Subtags';

import { Result, allSucceed, fail, mapResults, succeed } from '@fgv/ts-utils';
import { ExtensionSingleton, ExtensionSubtag } from '../bcp47Subtags/model';
import { IExtensionSubtagValue, ISubtags } from '../common';
import { TagValidatorBase } from './baseValidator';
import { TagValidity } from './common';

/**
 * @internal
 */
export class IsValidValidator extends TagValidatorBase {
  public validity: TagValidity = 'valid';

  protected _checkLanguage(subtags: ISubtags): Result<Iana.LanguageSubtags.LanguageSubtag | undefined> {
    return subtags.primaryLanguage
      ? this.iana.subtags.languages.verifyIsValid(subtags.primaryLanguage)
      : succeed(undefined);
  }

  protected _checkExtlangs(subtags: ISubtags): Result<Iana.LanguageSubtags.ExtLangSubtag[] | undefined> {
    if (subtags.extlangs) {
      return allSucceed(
        subtags.extlangs.map((e) => this.iana.subtags.extlangs.verifyIsValid(e)),
        subtags.extlangs
      );
    }
    return succeed(undefined);
  }

  protected _checkScript(subtags: ISubtags): Result<Iana.LanguageSubtags.ScriptSubtag | undefined> {
    return subtags.script ? this.iana.subtags.scripts.verifyIsValid(subtags.script) : succeed(undefined);
  }

  protected _checkRegion(subtags: ISubtags): Result<Iana.LanguageSubtags.RegionSubtag | undefined> {
    return subtags.region ? this.iana.subtags.regions.verifyIsValid(subtags.region) : succeed(undefined);
  }

  protected _checkVariants(subtags: ISubtags): Result<Iana.LanguageSubtags.VariantSubtag[] | undefined> {
    if (subtags.variants) {
      return allSucceed(
        subtags.variants.map((v) => this.iana.subtags.variants.verifyIsValid(v)),
        subtags.variants
      ).onSuccess((v) => {
        return mapResults(v.map((vc) => this.iana.subtags.variants.toCanonical(vc))).onSuccess(
          (canonical) => {
            return this._verifyUnique('variant subtag', canonical, (v) => v);
          }
        );
      });
    }
    return succeed(undefined);
  }

  protected _checkExtensionSingleton(singleton: ExtensionSingleton): Result<ExtensionSingleton> {
    return this.iana.extensions.extensions.verifyIsValid(singleton);
  }

  protected _checkExtensionSubtagValue(value: ExtensionSubtag): Result<ExtensionSubtag> {
    return Bcp47Subtags.Validate.extensionSubtag.verifyIsWellFormed(value);
  }

  protected _checkExtensions(subtags: ISubtags): Result<IExtensionSubtagValue[] | undefined> {
    return super._checkExtensions(subtags).onSuccess((extensions) => {
      return this._verifyUnique('extensions', extensions, (e) => e.singleton.toLowerCase());
    });
  }

  protected _checkPrivateUseTags(
    subtags: ISubtags
  ): Result<Iana.LanguageSubtags.ExtendedLanguageRange[] | undefined> {
    if (subtags.privateUse) {
      return allSucceed(
        subtags.privateUse.map((pu) =>
          Iana.LanguageSubtags.Validate.extendedLanguageRange.verifyIsWellFormed(pu)
        ),
        subtags.privateUse
      );
    }
    return succeed(subtags.privateUse);
  }

  protected _checkGrandfatheredTags(
    subtags: ISubtags
  ): Result<Iana.LanguageSubtags.GrandfatheredTag | undefined> {
    return subtags.grandfathered
      ? this.iana.subtags.grandfathered.verifyIsValid(subtags.grandfathered)
      : succeed(undefined);
  }

  protected _postValidate(subtags: ISubtags): Result<ISubtags> {
    return this._basicPostValidation(subtags).onSuccess((validated) => {
      if (validated.extlangs && validated.extlangs.length > 1) {
        return fail(`${validated.extlangs.join('-')}: multiple extlang subtags is invalid`);
      }
      return succeed(validated);
    });
  }
}
