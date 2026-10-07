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
import { JsonObject } from '../../../packlets/json';
import { JsonSchema } from '../../..';

/** Whether `text` holds a raw C0, DEL, C1, U+2028 or U+2029 character. */
function hasRawControl(text: string): boolean {
  return Array.from(text).some((ch) => {
    const code = ch.charCodeAt(0);
    return code < 0x20 || (code >= 0x7f && code <= 0x9f) || code === 0x2028 || code === 0x2029;
  });
}

/** The message of a conversion that must fail. */
function failureOf(raw: JsonObject): string {
  const result = JsonSchema.fromJson(raw);
  expect(result).toFail();
  return result.message ?? '';
}

/** Built rather than written as escapes, which a formatter would turn into raw characters. */
const LS: string = String.fromCharCode(0x2028);
const PS: string = String.fromCharCode(0x2029);

const controls: [string, string, string][] = [
  ['newline', '\n', '\\u000a'],
  ['carriage return', '\r', '\\u000d'],
  ['NUL', '\u0000', '\\u0000'],
  ['ESC', '\u001b', '\\u001b'],
  ['DEL', '\u007f', '\\u007f'],
  ['NEL (C1)', '\u0085', '\\u0085'],
  ['line separator', LS, '\\u2028'],
  ['paragraph separator', PS, '\\u2029']
];

describe('JsonSchema.fromJson — server-supplied text is echoed without raw control characters', () => {
  test.each(controls)('a %s in a $ref is escaped', (__label, ch, escaped) => {
    const message = failureOf({ type: 'object', properties: { x: { $ref: `#/$defs/a${ch}INJECTED` } } });
    expect(hasRawControl(message)).toBe(false);
    expect(message).toContain(`'#/$defs/a${escaped}INJECTED'`);
  });

  test.each(controls)('a %s in a property key is escaped in the error path', (__label, ch, escaped) => {
    const message = failureOf({ type: 'object', properties: { [`a${ch}b`]: { type: 'date' } } });
    expect(hasRawControl(message)).toBe(false);
    expect(message.startsWith(`#/properties/a${escaped}b: unsupported or missing 'type'`)).toBe(true);
  });

  test.each<[string, JsonObject]>([
    ['a keyword beside a nullable union', { anyOf: [{ type: 'string' }, { type: 'null' }], ['x\ny']: 1 }],
    ['a keyword beside $ref', { $defs: { S: { type: 'string' } }, $ref: '#/$defs/S', ['x\ny']: 1 }],
    ['a required key with no property', { type: 'object', properties: {}, required: ['x\ny'] }],
    ['a conflicting enum type', { type: 'x\ny', enum: ['a'] }],
    ['a non-string enum value', { enum: ['a', { [`x${LS}y`]: 1 }] }],
    ['a non-string description', { type: 'string', description: { [`x${LS}y`]: 1 } }],
    ['an unresolvable pointer token', { $defs: {}, $ref: '#/$defs/x\ny' }]
  ])('%s is echoed escaped', (__label, raw) => {
    expect(hasRawControl(failureOf(raw))).toBe(false);
  });

  test('truncation never splits an escape sequence', () => {
    // 119 characters of reference, then a newline whose escape would straddle the 120-character cut.
    const ref = `#/$defs/${'a'.repeat(111)}\nmore`;
    const message = failureOf({ $ref: ref });
    expect(hasRawControl(message)).toBe(false);
    expect(message).toContain(`'#/$defs/${'a'.repeat(111)}…'`);
  });

  test('an escape that fits is kept whole before the cut', () => {
    const ref = `#/$defs/${'a'.repeat(100)}\n${'b'.repeat(30)}`;
    expect(failureOf({ $ref: ref })).toContain(`'#/$defs/${'a'.repeat(100)}\\u000a${'b'.repeat(6)}…'`);
  });
});
