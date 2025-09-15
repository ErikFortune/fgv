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
import { Collectible } from '../../../packlets/collections';
import { ConverterFunc, Converters } from '../../../packlets/conversion';
import { fail, succeed } from '../../../packlets/base';

describe('Collectible', () => {
  test('can be constructed with key and index', () => {
    const item = new Collectible({ key: 'key', index: 1 });
    expect(item.key).toBe('key');
    expect(item.index).toBe(1);
  });

  test('can be constructed with key only', () => {
    const item = new Collectible({ key: 'key', indexConverter: Converters.number });
    expect(item.key).toBe('key');
    expect(item.index).toBeUndefined();
  });

  test('can be constructed with key and converter function', () => {
    const convertFunc: ConverterFunc<number, undefined> = (i: unknown) => {
      if (typeof i !== 'number') {
        return fail<number>('not a number');
      }
      return succeed(i);
    };
    const item = new Collectible({ key: 'key', indexConverter: convertFunc });
    expect(item.key).toBe('key');
    expect(item.index).toBeUndefined();
  });

  test('allows undefined index to be set', () => {
    const item = new Collectible({ key: 'key', indexConverter: Converters.number });
    expect(item.setIndex(10)).toSucceedWith(10);
    expect(item.index).toBe(10);
  });

  test('validates index if both index and converter are supplied', () => {
    const indexConverter = jest.fn((i: unknown) =>
      typeof i === 'number' ? succeed(i) : fail<number>('not a number')
    );
    expect(
      Collectible.createCollectible({
        key: 'key',
        index: 13,
        indexConverter
      })
    ).toSucceedAndSatisfy(() => {
      expect(indexConverter).toHaveBeenCalled();
    });
  });

  test('constructor throws if supplied index fails to convert', () => {
    expect(
      () =>
        new Collectible({
          key: 'key',
          index: 13,
          indexConverter: Converters.number.withConstraint((n) => n !== 13)
        })
    ).toThrow(/constraint/);
  });

  test('does not allow index to be changed once set', () => {
    const item = new Collectible<string, number>({ key: 'key', index: 1 });
    expect(item.setIndex(10)).toFailWith(/cannot be changed/);
    expect(item.index).toBe(1);
  });

  test('quietly succeeds if setIndex is called with current value', () => {
    const item = new Collectible({ key: 'key', index: 1 });
    expect(item.setIndex(1)).toSucceedWith(1);
    expect(item.index).toBe(1);
  });

  test('setIndex fails if index fails to convert', () => {
    const indexConverter = jest.fn((i: unknown) => {
      if (typeof i !== 'number') {
        return fail<number>('not a number');
      }
      if (i === 3) {
        return fail<number>('unlucky number');
      }
      return succeed(i);
    });
    const item = new Collectible({ key: 'key', indexConverter });
    expect(item.setIndex(3)).toFailWith(/unlucky number/);
  });
});
