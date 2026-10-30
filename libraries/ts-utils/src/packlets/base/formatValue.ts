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

/**
 * Options for {@link formatValueForMessage}.
 * @public
 */
export interface IFormatValueForMessageOptions {
  /**
   * Maximum length of the returned text, in UTF-16 code units, including the trailing
   * ellipsis (`…`) that marks a truncated rendering. Values below 1 or that are not numbers
   * select the default. Default {@link DEFAULT_FORMAT_VALUE_MAX_LENGTH}.
   */
  readonly maxLength?: number;

  /**
   * Maximum depth of nested objects and arrays that are rendered. A container nested more deeply
   * is elided as `{…}` or `[…]`. Negative values or values that are not numbers select the default.
   * Default {@link DEFAULT_FORMAT_VALUE_MAX_DEPTH}.
   */
  readonly maxDepth?: number;

  /**
   * Number of spaces used to indent nested members, with the same meaning (and the same clamp to
   * 0–10) as the `space` argument of `JSON.stringify`. Default `0` (compact).
   */
  readonly indent?: number;

  /**
   * How to render the value:
   * - `'json'` (default): the JSON-compatible rendering described at {@link formatValueForMessage}.
   * - `'string'`: `String(value)` — the text a template literal interpolating the value produces —
   *   falling back to the `'json'` rendering when that conversion throws (a symbol in a template
   *   literal, a null-prototype object, a Proxy, a throwing `toString`). For use where a message has
   *   always interpolated the value directly and its text must not change. Unlike `'json'`, this
   *   runs the value's own `toString`, so prefer `'json'` for new messages.
   *
   * Both styles are bounded by `maxLength`.
   */
  readonly style?: 'json' | 'string';
}

/**
 * Default {@link IFormatValueForMessageOptions.maxLength | maximum length} used by
 * {@link formatValueForMessage}.
 * @public
 */
export const DEFAULT_FORMAT_VALUE_MAX_LENGTH: number = 200;

/**
 * Default {@link IFormatValueForMessageOptions.maxDepth | maximum depth} used by
 * {@link formatValueForMessage}.
 * @public
 */
export const DEFAULT_FORMAT_VALUE_MAX_DEPTH: number = 16;

const ELLIPSIS: string = '…';
const UNREADABLE: string = '[Unreadable]';
const CIRCULAR: string = '[Circular]';

/**
 * What a container looks like once its shape has been read. Reading it can run caller code (a
 * getter, a Proxy trap), so it is read once, inside a `try`, before anything is written.
 */
type ContainerShape =
  | { readonly kind: 'array'; readonly prefix: string; readonly length: number }
  | { readonly kind: 'object'; readonly prefix: string; readonly keys: readonly string[] }
  | { readonly kind: 'text'; readonly text: string };

function _stringOrUndefined(value: unknown): string | undefined {
  try {
    return String(value);
  } catch {
    return undefined;
  }
}

function _truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  let cut = text.slice(0, maxLength - 1);
  const last = cut.charCodeAt(cut.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) {
    // do not leave half of a surrogate pair in front of the ellipsis
    cut = cut.slice(0, -1);
  }
  return `${cut}${ELLIPSIS}`;
}

function _optionOrDefault(value: unknown, min: number, fallback: number): number {
  return typeof value === 'number' && value >= min ? Math.floor(value) : fallback;
}

/**
 * Accumulates the rendering and stops accepting text once the length budget is exceeded, so the
 * walk over a large graph ends as soon as the result is known to be truncated.
 */
class MessageValueWriter {
  private readonly _parts: string[] = [];
  private _length: number = 0;
  private readonly _ancestors: object[] = [];
  private readonly _maxLength: number;
  private readonly _maxDepth: number;
  private readonly _gap: string;

  public constructor(maxLength: number, maxDepth: number, gap: string) {
    this._maxLength = maxLength;
    this._maxDepth = maxDepth;
    this._gap = gap;
  }

  public get full(): boolean {
    return this._length > this._maxLength;
  }

  public text(): string {
    return _truncate(this._parts.join(''), this._maxLength);
  }

  public value(value: unknown, depth: number, indent: string): void {
    switch (typeof value) {
      case 'string':
        // escaping only lengthens a string, so a prefix one past the budget renders identically
        // up to the cut and bounds the cost of a very long string
        this._write(JSON.stringify(value.length > this._maxLength ? value.slice(0, this._maxLength) : value));
        return;
      case 'number':
      case 'boolean':
        this._write(JSON.stringify(value));
        return;
      case 'bigint':
        this._write(`${value}n`);
        return;
      case 'symbol':
        this._write(String(value));
        return;
      case 'function':
        this._write(`[Function ${MessageValueWriter._functionName(value)}]`);
        return;
      case 'object':
        if (value === null) {
          this._write('null');
        } else {
          this._container(value, depth, indent);
        }
        return;
      default:
        this._write('undefined');
    }
  }

  private _write(text: string): void {
    if (!this.full) {
      this._parts.push(text);
      this._length += text.length;
    }
  }

  private _container(value: object, depth: number, indent: string): void {
    if (this._ancestors.includes(value)) {
      this._write(CIRCULAR);
      return;
    }
    const shape = MessageValueWriter._shape(value);
    if (shape.kind === 'text') {
      this._write(shape.text);
      return;
    }
    const [open, close] = shape.kind === 'array' ? ['[', ']'] : ['{', '}'];
    const count = shape.kind === 'array' ? shape.length : shape.keys.length;
    if (count === 0) {
      this._write(`${shape.prefix}${open}${close}`);
      return;
    }
    if (depth >= this._maxDepth) {
      this._write(`${shape.prefix}${open}${ELLIPSIS}${close}`);
      return;
    }

    const inner = `${indent}${this._gap}`;
    const separator = this._gap ? `,\n${inner}` : ',';
    this._write(`${shape.prefix}${open}${this._gap ? `\n${inner}` : ''}`);
    this._ancestors.push(value);
    for (let i = 0; i < count && !this.full; i++) {
      if (i > 0) {
        this._write(separator);
      }
      if (shape.kind === 'object') {
        this._write(`${JSON.stringify(shape.keys[i])}:${this._gap ? ' ' : ''}`);
      }
      this._member(value, shape.kind === 'array' ? i : shape.keys[i], depth + 1, inner);
    }
    this._ancestors.pop();
    this._write(`${this._gap ? `\n${indent}` : ''}${close}`);
  }

  private _member(container: object, key: string | number, depth: number, indent: string): void {
    let member: unknown;
    try {
      member = (container as Record<string | number, unknown>)[key];
    } catch {
      this._write(UNREADABLE);
      return;
    }
    this.value(member, depth, indent);
  }

  private static _shape(value: object): ContainerShape {
    try {
      if (Array.isArray(value)) {
        return { kind: 'array', prefix: '', length: value.length };
      }
      const date = MessageValueWriter._dateText(value);
      if (date !== undefined) {
        return { kind: 'text', text: date };
      }
      const prefix = MessageValueWriter._prefix(value);
      if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
        return { kind: 'array', prefix, length: (value as unknown as ArrayLike<unknown>).length };
      }
      return { kind: 'object', prefix, keys: Object.keys(value) };
    } catch {
      return { kind: 'text', text: UNREADABLE };
    }
  }

  /**
   * Renders a real `Date` as `JSON.stringify` would, through the intrinsic methods rather than any
   * `toJSON` override. Anything that is not a `Date` (including a Proxy of one) yields `undefined`.
   */
  private static _dateText(value: object): string | undefined {
    let time: number;
    try {
      time = Date.prototype.getTime.call(value);
    } catch {
      return undefined;
    }
    return Number.isNaN(time) ? 'null' : JSON.stringify(Date.prototype.toISOString.call(value));
  }

  /**
   * The constructor-name prefix for a class instance, or `''` for a plain object. An object whose
   * prototype is null, or is a root prototype whose constructor is `Object` (from any realm), is
   * plain.
   */
  private static _prefix(value: object): string {
    const proto: unknown = Object.getPrototypeOf(value);
    if (proto === null) {
      return '';
    }
    const ctor: unknown = Object.getOwnPropertyDescriptor(proto, 'constructor')?.value;
    const name = typeof ctor === 'function' && typeof ctor.name === 'string' ? ctor.name : '';
    if (name === 'Object' && Object.getPrototypeOf(proto) === null) {
      return '';
    }
    return `${name || 'Object'} `;
  }

  private static _functionName(value: unknown): string {
    try {
      const name: unknown = (value as { name?: unknown }).name;
      return typeof name === 'string' && name.length > 0 ? name : '(anonymous)';
    } catch {
      return '(anonymous)';
    }
  }
}

/**
 * Renders an arbitrary value as text for inclusion in a failure or diagnostic message. Never
 * throws, and has no side effects of its own.
 *
 * @remarks
 * **Compatibility:** for a JSON-safe value (strings, finite numbers, booleans, `null`, and plain
 * objects and arrays of them) whose rendering fits within `maxLength` and `maxDepth`, the result
 * is exactly `JSON.stringify(value, undefined, indent)`. A top-level `undefined` renders as
 * `undefined`, which is what a template literal made of `JSON.stringify(undefined)` produced.
 *
 * Everything else renders as readable text rather than throwing or disappearing:
 * - a reference back to an object currently being rendered renders as `[Circular]`;
 * - a `BigInt` renders as `123n`, a symbol as `Symbol(description)`, a function as
 *   `[Function name]`, and `undefined` anywhere as `undefined` (it is not dropped);
 * - a class instance renders its own enumerable properties behind its constructor name, as in
 *   `Socket {"connecting":false,…}`; typed arrays render their elements, as in `Uint8Array [1,2]`;
 * - a property whose getter or Proxy trap throws renders as `[Unreadable]`, as does an object
 *   whose shape cannot be read at all;
 * - a `Date` renders as `JSON.stringify` renders it, but through the intrinsic `Date` methods.
 *
 * A user-defined `toJSON` is deliberately **not** invoked: it is arbitrary code that can have side
 * effects or throw, and the point of the message is to describe the value that was received, not
 * a projection of it. Getters, by contrast, are read (as `JSON.stringify` reads them), with any
 * error contained.
 *
 * The {@link IFormatValueForMessageOptions.style | `'string'` style} instead preserves the text of a
 * message that has always interpolated the value directly.
 *
 * Output longer than `maxLength` is cut and ends with `…`; the walk stops as soon as the budget is
 * exceeded, so formatting a very large graph costs about as much as formatting a small one.
 *
 * @param value - The value to render.
 * @param options - Optional {@link IFormatValueForMessageOptions | formatting options}.
 * @returns The rendered text.
 * @public
 */
export function formatValueForMessage(value: unknown, options?: IFormatValueForMessageOptions): string {
  try {
    const maxLength = _optionOrDefault(options?.maxLength, 1, DEFAULT_FORMAT_VALUE_MAX_LENGTH);
    const maxDepth = _optionOrDefault(options?.maxDepth, 0, DEFAULT_FORMAT_VALUE_MAX_DEPTH);
    if (options?.style === 'string') {
      const text = _stringOrUndefined(value);
      if (text !== undefined) {
        return _truncate(text, maxLength);
      }
    }
    const gap = ' '.repeat(Math.min(10, _optionOrDefault(options?.indent, 0, 0)));
    const writer = new MessageValueWriter(maxLength, maxDepth, gap);
    writer.value(value, 0, '');
    return writer.text();
  } catch {
    // reads of the value are contained where they happen; this catches what is left — options
    // whose accessors throw, or exhausting the stack or string length once the bounds are lifted
    return UNREADABLE;
  }
}
