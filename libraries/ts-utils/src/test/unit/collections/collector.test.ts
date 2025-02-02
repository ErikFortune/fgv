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
import { Collector, IReadOnlyCollector } from '../../../packlets/collections';
import { CollectibleTestThing, getTestThings, ITestThing } from './helpers';

describe('Collector class', () => {
  let things: ITestThing[];
  let collectibles: CollectibleTestThing[];

  beforeEach(() => {
    // get fresh data before each test so tests can mutate test data
    const td = getTestThings();
    things = td.things;
    collectibles = td.collectibles;
  });

  describe('constructor', () => {
    test('can be constructed with initial items', () => {
      const collector = new Collector<string, number, CollectibleTestThing>({ items: collectibles });
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
      const collector = new Collector<string, number, CollectibleTestThing>();
      expect(collector.size).toBe(0);
    });

    test('throws an error if items have duplicate keys', () => {
      const dupes = collectibles.concat(new CollectibleTestThing(things[0], 'thing1', 0));
      expect(() => new Collector<string, number, CollectibleTestThing>({ items: dupes })).toThrow();
    });
  });

  describe('createCollector static  method', () => {
    test('can create a collector with no items', () => {
      expect(Collector.createCollector<string, number, CollectibleTestThing>()).toSucceedAndSatisfy(
        (collector) => {
          expect(collector.size).toBe(0);
        }
      );
    });

    test('can create a collector with initial items', () => {
      expect(
        Collector.createCollector<string, number, CollectibleTestThing>({ items: collectibles })
      ).toSucceedAndSatisfy((collector) => {
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
    });

    test('fails if entries have duplicate keys', () => {
      const dupes = collectibles.concat(new CollectibleTestThing(things[0], 'thing1', 0));
      expect(Collector.createCollector<string, number, CollectibleTestThing>({ items: dupes })).toFailWith(
        /already exists/
      );
    });

    test('fails if index for some entry cannot be set', () => {
      collectibles.push(new CollectibleTestThing(things[0], 'thing100', 100));
      expect(
        Collector.createCollector<string, number, CollectibleTestThing>({ items: collectibles })
      ).toFailWith(/cannot be changed/);
    });
  });

  describe('add', () => {
    test('adds an item to the collector', () => {
      const collector = new Collector<string, number, CollectibleTestThing>();
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing');
      expect(collector.add(thing)).toSucceedWith(thing);
      expect(collector.size).toBe(1);
      expect(collector.get(thing.key)).toSucceedWith(thing);
    });

    test('succeeds if an object is added multiple times', () => {
      const collector = new Collector<string, number, CollectibleTestThing>();
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing');
      expect(collector.add(thing)).toSucceedWith(thing);
      expect(collector.add(thing)).toSucceedWith(thing);
      expect(collector.size).toBe(1);
      expect(collector.get(thing.key)).toSucceedWith(thing);
    });

    test('fails if the item key is already in the collector with a different object', () => {
      const collector = new Collector<string, number, CollectibleTestThing>({ items: collectibles });
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'thing1');
      expect(collector.add(thing)).toFailWith(/already exists/);
      expect(collector.size).toBe(collectibles.length);
      expect(collector.get(thing.key)).toSucceedAndSatisfy((c) => {
        expect(c).not.toBe(thing);
        expect(c).toBe(collectibles[0]);
      });
    });

    test('fails if the item index cannot be changed', () => {
      const collector = new Collector<string, number, CollectibleTestThing>();
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing', 5);
      expect(collector.add(thing)).toFailWith(/cannot be changed/);
      expect(collector.size).toBe(0);
    });
  });

  describe('get', () => {
    test('returns an item with a valid key', () => {
      const collector = new Collector<string, number, CollectibleTestThing>({ items: collectibles });
      collectibles.forEach((c) => {
        expect(collector.get(c.key)).toSucceedWith(c);
      });
    });

    test('fails if the key is not in the collector', () => {
      const collector = new Collector<string, number, CollectibleTestThing>({ items: collectibles });
      expect(collector.get('not-a-key')).toFailWith(/not found/);
    });
  });

  describe('getAt', () => {
    test('returns an item at a valid index', () => {
      const collector = new Collector<string, number, CollectibleTestThing>({ items: collectibles });
      collectibles.forEach((c, i) => {
        expect(collector.getAt(i)).toSucceedWith(c);
      });
    });

    test('fails if the index is less than 0', () => {
      const collector = new Collector<string, number, CollectibleTestThing>({ items: collectibles });
      expect(collector.getAt(-1)).toFailWith(/out of range/);
    });

    test('fails if the index is greater than the number of items', () => {
      const collector = new Collector<string, number, CollectibleTestThing>({ items: collectibles });
      expect(collector.getAt(collectibles.length)).toFailWith(/out of range/);
    });
  });

  describe('getOrAddItem', () => {
    test('adds a new item to the collector', () => {
      const collector = new Collector<string, number, CollectibleTestThing>();
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'thing0');
      expect(collector.getOrAdd(thing)).toSucceedWith(thing);
      expect(collector.size).toBe(1);
      expect(collector.get(thing.key)).toSucceedWith(thing);
    });

    test('returns an existing item if it is already in the collector', () => {
      const collector = new Collector<string, number, CollectibleTestThing>({ items: collectibles });
      const newThing = new CollectibleTestThing(things[2], 'thing1');
      expect(collector.getOrAdd(newThing)).toSucceedWithDetail(collectibles[0], 'exists');
      expect(collector.size).toBe(collectibles.length);
      expect(collector.get(newThing.key)).toSucceedWith(collectibles[0]);
    });

    test('fails without adding if the item index cannot be set', () => {
      const collector = new Collector<string, number, CollectibleTestThing>();
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'thing0', 5);
      expect(collector.getOrAdd(thing)).toFailWithDetail(/cannot be changed/, 'invalid-index');
      expect(collector.size).toBe(0);
    });

    test('does not check index of item to be added if key is already in collector', () => {
      const collector = new Collector<string, number, CollectibleTestThing>({ items: collectibles });
      const newThing = new CollectibleTestThing(things[2], collectibles[1].key, 10);
      expect(collector.getOrAdd(newThing)).toSucceedWithDetail(collectibles[1], 'exists');
      expect(collector.size).toBe(collectibles.length);
      expect(collector.get(newThing.key)).toSucceedWith(collectibles[1]);
    });
  });

  describe('toReadOnly', () => {
    test('returns a readonly map of the collector', () => {
      const collector = new Collector<string, number, CollectibleTestThing>({ items: collectibles });
      const map: IReadOnlyCollector<string, number, CollectibleTestThing> = collector.toReadOnly();
      expect(map.size).toBe(collectibles.length);
      for (const c of collectibles) {
        expect(map.has(c.key)).toBe(true);
        expect(map.get(c.key)).toSucceedWith(c);
      }
    });
  });
});
