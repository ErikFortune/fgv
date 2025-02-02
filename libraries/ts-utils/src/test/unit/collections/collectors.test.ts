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
import {
  Collectible,
  SimpleCollector,
  CollectibleFactoryCallback,
  Collector,
  ICollectorConstructorParams
} from '../../../packlets/collections';
import { Result, succeed } from '../../../packlets/base';
import { Converters } from '../../../packlets/conversion';

interface ITestThing {
  str?: string;
  num?: number;
  bool?: boolean;
}

class CollectibleTestThing extends Collectible<string, number> implements ITestThing {
  public str?: string;
  public num?: number;
  public bool?: boolean;

  public constructor(thing: ITestThing, key: string, index?: number) {
    super({ key, index, indexConverter: Converters.number });
    this.str = thing.str;
    this.num = thing.num;
    this.bool = thing.bool;
  }
}

class BrokenCollectibleTestThing extends CollectibleTestThing {
  public constructor(thing: ITestThing, key: string, index?: number) {
    super(thing, key, index ? ((index + 1) as number) : undefined);
  }

  public setIndex(index: number): Result<number> {
    this._index = index + 1;
    return succeed(this.index!);
  }
}

class TestCollector extends Collector<string, number, CollectibleTestThing, ITestThing> {
  public constructor(things?: ITestThing[]) {
    const entries = things
      ? { entries: things.map((thing, index): [string, ITestThing] => [`thing${index}`, thing]) }
      : {};
    const params: ICollectorConstructorParams<string, number, CollectibleTestThing, ITestThing> = {
      factory: TestCollector._factory,
      ...entries
    };
    super(params);
  }

  protected static _factory(key: string, index: number, item: ITestThing): Result<CollectibleTestThing> {
    return succeed(new CollectibleTestThing(item, key, index));
  }
}

describe('Collectors', () => {
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
    collectibles = things.map((thing, index) => new CollectibleTestThing(thing, `thing${index}`, index));
  });

  describe('SimpleCollector', () => {
    describe('constructor', () => {
      test('can be constructed with initial items', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        expect(collector.size).toBe(5);
        expect(collector.inner.size).toBe(5);
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
            expect(collector.size).toBe(5);
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
        expect(collector.add(thing.key, thing)).toSucceedWith(thing);
        expect(collector.size).toBe(1);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('adds an item to the collector using a factory function', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing: ITestThing = { str: 'new', num: 6, bool: false };
        const factory: CollectibleFactoryCallback<string, number, CollectibleTestThing> = jest.fn(
          (key, index) => succeed(new CollectibleTestThing(thing, key, index))
        );
        expect(collector.add('newThing', factory)).toSucceedWith(expect.objectContaining(thing));
        expect(factory).toHaveBeenCalledWith('newThing', 0);
        expect(collector.size).toBe(1);
        expect(collector.get('newThing')).toSucceedWith(expect.objectContaining(thing));
      });

      test('fails if the item key is already in the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const thing = collectibles[0];
        expect(collector.add(thing.key, thing)).toFailWith(/already exists/);
        expect(collector.size).toBe(5);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });
    });

    describe('addItem', () => {
      test('adds an item to the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing');
        expect(collector.addItem(thing)).toSucceedWith(thing);
        expect(collector.size).toBe(1);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('fails if the item key is already in the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const thing = collectibles[0];
        expect(collector.addItem(thing)).toFailWith(/already exists/);
        expect(collector.size).toBe(5);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('fails if the item index cannot be changed', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing', 5);
        expect(collector.addItem(thing)).toFailWith(/cannot be changed/);
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
        expect(collector.getOrAdd(thing.key, thing)).toSucceedWith(thing);
        expect(collector.size).toBe(1);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('returns an existing item if it is already in the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const thing = collectibles[0];
        expect(collector.getOrAdd(thing.key, thing)).toSucceedWith(thing);
        expect(collector.size).toBe(5);
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
        expect(collector.size).toBe(5);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('fails if the object to be added has a mismatched key', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'thing');
        expect(collector.getOrAdd('newThing', thing)).toFailWith(/key mismatch/);
      });

      test('fails if the object to be added has an immutable index', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing', 100);
        expect(collector.getOrAdd('newThing', thing)).toFailWith(/immutable/);
      });

      test('fails if the object to be added has a mismatched index', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new BrokenCollectibleTestThing({ str: 'new', num: 6, bool: false }, 'newThing');
        expect(collector.getOrAdd('newThing', thing)).toFailWith(/index mismatch/);
      });
    });

    describe('getOrAddItem', () => {
      test('adds a new item to the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'thing0');
        expect(collector.getOrAddItem(thing)).toSucceedWith(thing);
        expect(collector.size).toBe(1);
        expect(collector.get(thing.key)).toSucceedWith(thing);
      });

      test('returns an existing item if it is already in the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const newThing = new CollectibleTestThing(things[2], 'thing0');
        expect(collector.getOrAddItem(newThing)).toSucceedWithDetail(collectibles[0], 'exists');
        expect(collector.size).toBe(5);
        expect(collector.get(newThing.key)).toSucceedWith(collectibles[0]);
      });

      test('fails without adding if the item index cannot be set', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        const thing = new CollectibleTestThing({ str: 'new', num: 6, bool: false }, 'thing0', 5);
        expect(collector.getOrAddItem(thing)).toFailWithDetail(/cannot be changed/, 'invalid-index');
        expect(collector.size).toBe(0);
      });

      test('does not check index of item to be added if key is already in collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const newThing = new CollectibleTestThing(things[2], 'thing0', 5);
        expect(collector.getOrAddItem(newThing)).toSucceedWithDetail(collectibles[0], 'exists');
        expect(collector.size).toBe(5);
        expect(collector.get(newThing.key)).toSucceedWith(collectibles[0]);
      });
    });

    describe('toReadOnly', () => {
      test('returns a readonly map of the collector', () => {
        const collector = new SimpleCollector<CollectibleTestThing>({ items: collectibles });
        const map = collector.toReadOnly();
        expect(map.size).toBe(5);
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
        expect(collector.size).toBe(5);
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
