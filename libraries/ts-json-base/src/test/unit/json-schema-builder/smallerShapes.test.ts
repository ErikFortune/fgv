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
import { JsonObject, JsonValue } from '../../../packlets/json';
import { JsonSchema } from '../../..';

const obj = (properties: JsonObject, required?: string[]): JsonObject => ({
  type: 'object',
  properties,
  ...(required ? { required } : {})
});

/** Parses `raw`, then checks the accepted and rejected values and the toJson → fromJson round trip. */
function expectHonoured(raw: JsonObject, accepted: JsonValue[], rejected: JsonValue[]): void {
  expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
    for (const value of accepted) {
      expect(schema.validate(value)).toSucceedWith(value);
    }
    for (const value of rejected) {
      expect(schema.validate(value)).toFail();
    }
    expect(JsonSchema.fromJson(schema.toJson())).toSucceedAndSatisfy((reparsed) => {
      expect(reparsed.toJson()).toEqual(schema.toJson());
      for (const value of accepted) {
        expect(reparsed.validate(value)).toSucceedWith(value);
      }
      for (const value of rejected) {
        expect(reparsed.validate(value)).toFail();
      }
    });
  });
}

describe('JsonSchema — smaller MCP shapes (#683)', () => {
  describe('record: schema-valued additionalProperties (supported)', () => {
    test('zod: z.record(z.string()) -> additionalProperties schema (spike)', () => {
      const raw: JsonObject = obj({ headers: { type: 'object', additionalProperties: { type: 'string' } } });
      expectHonoured(
        raw,
        [{ headers: { accept: 'json', 'x-id': '7' } }, { headers: {} }, {}],
        [{ headers: { accept: 1 } }, { headers: 'accept' }, { headers: ['json'] }, { headers: null }]
      );
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual({
          type: 'object',
          properties: {
            headers: { type: 'object', properties: {}, additionalProperties: { type: 'string' } }
          }
        });
      });
    });

    test('values may be any supported schema, including a nullable union, a $ref and another record', () => {
      expectHonoured(
        { type: 'object', additionalProperties: { anyOf: [{ type: 'integer' }, { type: 'null' }] } },
        [{ a: 1, b: null }],
        [{ a: 1.5 }]
      );
      expectHonoured(
        {
          $defs: { P: obj({ x: { type: 'number' } }, ['x']) },
          type: 'object',
          additionalProperties: { $ref: '#/$defs/P' }
        },
        [{ a: { x: 1 } }],
        [{ a: {} }]
      );
      expectHonoured(
        {
          type: 'object',
          additionalProperties: { type: 'object', additionalProperties: { type: 'boolean' } }
        },
        [{ a: { b: true } }],
        [{ a: { b: 'true' } }]
      );
    });

    test('a nullable record, in either spelling, accepts null', () => {
      expectHonoured(
        { type: ['object', 'null'], additionalProperties: { type: 'string' } },
        [null, { a: 'x' }],
        [{ a: 1 }]
      );
      expectHonoured(
        { anyOf: [{ type: 'object', additionalProperties: { type: 'string' } }, { type: 'null' }] },
        [null, { a: 'x' }],
        [{ a: 1 }]
      );
    });

    test('an empty additionalProperties schema means the same as true', () => {
      const raw: JsonObject = obj({ q: { type: 'string' } });
      expect(JsonSchema.fromJson({ ...raw, additionalProperties: {} })).toSucceedAndSatisfy((schema) => {
        expect(schema.validate({ q: 'a', extra: [1] })).toSucceedWith({ q: 'a', extra: [1] });
        expect(schema.toJson()).toEqual(
          JsonSchema.fromJson({ ...raw, additionalProperties: true })
            .orThrow()
            .toJson()
        );
      });
    });

    test('an annotation-only additionalProperties schema also means true', () => {
      expect(
        JsonSchema.fromJson({
          ...obj({ q: { type: 'string' } }),
          additionalProperties: { description: 'any' }
        })
      ).toSucceedAndSatisfy((schema) => {
        expect(schema.validate({ q: 'a', extra: 1 })).toSucceedWith({ q: 'a', extra: 1 });
      });
    });

    test.each<[string, JsonValue, RegExp]>([
      [
        'patternProperties',
        { '^n_': { type: 'number' } },
        /^#\/properties\/m: unsupported JSON Schema keyword 'patternProperties' beside a schema-valued 'additionalProperties'/
      ],
      [
        'propertyNames',
        { enum: ['a', 'b'] },
        /^#\/properties\/m: unsupported JSON Schema keyword 'propertyNames' beside a schema-valued 'additionalProperties'/
      ],
      [
        'unevaluatedProperties',
        false,
        /^#\/properties\/m: unsupported JSON Schema keyword 'unevaluatedProperties' beside a schema-valued 'additionalProperties'/
      ],
      [
        'dependentRequired',
        { a: ['b'] },
        /^#\/properties\/m: unsupported JSON Schema keyword 'dependentRequired' beside a schema-valued 'additionalProperties'/
      ],
      [
        'dependentSchemas',
        { a: { required: ['b'] } },
        /^#\/properties\/m: unsupported JSON Schema keyword 'dependentSchemas' beside a schema-valued 'additionalProperties'/
      ],
      [
        'dependencies',
        { a: ['b'] },
        /^#\/properties\/m: unsupported JSON Schema keyword 'dependencies' beside a schema-valued 'additionalProperties'/
      ],
      [
        'minProperties',
        1,
        /^#\/properties\/m: unsupported JSON Schema keyword 'minProperties' beside a schema-valued 'additionalProperties'/
      ],
      [
        'maxProperties',
        3,
        /^#\/properties\/m: unsupported JSON Schema keyword 'maxProperties' beside a schema-valued 'additionalProperties'/
      ]
    ])('refuses %s beside a value schema, which a record cannot honour', (keyword, value, message) => {
      const raw: JsonObject = obj({
        m: { type: 'object', additionalProperties: { type: 'string' }, [keyword]: value }
      });
      expect(JsonSchema.fromJson(raw)).toFailWith(message);
    });

    test('a plain record, with none of those keywords, still adapts', () => {
      expectHonoured(
        obj({ m: { type: 'object', additionalProperties: { type: 'string' } } }, ['m']),
        [{ m: { a: 'x', b: 'y' } }, { m: {} }],
        [{ m: { a: 1 } }]
      );
    });

    test('refuses declared properties beside a value schema, naming the path', () => {
      expect(
        JsonSchema.fromJson(
          obj({ m: { ...obj({ id: { type: 'string' } }), additionalProperties: { type: 'string' } } })
        )
      ).toFailWith(
        /^#\/properties\/m: schema-valued 'additionalProperties' alongside declared 'properties' is not supported/
      );
    });

    test('reports an out-of-subset value schema under its own path', () => {
      expect(JsonSchema.fromJson({ type: 'object', additionalProperties: { type: 'date' } })).toFailWith(
        /^#\/additionalProperties: unsupported or missing 'type'/
      );
    });

    describe('the record factory', () => {
      const scores = JsonSchema.record(JsonSchema.number({ strict: false }), { description: 'by name' });

      test('derives Record<string, Static<values>>', () => {
        const typed: Record<string, number> = scores.validate({ a: 1 }).orThrow();
        expect(typed).toEqual({ a: 1 });
        const nullable = JsonSchema.record(JsonSchema.string(), { nullable: true });
        const maybe: Record<string, string> | null = nullable.validate(null).orThrow();
        expect(maybe).toBeNull();
      });

      test('emits the value schema and converts every value through it', () => {
        expect(scores.toJson()).toEqual({
          type: 'object',
          properties: {},
          additionalProperties: { type: 'number' },
          description: 'by name'
        });
        expect(scores.convert({ a: '2', b: 3 })).toSucceedWith({ a: 2, b: 3 });
      });

      test('reports every bad value by key', () => {
        expect(scores.validate({ a: 'x', b: 1, c: true })).toFailWith(/a: [^]*c: /);
      });

      test('refuses a non-object, and null unless nullable', () => {
        for (const value of [null, 1, 'a', [1]]) {
          expect(scores.validate(value)).toFail();
        }
      });

      test('drops an own __proto__ key like an open object does', () => {
        const input = JSON.parse('{"__proto__": 1, "a": 2}') as JsonObject;
        expect(scores.validate(input)).toSucceedAndSatisfy((v) => {
          expect(Object.keys(v)).toEqual(['a']);
          expect(Object.getPrototypeOf(v)).toBe(Object.prototype);
        });
      });
    });
  });

  describe('deferred shapes stay refused, with the keyword and path named', () => {
    test.each<[string, JsonObject, RegExp]>([
      [
        'zod: number enum (spike)',
        obj({ lvl: { type: 'number', enum: [1, 2, 3] } }),
        /^#\/properties\/lvl: numeric 'enum' values are not supported/
      ],
      [
        'pydantic Literal[1, 2]',
        obj({ n: { enum: [1, 2], title: 'N', type: 'integer' } }),
        /^#\/properties\/n: numeric 'enum' values are not supported/
      ],
      ['a mixed enum', obj({ m: { enum: ['a', 1] } }), /^#\/properties\/m: numeric 'enum' values/],
      [
        'zod: z.string().regex -> pattern (spike)',
        obj({ id: { type: 'string', pattern: '^[a-z]+$' } }),
        /^#\/properties\/id: unsupported JSON Schema keyword 'pattern'/
      ],
      [
        'pydantic: Any -> {} (no type) (spike)',
        obj({ anything: {} }),
        /^#\/properties\/anything: a schema with no 'type' \(matching any value\) is not supported/
      ],
      [
        'pydantic Any with a title',
        obj({ anything: { title: 'Anything' } }),
        /^#\/properties\/anything: a schema with no 'type'/
      ]
    ])('refuses %s', (__label, raw, message) => {
      expect(JsonSchema.fromJson(raw)).toFailWith(message);
    });
  });
});
