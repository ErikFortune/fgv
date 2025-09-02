/*
 * Copyright (c) 2025 Erik Fortune
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
import { Crc32Normalizer } from '../../packlets/hash';

describe('HashingNormalizer collision tests', () => {
  describe('Empty structure no longer collide', () => {
    test('empty array, object, Map, and Set now produce different hashes', () => {
      const normalizer = new Crc32Normalizer();

      const emptyArray: unknown = [];
      const emptyObject: unknown = {};
      const emptyMap: unknown = new Map();
      const emptySet: unknown = new Set();

      expect(normalizer.computeHash(emptyArray)).toSucceedAndSatisfy((arrayHash) => {
        expect(normalizer.computeHash(emptyObject)).toSucceedAndSatisfy((objectHash) => {
          expect(normalizer.computeHash(emptyMap)).toSucceedAndSatisfy((mapHash) => {
            expect(normalizer.computeHash(emptySet)).toSucceedAndSatisfy((setHash) => {
              // All empty structures now produce different hashes - bug is fixed
              expect(arrayHash).not.toBe(objectHash);
              expect(arrayHash).not.toBe(mapHash);
              expect(arrayHash).not.toBe(setHash);
              expect(objectHash).not.toBe(mapHash);
              expect(objectHash).not.toBe(setHash);
              expect(mapHash).not.toBe(setHash);
            });
          });
        });
      });
    });
  });

  describe('Set vs Array no longer collide', () => {
    test('Set no longer collides with array containing its entries format', () => {
      const normalizer = new Crc32Normalizer();

      // A Set internally uses entries() which returns [value, value] pairs
      const set = new Set([1, 2, 3]);
      // This array mimics what Set.entries() produces after normalization
      const arrayMimickingSet = [
        [1, 1],
        [2, 2],
        [3, 3]
      ];

      expect(normalizer.computeHash(set)).toSucceedAndSatisfy((setHash) => {
        expect(normalizer.computeHash(arrayMimickingSet)).toSucceedAndSatisfy((arrayHash) => {
          // These are now different - bug is fixed
          expect(setHash).not.toBe(arrayHash);
        });
      });
    });

    test('Set with string values no longer collides with corresponding entries array', () => {
      const normalizer = new Crc32Normalizer();

      const set = new Set(['a', 'b', 'c']);
      // Array that mimics Set.entries() output
      const arrayMimickingSet = [
        ['a', 'a'],
        ['b', 'b'],
        ['c', 'c']
      ];

      expect(normalizer.computeHash(set)).toSucceedAndSatisfy((setHash) => {
        expect(normalizer.computeHash(arrayMimickingSet)).toSucceedAndSatisfy((arrayHash) => {
          // These are now different - bug is fixed
          expect(setHash).not.toBe(arrayHash);
        });
      });
    });
  });

  describe('Map vs Object no longer collide', () => {
    test('Map and Object with same key-value pairs now produce different hashes', () => {
      const normalizer = new Crc32Normalizer();

      const map = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
        ['key3', 'value3']
      ]);

      const obj = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3'
      };

      expect(normalizer.computeHash(map)).toSucceedAndSatisfy((mapHash) => {
        expect(normalizer.computeHash(obj)).toSucceedAndSatisfy((objHash) => {
          // Map and Object with same content now produce different hashes - bug is fixed
          expect(mapHash).not.toBe(objHash);
        });
      });
    });

    test('Map no longer collides with array of entries', () => {
      const normalizer = new Crc32Normalizer();

      const map = new Map([
        ['a', 1],
        ['b', 2],
        ['c', 3]
      ]);

      // Array that looks like Map.entries()
      const arrayMimickingMap = [
        ['a', 1],
        ['b', 2],
        ['c', 3]
      ];

      expect(normalizer.computeHash(map)).toSucceedAndSatisfy((mapHash) => {
        expect(normalizer.computeHash(arrayMimickingMap)).toSucceedAndSatisfy((arrayHash) => {
          // These are now different - bug is fixed
          expect(mapHash).not.toBe(arrayHash);
        });
      });
    });

    test('Object no longer collides with array of entries', () => {
      const normalizer = new Crc32Normalizer();

      const obj = {
        x: 10,
        y: 20,
        z: 30
      };

      // Array that looks like Object.entries()
      const arrayMimickingObject = [
        ['x', 10],
        ['y', 20],
        ['z', 30]
      ];

      expect(normalizer.computeHash(obj)).toSucceedAndSatisfy((objHash) => {
        expect(normalizer.computeHash(arrayMimickingObject)).toSucceedAndSatisfy((arrayHash) => {
          // These are now different - bug is fixed
          expect(objHash).not.toBe(arrayHash);
        });
      });
    });
  });

  describe('Complex collision scenarios no longer occur', () => {
    test('Different types with same normalized structure now produce different hashes', () => {
      const normalizer = new Crc32Normalizer();

      // All of these different structures used to normalize to the same thing
      const map = new Map([['0', 'a']]);
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const obj = { '0': 'a' };
      const arrayOfEntries = [['0', 'a']];

      expect(normalizer.computeHash(map)).toSucceedAndSatisfy((mapHash) => {
        expect(normalizer.computeHash(obj)).toSucceedAndSatisfy((objHash) => {
          expect(normalizer.computeHash(arrayOfEntries)).toSucceedAndSatisfy((arrayHash) => {
            // All three now produce different hashes - bug is fixed
            expect(mapHash).not.toBe(objHash);
            expect(mapHash).not.toBe(arrayHash);
            expect(objHash).not.toBe(arrayHash);
          });
        });
      });
    });

    test('Nested structures with different types but same shape now produce different hashes', () => {
      const normalizer = new Crc32Normalizer();

      const nestedMap = new Map([['data', new Map([['inner', 'value']])]]);

      const nestedObj = {
        data: { inner: 'value' }
      };

      const nestedArray = [['data', [['inner', 'value']]]];

      expect(normalizer.computeHash(nestedMap)).toSucceedAndSatisfy((mapHash) => {
        expect(normalizer.computeHash(nestedObj)).toSucceedAndSatisfy((objHash) => {
          expect(normalizer.computeHash(nestedArray)).toSucceedAndSatisfy((arrayHash) => {
            // All now produce different hashes for nested structures - bug is fixed
            expect(mapHash).not.toBe(objHash);
            expect(mapHash).not.toBe(arrayHash);
            expect(objHash).not.toBe(arrayHash);
          });
        });
      });
    });

    test('Set of objects no longer collides with array of doubled object entries', () => {
      const normalizer = new Crc32Normalizer();

      const obj1 = { id: 1 };
      const obj2 = { id: 2 };

      // Sets can contain objects
      const setOfObjects = new Set([obj1, obj2]);

      // Since Set.entries() returns [value, value], and the values are objects,
      // we get an array of [object, object] pairs after normalization
      const correspondingArray = [
        [obj1, obj1],
        [obj2, obj2]
      ];

      expect(normalizer.computeHash(setOfObjects)).toSucceedAndSatisfy((setHash) => {
        expect(normalizer.computeHash(correspondingArray)).toSucceedAndSatisfy((arrayHash) => {
          // These are now different - bug is fixed
          expect(setHash).not.toBe(arrayHash);
        });
      });
    });
  });

  describe('Collisions that should NOT happen but are worth verifying', () => {
    test('Different ordered arrays should produce different hashes', () => {
      const normalizer = new Crc32Normalizer();

      const array1 = [1, 2, 3];
      const array2 = [3, 2, 1];

      expect(normalizer.computeHash(array1)).toSucceedAndSatisfy((hash1) => {
        expect(normalizer.computeHash(array2)).toSucceedAndSatisfy((hash2) => {
          // These should be different - arrays preserve order
          expect(hash1).not.toBe(hash2);
        });
      });
    });

    test('Objects with different values should produce different hashes', () => {
      const normalizer = new Crc32Normalizer();

      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      expect(normalizer.computeHash(obj1)).toSucceedAndSatisfy((hash1) => {
        expect(normalizer.computeHash(obj2)).toSucceedAndSatisfy((hash2) => {
          // These should be different
          expect(hash1).not.toBe(hash2);
        });
      });
    });

    test('Set and Array with different values should not collide', () => {
      const normalizer = new Crc32Normalizer();

      const set = new Set([1, 2, 3]);
      const array = [1, 2, 3];

      expect(normalizer.computeHash(set)).toSucceedAndSatisfy((setHash) => {
        expect(normalizer.computeHash(array)).toSucceedAndSatisfy((arrayHash) => {
          // These SHOULD be different but let's verify
          // Set becomes [[1,1], [2,2], [3,3]] while array stays [1,2,3]
          expect(setHash).not.toBe(arrayHash);
        });
      });
    });
  });

  describe('Edge cases and special values', () => {
    test('Single-element structures of different types no longer collide when equivalent', () => {
      const normalizer = new Crc32Normalizer();

      const singleMap = new Map([['key', 'value']]);
      const singleObj = { key: 'value' };
      const singleArray = [['key', 'value']];

      expect(normalizer.computeHash(singleMap)).toSucceedAndSatisfy((mapHash) => {
        expect(normalizer.computeHash(singleObj)).toSucceedAndSatisfy((objHash) => {
          expect(normalizer.computeHash(singleArray)).toSucceedAndSatisfy((arrayHash) => {
            // All three now produce different hashes - bug is fixed
            expect(mapHash).not.toBe(objHash);
            expect(mapHash).not.toBe(arrayHash);
            expect(objHash).not.toBe(arrayHash);
          });
        });
      });
    });

    test('Numeric string keys in objects no longer create collisions', () => {
      const normalizer = new Crc32Normalizer();

      // Object with numeric string keys
      const objWithNumericKeys = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        '0': 'first',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        '1': 'second',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        '2': 'third'
      };

      // Array that mimics the entries format
      const arrayMimickingObj = [
        ['0', 'first'],
        ['1', 'second'],
        ['2', 'third']
      ];

      expect(normalizer.computeHash(objWithNumericKeys)).toSucceedAndSatisfy((objHash) => {
        expect(normalizer.computeHash(arrayMimickingObj)).toSucceedAndSatisfy((arrayHash) => {
          // These are now different - bug is fixed
          expect(objHash).not.toBe(arrayHash);
        });
      });
    });
  });
});
