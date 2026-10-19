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

import { Result, fail, succeed } from '@fgv/ts-utils';

/**
 * An inclusive range of code points.
 */
type CodePointRange = readonly [number, number];

const MAX_CODE_POINT: number = 0x10ffff;

/** RE2's own limit on a repetition count; checked here so the refusal names the count. */
const MAX_REPEAT: number = 1000;

/** ECMA-262 `\d` — ASCII only, with or without `u`. */
const DIGIT: readonly CodePointRange[] = [[0x30, 0x39]];

/** ECMA-262 `\w` — ASCII only without the `i` flag, and a JSON Schema pattern carries no flags. */
const WORD: readonly CodePointRange[] = [
  [0x30, 0x39],
  [0x41, 0x5a],
  [0x5f, 0x5f],
  [0x61, 0x7a]
];

/**
 * ECMA-262 `\s`: WhiteSpace (TAB, VT, FF, SP, NBSP, ZWNBSP and the `Zs` category) plus
 * LineTerminator. RE2's own `\s` is only `[\t\n\f\r ]`, so it is never emitted.
 */
const SPACE: readonly CodePointRange[] = [
  [0x09, 0x0d],
  [0x20, 0x20],
  [0xa0, 0xa0],
  [0x1680, 0x1680],
  [0x2000, 0x200a],
  [0x2028, 0x2029],
  [0x202f, 0x202f],
  [0x205f, 0x205f],
  [0x3000, 0x3000],
  [0xfeff, 0xfeff]
];

/** ECMA-262 LineTerminator — what `.` excludes. RE2's own `.` excludes only `\n`. */
const LINE_TERMINATORS: readonly CodePointRange[] = [
  [0x0a, 0x0a],
  [0x0d, 0x0d],
  [0x2028, 0x2029]
];

/** The General_Category values both ECMA-262 and RE2 accept as a lone `\p{…}` name. */
const GENERAL_CATEGORY_LONG_NAMES: ReadonlyMap<string, string> = new Map([
  ['Other', 'C'],
  ['Control', 'Cc'],
  ['Format', 'Cf'],
  ['Unassigned', 'Cn'],
  ['Private_Use', 'Co'],
  ['Surrogate', 'Cs'],
  ['Letter', 'L'],
  ['Cased_Letter', 'LC'],
  ['Lowercase_Letter', 'Ll'],
  ['Modifier_Letter', 'Lm'],
  ['Other_Letter', 'Lo'],
  ['Titlecase_Letter', 'Lt'],
  ['Uppercase_Letter', 'Lu'],
  ['Mark', 'M'],
  ['Spacing_Mark', 'Mc'],
  ['Enclosing_Mark', 'Me'],
  ['Nonspacing_Mark', 'Mn'],
  ['Number', 'N'],
  ['Decimal_Number', 'Nd'],
  ['Letter_Number', 'Nl'],
  ['Other_Number', 'No'],
  ['Punctuation', 'P'],
  ['Connector_Punctuation', 'Pc'],
  ['Dash_Punctuation', 'Pd'],
  ['Close_Punctuation', 'Pe'],
  ['Final_Punctuation', 'Pf'],
  ['Initial_Punctuation', 'Pi'],
  ['Other_Punctuation', 'Po'],
  ['Open_Punctuation', 'Ps'],
  ['Symbol', 'S'],
  ['Currency_Symbol', 'Sc'],
  ['Modifier_Symbol', 'Sk'],
  ['Math_Symbol', 'Sm'],
  ['Other_Symbol', 'So'],
  ['Separator', 'Z'],
  ['Line_Separator', 'Zl'],
  ['Paragraph_Separator', 'Zp'],
  ['Space_Separator', 'Zs']
]);

const GENERAL_CATEGORY_SHORT_NAMES: ReadonlySet<string> = new Set(GENERAL_CATEGORY_LONG_NAMES.values());

/**
 * Names RE2 resolves in the same `\p{…}` namespace as its scripts that are **not** scripts. A
 * `Script=` value is emitted as a bare RE2 name, so one of these would silently become a binary
 * property or a category; they are refused instead. This list mirrors re2js's tables and is
 * reviewed on every re2js bump.
 */
const RE2_NON_SCRIPT_NAMES: ReadonlySet<string> = new Set([
  'Any',
  'Ascii',
  'Assigned',
  'Lc',
  'ASCII_Hex_Digit',
  'Alphabetic',
  'Dash',
  'Emoji',
  'Emoji_Component',
  'Emoji_Modifier',
  'Emoji_Modifier_Base',
  'Emoji_Presentation',
  'Extended_Pictographic',
  'Hex_Digit',
  'Lowercase',
  'Math',
  'Quotation_Mark',
  'Terminal_Punctuation',
  'Uppercase',
  'White_Space'
]);

const SYNTAX_CHARACTERS: string = '^$\\.*+?()[]{}|';

function _isDigit(cp: number | undefined): boolean {
  return cp !== undefined && cp >= 0x30 && cp <= 0x39;
}

function _isAsciiLetter(cp: number | undefined): boolean {
  return cp !== undefined && ((cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a));
}

function _hexValue(cp: number | undefined): number | undefined {
  if (cp === undefined) {
    return undefined;
  }
  if (_isDigit(cp)) {
    return cp - 0x30;
  }
  if (cp >= 0x41 && cp <= 0x46) {
    return cp - 0x41 + 10;
  }
  return cp >= 0x61 && cp <= 0x66 ? cp - 0x61 + 10 : undefined;
}

function _isLeadSurrogate(cp: number): boolean {
  return cp >= 0xd800 && cp <= 0xdbff;
}

function _isTrailSurrogate(cp: number): boolean {
  return cp >= 0xdc00 && cp <= 0xdfff;
}

/**
 * Whether every code point is an ASCII letter, digit or `_`, the first is not a digit, and (for a
 * property name) the first is not `_` either.
 */
function _isAsciiIdentifier(name: string, allowLeadingUnderscore: boolean): boolean {
  return (
    name.length > 0 &&
    Array.from(name, (ch) => ch.codePointAt(0)).every(
      (cp, i) =>
        _isAsciiLetter(cp) || (cp === 0x5f && (i > 0 || allowLeadingUnderscore)) || (i > 0 && _isDigit(cp))
    )
  );
}

/** One code point in RE2 syntax: ASCII letters and digits verbatim, everything else as `\x{…}`. */
function _literal(cp: number): string {
  return _isDigit(cp) || _isAsciiLetter(cp)
    ? String.fromCodePoint(cp)
    : `\\x{${cp.toString(16).toUpperCase()}}`;
}

function _complement(ranges: readonly CodePointRange[]): CodePointRange[] {
  const result: CodePointRange[] = [];
  let next = 0;
  for (const [lo, hi] of ranges) {
    if (lo > next) {
      result.push([next, lo - 1]);
    }
    next = hi + 1;
  }
  if (next <= MAX_CODE_POINT) {
    result.push([next, MAX_CODE_POINT]);
  }
  return result;
}

/** The body of an RE2 character class for the ranges, without brackets. */
function _rangesBody(ranges: readonly CodePointRange[]): string {
  return ranges.map(([lo, hi]) => (lo === hi ? _literal(lo) : `${_literal(lo)}-${_literal(hi)}`)).join('');
}

/** ECMA-262 `.`: any code point but a LineTerminator. */
const DOT: string = `[${_rangesBody(_complement(LINE_TERMINATORS))}]`;

/** An RE2 class matching nothing — what ECMA-262 `[]` means. */
const NOTHING: string = `[^${_rangesBody([[0, MAX_CODE_POINT]])}]`;

/** An RE2 class matching any code point — what ECMA-262 `[^]` means. */
const ANYTHING: string = `[${_rangesBody([[0, MAX_CODE_POINT]])}]`;

/**
 * One member of a character class: a single code point, which can be a range endpoint, or a set
 * (a class escape), which cannot.
 */
type ClassAtom =
  | { readonly kind: 'char'; readonly cp: number }
  | { readonly kind: 'set'; readonly body: string };

/**
 * Reads an ECMA-262 `u`-mode pattern and writes the RE2 pattern with the same meaning, or refuses.
 *
 * @remarks
 * A single left-to-right pass. Every construct is either rewritten into RE2 syntax that matches
 * exactly what ECMA-262 matches, or refused; nothing is passed through on the assumption that the
 * two dialects agree. Annex B (non-`u`) leniencies are refused, as `u` mode refuses them.
 */
class EcmaPatternTranslator {
  private readonly _cps: readonly number[];
  private _pos: number = 0;
  private _depth: number = 0;
  private _quantifiable: boolean = false;
  private readonly _groupNames: Set<string> = new Set();

  public constructor(source: string) {
    // Each element of a string iterator is one whole code point, so it always has one.
    this._cps = Array.from(source, (ch) => ch.codePointAt(0)!);
  }

  public translate(): Result<string> {
    const parts: string[] = [];
    while (this._pos < this._cps.length) {
      const term = this._term();
      if (term.isFailure()) {
        return term;
      }
      parts.push(term.value);
    }
    if (this._depth > 0) {
      return fail('a group is not closed');
    }
    return succeed(parts.join(''));
  }

  private _peek(offset: number = 0): number | undefined {
    return this._cps[this._pos + offset];
  }

  /** Consumes one code point; -1 past the end. */
  private _next(): number {
    const cp = this._cps[this._pos] ?? -1;
    this._pos++;
    return cp;
  }

  private _describe(cp: number): string {
    return `'${String.fromCodePoint(cp)}' at index ${this._pos - 1}`;
  }

  private _term(): Result<string> {
    const cp = this._next();
    switch (String.fromCodePoint(cp)) {
      case '|':
        this._quantifiable = false;
        return succeed('|');
      case '^':
      case '$':
        this._quantifiable = false;
        return succeed(String.fromCodePoint(cp));
      case '(':
        return this._group();
      case ')':
        if (this._depth === 0) {
          return fail(`unmatched ${this._describe(cp)}`);
        }
        this._depth--;
        this._quantifiable = true;
        return succeed(')');
      case '[':
        return this._class();
      case '.':
        this._quantifiable = true;
        return succeed(DOT);
      case '\\':
        return this._atomEscape();
      case '*':
      case '+':
      case '?':
      case '{':
        return this._quantifier(cp);
      case '}':
      case ']':
        return fail(`unescaped ${this._describe(cp)} is not valid in a u-mode pattern`);
      default:
        this._quantifiable = true;
        return succeed(_literal(cp));
    }
  }

  private _quantifier(cp: number): Result<string> {
    if (!this._quantifiable) {
      return fail(`nothing to repeat before ${this._describe(cp)}`);
    }
    const body = cp === 0x7b ? this._braces() : succeed(String.fromCodePoint(cp));
    return body.onSuccess((quantifier) => {
      this._quantifiable = false;
      if (this._peek() === 0x3f) {
        this._pos++;
        return succeed(`${quantifier}?`);
      }
      return succeed(quantifier);
    });
  }

  /** Reads `{n}`, `{n,}` or `{n,m}` after its `{`; anything else is a lone `{`, which `u` refuses. */
  private _braces(): Result<string> {
    const start = this._pos - 1;
    const min = this._digits();
    let max: string | undefined = min;
    if (min !== undefined && this._peek() === 0x2c) {
      this._pos++;
      max = this._digits() ?? '';
    }
    if (min === undefined || this._next() !== 0x7d) {
      return fail(`'{' at index ${start} does not start a valid quantifier`);
    }
    const lo = Number(min);
    const hi = max === '' ? undefined : Number(max);
    if (lo > MAX_REPEAT || (hi !== undefined && hi > MAX_REPEAT)) {
      return fail(`the repetition count at index ${start} is over RE2's limit of ${MAX_REPEAT}`);
    }
    if (hi !== undefined && hi < lo) {
      return fail(`the quantifier at index ${start} is out of order`);
    }
    return succeed(hi === undefined ? `{${lo},}` : max === min ? `{${lo}}` : `{${lo},${hi}}`);
  }

  private _digits(): string | undefined {
    let digits = '';
    while (_isDigit(this._peek())) {
      digits += String.fromCodePoint(this._next());
    }
    return digits === '' ? undefined : digits;
  }

  private _group(): Result<string> {
    const start = this._pos - 1;
    this._quantifiable = false;
    if (this._peek() !== 0x3f) {
      this._depth++;
      return succeed('(');
    }
    const kind = String.fromCodePoint(this._peek(1) ?? 0x20) + String.fromCodePoint(this._peek(2) ?? 0x20);
    if (kind.startsWith(':')) {
      this._pos += 2;
      this._depth++;
      return succeed('(?:');
    }
    if (kind.startsWith('=') || kind.startsWith('!')) {
      return fail(`lookahead at index ${start} is not supported by RE2`);
    }
    if (kind === '<=' || kind === '<!') {
      return fail(`lookbehind at index ${start} is not supported by RE2`);
    }
    if (kind.startsWith('<')) {
      return this._namedGroup(start);
    }
    return fail(`unsupported group syntax at index ${start}`);
  }

  private _namedGroup(start: number): Result<string> {
    this._pos += 2;
    let name = '';
    while (this._peek() !== undefined && this._peek() !== 0x3e) {
      name += String.fromCodePoint(this._next());
    }
    if (this._next() !== 0x3e) {
      return fail(`the group name at index ${start} is not closed`);
    }
    if (!_isAsciiIdentifier(name, true)) {
      return fail(
        `group name ${JSON.stringify(
          name
        )} at index ${start}: only ASCII letters, digits and '_' are supported`
      );
    }
    if (this._groupNames.has(name)) {
      return fail(`duplicate group name ${JSON.stringify(name)} at index ${start}`);
    }
    this._groupNames.add(name);
    this._depth++;
    return succeed(`(?P<${name}>`);
  }

  private _atomEscape(): Result<string> {
    const start = this._pos - 1;
    const cp = this._peek();
    if (cp === undefined) {
      return fail(`trailing '\\' at index ${start}`);
    }
    if (cp === 0x62 || cp === 0x42) {
      // `\b` and `\B` are ASCII word boundaries in both dialects.
      this._pos++;
      this._quantifiable = false;
      return succeed(cp === 0x62 ? '\\b' : '\\B');
    }
    if (_isDigit(cp) && cp !== 0x30) {
      return fail(`backreference at index ${start} is not supported by RE2`);
    }
    if (cp === 0x6b) {
      return fail(`named backreference at index ${start} is not supported by RE2`);
    }
    if (cp === 0x2d) {
      return fail(`'\\-' at index ${start} is only valid inside a character class`);
    }
    this._quantifiable = true;
    return this._classEscape().onSuccess((atom) =>
      succeed(atom.kind === 'char' ? _literal(atom.cp) : `[${atom.body}]`)
    );
  }

  /**
   * Reads the escape after a `\`, as a single code point or a set. Shared by atoms and classes; the
   * class-only `\b` and `\-` are handled by the class reader.
   */
  private _classEscape(): Result<ClassAtom> {
    const start = this._pos - 1;
    const cp = this._next();
    switch (String.fromCodePoint(cp)) {
      case 'd':
        return succeed({ kind: 'set', body: _rangesBody(DIGIT) });
      case 'D':
        return succeed({ kind: 'set', body: _rangesBody(_complement(DIGIT)) });
      case 'w':
        return succeed({ kind: 'set', body: _rangesBody(WORD) });
      case 'W':
        return succeed({ kind: 'set', body: _rangesBody(_complement(WORD)) });
      case 's':
        return succeed({ kind: 'set', body: _rangesBody(SPACE) });
      case 'S':
        return succeed({ kind: 'set', body: _rangesBody(_complement(SPACE)) });
      case 'p':
      case 'P':
        return this._property(cp === 0x50, start).onSuccess((body) => succeed({ kind: 'set', body }));
      default:
        return this._characterEscape(cp, start).onSuccess((value) => succeed({ kind: 'char', cp: value }));
    }
  }

  private _characterEscape(cp: number, start: number): Result<number> {
    switch (String.fromCodePoint(cp)) {
      case 'f':
        return succeed(0x0c);
      case 'n':
        return succeed(0x0a);
      case 'r':
        return succeed(0x0d);
      case 't':
        return succeed(0x09);
      case 'v':
        return succeed(0x0b);
      case 'c': {
        const letter = this._next();
        return _isAsciiLetter(letter)
          ? succeed(letter % 32)
          : fail(`'\\c' at index ${start} must be followed by an ASCII letter`);
      }
      case '0':
        return _isDigit(this._peek())
          ? fail(`octal escape at index ${start} is not valid in a u-mode pattern`)
          : succeed(0);
      case 'x': {
        const value = this._hex(2);
        return value === undefined
          ? fail(`'\\x' at index ${start} must be followed by two hex digits`)
          : succeed(value);
      }
      case 'u':
        return this._unicodeEscape(start);
      default:
        return SYNTAX_CHARACTERS.includes(String.fromCodePoint(cp)) || cp === 0x2f
          ? succeed(cp)
          : fail(`invalid escape '\\${String.fromCodePoint(cp)}' at index ${start}`);
    }
  }

  /** Reads exactly `count` hex digits, consuming them only if all are present. */
  private _hex(count: number): number | undefined {
    let value = 0;
    for (let i = 0; i < count; i++) {
      const digit = _hexValue(this._peek(i));
      if (digit === undefined) {
        return undefined;
      }
      value = value * 16 + digit;
    }
    this._pos += count;
    return value;
  }

  /** `\uHHHH` (a surrogate pair of them is one code point, as in `u` mode) or `\u{H…}`. */
  private _unicodeEscape(start: number): Result<number> {
    if (this._peek() === 0x7b) {
      this._pos++;
      let value = 0;
      let digits = 0;
      for (let digit = _hexValue(this._peek()); digit !== undefined; digit = _hexValue(this._peek())) {
        value = value * 16 + digit;
        digits++;
        this._pos++;
        if (value > MAX_CODE_POINT) {
          return fail(`'\\u{…}' at index ${start} is above U+10FFFF`);
        }
      }
      return digits > 0 && this._next() === 0x7d
        ? succeed(value)
        : fail(`'\\u{' at index ${start} must be followed by hex digits and '}'`);
    }
    const lead = this._hex(4);
    if (lead === undefined) {
      return fail(`'\\u' at index ${start} must be followed by four hex digits or '{…}'`);
    }
    if (_isLeadSurrogate(lead) && this._peek() === 0x5c && this._peek(1) === 0x75) {
      const save = this._pos;
      this._pos += 2;
      const trail = this._hex(4);
      if (trail !== undefined && _isTrailSurrogate(trail)) {
        return succeed(0x10000 + ((lead - 0xd800) << 10) + (trail - 0xdc00));
      }
      this._pos = save;
    }
    return succeed(lead);
  }

  /** Reads `{name}` or `{key=value}` after `\p` or `\P`, and returns its RE2 class body. */
  private _property(negated: boolean, start: number): Result<string> {
    if (this._next() !== 0x7b) {
      return fail(`'\\p' at index ${start} must be followed by '{'`);
    }
    let text = '';
    while (this._peek() !== undefined && this._peek() !== 0x7d) {
      text += String.fromCodePoint(this._next());
    }
    if (this._next() !== 0x7d) {
      return fail(`the property at index ${start} is not closed`);
    }
    return this._propertyName(text)
      .withErrorFormat((msg) => `Unicode property {${text}} at index ${start}: ${msg}`)
      .onSuccess((name) => succeed(`\\${negated ? 'P' : 'p'}{${name}}`));
  }

  private _propertyName(text: string): Result<string> {
    const [key, value, ...rest] = text.split('=');
    if (
      rest.length > 0 ||
      !_isAsciiIdentifier(key, false) ||
      (value !== undefined && !_isAsciiIdentifier(value, false))
    ) {
      return fail('malformed property');
    }
    if (value === undefined) {
      return _generalCategory(key).onFailure(() =>
        fail('only General_Category values are supported as a lone name; binary properties are refused')
      );
    }
    if (key === 'General_Category' || key === 'gc') {
      return _generalCategory(value);
    }
    if (key === 'Script' || key === 'sc') {
      return GENERAL_CATEGORY_SHORT_NAMES.has(value) ||
        GENERAL_CATEGORY_LONG_NAMES.has(value) ||
        RE2_NON_SCRIPT_NAMES.has(value)
        ? fail(`'${value}' is not a script`)
        : succeed(value);
    }
    return fail(`only General_Category and Script are supported, not '${key}'`);
  }

  private _class(): Result<string> {
    const start = this._pos - 1;
    const negated = this._peek() === 0x5e;
    if (negated) {
      this._pos++;
    }
    const items: string[] = [];
    while (this._peek() !== 0x5d) {
      if (this._peek() === undefined) {
        return fail(`the character class at index ${start} is not closed`);
      }
      const item = this._classRange();
      if (item.isFailure()) {
        return item;
      }
      items.push(item.value);
    }
    this._pos++;
    this._quantifiable = true;
    if (items.length === 0) {
      return succeed(negated ? ANYTHING : NOTHING);
    }
    return succeed(`[${negated ? '^' : ''}${items.join('')}]`);
  }

  /** One class atom, or a range `a-b` between two single code points. */
  private _classRange(): Result<string> {
    return this._classAtom().onSuccess((lo) => {
      if (this._peek() !== 0x2d || this._peek(1) === 0x5d || this._peek(1) === undefined) {
        return succeed(lo.kind === 'char' ? _literal(lo.cp) : lo.body);
      }
      const dash = this._pos;
      this._pos++;
      return this._classAtom().onSuccess((hi) => {
        if (lo.kind !== 'char' || hi.kind !== 'char') {
          return fail(`the range at index ${dash} has a class escape as an endpoint`);
        }
        return hi.cp < lo.cp
          ? fail(`the range at index ${dash} is out of order`)
          : succeed(`${_literal(lo.cp)}-${_literal(hi.cp)}`);
      });
    });
  }

  private _classAtom(): Result<ClassAtom> {
    const cp = this._next();
    if (cp !== 0x5c) {
      return succeed({ kind: 'char', cp });
    }
    const escaped = this._peek();
    if (escaped === 0x62) {
      this._pos++;
      return succeed({ kind: 'char', cp: 0x08 });
    }
    if (escaped === 0x2d) {
      this._pos++;
      return succeed({ kind: 'char', cp: 0x2d });
    }
    if (escaped === undefined) {
      return fail(`trailing '\\' at index ${this._pos - 1}`);
    }
    return this._classEscape();
  }
}

function _generalCategory(name: string): Result<string> {
  if (GENERAL_CATEGORY_SHORT_NAMES.has(name)) {
    return succeed(name);
  }
  const short = GENERAL_CATEGORY_LONG_NAMES.get(name);
  return short === undefined ? fail(`'${name}' is not a General_Category value`) : succeed(short);
}

/**
 * Rewrites an ECMA-262 `u`-mode pattern source as an RE2 pattern with the same meaning, or refuses
 * it with the reason.
 * @param source - The pattern, as a JSON Schema states it.
 * @returns The RE2 source, or a failure naming the construct and its index.
 * @internal
 */
export function translateEcmaPattern(source: string): Result<string> {
  return new EcmaPatternTranslator(source).translate();
}
