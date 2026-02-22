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
      expect(prompt).toContain('"gold-leaf"');
    });

    test('strips leading and trailing hyphens', () => {
      const prompt = buildDecorationAiPrompt('--Transfer Sheet--');
      expect(prompt).toContain('"transfer-sheet"');
    });

    test('collapses non-alphanumeric characters into single hyphens', () => {
      const prompt = buildDecorationAiPrompt('Cocoa Butter (Colored) 50%');
      expect(prompt).toContain('"cocoa-butter-colored-50"');
    });

    test('handles single-word name', () => {
      const prompt = buildDecorationAiPrompt('Glitter');
      expect(prompt).toContain('"glitter"');
    });
  });

  describe('prompt content', () => {
    const prompt = buildDecorationAiPrompt('Test Decoration');

    test('includes the decoration name in the prompt', () => {
      expect(prompt).toContain('Test Decoration');
    });

    test('includes schema sections', () => {
      expect(prompt).toContain('## Schema');
      expect(prompt).toContain('### Required fields:');
      expect(prompt).toContain('### Optional fields:');
    });

    test('includes required field descriptions', () => {
      expect(prompt).toContain('"baseId"');
      expect(prompt).toContain('"name"');
      expect(prompt).toContain('"ingredients"');
    });

    test('includes optional field descriptions', () => {
      expect(prompt).toContain('"description"');
      expect(prompt).toContain('"tags"');
      expect(prompt).toContain('"notes"');
      expect(prompt).toContain('"ratings"');
    });

    test('includes ingredient object schema', () => {
      expect(prompt).toContain('"ingredient"');
      expect(prompt).toContain('"ids"');
      expect(prompt).toContain('"preferredId"');
      expect(prompt).toContain('"amount"');
    });

    test('includes rating object schema', () => {
      expect(prompt).toContain('"category"');
      expect(prompt).toContain('"score"');
      expect(prompt).toContain('difficulty');
      expect(prompt).toContain('durability');
      expect(prompt).toContain('appearance');
      expect(prompt).toContain('workability');
    });

    test('includes notes instruction', () => {
      expect(prompt).toContain('category "ai"');
      expect(prompt).toContain('assumptions');
    });

    test('instructs to return only JSON', () => {
      expect(prompt).toContain('Return ONLY valid JSON');
      expect(prompt).toContain('no markdown');
      expect(prompt).toContain('no code fences');
    });
  });
});
