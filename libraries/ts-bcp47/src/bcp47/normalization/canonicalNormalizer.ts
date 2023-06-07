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

import { Result, mapResults, succeed } from '@fgv/ts-utils';
import {
  ExtLangSubtag,
  ExtendedLanguageRange,
  GrandfatheredTag,
  LanguageSubtag,
  RegionSubtag,
  ScriptSubtag,
  VariantSubtag
} from '../../iana/language-subtags';
import { ExtensionSingleton, ExtensionSubtag } from '../bcp47Subtags/model';
import { ISubtags } from '../common';
import { TagNormalizerBase } from './baseNormalizer';
import { TagNormalization } from './common';

/**
 * @internal
 */
export class CanonicalNormalizer extends TagNormalizerBase {
  public readonly normalization: TagNormalization = 'canonical';

  protected _processLanguage(subtags: ISubtags): Result<LanguageSubtag | undefined> {
    if (subtags.primaryLanguage) {
      return this._iana.subtags.languages.toCanonical(subtags.primaryLanguage);
    }
    return succeed(subtags.primaryLanguage);
  }

  protected _processExtlangs(subtags: ISubtags): Result<ExtLangSubtag[] | undefined> {
    if (subtags.extlangs) {
      return mapResults(subtags.extlangs.map((e) => this._iana.subtags.extlangs.toCanonical(e)));
    }
    return succeed(undefined);
  }

  protected _processScript(subtags: ISubtags): Result<ScriptSubtag | undefined> {
    if (subtags.script) {
      return this._iana.subtags.scripts.toCanonical(subtags.script);
    }
    return succeed(undefined);
  }

  protected _processRegion(subtags: ISubtags): Result<RegionSubtag | undefined> {
    if (subtags.region) {
      return this._iana.subtags.regions.toCanonical(subtags.region);
    }
    return succeed(undefined);
  }

  protected _processVariants(subtags: ISubtags): Result<VariantSubtag[] | undefined> {
    if (subtags.variants) {
      return mapResults(subtags.variants.map((v) => this._iana.subtags.variants.toCanonical(v)));
    }
    return succeed(undefined);
  }

  protected _processExtensionSingleton(singleton: ExtensionSingleton): Result<ExtensionSingleton> {
    return this._iana.extensions.extensions.toCanonical(singleton);
  }

  protected _processExtensionSubtagValue(value: ExtensionSubtag): Result<ExtensionSubtag> {
    return Bcp47Subtags.Validate.extensionSubtag.toCanonical(value);
  }

  protected _processPrivateUseTags(subtags: ISubtags): Result<ExtendedLanguageRange[] | undefined> {
    if (subtags.privateUse) {
      const merged = subtags.privateUse.join('-');
      return Iana.LanguageSubtags.Validate.extendedLanguageRange.toCanonical(merged).onSuccess((canon) => {
        return succeed(canon.split('-') as ExtendedLanguageRange[]);
      });
    }
    return succeed(subtags.privateUse);
  }

  protected _processGrandfatheredTags(subtags: ISubtags): Result<GrandfatheredTag | undefined> {
    if (subtags.grandfathered) {
      return this._iana.subtags.grandfathered.toCanonical(subtags.grandfathered);
    }
    return succeed(undefined);
  }
}
