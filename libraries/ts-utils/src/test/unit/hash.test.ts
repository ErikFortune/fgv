/*
 * Copyright (c) 2020 Erik Fortune
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

import { Crc32Normalizer, HashingNormalizer } from '../../packlets/hash';

describe('HashingNormalizer module', () => {
  describe('Crc32 hash function', () => {
    test('computes the same hash value for equivalent inputs', () => {
      [
        [['hello'], ['hello']],
        [
          ['this', 'is', 'a', 'test'],
          ['this', 'is', 'a', 'test']
        ]
      ].forEach((t) => {
        expect(Crc32Normalizer.crc32Hash(t[0])).toEqual(Crc32Normalizer.crc32Hash(t[1]));
      });
    });

    test('computes different hash values for different inputs', () => {
      [
        [['hello'], ['Hello']],
        [
          ['this', 'is', 'a', 'test'],
          ['this', 'a', 'is', 'test']
        ]
      ].forEach((t) => {
        expect(Crc32Normalizer.crc32Hash(t[0])).not.toEqual(Crc32Normalizer.crc32Hash(t[1]));
      });
    });
  });

  describe('Normalizer class', () => {
    const normalizer = new Crc32Normalizer();
    const now = Date.now();
    test.each([
      ['like strings', 'hello', 'hello'],
      ['like numbers', 123456, 123456],
      [
        'like BigInt',

        BigInt('0x1ffffffffffffffffffffffffffffff'),

        BigInt('0x1ffffffffffffffffffffffffffffff')
      ],
      ['like booleans', false, false],
      ['undefined', undefined, undefined],
      ['null', null, null],
      ['like Date values', new Date(now), new Date(now)],
      ['like RegExp values', /^.*test.*$/i, /^.*test.*$/i],
      ['like arrays', ['this', 'is', 10, true], ['this', 'is', 10, true]],
      ['like objects', { a: 'hello', b: 'goodbye' }, { b: 'goodbye', a: 'hello' }],
      [
        'like maps',
        new Map([
          ['a', 'hello'],
          ['b', 'goodbye']
        ]),
        new Map([
          ['b', 'goodbye'],
          ['a', 'hello']
        ])
      ],
      ['like sets', new Set(['hello', 10, true]), new Set([true, 'hello', 10])]
    ])('computes the same hash for %p', (__desc, v1, v2) => {
      expect(normalizer.computeHash(v1)).toEqual(normalizer.computeHash(v2));
    });

    test.each([
      ['unlike strings', 'hello', 'Hello'],
      ['unlike numbers', 123456, 1234567],
      ['number and string', 123456, '123456'],
      [
        'unlike BigInt',

        BigInt('0x1ffffffffffffffffffffffffffffff'),

        BigInt('0x1fffffffffffffffffffffffffffffff')
      ],
      ['BigInt and string', BigInt('0x1ffffffffffffffffffffffffffffff'), '0x1ffffffffffffffffffffffffffffff'],
      ['unlike booleans', false, true],
      ['boolean and string', false, 'false'],
      ['undefined and string', undefined, 'undefined'],
      ['null and string', null, 'null'],
      ['unlike Date values', new Date(now), new Date(now + 1)],
      ['unlike RegExp values', /^.*test.*$/i, /^.*test.*$/],
      ['unlike arrays', ['this', 'is', 10, true], ['this', 'is', true, 10]],
      ['unlike objects', { a: 'hello', b: 'goodbye' }, { b: 'hello', a: 'goodbye' }],
      [
        'unlike maps',
        new Map([
          ['a', 'hello'],
          ['b', 'goodbye']
        ]),
        new Map([
          ['b', 'hello'],
          ['a', 'goodbye']
        ])
      ],
      ['unlike sets', new Set(['hello', 10, false]), new Set([true, 'hello', 10])]
    ])('computes a different hash for %p', (__desc, v1, v2) => {
      expect(normalizer.computeHash(v1)).not.toEqual(normalizer.computeHash(v2));
    });

    test('computes the same hash for a deeply nested object', () => {
      const v1 = {
        str: 'hello',
        arr: [1, 'string', true, { a: 'a', b: 'b' }],
        child: {
          p1: 'prop1',
          p2: 2,
          p3: /^.*$/i,
          p4: [1, 2, 3, 4],
          p5: 'test'
        }
      };
      const v2 = {
        arr: [1, 'string', true, { b: 'b', a: 'a' }],
        child: {
          p4: [1, 2, 3, 4],
          p2: 2,
          p5: 'test',
          p1: 'prop1',
          p3: /^.*$/i
        },
        str: 'hello'
      };
      expect(normalizer.computeHash(v1)).toEqual(normalizer.computeHash(v2));
    });

    test('fails for a non-hashable function', () => {
      expect(normalizer.computeHash(() => 'hello')).toFailWith(/unexpected type/i);
    });
  });
});

describe('HashingNormalizer.canonicalize', () => {
  const normalizer = new Crc32Normalizer();

  describe('key ordering', () => {
    test('integer-string keys are sorted lexicographically, not numerically', () => {
      // Use JSON.parse to create the object — avoids naming-convention lint on integer-string keys
      // in object literals while still testing the canonical ordering behavior.
      expect(normalizer.canonicalize(JSON.parse('{"10":1,"2":2,"abc":3}'))).toSucceedAndSatisfy((result) => {
        // Lexicographic: "10" < "2" < "abc"
        const pos10 = result.indexOf('"10"');
        const pos2 = result.indexOf('"2"');
        const posAbc = result.indexOf('"abc"');
        expect(pos10).toBeLessThan(pos2);
        expect(pos2).toBeLessThan(posAbc);
        // Also verify values are correct
        const parsed = JSON.parse(result) as Record<string, number>;
        expect(parsed['10']).toBe(1);
        expect(parsed['2']).toBe(2);
        expect(parsed.abc).toBe(3);
      });
    });

    test('regular string keys are sorted lexicographically', () => {
      expect(normalizer.canonicalize({ z: 1, a: 2, m: 3 })).toSucceedAndSatisfy((result) => {
        const pos_a = result.indexOf('"a"');
        const pos_m = result.indexOf('"m"');
        const pos_z = result.indexOf('"z"');
        expect(pos_a).toBeLessThan(pos_m);
        expect(pos_m).toBeLessThan(pos_z);
      });
    });
  });

  describe('round-trip', () => {
    test('JSON.parse(canonicalize(value)) produces equivalent value', () => {
      const value = { b: 2, a: 1, c: [3, 4, 5] };
      expect(normalizer.canonicalize(value)).toSucceedAndSatisfy((result) => {
        const parsed = JSON.parse(result) as typeof value;
        expect(parsed.a).toBe(1);
        expect(parsed.b).toBe(2);
        expect(parsed.c).toEqual([3, 4, 5]);
      });
    });

    test('canonicalize produces identical output on repeated calls', () => {
      const value = { b: 'second', a: 'first', c: null };
      const result1 = normalizer.canonicalize(value).orThrow();
      const result2 = normalizer.canonicalize(value).orThrow();
      expect(result1).toBe(result2);
    });
  });

  describe('primitive values', () => {
    test('null serializes to "null"', () => {
      expect(normalizer.canonicalize(null)).toSucceedWith('null');
    });

    test('true serializes to "true"', () => {
      expect(normalizer.canonicalize(true)).toSucceedWith('true');
    });

    test('false serializes to "false"', () => {
      expect(normalizer.canonicalize(false)).toSucceedWith('false');
    });

    test('number serializes via JSON.stringify', () => {
      expect(normalizer.canonicalize(42)).toSucceedWith('42');
      expect(normalizer.canonicalize(3.14)).toSucceedWith('3.14');
      expect(normalizer.canonicalize(-0)).toSucceedWith('0');
    });

    test('string serializes as JSON-encoded string', () => {
      expect(normalizer.canonicalize('hello')).toSucceedWith('"hello"');
      expect(normalizer.canonicalize('say "hi"')).toSucceedWith('"say \\"hi\\""');
      expect(normalizer.canonicalize('line\nnewline')).toSucceedWith('"line\\nnewline"');
    });

    test('fails for non-JSON-serializable types', () => {
      expect(normalizer.canonicalize(() => 'fn')).toFail();
      expect(normalizer.canonicalize(Symbol('s'))).toFail();
      expect(normalizer.canonicalize(new Date())).toFail();
      expect(normalizer.canonicalize(/regex/)).toFail();
      expect(normalizer.canonicalize(new Map())).toFail();
      expect(normalizer.canonicalize(new Set())).toFail();
    });

    test('fails for non-finite numbers', () => {
      expect(normalizer.canonicalize(NaN)).toFail();
      expect(normalizer.canonicalize(Infinity)).toFail();
      expect(normalizer.canonicalize(-Infinity)).toFail();
    });
  });

  describe('arrays', () => {
    test('empty array', () => {
      expect(normalizer.canonicalize([])).toSucceedWith('[]');
    });

    test('preserves array element order', () => {
      expect(normalizer.canonicalize([3, 1, 2])).toSucceedWith('[3,1,2]');
    });

    test('array of objects', () => {
      expect(normalizer.canonicalize([{ b: 2, a: 1 }])).toSucceedWith('[{"a":1,"b":2}]');
    });
  });

  describe('nested objects', () => {
    test('sorts keys at every nesting level', () => {
      const value = {
        z: { b: 2, a: 1 },
        a: { y: 'last', x: 'first' }
      };
      expect(normalizer.canonicalize(value)).toSucceedWith(
        '{"a":{"x":"first","y":"last"},"z":{"a":1,"b":2}}'
      );
    });

    test('empty object', () => {
      expect(normalizer.canonicalize({})).toSucceedWith('{}');
    });
  });

  describe('HashingNormalizer base class canonicalize', () => {
    test('canonicalize is available on any HashingNormalizer instance', () => {
      const h = new HashingNormalizer((parts) => parts.join(''));
      expect(h.canonicalize({ b: 1, a: 2 })).toSucceedWith('{"a":2,"b":1}');
    });
  });
});
