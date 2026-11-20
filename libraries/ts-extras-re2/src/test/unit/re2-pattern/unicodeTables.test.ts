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
import { RE2JS, RE2Set } from 're2js';
// eslint-disable-next-line @rushstack/packlets/mechanics -- the allow-list is internal; this test ties it to both engines
import { ECMA_RE2_SCRIPTS } from '../../../packlets/re2-pattern/ecmaPattern';
import { re2PatternValidator } from '../../../index';

/**
 * Builds the host engine's reading of a property escape. The names come from the frozen allow-list
 * or from the literals below, never from input, so this cannot be a ReDoS vector.
 */
function ecma(source: string): RegExp {
  // eslint-disable-next-line @rushstack/security/no-unsafe-regexp -- property escapes from fixed test names, not input
  return new RegExp(source, 'u');
}

/** Every BMP code point and every 13th astral one: every allowed script has members in it. */
const SAMPLE: readonly string[] = (() => {
  const result: string[] = [];
  for (let cp = 0; cp <= 0x10ffff; cp += cp < 0x10000 ? 1 : 13) {
    result.push(String.fromCodePoint(cp));
  }
  return result;
})();

const ECMA_UNASSIGNED: RegExp = /^\p{Cn}$/u;
const RE2_UNASSIGNED: RE2JS = RE2JS.compile('^\\p{Cn}$');

/** A code point one engine has not assigned yet: Unicode-version skew, not a reading difference. */
function unassignedInEither(ch: string): boolean {
  return ECMA_UNASSIGNED.test(ch) || RE2_UNASSIGNED.test(ch);
}

describe('the Script allow-list', () => {
  test('is non-trivial and holds the common scripts', () => {
    expect(ECMA_RE2_SCRIPTS.size).toBeGreaterThan(150);
    for (const name of ['Latin', 'Greek', 'Han', 'Arabic', 'Cyrillic', 'Common', 'Inherited']) {
      expect(ECMA_RE2_SCRIPTS.has(name)).toBe(true);
    }
  });

  test('every name compiles as a Script in the host ECMA engine and as a script in re2js', () => {
    const failures = [...ECMA_RE2_SCRIPTS].filter((name) => {
      try {
        ecma(`\\p{Script=${name}}`);
        RE2JS.compile(`\\p{${name}}`);
        return false;
      } catch {
        return true;
      }
    });
    expect(failures).toEqual([]);
  });

  test('every name selects the same assigned code points in both engines — it is a script in re2js, not a category or binary property', () => {
    // One RE2Set pass per code point: re2js reports which allowed script, if any, holds it.
    const names = [...ECMA_RE2_SCRIPTS];
    const re2Set = new RE2Set(RE2Set.ANCHOR_BOTH);
    names.forEach((name) => re2Set.add(`\\p{${name}}`));
    re2Set.compile();
    const host = names.map((name) => ecma(`^\\p{Script=${name}}$`));
    const members = names.map(() => 0);
    const disagreements: string[] = [];
    for (const ch of SAMPLE) {
      const hostIndex = host.findIndex((re) => re.test(ch));
      if (hostIndex >= 0) {
        members[hostIndex]++;
      }
      const re2Indexes = re2Set.match(ch);
      const agrees =
        hostIndex < 0 ? re2Indexes.length === 0 : re2Indexes.length === 1 && re2Indexes[0] === hostIndex;
      if (!agrees && !unassignedInEither(ch)) {
        disagreements.push(`U+${ch.codePointAt(0)!.toString(16)}`);
      }
    }
    expect(disagreements).toEqual([]);
    expect(names.filter((__name, i) => members[i] === 0)).toEqual([]);
  });

  test.each(['Beria_Erfe', 'Sidetic', 'Tai_Yo', 'Tolong_Siki'])(
    'the Unicode 17 script %s, which re2js knows and Unicode 16 ECMA engines reject, is refused',
    (name) => {
      expect(re2PatternValidator(`\\p{Script=${name}}`)).toFailWith(
        /not a script name both ECMA-262 and RE2 accept/
      );
      expect(re2PatternValidator(`\\p{sc=${name}}`)).toFailWith(/not a script name both/);
      expect(() => RE2JS.compile(`\\p{${name}}`)).not.toThrow();
    }
  );

  test.each(['Emoji', 'Alphabetic', 'Any', 'Assigned', 'Lu', 'Letter', 'Grek', 'Nonexistent'])(
    '%s is not an allowed script',
    (name) => {
      expect(re2PatternValidator(`\\p{Script=${name}}`)).toFailWith(/not a script name both/);
    }
  );
});

describe('General_Category tables', () => {
  // re2js's tables are Unicode 17. These pin what re2js says where the engines are known to
  // disagree, independent of the host, so a re2js bump that changes them fails here.
  test('U+0295 is Lo in re2js (it is Ll in Unicode 16 ECMA engines)', () => {
    const ch = 'ʕ';
    expect(RE2JS.compile('^\\p{Lo}$').test(ch)).toBe(true);
    expect(RE2JS.compile('^\\p{Ll}$').test(ch)).toBe(false);
    expect(RE2JS.compile('^\\p{LC}$').test(ch)).toBe(false);
  });

  test('a Unicode 17 assignment (U+A7CE) is a letter to re2js', () => {
    expect(RE2JS.compile('^\\p{L}$').test('꟎')).toBe(true);
    expect(RE2JS.compile('^\\p{Cn}$').test('꟎')).toBe(false);
  });

  // The host-side sweep is only meaningful against the Unicode version it was recorded on.
  const onUnicode16 = process.versions.unicode === '16.0' ? describe : describe.skip;

  onUnicode16('against a Unicode 16 host, every difference is version skew except U+0295', () => {
    test.each([
      ['L', []],
      ['Ll', [0x295]],
      ['LC', [0x295]],
      ['Lo', [0x295]],
      ['Cn', []]
    ])('\\p{%s}', (category, reclassified) => {
      const host = ecma(`^\\p{${category}}$`);
      const re2 = RE2JS.compile(`^\\p{${category}}$`);
      const differences = SAMPLE.filter((ch) => host.test(ch) !== re2.test(ch));
      const notSkew = differences
        .filter((ch) => !(ECMA_UNASSIGNED.test(ch) && !RE2_UNASSIGNED.test(ch)))
        .map((ch) => ch.codePointAt(0));
      expect(notSkew).toEqual(reclassified);
    });
  });
});
