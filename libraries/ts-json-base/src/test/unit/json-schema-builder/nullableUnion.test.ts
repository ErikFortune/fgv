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

describe('JsonSchema.fromJson — nullable anyOf / oneOf', () => {
  describe('requester shapes, verbatim', () => {
    test('pydantic Optional[str] = None (inbox)', () => {
      const raw: JsonObject = { anyOf: [{ type: 'string' }, { type: 'null' }], default: null };
      expectHonoured(raw, ['en', null], [3, true, {}, ['en']]);
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual({ type: ['string', 'null'] });
      });
    });

    test('pydantic Optional[str]=None -> anyOf[{string},{null}] + default null (spike)', () => {
      const raw: JsonObject = obj({
        lang: { anyOf: [{ type: 'string' }, { type: 'null' }], default: null, title: 'Lang' }
      });
      expectHonoured(raw, [{ lang: 'en' }, { lang: null }, {}], [{ lang: 3 }, { lang: ['en'] }]);
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual({
          type: 'object',
          properties: { lang: { type: ['string', 'null'] } }
        });
      });
    });
  });

  describe('normalization', () => {
    test.each(['anyOf', 'oneOf'])('%s accepts the null branch in either position', (keyword) => {
      expectHonoured({ [keyword]: [{ type: 'null' }, { type: 'integer' }] }, [1, null], [1.5, '1']);
      expectHonoured({ [keyword]: [{ type: 'integer' }, { type: 'null' }] }, [1, null], [1.5, '1']);
    });

    test.each<[string, JsonObject, JsonValue[], JsonValue[], JsonObject]>([
      ['number', { type: 'number' }, [1.5, null], ['1'], { type: ['number', 'null'] }],
      ['boolean', { type: 'boolean' }, [false, null], [0], { type: ['boolean', 'null'] }],
      [
        'enum',
        { enum: ['a', 'b'] },
        ['a', null],
        ['c'],
        { type: ['string', 'null'], enum: ['a', 'b', null] }
      ],
      [
        'array',
        { type: 'array', items: { type: 'string' } },
        [['x'], null],
        [[1], 'x'],
        { type: ['array', 'null'], items: { type: 'string' } }
      ],
      [
        'closed object',
        {
          type: 'object',
          properties: { a: { type: 'string' } },
          required: ['a'],
          additionalProperties: false
        },
        [{ a: 'x' }, null],
        [{ a: 'x', b: 1 }, {}],
        {
          type: ['object', 'null'],
          properties: { a: { type: 'string' } },
          required: ['a'],
          additionalProperties: false
        }
      ]
    ])('a nullable %s normalizes to the type-union form', (__label, branch, accepted, rejected, wire) => {
      for (const keyword of ['anyOf', 'oneOf']) {
        const raw: JsonObject = { [keyword]: [branch, { type: 'null' }] };
        expectHonoured(raw, accepted, rejected);
        expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
          expect(schema.toJson()).toEqual(wire);
        });
      }
    });

    test('nested unions normalize at every depth', () => {
      const raw: JsonObject = obj(
        {
          tags: {
            anyOf: [
              { type: 'array', items: { anyOf: [{ type: 'string' }, { type: 'null' }] } },
              { type: 'null' }
            ]
          }
        },
        ['tags']
      );
      expectHonoured(raw, [{ tags: null }, { tags: ['a', null] }], [{}, { tags: [1] }]);
    });

    test('anyOf over a schema that already admits null stays nullable', () => {
      expectHonoured({ anyOf: [{ type: ['string', 'null'] }, { type: 'null' }] }, ['a', null], [1]);
      expectHonoured(
        { anyOf: [{ type: ['string', 'null'], enum: ['a', null] }, { type: 'null' }] },
        ['a', null],
        ['b']
      );
    });

    test('the wrapper description wins; otherwise the branch description is kept', () => {
      expect(
        JsonSchema.fromJson({
          anyOf: [{ type: 'string', description: 'inner' }, { type: 'null' }],
          description: 'outer'
        })
      ).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual({ type: ['string', 'null'], description: 'outer' });
      });
      expect(
        JsonSchema.fromJson({
          anyOf: [
            { type: 'string', description: 'inner' },
            { type: 'null', title: 'None' }
          ]
        })
      ).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual({ type: ['string', 'null'], description: 'inner' });
      });
    });
  });

  describe('refusals name the keyword and the path', () => {
    test.each<[string, JsonObject, RegExp]>([
      [
        'a general union (zod z.union([string, number]))',
        obj({ v: { anyOf: [{ type: 'string' }, { type: 'number' }] } }),
        /^#\/properties\/v: unsupported JSON Schema keyword 'anyOf' \(supported only as exactly one schema plus/
      ],
      [
        'a general oneOf',
        obj({ v: { oneOf: [{ type: 'string' }, { type: 'number' }] } }),
        /^#\/properties\/v: unsupported JSON Schema keyword 'oneOf' \(supported only/
      ],
      [
        'three members',
        { anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }] },
        /^#: unsupported JSON Schema keyword 'anyOf' \(supported only/
      ],
      ['one member', { anyOf: [{ type: 'string' }] }, /'anyOf' \(supported only/],
      ['two null branches', { anyOf: [{ type: 'null' }, { type: 'null' }] }, /'anyOf' \(supported only/],
      ['a non-array', { anyOf: { type: 'string' } } as unknown as JsonObject, /'anyOf' \(supported only/],
      [
        'a null branch carrying a validation keyword',
        { anyOf: [{ type: 'string' }, { type: 'null', minimum: 1 }] },
        /'anyOf' \(supported only/
      ],
      [
        'a validation keyword beside the union',
        { anyOf: [{ type: 'string' }, { type: 'null' }], type: 'string' },
        /^#: unsupported JSON Schema keyword 'anyOf' alongside 'type'/
      ],
      [
        'anyOf and oneOf together',
        { anyOf: [{ type: 'string' }, { type: 'null' }], oneOf: [{ type: 'string' }, { type: 'null' }] },
        /^#: unsupported JSON Schema keywords 'anyOf' and 'oneOf' on the same node/
      ],
      [
        'oneOf over a schema that already admits null',
        { oneOf: [{ type: ['string', 'null'] }, { type: 'null' }] },
        /^#: unsupported JSON Schema keyword 'oneOf': #\/oneOf\/0 also admits null/
      ],
      [
        'an out-of-subset branch',
        obj({ v: { anyOf: [{ type: 'null' }, { type: 'date' }] } }),
        /^#\/properties\/v\/anyOf\/1: unsupported or missing 'type'/
      ],
      [
        'a non-string wrapper description',
        { anyOf: [{ type: 'string' }, { type: 'null' }], description: 7 },
        /^#: .*description/i
      ]
    ])('refuses %s', (__label, raw, message) => {
      expect(JsonSchema.fromJson(raw)).toFailWith(message);
    });
  });
});
