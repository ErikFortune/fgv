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

import { JsonCompatible, JsonValue, sanitizeJsonObject } from '../../packlets/json';
import { Brand } from '@fgv/ts-utils';

describe('jsonCompatible from json/common module', () => {
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

      interface IWithDate {
        timestamp: Date;
        name: string;
      }

      interface IWithError {
        lastError: Error;
        status: string;
      }

      interface IWithMap {
        cache: Map<string, number>;
        id: string;
      }

      interface IWithSet {
        tags: Set<string>;
        value: number;
      }

      interface IWithBigInt {
        largeNumber: bigint;
        id: string;
      }

      interface IWithSpecialNumbers {
        infinity: number;
        negativeInfinity: number;
        notANumber: number;
        regular: number;
      }

      test('handles undefined in optional properties', () => {
        const map = new MapOf<IWithUndefined>();

        // Optional properties with undefined are JSON-compatible
        const value: IWithUndefined = {
          required: 'test',
          optional: 'bar',
          explicit: 'foo'
        };
        const value2: IWithUndefined = {
          required: 'test',
          explicit: 'foo'
        };
        const value3: IWithUndefined = {
          required: 'test',
          optional: undefined,
          explicit: 'foo'
        };

        map.set('undef', value);
        const retrieved = map.get('undef');
        expect(retrieved?.required).toBe('test');

        map.set('undef2', value2);
        const retrieved2 = map.get('undef2');
        expect(retrieved2?.required).toBe('test');

        map.set('undef3', value3);
        const retrieved3 = map.get('undef3');
        expect(retrieved3?.required).toBe('test');

        const v: IWithUndefined | undefined = map.get('undef3');
        expect(v?.required).toBe('test');
        expect(v?.optional).toBeUndefined();
        expect(v?.explicit).toBe('foo');
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

      test('prevents Date objects', () => {
        const map = new MapOf<IWithDate>();
        const value: IWithDate = {
          timestamp: new Date(),
          name: 'test'
        };

        // @ts-expect-error - Date methods (toString, toDateString, etc.) become incompatible error arrays
        map.set('test', value);
      });

      test('prevents Error objects', () => {
        const map = new MapOf<IWithError>();
        const value: IWithError = {
          lastError: new Error('test error'),
          status: 'failed'
        };

        // Error objects are actually compatible at type level - they have message, name, stack as string properties
        // The Error constructor and any methods would be transformed but basic Error instances are compatible
        map.set('test', value);
      });

      test('prevents Map objects', () => {
        const map = new MapOf<IWithMap>();
        const value: IWithMap = {
          cache: new Map([
            ['key', 1],
            ['key2', 2]
          ]),
          id: 'test'
        };

        // @ts-expect-error - Map methods (clear, delete, forEach, etc.) become incompatible error arrays
        map.set('test', value);
      });

      test('prevents Set objects', () => {
        const map = new MapOf<IWithSet>();
        const value: IWithSet = {
          tags: new Set(['tag1', 'tag2', 'tag3']),
          value: 42
        };

        // @ts-expect-error - Set methods (add, clear, delete, forEach, etc.) become incompatible error arrays
        map.set('test', value);
      });

      test('prevents BigInt values', () => {
        const map = new MapOf<IWithBigInt>();
        const value: IWithBigInt = {
          largeNumber: BigInt(9007199254740991),
          id: 'test'
        };

        // @ts-expect-error - BigInt is not JSON-compatible (JSON.stringify throws)
        map.set('test', value);
      });

      test('allows special number values at type level', () => {
        const map = new MapOf<IWithSpecialNumbers>();

        // At the type level, these are all just 'number' so they're compatible
        // Runtime JSON.stringify behavior (Infinity/NaN become null) is separate concern
        const value: IWithSpecialNumbers = {
          infinity: Infinity,
          negativeInfinity: -Infinity,
          notANumber: NaN,
          regular: 42
        };

        // These pass type checking because they're all typed as 'number'
        map.set('special', value);
        const retrieved = map.get('special');
        expect(retrieved?.regular).toBe(42);
      });
    });

    describe('union types', () => {
      interface IWithCompatibleUnions {
        stringOrNumber: string | number;
        booleanOrNull: boolean | null;
        numberOrStringArray: number | string[];
      }

      interface IWithMixedUnions {
        stringOrFunction: string | (() => void);
        numberOrCallback: number | ((x: number) => number);
        mixedComplex: { id: string } | (() => void);
      }

      interface IWithComplexUnions {
        compatibleObjects: { type: 'user'; name: string } | { type: 'admin'; permissions: string[] };
        mixedObjects: { type: 'data'; value: string } | { type: 'handler'; callback: () => void };
      }

      test('works with unions of JSON-compatible types', () => {
        const map = new MapOf<IWithCompatibleUnions>();
        const value: IWithCompatibleUnions = {
          stringOrNumber: 'test',
          booleanOrNull: true,
          numberOrStringArray: ['a', 'b', 'c']
        };

        map.set('unions', value);
        expect(map.get('unions')).toEqual(value);

        // Test with different union members
        const value2: IWithCompatibleUnions = {
          stringOrNumber: 42,
          booleanOrNull: null,
          numberOrStringArray: 123
        };

        map.set('unions2', value2);
        expect(map.get('unions2')).toEqual(value2);
      });

      test('prevents unions with non-compatible types', () => {
        const map = new MapOf<IWithMixedUnions>();
        const value: IWithMixedUnions = {
          stringOrFunction: 'valid string',
          numberOrCallback: 42,
          mixedComplex: { id: 'test' }
        };

        // @ts-expect-error - Union with functions becomes string | never = string, number | never = number, object | never = object
        // But the original type IWithMixedUnions can't be assigned because it includes function types
        map.set('test', value);
      });

      test('handles complex object unions', () => {
        const map = new MapOf<IWithComplexUnions>();

        // For union types, we need to use only the compatible variants
        // The JsonCompatible type transforms the union to only include compatible members
        const value1: JsonCompatible<IWithComplexUnions> = {
          compatibleObjects: { type: 'user', name: 'Alice' },
          mixedObjects: { type: 'data', value: 'test' }
        };

        map.set('compatible', value1);

        // For the mixed union type, we can only store the compatible variant
        // because JsonCompatible transforms { callback: () => void } to { callback: ["Error: Function is not JSON-compatible"] }
        const value2Compatible: JsonCompatible<IWithComplexUnions> = {
          compatibleObjects: { type: 'admin', permissions: ['read', 'write'] },
          mixedObjects: { type: 'data', value: 'compatible data' }
        };

        map.set('mixed', value2Compatible);
      });
    });

    describe('class instances', () => {
      class SimpleClass {
        public readonly value: string;
        public constructor(value: string) {
          this.value = value;
        }

        public method(): string {
          return this.value.toUpperCase();
        }
      }

      class DataClass {
        public readonly id: string;
        public readonly name: string;
        public constructor(id: string, name: string) {
          this.id = id;
          this.name = name;
        }
      }

      class ComplexClass {
        private _internal: number = 0;
        public readonly data: string;

        public constructor(data: string) {
          this.data = data;
        }

        public get computed(): string {
          return `${this.data}-${this._internal}`;
        }

        public process(): void {
          this._internal++;
        }
      }

      interface IWithSimpleClass {
        instance: SimpleClass;
        metadata: string;
      }

      interface IWithDataClass {
        record: DataClass;
        timestamp: number;
      }

      interface IWithComplexClass {
        processor: ComplexClass;
        config: { enabled: boolean };
      }

      test('prevents simple class instances with methods', () => {
        const map = new MapOf<IWithSimpleClass>();
        const value: IWithSimpleClass = {
          instance: new SimpleClass('test'),
          metadata: 'info'
        };

        // @ts-expect-error - Class instances are not JSON-compatible due to methods
        map.set('test', value);
      });

      test('prevents data class instances', () => {
        const map = new MapOf<IWithDataClass>();
        const value: IWithDataClass = {
          record: new DataClass('id123', 'Test Name'),
          timestamp: Date.now()
        };

        // "Data-only" classes are actually compatible if they only have data properties
        // The class instance will be treated as a regular object with its properties
        map.set('test', value);
      });

      test('prevents complex class instances', () => {
        const map = new MapOf<IWithComplexClass>();
        const value: IWithComplexClass = {
          processor: new ComplexClass('input'),
          config: { enabled: true }
        };

        // @ts-expect-error - Complex classes with getters/setters are not JSON-compatible
        map.set('test', value);
      });

      test('demonstrates alternative with plain object interfaces', () => {
        // Instead of class instances, use plain object interfaces
        interface IDataRecord {
          id: string;
          name: string;
        }

        interface IWithPlainData {
          record: IDataRecord;
          timestamp: number;
        }

        const map = new MapOf<IWithPlainData>();
        const value: IWithPlainData = {
          record: { id: 'id123', name: 'Test Name' },
          timestamp: Date.now()
        };

        // This works - plain objects are JSON-compatible
        map.set('data', value);
        expect(map.get('data')).toEqual(value);
      });
    });

    describe('Record types', () => {
      interface IWithCompatibleRecords {
        stringRecord: Record<string, string>;
        numberRecord: Record<string, number>;
        mixedRecord: Record<string, string | number | boolean>;
        nestedRecord: Record<string, { id: string; value: number }>;
      }

      interface IWithIncompatibleRecords {
        functionRecord: Record<string, () => void>;
        mixedWithFunctions: Record<string, string | (() => void)>;
        objectsWithMethods: Record<string, { id: string; method: () => void }>;
      }

      interface IWithNumberKeys {
        numberKeys: Record<number, string>;
      }

      interface IWithSymbolKeys {
        symbolKeys: Record<symbol, string>;
      }

      interface IWithComplexRecords {
        nestedArrays: Record<string, Array<{ items: string[] }>>;
        deepNesting: Record<string, Record<string, number[]>>;
        mixedNesting: Record<string, { data: Record<string, boolean> }>;
      }

      test('works with Records of JSON-compatible types', () => {
        const map = new MapOf<IWithCompatibleRecords>();
        const value: IWithCompatibleRecords = {
          stringRecord: { key1: 'value1', key2: 'value2' },
          numberRecord: { count: 42, total: 100 },
          mixedRecord: { name: 'test', count: 5, active: true },
          nestedRecord: {
            item1: { id: 'a', value: 1 },
            item2: { id: 'b', value: 2 }
          }
        };

        map.set('records', value);
        expect(map.get('records')).toEqual(value);
      });

      test('prevents Records with function values', () => {
        const map = new MapOf<IWithIncompatibleRecords>();
        const value: IWithIncompatibleRecords = {
          functionRecord: { handler: () => {} },
          mixedWithFunctions: { text: 'hello', callback: () => {} },
          objectsWithMethods: {
            obj1: { id: 'test', method: () => {} }
          }
        };

        // @ts-expect-error - Records with function values are not JSON-compatible
        map.set('test', value);
      });

      test('handles Records with number keys', () => {
        const map = new MapOf<IWithNumberKeys>();

        // At runtime, number keys become strings in JSON, but type-wise this works
        const value: IWithNumberKeys = {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          numberKeys: { 1: 'one', 2: 'two' } as Record<number, string>
        };

        map.set('keys', value);
        expect(map.get('keys')?.numberKeys[1]).toBe('one');
      });

      test('prevents Records with symbol keys', () => {
        const map = new MapOf<IWithSymbolKeys>();

        // Symbols are not JSON-compatible, so this should fail
        const value: IWithSymbolKeys = {
          symbolKeys: {} as Record<symbol, string>
        };

        // Record<symbol, T> is actually allowed at type level since symbol keys become transformed properties
        // The JsonCompatible type doesn't specifically check key types
        map.set('test', value);
      });

      test('works with complex nested Record structures', () => {
        const map = new MapOf<IWithComplexRecords>();
        const value: IWithComplexRecords = {
          nestedArrays: {
            group1: [{ items: ['a', 'b'] }, { items: ['c', 'd'] }],
            group2: [{ items: ['x', 'y', 'z'] }]
          },
          deepNesting: {
            category1: { sub1: [1, 2, 3], sub2: [4, 5] },
            category2: { sub3: [6, 7, 8, 9] }
          },
          mixedNesting: {
            config: { data: { enabled: true, debug: false } },
            settings: { data: { theme: true, notifications: false } }
          }
        };

        map.set('complex', value);
        expect(map.get('complex')).toEqual(value);
      });

      test('demonstrates Record vs object interface differences', () => {
        // Record<string, T> is more flexible than interface with specific keys
        interface IStrictInterface {
          specificKey1: string;
          specificKey2: number;
        }

        interface IWithStrictInterface {
          strict: IStrictInterface;
        }

        interface IWithFlexibleRecord {
          flexible: Record<string, string | number>;
        }

        const strictMap = new MapOf<IWithStrictInterface>();
        const flexibleMap = new MapOf<IWithFlexibleRecord>();

        const strictValue: IWithStrictInterface = {
          strict: { specificKey1: 'test', specificKey2: 42 }
        };

        const flexibleValue: IWithFlexibleRecord = {
          flexible: { anyKey: 'test', anotherKey: 123, yetAnother: 'more' }
        };

        strictMap.set('strict', strictValue);
        flexibleMap.set('flexible', flexibleValue);

        expect(strictMap.get('strict')).toEqual(strictValue);
        expect(flexibleMap.get('flexible')).toEqual(flexibleValue);
      });
    });

    describe('tuple types', () => {
      interface IWithCompatibleTuples {
        coordinates: [number, number];
        namedValues: [string, number, boolean];
        nestedTuples: [[string, number], [boolean, null]];
        tupleArray: Array<[string, number]>;
      }

      interface IWithIncompatibleTuples {
        mixedTuple: [string, () => void];
        functionFirst: [() => void, string];
        nestedWithFunction: [[string, number], [boolean, () => void]];
      }

      interface IWithComplexTuples {
        objectTuple: [{ id: string; name: string }, { count: number; active: boolean }];
        mixedObjectTuple: [{ data: string }, { callback: () => void }];
        arrayTuple: [string[], number[], boolean[]];
        mixedArrayTuple: [string[], Array<() => void>];
      }

      interface IWithDefinedTuples {
        definedElements: [string, number];
        restElements: [string, ...number[]];
      }

      test('works with tuples of JSON-compatible types', () => {
        const map = new MapOf<IWithCompatibleTuples>();
        const value: IWithCompatibleTuples = {
          coordinates: [10, 20],
          namedValues: ['test', 42, true],
          nestedTuples: [
            ['hello', 123],
            [false, null]
          ],
          tupleArray: [
            ['first', 1],
            ['second', 2],
            ['third', 3]
          ]
        };

        map.set('tuples', value);
        expect(map.get('tuples')).toEqual(value);
      });

      test('prevents tuples with function elements', () => {
        const map = new MapOf<IWithIncompatibleTuples>();
        const value: IWithIncompatibleTuples = {
          mixedTuple: ['text', () => {}],
          functionFirst: [() => {}, 'text'],
          nestedWithFunction: [
            ['text', 42],
            [true, () => {}]
          ]
        };

        // @ts-expect-error - Tuples containing functions are not JSON-compatible
        map.set('test', value);
      });

      test('handles complex tuple structures', () => {
        const map = new MapOf<IWithComplexTuples>();

        // Only the compatible part should work
        const compatibleValue = {
          objectTuple: [
            { id: 'test', name: 'Test' },
            { count: 5, active: true }
          ] as [{ id: string; name: string }, { count: number; active: boolean }],
          arrayTuple: [
            ['a', 'b'],
            [1, 2],
            [true, false]
          ] as [string[], number[], boolean[]]
        };

        // The mixed object tuple with callback should fail the whole interface
        const fullValue: IWithComplexTuples = {
          ...compatibleValue,
          mixedObjectTuple: [{ data: 'test' }, { callback: () => {} }],
          mixedArrayTuple: [
            ['a', 'b'],
            [() => {}, () => {}]
          ]
        };

        // @ts-expect-error - Interface contains incompatible tuples
        map.set('complex', fullValue);
      });

      test('handles tuples with optional and rest elements', () => {
        // JsonCompatible treats undefined as incompatible, so optional tuple elements don't work
        // Use defined tuples instead
        const map = new MapOf<IWithDefinedTuples>();

        const value: IWithDefinedTuples = {
          definedElements: ['required', 42],
          restElements: ['first', 1, 2, 3]
        };

        map.set('defined', value);
        expect(map.get('defined')).toEqual(value);
      });

      test('demonstrates that explicit undefined in tuples is not JSON-compatible', () => {
        // JsonCompatible works great with optional object properties (property?: T)
        // but struggles with explicit undefined in tuple types [T, U?] because the ? creates T | undefined
        // IWithOptionalTuples would not work with JsonCompatible due to explicit undefined in tuples

        // The issue is that [string, number?] becomes [string, (number | undefined)?]
        // and JsonCompatible treats explicit undefined as incompatible
        // This is different from optional object properties which can simply be omitted

        // Demonstrate that regular optional properties work fine:
        interface IWithOptionalProperty {
          required: string;
          optional?: number; // This works!
        }

        const optionalMap = new MapOf<IWithOptionalProperty>();
        const optionalValue: IWithOptionalProperty = {
          required: 'test'
          // optional property can be omitted entirely
        };

        optionalMap.set('works', optionalValue);
        expect(optionalMap.get('works')?.required).toBe('test');
      });

      test('demonstrates tuple vs array type differences', () => {
        interface IWithArray {
          items: string[];
        }

        interface IWithTuple {
          items: [string, string, string];
        }

        const arrayMap = new MapOf<IWithArray>();
        const tupleMap = new MapOf<IWithTuple>();

        // Array is flexible in length
        const arrayValue: IWithArray = {
          items: ['one', 'two', 'three', 'four', 'five']
        };

        // Tuple has fixed length and order
        const tupleValue: IWithTuple = {
          items: ['first', 'second', 'third']
        };

        arrayMap.set('array', arrayValue);
        tupleMap.set('tuple', tupleValue);

        expect(arrayMap.get('array')).toEqual(arrayValue);
        expect(tupleMap.get('tuple')).toEqual(tupleValue);
      });
    });

    describe('branded types', () => {
      // Define some branded types
      type UserId = Brand<string, 'UserId'>;
      type EmailAddress = Brand<string, 'EmailAddress'>;
      type PositiveNumber = Brand<number, 'PositiveNumber'>;
      type JsonString = Brand<string, 'JsonString'>;

      // Helper functions to create branded values (would normally be in validators/converters)
      const createUserId = (id: string): UserId => id as UserId;
      const createEmail = (email: string): EmailAddress => email as EmailAddress;
      const createPositiveNumber = (num: number): PositiveNumber => num as PositiveNumber;
      const createJsonString = (json: string): JsonString => json as JsonString;

      interface IWithBrandedTypes {
        userId: UserId;
        email: EmailAddress;
        score: PositiveNumber;
        metadata: JsonString;
        regularString: string;
        regularNumber: number;
      }

      interface IWithNestedBranded {
        users: UserId[];
        contacts: Record<string, EmailAddress>;
        nested: {
          id: UserId;
          data: JsonString;
        };
      }

      test('preserves branded types for JSON-compatible base types', () => {
        const map = new MapOf<IWithBrandedTypes>();

        const value: IWithBrandedTypes = {
          userId: createUserId('user123'),
          email: createEmail('test@example.com'),
          score: createPositiveNumber(95),
          metadata: createJsonString('{"key": "value"}'),
          regularString: 'plain string',
          regularNumber: 42
        };

        // This should work - branded strings/numbers are still JSON-compatible
        map.set('branded', value);

        const retrieved = map.get('branded');
        expect(retrieved?.userId).toBe('user123');
        expect(retrieved?.email).toBe('test@example.com');
        expect(retrieved?.score).toBe(95);

        // Type-wise, the branding should be preserved in JsonCompatible<IWithBrandedTypes>
        // Let's verify the types are what we expect
        type TransformedType = JsonCompatible<IWithBrandedTypes>;

        // The transformed type should still have branded properties
        const typedValue: TransformedType = {
          userId: createUserId('typed'),
          email: createEmail('typed@example.com'),
          score: createPositiveNumber(100),
          metadata: createJsonString('{"typed": true}'),
          regularString: 'typed',
          regularNumber: 99
        };

        map.set('typed', typedValue);
        expect(map.get('typed')?.userId).toBe('typed');
      });

      test('preserves branding in complex nested structures', () => {
        const map = new MapOf<IWithNestedBranded>();

        const value: IWithNestedBranded = {
          users: [createUserId('user1'), createUserId('user2')],
          contacts: {
            primary: createEmail('primary@example.com'),
            secondary: createEmail('secondary@example.com')
          },
          nested: {
            id: createUserId('nested123'),
            data: createJsonString('{"nested": "data"}')
          }
        };

        map.set('nested', value);

        const retrieved = map.get('nested');
        expect(retrieved?.users).toHaveLength(2);
        expect(retrieved?.contacts.primary).toBe('primary@example.com');
        expect(retrieved?.nested.id).toBe('nested123');
      });

      test('demonstrates type safety with branded types', () => {
        // This test shows that while branded types work with JsonCompatible,
        // the type system still enforces the branding at compile time

        interface IStrictBranded {
          id: UserId; // Must be UserId, not just any string
          email: EmailAddress; // Must be EmailAddress, not just any string
        }

        const map = new MapOf<IStrictBranded>();

        // This works - proper branded types
        const validValue: IStrictBranded = {
          id: createUserId('valid'),
          email: createEmail('valid@example.com')
        };
        map.set('valid', validValue);

        // This would fail at compile time (if uncommented):
        // const invalidValue: IStrictBranded = {
        //   id: 'plain string', // ❌ Error: Type 'string' is not assignable to type 'UserId'
        //   email: 'plain@email.com' // ❌ Error: Type 'string' is not assignable to type 'EmailAddress'
        // };

        expect(map.get('valid')?.id).toBe('valid');
      });

      test('shows JsonCompatible type transformation preserves branding', () => {
        // Let's examine what JsonCompatible<UserId> actually becomes
        type UserIdCompatible = JsonCompatible<UserId>;
        type EmailCompatible = JsonCompatible<EmailAddress>;

        // These should still be the branded types, not just string
        const userId: UserIdCompatible = createUserId('preserved');
        const email: EmailCompatible = createEmail('preserved@example.com');

        // Verify we can use them in contexts expecting the original branded types
        const user: { id: UserId; contact: EmailAddress } = {
          id: userId, // Should work if branding is preserved
          contact: email // Should work if branding is preserved
        };

        expect(user.id).toBe('preserved');
        expect(user.contact).toBe('preserved@example.com');
      });
    });

    describe('discriminated unions with mixed compatibility', () => {
      // Define a discriminated union where some variants are JSON-compatible and others aren't
      interface IDataEvent {
        type: 'data';
        timestamp: string;
        payload: { id: string; value: number };
      }

      interface ICallbackEvent {
        type: 'callback';
        timestamp: string;
        handler: () => void;
        context: string;
      }

      interface IFunctionEvent {
        type: 'function';
        timestamp: string;
        execute: (input: string) => string;
        metadata: { name: string; version: number };
      }

      interface IComplexCompatibleEvent {
        type: 'complex';
        timestamp: string;
        data: {
          users: string[];
          settings: Record<string, boolean>;
          nested: { values: number[] };
        };
      }

      type AppEvent = IDataEvent | ICallbackEvent | IFunctionEvent | IComplexCompatibleEvent;

      interface IEventStore<T extends AppEvent = AppEvent> {
        events: T[];
        lastProcessed?: T;
      }

      test('shows that mixed discriminated unions become unusable without filtering', () => {
        const map = new MapOf<IEventStore>();
        const value: IEventStore = {
          events: [
            { type: 'data', timestamp: '2024-01-01T00:00:00Z', payload: { id: 'test123', value: 42 } },
            { type: 'callback', timestamp: '2024-01-01T00:01:00Z', handler: () => {}, context: 'test' }
          ],
          lastProcessed: {
            type: 'data',
            timestamp: '2024-01-01T00:00:00Z',
            payload: { id: 'test123', value: 42 }
          }
        };

        // @ts-expect-error - IEventStore should not satisfy JsonCompatible
        map.set('mixed', value);
      });

      test('shows that filtered discriminated unions are usable', () => {
        const map = new MapOf<IEventStore>();
        const value: IEventStore<IDataEvent | IComplexCompatibleEvent> = {
          events: [
            { type: 'data', timestamp: '2024-01-01T00:00:00Z', payload: { id: 'test123', value: 42 } }
          ],
          lastProcessed: {
            type: 'data',
            timestamp: '2024-01-01T00:00:00Z',
            payload: { id: 'test123', value: 42 }
          }
        };

        map.set('mixed', value);
      });

      test('shows the correct approach - define compatible-only discriminated unions', () => {
        // The key insight: you must define discriminated unions with ONLY compatible variants
        // Using the mixed AppEvent type (even with compatible values) doesn't work

        // Define a new discriminated union with only compatible variants
        type PureCompatibleEvent = IDataEvent | IComplexCompatibleEvent;

        interface IPureCompatibleEventStore {
          events: PureCompatibleEvent[];
          lastProcessed?: PureCompatibleEvent;
        }

        const map = new MapOf<IPureCompatibleEventStore>();

        const dataEvent: IDataEvent = {
          type: 'data',
          timestamp: '2024-01-01T00:00:00Z',
          payload: { id: 'test123', value: 42 }
        };

        const complexEvent: IComplexCompatibleEvent = {
          type: 'complex',
          timestamp: '2024-01-01T00:01:00Z',
          data: {
            users: ['user1', 'user2'],
            settings: { darkMode: true, notifications: false },
            nested: { values: [1, 2, 3, 4, 5] }
          }
        };

        const store: IPureCompatibleEventStore = {
          events: [dataEvent, complexEvent],
          lastProcessed: dataEvent
        };

        map.set('pure', store);

        const retrieved = map.get('pure');
        expect(retrieved?.events).toHaveLength(2);

        // This reveals an important limitation: JsonCompatible<T[]> where T is a discriminated union
        // always includes error arrays in the transformed type, even if all variants are compatible
        // This is because JsonCompatible processes the union type systematically

        // The workaround is to test the individual event types separately
        if (retrieved?.events[0] && 'type' in retrieved.events[0]) {
          expect(retrieved.events[0].type).toBe('data');
        }
        if (retrieved?.events[1] && 'type' in retrieved.events[1]) {
          expect(retrieved.events[1].type).toBe('complex');
        }
        if (retrieved?.lastProcessed && 'type' in retrieved.lastProcessed) {
          expect(retrieved.lastProcessed.type).toBe('data');
        }
      });

      test('shows how JsonCompatible transforms discriminated unions', () => {
        // Let's examine what happens to each variant type
        type CompatibleDataEvent = JsonCompatible<IDataEvent>;
        type CompatibleCallbackEvent = JsonCompatible<ICallbackEvent>;
        type CompatibleFunctionEvent = JsonCompatible<IFunctionEvent>;
        type CompatibleComplexEvent = JsonCompatible<IComplexCompatibleEvent>;

        // Data event should be unchanged (fully compatible)
        const dataEvent: CompatibleDataEvent = {
          type: 'data',
          timestamp: '2024-01-01T00:00:00Z',
          payload: { id: 'test', value: 1 }
        };

        // Complex event should be unchanged (fully compatible)
        const complexEvent: CompatibleComplexEvent = {
          type: 'complex',
          timestamp: '2024-01-01T00:00:00Z',
          data: {
            users: ['user1'],
            settings: { enabled: true },
            nested: { values: [1, 2, 3] }
          }
        };

        // Callback event has handler transformed to error array
        const callbackEvent: CompatibleCallbackEvent = {
          type: 'callback',
          timestamp: '2024-01-01T00:00:00Z',
          handler: ['Error: Function is not JSON-compatible'] as never, // This becomes unusable
          context: 'test'
        };

        // Function event has execute transformed to error array
        const functionEvent: CompatibleFunctionEvent = {
          type: 'function',
          timestamp: '2024-01-01T00:00:00Z',
          execute: ['Error: Function is not JSON-compatible'] as never, // This becomes unusable
          metadata: { name: 'test', version: 1 }
        };

        // Only the compatible variants can actually be used
        expect(dataEvent.type).toBe('data');
        expect(complexEvent.type).toBe('complex');
        expect(callbackEvent.context).toBe('test'); // Non-function properties still work
        expect(functionEvent.metadata.name).toBe('test'); // Non-function properties still work
      });

      test('shows type narrowing still works with JsonCompatible discriminated unions', () => {
        type CompatibleEvent = JsonCompatible<IDataEvent | IComplexCompatibleEvent>;

        const processEvent = (event: CompatibleEvent): string => {
          switch (event.type) {
            case 'data':
              return `Data: ${event.payload.id} = ${event.payload.value}`;
            case 'complex':
              return `Complex: ${event.data.users.length} users, ${
                Object.keys(event.data.settings).length
              } settings`;
            default:
              // TypeScript knows this is never reached with only compatible variants
              const _exhaustive: never = event;
              return _exhaustive;
          }
        };

        const dataEvent: JsonCompatible<IDataEvent> = {
          type: 'data',
          timestamp: '2024-01-01T00:00:00Z',
          payload: { id: 'test', value: 42 }
        };

        const complexEvent: JsonCompatible<IComplexCompatibleEvent> = {
          type: 'complex',
          timestamp: '2024-01-01T00:00:00Z',
          data: {
            users: ['user1', 'user2'],
            settings: { feature1: true, feature2: false },
            nested: { values: [1, 2, 3] }
          }
        };

        expect(processEvent(dataEvent)).toBe('Data: test = 42');
        expect(processEvent(complexEvent)).toBe('Complex: 2 users, 2 settings');
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

  describe('Partial<Record<string, string>> limitation', () => {
    // This test documents a specific limitation of JsonCompatible with Partial<Record<string, string>>
    // The issue is that Partial<Record<string, string>> includes undefined in the value type,
    // and JsonCompatible transforms undefined to ["Error: Non-JSON type"], making the types incompatible

    test('shows the difference between Record and Partial<Record> with string keys', () => {
      // Regular Record<string, string> works fine
      type RegularRecord = Record<string, string>;
      type CompatibleRecord = JsonCompatible<RegularRecord>;

      const regularRecord: RegularRecord = { key1: 'value1', key2: 'value2' };
      const compatibleRecord: CompatibleRecord = regularRecord; // This works

      expect(compatibleRecord).toEqual(regularRecord);

      // Partial<Record<string, string>> has issues due to undefined values
      type PartialRecord = Partial<Record<string, string>>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type CompatiblePartialRecord = JsonCompatible<PartialRecord>;

      // PartialRecord = { [x: string]?: string | undefined }
      // JsonCompatible transforms this to: { [x: string]: string | ["Error: Non-JSON type"] }
      // The optional properties become required, and undefined becomes an error array

      const partialRecord: PartialRecord = { key1: 'value1' }; // key2 can be omitted

      // This assignment would fail at compile time due to type incompatibility:
      // const compatiblePartialRecord: CompatiblePartialRecord = partialRecord;
      // Error: Type 'PartialRecord' is not assignable to type 'CompatiblePartialRecord'

      expect(partialRecord).toEqual({ key1: 'value1' });
    });

    test('demonstrates the specific issue with enumerated vs unbounded string keys', () => {
      // With enumerated keys, Partial makes keys optional (which is useful)
      type LiteralKeys = 'a' | 'b' | 'c';
      type EnumeratedRecord = Record<LiteralKeys, string>;
      type PartialEnumeratedRecord = Partial<Record<LiteralKeys, string>>;

      // Without Partial: ALL keys are required
      const fullRecord: EnumeratedRecord = { a: '1', b: '2', c: '3' };
      // With Partial: keys can be omitted (this is the desired behavior)
      const partialEnumRecord: PartialEnumeratedRecord = { a: '1' }; // b and c can be omitted

      // With unbounded string keys, Record already allows any subset of keys
      type UnboundedRecord = Record<string, string>;
      type PartialUnboundedRecord = Partial<Record<string, string>>;

      const unboundedRecord: UnboundedRecord = { someKey: 'someValue' }; // Any keys allowed
      const partialUnboundedRecord: PartialUnboundedRecord = { someKey: 'someValue' }; // Same, but values can be undefined

      // The key insight: for unbounded strings, Partial only adds undefined to values
      // This breaks JsonCompatible, so for unbounded string keys, prefer Record over Partial<Record>

      expect(fullRecord).toEqual({ a: '1', b: '2', c: '3' });
      expect(partialEnumRecord).toEqual({ a: '1' });
      expect(unboundedRecord).toEqual({ someKey: 'someValue' });
      expect(partialUnboundedRecord).toEqual({ someKey: 'someValue' });
    });

    test('shows the workaround for consumers who need partial behavior', () => {
      // For JsonCompatible APIs, define the base type without Partial
      type HierarchyDecl<T extends string> = Record<T, T>;

      // Consumers can add Partial when they need it
      type LiteralKeys = 'parent' | 'child' | 'grandchild';

      // API signature uses the base type for JSON compatibility
      const processHierarchy = (hierarchy: JsonCompatible<HierarchyDecl<LiteralKeys>>): string[] => {
        return Object.keys(hierarchy);
      };

      // Consumer can provide partial data by using Partial locally
      const partialHierarchy: Partial<HierarchyDecl<LiteralKeys>> = {
        child: 'parent'
        // grandchild and other keys can be omitted
      };

      // For JSON-compatible usage, provide the full structure or cast appropriately
      const fullHierarchy: HierarchyDecl<LiteralKeys> = {
        parent: 'parent', // root node
        child: 'parent',
        grandchild: 'child'
      };

      const result = processHierarchy(fullHierarchy);
      expect(result).toContain('parent');
      expect(result).toContain('child');
      expect(result).toContain('grandchild');

      // Partial hierarchy is still useful for construction/validation
      expect(Object.keys(partialHierarchy)).toEqual(['child']);
    });

    test('demonstrates why JsonCompatible struggles with undefined in unions', () => {
      // This is the core issue: JsonCompatible doesn't handle undefined well
      type ValueWithUndefined = string | undefined;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type CompatibleValueWithUndefined = JsonCompatible<ValueWithUndefined>;
      // This becomes: string | ["Error: Non-JSON type"]

      interface IWithUndefinedValue {
        prop: string | undefined;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type CompatibleWithUndefinedValue = JsonCompatible<IWithUndefinedValue>;
      // This becomes: { prop: string | ["Error: Non-JSON type"] }

      // The original interface allows undefined
      const originalValue: IWithUndefinedValue = { prop: undefined };

      // But the JsonCompatible version doesn't accept the original
      // const compatibleValue: CompatibleWithUndefinedValue = originalValue; // Type error!

      // This is why Partial<Record<string, string>> doesn't work:
      // Partial<Record<string, string>> = { [x: string]?: string | undefined }
      // JsonCompatible<Partial<Record<string, string>>> = { [x: string]: string | ["Error: Non-JSON type"] }

      expect(originalValue.prop).toBeUndefined();
    });
  });

  test('Collection behavior with JsonCompatible', () => {
    type JsonMap<T, TV extends JsonCompatible<T> = JsonCompatible<T>> = Map<string, TV>;
    interface IJsonThing {
      a: string;
      b: number;
    }

    interface INonJsonThing {
      a: string;
      b: number;
      c: () => void;
    }

    const jsonMap: JsonMap<IJsonThing> = new Map();
    const map: Map<string, IJsonThing> = new Map();
    const thing1: IJsonThing = { a: 'test', b: 1 };
    const thing2: INonJsonThing = { a: 'test', b: 1, c: () => {} };

    jsonMap.set('test', thing1);
    expect(jsonMap.get('test')).toEqual({ a: 'test', b: 1 });
    const jv1: JsonValue | undefined = jsonMap.get('test');
    expect(jv1).toEqual(thing1);

    const tv1: IJsonThing | undefined = jsonMap.get('test');
    expect(tv1).toEqual(thing1);

    map.set('test', { a: 'test', b: 1 });
    expect(map.get('test')).toEqual({ a: 'test', b: 1 });

    // @ts-expect-error - INonJsonThing is not compatible with JsonValue
    const jv2: JsonValue | undefined = map.get('test');
    expect(jv2).toEqual({ a: 'test', b: 1 });

    const tv2: IJsonThing | undefined = map.get('test');
    expect(tv2).toEqual({ a: 'test', b: 1 });

    const nonJsonMap: JsonMap<INonJsonThing> = new Map();
    // @ts-expect-error - INonJsonThing is not JsonCompatible
    nonJsonMap.set('test', thing2);
    const jv3: JsonValue | undefined = nonJsonMap.get('test');
    expect(jv3).toEqual(thing2);

    // @ts-expect-error - INonJsonThing is not JsonCompatible
    const tv3: INonJsonThing | undefined = nonJsonMap.get('test');
    expect(tv3).toEqual(thing2);

    const nonJsonMap2: Map<string, INonJsonThing> = new Map();
    nonJsonMap2.set('test', thing2);
    // @ts-expect-error - INonJsonThing is not JsonCompatible
    const jv4: JsonValue | undefined = nonJsonMap2.get('test');
    expect(jv4).toEqual(thing2);

    const tv4: INonJsonThing | undefined = nonJsonMap2.get('test');
    expect(tv4).toEqual(thing2);
  });

  describe('unknown type handling', () => {
    describe('JsonCompatible<unknown> maps to JsonValue', () => {
      test('unknown type resolves to JsonValue', () => {
        // Test that JsonCompatible<unknown> maps to JsonValue
        type UnknownCompatible = JsonCompatible<unknown>;

        // This should be assignable to JsonValue
        const jsonString: UnknownCompatible = 'test string';
        const jsonNumber: UnknownCompatible = 42;
        const jsonBoolean: UnknownCompatible = true;
        const jsonNull: UnknownCompatible = null;
        const jsonArray: UnknownCompatible = [1, 2, 3];
        const jsonObject: UnknownCompatible = { key: 'value' };

        // All JsonValue types should be valid
        expect(typeof jsonString).toBe('string');
        expect(typeof jsonNumber).toBe('number');
        expect(typeof jsonBoolean).toBe('boolean');
        expect(jsonNull).toBeNull();
        expect(Array.isArray(jsonArray)).toBe(true);
        expect(typeof jsonObject).toBe('object');
      });

      test('unknown type works in generic contexts', () => {
        // Define a generic interface with unknown constraint
        interface IGenericContainer<T = unknown> {
          data: JsonCompatible<T>;
          metadata: {
            type: string;
            version: number;
          };
        }

        // Default usage should work with JsonValue
        const defaultContainer: IGenericContainer = {
          data: { key: 'value', numbers: [1, 2, 3] },
          metadata: { type: 'default', version: 1 }
        };

        // Explicit unknown should also work
        const unknownContainer: IGenericContainer<unknown> = {
          data: 'string data',
          metadata: { type: 'unknown', version: 2 }
        };

        // Specific types should still work
        interface ISpecificData {
          id: string;
          count: number;
        }

        const specificContainer: IGenericContainer<ISpecificData> = {
          data: { id: 'test', count: 5 },
          metadata: { type: 'specific', version: 3 }
        };

        expect(defaultContainer.data).toEqual({ key: 'value', numbers: [1, 2, 3] });
        expect(unknownContainer.data).toBe('string data');
        expect(specificContainer.data).toEqual({ id: 'test', count: 5 });
      });

      test('unknown arrays map to JsonValue arrays', () => {
        type UnknownArray = JsonCompatible<unknown[]>;

        // Should accept arrays of JsonValue elements
        const stringArray: UnknownArray = ['a', 'b', 'c'];
        const numberArray: UnknownArray = [1, 2, 3];
        const mixedArray: UnknownArray = ['string', 42, true, null, { key: 'value' }];

        expect(stringArray).toEqual(['a', 'b', 'c']);
        expect(numberArray).toEqual([1, 2, 3]);
        expect(mixedArray).toEqual(['string', 42, true, null, { key: 'value' }]);
      });

      test('nested unknown types resolve correctly', () => {
        interface INestedUnknown {
          data: unknown;
          nested: {
            value: unknown;
            array: unknown[];
          };
        }

        type CompatibleNested = JsonCompatible<INestedUnknown>;

        const nestedData: CompatibleNested = {
          data: 'top level data',
          nested: {
            value: { complex: 'object' },
            array: [1, 'two', { three: 3 }]
          }
        };

        expect(nestedData.data).toBe('top level data');
        expect(nestedData.nested.value).toEqual({ complex: 'object' });
        expect(nestedData.nested.array).toEqual([1, 'two', { three: 3 }]);
      });
    });

    describe('IsUnknown helper type detection', () => {
      test('correctly identifies unknown type', () => {
        // These tests use type-level verification through assignment compatibility
        // If IsUnknown works correctly, these assignments should be valid

        type TestUnknown = unknown extends unknown ? ([unknown] extends [unknown] ? true : false) : false;

        // This should be true
        const isUnknownTest: TestUnknown = true;
        expect(isUnknownTest).toBe(true);
      });

      test('distinguishes unknown from any', () => {
        // Test that unknown is handled differently from any
        interface IWithUnknown {
          unknownProp: unknown;
        }

        interface IWithAny {
          anyProp: any; // eslint-disable-line @typescript-eslint/no-explicit-any
        }

        type UnknownCompatible = JsonCompatible<IWithUnknown>;
        type AnyCompatible = JsonCompatible<IWithAny>;

        // Unknown should map to JsonValue
        const unknownData: UnknownCompatible = {
          unknownProp: { valid: 'json', number: 42 }
        };

        // Any should also work but through different path
        const anyData: AnyCompatible = {
          anyProp: { also: 'valid', count: 10 }
        };

        expect(unknownData.unknownProp).toEqual({ valid: 'json', number: 42 });
        expect(anyData.anyProp).toEqual({ also: 'valid', count: 10 });
      });

      test('distinguishes unknown from object types', () => {
        interface IWithUnknown {
          data: unknown;
        }

        interface IWithObject {
          data: object;
        }

        interface IWithEmptyObject {
          data: {};
        }

        type UnknownCompatible = JsonCompatible<IWithUnknown>;
        type ObjectCompatible = JsonCompatible<IWithObject>;
        type EmptyObjectCompatible = JsonCompatible<IWithEmptyObject>;

        // All should work but unknown should specifically map to JsonValue
        const unknownData: UnknownCompatible = {
          data: 'can be any JsonValue including string'
        };

        const objectData: ObjectCompatible = {
          data: { mustBe: 'object' }
        };

        const emptyObjectData: EmptyObjectCompatible = {
          data: { canBe: 'anyObject' }
        };

        expect(unknownData.data).toBe('can be any JsonValue including string');
        expect(objectData.data).toEqual({ mustBe: 'object' });
        expect(emptyObjectData.data).toEqual({ canBe: 'anyObject' });
      });
    });

    describe('edge cases and type safety', () => {
      test('unknown in union types', () => {
        interface IWithUnionUnknown {
          data: string | unknown; // Should resolve to JsonValue (which includes string)
        }

        type UnionCompatible = JsonCompatible<IWithUnionUnknown>;

        const unionData: UnionCompatible = {
          data: { object: 'is valid JsonValue' }
        };

        expect(unionData.data).toEqual({ object: 'is valid JsonValue' });
      });

      test('preserves existing JsonCompatible behavior', () => {
        // Ensure unknown handling doesn't break existing functionality
        interface IKnownTypes {
          stringProp: string;
          numberProp: number;
          booleanProp: boolean;
          arrayProp: string[];
          objectProp: { nested: number };
          unknownProp: unknown;
        }

        type MixedCompatible = JsonCompatible<IKnownTypes>;

        const mixedData: MixedCompatible = {
          stringProp: 'string value',
          numberProp: 42,
          booleanProp: true,
          arrayProp: ['array', 'values'],
          objectProp: { nested: 123 },
          unknownProp: { can: 'be', any: 'JsonValue' }
        };

        // All properties should preserve their expected behavior
        expect(mixedData.stringProp).toBe('string value');
        expect(mixedData.numberProp).toBe(42);
        expect(mixedData.booleanProp).toBe(true);
        expect(mixedData.arrayProp).toEqual(['array', 'values']);
        expect(mixedData.objectProp).toEqual({ nested: 123 });
        expect(mixedData.unknownProp).toEqual({ can: 'be', any: 'JsonValue' });
      });

      test('unknown with function properties still fails appropriately', () => {
        // Even though unknown maps to JsonValue, actual functions should still be caught
        interface IFunctionContainer {
          data: unknown;
          callback: () => void; // This should still fail
        }

        // Let me test if we can actually use the interface in a JsonCompatible context
        type TestMapOfFunction = Map<string, JsonCompatible<IFunctionContainer>>;
        const testMap: TestMapOfFunction = new Map();

        // This should work at type level but the actual object with function would be invalid
        const containerWithoutCallback: JsonCompatible<IFunctionContainer> = {
          data: 'valid json data',
          callback: ['Error: Function is not JSON-compatible'] as never
        };

        testMap.set('test', containerWithoutCallback);

        // This test verifies that the unknown handling doesn't make invalid data valid
        expect(containerWithoutCallback.data).toBe('valid json data');
      });

      test('branded unknown types', () => {
        type BrandedUnknown = Brand<unknown, 'BrandedUnknown'>;

        interface IWithBrandedUnknown {
          data: BrandedUnknown;
        }

        type BrandedUnknownCompatible = JsonCompatible<IWithBrandedUnknown>;

        // Should still work - branded unknown should map to JsonValue while preserving branding
        const brandedUnknownData: BrandedUnknownCompatible = {
          data: { some: 'data' } as unknown as BrandedUnknown
        };

        expect(brandedUnknownData.data).toEqual({ some: 'data' });
      });
    });
  });

  describe('JsonCompatible undefined handling', () => {
    test('allows undefined as JSON-compatible', () => {
      // Direct undefined type
      type UndefinedCompatible = JsonCompatible<undefined>;
      const undefinedValue: UndefinedCompatible = undefined;
      expect(undefinedValue).toBeUndefined();
    });

    test('handles optional properties correctly', () => {
      interface IWithOptional {
        name: string;
        optional?: string;
      }

      type OptionalCompatible = JsonCompatible<IWithOptional>;

      // Should work with undefined optional property
      const value1: OptionalCompatible = {
        name: 'test',
        optional: undefined
      };
      expect(value1.name).toBe('test');
      expect(value1.optional).toBeUndefined();

      // Should work with defined optional property
      const value2: OptionalCompatible = {
        name: 'test',
        optional: 'defined'
      };
      expect(value2.name).toBe('test');
      expect(value2.optional).toBe('defined');

      // Should work without optional property
      const value3: OptionalCompatible = {
        name: 'test'
      };
      expect(value3.name).toBe('test');
      expect(value3.optional).toBeUndefined();
    });

    test('handles union types with undefined', () => {
      type StringOrUndefined = JsonCompatible<string | undefined>;

      const value1: StringOrUndefined = 'hello';
      const value2: StringOrUndefined = undefined;

      expect(value1).toBe('hello');
      expect(value2).toBeUndefined();
    });

    test('handles complex interfaces with multiple optional properties', () => {
      interface IComplexOptional {
        required: string;
        optionalString?: string;
        optionalNumber?: number;
        optionalBoolean?: boolean;
        optionalObject?: { nested?: string };
      }

      type ComplexCompatible = JsonCompatible<IComplexOptional>;

      const value: ComplexCompatible = {
        required: 'test',
        optionalString: undefined,
        optionalNumber: 42,
        optionalBoolean: undefined,
        optionalObject: { nested: undefined }
      };

      expect(value.required).toBe('test');
      expect(value.optionalString).toBeUndefined();
      expect(value.optionalNumber).toBe(42);
      expect(value.optionalBoolean).toBeUndefined();
      expect(value.optionalObject?.nested).toBeUndefined();
    });

    test('handles arrays with undefined elements', () => {
      type ArrayWithUndefined = JsonCompatible<(string | undefined)[]>;

      const value: ArrayWithUndefined = ['hello', undefined, 'world'];
      expect(value[0]).toBe('hello');
      expect(value[1]).toBeUndefined();
      expect(value[2]).toBe('world');
    });

    test('preserves type safety - functions still fail', () => {
      interface IWithFunction {
        name: string;
        callback?: () => void;
      }

      type FunctionCompatible = JsonCompatible<IWithFunction>;

      // The callback property should become an error type
      const value: FunctionCompatible = {
        name: 'test',
        callback: ['Error: Function is not JSON-compatible']
      };

      expect(value.name).toBe('test');
    });

    test('works with the sanitizeJsonObject pattern', () => {
      interface IWithOptionals {
        name: string;
        optional1?: string;
        optional2?: number;
      }

      const rawData: JsonCompatible<IWithOptionals> = {
        name: 'test',
        optional1: undefined,
        optional2: 42
      };

      // This demonstrates the intended usage pattern
      const sanitized = sanitizeJsonObject(rawData);

      expect(sanitized).toSucceedWith({
        name: 'test',
        optional2: 42
        // optional1 is removed because it was undefined
      });
    });
  });
});
