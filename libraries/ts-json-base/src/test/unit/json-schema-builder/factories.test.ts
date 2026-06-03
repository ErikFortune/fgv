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

describe('JsonSchema factories', () => {
  describe('leaf factories', () => {
    test('string', () => {
      expect(JsonSchema.string()).toEqual({ _type: 'string' });
      expect(JsonSchema.string({ description: 'name' })).toEqual({
        _type: 'string',
        description: 'name'
      });
    });

    test('boolean', () => {
      expect(JsonSchema.boolean()).toEqual({ _type: 'boolean' });
      expect(JsonSchema.boolean({ description: 'flag' })).toEqual({
        _type: 'boolean',
        description: 'flag'
      });
    });

    test('number defaults to strict', () => {
      expect(JsonSchema.number()).toEqual({ _type: 'number', strict: true });
      expect(JsonSchema.number({ strict: false })).toEqual({ _type: 'number', strict: false });
      expect(JsonSchema.number({ description: 'qty' })).toEqual({
        _type: 'number',
        strict: true,
        description: 'qty'
      });
    });

    test('integer defaults to strict', () => {
      expect(JsonSchema.integer()).toEqual({ _type: 'integer', strict: true });
      expect(JsonSchema.integer({ strict: false })).toEqual({ _type: 'integer', strict: false });
    });

    test('enumOf', () => {
      expect(JsonSchema.enumOf(['a', 'b'] as const)).toEqual({ _type: 'enum', enum: ['a', 'b'] });
      expect(JsonSchema.enumOf(['a'] as const, { description: 'choices' })).toEqual({
        _type: 'enum',
        enum: ['a'],
        description: 'choices'
      });
    });
  });

  describe('composite factories', () => {
    test('optional wraps the inner schema', () => {
      const inner = JsonSchema.integer();
      expect(JsonSchema.optional(inner)).toEqual({ _type: 'optional', _schema: inner });
    });

    test('array carries items and optional description', () => {
      const items = JsonSchema.string();
      expect(JsonSchema.array(items)).toEqual({ _type: 'array', _items: items });
      expect(JsonSchema.array(items, { description: 'list' })).toEqual({
        _type: 'array',
        _items: items,
        description: 'list'
      });
    });

    test('object defaults additionalProperties to false', () => {
      const properties = { id: JsonSchema.string() };
      expect(JsonSchema.object(properties)).toEqual({
        _type: 'object',
        _properties: properties,
        additionalProperties: false
      });
      expect(JsonSchema.object(properties, { additionalProperties: true })).toEqual({
        _type: 'object',
        _properties: properties,
        additionalProperties: true
      });
      expect(JsonSchema.object(properties, { description: 'thing' })).toEqual({
        _type: 'object',
        _properties: properties,
        additionalProperties: false,
        description: 'thing'
      });
    });
  });

  describe('derived static types', () => {
    test('Static<S> matches the authored shape at runtime', () => {
      const schema = JsonSchema.object({
        query: JsonSchema.string(),
        limit: JsonSchema.optional(JsonSchema.number()),
        action: JsonSchema.enumOf(['run', 'stop'] as const),
        tags: JsonSchema.array(JsonSchema.string()),
        active: JsonSchema.boolean()
      });

      // Compile-time: the derived type is assignable both ways against the explicit shape.
      const value: JsonSchema.Static<typeof schema> = {
        query: 'a',
        action: 'run',
        tags: ['x'],
        active: true
      };
      const explicit: {
        query: string;
        limit?: number;
        action: 'run' | 'stop';
        tags: string[];
        active: boolean;
      } = value;
      expect(explicit.query).toBe('a');
      expect(explicit.limit).toBeUndefined();

      // The derived converter accepts the same value.
      expect(JsonSchema.toConverter(schema).orThrow().convert(value)).toSucceedWith(value);
    });
  });
});
