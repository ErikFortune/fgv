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

import {
  ExtLangSubtag,
  ExtendedLanguageRange,
  GrandfatheredTag,
  LanguageSubtag,
  RedundantTag,
  RegionSubtag,
  ScriptSubtag,
  VariantSubtag
} from './common';

import { IDatedRegistry } from '../common/model';

/**
 * @public
 */
export interface IRegisteredSubtag<TTYPE extends Model.RegistryEntryType, TTAG extends string> {
  readonly type: TTYPE;
  readonly subtag: TTAG;
  readonly description: string[];
}

/**
 * @public
 */
export interface IRegisteredSubtagWithRange<TTYPE extends Model.RegistryEntryType, TTAG extends string>
  extends IRegisteredSubtag<TTYPE, TTAG> {
  readonly type: TTYPE;
  readonly subtag: TTAG;
  readonly description: string[];

  readonly subtagRangeEnd?: TTAG;
}

/**
 * @public
 */
export interface IRegisteredTag<TTYPE extends Model.RegistryEntryType, TTAG extends string> {
  readonly type: TTYPE;
  readonly tag: TTAG;
  readonly description: string[];
}

/**
 * @public
 */
export type RegisteredTagOrSubtag<TTYPE extends Model.RegistryEntryType, TTAG extends string> =
  | IRegisteredSubtag<TTYPE, TTAG>
  | IRegisteredSubtagWithRange<TTYPE, TTAG>
  | IRegisteredTag<TTYPE, TTAG>;

/**
 * @public
 */
export interface IRegisteredLanguage extends IRegisteredSubtagWithRange<'language', LanguageSubtag> {
  readonly type: 'language';
  readonly subtag: LanguageSubtag;
  readonly description: string[];
  readonly added: Model.YearMonthDaySpec;

  readonly comments?: string[];
  readonly deprecated?: Model.YearMonthDaySpec;

  readonly macrolanguage?: LanguageSubtag;
  readonly preferredValue?: LanguageSubtag;
  readonly scope?: Model.RegistryEntryScope;
  readonly suppressScript?: ScriptSubtag;

  readonly subtagRangeEnd?: LanguageSubtag;
}

/**
 * @public
 */
export interface IRegisteredExtLang extends IRegisteredSubtag<'extlang', ExtLangSubtag> {
  readonly type: 'extlang';
  readonly subtag: ExtLangSubtag;
  readonly preferredValue: ExtendedLanguageRange;
  readonly prefix: LanguageSubtag;
  readonly description: string[];
  readonly added: Model.YearMonthDaySpec;

  readonly comments?: string[];
  readonly deprecated?: Model.YearMonthDaySpec;

  readonly macrolanguage?: LanguageSubtag;
  readonly scope?: Model.RegistryEntryScope;
  readonly suppressScript?: ScriptSubtag;
}

/**
 * @public
 */
export interface IRegisteredScript extends IRegisteredSubtagWithRange<'script', ScriptSubtag> {
  readonly type: 'script';
  readonly subtag: ScriptSubtag;
  readonly description: string[];
  readonly added: Model.YearMonthDaySpec;

  readonly comments?: string[];
  readonly deprecated?: Model.YearMonthDaySpec;
  readonly preferredValue?: ScriptSubtag;

  readonly subtagRangeEnd?: ScriptSubtag;
}

/**
 * @public
 */
export interface IRegisteredRegion extends IRegisteredSubtagWithRange<'region', RegionSubtag> {
  readonly type: 'region';
  readonly subtag: RegionSubtag;
  readonly description: string[];
  readonly added: Model.YearMonthDaySpec;

  readonly comments?: string[];
  readonly deprecated?: Model.YearMonthDaySpec;
  readonly preferredValue?: RegionSubtag;

  readonly subtagRangeEnd?: RegionSubtag;
}

/**
 * @public
 */
export interface IRegisteredVariant extends IRegisteredSubtag<'variant', VariantSubtag> {
  readonly type: 'variant';
  readonly subtag: VariantSubtag;
  readonly description: string[];
  readonly added: Model.YearMonthDaySpec;

  readonly comments?: string[];
  readonly deprecated?: Model.YearMonthDaySpec;
  readonly preferredValue?: VariantSubtag;
  readonly prefix?: ExtendedLanguageRange[];
}

/**
 * @public
 */
export interface IRegisteredGrandfatheredTag extends IRegisteredTag<'grandfathered', GrandfatheredTag> {
  readonly type: 'grandfathered';
  readonly tag: GrandfatheredTag;
  readonly description: string[];
  readonly added: Model.YearMonthDaySpec;

  readonly comments?: string[];
  readonly deprecated?: Model.YearMonthDaySpec;
  readonly preferredValue?: ExtendedLanguageRange;
}

/**
 * @public
 */
export interface IRegisteredRedundantTag extends IRegisteredTag<'redundant', RedundantTag> {
  readonly type: 'redundant';
  readonly tag: RedundantTag;
  readonly description: string[];
  readonly added: Model.YearMonthDaySpec;

  readonly comments?: string[];
  readonly deprecated?: Model.YearMonthDaySpec;
  readonly preferredValue?: ExtendedLanguageRange;
}

/**
 * @public
 */
export type RegisteredSubtagItem =
  | IRegisteredLanguage
  | IRegisteredExtLang
  | IRegisteredScript
  | IRegisteredRegion
  | IRegisteredVariant;

/**
 * @public
 */
export type RegisteredTagItem = IRegisteredGrandfatheredTag | IRegisteredRedundantTag;

/**
 * @public
 */
export type RegisteredItem = RegisteredSubtagItem | RegisteredTagItem;

/**
 * @public
 */
export type RegistryFile = IDatedRegistry<RegisteredItem>;
