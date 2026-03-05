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
});

describe('resolveModel', () => {
  test('returns a string spec directly regardless of context', () => {
    expect(AiAssist.resolveModel('grok-4-1-fast')).toBe('grok-4-1-fast');
    expect(AiAssist.resolveModel('grok-4-1-fast', 'tools')).toBe('grok-4-1-fast');
  });

  test('resolves context key from an object spec', () => {
    const spec: AiAssist.ModelSpec = { base: 'grok-fast', tools: 'grok-reasoning' };
    expect(AiAssist.resolveModel(spec, 'tools')).toBe('grok-reasoning');
  });

  test('falls back to base when context key is missing', () => {
    const spec: AiAssist.ModelSpec = { base: 'grok-fast', tools: 'grok-reasoning' };
    expect(AiAssist.resolveModel(spec, 'image')).toBe('grok-fast');
  });

  test('falls back to base when no context provided', () => {
    const spec: AiAssist.ModelSpec = { base: 'grok-fast', tools: 'grok-reasoning' };
    expect(AiAssist.resolveModel(spec)).toBe('grok-fast');
  });

  test('resolves nested spec — context key leads to another object', () => {
    const spec: AiAssist.ModelSpec = {
      base: 'grok-fast',
      tools: { base: 'grok-reasoning', image: 'grok-vision' }
    };
    // 'tools' resolves to nested object, which then falls back to 'base'
    expect(AiAssist.resolveModel(spec, 'tools')).toBe('grok-reasoning');
  });

  test('falls back to first value when no base key exists', () => {
    const spec: AiAssist.ModelSpec = { tools: 'grok-reasoning', image: 'grok-vision' };
    expect(AiAssist.resolveModel(spec)).toBe('grok-reasoning');
  });
});

describe('modelSpec converter', () => {
  test('converts a simple string', () => {
    expect(AiAssist.modelSpec.convert('grok-4-1-fast')).toSucceedWith('grok-4-1-fast');
  });

  test('converts an object with string values', () => {
    expect(AiAssist.modelSpec.convert({ base: 'grok-fast', tools: 'grok-reasoning' })).toSucceedWith({
      base: 'grok-fast',
      tools: 'grok-reasoning'
    });
  });

  test('converts a deeply nested object', () => {
    const input = {
      base: 'grok-fast',
      tools: { base: 'grok-reasoning', image: 'grok-vision' }
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

  test('fails for nested invalid value', () => {
    expect(AiAssist.modelSpec.convert({ base: 'ok', tools: 123 })).toFailWith(/expected model spec/i);
  });
});
