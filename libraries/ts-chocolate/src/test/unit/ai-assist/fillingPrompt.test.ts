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

import { buildFillingAiPrompt } from '../../../packlets/ai-assist';

describe('buildFillingAiPrompt', () => {
  describe('baseId generation', () => {
    test('converts simple name to kebab-case', () => {
      const prompt = buildFillingAiPrompt('Dark Chocolate Ganache');
      expect(prompt.combined).toContain('"dark-chocolate-ganache"');
    });

    test('strips leading and trailing hyphens', () => {
      const prompt = buildFillingAiPrompt('--Salted Caramel--');
      expect(prompt.combined).toContain('"salted-caramel"');
    });

    test('collapses non-alphanumeric characters into single hyphens', () => {
      const prompt = buildFillingAiPrompt('Raspberry & Rose (70%)');
      expect(prompt.combined).toContain('"raspberry-rose-70"');
    });

    test('handles single-word name', () => {
      const prompt = buildFillingAiPrompt('Praline');
      expect(prompt.combined).toContain('"praline"');
    });
  });

  describe('prompt content', () => {
    const prompt = buildFillingAiPrompt('Test Filling');

    test('includes the filling name in the prompt', () => {
      expect(prompt.combined).toContain('Test Filling');
    });

    test('includes schema sections', () => {
      expect(prompt.combined).toContain('## Schema');
      expect(prompt.combined).toContain('### Top-level required fields:');
      expect(prompt.combined).toContain('### Top-level optional fields:');
    });

    test('includes required top-level fields', () => {
      expect(prompt.combined).toContain('"baseId"');
      expect(prompt.combined).toContain('"name"');
      expect(prompt.combined).toContain('"category"');
      expect(prompt.combined).toContain('"goldenVariationSpec"');
      expect(prompt.combined).toContain('"variations"');
    });

    test('includes filling categories', () => {
      expect(prompt.combined).toContain('"ganache"');
      expect(prompt.combined).toContain('"caramel"');
      expect(prompt.combined).toContain('"gianduja"');
    });

    test('includes variation object fields', () => {
      expect(prompt.combined).toContain('"variationSpec"');
      expect(prompt.combined).toContain('"createdDate"');
      expect(prompt.combined).toContain('"baseWeight"');
      expect(prompt.combined).toContain('"ingredients"');
    });

    test('includes variation optional fields', () => {
      expect(prompt.combined).toContain('"yield"');
    });

    test('includes ingredient object schema', () => {
      expect(prompt.combined).toContain('"ingredient"');
      expect(prompt.combined).toContain('"ids"');
      expect(prompt.combined).toContain('"preferredId"');
      expect(prompt.combined).toContain('"amount"');
    });

    test('includes ingredient modifier fields', () => {
      expect(prompt.combined).toContain('"modifiers"');
      expect(prompt.combined).toContain('"toTaste"');
      expect(prompt.combined).toContain('"processNote"');
      expect(prompt.combined).toContain('"yieldFactor"');
    });

    test('includes today date as ISO string', () => {
      const today = new Date().toISOString().split('T')[0]!;
      expect(prompt.combined).toContain(today);
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
