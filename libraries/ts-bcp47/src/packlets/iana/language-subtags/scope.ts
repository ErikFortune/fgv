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

import * as Model from '../jar/language-subtags/registry/model';
import * as Items from './model';

import { Result, allSucceed, fail, succeed } from '@fgv/ts-utils';
import { ValidationHelpers, sanitizeJson } from '../../utils';
import {
  ExtLangSubtag,
  GrandfatheredTag,
  LanguageSubtag,
  RedundantTag,
  RegionSubtag,
  ScriptSubtag,
  Validators,
  VariantSubtag
} from '../jar/language-subtags/tags';

import { RegisteredItemScope } from '../common/registeredItems';

/**
 * @internal
 */
class SubtagScope<
  TTYPE extends Model.RegistryEntryType,
  TTAG extends string,
  TITEM extends Items.IRegisteredSubtag<TTYPE, TTAG>
> extends RegisteredItemScope<TTYPE, TTAG, TITEM> {
  protected constructor(type: TTYPE, validate: ValidationHelpers<TTAG>) {
    super(type, validate);
  }

  public add(entry: TITEM): Result<true> {
    return this._validateEntry(entry).onSuccess(() => {
      this._items.set(entry.subtag, entry);
      return succeed(true);
    });
  }

  protected _validateEntry(entry: TITEM): Result<true> {
    return this._validateKey(entry.subtag);
  }
}

/**
 * @internal
 */
class SubtagScopeWithRange<
  TTYPE extends Model.RegistryEntryType,
  TTAG extends string,
  TITEM extends Items.IRegisteredSubtagWithRange<TTYPE, TTAG>
> extends SubtagScope<TTYPE, TTAG, TITEM> {
  protected constructor(type: TTYPE, validate: ValidationHelpers<TTAG>) {
    super(type, validate);
  }

  public add(entry: TITEM): Result<true> {
    return this._validateEntry(entry).onSuccess(() => {
      return this._addRange(entry);
    });
  }

  protected _validateEntry(entry: TITEM): Result<true> {
    const start = entry.subtag;
    const end = entry.subtagRangeEnd ?? ('' as TTAG);
    if (end) {
      return allSucceed(
        [this._validateKey(start), this._validateKey(end), this._validateRange(start, end)],
        true
      );
    }
    return this._validateKey(start);
  }

  protected _validateRange(start: TTAG, end: TTAG): Result<true> {
    return start < end ? succeed(true) : fail(`${start}..${end}: invalid range`);
  }

  protected _addRange(entry: TITEM): Result<true> {
    this._items.set(entry.subtag, entry);
    if (entry.subtagRangeEnd) {
      let next = this._nextInRange(entry.subtag, entry.subtagRangeEnd);
      while (next) {
        const e = sanitizeJson({ ...entry, subtag: next, subtagRangeEnd: undefined });
        this._items.set(next, e);
        next = this._nextInRange(next, entry.subtagRangeEnd);
      }
    }
    return succeed(true);
  }

  protected _nextInRange(current: TTAG, end: TTAG): TTAG | undefined {
    if (current >= end) {
      return undefined;
    }
    const next = Array.from(current);
    for (let i = next.length - 1; i >= 0; i--) {
      if (next[i].toLowerCase() < 'z') {
        next[i] = String.fromCharCode(next[i].charCodeAt(0) + 1);
        break;
      } else {
        next[i] = 'a';
      }
    }
    return this._validate.toCanonical(next.join('')).getValueOrThrow();
  }
}

/**
 * @internal
 */
class TagScope<
  TTYPE extends Model.RegistryEntryType,
  TTAG extends string,
  TITEM extends Items.IRegisteredTag<TTYPE, TTAG>
> extends RegisteredItemScope<TTYPE, TTAG, TITEM> {
  protected constructor(type: TTYPE, validate: ValidationHelpers<TTAG>) {
    super(type, validate);
  }

  public add(entry: TITEM): Result<true> {
    return this._validateEntry(entry).onSuccess(() => {
      this._items.set(entry.tag, entry);
      return succeed(true);
    });
  }

  protected _validateEntry(entry: TITEM): Result<true> {
    return this._validateKey(entry.tag);
  }
}

/**
 * @public
 */
export class LanguageSubtagScope extends SubtagScopeWithRange<
  'language',
  LanguageSubtag,
  Items.IRegisteredLanguage
> {
  public constructor() {
    super('language', Validators.languageSubtag);
  }
}

/**
 * @public
 */
export class ExtLangSubtagScope extends SubtagScope<'extlang', ExtLangSubtag, Items.IRegisteredExtLang> {
  public constructor() {
    super('extlang', Validators.extlangSubtag);
  }
}

/**
 * @public
 */
export class ScriptSubtagScope extends SubtagScopeWithRange<'script', ScriptSubtag, Items.IRegisteredScript> {
  public constructor() {
    super('script', Validators.scriptSubtag);
  }
}

/**
 * @public
 */
export class RegionSubtagScope extends SubtagScopeWithRange<'region', RegionSubtag, Items.IRegisteredRegion> {
  public constructor() {
    super('region', Validators.regionSubtag);
  }
}

/**
 * @public
 */
export class VariantSubtagScope extends SubtagScope<'variant', VariantSubtag, Items.IRegisteredVariant> {
  public constructor() {
    super('variant', Validators.variantSubtag);
  }
}

/**
 * @public
 */
export class GrandfatheredTagScope extends TagScope<
  'grandfathered',
  GrandfatheredTag,
  Items.IRegisteredGrandfatheredTag
> {
  public constructor() {
    super('grandfathered', Validators.grandfatheredTag);
  }
}

/**
 * @public
 */
export class RedundantTagScope extends TagScope<'redundant', RedundantTag, Items.IRegisteredRedundantTag> {
  public constructor() {
    super('redundant', Validators.redundantTag);
  }
}
