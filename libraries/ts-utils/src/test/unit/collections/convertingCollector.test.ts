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

import { Brand, Result, succeed } from '../../../packlets/base';
import {
  Collectible,
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

const testKey = Converters.string.withConstraint((s) => s.startsWith('thing')).withBrand('TestKey');
const testIndex = Converters.number.withBrand('TestIndex');
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

class BrokenCollectibleTestThing extends CollectibleTestThing {
  public constructor(thing: ITestThing, key: TestKey, index?: TestIndex) {
    super(thing, key, index ? ((index + 1) as TestIndex) : undefined);
  }

  public setIndex(index: TestIndex): Result<TestIndex> {
    this._index = (index + 1) as TestIndex;
    return succeed(this.index!);
  }
}

class TestCollector extends ConvertingCollector<TestKey, TestIndex, CollectibleTestThing, ITestThing> {
  public constructor(things?: ITestThing[]) {
    const entries = things
      ? {
          entries: things.map((thing, index): [TestKey, ITestThing] => [
            `thing${index + 1}` as TestKey,
            thing
          ])
        }
      : {};
    const params: IConvertingCollectorConstructorParams<
      TestKey,
      TestIndex,
      CollectibleTestThing,
      ITestThing
    > = {
      factory: TestCollector._factory,
      converters: new KeyValueConverters<TestKey, ITestThing>({
        key: testKey,
        value: testThing,
        entry: testEntry
      }),
      ...entries
    };
    super(params);
  }

  protected static _factory(key: TestKey, index: number, item: ITestThing): Result<CollectibleTestThing> {
    return succeed(new CollectibleTestThing(item, key, index as TestIndex));
  }
}

describe('ConvertingCollector', () => {
  let things: ITestThing[];

  beforeEach(() => {
    things = [
      { str: 'one', num: 1, bool: true },
      { str: 'two', num: 2, bool: false },
      { str: 'three', num: 3, bool: true },
      { str: 'four', num: 4, bool: false },
      { str: 'five', num: 5, bool: true }
    ];
  });

  test('can be constructed with initial items', () => {
    const collector = new TestCollector(things);
    expect(collector.size).toEqual(5);
    expect(collector.inner.size).toEqual(5);
    things.forEach((thing, i) => {
      expect(collector.converting.get(`thing${i + 1}`)).toSucceedAndSatisfy((collectible) => {
        expect(collectible.key).toEqual(`thing${i + 1}` as TestKey);
      });
    });
  });
});
