/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { FileTree } from '@fgv/ts-json-base';
import { StringOneOf } from '@fgv/ts-utils';
import { MemoryScopeKey } from '../types';

/**
 * Policy for how {@link FileTreeMemoryStore.create}'s initial vault walk reacts
 * to a record that fails to parse or validate.
 *
 * - `'fail'` (the default) — one unreadable record fails the whole open. The
 *   walk collapses per-record results with `mapResults`, so any single failure
 *   aborts `create()`. This is the historical behavior, preserved byte-for-byte.
 * - `'skip'` — an unreadable record is quarantined (not indexed) rather than
 *   failing the open. Every record that DOES parse loads normally; each skip is
 *   logged at `warn` and surfaced structurally on
 *   {@link FileTreeMemoryStore.skippedRecords}. The offending file is never
 *   deleted or mutated, so a later open (after the body converter is fixed)
 *   re-indexes it. A vault holds every kind in one store, so a required-field
 *   migration on one kind must not make every other record unreadable.
 * @public
 */
export type MemoryRecordErrorMode = 'skip' | 'fail';

/**
 * A record that {@link FileTreeMemoryStore.create} could not load and
 * quarantined (only produced in {@link MemoryRecordErrorMode | `'skip'` mode}).
 * The `path` identifies WHICH record was skipped so a host can repair it.
 * @public
 */
export interface ISkippedRecord {
  /** The record file's on-disk path within the vault (`<scope directory>/<filename>.md`). */
  readonly path: string;
  /**
   * The scope the record lives under: its parent directory path, decoded through
   * {@link IFileTreeMemoryStoreCreateParams.scopeDecoding | scopeDecoding} when one
   * is supplied. Absent when that directory does not decode to a scope.
   */
  readonly scope?: MemoryScopeKey;
  /** The parse/validation failure message (includes the record path). */
  readonly error: string;
}

/**
 * The atomic-write guarantees a host can require of a {@link FileTreeMemoryStore}'s root,
 * weakest to strongest. These are the guarantees `@fgv/ts-json-base` can qualify a root for.
 * @public
 */
export const memoryDurabilityRequirements = ['session', 'process-crash'] as const;

/**
 * An atomic-write guarantee a host can require of a {@link FileTreeMemoryStore}'s root. See
 * {@link memoryDurabilityRequirements}.
 * @public
 */
export type MemoryDurabilityRequirement = StringOneOf<typeof memoryDurabilityRequirements>;

/**
 * How {@link FileTreeMemoryStore.create} treats its root's atomic-write capability.
 * @public
 */
export interface IMemoryStoreDurabilityOptions {
  /**
   * Refuse to open unless the root can write every record atomically at this guarantee or a
   * stronger one. Absent, the store opens on any mutable root: it writes atomically at the
   * strongest guarantee the root offers, or degrades to plain writes and says so in
   * {@link FileTreeMemoryStore.durability}.
   */
  readonly require?: MemoryDurabilityRequirement;
}

/**
 * What a {@link FileTreeMemoryStore} established about its writes when it opened.
 *
 * @remarks
 * When `atomic` is `true`, every record write either replaces the whole file or leaves the
 * previous one in place: a crash mid-write cannot leave a torn record that would fail the next
 * open. The guarantee is chosen once; a later write that cannot honour it — a scope directory on
 * another mount, say — fails rather than falling back to a plain write.
 *
 * This covers single files only. An operation that touches several files is not atomic as a whole:
 * a versioned put writes the new version and invalidates the previous current version in
 * separate writes, and a cap-cull admission writes one record and deletes others. A crash between
 * them leaves each file whole, and the open-time walk tolerates the mix: current-version
 * selection takes the highest `seq`, so a stale "current" sibling loses, and a cap that a crash
 * left exceeded is culled again by the next admission.
 * @public
 */
export interface IMemoryStoreDurability {
  /** Whether record writes are atomic. */
  readonly atomic: boolean;
  /** The guarantee every record write honours. Present exactly when `atomic` is `true`. */
  readonly guarantee?: FileTree.AtomicWriteGuarantee;
  /** Why, as the root answered it — the qualification on a qualified root, the refusal otherwise. */
  readonly reason: string;
  /**
   * Working files of interrupted atomic writes that the open removed, as paths relative to the
   * root. Usually empty; non-empty means an earlier writer stopped mid-write.
   */
  readonly removedTemporaries: ReadonlyArray<string>;
}
