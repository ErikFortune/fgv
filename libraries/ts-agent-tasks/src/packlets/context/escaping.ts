/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

/**
 * A value the renderer serializes into one data record.
 * @internal
 */
export type RecordValue =
  | string
  | number
  | boolean
  | ReadonlyArray<RecordValue>
  | { readonly [key: string]: RecordValue | undefined };

/**
 * Characters `JSON.stringify` leaves raw that must not reach a prompt raw.
 *
 * @remarks
 * - `<` `>` `&` — no field can open or close a markup frame, `</task-context>` included.
 * - `{` `}` — no field can form a Mustache tag (`{{`), whatever later renders the text.
 * - the backtick — no field can close a Markdown fence a host wraps the block in.
 * - U+007F–U+009F — DEL and the C1 controls, which JSON leaves unescaped.
 * - U+2028/U+2029 — line and paragraph separators, which some consumers treat as newlines.
 * - U+061C, U+200E/U+200F, U+202A–U+202E, U+2066–U+2069 — bidirectional controls, which
 *   can make displayed text read differently from its code units.
 * - U+00AD, U+180E, U+200B–U+200D, U+2060–U+2064, U+FEFF, U+FFF9–U+FFFB — invisible
 *   formatting characters, which hide content from a reader.
 *
 * Variation selectors and the tag block are handled by `UNSAFE_SELECTORS` instead.
 *
 * C0 controls, `"` and `\` are already escaped by `JSON.stringify`. Every replacement is a
 * `\uXXXX` escape, so a record remains valid JSON and parses back to the original string.
 */
const UNSAFE: RegExp =
  /[<>&{}`\u007f-\u009f\u2028\u2029\u061c\u200b-\u200f\u2060-\u2064\ufeff\u00ad\u180e\ufff9-\ufffb\u202a-\u202e\u2066-\u2069]/g;

/**
 * Invisible code points that a plain character class cannot hold: every variation selector
 * (by Unicode property, since a selector inside a class combines with its neighbour) and the
 * tag block U+E0000–U+E007F, which can spell a hidden ASCII message a model will still read.
 * Matched per code point; an astral match is escaped as its surrogate pair.
 */
const UNSAFE_SELECTORS: RegExp = /\p{Variation_Selector}|[\u{e0000}-\u{e007f}]/gu;

function _escape(char: string): string {
  return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
}

/**
 * Quotes a string as a JSON string literal in which no character can escape its frame.
 * @internal
 */
export function quoteData(value: string): string {
  return JSON.stringify(value)
    .replace(UNSAFE, _escape)
    .replace(UNSAFE_SELECTORS, (match: string) => match.split('').map(_escape).join(''));
}

/**
 * Serializes a record as one line of JSON, every string quoted by {@link quoteData}.
 *
 * @remarks
 * Keys keep insertion order, so a record's field order is the renderer's, not the input's;
 * `undefined` fields are skipped. Numbers reaching here have been converted as finite.
 * @internal
 */
export function serializeRecord(value: RecordValue): string {
  if (typeof value === 'string') {
    return quoteData(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item: RecordValue) => serializeRecord(item)).join(',')}]`;
  }
  const fields: string[] = [];
  for (const [key, field] of Object.entries(value)) {
    if (field !== undefined) {
      fields.push(`${quoteData(key)}:${serializeRecord(field)}`);
    }
  }
  return `{${fields.join(',')}}`;
}
