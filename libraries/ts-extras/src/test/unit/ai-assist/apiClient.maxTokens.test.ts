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
 * Tests for the caller-configurable `maxTokens` option on
 * `callProviderCompletion` — split into its own file (rather than added to
 * `apiClient.test.ts`) to keep that file under the repo's max-lines lint
 * threshold, mirroring `clientToolAdaptiveThinking.test.ts`.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';

// ============================================================================
// Test helpers
// ============================================================================

const testPrompt = new AiAssist.AiPrompt('Generate a recipe', 'You are a helpful assistant');

function makeDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'xai-grok',
    label: 'xAI Grok',
    buttonLabel: 'AI Assist | Grok',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: 'grok-4-1-fast',
    supportedTools: ['web_search'],
    corsRestricted: true,
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    thinkingMode: 'optional',
    ...overrides
  };
}

function mockFetchResponse(body: unknown, status: number = 200): void {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body))
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

function openAiResponse(content: string): unknown {
  return { choices: [{ message: { content }, finish_reason: 'stop' }] };
}

function anthropicResponse(text: string): unknown {
  return { content: [{ type: 'text', text }], stop_reason: 'end_turn' };
}

function geminiResponse(text: string): unknown {
  return { candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] };
}

function responsesApiResponse(text: string): unknown {
  return {
    output: [{ type: 'message', id: 'msg_1', role: 'assistant', content: [{ type: 'output_text', text }] }],
    status: 'completed'
  };
}

describe('callProviderCompletion — maxTokens', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('openai chat-completions format (xAI, Groq, Mistral, Ollama, openai-compat)', () => {
    const descriptor = makeDescriptor({ apiFormat: 'openai' });

    test('omits both max_tokens and max_completion_tokens when maxTokens is not provided (xAI)', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.max_tokens).toBeUndefined();
      expect(body.max_completion_tokens).toBeUndefined();
    });

    test('sends maxTokens as max_tokens (not max_completion_tokens) for the xAI provider id', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        maxTokens: 8000
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.max_tokens).toBe(8000);
      expect(body.max_completion_tokens).toBeUndefined();
    });

    test('sends maxTokens as max_completion_tokens (not max_tokens) for the openai provider id', async () => {
      mockFetchResponse(openAiResponse('ok'));
      const openAiDescriptor = makeDescriptor({ id: 'openai', apiFormat: 'openai' });

      await AiAssist.callProviderCompletion({
        descriptor: openAiDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        maxTokens: 8000
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.max_completion_tokens).toBe(8000);
      expect(body.max_tokens).toBeUndefined();
    });

    test('omits max_completion_tokens when maxTokens is not provided (openai)', async () => {
      mockFetchResponse(openAiResponse('ok'));
      const openAiDescriptor = makeDescriptor({ id: 'openai', apiFormat: 'openai' });

      await AiAssist.callProviderCompletion({
        descriptor: openAiDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.max_completion_tokens).toBeUndefined();
      expect(body.max_tokens).toBeUndefined();
    });
  });

  describe('anthropic format', () => {
    const descriptor = makeDescriptor({
      id: 'anthropic',
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-sonnet-4-5-20250929'
    });

    test('defaults max_tokens to DEFAULT_ANTHROPIC_MAX_TOKENS when maxTokens is not provided', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.max_tokens).toBe(AiAssist.DEFAULT_ANTHROPIC_MAX_TOKENS);
    });

    test('overrides the default max_tokens with an explicit maxTokens', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        maxTokens: 16000
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.max_tokens).toBe(16000);
    });
  });

  describe('gemini format', () => {
    const descriptor = makeDescriptor({
      id: 'google-gemini',
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.5-flash'
    });

    test('omits generationConfig.maxOutputTokens when maxTokens is not provided', async () => {
      mockFetchResponse(geminiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.generationConfig.maxOutputTokens).toBeUndefined();
    });

    test('includes generationConfig.maxOutputTokens only when maxTokens is explicitly provided', async () => {
      mockFetchResponse(geminiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        maxTokens: 12000
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.generationConfig.maxOutputTokens).toBe(12000);
    });
  });

  describe('openai format with tools (Responses API)', () => {
    const descriptor = makeDescriptor({ apiFormat: 'openai' });
    const tools: AiAssist.AiServerToolConfig[] = [{ type: 'web_search' }];

    test('omits max_output_tokens when maxTokens is not provided (xAI via Responses API)', async () => {
      mockFetchResponse(responsesApiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.max_output_tokens).toBeUndefined();
    });

    test('sends maxTokens as max_output_tokens for xAI routed through the Responses API', async () => {
      mockFetchResponse(responsesApiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools,
        maxTokens: 9000
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.max_output_tokens).toBe(9000);
    });

    test('sends maxTokens as max_output_tokens for the openai provider id routed through the Responses API', async () => {
      mockFetchResponse(responsesApiResponse('ok'));
      const openAiDescriptor = makeDescriptor({ id: 'openai', apiFormat: 'openai' });

      await AiAssist.callProviderCompletion({
        descriptor: openAiDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools,
        maxTokens: 9000
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.max_output_tokens).toBe(9000);
      // The Responses API path uses one field name for every openai-format provider.
      expect(body.max_completion_tokens).toBeUndefined();
      expect(body.max_tokens).toBeUndefined();
    });
  });
});
