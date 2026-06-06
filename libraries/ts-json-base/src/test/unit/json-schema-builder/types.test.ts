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
import { JsonSchema } from '../../..';

/**
 * Compile-time helper: only accepts `true` when `T` and `U` are mutually assignable (the same
 * type). A mismatch collapses the parameter type to `never`, so passing `true` fails to compile.
 */
type Exact<T, U> = [T] extends [U] ? ([U] extends [T] ? true : never) : never;
function assertExact<T, U>(proof: Exact<T, U>): Exact<T, U> {
  return proof;
}

describe('JsonSchema phantom types', () => {
  test('Static<S> derives leaf types', () => {
    assertExact<JsonSchema.Static<ReturnType<typeof JsonSchema.string>>, string>(true);
    assertExact<JsonSchema.Static<ReturnType<typeof JsonSchema.number>>, number>(true);
    assertExact<JsonSchema.Static<ReturnType<typeof JsonSchema.integer>>, number>(true);
    assertExact<JsonSchema.Static<ReturnType<typeof JsonSchema.boolean>>, boolean>(true);
    expect(true).toBe(true);
  });

  test('Static<S> derives enum unions', () => {
    const schema = JsonSchema.enumOf(['run', 'stop'] as const);
    assertExact<JsonSchema.Static<typeof schema>, 'run' | 'stop'>(true);
    expect((schema as unknown as { enum: ReadonlyArray<string> }).enum).toEqual(['run', 'stop']);
  });

  test('Static<S> derives array element types', () => {
    const schema = JsonSchema.array(JsonSchema.string());
    assertExact<JsonSchema.Static<typeof schema>, string[]>(true);
    expect(schema._type).toBe('array');
  });

  test('Static<S> derives the required/optional object split without assertions', () => {
    const schema = JsonSchema.object({
      query: JsonSchema.string(),
      limit: JsonSchema.optional(JsonSchema.number())
    });
    assertExact<JsonSchema.Static<typeof schema>, { query: string; limit?: number }>(true);
    expect(schema._type).toBe('object');
  });

  test('Static<S> derives deeply nested shapes', () => {
    const schema = JsonSchema.object({
      action: JsonSchema.enumOf(['run', 'stop'] as const),
      config: JsonSchema.object({
        timeout: JsonSchema.optional(JsonSchema.integer()),
        tags: JsonSchema.array(JsonSchema.string())
      })
    });
    assertExact<
      JsonSchema.Static<typeof schema>,
      { action: 'run' | 'stop'; config: { timeout?: number; tags: string[] } }
    >(true);
    expect(schema._type).toBe('object');
  });

  test('factories reject non-schema arguments at compile time', () => {
    // @ts-expect-error - a bare number is not a schema node
    JsonSchema.object({ x: 5 });
    // @ts-expect-error - optional requires a schema argument
    JsonSchema.optional(5);
    // @ts-expect-error - array requires a schema argument
    JsonSchema.array(5);
    expect(true).toBe(true);
  });
});
