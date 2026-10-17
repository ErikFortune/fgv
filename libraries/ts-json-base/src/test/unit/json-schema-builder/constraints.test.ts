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
import { succeed } from '@fgv/ts-utils';
import { JsonSchema } from '../../..';

/** A schema node built either way: from the factory, or from `fromJson` over its wire form. */
type Build = (opts: JsonObject) => JsonSchema.ISchemaValidator<unknown>;

/** Parses `opts` as a `type` node, spelling `nullable: true` as the wire's type union. */
function viaFromJson(type: string): Build {
  return ({ nullable, ...rest }) =>
    JsonSchema.fromJson({ type: nullable === true ? [type, 'null'] : type, ...rest }).orThrow();
}

const numberBuilders: ReadonlyArray<[string, Build]> = [
  ['factory', (opts) => JsonSchema.number(opts as JsonSchema.INumberSchemaOptions)],
  ['fromJson', viaFromJson('number')]
];

const integerBuilders: ReadonlyArray<[string, Build]> = [
  ['factory', (opts) => JsonSchema.integer(opts as JsonSchema.INumberSchemaOptions)],
  ['fromJson', viaFromJson('integer')]
];

const stringBuilders: ReadonlyArray<[string, Build]> = [
  ['factory', (opts) => JsonSchema.string(opts as JsonSchema.IStringSchemaOptions)],
  ['fromJson', viaFromJson('string')]
];

describe('JsonSchema constraints — enforcement', () => {
  describe.each(numberBuilders)('number (%s)', (__name, build) => {
    test('minimum: on the bound passes, just below fails naming the keyword and bound', () => {
      const schema = build({ minimum: 5 });
      expect(schema.validate(5)).toSucceedWith(5);
      expect(schema.validate(4.999)).toFailWith(/expected a value >= 5 \(minimum\), got 4\.999/);
    });

    test('maximum: on the bound passes, just above fails', () => {
      const schema = build({ maximum: 10 });
      expect(schema.validate(10)).toSucceedWith(10);
      expect(schema.validate(10.001)).toFailWith(/<= 10 \(maximum\), got 10\.001/);
    });

    test('exclusiveMinimum: just above passes, on the bound fails', () => {
      const schema = build({ exclusiveMinimum: 0 });
      expect(schema.validate(0.001)).toSucceedWith(0.001);
      expect(schema.validate(0)).toFailWith(/> 0 \(exclusiveMinimum\), got 0/);
    });

    test('exclusiveMaximum: just below passes, on the bound fails', () => {
      const schema = build({ exclusiveMaximum: 1 });
      expect(schema.validate(0.999)).toSucceedWith(0.999);
      expect(schema.validate(1)).toFailWith(/< 1 \(exclusiveMaximum\), got 1/);
    });

    test('multipleOf: a multiple passes (with float tolerance), a non-multiple fails', () => {
      const schema = build({ multipleOf: 0.1 });
      expect(schema.validate(0.3)).toSucceedWith(0.3);
      expect(schema.validate(-2)).toSucceedWith(-2);
      expect(schema.validate(0.35)).toFailWith(/multiple of 0\.1 \(multipleOf\), got 0\.35/);
    });

    test('the type check still runs before the constraints', () => {
      expect(build({ minimum: 0 }).validate('5')).toFail();
    });

    test('every violated keyword is reported', () => {
      expect(build({ minimum: 5, multipleOf: 2 }).validate(3)).toFailWith(/minimum[\s\S]*multipleOf/);
    });

    test('convert() enforces exactly as validate() does', () => {
      const schema = build({ minimum: 1, maximum: 3 });
      expect(schema.convert(2)).toSucceedWith(2);
      expect(schema.convert(0)).toFailWith(/minimum/);
    });

    test('a nullable node accepts null unconstrained and constrains its numbers', () => {
      const schema = build({ minimum: 1, nullable: true });
      expect(schema.validate(null)).toSucceedWith(null);
      expect(schema.validate(0)).toFailWith(/minimum/);
    });
  });

  describe.each(integerBuilders)('integer (%s)', (__name, build) => {
    test('applies the range after the integer check', () => {
      const schema = build({ minimum: 1, maximum: 3 });
      expect(schema.validate(1)).toSucceedWith(1);
      expect(schema.validate(3)).toSucceedWith(3);
      expect(schema.validate(4)).toFailWith(/maximum/);
      expect(schema.validate(2.5)).toFail();
    });

    test('multipleOf on integers', () => {
      const schema = build({ multipleOf: 5 });
      expect(schema.validate(15)).toSucceedWith(15);
      expect(schema.validate(16)).toFailWith(/multipleOf/);
    });
  });

  test('a non-strict number coerces first and then applies its constraints', () => {
    const schema = JsonSchema.number({ strict: false, minimum: 10 });
    expect(schema.validate('12')).toSucceedWith(12);
    expect(schema.validate('9')).toFailWith(/minimum/);
  });

  describe.each(stringBuilders)('string (%s)', (__name, build) => {
    test('minLength: on the bound passes, one short fails', () => {
      const schema = build({ minLength: 3 });
      expect(schema.validate('abc')).toSucceedWith('abc');
      expect(schema.validate('ab')).toFailWith(/at least 3 characters \(minLength\), got 2/);
    });

    test('maxLength: on the bound passes, one over fails', () => {
      const schema = build({ maxLength: 3 });
      expect(schema.validate('abc')).toSucceedWith('abc');
      expect(schema.validate('abcd')).toFailWith(/at most 3 characters \(maxLength\), got 4/);
    });

    test('length counts code points, not UTF-16 code units', () => {
      const schema = build({ maxLength: 2 });
      expect(schema.validate('\u{1F600}\u{1F600}')).toSucceed();
      expect(schema.validate('\u{1F600}\u{1F600}\u{1F600}')).toFailWith(/got 3/);
    });

    test('format is an annotation and is not enforced', () => {
      expect(build({ format: 'email' }).validate('not an email')).toSucceedWith('not an email');
    });

    test('a nullable node accepts null unconstrained', () => {
      const schema = build({ minLength: 1, nullable: true });
      expect(schema.validate(null)).toSucceedWith(null);
      expect(schema.convert('')).toFailWith(/minLength/);
    });
  });

  test('annotations are never enforced', () => {
    const schema = JsonSchema.integer({ default: 'not an integer', examples: [true], title: 'T' });
    expect(schema.validate(4)).toSucceedWith(4);
    expect(schema.validate(undefined)).toFail();
  });
});

describe('JsonSchema constraints — incoherent options', () => {
  const numberCases: ReadonlyArray<[string, JsonObject, RegExp]> = [
    ['a non-finite minimum', { minimum: Infinity }, /minimum must be a finite number, got Infinity/],
    ['a NaN maximum', { maximum: NaN }, /maximum must be a finite number, got NaN/],
    ['a non-finite exclusiveMinimum', { exclusiveMinimum: -Infinity }, /exclusiveMinimum must be a finite/],
    ['a non-finite exclusiveMaximum', { exclusiveMaximum: Infinity }, /exclusiveMaximum must be a finite/],
    ['a non-finite multipleOf', { multipleOf: Infinity }, /multipleOf must be a finite/],
    ['minimum above maximum', { minimum: 5, maximum: 1 }, /minimum 5 is greater than maximum 1/],
    [
      'an exclusive minimum on the maximum',
      { exclusiveMinimum: 1, maximum: 1 },
      /exclusiveMinimum 1 and maximum 1 leave no number in range/
    ],
    [
      'an exclusive maximum on the minimum',
      { minimum: 2, exclusiveMaximum: 2 },
      /minimum 2 and exclusiveMaximum 2 leave no number in range/
    ],
    [
      'exclusive bounds that cross',
      { exclusiveMinimum: 3, exclusiveMaximum: 2 },
      /exclusiveMinimum 3 and exclusiveMaximum 2 leave no number/
    ],
    [
      'an exclusive bound tighter than the inclusive one on the same side',
      { minimum: 0, exclusiveMinimum: 5, maximum: 5 },
      /exclusiveMinimum 5 and maximum 5/
    ],
    [
      'an exclusive minimum equal to an inclusive minimum, on the maximum',
      { minimum: 1, exclusiveMinimum: 1, maximum: 1 },
      /exclusiveMinimum 1 and maximum 1 leave no number/
    ],
    [
      'an inclusive maximum tighter than the exclusive one',
      { minimum: 3, maximum: 2, exclusiveMaximum: 9 },
      /minimum 3 is greater than maximum 2/
    ],
    [
      'an inclusive maximum below an exclusive minimum',
      { exclusiveMinimum: 3, exclusiveMaximum: 9, maximum: 2 },
      /exclusiveMinimum 3 and maximum 2 leave no number/
    ],
    ['a zero multipleOf', { multipleOf: 0 }, /multipleOf must be greater than 0, got 0/],
    ['a negative multipleOf', { multipleOf: -2 }, /multipleOf must be greater than 0, got -2/]
  ];

  test.each(numberCases)('number: %s is refused by the factory', (__name, opts, expected) => {
    const build = (): unknown => JsonSchema.number(opts as JsonSchema.INumberSchemaOptions);
    expect(build).toThrow(/^JsonSchema\.number: /);
    expect(build).toThrow(expected);
  });

  test.each(numberCases)('number: %s is refused by fromJson, naming the path', (__name, opts, expected) => {
    const parsed = JsonSchema.fromJson({ type: 'object', properties: { n: { type: 'number', ...opts } } });
    expect(parsed).toFailWith(/^#\/properties\/n: /);
    expect(parsed).toFailWith(expected);
  });

  test('an integer range holding no integer is refused, though it holds numbers', () => {
    expect(() => JsonSchema.integer({ exclusiveMinimum: 1, exclusiveMaximum: 2 })).toThrow(
      /^JsonSchema.integer: exclusiveMinimum 1 and exclusiveMaximum 2 leave no integer in range/
    );
    expect(() => JsonSchema.integer({ minimum: 1.2, maximum: 1.8 })).toThrow(/leave no integer in range/);
    expect(JsonSchema.fromJson({ type: 'integer', minimum: 1.2, maximum: 1.8 })).toFailWith(
      /^#: minimum 1\.2 and maximum 1\.8 leave no integer in range/
    );
    // ... while the same bounds on a number are fine, and an integer range holding one value is too.
    expect(() => JsonSchema.number({ minimum: 1.2, maximum: 1.8 })).not.toThrow();
    expect(JsonSchema.integer({ exclusiveMinimum: 0.5, exclusiveMaximum: 2 }).validate(1)).toSucceedWith(1);
  });

  const stringCases: ReadonlyArray<[string, JsonObject, RegExp]> = [
    ['a negative minLength', { minLength: -1 }, /minLength must be a non-negative integer, got -1/],
    ['a fractional maxLength', { maxLength: 1.5 }, /maxLength must be a non-negative integer, got 1\.5/],
    [
      'an infinite maxLength',
      { maxLength: Infinity },
      /maxLength must be a non-negative integer, got Infinity/
    ],
    ['minLength above maxLength', { minLength: 5, maxLength: 2 }, /minLength 5 is greater than maxLength 2/]
  ];

  test.each(stringCases)('string: %s is refused by the factory', (__name, opts, expected) => {
    const build = (): unknown => JsonSchema.string(opts as JsonSchema.IStringSchemaOptions);
    expect(build).toThrow(/^JsonSchema\.string: /);
    expect(build).toThrow(expected);
  });

  test.each(stringCases)('string: %s is refused by fromJson, naming the path', (__name, opts, expected) => {
    const parsed = JsonSchema.fromJson({ type: 'array', items: { type: 'string', ...opts } });
    expect(parsed).toFailWith(/^#\/items: /);
    expect(parsed).toFailWith(expected);
  });

  test('a nullable union refuses the incoherent options of its value branch', () => {
    expect(
      JsonSchema.fromJson({ anyOf: [{ type: 'number', minimum: 2, maximum: 1 }, { type: 'null' }] })
    ).toFailWith(/^#\/anyOf\/0: minimum 2 is greater than maximum 1/);
  });

  test('an annotation that is not JSON is refused by every factory', () => {
    const notJson = (): string => 'f';
    const opts = { default: notJson as unknown as JsonValue };
    expect(() => JsonSchema.boolean(opts)).toThrow(/^JsonSchema.boolean: default: /);
    expect(() => JsonSchema.string(opts)).toThrow(/^JsonSchema.string: default: /);
    expect(() => JsonSchema.number(opts)).toThrow(/^JsonSchema.number: default: /);
    expect(() => JsonSchema.enumOf(['a'], opts)).toThrow(/^JsonSchema.enumOf: default: /);
    expect(() => JsonSchema.array(JsonSchema.string(), opts)).toThrow(/^JsonSchema.array: default: /);
    expect(() => JsonSchema.object({}, opts)).toThrow(/^JsonSchema.object: default: /);
    expect(() => JsonSchema.record(JsonSchema.string(), opts)).toThrow(/^JsonSchema.record: default: /);
    expect(() => JsonSchema.integer({ examples: [1, notJson as unknown as JsonValue] })).toThrow(
      /^JsonSchema.integer: examples: /
    );
  });

  test('fromJson refuses constraint and annotation values of the wrong type', () => {
    const cases: ReadonlyArray<[JsonObject, RegExp]> = [
      [{ type: 'number', minimum: '5' }, /^#: minimum: /],
      [{ type: 'integer', multipleOf: true }, /^#: multipleOf: /],
      [{ type: 'string', minLength: '3' }, /^#: minLength: /],
      [{ type: 'string', format: 5 }, /^#: format: /],
      [{ type: 'boolean', title: 5 }, /^#: title: /],
      [{ type: 'boolean', examples: 'x' }, /^#: examples: /]
    ];
    for (const [raw, expected] of cases) {
      expect(JsonSchema.fromJson(raw)).toFailWith(expected);
    }
  });
});

describe('JsonSchema constraints — emission and round trip', () => {
  const nodes: ReadonlyArray<[string, JsonSchema.ISchemaValidator<unknown>, JsonObject]> = [
    ['minimum', JsonSchema.number({ minimum: 1 }), { type: 'number', minimum: 1 }],
    ['maximum', JsonSchema.number({ maximum: 9 }), { type: 'number', maximum: 9 }],
    [
      'exclusiveMinimum',
      JsonSchema.integer({ exclusiveMinimum: 0 }),
      { type: 'integer', exclusiveMinimum: 0 }
    ],
    ['exclusiveMaximum', JsonSchema.number({ exclusiveMaximum: 1 }), { type: 'number', exclusiveMaximum: 1 }],
    ['multipleOf', JsonSchema.integer({ multipleOf: 3 }), { type: 'integer', multipleOf: 3 }],
    ['minLength', JsonSchema.string({ minLength: 1 }), { type: 'string', minLength: 1 }],
    ['maxLength', JsonSchema.string({ maxLength: 8 }), { type: 'string', maxLength: 8 }],
    ['format', JsonSchema.string({ format: 'uuid' }), { type: 'string', format: 'uuid' }],
    ['title', JsonSchema.boolean({ title: 'Flag' }), { type: 'boolean', title: 'Flag' }],
    [
      'default',
      JsonSchema.enumOf(['a', 'b'], { default: 'a' }),
      { type: 'string', enum: ['a', 'b'], default: 'a' }
    ],
    [
      'examples',
      JsonSchema.array(JsonSchema.string(), { examples: [['x'], []] }),
      { type: 'array', items: { type: 'string' }, examples: [['x'], []] }
    ],
    [
      'object annotations',
      JsonSchema.object({ a: JsonSchema.string() }, { title: 'O', default: { a: 'z' } }),
      {
        type: 'object',
        properties: { a: { type: 'string' } },
        required: ['a'],
        additionalProperties: false,
        title: 'O',
        default: { a: 'z' }
      }
    ],
    [
      'record annotations',
      JsonSchema.record(JsonSchema.integer({ minimum: 0 }), { examples: [{ k: 1 }] }),
      {
        type: 'object',
        properties: {},
        additionalProperties: { type: 'integer', minimum: 0 },
        examples: [{ k: 1 }]
      }
    ],
    [
      'nullable with constraints',
      JsonSchema.number({ nullable: true, minimum: 0, maximum: 1, default: null }),
      { type: ['number', 'null'], minimum: 0, maximum: 1, default: null }
    ]
  ];

  test.each(nodes)('%s is emitted by toJson()', (__name, schema, expected) => {
    expect(schema.toJson()).toEqual(expected);
  });

  test.each(nodes)('%s round-trips through fromJson to an equivalent node', (__name, schema, expected) => {
    expect(JsonSchema.fromJson(schema.toJson())).toSucceedAndSatisfy((parsed) => {
      expect(parsed.toJson()).toEqual(expected);
    });
  });

  test('every keyword at once emits in a fixed order and round-trips', () => {
    const schema = JsonSchema.number({
      description: 'd',
      examples: [2],
      default: 2,
      title: 't',
      multipleOf: 2,
      exclusiveMaximum: 10,
      maximum: 9,
      exclusiveMinimum: 0,
      minimum: 1
    });
    const expected = [
      'type',
      'minimum',
      'exclusiveMinimum',
      'maximum',
      'exclusiveMaximum',
      'multipleOf',
      'description',
      'title',
      'default',
      'examples'
    ];
    expect(Object.keys(schema.toJson())).toEqual(expected);
    expect(JsonSchema.fromJson(schema.toJson())).toSucceedAndSatisfy((parsed) => {
      expect(JSON.stringify(parsed.toJson())).toEqual(JSON.stringify(schema.toJson()));
    });
  });

  test('a string emits its lengths and format before its annotations', () => {
    expect(
      Object.keys(JsonSchema.string({ title: 't', format: 'date', maxLength: 9, minLength: 1 }).toJson())
    ).toEqual(['type', 'minLength', 'maxLength', 'format', 'title']);
  });

  test('a nullable anyOf carries the value branch constraints; null passes unconstrained', () => {
    const raw: JsonObject = {
      anyOf: [{ type: 'integer', minimum: 1, maximum: 5 }, { type: 'null' }],
      title: 'Count'
    };
    expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
      expect(schema.toJson()).toEqual({ type: ['integer', 'null'], minimum: 1, maximum: 5, title: 'Count' });
      expect(schema.validate(null)).toSucceedWith(null);
      expect(schema.validate(5)).toSucceedWith(5);
      expect(schema.validate(6)).toFailWith(/maximum/);
      expect(JsonSchema.fromJson(schema.toJson())).toSucceedAndSatisfy((again) => {
        expect(again.toJson()).toEqual(schema.toJson());
      });
    });
  });

  test('a $ref keeps its target constraints, and sibling annotations replace the target ones', () => {
    const raw: JsonObject = {
      $defs: { Pct: { type: 'number', minimum: 0, maximum: 100, title: 'Percent', default: 50 } },
      $ref: '#/$defs/Pct',
      default: 0
    };
    expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
      expect(schema.toJson()).toEqual({
        type: 'number',
        minimum: 0,
        maximum: 100,
        title: 'Percent',
        default: 0
      });
      expect(schema.validate(101)).toFailWith(/maximum/);
    });
  });

  test('a constraint beside a $ref is still refused', () => {
    expect(
      JsonSchema.fromJson({ $defs: { N: { type: 'number' } }, $ref: '#/$defs/N', minimum: 1 })
    ).toFailWith(/'\$ref' alongside 'minimum'/);
  });

  test('numeric keywords on a non-numeric node carry no meaning and are not emitted', () => {
    expect(JsonSchema.fromJson({ type: 'string', minimum: 3, multipleOf: 2 })).toSucceedAndSatisfy(
      (schema) => {
        expect(schema.toJson()).toEqual({ type: 'string' });
        expect(schema.validate('a')).toSucceed();
      }
    );
  });

  test('a node does not change when the caller mutates its options afterwards', () => {
    const examples: JsonValue[] = ['a'];
    const opts: JsonSchema.IStringSchemaOptions = { minLength: 1, examples };
    const schema = JsonSchema.string(opts);
    opts.minLength = 5;
    examples.push('b');
    expect(schema.validate('ab')).toSucceed();
    expect(schema.toJson()).toEqual({ type: 'string', minLength: 1, examples: ['a'] });
  });
});

describe('JsonSchema constraints — review round', () => {
  test('multipleOf accepts decimal multiples within float rounding', () => {
    expect(JsonSchema.number({ multipleOf: 0.1 }).validate(0.3)).toSucceedWith(0.3);
    expect(JsonSchema.number({ multipleOf: 0.1 }).validate(0.7)).toSucceedWith(0.7);
    expect(JsonSchema.number({ multipleOf: 0.05 }).validate(1.15)).toSucceedWith(1.15);
  });

  test('multipleOf refuses a near miss on a large quotient', () => {
    expect(JsonSchema.number({ multipleOf: 1 }).validate(2000000000.5)).toFailWith(/multipleOf/);
    expect(JsonSchema.number({ multipleOf: 0.01 }).validate(12345678.123)).toFailWith(/multipleOf/);
    expect(JsonSchema.integer({ multipleOf: 10 }).validate(10000000005)).toFailWith(/multipleOf/);
    expect(JsonSchema.integer({ multipleOf: 10 }).validate(10000000010)).toSucceed();
  });

  test('validateNumberOptions and validateStringOptions are the non-throwing checks', () => {
    expect(JsonSchema.validateNumberOptions('integer', { minimum: 3, maximum: 1 })).toFailWith(
      /minimum 3 is greater than maximum 1/
    );
    expect(
      JsonSchema.validateNumberOptions('integer', { minimum: 1, maximum: 3 }).onSuccess((o) =>
        succeed(JsonSchema.integer(o))
      )
    ).toSucceedAndSatisfy((schema) => {
      expect(schema.validate(4)).toFailWith(/maximum/);
    });
    expect(JsonSchema.validateNumberOptions('number', undefined)).toSucceedWith(undefined);
    expect(JsonSchema.validateStringOptions({ minLength: -1 })).toFailWith(/non-negative integer/);
    expect(JsonSchema.validateStringOptions({ maxLength: 2 })).toSucceedWith({ maxLength: 2 });
  });

  test('mutating what toJson() returned cannot alter the node', () => {
    const schema = JsonSchema.object(
      { a: JsonSchema.string() },
      { default: { a: 'x' }, examples: [{ a: 'y' }] }
    );
    const first = schema.toJson();
    (first.default as JsonObject).a = 'changed';
    (first.examples as JsonObject[])[0].a = 'changed';
    (first.examples as JsonValue[]).push('extra');
    expect(schema.toJson()).toEqual(expect.objectContaining({ default: { a: 'x' }, examples: [{ a: 'y' }] }));
  });

  test('mutating the authored default after construction cannot alter the node', () => {
    const value: JsonObject = { k: 1 };
    const schema = JsonSchema.boolean({ default: value });
    value.k = 2;
    expect(schema.toJson()).toEqual({ type: 'boolean', default: { k: 1 } });
  });

  test('fromJson refuses a length keyword beside a string enum, naming the path', () => {
    expect(
      JsonSchema.fromJson({ type: 'object', properties: { e: { enum: ['abc', 'd'], maxLength: 1 } } })
    ).toFailWith(/^#\/properties\/e: unsupported JSON Schema keyword 'maxLength' beside 'enum'/);
    expect(JsonSchema.fromJson({ type: 'string', enum: ['a'], minLength: 2 })).toFailWith(
      /'minLength' beside 'enum'/
    );
  });

  test('an integer range above 2^53 is judged as a number range rather than by rounding', () => {
    const big = 2 ** 53;
    const schema = JsonSchema.integer({ exclusiveMinimum: big, maximum: big + 2 });
    expect(schema.validate(big + 2)).toSucceed();
    expect(() => JsonSchema.integer({ exclusiveMinimum: big, maximum: big })).toThrow(/leave no integer/);
  });
});
