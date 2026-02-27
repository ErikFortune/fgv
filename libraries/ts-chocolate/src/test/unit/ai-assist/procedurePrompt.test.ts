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
      expect(prompt.combined).toContain('"temper-dark-chocolate"');
    });

    test('strips leading and trailing hyphens', () => {
      const prompt = buildProcedureAiPrompt('--Ganache Method--');
      expect(prompt.combined).toContain('"ganache-method"');
    });

    test('collapses non-alphanumeric characters into single hyphens', () => {
      const prompt = buildProcedureAiPrompt('Enrobe & Decorate (Shell)');
      expect(prompt.combined).toContain('"enrobe-decorate-shell"');
    });

    test('handles single-word name', () => {
      const prompt = buildProcedureAiPrompt('Tempering');
      expect(prompt.combined).toContain('"tempering"');
    });
  });

  describe('prompt content', () => {
    const prompt = buildProcedureAiPrompt('Test Procedure');

    test('includes the procedure name in the prompt', () => {
      expect(prompt.combined).toContain('Test Procedure');
    });

    test('includes schema sections', () => {
      expect(prompt.combined).toContain('## Schema');
      expect(prompt.combined).toContain('### Required fields:');
      expect(prompt.combined).toContain('### Optional fields:');
    });

    test('includes required field descriptions', () => {
      expect(prompt.combined).toContain('"baseId"');
      expect(prompt.combined).toContain('"name"');
      expect(prompt.combined).toContain('"steps"');
    });

    test('includes optional field descriptions', () => {
      expect(prompt.combined).toContain('"description"');
      expect(prompt.combined).toContain('"category"');
      expect(prompt.combined).toContain('"tags"');
      expect(prompt.combined).toContain('"notes"');
    });

    test('includes procedure categories', () => {
      expect(prompt.combined).toContain('"ganache"');
      expect(prompt.combined).toContain('"caramel"');
      expect(prompt.combined).toContain('"gianduja"');
      expect(prompt.combined).toContain('"molded-bonbon"');
      expect(prompt.combined).toContain('"rolled-truffle"');
      expect(prompt.combined).toContain('"bar-truffle"');
      expect(prompt.combined).toContain('"decoration"');
      expect(prompt.combined).toContain('"other"');
    });

    test('includes step object fields', () => {
      expect(prompt.combined).toContain('"order"');
      expect(prompt.combined).toContain('"task"');
      expect(prompt.combined).toContain('"activeTime"');
      expect(prompt.combined).toContain('"waitTime"');
      expect(prompt.combined).toContain('"holdTime"');
      expect(prompt.combined).toContain('"temperature"');
    });

    test('includes inline task schema', () => {
      expect(prompt.combined).toContain('"task"');
      expect(prompt.combined).toContain('"baseId"');
      expect(prompt.combined).toContain('"template"');
      expect(prompt.combined).toContain('"params"');
    });

    test('includes library task reference schema', () => {
      expect(prompt.combined).toContain('"taskId"');
      expect(prompt.combined).toContain('"params"');
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
