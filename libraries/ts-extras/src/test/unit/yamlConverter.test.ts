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
import { Converters } from '@fgv/ts-utils';
import { Converters as JsonConverters } from '@fgv/ts-json-base';
import { Yaml } from '../..';

describe('yamlConverter', () => {
  const converter = Yaml.yamlConverter(JsonConverters.jsonObject);

  test('parses and converts valid YAML object', () => {
    const yamlStr = 'name: test\nvalue: 42';
    expect(converter.convert(yamlStr)).toSucceedAndSatisfy((v) => {
      expect(v.name).toBe('test');
      expect(v.value).toBe(42);
    });
  });

  test('parses YAML with nested structures', () => {
    const yamlStr = 'parent:\n  child:\n    value: 42';
    expect(converter.convert(yamlStr)).toSucceedAndSatisfy((v) => {
      expect(v).toEqual({ parent: { child: { value: 42 } } });
    });
  });

  test('parses YAML inline object syntax', () => {
    expect(converter.convert('{name: test}')).toSucceedAndSatisfy((v) => {
      expect(v.name).toBe('test');
    });
  });

  test('fails when input is not a string', () => {
    expect(converter.convert({ name: 'test' })).toFailWith(/input must be a string/i);
    expect(converter.convert(42)).toFailWith(/input must be a string/i);
    expect(converter.convert(true)).toFailWith(/input must be a string/i);
  });

  test('fails when YAML is malformed', () => {
    // Tabs are invalid in YAML indentation
    expect(converter.convert('key:\n\t- bad')).toFailWith(/failed to parse yaml/i);
  });

  test('fails when YAML parses to a primitive', () => {
    expect(converter.convert('42')).toFailWith(/yaml content must be an object/i);
    expect(converter.convert('true')).toFailWith(/yaml content must be an object/i);
    expect(converter.convert('hello')).toFailWith(/yaml content must be an object/i);
  });

  test('fails when YAML parses to null', () => {
    expect(converter.convert('null')).toFailWith(/yaml content must be an object/i);
    expect(converter.convert('~')).toFailWith(/yaml content must be an object/i);
  });

  test('fails when inner converter rejects parsed value', () => {
    // Use a converter that expects specific fields
    const strict = Yaml.yamlConverter(
      Converters.object<{ name: string; count: number }>({
        name: Converters.string,
        count: Converters.number
      })
    );
    expect(strict.convert('name: test\ncount: not-a-number')).toFail();
  });
});
