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
 * Unit tests for `perf/promptCacheRoutingAb.js`'s extracted pure logic and injectable transport —
 * in particular the CONFIRMS / MISSES / AMBIGUOUS verdict that, per this stream's follow-up task,
 * "has already been used to justify a merge" with nothing checking it classifies correctly.
 */

import '@fgv/ts-utils-jest';
import { fail, succeed } from '@fgv/ts-utils';

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  buildRoutingAbPrefix,
  describeRoutingAbUsage,
  formatRoutingAbVerdict,
  runPromptCacheRoutingAbArm,
  runPromptCacheRoutingAbHarness,
  type IPromptCacheRoutingAbDeps,
  type IPromptCacheRoutingAbResult
} from '../../../packlets/ai-assist/promptCacheRoutingAbHarness';
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

describe('buildRoutingAbPrefix', () => {
  test('is deterministic for a given salt and arm', () => {
    expect(buildRoutingAbPrefix('run1', 'a')).toBe(buildRoutingAbPrefix('run1', 'a'));
  });

  test('differs across arms and salts, so arms never warm each other', () => {
    expect(buildRoutingAbPrefix('run1', 'a')).not.toBe(buildRoutingAbPrefix('run1', 'b'));
    expect(buildRoutingAbPrefix('run1', 'a')).not.toBe(buildRoutingAbPrefix('run2', 'a'));
  });
});

describe('describeRoutingAbUsage', () => {
  test('reports usage absent', () => {
    expect(describeRoutingAbUsage(undefined)).toBe('usage absent from response');
  });

  test('reports ratio not computable when cachedInputTokens is absent', () => {
    expect(describeRoutingAbUsage(usage({ uncachedInputTokens: 8684 }))).toBe(
      'reports=reads cached=undefined uncached=8684 (ratio not computable)'
    );
  });

  test('formats a computable ratio', () => {
    expect(describeRoutingAbUsage(usage({ cachedInputTokens: 10048, uncachedInputTokens: 28 }))).toBe(
      'reports=reads cached=10048 of 10076 input (99.7%)'
    );
  });
});

describe('runPromptCacheRoutingAbArm', () => {
  const baseParams = { descriptor, apiKey: 'key', label: 'arm', salt: 'run1', arm: 'a' };

  test('fails, labeled, when the cold call fails', async () => {
    const deps: IPromptCacheRoutingAbDeps = { callCompletion: jest.fn().mockResolvedValue(fail('boom')) };
    await expect(runPromptCacheRoutingAbArm(deps, baseParams)).resolves.toFailWith(
      /arm: cold call failed: boom/
    );
  });

  test('fails, labeled, when the warm call fails', async () => {
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(usage({ uncachedInputTokens: 100, cachedInputTokens: 0 }))))
      .mockResolvedValueOnce(fail('timeout'));
    const deps: IPromptCacheRoutingAbDeps = { callCompletion };
    await expect(runPromptCacheRoutingAbArm(deps, baseParams)).resolves.toFailWith(
      /arm: warm call failed: timeout/
    );
  });

  test('omits cache when no cacheKey is supplied, and sends one when supplied', async () => {
    const coldUsage = usage({ uncachedInputTokens: 100, cachedInputTokens: 0 });
    const warmUsage = usage({ uncachedInputTokens: 100, cachedInputTokens: 0 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(coldUsage)))
      .mockResolvedValueOnce(succeed(response(warmUsage)));
    const deps: IPromptCacheRoutingAbDeps = { callCompletion };

    await runPromptCacheRoutingAbArm(deps, baseParams);
    const [firstCallNoKey] = callCompletion.mock.calls[0];
    expect(firstCallNoKey.cache).toBeUndefined();

    callCompletion.mockClear();
    callCompletion
      .mockResolvedValueOnce(succeed(response(coldUsage)))
      .mockResolvedValueOnce(succeed(response(warmUsage)));
    await runPromptCacheRoutingAbArm(deps, { ...baseParams, cacheKey: 'routing-ab-run1' });
    const [firstCallWithKey] = callCompletion.mock.calls[0];
    expect(firstCallWithKey.cache).toEqual({ cacheKey: 'routing-ab-run1' });
  });

  test('succeeds with the label and both calls usage, varying only the final user turn', async () => {
    const coldUsage = usage({ uncachedInputTokens: 100, cachedInputTokens: 0 });
    const warmUsage = usage({ uncachedInputTokens: 5, cachedInputTokens: 95 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(coldUsage)))
      .mockResolvedValueOnce(succeed(response(warmUsage)));
    const deps: IPromptCacheRoutingAbDeps = { callCompletion };

    expect(await runPromptCacheRoutingAbArm(deps, baseParams)).toSucceedWith({
      label: 'arm',
      coldUsage,
      warmUsage
    });
    const [[firstParams], [secondParams]] = callCompletion.mock.calls;
    expect(firstParams.system).toBe(secondParams.system);
    expect(firstParams.messages).not.toEqual(secondParams.messages);
  });
});

describe('runPromptCacheRoutingAbHarness', () => {
  const params = { descriptor, apiKey: 'key', salt: 'run1' };

  test('propagates a failure from the first arm', async () => {
    const deps: IPromptCacheRoutingAbDeps = { callCompletion: jest.fn().mockResolvedValue(fail('down')) };
    await expect(runPromptCacheRoutingAbHarness(deps, params)).resolves.toFailWith(/cold call failed: down/);
  });

  test('propagates a failure from the second arm', async () => {
    const okUsage = usage({ uncachedInputTokens: 100, cachedInputTokens: 0 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(okUsage))) // arm1 cold
      .mockResolvedValueOnce(succeed(response(okUsage))) // arm1 warm
      .mockResolvedValueOnce(fail('down')); // arm2 cold
    const deps: IPromptCacheRoutingAbDeps = { callCompletion };
    await expect(runPromptCacheRoutingAbHarness(deps, params)).resolves.toFailWith(/cold call failed: down/);
  });

  test("classifies from each arm's warm usage, not its cold usage", async () => {
    // Both arms' COLD calls look identical (near-zero); the arms differ only in their WARM
    // reading, which is exactly what the routing key is supposed to change.
    const coldBoth = usage({ uncachedInputTokens: 9884, cachedInputTokens: 192 });
    const warmWithoutKey = usage({ uncachedInputTokens: 9884, cachedInputTokens: 192 });
    const warmWithKey = usage({ uncachedInputTokens: 28, cachedInputTokens: 10048 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(coldBoth))) // arm1 cold
      .mockResolvedValueOnce(succeed(response(warmWithoutKey))) // arm1 warm
      .mockResolvedValueOnce(succeed(response(coldBoth))) // arm2 cold
      .mockResolvedValueOnce(succeed(response(warmWithKey))); // arm2 warm
    const deps: IPromptCacheRoutingAbDeps = { callCompletion };

    const result = await runPromptCacheRoutingAbHarness(deps, params);
    expect(result).toSucceedAndSatisfy((value: IPromptCacheRoutingAbResult) => {
      expect(value.verdict).toBe('confirms');
      expect(value.withoutKeyWarmRatio).toBeCloseTo(192 / 10076, 5);
      expect(value.withKeyWarmRatio).toBeCloseTo(10048 / 10076, 5);
      expect(value.withoutKey.label).toMatch(/WITHOUT cacheKey/);
      expect(value.withKey.label).toMatch(/WITH cacheKey/);
    });

    // arm2's calls carry the routing key; arm1's do not.
    const arm2Calls = callCompletion.mock.calls.slice(2).map(([p]) => p);
    expect(arm2Calls.every((p) => p.cache?.cacheKey === 'routing-ab-run1')).toBe(true);
    const arm1Calls = callCompletion.mock.calls.slice(0, 2).map(([p]) => p);
    expect(arm1Calls.every((p) => p.cache === undefined)).toBe(true);
  });

  test('misses when neither arm shows a cache hit', async () => {
    const flat = usage({ uncachedInputTokens: 9884, cachedInputTokens: 192 });
    const callCompletion = jest.fn().mockResolvedValue(succeed(response(flat)));
    const deps: IPromptCacheRoutingAbDeps = { callCompletion };
    const result = await runPromptCacheRoutingAbHarness(deps, params);
    expect(result).toSucceedAndSatisfy((value: IPromptCacheRoutingAbResult) => {
      expect(value.verdict).toBe('misses');
    });
  });

  test('is inconclusive when a warm usage block is absent', async () => {
    const flat = usage({ uncachedInputTokens: 9884, cachedInputTokens: 192 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(flat)))
      .mockResolvedValueOnce(succeed(response(undefined)))
      .mockResolvedValueOnce(succeed(response(flat)))
      .mockResolvedValueOnce(succeed(response(flat)));
    const deps: IPromptCacheRoutingAbDeps = { callCompletion };
    const result = await runPromptCacheRoutingAbHarness(deps, params);
    expect(result).toSucceedAndSatisfy((value: IPromptCacheRoutingAbResult) => {
      expect(value.verdict).toBe('inconclusive');
    });
  });
});

describe('formatRoutingAbVerdict', () => {
  const base: IPromptCacheRoutingAbResult = {
    withoutKey: { label: 'arm 1', coldUsage: undefined, warmUsage: undefined },
    withKey: { label: 'arm 2', coldUsage: undefined, warmUsage: undefined },
    verdict: 'confirms',
    withoutKeyWarmRatio: 0.019,
    withKeyWarmRatio: 0.997
  };

  test('formats CONFIRMS', () => {
    expect(formatRoutingAbVerdict(base)).toMatch(/CONFIRMS the prediction/);
  });

  test('formats MISSES', () => {
    expect(formatRoutingAbVerdict({ ...base, verdict: 'misses' })).toMatch(/MISSES the prediction/);
  });

  test('formats AMBIGUOUS', () => {
    expect(formatRoutingAbVerdict({ ...base, verdict: 'ambiguous' })).toMatch(/AMBIGUOUS/);
  });

  test('formats inconclusive', () => {
    expect(
      formatRoutingAbVerdict({
        ...base,
        verdict: 'inconclusive',
        withoutKeyWarmRatio: undefined,
        withKeyWarmRatio: undefined
      })
    ).toMatch(/inconclusive/);
  });
});
