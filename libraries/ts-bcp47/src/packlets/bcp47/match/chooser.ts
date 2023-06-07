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

import { ISubtags } from '../common';
import { LanguageTag } from '../languageTag';
import { LanguageSimilarityMatcher } from './similarity';

/**
 * Represents a single matching filtered language.
 * @public
 */
export interface IMatchingLanguage {
  /**
   * Numeric indication of how well the language matches,
   * from perfect (`1.0`) to not at all (`0.0`).  When
   * matching an ordered list, languages at the front of
   * the desired language list are always higher quality.
   */
  quality: number;
  /**
   * The `string` tag of the matched language.
   */
  tag: string;
  /**
   * The matched {@link Bcp47.LanguageTag | language tag}.
   */
  languageTag: LanguageTag;
}

/**
 * Options for {@link Bcp47.choose | language tag list filter} functions.
 * @public
 */
export interface ILanguageChooserOptions {
  /**
   * Indicates whether to return the matching language from the
   * desired list or the available list. Default is `'availableLanguage'`.
   */
  use?: 'desiredLanguage' | 'availableLanguage';

  /**
   * Indicates how to filter the language list - `'primaryLanguage'`
   * indicates the each primary language should appear only once in
   * the list in its most similar form.  A filter value of `'none'`
   * reports all matching variants of any primary language in order
   * of similarity.  Default is `'primaryLanguage'`
   */
  filter?: 'primaryLanguage' | 'none';

  /**
   * An optional {@link Bcp47.LanguageSpec | language specification}
   * indicating a language to be returned if the filter call would
   * otherwise return an empty list (i.e. no languages match).
   */
  ultimateFallback?: string | ISubtags | LanguageTag;
}

/**
 * Default values for a{@link Bcp47.LanguageFilterOptions}.
 * @public
 */
export const defaultLanguageChooserOptions: ILanguageChooserOptions = Object.freeze({
  use: 'availableLanguage',
  filter: 'primaryLanguage'
});

/**
 * Helper to compare a list of 'desired' languages to a list of 'available' language
 * and return the intersection in order of preference, taking tag semantics into account.
 * @public
 */
export class LanguageChooser {
  /**
   * @internal
   */
  protected readonly _matcher: LanguageSimilarityMatcher;

  public constructor(iana?: Iana.LanguageRegistries) {
    this._matcher = new LanguageSimilarityMatcher(iana);
  }

  public chooseLanguageTagsWithDetails(
    desiredLanguages: LanguageTag[],
    availableLanguages: LanguageTag[],
    options?: ILanguageChooserOptions
  ): IMatchingLanguage[] {
    const matched = new Map<string, IMatchingLanguage>();
    const decrement = desiredLanguages.length < 10 ? 0.1 : 1.0 / desiredLanguages.length;
    let base = 1.0;

    // fill any missing fields from the default
    options = { ...defaultLanguageChooserOptions, ...options };

    for (const want of desiredLanguages) {
      base -= decrement;
      for (const have of availableLanguages) {
        const similarity = this._matcher.matchLanguageTags(want, have);
        if (similarity > 0.0) {
          const quality = base + similarity * decrement;
          const languageTag = options.use === 'availableLanguage' ? have : want;
          const tag = languageTag.tag;
          const key = options.filter === 'primaryLanguage' ? languageTag.subtags.primaryLanguage ?? tag : tag;

          const match: IMatchingLanguage = {
            quality,
            tag,
            languageTag
          };

          const existing = matched.get(key);
          if (!existing || existing.quality < quality) {
            matched.set(key, match);
          }
        }
      }
    }

    const values = Array.from(matched.values());
    if (values.length > 1) {
      // want descending order
      values.sort((m1, m2) => m2.quality - m1.quality);
    } else if (values.length === 0 && options.ultimateFallback) {
      const languageTag =
        options.ultimateFallback instanceof LanguageTag
          ? options.ultimateFallback
          : LanguageTag.create(options.ultimateFallback).orDefault();
      if (languageTag) {
        return [{ languageTag, tag: languageTag.tag, quality: 0 }];
      }
    }
    return values;
  }

  public filterLanguageTags(
    desiredLanguages: LanguageTag[],
    availableLanguages: LanguageTag[],
    options?: ILanguageChooserOptions
  ): LanguageTag[] {
    return this.chooseLanguageTagsWithDetails(desiredLanguages, availableLanguages, options).map(
      (t) => t.languageTag
    );
  }
}
