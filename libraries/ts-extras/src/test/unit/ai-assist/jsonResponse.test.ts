// Copyright (c) 2026 Erik Fortune
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import '@fgv/ts-utils-jest';

import { Converters as BaseConverters, fail, succeed, Validators } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';

import { AiAssist } from '../../..';

const { extractJsonText, fencedStringifiedJson } = AiAssist;

interface IShape {
  name: string;
  value: number;
}

const shapeConverter = BaseConverters.object<IShape>({
  name: BaseConverters.string,
  value: BaseConverters.number
});

const shapeValidator = Validators.object<IShape>({
  name: Validators.string,
  value: Validators.number
});

describe('extractJsonText', () => {
  test('returns plain JSON object unchanged', () => {
    expect(extractJsonText('{"a":1}')).toSucceedWith('{"a":1}');
  });

  test('returns plain JSON array unchanged', () => {
    expect(extractJsonText('[1,2,3]')).toSucceedWith('[1,2,3]');
  });

  test('strips a fence with the json language tag', () => {
    const input = '```json\n{"a":1}\n```';
    expect(extractJsonText(input)).toSucceedWith('{"a":1}');
  });

  test('strips a fence with no language tag', () => {
    const input = '```\n{"a":1}\n```';
    expect(extractJsonText(input)).toSucceedWith('{"a":1}');
  });

  test('strips a fence with another language tag', () => {
    const input = '```javascript\n{"a":1}\n```';
    expect(extractJsonText(input)).toSucceedWith('{"a":1}');
  });

  test('strips a fence using CRLF line endings', () => {
    const input = '```json\r\n{"a":1}\r\n```';
    expect(extractJsonText(input)).toSucceedWith('{"a":1}');
  });

  test('strips a leading preamble before the JSON object', () => {
    const input = 'Sure! Here\'s the JSON you asked for: {"name":"x","value":1}';
    expect(extractJsonText(input)).toSucceedWith('{"name":"x","value":1}');
  });

  test('strips a leading preamble before a JSON array', () => {
    const input = 'Result: [1, 2, 3]';
    expect(extractJsonText(input)).toSucceedWith('[1, 2, 3]');
  });

  test('strips trailing prose after the JSON value', () => {
    const input = '{"a":1} — let me know if you need anything else!';
    expect(extractJsonText(input)).toSucceedWith('{"a":1}');
  });

  test('strips both leading preamble and trailing prose', () => {
    const input = 'Here it is: {"a":1}. Hope that helps!';
    expect(extractJsonText(input)).toSucceedWith('{"a":1}');
  });

  test('strips a leading byte-order mark', () => {
    const input = '﻿{"a":1}';
    expect(extractJsonText(input)).toSucceedWith('{"a":1}');
  });

  test('handles leading and trailing whitespace', () => {
    expect(extractJsonText('   \n  {"a":1}\n  ')).toSucceedWith('{"a":1}');
  });

  test('honors balanced braces inside string values', () => {
    const input = '{"text":"this } is not the end"}';
    expect(extractJsonText(input)).toSucceedWith('{"text":"this } is not the end"}');
  });

  test('honors escaped quotes inside string values', () => {
    const input = '{"text":"a \\"quoted\\" word"}';
    expect(extractJsonText(input)).toSucceedWith('{"text":"a \\"quoted\\" word"}');
  });

  test('preserves nested objects and arrays', () => {
    const input = 'Output:\n{"outer":{"inner":[1,2,3]},"more":"text"}\nDone.';
    expect(extractJsonText(input)).toSucceedWith('{"outer":{"inner":[1,2,3]},"more":"text"}');
  });

  test('extracts the array when it appears before any object', () => {
    expect(extractJsonText('answer: [{"a":1}]')).toSucceedWith('[{"a":1}]');
  });

  test('returns a primitive JSON value when present', () => {
    expect(extractJsonText('"hello"')).toSucceedWith('"hello"');
    expect(extractJsonText('"with \\"escapes\\""')).toSucceedWith('"with \\"escapes\\""');
    expect(extractJsonText('42')).toSucceedWith('42');
    expect(extractJsonText('-3.14')).toSucceedWith('-3.14');
    expect(extractJsonText('1.5e10')).toSucceedWith('1.5e10');
    expect(extractJsonText('true')).toSucceedWith('true');
    expect(extractJsonText('false')).toSucceedWith('false');
    expect(extractJsonText('null')).toSucceedWith('null');
  });

  test('returns a JSON string containing braces intact (does not extract inner braces)', () => {
    expect(extractJsonText('"text with { } here"')).toSucceedWith('"text with { } here"');
    expect(extractJsonText('"contains [1, 2] and {a:1}"')).toSucceedWith('"contains [1, 2] and {a:1}"');
  });

  test('skips braces inside quoted strings in the preamble before locating real JSON', () => {
    const input = 'Output: "ignored { brace }" then actual: {"a":1}';
    expect(extractJsonText(input)).toSucceedWith('{"a":1}');
  });

  test('rejects candidates that merely start like a JSON primitive', () => {
    expect(extractJsonText('42 trailing text')).toFailWith(/no JSON-shaped substring/i);
    expect(extractJsonText('"a" "b"')).toFailWith(/no JSON-shaped substring/i);
    expect(extractJsonText('truthy')).toFailWith(/no JSON-shaped substring/i);
    expect(extractJsonText('-1.2.3')).toFailWith(/no JSON-shaped substring/i);
  });

  test('fails on empty input', () => {
    expect(extractJsonText('')).toFailWith(/empty/i);
    expect(extractJsonText('   \n  ')).toFailWith(/empty/i);
  });

  test('fails on a fence with empty body', () => {
    expect(extractJsonText('```json\n\n```')).toFailWith(/no JSON content/i);
  });

  test('fails when no JSON-shaped substring is found', () => {
    expect(extractJsonText('I cannot help with that.')).toFailWith(/no JSON-shaped substring/i);
  });

  test('fails when an opening brace is never closed', () => {
    expect(extractJsonText('{"unclosed":')).toFailWith(/no JSON-shaped substring/i);
  });

  test('rejects non-string input', () => {
    expect(extractJsonText(undefined as unknown as string)).toFailWith(/must be a string/i);
    expect(extractJsonText(123 as unknown as string)).toFailWith(/must be a string/i);
  });
});

describe('fencedStringifiedJson', () => {
  test('round-trips plain JSON to a JsonValue when no inner step is supplied', () => {
    const converter = fencedStringifiedJson();
    expect(converter.convert('{"a":1}')).toSucceedWith({ a: 1 });
    expect(converter.convert('[1,2,3]')).toSucceedWith([1, 2, 3]);
  });

  test('strips fences and validates with an inner Converter', () => {
    const converter = fencedStringifiedJson<IShape>({ inner: shapeConverter });
    expect(converter.convert('```json\n{"name":"x","value":1}\n```')).toSucceedWith({
      name: 'x',
      value: 1
    });
  });

  test('strips fences and validates with an inner Validator', () => {
    const converter = fencedStringifiedJson<IShape>({ inner: shapeValidator });
    expect(converter.convert('```\n{"name":"x","value":1}\n```')).toSucceedWith({
      name: 'x',
      value: 1
    });
  });

  test('strips preamble and trailing prose before parsing', () => {
    const converter = fencedStringifiedJson<IShape>({ inner: shapeConverter });
    const input = 'Here you go: {"name":"x","value":1}. Let me know!';
    expect(converter.convert(input)).toSucceedWith({ name: 'x', value: 1 });
  });

  test('rejects non-string input', () => {
    const converter = fencedStringifiedJson();
    expect(converter.convert(42)).toFailWith(/must be a string/i);
    expect(converter.convert({ a: 1 })).toFailWith(/must be a string/i);
  });

  test('propagates extraction failures', () => {
    const converter = fencedStringifiedJson();
    expect(converter.convert('I cannot help with that.')).toFailWith(/no JSON-shaped substring/i);
  });

  test('propagates JSON.parse failures (line in the sand: no repair)', () => {
    const converter = fencedStringifiedJson();
    expect(converter.convert('{not valid json}')).toFailWith(/failed to parse json/i);
  });

  test('propagates inner converter failures', () => {
    const converter = fencedStringifiedJson<IShape>({ inner: shapeConverter });
    expect(converter.convert('{"name":"x","value":"not a number"}')).toFail();
  });

  test('accepts an extractor-only options object and returns Converter<JsonValue>', () => {
    const customExtractor = (text: string): Result<string> => succeed(text.replace(/^RAW: /, ''));
    const converter = fencedStringifiedJson({ extractor: customExtractor });
    expect(converter.convert('RAW: {"a":1}')).toSucceedWith({ a: 1 });
  });

  test('uses a custom extractor when supplied', () => {
    let called = 0;
    const customExtractor = (text: string): Result<string> => {
      called++;
      // Strip a leading "RAW:" sentinel.
      if (text.startsWith('RAW:')) {
        return succeed(text.slice('RAW:'.length).trim());
      }
      return fail('custom extractor: missing RAW: sentinel');
    };

    const converter = fencedStringifiedJson<IShape>({
      extractor: customExtractor,
      inner: shapeConverter
    });

    expect(converter.convert('RAW: {"name":"x","value":1}')).toSucceedWith({ name: 'x', value: 1 });
    expect(converter.convert('{"name":"x","value":1}')).toFailWith(/RAW: sentinel/);
    expect(called).toBe(2);
  });
});
