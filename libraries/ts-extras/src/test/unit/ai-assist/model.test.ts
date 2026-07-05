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

describe('AiPrompt', () => {
  test('stores system and user fields', () => {
    const prompt = new AiAssist.AiPrompt('user text', 'system text');
    expect(prompt.system).toBe('system text');
    expect(prompt.user).toBe('user text');
  });

  test('combined returns user then system joined by blank line', () => {
    const prompt = new AiAssist.AiPrompt('user text', 'system text');
    expect(prompt.combined).toBe('user text\n\nsystem text');
  });

  test('defaults attachments to an empty array', () => {
    const prompt = new AiAssist.AiPrompt('u', 's');
    expect(prompt.attachments).toEqual([]);
  });

  test('stores attachments when supplied', () => {
    const att: AiAssist.IAiImageAttachment = { mimeType: 'image/png', base64: 'AAAA' };
    const prompt = new AiAssist.AiPrompt('u', 's', [att]);
    expect(prompt.attachments).toEqual([att]);
  });

  test('combined includes a sentinel when attachments are present', () => {
    const att: AiAssist.IAiImageAttachment = { mimeType: 'image/png', base64: 'AAAA' };
    const prompt = new AiAssist.AiPrompt('describe this', 'be terse', [att]);
    expect(prompt.combined).toMatch(/\[1 image attachment\(s\) — not included in copied text\]/);
    expect(prompt.combined).toContain('describe this');
    expect(prompt.combined).toContain('be terse');
  });

  test('combined sentinel reflects attachment count', () => {
    const a: AiAssist.IAiImageAttachment = { mimeType: 'image/png', base64: 'A' };
    const b: AiAssist.IAiImageAttachment = { mimeType: 'image/jpeg', base64: 'B' };
    const prompt = new AiAssist.AiPrompt('u', 's', [a, b]);
    expect(prompt.combined).toMatch(/\[2 image attachment\(s\)/);
  });
});

describe('toDataUrl', () => {
  test('formats image data as a data URL', () => {
    const image: AiAssist.IAiImageData = { mimeType: 'image/png', base64: 'AAAA' };
    expect(AiAssist.toDataUrl(image)).toBe('data:image/png;base64,AAAA');
  });

  test('preserves the supplied MIME type', () => {
    const image: AiAssist.IAiImageData = { mimeType: 'image/jpeg', base64: '/9j/4AAQ' };
    expect(AiAssist.toDataUrl(image)).toBe('data:image/jpeg;base64,/9j/4AAQ');
  });
});

describe('resolveModel', () => {
  test('returns a string spec directly regardless of context', () => {
    expect(AiAssist.resolveModel('grok-4-1-fast')).toBe('grok-4-1-fast');
    expect(AiAssist.resolveModel('grok-4-1-fast', 'advanced')).toBe('grok-4-1-fast');
  });

  test('resolves context key from an object spec', () => {
    const spec: AiAssist.ModelSpec = { base: 'grok-fast', advanced: 'grok-reasoning' };
    expect(AiAssist.resolveModel(spec, 'advanced')).toBe('grok-reasoning');
  });

  test('falls back to base when context key is missing', () => {
    const spec: AiAssist.ModelSpec = { base: 'grok-fast', advanced: 'grok-reasoning' };
    expect(AiAssist.resolveModel(spec, 'image')).toBe('grok-fast');
  });

  test('falls back to base when no context provided', () => {
    const spec: AiAssist.ModelSpec = { base: 'grok-fast', advanced: 'grok-reasoning' };
    expect(AiAssist.resolveModel(spec)).toBe('grok-fast');
  });

  test('resolves nested spec — context key leads to another object', () => {
    const spec: AiAssist.ModelSpec = {
      base: 'grok-fast',
      advanced: { base: 'grok-reasoning', image: 'grok-vision' }
    };
    // 'advanced' resolves to nested object, which then falls back to 'base'
    expect(AiAssist.resolveModel(spec, 'advanced')).toBe('grok-reasoning');
  });

  test('falls back to first value when no base key exists', () => {
    const spec: AiAssist.ModelSpec = { advanced: 'grok-reasoning', image: 'grok-vision' };
    expect(AiAssist.resolveModel(spec)).toBe('grok-reasoning');
  });

  test('resolves the embedding context key from an object spec', () => {
    const spec: AiAssist.ModelSpec = { base: 'gpt-4o', embedding: 'text-embedding-3-small' };
    expect(AiAssist.resolveModel(spec, 'embedding')).toBe('text-embedding-3-small');
  });

  describe('tier cascade (Q2)', () => {
    test('base-only map: a frontier request cascades to base (back-compat floor)', () => {
      const spec: AiAssist.ModelSpec = { base: 'X' };
      expect(AiAssist.resolveModel(spec, 'frontier')).toBe('X');
    });

    test('base-only map: an advanced request cascades to base', () => {
      const spec: AiAssist.ModelSpec = { base: 'X' };
      expect(AiAssist.resolveModel(spec, 'advanced')).toBe('X');
    });

    test('advanced set, frontier requested: cascade stops at advanced', () => {
      const spec: AiAssist.ModelSpec = { base: 'B', advanced: 'A' };
      expect(AiAssist.resolveModel(spec, 'frontier')).toBe('A');
    });

    test('frontier set: a frontier request hits frontier directly', () => {
      const spec: AiAssist.ModelSpec = { base: 'B', advanced: 'A', frontier: 'F' };
      expect(AiAssist.resolveModel(spec, 'frontier')).toBe('F');
    });

    test('advanced request with advanced+base present hits advanced directly', () => {
      const spec: AiAssist.ModelSpec = { base: 'B', advanced: 'A' };
      expect(AiAssist.resolveModel(spec, 'advanced')).toBe('A');
    });

    test('tier value is a nested spec — recurses into its base branch', () => {
      const spec: AiAssist.ModelSpec = { base: 'B', frontier: { base: 'F' } };
      expect(AiAssist.resolveModel(spec, 'frontier')).toBe('F');
    });

    test('tier value is an alias — returned verbatim (resolved downstream)', () => {
      const spec: AiAssist.ModelSpec = { base: 'B', frontier: '@openai:pro' };
      expect(AiAssist.resolveModel(spec, 'frontier')).toBe('@openai:pro');
    });

    test('a base request never over-reaches into a tier branch', () => {
      const spec: AiAssist.ModelSpec = { base: 'B', advanced: 'A', frontier: 'F' };
      expect(AiAssist.resolveModel(spec, 'base')).toBe('B');
    });

    test('modality key (image) is unchanged — flat resolution, no cascade', () => {
      const spec: AiAssist.ModelSpec = { base: 'B', image: 'I' };
      expect(AiAssist.resolveModel(spec, 'image')).toBe('I');
    });

    test('modality key (embedding) is unchanged — flat resolution, no cascade', () => {
      const spec: AiAssist.ModelSpec = { base: 'B', embedding: 'E' };
      expect(AiAssist.resolveModel(spec, 'embedding')).toBe('E');
    });

    test('an arbitrary (non-tier) string context resolves flat, then falls to base', () => {
      const spec: AiAssist.ModelSpec = { base: 'B', custom: 'C' };
      expect(AiAssist.resolveModel(spec, 'custom')).toBe('C');
      expect(AiAssist.resolveModel(spec, 'other')).toBe('B');
    });

    test('undefined context resolves to base — unchanged', () => {
      const spec: AiAssist.ModelSpec = { base: 'B', advanced: 'A', frontier: 'F' };
      expect(AiAssist.resolveModel(spec)).toBe('B');
    });
  });
});

describe('capability + spec-key vocabularies', () => {
  test('allModelSpecKeys includes the embedding key', () => {
    expect(AiAssist.allModelSpecKeys).toContain('embedding');
  });

  test('allModelSpecKeys carries the tier keys and not the removed thinking/tools keys', () => {
    expect(AiAssist.allModelSpecKeys).toEqual(['base', 'advanced', 'frontier', 'image', 'embedding']);
    expect(AiAssist.allModelSpecKeys).not.toContain('thinking');
    expect(AiAssist.allModelSpecKeys).not.toContain('tools');
  });

  test('allModelCapabilities includes the embedding capability', () => {
    expect(AiAssist.allModelCapabilities).toContain('embedding');
  });
});

describe('modelSpec converter', () => {
  test('converts a simple string', () => {
    expect(AiAssist.modelSpec.convert('grok-4-1-fast')).toSucceedWith('grok-4-1-fast');
  });

  test('converts an object with string values', () => {
    expect(AiAssist.modelSpec.convert({ base: 'grok-fast', advanced: 'grok-reasoning' })).toSucceedWith({
      base: 'grok-fast',
      advanced: 'grok-reasoning'
    });
  });

  test('accepts all tier + modality keys', () => {
    const input = {
      base: 'b',
      advanced: 'a',
      frontier: 'f',
      image: 'i',
      embedding: 'e'
    };
    expect(AiAssist.modelSpec.convert(input)).toSucceedWith(input);
  });

  test('converts a deeply nested object', () => {
    const input = {
      base: 'grok-fast',
      advanced: { base: 'grok-reasoning', image: 'grok-vision' }
    };
    expect(AiAssist.modelSpec.convert(input)).toSucceedWith(input);
  });

  test('fails for a number', () => {
    expect(AiAssist.modelSpec.convert(42)).toFailWith(/expected model spec/i);
  });

  test('fails for null', () => {
    expect(AiAssist.modelSpec.convert(null)).toFailWith(/expected model spec/i);
  });

  test('fails for an array', () => {
    expect(AiAssist.modelSpec.convert(['a', 'b'])).toFailWith(/expected model spec/i);
  });

  test('converts an empty object', () => {
    expect(AiAssist.modelSpec.convert({})).toSucceedWith({});
  });

  test('fails for invalid key', () => {
    expect(AiAssist.modelSpec.convert({ base: 'ok', bogus: 'bad' })).toFailWith(/expected model spec/i);
  });

  test('rejects the removed thinking/tools keys', () => {
    expect(AiAssist.modelSpec.convert({ base: 'ok', thinking: 'x' })).toFailWith(/expected model spec/i);
    expect(AiAssist.modelSpec.convert({ base: 'ok', tools: 'x' })).toFailWith(/expected model spec/i);
  });

  test('fails for nested invalid value', () => {
    expect(AiAssist.modelSpec.convert({ base: 'ok', advanced: 123 })).toFailWith(/expected model spec/i);
  });
});
