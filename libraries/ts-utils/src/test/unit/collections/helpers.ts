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

import { Brand, captureResult, Result, succeed } from '../../../packlets/base';
import {
  Collectible,
  ConvertingCollector,
  IConvertingCollectorConstructorParams
} from '../../../packlets/collections';
import { Converter, Converters } from '../../../packlets/conversion';

export type TestThingKey = Brand<string, 'TestThingKey'>;
export type TestThingIndex = Brand<number, 'TestThingIndex'>;

export const testThingKey: Converter<TestThingKey, unknown> = Converters.string
  .withConstraint((s) => /^thing\d{1,4}$/.test(s))
  .withFormattedError((val: unknown) => `${val} is not a valid TestThingKey`)
  .withBrand('TestThingKey');

export const testThingIndex: Converter<TestThingIndex, unknown> = Converters.number
  .withConstraint((n) => n >= 0)
  .withBrand('TestThingIndex');

export interface ITestThing {
  str?: string;
  num?: number;
  bool?: boolean;
}

export const testThing: Converter<ITestThing, unknown> = Converters.strictObject<ITestThing>({
  str: Converters.string.optional(),
  num: Converters.number.optional(),
  bool: Converters.boolean.optional()
});

export class BrandedCollectibleTestThing
  extends Collectible<TestThingKey, TestThingIndex>
  implements ITestThing
{
  public str?: string;
  public num?: number;
  public bool?: boolean;

  public constructor(thing: ITestThing, key: TestThingKey, index?: TestThingIndex) {
    super({ key, index, indexConverter: testThingIndex });
    this.str = thing.str;
    this.num = thing.num;
    this.bool = thing.bool;
  }

  public static create(thing: ITestThing, key: string, index?: number): Result<BrandedCollectibleTestThing> {
    return testThingKey.convert(key).onSuccess((convertedKey) => {
      return testThingIndex.convert(index).onSuccess((convertedIndex) => {
        return captureResult(() => new BrandedCollectibleTestThing(thing, convertedKey, convertedIndex));
      });
    });
  }
}

export class CollectibleTestThing extends Collectible<string, number> implements ITestThing {
  public str?: string;
  public num?: number;
  public bool?: boolean;

  public constructor(thing: ITestThing, key: string, index?: number) {
    super({ key, index, indexConverter: Converters.number });
    this.str = thing.str;
    this.num = thing.num;
    this.bool = thing.bool;
  }

  public static create(thing: ITestThing, key: string, index?: number): Result<CollectibleTestThing> {
    return captureResult(() => new CollectibleTestThing(thing, key, index));
  }
}

export class BrokenCollectibleTestThing extends CollectibleTestThing {
  public constructor(thing: ITestThing, key: string, index?: number) {
    super(thing, key, index ? ((index + 1) as number) : undefined);
  }

  public setIndex(index: number): Result<number> {
    this._index = index + 1;
    return succeed(this.index!);
  }
}

export class TestCollector extends ConvertingCollector<CollectibleTestThing, ITestThing> {
  public constructor(things?: ITestThing[]) {
    const entries = things
      ? { entries: things.map((thing, index): [string, ITestThing] => [`thing${index}`, thing]) }
      : {};
    const params: IConvertingCollectorConstructorParams<CollectibleTestThing, ITestThing> = {
      factory: TestCollector._factory,
      ...entries
    };
    super(params);
  }

  protected static _factory(key: string, index: number, item: ITestThing): Result<CollectibleTestThing> {
    return succeed(new CollectibleTestThing(item, key, index));
  }
}

export function getTestThings(): { things: ITestThing[]; collectibles: CollectibleTestThing[] } {
  const things = [
    { str: 'thing0', num: 0, bool: false },
    { str: 'thing1', num: 1, bool: true },
    { str: 'thing2', num: 2, bool: false },
    { str: 'thing3', num: 3, bool: true },
    { str: 'thing4', num: 4, bool: false }
  ];
  const collectibles = things.map((thing, index) => new CollectibleTestThing(thing, `thing${index}`, index));
  return { things, collectibles };
}

export function getBrandedTestThings(): {
  things: ITestThing[];
  collectibles: BrandedCollectibleTestThing[];
} {
  const things = [
    { str: 'thing0', num: 0, bool: false },
    { str: 'thing1', num: 1, bool: true },
    { str: 'thing2', num: 2, bool: false },
    { str: 'thing3', num: 3, bool: true },
    { str: 'thing4', num: 4, bool: false }
  ];
  const collectibles = things.map((thing, index) =>
    BrandedCollectibleTestThing.create(thing, `thing${index}`, index).orThrow()
  );
  return { things, collectibles };
}
