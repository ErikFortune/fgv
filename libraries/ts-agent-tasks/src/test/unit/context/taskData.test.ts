/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import '@fgv/ts-utils-jest';
import { JsonValue } from '@fgv/ts-json-base';
import { serializeTaskData } from '../../../index';

describe('serializeTaskData', () => {
  test('every JSON shape round-trips exactly, on one line', () => {
    const value: JsonValue = { a: [1, -2.5, 0, true, false, null, 'x'], b: { c: '' }, 'd e': [] };
    expect(serializeTaskData(value)).toSucceedAndSatisfy((text: string) => {
      expect(text).not.toContain('\n');
      expect(JSON.parse(text)).toEqual(value);
    });
    expect(serializeTaskData('plain')).toSucceedWith('"plain"');
    expect(serializeTaskData(null)).toSucceedWith('null');
  });

  test('strings — keys included — are escaped as the renderer escapes task prose', () => {
    const separator: string = String.fromCharCode(0x2028);
    const value: JsonValue = { '<k>': `{{x}} & \`y\` ${separator} \u202e \u{e0041}` };
    expect(serializeTaskData(value)).toSucceedAndSatisfy((text: string) => {
      expect(text).toBe(
        '{"\\u003ck\\u003e":"\\u007b\\u007bx\\u007d\\u007d \\u0026 \\u0060y\\u0060 \\u2028 \\u202e \\udb40\\udc41"}'
      );
      expect(JSON.parse(text)).toEqual(value);
    });
  });

  test('undefined fields are skipped, as JSON.stringify skips them', () => {
    const value = { a: 1, b: undefined } as unknown as JsonValue;
    expect(serializeTaskData(value)).toSucceedWith('{"a":1}');
  });

  test('an object with no prototype is a plain object', () => {
    const value = Object.assign(Object.create(null) as object, { a: 'x' }) as JsonValue;
    expect(serializeTaskData(value)).toSucceedWith('{"a":"x"}');
  });

  test('a number with no JSON form fails, naming where it was', () => {
    expect(serializeTaskData({ a: [1, { b: Infinity }] })).toFailWith(
      /task data\.a\[1\]\.b: Infinity is not a finite number/
    );
    expect(serializeTaskData(NaN)).toFailWith(/task data: NaN is not a finite number/);
  });

  test('a value that is not JSON fails', () => {
    expect(serializeTaskData({ when: new Date(0) } as unknown as JsonValue)).toFailWith(
      /task data\.when: not a JSON value/
    );
    expect(serializeTaskData((() => 1) as unknown as JsonValue)).toFailWith(/not a JSON value/);
  });

  test('a value that contains itself fails; one shared twice, without a cycle, does not', () => {
    const loop: Record<string, unknown> = { a: 1 };
    loop.self = { back: loop };
    expect(serializeTaskData(loop as unknown as JsonValue)).toFailWith(
      /task data\.self\.back: refers to itself/
    );
    const ring: unknown[] = [];
    ring.push(ring);
    expect(serializeTaskData(ring as unknown as JsonValue)).toFailWith(/task data\[0\]: refers to itself/);
    const shared: JsonValue = { x: 'y' };
    expect(serializeTaskData({ a: shared, b: [shared] })).toSucceedWith('{"a":{"x":"y"},"b":[{"x":"y"}]}');
  });
});
