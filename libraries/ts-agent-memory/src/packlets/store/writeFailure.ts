/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { DetailedResult, StringOneOf } from '@fgv/ts-utils';
import { MemoryId } from '../types';

/**
 * What a conditional write expects to find at its address: the `seq` of the record there (for a
 * versioned kind, of the entity's current version), or `'absent'` when it expects nothing there.
 * @public
 */
export type MemoryWriteExpectation = number | 'absent';

/**
 * Options for {@link IMemoryStore.put}.
 * @public
 */
export interface IMemoryWriteOptions {
  /**
   * Write only if the address still holds what the caller read: the `envelope.seq` of the record
   * (for a versioned kind, of the entity's current version), or `'absent'` for "nothing there".
   *
   * @remarks
   * Checked under the store's write lock, after the address is resolved and before any dedup, so a
   * same-entity write that landed since the caller's read is a `conflict` and writes nothing. Absent,
   * the write is unconditional, as before.
   *
   * **The guarantee is in-process.** It covers writers that share one store instance per root —
   * which the store's own single-writer guard enforces within a process. It is not fencing: a
   * second process writing the same storage is outside it.
   */
  readonly expected?: MemoryWriteExpectation;
}

/**
 * Options for {@link IMemoryStore.delete}.
 * @public
 */
export interface IMemoryDeleteOptions {
  /**
   * Delete only if the record (for a versioned kind, the entity's current version) still carries
   * this `seq`. A record that has gone is a `conflict` with `current: 'absent'`. Same in-process
   * guarantee as {@link IMemoryWriteOptions.expected}.
   */
  readonly expected?: number;
}

/**
 * Every {@link MemoryWriteFailureCode}, in a stable order.
 * @public
 */
export const allMemoryWriteFailureCodes = [
  'conflict',
  'duplicate',
  'invalid',
  'rejected',
  'not-found',
  'io'
] as const;

/**
 * Why a write or delete failed.
 *
 * - `conflict` — `expected` did not match; nothing was written.
 * - `duplicate` — a conditional `put` whose content already exists under a different id, which an
 *   unconditional `put` would answer by returning that record unchanged. Under `expected`, success
 *   means the addressed record was written, so this fails instead; nothing was written.
 * - `invalid` — the input was refused before the store looked at the vault (body, codec, layout,
 *   or a malformed `expected`); nothing was written.
 * - `rejected` — the kind's write policy refused admission; nothing was written.
 * - `not-found` — a delete found no record (and carried no `expected`).
 * - `io` — anything else: storage, the index, or a host callback that failed rather than decided.
 *   The message says what; it does not promise the vault is unchanged.
 * @public
 */
export type MemoryWriteFailureCode = StringOneOf<typeof allMemoryWriteFailureCodes>;

/**
 * The detail of a failed conditional write: what the caller expected and what the store found.
 * @public
 */
export interface IMemoryWriteConflict {
  /** Always `'conflict'`. */
  readonly code: 'conflict';
  /** The `expected` the caller supplied. */
  readonly expected: MemoryWriteExpectation;
  /** What the address held: the record's (or current version's) `seq`, or `'absent'`. */
  readonly current: MemoryWriteExpectation;
}

/**
 * The detail of a conditional `put` refused because its content already exists under another id.
 * @public
 */
export interface IMemoryWriteDuplicate {
  /** Always `'duplicate'`. */
  readonly code: 'duplicate';
  /** The id of the existing record, in the same scope, that holds the content. */
  readonly existingId: MemoryId;
}

/**
 * The detail of a write that failed for any other reason.
 * @public
 */
export interface IMemoryWriteError {
  /** The classification; see {@link MemoryWriteFailureCode}. */
  readonly code: Exclude<MemoryWriteFailureCode, 'conflict' | 'duplicate'>;
}

/**
 * Classified detail for a failed {@link IMemoryStore.put} or {@link IMemoryStore.delete}.
 * @public
 */
export type IMemoryWriteFailure = IMemoryWriteConflict | IMemoryWriteDuplicate | IMemoryWriteError;

/**
 * What {@link IMemoryStore.put} and {@link IMemoryStore.delete} return. A failure always carries
 * an {@link IMemoryWriteFailure}; use `.asResult` to chain into plain `Result` code.
 * @public
 */
export type MemoryWriteResult<T> = DetailedResult<T, IMemoryWriteFailure>;
