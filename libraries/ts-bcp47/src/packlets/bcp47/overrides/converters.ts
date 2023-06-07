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
/* eslint-disable @rushstack/typedef-var */

import * as Iana from '../../iana';
import * as Model from './model';

import { File } from '@fgv/ts-json';
import { Converter, Converters, Result } from '@fgv/ts-utils';

/**
 * @internal
 */
export const languageOverrideRecord: Converter<Model.ILanguageOverrideRecord, unknown> =
  Converters.strictObject<Model.ILanguageOverrideRecord>(
    {
      language: Iana.LanguageSubtags.Converters.Tags.languageSubtag,
      preferredRegion: Iana.LanguageSubtags.Converters.Tags.regionSubtag,
      defaultAffinity: Converters.string,
      affinity: Converters.recordOf(Converters.arrayOf(Iana.LanguageSubtags.Converters.Tags.regionSubtag))
    },
    { optionalFields: ['affinity', 'defaultAffinity', 'preferredRegion'] }
  );

/**
 * @internal
 */
export const languageOverridesFile = Converters.arrayOf(languageOverrideRecord);

/**
 * Loads a language overrides JSON file.
 * @internal
 * @param path - Path from which overrides should be loaded.
 * @returns `Success` with the loaded overrides or `Failure` with details if an
 * error occurs.
 */
export function loadLanguageOverridesFileSync(path: string): Result<Model.ILanguageOverrideRecord[]> {
  return File.convertJsonFileSync(path, languageOverridesFile);
}
