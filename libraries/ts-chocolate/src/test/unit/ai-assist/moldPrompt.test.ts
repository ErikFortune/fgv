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

// eslint-disable-next-line @rushstack/packlets/mechanics
import { buildMoldAiPrompt } from '../../../packlets/ai-assist/moldPrompt';

describe('buildMoldAiPrompt', () => {
  test('generates prompt with basic description', () => {
    const prompt = buildMoldAiPrompt('Chocolate World CW-2227');

    // Should contain the mold description
    expect(prompt.combined).toContain('Chocolate World CW-2227');

    // Should contain schema sections
    expect(prompt.combined).toContain('## Schema');
    expect(prompt.combined).toContain('### Required fields:');
    expect(prompt.combined).toContain('### Optional fields:');

    // Should contain field descriptions
    expect(prompt.combined).toContain('"baseId"');
    expect(prompt.combined).toContain('"manufacturer"');
    expect(prompt.combined).toContain('"productNumber"');
    expect(prompt.combined).toContain('"cavities"');
    expect(prompt.combined).toContain('"format"');

    // Should mention JSON format
    expect(prompt.combined).toContain('Return ONLY valid JSON');
  });

  test('generates correct baseId from description', () => {
    const prompt = buildMoldAiPrompt('Chocolate World CW-2227');

    // Should generate kebab-case baseId
    expect(prompt.combined).toContain('chocolate-world-cw-2227');
  });

  test('handles descriptions with special characters', () => {
    const prompt = buildMoldAiPrompt('Martellato MA-1234 (Series 2000)');

    // Should strip special characters and convert to kebab-case
    expect(prompt.combined).toContain('martellato-ma-1234-series-2000');
  });

  test('handles descriptions with multiple spaces', () => {
    const prompt = buildMoldAiPrompt('Pavoni   KT-100   Elite');

    // Should collapse multiple spaces to single hyphens
    expect(prompt.combined).toContain('pavoni-kt-100-elite');
  });

  test('handles descriptions with leading/trailing hyphens', () => {
    const prompt = buildMoldAiPrompt('-Generic Sphere 25mm-');

    // Should strip leading and trailing hyphens
    expect(prompt.combined).toContain('generic-sphere-25mm');
  });

  test('includes mold format enum values', () => {
    const prompt = buildMoldAiPrompt('Test Mold');

    // Should list all valid format options
    expect(prompt.combined).toContain('"series-1000"');
    expect(prompt.combined).toContain('"series-2000"');
    expect(prompt.combined).toContain('"other"');
  });

  test('includes cavity format examples', () => {
    const prompt = buildMoldAiPrompt('Test Mold');

    // Should include both grid and count formats
    expect(prompt.combined).toContain('"kind": "grid"');
    expect(prompt.combined).toContain('"kind": "count"');
    expect(prompt.combined).toContain('"columns"');
    expect(prompt.combined).toContain('"rows"');
    expect(prompt.combined).toContain('"count"');
  });

  test('includes dimension and weight fields', () => {
    const prompt = buildMoldAiPrompt('Test Mold');

    // Should describe cavity measurements
    expect(prompt.combined).toContain('"weight"');
    expect(prompt.combined).toContain('"dimensions"');
    expect(prompt.combined).toContain('"width"');
    expect(prompt.combined).toContain('"length"');
    expect(prompt.combined).toContain('"depth"');
  });

  test('includes instructions for AI assumptions', () => {
    const prompt = buildMoldAiPrompt('Test Mold');

    // Should instruct AI to document assumptions
    expect(prompt.combined).toContain('category "ai"');
    expect(prompt.combined).toContain('assumptions');
  });

  test('includes optional fields guidance', () => {
    const prompt = buildMoldAiPrompt('Test Mold');

    // Should mention required name field
    expect(prompt.combined).toContain('"name"');
    // Should mention optional fields
    expect(prompt.combined).toContain('"tags"');
    expect(prompt.combined).toContain('"related"');
    expect(prompt.combined).toContain('"urls"');
    expect(prompt.combined).toContain('"notes"');
  });

  test('handles simple numeric descriptions', () => {
    const prompt = buildMoldAiPrompt('123456');

    expect(prompt.combined).toContain('123456');
  });

  test('handles mixed case consistently', () => {
    const prompt = buildMoldAiPrompt('ChOcOlAtE WoRlD');

    // Should convert to lowercase
    expect(prompt.combined).toContain('chocolate-world');
  });
});
