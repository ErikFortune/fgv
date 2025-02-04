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

import { fail, succeed } from '../../../packlets/base';
import {
  KeyValueConverters,
  IValidatingCollectorConstructorParams,
  ValidatingCollector
} from '../../../packlets/collections';
import '../../helpers/jest';
import {
  BrandedCollectibleTestThing,
  getBrandedTestThings,
  ITestThing,
  testThingKey,
  TestThingKey
} from './helpers';

const testCollectorParams: IValidatingCollectorConstructorParams<BrandedCollectibleTestThing> = {
  converters: new KeyValueConverters<TestThingKey, BrandedCollectibleTestThing>({
    key: testThingKey,
    value: (thing) => {
      if (thing instanceof BrandedCollectibleTestThing) {
        return succeed(thing);
      }
      return fail('not a branded collectible test thing');
    }
  })
};

describe('ValidatingCollector', () => {
  let things: ITestThing[];
  let collectibles: BrandedCollectibleTestThing[];

  beforeEach(() => {
    const td = getBrandedTestThings();
    things = td.things;
    collectibles = td.collectibles;
  });

  describe('constructor', () => {
    test('constructs a new ValidatingCollector with no initial items', () => {
      const collector = new ValidatingCollector(testCollectorParams);
      expect(collector.size).toBe(0);
    });

    test('constructs a new validating collector with initial items', () => {
      const collector = new ValidatingCollector({
        ...testCollectorParams,
        items: collectibles
      });
      expect(collector.size).toBe(collectibles.length);
      expect(collector.validating.map.size).toBe(collectibles.length);
      expect(Array.from(collector.entries())).toEqual(collectibles.map((c) => [c.key, c]));
      expect(Array.from(collector.keys())).toEqual(collectibles.map((c) => c.key));
      expect(Array.from(collector.values())).toEqual(collectibles);
    });

    test('throws an error if the items are not all valid', () => {
      const items = [...collectibles, { key: 'thing99', index: 99 }];
      expect(
        () =>
          new ValidatingCollector({
            ...testCollectorParams,
            items
          })
      ).toThrow(/not a branded collectible test thing/);
    });
  });

  describe('createValidatingCollector static method', () => {
    test('creates a new ValidatingCollector with no initial items', () => {
      expect(ValidatingCollector.createValidatingCollector(testCollectorParams)).toSucceedAndSatisfy(
        (collector) => {
          expect(collector.size).toBe(0);
        }
      );
    });

    test('creates a new validating collector with initial items', () => {
      expect(
        ValidatingCollector.createValidatingCollector({
          ...testCollectorParams,
          items: collectibles
        })
      ).toSucceedAndSatisfy((collector) => {
        expect(collector.size).toBe(collectibles.length);
      });
    });

    test('fails if the items are not all valid', () => {
      collectibles.push(BrandedCollectibleTestThing.create({}, 'thing99', 99).orThrow());
      expect(
        ValidatingCollector.createValidatingCollector({
          ...testCollectorParams,
          items: collectibles
        })
      ).toFailWith(/cannot be changed/);
    });
  });

  describe('validating methods', () => {
    describe('add method', () => {
      test('adds a valid new item to the collector', () => {
        const collector = new ValidatingCollector(testCollectorParams);
        const thing = BrandedCollectibleTestThing.create(things[0], 'thing0', 0).orThrow();
        expect(collector.validating.add(thing)).toSucceedWithDetail(thing, 'added');
        expect(collector.size).toBe(1);
      });

      test('fails if the item is not valid', () => {
        const collector = new ValidatingCollector(testCollectorParams);
        const thing = { key: 'thing0', index: 0 };
        expect(collector.validating.add(thing)).toFailWithDetail(
          /not a branded collectible test thing/,
          'invalid-value'
        );
        expect(collector.size).toBe(0);
      });

      test('fails if the item with the same key is already in the collector', () => {
        const collector = new ValidatingCollector({
          ...testCollectorParams,
          items: collectibles
        });
        const thing = BrandedCollectibleTestThing.create(things[0], 'thing0', 0).orThrow();
        expect(collector.validating.add(thing)).toFailWithDetail(/already exists/, 'exists');
        expect(collector.size).toBe(collectibles.length);
      });

      test('succeeds if the item (identity) is already in the collection', () => {
        const collector = new ValidatingCollector({
          ...testCollectorParams,
          items: collectibles
        });
        expect(collector.validating.add(collectibles[0])).toSucceedWithDetail(collectibles[0], 'exists');
        expect(collector.size).toBe(collectibles.length);
      });
    });

    describe('get method', () => {
      test('gets an item from the collector', () => {
        const collector = new ValidatingCollector({
          ...testCollectorParams,
          items: collectibles
        });
        expect(collector.validating.get('thing2')).toSucceedWith(collectibles[2]);
      });

      test('fails with detail invalid-key if the key is not valid', () => {
        const collector = new ValidatingCollector(testCollectorParams);
        expect(collector.validating.get('thingamajig1')).toFailWithDetail(/not a valid/, 'invalid-key');
      });

      test('fails with detail not-found if the key is not in the collector', () => {
        const collector = new ValidatingCollector({
          ...testCollectorParams,
          items: collectibles
        });
        expect(collector.validating.get('thing11')).toFailWithDetail(/not found/, 'not-found');
      });
    });

    describe('getOrAdd method', () => {
      describe('with an item', () => {
        test('gets an existing item with the same key without adding it and without comparing items', () => {
          const collector = new ValidatingCollector({
            ...testCollectorParams,
            items: collectibles
          });
          const item = BrandedCollectibleTestThing.create(things[4], 'thing2', 2).orThrow();
          const result = collector.validating.getOrAdd(item);
          expect(result).toSucceedWithDetail(collectibles[2], 'exists');
          expect(result).toSucceedAndSatisfy((got) => {
            expect(got).toBe(collectibles[2]);
            expect(got).not.toBe(item);
            expect(collector.size).toBe(collectibles.length);
          });
        });

        test('adds a new item to the collector if no item with the same key exists', () => {
          const collector = new ValidatingCollector(testCollectorParams);
          const thing = BrandedCollectibleTestThing.create(things[0], 'thing0', 0).orThrow();
          expect(collector.validating.getOrAdd(thing)).toSucceedWithDetail(thing, 'added');
          expect(collector.size).toBe(1);
        });

        test('fails with detail invalid-value if the item is not valid', () => {
          const collector = new ValidatingCollector(testCollectorParams);
          const thing = { key: 'thing0', index: 0 };
          expect(collector.validating.getOrAdd(thing)).toFailWithDetail(
            /not a branded collectible test thing/,
            'invalid-value'
          );
          expect(collector.size).toBe(0);
        });
      });

      describe('with a factory method', () => {
        test('gets an existing item without invoking the factory', () => {
          const collector = new ValidatingCollector({
            ...testCollectorParams,
            items: collectibles
          });
          expect(collector.validating.getOrAdd('thing2', () => fail('should not be called'))).toSucceedWith(
            collectibles[2]
          );
        });

        test('calls the factory and adds the item if no item with a matching key exists', () => {
          const collector = new ValidatingCollector(testCollectorParams);
          const thing = BrandedCollectibleTestThing.create(things[0], 'thing0', 0).orThrow();
          expect(collector.validating.getOrAdd('thing0', () => succeed(thing))).toSucceedWithDetail(
            thing,
            'added'
          );
          expect(collector.size).toBe(1);
        });

        test('fails with detail invalid-key and without invoking the factory if the key is not valid', () => {
          const collector = new ValidatingCollector(testCollectorParams);
          expect(
            collector.validating.getOrAdd('thingamajig1', () => fail('should not be called'))
          ).toFailWithDetail(/not a valid/, 'invalid-key');
        });

        test('fails with detail invalid-value if the factory fails', () => {
          const collector = new ValidatingCollector(testCollectorParams);
          expect(collector.validating.getOrAdd('thing0', () => fail('factory failed'))).toFailWithDetail(
            /factory failed/,
            'invalid-value'
          );
        });
      });
    });

    describe('has method', () => {
      test('returns true if the key is in the collector', () => {
        const collector = new ValidatingCollector({
          ...testCollectorParams,
          items: collectibles
        });
        expect(collector.validating.has('thing2')).toBe(true);
      });

      test('returns false if the key is not in the collector', () => {
        const collector = new ValidatingCollector({
          ...testCollectorParams,
          items: collectibles
        });
        expect(collector.validating.has('thing11')).toBe(false);
      });

      test('returns false if the key is not valid', () => {
        const collector = new ValidatingCollector(testCollectorParams);
        expect(collector.validating.has('thingamajig1')).toBe(false);
      });
    });
  });
  describe('toReadOnly method', () => {
    test('returns the collector as a read-only map', () => {
      const collector = new ValidatingCollector({
        ...testCollectorParams,
        items: collectibles
      });
      const readOnly = collector.toReadOnly();
      expect(readOnly.size).toBe(collectibles.length);
      expect(Array.from(readOnly.entries())).toEqual(collectibles.map((c) => [c.key, c]));
      expect(Array.from(readOnly.keys())).toEqual(collectibles.map((c) => c.key));
      expect(Array.from(readOnly.values())).toEqual(collectibles);
    });

    test('validating.toReadOnly returns a read-only validator', () => {
      const collector = new ValidatingCollector({
        ...testCollectorParams,
        items: collectibles
      });
      const readOnly = collector.validating.toReadOnly();
      expect(readOnly.get('thing1')).toSucceedWith(collectibles[1]);
    });
  });
});
