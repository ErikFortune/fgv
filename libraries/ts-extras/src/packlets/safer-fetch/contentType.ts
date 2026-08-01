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

import { fail, Result, succeed } from '@fgv/ts-utils';

/**
 * A media type split into its type and subtype, lowercased, with parameters removed.
 * @internal
 */
export interface IMediaType {
  readonly type: string;
  readonly subtype: string;
}

// RFC 7230 token. Deliberately not a permissive `[^/;]+`: an allowlist entry that is not a
// well-formed media type should be reported to its author, not quietly compiled into a
// pattern that never matches anything.
const TOKEN: RegExp = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

/**
 * Parses `type/subtype`, ignoring any parameters and surrounding whitespace, and lowercasing
 * both halves.
 *
 * The parse is not as trivial as it looks, which is the argument for owning it once:
 * `text/html; charset=utf-8` must match `text/html`, matching is case-insensitive on both
 * halves, and parameters must be *stripped* rather than string-matched around. Every
 * hand-rolled version gets a different subset of that right, and the failure is silent.
 * @internal
 */
export function parseMediaType(value: string): Result<IMediaType> {
  const essence = value.split(';')[0].trim().toLowerCase();
  const slash = essence.indexOf('/');
  if (slash < 0) {
    return fail(`"${value}": not a media type — expected "type/subtype".`);
  }
  const type = essence.slice(0, slash);
  const subtype = essence.slice(slash + 1);
  if (!TOKEN.test(type) && type !== '*') {
    return fail(`"${value}": "${type}" is not a valid media type.`);
  }
  if (!TOKEN.test(subtype) && subtype !== '*') {
    return fail(`"${value}": "${subtype}" is not a valid media subtype.`);
  }
  return succeed({ type, subtype });
}

/**
 * Parses an allowlist entry, which may use `*` as a wildcard for the subtype (`text/*`) or for
 * both halves (a wildcard type with a wildcard subtype, which accepts anything). A wildcard
 * type paired with a *concrete* subtype is rejected: it reads as if it means something and
 * does not.
 * @internal
 */
export function parseMediaTypePattern(value: string): Result<IMediaType> {
  return parseMediaType(value).onSuccess((parsed) => {
    if (parsed.type === '*' && parsed.subtype !== '*') {
      return fail(`"${value}": a wildcard type requires a wildcard subtype.`);
    }
    return succeed(parsed);
  });
}

/**
 * Reports whether a parsed media type matches a parsed allowlist pattern.
 * @internal
 */
export function mediaTypeMatches(actual: IMediaType, pattern: IMediaType): boolean {
  if (pattern.type === '*') {
    return true;
  }
  if (pattern.type !== actual.type) {
    return false;
  }
  return pattern.subtype === '*' || pattern.subtype === actual.subtype;
}

// A parameter value is either a token or a quoted-string; the charset names that matter here
// (`utf-8`, `iso-8859-1`, …) are tokens either way once the quotes come off.
const CHARSET_PARAM: RegExp = /;\s*charset\s*=\s*(?:"([^"]*)"|([^;\s]*))/i;

/**
 * Extracts the `charset` parameter from a `Content-Type` header value, lowercased.
 *
 * Returns `undefined` when the header is absent or carries no `charset`, which the caller
 * reads as "use the default encoding" — not as "any encoding will do".
 * @internal
 */
export function parseCharset(contentType: string | undefined): string | undefined {
  if (contentType === undefined) {
    return undefined;
  }
  const match = CHARSET_PARAM.exec(contentType);
  if (match === null) {
    return undefined;
  }
  const value = (match[1] ?? match[2]).trim().toLowerCase();
  return value.length > 0 ? value : undefined;
}

/**
 * Parses a `Content-Length` header value.
 *
 * Returns `undefined` for an absent, non-numeric, negative, or non-integer value rather than
 * guessing: a malformed length is not evidence of a size, and the streaming cap does not need
 * it. It is a fast-reject path only.
 * @internal
 */
export function parseContentLength(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}
