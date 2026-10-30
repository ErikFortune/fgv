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

const ALPHABET: readonly string[] = [
  'a',
  'Z',
  '0',
  ' ',
  '"',
  '\\',
  '\n',
  '\t',
  '\u0007',
  '\u2028',
  'é',
  '😀',
  '/',
  '{',
  ']'
];

/**
 * Deterministic generator of JSON-safe values (strings with escapes and astral characters, signed
 * and fractional numbers, booleans, null, nested objects and arrays), for comparing a renderer
 * against `JSON.stringify`. Seeded so a failure reproduces.
 */
export class SeededJsonValues {
  private _state: number;

  public constructor(seed: number) {
    this._state = (Math.abs(Math.floor(seed)) % 2147483646) + 1;
  }

  public generate(count: number): unknown[] {
    return Array.from({ length: count }, () => this._value(0));
  }

  private _next(): number {
    // Park-Miller minimal standard generator: test data only
    this._state = (this._state * 48271) % 2147483647;
    return (this._state - 1) / 2147483646;
  }

  private _int(max: number): number {
    return Math.floor(this._next() * max);
  }

  private _string(): string {
    const length = this._int(12);
    let text = '';
    for (let i = 0; i < length; i++) {
      text += ALPHABET[this._int(ALPHABET.length)];
    }
    return text;
  }

  private _value(depth: number): unknown {
    switch (this._int(depth > 4 ? 6 : 8)) {
      case 0:
        return this._string();
      case 1:
        return this._int(2000) - 1000;
      case 2:
        return (this._next() - 0.5) * 10 ** this._int(25);
      case 3:
        return this._next() < 0.5;
      case 4:
        return null;
      case 5:
        return this._int(3) === 0 ? -0 : this._string();
      case 6:
        return Array.from({ length: this._int(6) }, () => this._value(depth + 1));
      default: {
        const obj: Record<string, unknown> = {};
        const size = this._int(6);
        for (let i = 0; i < size; i++) {
          obj[this._int(4) === 0 ? String(this._int(20)) : this._string()] = this._value(depth + 1);
        }
        return obj;
      }
    }
  }
}
