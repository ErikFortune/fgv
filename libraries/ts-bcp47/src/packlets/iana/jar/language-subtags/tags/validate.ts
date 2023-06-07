/*
 * Copyright (c) 2021 Erik Fortune
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

import {
  ExtLangSubtag,
  ExtendedLanguageRange,
  GrandfatheredTag,
  LanguageSubtag,
  RedundantTag,
  RegionSubtag,
  ScriptSubtag,
  VariantSubtag
} from './model';

import { succeed } from '@fgv/ts-utils';
import { RegExpValidationHelpers } from '../../../../utils';
import { TagValidationHelpers } from './tagValidation';

/**
 * @public
 */
export const languageSubtag = new RegExpValidationHelpers<LanguageSubtag>({
  description: 'language subtag',
  wellFormed: /^[A-Za-z]{2,3}$/,
  canonical: /^[a-z]{2,3}$/,
  toCanonical: (from: LanguageSubtag) => succeed(from.toLowerCase() as LanguageSubtag)
});

/**
 * @public
 */
export const extlangSubtag = new RegExpValidationHelpers<ExtLangSubtag>({
  description: 'extlang subtag',
  wellFormed: /^[A-Za-z]{3}$/,
  canonical: /^[a-z]{3}$/,
  toCanonical: (from: ExtLangSubtag) => succeed(from.toLowerCase() as ExtLangSubtag)
});

/**
 * @public
 */
export const scriptSubtag = new RegExpValidationHelpers<ScriptSubtag>({
  description: 'script subtag',
  wellFormed: /^[A-Za-z]{4}$/,
  canonical: /^[A-Z][a-z]{3}$/,
  toCanonical: (from: ScriptSubtag) => {
    return succeed(`${from[0].toUpperCase()}${from.slice(1).toLowerCase()}` as ScriptSubtag);
  }
});

/**
 * @public
 */
export const regionSubtag = new RegExpValidationHelpers<RegionSubtag>({
  description: 'region subtag',
  wellFormed: /^([A-Za-z]{2,3})$|^([0-9]{3})$/,
  canonical: /^([A-Z]{2,3})$|^([0-9]{3})$/,
  toCanonical: (from: RegionSubtag) => succeed(from.toUpperCase() as RegionSubtag)
});

/**
 * @public
 */
export const variantSubtag = new RegExpValidationHelpers<VariantSubtag>({
  description: 'variant subtag',
  wellFormed: /^([A-Za-z0-9]{5,8})$|^([0-9][A-Za-z0-9]{3})$/,
  canonical: /^([a-z0-9]{5,8})$|^([0-9][a-z0-9]{3})$/,
  toCanonical: (from: VariantSubtag) => succeed(from.toLowerCase() as VariantSubtag)
});

/**
 * @public
 */
export const grandfatheredTag = new TagValidationHelpers<GrandfatheredTag>('grandfathered tag');

/**
 * @public
 */
export const redundantTag = new TagValidationHelpers<RedundantTag>('redundant tag');

/**
 * @public
 */
export const extendedLanguageRange = new TagValidationHelpers<ExtendedLanguageRange>(
  'extended language range'
);
