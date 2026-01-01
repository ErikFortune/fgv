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

import '../../helpers/jest';

import { Failure, fail } from '../../../packlets/base';
import { Classes, Validators } from '../../../packlets/validation';

describe('CompositeIdValidator class', () => {
  // Branded types for testing
  type CollectionId = string & { __brand: 'CollectionId' };
  type ItemId = string & { __brand: 'ItemId' };
  type CompositeId = `${CollectionId}:${ItemId}` & { __brand: 'CompositeId' };

  // Helper validators for testing
  const collectionIdValidator = Validators.generic<CollectionId>(
    (from: unknown): boolean | Failure<CollectionId> => {
      if (typeof from !== 'string') {
        return fail('not a string');
      }
      if (from.length === 0) {
        return fail('collection ID cannot be empty');
      }
      if (!/^[a-z][a-z0-9]*$/i.test(from)) {
        return fail('collection ID must be alphanumeric starting with a letter');
      }
      return true;
    }
  );

  const itemIdValidator = Validators.generic<ItemId>((from: unknown): boolean | Failure<ItemId> => {
    if (typeof from !== 'string') {
      return fail('not a string');
    }
    if (from.length === 0) {
      return fail('item ID cannot be empty');
    }
    if (!/^[0-9]+$/.test(from)) {
      return fail('item ID must be numeric');
    }
    return true;
  });

  describe('constructor', () => {
    test('constructs a CompositeIdValidator with required params', () => {
      expect(
        () =>
          new Classes.CompositeIdValidator({
            collectionId: collectionIdValidator,
            separator: ':',
            itemId: itemIdValidator
          })
      ).not.toThrow();
    });

    test('constructs a CompositeIdValidator with custom separator', () => {
      const validator = new Classes.CompositeIdValidator({
        collectionId: collectionIdValidator,
        separator: '/',
        itemId: itemIdValidator
      });
      expect(validator.validate('collection/123')).toSucceed();
    });

    test('constructs with traits supplied via constructor', () => {
      const optional = new Classes.CompositeIdValidator({
        collectionId: collectionIdValidator,
        separator: ':',
        itemId: itemIdValidator,
        traits: { isOptional: true }
      });
      const notOptional = new Classes.CompositeIdValidator({
        collectionId: collectionIdValidator,
        separator: ':',
        itemId: itemIdValidator,
        traits: { isOptional: false }
      });
      expect(optional.isOptional).toBe(true);
      expect(notOptional.isOptional).toBe(false);
    });
  });

  describe('validation success cases', () => {
    const validator = Validators.compositeId<CompositeId, CollectionId, ItemId>({
      collectionId: collectionIdValidator,
      separator: ':',
      itemId: itemIdValidator
    });

    test('validates valid composite IDs', () => {
      const validIds = ['collection:123', 'A:1', 'myCollection:99999', 'Test123:001'];
      for (const id of validIds) {
        expect(validator.validate(id)).toSucceedWith(id as CompositeId);
      }
    });

    test('validates with different separators', () => {
      const slashValidator = Validators.compositeId({
        collectionId: collectionIdValidator,
        separator: '/',
        itemId: itemIdValidator
      });
      expect(slashValidator.validate('collection/123')).toSucceed();

      const dashValidator = Validators.compositeId({
        collectionId: collectionIdValidator,
        separator: '-',
        itemId: itemIdValidator
      });
      expect(dashValidator.validate('collection-123')).toSucceed();

      const multiCharValidator = Validators.compositeId({
        collectionId: collectionIdValidator,
        separator: '::',
        itemId: itemIdValidator
      });
      expect(multiCharValidator.validate('collection::123')).toSucceed();
    });
  });

  describe('validation failure cases - non-string input', () => {
    const validator = Validators.compositeId({
      collectionId: collectionIdValidator,
      separator: ':',
      itemId: itemIdValidator
    });

    test('fails for null', () => {
      expect(validator.validate(null)).toFailWith(/invalid non-string composite ID/i);
    });

    test('fails for undefined', () => {
      expect(validator.validate(undefined)).toFailWith(/invalid non-string composite ID/i);
    });

    test('fails for number', () => {
      expect(validator.validate(123)).toFailWith(/invalid non-string composite ID/i);
    });

    test('fails for object', () => {
      expect(validator.validate({ id: 'test:123' })).toFailWith(/invalid non-string composite ID/i);
    });

    test('fails for array', () => {
      expect(validator.validate(['test', '123'])).toFailWith(/invalid non-string composite ID/i);
    });

    test('fails for boolean', () => {
      expect(validator.validate(true)).toFailWith(/invalid non-string composite ID/i);
    });

    test('fails for function', () => {
      expect(validator.validate(() => 'test:123')).toFailWith(/invalid non-string composite ID/i);
    });
  });

  describe('validation failure cases - separator issues', () => {
    const validator = Validators.compositeId({
      collectionId: collectionIdValidator,
      separator: ':',
      itemId: itemIdValidator
    });

    test('fails when separator is not found', () => {
      expect(validator.validate('collectionWithNoSeparator')).toFailWith(/separator ':' not found/i);
    });

    test('fails when there are multiple separators', () => {
      expect(validator.validate('collection:item:extra')).toFailWith(/separator ':' not found/i);
    });

    test('fails for empty string', () => {
      expect(validator.validate('')).toFailWith(/separator ':' not found/i);
    });
  });

  describe('validation failure cases - collection ID validation', () => {
    const validator = Validators.compositeId({
      collectionId: collectionIdValidator,
      separator: ':',
      itemId: itemIdValidator
    });

    test('fails when collection ID is empty', () => {
      expect(validator.validate(':123')).toFailWith(/invalid composite collection ID.*cannot be empty/i);
    });

    test('fails when collection ID starts with number', () => {
      expect(validator.validate('123collection:456')).toFailWith(
        /invalid composite collection ID.*must be alphanumeric starting with a letter/i
      );
    });

    test('fails when collection ID has special characters', () => {
      expect(validator.validate('my-collection:123')).toFailWith(
        /invalid composite collection ID.*must be alphanumeric starting with a letter/i
      );
    });
  });

  describe('validation failure cases - item ID validation', () => {
    const validator = Validators.compositeId({
      collectionId: collectionIdValidator,
      separator: ':',
      itemId: itemIdValidator
    });

    test('fails when item ID is empty', () => {
      expect(validator.validate('collection:')).toFailWith(/invalid composite item ID.*cannot be empty/i);
    });

    test('fails when item ID is not numeric', () => {
      expect(validator.validate('collection:abc')).toFailWith(/invalid composite item ID.*must be numeric/i);
    });

    test('fails when item ID has mixed alphanumeric', () => {
      expect(validator.validate('collection:123abc')).toFailWith(
        /invalid composite item ID.*must be numeric/i
      );
    });
  });

  describe('error message formatting', () => {
    const validator = Validators.compositeId({
      collectionId: collectionIdValidator,
      separator: ':',
      itemId: itemIdValidator
    });

    test('includes the invalid value in non-string error message', () => {
      const result = validator.validate(123);
      expect(result).toFailWith(/123.*invalid non-string composite ID/);
    });

    test('includes the invalid value in separator not found error', () => {
      const result = validator.validate('noSeparator');
      expect(result).toFailWith(/noSeparator.*invalid composite ID.*separator/);
    });

    test('includes context in collection ID error', () => {
      const result = validator.validate('123bad:456');
      expect(result).toFailWith(/123bad:456.*invalid composite ID/);
    });

    test('includes context in item ID error', () => {
      const result = validator.validate('collection:notANumber');
      expect(result).toFailWith(/collection:notANumber.*invalid composite ID/);
    });
  });

  describe('edge cases', () => {
    test('handles separator that appears in valid collection ID pattern', () => {
      // A more permissive collection validator that allows colons
      const permissiveCollectionValidator = Validators.generic<string>(
        (from: unknown): boolean | Failure<string> => {
          if (typeof from !== 'string') {
            return fail('not a string');
          }
          return from.length > 0 ? true : fail('cannot be empty');
        }
      );

      const validator = Validators.compositeId({
        collectionId: permissiveCollectionValidator,
        separator: '::',
        itemId: Validators.string
      });

      // Single colon in collection ID should work with double colon separator
      expect(validator.validate('a:b::item')).toSucceed();
    });

    test('validates with string validator for simple string types', () => {
      const simpleValidator = Validators.compositeId({
        collectionId: Validators.string,
        separator: ':',
        itemId: Validators.string
      });

      expect(simpleValidator.validate('any:thing')).toSucceed();
      expect(simpleValidator.validate(':empty')).toSucceed();
      expect(simpleValidator.validate('empty:')).toSucceed();
      expect(simpleValidator.validate(':')).toSucceed();
    });

    test('handles whitespace in IDs', () => {
      const whitespaceValidator = Validators.compositeId({
        collectionId: Validators.string,
        separator: ':',
        itemId: Validators.string
      });

      // Whitespace is preserved - splits into " collection " and " item "
      expect(whitespaceValidator.validate(' collection : item ')).toSucceed();
      expect(whitespaceValidator.validate('collection with space:item')).toSucceed();
    });

    test('handles unicode characters', () => {
      const unicodeValidator = Validators.compositeId({
        collectionId: Validators.string,
        separator: ':',
        itemId: Validators.string
      });

      expect(unicodeValidator.validate('коллекция:элемент')).toSucceed();
      expect(unicodeValidator.validate('收藏:项目')).toSucceed();
    });

    test('handles special regex characters in separator', () => {
      const dotValidator = Validators.compositeId({
        collectionId: Validators.string,
        separator: '.',
        itemId: Validators.string
      });

      expect(dotValidator.validate('collection.item')).toSucceed();
      // Multiple dots should fail (splits into more than 2 parts)
      expect(dotValidator.validate('a.b.c')).toFail();
    });
  });

  describe('context passing', () => {
    interface ITestContext {
      prefix: string;
    }

    const contextAwareCollectionValidator = Validators.generic<string, ITestContext>(
      (from: unknown, context?: ITestContext): boolean | Failure<string> => {
        if (typeof from !== 'string') {
          return fail('not a string');
        }
        if (context && !from.startsWith(context.prefix)) {
          return fail(`must start with ${context.prefix}`);
        }
        return true;
      }
    );

    const contextAwareItemValidator = Validators.generic<string, ITestContext>(
      (from: unknown, context?: ITestContext): boolean | Failure<string> => {
        if (typeof from !== 'string') {
          return fail('not a string');
        }
        return true;
      }
    );

    test('passes context to child validators', () => {
      const validator = Validators.compositeId<string, string, string, ITestContext>({
        collectionId: contextAwareCollectionValidator,
        separator: ':',
        itemId: contextAwareItemValidator
      });

      expect(validator.validate('test:item', { prefix: 'test' })).toSucceed();
      expect(validator.validate('other:item', { prefix: 'test' })).toFailWith(/must start with test/i);
    });
  });
});
