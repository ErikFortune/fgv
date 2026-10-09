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
import { JsonObject, JsonSchema, isJsonObject } from '../../..';

/**
 * Whether a value satisfies the `additionalProperties` claim of the wire schema it came
 * from: every key the value carries is either declared, or the wire schema says undeclared
 * keys are allowed. Reads only the emitted JSON, never the node, so it checks the wire.
 */
function wireAdmitsKeys(wire: JsonObject, value: unknown): boolean {
  const declared = isJsonObject(wire.properties) ? Object.keys(wire.properties) : [];
  const undeclared = isJsonObject(value) ? Object.keys(value).filter((k) => !declared.includes(k)) : [];
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
      expect(open.convert({ query: 'a', extra: { f: () => 1 } })).toFailWith(/extra/i);
    });

    test('every bad undeclared key is reported, not just the first', () => {
      expect(open.convert({ query: 'a', first: () => 1, second: undefined })).toFailWith(
        /first[\s\S]*second/i
      );
    });

    test('a bad declared field does not hide bad undeclared values: all three are reported', () => {
      expect(open.convert({ query: 7, first: () => 1, second: undefined })).toFailWith(
        /^(?=[\s\S]*query)(?=[\s\S]*first)(?=[\s\S]*second)/i
      );
    });

    test('a declared optional key is converted by its schema, not passed through', () => {
      expect(open.convert({ query: 'a', limit: '4' })).toSucceedWith({ query: 'a', limit: 4 });
      expect(open.convert({ query: 'a', limit: 'four' })).toFailWith(/limit/i);
    });

    test('a closed object declared inside an open one stays closed', () => {
      const outer = JsonSchema.object(
        { inner: JsonSchema.object({ id: JsonSchema.string() }) },
        { additionalProperties: true }
      );
      expect(outer.convert({ inner: { id: 'x' }, extra: 1 })).toSucceedWith({ inner: { id: 'x' }, extra: 1 });
      expect(outer.convert({ inner: { id: 'x', stray: 1 } })).toFailWith(/stray/i);
    });

    test.each([42, 'hi', [1], null, true])(
      'a non-object (%p) is refused rather than converted to {}',
      (input) => {
        const bare = JsonSchema.object({}, { additionalProperties: true });
        expect(bare.convert(input)).toFailWith(/expected a JSON object/i);
      }
    );

    test('the refusal names what it got, including null', () => {
      const bare = JsonSchema.object({}, { additionalProperties: true });
      expect(bare.convert(null)).toFailWith(/got null/i);
      expect(bare.convert([1])).toFailWith(/got array/i);
      expect(bare.convert(42)).toFailWith(/got number/i);
    });

    test('a top-level __proto__ key is dropped, never made the prototype', () => {
      const input = JSON.parse('{"query":"a","__proto__":{"isAdmin":true},"extra":1}') as unknown;
      expect(open.convert(input)).toSucceedAndSatisfy((value) => {
        expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
        expect(Object.prototype.hasOwnProperty.call(value, '__proto__')).toBe(false);
        expect('isAdmin' in value).toBe(false);
        expect(value).toEqual({ query: 'a', extra: 1 });
      });
    });

    test('a nested __proto__ key is dropped, never made the prototype', () => {
      const bare = JsonSchema.fromJson({ type: 'object', properties: { q: { type: 'string' } } }).orThrow();
      const input = JSON.parse('{"q":"a","extra":{"__proto__":{"isAdmin":true}}}') as unknown;
      expect(bare.convert(input)).toSucceedAndSatisfy((value) => {
        const extra = (value as JsonObject).extra as JsonObject;
        expect(Object.getPrototypeOf(extra)).toBe(Object.prototype);
        expect(Object.prototype.hasOwnProperty.call(extra, '__proto__')).toBe(false);
        expect('isAdmin' in extra).toBe(false);
        expect(value).toEqual({ q: 'a', extra: {} });
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
    // `open` is what the wire must say; the converter is then held to the same answer.
    const shapes: ReadonlyArray<[string, JsonSchema.ISchemaValidator<unknown>, boolean]> = [
      ['closed', JsonSchema.object({ q: JsonSchema.string() }), false],
      [
        'open with properties',
        JsonSchema.object({ q: JsonSchema.string() }, { additionalProperties: true }),
        true
      ],
      ['open without properties', JsonSchema.object({}, { additionalProperties: true }), true],
      [
        'nullable open',
        JsonSchema.object({ q: JsonSchema.string() }, { additionalProperties: true, nullable: true }),
        true
      ],
      [
        'fromJson closed',
        JsonSchema.fromJson({
          type: 'object',
          properties: { q: { type: 'string' } },
          additionalProperties: false
        }).orThrow(),
        false
      ],
      [
        'fromJson absent',
        JsonSchema.fromJson({ type: 'object', properties: { q: { type: 'string' } } }).orThrow(),
        true
      ],
      ['fromJson bare', JsonSchema.fromJson({ type: 'object' }).orThrow(), true]
    ];
    const input = { q: 'a', extra: 1 };
    const openShapes = shapes.filter(([, , open]) => open);
    const closedShapes = shapes.filter(([, , open]) => !open);

    test.each(shapes)('%s: the wire reads as open exactly when the shape is open', (__name, schema, open) => {
      // Open is JSON Schema's default, spelled by omitting the keyword; closed is an explicit `false`.
      expect(schema.toJson().additionalProperties).toBe(open ? undefined : false);
    });

    test.each(openShapes)(
      '%s: an open wire is paired with a converter that keeps what it admits',
      (__name, schema) => {
        expect(schema.convert(input)).toSucceedAndSatisfy((value) => {
          expect(value).toEqual(input);
          expect(wireAdmitsKeys(schema.toJson(), value)).toBe(true);
        });
      }
    );

    test.each(closedShapes)(
      '%s: a closed wire is paired with a converter that refuses what it forbids',
      (__name, schema) => {
        expect(wireAdmitsKeys(schema.toJson(), input)).toBe(false);
        expect(schema.convert(input)).toFailWith(/extra/i);
      }
    );
  });
});
