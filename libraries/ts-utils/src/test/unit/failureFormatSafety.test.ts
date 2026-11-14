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

import {
  Normalizer,
  Result,
  _resolveResultBoundary,
  _resultBoundary,
  captureResult,
  fail,
  succeed
} from '../../packlets/base';
import { KeyValueConverters } from '../../packlets/collections';
import { Converter, Converters } from '../../packlets/conversion';
import { Validator, Validators } from '../../packlets/validation';
import { runIsolated } from '../helpers/isolatedRun';

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
      /remoteAddress.*\{"connecting":false,"parser":\{"socket":"\[Circular\]"\}\}/
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
    expect(result).toFailWith(/malformed entry: "\{"self":"\[Circular\]"\}"/);
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
    expect(throwing.convert('x')).toFailWith(/^converter threw: callback exploded$/);
    expect(throwing.convertOptional('x', undefined, 'failOnError')).toFailWith(/callback exploded/);
    expect(throwing.optional().convert('x')).toFailWith(/callback exploded/);
    expect(Converters.object({ a: throwing }).convert({ a: 'x' })).toFailWith(/a: .*callback exploded/);
  });

  test('a custom validator function that throws becomes a Failure naming the error', () => {
    const throwing: Validator<string> = Validators.generic<string>(() => {
      throw new Error('validator exploded');
    });
    expect(throwing.validate('x')).toFailWith(/^validator threw: validator exploded$/);
    expect(throwing.convert('x')).toFailWith(/validator exploded/);
    expect(throwing.guard('x')).toBe(false);
  });

  test('a converter that succeeds or fails normally is unaffected', () => {
    expect(Converters.generic((from) => succeed(from)).convert(1)).toSucceedWith(1);
    expect(Converters.generic(() => fail('plain failure')).convert(1)).toFailWith(/^plain failure$/);
    expect(Validators.generic(() => fail('plain failure')).validate(1)).toFailWith(/^plain failure$/);
  });
});

describe('the boundary depth across copies of the package', () => {
  test('two independently loaded copies of the boundary module share one depth', async () => {
    let copy: { _resultBoundary: { depth: number } } | undefined;
    await jest.isolateModulesAsync(async () => {
      copy = await import('../../packlets/base/boundary');
    });
    expect(copy).toBeDefined();
    expect(copy?._resultBoundary).toBe(_resultBoundary);
    expect(_resolveResultBoundary()).toBe(_resultBoundary);
    expect(_resultBoundary.depth).toBe(0);
  });
});

describe('stack exhaustion inside nested converters and validators', () => {
  // A converter that recurses through every member of its input, as the recursive JSON converters
  // do, with no cycle check of its own.
  const walk: Converter<unknown> = Converters.generic<unknown>((from, self) =>
    Converters.recordOf(self).convert(from)
  );
  const validateWalk: Validator<unknown> = Validators.generic<unknown>((from) => {
    const inner = Validators.recordOf(validateWalk).validate(from);
    return inner.isSuccess() ? true : fail(inner.message);
  });

  function selfCycle(edges: number): Record<string, unknown> {
    const node: Record<string, unknown> = {};
    for (let i = 0; i < edges; i++) {
      node[`k${i}`] = node;
    }
    return node;
  }

  test('fails once, at the outermost boundary, with a short message', () => {
    for (const result of [walk.convert(selfCycle(1)), validateWalk.validate(selfCycle(1))]) {
      expect(result).toFailWith(/^(converter|validator) threw: .*(call stack|recursion)/i);
      expect(result.message?.length).toBeLessThan(200);
    }
  });

  describe('an ordinary RangeError is handled by the nearest boundary', () => {
    // new Date('bad').toISOString() throws RangeError: Invalid time value
    const date = Converters.generic<string>((from) =>
      succeed(new Date(typeof from === 'number' ? from : String(from)).toISOString())
    );
    const throwsRangeError: Validator<unknown> = Validators.generic<unknown>(() => {
      throw new RangeError('Invalid array length');
    });

    test('keeping its nested path', () => {
      const outer = Converters.object({ a: Converters.object({ b: date }) });
      expect(outer.convert({ a: { b: 'bad' } })).toFailWith(
        /^Field a: Field b: converter threw: Invalid time value$/
      );
    });

    test('so ignoreErrors, oneOf and optional still apply', () => {
      expect(Converters.arrayOf(date, 'ignoreErrors').convert([0, 'bad'])).toSucceedWith([
        '1970-01-01T00:00:00.000Z'
      ]);
      expect(Converters.oneOf<string>([date, Converters.string]).convert('bad')).toSucceedWith('bad');
      expect(
        Converters.object({ d: date.optional('ignoreErrors'), n: Converters.number }).convert({
          d: 'bad',
          n: 1
        })
      ).toSucceedWith({ d: undefined, n: 1 });
      expect(
        Converters.object({ x: Converters.number })
          .convert({ x: 1 })
          .onSuccess(() => date.convertOptional('bad', undefined, 'ignoreErrors'))
      ).toSucceedWith(undefined);
    });

    test('so a nested guard answers false instead of throwing', () => {
      const guarded = Converters.isA('anything', (v: unknown): v is unknown => throwsRangeError.guard(v));
      expect(Converters.arrayOf(guarded, 'ignoreErrors').convert([1])).toSucceedWith([]);
      expect(
        Converters.arrayOf(Converters.generic((v) => throwsRangeError.validate(v))).convert([1])
      ).toFailWith(/validator threw: Invalid array length/);
    });

    test('while a RangeError that reads as stack exhaustion is propagated', () => {
      for (const message of ['Maximum call stack size exceeded', 'too much recursion']) {
        const inner = Converters.generic<unknown>(() => {
          throw new RangeError(message);
        });
        expect(Converters.object({ a: Converters.object({ b: inner }) }).convert({ a: { b: 1 } })).toFailWith(
          `converter threw: ${message}`
        );
      }
    });
  });

  test('a captureResult between two nested converters catches the propagated exhaustion itself', () => {
    const inner = Converters.generic<unknown>(() => {
      throw new RangeError('Maximum call stack size exceeded');
    });
    const between = Converters.generic<unknown>((from) =>
      captureResult(() => inner.convert(from)).onSuccess((r) => r)
    );
    expect(Converters.object({ a: between }).convert({ a: 1 })).toFailWith(
      /^Field a: Maximum call stack size exceeded$/
    );
  });

  test('an error that only looks like a RangeError by name is propagated the same way', () => {
    const inner = Converters.generic<unknown>(() => {
      throw Object.assign(new Error('too much recursion'), { name: 'InternalError' });
    });
    const unreadable = Converters.generic<unknown>(() => {
      throw new Proxy(
        {},
        {
          getPrototypeOf(): never {
            throw new Error('trap');
          },
          get(): never {
            throw new Error('trap');
          }
        }
      );
    });
    expect(Converters.object({ a: inner }).convert({ a: 1 })).toFailWith(
      /^converter threw: too much recursion$/
    );
    const text: unknown = 'plain text';
    const thrownText = Converters.generic<unknown>(() => {
      throw text;
    });
    expect(Converters.object({ a: thrownText }).convert({ a: 1 })).toFailWith(
      /^Field a: converter threw: plain text$/
    );
    expect(Converters.object({ a: unreadable }).convert({ a: 1 })).toFailWith(
      /^converter threw: an error whose message could not be read$/
    );
  });

  // Each case runs in its own process with a hard limit: before the fix, each one did not finish.
  const entryPoint = require.resolve('../../index');
  const cases: Array<[string, string]> = [
    [
      'two back-edges (converter)',
      `const a = {}; a.k0 = a; a.k1 = a;
       const walk = lib.Converters.generic((from, self) => lib.Converters.recordOf(self).convert(from));
       const r = walk.convert(a);`
    ],
    [
      'two back-edges (validator)',
      `const a = {}; a.k0 = a; a.k1 = a;
       const walk = lib.Validators.generic((from, ctx, self) => {
         const inner = lib.Validators.recordOf(self).validate(from);
         return inner.isSuccess() ? true : lib.fail(inner.message);
       });
       const r = walk.validate(a);`
    ],
    [
      'a socket-shaped graph with several back-edges',
      `const s = { connecting: false }; s.parser = { socket: s }; s.server = { owner: s }; s.self = s;
       const walk = lib.Converters.generic((from, self) =>
         typeof from === 'object' && from !== null ? lib.Converters.recordOf(self).convert(from) : lib.fail('leaf'));
       const r = walk.convert(s);`
    ],
    [
      'a deep DAG with two edges per level',
      `let d = 'leaf'; for (let i = 0; i < 20000; i++) d = { l: d, r: d };
       const walk = lib.Converters.generic((from, self) =>
         typeof from === 'object' ? lib.Converters.recordOf(self).convert(from) : lib.succeed(from));
       const r = walk.convert(d);`
    ]
  ];

  test.each(cases)(
    '%s finishes quickly and fails with a short message',
    (__, script) => {
      const run = runIsolated(
        entryPoint,
        `${script}\nprocess.stdout.write(JSON.stringify({ failed: r.isFailure(), length: r.message.length }) + '\\n');`,
        15_000
      );
      expect(run.timedOut).toBe(false);
      expect(run.report).toEqual({ failed: true, length: expect.any(Number) });
      expect((run.report as { length: number }).length).toBeLessThan(500);
    },
    30_000
  );
});
