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

const FENCED_BLOCK: RegExp = /```[A-Za-z0-9_-]*\s*\r?\n([\s\S]*?)\r?\n?```/;
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

function findBalancedJsonSubstring(text: string): string | undefined {
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
        return text.slice(start, i + 1);
      }
    }
  }
  return undefined;
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
 * @param text - Raw model output.
 * @returns A `Result<string>` containing the JSON-shaped substring, or a
 * `Failure` if no JSON-shaped substring was found.
 * @public
 */
export const extractJsonText: JsonTextExtractor = (text: string): Result<string> => {
  if (typeof text !== 'string') {
    return fail('extractJsonText: input must be a string.');
  }
  const stripped = stripBom(text).trim();
  if (stripped.length === 0) {
    return fail('extractJsonText: input is empty.');
  }

  const fenced = FENCED_BLOCK.exec(stripped);
  const candidate = fenced ? fenced[1].trim() : stripped;

  if (candidate.length === 0) {
    return fail('extractJsonText: no JSON content found.');
  }

  // Whole-candidate primitive check runs before the brace scan so that a
  // valid JSON string containing braces (e.g. `"text with { }"`) is returned
  // intact instead of being mangled into the first balanced `{ }` match.
  if (JSON_KEYWORD.test(candidate) || JSON_NUMBER.test(candidate) || JSON_STRING.test(candidate)) {
    return succeed(candidate);
  }

  const balanced = findBalancedJsonSubstring(candidate);
  if (balanced !== undefined) {
    return succeed(balanced);
  }

  return fail('extractJsonText: no JSON-shaped substring found.');
};

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
