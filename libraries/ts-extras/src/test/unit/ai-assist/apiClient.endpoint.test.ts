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
// Helpers (kept inline; intentionally parallel to apiClient.test.ts).
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
    thinkingMode: 'optional',
    imageGeneration: [
      { modelPrefix: 'gpt-image-', format: 'openai-images', acceptsImageReferenceInput: true },
      { modelPrefix: '', format: 'openai-images' }
    ],
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

function openAiResponse(content: string, finishReason: string = 'stop'): unknown {
  return { choices: [{ message: { content }, finish_reason: finishReason }] };
}

function anthropicResponse(text: string, stopReason: string = 'end_turn'): unknown {
  return { content: [{ text }], stop_reason: stopReason };
}

function openAiImageBody(b64s: string[]): unknown {
  return { data: b64s.map((b64) => ({ b64_json: b64 })) };
}

// ============================================================================
// Tests
// ============================================================================

describe('callProviderCompletion — endpoint override', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

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

  test('strips a trailing slash from the descriptor baseUrl too', async () => {
    mockFetchResponse(openAiResponse('ok'));
    const descriptor = makeDescriptor({ apiFormat: 'openai', baseUrl: 'https://api.x.ai/v1/' });

    await AiAssist.callProviderCompletion({
      descriptor,
      apiKey: 'test-key',
      prompt: testPrompt
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toBe('https://api.x.ai/v1/chat/completions');
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

  describe('validation', () => {
    test.each<[string, string, RegExp]>([
      ['empty endpoint string', '', /endpoint must be a non-empty/i],
      ['malformed URL', 'not a url', /endpoint is not a valid URL/i],
      ['non-http(s) URL', 'ftp://example.com/api', /endpoint must use http or https/i],
      ['fragment', 'http://localhost:11434/v1#frag', /must not include a query string or fragment/i]
    ])('rejects %s', async (description, endpoint, pattern) => {
      expect(description.length).toBeGreaterThan(0);
      const result = await AiAssist.callProviderCompletion({
        descriptor: makeDescriptor({ apiFormat: 'openai' }),
        apiKey: 'test-key',
        prompt: testPrompt,
        endpoint
      });

      expect(result).toFailWith(pattern);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rejects an endpoint with a query string and does not echo the secret', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor: makeDescriptor({ apiFormat: 'openai' }),
        apiKey: 'test-key',
        prompt: testPrompt,
        endpoint: 'http://localhost:11434/v1?token=secret'
      });

      expect(result).toFailWith(/must not include a query string or fragment/i);
      if (result.isFailure()) {
        expect(result.message).not.toMatch(/secret/);
      }
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rejects an endpoint that includes userinfo (and does not echo the password)', async () => {
      const result = await AiAssist.callProviderCompletion({
        descriptor: makeDescriptor({ apiFormat: 'openai' }),
        apiKey: 'test-key',
        prompt: testPrompt,
        endpoint: 'http://user:hunter2@localhost:11434/v1'
      });

      expect(result).toFailWith(/must not include userinfo/i);
      if (result.isFailure()) {
        expect(result.message).not.toMatch(/hunter2/);
      }
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

    test('fails up front when neither defaultModel nor modelOverride yields a model', async () => {
      const descriptor = AiAssist.getProviderDescriptor('openai-compat').orThrow();

      const result = await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: '',
        prompt: testPrompt,
        endpoint: 'http://10.0.0.5:8080/v1'
      });

      expect(result).toFailWith(/no model resolved/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Authorization header', () => {
    test('omits Authorization when apiKey is empty', async () => {
      mockFetchResponse(openAiResponse('ok'));
      const descriptor = AiAssist.getProviderDescriptor('ollama').orThrow();

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: '',
        prompt: testPrompt,
        modelOverride: 'llama3.2'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers.Authorization).toBeUndefined();
    });

    test('still sends Authorization when apiKey is non-empty (proxy that needs a key)', async () => {
      mockFetchResponse(openAiResponse('ok'));
      const descriptor = AiAssist.getProviderDescriptor('openai-compat').orThrow();

      await AiAssist.callProviderCompletion({
        descriptor,
        apiKey: 'proxy-token',
        prompt: testPrompt,
        endpoint: 'http://10.0.0.5:8080/v1',
        modelOverride: 'mistral-7b'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers.Authorization).toBe('Bearer proxy-token');
    });
  });
});

describe('callProviderImageGeneration — endpoint override', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

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
    const result = await AiAssist.callProviderImageGeneration({
      descriptor: makeImageDescriptor(),
      apiKey: 'test-key',
      params: { prompt: 'a cat' },
      endpoint: 'not a url'
    });

    expect(result).toFailWith(/endpoint is not a valid URL/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('fails up front when neither defaultModel nor modelOverride yields a model', async () => {
    const descriptor: IAiProviderDescriptor = {
      ...makeImageDescriptor(),
      defaultModel: ''
    };

    const result = await AiAssist.callProviderImageGeneration({
      descriptor,
      apiKey: 'test-key',
      params: { prompt: 'a cat' },
      endpoint: 'http://localhost:8080/v1'
    });

    expect(result).toFailWith(/no image model resolved/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
