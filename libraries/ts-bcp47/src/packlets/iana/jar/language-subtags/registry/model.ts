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
  /* eslint-disable @typescript-eslint/naming-convention */
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
  /* eslint-enable @typescript-eslint/naming-convention */
}

/**
 * @internal
 */
export interface IRegistrySubtagEntry<
  TTYPE extends RegistryEntryType = RegistryEntryType,
  TSUBTAG extends string = string
> extends IRegistryEntryBase<TTYPE> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Subtag: TSUBTAG | TSUBTAG[];
}

/**
 * @internal
 */
export interface IRegistryTagEntry<
  TTYPE extends RegistryEntryType = RegistryEntryType,
  TTAG extends string = string
> extends IRegistryEntryBase<TTYPE> {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Tag: TTAG | TTAG[];
}

/**
 * @internal
 */
export type LanguageSubtagRegistryEntry = IRegistrySubtagEntry<'language', LanguageSubtag>;

/**
 * @internal
 */
export type ExtLangSubtagRegistryEntry = IRegistrySubtagEntry<'extlang', ExtLangSubtag>;

/**
 * @internal
 */
export type ScriptSubtagRegistryEntry = IRegistrySubtagEntry<'script', ScriptSubtag>;

/**
 * @internal
 */
export type RegionSubtagRegistryEntry = IRegistrySubtagEntry<'region', RegionSubtag>;

/**
 * @internal
 */
export type VariantSubtagRegistryEntry = IRegistrySubtagEntry<'variant', VariantSubtag>;

/**
 * @internal
 */
export type GrandfatheredTagRegistryEntry = IRegistryTagEntry<'grandfathered', GrandfatheredTag>;

/**
 * @internal
 */
export type RedundantTagRegistryEntry = IRegistryTagEntry<'redundant', RedundantTag>;

/**
 * @internal
 */
export type RegistryEntry =
  | LanguageSubtagRegistryEntry
  | ExtLangSubtagRegistryEntry
  | ScriptSubtagRegistryEntry
  | RegionSubtagRegistryEntry
  | VariantSubtagRegistryEntry
  | GrandfatheredTagRegistryEntry
  | RedundantTagRegistryEntry;

/**
 * @internal
 */
export type RegistryFile = IDatedRegistry<RegistryEntry>;
