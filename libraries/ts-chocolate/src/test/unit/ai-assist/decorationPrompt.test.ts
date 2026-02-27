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

import { buildDecorationAiPrompt } from '../../../packlets/ai-assist';

describe('buildDecorationAiPrompt', () => {
  describe('baseId generation', () => {
    test('converts simple name to kebab-case', () => {
      const prompt = buildDecorationAiPrompt('Gold Leaf');
      expect(prompt.combined).toContain('"gold-leaf"');
    });

    test('strips leading and trailing hyphens', () => {
      const prompt = buildDecorationAiPrompt('--Transfer Sheet--');
      expect(prompt.combined).toContain('"transfer-sheet"');
    });

    test('collapses non-alphanumeric characters into single hyphens', () => {
      const prompt = buildDecorationAiPrompt('Cocoa Butter (Colored) 50%');
      expect(prompt.combined).toContain('"cocoa-butter-colored-50"');
    });

    test('handles single-word name', () => {
      const prompt = buildDecorationAiPrompt('Glitter');
      expect(prompt.combined).toContain('"glitter"');
    });
  });

  describe('prompt content', () => {
    const prompt = buildDecorationAiPrompt('Test Decoration');

    test('includes the decoration name in the prompt', () => {
      expect(prompt.combined).toContain('Test Decoration');
    });

    test('includes schema sections', () => {
      expect(prompt.combined).toContain('## Schema');
      expect(prompt.combined).toContain('### Required fields:');
      expect(prompt.combined).toContain('### Optional fields:');
    });

    test('includes required field descriptions', () => {
      expect(prompt.combined).toContain('"baseId"');
      expect(prompt.combined).toContain('"name"');
      expect(prompt.combined).toContain('"ingredients"');
    });

    test('includes optional field descriptions', () => {
      expect(prompt.combined).toContain('"description"');
      expect(prompt.combined).toContain('"tags"');
      expect(prompt.combined).toContain('"notes"');
      expect(prompt.combined).toContain('"ratings"');
    });

    test('includes ingredient object schema', () => {
      expect(prompt.combined).toContain('"ingredient"');
      expect(prompt.combined).toContain('"ids"');
      expect(prompt.combined).toContain('"preferredId"');
      expect(prompt.combined).toContain('"amount"');
    });

    test('includes rating object schema', () => {
      expect(prompt.combined).toContain('"category"');
      expect(prompt.combined).toContain('"score"');
      expect(prompt.combined).toContain('difficulty');
      expect(prompt.combined).toContain('durability');
      expect(prompt.combined).toContain('appearance');
      expect(prompt.combined).toContain('workability');
    });

    test('includes notes instruction', () => {
      expect(prompt.combined).toContain('category "ai"');
      expect(prompt.combined).toContain('assumptions');
    });

    test('instructs to return only JSON', () => {
      expect(prompt.combined).toContain('Return ONLY valid JSON');
      expect(prompt.combined).toContain('no markdown');
      expect(prompt.combined).toContain('no code fences');
    });
  });
});
