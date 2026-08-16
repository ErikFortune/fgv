/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import {
  IEdgeTarget,
  IMemoryRecord,
  Kind,
  MemoryId,
  MemoryScopeKey,
  edgeTargetKey,
  embeddingRefOf
} from '../types';
import { IIndexedMemoryEntry } from '../index';
import { ISkippedVectorRecord } from '../vector';
import { DerivedArtifact, ReconcileReport } from './reconcile';
import { IReembedOutcome, VectorMaintenance } from './vectorMaintenance';

/**
 * Everything the vector reconcile branches need, supplied by the store.
 * Package-internal; `IMemoryStore.reconcile` is the published surface.
 */
export interface IReconcileVectorsParams {
  readonly kind: Kind;
  readonly artifact: Exclude<DerivedArtifact, 'rank'>;
  /** The kind's index entries — envelopes only, no bodies read yet. */
  readonly targets: ReadonlyArray<IIndexedMemoryEntry>;
  readonly maintenance: VectorMaintenance;
  readonly embedsKind: (kind: Kind) => boolean;
  /** Materialize one record; `undefined` when it has vanished. */
  readonly resolve: (scope: MemoryScopeKey, id: MemoryId) => Result<IMemoryRecord<unknown> | undefined>;
  /** Write an `embeddingRef` onto a record's envelope; `true` when it changed. */
  readonly stampRef: (scope: MemoryScopeKey, id: MemoryId, ref: string) => Result<boolean>;
}

/**
 * Repair one vector lane for one kind, touching only what is missing.
 *
 * @remarks
 * **The `has` check is what makes this targeted rather than a rebuild.** A record
 * the index already holds costs one membership query and no embedder call, which
 * is the entire difference between repairing a brief outage and re-embedding a
 * vault. It is also the only way to see the record-lane case where the index
 * holds a vector but the envelope lost its `embeddingRef` — that record needs a
 * restamp and no embedder call, and is indistinguishable from a never-embedded
 * one if you only look at the envelope.
 *
 * Per-record failures are collected rather than fatal: a repair that stops at the
 * first bad record leaves the rest of the gap open, which is the opposite of what
 * a caller asked for. A failure to *materialize* is likewise collected — a record
 * that vanished between the walk and the read is a casualty of this call, not a
 * reason to abandon the others.
 */
export async function reconcileVectors(params: IReconcileVectorsParams): Promise<Result<ReconcileReport>> {
  const fragment: boolean = params.artifact === 'fragment-vector';
  const index = fragment ? params.maintenance.fragmentIndex : params.maintenance.vectorIndex;
  // BOTH halves, not just the index: an index wired without an embedder is a
  // legal store (queries work, writes simply do not embed), and reconciling it
  // would otherwise report a cheerful success with every record in `failed`.
  // "Half the lane is wired" is a wiring mistake and says so.
  const embedder = fragment ? params.maintenance.fragmentEmbedder : params.maintenance.embedder;
  if (index === undefined || embedder === undefined) {
    return fail(
      `memory reconcile '${params.kind}' ${params.artifact}: the ${
        fragment ? 'fragment' : 'record-vector'
      } lane is not fully wired (index: ${index === undefined ? 'absent' : 'present'}, embedder: ${
        embedder === undefined ? 'absent' : 'present'
      })`
    );
  }
  if (!fragment && !params.embedsKind(params.kind)) {
    // Not a failure and not a silent no-op: the caller asked to repair a kind the
    // store is deliberately not embedding, and the honest answer names that
    // rather than reporting a healthy zero.
    return fail(
      `memory reconcile '${params.kind}' record-vector: this kind is excluded from the record vector index`
    );
  }

  let repaired: number = 0;
  let restamped: number = 0;
  let declined: number = 0;
  let alreadyIndexed: number = 0;
  let fragments: number = 0;
  const failed: ISkippedVectorRecord[] = [];

  for (const entry of params.targets) {
    const target: IEdgeTarget = { scope: entry.scope, id: entry.envelope.id };
    const held: Result<boolean> = await index.has(target);
    if (held.isFailure()) {
      failed.push({ target, error: `membership check failed: ${held.message}` });
      continue;
    }
    if (held.value) {
      // The record lane can still be inconsistent while the index holds the
      // vector: a reference lost after the vector was committed. Repairing it
      // costs a write and no embedding.
      if (!fragment && embeddingRefOf(entry.envelope) === undefined) {
        // The one place a synthesized reference is unavoidable: `has` proved the
        // vector exists but there is no contract member that returns the
        // reference the index minted for it, and re-deriving one would cost the
        // embedder call this branch exists to avoid. Sound for both shipped
        // indexes, whose reference IS the scoped key; a third-party index that
        // mints something else gets the scoped key stamped here. Recorded in
        // `docs/FUTURE.md` rather than silently assumed.
        const stamped: Result<boolean> = params.stampRef(
          entry.scope,
          entry.envelope.id,
          edgeTargetKey(target)
        );
        if (stamped.isFailure()) {
          failed.push({ target, error: `restamping the embedding reference failed: ${stamped.message}` });
          continue;
        }
        restamped++;
        continue;
      }
      alreadyIndexed++;
      continue;
    }

    const resolved: Result<IMemoryRecord<unknown> | undefined> = params.resolve(
      entry.scope,
      entry.envelope.id
    );
    if (resolved.isFailure()) {
      failed.push({ target, error: `reading the record failed: ${resolved.message}` });
      continue;
    }
    if (resolved.value === undefined) {
      failed.push({ target, error: 'the index claims this record but the vault has no such file' });
      continue;
    }
    const outcome: Result<IReembedOutcome | undefined> = await (fragment
      ? params.maintenance.reembedFragments(resolved.value, target)
      : params.maintenance.reembedRecord(resolved.value, target));
    if (outcome.isFailure()) {
      failed.push({ target, error: outcome.message });
      continue;
    }
    if (outcome.value === undefined) {
      declined++;
      continue;
    }
    if (fragment) {
      fragments += outcome.value.count;
      repaired++;
      continue;
    }
    // The reference the INDEX returned, never a synthesized key: the write path
    // persists `add`'s value, so a third-party index whose reference is not the
    // scoped key would otherwise get one stamp from `put` and a different one here.
    const stamped: Result<boolean> = params.stampRef(entry.scope, entry.envelope.id, outcome.value.ref);
    if (stamped.isFailure()) {
      failed.push({ target, error: `stamping the embedding reference failed: ${stamped.message}` });
      continue;
    }
    repaired++;
  }

  const base = { kind: params.kind, examined: params.targets.length, repaired, failed };
  return succeed(
    fragment
      ? { ...base, artifact: 'fragment-vector', alreadyIndexed, declined, fragments }
      : { ...base, artifact: 'record-vector', alreadyIndexed, restamped, declined }
  );
}
