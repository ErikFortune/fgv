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
   * select the default. Default {@link DEFAULT_FORMAT_VALUE_MAX_LENGTH} for the `'json'` style and
   * {@link DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH} for the `'string'` style.
   */
  readonly maxLength?: number;

  /**
   * Maximum depth of nested objects and arrays rendered by the fallback renderer (used only when
   * `JSON.stringify` throws). A container nested more deeply is elided as `{…}` or `[…]`. Negative
   * values or values that are not numbers select the default. Default
   * {@link DEFAULT_FORMAT_VALUE_MAX_DEPTH}.
   */
  readonly maxDepth?: number;

  /**
   * Number of spaces used to indent nested members, with the same meaning (and the same clamp to
   * 0–10) as the `space` argument of `JSON.stringify`. Default `0` (compact).
   */
  readonly indent?: number;

  /**
   * How to render the value:
   * - `'json'` (default): the `JSON.stringify`-based rendering described at
   *   {@link formatValueForMessage}.
   * - `'string'`: `String(value)`, which is what interpolating the value into a template literal
   *   produces, except for a symbol, where a template literal throws and `String()` does not. Falls
   *   back to the `'json'` rendering when `String()` throws (a null-prototype object, a Proxy whose
   *   traps throw, a throwing `toString`). For messages that have always interpolated the value
   *   directly and whose text must not change. It invokes the value's own `toString` /
   *   `Symbol.toPrimitive`. Its default bound is the larger
   *   {@link DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH}: the text of such a message was never bounded,
   *   and is unchanged up to that length, but `String()` of a large array runs to megabytes.
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

/**
 * Default {@link IFormatValueForMessageOptions.maxLength | maximum length} used by
 * {@link formatValueForMessage} in the `'string'` style.
 * @public
 */
export const DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH: number = 1000;

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

/**
 * Thrown from the replacer to abandon `JSON.stringify` once the output is known to exceed the
 * length budget or the call budget, so the caller falls back to the bounded renderer.
 */
const OVER_BUDGET: object = Object.freeze({});

/**
 * A lower bound on the characters one replacer call adds to the output: the key and colon for an
 * object member, and the value's own minimum. Escaping and indentation only add to it, so a running
 * total above the budget proves the result will be truncated.
 */
function _lowerBound(key: string, value: unknown, inArray: boolean, isRoot: boolean): number {
  let own: number;
  switch (typeof value) {
    case 'string':
      own = value.length + 2;
      break;
    case 'number':
      own = JSON.stringify(value).length;
      break;
    case 'boolean':
      own = value ? 4 : 5;
      break;
    case 'object':
      own = value === null ? 4 : 2;
      break;
    default:
      // undefined, function, symbol: "null" in an array, omitted from an object
      return inArray ? 4 : 0;
  }
  return isRoot || inArray ? own : own + key.length + 3;
}

/**
 * `JSON.stringify(value, replacer, indent)`, where the replacer intervenes only where
 * `JSON.stringify` would throw: a reference back to an object on the active ancestor path becomes
 * the string `"[Circular]"`, and a `BigInt` becomes `"123n"`. Returns `undefined` when
 * `JSON.stringify` does (a top-level `undefined`, function or symbol), when it throws anyway (a
 * throwing getter, Proxy trap or `toJSON`, or stack exhaustion), or when the output is shown to
 * exceed `maxLength` or the walk exceeds its call budget.
 */
function _stringifyOrUndefined(value: unknown, indent: number, maxLength: number): string | undefined {
  const ancestors: unknown[] = [];
  const callBudget = Math.max(10_000, maxLength * 50);
  let calls = 0;
  let length = 0;
  const replacer = function (this: unknown, key: string, member: unknown): unknown {
    calls++;
    let replaced: unknown = typeof member === 'bigint' ? `${member}n` : member;
    if (typeof replaced === 'object' && replaced !== null) {
      // the holder is the deepest ancestor still open; anything after it has been closed
      ancestors.length = ancestors.lastIndexOf(this) + 1;
      if (ancestors.includes(replaced)) {
        replaced = CIRCULAR;
      } else {
        ancestors.push(replaced);
      }
    }
    length += _lowerBound(key, replaced, Array.isArray(this), calls === 1);
    if (length > maxLength || calls > callBudget) {
      throw OVER_BUDGET;
    }
    return replaced;
  };
  try {
    const text: unknown = JSON.stringify(value, replacer, indent);
    return typeof text === 'string' ? text : undefined;
  } catch {
    return undefined;
  }
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
 * throws.
 *
 * @remarks
 * **Compatibility:** the value is first rendered with `JSON.stringify(value, replacer, indent)`. The
 * replacer intervenes only where `JSON.stringify` would throw — a reference back to an object on
 * the active ancestor path becomes `"[Circular]"`, and a `BigInt` becomes `"123n"` — so every value
 * `JSON.stringify` rendered without throwing renders byte-identically, up to `maxLength`. That
 * includes its treatment of `undefined`, functions and symbols, `toJSON`, class instances, `Map`s
 * and boxed primitives.
 *
 * Where `JSON.stringify` would produce no text at all (a top-level `undefined`, function or
 * symbol), or still throws (a throwing getter, Proxy trap or `toJSON`, or a graph too deep for the
 * stack), a fallback renderer produces readable text instead:
 * - a reference back to an ancestor renders as `[Circular]`;
 * - a `BigInt` renders as `123n`, a symbol as `Symbol(description)`, a function as
 *   `[Function name]`, and `undefined` as `undefined`;
 * - a class instance renders its own enumerable properties behind its constructor name, as in
 *   `Socket {"connecting":false,…}`; typed arrays render their elements, as in `Uint8Array [1,2]`;
 * - a property whose getter or Proxy trap throws renders as `[Unreadable]`, as does an object
 *   whose shape cannot be read at all;
 * - containers nested deeper than `maxDepth` are elided.
 * The fallback does not invoke `toJSON`, since that may be what threw.
 *
 * **What runs.** Like `JSON.stringify`, the first attempt invokes getters, Proxy traps and
 * `toJSON`; the fallback invokes getters and Proxy traps. Any error they throw is contained. The
 * {@link IFormatValueForMessageOptions.style | `'string'` style} invokes `toString` /
 * `Symbol.toPrimitive` instead.
 *
 * **Cost.** Output longer than `maxLength` is cut and ends with `…`. Both renderers stop once the
 * output is known to exceed `maxLength`, so the work is proportional to `maxLength` plus any members
 * `JSON.stringify` omits (an `undefined` or function property), which are capped by a call budget of
 * fifty per character of `maxLength` (at least 10 000). A value whose walk exceeds that budget is
 * rendered by the fallback.
 *
 * @param value - The value to render.
 * @param options - Optional {@link IFormatValueForMessageOptions | formatting options}.
 * @returns The rendered text.
 * @public
 */
export function formatValueForMessage(value: unknown, options?: IFormatValueForMessageOptions): string {
  try {
    const requestedLength: unknown = options?.maxLength;
    const maxLength = _optionOrDefault(requestedLength, 1, DEFAULT_FORMAT_VALUE_MAX_LENGTH);
    if (options?.style === 'string') {
      const text = _stringOrUndefined(value);
      if (text !== undefined) {
        return _truncate(
          text,
          requestedLength === undefined ? DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH : maxLength
        );
      }
    }
    const indent = Math.min(10, _optionOrDefault(options?.indent, 0, 0));
    const json = _stringifyOrUndefined(value, indent, maxLength);
    if (json !== undefined) {
      return _truncate(json, maxLength);
    }
    const maxDepth = _optionOrDefault(options?.maxDepth, 0, DEFAULT_FORMAT_VALUE_MAX_DEPTH);
    const writer = new MessageValueWriter(maxLength, maxDepth, ' '.repeat(indent));
    writer.value(value, 0, '');
    return writer.text();
  } catch {
    // reads of the value are contained where they happen; this catches what is left — options
    // whose accessors throw, or exhausting the stack or string length once the bounds are lifted
    return UNREADABLE;
  }
}
