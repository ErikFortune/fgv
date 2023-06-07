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

import { Brand } from '@fgv/ts-utils';

/**
 * Primary language subtag in the IANA language subtag registry.
 * @public
 */
export type LanguageSubtag = Brand<string, 'LanguageSubtag'>;

/**
 * Extlang subtag in the IANA language subtag registry.
 * @public
 */
export type ExtLangSubtag = Brand<string, 'ExtLangSubtag'>;

/**
 * Script subtag in the IANA language subtag registry.
 * @public
 */
export type ScriptSubtag = Brand<string, 'ScriptSubtag'>;

/**
 * Region subtag in the IANA language subtag registry.
 * @public
 */
export type RegionSubtag = Brand<string, 'RegionSubtag'>;

/**
 * Variant subtag in the IANA language subtag registry.
 * @public
 */
export type VariantSubtag = Brand<string, 'VariantSubtag'>;

/**
 * Legacy language tag registered as grandfathered in the IANA language subtag registry.
 * @public
 */
export type GrandfatheredTag = Brand<string, 'GrandfatheredTag'>;

/**
 * Legacy language tag registered as redundant in the IANA language subtag registry.
 * @public
 */
export type RedundantTag = Brand<string, 'RedundantTag'>;

/**
 * An extended language subtag as used in the IANA language registry.
 * @public
 */
export type ExtendedLanguageRange = Brand<string, 'ExtendedLanguageRange'>;
