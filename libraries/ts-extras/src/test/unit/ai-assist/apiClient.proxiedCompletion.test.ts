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
 * Tests for callProxiedCompletion optional body fields, error paths, and
 * branch-coverage gaps in image generation helpers.
 */

import '@fgv/ts-utils-jest';

import { JsonSchema } from '@fgv/ts-json-base';
import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiImageModelCapability, IAiProviderDescriptor } from '../../../packlets/ai-assist/model';

// ============================================================================
// Test helpers
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
    ...overrides
  };
}

const testPrompt = new AiAssist.AiPrompt('Generate a recipe', 'You are a helpful assistant');

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

// ============================================================================
// callProxiedCompletion — optional body fields
// ============================================================================

describe('callProxiedCompletion — optional body fields and error paths', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('sends the ordered messages and system in the proxy body', async () => {
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      system: 'You are a helpful assistant',
      messages: [
        { role: 'user', content: 'first turn' },
        { role: 'assistant', content: 'earlier reply' },
        { role: 'user', content: 'more context' }
      ]
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.system).toBe('You are a helpful assistant');
    expect(body.messages).toEqual([
      { role: 'user', content: 'first turn' },
      { role: 'assistant', content: 'earlier reply' },
      { role: 'user', content: 'more context' }
    ]);
  });

  // ==========================================================================
  // Parameters the proxy path used to drop
  //
  // `callProxiedCompletion` documents its params as "Same parameters as
  // callProviderCompletion" and silently discarded four of them. Each test below
  // asserts the REQUEST BODY or the returned value, not merely that the call
  // succeeded — a success-only assertion passes against the broken version, since
  // dropping a parameter is exactly the failure that still returns a 200.
  // ==========================================================================

  test('tier resolves to a concrete model and travels as modelOverride', async () => {
    // Wrong impl this catches: `tier` never destructured, so a frontier request
    // silently resolves to the base model — a caller paying for a model they are
    // not getting, invisible without reading the request body.
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor({
        defaultModel: { base: 'grok-base', advanced: 'grok-advanced' },
        aliases: undefined
      }),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      tier: 'advanced'
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.modelOverride).toBe('grok-advanced');
    // Resolved on this side rather than forwarded, so a proxy that has never heard
    // of tiers still honors it. A `tier` body field would be the giveaway that it
    // had not been.
    expect(body.tier).toBeUndefined();
  });

  test('a frontier tier cascades through the descriptor, not the proxy', async () => {
    // xai-grok declares no frontier key, so frontier must cascade to advanced. The
    // cascade lives in the descriptor walk, which is client-side — pin that the
    // resolved result is what ships.
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor({
        defaultModel: { base: 'grok-base', advanced: 'grok-advanced' },
        aliases: undefined
      }),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      tier: 'frontier'
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.modelOverride).toBe('grok-advanced');
  });

  test('with no tier, modelOverride passes through untouched — including absent', async () => {
    // Wrong impl this catches: resolving unconditionally, which would always send a
    // concrete model and take away the proxy's ability to apply its own default.
    // That would be a silent regression for every existing caller.
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect('modelOverride' in body).toBe(false);
  });

  test('adaptOptionalToNullable rides along in the structuredOutput projection', async () => {
    // The hoist is applied where the wire schema is built, which on this path is
    // the proxy. Wrong impl this catches: the projection forwarding only
    // mode/schema/onUnsupported, so an opted-in caller's schema gets refused or
    // degraded instead of hoisted — and `onUnsupported` then reports a constraint
    // loss the caller had explicitly opted out of.
    mockFetchResponse({ content: '{}', structuredOutput: 'schema' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      structuredOutput: {
        mode: 'schema',
        schema: JsonSchema.object({ name: JsonSchema.string() }),
        adaptOptionalToNullable: true
      }
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.structuredOutput.mode).toBe('schema');
    expect(body.structuredOutput.adaptOptionalToNullable).toBe(true);
  });

  test('endpoint is forwarded so the proxy can target a self-hosted upstream', async () => {
    // Unlike `tier`, this cannot be resolved here — the proxy makes the upstream
    // call. Wrong impl this catches: `endpoint` never destructured, so a caller
    // pointing at a LAN Ollama silently reaches the provider's public API instead.
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      endpoint: 'http://192.168.1.50:11434/v1'
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.endpoint).toBe('http://192.168.1.50:11434/v1');
  });

  test('usage on the proxy response reaches the result', async () => {
    // Wrong impl this catches: never reading response.usage, so the field was
    // unconditionally absent on this path and a consumer concluded their provider
    // does not report usage.
    mockFetchResponse({
      content: 'ok',
      usage: {
        reports: 'reads-and-writes',
        cachedInputTokens: 40,
        cacheWriteTokens: 5,
        outputTokens: 20,
        totalInputTokens: 100
      }
    });

    const result = await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.usage?.reports).toBe('reads-and-writes');
      expect(r.usage?.cachedInputTokens).toBe(40);
      expect(r.usage?.cacheWriteTokens).toBe(5);
    });
  });

  test('a malformed usage block is dropped whole, not partially trusted', async () => {
    // `reports` is required on IAiCompletionUsage — a block that cannot say which
    // of reads/writes it covers is not one this package hands on. Wrong impl this
    // catches: casting the response through instead of validating it, which would
    // surface an object missing the field its consumers branch on.
    mockFetchResponse({ content: 'ok', usage: { cachedInputTokens: 40 } });

    const result = await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.usage).toBeUndefined();
    });
  });

  test('no usage from the proxy leaves the field absent, never a zero', async () => {
    mockFetchResponse({ content: 'ok' });

    const result = await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toSucceedAndSatisfy((r) => {
      expect(r.usage).toBeUndefined();
    });
  });

  test('fails fast when messages is empty (unified invariant, no proxy call)', async () => {
    global.fetch = jest.fn();
    const result = await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      messages: []
    });
    expect(result).toFailWith(/at least one entry/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('drops attachments from history turns, keeping only the current turn in the proxy body', async () => {
    mockFetchResponse({ content: 'ok' });
    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      messages: [
        { role: 'user', content: 'old', attachments: [{ mimeType: 'image/png', base64: 'HISTORY' }] },
        { role: 'user', content: 'now', attachments: [{ mimeType: 'image/png', base64: 'CURRENT' }] }
      ]
    });
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.messages).toEqual([
      { role: 'user', content: 'old' },
      { role: 'user', content: 'now', attachments: [{ mimeType: 'image/png', base64: 'CURRENT' }] }
    ]);
  });

  test('rejects attachments when the provider does not accept image input', async () => {
    global.fetch = jest.fn();
    const result = await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor({ acceptsImageInput: false }),
      apiKey: 'test-key',
      messages: [
        { role: 'user', content: 'describe', attachments: [{ mimeType: 'image/png', base64: 'AA' }] }
      ]
    });
    expect(result).toFailWith(/does not accept image input/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('omits the system key from the proxy body when not provided', async () => {
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      messages: [{ role: 'user', content: 'no system' }]
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.system).toBeUndefined();
    expect(body.messages).toEqual([{ role: 'user', content: 'no system' }]);
  });

  test('includes modelOverride in proxy body when provided', async () => {
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      modelOverride: 'grok-3'
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.modelOverride).toBe('grok-3');
  });

  test('omits modelOverride key when not provided', async () => {
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.modelOverride).toBeUndefined();
  });

  test('includes tools in proxy body when provided', async () => {
    mockFetchResponse({ content: 'ok' });

    const tools: AiAssist.IAiToolEnablement[] = [{ type: 'web_search', enabled: true }];
    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      tools
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.tools).toEqual(tools);
  });

  test('omits tools key when array is empty', async () => {
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      tools: []
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.tools).toBeUndefined();
  });

  test('uses explicit temperature when provided', async () => {
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      temperature: 0.3
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.temperature).toBe(0.3);
  });

  test('omits temperature from the proxy body when the caller does not provide one', async () => {
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    // No default temperature is forwarded — the provider default applies at the proxy's upstream call.
    expect(body.temperature).toBeUndefined();
  });

  test('forwards maxTokens in the proxy body only when explicitly provided', async () => {
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      maxTokens: 5000
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.maxTokens).toBe(5000);
  });

  test('omits maxTokens from the proxy body when the caller does not provide one', async () => {
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    // The proxy maps maxTokens to the correct upstream field; not forwarding it when unset
    // matches the direct path (see AiAssist.usesMaxCompletionTokensField).
    expect(body.maxTokens).toBeUndefined();
  });

  test('forwards cache in the proxy body only when explicitly provided', async () => {
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      cache: { systemBreakpoints: [4], cacheKey: 'tenant-1' }
    });

    // No wire projection needed (unlike structuredOutput's schema) — IAiCacheRequest is plain
    // numbers and a string, so it forwards as-is for the proxy's own callProviderCompletion call.
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.cache).toEqual({ systemBreakpoints: [4], cacheKey: 'tenant-1' });
  });

  test('omits cache from the proxy body when the caller does not provide one', async () => {
    mockFetchResponse({ content: 'ok' });

    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.cache).toBeUndefined();
  });

  test('surfaces fetch network errors', async () => {
    mockFetchError(new Error('ECONNREFUSED'));

    const result = await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toFailWith(/ECONNREFUSED/);
  });

  test('surfaces proxy error string in response', async () => {
    mockFetchResponse({ error: 'upstream provider unavailable' });

    const result = await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toFailWith(/proxy: upstream provider unavailable/);
  });

  test('fails when proxy response has no content field', async () => {
    mockFetchResponse({ truncated: false });

    const result = await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest()
    });

    expect(result).toFailWith(/proxy returned invalid response: missing content/);
  });

  test('forwards thinking field in proxy body when provided', async () => {
    mockFetchResponse({ content: 'ok' });

    const thinking: AiAssist.IThinkingConfig = { effort: 'high' };
    await AiAssist.callProxiedCompletion('http://localhost:3001', {
      descriptor: makeDescriptor(),
      apiKey: 'test-key',
      ...testPrompt.toRequest(),
      thinking
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.thinking).toEqual({ effort: 'high' });
  });
});

// ============================================================================
// Image generation branch coverage — defaultOutputMimeType fallback
// ============================================================================

function openAiImageBody(b64s: string[]): unknown {
  return { data: b64s.map((b64) => ({ b64_json: b64 })) };
}

function imgGen(
  format: IAiImageModelCapability['format'],
  extra: Partial<IAiImageModelCapability> = {}
): ReadonlyArray<IAiImageModelCapability> {
  return [{ modelPrefix: '', format, ...extra }];
}

function makeImageDescriptorWithoutMimeType(
  overrides: Partial<IAiProviderDescriptor> = {}
): IAiProviderDescriptor {
  return {
    id: 'xai-grok',
    label: 'xAI Grok',
    buttonLabel: 'AI Assist | Grok',
    needsSecret: true,
    apiFormat: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    defaultModel: { base: 'grok-4-1-fast', image: 'grok-imagine-image-quality' },
    supportedTools: [],
    corsRestricted: false,
    acceptsImageInput: false,
    streamingCorsRestricted: false,
    imageGeneration: imgGen('xai-images', { outputParamStyle: 'response-format' }),
    ...overrides
  };
}

describe('callProviderImageGeneration — defaultOutputMimeType fallback', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('falls back to image/jpeg when defaultOutputMimeType is not set on xai-images', async () => {
    mockFetchResponse(openAiImageBody(['XYZ']));

    const result = await AiAssist.callProviderImageGeneration({
      descriptor: makeImageDescriptorWithoutMimeType(),
      apiKey: 'test-key',
      params: { prompt: 'a cat' }
    });

    expect(result).toSucceedAndSatisfy((response) => {
      expect(response.images[0].mimeType).toBe('image/jpeg');
    });
  });

  test('falls back to image/jpeg when defaultOutputMimeType not set on xai-images-edits', async () => {
    mockFetchResponse(openAiImageBody(['XYZ']));
    const TEST_IMG: AiAssist.IAiImageAttachment = { mimeType: 'image/png', base64: 'AAAA' };

    const descriptor = makeImageDescriptorWithoutMimeType({
      imageGeneration: imgGen('xai-images-edits', { acceptsImageReferenceInput: true })
    });

    const result = await AiAssist.callProviderImageGeneration({
      descriptor,
      apiKey: 'test-key',
      params: {
        prompt: 'edit this',
        referenceImages: [TEST_IMG]
      }
    });

    expect(result).toSucceedAndSatisfy((response) => {
      expect(response.images[0].mimeType).toBe('image/jpeg');
    });
  });
});
