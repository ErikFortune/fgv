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
// Test helpers (parallel to apiClient.test.ts; kept inline to avoid coupling)
// ============================================================================

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
    imageGeneration: [{ modelPrefix: '', format: 'openai-images' }],
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

function openAiListBody(ids: ReadonlyArray<string>): unknown {
  return { data: ids.map((id) => ({ id })) };
}

function anthropicListBody(entries: ReadonlyArray<{ id: string; display_name?: string }>): unknown {
  return { data: entries };
}

function geminiListBody(
  entries: ReadonlyArray<{ name: string; displayName?: string; methods?: ReadonlyArray<string> }>
): unknown {
  return {
    models: entries.map((e) => ({
      name: e.name,
      ...(e.displayName !== undefined ? { displayName: e.displayName } : {}),
      ...(e.methods !== undefined ? { supportedGenerationMethods: e.methods } : {})
    }))
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('callProviderListModels', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('common validation', () => {
    test('fails when descriptor has no baseUrl', async () => {
      const descriptor = makeDescriptor({ baseUrl: '' });

      const result = await AiAssist.callProviderListModels({
        descriptor,
        apiKey: 'test-key'
      });

      expect(result).toFailWith(/no API endpoint/i);
    });

    test('surfaces fetch network errors', async () => {
      mockFetchError(new Error('ETIMEDOUT'));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeDescriptor(),
        apiKey: 'test-key'
      });

      expect(result).toFailWith(/ETIMEDOUT/);
    });

    test('surfaces non-2xx responses as a failure (no silent fallback)', async () => {
      mockFetchHttpError(401, 'Unauthorized');

      const result = await AiAssist.callProviderListModels({
        descriptor: makeDescriptor(),
        apiKey: 'bad-key'
      });

      expect(result).toFailWith(/401/);
    });

    test('forwards abort signal to fetch', async () => {
      mockFetchResponse(openAiListBody(['gpt-4o']));
      const controller = new AbortController();

      await AiAssist.callProviderListModels({
        descriptor: makeImageDescriptor(),
        apiKey: 'test-key',
        signal: controller.signal
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].signal).toBe(controller.signal);
      expect(fetchCall[1].method).toBe('GET');
    });
  });

  describe('endpoint override', () => {
    test('substitutes endpoint for descriptor.baseUrl when listing', async () => {
      mockFetchResponse(openAiListBody(['llama3.2', 'qwen2.5']));
      const descriptor = AiAssist.getProviderDescriptor('ollama').orThrow();

      const result = await AiAssist.callProviderListModels({
        descriptor,
        apiKey: '',
        endpoint: 'http://localhost:11434/v1'
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models.map((m) => m.id).sort()).toEqual(['llama3.2', 'qwen2.5']);
      });
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('http://localhost:11434/v1/models');
    });

    test('honors endpoint when descriptor.baseUrl is empty (openai-compat)', async () => {
      mockFetchResponse(openAiListBody(['lan-model']));
      const descriptor = AiAssist.getProviderDescriptor('openai-compat').orThrow();

      const result = await AiAssist.callProviderListModels({
        descriptor,
        apiKey: '',
        endpoint: 'http://192.168.1.42:1234/v1'
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models.map((m) => m.id)).toEqual(['lan-model']);
      });
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('http://192.168.1.42:1234/v1/models');
    });

    test('rejects a malformed endpoint URL', async () => {
      const descriptor = makeImageDescriptor();

      const result = await AiAssist.callProviderListModels({
        descriptor,
        apiKey: 'test-key',
        endpoint: 'not a url'
      });

      expect(result).toFailWith(/endpoint is not a valid URL/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rejects an endpoint with a query string', async () => {
      const descriptor = makeImageDescriptor();

      const result = await AiAssist.callProviderListModels({
        descriptor,
        apiKey: 'test-key',
        endpoint: 'http://localhost:11434/v1?token=secret'
      });

      expect(result).toFailWith(/must not include a query string or fragment/i);
      if (result.isFailure()) {
        expect(result.message).not.toMatch(/secret/);
      }
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('omits the Authorization header when apiKey is empty', async () => {
      mockFetchResponse(openAiListBody(['llama3.2']));
      const descriptor = AiAssist.getProviderDescriptor('ollama').orThrow();

      await AiAssist.callProviderListModels({
        descriptor,
        apiKey: '',
        endpoint: 'http://localhost:11434/v1'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers.Authorization).toBeUndefined();
    });
  });

  describe('openai apiFormat (config-derived capabilities)', () => {
    test('returns models with capabilities from default config', async () => {
      mockFetchResponse(openAiListBody(['dall-e-3', 'gpt-4o', 'gpt-3.5-turbo']));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeImageDescriptor(), // openai
        apiKey: 'test-key'
      });

      expect(result).toSucceedAndSatisfy((models) => {
        const byId = new Map(models.map((m) => [m.id, m]));
        expect(byId.get('dall-e-3')!.capabilities.has('image-generation')).toBe(true);
        expect(byId.get('gpt-4o')!.capabilities.has('chat')).toBe(true);
        expect(byId.get('gpt-4o')!.capabilities.has('vision')).toBe(true);
        expect(byId.get('gpt-3.5-turbo')!.capabilities.has('chat')).toBe(true);
        expect(byId.get('gpt-3.5-turbo')!.capabilities.has('vision')).toBe(false);
      });
    });

    test('filters by requested capability', async () => {
      mockFetchResponse(openAiListBody(['dall-e-3', 'gpt-image-1', 'gpt-4o', 'text-embedding-3-large']));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeImageDescriptor(),
        apiKey: 'test-key',
        capability: 'image-generation'
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models.map((m) => m.id).sort()).toEqual(['dall-e-3', 'gpt-image-1']);
      });
    });

    test('uses Bearer auth header', async () => {
      mockFetchResponse(openAiListBody(['gpt-4o']));

      await AiAssist.callProviderListModels({
        descriptor: makeImageDescriptor(),
        apiKey: 'test-key'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/models');
      expect(fetchCall[1].headers.Authorization).toBe('Bearer test-key');
    });

    test('returns empty array when provider returns no models', async () => {
      mockFetchResponse({ data: [] });

      const result = await AiAssist.callProviderListModels({
        descriptor: makeImageDescriptor(),
        apiKey: 'test-key'
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models).toEqual([]);
      });
    });

    test('uses caller-supplied capabilityConfig when provided', async () => {
      mockFetchResponse(openAiListBody(['custom-image-model']));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeImageDescriptor(),
        apiKey: 'test-key',
        capability: 'image-generation',
        capabilityConfig: {
          global: [{ idPattern: /^custom-image/, capabilities: ['image-generation'] }]
        }
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models.map((m) => m.id)).toEqual(['custom-image-model']);
      });
    });
  });

  describe('anthropic apiFormat (display_name from provider)', () => {
    test('returns models with display_name surfaced as displayName', async () => {
      mockFetchResponse(
        anthropicListBody([
          { id: 'claude-sonnet-4-5-20250929', display_name: 'Claude Sonnet 4.5' },
          { id: 'claude-opus-4-7-20260101' }
        ])
      );

      const result = await AiAssist.callProviderListModels({
        descriptor: makeDescriptor({ apiFormat: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' }),
        apiKey: 'test-key'
      });

      expect(result).toSucceedAndSatisfy((models) => {
        const byId = new Map(models.map((m) => [m.id, m]));
        expect(byId.get('claude-sonnet-4-5-20250929')!.displayName).toBe('Claude Sonnet 4.5');
        expect(byId.get('claude-opus-4-7-20260101')!.displayName).toBeUndefined();
      });
    });

    test('uses x-api-key auth header', async () => {
      mockFetchResponse(anthropicListBody([{ id: 'claude-1' }]));

      await AiAssist.callProviderListModels({
        descriptor: makeDescriptor({ apiFormat: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' }),
        apiKey: 'test-key'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers['x-api-key']).toBe('test-key');
    });

    test('surfaces Anthropic network errors', async () => {
      mockFetchError(new Error('ENETUNREACH'));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeDescriptor({ apiFormat: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' }),
        apiKey: 'test-key'
      });

      expect(result).toFailWith(/ENETUNREACH/);
    });
  });

  describe('gemini apiFormat (native capability info)', () => {
    test('translates supportedGenerationMethods to capabilities', async () => {
      mockFetchResponse(
        geminiListBody([
          { name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', methods: ['generateContent'] },
          {
            name: 'models/imagen-3.0-generate-001',
            displayName: 'Imagen 3',
            methods: ['predict']
          }
        ])
      );

      const result = await AiAssist.callProviderListModels({
        descriptor: makeDescriptor({
          apiFormat: 'gemini',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
          id: 'google-gemini'
        }),
        apiKey: 'test-key'
      });

      expect(result).toSucceedAndSatisfy((models) => {
        const byId = new Map(models.map((m) => [m.id, m]));
        const gemini = byId.get('gemini-2.5-flash')!;
        expect(gemini.capabilities.has('chat')).toBe(true);
        expect(gemini.displayName).toBe('Gemini 2.5 Flash');
        const imagen = byId.get('imagen-3.0-generate-001')!;
        expect(imagen.capabilities.has('image-generation')).toBe(true);
      });
    });

    test('strips models/ prefix from listed names', async () => {
      mockFetchResponse(geminiListBody([{ name: 'models/gemini-pro', methods: ['generateContent'] }]));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeDescriptor({
          apiFormat: 'gemini',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
          id: 'google-gemini'
        }),
        apiKey: 'test-key'
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models.map((m) => m.id)).toContain('gemini-pro');
      });
    });

    test('unions native capabilities with config-derived capabilities', async () => {
      mockFetchResponse(geminiListBody([{ name: 'models/gemini-2.5-flash', methods: ['generateContent'] }]));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeDescriptor({
          apiFormat: 'gemini',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
          id: 'google-gemini'
        }),
        apiKey: 'test-key'
      });

      expect(result).toSucceedAndSatisfy((models) => {
        const m = models[0];
        // 'chat' from native, 'tools' and 'vision' added by default config rule
        expect(m.capabilities.has('chat')).toBe(true);
        expect(m.capabilities.has('tools')).toBe(true);
        expect(m.capabilities.has('vision')).toBe(true);
      });
    });

    test('handles entries without supportedGenerationMethods', async () => {
      mockFetchResponse(geminiListBody([{ name: 'models/gemini-2.5-flash' }]));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeDescriptor({
          apiFormat: 'gemini',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
          id: 'google-gemini'
        }),
        apiKey: 'test-key'
      });

      // Falls back entirely to config rules — gemini-* matches chat/tools/vision
      expect(result).toSucceedAndSatisfy((models) => {
        expect(models[0].capabilities.has('chat')).toBe(true);
      });
    });

    test('uses x-goog-api-key auth header', async () => {
      mockFetchResponse(geminiListBody([{ name: 'models/gemini-pro' }]));

      await AiAssist.callProviderListModels({
        descriptor: makeDescriptor({
          apiFormat: 'gemini',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
          id: 'google-gemini'
        }),
        apiKey: 'test-key'
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].headers['x-goog-api-key']).toBe('test-key');
    });

    test('surfaces Gemini network errors', async () => {
      mockFetchError(new Error('ENETUNREACH'));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeDescriptor({
          apiFormat: 'gemini',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
          id: 'google-gemini'
        }),
        apiKey: 'test-key'
      });

      expect(result).toFailWith(/ENETUNREACH/);
    });
  });

  describe('capability rule semantics', () => {
    test('multiple matching rules union their capabilities', async () => {
      mockFetchResponse(openAiListBody(['multi-1']));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeImageDescriptor(),
        apiKey: 'test-key',
        capabilityConfig: {
          global: [
            { idPattern: /^multi-/, capabilities: ['chat'] },
            { idPattern: /-1$/, capabilities: ['vision'] }
          ]
        }
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models[0].capabilities.has('chat')).toBe(true);
        expect(models[0].capabilities.has('vision')).toBe(true);
      });
    });

    test('first rule with displayName wins', async () => {
      mockFetchResponse(openAiListBody(['model-x']));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeImageDescriptor(),
        apiKey: 'test-key',
        capabilityConfig: {
          perProvider: {
            openai: [
              { idPattern: /^model-/, capabilities: ['chat'], displayName: 'First Match' },
              { idPattern: /^model-/, capabilities: ['vision'], displayName: 'Second Match' }
            ]
          }
        }
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models[0].displayName).toBe('First Match');
      });
    });

    test('per-provider rules apply before global rules', async () => {
      mockFetchResponse(openAiListBody(['x']));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeImageDescriptor(),
        apiKey: 'test-key',
        capabilityConfig: {
          perProvider: {
            openai: [{ idPattern: /./, capabilities: ['tools'], displayName: 'from per-provider' }]
          },
          global: [{ idPattern: /./, capabilities: ['chat'], displayName: 'from global' }]
        }
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models[0].capabilities.has('tools')).toBe(true);
        expect(models[0].capabilities.has('chat')).toBe(true);
        expect(models[0].displayName).toBe('from per-provider');
      });
    });

    test('function-form displayName receives the model id', async () => {
      mockFetchResponse(openAiListBody(['hello-world']));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeImageDescriptor(),
        apiKey: 'test-key',
        capabilityConfig: {
          global: [{ idPattern: /./, capabilities: ['chat'], displayName: (id: string) => id.toUpperCase() }]
        }
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models[0].displayName).toBe('HELLO-WORLD');
      });
    });

    test('models with no matching rules surface with empty capabilities', async () => {
      mockFetchResponse(openAiListBody(['totally-unknown-model']));

      const result = await AiAssist.callProviderListModels({
        descriptor: makeImageDescriptor(),
        apiKey: 'test-key',
        capabilityConfig: { perProvider: {}, global: [] }
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models[0].capabilities.size).toBe(0);
      });
    });
  });

  describe('ollama and openai-compat default config (catch-all chat)', () => {
    test('ollama: default config assigns chat to any model', async () => {
      mockFetchResponse(openAiListBody(['llama3.2', 'qwen2.5']));
      const descriptor = AiAssist.getProviderDescriptor('ollama').orThrow();

      const result = await AiAssist.callProviderListModels({
        descriptor,
        apiKey: '',
        endpoint: 'http://localhost:11434/v1'
      });

      expect(result).toSucceedAndSatisfy((models) => {
        for (const m of models) {
          expect(m.capabilities.has('chat')).toBe(true);
        }
      });
    });

    test('openai-compat: default config assigns chat to any model', async () => {
      mockFetchResponse(openAiListBody(['local-model']));
      const descriptor = AiAssist.getProviderDescriptor('openai-compat').orThrow();

      const result = await AiAssist.callProviderListModels({
        descriptor,
        apiKey: '',
        endpoint: 'http://192.168.1.42:1234/v1'
      });

      expect(result).toSucceedAndSatisfy((models) => {
        expect(models[0].capabilities.has('chat')).toBe(true);
      });
    });
  });
});

describe('callProxiedListModels', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('calls the proxy list-models endpoint and rebuilds capabilities as Set', async () => {
    mockFetchResponse({
      models: [
        {
          id: 'dall-e-3',
          capabilities: ['image-generation'],
          displayName: 'DALL·E 3'
        },
        { id: 'gpt-4o', capabilities: ['chat', 'tools', 'vision'] }
      ]
    });

    const result = await AiAssist.callProxiedListModels('http://localhost:3001', {
      descriptor: makeImageDescriptor(),
      apiKey: 'test-key'
    });

    expect(result).toSucceedAndSatisfy((models) => {
      expect(models).toHaveLength(2);
      expect(models[0].id).toBe('dall-e-3');
      expect(models[0].capabilities).toBeInstanceOf(Set);
      expect(models[0].capabilities.has('image-generation')).toBe(true);
      expect(models[0].displayName).toBe('DALL·E 3');
      expect(models[1].displayName).toBeUndefined();
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toBe('http://localhost:3001/api/ai/list-models');
    const body = JSON.parse(fetchCall[1].body);
    expect(body).toEqual({ providerId: 'openai', apiKey: 'test-key' });
  });

  test('forwards capability filter in the request body', async () => {
    mockFetchResponse({ models: [] });

    await AiAssist.callProxiedListModels('http://localhost:3001', {
      descriptor: makeImageDescriptor(),
      apiKey: 'test-key',
      capability: 'image-generation'
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.capability).toBe('image-generation');
  });

  test('surfaces proxy error response', async () => {
    mockFetchResponse({ error: 'upstream auth failed' });

    const result = await AiAssist.callProxiedListModels('http://localhost:3001', {
      descriptor: makeImageDescriptor(),
      apiKey: 'test-key'
    });

    expect(result).toFailWith(/proxy: upstream auth failed/);
  });

  test('fails when proxy returns malformed response', async () => {
    mockFetchResponse({ models: [{ id: 'x' }] }); // missing capabilities

    const result = await AiAssist.callProxiedListModels('http://localhost:3001', {
      descriptor: makeImageDescriptor(),
      apiKey: 'test-key'
    });

    expect(result).toFailWith(/proxy returned invalid response/i);
  });

  test('forwards abort signal', async () => {
    mockFetchResponse({ models: [] });
    const controller = new AbortController();

    await AiAssist.callProxiedListModels('http://localhost:3001', {
      descriptor: makeImageDescriptor(),
      apiKey: 'test-key',
      signal: controller.signal
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[1].signal).toBe(controller.signal);
  });

  test('surfaces fetch network errors', async () => {
    mockFetchError(new Error('ECONNREFUSED'));

    const result = await AiAssist.callProxiedListModels('http://localhost:3001', {
      descriptor: makeImageDescriptor(),
      apiKey: 'test-key'
    });

    expect(result).toFailWith(/ECONNREFUSED/);
  });
});
