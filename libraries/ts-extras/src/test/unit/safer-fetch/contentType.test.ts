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

// eslint-disable-next-line @rushstack/packlets/mechanics
import { parseCharset, parseContentLength } from '../../../packlets/safer-fetch/contentType';

describe('parseCharset', () => {
  test.each<[string | undefined, string | undefined]>([
    [undefined, undefined],
    ['text/plain', undefined],
    ['text/plain; charset=utf-8', 'utf-8'],
    ['text/plain;charset=UTF-8', 'utf-8'],
    ['text/plain; CharSet = "ISO-8859-1"', 'iso-8859-1'],
    ['text/plain; charset=utf-8; boundary=x', 'utf-8'],
    // An empty charset parameter is not an encoding; it must read as "no charset declared"
    // rather than as an unknown one, so the caller falls back to the default instead of failing.
    ['text/plain; charset=', undefined],
    ['text/plain; charset=""', undefined]
  ])('parses %p as %p', (contentType: string | undefined, expected: string | undefined) => {
    expect(parseCharset(contentType)).toBe(expected);
  });
});

describe('parseContentLength', () => {
  test.each<[string | undefined, number | undefined]>([
    [undefined, undefined],
    ['0', 0],
    ['1024', 1024],
    ['  1024  ', 1024],
    ['', undefined],
    ['lots', undefined],
    ['-5', undefined],
    ['1.5', undefined],
    ['1e6', undefined],
    // Beyond Number.MAX_SAFE_INTEGER the value can no longer be compared against a cap
    // meaningfully. A length we cannot trust is not evidence of a size.
    ['99999999999999999999', undefined]
  ])('parses %p as %p', (value: string | undefined, expected: number | undefined) => {
    expect(parseContentLength(value)).toBe(expected);
  });
});
