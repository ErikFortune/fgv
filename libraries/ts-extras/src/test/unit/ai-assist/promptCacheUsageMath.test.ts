// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/**
 * Unit tests for the cache-hit ratio arithmetic and cold/warm verdict classification shared by
 * the `perf/promptCacheObservability.js` and `perf/promptCacheRoutingAb.js` harnesses — the pure
 * logic design.md §8's addendum found untested against fixture usage blocks.
 */

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  compareCacheHitRatios,
  computeCacheUsageRatio,
  formatCacheRatioPercent
} from '../../../packlets/ai-assist/promptCacheUsageMath';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { type IAiCompletionUsage } from '../../../packlets/ai-assist/usageTypes';

function usage(partial: Partial<IAiCompletionUsage>): IAiCompletionUsage {
  return { reports: 'reads', ...partial };
}

describe('computeCacheUsageRatio', () => {
  test('reports both fields undefined when usage itself is undefined', () => {
    expect(computeCacheUsageRatio(undefined)).toEqual({
      totalInputTokens: undefined,
      cachedRatio: undefined
    });
  });

  test('reports both fields undefined when cachedInputTokens is absent (reports: reads with no cached field)', () => {
    expect(computeCacheUsageRatio(usage({ uncachedInputTokens: 100 }))).toEqual({
      totalInputTokens: undefined,
      cachedRatio: undefined
    });
  });

  test('reports both fields undefined when uncachedInputTokens is absent', () => {
    expect(computeCacheUsageRatio(usage({ cachedInputTokens: 100 }))).toEqual({
      totalInputTokens: undefined,
      cachedRatio: undefined
    });
  });

  test('reports a known total but an undefined ratio when total input is zero', () => {
    expect(computeCacheUsageRatio(usage({ cachedInputTokens: 0, uncachedInputTokens: 0 }))).toEqual({
      totalInputTokens: 0,
      cachedRatio: undefined
    });
  });

  test('computes the ratio when both token counts are known and positive', () => {
    expect(computeCacheUsageRatio(usage({ cachedInputTokens: 4800, uncachedInputTokens: 22 }))).toEqual({
      totalInputTokens: 4822,
      cachedRatio: 4800 / 4822
    });
  });

  test('computes a zero ratio when cachedInputTokens is zero but the total is positive', () => {
    expect(computeCacheUsageRatio(usage({ cachedInputTokens: 0, uncachedInputTokens: 8684 }))).toEqual({
      totalInputTokens: 8684,
      cachedRatio: 0
    });
  });
});

describe('formatCacheRatioPercent', () => {
  test('formats undefined as n/a', () => {
    expect(formatCacheRatioPercent(undefined)).toBe('n/a');
  });

  test('formats a ratio as a one-decimal percentage', () => {
    expect(formatCacheRatioPercent(0.995)).toBe('99.5%');
    expect(formatCacheRatioPercent(0)).toBe('0.0%');
  });
});

describe('compareCacheHitRatios', () => {
  test('is inconclusive when the baseline usage is undefined', () => {
    expect(
      compareCacheHitRatios(undefined, usage({ cachedInputTokens: 4800, uncachedInputTokens: 22 }))
    ).toEqual({
      baselineRatio: undefined,
      candidateRatio: 4800 / 4822,
      verdict: 'inconclusive'
    });
  });

  test('is inconclusive when the candidate usage is undefined', () => {
    expect(
      compareCacheHitRatios(usage({ cachedInputTokens: 128, uncachedInputTokens: 8556 }), undefined)
    ).toEqual({
      baselineRatio: 128 / 8684,
      candidateRatio: undefined,
      verdict: 'inconclusive'
    });
  });

  test('is inconclusive when a ratio is not computable on either side (absent cachedInputTokens)', () => {
    const noCachedField = usage({ uncachedInputTokens: 8684 });
    const withRatio = usage({ cachedInputTokens: 192, uncachedInputTokens: 8492 });
    expect(compareCacheHitRatios(noCachedField, withRatio).verdict).toBe('inconclusive');
    expect(compareCacheHitRatios(withRatio, noCachedField).verdict).toBe('inconclusive');
  });

  test('confirms when the candidate clears the floor and improves on the baseline by the required factor', () => {
    // design.md's routing A/B: arm 1 ~1.9% cached, arm 2 ~99.7% cached.
    const withoutKey = usage({ cachedInputTokens: 192, uncachedInputTokens: 9884 });
    const withKey = usage({ cachedInputTokens: 10048, uncachedInputTokens: 28 });
    expect(compareCacheHitRatios(withoutKey, withKey)).toEqual({
      baselineRatio: 192 / 10076,
      candidateRatio: 10048 / 10076,
      verdict: 'confirms'
    });
  });

  test('misses when the candidate ratio is at or below the floor', () => {
    const withoutKey = usage({ cachedInputTokens: 192, uncachedInputTokens: 9884 });
    const withKey = usage({ cachedInputTokens: 192, uncachedInputTokens: 9884 });
    expect(compareCacheHitRatios(withoutKey, withKey).verdict).toBe('misses');
  });

  test('misses at exactly the floor percentage (boundary is exclusive)', () => {
    const baseline = usage({ cachedInputTokens: 0, uncachedInputTokens: 100 });
    const candidate = usage({ cachedInputTokens: 50, uncachedInputTokens: 50 }); // exactly 50%
    expect(compareCacheHitRatios(baseline, candidate).verdict).toBe('misses');
  });

  test('is ambiguous when the candidate clears the floor but not by the required improvement factor', () => {
    // baseline 40%, candidate 60%: clears the 50% floor, but 60 is not > 40 * 5.
    const baseline = usage({ cachedInputTokens: 40, uncachedInputTokens: 60 });
    const candidate = usage({ cachedInputTokens: 60, uncachedInputTokens: 40 });
    expect(compareCacheHitRatios(baseline, candidate).verdict).toBe('ambiguous');
  });

  test('confirms even off a zero baseline, as long as the candidate clears the floor', () => {
    const baseline = usage({ cachedInputTokens: 0, uncachedInputTokens: 100 });
    const candidate = usage({ cachedInputTokens: 60, uncachedInputTokens: 40 });
    expect(compareCacheHitRatios(baseline, candidate).verdict).toBe('confirms');
  });

  test('is ambiguous at exactly the improvement factor (boundary is exclusive)', () => {
    // baseline 12.5% (1/8), candidate 62.5% (5/8) — both exact in binary floating point, so the
    // boundary isn't blurred by rounding. Clears the 50% floor, and 62.5 === 12.5 * 5 exactly —
    // not strictly greater, so this must not confirm.
    const baseline = usage({ cachedInputTokens: 1, uncachedInputTokens: 7 });
    const candidate = usage({ cachedInputTokens: 5, uncachedInputTokens: 3 });
    expect(compareCacheHitRatios(baseline, candidate).verdict).toBe('ambiguous');
  });
});
