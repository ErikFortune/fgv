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
import { JsonObject } from '../../../packlets/json';
import { JsonSchema } from '../../..';

describe('JsonSchema.fromJson', () => {
  describe('in-subset parsing', () => {
    test('parses leaf types and re-emits the normalized wire form', () => {
      const cases: JsonObject[] = [
        { type: 'string', description: 'name' },
        { type: 'number' },
        { type: 'integer' },
        { type: 'boolean' },
        { type: 'string', enum: ['a', 'b'] }
      ];
      for (const raw of cases) {
        expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
          expect(schema.toJson()).toEqual(normalizeEnum(raw));
        });
      }
    });

    test('parses an array schema', () => {
      const raw: JsonObject = { type: 'array', items: { type: 'string' } };
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual(raw);
        // fromJson yields an ISchemaValidator<JsonObject>; validate() works at runtime.
        expect(schema.validate(['x'])).toSucceedAndSatisfy((v) => {
          expect(v).toEqual(['x']);
        });
      });
    });

    test('parses an object schema, honoring required/optional split', () => {
      const raw: JsonObject = {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'integer' }
        },
        required: ['query'],
        additionalProperties: false
      };
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual(raw);
        expect(schema.validate({ query: 'a' })).toSucceedWith({ query: 'a' });
        expect(schema.validate({ query: 'a', limit: 2 })).toSucceedWith({ query: 'a', limit: 2 });
        // strict because additionalProperties: false
        expect(schema.validate({ query: 'a', extra: 1 })).toFailWith(/extra/i);
      });
    });

    test('object without additionalProperties:false is lenient (JSON Schema default)', () => {
      const raw: JsonObject = {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query']
      };
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.validate({ query: 'a', extra: 1 })).toSucceedWith({ query: 'a' });
      });
    });

    test('object with no properties and no required', () => {
      const raw: JsonObject = { type: 'object' };
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.validate({})).toSucceedWith({});
      });
    });

    test('ignores harmless annotations (format, title, default) without failing', () => {
      const raw: JsonObject = { type: 'string', format: 'date-time', title: 'When', default: 'now' };
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual({ type: 'string' });
      });
    });

    test('a parsed schema validates at runtime as ISchemaValidator<JsonObject>', () => {
      const raw: JsonObject = {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id']
      };
      const schema = JsonSchema.fromJson(raw).orThrow();
      expect(schema.validate({ id: 'abc' })).toSucceedWith({ id: 'abc' });
      expect(schema.validate({})).toFail();
    });
  });

  describe('out-of-subset rejection', () => {
    test.each([
      ['$ref', { $ref: '#/defs/Foo' }],
      ['oneOf', { oneOf: [{ type: 'string' }] }],
      ['anyOf', { anyOf: [{ type: 'string' }] }],
      ['allOf', { allOf: [{ type: 'string' }] }],
      ['not', { not: { type: 'string' } }],
      ['if', { if: { type: 'string' } }],
      ['then', { then: { type: 'string' } }],
      ['else', { else: { type: 'string' } }],
      ['pattern', { type: 'string', pattern: '^a+$' }]
    ])('rejects the %s keyword', (keyword, raw) => {
      expect(JsonSchema.fromJson(raw as JsonObject)).toFailWith(/unsupported JSON Schema keyword/i);
    });

    test('rejects a non-object root', () => {
      expect(JsonSchema.fromJson('nope' as unknown as JsonObject)).toFailWith(
        /expected a JSON Schema object/i
      );
    });

    test('rejects a union type array', () => {
      expect(JsonSchema.fromJson({ type: ['string', 'null'] } as unknown as JsonObject)).toFailWith(
        /union 'type' arrays are not supported/i
      );
    });

    test('rejects a missing or unknown type', () => {
      expect(JsonSchema.fromJson({})).toFailWith(/unsupported or missing 'type'/i);
      expect(JsonSchema.fromJson({ type: 'date' })).toFailWith(/unsupported or missing 'type'/i);
    });

    test('rejects non-string and empty enums', () => {
      expect(JsonSchema.fromJson({ enum: [1, 2] })).toFailWith(/only string 'enum' values/i);
      expect(JsonSchema.fromJson({ enum: [] })).toFailWith(/'enum' must be a non-empty array/i);
      expect(JsonSchema.fromJson({ enum: 'a' } as unknown as JsonObject)).toFailWith(
        /'enum' must be a non-empty array/i
      );
    });

    test('rejects an array without items and tuple-form items', () => {
      expect(JsonSchema.fromJson({ type: 'array' })).toFailWith(/'array' requires an 'items' schema/i);
      expect(
        JsonSchema.fromJson({ type: 'array', items: [{ type: 'string' }] } as unknown as JsonObject)
      ).toFailWith(/tuple-form 'items' arrays are not supported/i);
    });

    test('rejects malformed object metadata', () => {
      expect(JsonSchema.fromJson({ type: 'object', properties: 'nope' } as unknown as JsonObject)).toFailWith(
        /'properties' must be an object/i
      );
      expect(JsonSchema.fromJson({ type: 'object', required: 'query' } as unknown as JsonObject)).toFailWith(
        /'required' must be an array of strings/i
      );
      expect(JsonSchema.fromJson({ type: 'object', required: [1] } as unknown as JsonObject)).toFailWith(
        /'required' must be an array of strings/i
      );
      expect(
        JsonSchema.fromJson({
          type: 'object',
          additionalProperties: { type: 'string' }
        } as unknown as JsonObject)
      ).toFailWith(/schema-valued 'additionalProperties' is not supported/i);
    });

    test('rejects a required key with no matching property schema', () => {
      expect(
        JsonSchema.fromJson({
          type: 'object',
          properties: { a: { type: 'string' } },
          required: ['a', 'b']
        })
      ).toFailWith(/#: 'required' key 'b' has no matching entry in 'properties'/i);
      // also when there is no properties block at all
      expect(JsonSchema.fromJson({ type: 'object', required: ['x'] })).toFailWith(
        /'required' key 'x' has no matching entry/i
      );
    });

    test('reports the path of a nested out-of-subset feature', () => {
      const raw: JsonObject = {
        type: 'object',
        properties: { foo: { $ref: '#/x' } },
        required: ['foo']
      };
      expect(JsonSchema.fromJson(raw)).toFailWith(
        /#\/properties\/foo: unsupported JSON Schema keyword '\$ref'/i
      );
    });

    test('reports the path of a bad array element', () => {
      const raw: JsonObject = { type: 'array', items: { type: 'mystery' } };
      expect(JsonSchema.fromJson(raw)).toFailWith(/#\/items: unsupported or missing 'type'/i);
    });
  });
});

/**
 * `fromJson` normalizes a leaf `{ type: 'string', enum: [...] }` the same way the factory does, so
 * the round-trip comparison drops a redundant authored `type` only for the enum case.
 */
function normalizeEnum(raw: JsonObject): JsonObject {
  if ('enum' in raw) {
    return { type: 'string', enum: raw.enum };
  }
  return raw;
}
