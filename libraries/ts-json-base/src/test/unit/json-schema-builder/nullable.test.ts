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
import { Result, succeed } from '@fgv/ts-utils';
import { JsonObject } from '../../../packlets/json';
import { JsonSchema } from '../../..';

describe('JsonSchema nullable', () => {
  describe('wire emission', () => {
    test('every scalar factory widens `type` to a union', () => {
      expect(JsonSchema.string({ nullable: true }).toJson()).toEqual({ type: ['string', 'null'] });
      expect(JsonSchema.number({ nullable: true }).toJson()).toEqual({ type: ['number', 'null'] });
      expect(JsonSchema.integer({ nullable: true }).toJson()).toEqual({ type: ['integer', 'null'] });
      expect(JsonSchema.boolean({ nullable: true }).toJson()).toEqual({ type: ['boolean', 'null'] });
    });

    test('array and object widen `type` and keep everything else', () => {
      expect(JsonSchema.array(JsonSchema.string(), { nullable: true }).toJson()).toEqual({
        type: ['array', 'null'],
        items: { type: 'string' }
      });
      expect(JsonSchema.object({ a: JsonSchema.string() }, { nullable: true }).toJson()).toEqual({
        type: ['object', 'null'],
        properties: { a: { type: 'string' } },
        required: ['a'],
        additionalProperties: false
      });
    });

    test('an enum carries null in BOTH type and enum', () => {
      // Not decoration: a reader consulting `enum` alone would otherwise reject the value
      // `type` says is allowed, which is the two halves of one node disagreeing.
      expect(JsonSchema.enumOf(['a', 'b'], { nullable: true }).toJson()).toEqual({
        type: ['string', 'null'],
        enum: ['a', 'b', null]
      });
    });

    test('emits the draft-07 union, never the OpenAPI `nullable` keyword', () => {
      // The option name and the wire spelling are different dialects on purpose: OpenAI
      // strict mode ignores `nullable: true`. The Gemini adapter translates at its own edge.
      const raw = JsonSchema.string({ nullable: true, description: 'why' }).toJson();
      expect(raw).toEqual({ type: ['string', 'null'], description: 'why' });
      expect(Object.keys(raw)).not.toContain('nullable');
    });

    test('nullable: false is the same as omitting it', () => {
      expect(JsonSchema.string({ nullable: false }).toJson()).toEqual({ type: 'string' });
    });
  });

  describe('validation', () => {
    test('accepts null and the underlying type, through both validate and convert', () => {
      const schema = JsonSchema.string({ nullable: true });
      expect(schema.validate(null)).toSucceedWith(null);
      expect(schema.convert(null)).toSucceedWith(null);
      expect(schema.validate('hi')).toSucceedWith('hi');
      expect(schema.convert('hi')).toSucceedWith('hi');
      expect(schema.validate(3)).toFail();
    });

    test('a non-nullable node still rejects null', () => {
      expect(JsonSchema.string().validate(null)).toFail();
      expect(JsonSchema.object({ a: JsonSchema.string() }).validate(null)).toFail();
    });

    test('null is accepted by every factory', () => {
      expect(JsonSchema.number({ nullable: true }).validate(null)).toSucceedWith(null);
      expect(JsonSchema.integer({ nullable: true }).validate(null)).toSucceedWith(null);
      expect(JsonSchema.boolean({ nullable: true }).validate(null)).toSucceedWith(null);
      expect(JsonSchema.enumOf(['a'], { nullable: true }).validate(null)).toSucceedWith(null);
      expect(JsonSchema.array(JsonSchema.string(), { nullable: true }).validate(null)).toSucceedWith(null);
      expect(JsonSchema.object({ a: JsonSchema.string() }, { nullable: true }).validate(null)).toSucceedWith(
        null
      );
    });

    test('a non-strict nullable number still coerces its non-null values', () => {
      const schema = JsonSchema.number({ nullable: true, strict: false });
      expect(schema.validate(null)).toSucceedWith(null);
      expect(schema.convert('42')).toSucceedWith(42);
    });

    test('a nullable property is null-or-value inside an object', () => {
      const schema = JsonSchema.object({ note: JsonSchema.string({ nullable: true }) });
      expect(schema.validate({ note: null })).toSucceedWith({ note: null });
      expect(schema.validate({ note: 'x' })).toSucceedWith({ note: 'x' });
      expect(schema.validate({})).toFail();
    });

    test('optional and nullable compose — absent, null, or a value', () => {
      const schema = JsonSchema.object({
        note: JsonSchema.optional(JsonSchema.string({ nullable: true }))
      });
      expect(schema.validate({})).toSucceedWith({});
      expect(schema.validate({ note: null })).toSucceedWith({ note: null });
      expect(schema.validate({ note: 'x' })).toSucceedWith({ note: 'x' });
    });
  });

  describe('required, not optional — the point of the feature', () => {
    test('a nullable property stays in `required`', () => {
      // OpenAI strict mode rejects any property missing from `required`; this is the whole
      // reason a caller reaches for nullable rather than optional.
      const raw = JsonSchema.object({
        keep: JsonSchema.string({ nullable: true }),
        drop: JsonSchema.optional(JsonSchema.string())
      }).toJson();
      expect(raw.required).toEqual(['keep']);
    });
  });

  describe('Static type derivation', () => {
    test('widens to `| null` and stays assignable', () => {
      const schema = JsonSchema.object({
        name: JsonSchema.string(),
        note: JsonSchema.string({ nullable: true }),
        count: JsonSchema.integer({ nullable: true })
      });
      type T = JsonSchema.Static<typeof schema>;

      // Compile-time assertions: `null` is admissible in the nullable slots and not the
      // plain one. A runtime-only check would pass against an un-widened `Static`.
      const withNulls: T = { name: 'n', note: null, count: null };
      const withValues: T = { name: 'n', note: 'x', count: 1 };
      // @ts-expect-error — `name` is not nullable, so `null` must not type-check here.
      const bad: T = { name: null, note: null, count: null };

      expect(schema.validate(withNulls)).toSucceedWith(withNulls);
      expect(schema.validate(withValues)).toSucceedWith(withValues);
      expect(schema.validate(bad)).toFail();
    });
  });

  describe('round trip through fromJson — the proxy path', () => {
    /**
     * `callProxiedCompletion` forwards a schema in draft-07 wire form and the proxy
     * reconstitutes it with `fromJson`. If the parser refused what the emitter produces,
     * every nullable schema would break over the proxy — our own code refusing our own
     * output. These are the tests that pin that, and they fail against a `fromJson` that
     * rejects union `type` arrays outright.
     */
    function roundTrip(schema: { toJson(): JsonObject }): Result<JsonObject> {
      return JsonSchema.fromJson(schema.toJson()).onSuccess((reparsed) => succeed(reparsed.toJson()));
    }

    test('every nullable node survives emit → parse → emit unchanged', () => {
      for (const schema of [
        JsonSchema.string({ nullable: true }),
        JsonSchema.number({ nullable: true }),
        JsonSchema.integer({ nullable: true }),
        JsonSchema.boolean({ nullable: true }),
        JsonSchema.array(JsonSchema.string(), { nullable: true }),
        JsonSchema.enumOf(['a', 'b'], { nullable: true })
      ]) {
        expect(roundTrip(schema)).toSucceedWith(schema.toJson());
      }
    });

    test('a reparsed node accepts null, not just the shape', () => {
      // Emitting the right JSON is not the same as reconstituting the right validator.
      expect(JsonSchema.fromJson(JsonSchema.string({ nullable: true }).toJson())).toSucceedAndSatisfy(
        (reparsed) => {
          expect(reparsed.validate(null)).toSucceedWith(null);
          expect(reparsed.validate('x')).toSucceedWith('x');
          expect(reparsed.validate(1)).toFail();
        }
      );
    });

    test('a nested object of mixed nullability round-trips', () => {
      const schema = JsonSchema.object({
        name: JsonSchema.string(),
        note: JsonSchema.string({ nullable: true }),
        tags: JsonSchema.array(JsonSchema.enumOf(['x', 'y'], { nullable: true })),
        inner: JsonSchema.object({ n: JsonSchema.integer({ nullable: true }) }, { nullable: true })
      });
      expect(roundTrip(schema)).toSucceedWith(schema.toJson());
    });

    test('order within the union does not matter', () => {
      expect(JsonSchema.fromJson({ type: ['null', 'string'] } as unknown as JsonObject)).toSucceedAndSatisfy(
        (schema) => {
          expect(schema.validate(null)).toSucceedWith(null);
          expect(schema.toJson()).toEqual({ type: ['string', 'null'] });
        }
      );
    });

    test('rejects an enum whose type and values disagree about null', () => {
      // Our emitter always writes both; a source that writes one is describing two
      // different schemas and there is no honest way to pick.
      expect(
        JsonSchema.fromJson({ type: ['string', 'null'], enum: ['a'] } as unknown as JsonObject)
      ).toFailWith(/nullable in its 'type' but not its 'enum'/i);
      expect(JsonSchema.fromJson({ type: 'string', enum: ['a', null] } as unknown as JsonObject)).toFailWith(
        /nullable in its 'enum' but not its 'type'/i
      );
    });

    test('rejects an enum of nothing but null', () => {
      expect(
        JsonSchema.fromJson({ type: ['string', 'null'], enum: [null] } as unknown as JsonObject)
      ).toFailWith(/non-empty/i);
    });

    test('rejects a nullable enum with a non-string member', () => {
      expect(
        JsonSchema.fromJson({ type: ['string', 'null'], enum: ['a', 1] } as unknown as JsonObject)
      ).toFail();
    });

    test('rejects a conflicting scalar type on a nullable enum', () => {
      expect(
        JsonSchema.fromJson({ type: ['integer', 'null'], enum: ['a', null] } as unknown as JsonObject)
      ).toFailWith(/conflicting 'type' 'integer'/i);
    });

    test('rejects an enum whose type union is not the nullable spelling', () => {
      // The enum arm does its own type parsing — `jsonSchemaConverter`'s pre-flight is
      // skipped for enum nodes — so the union rule has to hold on this path too.
      expect(
        JsonSchema.fromJson({ type: ['string', 'number'], enum: ['a'] } as unknown as JsonObject)
      ).toFailWith(/union 'type' arrays are supported only as \[<type>, 'null'\]/i);
    });

    test('rejects an enum whose type field is neither a string nor a supported union', () => {
      expect(JsonSchema.fromJson({ type: 7, enum: ['a'] } as unknown as JsonObject)).toFailWith(
        /'type' field must be a string or absent/i
      );
    });
  });
});
