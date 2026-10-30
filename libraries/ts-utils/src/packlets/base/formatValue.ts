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
   * Number of spaces used to indent nested members, with the same meaning (and the same clamp to
   * 0–10) as the `space` argument of `JSON.stringify`. Default `0` (compact).
   */
  readonly indent?: number;

  /**
   * How to render the value:
   * - `'json'` (default): the `JSON.stringify` rendering described at {@link formatValueForMessage}.
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
 * Default {@link IFormatValueForMessageOptions.maxLength | maximum length} used by
 * {@link formatValueForMessage} in the `'string'` style.
 * @public
 */
export const DEFAULT_FORMAT_VALUE_STRING_MAX_LENGTH: number = 1000;

const ELLIPSIS: string = '…';
const UNREADABLE: string = '[Unreadable]';
const CIRCULAR: string = '[Circular]';

/**
 * Thrown from the replacer to abandon `JSON.stringify` once the output is known to exceed the
 * length budget, so the caller renders with the bounded writer instead.
 */
const OVER_BUDGET: object = Object.freeze({});

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
 * A lower bound on the characters one replacer call adds to the output: the key and colon for an
 * object member, and the value's own minimum. A non-null object counts 1, the shortest it can render
 * (a boxed number). Escaping and indentation only add to it, so a running total above the budget
 * proves the result will be truncated.
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
      own = value === null ? 4 : 1;
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
 * `JSON.stringify` does, when it throws anyway (a throwing getter, Proxy trap or `toJSON`, or stack
 * exhaustion), or when the output is shown to exceed `maxLength`.
 */
function _stringifyOrUndefined(value: unknown, indent: number, maxLength: number): string | undefined {
  const ancestors: unknown[] = [];
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
    if (length > maxLength) {
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

/**
 * What one member serializes to once it has been read: its finished text, nothing at all (an
 * `undefined`, function or symbol, which `JSON.stringify` omits from an object and writes as `null`
 * in an array), or a container still to be walked.
 */
type Prepared =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'omit'; readonly value: unknown }
  | { readonly kind: 'container'; readonly value: object };

const UNREADABLE_TEXT: Prepared = Object.freeze({ kind: 'text', text: UNREADABLE });

/**
 * Reads `JSON.rawJSON` text when the runtime supports it; `undefined` otherwise.
 */
function _rawJsonText(value: object): string | undefined {
  const runtime = JSON as unknown as { isRawJSON?: (candidate: unknown) => boolean };
  /* c8 ignore next 3 - runtime-only: engines without JSON.isRawJSON (before ES2025) take the other side */
  if (runtime.isRawJSON === undefined) {
    return undefined;
  }
  return runtime.isRawJSON(value) ? String((value as { rawJSON?: unknown }).rawJSON) : undefined;
}

/**
 * The primitive a boxed `Number`, `String`, `Boolean` or `BigInt` holds, converted the way
 * `JSON.stringify` converts it, or the object itself when it is not boxed.
 */
function _unboxed(value: object): unknown {
  const probe = (valueOf: () => unknown): boolean => {
    try {
      valueOf.call(value);
      return true;
    } catch {
      return false;
    }
  };
  if (probe(Number.prototype.valueOf)) {
    return Number(value);
  }
  if (probe(String.prototype.valueOf)) {
    return String(value);
  }
  if (probe(Boolean.prototype.valueOf)) {
    return Boolean.prototype.valueOf.call(value);
  }
  if (probe(BigInt.prototype.valueOf)) {
    return BigInt.prototype.valueOf.call(value);
  }
  return value;
}

/**
 * A reimplementation of `JSON.stringify`'s serialization, with the same replacer behaviour as the
 * fast path, that contains every read of caller code and stops writing once the output exceeds the
 * length budget. Used when `JSON.stringify` throws or is abandoned for length, so that up to the cut
 * the text is what `JSON.stringify` would have produced.
 */
class JsonFallbackWriter {
  private readonly _parts: string[] = [];
  private _length: number = 0;
  private readonly _ancestors: object[] = [];
  private readonly _maxLength: number;
  private readonly _gap: string;

  public constructor(maxLength: number, gap: string) {
    this._maxLength = maxLength;
    this._gap = gap;
  }

  public get full(): boolean {
    return this._length > this._maxLength;
  }

  public text(): string {
    return _truncate(this._parts.join(''), this._maxLength);
  }

  public root(value: unknown): void {
    const prepared = this._prepare(value, '');
    if (prepared.kind === 'omit') {
      this._write(JsonFallbackWriter._token(prepared.value));
    } else {
      this._emit(prepared, '');
    }
  }

  private _write(text: string): void {
    if (!this.full) {
      this._parts.push(text);
      this._length += text.length;
    }
  }

  /**
   * Applies `toJSON`, the replacer's two substitutions and boxed-primitive unwrapping to a value
   * already read, exactly as `SerializeJSONProperty` does.
   */
  private _prepare(read: unknown, key: string): Prepared {
    let value = read;
    try {
      if ((typeof value === 'object' && value !== null) || typeof value === 'bigint') {
        const toJson: unknown = (value as { toJSON?: unknown }).toJSON;
        if (typeof toJson === 'function') {
          value = toJson.call(value, key);
        }
      }
      if (typeof value === 'bigint') {
        return { kind: 'text', text: JSON.stringify(`${value}n`) };
      }
      if (typeof value === 'object' && value !== null) {
        if (this._ancestors.includes(value)) {
          return { kind: 'text', text: JSON.stringify(CIRCULAR) };
        }
        const raw = _rawJsonText(value);
        if (raw !== undefined) {
          return { kind: 'text', text: raw };
        }
        value = _unboxed(value);
      }
    } catch {
      return UNREADABLE_TEXT;
    }
    switch (typeof value) {
      case 'string':
        // escaping only lengthens a string, so a prefix one past the budget renders identically
        // up to the cut and bounds the cost of a very long string
        return {
          kind: 'text',
          text: JSON.stringify(value.length > this._maxLength ? value.slice(0, this._maxLength) : value)
        };
      case 'number':
      case 'boolean':
        return { kind: 'text', text: JSON.stringify(value) };
      case 'bigint':
        // a boxed BigInt, which JSON.stringify would refuse
        return { kind: 'text', text: JSON.stringify(`${value}n`) };
      case 'object':
        return value === null ? { kind: 'text', text: 'null' } : { kind: 'container', value };
      default:
        return { kind: 'omit', value };
    }
  }

  private _emit(prepared: Exclude<Prepared, { kind: 'omit' }>, indent: string): void {
    if (prepared.kind === 'text') {
      this._write(prepared.text);
      return;
    }
    const value = prepared.value;
    let isArray: boolean;
    let keys: readonly string[] = [];
    let length = 0;
    try {
      isArray = Array.isArray(value);
      if (isArray) {
        const raw = Number((value as { length?: unknown }).length);
        length = Number.isNaN(raw) ? 0 : Math.min(Math.max(Math.floor(raw), 0), Number.MAX_SAFE_INTEGER);
      } else {
        keys = Object.keys(value);
      }
    } catch {
      this._write(UNREADABLE);
      return;
    }
    const inner = `${indent}${this._gap}`;
    const separator = this._gap ? `,\n${inner}` : ',';
    const [open, close] = isArray ? ['[', ']'] : ['{', '}'];
    let written = 0;
    this._ancestors.push(value);
    const count = isArray ? length : keys.length;
    for (let i = 0; i < count && !this.full; i++) {
      const key = isArray ? String(i) : keys[i];
      let read: unknown;
      let prepared: Prepared;
      try {
        read = (value as Record<string, unknown>)[key];
        prepared = this._prepare(read, key);
      } catch {
        prepared = UNREADABLE_TEXT;
      }
      if (prepared.kind === 'omit' && !isArray) {
        continue;
      }
      this._write(written === 0 ? `${open}${this._gap ? `\n${inner}` : ''}` : separator);
      written++;
      if (!isArray) {
        this._write(`${JSON.stringify(key)}:${this._gap ? ' ' : ''}`);
      }
      if (prepared.kind === 'omit') {
        this._write('null');
      } else {
        this._emit(prepared, inner);
      }
    }
    this._ancestors.pop();
    this._write(written === 0 ? `${open}${close}` : `${this._gap ? `\n${indent}` : ''}${close}`);
  }

  /**
   * The readable token for a top-level value `JSON.stringify` renders as nothing.
   */
  private static _token(value: unknown): string {
    if (typeof value === 'function') {
      let name: unknown;
      try {
        name = (value as { name?: unknown }).name;
      } catch {
        name = undefined;
      }
      return `[Function ${typeof name === 'string' && name.length > 0 ? name : '(anonymous)'}]`;
    }
    return String(value);
  }
}

/**
 * Renders an arbitrary value as text for inclusion in a failure or diagnostic message. Never
 * throws.
 *
 * @remarks
 * **Compatibility:** the text is what `JSON.stringify(value, undefined, indent)` produces, cut to
 * `maxLength` with a trailing `…`, for every value `JSON.stringify` renders without throwing —
 * including its treatment of `undefined`, functions and symbols, `toJSON`, class instances, `Map`s,
 * typed arrays and boxed primitives. It departs from `JSON.stringify` only where `JSON.stringify`
 * would throw or produce nothing:
 * - a reference back to an object on the active ancestor path renders as `"[Circular]"`;
 * - a `BigInt` renders as `"123n"`;
 * - a value whose getter, Proxy trap or `toJSON` throws renders as `[Unreadable]`, in place;
 * - a top-level `undefined`, symbol or function renders as `undefined`, `Symbol(description)` or
 *   `[Function name]`.
 *
 * **How.** It calls `JSON.stringify` with a replacer that makes the first two substitutions. If that
 * still throws, or the output is shown to exceed `maxLength`, a reimplementation of the same
 * serialization renders instead, containing every read and stopping once the bound is reached.
 *
 * **What runs.** Like `JSON.stringify`, it invokes getters, Proxy traps and `toJSON`. When the first
 * attempt throws partway or is abandoned for length, the reimplementation walks the value again, so
 * a getter or `toJSON` can run twice; one with side effects can make the second walk differ from the
 * first. The {@link IFormatValueForMessageOptions.style | `'string'` style} invokes `toString` /
 * `Symbol.toPrimitive` instead.
 *
 * **Cost.** Proportional to `maxLength`, plus any members `JSON.stringify` omits (an `undefined` or
 * function property), which take no output space and so are not bounded by it. A graph nested more
 * deeply than the stack allows, with `maxLength` lifted, renders as `[Unreadable]`.
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
    const writer = new JsonFallbackWriter(maxLength, ' '.repeat(indent));
    writer.root(value);
    return writer.text();
  } catch {
    // reads of the value are contained where they happen; this catches what is left — options
    // whose accessors throw, or exhausting the stack or string length once the bound is lifted
    return UNREADABLE;
  }
}
