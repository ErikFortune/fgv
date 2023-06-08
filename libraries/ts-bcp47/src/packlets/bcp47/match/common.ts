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

/**
 * Penalty for a mismatched value for some subtags.
 * @public
 */
export const subtagMismatchPenalty = {
  private: 0.05,
  extension: 0.04,
  variant: 0.1
};

/**
 * Common levels of match quality for a single language match.
 * @public
 */
export const tagSimilarity = {
  exact: 1.0,
  variant: 0.9,
  region: 0.8,
  macroRegion: 0.65,
  neutralRegion: 0.5,
  preferredAffinity: 0.45,
  affinity: 0.4,
  preferredRegion: 0.35,
  sibling: 0.3,
  undetermined: 0.1,
  none: 0
};

/**
 * Numeric representation of the quality of a language match.
 * Range is 0 (no match) to 1 (exact match).
 * @public
 */
export type TagSimilarity = keyof typeof tagSimilarity;
