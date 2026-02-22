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

import { buildProcedureAiPrompt } from '../../../packlets/ai-assist';

describe('buildProcedureAiPrompt', () => {
  describe('baseId generation', () => {
    test('converts simple name to kebab-case', () => {
      const prompt = buildProcedureAiPrompt('Temper Dark Chocolate');
      expect(prompt).toContain('"temper-dark-chocolate"');
    });

    test('strips leading and trailing hyphens', () => {
      const prompt = buildProcedureAiPrompt('--Ganache Method--');
      expect(prompt).toContain('"ganache-method"');
    });

    test('collapses non-alphanumeric characters into single hyphens', () => {
      const prompt = buildProcedureAiPrompt('Enrobe & Decorate (Shell)');
      expect(prompt).toContain('"enrobe-decorate-shell"');
    });

    test('handles single-word name', () => {
      const prompt = buildProcedureAiPrompt('Tempering');
      expect(prompt).toContain('"tempering"');
    });
  });

  describe('prompt content', () => {
    const prompt = buildProcedureAiPrompt('Test Procedure');

    test('includes the procedure name in the prompt', () => {
      expect(prompt).toContain('Test Procedure');
    });

    test('includes schema sections', () => {
      expect(prompt).toContain('## Schema');
      expect(prompt).toContain('### Required fields:');
      expect(prompt).toContain('### Optional fields:');
    });

    test('includes required field descriptions', () => {
      expect(prompt).toContain('"baseId"');
      expect(prompt).toContain('"name"');
      expect(prompt).toContain('"steps"');
    });

    test('includes optional field descriptions', () => {
      expect(prompt).toContain('"description"');
      expect(prompt).toContain('"category"');
      expect(prompt).toContain('"tags"');
      expect(prompt).toContain('"notes"');
    });

    test('includes procedure categories', () => {
      expect(prompt).toContain('"ganache"');
      expect(prompt).toContain('"caramel"');
      expect(prompt).toContain('"gianduja"');
      expect(prompt).toContain('"molded-bon-bon"');
      expect(prompt).toContain('"rolled-truffle"');
      expect(prompt).toContain('"bar-truffle"');
      expect(prompt).toContain('"decoration"');
      expect(prompt).toContain('"other"');
    });

    test('includes step object fields', () => {
      expect(prompt).toContain('"order"');
      expect(prompt).toContain('"task"');
      expect(prompt).toContain('"activeTime"');
      expect(prompt).toContain('"waitTime"');
      expect(prompt).toContain('"holdTime"');
      expect(prompt).toContain('"temperature"');
    });

    test('includes inline task schema', () => {
      expect(prompt).toContain('"kind": "inline"');
      expect(prompt).toContain('"name"');
      expect(prompt).toContain('"description"');
    });

    test('includes library task reference schema', () => {
      expect(prompt).toContain('"kind": "library"');
      expect(prompt).toContain('"id"');
      expect(prompt).toContain('"params"');
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
