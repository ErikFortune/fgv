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
import { SimpleCollector, CollectibleFactoryCallback } from '../../../packlets/collections';
import {
  ITestThing,
  CollectibleTestThing,
  BrokenCollectibleTestThing,
  TestCollector,
  getTestThings
} from './helpers';
import { succeed } from '../../../packlets/base';

describe('Collectors', () => {
  let things: ITestThing[];
  let collectibles: CollectibleTestThing[];

  beforeEach(() => {
    const td = getTestThings();
    things = td.things;
    collectibles = td.collectibles;
  });

  describe('SimpleCollector', () => {
    describe('constructor', () => {
      test('can be constructed with initial items', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        expect(collector.size).toBe(collectibles.length);
        expect(collector.inner.size).toBe(collectibles.length);
        collectibles.forEach((c) => {
          // index should have been set when it was added
          expect(c.index).toBeDefined();
          expect(collector.has(c.key)).toBe(true);
          expect(collector.get(c.key)).toSucceedWith(c);
          expect(collector.getAt(c.index!)).toSucceedWith(c);
        });
        expect(Array.from(collector.keys())).toEqual(collectibles.map((c) => c.key));
        expect(Array.from(collector.values())).toEqual(collectibles);
        expect(Array.from(collector.entries())).toEqual(collectibles.map((c) => [c.key, c]));

        for (const [key, value] of collector) {
          expect(collectibles.map((c) => c.key)).toContain(key);
          expect(collectibles).toContain(value);
        }

        collector.forEach((value, key) => {
          expect(collectibles.map((c) => c.key)).toContain(key);
          expect(collectibles).toContain(value);
        });
      });

      test('can be constructed with no items', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        expect(collector.size).toBe(0);
      });
    });

    describe('createSimpleCollector', () => {
      test('succeeds with initial items', () => {
        expect(SimpleCollector.createSimpleCollector({ items: collectibles })).toSucceedAndSatisfy(
          (collector) => {
            expect(collector.size).toBe(collectibles.length);
            for (const c of collectibles) {
              // index should have been set when it was added
              expect(c.index).toBeDefined();
              expect(collector.has(c.key)).toBe(true);
              expect(collector.get(c.key)).toSucceedWith(c);
              expect(collector.getAt(c.index!)).toSucceedWith(c);
            }
          }
        );
      });
    });

    describe('add', () => {
      test('adds an item to the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing');
        expect(collector.add(thing)).toSucceedWith(thing);
        expect(collector.size).toBe(1);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('fails if the item key is already in the collector with a different object', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const thing = new CollectibleTestThing(things[2], 'thing1');
        expect(collector.add(thing)).toFailWith(/already exists/);
        expect(collector.size).toBe(collectibles.length);
        expect(collector.get(thing.key)).toSucceedWith(collectibles[1]);
      });

      test('fails if the item index cannot be changed', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing', 5);
        expect(collector.add(thing)).toFailWith(/cannot be changed/);
        expect(collector.size).toBe(0);
      });
    });

    describe('get', () => {
      test('returns an item by key', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const thing = collectibles[0];
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('fails if the item is not in the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        expect(collector.get('notThere')).toFailWith(/not found/);
      });
    });

    describe('getAt', () => {
      test('returns an item by index', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const thing = collectibles[0];
        expect(collector.getAt(thing.index!)).toSucceedWith(thing);
      });

      test('fails if the index is out of range', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(100)).toFailWith(/out of range/);
      });
    });

    describe('getOrAdd', () => {
      test('adds a new item to the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing');
        expect(collector.getOrAdd(thing)).toSucceedWith(thing);
        expect(collector.size).toBe(1);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('returns an existing item if it is already in the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const thing = collectibles[0];
        expect(collector.getOrAdd(thing)).toSucceedWith(thing);
        expect(collector.size).toBe(collectibles.length);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('uses a factory function to create a new item if it is not already in the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing: ITestThing = { str: 'new', num: 6, bool: false };
        const factory: CollectibleFactoryCallback<string, number, CollectibleTestThing> = jest.fn(
          (key, index) => succeed(new CollectibleTestThing(thing, key, index))
        );
        expect(collector.getOrAdd('newThing', factory)).toSucceedWith(expect.objectContaining(thing));
        expect(factory).toHaveBeenCalledWith('newThing', 0);
        expect(collector.size).toBe(1);
        expect(collector.get('newThing')).toSucceedWith(expect.objectContaining(thing));
      });

      test('does not call the factory if an item is already in the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const thing = collectibles[0];
        const factory: CollectibleFactoryCallback<string, number, CollectibleTestThing> = jest.fn(
          (key, index) => succeed(new CollectibleTestThing({ str: 'new', num: 6, bool: false }, key, index))
        );
        expect(collector.getOrAdd(thing.key, factory)).toSucceedWith(thing);
        expect(factory).not.toHaveBeenCalled();
        expect(collector.size).toBe(collectibles.length);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('fails if the object to be added has a mismatched key', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'thing');
        expect(collector.getOrAdd('newThing', () => succeed(thing))).toFailWith(/key mismatch/);
      });

      test('fails if the object to be added has an immutable index', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing', 100);
        expect(collector.getOrAdd('newThing', () => succeed(thing))).toFailWith(/immutable/);
      });

      test('fails if the object to be added has a mismatched index', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new BrokenCollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing');
        expect(collector.getOrAdd('newThing', () => succeed(thing))).toFailWith(/index mismatch/);
      });
    });

    describe('getOrAdd with item', () => {
      test('adds a new item to the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'thing0');
        expect(collector.getOrAdd(thing)).toSucceedWith(thing);
        expect(collector.size).toBe(1);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('returns an existing item if it is already in the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const newThing = new CollectibleTestThing(things[2], 'thing1');
        expect(collector.getOrAdd(newThing)).toSucceedWithDetail(collectibles[1], 'exists');
        expect(collector.size).toBe(collectibles.length);
        expect(collector.get(newThing.key)).toSucceedWith(collectibles[1]);
      });

      test('fails without adding if the item index cannot be set', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'thing0', 5);
        expect(collector.getOrAdd(thing)).toFailWithDetail(/cannot be changed/, 'invalid-index');
        expect(collector.size).toBe(0);
      });

      test('does not check index of item to be added if key is already in collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const newThing = new CollectibleTestThing(things[2], 'thing1', 5);
        expect(collector.getOrAdd(newThing)).toSucceedWithDetail(collectibles[1], 'exists');
        expect(collector.size).toBe(collectibles.length);
        expect(collector.get(newThing.key)).toSucceedWith(collectibles[1]);
      });
    });

    describe('toReadOnly', () => {
      test('returns a readonly map of the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const map = collector.toReadOnly();
        expect(map.size).toBe(collectibles.length);
        for (const c of collectibles) {
          expect(map.has(c.key)).toBe(true);
          expect(map.get(c.key)).toSucceedWith(c);
        }
      });
    });
  });

  describe('ValidatingCollector', () => {
    describe('constructor', () => {
      test('can be constructed with initial items', () => {
        const collector = new TestCollector(things);
        expect(collector.size).toBe(collectibles.length);
        for (const c of collectibles) {
          // index should have been set when it was added
          expect(c.index).toBeDefined();
          expect(collector.has(c.key)).toBe(true);
          expect(collector.get(c.key)).toSucceedAndSatisfy((item) => {
            expect(item).toEqual(c);
            expect(item).not.toBe(c);
            expect(collector.getAt(c.index!)).toSucceedWith(item);
          });
        }
      });

      test('can be constructed with no items', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        expect(collector.size).toBe(0);
      });
    });
  });
});
