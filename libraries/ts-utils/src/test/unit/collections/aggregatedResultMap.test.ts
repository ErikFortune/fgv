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

import {
  AggregatedResultMap,
  Collections,
  Converters,
  fail,
  succeed,
  ValidatingResultMap,
  Validators
} from '../../..';
// eslint-disable-next-line @rushstack/packlets/mechanics
import { AggregatedResultMapValidator } from '../../../packlets/collections/aggregatedResultMap';

describe('AggregatedResultMap', () => {
  // Branded types for testing
  type CollectionId = string & { __brand: 'CollectionId' };
  type ItemId = string & { __brand: 'ItemId' };
  type CompositeId = `${CollectionId}.${ItemId}` & { __brand: 'CompositeId' };

  interface ITestItem {
    name: string;
    value: number;
  }

  // Validators for testing
  const collectionIdValidator = Validators.generic<CollectionId>((from: unknown) => {
    if (typeof from !== 'string') {
      return fail('not a string');
    }
    if (!/^[a-z]+$/i.test(from)) {
      return fail('collection ID must be alphabetic');
    }
    return true;
  });

  const itemIdValidator = Validators.generic<ItemId>((from: unknown) => {
    if (typeof from !== 'string') {
      return fail('not a string');
    }
    if (!/^[0-9]+$/.test(from)) {
      return fail('item ID must be numeric');
    }
    return true;
  });

  const compositeIdValidator = Validators.compositeId<CompositeId, CollectionId, ItemId>({
    collectionId: collectionIdValidator,
    separator: '.',
    itemId: itemIdValidator
  });

  const itemConverter = Converters.object<ITestItem>({
    name: Converters.string,
    value: Converters.number
  });

  const defaultParams = {
    compositeIdValidator,
    collectionIdConverter: collectionIdValidator,
    itemIdConverter: itemIdValidator,
    itemConverter,
    delimiter: '.'
  };

  describe('static create', () => {
    test('creates an empty AggregatedResultMap', () => {
      expect(AggregatedResultMap.create(defaultParams)).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(0);
        expect(map.collectionCount).toBe(0);
      });
    });

    test('creates a map with pre-instantiated mutable collections', () => {
      const childConverters = new Collections.KeyValueConverters<ItemId, ITestItem>({
        key: itemIdValidator,
        value: itemConverter
      });
      const items = new ValidatingResultMap<ItemId, ITestItem>({
        converters: childConverters,
        entries: [['1' as ItemId, { name: 'test1', value: 10 }]]
      });

      expect(
        AggregatedResultMap.create({
          ...defaultParams,
          collections: [
            {
              isMutable: true,
              id: 'alpha' as CollectionId,
              items
            }
          ]
        })
      ).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(1);
        expect(map.collectionCount).toBe(1);
        expect(map.get('alpha.1' as CompositeId)).toSucceedWith({ name: 'test1', value: 10 });
      });
    });

    test('creates a map with pre-instantiated read-only collections', () => {
      const childConverters = new Collections.KeyValueConverters<ItemId, ITestItem>({
        key: itemIdValidator,
        value: itemConverter
      });
      const items = new ValidatingResultMap<ItemId, ITestItem>({
        converters: childConverters,
        entries: [['1' as ItemId, { name: 'test1', value: 10 }]]
      });

      expect(
        AggregatedResultMap.create({
          ...defaultParams,
          collections: [
            {
              isMutable: false,
              id: 'alpha' as CollectionId,
              items: items.toReadOnly()
            }
          ]
        })
      ).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(1);
        expect(map.get('alpha.1' as CompositeId)).toSucceedWith({ name: 'test1', value: 10 });
      });
    });

    test('creates a map from JSON with entries array', () => {
      expect(
        AggregatedResultMap.create({
          ...defaultParams,
          collections: [
            {
              isMutable: true,
              id: 'alpha' as CollectionId,
              entries: [['1', { name: 'test1', value: 10 }]]
            }
          ]
        })
      ).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(1);
        expect(map.get('alpha.1' as CompositeId)).toSucceedWith({ name: 'test1', value: 10 });
      });
    });

    test('creates a map from JSON with items object', () => {
      expect(
        AggregatedResultMap.create({
          ...defaultParams,
          collections: [
            {
              isMutable: true,
              id: 'alpha' as CollectionId,
              items: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                '1': { name: 'test1', value: 10 },
                // eslint-disable-next-line @typescript-eslint/naming-convention
                '2': { name: 'test2', value: 20 }
              }
            }
          ]
        })
      ).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(2);
        expect(map.get('alpha.1' as CompositeId)).toSucceedWith({ name: 'test1', value: 10 });
        expect(map.get('alpha.2' as CompositeId)).toSucceedWith({ name: 'test2', value: 20 });
      });
    });

    test('creates a map with multiple collections', () => {
      expect(
        AggregatedResultMap.create({
          ...defaultParams,
          collections: [
            {
              isMutable: true,
              id: 'alpha' as CollectionId,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              items: { '1': { name: 'a1', value: 1 } }
            },
            {
              isMutable: false,
              id: 'beta' as CollectionId,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              items: { '2': { name: 'b2', value: 2 } }
            }
          ]
        })
      ).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(2);
        expect(map.collectionCount).toBe(2);
        expect(map.get('alpha.1' as CompositeId)).toSucceedWith({ name: 'a1', value: 1 });
        expect(map.get('beta.2' as CompositeId)).toSucceedWith({ name: 'b2', value: 2 });
      });
    });

    test('uses default delimiter if not specified', () => {
      expect(
        AggregatedResultMap.create({
          compositeIdValidator,
          collectionIdConverter: collectionIdValidator,
          itemIdConverter: itemIdValidator,
          itemConverter,
          collections: [
            {
              isMutable: true,
              id: 'alpha' as CollectionId,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              items: { '1': { name: 'test', value: 1 } }
            }
          ]
        })
      ).toSucceedAndSatisfy((map) => {
        expect(map.get('alpha.1' as CompositeId)).toSucceed();
      });
    });

    test('fails when collection has invalid items', () => {
      expect(
        AggregatedResultMap.create({
          ...defaultParams,
          collections: [
            {
              isMutable: true,
              id: 'alpha' as CollectionId,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              items: { '1': { name: 'test', value: 'not a number' } }
            }
          ]
        })
      ).toFailWith(/Failed to create AggregatedResultMap/i);
    });

    test('fails when collection has invalid collection ID', () => {
      expect(
        AggregatedResultMap.create({
          ...defaultParams,
          collections: [
            {
              isMutable: true,
              id: '123invalid' as CollectionId,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              items: { '1': { name: 'test', value: 1 } }
            }
          ]
        })
      ).toFailWith(/Failed to create AggregatedResultMap/i);
    });
  });

  describe('IReadOnlyValidatingResultMap interface', () => {
    let map: AggregatedResultMap<CompositeId, CollectionId, ItemId, ITestItem>;

    beforeEach(() => {
      map = AggregatedResultMap.create({
        ...defaultParams,
        collections: [
          {
            isMutable: true,
            id: 'alpha' as CollectionId,
            items: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              '1': { name: 'a1', value: 1 },
              // eslint-disable-next-line @typescript-eslint/naming-convention
              '2': { name: 'a2', value: 2 }
            }
          },
          {
            isMutable: false,
            id: 'beta' as CollectionId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            items: { '3': { name: 'b3', value: 3 } }
          }
        ]
      }).orThrow();
    });

    describe('get', () => {
      test('returns the item for a valid composite ID', () => {
        expect(map.get('alpha.1' as CompositeId)).toSucceedWith({ name: 'a1', value: 1 });
        expect(map.get('beta.3' as CompositeId)).toSucceedWith({ name: 'b3', value: 3 });
      });

      test('fails when collection does not exist', () => {
        expect(map.get('gamma.1' as CompositeId)).toFailWithDetail(/not found/i, 'not-found');
      });

      test('fails when item does not exist in collection', () => {
        expect(map.get('alpha.99' as CompositeId)).toFailWithDetail(/not found/i, 'not-found');
      });
    });

    describe('has', () => {
      test('returns true for existing items', () => {
        expect(map.has('alpha.1' as CompositeId)).toBe(true);
        expect(map.has('beta.3' as CompositeId)).toBe(true);
      });

      test('returns false for non-existing items', () => {
        expect(map.has('alpha.99' as CompositeId)).toBe(false);
        expect(map.has('gamma.1' as CompositeId)).toBe(false);
      });
    });

    describe('size', () => {
      test('returns total count of items across all collections', () => {
        expect(map.size).toBe(3);
      });
    });

    describe('entries', () => {
      test('iterates over all entries', () => {
        const entries = Array.from(map.entries());
        expect(entries).toHaveLength(3);

        const keys = entries.map((entry) => entry[0]);
        expect(keys).toContain('alpha.1');
        expect(keys).toContain('alpha.2');
        expect(keys).toContain('beta.3');
      });
    });

    describe('keys', () => {
      test('iterates over all keys', () => {
        const keys = Array.from(map.keys());
        expect(keys).toHaveLength(3);
        expect(keys).toContain('alpha.1');
        expect(keys).toContain('alpha.2');
        expect(keys).toContain('beta.3');
      });
    });

    describe('values', () => {
      test('iterates over all values', () => {
        const values = Array.from(map.values());
        expect(values).toHaveLength(3);
        expect(values).toContainEqual({ name: 'a1', value: 1 });
        expect(values).toContainEqual({ name: 'a2', value: 2 });
        expect(values).toContainEqual({ name: 'b3', value: 3 });
      });
    });

    describe('forEach', () => {
      test('calls callback for each entry', () => {
        const items: Array<{ key: CompositeId; value: ITestItem }> = [];
        map.forEach((value: ITestItem, key: CompositeId) => {
          items.push({ key, value });
        });
        expect(items).toHaveLength(3);
      });

      test('provides correct thisArg', () => {
        const context = { count: 0 };
        map.forEach(function (this: typeof context) {
          this.count++;
        }, context);
        expect(context.count).toBe(3);
      });
    });

    describe('Symbol.iterator', () => {
      test('allows for...of iteration', () => {
        const entries: Array<[CompositeId, ITestItem]> = [];
        for (const entry of map) {
          entries.push(entry);
        }
        expect(entries).toHaveLength(3);
      });
    });
  });

  describe('validating property', () => {
    let map: AggregatedResultMap<CompositeId, CollectionId, ItemId, ITestItem>;
    let validating: AggregatedResultMapValidator<CompositeId, CollectionId, ItemId, ITestItem>;

    beforeEach(() => {
      map = AggregatedResultMap.create({
        ...defaultParams,
        collections: [
          {
            isMutable: true,
            id: 'alpha' as CollectionId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            items: { '1': { name: 'a1', value: 1 } }
          }
        ]
      }).orThrow();
      // Cast to access mutating methods on the validator
      validating = map.validating as AggregatedResultMapValidator<
        CompositeId,
        CollectionId,
        ItemId,
        ITestItem
      >;
    });

    describe('get', () => {
      test('validates and retrieves item', () => {
        expect(validating.get('alpha.1')).toSucceedWith({ name: 'a1', value: 1 });
      });

      test('fails for invalid key format', () => {
        expect(validating.get('invalid')).toFail();
      });
    });

    describe('has', () => {
      test('returns true for existing valid key', () => {
        expect(validating.has('alpha.1')).toBe(true);
      });

      test('returns false for invalid key format', () => {
        expect(validating.has('invalid')).toBe(false);
      });
    });

    describe('set', () => {
      test('validates and sets item', () => {
        expect(validating.set('alpha.2', { name: 'a2', value: 2 })).toSucceed();
        expect(map.get('alpha.2' as CompositeId)).toSucceedWith({ name: 'a2', value: 2 });
      });

      test('fails for invalid key', () => {
        expect(validating.set('invalid', { name: 'test', value: 1 })).toFail();
      });

      test('fails for invalid value', () => {
        expect(validating.set('alpha.2', { name: 123, value: 'bad' })).toFail();
      });
    });

    describe('add', () => {
      test('validates and adds item', () => {
        expect(validating.add('alpha.2', { name: 'a2', value: 2 })).toSucceed();
      });

      test('fails if item exists', () => {
        expect(validating.add('alpha.1', { name: 'new', value: 99 })).toFail();
      });
    });

    describe('update', () => {
      test('validates and updates item', () => {
        expect(validating.update('alpha.1', { name: 'updated', value: 100 })).toSucceed();
        expect(map.get('alpha.1' as CompositeId)).toSucceedWith({ name: 'updated', value: 100 });
      });

      test('fails if item does not exist', () => {
        expect(validating.update('alpha.99', { name: 'new', value: 1 })).toFail();
      });
    });

    describe('delete', () => {
      test('validates and deletes item', () => {
        expect(validating.delete('alpha.1')).toSucceed();
        expect(map.has('alpha.1' as CompositeId)).toBe(false);
      });

      test('fails if item does not exist', () => {
        expect(validating.delete('alpha.99')).toFail();
      });
    });
  });

  describe('mutating methods', () => {
    let map: AggregatedResultMap<CompositeId, CollectionId, ItemId, ITestItem>;

    beforeEach(() => {
      map = AggregatedResultMap.create({
        ...defaultParams,
        collections: [
          {
            isMutable: true,
            id: 'alpha' as CollectionId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            items: { '1': { name: 'a1', value: 1 } }
          },
          {
            isMutable: false,
            id: 'beta' as CollectionId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            items: { '1': { name: 'b1', value: 10 } }
          }
        ]
      }).orThrow();
    });

    describe('set', () => {
      test('sets item in existing mutable collection', () => {
        expect(map.set('alpha.2' as CompositeId, { name: 'a2', value: 2 })).toSucceed();
        expect(map.get('alpha.2' as CompositeId)).toSucceedWith({ name: 'a2', value: 2 });
      });

      test('creates new collection if it does not exist', () => {
        expect(map.set('gamma.1' as CompositeId, { name: 'g1', value: 100 })).toSucceed();
        expect(map.get('gamma.1' as CompositeId)).toSucceedWith({ name: 'g1', value: 100 });
        expect(map.collectionCount).toBe(3);
      });

      test('fails for immutable collection', () => {
        expect(map.set('beta.2' as CompositeId, { name: 'b2', value: 20 })).toFailWith(
          /cannot modify immutable collection/i
        );
      });
    });

    describe('add', () => {
      test('adds item to existing mutable collection', () => {
        expect(map.add('alpha.2' as CompositeId, { name: 'a2', value: 2 })).toSucceed();
      });

      test('fails if item already exists', () => {
        expect(map.add('alpha.1' as CompositeId, { name: 'new', value: 99 })).toFail();
      });

      test('creates new collection if it does not exist', () => {
        expect(map.add('gamma.1' as CompositeId, { name: 'g1', value: 100 })).toSucceed();
        expect(map.hasCollection('gamma' as CollectionId)).toBe(true);
      });

      test('fails for immutable collection', () => {
        expect(map.add('beta.2' as CompositeId, { name: 'b2', value: 20 })).toFailWith(
          /cannot modify immutable collection/i
        );
      });
    });

    describe('update', () => {
      test('updates existing item', () => {
        expect(map.update('alpha.1' as CompositeId, { name: 'updated', value: 999 })).toSucceed();
        expect(map.get('alpha.1' as CompositeId)).toSucceedWith({ name: 'updated', value: 999 });
      });

      test('fails if item does not exist', () => {
        expect(map.update('alpha.99' as CompositeId, { name: 'new', value: 1 })).toFail();
      });

      test('fails for immutable collection', () => {
        expect(map.update('beta.1' as CompositeId, { name: 'new', value: 999 })).toFailWith(
          /cannot modify immutable collection/i
        );
      });
    });

    describe('delete', () => {
      test('deletes existing item', () => {
        expect(map.delete('alpha.1' as CompositeId)).toSucceed();
        expect(map.has('alpha.1' as CompositeId)).toBe(false);
      });

      test('fails if item does not exist', () => {
        expect(map.delete('alpha.99' as CompositeId)).toFail();
      });

      test('fails for immutable collection', () => {
        expect(map.delete('beta.1' as CompositeId)).toFailWith(/cannot modify immutable collection/i);
      });
    });

    describe('getOrAdd', () => {
      test('gets existing item without adding', () => {
        expect(map.getOrAdd('alpha.1' as CompositeId, { name: 'new', value: 999 })).toSucceedWith({
          name: 'a1',
          value: 1
        });
      });

      test('adds new item when not found', () => {
        expect(map.getOrAdd('alpha.2' as CompositeId, { name: 'a2', value: 2 })).toSucceedWith({
          name: 'a2',
          value: 2
        });
        expect(map.get('alpha.2' as CompositeId)).toSucceedWith({ name: 'a2', value: 2 });
      });

      test('creates new collection when needed', () => {
        expect(map.getOrAdd('gamma.1' as CompositeId, { name: 'g1', value: 100 })).toSucceed();
        expect(map.hasCollection('gamma' as CollectionId)).toBe(true);
      });

      test('works with factory function', () => {
        const factory = jest.fn((_key: ItemId) => succeed({ name: 'factory', value: 42 }));
        expect(map.getOrAdd('alpha.2' as CompositeId, factory)).toSucceedWith({
          name: 'factory',
          value: 42
        });
        expect(factory).toHaveBeenCalled();
      });

      test('does not call factory for existing item', () => {
        const factory = jest.fn((_key: ItemId) => succeed({ name: 'factory', value: 42 }));
        expect(map.getOrAdd('alpha.1' as CompositeId, factory)).toSucceedWith({
          name: 'a1',
          value: 1
        });
        expect(factory).not.toHaveBeenCalled();
      });

      test('fails for immutable collection', () => {
        expect(map.getOrAdd('beta.2' as CompositeId, { name: 'b2', value: 20 })).toFailWith(
          /cannot modify immutable collection/i
        );
      });
    });
  });

  describe('collection-level methods', () => {
    let map: AggregatedResultMap<CompositeId, CollectionId, ItemId, ITestItem>;

    beforeEach(() => {
      map = AggregatedResultMap.create({
        ...defaultParams,
        collections: [
          {
            isMutable: true,
            id: 'alpha' as CollectionId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            items: { '1': { name: 'a1', value: 1 } }
          }
        ]
      }).orThrow();
    });

    describe('getCollection', () => {
      test('returns collection by ID', () => {
        expect(map.getCollection('alpha' as CollectionId)).toSucceedAndSatisfy((entry) => {
          expect(entry.id).toBe('alpha');
          expect(entry.isMutable).toBe(true);
        });
      });

      test('fails for non-existent collection', () => {
        expect(map.getCollection('gamma' as CollectionId)).toFailWithDetail(/not found/i, 'not-found');
      });
    });

    describe('hasCollection', () => {
      test('returns true for existing collection', () => {
        expect(map.hasCollection('alpha' as CollectionId)).toBe(true);
      });

      test('returns false for non-existent collection', () => {
        expect(map.hasCollection('gamma' as CollectionId)).toBe(false);
      });
    });

    describe('addCollection', () => {
      test('adds a new collection from JSON with items', () => {
        expect(
          map.addCollection({
            isMutable: true,
            id: 'beta' as CollectionId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            items: { '1': { name: 'b1', value: 10 } }
          })
        ).toSucceed();
        expect(map.hasCollection('beta' as CollectionId)).toBe(true);
        expect(map.get('beta.1' as CompositeId)).toSucceedWith({ name: 'b1', value: 10 });
      });

      test('adds a new collection from JSON with entries', () => {
        expect(
          map.addCollection({
            isMutable: true,
            id: 'beta' as CollectionId,
            entries: [['1', { name: 'b1', value: 10 }]]
          })
        ).toSucceed();
        expect(map.get('beta.1' as CompositeId)).toSucceedWith({ name: 'b1', value: 10 });
      });

      test('fails if collection already exists', () => {
        expect(
          map.addCollection({
            isMutable: true,
            id: 'alpha' as CollectionId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            items: { '2': { name: 'a2', value: 2 } }
          })
        ).toFail();
      });

      test('fails with invalid collection data', () => {
        expect(
          map.addCollection({
            isMutable: true,
            id: '123invalid' as CollectionId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            items: { '1': { name: 'test', value: 1 } }
          })
        ).toFail();
      });
    });

    describe('collections', () => {
      test('iterates over all collections', () => {
        map.addCollection({
          isMutable: false,
          id: 'beta' as CollectionId,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          items: { '1': { name: 'b1', value: 10 } }
        });

        const collections = Array.from(map.collections());
        expect(collections).toHaveLength(2);

        const ids = collections.map((c: { id: CollectionId }) => c.id);
        expect(ids).toContain('alpha');
        expect(ids).toContain('beta');
      });
    });

    describe('collectionCount', () => {
      test('returns count of collections', () => {
        expect(map.collectionCount).toBe(1);
        map.addCollection({
          isMutable: true,
          id: 'beta' as CollectionId,
          items: {}
        });
        expect(map.collectionCount).toBe(2);
      });
    });
  });

  describe('edge cases', () => {
    test('handles empty collections correctly', () => {
      expect(
        AggregatedResultMap.create({
          ...defaultParams,
          collections: [
            {
              isMutable: true,
              id: 'empty' as CollectionId,
              items: {}
            }
          ]
        })
      ).toSucceedAndSatisfy((map) => {
        expect(map.size).toBe(0);
        expect(map.collectionCount).toBe(1);
        expect(map.hasCollection('empty' as CollectionId)).toBe(true);
      });
    });

    test('handles custom delimiters', () => {
      const colonValidator = Validators.compositeId<CompositeId, CollectionId, ItemId>({
        collectionId: collectionIdValidator,
        separator: ':',
        itemId: itemIdValidator
      });

      expect(
        AggregatedResultMap.create({
          compositeIdValidator: colonValidator,
          collectionIdConverter: collectionIdValidator,
          itemIdConverter: itemIdValidator,
          itemConverter,
          delimiter: ':',
          collections: [
            {
              isMutable: true,
              id: 'alpha' as CollectionId,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              items: { '1': { name: 'test', value: 1 } }
            }
          ]
        })
      ).toSucceedAndSatisfy((map) => {
        expect(map.get('alpha:1' as CompositeId)).toSucceed();
      });
    });

    test('correctly differentiates mutable and immutable collections', () => {
      const map = AggregatedResultMap.create({
        ...defaultParams,
        collections: [
          {
            isMutable: true,
            id: 'mutable' as CollectionId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            items: { '1': { name: 'm1', value: 1 } }
          },
          {
            isMutable: false,
            id: 'immutable' as CollectionId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            items: { '1': { name: 'i1', value: 1 } }
          }
        ]
      }).orThrow();

      // Can modify mutable
      expect(map.set('mutable.2' as CompositeId, { name: 'm2', value: 2 })).toSucceed();

      // Cannot modify immutable
      expect(map.set('immutable.2' as CompositeId, { name: 'i2', value: 2 })).toFail();
    });
  });
});
