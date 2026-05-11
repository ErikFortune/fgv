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
 * Tests for callProviderImageGeneration and callProxiedImageGeneration.
 * Split from apiClient.test.ts to stay within the 2000-line limit.
 */

import '@fgv/ts-utils-jest';

import { AiAssist } from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type {
  AiImageApiFormat,
  IAiImageModelCapability,
  IAiProviderDescriptor
} from '../../../packlets/ai-assist/model';

// ============================================================================
// Shared test fixtures
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

// ============================================================================
// Mock helpers
// ============================================================================

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
// Image generation helpers
// ============================================================================

function imgGen(
  format: AiImageApiFormat,
  acceptsRefs: boolean = false,
  extra: Partial<IAiImageModelCapability> = {}
): ReadonlyArray<IAiImageModelCapability> {
  return [
    {
      modelPrefix: '',
      format,
      ...(acceptsRefs ? { acceptsImageReferenceInput: true } : {}),
      ...extra
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
    imageGeneration: imgGen('openai-images', false, {
      outputParamStyle: 'response-format',
      supportsQualityParam: true,
      defaultOutputMimeType: 'image/png'
    }),
    ...overrides
  };
}

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
// callProviderImageGeneration
// ============================================================================

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

  describe('openai-images format — gpt-image-1 (output-format style)', () => {
    const gptImageDescriptor = makeImageDescriptor({
      imageGeneration: [
        {
          modelPrefix: 'gpt-image-',
          format: 'openai-images',
          acceptsImageReferenceInput: true,
          supportsQualityParam: true,
          acceptedQualities: ['low', 'medium', 'high', 'auto'],
          outputParamStyle: 'output-format',
          defaultOutputMimeType: 'image/png'
        }
      ]
    });

    test('sends output_format instead of response_format for gpt-image-1', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));

      await AiAssist.callProviderImageGeneration({
        descriptor: gptImageDescriptor,
        apiKey: 'test-key',
        modelOverride: 'gpt-image-1',
        params: { prompt: 'a cat' }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.output_format).toBe('png');
      expect(body.response_format).toBeUndefined();
    });

    test('uses outputFormat from gpt-image options block for mime type and output_format', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));

      const result = await AiAssist.callProviderImageGeneration({
        descriptor: gptImageDescriptor,
        apiKey: 'test-key',
        modelOverride: 'gpt-image-1',
        params: {
          prompt: 'a cat',
          options: {
            models: [
              {
                provider: 'openai',
                family: 'gpt-image',
                config: {
                  outputFormat: 'webp',
                  outputCompression: 80,
                  background: 'transparent',
                  moderation: 'low'
                }
              }
            ]
          }
        }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images[0].mimeType).toBe('image/webp');
      });
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.output_format).toBe('webp');
      expect(body.output_compression).toBe(80);
      expect(body.background).toBe('transparent');
      expect(body.moderation).toBe('low');
    });

    test('sends style from dall-e options block', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));
      const dallE3Descriptor = makeImageDescriptor({
        imageGeneration: [
          {
            modelPrefix: '',
            format: 'openai-images',
            outputParamStyle: 'response-format',
            supportsQualityParam: true,
            defaultOutputMimeType: 'image/png'
          }
        ]
      });

      await AiAssist.callProviderImageGeneration({
        descriptor: dallE3Descriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'a cat',
          options: {
            models: [{ provider: 'openai', family: 'dall-e', config: { style: 'vivid' } }]
          }
        }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.style).toBe('vivid');
    });

    test('sends otherParams merged into request body', async () => {
      mockFetchResponse(openAiImageBody(['AAAA']));

      await AiAssist.callProviderImageGeneration({
        descriptor: gptImageDescriptor,
        apiKey: 'test-key',
        modelOverride: 'gpt-image-1',
        params: {
          prompt: 'a cat',
          options: {
            models: [{ provider: 'other', models: ['gpt-image-1'], config: { custom_field: 'custom_value' } }]
          }
        }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.custom_field).toBe('custom_value');
    });
  });

  describe('xai-images format', () => {
    const descriptor = makeImageDescriptor({
      id: 'xai-grok',
      label: 'xAI Grok',
      buttonLabel: 'AI Assist | Grok',
      apiFormat: 'openai',
      baseUrl: 'https://api.x.ai/v1',
      defaultModel: { base: 'grok-4-1-fast', image: 'grok-imagine-image-quality' },
      corsRestricted: true,
      imageGeneration: imgGen('xai-images', false, { defaultOutputMimeType: 'image/jpeg' })
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

    test('sends aspect_ratio and resolution from grok-imagine block', async () => {
      mockFetchResponse(openAiImageBody(['XYZ']));

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'a cat',
          options: {
            models: [
              {
                provider: 'xai',
                family: 'grok-imagine',
                config: { aspectRatio: '16:9', resolution: '1280x720' }
              }
            ]
          }
        }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.aspect_ratio).toBe('16:9');
      expect(body.resolution).toBe('1280x720');
      expect(body.response_format).toBe('b64_json');
    });

    test('merges otherParams into xai generations body', async () => {
      mockFetchResponse(openAiImageBody(['XYZ']));

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'a cat',
          options: {
            models: [
              { provider: 'other', models: ['grok-imagine-image-quality'], config: { custom: 'value' } }
            ]
          }
        }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.custom).toBe('value');
    });
  });

  describe('gemini-imagen format', () => {
    const descriptor = makeImageDescriptor({
      id: 'google-gemini',
      label: 'Google Gemini',
      buttonLabel: 'AI Assist | Gemini',
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: { base: 'gemini-2.5-flash', image: 'imagen-4.0-generate-001' },
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
            models: [
              {
                provider: 'google',
                family: 'imagen-4',
                config: { aspectRatio: '16:9' }
              }
            ]
          }
        }
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe(
        'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict'
      );
      expect(fetchCall[1].headers['x-goog-api-key']).toBe('test-key');
      const body = JSON.parse(fetchCall[1].body);
      expect(body).toEqual({
        instances: [{ prompt: 'a cat' }],
        parameters: {
          sampleCount: 2,
          aspectRatio: '16:9',
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

    test('sends optional Imagen parameters via models block', async () => {
      mockFetchResponse(imagenBody(['GGG']));

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'a cat',
          options: {
            count: 2,
            seed: 7,
            models: [
              {
                provider: 'google',
                family: 'imagen-4',
                config: {
                  imageSize: '2K',
                  addWatermark: false,
                  enhancePrompt: true,
                  outputMimeType: 'image/jpeg',
                  outputCompressionQuality: 85,
                  personGeneration: 'allow_all'
                }
              }
            ]
          }
        }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.parameters).toMatchObject({
        sampleCount: 2,
        imageSize: '2K',
        addWatermark: false,
        enhancePrompt: true,
        outputOptions: { mimeType: 'image/jpeg', compressionQuality: 85 },
        personGeneration: 'allow_all',
        seed: 7
      });
    });

    test('merges otherParams into Imagen parameters', async () => {
      mockFetchResponse(imagenBody(['GGG']));

      await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'a cat',
          options: {
            models: [
              {
                provider: 'other',
                models: ['imagen-4.0-generate-001'],
                config: { sampleImageStyle: 'photograph' }
              }
            ]
          }
        }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.parameters.sampleImageStyle).toBe('photograph');
    });
  });

  describe('validation failures', () => {
    test('fails when count exceeds capability maxCount', async () => {
      const descriptor = makeImageDescriptor({
        imageGeneration: [{ modelPrefix: '', format: 'gemini-imagen', maxCount: 1 }]
      });

      const result = await AiAssist.callProviderImageGeneration({
        descriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat', options: { count: 5 } }
      });

      expect(result).toFailWith(/count 5 exceeds maximum/i);
    });
  });

  describe('xai-images-edits format', () => {
    const xaiEditsDescriptor = makeImageDescriptor({
      id: 'xai-grok',
      label: 'xAI Grok',
      buttonLabel: 'AI Assist | Grok',
      apiFormat: 'openai',
      baseUrl: 'https://api.x.ai/v1',
      defaultModel: { base: 'grok-4-1-fast', image: 'grok-imagine-image-quality' },
      corsRestricted: true,
      imageGeneration: [
        {
          modelPrefix: 'grok-imagine-',
          format: 'xai-images-edits',
          acceptsImageReferenceInput: true,
          defaultOutputMimeType: 'image/jpeg'
        }
      ]
    });

    test('routes to generations endpoint when no refs provided', async () => {
      mockFetchResponse(openAiImageBody(['XYZ']));

      const result = await AiAssist.callProviderImageGeneration({
        descriptor: xaiEditsDescriptor,
        apiKey: 'test-key',
        params: { prompt: 'a cat' }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images[0].mimeType).toBe('image/jpeg');
        expect(response.images[0].base64).toBe('XYZ');
      });
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.x.ai/v1/images/generations');
    });

    test('routes to edits endpoint with JSON body when refs provided', async () => {
      mockFetchResponse(openAiImageBody(['XYZ']));
      const TEST_IMG: AiAssist.IAiImageAttachment = { mimeType: 'image/png', base64: 'AAAA' };

      const result = await AiAssist.callProviderImageGeneration({
        descriptor: xaiEditsDescriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'add sunglasses',
          referenceImages: [TEST_IMG],
          options: {
            count: 2,
            models: [
              {
                provider: 'xai',
                family: 'grok-imagine',
                config: { aspectRatio: '16:9', resolution: '1280x720' }
              }
            ]
          }
        }
      });

      expect(result).toSucceedAndSatisfy((response) => {
        expect(response.images[0].base64).toBe('XYZ');
        expect(response.images[0].mimeType).toBe('image/jpeg');
      });
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      expect(fetchCall[0]).toBe('https://api.x.ai/v1/images/edits');
      const body = JSON.parse(fetchCall[1].body);
      expect(body.model).toBe('grok-imagine-image-quality');
      expect(body.n).toBe(2);
      expect(body.response_format).toBe('b64_json');
      expect(body.aspect_ratio).toBe('16:9');
      expect(body.resolution).toBe('1280x720');
      expect(body.image).toHaveLength(1);
      expect(body.image[0].type).toBe('image_url');
    });

    test('merges otherParams into xai edits body', async () => {
      mockFetchResponse(openAiImageBody(['XYZ']));
      const TEST_IMG: AiAssist.IAiImageAttachment = { mimeType: 'image/png', base64: 'AAAA' };

      await AiAssist.callProviderImageGeneration({
        descriptor: xaiEditsDescriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'add sunglasses',
          referenceImages: [TEST_IMG],
          options: {
            models: [
              {
                provider: 'other',
                models: ['grok-imagine-image-quality'],
                config: { style_preset: 'cinematic' }
              }
            ]
          }
        }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.style_preset).toBe('cinematic');
    });

    test('fails when more than 3 reference images are provided', async () => {
      const TEST_IMG: AiAssist.IAiImageAttachment = { mimeType: 'image/png', base64: 'AAAA' };

      const result = await AiAssist.callProviderImageGeneration({
        descriptor: xaiEditsDescriptor,
        apiKey: 'test-key',
        params: { prompt: 'add sunglasses', referenceImages: [TEST_IMG, TEST_IMG, TEST_IMG, TEST_IMG] }
      });

      expect(result).toFailWith(/at most 3 reference images/i);
    });

    test('surfaces network errors from xai edits endpoint', async () => {
      mockFetchError(new Error('ETIMEDOUT'));
      const TEST_IMG: AiAssist.IAiImageAttachment = { mimeType: 'image/png', base64: 'AAAA' };

      const result = await AiAssist.callProviderImageGeneration({
        descriptor: xaiEditsDescriptor,
        apiKey: 'test-key',
        params: { prompt: 'add sunglasses', referenceImages: [TEST_IMG] }
      });

      expect(result).toFailWith(/ETIMEDOUT/);
    });
  });

  describe('gemini-image-out format with generationConfig', () => {
    const geminiImageOutDescriptor = makeImageDescriptor({
      id: 'google-gemini',
      label: 'Google Gemini',
      buttonLabel: 'AI Assist | Gemini',
      apiFormat: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: { base: 'gemini-2.5-flash', image: 'gemini-2.5-flash-image' },
      imageGeneration: [{ modelPrefix: '', format: 'gemini-image-out', acceptsImageReferenceInput: true }]
    });

    function geminiImageOutBody(images: Array<{ mimeType: string; data: string }>): unknown {
      return {
        candidates: [
          {
            content: {
              parts: images.map((img) => ({ inlineData: img }))
            }
          }
        ]
      };
    }

    test('sends generationConfig with imageConfig when geminiAspectRatio is set', async () => {
      mockFetchResponse(geminiImageOutBody([{ mimeType: 'image/png', data: 'PPPP' }]));

      await AiAssist.callProviderImageGeneration({
        descriptor: geminiImageOutDescriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'a robot',
          options: {
            models: [{ provider: 'google', family: 'gemini-flash-image', config: { aspectRatio: '16:9' } }]
          }
        }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.generationConfig).toEqual({ imageConfig: { aspectRatio: '16:9' } });
    });

    test('merges otherParams into generationConfig', async () => {
      mockFetchResponse(geminiImageOutBody([{ mimeType: 'image/png', data: 'PPPP' }]));

      await AiAssist.callProviderImageGeneration({
        descriptor: geminiImageOutDescriptor,
        apiKey: 'test-key',
        params: {
          prompt: 'a robot',
          options: {
            models: [
              {
                provider: 'other',
                models: ['gemini-2.5-flash-image'],
                config: { responseModalities: ['IMAGE'] }
              }
            ]
          }
        }
      });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(body.generationConfig).toEqual({ responseModalities: ['IMAGE'] });
    });
  });
});

// ============================================================================
// callProxiedImageGeneration
// ============================================================================

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
