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

import {
  ExtLangSubtag,
  ExtendedLanguageRange,
  GrandfatheredTag,
  LanguageSubtag,
  RedundantTag,
  RegionSubtag,
  ScriptSubtag,
  VariantSubtag
} from '../tags/model';

import { Brand } from '@fgv/ts-utils';
import { IDatedRegistry } from '../../../common/model';

/**
 * @internal
 */
export type RegistryEntryType =
  | 'extlang'
  | 'grandfathered'
  | 'language'
  | 'redundant'
  | 'region'
  | 'script'
  | 'variant';

/**
 * @internal
 */
export const allRegistryEntryTypes: RegistryEntryType[] = [
  'extlang',
  'grandfathered',
  'language',
  'redundant',
  'region',
  'script',
  'variant'
];

/**
 * @internal
 */
export type RegistryEntryScope = 'collection' | 'macrolanguage' | 'private-use' | 'special';

/**
 * @internal
 */
export const allRegistryEntryScopes: RegistryEntryScope[] = [
  'collection',
  'macrolanguage',
  'private-use',
  'special'
];

/**
 * @public
 */
export type YearMonthDaySpec = Brand<string, 'YearMonthDaySpec'>;

/**
 * @internal
 */
interface IRegistryEntryBase<TTYPE extends RegistryEntryType = RegistryEntryType> {
  Type: TTYPE;
  Description: string[];
  Added: YearMonthDaySpec;
  Deprecated?: YearMonthDaySpec;
  'Suppress-Script'?: ScriptSubtag;
  Macrolanguage?: LanguageSubtag;
  'Preferred-Value'?: string;
  Prefix?: string[];
  Scope?: RegistryEntryScope;
  Comments?: string[];
}

/**
 * @internal
 */
export interface IRegistrySubtagEntry<
  TTYPE extends RegistryEntryType = RegistryEntryType,
  TSUBTAG extends string = string
> extends IRegistryEntryBase<TTYPE> {
  Subtag: TSUBTAG | TSUBTAG[];
}

/**
 * @internal
 */
export interface IRegistryTagEntry<
  TTYPE extends RegistryEntryType = RegistryEntryType,
  TTAG extends string = string
> extends IRegistryEntryBase<TTYPE> {
  Tag: TTAG | TTAG[];
}

/**
 * Strongly-typed JAR format language subtag entry
 * @internal
 */
export interface ILanguageSubtagRegistryEntry {
  Type: 'language';
  Subtag: LanguageSubtag | LanguageSubtag[];
  Description: string[];
  Added: YearMonthDaySpec;
  Comments?: string[];
  Deprecated?: YearMonthDaySpec;
  Macrolanguage?: LanguageSubtag;
  'Preferred-Value'?: LanguageSubtag;
  Scope?: RegistryEntryScope;
  'Suppress-Script'?: ScriptSubtag;
}

/**
 * Strongly-typed JAR format extlang subtag entry
 * @internal
 */
export interface IExtLangSubtagRegistryEntry {
  Type: 'extlang';
  Subtag: ExtLangSubtag;
  'Preferred-Value': ExtendedLanguageRange;
  Prefix: LanguageSubtag[];
  Description: string[];
  Added: YearMonthDaySpec;
  Comments?: string[];
  Deprecated?: YearMonthDaySpec;
  Macrolanguage?: LanguageSubtag;
  Scope?: RegistryEntryScope;
  'Suppress-Script'?: ScriptSubtag;
}

/**
 * Strongly-typed JAR format script subtag entry
 * @internal
 */
export interface IScriptSubtagRegistryEntry {
  Type: 'script';
  Subtag: ScriptSubtag | ScriptSubtag[];
  Description: string[];
  Added: YearMonthDaySpec;
  Comments?: string[];
  Deprecated?: YearMonthDaySpec;
  'Preferred-Value'?: ScriptSubtag;
}

/**
 * Strongly-typed JAR format region subtag entry
 * @internal
 */
export interface IRegionSubtagRegistryEntry {
  Type: 'region';
  Subtag: RegionSubtag | RegionSubtag[];
  Description: string[];
  Added: YearMonthDaySpec;
  Comments?: string[];
  Deprecated?: YearMonthDaySpec;
  'Preferred-Value'?: RegionSubtag;
}

/**
 * Strongly-typed JAR format variant subtag entry
 * @internal
 */
export interface IVariantSubtagRegistryEntry {
  Type: 'variant';
  Subtag: VariantSubtag;
  Description: string[];
  Added: YearMonthDaySpec;
  Comments?: string[];
  Deprecated?: YearMonthDaySpec;
  'Preferred-Value'?: VariantSubtag;
  Prefix?: ExtendedLanguageRange[];
}

/**
 * Strongly-typed JAR format grandfathered tag entry
 * @internal
 */
export interface IGrandfatheredTagRegistryEntry {
  Type: 'grandfathered';
  Tag: GrandfatheredTag;
  Description: string[];
  Added: YearMonthDaySpec;
  Comments?: string[];
  Deprecated?: YearMonthDaySpec;
  'Preferred-Value'?: ExtendedLanguageRange;
}

/**
 * Strongly-typed JAR format redundant tag entry
 * @internal
 */
export interface IRedundantTagRegistryEntry {
  Type: 'redundant';
  Tag: RedundantTag;
  Description: string[];
  Added: YearMonthDaySpec;
  Comments?: string[];
  Deprecated?: YearMonthDaySpec;
  'Preferred-Value'?: ExtendedLanguageRange;
}

/**
 * @internal
 */
export type RegistryEntry =
  | ILanguageSubtagRegistryEntry
  | IExtLangSubtagRegistryEntry
  | IScriptSubtagRegistryEntry
  | IRegionSubtagRegistryEntry
  | IVariantSubtagRegistryEntry
  | IGrandfatheredTagRegistryEntry
  | IRedundantTagRegistryEntry;

/**
 * @internal
 */
export type RegistryFile = IDatedRegistry<RegistryEntry>;
