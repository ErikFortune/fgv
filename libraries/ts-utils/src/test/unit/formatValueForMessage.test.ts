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

  describe('values JSON.stringify throws on or drops', () => {
    test('renders a cycle as [Circular] and returns', () => {
      const node: Record<string, unknown> = { name: 'node' };
      node.self = node;
      expect(() => JSON.stringify(node)).toThrow(/circular/i);
      expect(formatValueForMessage(node)).toBe('{"name":"node","self":[Circular]}');
    });

    test('renders a cycle through a class instance with its constructor name', () => {
      expect(formatValueForMessage(cyclicSocket())).toBe(
        'Socket {"connecting":false,"parser":{"socket":[Circular]}}'
      );
    });

    test('renders a cycle through an array', () => {
      const arr: unknown[] = [1];
      arr.push(arr);
      expect(formatValueForMessage(arr)).toBe('[1,[Circular]]');
    });

    test('renders BigInt, symbol, function and undefined as readable tokens', () => {
      expect(formatValueForMessage(BigInt(123))).toBe('123n');
      expect(formatValueForMessage(Symbol('tag'))).toBe('Symbol(tag)');
      expect(formatValueForMessage(Symbol())).toBe('Symbol()');
      expect(formatValueForMessage(function named(): void {})).toBe('[Function named]');
      expect(formatValueForMessage(() => 1)).toBe('[Function (anonymous)]');
      expect(formatValueForMessage(undefined)).toBe('undefined');
      expect(formatValueForMessage({ big: BigInt(-5), u: undefined, f: Math.max, s: Symbol('x') })).toBe(
        '{"big":-5n,"u":undefined,"f":[Function max],"s":Symbol(x)}'
      );
      expect(formatValueForMessage([undefined, BigInt(1)])).toBe('[undefined,1n]');
    });

    test('renders a function whose name cannot be read as anonymous', () => {
      const fn = new Proxy(() => 1, {
        get(): never {
          throw new Error('nope');
        }
      });
      expect(formatValueForMessage(fn)).toBe('[Function (anonymous)]');
      const unnamed = Object.defineProperty(() => 1, 'name', { value: 42 });
      expect(formatValueForMessage(unnamed)).toBe('[Function (anonymous)]');
    });

    test('contains a throwing getter as [Unreadable]', () => {
      const value = {
        ok: 1,
        get bad(): string {
          throw new Error('getter');
        }
      };
      expect(formatValueForMessage(value)).toBe('{"ok":1,"bad":[Unreadable]}');
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
    });

    test('contains a revoked Proxy', () => {
      const { proxy, revoke } = Proxy.revocable({}, {});
      revoke();
      expect(formatValueForMessage(proxy)).toBe('[Unreadable]');
    });

    test('does not invoke a user toJSON', () => {
      let calls = 0;
      const value = {
        a: 1,
        toJSON(): string {
          calls++;
          return 'projected';
        }
      };
      expect(formatValueForMessage(value)).toBe('{"a":1,"toJSON":[Function toJSON]}');
      expect(calls).toBe(0);
    });

    test('renders class instances, typed arrays and collections with their constructor name', () => {
      class Point {
        public readonly x: number;
        public readonly y: number;
        public constructor(x: number, y: number) {
          this.x = x;
          this.y = y;
        }
      }
      expect(formatValueForMessage(new Point(1, 2))).toBe('Point {"x":1,"y":2}');
      expect(formatValueForMessage(new Point(1, 2), { indent: 2 })).toBe('Point {\n  "x": 1,\n  "y": 2\n}');
      expect(formatValueForMessage(new Uint8Array([1, 2, 3]))).toBe('Uint8Array [1,2,3]');
      expect(formatValueForMessage(new Map([['a', 1]]))).toBe('Map {}');
      expect(formatValueForMessage(new Error('boom'))).toBe('Error {}');
      expect(formatValueForMessage(new DataView(new ArrayBuffer(2)))).toBe('DataView {}');
    });

    test('names an instance whose prototype has no usable constructor as Object', () => {
      const orphan = Object.create(Object.create(null) as object) as Record<string, unknown>;
      orphan.a = 1;
      expect(formatValueForMessage(orphan)).toBe('Object {"a":1}');
      const nested = Object.create({ inherited: true }) as Record<string, unknown>;
      nested.own = 1;
      expect(formatValueForMessage(nested)).toBe('Object {"own":1}');
    });

    test('renders a Proxy of a Date as an object, not a date', () => {
      const proxied = new Proxy(new Date(0), {});
      expect(formatValueForMessage(proxied)).toBe('Date {}');
    });
  });

  describe('bounds', () => {
    test('truncates a large array to the default length with an ellipsis', () => {
      const large = Array.from({ length: 100000 }, (__, i) => i);
      const text = formatValueForMessage(large);
      expect(text.length).toBe(DEFAULT_FORMAT_VALUE_MAX_LENGTH);
      expect(text.endsWith('…')).toBe(true);
      expect(text.startsWith('[0,1,2,3,')).toBe(true);
    });

    test('truncates a very long string without serializing all of it', () => {
      const text = formatValueForMessage('x'.repeat(10_000_000), { maxLength: 10 });
      expect(text).toBe('"xxxxxxxx…');
    });

    test('does not split a surrogate pair at the cut', () => {
      expect(formatValueForMessage('😀😀😀', { maxLength: 3 })).toBe('"…');
      expect(formatValueForMessage('a😀😀', { maxLength: 4 })).toBe('"a…');
    });

    test('elides containers beyond the maximum depth', () => {
      let deep: unknown = 'bottom';
      for (let i = 0; i < 40; i++) {
        deep = i % 2 === 0 ? [deep] : { d: deep };
      }
      const text = formatValueForMessage(deep, { maxLength: 10_000 });
      expect(text).toContain('…');
      expect(text).not.toContain('bottom');
      expect(formatValueForMessage([[1]], { maxDepth: 1 })).toBe('[[…]]');
      expect(formatValueForMessage({ a: { b: 1 } }, { maxDepth: 1 })).toBe('{"a":{…}}');
      expect(formatValueForMessage({ a: [] }, { maxDepth: 0 })).toBe('{…}');
      expect(formatValueForMessage([], { maxDepth: 0 })).toBe('[]');
      expect(DEFAULT_FORMAT_VALUE_MAX_DEPTH).toBeGreaterThan(0);
    });

    test('stops walking a large cyclic graph once the budget is spent', () => {
      const wide: Record<string, unknown> = {};
      for (let i = 0; i < 1000; i++) {
        wide[`k${i}`] = wide;
      }
      const text = formatValueForMessage(wide, { maxLength: 50 });
      expect(text.length).toBe(50);
      expect(text).toMatch(/^\{"k0":\[Circular\],"k1":\[Circular\]/);
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

    test('renders with String() in the string style, falling back to the JSON rendering', () => {
      expect(formatValueForMessage('text', { style: 'string' })).toBe('text');
      expect(formatValueForMessage({ a: 1 }, { style: 'string' })).toBe('[object Object]');
      expect(formatValueForMessage([1, [2, 3]], { style: 'string' })).toBe('1,2,3');
      expect(formatValueForMessage(Symbol('s'), { style: 'string' })).toBe('Symbol(s)');
      expect(formatValueForMessage(undefined, { style: 'string' })).toBe('undefined');
      const bare = Object.assign(Object.create(null) as Record<string, unknown>, { a: 1 });
      expect(formatValueForMessage(bare, { style: 'string' })).toBe('{"a":1}');
      expect(formatValueForMessage(throwingProxy(), { style: 'string' })).toBe('[Unreadable]');
      expect(formatValueForMessage('y'.repeat(500), { style: 'string', maxLength: 5 })).toBe('yyyy…');
      expect(formatValueForMessage({ a: 1 }, { style: 'json' })).toBe('{"a":1}');
    });

    test('returns [Unreadable] rather than throwing when both bounds are lifted on a graph deeper than the stack', () => {
      let deep: unknown[] = [];
      for (let i = 0; i < 200_000; i++) {
        deep = [deep];
      }
      expect(() => formatValueForMessage(deep, { maxLength: Infinity, maxDepth: Infinity })).not.toThrow();
    });
  });
});
