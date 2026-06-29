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
// Test helpers (mirrors apiClient.test.ts; kept local to stay under the
// per-file line cap).
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
    thinkingMode: 'optional',
    imageGeneration: imgGen('openai-images'),
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

function openAiImageBody(b64s: string[]): unknown {
  return { data: b64s.map((b64) => ({ b64_json: b64 })) };
}

function geminiImageOutBody(
  images: ReadonlyArray<{ mimeType: string; base64: string }>,
  textPart?: string
): unknown {
  const parts: Array<Record<string, unknown>> = [];
  if (textPart !== undefined) {
    parts.push({ text: textPart });
  }
  for (const img of images) {
    parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } });
  }
  return {
    candidates: [{ content: { parts }, finishReason: 'STOP' }]
  };
}

const TEST_PNG: AiAssist.IAiImageAttachment = {
  mimeType: 'image/png',
  base64: 'AAAA'
};
const TEST_JPEG: AiAssist.IAiImageAttachment = {
  mimeType: 'image/jpeg',
  base64: 'BBBB',
  detail: 'high'
};
const TEST_WEBP: AiAssist.IAiImageAttachment = {
  mimeType: 'image/webp',
  base64: 'CCCC'
};
const TEST_GIF: AiAssist.IAiImageAttachment = {
  mimeType: 'image/gif',
  base64: 'DDDD'
};
const TEST_UNKNOWN_MIME: AiAssist.IAiImageAttachment = {
  mimeType: 'image/heic',
  base64: 'EEEE'
};

// ============================================================================
// Tests
// ============================================================================

describe('callProviderImageGeneration — reference images', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('pre-flight', () => {
    test('rejects refs when capability does not declare acceptsImageReferenceInput', async () => {
      const descriptor = makeImageDescriptor({
        id: 'xai-grok',
        baseUrl: 'https://api.x.ai/v1',
        imageGeneration: imgGen('xai-images')
      });

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat', referenceImages: [TEST_PNG] }
      });

      expect(result).toFailWith(/does not support reference images/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('rejects when no capability rule matches the resolved model', async () => {
      // Descriptor declares image generation, but only for `dall-e-*` models —
      // there's no catch-all, and the requested model `gpt-image-1` doesn't
      // match the prefix.
      const descriptor = makeImageDescriptor({
        defaultModel: { base: 'gpt-4o', image: 'gpt-image-1' },
        imageGeneration: [{ modelPrefix: 'dall-e-', format: 'openai-images' }]
      });

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toFailWith(/does not support image generation for model "gpt-image-1"/i);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('treats empty referenceImages array as no-refs (no pre-flight rejection)', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const descriptor = makeImageDescriptor();

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat', referenceImages: [] }
      });

      expect(result).toSucceed();
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/images/generations');
    });
  });

  describe('openai-images format with reference images', () => {
    test('routes to /images/edits with multipart body when refs present', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const descriptor = makeImageDescriptor({ imageGeneration: imgGen('openai-images', true) });

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        modelOverride: 'gpt-image-1',
        params: {
          prompt: 'same character side view',
          options: { count: 2, size: '1024x1024', quality: 'high', seed: 42 },
          referenceImages: [TEST_PNG, TEST_JPEG]
        }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images).toHaveLength(1);
        expect(response.images[0].base64).toBe('AAAA');
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.openai.com/v1/images/edits');
      // eslint-disable-next-line dot-notation
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer test-key');
      expect(fetchCall[1].headers['Content-Type']).toBeUndefined();
      const body = fetchCall[1].body as FormData;
      expect(body).toBeInstanceOf(FormData);
      expect(body.get('model')).toBe('gpt-image-1');
      expect(body.get('prompt')).toBe('same character side view');
      expect(body.get('n')).toBe('2');
      expect(body.get('response_format')).toBe('b64_json');
      expect(body.get('size')).toBe('1024x1024');
      // quality and seed are not sent in multipart edits (wire format does not support them)
      expect(body.get('quality')).toBeNull();
      expect(body.get('seed')).toBeNull();
      const refs = body.getAll('image[]');
      expect(refs).toHaveLength(2);
      expect((refs[0] as Blob).type).toBe('image/png');
      expect((refs[1] as Blob).type).toBe('image/jpeg');
    });

    test('attaches refs of varied mime types with sensible filename extensions', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const descriptor = makeImageDescriptor({ imageGeneration: imgGen('openai-images', true) });

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'mixed refs',
          referenceImages: [TEST_PNG, TEST_JPEG, TEST_WEBP, TEST_GIF, TEST_UNKNOWN_MIME]
        }
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = fetchCall[1].body as FormData;
      const refs = body.getAll('image[]');
      expect(refs).toHaveLength(5);
      expect((refs[0] as Blob).type).toBe('image/png');
      expect((refs[1] as Blob).type).toBe('image/jpeg');
      expect((refs[2] as Blob).type).toBe('image/webp');
      expect((refs[3] as Blob).type).toBe('image/gif');
      expect((refs[4] as Blob).type).toBe('image/heic');
    });

    test('forwards abort signal on multipart edits request', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const descriptor = makeImageDescriptor({ imageGeneration: imgGen('openai-images', true) });
      const controller = new AbortController();

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat', referenceImages: [TEST_PNG] },
        signal: controller.signal
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[1].signal).toBe(controller.signal);
    });

    test('surfaces non-2xx errors from /images/edits', async () => {
      mockFetchHttpError(400, 'unsupported model');
      const descriptor = makeImageDescriptor({ imageGeneration: imgGen('openai-images', true) });

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat', referenceImages: [TEST_PNG] }
      });

      expect(result).toFailWith(/400/);
    });

    test('surfaces network errors from /images/edits', async () => {
      mockFetchError(new Error('ECONNREFUSED'));
      const descriptor = makeImageDescriptor({ imageGeneration: imgGen('openai-images', true) });

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat', referenceImages: [TEST_PNG] }
      });

      expect(result).toFailWith(/ECONNREFUSED/);
    });
  });

  describe('gemini-image-out format', () => {
    const descriptor = makeImageDescriptor({
      id: 'google-gemini',
      label: 'Google Gemini',
      buttonLabel: 'AI Assist | Gemini',
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: { base: 'gemini-3.5-flash', image: 'gemini-3.1-flash-image-preview' },
      // Mirrors the built-in google-gemini descriptor: a single catch-all routes
      // every image model to chat-style :generateContent.
      imageGeneration: [{ modelPrefix: '', format: 'gemini-image-out', acceptsImageReferenceInput: true }]
    });

    test('returns image parsed from inlineData parts (text-only request)', async () => {
      mockFetchResponse(geminiImageOutBody([{ mimeType: 'image/png', base64: 'PPPP' }]));

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a friendly robot' }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images).toHaveLength(1);
        expect(response.images[0].mimeType).toBe('image/png');
        expect(response.images[0].base64).toBe('PPPP');
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent'
      );
      expect(fetchCall[1].headers['x-goog-api-key']).toBe('test-key');
      const body = JSON.parse(fetchCall[1].body);
      expect(body).toEqual({
        contents: [{ role: 'user', parts: [{ text: 'a friendly robot' }] }]
      });
    });

    test('skips text parts and returns only images when both are present', async () => {
      mockFetchResponse(
        geminiImageOutBody([{ mimeType: 'image/png', base64: 'PPPP' }], 'Here is your image:')
      );

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a robot' }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images).toHaveLength(1);
        expect(response.images[0].base64).toBe('PPPP');
      });
    });

    test('sends inlineData parts when reference images are provided', async () => {
      mockFetchResponse(geminiImageOutBody([{ mimeType: 'image/png', base64: 'PPPP' }]));

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'same character, side view',
          referenceImages: [TEST_PNG, TEST_JPEG]
        }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.contents).toHaveLength(1);
      expect(body.contents[0].role).toBe('user');
      expect(body.contents[0].parts).toEqual([
        { text: 'same character, side view' },
        { inlineData: { mimeType: 'image/png', data: 'AAAA' } },
        { inlineData: { mimeType: 'image/jpeg', data: 'BBBB' } }
      ]);
    });

    test('returns multiple images when response has multiple inlineData parts', async () => {
      mockFetchResponse(
        geminiImageOutBody([
          { mimeType: 'image/png', base64: 'PPPP' },
          { mimeType: 'image/png', base64: 'QQQQ' }
        ])
      );

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'two robots' }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images.map((i) => i.base64)).toEqual(['PPPP', 'QQQQ']);
      });
    });

    test('fails when response has no inlineData parts', async () => {
      mockFetchResponse(geminiImageOutBody([], 'sorry, I cannot generate that image'));

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toFailWith(/no image parts in response/i);
    });

    test('fails when response is malformed', async () => {
      mockFetchResponse({ candidates: [] });

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toFailWith(/Gemini image API response/i);
    });

    test('surfaces network errors', async () => {
      mockFetchError(new Error('ETIMEDOUT'));

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toFailWith(/ETIMEDOUT/);
    });

    test('forwards abort signal', async () => {
      mockFetchResponse(geminiImageOutBody([{ mimeType: 'image/png', base64: 'PPPP' }]));
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
});
