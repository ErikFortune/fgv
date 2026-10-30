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
import { runIsolated } from '../helpers/isolatedRun';

const MAX_MESSAGE_LENGTH: number = 1500;

class Socket {
  public readonly connecting: boolean = false;
  public parser?: { socket?: Socket };
}

interface IHostile {
  readonly name: string;
  readonly value: unknown;
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
    { name: 'an object with a throwing getter', value: throwingGetter },
    { name: 'a Proxy whose traps throw', value: throwingProxy },
    { name: 'deep nesting', value: deep }
  ];
}

interface IFamily {
  readonly name: string;
  readonly convert: (from: unknown) => Result<unknown>;
}

const families: IFamily[] = [
  { name: 'Converters.jsonPrimitive', convert: (v) => Converters.jsonPrimitive.convert(v) },
  {
    name: 'Converters.jsonObject',
    convert: (v) => Converters.jsonObject.convert({ wrapped: v })
  },
  { name: 'Converters.jsonArray', convert: (v) => Converters.jsonArray.convert([v]) },
  {
    name: 'Converters.jsonValue',
    convert: (v) => Converters.jsonValue.convert({ wrapped: [v] })
  },
  { name: 'Converters.literal', convert: (v) => Converters.literal('expected').convert(v) },
  { name: 'Converters.enumeratedValue', convert: (v) => Converters.enumeratedValue(['a', 'b']).convert(v) },
  { name: 'Validators.jsonPrimitive', convert: (v) => Validators.jsonPrimitive.validate(v) },
  {
    name: 'Validators.jsonObject',
    convert: (v) => Validators.jsonObject.validate({ wrapped: v })
  },
  { name: 'Validators.jsonArray', convert: (v) => Validators.jsonArray.validate([v]) },
  {
    name: 'Validators.jsonValue',
    convert: (v) => Validators.jsonValue.validate({ wrapped: [v] })
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
        expect(result?.message?.length ?? 0).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH);
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
      /^Invalid enumerated value \{"self":"\[Circular\]"\}$/
    );
    expect(Validators.literal('a').validate(cyclic)).toFailWith(/found \{"self":"\[Circular\]"\}$/);
    expect(classifyJsonValue(Symbol('s'))).toFailWith(/^Invalid JSON: Symbol\(s\)$/);
    expect(classifyJsonValue(BigInt(5))).toFailWith(/^Invalid JSON: 5$/);
    expect(classifyJsonValue(() => 1)).toFailWith(/^Invalid JSON: \(\) => 1$/);
  });
});

describe('the recursive JSON converters and validators on a cycle', () => {
  function selfCycle(edges: number): Record<string, unknown> {
    const node: Record<string, unknown> = {};
    for (let i = 0; i < edges; i++) {
      node[`k${i}`] = node;
    }
    return node;
  }

  test('fail at once, naming the path to the repeated object', () => {
    const results = [
      Converters.jsonValue.convert(selfCycle(2)),
      Converters.jsonObject.convert(selfCycle(2)),
      Validators.jsonValue.validate(selfCycle(2)),
      Validators.jsonObject.validate(selfCycle(2))
    ];
    for (const result of results) {
      expect(result).toFailWith(/k0: circular reference at \$\.k0\nk1: circular reference at \$\.k1$/);
    }
    const arr: unknown[] = [1];
    arr.push({ back: arr });
    expect(Converters.jsonArray.convert(arr)).toFailWith(/circular reference at \$\[1\]\.back/);
    expect(Validators.jsonArray.validate(arr)).toFailWith(/circular reference at \$\[1\]\.back/);
  });

  test('accept a value that shares a reference without a cycle, and leave no state behind', () => {
    const shared = { s: 1 };
    const dag = { a: shared, b: [shared, shared] };
    expect(Converters.jsonValue.convert(dag)).toSucceedWith({ a: { s: 1 }, b: [{ s: 1 }, { s: 1 }] });
    expect(Validators.jsonValue.validate(dag)).toSucceedWith(dag);
    // a failed walk must not leave entries that report a false cycle later
    expect(Converters.jsonValue.convert(selfCycle(1))).toFail();
    expect(Converters.jsonValue.convert(dag)).toSucceed();
  });

  test('a walk cut short by stack exhaustion fails once and leaves no state behind', () => {
    let deep: unknown = 'bottom';
    for (let i = 0; i < 100_000; i++) {
      deep = { d: deep };
    }
    const result = Converters.jsonValue.convert(deep);
    expect(result).toFailWith(/^converter threw: /);
    expect(result.message?.length).toBeLessThan(200);
    expect(Converters.jsonValue.convert({ ok: [1] })).toSucceedWith({ ok: [1] });
  });

  // Each case runs in its own process with a hard limit: before the fix, each one did not finish.
  const entryPoint = require.resolve('../..');
  const cases: Array<[string, string]> = [
    [
      'two back-edges (jsonValue converter)',
      'const a = {}; a.k0 = a; a.k1 = a; const r = lib.Converters.jsonValue.convert(a);'
    ],
    [
      'two back-edges (jsonValue validator)',
      'const a = {}; a.k0 = a; a.k1 = a; const r = lib.Validators.jsonValue.validate(a);'
    ],
    [
      'the socket shape (jsonObject converter)',
      'const s = { connecting: false }; s.parser = { socket: s }; s.server = { owner: s }; const r = lib.Converters.jsonObject.convert(s);'
    ],
    [
      'the socket shape (jsonValue validator)',
      'const s = { connecting: false }; s.parser = { socket: s }; s.server = { owner: s }; const r = lib.Validators.jsonValue.validate(s);'
    ],
    [
      'a deep DAG with two edges per level',
      "let d = 'x'; for (let i = 0; i < 20000; i++) d = { l: d, r: d }; const r = lib.Converters.jsonValue.convert(d);"
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

describe('classifyJsonValue', () => {
  test('fails instead of throwing for a Proxy whose traps throw', () => {
    const trap = (): never => {
      throw new Error('trap exploded');
    };
    const hostile = new Proxy({}, { get: trap, getPrototypeOf: trap, ownKeys: trap });
    expect(classifyJsonValue(hostile)).toFailWith(/^Invalid JSON: .*trap exploded$/);
  });
});
