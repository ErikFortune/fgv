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

import * as Model from './model';
import * as Validate from './validate';

import { File } from '@fgv/ts-json';
import { Converter, Converters, Result } from '@fgv/ts-utils';
import { datedRegistry, yearMonthDaySpec } from '../common/converters';

/**
 * @public
 */
export const extensionSingleton = Validate.extensionSingleton.converter;

/**
 * @internal
 */
export const languageTagExtension: Converter<Model.ILanguageTagExtension, unknown> =
  Converters.strictObject<Model.ILanguageTagExtension>(
    {
      identifier: extensionSingleton,
      description: Converters.stringArray,
      comments: Converters.stringArray,
      added: yearMonthDaySpec,
      rfc: Converters.string,
      authority: Converters.string,
      contactEmail: Converters.string,
      mailingList: Converters.string,
      url: Converters.string
    },
    {
      description: 'registered language tag extension'
    }
  );

/**
 * @internal
 */
export const languageTagExtensions = datedRegistry(languageTagExtension);

/**
 * @internal
 * @param path - path from which the extensions registry is to be loaded.
 * @returns `Success` with the loaded language tag extensions data, o
 * or `Failure` with details if an error occurs.
 */
export function loadLanguageTagExtensionsJsonFileSync(path: string): Result<Model.LanguageTagExtensions> {
  return File.convertJsonFileSync(path, languageTagExtensions);
}
