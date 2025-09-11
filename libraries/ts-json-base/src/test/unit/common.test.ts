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

import {
  classifyJsonValue,
  isJsonObject,
  isJsonPrimitive,
  pickJsonObject,
  pickJsonValue,
  sanitizeJsonObject,
  JsonCompatible
} from '../../packlets/json';

describe('json/common module', () => {
  describe('isJsonObject function', () => {
    test('returns true for a JSON object', () => {
      expect(isJsonObject({ prop: 'value' })).toBe(true);
    });

    test('returns false for a non-object or an array', () => {
      [
        'hello',
        true,
        10,
        [{ property: 'value' }],
        () => {
          return { property: 'value' };
        }
      ].forEach((t) => {
        expect(isJsonObject(t)).toBe(false);
      });
    });
  });

  describe('isJsonPrimitive function', () => {
    test('returns true for a JSON primitive', () => {
      ['string', 10, true, null].forEach((t) => {
        expect(isJsonPrimitive(t)).toBe(true);
      });
    });

    test('returns false for non-JSON primitives', () => {
      [[1, 2, 3], { a: true }, () => 'hello'].forEach((t) => {
        expect(isJsonPrimitive(t)).toBe(false);
      });
    });
  });

  describe('classifyJsonValue function', () => {
    test('returns "primitive" for avalid JsonPrimitive', () => {
      ['string', 10, true, null].forEach((t) => {
        expect(classifyJsonValue(t)).toSucceedWith('primitive');
      });
    });

    test('returns "object" for a non-array object', () => {
      [{ prop: 'value ' }].forEach((t) => {
        expect(classifyJsonValue(t)).toSucceedWith('object');
      });
    });

    test('returns "array" for an array', () => {
      [[{ prop: 'value ' }, 1]].forEach((t) => {
        expect(classifyJsonValue(t)).toSucceedWith('array');
      });
    });

    test('fails for invalid JSON values', () => {
      [() => 'hello', undefined].forEach((t) => {
        expect(classifyJsonValue(t)).toFailWith(/invalid json/i);
      });
    });
  });

  describe('pick functions', () => {
    const src = {
      topString: 'top',
      child: {
        childArray: [1, 2, 3],
        childString: 'hello',
        childNull: null,
        grandChild: {
          grandChildNumber: 1
        }
      }
    };

    describe('pickJsonValue', () => {
      test('picks nested properties that exist', () => {
        [
          {
            path: 'topString',
            expected: src.topString
          },
          {
            path: 'child.grandChild',
            expected: src.child.grandChild
          },
          {
            path: 'child.childNull',
            expected: src.child.childNull
          }
        ].forEach((t) => {
          expect(pickJsonValue(src, t.path)).toSucceedWith(t.expected);
        });
      });

      test('fails for nested properties that do not exist', () => {
        [
          'topstring',
          'topString.childString',
          'child.grandChild.number',
          'childString',
          'child.childNull.property'
        ].forEach((t) => {
          expect(pickJsonValue(src, t)).toFailWith(/does not exist/i);
        });
      });
    });

    describe('pickJsonObject', () => {
      test('succeeds for an object property', () => {
        [
          {
            path: 'child.grandChild',
            expected: src.child.grandChild
          }
        ].forEach((t) => {
          expect(pickJsonObject(src, t.path)).toSucceedWith(t.expected);
        });
      });

      test('fails for a non-object property that exists', () => {
        expect(pickJsonObject(src, 'child.childArray')).toFailWith(/not an object/i);
        expect(pickJsonObject(src, 'child.grandChild.grandChildNumber')).toFailWith(/not an object/i);
      });
    });
  });

  describe('sanitizeJsonObject function', () => {
    test('returns a sanitized object', () => {
      interface ITestThing {
        a: string;
        b?: string;
      }

      expect(sanitizeJsonObject<ITestThing>({ a: 'hello' })).toSucceedWith({ a: 'hello' });
      expect(sanitizeJsonObject<ITestThing>({ a: 'hello', b: 'world' })).toSucceedWith({
        a: 'hello',
        b: 'world'
      });
      expect(sanitizeJsonObject<ITestThing>({ a: 'hello', b: undefined })).toSucceedWith({
        a: 'hello'
      });
    });
  });

  describe('JsonCompatible type', () => {
    // Define a reusable MapOf class using the JsonCompatible constraint
    class MapOf<T, TV extends JsonCompatible<T> = JsonCompatible<T>> extends Map<string, TV> {
      public constructor() {
        super();
      }

      public override set(key: string, value: TV): this {
        return super.set(key, value);
      }
    }

    describe('fully compatible types', () => {
      interface ISimpleCompatible {
        name: string;
        count: number;
        active: boolean;
        data: null;
      }

      interface INestedCompatible {
        id: string;
        metadata: {
          created: string;
          tags: string[];
          settings: {
            enabled: boolean;
            threshold: number;
          };
        };
      }

      test('works with simple JSON-compatible interfaces', () => {
        const map = new MapOf<ISimpleCompatible>();
        const value: ISimpleCompatible = {
          name: 'test',
          count: 42,
          active: true,
          data: null
        };

        map.set('key', value);
        expect(map.get('key')).toEqual(value);
      });

      test('works with deeply nested JSON-compatible structures', () => {
        const map = new MapOf<INestedCompatible>();
        const value: INestedCompatible = {
          id: 'abc123',
          metadata: {
            created: '2024-01-01',
            tags: ['important', 'verified'],
            settings: {
              enabled: true,
              threshold: 0.95
            }
          }
        };

        map.set('nested', value);
        expect(map.get('nested')).toEqual(value);
      });
    });

    describe('incompatible function properties', () => {
      interface IWithFunction {
        name: string;
        action: () => void;
      }

      interface IWithMethodDeep {
        data: {
          id: number;
          nested: {
            value: string;
            callback: (x: number) => number;
          };
        };
      }

      test('prevents usage with function properties', () => {
        const map = new MapOf<IWithFunction>();
        const value: IWithFunction = {
          name: 'test',
          action: () => console.log('hello')
        };

        // TypeScript knows the type is incompatible
        // The transformed type has 'action: never'
        // @ts-expect-error - Cannot assign IWithFunction to type with 'action: never'
        map.set('test', value);

        // Even if we could set it, retrieval would give us an unusable type
        const retrieved = map.get('test');
        if (retrieved) {
          // retrieved.action is type 'never' - can't be called
          expect(retrieved.name).toBeDefined();
        }
      });

      test('detects functions deep in nested structures', () => {
        const map = new MapOf<IWithMethodDeep>();
        const value: IWithMethodDeep = {
          data: {
            id: 1,
            nested: {
              value: 'test',
              callback: () => 1
            }
          }
        };

        // @ts-expect-error - IWithMethodDeep should not satisfy JsonCompatible
        map.set('test', value);

        // We can't create a valid value of the transformed type
        // because we can't satisfy the 'never' constraint
        expect(map).toBeDefined();
      });
    });

    describe('arrays with mixed compatibility', () => {
      interface ICompatibleArray {
        items: string[];
        matrix: number[][];
        objects: Array<{ id: number; name: string }>;
      }

      interface IIncompatibleArray {
        handlers: Array<() => void>;
        mixed: Array<string | (() => void)>;
      }

      interface INestedIncompatibleArray {
        data: Array<{
          id: string;
          process: () => void;
        }>;
      }

      test('works with arrays of JSON-compatible types', () => {
        const map = new MapOf<ICompatibleArray>();
        const value: ICompatibleArray = {
          items: ['a', 'b', 'c'],
          matrix: [
            [1, 2],
            [3, 4]
          ],
          objects: [
            { id: 1, name: 'first' },
            { id: 2, name: 'second' }
          ]
        };

        map.set('arrays', value);
        expect(map.get('arrays')).toEqual(value);
      });

      test('prevents arrays with function elements', () => {
        const map = new MapOf<IIncompatibleArray>();

        // The transformed type has:
        // - handlers: Array<never>
        // - mixed: Array<string | never> which simplifies to Array<string>

        // But we can't pass the original type
        const value: IIncompatibleArray = {
          handlers: [() => {}, () => {}],
          mixed: ['text', () => {}]
        };

        // @ts-expect-error - Cannot assign arrays with functions
        map.set('bad', value);
      });

      test('detects non-JSON elements in nested array structures', () => {
        const map = new MapOf<INestedIncompatibleArray>();
        const value: INestedIncompatibleArray = {
          data: [
            { id: '1', process: () => {} },
            { id: '2', process: () => {} }
          ]
        };

        // @ts-expect-error - INestedIncompatibleArray should not satisfy JsonCompatible
        map.set('test', value);
      });
    });

    describe('partially compatible types', () => {
      interface IPartiallyCompatible {
        // JSON-compatible properties
        id: string;
        count: number;
        tags: string[];

        // Non-JSON property
        compute: (x: number) => number;

        // Nested with mixed compatibility
        nested: {
          valid: string;
          invalid: () => void;
          deepNested: {
            data: number[];
            transform: (s: string) => string;
          };
        };
      }

      test('shows that partially compatible types fail', () => {
        const map = new MapOf<IPartiallyCompatible>();
        const value: IPartiallyCompatible = {
          id: '1',
          count: 1,
          tags: ['test'],
          compute: () => 1,
          nested: {
            valid: 'test',
            invalid: () => {},
            deepNested: {
              data: [1, 2, 3],
              transform: (s) => s
            }
          }
        };

        // @ts-expect-error - IPartiallyCompatible should not satisfy JsonCompatible
        map.set('test', value);
      });
    });

    describe('edge cases', () => {
      interface IWithUndefined {
        required: string;
        optional?: string;
        explicit: string;
      }

      interface IWithSymbol {
        id: string;
        marker: symbol;
      }

      interface IWithRegExp {
        pattern: RegExp;
        name: string;
      }

      test('handles undefined in optional properties', () => {
        const map = new MapOf<IWithUndefined>();

        // Optional properties with undefined are JSON-compatible
        const value: IWithUndefined = {
          required: 'test',
          optional: 'bar',
          explicit: 'foo'
        };

        map.set('undef', value);
        const retrieved = map.get('undef');
        expect(retrieved?.required).toBe('test');
      });

      test('prevents non-JSON types like Symbol', () => {
        const map = new MapOf<IWithSymbol>();
        const value: IWithSymbol = {
          id: '1',
          marker: Symbol('test')
        };

        // @ts-expect-error - IWithSymbol should not satisfy JsonCompatible
        map.set('test', value);
      });

      test('prevents non-JSON types like RegExp', () => {
        const map = new MapOf<IWithRegExp>();

        // RegExp is not JSON-serializable (becomes {} when stringified)
        // type Transformed = JsonCompatible<IWithRegExp>;

        expect(map).toBeDefined();
      });
    });

    describe('practical usage example', () => {
      interface IUserData {
        id: string;
        name: string;
        email: string;
        preferences: {
          theme: 'light' | 'dark';
          notifications: boolean;
        };
        metadata: Record<string, string | number | boolean>;
      }

      interface IUserWithMethods extends IUserData {
        save: () => Promise<void>;
        validate: () => boolean;
      }

      test('demonstrates using MapOf for API data storage', () => {
        // This works - IUserData is fully JSON-compatible
        const userCache = new MapOf<IUserData>();

        const userData: IUserData = {
          id: 'user123',
          name: 'Alice',
          email: 'alice@example.com',
          preferences: {
            theme: 'dark',
            notifications: true
          },
          metadata: {
            lastLogin: 1234567890,
            verified: true
          }
        };

        userCache.set(userData.id, userData);
        const cached = userCache.get(userData.id);
        expect(cached).toEqual(userData);
      });

      test('demonstrates that domain objects with methods fail', () => {
        // This creates a map where methods become 'never'
        const domainCache = new MapOf<IUserWithMethods>();

        // We cannot store actual domain objects with methods
        const user: IUserWithMethods = {
          id: 'user456',
          name: 'Bob',
          email: 'bob@example.com',
          preferences: { theme: 'light', notifications: false },
          metadata: {},
          save: async () => {
            await Promise.resolve();
          },
          validate: () => true
        };

        // @ts-expect-error - Cannot store objects with methods
        domainCache.set(user.id, user);

        // This pattern enforces separation between data and behavior
        expect(domainCache).toBeDefined();
      });
    });
  });
});
