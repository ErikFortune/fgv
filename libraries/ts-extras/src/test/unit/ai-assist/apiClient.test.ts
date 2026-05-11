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

function mockFetchError(error: Error): void {
  (global.fetch as jest.Mock).mockRejectedValue(error);
}

function mockFetchHttpError(status: number, errorText: string): void {
  const response = {
    ok: false,
    status,
    text: jest.fn().mockResolvedValue(errorText)
  };
  (global.fetch as jest.Mock).mockResolvedValue(response);
}

// ============================================================================
// OpenAI response helpers
// ============================================================================

function openAiResponse(content: string, finishReason: string = 'stop'): unknown {
  return {
    choices: [
      {
        message: { content },
        finish_reason: finishReason
      }
    ]
  };
}

// ============================================================================
// Anthropic response helpers
// ============================================================================

function anthropicResponse(text: string, stopReason: string = 'end_turn'): unknown {
  return {
    content: [{ type: 'text', text }],
    stop_reason: stopReason
  };
}

// ============================================================================
// Gemini response helpers
// ============================================================================

function geminiResponse(text: string, finishReason: string = 'STOP'): unknown {
  return {
    candidates: [
      {
        content: {
          parts: [{ text }]
        },
        finishReason
      }
    ]
  };
}

// ============================================================================
// Responses API response helpers (xAI/OpenAI with tools)
// ============================================================================

function responsesApiResponse(text: string, status: string = 'completed'): unknown {
  return {
    output: [
      { type: 'web_search_call', id: 'ws_1', status: 'completed' },
      {
        type: 'message',
        id: 'msg_1',
        role: 'assistant',
        content: [{ type: 'output_text', text }]
      }
    ],
    status
  };
}

// ============================================================================
// Anthropic with tools response helpers
// ============================================================================

/* eslint-disable @typescript-eslint/naming-convention */
function anthropicWithToolsResponse(text: string): unknown {
  return {
    content: [
      { type: 'text', text: "I'll search for that." },
      { type: 'server_tool_use', id: 'st_1', name: 'web_search', input: { query: 'test' } },
      { type: 'web_search_tool_result', tool_use_id: 'st_1', content: [] },
      { type: 'text', text }
    ],
    stop_reason: 'end_turn'
  };
}
/* eslint-enable @typescript-eslint/naming-convention */

// ============================================================================
// Tests
// ============================================================================

describe('callProviderCompletion', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // ==========================================================================
  // Common error paths
  // ==========================================================================

  describe('common validation', () => {
    test('fails when descriptor has no baseUrl', async () => {
      const descriptor = makeDescriptor({ baseUrl: '' });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/no API endpoint/i);
    });

    test('fails when fetch throws a network error', async () => {
      mockFetchError(new Error('ECONNREFUSED'));
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/ECONNREFUSED/);
    });

    test('handles non-Error fetch rejection', async () => {
      (global.fetch as jest.Mock).mockRejectedValue('network down');
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/network down/);
    });

    test('fails when API returns non-200 status', async () => {
      mockFetchHttpError(429, 'Rate limit exceeded');
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/429/);
    });

    test('fails when API returns invalid JSON', async () => {
      const response = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token'))
      };
      (global.fetch as jest.Mock).mockResolvedValue(response);
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/invalid JSON/i);
    });

    test('fails when API returns non-object JSON', async () => {
      mockFetchResponse('just a string');
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/non-object JSON/i);
    });

    test('uses modelOverride when provided', async () => {
      mockFetchResponse(openAiResponse('hello'));
      const descriptor = makeDescriptor();

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        modelOverride: 'custom-model'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('custom-model');
    });
  });

  // ==========================================================================
  // AbortSignal threading — one assertion per format proves wire-through.
  // ==========================================================================

  describe('abort signal', () => {
    test.each([
      ['openai (chat completions)', makeDescriptor({ apiFormat: 'openai' }), () => openAiResponse('ok')],
      [
        'openai (Responses API with tools)',
        makeDescriptor({ apiFormat: 'openai' }),
        () => responsesApiResponse('ok')
      ],
      ['anthropic', makeDescriptor({ apiFormat: 'anthropic' }), () => anthropicResponse('ok')],
      ['gemini', makeDescriptor({ apiFormat: 'gemini' }), () => geminiResponse('ok')]
    ])('forwards signal to fetch for %s', async (label, descriptor, makeBody) => {
      mockFetchResponse(makeBody());
      const controller = new AbortController();
      const isResponsesApi = label.includes('Responses API');

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        signal: controller.signal,
        tools: isResponsesApi ? [{ type: 'web_search' }] : undefined
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].signal).toBe(controller.signal);
    });

    test('surfaces AbortError as a failure', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetchError(abortError);
      const descriptor = makeDescriptor({ apiFormat: 'openai' });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        signal: new AbortController().signal
      });

      expect(result).toFailWith(/aborted/i);
    });
  });

  // ==========================================================================
  // OpenAI-compatible (xAI, OpenAI, Groq, Mistral)
  // ==========================================================================

  describe('openai format', () => {
    const descriptor = makeDescriptor({ apiFormat: 'openai' });

    test('returns completion content on success', async () => {
      mockFetchResponse(openAiResponse('Here is a recipe for chocolate truffles'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.content).toBe('Here is a recipe for chocolate truffles');
        expect(response.truncated).toBe(false);
      });
    });

    test('detects truncation via finish_reason=length', async () => {
      mockFetchResponse(openAiResponse('partial...', 'length'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.truncated).toBe(true);
      });
    });

    test('sends correct request structure', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        temperature: 0.5
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.x.ai/v1/chat/completions');
      // eslint-disable-next-line dot-notation
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer test-key');

      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('grok-4-1-fast');
      expect(body.temperature).toBe(0.5);
      expect(body.messages).toEqual([
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Generate a recipe' }
      ]);
    });

    test('includes additional messages', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        additionalMessages: [
          { role: 'assistant', content: 'first attempt' },
          { role: 'user', content: 'try again' }
        ]
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.messages).toHaveLength(4);
      expect(body.messages[2]).toEqual({ role: 'assistant', content: 'first attempt' });
      expect(body.messages[3]).toEqual({ role: 'user', content: 'try again' });
    });

    test('fails when response has invalid structure', async () => {
      mockFetchResponse({ choices: [] });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/OpenAI API response/i);
    });
  });

  // ==========================================================================
  // Anthropic
  // ==========================================================================

  describe('anthropic format', () => {
    const descriptor = makeDescriptor({
      id: 'anthropic',
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-sonnet-4-5-20250929'
    });

    test('returns completion content on success', async () => {
      mockFetchResponse(anthropicResponse('Claude says hello'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.content).toBe('Claude says hello');
        expect(response.truncated).toBe(false);
      });
    });

    test('detects truncation via stop_reason=max_tokens', async () => {
      mockFetchResponse(anthropicResponse('partial...', 'max_tokens'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.truncated).toBe(true);
      });
    });

    test('sends correct request structure', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.anthropic.com/v1/messages');
      expect(fetchCall[1].headers['x-api-key']).toBe('test-key');
      expect(fetchCall[1].headers['anthropic-version']).toBe('2023-06-01');

      const body = JSON.parse(fetchCall[1].body);
      expect(body.system).toBe('You are a helpful assistant');
      expect(body.messages[0]).toEqual({ role: 'user', content: 'Generate a recipe' });
      expect(body.max_tokens).toBe(4096);
    });

    test('filters system role from additional messages', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        additionalMessages: [
          { role: 'assistant', content: 'first attempt' },
          { role: 'system', content: 'should be skipped' },
          { role: 'user', content: 'try again' }
        ]
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      // user + assistant + user (system filtered out)
      expect(body.messages).toHaveLength(3);
      expect(body.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant', 'user']);
    });

    test('fails when response content is not an array', async () => {
      mockFetchResponse({ content: 'not-an-array', stop_reason: 'end_turn' });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/content is not an array/i);
    });

    test('fails when response content has no text blocks', async () => {
      mockFetchResponse({ content: [] });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/no text content blocks/i);
    });

    test('fails when fetch throws a network error', async () => {
      mockFetchError(new Error('Connection timeout'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/Connection timeout/);
    });
  });

  // ==========================================================================
  // Google Gemini
  // ==========================================================================

  describe('gemini format', () => {
    const descriptor = makeDescriptor({
      id: 'google-gemini',
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.5-flash'
    });

    test('returns completion content on success', async () => {
      mockFetchResponse(geminiResponse('Gemini says hello'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.content).toBe('Gemini says hello');
        expect(response.truncated).toBe(false);
      });
    });

    test('detects truncation via finishReason=MAX_TOKENS', async () => {
      mockFetchResponse(geminiResponse('partial...', 'MAX_TOKENS'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.truncated).toBe(true);
      });
    });

    test('sends correct request structure', async () => {
      mockFetchResponse(geminiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
      );
      expect(fetchCall[1].headers['x-goog-api-key']).toBe('test-key');

      const body = JSON.parse(fetchCall[1].body);
      expect(body.systemInstruction).toEqual({ parts: [{ text: 'You are a helpful assistant' }] });
      expect(body.contents[0]).toEqual({ role: 'user', parts: [{ text: 'Generate a recipe' }] });
      expect(body.generationConfig.temperature).toBe(0.7);
    });

    test('maps assistant role to model and filters system', async () => {
      mockFetchResponse(geminiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        additionalMessages: [
          { role: 'assistant', content: 'first attempt' },
          { role: 'system', content: 'should be skipped' },
          { role: 'user', content: 'try again' }
        ]
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      // user + model + user (system filtered, assistant mapped to model)
      expect(body.contents).toHaveLength(3);
      expect(body.contents[1]).toEqual({ role: 'model', parts: [{ text: 'first attempt' }] });
      expect(body.contents[2]).toEqual({ role: 'user', parts: [{ text: 'try again' }] });
    });

    test('fails when response has invalid structure', async () => {
      mockFetchResponse({ candidates: [] });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/Gemini API response/i);
    });

    test('fails when fetch throws a network error', async () => {
      mockFetchError(new Error('DNS resolution failed'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/DNS resolution failed/);
    });
  });

  // ==========================================================================
  // OpenAI Responses API (with tools)
  // ==========================================================================

  describe('openai format with tools (Responses API)', () => {
    const descriptor = makeDescriptor({ apiFormat: 'openai' });
    const tools: AiAssist.AiServerToolConfig[] = [{ type: 'web_search' }];

    test('switches to /responses endpoint when tools provided', async () => {
      mockFetchResponse(responsesApiResponse('Result from web search'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.x.ai/v1/responses');
    });

    test('includes tools in request body', async () => {
      mockFetchResponse(responsesApiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.tools).toEqual([{ type: 'web_search' }]);
      expect(body.input).toBeDefined();
    });

    test('selects tools model from ModelSpec when tools provided', async () => {
      const splitDescriptor = makeDescriptor({
        defaultModel: { base: 'grok-fast', tools: 'grok-reasoning' }
      });
      mockFetchResponse(responsesApiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor: splitDescriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('grok-reasoning');
    });

    test('selects base model from ModelSpec when no tools', async () => {
      const splitDescriptor = makeDescriptor({
        defaultModel: { base: 'grok-fast', tools: 'grok-reasoning' }
      });
      mockFetchResponse(openAiResponse('no tools'));

      await AiAssist.callProviderCompletion({
        descriptor: splitDescriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('grok-fast');
    });

    test('extracts text from Responses API output', async () => {
      mockFetchResponse(responsesApiResponse('Web search found: chocolate truffles'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.content).toBe('Web search found: chocolate truffles');
        expect(response.truncated).toBe(false);
      });
    });

    test('detects truncation via incomplete status', async () => {
      mockFetchResponse(responsesApiResponse('partial...', 'incomplete'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.truncated).toBe(true);
      });
    });

    test('fails when output has no message items', async () => {
      mockFetchResponse({
        output: [{ type: 'web_search_call', id: 'ws_1', status: 'completed' }],
        status: 'completed'
      });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      expect(result).toFailWith(/no message with text content/i);
    });

    test('fails when fetch throws a network error', async () => {
      mockFetchError(new Error('ECONNREFUSED'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      expect(result).toFailWith(/ECONNREFUSED/i);
    });

    test('uses Chat Completions when no tools provided', async () => {
      mockFetchResponse(openAiResponse('no tools'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.x.ai/v1/chat/completions');
    });
  });

  // ==========================================================================
  // Anthropic with tools
  // ==========================================================================

  describe('anthropic format with tools', () => {
    const descriptor = makeDescriptor({
      id: 'anthropic',
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-sonnet-4-5-20250929'
    });
    const tools: AiAssist.AiServerToolConfig[] = [{ type: 'web_search' }];

    test('includes tools in request body', async () => {
      mockFetchResponse(anthropicWithToolsResponse('Result with search'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.tools).toEqual([{ type: 'web_search_20250305', name: 'web_search' }]);
    });

    test('extracts text from mixed content blocks', async () => {
      mockFetchResponse(anthropicWithToolsResponse('Found via web search'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      expect(result).toSucceedAndSatisfy((response) => {
        // Both text blocks concatenated
        expect(response.content).toContain('Found via web search');
        expect(response.truncated).toBe(false);
      });
    });

    test('concatenates multiple text blocks', async () => {
      mockFetchResponse({
        content: [
          { type: 'text', text: 'Part one. ' },
          { type: 'server_tool_use', id: 'st_1', name: 'web_search', input: { query: 'test' } },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          { type: 'web_search_tool_result', tool_use_id: 'st_1', content: [] },
          { type: 'text', text: 'Part two.' }
        ],
        stop_reason: 'end_turn'
      });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.content).toBe('Part one. Part two.');
      });
    });

    test('fails when no text blocks in response', async () => {
      mockFetchResponse({
        content: [
          { type: 'server_tool_use', id: 'st_1', name: 'web_search', input: { query: 'test' } },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          { type: 'web_search_tool_result', tool_use_id: 'st_1', content: [] }
        ],
        stop_reason: 'end_turn'
      });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      expect(result).toFailWith(/no text content/i);
    });

    test('fails when content is not an array', async () => {
      mockFetchResponse({
        content: 'not an array',
        stop_reason: 'end_turn'
      });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      expect(result).toFailWith(/content is not an array/i);
    });
  });

  // ==========================================================================
  // Gemini with tools
  // ==========================================================================

  describe('gemini format with tools', () => {
    const descriptor = makeDescriptor({
      id: 'google-gemini',
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.5-flash'
    });
    const tools: AiAssist.AiServerToolConfig[] = [{ type: 'web_search' }];

    test('includes google_search tool in request body', async () => {
      mockFetchResponse(geminiResponse('Grounded result'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.tools).toEqual([{ google_search: {} }]);
    });

    test('returns text content with tools', async () => {
      mockFetchResponse(geminiResponse('Search grounded answer'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        tools
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.content).toBe('Search grounded answer');
      });
    });
  });
});

// ============================================================================
// Image input (vision) across chat adapters
// ============================================================================

const TEST_PNG: AiAssist.IAiImageAttachment = {
  mimeType: 'image/png',
  base64: 'AAAA'
};
const TEST_JPEG: AiAssist.IAiImageAttachment = {
  mimeType: 'image/jpeg',
  base64: 'BBBB',
  detail: 'high'
};

function visionPrompt(...attachments: AiAssist.IAiImageAttachment[]): AiAssist.AiPrompt {
  return new AiAssist.AiPrompt('what is in this picture?', 'You see all.', attachments);
}

// ============================================================================
// Thinking-config wire encoding (non-streaming)
// ============================================================================

describe('thinking-config wire encoding (non-streaming)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('OpenAI chat completions', () => {
    const descriptor = makeDescriptor({
      id: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o',
      corsRestricted: false
    });

    test('includes reasoning_effort and omits temperature when thinking effort provided', async () => {
      mockFetchResponse(openAiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: { effort: 'high' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning_effort).toBe('high');
      expect(body.temperature).toBeUndefined();
    });

    test('merges other-block params into OpenAI chat body', async () => {
      mockFetchResponse(openAiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: {
          providers: [{ provider: 'other', models: ['gpt-4o'], config: { custom_param: 'v' } }]
        }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.custom_param).toBe('v');
    });

    test('fails when thinking and temperature conflict on OpenAI', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: { effort: 'high' },
        temperature: 0.7
      });
      expect(result).toFailWith(/thinking mode is not compatible with temperature on provider openai/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('allows temperature when OpenAI effort is none (A1 edge case)', async () => {
      mockFetchResponse(openAiResponse('ok'));
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: { providers: [{ provider: 'openai', config: { effort: 'none' } }] },
        temperature: 0.7
      });
      expect(result).toSucceed();
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning_effort).toBe('none');
      expect(body.temperature).toBe(0.7);
    });
  });

  describe('OpenAI Responses API with tools', () => {
    const descriptor = makeDescriptor({
      id: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o',
      corsRestricted: false
    });
    const tools: ReadonlyArray<AiAssist.AiServerToolConfig> = [{ type: 'web_search' }];

    test('includes reasoning and omits temperature in Responses API body when thinking provided', async () => {
      mockFetchResponse(responsesApiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        tools,
        thinking: { effort: 'medium' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning).toEqual({ effort: 'medium' });
      expect(body.temperature).toBeUndefined();
    });

    test('merges other-block params into Responses API body', async () => {
      mockFetchResponse(responsesApiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        tools,
        thinking: {
          providers: [{ provider: 'other', models: ['gpt-4o'], config: { extra_param: 99 } }]
        }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.extra_param).toBe(99);
    });
  });

  describe('xAI (openai-format adapter)', () => {
    const descriptor = makeDescriptor({
      id: 'xai-grok',
      baseUrl: 'https://api.x.ai/v1',
      defaultModel: 'grok-4.3',
      corsRestricted: false
    });

    test('sends xaiEffort as reasoning_effort and omits temperature', async () => {
      mockFetchResponse(openAiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: { effort: 'medium' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning_effort).toBe('medium');
      expect(body.temperature).toBeUndefined();
    });

    test('allows temperature when xAI effort is none', async () => {
      mockFetchResponse(openAiResponse('ok'));
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: { providers: [{ provider: 'xai', config: { effort: 'none' } }] },
        temperature: 0.5
      });
      expect(result).toSucceed();
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning_effort).toBe('none');
      expect(body.temperature).toBe(0.5);
    });
  });

  describe('Anthropic', () => {
    const descriptor = makeDescriptor({
      id: 'anthropic',
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-sonnet-4-5',
      corsRestricted: false
    });

    test('includes thinking wire fields when thinking effort provided', async () => {
      mockFetchResponse(anthropicResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: { effort: 'high' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.thinking).toEqual({ type: 'enabled' });
      expect(body.output_config).toEqual({ effort: 'high' });
      expect(body.temperature).toBeUndefined();
    });

    test('merges other-block params into Anthropic body', async () => {
      mockFetchResponse(anthropicResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: {
          providers: [
            {
              provider: 'other',
              models: ['claude-sonnet-4-5'],
              config: { anthropic_extra: true }
            }
          ]
        }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.anthropic_extra).toBe(true);
    });

    test('fails when thinking and temperature conflict on Anthropic', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: { effort: 'high' },
        temperature: 0.7
      });
      expect(result).toFailWith(/thinking mode is not compatible with temperature on provider anthropic/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Gemini', () => {
    const descriptor = makeDescriptor({
      id: 'google-gemini',
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.5-flash',
      corsRestricted: false
    });

    test('includes thinkingConfig in generationConfig when thinking effort provided', async () => {
      mockFetchResponse(geminiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: { effort: 'low' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 1024 });
    });

    test('merges other-block params into Gemini generationConfig', async () => {
      mockFetchResponse(geminiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: {
          providers: [
            {
              provider: 'other',
              models: ['gemini-2.5-flash'],
              config: { gemini_extra_param: 'value' }
            }
          ]
        }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.generationConfig.gemini_extra_param).toBe('value');
    });

    test('keeps temperature alongside thinking (Gemini does not reject)', async () => {
      mockFetchResponse(geminiResponse('ok'));
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        prompt: testPrompt,
        thinking: { effort: 'high' },
        temperature: 0.7
      });
      expect(result).toSucceed();
    });
  });

  describe('unknown provider — thinking skipped gracefully', () => {
    test('thinking is ignored for providers without a discriminator (ollama)', async () => {
      mockFetchResponse(openAiResponse('ok'));
      const result = await AiAssist.callProviderCompletion({
        descriptor: makeDescriptor({
          id: 'ollama',
          baseUrl: 'http://localhost:11434/v1',
          defaultModel: 'llama3.2',
          corsRestricted: false
        }),
        apiKey: '',
        prompt: testPrompt,
        thinking: { effort: 'high' }
      });
      expect(result).toSucceed();
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning_effort).toBeUndefined();
    });
  });
});

describe('image input (vision) — pre-flight', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('rejects when attachments present and provider does not accept image input', async () => {
    const descriptor = makeDescriptor({ acceptsImageInput: false });

    const result = await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: visionPrompt(TEST_PNG)
    });

    expect(result).toFailWith(/does not accept image input/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('passes through when attachments empty even on non-vision provider', async () => {
    const descriptor = makeDescriptor({ acceptsImageInput: false });
    mockFetchResponse(openAiResponse('ok'));

    const result = await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: testPrompt
    });

    expect(result).toSucceed();
  });
});

describe('image input — openai chat completions', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('user message becomes a parts array with image_url', async () => {
    mockFetchResponse(openAiResponse('a cat'));
    const descriptor = makeDescriptor({ apiFormat: 'openai', acceptsImageInput: true });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: visionPrompt(TEST_PNG)
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userMsg = body.messages.find((m: { role: string }) => m.role === 'user');
    expect(Array.isArray(userMsg.content)).toBe(true);
    expect(userMsg.content[0]).toEqual({ type: 'text', text: 'what is in this picture?' });
    expect(userMsg.content[1]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/png;base64,AAAA' }
    });
  });

  test('forwards detail hint when supplied', async () => {
    mockFetchResponse(openAiResponse('ok'));
    const descriptor = makeDescriptor({ apiFormat: 'openai', acceptsImageInput: true });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: visionPrompt(TEST_JPEG)
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userMsg = body.messages.find((m: { role: string }) => m.role === 'user');
    expect(userMsg.content[1]).toEqual({
      type: 'image_url',
      image_url: { url: 'data:image/jpeg;base64,BBBB', detail: 'high' }
    });
  });

  test('keeps user content as a string when no attachments', async () => {
    mockFetchResponse(openAiResponse('ok'));
    const descriptor = makeDescriptor({ apiFormat: 'openai' });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: testPrompt
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userMsg = body.messages.find((m: { role: string }) => m.role === 'user');
    expect(typeof userMsg.content).toBe('string');
  });

  test('attaches multiple images in the same user message', async () => {
    mockFetchResponse(openAiResponse('ok'));
    const descriptor = makeDescriptor({ apiFormat: 'openai', acceptsImageInput: true });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: visionPrompt(TEST_PNG, TEST_JPEG)
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userMsg = body.messages.find((m: { role: string }) => m.role === 'user');
    expect(userMsg.content).toHaveLength(3); // text + 2 images
    expect(userMsg.content[1].type).toBe('image_url');
    expect(userMsg.content[2].type).toBe('image_url');
  });
});

describe('image input — openai responses API', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('user message uses input_text and input_image part types', async () => {
    mockFetchResponse(responsesApiResponse('ok'));
    const descriptor = makeDescriptor({ apiFormat: 'openai', acceptsImageInput: true });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: visionPrompt(TEST_PNG),
      tools: [{ type: 'web_search' }] // forces Responses API path
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userInput = body.input.find((m: { role: string }) => m.role === 'user');
    expect(userInput.content[0]).toEqual({ type: 'input_text', text: 'what is in this picture?' });
    expect(userInput.content[1]).toEqual({
      type: 'input_image',
      image_url: 'data:image/png;base64,AAAA'
    });
  });

  test('forwards detail hint on input_image', async () => {
    mockFetchResponse(responsesApiResponse('ok'));
    const descriptor = makeDescriptor({ apiFormat: 'openai', acceptsImageInput: true });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: visionPrompt(TEST_JPEG),
      tools: [{ type: 'web_search' }]
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userInput = body.input.find((m: { role: string }) => m.role === 'user');
    expect(userInput.content[1]).toEqual({
      type: 'input_image',
      image_url: 'data:image/jpeg;base64,BBBB',
      detail: 'high'
    });
  });
});

describe('image input — anthropic', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('user message becomes a parts array with image source block', async () => {
    mockFetchResponse(anthropicResponse('ok'));
    const descriptor = makeDescriptor({
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      acceptsImageInput: true
    });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: visionPrompt(TEST_PNG)
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userMsg = body.messages[0];
    expect(userMsg.content[0]).toEqual({ type: 'text', text: 'what is in this picture?' });
    expect(userMsg.content[1]).toEqual({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: 'AAAA' }
    });
  });

  test('preserves system as a top-level field with attachments', async () => {
    mockFetchResponse(anthropicResponse('ok'));
    const descriptor = makeDescriptor({
      apiFormat: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      acceptsImageInput: true
    });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: visionPrompt(TEST_PNG)
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.system).toBe('You see all.');
  });
});

describe('image input — gemini', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('user parts include inlineData block', async () => {
    mockFetchResponse(geminiResponse('ok'));
    const descriptor = makeDescriptor({
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      acceptsImageInput: true,
      streamingCorsRestricted: false,
      defaultModel: 'gemini-2.5-flash'
    });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: visionPrompt(TEST_PNG)
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const userTurn = body.contents[0];
    expect(userTurn.role).toBe('user');
    expect(userTurn.parts[0]).toEqual({ text: 'what is in this picture?' });
    expect(userTurn.parts[1]).toEqual({
      inlineData: { mimeType: 'image/png', data: 'AAAA' }
    });
  });
});

describe('image input — proxied completion forwards attachments', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('includes attachments in the proxy body when present', async () => {
    mockFetchResponse({ content: 'ok', truncated: false });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      prompt: visionPrompt(TEST_PNG)
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.prompt.attachments).toEqual([TEST_PNG]);
  });

  test('omits attachments key when none present', async () => {
    mockFetchResponse({ content: 'ok', truncated: false });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      prompt: testPrompt
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.prompt.attachments).toBeUndefined();
  });
});
