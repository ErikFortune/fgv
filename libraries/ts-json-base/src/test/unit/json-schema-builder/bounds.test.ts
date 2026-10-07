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

/** An array schema nested `levels` deep: the root is depth 0 and the string leaf is depth `levels`. */
function arrayChain(levels: number): JsonObject {
  let schema: JsonObject = { type: 'string' };
  for (let i = 0; i < levels; i++) {
    schema = { type: 'array', items: schema };
  }
  return schema;
}

/** A value matching `arrayChain(levels)`. */
function nestedValue(levels: number): unknown {
  let value: unknown = 'x';
  for (let i = 0; i < levels; i++) {
    value = [value];
  }
  return value;
}

describe('JsonSchema.fromJson — depth bound', () => {
  test('a chain exactly at the depth limit converts and validates', () => {
    expect(JsonSchema.fromJson(arrayChain(128))).toSucceedAndSatisfy((schema) => {
      expect(schema.validate(nestedValue(128))).toSucceed();
      expect(schema.validate(nestedValue(127))).toFail();
    });
  });

  test('one level past the limit fails with a depth message', () => {
    expect(JsonSchema.fromJson(arrayChain(129))).toFailWith(
      /: the schema nests deeper than the limit of 128 levels$/
    );
  });

  test('a 20000-deep chain fails with a Result rather than exhausting the stack', () => {
    expect(() => JsonSchema.fromJson(arrayChain(20000))).not.toThrow();
    expect(JsonSchema.fromJson(arrayChain(20000))).toFailWith(/nests deeper than the limit of 128 levels/);
  });

  test('nesting through $ref expansions counts toward the same limit', () => {
    // 31 definitions, each four arrays deep and then a reference to the next: well inside the
    // 32-reference nesting limit, but about 155 levels deep once expanded.
    const defs: JsonObject = {};
    for (let i = 0; i < 31; i++) {
      defs[`D${i}`] = {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'array', items: { type: 'array', items: { $ref: `#/$defs/D${i + 1}` } } }
        }
      };
    }
    defs.D31 = { type: 'string' };
    expect(JsonSchema.fromJson({ $defs: defs, $ref: '#/$defs/D0' })).toFailWith(
      /nests deeper than the limit of 128 levels/
    );
  });

  test('an accessor that throws while the schema is read becomes a failure, not an exception', () => {
    const hostile = Object.defineProperty({}, 'type', {
      enumerable: true,
      get(): never {
        throw new Error('boom');
      }
    }) as JsonObject;
    expect(() => JsonSchema.fromJson(hostile)).not.toThrow();
    expect(JsonSchema.fromJson(hostile)).toFailWith(/^#: boom/);
  });
});
