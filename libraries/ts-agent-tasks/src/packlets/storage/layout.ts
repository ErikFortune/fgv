/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Normalizer, Result, captureResult, succeed } from '@fgv/ts-utils';
import { TaskInventoryRecordKind } from '../types';

/**
 * The repository manifest's file name.
 * @internal
 */
export const manifestName: string = 'repository.json';

const prefixes: Readonly<Record<TaskInventoryRecordKind, string>> = {
  task: 'task-',
  consumer: 'consumer-',
  source: 'source-'
};

const suffix: string = '.json';

/**
 * The file name of one record. Names are built only from validated identifiers — never from
 * scope names, assignees or source-provided path fragments (design §8.3) — so a name can never
 * leave the root.
 * @internal
 */
export function recordName(kind: TaskInventoryRecordKind, id: string): string {
  return `${prefixes[kind]}${id}${suffix}`;
}

/**
 * Recognizes a record-shaped file name, returning its kind and id.
 * @internal
 */
export function parseRecordName(
  name: string
): { readonly kind: TaskInventoryRecordKind; readonly id: string } | undefined {
  if (!name.endsWith(suffix)) {
    return undefined;
  }
  for (const kind of Object.keys(prefixes) as TaskInventoryRecordKind[]) {
    const prefix: string = prefixes[kind];
    if (name.startsWith(prefix) && name.length > prefix.length + suffix.length) {
      return { kind, id: name.slice(prefix.length, name.length - suffix.length) };
    }
  }
  return undefined;
}

/**
 * One encoded record: its canonical text and that text's UTF-8 length.
 * @internal
 */
export interface IEncodedRecord {
  readonly text: string;
  readonly bytes: number;
}

const normalizer: Normalizer = new Normalizer();
const encoder: TextEncoder = new TextEncoder();

/**
 * The UTF-8 length of a string — the unit every byte bound in §8.6 is stated in.
 * @internal
 */
export function utf8Length(text: string): number {
  return encoder.encode(text).length;
}

/**
 * Drops `undefined`-valued object properties, recursively.
 *
 * @remarks
 * A converted value may carry an optional field as a present key holding `undefined`, and the
 * canonicalizer (correctly) refuses `undefined`. JSON has no such value: an absent optional
 * field and an `undefined` one are the same record, so they must encode the same.
 */
function _withoutUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(_withoutUndefined);
  }
  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) {
        result[key] = _withoutUndefined(entry);
      }
    }
    return result;
  }
  return value;
}

/**
 * Encodes a value as RFC 8785 canonical JSON. The bytes on disk are therefore the canonical
 * bytes capacity accounting charges, and two equal records encode identically.
 * @internal
 */
export function encodeRecord(value: unknown): Result<IEncodedRecord> {
  return normalizer
    .canonicalize(_withoutUndefined(value))
    .onSuccess((text) => succeed({ text, bytes: utf8Length(text) }));
}

/**
 * Canonical equality of two JSON-shaped values. Used for replay comparison, which must
 * compare the entire request, not a lossy hash of it (design §5).
 * @internal
 */
export function canonicallyEqual(a: unknown, b: unknown): Result<boolean> {
  // Wrapped so that an absent value (`undefined`) compares as absent rather than failing.
  return encodeRecord({ value: a }).onSuccess((left) =>
    encodeRecord({ value: b }).onSuccess((right) => succeed(left.text === right.text))
  );
}

/**
 * Parses JSON text. `JSON.parse` never produces a null-prototype object, so the strict
 * converters that follow are safe from the `ts-utils` `isKeyOf` hazard T1 escalated.
 * @internal
 */
export function parseJson(text: string): Result<unknown> {
  return captureResult((): unknown => JSON.parse(text));
}
