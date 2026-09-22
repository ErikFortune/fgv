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
 * - U+200E/U+200F, U+202A–U+202E, U+2066–U+2069 — bidirectional controls, which can make
 *   displayed text read differently from its code units.
 *
 * C0 controls, `"` and `\` are already escaped by `JSON.stringify`. Every replacement is a
 * `\uXXXX` escape, so a record remains valid JSON and parses back to the original string.
 */
const UNSAFE: RegExp = /[<>&{}`\u007f-\u009f\u2028\u2029\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

function _escape(char: string): string {
  return `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
}

/**
 * Quotes a string as a JSON string literal in which no character can escape its frame.
 * @internal
 */
export function quoteData(value: string): string {
  return JSON.stringify(value).replace(UNSAFE, _escape);
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
