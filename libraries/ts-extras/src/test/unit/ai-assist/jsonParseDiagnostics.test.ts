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

import { AiAssist } from '../../..';

const { classifyJsonParseFailure, extractJsonText, fencedStringifiedJson } = AiAssist;

const UNKNOWN: AiAssist.JsonParseFailureReason = { kind: 'unknown' };

/**
 * Asserts that `offset` actually points at `token`'s first character within
 * the ORIGINAL input, which is the contract the offset carries.
 */
function expectOffsetPointsAtToken(text: string, reason: AiAssist.JsonParseFailureReason): void {
  expect(reason.kind).not.toBe('unknown');
  if (reason.kind !== 'unknown') {
    expect(text.charAt(reason.offset)).toBe(reason.token.charAt(0));
  }
}

describe('classifyJsonParseFailure', () => {
  describe('the four property-name-position cases the consumer must tell apart', () => {
    test('names an unquoted property name, with its identifier and offset', () => {
      const text = '{ key: 1 }';
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'unquoted-property-name',
        token: 'key',
        offset: 2
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('names a single-quoted property name, with the quoted literal and offset', () => {
      const text = "{ 'key': 1 }";
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'single-quoted-property-name',
        token: "'key'",
        offset: 2
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('names a single-quoted property name whose closing quote never arrives', () => {
      // The single-quote run is invisible to the extractor's string tracking,
      // so this reaches the classifier as a balanced object; the reason still
      // names the case, falling back to a bare quote for the token.
      const text = "{ 'key: 1 }";
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'single-quoted-property-name',
        token: "'",
        offset: 2
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('names an unterminated property name, with the swallowed fragment and offset', () => {
      const text = '{ "key: 1 }';
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'unterminated-property-name',
        token: '"key: 1 }',
        offset: 2
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('names a leading elision in an object', () => {
      const text = '{ , "key": 1 }';
      expect(classifyJsonParseFailure(text)).toEqual({ kind: 'elided-member', token: ',', offset: 2 });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('names a doubled-comma elision between object members', () => {
      const text = '{ "a":1, , "b":2 }';
      expect(classifyJsonParseFailure(text)).toEqual({ kind: 'elided-member', token: ',', offset: 9 });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('gives the four cases four distinct kinds', () => {
      const kinds = ['{ key: 1 }', "{ 'key': 1 }", '{ "key: 1 }', '{ , "key": 1 }'].map(
        (t) => classifyJsonParseFailure(t).kind
      );
      expect(new Set(kinds).size).toBe(4);
    });
  });

  describe('elision beyond the property-name position', () => {
    test('names a doubled-comma elision in an array', () => {
      const text = '[1, , 2]';
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'elided-member',
        token: ',',
        offset: 4
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('names a leading elision in an array', () => {
      const text = '[, 1]';
      expect(classifyJsonParseFailure(text)).toEqual({ kind: 'elided-member', token: ',', offset: 1 });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });
  });

  describe('faults nested inside the document', () => {
    test('finds an unquoted name inside a nested object', () => {
      const text = '{"a": {b: 1}}';
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'unquoted-property-name',
        token: 'b',
        offset: 7
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('finds an unquoted name after a well-formed member', () => {
      const text = '{"a": 1, key: 2}';
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'unquoted-property-name',
        token: 'key',
        offset: 9
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('finds an unquoted name after a member whose name contains an escaped quote', () => {
      const text = '{"a\\"b": 1, key: 2}';
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'unquoted-property-name',
        token: 'key',
        offset: 12
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('finds an unquoted name after arrays and literals', () => {
      const text = '{"a": [1, 2], "b": true, c: null}';
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'unquoted-property-name',
        token: 'c',
        offset: 25
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });
  });

  describe('offsets are reported against the original input, not the extracted substring', () => {
    test('accounts for a conversational preamble', () => {
      const text = 'Here you go: { key: 1 }';
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'unquoted-property-name',
        token: 'key',
        offset: 15
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('accounts for a Markdown code fence', () => {
      const text = '```json\n{ key: 1 }\n```';
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'unquoted-property-name',
        token: 'key',
        offset: 10
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('accounts for whitespace between the fence and the JSON', () => {
      const text = '```json\n   { key: 1 }\n```';
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'unquoted-property-name',
        token: 'key',
        offset: 13
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });

    test('accounts for a byte-order mark and leading whitespace', () => {
      const text = '﻿  { key: 1 }';
      expect(classifyJsonParseFailure(text)).toEqual({
        kind: 'unquoted-property-name',
        token: 'key',
        offset: 5
      });
      expectOffsetPointsAtToken(text, classifyJsonParseFailure(text));
    });
  });

  describe('conservative fallback: honest unknown rather than a confident guess', () => {
    test('does not diagnose a truncated response (the extractor already names that case)', () => {
      expect(classifyJsonParseFailure('{"unclosed":')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('{"outer":{"inner":1')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('[1,2,3')).toEqual(UNKNOWN);
    });

    test('does not diagnose a name truncated mid-token as an unterminated name', () => {
      // Indistinguishable from a token-cap truncation: no swallowed ':' to go on.
      expect(classifyJsonParseFailure('{ "descripti')).toEqual(UNKNOWN);
    });

    test('does not diagnose a value string truncated mid-token', () => {
      expect(classifyJsonParseFailure('{"a": "some long val')).toEqual(UNKNOWN);
    });

    test('does not diagnose input with no JSON structure at all', () => {
      expect(classifyJsonParseFailure('I cannot help with that.')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('   \n  ')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('42 trailing text')).toEqual(UNKNOWN);
    });

    test('does not diagnose a trailing comma (deliberately left in the catch-all)', () => {
      expect(classifyJsonParseFailure('{"a": 1, }')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('[1, 2, ]')).toEqual(UNKNOWN);
    });

    test('does not diagnose a missing colon', () => {
      expect(classifyJsonParseFailure('{"a" 1}')).toEqual(UNKNOWN);
    });

    test('does not diagnose a missing comma between members', () => {
      expect(classifyJsonParseFailure('{"a":1 "b":2}')).toEqual(UNKNOWN);
    });

    test('does not diagnose an elided value', () => {
      expect(classifyJsonParseFailure('{"a": , "b": 1}')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('{"a": }')).toEqual(UNKNOWN);
    });

    test('does not diagnose a single-quoted value', () => {
      expect(classifyJsonParseFailure('{"a": \'x\'}')).toEqual(UNKNOWN);
    });

    test('does not diagnose a property-name position it cannot name', () => {
      expect(classifyJsonParseFailure('{ @foo: 1 }')).toEqual(UNKNOWN);
    });

    test('does not diagnose a non-ASCII unquoted name (identifier recognition is ASCII-only)', () => {
      expect(classifyJsonParseFailure('{ ключ: 1 }')).toEqual(UNKNOWN);
    });

    test('does not diagnose a mismatched closing delimiter', () => {
      expect(classifyJsonParseFailure('{"a": [1, 2}')).toEqual(UNKNOWN);
    });

    test('does not diagnose trailing content after a complete value', () => {
      expect(classifyJsonParseFailure('{"a":1} and then some prose')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('[1,2] and then some prose')).toEqual(UNKNOWN);
    });

    test('returns unknown for input that parses cleanly (harmless but pointless)', () => {
      expect(classifyJsonParseFailure('{}')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('[]')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('{"a":1}')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('[1,2]')).toEqual(UNKNOWN);
      expect(classifyJsonParseFailure('{"a":{"b":[1,2]},"c":"text with { } and , inside"}')).toEqual(UNKNOWN);
    });
  });

  describe('classification is structural, not engine-message-derived', () => {
    test('agrees with JSON.parse on which inputs are broken', () => {
      const broken = ['{ key: 1 }', "{ 'key': 1 }", '{ "key: 1 }', '{ , "key": 1 }', '[1, , 2]'];
      for (const text of broken) {
        expect(() => JSON.parse(text)).toThrow();
        expect(classifyJsonParseFailure(text).kind).not.toBe('unknown');
      }
    });
  });
});

describe('existing extractor diagnostics are unchanged by the classifier', () => {
  test('the truncation-aware message (PR #573) still fires, verbatim, for an unclosed structure', () => {
    expect(extractJsonText('{"unclosed":')).toFailWith(
      /JSON structure opened but never closed \(depth 1 at end of input\).*truncated.*maxTokens/i
    );
    expect(extractJsonText('{"outer":{"inner":1')).toFailWith(
      /JSON structure opened but never closed \(depth 2 at end of input\)/i
    );
    // The unterminated-name case reaches the extractor as an unclosed structure
    // too, so it keeps the truncation message; the typed reason is the added
    // channel, not a replacement.
    expect(extractJsonText('{ "key: 1 }')).toFailWith(/JSON structure opened but never closed/i);
  });

  test('the generic no-JSON message still fires, with no false-positive truncation diagnosis', () => {
    expect(extractJsonText('I cannot help with that.')).toFailWith(/no JSON-shaped substring found/i);
    expect(extractJsonText('I cannot help with that.')).not.toFailWith(/truncated/i);
  });

  test('fence, preamble and trailing-prose extraction are unaffected', () => {
    expect(extractJsonText('```json\n{"a":1}\n```')).toSucceedWith('{"a":1}');
    expect(extractJsonText('```\n{"a":1}\n```')).toSucceedWith('{"a":1}');
    expect(extractJsonText('Here you go: {"a":1}. Enjoy!')).toSucceedWith('{"a":1}');
    expect(extractJsonText('```json\n\n```')).toFailWith(/no JSON content/i);
  });

  test('fencedStringifiedJson still propagates the raw parse failure unchanged', () => {
    expect(fencedStringifiedJson().convert('{not valid json}')).toFailWith(/failed to parse json/i);
  });

  test('a non-string input is total rather than throwing, matching extractJsonText', () => {
    // The signature says `string`, but a JS consumer — or a TS caller arriving via an
    // `unknown`/`any` escape hatch — can still pass a non-string. `extractJsonText`
    // already guarded this; without the matching guard here the documented "never
    // fails" contract was false in practice (the BOM strip threw a TypeError).
    const notStrings: ReadonlyArray<unknown> = [42, null, undefined, {}, [], true];
    for (const value of notStrings) {
      expect(() => classifyJsonParseFailure(value as unknown as string)).not.toThrow();
      expect(classifyJsonParseFailure(value as unknown as string)).toEqual(UNKNOWN);
    }
  });
});
