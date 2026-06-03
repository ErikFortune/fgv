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

/**
 * Validates schema-validator behavior. Schema nodes ARE Validators — consumers call
 * schema.validate(input) directly. This test suite covers the same cases as the previous
 * toConverter test suite, rewritten to use the Validator interface.
 */
import '@fgv/ts-utils-jest';
import { JsonSchema } from '../../..';

describe('JsonSchema schema validation (schema IS a Validator)', () => {
  describe('leaf validators', () => {
    test('string accepts strings and rejects non-strings', () => {
      const schema = JsonSchema.string();
      expect(schema.validate('hello')).toSucceedWith('hello');
      expect(schema.validate(42)).toFailWith(/not a string/i);
    });

    test('boolean accepts booleans and rejects non-booleans', () => {
      const schema = JsonSchema.boolean();
      expect(schema.validate(true)).toSucceedWith(true);
      expect(schema.validate(false)).toSucceedWith(false);
      expect(schema.validate('nope')).toFailWith(/not a boolean/i);
    });

    test('enum accepts listed values and rejects others', () => {
      const schema = JsonSchema.enumOf(['run', 'stop'] as const);
      expect(schema.validate('run')).toSucceedWith('run');
      expect(schema.validate('stop')).toSucceedWith('stop');
      expect(schema.validate('pause')).toFailWith(/invalid enumerated value/i);
    });
  });

  describe('numeric validators', () => {
    test('strict number (default) rejects numeric strings', () => {
      const schema = JsonSchema.number();
      expect(schema.validate(3.14)).toSucceedWith(3.14);
      expect(schema.validate('42')).toFailWith(/invalid number/i);
      expect(schema.validate(Number.NaN)).toFailWith(/invalid number/i);
    });

    test('non-strict number coerces numeric strings', () => {
      const schema = JsonSchema.number({ strict: false });
      expect(schema.validate(7)).toSucceedWith(7);
      expect(schema.validate('42')).toSucceedWith(42);
      expect(schema.validate('nope')).toFailWith(/not a number/i);
    });

    test('strict integer rejects non-integers and numeric strings', () => {
      const schema = JsonSchema.integer();
      expect(schema.validate(5)).toSucceedWith(5);
      expect(schema.validate(5.5)).toFailWith(/invalid integer/i);
      expect(schema.validate('5')).toFailWith(/invalid integer/i);
    });

    test('non-strict integer coerces numeric strings but still requires whole numbers', () => {
      const schema = JsonSchema.integer({ strict: false });
      expect(schema.validate(5)).toSucceedWith(5);
      expect(schema.validate('5')).toSucceedWith(5);
      expect(schema.validate(5.5)).toFailWith(/not an integer/i);
      expect(schema.validate('5.5')).toFailWith(/not an integer/i);
    });
  });

  describe('array validators', () => {
    test('array of strings', () => {
      const schema = JsonSchema.array(JsonSchema.string());
      expect(schema.validate(['a', 'b'])).toSucceedWith(['a', 'b']);
      expect(schema.validate(['a', 3])).toFailWith(/not a string/i);
      expect(schema.validate('not-an-array')).toFailWith(/not an array/i);
    });

    test('array of objects', () => {
      const schema = JsonSchema.array(JsonSchema.object({ id: JsonSchema.integer() }));
      expect(schema.validate([{ id: 1 }, { id: 2 }])).toSucceedWith([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('object validators', () => {
    test('required and optional fields with the strict default', () => {
      const schema = JsonSchema.object({
        query: JsonSchema.string(),
        limit: JsonSchema.optional(JsonSchema.integer())
      });

      expect(schema.validate({ query: 'a', limit: 3 })).toSucceedWith({ query: 'a', limit: 3 });
      // optional field may be omitted
      expect(schema.validate({ query: 'a' })).toSucceedAndSatisfy((value) => {
        expect(value).toEqual({ query: 'a' });
      });
      // required field missing
      expect(schema.validate({ limit: 3 })).toFail();
      // strict default rejects unknown fields
      expect(schema.validate({ query: 'a', sneaky: 1 })).toFailWith(/sneaky/i);
    });

    test('additionalProperties: true ignores unknown fields', () => {
      const schema = JsonSchema.object({ query: JsonSchema.string() }, { additionalProperties: true });
      expect(schema.validate({ query: 'a', extra: 99 })).toSucceedWith({ query: 'a' });
    });

    test('carries description into the object validator', () => {
      const schema = JsonSchema.object({ id: JsonSchema.string() }, { description: 'an id holder' });
      expect(schema.validate({ id: 'abc' })).toSucceedWith({ id: 'abc' });
    });

    test('nested object round-trip', () => {
      const schema = JsonSchema.object({
        action: JsonSchema.enumOf(['run', 'stop'] as const),
        config: JsonSchema.object({
          timeout: JsonSchema.optional(JsonSchema.integer()),
          tags: JsonSchema.array(JsonSchema.string())
        })
      });
      const value = { action: 'run' as const, config: { timeout: 30, tags: ['x'] } };
      expect(schema.validate(value)).toSucceedWith(value);
      expect(schema.validate({ action: 'run', config: { tags: [] } })).toSucceedAndSatisfy((v) => {
        expect(v).toEqual({ action: 'run', config: { tags: [] } });
      });
    });
  });

  describe('optional wrapper', () => {
    test('optional validates present and absent values', () => {
      const schema = JsonSchema.optional(JsonSchema.string());
      expect(schema.validate('hello')).toSucceedWith('hello');
      expect(schema.validate(undefined)).toSucceedWith(undefined);
      expect(schema.validate(42)).toFailWith(/not a string/i);
    });
  });
});
