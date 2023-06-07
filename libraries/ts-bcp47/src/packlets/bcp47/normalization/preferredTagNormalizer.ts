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

import { Result, fail, mapResults, succeed } from '@fgv/ts-utils';
import { IExtensionSubtagValue, ISubtags, subtagsToString } from '../common';

import { sanitizeJson } from '../../utils';
import { LanguageTagParser } from '../languageTagParser';
import { TagNormalizerBase } from './baseNormalizer';
import { TagNormalization } from './common';

/**
 * @public
 */
export class PreferredNormalizer extends TagNormalizerBase {
  public readonly normalization: TagNormalization = 'preferred';

  protected _processLanguage(subtags: ISubtags): Result<Iana.LanguageSubtags.LanguageSubtag | undefined> {
    if (subtags.primaryLanguage) {
      const language = this._iana.subtags.languages.tryGet(subtags.primaryLanguage);
      if (!language) {
        return fail(`invalid language subtag "${subtags.primaryLanguage}"`);
      }
      return succeed(language.preferredValue ?? language.subtag);
    }
    return succeed(undefined);
  }

  protected _processExtlangs(subtags: ISubtags): Result<Iana.LanguageSubtags.ExtLangSubtag[] | undefined> {
    if (subtags.extlangs) {
      return mapResults(subtags.extlangs.map((e) => this._iana.subtags.extlangs.toValidCanonical(e)));
    }
    return succeed(undefined);
  }

  protected _processScript(subtags: ISubtags): Result<Iana.LanguageSubtags.ScriptSubtag | undefined> {
    if (subtags.primaryLanguage && subtags.script) {
      const language = this._iana.subtags.languages.tryGet(subtags.primaryLanguage);
      // istanbul ignore next - internal error difficult to test
      if (!language) {
        return fail(`invalid primary language subtag "${subtags.primaryLanguage}.`);
      }

      const script = this._iana.subtags.scripts.toValidCanonical(subtags.script).orDefault();
      if (!script) {
        return fail(`invalid script subtag "${subtags.script}`);
      }

      if (language.suppressScript !== script) {
        return succeed(script);
      }
    }
    return succeed(undefined);
  }

  protected _processRegion(subtags: ISubtags): Result<Iana.LanguageSubtags.RegionSubtag | undefined> {
    if (subtags.region) {
      return this._iana.subtags.regions.get(subtags.region).onSuccess((region) => {
        return succeed(region.preferredValue ?? region.subtag);
      });
    }
    return succeed(undefined);
  }

  protected _processVariants(subtags: ISubtags): Result<Iana.LanguageSubtags.VariantSubtag[] | undefined> {
    if (subtags.variants) {
      return mapResults(
        subtags.variants.map((v) => this._iana.subtags.variants.toValidCanonical(v))
      ).onSuccess((v) => this._verifyUnique('variant', v, (v) => v));
    }
    return succeed(undefined);
  }

  protected _processExtensionSingleton(
    singleton: Bcp47Subtags.Model.ExtensionSingleton
  ): Result<Bcp47Subtags.Model.ExtensionSingleton> {
    return this._iana.extensions.extensions.toValidCanonical(singleton);
  }

  protected _processExtensionSubtagValue(
    value: Bcp47Subtags.Model.ExtensionSubtag
  ): Result<Bcp47Subtags.Model.ExtensionSubtag> {
    return Bcp47Subtags.Validate.extensionSubtag.toCanonical(value);
  }

  protected _processExtensions(subtags: ISubtags): Result<IExtensionSubtagValue[] | undefined> {
    return super._processExtensions(subtags).onSuccess((extensions) => {
      return this._verifyUnique('extensions', extensions, (e) => e.singleton);
    });
  }

  protected _processPrivateUseTags(
    subtags: ISubtags
  ): Result<Iana.LanguageSubtags.ExtendedLanguageRange[] | undefined> {
    if (subtags.privateUse) {
      const merged = subtags.privateUse.join('-');
      return Iana.LanguageSubtags.Validate.extendedLanguageRange.toCanonical(merged).onSuccess((canon) => {
        return succeed(canon.split('-') as Iana.LanguageSubtags.ExtendedLanguageRange[]);
      });
    }
    return succeed(undefined);
  }

  protected _processGrandfatheredTags(
    subtags: ISubtags
  ): Result<Iana.LanguageSubtags.GrandfatheredTag | undefined> {
    if (subtags.grandfathered) {
      return this._iana.subtags.grandfathered.toValidCanonical(subtags.grandfathered);
    }
    return succeed(undefined);
  }

  protected _postValidateGrandfatheredTag(subtags: ISubtags): Result<ISubtags> {
    if (subtags.grandfathered) {
      return this._iana.subtags.grandfathered.get(subtags.grandfathered).onSuccess((grandfathered) => {
        if (grandfathered.preferredValue) {
          return LanguageTagParser.parse(grandfathered.preferredValue, this._iana)
            .onSuccess((gfSubtags) => {
              // istanbul ignore next - would require a registry error too hard to test
              if (gfSubtags.grandfathered !== undefined) {
                return fail<ISubtags>(
                  `preferred value ${grandfathered.preferredValue} of grandfathered tag ${subtags.grandfathered} is also grandfathered.`
                );
              }
              return this.processSubtags(gfSubtags);
            })
            .onFailure(
              // istanbul ignore next - would require a registry error too hard to test
              (message) => {
                // istanbul ignore next - would require a registry error too hard to test
                return fail(
                  `grandfathered tag "${subtags.grandfathered}" has invalid preferred value "${grandfathered.preferredValue}":\n${message}`
                );
              }
            );
        }
        return succeed(subtags);
      });
    }
    return succeed(subtags);
  }

  protected _postValidateRedundantTag(subtags: ISubtags): Result<ISubtags> {
    const tag = subtagsToString(subtags);
    const redundant = this._iana.subtags.redundant.tryGetCanonical(tag);
    if (redundant?.preferredValue) {
      return LanguageTagParser.parse(redundant.preferredValue, this._iana);
    }
    return succeed(subtags);
  }

  protected _postValidateExtLangs(subtags: ISubtags): Result<ISubtags> {
    if (subtags.extlangs) {
      if (subtags.extlangs.length > 1) {
        return fail(`${subtags.extlangs.join('-')}: multiple extlang subtags is invalid`);
      }
      if (subtags.extlangs.length > 0) {
        const registry = this._iana.subtags.extlangs.tryGet(subtags.extlangs[0]);
        if (registry) {
          if (
            registry.preferredValue &&
            registry.prefix === /* istanbul ignore next */ subtags.primaryLanguage?.toLowerCase()
          ) {
            const preferred = this._iana.subtags.languages.tryGet(registry.preferredValue);
            if (preferred) {
              return succeed(
                sanitizeJson({
                  ...subtags,
                  primaryLanguage: preferred.subtag,
                  extlangs: undefined
                })
              );
            }
          }
        }
      }
    }
    return succeed(subtags);
  }

  protected _postValidate(subtags: ISubtags): Result<ISubtags> {
    return super
      ._postValidate(subtags)
      .onSuccess((subtags) => {
        return this._postValidateExtLangs(subtags);
      })
      .onSuccess((subtags) => {
        return this._postValidateGrandfatheredTag(subtags);
      })
      .onSuccess((subtags) => {
        return this._postValidateRedundantTag(subtags);
      });
  }
}
