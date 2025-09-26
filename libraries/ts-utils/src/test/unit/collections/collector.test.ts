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
import { fail } from '../../../packlets/base';
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
      const collector = new Collector<CollectibleTestThing>({ items: collectibles });
      expect(collector.size).toBe(collectibles.length);
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
      const collector = new Collector<CollectibleTestThing>();
      expect(collector.size).toBe(0);
    });

    test('throws an error if items have duplicate keys', () => {
      const dupes = collectibles.concat(new CollectibleTestThing(things[0], 'thing1', 0));
      expect(() => new Collector<CollectibleTestThing>({ items: dupes })).toThrow();
    });
  });

  describe('createCollector static  method', () => {
    test('can create a collector with no items', () => {
      expect(Collector.createCollector<CollectibleTestThing>()).toSucceedAndSatisfy((collector) => {
        expect(collector.size).toBe(0);
      });
    });

    test('can create a collector with initial items', () => {
      expect(Collector.createCollector<CollectibleTestThing>({ items: collectibles })).toSucceedAndSatisfy(
        (collector) => {
          expect(collector.size).toBe(collectibles.length);
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
        }
      );
    });

    test('fails if entries have duplicate keys', () => {
      const dupes = collectibles.concat(new CollectibleTestThing(things[0], 'thing1', 0));
      expect(Collector.createCollector<CollectibleTestThing>({ items: dupes })).toFailWith(/already exists/);
    });

    test('fails if index for some entry cannot be set', () => {
      collectibles.push(new CollectibleTestThing(things[0], 'thing100', 100));
      expect(Collector.createCollector<CollectibleTestThing>({ items: collectibles })).toFailWith(
        /cannot be changed/
      );
    });
  });

  describe('add', () => {
    test('adds an item to the collector', () => {
      const collector = new Collector<CollectibleTestThing>();
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing');
      expect(collector.add(thing)).toSucceedWith(thing);
      expect(collector.size).toBe(1);
      expect(collector.get(thing.key)).toSucceedWith(thing);
    });

    test('succeeds if an object is added multiple times', () => {
      const collector = new Collector<CollectibleTestThing>();
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing');
      expect(collector.add(thing)).toSucceedWith(thing);
      expect(collector.add(thing)).toSucceedWith(thing);
      expect(collector.size).toBe(1);
      expect(collector.get(thing.key)).toSucceedWith(thing);
    });

    test('fails if the item key is already in the collector with a different object', () => {
      const collector = new Collector<CollectibleTestThing>({ items: collectibles });
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, collectibles[1].key);
      expect(collector.add(thing)).toFailWith(/already exists/);
      expect(collector.size).toBe(collectibles.length);
      expect(collector.get(thing.key)).toSucceedAndSatisfy((c) => {
        expect(c).not.toBe(thing);
        expect(c).toBe(collectibles[1]);
      });
    });

    test('fails if the item index cannot be changed', () => {
      const collector = new Collector<CollectibleTestThing>();
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing', 5);
      expect(collector.add(thing)).toFailWith(/cannot be changed/);
      expect(collector.size).toBe(0);
    });
  });

  describe('get', () => {
    test('returns an item with a valid key', () => {
      const collector = new Collector<CollectibleTestThing>({ items: collectibles });
      collectibles.forEach((c) => {
        expect(collector.get(c.key)).toSucceedWith(c);
      });
    });

    test('fails if the key is not in the collector', () => {
      const collector = new Collector<CollectibleTestThing>({ items: collectibles });
      expect(collector.get('not-a-key')).toFailWith(/not found/);
    });
  });

  describe('getAt', () => {
    describe('with valid number indices', () => {
      test('returns an item at a valid index', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        collectibles.forEach((c, i) => {
          expect(collector.getAt(i)).toSucceedWith(c);
        });
      });

      test('returns item at index 0', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(0)).toSucceedWith(collectibles[0]);
      });

      test('returns item at last valid index', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        const lastIndex = collectibles.length - 1;
        expect(collector.getAt(lastIndex)).toSucceedWith(collectibles[lastIndex]);
      });

      test('handles floating point numbers that are valid integers', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(1.0)).toSucceedWith(collectibles[1]);
        expect(collector.getAt(2.0)).toSucceedWith(collectibles[2]);
      });
    });

    describe('with invalid number indices', () => {
      test('fails if the index is less than 0', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(-1)).toFailWith(/out of range/);
        expect(collector.getAt(-5)).toFailWith(/out of range/);
        expect(collector.getAt(-100)).toFailWith(/out of range/);
      });

      test('fails if the index is greater than or equal to the number of items', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(collectibles.length)).toFailWith(/out of range/);
        expect(collector.getAt(collectibles.length + 1)).toFailWith(/out of range/);
        expect(collector.getAt(100)).toFailWith(/out of range/);
      });

      test('fails with floating point numbers that are not integers', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(1.5)).toFailWith(/collector index must be a finite integer/);
        expect(collector.getAt(2.7)).toFailWith(/collector index must be a finite integer/);
        expect(collector.getAt(-0.5)).toFailWith(/collector index must be a finite integer/);
      });

      test('fails with NaN', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(NaN)).toFailWith(/collector index must be a finite integer/);
      });

      test('fails with Infinity', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(Infinity)).toFailWith(/collector index must be a finite integer/);
        expect(collector.getAt(-Infinity)).toFailWith(/collector index must be a finite integer/);
      });

      test('fails with very large numbers', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(Number.MAX_SAFE_INTEGER)).toFailWith(/out of range/);
        expect(collector.getAt(Number.MAX_VALUE)).toFailWith(/out of range/); // MAX_VALUE is an integer but out of range
      });

      test('fails with numbers in scientific notation', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(1e10)).toFailWith(/out of range/); // Valid integer but out of range
        expect(collector.getAt(1e-1)).toFailWith(/collector index must be a finite integer/); // 0.1 is not an integer
      });
    });

    describe('with non-number inputs', () => {
      test('fails with string inputs', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt('0' as unknown as number)).toFailWith(/collector index must be a number/);
        expect(collector.getAt('1' as unknown as number)).toFailWith(/collector index must be a number/);
        expect(collector.getAt('invalid' as unknown as number)).toFailWith(
          /collector index must be a number/
        );
        expect(collector.getAt('' as unknown as number)).toFailWith(/collector index must be a number/);
      });

      test('fails with null and undefined', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(null as unknown as number)).toFailWith(/collector index must be a number/);
        expect(collector.getAt(undefined as unknown as number)).toFailWith(
          /collector index must be a number/
        );
      });

      test('fails with boolean inputs', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(true as unknown as number)).toFailWith(/collector index must be a number/);
        expect(collector.getAt(false as unknown as number)).toFailWith(/collector index must be a number/);
      });

      test('fails with object inputs', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt({} as unknown as number)).toFailWith(/collector index must be a number/);
        expect(collector.getAt({ index: 0 } as unknown as number)).toFailWith(
          /collector index must be a number/
        );
        expect(collector.getAt([] as unknown as number)).toFailWith(/collector index must be a number/);
        expect(collector.getAt([0] as unknown as number)).toFailWith(/collector index must be a number/);
      });

      test('fails with function inputs', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt((() => 0) as unknown as number)).toFailWith(
          /collector index must be a number/
        );
      });

      test('fails with symbol inputs', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(Symbol('test') as unknown as number)).toFailWith(
          /collector index must be a number/
        );
      });

      test('fails with Date inputs', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(new Date() as unknown as number)).toFailWith(
          /collector index must be a number/
        );
      });
    });

    describe('error message format', () => {
      test('provides descriptive error message for non-number inputs', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt('test' as unknown as number)).toFailWith(
          'test: collector index must be a number.'
        );
        expect(collector.getAt(null as unknown as number)).toFailWith(
          'null: collector index must be a number.'
        );
        expect(collector.getAt(undefined as unknown as number)).toFailWith(
          'undefined: collector index must be a number.'
        );
      });

      test('provides descriptive error message for invalid numeric inputs', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(1.5)).toFailWith('1.5: collector index must be a finite integer.');
        expect(collector.getAt(NaN)).toFailWith('NaN: collector index must be a finite integer.');
        expect(collector.getAt(Infinity)).toFailWith('Infinity: collector index must be a finite integer.');
        expect(collector.getAt(-Infinity)).toFailWith('-Infinity: collector index must be a finite integer.');
      });

      test('provides descriptive error message for out of range indices', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        expect(collector.getAt(-1)).toFailWith('-1: collector index out of range.');
        expect(collector.getAt(collectibles.length)).toFailWith(
          `${collectibles.length}: collector index out of range.`
        );
        expect(collector.getAt(100)).toFailWith('100: collector index out of range.');
      });
    });

    describe('behavior preservation', () => {
      test('maintains original success behavior for valid indices', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });

        // Test that all previously working cases still work
        for (let i = 0; i < collectibles.length; i++) {
          const result = collector.getAt(i);
          expect(result).toSucceed();
          expect(result.value).toBe(collectibles[i]);
        }
      });

      test('maintains original failure behavior for invalid numeric indices', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });

        // Test boundary conditions still fail appropriately
        expect(collector.getAt(-1)).toFail();
        expect(collector.getAt(collectibles.length)).toFail();

        // Edge case: empty collector
        const emptyCollector = new Collector<CollectibleTestThing>();
        expect(emptyCollector.getAt(0)).toFailWith(/out of range/);
      });

      test('works correctly with empty collector', () => {
        const emptyCollector = new Collector<CollectibleTestThing>();

        // Valid number indices should fail with out of range
        expect(emptyCollector.getAt(0)).toFailWith(/out of range/);
        expect(emptyCollector.getAt(1)).toFailWith(/out of range/);

        // Non-number inputs should fail with type error
        expect(emptyCollector.getAt('0' as unknown as number)).toFailWith(/collector index must be a number/);
      });

      test('works correctly with single item collector', () => {
        const singleCollector = new Collector<CollectibleTestThing>({ items: [collectibles[0]] });

        // Valid index
        expect(singleCollector.getAt(0)).toSucceedWith(collectibles[0]);

        // Out of range
        expect(singleCollector.getAt(1)).toFailWith(/out of range/);
        expect(singleCollector.getAt(-1)).toFailWith(/out of range/);

        // Non-number
        expect(singleCollector.getAt('0' as unknown as number)).toFailWith(
          /collector index must be a number/
        );
      });
    });
  });

  describe('valuesByIndex', () => {
    describe('with empty collection', () => {
      test('returns empty readonly array', () => {
        const collector = new Collector<CollectibleTestThing>();
        const values = collector.valuesByIndex();

        expect(values).toEqual([]);
        expect(values.length).toBe(0);
        expect(Array.isArray(values)).toBe(true);
      });

      test('returned array is readonly type', () => {
        const collector = new Collector<CollectibleTestThing>();
        const values = collector.valuesByIndex();

        // TypeScript should prevent mutation through ReadonlyArray type
        // At runtime, it's still a regular array but the type system enforces readonly
        expect(Array.isArray(values)).toBe(true);
        expect(values.length).toBe(0);

        // Verify it has array methods but readonly contract
        expect(typeof values.forEach).toBe('function');
        expect(typeof values.map).toBe('function');
      });
    });

    describe('with single item collection', () => {
      test('returns array with one item', () => {
        const collector = new Collector<CollectibleTestThing>({ items: [collectibles[0]] });
        const values = collector.valuesByIndex();

        expect(values.length).toBe(1);
        expect(values[0]).toBe(collectibles[0]);
        expect(values).toEqual([collectibles[0]]);
      });

      test('maintains consistency with getAt and size', () => {
        const collector = new Collector<CollectibleTestThing>({ items: [collectibles[0]] });
        const values = collector.valuesByIndex();

        expect(values.length).toBe(collector.size);
        expect(collector.getAt(0)).toSucceedWith(values[0]);
      });
    });

    describe('with multiple items collection', () => {
      test('returns all items in index order', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        const values = collector.valuesByIndex();

        expect(values.length).toBe(collectibles.length);
        expect(values).toEqual(collectibles);

        // Verify each item is in correct position
        collectibles.forEach((item, index) => {
          expect(values[index]).toBe(item);
        });
      });

      test('maintains index order consistency', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        const values = collector.valuesByIndex();

        // Every item from valuesByIndex should match getAt(index)
        for (let i = 0; i < values.length; i++) {
          expect(collector.getAt(i)).toSucceedWith(values[i]);
        }
      });

      test('maintains size consistency', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        const values = collector.valuesByIndex();

        expect(values.length).toBe(collector.size);
        expect(values.length).toBe(collectibles.length);
      });

      test('preserves item order from construction', () => {
        // Use items with different keys to avoid conflicts
        const item1 = new CollectibleTestThing({ str: 'first', num: 1, bool: true }, 'custom1');
        const item2 = new CollectibleTestThing({ str: 'second', num: 2, bool: false }, 'custom2');
        const item3 = new CollectibleTestThing({ str: 'third', num: 3, bool: true }, 'custom3');
        const customOrder = [item1, item2, item3];

        const collector = new Collector<CollectibleTestThing>({ items: customOrder });
        const values = collector.valuesByIndex();

        expect(values).toEqual(customOrder);
        expect(values[0]).toBe(item1); // First added
        expect(values[1]).toBe(item2); // Second added
        expect(values[2]).toBe(item3); // Third added
      });
    });

    describe('array properties and behavior', () => {
      test('returns ReadonlyArray type', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        const values = collector.valuesByIndex();

        // Should be an array but readonly
        expect(Array.isArray(values)).toBe(true);
        expect(values.length).toBeDefined();
        expect(typeof values.forEach).toBe('function');
      });

      test('array contents match internal state', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });
        const values1 = collector.valuesByIndex();
        const values2 = collector.valuesByIndex();

        // Should return consistent results
        expect(values1).toEqual(values2);
        expect(values1.length).toBe(values2.length);

        // Items should be same references
        for (let i = 0; i < values1.length; i++) {
          expect(values1[i]).toBe(values2[i]);
        }
      });

      test('reflects collection state after construction', () => {
        // Start with subset
        const subset = collectibles.slice(0, 2);
        const collector = new Collector<CollectibleTestThing>({ items: subset });
        const values = collector.valuesByIndex();

        expect(values.length).toBe(2);
        expect(values).toEqual(subset);
        expect(values[0]).toBe(subset[0]);
        expect(values[1]).toBe(subset[1]);
      });
    });

    describe('edge cases', () => {
      test('handles empty collection after failed construction', () => {
        // Test edge case: collector that fails to add items due to conflicts
        const collector = new Collector<CollectibleTestThing>();
        const values = collector.valuesByIndex();

        // Should handle empty state gracefully
        expect(values.length).toBe(0);
        expect(Array.isArray(values)).toBe(true);
        expect(values).toEqual([]);
      });

      test('consistent behavior across multiple calls', () => {
        const collector = new Collector<CollectibleTestThing>({ items: collectibles });

        // Multiple calls should return equivalent arrays
        const call1 = collector.valuesByIndex();
        const call2 = collector.valuesByIndex();
        const call3 = collector.valuesByIndex();

        expect(call1).toEqual(call2);
        expect(call2).toEqual(call3);
        expect(call1.length).toBe(call2.length);
        expect(call2.length).toBe(call3.length);
      });
    });
  });

  describe('getOrAdd', () => {
    test('adds a new item to the collector', () => {
      const collector = new Collector<CollectibleTestThing>();
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'thing0');
      expect(collector.getOrAdd(thing)).toSucceedWith(thing);
      expect(collector.size).toBe(1);
      expect(collector.get(thing.key)).toSucceedWith(thing);
    });

    test('adds a new item to the collector with a factory', () => {
      const collector = new Collector<CollectibleTestThing>();
      const thing = { str: 'new', num: 6, bool: false };
      expect(
        collector.getOrAdd('thing0', () => CollectibleTestThing.create(thing, 'thing0'))
      ).toSucceedAndSatisfy((c) => {
        expect(c.str).toBe(thing.str);
        expect(c.num).toBe(thing.num);
        expect(c.bool).toBe(thing.bool);
        expect(c.key).toBe('thing0');
      });
      expect(collector.size).toBe(1);
      expect(collector.get('thing0')).toSucceedAndSatisfy((c) => {
        expect(c.str).toBe(thing.str);
        expect(c.num).toBe(thing.num);
        expect(c.bool).toBe(thing.bool);
        expect(c.key).toBe('thing0');
      });
    });

    test('fails if the factory fails', () => {
      const collector = new Collector<CollectibleTestThing>();
      expect(collector.getOrAdd('thing0', () => fail('factory failed'))).toFailWith(/factory failed/);
      expect(collector.size).toBe(0);
    });

    test('returns an existing item if it is already in the collector', () => {
      const collector = new Collector<CollectibleTestThing>({ items: collectibles });
      const newThing = new CollectibleTestThing(things[2], collectibles[1].key, 10);
      expect(collector.getOrAdd(newThing)).toSucceedWithDetail(collectibles[1], 'exists');
      expect(collector.size).toBe(collectibles.length);
      expect(collector.get(newThing.key)).toSucceedWith(collectibles[1]);
    });

    test('does not invoke the factory if the key is already in the collector', () => {
      const collector = new Collector<CollectibleTestThing>({ items: collectibles });
      const newThing = new CollectibleTestThing(things[2], collectibles[1].key, 10);
      expect(collector.getOrAdd(newThing.key, () => fail('factory called'))).toSucceedWithDetail(
        collectibles[1],
        'exists'
      );
      expect(collector.size).toBe(collectibles.length);
      expect(collector.get(newThing.key)).toSucceedWith(collectibles[1]);
    });

    test('fails without adding if the item index cannot be set', () => {
      const collector = new Collector<CollectibleTestThing>();
      const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'thing0', 5);
      expect(collector.getOrAdd(thing)).toFailWithDetail(/cannot be changed/, 'invalid-index');
      expect(collector.size).toBe(0);
    });

    test('does not check index of item to be added if key is already in collector', () => {
      const collector = new Collector<CollectibleTestThing>({ items: collectibles });
      const newThing = new CollectibleTestThing(things[2], collectibles[1].key, 10);
      expect(collector.getOrAdd(newThing)).toSucceedWithDetail(collectibles[1], 'exists');
      expect(collector.size).toBe(collectibles.length);
      expect(collector.get(newThing.key)).toSucceedWith(collectibles[1]);
    });
  });

  describe('toReadOnly', () => {
    test('returns a readonly map of the collector', () => {
      const collector = new Collector<CollectibleTestThing>({ items: collectibles });
      const map: IReadOnlyCollector<CollectibleTestThing> = collector.toReadOnly();
      expect(map.size).toBe(collectibles.length);
      for (const c of collectibles) {
        expect(map.has(c.key)).toBe(true);
        expect(map.get(c.key)).toSucceedWith(c);
      }
    });
  });
});
