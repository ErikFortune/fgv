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

import * as Iana from '../iana';

import { ExtensionSingleton, ExtensionSubtag } from './bcp47Subtags/model';
export { ExtensionSingleton, ExtensionSubtag };

/**
 * @public
 */
export interface IExtensionSubtagValue {
  readonly singleton: ExtensionSingleton;
  readonly value: ExtensionSubtag;
}

/**
 * @public
 */
export interface ISubtags {
  primaryLanguage?: Iana.LanguageSubtags.LanguageSubtag;
  extlangs?: Iana.LanguageSubtags.ExtLangSubtag[];
  script?: Iana.LanguageSubtags.ScriptSubtag;
  region?: Iana.LanguageSubtags.RegionSubtag;
  variants?: Iana.LanguageSubtags.VariantSubtag[];
  extensions?: IExtensionSubtagValue[];
  privateUse?: Iana.LanguageSubtags.ExtendedLanguageRange[];

  grandfathered?: Iana.LanguageSubtags.GrandfatheredTag;
}

/**
 * Converts {@link Bcp47.Subtags | subtags} to a string.
 * @param subtags - The {@link Bcp47.Subtags | subtags} to be converted.
 * @returns A string representing the supplied {@link Bcp47.Subtags | subtags}.
 * @public
 */
export function subtagsToString(subtags: ISubtags): string {
  if (subtags.grandfathered) {
    return subtags.grandfathered;
  }
  return [
    subtags.primaryLanguage,
    ...(subtags.extlangs ?? []),
    subtags.script,
    subtags.region,
    ...(subtags.variants ?? []),
    ...(subtags.extensions ?? []).map((e) => `${e.singleton}-${e.value}`),
    ...(subtags.privateUse && subtags.privateUse.length > 0 ? [`x-${subtags.privateUse.join('-')}`] : [])
  ]
    .filter((s): s is string => s !== undefined)
    .join('-');
}

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const UndeterminedLanguage: Iana.LanguageSubtags.LanguageSubtag =
  'und' as Iana.LanguageSubtags.LanguageSubtag;

/**
 * @public
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const GlobalRegion: Iana.LanguageSubtags.RegionSubtag = '001' as Iana.LanguageSubtags.RegionSubtag;
