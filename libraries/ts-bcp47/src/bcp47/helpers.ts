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

import { Result, mapResults, succeed } from '@fgv/ts-utils';
import { ISubtags } from './common';
import { ILanguageTagInitOptions, LanguageTag } from './languageTag';
import { LanguageSimilarityMatcher } from './match';
import { ILanguageChooserOptions, LanguageChooser } from './match/chooser';

/**
 * Any of the possible ways to represent a language - as a `string`,
 * parsed {@link Bcp47.Subtags | subtags} or an instantiated
 * {@link Bcp47.LanguageTag | language tag}.
 * @public
 */
export type LanguageSpec = string | ISubtags | LanguageTag;

/**
 * Creates a new {@link Bcp47.LanguageTag | language tag} from a {@link Bcp47.LanguageSpec | language specifier}
 *
 * The supplied initializer must be at least
 * {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | well-formed according to RFC 5646}.
 * Higher degrees of validation along with any normalizations may be optionally specified.
 *
 * @param from - The {@link Bcp47.LanguageSpec | language specifier} from which the tag is to
 * be created.
 * @param options - (optional) The {@link Bcp47.LanguageTagInitOptions | options} used to construct
 * and validate the tag.
 * @returns `Success` with a valid {@link Bcp47.LanguageTag | language tag} or `Failure` with details
 * if an error occurs.
 * @public
 */
// istanbul ignore next - tests applied for wrapped function
export function tag(from: LanguageSpec, options?: ILanguageTagInitOptions): Result<LanguageTag> {
  return from instanceof LanguageTag ? succeed(from) : LanguageTag.create(from, options);
}

/**
 * Creates an array of {@link Bcp47.LanguageTag | language tags} from an incoming array of
 * {@link Bcp47.LanguageSpec | language specifiers}.
 * @param from - The array of {@link Bcp47.LanguageSpec} to be converted.
 * @param options - (optional) The {@link Bcp47.LanguageTagInitOptions | options} used to construct
 * and validate any created tags.
 * @returns `Success` with an array of {@link Bcp47.LanguageTag | language tags}, or `Failure`
 * with details if an error occurs.
 * @public
 */
export function tags(from: LanguageSpec[], options?: ILanguageTagInitOptions): Result<LanguageTag[]> {
  return mapResults(from.map((f) => tag(f, options)));
}

/**
 * Determine how similar two language tags are to each other.
 *
 * @param t1 - First tag to match, supplied as one of `string`, individual
 * {@link Bcp47.Subtags | subtags}, or constructed
 * {@link Bcp47.LanguageTag | language tag}.
 * @param t2 - Second tag to match, supplied as one of `string`, individual
 * {@link Bcp47.Subtags | subtags}, or constructed
 * {@link Bcp47.LanguageTag | language tag}.
 * @param options - (optional) A set of {@link Bcp47.LanguageTagInitOptions | language tag options}
 * which control any necessary conversion or parsing.
 * @returns A numeric value in the range 1.0 (exact match) to 0.0 (no match).
 * @see For a set of common levels of similarity, see {@link Bcp47.tagSimilarity | similarity}.
 * @public
 */
// istanbul ignore next - tests applied for wrapped function
export function similarity(
  t1: LanguageSpec,
  t2: LanguageSpec,
  options?: ILanguageTagInitOptions
): Result<number> {
  return tags([t1, t2], options).onSuccess((tags) => {
    return succeed(new LanguageSimilarityMatcher().matchLanguageTags(tags[0], tags[1]));
  });
}

/**
 * Matches a list of desired {@link Bcp47.LanguageSpec | languages} to a list of available {@link Bcp47.LanguageSpec | languages},
 * return a list of matching languages ordered from best to worst.
 * @param desired - An array of {@link Bcp47.LanguageSpec | language specifications} containing an ordered list of preferred languages.
 * @param available - An array of {@link Bcp47.LanguageSpec | language specifications} containing an unordered list of available languages.
 * @param options - (optional) Parameters to control language tag conversion or comparison
 * @returns `Success` with an ordered list of matching {@link Bcp47.LanguageTag | languages}, or `Failure` with details if
 * an error occurs.
 * @public
 */
export function choose(
  desired: LanguageSpec[],
  available: LanguageSpec[],
  options?: ILanguageTagInitOptions & ILanguageChooserOptions
): Result<LanguageTag[]> {
  return tags(desired, options).onSuccess((w) => {
    return tags(available, options).onSuccess((h) => {
      return succeed(new LanguageChooser().filterLanguageTags(w, h, options));
    });
  });
}
