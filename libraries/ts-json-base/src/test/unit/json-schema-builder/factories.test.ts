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

/** Helpers to access implementation-detail fields on schema instances via unknown cast. */
function asImpl<T>(schema: unknown): T {
  return schema as unknown as T;
}

describe('JsonSchema factories', () => {
  describe('leaf factories', () => {
    test('string carries _type and optional description', () => {
      expect(JsonSchema.string()._type).toBe('string');
      expect(JsonSchema.string().description).toBeUndefined();
      expect(JsonSchema.string({ description: 'name' }).description).toBe('name');
    });

    test('boolean carries _type and optional description', () => {
      expect(JsonSchema.boolean()._type).toBe('boolean');
      expect(JsonSchema.boolean().description).toBeUndefined();
      expect(JsonSchema.boolean({ description: 'flag' }).description).toBe('flag');
    });

    test('number defaults to strict, carries optional description', () => {
      const n = JsonSchema.number();
      expect(n._type).toBe('number');
      expect(asImpl<{ strict: boolean }>(n).strict).toBe(true);

      const nonStrict = JsonSchema.number({ strict: false });
      expect(asImpl<{ strict: boolean }>(nonStrict).strict).toBe(false);

      const withDesc = JsonSchema.number({ description: 'qty' });
      expect(asImpl<{ strict: boolean }>(withDesc).strict).toBe(true);
      expect(withDesc.description).toBe('qty');
    });

    test('integer defaults to strict', () => {
      const i = JsonSchema.integer();
      expect(i._type).toBe('integer');
      expect(asImpl<{ strict: boolean }>(i).strict).toBe(true);

      const nonStrict = JsonSchema.integer({ strict: false });
      expect(asImpl<{ strict: boolean }>(nonStrict).strict).toBe(false);
    });

    test('enumOf carries _type and enum values', () => {
      const e = JsonSchema.enumOf(['a', 'b'] as const);
      expect(e._type).toBe('enum');
      expect(asImpl<{ enum: ReadonlyArray<string> }>(e).enum).toEqual(['a', 'b']);

      const withDesc = JsonSchema.enumOf(['a'] as const, { description: 'choices' });
      expect(asImpl<{ enum: ReadonlyArray<string> }>(withDesc).enum).toEqual(['a']);
      expect(withDesc.description).toBe('choices');
    });
  });

  describe('composite factories', () => {
    test('optional wraps the inner schema and is transparent at JSON Schema level', () => {
      const inner = JsonSchema.integer();
      const opt = JsonSchema.optional(inner);
      expect(opt._type).toBe('optional');
      expect(asImpl<{ _schema: JsonSchema.ISchemaValidator<number> }>(opt)._schema).toBe(inner);
    });

    test('array carries _type, _items, and optional description', () => {
      const items = JsonSchema.string();
      const arr = JsonSchema.array(items);
      expect(arr._type).toBe('array');
      expect(asImpl<{ _items: JsonSchema.ISchemaValidator<string> }>(arr)._items).toBe(items);

      const withDesc = JsonSchema.array(items, { description: 'list' });
      expect(withDesc._type).toBe('array');
      expect(withDesc.description).toBe('list');
    });

    test('object defaults additionalProperties to false', () => {
      const properties = { id: JsonSchema.string() };
      const obj = JsonSchema.object(properties);
      expect(obj._type).toBe('object');
      expect(asImpl<{ additionalProperties: boolean }>(obj).additionalProperties).toBe(false);

      const lenient = JsonSchema.object(properties, { additionalProperties: true });
      expect(asImpl<{ additionalProperties: boolean }>(lenient).additionalProperties).toBe(true);

      const withDesc = JsonSchema.object(properties, { description: 'thing' });
      expect(asImpl<{ additionalProperties: boolean }>(withDesc).additionalProperties).toBe(false);
      expect(withDesc.description).toBe('thing');
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

      // Schema IS a Validator — call validate() directly.
      expect(schema.validate(value)).toSucceedWith(value);
    });
  });
});
