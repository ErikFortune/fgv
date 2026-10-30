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

import '../helpers/jest';

import { Normalizer, Result, fail, succeed } from '../../packlets/base';
import { KeyValueConverters } from '../../packlets/collections';
import { Converter, Converters } from '../../packlets/conversion';
import { Validator, Validators } from '../../packlets/validation';

/**
 * Generous ceiling on a failure message: a bounded rendering of the value plus the converter's
 * own text. An unbounded rendering of the large or deep fixtures runs to hundreds of kilobytes.
 */
const MAX_MESSAGE_LENGTH: number = 1500;

class Socket {
  public readonly connecting: boolean = false;
  public parser?: { socket?: Socket };
}

interface IHostile {
  readonly name: string;
  readonly value: unknown;
  /** element-wise converters aggregate one error per element, which no formatter bounds */
  readonly wide?: boolean;
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
    { name: 'a cyclic object', value: cyclic },
    { name: 'a cyclic class instance', value: socket },
    { name: 'a BigInt', value: BigInt('9007199254740993') },
    { name: 'a symbol', value: Symbol('sym') },
    { name: 'a null-prototype object', value: Object.create(null) as object },
    { name: 'an object with a throwing getter', value: throwingGetter },
    { name: 'a Proxy whose traps throw', value: throwingProxy },
    { name: 'a large array', value: Array.from({ length: 100_000 }, (__, i) => i), wide: true },
    { name: 'deep nesting', value: deep }
  ];
}

function expectBoundedFailure(convert: () => Result<unknown>, accepted?: boolean): void {
  let result: Result<unknown> | undefined;
  expect(() => {
    result = convert();
  }).not.toThrow();
  if (accepted === true) {
    expect(result).toSucceed();
    return;
  }
  expect(result).toFailWith(/./);
  expect(result?.message?.length ?? 0).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH);
}

interface IFamily {
  readonly name: string;
  readonly convert: (from: unknown) => Result<unknown>;
  /** skip the large array for element-wise families */
  readonly elementWise?: boolean;
  /** hostile values this family legitimately accepts (an empty record, an absent optional field) */
  readonly accepts?: readonly string[];
}

const rejectAll = (from: unknown): from is never => false;

const converterFamilies: IFamily[] = [
  { name: 'Converters.string', convert: (v) => Converters.string.convert(v) },
  { name: 'Converters.number', convert: (v) => Converters.number.convert(v) },
  { name: 'Converters.boolean', convert: (v) => Converters.boolean.convert(v) },
  { name: 'Converters.enumeratedValue', convert: (v) => Converters.enumeratedValue(['a', 'b']).convert(v) },
  {
    name: 'Converters.mappedEnumeratedValue',
    convert: (v) => Converters.mappedEnumeratedValue<string>([['a', ['A']]]).convert(v)
  },
  {
    name: 'Converters.mappedEnumeratedValue with message',
    convert: (v) => Converters.mappedEnumeratedValue<string>([['a', ['A']]], 'unmapped').convert(v)
  },
  { name: 'Converters.literal', convert: (v) => Converters.literal('expected').convert(v) },
  { name: 'Converters.isA', convert: (v) => Converters.isA('never', rejectAll).convert(v) },
  {
    name: 'Converters.oneOf',
    convert: (v) => Converters.oneOf<unknown>([Converters.string, Converters.number]).convert(v)
  },
  {
    name: 'Converters.arrayOf',
    convert: (v) => Converters.arrayOf(Converters.string).convert(v),
    elementWise: true
  },
  {
    name: 'Converters.recordOf',
    convert: (v) => Converters.recordOf(Converters.string).convert(v),
    elementWise: true,
    accepts: ['a null-prototype object']
  },
  {
    name: 'Converters.mapOf',
    convert: (v) => Converters.mapOf(Converters.string).convert(v),
    elementWise: true,
    accepts: ['a null-prototype object']
  },
  { name: 'Converters.validateWith', convert: (v) => Converters.validateWith(rejectAll).convert(v) },
  {
    name: 'Converters.field',
    convert: (v) => Converters.field('remoteAddress', Converters.string).convert(v)
  },
  {
    name: 'Converters.optionalField',
    convert: (v) => Converters.optionalField('plain', Converters.number).convert(v),
    accepts: ['a cyclic object', 'a cyclic class instance', 'a null-prototype object']
  },
  {
    name: 'Converters.object (nested, mirroring personaility#713)',
    convert: (v) =>
      Converters.object({
        incoming: Converters.object({
          socket: Converters.object({ remoteAddress: Converters.string })
        })
      }).convert({ incoming: { socket: v } })
  },
  {
    name: 'Converters.strictObject',
    convert: (v) => Converters.strictObject({ remoteAddress: Converters.string }).convert(v)
  },
  {
    name: 'Converters.discriminatedObject',
    convert: (v) =>
      Converters.discriminatedObject<{ kind: 'x' }>('kind', {
        x: Converters.object({ kind: Converters.literal('x' as const) })
      }).convert(v)
  },
  {
    name: 'Converters.tuple',
    convert: (v) => Converters.tuple([Converters.string, Converters.number]).convert(v),
    elementWise: true
  },
  {
    name: 'Converters.compositeIdFromString',
    convert: (v) => Converters.compositeIdFromString(Converters.string, '.', Converters.string).convert(v)
  },
  {
    name: 'withTypeGuard',
    convert: (v) =>
      Converters.generic((from) => succeed(from))
        .withTypeGuard(rejectAll)
        .convert(v)
  },
  {
    name: 'withItemTypeGuard',
    convert: (v) =>
      Converters.generic((from) => succeed([from]))
        .withItemTypeGuard(rejectAll)
        .convert(v)
  },
  {
    name: 'withConstraint',
    convert: (v) =>
      Converters.generic((from) => succeed(from))
        .withConstraint(() => false)
        .convert(v)
  },
  {
    name: 'map / mapConvert / convertOptional',
    convert: (v) =>
      Converters.string
        .map((s) => succeed(s.length))
        .mapConvert(Converters.number)
        .convertOptional(v, undefined, 'failOnError')
  }
];

const validatorFamilies: IFamily[] = [
  { name: 'Validators.string', convert: (v) => Validators.string.validate(v) },
  { name: 'Validators.number', convert: (v) => Validators.number.validate(v) },
  { name: 'Validators.boolean', convert: (v) => Validators.boolean.validate(v) },
  { name: 'Validators.enumeratedValue', convert: (v) => Validators.enumeratedValue(['a', 'b']).validate(v) },
  { name: 'Validators.literal', convert: (v) => Validators.literal('expected').validate(v) },
  { name: 'Validators.isA', convert: (v) => Validators.isA('never', rejectAll).validate(v) },
  {
    name: 'Validators.oneOf',
    convert: (v) => Validators.oneOf<unknown>([Validators.string, Validators.number]).validate(v)
  },
  {
    name: 'Validators.arrayOf',
    convert: (v) => Validators.arrayOf(Validators.string).validate(v),
    elementWise: true
  },
  {
    name: 'Validators.recordOf',
    convert: (v) => Validators.recordOf(Validators.string).validate(v),
    elementWise: true,
    accepts: ['a null-prototype object']
  },
  {
    name: 'Validators.object (nested)',
    convert: (v) =>
      Validators.object<{ socket: { remoteAddress: string } }>({
        socket: Validators.object<{ remoteAddress: string }>({ remoteAddress: Validators.string })
      }).validate({ socket: v })
  },
  {
    name: 'Validators.compositeId',
    convert: (v) =>
      Validators.compositeId<string, string>({
        collectionId: Validators.string,
        separator: '.',
        itemId: Validators.string
      }).validate(v)
  },
  {
    name: 'withConstraint',
    convert: (v) =>
      Validators.generic<unknown>(() => true)
        .withConstraint(() => false)
        .validate(v)
  },
  {
    name: 'convert / validateOptional',
    convert: (v) => Validators.string.validateOptional(v)
  }
];

describe('failure messages never throw', () => {
  const hostile = hostileValues();

  describe.each(converterFamilies.map((f) => [f.name, f]))('%s', (__, family) => {
    test.each(
      hostile.filter((h) => !(h.wide === true && family.elementWise === true)).map((h) => [h.name, h])
    )('fails, without throwing and with a bounded message, for %s', (___, h) => {
      expectBoundedFailure(() => family.convert(h.value), family.accepts?.includes(h.name));
    });
  });

  describe.each(validatorFamilies.map((f) => [f.name, f]))('%s', (__, family) => {
    test.each(
      hostile.filter((h) => !(h.wide === true && family.elementWise === true)).map((h) => [h.name, h])
    )('fails, without throwing and with a bounded message, for %s', (___, h) => {
      expectBoundedFailure(() => family.convert(h.value), family.accepts?.includes(h.name));
    });
  });

  test('the nested object failure from personaility#713 names the field and renders the cycle', () => {
    const socket = new Socket();
    socket.parser = { socket };
    const nodeBindings = Converters.object({
      incoming: Converters.object({ socket: Converters.object({ remoteAddress: Converters.string }) })
    });
    expect(nodeBindings.convert({ incoming: { socket } })).toFailWith(
      /remoteAddress.*Socket \{"connecting":false,"parser":\{"socket":\[Circular\]\}\}/
    );
    expect(
      nodeBindings
        .convert({ incoming: { socket } })
        .onSuccess((b) => succeed(b.incoming.socket.remoteAddress))
        .orDefault('unknown')
    ).toBe('unknown');
  });

  test('KeyValueConverters.convertEntry fails, without throwing, for a malformed cyclic entry', () => {
    const kv = new KeyValueConverters({ key: Converters.string, value: Converters.number });
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    let result: Result<unknown> | undefined;
    expect(() => {
      result = kv.convertEntry(cyclic);
    }).not.toThrow();
    expect(result).toFailWith(/malformed entry: "\{"self":\[Circular\]\}"/);
  });

  test('a normalizer reports an unnormalizable value rather than rendering undefined', () => {
    const fn = (): number => 1;
    expect(new Normalizer().normalizeLiteral(fn)).toFailWith(/^cannot normalize \[Function fn\]$/);
  });
});

describe('the converter and validator boundary never throws', () => {
  test('a custom converter callback that throws becomes a Failure naming the error', () => {
    const throwing: Converter<string> = Converters.generic<string>(() => {
      throw new Error('callback exploded');
    });
    expect(throwing.convert('x')).toFailWith(/callback exploded/);
    expect(throwing.convertOptional('x', undefined, 'failOnError')).toFailWith(/callback exploded/);
    expect(throwing.optional().convert('x')).toFailWith(/callback exploded/);
    expect(Converters.object({ a: throwing }).convert({ a: 'x' })).toFailWith(/a: .*callback exploded/);
  });

  test('a custom validator function that throws becomes a Failure naming the error', () => {
    const throwing: Validator<string> = Validators.generic<string>(() => {
      throw new Error('validator exploded');
    });
    expect(throwing.validate('x')).toFailWith(/validator exploded/);
    expect(throwing.convert('x')).toFailWith(/validator exploded/);
    expect(throwing.guard('x')).toBe(false);
  });

  test('a converter that succeeds or fails normally is unaffected', () => {
    expect(Converters.generic((from) => succeed(from)).convert(1)).toSucceedWith(1);
    expect(Converters.generic(() => fail('plain failure')).convert(1)).toFailWith(/^plain failure$/);
    expect(Validators.generic(() => fail('plain failure')).validate(1)).toFailWith(/^plain failure$/);
  });
});
