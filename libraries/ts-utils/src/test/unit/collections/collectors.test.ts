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
import { Collectible, SimpleCollector } from '../../../packlets/collections';
import { Result, succeed } from '../../../packlets/base';

interface ITestThing {
  str?: string;
  num?: number;
  bool?: boolean;
}

class CollectibleTestThing<TKEY extends string = string, TINDEX extends number = number>
  extends Collectible<TKEY, TINDEX>
  implements ITestThing
{
  public str?: string;
  public num?: number;
  public bool?: boolean;

  public constructor(thing: ITestThing, key: TKEY, index?: TINDEX) {
    super(key, index);
    this.str = thing.str;
    this.num = thing.num;
    this.bool = thing.bool;
  }
}

class BrokenCollectibleTestThing<
  TKEY extends string = string,
  TINDEX extends number = number
> extends CollectibleTestThing<TKEY, TINDEX> {
  public constructor(thing: ITestThing, key: TKEY, index?: TINDEX) {
    super(thing, key, index ? ((index + 1) as TINDEX) : undefined);
  }

  public setIndex(index: TINDEX): Result<TINDEX> {
    this._index = (index + 1) as TINDEX;
    return succeed(this.index!);
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
        for (const c of collectibles) {
          // index should have been set when it was added
          expect(c.index).toBeDefined();
          expect(collector.has(c.key)).toBe(true);
          expect(collector.get(c.key)).toSucceedWith(c);
          expect(collector.getAt(c.index!)).toSucceedWith(c);
        }
      });

      test('can be constructed with no items', () => {
        const collector = new SimpleCollector<CollectibleTestThing>();
        expect(collector.size).toBe(0);
      });
    });

    describe('createSimpleCollector', () => {
      test('succeeds with initial items', () => {
        expect(SimpleCollector.createSimpleCollector({ items: collectibles })).toSucceedAndSatisfy<
          SimpleCollector<CollectibleTestThing>
        >((collector) => {
          expect(collector.size).toBe(5);
          for (const c of collectibles) {
            // index should have been set when it was added
            expect(c.index).toBeDefined();
            expect(collector.has(c.key)).toBe(true);
            expect(collector.get(c.key)).toSucceedWith(c);
            expect(collector.getAt(c.index!)).toSucceedWith(c);
          }
        });
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
});
