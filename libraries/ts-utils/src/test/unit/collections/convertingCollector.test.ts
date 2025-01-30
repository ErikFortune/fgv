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

import { Brand, Result, fail, succeed } from '../../../packlets/base';
import {
  Collectible,
  CollectibleFactoryCallback,
  ConvertingCollector,
  IConvertingCollectorConstructorParams,
  KeyValueConverters
} from '../../../packlets/collections';
import { Converters } from '../../../packlets/conversion';
import '../../helpers/jest';

interface ITestThing {
  str?: string;
  num?: number;
  bool?: boolean;
}

type TestKey = Brand<string, 'TestKey'>;
type TestIndex = Brand<number, 'TestIndex'>;

const testKey = Converters.string
  .withConstraint((s) => /^thing[0-9]+$/.test(s))
  .withFormattedError((val: unknown) => `${val} is not a valid test thing key`)
  .withBrand('TestKey');
const testThing = Converters.strictObject<ITestThing>({
  str: Converters.string.optional(),
  num: Converters.number.optional(),
  bool: Converters.boolean.optional()
});
const testEntry = Converters.generic<[TestKey, ITestThing]>(
  (from: unknown): Result<[TestKey, ITestThing]> => {
    if (!Array.isArray(from) || from.length !== 2) {
      return fail('Invalid entry');
    }
    return testKey.convert(from[0]).onSuccess((key) => {
      return testThing.convert(from[1]).onSuccess((value) => {
        if (key === value.str) {
          return fail('key cannot be same as string property for no real reason');
        }
        return succeed([key, value]);
      });
    });
  }
);

class CollectibleTestThing extends Collectible<TestKey, TestIndex> implements ITestThing {
  public str?: string;
  public num?: number;
  public bool?: boolean;

  public constructor(thing: ITestThing, key: TestKey, index?: TestIndex) {
    super(key, index);
    this.str = thing.str;
    this.num = thing.num;
    this.bool = thing.bool;
  }
}

function _collectibleTestThingFactory(
  key: TestKey,
  index: number,
  item: ITestThing
): Result<CollectibleTestThing> {
  return succeed(new CollectibleTestThing(item, key, index as TestIndex));
}

export const testCollectorParams: IConvertingCollectorConstructorParams<
  TestKey,
  TestIndex,
  CollectibleTestThing,
  ITestThing
> = {
  factory: _collectibleTestThingFactory,
  converters: new KeyValueConverters<TestKey, ITestThing>({
    key: testKey,
    value: testThing
  })
};

export const entryValidatingTestCollectorParams: IConvertingCollectorConstructorParams<
  TestKey,
  TestIndex,
  CollectibleTestThing,
  ITestThing
> = {
  factory: _collectibleTestThingFactory,
  converters: new KeyValueConverters<TestKey, ITestThing>({
    key: testKey,
    value: testThing,
    entry: testEntry
  })
};

describe('ConvertingCollector', () => {
  let entries: [TestKey, ITestThing][];
  let things: ITestThing[];
  let collectibles: CollectibleTestThing[];

  beforeEach(() => {
    things = [
      { str: 'one', num: 1, bool: true },
      { str: 'two', num: 2, bool: false },
      { str: 'three', num: 3, bool: true },
      { str: 'four', num: 4, bool: false },
      { str: 'five', num: 5, bool: true }
    ];
    collectibles = things.map(
      (thing, index) => new CollectibleTestThing(thing, `thing${index + 1}` as TestKey, index as TestIndex)
    );
    entries = things.map((thing, index) => [`thing${index + 1}` as TestKey, thing]);
  });

  describe('constructor', () => {
    test('can be constructed with initial items', () => {
      const collector = new ConvertingCollector({ ...testCollectorParams, entries });
      expect(collector.size).toEqual(5);
      expect(collector.inner.size).toEqual(5);
      expect(collector.converting.map.size).toEqual(5);
      things.forEach((thing, i) => {
        expect(collector.converting.get(`thing${i + 1}`)).toSucceedAndSatisfy((collectible) => {
          expect(collectible.key).toEqual(`thing${i + 1}` as TestKey);
          expect(collectible.index).toEqual(i);
          expect(collectible.bool).toEqual(things[i].bool);
          expect(collectible.num).toEqual(things[i].num);
          expect(collectible.str).toEqual(things[i].str);
        });
      });
      expect(Array.from(collector.keys())).toEqual(['thing1', 'thing2', 'thing3', 'thing4', 'thing5']);
      expect(Array.from(collector.values())).toEqual(collectibles);
      expect(Array.from(collector.entries())).toEqual(
        collectibles.map((thing, i): [TestKey, CollectibleTestThing] => [`thing${i + 1}` as TestKey, thing])
      );
      for (const [key, thing] of collector) {
        expect(thing).toEqual(collectibles.find((c) => c.key === key));
      }
    });

    test('can be constructed with no initial items', () => {
      const collector = new ConvertingCollector(testCollectorParams);
      expect(collector.size).toEqual(0);
      expect(collector.inner.size).toEqual(0);
      expect(Array.from(collector.keys())).toEqual([]);
      expect(Array.from(collector.values())).toEqual([]);
      expect(Array.from(collector.entries())).toEqual([]);
    });
  });

  describe('createConvertingCollector static method', () => {
    test('can create a new ConvertingCollector', () => {
      const collector = ConvertingCollector.createConvertingCollector(testCollectorParams);
      expect(collector).toSucceedAndSatisfy((c) => {
        expect(c.size).toEqual(0);
      });
    });

    test('can create a new ConvertingCollector with initial items', () => {
      const collector = ConvertingCollector.createConvertingCollector({ ...testCollectorParams, entries });
      expect(collector).toSucceedAndSatisfy((c) => {
        expect(c.size).toEqual(5);
        expect(c.inner.size).toEqual(5);
        things.forEach((thing, i) => {
          expect(c.converting.has(`thing${i + 1}`)).toBe(true);
          expect(c.converting.get(`thing${i + 1}`)).toSucceedAndSatisfy((collectible) => {
            expect(collectible.key).toEqual(`thing${i + 1}` as TestKey);
            expect(collectible.index).toEqual(i);
            expect(collectible.bool).toEqual(things[i].bool);
            expect(collectible.num).toEqual(things[i].num);
            expect(collectible.str).toEqual(things[i].str);
          });
        });
        expect(Array.from(c.keys())).toEqual(['thing1', 'thing2', 'thing3', 'thing4', 'thing5']);
        expect(Array.from(c.values())).toEqual(collectibles);
        expect(Array.from(c.entries())).toEqual(
          collectibles.map((thing, i): [TestKey, CollectibleTestThing] => [`thing${i + 1}` as TestKey, thing])
        );
        for (const [key, thing] of c) {
          expect(thing).toEqual(collectibles.find((c) => c.key === key));
        }
      });
    });

    test('fails if the supplied entries are invalid', () => {
      const collector = ConvertingCollector.createConvertingCollector({
        ...entryValidatingTestCollectorParams,
        entries: [
          // bogus entryValidatingTestCollector rejects an entry if the
          // key matches the `str` property
          ['thing1' as TestKey, { str: 'thing1', num: 1, bool: true }]
        ]
      });
      expect(collector).toFailWith(/key cannot be same as string property/);
    });
  });

  describe('converting', () => {
    test('retrieves from the underlying collector', () => {
      const collector = new ConvertingCollector({ ...testCollectorParams, entries });
      const thing = collector.converting.get('thing3');
      expect(thing).toSucceedWith(collectibles[2]);
    });

    describe('getOrAdd', () => {
      test('adds a new item to the underlying collector', () => {
        const collector = new ConvertingCollector(testCollectorParams);
        const thing: ITestThing = { str: 'six', num: 6, bool: false };
        const collectible = new CollectibleTestThing(thing, 'thing6' as TestKey, 0 as TestIndex);
        expect(collector.get(collectible.key)).toFailWith(/not found/);
        expect(collector.converting.get('thing6')).toFailWith(/not found/);
        expect(collector.converting.getOrAdd('thing6', thing)).toSucceedWith(collectible);
        expect(collector.get(collectible.key)).toSucceedWith(collectible);
      });

      test('returns an existing item from the collector', () => {
        const collector = new ConvertingCollector({ ...testCollectorParams, entries });
        const thing: ITestThing = { str: 'three', num: 300, bool: true };
        const existing = collector.converting.get('thing3').orThrow();
        expect(existing).toEqual(collectibles[2]);
        expect(collector.converting.getOrAdd('thing3', thing)).toSucceedAndSatisfy((got) => {
          expect(got).toBe(existing);
        });
      });

      test('uses a factory to create a new item if not already in the collector', () => {
        const collector = new ConvertingCollector(testCollectorParams);
        const thing: ITestThing = { str: 'six', num: 6, bool: false };
        const factory: CollectibleFactoryCallback<TestKey, TestIndex, CollectibleTestThing> = jest.fn(
          (key, index) => succeed(new CollectibleTestThing(thing, key, index as TestIndex))
        );
        const collectible = new CollectibleTestThing(thing, 'thing6' as TestKey, 0 as TestIndex);
        expect(collector.converting.get('thing6')).toFailWith(/not found/);
        expect(collector.converting.getOrAdd('thing6', factory)).toSucceedWith(collectible);
        expect(factory).toHaveBeenCalled();
      });

      test('does not call the factory if the item is already in the collector', () => {
        const collector = new ConvertingCollector({ ...testCollectorParams, entries });
        const thing: ITestThing = { str: 'three', num: 300, bool: true };
        const existing = collector.converting.get('thing3').orThrow();
        expect(existing).toEqual(collectibles[2]);
        const factory: CollectibleFactoryCallback<TestKey, TestIndex, CollectibleTestThing> = jest.fn(
          (key, index) => succeed(new CollectibleTestThing(thing, key, index as TestIndex))
        );
        expect(collector.converting.getOrAdd('thing3', factory)).toSucceedWith(existing);
        expect(factory).not.toHaveBeenCalled();
      });

      test('applies entry validation if supplied', () => {
        const collector = new ConvertingCollector(entryValidatingTestCollectorParams);
        const thing: ITestThing = { str: 'thing1', num: 1, bool: true };
        expect(collector.converting.getOrAdd('thing1', thing)).toFailWith(
          /key cannot be same as string property/i
        );
      });

      test('fails with detail invalid-value if the factory fails', () => {
        const collector = new ConvertingCollector(testCollectorParams);
        const factory: CollectibleFactoryCallback<TestKey, TestIndex, CollectibleTestThing> = jest.fn(
          (key, index) => fail('factory failed')
        );
        expect(collector.converting.getOrAdd('thing6', factory)).toFailWithDetail(
          'factory failed',
          'invalid-value'
        );
      });
    });

    test('validates on all calls that return Result', () => {
      const collector = new ConvertingCollector(entryValidatingTestCollectorParams);
      expect(collector.converting.get('thingamajig1')).toFailWith(/not a valid test thing key/i);
      expect(collector.converting.has('thingamajig1')).toBe(false);
      expect(collector.converting.getOrAdd('thingamajig1', things[0])).toFailWith(
        /not a valid test thing key/i
      );
    });
  });

  describe('base collector', () => {
    test('applies entry validation if entry converter is supplied', () => {
      const collector = new ConvertingCollector(entryValidatingTestCollectorParams);
      const collectible = new CollectibleTestThing({ str: 'thing7' }, 'thing7' as TestKey, 0 as TestIndex);
      expect(collector.has(collectible.key)).toBe(false);
      expect(collector.getOrAdd(collectible.key, { str: 'thing7' })).toFailWith(
        /key cannot be same as string property/i
      );
      expect(collector.has(collectible.key)).toBe(false);
    });
  });

  describe('toReadOnly', () => {
    test('returns the collector as a read-only map', () => {
      const collector = new ConvertingCollector({ ...testCollectorParams, entries });
      const readOnly = collector.toReadOnly();
      expect(readOnly).toBeDefined();
      expect(readOnly.size).toEqual(5);
      expect(readOnly.converting.get('thing3')).toSucceedWith(collectibles[2]);
      expect(readOnly.converting.has('thing6')).toBe(false);
      expect(Array.from(readOnly.keys())).toEqual(['thing1', 'thing2', 'thing3', 'thing4', 'thing5']);
      expect(Array.from(readOnly.values())).toEqual(collectibles);
      expect(Array.from(readOnly.entries())).toEqual(
        collectibles.map((thing, i): [TestKey, CollectibleTestThing] => [`thing${i + 1}` as TestKey, thing])
      );
      for (const [key, thing] of readOnly) {
        expect(thing).toEqual(collectibles.find((c) => c.key === key));
      }

      const roConverters = collector.converting.toReadOnly();
      expect(roConverters.get('thing1')).toSucceedWith(collectibles[0]);
    });
  });
});
