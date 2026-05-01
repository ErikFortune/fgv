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
import type {
  AiImageApiFormat,
  IAiImageModelCapability,
  IAiProviderDescriptor
} from '../../../packlets/ai-assist/model';

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
    content: [{ text }],
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

    test('fails when response has invalid structure', async () => {
      mockFetchResponse({ content: [] });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      expect(result).toFailWith(/Anthropic API response/i);
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

  // ==========================================================================
  // endpoint override (local / self-hosted LLM endpoints)
  // ==========================================================================

  describe('endpoint override', () => {
    test('substitutes endpoint for descriptor.baseUrl when posting', async () => {
      mockFetchResponse(openAiResponse('local response'));
      const descriptor = makeDescriptor({ apiFormat: 'openai' });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        endpoint: 'http://localhost:11434/v1',
        modelOverride: 'llama3.2'
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.content).toBe('local response');
      });
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('http://localhost:11434/v1/chat/completions');
    });

    test('uses descriptor.baseUrl when endpoint is undefined', async () => {
      mockFetchResponse(openAiResponse('default-host response'));
      const descriptor = makeDescriptor({ apiFormat: 'openai' });

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.x.ai/v1/chat/completions');
    });

    test('strips a trailing slash from endpoint before appending the route suffix', async () => {
      mockFetchResponse(openAiResponse('ok'));
      const descriptor = makeDescriptor({ apiFormat: 'openai' });

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        endpoint: 'http://localhost:11434/v1/',
        modelOverride: 'llama3.2'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('http://localhost:11434/v1/chat/completions');
    });

    test('honors endpoint when descriptor.baseUrl is empty (openai-compat)', async () => {
      mockFetchResponse(openAiResponse('lan response'));
      const descriptor = AiAssist.getProviderDescriptor('openai-compat').orThrow();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: '',
        prompt: testPrompt,
        endpoint: 'http://192.168.1.42:1234/v1',
        modelOverride: 'qwen2.5-coder'
      });

      expect(result).toSucceedWith({ content: 'lan response', truncated: false });
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('http://192.168.1.42:1234/v1/chat/completions');
      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('qwen2.5-coder');
    });

    test('routes through the endpoint for the anthropic format too', async () => {
      mockFetchResponse(anthropicResponse('local claude'));
      const descriptor = makeDescriptor({
        id: 'anthropic',
        apiFormat: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-sonnet-4-5-20250929'
      });

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        endpoint: 'http://localhost:8787/anthropic'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('http://localhost:8787/anthropic/messages');
    });

    test('rejects an empty endpoint string', async () => {
      const descriptor = makeDescriptor({ apiFormat: 'openai' });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        endpoint: ''
      });

      expect(result).toFailWith(/endpoint must be a non-empty/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rejects a malformed endpoint URL', async () => {
      const descriptor = makeDescriptor({ apiFormat: 'openai' });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        endpoint: 'not a url'
      });

      expect(result).toFailWith(/endpoint is not a valid URL/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rejects a non-http(s) endpoint URL', async () => {
      const descriptor = makeDescriptor({ apiFormat: 'openai' });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        prompt: testPrompt,
        endpoint: 'ftp://example.com/api'
      });

      expect(result).toFailWith(/endpoint must use http or https/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('still fails when no endpoint is provided and the descriptor has no baseUrl', async () => {
      const descriptor = AiAssist.getProviderDescriptor('openai-compat').orThrow();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: '',
        prompt: testPrompt
      });

      expect(result).toFailWith(/no API endpoint/i);
    });
  });
});

// ============================================================================
// Image generation
// ============================================================================

function imgGen(
  format: AiImageApiFormat,
  acceptsRefs: boolean = false
): ReadonlyArray<IAiImageModelCapability> {
  return [
    {
      modelPrefix: '',
      format,
      ...(acceptsRefs ? { acceptsImageReferenceInput: true } : {})
    }
  ];
}

function makeImageDescriptor(overrides: Partial<IAiProviderDescriptor> = {}): IAiProviderDescriptor {
  return {
    id: 'openai',
    label: 'OpenAI',
    buttonLabel: 'AI Assist | OpenAI',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: { base: 'gpt-4o', image: 'dall-e-3' },
    supportedTools: [],
    corsRestricted: false,
    acceptsImageInput: true,
    streamingCorsRestricted: false,
    imageGeneration: imgGen('openai-images'),
    ...overrides
  };
}

function openAiImageBody(b64s: string[], revisedPrompt?: string): unknown {
  return {
    data: b64s.map((b64) => ({
      b64_json: b64,
      ...(revisedPrompt !== undefined ? { revised_prompt: revisedPrompt } : {})
    }))
  };
}

function imagenBody(b64s: string[], mimeType?: string): unknown {
  return {
    predictions: b64s.map((b64) => ({
      bytesBase64Encoded: b64,
      ...(mimeType !== undefined ? { mimeType } : {})
    }))
  };
}

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

describe('callProviderImageGeneration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('common validation', () => {
    test('fails when descriptor declares no image-generation capabilities', async () => {
      const descriptor = makeDescriptor(); // chat-only xai-grok descriptor; imageGeneration is unset

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toFailWith(/does not support image generation/i);
    });

    test('fails when descriptor has no baseUrl', async () => {
      const descriptor = makeImageDescriptor({ baseUrl: '' });

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toFailWith(/no API endpoint/i);
    });

    test('surfaces fetch network errors', async () => {
      mockFetchError(new Error('ECONNREFUSED'));
      const descriptor = makeImageDescriptor();

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toFailWith(/ECONNREFUSED/);
    });

    test('surfaces non-2xx responses', async () => {
      mockFetchHttpError(400, 'Bad request');
      const descriptor = makeImageDescriptor();

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toFailWith(/400/);
    });

    test('uses modelOverride when provided', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const descriptor = makeImageDescriptor();

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' },
        modelOverride: 'gpt-image-1'
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('gpt-image-1');
    });

    test('resolves model with image context from default ModelSpec map', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const descriptor = makeImageDescriptor(); // defaultModel = { base: 'gpt-4o', image: 'dall-e-3' }

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('dall-e-3');
    });
  });

  describe('endpoint override', () => {
    test('substitutes endpoint for descriptor.baseUrl when generating', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const descriptor = makeImageDescriptor();

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' },
        endpoint: 'http://localhost:8080/v1',
        modelOverride: 'gpt-image-1'
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images).toHaveLength(1);
      });
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('http://localhost:8080/v1/images/generations');
    });

    test('rejects a malformed endpoint URL', async () => {
      const descriptor = makeImageDescriptor();

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' },
        endpoint: 'not a url'
      });

      expect(result).toFailWith(/endpoint is not a valid URL/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('openai-images format', () => {
    test('returns image with default png mime type', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const descriptor = makeImageDescriptor();

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images).toHaveLength(1);
        expect(response.images[0].mimeType).toBe('image/png');
        expect(response.images[0].base64).toBe('AAAA');
        expect(response.images[0].revisedPrompt).toBeUndefined();
      });
    });

    test('surfaces revised_prompt as revisedPrompt', async () => {
      mockFetchResponse(openAiImageBody(['AAAA'], 'a cute orange tabby cat'));
      const descriptor = makeImageDescriptor();

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images[0].revisedPrompt).toBe('a cute orange tabby cat');
      });
    });

    test('returns multiple images', async () => {
      mockFetchResponse(openAiImageBody(['AAAA', 'BBBB', 'CCCC']));
      const descriptor = makeImageDescriptor();

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat', options: { count: 3 } }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images.map((i) => i.base64)).toEqual(['AAAA', 'BBBB', 'CCCC']);
      });
    });

    test('sends correct request structure', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const descriptor = makeImageDescriptor();

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'a cat',
          options: { size: '1024x1024', quality: 'high', seed: 42 }
        }
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/images/generations');
      // eslint-disable-next-line dot-notation
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer test-key');
      const body = JSON.parse(fetchCall[1].body);
      expect(body).toEqual({
        model: 'dall-e-3',
        prompt: 'a cat',
        n: 1,
        response_format: 'b64_json',
        size: '1024x1024',
        quality: 'high',
        seed: 42
      });
    });

    test('omits optional fields when not provided', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const descriptor = makeImageDescriptor();

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.size).toBeUndefined();
      expect(body.quality).toBeUndefined();
      expect(body.seed).toBeUndefined();
      expect(body.n).toBe(1);
    });

    test('fails when response data array is empty', async () => {
      mockFetchResponse({ data: [] });
      const descriptor = makeImageDescriptor();

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toFailWith(/OpenAI images API response/i);
    });

    test('forwards abort signal to fetch', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const descriptor = makeImageDescriptor();
      const controller = new AbortController();

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' },
        signal: controller.signal
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].signal).toBe(controller.signal);
    });
  });

  describe('xai-images format', () => {
    const descriptor = makeImageDescriptor({
      id: 'xai-grok',
      label: 'xAI Grok',
      buttonLabel: 'AI Assist | Grok',
      apiFormat: 'openai',
      baseUrl: 'https://api.x.ai/v1',
      defaultModel: { base: 'grok-4-1-fast', image: 'grok-2-image-1212' },
      corsRestricted: true,
      imageGeneration: imgGen('xai-images')
    });

    test('returns image with default jpeg mime type', async () => {
      mockFetchResponse(openAiImageBody(['XYZ']));

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images[0].mimeType).toBe('image/jpeg');
        expect(response.images[0].base64).toBe('XYZ');
      });
    });

    test('uses xAI baseUrl', async () => {
      mockFetchResponse(openAiImageBody(['XYZ']));

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.x.ai/v1/images/generations');
    });
  });

  describe('gemini-imagen format', () => {
    const descriptor = makeImageDescriptor({
      id: 'google-gemini',
      label: 'Google Gemini',
      buttonLabel: 'AI Assist | Gemini',
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: { base: 'gemini-2.5-flash', image: 'imagen-3.0-generate-002' },
      imageGeneration: [{ modelPrefix: 'imagen-', format: 'gemini-imagen' }]
    });

    test('returns image using mimeType from prediction', async () => {
      mockFetchResponse(imagenBody(['GGG'], 'image/webp'));

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images[0].mimeType).toBe('image/webp');
        expect(response.images[0].base64).toBe('GGG');
      });
    });

    test('falls back to png mime when prediction omits it', async () => {
      mockFetchResponse(imagenBody(['GGG']));

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images[0].mimeType).toBe('image/png');
      });
    });

    test('sends predict endpoint URL and Imagen request shape', async () => {
      mockFetchResponse(imagenBody(['GGG']));

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'a cat',
          options: {
            count: 2,
            seed: 123,
            imagen: { aspectRatio: '16:9', negativePrompt: 'no dogs' }
          }
        }
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict'
      );
      expect(fetchCall[1].headers['x-goog-api-key']).toBe('test-key');
      const body = JSON.parse(fetchCall[1].body);
      expect(body).toEqual({
        instances: [{ prompt: 'a cat' }],
        parameters: {
          sampleCount: 2,
          aspectRatio: '16:9',
          negativePrompt: 'no dogs',
          seed: 123
        }
      });
    });

    test('omits optional Imagen parameters when not provided', async () => {
      mockFetchResponse(imagenBody(['GGG']));

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.parameters).toEqual({ sampleCount: 1 });
    });

    test('fails when predictions array is empty', async () => {
      mockFetchResponse({ predictions: [] });

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toFailWith(/Imagen API response/i);
    });

    test('surfaces Imagen network errors', async () => {
      mockFetchError(new Error('ETIMEDOUT'));

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toFailWith(/ETIMEDOUT/);
    });
  });
});

describe('callProxiedImageGeneration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('calls the proxy image-generation endpoint and returns images', async () => {
    mockFetchResponse({
      images: [{ mimeType: 'image/png', base64: 'AAAA', revisedPrompt: 'rewritten' }]
    });
    const descriptor = makeImageDescriptor();

    const result = await AiAssist.callProxiedImageGeneration('http://localhost:3001', {
      descriptor,
      apiKey: 'test-key',
      params: { prompt: 'a cat' }
    });

    expect(result).toSucceedAndSatisfy((response) => {
      expect(response.images).toEqual([
        { mimeType: 'image/png', base64: 'AAAA', revisedPrompt: 'rewritten' }
      ]);
    });
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toBe('http://localhost:3001/api/ai/image-generation');
    expect(JSON.parse(fetchCall[1].body)).toEqual({
      providerId: 'openai',
      apiKey: 'test-key',
      params: { prompt: 'a cat' }
    });
  });

  test('includes modelOverride in request body when provided', async () => {
    mockFetchResponse({ images: [{ mimeType: 'image/png', base64: 'AAAA' }] });
    const descriptor = makeImageDescriptor();

    await AiAssist.callProxiedImageGeneration('http://localhost:3001', {
      descriptor,
      apiKey: 'test-key',
      params: { prompt: 'a cat' },
      modelOverride: 'gpt-image-1'
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.modelOverride).toBe('gpt-image-1');
  });

  test('forwards reference images through to the proxy unchanged', async () => {
    mockFetchResponse({ images: [{ mimeType: 'image/png', base64: 'AAAA' }] });
    const descriptor = makeImageDescriptor();

    await AiAssist.callProxiedImageGeneration('http://localhost:3001', {
      descriptor,
      apiKey: 'test-key',
      params: { prompt: 'a cat', referenceImages: [TEST_PNG, TEST_JPEG] }
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.params.referenceImages).toEqual([TEST_PNG, TEST_JPEG]);
  });

  test('surfaces proxy error response', async () => {
    mockFetchResponse({ error: 'provider rejected request' });
    const descriptor = makeImageDescriptor();

    const result = await AiAssist.callProxiedImageGeneration('http://localhost:3001', {
      descriptor,
      apiKey: 'test-key',
      params: { prompt: 'a cat' }
    });

    expect(result).toFailWith(/proxy: provider rejected request/);
  });

  test('fails when proxy returns malformed images', async () => {
    mockFetchResponse({ images: [{ mimeType: 'image/png' }] }); // missing base64
    const descriptor = makeImageDescriptor();

    const result = await AiAssist.callProxiedImageGeneration('http://localhost:3001', {
      descriptor,
      apiKey: 'test-key',
      params: { prompt: 'a cat' }
    });

    expect(result).toFailWith(/proxy returned invalid response/i);
  });

  test('forwards abort signal', async () => {
    mockFetchResponse({ images: [{ mimeType: 'image/png', base64: 'AAAA' }] });
    const descriptor = makeImageDescriptor();
    const controller = new AbortController();

    await AiAssist.callProxiedImageGeneration('http://localhost:3001', {
      descriptor,
      apiKey: 'test-key',
      params: { prompt: 'a cat' },
      signal: controller.signal
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].signal).toBe(controller.signal);
  });

  test('surfaces fetch network errors', async () => {
    mockFetchError(new Error('ECONNREFUSED'));
    const descriptor = makeImageDescriptor();

    const result = await AiAssist.callProxiedImageGeneration('http://localhost:3001', {
      descriptor,
      apiKey: 'test-key',
      params: { prompt: 'a cat' }
    });

    expect(result).toFailWith(/ECONNREFUSED/);
  });
});
