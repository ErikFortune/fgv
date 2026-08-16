/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result, fail, succeed } from '@fgv/ts-utils';
import { MemoryEmbedOutcome } from '../observe';
import { IEdgeTarget, IMemoryRecord, Kind, MemoryId, MemoryScopeKey } from '../types';
import {
  FragmentEmbedder,
  IEmbeddedFragment,
  IFragmentVectorIndex,
  IVectorIndex,
  MemoryEmbedder
} from '../vector';

/**
 * What a repair-path re-embed established: how many vectors/fragments were
 * written, and — record lane only — the reference the index returned, which is
 * what the store stamps onto the envelope.
 */
export interface IReembedOutcome {
  readonly count: number;
  /** The index-supplied reference. Empty on the fragment lane, which has none. */
  readonly ref: string;
}

/**
 * The internal outcome of record-level embed-on-write: the record to persist,
 * plus — only when the embedder declined a record that already carried an
 * `embeddingRef` — the index entry that reference superseded.
 *
 * `stale` is carried out to the caller rather than acted on in place because the
 * prune belongs on the far side of `_persist`: a persist that fails leaves the
 * PREVIOUS content on disk, and the superseded vector is still an accurate
 * embedding of that content.
 * @internal
 */
export interface IEmbedOnWriteOutcome {
  readonly record: IMemoryRecord<string>;
  readonly stale?: { readonly index: IVectorIndex; readonly target: IEdgeTarget };
  /**
   * What the record-granular index did, surfaced on the write observation.
   * `undefined` when the question does not apply (nothing wired).
   */
  readonly embed?: MemoryEmbedOutcome;
}

/**
 * Project a record the embedder **declined** into its written form: the same
 * record with no `embeddingRef`, plus the vector (if any) that reference
 * superseded, for the caller to prune after the commit.
 *
 * @remarks
 * A decline says "this record is intentionally not embedded". A re-put of a
 * record that *was* embedded (or a caller who supplied an `embeddingRef` — the
 * field is store-derived by contract but nothing strips it) arrives here
 * carrying an inherited reference, so returning it unchanged would persist
 * `embeddingRef` on a record the store just decided not to embed.
 *
 * Clearing the reference alone would be cosmetic and arguably worse: the index
 * entry keyed on this target would survive, so a semantic query would keep
 * returning the record — scored on its **previous** content — while the record
 * itself claimed not to be indexed. So the vector goes too, via
 * `pruneStaleVector` once the write has committed.
 * `stale` is set only when a reference was actually inherited, which keeps the
 * common decline (a record that was never embedded) free of an index round
 * trip.
 *
 * Pure and static: the decision needs nothing from the instance, and deferring
 * the index call to the caller is what lets it run on the far side of
 * `_persist`.
 */
function declineEmbedding(
  built: IMemoryRecord<string>,
  index: IVectorIndex,
  target: IEdgeTarget,
  embed: MemoryEmbedOutcome
): IEmbedOnWriteOutcome {
  if (built.envelope.embeddingRef === undefined) {
    return { record: built, embed };
  }
  // Rest-spread rather than `embeddingRef: undefined`: the envelope is YAML-
  // serialized, and an explicitly-undefined key is a serializer-dependent way
  // to say "absent" where dropping the key is not.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { embeddingRef, ...envelope } = built.envelope;
  return { record: { envelope, body: built.body }, stale: { index, target }, embed };
}

/**
 * What {@link VectorMaintenance} needs from the store it serves. Every field is
 * the store's own, passed in rather than reached for, so this collaborator holds
 * no reference back to the store and cannot quietly grow one.
 * @internal
 */
export interface IVectorMaintenanceParams {
  readonly vectorIndex?: IVectorIndex;
  readonly embed?: MemoryEmbedder;
  readonly fragmentIndex?: IFragmentVectorIndex;
  readonly fragmentEmbedder?: FragmentEmbedder;
  /** The store's swallowed-failure logger; every vector fault is best-effort. */
  readonly warn: (message: string) => void;
  /**
   * The store's per-kind record-index participation predicate
   * (`IMemoryStore.embedsKind`). Passed in rather than re-derived so the store's
   * declaration and the gate that enforces it cannot disagree.
   */
  readonly embedsKind: (kind: Kind) => boolean;
}

/**
 * The store's record- and fragment-vector maintenance, extracted from
 * {@link FileTreeMemoryStore} as a collaborator.
 *
 * @remarks
 * Everything here is **best-effort by contract**: the durable record store is
 * authoritative and both indexes are derived, rebuildable views, so a failed
 * embed, add or remove is logged and the write still succeeds. Nothing in this
 * class can turn a committed write into a `Failure` — which is exactly why it
 * separates cleanly from the store's write path, where every step is fallible
 * and fatal.
 *
 * The split is behavior-preserving: these are the same methods the store used to
 * carry as privates, with the same call order and the same logging. What moved is
 * where they live, not what they do.
 * @internal
 */
export class VectorMaintenance {
  private readonly _vectorIndex: IVectorIndex | undefined;
  private readonly _embed: MemoryEmbedder | undefined;
  private readonly _fragmentIndex: IFragmentVectorIndex | undefined;
  private readonly _fragmentEmbedder: FragmentEmbedder | undefined;
  private readonly _warn: (message: string) => void;
  private readonly _embedsKind: (kind: Kind) => boolean;

  public constructor(params: IVectorMaintenanceParams) {
    this._vectorIndex = params.vectorIndex;
    this._embed = params.embed;
    this._fragmentIndex = params.fragmentIndex;
    this._fragmentEmbedder = params.fragmentEmbedder;
    this._warn = params.warn;
    this._embedsKind = params.embedsKind;
  }

  /**
   * Best-effort removal of everything the two indexes hold for one record. Used
   * by the delete path and by cull-oldest eviction, both of which have already
   * committed by the time they call it.
   */
  public async removeAll(target: IEdgeTarget): Promise<void> {
    await this._removeVectorBestEffort(target);
    await this._removeFragmentsBestEffort(target);
  }

  /**
   * The wired record-vector index, or `undefined`. Read-only, and exposed solely
   * so the store's {@link IMemoryStore.coverage} can report an index-side count
   * without a second copy of the wiring — absent here IS the "lane not wired"
   * answer that coverage reports as `undefined` rather than as zero.
   */
  public get vectorIndex(): IVectorIndex | undefined {
    return this._vectorIndex;
  }

  /** The wired fragment index, or `undefined`. See {@link VectorMaintenance.vectorIndex}. */
  public get fragmentIndex(): IFragmentVectorIndex | undefined {
    return this._fragmentIndex;
  }

  /**
   * The wired record embedder, or `undefined`. Exposed alongside the index
   * because a lane is only usable when BOTH halves are present — an index with
   * no embedder is a legal store whose writes simply do not embed, and a repair
   * has to say so rather than failing every record.
   */
  public get embedder(): MemoryEmbedder | undefined {
    return this._embed;
  }

  /** The wired fragment embedder, or `undefined`. See {@link VectorMaintenance.embedder}. */
  public get fragmentEmbedder(): FragmentEmbedder | undefined {
    return this._fragmentEmbedder;
  }

  /**
   * Re-embed one record into the record-vector index — the repair path.
   *
   * @remarks
   * Distinct from {@link VectorMaintenance.embedOnWrite} in the one way that
   * matters: **this is not best-effort.** Embed-on-write swallows a failure
   * because a vault record is the source of truth and a write must not be
   * rejected over a derived artifact; a repair was *asked for* by a caller who
   * wants to know whether it worked, so a failure is returned.
   *
   * `undefined` means the embedder declined — intentionally not embedded, which
   * is neither a repair nor a fault.
   */
  public async reembedRecord(
    record: IMemoryRecord<unknown>,
    target: IEdgeTarget
  ): Promise<Result<IReembedOutcome | undefined>> {
    if (this._vectorIndex === undefined || this._embed === undefined) {
      return fail('the record-vector lane is not wired');
    }
    const index: IVectorIndex = this._vectorIndex;
    const embedded: Result<Float32Array | undefined> = await this._embed(record);
    if (embedded.isFailure()) {
      return fail(embedded.message);
    }
    if (embedded.value === undefined) {
      return succeed(undefined);
    }
    // `add`'s return value IS the reference the store stamps — synthesizing one
    // here would diverge from the write path for any index whose reference is
    // not the scoped key.
    return (await index.add(target, embedded.value)).onSuccess((ref) => succeed({ count: 1, ref }));
  }

  /**
   * Re-embed one record's fragments — the repair path, returning the fragment
   * count written. See {@link VectorMaintenance.reembedRecord} for why this is
   * not best-effort. An empty fragment array is this lane's decline and reports
   * `undefined`, though the whole-record-replace still runs so stale fragments
   * are cleared.
   */
  public async reembedFragments(
    record: IMemoryRecord<unknown>,
    target: IEdgeTarget
  ): Promise<Result<IReembedOutcome | undefined>> {
    if (this._fragmentIndex === undefined || this._fragmentEmbedder === undefined) {
      return fail('the fragment lane is not wired');
    }
    const index: IFragmentVectorIndex = this._fragmentIndex;
    const embedded: Result<ReadonlyArray<IEmbeddedFragment>> = await this._fragmentEmbedder(record);
    if (embedded.isFailure()) {
      return fail(embedded.message);
    }
    return (await index.addFragments(target, embedded.value)).onSuccess((n) =>
      // The fragment lane has no envelope reference, so `ref` is empty and unused.
      succeed(n === 0 ? undefined : { count: n, ref: '' })
    );
  }

  /**
   * Best-effort embed-on-write. When a vector index AND an embedder are wired,
   * embeds the built record, `add`s the vector (replace semantics handle a same-id
   * re-embed — no explicit remove), and stamps the returned `embeddingRef`. A
   * failure (returned `fail` OR a thrown/rejected hook) is logged and the
   * unembedded record is returned unchanged — the put still persists, and the
   * derived index is reconciled by a later `rebuild`. A pass-through no-op when
   * unwired (byte-identical record).
   *
   * A **decline** is not a failure and is handled differently: see
   * `declineEmbedding`.
   *
   * Always succeeds (`Result` is the chain's shape, never a vector-induced
   * failure).
   */
  public async embedOnWrite(
    built: IMemoryRecord<string>,
    scope: MemoryScopeKey
  ): Promise<Result<IEmbedOnWriteOutcome>> {
    if (this._vectorIndex === undefined || this._embed === undefined) {
      // No outcome: with nothing wired there is no index for the record to be
      // absent from, so reporting one would invent a coverage question the
      // deployment has not asked.
      return succeed({ record: built });
    }
    const vectorIndex: IVectorIndex = this._vectorIndex;
    const embed: MemoryEmbedder = this._embed;
    const target: IEdgeTarget = { scope, id: built.envelope.id };
    // Gate BEFORE the embedder call, which is the whole point: a `MemoryEmbedder`
    // decline still pays the round trip, and on a locally-hosted model that round
    // trip IS the cost. A kind excluded here is never handed to the embedder.
    //
    // An exclusion reaches the same conclusion as a decline — this record is
    // intentionally not embedded — so it takes the same path: an inherited
    // `embeddingRef` is dropped and the vector it named is pruned after the
    // commit. Otherwise narrowing `embedKinds` on an existing vault would leave
    // every previously-embedded record of the excluded kind claiming an
    // embedding the store no longer maintains.
    if (!this._embedsKind(built.envelope.kind)) {
      return succeed(declineEmbedding(built, vectorIndex, target, 'excluded'));
    }
    const embedded: Result<Float32Array | undefined> = await this._tryVectorOp(
      () => embed(built),
      `embedding '${built.envelope.id}'`
    );
    if (embedded.isFailure()) {
      return succeed({ record: built, embed: 'failed' });
    }
    // A deliberate decline (`undefined`) stores the record with no embedding
    // reference. Deliberately NOT logged, unlike the failure path above: a warning
    // per write would make routine policy look like a recurring fault, which is
    // the confusion this return value exists to end. It is still *reported* — as
    // `embed: 'declined'` on the write observation — because saying nothing at all
    // is what left `embeddingRef` absence three-ways ambiguous.
    if (embedded.value === undefined) {
      return succeed(declineEmbedding(built, vectorIndex, target, 'declined'));
    }
    // Hoisted: the `undefined` check above does not narrow across the callback
    // boundary below, and a local keeps the non-null assertion out of the code.
    const vector: Float32Array = embedded.value;
    const added: Result<string> = await this._tryVectorOp(
      () => vectorIndex.add(target, vector),
      `vector add for '${built.envelope.id}'`
    );
    if (added.isFailure()) {
      return succeed({ record: built, embed: 'failed' });
    }
    return succeed({
      record: { envelope: { ...built.envelope, embeddingRef: added.value }, body: built.body },
      embed: 'embedded'
    });
  }

  /**
   * Prune the vector a decline superseded. Best-effort like the rest of the
   * vector path: a failed `remove` is logged and the (already-persisted) record
   * still carries no `embeddingRef`, because the record's own claim about itself
   * should be true even when the derived index is momentarily stale — that is
   * exactly what a later `rebuild` reconciles.
   *
   * The index travels with the target rather than being re-read from the instance
   * so the prune lands on the same index the decline was made against, and so
   * there is no second "is a vector index wired?" check whose false branch cannot
   * be reached.
   */
  public async pruneStaleVector(stale: IEmbedOnWriteOutcome['stale']): Promise<void> {
    if (stale === undefined) {
      return;
    }
    await this._tryVectorOp(
      () => stale.index.remove(stale.target),
      `vector remove for declined '${stale.target.id}'`
    );
  }

  /**
   * Best-effort fragment-embed-on-write. When a fragment index AND a fragment
   * embedder are wired, chunks + embeds the built record and replaces its
   * fragments in the index (`addFragments` is whole-record-replace, so a re-authored
   * document never leaves stale fragments behind — no explicit remove needed). A
   * failure (returned `fail` OR a thrown/rejected hook) is logged and the record is
   * returned unchanged — the put still persists, and the fragment index is a derived
   * view a later `rebuild` reconciles. Unlike `embedOnWrite`
   * it stamps nothing on the record (fragments have no per-record `embeddingRef`
   * analog). A pass-through no-op when unwired (byte-identical record).
   */
  public async embedFragmentsOnWrite(
    built: IMemoryRecord<string>,
    scope: MemoryScopeKey
  ): Promise<Result<IMemoryRecord<string>>> {
    if (this._fragmentIndex === undefined || this._fragmentEmbedder === undefined) {
      return succeed(built);
    }
    const fragmentIndex: IFragmentVectorIndex = this._fragmentIndex;
    const fragmentEmbedder: FragmentEmbedder = this._fragmentEmbedder;
    const target: IEdgeTarget = { scope, id: built.envelope.id };
    const embedded: Result<ReadonlyArray<IEmbeddedFragment>> = await this._tryVectorOp(
      () => fragmentEmbedder(built),
      `fragment embedding '${built.envelope.id}'`
    );
    if (embedded.isFailure()) {
      return succeed(built);
    }
    await this._tryVectorOp(
      () => fragmentIndex.addFragments(target, embedded.value),
      `fragment add for '${built.envelope.id}'`
    );
    return succeed(built);
  }

  /**
   * Best-effort fragment removal. A no-op unless the full fragment lifecycle is
   * wired (both an index AND an embedder), so an unwired store does no fragment
   * work and behaves byte-identically. Failures are logged, never surfaced — a
   * committed delete/eviction must not fail because a derived fragment index could
   * not be pruned.
   */
  private async _removeFragmentsBestEffort(target: IEdgeTarget): Promise<void> {
    if (this._fragmentIndex === undefined || this._fragmentEmbedder === undefined) {
      return;
    }
    const fragmentIndex: IFragmentVectorIndex = this._fragmentIndex;
    await this._tryVectorOp(() => fragmentIndex.remove(target), `fragment removal for '${target.id}'`);
  }

  /**
   * Best-effort vector removal for each evicted record (never fails the put).
   * Every evicted record is in the same `scope` as the incoming write (the
   * cull-oldest cohort is the incoming record's `(scope, kind)` cohort), so that
   * scope qualifies each removal target.
   */
  public async removeEvictedVectors(evicted: ReadonlyArray<MemoryId>, scope: MemoryScopeKey): Promise<void> {
    for (const id of evicted) {
      await this.removeAll({ scope, id });
    }
  }

  /**
   * Run a consumer-supplied vector hook, normalizing a thrown/rejected hook into a
   * `Failure` and logging any failure at `warn`. Best-effort: the caller proceeds
   * regardless, since the index is rebuildable.
   */
  private async _tryVectorOp<T>(op: () => Promise<Result<T>>, label: string): Promise<Result<T>> {
    let result: Result<T>;
    try {
      result = await op();
    } catch (err) {
      result = fail(`${label} threw: ${String(err)}`);
    }
    if (result.isFailure()) {
      this._warn(`memory: ${label} failed (best-effort; derived index left for rebuild): ${result.message}`);
    }
    return result;
  }

  /**
   * Best-effort vector removal. A no-op unless the full vector lifecycle is wired
   * (both an index AND an embedder), so an unwired store does no vector work and
   * behaves byte-identically. Failures are logged, never surfaced — a committed
   * delete/eviction must not fail because a derived index could not be pruned.
   */
  private async _removeVectorBestEffort(target: IEdgeTarget): Promise<void> {
    if (this._vectorIndex === undefined || this._embed === undefined) {
      return;
    }
    const vectorIndex: IVectorIndex = this._vectorIndex;
    await this._tryVectorOp(() => vectorIndex.remove(target), `vector removal for '${target.id}'`);
  }
}
