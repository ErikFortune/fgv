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

import '@fgv/ts-utils-jest';
import { Yaml } from '../..';

describe('yamlStringify', () => {
  test('serializes a simple object', () => {
    const obj = { name: 'test', value: 42 };
    expect(Yaml.yamlStringify(obj)).toSucceedAndSatisfy((result) => {
      expect(result).toContain('name: test');
      expect(result).toContain('value: 42');
    });
  });

  test('serializes nested objects', () => {
    const obj = { parent: { child: { value: 42 } } };
    expect(Yaml.yamlStringify(obj)).toSucceedAndSatisfy((result) => {
      expect(result).toContain('parent:');
      expect(result).toContain('child:');
      expect(result).toContain('value: 42');
    });
  });

  test('serializes arrays', () => {
    const obj = { items: [1, 2, 3] };
    expect(Yaml.yamlStringify(obj)).toSucceedAndSatisfy((result) => {
      expect(result).toContain('items:');
      expect(result).toContain('- 1');
      expect(result).toContain('- 2');
      expect(result).toContain('- 3');
    });
  });

  test('serializes a top-level array', () => {
    const arr = [{ name: 'a' }, { name: 'b' }];
    expect(Yaml.yamlStringify(arr)).toSucceedAndSatisfy((result) => {
      expect(result).toContain('- name: a');
      expect(result).toContain('- name: b');
    });
  });

  test('round-trips with yamlConverter', () => {
    const { Converters } = require('@fgv/ts-json-base');
    const original = { name: 'test', count: 42, nested: { flag: true } };
    const yamlStr = Yaml.yamlStringify(original).orThrow();
    const parsed = Yaml.yamlConverter(Converters.jsonObject).convert(yamlStr);
    expect(parsed).toSucceedAndSatisfy((result) => {
      expect(result).toEqual(original);
    });
  });

  test('respects sortKeys option', () => {
    const obj = { zebra: 1, alpha: 2, middle: 3 };
    expect(Yaml.yamlStringify(obj, { sortKeys: true })).toSucceedAndSatisfy((result) => {
      const alphaIndex = result.indexOf('alpha');
      const middleIndex = result.indexOf('middle');
      const zebraIndex = result.indexOf('zebra');
      expect(alphaIndex).toBeLessThan(middleIndex);
      expect(middleIndex).toBeLessThan(zebraIndex);
    });
  });

  test('respects indent option', () => {
    const obj = { parent: { child: 'value' } };
    expect(Yaml.yamlStringify(obj, { indent: 4 })).toSucceedAndSatisfy((result) => {
      expect(result).toContain('    child: value');
    });
  });

  test('respects flowLevel option', () => {
    const obj = { parent: { child: 'value' } };
    expect(Yaml.yamlStringify(obj, { flowLevel: 1 })).toSucceedAndSatisfy((result) => {
      expect(result).toContain('{child: value}');
    });
  });

  test('fails when given null', () => {
    expect(Yaml.yamlStringify(null)).toFailWith(/null or undefined/i);
  });

  test('fails when given undefined', () => {
    expect(Yaml.yamlStringify(undefined)).toFailWith(/null or undefined/i);
  });

  test('fails when given a primitive string', () => {
    expect(Yaml.yamlStringify('hello' as unknown as object)).toFailWith(/object or array/i);
  });

  test('fails when given a number', () => {
    expect(Yaml.yamlStringify(42 as unknown as object)).toFailWith(/object or array/i);
  });

  test('fails when given a boolean', () => {
    expect(Yaml.yamlStringify(true as unknown as object)).toFailWith(/object or array/i);
  });
});
