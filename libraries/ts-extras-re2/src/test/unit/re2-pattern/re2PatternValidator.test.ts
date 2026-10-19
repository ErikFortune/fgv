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
import { JsonSchema } from '@fgv/ts-json-base';
import { DEFAULT_RE2_PATTERN_LIMITS, createRe2PatternValidator, re2PatternValidator } from '../../../index';

/** Compiles a pattern the test expects to be admitted. */
function compiled(source: string): JsonSchema.SchemaPatternPredicate {
  return re2PatternValidator(source).orThrow();
}

/** Every code point in the BMP, and every 251st astral one — enough to see a set's shape. */
const CODE_POINTS: readonly string[] = (() => {
  const result: string[] = [];
  for (let cp = 0; cp <= 0x10ffff; cp += cp < 0x10000 ? 1 : 251) {
    result.push(String.fromCodePoint(cp));
  }
  return result;
})();

describe('re2PatternValidator', () => {
  describe('search semantics', () => {
    test('an unanchored pattern matches anywhere in the value, as JSON Schema pattern does', () => {
      const abc = compiled('abc');
      expect(abc('xxabcxx')).toBe(true);
      expect(abc('abc')).toBe(true);
      expect(abc('ab')).toBe(false);
    });

    test('^…$ anchors to the whole value', () => {
      const abc = compiled('^abc$');
      expect(abc('abc')).toBe(true);
      expect(abc('xxabcxx')).toBe(false);
      expect(abc('abc\n')).toBe(false);
    });

    test('$ is the end of input, never before a trailing newline', () => {
      expect(compiled('x$')('x\n')).toBe(false);
      expect(compiled('^x')('\nx')).toBe(false);
    });

    test('an unescaped / and other non-syntax punctuation are literals', () => {
      expect(compiled('^a/b#c d,e"f$')('a/b#c d,e"f')).toBe(true);
    });

    test('the empty pattern matches every string', () => {
      expect(compiled('')('')).toBe(true);
      expect(compiled('')('anything')).toBe(true);
    });

    test('alternation, groups, named groups and lazy quantifiers', () => {
      expect(compiled('^(?:cat|dog)s?$')('dogs')).toBe(true);
      expect(compiled('^(?:cat|dog)s?$')('cow')).toBe(false);
      expect(compiled('^(?<year>\\d{4})-(\\d{2})$')('2026-10')).toBe(true);
      expect(compiled('^a+?b*?c??$')('aac')).toBe(true);
      expect(compiled('^a{2,}$')('aaaa')).toBe(true);
      expect(compiled('^a{2,3}$')('aaaa')).toBe(false);
      expect(compiled('^a{2,2}$')('aa')).toBe(true);
      expect(compiled('^a{002}$')('aa')).toBe(true);
      expect(compiled('a|')('zzz')).toBe(true);
      expect(compiled('^()$')('')).toBe(true);
    });

    test('\\b and \\B are ASCII word boundaries', () => {
      expect(compiled('\\bfoo\\b')('a foo b')).toBe(true);
      expect(compiled('\\bfoo\\b')('afoob')).toBe(false);
      expect(compiled('\\Boo\\B')('afoob')).toBe(true);
      expect(compiled('\\bé')(' é')).toBe(false);
    });
  });

  describe('catastrophic-backtracking classics complete on long inputs', () => {
    // Asserted by operation, not wall clock: each input is proven long, and each predicate call
    // returns its answer. A backtracking engine would not return from any of these.
    const LONG = 100_000;

    test.each([
      ['(a+)+$', `${'a'.repeat(LONG)}!`, false],
      ['^(a|a)*$', `${'a'.repeat(LONG)}!`, false],
      ['(.*a){20}', `${'a'.repeat(19)}${'b'.repeat(LONG)}`, false],
      ['(.*a){20}', `${'b'.repeat(LONG)}${'a'.repeat(20)}`, true],
      ['(x+x+)+y', 'x'.repeat(LONG), false],
      ['^\\d+\\d+\\d+\\d+\\d+$', `${'1'.repeat(LONG)}x`, false],
      ['^(\\w+\\s?)*$', `${'word '.repeat(LONG / 5)}!`, false]
    ])('%s', (source, input, expected) => {
      expect(input.length).toBeGreaterThanOrEqual(LONG);
      expect(re2PatternValidator(source)).toSucceedAndSatisfy((matches) => {
        expect(matches(input)).toBe(expected);
      });
    });
  });

  describe('ECMA-262 u-mode semantics, where RE2 differs', () => {
    test('. excludes every ECMA-262 line terminator, and matches a whole astral code point', () => {
      const one = compiled('^.$');
      expect(['\n', '\r', '\u2028', '\u2029'].map(one)).toEqual([false, false, false, false]);
      expect(one('😀')).toBe(true);
      expect(one('\u0085')).toBe(true);
    });

    test('[] matches nothing, and [^] matches any code point, newlines included', () => {
      expect(['', 'a', '\n'].map(compiled('[]'))).toEqual([false, false, false]);
      expect(['a', '\n', '😀'].map(compiled('^[^]$'))).toEqual([true, true, true]);
    });

    test('control characters are matched by hex escape, in and out of a class', () => {
      expect(['\u0000', '\u001f', ' '].map(compiled('^[\\x00-\\x1f]$'))).toEqual([true, true, false]);
      expect(compiled('^\\x00\\u001F$')('\u0000\u001f')).toBe(true);
    });

    test('\\s is the ECMA-262 whitespace set, not RE2\u2019s ASCII one', () => {
      const space = compiled('^\\s$');
      expect(['\u00a0', '\ufeff', '\u3000', '\u000b', '\u2028'].map(space)).toEqual([
        true,
        true,
        true,
        true,
        true
      ]);
      expect(space('\u0085')).toBe(false);
    });

    test('\\d and \\w are ASCII, as in ECMA-262 without the i flag', () => {
      expect(compiled('\\d')('\u0663')).toBe(false);
      expect(compiled('\\w')('é')).toBe(false);
      expect(compiled('\\W')('\u212a')).toBe(true);
    });

    test.each([
      ['^\\s$', /^\s$/u],
      ['^\\S$', /^\S$/u],
      ['^.$', /^.$/u],
      ['^\\d$', /^\d$/u],
      ['^\\D$', /^\D$/u],
      ['^\\w$', /^\w$/u],
      ['^\\W$', /^\W$/u],
      ['^[\\s]$', /^[\s]$/u],
      ['^[^\\s]$', /^[^\s]$/u],
      ['^[\\S]$', /^[\S]$/u],
      ['^[\\D]$', /^[\D]$/u],
      ['^[^\\W]$', /^[^\W]$/u],
      ['^[\\s\\S]$', /^[\s\S]$/u],
      ['^[^]$', /^[^]$/u]
    ])('%s agrees with the ECMA-262 engine over the code point space', (source, ecma) => {
      expect(ecma.source).toBe(source);
      const matches = compiled(source);
      expect(CODE_POINTS.filter((ch) => matches(ch) !== ecma.test(ch))).toEqual([]);
    });

    test.each([
      ['^[a-]$', /^[a-]$/u, ['a', '-', 'b']],
      ['^[-a]$', /^[-a]$/u, ['a', '-', 'b']],
      ['^[a-c-e]$', /^[a-c-e]$/u, ['b', '-', 'd', 'e']],
      ['^[\\-a]$', /^[\-a]$/u, ['-', 'a', '\\']],
      ['^[[:a]$', /^[[:a]$/u, ['[', ':', 'a', 'l']],
      ['^[\\b]$', /^[\b]$/u, ['\b', 'b']],
      ['^\\cJ\\ca$', /^\cJ\ca$/u, ['\n\u0001', 'cJ']],
      ['^\\0$', /^\0$/u, ['\0', '0']],
      ['^\\x41\\u0042\\u{43}$', /^\x41\u0042\u{43}$/u, ['ABC', 'abc']],
      ['^\\f\\n\\r\\t\\v$', /^\f\n\r\t\v$/u, ['\f\n\r\t\v']],
      [
        '^\\/\\.\\*\\+\\?\\(\\)\\[\\]\\{\\}\\|\\^\\$\\\\$',
        /^\/\.\*\+\?\(\)\[\]\{\}\|\^\$\\$/u,
        ['/.*+?()[]{}|^$\\']
      ],
      ['^[^a]$', /^[^a]$/u, ['😀', 'a', '\uD800']],
      ['^\\uD83D\\uDE00$', /^\uD83D\uDE00$/u, ['😀', '\uD83D\uDE00\uD83D']],
      ['^\\uD83D$', /^\uD83D$/u, ['\uD83D', '😀']],
      ['^\\uD83D\\u0041$', /^\uD83D\u0041$/u, ['\uD83DA']],
      ['^[\\u{1F600}-\\u{1F64F}]+$', /^[\u{1F600}-\u{1F64F}]+$/u, ['😀🙏', '😀a']],
      ['^[\\x21-\\x2f]$', /^[\x21-\x2f]$/u, ['!', '/', ' ', '0']],
      ['^\\p{L}+$', /^\p{L}+$/u, ['héllo', 'h3llo']],
      ['^\\p{Lu}\\P{Lu}$', /^\p{Lu}\P{Lu}$/u, ['Ab', 'AB']],
      ['^[\\p{Nd}_]+$', /^[\p{Nd}_]+$/u, ['12_3', '\u0663', 'a']],
      ['^[^\\p{L}]$', /^[^\p{L}]$/u, ['1', 'a']],
      ['^\\p{Letter}$', /^\p{Letter}$/u, ['a', '1']],
      ['^\\p{Cased_Letter}$', /^\p{Cased_Letter}$/u, ['a', '\u01c5', '\u05d0']],
      ['^\\p{gc=Lu}$', /^\p{gc=Lu}$/u, ['A', 'a']],
      ['^\\p{General_Category=Uppercase_Letter}$', /^\p{General_Category=Uppercase_Letter}$/u, ['A', 'a']],
      ['^\\p{Script=Greek}+$', /^\p{Script=Greek}+$/u, ['αβγ', 'abc']],
      ['^\\p{sc=Han}$', /^\p{sc=Han}$/u, ['中', 'a']],
      ['^\\P{sc=Latin}$', /^\P{sc=Latin}$/u, ['a', 'α']],
      ['^\\p{Script=Old_Italic}$', /^\p{Script=Old_Italic}$/u, ['\u{10300}', 'a']]
    ])('%s reads as ECMA-262 does', (source, ecma, inputs) => {
      expect(ecma.source).toBe(source);
      const matches = compiled(source);
      expect(inputs.map(matches)).toEqual(inputs.map((input) => ecma.test(input)));
    });
  });

  describe('refusals', () => {
    test.each([
      ['(?=a)a', /lookahead at index 0/],
      ['a(?!b)', /lookahead at index 1/],
      ['(?<=a)b', /lookbehind at index 0/],
      ['(?<!a)b', /lookbehind/],
      ['(a)\\1', /backreference at index 3/],
      ['\\9', /backreference/],
      ['(?<n>a)\\k<n>', /named backreference/],
      ['(?i)a', /unsupported group syntax/],
      ['(?i:a)', /unsupported group syntax/],
      ['(?P<n>a)', /unsupported group syntax/],
      ['(?', /unsupported group syntax/],
      ['(?<1a>x)', /group name "1a".*only ASCII/],
      ['(?<a$>x)', /group name "a\$"/],
      ['(?<é>x)', /group name "é"/],
      ['(?<>x)', /group name ""/],
      ['(?<a>x)(?<a>y)', /duplicate group name "a"/],
      ['(?<a', /group name at index 0 is not closed/],
      ['\\p{Alphabetic}', /only General_Category values.*binary properties are refused/],
      ['\\p{Greek}', /only General_Category values/],
      ['\\p{ASCII}', /only General_Category values/],
      ['\\p{Script=Emoji}', /'Emoji' is not a script/],
      ['\\p{sc=Lu}', /'Lu' is not a script/],
      ['\\p{sc=Letter}', /'Letter' is not a script/],
      ['\\p{Script=Any}', /'Any' is not a script/],
      ['\\p{gc=Greek}', /'Greek' is not a General_Category value/],
      ['\\p{Script_Extensions=Greek}', /only General_Category and Script are supported/],
      ['\\p{scx=Grek}', /only General_Category and Script are supported/],
      ['\\p{Script=Grek}', /RE2 cannot compile it/],
      ['\\p{a=b=c}', /malformed property/],
      ['\\p{}', /malformed property/],
      ['\\p{_a}', /malformed property/],
      ['\\p{L', /property at index 0 is not closed/],
      ['\\pL', /must be followed by '\{'/],
      ['a{1001}', /over RE2's limit of 1000/],
      ['a{2,1001}', /over RE2's limit of 1000/],
      ['a{3,2}', /out of order/],
      ['(a{100}){100}', /RE2 cannot compile it/],
      ['{', /nothing to repeat/],
      ['a{', /does not start a valid quantifier/],
      ['a{x}', /does not start a valid quantifier/],
      ['a{1,x}', /does not start a valid quantifier/],
      ['a}', /unescaped '\}'/],
      ['a]', /unescaped '\]'/],
      ['[[:alpha:]]', /unescaped '\]' at index 10/],
      ['*a', /nothing to repeat before '\*' at index 0/],
      ['a**', /nothing to repeat/],
      ['^*', /nothing to repeat/],
      ['\\b+', /nothing to repeat/],
      ['(|+)', /nothing to repeat/],
      ['\\-', /only valid inside a character class/],
      ['\\e', /invalid escape '\\e'/],
      ['\\Q.\\E', /invalid escape '\\Q'/],
      ['\\z', /invalid escape '\\z'/],
      ['\\A', /invalid escape/],
      ['[\\B]', /invalid escape '\\B'/],
      ['\\01', /octal escape/],
      ['\\c1', /must be followed by an ASCII letter/],
      ['\\c', /must be followed by an ASCII letter/],
      ['\\x4', /two hex digits/],
      ['\\u12', /four hex digits/],
      ['\\u{110000}', /above U\+10FFFF/],
      ['\\u{}', /hex digits and '\}'/],
      ['\\u{41', /hex digits and '\}'/],
      ['a\\', /trailing '\\'/],
      ['[a\\', /trailing '\\'/],
      ['(a', /a group is not closed/],
      ['a)', /unmatched '\)' at index 1/],
      ['[a', /character class at index 0 is not closed/],
      ['[a-', /not closed/],
      ['[z-a]', /range at index 2 is out of order/],
      ['[\\d-z]', /class escape as an endpoint/],
      ['[a-\\w]', /class escape as an endpoint/]
    ])('%s is refused', (source, reason) => {
      expect(re2PatternValidator(source)).toFailWith(reason);
    });

    test('a refusal says why RE2 could not take it', () => {
      expect(re2PatternValidator('(?=a)')).toFailWith(/^RE2 cannot read it as ECMA-262 does: lookahead/);
    });

    test('a source over the length limit is refused before it is read', () => {
      const source = `${'a'.repeat(DEFAULT_RE2_PATTERN_LIMITS.maxSourceLength)}(?=`;
      expect(re2PatternValidator(source)).toFailWith(/1027 characters, over the limit of 1024/);
      expect(re2PatternValidator('a'.repeat(DEFAULT_RE2_PATTERN_LIMITS.maxSourceLength))).toSucceed();
    });

    test('a program over the size limit is refused', () => {
      expect(re2PatternValidator('a{1000}'.repeat(9))).toSucceed();
      expect(re2PatternValidator('a{1000}'.repeat(10))).toFailWith(
        /program size 10002 is over the limit of 10000/
      );
    });

    test('a source that is not a string is refused, not thrown on', () => {
      expect(re2PatternValidator(5 as unknown as string)).toFailWith(/must be a string, not number/);
    });
  });

  describe('the predicate', () => {
    test('answers false for a value that is not a string, and never throws', () => {
      const matches = compiled('.*');
      expect(matches(undefined as unknown as string)).toBe(false);
      expect(matches({} as unknown as string)).toBe(false);
    });

    test('is reusable across many values', () => {
      const digits = compiled('^\\d+$');
      expect(['1', 'a', '22', '', '333'].map(digits)).toEqual([true, false, true, false, true]);
    });
  });
});

describe('createRe2PatternValidator', () => {
  test('with no options it applies the defaults', () => {
    expect(createRe2PatternValidator()).toSucceedAndSatisfy((validate) => {
      expect(validate('a'.repeat(1024))).toSucceed();
      expect(validate('a'.repeat(1025))).toFailWith(/over the limit of 1024/);
    });
  });

  test('a tighter source limit refuses a longer source', () => {
    expect(createRe2PatternValidator({ maxSourceLength: 4 })).toSucceedAndSatisfy((validate) => {
      expect(validate('abcd')).toSucceed();
      expect(validate('abcde')).toFailWith(/5 characters, over the limit of 4/);
    });
  });

  test('a tighter program limit refuses a larger program', () => {
    expect(createRe2PatternValidator({ maxProgramSize: 20 })).toSucceedAndSatisfy((validate) => {
      expect(validate('^abc$')).toSucceed();
      expect(validate('a{100}')).toFailWith(/program size \d+ is over the limit of 20/);
    });
  });

  test('a looser limit admits what the defaults refuse', () => {
    expect(createRe2PatternValidator({ maxSourceLength: 4096, maxProgramSize: 100000 })).toSucceedAndSatisfy(
      (validate) => {
        expect(validate('a'.repeat(2000))).toSucceed();
        expect(validate('a{1000}'.repeat(10))).toSucceed();
      }
    );
  });

  test.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('a limit of %p is refused', (limit) => {
    expect(createRe2PatternValidator({ maxSourceLength: limit })).toFailWith(
      /maxSourceLength must be a positive integer/
    );
    expect(createRe2PatternValidator({ maxProgramSize: limit })).toFailWith(
      /maxProgramSize must be a positive integer/
    );
  });
});
