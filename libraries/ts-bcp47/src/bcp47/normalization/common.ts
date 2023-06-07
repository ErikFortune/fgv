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

/**
 * Describes the degree of normalization of a language tag.
 * @public
 */
export type TagNormalization = 'unknown' | 'none' | 'canonical' | 'preferred';

/**
 * Ordered ranking of the degrees of normalization, from `unknown` (least
 * normalized) to `preferred` (most normalized).
 * @public
 */
const normalizationRank: Record<TagNormalization, number> = {
  /**
   * Normalization level is unknown.
   */
  unknown: 0,
  /**
   * Not normalized.
   */
  none: 0.1,
  /**
   * Tag and subtag case has been normalized to canonical
   * letter case (e.g. lower-case language and upper-case
   * region) but no other normalization has been applied.
   */
  canonical: 0.9,
  /**
   * All tag recommendations have been applied - e.g. suppressed
   * script is removed, deprecated or grandfathered values are
   * replaced with preferred values.
   */
  preferred: 1.0
};

/**
 * Determines which of two normalization ranks is most normalized.
 * @param n1 - The first {@link TagNormalization} to be compared.
 * @param n2 - The second {@link TagNormalization} to me compared.
 * @returns `1` if `n1` is more normalized, `-1` if `n2` is more
 * normalized, or `0` if they are identical.
 * @public
 */
export function compareNormalization(n1: TagNormalization, n2: TagNormalization): -1 | 0 | 1 {
  if (normalizationRank[n1] > normalizationRank[n2]) {
    return 1;
  } else if (normalizationRank[n1] < normalizationRank[n2]) {
    return -1;
  }
  return 0;
}

/**
 * Chooses the most normalized of two normalization ranks.
 * @param n1 - The first {@link TagNormalization} to be compared.
 * @param n2 - The second {@link TagNormalization} to me compared.
 * @returns The most normalized of `n1` or `n2`.
 * @public
 */
export function mostNormalized(n1: TagNormalization, n2: TagNormalization): TagNormalization {
  // istanbul ignore next - hard to hit due to guards
  return normalizationRank[n1] > normalizationRank[n2] ? n1 : n2;
}
