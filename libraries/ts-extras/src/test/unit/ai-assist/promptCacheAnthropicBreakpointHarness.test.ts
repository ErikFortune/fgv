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
 * Unit tests for `perf/promptCacheAnthropicBreakpoint.js`'s extracted pure logic and injectable
 * transport — the first exercise of C3's Anthropic `cache_control` emission against a live
 * provider, and the CONFIRMS / MISSES / AMBIGUOUS / inconclusive verdict that classifies it.
 */

import '@fgv/ts-utils-jest';
import { fail, succeed } from '@fgv/ts-utils';

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  buildAnthropicBreakpointPrefix,
  describeAnthropicBreakpointUsage,
  formatAnthropicBreakpointVerdict,
  runPromptCacheAnthropicBreakpointArm,
  runPromptCacheAnthropicBreakpointHarness,
  withAnthropicZeroDefaults,
  type IPromptCacheAnthropicBreakpointDeps,
  type IPromptCacheAnthropicBreakpointResult
} from '../../../packlets/ai-assist/promptCacheAnthropicBreakpointHarness';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { type IAiCompletionResponse, type IAiProviderDescriptor } from '../../../packlets/ai-assist/model';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { type IAiCompletionUsage } from '../../../packlets/ai-assist/usageTypes';

function usage(partial: Partial<IAiCompletionUsage>): IAiCompletionUsage {
  return { reports: 'reads-and-writes', ...partial };
}

function response(usageValue: IAiCompletionUsage | undefined): IAiCompletionResponse {
  return { content: 'x', truncated: false, structuredOutput: 'none', usage: usageValue };
}

const descriptor = { id: 'anthropic' } as unknown as IAiProviderDescriptor;

describe('buildAnthropicBreakpointPrefix', () => {
  test('is deterministic for a given salt and arm', () => {
    expect(buildAnthropicBreakpointPrefix('run1', 'a')).toBe(buildAnthropicBreakpointPrefix('run1', 'a'));
  });

  test('differs across arms and salts, so arms and re-runs never warm each other', () => {
    expect(buildAnthropicBreakpointPrefix('run1', 'a')).not.toBe(buildAnthropicBreakpointPrefix('run1', 'b'));
    expect(buildAnthropicBreakpointPrefix('run1', 'a')).not.toBe(buildAnthropicBreakpointPrefix('run2', 'a'));
  });
});

describe('withAnthropicZeroDefaults', () => {
  test('passes through undefined', () => {
    expect(withAnthropicZeroDefaults(undefined)).toBeUndefined();
  });

  test('passes through a reads-only usage block unchanged', () => {
    const reads = { reports: 'reads' as const, uncachedInputTokens: 100 };
    expect(withAnthropicZeroDefaults(reads)).toBe(reads);
  });

  test('defaults absent cache fields to 0 on a reads-and-writes usage block', () => {
    expect(withAnthropicZeroDefaults(usage({ uncachedInputTokens: 100 }))).toEqual(
      usage({ uncachedInputTokens: 100, cachedInputTokens: 0, cacheWriteTokens: 0 })
    );
  });

  test('defaults every absent cache field, including uncachedInputTokens, to 0', () => {
    expect(withAnthropicZeroDefaults(usage({}))).toEqual(
      usage({ uncachedInputTokens: 0, cachedInputTokens: 0, cacheWriteTokens: 0 })
    );
  });

  test('leaves present cache fields untouched', () => {
    const present = usage({ uncachedInputTokens: 5, cachedInputTokens: 8684, cacheWriteTokens: 0 });
    expect(withAnthropicZeroDefaults(present)).toEqual(present);
  });
});

describe('describeAnthropicBreakpointUsage', () => {
  test('reports usage absent', () => {
    expect(describeAnthropicBreakpointUsage('cold', undefined)).toBe('cold: usage absent from response');
  });

  test('reports reads and writes separately', () => {
    expect(
      describeAnthropicBreakpointUsage(
        'warm',
        usage({ uncachedInputTokens: 12, cachedInputTokens: 8684, cacheWriteTokens: 0, outputTokens: 20 })
      )
    ).toBe('warm: reports=reads-and-writes uncached=12 cached=8684 (99.9% of input) written=0 output=20');
  });
});

describe('runPromptCacheAnthropicBreakpointArm', () => {
  const baseParams = {
    descriptor,
    apiKey: 'key',
    label: 'arm',
    salt: 'run1',
    arm: 'a',
    withBreakpoint: false
  };

  test('fails, labeled, when the cold call fails', async () => {
    const deps: IPromptCacheAnthropicBreakpointDeps = {
      callCompletion: jest.fn().mockResolvedValue(fail('boom'))
    };
    await expect(runPromptCacheAnthropicBreakpointArm(deps, baseParams)).resolves.toFailWith(
      /arm: cold call failed: boom/
    );
  });

  test('fails, labeled, when the warm call fails', async () => {
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(usage({ uncachedInputTokens: 100 }))))
      .mockResolvedValueOnce(fail('timeout'));
    const deps: IPromptCacheAnthropicBreakpointDeps = { callCompletion };
    await expect(runPromptCacheAnthropicBreakpointArm(deps, baseParams)).resolves.toFailWith(
      /arm: warm call failed: timeout/
    );
  });

  test('omits cache when withBreakpoint is false, and sends one breakpoint just short of system.length when true', async () => {
    const coldUsage = usage({ uncachedInputTokens: 100 });
    const warmUsage = usage({ uncachedInputTokens: 100 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(coldUsage)))
      .mockResolvedValueOnce(succeed(response(warmUsage)));
    const deps: IPromptCacheAnthropicBreakpointDeps = { callCompletion };

    await runPromptCacheAnthropicBreakpointArm(deps, baseParams);
    const [noBreakpointCall] = callCompletion.mock.calls[0];
    expect(noBreakpointCall.cache).toBeUndefined();

    callCompletion.mockClear();
    callCompletion
      .mockResolvedValueOnce(succeed(response(coldUsage)))
      .mockResolvedValueOnce(succeed(response(warmUsage)));
    await runPromptCacheAnthropicBreakpointArm(deps, { ...baseParams, withBreakpoint: true });
    const [withBreakpointCall] = callCompletion.mock.calls[0];
    expect(withBreakpointCall.cache).toEqual({
      systemBreakpoints: [(withBreakpointCall.system as string).length - 1]
    });
  });

  test('succeeds with the label and both calls usage, varying only the final user turn', async () => {
    const coldUsage = usage({ uncachedInputTokens: 8700, cacheWriteTokens: 8700 });
    const warmUsage = usage({ uncachedInputTokens: 12, cachedInputTokens: 8688 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(coldUsage)))
      .mockResolvedValueOnce(succeed(response(warmUsage)));
    const deps: IPromptCacheAnthropicBreakpointDeps = { callCompletion };

    expect(await runPromptCacheAnthropicBreakpointArm(deps, baseParams)).toSucceedWith({
      label: 'arm',
      coldUsage,
      warmUsage
    });
    const [[firstParams], [secondParams]] = callCompletion.mock.calls;
    expect(firstParams.system).toBe(secondParams.system);
    expect(firstParams.messages).not.toEqual(secondParams.messages);
  });
});

describe('runPromptCacheAnthropicBreakpointHarness', () => {
  const params = { descriptor, apiKey: 'key', salt: 'run1' };

  test('propagates a failure from the first arm', async () => {
    const deps: IPromptCacheAnthropicBreakpointDeps = {
      callCompletion: jest.fn().mockResolvedValue(fail('down'))
    };
    await expect(runPromptCacheAnthropicBreakpointHarness(deps, params)).resolves.toFailWith(
      /cold call failed: down/
    );
  });

  test('propagates a failure from the second arm', async () => {
    const okUsage = usage({ uncachedInputTokens: 100 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(okUsage))) // arm1 cold
      .mockResolvedValueOnce(succeed(response(okUsage))) // arm1 warm
      .mockResolvedValueOnce(fail('down')); // arm2 cold
    const deps: IPromptCacheAnthropicBreakpointDeps = { callCompletion };
    await expect(runPromptCacheAnthropicBreakpointHarness(deps, params)).resolves.toFailWith(
      /cold call failed: down/
    );
  });

  test('confirms when the negative-control arm omits cache fields entirely and the breakpoint arm hits', async () => {
    // arm 1 (no breakpoints): Anthropic sends no cache_control, so the wire response omits the
    // cache fields altogether — this is the expected negative-control shape, not a failure.
    const noBreakpointUsage = usage({ uncachedInputTokens: 100 });
    // arm 2 (breakpoints): cold call writes, warm call reads.
    const coldWithBreakpoint = usage({ uncachedInputTokens: 8700, cacheWriteTokens: 8700 });
    const warmWithBreakpoint = usage({ uncachedInputTokens: 12, cachedInputTokens: 8688 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(noBreakpointUsage))) // arm1 cold
      .mockResolvedValueOnce(succeed(response(noBreakpointUsage))) // arm1 warm
      .mockResolvedValueOnce(succeed(response(coldWithBreakpoint))) // arm2 cold
      .mockResolvedValueOnce(succeed(response(warmWithBreakpoint))); // arm2 warm
    const deps: IPromptCacheAnthropicBreakpointDeps = { callCompletion };

    const result = await runPromptCacheAnthropicBreakpointHarness(deps, params);
    expect(result).toSucceedAndSatisfy((value: IPromptCacheAnthropicBreakpointResult) => {
      expect(value.verdict).toBe('confirms');
      expect(value.withoutBreakpointWarmRatio).toBe(0);
      expect(value.withBreakpointWarmRatio).toBeCloseTo(8688 / 8700, 5);
      expect(value.withoutBreakpoint.label).toMatch(/WITHOUT systemBreakpoints/);
      expect(value.withBreakpoint.label).toMatch(/WITH systemBreakpoints/);
    });

    const arm1Calls = callCompletion.mock.calls.slice(0, 2).map(([p]) => p);
    expect(arm1Calls.every((p) => p.cache === undefined)).toBe(true);
    const arm2Calls = callCompletion.mock.calls.slice(2).map(([p]) => p);
    expect(arm2Calls.every((p) => p.cache?.systemBreakpoints?.length === 1)).toBe(true);
  });

  test('misses when the breakpoint arm shows no cache hit either', async () => {
    const flat = usage({ uncachedInputTokens: 8700 });
    const callCompletion = jest.fn().mockResolvedValue(succeed(response(flat)));
    const deps: IPromptCacheAnthropicBreakpointDeps = { callCompletion };
    const result = await runPromptCacheAnthropicBreakpointHarness(deps, params);
    expect(result).toSucceedAndSatisfy((value: IPromptCacheAnthropicBreakpointResult) => {
      expect(value.verdict).toBe('misses');
    });
  });

  test('is inconclusive when a warm usage block is absent', async () => {
    const flat = usage({ uncachedInputTokens: 8700, cachedInputTokens: 8600 });
    const callCompletion = jest
      .fn()
      .mockResolvedValueOnce(succeed(response(flat)))
      .mockResolvedValueOnce(succeed(response(undefined)))
      .mockResolvedValueOnce(succeed(response(flat)))
      .mockResolvedValueOnce(succeed(response(flat)));
    const deps: IPromptCacheAnthropicBreakpointDeps = { callCompletion };
    const result = await runPromptCacheAnthropicBreakpointHarness(deps, params);
    expect(result).toSucceedAndSatisfy((value: IPromptCacheAnthropicBreakpointResult) => {
      expect(value.verdict).toBe('inconclusive');
    });
  });
});

describe('formatAnthropicBreakpointVerdict', () => {
  const base: IPromptCacheAnthropicBreakpointResult = {
    withoutBreakpoint: { label: 'arm 1', coldUsage: undefined, warmUsage: undefined },
    withBreakpoint: { label: 'arm 2', coldUsage: undefined, warmUsage: undefined },
    verdict: 'confirms',
    withoutBreakpointWarmRatio: 0,
    withBreakpointWarmRatio: 0.998
  };

  test('formats CONFIRMS', () => {
    expect(formatAnthropicBreakpointVerdict(base)).toMatch(/CONFIRMS the prediction/);
  });

  test('formats MISSES', () => {
    expect(formatAnthropicBreakpointVerdict({ ...base, verdict: 'misses' })).toMatch(/MISSES the prediction/);
  });

  test('formats AMBIGUOUS', () => {
    expect(formatAnthropicBreakpointVerdict({ ...base, verdict: 'ambiguous' })).toMatch(/AMBIGUOUS/);
  });

  test('formats inconclusive', () => {
    expect(
      formatAnthropicBreakpointVerdict({
        ...base,
        verdict: 'inconclusive',
        withoutBreakpointWarmRatio: undefined,
        withBreakpointWarmRatio: undefined
      })
    ).toMatch(/inconclusive/);
  });
});
