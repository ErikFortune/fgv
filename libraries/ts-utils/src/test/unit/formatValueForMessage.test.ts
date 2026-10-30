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
  DEFAULT_FORMAT_VALUE_MAX_DEPTH,
  DEFAULT_FORMAT_VALUE_MAX_LENGTH,
  DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH,
  formatValueForMessage
} from '../../packlets/base';
import { SeededJsonValues } from '../helpers/seededJsonValues';

class Socket {
  public readonly connecting: boolean = false;
  public parser?: { socket?: Socket };
}

function cyclicSocket(): Socket {
  const socket = new Socket();
  socket.parser = { socket };
  return socket;
}

function throwingProxy(): object {
  return new Proxy(
    {},
    {
      get(): never {
        throw new Error('get trap');
      },
      ownKeys(): never {
        throw new Error('ownKeys trap');
      }
    }
  );
}

/** Adds an enumerable getter that throws, which makes JSON.stringify throw and selects the fallback. */
function withBomb<T extends object>(value: T): T {
  return Object.defineProperty(value, 'boom', {
    enumerable: true,
    get(): never {
      throw new Error('bomb');
    }
  });
}

describe('formatValueForMessage', () => {
  describe('compatibility with JSON.stringify for JSON-safe values', () => {
    const representative: unknown[] = [
      'hello',
      '',
      'quote " and backslash \\ and newline \n and \u0001 control',
      'emoji 😀 and lone surrogate \ud800',
      0,
      -0,
      1.5,
      -42,
      1e21,
      Number.MAX_SAFE_INTEGER,
      true,
      false,
      null,
      [],
      {},
      [1, 'two', null, false],
      { a: 1, b: 'two', c: null, d: [true, { e: [] }] },
      JSON.parse('{"":1,"key with \\"quotes\\"":2,"2":"numeric key ordering","z":{}}'),
      [[[[]]], [{}], [{ x: [1, [2, [3]]] }]],
      JSON.parse('{"parsed":{"from":"text"},"arr":[1,2,3]}')
    ];

    test.each(representative.map((v) => [JSON.stringify(v), v]))('compact %s', (__, value) => {
      expect(formatValueForMessage(value)).toBe(JSON.stringify(value));
    });

    test.each(representative.map((v) => [JSON.stringify(v), v]))('indented %s', (__, value) => {
      expect(formatValueForMessage(value, { indent: 2 })).toBe(JSON.stringify(value, undefined, 2));
      expect(formatValueForMessage(value, { indent: 4, maxLength: 1000 })).toBe(
        JSON.stringify(value, undefined, 4)
      );
    });

    test('matches for non-finite numbers, which JSON renders as null', () => {
      expect(formatValueForMessage(NaN)).toBe(JSON.stringify(NaN));
      expect(formatValueForMessage([Infinity, -Infinity])).toBe(JSON.stringify([Infinity, -Infinity]));
    });

    test('matches for a null-prototype object', () => {
      const bare = Object.assign(Object.create(null) as Record<string, unknown>, { a: 1, b: [2] });
      expect(formatValueForMessage(bare)).toBe(JSON.stringify(bare));
    });

    test('matches for dates, valid and invalid', () => {
      const values = [new Date(Date.UTC(2020, 1, 3, 4, 5, 6, 7)), new Date(NaN), { when: new Date(0) }];
      for (const value of values) {
        expect(formatValueForMessage(value)).toBe(JSON.stringify(value));
      }
    });

    test('matches for a repeated (non-cyclic) reference', () => {
      const shared = { s: 1 };
      const value = { a: shared, b: [shared, shared] };
      expect(formatValueForMessage(value)).toBe(JSON.stringify(value));
    });

    test('matches JSON.stringify over generated JSON values that fit the bound', () => {
      const values = new SeededJsonValues(0x5eed).generate(500);
      let compared = 0;
      for (const value of values) {
        const expected = JSON.stringify(value);
        if (expected.length <= DEFAULT_FORMAT_VALUE_MAX_LENGTH) {
          expect(formatValueForMessage(value)).toBe(expected);
          compared++;
        }
        const unbounded = formatValueForMessage(value, {
          maxLength: Number.MAX_SAFE_INTEGER,
          maxDepth: Number.MAX_SAFE_INTEGER
        });
        expect(unbounded).toBe(expected);
        expect(formatValueForMessage(value, { indent: 2, maxLength: Number.MAX_SAFE_INTEGER })).toBe(
          JSON.stringify(value, undefined, 2)
        );
      }
      // the generator must actually exercise both sides of the bound
      expect(compared).toBeGreaterThan(100);
      expect(compared).toBeLessThan(values.length);
    });

    test('truncated output is a prefix of JSON.stringify followed by an ellipsis', () => {
      const values = new SeededJsonValues(0xbeef).generate(300);
      for (const value of values) {
        const expected = JSON.stringify(value);
        const actual = formatValueForMessage(value, { maxLength: 40 });
        if (expected.length <= 40) {
          expect(actual).toBe(expected);
        } else {
          expect(actual.length).toBeLessThanOrEqual(40);
          expect(actual.endsWith('…')).toBe(true);
          expect(expected.startsWith(actual.slice(0, -1))).toBe(true);
        }
      }
    });
  });

  describe('values JSON.stringify used to render without throwing are rendered byte-identically', () => {
    class Foo {
      public readonly a: number = 1;
    }
    class LateDate extends Date {
      public toJSON(): string {
        return 'z';
      }
    }
    const previouslyRendered: Array<[string, unknown]> = [
      ['undefined property', { a: 1, b: undefined }],
      ['undefined in an array', [1, undefined]],
      ['function property', { a: 1, f(): void {} }],
      ['symbol property value', { a: Symbol('x') }],
      ['class instance', new Foo()],
      ['toJSON object', { toJSON: (): string => 'X', a: 1 }],
      ['Map', new Map([[1, 2]])],
      ['Set', new Set([1])],
      ['Error', new Error('e')],
      ['boxed primitives', [Object('ab') as unknown, Object(1) as unknown, Object(true) as unknown]],
      ['typed array', new Uint8Array([1, 2])],
      ['Date subclass with toJSON', new LateDate(0)],
      ['array with an extra property', Object.assign([1], { x: 2 })],
      ['nesting deeper than maxDepth', JSON.parse(`${'['.repeat(17)}1${']'.repeat(17)}`)],
      ['repeated non-cyclic reference', ((s): unknown => ({ a: s, b: [s, s] }))({ s: 1 })]
    ];

    test.each(previouslyRendered)('%s', (__, value) => {
      expect(formatValueForMessage(value)).toBe(JSON.stringify(value));
      expect(formatValueForMessage(value, { indent: 2, maxLength: 10_000 })).toBe(
        JSON.stringify(value, undefined, 2)
      );
    });

    test('invokes toJSON, as JSON.stringify does', () => {
      let calls = 0;
      const value = {
        a: 1,
        toJSON(): string {
          calls++;
          return 'projected';
        }
      };
      expect(formatValueForMessage(value)).toBe('"projected"');
      expect(calls).toBe(1);
    });
  });

  describe('values JSON.stringify throws on', () => {
    test('renders a cycle on the active path as "[Circular]"', () => {
      const node: Record<string, unknown> = { name: 'node' };
      node.self = node;
      expect(() => JSON.stringify(node)).toThrow(/circular/i);
      expect(formatValueForMessage(node)).toBe('{"name":"node","self":"[Circular]"}');
      expect(formatValueForMessage(cyclicSocket())).toBe(
        '{"connecting":false,"parser":{"socket":"[Circular]"}}'
      );
      const arr: unknown[] = [1];
      arr.push(arr);
      expect(formatValueForMessage(arr)).toBe('[1,"[Circular]"]');
    });

    test('renders a cycle reached through toJSON', () => {
      const node: Record<string, unknown> = {};
      const projected = { node };
      node.toJSON = (): unknown => projected;
      expect(formatValueForMessage(node)).toBe('{"node":"[Circular]"}');
    });

    test('renders a BigInt as "123n"', () => {
      expect(formatValueForMessage(BigInt(123))).toBe('"123n"');
      expect(formatValueForMessage({ big: BigInt(-5), n: [BigInt(1)] })).toBe('{"big":"-5n","n":["1n"]}');
    });

    test('renders a top-level undefined, symbol or function as a readable token', () => {
      expect(formatValueForMessage(undefined)).toBe('undefined');
      expect(formatValueForMessage(Symbol('tag'))).toBe('Symbol(tag)');
      expect(formatValueForMessage(Symbol())).toBe('Symbol()');
      expect(formatValueForMessage(function named(): void {})).toBe('[Function named]');
      expect(formatValueForMessage(() => 1)).toBe('[Function (anonymous)]');
      const fn = new Proxy(() => 1, {
        get(): never {
          throw new Error('nope');
        }
      });
      expect(formatValueForMessage(fn)).toBe('[Function (anonymous)]');
      const unnamed = Object.defineProperty(() => 1, 'name', { value: 42 });
      expect(formatValueForMessage(unnamed)).toBe('[Function (anonymous)]');
    });
  });

  describe('the fallback renderer, used when JSON.stringify still throws', () => {
    test('contains a throwing getter as [Unreadable]', () => {
      expect(formatValueForMessage(withBomb({ ok: 1 }))).toBe('{"ok":1,"boom":[Unreadable]}');
    });

    test('contains a throwing toJSON', () => {
      const value = {
        a: 1,
        toJSON(): never {
          throw new Error('toJSON exploded');
        }
      };
      expect(formatValueForMessage(value)).toBe('{"a":1,"toJSON":[Function toJSON]}');
    });

    test('contains a Proxy whose traps throw', () => {
      expect(formatValueForMessage(throwingProxy())).toBe('[Unreadable]');
      expect(formatValueForMessage({ inner: throwingProxy() })).toBe('{"inner":[Unreadable]}');
      const getOnly = new Proxy(
        { a: 1 },
        {
          get(): never {
            throw new Error('get trap');
          }
        }
      );
      expect(formatValueForMessage(getOnly)).toBe('{"a":[Unreadable]}');
      const { proxy, revoke } = Proxy.revocable({}, {});
      revoke();
      expect(formatValueForMessage(proxy)).toBe('[Unreadable]');
    });

    test('renders cycles, BigInt, symbols, functions and undefined as bare tokens', () => {
      const node: Record<string, unknown> = { name: 'node' };
      node.self = node;
      expect(
        formatValueForMessage(
          withBomb({ node, big: BigInt(-5), u: undefined, f: Math.max, s: Symbol('x'), a: [undefined] })
        )
      ).toBe(
        '{"node":{"name":"node","self":[Circular]},"big":-5n,"u":undefined,"f":[Function max],' +
          '"s":Symbol(x),"a":[undefined],"boom":[Unreadable]}'
      );
    });

    test('renders class instances, typed arrays, dates and collections', () => {
      class Point {
        public readonly x: number;
        public constructor(x: number) {
          this.x = x;
        }
      }
      expect(formatValueForMessage(withBomb(new Point(1)))).toBe('Point {"x":1,"boom":[Unreadable]}');
      expect(formatValueForMessage(withBomb(new Point(1)), { indent: 2 })).toBe(
        'Point {\n  "x": 1,\n  "boom": [Unreadable]\n}'
      );
      expect(
        formatValueForMessage(
          withBomb({
            t: new Uint8Array([1, 2, 3]),
            m: new Map([['a', 1]]),
            e: new Error('boom'),
            v: new DataView(new ArrayBuffer(2)),
            d: new Date(0),
            bad: new Date(NaN),
            pd: new Proxy(new Date(0), {})
          })
        )
      ).toBe(
        '{"t":Uint8Array [1,2,3],"m":Map {},"e":Error {},"v":DataView {},' +
          '"d":"1970-01-01T00:00:00.000Z","bad":null,"pd":Date {},"boom":[Unreadable]}'
      );
    });

    test('renders null-prototype and orphaned-prototype objects', () => {
      const bare = Object.assign(Object.create(null) as Record<string, unknown>, { a: 1 });
      const orphan = Object.create(Object.create(null) as object) as Record<string, unknown>;
      orphan.a = 1;
      const nested = Object.create({ inherited: true }) as Record<string, unknown>;
      nested.own = 1;
      expect(formatValueForMessage(withBomb({ bare, orphan, nested }))).toBe(
        '{"bare":{"a":1},"orphan":Object {"a":1},"nested":Object {"own":1},"boom":[Unreadable]}'
      );
    });

    test('elides containers beyond the maximum depth', () => {
      expect(formatValueForMessage(withBomb({ a: [[1]] }), { maxDepth: 2 })).toBe(
        '{"a":[[…]],"boom":[Unreadable]}'
      );
      expect(formatValueForMessage(withBomb({ a: { b: 1 }, e: [] }), { maxDepth: 1 })).toBe(
        '{"a":{…},"e":[],"boom":[Unreadable]}'
      );
      expect(formatValueForMessage(withBomb({ a: [] }), { maxDepth: 0 })).toBe('{…}');
      expect(DEFAULT_FORMAT_VALUE_MAX_DEPTH).toBeGreaterThan(0);
    });

    test('renders a long string inside a fallback rendering without serializing all of it', () => {
      const text = formatValueForMessage(withBomb({ s: 'x'.repeat(10_000_000) }), { maxLength: 12 });
      expect(text).toBe('{"s":"xxxxx…');
    });
  });

  describe('bounds', () => {
    test('truncates a large array to the default length with an ellipsis', () => {
      const large = Array.from({ length: 100000 }, (__, i) => i);
      const text = formatValueForMessage(large);
      expect(text.length).toBe(DEFAULT_FORMAT_VALUE_MAX_LENGTH);
      expect(text.endsWith('…')).toBe(true);
      expect(JSON.stringify(large).startsWith(text.slice(0, -1))).toBe(true);
    });

    test('truncates a very long string without serializing all of it', () => {
      const text = formatValueForMessage('x'.repeat(10_000_000), { maxLength: 10 });
      expect(text).toBe('"xxxxxxxx…');
    });

    test('does not split a surrogate pair at the cut', () => {
      expect(formatValueForMessage('😀😀😀', { maxLength: 3 })).toBe('"…');
      expect(formatValueForMessage('a😀😀', { maxLength: 4 })).toBe('"a…');
    });

    test('stops walking a large graph once the output is known to exceed the bound', () => {
      const wide: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        wide[`k${i}`] = wide;
      }
      const text = formatValueForMessage(wide, { maxLength: 50 });
      expect(text.length).toBe(50);
      expect(text).toMatch(/^\{"k0":\[Circular\],"k1":\[Circular\]/);
      let dag: unknown = 'leaf';
      for (let i = 0; i < 64; i++) {
        dag = { l: dag, r: dag };
      }
      // 2^64 paths: only a bounded walk returns at all
      expect(formatValueForMessage(dag).length).toBe(DEFAULT_FORMAT_VALUE_MAX_LENGTH);
    });

    test('caps a walk over members JSON.stringify omits', () => {
      const sparse: Record<string, unknown> = { first: 1 };
      for (let i = 0; i < 20_000; i++) {
        sparse[`u${i}`] = undefined;
      }
      expect(formatValueForMessage(sparse, { maxLength: 30 })).toBe('{"first":1,"u0":undefined,"u1…');
    });

    test('ignores invalid options and clamps indent like JSON.stringify', () => {
      const value = { a: [1] };
      expect(formatValueForMessage(value, { maxLength: 0, maxDepth: -1, indent: -3 })).toBe('{"a":[1]}');
      expect(
        formatValueForMessage(value, {
          maxLength: 'x' as unknown as number,
          maxDepth: NaN,
          indent: 'y' as unknown as number
        })
      ).toBe('{"a":[1]}');
      expect(formatValueForMessage(value, { indent: 40 })).toBe(JSON.stringify(value, undefined, 40));
      expect(formatValueForMessage(value, { indent: 2.7 })).toBe(JSON.stringify(value, undefined, 2.7));
    });

    test('returns [Unreadable] rather than throwing for options whose accessors throw', () => {
      const hostile = {
        get maxLength(): number {
          throw new Error('options exploded');
        }
      };
      expect(formatValueForMessage({ a: 1 }, hostile)).toBe('[Unreadable]');
    });

    test('renders with String() in the string style, with its own larger default bound', () => {
      expect(formatValueForMessage('text', { style: 'string' })).toBe('text');
      expect(formatValueForMessage({ a: 1 }, { style: 'string' })).toBe('[object Object]');
      expect(formatValueForMessage([1, [2, 3]], { style: 'string' })).toBe('1,2,3');
      expect(formatValueForMessage(Symbol('s'), { style: 'string' })).toBe('Symbol(s)');
      expect(formatValueForMessage(undefined, { style: 'string' })).toBe('undefined');
      expect(formatValueForMessage('y'.repeat(500), { style: 'string' })).toBe('y'.repeat(500));
      expect(formatValueForMessage('y'.repeat(5000), { style: 'string' })).toBe(
        `${'y'.repeat(DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH - 1)}…`
      );
      expect(formatValueForMessage('y'.repeat(500), { style: 'string', maxLength: 5 })).toBe('yyyy…');
      const bare = Object.assign(Object.create(null) as Record<string, unknown>, { a: 1 });
      expect(formatValueForMessage(bare, { style: 'string' })).toBe('{"a":1}');
      expect(formatValueForMessage(throwingProxy(), { style: 'string' })).toBe('[Unreadable]');
      expect(formatValueForMessage({ a: 1 }, { style: 'json' })).toBe('{"a":1}');
    });

    test('does not throw when both bounds are lifted on a graph deeper than the stack', () => {
      let deep: unknown[] = [];
      for (let i = 0; i < 200_000; i++) {
        deep = [deep];
      }
      expect(() => formatValueForMessage(deep, { maxLength: Infinity, maxDepth: Infinity })).not.toThrow();
    });
  });
});
