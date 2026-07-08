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
    thinkingMode: 'optional',
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
    thinkingMode: 'unsupported',
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
