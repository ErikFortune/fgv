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
 * Tests for `IAiCompletionResponse.usage` normalization across the four
 * `callProviderCompletion` wire shapes (C1 of `ai-assist-prompt-caching`).
 */

/* eslint-disable @typescript-eslint/naming-convention -- wire field names are snake_case */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
import {
  anthropicResponse,
  geminiResponse,
  makeDescriptor,
  mockFetchResponse,
  openAiResponse,
  responsesApiResponse,
  testPrompt
} from './apiClientFixtures';

describe('callProviderCompletion usage reporting', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Anthropic Messages', () => {
    const descriptor = makeDescriptor({ apiFormat: 'anthropic' });

    test('reports reads-and-writes, with input_tokens already the remainder', async () => {
      mockFetchResponse(
        anthropicResponse('ok', 'end_turn', {
          usage: {
            input_tokens: 100,
            output_tokens: 20,
            cache_read_input_tokens: 40,
            cache_creation_input_tokens: 5
          }
        })
      );

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.usage).toEqual({
          reports: 'reads-and-writes',
          uncachedInputTokens: 100,
          cachedInputTokens: 40,
          cacheWriteTokens: 5,
          outputTokens: 20,
          totalInputTokens: 140,
          raw: {
            input_tokens: 100,
            output_tokens: 20,
            cache_read_input_tokens: 40,
            cache_creation_input_tokens: 5
          }
        });
      });
    });

    test('absent cache_creation_input_tokens means zero written, not unknown', async () => {
      mockFetchResponse(
        anthropicResponse('ok', 'end_turn', {
          usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 0 }
        })
      );

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.usage?.reports).toBe('reads-and-writes');
        expect(response.usage?.cacheWriteTokens).toBeUndefined();
      });
    });

    test('is absent when the response carries no usage block', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.usage).toBeUndefined();
      });
    });
  });

  describe('OpenAI Chat Completions', () => {
    const descriptor = makeDescriptor({ apiFormat: 'openai' });

    test('reports reads, subtracting the Gemini-style footgun does not apply here', async () => {
      mockFetchResponse(
        openAiResponse('ok', 'stop', {
          usage: {
            prompt_tokens: 100,
            completion_tokens: 20,
            prompt_tokens_details: { cached_tokens: 40 }
          }
        })
      );

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.usage).toEqual({
          reports: 'reads',
          uncachedInputTokens: 60,
          cachedInputTokens: 40,
          outputTokens: 20,
          totalInputTokens: 100,
          raw: { prompt_tokens: 100, completion_tokens: 20, prompt_tokens_details: { cached_tokens: 40 } }
        });
      });
    });

    test('never fills cacheWriteTokens — structurally unfillable on this API', async () => {
      mockFetchResponse(
        openAiResponse('ok', 'stop', {
          usage: { prompt_tokens: 100, completion_tokens: 20, prompt_tokens_details: { cached_tokens: 0 } }
        })
      );

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.usage?.reports).toBe('reads');
        expect('cacheWriteTokens' in (response.usage ?? {})).toBe(false);
      });
    });

    test('leaves cachedInputTokens/uncachedInputTokens undefined when prompt_tokens_details is absent', async () => {
      mockFetchResponse(
        openAiResponse('ok', 'stop', { usage: { prompt_tokens: 100, completion_tokens: 20 } })
      );

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.usage?.cachedInputTokens).toBeUndefined();
        expect(response.usage?.uncachedInputTokens).toBeUndefined();
        expect(response.usage?.totalInputTokens).toBeUndefined();
      });
    });
  });

  describe('OpenAI / xAI Responses', () => {
    const descriptor = makeDescriptor({ apiFormat: 'openai', supportedTools: ['web_search'] });

    test('OpenAI-shaped: cache_write_tokens present (even 0) reports reads-and-writes', async () => {
      mockFetchResponse(
        responsesApiResponse('ok', 'completed', {
          usage: {
            input_tokens: 100,
            output_tokens: 20,
            input_tokens_details: { cached_tokens: 40, cache_write_tokens: 0 }
          }
        })
      );

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }]
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.usage).toEqual({
          reports: 'reads-and-writes',
          uncachedInputTokens: 60,
          cachedInputTokens: 40,
          cacheWriteTokens: 0,
          outputTokens: 20,
          totalInputTokens: 100,
          raw: {
            input_tokens: 100,
            output_tokens: 20,
            input_tokens_details: { cached_tokens: 40, cache_write_tokens: 0 }
          }
        });
      });
    });

    test('xAI-shaped: cache_write_tokens absent entirely reports reads only', async () => {
      mockFetchResponse(
        responsesApiResponse('ok', 'completed', {
          usage: { input_tokens: 100, output_tokens: 20, input_tokens_details: { cached_tokens: 40 } }
        })
      );

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }]
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.usage?.reports).toBe('reads');
        expect(response.usage?.cacheWriteTokens).toBeUndefined();
        expect(response.usage?.cachedInputTokens).toBe(40);
      });
    });
  });

  describe('Gemini generateContent', () => {
    const descriptor = makeDescriptor({ apiFormat: 'gemini' });

    test('reports reads, subtracting cachedContentTokenCount out of promptTokenCount', async () => {
      mockFetchResponse(
        geminiResponse('ok', 'STOP', {
          usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, cachedContentTokenCount: 40 }
        })
      );

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.usage).toEqual({
          reports: 'reads',
          uncachedInputTokens: 60,
          cachedInputTokens: 40,
          outputTokens: 20,
          totalInputTokens: 100,
          raw: { promptTokenCount: 100, candidatesTokenCount: 20, cachedContentTokenCount: 40 }
        });
      });
    });

    test('leaves uncachedInputTokens undefined when cachedContentTokenCount is absent — never assumes zero', async () => {
      mockFetchResponse(
        geminiResponse('ok', 'STOP', { usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20 } })
      );

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.usage?.cachedInputTokens).toBeUndefined();
        expect(response.usage?.uncachedInputTokens).toBeUndefined();
        expect(response.usage?.outputTokens).toBe(20);
      });
    });
  });
});
