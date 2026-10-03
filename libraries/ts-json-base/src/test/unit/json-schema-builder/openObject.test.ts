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
import { JsonObject, JsonSchema, JsonValue } from '../../..';

/**
 * Whether a value satisfies the `additionalProperties` claim of the wire schema it came
 * from: every key the value carries is either declared, or the wire schema says undeclared
 * keys are allowed. Reads only the emitted JSON, never the node, so it checks the wire.
 */
function wireAdmitsKeys(wire: JsonObject, value: JsonValue): boolean {
  const declared = Object.keys((wire.properties ?? {}) as JsonObject);
  const undeclared = Object.keys(value as JsonObject).filter((k) => !declared.includes(k));
  return undeclared.length === 0 || wire.additionalProperties !== false;
}

describe('open objects', () => {
  describe('the requester reproduction (fromJson)', () => {
    test('declared properties plus additionalProperties: true keeps undeclared keys', () => {
      const raw: JsonObject = {
        type: 'object',
        properties: { q: { type: 'string' } },
        additionalProperties: true
      };
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.convert({ q: 'a', extra: 1 })).toSucceedWith({ q: 'a', extra: 1 });
      });
    });

    test('a bare { type: object } keeps every key', () => {
      expect(JsonSchema.fromJson({ type: 'object' })).toSucceedAndSatisfy((schema) => {
        expect(schema.convert({ q: 'a', x: 1 })).toSucceedWith({ q: 'a', x: 1 });
      });
    });

    test('absent additionalProperties with declared properties keeps undeclared keys', () => {
      const raw: JsonObject = { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] };
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.convert({ q: 'a', z: [1, { y: null }] })).toSucceedWith({
          q: 'a',
          z: [1, { y: null }]
        });
      });
    });

    test('an open object nested inside a closed one keeps its keys', () => {
      const raw: JsonObject = {
        type: 'object',
        properties: { args: { type: 'object' } },
        required: ['args'],
        additionalProperties: false
      };
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.convert({ args: { a: 1, b: 'two' } })).toSucceedWith({ args: { a: 1, b: 'two' } });
        expect(schema.convert({ args: {}, stray: 1 })).toFailWith(/stray/i);
      });
    });

    test('a nullable open object accepts null and keeps keys otherwise', () => {
      expect(JsonSchema.fromJson({ type: ['object', 'null'] })).toSucceedAndSatisfy((schema) => {
        expect(schema.convert(null)).toSucceedWith(null);
        expect(schema.convert({ k: 'v' })).toSucceedWith({ k: 'v' });
      });
    });

    test('schema-valued additionalProperties is still refused', () => {
      expect(JsonSchema.fromJson({ type: 'object', additionalProperties: { type: 'string' } })).toFailWith(
        /schema-valued 'additionalProperties' is not supported/i
      );
    });
  });

  describe('the factory', () => {
    const open = JsonSchema.object(
      { query: JsonSchema.string(), limit: JsonSchema.optional(JsonSchema.integer({ strict: false })) },
      { additionalProperties: true }
    );

    test('declared fields still convert; undeclared keys are carried through', () => {
      expect(open.convert({ query: 'a', limit: '3', extra: { deep: [true] } })).toSucceedWith({
        query: 'a',
        limit: 3,
        extra: { deep: [true] }
      });
    });

    test('validate() and convert() agree', () => {
      const value = { query: 'a', extra: 99 };
      expect(open.validate(value)).toSucceedWith(value);
      expect(open.convert(value)).toSucceedWith(value);
    });

    test('a declared field that fails still fails the object', () => {
      expect(open.convert({ query: 7, extra: 1 })).toFailWith(/query/i);
      expect(open.convert({ extra: 1 })).toFailWith(/query/i);
    });

    test('an undeclared key must carry a JSON value', () => {
      expect(open.convert({ query: 'a', bad: () => 1 })).toFailWith(/bad/i);
      expect(open.convert({ query: 'a', bad: undefined })).toFailWith(/bad/i);
    });

    test('a non-object is refused rather than converted to {}', () => {
      const bare = JsonSchema.object({}, { additionalProperties: true });
      for (const input of [42, 'hi', [1], null, true]) {
        expect(bare.convert(input)).toFailWith(/object/i);
      }
    });

    test('a __proto__ key arrives as data, not as a prototype', () => {
      const input = JSON.parse('{"query":"a","__proto__":{"polluted":true}}') as unknown;
      expect(open.convert(input)).toSucceedAndSatisfy((value) => {
        expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
        expect(Object.prototype.hasOwnProperty.call(value, '__proto__')).toBe(true);
        expect((value as unknown as { polluted?: boolean }).polluted).toBeUndefined();
      });
    });

    test('the result is a copy, not the input', () => {
      const input = { query: 'a', extra: { n: 1 } };
      expect(open.convert(input)).toSucceedAndSatisfy((value) => {
        expect(value).not.toBe(input);
      });
    });
  });

  describe('toJson() and convert() agree', () => {
    const shapes: ReadonlyArray<[string, JsonSchema.ISchemaValidator<unknown>]> = [
      ['closed', JsonSchema.object({ q: JsonSchema.string() })],
      ['open with properties', JsonSchema.object({ q: JsonSchema.string() }, { additionalProperties: true })],
      ['open without properties', JsonSchema.object({}, { additionalProperties: true })],
      [
        'nullable open',
        JsonSchema.object({ q: JsonSchema.string() }, { additionalProperties: true, nullable: true })
      ],
      [
        'fromJson absent',
        JsonSchema.fromJson({ type: 'object', properties: { q: { type: 'string' } } }).orThrow()
      ],
      ['fromJson bare', JsonSchema.fromJson({ type: 'object' }).orThrow()]
    ];
    const input = { q: 'a', extra: 1 };

    test.each(shapes)('%s: the wire states additionalProperties explicitly', (__name, schema) => {
      expect(typeof schema.toJson().additionalProperties).toBe('boolean');
    });

    test.each(shapes)('%s: a value convert() returns is one the wire admits', (__name, schema) => {
      const wire = schema.toJson();
      const result = schema.convert(input);
      if (wire.additionalProperties === false) {
        // A closed wire must not be paired with a converter that accepts what it forbids.
        expect(result).toFailWith(/extra/i);
      } else {
        // An open wire must not be paired with a converter that silently drops what it admits.
        expect(result).toSucceedWith(input);
      }
      result.onSuccess((value) => {
        expect(wireAdmitsKeys(wire, value as JsonValue)).toBe(true);
        return result;
      });
    });
  });
});
