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
import { Result } from '@fgv/ts-utils';
import { Converters, JsonSchema, Validators, classifyJsonValue } from '../..';

const MAX_MESSAGE_LENGTH: number = 1500;

class Socket {
  public readonly connecting: boolean = false;
  public parser?: { socket?: Socket };
}

interface IHostile {
  readonly name: string;
  readonly value: unknown;
  /**
   * The recursive JSON converters walk a cyclic or very deep value until the stack is exhausted.
   * The boundary turns that into a failure, but its message carries one property-path prefix per
   * level walked, which no value formatter bounds.
   */
  readonly exhaustsRecursion?: boolean;
}

function hostileValues(): IHostile[] {
  const cyclic: Record<string, unknown> = { name: 'cyclic' };
  cyclic.self = cyclic;
  const socket = new Socket();
  socket.parser = { socket };
  const throwingGetter = {
    plain: 'ok',
    get boom(): string {
      throw new Error('getter exploded');
    }
  };
  const trap = (): never => {
    throw new Error('trap exploded');
  };
  const throwingProxy = new Proxy(
    {},
    { get: trap, has: trap, ownKeys: trap, getOwnPropertyDescriptor: trap, getPrototypeOf: trap }
  );
  let deep: unknown = 'bottom';
  for (let i = 0; i < 100_000; i++) {
    deep = [deep];
  }
  return [
    { name: 'a cyclic object', value: cyclic, exhaustsRecursion: true },
    { name: 'a cyclic class instance', value: socket, exhaustsRecursion: true },
    { name: 'a BigInt', value: BigInt('9007199254740993') },
    { name: 'a symbol', value: Symbol('sym') },
    { name: 'an object with a throwing getter', value: throwingGetter },
    { name: 'a Proxy whose traps throw', value: throwingProxy },
    { name: 'deep nesting', value: deep, exhaustsRecursion: true }
  ];
}

interface IFamily {
  readonly name: string;
  readonly convert: (from: unknown) => Result<unknown>;
  readonly recursive?: boolean;
}

const families: IFamily[] = [
  { name: 'Converters.jsonPrimitive', convert: (v) => Converters.jsonPrimitive.convert(v) },
  {
    name: 'Converters.jsonObject',
    convert: (v) => Converters.jsonObject.convert({ wrapped: v }),
    recursive: true
  },
  { name: 'Converters.jsonArray', convert: (v) => Converters.jsonArray.convert([v]), recursive: true },
  {
    name: 'Converters.jsonValue',
    convert: (v) => Converters.jsonValue.convert({ wrapped: [v] }),
    recursive: true
  },
  { name: 'Converters.literal', convert: (v) => Converters.literal('expected').convert(v) },
  { name: 'Converters.enumeratedValue', convert: (v) => Converters.enumeratedValue(['a', 'b']).convert(v) },
  { name: 'Validators.jsonPrimitive', convert: (v) => Validators.jsonPrimitive.validate(v) },
  {
    name: 'Validators.jsonObject',
    convert: (v) => Validators.jsonObject.validate({ wrapped: v }),
    recursive: true
  },
  { name: 'Validators.jsonArray', convert: (v) => Validators.jsonArray.validate([v]), recursive: true },
  {
    name: 'Validators.jsonValue',
    convert: (v) => Validators.jsonValue.validate({ wrapped: [v] }),
    recursive: true
  },
  { name: 'Validators.literal', convert: (v) => Validators.literal('expected').validate(v) },
  { name: 'Validators.enumeratedValue', convert: (v) => Validators.enumeratedValue(['a', 'b']).validate(v) },
  {
    name: 'JsonSchema.object',
    convert: (v) =>
      JsonSchema.object({ socket: JsonSchema.object({ remoteAddress: JsonSchema.string() }) }).validate({
        socket: v
      })
  },
  { name: 'JsonSchema.enumOf', convert: (v) => JsonSchema.enumOf(['a', 'b']).validate(v) },
  { name: 'JsonSchema.array', convert: (v) => JsonSchema.array(JsonSchema.string()).validate(v) }
];

describe('ts-json-base failure messages never throw', () => {
  const hostile = hostileValues();

  describe.each(families.map((f) => [f.name, f]))('%s', (__, family) => {
    test.each(hostile.map((h) => [h.name, h]))(
      'fails, without throwing and with a bounded message, for %s',
      (___, h) => {
        let result: Result<unknown> | undefined;
        expect(() => {
          result = family.convert(h.value);
        }).not.toThrow();
        expect(result).toFailWith(/./);
        if (!(family.recursive === true && h.exhaustsRecursion === true)) {
          expect(result?.message?.length ?? 0).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH);
        }
      }
    );
  });

  test('keeps the established text for an ordinary invalid primitive', () => {
    expect(Converters.jsonPrimitive.convert(() => 1)).toFailWith(/^"\(\) => 1": invalid JSON primitive\.$/);
    expect(Converters.enumeratedValue(['a']).convert('z')).toFailWith(/^Invalid enumerated value "z"$/);
    expect(Validators.literal('a').validate('z')).toFailWith(/^Expected literal a, found "z"$/);
  });

  test('renders a cyclic value instead of throwing', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(Converters.enumeratedValue(['a']).convert(cyclic)).toFailWith(
      /^Invalid enumerated value \{"self":\[Circular\]\}$/
    );
    expect(Validators.literal('a').validate(cyclic)).toFailWith(/found \{"self":\[Circular\]\}$/);
    expect(classifyJsonValue(Symbol('s'))).toFailWith(/^Invalid JSON: Symbol\(s\)$/);
    expect(classifyJsonValue(BigInt(5))).toFailWith(/^Invalid JSON: 5$/);
    expect(classifyJsonValue(() => 1)).toFailWith(/^Invalid JSON: \(\) => 1$/);
  });
});
