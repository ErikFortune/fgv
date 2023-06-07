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

import { Result, allSucceed, fail, succeed } from '@fgv/ts-utils';
import { ExtensionSingleton, ExtensionSubtag } from '../bcp47Subtags/model';

import { ISubtags } from '../common';
import { TagValidatorBase } from './baseValidator';
import { TagValidity } from './common';

/**
 * @internal
 */
export class IsCanonicalValidator extends TagValidatorBase {
  public validity: TagValidity = 'well-formed';

  protected _checkLanguage(subtags: ISubtags): Result<Iana.LanguageSubtags.LanguageSubtag | undefined> {
    if (subtags.primaryLanguage) {
      return this.iana.subtags.languages.verifyIsCanonical(subtags.primaryLanguage);
    }
    return succeed(undefined);
  }

  protected _checkExtlangs(subtags: ISubtags): Result<Iana.LanguageSubtags.ExtLangSubtag[] | undefined> {
    if (subtags.extlangs) {
      return allSucceed(
        subtags.extlangs.map((e) => this.iana.subtags.extlangs.verifyIsCanonical(e)),
        subtags.extlangs
      );
    }
    return succeed(undefined);
  }

  protected _checkScript(subtags: ISubtags): Result<Iana.LanguageSubtags.ScriptSubtag | undefined> {
    return subtags.script ? this.iana.subtags.scripts.verifyIsCanonical(subtags.script) : succeed(undefined);
  }

  protected _checkRegion(subtags: ISubtags): Result<Iana.LanguageSubtags.RegionSubtag | undefined> {
    return subtags.region ? this.iana.subtags.regions.verifyIsCanonical(subtags.region) : succeed(undefined);
  }

  protected _checkVariants(subtags: ISubtags): Result<Iana.LanguageSubtags.VariantSubtag[] | undefined> {
    if (subtags.variants) {
      return allSucceed(
        subtags.variants.map((v) => this.iana.subtags.variants.verifyIsCanonical(v)),
        subtags.variants
      );
    }
    return succeed(undefined);
  }

  protected _checkExtensionSingleton(singleton: ExtensionSingleton): Result<ExtensionSingleton> {
    return this.iana.extensions.extensions.verifyIsCanonical(singleton);
  }

  protected _checkExtensionSubtagValue(value: ExtensionSubtag): Result<ExtensionSubtag> {
    return Bcp47Subtags.Validate.extensionSubtag.verifyIsCanonical(value);
  }

  protected _checkPrivateUseTags(
    subtags: ISubtags
  ): Result<Iana.LanguageSubtags.ExtendedLanguageRange[] | undefined> {
    if (subtags.privateUse) {
      const result = Iana.LanguageSubtags.Validate.extendedLanguageRange.verifyIsCanonical(
        subtags.privateUse.join('-') as Iana.LanguageSubtags.ExtendedLanguageRange
      );
      if (result.isFailure()) {
        return fail(result.message);
      }
    }
    return succeed(subtags.privateUse);
  }

  protected _checkGrandfatheredTags(
    subtags: ISubtags
  ): Result<Iana.LanguageSubtags.GrandfatheredTag | undefined> {
    return subtags.grandfathered
      ? this.iana.subtags.grandfathered.verifyIsCanonical(subtags.grandfathered)
      : succeed(undefined);
  }
}
