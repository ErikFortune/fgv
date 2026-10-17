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

/** Parses `raw`, then checks that toJson → fromJson → toJson is stable. */
function expectRoundTrip(raw: JsonObject, emitted: JsonObject): void {
  expect(JsonSchema.fromJson(raw)).toSucceedAndSatisfy((schema) => {
    expect(schema.toJson()).toEqual(emitted);
    expect(JsonSchema.fromJson(schema.toJson())).toSucceedAndSatisfy((reparsed) => {
      expect(reparsed.toJson()).toEqual(emitted);
    });
  });
}

describe('JsonSchema — numeric and boolean enums', () => {
  describe('factories', () => {
    test('numberEnumOf emits type number plus enum, and accepts exactly the listed values', () => {
      const schema = JsonSchema.numberEnumOf([1.5, 2], { description: 'step' });
      expect(schema._type).toBe('enum');
      expect(schema.toJson()).toEqual({ type: 'number', enum: [1.5, 2], description: 'step' });
      expect(schema.validate(1.5)).toSucceedWith(1.5);
      expect(schema.convert(2)).toSucceedWith(2);
      expect(schema.validate(3)).toFailWith(/Invalid enumerated value 3 - expected: \(1\.5, 2\)/);
      // No coercion: a numeric string is not the number.
      expect(schema.validate('2')).toFailWith(/Invalid enumerated value "2"/);
      expect(schema.validate(null)).toFailWith(/Invalid enumerated value null/);
      expect(schema.validate(undefined)).toFailWith(/Invalid enumerated value undefined/);
      expect(schema.validate({})).toFailWith(/Invalid enumerated value an object/);
      expect(schema.validate([2])).toFailWith(/Invalid enumerated value an array/);
      expect(schema.validate(Symbol('s'))).toFailWith(/Invalid enumerated value a symbol/);
    });

    test('integerEnumOf emits type integer', () => {
      const schema = JsonSchema.integerEnumOf([1, 2, 3]);
      expect(schema.toJson()).toEqual({ type: 'integer', enum: [1, 2, 3] });
      expect(schema.validate(2)).toSucceedWith(2);
      expect(schema.validate(4)).toFail();
    });

    test('booleanEnumOf emits type boolean', () => {
      const schema = JsonSchema.booleanEnumOf([true]);
      expect(schema.toJson()).toEqual({ type: 'boolean', enum: [true] });
      expect(schema.validate(true)).toSucceedWith(true);
      expect(schema.validate(false)).toFailWith(/expected: \(true\)/);
      expect(schema.validate('true')).toFail();
    });

    test('a nullable numeric enum carries null in both type and enum, and accepts it', () => {
      const schema = JsonSchema.integerEnumOf([1, 2], { nullable: true });
      expect(schema.toJson()).toEqual({ type: ['integer', 'null'], enum: [1, 2, null] });
      expect(schema.validate(null)).toSucceedWith(null);
      expect(schema.validate(1)).toSucceedWith(1);
      expect(schema.validate(0)).toFail();
    });

    test('derives the literal union as its static type', () => {
      const levels = JsonSchema.integerEnumOf([1, 2]);
      const flag = JsonSchema.booleanEnumOf([true]);
      const nullable = JsonSchema.numberEnumOf([0.5], { nullable: true });
      const level: JsonSchema.Static<typeof levels> = 2;
      const on: JsonSchema.Static<typeof flag> = true;
      const maybe: JsonSchema.Static<typeof nullable> = null;
      // @ts-expect-error — 3 is not a member of the derived union
      const wrong: JsonSchema.Static<typeof levels> = 3;
      expect(levels.validate(level)).toSucceedWith(2);
      expect(flag.validate(on)).toSucceedWith(true);
      expect(nullable.validate(maybe)).toSucceedWith(null);
      expect(levels.validate(wrong)).toFail();
    });

    test('the node copies its values, so mutating the authored array cannot change it', () => {
      const values = [1, 2];
      const schema = JsonSchema.integerEnumOf(values);
      values.push(3);
      expect(schema.validate(3)).toFail();
      expect(schema.toJson()).toEqual({ type: 'integer', enum: [1, 2] });
    });

    test('duplicate members are accepted and emitted as given, as the string enumOf does', () => {
      expect(JsonSchema.enumOf(['a', 'a']).toJson()).toEqual({ type: 'string', enum: ['a', 'a'] });
      expect(JsonSchema.numberEnumOf([1.5, 1.5]).toJson()).toEqual({ type: 'number', enum: [1.5, 1.5] });
      expect(JsonSchema.integerEnumOf([1, 1]).toJson()).toEqual({ type: 'integer', enum: [1, 1] });
      expect(JsonSchema.booleanEnumOf([true, true]).toJson()).toEqual({ type: 'boolean', enum: [true, true] });
      expect(JsonSchema.integerEnumOf([1, 1]).validate(1)).toSucceedWith(1);
      expect(JsonSchema.fromJson({ type: 'integer', enum: [2, 2] })).toSucceedAndSatisfy((schema) => {
        expect(schema.toJson()).toEqual({ type: 'integer', enum: [2, 2] });
        expect(schema.validate(2)).toSucceedWith(2);
      });
      expect(JsonSchema.fromJson({ enum: ['a', 'a'] })).toSucceed();
    });

    test('-0 and 0 are one member, as === makes them', () => {
      const zero = JsonSchema.integerEnumOf([0]);
      expect(zero.validate(-0)).toSucceed();
      expect(JsonSchema.numberEnumOf([-0]).validate(0)).toSucceedWith(0);
      // JSON has no negative zero: the emitted list serializes it as 0.
      expect(JSON.stringify(JsonSchema.integerEnumOf([-0]).toJson())).toBe('{"type":"integer","enum":[0]}');
      expect(JsonSchema.fromJson({ type: 'integer', enum: [-0] })).toSucceedAndSatisfy((schema) => {
        expect(schema.validate(0)).toSucceed();
      });
    });

    test('refuses an incoherent value list at construction', () => {
      expect(() => JsonSchema.numberEnumOf([])).toThrow(/numberEnumOf: enum must list at least one value/);
      expect(() => JsonSchema.numberEnumOf([1, Number.NaN])).toThrow(/enum value NaN is not a number/);
      expect(() => JsonSchema.numberEnumOf([Infinity])).toThrow(/enum value Infinity is not a number/);
      expect(() => JsonSchema.integerEnumOf([1, 1.5])).toThrow(
        /integerEnumOf: enum value 1.5 is not an integer/
      );
      expect(() => JsonSchema.booleanEnumOf(['yes' as unknown as boolean])).toThrow(
        /booleanEnumOf: enum value "yes" is not a boolean/
      );
      expect(() => JsonSchema.numberEnumOf([{} as unknown as number])).toThrow(/enum value an object/);
      expect(() => JsonSchema.numberEnumOf([[] as unknown as number])).toThrow(/enum value an array/);
      expect(() => JsonSchema.numberEnumOf([null as unknown as number])).toThrow(/enum value null/);
      expect(() => JsonSchema.integerEnumOf([1], { default: (() => 1) as unknown as JsonValue })).toThrow(
        /integerEnumOf: default/
      );
    });
  });

  describe('fromJson', () => {
    test('accepts type number or integer with a numeric enum, and a typeless one as number', () => {
      expectRoundTrip({ type: 'number', enum: [1, 2.5] }, { type: 'number', enum: [1, 2.5] });
      expectRoundTrip({ type: 'integer', enum: [1, 2] }, { type: 'integer', enum: [1, 2] });
      expectRoundTrip({ enum: [1, 2] }, { type: 'number', enum: [1, 2] });
      expectRoundTrip({ type: 'boolean', enum: [false] }, { type: 'boolean', enum: [false] });
      expectRoundTrip({ enum: [true, false] }, { type: 'boolean', enum: [true, false] });
    });

    test('a nullable numeric enum, in both spellings, carries null in type and enum', () => {
      const emitted: JsonObject = { type: ['integer', 'null'], enum: [1, 2, null] };
      expectRoundTrip({ type: ['integer', 'null'], enum: [1, 2, null] }, emitted);
      expectRoundTrip({ anyOf: [{ type: 'integer', enum: [1, 2] }, { type: 'null' }] }, emitted);
      expect(JsonSchema.fromJson({ type: ['integer', 'null'], enum: [1, 2] })).toFailWith(
        /enum schema is nullable in its 'type' but not its 'enum'/
      );
    });

    test('refuses a type that does not admit the members', () => {
      expect(JsonSchema.fromJson({ type: 'integer', enum: [1, 2.5] })).toFailWith(
        /^#: enum value 2.5 is not an integer/
      );
      expect(JsonSchema.fromJson({ type: 'string', enum: [1] })).toFailWith(
        /enum schema declares conflicting 'type' 'string' for number values/
      );
      expect(JsonSchema.fromJson({ type: 'number', enum: ['a'] })).toFailWith(
        /enum schema declares conflicting 'type' 'number' for string values/
      );
      expect(JsonSchema.fromJson({ type: 'boolean', enum: [1] })).toFailWith(
        /conflicting 'type' 'boolean' for number values/
      );
      expect(JsonSchema.fromJson({ enum: [true, 1] })).toFailWith(/'enum' values must all be of one type/);
      expect(JsonSchema.fromJson({ enum: [null] })).toFailWith(/'enum' must be a non-empty array/);
    });

    test('a numeric constraint beside a numeric enum is refused; beside a string enum it is ignored', () => {
      expect(JsonSchema.fromJson({ type: 'integer', enum: [1, 2], minimum: 2 })).toFailWith(
        /^#: unsupported JSON Schema keyword 'minimum' beside 'enum'/
      );
      expect(JsonSchema.fromJson({ enum: [1], maxLength: 2 })).toFailWith(
        /unsupported JSON Schema keyword 'maxLength' beside 'enum'/
      );
      expect(JsonSchema.fromJson({ enum: ['a'], minimum: 2 })).toSucceed();
    });

    test('a non-finite member arriving at run time is a Failure, not a throw', () => {
      expect(JsonSchema.fromJson({ enum: [Infinity] })).toFailWith(/^#: enum value Infinity is not a number/);
    });
  });
});

describe('JsonSchema — scalar const', () => {
  test('maps const to the one-value enum of its type, emitted as enum', () => {
    expectRoundTrip({ const: 'a' }, { type: 'string', enum: ['a'] });
    expectRoundTrip(
      { type: 'string', const: 'a', description: 'd' },
      { type: 'string', enum: ['a'], description: 'd' }
    );
    expectRoundTrip({ const: 1.5 }, { type: 'number', enum: [1.5] });
    expectRoundTrip({ type: 'number', const: 2 }, { type: 'number', enum: [2] });
    expectRoundTrip({ type: 'integer', const: 2 }, { type: 'integer', enum: [2] });
    expectRoundTrip({ const: false }, { type: 'boolean', enum: [false] });
  });

  test('is enforced: a value it used to accept and drop is now refused (BREAKING)', () => {
    expect(JsonSchema.fromJson({ type: 'string', const: 'a' })).toSucceedAndSatisfy((schema) => {
      expect(schema.validate('a')).toSucceedWith('a');
      expect(schema.validate('b')).toFailWith(/Invalid enumerated value "b"/);
    });
    expect(JsonSchema.fromJson({ type: 'integer', const: 7 })).toSucceedAndSatisfy((schema) => {
      expect(schema.validate(7)).toSucceedWith(7);
      expect(schema.validate(8)).toFail();
    });
  });

  test('refuses an object, array or null value', () => {
    for (const value of [{ a: 1 }, [1], null]) {
      expect(JsonSchema.fromJson({ const: value } as JsonObject)).toFailWith(
        /^#: 'const' is supported only with a string, number or boolean value/
      );
    }
  });

  test('refuses a conflicting type, a union type, and const beside enum or a constraint', () => {
    expect(JsonSchema.fromJson({ type: 'number', const: 'a' })).toFailWith(
      /conflicting 'type' 'number' for string values/
    );
    expect(JsonSchema.fromJson({ type: 'integer', const: 1.5 })).toFailWith(
      /enum value 1.5 is not an integer/
    );
    expect(JsonSchema.fromJson({ type: 'object', const: 1 })).toFailWith(/conflicting 'type' 'object'/);
    expect(JsonSchema.fromJson({ type: ['string', 'null'], const: 'a' })).toFailWith(
      /'const' beside a union 'type' is not supported/
    );
    expect(JsonSchema.fromJson({ const: 'a', enum: ['a', 'b'] })).toFailWith(
      /unsupported JSON Schema keyword 'const' beside 'enum'/
    );
    expect(JsonSchema.fromJson({ const: 'a', minLength: 1 })).toFailWith(
      /unsupported JSON Schema keyword 'minLength' beside 'const'/
    );
    expect(JsonSchema.fromJson({ const: 3, maximum: 1 })).toFailWith(
      /unsupported JSON Schema keyword 'maximum' beside 'const'/
    );
    expect(JsonSchema.fromJson({ const: 1, type: 7 } as unknown as JsonObject)).toFailWith(
      /enum schema 'type' field must be a string or absent/
    );
  });

  test('a const property names its path', () => {
    expect(
      JsonSchema.fromJson({ type: 'object', properties: { k: { const: [1] } } } as unknown as JsonObject)
    ).toFailWith(/^#\/properties\/k: 'const' is supported only/);
  });
});

describe('JsonSchema — anyValue / {}', () => {
  test('the factory emits {} plus annotations, and accepts any JSON value as a copy', () => {
    const schema = JsonSchema.anyValue({
      description: 'anything',
      title: 'Any',
      default: null,
      examples: [1]
    });
    expect(schema._type).toBe('any');
    expect(JsonSchema.isSchemaValidator(schema)).toBe(true);
    expect(schema.toJson()).toEqual({ description: 'anything', title: 'Any', default: null, examples: [1] });
    expect(JsonSchema.anyValue().toJson()).toEqual({});
    for (const value of [null, 0, 'x', true, [1, 'a'], { a: { b: null } }]) {
      expect(schema.validate(value)).toSucceedWith(value);
      expect(schema.convert(value)).toSucceedWith(value);
    }
    const input = { a: [1] };
    expect(schema.validate(input)).toSucceedAndSatisfy((out) => {
      expect(out).not.toBe(input);
    });
  });

  test('refuses a value that is not JSON', () => {
    const schema = JsonSchema.anyValue();
    expect(schema.validate(undefined)).toFail();
    expect(schema.validate(() => 1)).toFail();
    expect(schema.validate({ a: undefined })).toFail();
  });

  test('refuses an annotation that is not JSON at construction', () => {
    expect(() => JsonSchema.anyValue({ default: (() => 1) as unknown as JsonValue })).toThrow(
      /anyValue: default/
    );
  });

  test('derives JsonValue as its static type, and composes as an optional or required property', () => {
    const schema = JsonSchema.object({
      payload: JsonSchema.anyValue(),
      extra: JsonSchema.optional(JsonSchema.anyValue())
    });
    const value: JsonSchema.Static<typeof schema> = { payload: { any: ['thing'] } };
    expect(schema.validate(value)).toSucceedWith(value);
    expect(schema.validate({})).toFail();
    expect(schema.toJson()).toEqual({
      type: 'object',
      properties: { payload: {}, extra: {} },
      required: ['payload'],
      additionalProperties: false
    });
  });

  test('fromJson maps {} and annotations-only to any, and keeps additionalProperties: {} an open object', () => {
    expectRoundTrip({}, {});
    expectRoundTrip({ description: 'd', title: 't' }, { description: 'd', title: 't' });
    expectRoundTrip({ type: 'array', items: {} }, { type: 'array', items: {} });
    expect(JsonSchema.fromJson({ type: 'object', additionalProperties: {} })).toSucceedAndSatisfy(
      (schema) => {
        expect(schema._type).toBe('object');
        expect(schema.toJson()).toEqual({ type: 'object', properties: {} });
        expect(schema.validate({ a: 1 })).toSucceedWith({ a: 1 });
      }
    );
  });

  test('a $ref to {} and a nullable anyOf of {} are any; a oneOf of {} and null is refused', () => {
    expectRoundTrip({ $defs: { A: {} }, $ref: '#/$defs/A', description: 'd' }, { description: 'd' });
    expectRoundTrip({ anyOf: [{}, { type: 'null' }] }, {});
    expect(JsonSchema.fromJson({ oneOf: [{}, { type: 'null' }] })).toFailWith(/also admits null/);
  });

  test('a record of any emits additionalProperties: {}', () => {
    expect(JsonSchema.record(JsonSchema.anyValue()).toJson()).toEqual({
      type: 'object',
      properties: {},
      additionalProperties: {}
    });
  });
});

describe('JsonSchema.adaptSchemaKeywords — non-string enums and untyped nodes', () => {
  const caps = (
    nonStringEnum: 'pass' | 'fold',
    untyped: 'pass' | 'refuse'
  ): JsonSchema.SchemaKeywordCapabilities => ({
    ...JsonSchema.unverifiedWireSchemaKeywords,
    nonStringEnum,
    untyped
  });

  test('the fold text states a folded enum first', () => {
    expect(
      JsonSchema.foldedKeywordsText([
        ['default', 1],
        ['minimum', 0],
        ['enum', [1, 2]]
      ])
    ).toBe('Constraints: enum [1,2]; minimum 0. Default: 1.');
  });

  test('fold removes a numeric or boolean enum and keeps the type; the validator still enforces it', () => {
    const schema = JsonSchema.integerEnumOf([1, 2], { description: 'Level.' });
    expect(JsonSchema.adaptSchemaKeywords(schema.toJson(), caps('fold', 'refuse'))).toSucceedWith({
      type: 'integer',
      description: 'Level. Constraints: enum [1,2].'
    });
    expect(schema.validate(3)).toFail();
    expect(
      JsonSchema.adaptSchemaKeywords(JsonSchema.booleanEnumOf([true]).toJson(), caps('fold', 'refuse'))
    ).toSucceedWith({ type: 'boolean', description: 'Constraints: enum [true].' });
    expect(
      JsonSchema.adaptSchemaKeywords(
        JsonSchema.numberEnumOf([0.5], { nullable: true }).toJson(),
        caps('fold', 'refuse')
      )
    ).toSucceedWith({ type: ['number', 'null'], description: 'Constraints: enum [0.5,null].' });
  });

  test('a string enum always passes, nullable or not', () => {
    for (const schema of [JsonSchema.enumOf(['a', 'b']), JsonSchema.enumOf(['a'], { nullable: true })]) {
      expect(JsonSchema.adaptSchemaKeywords(schema.toJson(), caps('fold', 'refuse'))).toSucceedWith(
        schema.toJson()
      );
    }
  });

  test('pass sends a numeric enum as emitted', () => {
    const json = JsonSchema.numberEnumOf([1, 2]).toJson();
    expect(JsonSchema.adaptSchemaKeywords(json, caps('pass', 'refuse'))).toSucceedWith(json);
  });

  test('refuse fails on an untyped node, naming its path', () => {
    const schema = JsonSchema.object({
      ok: JsonSchema.string(),
      'a/b~c\n\u007fé\u2028\u2029': JsonSchema.optional(JsonSchema.anyValue())
    });
    expect(JsonSchema.adaptSchemaKeywords(schema.toJson(), caps('fold', 'refuse'))).toFailWith(
      /^#\/properties\/a~1b~0c\\u000a\\u007fé\\u2028\\u2029: a schema with no 'type' \(matching any value\) cannot be sent on this wire$/
    );
    expect(
      JsonSchema.adaptSchemaKeywords(JsonSchema.array(JsonSchema.anyValue()).toJson(), caps('fold', 'refuse'))
    ).toFailWith(/^#\/items: a schema with no 'type'/);
    expect(JsonSchema.adaptSchemaKeywords({}, caps('fold', 'refuse'))).toFailWith(
      /^#: a schema with no 'type'/
    );
  });

  test('a node typed by something other than type is not untyped', () => {
    const nodes: JsonObject[] = [
      { enum: ['a'] },
      { const: 1 },
      { $ref: '#/x' },
      { anyOf: [] },
      { oneOf: [] },
      { allOf: [] }
    ];
    for (const node of nodes) {
      expect(JsonSchema.adaptSchemaKeywords(node, caps('pass', 'refuse'))).toSucceed();
    }
  });

  test('an untyped additionalProperties is exempt: it means any value for the undeclared keys', () => {
    const json = JsonSchema.record(JsonSchema.anyValue()).toJson();
    expect(JsonSchema.adaptSchemaKeywords(json, caps('fold', 'refuse'))).toSucceedWith(json);
  });

  test('pass sends an untyped node as emitted, its annotations still adapted', () => {
    expect(
      JsonSchema.adaptSchemaKeywords(
        JsonSchema.object({ x: JsonSchema.anyValue({ title: 'X', default: 1 }) }).toJson(),
        caps('fold', 'pass')
      )
    ).toSucceedWith({
      type: 'object',
      properties: { x: { description: 'Default: 1.' } },
      required: ['x'],
      additionalProperties: false
    });
  });

  test('the conservative table folds a non-string enum and refuses an untyped node', () => {
    expect(JsonSchema.unverifiedWireSchemaKeywords.nonStringEnum).toBe('fold');
    expect(JsonSchema.unverifiedWireSchemaKeywords.untyped).toBe('refuse');
  });
});
