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

// eslint-disable-next-line @rushstack/packlets/mechanics
import {
  resolveImageOptions,
  validateResolvedOptions
} from '../../../packlets/ai-assist/imageOptionsResolver';
// eslint-disable-next-line @rushstack/packlets/mechanics
import type { IAiImageModelCapability } from '../../../packlets/ai-assist/model';

// ============================================================================
// Test helpers
// ============================================================================

function makeCap(overrides: Partial<IAiImageModelCapability> = {}): IAiImageModelCapability {
  return {
    modelPrefix: '',
    format: 'openai-images',
    ...overrides
  };
}

// ============================================================================
// resolveImageOptions — basic generic tier
// ============================================================================

describe('resolveImageOptions', () => {
  describe('generic top-level options (tier 1)', () => {
    test('defaults n to 1 when count is not provided', () => {
      const cap = makeCap();
      const result = resolveImageOptions('dall-e-3', cap, undefined);
      expect(result.n).toBe(1);
    });

    test('uses count from options', () => {
      const cap = makeCap();
      const result = resolveImageOptions('dall-e-3', cap, { count: 3 });
      expect(result.n).toBe(3);
    });

    test('propagates size from generic options', () => {
      const cap = makeCap();
      const result = resolveImageOptions('dall-e-3', cap, { size: '1024x1024' });
      expect(result.size).toBe('1024x1024');
    });

    test('propagates quality from generic options', () => {
      const cap = makeCap();
      const result = resolveImageOptions('dall-e-3', cap, { quality: 'hd' });
      expect(result.quality).toBe('hd');
    });

    test('propagates seed from generic options', () => {
      const cap = makeCap();
      const result = resolveImageOptions('dall-e-3', cap, { seed: 42 });
      expect(result.seed).toBe(42);
    });

    test('leaves optional fields undefined when not provided', () => {
      const cap = makeCap();
      const result = resolveImageOptions('dall-e-3', cap, {});
      expect(result.size).toBeUndefined();
      expect(result.quality).toBeUndefined();
      expect(result.seed).toBeUndefined();
    });

    test('returns n=1 with no options at all', () => {
      const cap = makeCap({ format: 'gemini-imagen' });
      const result = resolveImageOptions('imagen-4.0-generate-001', cap, undefined);
      expect(result.n).toBe(1);
      expect(result.size).toBeUndefined();
    });
  });

  // ============================================================================
  // DallE family blocks
  // ============================================================================

  describe('dall-e family blocks (provider: openai, family: dall-e)', () => {
    const cap = makeCap({ format: 'openai-images' });

    test('applies family-generic dall-e block to openai model', () => {
      const result = resolveImageOptions('dall-e-3', cap, {
        models: [
          {
            provider: 'openai',
            family: 'dall-e',
            config: { size: '1024x1024', quality: 'hd', style: 'vivid' }
          }
        ]
      });
      expect(result.size).toBe('1024x1024');
      expect(result.quality).toBe('hd');
      expect(result.style).toBe('vivid');
    });

    test('applies model-specific dall-e block when models array matches', () => {
      const result = resolveImageOptions('dall-e-3', cap, {
        models: [
          {
            provider: 'openai',
            family: 'dall-e',
            models: ['dall-e-3'],
            config: { size: '1792x1024' }
          }
        ]
      });
      expect(result.size).toBe('1792x1024');
    });

    test('skips model-specific dall-e block when models array does not match', () => {
      const result = resolveImageOptions('dall-e-3', cap, {
        size: '512x512',
        models: [
          {
            provider: 'openai',
            family: 'dall-e',
            models: ['dall-e-2'],
            config: { size: '256x256' }
          }
        ]
      });
      expect(result.size).toBe('512x512');
    });

    test('model-specific block overrides family-generic block', () => {
      const result = resolveImageOptions('dall-e-3', cap, {
        models: [
          { provider: 'openai', family: 'dall-e', config: { size: '1024x1024', style: 'natural' } },
          { provider: 'openai', family: 'dall-e', models: ['dall-e-3'], config: { size: '1792x1024' } }
        ]
      });
      expect(result.size).toBe('1792x1024');
      expect(result.style).toBe('natural'); // from family-generic, not overridden by model-specific
    });

    test('config fields omitted when not set in block', () => {
      const result = resolveImageOptions('dall-e-3', cap, {
        models: [{ provider: 'openai', family: 'dall-e', config: {} }]
      });
      expect(result.size).toBeUndefined();
      expect(result.quality).toBeUndefined();
      expect(result.style).toBeUndefined();
    });

    test('skips dall-e block for xai-format capability', () => {
      const xaiCap = makeCap({ format: 'xai-images' });
      const result = resolveImageOptions('grok-imagine-image-quality', xaiCap, {
        size: '1024x1024',
        models: [{ provider: 'openai', family: 'dall-e', config: { size: '256x256' } }]
      });
      // openai block skipped for xai lineage
      expect(result.size).toBe('1024x1024');
    });
  });

  // ============================================================================
  // GptImage family blocks
  // ============================================================================

  describe('gpt-image family blocks (provider: openai, family: gpt-image)', () => {
    const cap = makeCap({ format: 'openai-images' });

    test('applies all gpt-image config fields', () => {
      const result = resolveImageOptions('gpt-image-1', cap, {
        models: [
          {
            provider: 'openai',
            family: 'gpt-image',
            config: {
              size: '1024x1024',
              quality: 'high',
              outputFormat: 'webp',
              outputCompression: 80,
              background: 'transparent',
              moderation: 'low'
            }
          }
        ]
      });
      expect(result.size).toBe('1024x1024');
      expect(result.quality).toBe('high');
      expect(result.outputFormat).toBe('webp');
      expect(result.outputCompression).toBe(80);
      expect(result.background).toBe('transparent');
      expect(result.moderation).toBe('low');
    });

    test('skips gpt-image block when models array does not include model', () => {
      // Resolve dall-e-3 against a gpt-image block targeted at gpt-image-1 only
      const result = resolveImageOptions('dall-e-3', cap, {
        size: 'auto',
        models: [
          { provider: 'openai', family: 'gpt-image', models: ['gpt-image-1'], config: { size: '1024x1024' } }
        ]
      });
      // dall-e-3 is not in ['gpt-image-1'], so the block is skipped
      expect(result.size).toBe('auto');
    });

    test('config fields omitted when not set in gpt-image block', () => {
      const result = resolveImageOptions('gpt-image-1', cap, {
        models: [{ provider: 'openai', family: 'gpt-image', config: {} }]
      });
      expect(result.outputFormat).toBeUndefined();
      expect(result.outputCompression).toBeUndefined();
      expect(result.background).toBeUndefined();
      expect(result.moderation).toBeUndefined();
    });
  });

  // ============================================================================
  // GrokImagine family blocks
  // ============================================================================

  describe('grok-imagine family blocks (provider: xai, family: grok-imagine)', () => {
    const cap = makeCap({ format: 'xai-images-edits' });

    test('applies aspectRatio and resolution from grok-imagine block', () => {
      const result = resolveImageOptions('grok-imagine-image-quality', cap, {
        models: [
          {
            provider: 'xai',
            family: 'grok-imagine',
            config: { aspectRatio: '16:9', resolution: '1280x720' }
          }
        ]
      });
      expect(result.aspectRatio).toBe('16:9');
      expect(result.resolution).toBe('1280x720');
    });

    test('applies model-specific grok-imagine block', () => {
      const result = resolveImageOptions('grok-imagine-image', cap, {
        models: [
          {
            provider: 'xai',
            family: 'grok-imagine',
            models: ['grok-imagine-image'],
            config: { aspectRatio: '1:1' }
          }
        ]
      });
      expect(result.aspectRatio).toBe('1:1');
    });

    test('skips grok-imagine block for openai lineage', () => {
      const openaiCap = makeCap({ format: 'openai-images' });
      const result = resolveImageOptions('dall-e-3', openaiCap, {
        models: [{ provider: 'xai', family: 'grok-imagine', config: { aspectRatio: '16:9' } }]
      });
      expect(result.aspectRatio).toBeUndefined();
    });

    test('config fields omitted when not set in grok-imagine block', () => {
      const result = resolveImageOptions('grok-imagine-image-quality', cap, {
        models: [{ provider: 'xai', family: 'grok-imagine', config: {} }]
      });
      expect(result.aspectRatio).toBeUndefined();
      expect(result.resolution).toBeUndefined();
    });
  });

  // ============================================================================
  // Imagen4 family blocks
  // ============================================================================

  describe('imagen-4 family blocks (provider: google, family: imagen-4)', () => {
    const cap = makeCap({ format: 'gemini-imagen' });

    test('applies all imagen-4 config fields', () => {
      const result = resolveImageOptions('imagen-4.0-generate-001', cap, {
        models: [
          {
            provider: 'google',
            family: 'imagen-4',
            config: {
              aspectRatio: '16:9',
              imageSize: '2K',
              addWatermark: false,
              enhancePrompt: true,
              outputMimeType: 'image/jpeg',
              outputCompressionQuality: 85,
              personGeneration: 'allow_all'
            }
          }
        ]
      });
      expect(result.imagenAspectRatio).toBe('16:9');
      expect(result.imageSize).toBe('2K');
      expect(result.addWatermark).toBe(false);
      expect(result.enhancePrompt).toBe(true);
      expect(result.imagenOutputMimeType).toBe('image/jpeg');
      expect(result.imagenOutputCompressionQuality).toBe(85);
      expect(result.personGeneration).toBe('allow_all');
    });

    test('applies model-specific imagen-4 block', () => {
      const result = resolveImageOptions('imagen-4.0-ultra-generate-001', cap, {
        models: [
          {
            provider: 'google',
            family: 'imagen-4',
            models: ['imagen-4.0-ultra-generate-001'],
            config: { aspectRatio: '1:1' }
          }
        ]
      });
      expect(result.imagenAspectRatio).toBe('1:1');
    });

    test('skips imagen-4 block when models array does not match', () => {
      const result = resolveImageOptions('imagen-4.0-generate-001', cap, {
        models: [
          {
            provider: 'google',
            family: 'imagen-4',
            models: ['imagen-4.0-ultra-generate-001'],
            config: { aspectRatio: '16:9' }
          }
        ]
      });
      expect(result.imagenAspectRatio).toBeUndefined();
    });

    test('config fields omitted when not set in imagen-4 block', () => {
      const result = resolveImageOptions('imagen-4.0-generate-001', cap, {
        models: [{ provider: 'google', family: 'imagen-4', config: {} }]
      });
      expect(result.imagenAspectRatio).toBeUndefined();
      expect(result.imageSize).toBeUndefined();
      expect(result.addWatermark).toBeUndefined();
      expect(result.enhancePrompt).toBeUndefined();
      expect(result.imagenOutputMimeType).toBeUndefined();
      expect(result.imagenOutputCompressionQuality).toBeUndefined();
      expect(result.personGeneration).toBeUndefined();
    });

    test('skips imagen-4 block for openai lineage', () => {
      const openaiCap = makeCap({ format: 'openai-images' });
      const result = resolveImageOptions('dall-e-3', openaiCap, {
        models: [{ provider: 'google', family: 'imagen-4', config: { aspectRatio: '16:9' } }]
      });
      expect(result.imagenAspectRatio).toBeUndefined();
    });
  });

  // ============================================================================
  // GeminiFlashImage family blocks
  // ============================================================================

  describe('gemini-flash-image family blocks (provider: google, family: gemini-flash-image)', () => {
    const cap = makeCap({ format: 'gemini-image-out' });

    test('applies aspectRatio from gemini-flash-image block', () => {
      const result = resolveImageOptions('gemini-2.5-flash-image', cap, {
        models: [
          {
            provider: 'google',
            family: 'gemini-flash-image',
            config: { aspectRatio: '16:9' }
          }
        ]
      });
      expect(result.geminiAspectRatio).toBe('16:9');
    });

    test('applies model-specific gemini-flash-image block', () => {
      const result = resolveImageOptions('gemini-2.5-flash-image', cap, {
        models: [
          {
            provider: 'google',
            family: 'gemini-flash-image',
            models: ['gemini-2.5-flash-image'],
            config: { aspectRatio: '4:3' }
          }
        ]
      });
      expect(result.geminiAspectRatio).toBe('4:3');
    });

    test('skips gemini-flash-image block when models array does not match current model', () => {
      // Resolve a different model ID; the block targets gemini-2.5-flash-image specifically
      const result = resolveImageOptions('gemini-pro-image', cap, {
        models: [
          {
            provider: 'google',
            family: 'gemini-flash-image',
            models: ['gemini-2.5-flash-image'],
            config: { aspectRatio: '16:9' }
          }
        ]
      });
      // gemini-pro-image is not in ['gemini-2.5-flash-image'], so block is skipped
      expect(result.geminiAspectRatio).toBeUndefined();
    });

    test('config fields omitted when not set in gemini-flash-image block', () => {
      const result = resolveImageOptions('gemini-2.5-flash-image', cap, {
        models: [{ provider: 'google', family: 'gemini-flash-image', config: {} }]
      });
      expect(result.geminiAspectRatio).toBeUndefined();
    });

    test('skips gemini-flash-image block for xai lineage', () => {
      const xaiCap = makeCap({ format: 'xai-images' });
      const result = resolveImageOptions('grok-imagine-image-quality', xaiCap, {
        models: [{ provider: 'google', family: 'gemini-flash-image', config: { aspectRatio: '16:9' } }]
      });
      expect(result.geminiAspectRatio).toBeUndefined();
    });
  });

  // ============================================================================
  // Other provider blocks
  // ============================================================================

  describe('other provider blocks (provider: other)', () => {
    const cap = makeCap({ format: 'openai-images' });

    test('applies other block when model is listed', () => {
      const result = resolveImageOptions('dall-e-3', cap, {
        models: [{ provider: 'other', models: ['dall-e-3'], config: { custom_param: 'value' } }]
      });
      expect(result.otherParams).toEqual({ custom_param: 'value' });
    });

    test('skips other block when model is not listed', () => {
      const result = resolveImageOptions('dall-e-3', cap, {
        models: [{ provider: 'other', models: ['dall-e-2'], config: { custom_param: 'value' } }]
      });
      expect(result.otherParams).toBeUndefined();
    });

    test('merges multiple other blocks when all models match', () => {
      const result = resolveImageOptions('dall-e-3', cap, {
        models: [
          { provider: 'other', models: ['dall-e-3'], config: { param_a: 'a' } },
          { provider: 'other', models: ['dall-e-3'], config: { param_b: 'b' } }
        ]
      });
      expect(result.otherParams).toEqual({ param_a: 'a', param_b: 'b' });
    });

    test('later other block wins for same key', () => {
      const result = resolveImageOptions('dall-e-3', cap, {
        models: [
          { provider: 'other', models: ['dall-e-3'], config: { param: 'first' } },
          { provider: 'other', models: ['dall-e-3'], config: { param: 'second' } }
        ]
      });
      expect(result.otherParams).toEqual({ param: 'second' });
    });
  });

  // ============================================================================
  // providerLineageForFormat — unknown format returns undefined lineage
  // ============================================================================

  describe('unknown format — no lineage', () => {
    test('unknown format produces no lineage, all typed blocks skipped', () => {
      // Force an unknown format to exercise the default branch in providerLineageForFormat
      const cap = makeCap({ format: 'unknown-format' as never });
      const result = resolveImageOptions('some-model', cap, {
        size: '1024x1024',
        models: [
          { provider: 'openai', family: 'dall-e', config: { size: '256x256' } },
          { provider: 'other', models: ['some-model'], config: { x: 1 } }
        ]
      });
      // openai block skipped (no lineage match), other block applied
      expect(result.size).toBe('1024x1024');
      expect(result.otherParams).toEqual({ x: 1 });
    });
  });

  // ============================================================================
  // Tier precedence
  // ============================================================================

  describe('tier precedence', () => {
    test('model-specific block overrides generic size', () => {
      const cap = makeCap({ format: 'openai-images' });
      const result = resolveImageOptions('dall-e-3', cap, {
        size: '512x512',
        models: [
          { provider: 'openai', family: 'dall-e', models: ['dall-e-3'], config: { size: '1792x1024' } }
        ]
      });
      expect(result.size).toBe('1792x1024');
    });

    test('family-generic block overrides generic size', () => {
      const cap = makeCap({ format: 'openai-images' });
      const result = resolveImageOptions('dall-e-3', cap, {
        size: '512x512',
        models: [{ provider: 'openai', family: 'dall-e', config: { size: '1024x1024' } }]
      });
      expect(result.size).toBe('1024x1024');
    });

    test('generic quality and model-specific size can coexist', () => {
      const cap = makeCap({ format: 'openai-images' });
      const result = resolveImageOptions('dall-e-3', cap, {
        quality: 'hd',
        models: [
          { provider: 'openai', family: 'dall-e', models: ['dall-e-3'], config: { size: '1024x1024' } }
        ]
      });
      expect(result.quality).toBe('hd');
      expect(result.size).toBe('1024x1024');
    });

    test('other block is tier 4, overrides same fields as model-specific', () => {
      const cap = makeCap({ format: 'openai-images' });
      const result = resolveImageOptions('dall-e-3', cap, {
        models: [
          { provider: 'openai', family: 'dall-e', models: ['dall-e-3'], config: {} },
          { provider: 'other', models: ['dall-e-3'], config: { extra: 'value' } }
        ]
      });
      expect(result.otherParams).toEqual({ extra: 'value' });
    });
  });

  // ============================================================================
  // xai-images lineage
  // ============================================================================

  describe('xai-images lineage', () => {
    const xaiCap = makeCap({ format: 'xai-images' });

    test('applies xai grok-imagine block for xai-images format', () => {
      const result = resolveImageOptions('grok-imagine-image', xaiCap, {
        models: [{ provider: 'xai', family: 'grok-imagine', config: { aspectRatio: '9:16' } }]
      });
      expect(result.aspectRatio).toBe('9:16');
    });
  });

  describe('xai-images-edits lineage', () => {
    const xaiEditsCap = makeCap({ format: 'xai-images-edits' });

    test('applies xai grok-imagine block for xai-images-edits format', () => {
      const result = resolveImageOptions('grok-imagine-image-quality', xaiEditsCap, {
        models: [{ provider: 'xai', family: 'grok-imagine', config: { resolution: '1920x1080' } }]
      });
      expect(result.resolution).toBe('1920x1080');
    });
  });
});

// ============================================================================
// validateResolvedOptions
// ============================================================================

describe('validateResolvedOptions', () => {
  describe('count validation', () => {
    test('succeeds when count is within maxCount', () => {
      const cap = makeCap({ maxCount: 4 });
      const resolved = { n: 4 };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toSucceed();
    });

    test('fails when count exceeds maxCount', () => {
      const cap = makeCap({ maxCount: 1 });
      const resolved = { n: 2 };
      expect(validateResolvedOptions('imagen-4.0-ultra-generate-001', cap, resolved)).toFailWith(
        /count 2 exceeds maximum of 1/i
      );
    });

    test('succeeds when maxCount is undefined (no limit)', () => {
      const cap = makeCap();
      const resolved = { n: 100 };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toSucceed();
    });
  });

  describe('size validation', () => {
    test('succeeds when size is in acceptedSizes', () => {
      const cap = makeCap({ acceptedSizes: ['1024x1024', '1792x1024', '1024x1792'] });
      const resolved = { n: 1, size: '1024x1024' };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toSucceed();
    });

    test('fails when size is not in acceptedSizes', () => {
      const cap = makeCap({ acceptedSizes: ['1024x1024', '1792x1024', '1024x1792'] });
      const resolved = { n: 1, size: '256x256' };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toFailWith(
        /size "256x256" is not accepted/i
      );
    });

    test('succeeds when size is undefined (no size constraint enforced)', () => {
      const cap = makeCap({ acceptedSizes: ['1024x1024'] });
      const resolved = { n: 1 };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toSucceed();
    });

    test('succeeds when acceptedSizes is undefined (no size constraint)', () => {
      const cap = makeCap();
      const resolved = { n: 1, size: '256x256' };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toSucceed();
    });
  });

  describe('quality validation', () => {
    test('succeeds when quality is in acceptedQualities', () => {
      const cap = makeCap({ supportsQualityParam: true, acceptedQualities: ['standard', 'hd'] });
      const resolved = { n: 1, quality: 'hd' };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toSucceed();
    });

    test('fails when quality is not in acceptedQualities', () => {
      const cap = makeCap({ supportsQualityParam: true, acceptedQualities: ['standard', 'hd'] });
      const resolved = { n: 1, quality: 'high' };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toFailWith(
        /quality "high" is not accepted/i
      );
    });

    test('succeeds when quality is undefined even if supportsQualityParam is true', () => {
      const cap = makeCap({ supportsQualityParam: true, acceptedQualities: ['standard', 'hd'] });
      const resolved = { n: 1 };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toSucceed();
    });

    test('succeeds when supportsQualityParam is false even if quality is provided', () => {
      const cap = makeCap({ supportsQualityParam: false, acceptedQualities: ['standard', 'hd'] });
      const resolved = { n: 1, quality: 'bad-quality' };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toSucceed();
    });

    test('succeeds when acceptedQualities is undefined (no quality constraint)', () => {
      const cap = makeCap({ supportsQualityParam: true });
      const resolved = { n: 1, quality: 'any-quality' };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toSucceed();
    });

    test('returns the resolved options on success', () => {
      const cap = makeCap({ supportsQualityParam: true, acceptedQualities: ['hd'] });
      const resolved = { n: 1, size: '1024x1024', quality: 'hd' };
      expect(validateResolvedOptions('dall-e-3', cap, resolved)).toSucceedWith(resolved);
    });
  });

  describe('error messages include model id', () => {
    test('count error includes model id', () => {
      const cap = makeCap({ maxCount: 1 });
      const resolved = { n: 5 };
      expect(validateResolvedOptions('my-model', cap, resolved)).toFailWith(/model "my-model"/i);
    });

    test('size error includes model id and accepted values', () => {
      const cap = makeCap({ acceptedSizes: ['1024x1024'] });
      const resolved = { n: 1, size: '512x512' };
      expect(validateResolvedOptions('my-model', cap, resolved)).toFailWith(/model "my-model"/i);
      expect(validateResolvedOptions('my-model', cap, resolved)).toFailWith(/accepted values/i);
    });

    test('quality error includes model id and accepted values', () => {
      const cap = makeCap({ supportsQualityParam: true, acceptedQualities: ['standard'] });
      const resolved = { n: 1, quality: 'ultra' };
      expect(validateResolvedOptions('my-model', cap, resolved)).toFailWith(/model "my-model"/i);
      expect(validateResolvedOptions('my-model', cap, resolved)).toFailWith(/accepted values/i);
    });
  });
});
