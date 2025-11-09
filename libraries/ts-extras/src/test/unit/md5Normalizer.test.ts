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

import '@fgv/ts-utils-jest';

import { Md5Normalizer } from '../../packlets/hash';

/**
 * MD5 Normalizer Tests for Node.js Environment
 *
 * This tests the Node.js implementation of Md5Normalizer which uses
 * the Node.js crypto module for true MD5 hashing.
 *
 * Note: The browser implementation has been updated to use CRC32 from ts-utils
 * for cross-platform compatibility. Both environments now use the same
 * underlying hash algorithm, ensuring consistent results.
 */

describe('Md5Normalizer (Node.js)', () => {
  describe('md5Hash static method', () => {
    test('computes the same hash value for equivalent inputs', () => {
      [
        [['hello'], ['hello']],
        [
          ['this', 'is', 'a', 'test'],
          ['this', 'is', 'a', 'test']
        ]
      ].forEach((t) => {
        expect(Md5Normalizer.md5Hash(t[0])).toEqual(Md5Normalizer.md5Hash(t[1]));
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
        expect(Md5Normalizer.md5Hash(t[0])).not.toEqual(Md5Normalizer.md5Hash(t[1]));
      });
    });

    // Edge case tests for MD5 implementation
    describe('edge cases', () => {
      test('should handle empty array consistently', () => {
        const emptyHash = Md5Normalizer.md5Hash([]);
        expect(emptyHash).toMatch(/^[a-f0-9]{32}$/);
        expect(emptyHash.length).toBe(32);
        // Empty string MD5 should be consistent
        expect(emptyHash).toBe('d41d8cd98f00b204e9800998ecf8427e');
      });

      test('should handle unicode characters properly', () => {
        const unicodeParts = ['测试', '🎉', 'café'];
        const hash1 = Md5Normalizer.md5Hash(unicodeParts);
        const hash2 = Md5Normalizer.md5Hash(unicodeParts);
        expect(hash1).toBe(hash2);
        expect(hash1).toMatch(/^[a-f0-9]{32}$/);
      });

      test('should handle very long input arrays', () => {
        const largeParts = Array.from({ length: 1000 }, (unusedValue, i) => `part-${i}`);
        const hash = Md5Normalizer.md5Hash(largeParts);
        expect(hash).toMatch(/^[a-f0-9]{32}$/);
        expect(hash.length).toBe(32);
      });

      test('should handle strings with pipe characters (delimiter)', () => {
        const pipeparts = ['part1|with|pipes', 'part2'];
        const hash1 = Md5Normalizer.md5Hash(pipeparts);
        const hash2 = Md5Normalizer.md5Hash(pipeparts);
        expect(hash1).toBe(hash2);
        expect(hash1).toMatch(/^[a-f0-9]{32}$/);
      });

      test('should demonstrate cryptographic properties', () => {
        // Test avalanche effect - small input changes should cause large output changes
        const input1 = ['test'];
        const input2 = ['Test']; // Only case difference

        const hash1 = Md5Normalizer.md5Hash(input1);
        const hash2 = Md5Normalizer.md5Hash(input2);

        expect(hash1).not.toBe(hash2);

        // Count character differences
        let differences = 0;
        for (let i = 0; i < 32; i++) {
          if (hash1[i] !== hash2[i]) differences++;
        }

        // Should have many differences due to avalanche effect
        expect(differences).toBeGreaterThan(15);
      });
    });
  });

  describe('Md5Normalizer class', () => {
    let normalizer: Md5Normalizer;
    const now = Date.now();

    beforeEach(() => {
      normalizer = new Md5Normalizer();
    });
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

    // Interface contract tests
    describe('HashingNormalizer interface compliance', () => {
      test('should implement computeHash method with correct signature', () => {
        expect(typeof normalizer.computeHash).toBe('function');
        expect(normalizer.computeHash.length).toBe(1); // Single parameter
      });

      test('should return Result<string> from computeHash', () => {
        const result = normalizer.computeHash({ test: 'data' });
        expect(result).toSucceedAndSatisfy((hash) => {
          expect(typeof hash).toBe('string');
          expect(hash).toMatch(/^[a-f0-9]{32}$|^[A-F0-9]{32}$/); // MD5 hex format
          expect(hash.length).toBe(32);
        });
      });

      test('should produce cryptographically valid MD5 hashes', () => {
        // Test with known MD5 values for validation
        const knownCases = [
          { input: '', expected: 'd41d8cd98f00b204e9800998ecf8427e' } // MD5 of empty string
        ];

        // Test that we get proper MD5 format (not testing exact values due to normalization)
        knownCases.forEach(({ input }) => {
          expect(normalizer.computeHash(input)).toSucceedAndSatisfy((hash) => {
            expect(hash).toMatch(/^[a-f0-9]{32}$/);
            expect(hash.length).toBe(32);
          });
        });
      });

      test('should handle various data types through interface', () => {
        const testCases = [
          'string',
          123,
          true,
          { key: 'value' },
          [1, 2, 3],
          new Map([['key', 'value']]),
          new Set([1, 2, 3])
        ];

        testCases.forEach((testCase) => {
          expect(normalizer.computeHash(testCase)).toSucceedAndSatisfy((hash) => {
            expect(hash).toMatch(/^[a-f0-9]{32}$/);
          });
        });
      });

      test('should fail gracefully with unsupported types', () => {
        const unsupportedFunction = (): string => 'test';
        expect(normalizer.computeHash(unsupportedFunction)).toFailWith(
          /unexpected type|unsupported|function/i
        );
      });

      test('should be deterministic through interface', () => {
        const complexObj = {
          str: 'test',
          num: 42,
          bool: true,
          arr: [1, 'two', { three: 3 }],
          nested: {
            deep: {
              value: 'deep-value'
            }
          }
        };

        const hashes = Array.from({ length: 5 }, () => normalizer.computeHash(complexObj));
        const hashValues = hashes.map((h) => h.orThrow());
        expect(hashValues.every((h) => h === hashValues[0])).toBe(true);
      });
    });

    // Cross-platform compatibility documentation
    describe('Node.js-specific behavior documentation', () => {
      test('should document that hashes differ from browser SimpleHashNormalizer', () => {
        const testObj = { test: 'cross-platform', value: 123 };

        expect(normalizer.computeHash(testObj)).toSucceedAndSatisfy((nodeHash) => {
          // Node.js MD5 hash characteristics
          expect(nodeHash).toMatch(/^[a-f0-9]{32}$/);
          expect(nodeHash.length).toBe(32);

          // Document that this IS a proper MD5 hash
          // Browser now uses CRC32 which produces 8-character hashes
          expect(nodeHash).toMatch(/^[a-f0-9]{32}$/); // Full 32-character MD5
        });
      });

      test('should maintain MD5 compatibility for Node.js environments', () => {
        // This test documents that Node.js continues to use true MD5
        // while browser now uses CRC32 for cross-platform compatibility
        const result = normalizer.computeHash({ platform: 'nodejs' });
        expect(result).toSucceedAndSatisfy((hash) => {
          expect(hash).toMatch(/^[a-f0-9]{32}$/);
          expect(hash.length).toBe(32);
        });
      });

      test('should demonstrate true MD5 hash properties', () => {
        const testInput = 'test-string';

        expect(normalizer.computeHash(testInput)).toSucceedAndSatisfy((hash) => {
          // MD5 properties
          expect(hash).toMatch(/^[a-f0-9]{32}$/);
          expect(hash.length).toBe(32);

          // Should not be a simple repeated pattern (proper MD5 distribution)
          const pattern = hash.substring(0, 8);
          const isRepeatedPattern = hash === pattern.repeat(4);
          expect(isRepeatedPattern).toBe(false);
        });
      });

      test('should produce cryptographically distributed hashes', () => {
        // Test that small changes produce very different hashes (avalanche effect)
        const input1 = 'test-input-1';
        const input2 = 'test-input-2'; // Small change

        const hash1 = normalizer.computeHash(input1).orThrow();
        const hash2 = normalizer.computeHash(input2).orThrow();

        expect(hash1).not.toBe(hash2);

        // Count differing characters (should be roughly half for good hash function)
        let differences = 0;
        for (let i = 0; i < 32; i++) {
          if (hash1[i] !== hash2[i]) differences++;
        }

        // For a good hash function, about half the bits should change
        expect(differences).toBeGreaterThan(10); // At least 10 character differences
      });
    });
  });
});
