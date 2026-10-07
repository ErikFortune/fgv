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
    const wire = JSON.stringify(schema.toJson());
    expect(wire).not.toMatch(/\$ref|\$defs|definitions/);
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

/** A chain of `n` definitions, each referring to the next, ending in a string. */
function chain(n: number): JsonObject {
  const defs: JsonObject = {};
  for (let i = 0; i < n; i++) {
    defs[`D${i}`] = { $ref: `#/$defs/D${i + 1}` };
  }
  defs[`D${n}`] = { type: 'string' };
  return { $defs: defs, ...obj({ v: { $ref: '#/$defs/D0' } }, ['v']) };
}

describe('JsonSchema.fromJson — local $ref / $defs', () => {
  describe('requester shapes, verbatim', () => {
    test('pydantic: nested model -> $defs + $ref (spike)', () => {
      const raw: JsonObject = {
        $defs: { Loc: obj({ lat: { type: 'number' } }, ['lat']) },
        ...obj({ loc: { $ref: '#/$defs/Loc' } }, ['loc'])
      };
      expectHonoured(raw, [{ loc: { lat: 1.5 } }], [{}, { loc: {} }, { loc: { lat: 'x' } }, { loc: 'x' }]);
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual({
          type: 'object',
          properties: { loc: { type: 'object', properties: { lat: { type: 'number' } }, required: ['lat'] } },
          required: ['loc']
        });
      });
    });

    test('pydantic v2: a model with a described nested model and an optional one', () => {
      const raw: JsonObject = {
        $defs: {
          Address: {
            properties: {
              street: { title: 'Street', type: 'string' },
              city: { title: 'City', type: 'string' }
            },
            required: ['street', 'city'],
            title: 'Address',
            type: 'object'
          }
        },
        properties: {
          name: { title: 'Name', type: 'string' },
          home: { $ref: '#/$defs/Address', description: 'Where they live' },
          work: { anyOf: [{ $ref: '#/$defs/Address' }, { type: 'null' }], default: null }
        },
        required: ['name', 'home'],
        title: 'Person',
        type: 'object'
      };
      const address = { street: 'Main', city: 'Town' };
      expectHonoured(
        raw,
        [
          { name: 'A', home: address },
          { name: 'A', home: address, work: null },
          { name: 'A', home: address, work: address }
        ],
        [
          { name: 'A' },
          { name: 'A', home: { street: 'Main' } },
          { name: 'A', home: address, work: { city: 1 } }
        ]
      );
      expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
        const properties = (schema.toJson().properties ?? {}) as JsonObject;
        expect(properties.home).toEqual(
          expect.objectContaining({ type: 'object', description: 'Where they live' })
        );
        expect(properties.work).toEqual(expect.objectContaining({ type: ['object', 'null'] }));
      });
    });
  });

  describe('resolution', () => {
    test('draft-07 definitions resolve like $defs', () => {
      expectHonoured(
        { definitions: { Id: { type: 'integer' } }, ...obj({ id: { $ref: '#/definitions/Id' } }, ['id']) },
        [{ id: 3 }],
        [{ id: 3.5 }, { id: '3' }]
      );
    });

    test('any local JSON Pointer resolves, including into properties and arrays', () => {
      expectHonoured(
        obj({ a: { type: 'array', items: { type: 'boolean' } }, b: { $ref: '#/properties/a/items' } }, [
          'a',
          'b'
        ]),
        [{ a: [true], b: false }],
        [{ a: [true], b: 'false' }]
      );
      expectHonoured(
        {
          $defs: { Maybe: { anyOf: [{ type: 'integer' }, { type: 'null' }] } },
          ...obj({ n: { $ref: '#/$defs/Maybe/anyOf/0' } }, ['n'])
        },
        [{ n: 1 }],
        [{ n: null }]
      );
    });

    test('escaped and percent-encoded pointer tokens decode', () => {
      expectHonoured(
        {
          $defs: { 'a/b': { type: 'string' }, 'c~d': { type: 'integer' }, 'e f': { type: 'boolean' } },
          ...obj({ s: { $ref: '#/$defs/a~1b' }, i: { $ref: '#/$defs/c~0d' }, b: { $ref: '#/$defs/e%20f' } }, [
            's',
            'i',
            'b'
          ])
        },
        [{ s: 'x', i: 1, b: true }],
        [
          { s: 1, i: 1, b: true },
          { s: 'x', i: 'x', b: true },
          { s: 'x', i: 1, b: 'x' }
        ]
      );
    });

    test('a percent-encoded slash is decoded before splitting (RFC 6901 § 6)', () => {
      // `%2F` becomes a separator: the pointer is /$defs/a/b, so a nested `a.b` resolves...
      expectHonoured({ $defs: { a: { b: { type: 'integer' } } }, $ref: '#/$defs/a%2Fb' }, [1], ['1']);
      // ...and a literal key 'a/b' is not what `%2F` names (that key is spelled `a~1b`).
      expect(
        JsonSchema.fromJson({ $defs: { 'a/b': { type: 'integer' } }, $ref: '#/$defs/a%2Fb' })
      ).toFailWith(/'#\/\$defs\/a%2Fb' does not resolve: no 'a'/);
    });

    test('~1 is unescaped before ~0, so ~01 names the literal key ~1', () => {
      expectHonoured(
        { $defs: { '~1': { type: 'boolean' }, '/': { type: 'string' } }, $ref: '#/$defs/~01' },
        [true],
        ['x']
      );
    });

    test('a root $ref, a chain of references and a definition used twice all inline', () => {
      expectHonoured({ $defs: { S: { type: 'string' } }, $ref: '#/$defs/S' }, ['x'], [1]);
      expectHonoured(chain(5), [{ v: 'x' }], [{ v: 1 }]);
      expectHonoured(
        {
          $defs: { P: obj({ x: { type: 'number' } }, ['x']) },
          ...obj({ from: { $ref: '#/$defs/P' }, to: { $ref: '#/$defs/P' } }, ['from', 'to'])
        },
        [{ from: { x: 1 }, to: { x: 2 } }],
        [{ from: { x: 1 }, to: {} }]
      );
    });

    test('a $ref sibling description replaces the target description; other annotations are ignored', () => {
      expect(
        JsonSchema.fromJson({
          $defs: { S: { type: 'string', description: 'inner' } },
          $ref: '#/$defs/S',
          description: 'outer',
          title: 'T',
          default: 'd'
        })
      ).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual({ type: 'string', description: 'outer' });
      });
      expect(
        JsonSchema.fromJson({ $defs: { S: { type: 'string', description: 'inner' } }, $ref: '#/$defs/S' })
      ).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual({ type: 'string', description: 'inner' });
      });
    });

    test('a root $id may sit beside a root $ref', () => {
      expectHonoured({ $id: 'urn:s', $defs: { S: { type: 'string' } }, $ref: '#/$defs/S' }, ['x'], [1]);
    });

    test('a root $id does not prevent resolution', () => {
      expectHonoured(
        {
          $id: 'https://example.com/s',
          $defs: { S: { type: 'string' } },
          ...obj({ s: { $ref: '#/$defs/S' } })
        },
        [{ s: 'x' }, {}],
        [{ s: 1 }]
      );
    });
  });

  describe('refusals name the keyword and the path', () => {
    const recursive: JsonObject = {
      $defs: {
        Node: {
          properties: { children: { items: { $ref: '#/$defs/Node' }, title: 'Children', type: 'array' } },
          title: 'Node',
          type: 'object'
        }
      },
      $ref: '#/$defs/Node'
    };
    const mutual: JsonObject = {
      $defs: { A: obj({ b: { $ref: '#/$defs/B' } }), B: obj({ a: { $ref: '#/$defs/A' } }) },
      ...obj({ a: { $ref: '#/$defs/A' } })
    };
    const doubling: JsonObject = { $defs: {} };
    const defs = doubling.$defs as JsonObject;
    for (let i = 0; i < 12; i++) {
      defs[`L${i}`] = obj({ a: { $ref: `#/$defs/L${i + 1}` }, b: { $ref: `#/$defs/L${i + 1}` } });
    }
    defs.L12 = { type: 'string' };
    doubling.$ref = '#/$defs/L0';

    const wideProps: JsonObject = {};
    for (let i = 0; i < 200; i++) {
      wideProps[`p${i}`] = { type: 'string' };
    }
    const manyRefs: JsonObject = {};
    for (let i = 0; i < 600; i++) {
      manyRefs[`r${i}`] = { $ref: '#/$defs/Wide' };
    }
    const wide: JsonObject = { $defs: { Wide: obj(wideProps) }, ...obj(manyRefs) };

    test.each<[string, JsonObject, RegExp]>([
      [
        'a remote reference',
        obj({ x: { $ref: 'https://example.com/schema.json#/$defs/A' } }),
        /^#\/properties\/x: unsupported JSON Schema keyword '\$ref': remote reference/
      ],
      [
        'a very long reference, echoed truncated',
        obj({ x: { $ref: `https://example.com/${'a'.repeat(300)}` } }),
        /remote reference 'https:\/\/example\.com\/a{100}…' \(only local/
      ],
      ['a relative remote reference', obj({ x: { $ref: 'other.json' } }), /remote reference 'other\.json'/],
      ['an anchor', obj({ x: { $ref: '#foo' } }), /'#foo': only JSON Pointer fragments/],
      [
        'a malformed escape',
        obj({ x: { $ref: '#/$defs/%E0%A4%A' } }),
        /'\$ref': '#\/\$defs\/%E0%A4%A': malformed/
      ],
      [
        'an unresolvable reference',
        obj({ x: { $ref: '#/$defs/Foo' } }),
        /^#\/properties\/x: unsupported JSON Schema keyword '\$ref': '#\/\$defs\/Foo' does not resolve: no '\$defs'/
      ],
      [
        'a bad array index',
        { $defs: { M: { anyOf: [{ type: 'string' }, { type: 'null' }] } }, $ref: '#/$defs/M/anyOf/01' },
        /does not resolve: no '01'/
      ],
      [
        'a pointer naming an inherited property',
        { $defs: {}, ...obj({ x: { $ref: '#/$defs/constructor' } }) },
        /'#\/\$defs\/constructor' does not resolve: no 'constructor'/
      ],
      [
        'a pointer passing through a subschema with its own $id',
        {
          $defs: {
            B: { type: 'string' },
            A: {
              $id: 'urn:a',
              $defs: { B: { type: 'number' } },
              ...obj({ x: obj({ y: { $ref: '#/$defs/B' } }) })
            }
          },
          $ref: '#/$defs/A/properties/x'
        },
        /'#\/\$defs\/A\/properties\/x' passes through a subschema with its own '\$id'/
      ],
      ['a wide definition inlined many times', wide, /exceeds the limit of 100000 nodes/],
      [
        "an invalid '~' escape",
        { $defs: { 'a~2b': { type: 'string' } }, $ref: '#/$defs/a~2b' },
        /'#\/\$defs\/a~2b': malformed reference: invalid '~' escape/
      ],
      [
        "a trailing '~'",
        { $defs: { 'a~': { type: 'string' } }, $ref: '#/$defs/a~' },
        /'#\/\$defs\/a~': malformed reference: invalid '~' escape/
      ],
      ['a non-string reference', obj({ x: { $ref: 7 } }), /'\$ref': the reference must be a string/],
      [
        'a validation keyword beside $ref',
        { $defs: { S: { type: 'string' } }, $ref: '#/$defs/S', type: 'string' },
        /^#: unsupported JSON Schema keyword '\$ref' alongside 'type'/
      ],
      ['a recursive pydantic model', recursive, /'#\/\$defs\/Node' is recursive, which cannot be inlined/],
      ['mutual recursion', mutual, /'#\/\$defs\/A' is recursive/],
      ['a reference to the whole document', obj({ self: { $ref: '#' } }), /'#' is recursive/],
      ['a chain deeper than the nesting limit', chain(40), /exceeds the nesting limit of 32 references/],
      ['an exponential expansion', doubling, /exceeds the limit of 1000 reference expansions/],
      [
        'an out-of-subset target, naming both paths',
        { $defs: { A: { type: 'date' } }, ...obj({ x: { $ref: '#/$defs/A' } }) },
        /^#\/properties\/x: via '\$ref' '#\/\$defs\/A': #\/\$defs\/A: unsupported or missing 'type'/
      ],
      [
        'a non-object target',
        { $defs: { A: true }, $ref: '#/$defs/A' },
        /#\/\$defs\/A: expected a JSON Schema object/
      ],
      [
        'a reference under a nested $id',
        {
          $defs: { B: { type: 'string' } },
          ...obj({ a: { $id: 'https://example.com/a', ...obj({ b: { $ref: '#/$defs/B' } }) } })
        },
        /^#\/properties\/a\/properties\/b: .*sits inside a subschema with its own '\$id'/
      ],
      [
        'a non-string $ref description',
        { $defs: { S: { type: 'string' } }, $ref: '#/$defs/S', description: 3 },
        /^#: .*description/i
      ],
      [
        '$dynamicRef',
        { type: 'string', $dynamicRef: '#meta' },
        /^#: unsupported JSON Schema keyword '\$dynamicRef'/
      ],
      [
        '$recursiveRef',
        { type: 'string', $recursiveRef: '#' },
        /unsupported JSON Schema keyword '\$recursiveRef'/
      ]
    ])('refuses %s', (__label, raw, message) => {
      expect(JsonSchema.fromJson(raw)).toFailWith(message);
    });
  });
});
