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
 * Tests for how a resolved thinking config is encoded onto each provider's
 * non-streaming request body.
 */

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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
        thinking: { providers: [{ provider: 'xai', config: { effort: 'none' } }] },
        temperature: 0.5
      });
      expect(result).toSucceed();
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning_effort).toBe('none');
      expect(body.temperature).toBe(0.5);
    });

    test('omits reasoning_effort for grok-4 even when thinking is active', async () => {
      const grok4Descriptor = makeDescriptor({
        id: 'xai-grok',
        baseUrl: 'https://api.x.ai/v1',
        defaultModel: 'grok-4',
        corsRestricted: false
      });
      mockFetchResponse(openAiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor: grok4Descriptor,
        apiKey: 'sk',
        ...testPrompt.toRequest(),
        thinking: { effort: 'medium' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning_effort).toBeUndefined();
      expect(body.temperature).toBeUndefined();
    });

    test('omits reasoning field for grok-4 in Responses API path even when thinking is active', async () => {
      const grok4Descriptor = makeDescriptor({
        id: 'xai-grok',
        baseUrl: 'https://api.x.ai/v1',
        defaultModel: 'grok-4',
        corsRestricted: false
      });
      const tools: ReadonlyArray<AiAssist.AiServerToolConfig> = [{ type: 'web_search' }];
      mockFetchResponse(responsesApiResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor: grok4Descriptor,
        apiKey: 'sk',
        ...testPrompt.toRequest(),
        tools,
        thinking: { effort: 'high' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning).toBeUndefined();
      expect(body.temperature).toBeUndefined();
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
        ...testPrompt.toRequest(),
        thinking: { effort: 'high' }
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.thinking).toEqual({ type: 'enabled', budget_tokens: 24000 });
      expect(body.output_config).toBeUndefined();
      expect(body.temperature).toBeUndefined();
    });

    describe('Claude 5 adaptive thinking wire shape', () => {
      const adaptiveDescriptor = makeDescriptor({
        id: 'anthropic',
        apiFormat: 'anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-sonnet-5',
        corsRestricted: false,
        adaptiveThinkingModelPrefixes: ['claude-sonnet-5', 'claude-opus-5', 'claude-fable-5']
      });

      test('a Claude 5 id sends thinking.type: adaptive + output_config.effort, no budget_tokens', async () => {
        mockFetchResponse(anthropicResponse('ok'));
        await AiAssist.callProviderCompletion({
          descriptor: adaptiveDescriptor,
          apiKey: 'sk',
          ...testPrompt.toRequest(),
          thinking: { effort: 'high' }
        });
        const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(body.thinking).toEqual({ type: 'adaptive' });
        expect(body.output_config).toEqual({ effort: 'high' });
        expect(body.thinking.budget_tokens).toBeUndefined();
      });

      test('a dated Claude 5 snapshot id (dash-bounded prefix match) also sends the adaptive shape', async () => {
        mockFetchResponse(anthropicResponse('ok'));
        await AiAssist.callProviderCompletion({
          descriptor: { ...adaptiveDescriptor, defaultModel: 'claude-opus-5-20260115' },
          apiKey: 'sk',
          ...testPrompt.toRequest(),
          thinking: { effort: 'medium' }
        });
        const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(body.thinking).toEqual({ type: 'adaptive' });
        expect(body.output_config).toEqual({ effort: 'medium' });
      });

      test('a legacy 4.x id on the same descriptor keeps the byte-identical legacy shape', async () => {
        mockFetchResponse(anthropicResponse('ok'));
        await AiAssist.callProviderCompletion({
          descriptor: { ...adaptiveDescriptor, defaultModel: 'claude-haiku-4-5-20251001' },
          apiKey: 'sk',
          ...testPrompt.toRequest(),
          thinking: { effort: 'low' }
        });
        const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
        expect(body.thinking).toEqual({ type: 'enabled', budget_tokens: 2048 });
        expect(body.output_config).toBeUndefined();
      });
    });

    test('merges other-block params into Anthropic body', async () => {
      mockFetchResponse(anthropicResponse('ok'));
      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'sk',
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
        thinking: {
          providers: [
            {
              provider: 'other',
              models: ['gemini-2.5-flash'],
              // eslint-disable-next-line @typescript-eslint/naming-convention
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
        ...testPrompt.toRequest(),
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
        ...testPrompt.toRequest(),
        thinking: { effort: 'high' }
      });
      expect(result).toSucceed();
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.reasoning_effort).toBeUndefined();
    });
  });
});
