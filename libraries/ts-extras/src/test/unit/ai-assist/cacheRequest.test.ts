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
 * Tests for `IAiCacheRequest` offset validation and the shared system-string
 * splitting helper (design.md §6.1, C3 of `ai-assist-prompt-caching`).
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { splitSystemForCache } from '../../../packlets/ai-assist/cacheRequest';

describe('validateAiCacheRequest', () => {
  const system = '0123456789'; // length 10

  test('succeeds when systemBreakpoints is undefined', () => {
    expect(AiAssist.validateAiCacheRequest(system, {})).toSucceedWith({});
  });

  test('succeeds when systemBreakpoints is empty', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [] };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toSucceedWith(cache);
  });

  test('succeeds with strictly ascending, in-range offsets', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [3, 7] };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toSucceedWith(cache);
  });

  test('fails when an offset is not strictly ascending (equal to the previous)', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [3, 3] };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toFailWith(/strictly ascending/i);
  });

  test('fails when an offset is not strictly ascending (less than the previous)', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [5, 2] };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toFailWith(/strictly ascending/i);
  });

  test('fails when an offset is zero', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [0] };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toFailWith(/integer strictly between/i);
  });

  test('fails when an offset is negative', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [-1] };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toFailWith(/integer strictly between/i);
  });

  test('fails when an offset equals system.length', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [system.length] };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toFailWith(/integer strictly between/i);
  });

  test('fails when an offset exceeds system.length', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [system.length + 5] };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toFailWith(/integer strictly between/i);
  });

  test('fails when an offset is not an integer', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [3.5] };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toFailWith(/integer strictly between/i);
  });

  test('fails on an empty system string — every offset is necessarily out of range', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [1] };
    expect(AiAssist.validateAiCacheRequest('', cache)).toFailWith(/integer strictly between/i);
  });

  test('never clamps — an out-of-range offset fails rather than being silently dropped', () => {
    // Two valid offsets plus one out-of-range one: the whole request fails, not a plan with
    // the bad offset quietly removed. design.md §6.1: "never clamped."
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [2, 4, 999] };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toFail();
  });

  test('fails when the breakpoint count exceeds an explicit cap', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [2, 4, 6] };
    expect(AiAssist.validateAiCacheRequest(system, cache, 2)).toFailWith(/exceeding the cap of 2/i);
  });

  test('succeeds at exactly the cap', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [2, 4] };
    expect(AiAssist.validateAiCacheRequest(system, cache, 2)).toSucceedWith(cache);
  });

  test('omitted cap never rejects on count alone', () => {
    const cache: AiAssist.IAiCacheRequest = { systemBreakpoints: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toSucceedWith(cache);
  });

  test('cacheKey is passed through untouched and unvalidated', () => {
    const cache: AiAssist.IAiCacheRequest = { cacheKey: 'tenant-42' };
    expect(AiAssist.validateAiCacheRequest(system, cache)).toSucceedWith(cache);
  });
});

describe('splitSystemForCache', () => {
  const system = 'ABCDEFGHIJ'; // length 10

  test('returns the whole string as one non-breakpointed segment when cache is undefined', () => {
    expect(splitSystemForCache(system, undefined)).toSucceedWith([{ text: system, cacheBreakpoint: false }]);
  });

  test('returns the whole string as one non-breakpointed segment when systemBreakpoints is empty', () => {
    expect(splitSystemForCache(system, { systemBreakpoints: [] })).toSucceedWith([
      { text: system, cacheBreakpoint: false }
    ]);
  });

  test('splits at a single breakpoint into a marked prefix and an unmarked tail', () => {
    expect(splitSystemForCache(system, { systemBreakpoints: [4] })).toSucceedWith([
      { text: 'ABCD', cacheBreakpoint: true },
      { text: 'EFGHIJ', cacheBreakpoint: false }
    ]);
  });

  test('splits at two breakpoints into two marked segments and an unmarked tail', () => {
    expect(splitSystemForCache(system, { systemBreakpoints: [3, 7] })).toSucceedWith([
      { text: 'ABC', cacheBreakpoint: true },
      { text: 'DEFG', cacheBreakpoint: true },
      { text: 'HIJ', cacheBreakpoint: false }
    ]);
  });

  test('segments concatenate back to the original system string exactly', () => {
    const result = splitSystemForCache(system, { systemBreakpoints: [2, 5, 8] });
    expect(result).toSucceedAndSatisfy((segments) => {
      expect(segments.map((s) => s.text).join('')).toBe(system);
    });
  });

  test('propagates a validation failure rather than splitting anyway', () => {
    expect(splitSystemForCache(system, { systemBreakpoints: [5, 3] })).toFailWith(/strictly ascending/i);
  });

  test('propagates the cap check when supplied', () => {
    expect(splitSystemForCache(system, { systemBreakpoints: [2, 4, 6] }, 1)).toFailWith(/exceeding the cap/i);
  });
});
