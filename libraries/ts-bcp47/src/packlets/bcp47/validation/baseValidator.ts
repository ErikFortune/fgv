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

import { Result, allSucceed, fail, succeed } from '@fgv/ts-utils';
import { ExtensionSingleton, ExtensionSubtag } from '../bcp47Subtags/model';
import { IExtensionSubtagValue, ISubtags, subtagsToString } from '../common';
import { TagValidity } from './common';

/**
 * @public
 */
export interface ITagValidator {
  readonly validity: TagValidity;

  validateSubtags(subtags: ISubtags): Result<true>;
}

/**
 * @internal
 */
export abstract class TagValidatorBase implements ITagValidator {
  public readonly iana: Iana.LanguageRegistries;
  public abstract readonly validity: TagValidity;

  public constructor(iana?: Iana.LanguageRegistries) {
    // istanbul ignore next
    this.iana = iana ?? Iana.DefaultRegistries.languageRegistries;
  }

  public validateSubtags(subtags: ISubtags): Result<true> {
    return allSucceed(
      [
        this._checkLanguage(subtags),
        this._checkExtlangs(subtags),
        this._checkScript(subtags),
        this._checkRegion(subtags),
        this._checkVariants(subtags),
        this._checkExtensions(subtags),
        this._checkPrivateUseTags(subtags),
        this._checkGrandfatheredTags(subtags)
      ],
      true
    ).onSuccess(() => {
      return this._postValidate(subtags).onSuccess(() => succeed(true));
    });
  }

  protected _basicPostValidation(subtags: ISubtags): Result<ISubtags> {
    if (
      subtags.primaryLanguage === undefined &&
      subtags.grandfathered === undefined &&
      subtags.privateUse === undefined
    ) {
      return fail(`${subtagsToString(subtags)}: missing primary language subtag.`);
    }
    if (subtags.extlangs && subtags.extlangs.length > 3) {
      return fail(`${subtagsToString(subtags)}: too many extlang subtags`);
    }
    return succeed(subtags);
  }

  protected _postValidate(subtags: ISubtags): Result<ISubtags> {
    return this._basicPostValidation(subtags);
  }

  protected _checkExtensions(subtags: ISubtags): Result<IExtensionSubtagValue[] | undefined> {
    if (subtags.extensions) {
      return allSucceed(
        subtags.extensions.map((ext) => {
          return this._checkExtensionSingleton(ext.singleton).onSuccess(() => {
            return this._checkExtensionSubtagValue(ext.value);
          });
        }),
        subtags.extensions
      );
    }
    return succeed(undefined);
  }

  protected _verifyUnique<T, TK extends string>(
    description: string,
    items: T[] | undefined,
    getKey: (item: T) => TK
  ): Result<T[] | undefined> {
    if (items) {
      const present = new Set<TK>();
      return allSucceed(
        items.map((i) => {
          const key = getKey(i);
          if (present.has(key)) {
            return fail(`${key}: duplicate ${description}`);
          }
          present.add(key);
          return succeed(key);
        }),
        items
      );
    }
    return succeed(items);
  }

  protected abstract _checkLanguage(subtags: ISubtags): Result<unknown>;
  protected abstract _checkExtlangs(subtags: ISubtags): Result<unknown>;
  protected abstract _checkScript(subtags: ISubtags): Result<unknown>;
  protected abstract _checkRegion(subtags: ISubtags): Result<unknown>;
  protected abstract _checkVariants(subtags: ISubtags): Result<unknown>;
  protected abstract _checkExtensionSingleton(singleton: ExtensionSingleton): Result<unknown>;
  protected abstract _checkExtensionSubtagValue(value: ExtensionSubtag): Result<unknown>;
  protected abstract _checkPrivateUseTags(subtags: ISubtags): Result<unknown>;
  protected abstract _checkGrandfatheredTags(subtags: ISubtags): Result<unknown>;
}
