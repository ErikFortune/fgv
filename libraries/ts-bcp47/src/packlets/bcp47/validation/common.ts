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
 * Describes the validation level of a particular tag.
 * @public
 */
export type TagValidity = 'unknown' | 'well-formed' | 'valid' | 'strictly-valid';

/**
 * Ordered ranking of the degrees of validity, from `unknown` (least
 * validation) to `strictly-valid` (fully validated).
 * @public
 */
const validityRank: Record<TagValidity, number> = {
  /**
   * No validation has been performed.
   */
  unknown: 0,
  /**
   * Tag is well-formed {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | according to RFC 5646}.
   */
  'well-formed': 0.5,
  /**
   * Tag is valid {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | according to RFC 5646} -
   * well-formed, and is a registered grandfathered tag or all subtags are registered,
   * with no duplicate extensions or variant subtags.
   */
  valid: 0.9,
  /**
   * Tag is valid {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.9 | according to RFC 5646} and meets
   * other constraints described by the RFC - e.g. if present, any extlang or variant subtags have a
   * {@link https://www.rfc-editor.org/rfc/rfc5646.html#section-3.1.8 | valid prefix} as specified by
   * the registry.
   */
  'strictly-valid': 1.0
};

/**
 * Determines which of two validity ranks is most normalized.
 * @param v1 - The first {@link TagValidity} to be compared.
 * @param v2 - The second {@link TagValidity} to be compared.
 * @returns `1` if `v1` is more normalized, `-1` if `v2` is more
 * normalized, or `0` if they are identical.
 * @public
 */
export function compareValidity(v1: TagValidity, v2: TagValidity): -1 | 0 | 1 {
  if (validityRank[v1] > validityRank[v2]) {
    return 1;
  } else if (validityRank[v1] < validityRank[v2]) {
    return -1;
  }
  return 0;
}

/**
 * Chooses the most valid of two normalization ranks.
 * @param v1 - The first {@link TagValidity} to be compared.
 * @param v2 - The second {@link TagValidity} to be compared.
 * @returns The most validated of `v1` or `v2`.
 * @public
 */
export function mostValid(v1: TagValidity, v2: TagValidity): TagValidity {
  return validityRank[v1] >= validityRank[v2] ? v1 : v2;
}
