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

/** A schema node built either way: from the factory, or from `fromJson` over its wire form. */
type Build = (opts: JsonObject) => JsonSchema.ISchemaValidator<unknown>;

/** Parses `opts` as a `type` node, spelling `nullable: true` as the wire's type union. */
function viaFromJson(type: string): Build {
  return ({ nullable, ...rest }) =>
    JsonSchema.fromJson({ type: nullable === true ? [type, 'null'] : type, ...rest }).orThrow();
}

const numberBuilders: ReadonlyArray<[string, Build]> = [
  [
    'factory',
    (opts) =>
      JsonSchema.number(
        JsonSchema.numberOptions(opts as JsonSchema.INumberSchemaOptions).shouldNotFail('number options')
      )
  ],
  ['fromJson', viaFromJson('number')]
];

const integerBuilders: ReadonlyArray<[string, Build]> = [
  [
    'factory',
    (opts) =>
      JsonSchema.integer(
        JsonSchema.integerOptions(opts as JsonSchema.INumberSchemaOptions).shouldNotFail('integer options')
      )
  ],
  ['fromJson', viaFromJson('integer')]
];

const stringBuilders: ReadonlyArray<[string, Build]> = [
  [
    'factory',
    (opts) =>
      JsonSchema.string(
        JsonSchema.stringOptions(opts as JsonSchema.IStringSchemaOptions).shouldNotFail('string options')
      )
  ],
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
      expect(schema.validate(null)).toSucceed();
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
    const schema = JsonSchema.number(
      JsonSchema.numberOptions({ strict: false, minimum: 10 }).shouldNotFail('number options')
    );
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
    const schema = JsonSchema.integer(
      JsonSchema.integerOptions({ default: 'not an integer', examples: [true], title: 'T' }).shouldNotFail(
        'integer options'
      )
    );
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

  test.each(numberCases)('number: %s is refused by numberOptions', (__name, opts, expected) => {
    expect(JsonSchema.numberOptions(opts as JsonSchema.INumberSchemaOptions)).toFailWith(expected);
  });

  test.each(numberCases)('integer: %s is refused by integerOptions too', (__name, opts) => {
    // An incoherent number range is an incoherent integer range; the integer-specific wording is
    // pinned by the test below.
    expect(JsonSchema.integerOptions(opts as JsonSchema.INumberSchemaOptions)).toFail();
  });

  test.each(numberCases)('number: %s is refused by fromJson, naming the path', (__name, opts, expected) => {
    const parsed = JsonSchema.fromJson({ type: 'object', properties: { n: { type: 'number', ...opts } } });
    expect(parsed).toFailWith(/^#\/properties\/n: /);
    expect(parsed).toFailWith(expected);
  });

  test('an integer range holding no integer is refused, though it holds numbers', () => {
    expect(JsonSchema.integerOptions({ exclusiveMinimum: 1, exclusiveMaximum: 2 })).toFailWith(
      /^exclusiveMinimum 1 and exclusiveMaximum 2 leave no integer in range/
    );
    expect(JsonSchema.integerOptions({ minimum: 1.2, maximum: 1.8 })).toFailWith(/leave no integer in range/);
    expect(JsonSchema.fromJson({ type: 'integer', minimum: 1.2, maximum: 1.8 })).toFailWith(
      /^#: minimum 1\.2 and maximum 1\.8 leave no integer in range/
    );
    // ... while the same bounds on a number are fine, and an integer range holding one value is too.
    expect(JsonSchema.numberOptions({ minimum: 1.2, maximum: 1.8 })).toSucceed();
    expect(
      JsonSchema.integer(
        JsonSchema.integerOptions({ exclusiveMinimum: 0.5, exclusiveMaximum: 2 }).shouldNotFail(
          'integer options'
        )
      ).validate(1)
    ).toSucceedWith(1);
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

  test.each(stringCases)('string: %s is refused by stringOptions', (__name, opts, expected) => {
    expect(JsonSchema.stringOptions(opts as JsonSchema.IStringSchemaOptions)).toFailWith(expected);
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

  test('an annotation that is not JSON is refused by every validated-options factory', () => {
    const notJson = (): string => 'f';
    const opts = { default: notJson as unknown as JsonValue };
    expect(JsonSchema.schemaOptions(opts)).toFailWith(/^default: /);
    expect(JsonSchema.stringOptions(opts)).toFailWith(/^default: /);
    expect(JsonSchema.numberOptions(opts)).toFailWith(/^default: /);
    expect(JsonSchema.integerOptions({ examples: [1, notJson as unknown as JsonValue] })).toFailWith(
      /^examples: /
    );
    expect(JsonSchema.schemaOptions({ examples: 'x' as unknown as JsonValue[] })).toFailWith(/^examples: /);
  });

  test('NaN is a number but not JSON, so it is refused as a default', () => {
    expect(JsonSchema.numberOptions({ default: NaN })).toFailWith(/^default: .*invalid JSON primitive/);
  });

  test('the factories that return a Result refuse a non-JSON annotation themselves', () => {
    const notJson = (): string => 'f';
    const opts = { default: notJson as unknown as JsonValue };
    expect(JsonSchema.numberEnumOf([1], opts)).toFailWith(/^default: /);
    expect(JsonSchema.integerEnumOf([1], opts)).toFailWith(/^default: /);
    expect(JsonSchema.booleanEnumOf([true], opts)).toFailWith(/^default: /);
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
    [
      'minimum',
      JsonSchema.number(JsonSchema.numberOptions({ minimum: 1 }).shouldNotFail('number options')),
      { type: 'number', minimum: 1 }
    ],
    [
      'maximum',
      JsonSchema.number(JsonSchema.numberOptions({ maximum: 9 }).shouldNotFail('number options')),
      { type: 'number', maximum: 9 }
    ],
    [
      'exclusiveMinimum',
      JsonSchema.integer(JsonSchema.integerOptions({ exclusiveMinimum: 0 }).shouldNotFail('integer options')),
      { type: 'integer', exclusiveMinimum: 0 }
    ],
    [
      'exclusiveMaximum',
      JsonSchema.number(JsonSchema.numberOptions({ exclusiveMaximum: 1 }).shouldNotFail('number options')),
      { type: 'number', exclusiveMaximum: 1 }
    ],
    [
      'multipleOf',
      JsonSchema.integer(JsonSchema.integerOptions({ multipleOf: 3 }).shouldNotFail('integer options')),
      { type: 'integer', multipleOf: 3 }
    ],
    [
      'minLength',
      JsonSchema.string(JsonSchema.stringOptions({ minLength: 1 }).shouldNotFail('string options')),
      { type: 'string', minLength: 1 }
    ],
    [
      'maxLength',
      JsonSchema.string(JsonSchema.stringOptions({ maxLength: 8 }).shouldNotFail('string options')),
      { type: 'string', maxLength: 8 }
    ],
    ['format', JsonSchema.string({ format: 'uuid' }), { type: 'string', format: 'uuid' }],
    ['title', JsonSchema.boolean({ title: 'Flag' }), { type: 'boolean', title: 'Flag' }],
    [
      'default',
      JsonSchema.enumOf(
        ['a', 'b'],
        JsonSchema.schemaOptions({ default: 'a' }).shouldNotFail('schema options')
      ),
      { type: 'string', enum: ['a', 'b'], default: 'a' }
    ],
    [
      'examples',
      JsonSchema.array(
        JsonSchema.string(),
        JsonSchema.schemaOptions({ examples: [['x'], []] }).shouldNotFail('schema options')
      ),
      { type: 'array', items: { type: 'string' }, examples: [['x'], []] }
    ],
    [
      'object annotations',
      JsonSchema.object(
        { a: JsonSchema.string() },
        JsonSchema.schemaOptions({ title: 'O', default: { a: 'z' } }).shouldNotFail('schema options')
      ),
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
      JsonSchema.record(
        JsonSchema.integer(JsonSchema.integerOptions({ minimum: 0 }).shouldNotFail('integer options')),
        JsonSchema.schemaOptions({ examples: [{ k: 1 }] }).shouldNotFail('schema options')
      ),
      {
        type: 'object',
        properties: {},
        additionalProperties: { type: 'integer', minimum: 0 },
        examples: [{ k: 1 }]
      }
    ],
    [
      'nullable with constraints',
      JsonSchema.number(
        JsonSchema.numberOptions({ nullable: true, minimum: 0, maximum: 1, default: null }).shouldNotFail(
          'number options'
        )
      ),
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
    const schema = JsonSchema.number(
      JsonSchema.numberOptions({
        description: 'd',
        examples: [2],
        default: 2,
        title: 't',
        multipleOf: 2,
        exclusiveMaximum: 10,
        maximum: 9,
        exclusiveMinimum: 0,
        minimum: 1
      }).shouldNotFail('number options')
    );
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
      Object.keys(
        JsonSchema.string(
          JsonSchema.stringOptions({ title: 't', format: 'date', maxLength: 9, minLength: 1 }).shouldNotFail(
            'string options'
          )
        ).toJson()
      )
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
    const schema = JsonSchema.string(JsonSchema.stringOptions(opts).shouldNotFail('string options'));
    opts.minLength = 5;
    examples.push('b');
    expect(schema.validate('ab')).toSucceed();
    expect(schema.toJson()).toEqual({ type: 'string', minLength: 1, examples: ['a'] });
  });
});

describe('JsonSchema constraints — float tolerance, validated options, copies, enum lengths, 2^53', () => {
  test('multipleOf accepts decimal multiples within float rounding', () => {
    expect(
      JsonSchema.number(
        JsonSchema.numberOptions({ multipleOf: 0.1 }).shouldNotFail('number options')
      ).validate(0.3)
    ).toSucceedWith(0.3);
    expect(
      JsonSchema.number(
        JsonSchema.numberOptions({ multipleOf: 0.1 }).shouldNotFail('number options')
      ).validate(0.7)
    ).toSucceedWith(0.7);
    expect(
      JsonSchema.number(
        JsonSchema.numberOptions({ multipleOf: 0.05 }).shouldNotFail('number options')
      ).validate(1.15)
    ).toSucceedWith(1.15);
  });

  test('multipleOf refuses a near miss on a large quotient', () => {
    expect(
      JsonSchema.number(JsonSchema.numberOptions({ multipleOf: 1 }).shouldNotFail('number options')).validate(
        2000000000.5
      )
    ).toFailWith(/multipleOf/);
    expect(
      JsonSchema.number(
        JsonSchema.numberOptions({ multipleOf: 0.01 }).shouldNotFail('number options')
      ).validate(12345678.123)
    ).toFailWith(/multipleOf/);
    expect(
      JsonSchema.integer(
        JsonSchema.integerOptions({ multipleOf: 10 }).shouldNotFail('integer options')
      ).validate(10000000005)
    ).toFailWith(/multipleOf/);
    expect(
      JsonSchema.integer(
        JsonSchema.integerOptions({ multipleOf: 10 }).shouldNotFail('integer options')
      ).validate(10000000010)
    ).toSucceed();
  });

  test('validated options hold a frozen copy, so neither side can invalidate the check', () => {
    const opts: JsonSchema.INumberSchemaOptions = { minimum: 1, maximum: 3 };
    expect(JsonSchema.numberOptions(opts)).toSucceedAndSatisfy((validated) => {
      expect(validated).toBeInstanceOf(JsonSchema.ValidatedNumberOptions);
      expect(validated.options).not.toBe(opts);
      expect(validated.options).toEqual(opts);
      expect(Object.isFrozen(validated.options)).toBe(true);
    });
    expect(JsonSchema.integerOptions(opts)).toSucceedAndSatisfy((v) => {
      expect(v).toBeInstanceOf(JsonSchema.ValidatedNumberOptions);
      expect(v.holdsInteger).toBe(true);
      expect(Object.isFrozen(v.options)).toBe(true);
    });
    expect(JsonSchema.stringOptions({ maxLength: 2 })).toSucceedAndSatisfy((v) => {
      expect(v.options).toEqual({ maxLength: 2 });
      expect(Object.isFrozen(v.options)).toBe(true);
    });
    expect(JsonSchema.schemaOptions({ title: 't' })).toSucceedAndSatisfy((v) => {
      expect(v.options).toEqual({ title: 't' });
      expect(Object.isFrozen(v.options)).toBe(true);
    });
  });

  test('a spread of validated options copies only the discriminant, never the options', () => {
    const validated = JsonSchema.numberOptions({ minimum: 0 }).shouldNotFail('spread source');
    expect({ ...validated }).toEqual({ kind: 'validated-number-options' });
  });

  test('integer-validated options are accepted by the number factory', () => {
    const range = JsonSchema.integerOptions({ minimum: 1, maximum: 3 }).shouldNotFail('integer options');
    expect(JsonSchema.number(range).validate(2.5)).toSucceedWith(2.5);
    expect(JsonSchema.integer(range).validate(2.5)).toFail();
  });

  test('nullable survives validation, so the nullable overload applies', () => {
    const schema = JsonSchema.integer(
      JsonSchema.integerOptions({ minimum: 0, nullable: true }).shouldNotFail('integer options')
    );
    const value: number | null = schema.validate(null).orThrow();
    expect(value).toBeNull();
    expect(schema.toJson()).toEqual({ type: ['integer', 'null'], minimum: 0 });
  });

  test('raw constraint keys and unvalidated annotations are compile errors on a factory', () => {
    // @ts-expect-error - a range keyword must arrive through numberOptions
    expect(() => JsonSchema.number({ minimum: 0 })).not.toThrow();
    // @ts-expect-error - a plain annotation does not make a range keyword acceptable
    expect(() => JsonSchema.integer({ description: 'd', maximum: 1 })).not.toThrow();
    // @ts-expect-error - a length keyword must arrive through stringOptions
    expect(() => JsonSchema.string({ minLength: 1 })).not.toThrow();
    // @ts-expect-error - default must arrive through validated options
    expect(() => JsonSchema.boolean({ default: true })).not.toThrow();
    // @ts-expect-error - examples must arrive through validated options
    expect(() => JsonSchema.object({}, { examples: [{}] })).not.toThrow();
    const numberRange = JsonSchema.numberOptions({ minimum: 0 }).shouldNotFail('number options');
    // @ts-expect-error - a number range need not hold an integer
    expect(() => JsonSchema.integer(numberRange)).not.toThrow();
    // @ts-expect-error - a key that is not an option is refused by the options factory
    expect(JsonSchema.numberOptions({ minimun: 0, description: 'd' })).toSucceed();
  });

  test('validated options are nominal: a spread or a forged literal is not accepted', () => {
    const validated = JsonSchema.numberOptions({ minimum: 0 }).shouldNotFail('nominal source');
    // @ts-expect-error - a spread re-opens nothing: it is not an instance, and its kind is not plain
    expect(() => JsonSchema.number({ ...validated, maximum: -1 })).not.toThrow();
    // @ts-expect-error - a spread alone is not validated options either
    expect(() => JsonSchema.number({ ...validated })).not.toThrow();
    const literal = { minimum: 5, maximum: 1, kind: 'validated-number-options' } as const;
    // @ts-expect-error - the brand cannot be forged with a literal
    expect(() => JsonSchema.number(literal)).not.toThrow();
    const forged = { kind: 'validated-number-options', options: { minimum: 5, maximum: 1 } } as const;
    // @ts-expect-error - nor with a literal shaped like an instance
    expect(() => JsonSchema.number(forged)).not.toThrow();
    // @ts-expect-error - string options are not number options
    expect(() => JsonSchema.number(JsonSchema.stringOptions({}).shouldNotFail('string'))).not.toThrow();
  });

  test('a widened options type carrying constraint keys is a compile error on a factory', () => {
    const wide: JsonSchema.INumberSchemaOptions = { minimum: 0 };
    // @ts-expect-error - the declared options interface carries range keywords
    expect(() => JsonSchema.number(wide)).not.toThrow();
    const partial: Partial<JsonSchema.IStringSchemaOptions> = { maxLength: 2 };
    // @ts-expect-error - so does a Partial of it
    expect(() => JsonSchema.string(partial)).not.toThrow();
    // @ts-expect-error - and an as-const literal
    expect(() => JsonSchema.integer({ minimum: 0 } as const)).not.toThrow();
    const raw = { minimum: 0, description: 'd' };
    // @ts-expect-error - and a spread of a raw object
    expect(() => JsonSchema.number({ ...raw })).not.toThrow();
  });

  test('an index-signature value is read for its plain keys only, so nothing unchecked is applied', () => {
    // TypeScript does not check an index signature against the plain options' `never` keys, so a
    // deliberately widened value compiles. The factory keeps only the plain keys of their declared
    // type and ignores everything else.
    const widened: Record<string, unknown> = { minimum: 5, maximum: 1, description: 'd', title: 7 };
    const schema = JsonSchema.number(widened);
    expect(schema.toJson()).toEqual({ type: 'number', description: 'd' });
    expect(schema.validate(3)).toSucceedWith(3);
  });

  test('a cast to a validated type is read as plain keys only, and the factory does not throw', () => {
    const cast = { minimum: 5, nullable: true } as unknown as JsonSchema.ValidatedNumberOptions;
    const schema = JsonSchema.number(cast);
    expect(schema.toJson()).toEqual({ type: ['number', 'null'] });
    expect(schema.validate(1)).toSucceedWith(1);
    expect(schema.validate(null)).toSucceed();
  });

  // Each case is a value that, applied unchecked, would make the validator and the wire disagree.
  const uncheckedCases: ReadonlyArray<[string, Record<string, unknown>, number]> = [
    ['a NaN minimum', { minimum: NaN }, 1],
    ['a string minimum', { minimum: '5' }, 1],
    ['a zero multipleOf', { multipleOf: 0 }, 0.5],
    ['a function default', { default: (): number => 1 }, 1]
  ];

  test.each(uncheckedCases)('%s outside validated options never reaches the node', (__name, raw, value) => {
    const schema = JsonSchema.number(raw);
    expect(schema.toJson()).toEqual({ type: 'number' });
    expect(schema.validate(value)).toSucceedWith(value);
    // The wire states exactly what the validator enforces: re-parsing it gives the same node.
    expect(JsonSchema.fromJson(schema.toJson())).toSucceedAndSatisfy((parsed) => {
      expect(parsed.toJson()).toEqual(schema.toJson());
      expect(parsed.validate(value)).toSucceedWith(value);
    });
  });

  test('a subclass declared outside the module cannot hand the base its own options', () => {
    class Forged extends JsonSchema.ValidatedNumberOptions {
      public constructor() {
        // @ts-expect-error - the construction token is module-private
        super({ minimum: NaN });
      }
    }
    const forged = new Forged();
    expect(forged.options).toEqual({});
    expect(JsonSchema.number(forged).toJson()).toEqual({ type: 'number' });
  });

  describe('options from another installed copy of the package', () => {
    const marker = Symbol.for('@fgv/ts-json-base.validated-options');

    /** A hand-built stand-in for an instance a second copy of the package constructed. */
    function foreign(options: Record<string, unknown>): JsonSchema.ValidatedNumberOptions {
      const instance = { kind: 'validated-number-options', options };
      Object.defineProperty(instance, marker, { value: 'validated-number-options' });
      return instance as unknown as JsonSchema.ValidatedNumberOptions;
    }

    test('are re-validated, and used when they pass', () => {
      const schema = JsonSchema.number(foreign({ minimum: 1, nullable: true, default: 2 }));
      expect(schema.toJson()).toEqual({ type: ['number', 'null'], minimum: 1, default: 2 });
      expect(schema.validate(null)).toSucceed();
      expect(schema.validate(0)).toFailWith(/minimum/);
    });

    test('are read through a prototype getter, as a real instance exposes them', () => {
      const proto = {
        get options(): Record<string, unknown> {
          return { maxLength: 2 };
        }
      };
      const instance = Object.create(proto) as Record<string, unknown>;
      Object.defineProperty(instance, marker, { value: 'validated-string-options' });
      const schema = JsonSchema.string(instance);
      expect(schema.toJson()).toEqual({ type: 'string', maxLength: 2 });
      expect(schema.validate('abc')).toFailWith(/maxLength/);
    });

    test('schema options are re-validated too', () => {
      const good = foreign({ default: true, title: 't' });
      expect(JsonSchema.boolean(good as unknown as JsonSchema.ValidatedSchemaOptions).toJson()).toEqual({
        type: 'boolean',
        title: 't',
        default: true
      });
      const bad = foreign({ default: NaN, title: 't' });
      expect(JsonSchema.boolean(bad as unknown as JsonSchema.ValidatedSchemaOptions).toJson()).toEqual({
        type: 'boolean',
        title: 't'
      });
      const badString = foreign({ minLength: -1, description: 'd' });
      expect(JsonSchema.string(badString as unknown as JsonSchema.ValidatedStringOptions).toJson()).toEqual({
        type: 'string',
        description: 'd'
      });
    });

    test('fall back to plain keys when re-validation fails', () => {
      const schema = JsonSchema.number(foreign({ minimum: 5, maximum: 1, description: 'd' }));
      expect(schema.toJson()).toEqual({ type: 'number', description: 'd' });
    });

    test('are re-validated for the factory they reach: number options to integer', () => {
      const own = JsonSchema.numberOptions({ exclusiveMinimum: 0, exclusiveMaximum: 1, title: 't' });
      // A number range need not hold an integer; at run time it is re-checked as an integer range.
      const loose = own.shouldNotFail('number range') as unknown as JsonSchema.ValidatedIntegerOptions;
      expect(JsonSchema.integer(loose).toJson()).toEqual({ type: 'integer', title: 't' });
      const fits = JsonSchema.numberOptions({ minimum: 1 }).shouldNotFail('fits');
      const cast = fits as unknown as JsonSchema.ValidatedIntegerOptions;
      expect(JsonSchema.integer(cast).toJson()).toEqual({ type: 'integer', minimum: 1 });
    });

    test('a marked value without readable options contributes nothing unchecked', () => {
      const bare = {} as Record<string, unknown>;
      Object.defineProperty(bare, marker, { value: 'validated-schema-options' });
      expect(JsonSchema.boolean(bare).toJson()).toEqual({ type: 'boolean' });
      expect(JsonSchema.string(bare).toJson()).toEqual({ type: 'string' });
      expect(JsonSchema.object({}, bare).toJson()).toEqual({
        type: 'object',
        properties: {},
        additionalProperties: false
      });
    });
  });

  test('validated default and examples are deeply frozen', () => {
    const v = JsonSchema.schemaOptions({ default: { a: [1] }, examples: [{ b: 2 }] }).shouldNotFail('frozen');
    expect(Object.isFrozen(v.options.default)).toBe(true);
    expect(Object.isFrozen((v.options.default as { a: number[] }).a)).toBe(true);
    expect(Object.isFrozen(v.options.examples)).toBe(true);
    expect(Object.isFrozen(v.options.examples?.[0])).toBe(true);
  });

  test('mutating what toJson() returned cannot alter the node', () => {
    const schema = JsonSchema.object(
      { a: JsonSchema.string() },
      JsonSchema.schemaOptions({ default: { a: 'x' }, examples: [{ a: 'y' }] }).shouldNotFail(
        'schema options'
      )
    );
    const first = schema.toJson();
    (first.default as JsonObject).a = 'changed';
    (first.examples as JsonObject[])[0].a = 'changed';
    (first.examples as JsonValue[]).push('extra');
    expect(schema.toJson()).toEqual(expect.objectContaining({ default: { a: 'x' }, examples: [{ a: 'y' }] }));
  });

  test('mutating the authored default after construction cannot alter the node', () => {
    const value: JsonObject = { k: 1 };
    const schema = JsonSchema.boolean(
      JsonSchema.schemaOptions({ default: value }).shouldNotFail('schema options')
    );
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
    const schema = JsonSchema.integer(
      JsonSchema.integerOptions({ exclusiveMinimum: big, maximum: big + 2 }).shouldNotFail('integer options')
    );
    expect(schema.validate(big + 2)).toSucceed();
    expect(JsonSchema.integerOptions({ exclusiveMinimum: big, maximum: big })).toFailWith(/leave no integer/);
  });
});
