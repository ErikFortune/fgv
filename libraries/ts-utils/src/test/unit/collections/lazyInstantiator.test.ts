/*
 * Copyright (c) 2026 Erik Fortune
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
import { Converters } from '../../../packlets/conversion';
import {
  KeyValueConverters,
  LazyInstantiator,
  ResultMap,
  ValidatingLazyInstantiator
} from '../../../packlets/collections';

describe('LazyInstantiator', () => {
  test('base and items views do not materialize', () => {
    const base = new ResultMap<'a' | 'b', number>([
      ['a', 1],
      ['b', 2]
    ]);

    const factory = jest.fn((b: number, k: 'a' | 'b') => succeed(`${k}:${b}`));
    const inst = new LazyInstantiator<'a' | 'b', number, string>({ base, factory });

    expect(inst.loaded.size).toBe(0);
    expect(factory).toHaveBeenCalledTimes(0);

    // Pure base queries must not materialize
    expect(inst.base.has('a')).toBe(true);
    expect([...inst.base.keys()]).toEqual(['a', 'b']);
    expect(factory).toHaveBeenCalledTimes(0);

    // Items view must not materialize
    expect(inst.items.has('a')).toBe(true);
    expect(inst.items.size).toBe(2);
    expect([...inst.items.keys()]).toEqual(['a', 'b']);
    expect(factory).toHaveBeenCalledTimes(0);

    // Iterating items yields LazyItem objects without materializing
    const items = [...inst.items.values()];
    expect(items).toHaveLength(2);
    const firstItem = items[0]!;
    expect(firstItem.isLoaded()).toBe(false);
    expect(firstItem.peekLoaded().success).toBe(false);
    expect(factory).toHaveBeenCalledTimes(0);

    // entries()/forEach() are also non-materializing
    const entriesIter = inst.items.entries();
    expect(entriesIter.next().value?.[0]).toBe('a');
    expect(entriesIter.next().value?.[0]).toBe('b');
    const seen: string[] = [];
    inst.items.forEach((value, key) => {
      const item = value as { base: number };
      seen.push(`${key}:${item.base}`);
    });
    expect(seen).toEqual(['a:1', 'b:2']);
    expect(factory).toHaveBeenCalledTimes(0);

    // Missing key returns failure without materializing
    const missing = inst.items.get('missing' as 'a');
    expect(missing.success).toBe(false);
    expect(missing.detail).toBe('not-found');
    expect(factory).toHaveBeenCalledTimes(0);
  });

  test('materialize caches into loaded', () => {
    const base = new ResultMap<'a' | 'b', number>([
      ['a', 1],
      ['b', 2]
    ]);

    const factory = jest.fn((b: number, k: 'a' | 'b') => succeed(`${k}:${b}`));
    const inst = new LazyInstantiator<'a' | 'b', number, string>({ base, factory });

    const itemResult = inst.items.get('a');
    if (!itemResult.success) {
      throw new Error(itemResult.message);
    }

    const item = itemResult.value;
    expect(item.isLoaded()).toBe(false);

    const first = item.materialize();
    expect(first.success).toBe(true);
    expect(first.value).toBe('a:1');
    expect(first.detail).toBe('added');
    expect(factory).toHaveBeenCalledTimes(1);

    expect(item.isLoaded()).toBe(true);
    expect(item.peekLoaded().success).toBe(true);
    expect(inst.loaded.has('a')).toBe(true);
    expect(inst.loaded.get('a').success).toBe(true);

    // Materializing again must not call factory again
    const second = item.materialize();
    expect(second.success).toBe(true);
    expect(second.value).toBe('a:1');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  test('materialize fails when base key does not exist', () => {
    const base = new ResultMap<'a', number>([['a', 1]]);

    const factory = jest.fn((b: number, k: 'a') => succeed(`${k}:${b}`));
    const inst = new LazyInstantiator<'a', number, string>({ base, factory });

    // This cast is purely to test runtime behavior for a missing key.
    const result = inst.materialize('missing' as 'a');
    expect(result.success).toBe(false);
    expect(result.detail).toBe('not-found');
    expect(factory).toHaveBeenCalledTimes(0);
  });

  test('materializing view materializes on get but not on has/keys', () => {
    const base = new ResultMap<'a' | 'b', number>([
      ['a', 1],
      ['b', 2]
    ]);

    const factory = jest.fn((b: number, k: 'a' | 'b') => succeed(`${k}:${b}`));
    const inst = new LazyInstantiator<'a' | 'b', number, string>({ base, factory });

    expect(inst.materializing.size).toBe(2);
    expect(inst.materializing.has('a')).toBe(true);
    expect([...inst.materializing.keys()]).toEqual(['a', 'b']);
    expect(factory).toHaveBeenCalledTimes(0);

    const r = inst.materializing.get('a');
    expect(r.success).toBe(true);
    expect(r.value).toBe('a:1');
    expect(factory).toHaveBeenCalledTimes(1);

    expect(inst.loaded.has('a')).toBe(true);
    expect(inst.materializing.has('a')).toBe(true);
    expect([...inst.materializing.keys()]).toEqual(['a', 'b']);

    // Iteration materializes as encountered
    const entries = [...inst.materializing.entries()];
    expect(entries).toEqual([
      ['a', 'a:1'],
      ['b', 'b:2']
    ]);
    expect(factory).toHaveBeenCalledTimes(2);

    expect([...inst.materializing.values()]).toEqual(['a:1', 'b:2']);
    expect([...inst.materializing]).toEqual([
      ['a', 'a:1'],
      ['b', 'b:2']
    ]);

    const seen: Array<[string, string]> = [];
    inst.materializing.forEach((value, key) => {
      seen.push([key, value as string]);
    });
    expect(seen).toEqual([
      ['a', 'a:1'],
      ['b', 'b:2']
    ]);
  });

  test('materialize reports failure when factory fails', () => {
    const base = new ResultMap<'a', number>([['a', 1]]);
    const factory = jest.fn((_b: number, _k: 'a') => fail<string>('boom'));

    const inst = new LazyInstantiator<'a', number, string>({ base, factory });
    const r = inst.materialize('a');
    expect(r.success).toBe(false);
    expect(r.detail).toBe('failure');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  test('validating views validate keys and delegate correctly', () => {
    const base = new ResultMap<'a' | 'b', number>([
      ['a', 1],
      ['b', 2]
    ]);

    const factory = jest.fn((b: number, k: 'a' | 'b') => succeed(`${k}:${b}`));

    const baseConverters = new KeyValueConverters<'a' | 'b', number>({
      key: Converters.enumeratedValue(['a', 'b'] as const),
      value: Converters.number
    });

    const loadedConverters = new KeyValueConverters<'a' | 'b', string>({
      key: Converters.enumeratedValue(['a', 'b'] as const),
      value: Converters.string
    });

    const inst = new ValidatingLazyInstantiator<'a' | 'b', number, string>({
      base,
      factory,
      baseConverters,
      loadedConverters
    });

    expect(inst.validating.base.has('a')).toBe(true);
    expect(inst.validating.base.has('c')).toBe(false);

    // items.get should validate key, but not materialize
    const item = inst.validating.items.get('a');
    expect(item.success).toBe(true);
    expect(factory).toHaveBeenCalledTimes(0);

    const bad = inst.validating.items.get('c');
    expect(bad.success).toBe(false);
    expect(bad.detail).toBe('invalid-key');

    const badMat = inst.validating.materializing.get('c');
    expect(badMat.success).toBe(false);
    expect(badMat.detail).toBe('invalid-key');

    // Cover the (intentionally unsupported) value conversion path for items.
    const itemsValidator = inst.validating.items as unknown as {
      converters: KeyValueConverters<'a' | 'b', unknown>;
    };
    expect(itemsValidator.converters.convertValue({}).success).toBe(false);
  });

  test('supports preloaded values in loaded view', () => {
    const base = new ResultMap<'a' | 'b', number>([
      ['a', 1],
      ['b', 2]
    ]);
    const factory = jest.fn((b: number, k: 'a' | 'b') => succeed(`${k}:${b}`));

    const inst = new LazyInstantiator<'a' | 'b', number, string>({
      base,
      factory,
      loaded: new Map<'a' | 'b', string>([['a', 'preloaded']]).entries()
    });

    expect(inst.loaded.has('a')).toBe(true);
    expect(inst.loaded.get('a').orDefault()).toBe('preloaded');
    expect(factory).toHaveBeenCalledTimes(0);
  });
});
