/*
 * Copyright (c) 2026 Erik Fortune
 * SPDX-License-Identifier: MIT
 */

import { DetailedResult, Result } from '@fgv/ts-utils';
import { IEdgeTarget, IMemoryRecord, Kind, MemoryId, MemoryScopeKey } from '../types';

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
   * Whether this index holds a vector for the scope-qualified `target`.
   *
   * @remarks
   * On the contract because it is what makes a **targeted** repair possible, and
   * the reason is sharper than convenience: the only other way to ask *"is this
   * record indexed?"* is {@link IMemoryEnvelope.embeddingRef} — and that field is
   * the store's **belief**, which is wrong in precisely the situation a repair
   * runs in. A reopened vault backed by a fresh in-memory index carries an
   * `embeddingRef` on every record while holding no vectors at all. **A repair
   * that trusts the field it is repairing is not a repair.**
   *
   * It also makes a case *detectable* that an `embeddingRef`-only check cannot
   * see at all: the index holds the vector but the envelope lost its reference
   * (a failure swallowed after the vector was committed). That record needs its
   * reference restamped and **no embedder call**, which is only knowable by
   * asking the index.
   *
   * `Promise<Result<boolean>>`, unlike the synchronous {@link IVectorIndex.size},
   * because the two are not the same kind of accessor and should not be made to
   * look alike: `size` is a count both shipped implementations hold or can read
   * without a failure mode, while `has` on a durable backend is a keyed query
   * that can fail. Idempotent and side-effect-free; an absent target is
   * `succeed(false)`, never a failure.
   */
  has(target: IEdgeTarget): Promise<Result<boolean>>;

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
   *
   * **A failure carries the report too, on the `detail`** — coverage is most
   * wanted exactly when a rebuild did not complete, and withholding it there made
   * the answer depend on the error-handling mode rather than on the question. The
   * `'fail'` contract itself is unchanged: it still resets, still aborts, still
   * returns a failure. It simply also says what it had established before it
   * stopped. See {@link IVectorRebuildReport} for how to read a report that
   * arrived on a failure — it describes the attempt, not the surviving index.
   *
   * On success the report is the **value** — that is where it belongs, and the
   * `detail` is not also populated. A failure carries no report when nothing was
   * attempted: always a `source.list()` failure, and additionally whatever
   * pre-loop step an implementation needs before it can start (the durable
   * `SqliteVecVectorIndex` must clear its table, and a failure to do so is such a
   * case). Those leave the existing index untouched, so an all-zero report would
   * describe an index the call never disturbed.
   *
   * **A rebuild does NOT re-establish the vector dimension on a persistent
   * index, and this is the one place the two shipped implementations genuinely
   * differ.** The in-memory indexes forget their dimension when they reset, so a
   * rebuild with a different-dimension embedder simply re-establishes it. A
   * `vec0`-backed index cannot: its reset is a `DELETE FROM`, the table's
   * declared dimension is part of its schema, and `vec0` has no `ALTER TABLE`.
   * So a rebuild that changes dimension **succeeds in memory and fails on
   * SQLite**, where it needs the same drop-and-re-index the package README
   * prescribes for any schema change (drop the table, or point the index at a
   * fresh `tableName`). Only embedding time is at risk — vectors are derived and
   * the vault records remain authoritative.
   */
  rebuild(
    source: IMemoryRecordSource,
    embed: MemoryEmbedder,
    options?: IVectorRebuildOptions
  ): Promise<DetailedResult<IVectorRebuildReport, IVectorRebuildReport>>;
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
 * Selection-time narrowing for {@link IFragmentVectorIndex.query}. Every member is
 * applied **before** the `topK` cut.
 *
 * @remarks
 * `scope` (optionally with `id`) is the record narrowing. It is expressed as a
 * storage address rather than as a consumer-facing `(kind, entityId)` because that
 * is what the index is keyed by; resolving one to the other is
 * `IIdentityResolver.resolveIdentity`'s job, and doing it above the index keeps the
 * index dealing only in the keys it actually holds.
 *
 * **`scope` alone is not a coarser accident — it is what a versioned kind needs.**
 * `TemporalIdentityCodec` files every version of an entity in its own per-entity
 * subtree, so for a versioned kind the entity's subtree *is* the narrowing and
 * `{ scope }` means "every version of this entity". A non-versioned kind resolves to
 * a single record and supplies `{ scope, id }`. That is why fragment search needs no
 * `asOf` axis and neither index needs a version special case.
 * @public
 */
export interface IFragmentQueryOptions {
  /**
   * Maximum number of fragments any single record may contribute. Omit for
   * uncapped. With a single-record narrowing (`scope` + `id`) this caps the one
   * record's contribution, which is a second cap on the same axis rather than a
   * cross-record fairness knob — usually you want one or the other, not both.
   */
  readonly maxPerRecord?: number;

  /**
   * Restrict the search to fragments of records in this scope. Omit to search every
   * record.
   */
  readonly scope?: MemoryScopeKey;

  /**
   * With {@link IFragmentQueryOptions.scope}, restrict further to the single record
   * at `(scope, id)`. Ignored — and meaningless — without `scope`, since a bare `id`
   * does not address a record.
   */
  readonly id?: MemoryId;
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
   * `fragmentId` the stored fragment was added with.
   *
   * @remarks
   * **Every member of `options` is applied during selection, before the `topK`
   * cut.** That ordering is the contract, not an implementation detail: a narrowing
   * applied afterwards would mean the caller's `topK` is not the `topK` that reached
   * the index, so a scoped search would be exact only when a global over-fetch
   * happened to be generous enough. See {@link IFragmentQueryOptions}.
   */
  query(
    vector: Float32Array,
    topK: number,
    options?: IFragmentQueryOptions
  ): Promise<Result<ReadonlyArray<IVectorQueryHit>>>;

  /**
   * Whether this index holds **any** fragment for the scope-qualified `target`.
   *
   * @remarks
   * The record-granular rationale on {@link IVectorIndex.has} applies verbatim —
   * a repair that trusts `embeddingRef` is not a repair. Note the granularity
   * this deliberately does **not** offer: it answers *"is this record
   * represented?"*, not *"is this particular fragment present?"*. Fragment
   * writes are whole-record-replace, so a record is either represented by the
   * current fragment set or not represented at all; a per-fragment membership
   * check would imply an incremental write path that does not exist.
   */
  has(target: IEdgeTarget): Promise<Result<boolean>>;

  /**
   * The number of **records** with at least one fragment held.
   *
   * @remarks
   * Deliberately **not** named `size`, unlike {@link IVectorIndex.size}. This
   * index is one-to-many, so `size` has two defensible readings and a reader
   * arriving from the record-granular sibling — where `size` counts vectors —
   * would take the wrong one silently. Two explicitly-named counts cost one extra
   * member and cannot be misread.
   */
  readonly recordCount: number;

  /**
   * The total number of **fragments** held across all records.
   *
   * @remarks
   * The fan-out, and the number a caller actually watches: fragments-per-record
   * is what makes a fragment reconcile expensive, and neither `recordCount` nor a
   * record-granular count answers it.
   */
  readonly fragmentCount: number;

  /**
   * Re-embed every record from `source` and rebuild the fragment index from
   * scratch — the **backfill / reconcile** operation, sibling to
   * {@link IVectorIndex.rebuild}.
   *
   * @remarks
   * On the contract for exactly the reasons its record-granular sibling is, and
   * the fragment lane was worse off: `rebuild` existed only on the bundled
   * in-memory class, and the durable `SqliteVecFragmentIndex` had **no backfill
   * at all**, so a persistent fragment index could not be reconciled by any
   * route — contractual or concrete. Records written while it was unwired, a
   * re-embed after a segmenter change, and reconciliation after a swallowed
   * fragment-embed failure were all unreachable.
   *
   * Semantics are kept observably identical to the record-granular sibling so a
   * caller who has learned one has learned both: a `source.list()` failure is
   * fatal and carries no detail (nothing was attempted, and the existing index is
   * untouched); a genuine rebuild then resets first; `onRecordError` defaults to
   * `'fail'`; and a failure carries whatever the attempt had established on the
   * `detail`.
   *
   * **A rebuild does NOT re-establish the vector dimension on a persistent
   * index, and this is the one place the two shipped implementations genuinely
   * differ.** The in-memory indexes forget their dimension when they reset, so a
   * rebuild with a different-dimension embedder simply re-establishes it. A
   * `vec0`-backed index cannot: its reset is a `DELETE FROM`, the table's
   * declared dimension is part of its schema, and `vec0` has no `ALTER TABLE`.
   * So a rebuild that changes dimension **succeeds in memory and fails on
   * SQLite**, where it needs the same drop-and-re-index the package README
   * prescribes for any schema change (drop the table, or point the index at a
   * fresh `tableName`). Only embedding time is at risk — vectors are derived and
   * the vault records remain authoritative.
   */
  rebuild(
    source: IMemoryRecordSource,
    embed: FragmentEmbedder,
    options?: IVectorRebuildOptions
  ): Promise<DetailedResult<IFragmentVectorRebuildReport, IFragmentVectorRebuildReport>>;
}

/**
 * What an {@link IFragmentVectorIndex.rebuild} established, resolved by
 * {@link Kind} — the fragment-granular sibling of {@link IVectorRebuildReport}.
 *
 * @remarks
 * The rule stated on {@link IVectorRebuildReport} applies here verbatim and is
 * not re-opened: **every count is resolved by kind unless there is a stated
 * reason it cannot be**, `excluded` is optional because only the source can know
 * it, and the report is carried on a failure as well as a success.
 *
 * The one member with no record-granular analogue is
 * {@link IFragmentVectorRebuildReport.fragments | fragments} — the fan-out. It is
 * the number that distinguishes this lane: `indexed: 40` says forty records are
 * represented and says nothing about whether that cost forty embedding round
 * trips or four thousand, which is the difference between a reconcile that
 * finishes in a second and one that blocks a request past thirty.
 *
 * A **declined** record is one whose {@link FragmentEmbedder} returned an empty
 * array — the fragment lane's way of saying *intentionally not embedded*. Note
 * this is a different mechanism from a {@link MemoryEmbedder} decline: an empty
 * array still performs a real whole-record-replace (which is what clears any
 * stale fragments), where a record-granular decline skips the index entirely.
 * @public
 */
export interface IFragmentVectorRebuildReport {
  /** Records that ended with at least one fragment held, per kind. */
  readonly indexed: ReadonlyMap<Kind, number>;
  /** Fragments held, per kind — the fan-out `indexed` cannot express. */
  readonly fragments: ReadonlyMap<Kind, number>;
  /** Records whose embedder intentionally produced no fragments, per kind. */
  readonly declined: ReadonlyMap<Kind, number>;
  /**
   * Records the source filtered out before the rebuild saw them, per kind.
   * `undefined` means *this source does not report exclusions*; an empty map
   * means *it does, and excluded nothing*.
   */
  readonly excluded?: ReadonlyMap<Kind, number>;
  /** Records that failed, per record, with the error — a fault, never a decline. */
  readonly skipped: ReadonlyArray<ISkippedVectorRecord>;
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
 * A bare count cannot distinguish the ways a record can be absent from the index,
 * and that distinction is the entire point: **`declined` was intentional,
 * `excluded` was never offered, `skipped` was a fault, and none of them is the
 * same as "never attempted"**. A caller deriving coverage from a count alone
 * cannot tell an embedder outage from a deliberate policy, which is precisely the
 * confusion this type exists to end.
 *
 * **Every count in this report is resolved by kind.** A coverage report exists to
 * answer *"is my coverage what I intended?"*, and a bare total cannot:
 * `indexed: 500` reads identically whether the right kinds were indexed or a
 * policy drift silently redirected coverage, and the same is true of every other
 * count here. Totals are derivable by summing; the per-kind breakdown is not
 * derivable from anything else — {@link IVectorQueryHit} carries no `kind`,
 * {@link IVectorIndex.query} answers "what is near this" rather than "what is in
 * here", and {@link IVectorIndex.size} is a scalar, so the index cannot be
 * interrogated after the fact for any of them. **A new count added to this report
 * is resolved by kind unless there is a stated reason it cannot be.**
 *
 * `indexed` is the count most tempting to leave bare and the most dangerous to,
 * because it is the number a coverage surface actually renders: 500 bookkeeping
 * rows and zero knowledge rows is a healthy-looking number for a catastrophically
 * broken index.
 *
 * **Reading a report that arrived on a failure.** Under
 * {@link VectorRebuildErrorMode | `onRecordError: 'fail'`} the report is handed
 * back on the failure's `detail` — *after* the rollback has already run. It
 * describes the attempt, not the surviving index: `indexed` names what had been
 * established when the rebuild stopped, and the index itself now holds nothing. It
 * is a diagnostic ("we were 340 knowledge rows in when the embedder died"), not a
 * coverage statement. Only a report from a **successful** rebuild describes what
 * the index holds.
 * @public
 */
export interface IVectorRebuildReport {
  /**
   * Records embedded and added to the index, counted by {@link Kind}.
   *
   * @remarks
   * A count of successful `add` calls, so it lines up with its per-record
   * siblings and the buckets sum back to the listing. It is deliberately **not**
   * read back off {@link IVectorIndex.size} at the end, which no implementation
   * could resolve by kind anyway. The trade that makes: a `source` that lists the
   * same `(scope, id)` twice contributes twice here while the index holds one
   * vector, where a size read would have self-corrected. A source that does that
   * is malformed, and a total that silently disagreed with the per-kind
   * breakdown would be the worse failure.
   */
  readonly indexed: ReadonlyMap<Kind, number>;
  /**
   * Records the embedder deliberately declined (resolved `undefined`), counted by
   * {@link Kind}. The embedder was called and answered — contrast `excluded`,
   * where it never was.
   */
  readonly declined: ReadonlyMap<Kind, number>;
  /**
   * Records the `source` filtered out before the rebuild ever saw them, counted by
   * {@link Kind} — for a store-backed source, the kinds outside
   * {@link IMemoryStore.embedsKind | embedsKind}.
   *
   * **Optional, and the optionality is semantic rather than cosmetic**: it is the
   * one count a rebuild genuinely cannot know for itself, because the decision is
   * made upstream in the source. `undefined` means *this source does not report
   * exclusions* — distinct from an empty map, which means *this source reports
   * them and excluded nothing*. `indexed` and `declined` are knowable by
   * construction (the rebuild either added the vector or the embedder answered)
   * and so are never optional.
   */
  readonly excluded?: ReadonlyMap<Kind, number>;
  /**
   * Records whose embedding or add FAILED and were skipped. Non-empty only under
   * {@link VectorRebuildErrorMode | `onRecordError: 'skip'`} — under `'fail'` the
   * first failure aborts the rebuild, so a `'fail'` report names the casualty in
   * its failure message rather than here.
   *
   * Per-record and carrying the error, so it already implies the per-kind
   * breakdown the counts above spell out; that is the stated reason this one field
   * is not a `ReadonlyMap<Kind, number>`.
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
 * What a {@link IMemoryRecordSource.list} call yields: the records the rebuild
 * should embed, plus — when the source can say — what it filtered out on the way.
 *
 * @remarks
 * The exclusion count originates here because **this is the layer where the
 * decision is made**. A rebuild never sees an excluded record, so it cannot count
 * one; a report assembled without this would silently undercount coverage, and
 * undercount in the direction of looking healthier.
 *
 * A store accessor answering "how many are excluded right now" was considered and
 * declined: it answers a *different question* than the report does — "excluded
 * right now" versus "excluded in this reconcile" — and the two legitimately differ
 * whenever records are written between reconciles. Two correct-and-unequal numbers
 * are worse than one absent number: they invite treating a real difference as a
 * bug, or picking whichever supports the conclusion already held.
 * @public
 */
export interface IMemoryRecordListing {
  /** Every record the rebuild should embed, each paired with its scoped address. */
  readonly records: ReadonlyArray<IScopedMemoryRecord>;
  /**
   * Records this source filtered out, counted by {@link Kind}. Omit it entirely if
   * the source does not track exclusions — that reads as *"cannot say"* on
   * {@link IVectorRebuildReport.excluded}, which is distinct from an empty map
   * (*"nothing was excluded"*).
   */
  readonly excluded?: ReadonlyMap<Kind, number>;
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
  /**
   * List every record the rebuild should embed, each paired with its scoped
   * address, plus the exclusions this source applied if it tracks them. See
   * {@link IMemoryRecordListing}.
   */
  list(): Promise<Result<IMemoryRecordListing>>;
}
