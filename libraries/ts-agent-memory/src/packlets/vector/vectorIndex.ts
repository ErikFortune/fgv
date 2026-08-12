/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { Result } from '@fgv/ts-utils';
import { IEdgeTarget, IMemoryRecord } from '../types';

/**
 * A half-open `[start, end)` span into a record's body — the in-record locator a
 * {@link IFragmentVectorIndex} may carry on a fragment. `start` is inclusive,
 * `end` exclusive. The unit (character / byte / token offsets) is the consumer's
 * choice: the index stores the two integers opaquely and never interprets them,
 * so they line up with whatever locator the consumer's own read side uses.
 *
 * @remarks
 * **The span is advisory.** It names the region of the body a fragment was
 * *derived from*; it is NOT a slice guaranteed to reproduce the fragment's text.
 * `body.slice(start, end)` round-trips only under a segmenter that merely chooses
 * boundaries. Under a **rewriting** segmenter — one that turns a span into a
 * curated block, an increasingly common ingestion shape when a model both selects
 * and rewrites — the fragment text is not a substring of the body at all, and the
 * fragmentation is not re-derivable from the body. Treat the span as a pointer for
 * locating context, never as an extraction recipe.
 *
 * A fragment whose provenance cannot honestly be expressed as a body span should
 * omit the locator entirely and carry an {@link IEmbeddedFragment.fragmentId}
 * instead.
 * @public
 */
export interface IFragmentLocator {
  /** Inclusive start offset into the record body. */
  readonly start: number;
  /** Exclusive end offset into the record body. */
  readonly end: number;
}

/**
 * A single hit returned by {@link IVectorIndex.query} (or
 * {@link IFragmentVectorIndex.query}): the matched record's scope-qualified
 * {@link IEdgeTarget | address} and the backend's similarity score (higher = more
 * similar; the exact scale is backend-defined). Hits are returned in descending
 * score order.
 *
 * @remarks
 * The address is a `(scope, id)` pair, NOT a bare {@link MemoryId} — per-scope
 * codecs (e.g. the medium-term codec's `turn-<n>` stems) legally mint the same
 * stem under different scopes, so a bare id could not disambiguate two records
 * that share a stem. The caller re-resolves the hit against the record index by
 * the same scoped address.
 *
 * **No single field discriminates a fragment hit from a record-granular hit.** A
 * record hit carries neither `locator` nor `fragmentId`; a fragment hit carries at
 * least one of the two, but not necessarily any particular one — a fragment with a
 * body span but no consumer-minted id, and a fragment with an id but no honest span,
 * are both legal. Testing one field for presence therefore cannot tell you which
 * kind of hit you hold.
 *
 * That "at least one" requirement is enforced on the upsert side by
 * {@link embeddedFragmentConverter} — a different boundary from this type — and is
 * deliberately NOT offered here as a discriminator either. A caller keyed off it
 * would be coupled to an invariant this type does not own, and would fail silently
 * if the invariant were ever relaxed.
 *
 * **The robust rule is that fragment-ness is determined by which index produced the
 * hit**: {@link IFragmentVectorIndex.query} returns fragment hits and
 * {@link IVectorIndex.query} returns record hits. The caller chose the index it
 * queried, so it already knows which kind it is holding.
 *
 * Note in particular that an absent `locator` now carries **two** distinct meanings
 * — a record-granular hit, or a fragment with no honest body span (see
 * {@link IFragmentLocator}) — which is precisely why presence-branching is unsafe.
 * @public
 */
export interface IVectorQueryHit {
  /** The scope-qualified address of the matched record. */
  readonly target: IEdgeTarget;
  /** Backend similarity score; higher is more similar. */
  readonly score: number;
  /**
   * The advisory in-record span the matched fragment was derived from, when the
   * producing fragment carried one. Absent on record-granular hits AND on fragment
   * hits with no honest span — see the remarks above; do not branch on its presence.
   */
  readonly locator?: IFragmentLocator;
  /**
   * The opaque identity the producing fragment was stored with, carried back
   * verbatim. Absent on record-granular hits AND on fragment hits stored without
   * one — see the remarks above; do not branch on its presence.
   */
  readonly fragmentId?: string;
}

/**
 * The vector-index seam an embedding backend implements to make
 * {@link SemanticRetriever | semantic recall} operational.
 *
 * @remarks
 * Vectors cross this seam as `Float32Array` (the in-memory representation an
 * embedding model produces); `number[]` is reserved for the JSON-wire edges
 * (e.g. a provider's embedding response). The in-package brute-force cosine
 * implementation is {@link InMemoryCosineIndex}; a consumer can swap an external
 * ANN backend behind the same seam once N grows beyond the in-memory regime.
 *
 * Every operation returns a `Result` (async, since a real backend does I/O) so
 * failure is explicit and never throws across the seam.
 * @public
 */
export interface IVectorIndex {
  /**
   * Add (or replace) the embedding for the scope-qualified `target`. Returns the
   * opaque {@link IMemoryEnvelope.embeddingRef | embeddingRef} the store stamps
   * onto the envelope so a later read knows the record is embedded. Keying on the
   * `(scope, id)` address (not a bare id) is load-bearing: two records that share
   * a filename stem across scopes must not clobber each other's embedding.
   */
  add(target: IEdgeTarget, vector: Float32Array): Promise<Result<string>>;

  /**
   * Remove the embedding for the scope-qualified `target`. Returns the removed
   * target. Idempotent — removing a target with no embedding still succeeds
   * (returns the target).
   */
  remove(target: IEdgeTarget): Promise<Result<IEdgeTarget>>;

  /**
   * Return the `topK` nearest records to `vector`, in descending score order.
   */
  query(vector: Float32Array, topK: number): Promise<Result<ReadonlyArray<IVectorQueryHit>>>;

  /**
   * The number of vectors currently held.
   *
   * @remarks
   * On the contract because without it a caller cannot distinguish *"the index is
   * empty"* from *"nothing matched"*: {@link IVectorIndex.query} answers an empty
   * index with `succeed([])`, which is indistinguishable from a genuine miss. The
   * only other check available to a caller — "is a vector index wired?" — tests the
   * **wiring**, and that stays true while the index holds nothing.
   *
   * Note the narrow scope: this answers *how many vectors are held*, **not** how
   * many there ought to be. Full coverage — "is every record that should be indexed
   * actually indexed?" — still requires comparing against the record source and
   * {@link IMemoryStore.embedsKind}.
   *
   * Synchronous and non-`Result` because both shipped implementations can answer it
   * without I/O that can fail — the in-memory index reads a `Map`'s size, and the
   * SQLite-backed one a prepared `COUNT` against an open connection it already owns.
   */
  readonly size: number;

  /**
   * Re-embed every record from `source` and rebuild the index from scratch — the
   * **backfill / reconcile** operation.
   *
   * @remarks
   * On the contract because a persisted index is unusable without it. Records
   * written while the index was unwired, a re-embed after a dimension change (where
   * the backend supports one — a `vec0`-backed table's dimension is fixed at
   * creation, so there it needs a drop-and-re-index instead), and reconciliation
   * after a swallowed embed-on-write failure are all unreachable otherwise — and the store's own docstring already promises *"the derived index
   * is reconciled by a later `rebuild`"*, a promise the contract could not keep for
   * any index but the bundled one. A caller moving from the bundled implementation
   * to a persistent one found the swap type-checked everywhere **except** the one
   * place it backfills, which is the place that mattered.
   *
   * See {@link IVectorRebuildReport} for what it reports and
   * {@link IVectorRebuildOptions} for the failure mode.
   */
  rebuild(
    source: IMemoryRecordSource,
    embed: MemoryEmbedder,
    options?: IVectorRebuildOptions
  ): Promise<Result<IVectorRebuildReport>>;
}

/**
 * One embedded fragment of a record: the fragment's vector, plus at least one of the
 * two ways to identify it — its advisory in-record {@link IFragmentLocator | span}
 * and/or an opaque consumer-minted {@link IEmbeddedFragment.fragmentId | fragmentId}.
 * Produced by a {@link FragmentEmbedder} and stored via
 * {@link IFragmentVectorIndex.addFragments}.
 *
 * @remarks
 * Both identity fields are optional **in the type**, but the "at least one"
 * requirement is real — a fragment carrying neither is unidentifiable at the read
 * side. It is enforced by {@link embeddedFragmentConverter} (and re-checked by the
 * in-package index implementations) rather than by a conditional-required union
 * (`{ locator; fragmentId? } | { locator?; fragmentId }`), which was considered and
 * declined: the union costs at every construction site and buys nothing at the read
 * site, where each field reads as `… | undefined` either way.
 * @public
 */
export interface IEmbeddedFragment {
  /**
   * The region of the record body this fragment was derived from, when one can be
   * stated honestly. Advisory — see {@link IFragmentLocator}; it is NOT a slice that
   * reproduces the fragment text. Omit it for a fragment with no honest body span (a
   * rewriting segmenter), in which case `fragmentId` must be supplied.
   */
  readonly locator?: IFragmentLocator;
  /**
   * An opaque, consumer-minted identity for this fragment, carried verbatim through
   * the index and returned on the corresponding {@link IVectorQueryHit}. The index
   * **never parses it, never filters on it, and never assigns meaning to it** — it is
   * a bytestring, not part of the query path. It exists so a fragment stays
   * identifiable when its text is not re-derivable from the record body.
   *
   * The guarantee is "we never parse it", NOT "we keep it stable". Because
   * `addFragments` is whole-record-replace, an updated record re-emits its entire
   * fragment set, so **any stability of a fragment id across re-embeds is the
   * consumer's responsibility**, not the index's.
   */
  readonly fragmentId?: string;
  /** The embedding vector for this fragment. */
  readonly vector: Float32Array;
}

/**
 * The fragment-granular sibling of {@link IVectorIndex}: instead of one vector per
 * record it holds many vectors per record, each tagged with the identity its
 * {@link IEmbeddedFragment} carried, and its `query` returns per-fragment hits
 * carrying that identity back. This is the seam behind sub-document semantic search
 * — the "discovery" half of a search-then-read contract, where a hit tells the
 * consumer which record AND which fragment of it to read.
 *
 * @remarks
 * Deliberately NOT `extends IVectorIndex`: an index holding many vectors per record
 * has no well-defined single-vector `add(target, vector)`. It is a parallel contract
 * with three operations — `addFragments`, `remove`, `query` — reusing
 * {@link IVectorQueryHit}, on which both `locator` and `fragmentId` are optional. A
 * fragment hit populates whichever of the two its stored fragment carried; see
 * {@link IVectorQueryHit} for why that is not a discriminator and why fragment-ness
 * is determined by the index queried, not by field presence. Kept distinct from the
 * record-granular index per the consumer contract: memory recall stays
 * record-granular; sub-document knowledge uses a separate fragment index.
 * @public
 */
export interface IFragmentVectorIndex {
  /**
   * Add (or replace) all fragments for the scope-qualified `target`. Whole-record
   * semantics: every fragment previously held for `target` is dropped and replaced
   * by `fragments`, so a re-authored document never leaves stale fragments behind.
   * Returns the number of fragments now held for the record.
   */
  addFragments(target: IEdgeTarget, fragments: ReadonlyArray<IEmbeddedFragment>): Promise<Result<number>>;

  /**
   * Remove every fragment for the scope-qualified `target`. Returns the removed
   * target. Idempotent — removing a target with no fragments still succeeds.
   */
  remove(target: IEdgeTarget): Promise<Result<IEdgeTarget>>;

  /**
   * Return the `topK` nearest fragments to `vector`, in descending score order,
   * each hit carrying its record `target` plus whichever of `locator` /
   * `fragmentId` the stored fragment was added with. When
   * `maxPerRecord` is supplied, no more than that many fragments of any single
   * record appear in the result — the cap is applied during selection (before the
   * `topK` cut) so one long document cannot crowd out others.
   */
  query(
    vector: Float32Array,
    topK: number,
    maxPerRecord?: number
  ): Promise<Result<ReadonlyArray<IVectorQueryHit>>>;
}

/**
 * How a vector-index rebuild treats a record it cannot index — whether the
 * **embedding** failed or the subsequent **add** did. Both are governed by this
 * one mode; neither is unconditionally fatal.
 *
 * @remarks
 * Deliberately mirrors the store's own open-time `onRecordError` mode, including
 * its default: `'fail'` preserves the historical all-or-nothing contract exactly,
 * and `'skip'` is opt-in. Defined here rather than imported from the store packlet
 * — the `vector` packlet does not depend on `store`, and the two modes describe
 * different domains that merely happen to share a shape.
 *
 * A **decline** (a {@link MemoryEmbedder} resolving `undefined`) is not an error
 * and is unaffected by this mode: it is always **excluded** from the index and
 * counted on {@link IVectorRebuildReport.declined}, **never** appearing in
 * {@link IVectorRebuildReport.skipped}. The word is worth being careful with here:
 * `skipped` is now a formal field meaning *a fault*, and a decline is the opposite.
 * @public
 */
export type VectorRebuildErrorMode = 'skip' | 'fail';

/**
 * A record a rebuild could not index — because the embed failed or because the
 * subsequent add did — retained so a partial rebuild reports what it lost rather
 * than merely how much it kept.
 * @public
 */
export interface ISkippedVectorRecord {
  /** The scope-qualified address of the record that could not be indexed. */
  readonly target: IEdgeTarget;
  /** The failure message, from either the embed or the subsequent add. */
  readonly error: string;
}

/**
 * What a rebuild actually did — the structural answer to "is this index complete?".
 *
 * @remarks
 * A bare count cannot distinguish the three ways a record can be absent from the
 * index, and that distinction is the entire point: **`declined` was intentional,
 * `skipped` was a fault, and neither is the same as "never attempted"**. A caller
 * deriving coverage from a count alone cannot tell an embedder outage from a
 * deliberate policy, which is precisely the confusion this type exists to end.
 * @public
 */
export interface IVectorRebuildReport {
  /** Records embedded and added to the index. */
  readonly indexed: number;
  /** Records the embedder deliberately declined (resolved `undefined`). */
  readonly declined: number;
  /**
   * Records whose embedding or add FAILED and were skipped. Non-empty only under
   * {@link VectorRebuildErrorMode | `onRecordError: 'skip'`} — under `'fail'` the
   * first failure aborts the rebuild and no report is returned at all.
   */
  readonly skipped: ReadonlyArray<ISkippedVectorRecord>;
}

/**
 * Options for a vector-index rebuild.
 * @public
 */
export interface IVectorRebuildOptions {
  /**
   * How to treat a record the rebuild cannot index — an embed failure OR an add
   * failure. Defaults to `'fail'` — the historical behavior, unchanged for every
   * existing caller.
   */
  readonly onRecordError?: VectorRebuildErrorMode;
}

/**
 * Embeds a complete record into a vector for the store's embed-on-write hook.
 * Async and `Result`-returning, since a real embedder does a network call (cloud
 * provider) or in-process model inference. The consumer wires this — the core
 * package never calls an embedding provider directly, staying embedder-agnostic.
 *
 * @remarks
 * Resolving to `undefined` means **"intentionally not embedded"** — a deliberate
 * decline, not an error. The record is stored without an embedding reference, no
 * failure is reported, and **the decline itself logs nothing**. This is distinct
 * from a `Failure`, which means the embedder *tried and could not*.
 *
 * "Logs nothing" is a statement about the decline, not a promise of silence: a
 * decline on a record that was already embedded also prunes the vector that
 * reference named, and if that prune fails it is a genuine fault and warns like
 * any other. What a decline never does is warn merely for having happened.
 *
 * The distinction is load-bearing wherever the two are treated differently. On the
 * rebuild path a declined record is **excluded** from the index and counted on
 * {@link IVectorRebuildReport.declined}; a failed one is a genuine error and, under
 * `onRecordError: 'skip'`, is reported on {@link IVectorRebuildReport.skipped}. Collapsing "I chose not to" into `fail` would
 * make a deliberate policy indistinguishable from an embedder outage in the logs,
 * and would put a routine decision on whatever error path the caller has wired.
 *
 * The embedder receives the whole record, so the usual reason to decline is the
 * record's `kind` — a control or bookkeeping row that no query should ever return.
 *
 * @public
 */
export type MemoryEmbedder = (record: IMemoryRecord<unknown>) => Promise<Result<Float32Array | undefined>>;

/**
 * The fragment-granular sibling of {@link MemoryEmbedder}: chunks a record's body
 * and embeds each chunk, returning one {@link IEmbeddedFragment} per chunk. The
 * chunking policy (window size, overlap) lives entirely in the consumer's embedder
 * — the core stays chunking-agnostic, exactly as it stays embedder-agnostic for
 * the record-granular path. Used by the store's fragment-embed-on-write hook.
 * @public
 */
export type FragmentEmbedder = (
  record: IMemoryRecord<unknown>
) => Promise<Result<ReadonlyArray<IEmbeddedFragment>>>;

/**
 * A record paired with its scope-qualified {@link IEdgeTarget | address}, as
 * yielded by {@link IMemoryRecordSource.list}. The address is required because
 * {@link InMemoryCosineIndex.rebuild} keys each re-embedded entry on the
 * scope-qualified target, not a bare {@link MemoryId} — two records that share a
 * filename stem across scopes must not collide when the whole vault is re-indexed.
 * @public
 */
export interface IScopedMemoryRecord {
  /** The record's scope-qualified `(scope, id)` address. */
  readonly target: IEdgeTarget;
  /** The record itself, passed to the embedder. */
  readonly record: IMemoryRecord<unknown>;
}

/**
 * The minimal record-source surface {@link InMemoryCosineIndex.rebuild} reads to
 * re-embed an entire vault. Each entry carries the record's scope-qualified
 * address (see {@link IScopedMemoryRecord}) so the rebuild keys the vector index
 * exactly as the incremental embed-on-write path does. A consumer backs this with
 * the store's scoped index — the vector packlet does not import the store packlet
 * (which depends on the vector packlet for {@link IVectorIndex}, so the reverse
 * import would be a cycle).
 * @public
 */
export interface IMemoryRecordSource {
  /** List every record in the vault, each paired with its scoped address. */
  list(): Promise<Result<ReadonlyArray<IScopedMemoryRecord>>>;
}
