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

/**
 * JSON-tolerant extraction and converters for LLM responses.
 *
 * Models commonly wrap JSON output in Markdown code fences, add a
 * "Sure, here's the JSON:" preamble, or trail off with prose after the
 * closing brace. These helpers normalize that quirk on the read side so every
 * AiAssist consumer can reach a validated `T` from raw model text without
 * reimplementing the same fence-stripping logic.
 *
 * Scope: strip wrappers (fences, prose, BOM, whitespace). Out of scope: repair
 * malformed JSON (missing commas, unquoted keys, smart quotes, etc.).
 *
 * @packageDocumentation
 */

import { Conversion, type Converter, fail, Result, succeed, type Validator } from '@fgv/ts-utils';
import { Converters as JsonBaseConverters, type JsonValue } from '@fgv/ts-json-base';

/**
 * A function that pulls a JSON-shaped substring out of arbitrary model text.
 * Implementations strip whatever wrappers the model added (fences, preamble,
 * trailing prose) and return the JSON-shaped substring ready for `JSON.parse`.
 * @public
 */
export type JsonTextExtractor = (text: string) => Result<string>;

// Group 1 is the opening fence (marker, optional language tag, newline) and
// group 2 is the fenced body. Group 1 is captured only so a caller that needs
// to map a position inside the body back onto an offset in the original text
// can add its length instead of re-deriving the fence header.
const FENCED_BLOCK: RegExp = /(```[A-Za-z0-9_-]*\s*\r?\n)([\s\S]*?)\r?\n?```/;
const BOM: RegExp = /^\uFEFF/;
// Full RFC 8259 grammar so the extractor only succeeds when the entire
// candidate parses as a JSON primitive (instead of just starting like one).
const JSON_NUMBER: RegExp = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
// eslint-disable-next-line no-control-regex
const JSON_STRING: RegExp = /^"(?:[^"\\\u0000-\u001F]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"$/;
const JSON_KEYWORD: RegExp = /^(?:true|false|null)$/;

function stripBom(text: string): string {
  return text.replace(BOM, '');
}

/**
 * Outcome of a {@link findBalancedJsonSubstring} scan.
 *
 * - `'found'`: a balanced JSON-shaped substring was located; `value` is it.
 * - `'unclosed'`: an object or array opened but the matching close never
 *   arrived before the end of input — the classic truncated-response shape;
 *   `depth` is the unresolved depth at end of input, counting only the
 *   opening delimiter's type (the scan tracks the candidate's own `{`/`}`
 *   or `[`/`]` pair, not total mixed-delimiter nesting).
 * - `'none'`: no `{` or `[` was ever seen outside a quoted string.
 *
 * `start` (present on `'found'` and `'unclosed'`) is the index of the opening
 * `{` or `[` within the scanned text.
 * @internal
 */
type BalancedJsonScanResult =
  | { readonly kind: 'found'; readonly value: string; readonly start: number }
  | { readonly kind: 'unclosed'; readonly depth: number; readonly start: number }
  | { readonly kind: 'none' };

function findBalancedJsonSubstring(text: string): BalancedJsonScanResult {
  // Walk the text once tracking string state. The first '{' or '[' that is
  // *outside* a quoted string is the candidate start; from there, count
  // matching close characters while ignoring delimiters that appear inside
  // strings.
  let inString = false;
  let escape = false;
  let start = -1;
  let open = '';
  let close = '';
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (start < 0) {
      if (ch === '{' || ch === '[') {
        start = i;
        open = ch;
        close = ch === '{' ? '}' : ']';
        depth = 1;
      }
      continue;
    }
    if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) {
        return { kind: 'found', value: text.slice(start, i + 1), start };
      }
    }
  }
  return start >= 0 ? { kind: 'unclosed', depth, start } : { kind: 'none' };
}

/**
 * The JSON-shaped candidate located within raw model text, plus where it
 * starts in that text.
 * @internal
 */
interface IJsonCandidate {
  /** The whole input after BOM strip and trim, before any fence unwrap. */
  readonly stripped: string;
  /** The candidate itself: the trimmed fenced body when fenced, else `stripped`. */
  readonly text: string;
  /** Index of `text`'s first character within the original input. */
  readonly base: number;
}

/**
 * Strips the wrappers a model adds around JSON — byte-order mark, surrounding
 * whitespace, Markdown code fence — and reports where what is left starts in
 * the original text.
 *
 * Single source of truth for that step: {@link extractJsonText} and
 * {@link classifyJsonParseFailure} must agree on what the candidate is, or a
 * classified `offset` would point into text the extractor never parsed.
 * @internal
 */
function locateJsonCandidate(text: string): IJsonCandidate {
  const noBom = stripBom(text);
  const stripped = noBom.trim();
  const strippedBase = text.length - noBom.length + (noBom.length - noBom.trimStart().length);

  const fenced = FENCED_BLOCK.exec(stripped);
  if (fenced === null) {
    return { stripped, text: stripped, base: strippedBase };
  }
  const body = fenced[2];
  return {
    stripped,
    text: body.trim(),
    base: strippedBase + fenced.index + fenced[1].length + (body.length - body.trimStart().length)
  };
}

/**
 * Default {@link AiAssist.JsonTextExtractor | extractor} for LLM responses. Tolerates:
 *
 * - Leading/trailing whitespace and a leading byte-order mark.
 * - Markdown code fences (with or without a language tag).
 * - Conversational preamble before the first `{` or `[`.
 * - Trailing prose after the matched closing `}` or `]`.
 *
 * Out of scope: repairing malformed JSON, handling smart quotes, etc.
 *
 * When an object or array opens but never closes before the end of input —
 * the shape a response truncated by a token cap leaves behind — the failure
 * names that specifically (distinct from the generic "no JSON-shaped
 * substring found" for input that never looked like JSON at all) and points
 * at `IAiCompletionResponse.truncated` and the `maxTokens` request option as
 * the likely cause and fix.
 *
 * @param text - Raw model output.
 * @returns A `Result<string>` containing the JSON-shaped substring, or a
 * `Failure` if no JSON-shaped substring was found.
 * @public
 */
export const extractJsonText: JsonTextExtractor = (text: string): Result<string> => {
  if (typeof text !== 'string') {
    return fail('extractJsonText: input must be a string.');
  }
  const located = locateJsonCandidate(text);
  if (located.stripped.length === 0) {
    return fail('extractJsonText: input is empty.');
  }

  const candidate = located.text;
  if (candidate.length === 0) {
    return fail('extractJsonText: no JSON content found.');
  }

  // Whole-candidate primitive check runs before the brace scan so that a
  // valid JSON string containing braces (e.g. `"text with { }"`) is returned
  // intact instead of being mangled into the first balanced `{ }` match.
  if (JSON_KEYWORD.test(candidate) || JSON_NUMBER.test(candidate) || JSON_STRING.test(candidate)) {
    return succeed(candidate);
  }

  const scan = findBalancedJsonSubstring(candidate);
  if (scan.kind === 'found') {
    return succeed(scan.value);
  }
  if (scan.kind === 'unclosed') {
    return fail(
      `extractJsonText: JSON structure opened but never closed (depth ${scan.depth} at end of input) — ` +
        'response may have been truncated (check IAiCompletionResponse.truncated / raise maxTokens).'
    );
  }

  return fail('extractJsonText: no JSON-shaped substring found.');
};

/**
 * Typed reason a JSON-shaped LLM response failed to parse, so a caller can
 * branch on the failure class instead of regex-matching the engine's
 * `JSON.parse` message (whose wording varies across V8 / Node versions).
 *
 * Every classified arm describes a fault at an **object property-name
 * position** — the position an LLM most often gets wrong, and the one whose
 * repair strategy differs most by case:
 *
 * - `'unquoted-property-name'`: a bare identifier where a quoted name belongs
 *   (`{ key: 1 }`). `token` is the identifier run, `offset` its first
 *   character. Identifier recognition is ASCII-only, so a non-ASCII bare name
 *   (`{ ключ: 1 }`) reports `'unknown'` rather than being named.
 * - `'single-quoted-property-name'`: a single-quoted name (`{ 'key': 1 }`).
 *   `token` is the quoted literal (or just `'` if it never closes), `offset`
 *   the opening quote.
 * - `'unterminated-property-name'`: a name whose closing `"` is missing, and
 *   whose body swallowed structural text (`{ "key: 1 }`). `token` is the
 *   unterminated fragment, `offset` the opening quote.
 * - `'elided-member'`: a `,` where a member is expected — a leading or doubled
 *   comma in an object (`{ , "a": 1 }`, `{ "a":1, , "b":2 }`) or an array
 *   (`[1, , 2]`). `token` is `','`, `offset` its position.
 * - `'unknown'`: the catch-all. The scan reached the end of the text, or hit a
 *   fault it cannot name with confidence, and reports nothing rather than
 *   guessing. Truncated responses, missing colons, trailing commas, bad number
 *   literals, and anything else not listed above land here.
 *
 * `offset` is a 0-based index into the `text` passed to
 * {@link AiAssist.classifyJsonParseFailure}, not into the extracted substring.
 * @public
 */
export type JsonParseFailureReason =
  | { readonly kind: 'unquoted-property-name'; readonly token: string; readonly offset: number }
  | { readonly kind: 'single-quoted-property-name'; readonly token: string; readonly offset: number }
  | { readonly kind: 'unterminated-property-name'; readonly token: string; readonly offset: number }
  | { readonly kind: 'elided-member'; readonly token: string; readonly offset: number }
  | { readonly kind: 'unknown' };

const UNKNOWN_PARSE_FAILURE: JsonParseFailureReason = { kind: 'unknown' };

const JSON_WHITESPACE: RegExp = /[ \t\n\r]/;
const IDENTIFIER_START: RegExp = /[A-Za-z0-9_$]/;
const IDENTIFIER_PART: RegExp = /[A-Za-z0-9_$.-]/;
// Characters that end an unquoted value run (`true`, `null`, a number, or
// garbage). Includes ':' so a stray colon at a value position produces an
// empty run — reported as 'unknown' — instead of being swallowed by a literal.
const VALUE_RUN_TERMINATOR: RegExp = /[\s,}\]:"'{[]/;

/** Where the parse scan currently is within the JSON grammar. @internal */
type JsonScanExpectation = 'value' | 'name' | 'colon' | 'comma';

/** Result of scanning a quoted run starting at a given opening quote. @internal */
interface IQuotedRunScan {
  readonly terminated: boolean;
  /** Index just past the closing quote, or end of text when unterminated. */
  readonly end: number;
  /** Content between the quotes, exclusive. */
  readonly body: string;
}

function scanQuotedRun(text: string, start: number, quote: string): IQuotedRunScan {
  let escape = false;
  for (let i = start + 1; i < text.length; i++) {
    const ch = text.charAt(i);
    if (escape) {
      escape = false;
    } else if (ch === '\\') {
      escape = true;
    } else if (ch === quote) {
      return { terminated: true, end: i + 1, body: text.slice(start + 1, i) };
    }
  }
  return { terminated: false, end: text.length, body: text.slice(start + 1) };
}

function skipJsonWhitespace(text: string, from: number): number {
  let i = from;
  while (i < text.length && JSON_WHITESPACE.test(text.charAt(i))) {
    i++;
  }
  return i;
}

function scanRun(text: string, from: number, isPart: (ch: string) => boolean): string {
  let i = from;
  while (i < text.length && isPart(text.charAt(i))) {
    i++;
  }
  return text.slice(from, i);
}

function classifyAtPropertyName(
  text: string,
  i: number,
  base: number
): { readonly reason: JsonParseFailureReason } | { readonly next: number } {
  const ch = text.charAt(i);
  if (ch === '"') {
    const scan = scanQuotedRun(text, i, '"');
    if (scan.terminated) {
      return { next: scan.end };
    }
    // An unterminated name is only distinguishable from a mid-name truncation
    // when the swallowed body contains structural text — a ':' the author
    // plainly meant as the name/value separator. Without that, stay honest.
    return scan.body.includes(':')
      ? { reason: { kind: 'unterminated-property-name', token: text.slice(i), offset: base + i } }
      : { reason: UNKNOWN_PARSE_FAILURE };
  }
  if (ch === "'") {
    const scan = scanQuotedRun(text, i, "'");
    return {
      reason: {
        kind: 'single-quoted-property-name',
        token: scan.terminated ? text.slice(i, scan.end) : "'",
        offset: base + i
      }
    };
  }
  if (ch === ',') {
    return { reason: { kind: 'elided-member', token: ',', offset: base + i } };
  }
  if (IDENTIFIER_START.test(ch)) {
    return {
      reason: {
        kind: 'unquoted-property-name',
        token: scanRun(text, i, (c) => IDENTIFIER_PART.test(c)),
        offset: base + i
      }
    };
  }
  return { reason: UNKNOWN_PARSE_FAILURE };
}

/**
 * Walks `text` from `from` (the opening `{` or `[`) as a permissive JSON
 * scanner, reporting the first fault it can name with confidence. Anything it
 * cannot name — including a document that scans clean — yields `'unknown'`.
 *
 * The scan is structural: it never reads the engine's `JSON.parse` message, so
 * its verdicts do not drift with the Node version.
 * @internal
 */
function scanForParseFailure(text: string, from: number, base: number): JsonParseFailureReason {
  const stack: Array<'object' | 'array'> = [];
  let expect: JsonScanExpectation = 'value';
  let i = from;

  for (;;) {
    i = skipJsonWhitespace(text, i);
    if (i >= text.length) {
      return UNKNOWN_PARSE_FAILURE;
    }
    const ch = text.charAt(i);
    const top = stack[stack.length - 1];

    if (expect === 'name') {
      if (ch === '}') {
        stack.pop();
        i++;
        expect = 'comma';
        continue;
      }
      const outcome = classifyAtPropertyName(text, i, base);
      if ('reason' in outcome) {
        return outcome.reason;
      }
      i = outcome.next;
      expect = 'colon';
      continue;
    }

    if (expect === 'colon') {
      if (ch !== ':') {
        return UNKNOWN_PARSE_FAILURE;
      }
      i++;
      expect = 'value';
      continue;
    }

    if (expect === 'value') {
      if (ch === '{' || ch === '[') {
        stack.push(ch === '{' ? 'object' : 'array');
        i++;
        expect = ch === '{' ? 'name' : 'value';
        continue;
      }
      if (ch === ']' && top === 'array') {
        stack.pop();
        i++;
        expect = 'comma';
        continue;
      }
      if (ch === ',') {
        return top === 'array'
          ? { kind: 'elided-member', token: ',', offset: base + i }
          : UNKNOWN_PARSE_FAILURE;
      }
      if (ch === '"') {
        const scan = scanQuotedRun(text, i, '"');
        if (!scan.terminated) {
          // Could equally be a truncated value; the extractor already names
          // truncation, so do not compete with it here.
          return UNKNOWN_PARSE_FAILURE;
        }
        i = scan.end;
        expect = 'comma';
        continue;
      }
      const literal = scanRun(text, i, (c) => !VALUE_RUN_TERMINATOR.test(c));
      if (literal.length === 0) {
        return UNKNOWN_PARSE_FAILURE;
      }
      i += literal.length;
      expect = 'comma';
      continue;
    }

    // expect === 'comma': a complete value just closed.
    if (top === undefined) {
      return UNKNOWN_PARSE_FAILURE;
    }
    if (ch === ',') {
      i++;
      expect = top === 'object' ? 'name' : 'value';
      continue;
    }
    if ((ch === '}' && top === 'object') || (ch === ']' && top === 'array')) {
      stack.pop();
      i++;
      continue;
    }
    return UNKNOWN_PARSE_FAILURE;
  }
}

/**
 * Classifies why a JSON-shaped LLM response would not parse, returning a
 * {@link AiAssist.JsonParseFailureReason} a caller can branch on — repair the
 * cheap cases, re-prompt the expensive ones, fail outright on the rest —
 * instead of regex-matching an engine-specific `JSON.parse` message.
 *
 * Pass the same raw model text you handed
 * {@link AiAssist.fencedStringifiedJson} or {@link AiAssist.extractJsonText};
 * this applies the same BOM / whitespace / fence / preamble handling before
 * scanning, and reports `offset` against that original text.
 *
 * Classification is **structural and deliberately conservative**. The scan
 * walks the JSON grammar itself rather than reading the engine's error string,
 * so its verdicts are stable across Node versions — and any fault it cannot
 * name with confidence comes back as `'unknown'` rather than a guess. In
 * particular an input that opened a structure and never closed it (the
 * truncated-response shape {@link AiAssist.extractJsonText} already diagnoses)
 * classifies as `'unknown'` here; the two diagnostics are complementary, not
 * competing.
 *
 * This never fails and never repairs — it only names the fault. It is a
 * diagnostic on the failure path, so calling it on text that parses fine is
 * harmless but pointless: it returns `'unknown'`.
 *
 * @example
 * ```ts
 * const parsed = fencedStringifiedJson({ inner }).convert(raw);
 * if (parsed.isFailure()) {
 *   const reason = classifyJsonParseFailure(raw);
 *   switch (reason.kind) {
 *     case 'unquoted-property-name': // cheap to repair
 *     case 'single-quoted-property-name':
 *       break;
 *     case 'elided-member':
 *     case 'unterminated-property-name': // worth a re-prompt
 *       break;
 *     default: // 'unknown' — fail outright
 *   }
 * }
 * ```
 *
 * @param text - Raw model output (the same string handed to the extractor).
 * @returns A {@link AiAssist.JsonParseFailureReason}.
 * @public
 */
export function classifyJsonParseFailure(text: string): JsonParseFailureReason {
  const candidate = locateJsonCandidate(text);
  const scan = findBalancedJsonSubstring(candidate.text);
  if (scan.kind === 'none') {
    return UNKNOWN_PARSE_FAILURE;
  }
  return scanForParseFailure(candidate.text, scan.start, candidate.base);
}

/**
 * Options shared by every {@link AiAssist.fencedStringifiedJson} call.
 * @public
 */
export interface IFencedStringifiedJsonExtractorOptions {
  /**
   * Optional pre-parse extractor. Defaults to {@link AiAssist.extractJsonText}.
   * Provide a custom extractor to handle response shapes the default does not
   * understand.
   */
  readonly extractor?: JsonTextExtractor;
}

/**
 * Options for the validating overload of {@link AiAssist.fencedStringifiedJson}.
 * `inner` is required so the typed `Converter<T>` return value can never lie
 * about the runtime shape.
 * @public
 */
export interface IFencedStringifiedJsonOptions<T> extends IFencedStringifiedJsonExtractorOptions {
  /** Inner converter or validator applied to the parsed JSON value. */
  readonly inner: Converter<T> | Validator<T>;
}

/**
 * Creates a `Converter` that accepts raw LLM response text, runs it through a
 * tolerant extractor (default: {@link AiAssist.extractJsonText}), parses the
 * extracted substring as JSON, and applies an optional inner converter or
 * validator.
 *
 * @example
 * ```ts
 * const converter = fencedStringifiedJson({ inner: myShapeConverter });
 * const result = converter.convert(llmText); // Result<MyShape>
 * ```
 *
 * @param options - Optional extractor; omit to keep the default. Without an
 * `inner` step, the converter resolves to the parsed `JsonValue`.
 * @returns A `Converter<JsonValue>`.
 * @public
 */
export function fencedStringifiedJson(options?: IFencedStringifiedJsonExtractorOptions): Converter<JsonValue>;
/**
 * Creates a `Converter` that accepts raw LLM response text, runs it through a
 * tolerant extractor (default: {@link AiAssist.extractJsonText}), parses the
 * extracted substring as JSON, and applies the supplied inner converter or
 * validator.
 *
 * @param options - Required `inner` converter/validator and optional extractor.
 * @returns A `Converter<T>`.
 * @public
 */
export function fencedStringifiedJson<T>(options: IFencedStringifiedJsonOptions<T>): Converter<T>;
export function fencedStringifiedJson<T>(
  options?: IFencedStringifiedJsonExtractorOptions | IFencedStringifiedJsonOptions<T>
): Converter<T | JsonValue> {
  const extractor: JsonTextExtractor = options?.extractor ?? extractJsonText;
  const inner = (options as IFencedStringifiedJsonOptions<T> | undefined)?.inner;
  const parser: Converter<T | JsonValue> =
    inner !== undefined ? JsonBaseConverters.stringifiedJson<T>(inner) : JsonBaseConverters.stringifiedJson();

  return new Conversion.BaseConverter<T | JsonValue>((from: unknown): Result<T | JsonValue> => {
    if (typeof from !== 'string') {
      return fail('fencedStringifiedJson: input must be a string.');
    }
    return extractor(from).onSuccess((extracted) => parser.convert(extracted));
  });
}
