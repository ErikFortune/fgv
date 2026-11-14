/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Hash } from '@fgv/ts-utils';
import { IIndexedMemoryEntry } from '../index';
import { IMemoryRecord, isTemporalRecord, selectVersionAsOf } from '../types';

/**
 * The record-level mutable-field vocabulary: maps a declared mutable field name to its canonical
 * location on a record. Used to project an incoming record into a merge-patch on update.
 */
const mutableFieldAccessors: ReadonlyMap<string, (record: IMemoryRecord<unknown>) => unknown> = new Map<
  string,
  (record: IMemoryRecord<unknown>) => unknown
>([
  ['body', (r) => r.body],
  ['tags', (r) => r.envelope.tags],
  ['links', (r) => r.envelope.links],
  ['provenance', (r) => r.envelope.provenance],
  ['embeddingRef', (r) => r.envelope.embeddingRef]
]);

/**
 * Project the incoming record's mutable fields into a merge-patch.
 * @internal
 */
export function projectMutablePatch(
  record: IMemoryRecord<unknown>,
  mutableFields: ReadonlyArray<string>
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const field of mutableFields) {
    const accessor: ((record: IMemoryRecord<unknown>) => unknown) | undefined =
      mutableFieldAccessors.get(field);
    if (accessor !== undefined) {
      const value: unknown = accessor(record);
      if (value !== undefined) {
        patch[field] = value;
      }
    }
  }
  return patch;
}

/**
 * True when `incoming`'s caller-authored mutable metadata (`tags` / `provenance`) canonically
 * equals `existing`'s. `body` and `links` are covered by the content hash; `embeddingRef` is
 * store-derived (not caller metadata) and is deliberately excluded so a same-content re-put is not
 * treated as changed merely because the store already stamped an embedding. Used to keep an
 * identical re-put a no-op without swallowing a genuine metadata revision.
 *
 * Canonicalization never fails for a validated record (`tags`/`provenance` are always plain JSON);
 * a failure is defaulted to a non-matching sentinel so the write flows to `applyUpdate` (which
 * re-validates) rather than silently no-op-ing on an un-canonicalizable value.
 * @internal
 */
export function isMutableMetadataUnchanged(
  hasher: Hash.Crc32Normalizer,
  existing: IMemoryRecord<unknown>,
  incoming: IMemoryRecord<unknown>
): boolean {
  const key = (record: IMemoryRecord<unknown>): string =>
    hasher.canonicalize({ tags: record.envelope.tags, provenance: record.envelope.provenance }).orDefault('');
  const existingKey: string = key(existing);
  return existingKey !== '' && existingKey === key(incoming);
}

/**
 * Collapse temporal records to the single version valid at `asOf` per entity; non-temporal records
 * are timeless and pass through unchanged (valid-time `asOf` applies only to versioned kinds;
 * transaction-time / full bi-temporal filtering is deferred — OQ-9). An entity with no version
 * valid at `asOf` contributes nothing.
 * @internal
 */
export function projectAsOf(
  entries: ReadonlyArray<IIndexedMemoryEntry>,
  asOf: number
): ReadonlyArray<IIndexedMemoryEntry> {
  const passthrough: IIndexedMemoryEntry[] = [];
  const groups: Map<string, IIndexedMemoryEntry[]> = new Map<string, IIndexedMemoryEntry[]>();
  for (const entry of entries) {
    if (!isTemporalRecord(entry)) {
      passthrough.push(entry);
      continue;
    }
    const key: string = `${entry.envelope.kind}\0${entry.envelope.entityId}`;
    const existing: IIndexedMemoryEntry[] | undefined = groups.get(key);
    if (existing === undefined) {
      groups.set(key, [entry]);
    } else {
      existing.push(entry);
    }
  }
  const result: IIndexedMemoryEntry[] = [...passthrough];
  for (const versions of groups.values()) {
    const valid: IIndexedMemoryEntry | undefined = selectVersionAsOf(versions, asOf);
    if (valid !== undefined) {
      result.push(valid);
    }
  }
  return result;
}
