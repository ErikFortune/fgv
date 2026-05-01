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

describe('AiAssist.registry', () => {
  describe('getProviderDescriptors', () => {
    test('returns all built-in providers', () => {
      const descriptors = AiAssist.getProviderDescriptors();
      expect(descriptors.length).toBeGreaterThan(0);

      // Should include copy-paste and at least some API providers
      const ids = descriptors.map((d) => d.id);
      expect(ids).toContain('copy-paste');
      expect(ids).toContain('xai-grok');
      expect(ids).toContain('anthropic');
      expect(ids).toContain('google-gemini');
    });

    test('copy-paste is the first provider', () => {
      const descriptors = AiAssist.getProviderDescriptors();
      expect(descriptors[0].id).toBe('copy-paste');
    });
  });

  describe('getProviderDescriptor', () => {
    test('returns descriptor for known provider', () => {
      expect(AiAssist.getProviderDescriptor('xai-grok')).toSucceedAndSatisfy((desc) => {
        expect(desc.id).toBe('xai-grok');
        expect(desc.label).toBe('xAI Grok');
        expect(desc.needsSecret).toBe(true);
        expect(desc.apiFormat).toBe('openai');
        expect(desc.baseUrl).toBeTruthy();
        expect(desc.defaultModel).toEqual({
          base: 'grok-4-1-fast',
          tools: 'grok-4-1-fast-reasoning',
          image: 'grok-2-image-1212'
        });
        expect(desc.supportedTools).toContain('web_search');
        expect(desc.imageGeneration).toEqual([{ modelPrefix: '', format: 'xai-images' }]);
      });
    });

    test('returns descriptor with image generation support for openai', () => {
      expect(AiAssist.getProviderDescriptor('openai')).toSucceedAndSatisfy((desc) => {
        expect(desc.imageGeneration).toEqual([
          { modelPrefix: 'gpt-image-', format: 'openai-images', acceptsImageReferenceInput: true },
          { modelPrefix: '', format: 'openai-images' }
        ]);
        expect(AiAssist.resolveModel(desc.defaultModel, 'image')).toBe('dall-e-3');
      });
    });

    test('returns descriptor with image generation support for google-gemini', () => {
      expect(AiAssist.getProviderDescriptor('google-gemini')).toSucceedAndSatisfy((desc) => {
        expect(desc.imageGeneration).toEqual([
          { modelPrefix: 'imagen-', format: 'gemini-imagen' },
          { modelPrefix: '', format: 'gemini-image-out', acceptsImageReferenceInput: true }
        ]);
        expect(AiAssist.resolveModel(desc.defaultModel, 'image')).toBe('gemini-2.5-flash-image');
      });
    });

    test('vision-capable providers declare acceptsImageInput=true', () => {
      for (const id of ['openai', 'anthropic', 'google-gemini', 'xai-grok'] as const) {
        expect(AiAssist.getProviderDescriptor(id)).toSucceedAndSatisfy((desc) => {
          expect(desc.acceptsImageInput).toBe(true);
        });
      }
    });

    test('non-vision providers declare acceptsImageInput=false', () => {
      for (const id of ['copy-paste', 'groq', 'mistral'] as const) {
        expect(AiAssist.getProviderDescriptor(id)).toSucceedAndSatisfy((desc) => {
          expect(desc.acceptsImageInput).toBe(false);
        });
      }
    });

    test('chat-only providers do not declare image-generation capabilities', () => {
      for (const id of ['anthropic', 'groq', 'mistral', 'copy-paste'] as const) {
        expect(AiAssist.getProviderDescriptor(id)).toSucceedAndSatisfy((desc) => {
          expect(desc.imageGeneration).toBeUndefined();
          expect(AiAssist.supportsImageGeneration(desc)).toBe(false);
        });
      }
    });

    test('copy-paste provider has no supported tools', () => {
      expect(AiAssist.getProviderDescriptor('copy-paste')).toSucceedAndSatisfy((desc) => {
        expect(desc.supportedTools).toEqual([]);
      });
    });

    test('fails for unknown provider', () => {
      expect(AiAssist.getProviderDescriptor('unknown-provider')).toFailWith(/unknown AI provider/i);
    });

    test('exposes ollama as a non-secret openai-format provider with a localhost default', () => {
      expect(AiAssist.getProviderDescriptor('ollama')).toSucceedAndSatisfy((desc) => {
        expect(desc.needsSecret).toBe(false);
        expect(desc.apiFormat).toBe('openai');
        expect(desc.baseUrl).toBe('http://localhost:11434/v1');
      });
    });

    test('exposes openai-compat as a non-secret openai-format provider with no default baseUrl', () => {
      expect(AiAssist.getProviderDescriptor('openai-compat')).toSucceedAndSatisfy((desc) => {
        expect(desc.needsSecret).toBe(false);
        expect(desc.apiFormat).toBe('openai');
        expect(desc.baseUrl).toBe('');
      });
    });
  });

  describe('resolveImageCapability', () => {
    test('returns the matching capability for a model that hits a specific prefix', () => {
      const descriptor = AiAssist.getProviderDescriptor('google-gemini').orThrow();
      const capability = AiAssist.resolveImageCapability(descriptor, 'imagen-3.0-generate-002');
      expect(capability).toEqual({ modelPrefix: 'imagen-', format: 'gemini-imagen' });
    });

    test('falls back to the catch-all entry when no specific prefix matches', () => {
      const descriptor = AiAssist.getProviderDescriptor('google-gemini').orThrow();
      const capability = AiAssist.resolveImageCapability(descriptor, 'gemini-2.5-flash-image');
      expect(capability).toEqual({
        modelPrefix: '',
        format: 'gemini-image-out',
        acceptsImageReferenceInput: true
      });
    });

    test('selects the most specific (longest) prefix even when the catch-all is listed first', () => {
      // Order is intentionally "wrong": catch-all first, specific prefix
      // second. The longest matching prefix should still win.
      const descriptor: AiAssist.IAiProviderDescriptor = {
        id: 'openai',
        label: 'X',
        buttonLabel: 'X',
        needsSecret: true,
        apiFormat: 'openai',
        baseUrl: 'https://example.com',
        defaultModel: 'gpt-image-1',
        supportedTools: [],
        corsRestricted: false,
        streamingCorsRestricted: false,
        acceptsImageInput: true,
        imageGeneration: [
          { modelPrefix: '', format: 'openai-images' },
          { modelPrefix: 'gpt-image-', format: 'openai-images', acceptsImageReferenceInput: true }
        ]
      };
      expect(AiAssist.resolveImageCapability(descriptor, 'gpt-image-1')).toEqual({
        modelPrefix: 'gpt-image-',
        format: 'openai-images',
        acceptsImageReferenceInput: true
      });
    });

    test('routes openai built-in models to the right capability by prefix', () => {
      const descriptor = AiAssist.getProviderDescriptor('openai').orThrow();
      // gpt-image-1 hits the specific prefix → refs supported.
      expect(AiAssist.resolveImageCapability(descriptor, 'gpt-image-1')).toEqual({
        modelPrefix: 'gpt-image-',
        format: 'openai-images',
        acceptsImageReferenceInput: true
      });
      // dall-e-3 falls back to the catch-all → no refs (per OpenAI's API).
      expect(AiAssist.resolveImageCapability(descriptor, 'dall-e-3')).toEqual({
        modelPrefix: '',
        format: 'openai-images'
      });
    });

    test('returns undefined when the provider declares no image-generation capabilities', () => {
      const descriptor = AiAssist.getProviderDescriptor('anthropic').orThrow();
      expect(AiAssist.resolveImageCapability(descriptor, 'claude-3-opus')).toBeUndefined();
    });
  });

  describe('allProviderIds', () => {
    test('contains all provider ids in same order as descriptors', () => {
      const descriptors = AiAssist.getProviderDescriptors();
      const expectedIds = descriptors.map((d) => d.id);
      expect(AiAssist.allProviderIds).toEqual(expectedIds);
    });
  });
});
