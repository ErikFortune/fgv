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
 * Unit tests for `perf/promptCacheObservability.js`'s extracted pure logic and injectable
 * transport (design.md §8's addendum) — the ratio arithmetic, the cold/warm comparison, and the
 * prediction verdict, exercised against fixture usage blocks instead of live traffic.
 */

import '@fgv/ts-utils-jest';
import { fail, succeed } from '@fgv/ts-utils';

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  buildObservabilityStablePrefix,
  describeObservabilityUsage,
  evaluateObservabilityPrediction,
  runPromptCacheObservabilityHarness,
  type IPromptCacheObservabilityDeps
} from '../../../packlets/ai-assist/promptCacheObservabilityHarness';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { type IAiCompletionResponse, type IAiProviderDescriptor } from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { type IAiCompletionUsage } from '../../../packlets/ai-assist/usageTypes';

function usage(partial: Partial<IAiCompletionUsage>): IAiCompletionUsage {
  return { reports: 'reads', ...partial };
}

function response(usageValue: IAiCompletionUsage | undefined): IAiCompletionResponse {
  return { content: 'x', truncated: false, structuredOutput: 'none', usage: usageValue };
}

const descriptor = { id: 'xai-grok' } as unknown as IAiProviderDescriptor;

describe('buildObservabilityStablePrefix', () => {
  test('is deterministic and non-empty', () => {
    expect(buildObservabilityStablePrefix()).toBe(buildObservabilityStablePrefix());
    expect(buildObservabilityStablePrefix().length).toBeGreaterThan(0);
  });
});

describe('describeObservabilityUsage', () => {
  test('reports usage absent', () => {
    expect(describeObservabilityUsage('cold call ', undefined)).toBe(
      'cold call : usage absent from response'
    );
  });

  test('formats a computable ratio', () => {
    expect(
      describeObservabilityUsage('warm call ', usage({ uncachedInputTokens: 22, cachedInputTokens: 4800 }))
    ).toBe(
      'warm call : reports=reads uncached=22 cached=4800 (99.5% of input) written=undefined output=undefined'
    );
  });

  test('formats zero total input as n/a rather than NaN%', () => {
    expect(
      describeObservabilityUsage('cold call ', usage({ uncachedInputTokens: 0, cachedInputTokens: 0 }))
    ).toBe('cold call : reports=reads uncached=0 cached=0 (n/a of input) written=undefined output=undefined');
  });
});

describe('evaluateObservabilityPrediction', () => {
  test('is inconclusive when either usage is undefined', () => {
    const result = evaluateObservabilityPrediction(
      undefined,
      usage({ uncachedInputTokens: 22, cachedInputTokens: 4800 })
    );
    expect(result.verdict).toBe('inconclusive');
    expect(result.reportsAsPredicted).toBe(false);
  });

  test('is inconclusive when a present usage has no computable ratio (absent cachedInputTokens)', () => {
    const result = evaluateObservabilityPrediction(
      usage({ uncachedInputTokens: 8684 }),
      usage({ uncachedInputTokens: 22, cachedInputTokens: 4800 })
    );
    expect(result.verdict).toBe('inconclusive');
  });

  test('is missed when the ratio confirms but reports is not "reads" on both calls', () => {
    const cold = usage({ uncachedInputTokens: 8556, cachedInputTokens: 128 });
    const warm = {
      ...usage({ uncachedInputTokens: 22, cachedInputTokens: 4800 }),
      reports: 'reads-and-writes' as const
    };
    const result = evaluateObservabilityPrediction(cold, warm);
    expect(result.verdict).toBe('missed');
    expect(result.reportsAsPredicted).toBe(false);
    expect(result.detail).toMatch(/reports was not 'reads'/);
  });

  test('is confirmed when both calls report reads and the warm ratio clears the cold floor', () => {
    const cold = usage({ uncachedInputTokens: 8556, cachedInputTokens: 128 });
    const warm = usage({ uncachedInputTokens: 22, cachedInputTokens: 4800 });
    const result = evaluateObservabilityPrediction(cold, warm);
    expect(result.verdict).toBe('confirmed');
    expect(result.reportsAsPredicted).toBe(true);
    expect(result.coldRatio).toBeCloseTo(128 / 8684, 5);
    expect(result.warmRatio).toBeCloseTo(4800 / 4822, 5);
  });

  test('is missed when both calls report reads but the warm ratio does not clear the cold floor', () => {
    // The falsifying run this stream actually observed: cold and warm both landed at 2.2%.
    const cold = usage({ uncachedInputTokens: 8492, cachedInputTokens: 192 });
    const warm = usage({ uncachedInputTokens: 8492, cachedInputTokens: 192 });
    const result = evaluateObservabilityPrediction(cold, warm);
    expect(result.verdict).toBe('missed');
    expect(result.detail).toMatch(/did not clear/);
  });

  test('is missed (not a distinct outcome) when the underlying comparison is ambiguous', () => {
    // Clears the 50% floor but not by the required 5x improvement factor — compareCacheHitRatios
    // reports 'ambiguous' for this pair; the observability prediction collapses that into 'missed'
    // since the design's prediction is a binary confirmed/not-confirmed call.
    const cold = usage({ uncachedInputTokens: 60, cachedInputTokens: 40 });
    const warm = usage({ uncachedInputTokens: 40, cachedInputTokens: 60 });
    const result = evaluateObservabilityPrediction(cold, warm);
    expect(result.verdict).toBe('missed');
    expect(result.detail).toMatch(/did not clear/);
  });
});

describe('runPromptCacheObservabilityHarness', () => {
  test('fails when the cold call fails', async () => {
    const deps: IPromptCacheObservabilityDeps = {
      callCompletion: jest.fn().mockResolvedValue(fail('network error'))
    };
    await expect(runPromptCacheObservabilityHarness(deps, descriptor, 'key')).resolves.toFailWith(
      /cold call failed: network error/
    );
  });

  test('fails when the warm call fails', async () => {
    const cold = usage({ uncachedInputTokens: 8556, cachedInputTokens: 128 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(cold)))
      .mockResolvedValueOnce(fail('rate limited'));
    const deps: IPromptCacheObservabilityDeps = { callCompletion };
    await expect(runPromptCacheObservabilityHarness(deps, descriptor, 'key')).resolves.toFailWith(
      /warm call failed: rate limited/
    );
  });

  test('sends one shared system prefix and two distinct user turns, and evaluates the pair', async () => {
    const cold = usage({ uncachedInputTokens: 8556, cachedInputTokens: 128 });
    const warm = usage({ uncachedInputTokens: 22, cachedInputTokens: 4800 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(cold)))
      .mockResolvedValueOnce(succeed(response(warm)));
    const deps: IPromptCacheObservabilityDeps = { callCompletion };

    const result = await runPromptCacheObservabilityHarness(deps, descriptor, 'my-key');
    expect(result).toSucceedAndSatisfy((value) => {
      expect(value).toEqual(evaluateObservabilityPrediction(cold, warm));
    });

    expect(callCompletion).toHaveBeenCalledTimes(2);
    const [firstCall, secondCall] = callCompletion.mock.calls.map(([params]) => params);
    expect(firstCall.descriptor).toBe(descriptor);
    expect(firstCall.apiKey).toBe('my-key');
    expect(firstCall.system).toBe(buildObservabilityStablePrefix());
    expect(secondCall.system).toBe(firstCall.system);
    expect(firstCall.messages).not.toEqual(secondCall.messages);
  });
});
