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

describe('JsonSchema.toConverter', () => {
  describe('leaf converters', () => {
    test('string accepts strings and rejects non-strings', () => {
      const converter = JsonSchema.toConverter(JsonSchema.string()).orThrow();
      expect(converter.convert('hello')).toSucceedWith('hello');
      expect(converter.convert(42)).toFailWith(/not a string/i);
    });

    test('boolean accepts booleans and rejects non-booleans', () => {
      const converter = JsonSchema.toConverter(JsonSchema.boolean()).orThrow();
      expect(converter.convert(true)).toSucceedWith(true);
      expect(converter.convert(false)).toSucceedWith(false);
      expect(converter.convert('nope')).toFailWith(/not a boolean/i);
    });

    test('enum accepts listed values and rejects others', () => {
      const converter = JsonSchema.toConverter(JsonSchema.enumOf(['run', 'stop'] as const)).orThrow();
      expect(converter.convert('run')).toSucceedWith('run');
      expect(converter.convert('stop')).toSucceedWith('stop');
      expect(converter.convert('pause')).toFailWith(/invalid enumerated value/i);
    });
  });

  describe('numeric converters', () => {
    test('strict number (default) rejects numeric strings', () => {
      const converter = JsonSchema.toConverter(JsonSchema.number()).orThrow();
      expect(converter.convert(3.14)).toSucceedWith(3.14);
      expect(converter.convert('42')).toFailWith(/invalid number/i);
      expect(converter.convert(Number.NaN)).toFailWith(/invalid number/i);
    });

    test('non-strict number coerces numeric strings', () => {
      const converter = JsonSchema.toConverter(JsonSchema.number({ strict: false })).orThrow();
      expect(converter.convert(7)).toSucceedWith(7);
      expect(converter.convert('42')).toSucceedWith(42);
      expect(converter.convert('nope')).toFailWith(/not a number/i);
    });

    test('strict integer rejects non-integers and numeric strings', () => {
      const converter = JsonSchema.toConverter(JsonSchema.integer()).orThrow();
      expect(converter.convert(5)).toSucceedWith(5);
      expect(converter.convert(5.5)).toFailWith(/invalid integer/i);
      expect(converter.convert('5')).toFailWith(/invalid integer/i);
    });

    test('non-strict integer coerces numeric strings but still requires whole numbers', () => {
      const converter = JsonSchema.toConverter(JsonSchema.integer({ strict: false })).orThrow();
      expect(converter.convert(5)).toSucceedWith(5);
      expect(converter.convert('5')).toSucceedWith(5);
      expect(converter.convert(5.5)).toFailWith(/not an integer/i);
      expect(converter.convert('5.5')).toFailWith(/not an integer/i);
    });
  });

  describe('array converters', () => {
    test('array of strings', () => {
      const converter = JsonSchema.toConverter(JsonSchema.array(JsonSchema.string())).orThrow();
      expect(converter.convert(['a', 'b'])).toSucceedWith(['a', 'b']);
      expect(converter.convert(['a', 3])).toFailWith(/not a string/i);
      expect(converter.convert('not-an-array')).toFailWith(/not an array/i);
    });

    test('array of objects', () => {
      const schema = JsonSchema.array(JsonSchema.object({ id: JsonSchema.integer() }));
      const converter = JsonSchema.toConverter(schema).orThrow();
      expect(converter.convert([{ id: 1 }, { id: 2 }])).toSucceedWith([{ id: 1 }, { id: 2 }]);
    });

    test('propagates failure from an unsupported element schema', () => {
      const bad = JsonSchema.array({ _type: 'bogus' } as unknown as JsonSchema.ILlmSchema<unknown>);
      expect(JsonSchema.toConverter(bad)).toFailWith(/unsupported schema type: bogus/i);
    });
  });

  describe('object converters', () => {
    test('required and optional fields with the strict default', () => {
      const schema = JsonSchema.object({
        query: JsonSchema.string(),
        limit: JsonSchema.optional(JsonSchema.integer())
      });
      const converter = JsonSchema.toConverter(schema).orThrow();

      expect(converter.convert({ query: 'a', limit: 3 })).toSucceedWith({ query: 'a', limit: 3 });
      // optional field may be omitted
      expect(converter.convert({ query: 'a' })).toSucceedAndSatisfy((value) => {
        expect(value).toEqual({ query: 'a' });
      });
      // required field missing
      expect(converter.convert({ limit: 3 })).toFail();
      // strict default rejects unknown fields
      expect(converter.convert({ query: 'a', sneaky: 1 })).toFailWith(/sneaky/i);
    });

    test('additionalProperties: true ignores unknown fields', () => {
      const schema = JsonSchema.object({ query: JsonSchema.string() }, { additionalProperties: true });
      const converter = JsonSchema.toConverter(schema).orThrow();
      expect(converter.convert({ query: 'a', extra: 99 })).toSucceedWith({ query: 'a' });
    });

    test('carries description into the object converter', () => {
      const schema = JsonSchema.object({ id: JsonSchema.string() }, { description: 'an id holder' });
      expect(JsonSchema.toConverter(schema)).toSucceed();
    });

    test('field-level failure is reported with the property name', () => {
      const schema = JsonSchema.object({
        good: JsonSchema.string(),
        bad: { _type: 'bogus' } as unknown as JsonSchema.ILlmSchema<unknown>
      });
      expect(JsonSchema.toConverter(schema)).toFailWith(/bad: unsupported schema type: bogus/i);
    });

    test('nested object round-trip', () => {
      const schema = JsonSchema.object({
        action: JsonSchema.enumOf(['run', 'stop'] as const),
        config: JsonSchema.object({
          timeout: JsonSchema.optional(JsonSchema.integer()),
          tags: JsonSchema.array(JsonSchema.string())
        })
      });
      const converter = JsonSchema.toConverter(schema).orThrow();
      const value = { action: 'run' as const, config: { timeout: 30, tags: ['x'] } };
      expect(converter.convert(value)).toSucceedWith(value);
      expect(converter.convert({ action: 'run', config: { tags: [] } })).toSucceedAndSatisfy((v) => {
        expect(v).toEqual({ action: 'run', config: { tags: [] } });
      });
    });
  });

  describe('unsupported nodes', () => {
    test('fails for an unknown _type discriminant', () => {
      const bad = { _type: 'weird' } as unknown as JsonSchema.ILlmSchema<unknown>;
      expect(JsonSchema.toConverter(bad)).toFailWith(/unsupported schema type: weird/i);
    });
  });
});
