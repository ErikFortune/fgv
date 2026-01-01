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

import { Validation } from '../../index';
import { Failure, fail } from '../../packlets/base';
import { Converter, Converters, Infer } from '../../packlets/conversion';

describe('Advanced converters', () => {
  describe('type inference from converter with Infer', () => {
    // This doesn't actually test anything per se, but you can hover
    // over the various local variables for intellisense to show
    // that typescript is correctly inferring types.
    // Note that it seems to be losing 'undefined' for optional
    // fields
    type TestEnum = 'tv1' | 'tv2' | 'tv3';
    const s: Infer<typeof Converters.string> = 'hello';
    // n correctly fails because 'number' doesn't extend Converter.
    // const n: Infer<number> = 10;
    const narc = Converters.arrayOf(Converters.number);
    // cSpell: disable
    const narr: Infer<typeof narc> = [1, 2, 3];
    const objc = Converters.object({
      str: Converters.string,
      numbers: Converters.arrayOf(Converters.number),
      enum: Converters.enumeratedValue<TestEnum>(['tv1', 'tv2', 'tv3']),
      child: Converters.object<{ bool?: boolean; map: Map<string, string[]> }, unknown>({
        bool: Converters.optionalBoolean,
        map: Converters.mapOf(Converters.arrayOf(Converters.string))
      })
    });
    const objt: Infer<typeof objc> | undefined = {
      str: 'string',
      numbers: [1, 2, 3],
      enum: 'tv3',
      child: {
        bool: true,
        map: new Map<string, string[]>()
      }
    };
    expect(s).toBeDefined();
    expect(narc).toBeDefined();
    expect(narr).toBeDefined();
    expect(objc).toBeDefined();
    expect(objt).toBeDefined();
    expect(narc).toBeDefined();
    expect(objc).toBeDefined();
    // cSpell: enable
  });

  describe('transform converter', () => {
    interface IWant {
      stringField: string;
      optionalStringField?: string;
      numField: number;
      boolField: boolean;
      numbers?: number[];
    }

    const converter = Converters.transform<IWant>({
      stringField: Converters.field('string1', Converters.string),
      optionalStringField: Converters.optionalField('string2', Converters.string),
      numField: Converters.field('num1', Converters.number),
      boolField: Converters.field('b1', Converters.boolean),
      numbers: Converters.optionalField('nums', Converters.arrayOf(Converters.number))
    });

    test('converts a valid object with empty optional fields', () => {
      const src = {
        string1: 'string1',
        num1: -1,
        b1: true
      };

      const expected: IWant = {
        stringField: 'string1',
        numField: -1,
        boolField: true
      };

      expect(converter.convert(src)).toSucceedWith(expected);
    });

    test('converts a valid object with optional fields present', () => {
      const src = {
        string1: 'string1',
        string2: 'optional string',
        num1: -1,
        b1: true,
        nums: [-1, 0, 1, '2']
      };

      const expected: IWant = {
        stringField: 'string1',
        optionalStringField: 'optional string',
        numField: -1,
        boolField: true,
        numbers: [-1, 0, 1, 2]
      };

      expect(converter.convert(src)).toSucceedWith(expected);
    });

    test('fails if any non-optional fields are missing', () => {
      const src = {
        misnamedString1: 'string1',
        num1: -1,
        b1: true
      };

      expect(converter.convert(src)).toFailWith(/string1 not found/i);
    });

    test('fails if any non-optional fields are mistyped', () => {
      const src = {
        string1: 'string1',
        num1: true,
        b1: -1
      };

      expect(converter.convert(src)).toFailWith(/not a number/i);
    });

    test('fails for mistyped optional fields', () => {
      const src = {
        string1: 'string1',
        string2: true,
        num1: -1,
        b1: true
      };

      expect(converter.convert(src)).toFailWith(/not a string/i);
    });

    test('silently ignores fields without a converter', () => {
      const partialConverter = Converters.transform<IWant>({
        stringField: Converters.field('string1', Converters.string),
        optionalStringField: Converters.optionalField('string2', Converters.string),
        numField: Converters.field('num1', Converters.number),
        boolField: Converters.field('b1', Converters.boolean),
        numbers: undefined
      });

      const src = {
        string1: 'string1',
        string2: 'optional string',
        num1: -1,
        b1: true,
        nums: [-1, 0, 1, '2']
      };

      const expected: IWant = {
        stringField: 'string1',
        optionalStringField: 'optional string',
        numField: -1,
        boolField: true
      };

      expect(partialConverter.convert(src)).toSucceedWith(expected);
    });
  });

  describe('transformObject converter', () => {
    interface ISourceThing {
      string1: string;
      string2?: string;
      num1: number;
      b1: boolean;
      nums?: number[];
      extra?: string;
    }

    interface IDestinationThing {
      stringField: string;
      optionalStringField?: string;
      numField: number;
      boolField: boolean;
      numbers?: number[];
    }

    const transformers: Converters.FieldTransformers<ISourceThing, IDestinationThing> = {
      stringField: {
        from: 'string1',
        converter: Converters.string
      },
      optionalStringField: {
        from: 'string2',
        converter: Converters.optionalString,
        optional: true
      },
      numField: {
        from: 'num1',
        converter: Converters.number
      },
      boolField: {
        from: 'b1',
        converter: Converters.boolean
      },
      numbers: {
        from: 'nums',
        converter: Converters.arrayOf(Converters.number),
        optional: true
      }
    };

    const converter = Converters.transformObject(transformers);
    const strict = Converters.transformObject(transformers, { strict: true });
    const strict2 = Converters.transformObject(transformers, {
      strict: true,
      ignore: ['extra'],
      description: 'strict2'
    });

    test('converts a valid object with empty optional fields', () => {
      const src: ISourceThing = {
        string1: 'string1',
        num1: -1,
        b1: true
      };

      const expected: IDestinationThing = {
        stringField: 'string1',
        numField: -1,
        boolField: true
      };

      expect(converter.convert(src)).toSucceedWith(expected);
    });

    test('converts a valid object with optional fields present', () => {
      const src: ISourceThing = {
        string1: 'string1',
        string2: 'optional string',
        num1: -1,
        b1: true,
        nums: [-1, 0, 1, 2]
      };

      const expected: IDestinationThing = {
        stringField: 'string1',
        optionalStringField: 'optional string',
        numField: -1,
        boolField: true,
        numbers: [-1, 0, 1, 2]
      };

      expect(converter.convert(src)).toSucceedWith(expected);
    });

    test('ignores unused source fields by default', () => {
      const src: ISourceThing = {
        string1: 'string1',
        string2: 'optional string',
        num1: -1,
        b1: true,
        nums: [-1, 0, 1, 2],
        extra: 'this is an extra field'
      };

      const expected: IDestinationThing = {
        stringField: 'string1',
        optionalStringField: 'optional string',
        numField: -1,
        boolField: true,
        numbers: [-1, 0, 1, 2]
      };

      expect(converter.convert(src)).toSucceedWith(expected);
    });

    test('fails in strict mode if unused fields are present in the source object', () => {
      const src: ISourceThing = {
        string1: 'string1',
        string2: 'optional string',
        num1: -1,
        b1: true,
        nums: [-1, 0, 1, 2],
        extra: 'this is an extra field'
      };

      expect(strict.convert(src)).toFailWith(/extra: unexpected property/i);
    });

    test('succeeds in strict mode if unused fields in the source object are listed in options.ignore', () => {
      const src: ISourceThing = {
        string1: 'string1',
        string2: 'optional string',
        num1: -1,
        b1: true,
        nums: [-1, 0, 1, 2],
        extra: 'this is an extra field'
      };

      const expected: IDestinationThing = {
        stringField: 'string1',
        optionalStringField: 'optional string',
        numField: -1,
        boolField: true,
        numbers: [-1, 0, 1, 2]
      };

      expect(strict2.convert(src)).toSucceedWith(expected);
    });

    test('displays description in error messages if supplied', () => {
      const src = {
        string1: 'string1',
        string2: 'optional string',
        num1: -1,
        b1: true,
        nums: [-1, 0, 1, 2],
        extra2: 'this is an extra field'
      };

      expect(strict2.convert(src)).toFailWith(/strict2:/i);
    });

    test('fails if any non-optional fields are missing', () => {
      const src = {
        misnamedString1: 'string1',
        num1: -1,
        b1: true
      };

      expect(converter.convert(src)).toFailWith(/string1: required property missing/i);
    });

    test('fails if any non-optional fields are mistyped', () => {
      const src = {
        string1: 'string1',
        num1: true,
        b1: -1
      };

      expect(converter.convert(src)).toFailWith(/not a number/i);
    });

    test('fails for mistyped optional fields', () => {
      const src = {
        string1: 'string1',
        string2: true,
        num1: -1,
        b1: true
      };

      expect(converter.convert(src)).toFailWith(/not a string/i);
    });

    test('fails if source is not an object', () => {
      expect(converter.convert(10)).toFailWith(/not an object/i);
    });
  });

  describe('compositeId converters', () => {
    // Branded types for testing
    type CollectionId = string & { __brand: 'CollectionId' };
    type ItemId = string & { __brand: 'ItemId' };

    const collectionIdConverter = Converters.string as unknown as Converter<CollectionId>;
    const itemIdConverter = Converters.string as unknown as Converter<ItemId>;

    // More restrictive validators for testing validation errors
    const restrictedCollectionValidator = Validation.Validators.generic<CollectionId>(
      (from: unknown): boolean | Failure<CollectionId> => {
        if (typeof from !== 'string') {
          return fail('not a string');
        }
        if (!/^[a-z]+$/i.test(from)) {
          return fail('collection ID must be alphabetic');
        }
        return true;
      }
    );

    const restrictedItemValidator = Validation.Validators.generic<ItemId>(
      (from: unknown): boolean | Failure<ItemId> => {
        if (typeof from !== 'string') {
          return fail('not a string');
        }
        if (!/^[0-9]+$/.test(from)) {
          return fail('item ID must be numeric');
        }
        return true;
      }
    );

    describe('compositeIdFromObject', () => {
      const converter = Converters.compositeIdFromObject(collectionIdConverter, ':', itemIdConverter);

      test('converts a valid object representation', () => {
        const input = { collectionId: 'users', separator: ':', itemId: '123' };
        expect(converter.convert(input)).toSucceedAndSatisfy((result) => {
          expect(result.collectionId).toBe('users');
          expect(result.separator).toBe(':');
          expect(result.itemId).toBe('123');
        });
      });

      test('fails for invalid separator', () => {
        const input = { collectionId: 'users', separator: '/', itemId: '123' };
        expect(converter.convert(input)).toFailWith(/does not match/i);
      });

      test('fails for missing fields', () => {
        expect(converter.convert({ collectionId: 'users' })).toFail();
        expect(converter.convert({ itemId: '123' })).toFail();
        expect(converter.convert({})).toFail();
      });

      test('fails for non-object input', () => {
        expect(converter.convert('users:123')).toFail();
        expect(converter.convert(null)).toFail();
        expect(converter.convert(undefined)).toFail();
      });

      test('works with validators', () => {
        const validatorConverter = Converters.compositeIdFromObject(
          restrictedCollectionValidator,
          ':',
          restrictedItemValidator
        );

        expect(
          validatorConverter.convert({ collectionId: 'users', separator: ':', itemId: '123' })
        ).toSucceed();
        expect(
          validatorConverter.convert({ collectionId: '123invalid', separator: ':', itemId: '123' })
        ).toFailWith(/alphabetic/i);
        expect(
          validatorConverter.convert({ collectionId: 'users', separator: ':', itemId: 'abc' })
        ).toFailWith(/numeric/i);
      });
    });

    describe('compositeIdFromString', () => {
      const converter = Converters.compositeIdFromString(collectionIdConverter, ':', itemIdConverter);

      test('converts a valid string representation', () => {
        expect(converter.convert('users:123')).toSucceedAndSatisfy((result) => {
          expect(result.collectionId).toBe('users');
          expect(result.separator).toBe(':');
          expect(result.itemId).toBe('123');
        });
      });

      test('handles different separators', () => {
        const slashConverter = Converters.compositeIdFromString(collectionIdConverter, '/', itemIdConverter);
        expect(slashConverter.convert('users/123')).toSucceedAndSatisfy((result) => {
          expect(result.collectionId).toBe('users');
          expect(result.separator).toBe('/');
          expect(result.itemId).toBe('123');
        });
      });

      test('handles multi-character separators', () => {
        const multiSepConverter = Converters.compositeIdFromString(
          collectionIdConverter,
          '::',
          itemIdConverter
        );
        expect(multiSepConverter.convert('users::123')).toSucceedAndSatisfy((result) => {
          expect(result.collectionId).toBe('users');
          expect(result.separator).toBe('::');
          expect(result.itemId).toBe('123');
        });
      });

      test('fails for non-string input', () => {
        expect(converter.convert(123)).toFailWith(/invalid non-string composite ID/i);
        expect(converter.convert(null)).toFailWith(/invalid non-string composite ID/i);
        expect(converter.convert({ collectionId: 'users', itemId: '123' })).toFailWith(
          /invalid non-string composite ID/i
        );
      });

      test('fails when separator not found', () => {
        expect(converter.convert('usersNoSeparator')).toFailWith(/separator.*not found/i);
      });

      test('fails when multiple separators found', () => {
        expect(converter.convert('users:123:extra')).toFailWith(/multiple separators/i);
      });

      test('works with validators', () => {
        const validatorConverter = Converters.compositeIdFromString(
          restrictedCollectionValidator,
          ':',
          restrictedItemValidator
        );

        expect(validatorConverter.convert('users:123')).toSucceed();
        expect(validatorConverter.convert('123invalid:456')).toFailWith(/alphabetic/i);
        expect(validatorConverter.convert('users:abc')).toFailWith(/numeric/i);
      });
    });

    describe('compositeId (combined)', () => {
      const converter = Converters.compositeId(collectionIdConverter, ':', itemIdConverter);

      test('converts string representation', () => {
        expect(converter.convert('users:123')).toSucceedAndSatisfy((result) => {
          expect(result.collectionId).toBe('users');
          expect(result.separator).toBe(':');
          expect(result.itemId).toBe('123');
        });
      });

      test('converts object representation', () => {
        const input = { collectionId: 'users', separator: ':', itemId: '123' };
        expect(converter.convert(input)).toSucceedAndSatisfy((result) => {
          expect(result.collectionId).toBe('users');
          expect(result.separator).toBe(':');
          expect(result.itemId).toBe('123');
        });
      });

      test('fails for invalid input', () => {
        expect(converter.convert(123)).toFail();
        expect(converter.convert(null)).toFail();
        expect(converter.convert('noSeparator')).toFail();
      });
    });

    describe('compositeIdString', () => {
      type CompositeId = `${CollectionId}:${ItemId}` & { __brand: 'CompositeId' };

      const compositeIdValidator = Validation.Validators.generic<CompositeId>(
        (from: unknown): boolean | Failure<CompositeId> => {
          if (typeof from !== 'string') {
            return fail('not a string');
          }
          const parts = from.split(':');
          if (parts.length !== 2) {
            return fail('invalid composite ID format');
          }
          if (!/^[a-z]+$/i.test(parts[0])) {
            return fail('collection ID must be alphabetic');
          }
          if (!/^[0-9]+$/.test(parts[1])) {
            return fail('item ID must be numeric');
          }
          return true;
        }
      );

      const converter = Converters.compositeIdString(
        compositeIdValidator,
        restrictedCollectionValidator,
        ':',
        restrictedItemValidator
      );

      test('validates a string representation directly', () => {
        expect(converter.convert('users:123')).toSucceedWith('users:123' as CompositeId);
      });

      test('converts object to string representation', () => {
        const input = { collectionId: 'users', separator: ':', itemId: '123' };
        expect(converter.convert(input)).toSucceedWith('users:123' as CompositeId);
      });

      test('fails for invalid string format', () => {
        expect(converter.convert('123invalid:456')).toFailWith(/alphabetic/i);
        expect(converter.convert('users:abc')).toFailWith(/numeric/i);
      });

      test('fails for invalid object fields', () => {
        expect(converter.convert({ collectionId: '123', separator: ':', itemId: '456' })).toFailWith(
          /alphabetic/i
        );
        expect(converter.convert({ collectionId: 'users', separator: ':', itemId: 'abc' })).toFailWith(
          /numeric/i
        );
      });

      test('fails for wrong separator in object', () => {
        expect(converter.convert({ collectionId: 'users', separator: '/', itemId: '123' })).toFailWith(
          /does not match/i
        );
      });

      test('fails for non-string, non-object input', () => {
        expect(converter.convert(123)).toFail();
        expect(converter.convert(null)).toFail();
      });
    });
  });

  describe('tuple converter', () => {
    describe('basic functionality', () => {
      test('converts a tuple with different types', () => {
        const converter = Converters.tuple([Converters.string, Converters.number, Converters.boolean]);

        expect(converter.convert(['hello', 42, true])).toSucceedWith(['hello', 42, true]);
      });

      test('converts numeric strings in number positions', () => {
        const converter = Converters.tuple([Converters.string, Converters.number]);

        expect(converter.convert(['hello', '42'])).toSucceedWith(['hello', 42]);
      });

      test('converts boolean strings in boolean positions', () => {
        const converter = Converters.tuple([Converters.boolean, Converters.string]);

        expect(converter.convert(['true', 'world'])).toSucceedWith([true, 'world']);
      });

      test('handles single-element tuples', () => {
        const converter = Converters.tuple([Converters.string]);

        expect(converter.convert(['only'])).toSucceedWith(['only']);
      });

      test('handles empty tuples', () => {
        const converter = Converters.tuple([]);

        expect(converter.convert([])).toSucceedWith([]);
      });
    });

    describe('type safety', () => {
      test('infers correct tuple type', () => {
        const converter = Converters.tuple([Converters.string, Converters.number, Converters.boolean]);

        // TypeScript should infer this as Converter<[string, number, boolean]>
        const result = converter.convert(['test', 123, false]);
        expect(result).toSucceedAndSatisfy((tuple) => {
          // These type assertions should compile without error
          const str: string = tuple[0];
          const num: number = tuple[1];
          const bool: boolean = tuple[2];
          expect(str).toBe('test');
          expect(num).toBe(123);
          expect(bool).toBe(false);
        });
      });

      test('works with nested converters', () => {
        const converter = Converters.tuple([
          Converters.string,
          Converters.arrayOf(Converters.number),
          Converters.object({ name: Converters.string })
        ]);

        const input = ['hello', [1, 2, 3], { name: 'test' }];
        expect(converter.convert(input)).toSucceedWith(['hello', [1, 2, 3], { name: 'test' }]);
      });
    });

    describe('error handling', () => {
      test('fails for non-array input', () => {
        const converter = Converters.tuple([Converters.string, Converters.number]);

        expect(converter.convert('not an array')).toFailWith(/not an array/i);
        expect(converter.convert(123)).toFailWith(/not an array/i);
        expect(converter.convert({ first: 'a', second: 1 })).toFailWith(/not an array/i);
        expect(converter.convert(null)).toFailWith(/not an array/i);
        expect(converter.convert(undefined)).toFailWith(/not an array/i);
      });

      test('fails when array is too short', () => {
        const converter = Converters.tuple([Converters.string, Converters.number, Converters.boolean]);

        expect(converter.convert(['hello', 42])).toFailWith(/expected array of length 3, got 2/i);
      });

      test('fails when array is too long', () => {
        const converter = Converters.tuple([Converters.string, Converters.number]);

        expect(converter.convert(['hello', 42, true])).toFailWith(/expected array of length 2, got 3/i);
      });

      test('fails when element conversion fails', () => {
        const converter = Converters.tuple([Converters.string, Converters.number]);

        expect(converter.convert(['hello', 'not a number'])).toFailWith(/not a number/i);
      });

      test('fails on first element conversion error', () => {
        const converter = Converters.tuple([Converters.number, Converters.number]);

        expect(converter.convert(['not a number', 'also not'])).toFailWith(/not a number/i);
      });
    });

    describe('with context', () => {
      test('passes context to element converters', () => {
        // Create a converter that uses context
        const contextConverter = Converters.enumeratedValue<string>(['a', 'b', 'c']);
        const tupleConverter = Converters.tuple([contextConverter, Converters.number]);

        // The enumeratedValue converter can accept context
        expect(tupleConverter.convert(['a', 42])).toSucceedWith(['a', 42]);
        expect(tupleConverter.convert(['invalid', 42])).toFailWith(/invalid enumerated value/i);
      });
    });

    describe('type inference with Infer', () => {
      test('Infer extracts correct tuple type', () => {
        const tupleConverter = Converters.tuple([Converters.string, Converters.number]);
        type InferredType = Infer<typeof tupleConverter>;

        // This is a compile-time check - if the type is wrong, this won't compile
        const value: InferredType = ['test', 42];
        expect(tupleConverter.convert(value)).toSucceedWith(['test', 42]);
      });
    });
  });
});
