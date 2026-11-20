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
 * Direct unit tests for the per-wire-shape `usage` normalizers — the
 * validation-failure and undefined-input paths that are awkward to reach
 * through a full `callProviderCompletion` round trip.
 */

/* eslint-disable @typescript-eslint/naming-convention -- wire field names are snake_case */

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  normalizeAnthropicUsage,
  normalizeGeminiUsage,
  normalizeOpenAiChatUsage,
  normalizeOpenAiResponsesUsage
} from '../../../packlets/ai-assist/usageNormalization';

describe('usageNormalization', () => {
  describe('normalizeAnthropicUsage', () => {
    test('returns undefined when raw is undefined', () => {
      expect(normalizeAnthropicUsage(undefined)).toBeUndefined();
    });

    test('returns undefined when raw fails validation (missing required input_tokens)', () => {
      expect(normalizeAnthropicUsage({ output_tokens: 5 })).toBeUndefined();
    });

    test('leaves totalInputTokens undefined when cache_read_input_tokens is absent', () => {
      expect(normalizeAnthropicUsage({ input_tokens: 100, output_tokens: 20 })).toEqual({
        reports: 'reads-and-writes',
        uncachedInputTokens: 100,
        outputTokens: 20,
        raw: { input_tokens: 100, output_tokens: 20 }
      });
    });
  });

  describe('normalizeOpenAiChatUsage', () => {
    test('returns undefined when raw is undefined', () => {
      expect(normalizeOpenAiChatUsage(undefined)).toBeUndefined();
    });

    test('returns undefined when raw fails validation (wrong-typed field)', () => {
      expect(normalizeOpenAiChatUsage({ prompt_tokens: 'not-a-number' })).toBeUndefined();
    });

    test('omits outputTokens when completion_tokens is absent', () => {
      expect(normalizeOpenAiChatUsage({ prompt_tokens: 10 })).toEqual({
        reports: 'reads',
        raw: { prompt_tokens: 10 }
      });
    });
  });

  describe('normalizeOpenAiResponsesUsage', () => {
    test('returns undefined when raw is undefined', () => {
      expect(normalizeOpenAiResponsesUsage(undefined)).toBeUndefined();
    });

    test('returns undefined when raw fails validation (wrong-typed nested field)', () => {
      expect(
        normalizeOpenAiResponsesUsage({ input_tokens_details: { cached_tokens: 'nope' } })
      ).toBeUndefined();
    });

    test('reports reads when input_tokens_details is absent entirely', () => {
      expect(normalizeOpenAiResponsesUsage({ input_tokens: 50, output_tokens: 5 })).toEqual({
        reports: 'reads',
        outputTokens: 5,
        raw: { input_tokens: 50, output_tokens: 5 }
      });
    });
  });

  describe('normalizeGeminiUsage', () => {
    test('returns undefined when raw is undefined', () => {
      expect(normalizeGeminiUsage(undefined)).toBeUndefined();
    });

    test('returns undefined when raw fails validation (wrong-typed field)', () => {
      expect(normalizeGeminiUsage({ promptTokenCount: 'nope' })).toBeUndefined();
    });

    test('reports reads with no fields set when the block is empty', () => {
      expect(normalizeGeminiUsage({})).toEqual({ reports: 'reads', raw: {} });
    });
  });
});
