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

  describe('openai model tiers (B2)', () => {
    const desc = AiAssist.getProviderDescriptor('openai').orThrow();

    test('base tier resolves to gpt-5.4-mini', () => {
      // undefined context falls to base; explicit 'base' resolves identically.
      expect(AiAssist.resolveProviderModel(desc, undefined, undefined)).toSucceedWith('gpt-5.4-mini');
      expect(AiAssist.resolveProviderModel(desc, undefined, 'base')).toSucceedWith('gpt-5.4-mini');
    });

    test('advanced tier resolves to gpt-5.5', () => {
      expect(AiAssist.resolveProviderModel(desc, undefined, 'advanced')).toSucceedWith('gpt-5.5');
    });

    test('frontier tier resolves to gpt-5.5-pro', () => {
      expect(AiAssist.resolveProviderModel(desc, undefined, 'frontier')).toSucceedWith('gpt-5.5-pro');
    });

    test('frontier cascades to the advanced id when no frontier key is present', () => {
      // A synthetic OpenAI-shaped descriptor whose tiered map omits frontier — a
      // frontier request must cascade frontier → advanced (→ base), reusing the
      // real aliases block spread from the descriptor.
      const noFrontier: AiAssist.IAiProviderDescriptor = {
        ...desc,
        defaultModel: { base: '@openai:mini', advanced: '@openai:flagship' }
      };
      expect(AiAssist.resolveProviderModel(noFrontier, undefined, 'frontier')).toSucceedWith('gpt-5.5');
    });

    test('image default resolves @openai:image → gpt-image-1.5 and routes via the gpt-image- capability', () => {
      expect(AiAssist.resolveProviderModel(desc, undefined, 'image')).toSucceedWith('gpt-image-1.5');
      expect(AiAssist.resolveImageCapability(desc, 'gpt-image-1.5')).toMatchObject({
        modelPrefix: 'gpt-image-',
        format: 'openai-images'
      });
    });

    test('the non-tier @openai:nano alias resolves via modelOverride only', () => {
      expect(AiAssist.resolveProviderModel(desc, '@openai:nano', undefined)).toSucceedWith('gpt-5.4-nano');
    });

    test('a raw modelOverride passes through verbatim (no alias resolution)', () => {
      expect(AiAssist.resolveProviderModel(desc, 'gpt-custom-tuned:v1', 'advanced')).toSucceedWith(
        'gpt-custom-tuned:v1'
      );
    });
  });

  describe('anthropic model tiers (B3)', () => {
    const desc = AiAssist.getProviderDescriptor('anthropic').orThrow();

    test('base tier resolves to claude-sonnet-5', () => {
      // undefined context falls to base; explicit 'base' resolves identically.
      expect(AiAssist.resolveProviderModel(desc, undefined, undefined)).toSucceedWith('claude-sonnet-5');
      expect(AiAssist.resolveProviderModel(desc, undefined, 'base')).toSucceedWith('claude-sonnet-5');
    });

    test('advanced tier resolves to claude-opus-4-8', () => {
      expect(AiAssist.resolveProviderModel(desc, undefined, 'advanced')).toSucceedWith('claude-opus-4-8');
    });

    test('frontier cascades to the advanced id (no frontier key on the descriptor)', () => {
      // The Anthropic map deliberately omits a frontier key, so a frontier request must
      // cascade frontier → advanced → opus. This is the real registry descriptor (not a
      // synthetic one), so it is the live proof of the cascade against shipped defaults.
      expect(AiAssist.resolveProviderModel(desc, undefined, 'frontier')).toSucceedWith('claude-opus-4-8');
    });

    test('the non-tier @anthropic:haiku alias resolves via modelOverride only', () => {
      expect(AiAssist.resolveProviderModel(desc, '@anthropic:haiku', undefined)).toSucceedWith(
        'claude-haiku-4-5-20251001'
      );
    });

    test('the non-tier @anthropic:fable alias resolves via modelOverride only', () => {
      expect(AiAssist.resolveProviderModel(desc, '@anthropic:fable', undefined)).toSucceedWith(
        'claude-fable-5'
      );
    });

    test('a raw modelOverride passes through verbatim (no alias resolution)', () => {
      expect(AiAssist.resolveProviderModel(desc, 'claude-custom-tuned:v1', 'advanced')).toSucceedWith(
        'claude-custom-tuned:v1'
      );
    });
  });

  describe('google-gemini model tiers (B4)', () => {
    const desc = AiAssist.getProviderDescriptor('google-gemini').orThrow();

    test('base tier resolves to gemini-3.5-flash', () => {
      // undefined context falls to base; explicit 'base' resolves identically.
      expect(AiAssist.resolveProviderModel(desc, undefined, undefined)).toSucceedWith('gemini-3.5-flash');
      expect(AiAssist.resolveProviderModel(desc, undefined, 'base')).toSucceedWith('gemini-3.5-flash');
    });

    test('advanced tier resolves to gemini-3.1-pro-preview (reuses the @google-gemini:pro alias)', () => {
      expect(AiAssist.resolveModel(desc.defaultModel, 'advanced')).toBe('@google-gemini:pro');
      expect(AiAssist.resolveProviderModel(desc, undefined, 'advanced')).toSucceedWith(
        'gemini-3.1-pro-preview'
      );
    });

    test('frontier cascades to the advanced id (no frontier key on the descriptor)', () => {
      // The Gemini map deliberately omits a frontier key, so a frontier request must
      // cascade frontier → advanced → pro. This is the real registry descriptor, so it is
      // the live proof of the cascade against the shipped Gemini defaults.
      expect(AiAssist.resolveProviderModel(desc, undefined, 'frontier')).toSucceedWith(
        'gemini-3.1-pro-preview'
      );
    });

    test('image tier is unchanged by the advanced-key addition', () => {
      expect(AiAssist.resolveModel(desc.defaultModel, 'image')).toBe('@google-gemini:flash-image');
      expect(AiAssist.resolveProviderModel(desc, undefined, 'image')).toSucceedWith(
        'gemini-3.1-flash-image-preview'
      );
    });

    test('embedding tier is unchanged by the advanced-key addition', () => {
      expect(AiAssist.resolveModel(desc.defaultModel, 'embedding')).toBe('@google-gemini:embedding');
      expect(AiAssist.resolveProviderModel(desc, undefined, 'embedding')).toSucceedWith(
        'gemini-embedding-001'
      );
    });

    test('the non-tier @google-gemini:flash-lite alias resolves via modelOverride only', () => {
      expect(AiAssist.resolveProviderModel(desc, '@google-gemini:flash-lite', undefined)).toSucceedWith(
        'gemini-3.1-flash-lite'
      );
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
          base: 'grok-4.3',
          image: 'grok-imagine-image-quality'
        });
        expect(desc.supportedTools).toContain('web_search');
        expect(desc.imageGeneration).toHaveLength(2);
        expect(desc.imageGeneration?.[0]).toMatchObject({
          modelPrefix: 'grok-imagine-',
          format: 'xai-images-edits'
        });
        expect(desc.imageGeneration?.[1]).toMatchObject({ modelPrefix: '', format: 'xai-images' });
      });
    });

    test('returns descriptor with image generation support for openai', () => {
      expect(AiAssist.getProviderDescriptor('openai')).toSucceedAndSatisfy((desc) => {
        // The DALL·E entries were retired; only gpt-image- and the openai-images catch-all survive.
        expect(desc.imageGeneration).toHaveLength(2);
        expect(desc.imageGeneration?.[0]).toMatchObject({
          modelPrefix: 'gpt-image-',
          format: 'openai-images',
          acceptsImageReferenceInput: true,
          outputParamStyle: 'output-format'
        });
        expect(desc.imageGeneration?.[1]).toMatchObject({
          modelPrefix: '',
          format: 'openai-images',
          outputParamStyle: 'response-format'
        });
        // The default image model is now an alias that resolves to the surviving gpt-image id.
        expect(AiAssist.resolveModel(desc.defaultModel, 'image')).toBe('@openai:image');
        expect(AiAssist.resolveProviderModel(desc, undefined, 'image')).toSucceedWith('gpt-image-1.5');
      });
    });

    test('returns descriptor with image generation support for google-gemini', () => {
      expect(AiAssist.getProviderDescriptor('google-gemini')).toSucceedAndSatisfy((desc) => {
        // Only the gemini-image-out catch-all survives after the Imagen surface retirement.
        expect(desc.imageGeneration).toHaveLength(1);
        expect(desc.imageGeneration?.[0]).toMatchObject({
          modelPrefix: '',
          format: 'gemini-image-out',
          acceptsImageReferenceInput: true
        });
        // The default image model is now an alias that resolves to the surviving flash-image id.
        expect(AiAssist.resolveModel(desc.defaultModel, 'image')).toBe('@google-gemini:flash-image');
        expect(AiAssist.resolveProviderModel(desc, undefined, 'image')).toSucceedWith(
          'gemini-3.1-flash-image-preview'
        );
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
      // openai hosts multiple image surfaces under one descriptor; gpt-image-1 hits its
      // dedicated prefix rather than the catch-all.
      const descriptor = AiAssist.getProviderDescriptor('openai').orThrow();
      const capability = AiAssist.resolveImageCapability(descriptor, 'gpt-image-1');
      expect(capability).toMatchObject({ modelPrefix: 'gpt-image-', format: 'openai-images' });
    });

    test('falls back to the catch-all entry when no specific prefix matches', () => {
      const descriptor = AiAssist.getProviderDescriptor('google-gemini').orThrow();
      const capability = AiAssist.resolveImageCapability(descriptor, 'gemini-3.1-flash-image-preview');
      expect(capability).toMatchObject({
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
        thinkingMode: 'optional',
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
      // gpt-image-1 hits the specific prefix → refs supported, output-format style.
      expect(AiAssist.resolveImageCapability(descriptor, 'gpt-image-1')).toMatchObject({
        modelPrefix: 'gpt-image-',
        format: 'openai-images',
        acceptsImageReferenceInput: true,
        outputParamStyle: 'output-format'
      });
      // any other openai image id falls to the catch-all → response-format style.
      expect(AiAssist.resolveImageCapability(descriptor, 'some-legacy-image')).toMatchObject({
        modelPrefix: '',
        format: 'openai-images',
        outputParamStyle: 'response-format'
      });
    });

    test('returns undefined when the provider declares no image-generation capabilities', () => {
      const descriptor = AiAssist.getProviderDescriptor('anthropic').orThrow();
      expect(AiAssist.resolveImageCapability(descriptor, 'claude-3-opus')).toBeUndefined();
    });
  });

  describe('supportsEmbedding', () => {
    test('is true for providers that declare an embedding capability', () => {
      for (const id of ['openai', 'google-gemini', 'ollama', 'openai-compat', 'mistral'] as const) {
        expect(AiAssist.getProviderDescriptor(id)).toSucceedAndSatisfy((desc) => {
          expect(AiAssist.supportsEmbedding(desc)).toBe(true);
        });
      }
    });

    test('is false for providers without an embedding endpoint', () => {
      for (const id of ['xai-grok', 'anthropic', 'groq', 'copy-paste'] as const) {
        expect(AiAssist.getProviderDescriptor(id)).toSucceedAndSatisfy((desc) => {
          expect(desc.embedding).toBeUndefined();
          expect(AiAssist.supportsEmbedding(desc)).toBe(false);
        });
      }
    });
  });

  describe('embedding registry entries', () => {
    test('openai declares a text-embedding-3 default and a dimensions-capable prefix', () => {
      expect(AiAssist.getProviderDescriptor('openai')).toSucceedAndSatisfy((desc) => {
        expect(AiAssist.resolveModel(desc.defaultModel, 'embedding')).toBe('@openai:embedding');
        expect(AiAssist.resolveProviderModel(desc, undefined, 'embedding')).toSucceedWith(
          'text-embedding-3-small'
        );
        expect(AiAssist.resolveEmbeddingCapability(desc, 'text-embedding-3-small')).toMatchObject({
          modelPrefix: 'text-embedding-3',
          format: 'openai-embeddings',
          supportsDimensions: true,
          maxBatchSize: 2048
        });
      });
    });

    test('gemini declares a gemini-embedding-001 default with taskType + dimensions', () => {
      expect(AiAssist.getProviderDescriptor('google-gemini')).toSucceedAndSatisfy((desc) => {
        // The embedding default is an alias that resolves to the concrete embedding id.
        expect(AiAssist.resolveModel(desc.defaultModel, 'embedding')).toBe('@google-gemini:embedding');
        expect(AiAssist.resolveProviderModel(desc, undefined, 'embedding')).toSucceedWith(
          'gemini-embedding-001'
        );
        const cap = AiAssist.resolveEmbeddingCapability(desc, 'gemini-embedding-001');
        expect(cap).toMatchObject({
          format: 'gemini-embeddings',
          supportsTaskType: true,
          supportsDimensions: true
        });
      });
    });

    test('mistral declares a mistral-embed default via the openai-embeddings format', () => {
      expect(AiAssist.getProviderDescriptor('mistral')).toSucceedAndSatisfy((desc) => {
        expect(AiAssist.resolveModel(desc.defaultModel, 'embedding')).toBe('mistral-embed');
        expect(AiAssist.resolveEmbeddingCapability(desc, 'mistral-embed')).toMatchObject({
          format: 'openai-embeddings'
        });
      });
    });

    test('self-hosted providers declare a catch-all capability and no default embedding model', () => {
      for (const id of ['ollama', 'openai-compat'] as const) {
        expect(AiAssist.getProviderDescriptor(id)).toSucceedAndSatisfy((desc) => {
          expect(AiAssist.resolveModel(desc.defaultModel, 'embedding')).toBe('');
          expect(AiAssist.resolveEmbeddingCapability(desc, 'nomic-embed-text')).toMatchObject({
            modelPrefix: '',
            format: 'openai-embeddings'
          });
        });
      }
    });
  });

  describe('resolveEmbeddingCapability', () => {
    test('selects the most specific (longest) prefix even when listed after the catch-all', () => {
      const descriptor = AiAssist.getProviderDescriptor('openai').orThrow();
      // text-embedding-3-large hits the specific prefix (dimensions-capable, batched).
      expect(AiAssist.resolveEmbeddingCapability(descriptor, 'text-embedding-3-large')).toMatchObject({
        modelPrefix: 'text-embedding-3',
        format: 'openai-embeddings',
        supportsDimensions: true,
        maxBatchSize: 2048
      });
      // text-embedding-ada-002 falls back to the catch-all (no dimensions support).
      expect(AiAssist.resolveEmbeddingCapability(descriptor, 'text-embedding-ada-002')).toMatchObject({
        modelPrefix: '',
        format: 'openai-embeddings'
      });
      expect(
        AiAssist.resolveEmbeddingCapability(descriptor, 'text-embedding-ada-002')?.supportsDimensions
      ).toBeUndefined();
      // Catch-all carries no batch-size guard (matches design §5.1).
      expect(
        AiAssist.resolveEmbeddingCapability(descriptor, 'text-embedding-ada-002')?.maxBatchSize
      ).toBeUndefined();
    });

    test('returns undefined when the provider declares no embedding capabilities', () => {
      const descriptor = AiAssist.getProviderDescriptor('anthropic').orThrow();
      expect(AiAssist.resolveEmbeddingCapability(descriptor, 'claude-3-opus')).toBeUndefined();
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

describe('DEFAULT_MODEL_CAPABILITY_CONFIG', () => {
  const config = AiAssist.DEFAULT_MODEL_CAPABILITY_CONFIG;

  test('ollama catch-all assigns chat to any model id', () => {
    const rules = config.perProvider?.ollama ?? [];
    const caps = new Set<string>();
    for (const rule of rules) {
      if (rule.idPattern.test('llama3.2')) {
        rule.capabilities.forEach((c) => caps.add(c));
      }
    }
    expect(caps.has('chat')).toBe(true);
  });

  test('openai-compat catch-all assigns chat to any model id', () => {
    const rules = config.perProvider?.['openai-compat'] ?? [];
    const caps = new Set<string>();
    for (const rule of rules) {
      if (rule.idPattern.test('some-local-model')) {
        rule.capabilities.forEach((c) => caps.add(c));
      }
    }
    expect(caps.has('chat')).toBe(true);
  });

  test.each([
    ['openai', 'text-embedding-3-large'],
    ['google-gemini', 'gemini-embedding-001'],
    ['mistral', 'mistral-embed']
  ] as const)('%s tags %s with the embedding capability', (provider, modelId) => {
    const rules = config.perProvider?.[provider] ?? [];
    const caps = new Set<string>();
    for (const rule of rules) {
      if (rule.idPattern.test(modelId)) {
        rule.capabilities.forEach((c) => caps.add(c));
      }
    }
    expect(caps.has('embedding')).toBe(true);
  });
});
