/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import '@fgv/ts-utils-jest';
import { JsonSchema } from '../../..';

describe('JsonSchema.toJson', () => {
  describe('leaf nodes', () => {
    test('string', () => {
      expect(JsonSchema.toJson(JsonSchema.string())).toEqual({ type: 'string' });
      expect(JsonSchema.toJson(JsonSchema.string({ description: 'name' }))).toEqual({
        type: 'string',
        description: 'name'
      });
    });

    test('number and integer (strict flag is internal and not emitted)', () => {
      expect(JsonSchema.toJson(JsonSchema.number())).toEqual({ type: 'number' });
      expect(JsonSchema.toJson(JsonSchema.number({ strict: false }))).toEqual({ type: 'number' });
      expect(JsonSchema.toJson(JsonSchema.integer({ description: 'count' }))).toEqual({
        type: 'integer',
        description: 'count'
      });
    });

    test('boolean', () => {
      expect(JsonSchema.toJson(JsonSchema.boolean())).toEqual({ type: 'boolean' });
    });

    test('enum emits string type with the enum values', () => {
      expect(JsonSchema.toJson(JsonSchema.enumOf(['a', 'b'] as const, { description: 'c' }))).toEqual({
        type: 'string',
        enum: ['a', 'b'],
        description: 'c'
      });
    });
  });

  describe('composite nodes', () => {
    test('array emits items', () => {
      expect(JsonSchema.toJson(JsonSchema.array(JsonSchema.string(), { description: 'list' }))).toEqual({
        type: 'array',
        items: { type: 'string' },
        description: 'list'
      });
    });

    test('optional at top level emits the inner schema (optionality is a parent concern)', () => {
      expect(JsonSchema.toJson(JsonSchema.optional(JsonSchema.string()))).toEqual({ type: 'string' });
    });

    test('object emits properties, required, and additionalProperties', () => {
      const schema = JsonSchema.object(
        {
          query: JsonSchema.string({ description: 'the query' }),
          limit: JsonSchema.optional(JsonSchema.integer())
        },
        { description: 'search args' }
      );
      expect(JsonSchema.toJson(schema)).toEqual({
        type: 'object',
        properties: {
          query: { type: 'string', description: 'the query' },
          limit: { type: 'integer' }
        },
        required: ['query'],
        additionalProperties: false,
        description: 'search args'
      });
    });

    test('object with additionalProperties: true omits the keyword', () => {
      const schema = JsonSchema.object({ query: JsonSchema.string() }, { additionalProperties: true });
      // additionalProperties is only emitted when false; when true the keyword is omitted.
      expect(JsonSchema.toJson(schema)).toEqual({
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query']
      });
    });

    test('object with no required fields omits the required array', () => {
      const schema = JsonSchema.object({ limit: JsonSchema.optional(JsonSchema.integer()) });
      expect(JsonSchema.toJson(schema)).toEqual({
        type: 'object',
        properties: { limit: { type: 'integer' } },
        additionalProperties: false
      });
    });
  });

  describe('unsupported nodes', () => {
    test('emits an empty object for an unknown discriminant', () => {
      const bad = { _type: 'weird' } as unknown as JsonSchema.ILlmSchema<unknown>;
      expect(JsonSchema.toJson(bad)).toEqual({});
    });
  });
});
