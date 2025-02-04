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

import '../../helpers/jest';
import { fail, succeed } from '../../../packlets/base';
import {
  CollectibleFactory,
  CollectibleFactoryCallback,
  KeyValueEntry,
  SimpleConvertingCollector
} from '../../../packlets/collections';
import { CollectibleTestThing, getTestThings, ITestThing } from './helpers';

describe('ConvertingCollector', () => {
  let things: ITestThing[];
  let collectibles: CollectibleTestThing[];
  let entries: KeyValueEntry<string, ITestThing>[];
  let factory: CollectibleFactory<CollectibleTestThing, ITestThing>;

  beforeEach(() => {
    const td = getTestThings();
    things = td.things;
    collectibles = td.collectibles;
    entries = things.map((t, ix): [string, ITestThing] => [collectibles[ix].key, t]);
    factory = (k, ix, it) => CollectibleTestThing.create(it, k, ix);
  });

  describe('SimpleConvertingCollector', () => {
    describe('constructor', () => {
      test('constructor throws if an entry fails construction', () => {
        factory = (k, ix, it) => {
          if (ix === 1) {
            return fail('bad thing');
          }
          return CollectibleTestThing.create(it, k, ix);
        };
        expect(
          () => new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({ factory, entries })
        ).toThrow(/bad thing/);
      });
    });

    describe('createSimpleConverter method', () => {
      test('constructs a new empty instance by default', () => {
        expect(
          SimpleConvertingCollector.createSimpleCollector<CollectibleTestThing, ITestThing>({ factory })
        ).toSucceedAndSatisfy((collector) => {
          expect(collector).toBeDefined();
          expect(collector.size).toBe(0);
        });
      });

      test('constructs a new instance with an initial set of entries', () => {
        expect(
          SimpleConvertingCollector.createSimpleCollector<CollectibleTestThing, ITestThing>({
            factory,
            entries
          })
        ).toSucceedAndSatisfy((collector) => {
          expect(collector).toBeDefined();
          expect(collector.size).toBe(entries.length);

          entries.forEach(([key, item], index) => {
            expect(collector.get(key)).toSucceedAndSatisfy((c) => {
              expect(c).toEqual(
                expect.objectContaining({
                  ...item,
                  key,
                  index
                })
              );
            });
          });
        });
      });

      test('fails if an entry fails construction', () => {
        factory = (k, ix, it) => {
          if (ix === 1) {
            return fail('bad thing');
          }
          return CollectibleTestThing.create(it, k, ix);
        };
        expect(
          SimpleConvertingCollector.createSimpleCollector<CollectibleTestThing, ITestThing>({
            factory,
            entries
          })
        ).toFailWith(/bad thing/);
      });
    });

    describe('add method', () => {
      test('adds an item to the collector', () => {
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({ factory });
        const [key, thing] = entries[0];
        const expected = collectibles[0];
        expect(collector.add(key, thing)).toSucceedAndSatisfy((result) => {
          expect(result).toEqual(expect.objectContaining(expected));
          expect(result).not.toBe(expected);
          expect(collector.size).toBe(1);
        });
      });

      test('fails if the key already exists', () => {
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({
          factory,
          entries
        });
        const thing = things[0];
        expect(collector.add(thing.str!, thing)).toFailWith(/already exists/);
      });

      test('succeeds if the key already exists but the item is the same (identity)', () => {
        factory = (k, ix, it) => succeed(collectibles[ix]);
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({
          factory,
          entries
        });
        expect(collector.get(collectibles[0].key)).toSucceedAndSatisfy((collectible) => {
          // identity not equality
          expect(collectible).toBe(collectibles[0]);
        });
        // this factory returns items from a fixed set so the item is identical, not just equal
        expect(collector.add(collectibles[0])).toSucceedAndSatisfy((result) => {
          expect(result).toBe(collectibles[0]);
        });
      });

      test('propagates errors from the factory', () => {
        factory = (k, ix, it) => fail('bad thing');
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({ factory });
        const [key, thing] = entries[0];
        expect(collector.add(key, thing)).toFailWith(/bad thing/);
      });
    });

    describe('getOrAdd with source object', () => {
      test('adds an item to the collector if it does not exist', () => {
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({ factory });
        const [key, thing] = entries[0];
        const expected = collectibles[0];
        expect(collector.getOrAdd(key, thing)).toSucceedAndSatisfy((result) => {
          // equality not identity with this factory
          expect(result).toEqual(expect.objectContaining(expected));
          expect(result).not.toBe(expected);
          expect(collector.size).toBe(1);
        });
      });

      test('returns an existing item if present, without invoking the factory', () => {
        const factoryFn = jest.fn(factory);
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({
          factory: factoryFn,
          entries
        });
        const [key, thing] = entries[0];
        const existing = collector.get(key).orThrow();
        factoryFn.mockClear();
        expect(collector.getOrAdd(key, thing)).toSucceedAndSatisfy((result) => {
          expect(result).toBe(existing);
          expect(factoryFn).not.toHaveBeenCalled();
        });
      });

      test('uses a supplied factory function to create a new item if the key does not exist', () => {
        const factoryFn = jest.fn(factory);
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({
          factory: factoryFn
        });
        const [key] = entries[0];
        const callFactory: CollectibleFactoryCallback<CollectibleTestThing> = (k, ix) => {
          return succeed(collectibles[ix]);
        };
        const callFactoryFn = jest.fn(callFactory);

        factoryFn.mockClear();
        expect(collector.getOrAdd(key, callFactoryFn)).toSucceedAndSatisfy((result) => {
          // call factory returns from the collectibles array so identity is expected
          expect(result).toBe(collectibles[0]);
          expect(collector.size).toBe(1);
        });
        expect(callFactoryFn).toHaveBeenCalled();
        expect(factoryFn).not.toHaveBeenCalled();
      });

      test('fails if the collectible to be added has a mismatched key', () => {
        factory = (k, ix, it) => CollectibleTestThing.create(it, `not_${k}`, ix);
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({ factory });
        expect(collector.getOrAdd('foo', things[0])).toFailWithDetail(/key mismatch/, 'invalid-key');
      });

      test('fails if the collectible to be added has a mismatched index', () => {
        factory = (k, ix, it) => CollectibleTestThing.create(it, k, ix + 1);
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({ factory });
        expect(collector.getOrAdd('foo', things[0])).toFailWith(/cannot be changed/);
      });

      test('propagates errors from the factory', () => {
        factory = (k, ix, it) => fail('bad thing');
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({ factory });
        const [key, thing] = entries[0];
        expect(collector.getOrAdd(key, thing)).toFailWith(/bad thing/);
      });
    });

    describe('getOrAdd with target item', () => {
      test('adds a new item to the collector', () => {
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({ factory });

        expect(collector.getOrAdd(collectibles[0])).toSucceedAndSatisfy((collectible) => {
          expect(collectible).toBe(collectibles[0]);
          expect(collectible.index).toBe(0);
          expect(collector.size).toBe(1);
        });
      });

      test('returns an existing item if present, without invoking the factory', () => {
        const factoryFn = jest.fn(factory);
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({
          factory: factoryFn,
          entries
        });
        const existing = collector.get(collectibles[0].key).orThrow();
        const toAdd = new CollectibleTestThing(things[0], 'thing0', 0);
        factoryFn.mockClear();
        expect(collector.getOrAdd(toAdd)).toSucceedAndSatisfy((result) => {
          expect(result).toBe(existing);
          expect(factoryFn).not.toHaveBeenCalled();
        });
      });

      test('fails without adding if the item index cannot be set', () => {
        const collector = new SimpleConvertingCollector<CollectibleTestThing, ITestThing>({ factory });
        const toAdd = new CollectibleTestThing(things[0], 'thing0', 1);
        expect(collector.getOrAdd(toAdd)).toFailWithDetail(/cannot be changed/, 'invalid-index');
      });
    });
  });
});
