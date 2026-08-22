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
 * Tests for `callProviderCompletion` across the four provider wire formats.
 *
 * @remarks
 * The thinking-config and vision halves live in the sibling
 * `apiClient.thinking.test.ts` / `apiClient.vision.test.ts`; shared fixtures
 * live in `apiClientFixtures.ts`.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiProviderDescriptor } from '../../../packlets/ai-assist/model';
import {
  anthropicResponse,
  anthropicWithToolsResponse,
  geminiResponse,
  makeDescriptor,
  mockFetchError,
  mockFetchHttpError,
  mockFetchResponse,
  openAiResponse,
  responsesApiResponse,
  testPrompt
} from './apiClientFixtures';

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
        ...testPrompt.toRequest()
      });

      expect(result).toFailWith(/no API endpoint/i);
    });

    test('fails when fetch throws a network error', async () => {
      mockFetchError(new Error('ECONNREFUSED'));
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toFailWith(/ECONNREFUSED/);
    });

    test('handles non-Error fetch rejection', async () => {
      (global.fetch as jest.Mock).mockRejectedValue('network down');
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toFailWith(/network down/);
    });

    test('fails when API returns non-200 status', async () => {
      mockFetchHttpError(429, 'Rate limit exceeded');
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
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
        ...testPrompt.toRequest()
      });

      expect(result).toFailWith(/invalid JSON/i);
    });

    test('fails when API returns non-object JSON', async () => {
      mockFetchResponse('just a string');
      const descriptor = makeDescriptor();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toFailWith(/non-object JSON/i);
    });

    test('uses modelOverride when provided', async () => {
      mockFetchResponse(openAiResponse('hello'));
      const descriptor = makeDescriptor();

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        modelOverride: 'custom-model'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('custom-model');
    });
  });

  // ==========================================================================
  // Quality-tier composition (B1): the tier is the ONLY completion-model
  // selector; thinking and tools are orthogonal request params/capabilities
  // and never pick a model.
  // ==========================================================================

  describe('quality-tier composition', () => {
    const tieredDescriptor = makeDescriptor({
      id: 'openai',
      apiFormat: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: { base: 'm-base', advanced: 'm-adv', frontier: 'm-front' }
    });

    async function bodyForCompletion(
      params: Partial<AiAssist.IProviderCompletionParams>,
      descriptor: IAiProviderDescriptor = tieredDescriptor
    ): Promise<Record<string, unknown>> {
      mockFetchResponse(openAiResponse('ok'));
      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        ...params
      });
      expect(result).toSucceed();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      return JSON.parse(fetchCall[1].body) as Record<string, unknown>;
    }

    test('no tier selects the base model', async () => {
      expect((await bodyForCompletion({})).model).toBe('m-base');
    });

    test('tier "advanced" selects the advanced model', async () => {
      expect((await bodyForCompletion({ tier: 'advanced' })).model).toBe('m-adv');
    });

    test('tier "frontier" selects the frontier model', async () => {
      expect((await bodyForCompletion({ tier: 'frontier' })).model).toBe('m-front');
    });

    test('tier "frontier" cascades to advanced when no frontier key is defined', async () => {
      const descriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: { base: 'm-base', advanced: 'm-adv' }
      });
      expect((await bodyForCompletion({ tier: 'frontier' }, descriptor)).model).toBe('m-adv');
    });

    test('a base-only descriptor + tier request cascades to base', async () => {
      const descriptor = makeDescriptor({
        id: 'openai',
        apiFormat: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: { base: 'm-base' }
      });
      expect((await bodyForCompletion({ tier: 'frontier' }, descriptor)).model).toBe('m-base');
    });

    test('thinking without a tier resolves the base model and still rides as a wire param', async () => {
      const body = await bodyForCompletion({ thinking: { effort: 'low' } });
      // Composition: thinking does NOT upgrade the tier — model stays base...
      expect(body.model).toBe('m-base');
      // ...but the thinking config is still read and still sent to the API.
      expect(body.reasoning_effort).toBe('low');
    });

    test('thinking composes on top of an explicit tier (model = tier, thinking rides)', async () => {
      const body = await bodyForCompletion({ tier: 'advanced', thinking: { effort: 'low' } });
      expect(body.model).toBe('m-adv');
      expect(body.reasoning_effort).toBe('low');
    });

    test('tools without a tier resolves the base model', async () => {
      // Tools route to the Responses API, so mock that wire shape directly
      // rather than via the chat-format helper.
      mockFetchResponse(responsesApiResponse('ok'));
      const result = await AiAssist.callProviderCompletion({
        descriptor: tieredDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools: [{ type: 'web_search' }]
      });
      expect(result).toSucceed();
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('m-base');
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest()
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
        ...testPrompt.toRequest()
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
        ...testPrompt.toRequest(),
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

    test('omits temperature when the caller does not provide one', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      // No default temperature is injected — gpt-5.5 rejects a non-default temperature.
      expect(body.temperature).toBeUndefined();
    });

    test('includes additional messages', async () => {
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: testPrompt.system,
        messages: [
          { role: 'user', content: testPrompt.user },
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
        ...testPrompt.toRequest()
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
        ...testPrompt.toRequest()
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
        ...testPrompt.toRequest()
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
        ...testPrompt.toRequest()
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.anthropic.com/v1/messages');
      expect(fetchCall[1].headers['x-api-key']).toBe('test-key');
      expect(fetchCall[1].headers['anthropic-version']).toBe('2023-06-01');

      const body = JSON.parse(fetchCall[1].body);
      expect(body.system).toBe('You are a helpful assistant');
      expect(body.messages[0]).toEqual({ role: 'user', content: 'Generate a recipe' });
      expect(body.max_tokens).toBe(AiAssist.DEFAULT_ANTHROPIC_MAX_TOKENS);
      // No default temperature is injected — Claude-5 rejects any temperature value.
      expect(body.temperature).toBeUndefined();
    });

    test('includes temperature only when explicitly provided', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        temperature: 0.4
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.temperature).toBe(0.4);
    });

    test('filters system role from additional messages', async () => {
      mockFetchResponse(anthropicResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: testPrompt.system,
        messages: [
          { role: 'user', content: testPrompt.user },
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
        ...testPrompt.toRequest()
      });

      expect(result).toFailWith(/content is not an array/i);
    });

    test('fails when stop_reason is missing', async () => {
      mockFetchResponse({ content: [] });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toFailWith(/stop_reason is missing or not a string/i);
    });

    test('fails when response content has no text blocks', async () => {
      mockFetchResponse({ content: [], stop_reason: 'end_turn' });

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      expect(result).toFailWith(/no text content blocks/i);
    });

    test('fails when fetch throws a network error', async () => {
      mockFetchError(new Error('Connection timeout'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
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
        ...testPrompt.toRequest()
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
        ...testPrompt.toRequest()
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
        ...testPrompt.toRequest()
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
      );
      expect(fetchCall[1].headers['x-goog-api-key']).toBe('test-key');

      const body = JSON.parse(fetchCall[1].body);
      expect(body.systemInstruction).toEqual({ parts: [{ text: 'You are a helpful assistant' }] });
      expect(body.contents[0]).toEqual({ role: 'user', parts: [{ text: 'Generate a recipe' }] });
      // No default temperature is injected — the key is omitted so Gemini's default applies.
      expect(body.generationConfig.temperature).toBeUndefined();
    });

    test('includes temperature in generationConfig only when explicitly provided', async () => {
      mockFetchResponse(geminiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        temperature: 0.2
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.generationConfig.temperature).toBe(0.2);
    });

    test('maps assistant role to model and filters system', async () => {
      mockFetchResponse(geminiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        system: testPrompt.system,
        messages: [
          { role: 'user', content: testPrompt.user },
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
        ...testPrompt.toRequest()
      });

      expect(result).toFailWith(/Gemini API response/i);
    });

    test('fails when fetch throws a network error', async () => {
      mockFetchError(new Error('DNS resolution failed'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
        tools
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.tools).toEqual([{ type: 'web_search' }]);
      expect(body.input).toBeDefined();
    });

    test('omits temperature by default and includes it only when explicitly provided (Responses API)', async () => {
      mockFetchResponse(responsesApiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools
      });
      const omitted = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(omitted.temperature).toBeUndefined();

      mockFetchResponse(responsesApiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools,
        temperature: 0.6
      });
      const explicit = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
      expect(explicit.temperature).toBe(0.6);
    });

    test('tools no longer select a model — resolves base under composition', async () => {
      // Under composition the tier is the only selector; a request with tools
      // (and no tier) resolves the base model. A tiered descriptor's advanced
      // key is never reached by a tools request.
      const splitDescriptor = makeDescriptor({
        defaultModel: { base: 'grok-fast', advanced: 'grok-reasoning' }
      });
      mockFetchResponse(responsesApiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor: splitDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('grok-fast');
    });

    test('thinking no longer selects a model — tools+thinking resolves base under composition', async () => {
      const splitDescriptor = makeDescriptor({
        defaultModel: { base: 'grok-fast', advanced: 'grok-reasoning' }
      });
      mockFetchResponse(responsesApiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor: splitDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools,
        thinking: { effort: 'medium' }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('grok-fast');
    });

    test('selects base model from ModelSpec when no tools', async () => {
      const splitDescriptor = makeDescriptor({
        defaultModel: { base: 'grok-fast', advanced: 'grok-reasoning' }
      });
      mockFetchResponse(openAiResponse('no tools'));

      await AiAssist.callProviderCompletion({
        descriptor: splitDescriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('grok-fast');
    });

    test('Gemini descriptor: base+thinking (no tier) resolves flash — the intended pro→flash change', async () => {
      // The one intended behavior change in B1: with the `thinking` defaultModel
      // key removed, a thinking completion with no tier resolves the base model
      // (flash) instead of the old pro-for-all-thinking. Drive the real registry
      // descriptor through the full completion chokepoint.
      const gemini = AiAssist.getProviderDescriptor('google-gemini').orThrow();
      mockFetchResponse(geminiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor: gemini,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        thinking: { effort: 'low' }
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      // Gemini puts the model id in the request URL, not the JSON body.
      expect(fetchCall[0]).toContain('gemini-3.5-flash');
    });

    test('xAI descriptor: a tools+thinking completion resolves grok-4.3 via base', async () => {
      // The real xAI descriptor's dead tools/thinking keys were stripped in B1;
      // a tools+thinking completion resolves base = grok-4.3 (behavior-neutral).
      const xai = AiAssist.getProviderDescriptor('xai-grok').orThrow();
      mockFetchResponse(responsesApiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor: xai,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools,
        thinking: { effort: 'medium' }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.model).toBe('grok-4.3');
    });

    test('extracts text from Responses API output', async () => {
      mockFetchResponse(responsesApiResponse('Web search found: chocolate truffles'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
        tools
      });

      expect(result).toFailWith(/no message with text content/i);
    });

    test('fails when fetch throws a network error', async () => {
      mockFetchError(new Error('ECONNREFUSED'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tools
      });

      expect(result).toFailWith(/ECONNREFUSED/i);
    });

    test('uses Chat Completions when no tools provided', async () => {
      mockFetchResponse(openAiResponse('no tools'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.x.ai/v1/chat/completions');
    });
  });

  // ==========================================================================
  // OpenAI Responses-API-only model routing (no tools) — restores frontier
  // ==========================================================================

  describe('openai Responses-only model routing (no tools)', () => {
    // A synthetic openai-format descriptor that marks a model prefix as
    // Responses-API-only and wires it to the frontier tier via an alias.
    const descriptor = makeDescriptor({
      id: 'openai',
      apiFormat: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      defaultModel: { base: 'gpt-5.4-mini', advanced: 'gpt-5.5', frontier: '@openai:pro' },
      aliases: { '@openai:pro': 'gpt-5.5-pro' },
      responsesOnlyModelPrefixes: ['gpt-5.5-pro']
    });

    test('routes a modelOverride of a Responses-only model to /responses even with no tools', async () => {
      mockFetchResponse(responsesApiResponse('pro answer'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        modelOverride: 'gpt-5.5-pro'
      });

      expect(result).toSucceedWith({ content: 'pro answer', truncated: false, structuredOutput: 'none' });
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/responses');
      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('gpt-5.5-pro');
      // No tools were requested, so the tools field must be omitted entirely.
      expect(body.tools).toBeUndefined();
      expect('tools' in body).toBe(false);
      // No default temperature is force-sent on the Responses-only route.
      expect(body.temperature).toBeUndefined();
    });

    test('frontier tier resolves @openai:pro → gpt-5.5-pro and routes to /responses', async () => {
      mockFetchResponse(responsesApiResponse('frontier answer'));

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tier: 'frontier'
      });

      expect(result).toSucceed();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/responses');
      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('gpt-5.5-pro');
      expect('tools' in body).toBe(false);
    });

    test('base tier still routes to /chat/completions', async () => {
      mockFetchResponse(openAiResponse('base answer'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest()
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/chat/completions');
      expect(JSON.parse(fetchCall[1].body).model).toBe('gpt-5.4-mini');
    });

    test('advanced tier still routes to /chat/completions', async () => {
      mockFetchResponse(openAiResponse('advanced answer'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tier: 'advanced'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/chat/completions');
      expect(JSON.parse(fetchCall[1].body).model).toBe('gpt-5.5');
    });

    test('a Responses-only model WITH tools still sends the tools field', async () => {
      mockFetchResponse(responsesApiResponse('pro + search'));

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        modelOverride: 'gpt-5.5-pro',
        tools: [{ type: 'web_search' }]
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/responses');
      expect(JSON.parse(fetchCall[1].body).tools).toEqual([{ type: 'web_search' }]);
    });

    test('real OpenAI registry descriptor: frontier resolves gpt-5.6-sol via /chat/completions', async () => {
      // gpt-5.6-sol (unlike its predecessor gpt-5.5-pro) works on chat completions, so the
      // frontier tier no longer routes through the Responses-only path.
      const openai = AiAssist.getProviderDescriptor('openai').orThrow();
      expect(openai.responsesOnlyModelPrefixes).toEqual(['gpt-5.5-pro']);
      mockFetchResponse(openAiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor: openai,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        tier: 'frontier'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/chat/completions');
      expect(JSON.parse(fetchCall[1].body).model).toBe('gpt-5.6-sol');
    });

    test('real OpenAI registry descriptor: a gpt-5.5-pro modelOverride still routes via /responses', async () => {
      // The previous frontier target remains Responses-API-only and reachable via modelOverride.
      const openai = AiAssist.getProviderDescriptor('openai').orThrow();
      mockFetchResponse(responsesApiResponse('ok'));

      await AiAssist.callProviderCompletion({
        descriptor: openai,
        apiKey: 'test-key',
        ...testPrompt.toRequest(),
        modelOverride: 'gpt-5.5-pro'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/responses');
      expect(JSON.parse(fetchCall[1].body).model).toBe('gpt-5.5-pro');
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
        tools
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.content).toBe('Search grounded answer');
      });
    });
  });
});
