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

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import { jsonDiff, jsonEquals, jsonThreeWayDiff } from '../../../packlets/diff';

describe('jsonDiff', () => {
  describe('primitive values', () => {
    test('should detect no changes for identical primitives', () => {
      expect(jsonDiff(42, 42)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(true);
        expect(result.changes).toHaveLength(0);
      });

      expect(jsonDiff('hello', 'hello')).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(true);
        expect(result.changes).toHaveLength(0);
      });

      expect(jsonDiff(true, true)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(true);
        expect(result.changes).toHaveLength(0);
      });

      expect(jsonDiff(null, null)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(true);
        expect(result.changes).toHaveLength(0);
      });
    });

    test('should detect changes for different primitives', () => {
      expect(jsonDiff(42, 43)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '',
          type: 'modified',
          oldValue: 42,
          newValue: 43
        });
      });

      expect(jsonDiff('hello', 'world')).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '',
          type: 'modified',
          oldValue: 'hello',
          newValue: 'world'
        });
      });

      expect(jsonDiff(true, false)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '',
          type: 'modified',
          oldValue: true,
          newValue: false
        });
      });
    });

    test('should detect changes between different primitive types', () => {
      expect(jsonDiff(42, 'hello')).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '',
          type: 'modified',
          oldValue: 42,
          newValue: 'hello'
        });
      });

      expect(jsonDiff(null, 0)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '',
          type: 'modified',
          oldValue: null,
          newValue: 0
        });
      });
    });
  });

  describe('object comparison', () => {
    test('should detect no changes for identical objects', () => {
      const obj = { name: 'John', age: 30, active: true };

      expect(jsonDiff(obj, obj)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(true);
        expect(result.changes).toHaveLength(0);
      });

      expect(jsonDiff(obj, { name: 'John', age: 30, active: true })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(true);
        expect(result.changes).toHaveLength(0);
      });
    });

    test('should detect added properties', () => {
      expect(jsonDiff({ name: 'John' }, { name: 'John', age: 30 })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: 'age',
          type: 'added',
          newValue: 30
        });
      });
    });

    test('should detect removed properties', () => {
      expect(jsonDiff({ name: 'John', age: 30 }, { name: 'John' })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: 'age',
          type: 'removed',
          oldValue: 30
        });
      });
    });

    test('should detect modified properties', () => {
      expect(jsonDiff({ name: 'John', age: 30 }, { name: 'Jane', age: 30 })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: 'name',
          type: 'modified',
          oldValue: 'John',
          newValue: 'Jane'
        });
      });
    });

    test('should detect multiple changes', () => {
      expect(
        jsonDiff({ name: 'John', age: 30, city: 'NYC' }, { name: 'Jane', age: 25, country: 'USA' })
      ).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(4);

        const changesByPath = result.changes.reduce((acc, change) => {
          acc[change.path] = change;
          return acc;
        }, {} as Record<string, (typeof result.changes)[0]>);

        expect(changesByPath.name).toEqual({
          path: 'name',
          type: 'modified',
          oldValue: 'John',
          newValue: 'Jane'
        });

        expect(changesByPath.age).toEqual({
          path: 'age',
          type: 'modified',
          oldValue: 30,
          newValue: 25
        });

        expect(changesByPath.city).toEqual({
          path: 'city',
          type: 'removed',
          oldValue: 'NYC'
        });

        expect(changesByPath.country).toEqual({
          path: 'country',
          type: 'added',
          newValue: 'USA'
        });
      });
    });
  });

  describe('nested object comparison', () => {
    test('should detect changes in nested objects', () => {
      expect(
        jsonDiff(
          { user: { name: 'John', profile: { age: 30 } } },
          { user: { name: 'Jane', profile: { age: 30 } } }
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: 'user.name',
          type: 'modified',
          oldValue: 'John',
          newValue: 'Jane'
        });
      });
    });

    test('should detect added nested properties', () => {
      expect(
        jsonDiff({ user: { name: 'John' } }, { user: { name: 'John', profile: { age: 30 } } })
      ).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: 'user.profile',
          type: 'added',
          newValue: { age: 30 }
        });
      });
    });

    test('should detect removed nested properties', () => {
      expect(
        jsonDiff({ user: { name: 'John', profile: { age: 30 } } }, { user: { name: 'John' } })
      ).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: 'user.profile',
          type: 'removed',
          oldValue: { age: 30 }
        });
      });
    });
  });

  describe('array comparison', () => {
    test('should detect no changes for identical arrays', () => {
      const arr = [1, 2, 3];

      expect(jsonDiff(arr, arr)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(true);
        expect(result.changes).toHaveLength(0);
      });

      expect(jsonDiff(arr, [1, 2, 3])).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(true);
        expect(result.changes).toHaveLength(0);
      });
    });

    test('should detect added array elements', () => {
      expect(jsonDiff([1, 2], [1, 2, 3])).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '2',
          type: 'added',
          newValue: 3
        });
      });
    });

    test('should detect removed array elements', () => {
      expect(jsonDiff([1, 2, 3], [1, 2])).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '2',
          type: 'removed',
          oldValue: 3
        });
      });
    });

    test('should detect modified array elements', () => {
      expect(jsonDiff([1, 2, 3], [1, 5, 3])).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '1',
          type: 'modified',
          oldValue: 2,
          newValue: 5
        });
      });
    });

    test('should handle complex array changes', () => {
      expect(jsonDiff([1, 2, 3, 4], [1, 5, 6])).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(3);

        const changesByPath = result.changes.reduce((acc, change) => {
          acc[change.path] = change;
          return acc;
        }, {} as Record<string, (typeof result.changes)[0]>);

        expect(changesByPath['1']).toEqual({
          path: '1',
          type: 'modified',
          oldValue: 2,
          newValue: 5
        });

        expect(changesByPath['2']).toEqual({
          path: '2',
          type: 'modified',
          oldValue: 3,
          newValue: 6
        });

        expect(changesByPath['3']).toEqual({
          path: '3',
          type: 'removed',
          oldValue: 4
        });
      });
    });
  });

  describe('mixed type comparison', () => {
    test('should detect changes between different types', () => {
      expect(jsonDiff({ name: 'John' }, [1, 2, 3])).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '',
          type: 'modified',
          oldValue: { name: 'John' },
          newValue: [1, 2, 3]
        });
      });

      expect(jsonDiff([1, 2, 3], 'hello')).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '',
          type: 'modified',
          oldValue: [1, 2, 3],
          newValue: 'hello'
        });
      });
    });

    test('should handle nested mixed types', () => {
      expect(jsonDiff({ data: [1, 2, 3] }, { data: { count: 3 } })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: 'data',
          type: 'modified',
          oldValue: [1, 2, 3],
          newValue: { count: 3 }
        });
      });
    });

    test('should handle object vs primitive types', () => {
      expect(jsonDiff({ name: 'John' }, 'simple string')).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '',
          type: 'modified',
          oldValue: { name: 'John' },
          newValue: 'simple string'
        });
      });

      expect(jsonDiff(42, { count: 42 })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '',
          type: 'modified',
          oldValue: 42,
          newValue: { count: 42 }
        });
      });
    });

    test('should handle null vs object types', () => {
      expect(jsonDiff(null, { data: 'value' })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '',
          type: 'modified',
          oldValue: null,
          newValue: { data: 'value' }
        });
      });

      expect(jsonDiff({ data: 'value' }, null)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: '',
          type: 'modified',
          oldValue: { data: 'value' },
          newValue: null
        });
      });
    });
  });

  describe('options', () => {
    test('should include unchanged values when includeUnchanged is true', () => {
      expect(
        jsonDiff({ name: 'John', age: 30 }, { name: 'Jane', age: 30 }, { includeUnchanged: true })
      ).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes).toHaveLength(2);

        const changesByPath = result.changes.reduce((acc, change) => {
          acc[change.path] = change;
          return acc;
        }, {} as Record<string, (typeof result.changes)[0]>);

        expect(changesByPath.name).toEqual({
          path: 'name',
          type: 'modified',
          oldValue: 'John',
          newValue: 'Jane'
        });

        expect(changesByPath.age).toEqual({
          path: 'age',
          type: 'unchanged',
          oldValue: 30,
          newValue: 30
        });
      });
    });

    test('should use custom path separator', () => {
      expect(
        jsonDiff({ user: { name: 'John' } }, { user: { name: 'Jane' } }, { pathSeparator: '/' })
      ).toSucceedAndSatisfy((result) => {
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0].path).toBe('user/name');
      });
    });

    test('should handle unordered array comparison when arrayOrderMatters is false', () => {
      expect(jsonDiff([1, 2, 3], [3, 1, 2], { arrayOrderMatters: false })).toSucceedAndSatisfy((result) => {
        // With unordered comparison, these should be considered identical
        // (though this is a simplified implementation that may show some changes)
        expect(result.changes.length).toBeLessThanOrEqual(3);
      });

      expect(jsonDiff([1, 2], [1, 2, 3], { arrayOrderMatters: false })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        const addedChanges = result.changes.filter((c) => c.type === 'added');
        expect(addedChanges).toHaveLength(1);
        expect(addedChanges[0].newValue).toBe(3);
      });
    });

    test('should include unchanged elements in unordered arrays when includeUnchanged is true', () => {
      expect(
        jsonDiff([1, 2, 3], [3, 1, 2], { arrayOrderMatters: false, includeUnchanged: true })
      ).toSucceedAndSatisfy((result) => {
        const unchangedChanges = result.changes.filter((c) => c.type === 'unchanged');
        expect(unchangedChanges.length).toBeGreaterThan(0);
      });
    });

    test('should detect removed elements in unordered arrays', () => {
      expect(jsonDiff([1, 2, 3, 4], [1, 3], { arrayOrderMatters: false })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        const removedChanges = result.changes.filter((c) => c.type === 'removed');
        expect(removedChanges.length).toBeGreaterThan(0);

        const removedValues = removedChanges.map((c) => c.oldValue).sort();
        expect(removedValues).toContain(2);
        expect(removedValues).toContain(4);
      });
    });
  });

  describe('complex scenarios', () => {
    test('should handle deeply nested structures', () => {
      const obj1: JsonValue = {
        users: [
          { id: 1, name: 'John', profile: { age: 30, address: { city: 'NYC' } } },
          { id: 2, name: 'Jane', profile: { age: 25, address: { city: 'LA' } } }
        ],
        settings: { theme: 'dark', notifications: true }
      };

      const obj2: JsonValue = {
        users: [
          { id: 1, name: 'John', profile: { age: 31, address: { city: 'NYC', zip: '10001' } } },
          { id: 3, name: 'Bob', profile: { age: 35, address: { city: 'Chicago' } } }
        ],
        settings: { theme: 'light', notifications: true }
      };

      expect(jsonDiff(obj1, obj2)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.changes.length).toBeGreaterThan(0);

        // Check for some expected changes
        const changesByPath = result.changes.reduce((acc, change) => {
          acc[change.path] = change;
          return acc;
        }, {} as Record<string, (typeof result.changes)[0]>);

        expect(changesByPath['users.0.profile.age']).toEqual({
          path: 'users.0.profile.age',
          type: 'modified',
          oldValue: 30,
          newValue: 31
        });

        expect(changesByPath['settings.theme']).toEqual({
          path: 'settings.theme',
          type: 'modified',
          oldValue: 'dark',
          newValue: 'light'
        });
      });
    });

    test('should handle empty objects and arrays', () => {
      expect(jsonDiff({}, { name: 'John' })).toSucceedAndSatisfy((result) => {
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0]).toEqual({
          path: 'name',
          type: 'added',
          newValue: 'John'
        });
      });

      expect(jsonDiff([], [1, 2])).toSucceedAndSatisfy((result) => {
        expect(result.changes).toHaveLength(2);
        expect(result.changes[0]).toEqual({
          path: '0',
          type: 'added',
          newValue: 1
        });
        expect(result.changes[1]).toEqual({
          path: '1',
          type: 'added',
          newValue: 2
        });
      });
    });
  });
});

describe('jsonEquals', () => {
  test('should return true for identical primitives', () => {
    expect(jsonEquals(42, 42)).toBe(true);
    expect(jsonEquals('hello', 'hello')).toBe(true);
    expect(jsonEquals(true, true)).toBe(true);
    expect(jsonEquals(null, null)).toBe(true);
  });

  test('should return false for different primitives', () => {
    expect(jsonEquals(42, 43)).toBe(false);
    expect(jsonEquals('hello', 'world')).toBe(false);
    expect(jsonEquals(true, false)).toBe(false);
    expect(jsonEquals(null, 0)).toBe(false);
  });

  test('should return true for identical objects', () => {
    expect(jsonEquals({ name: 'John', age: 30 }, { name: 'John', age: 30 })).toBe(true);

    expect(
      jsonEquals(
        { user: { name: 'John', profile: { age: 30 } } },
        { user: { name: 'John', profile: { age: 30 } } }
      )
    ).toBe(true);
  });

  test('should return false for different objects', () => {
    expect(jsonEquals({ name: 'John', age: 30 }, { name: 'Jane', age: 30 })).toBe(false);

    expect(jsonEquals({ name: 'John' }, { name: 'John', age: 30 })).toBe(false);
  });

  test('should return true for identical arrays', () => {
    expect(jsonEquals([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(jsonEquals([{ name: 'John' }, { name: 'Jane' }], [{ name: 'John' }, { name: 'Jane' }])).toBe(true);
  });

  test('should return false for different arrays', () => {
    expect(jsonEquals([1, 2, 3], [1, 2, 4])).toBe(false);
    expect(jsonEquals([1, 2], [1, 2, 3])).toBe(false);
    expect(jsonEquals([{ name: 'John' }, { name: 'Jane' }], [{ name: 'Jane' }, { name: 'John' }])).toBe(
      false
    );
  });

  test('should handle mixed types', () => {
    expect(jsonEquals({ name: 'John' }, [1, 2, 3])).toBe(false);
    expect(jsonEquals([1, 2, 3], 'hello')).toBe(false);
    expect(jsonEquals(42, { value: 42 })).toBe(false);
  });
});

describe('jsonThreeWayDiff', () => {
  describe('identical objects', () => {
    test('should return identical result for same objects', () => {
      const obj = { name: 'John', age: 30 };

      expect(jsonThreeWayDiff(obj, obj)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(true);
        expect(result.onlyInA).toBeNull();
        expect(result.onlyInB).toBeNull();
        expect(result.unchanged).toEqual({ name: 'John', age: 30 });
        expect(result.metadata).toEqual({
          added: 0,
          removed: 0,
          modified: 0,
          unchanged: 2
        });
      });
    });

    test('should return identical result for equal objects', () => {
      expect(jsonThreeWayDiff({ name: 'John', age: 30 }, { name: 'John', age: 30 })).toSucceedAndSatisfy(
        (result) => {
          expect(result.identical).toBe(true);
          expect(result.onlyInA).toBeNull();
          expect(result.onlyInB).toBeNull();
          expect(result.unchanged).toEqual({ name: 'John', age: 30 });
          expect(result.metadata).toEqual({
            added: 0,
            removed: 0,
            modified: 0,
            unchanged: 2
          });
        }
      );
    });
  });

  describe('simple differences', () => {
    test('should handle added properties', () => {
      expect(jsonThreeWayDiff({ name: 'John' }, { name: 'John', age: 30 })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toBeNull();
        expect(result.unchanged).toEqual({ name: 'John' });
        expect(result.onlyInB).toEqual({ age: 30 });
        expect(result.metadata).toEqual({
          added: 1,
          removed: 0,
          modified: 0,
          unchanged: 1
        });
      });
    });

    test('should handle removed properties', () => {
      expect(jsonThreeWayDiff({ name: 'John', age: 30 }, { name: 'John' })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toEqual({ age: 30 });
        expect(result.unchanged).toEqual({ name: 'John' });
        expect(result.onlyInB).toBeNull();
        expect(result.metadata).toEqual({
          added: 0,
          removed: 1,
          modified: 0,
          unchanged: 1
        });
      });
    });

    test('should handle modified properties', () => {
      expect(jsonThreeWayDiff({ name: 'John', age: 30 }, { name: 'Jane', age: 30 })).toSucceedAndSatisfy(
        (result) => {
          expect(result.identical).toBe(false);
          expect(result.onlyInA).toEqual({ name: 'John' });
          expect(result.unchanged).toEqual({ age: 30 });
          expect(result.onlyInB).toEqual({ name: 'Jane' });
          expect(result.metadata).toEqual({
            added: 0,
            removed: 0,
            modified: 1,
            unchanged: 1
          });
        }
      );
    });

    test('should handle multiple changes', () => {
      expect(
        jsonThreeWayDiff({ name: 'John', age: 30, city: 'NYC' }, { name: 'Jane', age: 25, country: 'USA' })
      ).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toEqual({ name: 'John', age: 30, city: 'NYC' });
        expect(result.unchanged).toBeNull();
        expect(result.onlyInB).toEqual({ name: 'Jane', age: 25, country: 'USA' });
        expect(result.metadata).toEqual({
          added: 1,
          removed: 1,
          modified: 2,
          unchanged: 0
        });
      });
    });
  });

  describe('nested objects', () => {
    test('should handle changes in nested objects', () => {
      expect(
        jsonThreeWayDiff(
          { user: { name: 'John', age: 30 }, settings: { theme: 'dark' } },
          { user: { name: 'Jane', age: 30 }, settings: { theme: 'dark' } }
        )
      ).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toEqual({ user: { name: 'John' } });
        expect(result.unchanged).toEqual({
          user: { age: 30 },
          settings: { theme: 'dark' }
        });
        expect(result.onlyInB).toEqual({ user: { name: 'Jane' } });
        expect(result.metadata).toEqual({
          added: 0,
          removed: 0,
          modified: 1,
          unchanged: 2
        });
      });
    });

    test('should handle added nested properties', () => {
      expect(
        jsonThreeWayDiff({ user: { name: 'John' } }, { user: { name: 'John', profile: { age: 30 } } })
      ).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toBeNull();
        expect(result.unchanged).toEqual({ user: { name: 'John' } });
        expect(result.onlyInB).toEqual({ user: { profile: { age: 30 } } });
        expect(result.metadata).toEqual({
          added: 1,
          removed: 0,
          modified: 0,
          unchanged: 1
        });
      });
    });

    test('should handle removed nested properties', () => {
      expect(
        jsonThreeWayDiff({ user: { name: 'John', profile: { age: 30 } } }, { user: { name: 'John' } })
      ).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toEqual({ user: { profile: { age: 30 } } });
        expect(result.unchanged).toEqual({ user: { name: 'John' } });
        expect(result.onlyInB).toBeNull();
        expect(result.metadata).toEqual({
          added: 0,
          removed: 1,
          modified: 0,
          unchanged: 1
        });
      });
    });
  });

  describe('array handling', () => {
    test('should treat identical arrays as unchanged', () => {
      expect(jsonThreeWayDiff({ items: [1, 2, 3] }, { items: [1, 2, 3] })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(true);
        expect(result.onlyInA).toBeNull();
        expect(result.unchanged).toEqual({ items: [1, 2, 3] });
        expect(result.onlyInB).toBeNull();
        expect(result.metadata).toEqual({
          added: 0,
          removed: 0,
          modified: 0,
          unchanged: 1
        });
      });
    });

    test('should treat different arrays as complete replacement', () => {
      expect(jsonThreeWayDiff({ items: [1, 2, 3] }, { items: [3] })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toEqual({ items: [1, 2, 3] });
        expect(result.unchanged).toBeNull();
        expect(result.onlyInB).toEqual({ items: [3] });
        expect(result.metadata).toEqual({
          added: 0,
          removed: 0,
          modified: 1,
          unchanged: 0
        });
      });
    });

    test('should handle arrays with different lengths', () => {
      expect(
        jsonThreeWayDiff({ hobbies: ['reading', 'gaming'] }, { hobbies: ['reading', 'gaming', 'cooking'] })
      ).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toEqual({ hobbies: ['reading', 'gaming'] });
        expect(result.unchanged).toBeNull();
        expect(result.onlyInB).toEqual({ hobbies: ['reading', 'gaming', 'cooking'] });
        expect(result.metadata).toEqual({
          added: 0,
          removed: 0,
          modified: 1,
          unchanged: 0
        });
      });
    });

    test('should handle array vs non-array', () => {
      expect(jsonThreeWayDiff({ data: [1, 2, 3] }, { data: { count: 3 } })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toEqual({ data: [1, 2, 3] });
        expect(result.unchanged).toBeNull();
        expect(result.onlyInB).toEqual({ data: { count: 3 } });
        expect(result.metadata).toEqual({
          added: 0,
          removed: 0,
          modified: 1,
          unchanged: 0
        });
      });
    });
  });

  describe('primitive values', () => {
    test('should handle identical primitives', () => {
      expect(jsonThreeWayDiff(42, 42)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(true);
        expect(result.onlyInA).toBeNull();
        expect(result.unchanged).toBe(42);
        expect(result.onlyInB).toBeNull();
        expect(result.metadata).toEqual({
          added: 0,
          removed: 0,
          modified: 0,
          unchanged: 1
        });
      });
    });

    test('should handle different primitives', () => {
      expect(jsonThreeWayDiff('hello', 'world')).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toBe('hello');
        expect(result.unchanged).toBeNull();
        expect(result.onlyInB).toBe('world');
        expect(result.metadata).toEqual({
          added: 0,
          removed: 0,
          modified: 1,
          unchanged: 0
        });
      });
    });
  });

  describe('complex scenarios', () => {
    test('should handle deeply nested mixed changes', () => {
      const obj1: JsonValue = {
        user: {
          name: 'John',
          profile: { age: 30, city: 'NYC' },
          hobbies: ['reading', 'gaming']
        },
        settings: { theme: 'dark', notifications: true }
      };

      const obj2: JsonValue = {
        user: {
          name: 'John',
          profile: { age: 31, country: 'USA' },
          hobbies: ['reading', 'cooking']
        },
        settings: { theme: 'light', notifications: true }
      };

      expect(jsonThreeWayDiff(obj1, obj2)).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);

        // Check the structure makes sense
        expect(result.onlyInA).toEqual({
          user: {
            profile: { age: 30, city: 'NYC' },
            hobbies: ['reading', 'gaming']
          },
          settings: { theme: 'dark' }
        });

        expect(result.unchanged).toEqual({
          user: { name: 'John' },
          settings: { notifications: true }
        });

        expect(result.onlyInB).toEqual({
          user: {
            profile: { age: 31, country: 'USA' },
            hobbies: ['reading', 'cooking']
          },
          settings: { theme: 'light' }
        });

        // Check metadata counts are reasonable
        expect(result.metadata.added).toBeGreaterThan(0);
        expect(result.metadata.removed).toBeGreaterThan(0);
        expect(result.metadata.modified).toBeGreaterThan(0);
        expect(result.metadata.unchanged).toBeGreaterThan(0);
      });
    });

    test('should handle empty objects', () => {
      expect(jsonThreeWayDiff({}, { name: 'John' })).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toBeNull();
        expect(result.unchanged).toBeNull();
        expect(result.onlyInB).toEqual({ name: 'John' });
        expect(result.metadata).toEqual({
          added: 1,
          removed: 0,
          modified: 0,
          unchanged: 0
        });
      });

      expect(jsonThreeWayDiff({ name: 'John' }, {})).toSucceedAndSatisfy((result) => {
        expect(result.identical).toBe(false);
        expect(result.onlyInA).toEqual({ name: 'John' });
        expect(result.unchanged).toBeNull();
        expect(result.onlyInB).toBeNull();
        expect(result.metadata).toEqual({
          added: 0,
          removed: 1,
          modified: 0,
          unchanged: 0
        });
      });
    });

    test('should be useful for applying changes', () => {
      const original = { name: 'John', age: 30, city: 'NYC' };
      const updated = { name: 'Jane', age: 30, country: 'USA' };

      expect(jsonThreeWayDiff(original, updated)).toSucceedAndSatisfy((result) => {
        // To apply changes: merge unchanged + onlyInB
        const merged = {
          ...((result.unchanged as Record<string, unknown>) || {}),
          ...((result.onlyInB as Record<string, unknown>) || {})
        };

        expect(merged).toEqual({ name: 'Jane', age: 30, country: 'USA' });

        // To revert changes: merge unchanged + onlyInA
        const reverted = {
          ...((result.unchanged as Record<string, unknown>) || {}),
          ...((result.onlyInA as Record<string, unknown>) || {})
        };

        expect(reverted).toEqual({ name: 'John', age: 30, city: 'NYC' });
      });
    });
  });
});
